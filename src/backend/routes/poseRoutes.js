/**
 * Pose Routes
 * 
 * API endpoints for pose presets.
 */

import express from 'express';
import {
    POSE_CATEGORIES,
    GLOBAL_POSE_RULES,
    getPoseById,
    getAllPoses,
    getPosesByCategory,
    getPoseOptions,
    buildPosePrompt
} from '../schema/pose.js';

const router = express.Router();

/**
 * GET /api/poses — List all poses
 */
router.get('/', (req, res) => {
    try {
        const poses = getAllPoses();
        res.json({
            ok: true,
            data: poses,
            total: poses.length
        });
    } catch (err) {
        console.error('[Pose] List error:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * GET /api/poses/options — Get poses grouped by category for UI
 */
router.get('/options', (req, res) => {
    try {
        const options = getPoseOptions();
        res.json({
            ok: true,
            data: {
                categories: options.categories,
                poses: options.poses,
                globalRules: options.rules
            }
        });
    } catch (err) {
        console.error('[Pose] Options error:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * GET /api/poses/:id/prompt — Get full prompt block for pose
 * Query params: adherence (1-4, optional)
 */
router.get('/:id/prompt', (req, res) => {
    try {
        const { id } = req.params;
        const adherence = parseInt(req.query.adherence) || 2;

        const pose = getPoseById(id);
        if (!pose) {
            return res.status(404).json({
                ok: false,
                error: `Pose "${id}" not found`
            });
        }

        const prompt = buildPosePrompt(id, adherence);

        res.json({
            ok: true,
            data: {
                poseId: id,
                label: pose.label,
                adherence,
                prompt
            }
        });
    } catch (err) {
        console.error('[Pose] Prompt error:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * GET /api/poses/category/:category — Get poses by category
 */
router.get('/category/:category', (req, res) => {
    try {
        const { category } = req.params;

        const validCategoryIds = POSE_CATEGORIES.map(c => c.id);
        if (!validCategoryIds.includes(category)) {
            return res.status(400).json({
                ok: false,
                error: `Invalid category. Valid: ${validCategoryIds.join(', ')}`
            });
        }

        const poses = getPosesByCategory(category);
        res.json({
            ok: true,
            data: poses,
            total: poses.length
        });
    } catch (err) {
        console.error('[Pose] Category error:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * GET /api/poses/:id — Get single pose by ID
 */
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const pose = getPoseById(id);

        if (!pose) {
            return res.status(404).json({
                ok: false,
                error: `Pose "${id}" not found`
            });
        }

        res.json({
            ok: true,
            data: pose
        });
    } catch (err) {
        console.error('[Pose] Get error:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

export default router;
