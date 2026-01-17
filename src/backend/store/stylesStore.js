/**
 * Styles Store
 * 
 * Handles CRUD operations for style presets with disk-based storage.
 * Each preset is stored in its own folder: store/style-presets/{preset-id}/
 * - manifest.json: preset metadata and technical parameters
 * - reference.jpg: the original reference image
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STYLES_DIR = path.resolve(__dirname, 'style-presets');
const MANIFEST_FILE = 'manifest.json';

// Write queue for safe concurrent writes
let writeQueue = Promise.resolve();
function enqueueWrite(task) {
    writeQueue = writeQueue.then(task, task);
    return writeQueue;
}

/**
 * Ensure styles directory exists
 */
async function ensureStylesDir() {
    await fs.mkdir(STYLES_DIR, { recursive: true });
}

/**
 * Get preset folder path by ID
 */
function getPresetFolderPath(id) {
    const safeId = String(id || '').trim().replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!safeId) return null;
    return path.join(STYLES_DIR, safeId);
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
 * Read manifest.json from a preset folder
 */
async function readManifest(folderPath) {
    const manifestPath = path.join(folderPath, MANIFEST_FILE);
    try {
        const raw = await fs.readFile(manifestPath, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.warn(`[StylesStore] Failed to read manifest at ${manifestPath}:`, e.message);
        return null;
    }
}

/**
 * Write manifest.json to a preset folder
 */
async function writeManifest(folderPath, preset) {
    const manifestPath = path.join(folderPath, MANIFEST_FILE);
    await fs.writeFile(manifestPath, JSON.stringify(preset, null, 2), 'utf8');
}

/**
 * Save reference image to preset folder
 * @param {string} folderPath - Path to preset folder
 * @param {{mimeType: string, base64: string}} image - Image to save
 * @returns {Promise<string>} - Saved filename
 */
async function saveReferenceImage(folderPath, image) {
    if (!image || !image.base64) return null;

    // Determine extension from mimeType
    let ext = 'jpg';
    if (image.mimeType) {
        if (image.mimeType.includes('png')) ext = 'png';
        else if (image.mimeType.includes('webp')) ext = 'webp';
    }

    const filename = `reference.${ext}`;
    const filePath = path.join(folderPath, filename);

    try {
        const buffer = Buffer.from(image.base64, 'base64');
        await fs.writeFile(filePath, buffer);
        return filename;
    } catch (e) {
        console.error(`[StylesStore] Failed to save reference image:`, e.message);
        return null;
    }
}

/**
 * Helper to sanitize ID for folder name
 */
function getSafeId(id) {
    return String(id || '').trim().replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Generate a unique ID for a new preset
 */
function generatePresetId(name) {
    const base = (name || 'preset')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 30);
    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`;
}

/**
 * Build preview URL for a preset
 */
function buildPreviewUrl(preset) {
    if (!preset || !preset.id) return '';
    const safeId = getSafeId(preset.id);
    if (preset.referenceImagePath) {
        const filename = path.basename(preset.referenceImagePath);
        return `/api/styles/images/${safeId}/${filename}`;
    }
    return '';
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Get all style presets
 */
export async function getAllPresets() {
    await ensureStylesDir();

    const entries = await fs.readdir(STYLES_DIR, { withFileTypes: true });
    const presets = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const folderPath = path.join(STYLES_DIR, entry.name);
        const manifest = await readManifest(folderPath);

        if (manifest && manifest.id) {
            manifest.previewUrl = buildPreviewUrl(manifest);
            presets.push(manifest);
        }
    }

    // Sort by createdAt descending (newest first)
    presets.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    return presets;
}

/**
 * Get preset by ID
 */
export async function getPresetById(id) {
    const folderPath = getPresetFolderPath(id);
    if (!folderPath || !(await pathExists(folderPath))) {
        return null;
    }

    const manifest = await readManifest(folderPath);
    if (!manifest) return null;

    manifest.previewUrl = buildPreviewUrl(manifest);
    return manifest;
}

/**
 * Create a new style preset
 * @param {Object} presetData - Preset data (name, technicalParams, naturalPrompt, antiAiDirectives)
 * @param {{mimeType: string, base64: string}} referenceImage - Reference image
 */
export async function createPreset(presetData, referenceImage = null) {
    const now = new Date().toISOString();
    const id = generatePresetId(presetData.name);

    const newPreset = {
        id,
        name: presetData.name || 'Новый стиль',
        technicalParams: presetData.technicalParams || {},
        naturalPrompt: presetData.naturalPrompt || '',
        antiAiDirectives: presetData.antiAiDirectives || [],
        variations: presetData.variations || [], // V6: Sub-presets (style variations)
        referenceImagePath: null,
        version: 1,
        createdAt: now,
        updatedAt: now
    };

    const folderPath = getPresetFolderPath(id);
    if (!folderPath) {
        return { success: false, errors: ['Invalid preset ID'] };
    }

    // Check if already exists (shouldn't happen with timestamp ID)
    if (await pathExists(folderPath)) {
        return { success: false, errors: [`Preset with ID "${id}" already exists`] };
    }

    // Create folder and save
    await enqueueWrite(async () => {
        await fs.mkdir(folderPath, { recursive: true });

        // Save reference image if provided
        if (referenceImage && referenceImage.base64) {
            const filename = await saveReferenceImage(folderPath, referenceImage);
            if (filename) {
                newPreset.referenceImagePath = filename;
            }
        }

        await writeManifest(folderPath, newPreset);
    });

    console.log(`[StylesStore] Created preset: ${newPreset.name} (${id})`);
    return { success: true, preset: { ...newPreset, previewUrl: buildPreviewUrl(newPreset) } };
}

/**
 * Update an existing preset
 * @param {string} id - Preset ID
 * @param {Object} updates - Fields to update
 */
export async function updatePreset(id, updates) {
    const existingPreset = await getPresetById(id);
    if (!existingPreset) {
        return { success: false, errors: [`Preset with ID "${id}" not found`] };
    }

    const folderPath = getPresetFolderPath(id);
    if (!folderPath) {
        return { success: false, errors: ['Invalid preset ID'] };
    }

    // Merge updates (preserve id, referenceImagePath, createdAt)
    const updatedPreset = {
        ...existingPreset,
        name: updates.name ?? existingPreset.name,
        technicalParams: updates.technicalParams ?? existingPreset.technicalParams,
        naturalPrompt: updates.naturalPrompt ?? existingPreset.naturalPrompt,
        antiAiDirectives: updates.antiAiDirectives ?? existingPreset.antiAiDirectives,
        variations: updates.variations ?? existingPreset.variations ?? [], // V6: Sub-presets
        version: (existingPreset.version || 1) + 1,
        updatedAt: new Date().toISOString()
    };

    await enqueueWrite(async () => {
        await writeManifest(folderPath, updatedPreset);
    });

    console.log(`[StylesStore] Updated preset: ${updatedPreset.name} (v${updatedPreset.version})`);
    return { success: true, preset: { ...updatedPreset, previewUrl: buildPreviewUrl(updatedPreset) } };
}

/**
 * Delete a preset
 */
export async function deletePreset(id) {
    const folderPath = getPresetFolderPath(id);
    if (!folderPath || !(await pathExists(folderPath))) {
        return { success: false, errors: [`Preset with ID "${id}" not found`] };
    }

    await enqueueWrite(async () => {
        await fs.rm(folderPath, { recursive: true, force: true });
    });

    console.log(`[StylesStore] Deleted preset: ${id}`);
    return { success: true };
}

/**
 * Get the absolute path to a preset's image
 */
export function getPresetImagePath(presetId, filename) {
    const folderPath = getPresetFolderPath(presetId);
    if (!folderPath) return null;
    return path.join(folderPath, filename);
}

/**
 * Get styles directory path (for serving static files)
 */
export function getStylesDir() {
    return STYLES_DIR;
}
