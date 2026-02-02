/**
 * Avatar Generator Service v2
 * 
 * Generates model avatars from different angles.
 * Uses clean JSON prompt format (like shootGenerator) to avoid safety blocks.
 */

import { generateImageWithFallback } from './resilientImageGenerator.js';
import { buildIdentityCollage } from '../utils/imageCollage.js';

// ═══════════════════════════════════════════════════════════════
// AVATAR SHOTS DEFINITION
// ═══════════════════════════════════════════════════════════════

export const AVATAR_SHOTS = [
  {
    id: 'left-profile-90',
    label: 'Left profile (90°)',
    angle: 'Full left profile, 90 degree turn. Head level, looking forward.',
    direction: 'left_profile'
  },
  {
    id: 'three-quarter-left',
    label: '3/4 left',
    angle: 'Three-quarter left view, 45 degree turn. Slight head turn, relaxed gaze.',
    direction: 'three_quarter_left'
  },
  {
    id: 'straight-on-front',
    label: 'Straight-on front',
    angle: 'Straight-on front view, direct gaze to camera. Primary identity anchor.',
    direction: 'front'
  },
  {
    id: 'three-quarter-right',
    label: '3/4 right',
    angle: 'Three-quarter right view, 45 degree turn. Slight head turn, relaxed gaze.',
    direction: 'three_quarter_right'
  }
];

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER (Clean JSON format)
// ═══════════════════════════════════════════════════════════════

function buildAvatarPromptJson(shot, extraPrompt = '') {
  return {
    format: 'AIDA_AVATAR',
    formatVersion: '2.0',

    task: 'Generate a portrait of the SAME person from the reference photo(s), but from a different viewing angle.',

    hardRules: [
      'This is the SAME individual as in references — not similar, IDENTICAL.',
      'Preserve face structure, features, and proportions exactly.',
      'Preserve apparent age — no rejuvenation, no aging.',
      'Preserve skin characteristics and any distinguishing marks.',
      'Preserve hair color, texture, and style.',
      'Preserve eye color.'
    ],

    shot: {
      label: shot.label,
      angle: shot.angle,
      direction: shot.direction
    },

    style: {
      type: 'Studio casting portrait',
      background: 'Clean off-white seamless',
      lighting: 'Soft, even, daylight-balanced studio light',
      clothing: 'Plain dark crewneck t-shirt',
      crop: 'Head and shoulders, centered'
    },

    camera: {
      lens: '85mm equivalent',
      perspective: 'Natural, no wide-angle distortion',
      focus: 'Sharp on face',
      resolution: '2K output'
    },

    quality: {
      skinRendering: 'Photo-realistic with natural texture',
      eyeRendering: 'Sharp, natural detail',
      overall: 'Editorial quality, clean studio shot'
    },

    avoid: [
      'HDR look',
      'Glossy or plastic appearance',
      'Over-smoothed skin',
      'Artificial glow',
      'CGI or stylized look',
      'Age modification',
      'Feature alteration'
    ],

    extra: extraPrompt || null
  };
}

function jsonToPromptText(promptJson) {
  const sections = [];

  sections.push(`FORMAT: ${promptJson.format} v${promptJson.formatVersion}`);
  sections.push('');

  sections.push(`TASK: ${promptJson.task}`);
  sections.push('');

  sections.push('HARD RULES:');
  promptJson.hardRules.forEach((rule, i) => {
    sections.push(`${i + 1}. ${rule}`);
  });
  sections.push('');

  sections.push('SHOT:');
  sections.push(`- View: ${promptJson.shot.label}`);
  sections.push(`- Angle: ${promptJson.shot.angle}`);
  sections.push('');

  sections.push('STYLE:');
  sections.push(`- Type: ${promptJson.style.type}`);
  sections.push(`- Background: ${promptJson.style.background}`);
  sections.push(`- Lighting: ${promptJson.style.lighting}`);
  sections.push(`- Clothing: ${promptJson.style.clothing}`);
  sections.push(`- Crop: ${promptJson.style.crop}`);
  sections.push('');

  sections.push('CAMERA:');
  sections.push(`- Lens: ${promptJson.camera.lens}`);
  sections.push(`- Perspective: ${promptJson.camera.perspective}`);
  sections.push(`- Focus: ${promptJson.camera.focus}`);
  sections.push(`- Resolution: ${promptJson.camera.resolution}`);
  sections.push('');

  sections.push('QUALITY:');
  sections.push(`- Skin: ${promptJson.quality.skinRendering}`);
  sections.push(`- Eyes: ${promptJson.quality.eyeRendering}`);
  sections.push(`- Overall: ${promptJson.quality.overall}`);
  sections.push('');

  sections.push('AVOID:');
  promptJson.avoid.forEach(item => {
    sections.push(`- ${item}`);
  });

  if (promptJson.extra) {
    sections.push('');
    sections.push('ADDITIONAL:');
    sections.push(promptJson.extra);
  }

  return sections.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate avatar shots from reference images
 * @param {Array<{mimeType: string, base64: string}>} identityImages - Reference photos
 * @param {Object} options
 * @returns {Promise<{shots: Array, collage: Object|null}>}
 */
export async function generateAvatarShots(identityImages, options = {}) {
  if (!identityImages || identityImages.length === 0) {
    throw new Error('At least one identity image is required');
  }

  const { extraPrompt = '', delayMs = 2000 } = options;

  console.log(`[AvatarGenerator] Starting generation of ${AVATAR_SHOTS.length} shots`);

  const results = [];

  for (const shot of AVATAR_SHOTS) {
    try {
      console.log(`[AvatarGenerator] Generating: ${shot.label}`);

      const promptJson = buildAvatarPromptJson(shot, extraPrompt);
      const prompt = jsonToPromptText(promptJson);

      const result = await generateImageWithFallback({
        prompt,
        referenceImages: identityImages,
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '2K'
        },
        generatorName: 'AvatarGenerator'
      });

      if (!result.ok) {
        console.error(`[AvatarGenerator] Error generating ${shot.id}:`, result.error);
        results.push({
          id: shot.id,
          label: shot.label,
          status: 'error',
          image: null,
          error: result.error
        });
      } else {
        results.push({
          id: shot.id,
          label: shot.label,
          status: 'ok',
          image: {
            mimeType: result.mimeType,
            base64: result.base64
          },
          error: null
        });
      }

      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

    } catch (error) {
      console.error(`[AvatarGenerator] Error generating ${shot.id}:`, error.message);
      results.push({
        id: shot.id,
        label: shot.label,
        status: 'error',
        image: null,
        error: error.message
      });
    }
  }

  // Build collage from successful shots
  const successfulImages = results
    .filter(r => r.status === 'ok' && r.image)
    .map(r => r.image);

  let collage = null;
  if (successfulImages.length > 0) {
    try {
      collage = await buildIdentityCollage(successfulImages);
      console.log('[AvatarGenerator] Identity collage created');
    } catch (error) {
      console.error('[AvatarGenerator] Failed to build collage:', error.message);
    }
  }

  return {
    shots: results,
    collage
  };
}

/**
 * Generate a single avatar shot
 */
export async function generateSingleShot(identityImages, shotId, options = {}) {
  const shot = AVATAR_SHOTS.find(s => s.id === shotId);
  if (!shot) {
    throw new Error(`Unknown shotId: ${shotId}`);
  }

  if (!identityImages || identityImages.length === 0) {
    throw new Error('At least one identity image is required');
  }

  console.log(`[AvatarGenerator] Generating single shot: ${shot.label}`);

  const promptJson = buildAvatarPromptJson(shot, options.extraPrompt);
  const prompt = jsonToPromptText(promptJson);

  const result = await generateImageWithFallback({
    prompt,
    referenceImages: identityImages,
    imageConfig: {
      aspectRatio: '1:1',
      imageSize: '2K'
    },
    generatorName: 'AvatarGenerator'
  });

  if (!result.ok) {
    throw new Error(result.error || 'Failed to generate image');
  }

  return {
    id: shot.id,
    label: shot.label,
    status: 'ok',
    image: {
      mimeType: result.mimeType,
      base64: result.base64
    }
  };
}
