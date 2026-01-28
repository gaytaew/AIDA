/**
 * Shoot Preset Routes
 * API endpoints for managing and generating presets.
 */

import express from 'express';
import { requestOpenAIText } from '../providers/openaiClient.js';
import presetGenerator from '../services/presetGenerator.js';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const PRESETS_FILE = path.join(process.cwd(), 'src/data/shootPresets.json');

// Ensure data directory and file exist
async function ensureFile() {
    try {
        await fs.mkdir(path.dirname(PRESETS_FILE), { recursive: true });
        await fs.access(PRESETS_FILE);
    } catch {
        await fs.writeFile(PRESETS_FILE, JSON.stringify([]));
    }
}

// Helper to read/write
async function getPresets() {
    await ensureFile();
    const data = await fs.readFile(PRESETS_FILE, 'utf8');
    return JSON.parse(data);
}

async function savePresets(presets) {
    await fs.writeFile(PRESETS_FILE, JSON.stringify(presets, null, 2));
}

// Helper to clean JSON from markdown code blocks
function cleanJson(text) {
    if (!text) return null;
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

// 1. GENERATE FROM TEXT (uses OpenAI GPT-5.2)
router.post('/generate-text', async (req, res) => {
    try {
        const { prompt } = req.body;
        const systemPrompt = presetGenerator.buildPresetSystemPrompt();
        const fullPrompt = `${systemPrompt}\n\nUSER REQUEST: Style description: "${prompt}"`;

        const response = await requestOpenAIText({ prompt: fullPrompt });

        if (!response.ok) {
            throw new Error(response.error);
        }

        const rawJson = cleanJson(response.text);
        let rawPreset = JSON.parse(rawJson);
        const validation = presetGenerator.validatePhysicalConsistency(rawPreset);

        res.json({ success: true, preset: validation.preset, logs: validation.logs });
    } catch (error) {
        console.error('Preset Gen Error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate preset' });
    }
});

// 2. GENERATE FROM IMAGE (Vision) — uses OpenAI GPT-5.2
// 2. GENERATE FROM IMAGE (Vision) — uses OpenAI GPT-5.2
router.post('/generate-image', async (req, res) => {
    try {
        console.log('[ShootPreset] POST /generate-image received');
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            console.error('[ShootPreset] No imageBase64 provided');
            return res.status(400).json({ success: false, error: 'No image provided' });
        }

        console.log(`[ShootPreset] Processing image (length: ${imageBase64.length})`);

        const systemPrompt = presetGenerator.buildPresetSystemPrompt();
        const fullPrompt = `${systemPrompt}\n\nUSER REQUEST: Analyze this image and reverse-engineer the shoot preset.`;

        // Extract MIME type from data URL before stripping
        const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

        // Remove data URL header
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        console.log('[ShootPreset] Calling OpenAI Vision...');
        const response = await requestOpenAIText({
            prompt: fullPrompt,
            images: [{ mimeType, base64: base64Data }]
        });

        console.log('[ShootPreset] OpenAI Response:', response.ok ? 'OK' : 'FAIL');

        if (!response.ok) {
            throw new Error(response.error || 'Unknown OpenAI error');
        }

        const rawJson = cleanJson(response.text);
        console.log('[ShootPreset] Raw JSON:', rawJson.substring(0, 50) + '...');

        let rawPreset = JSON.parse(rawJson);
        const validation = presetGenerator.validatePhysicalConsistency(rawPreset);

        console.log('[ShootPreset] Validation complete. Sending response.');
        res.json({ success: true, preset: validation.preset, logs: validation.logs });
    } catch (error) {
        console.error('Preset Vision Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze image',
            details: error.message,
            stack: error.stack
        });
    }
});

// 3. CRUD ROUTES
router.get('/', async (req, res) => {
    const presets = await getPresets();
    res.json(presets);
});

router.post('/', async (req, res) => {
    const { preset } = req.body;
    if (!preset) return res.status(400).send('No preset data');

    const presets = await getPresets();
    const newPreset = { ...preset, id: crypto.randomUUID(), createdAt: new Date() };
    presets.push(newPreset);
    await savePresets(presets);

    res.json({ success: true, preset: newPreset });
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let presets = await getPresets();
    presets = presets.filter(p => p.id !== id);
    await savePresets(presets);
    res.json({ success: true });
});

export default router;
