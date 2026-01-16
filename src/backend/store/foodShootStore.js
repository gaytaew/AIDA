/**
 * Food Shoot Store
 * 
 * File-based storage for Food Shoots.
 * Hierarchical model: Shoot -> Frame (Block) -> Snapshot (Image)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store directory
const STORE_DIR = path.join(__dirname, 'food-shoots');
const IMAGES_DIR = path.join(__dirname, 'food-shoot-images');
const INDEX_FILE = path.join(STORE_DIR, '_index.json');

// In-memory cache
let indexCache = null;
let indexCacheTime = 0;
const INDEX_CACHE_TTL = 5000; // 5 seconds

// ═══════════════════════════════════════════════════════════════
// FILE SYSTEM HELPERS
// ═══════════════════════════════════════════════════════════════

async function ensureDir(dir) {
    try {
        await fs.access(dir);
    } catch {
        console.log(`[FoodShootStore] Creating directory: ${dir}`);
        await fs.mkdir(dir, { recursive: true });
    }
}

async function atomicWriteFile(filePath, content) {
    const tempPath = filePath + '.tmp.' + randomBytes(4).toString('hex');
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, filePath);
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

let initPromise = null;

async function initStores() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            await ensureDir(STORE_DIR);
            await ensureDir(IMAGES_DIR);
            console.log('[FoodShootStore] Initialized successfully');
        } catch (err) {
            console.error('[FoodShootStore] Failed to initialize directories:', err);
            throw err;
        }
    })();

    return initPromise;
}

// Force init immediately, then rebuild index
(async () => {
    try {
        await initStores();
        await rebuildIndex();
        console.log('[FoodShootStore] Index rebuilt on startup');
    } catch (e) {
        console.error('[FoodShootStore] Startup error:', e);
    }
})();

// ═══════════════════════════════════════════════════════════════
// INDEX MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Count total snapshots across all frames
 */
function countSnapshots(shoot) {
    if (!shoot.frames?.length) return 0;
    return shoot.frames.reduce((sum, frame) => sum + (frame.snapshots?.length || 0), 0);
}

/**
 * Get preview URL from first frame's first snapshot
 */
function getPreviewUrl(shoot) {
    const firstFrame = shoot.frames?.[0];
    const firstSnapshot = firstFrame?.snapshots?.[0];
    return firstSnapshot?.imageUrl || null;
}

async function readIndex() {
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
            return await rebuildIndex();
        }
        console.error('[FoodShootStore] Error reading index:', err);
        return { shoots: [], rebuiltAt: new Date().toISOString() };
    }
}

async function writeIndex(index) {
    indexCache = index;
    indexCacheTime = Date.now();
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
}

async function rebuildIndex() {
    console.log('[FoodShootStore] Rebuilding index...');
    await initStores();

    let files = [];
    try {
        files = await fs.readdir(STORE_DIR);
    } catch (e) {
        console.error('[FoodShootStore] Failed to read dir for index:', e);
        return { shoots: [], rebuiltAt: new Date().toISOString() };
    }

    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('_'));
    const shoots = [];

    for (const file of jsonFiles) {
        try {
            const filePath = path.join(STORE_DIR, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const shoot = JSON.parse(content);

            shoots.push({
                id: shoot.id,
                label: shoot.label,
                createdAt: shoot.createdAt,
                updatedAt: shoot.updatedAt,
                frameCount: shoot.frames?.length || 0,
                snapshotCount: countSnapshots(shoot),
                previewUrl: getPreviewUrl(shoot)
            });
        } catch (err) {
            console.error(`[FoodShootStore] Error reading ${file}:`, err.message);
        }
    }

    shoots.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const index = { shoots, rebuiltAt: new Date().toISOString() };
    await writeIndex(index);
    return index;
}

async function updateIndexEntry(shoot) {
    try {
        const index = await readIndex();

        const entry = {
            id: shoot.id,
            label: shoot.label,
            createdAt: shoot.createdAt,
            updatedAt: shoot.updatedAt,
            frameCount: shoot.frames?.length || 0,
            snapshotCount: countSnapshots(shoot),
            previewUrl: getPreviewUrl(shoot)
        };

        const existingIdx = index.shoots.findIndex(s => s.id === shoot.id);
        if (existingIdx >= 0) {
            index.shoots[existingIdx] = entry;
        } else {
            index.shoots.unshift(entry);
        }

        index.shoots.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        await writeIndex(index);
    } catch (err) {
        console.error('[FoodShootStore] Error updating index:', err);
        indexCache = null;
    }
}

// ═══════════════════════════════════════════════════════════════
// CRUD - SHOOTS
// ═══════════════════════════════════════════════════════════════

export async function getAllFoodShoots() {
    await initStores();
    try {
        const index = await readIndex();
        return index.shoots || [];
    } catch (err) {
        console.error('[FoodShootStore] getAll failed:', err);
        return [];
    }
}

export async function getFoodShootById(id) {
    await initStores();
    const filePath = path.join(STORE_DIR, `${id}.json`);
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (err) {
        return null;
    }
}

export async function createFoodShoot(label = 'Новая съёмка') {
    await initStores();
    console.log(`[FoodShootStore] Creating shoot: ${label}`);

    const id = `FOOD_${Date.now()}_${randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();

    const shoot = {
        id,
        label,
        createdAt: now,
        updatedAt: now,
        frames: [] // Hierarchical: frames contain snapshots
    };

    const filePath = path.join(STORE_DIR, `${id}.json`);
    await atomicWriteFile(filePath, JSON.stringify(shoot, null, 2));
    await updateIndexEntry(shoot);

    console.log(`[FoodShootStore] Created: ${id}`);
    return shoot;
}

export async function updateFoodShoot(id, updates) {
    await initStores();
    const filePath = path.join(STORE_DIR, `${id}.json`);

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const shoot = JSON.parse(content);

        const updatedShoot = {
            ...shoot,
            ...updates,
            id: shoot.id, // Immutable
            updatedAt: new Date().toISOString()
        };

        await atomicWriteFile(filePath, JSON.stringify(updatedShoot, null, 2));
        await updateIndexEntry(updatedShoot);

        return updatedShoot;
    } catch (err) {
        throw new Error(`Shoot ${id} not found`);
    }
}

export async function deleteFoodShoot(id) {
    await initStores();
    const filePath = path.join(STORE_DIR, `${id}.json`);

    try {
        // Delete all images associated with this shoot
        const shootImgDir = path.join(IMAGES_DIR, id);
        try {
            await fs.rm(shootImgDir, { recursive: true });
        } catch (e) {
            // Ignore if dir doesn't exist
        }

        await fs.unlink(filePath);

        // Remove from index
        const index = await readIndex();
        index.shoots = index.shoots.filter(s => s.id !== id);
        await writeIndex(index);

        return true;
    } catch (err) {
        if (err.code === 'ENOENT') return false;
        throw err;
    }
}

// ═══════════════════════════════════════════════════════════════
// FRAME MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Add a new Frame to a Shoot.
 * @param {string} shootId 
 * @param {object} params - Generation parameters for this frame
 * @returns {object} The created frame
 */
export async function addFrame(shootId, params = {}) {
    const shoot = await getFoodShootById(shootId);
    if (!shoot) throw new Error(`Shoot ${shootId} not found`);

    const frameId = `FRM_${Date.now()}_${randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();

    const frame = {
        id: frameId,
        createdAt: now,
        params: params,
        snapshots: []
    };

    if (!shoot.frames) shoot.frames = [];
    shoot.frames.unshift(frame); // Newest first

    await updateFoodShoot(shootId, { frames: shoot.frames });
    console.log(`[FoodShootStore] Added frame ${frameId} to ${shootId}`);

    return frame;
}

/**
 * Delete a Frame and all its snapshots.
 */
export async function deleteFrame(shootId, frameId) {
    const shoot = await getFoodShootById(shootId);
    if (!shoot) throw new Error(`Shoot ${shootId} not found`);

    const frameIndex = shoot.frames?.findIndex(f => f.id === frameId);
    if (frameIndex < 0) throw new Error(`Frame ${frameId} not found`);

    const frame = shoot.frames[frameIndex];

    // Delete all snapshot image files
    for (const snap of frame.snapshots || []) {
        await deleteSnapshotFile(shootId, snap.id);
    }

    shoot.frames.splice(frameIndex, 1);
    await updateFoodShoot(shootId, { frames: shoot.frames });

    console.log(`[FoodShootStore] Deleted frame ${frameId}`);
    return true;
}

// ═══════════════════════════════════════════════════════════════
// SNAPSHOT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function buildSnapshotPath(shootId, snapshotId) {
    return path.join(IMAGES_DIR, shootId, `${snapshotId}.jpg`);
}

async function deleteSnapshotFile(shootId, snapshotId) {
    const p = buildSnapshotPath(shootId, snapshotId);
    try {
        await fs.unlink(p);
    } catch (e) {
        // ignore
    }
}

/**
 * Add a Snapshot (image) to a Frame.
 * @param {string} shootId 
 * @param {string} frameId 
 * @param {string} base64Data - Base64 image data
 * @param {object} meta - Additional metadata
 * @returns {object} The created snapshot
 */
export async function addSnapshot(shootId, frameId, base64Data, meta = {}) {
    await initStores();
    console.log(`[FoodShootStore] Adding snapshot to frame ${frameId}`);

    if (!base64Data || base64Data.length < 100) {
        throw new Error('Invalid base64 data (too short)');
    }

    const shoot = await getFoodShootById(shootId);
    if (!shoot) throw new Error(`Shoot ${shootId} not found`);

    const frame = shoot.frames?.find(f => f.id === frameId);
    if (!frame) throw new Error(`Frame ${frameId} not found`);

    // Ensure shoot images dir exists
    const shootImgDir = path.join(IMAGES_DIR, shootId);
    await ensureDir(shootImgDir);

    const snapshotId = `SNAP_${Date.now()}_${randomBytes(2).toString('hex')}`;
    const snapshotPath = buildSnapshotPath(shootId, snapshotId);

    // Normalize Base64
    let cleanBase64 = base64Data;
    if (base64Data.includes('base64,')) {
        cleanBase64 = base64Data.split('base64,')[1];
    }

    // Save to disk
    await fs.writeFile(snapshotPath, Buffer.from(cleanBase64, 'base64'));

    const snapshot = {
        id: snapshotId,
        createdAt: new Date().toISOString(),
        imageUrl: `/api/food-shoots/${shootId}/images/${snapshotId}`,
        localPath: snapshotPath,
        ...meta
    };

    if (!frame.snapshots) frame.snapshots = [];
    frame.snapshots.push(snapshot); // Order: oldest to newest (left to right)

    await updateFoodShoot(shootId, { frames: shoot.frames });
    console.log(`[FoodShootStore] Snapshot saved: ${snapshotId}`);

    return snapshot;
}

/**
 * Delete a single Snapshot from a Frame.
 */
export async function deleteSnapshot(shootId, frameId, snapshotId) {
    const shoot = await getFoodShootById(shootId);
    if (!shoot) throw new Error(`Shoot ${shootId} not found`);

    const frame = shoot.frames?.find(f => f.id === frameId);
    if (!frame) throw new Error(`Frame ${frameId} not found`);

    const snapIndex = frame.snapshots?.findIndex(s => s.id === snapshotId);
    if (snapIndex < 0) throw new Error(`Snapshot ${snapshotId} not found`);

    await deleteSnapshotFile(shootId, snapshotId);
    frame.snapshots.splice(snapIndex, 1);

    await updateFoodShoot(shootId, { frames: shoot.frames });
    console.log(`[FoodShootStore] Deleted snapshot ${snapshotId}`);

    return true;
}

// ═══════════════════════════════════════════════════════════════
// LEGACY COMPAT (for existing routes)
// ═══════════════════════════════════════════════════════════════

/**
 * Legacy: Add image to shoot by creating a new auto-frame.
 * Used by existing /generate endpoint.
 */
export async function addImageToFoodShoot(shootId, base64Data, params = {}) {
    // Create a new frame with the provided params
    const frame = await addFrame(shootId, params);
    // Add the snapshot to this frame
    const snapshot = await addSnapshot(shootId, frame.id, base64Data, {});
    return {
        ...snapshot,
        frameId: frame.id
    };
}

export default {
    getAllFoodShoots,
    getFoodShootById,
    createFoodShoot,
    updateFoodShoot,
    deleteFoodShoot,
    // Frame operations
    addFrame,
    deleteFrame,
    // Snapshot operations
    addSnapshot,
    deleteSnapshot,
    // Legacy
    addImageToFoodShoot
};
