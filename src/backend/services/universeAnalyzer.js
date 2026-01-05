/**
 * Universe Analyzer Service
 * 
 * Analyzes reference images using OpenAI Vision API
 * and generates universe parameters based on the visual style.
 */

import { UNIVERSE_OPTIONS, createEmptyUniverse } from '../schema/universe.js';
import config from '../config.js';

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT FOR ANALYSIS
// ═══════════════════════════════════════════════════════════════

const ANALYSIS_SYSTEM_PROMPT = `You are an expert fashion photography analyst. Your task is to analyze reference images and extract precise technical and aesthetic parameters that define the visual style.

You must analyze the images and fill in ALL parameters for a "universe" — a complete visual DNA definition for a fashion shoot.

## PARAMETERS TO ANALYZE:

### 1. CAPTURE / MEDIUM (how the image was captured)
- mediumType: photo | film | digital
- cameraSystem: 35mm | medium_format | digital_ff | aps-c
- lensBehavior: sharp_center_soft_edges | field_curvature | focus_falloff | even
- shutterBehavior: flash_freeze | motion_blur_allowed | mixed
- dynamicRange: natural | limited | crushed_highlights_allowed
- grainStructure: none | fine | visible | aggressive
- scanArtifacts: array of [dust, scratches, light_leaks, none]

### 2. LIGHT PHYSICS
- primaryLightType: on_camera_flash | strobe | continuous | natural | mixed
- flashCharacter: harsh | direct | slightly_diffused | soft
- ambientLightType: daylight | sodium | tungsten | mixed | none
- exposureBias: number from -1 to +1 (EV compensation)
- shadowBehavior: hard_edges | soft_falloff | mixed
- highlightBehavior: clipped_allowed | roll_off | halation
- lightImperfections: array of [uneven_falloff, flare_ghosts, reflections, none]

### 3. COLOR SCIENCE
- baseColorCast: neutral | warm | cool | green_cyan | amber
- dominantPalette: muted | desaturated | high_contrast | natural
- accentColors: array of color keywords (e.g. ["rust", "brick", "sodium_yellow"])
- skinToneRendering: natural | slightly_muted | no_beautification
- whiteBalanceBehavior: imperfect | mixed_sources_visible | corrected
- colorNoise: none | subtle | film_like

### 4. TEXTURE & MATERIALITY
- surfaceResponse: matte | semi_gloss | reflective | mixed
- materialTruthVisible: boolean (true if real fabric texture is visible)
- skinTextureVisible: boolean (true if pores/unevenness visible)
- imperfectionsAllowed: array of [fingerprints, dust, smudges, none]
- microDetailLevel: natural | detailed | not_hyper_detailed

### 5. OPTICAL IMPERFECTIONS
- focusAccuracy: perfect | slightly_imperfect | edge_softness
- chromaticAberration: none | subtle | visible
- vignetting: none | subtle | natural | heavy
- halation: none | subtle | visible
- naturalLensDistortionAllowed: boolean

### 6. COMPOSITIONAL FEEL
- horizonBehavior: level | slightly_imperfect | tilted_allowed
- editorialBias: magazine_spread | candid | documentary | editorial
- negativeSpaceDefault: present | minimal | generous

### 7. POST-PROCESS PHILOSOPHY
- retouchingLevel: minimal | editorial_only | none
- skinSmoothing: boolean (false = texture preserved)
- sharpening: none | very_light | editorial
- hdrForbidden: boolean (true = no HDR)
- aiArtifactsPrevention: boolean (true = no plastic skin, no CGI clarity)

### 8. ERA & VISUAL CONTEXT
- eraReference: late_90s | early_2000s | mid_2000s | 2010s | contemporary
- editorialReference: european_fashion | american_commercial | japanese_street | eastern_european
- printBehavior: magazine_scan_feel | ink_softness | digital_clean
- formatBias: vertical | horizontal | spread_friendly | square

## OUTPUT FORMAT:

Return a valid JSON object with this structure:
{
  "label": "Short descriptive name for this universe",
  "shortDescription": "2-3 sentences describing the overall visual style",
  "capture": { ... all capture parameters ... },
  "light": { ... all light parameters ... },
  "color": { ... all color parameters ... },
  "texture": { ... all texture parameters ... },
  "optical": { ... all optical parameters ... },
  "composition": { ... all composition parameters ... },
  "postProcess": { ... all postProcess parameters ... },
  "era": { ... all era parameters ... }
}

Be precise. Use ONLY the allowed values listed above. Base your analysis on what you actually see in the images.`;

// ═══════════════════════════════════════════════════════════════
// OPENAI API CALL
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze reference images and generate universe parameters
 * 
 * @param {Array<{mimeType: string, base64: string}>} images - Reference images
 * @param {string} userNotes - Optional user notes/preferences
 * @returns {Promise<Object>} - Generated universe object
 */
export async function analyzeReferencesAndGenerateUniverse(images, userNotes = '') {
  const apiKey = config.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (!images || images.length === 0) {
    throw new Error('At least one reference image is required');
  }

  // Build messages with images
  const imageContents = images.slice(0, 5).map(img => ({
    type: 'image_url',
    image_url: {
      url: `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}`,
      detail: 'high'
    }
  }));

  const userMessage = userNotes
    ? `Analyze these reference images and generate a universe definition.\n\nUser notes/preferences:\n${userNotes}\n\nTake the user's preferences into account when choosing parameter values.`
    : 'Analyze these reference images and generate a universe definition based on what you see.';

  const messages = [
    {
      role: 'system',
      content: ANALYSIS_SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: userMessage },
        ...imageContents
      ]
    }
  ];

  console.log('[UniverseAnalyzer] Calling OpenAI with', images.length, 'images');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[UniverseAnalyzer] OpenAI error:', errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from OpenAI');
  }

  // Parse JSON response
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.error('[UniverseAnalyzer] Failed to parse response:', content);
    throw new Error('Failed to parse OpenAI response as JSON');
  }

  // Merge with template to ensure all fields exist
  const template = createEmptyUniverse(parsed.label || 'AI Generated Universe');
  
  const universe = {
    ...template,
    label: parsed.label || template.label,
    shortDescription: parsed.shortDescription || '',
    capture: { ...template.capture, ...(parsed.capture || {}) },
    light: { ...template.light, ...(parsed.light || {}) },
    color: { ...template.color, ...(parsed.color || {}) },
    texture: { ...template.texture, ...(parsed.texture || {}) },
    optical: { ...template.optical, ...(parsed.optical || {}) },
    composition: { ...template.composition, ...(parsed.composition || {}) },
    postProcess: { ...template.postProcess, ...(parsed.postProcess || {}) },
    era: { ...template.era, ...(parsed.era || {}) }
  };

  console.log('[UniverseAnalyzer] Generated universe:', universe.label);

  return universe;
}

/**
 * Quick validation that image data is valid
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
    if (!img || typeof img !== 'object') {
      return { valid: false, error: `Image ${i} is invalid` };
    }
    if (!img.base64 || typeof img.base64 !== 'string') {
      return { valid: false, error: `Image ${i} missing base64 data` };
    }
    if (img.base64.length < 100) {
      return { valid: false, error: `Image ${i} base64 data too short` };
    }
  }

  return { valid: true };
}

