/**
 * Food Shoot Routes
 */

import express from 'express';
import { generateFoodShootFrame } from '../services/foodGenerator.js';
import {
    FOOD_CAMERA,
    FOOD_ANGLE,
    FOOD_LIGHTING,
    FOOD_PLATING,
    FOOD_STATE,
    FOOD_ASPECT_RATIO,
    FOOD_QUALITY
} from '../schema/foodShoot.js';

const router = express.Router();

/**
 * GET /api/food/options
 * Returns all schema options for the frontend editor
 */
router.get('/options', (req, res) => {
    res.json({
        ok: true,
        data: {
            camera: FOOD_CAMERA,
            angle: FOOD_ANGLE,
            lighting: FOOD_LIGHTING,
            plating: FOOD_PLATING,
            state: FOOD_STATE,
            aspectRatio: FOOD_ASPECT_RATIO,
            quality: FOOD_QUALITY
        }
    });
});

/**
 * POST /api/food/generate
 * Generates a food shoot frame
 */
router.post('/generate', async (req, res) => {
    try {
        const {
            params,
            subjectImage,
            crockeryImage,
            styleImage
        } = req.body;

        if (!params || !params.dishDescription) {
            return res.status(400).json({ ok: false, error: 'Missing dish description' });
        }

        const result = await generateFoodShootFrame({
            params,
            subjectImage,
            crockeryImage,
            styleImage
        });

        res.json({
            ok: true,
            data: result
        });

    } catch (error) {
        console.error('[FoodRoutes] Generation error:', error);
        res.status(500).json({
            ok: false,
            error: error.message || 'Failed to generate food shoot'
        });
    }
});

export default router;
