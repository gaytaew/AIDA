/**
 * Emotion Schema
 * 
 * Defines the emotion/mood settings for image generation.
 * Emotions are NOT part of the frame - they are applied during shoot composition/generation.
 * 
 * Three approaches combined:
 * 1. Components - individual parameters (gaze, mouth, posture, energy, tension)
 * 2. Narrative - text scenario describing the emotional context
 * 3. Reference - uploaded image with the desired emotion
 */

// ═══════════════════════════════════════════════════════════════
// COMPONENT OPTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Gaze - direction and character of the look
 */
export const GAZE_OPTIONS = [
  'direct',           // Прямой взгляд в камеру
  'averted',          // Отведённый взгляд
  'distant',          // Задумчивый, в никуда
  'piercing',         // Пронзительный, интенсивный
  'soft',             // Мягкий, нежный
  'dreamy',           // Мечтательный
  'unfocused',        // Расфокусированный
  'downcast',         // Опущенный вниз
  'upward',           // Направленный вверх
  'sideways',         // В сторону
  'over_shoulder',    // Через плечо
  'defiant',          // Вызывающий
  'vulnerable',       // Уязвимый
  'knowing',          // Понимающий, со значением
  'playful'           // Игривый
];

/**
 * Mouth expression - lips and mouth area
 */
export const MOUTH_EXPRESSION_OPTIONS = [
  'neutral',          // Нейтральное
  'slight_smile',     // Лёгкая улыбка
  'parted_lips',      // Приоткрытые губы
  'pursed',           // Поджатые губы
  'smirk',            // Ухмылка
  'pout',             // Надутые губы
  'relaxed_open',     // Расслабленно открыт
  'tense',            // Напряжённые губы
  'biting_lip',       // Прикусывает губу
  'exhaling',         // На выдохе
  'speaking',         // Как будто говорит
  'contemplative'     // Задумчивое выражение
];

/**
 * Posture - body language and stance
 */
export const POSTURE_OPTIONS = [
  'relaxed',          // Расслабленная
  'tense',            // Напряжённая
  'confident',        // Уверенная
  'vulnerable',       // Уязвимая
  'closed',           // Закрытая (скрещенные руки)
  'open',             // Открытая
  'slouched',         // Сутулая
  'upright',          // Прямая
  'leaning_forward',  // Наклон вперёд
  'leaning_back',     // Откинувшись назад
  'asymmetrical',     // Асимметричная
  'defensive',        // Защитная
  'inviting',         // Приглашающая
  'withdrawn',        // Отстранённая
  'powerful'          // Властная
];

/**
 * Energy - overall energy level
 */
export const ENERGY_OPTIONS = [
  'low',              // Низкая энергия, усталость
  'calm',             // Спокойная
  'moderate',         // Умеренная
  'high',             // Высокая
  'explosive',        // Взрывная
  'restrained',       // Сдержанная
  'nervous',          // Нервная
  'languid',          // Томная
  'alert',            // Настороженная
  'serene'            // Безмятежная
];

/**
 * Tension - visible tension in face/body
 */
export const TENSION_OPTIONS = [
  'none',             // Нет напряжения
  'subtle',           // Едва заметное
  'visible',          // Заметное
  'high',             // Высокое
  'jaw_clenched',     // Сжатая челюсть
  'brow_furrowed',    // Нахмуренные брови
  'shoulders_raised', // Поднятые плечи
  'controlled'        // Контролируемое
];

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} EmotionComponents
 * @property {string} gaze - Направление/характер взгляда
 * @property {string} mouthExpression - Выражение губ
 * @property {string} posture - Осанка/язык тела
 * @property {string} energy - Уровень энергии
 * @property {string} tension - Уровень напряжения
 */

/**
 * @typedef {Object} EmotionNarrative
 * @property {string} scenario - Текстовый сценарий ("она ждёт важного звонка")
 * @property {string} backstory - Предыстория для контекста
 * @property {string} innerState - Внутреннее состояние
 */

/**
 * @typedef {Object} EmotionReference
 * @property {string|null} assetId - ID загруженного референса
 * @property {string|null} url - URL референса
 * @property {string} notes - Заметки к референсу
 */

/**
 * @typedef {Object} EmotionConfig
 * @property {EmotionComponents} components - Компонентный подход
 * @property {EmotionNarrative} narrative - Нарративный подход
 * @property {EmotionReference|null} reference - Референсный подход
 * @property {string} mode - Какой подход приоритетный: 'components' | 'narrative' | 'reference' | 'combined'
 */

// ═══════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_COMPONENTS = {
  gaze: 'direct',
  mouthExpression: 'neutral',
  posture: 'relaxed',
  energy: 'moderate',
  tension: 'none'
};

export const DEFAULT_NARRATIVE = {
  scenario: '',
  backstory: '',
  innerState: ''
};

export const DEFAULT_EMOTION_CONFIG = {
  components: { ...DEFAULT_COMPONENTS },
  narrative: { ...DEFAULT_NARRATIVE },
  reference: null,
  mode: 'components'
};

// ═══════════════════════════════════════════════════════════════
// EMOTION PRESETS (quick selections)
// ═══════════════════════════════════════════════════════════════

export const EMOTION_PRESETS = [
  {
    id: 'neutral_confident',
    label: 'Нейтрально-уверенная',
    components: {
      gaze: 'direct',
      mouthExpression: 'neutral',
      posture: 'confident',
      energy: 'moderate',
      tension: 'none'
    }
  },
  {
    id: 'soft_dreamy',
    label: 'Мягкая мечтательность',
    components: {
      gaze: 'dreamy',
      mouthExpression: 'parted_lips',
      posture: 'relaxed',
      energy: 'low',
      tension: 'none'
    }
  },
  {
    id: 'intense_powerful',
    label: 'Интенсивная сила',
    components: {
      gaze: 'piercing',
      mouthExpression: 'pursed',
      posture: 'powerful',
      energy: 'high',
      tension: 'visible'
    }
  },
  {
    id: 'vulnerable_soft',
    label: 'Уязвимая мягкость',
    components: {
      gaze: 'vulnerable',
      mouthExpression: 'slight_smile',
      posture: 'vulnerable',
      energy: 'low',
      tension: 'subtle'
    }
  },
  {
    id: 'playful_flirty',
    label: 'Игривая кокетливость',
    components: {
      gaze: 'playful',
      mouthExpression: 'smirk',
      posture: 'asymmetrical',
      energy: 'moderate',
      tension: 'none'
    }
  },
  {
    id: 'contemplative_distant',
    label: 'Задумчивая отстранённость',
    components: {
      gaze: 'distant',
      mouthExpression: 'contemplative',
      posture: 'withdrawn',
      energy: 'calm',
      tension: 'subtle'
    }
  },
  {
    id: 'defiant_bold',
    label: 'Дерзкая смелость',
    components: {
      gaze: 'defiant',
      mouthExpression: 'smirk',
      posture: 'confident',
      energy: 'high',
      tension: 'controlled'
    }
  },
  {
    id: 'serene_peaceful',
    label: 'Безмятежный покой',
    components: {
      gaze: 'soft',
      mouthExpression: 'slight_smile',
      posture: 'open',
      energy: 'serene',
      tension: 'none'
    }
  }
];

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create empty emotion config
 */
export function createEmptyEmotionConfig() {
  return {
    ...DEFAULT_EMOTION_CONFIG,
    components: { ...DEFAULT_COMPONENTS },
    narrative: { ...DEFAULT_NARRATIVE }
  };
}

/**
 * Apply a preset to emotion config
 */
export function applyPreset(presetId) {
  const preset = EMOTION_PRESETS.find(p => p.id === presetId);
  if (!preset) return createEmptyEmotionConfig();
  
  return {
    ...DEFAULT_EMOTION_CONFIG,
    components: { ...preset.components },
    mode: 'components'
  };
}

/**
 * Build prompt snippet from emotion config
 */
export function buildEmotionPromptSnippet(config) {
  if (!config) return '';
  
  const parts = [];
  
  // Mode determines priority
  if (config.mode === 'narrative' && config.narrative?.scenario) {
    parts.push(config.narrative.scenario);
    if (config.narrative.innerState) {
      parts.push(`feeling ${config.narrative.innerState}`);
    }
  } else if (config.mode === 'components' || !config.narrative?.scenario) {
    const c = config.components || {};
    
    // Gaze
    if (c.gaze && c.gaze !== 'direct') {
      const gazeMap = {
        averted: 'averted gaze',
        distant: 'distant gaze, looking into nothing',
        piercing: 'piercing intense gaze',
        soft: 'soft gentle gaze',
        dreamy: 'dreamy unfocused gaze',
        downcast: 'eyes cast downward',
        defiant: 'defiant challenging gaze',
        vulnerable: 'vulnerable open gaze',
        playful: 'playful mischievous gaze'
      };
      parts.push(gazeMap[c.gaze] || c.gaze.replace(/_/g, ' '));
    }
    
    // Mouth
    if (c.mouthExpression && c.mouthExpression !== 'neutral') {
      const mouthMap = {
        slight_smile: 'slight smile',
        parted_lips: 'lips slightly parted',
        pursed: 'pursed lips',
        smirk: 'knowing smirk',
        pout: 'subtle pout',
        biting_lip: 'biting lower lip'
      };
      parts.push(mouthMap[c.mouthExpression] || c.mouthExpression.replace(/_/g, ' '));
    }
    
    // Posture
    if (c.posture && c.posture !== 'relaxed') {
      const postureMap = {
        tense: 'tense body language',
        confident: 'confident stance',
        vulnerable: 'vulnerable posture',
        powerful: 'powerful commanding presence',
        withdrawn: 'withdrawn body language'
      };
      parts.push(postureMap[c.posture] || c.posture.replace(/_/g, ' ') + ' posture');
    }
    
    // Energy
    if (c.energy && c.energy !== 'moderate') {
      const energyMap = {
        low: 'low energy, languid',
        calm: 'calm serene energy',
        high: 'high energy, dynamic',
        explosive: 'explosive energy',
        languid: 'languid relaxed energy'
      };
      parts.push(energyMap[c.energy] || c.energy + ' energy');
    }
    
    // Tension
    if (c.tension && c.tension !== 'none') {
      const tensionMap = {
        subtle: 'subtle tension visible',
        visible: 'visible tension in expression',
        high: 'high tension, strained',
        jaw_clenched: 'jaw clenched',
        brow_furrowed: 'furrowed brow'
      };
      parts.push(tensionMap[c.tension] || c.tension.replace(/_/g, ' '));
    }
  }
  
  return parts.join(', ');
}

/**
 * Validate emotion config
 */
export function validateEmotionConfig(config) {
  const errors = [];
  
  if (!config || typeof config !== 'object') {
    errors.push('Emotion config must be an object');
    return { valid: false, errors };
  }
  
  if (config.components) {
    const c = config.components;
    if (c.gaze && !GAZE_OPTIONS.includes(c.gaze)) {
      errors.push(`Invalid gaze: ${c.gaze}`);
    }
    if (c.mouthExpression && !MOUTH_EXPRESSION_OPTIONS.includes(c.mouthExpression)) {
      errors.push(`Invalid mouthExpression: ${c.mouthExpression}`);
    }
    if (c.posture && !POSTURE_OPTIONS.includes(c.posture)) {
      errors.push(`Invalid posture: ${c.posture}`);
    }
    if (c.energy && !ENERGY_OPTIONS.includes(c.energy)) {
      errors.push(`Invalid energy: ${c.energy}`);
    }
    if (c.tension && !TENSION_OPTIONS.includes(c.tension)) {
      errors.push(`Invalid tension: ${c.tension}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * All options for UI
 */
export const EMOTION_OPTIONS = {
  gaze: GAZE_OPTIONS,
  mouthExpression: MOUTH_EXPRESSION_OPTIONS,
  posture: POSTURE_OPTIONS,
  energy: ENERGY_OPTIONS,
  tension: TENSION_OPTIONS,
  presets: EMOTION_PRESETS
};

