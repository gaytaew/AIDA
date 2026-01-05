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
  setUniverseForShoot
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
    
    // Save the generated avatar
    const imageUrl = `data:${result.image.mimeType};base64,${result.image.base64}`;
    
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
    
    if (!shoot.frames || shoot.frames.length === 0) {
      return res.status(400).json({ ok: false, error: 'No frames in shoot' });
    }
    
    if (!shoot.models || shoot.models.length === 0) {
      return res.status(400).json({ ok: false, error: 'No models in shoot' });
    }
    
    console.log(`[ShootRoutes] Starting generation for shoot ${shoot.id} with ${shoot.frames.length} frames`);
    
    // Collect identity images from first model
    const identityImages = [];
    const firstModel = shoot.models[0];
    if (firstModel) {
      const model = await getModelById(firstModel.modelId);
      if (model && model.imageFiles) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const { getModelsDir } = await import('../store/modelStore.js');
        
        for (const filename of model.imageFiles.slice(0, 5)) {
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
    
    // Collect frame data
    const frames = [];
    for (const shootFrame of shoot.frames) {
      const frameData = await getFrameById(shootFrame.frameId);
      if (frameData) {
        frames.push({
          ...frameData,
          extraPrompt: shootFrame.extraPrompt || ''
        });
      }
    }
    
    if (frames.length === 0) {
      return res.status(400).json({ ok: false, error: 'No valid frames found' });
    }
    
    // Get model description
    let modelDescription = '';
    if (firstModel) {
      const model = await getModelById(firstModel.modelId);
      if (model) {
        modelDescription = model.promptSnippet || model.label || '';
      }
    }
    
    // Generate all frames
    const results = await generateAllShootFrames({
      universe: shoot.universe,
      frames,
      identityImages,
      clothingImages,
      modelDescription,
      clothingNotes: '',
      imageConfig: shoot.globalSettings?.imageConfig || { aspectRatio: '3:4', imageSize: '1K' },
      delayMs: 2000
    });
    
    // Convert results to response format
    const generatedFrames = results.map(r => ({
      frameId: r.frameId,
      frameLabel: r.frameLabel,
      status: r.ok ? 'ok' : 'error',
      imageUrl: r.ok && r.image ? `data:${r.image.mimeType};base64,${r.image.base64}` : null,
      error: r.error || null,
      prompt: r.prompt
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
 * Body: { frameIndex: number }
 */
router.post('/:id/generate-frame', async (req, res) => {
  try {
    const { frameIndex } = req.body;
    const shoot = await getShootById(req.params.id);
    
    if (!shoot) {
      return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    
    if (frameIndex === undefined || frameIndex < 0 || frameIndex >= (shoot.frames?.length || 0)) {
      return res.status(400).json({ ok: false, error: 'Invalid frameIndex' });
    }
    
    const shootFrame = shoot.frames[frameIndex];
    const frameData = await getFrameById(shootFrame.frameId);
    
    if (!frameData) {
      return res.status(404).json({ ok: false, error: 'Frame not found' });
    }
    
    // Collect identity images
    const identityImages = [];
    if (shoot.models && shoot.models.length > 0) {
      const firstModel = shoot.models[0];
      const model = await getModelById(firstModel.modelId);
      if (model && model.imageFiles) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const { getModelsDir } = await import('../store/modelStore.js');
        
        for (const filename of model.imageFiles.slice(0, 5)) {
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
    
    // Get model description
    let modelDescription = '';
    if (shoot.models && shoot.models.length > 0) {
      const model = await getModelById(shoot.models[0].modelId);
      if (model) {
        modelDescription = model.promptSnippet || model.label || '';
      }
    }
    
    // Generate single frame
    const result = await generateShootFrame({
      universe: shoot.universe,
      frame: {
        ...frameData,
        extraPrompt: shootFrame.extraPrompt || ''
      },
      identityImages,
      clothingImages,
      modelDescription,
      clothingNotes: '',
      extraPrompt: shootFrame.extraPrompt || '',
      imageConfig: shoot.globalSettings?.imageConfig || { aspectRatio: '3:4', imageSize: '1K' }
    });
    
    if (!result.ok) {
      return res.json({
        ok: false,
        error: result.error,
        prompt: result.prompt
      });
    }
    
    const imageUrl = `data:${result.image.mimeType};base64,${result.image.base64}`;
    
    res.json({
      ok: true,
      data: {
        frameId: frameData.id,
        frameLabel: frameData.label,
        imageUrl,
        prompt: result.prompt
      }
    });
    
  } catch (error) {
    console.error('[ShootRoutes] Error generating frame:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
