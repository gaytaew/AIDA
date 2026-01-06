/**
 * Location Schema
 * 
 * A location represents a physical/virtual place where a shoot takes place.
 * Contains environment parameters: type, surface, lighting, props.
 */

// ═══════════════════════════════════════════════════════════════
// LOCATION OPTIONS
// ═══════════════════════════════════════════════════════════════

export const ENVIRONMENT_TYPE_OPTIONS = [
  'studio',      // Студия
  'indoor',      // Интерьер
  'outdoor',     // Экстерьер
  'urban',       // Городская среда
  'nature',      // Природа
  'abstract'     // Абстрактный фон
];

export const LIGHTING_TYPE_OPTIONS = [
  'natural',           // Естественный свет
  'artificial',        // Искусственный свет
  'mixed',             // Смешанный
  'studio_flash',      // Студийная вспышка
  'on_camera_flash',   // Накамерная вспышка
  'ambient',           // Рассеянный
  'dramatic'           // Драматичный
];

export const TIME_OF_DAY_OPTIONS = [
  'golden_hour',   // Золотой час
  'blue_hour',     // Синий час
  'midday',        // Полдень
  'sunset',        // Закат
  'sunrise',       // Рассвет
  'night',         // Ночь
  'overcast',      // Пасмурно
  'any'            // Любое время
];

export const SURFACE_TYPE_OPTIONS = [
  'seamless',      // Бесшовный фон
  'concrete',      // Бетон
  'wood',          // Дерево
  'fabric',        // Ткань
  'natural',       // Натуральная поверхность
  'sand',          // Песок
  'grass',         // Трава
  'water',         // Вода
  'pavement',      // Асфальт/плитка
  'carpet',        // Ковёр
  'custom'         // Пользовательская
];

export const DEFAULT_LOCATION_CATEGORIES = [
  'studio',
  'street',
  'nature',
  'interior',
  'rooftop',
  'beach',
  'urban',
  'industrial'
];

export const DEFAULT_LOCATION_TAGS = [
  // Environment
  'indoor', 'outdoor', 'studio', 'location',
  // Lighting
  'natural-light', 'flash', 'golden-hour', 'night',
  // Surface
  'seamless', 'concrete', 'wood', 'grass',
  // Mood
  'minimal', 'dramatic', 'cozy', 'industrial'
];

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} LocationLighting
 * @property {string} type - Тип освещения
 * @property {string} timeOfDay - Время суток
 * @property {string} description - Описание освещения
 */

/**
 * @typedef {Object} AssetRef
 * @property {string} assetId - Asset identifier
 * @property {string} url - URL or data URL
 * @property {string} [label] - Optional label
 */

/**
 * @typedef {Object} Location
 * @property {string} id - Unique identifier
 * @property {string} label - Human-readable name
 * @property {string} description - Detailed description for prompt generation
 * @property {string} category - Primary category
 * @property {Array<string>} tags - Tags for filtering
 * @property {string} environmentType - Тип окружения
 * @property {string} surface - Описание поверхности
 * @property {LocationLighting} lighting - Параметры освещения
 * @property {Array<string>} props - Объекты в кадре
 * @property {AssetRef|null} sketchAsset - Sketch/reference image
 * @property {string} promptSnippet - Ready-to-use prompt snippet
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

// ═══════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_LIGHTING = {
  type: 'natural',
  timeOfDay: 'any',
  description: ''
};

export const DEFAULT_LOCATION = {
  id: '',
  label: 'Новая локация',
  description: '',
  category: 'studio',
  tags: [],
  environmentType: 'studio',
  surface: '',
  lighting: { ...DEFAULT_LIGHTING },
  props: [],
  sketchAsset: null,
  promptSnippet: '',
  createdAt: '',
  updatedAt: ''
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function generateLocationId(category = 'location') {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  const catCode = String(category || 'location').toUpperCase().slice(0, 8);
  return `LOC_${catCode}_${datePart}_${randomPart}`;
}

export function createEmptyLocation(label = 'Новая локация', category = 'studio') {
  const now = new Date().toISOString();
  return {
    ...DEFAULT_LOCATION,
    id: generateLocationId(category),
    label,
    category,
    lighting: { ...DEFAULT_LIGHTING },
    props: [],
    tags: [],
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
    errors.push('Location must have a string id');
  }

  if (!location.label || typeof location.label !== 'string') {
    errors.push('Location must have a string label');
  }

  // Validate environment type if present
  if (location.environmentType && !ENVIRONMENT_TYPE_OPTIONS.includes(location.environmentType)) {
    errors.push(`Invalid environmentType: ${location.environmentType}`);
  }

  // Validate lighting if present
  if (location.lighting) {
    const l = location.lighting;
    if (l.type && !LIGHTING_TYPE_OPTIONS.includes(l.type)) {
      errors.push(`Invalid lighting.type: ${l.type}`);
    }
    if (l.timeOfDay && !TIME_OF_DAY_OPTIONS.includes(l.timeOfDay)) {
      errors.push(`Invalid lighting.timeOfDay: ${l.timeOfDay}`);
    }
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

  // Environment type
  if (location.environmentType) {
    const envMap = {
      studio: 'studio setting',
      indoor: 'indoor environment',
      outdoor: 'outdoor location',
      urban: 'urban environment',
      nature: 'natural setting',
      abstract: 'abstract background'
    };
    parts.push(envMap[location.environmentType] || location.environmentType);
  }

  // Surface
  if (location.surface) {
    parts.push(location.surface);
  }

  // Lighting
  if (location.lighting) {
    const l = location.lighting;
    if (l.type && l.type !== 'natural') {
      const lightMap = {
        artificial: 'artificial lighting',
        mixed: 'mixed lighting',
        studio_flash: 'studio flash',
        on_camera_flash: 'on-camera flash',
        ambient: 'ambient light',
        dramatic: 'dramatic lighting'
      };
      parts.push(lightMap[l.type] || l.type);
    }
    if (l.timeOfDay && l.timeOfDay !== 'any') {
      const timeMap = {
        golden_hour: 'golden hour light',
        blue_hour: 'blue hour light',
        midday: 'midday sun',
        sunset: 'sunset light',
        sunrise: 'sunrise light',
        night: 'night time',
        overcast: 'overcast/diffused light'
      };
      parts.push(timeMap[l.timeOfDay] || l.timeOfDay);
    }
    if (l.description) {
      parts.push(l.description);
    }
  }

  // Props
  if (Array.isArray(location.props) && location.props.length > 0) {
    parts.push(`props: ${location.props.join(', ')}`);
  }

  // Description
  if (location.description) {
    parts.push(location.description);
  }

  return parts.join(', ');
}

/**
 * All options for UI dropdowns
 */
export const LOCATION_OPTIONS = {
  environmentType: ENVIRONMENT_TYPE_OPTIONS,
  lightingType: LIGHTING_TYPE_OPTIONS,
  timeOfDay: TIME_OF_DAY_OPTIONS,
  surfaceType: SURFACE_TYPE_OPTIONS,
  categories: DEFAULT_LOCATION_CATEGORIES,
  tags: DEFAULT_LOCATION_TAGS
};
