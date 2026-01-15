/**
 * AIDA Server
 * Main entry point for the backend.
 */

// Initialize console log capture FIRST (before any other imports that might log)
import './dev/consoleTap.js';

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config.js';

// Routes
import healthRoutes from './routes/healthRoutes.js';
import devRoutes from './routes/devRoutes.js';
import universeRoutes from './routes/universeRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import frameRoutes from './routes/frameRoutes.js';
import modelRoutes from './routes/modelRoutes.js';
import shootRoutes from './routes/shootRoutes.js';
import emotionRoutes from './routes/emotionRoutes.js';
import customShootRoutes from './routes/customShootRoutes.js';
import lookRoutes from './routes/lookRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());

// DISABLE HTTP Keep-Alive to prevent stale connections through SSH tunnel
// Each request will use a fresh TCP connection
app.use((req, res, next) => {
  res.setHeader('Connection', 'close');
  next();
});

// DIAGNOSTIC: Log ALL requests BEFORE body parsing
// This helps identify if requests are stuck in body parsing
app.use((req, res, next) => {
  const url = req.originalUrl || req.url;

  // Log POST/PUT requests to custom-shoots immediately
  if ((req.method === 'POST' || req.method === 'PUT') && url.includes('/custom-shoots')) {
    const contentLength = req.headers['content-length'] || 0;
    console.log(`[HTTP] ⚡ INCOMING: ${req.method} ${url} (content-length: ${Math.round(contentLength / 1024)}KB)`);
  }

  next();
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// DIAGNOSTIC: Log after body parsing
app.use((req, res, next) => {
  const url = req.originalUrl || req.url;

  if ((req.method === 'POST' || req.method === 'PUT') && url.includes('/custom-shoots')) {
    console.log(`[HTTP] ✓ BODY_PARSED: ${req.method} ${url}`);
  }

  next();
});

// Request timing middleware with FORCED TIMEOUT
app.use((req, res, next) => {
  const start = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;

  // Log request start for large bodies
  const bodySize = req.headers['content-length'] || 0;
  if (bodySize > 10000) {
    console.log(`[HTTP] → ${method} ${url} (body: ${Math.round(bodySize / 1024)}KB)`);
  }

  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500 || bodySize > 100000) {
      console.log(`[HTTP] ← ${method} ${url} [${res.statusCode}] ${duration}ms`);
    }
  });

  // FORCED TIMEOUT: If request doesn't finish in 3 minutes, kill it
  // This prevents zombie connections from blocking browser connection pool
  const REQUEST_TIMEOUT_MS = 180000; // 3 minutes

  const forceTimeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`[HTTP] ❌ FORCE_TIMEOUT: ${method} ${url} killed after 3 minutes`);
      res.status(504).json({
        ok: false,
        error: 'Request timeout - operation took too long',
        timeout: true
      });
    }
  }, REQUEST_TIMEOUT_MS);

  // Log warning at 2 minutes
  const warnTimeout = setTimeout(() => {
    console.warn(`[HTTP] ⚠️ SLOW REQUEST: ${method} ${url} still pending after 2 minutes`);
  }, 120000);

  res.on('finish', () => {
    clearTimeout(warnTimeout);
    clearTimeout(forceTimeout);
  });
  res.on('close', () => {
    clearTimeout(warnTimeout);
    clearTimeout(forceTimeout);
  });

  next();
});

// Static files (frontend) - DISABLE CACHE to fix updates issue
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath, {
  setHeaders: (res, path, stat) => {
    // Disable caching for all static files to ensure updates are seen immediately
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
  }
}));

// Static files (model images)
const modelsStorePath = path.resolve(__dirname, 'store/models');
app.use('/api/models/images', express.static(modelsStorePath));

// API Routes
app.use('/api', healthRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/universes', universeRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/frames', frameRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/shoots', shootRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/custom-shoots', customShootRoutes);
app.use('/api/looks', lookRoutes);

// Fallback: serve index.html for SPA-like navigation
app.get('*', (req, res) => {
  // If it's an API request that wasn't matched, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'Endpoint not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[AIDA Error]', err);
  res.status(500).json({ ok: false, error: err.message || 'Internal Server Error' });
});

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎨 AIDA — Модульный конструктор съёмок                 ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║   Environment: ${config.NODE_ENV.padEnd(16)}                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;

