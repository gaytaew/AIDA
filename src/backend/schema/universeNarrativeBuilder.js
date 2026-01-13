/**
 * Universe Narrative Builder
 * 
 * Собирает параметры вселенной в связный текст на естественном языке.
 * Каждый блок формирует свой абзац, который читается как описание от арт-директора.
 */

import { UNIVERSE_PARAMS, ANTIAI_FLAGS } from './universeParams.js';

// ═══════════════════════════════════════════════════════════════
// LIGHTING TECHNICAL ANCHORS
// Жёсткие технические спецификации для консистентного освещения
// Не зависят от позы, крупности или эмоции
// ═══════════════════════════════════════════════════════════════

const LIGHTING_TECHNICAL_ANCHORS = {
  // Студийный жёсткий свет
  studio_hard: {
    setup: `
PHYSICAL SETUP:
• Key light: Bare strobe/fresnel, 45° camera-left, 2m from subject
• Fill: Negative fill (black V-flat) camera-right
• Background: 1 stop under key light`,
    
    metrics: `
MEASURABLE METRICS (NON-NEGOTIABLE):
• Contrast ratio: 4:1 (lit side to shadow side on face)
• Shadow edge: HARD (transition width < 5% of face width)
• Specular highlights: VISIBLE on skin, cheekbones, nose bridge
• Shadow color: Neutral gray (#505050), NOT warm, NOT lifted
• Catchlights: Single, sharp-edged, positioned upper-left of iris`,
    
    anchor: `
VISUAL ANCHOR (same in EVERY frame):
• Shadow on RIGHT side of face: clearly defined edge, not gradient
• Approximately 40% of face in shadow
• Shadow darkness: identical regardless of pose
• Background shadow: visible, sharp, ~45° angle from subject`
  },
  
  // Студийный мягкий свет
  studio_soft: {
    setup: `
PHYSICAL SETUP:
• Key light: Large softbox (120cm+) or octabox, 30° camera-left
• Fill: White V-flat or reflector camera-right
• Background: Even, no visible shadow`,
    
    metrics: `
MEASURABLE METRICS (NON-NEGOTIABLE):
• Contrast ratio: 2:1 (subtle shadow transition)
• Shadow edge: SOFT (gradient transition across 15-20% of face)
• Specular highlights: Gentle, spread across larger area
• Shadow color: Lifted gray (#707070), slightly warm OK
• Catchlights: Large, soft-edged, may be multiple`,
    
    anchor: `
VISUAL ANCHOR (same in EVERY frame):
• Shadows wrap around face gently
• No hard shadow edges anywhere
• Even illumination across outfit
• Background: clean, shadowless or very soft shadow`
  },
  
  // Оконный свет
  window: {
    setup: `
PHYSICAL SETUP:
• Key light: Large window, 60-90° from camera axis
• Fill: Room ambient + optional reflector
• Falloff: Natural gradient away from window`,
    
    metrics: `
MEASURABLE METRICS (NON-NEGOTIABLE):
• Contrast ratio: 3:1 (moderate, natural)
• Shadow edge: MEDIUM (5-15% transition)
• Direction: Consistent from ONE side
• Color temperature: Daylight (~5500K) on lit side`,
    
    anchor: `
VISUAL ANCHOR (same in EVERY frame):
• Light ALWAYS comes from same direction (window side)
• Gradual falloff toward shadow side
• Same shadow density regardless of pose`
  },
  
  // Прямое солнце
  direct_sun: {
    setup: `
PHYSICAL SETUP:
• Key light: Direct sun, specific angle locked
• Fill: Bounce from environment or reflector
• Shadows: Long, sharp, consistent direction`,
    
    metrics: `
MEASURABLE METRICS (NON-NEGOTIABLE):
• Contrast ratio: 5:1+ (very high)
• Shadow edge: RAZOR SHARP
• Specular highlights: Bright, potentially clipped on skin
• Shadow color: Cool/blue from sky fill`,
    
    anchor: `
VISUAL ANCHOR (same in EVERY frame):
• Sun direction: LOCKED (e.g., 45° camera-right, 30° elevation)
• Shadow length and angle: IDENTICAL in all frames
• Same squint/facial response to bright light`
  },
  
  // Golden hour
  golden_hour: {
    setup: `
PHYSICAL SETUP:
• Key light: Low sun, warm directional
• Fill: Sky ambient (cooler)
• Color: Strong warm/cool separation`,
    
    metrics: `
MEASURABLE METRICS (NON-NEGOTIABLE):
• Contrast ratio: 3:1 (medium)
• Shadow edge: MEDIUM-SOFT (atmospheric diffusion)
• Color temperature: 3200K on lit side, 6500K in shadows
• Rim/backlight: Visible warm glow on hair/shoulders`,
    
    anchor: `
VISUAL ANCHOR (same in EVERY frame):
• Warm highlights on same side of face
• Cool shadows on opposite side
• Same rim light intensity and position`
  },
  
  // Пасмурное небо
  overcast: {
    setup: `
PHYSICAL SETUP:
• Key light: Entire sky (giant softbox)
• Fill: Ground bounce
• Direction: Top-down with slight angle`,
    
    metrics: `
MEASURABLE METRICS (NON-NEGOTIABLE):
• Contrast ratio: 1.5:1 (very low)
• Shadow edge: VERY SOFT (almost shadowless)
• Color: Neutral to slightly cool
• Even wrap around entire subject`,
    
    anchor: `
VISUAL ANCHOR (same in EVERY frame):
• No visible directional shadows
• Even, flat lighting on face
• Slight shadow under chin/nose only`
  },
  
  // Практические источники (лампы, свечи)
  practicals: {
    setup: `
PHYSICAL SETUP:
• Key light: Visible practical sources in scene
• Fill: Ambient room light
• Color: Warm tungsten (2700-3200K)`,
    
    metrics: `
MEASURABLE METRICS (NON-NEGOTIABLE):
• Contrast ratio: Variable by source distance
• Shadow edge: MEDIUM (practical modifiers)
• Color: Warm dominant, may have mixed temps
• Falloff: Realistic inverse-square`,
    
    anchor: `
VISUAL ANCHOR (same in EVERY frame):
• Same practical sources visible or implied
• Consistent warm color cast
• Same shadow directions from fixed sources`
  }
};

// Блок независимости освещения от позы
const LIGHTING_INDEPENDENCE_BLOCK = `
⛔ LIGHTING IS PHYSICALLY FIXED — NOT INFLUENCED BY:
• Pose (standing, sitting, crouching, lying)
• Shot size (full body, medium, close-up)
• Emotion (confident, vulnerable, playful)
• Camera angle (high, low, dutch)
• Model position in frame

The lighting rig is LOCKED. The model moves WITHIN the same light.
If model crouches, shadows stay the same direction/hardness.
If camera moves to close-up, contrast ratio stays the same.
`;

// ═══════════════════════════════════════════════════════════════
// HELPER: Получить narrative для значения параметра
// ═══════════════════════════════════════════════════════════════

function getNarrative(blockId, paramId, value) {
  const block = UNIVERSE_PARAMS[blockId];
  if (!block) return '';
  
  const param = block[paramId];
  if (!param || !param.options) return '';
  
  const option = param.options.find(o => o.value === value);
  return option?.narrative || '';
}

// ═══════════════════════════════════════════════════════════════
// БЛОК: TECH (Подача + Техника)
// ═══════════════════════════════════════════════════════════════

function buildTechNarrative(params) {
  const parts = [];
  
  // 1. Shooting Approach
  const approach = getNarrative('approach', 'shootingApproach', params.shootingApproach);
  if (approach) parts.push(approach);
  
  // 2. Product Discipline (добавляется к approach)
  const discipline = getNarrative('approach', 'productDiscipline', params.productDiscipline);
  if (discipline) parts.push(discipline);
  
  // 3. Camera Class
  const camera = getNarrative('tech', 'cameraClass', params.cameraClass);
  if (camera) parts.push('. ' + camera);
  
  // 4. Exposure
  const exposure = getNarrative('tech', 'exposureIntent', params.exposureIntent);
  if (exposure) parts.push('. ' + exposure);
  
  // 5. Shutter / Motion
  const shutter = getNarrative('tech', 'shutterIntent', params.shutterIntent);
  if (shutter) parts.push('. ' + shutter);
  
  // 6. Processing
  const processing = getNarrative('tech', 'processingStyle', params.processingStyle);
  if (processing) parts.push('. ' + processing);
  
  // 7. Retouch
  const retouch = getNarrative('tech', 'retouchLevel', params.retouchLevel);
  if (retouch) parts.push('. ' + retouch);
  
  // Clean up: убрать двойные точки и пробелы
  let result = parts.join('');
  result = result.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim();
  
  // Убедиться, что начинается с большой буквы
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// БЛОК: ERA (Эпоха)
// ═══════════════════════════════════════════════════════════════

function buildEraNarrative(params) {
  const parts = [];
  
  // Decade
  const decade = getNarrative('era', 'decade', params.decade);
  if (decade) parts.push(decade);
  
  // Cultural Context
  const context = getNarrative('era', 'culturalContext', params.culturalContext);
  if (context) {
    if (parts.length > 0) {
      parts.push(' в контексте ' + context.toLowerCase().replace(/^визуальный язык /, ''));
    } else {
      parts.push(context);
    }
  }
  
  let result = parts.join('');
  
  // Убедиться, что начинается с большой буквы
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// БЛОК: COLOR (Цвет)
// ═══════════════════════════════════════════════════════════════

function buildColorNarrative(params) {
  const parts = [];
  
  // White Balance
  const wb = getNarrative('color', 'whiteBalance', params.whiteBalance);
  if (wb) parts.push(wb);
  
  // WB Shift
  const wbShift = getNarrative('color', 'wbShift', params.wbShift);
  if (wbShift) parts.push(' ' + wbShift);
  
  // Saturation
  const saturation = getNarrative('color', 'saturation', params.saturation);
  if (saturation) parts.push('. ' + saturation);
  
  // Contrast
  const contrast = getNarrative('color', 'contrastCurve', params.contrastCurve);
  if (contrast) parts.push('. ' + contrast);
  
  // Shadow Tone
  const shadow = getNarrative('color', 'shadowTone', params.shadowTone);
  if (shadow) parts.push('. ' + shadow);
  
  // Highlight Tone
  const highlight = getNarrative('color', 'highlightTone', params.highlightTone);
  if (highlight) parts.push('. ' + highlight);
  
  let result = parts.join('');
  result = result.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim();
  
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// БЛОК: LENS (Оптика)
// ═══════════════════════════════════════════════════════════════

function buildLensNarrative(params) {
  const parts = [];
  
  // Focal Range
  const focal = getNarrative('lens', 'focalRange', params.focalRange);
  if (focal) parts.push(focal);
  
  // Camera Proximity
  const proximity = getNarrative('lens', 'cameraProximity', params.cameraProximity);
  if (proximity) parts.push('. ' + proximity);
  
  // Aperture / DOF
  const aperture = getNarrative('lens', 'apertureIntent', params.apertureIntent);
  if (aperture) parts.push('. ' + aperture);
  
  // Distortion Policy
  const distortion = getNarrative('lens', 'distortionPolicy', params.distortionPolicy);
  if (distortion) parts.push('. ' + distortion);
  
  let result = parts.join('');
  result = result.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim();
  
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// БЛОК: MOOD (Настроение)
// ═══════════════════════════════════════════════════════════════

function buildMoodNarrative(params) {
  const parts = [];
  
  // Emotional Vector
  const emotion = getNarrative('mood', 'visualMood', params.visualMood);
  if (emotion) parts.push(emotion);
  
  // Energy Level
  const energy = getNarrative('mood', 'energyLevel', params.energyLevel);
  if (energy) parts.push('. ' + energy);
  
  // Spontaneity
  const spontaneity = getNarrative('mood', 'spontaneity', params.spontaneity);
  if (spontaneity) parts.push('. ' + spontaneity);
  
  // Primary Focus
  const focus = getNarrative('mood', 'primaryFocus', params.primaryFocus);
  if (focus) parts.push('. ' + focus);
  
  let result = parts.join('');
  result = result.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim();
  
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// БЛОК: ANTI-AI (Реализм)
// ═══════════════════════════════════════════════════════════════

function buildAntiAiNarrative(params) {
  const level = params.antiAiLevel || 'medium';
  
  if (level === 'off') {
    return '';
  }
  
  const parts = [];
  
  // Level narrative
  const levelNarrative = getNarrative('antiAi', 'antiAiLevel', level);
  if (levelNarrative) {
    parts.push(levelNarrative);
  }
  
  // Flags (если level >= medium)
  if (level === 'medium' || level === 'high') {
    const flags = params.antiAiFlags || {};
    const activeFlags = [];
    
    for (const [flagId, flagDef] of Object.entries(ANTIAI_FLAGS)) {
      if (flags[flagId]) {
        activeFlags.push(flagDef.narrative);
      }
    }
    
    if (activeFlags.length > 0) {
      parts.push(': ' + activeFlags.join(', '));
    }
  }
  
  let result = parts.join('');
  
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// БЛОК: LIGHTING TECHNICAL ANCHOR
// Технический якорь для консистентного освещения между кадрами
// ═══════════════════════════════════════════════════════════════

/**
 * Строит технический блок освещения с числовыми метриками.
 * Используется для обеспечения консистентности между кадрами.
 * 
 * @param {Object} params - Параметры вселенной
 * @returns {string} - Технический блок освещения
 */
function buildLightingTechnicalAnchor(params) {
  const lightSource = params.lightSource || 'studio_soft';
  const anchor = LIGHTING_TECHNICAL_ANCHORS[lightSource];
  
  if (!anchor) {
    // Fallback для неизвестных источников
    return '';
  }
  
  // Собираем технический блок
  const sections = [];
  
  sections.push(`
=== LIGHTING TECHNICAL SPECIFICATION ===
(LOCKED — physically fixed, NOT influenced by pose/framing)
`);
  
  // Setup
  if (anchor.setup) {
    sections.push(anchor.setup.trim());
  }
  
  // Metrics
  if (anchor.metrics) {
    sections.push(anchor.metrics.trim());
  }
  
  // Visual anchor
  if (anchor.anchor) {
    sections.push(anchor.anchor.trim());
  }
  
  // Light direction from params
  const direction = params.lightDirection;
  if (direction) {
    const directionLabels = {
      front: 'FRONT (0° from camera axis)',
      side_front: 'SIDE-FRONT (45° from camera, classic portrait)',
      side: 'SIDE (90° from camera, split lighting)',
      side_back: 'SIDE-BACK (135° from camera, rim emphasis)',
      back: 'BACK (180° from camera, silhouette/rim only)',
      top: 'TOP (90° overhead, beauty/editorial)',
      bottom: 'BOTTOM (under face, dramatic/horror)'
    };
    sections.push(`
LIGHT DIRECTION (LOCKED):
• Primary key: ${directionLabels[direction] || direction}
• This direction MUST NOT change between frames`);
  }
  
  // Light quality override
  const quality = params.lightQuality;
  if (quality) {
    const qualityMetrics = {
      soft: 'Shadow edge: SOFT (gradient >15% of face), Contrast: LOW (2:1)',
      medium: 'Shadow edge: MEDIUM (gradient 5-15%), Contrast: MEDIUM (3:1)',
      hard: 'Shadow edge: HARD (gradient <5% of face), Contrast: HIGH (4:1+)'
    };
    if (qualityMetrics[quality]) {
      sections.push(`
QUALITY OVERRIDE:
• ${qualityMetrics[quality]}`);
    }
  }
  
  // Independence block
  sections.push(LIGHTING_INDEPENDENCE_BLOCK);
  
  return sections.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// БЛОК: LIGHTING (Освещение) — НЕ ЗАВИСИТ ОТ ПОЗЫ
// ═══════════════════════════════════════════════════════════════

function buildLightingNarrative(params) {
  const parts = [];
  
  // Light source
  const source = getNarrative('lighting', 'lightSource', params.lightSource);
  if (source) parts.push(source);
  
  // Light direction
  const direction = getNarrative('lighting', 'lightDirection', params.lightDirection);
  if (direction) parts.push('. ' + direction);
  
  // Light quality
  const quality = getNarrative('lighting', 'lightQuality', params.lightQuality);
  if (quality) parts.push('. ' + quality);
  
  // ─────────────────────────────────────────────────────────────
  // SMART CONTEXT: Skip irrelevant params based on space/lighting
  // ─────────────────────────────────────────────────────────────
  const isIndoor = params.weatherLighting === 'indoor';
  const isStudio = ['studio_soft', 'studio_hard'].includes(params.lightSource);
  
  // Time of day - skip for pure studio lighting (no windows)
  if (!isStudio) {
    const time = getNarrative('lighting', 'timeOfDay', params.timeOfDay);
    if (time) parts.push('. ' + time);
  }
  
  // Weather - skip for indoor (weatherLighting === 'indoor')
  if (!isIndoor) {
    const weather = getNarrative('lighting', 'weatherLighting', params.weatherLighting);
    if (weather) parts.push('. ' + weather);
  }
  
  // Season - skip for indoor/studio
  if (!isIndoor && !isStudio) {
    const season = getNarrative('lighting', 'season', params.season);
    if (season) parts.push('. ' + season);
  }
  
  let result = parts.join('');
  result = result.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim();
  
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
    // Добавить предупреждение о независимости от позы
    result += ' [LIGHTING НЕ ЗАВИСИТ ОТ ПОЗЫ — одинаково для всех кадров]';
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// ГЛАВНАЯ ФУНКЦИЯ: Собрать всю вселенную
// ═══════════════════════════════════════════════════════════════

/**
 * Собрать полное описание вселенной из параметров
 * @param {Object} params - Объект с параметрами вселенной
 * @returns {Object} - Объект с блоками текста
 */
function buildUniverseNarrative(params) {
  return {
    tech: buildTechNarrative(params),
    era: buildEraNarrative(params),
    color: buildColorNarrative(params),
    lens: buildLensNarrative(params),
    mood: buildMoodNarrative(params),
    lighting: buildLightingNarrative(params),
    lightingTechnical: buildLightingTechnicalAnchor(params), // NEW: Technical anchor
    antiAi: buildAntiAiNarrative(params)
  };
}

/**
 * Собрать вселенную как единый текст
 * @param {Object} params - Объект с параметрами вселенной
 * @returns {string} - Полный текст описания вселенной
 */
function buildUniverseText(params) {
  const blocks = buildUniverseNarrative(params);
  
  const sections = [];
  
  if (blocks.tech) {
    sections.push(`**Техника:** ${blocks.tech}`);
  }
  
  if (blocks.era) {
    sections.push(`**Эпоха:** ${blocks.era}`);
  }
  
  if (blocks.color) {
    sections.push(`**Цвет:** ${blocks.color}`);
  }
  
  if (blocks.lens) {
    sections.push(`**Оптика:** ${blocks.lens}`);
  }
  
  if (blocks.mood) {
    sections.push(`**Настроение:** ${blocks.mood}`);
  }
  
  if (blocks.lighting) {
    sections.push(`**Освещение:** ${blocks.lighting}`);
  }
  
  // NEW: Technical lighting anchor for consistency
  if (blocks.lightingTechnical) {
    sections.push(blocks.lightingTechnical);
  }
  
  if (blocks.antiAi) {
    sections.push(`**Реализм:** ${blocks.antiAi}`);
  }
  
  return sections.join('\n\n');
}

/**
 * Собрать вселенную как объект для промпта (без markdown)
 * @param {Object} params - Объект с параметрами вселенной
 * @returns {Object} - Объект для использования в промпте
 */
function buildUniverseForPrompt(params) {
  const blocks = buildUniverseNarrative(params);
  
  // Собрать в структуру, аналогичную оригинальному промпту
  return {
    tech: blocks.tech,
    era: blocks.era,
    color: blocks.color,
    lens: blocks.lens,
    mood: blocks.mood,
    antiAi: blocks.antiAi ? {
      level: params.antiAiLevel || 'medium',
      description: blocks.antiAi,
      // Передать флаги напрямую
      ...params.antiAiFlags
    } : null
  };
}

/**
 * Собрать ЕДИНЫЙ ТЕКСТ вселенной для промпта
 * Все параметры объединяются в связный нарратив — один блок текста.
 * БЕЗ подзаголовков типа "Техника:", "Эпоха:" и т.д.
 * 
 * @param {Object} params - Объект с параметрами вселенной
 * @returns {string} - Единый связный текст описания вселенной
 */
function buildUnifiedUniverseNarrative(params) {
  const blocks = buildUniverseNarrative(params);
  
  // Собираем абзацы (только непустые)
  const paragraphs = [];
  
  // 1. Техника и подача (основной абзац)
  if (blocks.tech) {
    paragraphs.push(blocks.tech);
  }
  
  // 2. Эпоха и контекст
  if (blocks.era) {
    paragraphs.push(blocks.era);
  }
  
  // 3. Цветовое решение
  if (blocks.color) {
    paragraphs.push(blocks.color);
  }
  
  // 4. Оптика
  if (blocks.lens) {
    paragraphs.push(blocks.lens);
  }
  
  // 5. Настроение
  if (blocks.mood) {
    paragraphs.push(blocks.mood);
  }
  
  // 6. Освещение (НЕ ЗАВИСИТ ОТ ПОЗЫ)
  if (blocks.lighting) {
    paragraphs.push(blocks.lighting);
  }
  
  // 7. Anti-AI / Реализм
  if (blocks.antiAi) {
    paragraphs.push(blocks.antiAi);
  }
  
  // Объединяем абзацы через двойной перенос строки
  return paragraphs.join('\n\n');
}

// ═══════════════════════════════════════════════════════════════
// STRICT MODE: Директивный промпт с жёсткими constraint'ами
// Для лучшей консистентности между кадрами
// ═══════════════════════════════════════════════════════════════

/**
 * Маппинг параметров в технические значения
 */
const TECHNICAL_VALUES = {
  // White Balance → Kelvin
  whiteBalance: {
    cool_daylight: '6500-7500K',
    neutral_daylight: '5500-6000K',
    warm_tungsten: '3200-3500K',
    warm_golden: '4500-5000K',
    mixed_sources: 'mixed (varies by source)'
  },
  
  // WB Shift → Color description
  wbShift: {
    teal: 'teal bias (-10 magenta axis)',
    green: 'green bias (-5 magenta axis)',
    neutral: 'neutral (no shift)',
    magenta: 'magenta bias (+5 magenta axis)',
    amber: 'amber/orange bias (+10 yellow axis)'
  },
  
  // Aperture → f-stop range
  apertureIntent: {
    wide_open: 'f/1.4-f/2.0 (extreme shallow DOF)',
    shallow: 'f/2.8-f/4 (moderate shallow DOF)',
    balanced: 'f/5.6-f/8 (balanced DOF)',
    closed: 'f/8-f/16 (deep DOF, everything sharp)',
    hyperfocal: 'f/11-f/16 (maximum sharpness)'
  },
  
  // Exposure → EV
  exposureIntent: {
    overexposed_dreamy: '+1 to +2 EV (airy, dreamy)',
    overexposed_slight: '+0.3 to +0.7 EV (bright, open)',
    neutral: '0 EV (balanced)',
    underexposed_slight: '-0.3 to -0.7 EV (preserve highlights)',
    underexposed_moody: '-1 to -2 EV (dark, moody)'
  },
  
  // Saturation → %
  saturation: {
    desaturated: '-30% saturation (muted)',
    reduced: '-15% saturation (subtle)',
    neutral: '0% (as-shot)',
    punchy_high: '+15-20% saturation (vibrant)',
    hyper_saturated: '+30% saturation (bold)'
  },
  
  // Contrast → description
  contrastCurve: {
    flat_log: 'Flat/Log curve (minimal contrast)',
    s_curve_light: 'Light S-curve (+10% contrast)',
    s_curve_moderate: 'Moderate S-curve (+20% contrast)',
    s_curve_heavy: 'Heavy S-curve (+35% contrast)',
    crushed_blacks: 'Crushed blacks (blocked shadows)'
  },
  
  // Shadow/Highlight tones → hex approximations
  shadowTone: {
    neutral: 'neutral gray (#404040)',
    cool_teal: 'cool blue-teal (#3A5F6F)',
    cool_blue: 'cool blue (#3A4F6F)',
    warm_brown: 'warm brown (#5F4A3A)',
    warm_orange: 'warm orange (#6F5A3A)'
  },
  
  highlightTone: {
    clean: 'clean neutral (#FAFAFA)',
    warm_cream: 'warm cream (#FFF5E6)',
    cool_blue: 'cool blue (#E6F0FF)',
    vintage_yellow: 'vintage yellow (#FFF8DC)'
  },
  
  // Shutter / Motion
  shutterIntent: {
    freeze_all: '1/1000+ — freeze all motion, everything sharp',
    subject_sharp_bg_motion: 'Panning — subject sharp, background motion blur',
    micro_motion: 'Allow slight motion blur on hair/hands/fabric, product stays sharp',
    motion_blur_artistic: 'Long exposure as artistic choice — motion conveys energy',
    mixed: 'Mixed: flash freezes subject, ambient creates motion trails'
  },
  
  // Processing style
  processingStyle: {
    punchy_contrasty: 'Punchy, high micro-contrast, vibrant colors',
    matte_editorial: 'Matte editorial — lifted shadows, soft contrast, magazine look',
    film_scan_vibe: 'Film scan aesthetic — 35mm grain, dust/scratches, organic',
    clean_digital: 'Clean digital — minimal stylization, technically perfect',
    cross_process: 'Cross-process — shifted colors, unexpected hues',
    vintage_fade: 'Vintage fade — muted colors, low contrast, nostalgic',
    hdr_aggressive: 'HDR aggressive — details everywhere, unnatural flatness'
  },
  
  // Focal length
  focalRange: {
    ultra_wide: '14-20mm ultra-wide — extreme distortion, dramatic perspective',
    wide: '24-35mm wide — environmental, some barrel distortion',
    standard: '40-60mm standard — natural perspective, neutral',
    short_tele: '85-105mm portrait — flattering compression, shallow DOF possible',
    telephoto: '135-200mm telephoto — strong compression, voyeuristic distance',
    super_tele: '300mm+ — extreme compression, surveillance/sports look'
  },
  
  // Camera proximity
  cameraProximity: {
    intimate: 'Intimate — within arm reach, personal space invaded',
    close: 'Close — conversational distance, 1-2 meters',
    medium: 'Medium — full body easily visible, 2-4 meters',
    distant: 'Distant — environmental context, 5+ meters',
    voyeur: 'Voyeuristic — far away, telephoto compression, observed from distance'
  },
  
  // Distortion policy
  distortionPolicy: {
    embrace: 'Embrace distortion — wide-angle stretching is intentional',
    control: 'Control distortion — minimize but some is acceptable',
    correct: 'Correct distortion — no visible barrel/pincushion distortion',
    neutral: 'Neutral — use lens appropriate for shot, no forced correction'
  },
  
  // Visual Mood — VISUAL atmosphere, NOT model emotion
  visualMood: {
    playful_summer: 'Visual atmosphere: bright saturated colors, warm golden light, feeling of heat and summer joy',
    confident_bold: 'Visual atmosphere: high contrast, strong shadows, bold composition, commanding presence in frame',
    melancholic_romantic: 'Visual atmosphere: soft diffused light, muted pastel tones, slight haze, dreamy quality',
    edgy_raw: 'Visual atmosphere: harsh contrasty shadows, gritty textures, visible imperfections, unpolished feel',
    serene_calm: 'Visual atmosphere: soft even light, low contrast, muted colors, minimalist, peaceful',
    energetic_dynamic: 'Visual atmosphere: dynamic camera angles, possible motion blur, vibrant color accents',
    sensual: 'Visual atmosphere: warm skin tones, soft focus, intimate lighting, golden/amber palette',
    mysterious: 'Visual atmosphere: deep shadows, parts hidden in darkness, dramatic chiaroscuro lighting',
    fresh_clean: 'Visual atmosphere: high key, lots of white space, airy, minimal shadows, crisp',
    gritty_urban: 'Visual atmosphere: urban textures, concrete, neon accents, night or twilight, street feel'
  },
  
  // Primary focus
  primaryFocus: {
    product: 'Product is hero — MUST be sharp, well-lit, readable',
    model: 'Model is hero — product is context/accessory',
    balanced: 'Balanced — model and product share equal importance',
    environment: 'Environment is hero — location/atmosphere dominant',
    emotion: 'Emotion is hero — feeling over technical perfection'
  },
  
  // Cultural context
  culturalContext: {
    ad_campaign: 'High-end advertising campaign — polished, aspirational',
    editorial_magazine: 'Editorial magazine — artistic, storytelling, conceptual',
    social_media: 'Social media native — authentic, relatable, scroll-stopping',
    lookbook: 'Lookbook/catalog — clean, product-focused, informative',
    street_documentary: 'Street documentary — raw, candid, journalistic',
    fine_art: 'Fine art photography — conceptual, gallery-worthy, deliberate'
  },
  
  // Decade/era
  decade: {
    contemporary: 'Contemporary 2020s — current visual language',
    early_2020s: 'Early 2020s — Instagram aesthetic, clean digital',
    late_2010s: 'Late 2010s — matte tones, muted palette',
    early_2010s: 'Early 2010s — high contrast, saturated',
    y2k_2000s: 'Y2K 2000s — flash photography, digital artifacts',
    film_90s: 'Film 90s — grainy, authentic, analog',
    retro_80s: 'Retro 80s — bold colors, geometric, synthetic',
    vintage_70s: 'Vintage 70s — warm, faded, organic',
    classic_60s: 'Classic 60s — mod, graphic, high contrast B&W option'
  },
  
  // ═══════════════════════════════════════════════════════════════
  // LIGHTING (НЕ ЗАВИСИТ ОТ ПОЗЫ — применяется ко всем кадрам)
  // ═══════════════════════════════════════════════════════════════
  
  lightSource: {
    direct_sun: 'Direct sunlight — hard shadows, high contrast, ~5500K',
    golden_hour: 'Golden hour — warm side light (~3500-4500K), soft long shadows, golden tones',
    blue_hour: 'Blue hour — cool diffused light (~7000-9000K), no direct sun, blue tones',
    overcast: 'Overcast sky — giant softbox, diffused even light, no shadows',
    open_shade: 'Open shade — subject in shadow, lit by reflected sky',
    window_light: 'Window light — soft directional, gradual falloff',
    studio_soft: 'Studio softbox — controlled soft light, no harsh shadows',
    studio_hard: 'Studio hard light — directional, sharp contrasty shadows',
    flash_fill: 'Fill flash — reduces shadows from main source',
    practicals: 'Practical lights in frame — lamps, neon, storefronts',
    mixed: 'Mixed sources — multiple temperatures and qualities'
  },
  
  lightDirection: {
    front: 'Front light (from camera) — flat, minimal shadows',
    side_front: 'Side-front 45° — classic portrait lighting',
    side: 'Side 90° — dramatic, half face in shadow',
    back_side: 'Back-side — rim light, edge glow',
    backlight: 'Backlight — behind subject, halo/silhouette',
    top: 'Top light (noon sun) — shadows under eyes/nose',
    bottom: 'Bottom light — unnatural, ominous'
  },
  
  lightQuality: {
    hard: 'Hard light — sharp shadow edges, high contrast',
    medium: 'Medium light — gradual shadow transition, readable contrast',
    soft: 'Soft light — smooth transitions, wrap-around',
    diffused: 'Diffused light — almost no shadows, flat'
  },
  
  timeOfDay: {
    sunrise: 'Sunrise — first rays, cold-to-warm transition',
    morning: 'Morning — fresh clean light, low sun angle',
    midday: 'Midday — harsh overhead light, short shadows',
    afternoon: 'Afternoon — standard daylight, 45-60° sun',
    golden_hour: 'Golden hour — 1-2 hours before sunset, warm golden',
    sunset: 'Sunset — dramatic orange-red light, long shadows',
    blue_hour: 'Blue hour — just after sunset, cool blue ambient',
    night: 'Night — artificial sources only, contrast pools'
  },
  
  weatherLighting: {
    clear: 'Clear sky — direct sun, blue sky reflections',
    partly_cloudy: 'Partly cloudy — alternating hard/soft light',
    overcast: 'Overcast — clouds as giant softbox, even diffused',
    foggy: 'Fog/haze — atmospheric, reduced contrast, lost depth',
    rainy: 'Rain — wet reflective surfaces, muted colors',
    snowy: 'Snowy — falling snow, white surfaces, cold diffused light',
    stormy: 'Stormy — dramatic dark sky, high contrast',
    windy: 'Windy — hair and fabric movement, dynamic',
    hazy: 'Hazy/smog — reduced visibility, soft light',
    indoor: 'Indoor — weather independent, controlled'
  },
  
  season: {
    spring: 'Spring — fresh green foliage, blossoms, clean light',
    summer: 'Summer — bright high sun, saturated colors, lush greens',
    autumn: 'Autumn — golden/red foliage, low warm sun, melancholic',
    winter: 'Winter — cold blue light, minimalist landscape, snow or bare trees',
    late_autumn: 'Late autumn — bare trees, grey sky, fallen leaves',
    early_spring: 'Early spring — melting snow, first buds, transitional light',
    any: 'Any season'
  }
};

/**
 * Собрать STRICT промпт с жёсткими constraint'ами
 * Для максимальной консистентности между кадрами
 * 
 * @param {Object} params - Объект с параметрами вселенной
 * @returns {string} - Директивный промпт с техническими значениями
 */
function buildStrictUniverseNarrative(params) {
  const sections = [];
  
  // ═══════════════════════════════════════════════════════════════
  // ABSOLUTE CONSTRAINTS (не менять между кадрами)
  // ═══════════════════════════════════════════════════════════════
  
  const constraints = [];
  
  // Color temperature
  const wb = TECHNICAL_VALUES.whiteBalance[params.whiteBalance] || '5500K';
  const wbShift = TECHNICAL_VALUES.wbShift[params.wbShift] || 'neutral';
  constraints.push(`Color temperature: ${wb}, ${wbShift}`);
  
  // Exposure
  const exposure = TECHNICAL_VALUES.exposureIntent[params.exposureIntent] || '0 EV';
  constraints.push(`Exposure: ${exposure}`);
  
  // Contrast
  const contrast = TECHNICAL_VALUES.contrastCurve[params.contrastCurve] || 'moderate S-curve';
  constraints.push(`Contrast: ${contrast}`);
  
  // Aperture / DOF
  const aperture = TECHNICAL_VALUES.apertureIntent[params.apertureIntent] || 'f/5.6-f/8';
  constraints.push(`Depth of field: ${aperture}`);
  
  // Saturation
  const saturation = TECHNICAL_VALUES.saturation[params.saturation] || 'neutral';
  constraints.push(`Saturation: ${saturation}`);
  
  // Skin rendering based on retouchLevel
  const skinMap = {
    none: 'RAW skin — all texture, pores, blemishes visible',
    minimal: 'Natural skin — visible pores, subtle texture, NO airbrushing',
    moderate: 'Light retouch — smooth but textured, pores visible on closeup',
    heavy: 'Heavy retouch — smooth skin, minimal texture',
    beauty: 'Beauty retouch — porcelain skin, maximum smoothness'
  };
  const skinRender = skinMap[params.retouchLevel] || skinMap.minimal;
  constraints.push(`Skin rendering: ${skinRender}`);
  
  // Focal length
  const focalRange = TECHNICAL_VALUES.focalRange[params.focalRange] || '50mm standard';
  constraints.push(`Focal length: ${focalRange}`);
  
  // Camera proximity
  const proximity = TECHNICAL_VALUES.cameraProximity[params.cameraProximity] || 'medium distance';
  constraints.push(`Camera distance: ${proximity}`);
  
  // Shutter / Motion
  const shutter = TECHNICAL_VALUES.shutterIntent[params.shutterIntent] || 'freeze all motion';
  constraints.push(`Motion handling: ${shutter}`);
  
  // Distortion
  const distortion = TECHNICAL_VALUES.distortionPolicy[params.distortionPolicy] || 'control distortion';
  constraints.push(`Distortion: ${distortion}`);
  
  sections.push(`ABSOLUTE CONSTRAINTS (DO NOT DEVIATE):
${constraints.map(c => `• ${c}`).join('\n')}`);
  
  // ═══════════════════════════════════════════════════════════════
  // VISUAL ANCHORS (конкретные цвета)
  // ═══════════════════════════════════════════════════════════════
  
  const anchors = [];
  
  // Shadow tone
  const shadowTone = TECHNICAL_VALUES.shadowTone[params.shadowTone] || 'neutral gray';
  anchors.push(`Shadow tone: ${shadowTone}`);
  
  // Highlight tone
  const highlightTone = TECHNICAL_VALUES.highlightTone[params.highlightTone] || 'clean neutral';
  anchors.push(`Highlight tone: ${highlightTone}`);
  
  // Camera class → rendering style
  const cameraRender = {
    high_dr_professional: 'Clean digital rendering, wide dynamic range, no clipping',
    prosumer_balanced: 'Balanced digital rendering',
    consumer_limited: 'Limited DR — expect blown highlights or blocked shadows',
    film_professional: 'Film grain (fine), organic color rolloff, halation in highlights',
    film_consumer: 'Soft film grain, warm cast, slight vignetting',
    phone_computational: 'Computational HDR, oversharpened edges, small sensor look',
    toy_lofi: 'Heavy vignette, soft focus, light leaks allowed'
  };
  const camera = cameraRender[params.cameraClass] || cameraRender.high_dr_professional;
  anchors.push(`Camera rendering: ${camera}`);
  
  // Processing style
  const processing = TECHNICAL_VALUES.processingStyle[params.processingStyle] || 'clean digital';
  anchors.push(`Processing style: ${processing}`);
  
  // Era / Decade
  const era = TECHNICAL_VALUES.decade[params.decade] || 'contemporary';
  anchors.push(`Era/aesthetic: ${era}`);
  
  // Cultural context
  const context = TECHNICAL_VALUES.culturalContext[params.culturalContext] || 'editorial magazine';
  anchors.push(`Context: ${context}`);
  
  sections.push(`VISUAL ANCHORS (apply to every frame):
${anchors.map(a => `• ${a}`).join('\n')}`);
  
  // ═══════════════════════════════════════════════════════════════
  // LIGHTING (LOCKED — НЕ ЗАВИСИТ ОТ ПОЗЫ)
  // Освещение остаётся ОДИНАКОВЫМ для всех кадров съёмки
  // ═══════════════════════════════════════════════════════════════
  
  const lightingParams = [];
  
  // Light source
  const lightSource = TECHNICAL_VALUES.lightSource[params.lightSource];
  if (lightSource) lightingParams.push(`Source: ${lightSource}`);
  
  // Light direction
  const lightDir = TECHNICAL_VALUES.lightDirection[params.lightDirection];
  if (lightDir) lightingParams.push(`Direction: ${lightDir}`);
  
  // Light quality
  const lightQual = TECHNICAL_VALUES.lightQuality[params.lightQuality];
  if (lightQual) lightingParams.push(`Quality: ${lightQual}`);
  
  // ─────────────────────────────────────────────────────────────
  // SMART CONTEXT: Skip irrelevant params for indoor/studio
  // ─────────────────────────────────────────────────────────────
  const isIndoor = params.weatherLighting === 'indoor';
  const isStudio = ['studio_soft', 'studio_hard'].includes(params.lightSource);
  
  // Time of day - skip for pure studio lighting
  if (!isStudio) {
    const timeDay = TECHNICAL_VALUES.timeOfDay[params.timeOfDay];
    if (timeDay) lightingParams.push(`Time: ${timeDay}`);
  }
  
  // Weather - skip for indoor
  if (!isIndoor) {
    const weather = TECHNICAL_VALUES.weatherLighting[params.weatherLighting];
    if (weather) lightingParams.push(`Weather: ${weather}`);
  }
  
  if (lightingParams.length > 0) {
    sections.push(`LIGHTING (LOCKED — SAME for ALL frames, independent of pose):
${lightingParams.map(l => `• ${l}`).join('\n')}

⚠️ CRITICAL: Lighting MUST remain consistent across ALL frames.
The pose/framing may change, but light source, direction, quality, and time of day MUST NOT change.`);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // LIGHTING TECHNICAL ANCHOR (NEW: measurable metrics for consistency)
  // ═══════════════════════════════════════════════════════════════
  
  const lightingTechnical = buildLightingTechnicalAnchor(params);
  if (lightingTechnical) {
    sections.push(lightingTechnical);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // FORBIDDEN (что запрещено)
  // ═══════════════════════════════════════════════════════════════
  
  const forbidden = [
    'HDR look or tone mapping artifacts',
    'Perfectly centered subject (use asymmetric composition)',
    'Pure white (#FFFFFF) or pure black (#000000)',
    'Plastic, airbrushed, "beauty filter" skin',
    'Empty, lifeless, soulless eyes',
    'Perfect bilateral face symmetry'
  ];
  
  // Add context-specific forbidden based on antiAiLevel
  if (params.antiAiLevel === 'high' || params.antiAiLevel === 'medium') {
    forbidden.push('Perfect focus across entire frame');
    forbidden.push('Clinically clean, dust-free surfaces');
    forbidden.push('Mathematically perfect compositions');
  }
  
  // Add forbidden based on era
  if (params.decade === 'contemporary' || params.decade === 'early_2020s') {
    forbidden.push('Heavy film grain (this is digital era)');
    forbidden.push('Faded, washed-out colors (unless specified)');
  }
  
  sections.push(`FORBIDDEN (NEVER include):
${forbidden.map(f => `✗ ${f}`).join('\n')}`);
  
  // ═══════════════════════════════════════════════════════════════
  // APPROACH & ENERGY (короткое директивное описание)
  // ═══════════════════════════════════════════════════════════════
  
  const approachParts = [];
  
  // Shooting approach
  const approachMap = {
    friend_casual: 'Casual, intimate — like a friend with a camera at a party',
    professional_controlled: 'Professional, controlled — clear artistic direction',
    paparazzi_voyeur: 'Voyeuristic, stolen moment — telephoto distance',
    self_portrait: 'Self-portrait/selfie — intimate eye contact with lens',
    documentary: 'Documentary — observe without interfering',
    art_conceptual: 'Conceptual art — fully staged, artistic intent'
  };
  const approach = approachMap[params.shootingApproach] || approachMap.professional_controlled;
  approachParts.push(approach);
  
  // Energy level
  const energyMap = {
    low: 'Low energy — calm, still, contemplative',
    medium: 'Medium energy — relaxed but present',
    high: 'High energy — dynamic, alive, vibrant',
    manic: 'Manic energy — explosive, chaotic, intense'
  };
  const energy = energyMap[params.energyLevel] || energyMap.medium;
  approachParts.push(energy);
  
  // Spontaneity
  const spontMap = {
    fully_posed: 'Fully posed and directed',
    semi_candid: 'Semi-candid — posed setup with spontaneous moments',
    candid_aware: 'Candid-aware — subject knows camera but acts natural',
    candid_unaware: 'Candid-unaware — caught in the moment'
  };
  const spont = spontMap[params.spontaneity] || spontMap.semi_candid;
  approachParts.push(spont);
  
  // Product discipline
  const productMap = {
    product_absolute: 'Product MUST be sharp, readable, properly lit in EVERY frame',
    product_primary: 'Product should be visible and recognizable',
    balanced: 'Balance between model and product',
    atmosphere_first: 'Atmosphere over product clarity',
    model_first: 'Model is focus, product is context'
  };
  const product = productMap[params.productDiscipline] || '';
  if (product) approachParts.push(product);
  
  // Emotional vector
  const emotionVec = TECHNICAL_VALUES.visualMood[params.visualMood] || '';
  if (emotionVec) approachParts.push(`Emotional tone: ${emotionVec}`);
  
  // Primary focus
  const primaryFocus = TECHNICAL_VALUES.primaryFocus[params.primaryFocus] || '';
  if (primaryFocus) approachParts.push(primaryFocus);
  
  sections.push(`APPROACH & ENERGY:
${approachParts.join('. ')}.`);
  
  // ═══════════════════════════════════════════════════════════════
  // REALISM / ANTI-AI (если включено)
  // ═══════════════════════════════════════════════════════════════
  
  if (params.antiAiLevel && params.antiAiLevel !== 'off') {
    const realismRules = [];
    
    if (params.antiAiLevel === 'high') {
      realismRules.push('CRITICAL: Image must look captured by camera, NOT generated');
    }
    
    // Check flags
    const flags = params.antiAiFlags || {};
    if (flags.allowExposureErrors) realismRules.push('Subtle exposure variations allowed');
    if (flags.allowMixedWhiteBalance) realismRules.push('Mixed color temperatures from multiple light sources OK');
    if (flags.requireMicroDefects) realismRules.push('Include micro-defects: dust, fabric lint, subtle skin texture');
    if (flags.candidComposition) realismRules.push('Slightly imperfect composition (not mathematically centered)');
    if (flags.allowImperfectFocus) realismRules.push('Focus can be slightly off on non-critical areas');
    if (flags.allowFlaresReflections) realismRules.push('Lens flares, reflections, and optical artifacts welcome');
    if (flags.preferMicroMotion) realismRules.push('Subtle motion blur on extremities (fingers, hair) acceptable');
    if (flags.filmScanTexture) realismRules.push('Fine grain or sensor noise texture');
    
    if (realismRules.length > 0) {
      sections.push(`REALISM (Anti-AI):
${realismRules.map(r => `• ${r}`).join('\n')}`);
    }
  }
  
  return sections.join('\n\n');
}

// ═══════════════════════════════════════════════════════════════
// DESCRIPTIVE MODE: Описательный промпт в стиле арт-директора
// Каждый параметр объясняет свой визуальный эффект и почему это важно
// Основано на стиле FOOTWEAR_FISHEYE_PLAYGROUND_01
// ═══════════════════════════════════════════════════════════════

/**
 * Описательные объяснения для параметров
 * Формат: не "что это", а "что это даёт визуально"
 */
const DESCRIPTIVE_EFFECTS = {
  // ───────────────────────────────────────────────────────────────
  // CAMERA CLASS — как камера влияет на рендеринг
  // ───────────────────────────────────────────────────────────────
  cameraClass: {
    high_dr_professional: 'Камера — цифровая с высоким динамическим диапазоном (уровня Canon R5 / Sony A1 / Nikon Z8), чтобы удерживать и яркое небо, и зеркальные блики на материалах без «мертвых» пересветов; при этом допускается намеренный клиппинг блика как художественный акцент, но не потеря формы',
    prosumer_balanced: 'Камера — просьюмерская с умеренным динамическим диапазоном, даёт чистую картинку с ограничениями в экстремальных светах — работает для контролируемых условий',
    consumer_limited: 'Камера с ограниченным DR — ожидаются пересветы в ярких зонах или заблокированные тени, что добавляет «любительский» характер снимку',
    film_professional: 'Плёночная камера среднего/большого формата — мягкое органическое зерно, характерный ролл-офф в светах (плёнка не клиппит резко, а плавно уходит в белый), тонкая галация вокруг ярких источников',
    film_consumer: 'Компактная плёнка 35mm — видимое зерно, тёплый сдвиг в тенях, лёгкая виньетка по углам, ощущение честной «мыльницы»',
    phone_computational: 'Смартфон с вычислительной фотографией — HDR-склейка, перешарпленные края, характерный «маленький сенсор» look с глубиной резкости больше ожидаемой',
    toy_lofi: 'Toy camera / Holga / Diana — тяжёлая виньетка, мягкий фокус по углам, случайные засветки, полная непредсказуемость',
    disposable: 'Одноразовая камера со вспышкой — резкий передний план, тёмный провал фона, красные глаза, характерный «вечериночный» look 90-х'
  },
  
  // ───────────────────────────────────────────────────────────────
  // EXPOSURE — как экспозиция влияет на настроение
  // ───────────────────────────────────────────────────────────────
  exposureIntent: {
    overexposed_dreamy: 'Экспозиция с сильным передержанием (+1/+2 EV), чтобы создать воздушное, мечтательное ощущение — света выбиваются, но это намеренно добавляет «дыхания» и лёгкости кадру',
    overexposed_slight: 'Лёгкое передерживание (+0.3/+0.7 EV) для более открытого, яркого ощущения — тени читаются, но общий тон приподнят',
    neutral: 'Нейтральная экспозиция по среднему серому — классический баланс между тенями и светами без художественных отклонений',
    underexposed_slight: 'Экспозиция с лёгким недодержанием (-0.3/-0.7 EV), чтобы насыщенность не распадалась в хайлайтах и небо/фон оставались глубокими и плотными',
    underexposed_moody: 'Сильное недодержание (-1/-2 EV) для мрачного, атмосферного ощущения — детали тонут в тенях, внимание концентрируется на освещённых участках'
  },
  
  // ───────────────────────────────────────────────────────────────
  // WHITE BALANCE — как температура задаёт тональность
  // ───────────────────────────────────────────────────────────────
  whiteBalance: {
    cool_daylight: 'Баланс белого смещён в cool daylight (около 6500–7500K), чтобы небо было плотным и «сочным» цианом, а тени — прохладными и контрастными',
    neutral_daylight: 'Нейтральный дневной баланс (5500–6000K) — референсная точка без тёплых или холодных сдвигов, честная передача цвета',
    warm_tungsten: 'Тёплый баланс под лампы накаливания (3200–3500K) — оранжевые тона в тенях, интимное вечернее ощущение',
    warm_golden: 'Тёплый золотистый баланс (4500–5000K) — мягкое золото в светах, приятная кожа, ощущение «закатного часа» даже в нейтральном свете',
    mixed_sources: 'Смешанный баланс — разные источники имеют разную температуру, что создаёт визуальное напряжение и «честность» репортажной съёмки'
  },
  
  // ───────────────────────────────────────────────────────────────
  // WB SHIFT — цветовые акценты в тенях/светах
  // ───────────────────────────────────────────────────────────────
  wbShift: {
    teal: 'с лёгким сдвигом в циан/teal в тенях, создавая кинематографический холодно-тёплый контраст',
    green: 'с зеленоватым оттенком, характерным для флуоресцентного освещения или винтажного look\'а',
    neutral: 'без цветовых сдвигов — чистый технический баланс',
    magenta: 'с magenta-сдвигом (+5 по оси), добавляющим теплоты теням без оранжевого',
    amber: 'с amber/оранжевым сдвигом для подчёркнуто тёплой, «медовой» тональности'
  },
  
  // ───────────────────────────────────────────────────────────────
  // SATURATION — насыщенность и её роль
  // ───────────────────────────────────────────────────────────────
  saturation: {
    desaturated: 'Палитра намеренно приглушена (-30% насыщенности), чтобы создать мудборд-ощущение или винтажную меланхолию',
    reduced: 'Слегка сниженная насыщенность (-15%) для более «журнального» matte-look\'а без кислотности',
    neutral: 'Насыщенность as-shot — без усиления или ослабления цветов',
    punchy_high: 'Палитра насыщенная и «громкая» (+15-20%): глубокий циан неба, яркая зелень, чистые акцентные цвета — ощущение залитого солнцем летнего дня',
    hyper_saturated: 'Гипернасыщенные цвета (+30%) — агрессивный, почти плакатный look для максимального визуального удара'
  },
  
  // ───────────────────────────────────────────────────────────────
  // CONTRAST — как контраст формирует объём
  // ───────────────────────────────────────────────────────────────
  contrastCurve: {
    flat_log: 'Минимальный контраст (Log-кривая) — все тона видны, идеально для последующей цветокоррекции, но требует обработки',
    s_curve_light: 'Лёгкая S-кривая (+10% контраста) с приподнятой детализацией в тенях, чтобы фактура поверхностей читалась',
    s_curve_moderate: 'Умеренная S-кривая (+20% контраста) — классический «готовый» look с хорошим объёмом и читаемыми тенями',
    s_curve_heavy: 'Агрессивная S-кривая (+35% контраста) с высоким микроконтрастом — текстуры «звенят», но тени уходят в чёрный',
    crushed_blacks: 'Забитые тени — чёрный уходит в полный провал, детали теряются, но силуэты становятся графичными'
  },
  
  // ───────────────────────────────────────────────────────────────
  // FOCAL LENGTH — как оптика меняет восприятие
  // ───────────────────────────────────────────────────────────────
  focalRange: {
    ultra_wide: 'Ультраширик/фишай (12–20mm) с агрессивной перспективой — ближайший объект становится гигантским и «выпрыгивает» из кадра, линии гнутся, создавая энергию и масштаб',
    wide: 'Широкий угол (24–35mm) для средовой съёмки — захватывает контекст, добавляет лёгкое бочкообразное искажение, которое можно контролировать или использовать как стиль',
    standard: 'Стандартный объектив (40–60mm) — нейтральная перспектива, близкая к человеческому глазу, без искажений и сжатия',
    short_tele: 'Короткий телевик (85–105mm) — классический портретный look с мягким сжатием перспективы и возможностью неглубокой ГРИП',
    telephoto: 'Телефото (135–200mm) — сильное сжатие перспективы, voyeuristic distance, фон «прилипает» к субъекту',
    super_tele: 'Супертелевик (300mm+) — экстремальное сжатие как в спорте/surveillance, ощущение подглядывания издалека'
  },
  
  // ───────────────────────────────────────────────────────────────
  // APERTURE — как ГРИП влияет на фокус внимания
  // ───────────────────────────────────────────────────────────────
  apertureIntent: {
    wide_open: 'Диафрагма открыта (f/1.4–f/2.0) — экстремально малая глубина резкости, фокус только на одной плоскости, всё остальное тает в боке',
    shallow: 'Неглубокая ГРИП (f/2.8–f/4) — субъект резкий, фон мягко размыт, классический «отделяющий» портретный look',
    balanced: 'Сбалансированная ГРИП (f/5.6–f/8) — и субъект, и ближний контекст читаемы, лёгкое размытие дальнего плана',
    closed: 'Глубокая ГРИП (f/8–f/16) для одновременной читаемости продукта и контекста — всё резкое, от переднего плана до фона',
    hyperfocal: 'Гиперфокальная дистанция (f/11–f/16) — максимальная резкость от ближнего объекта до бесконечности, ничего не размыто'
  },
  
  // ───────────────────────────────────────────────────────────────
  // CAMERA PROXIMITY — как дистанция меняет интимность
  // ───────────────────────────────────────────────────────────────
  cameraProximity: {
    intimate: 'Камера в 10–30 см от субъекта, буквально «вторгается» в личное пространство — создаёт ощущение близости и немного неловкости, объект доминирует в кадре',
    close: 'Разговорная дистанция (1–2 метра) — достаточно близко для эмоциональной связи, но без давления',
    medium: 'Средняя дистанция (2–4 метра) — полная фигура легко читается, есть место для контекста',
    distant: 'Дальняя дистанция (5+ метров) — субъект в среде, environmental portrait, пространство доминирует',
    voyeur: 'Voyeuristic дистанция — далеко, через телевик, ощущение подсматривания без участия'
  },
  
  // ───────────────────────────────────────────────────────────────
  // SHUTTER / MOTION — как движение передаёт энергию
  // ───────────────────────────────────────────────────────────────
  shutterIntent: {
    freeze_all: 'Короткая выдержка (1/1000+) замораживает всё движение — резкость везде, даже на капельках воды и волосах',
    subject_sharp_bg_motion: 'Приём «продукт резкий, мир живой»: короткая выдержка для субъекта, паннинг даёт смаз фона, передавая скорость',
    micro_motion: 'Допускается лёгкий смаз волос/пальцев/ткани от микродвижения — добавляет жизни, но продукт остаётся резким',
    motion_blur_artistic: 'Длинная выдержка как художественный приём — движение становится шлейфом, передаёт энергию и течение времени',
    mixed: 'Смешанная техника: вспышка замораживает субъект, длинный ambient создаёт «хвосты» от движения или огней'
  },
  
  // ───────────────────────────────────────────────────────────────
  // PROCESSING — стиль обработки
  // ───────────────────────────────────────────────────────────────
  processingStyle: {
    punchy_contrasty: 'Обработка сочная, контрастная, с высоким микроконтрастом и видимой текстурой — цвета «звенят», детали читаются',
    matte_editorial: 'Matte editorial look — приподнятые тени, мягкий контраст, журнальная утончённость без резкости',
    film_scan_vibe: 'Добавленное зерно 35mm-скана, лёгкие микро-царапки/пыль как «скан-вайб» — тактильность плёночной эстетики',
    clean_digital: 'Чистая цифровая обработка — минимум стилизации, технически идеальная картинка',
    cross_process: 'Кросс-процесс — сдвинутые цвета, неожиданные оттенки, ощущение химического эксперимента',
    vintage_fade: 'Винтажный fade — приглушённые цвета, сниженный контраст, ностальгическая мягкость',
    hdr_aggressive: 'Агрессивный HDR — детали вытянуты везде, неестественная плоскость, характерный «слишком чёткий» look'
  },
  
  // ───────────────────────────────────────────────────────────────
  // RETOUCH — уровень обработки кожи/текстуры
  // ───────────────────────────────────────────────────────────────
  retouchLevel: {
    none: 'Ретушь ограничена: убрать случайные отвлекающие элементы, сохранить поры/пушок/живые тени — никакой пластиковой чистки кожи',
    minimal: 'Минимальная ретушь — убираются только временные дефекты (прыщи), сохраняется вся естественная текстура кожи',
    moderate: 'Умеренная ретушь — кожа выровнена, но текстура пор читается при увеличении',
    heavy: 'Серьёзная ретушь — кожа гладкая, минимум текстуры, но не пластиковая',
    beauty: 'Beauty-ретушь — фарфоровая гладкость, максимальное выравнивание, гламурный look'
  },
  
  // ───────────────────────────────────────────────────────────────
  // DECADE — визуальная эпоха
  // ───────────────────────────────────────────────────────────────
  decade: {
    contemporary: 'Современная визуальная эстетика 2020-х — чистый digital, TikTok/UGC-ритм, но снято профессионально и композиционно собранно',
    early_2020s: 'Эстетика ранних 2020-х — Instagram-чистота, мягкие маски, нейтральные тона',
    late_2010s: 'Поздние 2010-е — matte-тона, приглушённая палитра, VSCO-эстетика',
    early_2010s: 'Ранние 2010-е — высокий контраст, насыщенные цвета, резкая обработка',
    y2k_2000s: 'Y2K 2000-е — flash-фотография, цифровые артефакты, пластиковые аксессуары, кислотные акценты, спортивная графика',
    film_90s: 'Плёночные 90-е — зерно, аутентичность, аналоговая честность',
    retro_80s: 'Ретро 80-е — bold цвета, геометрия, синтетические текстуры',
    vintage_70s: 'Винтаж 70-х — тёплые faded тона, органика, мягкость',
    classic_60s: 'Классика 60-х — mod-графика, высокий контраст, возможен ч/б'
  },
  
  // ───────────────────────────────────────────────────────────────
  // CULTURAL CONTEXT — тип съёмки
  // ───────────────────────────────────────────────────────────────
  culturalContext: {
    ad_campaign: 'Съёмка с дисциплиной рекламной кампании: продукт всегда резкий, читаемый по форме и материалу, aspirational look',
    editorial_magazine: 'Журнальный editorial на стыке i-D / Dazed digital-энергии — художественное высказывание, история важнее продукта',
    social_media: 'Social-first контент — authentic, relatable, «свой парень» энергия, scroll-stopping моменты',
    lookbook: 'Lookbook/каталог — чисто, информативно, product-focused, без лишней драмы',
    street_documentary: 'Уличная документалистика — raw, candid, журналистская честность без постановки',
    fine_art: 'Fine art photography — концептуально, gallery-worthy, намеренная художественность'
  },
  
  // ───────────────────────────────────────────────────────────────
  // SHOOTING APPROACH — тип съёмочного процесса
  // ───────────────────────────────────────────────────────────────
  shootingApproach: {
    friend_casual: 'Съёмка строится на ощущении «друга с камерой» — интимность без формальности, как будто снимает кто-то из компании',
    professional_controlled: 'Профессионально контролируемый процесс — чёткая арт-дирекция, выверенные позы и свет',
    paparazzi_voyeur: 'Voyeuristic/папарацци-подход — украденные моменты, телевик, субъект не смотрит в камеру',
    self_portrait: 'Селфи/автопортрет — интимный контакт с камерой, ощущение «я снимаю себя»',
    documentary: 'Документальный подход — наблюдать, не вмешиваясь, ловить реальные моменты',
    art_conceptual: 'Концептуальная арт-съёмка — полностью срежиссировано, каждый элемент продуман'
  },
  
  // ───────────────────────────────────────────────────────────────
  // ENERGY LEVEL — энергия кадра
  // ───────────────────────────────────────────────────────────────
  energyLevel: {
    low: 'Энергия низкая — спокойствие, созерцательность, медленное дыхание кадра',
    medium: 'Энергия средняя — расслабленность, но присутствие, «здесь и сейчас»',
    high: 'Энергия высокая — кадры живые, с микромоментами (вдох перед смехом, прищур от солнца, язык тела «на расслабоне»)',
    manic: 'Энергия на максимуме — взрывная, хаотичная, на грани потери контроля'
  },
  
  // ───────────────────────────────────────────────────────────────
  // SPONTANEITY — уровень постановки
  // ───────────────────────────────────────────────────────────────
  spontaneity: {
    fully_posed: 'Полностью срежиссированные позы — каждый угол и жест продуман',
    semi_candid: 'Серийная съёмка для микромоментов — постановка есть, но ловится спонтанность между позами',
    candid_aware: 'Субъект знает о камере, но ведёт себя естественно — «я вижу тебя, но не позирую»',
    candid_unaware: 'Пойманы в моменте — субъект не смотрит в камеру, занят своим'
  },
  
  // ───────────────────────────────────────────────────────────────
  // VISUAL MOOD — визуальная атмосфера (НЕ эмоция модели!)
  // ───────────────────────────────────────────────────────────────
  visualMood: {
    playful_summer: 'Визуальная атмосфера летняя и игривая: яркие насыщенные цвета, тёплый золотистый свет, ощущение жары — короткие резкие тени, блики на коже, эффект «залитости солнцем»',
    confident_bold: 'Визуальная атмосфера уверенная и дерзкая: высокий контраст, глубокие чёрные тени, сильные геометрические формы в композиции, доминирующие линии',
    melancholic_romantic: 'Визуальная атмосфера меланхоличная: мягкий рассеянный свет, приглушённые пастельные тона, лёгкая дымка в воздухе, мечтательное качество изображения',
    edgy_raw: 'Визуальная атмосфера острая и raw: жёсткие контрастные тени, грязные текстуры видны, зерно плёнки или цифровой шум, несовершенства как часть эстетики',
    serene_calm: 'Визуальная атмосфера спокойная: мягкий ровный свет, низкий контраст, приглушённые нежные цвета, минималистичная композиция, много воздуха в кадре',
    energetic_dynamic: 'Визуальная атмосфера энергичная: динамичные ракурсы камеры, возможен motion blur, яркие цветовые акценты, диагональные линии, ощущение движения',
    sensual: 'Визуальная атмосфера чувственная: тёплые телесные тона (персиковый, золотистый), мягкий фокус, интимное боковое освещение, shallow DOF',
    mysterious: 'Визуальная атмосфера загадочная: глубокие тени скрывают части кадра, chiaroscuro, драматичный направленный свет, недосказанность',
    fresh_clean: 'Визуальная атмосфера свежая и чистая: high-key освещение, много белого пространства, воздушность, минимум теней, crisp резкость',
    gritty_urban: 'Визуальная атмосфера гритти/урбан: городские текстуры (бетон, металл), неоновые цветовые акценты, ночь или сумерки, уличное ощущение'
  },
  
  // ───────────────────────────────────────────────────────────────
  // PRODUCT DISCIPLINE — приоритет продукта
  // ───────────────────────────────────────────────────────────────
  productDiscipline: {
    product_absolute: 'Продукт — абсолютный герой: в КАЖДОМ кадре резкий, читаемый по форме и материалу, не теряется в движении',
    product_primary: 'Продукт в приоритете — виден и узнаваем, но допускаются художественные вольности',
    balanced: 'Баланс модели и продукта — оба равноправны в кадре',
    atmosphere_first: 'Атмосфера важнее продукта — mood доминирует, продукт вторичен',
    model_first: 'Модель в фокусе — продукт как аксессуар/контекст'
  },
  
  // ───────────────────────────────────────────────────────────────
  // LIGHTING (НЕ ЗАВИСИТ ОТ ПОЗЫ)
  // ───────────────────────────────────────────────────────────────
  lightSource: {
    direct_sun: 'Жёсткое полуденное солнце — короткие плотные тени, высокий контраст, блики на материалах как «искры»',
    golden_hour: 'Golden hour — тёплый боковой свет около 3500–4500K, мягкие длинные тени, золотистые тона на коже и поверхностях',
    blue_hour: 'Blue hour — холодный рассеянный свет около 7000–9000K, нет прямого солнца, всё в синеватой дымке',
    overcast: 'Пасмурное небо — гигантский софтбокс, ровный рассеянный свет без теней, идеально для текстуры',
    open_shade: 'Открытая тень — субъект в тени, освещён отражённым небом, мягко и ровно',
    window_light: 'Свет из окна — мягкий направленный с постепенным падением яркости от источника',
    studio_soft: 'Студийный софтбокс — контролируемый мягкий свет без жёстких теней',
    studio_hard: 'Студийный жёсткий свет — направленный, с резкими контрастными тенями',
    flash_fill: 'Заполняющая вспышка — снижает контраст от основного источника',
    practicals: 'Практические источники в кадре — лампы, неон, витрины, создают атмосферу',
    mixed: 'Смешанные источники — разные температуры и качества, визуальное напряжение'
  },
  
  lightDirection: {
    front: 'Фронтальный свет (от камеры) — плоско, минимум теней, всё читается',
    side_front: 'Боковой-фронтальный 45° — классическое портретное освещение с объёмом',
    side: 'Боковой 90° — драматично, половина лица в тени, split lighting',
    back_side: 'Задне-боковой — контурный свет, свечение по краю силуэта',
    backlight: 'Контровой — источник за субъектом, ореол/силуэт',
    top: 'Верхний свет (полуденное солнце) — тени под глазами и носом',
    bottom: 'Нижний свет — неестественно, зловеще, horror-эффект'
  },
  
  lightQuality: {
    hard: 'Жёсткий свет — резкие края теней, высокий контраст, каждая текстура читается',
    medium: 'Средний свет — градиент в переходе свет/тень, читаемый контраст',
    soft: 'Мягкий свет — плавные переходы, wrap-around, flattering для кожи',
    diffused: 'Рассеянный свет — почти без теней, плоско, ровно'
  },
  
  timeOfDay: {
    sunrise: 'Рассвет — первые лучи, переход от холодного к тёплому, магия начала',
    morning: 'Утро — свежий чистый свет, низкое солнце, длинные тени',
    midday: 'Полдень — жёсткий верхний свет, короткие резкие тени, ощущение жара',
    afternoon: 'Дневное время — стандартный daylight, солнце под 45-60°',
    golden_hour: 'Golden hour — 1–2 часа до заката, тёплый золотой свет, длинные мягкие тени',
    sunset: 'Закат — драматичные оранжево-красные тона, очень длинные тени',
    blue_hour: 'Blue hour — сразу после заката, холодный ambient без прямого солнца',
    night: 'Ночь — только искусственные источники, контрастные пулы света'
  },
  
  weatherLighting: {
    clear: 'Ясное небо — прямое солнце, голубые отражения от неба',
    partly_cloudy: 'Переменная облачность — чередование жёсткого и мягкого света',
    overcast: 'Пасмурно — облака работают как гигантский софтбокс, ровный рассеянный свет',
    foggy: 'Туман/дымка — атмосферно, сниженный контраст, потерянная глубина',
    rainy: 'Дождь — мокрые отражающие поверхности, приглушённые цвета',
    snowy: 'Снег — падающие снежинки, белые заснеженные поверхности, холодный рассеянный свет',
    stormy: 'Гроза/шторм — драматичное тёмное небо, резкие контрасты',
    windy: 'Ветрено — движение волос и тканей, динамика',
    hazy: 'Дымка/смог — приглушённая видимость, мягкий свет',
    indoor: 'В помещении — независимо от погоды, контролируемый свет'
  },
  
  season: {
    spring: 'Весенняя атмосфера — свежая молодая зелень, цветение, мягкий чистый свет, пастельные природные тона',
    summer: 'Летняя атмосфера — яркое высокое солнце, насыщенные цвета, густая зелень, жаркая атмосфера',
    autumn: 'Осенняя атмосфера — золотая и красная листва, низкое тёплое солнце, меланхоличные тона',
    winter: 'Зимняя атмосфера — холодный голубоватый свет, минималистичный пейзаж, снег или голые деревья',
    late_autumn: 'Поздняя осень — голые деревья, серое небо, опавшая листва, холодная сырость',
    early_spring: 'Ранняя весна — тающий снег, первые ростки, переходный холодно-тёплый свет',
    any: ''
  }
};

/**
 * Собрать ОПИСАТЕЛЬНЫЙ промпт в стиле арт-директора
 * Каждый параметр описывает свой визуальный эффект
 * 
 * @param {Object} params - Параметры вселенной
 * @returns {string} - Описательный промпт
 */
function buildDescriptiveUniverseNarrative(params) {
  const sections = [];
  
  // ═══════════════════════════════════════════════════════════════
  // TECH — техническая основа съёмки
  // ═══════════════════════════════════════════════════════════════
  
  const techParts = [];
  
  // Shooting approach
  const approach = DESCRIPTIVE_EFFECTS.shootingApproach[params.shootingApproach];
  if (approach) techParts.push(approach);
  
  // Product discipline
  const discipline = DESCRIPTIVE_EFFECTS.productDiscipline[params.productDiscipline];
  if (discipline) techParts.push(', но ' + discipline.toLowerCase());
  
  // Camera
  const camera = DESCRIPTIVE_EFFECTS.cameraClass[params.cameraClass];
  if (camera) techParts.push('. ' + camera);
  
  // Shutter / motion
  const shutter = DESCRIPTIVE_EFFECTS.shutterIntent[params.shutterIntent];
  if (shutter) techParts.push('. ' + shutter);
  
  // Exposure
  const exposure = DESCRIPTIVE_EFFECTS.exposureIntent[params.exposureIntent];
  if (exposure) techParts.push('. ' + exposure);
  
  // Processing
  const processing = DESCRIPTIVE_EFFECTS.processingStyle[params.processingStyle];
  if (processing) techParts.push('. ' + processing);
  
  // Retouch
  const retouch = DESCRIPTIVE_EFFECTS.retouchLevel[params.retouchLevel];
  if (retouch) techParts.push('. ' + retouch);
  
  if (techParts.length > 0) {
    let techText = techParts.join('');
    techText = techText.replace(/\.\s*,/g, ',').replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim();
    if (techText) {
      techText = techText.charAt(0).toUpperCase() + techText.slice(1);
      sections.push(`**TECH:**\n${techText}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // ERA — культурный и временной контекст
  // ═══════════════════════════════════════════════════════════════
  
  const eraParts = [];
  
  const decade = DESCRIPTIVE_EFFECTS.decade[params.decade];
  if (decade) eraParts.push(decade);
  
  const context = DESCRIPTIVE_EFFECTS.culturalContext[params.culturalContext];
  if (context) eraParts.push('. ' + context);
  
  if (eraParts.length > 0) {
    let eraText = eraParts.join('');
    eraText = eraText.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim();
    if (eraText) {
      eraText = eraText.charAt(0).toUpperCase() + eraText.slice(1);
      sections.push(`**ERA:**\n${eraText}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // COLOR — цветовая палитра и тональность
  // ═══════════════════════════════════════════════════════════════
  
  const colorParts = [];
  
  const wb = DESCRIPTIVE_EFFECTS.whiteBalance[params.whiteBalance];
  if (wb) colorParts.push(wb);
  
  const wbShift = DESCRIPTIVE_EFFECTS.wbShift[params.wbShift];
  if (wbShift && params.wbShift !== 'neutral') colorParts.push(' ' + wbShift);
  
  const saturation = DESCRIPTIVE_EFFECTS.saturation[params.saturation];
  if (saturation) colorParts.push('. ' + saturation);
  
  const contrast = DESCRIPTIVE_EFFECTS.contrastCurve[params.contrastCurve];
  if (contrast) colorParts.push('. ' + contrast);
  
  // Shadow/highlight tones
  const shadowHex = TECHNICAL_VALUES.shadowTone[params.shadowTone];
  const highlightHex = TECHNICAL_VALUES.highlightTone[params.highlightTone];
  if (shadowHex && highlightHex) {
    colorParts.push(`. Тени уходят в ${shadowHex}, хайлайты — ${highlightHex}`);
  }
  
  if (colorParts.length > 0) {
    let colorText = colorParts.join('');
    colorText = colorText.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim();
    if (colorText) {
      colorText = colorText.charAt(0).toUpperCase() + colorText.slice(1);
      sections.push(`**COLOR:**\n${colorText}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // LENS — оптика и перспектива
  // ═══════════════════════════════════════════════════════════════
  
  const lensParts = [];
  
  const focal = DESCRIPTIVE_EFFECTS.focalRange[params.focalRange];
  if (focal) lensParts.push(focal);
  
  const proximity = DESCRIPTIVE_EFFECTS.cameraProximity[params.cameraProximity];
  if (proximity) lensParts.push('. ' + proximity);
  
  const aperture = DESCRIPTIVE_EFFECTS.apertureIntent[params.apertureIntent];
  if (aperture) lensParts.push('. ' + aperture);
  
  // Distortion policy
  const distortionMap = {
    embrace: 'Искажения используются намеренно — гнутые линии добавляют энергию',
    control: 'Искажения контролируются, но не устраняются полностью',
    correct: 'Дисторсия корректируется — чистая геометрия',
    neutral: 'Оптика подбирается под задачу без навязывания стиля'
  };
  const distortion = distortionMap[params.distortionPolicy];
  if (distortion) lensParts.push('. ' + distortion);
  
  if (lensParts.length > 0) {
    let lensText = lensParts.join('');
    lensText = lensText.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim();
    if (lensText) {
      lensText = lensText.charAt(0).toUpperCase() + lensText.slice(1);
      
      // Add strict enforcement for critical lens parameters
      const strictDirectives = [];
      
      // Ultra-wide / Fisheye - MUST show distortion
      if (params.focalRange === 'ultra_wide' || params.focalRange === 'fisheye') {
        strictDirectives.push('⚠️ FISHEYE/ULTRA-WIDE: Visible barrel distortion REQUIRED. Edges of frame MUST curve. Exaggerated perspective mandatory.');
      }
      
      // Wide open aperture - MUST show bokeh
      if (params.apertureIntent === 'wide_open') {
        strictDirectives.push('⚠️ SHALLOW DOF MANDATORY: Background MUST be completely blurred (bokeh). Only subject in focus. f/1.4-f/2.0 aesthetic REQUIRED.');
      } else if (params.apertureIntent === 'shallow') {
        strictDirectives.push('⚠️ SHALLOW DOF: Background should be soft/blurred. Subject clearly separated from environment.');
      }
      
      // Intimate proximity - MUST be very close
      if (params.cameraProximity === 'intimate') {
        strictDirectives.push('⚠️ INTIMATE DISTANCE: Camera MUST be within arm\'s reach of subject. Subject dominates frame. Personal space invaded.');
      }
      
      // Embrace distortion
      if (params.distortionPolicy === 'embrace') {
        strictDirectives.push('⚠️ DISTORTION: Lens distortion is INTENTIONAL. Lines should curve. Do NOT correct.');
      }
      
      if (strictDirectives.length > 0) {
        lensText += '\n\n' + strictDirectives.join('\n');
      }
      
      sections.push(`**LENS:**\n${lensText}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // MOOD — эмоция и энергия
  // ═══════════════════════════════════════════════════════════════
  
  const moodParts = [];
  
  const emotion = DESCRIPTIVE_EFFECTS.visualMood[params.visualMood];
  if (emotion) moodParts.push(emotion);
  
  const energy = DESCRIPTIVE_EFFECTS.energyLevel[params.energyLevel];
  if (energy) moodParts.push('. ' + energy);
  
  const spontaneity = DESCRIPTIVE_EFFECTS.spontaneity[params.spontaneity];
  if (spontaneity) moodParts.push('. ' + spontaneity);
  
  if (moodParts.length > 0) {
    let moodText = moodParts.join('');
    moodText = moodText.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim();
    if (moodText) {
      moodText = moodText.charAt(0).toUpperCase() + moodText.slice(1);
      sections.push(`**MOOD:**\n${moodText}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // LIGHTING — освещение (НЕ ЗАВИСИТ ОТ ПОЗЫ)
  // ═══════════════════════════════════════════════════════════════
  
  const lightParts = [];
  
  const lightSource = DESCRIPTIVE_EFFECTS.lightSource[params.lightSource];
  if (lightSource) lightParts.push(lightSource);
  
  const lightDir = DESCRIPTIVE_EFFECTS.lightDirection[params.lightDirection];
  if (lightDir) lightParts.push('. Направление: ' + lightDir.toLowerCase());
  
  const lightQual = DESCRIPTIVE_EFFECTS.lightQuality[params.lightQuality];
  if (lightQual) lightParts.push('. ' + lightQual);
  
  // ─────────────────────────────────────────────────────────────
  // SMART CONTEXT: Skip irrelevant params for indoor/studio
  // ─────────────────────────────────────────────────────────────
  const isIndoorDesc = params.weatherLighting === 'indoor';
  const isStudioDesc = ['studio_soft', 'studio_hard'].includes(params.lightSource);
  
  // Time of day - skip for pure studio lighting
  if (!isStudioDesc) {
    const timeDay = DESCRIPTIVE_EFFECTS.timeOfDay[params.timeOfDay];
    if (timeDay && params.timeOfDay !== params.lightSource) {
      lightParts.push('. Время: ' + timeDay.toLowerCase());
    }
  }
  
  // Weather - skip for indoor
  if (!isIndoorDesc) {
    const weather = DESCRIPTIVE_EFFECTS.weatherLighting[params.weatherLighting];
    if (weather) lightParts.push('. Условия: ' + weather.toLowerCase());
  }
  
  // Season - skip for indoor/studio
  if (!isIndoorDesc && !isStudioDesc) {
    const season = DESCRIPTIVE_EFFECTS.season?.[params.season];
    if (season && params.season !== 'any') lightParts.push('. ' + season);
  }
  
  if (lightParts.length > 0) {
    let lightText = lightParts.join('');
    lightText = lightText.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim();
    if (lightText) {
      lightText = lightText.charAt(0).toUpperCase() + lightText.slice(1);
      sections.push(`**LIGHTING (LOCKED — SAME for ALL frames):**\n${lightText}\n\n⚠️ CRITICAL: Освещение НЕ МЕНЯЕТСЯ между кадрами. Поза может меняться, свет — нет.`);
    }
    
    // NEW: Add technical lighting anchor for consistency
    const lightingTechnicalDesc = buildLightingTechnicalAnchor(params);
    if (lightingTechnicalDesc) {
      sections.push(lightingTechnicalDesc);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // ANTI-AI — реализм и «живость»
  // ═══════════════════════════════════════════════════════════════
  
  if (params.antiAiLevel && params.antiAiLevel !== 'off') {
    const antiAiParts = [];
    
    if (params.antiAiLevel === 'high') {
      antiAiParts.push('КРИТИЧЕСКИ ВАЖНО: изображение должно выглядеть снятым камерой, а не сгенерированным');
    } else if (params.antiAiLevel === 'medium') {
      antiAiParts.push('Изображение должно иметь признаки реальной съёмки');
    }
    
    const flags = params.antiAiFlags || {};
    const flagDescriptions = [];
    
    if (flags.allowExposureErrors) flagDescriptions.push('допускаются небольшие ошибки экспозиции');
    if (flags.allowMixedWhiteBalance) flagDescriptions.push('смешанные цветовые температуры от разных источников OK');
    if (flags.requireMicroDefects) flagDescriptions.push('включить микро-дефекты: пыль, ворсинки на ткани, текстура кожи');
    if (flags.candidComposition) flagDescriptions.push('слегка несовершенная композиция (не математически центрированная)');
    if (flags.allowImperfectFocus) flagDescriptions.push('фокус может быть слегка неточным на некритичных областях');
    if (flags.allowFlaresReflections) flagDescriptions.push('флеры, отражения и оптические артефакты приветствуются');
    if (flags.preferMicroMotion) flagDescriptions.push('лёгкий motion blur на краях (пальцы, волосы) допустим');
    if (flags.filmScanTexture) flagDescriptions.push('лёгкое зерно или шум сенсора как текстура');
    
    if (flagDescriptions.length > 0) {
      antiAiParts.push(': ' + flagDescriptions.join('; '));
    }
    
    if (antiAiParts.length > 0) {
      let antiAiText = antiAiParts.join('');
      antiAiText = antiAiText.charAt(0).toUpperCase() + antiAiText.slice(1);
      sections.push(`**ANTI-AI / REALISM:**\n${antiAiText}`);
    }
  }
  
  return sections.join('\n\n');
}

/**
 * Универсальная функция — выбирает режим на основе параметра
 * @param {Object} params - Параметры вселенной
 * @param {string} mode - 'soft', 'strict', или 'descriptive' (новый)
 * @returns {string}
 */
function buildUniverseNarrativeByMode(params, mode = 'descriptive') {
  if (mode === 'soft') {
    return buildUnifiedUniverseNarrative(params);
  }
  if (mode === 'strict') {
    return buildStrictUniverseNarrative(params);
  }
  // Default: descriptive (новый)
  return buildDescriptiveUniverseNarrative(params);
}

/**
 * Пример: параметры по умолчанию
 */
function getDefaultParams() {
  return {
    // Approach
    shootingApproach: 'friend_casual',
    productDiscipline: 'product_primary',
    
    // Tech
    cameraClass: 'high_dr_professional',
    exposureIntent: 'underexposed_slight',
    shutterIntent: 'freeze_all',
    processingStyle: 'punchy_contrasty',
    retouchLevel: 'minimal',
    
    // Era
    decade: 'contemporary',
    culturalContext: 'ad_campaign',
    
    // Color
    whiteBalance: 'cool_daylight',
    wbShift: 'teal',
    saturation: 'punchy_high',
    contrastCurve: 's_curve_moderate',
    shadowTone: 'cool_teal',
    highlightTone: 'clean',
    
    // Lens
    focalRange: 'wide',
    apertureIntent: 'closed',
    distortionPolicy: 'control',
    cameraProximity: 'close',
    
    // Mood
    visualMood: 'playful_summer',
    energyLevel: 'high',
    spontaneity: 'semi_candid',
    primaryFocus: 'product',
    
    // Lighting (НЕ ЗАВИСИТ ОТ ПОЗЫ)
    lightSource: 'golden_hour',
    lightDirection: 'side_front',
    lightQuality: 'medium',
    timeOfDay: 'golden_hour',
    weatherLighting: 'clear',
    season: 'summer',
    
    // Anti-AI
    antiAiLevel: 'medium',
    antiAiFlags: {
      allowExposureErrors: true,
      allowMixedWhiteBalance: true,
      requireMicroDefects: true,
      candidComposition: true,
      allowImperfectFocus: true,
      allowFlaresReflections: true,
      preferMicroMotion: true,
      filmScanTexture: true
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// ЭКСПОРТ
// ═══════════════════════════════════════════════════════════════

export {
  buildTechNarrative,
  buildEraNarrative,
  buildColorNarrative,
  buildLensNarrative,
  buildMoodNarrative,
  buildLightingNarrative,           // Освещение (НЕ зависит от позы)
  buildAntiAiNarrative,
  buildUniverseNarrative,
  buildUniverseText,
  buildUniverseForPrompt,
  buildUnifiedUniverseNarrative,    // Soft mode (старый нарративный стиль)
  buildStrictUniverseNarrative,     // Strict mode (директивный стиль с bullet-points)
  buildDescriptiveUniverseNarrative, // Descriptive mode (новый описательный стиль)
  buildUniverseNarrativeByMode,     // Универсальная функция с выбором режима
  getDefaultParams,
  DESCRIPTIVE_EFFECTS               // Экспорт описаний для UI preview
};

