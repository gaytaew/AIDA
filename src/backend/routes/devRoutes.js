/**
 * Dev Routes
 * 
 * API endpoints for dev console and debugging.
 */

import express from 'express';
import { clearLogEntries, getLogEntriesSince, getLogStats } from '../dev/logBuffer.js';

const router = express.Router();

/**
 * GET /api/dev/logs - Get log entries
 * Query params:
 *   - cursor: Start from this ID (default: 0)
 *   - limit: Max entries to return (default: 200, max: 2000)
 */
router.get('/logs', (req, res) => {
  const sinceId = req.query?.cursor || 0;
  const limit = req.query?.limit || 200;
  const out = getLogEntriesSince({ sinceId, limit });
  return res.json({ ok: true, cursor: out.cursor, entries: out.entries });
});

/**
 * POST /api/dev/logs/clear - Clear all log entries
 */
router.post('/logs/clear', (req, res) => {
  clearLogEntries();
  console.log('[DevRoutes] Logs cleared');
  return res.json({ ok: true });
});

/**
 * GET /api/dev/logs/stats - Get log buffer statistics
 */
router.get('/logs/stats', (req, res) => {
  const stats = getLogStats();
  return res.json({ ok: true, ...stats });
});

export default router;

