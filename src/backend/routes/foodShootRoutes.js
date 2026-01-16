/**
 * Food Shoot Routes
 * 
 * API endpoints for managing Food Shoots.
 */

import express from 'express';
import path from 'path';
import store from '../store/foodShootStore.js';

const router = express.Router();

// Helper to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/food-shoots - List all shoots
router.get('/', asyncHandler(async (req, res) => {
    const shoots = await store.getAllFoodShoots();
    res.json({ ok: true, data: shoots });
}));

// POST /api/food-shoots - Create new shoot
router.post('/', asyncHandler(async (req, res) => {
    const { label } = req.body;
    const shoot = await store.createFoodShoot(label || 'New Session');
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

// GET /api/food-shoots/:id/images/:imageId - Serve image file
router.get('/:id/images/:imageId', asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;
    const shoot = await store.getFoodShootById(id);

    if (!shoot) return res.status(404).send('Shoot not found');

    const image = shoot.images.find(img => img.id === imageId);
    if (!image || !image.localPath) return res.status(404).send('Image not found');

    res.sendFile(image.localPath);
}));

export default router;
