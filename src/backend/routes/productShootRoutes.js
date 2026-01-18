/**
 * Product Shoot Routes
 * 
 * API endpoints для управления сессиями предметных съёмок.
 * Иерархия: Shoot -> Frame -> Snapshot
 */

import express from 'express';
import store from '../store/productShootStore.js';

const router = express.Router();

// Helper для async ошибок
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ═══════════════════════════════════════════════════════════════
// SHOOT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// GET /api/product-shoots - Список всех съёмок
router.get('/', asyncHandler(async (req, res) => {
    const shoots = await store.getAllProductShoots();
    res.json({ ok: true, data: shoots });
}));

// POST /api/product-shoots - Создать новую съёмку
router.post('/', asyncHandler(async (req, res) => {
    const { label } = req.body;
    const shoot = await store.createProductShoot(label || 'Новая съёмка');
    res.json({ ok: true, data: shoot });
}));

// GET /api/product-shoots/:id - Получить конкретную съёмку
router.get('/:id', asyncHandler(async (req, res) => {
    const shoot = await store.getProductShootById(req.params.id);
    if (!shoot) {
        return res.status(404).json({ ok: false, error: 'Съёмка не найдена' });
    }
    res.json({ ok: true, data: shoot });
}));

// DELETE /api/product-shoots/:id - Удалить съёмку
router.delete('/:id', asyncHandler(async (req, res) => {
    const success = await store.deleteProductShoot(req.params.id);
    if (!success) {
        return res.status(404).json({ ok: false, error: 'Съёмка не найдена' });
    }
    res.json({ ok: true });
}));

// ═══════════════════════════════════════════════════════════════
// FRAME ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// POST /api/product-shoots/:id/frames - Создать новый фрейм
router.post('/:id/frames', asyncHandler(async (req, res) => {
    const { params } = req.body;
    try {
        const frame = await store.addFrame(req.params.id, params || {});
        res.json({ ok: true, data: frame });
    } catch (err) {
        res.status(404).json({ ok: false, error: err.message });
    }
}));

// DELETE /api/product-shoots/:id/frames/:frameId - Удалить фрейм
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

// POST /api/product-shoots/:id/frames/:frameId/snapshots - Добавить снапшот
router.post('/:id/frames/:frameId/snapshots', asyncHandler(async (req, res) => {
    const { base64, meta } = req.body;
    if (!base64) {
        return res.status(400).json({ ok: false, error: 'base64 обязателен' });
    }
    try {
        const snapshot = await store.addSnapshot(req.params.id, req.params.frameId, base64, meta || {});
        res.json({ ok: true, data: snapshot });
    } catch (err) {
        res.status(404).json({ ok: false, error: err.message });
    }
}));

// DELETE /api/product-shoots/:id/frames/:frameId/snapshots/:snapshotId - Удалить снапшот
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

// GET /api/product-shoots/:id/images/:imageId - Отдать файл изображения
router.get('/:id/images/:imageId', asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;
    const shoot = await store.getProductShootById(id);

    if (!shoot) return res.status(404).send('Съёмка не найдена');

    // Ищем изображение по всем фреймам
    let localPath = null;
    for (const frame of shoot.frames || []) {
        const snapshot = frame.snapshots?.find(s => s.id === imageId);
        if (snapshot?.localPath) {
            localPath = snapshot.localPath;
            break;
        }
    }

    if (!localPath) return res.status(404).send('Изображение не найдено');

    res.sendFile(localPath);
}));

export default router;
