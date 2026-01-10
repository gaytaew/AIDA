/**
 * Universe Schema
 * 
 * A universe defines the complete visual DNA of a shoot.
 * It covers: capture medium, light physics, color science,
 * texture, optical imperfections, composition, post-process, and era.
 */

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} Universe
 * @property {string} id
 * @property {string} label
 * @property {string} shortDescription
 * @property {CaptureMedium} capture
 * @property {LightPhysics} light
 * @property {ColorScience} color
 * @property {TextureMateriality} texture
 * @property {OpticalImperfections} optical
 * @property {CompositionalFeel} composition
 * @property {PostProcessPhilosophy} postProcess
 * @property {EraContext} era
 * @property {Array<Location>} locations
 * @property {Array<StyleVariant>} styleVariants
 * @property {string} createdAt
 * @property {string} updatedAt
 */

// ═══════════════════════════════════════════════════════════════
// 1. CAPTURE / MEDIUM
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} CaptureMedium
 * @property {'photo'|'film'|'digital'} mediumType
 * @property {'35mm'|'medium_format'|'digital_ff'|'aps-c'} cameraSystem
 * @property {'sharp_center_soft_edges'|'field_curvature'|'focus_falloff'|'even'} lensBehavior
 * @property {'flash_freeze'|'motion_blur_allowed'|'mixed'} shutterBehavior
 * @property {'natural'|'limited'|'crushed_highlights_allowed'} dynamicRange
 * @property {'none'|'fine'|'visible'|'aggressive'} grainStructure
 * @property {Array<'dust'|'scratches'|'light_leaks'|'none'>} scanArtifacts
 */

export const CAPTURE_MEDIUM_OPTIONS = {
  mediumType: ['photo', 'film', 'digital'],
  cameraSystem: ['35mm', 'medium_format', 'digital_ff', 'aps-c'],
  lensBehavior: ['sharp_center_soft_edges', 'field_curvature', 'focus_falloff', 'even'],
  shutterBehavior: ['flash_freeze', 'motion_blur_allowed', 'mixed'],
  dynamicRange: ['natural', 'limited', 'crushed_highlights_allowed'],
  grainStructure: ['none', 'fine', 'visible', 'aggressive'],
  scanArtifacts: ['dust', 'scratches', 'light_leaks', 'none']
};

export const DEFAULT_CAPTURE = {
  mediumType: 'film',
  cameraSystem: '35mm',
  lensBehavior: 'sharp_center_soft_edges',
  shutterBehavior: 'flash_freeze',
  dynamicRange: 'natural',
  grainStructure: 'visible',
  scanArtifacts: ['dust']
};

// ═══════════════════════════════════════════════════════════════
// 2. LIGHT PHYSICS
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} LightPhysics
 * @property {'on_camera_flash'|'strobe'|'continuous'|'natural'|'mixed'} primaryLightType
 * @property {'harsh'|'direct'|'slightly_diffused'|'soft'} flashCharacter
 * @property {'daylight'|'sodium'|'tungsten'|'mixed'|'none'} ambientLightType
 * @property {number} exposureBias - EV compensation (-1 to +1)
 * @property {'hard_edges'|'soft_falloff'|'mixed'} shadowBehavior
 * @property {'clipped_allowed'|'roll_off'|'halation'} highlightBehavior
 * @property {Array<'uneven_falloff'|'flare_ghosts'|'reflections'|'none'>} lightImperfections
 */

export const LIGHT_PHYSICS_OPTIONS = {
  primaryLightType: ['on_camera_flash', 'strobe', 'continuous', 'natural', 'mixed'],
  flashCharacter: ['harsh', 'direct', 'slightly_diffused', 'soft'],
  ambientLightType: ['daylight', 'sodium', 'tungsten', 'mixed', 'none'],
  shadowBehavior: ['hard_edges', 'soft_falloff', 'mixed'],
  highlightBehavior: ['clipped_allowed', 'roll_off', 'halation'],
  lightImperfections: ['uneven_falloff', 'flare_ghosts', 'reflections', 'none']
};

export const DEFAULT_LIGHT = {
  primaryLightType: 'on_camera_flash',
  flashCharacter: 'harsh',
  ambientLightType: 'mixed',
  exposureBias: 0,
  shadowBehavior: 'hard_edges',
  highlightBehavior: 'clipped_allowed',
  lightImperfections: ['uneven_falloff', 'reflections']
};

// ═══════════════════════════════════════════════════════════════
// 3. COLOR SCIENCE
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} ColorScience
 * @property {'neutral'|'warm'|'cool'|'green_cyan'|'amber'} baseColorCast
 * @property {'muted'|'desaturated'|'high_contrast'|'natural'} dominantPalette
 * @property {Array<string>} accentColors - e.g. ['rust', 'brick', 'sodium_yellow']
 * @property {'natural'|'slightly_muted'|'no_beautification'} skinToneRendering
 * @property {'imperfect'|'mixed_sources_visible'|'corrected'} whiteBalanceBehavior
 * @property {'none'|'subtle'|'film_like'} colorNoise
 */

export const COLOR_SCIENCE_OPTIONS = {
  baseColorCast: ['neutral', 'warm', 'cool', 'green_cyan', 'amber'],
  dominantPalette: ['muted', 'desaturated', 'high_contrast', 'natural'],
  skinToneRendering: ['natural', 'slightly_muted', 'no_beautification'],
  whiteBalanceBehavior: ['imperfect', 'mixed_sources_visible', 'corrected'],
  colorNoise: ['none', 'subtle', 'film_like']
};

export const DEFAULT_COLOR = {
  baseColorCast: 'cool',
  dominantPalette: 'high_contrast',
  accentColors: ['rust', 'sodium_yellow'],
  skinToneRendering: 'natural',
  whiteBalanceBehavior: 'imperfect',
  colorNoise: 'subtle'
};

// ═══════════════════════════════════════════════════════════════
// 4. TEXTURE & MATERIALITY
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} TextureMateriality
 * @property {'matte'|'semi_gloss'|'reflective'|'mixed'} surfaceResponse
 * @property {boolean} materialTruthVisible - real fabric texture visible
 * @property {boolean} skinTextureVisible - pores, unevenness allowed
 * @property {Array<'fingerprints'|'dust'|'smudges'|'none'>} imperfectionsAllowed
 * @property {'natural'|'detailed'|'not_hyper_detailed'} microDetailLevel
 */

export const TEXTURE_OPTIONS = {
  surfaceResponse: ['matte', 'semi_gloss', 'reflective', 'mixed'],
  imperfectionsAllowed: ['fingerprints', 'dust', 'smudges', 'none'],
  microDetailLevel: ['natural', 'detailed', 'not_hyper_detailed']
};

export const DEFAULT_TEXTURE = {
  surfaceResponse: 'mixed',
  materialTruthVisible: true,
  skinTextureVisible: true,
  imperfectionsAllowed: ['dust', 'fingerprints'],
  microDetailLevel: 'natural'
};

// ═══════════════════════════════════════════════════════════════
// 5. OPTICAL IMPERFECTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} OpticalImperfections
 * @property {'perfect'|'slightly_imperfect'|'edge_softness'} focusAccuracy
 * @property {'none'|'subtle'|'visible'} chromaticAberration
 * @property {'none'|'subtle'|'natural'|'heavy'} vignetting
 * @property {'none'|'subtle'|'visible'} halation
 * @property {boolean} naturalLensDistortionAllowed
 */

export const OPTICAL_OPTIONS = {
  focusAccuracy: ['perfect', 'slightly_imperfect', 'edge_softness'],
  chromaticAberration: ['none', 'subtle', 'visible'],
  vignetting: ['none', 'subtle', 'natural', 'heavy'],
  halation: ['none', 'subtle', 'visible']
};

export const DEFAULT_OPTICAL = {
  focusAccuracy: 'slightly_imperfect',
  chromaticAberration: 'subtle',
  vignetting: 'natural',
  halation: 'subtle',
  naturalLensDistortionAllowed: true
};

// ═══════════════════════════════════════════════════════════════
// 6. COMPOSITIONAL FEEL (Universe-level defaults)
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} CompositionalFeel
 * @property {'level'|'slightly_imperfect'|'tilted_allowed'} horizonBehavior
 * @property {'magazine_spread'|'candid'|'documentary'|'editorial'} editorialBias
 * @property {'present'|'minimal'|'generous'} negativeSpaceDefault
 * @property {string} notes - Additional composition notes
 */

export const COMPOSITION_OPTIONS = {
  horizonBehavior: ['level', 'slightly_imperfect', 'tilted_allowed'],
  editorialBias: ['magazine_spread', 'candid', 'documentary', 'editorial'],
  negativeSpaceDefault: ['present', 'minimal', 'generous']
};

export const DEFAULT_COMPOSITION = {
  horizonBehavior: 'slightly_imperfect',
  editorialBias: 'editorial',
  negativeSpaceDefault: 'present',
  notes: ''
};

// ═══════════════════════════════════════════════════════════════
// 7. POST-PROCESS PHILOSOPHY
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} PostProcessPhilosophy
 * @property {'minimal'|'editorial_only'|'none'} retouchingLevel
 * @property {boolean} skinSmoothing - false = texture preserved
 * @property {'none'|'very_light'|'editorial'} sharpening
 * @property {boolean} hdrForbidden
 * @property {boolean} aiArtifactsPrevention - no plastic skin, no CGI clarity
 */

export const POST_PROCESS_OPTIONS = {
  retouchingLevel: ['minimal', 'editorial_only', 'none'],
  sharpening: ['none', 'very_light', 'editorial']
};

export const DEFAULT_POST_PROCESS = {
  retouchingLevel: 'editorial_only',
  skinSmoothing: false,
  sharpening: 'none',
  hdrForbidden: true,
  aiArtifactsPrevention: true
};

// ═══════════════════════════════════════════════════════════════
// 8. ERA & VISUAL CONTEXT
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} EraContext
 * @property {'late_90s'|'early_2000s'|'mid_2000s'|'2010s'|'contemporary'} eraReference
 * @property {'european_fashion'|'american_commercial'|'japanese_street'|'eastern_european'} editorialReference
 * @property {'magazine_scan_feel'|'ink_softness'|'digital_clean'} printBehavior
 * @property {'vertical'|'horizontal'|'spread_friendly'|'square'} formatBias
 */

export const ERA_OPTIONS = {
  eraReference: ['late_90s', 'early_2000s', 'mid_2000s', '2010s', 'contemporary'],
  editorialReference: ['european_fashion', 'american_commercial', 'japanese_street', 'eastern_european'],
  printBehavior: ['magazine_scan_feel', 'ink_softness', 'digital_clean'],
  formatBias: ['vertical', 'horizontal', 'spread_friendly', 'square']
};

export const DEFAULT_ERA = {
  eraReference: 'early_2000s',
  editorialReference: 'european_fashion',
  printBehavior: 'magazine_scan_feel',
  formatBias: 'vertical'
};

// ═══════════════════════════════════════════════════════════════
// 9. CAMERA SIGNATURE (specific camera/film look)
// ═══════════════════════════════════════════════════════════════

/**
 * Camera Signature — specific camera/lens/film combination with its characteristic look
 * @typedef {Object} CameraSignature
 * @property {string} preset - Preset name or 'custom'
 * @property {string} customPrompt - Custom prompt if preset is 'custom'
 */

export const CAMERA_SIGNATURE_PRESETS = {
  none: {
    label: 'Без конкретной камеры',
    prompt: null
  },
  polaroid_sx70: {
    label: 'Polaroid SX-70',
    prompt: 'Polaroid SX-70 instant film look, soft focus, subtle vignetting, creamy desaturated colors, chemical bleeding at edges, white frame energy'
  },
  disposable_flash: {
    label: 'Одноразовая камера со вспышкой',
    prompt: 'Disposable camera harsh on-camera flash, red-eye tendency, hot center falloff to dark edges, oversaturated cheap film colors, slight blur from plastic lens, party snapshot aesthetic'
  },
  contax_t2: {
    label: 'Contax T2',
    prompt: 'Contax T2 compact film camera, Carl Zeiss 38mm f/2.8 signature sharpness with smooth bokeh, Kodak Portra 400 color science, natural warm skin tones, 90s fashion elite aesthetic'
  },
  hasselblad_500cm: {
    label: 'Hasselblad 500C/M',
    prompt: 'Hasselblad 500C/M medium format, square 6x6 crop implied, Zeiss Planar 80mm f/2.8 rendering, creamy film grain, fashion editorial studio quality, extreme shallow DOF'
  },
  canon_ae1: {
    label: 'Canon AE-1',
    prompt: 'Canon AE-1 35mm film SLR, FD 50mm f/1.4 wide open, dreamy halation on highlights, consumer film colors like Fujifilm Superia 400, nostalgic amateur aesthetic'
  },
  leica_m6: {
    label: 'Leica M6',
    prompt: 'Leica M6 rangefinder with Summicron 35mm f/2, documentary sharpness, Kodak Tri-X pushed grain, classic street photography look, decisive moment energy'
  },
  iphone_flash: {
    label: 'iPhone со вспышкой',
    prompt: 'iPhone flash selfie aesthetic, harsh direct LED flash, slightly overexposed skin, dark background falloff, computational HDR artifacts visible, social media native look'
  },
  powershot_vlog: {
    label: 'Canon PowerShot G7X',
    prompt: 'Canon PowerShot G7X vlog camera, 1-inch sensor creamy bokeh f/1.8, built-in flash pop for flattering glow, underexposed background -1.3 EV, Instagram aesthetic 2025, dreamy haze'
  },
  mamiya_rz67: {
    label: 'Mamiya RZ67',
    prompt: 'Mamiya RZ67 medium format, 110mm f/2.8 portrait lens, extreme shallow DOF with creamy bokeh, Kodak Portra 160 natural skin tones, high fashion editorial quality'
  },
  yashica_t4: {
    label: 'Yashica T4',
    prompt: 'Yashica T4 point-and-shoot, Zeiss T* 35mm lens, slight barrel distortion, 90s snapshot aesthetic, flash falloff to deep shadows, party and nightlife energy'
  },
  ricoh_gr: {
    label: 'Ricoh GR',
    prompt: 'Ricoh GR compact digital, 28mm equivalent wide angle, high contrast B&W mode energy, street photography snap aesthetic, deep blacks, grain simulation'
  },
  holga_120: {
    label: 'Holga 120',
    prompt: 'Holga 120 toy camera, extreme vignetting, light leaks, soft plastic lens blur, lo-fi dreamy aesthetic, unpredictable exposure, art school vibes'
  }
};

export const DEFAULT_CAMERA_SIGNATURE = {
  preset: 'none',
  customPrompt: ''
};

// ═══════════════════════════════════════════════════════════════
// 10. CAPTURE STYLE (how the moment was captured — replaces posingStyle)
// ═══════════════════════════════════════════════════════════════

/**
 * Capture Style — defines HOW the moment was "caught" by the camera
 * Combines: posing level, camera awareness, technical effects
 * @typedef {Object} CaptureStyle
 * @property {string} preset - Preset name or 'custom'
 * @property {string} customPrompt - Custom prompt if preset is 'custom'
 */

export const CAPTURE_STYLE_PRESETS = {
  editorial_posed: {
    label: 'Editorial постановка',
    prompt: 'Editorial fashion pose, deliberate and composed positioning, model fully aware of camera, direct or intentional gaze, controlled body angles, studio precision, high fashion magazine cover energy',
    posingLevel: 4
  },
  editorial_relaxed: {
    label: 'Editorial расслабленный',
    prompt: 'Relaxed editorial pose, model aware of camera but not performing, natural stance with subtle adjustments, gaze may drift, effortless cool, not trying too hard',
    posingLevel: 3
  },
  candid_aware: {
    label: 'Естественный, в курсе камеры',
    prompt: 'Natural candid moment, model knows camera is there but not actively posing, caught in genuine micro-moment, unposed body language with subtle camera awareness',
    posingLevel: 2
  },
  candid_unaware: {
    label: 'Candid — не видит камеру',
    prompt: 'Candid snapshot, model appears unaware of camera, caught mid-action or mid-thought, no eye contact, body oriented away or past camera, voyeuristic observer feeling',
    posingLevel: 1
  },
  paparazzi_telephoto: {
    label: 'Папарацци / телефото',
    prompt: 'Paparazzi telephoto shot from distance, caught unaware, compression from long lens, grain from high ISO, possible motion blur from subject movement, through crowd or obstacles partially blocking view',
    posingLevel: 1
  },
  harsh_flash_snapshot: {
    label: 'Жёсткая вспышка в лоб',
    prompt: 'Harsh direct on-axis flash, strong dramatic shadows under chin and eyes, high contrast with black background falloff, glossy specular highlights on skin, deer in headlights energy, no soft fill light',
    posingLevel: 2
  },
  motion_blur_action: {
    label: 'Размытие движения',
    prompt: 'Motion blur from slow shutter 1/10s-1/30s, subject core relatively sharp but edges and limbs streaking, ambient lights leaving trails, dynamic frozen movement energy, not static pose',
    posingLevel: 1
  },
  through_window: {
    label: 'Через стекло',
    prompt: 'Shot through dirty window or glass surface, reflections overlaying subject, condensation or fingerprints partially obscuring view, layered depth creating separation, voyeuristic intimate feeling',
    posingLevel: 2
  },
  mirror_reflection: {
    label: 'Отражение в зеркале',
    prompt: 'Subject seen in mirror with real figure also partially visible, bathroom or dressing room intimacy, doubled perspective, private moment made visible, self-examination energy',
    posingLevel: 2
  },
  caught_mid_blink: {
    label: 'Пойман на полузакрытых глазах',
    prompt: 'Eyes at 30-50% closure, vulnerable micro-moment between blinks, not the "hero shot" but somehow more interesting, humanizing imperfection, anti-perfection aesthetic',
    posingLevel: 1
  },
  dutch_angle_tension: {
    label: 'Голландский угол',
    prompt: 'Camera tilted 15-25 degrees off horizontal, deliberately unlevel horizon creating unease and visual tension, dynamic diagonal energy, something feels wrong in a good way',
    posingLevel: 3
  },
  worms_eye_power: {
    label: 'Ракурс снизу',
    prompt: 'Extreme low angle from near ground level looking up, perspective distortion making subject tower above, dramatic sky or ceiling visible, wide angle 14mm-24mm stretch, power and dominance',
    posingLevel: 3
  },
  overhead_graphic: {
    label: 'Вид сверху',
    prompt: 'Shot directly from overhead looking down, flattened perspective, subject looking up or sprawled, unusual body foreshortening, graphic composition, editorial art direction',
    posingLevel: 3
  }
};

export const DEFAULT_CAPTURE_STYLE = {
  preset: 'candid_aware',
  customPrompt: ''
};

// ═══════════════════════════════════════════════════════════════
// 11. SKIN & TEXTURE (how skin and materials render)
// ═══════════════════════════════════════════════════════════════

/**
 * Skin & Texture — defines how skin, hair, and materials are rendered
 * @typedef {Object} SkinTexture
 * @property {string} preset - Preset name or 'custom'
 * @property {string} customPrompt - Custom prompt if preset is 'custom'
 */

export const SKIN_TEXTURE_PRESETS = {
  hyper_real: {
    label: 'Гипер-реалистичная',
    prompt: 'Hyper-realistic skin texture with every pore visible, translucent quality showing subsurface scattering, subtle oil sheen in T-zone, natural micro-imperfections like tiny bumps and hair follicles, no airbrushing, no beauty filter'
  },
  natural_film: {
    label: 'Естественная плёночная',
    prompt: 'Natural skin texture slightly softened by film emulsion properties, gentle luminous glow without looking plastic, fine grain texture over skin, not digitally sharpened, organic warmth'
  },
  flash_specular: {
    label: 'Вспышка (блики)',
    prompt: 'Flash-lit skin with specular highlights on forehead cheekbones and nose, slight overexposure on surfaces nearest flash, shadows under eyes from direct flash angle, oily highlight texture'
  },
  matte_editorial: {
    label: 'Матовая editorial',
    prompt: 'Matte skin finish as if professionally powdered, minimal shine except intentional highlights, editorial makeup texture visible, pores still present but diffused, fashion magazine look'
  },
  raw_unretouched: {
    label: 'Сырая, без ретуши',
    prompt: 'Completely unretouched raw skin, all natural texture visible including blemishes freckles and uneven tone, authentic human skin with its imperfections, anti-beauty-standard honesty'
  },
  sweaty_athletic: {
    label: 'Спортивная / с испариной',
    prompt: 'Light sweat sheen covering skin, droplets visible on forehead and upper lip, athletic exertion or humid environment texture, glistening highlights, wet hair strands sticking'
  },
  golden_hour_glow: {
    label: 'Золотой час',
    prompt: 'Warm golden hour sunlight creating soft glowing skin, backlit rim light on hair and shoulders, lens flare touching skin, diffused warmth, magic hour romantic quality'
  },
  pale_porcelain: {
    label: 'Фарфоровая бледность',
    prompt: 'Pale porcelain-like skin with visible translucency, blue veins faintly showing, ethereal quality, minimal color in cheeks, cool undertones, fragile beauty aesthetic'
  }
};

export const DEFAULT_SKIN_TEXTURE = {
  preset: 'natural_film',
  customPrompt: ''
};

// ═══════════════════════════════════════════════════════════════
// 12. DEFAULT FRAME PARAMS (fallback when no frame is selected)
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} DefaultFrameParams
 * @property {'close_up'|'medium'|'full_body'|'wide'} defaultFraming
 * @property {'eye_level'|'low_angle'|'high_angle'|'overhead'} defaultAngle
 * @property {'centered'|'rule_of_thirds'|'off_center'} defaultComposition
 * @property {'neutral'|'confident'|'contemplative'|'playful'} defaultExpression
 * @property {'static'|'dynamic'|'candid'} defaultPoseType
 * @property {string} defaultPoseNotes
 */

export const DEFAULT_FRAME_PARAMS_OPTIONS = {
  defaultFraming: ['close_up', 'medium', 'full_body', 'wide'],
  defaultAngle: ['eye_level', 'low_angle', 'high_angle', 'overhead'],
  defaultComposition: ['centered', 'rule_of_thirds', 'off_center'],
  defaultExpression: ['neutral', 'confident', 'contemplative', 'playful'],
  defaultPoseType: ['static', 'dynamic', 'candid']
};

export const DEFAULT_FRAME_PARAMS = {
  defaultFraming: 'medium',
  defaultAngle: 'eye_level',
  defaultComposition: 'rule_of_thirds',
  defaultExpression: 'neutral',
  defaultPoseType: 'static',
  defaultPoseNotes: ''
};

// ═══════════════════════════════════════════════════════════════
// STYLE VARIANTS (sub-entities within Universe)
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} StyleVariant
 * @property {string} id
 * @property {string} label
 * @property {string} description
 * @property {string} effects - Effect keywords (e.g. "B&W, high grain")
 */

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function generateUniverseId() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `UNIV_${datePart}_${randomPart}`;
}

export function createEmptyUniverse(label = 'Новая вселенная') {
  const now = new Date().toISOString();
  return {
    id: generateUniverseId(),
    label,
    shortDescription: '',
    
    // NEW: Artistic Vision (MOST IMPORTANT for capturing mood/atmosphere)
    artisticVision: {
      artDirection: 'editorial',           // conceptual | theatrical | documentary | commercial | avant_garde | surrealist | minimalist | maximalist
      narrativeType: 'mood_driven',        // story_driven | mood_driven | product_focused | character_study | abstract
      emotionalTone: 'intimate',           // intimate | dramatic | playful | melancholic | mysterious | aggressive | dreamy | unsettling
      worldBuilding: 'heightened_reality', // fantasy | heightened_reality | raw_reality | surreal | theatrical_set | found_location
      distinctiveElements: [],             // Array of unique characteristics
      atmosphericDensity: 'layered',       // sparse | layered | dense | overwhelming
      humanPresence: 'integrated'          // dominant | integrated | secondary | absent
    },
    
    // All technical blocks with defaults
    capture: { ...DEFAULT_CAPTURE },
    light: { ...DEFAULT_LIGHT },
    color: { ...DEFAULT_COLOR },
    texture: { ...DEFAULT_TEXTURE },
    optical: { ...DEFAULT_OPTICAL },
    composition: { ...DEFAULT_COMPOSITION },
    postProcess: { ...DEFAULT_POST_PROCESS },
    era: { ...DEFAULT_ERA },
    
    // NEW: Artistic style blocks
    cameraSignature: { ...DEFAULT_CAMERA_SIGNATURE },
    captureStyle: { ...DEFAULT_CAPTURE_STYLE },
    skinTexture: { ...DEFAULT_SKIN_TEXTURE },
    
    // Detailed text blocks for rich prompts (expanded)
    textBlocks: {
      visionBlock: '',       // Художественная концепция и мир
      atmosphereBlock: '',   // Атмосфера и ощущения
      techBlock: '',         // Техника съёмки
      colorBlock: '',        // Цветовая палитра
      lensBlock: '',         // Оптика
      moodBlock: '',         // Настроение и энергия
      eraBlock: '',          // Эпоха и контекст
      environmentBlock: ''   // Фоны и декорации
    },
    
    // Anti-AI markers
    antiAi: {
      level: 'medium',
      settings: {
        allowExposureErrors: true,
        allowMixedWhiteBalance: true,
        requireMicroDefects: true,
        candidComposition: true,
        allowImperfectFocus: false,
        allowFlaresReflections: true,
        preferMicroMotion: true,
        filmScanTexture: true
      },
      customRules: [],
      forbiddenPhrases: ['perfect skin', 'flawless', 'HDR', 'glossy', 'plastic']
    },
    
    // Default frame params (fallback when no frame selected)
    defaultFrameParams: { ...DEFAULT_FRAME_PARAMS },
    
    // Sub-entities
    locations: [],
    styleVariants: [],
    
    // Timestamps
    createdAt: now,
    updatedAt: now
  };
}

export function validateUniverse(universe) {
  const errors = [];

  if (!universe || typeof universe !== 'object') {
    errors.push('Universe must be an object');
    return { valid: false, errors };
  }

  if (!universe.id || typeof universe.id !== 'string') {
    errors.push('Universe must have a string id');
  }

  if (!universe.label || typeof universe.label !== 'string') {
    errors.push('Universe must have a string label');
  }

  // Validate capture block
  if (universe.capture) {
    const c = universe.capture;
    if (c.mediumType && !CAPTURE_MEDIUM_OPTIONS.mediumType.includes(c.mediumType)) {
      errors.push(`Invalid capture.mediumType: ${c.mediumType}`);
    }
  }

  // Validate light block
  if (universe.light) {
    const l = universe.light;
    if (l.primaryLightType && !LIGHT_PHYSICS_OPTIONS.primaryLightType.includes(l.primaryLightType)) {
      errors.push(`Invalid light.primaryLightType: ${l.primaryLightType}`);
    }
    if (l.exposureBias !== undefined) {
      const ev = parseFloat(l.exposureBias);
      if (isNaN(ev) || ev < -2 || ev > 2) {
        errors.push(`Invalid light.exposureBias: must be between -2 and +2 EV`);
      }
    }
  }

  // Validate color block
  if (universe.color) {
    const cl = universe.color;
    if (cl.baseColorCast && !COLOR_SCIENCE_OPTIONS.baseColorCast.includes(cl.baseColorCast)) {
      errors.push(`Invalid color.baseColorCast: ${cl.baseColorCast}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Merge partial universe updates with existing universe
 */
export function mergeUniverseUpdates(existing, updates) {
  const merged = { ...existing };
  
  // Deep merge each block
  const blocks = ['artisticVision', 'capture', 'light', 'color', 'texture', 'optical', 'composition', 'postProcess', 'era', 'cameraSignature', 'captureStyle', 'skinTexture', 'defaultFrameParams', 'textBlocks', 'antiAi'];
  for (const block of blocks) {
    if (updates[block] && typeof updates[block] === 'object') {
      merged[block] = { ...(existing[block] || {}), ...updates[block] };
    }
  }
  
  // Simple overwrites
  if (updates.label !== undefined) merged.label = updates.label;
  if (updates.shortDescription !== undefined) merged.shortDescription = updates.shortDescription;
  if (Array.isArray(updates.locations)) merged.locations = updates.locations;
  if (Array.isArray(updates.styleVariants)) merged.styleVariants = updates.styleVariants;
  
  merged.updatedAt = new Date().toISOString();
  
  return merged;
}

/**
 * Build a prompt-friendly text from universe parameters
 */
export function universeToPromptBlock(universe) {
  if (!universe) return '';
  
  const lines = [];
  
  // CAPTURE / MEDIUM
  if (universe.capture) {
    const c = universe.capture;
    const parts = [];
    if (c.mediumType) parts.push(`${c.mediumType} photography`);
    if (c.cameraSystem) parts.push(`shot on ${c.cameraSystem}`);
    if (c.grainStructure && c.grainStructure !== 'none') parts.push(`${c.grainStructure} grain`);
    if (c.scanArtifacts && c.scanArtifacts.length && !c.scanArtifacts.includes('none')) {
      parts.push(`scan artifacts: ${c.scanArtifacts.join(', ')}`);
    }
    if (parts.length) lines.push(`CAPTURE: ${parts.join('; ')}.`);
  }
  
  // LIGHT PHYSICS
  if (universe.light) {
    const l = universe.light;
    const parts = [];
    if (l.primaryLightType) parts.push(l.primaryLightType.replace(/_/g, ' '));
    if (l.flashCharacter) parts.push(`${l.flashCharacter} flash`);
    if (l.shadowBehavior) parts.push(`${l.shadowBehavior.replace(/_/g, ' ')} shadows`);
    if (l.lightImperfections && l.lightImperfections.length && !l.lightImperfections.includes('none')) {
      parts.push(`imperfections: ${l.lightImperfections.join(', ').replace(/_/g, ' ')}`);
    }
    if (parts.length) lines.push(`LIGHT: ${parts.join('; ')}.`);
  }
  
  // COLOR SCIENCE
  if (universe.color) {
    const cl = universe.color;
    const parts = [];
    if (cl.baseColorCast) parts.push(`${cl.baseColorCast.replace(/_/g, ' ')} cast`);
    if (cl.dominantPalette) parts.push(`${cl.dominantPalette.replace(/_/g, ' ')} palette`);
    if (cl.accentColors && cl.accentColors.length) parts.push(`accents: ${cl.accentColors.join(', ')}`);
    if (cl.skinToneRendering) parts.push(`skin: ${cl.skinToneRendering.replace(/_/g, ' ')}`);
    if (parts.length) lines.push(`COLOR: ${parts.join('; ')}.`);
  }
  
  // TEXTURE
  if (universe.texture) {
    const t = universe.texture;
    const parts = [];
    if (t.surfaceResponse) parts.push(`${t.surfaceResponse} surfaces`);
    if (t.materialTruthVisible) parts.push('real fabric texture visible');
    if (t.skinTextureVisible) parts.push('skin pores and texture visible');
    if (parts.length) lines.push(`TEXTURE: ${parts.join('; ')}.`);
  }
  
  // OPTICAL
  if (universe.optical) {
    const o = universe.optical;
    const parts = [];
    if (o.focusAccuracy && o.focusAccuracy !== 'perfect') parts.push(`${o.focusAccuracy.replace(/_/g, ' ')} focus`);
    if (o.vignetting && o.vignetting !== 'none') parts.push(`${o.vignetting} vignette`);
    if (o.halation && o.halation !== 'none') parts.push(`${o.halation} halation`);
    if (o.chromaticAberration && o.chromaticAberration !== 'none') parts.push(`${o.chromaticAberration} chromatic aberration`);
    if (parts.length) lines.push(`OPTICAL: ${parts.join('; ')}.`);
  }
  
  // COMPOSITION
  if (universe.composition) {
    const comp = universe.composition;
    const parts = [];
    if (comp.editorialBias) parts.push(`${comp.editorialBias.replace(/_/g, ' ')} feel`);
    if (comp.horizonBehavior && comp.horizonBehavior !== 'level') parts.push(`horizon ${comp.horizonBehavior.replace(/_/g, ' ')}`);
    if (parts.length) lines.push(`COMPOSITION: ${parts.join('; ')}.`);
  }
  
  // POST-PROCESS
  if (universe.postProcess) {
    const pp = universe.postProcess;
    const parts = [];
    if (pp.retouchingLevel) parts.push(`${pp.retouchingLevel.replace(/_/g, ' ')} retouching`);
    if (pp.skinSmoothing === false) parts.push('NO skin smoothing');
    if (pp.hdrForbidden) parts.push('NO HDR');
    if (pp.aiArtifactsPrevention) parts.push('NO plastic skin, NO CGI clarity');
    if (parts.length) lines.push(`POST-PROCESS: ${parts.join('; ')}.`);
  }
  
  // ERA
  if (universe.era) {
    const e = universe.era;
    const parts = [];
    if (e.eraReference) parts.push(e.eraReference.replace(/_/g, ' '));
    if (e.editorialReference) parts.push(`${e.editorialReference.replace(/_/g, ' ')} editorial`);
    if (e.printBehavior) parts.push(e.printBehavior.replace(/_/g, ' '));
    if (parts.length) lines.push(`ERA: ${parts.join('; ')}.`);
  }
  
  return lines.join('\n');
}

// Export all options for UI dropdowns
export const UNIVERSE_OPTIONS = {
  capture: CAPTURE_MEDIUM_OPTIONS,
  light: LIGHT_PHYSICS_OPTIONS,
  color: COLOR_SCIENCE_OPTIONS,
  texture: TEXTURE_OPTIONS,
  optical: OPTICAL_OPTIONS,
  composition: COMPOSITION_OPTIONS,
  postProcess: POST_PROCESS_OPTIONS,
  era: ERA_OPTIONS,
  cameraSignature: CAMERA_SIGNATURE_PRESETS,
  captureStyle: CAPTURE_STYLE_PRESETS,
  skinTexture: SKIN_TEXTURE_PRESETS,
  defaultFrameParams: DEFAULT_FRAME_PARAMS_OPTIONS
};
