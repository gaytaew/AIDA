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
import { getModelById, getModelsDir } from '../store/modelStore.js';
import { getLocationById } from '../store/locationStore.js';
import fs from 'fs/promises';
import path from 'path';

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
      locationId,
      aspectRatio,
      imageSize,
      presets,
      // Additional artistic controls (same as shoot-composer)
      captureStyle,
      cameraSignature,
      skinTexture,
      poseAdherence,
      // Composition
      composition,
      // Anti-AI
      antiAi,
      // Ambient (situational conditions: weather, season, atmosphere)
      ambient,
      identityImages: reqIdentityImages,
      clothingImages: reqClothingImages
    } = req.body;
    
    console.log('[CustomShootRoutes] Generate request for shoot:', shoot.id);
    console.log('[CustomShootRoutes] Request params:', { 
      emotionId, 
      locationId, 
      aspectRatio, 
      imageSize, 
      presets,
      captureStyle,
      cameraSignature,
      skinTexture,
      poseAdherence,
      composition,
      antiAi,
      ambient,
      frame: frame?.label || frame?.id || null,
      extraPrompt: extraPrompt?.slice(0, 50) 
    });
    
    // Prepare identity images
    let identityImages = [];
    if (reqIdentityImages && Array.isArray(reqIdentityImages)) {
      identityImages = reqIdentityImages;
    } else if (shoot.models?.length > 0) {
      // Get images from models by loading from modelStore and reading files
      for (const shootModel of shoot.models) {
        const modelId = shootModel.modelId || shootModel.id;
        if (!modelId) continue;
        
        const model = await getModelById(modelId);
        if (model && model.imageFiles && model.imageFiles.length > 0) {
          const modelsDir = getModelsDir();
          
          for (const filename of model.imageFiles) {
            const filePath = path.join(modelsDir, model.id, filename);
            try {
              const buffer = await fs.readFile(filePath);
              identityImages.push({
                mimeType: 'image/jpeg',
                base64: buffer.toString('base64')
              });
            } catch (e) {
              console.warn(`[CustomShootRoutes] Could not read identity image: ${filePath}`);
            }
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
      locationRef: !!locationRefImage,
      models: shoot.models?.map(m => m.modelId || m.id) || [],
      location: shoot.location?.label || null,
      frame: shoot.currentFrame?.label || null
    });
    
    // Get location if locationId provided
    let location = shoot.location;
    if (locationId) {
      const fetchedLocation = await getLocationById(locationId);
      if (fetchedLocation) {
        location = fetchedLocation;
      }
    }

    // Prepare location sketch image
    let locationSketchImage = null;
    if (location) {
      const sketchUrl = location.sketchAsset?.url || location.sketchAsset || location.sketchUrl;
      if (sketchUrl) {
        locationSketchImage = await prepareImageFromUrl(sketchUrl);
        if (locationSketchImage) {
          console.log('[CustomShootRoutes] Location sketch loaded');
        }
      }
    }
    
    // Load pose sketch from frame (same as shootRoutes)
    let poseSketchImage = null;
    const effectiveFrame = frame || shoot.currentFrame;
    if (effectiveFrame) {
      const sketchUrl = effectiveFrame.sketchUrl || effectiveFrame.sketchAsset?.url;
      if (sketchUrl && sketchUrl.startsWith('data:')) {
        const match = sketchUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          poseSketchImage = { mimeType: match[1], base64: match[2] };
          console.log('[CustomShootRoutes] Pose sketch loaded');
        }
      }
    }
    
    // Build collages for refs preview (same as shootRoutes)
    const { buildCollage } = await import('../utils/imageCollage.js');
    
    let identityCollage = null;
    let clothingCollage = null;
    
    if (identityImages.length > 0) {
      identityCollage = await buildCollage(identityImages, { maxSize: 512, maxCols: 3, jpegQuality: 85 });
    }
    if (clothingImages.length > 0) {
      clothingCollage = await buildCollage(clothingImages, { maxSize: 512, maxCols: 3, jpegQuality: 85 });
    }
    
    // Track generation time
    const genStartTime = Date.now();
    
    // Generate
    const result = await generateCustomShootFrame({
      shoot,
      identityImages,
      clothingImages,
      styleRefImage,
      locationRefImage,
      locationSketchImage,
      poseSketchImage,
      frame: effectiveFrame,
      emotionId: emotionId || shoot.currentEmotion,
      extraPrompt: extraPrompt || shoot.extraPrompt || '',
      location,
      presets,
      aspectRatio,
      imageSize,
      // Artistic controls
      captureStyle,
      cameraSignature,
      skinTexture,
      poseAdherence: parseInt(poseAdherence) || 2,
      // Composition
      composition,
      // Anti-AI
      antiAi,
      // Ambient (situational conditions: weather, season, atmosphere)
      ambient
    });
    
    const genDuration = ((Date.now() - genStartTime) / 1000).toFixed(1);
    
    if (!result.ok) {
      return res.status(500).json({ ok: false, error: result.error });
    }
    
    // Build refs with preview URLs (same format as shootRoutes)
    const refs = [];
    if (identityCollage) {
      refs.push({
        kind: 'identity',
        label: `Модель (${identityImages.length} фото)`,
        previewUrl: `data:${identityCollage.mimeType};base64,${identityCollage.base64}`
      });
    }
    if (clothingCollage) {
      refs.push({
        kind: 'clothing',
        label: `Одежда (${clothingImages.length} фото)`,
        previewUrl: `data:${clothingCollage.mimeType};base64,${clothingCollage.base64}`
      });
    }
    // Pose sketch (same as shootRoutes)
    if (poseSketchImage) {
      refs.push({
        kind: 'pose_sketch',
        label: 'Эскиз позы',
        previewUrl: `data:${poseSketchImage.mimeType};base64,${poseSketchImage.base64}`
      });
    }
    if (styleRefImage) {
      refs.push({
        kind: 'style_lock',
        label: 'Style Lock',
        previewUrl: `data:${styleRefImage.mimeType};base64,${styleRefImage.base64}`
      });
    }
    if (locationRefImage) {
      refs.push({
        kind: 'location_lock',
        label: 'Location Lock',
        previewUrl: `data:${locationRefImage.mimeType};base64,${locationRefImage.base64}`
      });
    }
    if (locationSketchImage && !locationRefImage) {
      refs.push({
        kind: 'location_sketch',
        label: 'Референс локации',
        previewUrl: `data:${locationSketchImage.mimeType};base64,${locationSketchImage.base64}`
      });
    }
    
    // Get frame and location labels
    const frameLabel = effectiveFrame?.label || 'По умолчанию';
    const locationLabel = location?.label || null;
    
    // Save generated image to shoot history with full params (same as shootRoutes)
    const imageData = {
      id: generateImageId(),
      imageUrl: result.image.dataUrl || `data:${result.image.mimeType};base64,${result.image.base64}`,
      frameId: effectiveFrame?.id || null,
      frameLabel,
      locationId: locationId || null,
      locationLabel,
      emotionId: emotionId || null,
      aspectRatio: aspectRatio || '3:4',
      imageSize: imageSize || '2K',
      // Artistic controls (same as shootRoutes)
      captureStyle: captureStyle || 'none',
      cameraSignature: cameraSignature || 'none',
      skinTexture: skinTexture || 'none',
      poseAdherence: parseInt(poseAdherence) || 2,
      composition: composition || null,
      antiAi: antiAi || null,
      extraPrompt: extraPrompt || '',
      presets: presets || null,
      prompt: result.prompt,
      promptJson: result.promptJson,
      refs,
      generationTime: genDuration
    };
    
    const savedImage = await addImageToShoot(shoot.id, imageData);
    
    res.json({
      ok: true,
      image: savedImage,
      prompt: result.prompt,
      refs
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

