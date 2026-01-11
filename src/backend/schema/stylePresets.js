/**
 * Style Presets for Custom Shoot Module
 * 
 * Quick-select presets for Light, Color, and Era.
 * Each preset contains a prompt snippet and related parameter values.
 */

// ═══════════════════════════════════════════════════════════════
// LIGHT PRESETS
// ═══════════════════════════════════════════════════════════════

export const LIGHT_PRESETS = {
  natural_soft: {
    id: 'natural_soft',
    label: 'Мягкий естественный',
    description: 'Рассеянный дневной свет, мягкие тени, естественные цвета',
    prompt: 'Soft diffused natural daylight, gentle shadows with soft falloff, no harsh contrasts, even illumination across the frame, outdoor overcast or large window light quality',
    params: {
      primaryLightType: 'natural',
      flashCharacter: 'soft',
      ambientLightType: 'daylight',
      shadowBehavior: 'soft_falloff',
      highlightBehavior: 'roll_off',
      exposureBias: 0,
      lightImperfections: ['none']
    }
  },
  
  natural_harsh: {
    id: 'natural_harsh',
    label: 'Жёсткий естественный',
    description: 'Прямое солнце, резкие тени, высокий контраст',
    prompt: 'Direct harsh sunlight, strong defined shadows with hard edges, high contrast between lit and shadow areas, midday sun quality, dramatic light and shadow patterns on face',
    params: {
      primaryLightType: 'natural',
      flashCharacter: 'harsh',
      ambientLightType: 'daylight',
      shadowBehavior: 'hard_edges',
      highlightBehavior: 'clipped_allowed',
      exposureBias: -0.3,
      lightImperfections: ['none']
    }
  },
  
  golden_hour: {
    id: 'golden_hour',
    label: 'Золотой час',
    description: 'Тёплый контровой свет, блики, длинные тени',
    prompt: 'Golden hour warm backlight, sun low on horizon, lens flare touching frame edges, long dramatic shadows, warm color temperature 3200K feel, rim light on hair and shoulders, magical romantic atmosphere',
    params: {
      primaryLightType: 'natural',
      flashCharacter: 'soft',
      ambientLightType: 'daylight',
      shadowBehavior: 'soft_falloff',
      highlightBehavior: 'halation',
      exposureBias: 0.3,
      lightImperfections: ['flare_ghosts', 'reflections']
    }
  },
  
  studio_strobe: {
    id: 'studio_strobe',
    label: 'Студийный свет',
    description: 'Контролируемый импульсный свет, нейтральный баланс',
    prompt: 'Professional studio strobe lighting, controlled and even illumination, soft shadows from modifier, clean neutral color temperature, fashion studio quality, subtle fill light',
    params: {
      primaryLightType: 'strobe',
      flashCharacter: 'slightly_diffused',
      ambientLightType: 'none',
      shadowBehavior: 'soft_falloff',
      highlightBehavior: 'roll_off',
      exposureBias: 0,
      lightImperfections: ['none']
    }
  },
  
  on_camera_harsh: {
    id: 'on_camera_harsh',
    label: 'Жёсткая вспышка',
    description: 'Накамерная вспышка, жёсткие тени, пересветы',
    prompt: 'Harsh on-camera direct flash, strong shadows behind subject, hot spots on skin, background falloff to darkness, red-eye tendency, snapshot aesthetic, 2000s party photo energy',
    params: {
      primaryLightType: 'on_camera_flash',
      flashCharacter: 'harsh',
      ambientLightType: 'none',
      shadowBehavior: 'hard_edges',
      highlightBehavior: 'clipped_allowed',
      exposureBias: 0.3,
      lightImperfections: ['reflections']
    }
  },
  
  mixed_ambient: {
    id: 'mixed_ambient',
    label: 'Смешанный свет',
    description: 'Разные источники света, цветовое загрязнение',
    prompt: 'Mixed ambient light sources, sodium street lights mixing with tungsten interiors, color temperature contamination, green-magenta shifts, urban nightlife quality, imperfect white balance deliberately visible',
    params: {
      primaryLightType: 'mixed',
      flashCharacter: 'soft',
      ambientLightType: 'mixed',
      shadowBehavior: 'mixed',
      highlightBehavior: 'roll_off',
      exposureBias: 0,
      lightImperfections: ['uneven_falloff', 'reflections']
    }
  },
  
  ring_flash: {
    id: 'ring_flash',
    label: 'Кольцевая вспышка',
    description: 'Плоское освещение без теней, характерные блики в глазах',
    prompt: 'Ring flash on-axis lighting, virtually no shadows, flat even illumination, characteristic circular catchlight in eyes, slight red-eye reduction, fashion beauty aesthetic, slight ghosting around edges',
    params: {
      primaryLightType: 'on_camera_flash',
      flashCharacter: 'direct',
      ambientLightType: 'none',
      shadowBehavior: 'soft_falloff',
      highlightBehavior: 'roll_off',
      exposureBias: 0,
      lightImperfections: ['reflections']
    }
  },
  
  window_light: {
    id: 'window_light',
    label: 'Свет из окна',
    description: 'Мягкий направленный свет, одна сторона освещена',
    prompt: 'Soft directional window light from one side, Rembrandt lighting triangle on shadow side of face, gentle gradient falloff, interior daytime quality, natural and flattering, some shadows going deep',
    params: {
      primaryLightType: 'natural',
      flashCharacter: 'soft',
      ambientLightType: 'daylight',
      shadowBehavior: 'soft_falloff',
      highlightBehavior: 'roll_off',
      exposureBias: 0,
      lightImperfections: ['uneven_falloff']
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// COLOR PRESETS
// ═══════════════════════════════════════════════════════════════

export const COLOR_PRESETS = {
  film_warm: {
    id: 'film_warm',
    label: 'Тёплая плёнка',
    description: 'Portra-like тёплые тона, натуральная кожа',
    prompt: 'Warm film color science like Kodak Portra 400, slightly elevated shadows with warm tones, natural skin rendering with subtle warmth, creamy highlights, fine organic grain, analog color response',
    params: {
      baseColorCast: 'warm',
      dominantPalette: 'natural',
      skinToneRendering: 'natural',
      whiteBalanceBehavior: 'imperfect',
      colorNoise: 'film_like'
    }
  },
  
  film_cool: {
    id: 'film_cool',
    label: 'Холодная плёнка',
    description: 'Приглушённая палитра, холодные тона',
    prompt: 'Cool desaturated film tones, blue-green shadow bias, muted overall palette, skin tones slightly cooled, overcast day color feeling, European fashion magazine aesthetic',
    params: {
      baseColorCast: 'cool',
      dominantPalette: 'desaturated',
      skinToneRendering: 'slightly_muted',
      whiteBalanceBehavior: 'imperfect',
      colorNoise: 'subtle'
    }
  },
  
  high_contrast: {
    id: 'high_contrast',
    label: 'Высокий контраст',
    description: 'Глубокие чёрные, чистые белые, нейтральные цвета',
    prompt: 'High contrast color with deep crushed blacks and clean whites, neutral color cast, punchy saturation in midtones, fashion editorial contrast, dramatic tonal separation',
    params: {
      baseColorCast: 'neutral',
      dominantPalette: 'high_contrast',
      skinToneRendering: 'natural',
      whiteBalanceBehavior: 'corrected',
      colorNoise: 'none'
    }
  },
  
  desaturated: {
    id: 'desaturated',
    label: 'Приглушённый',
    description: 'Muted colors, editorial минимализм',
    prompt: 'Desaturated muted color palette, colors pulled back 30-40%, subtle tonal differences, editorial minimalist aesthetic, sophisticated understated look, European magazine quality',
    params: {
      baseColorCast: 'neutral',
      dominantPalette: 'muted',
      skinToneRendering: 'slightly_muted',
      whiteBalanceBehavior: 'corrected',
      colorNoise: 'subtle'
    }
  },
  
  cross_process: {
    id: 'cross_process',
    label: 'Кросс-процесс',
    description: 'Сине-зелёные тени, янтарные света',
    prompt: 'Cross-processed film look, cyan-green shadows, amber-yellow highlights, color shifts in midtones, experimental processing aesthetic, 90s alternative fashion energy, unpredictable color response',
    params: {
      baseColorCast: 'green_cyan',
      dominantPalette: 'high_contrast',
      skinToneRendering: 'no_beautification',
      whiteBalanceBehavior: 'mixed_sources_visible',
      colorNoise: 'film_like'
    }
  },
  
  black_white: {
    id: 'black_white',
    label: 'Чёрно-белый',
    description: 'Монохром, зерно, контраст',
    prompt: 'Classic black and white, rich tonal range from deep blacks to bright whites, visible film grain, Tri-X pushed aesthetic, dramatic monochrome, no color information',
    params: {
      baseColorCast: 'neutral',
      dominantPalette: 'high_contrast',
      skinToneRendering: 'natural',
      whiteBalanceBehavior: 'corrected',
      colorNoise: 'film_like'
    },
    isMonochrome: true
  },
  
  vintage_fade: {
    id: 'vintage_fade',
    label: 'Винтажный fade',
    description: 'Поднятые чёрные, выцветшие цвета',
    prompt: 'Vintage faded film look, lifted shadows with milky blacks, overall desaturation, aged photograph feeling, nostalgic color palette, slightly yellow-magenta tint in highlights',
    params: {
      baseColorCast: 'warm',
      dominantPalette: 'muted',
      skinToneRendering: 'slightly_muted',
      whiteBalanceBehavior: 'imperfect',
      colorNoise: 'film_like'
    }
  },
  
  neutral_clean: {
    id: 'neutral_clean',
    label: 'Нейтральный чистый',
    description: 'Корректный баланс белого, чистые цвета',
    prompt: 'Clean neutral color with correct white balance, accurate color reproduction, no color casts, modern digital clarity, commercial product photography quality',
    params: {
      baseColorCast: 'neutral',
      dominantPalette: 'natural',
      skinToneRendering: 'natural',
      whiteBalanceBehavior: 'corrected',
      colorNoise: 'none'
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// ERA PRESETS
// ═══════════════════════════════════════════════════════════════

export const ERA_PRESETS = {
  '90s_grunge': {
    id: '90s_grunge',
    label: '90s гранж',
    description: 'European editorial, сканы журналов, зерно',
    prompt: 'Late 1990s European fashion editorial aesthetic, magazine scan texture, visible film grain, slightly desaturated colors, The Face / i-D magazine energy, grunge influence, anti-glamour approach',
    params: {
      eraReference: 'late_90s',
      editorialReference: 'european_fashion',
      printBehavior: 'magazine_scan_feel',
      formatBias: 'vertical'
    }
  },
  
  y2k_flash: {
    id: 'y2k_flash',
    label: 'Y2K вспышка',
    description: 'Вечеринки 2000-х, вспышка, party aesthetic',
    prompt: 'Early 2000s Y2K party photography, harsh on-camera flash, red-eye, slightly blown highlights, nightclub and party energy, disposable camera aesthetic, Paris Hilton era',
    params: {
      eraReference: 'early_2000s',
      editorialReference: 'american_commercial',
      printBehavior: 'digital_clean',
      formatBias: 'horizontal'
    }
  },
  
  '2000s_digital': {
    id: '2000s_digital',
    label: '2000s цифра',
    description: 'Ранняя цифра, лёгкий HDR, чёткость',
    prompt: 'Mid 2000s early digital photography look, slightly over-sharpened, early HDR tendency, commercial brightness, American advertising aesthetic, Canon 5D era',
    params: {
      eraReference: 'mid_2000s',
      editorialReference: 'american_commercial',
      printBehavior: 'digital_clean',
      formatBias: 'horizontal'
    }
  },
  
  '2010s_instagram': {
    id: '2010s_instagram',
    label: '2010s Instagram',
    description: 'VSCO filters, iPhone aesthetic',
    prompt: '2010s Instagram era aesthetic, VSCO filter style, slightly lifted shadows, subtle vignette, iPhone photography influence, social media native composition, lifestyle photography',
    params: {
      eraReference: '2010s',
      editorialReference: 'american_commercial',
      printBehavior: 'digital_clean',
      formatBias: 'square'
    }
  },
  
  contemporary: {
    id: 'contemporary',
    label: 'Современный',
    description: 'Digital clean, минимальное зерно, современный look',
    prompt: 'Contemporary 2024-2026 fashion photography, clean digital capture, minimal grain, high resolution clarity, modern fashion editorial standards, current aesthetic trends',
    params: {
      eraReference: 'contemporary',
      editorialReference: 'european_fashion',
      printBehavior: 'digital_clean',
      formatBias: 'vertical'
    }
  },
  
  film_revival: {
    id: 'film_revival',
    label: 'Плёночный ренессанс',
    description: 'Современная плёнка, Portra look, аналоговый ренессанс',
    prompt: 'Contemporary film revival aesthetic, modern Kodak Portra 400/800 look, organic grain texture, analog warmth with modern sensibility, artisan photography movement, intentional imperfection',
    params: {
      eraReference: 'contemporary',
      editorialReference: 'european_fashion',
      printBehavior: 'magazine_scan_feel',
      formatBias: 'vertical'
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get preset by ID from any category
 */
export function getPresetById(category, id) {
  const presets = {
    light: LIGHT_PRESETS,
    color: COLOR_PRESETS,
    era: ERA_PRESETS
  };
  
  return presets[category]?.[id] || null;
}

/**
 * Get all presets for a category as an array
 */
export function getPresetsArray(category) {
  const presets = {
    light: LIGHT_PRESETS,
    color: COLOR_PRESETS,
    era: ERA_PRESETS
  };
  
  const categoryPresets = presets[category];
  if (!categoryPresets) return [];
  
  return Object.values(categoryPresets);
}

/**
 * Build combined prompt from selected presets
 */
export function buildPresetsPrompt(presetIds) {
  const prompts = [];
  
  if (presetIds.light && LIGHT_PRESETS[presetIds.light]) {
    prompts.push(`LIGHTING: ${LIGHT_PRESETS[presetIds.light].prompt}`);
  }
  
  if (presetIds.color && COLOR_PRESETS[presetIds.color]) {
    prompts.push(`COLOR: ${COLOR_PRESETS[presetIds.color].prompt}`);
  }
  
  if (presetIds.era && ERA_PRESETS[presetIds.era]) {
    prompts.push(`ERA: ${ERA_PRESETS[presetIds.era].prompt}`);
  }
  
  return prompts.join('\n\n');
}

/**
 * Export all presets for API
 */
export function getAllStylePresets() {
  return {
    light: LIGHT_PRESETS,
    color: COLOR_PRESETS,
    era: ERA_PRESETS
  };
}

