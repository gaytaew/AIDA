/**
 * Frame Schema
 * 
 * A frame represents a shot preset in the catalog.
 * Contains technical parameters: shot size, camera angle, pose, composition.
 * Emotions are handled separately in the Emotion module during generation.
 */

// ═══════════════════════════════════════════════════════════════
// FRAME OPTIONS
// ═══════════════════════════════════════════════════════════════

export const SHOT_SIZE_OPTIONS = [
  'extreme_close_up',  // Только часть лица (глаза, губы)
  'close_up',          // Лицо и шея
  'medium_close',      // Голова и плечи
  'medium',            // По пояс
  'medium_full',       // 3/4 фигуры
  'full_body',         // Вся фигура
  'wide',              // Фигура + окружение
  'extreme_wide'       // Много окружения, маленькая фигура
];

export const CAMERA_ANGLE_OPTIONS = [
  'eye_level',    // На уровне глаз
  'low_angle',    // Снизу вверх
  'high_angle',   // Сверху вниз
  'overhead',     // Прямо сверху
  'dutch_angle',  // Наклонённая камера
  'worms_eye'     // С земли вверх
];

export const CAMERA_DISTANCE_OPTIONS = [
  'intimate',    // Очень близко, интимно
  'personal',    // Личное пространство
  'social',      // Социальная дистанция
  'public'       // Публичная дистанция
];

export const POSE_TYPE_OPTIONS = [
  'static',      // Статичная поза
  'dynamic',     // Движение, энергия
  'walking',     // Ходьба
  'sitting',     // Сидя
  'lying',       // Лёжа
  'leaning',     // Опираясь
  'crouching',   // Присев
  'jumping'      // В прыжке
];

export const COMPOSITION_OPTIONS = [
  'centered',         // Центрированная
  'rule_of_thirds',   // Правило третей
  'golden_ratio',     // Золотое сечение
  'symmetrical',      // Симметричная
  'asymmetrical',     // Асимметричная
  'diagonal',         // Диагональная
  'frame_within_frame' // Кадр в кадре
];

export const ORIENTATION_OPTIONS = [
  'portrait',   // Вертикальная
  'landscape',  // Горизонтальная
  'square'      // Квадратная
];

export const DEFAULT_CATEGORIES = [
  'fashion',
  'catalog',
  'sport',
  'lingerie',
  'beauty',
  'editorial',
  'street',
  'studio'
];

export const DEFAULT_TAGS = [
  // Shot sizes
  'close-up', 'full-body', 'wide', '3/4',
  // Angles
  'low-angle', 'high-angle', 'eye-level', 'overhead',
  // Poses
  'walking', 'static', 'dynamic', 'sitting',
  // Views
  'profile', 'front', 'back', '3/4-view',
  // Light
  'flash', 'natural-light', 'studio-light',
  // Location
  'studio', 'street', 'location', 'outdoor'
];

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} FrameTechnical
 * @property {string} shotSize - Крупность плана
 * @property {string} cameraAngle - Угол камеры
 * @property {string} cameraDistance - Дистанция камеры
 * @property {string} poseType - Тип позы
 * @property {string} composition - Композиция
 * @property {string} orientation - Ориентация кадра
 * @property {string} focusPoint - Точка фокуса (свободный текст)
 * @property {string} poseDescription - Описание позы (свободный текст)
 */

/**
 * @typedef {Object} AssetRef
 * @property {string} assetId - Asset identifier
 * @property {string} url - URL or data URL
 * @property {string} [label] - Optional label
 */

/**
 * @typedef {Object} ImageConfig
 * @property {'3:4'|'1:1'|'4:3'|'9:16'|'16:9'} aspectRatio
 * @property {'1K'|'2K'|'4K'} imageSize
 */

/**
 * @typedef {Object} Frame
 * @property {string} id - Unique identifier
 * @property {string} label - Human-readable name
 * @property {string} description - Detailed description for prompt generation
 * @property {string} category - Primary category
 * @property {Array<string>} categories - All categories
 * @property {Array<string>} tags - Tags for filtering
 * @property {FrameTechnical} technical - Technical parameters
 * @property {AssetRef|null} sketchAsset - Sketch/reference image
 * @property {AssetRef|null} poseRefAsset - Pose reference image
 * @property {string} sketchPrompt - Prompt used to generate sketch
 * @property {string} promptSnippet - Ready-to-use prompt snippet
 * @property {ImageConfig|null} imageConfig - Default image config for this frame
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

// ═══════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_TECHNICAL = {
  shotSize: 'medium',
  cameraAngle: 'eye_level',
  cameraDistance: 'social',
  poseType: 'static',
  composition: 'rule_of_thirds',
  orientation: 'portrait',
  focusPoint: '',
  poseDescription: ''
};

export const DEFAULT_FRAME = {
  id: '',
  label: 'Новый кадр',
  description: '',
  category: 'fashion',
  categories: ['fashion'],
  tags: [],
  technical: { ...DEFAULT_TECHNICAL },
  sketchAsset: null,
  poseRefAsset: null,
  sketchPrompt: '',
  promptSnippet: '',
  imageConfig: null,
  createdAt: '',
  updatedAt: ''
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function generateFrameId(category = 'frame') {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timePart = now.toISOString().slice(11, 19).replace(/:/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  const catCode = String(category || 'frame').toUpperCase().slice(0, 4);
  return `FR_${catCode}_${datePart}_${timePart}_${randomPart}`;
}

export function createEmptyFrame(label = 'Новый кадр', category = 'fashion') {
  const now = new Date().toISOString();
  return {
    ...DEFAULT_FRAME,
    id: generateFrameId(category),
    label,
    category,
    categories: [category],
    technical: { ...DEFAULT_TECHNICAL },
    createdAt: now,
    updatedAt: now
  };
}

export function validateFrame(frame) {
  const errors = [];

  if (!frame || typeof frame !== 'object') {
    errors.push('Frame must be an object');
    return { valid: false, errors };
  }

  if (!frame.id || typeof frame.id !== 'string') {
    errors.push('Frame must have a string id');
  }

  if (!frame.label || typeof frame.label !== 'string') {
    errors.push('Frame must have a string label');
  }

  // Validate technical params if present
  if (frame.technical) {
    const t = frame.technical;
    if (t.shotSize && !SHOT_SIZE_OPTIONS.includes(t.shotSize)) {
      errors.push(`Invalid shotSize: ${t.shotSize}`);
    }
    if (t.cameraAngle && !CAMERA_ANGLE_OPTIONS.includes(t.cameraAngle)) {
      errors.push(`Invalid cameraAngle: ${t.cameraAngle}`);
    }
    if (t.poseType && !POSE_TYPE_OPTIONS.includes(t.poseType)) {
      errors.push(`Invalid poseType: ${t.poseType}`);
    }
    if (t.composition && !COMPOSITION_OPTIONS.includes(t.composition)) {
      errors.push(`Invalid composition: ${t.composition}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Build a prompt snippet from frame data
 */
export function buildFramePromptSnippet(frame) {
  if (!frame) return '';

  const parts = [];
  const t = frame.technical || {};

  // Shot size
  if (t.shotSize) {
    const sizeMap = {
      extreme_close_up: 'extreme close-up shot',
      close_up: 'close-up shot',
      medium_close: 'medium close-up shot',
      medium: 'medium shot',
      medium_full: 'three-quarter shot',
      full_body: 'full body shot',
      wide: 'wide shot',
      extreme_wide: 'extreme wide shot'
    };
    parts.push(sizeMap[t.shotSize] || t.shotSize.replace(/_/g, ' '));
  }

  // Camera angle
  if (t.cameraAngle && t.cameraAngle !== 'eye_level') {
    const angleMap = {
      low_angle: 'shot from below',
      high_angle: 'shot from above',
      overhead: 'overhead shot',
      dutch_angle: 'tilted angle',
      worms_eye: 'worm\'s eye view'
    };
    parts.push(angleMap[t.cameraAngle] || t.cameraAngle.replace(/_/g, ' '));
  }

  // Pose type
  if (t.poseType && t.poseType !== 'static') {
    const poseMap = {
      dynamic: 'dynamic pose',
      walking: 'walking',
      sitting: 'sitting pose',
      lying: 'lying down',
      leaning: 'leaning pose',
      crouching: 'crouching',
      jumping: 'jumping'
    };
    parts.push(poseMap[t.poseType] || t.poseType);
  }

  // Pose description (free text)
  if (t.poseDescription) {
    parts.push(t.poseDescription);
  }

  // Composition
  if (t.composition && t.composition !== 'rule_of_thirds') {
    parts.push(`${t.composition.replace(/_/g, ' ')} composition`);
  }

  // Focus point
  if (t.focusPoint) {
    parts.push(`focus on ${t.focusPoint}`);
  }

  // Description
  if (frame.description) {
    parts.push(frame.description);
  }

  return parts.join(', ');
}

/**
 * All options for UI dropdowns
 */
export const FRAME_OPTIONS = {
  shotSize: SHOT_SIZE_OPTIONS,
  cameraAngle: CAMERA_ANGLE_OPTIONS,
  cameraDistance: CAMERA_DISTANCE_OPTIONS,
  poseType: POSE_TYPE_OPTIONS,
  composition: COMPOSITION_OPTIONS,
  orientation: ORIENTATION_OPTIONS,
  categories: DEFAULT_CATEGORIES,
  tags: DEFAULT_TAGS
};
