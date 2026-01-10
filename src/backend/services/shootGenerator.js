/**
 * Shoot Generator Service
 * 
 * Generates final images for shoots by combining:
 * - Universe (visual DNA)
 * - Model identity refs
 * - Clothing refs
 * - Frame parameters
 * 
 * Uses Gemini (Nano Banana Pro) for image generation.
 * 
 * Промпт собирается в JSON-формате из модулей.
 */

import { requestGeminiImage } from '../providers/geminiClient.js';
import { buildCollage } from '../utils/imageCollage.js';
import { getEmotionById, buildEmotionPrompt, GLOBAL_EMOTION_RULES } from '../schema/emotion.js';
import { 
  CAMERA_SIGNATURE_PRESETS, 
  CAPTURE_STYLE_PRESETS, 
  SKIN_TEXTURE_PRESETS 
} from '../schema/universe.js';

// ═══════════════════════════════════════════════════════════════
// JSON PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

// Default scene parameters when no frame is selected
export const DEFAULT_SCENE = {
  label: 'Default Scene',
  description: 'Fashion photo with natural pose',
  technical: {
    shotSize: 'medium_full',
    cameraAngle: 'eye_level',
    poseType: 'static',
    composition: 'rule_of_thirds',
    focusPoint: 'face',
    poseDescription: 'Standing relaxed, natural pose, weight slightly on one leg, arms at sides'
  }
};

// Posing style descriptions
const POSING_STYLE_MAP = {
  1: { label: 'candid', instruction: 'Capture a completely natural, candid moment. The model should look unaware of the camera, as if caught in a spontaneous moment.' },
  2: { label: 'natural', instruction: 'Natural but aware pose. The model knows about the camera but the pose should feel relaxed and uncontrived.' },
  3: { label: 'editorial', instruction: 'Editorial/artistic pose. Deliberate and composed, suitable for fashion magazines. Clear artistic intention.' },
  4: { label: 'studio', instruction: 'High fashion studio pose. Maximally posed and deliberate. Classic fashion photography positioning.' }
};

// Pose adherence descriptions — STRICT GRADIENT
const POSE_ADHERENCE_MAP = {
  1: { 
    label: 'free', 
    instruction: `POSE TYPE ONLY — DO NOT copy the exact pose from sketch.
Only match the general category: standing/sitting/lying/crouching.
DELIBERATELY create a DIFFERENT pose within that category.
Arms, legs, head position should be INVENTED FRESH — do NOT reference the sketch for limb positions.
The sketch is only a hint about whether the model is upright or not.`,
    forbid: 'Do NOT match limb angles. Do NOT match head tilt. Do NOT mirror the sketch composition.'
  },
  2: { 
    label: 'loose', 
    instruction: `GENERAL DIRECTION ONLY — create a similar vibe, not a copy.
Match roughly 30-40% of the pose: if sitting, sit similarly; if leaning, lean in same direction.
But arm positions, hand placement, head angle should be DIFFERENT from sketch.
Add natural variation — the model is doing their own version of this pose.`,
    forbid: 'Do NOT precisely copy arm angles. Do NOT match exact head tilt. Allow significant variation.'
  },
  3: { 
    label: 'close', 
    instruction: `FOLLOW CLOSELY — match about 70-80% of the pose.
Main body line and weight distribution should match the sketch.
Limb angles should be similar but small variations are OK.
Head position and gaze direction should approximate the reference.`,
    forbid: null
  },
  4: { 
    label: 'exact', 
    instruction: `STRICT MATCH — replicate the pose with maximum precision (90-100%).
Body contours must align with sketch. Limb angles must match exactly.
Head tilt, shoulder line, hip angle — all must match the reference.
This is technical pose matching, like a drawing reference.`,
    forbid: 'Do NOT deviate from the sketch. Every limb angle matters.'
  }
};

/**
 * Build the structured JSON prompt from modules
 */
export function buildShootPromptJson({
  universe,
  location,
  frame,
  modelDescription = '',
  clothingNotes = '',
  extraPrompt = '',
  modelCount = 1,
  hasIdentityRefs = false,
  hasClothingRefs = false,
  hasPoseSketch = false,
  posingStyle = 2,
  poseAdherence = 2
}) {
  // Priority: frame > location.defaultFrameParams > DEFAULT_SCENE
  let effectiveFrame = frame;
  
  if (!effectiveFrame && location?.defaultFrameParams) {
    // Use location's default frame params if no frame selected
    effectiveFrame = {
      label: `Default for ${location.label}`,
      description: location.defaultFrameParams.poseDescription || 'Natural pose for this location',
      technical: {
        shotSize: location.defaultFrameParams.shotSize || 'medium_full',
        cameraAngle: location.defaultFrameParams.cameraAngle || 'eye_level',
        poseType: location.defaultFrameParams.poseType || 'standing',
        composition: location.defaultFrameParams.composition || 'rule_of_thirds',
        focusPoint: 'face',
        poseDescription: location.defaultFrameParams.poseDescription || 'Natural relaxed pose'
      }
    };
    console.log('[ShootGenerator] Using location default frame params:', location.label);
  }
  
  if (!effectiveFrame) {
    effectiveFrame = DEFAULT_SCENE;
    console.log('[ShootGenerator] Using default scene (no frame or location params)');
  }

  const promptJson = {
    format: 'aida_shoot_prompt_v1',
    formatVersion: 1,
    generatedAt: new Date().toISOString(),

    // Global hard rules
    hardRules: [
      'Return photorealistic images (no illustration, no CGI, no 3D render, no painterly look).',
      'Natural skin texture, believable fabric behavior, real optics.',
      'No watermarks, no text overlays, no captions, no logos.',
      'STRICTLY match identity reference images (faces, anatomy) for models.',
      'STRICTLY match clothing reference images (silhouette, color, construction, materials).',
      'Do NOT invent brands/logos/text.',
      modelCount === 1 
        ? 'Keep the SAME model identity across all frames.'
        : `Keep the SAME ${modelCount} model identities across all frames.`
    ],

    // Universe / Visual DNA
    universe: buildUniverseBlock(universe),

    // Location (physical place)
    location: buildLocationBlock(location),

    // Identity references
    identity: {
      hasRefs: hasIdentityRefs,
      rules: [
        'Use the uploaded person photo(s) as strict identity reference.',
        'Generate the same person, preserving exact facial identity and proportions.',
        'Do not beautify, do not stylize the face.',
        'Match face structure, hairline, eye spacing, nose, lips exactly.'
      ],
      description: modelDescription || null
    },

    // Clothing references
    clothing: {
      hasRefs: hasClothingRefs,
      rules: [
        'Carefully inspect the clothing reference images.',
        'Recreate ALL garments with MAXIMUM accuracy.',
        'Preserve exact silhouettes, proportions, lengths, fabric behavior.',
        'Match exact colors, prints, patterns.',
        'Do NOT invent new garments or accessories not in the refs.',
        'Do NOT change construction: buttons, zippers, pockets must match refs.'
      ],
      notes: clothingNotes || null
    },

    // Frame / Scene (ONLY pose, camera, composition - NO location)
    frame: buildFrameBlock(effectiveFrame),
    
    // Frame interpretation rules
    frameRules: [
      'FRAME describes ONLY: pose, body position, camera angle, shot size, composition.',
      'FRAME does NOT define: location, background, environment, props, weather.',
      'Location and environment come from LOCATION module (or UNIVERSE if no location).',
      'If frame description mentions any location hints (snow, beach, studio, etc.) — IGNORE them.',
      'Apply the pose/camera from FRAME to whatever location is defined.'
    ],
    
    // Pose sketch reference (if available) — with strict adherence gradient
    poseReference: hasPoseSketch ? (() => {
      const adherenceLevel = POSE_ADHERENCE_MAP[poseAdherence] || POSE_ADHERENCE_MAP[2];
      const rules = [
        'A POSE SKETCH image is provided as reference.',
        'The sketch shows ONLY pose — ignore any clothing, face details, or hair in it.',
        '',
        `=== ADHERENCE LEVEL: ${poseAdherence}/4 (${adherenceLevel.label.toUpperCase()}) ===`,
        adherenceLevel.instruction
      ];
      
      // Add explicit forbid rules for low adherence
      if (adherenceLevel.forbid) {
        rules.push('', '⚠️ FORBIDDEN:', adherenceLevel.forbid);
      }
      
      return {
        hasSketch: true,
        adherenceLevel: poseAdherence,
        adherenceLabel: adherenceLevel.label,
        rules: rules.filter(r => r !== '')
      };
    })() : null,
    
    // Capture style (replaces old posingStyle — now from universe)
    captureStyle: buildCaptureStyleBlock(universe, posingStyle),
    
    // Camera signature — specific camera/film look (from universe)
    cameraSignature: buildCameraSignatureBlock(universe),
    
    // Skin & texture rendering (from universe)
    skinTexture: buildSkinTextureBlock(universe),
    
    // Legacy posingStyle for backwards compatibility
    posingStyle: {
      level: posingStyle,
      label: POSING_STYLE_MAP[posingStyle]?.label || 'natural',
      instruction: POSING_STYLE_MAP[posingStyle]?.instruction || POSING_STYLE_MAP[2].instruction
    },
    
    // Emotion (from frame or default)
    emotion: buildEmotionBlock(effectiveFrame?.emotion),
    
    // Action / micromoment (from frame)
    action: buildActionBlock(effectiveFrame?.action),
    
    // Important textures for this frame
    textures: effectiveFrame?.textures?.length > 0 ? effectiveFrame.textures : null,
    
    // How clothing works in this frame
    clothingFocus: effectiveFrame?.clothingFocus?.description ? {
      description: effectiveFrame.clothingFocus.description,
      emphasis: effectiveFrame.clothingFocus.emphasis || 'balanced',
      silhouetteNotes: effectiveFrame.clothingFocus.silhouetteNotes || null
    } : null,

    // Anti-AI markers (from universe or defaults)
    antiAi: buildAntiAiBlock(universe),
    
    // Artistic intention — anti-AI aesthetic principles
    artisticIntention: buildArtisticIntentionBlock(),
    
    // Narrative micro-beat — what happened before/after this frame
    narrativeBeat: {
      rule: 'This is NOT a posed fashion shot. This is a MOMENT extracted from a life.',
      before: 'Something just happened 3 seconds before this frame.',
      after: 'The model is about to do something 3 seconds after this frame.',
      capture: 'The body remembers the previous gesture. The face anticipates the next thought.',
      clothing: 'Clothes are being WORN, not DISPLAYED. They move with the body, not for the camera.'
    },

    // Extra instructions
    extra: extraPrompt || null
  };

  return promptJson;
}

/**
 * Build emotion block from frame emotion settings (v2 - Atmospheric Approach)
 * 
 * Новый формат: атмосферные описания вместо физических инструкций.
 * Ключ к естественности — описываем ситуацию, а не мимику.
 */
function buildEmotionBlock(emotion) {
  console.log('[ShootGenerator] buildEmotionBlock input:', emotion);
  
  if (!emotion) {
    console.log('[ShootGenerator] No emotion provided, returning null');
    return null;
  }
  
  // If there's a custom description, use it (legacy support)
  if (emotion.customDescription) {
    return {
      source: 'custom',
      promptBlock: emotion.customDescription,
      globalRules: GLOBAL_EMOTION_RULES,
      intensity: emotion.intensity || 2
    };
  }
  
  // If there's an emotion preset ID, use new atmospheric builder
  if (emotion.emotionId) {
    console.log('[ShootGenerator] Looking up emotion preset:', emotion.emotionId);
    const preset = getEmotionById(emotion.emotionId);
    console.log('[ShootGenerator] Found preset:', preset ? preset.label : 'NOT FOUND');
    if (preset) {
      // Build full prompt using new atmospheric approach
      const intensity = emotion.intensity || preset.defaultIntensity || 2;
      const promptBlock = buildEmotionPrompt(emotion.emotionId, intensity);
      
      return {
        source: 'preset',
        presetId: emotion.emotionId,
        label: preset.label,
        intensity,
        // New atmospheric format
        atmosphere: preset.atmosphere,
        avoid: preset.avoid,
        authenticityKey: preset.authenticityKey,
        physicalHints: preset.physicalHints,
        // Full prompt block for AI
        promptBlock,
        globalRules: GLOBAL_EMOTION_RULES
      };
    }
  }
  
  return null;
}

/**
 * Build action/micromoment block from frame action settings
 */
function buildActionBlock(action) {
  if (!action || (!action.description && !action.micromoment)) {
    return null;
  }
  
  return {
    description: action.description || action.micromoment || null,
    motionBlur: action.motionBlur || 'none',
    freezeSubject: action.freezeSubject || 'product',
    rules: [
      action.motionBlur === 'hands_only' ? 'Allow slight motion blur on hands only.' : null,
      action.motionBlur === 'background' ? 'Allow motion blur in background.' : null,
      action.motionBlur === 'all' ? 'Motion blur is allowed throughout.' : null,
      action.freezeSubject === 'product' ? 'Product/clothing must remain sharp.' : null,
      action.freezeSubject === 'face' ? 'Face must remain sharp.' : null
    ].filter(Boolean)
  };
}

/**
 * Build universe block from universe data
 */
function buildUniverseBlock(universe) {
  if (!universe) {
    return {
      shortDescription: null,
      artisticVision: null,
      textBlocks: null,
      antiAi: null,
      capture: null,
      light: null,
      color: null,
      era: null,
      postProcess: null
    };
  }

  // Build text blocks section (rich narrative descriptions)
  const textBlocks = universe.textBlocks || {};
  const hasTextBlocks = textBlocks.visionBlock || textBlocks.atmosphereBlock ||
                        textBlocks.techBlock || textBlocks.colorBlock || 
                        textBlocks.lensBlock || textBlocks.moodBlock || 
                        textBlocks.eraBlock || textBlocks.environmentBlock;

  // Build artistic vision section (most important for mood/atmosphere)
  const artisticVision = universe.artisticVision || {};
  const hasArtisticVision = artisticVision.artDirection || artisticVision.emotionalTone ||
                            artisticVision.worldBuilding;

  return {
    shortDescription: universe.shortDescription || null,
    
    // ARTISTIC VISION - defines the mood and atmosphere (MOST IMPORTANT)
    artisticVision: hasArtisticVision ? {
      artDirection: artisticVision.artDirection || 'editorial',
      narrativeType: artisticVision.narrativeType || 'mood_driven',
      emotionalTone: artisticVision.emotionalTone || 'intimate',
      worldBuilding: artisticVision.worldBuilding || 'heightened_reality',
      distinctiveElements: artisticVision.distinctiveElements || [],
      atmosphericDensity: artisticVision.atmosphericDensity || 'layered',
      humanPresence: artisticVision.humanPresence || 'integrated'
    } : null,
    
    // Rich text blocks for detailed prompt context
    textBlocks: hasTextBlocks ? {
      visionBlock: textBlocks.visionBlock || null,
      atmosphereBlock: textBlocks.atmosphereBlock || null,
      techBlock: textBlocks.techBlock || null,
      colorBlock: textBlocks.colorBlock || null,
      lensBlock: textBlocks.lensBlock || null,
      moodBlock: textBlocks.moodBlock || null,
      eraBlock: textBlocks.eraBlock || null,
      environmentBlock: textBlocks.environmentBlock || null
    } : null,
    
    capture: universe.capture ? {
      mediumType: universe.capture.mediumType || 'photo',
      cameraSystem: universe.capture.cameraSystem || '35mm',
      grainStructure: universe.capture.grainStructure || 'none'
    } : null,
    
    light: universe.light ? {
      primaryLightType: universe.light.primaryLightType || 'natural',
      flashCharacter: universe.light.flashCharacter || 'soft',
      shadowBehavior: universe.light.shadowBehavior || 'soft_falloff'
    } : null,
    
    color: universe.color ? {
      baseColorCast: universe.color.baseColorCast || 'neutral',
      dominantPalette: universe.color.dominantPalette || 'natural',
      skinToneRendering: universe.color.skinToneRendering || 'natural'
    } : null,
    
    era: universe.era ? {
      eraReference: universe.era.eraReference || 'contemporary',
      editorialReference: universe.era.editorialReference || 'european_fashion'
    } : null,
    
    postProcess: universe.postProcess ? {
      hdrForbidden: universe.postProcess.hdrForbidden ?? true,
      aiArtifactsPrevention: universe.postProcess.aiArtifactsPrevention ?? true,
      skinSmoothing: universe.postProcess.skinSmoothing ?? false
    } : null
  };
}

/**
 * Build artistic intention block — anti-AI aesthetic principles
 * This makes images feel like authored photography, not generic AI art
 */
function buildArtisticIntentionBlock() {
  return {
    principles: [
      'This is NOT a stock photo. This is NOT generic AI art.',
      'Imagine a SPECIFIC photographer took this on a SPECIFIC day for a SPECIFIC magazine.',
      'The image should feel like it has a REASON to exist — a story behind it.',
      'Something just happened (3 seconds ago) or is about to happen (in 3 seconds).'
    ],
    avoid: [
      'Perfect bilateral symmetry anywhere in the frame',
      '"Wow" dramatic lighting that screams "look how cinematic I am"',
      'Obviously posed hands resting on surfaces like mannequin display',
      'Dead center placement of subject in frame',
      'Pristine, dust-free, freshly-cleaned environments',
      'Skin that looks retouched, filtered, or poreless',
      'Generic "fashion model expression" — blank pretty stare',
      'Everything in focus with perfect sharpness edge to edge',
      'Colors that are too saturated, too clean, too "enhanced"',
      'Backgrounds that feel generated to match rather than found'
    ],
    require: [
      'A specific MOMENT in time, not a generic "look" or "pose"',
      'Something slightly WRONG: tilt, awkward crop, focus miss, color contamination',
      'Evidence the photographer had LIMITED TIME or LIMITED ACCESS',
      'The subject has a HISTORY visible in posture, expression, clothing wear',
      'TENSION between what camera sees and what subject feels',
      'Environmental details that were NOT placed there for the shoot',
      'Light that happened to be there, not light designed to be beautiful',
      'The frame could be 2 seconds BEFORE or AFTER a better shot — and that makes it better'
    ],
    temporalReality: {
      before: 'What gesture or expression was the model coming FROM?',
      after: 'Where is the model going, what will they do NEXT?',
      rule: 'The camera caught a TRANSITION, not a POSE held for camera'
    }
  };
}

/**
 * Build camera signature block from universe settings
 * This adds the characteristic "look" of a specific camera/film combination
 */
function buildCameraSignatureBlock(universe) {
  const sig = universe?.cameraSignature;
  if (!sig || sig.preset === 'none') return null;
  
  // If custom prompt is provided
  if (sig.preset === 'custom' && sig.customPrompt) {
    return {
      source: 'custom',
      prompt: sig.customPrompt
    };
  }
  
  // Look up preset
  const preset = CAMERA_SIGNATURE_PRESETS[sig.preset];
  if (!preset || !preset.prompt) return null;
  
  return {
    source: 'preset',
    presetId: sig.preset,
    label: preset.label,
    prompt: preset.prompt
  };
}

/**
 * Build capture style block from universe settings
 * This defines HOW the moment was captured (replaces posingStyle)
 */
function buildCaptureStyleBlock(universe, fallbackPosingStyle = 2) {
  const style = universe?.captureStyle;
  
  // If no captureStyle in universe, fall back to old posingStyle logic
  if (!style || style.preset === 'none') {
    const oldStyle = POSING_STYLE_MAP[fallbackPosingStyle] || POSING_STYLE_MAP[2];
    return {
      source: 'legacy_posing_style',
      level: fallbackPosingStyle,
      label: oldStyle.label,
      prompt: oldStyle.instruction
    };
  }
  
  // If custom prompt
  if (style.preset === 'custom' && style.customPrompt) {
    return {
      source: 'custom',
      prompt: style.customPrompt
    };
  }
  
  // Look up preset
  const preset = CAPTURE_STYLE_PRESETS[style.preset];
  if (!preset) {
    const oldStyle = POSING_STYLE_MAP[2];
    return {
      source: 'legacy_posing_style',
      level: 2,
      label: oldStyle.label,
      prompt: oldStyle.instruction
    };
  }
  
  return {
    source: 'preset',
    presetId: style.preset,
    label: preset.label,
    prompt: preset.prompt,
    posingLevel: preset.posingLevel || 2
  };
}

/**
 * Build skin texture block from universe settings
 * This defines how skin and materials are rendered
 */
function buildSkinTextureBlock(universe) {
  const tex = universe?.skinTexture;
  if (!tex || tex.preset === 'none') return null;
  
  // If custom prompt
  if (tex.preset === 'custom' && tex.customPrompt) {
    return {
      source: 'custom',
      prompt: tex.customPrompt
    };
  }
  
  // Look up preset
  const preset = SKIN_TEXTURE_PRESETS[tex.preset];
  if (!preset || !preset.prompt) return null;
  
  return {
    source: 'preset',
    presetId: tex.preset,
    label: preset.label,
    prompt: preset.prompt
  };
}

/**
 * Build anti-AI block from universe or defaults
 */
function buildAntiAiBlock(universe) {
  const antiAi = universe?.antiAi;
  
  // Default rules
  const baseRules = [
    'Natural skin texture with visible pores, fine lines, small imperfections.',
    'Real fabric behavior: natural wrinkles, folds, drape.',
    'NOT too perfect, NOT too symmetrical.',
    'NO plastic/waxy skin texture.',
    'NO HDR look.',
    'NO watermarks or text overlays.'
  ];
  
  // Level-specific rules
  const levelRules = {
    minimal: [],
    low: ['Allow subtle micro-imperfections on skin and fabric.'],
    medium: [
      'Allow subtle exposure variations.',
      'Allow mixed color temperatures.',
      'Include micro-imperfections: slight dust, stray hairs, fabric pills.',
      'Slight film grain or organic texture is OK.'
    ],
    high: [
      'Allow natural exposure errors.',
      'Allow mixed white balance as real environments have.',
      'Include visible micro-imperfections.',
      'Slight focus softness on non-subject areas is natural.',
      'Allow lens flares, light leaks, reflections.',
      'Slight motion blur on hands/hair/fabric is OK.',
      'Add subtle film grain or scan texture.'
    ]
  };
  
  const level = antiAi?.level || 'medium';
  const customRules = antiAi?.customRules || [];
  
  return {
    level,
    rules: [...baseRules, ...(levelRules[level] || []), ...customRules]
  };
}

/**
 * Build location block from location data
 */
function buildLocationBlock(location) {
  if (!location) {
    return null;
  }

  return {
    label: location.label || null,
    description: location.description || null,
    promptSnippet: location.promptSnippet || null,  // Ready-to-use prompt text
    environmentType: location.environmentType || null,
    surface: location.surface || null,
    lighting: location.lighting ? {
      type: location.lighting.type || 'natural',
      timeOfDay: location.lighting.timeOfDay || 'any',
      description: location.lighting.description || null
    } : null,
    props: Array.isArray(location.props) && location.props.length > 0 ? location.props : null
  };
}

/**
 * Build frame block from frame data
 */
function buildFrameBlock(frame) {
  if (!frame) {
    return {
      label: null,
      description: null,
      technical: null
    };
  }

  return {
    label: frame.label || null,
    description: frame.description || null,
    
    technical: frame.technical ? {
      shotSize: frame.technical.shotSize || null,
      cameraAngle: frame.technical.cameraAngle || null,
      poseType: frame.technical.poseType || null,
      composition: frame.technical.composition || null,
      focusPoint: frame.technical.focusPoint || null,
      poseDescription: frame.technical.poseDescription || null
    } : {
      shotSize: frame.shotSize || null,
      cameraAngle: frame.cameraAngle || null,
      poseType: frame.poseType || null,
      composition: frame.composition || null,
      focusPoint: frame.focusPoint || null,
      poseDescription: frame.poseDescription || null
    }
  };
}

/**
 * Convert JSON prompt to text for Gemini
 * Gemini works with text, so we serialize the JSON in a structured way
 */
export function jsonPromptToText(promptJson) {
  const sections = [];

  // Header with format info
  sections.push(`PROMPT FORMAT: ${promptJson.format} v${promptJson.formatVersion}`);
  sections.push('');

  // Hard rules
  sections.push('HARD RULES:');
  promptJson.hardRules.forEach((rule, i) => {
    sections.push(`${i + 1}. ${rule}`);
  });
  sections.push('');

  // Universe
  if (promptJson.universe) {
    sections.push('UNIVERSE (VISUAL DNA):');
    const u = promptJson.universe;
    if (u.shortDescription) sections.push(u.shortDescription);
    if (u.capture) {
      sections.push(`Medium: ${u.capture.mediumType}, ${u.capture.cameraSystem}`);
      if (u.capture.grainStructure !== 'none') sections.push(`Grain: ${u.capture.grainStructure}`);
    }
    if (u.light) {
      sections.push(`Lighting: ${u.light.primaryLightType}, ${u.light.flashCharacter}`);
      sections.push(`Shadows: ${u.light.shadowBehavior}`);
    }
    if (u.color) {
      sections.push(`Color: ${u.color.baseColorCast} cast, ${u.color.dominantPalette} palette`);
      if (u.color.skinToneRendering) sections.push(`Skin: ${u.color.skinToneRendering}`);
    }
    if (u.era) {
      sections.push(`Era: ${u.era.eraReference}, ${u.era.editorialReference}`);
    }
    if (u.postProcess) {
      if (u.postProcess.hdrForbidden) sections.push('NO HDR.');
      if (u.postProcess.aiArtifactsPrevention) sections.push('NO AI artifacts, NO plastic skin.');
      if (!u.postProcess.skinSmoothing) sections.push('Preserve skin texture.');
    }
    sections.push('');
  }

  // Location
  if (promptJson.location) {
    sections.push('LOCATION:');
    const loc = promptJson.location;
    if (loc.label) sections.push(`Place: ${loc.label}`);
    if (loc.description) sections.push(loc.description);
    if (loc.environmentType) sections.push(`Environment: ${String(loc.environmentType).replace(/_/g, ' ')}`);
    if (loc.surface) sections.push(`Surface: ${loc.surface}`);
    if (loc.lighting) {
      const parts = [];
      if (loc.lighting.type) parts.push(String(loc.lighting.type).replace(/_/g, ' '));
      if (loc.lighting.timeOfDay && loc.lighting.timeOfDay !== 'any') {
        parts.push(String(loc.lighting.timeOfDay).replace(/_/g, ' '));
      }
      if (parts.length > 0) sections.push(`Light: ${parts.join(', ')}`);
      if (loc.lighting.description) sections.push(loc.lighting.description);
    }
    if (loc.props && loc.props.length > 0) {
      sections.push(`Props: ${loc.props.join(', ')}`);
    }
    sections.push('');
  }

  // Identity
  sections.push('IDENTITY (MUST MATCH EXACTLY):');
  promptJson.identity.rules.forEach(rule => sections.push(`- ${rule}`));
  if (promptJson.identity.description) {
    sections.push('');
    sections.push('MODEL DESCRIPTION:');
    sections.push(promptJson.identity.description);
  }
  sections.push('');

  // Clothing
  sections.push('CLOTHING (MUST MATCH EXACTLY):');
  promptJson.clothing.rules.forEach(rule => sections.push(`- ${rule}`));
  if (promptJson.clothing.notes) {
    sections.push('');
    sections.push('CLOTHING NOTES:');
    sections.push(promptJson.clothing.notes);
  }
  sections.push('');

  // Frame
  if (promptJson.frame) {
    sections.push('FRAME / SHOT:');
    const f = promptJson.frame;
    if (f.label) sections.push(`Shot: ${f.label}`);
    if (f.description) sections.push(f.description);
    if (f.technical) {
      const t = f.technical;
      if (t.shotSize) sections.push(`Size: ${String(t.shotSize).replace(/_/g, ' ')}`);
      if (t.cameraAngle) sections.push(`Angle: ${String(t.cameraAngle).replace(/_/g, ' ')}`);
      if (t.poseType) sections.push(`Pose type: ${t.poseType}`);
      if (t.composition) sections.push(`Composition: ${String(t.composition).replace(/_/g, ' ')}`);
      if (t.focusPoint) sections.push(`Focus: ${t.focusPoint}`);
      if (t.poseDescription) sections.push(`Pose: ${t.poseDescription}`);
    }
    sections.push('');
  }

  // Camera Signature (specific camera/film look)
  if (promptJson.cameraSignature && promptJson.cameraSignature.prompt) {
    sections.push('CAMERA SIGNATURE (specific camera/film aesthetic):');
    if (promptJson.cameraSignature.label) {
      sections.push(`Camera: ${promptJson.cameraSignature.label}`);
    }
    sections.push(promptJson.cameraSignature.prompt);
    sections.push('Apply this camera signature to the entire image: color science, grain, bokeh, flash behavior, lens character.');
    sections.push('');
  }
  
  // Capture Style (how the moment was captured)
  if (promptJson.captureStyle && promptJson.captureStyle.prompt) {
    sections.push('CAPTURE STYLE (how this moment was caught):');
    if (promptJson.captureStyle.label) {
      sections.push(`Style: ${promptJson.captureStyle.label}`);
    }
    sections.push(promptJson.captureStyle.prompt);
    sections.push('');
  }
  
  // Skin & Texture
  if (promptJson.skinTexture && promptJson.skinTexture.prompt) {
    sections.push('SKIN & TEXTURE RENDERING:');
    if (promptJson.skinTexture.label) {
      sections.push(`Look: ${promptJson.skinTexture.label}`);
    }
    sections.push(promptJson.skinTexture.prompt);
    sections.push('');
  }

  // Anti-AI
  sections.push('ANTI-AI MARKERS:');
  promptJson.antiAi.rules.forEach(rule => sections.push(`- ${rule}`));
  sections.push('');
  
  // Artistic Intention
  if (promptJson.artisticIntention) {
    const ai = promptJson.artisticIntention;
    sections.push('ARTISTIC INTENTION (what makes this shot feel REAL and AUTHORED):');
    sections.push('');
    ai.principles.forEach(p => sections.push(p));
    sections.push('');
    sections.push('AVOID these AI tells at all costs:');
    ai.avoid.forEach(a => sections.push(`- ${a}`));
    sections.push('');
    sections.push('REQUIRE these qualities of AUTHORED editorial photography:');
    ai.require.forEach(r => sections.push(`- ${r}`));
    sections.push('');
    sections.push('TEMPORAL REALITY — what happened BEFORE and AFTER:');
    sections.push(`- 3 seconds BEFORE: ${ai.temporalReality.before}`);
    sections.push(`- 3 seconds AFTER: ${ai.temporalReality.after}`);
    sections.push(`- ${ai.temporalReality.rule}`);
    sections.push('');
  }
  
  // Narrative Beat
  if (promptJson.narrativeBeat) {
    const nb = promptJson.narrativeBeat;
    sections.push('NARRATIVE MICRO-BEAT (the STORY of this exact second):');
    sections.push(nb.rule);
    sections.push(`Before: ${nb.before}`);
    sections.push(`After: ${nb.after}`);
    sections.push(nb.capture);
    sections.push(nb.clothing);
    sections.push('');
  }

  // Extra
  if (promptJson.extra) {
    sections.push('ADDITIONAL INSTRUCTIONS:');
    sections.push(promptJson.extra);
  }

  return sections.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// IMAGE PACKING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Pack multiple images into a single collage
 */
async function packImagesToBoard(images, options = {}) {
  if (!images || images.length === 0) return null;
  if (images.length === 1) return images[0];
  
  return await buildCollage(images, {
    maxSize: options.maxSize || 1536,
    jpegQuality: options.jpegQuality || 90,
    fit: options.fit || 'cover',
    background: options.background || '#ffffff'
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a single frame image for a shoot
 * 
 * @param {Object} params
 * @param {Object} params.universe - Universe/visual DNA
 * @param {Object} params.frame - Frame parameters
 * @param {Object} params.poseSketchImage - Pose sketch image {mimeType, base64} (optional)
 * @param {Array} params.identityImages - Model identity photos
 * @param {Array} params.clothingImages - Clothing reference photos
 * @param {string} params.modelDescription - Model description text
 * @param {string} params.clothingNotes - Notes about clothing
 * @param {string} params.extraPrompt - Additional instructions
 * @param {number} params.posingStyle - Posing style 1-4 (1=casual, 4=studio)
 * @param {number} params.poseAdherence - How strictly to follow pose ref 1-4
 * @param {Object} params.imageConfig - Image configuration
 * @returns {Promise<{ok: boolean, image?: Object, prompt?: string, promptJson?: Object, error?: string}>}
 */
export async function generateShootFrame({
  universe,
  location,
  frame,
  poseSketchImage = null,
  identityImages = [],
  clothingImages = [],
  modelDescription = '',
  clothingNotes = '',
  extraPrompt = '',
  posingStyle = 2,
  poseAdherence = 2,
  imageConfig = {}
}) {
  try {
    console.log('[ShootGenerator] Starting frame generation...');

    // Build the JSON prompt
    const promptJson = buildShootPromptJson({
      universe,
      location,
      frame,
      modelDescription,
      clothingNotes,
      extraPrompt,
      modelCount: 1,
      hasIdentityRefs: identityImages.length > 0,
      hasClothingRefs: clothingImages.length > 0,
      hasPoseSketch: !!poseSketchImage,
      posingStyle,
      poseAdherence
    });

    // Send JSON directly to Gemini
    const promptText = JSON.stringify(promptJson, null, 2);

    console.log('[ShootGenerator] JSON Prompt built, length:', promptText.length);

    // Pack identity and clothing images
    const referenceImages = [];

    // Pack identity images into a board
    if (identityImages.length > 0) {
      const identityBoard = await packImagesToBoard(identityImages, {
        maxSize: 1024,
        fit: 'cover'
      });
      if (identityBoard) {
        referenceImages.push(identityBoard);
        console.log('[ShootGenerator] Identity board created');
      }
    }

    // Pack clothing images into a board
    if (clothingImages.length > 0) {
      const clothingBoard = await packImagesToBoard(clothingImages, {
        maxSize: 1536,
        fit: 'contain'
      });
      if (clothingBoard) {
        referenceImages.push(clothingBoard);
        console.log('[ShootGenerator] Clothing board created');
      }
    }

    // Add pose sketch as reference if available
    console.log('[ShootGenerator] poseSketchImage received?', !!poseSketchImage);
    if (poseSketchImage) {
      console.log('[ShootGenerator] poseSketchImage.base64 length:', poseSketchImage.base64?.length || 0);
    }
    if (poseSketchImage && poseSketchImage.base64) {
      referenceImages.push(poseSketchImage);
      console.log('[ShootGenerator] ✅ Pose sketch added as reference, total refs:', referenceImages.length);
    } else {
      console.log('[ShootGenerator] ❌ No pose sketch to add');
    }

    console.log(`[ShootGenerator] Sending ${referenceImages.length} reference images to Gemini`);

    // Generate with Gemini
    const result = await requestGeminiImage({
      prompt: promptText,
      referenceImages,
      imageConfig: {
        aspectRatio: imageConfig.aspectRatio || '3:4',
        imageSize: imageConfig.imageSize || '1K'
      }
    });

    if (!result.ok) {
      console.error('[ShootGenerator] Gemini error:', result.error);
      return {
        ok: false,
        error: result.error,
        prompt: promptText,
        promptJson
      };
    }

    console.log('[ShootGenerator] Frame generated successfully');

    return {
      ok: true,
      image: {
        mimeType: result.mimeType,
        base64: result.base64
      },
      prompt: promptText,
      promptJson
    };

  } catch (error) {
    console.error('[ShootGenerator] Error:', error);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Generate all frames for a shoot
 */
export async function generateAllShootFrames({
  universe,
  location,
  frames,
  identityImages = [],
  clothingImages = [],
  modelDescription = '',
  clothingNotes = '',
  imageConfig = {},
  delayMs = 2000
}) {
  const results = [];

  // If no frames provided, use default scene
  const effectiveFrames = (frames && frames.length > 0) ? frames : [{ ...DEFAULT_SCENE, id: 'default' }];

  for (let i = 0; i < effectiveFrames.length; i++) {
    const frame = effectiveFrames[i];
    console.log(`[ShootGenerator] Generating frame ${i + 1}/${effectiveFrames.length}: ${frame.label || frame.id}`);

    const result = await generateShootFrame({
      universe,
      location: frame.location || location,
      frame,
      identityImages,
      clothingImages,
      modelDescription,
      clothingNotes,
      extraPrompt: frame.extraPrompt || '',
      imageConfig
    });

    results.push({
      frameId: frame.id || `frame-${i}`,
      frameLabel: frame.label || `Frame ${i + 1}`,
      ...result
    });

    // Delay between requests
    if (i < effectiveFrames.length - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
