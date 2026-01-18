/**
 * Product Shoot Store
 * 
 * Файловое хранилище для предметных съёмок.
 * Иерархия: Shoot -> Frame -> Snapshot
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Директории хранения
const STORE_DIR = path.join(__dirname, 'product-shoots');
const IMAGES_DIR = path.join(__dirname, 'product-shoot-images');
const INDEX_FILE = path.join(STORE_DIR, '_index.json');

// Кэш индекса в памяти
let indexCache = null;
let indexCacheTime = 0;
const INDEX_CACHE_TTL = 5000;

// ═══════════════════════════════════════════════════════════════
// ФАЙЛОВЫЕ ХЕЛПЕРЫ
// ═══════════════════════════════════════════════════════════════

async function ensureDir(dir) {
    try {
        await fs.access(dir);
    } catch {
        console.log(`[ProductShootStore] Creating directory: ${dir}`);
        await fs.mkdir(dir, { recursive: true });
    }
}

async function atomicWriteFile(filePath, content) {
    const tempPath = filePath + '.tmp.' + randomBytes(4).toString('hex');
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, filePath);
}

// ═══════════════════════════════════════════════════════════════
// ИНИЦИАЛИЗАЦИЯ
// ═══════════════════════════════════════════════════════════════

let initPromise = null;

async function initStores() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            await ensureDir(STORE_DIR);
            await ensureDir(IMAGES_DIR);
            console.log('[ProductShootStore] Initialized successfully');
        } catch (err) {
            console.error('[ProductShootStore] Failed to initialize directories:', err);
            throw err;
        }
    })();

    return initPromise;
}

// Автоинициализация при импорте
(async () => {
    try {
        await initStores();
        await rebuildIndex();
        console.log('[ProductShootStore] Index rebuilt on startup');
    } catch (e) {
        console.error('[ProductShootStore] Startup error:', e);
    }
})();

// ═══════════════════════════════════════════════════════════════
// УПРАВЛЕНИЕ ИНДЕКСОМ
// ═══════════════════════════════════════════════════════════════

function countSnapshots(shoot) {
    if (!shoot.frames?.length) return 0;
    return shoot.frames.reduce((sum, frame) => sum + (frame.snapshots?.length || 0), 0);
}

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
        console.error('[ProductShootStore] Error reading index:', err);
        return { shoots: [], rebuiltAt: new Date().toISOString() };
    }
}

async function writeIndex(index) {
    indexCache = index;
    indexCacheTime = Date.now();
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
}

async function rebuildIndex() {
    console.log('[ProductShootStore] Rebuilding index...');
    await initStores();

    let files = [];
    try {
        files = await fs.readdir(STORE_DIR);
    } catch (e) {
        console.error('[ProductShootStore] Failed to read dir for index:', e);
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
            console.error(`[ProductShootStore] Error reading ${file}:`, err.message);
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
        console.error('[ProductShootStore] Error updating index:', err);
        indexCache = null;
    }
}

// ═══════════════════════════════════════════════════════════════
// CRUD - SHOOTS
// ═══════════════════════════════════════════════════════════════

export async function getAllProductShoots() {
    await initStores();
    try {
        const index = await readIndex();
        return index.shoots || [];
    } catch (err) {
        console.error('[ProductShootStore] getAll failed:', err);
        return [];
    }
}

export async function getProductShootById(id) {
    await initStores();
    const filePath = path.join(STORE_DIR, `${id}.json`);
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (err) {
        return null;
    }
}

export async function createProductShoot(label = 'Новая съёмка') {
    await initStores();
    console.log(`[ProductShootStore] Creating shoot: ${label}`);

    const id = `PROD_${Date.now()}_${randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();

    const shoot = {
        id,
        label,
        createdAt: now,
        updatedAt: now,
        frames: []
    };

    const filePath = path.join(STORE_DIR, `${id}.json`);
    await atomicWriteFile(filePath, JSON.stringify(shoot, null, 2));
    await updateIndexEntry(shoot);

    console.log(`[ProductShootStore] Created: ${id}`);
    return shoot;
}

export async function updateProductShoot(id, updates) {
    await initStores();
    const filePath = path.join(STORE_DIR, `${id}.json`);

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const shoot = JSON.parse(content);

        const updatedShoot = {
            ...shoot,
            ...updates,
            id: shoot.id,
            updatedAt: new Date().toISOString()
        };

        await atomicWriteFile(filePath, JSON.stringify(updatedShoot, null, 2));
        await updateIndexEntry(updatedShoot);

        return updatedShoot;
    } catch (err) {
        throw new Error(`Shoot ${id} not found`);
    }
}

export async function deleteProductShoot(id) {
    await initStores();
    const filePath = path.join(STORE_DIR, `${id}.json`);

    try {
        const shootImgDir = path.join(IMAGES_DIR, id);
        try {
            await fs.rm(shootImgDir, { recursive: true });
        } catch (e) { }

        await fs.unlink(filePath);

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

export async function addFrame(shootId, params = {}) {
    const shoot = await getProductShootById(shootId);
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
    shoot.frames.unshift(frame);

    await updateProductShoot(shootId, { frames: shoot.frames });
    console.log(`[ProductShootStore] Added frame ${frameId} to ${shootId}`);

    return frame;
}

export async function deleteFrame(shootId, frameId) {
    const shoot = await getProductShootById(shootId);
    if (!shoot) throw new Error(`Shoot ${shootId} not found`);

    const frameIndex = shoot.frames?.findIndex(f => f.id === frameId);
    if (frameIndex < 0) throw new Error(`Frame ${frameId} not found`);

    const frame = shoot.frames[frameIndex];

    for (const snap of frame.snapshots || []) {
        await deleteSnapshotFile(shootId, snap.id);
    }

    shoot.frames.splice(frameIndex, 1);
    await updateProductShoot(shootId, { frames: shoot.frames });

    console.log(`[ProductShootStore] Deleted frame ${frameId}`);
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
    } catch (e) { }
}

export async function addSnapshot(shootId, frameId, base64Data, meta = {}) {
    await initStores();
    console.log(`[ProductShootStore] Adding snapshot to frame ${frameId}`);

    if (!base64Data || base64Data.length < 100) {
        throw new Error('Invalid base64 data (too short)');
    }

    const shoot = await getProductShootById(shootId);
    if (!shoot) throw new Error(`Shoot ${shootId} not found`);

    const frame = shoot.frames?.find(f => f.id === frameId);
    if (!frame) throw new Error(`Frame ${frameId} not found`);

    const shootImgDir = path.join(IMAGES_DIR, shootId);
    await ensureDir(shootImgDir);

    const snapshotId = `SNAP_${Date.now()}_${randomBytes(2).toString('hex')}`;
    const snapshotPath = buildSnapshotPath(shootId, snapshotId);

    let cleanBase64 = base64Data;
    if (base64Data.includes('base64,')) {
        cleanBase64 = base64Data.split('base64,')[1];
    }

    await fs.writeFile(snapshotPath, Buffer.from(cleanBase64, 'base64'));

    const snapshot = {
        id: snapshotId,
        createdAt: new Date().toISOString(),
        imageUrl: `/api/product-shoots/${shootId}/images/${snapshotId}`,
        localPath: snapshotPath,
        ...meta
    };

    if (!frame.snapshots) frame.snapshots = [];
    frame.snapshots.push(snapshot);

    await updateProductShoot(shootId, { frames: shoot.frames });
    console.log(`[ProductShootStore] Snapshot saved: ${snapshotId}`);

    return snapshot;
}

export async function deleteSnapshot(shootId, frameId, snapshotId) {
    const shoot = await getProductShootById(shootId);
    if (!shoot) throw new Error(`Shoot ${shootId} not found`);

    const frame = shoot.frames?.find(f => f.id === frameId);
    if (!frame) throw new Error(`Frame ${frameId} not found`);

    const snapIndex = frame.snapshots?.findIndex(s => s.id === snapshotId);
    if (snapIndex < 0) throw new Error(`Snapshot ${snapshotId} not found`);

    await deleteSnapshotFile(shootId, snapshotId);
    frame.snapshots.splice(snapIndex, 1);

    await updateProductShoot(shootId, { frames: shoot.frames });
    console.log(`[ProductShootStore] Deleted snapshot ${snapshotId}`);

    return true;
}

// ═══════════════════════════════════════════════════════════════
// LEGACY COMPAT
// ═══════════════════════════════════════════════════════════════

export async function addImageToProductShoot(shootId, base64Data, params = {}) {
    const frame = await addFrame(shootId, params);
    const snapshot = await addSnapshot(shootId, frame.id, base64Data, {});
    return {
        ...snapshot,
        frameId: frame.id
    };
}

export default {
    getAllProductShoots,
    getProductShootById,
    createProductShoot,
    updateProductShoot,
    deleteProductShoot,
    addFrame,
    deleteFrame,
    addSnapshot,
    deleteSnapshot,
    addImageToProductShoot
};
