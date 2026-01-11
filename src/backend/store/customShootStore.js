/**
 * Custom Shoot Store
 * 
 * File-based storage for Custom Shoots.
 * Each shoot is stored as a separate JSON file.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store directory
const STORE_DIR = path.join(__dirname, 'custom-shoots');

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Ensure store directory exists
 */
async function ensureStoreDir() {
  try {
    await fs.access(STORE_DIR);
  } catch {
    await fs.mkdir(STORE_DIR, { recursive: true });
    console.log('[CustomShootStore] Created store directory:', STORE_DIR);
  }
}

// Initialize on module load
ensureStoreDir().catch(console.error);

// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get all custom shoots (list with basic info)
 */
export async function getAllCustomShoots() {
  await ensureStoreDir();
  
  try {
    const files = await fs.readdir(STORE_DIR);
    const shoots = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const filePath = path.join(STORE_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const shoot = JSON.parse(content);
        
        // Return basic info for list
        shoots.push({
          id: shoot.id,
          label: shoot.label,
          mode: shoot.mode,
          createdAt: shoot.createdAt,
          updatedAt: shoot.updatedAt,
          imageCount: shoot.generatedImages?.length || 0,
          hasStyleLock: shoot.locks?.style?.enabled || false,
          hasLocationLock: shoot.locks?.location?.enabled || false,
          // Preview from first generated image
          previewUrl: shoot.generatedImages?.[0]?.imageUrl || null
        });
      } catch (err) {
        console.error(`[CustomShootStore] Error reading ${file}:`, err.message);
      }
    }
    
    // Sort by updatedAt descending (newest first)
    shoots.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    return shoots;
  } catch (err) {
    console.error('[CustomShootStore] Error reading store:', err);
    return [];
  }
}

/**
 * Get a custom shoot by ID
 */
export async function getCustomShootById(id) {
  await ensureStoreDir();
  
  const filePath = path.join(STORE_DIR, `${id}.json`);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null; // Not found
    }
    throw err;
  }
}

/**
 * Save a custom shoot (create or update)
 */
export async function saveCustomShoot(shoot) {
  await ensureStoreDir();
  
  if (!shoot.id) {
    throw new Error('Shoot must have an id');
  }
  
  // Update timestamp
  shoot.updatedAt = new Date().toISOString();
  
  const filePath = path.join(STORE_DIR, `${shoot.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(shoot, null, 2), 'utf-8');
  
  console.log(`[CustomShootStore] Saved shoot: ${shoot.id}`);
  return shoot;
}

/**
 * Delete a custom shoot
 */
export async function deleteCustomShoot(id) {
  await ensureStoreDir();
  
  const filePath = path.join(STORE_DIR, `${id}.json`);
  
  try {
    await fs.unlink(filePath);
    console.log(`[CustomShootStore] Deleted shoot: ${id}`);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false; // Already doesn't exist
    }
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════
// SPECIALIZED OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Add a generated image to a shoot
 */
export async function addImageToShoot(shootId, imageData) {
  const shoot = await getCustomShootById(shootId);
  if (!shoot) {
    throw new Error(`Shoot not found: ${shootId}`);
  }
  
  // Ensure array exists
  if (!Array.isArray(shoot.generatedImages)) {
    shoot.generatedImages = [];
  }
  
  // Add image
  const image = {
    id: imageData.id || `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    imageUrl: imageData.imageUrl,
    createdAt: new Date().toISOString(),
    paramsSnapshot: imageData.paramsSnapshot || {},
    promptJson: imageData.promptJson || null,
    isStyleReference: false,
    isLocationReference: false
  };
  
  shoot.generatedImages.push(image);
  
  await saveCustomShoot(shoot);
  
  return image;
}

/**
 * Remove an image from a shoot
 */
export async function removeImageFromShoot(shootId, imageId) {
  const shoot = await getCustomShootById(shootId);
  if (!shoot) {
    throw new Error(`Shoot not found: ${shootId}`);
  }
  
  const index = shoot.generatedImages?.findIndex(img => img.id === imageId);
  if (index === -1 || index === undefined) {
    return false;
  }
  
  const image = shoot.generatedImages[index];
  
  // Clear locks if this was the reference
  if (image.isStyleReference) {
    shoot.locks.style = {
      enabled: false,
      mode: null,
      sourceImageId: null,
      sourceImageUrl: null
    };
  }
  if (image.isLocationReference) {
    shoot.locks.location = {
      enabled: false,
      mode: null,
      sourceImageId: null,
      sourceImageUrl: null
    };
  }
  
  shoot.generatedImages.splice(index, 1);
  
  await saveCustomShoot(shoot);
  
  return true;
}

/**
 * Set style lock on a shoot
 */
export async function setStyleLockOnShoot(shootId, imageId, mode = 'strict') {
  const shoot = await getCustomShootById(shootId);
  if (!shoot) {
    throw new Error(`Shoot not found: ${shootId}`);
  }
  
  // Find the image
  const image = shoot.generatedImages?.find(img => img.id === imageId);
  if (!image) {
    throw new Error(`Image not found: ${imageId}`);
  }
  
  // Clear previous style reference flags
  shoot.generatedImages.forEach(img => {
    img.isStyleReference = false;
  });
  
  // Set new reference
  image.isStyleReference = true;
  
  shoot.locks.style = {
    enabled: true,
    mode,
    sourceImageId: imageId,
    sourceImageUrl: image.imageUrl
  };
  
  await saveCustomShoot(shoot);
  
  return shoot;
}

/**
 * Set location lock on a shoot
 */
export async function setLocationLockOnShoot(shootId, imageId, mode = 'strict') {
  const shoot = await getCustomShootById(shootId);
  if (!shoot) {
    throw new Error(`Shoot not found: ${shootId}`);
  }
  
  // Find the image
  const image = shoot.generatedImages?.find(img => img.id === imageId);
  if (!image) {
    throw new Error(`Image not found: ${imageId}`);
  }
  
  // Clear previous location reference flags
  shoot.generatedImages.forEach(img => {
    img.isLocationReference = false;
  });
  
  // Set new reference
  image.isLocationReference = true;
  
  shoot.locks.location = {
    enabled: true,
    mode,
    sourceImageId: imageId,
    sourceImageUrl: image.imageUrl
  };
  
  await saveCustomShoot(shoot);
  
  return shoot;
}

/**
 * Clear style lock
 */
export async function clearStyleLockOnShoot(shootId) {
  const shoot = await getCustomShootById(shootId);
  if (!shoot) {
    throw new Error(`Shoot not found: ${shootId}`);
  }
  
  // Clear flags
  shoot.generatedImages?.forEach(img => {
    img.isStyleReference = false;
  });
  
  shoot.locks.style = {
    enabled: false,
    mode: null,
    sourceImageId: null,
    sourceImageUrl: null
  };
  
  await saveCustomShoot(shoot);
  
  return shoot;
}

/**
 * Clear location lock
 */
export async function clearLocationLockOnShoot(shootId) {
  const shoot = await getCustomShootById(shootId);
  if (!shoot) {
    throw new Error(`Shoot not found: ${shootId}`);
  }
  
  // Clear flags
  shoot.generatedImages?.forEach(img => {
    img.isLocationReference = false;
  });
  
  shoot.locks.location = {
    enabled: false,
    mode: null,
    sourceImageId: null,
    sourceImageUrl: null
  };
  
  await saveCustomShoot(shoot);
  
  return shoot;
}

/**
 * Update shoot parameters (presets, universe settings)
 */
export async function updateShootParams(shootId, updates) {
  const shoot = await getCustomShootById(shootId);
  if (!shoot) {
    throw new Error(`Shoot not found: ${shootId}`);
  }
  
  // Update label
  if (updates.label !== undefined) {
    shoot.label = updates.label;
  }
  
  // Update presets (Quick Mode)
  if (updates.presets) {
    shoot.customUniverse = shoot.customUniverse || {};
    shoot.customUniverse.presets = {
      ...shoot.customUniverse.presets,
      ...updates.presets
    };
  }
  
  // Update fine mode parameters
  const fineBlocks = ['capture', 'light', 'color', 'texture', 'optical', 'composition', 'postProcess', 'era', 'artisticVision', 'antiAi'];
  for (const block of fineBlocks) {
    if (updates[block]) {
      shoot.customUniverse = shoot.customUniverse || {};
      shoot.customUniverse[block] = {
        ...shoot.customUniverse[block],
        ...updates[block]
      };
    }
  }
  
  // Update other settings
  if (updates.globalSettings) {
    shoot.globalSettings = {
      ...shoot.globalSettings,
      ...updates.globalSettings
    };
  }
  
  if (updates.location !== undefined) {
    shoot.location = updates.location;
  }
  
  if (updates.currentFrame !== undefined) {
    shoot.currentFrame = updates.currentFrame;
  }
  
  if (updates.currentEmotion !== undefined) {
    shoot.currentEmotion = updates.currentEmotion;
  }
  
  if (updates.extraPrompt !== undefined) {
    shoot.extraPrompt = updates.extraPrompt;
  }
  
  // Update models and clothing
  if (updates.models !== undefined) {
    shoot.models = updates.models;
  }
  
  if (updates.clothing !== undefined) {
    shoot.clothing = updates.clothing;
  }
  
  await saveCustomShoot(shoot);
  
  return shoot;
}

