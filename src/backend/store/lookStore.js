/**
 * Look Store
 * 
 * Folder-based storage for looks (Outfits/Styles).
 * Each look is stored in: store/looks/{look-id}/
 * - manifest.json: look metadata
 * - cover.jpg: cover image (optional)
 * - item-*.jpg: item images (optional)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateLook, createEmptyLook } from '../schema/look.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOOKS_DIR = path.resolve(__dirname, 'looks');
const MANIFEST_FILE = 'manifest.json';

// Write queue
let writeQueue = Promise.resolve();
function enqueueWrite(task) {
    writeQueue = writeQueue.then(task, task);
    return writeQueue;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

async function ensureLooksDir() {
    await fs.mkdir(LOOKS_DIR, { recursive: true });
}

function getSafeId(id) {
    return String(id || '').trim().replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getLookFolderPath(id) {
    const safeId = getSafeId(id);
    if (!safeId) return null;
    return path.join(LOOKS_DIR, safeId);
}

async function pathExists(p) {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

/**
 * Save a single base64 image to the folder
 */
async function saveImage(folderPath, filename, base64Data) {
    if (!base64Data) return null;
    try {
        const buffer = Buffer.from(base64Data, 'base64');
        const filePath = path.join(folderPath, filename);
        await fs.writeFile(filePath, buffer);
        return filename;
    } catch (e) {
        console.error(`Failed to save image ${filename}:`, e);
        return null;
    }
}

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

async function writeManifest(folderPath, look) {
    const manifestPath = path.join(folderPath, MANIFEST_FILE);
    await fs.writeFile(manifestPath, JSON.stringify(look, null, 2), 'utf8');
}

// ═══════════════════════════════════════════════════════════════
// CRUD
// ═══════════════════════════════════════════════════════════════

export async function getAllLooks() {
    await ensureLooksDir();
    const entries = await fs.readdir(LOOKS_DIR, { withFileTypes: true });

    // Support both folders (new) and .json files (legacy migration if needed, but we'll assume folders for new system)
    // Actually, let's just support folders for now as the user likely has no crucial data in the old format yet
    // or we can just filter folders.

    const looks = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const folderPath = path.join(LOOKS_DIR, entry.name);
        const look = await readManifest(folderPath);

        if (look) {
            // Ensure preview URL is correct
            if (look.coverImage && !look.coverImage.startsWith('/')) {
                const safeId = getSafeId(look.id);
                // Fix: don't prepend /api here if it's just a filename, the frontend usually constructs it
                // BUT modelStore logic was: return full URL or allow frontend to construct.
                // Let's store just the filename in JSON, and frontend constructs path OR backend helper adds it.
                // For simplicity, let's keep look logic close to model logic.
                // look.coverImage is just "cover.jpg"
            }
            looks.push(look);
        }
    }

    // Sort by updatedAt
    looks.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

    return looks;
}

export async function getLookById(id) {
    const folderPath = getLookFolderPath(id);
    if (!folderPath || !(await pathExists(folderPath))) return null;
    return readManifest(folderPath);
}

export async function createLook(data) {
    const now = new Date().toISOString();

    // Data might contain 'images' (base64) for items? 
    // Or 'coverImageBase64'?
    // Let's assume the frontend sends:
    // { ...lookData, coverImageBase64: "...", items: [ { ...itemData, imageBase64: "..." } ] }

    const { coverImageBase64, ...lookData } = data;

    const newLook = {
        ...createEmptyLook(lookData.label, lookData.category),
        ...lookData,
        id: lookData.id || `look_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: now,
        updatedAt: now
    };

    const folderPath = getLookFolderPath(newLook.id);

    if (await pathExists(folderPath)) {
        return { success: false, errors: ['Look already exists'] };
    }

    await enqueueWrite(async () => {
        await fs.mkdir(folderPath, { recursive: true });

        // Save Cover Image
        if (coverImageBase64) {
            const fileName = 'cover.jpg';
            await saveImage(folderPath, fileName, coverImageBase64);
            newLook.coverImage = fileName; // Store relative filename
        }

        // Save Item Images (if any) - Iterate through items and check for imageBase64
        if (newLook.items && Array.isArray(newLook.items)) {
            for (let i = 0; i < newLook.items.length; i++) {
                const item = newLook.items[i];

                // Ensure images array exists
                if (!item.images) item.images = [];

                // 1. Legacy Single
                if (item.imageBase64) {
                    const fileName = `item-${i}-legacy-${Date.now()}.jpg`;
                    await saveImage(folderPath, fileName, item.imageBase64);
                    item.image = fileName;
                    item.images.push(fileName);
                    delete item.imageBase64;
                }

                // 2. New Multiple
                if (item.imagesBase64 && Array.isArray(item.imagesBase64)) {
                    for (let j = 0; j < item.imagesBase64.length; j++) {
                        const b64 = item.imagesBase64[j];
                        const fileName = `item-${i}-${j}-${Date.now()}.jpg`;
                        await saveImage(folderPath, fileName, b64);
                        item.images.push(fileName);
                    }
                    delete item.imagesBase64;
                }

                // Sync legacy .image prop
                if (!item.image && item.images.length > 0) {
                    item.image = item.images[0];
                }
            }
        }

        await writeManifest(folderPath, newLook);
    });

    return { success: true, look: newLook };
}

export async function updateLook(id, updates) {
    const currentLook = await getLookById(id);
    if (!currentLook) return { success: false, errors: ['Look not found'] };

    const folderPath = getLookFolderPath(id);
    const { coverImageBase64, ...lookData } = updates;

    // Merge basic data
    const updatedLook = {
        ...currentLook,
        ...lookData,
        id: currentLook.id,
        updatedAt: new Date().toISOString()
    };

    await enqueueWrite(async () => {
        // Handle Cover Image Update
        if (coverImageBase64) {
            const fileName = `cover-${Date.now()}.jpg`; // New name to bust cache? Or just options?
            // actually just cover.jpg is fine if we cache bust on frontend
            // but unique names are safer against browser caching
            const finalName = 'cover.jpg';
            await saveImage(folderPath, finalName, coverImageBase64);
            updatedLook.coverImage = finalName;
        }

        // Handle Item Images
        // Items might be new or existing. 
        if (updatedLook.items && Array.isArray(updatedLook.items)) {
            for (let i = 0; i < updatedLook.items.length; i++) {
                const item = updatedLook.items[i];

                // Ensure images array exists
                if (!item.images) item.images = [];

                // 1. Handle Legacy Single Image Base64
                if (item.imageBase64) {
                    const fileName = `item-${i}-legacy-${Date.now()}.jpg`;
                    await saveImage(folderPath, fileName, item.imageBase64);
                    item.image = fileName; // Legacy prop
                    item.images.push(fileName); // Sync to new array
                    delete item.imageBase64;
                }

                // 2. Handle Multiple Images Base64 (New Standard)
                if (item.imagesBase64 && Array.isArray(item.imagesBase64)) {
                    for (let j = 0; j < item.imagesBase64.length; j++) {
                        const b64 = item.imagesBase64[j];
                        const fileName = `item-${i}-${j}-${Date.now()}.jpg`;
                        await saveImage(folderPath, fileName, b64);
                        item.images.push(fileName);
                    }
                    delete item.imagesBase64;
                }

                // Sync legacy .image prop if missing but .images exists
                if (!item.image && item.images.length > 0) {
                    item.image = item.images[0];
                }
            }
        }

        await writeManifest(folderPath, updatedLook);
    });

    return { success: true, look: updatedLook };
}

export async function deleteLook(id) {
    const folderPath = getLookFolderPath(id);
    if (!folderPath || !(await pathExists(folderPath))) {
        return { success: false, errors: ['Look not found'] };
    }

    await enqueueWrite(async () => {
        await fs.rm(folderPath, { recursive: true, force: true });
    });

    return { success: true };
}
