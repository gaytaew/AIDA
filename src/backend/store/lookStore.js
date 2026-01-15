/**
 * Look Store
 * 
 * File-based storage for looks.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    validateLook,
    createEmptyLook
} from '../schema/look.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOOKS_DIR = path.resolve(__dirname, 'looks');

// ═══════════════════════════════════════════════════════════════
// FILE SYSTEM HELPERS
// ═══════════════════════════════════════════════════════════════

let writeQueue = Promise.resolve();

function enqueueWrite(task) {
    writeQueue = writeQueue.then(task, task);
    return writeQueue;
}

async function ensureLooksDir() {
    await fs.mkdir(LOOKS_DIR, { recursive: true });
}

function buildLookFilePath(id) {
    // Safe filename
    const safe = String(id || '').trim().replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!safe) return null;
    return path.join(LOOKS_DIR, `${safe}.json`);
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function readLookFromFile(filePath) {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        const v = validateLook(parsed);
        if (!v.valid) {
            return { ok: false, error: `Invalid look in "${path.basename(filePath)}": ${v.errors.join('; ')}` };
        }
        return { ok: true, look: parsed };
    } catch (e) {
        return { ok: false, error: `Failed to read "${path.basename(filePath)}": ${e.message}` };
    }
}

// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════

export async function getAllLooks() {
    await ensureLooksDir();
    const entries = await fs.readdir(LOOKS_DIR);
    const jsonFiles = entries
        .filter(name => typeof name === 'string' && name.toLowerCase().endsWith('.json'))
        .map(name => path.join(LOOKS_DIR, name));

    const looks = [];
    for (const filePath of jsonFiles) {
        const res = await readLookFromFile(filePath);
        if (res.ok) {
            looks.push(res.look);
        }
    }

    // Sort by updatedAt (newest first)
    looks.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

    return looks;
}

export async function getLookById(id) {
    const key = String(id || '').trim();
    if (!key) return null;

    const filePath = buildLookFilePath(key);
    if (!filePath || !(await fileExists(filePath))) return null;

    const res = await readLookFromFile(filePath);
    return res.ok ? res.look : null;
}

export async function createLook(data) {
    const now = new Date().toISOString();

    const newLook = {
        ...createEmptyLook(data.label, data.category),
        ...data,
        createdAt: now,
        updatedAt: now
    };

    const v = validateLook(newLook);
    if (!v.valid) {
        return { success: false, errors: v.errors };
    }

    const filePath = buildLookFilePath(newLook.id);
    if (!filePath) {
        return { success: false, errors: ['Invalid look ID'] };
    }

    if (await fileExists(filePath)) {
        return { success: false, errors: [`Look "${newLook.id}" already exists`] };
    }

    await enqueueWrite(async () => {
        await ensureLooksDir();
        await fs.writeFile(filePath, JSON.stringify(newLook, null, 2), 'utf8');
    });

    return { success: true, look: newLook };
}

export async function updateLook(id, updates) {
    const existing = await getLookById(id);
    if (!existing) {
        return { success: false, errors: [`Look "${id}" not found`] };
    }

    const updated = {
        ...existing,
        ...updates,
        id: existing.id, // ID cannot change
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString()
    };

    const v = validateLook(updated);
    if (!v.valid) {
        return { success: false, errors: v.errors };
    }

    const filePath = buildLookFilePath(id);

    await enqueueWrite(async () => {
        await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
    });

    return { success: true, look: updated };
}

export async function deleteLook(id) {
    const filePath = buildLookFilePath(id);
    if (!filePath || !(await fileExists(filePath))) {
        return { success: false, errors: [`Look "${id}" not found`] };
    }

    await enqueueWrite(async () => {
        await fs.unlink(filePath);
    });

    return { success: true };
}
