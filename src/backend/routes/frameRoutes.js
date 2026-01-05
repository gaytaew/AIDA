/**
 * Frame Routes
 * CRUD operations for frame catalog (shot presets with sketches).
 * 
 * TODO: Implement full CRUD when frame store is ready.
 */

import express from 'express';

const router = express.Router();

// GET /api/frames — List all frames
router.get('/', (req, res) => {
  // TODO: Load from store
  res.json({
    ok: true,
    data: [],
    message: 'Frame store not yet implemented'
  });
});

// GET /api/frames/:id — Get frame by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  // TODO: Load from store
  res.json({
    ok: false,
    error: `Frame "${id}" not found (store not yet implemented)`
  });
});

// POST /api/frames — Create new frame
router.post('/', (req, res) => {
  // TODO: Validate and save
  res.json({
    ok: false,
    error: 'Frame creation not yet implemented'
  });
});

// PUT /api/frames/:id — Update frame
router.put('/:id', (req, res) => {
  // TODO: Validate and update
  res.json({
    ok: false,
    error: 'Frame update not yet implemented'
  });
});

// DELETE /api/frames/:id — Delete frame
router.delete('/:id', (req, res) => {
  // TODO: Delete from store
  res.json({
    ok: false,
    error: 'Frame deletion not yet implemented'
  });
});

export default router;

