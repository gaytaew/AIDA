/**
 * Custom Shoot Routes
 * 
 * API endpoints for Custom Shoots with Reference Locks.
 */

import express from 'express';
import {
  getAllCustomShoots,
  getCustomShootById,
  saveCustomShoot,
  deleteCustomShoot,
  addImageToShoot,
  removeImageFromShoot,
  setStyleLockOnShoot,
  setLocationLockOnShoot,
  clearStyleLockOnShoot,
  clearLocationLockOnShoot,
  updateShootParams
} from '../store/customShootStore.js';
import {
  createEmptyCustomShoot,
  validateCustomShoot,
  generateImageId,
  getAllPresets
} from '../schema/customShoot.js';
import { getAllStylePresets } from '../schema/stylePresets.js';
import {
  generateCustomShootFrame,
  prepareImageFromUrl
} from '../services/customShootGenerator.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
// CRUD ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/custom-shoots
 * List all custom shoots
 */
router.get('/', async (req, res) => {
  try {
    const shoots = await getAllCustomShoots();
    res.json({ ok: true, shoots });
  } catch (err) {
    console.error('[CustomShootRoutes] Error listing shoots:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/custom-shoots/presets
 * Get all available presets for UI
 */
router.get('/presets', async (req, res) => {
  try {
    const presets = {
      ...getAllPresets(),
      ...getAllStylePresets()
    };
    res.json({ ok: true, presets });
  } catch (err) {
    console.error('[CustomShootRoutes] Error getting presets:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/custom-shoots
 * Create a new custom shoot
 */
router.post('/', async (req, res) => {
  try {
    const { label } = req.body;
    const shoot = createEmptyCustomShoot(label || 'New Custom Shoot');
    
    await saveCustomShoot(shoot);
    
    res.json({ ok: true, shoot });
  } catch (err) {
    console.error('[CustomShootRoutes] Error creating shoot:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/custom-shoots/:id
 * Get a custom shoot by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const shoot = await getCustomShootById(req.params.id);
    
    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    
    res.json({ ok: true, shoot });
  } catch (err) {
    console.error('[CustomShootRoutes] Error getting shoot:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * PUT /api/custom-shoots/:id
 * Update a custom shoot
 */
router.put('/:id', async (req, res) => {
  try {
    const shoot = await getCustomShootById(req.params.id);
    
    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    
    const updatedShoot = await updateShootParams(req.params.id, req.body);
    
    res.json({ ok: true, shoot: updatedShoot });
  } catch (err) {
    console.error('[CustomShootRoutes] Error updating shoot:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * DELETE /api/custom-shoots/:id
 * Delete a custom shoot
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteCustomShoot(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error('[CustomShootRoutes] Error deleting shoot:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// LOCK ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/custom-shoots/:id/lock-style
 * Set style lock to a specific image
 */
router.post('/:id/lock-style', async (req, res) => {
  try {
    const { imageId, mode = 'strict' } = req.body;
    
    if (!imageId) {
      return res.status(400).json({ ok: false, error: 'imageId is required' });
    }
    
    if (!['strict', 'soft'].includes(mode)) {
      return res.status(400).json({ ok: false, error: 'mode must be "strict" or "soft"' });
    }
    
    const shoot = await setStyleLockOnShoot(req.params.id, imageId, mode);
    
    res.json({ ok: true, shoot });
  } catch (err) {
    console.error('[CustomShootRoutes] Error setting style lock:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * DELETE /api/custom-shoots/:id/lock-style
 * Clear style lock
 */
router.delete('/:id/lock-style', async (req, res) => {
  try {
    const shoot = await clearStyleLockOnShoot(req.params.id);
    res.json({ ok: true, shoot });
  } catch (err) {
    console.error('[CustomShootRoutes] Error clearing style lock:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/custom-shoots/:id/lock-location
 * Set location lock to a specific image
 */
router.post('/:id/lock-location', async (req, res) => {
  try {
    const { imageId, mode = 'strict' } = req.body;
    
    if (!imageId) {
      return res.status(400).json({ ok: false, error: 'imageId is required' });
    }
    
    if (!['strict', 'soft'].includes(mode)) {
      return res.status(400).json({ ok: false, error: 'mode must be "strict" or "soft"' });
    }
    
    const shoot = await setLocationLockOnShoot(req.params.id, imageId, mode);
    
    res.json({ ok: true, shoot });
  } catch (err) {
    console.error('[CustomShootRoutes] Error setting location lock:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * DELETE /api/custom-shoots/:id/lock-location
 * Clear location lock
 */
router.delete('/:id/lock-location', async (req, res) => {
  try {
    const shoot = await clearLocationLockOnShoot(req.params.id);
    res.json({ ok: true, shoot });
  } catch (err) {
    console.error('[CustomShootRoutes] Error clearing location lock:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// GENERATION ENDPOINT
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/custom-shoots/:id/generate
 * Generate a new frame for the shoot
 */
router.post('/:id/generate', async (req, res) => {
  try {
    const shoot = await getCustomShootById(req.params.id);
    
    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    
    const {
      frame,
      emotionId,
      extraPrompt,
      identityImages: reqIdentityImages,
      clothingImages: reqClothingImages
    } = req.body;
    
    console.log('[CustomShootRoutes] Generate request for shoot:', shoot.id);
    
    // Prepare identity images
    let identityImages = [];
    if (reqIdentityImages && Array.isArray(reqIdentityImages)) {
      identityImages = reqIdentityImages;
    } else if (shoot.models?.length > 0) {
      // Get images from models
      for (const model of shoot.models) {
        if (model.refs) {
          for (const ref of model.refs) {
            const img = await prepareImageFromUrl(ref.url);
            if (img) identityImages.push(img);
          }
        }
      }
    }
    
    // Prepare clothing images
    let clothingImages = [];
    if (reqClothingImages && Array.isArray(reqClothingImages)) {
      clothingImages = reqClothingImages;
    } else if (shoot.clothing?.length > 0) {
      for (const clothing of shoot.clothing) {
        if (clothing.refs) {
          for (const ref of clothing.refs) {
            const img = await prepareImageFromUrl(ref.url);
            if (img) clothingImages.push(img);
          }
        }
      }
    }
    
    // Prepare style reference image
    let styleRefImage = null;
    if (shoot.locks?.style?.enabled && shoot.locks.style.sourceImageUrl) {
      styleRefImage = await prepareImageFromUrl(shoot.locks.style.sourceImageUrl);
    }
    
    // Prepare location reference image
    let locationRefImage = null;
    if (shoot.locks?.location?.enabled && shoot.locks.location.sourceImageUrl) {
      locationRefImage = await prepareImageFromUrl(shoot.locks.location.sourceImageUrl);
    }
    
    console.log('[CustomShootRoutes] Prepared refs:', {
      identity: identityImages.length,
      clothing: clothingImages.length,
      styleRef: !!styleRefImage,
      locationRef: !!locationRefImage
    });
    
    // Generate
    const result = await generateCustomShootFrame({
      shoot,
      identityImages,
      clothingImages,
      styleRefImage,
      locationRefImage,
      frame: frame || shoot.currentFrame,
      emotionId: emotionId || shoot.currentEmotion,
      extraPrompt: extraPrompt || shoot.extraPrompt || ''
    });
    
    if (!result.ok) {
      return res.status(500).json({ ok: false, error: result.error });
    }
    
    // Save generated image to shoot history
    const imageData = {
      id: generateImageId(),
      imageUrl: result.image.dataUrl || `data:${result.image.mimeType};base64,${result.image.base64}`,
      paramsSnapshot: result.paramsSnapshot,
      promptJson: result.promptJson
    };
    
    const savedImage = await addImageToShoot(shoot.id, imageData);
    
    res.json({
      ok: true,
      image: savedImage,
      prompt: result.prompt
    });
    
  } catch (err) {
    console.error('[CustomShootRoutes] Error generating:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// IMAGE MANAGEMENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * DELETE /api/custom-shoots/:id/images/:imageId
 * Delete an image from history
 */
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const deleted = await removeImageFromShoot(req.params.id, req.params.imageId);
    
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Image not found' });
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error('[CustomShootRoutes] Error deleting image:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

