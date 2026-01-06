/**
 * Location Store
 * 
 * File-based storage for locations.
 * Supports CRUD operations, filtering by category/tags, and search.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  validateLocation,
  createEmptyLocation,
  buildLocationPromptSnippet,
  DEFAULT_LIGHTING
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
 * Get all locations
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
 * Get locations filtered by category
 */
export async function getLocationsByCategory(category) {
  const all = await getAllLocations();
  return all.filter(l => l.category === category);
}

/**
 * Get locations filtered by tags (any match)
 */
export async function getLocationsByTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return getAllLocations();
  }
  
  const all = await getAllLocations();
  return all.filter(l => {
    if (!Array.isArray(l.tags)) return false;
    return tags.some(tag => l.tags.includes(tag));
  });
}

/**
 * Search locations by text (label, description)
 */
export async function searchLocations(query) {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return getAllLocations();

  const all = await getAllLocations();
  return all.filter(l => {
    const label = (l.label || '').toLowerCase();
    const desc = (l.description || '').toLowerCase();
    const tags = (l.tags || []).join(' ').toLowerCase();
    return label.includes(q) || desc.includes(q) || tags.includes(q);
  });
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
    ...createEmptyLocation(data.label, data.category),
    ...data,
    lighting: {
      ...DEFAULT_LIGHTING,
      ...(data.lighting || {})
    },
    props: Array.isArray(data.props) ? data.props : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    createdAt: now,
    updatedAt: now
  };

  // Auto-generate prompt snippet if not provided
  if (!newLocation.promptSnippet) {
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
    lighting: {
      ...(existing.lighting || DEFAULT_LIGHTING),
      ...(updates.lighting || {})
    },
    props: Array.isArray(updates.props) ? updates.props : (existing.props || []),
    tags: Array.isArray(updates.tags) ? updates.tags : (existing.tags || []),
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };

  // Regenerate prompt snippet if relevant fields changed
  if (updates.description || updates.environmentType || updates.lighting || updates.surface || updates.props) {
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
 * Get location options for UI
 */
export { LOCATION_OPTIONS } from '../schema/location.js';
