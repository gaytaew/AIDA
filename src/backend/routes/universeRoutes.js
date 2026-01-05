/**
 * Universe Routes
 * CRUD operations for shoot universes (visual style presets).
 */

import express from 'express';
import {
  getAllUniverses,
  getUniverseById,
  createUniverse,
  updateUniverse,
  deleteUniverse
} from '../store/universeStore.js';
import { UNIVERSE_OPTIONS, createEmptyUniverse, universeToPromptBlock } from '../schema/universe.js';
import { analyzeReferencesAndGenerateUniverse, validateImageData } from '../services/universeAnalyzer.js';

const router = express.Router();

// GET /api/universes — List all universes
router.get('/', async (req, res) => {
  try {
    const universes = await getAllUniverses();
    res.json({
      ok: true,
      data: universes,
      total: universes.length
    });
  } catch (err) {
    console.error('[Universe] List error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/universes/options — Get options for UI dropdowns
router.get('/options', (req, res) => {
  res.json({
    ok: true,
    data: UNIVERSE_OPTIONS
  });
});

// GET /api/universes/template — Get empty universe template
router.get('/template', (req, res) => {
  const label = req.query.label || 'Новая вселенная';
  const template = createEmptyUniverse(label);
  res.json({
    ok: true,
    data: template
  });
});

// POST /api/universes/generate — Generate universe from reference images
router.post('/generate', async (req, res) => {
  try {
    const { images, notes, save } = req.body;

    // Validate images
    const validation = validateImageData(images);
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: validation.error
      });
    }

    console.log('[Universe] Generating from', images.length, 'references');

    // Analyze and generate
    const universe = await analyzeReferencesAndGenerateUniverse(images, notes || '');

    // Optionally save immediately
    if (save) {
      const result = await createUniverse(universe);
      if (!result.success) {
        return res.status(400).json({
          ok: false,
          errors: result.errors,
          data: universe // Still return the generated universe
        });
      }
      return res.json({
        ok: true,
        data: result.universe,
        saved: true
      });
    }

    // Return without saving (user can review and save manually)
    res.json({
      ok: true,
      data: universe,
      saved: false
    });
  } catch (err) {
    console.error('[Universe] Generate error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/universes/:id — Get universe by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const universe = await getUniverseById(id);
    
    if (!universe) {
      return res.status(404).json({
        ok: false,
        error: `Universe "${id}" not found`
      });
    }
    
    res.json({ ok: true, data: universe });
  } catch (err) {
    console.error('[Universe] Get error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/universes/:id/prompt — Get prompt block for universe
router.get('/:id/prompt', async (req, res) => {
  try {
    const { id } = req.params;
    const universe = await getUniverseById(id);
    
    if (!universe) {
      return res.status(404).json({
        ok: false,
        error: `Universe "${id}" not found`
      });
    }
    
    const promptBlock = universeToPromptBlock(universe);
    res.json({
      ok: true,
      data: {
        id: universe.id,
        label: universe.label,
        promptBlock
      }
    });
  } catch (err) {
    console.error('[Universe] Prompt error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/universes — Create new universe
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const result = await createUniverse(data);
    
    if (!result.success) {
      return res.status(400).json({
        ok: false,
        errors: result.errors
      });
    }
    
    res.status(201).json({
      ok: true,
      data: result.universe
    });
  } catch (err) {
    console.error('[Universe] Create error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/universes/:id — Update universe
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await updateUniverse(id, updates);
    
    if (!result.success) {
      const status = result.errors.some(e => e.includes('not found')) ? 404 : 400;
      return res.status(status).json({
        ok: false,
        errors: result.errors
      });
    }
    
    res.json({
      ok: true,
      data: result.universe
    });
  } catch (err) {
    console.error('[Universe] Update error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/universes/:id — Delete universe
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteUniverse(id);
    
    if (!result.success) {
      const status = result.errors.some(e => e.includes('not found')) ? 404 : 400;
      return res.status(status).json({
        ok: false,
        errors: result.errors
      });
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error('[Universe] Delete error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
