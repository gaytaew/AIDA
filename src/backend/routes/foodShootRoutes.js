/**
 * Food Shoot Routes
 * 
 * API endpoints for managing Food Shoots.
 * Hierarchical: Shoot -> Frame -> Snapshot
 */

import express from 'express';
import store from '../store/foodShootStore.js';

const router = express.Router();

// Helper to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ═══════════════════════════════════════════════════════════════
// SHOOT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// GET /api/food-shoots - List all shoots
router.get('/', asyncHandler(async (req, res) => {
    const shoots = await store.getAllFoodShoots();
    res.json({ ok: true, data: shoots });
}));

// POST /api/food-shoots - Create new shoot
router.post('/', asyncHandler(async (req, res) => {
    const { label } = req.body;
    const shoot = await store.createFoodShoot(label || 'Новая съёмка');
    res.json({ ok: true, data: shoot });
}));

// GET /api/food-shoots/:id - Get specific shoot
router.get('/:id', asyncHandler(async (req, res) => {
    const shoot = await store.getFoodShootById(req.params.id);
    if (!shoot) {
        return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    res.json({ ok: true, data: shoot });
}));

// DELETE /api/food-shoots/:id - Delete shoot
router.delete('/:id', asyncHandler(async (req, res) => {
    const success = await store.deleteFoodShoot(req.params.id);
    if (!success) {
        return res.status(404).json({ ok: false, error: 'Shoot not found' });
    }
    res.json({ ok: true });
}));

// ═══════════════════════════════════════════════════════════════
// FRAME ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// POST /api/food-shoots/:id/frames - Create new frame
router.post('/:id/frames', asyncHandler(async (req, res) => {
    const { params } = req.body;
    try {
        const frame = await store.addFrame(req.params.id, params || {});
        res.json({ ok: true, data: frame });
    } catch (err) {
        res.status(404).json({ ok: false, error: err.message });
    }
}));

// DELETE /api/food-shoots/:id/frames/:frameId - Delete a frame
router.delete('/:id/frames/:frameId', asyncHandler(async (req, res) => {
    try {
        await store.deleteFrame(req.params.id, req.params.frameId);
        res.json({ ok: true });
    } catch (err) {
        res.status(404).json({ ok: false, error: err.message });
    }
}));

// ═══════════════════════════════════════════════════════════════
// SNAPSHOT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// POST /api/food-shoots/:id/frames/:frameId/snapshots - Add snapshot to frame
router.post('/:id/frames/:frameId/snapshots', asyncHandler(async (req, res) => {
    const { base64, meta } = req.body;
    if (!base64) {
        return res.status(400).json({ ok: false, error: 'base64 is required' });
    }
    try {
        const snapshot = await store.addSnapshot(req.params.id, req.params.frameId, base64, meta || {});
        res.json({ ok: true, data: snapshot });
    } catch (err) {
        res.status(404).json({ ok: false, error: err.message });
    }
}));

// DELETE /api/food-shoots/:id/frames/:frameId/snapshots/:snapshotId - Delete snapshot
router.delete('/:id/frames/:frameId/snapshots/:snapshotId', asyncHandler(async (req, res) => {
    try {
        await store.deleteSnapshot(req.params.id, req.params.frameId, req.params.snapshotId);
        res.json({ ok: true });
    } catch (err) {
        res.status(404).json({ ok: false, error: err.message });
    }
}));

// ═══════════════════════════════════════════════════════════════
// IMAGE SERVING
// ═══════════════════════════════════════════════════════════════

// GET /api/food-shoots/:id/images/:imageId - Serve image file
// Note: imageId can be a snapshotId (new format) - searches all frames
router.get('/:id/images/:imageId', asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;
    const shoot = await store.getFoodShootById(id);

    if (!shoot) return res.status(404).send('Shoot not found');

    // Search for the image across all frames' snapshots
    let localPath = null;
    for (const frame of shoot.frames || []) {
        const snapshot = frame.snapshots?.find(s => s.id === imageId);
        if (snapshot?.localPath) {
            localPath = snapshot.localPath;
            break;
        }
    }

    if (!localPath) return res.status(404).send('Image not found');

    res.sendFile(localPath);
}));

export default router;
