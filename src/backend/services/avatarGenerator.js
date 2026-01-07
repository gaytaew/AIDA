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
    shot: 'SHOT: Full left profile (90° turn). Head level, eyes looking forward, ear fully visible. REMEMBER: This is the SAME person as in the reference — same age, same features, same skin texture. Only the angle changes.'
  },
  {
    id: 'three-quarter-left',
    label: '3/4 left',
    shot: 'SHOT: Three-quarter left view (45° turn left). Slight head turn, eyes looking slightly past camera. REMEMBER: IDENTICAL person as reference — preserve exact age, skin, and all facial features.'
  },
  {
    id: 'straight-on-front',
    label: 'Straight-on front',
    shot: 'SHOT: Straight-on front view (0°). Symmetrical framing, direct gaze to camera. REMEMBER: This must look EXACTLY like the person in the reference — same age, same skin texture, same features.'
  },
  {
    id: 'three-quarter-right',
    label: '3/4 right',
    shot: 'SHOT: Three-quarter right view (45° turn right). Slight head turn, eyes looking slightly past camera. REMEMBER: Generate the SAME individual — no age change, no beautification.'
  }
];

// ═══════════════════════════════════════════════════════════════
// MASTER PROMPT (Nano Banana Pro style)
// ═══════════════════════════════════════════════════════════════

const MASTER_PROMPT = `CRITICAL IDENTITY PRESERVATION (READ CAREFULLY):

You are generating MULTIPLE ANGLES of THE EXACT SAME PERSON from the reference photo(s).
This is NOT a "similar looking person" — it MUST be the IDENTICAL individual.

STEP 1 — ANALYZE THE REFERENCE:
Before generating, carefully study the reference photo(s) and mentally note:
- EXACT age appearance (wrinkles, skin condition, neck aging signs)
- EXACT face shape (oval, square, heart, round, long)
- EXACT nose shape and size (bridge width, tip shape, nostril visibility)
- EXACT eye shape, size, spacing, eyelid type
- EXACT eyebrow shape, thickness, arch position
- EXACT lip shape and thickness (upper vs lower lip ratio)
- EXACT jawline and chin shape
- EXACT skin texture (freckles, moles, pores, lines, spots — preserve ALL)
- EXACT hair color, texture, hairline, and style
- ANY asymmetries or unique marks — these are CRITICAL identity markers

STEP 2 — GENERATE WITH IDENTITY LOCK:
Generate the SAME person from a different angle. Every facial feature must match.
If the reference shows a 40-year-old with specific wrinkles and skin texture — generate a 40-year-old with the SAME wrinkles.
If the reference shows a 25-year-old with smooth skin — generate a 25-year-old with smooth skin.
NEVER change the apparent age. NEVER make them younger or older.

IDENTITY ANCHORS (non-negotiable):
- Face proportions: IDENTICAL to reference
- Age appearance: IDENTICAL to reference (do NOT rejuvenate)
- Skin texture/marks: PRESERVE ALL (freckles, moles, lines, pores)
- Hair: SAME color, texture, style, length
- Eye color: EXACT match
- Asymmetries: PRESERVE (they are identity markers)

MULTI-VIEW REFERENCE HANDLING:
If reference is a collage/grid of multiple photos — these are ALL the SAME person from different angles.
Study ALL tiles to understand the complete 3D structure of this specific face.
Use information from every tile to maintain consistency.

STYLE:
Clean casting/editorial studio portrait on neutral off-white seamless background.
Soft, even, daylight-balanced studio lighting, minimal shadows.
Realistic skin with natural texture (NO smoothing, NO plastic look).
Sharp detailed eyes. Natural pores visible.
Plain dark crewneck t-shirt.
Hair exactly as in reference (same color, length, style).

CAMERA:
Head-and-shoulders portrait, tight crop, centered.
85mm lens perspective, no wide-angle distortion.
High resolution, natural perspective.

ABSOLUTE PROHIBITIONS:
- NO age change (do NOT make younger or older)
- NO face reshaping or "improvement"
- NO skin smoothing or beautification
- NO symmetry correction (asymmetry = identity)
- NO changing skin texture, marks, or freckles
- NO changing hair color or style
- NO HDR, no glossy AI look
- NO cartoon/CGI/stylization`;

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
