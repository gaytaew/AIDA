/**
 * Shoot Preset Routes
 * API endpoints for managing and generating presets.
 */

import express from 'express';
import { getGeminiTextResponse, getGeminiVisionResponse } from '../services/gemini.js'; // Assuming this exists
import presetGenerator from '../services/presetGenerator.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const PRESETS_FILE = path.join(process.cwd(), 'src/data/shootPresets.json');

// Ensure stats file exists
async function ensureFile() {
    try {
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

// 1. GENERATE FROM TEXT
router.post('/generate-text', async (req, res) => {
    try {
        const { prompt } = req.body;
        const systemPrompt = presetGenerator.buildPresetSystemPrompt();

        // Call Gemini (Mock implementation pattern - in real app would call gemini service)
        // Here we assume getGeminiTextResponse returns a valid JSON string
        // In a real implementation, you'd wire this to your actual LLM service wrapper
        const aiResponse = await getGeminiTextResponse([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Style description: "${prompt}"` }
        ]);

        let rawPreset = JSON.parse(aiResponse); // Assuming AI returns clean JSON
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

        // Gemini Vision call
        const aiResponse = await getGeminiVisionResponse(
            imageBase64,
            systemPrompt + '\n\nAnalyze this image and reverse-engineer the shoot preset.'
        );

        let rawPreset = JSON.parse(aiResponse);
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
    const newPreset = { ...preset, id: uuidv4(), createdAt: new Date() };
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
