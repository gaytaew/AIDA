/**
 * Styles Routes (V6 AI-Режиссёр)
 * 
 * REST API for Style Presets:
 * - CRUD operations for presets
 * - AI-powered style analysis
 * - AI-powered style refinement
 */

import express from 'express';
import path from 'path';
import {
    getAllPresets,
    getPresetById,
    createPreset,
    updatePreset,
    deletePreset,
    getPresetImagePath,
    getStylesDir
} from '../store/stylesStore.js';
import { analyzeStyle, refineStyle } from '../services/directorService.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
// GET /api/styles — List all style presets
// ═══════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
    try {
        const presets = await getAllPresets();
        res.json({
            ok: true,
            data: presets,
            total: presets.length
        });
    } catch (error) {
        console.error('[StylesRoutes] Error getting presets:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/styles/:id — Get preset by ID
// ═══════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const preset = await getPresetById(id);

        if (!preset) {
            return res.status(404).json({
                ok: false,
                error: `Пресет "${id}" не найден`
            });
        }

        res.json({
            ok: true,
            data: preset
        });
    } catch (error) {
        console.error('[StylesRoutes] Error getting preset:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/styles — Create new preset (manual, without AI analysis)
// ═══════════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
    try {
        const { referenceImage, ...presetData } = req.body;

        const result = await createPreset(presetData, referenceImage || null);

        if (!result.success) {
            return res.status(400).json({
                ok: false,
                errors: result.errors
            });
        }

        res.status(201).json({
            ok: true,
            data: result.preset
        });
    } catch (error) {
        console.error('[StylesRoutes] Error creating preset:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/styles/analyze — Analyze reference image with GPT-5.2
// ═══════════════════════════════════════════════════════════════
router.post('/analyze', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image || !image.base64) {
            return res.status(400).json({
                ok: false,
                error: 'Изображение не предоставлено'
            });
        }

        console.log('[StylesRoutes] Analyzing reference image...');

        const result = await analyzeStyle(image);

        if (!result.ok) {
            return res.status(500).json({
                ok: false,
                error: result.error
            });
        }

        res.json({
            ok: true,
            data: result.data
        });
    } catch (error) {
        console.error('[StylesRoutes] Error analyzing style:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/styles/analyze-and-save — Analyze and immediately save as preset
// ═══════════════════════════════════════════════════════════════
router.post('/analyze-and-save', async (req, res) => {
    try {
        const { image, name } = req.body;

        if (!image || !image.base64) {
            return res.status(400).json({
                ok: false,
                error: 'Изображение не предоставлено'
            });
        }

        console.log('[StylesRoutes] Analyzing and saving preset...');

        // Step 1: Analyze
        const analysisResult = await analyzeStyle(image);
        if (!analysisResult.ok) {
            return res.status(500).json({
                ok: false,
                error: analysisResult.error
            });
        }

        // Step 2: Create preset
        const presetData = {
            name: name || analysisResult.data.suggestedName || 'Новый стиль',
            technicalParams: analysisResult.data.technicalParams,
            naturalPrompt: analysisResult.data.naturalPrompt,
            antiAiDirectives: analysisResult.data.antiAiDirectives
        };

        const createResult = await createPreset(presetData, image);

        if (!createResult.success) {
            return res.status(400).json({
                ok: false,
                errors: createResult.errors
            });
        }

        res.status(201).json({
            ok: true,
            data: createResult.preset,
            analysis: analysisResult.data
        });
    } catch (error) {
        console.error('[StylesRoutes] Error analyzing and saving:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/styles/:id/refine — Refine preset with AI
// ═══════════════════════════════════════════════════════════════
router.post('/:id/refine', async (req, res) => {
    try {
        const { id } = req.params;
        const { instruction } = req.body;

        if (!instruction?.trim()) {
            return res.status(400).json({
                ok: false,
                error: 'Инструкция не предоставлена'
            });
        }

        // Get current preset
        const preset = await getPresetById(id);
        if (!preset) {
            return res.status(404).json({
                ok: false,
                error: `Пресет "${id}" не найден`
            });
        }

        console.log(`[StylesRoutes] Refining preset "${preset.name}" with instruction: ${instruction}`);

        // Refine with AI
        const refineResult = await refineStyle(preset, instruction);

        if (!refineResult.ok) {
            return res.status(500).json({
                ok: false,
                error: refineResult.error
            });
        }

        // Update preset with refined data
        const updateResult = await updatePreset(id, {
            technicalParams: refineResult.data.technicalParams,
            naturalPrompt: refineResult.data.naturalPrompt,
            antiAiDirectives: refineResult.data.antiAiDirectives
        });

        if (!updateResult.success) {
            return res.status(400).json({
                ok: false,
                errors: updateResult.errors
            });
        }

        res.json({
            ok: true,
            data: updateResult.preset,
            refinementNote: refineResult.data.refinementNote
        });
    } catch (error) {
        console.error('[StylesRoutes] Error refining preset:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// PUT /api/styles/:id — Update preset manually
// ═══════════════════════════════════════════════════════════════
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const result = await updatePreset(id, updates);

        if (!result.success) {
            return res.status(400).json({
                ok: false,
                errors: result.errors
            });
        }

        res.json({
            ok: true,
            data: result.preset
        });
    } catch (error) {
        console.error('[StylesRoutes] Error updating preset:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// DELETE /api/styles/:id — Delete preset
// ═══════════════════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deletePreset(id);

        if (!result.success) {
            return res.status(404).json({
                ok: false,
                errors: result.errors
            });
        }

        res.json({
            ok: true,
            message: `Пресет "${id}" удалён`
        });
    } catch (error) {
        console.error('[StylesRoutes] Error deleting preset:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/styles/images/:presetId/:filename — Serve preset images
// ═══════════════════════════════════════════════════════════════
router.get('/images/:presetId/:filename', async (req, res) => {
    try {
        const { presetId, filename } = req.params;
        const imagePath = getPresetImagePath(presetId, filename);

        if (!imagePath) {
            return res.status(404).json({
                ok: false,
                error: 'Изображение не найдено'
            });
        }

        res.sendFile(imagePath);
    } catch (error) {
        console.error('[StylesRoutes] Error serving image:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

export default router;
