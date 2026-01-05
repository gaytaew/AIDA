/**
 * Avatar Generator Service
 * 
 * Generates model avatars from different angles using Gemini (Nano Banana Pro).
 * The results are packed into a single identity collage.
 */

import { requestGeminiImage } from '../providers/geminiClient.js';
import { buildIdentityCollage } from '../utils/imageCollage.js';

// ═══════════════════════════════════════════════════════════════
// AVATAR SHOTS DEFINITION
// ═══════════════════════════════════════════════════════════════

export const AVATAR_SHOTS = [
  {
    id: 'left-profile-90',
    label: 'Left profile (90°)',
    shot: 'SHOT: full left profile, head level, eyes looking forward, ear visible, same lighting and background.'
  },
  {
    id: 'three-quarter-left',
    label: '3/4 left',
    shot: 'SHOT: three-quarter left view, slight head turn, eyes looking slightly past the camera.'
  },
  {
    id: 'straight-on-front',
    label: 'Straight-on front',
    shot: 'SHOT: straight-on front, symmetrical framing, direct gaze to camera.'
  },
  {
    id: 'three-quarter-right',
    label: '3/4 right',
    shot: 'SHOT: three-quarter right view, slight head turn, eyes looking slightly past the camera.'
  }
];

// ═══════════════════════════════════════════════════════════════
// MASTER PROMPT (Nano Banana Pro style)
// ═══════════════════════════════════════════════════════════════

const MASTER_PROMPT = `IDENTITY (MUST MATCH EXACTLY):
Use the uploaded person photo(s) as a strict identity reference. Generate the same person, preserving exact facial identity and proportions: bone structure, jawline, nose shape, lip shape, eye shape and spacing, eyebrow density, asymmetry, skin texture, freckles/pores, and any small unique marks. Do not beautify, do not stylize the face, do not change age, gender presentation, ethnicity, or face geometry.

PRIORITY:
Identity accuracy is the #1 priority. Preserve asymmetry and unique marks; do NOT "beautify" or turn the person into a generic face.

IMPORTANT ABOUT MULTI-VIEW REFERENCES:
The identity references may be provided as ONE collage/board image (a grid of multiple photos from different angles/lighting).
If you see a collage/board, you MUST inspect every tile and treat each tile as a separate identity photo of the SAME person.
Mentally split the collage into individual tiles and fuse identity cues across ALL tiles (especially face geometry, hairline, brows, nose, lips, ears, and skin marks).
Do NOT treat different tiles as different people.

STYLE (MATCH THE PROVIDED STYLE REFERENCE IMAGES ONLY):
Match the style reference: clean casting/editorial studio portrait on a neutral off-white seamless background (very light gray/off-white, uniform). Soft, even, daylight-balanced studio lighting, minimal shadows, neutral-cool color, realistic skin, no HDR, no heavy contrast, no glossy "AI skin". Sharp, detailed eyes and natural skin pores. Minimal makeup (if any). Plain dark crewneck t-shirt. Hair must stay exactly as in the identity reference (same color, length, haircut), only lightly tidied.

CAMERA / COMPOSITION:
Head-and-shoulders portrait, tight crop, centered. 85mm portrait lens look, no wide-angle distortion. Natural perspective, realistic detail, high resolution. Clean background, no props, no accessories.

ABSOLUTE NO:
No face reshaping, no symmetry/beauty filters, no skin smoothing/plastic look, no surreal objects, no extra people, no jewelry, no dramatic stylization, no cartoon/CGI.`;

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

function buildAvatarPrompt(shotId, extraPrompt = '') {
  const shot = AVATAR_SHOTS.find(s => s.id === shotId);
  if (!shot) {
    throw new Error(`Unknown shotId: ${shotId}`);
  }

  const extra = String(extraPrompt || '').trim();
  const extraBlock = extra
    ? `\n\nEDIT REQUEST (apply if possible):\n${extra}`
    : '';

  return `${MASTER_PROMPT}${extraBlock}\n\n${shot.shot}`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate avatar shots from reference images using Gemini
 * @param {Array<{mimeType: string, base64: string}>} identityImages - Reference photos of the model
 * @param {Object} options
 * @returns {Promise<{shots: Array, collage: Object|null}>}
 */
export async function generateAvatarShots(identityImages, options = {}) {
  if (!identityImages || identityImages.length === 0) {
    throw new Error('At least one identity image is required');
  }

  const { extraPrompt = '', delayMs = 2000 } = options;

  console.log(`[AvatarGenerator] Starting generation of ${AVATAR_SHOTS.length} shots using Gemini`);

  const results = [];

  for (const shot of AVATAR_SHOTS) {
    try {
      console.log(`[AvatarGenerator] Generating: ${shot.label}`);

      // Build prompt with shot specifics
      const prompt = buildAvatarPrompt(shot.id, extraPrompt);

      // Call Gemini with identity images as reference
      const result = await requestGeminiImage({
        prompt,
        referenceImages: identityImages,
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '1K'
        }
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

      // Delay between requests to avoid rate limits
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
 * Generate a single avatar shot using Gemini
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

  const prompt = buildAvatarPrompt(shotId, options.extraPrompt);

  const result = await requestGeminiImage({
    prompt,
    referenceImages: identityImages,
    imageConfig: {
      aspectRatio: '1:1',
      imageSize: '1K'
    }
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
