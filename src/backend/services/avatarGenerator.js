/**
 * Avatar Generator Service
 * 
 * Generates model avatars from different angles using AI image generation.
 * The results are packed into a single identity collage.
 */

import config from '../config.js';
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
// MASTER PROMPT
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
// IMAGE GENERATION (OpenAI DALL-E 3)
// ═══════════════════════════════════════════════════════════════

async function generateImageWithDALLE(prompt, referenceImages) {
  const apiKey = config.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Note: DALL-E 3 doesn't support reference images directly.
  // We'll use GPT-4o Vision to describe the reference and incorporate into prompt.
  // For now, we'll use a simplified approach with detailed prompt.

  const url = 'https://api.openai.com/v1/images/generations';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      response_format: 'b64_json'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[AvatarGenerator] DALL-E error:', errorText);
    throw new Error(`DALL-E API error: ${response.status}`);
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error('No image data in DALL-E response');
  }

  return {
    mimeType: 'image/png',
    base64: b64
  };
}

// ═══════════════════════════════════════════════════════════════
// ALTERNATIVE: Use GPT-4o to get description, then generate
// ═══════════════════════════════════════════════════════════════

async function describeModelForGeneration(images) {
  const apiKey = config.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const imageContents = images.slice(0, 3).map(img => ({
    type: 'image_url',
    image_url: {
      url: `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}`,
      detail: 'high'
    }
  }));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
          content: `You are a portrait photographer assistant. Analyze the person in the photo and create a detailed physical description for image generation. Focus on: face shape, bone structure, skin tone, eye shape/color, nose shape, lip shape, hair color/style/length, any distinctive features. Be extremely precise and objective. Output only the description, no commentary.`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this person for portrait generation:' },
            ...imageContents
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GPT-4o error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate avatar shots from reference images
 * @param {Array<{mimeType: string, base64: string}>} identityImages
 * @param {Object} options
 * @returns {Promise<{shots: Array, collage: Object|null}>}
 */
export async function generateAvatarShots(identityImages, options = {}) {
  if (!identityImages || identityImages.length === 0) {
    throw new Error('At least one identity image is required');
  }

  const { extraPrompt = '', delayMs = 2000 } = options;

  console.log(`[AvatarGenerator] Starting generation of ${AVATAR_SHOTS.length} shots`);

  // First, get a detailed description of the model
  const modelDescription = await describeModelForGeneration(identityImages);
  console.log('[AvatarGenerator] Model description generated');

  const results = [];

  for (const shot of AVATAR_SHOTS) {
    try {
      console.log(`[AvatarGenerator] Generating: ${shot.label}`);

      // Build prompt with model description and shot specifics
      const fullPrompt = `${MASTER_PROMPT}

PERSON TO GENERATE (MUST MATCH EXACTLY):
${modelDescription}

${extraPrompt ? `ADDITIONAL NOTES:\n${extraPrompt}\n\n` : ''}${shot.shot}`;

      const image = await generateImageWithDALLE(fullPrompt, identityImages);

      results.push({
        id: shot.id,
        label: shot.label,
        status: 'ok',
        image,
        error: null
      });

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
    collage,
    modelDescription
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

  const modelDescription = await describeModelForGeneration(identityImages);

  const fullPrompt = `${MASTER_PROMPT}

PERSON TO GENERATE (MUST MATCH EXACTLY):
${modelDescription}

${options.extraPrompt ? `ADDITIONAL NOTES:\n${options.extraPrompt}\n\n` : ''}${shot.shot}`;

  const image = await generateImageWithDALLE(fullPrompt, identityImages);

  return {
    id: shot.id,
    label: shot.label,
    status: 'ok',
    image
  };
}

