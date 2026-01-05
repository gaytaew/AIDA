/**
 * Location Store
 * 
 * File-based storage for locations.
 * Locations can be:
 * 1. Part of a universe (originUniverseId set)
 * 2. Global (originUniverseId null) — standalone locations for reuse
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  validateLocation,
  createEmptyLocation,
  buildLocationPromptSnippet,
  LOCATION_CATEGORIES
} from '../schema/location.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCATIONS_DIR = path.resolve(__dirname, 'locations');

// ═══════════════════════════════════════════════════════════════
// FILE SYSTEM HELPERS
// ═══════════════════════════════════════════════════════════════

let writeQueue = Promise.resolve();

function enqueueWrite(task) {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

async function ensureLocationsDir() {
  await fs.mkdir(LOCATIONS_DIR, { recursive: true });
}

function buildLocationFilePath(id) {
  const safe = String(id || '').trim().replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!safe) return null;
  return path.join(LOCATIONS_DIR, `${safe}.json`);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readLocationFromFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const v = validateLocation(parsed);
    if (!v.valid) {
      return { ok: false, error: `Invalid location in "${path.basename(filePath)}": ${v.errors.join('; ')}` };
    }
    return { ok: true, location: parsed };
  } catch (e) {
    return { ok: false, error: `Failed to read "${path.basename(filePath)}": ${e.message}` };
  }
}

// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get all locations (global catalog)
 */
export async function getAllLocations() {
  await ensureLocationsDir();
  const entries = await fs.readdir(LOCATIONS_DIR);
  const jsonFiles = entries
    .filter(name => typeof name === 'string' && name.toLowerCase().endsWith('.json'))
    .map(name => path.join(LOCATIONS_DIR, name));

  const locations = [];
  for (const filePath of jsonFiles) {
    const res = await readLocationFromFile(filePath);
    if (res.ok) {
      locations.push(res.location);
    }
  }
  
  // Sort by updatedAt (newest first)
  locations.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  
  return locations;
}

/**
 * Get locations filtered by universe
 */
export async function getLocationsByUniverse(universeId) {
  const all = await getAllLocations();
  return all.filter(loc => loc.originUniverseId === universeId);
}

/**
 * Get locations filtered by category
 */
export async function getLocationsByCategory(category) {
  const all = await getAllLocations();
  return all.filter(loc => loc.category === category);
}

/**
 * Get a single location by ID
 */
export async function getLocationById(id) {
  const key = String(id || '').trim();
  if (!key) return null;
  
  const filePath = buildLocationFilePath(key);
  if (!filePath || !(await fileExists(filePath))) return null;
  
  const res = await readLocationFromFile(filePath);
  return res.ok ? res.location : null;
}

/**
 * Create a new location
 */
export async function createLocation(data) {
  const now = new Date().toISOString();
  
  const newLocation = {
    ...createEmptyLocation(data.label, data.originUniverseId),
    ...data,
    createdAt: now,
    updatedAt: now
  };
  
  // Auto-generate prompt snippet if not provided
  if (!newLocation.promptSnippet && newLocation.description) {
    newLocation.promptSnippet = buildLocationPromptSnippet(newLocation);
  }
  
  const v = validateLocation(newLocation);
  if (!v.valid) {
    return { success: false, errors: v.errors };
  }
  
  const filePath = buildLocationFilePath(newLocation.id);
  if (!filePath) {
    return { success: false, errors: ['Invalid location ID'] };
  }
  
  if (await fileExists(filePath)) {
    return { success: false, errors: [`Location "${newLocation.id}" already exists`] };
  }
  
  await enqueueWrite(async () => {
    await ensureLocationsDir();
    await fs.writeFile(filePath, JSON.stringify(newLocation, null, 2), 'utf8');
  });
  
  return { success: true, location: newLocation };
}

/**
 * Update an existing location
 */
export async function updateLocation(id, updates) {
  const existing = await getLocationById(id);
  if (!existing) {
    return { success: false, errors: [`Location "${id}" not found`] };
  }
  
  const updated = {
    ...existing,
    ...updates,
    id: existing.id, // ID cannot change
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };
  
  // Regenerate prompt snippet if description changed
  if (updates.description && !updates.promptSnippet) {
    updated.promptSnippet = buildLocationPromptSnippet(updated);
  }
  
  const v = validateLocation(updated);
  if (!v.valid) {
    return { success: false, errors: v.errors };
  }
  
  const filePath = buildLocationFilePath(id);
  if (!filePath) {
    return { success: false, errors: ['Invalid location ID'] };
  }
  
  await enqueueWrite(async () => {
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
  });
  
  return { success: true, location: updated };
}

/**
 * Delete a location
 */
export async function deleteLocation(id) {
  const filePath = buildLocationFilePath(id);
  if (!filePath || !(await fileExists(filePath))) {
    return { success: false, errors: [`Location "${id}" not found`] };
  }
  
  await enqueueWrite(async () => {
    await fs.unlink(filePath);
  });
  
  return { success: true };
}

/**
 * Bulk save locations (used when saving universe with locations)
 */
export async function bulkSaveLocations(locations) {
  if (!Array.isArray(locations)) return { success: false, errors: ['Locations must be an array'] };
  
  const results = [];
  
  for (const loc of locations) {
    const existing = await getLocationById(loc.id);
    
    if (existing) {
      const res = await updateLocation(loc.id, loc);
      results.push({ id: loc.id, action: 'updated', success: res.success });
    } else {
      const res = await createLocation(loc);
      results.push({ id: loc.id, action: 'created', success: res.success });
    }
  }
  
  return { success: true, results };
}

/**
 * Get location options for UI
 */
export function getLocationOptions() {
  return {
    categories: LOCATION_CATEGORIES,
    lighting: {
      type: ['natural', 'artificial', 'mixed'],
      quality: ['soft', 'hard', 'dramatic', 'flat'],
      temperature: ['warm', 'cool', 'neutral', 'mixed']
    },
    atmosphere: {
      spaceFeeling: ['intimate', 'expansive', 'claustrophobic', 'open'],
      crowdLevel: ['busy', 'quiet', 'isolated', 'public'],
      timeOfDay: ['day', 'night', 'golden_hour', 'blue_hour', 'any'],
      season: ['summer', 'winter', 'autumn', 'spring', 'any']
    }
  };
}

