/**
 * Frame Store
 * 
 * File-based storage for frames (shot presets).
 * Supports CRUD operations, filtering by category/tags, and search.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  validateFrame,
  createEmptyFrame,
  buildFramePromptSnippet,
  DEFAULT_TECHNICAL
} from '../schema/frame.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRAMES_DIR = path.resolve(__dirname, 'frames');

// ═══════════════════════════════════════════════════════════════
// FILE SYSTEM HELPERS
// ═══════════════════════════════════════════════════════════════

let writeQueue = Promise.resolve();

function enqueueWrite(task) {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

async function ensureFramesDir() {
  await fs.mkdir(FRAMES_DIR, { recursive: true });
}

function buildFrameFilePath(id) {
  const safe = String(id || '').trim().replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!safe) return null;
  return path.join(FRAMES_DIR, `${safe}.json`);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readFrameFromFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const v = validateFrame(parsed);
    if (!v.valid) {
      return { ok: false, error: `Invalid frame in "${path.basename(filePath)}": ${v.errors.join('; ')}` };
    }
    return { ok: true, frame: parsed };
  } catch (e) {
    return { ok: false, error: `Failed to read "${path.basename(filePath)}": ${e.message}` };
  }
}

// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Add sketchUrl convenience field from sketchAsset
 */
function enrichFrameWithSketchUrl(frame) {
  if (!frame) return frame;
  
  // Extract sketchUrl from sketchAsset for frontend convenience
  if (frame.sketchAsset?.url) {
    frame.sketchUrl = frame.sketchAsset.url;
  } else if (frame.sketchAsset?.base64) {
    const mimeType = frame.sketchAsset.mimeType || 'image/png';
    frame.sketchUrl = `data:${mimeType};base64,${frame.sketchAsset.base64}`;
  }
  
  return frame;
}

/**
 * Get all frames
 */
export async function getAllFrames() {
  await ensureFramesDir();
  const entries = await fs.readdir(FRAMES_DIR);
  const jsonFiles = entries
    .filter(name => typeof name === 'string' && name.toLowerCase().endsWith('.json'))
    .map(name => path.join(FRAMES_DIR, name));

  const frames = [];
  for (const filePath of jsonFiles) {
    const res = await readFrameFromFile(filePath);
    if (res.ok) {
      frames.push(enrichFrameWithSketchUrl(res.frame));
    }
  }

  // Sort by updatedAt (newest first)
  frames.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  return frames;
}

/**
 * Get frames filtered by category
 */
export async function getFramesByCategory(category) {
  const all = await getAllFrames();
  return all.filter(f => 
    f.category === category || 
    (Array.isArray(f.categories) && f.categories.includes(category))
  );
}

/**
 * Get frames filtered by tags (any match)
 */
export async function getFramesByTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return getAllFrames();
  }
  
  const all = await getAllFrames();
  return all.filter(f => {
    if (!Array.isArray(f.tags)) return false;
    return tags.some(tag => f.tags.includes(tag));
  });
}

/**
 * Search frames by text (label, description)
 */
export async function searchFrames(query) {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return getAllFrames();

  const all = await getAllFrames();
  return all.filter(f => {
    const label = (f.label || '').toLowerCase();
    const desc = (f.description || '').toLowerCase();
    const tags = (f.tags || []).join(' ').toLowerCase();
    return label.includes(q) || desc.includes(q) || tags.includes(q);
  });
}

/**
 * Get a single frame by ID
 */
export async function getFrameById(id) {
  const key = String(id || '').trim();
  if (!key) return null;

  const filePath = buildFrameFilePath(key);
  if (!filePath || !(await fileExists(filePath))) return null;

  const res = await readFrameFromFile(filePath);
  return res.ok ? enrichFrameWithSketchUrl(res.frame) : null;
}

/**
 * Create a new frame
 */
export async function createFrame(data) {
  const now = new Date().toISOString();

  const newFrame = {
    ...createEmptyFrame(data.label, data.category),
    ...data,
    technical: {
      ...DEFAULT_TECHNICAL,
      ...(data.technical || {})
    },
    createdAt: now,
    updatedAt: now
  };

  // Auto-generate prompt snippet if not provided
  if (!newFrame.promptSnippet) {
    newFrame.promptSnippet = buildFramePromptSnippet(newFrame);
  }

  const v = validateFrame(newFrame);
  if (!v.valid) {
    return { success: false, errors: v.errors };
  }

  const filePath = buildFrameFilePath(newFrame.id);
  if (!filePath) {
    return { success: false, errors: ['Invalid frame ID'] };
  }

  if (await fileExists(filePath)) {
    return { success: false, errors: [`Frame "${newFrame.id}" already exists`] };
  }

  await enqueueWrite(async () => {
    await ensureFramesDir();
    await fs.writeFile(filePath, JSON.stringify(newFrame, null, 2), 'utf8');
  });

  return { success: true, frame: newFrame };
}

/**
 * Update an existing frame
 */
export async function updateFrame(id, updates) {
  const existing = await getFrameById(id);
  if (!existing) {
    return { success: false, errors: [`Frame "${id}" not found`] };
  }

  const updated = {
    ...existing,
    ...updates,
    id: existing.id, // ID cannot change
    technical: {
      ...(existing.technical || DEFAULT_TECHNICAL),
      ...(updates.technical || {})
    },
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };

  // Regenerate prompt snippet if technical or description changed
  if (updates.technical || updates.description) {
    updated.promptSnippet = buildFramePromptSnippet(updated);
  }

  const v = validateFrame(updated);
  if (!v.valid) {
    return { success: false, errors: v.errors };
  }

  const filePath = buildFrameFilePath(id);
  if (!filePath) {
    return { success: false, errors: ['Invalid frame ID'] };
  }

  await enqueueWrite(async () => {
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
  });

  return { success: true, frame: updated };
}

/**
 * Delete a frame
 */
export async function deleteFrame(id) {
  const filePath = buildFrameFilePath(id);
  if (!filePath || !(await fileExists(filePath))) {
    return { success: false, errors: [`Frame "${id}" not found`] };
  }

  await enqueueWrite(async () => {
    await fs.unlink(filePath);
  });

  return { success: true };
}

/**
 * Get frame options for UI
 */
export { FRAME_OPTIONS } from '../schema/frame.js';

