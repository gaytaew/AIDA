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
 * 
 * Промпт собирается в JSON-формате из модулей.
 */

import { requestGeminiImage } from '../providers/geminiClient.js';
import { buildCollage } from '../utils/imageCollage.js';

// ═══════════════════════════════════════════════════════════════
// JSON PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

// Default scene parameters when no frame is selected
export const DEFAULT_SCENE = {
  label: 'Default Scene',
  description: 'Fashion photo with natural pose',
  technical: {
    shotSize: 'medium_full',
    cameraAngle: 'eye_level',
    poseType: 'static',
    composition: 'rule_of_thirds',
    focusPoint: 'face',
    poseDescription: 'Standing relaxed, natural pose, weight slightly on one leg, arms at sides'
  }
};

// Posing style descriptions
const POSING_STYLE_MAP = {
  1: { label: 'candid', instruction: 'Capture a completely natural, candid moment. The model should look unaware of the camera, as if caught in a spontaneous moment.' },
  2: { label: 'natural', instruction: 'Natural but aware pose. The model knows about the camera but the pose should feel relaxed and uncontrived.' },
  3: { label: 'editorial', instruction: 'Editorial/artistic pose. Deliberate and composed, suitable for fashion magazines. Clear artistic intention.' },
  4: { label: 'studio', instruction: 'High fashion studio pose. Maximally posed and deliberate. Classic fashion photography positioning.' }
};

// Pose adherence descriptions
const POSE_ADHERENCE_MAP = {
  1: { label: 'loose', instruction: 'Follow the general pose type only (sitting/standing/lying). Exact positioning is flexible.' },
  2: { label: 'similar', instruction: 'Pose should be similar to the reference. Main body lines should match but details can vary.' },
  3: { label: 'close', instruction: 'Follow the pose reference closely. Body position, limb angles should match well.' },
  4: { label: 'exact', instruction: 'STRICTLY match the pose reference sketch. Body contours, limb positions, head tilt must match exactly.' }
};

/**
 * Build the structured JSON prompt from modules
 */
export function buildShootPromptJson({
  universe,
  location,
  frame,
  modelDescription = '',
  clothingNotes = '',
  extraPrompt = '',
  modelCount = 1,
  hasIdentityRefs = false,
  hasClothingRefs = false,
  hasPoseSketch = false,
  posingStyle = 2,
  poseAdherence = 2
}) {
  // Priority: frame > location.defaultFrameParams > DEFAULT_SCENE
  let effectiveFrame = frame;
  
  if (!effectiveFrame && location?.defaultFrameParams) {
    // Use location's default frame params if no frame selected
    effectiveFrame = {
      label: `Default for ${location.label}`,
      description: location.defaultFrameParams.poseDescription || 'Natural pose for this location',
      technical: {
        shotSize: location.defaultFrameParams.shotSize || 'medium_full',
        cameraAngle: location.defaultFrameParams.cameraAngle || 'eye_level',
        poseType: location.defaultFrameParams.poseType || 'standing',
        composition: location.defaultFrameParams.composition || 'rule_of_thirds',
        focusPoint: 'face',
        poseDescription: location.defaultFrameParams.poseDescription || 'Natural relaxed pose'
      }
    };
    console.log('[ShootGenerator] Using location default frame params:', location.label);
  }
  
  if (!effectiveFrame) {
    effectiveFrame = DEFAULT_SCENE;
    console.log('[ShootGenerator] Using default scene (no frame or location params)');
  }

  const promptJson = {
    format: 'aida_shoot_prompt_v1',
    formatVersion: 1,
    generatedAt: new Date().toISOString(),

    // Global hard rules
    hardRules: [
      'Return photorealistic images (no illustration, no CGI, no 3D render, no painterly look).',
      'Natural skin texture, believable fabric behavior, real optics.',
      'No watermarks, no text overlays, no captions, no logos.',
      'STRICTLY match identity reference images (faces, anatomy) for models.',
      'STRICTLY match clothing reference images (silhouette, color, construction, materials).',
      'Do NOT invent brands/logos/text.',
      modelCount === 1 
        ? 'Keep the SAME model identity across all frames.'
        : `Keep the SAME ${modelCount} model identities across all frames.`
    ],

    // Universe / Visual DNA
    universe: buildUniverseBlock(universe),

    // Location (physical place)
    location: buildLocationBlock(location),

    // Identity references
    identity: {
      hasRefs: hasIdentityRefs,
      rules: [
        'Use the uploaded person photo(s) as strict identity reference.',
        'Generate the same person, preserving exact facial identity and proportions.',
        'Do not beautify, do not stylize the face.',
        'Match face structure, hairline, eye spacing, nose, lips exactly.'
      ],
      description: modelDescription || null
    },

    // Clothing references
    clothing: {
      hasRefs: hasClothingRefs,
      rules: [
        'Carefully inspect the clothing reference images.',
        'Recreate ALL garments with MAXIMUM accuracy.',
        'Preserve exact silhouettes, proportions, lengths, fabric behavior.',
        'Match exact colors, prints, patterns.',
        'Do NOT invent new garments or accessories not in the refs.',
        'Do NOT change construction: buttons, zippers, pockets must match refs.'
      ],
      notes: clothingNotes || null
    },

    // Frame / Scene (ONLY pose, camera, composition - NO location)
    frame: buildFrameBlock(effectiveFrame),
    
    // Frame interpretation rules
    frameRules: [
      'FRAME describes ONLY: pose, body position, camera angle, shot size, composition.',
      'FRAME does NOT define: location, background, environment, props, weather.',
      'Location and environment come from LOCATION module (or UNIVERSE if no location).',
      'If frame description mentions any location hints (snow, beach, studio, etc.) — IGNORE them.',
      'Apply the pose/camera from FRAME to whatever location is defined.'
    ],
    
    // Pose sketch reference (if available)
    poseReference: hasPoseSketch ? {
      hasSketch: true,
      rules: [
        'A POSE SKETCH image is provided as reference.',
        'Use it to match body position, limb angles, and head tilt.',
        'The sketch shows only pose - ignore any clothing/face/hair in it.',
        POSE_ADHERENCE_MAP[poseAdherence]?.instruction || POSE_ADHERENCE_MAP[2].instruction
      ]
    } : null,
    
    // Posing style
    posingStyle: {
      level: posingStyle,
      label: POSING_STYLE_MAP[posingStyle]?.label || 'natural',
      instruction: POSING_STYLE_MAP[posingStyle]?.instruction || POSING_STYLE_MAP[2].instruction
    },

    // Anti-AI markers
    antiAi: {
      preset: 'medium',
      rules: [
        'Natural skin texture with pores, small imperfections.',
        'Real fabric behavior, natural wrinkles and folds.',
        'Subtle lens imperfections OK (soft edges, slight vignette).',
        'NOT too perfect, NOT too symmetrical.',
        'NO plastic/glossy skin.',
        'NO HDR look.',
        'NO watermarks or text.',
        'NO AI artifacts.'
      ]
    },

    // Extra instructions
    extra: extraPrompt || null
  };

  return promptJson;
}

/**
 * Build universe block from universe data
 */
function buildUniverseBlock(universe) {
  if (!universe) {
    return {
      shortDescription: null,
      capture: null,
      light: null,
      color: null,
      era: null,
      postProcess: null
    };
  }

  return {
    shortDescription: universe.shortDescription || null,
    
    capture: universe.capture ? {
      mediumType: universe.capture.mediumType || 'photo',
      cameraSystem: universe.capture.cameraSystem || '35mm',
      grainStructure: universe.capture.grainStructure || 'none'
    } : null,
    
    light: universe.light ? {
      primaryLightType: universe.light.primaryLightType || 'natural',
      flashCharacter: universe.light.flashCharacter || 'soft',
      shadowBehavior: universe.light.shadowBehavior || 'soft_falloff'
    } : null,
    
    color: universe.color ? {
      baseColorCast: universe.color.baseColorCast || 'neutral',
      dominantPalette: universe.color.dominantPalette || 'natural',
      skinToneRendering: universe.color.skinToneRendering || 'natural'
    } : null,
    
    era: universe.era ? {
      eraReference: universe.era.eraReference || 'contemporary',
      editorialReference: universe.era.editorialReference || 'european_fashion'
    } : null,
    
    postProcess: universe.postProcess ? {
      hdrForbidden: universe.postProcess.hdrForbidden ?? true,
      aiArtifactsPrevention: universe.postProcess.aiArtifactsPrevention ?? true,
      skinSmoothing: universe.postProcess.skinSmoothing ?? false
    } : null
  };
}

/**
 * Build location block from location data
 */
function buildLocationBlock(location) {
  if (!location) {
    return null;
  }

  return {
    label: location.label || null,
    description: location.description || null,
    promptSnippet: location.promptSnippet || null,  // Ready-to-use prompt text
    environmentType: location.environmentType || null,
    surface: location.surface || null,
    lighting: location.lighting ? {
      type: location.lighting.type || 'natural',
      timeOfDay: location.lighting.timeOfDay || 'any',
      description: location.lighting.description || null
    } : null,
    props: Array.isArray(location.props) && location.props.length > 0 ? location.props : null
  };
}

/**
 * Build frame block from frame data
 */
function buildFrameBlock(frame) {
  if (!frame) {
    return {
      label: null,
      description: null,
      technical: null
    };
  }

  return {
    label: frame.label || null,
    description: frame.description || null,
    
    technical: frame.technical ? {
      shotSize: frame.technical.shotSize || null,
      cameraAngle: frame.technical.cameraAngle || null,
      poseType: frame.technical.poseType || null,
      composition: frame.technical.composition || null,
      focusPoint: frame.technical.focusPoint || null,
      poseDescription: frame.technical.poseDescription || null
    } : {
      shotSize: frame.shotSize || null,
      cameraAngle: frame.cameraAngle || null,
      poseType: frame.poseType || null,
      composition: frame.composition || null,
      focusPoint: frame.focusPoint || null,
      poseDescription: frame.poseDescription || null
    }
  };
}

/**
 * Convert JSON prompt to text for Gemini
 * Gemini works with text, so we serialize the JSON in a structured way
 */
export function jsonPromptToText(promptJson) {
  const sections = [];

  // Header with format info
  sections.push(`PROMPT FORMAT: ${promptJson.format} v${promptJson.formatVersion}`);
  sections.push('');

  // Hard rules
  sections.push('HARD RULES:');
  promptJson.hardRules.forEach((rule, i) => {
    sections.push(`${i + 1}. ${rule}`);
  });
  sections.push('');

  // Universe
  if (promptJson.universe) {
    sections.push('UNIVERSE (VISUAL DNA):');
    const u = promptJson.universe;
    if (u.shortDescription) sections.push(u.shortDescription);
    if (u.capture) {
      sections.push(`Medium: ${u.capture.mediumType}, ${u.capture.cameraSystem}`);
      if (u.capture.grainStructure !== 'none') sections.push(`Grain: ${u.capture.grainStructure}`);
    }
    if (u.light) {
      sections.push(`Lighting: ${u.light.primaryLightType}, ${u.light.flashCharacter}`);
      sections.push(`Shadows: ${u.light.shadowBehavior}`);
    }
    if (u.color) {
      sections.push(`Color: ${u.color.baseColorCast} cast, ${u.color.dominantPalette} palette`);
      if (u.color.skinToneRendering) sections.push(`Skin: ${u.color.skinToneRendering}`);
    }
    if (u.era) {
      sections.push(`Era: ${u.era.eraReference}, ${u.era.editorialReference}`);
    }
    if (u.postProcess) {
      if (u.postProcess.hdrForbidden) sections.push('NO HDR.');
      if (u.postProcess.aiArtifactsPrevention) sections.push('NO AI artifacts, NO plastic skin.');
      if (!u.postProcess.skinSmoothing) sections.push('Preserve skin texture.');
    }
    sections.push('');
  }

  // Location
  if (promptJson.location) {
    sections.push('LOCATION:');
    const loc = promptJson.location;
    if (loc.label) sections.push(`Place: ${loc.label}`);
    if (loc.description) sections.push(loc.description);
    if (loc.environmentType) sections.push(`Environment: ${String(loc.environmentType).replace(/_/g, ' ')}`);
    if (loc.surface) sections.push(`Surface: ${loc.surface}`);
    if (loc.lighting) {
      const parts = [];
      if (loc.lighting.type) parts.push(String(loc.lighting.type).replace(/_/g, ' '));
      if (loc.lighting.timeOfDay && loc.lighting.timeOfDay !== 'any') {
        parts.push(String(loc.lighting.timeOfDay).replace(/_/g, ' '));
      }
      if (parts.length > 0) sections.push(`Light: ${parts.join(', ')}`);
      if (loc.lighting.description) sections.push(loc.lighting.description);
    }
    if (loc.props && loc.props.length > 0) {
      sections.push(`Props: ${loc.props.join(', ')}`);
    }
    sections.push('');
  }

  // Identity
  sections.push('IDENTITY (MUST MATCH EXACTLY):');
  promptJson.identity.rules.forEach(rule => sections.push(`- ${rule}`));
  if (promptJson.identity.description) {
    sections.push('');
    sections.push('MODEL DESCRIPTION:');
    sections.push(promptJson.identity.description);
  }
  sections.push('');

  // Clothing
  sections.push('CLOTHING (MUST MATCH EXACTLY):');
  promptJson.clothing.rules.forEach(rule => sections.push(`- ${rule}`));
  if (promptJson.clothing.notes) {
    sections.push('');
    sections.push('CLOTHING NOTES:');
    sections.push(promptJson.clothing.notes);
  }
  sections.push('');

  // Frame
  if (promptJson.frame) {
    sections.push('FRAME / SHOT:');
    const f = promptJson.frame;
    if (f.label) sections.push(`Shot: ${f.label}`);
    if (f.description) sections.push(f.description);
    if (f.technical) {
      const t = f.technical;
      if (t.shotSize) sections.push(`Size: ${String(t.shotSize).replace(/_/g, ' ')}`);
      if (t.cameraAngle) sections.push(`Angle: ${String(t.cameraAngle).replace(/_/g, ' ')}`);
      if (t.poseType) sections.push(`Pose type: ${t.poseType}`);
      if (t.composition) sections.push(`Composition: ${String(t.composition).replace(/_/g, ' ')}`);
      if (t.focusPoint) sections.push(`Focus: ${t.focusPoint}`);
      if (t.poseDescription) sections.push(`Pose: ${t.poseDescription}`);
    }
    sections.push('');
  }

  // Anti-AI
  sections.push('ANTI-AI MARKERS:');
  promptJson.antiAi.rules.forEach(rule => sections.push(`- ${rule}`));
  sections.push('');

  // Extra
  if (promptJson.extra) {
    sections.push('ADDITIONAL INSTRUCTIONS:');
    sections.push(promptJson.extra);
  }

  return sections.join('\n');
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
 * @param {Object} params.poseSketchImage - Pose sketch image {mimeType, base64} (optional)
 * @param {Array} params.identityImages - Model identity photos
 * @param {Array} params.clothingImages - Clothing reference photos
 * @param {string} params.modelDescription - Model description text
 * @param {string} params.clothingNotes - Notes about clothing
 * @param {string} params.extraPrompt - Additional instructions
 * @param {number} params.posingStyle - Posing style 1-4 (1=casual, 4=studio)
 * @param {number} params.poseAdherence - How strictly to follow pose ref 1-4
 * @param {Object} params.imageConfig - Image configuration
 * @returns {Promise<{ok: boolean, image?: Object, prompt?: string, promptJson?: Object, error?: string}>}
 */
export async function generateShootFrame({
  universe,
  location,
  frame,
  poseSketchImage = null,
  identityImages = [],
  clothingImages = [],
  modelDescription = '',
  clothingNotes = '',
  extraPrompt = '',
  posingStyle = 2,
  poseAdherence = 2,
  imageConfig = {}
}) {
  try {
    console.log('[ShootGenerator] Starting frame generation...');

    // Build the JSON prompt
    const promptJson = buildShootPromptJson({
      universe,
      location,
      frame,
      modelDescription,
      clothingNotes,
      extraPrompt,
      modelCount: 1,
      hasIdentityRefs: identityImages.length > 0,
      hasClothingRefs: clothingImages.length > 0,
      hasPoseSketch: !!poseSketchImage,
      posingStyle,
      poseAdherence
    });

    // Send JSON directly to Gemini
    const promptText = JSON.stringify(promptJson, null, 2);

    console.log('[ShootGenerator] JSON Prompt built, length:', promptText.length);

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

    // Add pose sketch as reference if available
    console.log('[ShootGenerator] poseSketchImage received?', !!poseSketchImage);
    if (poseSketchImage) {
      console.log('[ShootGenerator] poseSketchImage.base64 length:', poseSketchImage.base64?.length || 0);
    }
    if (poseSketchImage && poseSketchImage.base64) {
      referenceImages.push(poseSketchImage);
      console.log('[ShootGenerator] ✅ Pose sketch added as reference, total refs:', referenceImages.length);
    } else {
      console.log('[ShootGenerator] ❌ No pose sketch to add');
    }

    console.log(`[ShootGenerator] Sending ${referenceImages.length} reference images to Gemini`);

    // Generate with Gemini
    const result = await requestGeminiImage({
      prompt: promptText,
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
        prompt: promptText,
        promptJson
      };
    }

    console.log('[ShootGenerator] Frame generated successfully');

    return {
      ok: true,
      image: {
        mimeType: result.mimeType,
        base64: result.base64
      },
      prompt: promptText,
      promptJson
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
  location,
  frames,
  identityImages = [],
  clothingImages = [],
  modelDescription = '',
  clothingNotes = '',
  imageConfig = {},
  delayMs = 2000
}) {
  const results = [];

  // If no frames provided, use default scene
  const effectiveFrames = (frames && frames.length > 0) ? frames : [{ ...DEFAULT_SCENE, id: 'default' }];

  for (let i = 0; i < effectiveFrames.length; i++) {
    const frame = effectiveFrames[i];
    console.log(`[ShootGenerator] Generating frame ${i + 1}/${effectiveFrames.length}: ${frame.label || frame.id}`);

    const result = await generateShootFrame({
      universe,
      location: frame.location || location,
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
    if (i < effectiveFrames.length - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
