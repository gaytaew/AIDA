/**
 * Health check routes
 */

import express from 'express';
import os from 'os';

const router = express.Router();

// Global reference to gemini limiter status (set by geminiClient)
let geminiLimiterStatus = null;

// Lazy reference to getOverloadStats to avoid circular dependency
let getOverloadStatsFn = null;

export function setGeminiLimiterStatus(getStatusFn) {
  geminiLimiterStatus = getStatusFn;
}

// Helper to get overload stats lazily
async function getOverloadStatsLazy() {
  if (!getOverloadStatsFn) {
    try {
      const mod = await import('../services/resilientImageGenerator.js');
      getOverloadStatsFn = mod.getOverloadStats;
    } catch (e) {
      return null;
    }
  }
  return getOverloadStatsFn ? getOverloadStatsFn() : null;
}

router.get('/health', async (req, res) => {
  const limiterStatus = geminiLimiterStatus ? geminiLimiterStatus() : null;
  const overloadStats = await getOverloadStatsLazy();

  res.json({
    ok: true,
    status: 'healthy',
    hostname: os.hostname(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    project: 'AIDA',
    geminiLimiter: limiterStatus,
    overloadStats
  });
});

// Detailed diagnostics endpoint
router.get('/diagnostics', async (req, res) => {
  const memUsage = process.memoryUsage();
  const limiterStatus = geminiLimiterStatus ? geminiLimiterStatus() : null;
  const overloadStats = await getOverloadStatsLazy();

  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    },
    uptime: Math.round(process.uptime()) + 's',
    geminiLimiter: limiterStatus,
    overloadStats,
    nodeVersion: process.version
  });
});

export default router;
