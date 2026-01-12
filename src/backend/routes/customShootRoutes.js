/**
 * Custom Shoot Routes
 * 
 * API endpoints for Custom Shoots with Reference Locks.
 */

import express from 'express';
import {
  getAllCustomShoots,
  getCustomShootById,
  getCustomShootWithImages,
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
import { loadImageBuffer, isStoredImagePath } from '../store/imageStore.js';
import {
  createEmptyCustomShoot,
  validateCustomShoot,
  generateImageId,
  getAllPresets
} from '../schema/customShoot.js';
import { 
  getAllStylePresets, 
  checkConflicts, 
  getAllConflicts,
  getShootTypeDefaults,
  validateAndCorrectParams,
  getParameterRecommendations
} from '../schema/stylePresets.js';
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
 * Get all available presets for UI (including new 6-layer architecture)
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
 * POST /api/custom-shoots/check-conflicts
 * Check for parameter conflicts
 * Body: { currentSelections: {...}, paramToCheck: 'string', valueToCheck: 'string' }
 */
router.post('/check-conflicts', async (req, res) => {
  try {
    const { currentSelections, paramToCheck, valueToCheck } = req.body;
    
    if (!currentSelections || !paramToCheck || !valueToCheck) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required parameters: currentSelections, paramToCheck, valueToCheck' 
      });
    }
    
    const result = checkConflicts(currentSelections, paramToCheck, valueToCheck);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[CustomShootRoutes] Error checking conflicts:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/custom-shoots/all-conflicts
 * Get all conflicts for current parameter set
 * Body: { selections: {...} }
 */
router.post('/all-conflicts', async (req, res) => {
  try {
    const { selections } = req.body;
    
    if (!selections) {
      return res.status(400).json({ ok: false, error: 'Missing selections' });
    }
    
    const conflicts = getAllConflicts(selections);
    res.json({ ok: true, conflicts });
  } catch (err) {
    console.error('[CustomShootRoutes] Error getting all conflicts:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/custom-shoots/shoot-type-defaults/:shootType
 * Get suggested defaults for a shoot type
 */
router.get('/shoot-type-defaults/:shootType', async (req, res) => {
  try {
    const { shootType } = req.params;
    const defaults = getShootTypeDefaults(shootType);
    res.json({ ok: true, defaults });
  } catch (err) {
    console.error('[CustomShootRoutes] Error getting shoot type defaults:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/custom-shoots/validate-params
 * Validate all parameters and get auto-corrections
 * Body: { params: {...} }
 * Returns: { valid, conflicts, warnings, autoCorrections, correctedParams }
 */
router.post('/validate-params', async (req, res) => {
  try {
    const { params } = req.body;
    
    if (!params) {
      return res.status(400).json({ ok: false, error: 'Missing params' });
    }
    
    const validation = validateAndCorrectParams(params);
    res.json({ ok: true, ...validation });
  } catch (err) {
    console.error('[CustomShootRoutes] Error validating params:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/custom-shoots/recommendations
 * Get parameter recommendations based on context
 * Body: { context: {...}, param: 'string' }
 * Returns: { recommended: [], avoid: [], info: string }
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { context, param } = req.body;
    
    if (!context || !param) {
      return res.status(400).json({ ok: false, error: 'Missing context or param' });
    }
    
    const recommendations = getParameterRecommendations(context, param);
    res.json({ ok: true, ...recommendations });
  } catch (err) {
    console.error('[CustomShootRoutes] Error getting recommendations:', err);
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
 * Get a custom shoot by ID (with images resolved to data URLs)
 */
router.get('/:id', async (req, res) => {
  try {
    // Use getCustomShootWithImages to resolve stored image paths to data URLs
    const shoot = await getCustomShootWithImages(req.params.id);
    
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
    // updateShootParams handles not-found case internally
    const updatedShoot = await updateShootParams(req.params.id, req.body);
    
    res.json({ ok: true, shoot: updatedShoot });
  } catch (err) {
    // Handle not found
    if (err.message.includes('not found')) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
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
      // Model Behavior (Layer 7)
      modelBehavior,
      // Lens Focal Length
      lensFocalLength,
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
      modelBehavior,
      lensFocalLength,
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
    
    // Prepare clothing images and descriptions
    let clothingImages = [];
    let clothingDescriptions = [];
    if (reqClothingImages && Array.isArray(reqClothingImages)) {
      clothingImages = reqClothingImages;
    } else if (shoot.clothing?.length > 0) {
      for (const clothing of shoot.clothing) {
        if (clothing.refs) {
          for (const ref of clothing.refs) {
            const img = await prepareImageFromUrl(ref.url);
            if (img) {
              clothingImages.push(img);
              // Collect description if provided
              if (ref.description && ref.description.trim()) {
                clothingDescriptions.push(ref.description.trim());
              }
            }
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
    
    // Identity collage: HIGH QUALITY for face recognition
    // - Larger size (1536px) to preserve facial details
    // - Higher JPEG quality (95) to avoid compression artifacts
    // - Larger minimum tile (512px) for each face
    // - Max 2 columns to keep faces bigger
    if (identityImages.length > 0) {
      identityCollage = await buildCollage(identityImages, { 
        maxSize: 1536,      // Much larger for face details
        maxCols: 2,         // Fewer columns = bigger faces
        minTile: 512,       // Each face at least 512px
        jpegQuality: 95,    // Maximum quality
        fit: 'cover',
        position: 'attention'  // Smart crop focusing on faces
      });
    }
    
    // Clothing collage: moderate quality (clothing is less sensitive)
    if (clothingImages.length > 0) {
      clothingCollage = await buildCollage(clothingImages, { 
        maxSize: 1024,      // Larger for clothing details
        maxCols: 3,         // More columns OK for clothing
        minTile: 400,
        jpegQuality: 92
      });
    }
    
    // Track generation time
    const genStartTime = Date.now();
    
    // Generate
    const result = await generateCustomShootFrame({
      shoot,
      identityImages,
      clothingImages,
      clothingDescriptions, // NEW: detailed clothing descriptions
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
      // Model Behavior (Layer 7)
      modelBehavior,
      // Lens Focal Length
      lensFocalLength,
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
    
    // Save generated image to shoot history
    // Refs are saved with previewUrls (small 512px thumbnails) for display in history
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
      refs: refs, // Save refs with preview thumbnails
      generationTime: genDuration
    };
    
    const savedImage = await addImageToShoot(shoot.id, imageData);
    
    // Return the original data URL for immediate display (not the stored path)
    const responseImage = {
      ...savedImage,
      imageUrl: imageData.imageUrl  // Use original data URL, not the saved path
    };
    
    res.json({
      ok: true,
      image: responseImage,
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

// ═══════════════════════════════════════════════════════════════
// IMAGE SERVING ENDPOINT
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/custom-shoots/:shootId/images/:imageId
 * Serve a stored image directly (for future optimization)
 */
router.get('/:shootId/images/:imageId', async (req, res) => {
  try {
    const { shootId, imageId } = req.params;
    
    // Try common extensions
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    let result = null;
    
    for (const ext of extensions) {
      const imagePath = `${shootId}/${imageId}.${ext}`;
      result = await loadImageBuffer(imagePath);
      if (result.ok) break;
    }
    
    if (!result || !result.ok) {
      return res.status(404).json({ ok: false, error: 'Image not found' });
    }
    
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    res.send(result.buffer);
  } catch (err) {
    console.error('[CustomShootRoutes] Error serving image:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

