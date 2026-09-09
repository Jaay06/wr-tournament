import assert from 'node:assert/strict';
import test from 'node:test';
import { createDraftPoller } from './draft-poll-client';
import type { DraftBoardData } from './tournament-types';

function harness(fetcher: typeof fetch) {
  let visible = true;
  let onVisible = () => {};
  const tasks = new Map<number, () => void>();
  let nextId = 0;
  const boards: Array<DraftBoardData | null> = [];
  const poller = createDraftPoller({
    fetcher, onBoard: (board) => boards.push(board),
    isVisible: () => visible,
    subscribe: (callback) => { onVisible = callback; return () => { onVisible = () => {}; }; },
    schedule: ((callback: () => void) => {
      tasks.set(++nextId, callback); return nextId;
    }) as unknown as typeof setTimeout,
    cancel: ((id: number) => { tasks.delete(id); }) as unknown as typeof clearTimeout,
  });
  const stop = poller.start();
  return { poller, stop, boards, tasks,
    visibility(value: boolean) { visible = value; onVisible(); },
    async tick() {
      const [id, callback] = [...tasks.entries()][0];
      tasks.delete(id);
      await callback();
    },
  };
}

test('unchanged polls send the revision and do not update React state', async () => {
  const headers: Headers[] = [];
  const h = harness(async (_url, init) => {
    headers.push(new Headers(init?.headers));
    return headers.length === 1
      ? Response.json({ id: 'draft', version: 1 }, { headers: { ETag: '"v1"' } })
      : new Response(null, { status: 304 });
  });
  await h.tick();
  await h.tick();
  assert.equal(headers[1].get('If-None-Match'), '"v1"');
  assert.equal(h.boards.length, 1);
  h.stop();
});

test('visibility events share an in-flight poll and hidden tabs schedule nothing', async () => {
  let calls = 0;
  let resolve!: (response: Response) => void;
  const h = harness(async () => { calls += 1; return new Promise(r => { resolve = r; }); });
  const pending = h.tick();
  h.visibility(true);
  h.visibility(true);
  assert.equal(calls, 1);
  h.visibility(false);
  resolve(Response.json({ id: 'draft', version: 1 }));
  await pending;
  assert.equal(h.tasks.size, 0);
  h.stop();
});

test('an action supersedes an older poll and ignores its late result', async () => {
  const pending: Array<{ resolve: (r: Response) => void; signal: AbortSignal | null | undefined }> = [];
  const h = harness(async (_url, init) => new Promise(resolve => pending.push({ resolve, signal: init?.signal })));
  const old = h.tick();
  const fresh = h.poller.refresh();
  assert.equal(pending[0].signal?.aborted, true);
  pending[1].resolve(Response.json({ id: 'draft', version: 2 }));
  await fresh;
  pending[0].resolve(Response.json({ id: 'draft', version: 1 }));
  await old;
  assert.deepEqual(h.boards.map(board => board?.version), [2]);
  h.stop();
});

test('revoked access clears private data and stops background requests', async () => {
  const h = harness(async () => new Response(null, { status: 403 }));
  await h.tick();
  assert.deepEqual(h.boards, [null]);
  assert.equal(h.tasks.size, 0);
  h.visibility(true);
  assert.equal(h.tasks.size, 0);
  h.stop();
});
