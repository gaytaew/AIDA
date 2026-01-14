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
const INDEX_FILE = path.join(STORE_DIR, '_index.json');

// In-memory cache for index (fast reads)
let indexCache = null;
let indexCacheTime = 0;
const INDEX_CACHE_TTL = 5000; // 5 seconds

// ═══════════════════════════════════════════════════════════════
// FILE LOCK (prevent race conditions)
// ═══════════════════════════════════════════════════════════════

/**
 * Mutex-like lock implementation to prevent race conditions.
 * 
 * FIXED: Previous implementation had race condition when multiple 
 * waiters woke up simultaneously and could overwrite each other's locks.
 * 
 * New implementation uses a proper queue to serialize access.
 */
class FileLockManager {
  constructor() {
    this.locks = new Map(); // shootId -> { active: boolean, queue: Function[] }
  }
  
  async acquire(shootId) {
    if (!this.locks.has(shootId)) {
      this.locks.set(shootId, { active: false, queue: [] });
    }
    
    const lock = this.locks.get(shootId);
    
    if (!lock.active) {
      // Lock is free, acquire immediately
      lock.active = true;
      return;
    }
    
    // Lock is held, wait in queue
    return new Promise(resolve => {
      lock.queue.push(resolve);
    });
  }
  
  release(shootId) {
    const lock = this.locks.get(shootId);
    if (!lock) return;
    
    if (lock.queue.length > 0) {
      // Give lock to next waiter
      const nextResolve = lock.queue.shift();
      // Lock stays active, next waiter will use it
      nextResolve();
    } else {
      // No waiters, release lock
      lock.active = false;
      // Clean up if no activity
      if (lock.queue.length === 0) {
        this.locks.delete(shootId);
      }
    }
  }
  
  getStatus() {
    const status = {};
    for (const [id, lock] of this.locks.entries()) {
      status[id] = { active: lock.active, waiting: lock.queue.length };
    }
    return status;
  }
}

const lockManager = new FileLockManager();

/**
 * Execute function with exclusive lock on shoot file
 * 
 * TIMEOUTS:
 * - Lock acquisition: 30 seconds max wait
 * - Operation execution: 60 seconds max
 * 
 * IMPORTANT: Previous implementation had lock leak when timeout fired
 * but lock was later acquired. Fixed by tracking lock ownership.
 */
async function withFileLock(shootId, fn) {
  const startWait = Date.now();
  const LOCK_TIMEOUT_MS = 30000; // 30 seconds max wait for lock
  const OPERATION_TIMEOUT_MS = 60000; // 60 seconds max for operation
  
  let lockAcquired = false;
  let timeoutFired = false;
  
  // Race lock acquisition against timeout
  const lockPromise = lockManager.acquire(shootId).then(() => {
    lockAcquired = true;
    if (timeoutFired) {
      // Timeout already fired, release the lock we just got
      console.warn(`[CustomShootStore] Lock acquired after timeout for ${shootId}, releasing`);
      lockManager.release(shootId);
      throw new Error('Lock acquired after timeout');
    }
  });
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      timeoutFired = true;
      if (!lockAcquired) {
        reject(new Error(`Lock timeout: could not acquire lock for ${shootId} in ${LOCK_TIMEOUT_MS}ms. Status: ${JSON.stringify(lockManager.getStatus())}`));
      }
    }, LOCK_TIMEOUT_MS);
  });
  
  try {
    await Promise.race([lockPromise, timeoutPromise]);
  } catch (e) {
    console.error(`[CustomShootStore] ${e.message}`);
    throw e;
  }
  
  const waitTime = Date.now() - startWait;
  if (waitTime > 100) {
    console.log(`[CustomShootStore] Lock acquired for ${shootId} after ${waitTime}ms wait`);
  }
  
  // Execute with operation timeout
  try {
    const operationPromise = fn();
    const opTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timeout: ${shootId} operation took longer than ${OPERATION_TIMEOUT_MS}ms`));
      }, OPERATION_TIMEOUT_MS);
    });
    
    return await Promise.race([operationPromise, opTimeoutPromise]);
  } finally {
    lockManager.release(shootId);
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
 * Read index from file or cache
 */
async function readIndex() {
  // Check cache first
  if (indexCache && (Date.now() - indexCacheTime) < INDEX_CACHE_TTL) {
    return indexCache;
  }
  
  try {
    const content = await fs.readFile(INDEX_FILE, 'utf-8');
    indexCache = JSON.parse(content);
    indexCacheTime = Date.now();
    return indexCache;
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Index doesn't exist, rebuild it
      console.log('[CustomShootStore] Index not found, rebuilding...');
      return await rebuildIndex();
    }
    throw err;
  }
}

/**
 * Write index to file and update cache
 */
async function writeIndex(index) {
  indexCache = index;
  indexCacheTime = Date.now();
  await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
}

/**
 * Rebuild index by reading all shoot files (slow, but only done once)
 */
async function rebuildIndex() {
  console.log('[CustomShootStore] Rebuilding index...');
  const startTime = Date.now();
  
  const files = await fs.readdir(STORE_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('_'));
  
  // Read all files in parallel
  const shootPromises = jsonFiles.map(async (file) => {
    try {
      const filePath = path.join(STORE_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const shoot = JSON.parse(content);
      
      return {
        id: shoot.id,
        label: shoot.label,
        mode: shoot.mode,
        createdAt: shoot.createdAt,
        updatedAt: shoot.updatedAt,
        imageCount: shoot.generatedImages?.length || 0,
        hasStyleLock: shoot.locks?.style?.enabled || false,
        hasLocationLock: shoot.locks?.location?.enabled || false,
        previewUrl: shoot.generatedImages?.[0]?.imageUrl || null
      };
    } catch (err) {
      console.error(`[CustomShootStore] Error reading ${file}:`, err.message);
      return null;
    }
  });
  
  const results = await Promise.all(shootPromises);
  const shoots = results.filter(s => s !== null);
  
  // Sort by updatedAt descending
  shoots.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  const index = { shoots, rebuiltAt: new Date().toISOString() };
  await writeIndex(index);
  
  console.log(`[CustomShootStore] Index rebuilt in ${Date.now() - startTime}ms, ${shoots.length} shoots`);
  return index;
}

/**
 * Update a single entry in the index (fast)
 */
async function updateIndexEntry(shoot) {
  try {
    const index = await readIndex();
    
    const entry = {
      id: shoot.id,
      label: shoot.label,
      mode: shoot.mode,
      createdAt: shoot.createdAt,
      updatedAt: shoot.updatedAt,
      imageCount: shoot.generatedImages?.length || 0,
      hasStyleLock: shoot.locks?.style?.enabled || false,
      hasLocationLock: shoot.locks?.location?.enabled || false,
      previewUrl: shoot.generatedImages?.[0]?.imageUrl || null
    };
    
    const existingIdx = index.shoots.findIndex(s => s.id === shoot.id);
    if (existingIdx >= 0) {
      index.shoots[existingIdx] = entry;
    } else {
      index.shoots.unshift(entry);
    }
    
    // Re-sort
    index.shoots.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    await writeIndex(index);
  } catch (err) {
    console.error('[CustomShootStore] Error updating index:', err);
    // Invalidate cache on error
    indexCache = null;
  }
}

/**
 * Remove entry from index
 */
async function removeFromIndex(shootId) {
  try {
    const index = await readIndex();
    index.shoots = index.shoots.filter(s => s.id !== shootId);
    await writeIndex(index);
  } catch (err) {
    console.error('[CustomShootStore] Error removing from index:', err);
    indexCache = null;
  }
}

/**
 * Get all custom shoots (list with basic info)
 * OPTIMIZED: Uses index file for instant loading
 */
export async function getAllCustomShoots() {
  await ensureStoreDir();
  
  try {
    const index = await readIndex();
    return index.shoots || [];
  } catch (err) {
    console.error('[CustomShootStore] Error reading index:', err);
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
  const result = await withFileLock(shoot.id, () => _writeShoot(shoot));
  
  // Update index asynchronously (don't block)
  updateIndexEntry(shoot).catch(err => console.error('[CustomShootStore] Index update failed:', err));
  
  return result;
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
    
    // Update index
    await removeFromIndex(id);
    
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
    
    // Update index (async, don't block)
    updateIndexEntry(shoot).catch(err => console.error('[CustomShootStore] Index update failed:', err));
    
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
    
    // Debug: log clothing data with full prompts
    if (shoot.clothing?.length > 0) {
      console.log('[CustomShootStore] Loading clothing for shoot', id);
      shoot.clothing.forEach(c => {
        console.log(`  Model ${c.forModelIndex}: ${c.items?.length || 0} items`);
        c.items?.forEach((item, i) => {
          console.log(`    [${i}] name="${item.name || ''}" prompt="${(item.prompt || '').slice(0, 80)}..." images=${item.images?.length || 0}`);
        });
      });
    }
    
    // Debug: log lookPrompts
    if (shoot.lookPrompts?.length > 0) {
      console.log('[CustomShootStore] Loading lookPrompts for shoot', id, ':', shoot.lookPrompts);
    }
    
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
    
    // Resolve clothing images (new format with items)
    if (shoot.clothing?.length > 0) {
      for (const clothingEntry of shoot.clothing) {
        if (clothingEntry.items?.length > 0) {
          for (const item of clothingEntry.items) {
            if (item.images?.length > 0) {
              for (const img of item.images) {
                if (img.url && isStoredImagePath(img.url)) {
                  const result = await loadImage(img.url);
                  if (result.ok) {
                    img.url = result.dataUrl;
                  }
                }
              }
            }
          }
        }
      }
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
      console.log('[CustomShootStore] Saving clothing for shoot', shootId);
      updates.clothing.forEach(c => {
        console.log(`  Model ${c.forModelIndex}: ${c.items?.length || 0} items`);
        c.items?.forEach((item, i) => {
          console.log(`    [${i}] name="${item.name || ''}" prompt="${(item.prompt || '').slice(0, 80)}..." images=${item.images?.length || 0}`);
        });
      });
      shoot.clothing = updates.clothing;
    }
    
    // Update look prompts (overall outfit style per model)
    if (updates.lookPrompts !== undefined) {
      console.log('[CustomShootStore] Saving lookPrompts:', updates.lookPrompts);
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

