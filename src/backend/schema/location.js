/**
 * Location Schema
 * 
 * A location represents a physical/virtual place where a shoot takes place.
 * Contains environment parameters: type, surface, lighting, props.
 * 
 * NEW: Hierarchical context-aware parameters system.
 * Parameters are shown/applied only when they make sense for the space type.
 */

// ═══════════════════════════════════════════════════════════════
// SPACE TYPE - PRIMARY SELECTOR (determines available sub-parameters)
// ═══════════════════════════════════════════════════════════════

export const SPACE_TYPE_OPTIONS = [
  { id: 'interior', label: 'Интерьер', icon: '🏠', hasWeather: false },
  { id: 'exterior_urban', label: 'Экстерьер: Город', icon: '🏙️', hasWeather: true },
  { id: 'exterior_nature', label: 'Экстерьер: Природа', icon: '🌲', hasWeather: true },
  { id: 'rooftop_terrace', label: 'Крыша / Терраса', icon: '🌆', hasWeather: true },
  { id: 'transport', label: 'Транспорт', icon: '🚗', hasWeather: false },
  { id: 'studio', label: 'Студия', icon: '📷', hasWeather: false }
];

// ═══════════════════════════════════════════════════════════════
// INTERIOR-SPECIFIC OPTIONS (when spaceType === 'interior')
// ═══════════════════════════════════════════════════════════════

export const INTERIOR_TYPE_OPTIONS = [
  { id: 'residential', label: 'Жилое помещение', subtypes: [
    { id: 'apartment', label: 'Квартира' },
    { id: 'loft', label: 'Лофт' },
    { id: 'house', label: 'Частный дом' },
    { id: 'bedroom', label: 'Спальня' },
    { id: 'living_room', label: 'Гостиная' },
    { id: 'kitchen', label: 'Кухня' },
    { id: 'bathroom', label: 'Ванная' },
    { id: 'hallway', label: 'Прихожая/Коридор' }
  ]},
  { id: 'commercial', label: 'Коммерческое', subtypes: [
    { id: 'office', label: 'Офис' },
    { id: 'hotel_lobby', label: 'Лобби отеля' },
    { id: 'hotel_room', label: 'Номер отеля' },
    { id: 'restaurant', label: 'Ресторан' },
    { id: 'cafe', label: 'Кафе' },
    { id: 'bar', label: 'Бар' },
    { id: 'shop', label: 'Магазин' },
    { id: 'showroom', label: 'Шоурум' }
  ]},
  { id: 'cultural', label: 'Культурное', subtypes: [
    { id: 'museum', label: 'Музей' },
    { id: 'gallery', label: 'Галерея' },
    { id: 'theater', label: 'Театр' },
    { id: 'library', label: 'Библиотека' }
  ]},
  { id: 'industrial', label: 'Индустриальное', subtypes: [
    { id: 'warehouse', label: 'Склад' },
    { id: 'factory', label: 'Фабрика/Цех' },
    { id: 'garage', label: 'Гараж' },
    { id: 'parking', label: 'Паркинг' }
  ]}
];

export const INTERIOR_STYLE_OPTIONS = [
  { id: 'modern_minimal', label: 'Современный минимализм' },
  { id: 'scandinavian', label: 'Скандинавский' },
  { id: 'industrial', label: 'Индустриальный' },
  { id: 'art_deco', label: 'Ар-деко' },
  { id: 'classic_european', label: 'Классический европейский' },
  { id: 'bohemian', label: 'Богемный / Бохо' },
  { id: 'japanese_zen', label: 'Японский дзен' },
  { id: 'mid_century', label: 'Mid-century modern' },
  { id: 'brutalist', label: 'Брутализм' },
  { id: 'maximalist', label: 'Максимализм' },
  { id: 'vintage_retro', label: 'Винтаж / Ретро' },
  { id: 'eclectic', label: 'Эклектика' }
];

export const WINDOW_LIGHT_OPTIONS = [
  { id: 'none', label: 'Без окон' },
  { id: 'small', label: 'Небольшие окна' },
  { id: 'large', label: 'Большие окна' },
  { id: 'floor_to_ceiling', label: 'Панорамные окна' },
  { id: 'skylights', label: 'Мансардные окна / Фонари' }
];

// ═══════════════════════════════════════════════════════════════
// URBAN-SPECIFIC OPTIONS (when spaceType === 'exterior_urban')
// ═══════════════════════════════════════════════════════════════

export const URBAN_TYPE_OPTIONS = [
  { id: 'city_street', label: 'Городская улица' },
  { id: 'alley', label: 'Переулок' },
  { id: 'plaza', label: 'Площадь' },
  { id: 'park', label: 'Городской парк' },
  { id: 'bridge', label: 'Мост' },
  { id: 'subway_entrance', label: 'Вход в метро' },
  { id: 'train_station', label: 'Вокзал' },
  { id: 'parking_lot', label: 'Парковка' },
  { id: 'market', label: 'Рынок' },
  { id: 'downtown', label: 'Центр города' },
  { id: 'residential_area', label: 'Жилой район' },
  { id: 'industrial_district', label: 'Промзона' },
  { id: 'waterfront', label: 'Набережная' }
];

export const URBAN_ARCHITECTURE_OPTIONS = [
  { id: 'modern', label: 'Современная' },
  { id: 'historic', label: 'Историческая' },
  { id: 'mixed', label: 'Смешанная' },
  { id: 'brutalist', label: 'Брутализм' },
  { id: 'art_nouveau', label: 'Модерн' },
  { id: 'soviet', label: 'Советская' },
  { id: 'asian', label: 'Азиатская' },
  { id: 'mediterranean', label: 'Средиземноморская' }
];

export const URBAN_DENSITY_OPTIONS = [
  { id: 'crowded', label: 'Людное место' },
  { id: 'moderate', label: 'Умеренно' },
  { id: 'sparse', label: 'Малолюдно' },
  { id: 'empty', label: 'Безлюдно' }
];

// ═══════════════════════════════════════════════════════════════
// NATURE-SPECIFIC OPTIONS (when spaceType === 'exterior_nature')
// ═══════════════════════════════════════════════════════════════

export const NATURE_TYPE_OPTIONS = [
  { id: 'forest', label: 'Лес' },
  { id: 'beach', label: 'Пляж' },
  { id: 'mountains', label: 'Горы' },
  { id: 'desert', label: 'Пустыня' },
  { id: 'field_meadow', label: 'Поле / Луг' },
  { id: 'lake', label: 'Озеро' },
  { id: 'river', label: 'Река' },
  { id: 'waterfall', label: 'Водопад' },
  { id: 'garden', label: 'Сад' },
  { id: 'vineyard', label: 'Виноградник' },
  { id: 'jungle', label: 'Джунгли' },
  { id: 'savanna', label: 'Саванна' },
  { id: 'canyon', label: 'Каньон' }
];

export const VEGETATION_OPTIONS = [
  { id: 'lush', label: 'Пышная растительность' },
  { id: 'sparse', label: 'Редкая растительность' },
  { id: 'blooming', label: 'Цветущая' },
  { id: 'autumn_colors', label: 'Осенние краски' },
  { id: 'bare', label: 'Голые деревья' },
  { id: 'snow_covered', label: 'Заснеженная' },
  { id: 'tropical', label: 'Тропическая' }
];

export const TERRAIN_OPTIONS = [
  { id: 'flat', label: 'Равнина' },
  { id: 'hilly', label: 'Холмистая' },
  { id: 'mountainous', label: 'Горная' },
  { id: 'rocky', label: 'Скалистая' },
  { id: 'sandy', label: 'Песчаная' }
];

// ═══════════════════════════════════════════════════════════════
// ROOFTOP/TERRACE OPTIONS (when spaceType === 'rooftop_terrace')
// ═══════════════════════════════════════════════════════════════

export const ROOFTOP_TYPE_OPTIONS = [
  { id: 'open_rooftop', label: 'Открытая крыша' },
  { id: 'rooftop_bar', label: 'Руфтоп-бар' },
  { id: 'terrace', label: 'Терраса' },
  { id: 'balcony', label: 'Балкон' },
  { id: 'penthouse_terrace', label: 'Терраса пентхауса' }
];

export const CITY_VIEW_OPTIONS = [
  { id: 'skyline', label: 'Панорама города' },
  { id: 'street_below', label: 'Вид на улицу' },
  { id: 'park_view', label: 'Вид на парк' },
  { id: 'water_view', label: 'Вид на воду' },
  { id: 'mountains_view', label: 'Вид на горы' },
  { id: 'no_view', label: 'Без вида (стены)' }
];

// ═══════════════════════════════════════════════════════════════
// TRANSPORT OPTIONS (when spaceType === 'transport')
// ═══════════════════════════════════════════════════════════════

export const TRANSPORT_TYPE_OPTIONS = [
  { id: 'car_interior', label: 'Салон автомобиля' },
  { id: 'car_exterior', label: 'У автомобиля (снаружи)' },
  { id: 'train', label: 'Поезд' },
  { id: 'plane', label: 'Самолёт' },
  { id: 'yacht', label: 'Яхта' },
  { id: 'boat', label: 'Лодка' },
  { id: 'motorcycle', label: 'Мотоцикл' },
  { id: 'bicycle', label: 'Велосипед' },
  { id: 'helicopter', label: 'Вертолёт' }
];

export const VEHICLE_STYLE_OPTIONS = [
  { id: 'luxury', label: 'Люкс' },
  { id: 'vintage', label: 'Винтаж' },
  { id: 'sporty', label: 'Спортивный' },
  { id: 'everyday', label: 'Обычный' },
  { id: 'exotic', label: 'Экзотический' }
];

export const MOTION_OPTIONS = [
  { id: 'parked', label: 'На месте' },
  { id: 'slow_motion', label: 'Медленное движение' },
  { id: 'moving', label: 'В движении' },
  { id: 'speeding', label: 'На скорости' }
];

// ═══════════════════════════════════════════════════════════════
// STUDIO OPTIONS (when spaceType === 'studio')
// ═══════════════════════════════════════════════════════════════

export const STUDIO_BACKDROP_OPTIONS = [
  { id: 'white_seamless', label: 'Белый бесшовный' },
  { id: 'black_seamless', label: 'Чёрный бесшовный' },
  { id: 'gray_seamless', label: 'Серый бесшовный' },
  { id: 'colored', label: 'Цветной фон' },
  { id: 'textured', label: 'Текстурный фон' },
  { id: 'gradient', label: 'Градиент' },
  { id: 'cyclorama', label: 'Циклорама' }
];

export const STUDIO_LIGHTING_SETUP_OPTIONS = [
  { id: 'one_light', label: 'Один источник' },
  { id: 'two_light', label: 'Два источника' },
  { id: 'three_point', label: 'Трёхточечный' },
  { id: 'beauty_dish', label: 'Beauty dish' },
  { id: 'softbox', label: 'Софтбокс' },
  { id: 'ring_light', label: 'Кольцевой свет' },
  { id: 'natural_window', label: 'Естественный от окна' }
];

// ═══════════════════════════════════════════════════════════════
// UNIVERSAL AMBIENT OPTIONS (weather, season, atmosphere)
// ═══════════════════════════════════════════════════════════════

export const WEATHER_OPTIONS = [
  { id: 'clear', label: 'Ясно', icon: '☀️' },
  { id: 'partly_cloudy', label: 'Переменная облачность', icon: '⛅' },
  { id: 'overcast', label: 'Пасмурно', icon: '☁️' },
  { id: 'light_rain', label: 'Лёгкий дождь', icon: '🌧️' },
  { id: 'heavy_rain', label: 'Сильный дождь', icon: '⛈️' },
  { id: 'fog', label: 'Туман', icon: '🌫️' },
  { id: 'mist', label: 'Дымка', icon: '🌁' },
  { id: 'snow', label: 'Снег', icon: '❄️' },
  { id: 'storm', label: 'Гроза', icon: '⛈️' },
  { id: 'wind', label: 'Ветрено', icon: '💨' }
];

export const SEASON_OPTIONS = [
  { id: 'spring', label: 'Весна', icon: '🌸' },
  { id: 'summer', label: 'Лето', icon: '☀️' },
  { id: 'autumn', label: 'Осень', icon: '🍂' },
  { id: 'winter', label: 'Зима', icon: '❄️' }
];

export const ATMOSPHERE_OPTIONS = [
  { id: 'neutral', label: 'Нейтральная' },
  { id: 'dusty', label: 'Пыльная' },
  { id: 'humid', label: 'Влажная' },
  { id: 'crisp', label: 'Свежая/Морозная' },
  { id: 'smoky', label: 'Дымная' },
  { id: 'hazy', label: 'Туманная' },
  { id: 'steamy', label: 'Парящая' }
];

// ═══════════════════════════════════════════════════════════════
// LEGACY OPTIONS (for backwards compatibility)
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

// Alias for backwards compatibility
export const LOCATION_CATEGORIES = DEFAULT_LOCATION_CATEGORIES;

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
 * @property {Array<AssetRef>} referenceImages - Reference images for this location (optional)
 * @property {string|null} sourceUniverseId - ID of universe that generated this location (if auto-created)
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

// Default frame params for location (used when no frame is explicitly selected)
export const DEFAULT_LOCATION_FRAME_PARAMS = {
  shotSize: 'medium_full',
  cameraAngle: 'eye_level',
  poseType: 'standing',
  composition: 'rule_of_thirds',
  poseDescription: 'Natural relaxed pose, weight on one leg'
};

// Default interior settings
export const DEFAULT_INTERIOR = {
  type: 'residential',
  subtype: 'apartment',
  style: 'modern_minimal',
  windowLight: 'large',
  furniture: []
};

// Default urban settings
export const DEFAULT_URBAN = {
  type: 'city_street',
  architecture: 'modern',
  density: 'sparse'
};

// Default nature settings
export const DEFAULT_NATURE = {
  type: 'forest',
  vegetation: 'lush',
  terrain: 'flat'
};

// Default rooftop settings
export const DEFAULT_ROOFTOP = {
  type: 'open_rooftop',
  cityView: 'skyline'
};

// Default transport settings
export const DEFAULT_TRANSPORT = {
  type: 'car_interior',
  vehicleStyle: 'luxury',
  motion: 'parked'
};

// Default studio settings
export const DEFAULT_STUDIO = {
  backdrop: 'white_seamless',
  lightingSetup: 'three_point'
};

// Default ambient (weather, season, atmosphere)
export const DEFAULT_AMBIENT = {
  weather: 'clear',
  season: 'summer',
  atmosphere: 'neutral'
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
  referenceImages: [],          // Массив референсных изображений (опционально)
  sourceUniverseId: null,       // ID вселенной-источника (если создана автоматически)
  defaultFrameParams: { ...DEFAULT_LOCATION_FRAME_PARAMS }, // Default pose/frame settings for this location
  promptSnippet: '',
  createdAt: '',
  updatedAt: '',
  
  // === NEW: Hierarchical context-aware parameters ===
  spaceType: 'studio',          // PRIMARY SELECTOR
  
  // Context-specific settings (only relevant ones are used based on spaceType)
  interior: { ...DEFAULT_INTERIOR },
  urban: { ...DEFAULT_URBAN },
  nature: { ...DEFAULT_NATURE },
  rooftop: { ...DEFAULT_ROOFTOP },
  transport: { ...DEFAULT_TRANSPORT },
  studio: { ...DEFAULT_STUDIO }
  
  // NOTE: ambient (weather, season, atmosphere) is NOT stored in location
  // It's a situational parameter set during image generation, not a location property
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

export function createEmptyLocation(label = 'Новая локация', category = 'studio', spaceType = 'studio') {
  const now = new Date().toISOString();
  return {
    ...DEFAULT_LOCATION,
    id: generateLocationId(category),
    label,
    category,
    spaceType,
    lighting: { ...DEFAULT_LIGHTING },
    props: [],
    tags: [],
    interior: { ...DEFAULT_INTERIOR },
    urban: { ...DEFAULT_URBAN },
    nature: { ...DEFAULT_NATURE },
    rooftop: { ...DEFAULT_ROOFTOP },
    transport: { ...DEFAULT_TRANSPORT },
    studio: { ...DEFAULT_STUDIO },
    // NOTE: no ambient here - it's set during generation, not stored in location
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
 * Now supports hierarchical context-aware parameters
 */
export function buildLocationPromptSnippet(location) {
  if (!location) return '';

  const parts = [];
  const spaceType = location.spaceType || location.environmentType || 'studio';

  // ═══════════════════════════════════════════════════════════════
  // SPACE TYPE SPECIFIC PROMPTS
  // ═══════════════════════════════════════════════════════════════

  switch (spaceType) {
    case 'interior':
      parts.push(...buildInteriorPrompt(location));
      break;
    case 'exterior_urban':
      parts.push(...buildUrbanPrompt(location));
      break;
    case 'exterior_nature':
      parts.push(...buildNaturePrompt(location));
      break;
    case 'rooftop_terrace':
      parts.push(...buildRooftopPrompt(location));
      break;
    case 'transport':
      parts.push(...buildTransportPrompt(location));
      break;
    case 'studio':
      parts.push(...buildStudioPrompt(location));
      break;
    default:
      // Legacy fallback
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
  }

  // NOTE: Ambient (weather, season, atmosphere) is NOT included here.
  // Ambient is a situational parameter set during generation, not stored in location.
  // Use buildAmbientPrompt() separately when generating to add weather/season.

  // ═══════════════════════════════════════════════════════════════
  // LIGHTING (universal)
  // ═══════════════════════════════════════════════════════════════

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

  // Surface
  if (location.surface) {
    parts.push(location.surface);
  }

  // Props
  if (Array.isArray(location.props) && location.props.length > 0) {
    parts.push(`props: ${location.props.join(', ')}`);
  }

  // Description (custom text)
  if (location.description) {
    parts.push(location.description);
  }

  return parts.join(', ');
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR PROMPT BUILDING
// ═══════════════════════════════════════════════════════════════

function buildInteriorPrompt(location) {
  const parts = [];
  const interior = location.interior || {};

  // Find labels for type/subtype
  const typeOption = INTERIOR_TYPE_OPTIONS.find(t => t.id === interior.type);
  const subtypeOption = typeOption?.subtypes?.find(s => s.id === interior.subtype);
  
  if (subtypeOption) {
    parts.push(subtypeOption.label.toLowerCase());
  } else if (typeOption) {
    parts.push(typeOption.label.toLowerCase());
  } else {
    parts.push('interior');
  }

  // Interior style
  const styleOption = INTERIOR_STYLE_OPTIONS.find(s => s.id === interior.style);
  if (styleOption) {
    parts.push(`${styleOption.label.toLowerCase()} style`);
  }

  // Window light
  const windowOption = WINDOW_LIGHT_OPTIONS.find(w => w.id === interior.windowLight);
  if (windowOption && interior.windowLight !== 'none') {
    parts.push(`natural light from ${windowOption.label.toLowerCase()}`);
  }

  // Furniture
  if (Array.isArray(interior.furniture) && interior.furniture.length > 0) {
    parts.push(`featuring ${interior.furniture.join(', ')}`);
  }

  return parts;
}

function buildUrbanPrompt(location) {
  const parts = [];
  const urban = location.urban || {};

  // Urban type
  const typeOption = URBAN_TYPE_OPTIONS.find(t => t.id === urban.type);
  if (typeOption) {
    parts.push(typeOption.label.toLowerCase());
  } else {
    parts.push('urban street');
  }

  // Architecture
  const archOption = URBAN_ARCHITECTURE_OPTIONS.find(a => a.id === urban.architecture);
  if (archOption) {
    parts.push(`${archOption.label.toLowerCase()} architecture`);
  }

  // Density
  const densityOption = URBAN_DENSITY_OPTIONS.find(d => d.id === urban.density);
  if (densityOption && urban.density !== 'moderate') {
    parts.push(densityOption.label.toLowerCase());
  }

  return parts;
}

function buildNaturePrompt(location) {
  const parts = [];
  const nature = location.nature || {};

  // Nature type
  const typeOption = NATURE_TYPE_OPTIONS.find(t => t.id === nature.type);
  if (typeOption) {
    parts.push(typeOption.label.toLowerCase());
  } else {
    parts.push('natural setting');
  }

  // Vegetation
  const vegOption = VEGETATION_OPTIONS.find(v => v.id === nature.vegetation);
  if (vegOption && nature.vegetation !== 'lush') {
    parts.push(`${vegOption.label.toLowerCase()} vegetation`);
  }

  // Terrain
  const terrainOption = TERRAIN_OPTIONS.find(t => t.id === nature.terrain);
  if (terrainOption && nature.terrain !== 'flat') {
    parts.push(`${terrainOption.label.toLowerCase()} terrain`);
  }

  return parts;
}

function buildRooftopPrompt(location) {
  const parts = [];
  const rooftop = location.rooftop || {};

  // Rooftop type
  const typeOption = ROOFTOP_TYPE_OPTIONS.find(t => t.id === rooftop.type);
  if (typeOption) {
    parts.push(typeOption.label.toLowerCase());
  } else {
    parts.push('rooftop');
  }

  // City view
  const viewOption = CITY_VIEW_OPTIONS.find(v => v.id === rooftop.cityView);
  if (viewOption && rooftop.cityView !== 'no_view') {
    parts.push(`with ${viewOption.label.toLowerCase()}`);
  }

  return parts;
}

function buildTransportPrompt(location) {
  const parts = [];
  const transport = location.transport || {};

  // Transport type
  const typeOption = TRANSPORT_TYPE_OPTIONS.find(t => t.id === transport.type);
  if (typeOption) {
    parts.push(typeOption.label.toLowerCase());
  } else {
    parts.push('vehicle');
  }

  // Vehicle style
  const styleOption = VEHICLE_STYLE_OPTIONS.find(s => s.id === transport.vehicleStyle);
  if (styleOption && transport.vehicleStyle !== 'everyday') {
    parts.push(`${styleOption.label.toLowerCase()} style`);
  }

  // Motion
  const motionOption = MOTION_OPTIONS.find(m => m.id === transport.motion);
  if (motionOption && transport.motion !== 'parked') {
    parts.push(motionOption.label.toLowerCase());
  }

  return parts;
}

function buildStudioPrompt(location) {
  const parts = [];
  const studio = location.studio || {};

  parts.push('studio setting');

  // Backdrop
  const backdropOption = STUDIO_BACKDROP_OPTIONS.find(b => b.id === studio.backdrop);
  if (backdropOption) {
    parts.push(backdropOption.label.toLowerCase());
  }

  // Lighting setup
  const lightingOption = STUDIO_LIGHTING_SETUP_OPTIONS.find(l => l.id === studio.lightingSetup);
  if (lightingOption) {
    parts.push(`${lightingOption.label.toLowerCase()} lighting`);
  }

  return parts;
}

/**
 * Time of day options for ambient conditions
 */
export const TIME_OF_DAY_AMBIENT_OPTIONS = [
  { id: 'any', label: 'Любое', prompt: null },
  { id: 'sunrise', label: 'Рассвет', prompt: 'early morning sunrise light, golden-pink sky, soft warm directional light from low angle, long shadows' },
  { id: 'golden_hour', label: 'Золотой час', prompt: 'golden hour lighting, warm orange-gold sun at low angle, soft shadows, magical glow on skin' },
  { id: 'midday', label: 'Полдень', prompt: 'bright midday sun, harsh direct overhead sunlight, strong defined shadows, high contrast, squinting light' },
  { id: 'afternoon', label: 'День', prompt: 'afternoon daylight, clear sky, natural outdoor lighting' },
  { id: 'sunset', label: 'Закат', prompt: 'sunset lighting, warm red-orange glow, dramatic sky colors, silhouette potential, romantic mood' },
  { id: 'blue_hour', label: 'Синий час', prompt: 'blue hour twilight, deep blue sky, city lights starting to glow, cool color temperature, moody atmosphere' },
  { id: 'night', label: 'Ночь', prompt: 'nighttime, dark sky, artificial lighting from street lamps or city lights, high contrast pools of light' }
];

/**
 * Build ambient prompt from weather/season/atmosphere/timeOfDay parameters.
 * 
 * IMPORTANT: This is called by generators, NOT by buildLocationPromptSnippet.
 * Ambient is a situational parameter set during generation.
 * 
 * @param {Object} ambient - { weather, season, atmosphere, timeOfDay }
 * @returns {string[]} - Array of prompt parts
 */
export function buildAmbientPrompt(ambient = {}) {
  const parts = [];

  // Time of Day (HIGHEST PRIORITY for lighting)
  if (ambient.timeOfDay && ambient.timeOfDay !== 'any') {
    const timeOption = TIME_OF_DAY_AMBIENT_OPTIONS.find(t => t.id === ambient.timeOfDay);
    if (timeOption && timeOption.prompt) {
      parts.push(timeOption.prompt);
    }
  }

  // Weather
  const weatherOption = WEATHER_OPTIONS.find(w => w.id === ambient.weather);
  if (weatherOption && ambient.weather !== 'clear') {
    parts.push(weatherOption.label.toLowerCase());
  }

  // Season
  const seasonOption = SEASON_OPTIONS.find(s => s.id === ambient.season);
  if (seasonOption) {
    parts.push(`${seasonOption.label.toLowerCase()} atmosphere`);
  }

  // Atmosphere
  const atmosOption = ATMOSPHERE_OPTIONS.find(a => a.id === ambient.atmosphere);
  if (atmosOption && ambient.atmosphere !== 'neutral') {
    parts.push(`${atmosOption.label.toLowerCase()} air`);
  }

  return parts;
}

/**
 * Build ambient prompt as a single string.
 * Convenience wrapper for generators.
 */
export function buildAmbientPromptText(ambient = {}) {
  const parts = buildAmbientPrompt(ambient);
  return parts.length > 0 ? parts.join(', ') : '';
}

/**
 * All options for UI dropdowns
 */
export const LOCATION_OPTIONS = {
  // Legacy options
  environmentType: ENVIRONMENT_TYPE_OPTIONS,
  lightingType: LIGHTING_TYPE_OPTIONS,
  timeOfDay: TIME_OF_DAY_OPTIONS,
  surfaceType: SURFACE_TYPE_OPTIONS,
  categories: DEFAULT_LOCATION_CATEGORIES,
  tags: DEFAULT_LOCATION_TAGS,
  
  // NEW: Hierarchical context-aware options
  spaceType: SPACE_TYPE_OPTIONS,
  
  // Interior
  interiorType: INTERIOR_TYPE_OPTIONS,
  interiorStyle: INTERIOR_STYLE_OPTIONS,
  windowLight: WINDOW_LIGHT_OPTIONS,
  
  // Urban
  urbanType: URBAN_TYPE_OPTIONS,
  urbanArchitecture: URBAN_ARCHITECTURE_OPTIONS,
  urbanDensity: URBAN_DENSITY_OPTIONS,
  
  // Nature
  natureType: NATURE_TYPE_OPTIONS,
  vegetation: VEGETATION_OPTIONS,
  terrain: TERRAIN_OPTIONS,
  
  // Rooftop
  rooftopType: ROOFTOP_TYPE_OPTIONS,
  cityView: CITY_VIEW_OPTIONS,
  
  // Transport
  transportType: TRANSPORT_TYPE_OPTIONS,
  vehicleStyle: VEHICLE_STYLE_OPTIONS,
  motion: MOTION_OPTIONS,
  
  // Studio
  studioBackdrop: STUDIO_BACKDROP_OPTIONS,
  studioLighting: STUDIO_LIGHTING_SETUP_OPTIONS,
  
  // Ambient
  weather: WEATHER_OPTIONS,
  season: SEASON_OPTIONS,
  atmosphere: ATMOSPHERE_OPTIONS
};

/**
 * Get available PERMANENT parameters for a given space type.
 * Used by Location Editor UI to show/hide context-specific fields.
 * 
 * NOTE: weather/season/atmosphere are NOT included here — they are
 * situational parameters set in the generator, not stored in location.
 */
export function getAvailableParameters(spaceType) {
  const base = ['timeOfDay', 'lighting', 'props', 'description'];
  
  switch (spaceType) {
    case 'interior':
      return [...base, 'interiorType', 'interiorSubtype', 'interiorStyle', 'windowLight', 'furniture'];
      
    case 'exterior_urban':
      // NOTE: weather/season removed — set during generation
      return [...base, 'urbanType', 'urbanArchitecture', 'urbanDensity'];
      
    case 'exterior_nature':
      // NOTE: weather/season removed — set during generation
      return [...base, 'natureType', 'vegetation', 'terrain'];
      
    case 'rooftop_terrace':
      // NOTE: weather/season removed — set during generation
      return [...base, 'rooftopType', 'cityView'];
      
    case 'transport':
      return [...base, 'transportType', 'vehicleStyle', 'motion'];
      
    case 'studio':
      return [...base, 'studioBackdrop', 'studioLighting'];
      
    default:
      return base;
  }
}

/**
 * Check if a parameter is available for a given space type
 */
export function isParameterAvailable(spaceType, parameter) {
  return getAvailableParameters(spaceType).includes(parameter);
}

/**
 * Check if weather/outdoor parameters are available
 */
export function hasWeatherParameters(spaceType) {
  return ['exterior_urban', 'exterior_nature', 'rooftop_terrace'].includes(spaceType);
}
