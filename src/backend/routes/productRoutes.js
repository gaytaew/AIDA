/**
 * Product Routes
 * 
 * API endpoints для генерации предметных фото.
 */

import express from 'express';
import { generateProductShootFrame } from '../services/productGenerator.js';
import { buildCollage } from '../utils/imageCollage.js';
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

// V2 параметры
import {
    SHOT_MODES,
    CATALOG_OPTIONS,
    FLATLAY_OPTIONS,
    LIFESTYLE_OPTIONS,
    GLOBAL_OPTIONS,
    PRESETS,
    DEFAULTS
} from '../params/productParamsV2.js';

const router = express.Router();

/**
 * GET /api/product/options
 * Возвращает все опции схемы для фронтенда (legacy V1)
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
 * GET /api/product/options-v2
 * Возвращает новую V2 схему параметров
 */
router.get('/options-v2', (req, res) => {
    res.json({
        ok: true,
        data: {
            modes: SHOT_MODES,
            catalog: CATALOG_OPTIONS,
            flatlay: FLATLAY_OPTIONS,
            lifestyle: LIFESTYLE_OPTIONS,
            global: GLOBAL_OPTIONS,
            presets: PRESETS,
            defaults: DEFAULTS
        }
    });
});

/**
 * POST /api/product/build-collage
 * Создаёт коллаж из массива фото
 */
router.post('/build-collage', async (req, res) => {
    try {
        const { photos } = req.body;

        if (!photos || !Array.isArray(photos) || photos.length === 0) {
            return res.status(400).json({ ok: false, error: 'Нужны фото для коллажа' });
        }

        const collage = await buildCollage(photos, {
            maxSize: 1536,
            jpegQuality: 90,
            minTile: 256,
            maxCols: 3
        });

        if (!collage) {
            return res.status(500).json({ ok: false, error: 'Не удалось создать коллаж' });
        }

        res.json({
            ok: true,
            data: {
                mimeType: collage.mimeType,
                base64: collage.base64,
                dataUrl: `data:${collage.mimeType};base64,${collage.base64}`
            }
        });

    } catch (error) {
        console.error('[ProductRoutes] build-collage error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/**
 * POST /api/product/generate
 * Генерирует изображение предмета(ов)
 * 
 * Поддерживает:
 * - Один предмет: subjectImage
 * - Несколько предметов: products[] с коллажами
 */
router.post('/generate', async (req, res) => {
    try {
        const {
            params,
            subjectImage,
            styleImage,
            baseImage,
            locationImage,  // NEW: референс локации/поверхности
            products,  // NEW: массив предметов с коллажами
            shootId,
            frameId
        } = req.body;

        if (!params || !params.subjectDescription) {
            return res.status(400).json({ ok: false, error: 'Необходимо описание предмета' });
        }

        // Обрабатываем multi-product режим
        let productImages = [];
        if (products && Array.isArray(products) && products.length > 0) {
            console.log(`[ProductRoutes] Multi-product mode: ${products.length} items`);

            // Создаём коллажи для каждого предмета
            for (const product of products) {
                if (product.photos && product.photos.length > 0) {
                    const collage = await buildCollage(product.photos, {
                        maxSize: 1024,
                        jpegQuality: 90,
                        minTile: 256,
                        maxCols: 2
                    });
                    if (collage) {
                        productImages.push({
                            name: product.name,
                            params: product.params || {},  // NEW: параметры предмета
                            ...collage
                        });
                    }
                } else if (product.collage) {
                    // Уже готовый коллаж
                    productImages.push({
                        name: product.name,
                        params: product.params || {},  // NEW
                        ...product.collage
                    });
                }
            }

            // Обновляем описание для multi-product
            if (productImages.length > 1) {
                const names = products.map(p => p.name).filter(Boolean).join(', ');
                if (names && !params.subjectDescription.includes(names)) {
                    params.subjectDescription += ` (предметы: ${names})`;
                }
            }
        }

        const result = await generateProductShootFrame({
            params,
            subjectImage: productImages.length > 0 ? productImages[0] : subjectImage,
            styleImage,
            baseImage,
            locationImage,  // NEW
            additionalProducts: productImages.slice(1) // Дополнительные предметы
        });

        // Сохраняем в персистенцию если указан shootId
        if (shootId && result.base64) {
            let savedImage;

            if (frameId) {
                savedImage = await store.addSnapshot(shootId, frameId, result.base64, {});
                savedImage.frameId = frameId;
            } else {
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

