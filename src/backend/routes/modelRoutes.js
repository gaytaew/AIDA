/**
 * Model Routes
 * CRUD operations for model avatars (identity presets).
 * Includes AI-powered generation from photos.
 */

import express from 'express';
import {
  getAllModels,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
  getModelsDir
} from '../store/modelStore.js';
import { analyzeModelPhotos, validateImageData } from '../services/modelAnalyzer.js';
import { generateAvatarShots, generateSingleShot, AVATAR_SHOTS } from '../services/avatarGenerator.js';
import { BODY_TYPES } from '../schema/model.js';
import { convertGeminiImageToJpeg } from '../utils/imageConverter.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
// GET /api/models/options — Get available options for model fields
// ═══════════════════════════════════════════════════════════════
router.get('/options', (req, res) => {
  res.json({
    ok: true,
    data: {
      bodyTypes: BODY_TYPES,
      avatarShots: AVATAR_SHOTS.map(s => ({ id: s.id, label: s.label }))
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// GET /api/models — List all models
// ═══════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const models = await getAllModels();
    res.json({
      ok: true,
      data: models,
      total: models.length
    });
  } catch (error) {
    console.error('[ModelRoutes] Error getting models:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/models/:id — Get model by ID
// ═══════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const model = await getModelById(id);
    
    if (!model) {
      return res.status(404).json({
        ok: false,
        error: `Model "${id}" not found`
      });
    }
    
    res.json({
      ok: true,
      data: model
    });
  } catch (error) {
    console.error('[ModelRoutes] Error getting model:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/models — Create new model
// ═══════════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const { images, ...modelData } = req.body;
    
    // Parse images if provided
    const imageArray = Array.isArray(images) ? images : [];
    
    const result = await createModel(modelData, imageArray);
    
    if (!result.success) {
      return res.status(400).json({
        ok: false,
        errors: result.errors
      });
    }
    
    res.status(201).json({
      ok: true,
      data: result.model
    });
  } catch (error) {
    console.error('[ModelRoutes] Error creating model:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// PUT /api/models/:id — Update model
// ═══════════════════════════════════════════════════════════════
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { images, ...updates } = req.body;
    
    // Parse new images if provided
    const newImages = Array.isArray(images) ? images : null;
    
    const result = await updateModel(id, updates, newImages);
    
    if (!result.success) {
      return res.status(400).json({
        ok: false,
        errors: result.errors
      });
    }
    
    res.json({
      ok: true,
      data: result.model
    });
  } catch (error) {
    console.error('[ModelRoutes] Error updating model:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// DELETE /api/models/:id — Delete model
// ═══════════════════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteModel(id);
    
    if (!result.success) {
      return res.status(404).json({
        ok: false,
        errors: result.errors
      });
    }
    
    res.json({
      ok: true,
      message: `Model "${id}" deleted`
    });
  } catch (error) {
    console.error('[ModelRoutes] Error deleting model:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/models/generate — AI-generate model from photos
// ═══════════════════════════════════════════════════════════════
router.post('/generate', async (req, res) => {
  try {
    const { images, hint } = req.body;
    
    // Validate images
    const validation = validateImageData(images);
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: validation.error
      });
    }
    
    console.log(`[ModelRoutes] Generating model from ${images.length} image(s)`);
    
    // Analyze photos with AI
    const generatedModel = await analyzeModelPhotos(images, hint || '');
    
    res.json({
      ok: true,
      data: generatedModel,
      message: 'Model generated successfully. Review and save to create.'
    });
  } catch (error) {
    console.error('[ModelRoutes] Error generating model:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/models/generate-and-save — AI-generate and save model
// ═══════════════════════════════════════════════════════════════
router.post('/generate-and-save', async (req, res) => {
  try {
    const { images, hint } = req.body;
    
    // Validate images
    const validation = validateImageData(images);
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: validation.error
      });
    }
    
    console.log(`[ModelRoutes] Generating and saving model from ${images.length} image(s)`);
    
    // Analyze photos with AI
    const generatedModel = await analyzeModelPhotos(images, hint || '');
    
    // Save to disk with images
    const result = await createModel(generatedModel, images);
    
    if (!result.success) {
      return res.status(400).json({
        ok: false,
        errors: result.errors
      });
    }
    
    res.status(201).json({
      ok: true,
      data: result.model,
      message: 'Model generated and saved successfully.'
    });
  } catch (error) {
    console.error('[ModelRoutes] Error generating and saving model:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/models/generate-avatars — Generate multi-angle avatar shots
// ═══════════════════════════════════════════════════════════════
router.post('/generate-avatars', async (req, res) => {
  try {
    const { images, extraPrompt } = req.body;
    
    // Validate images
    const validation = validateImageData(images);
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: validation.error
      });
    }
    
    console.log(`[ModelRoutes] Generating avatar shots from ${images.length} image(s)`);
    
    // Generate all avatar shots
    const result = await generateAvatarShots(images, { extraPrompt: extraPrompt || '' });
    
    res.json({
      ok: true,
      data: {
        shots: result.shots.map(s => ({
          id: s.id,
          label: s.label,
          status: s.status,
          imageDataUrl: s.image ? `data:${s.image.mimeType};base64,${s.image.base64}` : null,
          error: s.error
        })),
        collage: result.collage ? {
          mimeType: result.collage.mimeType,
          dataUrl: `data:${result.collage.mimeType};base64,${result.collage.base64}`
        } : null,
        modelDescription: result.modelDescription
      }
    });
  } catch (error) {
    console.error('[ModelRoutes] Error generating avatars:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/models/generate-avatar-shot — Generate single avatar shot
// ═══════════════════════════════════════════════════════════════
router.post('/generate-avatar-shot', async (req, res) => {
  try {
    const { images, shotId, extraPrompt } = req.body;
    
    // Validate images
    const validation = validateImageData(images);
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: validation.error
      });
    }
    
    if (!shotId) {
      return res.status(400).json({
        ok: false,
        error: 'shotId is required'
      });
    }
    
    console.log(`[ModelRoutes] Generating avatar shot: ${shotId}`);
    
    const result = await generateSingleShot(images, shotId, { extraPrompt: extraPrompt || '' });
    
    // Convert to JPEG for consistent storage
    let imageDataUrl = null;
    if (result.image) {
      const jpegImage = await convertGeminiImageToJpeg(result.image, 90);
      imageDataUrl = `data:${jpegImage.mimeType};base64,${jpegImage.base64}`;
    }
    
    res.json({
      ok: true,
      data: {
        id: result.id,
        label: result.label,
        status: result.status,
        imageDataUrl
      }
    });
  } catch (error) {
    console.error('[ModelRoutes] Error generating avatar shot:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;
