/**
 * Food Shoot Routes
 */

import express from 'express';
import { generateFoodShootFrame } from '../services/foodGenerator.js';
import { analyzeStyleReference } from '../services/foodStyleAnalyzer.js';
import {
    FOOD_CAMERA,
    FOOD_ANGLE,
    FOOD_LIGHTING,
    FOOD_PLATING,
    FOOD_STATE,
    FOOD_ASPECT_RATIO,
    FOOD_COMPOSITION,
    FOOD_DEPTH,
    FOOD_COLOR,
    FOOD_TEXTURE,
    FOOD_DYNAMICS,
    FOOD_SURFACE,
    FOOD_CROCKERY,
    FOOD_PRESETS,
    FOOD_IMAGE_SIZE,
    FOOD_MOOD,
    // New params
    FOOD_FOCUS_POINT,
    FOOD_LIGHT_DIRECTION,
    FOOD_SHADOWS,
    FOOD_HAPTICS,
    FOOD_FILM_STOCK
} from '../schema/foodShoot.js';
import store from '../store/foodShootStore.js';

const router = express.Router();

/**
 * POST /api/food/analyze-style
 * Analyzes a reference image and extracts style parameters
 */
router.post('/analyze-style', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image?.base64) {
            return res.status(400).json({ ok: false, error: 'No image provided' });
        }

        const result = await analyzeStyleReference(image);
        res.json(result);

    } catch (error) {
        console.error('[FoodRoutes] analyze-style error:', error);
        res.status(500).json({ ok: false, error: error.message || 'Analysis failed' });
    }
});


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
            imageSize: FOOD_IMAGE_SIZE,
            composition: FOOD_COMPOSITION,
            depth: FOOD_DEPTH,
            color: FOOD_COLOR,
            texture: FOOD_TEXTURE,
            dynamics: FOOD_DYNAMICS,
            surface: FOOD_SURFACE,
            crockery: FOOD_CROCKERY,
            presets: FOOD_PRESETS,
            mood: FOOD_MOOD,
            // New params (Thin Tuning)
            focusPoint: FOOD_FOCUS_POINT,
            lightDirection: FOOD_LIGHT_DIRECTION,
            shadows: FOOD_SHADOWS,
            haptics: FOOD_HAPTICS,
            filmStock: FOOD_FILM_STOCK
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
            styleImage,
            sketchImage, // Add sketch support
            shootId,
            frameId, // NEW: For adding variations to existing frame
            baseImage // Support modification workflow
        } = req.body;

        if (!params || !params.dishDescription) {
            return res.status(400).json({ ok: false, error: 'Missing dish description' });
        }

        const result = await generateFoodShootFrame({
            params,
            subjectImage,
            crockeryImage,
            styleImage,
            sketchImage,
            baseImage
        });

        // If shootId provided, save to persistence
        if (shootId && result.base64) {
            let savedImage;

            if (frameId) {
                // Add to existing frame (variation)
                savedImage = await store.addSnapshot(shootId, frameId, result.base64, {});
                savedImage.frameId = frameId;
            } else {
                // Create new frame (new generation)
                savedImage = await store.addImageToFoodShoot(shootId, result.base64, params);
            }

            result.savedImage = savedImage;
        }

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
