/**
 * Health check routes
 */

import express from 'express';
import os from 'os';

const router = express.Router();

// Global reference to gemini limiter status (set by geminiClient)
let geminiLimiterStatus = null;

export function setGeminiLimiterStatus(getStatusFn) {
  geminiLimiterStatus = getStatusFn;
}

router.get('/health', (req, res) => {
  const limiterStatus = geminiLimiterStatus ? geminiLimiterStatus() : null;

  res.json({
    ok: true,
    status: 'healthy',
    hostname: os.hostname(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    project: 'AIDA',
    geminiLimiter: limiterStatus
  });
});

// Detailed diagnostics endpoint
router.get('/diagnostics', (req, res) => {
  const memUsage = process.memoryUsage();
  const limiterStatus = geminiLimiterStatus ? geminiLimiterStatus() : null;

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
    nodeVersion: process.version
  });
});

export default router;

