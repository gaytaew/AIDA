/**
 * Random Photo Store
 * 
 * File-based storage for Random Photo sessions.
 * Each session stores generated photos as snapshots.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHOOTS_DIR = path.resolve(__dirname, 'random-photos');
const IMAGES_DIR = path.resolve(__dirname, 'random-photo-images');
const INDEX_PATH = path.join(SHOOTS_DIR, '_index.json');

// ═══════════════════════════════════════════════════════════════
// FILE SYSTEM HELPERS
// ═══════════════════════════════════════════════════════════════

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (e) {
        if (e.code !== 'EEXIST') throw e;
    }
}

async function atomicWriteFile(filePath, content) {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

let initPromise = null;

async function initStores() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
        await ensureDir(SHOOTS_DIR);
        await ensureDir(IMAGES_DIR);
    })();
    return initPromise;
}

// Force init + index rebuild
(async () => {
    try {
        await initStores();
        await rebuildIndex();
        console.log('[RandomPhotoStore] Index rebuilt on startup');
    } catch (e) {
        console.error('[RandomPhotoStore] Init error:', e);
    }
})();

// ═══════════════════════════════════════════════════════════════
// INDEX MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function countSnapshots(shoot) {
    return (shoot.snapshots || []).length;
}

function getPreviewUrl(shoot) {
    const first = (shoot.snapshots || [])[0];
    return first?.imageUrl || null;
}

async function readIndex() {
    try {
        const raw = await fs.readFile(INDEX_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

async function writeIndex(index) {
    await atomicWriteFile(INDEX_PATH, JSON.stringify(index, null, 2));
}

async function rebuildIndex() {
    await initStores();
    const files = await fs.readdir(SHOOTS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== '_index.json');

    const index = [];
    for (const file of jsonFiles) {
        try {
            const raw = await fs.readFile(path.join(SHOOTS_DIR, file), 'utf-8');
            const shoot = JSON.parse(raw);
            index.push({
                id: shoot.id,
                label: shoot.label,
                snapshotCount: countSnapshots(shoot),
                previewUrl: getPreviewUrl(shoot),
                createdAt: shoot.createdAt,
                updatedAt: shoot.updatedAt
            });
        } catch (e) {
            console.warn(`[RandomPhotoStore] Skipping corrupt file: ${file}`);
        }
    }

    // Sort by createdAt descending
    index.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    await writeIndex(index);
    return index;
}

async function updateIndexEntry(shoot) {
    const index = await readIndex();
    const existing = index.findIndex(e => e.id === shoot.id);

    const entry = {
        id: shoot.id,
        label: shoot.label,
        snapshotCount: countSnapshots(shoot),
        previewUrl: getPreviewUrl(shoot),
        createdAt: shoot.createdAt,
        updatedAt: shoot.updatedAt
    };

    if (existing >= 0) {
        index[existing] = entry;
    } else {
        index.unshift(entry);
    }

    await writeIndex(index);
}

// ═══════════════════════════════════════════════════════════════
// CRUD - SHOOTS
// ═══════════════════════════════════════════════════════════════

export async function getAllRandomPhotoShoots() {
    await initStores();
    return await readIndex();
}

export async function getRandomPhotoShootById(id) {
    await initStores();
    const filePath = path.join(SHOOTS_DIR, `${id}.json`);
    try {
        const raw = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

export async function createRandomPhotoShoot(label = 'Новая сессия') {
    await initStores();

    const shoot = {
        id: randomUUID(),
        label,
        snapshots: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const filePath = path.join(SHOOTS_DIR, `${shoot.id}.json`);
    await atomicWriteFile(filePath, JSON.stringify(shoot, null, 2));
    await updateIndexEntry(shoot);

    console.log(`[RandomPhotoStore] Created shoot: ${shoot.id} "${label}"`);
    return shoot;
}

export async function deleteRandomPhotoShoot(id) {
    await initStores();
    const shoot = await getRandomPhotoShootById(id);
    if (!shoot) return false;

    // Delete all snapshot images
    for (const snap of shoot.snapshots || []) {
        try {
            if (snap.localPath) await fs.unlink(snap.localPath);
        } catch (e) { /* ignore */ }
    }

    // Delete shoot file
    const filePath = path.join(SHOOTS_DIR, `${id}.json`);
    try {
        await fs.unlink(filePath);
    } catch (e) { /* ignore */ }

    // Update index
    const index = await readIndex();
    const filtered = index.filter(e => e.id !== id);
    await writeIndex(filtered);

    console.log(`[RandomPhotoStore] Deleted shoot: ${id}`);
    return true;
}

// ═══════════════════════════════════════════════════════════════
// SNAPSHOT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export async function addSnapshot(shootId, base64Data, meta = {}) {
    await initStores();
    const shoot = await getRandomPhotoShootById(shootId);
    if (!shoot) throw new Error('Shoot not found');

    const snapshotId = randomUUID();
    const ext = 'png';
    const fileName = `${snapshotId}.${ext}`;

    // Save image to disk
    const shootImagesDir = path.join(IMAGES_DIR, shootId);
    await ensureDir(shootImagesDir);
    const imagePath = path.join(shootImagesDir, fileName);

    const buffer = Buffer.from(base64Data, 'base64');
    await fs.writeFile(imagePath, buffer);

    const snapshot = {
        id: snapshotId,
        imageUrl: `/api/random-photos/shoots/${shootId}/images/${snapshotId}`,
        localPath: imagePath,
        prompt: meta.prompt || '',
        theme: meta.theme || '',
        style: meta.style || '',
        params: meta.params || {},
        createdAt: new Date().toISOString()
    };

    shoot.snapshots = shoot.snapshots || [];
    shoot.snapshots.push(snapshot);
    shoot.updatedAt = new Date().toISOString();

    // Save shoot
    const filePath = path.join(SHOOTS_DIR, `${shootId}.json`);
    await atomicWriteFile(filePath, JSON.stringify(shoot, null, 2));
    await updateIndexEntry(shoot);

    console.log(`[RandomPhotoStore] Added snapshot ${snapshotId} to shoot ${shootId}`);
    return snapshot;
}

export async function deleteSnapshot(shootId, snapshotId) {
    await initStores();
    const shoot = await getRandomPhotoShootById(shootId);
    if (!shoot) throw new Error('Shoot not found');

    const idx = (shoot.snapshots || []).findIndex(s => s.id === snapshotId);
    if (idx < 0) throw new Error('Snapshot not found');

    const snap = shoot.snapshots[idx];

    // Delete image file
    try {
        if (snap.localPath) await fs.unlink(snap.localPath);
    } catch (e) { /* ignore */ }

    shoot.snapshots.splice(idx, 1);
    shoot.updatedAt = new Date().toISOString();

    const filePath = path.join(SHOOTS_DIR, `${shootId}.json`);
    await atomicWriteFile(filePath, JSON.stringify(shoot, null, 2));
    await updateIndexEntry(shoot);

    console.log(`[RandomPhotoStore] Deleted snapshot ${snapshotId} from shoot ${shootId}`);
}

export function getImagesDir() {
    return IMAGES_DIR;
}

export default {
    getAllRandomPhotoShoots,
    getRandomPhotoShootById,
    createRandomPhotoShoot,
    deleteRandomPhotoShoot,
    addSnapshot,
    deleteSnapshot,
    getImagesDir
};
