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
  getDefaultParams
};

