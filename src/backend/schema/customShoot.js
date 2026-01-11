/**
 * Custom Shoot Schema
 * 
 * Schema for shoots without a pre-defined universe.
 * All visual parameters are configured manually with Quick/Fine modes.
 * Reference Locks ensure visual consistency across frames.
 */

import { 
  DEFAULT_CAPTURE,
  DEFAULT_LIGHT,
  DEFAULT_COLOR,
  DEFAULT_TEXTURE,
  DEFAULT_OPTICAL,
  DEFAULT_COMPOSITION,
  DEFAULT_POST_PROCESS,
  DEFAULT_ERA,
  DEFAULT_CAMERA_SIGNATURE,
  DEFAULT_CAPTURE_STYLE,
  DEFAULT_SKIN_TEXTURE,
  CAMERA_SIGNATURE_PRESETS,
  CAPTURE_STYLE_PRESETS,
  SKIN_TEXTURE_PRESETS
} from './universe.js';

import {
  LIGHT_PRESETS,
  COLOR_PRESETS,
  ERA_PRESETS
} from './stylePresets.js';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {'off'|'strict'|'soft'} LockMode
 */

/**
 * @typedef {Object} ReferenceLock
 * @property {boolean} enabled - Whether lock is active
 * @property {LockMode|null} mode - Lock mode (strict/soft)
 * @property {string|null} sourceImageId - ID of the reference image
 * @property {string|null} sourceImageUrl - URL/dataURL of the reference image
 */

/**
 * @typedef {Object} Locks
 * @property {ReferenceLock} style - Style lock (color, light, texture)
 * @property {ReferenceLock} location - Location lock (background, environment)
 */

/**
 * @typedef {Object} QuickPresets
 * @property {string} camera - Camera signature preset ID
 * @property {string} capture - Capture style preset ID
 * @property {string} light - Light preset ID
 * @property {string} color - Color preset ID
 * @property {string} texture - Skin/texture preset ID
 * @property {string} era - Era preset ID
 */

/**
 * @typedef {Object} CustomUniverse
 * @property {QuickPresets} presets - Quick mode presets
 * @property {Object} capture - Capture/medium parameters (fine mode)
 * @property {Object} light - Light physics parameters (fine mode)
 * @property {Object} color - Color science parameters (fine mode)
 * @property {Object} texture - Texture parameters (fine mode)
 * @property {Object} optical - Optical parameters (fine mode)
 * @property {Object} composition - Composition parameters (fine mode)
 * @property {Object} postProcess - Post-process parameters (fine mode)
 * @property {Object} era - Era parameters (fine mode)
 * @property {Object} artisticVision - Artistic vision parameters
 * @property {Object} antiAi - Anti-AI settings
 */

/**
 * @typedef {Object} GeneratedImage
 * @property {string} id - Unique image ID
 * @property {string} imageUrl - Image URL or data URL
 * @property {string} createdAt - ISO timestamp
 * @property {Object} paramsSnapshot - Parameters used for generation
 * @property {Object|null} promptJson - JSON prompt (for debug)
 * @property {boolean} isStyleReference - Is this the style lock reference
 * @property {boolean} isLocationReference - Is this the location lock reference
 */

/**
 * @typedef {Object} CustomShoot
 * @property {string} id - Unique shoot ID
 * @property {string} label - Human-readable name
 * @property {'custom'} mode - Always 'custom' for this type
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 * @property {CustomUniverse} customUniverse - Manual universe config
 * @property {Locks} locks - Reference locks
 * @property {Array} models - Selected models
 * @property {Array} clothing - Clothing refs
 * @property {Object|null} location - Current location
 * @property {Object|null} currentFrame - Current frame/pose
 * @property {string|null} currentEmotion - Current emotion preset ID
 * @property {Object} globalSettings - Global settings
 * @property {Array<GeneratedImage>} generatedImages - History
 */

// ═══════════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_QUICK_PRESETS = {
  camera: 'contax_t2',
  capture: 'candid_aware',
  light: 'natural_soft',
  color: 'film_warm',
  texture: 'natural_film',
  era: 'contemporary'
};

export const DEFAULT_LOCKS = {
  style: {
    enabled: false,
    mode: null,
    sourceImageId: null,
    sourceImageUrl: null
  },
  location: {
    enabled: false,
    mode: null,
    sourceImageId: null,
    sourceImageUrl: null
  }
};

export const DEFAULT_ARTISTIC_VISION = {
  artDirection: 'editorial',
  emotionalTone: 'intimate',
  worldBuilding: 'heightened_reality',
  atmosphericDensity: 'layered'
};

export const DEFAULT_ANTI_AI = {
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
  }
};

export const DEFAULT_GLOBAL_SETTINGS = {
  imageConfig: {
    aspectRatio: '3:4',
    imageSize: '2K'
  },
  consistency: {
    sameModelIdentity: true,
    sameColorLogic: true,
    sameLightPhysics: true,
    noStyleDrift: true,
    noCinematicBeautification: true
  }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a unique Custom Shoot ID
 */
export function generateCustomShootId() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CSHOOT_${datePart}_${randomPart}`;
}

/**
 * Generate a unique generated image ID
 */
export function generateImageId() {
  const now = new Date();
  const timePart = now.toISOString().slice(11, 19).replace(/:/g, '');
  const randomPart = Math.random().toString(36).slice(2, 6);
  return `img_${timePart}_${randomPart}`;
}

/**
 * Create an empty Custom Shoot with defaults
 */
export function createEmptyCustomShoot(label = 'New Custom Shoot') {
  const now = new Date().toISOString();
  
  return {
    id: generateCustomShootId(),
    label,
    mode: 'custom',
    createdAt: now,
    updatedAt: now,
    
    customUniverse: {
      presets: { ...DEFAULT_QUICK_PRESETS },
      
      // Fine mode parameters (defaults)
      capture: { ...DEFAULT_CAPTURE },
      light: { ...DEFAULT_LIGHT },
      color: { ...DEFAULT_COLOR },
      texture: { ...DEFAULT_TEXTURE },
      optical: { ...DEFAULT_OPTICAL },
      composition: { ...DEFAULT_COMPOSITION },
      postProcess: { ...DEFAULT_POST_PROCESS },
      era: { ...DEFAULT_ERA },
      
      // Additional blocks
      cameraSignature: { ...DEFAULT_CAMERA_SIGNATURE },
      captureStyle: { ...DEFAULT_CAPTURE_STYLE },
      skinTexture: { ...DEFAULT_SKIN_TEXTURE },
      artisticVision: { ...DEFAULT_ARTISTIC_VISION },
      antiAi: { ...DEFAULT_ANTI_AI }
    },
    
    locks: { ...DEFAULT_LOCKS },
    
    models: [],
    clothing: [],
    location: null,
    currentFrame: null,
    currentEmotion: null,
    extraPrompt: '',
    
    globalSettings: { ...DEFAULT_GLOBAL_SETTINGS },
    
    generatedImages: []
  };
}

/**
 * Validate Custom Shoot structure
 */
export function validateCustomShoot(shoot) {
  const errors = [];
  
  if (!shoot || typeof shoot !== 'object') {
    errors.push('Shoot must be an object');
    return { valid: false, errors };
  }
  
  if (!shoot.id || typeof shoot.id !== 'string') {
    errors.push('Shoot must have a string id');
  }
  
  if (shoot.mode !== 'custom') {
    errors.push('Shoot mode must be "custom"');
  }
  
  if (!shoot.customUniverse || typeof shoot.customUniverse !== 'object') {
    errors.push('Shoot must have customUniverse object');
  }
  
  if (!shoot.locks || typeof shoot.locks !== 'object') {
    errors.push('Shoot must have locks object');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Set a style lock on a custom shoot
 */
export function setStyleLock(shoot, imageId, imageUrl, mode = 'strict') {
  // Clear previous style reference flags
  if (shoot.generatedImages) {
    shoot.generatedImages.forEach(img => {
      img.isStyleReference = false;
    });
  }
  
  // Set the new reference flag
  const refImage = shoot.generatedImages?.find(img => img.id === imageId);
  if (refImage) {
    refImage.isStyleReference = true;
  }
  
  // Update lock
  shoot.locks.style = {
    enabled: true,
    mode,
    sourceImageId: imageId,
    sourceImageUrl: imageUrl
  };
  
  shoot.updatedAt = new Date().toISOString();
  
  return shoot;
}

/**
 * Set a location lock on a custom shoot
 */
export function setLocationLock(shoot, imageId, imageUrl, mode = 'strict') {
  // Clear previous location reference flags
  if (shoot.generatedImages) {
    shoot.generatedImages.forEach(img => {
      img.isLocationReference = false;
    });
  }
  
  // Set the new reference flag
  const refImage = shoot.generatedImages?.find(img => img.id === imageId);
  if (refImage) {
    refImage.isLocationReference = true;
  }
  
  // Update lock
  shoot.locks.location = {
    enabled: true,
    mode,
    sourceImageId: imageId,
    sourceImageUrl: imageUrl
  };
  
  shoot.updatedAt = new Date().toISOString();
  
  return shoot;
}

/**
 * Clear style lock
 */
export function clearStyleLock(shoot) {
  // Clear reference flags
  if (shoot.generatedImages) {
    shoot.generatedImages.forEach(img => {
      img.isStyleReference = false;
    });
  }
  
  shoot.locks.style = {
    enabled: false,
    mode: null,
    sourceImageId: null,
    sourceImageUrl: null
  };
  
  shoot.updatedAt = new Date().toISOString();
  
  return shoot;
}

/**
 * Clear location lock
 */
export function clearLocationLock(shoot) {
  // Clear reference flags
  if (shoot.generatedImages) {
    shoot.generatedImages.forEach(img => {
      img.isLocationReference = false;
    });
  }
  
  shoot.locks.location = {
    enabled: false,
    mode: null,
    sourceImageId: null,
    sourceImageUrl: null
  };
  
  shoot.updatedAt = new Date().toISOString();
  
  return shoot;
}

/**
 * Add a generated image to the shoot history
 */
export function addGeneratedImage(shoot, imageData) {
  const image = {
    id: generateImageId(),
    imageUrl: imageData.imageUrl,
    createdAt: new Date().toISOString(),
    paramsSnapshot: imageData.paramsSnapshot || {},
    promptJson: imageData.promptJson || null,
    isStyleReference: false,
    isLocationReference: false
  };
  
  shoot.generatedImages.push(image);
  shoot.updatedAt = new Date().toISOString();
  
  return image;
}

/**
 * Remove a generated image from history
 */
export function removeGeneratedImage(shoot, imageId) {
  const index = shoot.generatedImages.findIndex(img => img.id === imageId);
  if (index === -1) return false;
  
  const image = shoot.generatedImages[index];
  
  // If it was a reference, clear the lock
  if (image.isStyleReference) {
    clearStyleLock(shoot);
  }
  if (image.isLocationReference) {
    clearLocationLock(shoot);
  }
  
  shoot.generatedImages.splice(index, 1);
  shoot.updatedAt = new Date().toISOString();
  
  return true;
}

/**
 * Get all available presets for UI
 */
export function getAllPresets() {
  return {
    camera: CAMERA_SIGNATURE_PRESETS,
    capture: CAPTURE_STYLE_PRESETS,
    light: LIGHT_PRESETS,
    color: COLOR_PRESETS,
    texture: SKIN_TEXTURE_PRESETS,
    era: ERA_PRESETS
  };
}

