import type { DraftBoardData } from './tournament-types';

type Options = {
  onBoard: (board: DraftBoardData | null) => void;
  fetcher?: typeof fetch;
  isVisible: () => boolean;
  subscribe: (onVisible: () => void) => () => void;
  schedule?: typeof setTimeout;
  cancel?: typeof clearTimeout;
};

// A single request at a time. Explicit actions supersede an older poll, while
// visibility changes and interval ticks share any request already in flight.
export function createDraftPoller(options: Options) {
  const fetcher = options.fetcher ?? fetch;
  const schedule = options.schedule ?? setTimeout;
  const cancel = options.cancel ?? clearTimeout;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let active: { controller: AbortController; promise: Promise<void> } | null = null;
  let etag: string | null = null;
  let stopped = true;
  let generation = 0;
  let failures = 0;

  function refresh(force = false): Promise<void> {
    if (stopped) return Promise.resolve();
    if (active && !force) return active.promise;
    if (force) {
      etag = null;
      active?.controller.abort();
    }
    const controller = new AbortController();
    const promise = (async () => {
      try {
        const response = await fetcher('/api/tournament/draft', {
          cache: 'no-store', signal: controller.signal,
          headers: { Accept: 'application/json', ...(etag ? { 'If-None-Match': etag } : {}) },
        });
        if (controller.signal.aborted) return;
        if (response.status === 304) { failures = 0; return; }
        if ([401, 403, 404].includes(response.status)) {
          etag = null;
          options.onBoard(null);
          if (response.status !== 404) {
            stopped = true;
            cancel(timer);
          }
          failures = 0;
          return;
        }
        if (!response.ok) throw new Error('Draft refresh failed');
        const board = await response.json() as DraftBoardData;
        if (controller.signal.aborted) return;
        etag = response.headers.get('etag');
        failures = 0;
        options.onBoard(board);
      } catch {
        if (!controller.signal.aborted) failures += 1;
      } finally {
        if (active?.controller === controller) active = null;
      }
    })();
    active = { controller, promise };
    return promise;
  }

  function scheduleNext() {
    cancel(timer);
    if (!stopped && options.isVisible()) {
      timer = schedule(tick, Math.min(60_000, 5_000 * 2 ** Math.min(failures, 4)));
    }
  }

  async function tick() {
    const currentGeneration = generation;
    if (!stopped && options.isVisible()) await refresh();
    if (currentGeneration === generation) scheduleNext();
  }

  return {
    refresh: () => refresh(true),
    start() {
      stopped = false;
      generation += 1;
      const unsubscribe = options.subscribe(() => {
        cancel(timer);
        if (options.isVisible()) void tick();
      });
      scheduleNext();
      return () => {
        stopped = true;
        generation += 1;
        cancel(timer);
        active?.controller.abort();
        active = null;
        unsubscribe();
      };
    },
  };
}
