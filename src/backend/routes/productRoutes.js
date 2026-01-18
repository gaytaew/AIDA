/**
 * Product Routes
 * 
 * API endpoints для генерации предметных фото.
 */

import express from 'express';
import { generateProductShootFrame } from '../services/productGenerator.js';
import {
    PRODUCT_CATEGORY,
    PRODUCT_PRESENTATION,
    PRODUCT_ANGLE,
    PRODUCT_FRAMING,
    PRODUCT_BACKGROUND,
    PRODUCT_SURFACE,
    PRODUCT_SHADOW,
    PRODUCT_LIGHTING,
    PRODUCT_LIGHT_DIRECTION,
    PRODUCT_MOOD,
    PRODUCT_COLOR_GRADE,
    PRODUCT_DETAIL_LEVEL,
    PRODUCT_SHOW_DETAILS,
    PRODUCT_ASPECT_RATIO,
    PRODUCT_IMAGE_SIZE,
    PRODUCT_PRESETS
} from '../schema/productShoot.js';
import store from '../store/productShootStore.js';

const router = express.Router();

/**
 * GET /api/product/options
 * Возвращает все опции схемы для фронтенда
 */
router.get('/options', (req, res) => {
    res.json({
        ok: true,
        data: {
            category: PRODUCT_CATEGORY,
            presentation: PRODUCT_PRESENTATION,
            angle: PRODUCT_ANGLE,
            framing: PRODUCT_FRAMING,
            background: PRODUCT_BACKGROUND,
            surface: PRODUCT_SURFACE,
            shadow: PRODUCT_SHADOW,
            lighting: PRODUCT_LIGHTING,
            lightDirection: PRODUCT_LIGHT_DIRECTION,
            mood: PRODUCT_MOOD,
            colorGrade: PRODUCT_COLOR_GRADE,
            detailLevel: PRODUCT_DETAIL_LEVEL,
            showDetails: PRODUCT_SHOW_DETAILS,
            aspectRatio: PRODUCT_ASPECT_RATIO,
            imageSize: PRODUCT_IMAGE_SIZE,
            presets: PRODUCT_PRESETS
        }
    });
});

/**
 * POST /api/product/generate
 * Генерирует изображение предмета
 */
router.post('/generate', async (req, res) => {
    try {
        const {
            params,
            subjectImage,
            styleImage,
            baseImage,
            shootId,
            frameId
        } = req.body;

        if (!params || !params.subjectDescription) {
            return res.status(400).json({ ok: false, error: 'Необходимо описание предмета' });
        }

        const result = await generateProductShootFrame({
            params,
            subjectImage,
            styleImage,
            baseImage
        });

        // Сохраняем в персистенцию если указан shootId
        if (shootId && result.base64) {
            let savedImage;

            if (frameId) {
                // Добавляем к существующему фрейму (вариация)
                savedImage = await store.addSnapshot(shootId, frameId, result.base64, {});
                savedImage.frameId = frameId;
            } else {
                // Создаём новый фрейм
                savedImage = await store.addImageToProductShoot(shootId, result.base64, params);
            }

            result.savedImage = savedImage;
        }

        res.json({
            ok: true,
            data: result
        });

    } catch (error) {
        console.error('[ProductRoutes] Generation error:', error);
        res.status(500).json({
            ok: false,
            error: error.message || 'Ошибка генерации'
        });
    }
});

export default router;
