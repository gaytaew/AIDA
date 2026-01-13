/**
 * VirtualCamera Schema
 * 
 * Professional camera simulation for the Virtual Studio.
 * Translates physical camera settings into AI-optimized prompt keywords.
 * 
 * Three core parameters:
 * 1. Focal Length - Field of view and perspective distortion
 * 2. Aperture - Depth of field control
 * 3. Shutter Speed - Motion capture behavior
 */

// ═══════════════════════════════════════════════════════════════
// FOCAL LENGTH - Field of View & Perspective
// ═══════════════════════════════════════════════════════════════

export const FOCAL_LENGTH = {
  ULTRA_WIDE: {
    id: 'ULTRA_WIDE',
    label: 'Ultra Wide (14-24mm)',
    range: '14-24mm',
    description: 'Extreme wide angle for architecture and environmental shots',
    keywords: 'Distorted perspective, expansive field of view, deep focus, architectural scale, dramatic foreground, converging lines, immersive environmental context',
    prompt: `ULTRA-WIDE LENS (14-24mm equivalent):
- Extreme field of view capturing full environment
- Perspective distortion at edges (barrel distortion)
- Deep focus — everything from foreground to infinity is sharp
- Dramatic sense of space and scale
- Foreground elements appear larger, background recedes rapidly
- Ideal for: Architecture, landscapes, environmental portraits, dramatic storytelling`
  },
  
  STANDARD: {
    id: 'STANDARD',
    label: 'Standard (35-50mm)',
    range: '35-50mm',
    description: 'Natural perspective matching human vision',
    keywords: 'Natural perspective, human eye view, minimal distortion, documentary style, true-to-life proportions, balanced composition, journalistic authenticity',
    prompt: `STANDARD LENS (35-50mm equivalent):
- Natural field of view matching human vision
- Minimal perspective distortion — proportions appear true to life
- Documentary/journalistic quality
- Neither wide nor compressed — neutral rendering
- Balanced relationship between subject and environment
- Ideal for: Street photography, documentary, candid moments, environmental portraits`
  },
  
  PORTRAIT: {
    id: 'PORTRAIT',
    label: 'Portrait (85-135mm)',
    range: '85-135mm',
    description: 'Flattering compression with background separation',
    keywords: 'Flattering compression, subject isolation, bokeh background, shallow depth of field, telephoto compression, intimate framing, background blur, subject prominence',
    prompt: `PORTRAIT LENS (85-135mm equivalent):
- Flattering facial compression — nose appears smaller relative to face
- Strong subject-background separation
- Beautiful bokeh (out-of-focus areas)
- Shallow depth of field even at moderate apertures
- Intimate framing that isolates the subject
- Background elements compress and blur pleasantly
- Ideal for: Portraits, headshots, beauty photography, fashion close-ups`
  }
};

// ═══════════════════════════════════════════════════════════════
// APERTURE - Depth of Field Control
// ═══════════════════════════════════════════════════════════════

export const APERTURE = {
  FAST: {
    id: 'FAST',
    label: 'Fast (f/1.2 - f/2.8)',
    range: 'f/1.2 - f/2.8',
    description: 'Wide open for maximum background blur',
    keywords: 'Dreamy bokeh, soft focus background, focus on eyes, razor-thin focus plane, creamy out-of-focus areas, light gathering, low-light capable',
    prompt: `FAST APERTURE (f/1.2 - f/2.8):
- Extremely shallow depth of field
- Razor-thin focus plane — only eyes/face in sharp focus
- Dreamy, creamy bokeh in background
- Strong subject isolation from environment
- Soft, ethereal quality to out-of-focus areas
- Point light sources become smooth circular or shaped bokeh balls
- Maximum light gathering for low-light situations`
  },
  
  CLOSED: {
    id: 'CLOSED',
    label: 'Closed (f/8 - f/16)',
    range: 'f/8 - f/16',
    description: 'Stopped down for maximum sharpness throughout',
    keywords: 'Edge-to-edge sharpness, deep depth of field, high detail, maximum clarity, environmental context visible, architectural precision, landscape sharpness',
    prompt: `CLOSED APERTURE (f/8 - f/16):
- Deep depth of field — everything in focus
- Edge-to-edge sharpness across the frame
- Maximum detail and clarity
- Environment and subject equally sharp
- Ideal for showing context and setting
- Sharp textures and fine details visible throughout
- Architectural and landscape precision`
  }
};

// ═══════════════════════════════════════════════════════════════
// SHUTTER SPEED - Motion Capture
// ═══════════════════════════════════════════════════════════════

export const SHUTTER_SPEED = {
  LONG_EXPOSURE: {
    id: 'LONG_EXPOSURE',
    label: 'Long Exposure',
    range: '1/30s - several seconds',
    description: 'Motion blur and light trails',
    keywords: 'Motion blur, light trails, ethereal movement, ghosting, intentional blur, flowing fabric, dynamic energy, time-stretched moments',
    prompt: `LONG EXPOSURE / SLOW SHUTTER:
- Intentional motion blur showing movement
- Light trails from moving light sources
- Ethereal, ghostly quality to moving elements
- Flowing fabric and hair capture movement energy
- Static elements remain sharp, moving elements blur
- Creates sense of time passing within single frame
- Artistic, dreamlike quality`
  },
  
  FAST_SHUTTER: {
    id: 'FAST_SHUTTER',
    label: 'Fast Shutter',
    range: '1/500s - 1/8000s',
    description: 'Freeze motion with perfect clarity',
    keywords: 'Frozen action, crisp details, high speed photography, split-second capture, no motion blur, peak action moment, athletic freeze',
    prompt: `FAST SHUTTER / HIGH SPEED:
- Frozen action — even fast movement appears completely still
- Crisp, sharp details on moving subjects
- Split-second moment captured with perfect clarity
- No motion blur whatsoever
- Peak action moments frozen in time
- Every hair and fabric fiber rendered sharply
- Athletic and dynamic moments captured precisely`
  }
};

// ═══════════════════════════════════════════════════════════════
// VIRTUAL CAMERA CLASS
// ═══════════════════════════════════════════════════════════════

/**
 * VirtualCamera configuration object
 * @typedef {Object} VirtualCameraConfig
 * @property {string} focalLength - ULTRA_WIDE | STANDARD | PORTRAIT
 * @property {string} aperture - FAST | CLOSED
 * @property {string} shutterSpeed - LONG_EXPOSURE | FAST_SHUTTER
 */

/**
 * Build prompt block from VirtualCamera settings
 * @param {VirtualCameraConfig} config 
 * @returns {string} Formatted prompt block
 */
export function buildVirtualCameraPrompt(config) {
  const blocks = [];
  
  blocks.push('=== VIRTUAL CAMERA SETTINGS ===');
  
  // Focal Length
  if (config.focalLength && FOCAL_LENGTH[config.focalLength]) {
    const fl = FOCAL_LENGTH[config.focalLength];
    blocks.push(`\n[FOCAL LENGTH: ${fl.label}]`);
    blocks.push(fl.prompt);
  }
  
  // Aperture
  if (config.aperture && APERTURE[config.aperture]) {
    const ap = APERTURE[config.aperture];
    blocks.push(`\n[APERTURE: ${ap.label}]`);
    blocks.push(ap.prompt);
  }
  
  // Shutter Speed
  if (config.shutterSpeed && SHUTTER_SPEED[config.shutterSpeed]) {
    const ss = SHUTTER_SPEED[config.shutterSpeed];
    blocks.push(`\n[SHUTTER SPEED: ${ss.label}]`);
    blocks.push(ss.prompt);
  }
  
  return blocks.join('\n');
}

/**
 * Get keywords only (for compact prompts)
 * @param {VirtualCameraConfig} config 
 * @returns {string} Comma-separated keywords
 */
export function getVirtualCameraKeywords(config) {
  const keywords = [];
  
  if (config.focalLength && FOCAL_LENGTH[config.focalLength]) {
    keywords.push(FOCAL_LENGTH[config.focalLength].keywords);
  }
  
  if (config.aperture && APERTURE[config.aperture]) {
    keywords.push(APERTURE[config.aperture].keywords);
  }
  
  if (config.shutterSpeed && SHUTTER_SPEED[config.shutterSpeed]) {
    keywords.push(SHUTTER_SPEED[config.shutterSpeed].keywords);
  }
  
  return keywords.join(', ');
}

/**
 * Validate VirtualCamera configuration
 * @param {VirtualCameraConfig} config 
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateVirtualCamera(config) {
  const errors = [];
  
  if (config.focalLength && !FOCAL_LENGTH[config.focalLength]) {
    errors.push(`Invalid focalLength: ${config.focalLength}. Valid: ${Object.keys(FOCAL_LENGTH).join(', ')}`);
  }
  
  if (config.aperture && !APERTURE[config.aperture]) {
    errors.push(`Invalid aperture: ${config.aperture}. Valid: ${Object.keys(APERTURE).join(', ')}`);
  }
  
  if (config.shutterSpeed && !SHUTTER_SPEED[config.shutterSpeed]) {
    errors.push(`Invalid shutterSpeed: ${config.shutterSpeed}. Valid: ${Object.keys(SHUTTER_SPEED).join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get all VirtualCamera options for UI
 * @returns {Object} All options grouped by parameter
 */
export function getVirtualCameraOptions() {
  return {
    focalLength: Object.values(FOCAL_LENGTH).map(f => ({
      id: f.id,
      label: f.label,
      range: f.range,
      description: f.description
    })),
    aperture: Object.values(APERTURE).map(a => ({
      id: a.id,
      label: a.label,
      range: a.range,
      description: a.description
    })),
    shutterSpeed: Object.values(SHUTTER_SPEED).map(s => ({
      id: s.id,
      label: s.label,
      range: s.range,
      description: s.description
    }))
  };
}

/**
 * Get default VirtualCamera configuration
 * @returns {VirtualCameraConfig}
 */
export function getDefaultVirtualCamera() {
  return {
    focalLength: 'PORTRAIT',
    aperture: 'FAST',
    shutterSpeed: 'FAST_SHUTTER'
  };
}


