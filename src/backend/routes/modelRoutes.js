/**
 * Model Routes
 * CRUD operations for model avatars (identity presets).
 * 
 * TODO: Implement full CRUD when model store is ready.
 */

import express from 'express';

const router = express.Router();

// GET /api/models — List all models
router.get('/', (req, res) => {
  // TODO: Load from store
  res.json({
    ok: true,
    data: [],
    message: 'Model store not yet implemented'
  });
});

// GET /api/models/:id — Get model by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  // TODO: Load from store
  res.json({
    ok: false,
    error: `Model "${id}" not found (store not yet implemented)`
  });
});

// POST /api/models — Create new model
router.post('/', (req, res) => {
  // TODO: Validate and save
  res.json({
    ok: false,
    error: 'Model creation not yet implemented'
  });
});

// PUT /api/models/:id — Update model
router.put('/:id', (req, res) => {
  // TODO: Validate and update
  res.json({
    ok: false,
    error: 'Model update not yet implemented'
  });
});

// DELETE /api/models/:id — Delete model
router.delete('/:id', (req, res) => {
  // TODO: Delete from store
  res.json({
    ok: false,
    error: 'Model deletion not yet implemented'
  });
});

export default router;

