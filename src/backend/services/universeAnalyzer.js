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

const ANALYSIS_SYSTEM_PROMPT = `You are an expert fashion photography art director and visual analyst. Your task is to analyze reference images and extract BOTH the technical parameters AND the artistic/emotional DNA that defines the visual style.

CRITICAL: Fashion photography is NOT just about camera settings. It's about MOOD, NARRATIVE, and ART DIRECTION. Analyze the FEELING and STORY the images tell, not just their technical execution.

You must analyze the images and fill in ALL parameters for a "universe" — a complete visual DNA definition for a fashion shoot.

## FIRST: ANALYZE THE ARTISTIC VISION

Before diving into technical parameters, answer these questions about the references:
- What STORY do these images tell? What's the narrative?
- What EMOTION do they evoke? (theatrical, intimate, surreal, documentary, etc.)
- What ART DIRECTION approach is used? (conceptual, commercial, editorial, avant-garde)
- What makes these images DISTINCTIVE from typical fashion photography?
- What is the WORLD these images exist in? (fantasy, reality, somewhere between)

Use your answers to inform ALL the parameters below.

## PARAMETERS TO ANALYZE:

### 0. ARTISTIC VISION & MOOD (MOST IMPORTANT)
- artDirection: conceptual | theatrical | documentary | commercial | avant_garde | surrealist | minimalist | maximalist
- narrativeType: story_driven | mood_driven | product_focused | character_study | abstract
- emotionalTone: intimate | dramatic | playful | melancholic | mysterious | aggressive | dreamy | unsettling
- worldBuilding: fantasy | heightened_reality | raw_reality | surreal | theatrical_set | found_location
- distinctiveElements: array of what makes this style unique (e.g., ["theatrical_staging", "painted_backdrops", "surreal_props", "rich_textures"])
- atmosphericDensity: sparse | layered | dense | overwhelming (how much visual information per frame)
- humanPresence: dominant | integrated | secondary | absent (how models relate to environment)

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

### 10. TEXT BLOCKS (detailed narrative descriptions for prompts)

Generate rich, detailed text blocks that capture the FULL essence of the visual style. These blocks are used directly in image generation prompts, so make them evocative and specific:

- visionBlock: 3-4 sentences describing the ARTISTIC VISION and CONCEPT. What world do these images exist in? What story are they telling? What makes them art, not just product shots? Example: "A surrealist theater where fashion becomes performance. Models exist in painted dreamscapes, interacting with environments that feel both ancient and timeless. Each frame is a tableau vivant — a frozen moment in an ongoing drama. The aesthetic references 1970s Italian cinema, Fellini's color saturation, and vintage Vogue Italia editorials."

- atmosphereBlock: 3-4 sentences about the FEELING and ATMOSPHERE. Not technical — emotional. What does it FEEL like to look at these images? Example: "Heavy, textured, layered. The air feels thick with dust and mystery. Surfaces have patina — walls that have witnessed decades, floors that hold secrets. Light falls imperfectly, casting dramatic shadows that become part of the composition. There's tension between elegance and decay."

- techBlock: 2-3 sentences about the technical approach. Camera behavior, exposure philosophy, how motion is handled, what makes this technically distinctive. Example: "Medium format film aesthetic with visible grain and gentle halation. Shadows allowed to go rich and dense, not lifted. Focus sometimes soft at edges. Color shifts between frames allowed — no clinical consistency."

- colorBlock: 2-3 sentences about color palette and grading. Dominant colors, how shadows and highlights are colored, skin rendering philosophy. Example: "Deep, saturated earth tones: terracotta, forest green, aged gold. Shadows tend towards teal and brown. Skin rendered warm but not beautified — texture visible. Highlights have gentle roll-off, never harsh or clipped."

- lensBlock: 2-3 sentences about optical characteristics. Focal lengths, aperture behavior, depth of field philosophy. Example: "50-85mm range for natural perspective. Moderate depth of field — subject sharp but environment present and readable. Occasional wider shots (35mm) for full environment. Vintage lens character with subtle aberration."

- moodBlock: 2-3 sentences about the emotional energy. What's the human element? How do models exist in this world? Example: "Contemplative, theatrical, slightly otherworldly. Models are characters in a play, not just wearing clothes. Poses are deliberate but not stiff — as if caught mid-thought or mid-gesture. Eye contact is rare; the gaze is often internal or directed at something unseen."

- eraBlock: 2-3 sentences about cultural and temporal context. What era or aesthetic tradition it references. Example: "Late 1990s / early 2000s European editorial. References to Guy Bourdin's theatrical staging, Sarah Moon's soft focus dreamscapes, Paolo Roversi's luminous intimacy. The luxury magazine era before digital sterility."

- environmentBlock: 2-3 sentences specifically about BACKGROUNDS and SETS. Are they clean or textured? Real or constructed? How do they contribute to the image? Example: "Sets feel deliberately constructed but never fake — theatrical backdrops, painted walls with visible texture, real locations with patina. Environments are characters themselves: they have history, they have weight. No clean white cyclorama, no sterile minimalism."

### 11. ANTI-AI MARKERS

Specify settings to make images look more authentic:

- level: minimal | low | medium | high
- customRules: array of specific rules for this universe (e.g., "Allow lens dust in corners", "Prefer slightly underexposed shadows")

### 12. LOCATIONS (generate 5-10 logical locations for this visual style)

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
  "label": "Short evocative name for this universe (e.g., 'Theatrical Surrealism', 'Urban Grit', 'Dreamscape Editorial')",
  "shortDescription": "3-4 sentences describing the ARTISTIC VISION and FEELING, not just technical parameters",
  "artisticVision": {
    "artDirection": "conceptual | theatrical | documentary | commercial | avant_garde | surrealist | minimalist | maximalist",
    "narrativeType": "story_driven | mood_driven | product_focused | character_study | abstract",
    "emotionalTone": "intimate | dramatic | playful | melancholic | mysterious | aggressive | dreamy | unsettling",
    "worldBuilding": "fantasy | heightened_reality | raw_reality | surreal | theatrical_set | found_location",
    "distinctiveElements": ["array", "of", "unique", "characteristics"],
    "atmosphericDensity": "sparse | layered | dense | overwhelming",
    "humanPresence": "dominant | integrated | secondary | absent"
  },
  "capture": { ... all capture parameters ... },
  "light": { ... all light parameters ... },
  "color": { ... all color parameters ... },
  "texture": { ... all texture parameters ... },
  "optical": { ... all optical parameters ... },
  "composition": { ... all composition parameters ... },
  "postProcess": { ... all postProcess parameters ... },
  "era": { ... all era parameters ... },
  "defaultFrameParams": { ... default frame parameters ... },
  "textBlocks": {
    "visionBlock": "3-4 sentences about artistic concept and world-building...",
    "atmosphereBlock": "3-4 sentences about feeling and atmosphere...",
    "techBlock": "2-3 sentences about technical approach...",
    "colorBlock": "2-3 sentences about color palette...",
    "lensBlock": "2-3 sentences about optical characteristics...",
    "moodBlock": "2-3 sentences about emotional energy and human presence...",
    "eraBlock": "2-3 sentences about era and cultural context...",
    "environmentBlock": "2-3 sentences about backgrounds and sets..."
  },
  "antiAi": {
    "level": "medium",
    "customRules": ["specific rule 1", "specific rule 2"]
  },
  "locations": [
    {
      "label": "Location Name (evocative, not generic)",
      "description": "Detailed atmospheric description — what does this place FEEL like, not just look like",
      "category": "urban | interior | industrial | nature | transport | commercial | cultural | domestic | abstract",
      "lighting": { "type": "natural|artificial|mixed", "quality": "soft|hard|dramatic|flat", "temperature": "warm|cool|neutral|mixed" },
      "atmosphere": { "spaceFeeling": "intimate|expansive|claustrophobic|open", "timeOfDay": "day|night|golden_hour|blue_hour|any", "mood": "descriptive mood string" },
      "surfaces": { "materials": ["array of materials"], "colors": ["array of colors"], "texture": "smooth|rough|aged|pristine|mixed" },
      "defaultFrameParams": { "shotSize": "full_body|medium_full|medium|close_up", "cameraAngle": "eye_level|low_angle|high_angle", "poseType": "standing|sitting|lying|walking|leaning", "poseDescription": "specific pose description for this location" },
      "promptSnippet": "Ready-to-use prompt snippet with ATMOSPHERE, not just description"
    },
    ... 4-9 more locations that FIT the artistic vision ...
  ]
}

IMPORTANT RULES:
1. Be SPECIFIC and EVOCATIVE, not generic. "Moody lighting" is bad. "Light falls in shafts through dusty windows, catching suspended particles" is good.
2. Locations should feel like they belong in THE SAME WORLD as the reference images.
3. The textBlocks are used directly in prompts — make them rich and usable.
4. Focus on what makes these images DISTINCTIVE and MEMORABLE.
5. If the references feel theatrical/surreal/conceptual, reflect that. Don't flatten everything to "clean fashion photography."`;

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
    // NEW: Merge textBlocks
    textBlocks: {
      ...template.textBlocks,
      ...(parsed.textBlocks || {})
    },
    // NEW: Merge antiAi
    antiAi: {
      ...template.antiAi,
      level: parsed.antiAi?.level || template.antiAi.level,
      customRules: parsed.antiAi?.customRules || template.antiAi.customRules || [],
      settings: { ...template.antiAi.settings }
    },
    locations: processLocations(parsed.locations || [], template.id)
  };

  console.log('[UniverseAnalyzer] Generated universe:', universe.label, 'with', universe.locations.length, 'locations');
  console.log('[UniverseAnalyzer] TextBlocks:', Object.keys(universe.textBlocks).filter(k => universe.textBlocks[k]).length, 'blocks generated');

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
