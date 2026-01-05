/**
 * Shoot Generator Service
 * 
 * Generates final images for shoots by combining:
 * - Universe (visual DNA)
 * - Model identity refs
 * - Clothing refs
 * - Frame parameters
 * 
 * Uses Gemini (Nano Banana Pro) for image generation.
 */

import { requestGeminiImage } from '../providers/geminiClient.js';
import { buildCollage } from '../utils/imageCollage.js';

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build the final image generation prompt
 */
export function buildShootPrompt({
  universe,
  frame,
  modelDescription = '',
  clothingNotes = '',
  extraPrompt = ''
}) {
  const parts = [];

  // Header
  parts.push(`REAL FASHION PHOTO (NOT illustration, NOT CGI, NOT 3D render).
Photographic realism: natural skin texture, believable fabric behavior, real optics.

GLOBAL HARD RULES:
1) STRICTLY match identity reference images (faces, anatomy) for models.
2) STRICTLY match clothing reference images (silhouette, color, construction, materials).
3) Do NOT invent brands/logos/text. No captions, no watermarks.
4) Keep it consistent: same cast and same overall photographic character.`);

  // Universe block
  if (universe) {
    const universeLines = ['', 'UNIVERSE (VISUAL DNA):'];
    
    if (universe.shortDescription) {
      universeLines.push(universe.shortDescription);
    }
    
    // Capture
    if (universe.capture) {
      const c = universe.capture;
      universeLines.push(`Medium: ${c.mediumType || 'photo'}, ${c.cameraSystem || '35mm'}`);
      if (c.grainStructure && c.grainStructure !== 'none') {
        universeLines.push(`Grain: ${c.grainStructure}`);
      }
    }
    
    // Light
    if (universe.light) {
      const l = universe.light;
      universeLines.push(`Lighting: ${l.primaryLightType || 'natural'}, ${l.flashCharacter || 'soft'}`);
      universeLines.push(`Shadows: ${l.shadowBehavior || 'soft_falloff'}`);
    }
    
    // Color
    if (universe.color) {
      const c = universe.color;
      universeLines.push(`Color: ${c.baseColorCast || 'neutral'} cast, ${c.dominantPalette || 'natural'} palette`);
      if (c.skinToneRendering) {
        universeLines.push(`Skin: ${c.skinToneRendering}`);
      }
    }
    
    // Era
    if (universe.era) {
      const e = universe.era;
      universeLines.push(`Era: ${e.eraReference || 'contemporary'}, ${e.editorialReference || 'european_fashion'}`);
    }
    
    // Post-process
    if (universe.postProcess) {
      const p = universe.postProcess;
      if (p.hdrForbidden) universeLines.push('NO HDR.');
      if (p.aiArtifactsPrevention) universeLines.push('NO AI artifacts, NO plastic skin.');
      if (!p.skinSmoothing) universeLines.push('Preserve skin texture.');
    }
    
    parts.push(universeLines.join('\n'));
  }

  // Identity block
  parts.push(`
IDENTITY (MUST MATCH EXACTLY):
Use the uploaded person photo(s) as strict identity reference.
Generate the same person, preserving exact facial identity and proportions.
Do not beautify, do not stylize the face.`);

  if (modelDescription) {
    parts.push(`\nMODEL DESCRIPTION:\n${modelDescription}`);
  }

  // Clothing block
  parts.push(`
CLOTHING (MUST MATCH EXACTLY):
Carefully inspect the clothing reference images.
Recreate ALL garments with MAXIMUM accuracy:
- Preserve exact silhouettes, proportions, lengths, fabric behavior
- Match exact colors, prints, patterns
- Do NOT invent new garments or accessories not in the refs`);

  if (clothingNotes) {
    parts.push(`\nCLOTHING NOTES:\n${clothingNotes}`);
  }

  // Frame block
  if (frame) {
    const frameLines = ['', 'FRAME / SHOT:'];
    
    if (frame.label) {
      frameLines.push(`Shot: ${frame.label}`);
    }
    
    if (frame.description) {
      frameLines.push(frame.description);
    }
    
    if (frame.technical) {
      const t = frame.technical;
      if (t.shotSize) frameLines.push(`Size: ${t.shotSize.replace(/_/g, ' ')}`);
      if (t.cameraAngle) frameLines.push(`Angle: ${t.cameraAngle.replace(/_/g, ' ')}`);
      if (t.poseType) frameLines.push(`Pose type: ${t.poseType}`);
      if (t.composition) frameLines.push(`Composition: ${t.composition.replace(/_/g, ' ')}`);
      if (t.focusPoint) frameLines.push(`Focus: ${t.focusPoint}`);
      if (t.poseDescription) frameLines.push(`Pose: ${t.poseDescription}`);
    }
    
    parts.push(frameLines.join('\n'));
  }

  // Anti-AI block
  parts.push(`
ANTI-AI MARKERS:
- Natural skin texture with pores, small imperfections
- Real fabric behavior, natural wrinkles and folds
- Subtle lens imperfections OK (soft edges, slight vignette)
- NOT too perfect, NOT too symmetrical
- NO plastic/glossy skin
- NO HDR look
- NO watermarks or text`);

  // Extra prompt
  if (extraPrompt) {
    parts.push(`\nADDITIONAL INSTRUCTIONS:\n${extraPrompt}`);
  }

  return parts.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// IMAGE PACKING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Pack multiple images into a single collage
 */
async function packImagesToBoard(images, options = {}) {
  if (!images || images.length === 0) return null;
  if (images.length === 1) return images[0];
  
  return await buildCollage(images, {
    maxSize: options.maxSize || 1536,
    jpegQuality: options.jpegQuality || 90,
    fit: options.fit || 'cover',
    background: options.background || '#ffffff'
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a single frame image for a shoot
 * 
 * @param {Object} params
 * @param {Object} params.universe - Universe/visual DNA
 * @param {Object} params.frame - Frame parameters
 * @param {Array} params.identityImages - Model identity photos
 * @param {Array} params.clothingImages - Clothing reference photos
 * @param {string} params.modelDescription - Model description text
 * @param {string} params.clothingNotes - Notes about clothing
 * @param {string} params.extraPrompt - Additional instructions
 * @param {Object} params.imageConfig - Image configuration
 * @returns {Promise<{ok: boolean, image?: Object, prompt?: string, error?: string}>}
 */
export async function generateShootFrame({
  universe,
  frame,
  identityImages = [],
  clothingImages = [],
  modelDescription = '',
  clothingNotes = '',
  extraPrompt = '',
  imageConfig = {}
}) {
  try {
    console.log('[ShootGenerator] Starting frame generation...');

    // Build the prompt
    const prompt = buildShootPrompt({
      universe,
      frame,
      modelDescription,
      clothingNotes,
      extraPrompt
    });

    console.log('[ShootGenerator] Prompt built, length:', prompt.length);

    // Pack identity and clothing images
    const referenceImages = [];

    // Pack identity images into a board
    if (identityImages.length > 0) {
      const identityBoard = await packImagesToBoard(identityImages, {
        maxSize: 1024,
        fit: 'cover'
      });
      if (identityBoard) {
        referenceImages.push(identityBoard);
        console.log('[ShootGenerator] Identity board created');
      }
    }

    // Pack clothing images into a board
    if (clothingImages.length > 0) {
      const clothingBoard = await packImagesToBoard(clothingImages, {
        maxSize: 1536,
        fit: 'contain'
      });
      if (clothingBoard) {
        referenceImages.push(clothingBoard);
        console.log('[ShootGenerator] Clothing board created');
      }
    }

    console.log(`[ShootGenerator] Sending ${referenceImages.length} reference images to Gemini`);

    // Generate with Gemini
    const result = await requestGeminiImage({
      prompt,
      referenceImages,
      imageConfig: {
        aspectRatio: imageConfig.aspectRatio || '3:4',
        imageSize: imageConfig.imageSize || '1K'
      }
    });

    if (!result.ok) {
      console.error('[ShootGenerator] Gemini error:', result.error);
      return {
        ok: false,
        error: result.error,
        prompt
      };
    }

    console.log('[ShootGenerator] Frame generated successfully');

    return {
      ok: true,
      image: {
        mimeType: result.mimeType,
        base64: result.base64
      },
      prompt
    };

  } catch (error) {
    console.error('[ShootGenerator] Error:', error);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Generate all frames for a shoot
 */
export async function generateAllShootFrames({
  universe,
  frames,
  identityImages = [],
  clothingImages = [],
  modelDescription = '',
  clothingNotes = '',
  imageConfig = {},
  delayMs = 2000
}) {
  const results = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    console.log(`[ShootGenerator] Generating frame ${i + 1}/${frames.length}: ${frame.label || frame.id}`);

    const result = await generateShootFrame({
      universe,
      frame,
      identityImages,
      clothingImages,
      modelDescription,
      clothingNotes,
      extraPrompt: frame.extraPrompt || '',
      imageConfig
    });

    results.push({
      frameId: frame.id || `frame-${i}`,
      frameLabel: frame.label || `Frame ${i + 1}`,
      ...result
    });

    // Delay between requests
    if (i < frames.length - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

