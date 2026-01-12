/**
 * Location Routes
 * 
 * API endpoints for managing locations.
 */

import express from 'express';
import {
  getAllLocations,
  getLocationById,
  getLocationsByCategory,
  getLocationsByTags,
  searchLocations,
  createLocation,
  updateLocation,
  deleteLocation
} from '../store/locationStore.js';
import { LOCATION_OPTIONS } from '../schema/location.js';
import { generateLocationFromPrompt } from '../services/locationGenerator.js';

const router = express.Router();

// GET /api/locations/options — Get options for UI dropdowns
router.get('/options', (req, res) => {
  res.json({
    ok: true,
    data: LOCATION_OPTIONS
  });
});

// POST /api/locations/generate — Generate location data from prompt/image
router.post('/generate', async (req, res) => {
  try {
    const { prompt, image } = req.body;
    
    if (!prompt && !image) {
      return res.status(400).json({ ok: false, error: 'Prompt or image is required' });
    }

    const locationData = await generateLocationFromPrompt(prompt, image);

    res.json({
      ok: true,
      data: locationData
    });
  } catch (err) {
    console.error('[Location] Generate error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/locations — List all locations (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { category, tags, search } = req.query;

    let locations;

    if (search) {
      locations = await searchLocations(search);
    } else if (category) {
      locations = await getLocationsByCategory(category);
    } else if (tags) {
      const tagList = String(tags).split(',').map(t => t.trim()).filter(Boolean);
      locations = await getLocationsByTags(tagList);
    } else {
      locations = await getAllLocations();
    }

    res.json({
      ok: true,
      data: locations,
      total: locations.length
    });
  } catch (err) {
    console.error('[Location] List error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/locations/:id — Get single location
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const location = await getLocationById(id);

    if (!location) {
      return res.status(404).json({
        ok: false,
        error: `Location "${id}" not found`
      });
    }

    res.json({ ok: true, data: location });
  } catch (err) {
    console.error('[Location] Get error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/locations — Create new location
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const result = await createLocation(data);

    if (!result.success) {
      return res.status(400).json({
        ok: false,
        errors: result.errors
      });
    }

    res.status(201).json({
      ok: true,
      data: result.location
    });
  } catch (err) {
    console.error('[Location] Create error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/locations/:id — Update location
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const result = await updateLocation(id, updates);

    if (!result.success) {
      const status = result.errors.some(e => e.includes('not found')) ? 404 : 400;
      return res.status(status).json({
        ok: false,
        errors: result.errors
      });
    }

    res.json({
      ok: true,
      data: result.location
    });
  } catch (err) {
    console.error('[Location] Update error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/locations/:id — Delete location
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteLocation(id);

    if (!result.success) {
      const status = result.errors.some(e => e.includes('not found')) ? 404 : 400;
      return res.status(status).json({
        ok: false,
        errors: result.errors
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[Location] Delete error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
