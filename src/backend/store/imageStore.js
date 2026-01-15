/**
 * Image Store
 * 
 * Stores generated images as files on disk, not base64 in JSON.
 * This prevents memory bloat and JSON corruption from huge files.
 * 
 * Images are stored as:
 *   store/images/{shootId}/{imageId}.jpg
 * 
 * JSON files only store the image ID, and we reconstruct the URL on read.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for images
const IMAGES_DIR = path.join(__dirname, 'images');

// GLOBAL STREAM: Save all generated photos here
const GLOBAL_PHOTOS_DIR = path.resolve(__dirname, '../../../_all_photos');

/**
 * Ensure images directory exists
 */
async function ensureImagesDir() {
  try {
    await fs.access(IMAGES_DIR);
  } catch {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    console.log('[ImageStore] Created images directory:', IMAGES_DIR);
  }
}

/**
 * Ensure global photos directory exists
 */
async function ensureGlobalPhotosDir() {
  try {
    await fs.access(GLOBAL_PHOTOS_DIR);
  } catch {
    await fs.mkdir(GLOBAL_PHOTOS_DIR, { recursive: true });
    console.log('[ImageStore] Created global photos directory:', GLOBAL_PHOTOS_DIR);
  }
}

/**
 * Ensure shoot-specific subdirectory exists
 */
async function ensureShootDir(shootId) {
  const shootDir = path.join(IMAGES_DIR, shootId);
  try {
    await fs.access(shootDir);
  } catch {
    await fs.mkdir(shootDir, { recursive: true });
  }
  return shootDir;
}

/**
 * Extract base64 and mimeType from data URL
 */
function parseDataUrl(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return null;
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    base64: match[2]
  };
}

/**
 * Get file extension from MIME type
 */
function getExtension(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };
  return map[mimeType] || 'jpg';
}

/**
 * Save image to disk
 * 
 * @param {string} shootId - Shoot ID for subdirectory
 * @param {string} imageId - Unique image ID
 * @param {string} dataUrl - Full data URL (data:image/jpeg;base64,...)
 * @returns {Promise<{ok: boolean, filePath?: string, error?: string}>}
 */
export async function saveImage(shootId, imageId, dataUrl) {
  await ensureImagesDir();

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return { ok: false, error: 'Invalid data URL' };
  }

  const shootDir = await ensureShootDir(shootId);
  const ext = getExtension(parsed.mimeType);
  const filename = `${imageId}.${ext}`;
  const filePath = path.join(shootDir, filename);

  // Write as binary
  const buffer = Buffer.from(parsed.base64, 'base64');

  // Atomic write
  const tempPath = filePath + '.tmp.' + randomBytes(4).toString('hex');
  try {
    await fs.writeFile(tempPath, buffer);
    await fs.rename(tempPath, filePath);

    console.log(`[ImageStore] Saved image: ${shootId}/${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);

    // ═══════════════════════════════════════════════════════════════
    // GLOBAL PHOTO STREAM
    // ═══════════════════════════════════════════════════════════════
    try {
      await ensureGlobalPhotosDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      // Format: timestamp_shootId_imageId.ext
      const globalFilename = `${timestamp}_${shootId}_${imageId}.${ext}`;
      const globalPath = path.join(GLOBAL_PHOTOS_DIR, globalFilename);

      // Copy the file we just wrote
      await fs.copyFile(filePath, globalPath);
      console.log(`[ImageStore] 📸 Streamed to: _all_photos/${globalFilename}`);
    } catch (streamErr) {
      console.error('[ImageStore] Global stream save failed:', streamErr);
      // Non-blocking error - don't fail the main request
    }
    // ═══════════════════════════════════════════════════════════════

    return {
      ok: true,
      filePath: `${shootId}/${filename}`,
      mimeType: parsed.mimeType,
      size: buffer.length
    };
  } catch (err) {
    // Cleanup temp file if exists
    try { await fs.unlink(tempPath); } catch { }
    console.error('[ImageStore] Save error:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Load image from disk as data URL
 * 
 * @param {string} imagePath - Path like "CSHOOT_xxx/img_xxx.jpg"
 * @returns {Promise<{ok: boolean, dataUrl?: string, error?: string}>}
 */
export async function loadImage(imagePath) {
  if (!imagePath) {
    return { ok: false, error: 'No image path' };
  }

  // If already a data URL, return as-is
  if (imagePath.startsWith('data:')) {
    return { ok: true, dataUrl: imagePath };
  }

  const fullPath = path.join(IMAGES_DIR, imagePath);

  try {
    const buffer = await fs.readFile(fullPath);

    // Determine mime type from extension
    const ext = path.extname(imagePath).toLowerCase().slice(1);
    const mimeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return { ok: true, dataUrl, mimeType, buffer };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { ok: false, error: 'Image not found' };
    }
    console.error('[ImageStore] Load error:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Load image as buffer (for serving via HTTP)
 */
export async function loadImageBuffer(imagePath) {
  if (!imagePath) {
    return { ok: false, error: 'No image path' };
  }

  const fullPath = path.join(IMAGES_DIR, imagePath);

  try {
    const buffer = await fs.readFile(fullPath);

    const ext = path.extname(imagePath).toLowerCase().slice(1);
    const mimeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    return { ok: true, buffer, mimeType };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { ok: false, error: 'Image not found' };
    }
    return { ok: false, error: err.message };
  }
}

/**
 * Delete image from disk
 */
export async function deleteImage(imagePath) {
  if (!imagePath || imagePath.startsWith('data:')) {
    return { ok: true }; // Nothing to delete
  }

  const fullPath = path.join(IMAGES_DIR, imagePath);

  try {
    await fs.unlink(fullPath);
    console.log(`[ImageStore] Deleted image: ${imagePath}`);
    return { ok: true };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { ok: true }; // Already gone
    }
    console.error('[ImageStore] Delete error:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Delete all images for a shoot
 */
export async function deleteShootImages(shootId) {
  const shootDir = path.join(IMAGES_DIR, shootId);

  try {
    await fs.rm(shootDir, { recursive: true, force: true });
    console.log(`[ImageStore] Deleted shoot images: ${shootId}`);
    return { ok: true };
  } catch (err) {
    console.error('[ImageStore] Delete shoot images error:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Check if path is a stored image path (not data URL)
 */
export function isStoredImagePath(value) {
  if (!value || typeof value !== 'string') return false;
  if (value.startsWith('data:')) return false;
  // Stored paths look like: CSHOOT_xxx/img_xxx.jpg
  return /^[A-Z0-9_]+\/[a-z0-9_]+\.(jpg|jpeg|png|webp|gif)$/i.test(value);
}

/**
 * Get the images directory (for migrations/debugging)
 */
export function getImagesDir() {
  return IMAGES_DIR;
}


