/**
 * Outfit Avatar Service
 * 
 * Generates full-body avatars of models wearing specific clothing using Gemini.
 * Used when 2+ models with clothing are in a shoot to reduce reference count.
 * 
 * Flow:
 * 1. Pack clothing refs into a single collage
 * 2. Pack model identity refs into a single board
 * 3. Generate full-body avatar using both as reference
 * 4. User approves the avatar
 * 5. Avatar is used instead of raw clothing refs in final generation
 */

import { requestGeminiImage } from '../providers/geminiClient.js';
import { buildCollage } from '../utils/imageCollage.js';

// ═══════════════════════════════════════════════════════════════
// PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════════

const OUTFIT_AVATAR_PROMPT = `TASK: Generate a full-body photo of a model wearing specific clothing from reference images.

IDENTITY (MUST MATCH EXACTLY):
Use the uploaded person photo(s) as a strict identity reference. Generate the same person, preserving exact facial identity and proportions: bone structure, jawline, nose shape, lip shape, eye shape and spacing, eyebrow density, asymmetry, skin texture, freckles/pores, and any small unique marks. Do not beautify, do not stylize the face, do not change age, gender presentation, ethnicity, or face geometry.

CLOTHING (MUST MATCH EXACTLY):
Carefully inspect the clothing reference images (may be packed into a collage).
Recreate ALL garments from the references with MAXIMUM accuracy:
- Use ALL distinct garments from the refs together in one coherent outfit
- Preserve exact silhouettes, proportions, lengths, fabric behavior
- Match exact colors, prints, patterns, logos
- Keep the SAME number and placement of buttons, zippers, closures
- Do NOT add, remove or move pockets, seams, decorative elements
- Do NOT invent new garments, accessories, or styling choices not in the refs

STYLE & LIGHTING:
- Clean studio shot on neutral seamless background
- Full-body framing: head to feet visible
- Soft, even daylight-balanced lighting
- Minimal shadows, no dramatic lighting
- Natural skin tones, no HDR, no heavy contrast
- No glossy "AI skin" effect

POSE:
- Natural, relaxed standing pose
- Arms slightly away from body to show clothing details
- Looking at camera or slightly to the side
- Hands visible and natural
- Feet flat on floor, natural stance

ABSOLUTE NO:
- No face reshaping or beautification
- No skin smoothing/plastic look
- No props or accessories not in refs
- No multiple people
- No dramatic stylization
- No jewelry unless in clothing refs
- No high heels unless in refs
- No dramatic wind or motion effects`;

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Pack clothing images into a single collage
 */
export async function packClothingToCollage(clothingImages, options = {}) {
  if (!clothingImages || clothingImages.length === 0) {
    return null;
  }

  if (clothingImages.length === 1) {
    return clothingImages[0];
  }

  return await buildCollage(clothingImages, {
    maxSize: options.maxSize || 1536,
    jpegQuality: options.jpegQuality || 90,
    fit: 'contain',
    background: '#ffffff'
  });
}

/**
 * Pack identity images into a single board
 */
export async function packIdentityToBoard(identityImages, options = {}) {
  if (!identityImages || identityImages.length === 0) {
    return null;
  }

  if (identityImages.length === 1) {
    return identityImages[0];
  }

  return await buildCollage(identityImages, {
    maxSize: options.maxSize || 1024,
    jpegQuality: options.jpegQuality || 90,
    fit: 'cover',
    background: '#ffffff'
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a full-body outfit avatar using Gemini
 * 
 * @param {Object} params
 * @param {Array<{mimeType: string, base64: string}>} params.identityImages - Model identity photos
 * @param {Array<{mimeType: string, base64: string}>} params.clothingImages - Clothing reference photos
 * @param {Object} [params.universe] - Optional universe for style guidance
 * @param {string} [params.extraPrompt] - Additional instructions
 * @returns {Promise<{ok: boolean, image?: Object, prompt?: string, error?: string}>}
 */
export async function generateOutfitAvatar({
  identityImages,
  clothingImages,
  universe = null,
  extraPrompt = ''
}) {
  if (!identityImages || identityImages.length === 0) {
    return { ok: false, error: 'Identity images are required' };
  }

  if (!clothingImages || clothingImages.length === 0) {
    return { ok: false, error: 'Clothing images are required' };
  }

  try {
    console.log('[OutfitAvatarService] Packing references...');

    // Pack identity and clothing into collages
    const [identityBoard, clothingBoard] = await Promise.all([
      packIdentityToBoard(identityImages),
      packClothingToCollage(clothingImages)
    ]);

    // Build the final prompt
    let finalPrompt = OUTFIT_AVATAR_PROMPT;

    // Add universe style hints if provided
    if (universe && universe.colorScience) {
      const styleHints = [];
      if (universe.colorScience.dominantPalette) {
        styleHints.push(`Dominant colors: ${universe.colorScience.dominantPalette}`);
      }
      if (universe.lightPhysics?.lightQuality) {
        styleHints.push(`Lighting: ${universe.lightPhysics.lightQuality}`);
      }
      if (styleHints.length > 0) {
        finalPrompt += `\n\nSTYLE HINTS (from shoot universe):\n${styleHints.join('\n')}`;
      }
    }

    if (extraPrompt) {
      finalPrompt += `\n\nADDITIONAL INSTRUCTIONS:\n${extraPrompt}`;
    }

    // Build reference images array for Gemini
    const referenceImages = [];

    if (identityBoard) {
      referenceImages.push(identityBoard);
    }

    if (clothingBoard) {
      referenceImages.push(clothingBoard);
    }

    console.log('[OutfitAvatarService] Generating outfit avatar with Gemini...');

    // Generate with Gemini (Nano Banana Pro)
    const result = await requestGeminiImage({
      prompt: finalPrompt,
      referenceImages,
      imageConfig: {
        aspectRatio: '9:16', // Portrait for full-body
        imageSize: '1K'
      },
      generatorName: 'OutfitAvatarService'
    });

    if (!result.ok) {
      console.error('[OutfitAvatarService] Gemini error:', result.error);
      return { ok: false, error: result.error };
    }

    console.log('[OutfitAvatarService] Outfit avatar generated successfully');

    return {
      ok: true,
      image: {
        mimeType: result.mimeType,
        base64: result.base64
      },
      prompt: finalPrompt
    };

  } catch (error) {
    console.error('[OutfitAvatarService] Error:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Check if outfit avatar is required for this shoot configuration
 */
export function isOutfitAvatarRequired(modelCount, clothingByModel) {
  if (modelCount < 2) return false;

  // Check if any model has clothing
  if (!Array.isArray(clothingByModel)) return false;

  const hasClothing = clothingByModel.some(
    clothing => Array.isArray(clothing) && clothing.length > 0
  );

  return hasClothing;
}

/**
 * Check if outfit avatar is recommended (even for 1 model with many clothing items)
 */
export function isOutfitAvatarRecommended(clothingImages) {
  if (!Array.isArray(clothingImages)) return false;
  // Recommend if more than 5 clothing items
  return clothingImages.length > 5;
}
