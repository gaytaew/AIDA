/**
 * AIDA Server
 * Main entry point for the backend.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config.js';

// Routes
import healthRoutes from './routes/healthRoutes.js';
import universeRoutes from './routes/universeRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import frameRoutes from './routes/frameRoutes.js';
import modelRoutes from './routes/modelRoutes.js';
import shootRoutes from './routes/shootRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (frontend)
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api', healthRoutes);
app.use('/api/universes', universeRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/frames', frameRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/shoots', shootRoutes);

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

