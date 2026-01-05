/**
 * Shoot Routes
 * CRUD operations for shoot configs (assembled shoots).
 * 
 * TODO: Implement full CRUD when shoot store is ready.
 */

import express from 'express';

const router = express.Router();

// GET /api/shoots — List all shoots
router.get('/', (req, res) => {
  // TODO: Load from store
  res.json({
    ok: true,
    data: [],
    message: 'Shoot store not yet implemented'
  });
});

// GET /api/shoots/:id — Get shoot by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  // TODO: Load from store
  res.json({
    ok: false,
    error: `Shoot "${id}" not found (store not yet implemented)`
  });
});

// POST /api/shoots — Create new shoot
router.post('/', (req, res) => {
  // TODO: Validate and save
  res.json({
    ok: false,
    error: 'Shoot creation not yet implemented'
  });
});

// PUT /api/shoots/:id — Update shoot
router.put('/:id', (req, res) => {
  // TODO: Validate and update
  res.json({
    ok: false,
    error: 'Shoot update not yet implemented'
  });
});

// DELETE /api/shoots/:id — Delete shoot
router.delete('/:id', (req, res) => {
  // TODO: Delete from store
  res.json({
    ok: false,
    error: 'Shoot deletion not yet implemented'
  });
});

// POST /api/shoots/:id/generate — Generate images for shoot
router.post('/:id/generate', (req, res) => {
  // TODO: Implement generation pipeline
  res.json({
    ok: false,
    error: 'Image generation not yet implemented'
  });
});

export default router;

