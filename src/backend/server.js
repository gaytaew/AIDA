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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());

// DIAGNOSTIC: Log ALL requests BEFORE body parsing
// This helps identify if requests are stuck in body parsing
app.use((req, res, next) => {
  const url = req.originalUrl || req.url;
  
  // Log all POST requests to /generate immediately
  if (req.method === 'POST' && url.includes('/generate')) {
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
  
  if (req.method === 'POST' && url.includes('/generate')) {
    console.log(`[HTTP] ✓ BODY_PARSED: ${req.method} ${url}`);
  }
  
  next();
});

// Request timing middleware
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
  
  // Log if response doesn't finish within 2 minutes
  const warnTimeout = setTimeout(() => {
    console.warn(`[HTTP] ⚠️ SLOW REQUEST: ${method} ${url} still pending after 2 minutes`);
  }, 120000);
  
  res.on('finish', () => clearTimeout(warnTimeout));
  res.on('close', () => clearTimeout(warnTimeout));
  
  next();
});

// Static files (frontend)
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

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

