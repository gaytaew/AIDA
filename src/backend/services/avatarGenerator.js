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
    shot: 'SHOT: Full left profile (90° turn). Head level, eyes looking forward, ear fully visible. Preserve ALL micro-details: skin pores, fine wrinkles, vellus hair on cheek and jaw. Render ear with anatomical precision (cartilage texture, inner shadow). IDENTITY LOCK: SAME person, SAME age, SAME skin texture. Only the viewing angle changes.'
  },
  {
    id: 'three-quarter-left',
    label: '3/4 left',
    shot: 'SHOT: Three-quarter left view (45° turn left). Slight head turn, eyes looking slightly past camera. Preserve ALL micro-details: pores, asymmetries, iris texture, lash separation. Render eye/cheek transition with correct subsurface scattering. IDENTITY LOCK: IDENTICAL person — preserve exact age, skin materiality, and all facial features.'
  },
  {
    id: 'straight-on-front',
    label: 'Straight-on front',
    shot: 'SHOT: Straight-on front view (0°). Symmetrical framing, direct gaze to camera. This is the PRIMARY identity anchor — maximize micro-detail: pores, texture variations, natural asymmetry between left/right face, iris patterns, individual lash separation. IDENTITY LOCK: EXACTLY the person in reference — same age, same skin texture, same features.'
  },
  {
    id: 'three-quarter-right',
    label: '3/4 right',
    shot: 'SHOT: Three-quarter right view (45° turn right). Slight head turn, eyes looking slightly past camera. Preserve ALL micro-details: skin texture variations, matte/oily zones, micro-shadows in expression lines. IDENTITY LOCK: Generate the SAME individual — no age change, no beautification, no smoothing.'
  }
];

// ═══════════════════════════════════════════════════════════════
// MASTER PROMPT (Nano Banana Pro style)
// ═══════════════════════════════════════════════════════════════

const MASTER_PROMPT = `CRITICAL IDENTITY PRESERVATION (STRICT BIOMETRIC MODE):

You are generating MULTIPLE ANGLES of THE EXACT SAME PERSON from the reference photo(s).
This is NOT a "similar looking person" — it MUST be the IDENTICAL individual.

STEP 1 — DEEP FACIAL ANALYSIS:
Before generating, study the reference photo(s) with forensic precision and memorize:
- EXACT age appearance (wrinkles, skin condition, neck aging signs)
- EXACT face structure (skull shape, bone prominence, fat distribution)
- EXACT nose geometry (bridge width, tip shape, nostril visibility, profile angle)
- EXACT eye shape, size, spacing, eyelid type, orbital depth
- EXACT eyebrow shape, thickness, arch position, hair direction
- EXACT lip shape + thickness (upper vs lower lip ratio, vermillion border)
- EXACT jawline, chin shape, and neck definition
- ALL skin texture details: freckles, moles, pores, fine lines, spots, scars
- ANY asymmetries or unique marks — these are CRITICAL identity anchors
- EXACT hair color, texture, hairline position, density, and style

STEP 2 — GENERATE WITH IDENTITY LOCK:
Generate THE SAME person from a different angle. Every facial feature MUST match.
If reference shows 40-year-old with specific wrinkles — generate with SAME wrinkles.
If reference shows 25-year-old with smooth skin — generate with smooth skin.
NEVER modify the apparent age. NO rejuvenation. NO aging.

HYPER-REALISTIC SKIN RENDERING (CRITICAL):
Amplify all facial imperfections with high micro-detail accuracy:
- AUTHENTIC pores with natural depth and distribution
- SUBTLE texture variations across skin zones
- FINE wrinkles and micro-creases (expression lines)
- NATURAL asymmetry (left/right side differences)
- BARELY visible scars, birthmarks, sun damage
- FRECKLES in exact original positions and density
- VELLUS HAIR (peach fuzz) on cheeks, forehead, upper lip
- REAL surface irregularities — skin is NOT smooth plastic

SKIN MATERIAL RESPONSE (CRITICAL):
Apply realistic skin materiality:
- MATTE/OILY zone separation (T-zone vs cheeks)
- NATURAL specularity (subtle highlights, not glossy)
- MICRO-SHADOWS in pores and fine lines
- SUBSURFACE SCATTERING on thinner skin areas (ears, nose tip, eyelids)
- NO smoothing, NO softening, NO plastic artifacts
- Correct only elements that appear broken or AI-distorted
STRICTLY PRESERVE original color grading exactly as input.

HYPER-REALISTIC EYE RENDERING (CRITICAL):
Amplify eyes with high micro-detail fidelity:
- SHARP iris texture with visible collagen fibers
- NATURAL radial patterns unique to this person's iris
- SUBTLE chromatic variations (not uniform color)
- CORRECT subsurface light response (depth, glow)
- PROPER limbal ring definition
- Render eyelids, lashes, tear ducts with ANATOMICAL precision:
  * INDIVIDUAL lash separation (not clumps)
  * NATURAL moisture level (not dry, not wet)
  * MICRO-SHADOWS on eyelid creases
  * REALISTIC translucency (blood vessels visible where natural)
- PRESERVE authentic asymmetry of eyes
- NO artificial glow, NO over-sharpening, NO plastic shine
- Correct only distorted/broken elements
STRICTLY PRESERVE original color grading exactly as input.

IDENTITY ANCHORS (non-negotiable):
- Face proportions: IDENTICAL to reference
- Age appearance: IDENTICAL to reference (NO rejuvenation)
- Skin texture/marks: PRESERVE ALL (freckles, moles, lines, pores)
- Hair: SAME color, texture, style, length
- Eye color: EXACT match
- Asymmetries: PRESERVE (they ARE identity markers)

MULTI-VIEW REFERENCE HANDLING:
If reference is a collage/grid of multiple photos — these are ALL the SAME person.
Study ALL tiles to understand the complete 3D structure of this specific face.
Use information from every tile to maintain consistency across angles.

STYLE:
Clean casting/editorial studio portrait on neutral off-white seamless background.
Soft, even, daylight-balanced studio lighting, minimal shadows.
Photo-realistic skin with full natural texture (NO smoothing, NO airbrushing).
Sharp detailed eyes with natural catchlights.
Plain dark crewneck t-shirt.
Hair exactly as in reference.

CAMERA:
Head-and-shoulders portrait, tight crop, centered.
85mm lens perspective, no wide-angle distortion.
2K resolution output. Natural perspective. Tack-sharp focus on face.

ABSOLUTE PROHIBITIONS:
- NO age change (do NOT make younger or older)
- NO face reshaping or "improvement"
- NO skin smoothing, softening, or plastic look
- NO symmetry correction — asymmetry IS identity
- NO changing skin texture, marks, freckles position
- NO changing hair color, texture, or style
- NO HDR or glossy AI look
- NO cartoon/CGI/stylization
- NO artificial catchlight enhancement`;

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
          imageSize: '2K'
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
      imageSize: '2K'
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
