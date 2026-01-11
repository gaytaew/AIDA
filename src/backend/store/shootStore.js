/**
 * Shoot Store
 * 
 * File-based storage for shoot configurations.
 * Each shoot is stored as a separate JSON file.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createEmptyShootConfig,
  validateShootConfig,
  generateImageId
} from '../schema/shootConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHOOTS_DIR = path.resolve(__dirname, 'shoots');
const IMAGES_DIR = path.resolve(__dirname, 'shoot-images');

// ═══════════════════════════════════════════════════════════════
// FILE SYSTEM HELPERS
// ═══════════════════════════════════════════════════════════════

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

function buildShootPath(shootId) {
  return path.join(SHOOTS_DIR, `${shootId}.json`);
}

function buildImagePath(shootId, imageId) {
  return path.join(IMAGES_DIR, shootId, `${imageId}.jpg`);
}

function buildImageMetaPath(shootId, imageId) {
  return path.join(IMAGES_DIR, shootId, `${imageId}.meta.json`);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Write queue to prevent concurrent writes
let writeQueue = Promise.resolve();
function enqueueWrite(task) {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get all shoots (metadata only for listing)
 * OPTIMIZED: reads only first 2KB of each file to extract metadata
 */
export async function getAllShoots() {
  await ensureDir(SHOOTS_DIR);
  
  const files = await fs.readdir(SHOOTS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  const shoots = [];
  
  for (const file of jsonFiles) {
    try {
      const filePath = path.join(SHOOTS_DIR, file);
      const stat = await fs.stat(filePath);
      
      // For large files (>100KB), read only the beginning
      // This is safe because id, label, createdAt, updatedAt are at the top of the JSON
      if (stat.size > 100000) {
        const fd = await fs.open(filePath, 'r');
        const buffer = Buffer.alloc(3000); // Read first 3KB
        await fd.read(buffer, 0, 3000, 0);
        await fd.close();
        
        const partial = buffer.toString('utf8');
        
        // Extract fields using regex (faster than full parse)
        const idMatch = partial.match(/"id"\s*:\s*"([^"]+)"/);
        const labelMatch = partial.match(/"label"\s*:\s*"([^"]+)"/);
        const createdMatch = partial.match(/"createdAt"\s*:\s*"([^"]+)"/);
        const updatedMatch = partial.match(/"updatedAt"\s*:\s*"([^"]+)"/);
        
        shoots.push({
          id: idMatch?.[1] || file.replace('.json', ''),
          label: labelMatch?.[1] || 'Съёмка',
          createdAt: createdMatch?.[1] || new Date().toISOString(),
          updatedAt: updatedMatch?.[1] || new Date().toISOString(),
          modelCount: 0,
          frameCount: 0,
          hasUniverse: false,
          hasClothing: false,
          isLarge: true  // Mark as large file
        });
      } else {
        // For small files, full parse is fine
        const raw = await fs.readFile(filePath, 'utf8');
        const shoot = JSON.parse(raw);
        
        shoots.push({
          id: shoot.id,
          label: shoot.label,
          createdAt: shoot.createdAt,
          updatedAt: shoot.updatedAt,
          modelCount: shoot.models?.length || 0,
          frameCount: shoot.frames?.length || 0,
          hasUniverse: !!shoot.universe,
          hasClothing: shoot.clothing?.some(c => c.refs?.length > 0) || false
        });
      }
    } catch (error) {
      console.error(`[ShootStore] Error reading ${file}:`, error.message);
    }
  }
  
  // Sort by updatedAt descending
  shoots.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  return shoots;
}

/**
 * Get shoot by ID (full data)
 */
export async function getShootById(id) {
  await ensureDir(SHOOTS_DIR);
  
  const filePath = buildShootPath(id);
  
  if (!(await fileExists(filePath))) {
    return null;
  }
  
  const raw = await fs.readFile(filePath, 'utf8');
  const shoot = JSON.parse(raw);
  
  const validation = validateShootConfig(shoot);
  if (!validation.valid) {
    console.warn(`[ShootStore] Shoot ${id} has validation warnings:`, validation.errors);
  }
  
  return shoot;
}

/**
 * Create a new shoot
 */
export async function createShoot(shootData = {}) {
  const now = new Date().toISOString();
  
  const newShoot = {
    ...createEmptyShootConfig(shootData.label),
    ...shootData,
    createdAt: now,
    updatedAt: now
  };
  
  const validation = validateShootConfig(newShoot);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  const filePath = buildShootPath(newShoot.id);
  
  if (await fileExists(filePath)) {
    return { success: false, errors: [`Shoot with ID "${newShoot.id}" already exists.`] };
  }
  
  await enqueueWrite(async () => {
    await ensureDir(SHOOTS_DIR);
    await fs.writeFile(filePath, JSON.stringify(newShoot, null, 2), 'utf8');
  });
  
  return { success: true, shoot: newShoot };
}

/**
 * Update an existing shoot
 */
export async function updateShoot(id, updates) {
  const existingShoot = await getShootById(id);
  
  if (!existingShoot) {
    return { success: false, errors: [`Shoot with ID "${id}" not found.`] };
  }
  
  const updatedShoot = {
    ...existingShoot,
    ...updates,
    id: existingShoot.id, // ID cannot be changed
    createdAt: existingShoot.createdAt, // Preserve original creation time
    updatedAt: new Date().toISOString()
  };
  
  const validation = validateShootConfig(updatedShoot);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  const filePath = buildShootPath(id);
  
  await enqueueWrite(async () => {
    await fs.writeFile(filePath, JSON.stringify(updatedShoot, null, 2), 'utf8');
  });
  
  return { success: true, shoot: updatedShoot };
}

/**
 * Delete a shoot
 */
export async function deleteShoot(id) {
  const filePath = buildShootPath(id);
  
  if (!(await fileExists(filePath))) {
    return { success: false, errors: [`Shoot with ID "${id}" not found.`] };
  }
  
  await enqueueWrite(async () => {
    await fs.unlink(filePath);
  });
  
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// SHOOT BUILDING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Add a model to shoot
 */
export async function addModelToShoot(shootId, modelData) {
  const shoot = await getShootById(shootId);
  if (!shoot) {
    return { success: false, errors: ['Shoot not found'] };
  }
  
  const models = [...(shoot.models || [])];
  
  // Check if model already exists
  const existingIndex = models.findIndex(m => m.modelId === modelData.modelId);
  if (existingIndex >= 0) {
    models[existingIndex] = { ...models[existingIndex], ...modelData };
  } else {
    if (models.length >= 3) {
      return { success: false, errors: ['Maximum 3 models allowed'] };
    }
    models.push(modelData);
  }
  
  return await updateShoot(shootId, { models });
}

/**
 * Remove a model from shoot
 */
export async function removeModelFromShoot(shootId, modelId) {
  const shoot = await getShootById(shootId);
  if (!shoot) {
    return { success: false, errors: ['Shoot not found'] };
  }
  
  const models = (shoot.models || []).filter(m => m.modelId !== modelId);
  
  // Also remove related clothing and outfit avatars
  const clothing = (shoot.clothing || []).filter(c => {
    const modelIndex = shoot.models.findIndex(m => m.modelId === modelId);
    return c.forModelIndex !== modelIndex;
  });
  
  const outfitAvatars = (shoot.outfitAvatars || []).filter(a => {
    const modelIndex = shoot.models.findIndex(m => m.modelId === modelId);
    return a.forModelIndex !== modelIndex;
  });
  
  return await updateShoot(shootId, { models, clothing, outfitAvatars });
}

/**
 * Set clothing for a model in shoot
 */
export async function setClothingForModel(shootId, modelIndex, clothingRefs) {
  const shoot = await getShootById(shootId);
  if (!shoot) {
    return { success: false, errors: ['Shoot not found'] };
  }
  
  const clothing = [...(shoot.clothing || [])];
  
  // Find existing entry for this model
  const existingIndex = clothing.findIndex(c => c.forModelIndex === modelIndex);
  
  if (existingIndex >= 0) {
    clothing[existingIndex] = { forModelIndex: modelIndex, refs: clothingRefs };
  } else {
    clothing.push({ forModelIndex: modelIndex, refs: clothingRefs });
  }
  
  // Reset outfit avatar for this model when clothing changes
  const outfitAvatars = (shoot.outfitAvatars || []).map(a => {
    if (a.forModelIndex === modelIndex) {
      return { ...a, status: 'empty', imageUrl: null, approvedAt: null };
    }
    return a;
  });
  
  return await updateShoot(shootId, { clothing, outfitAvatars });
}

/**
 * Set outfit avatar for a model
 */
export async function setOutfitAvatarForModel(shootId, modelIndex, avatarData) {
  const shoot = await getShootById(shootId);
  if (!shoot) {
    return { success: false, errors: ['Shoot not found'] };
  }
  
  const outfitAvatars = [...(shoot.outfitAvatars || [])];
  
  const existingIndex = outfitAvatars.findIndex(a => a.forModelIndex === modelIndex);
  
  const avatarEntry = {
    forModelIndex: modelIndex,
    status: avatarData.status || 'ok',
    imageUrl: avatarData.imageUrl || null,
    upscaledUrl: avatarData.upscaledUrl || null,
    prompt: avatarData.prompt || null,
    approvedAt: avatarData.approved ? new Date().toISOString() : null
  };
  
  if (existingIndex >= 0) {
    outfitAvatars[existingIndex] = avatarEntry;
  } else {
    outfitAvatars.push(avatarEntry);
  }
  
  return await updateShoot(shootId, { outfitAvatars });
}

/**
 * Add a frame to shoot
 */
export async function addFrameToShoot(shootId, frameData) {
  const shoot = await getShootById(shootId);
  if (!shoot) {
    return { success: false, errors: ['Shoot not found'] };
  }
  
  const frames = [...(shoot.frames || [])];
  
  // Determine order
  const maxOrder = frames.reduce((max, f) => Math.max(max, f.order || 0), 0);
  
  frames.push({
    ...frameData,
    order: frameData.order || maxOrder + 1
  });
  
  return await updateShoot(shootId, { frames });
}

/**
 * Remove a frame from shoot
 */
export async function removeFrameFromShoot(shootId, frameId) {
  const shoot = await getShootById(shootId);
  if (!shoot) {
    return { success: false, errors: ['Shoot not found'] };
  }
  
  const frames = (shoot.frames || []).filter(f => f.frameId !== frameId);
  
  return await updateShoot(shootId, { frames });
}

/**
 * Set universe for shoot
 */
export async function setUniverseForShoot(shootId, universe) {
  return await updateShoot(shootId, { universe });
}

// ═══════════════════════════════════════════════════════════════
// GENERATED IMAGES MANAGEMENT (stored in separate files)
// ═══════════════════════════════════════════════════════════════

/**
 * Save image to separate file
 */
async function saveImageToFile(shootId, imageId, imageUrl, metadata) {
  const shootImagesDir = path.join(IMAGES_DIR, shootId);
  await ensureDir(shootImagesDir);
  
  // Extract base64 from data URL
  const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    const buffer = Buffer.from(match[2], 'base64');
    const imagePath = buildImagePath(shootId, imageId);
    await fs.writeFile(imagePath, buffer);
  }
  
  // Save metadata
  const metaPath = buildImageMetaPath(shootId, imageId);
  await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf8');
  
  return true;
}

/**
 * Load image from separate file
 */
async function loadImageFromFile(shootId, imageId) {
  const imagePath = buildImagePath(shootId, imageId);
  const metaPath = buildImageMetaPath(shootId, imageId);
  
  try {
    const [imageBuffer, metaRaw] = await Promise.all([
      fs.readFile(imagePath),
      fs.readFile(metaPath, 'utf8')
    ]);
    
    const metadata = JSON.parse(metaRaw);
    const imageUrl = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    
    return { ...metadata, imageUrl };
  } catch (error) {
    return null;
  }
}

/**
 * List all image IDs for a shoot
 */
async function listShootImageIds(shootId) {
  const shootImagesDir = path.join(IMAGES_DIR, shootId);
  try {
    const files = await fs.readdir(shootImagesDir);
    return files
      .filter(f => f.endsWith('.meta.json'))
      .map(f => f.replace('.meta.json', ''));
  } catch {
    return [];
  }
}

/**
 * Add a generated image to shoot (saves to separate file)
 */
export async function addGeneratedImageToShoot(shootId, imageData) {
  const shoot = await getShootById(shootId);
  if (!shoot) {
    return { success: false, errors: ['Shoot not found'] };
  }
  
  const imageId = generateImageId();
  const now = new Date().toISOString();
  
  const metadata = {
    id: imageId,
    frameId: imageData.frameId || 'default',
    frameLabel: imageData.frameLabel || 'Default',
    locationId: imageData.locationId || null,
    locationLabel: imageData.locationLabel || null,
    emotionId: imageData.emotionId || null,
    // Artistic controls (new)
    captureStyle: imageData.captureStyle || 'none',
    cameraSignature: imageData.cameraSignature || 'none',
    skinTexture: imageData.skinTexture || 'none',
    poseAdherence: imageData.poseAdherence || 2,
    extraPrompt: imageData.extraPrompt || '',
    prompt: imageData.prompt || null,
    // Note: promptJson and refs NOT saved to avoid bloat
    createdAt: now
  };
  
  // Save image to separate file
  await saveImageToFile(shootId, imageId, imageData.imageUrl, metadata);
  
  // Update shoot with just the image ID reference (not the full data)
  const imageRefs = [...(shoot.generatedImageRefs || []), imageId];
  const result = await updateShoot(shootId, { generatedImageRefs: imageRefs });
  
  if (result.success) {
    return { 
      success: true, 
      image: { ...metadata, imageUrl: imageData.imageUrl },
      shoot: result.shoot 
    };
  }
  return result;
}

/**
 * Get all generated images for a shoot
 */
export async function getGeneratedImagesForShoot(shootId) {
  const imageIds = await listShootImageIds(shootId);
  
  const images = [];
  for (const imageId of imageIds) {
    const image = await loadImageFromFile(shootId, imageId);
    if (image) {
      images.push(image);
    }
  }
  
  // Sort by createdAt descending
  images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return images;
}

/**
 * Remove a generated image from shoot
 */
export async function removeGeneratedImageFromShoot(shootId, imageId) {
  const shoot = await getShootById(shootId);
  if (!shoot) {
    return { success: false, errors: ['Shoot not found'] };
  }
  
  // Delete files
  try {
    await fs.unlink(buildImagePath(shootId, imageId));
    await fs.unlink(buildImageMetaPath(shootId, imageId));
  } catch (error) {
    console.warn(`[ShootStore] Could not delete image files for ${imageId}:`, error.message);
  }
  
  // Update refs
  const imageRefs = (shoot.generatedImageRefs || []).filter(id => id !== imageId);
  
  return await updateShoot(shootId, { generatedImageRefs: imageRefs });
}

/**
 * Clear all generated images from shoot
 */
export async function clearGeneratedImagesFromShoot(shootId) {
  const imageIds = await listShootImageIds(shootId);
  
  // Delete all files
  for (const imageId of imageIds) {
    try {
      await fs.unlink(buildImagePath(shootId, imageId));
      await fs.unlink(buildImageMetaPath(shootId, imageId));
    } catch (error) {
      console.warn(`[ShootStore] Could not delete image ${imageId}:`, error.message);
    }
  }
  
  return await updateShoot(shootId, { generatedImageRefs: [] });
}

export default {
  getAllShoots,
  getShootById,
  createShoot,
  updateShoot,
  deleteShoot,
  addModelToShoot,
  removeModelFromShoot,
  setClothingForModel,
  setOutfitAvatarForModel,
  addFrameToShoot,
  removeFrameFromShoot,
  setUniverseForShoot,
  addGeneratedImageToShoot,
  getGeneratedImagesForShoot,
  removeGeneratedImageFromShoot,
  clearGeneratedImagesFromShoot
};

