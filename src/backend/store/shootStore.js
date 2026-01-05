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
  validateShootConfig
} from '../schema/shootConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHOOTS_DIR = path.resolve(__dirname, 'shoots');

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
 */
export async function getAllShoots() {
  await ensureDir(SHOOTS_DIR);
  
  const files = await fs.readdir(SHOOTS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  const shoots = [];
  
  for (const file of jsonFiles) {
    try {
      const filePath = path.join(SHOOTS_DIR, file);
      const raw = await fs.readFile(filePath, 'utf8');
      const shoot = JSON.parse(raw);
      
      // Return metadata only for listing
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
  setUniverseForShoot
};

