/**
 * Frame Routes
 * 
 * API endpoints for managing frames (shot presets).
 */

import express from 'express';
import {
  getAllFrames,
  getFrameById,
  getFramesByCategory,
  getFramesByTags,
  searchFrames,
  createFrame,
  updateFrame,
  deleteFrame
} from '../store/frameStore.js';
import { FRAME_OPTIONS } from '../schema/frame.js';
import { analyzeSketch, analyzeAndGenerateSketch, generateSketchFromText, generatePoseSketch } from '../services/frameAnalyzer.js';

const router = express.Router();

// GET /api/frames/options — Get options for UI dropdowns
router.get('/options', (req, res) => {
  res.json({
    ok: true,
    data: FRAME_OPTIONS
  });
});

// GET /api/frames — List all frames (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { category, tags, search } = req.query;

    let frames;

    if (search) {
      frames = await searchFrames(search);
    } else if (category) {
      frames = await getFramesByCategory(category);
    } else if (tags) {
      const tagList = String(tags).split(',').map(t => t.trim()).filter(Boolean);
      frames = await getFramesByTags(tagList);
    } else {
      frames = await getAllFrames();
    }

    res.json({
      ok: true,
      data: frames,
      total: frames.length
    });
  } catch (err) {
    console.error('[Frame] List error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/frames/:id — Get single frame
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const frame = await getFrameById(id);

    if (!frame) {
      return res.status(404).json({
        ok: false,
        error: `Frame "${id}" not found`
      });
    }

    res.json({ ok: true, data: frame });
  } catch (err) {
    console.error('[Frame] Get error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/frames — Create new frame
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const result = await createFrame(data);

    if (!result.success) {
      return res.status(400).json({
        ok: false,
        errors: result.errors
      });
    }

    res.status(201).json({
      ok: true,
      data: result.frame
    });
  } catch (err) {
    console.error('[Frame] Create error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/frames/:id — Update frame
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const result = await updateFrame(id, updates);

    if (!result.success) {
      const status = result.errors.some(e => e.includes('not found')) ? 404 : 400;
      return res.status(status).json({
        ok: false,
        errors: result.errors
      });
    }

    res.json({
      ok: true,
      data: result.frame
    });
  } catch (err) {
    console.error('[Frame] Update error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/frames/:id — Delete frame
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteFrame(id);

    if (!result.success) {
      const status = result.errors.some(e => e.includes('not found')) ? 404 : 400;
      return res.status(status).json({
        ok: false,
        errors: result.errors
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[Frame] Delete error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/frames/analyze-sketch — AI analysis of sketch image + generate schematic sketch
router.post('/analyze-sketch', async (req, res) => {
  try {
    const { image, notes, generateSketch = true } = req.body;

    if (!image || !image.base64) {
      return res.status(400).json({
        ok: false,
        error: 'Image with base64 data is required'
      });
    }

    // Use full pipeline if generateSketch is true (default)
    const result = generateSketch
      ? await analyzeAndGenerateSketch(image, notes || '')
      : await analyzeSketch(image, notes || '');

    res.json({
      ok: true,
      data: result
    });
  } catch (err) {
    console.error('[Frame] Analyze sketch error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/frames/generate-sketch — AI generation of sketch from text
router.post('/generate-sketch', async (req, res) => {
  try {
    const { description, technical } = req.body;

    if (!description) {
      return res.status(400).json({
        ok: false,
        error: 'Description is required'
      });
    }

    const result = await generateSketchFromText(description, technical || {});

    res.json({
      ok: true,
      data: result
    });
  } catch (err) {
    console.error('[Frame] Generate sketch error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
