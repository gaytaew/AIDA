/**
 * Shoot Preset Routes
 * API endpoints for managing and generating presets.
 */

import express from 'express';
import { requestOpenAIText } from '../providers/openaiClient.js';

// ... existing code ...

// Prepare image for OpenAI (keep raw base64, client adds header)
// logic in client expects raw base64 if we pass it as such, OR we can pass it clean.
// In previous Gemini code, we stripped header.
// Let's pass raw base64 (without header) as before, since my client implementation adds the header.

const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

const response = await requestOpenAIText({
    prompt: fullPrompt,
    images: [{ mimeType: 'image/jpeg', base64: base64Data }]
});
import presetGenerator from '../services/presetGenerator.js';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const PRESETS_FILE = path.join(process.cwd(), 'src/data/shootPresets.json');

// Ensure stats file exists
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

// Helper to clean JSON from Gemini markdown
function cleanJson(text) {
    if (!text) return null;
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

// 1. GENERATE FROM TEXT
router.post('/generate-text', async (req, res) => {
    try {
        const { prompt } = req.body;
        const systemPrompt = presetGenerator.buildPresetSystemPrompt();
        const fullPrompt = `${systemPrompt}\n\nUSER REQUEST: Style description: "${prompt}"`;

        const response = await requestGeminiText({ prompt: fullPrompt });

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

// 2. GENERATE FROM IMAGE (Vision)
router.post('/generate-image', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        const systemPrompt = presetGenerator.buildPresetSystemPrompt();
        const fullPrompt = `${systemPrompt}\n\nUSER REQUEST: Analyze this image and reverse-engineer the shoot preset.`;

        // Prepare image for Gemini (remove header if present)
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const response = await requestOpenAIText({
            prompt: fullPrompt,
            images: [{ mimeType: 'image/jpeg', base64: base64Data }]
        });

        if (!response.ok) {
            throw new Error(response.error);
        }

        const rawJson = cleanJson(response.text);
        let rawPreset = JSON.parse(rawJson);
        const validation = presetGenerator.validatePhysicalConsistency(rawPreset);

        res.json({ success: true, preset: validation.preset, logs: validation.logs });
    } catch (error) {
        console.error('Preset Vision Error:', error);
        res.status(500).json({ success: false, error: 'Failed to analyze image' });
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
