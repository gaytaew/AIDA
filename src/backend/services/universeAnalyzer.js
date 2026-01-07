/**
 * Universe Analyzer Service
 * 
 * Analyzes reference images using OpenAI Vision API
 * and generates universe parameters + locations based on the visual style.
 */

import { createEmptyUniverse, DEFAULT_FRAME_PARAMS } from '../schema/universe.js';
import { generateLocationId, LOCATION_CATEGORIES } from '../schema/location.js';
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

### 9. DEFAULT FRAME PARAMS (fallback when no specific frame is selected)
- defaultFraming: close_up | medium | full_body | wide
- defaultAngle: eye_level | low_angle | high_angle | overhead
- defaultComposition: centered | rule_of_thirds | off_center
- defaultExpression: neutral | confident | contemplative | playful
- defaultPoseType: static | dynamic | candid
- defaultPoseNotes: string (brief pose description)

### 10. LOCATIONS (generate 5-10 logical locations for this visual style)

For each location, provide:
- label: Short name (e.g. "Neon Alley", "Soviet Kitchen", "Parking Garage")
- description: 1-2 sentences describing the place for prompt generation
- category: urban | interior | industrial | nature | transport | commercial | cultural | domestic | abstract
- lighting: { type: natural|artificial|mixed, quality: soft|hard|dramatic|flat, temperature: warm|cool|neutral|mixed }
- atmosphere: { spaceFeeling: intimate|expansive|claustrophobic|open, timeOfDay: day|night|golden_hour|blue_hour|any, mood: string }
- surfaces: { materials: array of strings, colors: array of dominant colors }
- defaultFrameParams: { shotSize: full_body|medium_full|medium|close_up, cameraAngle: eye_level|low_angle|high_angle, poseType: standing|sitting|lying|walking|leaning, poseDescription: string describing typical pose for this location }
- promptSnippet: A ready-to-use prompt snippet for this location

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
  "era": { ... all era parameters ... },
  "defaultFrameParams": { ... default frame parameters ... },
  "locations": [
    {
      "label": "Location Name",
      "description": "Detailed description...",
      "category": "urban",
      "lighting": { "type": "artificial", "quality": "hard", "temperature": "warm" },
      "atmosphere": { "spaceFeeling": "intimate", "timeOfDay": "night", "mood": "moody and atmospheric" },
      "surfaces": { "materials": ["concrete", "neon"], "colors": ["pink", "cyan", "black"] },
      "defaultFrameParams": { "shotSize": "medium_full", "cameraAngle": "eye_level", "poseType": "leaning", "poseDescription": "Leaning against wall, one leg bent, arms crossed" },
      "promptSnippet": "dimly lit urban alley with neon signs..."
    },
    ... 4-9 more locations ...
  ]
}

Be precise. Use ONLY the allowed values listed above. Base your analysis on what you actually see in the images. Generate locations that would logically fit the visual style you've analyzed.`;

// ═══════════════════════════════════════════════════════════════
// OPENAI API CALL
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze reference images and generate universe parameters + locations
 * 
 * @param {Array<{mimeType: string, base64: string}>} images - Reference images
 * @param {string} userNotes - Optional user notes/preferences
 * @returns {Promise<Object>} - Generated universe object with locations
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
    ? `Analyze these reference images and generate a universe definition with locations.\n\nUser notes/preferences:\n${userNotes}\n\nTake the user's preferences into account when choosing parameter values and generating locations.`
    : 'Analyze these reference images and generate a universe definition with 5-10 fitting locations based on what you see.';

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
      max_tokens: 6000,
      temperature: 0.4,
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
    era: { ...template.era, ...(parsed.era || {}) },
    defaultFrameParams: { ...DEFAULT_FRAME_PARAMS, ...(parsed.defaultFrameParams || {}) },
    locations: processLocations(parsed.locations || [], template.id)
  };

  console.log('[UniverseAnalyzer] Generated universe:', universe.label, 'with', universe.locations.length, 'locations');

  return universe;
}

/**
 * Process and validate locations from AI response
 */
function processLocations(rawLocations, universeId) {
  if (!Array.isArray(rawLocations)) return [];
  
  const now = new Date().toISOString();
  
  return rawLocations.slice(0, 10).map((loc, idx) => {
    // Validate category
    let category = loc.category || 'urban';
    if (!LOCATION_CATEGORIES.includes(category)) {
      category = 'urban';
    }
    
    return {
      id: generateLocationId(loc.label || `Location ${idx + 1}`),
      label: loc.label || `Location ${idx + 1}`,
      description: loc.description || '',
      category,
      tags: [],
      originUniverseId: universeId,
      lighting: {
        type: loc.lighting?.type || 'natural',
        quality: loc.lighting?.quality || 'soft',
        temperature: loc.lighting?.temperature || 'neutral',
        notes: ''
      },
      atmosphere: {
        spaceFeeling: loc.atmosphere?.spaceFeeling || 'open',
        crowdLevel: 'quiet',
        timeOfDay: loc.atmosphere?.timeOfDay || 'any',
        season: 'any',
        mood: loc.atmosphere?.mood || ''
      },
      surfaces: {
        materials: Array.isArray(loc.surfaces?.materials) ? loc.surfaces.materials : [],
        textures: [],
        colors: Array.isArray(loc.surfaces?.colors) ? loc.surfaces.colors : []
      },
      composition: {
        suggestedAngles: ['eye level'],
        framingOptions: ['medium shot'],
        backgroundType: 'neutral',
        depthPotential: true
      },
      // Default frame/pose params for this location (used when no frame is selected)
      defaultFrameParams: {
        shotSize: loc.defaultFrameParams?.shotSize || 'medium_full',
        cameraAngle: loc.defaultFrameParams?.cameraAngle || 'eye_level',
        poseType: loc.defaultFrameParams?.poseType || 'standing',
        composition: 'rule_of_thirds',
        poseDescription: loc.defaultFrameParams?.poseDescription || 'Natural relaxed pose'
      },
      promptSnippet: loc.promptSnippet || loc.description || '',
      createdAt: now,
      updatedAt: now
    };
  });
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
