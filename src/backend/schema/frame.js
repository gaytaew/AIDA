/**
 * Frame Schema
 * 
 * A frame represents a shot preset in the catalog.
 * It includes description, sketch reference, and metadata.
 */

/**
 * @typedef {Object} Frame
 * @property {string} id - Unique identifier
 * @property {string} label - Human-readable name
 * @property {string} description - Detailed shot description
 * @property {string} category - Primary category (fashion, catalog, etc.)
 * @property {Array<string>} categories - All categories
 * @property {Array<string>} tags - Tags for filtering
 * @property {AssetRef|null} sketchAsset - Sketch/reference image
 * @property {AssetRef|null} poseRefAsset - Pose reference image
 * @property {string} sketchPrompt - Prompt used to generate sketch
 * @property {ImageConfig|null} imageConfig - Default image config for this frame
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

/**
 * @typedef {Object} AssetRef
 * @property {string} assetId - Asset identifier
 * @property {string} previewUrl - Preview URL
 */

/**
 * @typedef {Object} ImageConfig
 * @property {'3:4'|'1:1'|'4:3'|'9:16'|'16:9'} aspectRatio
 * @property {'1K'|'2K'|'4K'} imageSize
 */

export const DEFAULT_CATEGORIES = ['fashion', 'catalog', 'sport', 'lingerie'];

export const DEFAULT_TAGS = [
  'full-body', '3/4', 'close-up', 'wide',
  'profile', 'front', 'back',
  'walking', 'static', 'dynamic',
  'studio', 'street', 'location',
  'flash', 'natural-light',
  'low-angle', 'high-angle', 'eye-level'
];

export function generateFrameId(category = 'frame') {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  const catCode = String(category || 'frame').toUpperCase().slice(0, 8);
  return `FR_${catCode}_${datePart}_${randomPart}`;
}

export function createEmptyFrame(label = 'Новый кадр', category = 'fashion') {
  const now = new Date().toISOString();
  return {
    id: generateFrameId(category),
    label,
    description: '',
    category,
    categories: [category],
    tags: [],
    sketchAsset: null,
    poseRefAsset: null,
    sketchPrompt: '',
    imageConfig: null,
    createdAt: now,
    updatedAt: now
  };
}

export function validateFrame(frame) {
  const errors = [];

  if (!frame || typeof frame !== 'object') {
    errors.push('Frame must be an object');
    return { valid: false, errors };
  }

  if (!frame.id || typeof frame.id !== 'string') {
    errors.push('Frame must have a string id');
  }

  if (!frame.label || typeof frame.label !== 'string') {
    errors.push('Frame must have a string label');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

