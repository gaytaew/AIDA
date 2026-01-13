/**
 * Custom Shoot Store
 * 
 * File-based storage for Custom Shoots.
 * Each shoot is stored as a separate JSON file.
 * 
 * IMPORTANT: 
 * - Uses atomic writes and file-level locks to prevent race conditions.
 * - Generated images are stored as FILES (not base64 in JSON) to prevent memory bloat.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';
import { saveImage, loadImage, deleteImage, deleteShootImages, isStoredImagePath } from './imageStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store directory
const STORE_DIR = path.join(__dirname, 'custom-shoots');

// ═══════════════════════════════════════════════════════════════
// FILE LOCK (prevent race conditions)
// ═══════════════════════════════════════════════════════════════

const fileLocks = new Map(); // shootId -> Promise

/**
 * Execute function with exclusive lock on shoot file
 */
async function withFileLock(shootId, fn) {
  // Wait for existing lock to release
  while (fileLocks.has(shootId)) {
    await fileLocks.get(shootId);
  }
  
  // Create new lock
  let resolve;
  const lockPromise = new Promise(r => { resolve = r; });
  fileLocks.set(shootId, lockPromise);
  
  try {
    return await fn();
  } finally {
    fileLocks.delete(shootId);
    resolve();
  }
}

/**
 * Atomic write: write to temp file, then rename
 */
async function atomicWriteFile(filePath, content) {
  const tempPath = filePath + '.tmp.' + randomBytes(4).toString('hex');
  await fs.writeFile(tempPath, content, 'utf-8');
  await fs.rename(tempPath, filePath);
}

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
 * Get a custom shoot by ID (internal, without lock)
 */
async function _readShoot(id) {
  const filePath = path.join(STORE_DIR, `${id}.json`);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null; // Not found
    }
    // Log corrupted file for debugging
    if (err instanceof SyntaxError) {
      console.error(`[CustomShootStore] Corrupted JSON in ${id}.json:`, err.message);
    }
    throw err;
  }
}

/**
 * Get a custom shoot by ID
 */
export async function getCustomShootById(id) {
  await ensureStoreDir();
  return withFileLock(id, () => _readShoot(id));
}

/**
 * Save a custom shoot (internal, without lock)
 */
async function _writeShoot(shoot) {
  if (!shoot.id) {
    throw new Error('Shoot must have an id');
  }
  
  // Update timestamp
  shoot.updatedAt = new Date().toISOString();
  
  const filePath = path.join(STORE_DIR, `${shoot.id}.json`);
  
  // Use atomic write to prevent corruption
  await atomicWriteFile(filePath, JSON.stringify(shoot, null, 2));
  
  console.log(`[CustomShootStore] Saved shoot: ${shoot.id}`);
  return shoot;
}

/**
 * Save a custom shoot (create or update)
 */
export async function saveCustomShoot(shoot) {
  await ensureStoreDir();
  return withFileLock(shoot.id, () => _writeShoot(shoot));
}

/**
 * Delete a custom shoot
 * 
 * IMPORTANT: Also deletes all image files from disk.
 */
export async function deleteCustomShoot(id) {
  await ensureStoreDir();
  
  const filePath = path.join(STORE_DIR, `${id}.json`);
  
  try {
    // Delete all images for this shoot
    await deleteShootImages(id);
    
    // Delete the JSON file
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
 * 
 * IMPORTANT: Image data URL is saved to disk, only path is stored in JSON.
 */
export async function addImageToShoot(shootId, imageData) {
  await ensureStoreDir();
  
  return withFileLock(shootId, async () => {
    const shoot = await _readShoot(shootId);
    if (!shoot) {
      throw new Error(`Shoot not found: ${shootId}`);
    }
    
    // Ensure array exists
    if (!Array.isArray(shoot.generatedImages)) {
      shoot.generatedImages = [];
    }
    
    const imageId = imageData.id || `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    
    // Save image to disk if it's a data URL
    let imagePath = imageData.imageUrl;
    if (imageData.imageUrl && imageData.imageUrl.startsWith('data:')) {
      const saveResult = await saveImage(shootId, imageId, imageData.imageUrl);
      if (saveResult.ok) {
        imagePath = saveResult.filePath; // e.g. "CSHOOT_xxx/img_xxx.jpg"
        console.log(`[CustomShootStore] Image saved to disk: ${imagePath}`);
      } else {
        console.error('[CustomShootStore] Failed to save image to disk:', saveResult.error);
        // Continue with data URL as fallback (not ideal but prevents data loss)
      }
    }
    
    // Add image (preserve ALL fields from imageData, but replace imageUrl with path)
    const image = {
      ...imageData,
      id: imageId,
      imageUrl: imagePath, // Now stores path like "CSHOOT_xxx/img_xxx.jpg"
      createdAt: new Date().toISOString(),
      isStyleReference: false,
      isLocationReference: false
    };
    
    shoot.generatedImages.push(image);
    
    await _writeShoot(shoot);
    
    return image;
  });
}

/**
 * Remove an image from a shoot
 * 
 * IMPORTANT: Also deletes the image file from disk.
 */
export async function removeImageFromShoot(shootId, imageId) {
  await ensureStoreDir();
  
  return withFileLock(shootId, async () => {
    const shoot = await _readShoot(shootId);
    if (!shoot) {
      throw new Error(`Shoot not found: ${shootId}`);
    }
    
    const index = shoot.generatedImages?.findIndex(img => img.id === imageId);
    if (index === -1 || index === undefined) {
      return false;
    }
    
    const image = shoot.generatedImages[index];
    
    // Delete image file from disk if it's a stored path
    if (image.imageUrl && isStoredImagePath(image.imageUrl)) {
      await deleteImage(image.imageUrl);
    }
    
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
    
    await _writeShoot(shoot);
    
    return true;
  });
}

/**
 * Set style lock on a shoot
 * 
 * NOTE: Stores the image path (not data URL) in the lock.
 * The path will be resolved when the shoot is fetched via getCustomShootWithImages.
 */
export async function setStyleLockOnShoot(shootId, imageId, mode = 'strict') {
  await ensureStoreDir();
  
  return withFileLock(shootId, async () => {
    const shoot = await _readShoot(shootId);
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
    
    // Store the path (not data URL) - it will be resolved on read
    shoot.locks.style = {
      enabled: true,
      mode,
      sourceImageId: imageId,
      sourceImageUrl: image.imageUrl // This is now a path like "CSHOOT_xxx/img_xxx.jpg"
    };
    
    await _writeShoot(shoot);
    
    return shoot;
  });
}

/**
 * Set location lock on a shoot
 * 
 * NOTE: Stores the image path (not data URL) in the lock.
 * The path will be resolved when the shoot is fetched via getCustomShootWithImages.
 */
export async function setLocationLockOnShoot(shootId, imageId, mode = 'strict') {
  await ensureStoreDir();
  
  return withFileLock(shootId, async () => {
    const shoot = await _readShoot(shootId);
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
    
    // Store the path (not data URL) - it will be resolved on read
    shoot.locks.location = {
      enabled: true,
      mode,
      sourceImageId: imageId,
      sourceImageUrl: image.imageUrl // This is now a path like "CSHOOT_xxx/img_xxx.jpg"
    };
    
    await _writeShoot(shoot);
    
    return shoot;
  });
}

/**
 * Clear style lock
 */
export async function clearStyleLockOnShoot(shootId) {
  await ensureStoreDir();
  
  return withFileLock(shootId, async () => {
    const shoot = await _readShoot(shootId);
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
    
    await _writeShoot(shoot);
    
    return shoot;
  });
}

/**
 * Clear location lock
 */
export async function clearLocationLockOnShoot(shootId) {
  await ensureStoreDir();
  
  return withFileLock(shootId, async () => {
    const shoot = await _readShoot(shootId);
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
    
    await _writeShoot(shoot);
    
    return shoot;
  });
}

/**
 * Get a custom shoot with image URLs resolved to data URLs
 * 
 * Use this when sending shoot data to the client.
 * Converts stored paths like "CSHOOT_xxx/img_xxx.jpg" back to data URLs.
 */
export async function getCustomShootWithImages(id) {
  await ensureStoreDir();
  
  return withFileLock(id, async () => {
    const shoot = await _readShoot(id);
    if (!shoot) return null;
    
    // Resolve image paths to data URLs
    if (shoot.generatedImages?.length > 0) {
      const resolvedImages = await Promise.all(
        shoot.generatedImages.map(async (img) => {
          if (img.imageUrl && isStoredImagePath(img.imageUrl)) {
            const result = await loadImage(img.imageUrl);
            if (result.ok) {
              return { ...img, imageUrl: result.dataUrl };
            }
          }
          return img;
        })
      );
      
      // Sort by createdAt descending (newest first)
      resolvedImages.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.timestamp || 0);
        const dateB = new Date(b.createdAt || b.timestamp || 0);
        return dateB - dateA;
      });
      
      shoot.generatedImages = resolvedImages;
    }
    
    // Also resolve style/location lock source images
    if (shoot.locks?.style?.sourceImageUrl && isStoredImagePath(shoot.locks.style.sourceImageUrl)) {
      const result = await loadImage(shoot.locks.style.sourceImageUrl);
      if (result.ok) {
        shoot.locks.style.sourceImageUrl = result.dataUrl;
      }
    }
    if (shoot.locks?.location?.sourceImageUrl && isStoredImagePath(shoot.locks.location.sourceImageUrl)) {
      const result = await loadImage(shoot.locks.location.sourceImageUrl);
      if (result.ok) {
        shoot.locks.location.sourceImageUrl = result.dataUrl;
      }
    }
    
    return shoot;
  });
}

/**
 * Update shoot parameters (presets, universe settings)
 */
export async function updateShootParams(shootId, updates) {
  await ensureStoreDir();
  
  return withFileLock(shootId, async () => {
    const shoot = await _readShoot(shootId);
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
    
    // Update look prompts (overall outfit style per model)
    if (updates.lookPrompts !== undefined) {
      shoot.lookPrompts = updates.lookPrompts;
    }
    
    // Update generation settings (all UI settings for the generate step)
    if (updates.generationSettings !== undefined) {
      shoot.generationSettings = {
        ...shoot.generationSettings,
        ...updates.generationSettings
      };
    }
    
    await _writeShoot(shoot);
    
    return shoot;
  });
}

