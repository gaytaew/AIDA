/**
 * Model Store
 * 
 * Handles CRUD operations for models with disk-based storage.
 * Each model is stored in its own folder: store/models/{model-id}/
 * - manifest.json: model metadata
 * - identity-*.jpg: reference images
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEmptyModel, validateModel } from '../schema/model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.resolve(__dirname, 'models');
const MANIFEST_FILE = 'manifest.json';

// Write queue for safe concurrent writes
let writeQueue = Promise.resolve();
function enqueueWrite(task) {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

/**
 * Ensure models directory exists
 */
async function ensureModelsDir() {
  await fs.mkdir(MODELS_DIR, { recursive: true });
}

/**
 * Get model folder path by ID
 */
function getModelFolderPath(id) {
  const safeId = String(id || '').trim().replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!safeId) return null;
  return path.join(MODELS_DIR, safeId);
}

/**
 * Check if a path exists
 */
async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read manifest.json from a model folder
 */
async function readManifest(folderPath) {
  const manifestPath = path.join(folderPath, MANIFEST_FILE);
  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed to read manifest at ${manifestPath}:`, e.message);
    return null;
  }
}

/**
 * Write manifest.json to a model folder
 */
async function writeManifest(folderPath, model) {
  const manifestPath = path.join(folderPath, MANIFEST_FILE);
  await fs.writeFile(manifestPath, JSON.stringify(model, null, 2), 'utf8');
}

/**
 * Save base64 images to model folder
 * @param {string} folderPath - Path to model folder
 * @param {Array<{mimeType: string, base64: string}>} images - Images to save
 * @returns {Promise<string[]>} - List of saved filenames
 */
async function saveImagesToFolder(folderPath, images) {
  const savedFiles = [];
  
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (!img || !img.base64) continue;
    
    // Determine extension from mimeType
    let ext = 'jpg';
    if (img.mimeType) {
      if (img.mimeType.includes('png')) ext = 'png';
      else if (img.mimeType.includes('webp')) ext = 'webp';
      else if (img.mimeType.includes('gif')) ext = 'gif';
    }
    
    const filename = `identity-${String(i + 1).padStart(2, '0')}.${ext}`;
    const filePath = path.join(folderPath, filename);
    
    try {
      const buffer = Buffer.from(img.base64, 'base64');
      await fs.writeFile(filePath, buffer);
      savedFiles.push(filename);
    } catch (e) {
      console.error(`Failed to save image ${filename}:`, e.message);
    }
  }
  
  return savedFiles;
}

/**
 * List all image files in a model folder
 */
async function listImageFiles(folderPath) {
  try {
    const entries = await fs.readdir(folderPath);
    return entries.filter(name => 
      /\.(jpg|jpeg|png|webp|gif)$/i.test(name) && name !== MANIFEST_FILE
    );
  } catch {
    return [];
  }
}

/**
 * Get all models
 */
export async function getAllModels() {
  await ensureModelsDir();
  
  const entries = await fs.readdir(MODELS_DIR, { withFileTypes: true });
  const models = [];
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const folderPath = path.join(MODELS_DIR, entry.name);
    const manifest = await readManifest(folderPath);
    
    if (manifest && manifest.id) {
      // Ensure imageFiles is populated
      if (!manifest.imageFiles || manifest.imageFiles.length === 0) {
        manifest.imageFiles = await listImageFiles(folderPath);
      }
      models.push(manifest);
    }
  }
  
  // Sort by updatedAt descending
  models.sort((a, b) => {
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return dateB - dateA;
  });
  
  return models;
}

/**
 * Get model by ID
 */
export async function getModelById(id) {
  const folderPath = getModelFolderPath(id);
  if (!folderPath || !(await pathExists(folderPath))) {
    return null;
  }
  
  const manifest = await readManifest(folderPath);
  if (!manifest) return null;
  
  // Ensure imageFiles is populated
  if (!manifest.imageFiles || manifest.imageFiles.length === 0) {
    manifest.imageFiles = await listImageFiles(folderPath);
  }
  
  return manifest;
}

/**
 * Create a new model
 * @param {Object} modelData - Model data
 * @param {Array<{mimeType: string, base64: string}>} [images] - Images to save
 */
export async function createModel(modelData, images = []) {
  const now = new Date().toISOString();
  
  // Create model object
  const template = createEmptyModel(modelData.name || 'Новая модель');
  const newModel = {
    ...template,
    ...modelData,
    id: modelData.id || template.id,
    dirPath: modelData.id || template.id,
    createdAt: now,
    updatedAt: now
  };
  
  // Validate
  const validation = validateModel(newModel);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  const folderPath = getModelFolderPath(newModel.id);
  if (!folderPath) {
    return { success: false, errors: ['Invalid model ID'] };
  }
  
  // Check if already exists
  if (await pathExists(folderPath)) {
    return { success: false, errors: [`Model with ID "${newModel.id}" already exists`] };
  }
  
  // Create folder and save
  await enqueueWrite(async () => {
    await fs.mkdir(folderPath, { recursive: true });
    
    // Save images if provided
    if (images && images.length > 0) {
      newModel.imageFiles = await saveImagesToFolder(folderPath, images);
      // Set preview to first image
      if (newModel.imageFiles.length > 0) {
        newModel.previewSrc = `${newModel.dirPath}/${newModel.imageFiles[0]}`;
      }
    }
    
    await writeManifest(folderPath, newModel);
  });
  
  return { success: true, model: newModel };
}

/**
 * Update an existing model
 * @param {string} id - Model ID
 * @param {Object} updates - Fields to update
 * @param {Array<{mimeType: string, base64: string}>} [newImages] - New images to add
 */
export async function updateModel(id, updates, newImages = null) {
  const existingModel = await getModelById(id);
  if (!existingModel) {
    return { success: false, errors: [`Model with ID "${id}" not found`] };
  }
  
  const folderPath = getModelFolderPath(id);
  if (!folderPath) {
    return { success: false, errors: ['Invalid model ID'] };
  }
  
  // Merge updates
  const updatedModel = {
    ...existingModel,
    ...updates,
    id: existingModel.id, // ID cannot be changed
    dirPath: existingModel.dirPath, // dirPath cannot be changed
    updatedAt: new Date().toISOString()
  };
  
  // Validate
  const validation = validateModel(updatedModel);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  await enqueueWrite(async () => {
    // Save new images if provided
    if (newImages && newImages.length > 0) {
      // Get existing count to continue numbering
      const existingImages = await listImageFiles(folderPath);
      const startIndex = existingImages.length;
      
      for (let i = 0; i < newImages.length; i++) {
        const img = newImages[i];
        if (!img || !img.base64) continue;
        
        let ext = 'jpg';
        if (img.mimeType) {
          if (img.mimeType.includes('png')) ext = 'png';
          else if (img.mimeType.includes('webp')) ext = 'webp';
          else if (img.mimeType.includes('gif')) ext = 'gif';
        }
        
        const filename = `identity-${String(startIndex + i + 1).padStart(2, '0')}.${ext}`;
        const filePath = path.join(folderPath, filename);
        
        const buffer = Buffer.from(img.base64, 'base64');
        await fs.writeFile(filePath, buffer);
      }
      
      // Update imageFiles list
      updatedModel.imageFiles = await listImageFiles(folderPath);
      
      // Update preview if it was empty
      if (!updatedModel.previewSrc && updatedModel.imageFiles.length > 0) {
        updatedModel.previewSrc = `${updatedModel.dirPath}/${updatedModel.imageFiles[0]}`;
      }
    }
    
    await writeManifest(folderPath, updatedModel);
  });
  
  return { success: true, model: updatedModel };
}

/**
 * Delete a model
 */
export async function deleteModel(id) {
  const folderPath = getModelFolderPath(id);
  if (!folderPath || !(await pathExists(folderPath))) {
    return { success: false, errors: [`Model with ID "${id}" not found`] };
  }
  
  await enqueueWrite(async () => {
    await fs.rm(folderPath, { recursive: true, force: true });
  });
  
  return { success: true };
}

/**
 * Get the absolute path to a model's image
 */
export function getModelImagePath(modelId, filename) {
  const folderPath = getModelFolderPath(modelId);
  if (!folderPath) return null;
  return path.join(folderPath, filename);
}

/**
 * Get models directory path (for serving static files)
 */
export function getModelsDir() {
  return MODELS_DIR;
}

