/**
 * Visual Anchors System
 * 
 * Числовые якори для обеспечения консистентности визуального стиля.
 * Работает ПОВЕРХ описательной системы (universeNarrativeBuilder).
 * 
 * Нарратив даёт AI КОНТЕКСТ и ПОНИМАНИЕ.
 * Anchors дают AI ТОЧНЫЕ ИЗМЕРИМЫЕ ЦЕЛИ.
 * 
 * Структура:
 * - COLOR_ANCHORS: hex-цвета теней/хайлайтов, температура, насыщенность
 * - LIGHTING_ANCHORS: контраст-ратио, жёсткость теней, направление
 * - LENS_ANCHORS: DOF, дисторсия
 */

// ═══════════════════════════════════════════════════════════════
// COLOR ANCHORS — цветовые якори
// ═══════════════════════════════════════════════════════════════

/**
 * Маппинг параметров whiteBalance на числовые значения
 */
const WHITE_BALANCE_ANCHORS = {
  warm_tungsten: {
    kelvin: 3200,
    tolerance: 200,
    description: 'Tungsten / candlelight warm',
    tint: 'neutral to slight magenta'
  },
  warm_golden: {
    kelvin: 4500,
    tolerance: 300,
    description: 'Golden hour warmth',
    tint: 'neutral'
  },
  neutral: {
    kelvin: 5500,
    tolerance: 300,
    description: 'Daylight neutral',
    tint: 'neutral'
  },
  cool_daylight: {
    kelvin: 6500,
    tolerance: 400,
    description: 'Cool daylight / overcast',
    tint: 'neutral to slight blue'
  },
  mixed: {
    kelvin: null,
    tolerance: null,
    description: 'Mixed sources — varies by light',
    tint: 'varies'
  }
};

/**
 * Маппинг shadowTone на hex-цвета
 */
const SHADOW_TONE_ANCHORS = {
  neutral: {
    hex: '#404040',
    rgb: '64, 64, 64',
    description: 'Neutral gray shadows'
  },
  cool_teal: {
    hex: '#3A5F6F',
    rgb: '58, 95, 111',
    description: 'Cool teal/cyan shadows'
  },
  warm: {
    hex: '#5C4033',
    rgb: '92, 64, 51',
    description: 'Warm brown shadows'
  },
  purple: {
    hex: '#4A3A5C',
    rgb: '74, 58, 92',
    description: 'Purple/violet shadows'
  }
};

/**
 * Маппинг highlightTone на hex-цвета
 */
const HIGHLIGHT_TONE_ANCHORS = {
  clean: {
    hex: '#FAFAFA',
    rgb: '250, 250, 250',
    description: 'Clean neutral white'
  },
  creamy: {
    hex: '#FFF5E6',
    rgb: '255, 245, 230',
    description: 'Warm creamy highlights'
  },
  cool: {
    hex: '#E6F0FF',
    rgb: '230, 240, 255',
    description: 'Cool blue highlights'
  },
  clipped_artistic: {
    hex: '#FFFFFF',
    rgb: '255, 255, 255',
    description: 'Intentionally clipped (pure white allowed)'
  }
};

/**
 * Маппинг saturation на процентные значения
 */
const SATURATION_ANCHORS = {
  desaturated: {
    percent: -30,
    description: 'Heavily muted, almost B&W'
  },
  muted: {
    percent: -15,
    description: 'Subtle, pastel tones'
  },
  natural: {
    percent: 0,
    description: 'As-shot, neutral'
  },
  punchy_high: {
    percent: 20,
    description: 'Vibrant, punchy colors'
  },
  selective: {
    percent: null,
    description: 'One color vibrant, others muted'
  }
};

/**
 * Маппинг contrastCurve на технические значения
 */
const CONTRAST_ANCHORS = {
  flat_lifted: {
    ratio: '1.5:1',
    blackPoint: 20,
    whitePoint: 235,
    description: 'Flat/Log — lifted shadows, minimal contrast'
  },
  linear: {
    ratio: '2:1',
    blackPoint: 0,
    whitePoint: 255,
    description: 'Linear — no curve adjustment'
  },
  s_curve_moderate: {
    ratio: '3:1',
    blackPoint: 10,
    whitePoint: 245,
    description: 'Moderate S-curve — balanced contrast'
  },
  s_curve_high: {
    ratio: '4:1',
    blackPoint: 5,
    whitePoint: 250,
    description: 'Heavy S-curve — punchy, deep shadows'
  },
  crushed_blacks: {
    ratio: '5:1+',
    blackPoint: 0,
    whitePoint: 255,
    description: 'Crushed blacks — shadows blocked'
  }
};

// ═══════════════════════════════════════════════════════════════
// LIGHTING ANCHORS — якори освещения
// ═══════════════════════════════════════════════════════════════

/**
 * Маппинг lightQuality на метрики
 */
const LIGHT_QUALITY_ANCHORS = {
  hard: {
    shadowEdge: '<5%',
    transitionWidth: 'razor sharp',
    contrastRatio: '4:1 to 6:1',
    description: 'Hard light — sharp shadow edges'
  },
  medium: {
    shadowEdge: '5-15%',
    transitionWidth: 'gradual',
    contrastRatio: '3:1',
    description: 'Medium light — moderate transition'
  },
  soft: {
    shadowEdge: '15-25%',
    transitionWidth: 'smooth gradient',
    contrastRatio: '2:1',
    description: 'Soft light — wrap-around'
  },
  diffused: {
    shadowEdge: '>25%',
    transitionWidth: 'almost invisible',
    contrastRatio: '1.5:1',
    description: 'Diffused — nearly shadowless'
  }
};

/**
 * Маппинг lightDirection на углы
 */
const LIGHT_DIRECTION_ANCHORS = {
  front: {
    angle: '0°',
    position: 'from camera axis',
    description: 'Flat frontal lighting'
  },
  side_front: {
    angle: '45°',
    position: 'camera-left or camera-right',
    description: 'Classic portrait lighting'
  },
  side: {
    angle: '90°',
    position: 'perpendicular to camera',
    description: 'Split lighting — half face in shadow'
  },
  back_side: {
    angle: '135°',
    position: 'behind-side',
    description: 'Rim/edge light emphasis'
  },
  backlight: {
    angle: '180°',
    position: 'behind subject',
    description: 'Silhouette / halo effect'
  },
  top: {
    angle: '90° overhead',
    position: 'directly above',
    description: 'Noon sun — shadows under features'
  },
  bottom: {
    angle: '90° below',
    position: 'from below',
    description: 'Unnatural, dramatic'
  }
};

/**
 * Маппинг lightSource на температуру и характер
 */
const LIGHT_SOURCE_ANCHORS = {
  direct_sun: {
    kelvin: 5500,
    quality: 'hard',
    direction: 'depends on time',
    description: 'Direct sunlight — high contrast'
  },
  golden_hour: {
    kelvin: 3500,
    kelvinRange: '3200-4500',
    quality: 'medium-soft',
    direction: 'low angle, side',
    description: 'Warm low sun — long soft shadows'
  },
  blue_hour: {
    kelvin: 7500,
    kelvinRange: '7000-9000',
    quality: 'soft',
    direction: 'ambient/diffused',
    description: 'Cool post-sunset ambient'
  },
  overcast: {
    kelvin: 6500,
    quality: 'diffused',
    direction: 'top-down with slight angle',
    description: 'Giant softbox — even lighting'
  },
  studio_soft: {
    kelvin: 5500,
    quality: 'soft',
    direction: 'controlled',
    description: 'Softbox/octabox — clean soft light'
  },
  studio_hard: {
    kelvin: 5500,
    quality: 'hard',
    direction: 'controlled',
    description: 'Bare strobe/fresnel — sharp shadows'
  },
  window_light: {
    kelvin: 5500,
    kelvinRange: '5000-6500',
    quality: 'medium-soft',
    direction: '60-90° from camera',
    description: 'Natural window — gradual falloff'
  },
  practicals: {
    kelvin: 2700,
    kelvinRange: '2700-3200',
    quality: 'varies',
    direction: 'from visible sources',
    description: 'Lamps, neon in frame'
  },
  flash_fill: {
    kelvin: 5500,
    quality: 'depends on modifier',
    direction: 'from camera or off-axis',
    description: 'Fill flash to reduce shadows'
  },
  mixed: {
    kelvin: null,
    quality: 'varies',
    direction: 'multiple',
    description: 'Multiple temperatures and qualities'
  }
};

// ═══════════════════════════════════════════════════════════════
// LENS / OPTICS ANCHORS
// ═══════════════════════════════════════════════════════════════

/**
 * Маппинг apertureIntent на DOF метрики
 */
const APERTURE_ANCHORS = {
  wide_open: {
    fStop: 'f/1.4-f/2.0',
    dofDescription: 'Extreme shallow — only one plane sharp',
    bokeh: 'Heavy, creamy bokeh',
    backgroundBlur: '90-100% blurred'
  },
  moderate: {
    fStop: 'f/2.8-f/4',
    dofDescription: 'Moderate shallow — subject sharp, background soft',
    bokeh: 'Visible bokeh',
    backgroundBlur: '60-80% blurred'
  },
  closed: {
    fStop: 'f/5.6-f/8',
    dofDescription: 'Balanced — subject and near context sharp',
    bokeh: 'Subtle background softness',
    backgroundBlur: '20-40% blurred'
  },
  deep: {
    fStop: 'f/11-f/16',
    dofDescription: 'Deep — everything sharp front to back',
    bokeh: 'No bokeh',
    backgroundBlur: '0-10% blurred'
  }
};

/**
 * Маппинг focalRange на перспективу
 */
const FOCAL_RANGE_ANCHORS = {
  fisheye: {
    mm: '8-16mm',
    perspective: 'Extreme barrel distortion',
    distortion: 'Heavy — lines curve dramatically',
    compression: 'None — exaggerated depth'
  },
  ultrawide: {
    mm: '12-24mm',
    perspective: 'Aggressive wide',
    distortion: 'Visible barrel distortion',
    compression: 'Minimal'
  },
  wide: {
    mm: '24-35mm',
    perspective: 'Wide environmental',
    distortion: 'Slight barrel possible',
    compression: 'Low'
  },
  standard: {
    mm: '40-60mm',
    perspective: 'Natural, like human eye',
    distortion: 'None',
    compression: 'Neutral'
  },
  portrait: {
    mm: '85-105mm',
    perspective: 'Flattering compression',
    distortion: 'None',
    compression: 'Moderate — pleasing proportions'
  },
  telephoto: {
    mm: '135-200mm',
    perspective: 'Compressed, voyeuristic',
    distortion: 'None',
    compression: 'Strong — background appears closer'
  },
  super_telephoto: {
    mm: '300mm+',
    perspective: 'Extreme compression',
    distortion: 'None',
    compression: 'Maximum — flat perspective'
  }
};

// ═══════════════════════════════════════════════════════════════
// SKIN TONE ANCHORS — целевые тона кожи
// ═══════════════════════════════════════════════════════════════

/**
 * Базовые тона кожи по температуре
 * Это референсные midtone значения
 */
const SKIN_MIDTONE_ANCHORS = {
  warm_golden: {
    hex: '#D4A574',
    rgb: '212, 165, 116',
    description: 'Golden tan — warm light'
  },
  neutral: {
    hex: '#C9A080',
    rgb: '201, 160, 128',
    description: 'Neutral skin tone'
  },
  cool: {
    hex: '#BFA090',
    rgb: '191, 160, 144',
    description: 'Cool/pale skin tone'
  },
  deep_warm: {
    hex: '#8B6B4A',
    rgb: '139, 107, 74',
    description: 'Deep warm skin tone'
  }
};

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTION: Build Visual Anchors from params
// ═══════════════════════════════════════════════════════════════

/**
 * Собрать все Visual Anchors из параметров вселенной
 * @param {Object} params - Параметры вселенной
 * @returns {Object} - Объект с anchors для каждой категории
 */
export function buildVisualAnchors(params) {
  const anchors = {
    color: {},
    lighting: {},
    lens: {},
    skin: {}
  };
  
  // ─────────────────────────────────────────────────────────────
  // COLOR ANCHORS
  // ─────────────────────────────────────────────────────────────
  
  // White Balance
  if (params.whiteBalance && WHITE_BALANCE_ANCHORS[params.whiteBalance]) {
    const wb = WHITE_BALANCE_ANCHORS[params.whiteBalance];
    anchors.color.temperature = {
      kelvin: wb.kelvin,
      tolerance: wb.tolerance,
      description: wb.description
    };
  }
  
  // Shadow Tone
  if (params.shadowTone && SHADOW_TONE_ANCHORS[params.shadowTone]) {
    anchors.color.shadows = SHADOW_TONE_ANCHORS[params.shadowTone];
  }
  
  // Highlight Tone
  if (params.highlightTone && HIGHLIGHT_TONE_ANCHORS[params.highlightTone]) {
    anchors.color.highlights = HIGHLIGHT_TONE_ANCHORS[params.highlightTone];
  }
  
  // Saturation
  if (params.saturation && SATURATION_ANCHORS[params.saturation]) {
    anchors.color.saturation = SATURATION_ANCHORS[params.saturation];
  }
  
  // Contrast
  if (params.contrastCurve && CONTRAST_ANCHORS[params.contrastCurve]) {
    anchors.color.contrast = CONTRAST_ANCHORS[params.contrastCurve];
  }
  
  // ─────────────────────────────────────────────────────────────
  // LIGHTING ANCHORS
  // ─────────────────────────────────────────────────────────────
  
  // Light Source
  if (params.lightSource && LIGHT_SOURCE_ANCHORS[params.lightSource]) {
    anchors.lighting.source = LIGHT_SOURCE_ANCHORS[params.lightSource];
  }
  
  // Light Quality
  if (params.lightQuality && LIGHT_QUALITY_ANCHORS[params.lightQuality]) {
    anchors.lighting.quality = LIGHT_QUALITY_ANCHORS[params.lightQuality];
  }
  
  // Light Direction
  if (params.lightDirection && LIGHT_DIRECTION_ANCHORS[params.lightDirection]) {
    anchors.lighting.direction = LIGHT_DIRECTION_ANCHORS[params.lightDirection];
  }
  
  // ─────────────────────────────────────────────────────────────
  // LENS ANCHORS
  // ─────────────────────────────────────────────────────────────
  
  // Aperture / DOF
  if (params.apertureIntent && APERTURE_ANCHORS[params.apertureIntent]) {
    anchors.lens.aperture = APERTURE_ANCHORS[params.apertureIntent];
  }
  
  // Focal Range
  if (params.focalRange && FOCAL_RANGE_ANCHORS[params.focalRange]) {
    anchors.lens.focal = FOCAL_RANGE_ANCHORS[params.focalRange];
  }
  
  // ─────────────────────────────────────────────────────────────
  // SKIN ANCHORS (derived from white balance)
  // ─────────────────────────────────────────────────────────────
  
  // Choose skin tone based on white balance
  if (params.whiteBalance) {
    if (params.whiteBalance === 'warm_tungsten' || params.whiteBalance === 'warm_golden') {
      anchors.skin = SKIN_MIDTONE_ANCHORS.warm_golden;
    } else if (params.whiteBalance === 'cool_daylight') {
      anchors.skin = SKIN_MIDTONE_ANCHORS.cool;
    } else {
      anchors.skin = SKIN_MIDTONE_ANCHORS.neutral;
    }
  }
  
  return anchors;
}

/**
 * Сформировать промпт-блок с Visual Anchors
 * @param {Object} params - Параметры вселенной
 * @returns {string} - Текст для добавления в промпт
 */
export function buildVisualAnchorsPrompt(params) {
  const anchors = buildVisualAnchors(params);
  
  const sections = [];
  
  sections.push(`
═══════════════════════════════════════════════════════════════
VISUAL CONSISTENCY ANCHORS (MUST MATCH IN EVERY FRAME)
═══════════════════════════════════════════════════════════════
These are EXACT values that MUST remain consistent across all frames.
Do NOT deviate from these specifications.`);
  
  // ─────────────────────────────────────────────────────────────
  // COLOR SECTION
  // ─────────────────────────────────────────────────────────────
  
  const colorLines = [];
  
  if (anchors.color.temperature?.kelvin) {
    colorLines.push(`• Color temperature: ${anchors.color.temperature.kelvin}K (±${anchors.color.temperature.tolerance}K)`);
  }
  
  if (anchors.color.shadows?.hex) {
    colorLines.push(`• Shadow color: ${anchors.color.shadows.hex} (${anchors.color.shadows.description})`);
  }
  
  if (anchors.color.highlights?.hex) {
    colorLines.push(`• Highlight color: ${anchors.color.highlights.hex} (${anchors.color.highlights.description})`);
  }
  
  if (anchors.color.saturation?.percent !== undefined && anchors.color.saturation?.percent !== null) {
    const sign = anchors.color.saturation.percent >= 0 ? '+' : '';
    colorLines.push(`• Saturation: ${sign}${anchors.color.saturation.percent}% from neutral`);
  }
  
  if (anchors.color.contrast?.ratio) {
    colorLines.push(`• Contrast ratio: ${anchors.color.contrast.ratio}`);
    if (anchors.color.contrast.blackPoint !== undefined) {
      colorLines.push(`• Black point: RGB ${anchors.color.contrast.blackPoint}, White point: RGB ${anchors.color.contrast.whitePoint}`);
    }
  }
  
  if (colorLines.length > 0) {
    sections.push(`
┌─── COLOR ANCHORS ───────────────────────────────────────────┐
${colorLines.join('\n')}
└─────────────────────────────────────────────────────────────┘`);
  }
  
  // ─────────────────────────────────────────────────────────────
  // LIGHTING SECTION
  // ─────────────────────────────────────────────────────────────
  
  const lightLines = [];
  
  if (anchors.lighting.source) {
    if (anchors.lighting.source.kelvin) {
      lightLines.push(`• Light source temperature: ${anchors.lighting.source.kelvinRange || anchors.lighting.source.kelvin + 'K'}`);
    }
    lightLines.push(`• Light character: ${anchors.lighting.source.description}`);
  }
  
  if (anchors.lighting.quality) {
    lightLines.push(`• Shadow edge sharpness: ${anchors.lighting.quality.shadowEdge} of face width`);
    lightLines.push(`• Lit-to-shadow contrast: ${anchors.lighting.quality.contrastRatio}`);
  }
  
  if (anchors.lighting.direction) {
    lightLines.push(`• Light direction: ${anchors.lighting.direction.angle} ${anchors.lighting.direction.position}`);
  }
  
  if (lightLines.length > 0) {
    sections.push(`
┌─── LIGHTING ANCHORS (LOCKED — same for ALL frames) ─────────┐
${lightLines.join('\n')}
│                                                             │
│ ⚠️ Light direction and quality MUST NOT change between      │
│    frames regardless of pose or framing changes.            │
└─────────────────────────────────────────────────────────────┘`);
  }
  
  // ─────────────────────────────────────────────────────────────
  // LENS SECTION
  // ─────────────────────────────────────────────────────────────
  
  const lensLines = [];
  
  if (anchors.lens.focal) {
    lensLines.push(`• Focal length: ${anchors.lens.focal.mm}`);
    lensLines.push(`• Perspective: ${anchors.lens.focal.perspective}`);
    if (anchors.lens.focal.distortion !== 'None') {
      lensLines.push(`• Distortion: ${anchors.lens.focal.distortion}`);
    }
  }
  
  if (anchors.lens.aperture) {
    lensLines.push(`• Aperture: ${anchors.lens.aperture.fStop}`);
    lensLines.push(`• DOF: ${anchors.lens.aperture.dofDescription}`);
    lensLines.push(`• Background blur: ${anchors.lens.aperture.backgroundBlur}`);
  }
  
  if (lensLines.length > 0) {
    sections.push(`
┌─── LENS/OPTICS ANCHORS ─────────────────────────────────────┐
${lensLines.join('\n')}
└─────────────────────────────────────────────────────────────┘`);
  }
  
  // ─────────────────────────────────────────────────────────────
  // SKIN SECTION
  // ─────────────────────────────────────────────────────────────
  
  if (anchors.skin?.hex) {
    sections.push(`
┌─── SKIN TONE ANCHOR ────────────────────────────────────────┐
• Skin midtone target: ${anchors.skin.hex} (${anchors.skin.description})
│                                                             │
│ Skin tones MUST be consistent across all frames.            │
└─────────────────────────────────────────────────────────────┘`);
  }
  
  return sections.join('\n');
}

/**
 * Получить anchors для отображения в UI
 * @param {Object} params - Параметры вселенной
 * @returns {Object} - Структура для рендеринга в UI
 */
export function getAnchorsForUI(params) {
  const anchors = buildVisualAnchors(params);
  
  const uiAnchors = [];
  
  // Color Temperature
  if (anchors.color.temperature?.kelvin) {
    uiAnchors.push({
      category: 'color',
      icon: '🌡️',
      label: 'Температура',
      value: `${anchors.color.temperature.kelvin}K`,
      tolerance: `±${anchors.color.temperature.tolerance}K`,
      description: anchors.color.temperature.description
    });
  }
  
  // Shadow Color
  if (anchors.color.shadows?.hex) {
    uiAnchors.push({
      category: 'color',
      icon: '🌑',
      label: 'Тени',
      value: anchors.color.shadows.hex,
      colorPreview: anchors.color.shadows.hex,
      description: anchors.color.shadows.description
    });
  }
  
  // Highlight Color
  if (anchors.color.highlights?.hex) {
    uiAnchors.push({
      category: 'color',
      icon: '☀️',
      label: 'Хайлайты',
      value: anchors.color.highlights.hex,
      colorPreview: anchors.color.highlights.hex,
      description: anchors.color.highlights.description
    });
  }
  
  // Contrast
  if (anchors.color.contrast?.ratio) {
    uiAnchors.push({
      category: 'color',
      icon: '📊',
      label: 'Контраст',
      value: anchors.color.contrast.ratio,
      description: anchors.color.contrast.description
    });
  }
  
  // Saturation
  if (anchors.color.saturation?.percent !== undefined && anchors.color.saturation?.percent !== null) {
    const sign = anchors.color.saturation.percent >= 0 ? '+' : '';
    uiAnchors.push({
      category: 'color',
      icon: '🎨',
      label: 'Насыщенность',
      value: `${sign}${anchors.color.saturation.percent}%`,
      description: anchors.color.saturation.description
    });
  }
  
  // Light Quality
  if (anchors.lighting.quality) {
    uiAnchors.push({
      category: 'lighting',
      icon: '💡',
      label: 'Жёсткость света',
      value: anchors.lighting.quality.shadowEdge,
      description: `Контраст ${anchors.lighting.quality.contrastRatio}`
    });
  }
  
  // Light Direction
  if (anchors.lighting.direction) {
    uiAnchors.push({
      category: 'lighting',
      icon: '➡️',
      label: 'Направление',
      value: anchors.lighting.direction.angle,
      description: anchors.lighting.direction.description
    });
  }
  
  // Aperture
  if (anchors.lens.aperture) {
    uiAnchors.push({
      category: 'lens',
      icon: '📷',
      label: 'Диафрагма',
      value: anchors.lens.aperture.fStop,
      description: anchors.lens.aperture.dofDescription
    });
  }
  
  // Focal
  if (anchors.lens.focal) {
    uiAnchors.push({
      category: 'lens',
      icon: '🔭',
      label: 'Фокусное',
      value: anchors.lens.focal.mm,
      description: anchors.lens.focal.perspective
    });
  }
  
  // Skin
  if (anchors.skin?.hex) {
    uiAnchors.push({
      category: 'skin',
      icon: '👤',
      label: 'Тон кожи',
      value: anchors.skin.hex,
      colorPreview: anchors.skin.hex,
      description: anchors.skin.description
    });
  }
  
  return uiAnchors;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
  WHITE_BALANCE_ANCHORS,
  SHADOW_TONE_ANCHORS,
  HIGHLIGHT_TONE_ANCHORS,
  SATURATION_ANCHORS,
  CONTRAST_ANCHORS,
  LIGHT_QUALITY_ANCHORS,
  LIGHT_DIRECTION_ANCHORS,
  LIGHT_SOURCE_ANCHORS,
  APERTURE_ANCHORS,
  FOCAL_RANGE_ANCHORS,
  SKIN_MIDTONE_ANCHORS
};

export default {
  buildVisualAnchors,
  buildVisualAnchorsPrompt,
  getAnchorsForUI
};
