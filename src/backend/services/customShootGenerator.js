/**
 * Custom Shoot Generator Service
 * 
 * Generates images for Custom Shoots with Reference Locks.
 * Builds prompts from manual parameters (Quick/Fine mode).
 */

import { requestGeminiImage } from '../providers/geminiClient.js';
import { buildCollage } from '../utils/imageCollage.js';
import { getEmotionById, buildEmotionPrompt, GLOBAL_EMOTION_RULES } from '../schema/emotion.js';
import { 
  CAMERA_SIGNATURE_PRESETS, 
  CAPTURE_STYLE_PRESETS, 
  SKIN_TEXTURE_PRESETS,
  universeToPromptBlock
} from '../schema/universe.js';
import { LIGHT_PRESETS, COLOR_PRESETS, ERA_PRESETS } from '../schema/stylePresets.js';
import { generateImageId } from '../schema/customShoot.js';
import { buildLocationPromptSnippet, buildAmbientPrompt } from '../schema/location.js';

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDERS FOR REFERENCE LOCKS
// ═══════════════════════════════════════════════════════════════

/**
 * Build Style Lock prompt block
 * 
 * IMPORTANT: Style Lock copies VISUAL PROCESSING only, not composition or pose.
 * The model should be in a DIFFERENT position/pose in each frame.
 */
function buildStyleLockPrompt(lock) {
  if (!lock || !lock.enabled) return null;
  
  if (lock.mode === 'strict') {
    return `STYLE REFERENCE (STRICT VISUAL & LOOK):
CRITICAL: You MUST separate the STYLE from the COMPOSITION.

1. WHAT TO COPY (STRICTLY):
- The VISUAL PROCESSING: Color grading, lighting contrast, film stock look, grain.
- The MODEL'S LOOK: Makeup style (e.g. if reference has eyeliner, use eyeliner), hair texture/finish, skin finish.
- The ATMOSPHERE: The "vibe" and mood of the shot.

2. WHAT TO IGNORE (COMPLETELY):
- IGNORE the Camera Angle of the reference. Use the angle described in the prompt/pose.
- IGNORE the Model's Pose from the reference.
- IGNORE the Framing/Crop from the reference.

INSTRUCTION:
Generate a NEW image that looks like it belongs to the SAME PHOTOSHOOT as the reference, featuring the SAME STYLING (makeup/hair) and PROCESSING, but with a COMPLETELY DIFFERENT composition and pose.`;
  }
  
  if (lock.mode === 'soft') {
    return `STYLE REFERENCE (SOFT MATCH):
Use the style reference for visual inspiration:
- Similar color temperature and overall mood
- Similar lighting direction and quality  
- Similar texture treatment and contrast

Allow natural variation — same "family" of images.
The pose, composition, and framing should be COMPLETELY NEW.`;
  }
  
  return null;
}

/**
 * Build Location Lock prompt block
 * 
 * IMPORTANT: Location Lock copies the ENVIRONMENT, not the model's position.
 * The model can be ANYWHERE in that location — sitting, standing, different spots.
 */
function buildLocationLockPrompt(lock) {
  if (!lock || !lock.enabled) return null;
  
  if (lock.mode === 'strict') {
    return `LOCATION REFERENCE — ENVIRONMENT ONLY (CRITICAL):
Use the SAME PHYSICAL SPACE from the location reference:
✓ COPY: The room/space architecture, layout, walls
✓ COPY: Furniture, props, decorative elements visible in the space
✓ COPY: Materials, textures, colors of the environment
✓ COPY: General lighting environment (natural/artificial, warm/cool)
✓ COPY: The "vibe" and atmosphere of the place

⚠️ DO NOT COPY — MODEL POSITION IS FREE:
✗ The model does NOT need to be in the same spot
✗ The model does NOT need to interact with the same furniture
✗ If reference shows model on sofa — new shot can show model STANDING in the same room
✗ Camera can show DIFFERENT ANGLE of the same space
✗ Model can be in FOREGROUND, BACKGROUND, or different area of the room

The reference defines the SPACE, not where the model stands.
Generate a shot in the SAME LOCATION but with the model in a DIFFERENT POSITION.
Follow the NEW pose sketch for model positioning.`;
  }
  
  if (lock.mode === 'soft') {
    return `LOCATION REFERENCE (SOFT MATCH):
Use a similar type of environment:
- Same general vibe (cozy interior, urban exterior, etc.)
- Similar materials and color palette
- Similar mood and atmosphere

The specific space can be different. The model's position is completely free.`;
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDERS FOR CUSTOM UNIVERSE
// ═══════════════════════════════════════════════════════════════

/**
 * Build prompt from Quick Mode presets
 */
function buildQuickModePrompt(presets) {
  const blocks = [];
  
  // Camera Signature
  if (presets.camera && CAMERA_SIGNATURE_PRESETS[presets.camera]) {
    const cam = CAMERA_SIGNATURE_PRESETS[presets.camera];
    if (cam.prompt) {
      blocks.push(`CAMERA: ${cam.prompt}`);
    }
  }
  
  // Capture Style
  if (presets.capture && CAPTURE_STYLE_PRESETS[presets.capture]) {
    const cap = CAPTURE_STYLE_PRESETS[presets.capture];
    if (cap.prompt) {
      blocks.push(`CAPTURE STYLE: ${cap.prompt}`);
    }
  }
  
  // Light
  if (presets.light && LIGHT_PRESETS[presets.light]) {
    const light = LIGHT_PRESETS[presets.light];
    if (light.prompt) {
      blocks.push(`LIGHTING: ${light.prompt}`);
    }
  }
  
  // Color
  if (presets.color && COLOR_PRESETS[presets.color]) {
    const color = COLOR_PRESETS[presets.color];
    if (color.prompt) {
      blocks.push(`COLOR: ${color.prompt}`);
    }
  }
  
  // Texture
  if (presets.texture && SKIN_TEXTURE_PRESETS[presets.texture]) {
    const tex = SKIN_TEXTURE_PRESETS[presets.texture];
    if (tex.prompt) {
      blocks.push(`SKIN & TEXTURE: ${tex.prompt}`);
    }
  }
  
  // Era
  if (presets.era && ERA_PRESETS[presets.era]) {
    const era = ERA_PRESETS[presets.era];
    if (era.prompt) {
      blocks.push(`ERA: ${era.prompt}`);
    }
  }
  
  return blocks.join('\n\n');
}

/**
 * Build Anti-AI markers prompt
 */
function buildAntiAiPrompt(antiAi) {
  if (!antiAi) return '';
  
  const rules = [];
  
  if (antiAi.level === 'high') {
    rules.push('ANTI-AI AESTHETIC (HIGH):');
    rules.push('- Image must look like an authentic photograph, NOT AI-generated');
    rules.push('- Include natural imperfections: micro-motion blur, slight exposure errors');
    rules.push('- Skin must show real texture: pores, subtle blemishes, natural shine');
    rules.push('- Allow compositional imperfections: not perfectly centered, slight tilt');
  } else if (antiAi.level === 'medium') {
    rules.push('ANTI-AI AESTHETIC (MEDIUM):');
    rules.push('- Natural photographic quality, avoid artificial perfection');
    rules.push('- Real skin texture visible, no airbrushing');
    rules.push('- Some natural imperfections allowed');
  } else if (antiAi.level === 'low') {
    rules.push('ANTI-AI AESTHETIC (LOW):');
    rules.push('- Generally natural look with minimal visible imperfections');
  }
  
  // Individual settings
  if (antiAi.settings) {
    const s = antiAi.settings;
    if (s.allowExposureErrors) rules.push('- Slight exposure errors allowed (+/- 0.3 EV)');
    if (s.allowMixedWhiteBalance) rules.push('- Mixed white balance from different sources allowed');
    if (s.requireMicroDefects) rules.push('- Skin micro-defects required (pores, tiny spots)');
    if (s.allowImperfectFocus) rules.push('- Slightly imperfect focus at edges allowed');
    if (s.allowFlaresReflections) rules.push('- Lens flares and reflections allowed');
    if (s.preferMicroMotion) rules.push('- Subtle motion blur on extremities (hands, hair) allowed');
    if (s.filmScanTexture) rules.push('- Film scan texture / subtle grain');
  }
  
  return rules.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// MAIN PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build complete JSON prompt for Custom Shoot generation
 */
export function buildCustomShootPrompt({
  customUniverse,
  locks,
  frame = null,
  location = null,
  emotionId = null,
  extraPrompt = '',
  modelDescription = '',
  clothingNotes = '',
  hasIdentityRefs = false,
  hasClothingRefs = false,
  hasStyleRef = false,
  hasLocationRef = false,
  hasPoseSketch = false,
  // Artistic controls (same as shootGenerator)
  captureStyle = null,
  cameraSignature = null,
  skinTexture = null,
  poseAdherence = 2,
  // Composition
  composition = null,
  // Anti-AI override
  antiAi = null,
  // Ambient (situational conditions: weather, season, atmosphere)
  ambient = null
}) {
  const promptJson = {
    format: 'aida_custom_shoot_v1',
    formatVersion: 1,
    generatedAt: new Date().toISOString(),
    
    // Hard rules
    hardRules: [
      'Return photorealistic images (no illustration, no CGI, no 3D render, no painterly look).',
      'Natural skin texture, believable fabric behavior, real optics.',
      'No watermarks, no text overlays, no captions, no logos.',
      'STRICTLY match identity reference images (faces, anatomy) for models.',
      'STRICTLY match clothing reference images (silhouette, color, construction, materials).',
      'Do NOT invent brands/logos/text.'
    ],
    
    // Custom Universe (from presets or fine params)
    visualStyle: null,
    
    // Reference Locks
    styleLock: null,
    locationLock: null,
    
    // Frame/Pose
    frame: null,
    
    // Location
    location: null,
    
    // Emotion
    emotion: null,
    
    // Identity
    identity: {
      hasRefs: hasIdentityRefs,
      rules: hasIdentityRefs ? [
        'Use the uploaded person photo(s) as strict identity reference.',
        'Generate the same person, preserving exact facial identity.',
        'Do not beautify, do not stylize the face.',
        'Match face structure, hairline, eye spacing, nose, lips exactly.'
      ] : [],
      description: modelDescription || null
    },
    
    // Clothing
    clothing: {
      hasRefs: hasClothingRefs,
      rules: hasClothingRefs ? [
        'Strictly follow clothing reference images.',
        'Match silhouette, cut, color, construction, and fabric behavior.',
        'Do not invent patterns or logos.'
      ] : [],
      notes: clothingNotes || null
    },
    
    // Anti-AI
    antiAi: null,
    
    // Extra instructions
    extraPrompt: extraPrompt || null
  };
  
  // Build visual style from presets (Quick Mode)
  if (customUniverse?.presets) {
    console.log('[buildCustomShootPrompt] Using Quick Mode presets:', customUniverse.presets);
    promptJson.visualStyle = buildQuickModePrompt(customUniverse.presets);
    console.log('[buildCustomShootPrompt] Visual style generated, length:', promptJson.visualStyle?.length || 0);
  }
  
  // Add fine-tuned universe parameters if available
  if (customUniverse && !customUniverse.presets) {
    console.log('[buildCustomShootPrompt] Using Fine Mode');
    // Use universeToPromptBlock for fine mode
    promptJson.visualStyle = universeToPromptBlock(customUniverse);
  }
  
  // Add Style Lock
  if (locks?.style?.enabled && hasStyleRef) {
    promptJson.styleLock = buildStyleLockPrompt(locks.style);
    promptJson.hardRules.push('STYLE LOCK: Copy visual processing (colors, lighting, texture) from style reference — but create a NEW composition with NEW pose.');
  }
  
  // Add Location Lock
  if (locks?.location?.enabled && hasLocationRef) {
    promptJson.locationLock = buildLocationLockPrompt(locks.location);
    promptJson.hardRules.push('LOCATION LOCK: Use the same physical space/room — but the model can be ANYWHERE in that space, in any position.');
  }
  
  // Add anti-duplication rule when locks are active
  if ((locks?.style?.enabled && hasStyleRef) || (locks?.location?.enabled && hasLocationRef)) {
    promptJson.hardRules.push('CRITICAL: Do NOT recreate the reference image. Generate a COMPLETELY NEW and UNIQUE shot. The pose, composition, and model position MUST be different from the reference.');
  }
  
  // Add Frame/Pose
  if (frame) {
    promptJson.frame = {
      label: frame.label || 'Custom frame',
      description: frame.description || frame.poseDescription || '',
      technical: frame.technical || {
        shotSize: frame.shotSize || 'medium_full',
        cameraAngle: frame.cameraAngle || 'eye_level'
      }
    };
  }
  
  // Add Location (if not using Location Lock)
  if (location && !hasLocationRef) {
    // Use new hierarchical prompt builder for rich location descriptions
    const locationDescription = buildLocationPromptSnippet(location) || location.description || location.promptSnippet || '';
    
    promptJson.location = {
      label: location.label || 'Custom location',
      description: locationDescription,
      // Include space type info for better context
      spaceType: location.spaceType || null
    };
  }
  
  // Add Ambient conditions (weather/season/atmosphere) - situational, from generator UI
  // Only for outdoor/rooftop locations
  if (ambient && location) {
    const spaceType = location.spaceType || 'studio';
    const isOutdoor = ['exterior_urban', 'exterior_nature', 'rooftop_terrace'].includes(spaceType);
    
    if (isOutdoor) {
      const ambientParts = buildAmbientPrompt(ambient);
      if (ambientParts.length > 0) {
        promptJson.ambient = {
          weather: ambient.weather || 'clear',
          season: ambient.season || 'summer',
          atmosphere: ambient.atmosphere || 'neutral',
          prompt: ambientParts.join(', ')
        };
      }
    }
  }
  
  // Add Emotion (using same format as shootGenerator)
  if (emotionId) {
    console.log('[buildCustomShootPrompt] Looking up emotionId:', emotionId);
    const emotion = getEmotionById(emotionId);
    console.log('[buildCustomShootPrompt] Found emotion:', emotion?.label || 'NOT FOUND');
    if (emotion) {
      // Build full emotion block (same as shootGenerator)
      const emotionPrompt = buildEmotionPrompt(emotionId, 2); // default intensity 2
      promptJson.emotion = {
        source: 'preset',
        presetId: emotionId,
        label: emotion.label,
        intensity: 2,
        atmosphere: emotion.atmosphere,
        avoid: emotion.avoid,
        authenticityKey: emotion.authenticityKey,
        physicalHints: emotion.physicalHints,
        promptBlock: emotionPrompt,
        globalRules: GLOBAL_EMOTION_RULES
      };
      console.log('[buildCustomShootPrompt] Emotion block added:', emotion.label);
    }
  } else {
    console.log('[buildCustomShootPrompt] No emotionId provided');
  }
  
  // Add Anti-AI
  const effectiveAntiAi = antiAi || customUniverse?.antiAi;
  if (effectiveAntiAi) {
    promptJson.antiAi = buildAntiAiPrompt(effectiveAntiAi);
  }
  
  // Add Capture Style (same as shootGenerator)
  if (captureStyle && captureStyle !== 'none') {
    const preset = CAPTURE_STYLE_PRESETS[captureStyle];
    if (preset) {
      promptJson.captureStyle = {
        preset: captureStyle,
        label: preset.label,
        prompt: preset.prompt
      };
    }
  }
  
  // Add Camera Signature (same as shootGenerator)
  if (cameraSignature && cameraSignature !== 'none') {
    const preset = CAMERA_SIGNATURE_PRESETS[cameraSignature];
    if (preset) {
      promptJson.cameraSignature = {
        preset: cameraSignature,
        label: preset.label,
        prompt: preset.prompt
      };
    }
  }
  
  // Add Skin Texture (same as shootGenerator)
  if (skinTexture && skinTexture !== 'none') {
    const preset = SKIN_TEXTURE_PRESETS[skinTexture];
    if (preset) {
      promptJson.skinTexture = {
        preset: skinTexture,
        label: preset.label,
        prompt: preset.prompt
      };
    }
  }
  
  // Add Composition (Shot Size, Angle, Focus)
  if (composition) {
    const { shotSize, cameraAngle, focusMode } = composition;
    
    // 1. SHOT SIZE
    if (shotSize && shotSize !== 'default') {
      const shotPrompts = {
        'extreme_closeup': 'EXTREME CLOSE-UP SHOT. Frame tight on specific details (eyes, lips, accessories). The background is barely visible.',
        'closeup': 'CLOSE-UP SHOT. Frame the face and neck. Intimate portrait style.',
        'medium_closeup': 'MEDIUM CLOSE-UP SHOT. Head and shoulders framing. Classic portrait distance.',
        'medium_shot': 'MEDIUM SHOT. Frame the subject from waist up. Visible body language.',
        'cowboy_shot': 'AMERICAN SHOT (Cowboy Shot). Frame from knees up.',
        'full_shot': 'FULL BODY SHOT. The entire subject is visible from head to toe.',
        'wide_shot': 'WIDE SHOT. The subject is smaller in the frame, emphasizing the environment and location layout.'
      };
      
      if (shotPrompts[shotSize]) {
        promptJson.composition = promptJson.composition || {};
        promptJson.composition.shotSize = shotPrompts[shotSize];
        promptJson.hardRules.push(`COMPOSITION: ${shotPrompts[shotSize]}`);
      }
    }
    
    // 2. CAMERA ANGLE
    if (cameraAngle && cameraAngle !== 'eye_level') {
      const anglePrompts = {
        'low_angle': 'LOW ANGLE SHOT. Camera looks UP at the subject. Makes the subject look powerful, dominant, or tall.',
        'high_angle': 'HIGH ANGLE SHOT. Camera looks DOWN at the subject.',
        'overhead': 'OVERHEAD / TOP-DOWN SHOT. Camera is directly above, looking 90 degrees down.',
        'dutch_angle': 'DUTCH ANGLE. Tilted camera horizon line. Creates dynamic tension.',
        'selfie': 'SELFIE ANGLE. Shot from arm\'s length, looking slightly down at self.'
      };
      
      if (anglePrompts[cameraAngle]) {
         promptJson.composition = promptJson.composition || {};
         promptJson.composition.angle = anglePrompts[cameraAngle];
         promptJson.hardRules.push(`ANGLE: ${anglePrompts[cameraAngle]}`);
      }
    }
    
    // 3. DEPTH OF FIELD
    if (focusMode) {
      const focusPrompts = {
        'shallow': 'SHALLOW DEPTH OF FIELD (f/1.4 - f/2.8). Subject sharp, background completely blurred (bokeh). Separation.',
        'deep': 'DEEP DEPTH OF FIELD (f/8 - f/11). Everything in focus from foreground to background. Clear environment.',
        'focus_face': 'CRITICAL FOCUS ON EYES. Shallow depth of field, ears and background naturally fall off into blur.',
        'soft_focus': 'SOFT FOCUS / DIFFUSION FILTER. Dreamy, glowing atmosphere. Slightly reduced local contrast.'
      };
      
      if (focusPrompts[focusMode]) {
        promptJson.composition = promptJson.composition || {};
        promptJson.composition.focus = focusPrompts[focusMode];
      }
    }
  }

  // Add Pose Reference if sketch is provided (same as shootGenerator)
  if (hasPoseSketch) {
    const adherenceLevel = poseAdherence || 2;
    const adherenceLabels = {
      1: 'free',
      2: 'loose',
      3: 'close',
      4: 'exact'
    };
    const adherenceInstructions = {
      1: 'POSE TYPE ONLY — DO NOT copy the exact pose from sketch. Only match the general category.',
      2: 'GENERAL DIRECTION ONLY — create a similar vibe, not a copy. Match roughly 30-40% of the pose.',
      3: 'FOLLOW CLOSELY — match about 70-80% of the pose. Main body line should match the sketch.',
      4: 'STRICT MATCH — replicate the pose with maximum precision (90-100%). Every limb angle matters.'
    };
    
    promptJson.poseReference = {
      hasSketch: true,
      adherenceLevel,
      adherenceLabel: adherenceLabels[adherenceLevel],
      rules: [
        'A POSE SKETCH image is provided as reference.',
        'The sketch shows ONLY pose — ignore any clothing, face details, or hair in it.',
        `ADHERENCE LEVEL: ${adherenceLevel}/4 (${adherenceLabels[adherenceLevel].toUpperCase()})`,
        adherenceInstructions[adherenceLevel]
      ]
    };
  }
  
  return promptJson;
}

/**
 * Convert promptJson to text format for Gemini
 */
export function promptJsonToText(promptJson) {
  const sections = [];
  
  // Hard rules
  if (promptJson.hardRules?.length) {
    sections.push('=== HARD RULES ===');
    sections.push(promptJson.hardRules.join('\n'));
  }
  
  // Style Lock (highest priority)
  if (promptJson.styleLock) {
    sections.push('\n=== STYLE LOCK ===');
    sections.push(promptJson.styleLock);
  }
  
  // Location Lock
  if (promptJson.locationLock) {
    sections.push('\n=== LOCATION LOCK ===');
    sections.push(promptJson.locationLock);
  }
  
  // Visual Style
  if (promptJson.visualStyle) {
    sections.push('\n=== VISUAL STYLE ===');
    sections.push(promptJson.visualStyle);
  }
  
  // Frame
  if (promptJson.frame) {
    sections.push('\n=== FRAME / POSE ===');
    sections.push(`${promptJson.frame.label}: ${promptJson.frame.description}`);
    if (promptJson.frame.technical) {
      const t = promptJson.frame.technical;
      sections.push(`Shot: ${t.shotSize}, Angle: ${t.cameraAngle}`);
    }
  }
  
  // Location
  if (promptJson.location) {
    sections.push('\n=== LOCATION ===');
    sections.push(`${promptJson.location.label}: ${promptJson.location.description}`);
  }
  
  // Emotion
  if (promptJson.emotion) {
    sections.push('\n=== EMOTION ===');
    sections.push(promptJson.emotion);
    if (promptJson.globalEmotionRules) {
      sections.push('\nGlobal emotion rules:');
      sections.push(promptJson.globalEmotionRules.join('\n'));
    }
  }
  
  // Identity
  if (promptJson.identity?.hasRefs) {
    sections.push('\n=== IDENTITY ===');
    sections.push(promptJson.identity.rules.join('\n'));
    if (promptJson.identity.description) {
      sections.push(`Model: ${promptJson.identity.description}`);
    }
  }
  
  // Clothing
  if (promptJson.clothing?.hasRefs) {
    sections.push('\n=== CLOTHING ===');
    sections.push(promptJson.clothing.rules.join('\n'));
    if (promptJson.clothing.notes) {
      sections.push(`Notes: ${promptJson.clothing.notes}`);
    }
  }
  
  // Anti-AI
  if (promptJson.antiAi) {
    sections.push('\n=== AUTHENTICITY ===');
    sections.push(promptJson.antiAi);
  }
  
  // Extra prompt
  if (promptJson.extraPrompt) {
    sections.push('\n=== ADDITIONAL INSTRUCTIONS ===');
    sections.push(promptJson.extraPrompt);
  }
  
  return sections.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// IMAGE PACKING
// ═══════════════════════════════════════════════════════════════

/**
 * Pack images into a collage for Gemini
 */
async function packImagesToBoard(images, options = {}) {
  if (!images || images.length === 0) return null;
  if (images.length === 1) return images[0]; // Don't collage single image
  
  return await buildCollage(images, {
    maxSize: options.maxSize || 2048,
    maxCols: options.maxCols || 3,
    minTile: options.minTile || 400, // Larger tiles for detail preservation
    jpegQuality: options.jpegQuality || 92,
    fit: options.fit || 'cover',
    background: options.background || '#ffffff'
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a frame for a Custom Shoot
 * 
 * @param {Object} params
 * @param {Object} params.shoot - The CustomShoot object
 * @param {Array} params.identityImages - Model identity images
 * @param {Array} params.clothingImages - Clothing reference images
 * @param {Object|null} params.styleRefImage - Style lock reference image
 * @param {Object|null} params.locationRefImage - Location lock reference image
 * @param {Object|null} params.frame - Frame/pose parameters
 * @param {string|null} params.emotionId - Emotion preset ID
 * @param {string} params.extraPrompt - Additional instructions
 * @returns {Promise<Object>} Generation result
 */
export async function generateCustomShootFrame({
  shoot,
  identityImages = [],
  clothingImages = [],
  styleRefImage = null,
  locationRefImage = null,
  locationSketchImage = null,
  poseSketchImage = null,
  frame = null,
  emotionId = null,
  extraPrompt = '',
  location = null,
  presets = null,
  aspectRatio = null,
  imageSize = null,
  // Artistic controls (same as shootGenerator)
  captureStyle = null,
  cameraSignature = null,
  skinTexture = null,
  poseAdherence = 2,
  // Composition
  composition = null,
  // Anti-AI override
  antiAi = null,
  // Ambient (situational conditions: weather, season, atmosphere)
  ambient = null
}) {
  try {
    console.log('[CustomShootGenerator] Starting frame generation...');
    
    const { customUniverse, locks, globalSettings } = shoot;
    
    // Override presets if passed
    const effectiveUniverse = presets 
      ? { ...customUniverse, presets: { ...customUniverse?.presets, ...presets } }
      : customUniverse;
    
    // Override location if passed
    const effectiveLocation = location || shoot.location;
    
    // Log all effective parameters
    console.log('[CustomShootGenerator] Effective params:', {
      hasUniverse: !!effectiveUniverse,
      presets: effectiveUniverse?.presets,
      emotionId,
      hasFrame: !!frame,
      frameLabel: frame?.label,
      hasLocation: !!effectiveLocation,
      locationLabel: effectiveLocation?.label,
      hasStyleRef: !!styleRefImage,
      hasLocationRef: !!locationRefImage,
      identityCount: identityImages.length,
      clothingCount: clothingImages.length
    });
    
    // Build the prompt
    const promptJson = buildCustomShootPrompt({
      customUniverse: effectiveUniverse,
      locks,
      frame,
      location: effectiveLocation,
      emotionId,
      extraPrompt,
      modelDescription: '',
      clothingNotes: '',
      hasIdentityRefs: identityImages.length > 0,
      hasClothingRefs: clothingImages.length > 0,
      hasStyleRef: !!styleRefImage,
      hasLocationRef: !!locationRefImage,
      hasPoseSketch: !!poseSketchImage,
      // Artistic controls
      captureStyle,
      cameraSignature,
      skinTexture,
      poseAdherence,
      // Composition
      composition,
      // Anti-AI
      antiAi,
      // Ambient (situational conditions)
      ambient
    });
    
    // Send as JSON (same as shootGenerator)
    const promptText = JSON.stringify(promptJson, null, 2);
    console.log('[CustomShootGenerator] JSON Prompt built, length:', promptText.length);
    
    // Prepare reference images
    const referenceImages = [];
    
    // 1. Style reference (first priority)
    if (styleRefImage && locks?.style?.enabled) {
      referenceImages.push(styleRefImage);
      console.log('[CustomShootGenerator] Style reference added');
    }
    
    // 2. Location reference (second priority)
    if (locationRefImage && locks?.location?.enabled) {
      referenceImages.push(locationRefImage);
      console.log('[CustomShootGenerator] Location Lock reference added');
    } else if (locationSketchImage) {
      referenceImages.push(locationSketchImage);
      console.log('[CustomShootGenerator] Location Sketch added');
    }
    
    // 3. Identity images (collage)
    if (identityImages.length > 0) {
      const identityBoard = await packImagesToBoard(identityImages, {
        maxSize: 1024,
        fit: 'cover'
      });
      if (identityBoard) {
        referenceImages.push(identityBoard);
        console.log('[CustomShootGenerator] Identity board added');
      }
    }
    
    // 4. Clothing images (collage) - high quality for detail preservation
    if (clothingImages.length > 0) {
      const clothingBoard = await packImagesToBoard(clothingImages, {
        maxSize: 2048,       // Larger canvas
        minTile: 512,        // Bigger tiles for clothing details
        maxCols: 2,          // Max 2 columns to keep images large
        jpegQuality: 95,     // High quality
        fit: 'contain'       // Show full garment
      });
      if (clothingBoard) {
        referenceImages.push(clothingBoard);
        console.log('[CustomShootGenerator] Clothing board added');
      }
    }
    
    // 5. Pose sketch (same as shootGenerator)
    if (poseSketchImage) {
      referenceImages.push(poseSketchImage);
      console.log('[CustomShootGenerator] Pose sketch added');
    }
    
    console.log(`[CustomShootGenerator] Total reference images: ${referenceImages.length}`);
    
    // Get image config - override with passed params
    const defaultConfig = globalSettings?.imageConfig || { aspectRatio: '3:4', imageSize: '2K' };
    const imageConfig = {
      aspectRatio: aspectRatio || defaultConfig.aspectRatio,
      imageSize: imageSize || defaultConfig.imageSize
    };
    
    // Log final prompt and config for debugging
    console.log('[CustomShootGenerator] === FINAL PROMPT ===');
    console.log(promptText);
    console.log('[CustomShootGenerator] === IMAGE CONFIG ===');
    console.log(JSON.stringify(imageConfig, null, 2));
    console.log('[CustomShootGenerator] === REFS ===');
    console.log(`Identity refs: ${identityImages.length}, Clothing refs: ${clothingImages.length}`);
    console.log(`Style ref: ${styleRefImage ? 'YES' : 'NO'}, Location ref: ${locationRefImage ? 'YES' : 'NO'}`);
    console.log('[CustomShootGenerator] ===================');
    
    // Call Gemini - pass imageConfig as object
    const result = await requestGeminiImage({
      prompt: promptText,
      referenceImages,
      imageConfig
    });
    
    if (!result.ok) {
      console.error('[CustomShootGenerator] Generation failed:', result.error);
      return {
        ok: false,
        error: result.error
      };
    }
    
    console.log('[CustomShootGenerator] Generation successful');
    
    // Build image object from result
    const imageData = {
      mimeType: result.mimeType,
      base64: result.base64,
      dataUrl: `data:${result.mimeType};base64,${result.base64}`
    };
    
    // Build result
    return {
      ok: true,
      image: imageData,
      promptJson,
      prompt: promptText,
      paramsSnapshot: {
        presets: customUniverse?.presets || null,
        locks: {
          style: locks?.style?.enabled ? locks.style.mode : null,
          location: locks?.location?.enabled ? locks.location.mode : null
        },
        frame: frame?.label || null,
        emotion: emotionId || null
      }
    };
    
  } catch (error) {
    console.error('[CustomShootGenerator] Error:', error);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Prepare image object from URL/dataURL for generation
 */
export async function prepareImageFromUrl(imageUrl) {
  if (!imageUrl) return null;
  
  // If it's already a data URL
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return {
        mimeType: match[1],
        base64: match[2]
      };
    }
  }
  
  // If it's a file path or URL, we need to fetch it
  // This would need to be implemented based on your infrastructure
  console.warn('[CustomShootGenerator] Non-dataURL image reference not yet supported:', imageUrl.slice(0, 50));
  return null;
}

