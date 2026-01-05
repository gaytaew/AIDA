/**
 * Monkey-patches console.* to also write to an in-memory log buffer.
 * This enables a simple in-app log viewer in the frontend.
 *
 * LOGS ARE ALWAYS CAPTURED regardless of whether UI is open.
 * This is intentionally lightweight (no file writes) and "best effort".
 */

import { format } from 'node:util';
import { pushLogEntry, configureLogBuffer } from './logBuffer.js';

// Always enable logging
configureLogBuffer({ maxEntries: process.env.DEV_CONSOLE_MAX_ENTRIES || 2000 });

function safeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return '[unserializable]';
  }
}

function tap(level, args) {
  try {
    const message = format(...args);
    pushLogEntry({ level, message });
  } catch {
    // ignore tap failures
  }
}

function patchConsoleMethod(level) {
  const original = console[level] ? console[level].bind(console) : null;
  console[level] = (...args) => {
    tap(level, args);
    if (original) return original(...args);
  };
}

// Patch all console methods
['log', 'info', 'warn', 'error', 'debug'].forEach(patchConsoleMethod);

// Capture uncaught exceptions
process.on('uncaughtException', err => {
  try {
    pushLogEntry({
      level: 'uncaughtException',
      message: err && err.stack ? String(err.stack) : safeStringify(err),
      data: null
    });
  } catch {}
});

// Capture unhandled promise rejections
process.on('unhandledRejection', reason => {
  try {
    pushLogEntry({
      level: 'unhandledRejection',
      message: reason && reason.stack ? String(reason.stack) : safeStringify(reason),
      data: null
    });
  } catch {}
});

console.log('[ConsoleTap] Log capture initialized');

