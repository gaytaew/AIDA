/**
 * Style Presets for Custom Shoot Module
 * 
 * Hierarchical parameter system:
 * 1. SHOOT_TYPE - Top-level context (catalog, editorial, street, etc.)
 * 2. CAMERA_AESTHETIC - Film/lens look without lighting
 * 3. LIGHTING_SOURCE - Where light comes from
 * 4. LIGHTING_QUALITY - How light behaves
 * 5. COLOR - Color science
 * 6. ERA - Time period aesthetic
 * 
 * Each preset contains prompt snippets and conflict rules.
 */

// ═══════════════════════════════════════════════════════════════
// 1. SHOOT TYPE - Top-level context (Layer 1)
// ═══════════════════════════════════════════════════════════════

export const SHOOT_TYPE_PRESETS = {
  catalog: {
    id: 'catalog',
    label: 'Каталог',
    description: 'Чистые коммерческие снимки для продажи одежды',
    prompt: 'E-commerce catalog photography, clean product-focused images, clothing clearly visible and unobstructed, neutral poses, professional commercial quality, shopping-oriented presentation',
    defaults: {
      captureStyle: 'editorial_relaxed',
      lightingSource: 'studio_strobe',
      lightingQuality: 'soft_diffused',
      antiAi: 'low'
    },
    conflicts: {
      captureStyle: ['paparazzi_telephoto', 'motion_blur_action', 'through_window', 'caught_mid_blink'],
      lightingSource: ['mixed_ambient'],
      lightingQuality: ['harsh_direct']
    }
  },
  
  editorial: {
    id: 'editorial',
    label: 'Editorial',
    description: 'Художественная модная съёмка для журналов',
    prompt: 'High fashion editorial photography for magazines, artistic expression, creative poses and compositions, fashion-forward styling, magazine cover quality, visual storytelling',
    defaults: {
      captureStyle: 'editorial_posed',
      antiAi: 'medium'
    },
    conflicts: {} // Editorial allows everything
  },
  
  street: {
    id: 'street',
    label: 'Street / Documentary',
    description: 'Уличная съёмка, документальный стиль, raw aesthetic',
    prompt: 'Street fashion documentary style, raw authentic moments, urban environment, candid energy, real-life feeling, not staged, genuine human moments, photojournalistic approach',
    defaults: {
      captureStyle: 'candid_unaware',
      lightingSource: 'natural_daylight',
      antiAi: 'high'
    },
    conflicts: {
      captureStyle: ['editorial_posed'],
      lightingSource: ['studio_strobe', 'ring_flash']
    }
  },
  
  lookbook: {
    id: 'lookbook',
    label: 'Lookbook',
    description: 'Презентация коллекции, баланс коммерции и стиля',
    prompt: 'Fashion lookbook photography, collection presentation, styled but approachable, balance of commercial and artistic, brand identity visible, seasonal collection feel',
    defaults: {
      captureStyle: 'editorial_relaxed',
      lightingSource: 'natural_soft',
      antiAi: 'low'
    },
    conflicts: {
      captureStyle: ['paparazzi_telephoto', 'motion_blur_action']
    }
  },
  
  campaign: {
    id: 'campaign',
    label: 'Campaign / Реклама',
    description: 'Рекламная кампания, polish, aspirational',
    prompt: 'Advertising campaign photography, highly polished production value, aspirational lifestyle imagery, brand-building visuals, billboard and print ad quality, commercial perfection',
    defaults: {
      captureStyle: 'editorial_posed',
      lightingSource: 'studio_strobe',
      lightingQuality: 'contrasty',
      antiAi: 'off'
    },
    conflicts: {
      antiAi: ['high'] // Campaign shouldn't look too raw
    }
  },
  
  portrait: {
    id: 'portrait',
    label: 'Портрет',
    description: 'Персональная съёмка, интимность, характер',
    prompt: 'Portrait photography with focus on personality and character, intimate connection with subject, emotional depth, personal rather than commercial, human story',
    defaults: {
      captureStyle: 'candid_aware',
      lightingSource: 'window_light',
      lightingQuality: 'soft_diffused'
    },
    conflicts: {}
  },
  
  beauty: {
    id: 'beauty',
    label: 'Beauty',
    description: 'Макияж, уход, close-up beauty shots',
    prompt: 'Beauty photography for skincare and makeup, extreme attention to skin quality and makeup detail, close-up shots, flawless yet natural skin texture, beauty industry standards',
    defaults: {
      captureStyle: 'editorial_posed',
      lightingSource: 'ring_flash',
      lightingQuality: 'soft_diffused',
      composition: { shotSize: 'closeup' }
    },
    conflicts: {
      composition: ['wide_shot', 'full_shot']
    }
  },
  
  sport: {
    id: 'sport',
    label: 'Спорт / Active',
    description: 'Спортивная одежда в движении',
    prompt: 'Athletic and sportswear photography, dynamic action shots, energy and movement, fitness lifestyle, performance apparel showcase, action freeze or motion blur',
    defaults: {
      captureStyle: 'motion_blur_action',
      lightingSource: 'natural_daylight',
      lightingQuality: 'harsh_direct'
    },
    conflicts: {
      captureStyle: ['editorial_posed'] // Sport shouldn't be too static
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// 2. CAMERA AESTHETIC - Film/lens look WITHOUT lighting (Layer 2)
// ═══════════════════════════════════════════════════════════════

export const CAMERA_AESTHETIC_PRESETS = {
  none: {
    id: 'none',
    label: 'Без конкретной камеры',
    prompt: null
  },
  
  contax_t2: {
    id: 'contax_t2',
    label: 'Contax T2 (Portra)',
    description: 'Carl Zeiss резкость, Portra цвета, 90s fashion elite',
    prompt: 'Contax T2 compact film camera aesthetic, Carl Zeiss 38mm f/2.8 signature sharpness with smooth bokeh, Kodak Portra 400 color science, natural warm skin tones, fine organic film grain, 90s fashion elite aesthetic'
  },
  
  hasselblad_mf: {
    id: 'hasselblad_mf',
    label: 'Hasselblad (Medium Format)',
    description: 'Средний формат, creamy bokeh, editorial quality',
    prompt: 'Hasselblad medium format film aesthetic, 6x6 or 6x7 implied crop, Zeiss Planar rendering, extreme shallow depth of field, creamy smooth bokeh, high fashion editorial quality, analog richness'
  },
  
  leica_m: {
    id: 'leica_m',
    label: 'Leica M (Street)',
    description: 'Documentary резкость, Tri-X pushed, decisive moment',
    prompt: 'Leica M rangefinder aesthetic, documentary sharpness, Summicron 35mm rendering, Kodak Tri-X pushed grain, classic street photography look, decisive moment energy, compact camera intimacy'
  },
  
  canon_ae1: {
    id: 'canon_ae1',
    label: 'Canon AE-1 (Consumer)',
    description: 'Dreamy halation, consumer film, nostalgic amateur',
    prompt: 'Canon AE-1 35mm SLR aesthetic, FD 50mm f/1.4 wide open, dreamy halation on highlights, consumer film colors like Fujifilm Superia 400, nostalgic amateur photography aesthetic'
  },
  
  mamiya_rz67: {
    id: 'mamiya_rz67',
    label: 'Mamiya RZ67 (Studio)',
    description: 'Портретный medium format, creamy skin, studio quality',
    prompt: 'Mamiya RZ67 medium format aesthetic, 110mm f/2.8 portrait lens rendering, extreme shallow DOF with creamy bokeh, Kodak Portra 160 natural skin tones, high fashion studio quality'
  },
  
  polaroid: {
    id: 'polaroid',
    label: 'Polaroid',
    description: 'Instant film, soft focus, chemical bleeding',
    prompt: 'Polaroid instant film aesthetic, soft focus, subtle vignetting, creamy desaturated colors, chemical bleeding at edges, white frame energy, nostalgic and intimate'
  },
  
  disposable: {
    id: 'disposable',
    label: 'Одноразовая камера',
    description: 'Plastic lens, oversaturated, party aesthetic',
    prompt: 'Disposable camera aesthetic, plastic lens softness and distortion, oversaturated cheap film colors, hot center falloff to dark edges, party snapshot energy, lo-fi charm'
  },
  
  holga: {
    id: 'holga',
    label: 'Holga / Toy Camera',
    description: 'Extreme vignetting, light leaks, art school vibes',
    prompt: 'Holga 120 toy camera aesthetic, extreme vignetting, light leaks, soft plastic lens blur, lo-fi dreamy quality, unpredictable exposure, art school vibes, experimental'
  },
  
  iphone: {
    id: 'iphone',
    label: 'iPhone / Smartphone',
    description: 'Computational HDR, social media native',
    prompt: 'iPhone smartphone photography aesthetic, computational HDR artifacts visible, social media native look, slightly over-sharpened, deep DOF, casual snapshot quality'
  },
  
  ricoh_gr: {
    id: 'ricoh_gr',
    label: 'Ricoh GR (28mm)',
    description: 'Street compact, 28mm wide, snap aesthetic',
    prompt: 'Ricoh GR compact digital aesthetic, 28mm equivalent wide angle, high contrast snap mode energy, street photography immediacy, deep blacks, grain simulation'
  }
};

// ═══════════════════════════════════════════════════════════════
// 3. LIGHTING SOURCE - Where light comes from (Layer 3)
// ═══════════════════════════════════════════════════════════════

export const LIGHTING_SOURCE_PRESETS = {
  natural_daylight: {
    id: 'natural_daylight',
    label: 'Естественный дневной',
    description: 'Солнце или небо, без искусственных источников',
    prompt: 'Natural daylight illumination, sun or sky as primary light source, outdoor or large window, no artificial lighting visible',
    conflicts: {
      timeOfDay: ['night'] // Can't have daylight at night
    }
  },
  
  window_light: {
    id: 'window_light',
    label: 'Свет из окна',
    description: 'Направленный естественный свет через окно',
    prompt: 'Window light as primary source, directional natural light from one side, Rembrandt lighting possible, interior daytime quality, soft gradient falloff'
  },
  
  on_camera_flash: {
    id: 'on_camera_flash',
    label: 'Накамерная вспышка',
    description: 'Прямая вспышка в лоб, party aesthetic',
    prompt: 'On-camera flash as primary light, direct frontal illumination, background falloff to darkness, snapshot aesthetic, foreground blown tendency',
    implies: {
      lightingQuality: 'harsh_direct' // On-camera flash is always harsh
    }
  },
  
  studio_strobe: {
    id: 'studio_strobe',
    label: 'Студийный импульс',
    description: 'Контролируемый студийный свет с модификаторами',
    prompt: 'Professional studio strobe lighting, controlled illumination through modifiers (softbox, umbrella, beauty dish), clean neutral color temperature, fashion studio quality'
  },
  
  ring_flash: {
    id: 'ring_flash',
    label: 'Кольцевая вспышка',
    description: 'Плоское освещение, характерные блики в глазах',
    prompt: 'Ring flash on-axis lighting, virtually no shadows, flat even illumination, characteristic circular catchlight in eyes, fashion beauty aesthetic'
  },
  
  mixed_ambient: {
    id: 'mixed_ambient',
    label: 'Смешанный ambient',
    description: 'Разные источники: sodium, tungsten, neon',
    prompt: 'Mixed ambient light sources, sodium street lights mixing with tungsten interiors, color temperature contamination, urban nightlife quality, imperfect white balance'
  },
  
  practicals: {
    id: 'practicals',
    label: 'Практические источники',
    description: 'Лампы в кадре, неоновые вывески',
    prompt: 'Practical light sources visible in frame (lamps, neon signs, screens), motivated lighting, cinematic quality, light sources as part of composition'
  },
  
  continuous_led: {
    id: 'continuous_led',
    label: 'Постоянный LED',
    description: 'Видеосвет, равномерная заливка',
    prompt: 'Continuous LED panel lighting, even flat illumination, video production quality, modern commercial look, no flash freeze'
  }
};

// ═══════════════════════════════════════════════════════════════
// 4. LIGHTING QUALITY - How light behaves (Layer 4)
// ═══════════════════════════════════════════════════════════════

export const LIGHTING_QUALITY_PRESETS = {
  harsh_direct: {
    id: 'harsh_direct',
    label: 'Жёсткий прямой',
    description: 'Резкие тени, высокий контраст, пересветы',
    prompt: 'Harsh direct lighting with hard-edged shadows, high contrast between lit and shadow areas, specular highlights, no diffusion, punchy and dramatic',
    conflicts: {
      lightingSource: ['studio_strobe'] // Studio usually has modifiers
    }
  },
  
  soft_diffused: {
    id: 'soft_diffused',
    label: 'Мягкий рассеянный',
    description: 'Плавные тени, ровное освещение',
    prompt: 'Soft diffused lighting through large source or modifier, gentle shadow falloff, wrap-around illumination, flattering and even, beauty quality',
    conflicts: {
      lightingSource: ['on_camera_flash'] // On-camera can't be soft
    }
  },
  
  contrasty: {
    id: 'contrasty',
    label: 'Контрастный',
    description: 'Сильный контраст свет/тень, драматичный',
    prompt: 'High contrast lighting with dramatic light-to-shadow ratio, deep shadows not filled, sculptural quality, fashion editorial drama, Rembrandt or chiaroscuro influence'
  },
  
  flat: {
    id: 'flat',
    label: 'Плоский',
    description: 'Минимальные тени, заполняющий свет',
    prompt: 'Flat even lighting with minimal shadows, high fill ratio, beauty photography quality, shadowless commercial look, ring flash or butterfly lighting effect'
  },
  
  backlit: {
    id: 'backlit',
    label: 'Контровой',
    description: 'Свет сзади, rim light, силуэтный потенциал',
    prompt: 'Backlit setup with light source behind subject, rim light on hair and shoulders, lens flare potential, silhouette possibilities, atmospheric haze highlighted'
  },
  
  moody_lowkey: {
    id: 'moody_lowkey',
    label: 'Low-key / Moody',
    description: 'Много теней, атмосферный, cinematic',
    prompt: 'Low-key moody lighting, predominantly dark with selective highlights, noir influence, atmospheric and cinematic, mystery and drama, deep shadows dominating'
  }
};

// ═══════════════════════════════════════════════════════════════
// 5. LIGHT PRESETS (original - kept for compatibility)
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
// CONFLICT DETECTION SYSTEM
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a parameter value conflicts with current selections
 * @param {Object} currentSelections - Current parameter values
 * @param {string} paramToCheck - Parameter being checked
 * @param {string} valueToCheck - Value being checked
 * @returns {Object} { conflicts: boolean, reasons: string[], blockedBy: string[] }
 */
export function checkConflicts(currentSelections, paramToCheck, valueToCheck) {
  const conflicts = [];
  const blockedBy = [];
  
  // 1. Check Shoot Type conflicts
  if (currentSelections.shootType && SHOOT_TYPE_PRESETS[currentSelections.shootType]) {
    const shootType = SHOOT_TYPE_PRESETS[currentSelections.shootType];
    if (shootType.conflicts?.[paramToCheck]?.includes(valueToCheck)) {
      conflicts.push(`"${shootType.label}" не совместим с этим параметром`);
      blockedBy.push('shootType');
    }
  }
  
  // 2. Check Lighting Source implies (e.g., on_camera_flash implies harsh_direct)
  if (paramToCheck === 'lightingQuality' && currentSelections.lightingSource) {
    const source = LIGHTING_SOURCE_PRESETS[currentSelections.lightingSource];
    if (source?.implies?.lightingQuality && source.implies.lightingQuality !== valueToCheck) {
      conflicts.push(`"${source.label}" требует "${LIGHTING_QUALITY_PRESETS[source.implies.lightingQuality]?.label}"`);
      blockedBy.push('lightingSource');
    }
  }
  
  // 3. Check Lighting Source conflicts
  if (paramToCheck === 'lightingSource' && currentSelections.lightingQuality) {
    const quality = LIGHTING_QUALITY_PRESETS[currentSelections.lightingQuality];
    if (quality?.conflicts?.lightingSource?.includes(valueToCheck)) {
      conflicts.push(`"${quality.label}" не совместим с "${LIGHTING_SOURCE_PRESETS[valueToCheck]?.label}"`);
      blockedBy.push('lightingQuality');
    }
  }
  
  // 4. Check Lighting Quality conflicts
  if (paramToCheck === 'lightingQuality' && currentSelections.lightingSource) {
    const source = LIGHTING_SOURCE_PRESETS[currentSelections.lightingSource];
    const quality = LIGHTING_QUALITY_PRESETS[valueToCheck];
    if (quality?.conflicts?.lightingSource?.includes(currentSelections.lightingSource)) {
      conflicts.push(`"${quality.label}" не совместим с "${source?.label}"`);
      blockedBy.push('lightingSource');
    }
  }
  
  // 5. Check Time of Day conflicts with Lighting Source
  if (paramToCheck === 'lightingSource' && currentSelections.timeOfDay) {
    const source = LIGHTING_SOURCE_PRESETS[valueToCheck];
    if (source?.conflicts?.timeOfDay?.includes(currentSelections.timeOfDay)) {
      const timeLabels = {
        night: 'Ночь', sunrise: 'Рассвет', midday: 'Полдень', sunset: 'Закат'
      };
      conflicts.push(`"${source?.label}" невозможен при "${timeLabels[currentSelections.timeOfDay]}"`);
      blockedBy.push('timeOfDay');
    }
  }
  
  // 6. Check Capture Style conflicts with Shoot Type
  if (paramToCheck === 'captureStyle' && currentSelections.shootType) {
    const shootType = SHOOT_TYPE_PRESETS[currentSelections.shootType];
    if (shootType?.conflicts?.captureStyle?.includes(valueToCheck)) {
      conflicts.push(`"${shootType.label}" не совместим с этим стилем захвата`);
      blockedBy.push('shootType');
    }
  }
  
  return {
    conflicts: conflicts.length > 0,
    reasons: conflicts,
    blockedBy
  };
}

/**
 * Get all conflicts for current parameter set
 * @param {Object} selections - All current parameter values
 * @returns {Object} Map of parameter -> conflicting values
 */
export function getAllConflicts(selections) {
  const allConflicts = {};
  
  // Check each parameter category
  const categories = {
    shootType: SHOOT_TYPE_PRESETS,
    cameraAesthetic: CAMERA_AESTHETIC_PRESETS,
    lightingSource: LIGHTING_SOURCE_PRESETS,
    lightingQuality: LIGHTING_QUALITY_PRESETS,
    color: COLOR_PRESETS,
    era: ERA_PRESETS
  };
  
  for (const [param, presets] of Object.entries(categories)) {
    allConflicts[param] = {};
    for (const presetId of Object.keys(presets)) {
      const result = checkConflicts(selections, param, presetId);
      if (result.conflicts) {
        allConflicts[param][presetId] = result;
      }
    }
  }
  
  return allConflicts;
}

/**
 * Get suggested defaults based on shoot type
 * @param {string} shootType - Selected shoot type
 * @returns {Object} Suggested parameter values
 */
export function getShootTypeDefaults(shootType) {
  const preset = SHOOT_TYPE_PRESETS[shootType];
  if (!preset) return {};
  return preset.defaults || {};
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get preset by ID from any category
 */
export function getPresetById(category, id) {
  const presets = {
    shootType: SHOOT_TYPE_PRESETS,
    cameraAesthetic: CAMERA_AESTHETIC_PRESETS,
    lightingSource: LIGHTING_SOURCE_PRESETS,
    lightingQuality: LIGHTING_QUALITY_PRESETS,
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
    shootType: SHOOT_TYPE_PRESETS,
    cameraAesthetic: CAMERA_AESTHETIC_PRESETS,
    lightingSource: LIGHTING_SOURCE_PRESETS,
    lightingQuality: LIGHTING_QUALITY_PRESETS,
    light: LIGHT_PRESETS,
    color: COLOR_PRESETS,
    era: ERA_PRESETS
  };
  
  const categoryPresets = presets[category];
  if (!categoryPresets) return [];
  
  return Object.values(categoryPresets);
}

/**
 * Build combined prompt from selected presets (NEW structured version)
 */
export function buildPresetsPrompt(presetIds) {
  const prompts = [];
  
  // 1. Shoot Type context (highest priority)
  if (presetIds.shootType && SHOOT_TYPE_PRESETS[presetIds.shootType]) {
    prompts.push(`SHOOT TYPE: ${SHOOT_TYPE_PRESETS[presetIds.shootType].prompt}`);
  }
  
  // 2. Camera Aesthetic
  if (presetIds.cameraAesthetic && CAMERA_AESTHETIC_PRESETS[presetIds.cameraAesthetic]?.prompt) {
    prompts.push(`CAMERA AESTHETIC: ${CAMERA_AESTHETIC_PRESETS[presetIds.cameraAesthetic].prompt}`);
  }
  
  // 3. Lighting (source + quality OR legacy light preset)
  if (presetIds.lightingSource && LIGHTING_SOURCE_PRESETS[presetIds.lightingSource]) {
    prompts.push(`LIGHTING SOURCE: ${LIGHTING_SOURCE_PRESETS[presetIds.lightingSource].prompt}`);
  }
  if (presetIds.lightingQuality && LIGHTING_QUALITY_PRESETS[presetIds.lightingQuality]) {
    prompts.push(`LIGHTING QUALITY: ${LIGHTING_QUALITY_PRESETS[presetIds.lightingQuality].prompt}`);
  }
  // Legacy fallback
  if (!presetIds.lightingSource && presetIds.light && LIGHT_PRESETS[presetIds.light]) {
    prompts.push(`LIGHTING: ${LIGHT_PRESETS[presetIds.light].prompt}`);
  }
  
  // 4. Color
  if (presetIds.color && COLOR_PRESETS[presetIds.color]) {
    prompts.push(`COLOR: ${COLOR_PRESETS[presetIds.color].prompt}`);
  }
  
  // 5. Era
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
    shootType: SHOOT_TYPE_PRESETS,
    cameraAesthetic: CAMERA_AESTHETIC_PRESETS,
    lightingSource: LIGHTING_SOURCE_PRESETS,
    lightingQuality: LIGHTING_QUALITY_PRESETS,
    light: LIGHT_PRESETS,
    color: COLOR_PRESETS,
    era: ERA_PRESETS
  };
}

