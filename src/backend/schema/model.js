/**
 * Model Schema
 * 
 * A model represents a person avatar with physical description,
 * identity references, and optional emotion/pose presets.
 */

/**
 * @typedef {Object} Model
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} label - Optional subtitle/description
 * @property {string} promptSnippet - Physical description for prompts
 * @property {number|null} heightCm - Height in centimeters
 * @property {string} bodyType - Body type description
 * @property {string} faceExpressions - Default face expressions
 * @property {string} poses - Default poses
 * @property {Array<AssetRef>} images - Identity reference images
 * @property {string} previewSrc - Main preview image URL
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

/**
 * @typedef {Object} AssetRef
 * @property {string} assetId - Asset identifier
 * @property {string} url - Image URL or data URL
 * @property {string} [note] - Optional note
 */

export function generateModelId() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8).toLowerCase();
  return `model_${datePart}_${randomPart}`;
}

export function createEmptyModel(name = 'Новая модель') {
  const now = new Date().toISOString();
  return {
    id: generateModelId(),
    name,
    label: '',
    promptSnippet: '',
    heightCm: null,
    bodyType: '',
    faceExpressions: '',
    poses: '',
    images: [],
    previewSrc: '',
    createdAt: now,
    updatedAt: now
  };
}

export function validateModel(model) {
  const errors = [];

  if (!model || typeof model !== 'object') {
    errors.push('Model must be an object');
    return { valid: false, errors };
  }

  if (!model.id || typeof model.id !== 'string') {
    errors.push('Model must have a string id');
  }

  if (!model.name || typeof model.name !== 'string') {
    errors.push('Model must have a string name');
  }

  // promptSnippet is important for generation
  if (!model.promptSnippet || typeof model.promptSnippet !== 'string') {
    errors.push('Model should have a promptSnippet describing physical appearance');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

