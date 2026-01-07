/**
 * Emotion Routes
 * 
 * API endpoints for emotion presets.
 */

import express from 'express';
import {
  EMOTION_CATEGORIES,
  EMOTION_PRESETS,
  getEmotionsByCategory,
  getEmotionById,
  getAllEmotions,
  getEmotionOptions
} from '../schema/emotion.js';

const router = express.Router();

/**
 * GET /api/emotions — List all emotions
 */
router.get('/', (req, res) => {
  try {
    const emotions = getAllEmotions();
    res.json({
      ok: true,
      data: emotions,
      total: emotions.length
    });
  } catch (err) {
    console.error('[Emotion] List error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/emotions/options — Get emotions grouped by category for UI
 */
router.get('/options', (req, res) => {
  try {
    const options = getEmotionOptions();
    res.json({
      ok: true,
      data: {
        categories: EMOTION_CATEGORIES,
        emotions: options
      }
    });
  } catch (err) {
    console.error('[Emotion] Options error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/emotions/category/:category — Get emotions by category
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    
    if (!EMOTION_CATEGORIES.includes(category)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid category. Valid: ${EMOTION_CATEGORIES.join(', ')}`
      });
    }
    
    const emotions = getEmotionsByCategory(category);
    res.json({
      ok: true,
      data: emotions,
      total: emotions.length
    });
  } catch (err) {
    console.error('[Emotion] Category error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/emotions/:id — Get single emotion by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const emotion = getEmotionById(id);
    
    if (!emotion) {
      return res.status(404).json({
        ok: false,
        error: `Emotion "${id}" not found`
      });
    }
    
    res.json({
      ok: true,
      data: emotion
    });
  } catch (err) {
    console.error('[Emotion] Get error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

