/**
 * Location Schema
 * 
 * Defines a shooting location that can be:
 * 1. Generated as part of a Universe (5-10 locations per universe)
 * 2. Stored in a global catalog for reuse across shoots
 * 3. Selected for individual frames or as shoot-wide default
 */

/**
 * @typedef {Object} LocationLighting
 * @property {'natural'|'artificial'|'mixed'} type - Primary light source
 * @property {'soft'|'hard'|'dramatic'|'flat'} quality - Light quality
 * @property {'warm'|'cool'|'neutral'|'mixed'} temperature - Color temperature
 * @property {string} notes - Additional lighting notes
 */

/**
 * @typedef {Object} LocationAtmosphere
 * @property {'intimate'|'expansive'|'claustrophobic'|'open'} spaceFeeling
 * @property {'busy'|'quiet'|'isolated'|'public'} crowdLevel
 * @property {'day'|'night'|'golden_hour'|'blue_hour'|'any'} timeOfDay
 * @property {'summer'|'winter'|'autumn'|'spring'|'any'} season
 * @property {string} mood - Overall mood description
 */

/**
 * @typedef {Object} LocationSurfaces
 * @property {Array<string>} materials - e.g., ['concrete', 'metal', 'glass']
 * @property {Array<string>} textures - e.g., ['rough', 'smooth', 'weathered']
 * @property {Array<string>} colors - Dominant colors in the environment
 */

/**
 * @typedef {Object} LocationComposition
 * @property {Array<string>} suggestedAngles - e.g., ['low angle', 'eye level', 'overhead']
 * @property {Array<string>} framingOptions - e.g., ['wide shot', 'medium shot', 'close-up']
 * @property {string} backgroundType - e.g., 'urban backdrop', 'minimal', 'busy pattern'
 * @property {boolean} depthPotential - Can create depth/layers in composition
 */

/**
 * @typedef {Object} Location
 * @property {string} id - Unique identifier (e.g., LOC_NEON_ALLEY_01)
 * @property {string} label - Short name (e.g., "Neon Alley")
 * @property {string} description - Detailed description for prompt generation
 * @property {string} category - Category (e.g., 'urban', 'interior', 'nature', 'studio')
 * @property {Array<string>} tags - Search tags
 * @property {string|null} originUniverseId - Universe this location was generated for (null if global)
 * @property {LocationLighting} lighting - Lighting characteristics
 * @property {LocationAtmosphere} atmosphere - Atmosphere and mood
 * @property {LocationSurfaces} surfaces - Materials and textures
 * @property {LocationComposition} composition - Compositional suggestions
 * @property {string} promptSnippet - Ready-to-use prompt snippet
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

// ═══════════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════════

export const LOCATION_CATEGORIES = [
  'urban',        // Streets, alleys, parking lots, rooftops
  'interior',     // Apartments, studios, offices, cafes
  'industrial',   // Factories, warehouses, garages
  'nature',       // Parks, forests, beaches, fields
  'transport',    // Cars, trains, buses, stations
  'commercial',   // Shops, malls, markets
  'cultural',     // Museums, theaters, galleries
  'domestic',     // Kitchens, bathrooms, bedrooms
  'abstract'      // Minimal backgrounds, color walls
];

export const DEFAULT_LIGHTING = {
  type: 'natural',
  quality: 'soft',
  temperature: 'neutral',
  notes: ''
};

export const DEFAULT_ATMOSPHERE = {
  spaceFeeling: 'open',
  crowdLevel: 'quiet',
  timeOfDay: 'any',
  season: 'any',
  mood: ''
};

export const DEFAULT_SURFACES = {
  materials: [],
  textures: [],
  colors: []
};

export const DEFAULT_COMPOSITION = {
  suggestedAngles: ['eye level'],
  framingOptions: ['medium shot'],
  backgroundType: 'neutral',
  depthPotential: true
};

export const DEFAULT_LOCATION = {
  id: '',
  label: 'Новая локация',
  description: '',
  category: 'urban',
  tags: [],
  originUniverseId: null,
  lighting: DEFAULT_LIGHTING,
  atmosphere: DEFAULT_ATMOSPHERE,
  surfaces: DEFAULT_SURFACES,
  composition: DEFAULT_COMPOSITION,
  promptSnippet: '',
  createdAt: '',
  updatedAt: ''
};

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

export function generateLocationId(label = 'location') {
  const base = String(label || 'location')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toUpperCase()
    .slice(0, 15);
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LOC_${base}_${randomPart}`;
}

export function createEmptyLocation(label = 'Новая локация', universeId = null) {
  const now = new Date().toISOString();
  return {
    ...DEFAULT_LOCATION,
    id: generateLocationId(label),
    label,
    originUniverseId: universeId,
    createdAt: now,
    updatedAt: now
  };
}

export function validateLocation(location) {
  const errors = [];

  if (!location || typeof location !== 'object') {
    errors.push('Location must be an object');
    return { valid: false, errors };
  }

  if (!location.id || typeof location.id !== 'string') {
    errors.push('ID is required and must be a string');
  }

  if (!location.label || typeof location.label !== 'string') {
    errors.push('Label is required and must be a string');
  }

  if (typeof location.description !== 'string') {
    errors.push('Description must be a string');
  }

  if (!LOCATION_CATEGORIES.includes(location.category)) {
    errors.push(`Category must be one of: ${LOCATION_CATEGORIES.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Build a prompt snippet from location data
 */
export function buildLocationPromptSnippet(location) {
  if (!location) return '';

  const parts = [];

  // Main description
  if (location.description) {
    parts.push(location.description);
  }

  // Lighting
  if (location.lighting) {
    const l = location.lighting;
    const lightParts = [];
    if (l.type && l.type !== 'natural') lightParts.push(`${l.type} lighting`);
    if (l.quality) lightParts.push(`${l.quality} light`);
    if (l.temperature && l.temperature !== 'neutral') lightParts.push(`${l.temperature} tones`);
    if (lightParts.length) parts.push(lightParts.join(', '));
  }

  // Atmosphere
  if (location.atmosphere) {
    const a = location.atmosphere;
    if (a.timeOfDay && a.timeOfDay !== 'any') parts.push(`shot during ${a.timeOfDay.replace('_', ' ')}`);
    if (a.mood) parts.push(a.mood);
  }

  // Surfaces
  if (location.surfaces) {
    const s = location.surfaces;
    if (s.materials?.length) parts.push(`environment with ${s.materials.join(', ')}`);
  }

  return parts.join('; ');
}

/**
 * Options for UI dropdowns
 */
export const LOCATION_OPTIONS = {
  categories: LOCATION_CATEGORIES,
  lighting: {
    type: ['natural', 'artificial', 'mixed'],
    quality: ['soft', 'hard', 'dramatic', 'flat'],
    temperature: ['warm', 'cool', 'neutral', 'mixed']
  },
  atmosphere: {
    spaceFeeling: ['intimate', 'expansive', 'claustrophobic', 'open'],
    crowdLevel: ['busy', 'quiet', 'isolated', 'public'],
    timeOfDay: ['day', 'night', 'golden_hour', 'blue_hour', 'any'],
    season: ['summer', 'winter', 'autumn', 'spring', 'any']
  },
  composition: {
    suggestedAngles: ['low angle', 'eye level', 'high angle', 'overhead', 'dutch angle'],
    framingOptions: ['extreme wide', 'wide shot', 'medium shot', 'close-up', 'extreme close-up'],
    backgroundType: ['minimal', 'neutral', 'urban backdrop', 'nature backdrop', 'busy pattern', 'bokeh']
  }
};

