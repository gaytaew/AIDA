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
  
  // Emotional vector
  emotionalVector: {
    playful_summer: 'Playful summer energy — light, fun, carefree',
    moody_introspective: 'Moody introspective — contemplative, quiet intensity',
    confident_powerful: 'Confident powerful — strong, commanding, bold',
    vulnerable_intimate: 'Vulnerable intimate — raw, exposed, tender',
    rebellious_edgy: 'Rebellious edgy — anti-establishment, attitude, tension',
    serene_calm: 'Serene calm — peaceful, balanced, zen',
    glamorous_luxe: 'Glamorous luxury — opulent, aspirational, refined',
    raw_authentic: 'Raw authentic — unpolished, real, documentary feel'
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
    indoor: 'Indoor — weather independent, controlled'
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
  
  // Time of day
  const timeDay = TECHNICAL_VALUES.timeOfDay[params.timeOfDay];
  if (timeDay) lightingParams.push(`Time: ${timeDay}`);
  
  // Weather
  const weather = TECHNICAL_VALUES.weatherLighting[params.weatherLighting];
  if (weather) lightingParams.push(`Weather: ${weather}`);
  
  if (lightingParams.length > 0) {
    sections.push(`LIGHTING (LOCKED — SAME for ALL frames, independent of pose):
${lightingParams.map(l => `• ${l}`).join('\n')}

⚠️ CRITICAL: Lighting MUST remain consistent across ALL frames.
The pose/framing may change, but light source, direction, quality, and time of day MUST NOT change.`);
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
  const emotionVec = TECHNICAL_VALUES.emotionalVector[params.emotionalVector] || '';
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
    
    // Lighting (НЕ ЗАВИСИТ ОТ ПОЗЫ)
    lightSource: 'golden_hour',
    lightDirection: 'side_front',
    lightQuality: 'medium',
    timeOfDay: 'golden_hour',
    weatherLighting: 'clear',
    
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

