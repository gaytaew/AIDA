/**
 * ReferenceHandler Schema
 * 
 * Manages reference images for the Virtual Studio.
 * Supports up to 14 reference images with explicit token syntax.
 * 
 * Key features:
 * 1. Token Syntax - [$1], [$2], etc. for explicit prompt referencing
 * 2. Semantic Slots - Subject ([$1]), Style ([$2]), then others
 * 3. File Validation - image/png, image/jpeg with size limits
 * 4. Auto-resize - Images > 7MB are compressed before encoding
 */

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const MAX_REFERENCES = 14;
export const MAX_IMAGE_SIZE_MB = 7;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const VALID_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

// ═══════════════════════════════════════════════════════════════
// REFERENCE SLOTS - Semantic Meaning
// ═══════════════════════════════════════════════════════════════

export const REFERENCE_SLOTS = {
  SUBJECT: {
    slot: 1,
    token: '[$1]',
    label: 'Subject Reference',
    description: 'Primary identity/face reference. Used with "Image of [$1]"',
    required: false,
    promptBinding: 'Image of [$1]'
  },
  
  STYLE: {
    slot: 2,
    token: '[$2]',
    label: 'Style Reference',
    description: 'Visual style/mood reference. Used with "in the visual style of [$2]"',
    required: false,
    promptBinding: 'in the visual style of [$2]'
  },
  
  CLOTHING_1: {
    slot: 3,
    token: '[$3]',
    label: 'Clothing Reference 1',
    description: 'Primary clothing/outfit reference',
    required: false,
    promptBinding: 'wearing the outfit from [$3]'
  },
  
  CLOTHING_2: {
    slot: 4,
    token: '[$4]',
    label: 'Clothing Reference 2',
    description: 'Secondary clothing item',
    required: false,
    promptBinding: 'with accessories from [$4]'
  },
  
  LOCATION: {
    slot: 5,
    token: '[$5]',
    label: 'Location Reference',
    description: 'Background/environment reference',
    required: false,
    promptBinding: 'in the location shown in [$5]'
  },
  
  POSE: {
    slot: 6,
    token: '[$6]',
    label: 'Pose Reference',
    description: 'Pose/body position sketch or reference',
    required: false,
    promptBinding: 'matching the pose from [$6]'
  },
  
  // Slots 7-14 are generic
  ADDITIONAL_7: { slot: 7, token: '[$7]', label: 'Additional Reference 7', required: false },
  ADDITIONAL_8: { slot: 8, token: '[$8]', label: 'Additional Reference 8', required: false },
  ADDITIONAL_9: { slot: 9, token: '[$9]', label: 'Additional Reference 9', required: false },
  ADDITIONAL_10: { slot: 10, token: '[$10]', label: 'Additional Reference 10', required: false },
  ADDITIONAL_11: { slot: 11, token: '[$11]', label: 'Additional Reference 11', required: false },
  ADDITIONAL_12: { slot: 12, token: '[$12]', label: 'Additional Reference 12', required: false },
  ADDITIONAL_13: { slot: 13, token: '[$13]', label: 'Additional Reference 13', required: false },
  ADDITIONAL_14: { slot: 14, token: '[$14]', label: 'Additional Reference 14', required: false }
};

// ═══════════════════════════════════════════════════════════════
// REFERENCE IMAGE TYPE
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} ReferenceImage
 * @property {number} slot - Slot number (1-14)
 * @property {string} token - Token string ([$1] - [$14])
 * @property {string} type - Semantic type (SUBJECT, STYLE, CLOTHING, etc.)
 * @property {string} mimeType - Image MIME type
 * @property {string} base64 - Base64 encoded image data
 * @property {string} [description] - Optional user description
 * @property {number} [originalSizeBytes] - Original file size
 * @property {boolean} [wasResized] - Whether image was resized
 */

/**
 * @typedef {Object} ReferenceCollection
 * @property {ReferenceImage[]} images - Array of reference images
 * @property {Object} slots - Map of slot numbers to images
 * @property {number} totalSize - Total size in bytes
 */

// ═══════════════════════════════════════════════════════════════
// REFERENCE HANDLER CLASS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new reference image object
 * @param {number} slot - Slot number (1-14)
 * @param {string} mimeType - Image MIME type
 * @param {string} base64 - Base64 encoded data
 * @param {string} [type] - Semantic type
 * @param {string} [description] - Optional description
 * @returns {ReferenceImage}
 */
export function createReference(slot, mimeType, base64, type = null, description = null) {
  if (slot < 1 || slot > MAX_REFERENCES) {
    throw new Error(`Invalid slot ${slot}. Must be 1-${MAX_REFERENCES}`);
  }
  
  // Determine type from slot if not provided
  let effectiveType = type;
  if (!effectiveType) {
    if (slot === 1) effectiveType = 'SUBJECT';
    else if (slot === 2) effectiveType = 'STYLE';
    else if (slot === 3 || slot === 4) effectiveType = 'CLOTHING';
    else if (slot === 5) effectiveType = 'LOCATION';
    else if (slot === 6) effectiveType = 'POSE';
    else effectiveType = 'ADDITIONAL';
  }
  
  return {
    slot,
    token: `[\$${slot}]`,
    type: effectiveType,
    mimeType,
    base64,
    description,
    originalSizeBytes: base64 ? Math.ceil(base64.length * 0.75) : 0,
    wasResized: false
  };
}

/**
 * Validate a reference image
 * @param {Object} ref - Reference to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateReference(ref) {
  const errors = [];
  
  if (!ref.slot || ref.slot < 1 || ref.slot > MAX_REFERENCES) {
    errors.push(`Invalid slot: ${ref.slot}. Must be 1-${MAX_REFERENCES}`);
  }
  
  if (!ref.mimeType || !VALID_MIME_TYPES.includes(ref.mimeType.toLowerCase())) {
    errors.push(`Invalid mimeType: ${ref.mimeType}. Must be one of: ${VALID_MIME_TYPES.join(', ')}`);
  }
  
  if (!ref.base64 || ref.base64.length === 0) {
    errors.push('Missing base64 data');
  }
  
  // Check size
  const sizeBytes = ref.base64 ? Math.ceil(ref.base64.length * 0.75) : 0;
  if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    errors.push(`Image too large: ${(sizeBytes / 1024 / 1024).toFixed(2)}MB. Max: ${MAX_IMAGE_SIZE_MB}MB`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a reference collection from array of images
 * @param {Array<{mimeType: string, base64: string, type?: string, description?: string}>} images 
 * @returns {ReferenceCollection}
 */
export function createReferenceCollection(images) {
  const collection = {
    images: [],
    slots: {},
    totalSize: 0
  };
  
  if (!Array.isArray(images)) {
    return collection;
  }
  
  // Limit to MAX_REFERENCES
  const limitedImages = images.slice(0, MAX_REFERENCES);
  
  limitedImages.forEach((img, index) => {
    const slot = index + 1;
    const ref = createReference(
      slot,
      img.mimeType,
      img.base64,
      img.type,
      img.description
    );
    
    collection.images.push(ref);
    collection.slots[slot] = ref;
    collection.totalSize += ref.originalSizeBytes;
  });
  
  return collection;
}

/**
 * Build prompt with reference tokens
 * This generates the reference instruction block for the prompt
 * @param {ReferenceCollection} collection 
 * @returns {string}
 */
export function buildReferencePrompt(collection) {
  if (!collection || collection.images.length === 0) {
    return '';
  }
  
  const blocks = [];
  
  blocks.push('=== REFERENCE IMAGES ===');
  blocks.push(`${collection.images.length} reference image(s) provided with the following assignments:\n`);
  
  // List all references with their tokens
  collection.images.forEach(ref => {
    const slotInfo = Object.values(REFERENCE_SLOTS).find(s => s.slot === ref.slot);
    const binding = slotInfo?.promptBinding || `reference ${ref.token}`;
    blocks.push(`${ref.token} = ${ref.type} Reference${ref.description ? ` (${ref.description})` : ''}`);
  });
  
  blocks.push('');
  
  // Add usage instructions
  if (collection.slots[1]) {
    blocks.push('SUBJECT IDENTITY: Use [$1] as the primary face/identity reference. The person in [$1] MUST appear in the generated image with exact facial features preserved.');
  }
  
  if (collection.slots[2]) {
    blocks.push('VISUAL STYLE: Apply the color grading, lighting, and mood from [$2] to the generated image.');
  }
  
  if (collection.slots[3] || collection.slots[4]) {
    const clothingRefs = [];
    if (collection.slots[3]) clothingRefs.push('[$3]');
    if (collection.slots[4]) clothingRefs.push('[$4]');
    blocks.push(`CLOTHING: Recreate the garments from ${clothingRefs.join(' and ')} with exact silhouette, color, and construction.`);
  }
  
  if (collection.slots[5]) {
    blocks.push('LOCATION: Use the environment/background from [$5] as the setting.');
  }
  
  if (collection.slots[6]) {
    blocks.push('POSE: Match the body position and gesture from [$6] as closely as the adherence level allows.');
  }
  
  return blocks.join('\n');
}

/**
 * Insert tokens into a user prompt
 * Replaces semantic placeholders with proper tokens
 * @param {string} prompt - User prompt with placeholders
 * @param {ReferenceCollection} collection 
 * @returns {string}
 */
export function insertTokensInPrompt(prompt, collection) {
  let result = prompt;
  
  // Replace semantic placeholders
  const replacements = {
    '[SUBJECT]': collection.slots[1] ? '[$1]' : '',
    '[STYLE]': collection.slots[2] ? '[$2]' : '',
    '[CLOTHING]': collection.slots[3] ? '[$3]' : '',
    '[LOCATION]': collection.slots[5] ? '[$5]' : '',
    '[POSE]': collection.slots[6] ? '[$6]' : ''
  };
  
  for (const [placeholder, token] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[[\]]/g, '\\$&'), 'gi'), token);
  }
  
  return result;
}

/**
 * Get reference images in order for API call
 * Returns images sorted by slot number
 * @param {ReferenceCollection} collection 
 * @returns {Array<{mimeType: string, base64: string}>}
 */
export function getImagesForApi(collection) {
  if (!collection || collection.images.length === 0) {
    return [];
  }
  
  // Sort by slot and return in API format
  return collection.images
    .sort((a, b) => a.slot - b.slot)
    .map(ref => ({
      mimeType: ref.mimeType,
      base64: ref.base64
    }));
}

/**
 * Validate entire collection
 * @param {ReferenceCollection} collection 
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
export function validateCollection(collection) {
  const errors = [];
  const warnings = [];
  
  if (!collection) {
    return { valid: true, errors: [], warnings: ['No references provided'] };
  }
  
  if (collection.images.length > MAX_REFERENCES) {
    errors.push(`Too many references: ${collection.images.length}. Max: ${MAX_REFERENCES}`);
  }
  
  // Validate each image
  collection.images.forEach(ref => {
    const refValidation = validateReference(ref);
    errors.push(...refValidation.errors.map(e => `[${ref.token}] ${e}`));
  });
  
  // Check for duplicate slots
  const slots = collection.images.map(r => r.slot);
  const uniqueSlots = new Set(slots);
  if (slots.length !== uniqueSlots.size) {
    errors.push('Duplicate slot assignments detected');
  }
  
  // Warnings for large total size
  const totalMB = collection.totalSize / (1024 * 1024);
  if (totalMB > 50) {
    warnings.push(`Large total reference size: ${totalMB.toFixed(1)}MB. Consider reducing image sizes.`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get slot options for UI
 * @returns {Array}
 */
export function getSlotOptions() {
  return Object.entries(REFERENCE_SLOTS).map(([key, slot]) => ({
    key,
    slot: slot.slot,
    token: slot.token,
    label: slot.label,
    description: slot.description,
    required: slot.required,
    promptBinding: slot.promptBinding
  }));
}

/**
 * Calculate if an image needs resizing
 * @param {number} sizeBytes 
 * @returns {boolean}
 */
export function needsResize(sizeBytes) {
  return sizeBytes > MAX_IMAGE_SIZE_BYTES;
}

/**
 * Estimate final size after base64 encoding
 * @param {number} originalBytes 
 * @returns {number} Estimated base64 string length
 */
export function estimateBase64Size(originalBytes) {
  return Math.ceil(originalBytes * 1.37); // Base64 is ~37% larger
}


