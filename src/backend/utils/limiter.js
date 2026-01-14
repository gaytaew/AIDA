/**
 * Simple async limiter (concurrency + minimum spacing between starts).
 *
 * Why:
 * - Gemini image models are sensitive to bursts and parallelism → 503/500.
 * - This limiter lets us serialize or throttle requests without adding deps.
 * 
 * FIXED: Added timeout protection to prevent infinite hangs.
 */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {Object} options
 * @param {number} options.concurrency - max parallel tasks (default 1)
 * @param {number} options.minTimeMs - minimum delay between task starts (default 0)
 * @param {number} options.timeoutMs - max time for a single task (default 180000 = 3 minutes)
 * @param {string} options.name - limiter name for logging (default 'limiter')
 */
export function createLimiter(options = {}) {
  const concurrency = Math.max(1, Number.parseInt(options.concurrency || 1, 10) || 1);
  const minTimeMs = Math.max(0, Number.parseInt(options.minTimeMs || 0, 10) || 0);
  const timeoutMs = Math.max(0, Number.parseInt(options.timeoutMs || 180000, 10) || 180000);
  const name = options.name || 'limiter';

  let active = 0;
  let lastStartAt = 0;
  let taskIdCounter = 0;
  const queue = [];

  async function runNext() {
    if (active >= concurrency) {
      console.log(`[${name}] runNext: active=${active} >= concurrency=${concurrency}, waiting...`);
      return;
    }
    const item = queue.shift();
    if (!item) return;

    const taskId = ++taskIdCounter;
    active++;
    console.log(`[${name}] Task #${taskId} started (active=${active}, queue=${queue.length})`);
    
    const startTime = Date.now();
    let timeoutHandle = null;
    let timedOut = false;
    
    try {
      if (minTimeMs > 0) {
        const now = Date.now();
        const wait = Math.max(0, minTimeMs - (now - lastStartAt));
        if (wait > 0) await sleep(wait);
      }
      lastStartAt = Date.now();
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          timedOut = true;
          reject(new Error(`[${name}] Task #${taskId} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });
      
      // Race between task and timeout
      const res = await Promise.race([
        item.fn(),
        timeoutPromise
      ]);
      
      clearTimeout(timeoutHandle);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[${name}] Task #${taskId} completed in ${duration}s (active=${active - 1}, queue=${queue.length})`);
      
      item.resolve(res);
    } catch (e) {
      clearTimeout(timeoutHandle);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`[${name}] Task #${taskId} failed after ${duration}s:`, e.message?.slice(0, 100));
      item.reject(e);
    } finally {
      active--;
      console.log(`[${name}] Task #${taskId} cleanup: active=${active}, queue=${queue.length}`);
      // Schedule next tick to avoid deep recursion
      queueMicrotask(runNext);
    }
  }

  // Return limit function with diagnostic info
  const limitFn = function limit(fn) {
    return new Promise((resolve, reject) => {
      const queuePos = queue.length;
      console.log(`[${name}] New task queued at position ${queuePos} (active=${active})`);
      queue.push({ fn, resolve, reject });
      queueMicrotask(runNext);
    });
  };
  
  // Add diagnostic method
  limitFn.getStatus = () => ({
    name,
    active,
    queueLength: queue.length,
    concurrency,
    timeoutMs
  });
  
  return limitFn;
}



