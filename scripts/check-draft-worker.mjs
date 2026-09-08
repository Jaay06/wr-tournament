// Authenticated rendering check against wr-test, with no draft session started.
// Build first: pnpm exec opennextjs-cloudflare build
// Bundle: pnpm exec wrangler deploy --dry-run --outdir /tmp/riftclash-worker-check
// Check: pnpm test:draft-worker /tmp/riftclash-worker-check
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { encode } from 'next-auth/jwt';

const require = createRequire(import.meta.url);
const requireWrangler = createRequire(require.resolve('wrangler/package.json'));
const { Miniflare, Log, LogLevel, convertV4MiniflareOptions } = requireWrangler('miniflare');
config({ path: '.env.local', quiet: true });

async function main() {
  assert.ok(process.argv[2], 'Pass the directory produced by wrangler deploy --dry-run --outdir.');
  assert.ok(process.env.DATABASE_URL, 'Set DATABASE_URL.');
  assert.equal(new URL(process.env.DATABASE_URL).pathname, '/wr-test', 'Use wr-test only.');
  const sql = neon(process.env.DATABASE_URL);
  const sessions = await sql`select id from draft_sessions limit 1`;
  assert.equal(sessions.length, 0, 'This check requires an empty draft history to avoid auto-picks.');
  const [organizer] = await sql`select u.id from users u
    join tournament_participants p on p.user_id = u.id
    where u.role = 'organizer' and u.deleted_at is null limit 1`;
  assert.ok(organizer, 'An organizer participant is required.');
  const [team] = await sql`select t.name from teams t
    join team_members m on m.team_id = t.id
    join player_registrations r on r.id = m.registration_id
    where t.status = 'draft' and m.is_captain and r.approved_tier is not null
      and (select count(*) from team_members where team_id = t.id) = 1
    order by t.name limit 1`;
  assert.ok(team, 'An approved captain-only team is required.');

  // These sessions authenticate only the in-memory Worker. They are never
  // sent to a deployed app and do not use its authentication secret.
  const secret = 'local-draft-regression-only';
  const cookieNames = ['__Secure-authjs.session-token', 'authjs.session-token'];
  const cookies = await Promise.all(cookieNames.map(async (salt) =>
    `${salt}=${await encode({ token: { sub: organizer.id }, secret, salt })}`));
  const root = path.resolve(process.argv[2]);
  const modules = await Promise.all((await fs.readdir(root))
    .filter((name) => /\.(js|wasm|bin)$/.test(name))
    .map(async (name) => ({
      type: name.endsWith('.js') ? 'ESModule' : name.endsWith('.wasm') ? 'CompiledWasm' : 'Data',
      path: path.join(root, name),
      contents: await fs.readFile(path.join(root, name)),
    })));
  assert.ok(modules.some((module) => module.path === path.join(root, 'worker.js')));
  // This wrapper exists only in the test runtime. Capture error messages
  // without dumping driver objects, which can contain database credentials.
  modules.unshift({
    type: 'ESModule',
    path: path.join(root, 'check-entry.js'),
    contents: `
      import worker from './worker.js';
      export * from './worker.js';
      const errors = [];
      console.error = (...args) => errors.push(args.map(arg =>
        typeof arg === 'string' ? arg : arg?.message ?? '[object omitted]').join(' '));
      export default {
        fetch(request, env, context) {
          if (new URL(request.url).pathname === '/__draft_check_errors') {
            return Response.json({ errors });
          }
          return worker.fetch(request, env, context);
        }
      };
    `,
  });
  const runtime = new Miniflare(convertV4MiniflareOptions({
    workers: [{
      name: 'draft-render-regression', modules, modulesRoot: root,
      compatibilityDate: '2026-09-06', compatibilityFlags: ['nodejs_compat'],
      bindings: { DATABASE_URL: process.env.DATABASE_URL, AUTH_SECRET: secret, AUTH_TRUST_HOST: 'true' },
      serviceBindings: { ASSETS: async () => new Response('Not found', { status: 404 }) },
    }],
    log: new Log(LogLevel.ERROR),
  }));
  const origin = 'https://riftclash.jaay.workers.dev';
  try {
    for (const route of ['/admin', '/admin/draft', '/admin/draft']) {
      const response = await runtime.dispatchFetch(`${origin}${route}`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(20_000),
        headers: { host: 'riftclash.jaay.workers.dev', 'x-forwarded-proto': 'https', cookie: cookies.join('; ') },
      });
      const html = await response.text();
      assert.equal(response.status, 200, `${route} must render, not redirect to sign-in.`);
      assert.ok(html.length > 0, `${route} returned an empty response.`);
      assert.ok(!html.includes('Sign in | Rift Clash'), 'The test session must be authenticated.');
      if (route === '/admin/draft') {
        assert.ok(html.includes(JSON.stringify(team.name).slice(1, -1)), 'The draft setup team must reach the rendered response.');
      }
      const diagnostics = await runtime.dispatchFetch(`${origin}/__draft_check_errors`);
      const { errors } = await diagnostics.json();
      assert.deepEqual(errors, [], 'The Worker must not report uncaught connection errors.');
      console.log(`PASS authenticated ${route}: complete response, no Worker errors`);
    }
  } finally {
    await runtime.dispose();
  }
}

main().catch((error) => {
  console.error(String(error.message).replaceAll(process.env.DATABASE_URL ?? '\0', '<REDACTED>'));
  process.exitCode = 1;
});
