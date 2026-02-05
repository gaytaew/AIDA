import express from 'express';
import {
    requestShootAnalysisFromRefs,
    requestShootSeriesFromAnalysis,
    generateShootFromPrompt,
    requestShootEdit
} from '../services/shootEditorService.js';

export const shootEditorRouter = express.Router();

function normalizeLevel(value, allowed, fallback) {
    const v = String(value || '').trim().toLowerCase();
    return allowed.includes(v) ? v : fallback;
}

// POST /api/shoot-editor/analyze
shootEditorRouter.post('/analyze', async (req, res) => {
    try {
        const {
            format,
            realism,
            experiment,
            userNotes = '',
            referenceImages = []
        } = req.body || {};

        const normalizedFormat = normalizeLevel(format, ['editorial', 'campaign', 'catalog'], 'editorial');
        const realismLevel = normalizeLevel(realism, ['high', 'medium', 'low'], 'medium');
        const experimentLevel = normalizeLevel(experiment, ['high', 'medium', 'low'], 'medium');

        if (!Array.isArray(referenceImages) || referenceImages.length === 0) {
            return res.status(400).json({ ok: false, error: 'referenceImages required (at least 1 image).' });
        }

        const result = await requestShootAnalysisFromRefs({
            format: normalizedFormat,
            realism: realismLevel,
            experiment: experimentLevel,
            userNotes: String(userNotes || ''),
            referenceImages
        });

        if (!result.ok) {
            return res.status(400).json({ ok: false, error: result.error || 'Analysis failed.' });
        }

        res.json({ ok: true, analysis: result.analysis });
    } catch (error) {
        console.error('Error in /api/shoot-editor/analyze:', error);
        res.status(500).json({ ok: false, error: 'Internal server error' });
    }
});

// POST /api/shoot-editor/generate
shootEditorRouter.post('/generate', async (req, res) => {
    try {
        const {
            format,
            realism,
            experiment,
            userNotes = '',
            analysis
        } = req.body || {};

        const normalizedFormat = normalizeLevel(format, ['editorial', 'campaign', 'catalog'], 'editorial');
        const realismLevel = normalizeLevel(realism, ['high', 'medium', 'low'], 'medium');
        const experimentLevel = normalizeLevel(experiment, ['high', 'medium', 'low'], 'medium');

        if (!analysis || typeof analysis !== 'object') {
            return res.status(400).json({ ok: false, error: 'analysis object required.' });
        }

        const result = await requestShootSeriesFromAnalysis({
            format: normalizedFormat,
            realism: realismLevel,
            experiment: experimentLevel,
            userNotes: String(userNotes || ''),
            analysis
        });

        if (!result.ok) {
            return res.status(400).json({ ok: false, error: result.error || 'Generation failed.' });
        }

        res.json({ ok: true, series: result.series, shoot: result.shoot });
    } catch (error) {
        console.error('Error in /api/shoot-editor/generate:', error);
        res.status(500).json({ ok: false, error: 'Internal server error' });
    }
});

// POST /api/shoot-editor/generate-from-prompt
shootEditorRouter.post('/generate-from-prompt', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ ok: false, error: 'Prompt is required' });
        }

        const result = await generateShootFromPrompt(prompt);

        if (!result.success) {
            return res.status(400).json({ ok: false, error: result.errors?.[0] || 'Generation failed' });
        }

        res.json({ ok: true, data: result.shoot });
    } catch (error) {
        console.error('Error in /api/shoot-editor/generate-from-prompt:', error);
        res.status(500).json({ ok: false, error: 'Internal server error' });
    }
});

// POST /api/shoot-editor/edit
shootEditorRouter.post('/edit', async (req, res) => {
    try {
        const { currentShoot, editPrompt } = req.body;

        if (!currentShoot || !editPrompt) {
            return res.status(400).json({ ok: false, error: 'currentShoot and editPrompt are required' });
        }

        const result = await requestShootEdit({ currentShoot, editPrompt });

        if (!result.ok) {
            return res.status(400).json({ ok: false, error: result.error || 'Edit failed' });
        }

        res.json({ ok: true, shoot: result.shoot });
    } catch (error) {
        console.error('Error in /api/shoot-editor/edit:', error);
        res.status(500).json({ ok: false, error: 'Internal server error' });
    }
});
