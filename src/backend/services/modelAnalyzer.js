/**
 * Model Analyzer Service
 * 
 * Analyzes reference images using OpenAI Vision API
 * and generates a detailed physical description for the model.
 */

import config from '../config.js';
import { generateModelId } from '../schema/model.js';

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT FOR ANALYSIS
// ═══════════════════════════════════════════════════════════════

const ANALYSIS_SYSTEM_PROMPT = `You are an expert fashion model scout and photographer. Your task is to analyze photos of a model and create a detailed, precise physical description that will be used for consistent image generation.

You must analyze the images and extract ALL physical characteristics to create a complete model profile.

## PARAMETERS TO ANALYZE:

### 1. BODY STRUCTURE
- Height estimate (in cm, based on proportions)
- Body type (slim, athletic, curvy, petite, tall, average, plus-size)
- Limb proportions (long limbs, average, short limbs)
- Posture characteristics

### 2. FACE STRUCTURE
- Face shape (oval, round, square, heart, oblong, diamond)
- Cheekbone definition (high, low, prominent, subtle)
- Jawline (sharp, soft, defined, angular, rounded)
- Forehead (high, low, wide, narrow)
- Chin shape

### 3. EYES
- Eye shape (almond, round, hooded, monolid, downturned, upturned)
- Eye color
- Eye spacing (close-set, wide-set, average)
- Eyelash characteristics
- Brow shape and thickness

### 4. NOSE
- Nose shape (straight, aquiline, button, roman, snub)
- Bridge width
- Tip shape

### 5. LIPS & MOUTH
- Lip shape (full, thin, bow-shaped, wide, heart)
- Lip proportions (upper vs lower)
- Natural color/pigmentation

### 6. SKIN
- Skin tone (fair, light, medium, olive, tan, brown, dark)
- Undertone (warm, cool, neutral)
- Skin texture characteristics
- Any distinctive features (freckles, beauty marks)

### 7. HAIR
- Hair color (natural shade)
- Hair texture (straight, wavy, curly, coily)
- Hair length and style
- Hairline characteristics

### 8. DISTINCTIVE FEATURES
- Any unique identifying features
- Proportions that stand out
- Overall aesthetic impression

## OUTPUT FORMAT:

Return a valid JSON object with this structure:
{
  "id": "suggested-id-based-on-appearance",
  "name": "Short descriptive name",
  "label": "One-line summary of the model's look",
  "promptSnippet": "Detailed physical description (2-4 paragraphs) covering all visible features. Be specific about measurements, shapes, colors. This will be used verbatim in image generation prompts.",
  "heightCm": estimated height as number or null,
  "bodyType": "one of: slim, athletic, curvy, petite, tall, average, plus-size",
  "background": "Professional characteristics/vibe (e.g., fashion, editorial, commercial, extreme, lifestyle). Infer from the model's look and potential utility."
}

## CRITICAL RULES:

1. Be PRECISE and SPECIFIC - avoid vague terms
2. The promptSnippet should be comprehensive enough to recreate the model's appearance
3. Focus on PHYSICAL characteristics only, not clothing or styling
4. Use professional, respectful language
5. Include both macro (body) and micro (skin texture, eye details) observations
6. The description should ensure consistent identity across generated images`;

// ═══════════════════════════════════════════════════════════════
// API CALL HELPER
// ═══════════════════════════════════════════════════════════════

async function callOpenAIVision(messages) {
  const apiKey = config.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const url = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 2500,
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ModelAnalyzer] OpenAI error:', errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from OpenAI');
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.error('[ModelAnalyzer] Failed to parse response:', content);
    throw new Error('Failed to parse OpenAI response as JSON');
  }

  return parsed;
}

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYSIS FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze model photos and generate a complete model profile
 * @param {Array<{mimeType: string, base64: string}>} images - Reference images
 * @param {string} [hint] - Optional user hint about the model
 * @returns {Promise<Object>} - Generated model data
 */
export async function analyzeModelPhotos(images, hint = '') {
  if (!images || images.length === 0) {
    throw new Error('At least one reference image is required');
  }

  // Prepare image content for OpenAI (limit to 1 image for now to fix EPIPE)
  const imageContents = images.slice(0, 1).map(img => ({
    type: 'image_url',
    image_url: {
      url: `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}`,
      detail: 'high'
    }
  }));

  const payloadSize = JSON.stringify(imageContents).length;
  console.log(`[ModelAnalyzer] Payload size for 1 image: ${(payloadSize / 1024 / 1024).toFixed(2)} MB`);

  const userMessage = hint
    ? `Analyze these photos and create a detailed model profile. User notes: ${hint}`
    : 'Analyze these photos and create a detailed model profile.';

  const messages = [
    { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        { type: 'text', text: userMessage },
        ...imageContents
      ]
    }
  ];

  console.log(`[ModelAnalyzer] Analyzing ${images.length} image(s) with OpenAI Vision`);

  const parsed = await callOpenAIVision(messages);

  // ALWAYS generate a unique ID (ignore AI-provided ID to prevent duplicates)
  const uniqueId = generateModelId();

  // Build final model object
  const model = {
    id: uniqueId,
    name: parsed.name || 'Generated Model',
    label: parsed.label || '',
    promptSnippet: parsed.promptSnippet || '',
    heightCm: typeof parsed.heightCm === 'number' ? Math.round(parsed.heightCm) : null,
    bodyType: parsed.bodyType || '',
    background: parsed.background || ''
  };

  console.log('[ModelAnalyzer] Generated model:', model.name);

  return model;
}

/**
 * Validate incoming image data
 */
export function validateImageData(images) {
  if (!Array.isArray(images)) {
    return { valid: false, error: 'images must be an array' };
  }
  if (images.length === 0) {
    return { valid: false, error: 'At least one image is required' };
  }
  if (images.length > 10) {
    return { valid: false, error: 'Maximum 10 images allowed' };
  }
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (!img || typeof img !== 'object' || !img.base64 || typeof img.base64 !== 'string' || img.base64.length < 100) {
      return { valid: false, error: `Image ${i + 1} is invalid or missing base64 data` };
    }
  }
  return { valid: true };
}

