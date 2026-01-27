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
import foodRoutes from './routes/foodRoutes.js';
import foodShootRoutes from './routes/foodShootRoutes.js';
import stylesRoutes from './routes/stylesRoutes.js';
import productRoutes from './routes/productRoutes.js';
import productShootRoutes from './routes/productShootRoutes.js';

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

  // FORCED TIMEOUT: If request doesn't finish in 10 minutes, kill it
  // This prevents zombie connections, but allows for long AI generation chains (Retry + Fallback)
  const REQUEST_TIMEOUT_MS = 600000; // 10 minutes

  const forceTimeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`[HTTP] ❌ FORCE_TIMEOUT: ${method} ${url} killed after 10 minutes`);
      res.status(504).json({
        ok: false,
        error: 'Request timeout - operation took too long',
        timeout: true
      });
    }
  }, REQUEST_TIMEOUT_MS);

  // Log warning at 8 minutes
  const warnTimeout = setTimeout(() => {
    console.warn(`[HTTP] ⚠️ SLOW REQUEST: ${method} ${url} still pending after 8 minutes`);
  }, 480000);

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
app.use('/api/food', foodRoutes);
app.use('/api/food-shoots', foodShootRoutes);
app.use('/api/styles', stylesRoutes);
app.use('/api/product', productRoutes);
app.use('/api/product-shoots', productShootRoutes);

// Static files (style preset images)
const stylesStorePath = path.resolve(__dirname, 'store/style-presets');
app.use('/api/styles/images', express.static(stylesStorePath));

// Static files (look images)
const looksStorePath = path.resolve(__dirname, 'store/looks');
app.use('/api/looks/images', express.static(looksStorePath));

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
const server = app.listen(PORT, () => {
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

// Set server timeout to 10 minutes + 10s buffer
server.setTimeout(610000);

export default app;

