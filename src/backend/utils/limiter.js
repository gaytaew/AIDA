/**
 * Simple async limiter (concurrency + minimum spacing between starts).
 *
 * Why:
 * - Gemini image models are sensitive to bursts and parallelism → 503/500.
 * - This limiter lets us serialize or throttle requests without adding deps.
 */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {Object} options
 * @param {number} options.concurrency - max parallel tasks (default 1)
 * @param {number} options.minTimeMs - minimum delay between task starts (default 0)
 */
export function createLimiter(options = {}) {
  const concurrency = Math.max(1, Number.parseInt(options.concurrency || 1, 10) || 1);
  const minTimeMs = Math.max(0, Number.parseInt(options.minTimeMs || 0, 10) || 0);

  let active = 0;
  let lastStartAt = 0;
  const queue = [];

  async function runNext() {
    if (active >= concurrency) return;
    const item = queue.shift();
    if (!item) return;

    active++;
    try {
      if (minTimeMs > 0) {
        const now = Date.now();
        const wait = Math.max(0, minTimeMs - (now - lastStartAt));
        if (wait > 0) await sleep(wait);
      }
      lastStartAt = Date.now();
      const res = await item.fn();
      item.resolve(res);
    } catch (e) {
      item.reject(e);
    } finally {
      active--;
      // Schedule next tick to avoid deep recursion
      queueMicrotask(runNext);
    }
  }

  return function limit(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      queueMicrotask(runNext);
    });
  };
}



