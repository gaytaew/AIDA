/**
 * Universe Narrative Builder
 * 
 * Собирает параметры вселенной в связный текст на естественном языке.
 * Каждый блок формирует свой абзац, который читается как описание от арт-директора.
 */

import { UNIVERSE_PARAMS, ANTIAI_FLAGS } from './universeParams.js';

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
  const emotion = getNarrative('mood', 'emotionalVector', params.emotionalVector);
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
  
  // 6. Anti-AI / Реализм
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
  
  sections.push(`VISUAL ANCHORS (apply to every frame):
${anchors.map(a => `• ${a}`).join('\n')}`);
  
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

/**
 * Универсальная функция — выбирает режим на основе параметра
 * @param {Object} params - Параметры вселенной
 * @param {string} mode - 'soft' (старый нарративный) или 'strict' (новый директивный)
 * @returns {string}
 */
function buildUniverseNarrativeByMode(params, mode = 'strict') {
  if (mode === 'soft') {
    return buildUnifiedUniverseNarrative(params);
  }
  return buildStrictUniverseNarrative(params);
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
    emotionalVector: 'playful_summer',
    energyLevel: 'high',
    spontaneity: 'semi_candid',
    primaryFocus: 'product',
    
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
  buildAntiAiNarrative,
  buildUniverseNarrative,
  buildUniverseText,
  buildUniverseForPrompt,
  buildUnifiedUniverseNarrative,  // Soft mode (старый нарративный стиль)
  buildStrictUniverseNarrative,   // Strict mode (новый директивный стиль)
  buildUniverseNarrativeByMode,   // Универсальная функция с выбором режима
  getDefaultParams
};

