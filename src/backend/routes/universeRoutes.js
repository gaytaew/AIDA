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
import { createLocation } from '../store/locationStore.js';
import { UNIVERSE_OPTIONS, createEmptyUniverse, universeToPromptBlock } from '../schema/universe.js';
import { createEmptyLocation, generateLocationId } from '../schema/location.js';
import { analyzeReferencesAndGenerateUniverse, validateImageData } from '../services/universeAnalyzer.js';
import { UNIVERSE_PARAMS, getAllParamsFlat, getBlocksStructure } from '../schema/universeParams.js';
import { buildUniverseNarrative, buildUniverseText, buildUniverseForPrompt, getDefaultParams } from '../schema/universeNarrativeBuilder.js';
import { checkUniverseConflicts, getConflicts, getWarnings, getHints, formatIssuesForUI, hasConflicts } from '../schema/universeConflicts.js';

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

// ═══════════════════════════════════════════════════════════════
// CUSTOM SHOOT 4: Universe Parameters API
// ═══════════════════════════════════════════════════════════════

// GET /api/universes/params — Get all universe parameters for Custom Shoot 4
router.get('/params', (req, res) => {
  res.json({
    ok: true,
    data: {
      params: UNIVERSE_PARAMS,
      blocks: getBlocksStructure(),
      defaults: getDefaultParams()
    }
  });
});

// GET /api/universes/params/blocks — Get blocks structure for UI
router.get('/params/blocks', (req, res) => {
  res.json({
    ok: true,
    data: getBlocksStructure()
  });
});

// GET /api/universes/params/defaults — Get default parameter values
router.get('/params/defaults', (req, res) => {
  res.json({
    ok: true,
    data: getDefaultParams()
  });
});

// POST /api/universes/params/preview — Preview narrative from parameters
router.post('/params/preview', (req, res) => {
  try {
    const params = req.body.params || getDefaultParams();
    
    const narrative = buildUniverseNarrative(params);
    const text = buildUniverseText(params);
    const forPrompt = buildUniverseForPrompt(params);
    
    res.json({
      ok: true,
      data: {
        narrative,  // Object with blocks
        text,       // Formatted text with markdown
        forPrompt   // Object ready for prompt generation
      }
    });
  } catch (err) {
    console.error('[Universe] Params preview error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/universes/params/build — Build universe from parameters (for generation)
router.post('/params/build', (req, res) => {
  try {
    const params = req.body.params || getDefaultParams();
    
    const universe = buildUniverseForPrompt(params);
    
    res.json({
      ok: true,
      data: universe
    });
  } catch (err) {
    console.error('[Universe] Params build error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// CONFLICTS & HINTS API
// ═══════════════════════════════════════════════════════════════

// POST /api/universes/params/check — Check parameters for conflicts
router.post('/params/check', (req, res) => {
  try {
    const params = req.body.params || {};
    
    const allIssues = checkUniverseConflicts(params);
    const conflicts = getConflicts(params);
    const warnings = getWarnings(params);
    const hints = getHints(params);
    
    res.json({
      ok: true,
      data: {
        hasConflicts: conflicts.length > 0,
        hasWarnings: warnings.length > 0,
        hasHints: hints.length > 0,
        total: allIssues.length,
        conflicts: formatIssuesForUI(conflicts),
        warnings: formatIssuesForUI(warnings),
        hints: formatIssuesForUI(hints),
        all: formatIssuesForUI(allIssues)
      }
    });
  } catch (err) {
    console.error('[Universe] Conflict check error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/universes/params/rules — Get all conflict rules (for documentation)
router.get('/params/rules', (req, res) => {
  try {
    const { CONFLICT_RULES } = require('../schema/universeConflicts.js');
    
    res.json({
      ok: true,
      data: CONFLICT_RULES.map(rule => ({
        id: rule.id,
        type: rule.type,
        title: rule.title,
        message: rule.message,
        suggestion: rule.suggestion
      }))
    });
  } catch (err) {
    console.error('[Universe] Rules error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
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

    // ALWAYS save locations from universe to Location module (even if universe is not saved yet)
    const savedLocations = [];
    // Check both 'locations' and 'recommendedLocations' for compatibility
    const locationsToSave = universe.locations || universe.recommendedLocations || [];
    
    if (locationsToSave.length > 0) {
      console.log(`[Universe] Auto-saving ${locationsToSave.length} locations`);
      
      for (const loc of locationsToSave) {
        try {
          const locationData = {
            ...createEmptyLocation(loc.label || 'Локация', loc.category || 'location'),
            label: loc.label || 'Локация из вселенной',
            description: loc.description || '',
            category: loc.category || 'location',
            environmentType: loc.environmentType || 'outdoor',
            surface: loc.surface || '',
            lighting: loc.lighting || { type: 'natural', timeOfDay: 'any', description: '' },
            props: loc.props || [],
            promptSnippet: loc.promptSnippet || loc.description || '',
            sourceUniverseId: universe.id,  // Link to source universe
            referenceImages: [],            // No refs for auto-generated locations
            defaultFrameParams: loc.defaultFrameParams || {  // Default pose settings
              shotSize: 'medium_full',
              cameraAngle: 'eye_level',
              poseType: 'standing',
              composition: 'rule_of_thirds',
              poseDescription: 'Natural relaxed pose'
            }
          };
          
          const locResult = await createLocation(locationData);
          if (locResult.success) {
            savedLocations.push(locResult.location);
            console.log(`[Universe] ✅ Saved location: ${locResult.location.label}`);
          } else {
            console.warn(`[Universe] ❌ Failed to save location "${loc.label}":`, locResult.errors);
          }
        } catch (e) {
          console.warn(`[Universe] ❌ Failed to save location "${loc.label}":`, e.message);
        }
      }
      
      console.log(`[Universe] Saved ${savedLocations.length}/${locationsToSave.length} locations to Location module`);
    } else {
      console.log('[Universe] No locations to save');
    }

    // Optionally save universe immediately
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
        saved: true,
        savedLocations: savedLocations.length
      });
    }

    // Return without saving universe (but locations are already saved!)
    res.json({
      ok: true,
      data: universe,
      saved: false,
      savedLocations: savedLocations.length
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
