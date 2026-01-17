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
import { requestVertexImage } from '../providers/vertexClient.js';
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
  sanitizeUniverseParams,
  checkUniverseConflicts,
  getConflicts,
  generateConflictNote
} from '../schema/universeConflicts.js';

import { buildV5Prompt, applyDependencies as applyV5Dependencies } from '../schema/customShootV5.js';

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
 * @deprecated Location Lock removed - location is now implied in Style Lock
 * Kept for backward compatibility with old shoots that may have location lock data
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
// V6 STYLE PRESET PROMPT BUILDER (AI Director mode)
// ═══════════════════════════════════════════════════════════════

/**
 * Build prompt for V6 mode using AI Director style preset
 * Uses naturalPrompt and antiAiDirectives from the preset
 */
export function buildV6StylePrompt({
  styleParams,
  extraPrompt = '',
  hasIdentityRefs = false,
  hasClothingRefs = false,
  hasStyleRef = false,
  hasLocationSketch = false,
  hasPoseSketch = false,
  poseAdherence = 2,
  lookPrompt = '',
  clothingItemPrompts = [],
  clothingDescriptions = []
}) {
  const sections = [];

  // Header
  sections.push(`═══════════════════════════════════════════════════════════════
V6 AI DIRECTOR STYLE GENERATION
Style Preset: ${styleParams.presetId || 'Custom'}
═══════════════════════════════════════════════════════════════`);

  // Natural prompt from preset (the core of V6)
  if (styleParams.naturalPrompt) {
    sections.push(`
=== VISUAL STYLE (from AI Director) ===

${styleParams.naturalPrompt}`);
  }

  // Anti-AI directives from preset (becomes negative prompt elements)
  if (styleParams.antiAiDirectives && styleParams.antiAiDirectives.length > 0) {
    sections.push(`
=== AUTHENTICITY REQUIREMENTS (Anti-AI) ===

MUST INCLUDE:
${styleParams.antiAiDirectives.map(d => '• ' + d).join('\n')}

The image must feel like genuine professional photography, not AI-generated.`);
  }

  // Identity preservation (if refs provided)
  if (hasIdentityRefs) {
    sections.push(`
=== IDENTITY PRESERVATION (CRITICAL — [$1]) ===

The generated image MUST show the EXACT SAME person as in reference [$1].

FACIAL STRUCTURE (must match exactly):
- Face shape, eyes, nose, lips: identical to reference
- Jawline and cheekbones: same definition

STRICT STYLE ISOLATION:
- EXTRACT ONLY the physical facial structure/features from [$1].
- IGNORE ALL lighting, color grading, shadows, and artistic style from [$1].
- The image MUST use the lighting/style defined in the STYLE PRESET, NOT the reference.

FORBIDDEN:
- Do NOT beautify or idealize the face
- Do NOT change eye color
- Do NOT make face more symmetrical`);
  }

  // Clothing (if refs provided)
  if (hasClothingRefs) {
    let clothingSection = `
=== CLOTHING ACCURACY (CRITICAL — [$3], [$4]) ===

Recreate garments from reference images with MAXIMUM accuracy.

STRICT ISOLATION:
- Use references [$3], [$4] ONLY for garment structure, cut, and texture.
- IGNORE lighting and color casting from these references.
- Integrate the clothing naturally into the new scene's lighting.`;

    if (lookPrompt && lookPrompt.trim()) {
      clothingSection += `

OUTFIT STYLE:
${lookPrompt.trim()}`;
    }

    if (clothingItemPrompts && clothingItemPrompts.length > 0) {
      clothingSection += `

CLOTHING ITEMS:`;
      clothingItemPrompts.forEach((item, i) => {
        const name = item.name ? `${item.name}: ` : `Item ${i + 1}: `;
        clothingSection += `
• ${name}${item.prompt}`;
      });
    } else if (clothingDescriptions.length > 0) {
      clothingSection += `

USER DESCRIPTIONS:
${clothingDescriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')}`;
    }

    sections.push(clothingSection);
  }

  // Style Lock reference
  if (hasStyleRef) {
    sections.push(`
=== STYLE LOCK REFERENCE ([$2]) ===

Copy the following from the style reference:
- Color grading
- Lighting setup
- Overall mood and atmosphere
- Location/background`);
  }

  // Pose sketch (if provided)
  if (hasPoseSketch) {
    const POSE_ADHERENCE_MAP = {
      1: { label: 'Creative Freedom', instruction: 'Use pose as loose inspiration only.' },
      2: { label: 'Natural Variation', instruction: 'Follow general pose but allow natural adjustments.' },
      3: { label: 'Structured Match', instruction: 'Match pose closely with minor variations.' },
      4: { label: 'Strict Match', instruction: 'Copy pose exactly from sketch.' }
    };

    const adherence = POSE_ADHERENCE_MAP[poseAdherence] || POSE_ADHERENCE_MAP[2];
    sections.push(`
=== POSE REFERENCE ([$6]) ===

ADHERENCE LEVEL: ${poseAdherence}/4 (${adherence.label})
${adherence.instruction}`);
  }

  // Extra instructions
  if (extraPrompt) {
    sections.push(`
=== ADDITIONAL INSTRUCTIONS ===

${extraPrompt}`);
  }

  const prompt = sections.join('\n');

  const promptJson = {
    format: 'v6_style_preset',
    generatedAt: new Date().toISOString(),
    presetId: styleParams.presetId,
    hasIdentityRefs,
    hasClothingRefs,
    hasStyleRef,
    hasLocationSketch,
    hasPoseSketch,
    poseAdherence
  };

  return { prompt, promptJson };
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
  // hasLocationRef removed - Location Lock removed, location is implied in Style Lock
  hasLocationSketch = false, // true if location sketch is being passed (only when Style Lock is OFF)
  hasPoseSketch = false,
  poseAdherence = 2,

  // Composition (shotSize + cameraAngle)
  composition = null,

  // Quality settings
  qualityMode = 'DRAFT',
  mood = 'natural'
}) {

  // Use Virtual Studio if virtualCamera is provided, otherwise use legacy
  const useVirtualStudio = virtualCamera != null;

  // Use Universe system (Custom Shoot 4) if universeParams provided
  const useUniverse = universeParams != null;

  // ═══════════════════════════════════════════════════════════════
  // V5 LOGIC (Strict Technical / Narrative Artistic)
  // New architecture with dependency matrix and smart conflict resolution
  // ═══════════════════════════════════════════════════════════════
  if (useUniverse && universeParams.version === 'v5') {
    // If nested in 'universe' key (from some UI states), extract it
    const params = universeParams.universe || universeParams;

    // Build comprehensive scene object with ALL available data
    const scene = {
      // From frame
      action: frame?.description || frame?.poseDescription || '',
      pose: frame?.poseDescription || '',
      environment: frame?.environment || '',
      texture: frame?.texture || '',
      clothingFocus: frame?.clothingFocus || '',

      // Location
      location: location,

      // Emotion
      emotionId: emotionId,

      // Model description
      modelDescription: modelDescription,

      // Clothing
      clothingDescriptions: clothingDescriptions,
      clothingItemPrompts: clothingItemPrompts,
      lookPrompt: lookPrompt,

      // Composition
      shotSize: composition?.shotSize || 'default',
      cameraAngle: composition?.cameraAngle || 'eye_level',

      // Extra prompt from user
      extraPrompt: extraPrompt,

      // Pose adherence level
      poseAdherence: poseAdherence,

      // Format
      aspectRatio: universeParams.aspectRatio || '3:4', // Fallback defaults
      imageSize: universeParams.imageSize || '2K',

      // Reference flags
      hasIdentityRefs: hasIdentityRefs,
      hasClothingRefs: hasClothingRefs,
      hasStyleRef: hasStyleRef,
      hasPoseSketch: hasPoseSketch
    };

    // Build V5 prompt with dependency resolution
    const { prompt: v5Prompt, resolvedParams, corrections } = buildV5Prompt(params, scene);

    // Log any corrections made
    if (corrections.length > 0) {
      console.log('[CustomShootGenerator] V5 auto-corrections applied:',
        corrections.map(c => `${c.field}: ${c.from} → ${c.to}`).join(', ')
      );
    }

    const promptJson = {
      format: 'custom_shoot_v5_smart',
      generatedAt: new Date().toISOString(),
      useUniverse: true,
      version: 'v5',
      originalParams: params,
      resolvedParams,
      corrections,
      frame,
      location,
      emotionId,
      extraPrompt,
      composition,
      qualityMode,
      mood
    };

    return { prompt: v5Prompt, promptJson };
  }

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
    // ═══════════════════════════════════════════════════════════════
    // SMART SANITIZATION: Auto-fix conflicting parameters
    // Студия → indoor погода, ночь → нет солнца, и т.д.
    // ═══════════════════════════════════════════════════════════════
    const { params: sanitizedParams, corrections, wasModified } = sanitizeUniverseParams(universeParams);

    if (wasModified) {
      console.log('[CustomShootGenerator] 🔧 Auto-corrected universe params:',
        corrections.map(c => `${c.param}: ${c.from}→${c.to}`).join(', ')
      );
    }

    // Определяем режим промпта: strict (новый) или soft (старый)
    // По умолчанию используем descriptive для описательного стиля арт-директора
    // Доступные режимы: 'soft', 'strict', 'descriptive'
    const promptStyle = sanitizedParams.promptStyle || 'descriptive';

    const universeNarrative = buildUniverseNarrativeByMode(sanitizedParams, promptStyle);
    if (universeNarrative) {
      sections.push(`
═══════════════════════════════════════════════════════════════
UNIVERSE / VISUAL DNA (LOCKED — applies to ALL frames)
═══════════════════════════════════════════════════════════════

${universeNarrative}`);
    }

    // Проверяем конфликты и добавляем предупреждения (после санитизации)
    const conflicts = getConflicts(sanitizedParams);
    if (conflicts.length > 0) {
      const conflictNote = generateConflictNote(sanitizedParams);
      if (conflictNote) {
        sections.push(conflictNote);
      }
      console.log('[CustomShootGenerator] ⚠️ Remaining conflicts after sanitization:', conflicts.map(c => c.id));
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
  // SECTION 7: LOCATION LOCK - REMOVED
  // Location Lock functionality removed - location is now implied in Style Lock
  // If Style Lock is active, the location from the reference image will be preserved
  // ═══════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════
  // SECTION 8: LOCATION (only if Style Lock is NOT active)
  // If Style Lock is enabled, location is implied in the style reference
  // ═══════════════════════════════════════════════════════════════

  if (location && !hasStyleRef) {
    const locationDesc = buildLocationPromptSnippet(location) || location.description || '';
    if (locationDesc) {
      sections.push(`
=== LOCATION ===
${location.label}: ${locationDesc}`);
    }
  } else if (hasStyleRef) {
    // Style Lock is active - location is implied in the style reference
    sections.push(`
=== LOCATION ===
Use the location/background from the Style Lock reference image.`);
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
  // SECTION 9B: COMPOSITION (shotSize + cameraAngle) — STRICT
  // ═══════════════════════════════════════════════════════════════

  if (composition && (composition.shotSize || composition.cameraAngle)) {
    const SHOT_SIZE_DIRECTIVES = {
      extreme_closeup: 'EXTREME CLOSE-UP: Only face/detail visible, fills 90%+ of frame. NO body below chin.',
      closeup: 'CLOSE-UP: Head and shoulders ONLY. Face is primary focus. NO waist or below visible.',
      medium_closeup: 'MEDIUM CLOSE-UP: Chest and up. Upper body focus. NO legs visible.',
      medium: 'MEDIUM SHOT: Waist and up. Hands may be visible. NO knees or below.',
      medium_full: 'MEDIUM FULL: Knees and up. Most of body visible. Feet may be cropped.',
      full: 'FULL SHOT: ENTIRE body from head to feet. All limbs visible.',
      full_body: 'FULL BODY: ENTIRE body from head to feet. All limbs visible.',
      wide: 'WIDE SHOT: Full body PLUS significant environment context around subject.'
    };

    const CAMERA_ANGLE_DIRECTIVES = {
      birds_eye: 'BIRD\'S EYE VIEW: Camera DIRECTLY ABOVE subject, looking straight down. Subject appears flattened.',
      high: 'HIGH ANGLE: Camera ABOVE eye level, looking DOWN at subject. Subject appears smaller/vulnerable.',
      eye_level: 'EYE LEVEL: Camera at subject\'s eye height. Neutral, natural perspective.',
      low: 'LOW ANGLE: Camera BELOW eye level, looking UP at subject. Subject appears powerful/dominant.',
      worms_eye: 'WORM\'S EYE: Camera at GROUND level, looking UP. Extreme perspective, subject towers above.',
      dutch: 'DUTCH ANGLE: Camera TILTED 15-30° from horizontal. Creates dynamic tension/unease.',
      fisheye: 'FISHEYE: Extreme wide-angle with VISIBLE barrel distortion. Edges curve dramatically.'
    };

    const shotDesc = SHOT_SIZE_DIRECTIVES[composition.shotSize] || composition.shotSize;
    const angleDesc = CAMERA_ANGLE_DIRECTIVES[composition.cameraAngle] || composition.cameraAngle;

    let compositionBlock = `
=== COMPOSITION (MANDATORY — NOT NEGOTIABLE) ===`;

    if (composition.shotSize && composition.shotSize !== 'default') {
      compositionBlock += `

FRAMING: ${shotDesc}`;
    }

    if (composition.cameraAngle && composition.cameraAngle !== 'eye_level') {
      compositionBlock += `

CAMERA ANGLE: ${angleDesc}`;
    }

    compositionBlock += `

⚠️ STRICT ENFORCEMENT:
- If CLOSE-UP specified → do NOT show full body
- If LOW ANGLE specified → camera MUST be below eye level
- If FISHEYE specified → edges MUST curve with visible distortion
- These are REQUIREMENTS, not suggestions`;

    sections.push(compositionBlock);
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

STRICT STYLE ISOLATION:
- EXTRACT ONLY the physical facial structure/features from [$1].
- IGNORE ALL lighting, color grading, shadows, and artistic style from [$1].
- The image MUST use the lighting/style defined in the main prompt, NOT the reference.

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
- Exact colors and patterns
- Construction details (seams, buttons, pockets)
- Fabric behavior (structured vs flowing)

STRICT SENSOR ISOLATION:
- Use references [$3], [$4] ONLY for garment structure/texture.
- IGNORE lighting and color casting from these references.
- Integrate the clothing naturally into the new scene's lighting.`;

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
    hasLocationSketch,
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
  // locationRefImage removed - Location Lock removed, location is implied in Style Lock
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

  // V6 Style Preset mode (AI Director)
  v6Mode = false,
  styleParams = null,  // { presetId, naturalPrompt, antiAiDirectives, technicalParams }

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
  const genId = `gen_${Date.now() % 100000}`;
  const startTime = Date.now();

  const log = (step, data = {}) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[CustomShootGenerator] [${genId}] [${elapsed}s] ${step}`,
      Object.keys(data).length > 0 ? JSON.stringify(data) : '');
  };

  try {
    const useUniverse = universeParams != null;
    const useVirtualStudio = virtualCamera != null;
    const useV6Style = v6Mode && styleParams != null;

    log('START', {
      mode: useV6Style ? 'V6 Style Preset' : useUniverse ? 'Universe (CS4)' : useVirtualStudio ? 'Virtual Studio' : 'Legacy',
      identityImages: identityImages.length,
      clothingImages: clothingImages.length,
      presetId: styleParams?.presetId || null
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
    // NOTE: Location Lock removed - if Style Lock is enabled, location is implied in style reference
    // locationSketchImage will be null if Style Lock is enabled (handled in customShootRoutes.js)
    const hasStyleLock = styleRefImage && locks?.style?.enabled;

    if (locationSketchImage && !hasStyleLock) {
      references.push({
        mimeType: locationSketchImage.mimeType,
        base64: locationSketchImage.base64,
        type: 'LOCATION',
        description: 'Location sketch'
      });
    } else if (hasStyleLock) {
      console.log('[CustomShootGenerator] Style Lock active - location implied in style reference, skipping location slot');
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
    let prompt, promptJson;

    if (useV6Style) {
      // V6 Mode: Build prompt from AI Director style preset
      const v6Result = buildV6StylePrompt({
        styleParams,
        extraPrompt,
        hasIdentityRefs: identityImages.length > 0,
        hasClothingRefs: clothingImages.length > 0,
        hasStyleRef: !!styleRefImage && locks?.style?.enabled,
        hasLocationSketch: !!locationSketchImage && !hasStyleLock,
        hasPoseSketch: !!poseSketchImage,
        poseAdherence,
        lookPrompt,
        clothingItemPrompts,
        clothingDescriptions
      });
      prompt = v6Result.prompt;
      promptJson = v6Result.promptJson;
      console.log('[CustomShootGenerator] V6 Style Prompt built, length:', prompt.length);
    } else {
      // V5/Legacy Mode: Build prompt using universe params or virtual studio
      const result = buildCustomShootPrompt({
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
        clothingItemPrompts,
        lookPrompt,
        hasIdentityRefs: identityImages.length > 0,
        hasClothingRefs: clothingImages.length > 0,
        hasStyleRef: !!styleRefImage && locks?.style?.enabled,
        hasLocationSketch: !!locationSketchImage && !hasStyleLock,
        hasPoseSketch: !!poseSketchImage,
        poseAdherence,
        composition,
        qualityMode,
        mood
      });
      prompt = result.prompt;
      promptJson = result.promptJson;
      console.log('[CustomShootGenerator] Prompt built, length:', prompt.length);
    }

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

    log('CALLING_GEMINI', {
      qualityMode,
      imageConfig,
      referenceCount: referenceImages.length,
      promptLength: prompt.length
    });

    const geminiStartTime = Date.now();

    // Call Gemini
    const result = await requestGeminiImage({
      prompt,
      referenceImages,
      imageConfig
    });

    const generationTime = ((Date.now() - geminiStartTime) / 1000).toFixed(1);

    log('GEMINI_RESPONSE', { ok: result.ok, duration: generationTime });

    if (!result.ok) {
      const errorMsg = result.error || '';
      const isOverloaded =
        result.errorCode === 'api_overloaded' ||
        result.httpStatus === 503 ||
        /overloaded/i.test(errorMsg) ||
        /service unavailable/i.test(errorMsg);

      if (isOverloaded) {
        log('GEMINI_OVERLOADED', { error: errorMsg, action: 'FALLBACK_VERTEX' });

        const vertexResult = await requestVertexImage({
          prompt,
          referenceImages,
          imageConfig
        });

        if (vertexResult.ok) {
          log('VERTEX_SUCCESS', { duration: ((Date.now() - geminiStartTime) / 1000).toFixed(1) });
          // Map Vertex result to standard result format (it matches already)
          // But ensure we log this success clearly

          return {
            ok: true,
            image: {
              mimeType: vertexResult.mimeType,
              base64: vertexResult.base64,
              dataUrl: `data:${vertexResult.mimeType};base64,${vertexResult.base64}`
            },
            prompt,
            promptJson,
            generationTime: ((Date.now() - geminiStartTime) / 1000).toFixed(1),
            paramsSnapshot: {
              useVirtualStudio,
              useUniverse: !!universeParams,
              virtualCamera,
              lighting,
              universeParams,
              qualityMode,
              aspectRatio: effectiveAspectRatio,
              poseAdherence,
              referenceCount: referenceImages.length,
              provider: 'vertex_fallback'
            }
          };
        } else {
          log('VERTEX_ERROR', { error: vertexResult.error });
          // If fallback fails, return original error or combined error
          return {
            ok: false,
            error: `Gemini Overloaded AND Vertex Failed. Gemini: ${errorMsg}. Vertex: ${vertexResult.error}`
          };
        }
      }

      log('GEMINI_ERROR', { error: result.error?.slice(0, 200) });
      return {
        ok: false,
        error: result.error
      };
    }

    log('GEMINI_SUCCESS', { duration: generationTime });

    log('RETURNING_RESULT');
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
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[CustomShootGenerator] [${genId}] [${elapsed}s] ERROR:`, error);
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

/**
 * Edit an existing generated image using a text instruction (multimodal)
 * Uses Gemini/Vertex in "editor" mode
 */
export async function editCustomShootImage({
  shoot,
  imageId,
  instruction
}) {
  const genId = `edit_${Date.now() % 100000}`;

  console.log(`[CustomShootGenerator] [${genId}] EDIT_START`, { shootId: shoot.id, imageId, instruction });

  if (!instruction || !instruction.trim()) {
    return { ok: false, error: 'Empty instruction' };
  }

  try {
    // 1. Find the original image record
    const sourceImage = (shoot.generatedImages || []).find(f => f.id === imageId) || (shoot.setup?.generatedFrames?.find(f => f.id === imageId));
    if (!sourceImage) {
      throw new Error('Image not found in shoot');
    }

    // 2. Load the actual image buffer
    const imagePath = sourceImage.imageUrl;
    let imageBuffer;
    let mimeType = 'image/jpeg';

    try {
      // Check if path is a stored path or full URL
      if (isStoredImagePath(imagePath)) {
        const res = await loadImageBuffer(imagePath);
        if (!res.ok) throw new Error(res.error);
        imageBuffer = res.buffer;
        mimeType = res.mimeType;
      } else if (imagePath.startsWith('data:')) {
        const match = imagePath.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          imageBuffer = Buffer.from(match[2], 'base64');
        } else {
          throw new Error('Invalid data URL');
        }
      } else {
        // Fallback or external URL? Assuming stored path relative to images
        // If it's a relative path not matching the regex, might be tricky.
        const res = await loadImageBuffer(imagePath);
        if (!res.ok) throw new Error(res.error);
        imageBuffer = res.buffer;
        mimeType = res.mimeType;
      }
    } catch (e) {
      console.error(`[Edit] Failed to load source image ${imagePath}:`, e);
      throw new Error('Failed to load source image file');
    }

    // 3. Construct the prompt
    const systemPrompt = `ROLE: Professional Photo Retoucher & Editor.
TASK: Edit the provided image according to the USER INSTRUCTION.

HARD RULES:
1. PRESERVE everything that is not mentioned in the instruction.
2. Maintain the exact same face identity, composition, lighting, and style.
3. The output must be photorealistic (no cartoons/illustrations).
4. If the instruction asks for an impossible change (e.g. "make it a video"), politely refuse or ignore and return best effort.

USER INSTRUCTION: "${instruction}"

Apply the change seamlessly.`;

    // 4. Call Gemini (or fallback Vertex)
    const imagePayload = {
      base64: imageBuffer.toString('base64'),
      mimeType: mimeType
    };

    let result = await requestGeminiImage({
      prompt: systemPrompt,
      referenceImages: [imagePayload],
      imageConfig: {
        aspectRatio: sourceImage.aspectRatio || '3:4',
        imageSize: sourceImage.imageSize || '2K'
      }
    });

    // Check for overload and fallback to Vertex
    if (!result.ok && result.errorCode === 'api_overloaded') {
      console.warn(`[CustomShootGenerator] [${genId}] Gemini overloaded, falling back to Vertex AI`);
      result = await requestVertexImage({
        prompt: systemPrompt,
        referenceImages: [imagePayload],
        imageConfig: {
          aspectRatio: sourceImage.aspectRatio || '3:4',
          imageSize: sourceImage.imageSize || '2K'
        }
      });
    }

    if (!result.ok) {
      throw new Error(result.error || 'Generation failed');
    }

    // 5. Return success data
    // We do NOT save here, the route handler does that.
    const newImageId = generateImageId();

    return {
      ok: true,
      data: {
        mimeType: result.mimeType,
        base64: result.base64,
        prompt: systemPrompt,
        // Inherit metadata from source
        ...sourceImage,
        id: newImageId,
        imageUrl: null, // to be set by saver
        timestamp: new Date().toISOString(),
        isStyleReference: false,
        frameLabel: (sourceImage.frameLabel || 'Image') + ' (Edited)',
        extraPrompt: instruction
      }
    };

  } catch (e) {
    console.error(`[CustomShootGenerator] [${genId}] Edit error:`, e);
    return { ok: false, error: e.message };
  }
}
