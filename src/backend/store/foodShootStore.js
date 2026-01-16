/**
 * Food Shoot Store
 * 
 * File-based storage for Food Shoots.
 * Modeled after customShootStore.js but simplified for Food vertical.
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

async function initStores() {
    await ensureDir(STORE_DIR);
    await ensureDir(IMAGES_DIR);
}

initStores().catch(console.error);

// ═══════════════════════════════════════════════════════════════
// INDEX MANAGEMENT
// ═══════════════════════════════════════════════════════════════

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
        throw err;
    }
}

async function writeIndex(index) {
    indexCache = index;
    indexCacheTime = Date.now();
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
}

async function rebuildIndex() {
    console.log('[FoodShootStore] Rebuilding index...');

    const files = await fs.readdir(STORE_DIR);
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
                imageCount: shoot.images?.length || 0,
                previewUrl: shoot.images?.[0]?.imageUrl || null
            });
        } catch (err) {
            console.error(`[FoodShootStore] Error reading ${file}:`, err.message);
        }
    }

    // Sort by updatedAt descending
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
            imageCount: shoot.images?.length || 0,
            previewUrl: shoot.images?.[0]?.imageUrl || null
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
// CRUD
// ═══════════════════════════════════════════════════════════════

export async function getAllFoodShoots() {
    await initStores();
    try {
        const index = await readIndex();
        return index.shoots || [];
    } catch (err) {
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
        return null; // Not found
    }
}

export async function createFoodShoot(label = 'New Food Shoot') {
    await initStores();
    const id = `FOOD_${Date.now()}_${randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();

    const shoot = {
        id,
        label,
        createdAt: now,
        updatedAt: now,
        images: []
    };

    const filePath = path.join(STORE_DIR, `${id}.json`);
    await atomicWriteFile(filePath, JSON.stringify(shoot, null, 2));
    await updateIndexEntry(shoot);

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
        const shoot = await getFoodShootById(id);
        if (shoot && shoot.images) {
            for (const img of shoot.images) {
                await deleteImageFile(id, img.id);
            }
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
// IMAGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function buildImagePath(shootId, imageId) {
    // Create shoot subdir for images to keep things organized
    return path.join(IMAGES_DIR, shootId, `${imageId}.jpg`);
}

async function deleteImageFile(shootId, imageId) {
    const p = buildImagePath(shootId, imageId);
    try {
        await fs.unlink(p);
    } catch (e) {
        // ignore
    }
}

/**
 * Saves a generated image to the shoot.
 * @param {string} shootId 
 * @param {string} base64Data - Raw base64 string (without data: prefix) or Data URL
 * @param {object} params - Generation parameters
 */
export async function addImageToFoodShoot(shootId, base64Data, params = {}) {
    await initStores();

    // Ensure shoot images dir exists
    const shootImgDir = path.join(IMAGES_DIR, shootId);
    await ensureDir(shootImgDir);

    const imageId = `IMG_${Date.now()}`;
    const imagePath = buildImagePath(shootId, imageId);

    // Normalize Base64
    let cleanBase64 = base64Data;
    if (base64Data.includes('base64,')) {
        cleanBase64 = base64Data.split('base64,')[1];
    }

    // Save to disk
    await fs.writeFile(imagePath, Buffer.from(cleanBase64, 'base64'));

    // Image Object
    const imageEntry = {
        id: imageId,
        createdAt: new Date().toISOString(),
        params: params,
        imageUrl: `/api/food-shoots/${shootId}/images/${imageId}`, // Public URL
        localPath: imagePath // Internal use
    };

    // Update Shoot
    const shoot = await getFoodShootById(shootId);
    if (!shoot) throw new Error(`Shoot ${shootId} not found`);

    shoot.images.unshift(imageEntry); // Newest first

    await updateFoodShoot(shootId, { images: shoot.images });

    return imageEntry;
}

export default {
    getAllFoodShoots,
    getFoodShootById,
    createFoodShoot,
    updateFoodShoot,
    deleteFoodShoot,
    addImageToFoodShoot
};
