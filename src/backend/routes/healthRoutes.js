/**
 * Health check routes
 */

import express from 'express';
import os from 'os';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    hostname: os.hostname(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    project: 'AIDA'
  });
});

export default router;

