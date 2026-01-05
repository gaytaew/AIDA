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
// 9. DEFAULT FRAME PARAMS (fallback when no frame is selected)
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
    
    // All blocks with defaults
    capture: { ...DEFAULT_CAPTURE },
    light: { ...DEFAULT_LIGHT },
    color: { ...DEFAULT_COLOR },
    texture: { ...DEFAULT_TEXTURE },
    optical: { ...DEFAULT_OPTICAL },
    composition: { ...DEFAULT_COMPOSITION },
    postProcess: { ...DEFAULT_POST_PROCESS },
    era: { ...DEFAULT_ERA },
    
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
  const blocks = ['capture', 'light', 'color', 'texture', 'optical', 'composition', 'postProcess', 'era', 'defaultFrameParams'];
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
  defaultFrameParams: DEFAULT_FRAME_PARAMS_OPTIONS
};
