/**
 * Custom Shoot Generator Service
 * 
 * REFACTORED to use Virtual Studio architecture.
 * 
 * New architecture:
 * - VirtualCamera (focal length, aperture, shutter speed)
 * - LightingManager (sources, modifiers, conflict resolution)
 * - ReferenceHandler (up to 14 images with [$n] token syntax)
 * - Reasoning-based prompt structure
 */

import { requestGeminiImage } from '../providers/geminiClient.js';
import { buildCollage } from '../utils/imageCollage.js';
import { loadImageBuffer, isStoredImagePath } from '../store/imageStore.js';
import { getEmotionById, buildEmotionPrompt, GLOBAL_EMOTION_RULES } from '../schema/emotion.js';
import { POSE_ADHERENCE_MAP } from './shootGenerator.js';
import { buildLocationPromptSnippet, buildAmbientPrompt } from '../schema/location.js';
import { generateImageId } from '../schema/customShoot.js';

// New Virtual Studio imports
import { 
  buildVirtualCameraPrompt, 
  getVirtualCameraKeywords, 
  validateVirtualCamera,
  getDefaultVirtualCamera,
  FOCAL_LENGTH,
  APERTURE,
  SHUTTER_SPEED
} from '../schema/virtualCamera.js';

import { 
  buildLightingPrompt, 
  getLightingKeywords, 
  validateLighting,
  getDefaultLighting,
  detectTemperatureConflict,
  LIGHT_SOURCES,
  LIGHT_MODIFIERS
} from '../schema/lightingManager.js';

import { 
  createReferenceCollection, 
  buildReferencePrompt, 
  getImagesForApi, 
  validateCollection,
  MAX_REFERENCES
} from '../schema/referenceHandler.js';

import {
  QUALITY_MODES,
  ASPECT_RATIOS,
  buildVirtualStudioPrompt,
  generateVirtualStudioImage,
  validateVirtualStudioConfig
} from './virtualStudioGenerator.js';

// Universe params (Custom Shoot 4)
import { 
  buildUnifiedUniverseNarrative,
  buildStrictUniverseNarrative,
  buildUniverseNarrativeByMode 
} from '../schema/universeNarrativeBuilder.js';

import { 
  checkUniverseConflicts,
  getConflicts,
  generateConflictNote 
} from '../schema/universeConflicts.js';

// ═══════════════════════════════════════════════════════════════
// RE-EXPORTS for backward compatibility
// ═══════════════════════════════════════════════════════════════

export { 
  QUALITY_MODES, 
  ASPECT_RATIOS,
  FOCAL_LENGTH,
  APERTURE,
  SHUTTER_SPEED,
  LIGHT_SOURCES,
  LIGHT_MODIFIERS,
  MAX_REFERENCES
};

// ═══════════════════════════════════════════════════════════════
// STYLE & LOCATION LOCK PROMPTS (kept for backward compatibility)
// ═══════════════════════════════════════════════════════════════

/**
 * Build Style Lock prompt block
 */
function buildStyleLockPrompt(lock) {
  if (!lock || !lock.enabled) return null;
  
  if (lock.mode === 'strict') {
    return `STYLE REFERENCE (STRICT VISUAL MATCH) — [$2]:
===========================================
The reference photo [$2] defines the VISUAL STYLE. Copy these elements:

✓ COPY FROM [$2]:
  - Color grading / color palette / white balance
  - Lighting style (soft/hard, direction, contrast ratio)
  - Film look / grain / texture treatment
  - Makeup style (eyeliner, lip color, blush, etc.)
  - Hair styling (texture, shine, volume)
  - Overall mood and atmosphere

✗ DO NOT COPY FROM [$2]:
  - The pose — use pose from other references or prompt
  - The camera angle — use angle from prompt
  - The framing/crop — use framing from prompt

IMPORTANT: Pose and composition are controlled by other parameters.
Follow the prompt for pose/angle/framing, follow [$2] for visual style.`;
  }
  
  if (lock.mode === 'soft') {
    return `STYLE REFERENCE (SOFT MATCH) — [$2]:
Use [$2] for visual inspiration:
- Similar color temperature and overall mood
- Similar lighting quality and direction  
- Similar texture treatment and contrast level

Pose and composition: Follow the PROMPT instructions, not [$2].`;
  }
  
  return null;
}

/**
 * Build Location Lock prompt block
 */
function buildLocationLockPrompt(lock) {
  if (!lock || !lock.enabled) return null;
  
  if (lock.mode === 'strict') {
    return `LOCATION REFERENCE — ENVIRONMENT ONLY (CRITICAL) — [$5]:
Use the SAME PHYSICAL SPACE from [$5]:
✓ COPY: The room/space architecture, layout, walls
✓ COPY: Furniture, props, decorative elements visible in the space
✓ COPY: Materials, textures, colors of the environment
✓ COPY: General lighting environment (natural/artificial, warm/cool)
✓ COPY: The "vibe" and atmosphere of the place

⚠️ MODEL POSITION IS FREE:
✗ The model does NOT need to be in the same spot
✗ Camera can show DIFFERENT ANGLE of the same space
✗ Model can be in FOREGROUND, BACKGROUND, or different area

The reference [$5] defines the SPACE, not where the model stands.`;
  }
  
  if (lock.mode === 'soft') {
    return `LOCATION REFERENCE (SOFT MATCH) — [$5]:
Use a similar type of environment to [$5]:
- Same general vibe (cozy interior, urban exterior, etc.)
- Similar materials and color palette
- Similar mood and atmosphere

The specific space can be different. Model position is free.`;
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN PROMPT BUILDER (Updated for Virtual Studio)
// ═══════════════════════════════════════════════════════════════

/**
 * Build complete prompt for Custom Shoot generation
 * Now integrates Virtual Studio architecture
 */
export function buildCustomShootPrompt({
  // Virtual Studio parameters (new)
  virtualCamera = null,
  lighting = null,
  
  // Universe parameters (Custom Shoot 4)
  universeParams = null,
  
  // Legacy parameters (supported for backward compatibility)
  customUniverse = null,
  locks = null,
  frame = null,
  location = null,
  emotionId = null,
  extraPrompt = '',
  modelDescription = '',
  clothingDescriptions = [],
  clothingItemPrompts = [], // NEW: structured prompts per clothing item [{ name, prompt }]
  lookPrompt = '',          // NEW: overall outfit style prompt
  hasIdentityRefs = false,
  hasClothingRefs = false,
  hasStyleRef = false,
  hasLocationRef = false,
  hasPoseSketch = false,
  poseAdherence = 2,
  
  // Quality settings
  qualityMode = 'DRAFT',
  mood = 'natural'
}) {
  
  // Use Virtual Studio if virtualCamera is provided, otherwise use legacy
  const useVirtualStudio = virtualCamera != null;
  
  // Use Universe system (Custom Shoot 4) if universeParams provided
  const useUniverse = universeParams != null;
  
  const sections = [];
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 1: ROLE (Reasoning-based)
  // ═══════════════════════════════════════════════════════════════
  
  sections.push(`ROLE: World-class Cinematographer & Art Director.

You are an expert in visual storytelling with technical mastery and artistic vision.
Generate a photorealistic fashion photograph suitable for major publication.`);
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 2: HARD RULES
  // ═══════════════════════════════════════════════════════════════
  
  const hardRules = [
    'Return photorealistic images (NO illustration, NO CGI, NO 3D render, NO painterly look).',
    'Natural skin texture, believable fabric behavior, real optics.',
    'No watermarks, no text overlays, no captions, no logos.'
  ];
  
  if (hasIdentityRefs) {
    hardRules.push('FACE IDENTITY IS CRITICAL: The generated person MUST be the EXACT SAME person as in identity reference [$1]. Same face shape, eyes, nose, lips.');
  }
  
  if (hasClothingRefs) {
    hardRules.push('CLOTHING IS CRITICAL: Garments MUST match reference images exactly — same silhouette, length, fit, colors, construction.');
  }
  
  hardRules.push('Do NOT invent brands, logos, or text.');
  
  sections.push(`
TASK: Analyze constraints and generate a photorealistic image.

HARD RULES:
${hardRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`);
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 3: REASONING STEPS
  // ═══════════════════════════════════════════════════════════════
  
  const reasoningSteps = [];
  
  if (useVirtualStudio) {
    const focalLabel = virtualCamera.focalLength ? FOCAL_LENGTH[virtualCamera.focalLength]?.label : 'Portrait';
    reasoningSteps.push(`1. OPTICAL ANALYSIS: Apply ${focalLabel} lens characteristics for perspective and depth.`);
    
    if (lighting?.primarySource) {
      const sourceLabel = LIGHT_SOURCES[lighting.primarySource]?.label || lighting.primarySource;
      reasoningSteps.push(`2. LIGHTING SETUP: Establish ${sourceLabel} as primary illumination for "${mood}" mood.`);
    }
  }
  
  if (hasIdentityRefs) {
    reasoningSteps.push(`${reasoningSteps.length + 1}. IDENTITY MATCHING: Person in [$1] MUST appear with exact facial features preserved.`);
  }
  
  if (hasClothingRefs) {
    reasoningSteps.push(`${reasoningSteps.length + 1}. CLOTHING ACCURACY: Recreate garments from [$3]/[$4] with precise silhouette and construction.`);
  }
  
  if (hasStyleRef) {
    reasoningSteps.push(`${reasoningSteps.length + 1}. STYLE APPLICATION: Apply color grading and mood from [$2] to the image.`);
  }
  
  if (reasoningSteps.length > 0) {
    sections.push(`
REASONING STEPS (analyze before generating):

${reasoningSteps.join('\n')}`);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 4: UNIVERSE / VISUAL DNA (Custom Shoot 4)
  // Один монолитный блок с полным описанием визуальной вселенной
  // Режим: 'strict' (жёсткие директивы) или 'soft' (нарративный)
  // ═══════════════════════════════════════════════════════════════
  
  if (useUniverse && universeParams) {
    // Определяем режим промпта: strict (новый) или soft (старый)
    // По умолчанию используем descriptive для описательного стиля арт-директора
    // Доступные режимы: 'soft', 'strict', 'descriptive'
    const promptStyle = universeParams.promptStyle || 'descriptive';
    
    const universeNarrative = buildUniverseNarrativeByMode(universeParams, promptStyle);
    if (universeNarrative) {
      sections.push(`
═══════════════════════════════════════════════════════════════
UNIVERSE / VISUAL DNA (LOCKED — applies to ALL frames)
═══════════════════════════════════════════════════════════════

${universeNarrative}`);
    }
    
    // Проверяем конфликты и добавляем предупреждения
    const conflicts = getConflicts(universeParams);
    if (conflicts.length > 0) {
      const conflictNote = generateConflictNote(universeParams);
      if (conflictNote) {
        sections.push(conflictNote);
      }
      console.log('[CustomShootGenerator] ⚠️ Parameter conflicts detected:', conflicts.map(c => c.id));
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 4B: VIRTUAL CAMERA (legacy Virtual Studio system)
  // Используется если universeParams НЕ переданы
  // ═══════════════════════════════════════════════════════════════
  
  if (!useUniverse && useVirtualStudio && virtualCamera) {
    const cameraPrompt = buildVirtualCameraPrompt(virtualCamera);
    sections.push(`
${cameraPrompt}`);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 5: LIGHTING (legacy Virtual Studio system)
  // Используется если universeParams НЕ переданы
  // ═══════════════════════════════════════════════════════════════
  
  if (!useUniverse && useVirtualStudio && lighting) {
    const lightingPrompt = buildLightingPrompt(lighting);
    sections.push(`
${lightingPrompt}`);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 6: STYLE LOCK
  // ═══════════════════════════════════════════════════════════════
  
  if (locks?.style?.enabled && hasStyleRef) {
    const styleLockPrompt = buildStyleLockPrompt(locks.style);
    if (styleLockPrompt) {
      sections.push(`
${styleLockPrompt}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 7: LOCATION LOCK
  // ═══════════════════════════════════════════════════════════════
  
  if (locks?.location?.enabled && hasLocationRef) {
    const locationLockPrompt = buildLocationLockPrompt(locks.location);
    if (locationLockPrompt) {
      sections.push(`
${locationLockPrompt}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 8: LOCATION (if not using location lock)
  // ═══════════════════════════════════════════════════════════════
  
  if (location && !hasLocationRef) {
    const locationDesc = buildLocationPromptSnippet(location) || location.description || '';
    if (locationDesc) {
      sections.push(`
=== LOCATION ===
${location.label}: ${locationDesc}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 9: FRAME/POSE
  // ═══════════════════════════════════════════════════════════════
  
  if (frame) {
    sections.push(`
=== FRAME / POSE ===
${frame.label || 'Custom frame'}: ${frame.description || frame.poseDescription || ''}`);
    
    if (hasPoseSketch) {
      const adherence = POSE_ADHERENCE_MAP[poseAdherence] || POSE_ADHERENCE_MAP[2];
      sections.push(`
=== POSE SKETCH REFERENCE [$6] ===

ADHERENCE LEVEL: ${poseAdherence}/4 (${adherence.label.toUpperCase()}) — Match ~${adherence.matchPercent}

${adherence.instruction}

${adherence.forbid ? `⛔ ${adherence.forbid}` : ''}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 10: EMOTION
  // ═══════════════════════════════════════════════════════════════
  
  if (emotionId) {
    const emotion = getEmotionById(emotionId);
    if (emotion) {
      const emotionPrompt = buildEmotionPrompt(emotionId, 2);
      sections.push(`
=== EMOTION / EXPRESSION ===
The model MUST show "${emotion.label}" emotion. This is NOT optional.

${emotionPrompt}

${emotion.physicalHints ? `Physical cues: ${Array.isArray(emotion.physicalHints) ? emotion.physicalHints.join(', ') : emotion.physicalHints}` : ''}
${emotion.avoid ? `AVOID: ${Array.isArray(emotion.avoid) ? emotion.avoid.join(', ') : emotion.avoid}` : ''}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 11: IDENTITY RULES
  // ═══════════════════════════════════════════════════════════════
  
  if (hasIdentityRefs) {
    sections.push(`
=== IDENTITY PRESERVATION (CRITICAL — [$1]) ===

The generated image MUST show the EXACT SAME person as in reference [$1].

FACIAL STRUCTURE (must match exactly):
- Face shape: identical shape
- Eyes: same spacing, shape, size, color
- Nose: same bridge width, nostril shape, tip
- Lips: same fullness, shape, proportions
- Jawline and cheekbones: same definition

FORBIDDEN:
- Do NOT beautify or idealize the face
- Do NOT change eye color
- Do NOT make face more symmetrical
- Do NOT smooth away distinctive features

${modelDescription ? `Additional notes: ${modelDescription}` : ''}`);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 12: CLOTHING RULES
  // ═══════════════════════════════════════════════════════════════
  
  if (hasClothingRefs) {
    // Build clothing description section
    let clothingSection = `
=== CLOTHING ACCURACY (CRITICAL — [$3], [$4]) ===

Recreate garments from reference images with MAXIMUM accuracy:

MUST MATCH:
- Exact silhouette (wide stays wide, slim stays slim)
- Exact proportions and lengths
- Exact colors and patterns
- Construction details (seams, buttons, pockets)
- Fabric behavior (structured vs flowing)`;

    // Add overall look/outfit style if provided
    if (lookPrompt && lookPrompt.trim()) {
      clothingSection += `

OUTFIT STYLE:
${lookPrompt.trim()}`;
    }
    
    // Add structured clothing item prompts (NEW format)
    if (clothingItemPrompts && clothingItemPrompts.length > 0) {
      clothingSection += `

CLOTHING ITEMS:`;
      clothingItemPrompts.forEach((item, i) => {
        const name = item.name ? `${item.name}: ` : `Item ${i + 1}: `;
        clothingSection += `
• ${name}${item.prompt}`;
      });
    }
    // Fallback to old format (simple descriptions per image)
    else if (clothingDescriptions.length > 0) {
      clothingSection += `

USER DESCRIPTIONS:
${clothingDescriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')}`;
    }
    
    sections.push(clothingSection);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 13: ANTI-AI AUTHENTICITY (только для legacy mode)
  // При использовании universeParams — anti-ai уже включён в нарратив
  // ═══════════════════════════════════════════════════════════════
  
  if (!useUniverse) {
    sections.push(`
=== AUTHENTICITY (Anti-AI) ===

The image should feel captured by a skilled photographer, not generated.

INCLUDE:
- Natural skin texture with visible pores
- Subtle asymmetry in facial features
- Real fabric behavior with natural folds
- Authentic catchlights in eyes

AVOID:
- Plastic, airbrushed skin
- Perfect symmetry
- Empty, lifeless eyes
- HDR or hyper-processed look`);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 14: EXTRA INSTRUCTIONS
  // ═══════════════════════════════════════════════════════════════
  
  if (extraPrompt) {
    sections.push(`
=== ADDITIONAL INSTRUCTIONS ===

${extraPrompt}`);
  }
  
  // Build final prompt
  const prompt = sections.join('\n');
  
  // Build JSON representation
  const promptJson = {
    format: useUniverse ? 'custom_shoot_universe_v1' : 'custom_shoot_virtual_studio_v1',
    generatedAt: new Date().toISOString(),
    useVirtualStudio,
    useUniverse,
    virtualCamera: useVirtualStudio && !useUniverse ? virtualCamera : null,
    lighting: useVirtualStudio && !useUniverse ? lighting : null,
    universeParams: useUniverse ? universeParams : null,
    qualityMode,
    mood,
    hasIdentityRefs,
    hasClothingRefs,
    hasStyleRef,
    hasLocationRef,
    hasPoseSketch,
    emotionId,
    poseAdherence
  };
  
  return { prompt, promptJson };
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a frame for a Custom Shoot
 * Updated to support Virtual Studio architecture
 */
export async function generateCustomShootFrame({
  shoot,
  identityImages = [],
  clothingImages = [],
  clothingDescriptions = [],
  clothingItemPrompts = [], // NEW: prompts grouped by clothing item [{ name, prompt }]
  lookPrompt = '',          // NEW: overall outfit style prompt
  styleRefImage = null,
  locationRefImage = null,
  locationSketchImage = null,
  poseSketchImage = null,
  frame = null,
  emotionId = null,
  extraPrompt = '',
  location = null,
  presets = null,
  aspectRatio = null,
  imageSize = null,
  
  // Virtual Studio parameters (new)
  virtualCamera = null,
  lighting = null,
  qualityMode = 'DRAFT',
  mood = 'natural',
  
  // Universe parameters (Custom Shoot 4)
  universeParams = null,
  
  // Legacy parameters (kept for compatibility)
  captureStyle = null,
  cameraSignature = null,
  skinTexture = null,
  poseAdherence = 2,
  composition = null,
  antiAi = null,
  ambient = null,
  modelBehavior = null,
  lensFocalLength = null
}) {
  try {
    const useUniverse = universeParams != null;
    const useVirtualStudio = virtualCamera != null;
    
    console.log('[CustomShootGenerator] Starting frame generation...', {
      mode: useUniverse ? 'Universe (CS4)' : useVirtualStudio ? 'Virtual Studio' : 'Legacy'
    });
    
    const { locks, globalSettings } = shoot;
    
    // Build reference collection with proper slot assignments
    const references = [];
    let refSlot = 1;
    
    // Slot 1: Identity (Subject)
    if (identityImages.length > 0) {
      const identityBoard = await packImagesToBoard(identityImages, { maxSize: 1536, minTile: 512 });
      if (identityBoard) {
        references.push({
          mimeType: identityBoard.mimeType,
          base64: identityBoard.base64,
          type: 'SUBJECT',
          description: 'Identity reference'
        });
      }
    }
    
    // Slot 2: Style reference
    if (styleRefImage && locks?.style?.enabled) {
      references.push({
        mimeType: styleRefImage.mimeType,
        base64: styleRefImage.base64,
        type: 'STYLE',
        description: 'Style lock reference'
      });
    }
    
    // Slots 3-4: Clothing
    for (let i = 0; i < Math.min(clothingImages.length, 2); i++) {
      references.push({
        mimeType: clothingImages[i].mimeType,
        base64: clothingImages[i].base64,
        type: 'CLOTHING',
        description: clothingDescriptions[i] || `Clothing item ${i + 1}`
      });
    }
    
    // Slot 5: Location reference
    if (locationRefImage && locks?.location?.enabled) {
      references.push({
        mimeType: locationRefImage.mimeType,
        base64: locationRefImage.base64,
        type: 'LOCATION',
        description: 'Location lock reference'
      });
    } else if (locationSketchImage) {
      references.push({
        mimeType: locationSketchImage.mimeType,
        base64: locationSketchImage.base64,
        type: 'LOCATION',
        description: 'Location sketch'
      });
    }
    
    // Slot 6: Pose sketch
    if (poseSketchImage) {
      references.push({
        mimeType: poseSketchImage.mimeType,
        base64: poseSketchImage.base64,
        type: 'POSE',
        description: 'Pose sketch reference'
      });
    }
    
    // Add remaining clothing images (slots 7+)
    for (let i = 2; i < clothingImages.length; i++) {
      references.push({
        mimeType: clothingImages[i].mimeType,
        base64: clothingImages[i].base64,
        type: 'CLOTHING',
        description: clothingDescriptions[i] || `Clothing item ${i + 1}`
      });
    }
    
    // Create reference collection
    const refCollection = createReferenceCollection(references);
    
    console.log('[CustomShootGenerator] Reference collection:', {
      total: refCollection.images.length,
      slots: Object.keys(refCollection.slots).map(s => `[$${s}]`)
    });
    
    // Build prompt
    const { prompt, promptJson } = buildCustomShootPrompt({
      virtualCamera: useVirtualStudio ? virtualCamera : null,
      lighting: useVirtualStudio ? lighting : null,
      universeParams,
      customUniverse: shoot.customUniverse,
      locks,
      frame,
      location,
      emotionId,
      extraPrompt,
      modelDescription: '',
      clothingDescriptions,
      clothingItemPrompts,  // NEW: structured prompts per clothing item
      lookPrompt,           // NEW: overall outfit style
      hasIdentityRefs: identityImages.length > 0,
      hasClothingRefs: clothingImages.length > 0,
      hasStyleRef: !!styleRefImage && locks?.style?.enabled,
      hasLocationRef: !!locationRefImage && locks?.location?.enabled,
      hasPoseSketch: !!poseSketchImage,
      poseAdherence,
      qualityMode,
      mood
    });
    
    console.log('[CustomShootGenerator] Prompt built, length:', prompt.length);
    
    // Get quality settings
    const quality = QUALITY_MODES[qualityMode] || QUALITY_MODES.DRAFT;
    const effectiveAspectRatio = aspectRatio || globalSettings?.imageConfig?.aspectRatio || '3:4';
    const effectiveImageSize = imageSize || quality.imageSize;
    
    // Get reference images for API
    const referenceImages = getImagesForApi(refCollection);
    
    // Build image config
    const imageConfig = {
      aspectRatio: effectiveAspectRatio,
      imageSize: effectiveImageSize
    };
    
    console.log('[CustomShootGenerator] Calling Gemini:', {
      qualityMode,
      imageConfig,
      referenceCount: referenceImages.length
    });
    
    const startTime = Date.now();
    
    // Call Gemini
    const result = await requestGeminiImage({
      prompt,
      referenceImages,
      imageConfig
    });
    
    const generationTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!result.ok) {
      console.error('[CustomShootGenerator] Generation failed:', result.error);
      return {
        ok: false,
        error: result.error
      };
    }
    
    console.log('[CustomShootGenerator] Generation successful in', generationTime, 'seconds');
    
    return {
      ok: true,
      image: {
        mimeType: result.mimeType,
        base64: result.base64,
        dataUrl: `data:${result.mimeType};base64,${result.base64}`
      },
      prompt,
      promptJson,
      generationTime,
      paramsSnapshot: {
        useVirtualStudio,
        useUniverse: !!universeParams,
        virtualCamera,
        lighting,
        universeParams,
        qualityMode,
        aspectRatio: effectiveAspectRatio,
        poseAdherence,
        referenceCount: referenceImages.length
      }
    };
    
  } catch (error) {
    console.error('[CustomShootGenerator] Error:', error);
    return {
      ok: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Pack images into a collage for Gemini
 */
async function packImagesToBoard(images, options = {}) {
  if (!images || images.length === 0) return null;
  if (images.length === 1) return images[0];
  
  return await buildCollage(images, {
    maxSize: options.maxSize || 2048,
    maxCols: options.maxCols || 3,
    minTile: options.minTile || 400,
    jpegQuality: options.jpegQuality || 92,
    fit: options.fit || 'cover',
    background: options.background || '#ffffff'
  });
}

/**
 * Prepare image object from URL/dataURL or file path for generation
 */
export async function prepareImageFromUrl(imageUrl) {
  if (!imageUrl) return null;
  
  // If it's already a data URL
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return {
        mimeType: match[1],
        base64: match[2]
      };
    }
  }
  
  // If it's a stored image path
  if (isStoredImagePath(imageUrl)) {
    const result = await loadImageBuffer(imageUrl);
    if (result.ok) {
      return {
        mimeType: result.mimeType,
        base64: result.buffer.toString('base64')
      };
    }
  }
  
  console.warn('[CustomShootGenerator] Unknown image reference format:', imageUrl.slice(0, 50));
  return null;
}

/**
 * Get all Virtual Studio options for UI
 */
export function getVirtualStudioOptions() {
  return {
    qualityModes: Object.values(QUALITY_MODES),
    aspectRatios: Object.entries(ASPECT_RATIOS).map(([id, config]) => ({ id, ...config })),
    focalLengths: Object.values(FOCAL_LENGTH).map(f => ({
      id: f.id,
      label: f.label,
      range: f.range,
      description: f.description
    })),
    apertures: Object.values(APERTURE).map(a => ({
      id: a.id,
      label: a.label,
      range: a.range,
      description: a.description
    })),
    shutterSpeeds: Object.values(SHUTTER_SPEED).map(s => ({
      id: s.id,
      label: s.label,
      range: s.range,
      description: s.description
    })),
    lightSources: Object.values(LIGHT_SOURCES).map(l => ({
      id: l.id,
      label: l.label,
      category: l.category,
      temperature: l.temperature,
      description: l.description
    })),
    lightModifiers: Object.values(LIGHT_MODIFIERS).map(m => ({
      id: m.id,
      label: m.label,
      quality: m.quality,
      description: m.description
    }))
  };
}
