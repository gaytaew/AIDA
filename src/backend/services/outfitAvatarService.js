/**
 * Outfit Avatar Service
 * 
 * Generates full-body avatars of models wearing specific clothing.
 * Used when 2+ models with clothing are in a shoot to reduce reference count.
 * 
 * Flow:
 * 1. Pack clothing refs into a single collage
 * 2. Pack model identity refs into a single board
 * 3. Generate full-body avatar using both as reference
 * 4. User approves the avatar
 * 5. Avatar is used instead of raw clothing refs in final generation
 */

import config from '../config.js';
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
 * Generate a full-body outfit avatar
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

  const apiKey = config.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'OPENAI_API_KEY is not configured' };
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

    // Build image contents for GPT-4o
    const imageContents = [];

    if (identityBoard) {
      imageContents.push({
        type: 'image_url',
        image_url: {
          url: `data:${identityBoard.mimeType || 'image/jpeg'};base64,${identityBoard.base64}`,
          detail: 'high'
        }
      });
    }

    if (clothingBoard) {
      imageContents.push({
        type: 'image_url',
        image_url: {
          url: `data:${clothingBoard.mimeType || 'image/jpeg'};base64,${clothingBoard.base64}`,
          detail: 'high'
        }
      });
    }

    console.log('[OutfitAvatarService] Generating outfit avatar...');

    // Use GPT-4o to generate via DALL-E
    // First, get a detailed description
    const descResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a fashion photography assistant. Analyze the provided images and create a detailed description for generating a full-body photo. The first image(s) show the MODEL's identity/face. The second image(s) show the CLOTHING to dress the model in. Output a detailed prompt that combines both.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: finalPrompt },
              ...imageContents
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!descResponse.ok) {
      const errorText = await descResponse.text();
      console.error('[OutfitAvatarService] GPT-4o error:', errorText);
      return { ok: false, error: `API error: ${descResponse.status}` };
    }

    const descData = await descResponse.json();
    const refinedPrompt = descData.choices?.[0]?.message?.content || finalPrompt;

    // Generate with DALL-E 3
    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: refinedPrompt,
        n: 1,
        size: '1024x1792', // Portrait for full-body
        quality: 'hd',
        response_format: 'b64_json'
      })
    });

    if (!dalleResponse.ok) {
      const errorText = await dalleResponse.text();
      console.error('[OutfitAvatarService] DALL-E error:', errorText);
      return { ok: false, error: `DALL-E error: ${dalleResponse.status}` };
    }

    const dalleData = await dalleResponse.json();
    const b64 = dalleData.data?.[0]?.b64_json;

    if (!b64) {
      return { ok: false, error: 'No image data in DALL-E response' };
    }

    console.log('[OutfitAvatarService] Outfit avatar generated successfully');

    return {
      ok: true,
      image: {
        mimeType: 'image/png',
        base64: b64
      },
      prompt: refinedPrompt
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

