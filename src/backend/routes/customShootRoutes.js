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
import { loadImageBuffer, saveImage, isStoredImagePath } from '../store/imageStore.js';
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
  editCustomShootImage,
  prepareImageFromUrl,
  getVirtualStudioOptions,
  QUALITY_MODES,
  ASPECT_RATIOS
} from '../services/customShootGenerator.js';
import { getModelById, getModelsDir } from '../store/modelStore.js';
import { getLocationById } from '../store/locationStore.js';
import fs from 'fs/promises';
import path from 'path';

// V3 Services
import {
  analyzeClothingReference,
  analyzeBatch as analyzeClothingBatch,
  buildPromptDescription as buildClothingPromptDescription,
  buildPreservationInstructions
} from '../services/clothingAnalyzer.js';
import {
  analyzeModelReference,
  analyzeMultipleReferences,
  buildIdentityLockInstructions,
  buildNarrativeDescription,
  generateConsistencyMetadata
} from '../services/modelIdentityAnalyzer.js';
import {
  PromptBuilderV3,
  createPromptBuilderV3,
  CAMERA_BODIES,
  LENS_TYPES,
  APERTURE_VALUES,
  FILM_TYPES,
  LIGHTING_SETUPS,
  LIGHTING_QUALITIES
} from '../services/promptBuilderV3.js';
import { requestGeminiImage } from '../providers/geminiClient.js';

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
 * GET /api/custom-shoots/virtual-studio-options
 * Get all Virtual Studio options for the new camera/lighting/reference UI
 */
router.get('/virtual-studio-options', async (req, res) => {
  try {
    const options = getVirtualStudioOptions();
    res.json({
      ok: true,
      options,
      qualityModes: Object.values(QUALITY_MODES),
      aspectRatios: Object.entries(ASPECT_RATIOS).map(([id, config]) => ({ id, ...config }))
    });
  } catch (err) {
    console.error('[CustomShootRoutes] Error getting virtual studio options:', err);
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
    // Use slim=1 query param for faster loading (strips large base64 data)
    const slim = req.query.slim === '1' || req.query.slim === 'true';

    const shoot = await getCustomShootWithImages(req.params.id, { slim });

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
  const startTime = Date.now();
  const shootId = req.params.id;

  console.log(`[CustomShootRoutes] PUT /${shootId} started`);

  try {
    // TIMEOUT: 30 seconds max for PUT operations
    const PUT_TIMEOUT_MS = 30000;

    const updatePromise = updateShootParams(shootId, req.body);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PUT operation timeout after 30 seconds')), PUT_TIMEOUT_MS);
    });

    const updatedShoot = await Promise.race([updatePromise, timeoutPromise]);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[CustomShootRoutes] PUT /${shootId} completed in ${duration}s`);

    res.json({ ok: true, shoot: updatedShoot });
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Handle not found
    if (err.message.includes('not found')) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }

    // Handle timeout
    if (err.message.includes('timeout')) {
      console.error(`[CustomShootRoutes] PUT /${shootId} TIMEOUT after ${duration}s`);
      return res.status(504).json({ ok: false, error: 'Operation timeout', timeout: true });
    }

    console.error(`[CustomShootRoutes] PUT /${shootId} ERROR after ${duration}s:`, err.message);
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
  const requestId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const startTime = Date.now();

  const log = (step, data = {}) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[CustomShootRoutes] [${requestId}] [${elapsed}s] ${step}`,
      Object.keys(data).length > 0 ? JSON.stringify(data) : '');
  };

  log('REQUEST_START', { shootId: req.params.id });

  try {
    log('LOADING_SHOOT');
    const shoot = await getCustomShootById(req.params.id);
    log('SHOOT_LOADED', { found: !!shoot });

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
      clothingImages: reqClothingImages,

      // ═══════════════════════════════════════════════════════════════
      // NEW: Universe Parameters (Custom Shoot 4 architecture)
      // ═══════════════════════════════════════════════════════════════
      universeParams, // Full universe configuration for Custom Shoot 4

      // ═══════════════════════════════════════════════════════════════
      // V6: Style Preset Parameters (AI Director mode)
      // ═══════════════════════════════════════════════════════════════
      v6Mode,         // Boolean flag for V6 mode
      styleParams,    // { presetId, naturalPrompt, antiAiDirectives, technicalParams }
      variationId,    // V6: Selected variation (sub-preset) ID
      // Note: emotionId is already extracted above in common params

      // ═══════════════════════════════════════════════════════════════
      // Virtual Studio Parameters (legacy)
      // ═══════════════════════════════════════════════════════════════
      virtualCamera,  // { focalLength, aperture, shutterSpeed }
      lighting,       // { primarySource, secondarySource, modifier }
      qualityMode,    // 'DRAFT' | 'PRODUCTION'
      mood            // string for atmosphere/feeling
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
      extraPrompt: extraPrompt?.slice(0, 50),
      // Universe params (Custom Shoot 4)
      universeParams: universeParams ? Object.keys(universeParams).length + ' keys' : null,
      // Virtual Studio params (legacy)
      virtualCamera,
      lighting,
      qualityMode,
      mood
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

    // Prepare clothing images and descriptions (supports both old and new formats)
    let clothingImages = [];
    let clothingDescriptions = [];
    let clothingItemPrompts = []; // NEW: prompts per clothing item
    let lookPrompt = ''; // NEW: overall look prompt

    if (reqClothingImages && Array.isArray(reqClothingImages)) {
      clothingImages = reqClothingImages;
    } else if (shoot.clothing?.length > 0) {
      for (const clothing of shoot.clothing) {
        // NEW FORMAT: clothing.items (array of ClothingItem with grouped images)
        if (clothing.items && Array.isArray(clothing.items)) {
          for (const item of clothing.items) {
            // Collect prompt for this item
            if (item.prompt && item.prompt.trim()) {
              clothingItemPrompts.push({
                name: item.name || '',
                prompt: item.prompt.trim()
              });
            }
            // Collect all images from this item
            if (item.images && Array.isArray(item.images)) {
              for (const imgRef of item.images) {
                const img = await prepareImageFromUrl(imgRef.url);
                if (img) {
                  clothingImages.push(img);
                  // Use item prompt for all images of this item
                  if (item.prompt && item.prompt.trim()) {
                    clothingDescriptions.push(item.prompt.trim());
                  }
                }
              }
            }
          }
        }
        // OLD FORMAT: clothing.refs (flat array of images)
        else if (clothing.refs && Array.isArray(clothing.refs)) {
          for (const ref of clothing.refs) {
            const img = await prepareImageFromUrl(ref.url);
            if (img) {
              clothingImages.push(img);
              if (ref.description && ref.description.trim()) {
                clothingDescriptions.push(ref.description.trim());
              }
            }
          }
        }
      }
    }

    // Collect look prompt (overall outfit style)
    if (shoot.lookPrompts && Array.isArray(shoot.lookPrompts)) {
      // Use first non-empty look prompt (for primary model)
      const firstLookPrompt = shoot.lookPrompts.find(lp => lp.prompt && lp.prompt.trim());
      if (firstLookPrompt) {
        lookPrompt = firstLookPrompt.prompt.trim();
      }
    }

    // Prepare style reference image
    let styleRefImage = null;
    let styleRefParams = null; // NEW: Params of the reference frame

    if (shoot.locks?.style?.enabled && shoot.locks.style.sourceImageUrl) {
      styleRefImage = await prepareImageFromUrl(shoot.locks.style.sourceImageUrl);

      // Also fetch the paramsSnapshot from the source image
      if (shoot.locks.style.sourceImageId) {
        const sourceImg = shoot.generatedImages?.find(img => img.id === shoot.locks.style.sourceImageId);
        console.log('[CustomShootRoutes] Style Lock source image:', {
          found: !!sourceImg,
          hasParamsSnapshot: !!sourceImg?.paramsSnapshot,
          hasResolvedV5Params: !!sourceImg?.paramsSnapshot?.resolvedV5Params
        });
        if (sourceImg?.paramsSnapshot?.resolvedV5Params) {
          styleRefParams = sourceImg.paramsSnapshot.resolvedV5Params;
          console.log('[CustomShootRoutes] Found V5 params snapshot for style reference:', Object.keys(styleRefParams));
        } else {
          console.log('[CustomShootRoutes] No V5 params in style reference (legacy image or not V5)');
        }
      }
    }

    // Location Lock removed - location is now implied in Style Lock
    // If Style Lock is enabled, location from the reference image will be used

    console.log('[CustomShootRoutes] Prepared refs:', {
      identity: identityImages.length,
      clothing: clothingImages.length,
      styleRef: !!styleRefImage,
      styleLockActive: !!styleRefImage && shoot.locks?.style?.enabled,
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
    // IMPORTANT: If Style Lock is enabled, skip location sketch - location is already implied in style reference
    const isStyleLockEnabled = shoot.locks?.style?.enabled && styleRefImage;
    let locationSketchImage = null;

    if (isStyleLockEnabled) {
      console.log('[CustomShootRoutes] Style Lock is enabled - skipping location sketch (location implied in style reference)');
    } else if (location) {
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

    // Clothing collage: HIGH quality, CONTAIN to show full garments without cropping
    if (clothingImages.length > 0) {
      clothingCollage = await buildCollage(clothingImages, {
        maxSize: 1536,      // Large for clothing details
        maxCols: 2,         // Fewer columns = bigger images
        minTile: 512,       // Large tiles
        jpegQuality: 95,    // High quality
        fit: 'contain',     // IMPORTANT: show full garment, don't crop
        background: '#ffffff'
      });
    }

    // Track generation time
    const genStartTime = Date.now();

    log('GENERATING', {
      identityImages: identityImages.length,
      clothingImages: clothingImages.length,
      hasStyleRef: !!styleRefImage,
      styleLockActive: isStyleLockEnabled,
      hasLocationSketch: !!locationSketchImage,
      hasPoseSketch: !!poseSketchImage
    });

    // Generate
    const result = await generateCustomShootFrame({
      shoot,
      identityImages,
      clothingImages,
      clothingDescriptions, // detailed clothing descriptions per image
      clothingItemPrompts,  // NEW: prompts grouped by clothing item
      lookPrompt,           // NEW: overall outfit style prompt
      styleRefImage,
      styleRefParams, // NEW: pass reference params
      // locationRefImage removed - Location Lock functionality removed, location implied in Style Lock
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
      ambient,

      // ═══════════════════════════════════════════════════════════════
      // Universe Parameters (Custom Shoot 4 architecture)
      // ═══════════════════════════════════════════════════════════════
      universeParams,

      // ═══════════════════════════════════════════════════════════════
      // V6: Style Preset Parameters (AI Director mode)
      // ═══════════════════════════════════════════════════════════════
      v6Mode,
      styleParams,
      variationId,  // V6: Selected variation (sub-preset) ID

      // ═══════════════════════════════════════════════════════════════
      // Virtual Studio Parameters (legacy architecture)
      // ═══════════════════════════════════════════════════════════════
      virtualCamera,
      lighting,
      qualityMode: qualityMode || 'DRAFT',
      mood: mood || 'natural'
    });

    const genDuration = ((Date.now() - genStartTime) / 1000).toFixed(1);

    log('GENERATION_COMPLETE', { ok: result.ok, duration: genDuration });

    if (!result.ok) {
      log('GENERATION_FAILED', { error: result.error?.slice(0, 200) });
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
        label: 'Style Lock (включает локацию)',
        previewUrl: `data:${styleRefImage.mimeType};base64,${styleRefImage.base64}`
      });
    }
    // Location Lock removed - location is implied in Style Lock
    // Location sketch is only added if Style Lock is NOT active
    if (locationSketchImage && !isStyleLockEnabled) {
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
      // IMPORTANT: Save refs WITHOUT previewUrl to prevent JSON bloat
      // Each base64 preview is ~800KB, causing 120MB+ JSON files
      refs: refs.map(r => ({ kind: r.kind, label: r.label })),
      generationTime: genDuration,
      // CRITICAL: Save paramsSnapshot with resolvedV5Params for Style Lock Variation Mode
      paramsSnapshot: result.paramsSnapshot || null,
      // Universe params snapshot for "copy settings" feature
      // PREFER resolvedParams from V5 engine (includes defaults), fallback to input params
      universeParams: result.promptJson?.resolvedParams || universeParams || null
    };

    log('SAVING_IMAGE', { imageId: imageData.id });
    const savedImage = await addImageToShoot(shoot.id, imageData);
    log('IMAGE_SAVED', { savedId: savedImage.id });

    // Return the original data URL for immediate display (not the stored path)
    const responseImage = {
      ...savedImage,
      imageUrl: imageData.imageUrl  // Use original data URL, not the saved path
    };

    log('SENDING_RESPONSE');
    res.json({
      ok: true,
      image: responseImage,
      prompt: result.prompt,
      refs
    });
    log('RESPONSE_SENT');

  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[CustomShootRoutes] [${requestId}] [${elapsed}s] ERROR:`, err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/custom-shoots/:id/edit-image
 * Edit an existing image with text instruction
 */
router.post('/:id/edit-image', async (req, res) => {
  const requestId = `edit_${Date.now()}`;
  const shootId = req.params.id;
  const { imageId, instruction } = req.body;

  console.log(`[CustomShootRoutes] [${requestId}] EDIT Request for shoot ${shootId}`, { imageId, instruction });

  try {
    const shoot = await getCustomShootById(shootId);
    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }

    if (!imageId || !instruction) {
      return res.status(400).json({ ok: false, error: 'Missing imageId or instruction' });
    }

    const result = await editCustomShootImage({
      shoot,
      imageId,
      instruction
    });

    if (!result.ok) {
      return res.status(500).json({ ok: false, error: result.error });
    }

    // The processed output from customShootGenerator (editCustomShootImage)
    // returns { ok: true, data: { base64, mimeType, ...imgMetadata } }
    const { base64, mimeType, ...imgMetadata } = result.data;
    const newImageId = imgMetadata.id;

    // 1. Save binary to disk
    const dataUrl = `data:${mimeType};base64,${base64}`;
    const saveResult = await saveImage(shootId, newImageId, dataUrl);

    if (!saveResult.ok) {
      throw new Error(`Failed to save image: ${saveResult.error}`);
    }

    // 2. Add record to shoot
    // imgMetadata has the new ID and all source props. 
    // We set the proper imageUrl to the saved path.
    const imageRecord = {
      ...imgMetadata,
      imageUrl: saveResult.filePath  // Stored path: "SHOOTID/img.jpg"
    };

    await addImageToShoot(shootId, imageRecord);

    // 3. Return response with accessible URL
    // We constructed '/api/images/' prefix logic earlier
    // Or we can return Data URL for immediate display
    const responseImage = {
      ...imageRecord,
      imageUrl: dataUrl // Send Data URL for immediate display
    };

    res.json({
      ok: true,
      image: responseImage
    });

  } catch (e) {
    console.error(`[Edit] Error:`, e);
    res.status(500).json({ ok: false, error: e.message });
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
// UPSCALE ENDPOINT (Nano Banana Pro — Texture Enhancement)
// ═══════════════════════════════════════════════════════════════

import sharp from 'sharp';
import { requestGeminiImage } from '../providers/geminiClient.js';

/**
 * Upscale prompt for Nano Banana Pro - photorealistic texture enhancement
 * Focuses on micro-details while preserving identity and original grading
 */
const UPSCALE_TEXTURE_PROMPT = `Усиль фотореализм с высокой точностью микродеталей, корректируя только элементы, которые выглядят сломанными или искажёнными ИИ, при этом полностью сохраняя идентичность субъекта и исходную сцену/изделие.

Лицо / кожа:
Усиль все лицевые несовершенства с высокой точностью микродеталей: аутентичные поры, тонкие вариации текстуры, мелкие морщины, микротрещины, естественную асимметрию, едва заметные шрамы, веснушки, пушковые волосы и реальные неровности поверхности кожи. Усиль реалистичную материальную реакцию кожи — корректное разделение матовых и жирных зон, естественную спекулярность и микротени — без добавления сглаживания, смягчения, "beauty"-ретуши или пластиковых артефактов. Корректируй только искажённые или сломанные элементы, при этом полностью сохраняя идентичность субъекта и естественную асимметрию.

Глаза / веки / ресницы:
Усиль глаза с высокой достоверностью микродеталей: чёткую текстуру радужки, естественные радиальные паттерны, тонкие хроматические вариации и корректную реакцию подповерхностного рассеяния света. Доработай веки, ресницы и слёзные каналы с анатомической точностью — точное разделение ресниц, естественный уровень влажности, микротени и реалистичную полупрозрачность. Сохраняй подлинную асимметрию и избегай искусственного свечения, чрезмерной резкости и пластикового блеска. Корректируй только искажённые или сломанные элементы, полностью сохраняя идентичность субъекта.

Текстуры / ткани / материалы / поверхности:
Усиль реализм текстур и материалов с высокой точностью микродеталей: прояви реальную структуру ткани и поверхностей — видимое переплетение нитей, микроволокна, ворс/пушок, лёгкий пилинг, микрозаломы, естественные складки, микрорастяжения по швам, деликатную неоднородность плотности и фактуры. Для принтов, вышивки и рисунков — сохрани точное соответствие исходнику: без смещения паттерна, без деформации логотипов/надписей, без "перерисовки" орнамента и без подмены материала.

Усиль физически правдоподобную материальную реакцию каждого материала: корректное разделение roughness/глянца, естественную спекулярность, микротени в складках и по рельефу, реалистичную анизотропию для сатина/шёлка, правильную полупрозрачность для тонких тканей, натуральную глубину и пористость для кожи/замши, микросколы/царапины/патину для металла, микропыль/следы касаний только там, где это уместно и правдоподобно. Избегай "пластикового" блеска, чрезмерной резкости, искусственного свечения и любых признаков нейросетевого сглаживания.

Корректируй только AI-поломки: швы, края, стежки, пуговицы/молнии, стыки материалов, повторяющиеся "тайлы", неестественные узоры, странные заломы, шум-заменители текстуры, "плавающие" края, разрывы ткани и артефакты на поверхности. Полностью сохраняй идентичность изделия и исходную геометрию: крой, силуэт, посадку, пропорции, толщину ткани, направление нитей и складок — без изменения дизайна.

Жёсткие ограничения (обязательные):
— Не добавлять сглаживание, смягчение, beauty-ретушь, "фарфоровую" кожу, пластиковый блеск, искусственное свечение.
— Не менять черты лица, форму глаз, расстояния/пропорции, выражение, возраст, макияж (если он есть) и любые признаки идентичности.
— Не менять материал/паттерн/фурнитуру/крой одежды и поверхностей; не "улучшать" дизайн.
— Не повышать резкость глобально; микродетали должны выглядеть как физическая фактура, а не как oversharpen.
— Не добавлять новых объектов, не менять фон, не менять освещение концептуально — только чинить поломки.

Цвет / грейд (строго):
СТРОГО СОХРАНЯЙ исходную цветокоррекцию точно в том виде, как во входном изображении: не менять баланс белого, оттенки, контраст, насыщенность, тональную кривую, общий грейд и характер света/цвета. Все улучшения должны происходить только в микротекстуре и физике материалов/кожи, без "перекраски" кадра.

Output: 4K resolution enhanced version of the EXACT same image.`;

/**
 * POST /api/custom-shoots/:id/upscale
 * Upscale an image to 4K with texture enhancement via Nano Banana Pro
 * Body: { imageBase64: string, mimeType: string, targetSize?: '2K' | '4K' }
 */
router.post('/:id/upscale', async (req, res) => {
  try {
    const { imageBase64, mimeType, targetSize = '4K' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ ok: false, error: 'imageBase64 is required' });
    }

    // Get original dimensions for logging
    const inputBuffer = Buffer.from(imageBase64, 'base64');
    const metadata = await sharp(inputBuffer).metadata();
    const originalWidth = metadata.width || 1024;
    const originalHeight = metadata.height || 1024;

    // Determine aspect ratio from original image
    const ratio = originalWidth / originalHeight;
    let aspectRatio;

    if (ratio >= 1.7) {
      aspectRatio = '16:9';
    } else if (ratio >= 1.2) {
      aspectRatio = '4:3';
    } else if (ratio >= 0.9) {
      aspectRatio = '1:1';
    } else if (ratio >= 0.65) {
      aspectRatio = '3:4';
    } else {
      aspectRatio = '9:16';
    }

    console.log(`[CustomShootRoutes] Upscaling image ${originalWidth}x${originalHeight} (ratio: ${ratio.toFixed(2)}) → aspect: ${aspectRatio}, target: ${targetSize}`);

    // Call Gemini with texture enhancement prompt
    const result = await requestGeminiImage({
      prompt: UPSCALE_TEXTURE_PROMPT,
      referenceImages: [{
        mimeType: mimeType || 'image/jpeg',
        base64: imageBase64
      }],
      imageConfig: {
        aspectRatio,
        imageSize: targetSize
      }
    });

    if (!result.ok) {
      console.error('[CustomShootRoutes] Gemini upscale failed:', result.error);

      // Fallback to sharp if Gemini fails
      console.log('[CustomShootRoutes] Falling back to sharp upscale...');
      const scale = targetSize === '4K' ? 4 : 2;
      const newWidth = Math.round(originalWidth * scale);
      const newHeight = Math.round(originalHeight * scale);

      const outputBuffer = await sharp(inputBuffer)
        .resize(newWidth, newHeight, { kernel: 'lanczos3' })
        .jpeg({ quality: 95 })
        .toBuffer();

      const outputBase64 = outputBuffer.toString('base64');
      const outputUrl = `data:image/jpeg;base64,${outputBase64}`;

      return res.json({
        ok: true,
        data: {
          imageUrl: outputUrl,
          width: newWidth,
          height: newHeight,
          method: 'sharp_fallback'
        }
      });
    }

    // Get upscaled dimensions
    const upscaledBuffer = Buffer.from(result.base64, 'base64');
    const upscaledMeta = await sharp(upscaledBuffer).metadata();

    const outputUrl = `data:${result.mimeType || 'image/jpeg'};base64,${result.base64}`;

    console.log(`[CustomShootRoutes] ✅ Upscaled via Gemini: ${originalWidth}x${originalHeight} → ${upscaledMeta.width}x${upscaledMeta.height}`);

    res.json({
      ok: true,
      data: {
        imageUrl: outputUrl,
        width: upscaledMeta.width,
        height: upscaledMeta.height,
        method: 'gemini'
      }
    });

  } catch (error) {
    console.error('[CustomShootRoutes] Error upscaling image:', error);
    res.status(500).json({ ok: false, error: error.message });
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

// ═══════════════════════════════════════════════════════════════
// V3 ANALYSIS ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/custom-shoots/analyze-model
 * Analyze a model reference image for identity markers
 */
router.post('/analyze-model', async (req, res) => {
  try {
    const { image, imageUrl, useCache = true } = req.body;

    let imageData = null;

    // Handle base64 image data
    if (image?.base64) {
      imageData = {
        mimeType: image.mimeType || 'image/jpeg',
        base64: image.base64
      };
    }
    // Handle data URL
    else if (imageUrl?.startsWith('data:')) {
      const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        imageData = {
          mimeType: match[1],
          base64: match[2]
        };
      }
    }
    // Handle stored image path
    else if (imageUrl && isStoredImagePath(imageUrl)) {
      const result = await loadImageBuffer(imageUrl);
      if (result.ok) {
        imageData = {
          mimeType: result.mimeType,
          base64: result.buffer.toString('base64')
        };
      }
    }

    if (!imageData) {
      return res.status(400).json({ ok: false, error: 'No valid image provided' });
    }

    console.log('[V3] Analyzing model reference...');
    const result = await analyzeModelReference(imageData, { useCache });

    if (!result.ok) {
      return res.status(500).json({ ok: false, error: result.error });
    }

    // Build prompt components
    const identityLockInstructions = buildIdentityLockInstructions(result.analysis);
    const narrativeDescription = buildNarrativeDescription(result.analysis);
    const consistencyMetadata = generateConsistencyMetadata(result.analysis);

    res.json({
      ok: true,
      analysis: result.analysis,
      fromCache: result.fromCache,
      promptComponents: {
        identityLockInstructions,
        narrativeDescription
      },
      consistencyMetadata
    });

  } catch (err) {
    console.error('[V3] Error analyzing model:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/custom-shoots/analyze-clothing
 * Analyze a clothing reference image for exact reproduction
 */
router.post('/analyze-clothing', async (req, res) => {
  try {
    const { image, imageUrl, useCache = true } = req.body;

    let imageData = null;

    // Handle base64 image data
    if (image?.base64) {
      imageData = {
        mimeType: image.mimeType || 'image/jpeg',
        base64: image.base64
      };
    }
    // Handle data URL
    else if (imageUrl?.startsWith('data:')) {
      const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        imageData = {
          mimeType: match[1],
          base64: match[2]
        };
      }
    }
    // Handle stored image path
    else if (imageUrl && isStoredImagePath(imageUrl)) {
      const result = await loadImageBuffer(imageUrl);
      if (result.ok) {
        imageData = {
          mimeType: result.mimeType,
          base64: result.buffer.toString('base64')
        };
      }
    }

    if (!imageData) {
      return res.status(400).json({ ok: false, error: 'No valid image provided' });
    }

    console.log('[V3] Analyzing clothing reference...');
    const result = await analyzeClothingReference(imageData, { useCache });

    if (!result.ok) {
      return res.status(500).json({ ok: false, error: result.error });
    }

    // Build prompt components
    const promptDescription = buildClothingPromptDescription(result.analysis);
    const preservationInstructions = buildPreservationInstructions(result.analysis);

    res.json({
      ok: true,
      analysis: result.analysis,
      fromCache: result.fromCache,
      promptComponents: {
        promptDescription,
        preservationInstructions
      }
    });

  } catch (err) {
    console.error('[V3] Error analyzing clothing:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/custom-shoots/v3-options
 * Get all V3 generation options for UI
 */
router.get('/v3-options', async (req, res) => {
  try {
    res.json({
      ok: true,
      options: {
        cameras: Object.entries(CAMERA_BODIES).map(([id, cam]) => ({
          id,
          label: cam.label
        })),
        lenses: Object.entries(LENS_TYPES).map(([id, lens]) => ({
          id,
          label: lens.label
        })),
        apertures: Object.entries(APERTURE_VALUES).map(([id, ap]) => ({
          id,
          label: ap.label
        })),
        filmTypes: Object.entries(FILM_TYPES).map(([id, film]) => ({
          id,
          label: film.label
        })),
        lightingSetups: Object.entries(LIGHTING_SETUPS).map(([id, setup]) => ({
          id,
          label: setup.label
        })),
        lightingQualities: Object.entries(LIGHTING_QUALITIES).map(([id, quality]) => ({
          id,
          label: quality.label
        }))
      }
    });
  } catch (err) {
    console.error('[V3] Error getting options:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// V3 GENERATION ENDPOINT
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/custom-shoots/:id/generate-v3
 * Generate an image using V3 structured prompts with Vision API analysis
 */
router.post('/:id/generate-v3', async (req, res) => {
  try {
    const shoot = await getCustomShootById(req.params.id);

    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }

    const {
      // V3 specific params
      modelAnalysis,
      clothingAnalyses,
      identityLockStrength = 'strict',

      // Photo realism settings
      camera = 'contax_t2',
      lens = '85mm',
      aperture = 'f2.8',
      filmType = 'portra_400',
      shutterSpeed,
      iso,

      // Atmospheric settings
      location,
      lightingSetup = 'natural_window',
      lightingQuality = 'soft',
      timeOfDay,
      weather,
      mood,
      colorTemperature,

      // Composition settings
      shotSize = 'medium_closeup',
      cameraAngle = 'eye_level',
      poseType,
      poseDescription,
      handPlacement,
      gazeDirection = 'camera',
      focusPoint = 'eyes',

      // Frame reference
      frame,

      // Technical
      aspectRatio = '3:4',
      imageSize = '2K',

      // Extra
      extraPrompt,

      // Identity/clothing images (if not using pre-analyzed)
      identityImages: reqIdentityImages,
      clothingImages: reqClothingImages
    } = req.body;

    console.log('[V3] Generate request for shoot:', shoot.id);

    // Prepare identity images
    let identityImages = [];
    if (reqIdentityImages && Array.isArray(reqIdentityImages)) {
      identityImages = reqIdentityImages;
    } else if (shoot.models?.length > 0) {
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
              console.warn(`[V3] Could not read identity image: ${filePath}`);
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
            if (img) {
              clothingImages.push(img);
            }
          }
        }
      }
    }

    // Run analyses if not provided
    let effectiveModelAnalysis = modelAnalysis;
    let effectiveClothingAnalyses = clothingAnalyses || [];

    // Analyze model if we have images but no analysis
    if (!effectiveModelAnalysis && identityImages.length > 0) {
      console.log('[V3] Running model identity analysis...');
      const modelResult = await analyzeMultipleReferences(identityImages);
      if (modelResult.ok) {
        effectiveModelAnalysis = modelResult.analysis;
      }
    }

    // Analyze clothing if we have images but no analyses
    if (effectiveClothingAnalyses.length === 0 && clothingImages.length > 0) {
      console.log('[V3] Running clothing analysis...');
      const clothingResults = await analyzeClothingBatch(clothingImages);
      effectiveClothingAnalyses = clothingResults
        .filter(r => r.ok)
        .map(r => r.analysis);
    }

    // Build V3 prompt
    const builder = createPromptBuilderV3();

    // Block 1: Hard Constraints
    builder.setTechnicalRequirements(aspectRatio, imageSize);
    builder.addPhotorealismRules();

    if (effectiveModelAnalysis) {
      builder.setIdentityLock(effectiveModelAnalysis, identityLockStrength);
    }

    if (effectiveClothingAnalyses.length > 0) {
      builder.setClothingLock(effectiveClothingAnalyses);
    }

    // Block 2: Photo Realism
    builder.setCamera(camera);
    builder.setLens(lens);
    builder.setAperture(aperture);
    builder.setFilmType(filmType);
    if (shutterSpeed) builder.setShutterSpeed(shutterSpeed);
    if (iso) builder.setISO(iso);

    // Block 3: Visual Identity
    if (effectiveModelAnalysis) {
      builder.setModelDescription(buildNarrativeDescription(effectiveModelAnalysis));
    }
    if (effectiveClothingAnalyses.length > 0) {
      builder.setClothingDescriptions(
        effectiveClothingAnalyses.map(a => buildClothingPromptDescription(a))
      );
    }

    // Block 4: Atmospheric
    if (location) builder.setLocation(location);
    builder.setLightingSetup(lightingSetup);
    builder.setLightingQuality(lightingQuality);
    if (timeOfDay) builder.setTimeOfDay(timeOfDay);
    if (weather) builder.setWeather(weather);
    if (mood) builder.setMood(mood);
    if (colorTemperature) builder.setColorTemperature(colorTemperature);

    // Block 5: Composition
    builder.setShotSize(shotSize);
    builder.setCameraAngle(cameraAngle);
    if (poseType) builder.setPoseType(poseType);
    if (poseDescription) builder.setPoseDescription(poseDescription);
    if (handPlacement) builder.setHandPlacement(handPlacement);
    builder.setGazeDirection(gazeDirection);
    builder.setFocusPoint(focusPoint);

    // Block 6: Quality Gates
    builder.addQualityGates();

    // Extra prompt
    if (extraPrompt) {
      builder.hardConstraints.push(`\nADDITIONAL INSTRUCTIONS: ${extraPrompt}`);
    }

    // Validate
    const validation = builder.validateConflicts();
    if (!validation.valid) {
      console.warn('[V3] Prompt conflicts:', validation.conflicts);
    }

    // Build final prompt
    const promptText = builder.toText();
    const promptJson = builder.build();

    console.log('[V3] Prompt built, length:', promptText.length);

    // Prepare reference images for generation
    const referenceImages = [];

    // Add identity images
    if (identityImages.length > 0) {
      // Build collage for identity
      const { buildCollage } = await import('../utils/imageCollage.js');
      const identityCollage = await buildCollage(identityImages, {
        maxSize: 1536,
        maxCols: 2,
        minTile: 512,
        jpegQuality: 95
      });
      if (identityCollage) {
        referenceImages.push(identityCollage);
      }
    }

    // Add clothing images (separately for quality)
    for (const clothingImg of clothingImages) {
      referenceImages.push(clothingImg);
    }

    // Add pose sketch if available
    const effectiveFrame = frame || shoot.currentFrame;
    if (effectiveFrame) {
      const sketchUrl = effectiveFrame.sketchUrl || effectiveFrame.sketchAsset?.url;
      if (sketchUrl?.startsWith('data:')) {
        const match = sketchUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          referenceImages.push({ mimeType: match[1], base64: match[2] });
        }
      }
    }

    console.log(`[V3] Sending ${referenceImages.length} reference images`);

    // Track generation time
    const genStartTime = Date.now();

    // Call Gemini
    const result = await requestGeminiImage({
      prompt: promptText,
      referenceImages,
      imageConfig: { aspectRatio, imageSize }
    });

    const genDuration = ((Date.now() - genStartTime) / 1000).toFixed(1);

    if (!result.ok) {
      console.error('[V3] Generation failed:', result.error);
      return res.status(500).json({ ok: false, error: result.error });
    }

    console.log(`[V3] Generation successful in ${genDuration}s`);

    // Build image data
    const imageData = {
      id: generateImageId(),
      imageUrl: `data:${result.mimeType};base64,${result.base64}`,
      frameId: effectiveFrame?.id || null,
      frameLabel: effectiveFrame?.label || 'V3 Generation',
      aspectRatio,
      imageSize,
      // V3 specific metadata
      v3: true,
      camera,
      lens,
      aperture,
      filmType,
      lightingSetup,
      lightingQuality,
      shotSize,
      cameraAngle,
      gazeDirection,
      identityLockStrength,
      hasModelAnalysis: !!effectiveModelAnalysis,
      clothingCount: effectiveClothingAnalyses.length,
      prompt: promptText,
      generationTime: genDuration
    };

    // Save to shoot history
    const savedImage = await addImageToShoot(shoot.id, imageData);

    res.json({
      ok: true,
      image: {
        ...savedImage,
        imageUrl: imageData.imageUrl
      },
      prompt: promptText,
      promptJson,
      validation,
      analyses: {
        model: effectiveModelAnalysis ? { summary: effectiveModelAnalysis.identitySummary } : null,
        clothing: effectiveClothingAnalyses.map(a => ({ type: a.garmentType, color: a.primaryColor?.name }))
      }
    });

  } catch (err) {
    console.error('[V3] Error generating:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

