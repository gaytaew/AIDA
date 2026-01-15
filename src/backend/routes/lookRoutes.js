/**
 * Look Routes
 * 
 * API endpoints for managing looks.
 */

import express from 'express';
import {
    getAllLooks,
    getLookById,
    createLook,
    updateLook,
    deleteLook
} from '../store/lookStore.js';
import { LOOK_CATEGORIES } from '../schema/look.js';

const router = express.Router();

// GET /api/looks/options
router.get('/options', (req, res) => {
    res.json({
        ok: true,
        data: {
            categories: LOOK_CATEGORIES
        }
    });
});

// GET /api/looks
router.get('/', async (req, res) => {
    try {
        const looks = await getAllLooks();
        res.json({
            ok: true,
            data: looks,
            total: looks.length
        });
    } catch (err) {
        console.error('[Look] List error:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// GET /api/looks/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const look = await getLookById(id);

        if (!look) {
            return res.status(404).json({ ok: false, error: `Look "${id}" not found` });
        }

        res.json({ ok: true, data: look });
    } catch (err) {
        console.error('[Look] Get error:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// POST /api/looks
router.post('/', async (req, res) => {
    try {
        const result = await createLook(req.body);
        if (!result.success) {
            return res.status(400).json({ ok: false, errors: result.errors });
        }
        res.status(201).json({ ok: true, data: result.look });
    } catch (err) {
        console.error('[Look] Create error:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// PUT /api/looks/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateLook(id, req.body);

        if (!result.success) {
            return res.status(400).json({ ok: false, errors: result.errors });
        }

        res.json({ ok: true, data: result.look });
    } catch (err) {
        console.error('[Look] Update error:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// DELETE /api/looks/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteLook(id);

        if (!result.success) {
            return res.status(400).json({ ok: false, errors: result.errors });
        }

        res.json({ ok: true });
    } catch (err) {
        console.error('[Look] Delete error:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

export default router;
