/**
 * Emotion Routes
 * 
 * API endpoints for emotion presets.
 */

import express from 'express';
import {
  EMOTION_CATEGORIES,
  EMOTION_PRESETS,
  INTENSITY_LEVELS,
  GLOBAL_EMOTION_RULES,
  MOOD_EMOTION_COMPATIBILITY,
  getEmotionsByCategory,
  getEmotionById,
  getAllEmotions,
  getEmotionOptions,
  buildEmotionPrompt,
  checkMoodEmotionCompatibility
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
        emotions: options,
        intensityLevels: INTENSITY_LEVELS,
        globalRules: GLOBAL_EMOTION_RULES
      }
    });
  } catch (err) {
    console.error('[Emotion] Options error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/emotions/:id/prompt — Get full prompt block for emotion
 * Query params: intensity (1-5, optional)
 */
router.get('/:id/prompt', (req, res) => {
  try {
    const { id } = req.params;
    const intensity = parseInt(req.query.intensity) || null;
    
    const emotion = getEmotionById(id);
    if (!emotion) {
      return res.status(404).json({
        ok: false,
        error: `Emotion "${id}" not found`
      });
    }
    
    const prompt = buildEmotionPrompt(id, intensity);
    
    res.json({
      ok: true,
      data: {
        emotionId: id,
        label: emotion.label,
        intensity: intensity || emotion.defaultIntensity,
        prompt
      }
    });
  } catch (err) {
    console.error('[Emotion] Prompt error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/emotions/category/:category — Get emotions by category
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    
    const validCategoryIds = EMOTION_CATEGORIES.map(c => c.id);
    if (!validCategoryIds.includes(category)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid category. Valid: ${validCategoryIds.join(', ')}`
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
 * POST /api/emotions/check-compatibility — Check mood/emotion compatibility
 * Body: { visualMood: string, emotionId: string }
 */
router.post('/check-compatibility', (req, res) => {
  try {
    const { visualMood, emotionId } = req.body;
    
    if (!visualMood || !emotionId) {
      return res.status(400).json({
        ok: false,
        error: 'Both visualMood and emotionId are required'
      });
    }
    
    const result = checkMoodEmotionCompatibility(visualMood, emotionId);
    
    res.json({
      ok: true,
      data: result
    });
  } catch (err) {
    console.error('[Emotion] Compatibility check error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/emotions/compatibility — Get all mood/emotion compatibility rules
 */
router.get('/compatibility', (req, res) => {
  try {
    res.json({
      ok: true,
      data: MOOD_EMOTION_COMPATIBILITY
    });
  } catch (err) {
    console.error('[Emotion] Compatibility data error:', err);
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

