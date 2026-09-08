// Read-only integration check against DATABASE_URL using the Workers runtime.
// Run with: pnpm test:db-worker
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const root = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
const requireWrangler = createRequire(require.resolve('wrangler/package.json'));
const { Miniflare, Log, LogLevel, convertV4MiniflareOptions } = requireWrangler('miniflare');
const { build } = requireWrangler('esbuild');
config({ path: path.join(root, '.env.local'), quiet: true });
config({ path: path.join(root, '.env'), quiet: true });

async function main() {
  assert.ok(process.env.DATABASE_URL, 'Set DATABASE_URL before running this check.');
  const result = await build({
    stdin: {
      contents: `
        import { db } from './db/index.ts';
        import { sql } from 'drizzle-orm';
        export default {
          async fetch(request) {
            try {
              const mode = new URL(request.url).pathname;
              if (mode === '/transaction') {
                const value = await db.transaction(async (tx) => {
                  const first = await tx.execute(sql\`select 1 as ok\`);
                  const second = await tx.transaction((nested) => nested.execute(sql\`select 2 as ok\`));
                  return first.rows[0].ok + second.rows[0].ok;
                }, { accessMode: 'read only' });
                return Response.json({ value });
              }
              if (mode === '/rollback') {
                const expected = new Error('rollback check');
                try {
                  await db.transaction(async (tx) => {
                    await tx.execute(sql\`select 1\`);
                    throw expected;
                  }, { accessMode: 'read only' });
                } catch (error) {
                  if (error !== expected) throw error;
                  return Response.json({ rolledBack: true });
                }
                throw new Error('Transaction did not reject');
              }
              const values = await Promise.all([
                db.execute(sql\`select 1 as ok\`),
                db.execute(sql\`select 2 as ok\`),
              ]);
              return Response.json({ value: values[0].rows[0].ok + values[1].rows[0].ok });
            } catch (error) {
              return Response.json({ error: error.cause?.message ?? error.message }, { status: 500 });
            }
          }
        };
      `,
      resolveDir: root,
      sourcefile: 'db-worker-check.ts',
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    conditions: ['workerd'],
    external: ['node:*'],
    banner: { js: 'import { createRequire } from "node:module"; const require = createRequire("/worker.js");' },
    // Keep the bundled credential in memory; never write this build to disk.
    define: {
      'process.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL),
      'process.env.NODE_ENV': '"production"',
    },
  });
  const runtime = new Miniflare(convertV4MiniflareOptions({
    workers: [{
      name: 'database-regression-check',
      modules: true,
      script: result.outputFiles[0].text,
      compatibilityDate: '2026-09-06',
      compatibilityFlags: ['nodejs_compat'],
    }],
    log: new Log(LogLevel.NONE),
  }));
  try {
    for (let round = 1; round <= 3; round++) {
      for (const route of ['/', '/transaction', '/rollback']) {
        const response = await runtime.dispatchFetch(`http://localhost${route}`);
        assert.equal(response.status, 200, `Round ${round} ${route}: ${await response.clone().text()}`);
        assert.deepEqual(await response.json(), route === '/rollback' ? { rolledBack: true } : { value: 3 });
        console.log(`PASS round ${round}: ${route}`);
      }
    }
    await Promise.all(Array.from({ length: 4 }, async (_, index) => {
      const route = index % 2 ? '/transaction' : '/';
      const response = await runtime.dispatchFetch(`http://localhost${route}`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { value: 3 });
    }));
    console.log('PASS concurrent requests: queries and transactions');
  } finally {
    await runtime.dispose();
  }
}

main().catch((error) => {
  console.error(String(error.message).replaceAll(process.env.DATABASE_URL ?? '\0', '<REDACTED>'));
  process.exitCode = 1;
});
