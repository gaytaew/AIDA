/**
 * In-memory ring buffer for server logs.
 * Used by the in-app dev console overlay.
 * 
 * Logs are ALWAYS written regardless of whether the UI is open.
 */

const DEFAULT_MAX_ENTRIES = 2000;

let maxEntries = DEFAULT_MAX_ENTRIES;
let cursor = 0;
let entries = [];

export function configureLogBuffer({ maxEntries: max } = {}) {
  const n = Number(max);
  if (Number.isFinite(n) && n >= 100 && n <= 50000) {
    maxEntries = Math.floor(n);
  }
}

export function pushLogEntry({ level, message, data } = {}) {
  const entry = {
    id: ++cursor,
    ts: Date.now(),
    level: String(level || 'log'),
    message: String(message || ''),
    data: data === undefined ? null : data
  };

  entries.push(entry);
  if (entries.length > maxEntries) {
    entries = entries.slice(-maxEntries);
  }

  return entry.id;
}

export function getLogEntriesSince({ sinceId = 0, limit = 200 } = {}) {
  const since = Number(sinceId) || 0;
  const lim = Math.min(Math.max(Number(limit) || 200, 1), 2000);

  const out = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.id > since) out.push(e);
    if (out.length >= lim) break;
  }

  const newCursor = out.length ? out[out.length - 1].id : since;
  return { cursor: newCursor, entries: out };
}

export function clearLogEntries() {
  entries = [];
}

export function getLogStats() {
  return {
    total: entries.length,
    maxEntries,
    cursor
  };
}

