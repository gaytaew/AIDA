/**
 * Shoot Routes
 * 
 * API endpoints for managing shoots and the Shoot Composer flow.
 */

import express from 'express';
import {
  getAllShoots,
  getShootById,
  createShoot,
  updateShoot,
  deleteShoot,
  addModelToShoot,
  removeModelFromShoot,
  setClothingForModel,
  setOutfitAvatarForModel,
  addFrameToShoot,
  removeFrameFromShoot,
  setUniverseForShoot,
  addGeneratedImageToShoot,
  getGeneratedImagesForShoot,
  removeGeneratedImageFromShoot,
  clearGeneratedImagesFromShoot
} from '../store/shootStore.js';
import {
  generateOutfitAvatar,
  isOutfitAvatarRequired,
  packClothingToCollage
} from '../services/outfitAvatarService.js';
import { getModelById } from '../store/modelStore.js';
import { getUniverseById } from '../store/universeStore.js';
import { getFrameById } from '../store/frameStore.js';
import {
  DEFAULT_GLOBAL_SETTINGS,
  FRAME_COMPOSITION_OPTIONS,
  shouldRequireOutfitAvatar
} from '../schema/shootConfig.js';
import { buildCollage } from '../utils/imageCollage.js';
import { convertGeminiImageToJpeg } from '../utils/imageConverter.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
// BASIC CRUD
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/shoots — List all shoots
 */
router.get('/', async (req, res) => {
  try {
    const shoots = await getAllShoots();
    res.json({ ok: true, data: shoots });
  } catch (error) {
    console.error('[ShootRoutes] Error listing shoots:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * GET /api/shoots/options — Get available options for shoot fields
 */
router.get('/options', (req, res) => {
  res.json({
    ok: true,
    data: {
      frameComposition: FRAME_COMPOSITION_OPTIONS,
      aspectRatios: ['3:4', '1:1', '4:3', '9:16', '16:9'],
      imageSizes: ['1K', '2K', '4K'],
      maxModels: 3
    }
  });
});

/**
 * GET /api/shoots/:id — Get shoot by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const shoot = await getShootById(req.params.id);
    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    res.json({ ok: true, data: shoot });
  } catch (error) {
    console.error('[ShootRoutes] Error getting shoot:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/shoots — Create new shoot
 */
router.post('/', async (req, res) => {
  try {
    const result = await createShoot(req.body);
    if (!result.success) {
      return res.status(400).json({ ok: false, errors: result.errors });
    }
    res.status(201).json({ ok: true, data: result.shoot });
  } catch (error) {
    console.error('[ShootRoutes] Error creating shoot:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * PUT /api/shoots/:id — Update shoot
 */
router.put('/:id', async (req, res) => {
  try {
    const result = await updateShoot(req.params.id, req.body);
    if (!result.success) {
      return res.status(400).json({ ok: false, errors: result.errors });
    }
    res.json({ ok: true, data: result.shoot });
  } catch (error) {
    console.error('[ShootRoutes] Error updating shoot:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * DELETE /api/shoots/:id — Delete shoot
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteShoot(req.params.id);
    if (!result.success) {
      return res.status(404).json({ ok: false, errors: result.errors });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('[ShootRoutes] Error deleting shoot:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// SHOOT BUILDING ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/shoots/:id/universe — Set universe for shoot
 */
router.post('/:id/universe', async (req, res) => {
  try {
    const { universeId } = req.body;
    
    let universe = null;
    if (universeId) {
      universe = await getUniverseById(universeId);
      if (!universe) {
        return res.status(404).json({ ok: false, error: 'Universe not found' });
      }
    }
    
    const result = await setUniverseForShoot(req.params.id, universe);
    if (!result.success) {
      return res.status(400).json({ ok: false, errors: result.errors });
    }
    
    res.json({ ok: true, data: result.shoot });
  } catch (error) {
    console.error('[ShootRoutes] Error setting universe:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/shoots/:id/models — Add model to shoot
 */
router.post('/:id/models', async (req, res) => {
  try {
    const { modelId } = req.body;
    
    const model = await getModelById(modelId);
    if (!model) {
      return res.status(404).json({ ok: false, error: 'Model not found' });
    }
    
    const modelData = {
      modelId: model.id,
      refs: model.imageFiles?.map(f => ({
        assetId: f,
        url: `/api/models/images/${model.id}/${f}`
      })) || []
    };
    
    const result = await addModelToShoot(req.params.id, modelData);
    if (!result.success) {
      return res.status(400).json({ ok: false, errors: result.errors });
    }
    
    res.json({ ok: true, data: result.shoot });
  } catch (error) {
    console.error('[ShootRoutes] Error adding model:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * DELETE /api/shoots/:id/models/:modelId — Remove model from shoot
 */
router.delete('/:id/models/:modelId', async (req, res) => {
  try {
    const result = await removeModelFromShoot(req.params.id, req.params.modelId);
    if (!result.success) {
      return res.status(400).json({ ok: false, errors: result.errors });
    }
    res.json({ ok: true, data: result.shoot });
  } catch (error) {
    console.error('[ShootRoutes] Error removing model:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/shoots/:id/clothing — Set clothing for a model
 * Body: { modelIndex: number, images: Array<{mimeType, base64, note?}> }
 */
router.post('/:id/clothing', async (req, res) => {
  try {
    const { modelIndex, images } = req.body;
    
    if (modelIndex === undefined || modelIndex < 0) {
      return res.status(400).json({ ok: false, error: 'Invalid modelIndex' });
    }
    
    const clothingRefs = (images || []).map((img, idx) => ({
      assetId: `clothing-${modelIndex}-${idx}`,
      url: `data:${img.mimeType};base64,${img.base64}`,
      note: img.note || ''
    }));
    
    const result = await setClothingForModel(req.params.id, modelIndex, clothingRefs);
    if (!result.success) {
      return res.status(400).json({ ok: false, errors: result.errors });
    }
    
    res.json({ ok: true, data: result.shoot });
  } catch (error) {
    console.error('[ShootRoutes] Error setting clothing:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/shoots/:id/frames — Add frame to shoot
 */
router.post('/:id/frames', async (req, res) => {
  try {
    const { frameId, ...overrides } = req.body;
    
    const frame = await getFrameById(frameId);
    if (!frame) {
      return res.status(404).json({ ok: false, error: 'Frame not found' });
    }
    
    const frameData = {
      frameId: frame.id,
      extraPrompt: overrides.extraPrompt || '',
      styleVariant: overrides.styleVariant || null,
      composition: overrides.composition || null,
      lightOverride: overrides.lightOverride || null,
      effectsNotes: overrides.effectsNotes || '',
      emotionNotes: overrides.emotionNotes || '',
      poseOverride: overrides.poseOverride || '',
      refsOverride: overrides.refsOverride || []
    };
    
    const result = await addFrameToShoot(req.params.id, frameData);
    if (!result.success) {
      return res.status(400).json({ ok: false, errors: result.errors });
    }
    
    res.json({ ok: true, data: result.shoot });
  } catch (error) {
    console.error('[ShootRoutes] Error adding frame:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * DELETE /api/shoots/:id/frames/:frameId — Remove frame from shoot
 */
router.delete('/:id/frames/:frameId', async (req, res) => {
  try {
    const result = await removeFrameFromShoot(req.params.id, req.params.frameId);
    if (!result.success) {
      return res.status(400).json({ ok: false, errors: result.errors });
    }
    res.json({ ok: true, data: result.shoot });
  } catch (error) {
    console.error('[ShootRoutes] Error removing frame:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// OUTFIT AVATAR GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/shoots/:id/outfit-avatar — Generate outfit avatar for a model
 * Body: { modelIndex: number }
 */
router.post('/:id/outfit-avatar', async (req, res) => {
  try {
    const { modelIndex } = req.body;
    const shoot = await getShootById(req.params.id);
    
    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    
    if (modelIndex === undefined || modelIndex < 0 || modelIndex >= shoot.models.length) {
      return res.status(400).json({ ok: false, error: 'Invalid modelIndex' });
    }
    
    // Get model data
    const shootModel = shoot.models[modelIndex];
    const model = await getModelById(shootModel.modelId);
    if (!model) {
      return res.status(404).json({ ok: false, error: 'Model not found' });
    }
    
    // Get clothing for this model
    const clothing = shoot.clothing?.find(c => c.forModelIndex === modelIndex);
    if (!clothing || !clothing.refs || clothing.refs.length === 0) {
      return res.status(400).json({ ok: false, error: 'No clothing refs for this model' });
    }
    
    // Prepare identity images from model
    const identityImages = [];
    for (const filename of model.imageFiles || []) {
      const fs = await import('fs/promises');
      const path = await import('path');
      const { getModelsDir } = await import('../store/modelStore.js');
      
      const filePath = path.default.join(getModelsDir(), model.id, filename);
      try {
        const buffer = await fs.default.readFile(filePath);
        identityImages.push({
          mimeType: 'image/jpeg',
          base64: buffer.toString('base64')
        });
      } catch (e) {
        console.warn(`[ShootRoutes] Could not read identity image: ${filePath}`);
      }
    }
    
    if (identityImages.length === 0) {
      return res.status(400).json({ ok: false, error: 'No identity images for this model' });
    }
    
    // Prepare clothing images
    const clothingImages = clothing.refs
      .filter(ref => ref.url && ref.url.startsWith('data:'))
      .map(ref => {
        const match = ref.url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          return { mimeType: match[1], base64: match[2] };
        }
        return null;
      })
      .filter(Boolean);
    
    if (clothingImages.length === 0) {
      return res.status(400).json({ ok: false, error: 'No valid clothing images' });
    }
    
    // Generate outfit avatar
    const result = await generateOutfitAvatar({
      identityImages,
      clothingImages,
      universe: shoot.universe,
      extraPrompt: ''
    });
    
    if (!result.ok) {
      // Save error status
      await setOutfitAvatarForModel(req.params.id, modelIndex, {
        status: 'error',
        imageUrl: null,
        prompt: result.prompt
      });
      
      return res.json({
        ok: false,
        error: result.error,
        prompt: result.prompt
      });
    }
    
    // Convert to JPEG and save the generated avatar
    const jpegImage = await convertGeminiImageToJpeg(result.image, 90);
    const imageUrl = `data:${jpegImage.mimeType};base64,${jpegImage.base64}`;
    
    await setOutfitAvatarForModel(req.params.id, modelIndex, {
      status: 'ok',
      imageUrl,
      prompt: result.prompt,
      approved: false
    });
    
    const updatedShoot = await getShootById(req.params.id);
    
    res.json({
      ok: true,
      data: {
        imageUrl,
        prompt: result.prompt,
        shoot: updatedShoot
      }
    });
    
  } catch (error) {
    console.error('[ShootRoutes] Error generating outfit avatar:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/shoots/:id/outfit-avatar/approve — Approve outfit avatar for a model
 * Body: { modelIndex: number }
 */
router.post('/:id/outfit-avatar/approve', async (req, res) => {
  try {
    const { modelIndex } = req.body;
    const shoot = await getShootById(req.params.id);
    
    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    
    const avatar = shoot.outfitAvatars?.find(a => a.forModelIndex === modelIndex);
    if (!avatar || avatar.status !== 'ok') {
      return res.status(400).json({ ok: false, error: 'No generated avatar to approve' });
    }
    
    await setOutfitAvatarForModel(req.params.id, modelIndex, {
      ...avatar,
      status: 'approved',
      approved: true
    });
    
    const updatedShoot = await getShootById(req.params.id);
    
    res.json({ ok: true, data: updatedShoot });
  } catch (error) {
    console.error('[ShootRoutes] Error approving outfit avatar:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// SHOOT STATUS & VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/shoots/:id/status — Get shoot readiness status
 */
router.get('/:id/status', async (req, res) => {
  try {
    const shoot = await getShootById(req.params.id);
    
    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    
    const status = {
      hasUniverse: !!shoot.universe,
      hasModels: shoot.models?.length > 0,
      modelCount: shoot.models?.length || 0,
      hasFrames: shoot.frames?.length > 0,
      frameCount: shoot.frames?.length || 0,
      requiresOutfitAvatar: shouldRequireOutfitAvatar(shoot),
      outfitAvatarStatus: {}
    };
    
    // Check outfit avatar status for each model
    if (status.requiresOutfitAvatar) {
      for (let i = 0; i < shoot.models.length; i++) {
        const hasClothing = shoot.clothing?.some(
          c => c.forModelIndex === i && c.refs?.length > 0
        );
        
        if (hasClothing) {
          const avatar = shoot.outfitAvatars?.find(a => a.forModelIndex === i);
          status.outfitAvatarStatus[i] = avatar?.status || 'empty';
        } else {
          status.outfitAvatarStatus[i] = 'not_required';
        }
      }
    }
    
    // Overall readiness
    status.isReady = status.hasUniverse && 
                     status.hasModels && 
                     status.hasFrames;
    
    if (status.requiresOutfitAvatar) {
      const allApproved = Object.values(status.outfitAvatarStatus).every(
        s => s === 'approved' || s === 'not_required'
      );
      status.isReady = status.isReady && allApproved;
    }
    
    res.json({ ok: true, data: status });
  } catch (error) {
    console.error('[ShootRoutes] Error getting shoot status:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/shoots/:id/pack-clothing — Pack clothing refs into collage
 * Body: { modelIndex: number }
 * Returns: { collageUrl: string }
 */
router.post('/:id/pack-clothing', async (req, res) => {
  try {
    const { modelIndex } = req.body;
    const shoot = await getShootById(req.params.id);
    
    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    
    const clothing = shoot.clothing?.find(c => c.forModelIndex === modelIndex);
    if (!clothing || !clothing.refs || clothing.refs.length === 0) {
      return res.status(400).json({ ok: false, error: 'No clothing refs for this model' });
    }
    
    // Extract base64 from data URLs
    const clothingImages = clothing.refs
      .filter(ref => ref.url && ref.url.startsWith('data:'))
      .map(ref => {
        const match = ref.url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          return { mimeType: match[1], base64: match[2] };
        }
        return null;
      })
      .filter(Boolean);
    
    if (clothingImages.length === 0) {
      return res.status(400).json({ ok: false, error: 'No valid clothing images' });
    }
    
    const collage = await packClothingToCollage(clothingImages);
    
    if (!collage) {
      return res.status(500).json({ ok: false, error: 'Failed to create collage' });
    }
    
    const collageUrl = `data:${collage.mimeType};base64,${collage.base64}`;
    
    res.json({ ok: true, data: { collageUrl } });
  } catch (error) {
    console.error('[ShootRoutes] Error packing clothing:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════

import { generateShootFrame, generateAllShootFrames } from '../services/shootGenerator.js';

/**
 * POST /api/shoots/:id/generate — Generate images for all frames
 */
router.post('/:id/generate', async (req, res) => {
  try {
    const shoot = await getShootById(req.params.id);
    
    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    
    // Models are required
    if (!shoot.models || shoot.models.length === 0) {
      return res.status(400).json({ ok: false, error: 'No models in shoot' });
    }
    
    // Frames are optional - will use default scene if none
    const hasFrames = shoot.frames && shoot.frames.length > 0;
    console.log(`[ShootRoutes] Starting generation for shoot ${shoot.id} with ${hasFrames ? shoot.frames.length : 0} frames (default scene if 0)`);
    
    // Collect identity images from first model (ALL photos for collage)
    const identityImages = [];
    const firstModel = shoot.models[0];
    if (firstModel) {
      const model = await getModelById(firstModel.modelId);
      if (model && model.imageFiles) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const { getModelsDir } = await import('../store/modelStore.js');
        
        // Collect ALL identity images (not just first 5)
        for (const filename of model.imageFiles) {
          const filePath = path.default.join(getModelsDir(), model.id, filename);
          try {
            const buffer = await fs.default.readFile(filePath);
            identityImages.push({
              mimeType: 'image/jpeg',
              base64: buffer.toString('base64')
            });
          } catch (e) {
            console.warn(`[ShootRoutes] Could not read identity image: ${filePath}`);
          }
        }
      }
    }
    
    // Collect clothing images
    const clothingImages = [];
    if (shoot.clothing && shoot.clothing.length > 0) {
      for (const clothing of shoot.clothing) {
        if (clothing.refs) {
          for (const ref of clothing.refs) {
            if (ref.url && ref.url.startsWith('data:')) {
              const match = ref.url.match(/^data:([^;]+);base64,(.+)$/);
              if (match) {
                clothingImages.push({ mimeType: match[1], base64: match[2] });
              }
            }
          }
        }
      }
    }
    
    // Build collages for identity and clothing
    let identityCollage = null;
    let clothingCollage = null;
    
    // Identity collage: HIGH QUALITY for face recognition
    if (identityImages.length > 0) {
      identityCollage = await buildCollage(identityImages, {
        maxSize: 1536,      // Large size for face details
        maxCols: 2,         // Fewer columns = bigger faces
        minTile: 512,       // Each face at least 512px
        jpegQuality: 95,    // Maximum quality for faces
        fit: 'cover',
        position: 'attention'  // Smart crop focusing on faces
      });
      console.log(`[ShootRoutes] Identity collage built from ${identityImages.length} images`);
    }
    
    // Clothing collage: moderate quality
    if (clothingImages.length > 0) {
      clothingCollage = await buildCollage(clothingImages, {
        maxSize: 1024,
        maxCols: 3,
        minTile: 400,
        jpegQuality: 92,
        fit: 'contain'
      });
      console.log(`[ShootRoutes] Clothing collage built from ${clothingImages.length} images`);
    }
    
    // Collect frame data (or use empty array for default scene)
    const frames = [];
    if (hasFrames) {
      for (const shootFrame of shoot.frames) {
        const frameData = await getFrameById(shootFrame.frameId);
        if (frameData) {
          frames.push({
            ...frameData,
            extraPrompt: shootFrame.extraPrompt || '',
            location: shootFrame.location || null // Support per-frame location
          });
        }
      }
    }
    
    // Get model description
    let modelDescription = '';
    if (firstModel) {
      const model = await getModelById(firstModel.modelId);
      if (model) {
        modelDescription = model.promptSnippet || model.label || '';
      }
    }
    
    // Prepare images for generation (use collages)
    const identityImagesForGen = identityCollage ? [identityCollage] : [];
    const clothingImagesForGen = clothingCollage ? [clothingCollage] : [];
    
    // Generate all frames
    const results = await generateAllShootFrames({
      universe: shoot.universe,
      location: shoot.location || null,
      frames,
      identityImages: identityImagesForGen,
      clothingImages: clothingImagesForGen,
      modelDescription,
      clothingNotes: '',
      imageConfig: shoot.globalSettings?.imageConfig || { aspectRatio: '3:4', imageSize: '1K' },
      delayMs: 2000
    });
    
    // Build refs preview for debug info
    const refsPreview = [];
    
    // Add identity collage preview
    if (identityCollage) {
      refsPreview.push({
        kind: 'identity',
        label: `Модель (коллаж из ${identityImages.length} фото)`,
        previewUrl: `data:${identityCollage.mimeType};base64,${identityCollage.base64}`
      });
    }
    
    // Add clothing collage preview
    if (clothingCollage) {
      refsPreview.push({
        kind: 'clothing',
        label: `Одежда (коллаж из ${clothingImages.length} фото)`,
        previewUrl: `data:${clothingCollage.mimeType};base64,${clothingCollage.base64}`
      });
    }
    
    // Add universe ref if available
    if (shoot.universe?.previewSrc) {
      refsPreview.push({
        kind: 'universe',
        label: shoot.universe.label || 'Вселенная',
        previewUrl: shoot.universe.previewSrc
      });
    }
    
    // Convert results to response format
    const generatedFrames = results.map(r => ({
      frameId: r.frameId,
      frameLabel: r.frameLabel,
      status: r.ok ? 'ok' : 'error',
      imageUrl: r.ok && r.image ? `data:${r.image.mimeType};base64,${r.image.base64}` : null,
      error: r.error || null,
      prompt: r.prompt,
      promptJson: r.promptJson || null,
      refs: refsPreview
    }));
    
    console.log(`[ShootRoutes] Generation complete: ${generatedFrames.filter(f => f.status === 'ok').length}/${generatedFrames.length} successful`);
    
    res.json({
      ok: true,
      data: {
        shootId: shoot.id,
        frames: generatedFrames
      }
    });
    
  } catch (error) {
    console.error('[ShootRoutes] Error generating shoot:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/shoots/:id/generate-frame — Generate a single frame
 * Body: { 
 *   frameIndex?: number, 
 *   frameId?: string,  // <-- Direct frame ID
 *   locationId?: string, 
 *   extraPrompt?: string,
 *   captureStyle?: string,      // NEW: preset ID for how moment was captured
 *   cameraSignature?: string,   // NEW: preset ID for camera look
 *   skinTexture?: string,       // NEW: preset ID for skin rendering
 *   poseAdherence?: number (1-4),
 *   emotionId?: string  // <-- Emotion preset ID
 * }
 */
router.post('/:id/generate-frame', async (req, res) => {
  try {
    const { 
      frameIndex, 
      frameId,  // <-- Accept frameId directly
      locationId, 
      extraPrompt: reqExtraPrompt,
      captureStyle = 'none',       // NEW
      cameraSignature = 'none',    // NEW
      skinTexture = 'none',        // NEW
      aspectRatio = '3:4',         // NEW: image orientation
      imageSize = '1K',            // NEW: image quality/size
      poseAdherence = 2,
      emotionId = null  // <-- Emotion preset ID
    } = req.body;
    const shoot = await getShootById(req.params.id);
    
    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    
    // Frame is optional - use default scene if not provided or invalid
    let frameData = null;
    let shootFrame = null;
    let poseSketchImage = null;
    
    console.log('[ShootRoutes] frameId received:', frameId);
    console.log('[ShootRoutes] frameIndex received:', frameIndex);
    
    // Try to load frame by frameId first (direct selection from catalog)
    if (frameId) {
      frameData = await getFrameById(frameId);
      console.log('[ShootRoutes] Frame loaded by ID:', !!frameData);
    }
    // Fallback to frameIndex (from shoot.frames)
    else if (frameIndex !== undefined && frameIndex >= 0 && frameIndex < (shoot.frames?.length || 0)) {
      shootFrame = shoot.frames[frameIndex];
      frameData = await getFrameById(shootFrame.frameId);
      console.log('[ShootRoutes] Frame loaded by index:', !!frameData);
    }
    
    // Load pose sketch if frame has one
    if (frameData) {
      console.log('[ShootRoutes] Frame has sketchUrl?', !!frameData?.sketchUrl);
      console.log('[ShootRoutes] Frame has sketchAsset?', !!frameData?.sketchAsset);
      console.log('[ShootRoutes] Frame sketchAsset.url length:', frameData?.sketchAsset?.url?.length || 0);
      
      if (frameData?.sketchUrl || frameData?.sketchAsset?.url) {
        const sketchUrl = frameData.sketchUrl || frameData.sketchAsset?.url;
        console.log('[ShootRoutes] sketchUrl starts with data:?', sketchUrl?.startsWith('data:'));
        console.log('[ShootRoutes] sketchUrl length:', sketchUrl?.length || 0);
        
        if (sketchUrl && sketchUrl.startsWith('data:')) {
          const match = sketchUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            poseSketchImage = { mimeType: match[1], base64: match[2] };
            console.log('[ShootRoutes] ✅ Pose sketch loaded! mimeType:', match[1], 'base64 length:', match[2]?.length);
          } else {
            console.log('[ShootRoutes] ❌ Failed to parse data URL');
          }
        } else {
          console.log('[ShootRoutes] ❌ sketchUrl does not start with data:');
        }
      } else {
        console.log('[ShootRoutes] ❌ No sketchUrl or sketchAsset.url found in frameData');
      }
    } else {
      console.log('[ShootRoutes] No frame selected, using default scene');
    }
    
    // Get location if provided
    let location = null;
    if (locationId) {
      const { getLocationById } = await import('../store/locationStore.js');
      location = await getLocationById(locationId);
    }
    
    // Collect identity images (ALL for collage)
    const identityImages = [];
    if (shoot.models && shoot.models.length > 0) {
      const firstModel = shoot.models[0];
      const model = await getModelById(firstModel.modelId);
      if (model && model.imageFiles) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const { getModelsDir } = await import('../store/modelStore.js');
        
        for (const filename of model.imageFiles) {
          const filePath = path.default.join(getModelsDir(), model.id, filename);
          try {
            const buffer = await fs.default.readFile(filePath);
            identityImages.push({
              mimeType: 'image/jpeg',
              base64: buffer.toString('base64')
            });
          } catch (e) {
            console.warn(`[ShootRoutes] Could not read identity image: ${filePath}`);
          }
        }
      }
    }
    
    // Collect clothing images
    const clothingImages = [];
    if (shoot.clothing && shoot.clothing.length > 0) {
      for (const clothing of shoot.clothing) {
        if (clothing.refs) {
          for (const ref of clothing.refs) {
            if (ref.url && ref.url.startsWith('data:')) {
              const match = ref.url.match(/^data:([^;]+);base64,(.+)$/);
              if (match) {
                clothingImages.push({ mimeType: match[1], base64: match[2] });
              }
            }
          }
        }
      }
    }
    
    // Build collages
    let identityCollage = null;
    let clothingCollage = null;
    
    // Identity collage: HIGH QUALITY for face recognition
    if (identityImages.length > 0) {
      identityCollage = await buildCollage(identityImages, {
        maxSize: 1536,      // Large size for face details
        maxCols: 2,         // Fewer columns = bigger faces
        minTile: 512,       // Each face at least 512px
        jpegQuality: 95,    // Maximum quality for faces
        fit: 'cover',
        position: 'attention'  // Smart crop focusing on faces
      });
    }
    
    // Clothing collage: moderate quality
    if (clothingImages.length > 0) {
      clothingCollage = await buildCollage(clothingImages, {
        maxSize: 1024,
        maxCols: 3,
        minTile: 400,
        jpegQuality: 92,
        fit: 'contain'
      });
    }
    
    // Get model description
    let modelDescription = '';
    if (shoot.models && shoot.models.length > 0) {
      const model = await getModelById(shoot.models[0].modelId);
      if (model) {
        modelDescription = model.promptSnippet || model.label || '';
      }
    }
    
    // Generate single frame
    // Build frame with emotion override if emotionId is specified
    console.log('[ShootRoutes] Building frame with emotion:', { emotionId, hasFrameData: !!frameData });
    
    let frameWithEmotion = null;
    if (frameData) {
      frameWithEmotion = {
        ...frameData,
        extraPrompt: reqExtraPrompt || shootFrame?.extraPrompt || '',
        // Override emotion if emotionId is specified in request
        emotion: emotionId ? { emotionId } : frameData.emotion
      };
    } else if (emotionId) {
      // No frame selected, but emotion specified - create minimal frame with emotion
      frameWithEmotion = {
        emotion: { emotionId }
      };
    }
    
    console.log('[ShootRoutes] frameWithEmotion:', frameWithEmotion ? { label: frameWithEmotion.label, emotion: frameWithEmotion.emotion } : null);

    // Apply UI overrides to universe (if not "none", use UI value instead of universe default)
    let effectiveUniverse = { ...shoot.universe };
    
    if (captureStyle && captureStyle !== 'none') {
      effectiveUniverse.captureStyle = { preset: captureStyle, customPrompt: '' };
      console.log('[ShootRoutes] Override captureStyle from UI:', captureStyle);
    }
    if (cameraSignature && cameraSignature !== 'none') {
      effectiveUniverse.cameraSignature = { preset: cameraSignature, customPrompt: '' };
      console.log('[ShootRoutes] Override cameraSignature from UI:', cameraSignature);
    }
    if (skinTexture && skinTexture !== 'none') {
      effectiveUniverse.skinTexture = { preset: skinTexture, customPrompt: '' };
      console.log('[ShootRoutes] Override skinTexture from UI:', skinTexture);
    }

    // Use aspectRatio and imageSize from request, fallback to shoot settings
    const imageConfig = {
      aspectRatio: aspectRatio || shoot.globalSettings?.imageConfig?.aspectRatio || '3:4',
      imageSize: imageSize || shoot.globalSettings?.imageConfig?.imageSize || '1K'
    };
    console.log('[ShootRoutes] Image config:', imageConfig);

    const result = await generateShootFrame({
      universe: effectiveUniverse,
      location: location || shoot.location || null,
      frame: frameWithEmotion,
      poseSketchImage,
      identityImages: identityCollage ? [identityCollage] : [],
      clothingImages: clothingCollage ? [clothingCollage] : [],
      modelDescription,
      clothingNotes: '',
      extraPrompt: reqExtraPrompt || shootFrame?.extraPrompt || '',
      posingStyle: 2,  // legacy fallback, captureStyle takes priority
      poseAdherence: Math.max(1, Math.min(4, parseInt(poseAdherence) || 2)),
      imageConfig
    });
    
    if (!result.ok) {
      return res.json({
        ok: false,
        error: result.error,
        prompt: result.prompt,
        promptJson: result.promptJson
      });
    }
    
    // Convert to JPEG for consistent storage
    const jpegImage = await convertGeminiImageToJpeg(result.image, 90);
    const imageUrl = `data:${jpegImage.mimeType};base64,${jpegImage.base64}`;
    
    // Build refs for debug
    const refs = [];
    if (identityCollage) {
      refs.push({
        kind: 'identity',
        label: `Модель (коллаж из ${identityImages.length} фото)`,
        previewUrl: `data:${identityCollage.mimeType};base64,${identityCollage.base64}`
      });
    }
    if (clothingCollage) {
      refs.push({
        kind: 'clothing',
        label: `Одежда (коллаж из ${clothingImages.length} фото)`,
        previewUrl: `data:${clothingCollage.mimeType};base64,${clothingCollage.base64}`
      });
    }
    if (poseSketchImage) {
      refs.push({
        kind: 'pose_sketch',
        label: 'Эскиз позы',
        previewUrl: `data:${poseSketchImage.mimeType};base64,${poseSketchImage.base64}`
      });
    }
    
    // Get location label if locationId was provided
    let locationLabel = null;
    if (locationId && location) {
      locationLabel = location.label;
    }
    
    // Save generated image to shoot (persistent storage - in separate files)
    const saveResult = await addGeneratedImageToShoot(req.params.id, {
      imageUrl,
      frameId: frameData?.id || 'default',
      frameLabel: frameData?.label || 'Default Scene',
      locationId: locationId || null,
      locationLabel,
      emotionId: emotionId || null,
      captureStyle: captureStyle !== 'none' ? captureStyle : null,
      cameraSignature: cameraSignature !== 'none' ? cameraSignature : null,
      skinTexture: skinTexture !== 'none' ? skinTexture : null,
      aspectRatio: imageConfig.aspectRatio,
      imageSize: imageConfig.imageSize,
      poseAdherence: Math.max(1, Math.min(4, parseInt(poseAdherence) || 2)),
      extraPrompt: reqExtraPrompt || '',
      prompt: result.prompt
      // Note: promptJson and refs NOT saved to keep files small
    });
    
    if (!saveResult.success) {
      console.error('[ShootRoutes] Failed to save generated image:', saveResult.errors);
    }
    
    res.json({
      ok: true,
      data: {
        id: saveResult.image?.id,  // Return the saved image ID
        frameId: frameData?.id || 'default',
        frameLabel: frameData?.label || 'Default Scene',
        imageUrl,
        prompt: result.prompt,
        promptJson: result.promptJson,
        refs
      }
    });
    
  } catch (error) {
    console.error('[ShootRoutes] Error generating frame:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// UPSCALE ENDPOINT (via Gemini / Nano Banana Pro)
// ═══════════════════════════════════════════════════════════════

import sharp from 'sharp';
import { requestGeminiImage } from '../providers/geminiClient.js';

// Upscale prompt - instructs Gemini to upscale without changing content
const UPSCALE_PROMPT = `UPSCALE this image to maximum resolution (4K).

CRITICAL RULES:
- Do NOT change ANYTHING about the image content
- Do NOT modify the subject, colors, lighting, composition, or any details
- Do NOT add or remove anything
- Do NOT apply any style changes or filters
- ONLY increase the resolution and enhance fine details
- Preserve EXACT pixel-perfect likeness of the original
- This is purely a resolution enhancement, NOT a regeneration

Output a higher resolution version of the EXACT same image.`;

/**
 * POST /api/shoots/:id/upscale — Upscale an image via Gemini
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
    // Gemini supports: 1:1, 3:4, 4:3, 9:16, 16:9
    const ratio = originalWidth / originalHeight;
    let aspectRatio;
    
    if (ratio >= 1.7) {
      aspectRatio = '16:9';      // Very wide landscape (ratio >= 1.77)
    } else if (ratio >= 1.2) {
      aspectRatio = '4:3';       // Landscape (ratio ~1.33)
    } else if (ratio >= 0.9) {
      aspectRatio = '1:1';       // Square-ish
    } else if (ratio >= 0.65) {
      aspectRatio = '3:4';       // Portrait (ratio ~0.75)
    } else {
      aspectRatio = '9:16';      // Very tall portrait (ratio ~0.56)
    }
    
    console.log(`[ShootRoutes] Upscaling image ${originalWidth}x${originalHeight} (ratio: ${ratio.toFixed(2)}) → aspect: ${aspectRatio}, target: ${targetSize}`);
    
    // Call Gemini for upscale
    const result = await requestGeminiImage({
      prompt: UPSCALE_PROMPT,
      referenceImages: [{
        mimeType: mimeType || 'image/jpeg',
        base64: imageBase64
      }],
      imageConfig: {
        aspectRatio,
        imageSize: targetSize  // '2K' or '4K'
      }
    });
    
    if (!result.ok) {
      console.error('[ShootRoutes] Gemini upscale failed:', result.error);
      
      // Fallback to sharp if Gemini fails
      console.log('[ShootRoutes] Falling back to sharp upscale...');
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
    
    console.log(`[ShootRoutes] ✅ Upscaled via Gemini: ${originalWidth}x${originalHeight} → ${upscaledMeta.width}x${upscaledMeta.height}`);
    
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
    console.error('[ShootRoutes] Error upscaling image:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// GENERATED IMAGES MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/shoots/:id/images — Get all generated images for a shoot
 */
router.get('/:id/images', async (req, res) => {
  try {
    const shoot = await getShootById(req.params.id);
    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    
    // Get images from separate files (new storage) or from shoot object (legacy)
    let images = await getGeneratedImagesForShoot(req.params.id);
    
    // Fallback to legacy storage if no new images found
    if (images.length === 0 && shoot.generatedImages?.length > 0) {
      images = shoot.generatedImages;
    }
    
    res.json({
      ok: true,
      data: images,
      total: images.length
    });
  } catch (error) {
    console.error('[ShootRoutes] Error getting images:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * DELETE /api/shoots/:id/images/:imageId — Delete a generated image
 */
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const result = await removeGeneratedImageFromShoot(req.params.id, req.params.imageId);
    if (!result.success) {
      return res.status(400).json({ ok: false, errors: result.errors });
    }
    res.json({ ok: true, data: result.shoot });
  } catch (error) {
    console.error('[ShootRoutes] Error deleting image:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * DELETE /api/shoots/:id/images — Clear all generated images
 */
router.delete('/:id/images', async (req, res) => {
  try {
    const result = await clearGeneratedImagesFromShoot(req.params.id);
    if (!result.success) {
      return res.status(400).json({ ok: false, errors: result.errors });
    }
    res.json({ ok: true, data: result.shoot });
  } catch (error) {
    console.error('[ShootRoutes] Error clearing images:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
