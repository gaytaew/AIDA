/**
 * Virtual Studio Generator
 * 
 * Reasoning-based prompt builder for the Virtual Studio.
 * Combines VirtualCamera, LightingManager, and References into
 * a structured "Mega-Prompt" optimized for Gemini 3 Pro Image.
 * 
 * Key features:
 * 1. Cinematographer Role prompt structure
 * 2. Reasoning Steps for AI "thinking"
 * 3. Technical Specs from VirtualCamera + LightingManager
 * 4. Reference tokens integration
 */

import { requestGeminiImage } from '../providers/geminiClient.js';
import { buildVirtualCameraPrompt, getVirtualCameraKeywords, validateVirtualCamera, getDefaultVirtualCamera } from '../schema/virtualCamera.js';
import { buildLightingPrompt, getLightingKeywords, validateLighting, getDefaultLighting } from '../schema/lightingManager.js';
import { createReferenceCollection, buildReferencePrompt, getImagesForApi, validateCollection } from '../schema/referenceHandler.js';
import { buildCollage } from '../utils/imageCollage.js';

// ═══════════════════════════════════════════════════════════════
// QUALITY MODES
// ═══════════════════════════════════════════════════════════════

export const QUALITY_MODES = {
  DRAFT: {
    id: 'DRAFT',
    label: 'Draft (Fast)',
    imageSize: '1K',
    numberOfImages: 1,
    description: 'Quick preview, lower resolution'
  },
  PRODUCTION: {
    id: 'PRODUCTION',
    label: 'Production (4K)',
    imageSize: '4K',
    numberOfImages: 4,
    description: 'High quality output, 4K resolution'
  }
};

// ═══════════════════════════════════════════════════════════════
// ASPECT RATIOS
// ═══════════════════════════════════════════════════════════════

export const ASPECT_RATIOS = {
  '16:9': { label: 'Widescreen (16:9)', apiValue: '16:9' },
  '9:16': { label: 'Vertical (9:16)', apiValue: '9:16' },
  '1:1': { label: 'Square (1:1)', apiValue: '1:1' },
  '4:3': { label: 'Standard (4:3)', apiValue: '4:3' },
  '3:4': { label: 'Portrait (3:4)', apiValue: '3:4' }
};

// ═══════════════════════════════════════════════════════════════
// REASONING PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} VirtualStudioConfig
 * @property {Object} virtualCamera - VirtualCamera settings
 * @property {Object} lighting - LightingManager settings
 * @property {Array} references - Reference images
 * @property {string} mood - Desired mood/atmosphere
 * @property {string} sceneDescription - User's scene description
 * @property {string} [extraInstructions] - Additional user instructions
 * @property {string} qualityMode - DRAFT or PRODUCTION
 * @property {string} aspectRatio - Desired aspect ratio
 */

/**
 * Build the complete reasoning-based prompt
 * @param {VirtualStudioConfig} config 
 * @returns {{prompt: string, promptJson: Object}}
 */
export function buildVirtualStudioPrompt(config) {
  const {
    virtualCamera = getDefaultVirtualCamera(),
    lighting = getDefaultLighting(),
    references = [],
    mood = 'natural',
    sceneDescription = '',
    extraInstructions = '',
    identityDescription = '',
    clothingDescriptions = []
  } = config;

  // Create reference collection
  const refCollection = createReferenceCollection(references);
  const hasSubjectRef = refCollection.slots[1] != null;
  const hasStyleRef = refCollection.slots[2] != null;
  const hasClothingRef = refCollection.slots[3] != null || refCollection.slots[4] != null;
  const hasPoseRef = refCollection.slots[6] != null;

  // Build prompt JSON structure
  const promptJson = {
    format: 'virtual_studio_v1',
    generatedAt: new Date().toISOString(),
    role: 'World-class Cinematographer & Art Director',
    virtualCamera,
    lighting,
    referenceCount: refCollection.images.length,
    mood,
    sceneDescription,
    hasSubjectRef,
    hasStyleRef,
    hasClothingRef,
    hasPoseRef
  };

  // Build text prompt with reasoning structure
  const sections = [];

  // ═══════════════════════════════════════════════════════════════
  // SECTION 1: ROLE ASSIGNMENT
  // ═══════════════════════════════════════════════════════════════

  sections.push(`ROLE: World-class Cinematographer & Art Director.

You are an expert in visual storytelling, combining technical mastery with artistic vision.
Your task is to generate a photorealistic fashion photograph that could appear in a major publication.`);

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2: TASK DEFINITION
  // ═══════════════════════════════════════════════════════════════

  sections.push(`
TASK: Analyze the constraints and generate a photorealistic image.

OUTPUT REQUIREMENTS:
- Photorealistic quality (NO illustration, NO CGI, NO painterly style)
- Natural skin texture and fabric behavior
- Authentic optical characteristics
- No watermarks, logos, or text overlays`);

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3: REASONING STEPS
  // ═══════════════════════════════════════════════════════════════

  const reasoningSteps = [];

  reasoningSteps.push(`1. LIGHTING ANALYSIS: Determine the optimal lighting ratio for "${mood}" mood.
   - Primary source: ${lighting.primarySource || 'natural'}
   - Light quality and direction will define the emotional tone.`);

  reasoningSteps.push(`2. OPTICAL CHARACTERISTICS: Apply the properties of ${virtualCamera.focalLength || 'PORTRAIT'} focal length.
   - This affects perspective, compression, and depth of field.`);

  if (hasSubjectRef) {
    reasoningSteps.push(`3. IDENTITY MATCHING: The person in [$1] MUST appear with exact facial features.
   - Face shape, eyes, nose, lips — all must match precisely.
   - Do NOT beautify or modify the identity.`);
  }

  if (hasClothingRef) {
    reasoningSteps.push(`${hasSubjectRef ? '4' : '3'}. CLOTHING ACCURACY: Recreate garments from reference images exactly.
   - Match silhouette, proportions, colors, and construction.
   - Fabric should behave naturally in the pose.`);
  }

  if (hasStyleRef) {
    reasoningSteps.push(`${hasSubjectRef && hasClothingRef ? '5' : hasSubjectRef || hasClothingRef ? '4' : '3'}. STYLE APPLICATION: Apply visual treatment from [$2].
   - Color grading, lighting mood, texture treatment.
   - This defines the overall "look" of the image.`);
  }

  sections.push(`
REASONING STEPS (analyze before generating):

${reasoningSteps.join('\n\n')}`);

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4: SCENE DESCRIPTION
  // ═══════════════════════════════════════════════════════════════

  if (sceneDescription) {
    sections.push(`
SCENE DESCRIPTION:

${sceneDescription}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 5: TECHNICAL SPECIFICATIONS (VirtualCamera)
  // ═══════════════════════════════════════════════════════════════

  const cameraPrompt = buildVirtualCameraPrompt(virtualCamera);
  sections.push(`
TECHNICAL SPECIFICATIONS — CAMERA:

${cameraPrompt}`);

  // ═══════════════════════════════════════════════════════════════
  // SECTION 6: LIGHTING SETUP
  // ═══════════════════════════════════════════════════════════════

  const lightingPrompt = buildLightingPrompt(lighting);
  sections.push(`
TECHNICAL SPECIFICATIONS — LIGHTING:

${lightingPrompt}`);

  // ═══════════════════════════════════════════════════════════════
  // SECTION 7: REFERENCE IMAGES
  // ═══════════════════════════════════════════════════════════════

  if (refCollection.images.length > 0) {
    const refPrompt = buildReferencePrompt(refCollection);
    sections.push(`
${refPrompt}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 8: IDENTITY RULES (if subject reference)
  // ═══════════════════════════════════════════════════════════════

  if (hasSubjectRef) {
    sections.push(`
IDENTITY PRESERVATION (CRITICAL — [$1]):

The generated image MUST show the EXACT SAME person as in reference [$1].

FACIAL STRUCTURE (must match exactly):
- Face shape: identical oval/round/square/heart shape
- Eyes: same spacing, shape, size, and color
- Nose: same bridge width, nostril shape, tip
- Lips: same fullness, shape, proportions
- Jawline: same angle and definition
- Cheekbones: same prominence

FORBIDDEN:
- Do NOT beautify or idealize the face
- Do NOT change eye color
- Do NOT make face more symmetrical
- Do NOT smooth away distinctive features

${identityDescription ? `Additional identity notes: ${identityDescription}` : ''}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 9: CLOTHING RULES (if clothing reference)
  // ═══════════════════════════════════════════════════════════════

  if (hasClothingRef) {
    sections.push(`
CLOTHING ACCURACY (CRITICAL):

Recreate the garments from reference images with MAXIMUM accuracy:

MUST MATCH:
- Exact silhouette (wide stays wide, slim stays slim, oversized stays oversized)
- Exact proportions and lengths
- Exact colors and patterns
- Construction details (seams, buttons, zippers, pockets)
- Fabric behavior (structured vs flowing)

${clothingDescriptions.length > 0 ?
        `USER DESCRIPTIONS:
${clothingDescriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')}` : ''}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 10: EXTRA INSTRUCTIONS
  // ═══════════════════════════════════════════════════════════════

  if (extraInstructions) {
    sections.push(`
ADDITIONAL INSTRUCTIONS:

${extraInstructions}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 11: ANTI-AI AUTHENTICITY
  // ═══════════════════════════════════════════════════════════════

  sections.push(`
AUTHENTICITY MARKERS (Anti-AI):

The image should feel like it was captured by a skilled photographer, not generated.

INCLUDE:
- Natural skin texture with visible pores (especially on nose, cheeks)
- Subtle asymmetry in facial features
- Real fabric behavior with natural wrinkles and folds
- Authentic catchlights in eyes
- Micro-imperfections that add realism

AVOID:
- Plastic, airbrushed skin
- Perfect symmetry
- Overly smooth textures
- Empty, lifeless eyes
- HDR or hyper-processed look`);

  // Combine all sections
  const prompt = sections.join('\n\n');

  return {
    prompt,
    promptJson,
    refCollection
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate image using Virtual Studio
 * @param {VirtualStudioConfig} config 
 * @returns {Promise<Object>}
 */
export async function generateVirtualStudioImage(config) {
  const {
    qualityMode = 'DRAFT',
    aspectRatio = '3:4',
    references = []
  } = config;

  // Validate configuration
  const cameraValidation = validateVirtualCamera(config.virtualCamera || {});
  const lightingValidation = validateLighting(config.lighting || {});

  if (!cameraValidation.valid) {
    return {
      ok: false,
      error: `VirtualCamera validation failed: ${cameraValidation.errors.join(', ')}`
    };
  }

  if (!lightingValidation.valid) {
    return {
      ok: false,
      error: `Lighting validation failed: ${lightingValidation.errors.join(', ')}`
    };
  }

  // Build the prompt
  const { prompt, promptJson, refCollection } = buildVirtualStudioPrompt(config);

  // Validate references
  const refValidation = validateCollection(refCollection);
  if (!refValidation.valid) {
    return {
      ok: false,
      error: `Reference validation failed: ${refValidation.errors.join(', ')}`
    };
  }

  // Get quality settings
  const quality = QUALITY_MODES[qualityMode] || QUALITY_MODES.DRAFT;
  const aspectRatioConfig = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['3:4'];

  // Get reference images for API
  const referenceImages = getImagesForApi(refCollection);

  // Build image config
  const imageConfig = {
    aspectRatio: aspectRatioConfig.apiValue,
    imageSize: quality.imageSize
  };

  console.log('[VirtualStudio] Generating with:', {
    qualityMode,
    imageConfig,
    referenceCount: referenceImages.length,
    promptLength: prompt.length
  });

  try {
    const startTime = Date.now();

    // Call Gemini
    const result = await requestGeminiImage({
      prompt,
      referenceImages,
      imageConfig,
      generatorName: 'VirtualStudioGenerator'
    });

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        errorCode: result.errorCode
      };
    }

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
      config: {
        virtualCamera: config.virtualCamera,
        lighting: config.lighting,
        qualityMode,
        aspectRatio: aspectRatioConfig.apiValue
      }
    };

  } catch (error) {
    console.error('[VirtualStudio] Generation error:', error);
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
 * Get all options for UI
 */
export function getVirtualStudioOptions() {
  return {
    qualityModes: Object.values(QUALITY_MODES),
    aspectRatios: Object.entries(ASPECT_RATIOS).map(([id, config]) => ({
      id,
      ...config
    }))
  };
}

/**
 * Get compact keywords from full config (for display)
 */
export function getConfigKeywords(config) {
  const keywords = [];

  if (config.virtualCamera) {
    keywords.push(getVirtualCameraKeywords(config.virtualCamera));
  }

  if (config.lighting) {
    keywords.push(getLightingKeywords(config.lighting));
  }

  return keywords.filter(k => k).join(', ');
}

/**
 * Validate full Virtual Studio configuration
 */
export function validateVirtualStudioConfig(config) {
  const errors = [];
  const warnings = [];

  // Validate camera
  const cameraValidation = validateVirtualCamera(config.virtualCamera || {});
  errors.push(...cameraValidation.errors);

  // Validate lighting
  const lightingValidation = validateLighting(config.lighting || {});
  errors.push(...lightingValidation.errors);
  warnings.push(...lightingValidation.warnings);

  // Validate references if present
  if (config.references && config.references.length > 0) {
    const refCollection = createReferenceCollection(config.references);
    const refValidation = validateCollection(refCollection);
    errors.push(...refValidation.errors);
    warnings.push(...refValidation.warnings);
  }

  // Validate quality mode
  if (config.qualityMode && !QUALITY_MODES[config.qualityMode]) {
    errors.push(`Invalid qualityMode: ${config.qualityMode}`);
  }

  // Validate aspect ratio
  if (config.aspectRatio && !ASPECT_RATIOS[config.aspectRatio]) {
    errors.push(`Invalid aspectRatio: ${config.aspectRatio}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}


