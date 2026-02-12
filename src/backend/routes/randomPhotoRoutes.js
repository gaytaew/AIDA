/**
 * Random Photo Routes
 * 
 * API endpoints for random photo generation and session management.
 * Combines generation endpoints and session CRUD in one router.
 */

import express from 'express';
import { generateRandomPhoto } from '../services/randomPhotoGenerator.js';
import {
    RANDOM_THEMES,
    RANDOM_STYLE,
    RANDOM_IMAGE_SIZE,
    RANDOM_ASPECT_RATIO
} from '../schema/randomPhotoShoot.js';
import store from '../store/randomPhotoStore.js';

const router = express.Router();

// Helper for async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ═══════════════════════════════════════════════════════════════
// OPTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/random-photos/options
 * Returns all schema options for the frontend editor
 */
router.get('/options', (req, res) => {
    res.json({
        ok: true,
        data: {
            themes: RANDOM_THEMES,
            style: RANDOM_STYLE,
            imageSize: RANDOM_IMAGE_SIZE,
            aspectRatio: RANDOM_ASPECT_RATIO
        }
    });
});

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/random-photos/generate
 * Generates a photo with a random prompt from the selected theme
 */
router.post('/generate', async (req, res) => {
    try {
        const {
            params,
            referenceImages,
            shootId
        } = req.body;

        if (!params) {
            return res.status(400).json({ ok: false, error: 'Missing params' });
        }

        // Generate
        const result = await generateRandomPhoto({
            params,
            referenceImages: referenceImages || []
        });

        // Save to session if shootId provided
        if (shootId && result.base64) {
            const savedSnapshot = await store.addSnapshot(shootId, result.base64, {
                prompt: result.prompt,
                basePrompt: result.basePrompt,
                theme: result.theme,
                style: result.style,
                params: result.params
            });
            result.savedSnapshot = savedSnapshot;
        }

        res.json({
            ok: true,
            data: result
        });

    } catch (error) {
        console.error('[RandomPhotoRoutes] Generation error:', error);
        res.status(500).json({
            ok: false,
            error: error.message || 'Failed to generate random photo'
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// SESSION (SHOOT) CRUD
// ═══════════════════════════════════════════════════════════════

// GET /api/random-photos/shoots — List all sessions
router.get('/shoots', asyncHandler(async (req, res) => {
    const shoots = await store.getAllRandomPhotoShoots();
    res.json({ ok: true, data: shoots });
}));

// POST /api/random-photos/shoots — Create new session
router.post('/shoots', asyncHandler(async (req, res) => {
    const { label } = req.body;
    const shoot = await store.createRandomPhotoShoot(label || 'Новая сессия');
    res.json({ ok: true, data: shoot });
}));

// GET /api/random-photos/shoots/:id — Get session by ID
router.get('/shoots/:id', asyncHandler(async (req, res) => {
    const shoot = await store.getRandomPhotoShootById(req.params.id);
    if (!shoot) {
        return res.status(404).json({ ok: false, error: 'Session not found' });
    }
    res.json({ ok: true, data: shoot });
}));

// DELETE /api/random-photos/shoots/:id — Delete session
router.delete('/shoots/:id', asyncHandler(async (req, res) => {
    const success = await store.deleteRandomPhotoShoot(req.params.id);
    if (!success) {
        return res.status(404).json({ ok: false, error: 'Session not found' });
    }
    res.json({ ok: true });
}));

// DELETE /api/random-photos/shoots/:id/snapshots/:snapshotId — Delete snapshot
router.delete('/shoots/:id/snapshots/:snapshotId', asyncHandler(async (req, res) => {
    try {
        await store.deleteSnapshot(req.params.id, req.params.snapshotId);
        res.json({ ok: true });
    } catch (err) {
        res.status(404).json({ ok: false, error: err.message });
    }
}));

// ═══════════════════════════════════════════════════════════════
// IMAGE SERVING
// ═══════════════════════════════════════════════════════════════

// GET /api/random-photos/shoots/:id/images/:imageId — Serve image file
router.get('/shoots/:id/images/:imageId', asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;
    const shoot = await store.getRandomPhotoShootById(id);

    if (!shoot) return res.status(404).send('Session not found');

    const snapshot = (shoot.snapshots || []).find(s => s.id === imageId);
    if (!snapshot?.localPath) return res.status(404).send('Image not found');

    res.sendFile(snapshot.localPath);
}));

export default router;
