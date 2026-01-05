/**
 * Shoot Config Schema
 * 
 * This is the main schema for a complete shoot configuration.
 * It combines all other entities (universe, models, frames, clothing)
 * into a single JSON that can be saved, loaded, and used for generation.
 */

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} GlobalSettings
 * @property {ConsistencyRules} consistency - Consistency rules (CRITICAL)
 * @property {ImageConfig} imageConfig - Image generation settings
 * @property {OutfitAvatarMode} outfitAvatarMode - Outfit avatar mode settings
 */

/**
 * 9. CONSISTENCY RULES (КРИТИЧЕСКИ ВАЖНО)
 * Rules that cannot be violated across the entire shoot.
 * 
 * @typedef {Object} ConsistencyRules
 * @property {boolean} sameModelIdentity - Model appearance stays the same
 * @property {boolean} sameColorLogic - Color science stays consistent
 * @property {boolean} sameLightPhysics - Light physics stays consistent
 * @property {boolean} noStyleDrift - No gradual style changes
 * @property {boolean} noCinematicBeautification - No movie-like beautification
 */

/**
 * @typedef {Object} ImageConfig
 * @property {'3:4'|'1:1'|'4:3'|'9:16'|'16:9'} aspectRatio
 * @property {'1K'|'2K'|'4K'} imageSize
 */

/**
 * @typedef {Object} OutfitAvatarMode
 * @property {boolean} enabled - Auto-enabled for 2+ models with clothing
 * @property {boolean} required - Block generation until approved
 */

/**
 * @typedef {Object} ShootModel
 * @property {string} modelId - Reference to model in store
 * @property {Array<AssetRef>} refs - Identity reference images
 */

/**
 * @typedef {Object} ShootClothing
 * @property {number} forModelIndex - 0-based index of model
 * @property {Array<AssetRef>} refs - Clothing reference images
 */

/**
 * @typedef {Object} OutfitAvatar
 * @property {number} forModelIndex - 0-based index of model
 * @property {'empty'|'pending'|'ok'|'error'|'approved'} status
 * @property {string|null} imageUrl - Generated avatar image
 * @property {string|null} upscaledUrl - Upscaled version
 * @property {string|null} prompt - Debug: prompt used for generation
 * @property {string|null} approvedAt - ISO timestamp
 */

/**
 * Frame-level overrides from COMPOSITIONAL FEEL
 * These can vary per frame (unlike universe-level defaults)
 * 
 * @typedef {Object} FrameComposition
 * @property {'tight'|'cropped'|'off_center'|'centered'} framingBias
 * @property {'close'|'intimate'|'medium'|'wide'|'compressed'} cameraDistanceBias
 * @property {'present'|'minimal'|'generous'} negativeSpace
 */

/**
 * @typedef {Object} ShootFrame
 * @property {string} frameId - Reference to frame in catalog
 * @property {number} order - Display order (1-based)
 * @property {string} extraPrompt - Additional instructions for this frame
 * @property {StyleVariant|null} styleVariant - Optional style override from universe
 * @property {FrameComposition|null} composition - Frame-specific composition
 * @property {Partial<LightPhysics>|null} lightOverride - Frame-specific light override
 * @property {string} effectsNotes - Visual effects notes
 * @property {string} emotionNotes - Model emotion notes
 * @property {string} poseOverride - Pose override
 * @property {Array<AssetRef>} refsOverride - Additional refs for this frame only
 */

/**
 * @typedef {Object} StyleVariant
 * @property {string} id
 * @property {string} label
 */

/**
 * @typedef {Object} AssetRef
 * @property {string} assetId - Unique asset identifier
 * @property {string} url - URL or data URL
 * @property {string} [note] - Optional note/instruction
 */

/**
 * @typedef {Object} ShootConfig
 * @property {string} id - Unique shoot identifier
 * @property {string} label - Human-readable name
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 * @property {GlobalSettings} globalSettings
 * @property {Object|null} universe - Universe object or null
 * @property {Array<ShootModel>} models - Selected models (1-3)
 * @property {Array<ShootClothing>} clothing - Clothing refs per model
 * @property {Array<OutfitAvatar>} outfitAvatars - Generated outfit avatars
 * @property {Array<ShootFrame>} frames - Selected frames with overrides
 */

// ═══════════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════════

/**
 * 9. CONSISTENCY RULES — Default values
 * All rules are enforced by default.
 */
export const DEFAULT_CONSISTENCY_RULES = {
  sameModelIdentity: true,
  sameColorLogic: true,
  sameLightPhysics: true,
  noStyleDrift: true,
  noCinematicBeautification: true
};

export const DEFAULT_IMAGE_CONFIG = {
  aspectRatio: '3:4',
  imageSize: '2K'
};

export const DEFAULT_OUTFIT_AVATAR_MODE = {
  enabled: false,
  required: false
};

export const DEFAULT_GLOBAL_SETTINGS = {
  consistency: { ...DEFAULT_CONSISTENCY_RULES },
  imageConfig: { ...DEFAULT_IMAGE_CONFIG },
  outfitAvatarMode: { ...DEFAULT_OUTFIT_AVATAR_MODE }
};

/**
 * Frame composition options (for UI dropdowns)
 */
export const FRAME_COMPOSITION_OPTIONS = {
  framingBias: ['tight', 'cropped', 'off_center', 'centered'],
  cameraDistanceBias: ['close', 'intimate', 'medium', 'wide', 'compressed'],
  negativeSpace: ['present', 'minimal', 'generous']
};

export const DEFAULT_FRAME_COMPOSITION = {
  framingBias: 'off_center',
  cameraDistanceBias: 'medium',
  negativeSpace: 'present'
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function generateShootId() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SHOOT_${datePart}_${randomPart}`;
}

export function createEmptyShootConfig(label = 'Новая съёмка') {
  const now = new Date().toISOString();
  return {
    id: generateShootId(),
    label,
    createdAt: now,
    updatedAt: now,
    globalSettings: { ...DEFAULT_GLOBAL_SETTINGS },
    universe: null,
    models: [],
    clothing: [],
    outfitAvatars: [],
    frames: []
  };
}

export function createEmptyShootFrame(frameId, order = 1) {
  return {
    frameId,
    order,
    extraPrompt: '',
    styleVariant: null,
    composition: null, // Uses universe defaults if null
    lightOverride: null, // Uses universe defaults if null
    effectsNotes: '',
    emotionNotes: '',
    poseOverride: '',
    refsOverride: []
  };
}

export function validateShootConfig(config) {
  const errors = [];
  
  if (!config || typeof config !== 'object') {
    errors.push('Config must be an object');
    return { valid: false, errors };
  }

  if (!config.id || typeof config.id !== 'string') {
    errors.push('Config must have a string id');
  }

  if (!config.label || typeof config.label !== 'string') {
    errors.push('Config must have a string label');
  }

  if (!config.globalSettings || typeof config.globalSettings !== 'object') {
    errors.push('Config must have globalSettings object');
  }

  if (!Array.isArray(config.frames)) {
    errors.push('Config must have frames array');
  }

  // Validate consistency rules if present
  if (config.globalSettings && config.globalSettings.consistency) {
    const c = config.globalSettings.consistency;
    const boolFields = ['sameModelIdentity', 'sameColorLogic', 'sameLightPhysics', 'noStyleDrift', 'noCinematicBeautification'];
    for (const field of boolFields) {
      if (c[field] !== undefined && typeof c[field] !== 'boolean') {
        errors.push(`consistency.${field} must be a boolean`);
      }
    }
  }

  // Validate frames
  if (Array.isArray(config.frames)) {
    config.frames.forEach((frame, idx) => {
      if (!frame.frameId || typeof frame.frameId !== 'string') {
        errors.push(`Frame ${idx} must have a string frameId`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function shouldRequireOutfitAvatar(config) {
  // Outfit avatar is required when:
  // 1. There are 2+ models
  // 2. At least one model has clothing refs
  const modelCount = Array.isArray(config.models) ? config.models.length : 0;
  const hasClothing = Array.isArray(config.clothing) && 
    config.clothing.some(c => Array.isArray(c.refs) && c.refs.length > 0);
  
  return modelCount >= 2 && hasClothing;
}

/**
 * Build consistency rules block for prompt
 */
export function consistencyRulesToPromptBlock(consistency) {
  if (!consistency) return '';
  
  const lines = ['CONSISTENCY RULES (STRICTLY ENFORCED):'];
  
  if (consistency.sameModelIdentity) {
    lines.push('- Same model identity across all frames');
  }
  if (consistency.sameColorLogic) {
    lines.push('- Same color science across all frames');
  }
  if (consistency.sameLightPhysics) {
    lines.push('- Same light physics across all frames');
  }
  if (consistency.noStyleDrift) {
    lines.push('- NO style drift between frames');
  }
  if (consistency.noCinematicBeautification) {
    lines.push('- NO cinematic beautification, NO movie-like look');
  }
  
  return lines.join('\n');
}

/**
 * Merge frame with universe defaults and overrides
 */
export function resolveFrameComposition(frame, universeComposition) {
  const universeDefaults = universeComposition || {};
  const frameOverride = frame?.composition || {};
  
  return {
    framingBias: frameOverride.framingBias || 'off_center',
    cameraDistanceBias: frameOverride.cameraDistanceBias || 'medium',
    negativeSpace: frameOverride.negativeSpace || universeDefaults.negativeSpaceDefault || 'present'
  };
}
