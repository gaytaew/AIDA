/**
 * Universe Store
 * 
 * File-based storage for universes.
 * Each universe is stored as a separate JSON file in store/universes/
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  validateUniverse,
  createEmptyUniverse,
  mergeUniverseUpdates
} from '../schema/universe.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UNIVERSES_DIR = path.resolve(__dirname, 'universes');

// ═══════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════

async function ensureDir() {
  await fs.mkdir(UNIVERSES_DIR, { recursive: true });
}

function safeFileName(id) {
  return String(id || '').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildFilePath(id) {
  const name = safeFileName(id);
  if (!name) return null;
  return path.join(UNIVERSES_DIR, `${name}.json`);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readUniverseFromFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return { ok: true, universe: parsed };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Write queue to prevent race conditions
let writeQueue = Promise.resolve();
function enqueueWrite(task) {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Get all universes
 */
export async function getAllUniverses() {
  await ensureDir();
  
  const entries = await fs.readdir(UNIVERSES_DIR);
  const jsonFiles = entries.filter(name => name.endsWith('.json'));
  
  const universes = [];
  for (const file of jsonFiles) {
    const filePath = path.join(UNIVERSES_DIR, file);
    const result = await readUniverseFromFile(filePath);
    if (result.ok && result.universe) {
      universes.push(result.universe);
    }
  }
  
  // Sort by updatedAt descending
  universes.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0);
    const dateB = new Date(b.updatedAt || b.createdAt || 0);
    return dateB - dateA;
  });
  
  return universes;
}

/**
 * Get universe by ID
 */
export async function getUniverseById(id) {
  if (!id) return null;
  
  await ensureDir();
  const filePath = buildFilePath(id);
  if (!filePath) return null;
  
  if (!(await fileExists(filePath))) return null;
  
  const result = await readUniverseFromFile(filePath);
  return result.ok ? result.universe : null;
}

/**
 * Create new universe
 */
export async function createUniverse(data) {
  const universe = data && typeof data === 'object'
    ? { ...createEmptyUniverse(data.label), ...data }
    : createEmptyUniverse();
  
  // Ensure timestamps
  const now = new Date().toISOString();
  if (!universe.createdAt) universe.createdAt = now;
  universe.updatedAt = now;
  
  // Validate
  const validation = validateUniverse(universe);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  // Check if exists
  const existing = await getUniverseById(universe.id);
  if (existing) {
    return { success: false, errors: [`Universe with ID "${universe.id}" already exists`] };
  }
  
  // Write file
  const filePath = buildFilePath(universe.id);
  if (!filePath) {
    return { success: false, errors: ['Invalid universe ID'] };
  }
  
  await enqueueWrite(async () => {
    await ensureDir();
    await fs.writeFile(filePath, JSON.stringify(universe, null, 2), 'utf8');
  });
  
  return { success: true, universe };
}

/**
 * Update existing universe
 */
export async function updateUniverse(id, updates) {
  if (!id) {
    return { success: false, errors: ['ID is required'] };
  }
  
  const existing = await getUniverseById(id);
  if (!existing) {
    return { success: false, errors: [`Universe "${id}" not found`] };
  }
  
  // Merge updates
  const updated = mergeUniverseUpdates(existing, updates);
  updated.id = id; // Prevent ID change
  
  // Validate
  const validation = validateUniverse(updated);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  // Write file
  const filePath = buildFilePath(id);
  
  await enqueueWrite(async () => {
    await ensureDir();
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
  });
  
  return { success: true, universe: updated };
}

/**
 * Delete universe
 */
export async function deleteUniverse(id) {
  if (!id) {
    return { success: false, errors: ['ID is required'] };
  }
  
  const filePath = buildFilePath(id);
  if (!filePath) {
    return { success: false, errors: ['Invalid ID'] };
  }
  
  if (!(await fileExists(filePath))) {
    return { success: false, errors: [`Universe "${id}" not found`] };
  }
  
  await enqueueWrite(async () => {
    await fs.unlink(filePath);
  });
  
  return { success: true };
}

/**
 * Get options for UI dropdowns
 */
export { UNIVERSE_OPTIONS } from '../schema/universe.js';

