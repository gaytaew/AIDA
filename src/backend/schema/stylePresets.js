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
    prompt: `High fashion editorial photography for magazines.

ARTISTIC COMPOSITION (CRITICAL):
- AVOID centered, symmetrical framing — use rule of thirds, dynamic diagonals
- Create visual tension through asymmetry and negative space
- Capture in-between moments, not peak poses
- Allow parts of the model to be cropped unexpectedly
- Use unusual angles and perspectives

EXPRESSION & EMOTION:
- The model's expression must feel GENUINE, not performed
- Subtle, nuanced emotions — not theatrical or exaggerated
- Eyes should have life and depth, not empty stare
- Allow imperfect moments: slight squint, mid-blink, asymmetric smile

ANTI-PLASTIC:
- Real skin texture with pores, subtle imperfections
- Natural light falloff and shadows
- Avoid HDR look, avoid overly smooth skin
- Film grain and optical imperfections add authenticity`,
    defaults: {
      captureStyle: 'editorial_relaxed',  // Changed from editorial_posed
      antiAi: 'high',                      // Changed from medium
      skinTexture: 'natural_film'
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
    prompt: null,
    focusConflicts: [] // No conflicts
  },
  
  contax_t2: {
    id: 'contax_t2',
    label: 'Contax T2 (Portra)',
    description: 'Carl Zeiss резкость, Portra цвета, 90s fashion elite',
    prompt: 'Contax T2 compact film camera aesthetic, Carl Zeiss 38mm f/2.8 signature sharpness with smooth bokeh, Kodak Portra 400 color science, natural warm skin tones, fine organic film grain, 90s fashion elite aesthetic',
    focusCapability: 'moderate', // f/2.8 - moderate shallow DOF
    focusConflicts: []
  },
  
  hasselblad_mf: {
    id: 'hasselblad_mf',
    label: 'Hasselblad (Medium Format)',
    description: 'Средний формат, creamy bokeh, editorial quality',
    prompt: 'Hasselblad medium format film aesthetic, 6x6 or 6x7 implied crop, Zeiss Planar rendering, extreme shallow depth of field, creamy smooth bokeh, high fashion editorial quality, analog richness',
    focusCapability: 'full', // Medium format = excellent shallow DOF
    focusConflicts: [],
    implies: { focusMode: 'shallow_dof' } // Hasselblad implies shallow DOF
  },
  
  leica_m: {
    id: 'leica_m',
    label: 'Leica M (Street)',
    description: 'Documentary резкость, Tri-X pushed, decisive moment',
    prompt: 'Leica M rangefinder aesthetic, documentary sharpness, Summicron 35mm rendering, Kodak Tri-X pushed grain, classic street photography look, decisive moment energy, compact camera intimacy',
    focusCapability: 'full', // Fast lenses available
    focusConflicts: []
  },
  
  canon_ae1: {
    id: 'canon_ae1',
    label: 'Canon AE-1 (Consumer)',
    description: 'Dreamy halation, consumer film, nostalgic amateur',
    prompt: 'Canon AE-1 35mm SLR aesthetic, FD 50mm f/1.4 wide open, dreamy halation on highlights, consumer film colors like Fujifilm Superia 400, nostalgic amateur photography aesthetic',
    focusCapability: 'full', // f/1.4 available
    focusConflicts: []
  },
  
  mamiya_rz67: {
    id: 'mamiya_rz67',
    label: 'Mamiya RZ67 (Studio)',
    description: 'Портретный medium format, creamy skin, studio quality',
    prompt: 'Mamiya RZ67 medium format aesthetic, 110mm f/2.8 portrait lens rendering, extreme shallow DOF with creamy bokeh, Kodak Portra 160 natural skin tones, high fashion studio quality',
    focusCapability: 'full', // Medium format
    focusConflicts: [],
    implies: { focusMode: 'shallow_dof' }
  },
  
  polaroid: {
    id: 'polaroid',
    label: 'Polaroid',
    description: 'Instant film, soft focus, chemical bleeding',
    prompt: 'Polaroid instant film aesthetic, soft focus, subtle vignetting, creamy desaturated colors, chemical bleeding at edges, white frame energy, nostalgic and intimate',
    focusCapability: 'limited', // Fixed focus lenses
    focusConflicts: ['very_shallow_dof'], // Polaroid can't do very shallow
    warns: { focusMode: 'shallow_dof', message: 'Polaroid имеет ограниченные возможности размытия фона' }
  },
  
  disposable: {
    id: 'disposable',
    label: 'Одноразовая камера',
    description: 'Plastic lens, oversaturated, party aesthetic',
    prompt: 'Disposable camera aesthetic, plastic lens softness and distortion, oversaturated cheap film colors, hot center falloff to dark edges, party snapshot energy, lo-fi charm',
    focusCapability: 'fixed', // Fixed focus
    focusConflicts: ['shallow_dof', 'very_shallow_dof'], // Disposable = deep focus only
    implies: { focusMode: 'deep_focus' }
  },
  
  holga: {
    id: 'holga',
    label: 'Holga / Toy Camera',
    description: 'Extreme vignetting, light leaks, art school vibes',
    prompt: 'Holga 120 toy camera aesthetic, extreme vignetting, light leaks, soft plastic lens blur, lo-fi dreamy quality, unpredictable exposure, art school vibes, experimental',
    focusCapability: 'fixed',
    focusConflicts: ['shallow_dof', 'very_shallow_dof'],
    implies: { focusMode: 'deep_focus' }
  },
  
  iphone: {
    id: 'iphone',
    label: 'iPhone / Smartphone',
    description: 'Computational HDR, social media native',
    prompt: 'iPhone smartphone photography aesthetic, computational HDR artifacts visible, social media native look, slightly over-sharpened, deep DOF, casual snapshot quality',
    focusCapability: 'computational', // Fake DOF via computation
    focusConflicts: ['very_shallow_dof'], // iPhone can't do very shallow optically
    warns: { focusMode: 'shallow_dof', message: 'iPhone использует вычислительное размытие (portrait mode) — не оптическое' }
  },
  
  ricoh_gr: {
    id: 'ricoh_gr',
    label: 'Ricoh GR (28mm)',
    description: 'Street compact, 28mm wide, snap aesthetic',
    prompt: 'Ricoh GR compact digital aesthetic, 28mm equivalent wide angle, high contrast snap mode energy, street photography immediacy, deep blacks, grain simulation',
    focusCapability: 'limited', // 28mm wide angle = hard to get shallow DOF
    focusConflicts: ['very_shallow_dof'],
    warns: { focusMode: 'shallow_dof', message: 'Широкоугольный 28mm затрудняет сильное размытие фона' }
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
      timeOfDay: ['night'], // Can't have daylight at night
      spaceType: ['interior_studio'] // Daylight implies outdoor or near window
    },
    validSpaceTypes: ['exterior', 'rooftop', 'interior_with_windows', 'mixed']
  },
  
  window_light: {
    id: 'window_light',
    label: 'Свет из окна',
    description: 'Направленный естественный свет через окно',
    prompt: 'Window light as primary source, directional natural light from one side, Rembrandt lighting possible, interior daytime quality, soft gradient falloff',
    conflicts: {
      timeOfDay: ['night'], // No window light at night (or minimal)
      spaceType: ['exterior'] // Can't have window light outside
    },
    validSpaceTypes: ['interior_with_windows', 'interior_studio', 'mixed']
  },
  
  on_camera_flash: {
    id: 'on_camera_flash',
    label: 'Накамерная вспышка',
    description: 'Прямая вспышка в лоб, party aesthetic',
    prompt: 'On-camera flash as primary light, direct frontal illumination, background falloff to darkness, snapshot aesthetic, foreground blown tendency',
    implies: {
      lightingQuality: 'harsh_direct' // On-camera flash is always harsh
    },
    validSpaceTypes: ['interior', 'exterior', 'mixed', 'interior_studio'] // Works anywhere
  },
  
  studio_strobe: {
    id: 'studio_strobe',
    label: 'Студийный импульс',
    description: 'Контролируемый студийный свет с модификаторами',
    prompt: 'Professional studio strobe lighting, controlled illumination through modifiers (softbox, umbrella, beauty dish), clean neutral color temperature, fashion studio quality',
    conflicts: {
      spaceType: ['exterior', 'rooftop'] // Studio strobe can't be outdoors
    },
    validSpaceTypes: ['interior_studio', 'interior', 'mixed']
  },
  
  ring_flash: {
    id: 'ring_flash',
    label: 'Кольцевая вспышка',
    description: 'Плоское освещение, характерные блики в глазах',
    prompt: 'Ring flash on-axis lighting, virtually no shadows, flat even illumination, characteristic circular catchlight in eyes, fashion beauty aesthetic',
    conflicts: {
      spaceType: ['exterior', 'rooftop'] // Ring flash is studio/indoor
    },
    validSpaceTypes: ['interior_studio', 'interior']
  },
  
  mixed_ambient: {
    id: 'mixed_ambient',
    label: 'Смешанный ambient',
    description: 'Разные источники: sodium, tungsten, neon',
    prompt: 'Mixed ambient light sources, sodium street lights mixing with tungsten interiors, color temperature contamination, urban nightlife quality, imperfect white balance',
    conflicts: {
      timeOfDay: ['midday', 'golden_hour'] // Mixed ambient is typically night/evening
    },
    validSpaceTypes: ['exterior', 'interior', 'mixed']
  },
  
  practicals: {
    id: 'practicals',
    label: 'Практические источники',
    description: 'Лампы в кадре, неоновые вывески',
    prompt: 'Practical light sources visible in frame (lamps, neon signs, screens), motivated lighting, cinematic quality, light sources as part of composition',
    validSpaceTypes: ['interior', 'exterior', 'mixed']
  },
  
  continuous_led: {
    id: 'continuous_led',
    label: 'Постоянный LED',
    description: 'Видеосвет, равномерная заливка',
    prompt: 'Continuous LED panel lighting, even flat illumination, video production quality, modern commercial look, no flash freeze',
    conflicts: {
      spaceType: ['exterior'] // LED panels are typically indoor
    },
    validSpaceTypes: ['interior_studio', 'interior', 'mixed']
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
      lightingSource: ['studio_strobe'], // Studio usually has modifiers
      weather: ['overcast', 'foggy', 'cloudy'], // Overcast sky = natural soft light
      timeOfDay: ['blue_hour'] // Blue hour is soft
    },
    autoBlockedWhen: {
      weather: ['overcast', 'foggy', 'cloudy'], // Auto-switch to soft_diffused
      fallback: 'soft_diffused'
    }
  },
  
  soft_diffused: {
    id: 'soft_diffused',
    label: 'Мягкий рассеянный',
    description: 'Плавные тени, ровное освещение',
    prompt: 'Soft diffused lighting through large source or modifier, gentle shadow falloff, wrap-around illumination, flattering and even, beauty quality',
    conflicts: {
      lightingSource: ['on_camera_flash'] // On-camera can't be soft
    },
    compatibleWith: {
      weather: ['overcast', 'foggy', 'cloudy', 'clear', 'any'], // Works with everything
      timeOfDay: ['any', 'golden_hour', 'blue_hour', 'sunrise', 'sunset']
    }
  },
  
  contrasty: {
    id: 'contrasty',
    label: 'Контрастный',
    description: 'Сильный контраст свет/тень, драматичный',
    prompt: 'High contrast lighting with dramatic light-to-shadow ratio, deep shadows not filled, sculptural quality, fashion editorial drama, Rembrandt or chiaroscuro influence',
    conflicts: {
      weather: ['foggy'] // Fog kills contrast
    }
  },
  
  flat: {
    id: 'flat',
    label: 'Плоский',
    description: 'Минимальные тени, заполняющий свет',
    prompt: 'Flat even lighting with minimal shadows, high fill ratio, beauty photography quality, shadowless commercial look, ring flash or butterfly lighting effect',
    compatibleWith: {
      weather: ['overcast', 'cloudy'], // Overcast is naturally flat
      lightingSource: ['ring_flash', 'studio_strobe', 'continuous_led']
    }
  },
  
  backlit: {
    id: 'backlit',
    label: 'Контровой',
    description: 'Свет сзади, rim light, силуэтный потенциал',
    prompt: 'Backlit setup with light source behind subject, rim light on hair and shoulders, lens flare potential, silhouette possibilities, atmospheric haze highlighted',
    bestWith: {
      timeOfDay: ['golden_hour', 'sunset', 'sunrise'], // Backlight works best at these times
      lightingSource: ['natural_daylight']
    }
  },
  
  moody_lowkey: {
    id: 'moody_lowkey',
    label: 'Low-key / Moody',
    description: 'Много теней, атмосферный, cinematic',
    prompt: 'Low-key moody lighting, predominantly dark with selective highlights, noir influence, atmospheric and cinematic, mystery and drama, deep shadows dominating',
    bestWith: {
      timeOfDay: ['night', 'blue_hour'],
      lightingSource: ['practicals', 'mixed_ambient']
    }
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
// 6b. LENS FOCAL LENGTH - Perspective and field of view
// ═══════════════════════════════════════════════════════════════

export const LENS_FOCAL_LENGTH_PRESETS = {
  auto: {
    id: 'auto',
    label: 'Авто',
    description: 'Автоматический выбор по типу кадра',
    prompt: null,
    focalRange: null
  },
  
  fisheye: {
    id: 'fisheye',
    label: 'Фишай (8-16mm)',
    description: 'Экстремальное искажение, creative effect',
    prompt: `FISHEYE LENS (8-16mm equivalent):
- Extreme barrel distortion — straight lines curve dramatically
- 180° field of view, everything fits in frame
- Exaggerated perspective: objects close to lens appear huge
- Surreal, psychedelic, skateboarding/action sports aesthetic
- Face distortion when close — use for creative effect only
- Background wraps around edges`,
    focalRange: [8, 16],
    distortion: 'extreme_barrel',
    perspective: 'extreme_wide',
    conflicts: {
      shootType: ['catalog', 'beauty'], // Don't use fisheye for commercial/beauty
      shotSize: ['closeup', 'extreme_closeup'] // Fisheye distorts faces badly
    }
  },
  
  ultra_wide: {
    id: 'ultra_wide',
    label: 'Сверхширокий (16-24mm)',
    description: 'Широкое поле зрения, лёгкое искажение',
    prompt: `ULTRA WIDE ANGLE LENS (16-24mm equivalent):
- Very wide field of view — captures environment + subject
- Noticeable perspective distortion (converging verticals)
- Objects at edges appear stretched
- Great for environmental portraits, architecture context
- Subject appears smaller relative to background
- Creates sense of space and scale`,
    focalRange: [16, 24],
    distortion: 'noticeable',
    perspective: 'wide',
    bestWith: {
      shotSize: ['wide_shot', 'full_shot'],
      shootType: ['street', 'editorial']
    }
  },
  
  wide: {
    id: 'wide',
    label: 'Широкий (24-35mm)',
    description: 'Классический широкий угол, журнальный стиль',
    prompt: `WIDE ANGLE LENS (24-35mm equivalent):
- Classic editorial wide angle
- Subtle perspective exaggeration
- Good for full body + environment context
- Slight elongation of features at close distance
- Documentary/street photography standard
- Richard Avedon, Helmut Newton territory`,
    focalRange: [24, 35],
    distortion: 'subtle',
    perspective: 'moderately_wide',
    bestWith: {
      shotSize: ['full_shot', 'wide_shot', 'cowboy_shot'],
      shootType: ['editorial', 'street']
    }
  },
  
  standard: {
    id: 'standard',
    label: 'Стандартный (35-50mm)',
    description: 'Нейтральная перспектива, как видит глаз',
    prompt: `STANDARD LENS (35-50mm equivalent):
- Natural perspective — closest to human eye perception
- No noticeable distortion
- Versatile for all shot types
- Documentary neutral look
- 50mm = "nifty fifty", classic for a reason
- Balanced compression — neither wide nor telephoto effect`,
    focalRange: [35, 50],
    distortion: 'none',
    perspective: 'natural',
    isDefault: true
  },
  
  portrait: {
    id: 'portrait',
    label: 'Портретный (85-105mm)',
    description: 'Идеально для портретов, мягкое сжатие',
    prompt: `PORTRAIT LENS (85-105mm equivalent):
- Classic portrait focal length
- Flattering facial compression — nose appears smaller, face more balanced
- Excellent background separation (shallow DOF easier to achieve)
- Creamy bokeh, smooth out-of-focus areas
- Working distance allows comfortable subject interaction
- Peter Lindbergh, Mario Testino classic look`,
    focalRange: [85, 105],
    distortion: 'none',
    perspective: 'slight_compression',
    bestWith: {
      shotSize: ['closeup', 'medium_closeup', 'medium_shot'],
      shootType: ['portrait', 'beauty', 'editorial']
    },
    implies: {
      focusMode: 'shallow' // Portrait lenses often used wide open
    }
  },
  
  telephoto: {
    id: 'telephoto',
    label: 'Телефото (135-200mm)',
    description: 'Сильное сжатие, изоляция объекта',
    prompt: `TELEPHOTO LENS (135-200mm equivalent):
- Strong background compression — background feels closer
- Extreme subject isolation from environment
- Very shallow depth of field even at moderate apertures
- Long working distance (paparazzi, sports, wildlife)
- Flattening of facial features
- Compressed perspective makes everything look stacked`,
    focalRange: [135, 200],
    distortion: 'none',
    perspective: 'compressed',
    bestWith: {
      captureStyle: ['paparazzi_telephoto'],
      shotSize: ['closeup', 'medium_closeup', 'medium_shot']
    }
  },
  
  super_telephoto: {
    id: 'super_telephoto',
    label: 'Супер-телефото (300mm+)',
    description: 'Экстремальное сжатие, для спорта/wildlife',
    prompt: `SUPER TELEPHOTO LENS (300mm+ equivalent):
- Extreme compression — background appears flat
- Massive subject isolation
- Used from great distance
- Sports, wildlife, paparazzi aesthetic
- Very narrow field of view — just the subject
- Heat shimmer and atmospheric haze visible`,
    focalRange: [300, 600],
    distortion: 'none',
    perspective: 'extreme_compression',
    conflicts: {
      shotSize: ['wide_shot'] // Can't do wide shot with super telephoto
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// 7. MODEL BEHAVIOR - How the model interacts with camera (Layer 7)
// ═══════════════════════════════════════════════════════════════

export const MODEL_BEHAVIOR_PRESETS = {
  natural: {
    id: 'natural',
    label: 'Естественное',
    description: 'Модель ведёт себя естественно, не позирует',
    prompt: `MODEL BEHAVIOR: Natural and unposed.
- Model appears caught in a genuine moment, not posing
- Relaxed body language, no tension
- Eyes may be looking away from camera or at camera casually
- No deliberate "model poses" or fashion clichés
- Like a candid moment that happened to be photographed`,
    intensity: 'low',
    cameraAwareness: 'unaware_or_casual'
  },
  
  aware_relaxed: {
    id: 'aware_relaxed',
    label: 'Расслабленный контакт',
    description: 'Знает о камере, но расслаблен',
    prompt: `MODEL BEHAVIOR: Camera-aware but relaxed.
- Model is aware of camera but not performing for it
- Comfortable, confident presence
- Occasional eye contact with camera, but not forced
- Like talking to a friend who happens to have a camera
- Natural hand placement, no stiff poses`,
    intensity: 'low',
    cameraAwareness: 'aware_casual'
  },
  
  engaged: {
    id: 'engaged',
    label: 'Взаимодействие',
    description: 'Активно работает с камерой, но естественно',
    prompt: `MODEL BEHAVIOR: Actively engaged with camera.
- Model is "working" the camera — creating visual interest
- Dynamic energy: weight shifts, subtle movement between frames
- Chin angles, shoulder positioning, deliberate but not stiff
- Eyes have intention and connection with lens
- Professional model technique visible but not overdone`,
    intensity: 'medium',
    cameraAwareness: 'engaged'
  },
  
  flirty: {
    id: 'flirty',
    label: 'Игривый / Заигрывание',
    description: 'Модель "флиртует" с камерой, соблазнительно',
    prompt: `MODEL BEHAVIOR: Flirty and seductive camera presence.

CRITICAL — THIS IS NOT ABOUT SEXUAL POSES. It's about ENERGY and ATTITUDE:
- Eyes that "see" the viewer — inviting, knowing, playful
- Subtle smile or barely-there smirk
- Head tilts that create intimacy
- Body language that draws the viewer in
- Like the model has a secret they might share
- Confident, almost teasing energy

PHYSICAL CUES (subtle, not exaggerated):
- Slightly parted lips
- One eyebrow micro-raised
- Chin down, eyes up through lashes
- Shoulder turned slightly toward camera
- Weight on back foot, hip shift
- Fingers touching face, hair, or clothing casually

AVOID:
- Duck face or pouting
- Hands on hips cliché
- Stiff "sexy pose" attempts
- Theatrical winking
- Overdone expressions`,
    intensity: 'high',
    cameraAwareness: 'seductive'
  },
  
  editorial_dramatic: {
    id: 'editorial_dramatic',
    label: 'Editorial драматичный',
    description: 'Сильные позы, модель = скульптура',
    prompt: `MODEL BEHAVIOR: High fashion editorial presence.

THE MODEL IS A SCULPTURE — every angle intentional:
- Strong, deliberate poses with clear lines
- Body creates geometric shapes and negative space
- Movement frozen at peak moment
- Eyes intense or completely disengaged (looking through camera)
- Hands and fingers have intention, not just hanging

POSING PRINCIPLES:
- Create triangles with limbs
- Use diagonals and asymmetry
- Elongate lines (neck, fingers, legs)
- One body part leads, others follow
- "S-curve" or "contrapposto" in standing poses
- If sitting: one leg forward, one back; never symmetrical

HEAD AND FACE:
- Neck elongated, chin slightly extended
- Strong jaw angles
- Eyes can be: intense/piercing, dreamy/distant, or closed
- Expression minimal but specific — not blank

AVOID:
- Symmetrical standing (soldier pose)
- Hands in pockets hiding body language
- Hunched shoulders
- Uncertain facial expression
- Looking at camera with "am I doing this right?" energy`,
    intensity: 'high',
    cameraAwareness: 'intense_or_detached'
  },
  
  dynamic: {
    id: 'dynamic',
    label: 'Динамичный / В движении',
    description: 'Модель в движении, энергия, action',
    prompt: `MODEL BEHAVIOR: Dynamic movement and action.

THE MODEL IS IN MOTION — not posing statically:
- Captured mid-stride, mid-turn, mid-gesture
- Hair and fabric showing movement
- Body weight shifting, not static
- Energy and momentum visible
- Like a film still from a sequence

MOVEMENT IDEAS:
- Walking toward or past camera
- Turning to look over shoulder
- Arms in gesture (adjusting clothes, touching hair)
- Stepping up/down, leaning forward/back
- Wind interaction (hair, clothes billowing)

PHYSICS MATTER:
- Motion blur on extremities (hands, hair tips) = authenticity
- Clothes follow body movement with slight delay
- Weight distribution realistic (not floating)

EXPRESSION:
- Caught between expressions, not frozen smile
- Eyes tracking movement direction
- Natural exertion micro-expressions if athletic

AVOID:
- Frozen "jump shot" with stiff body
- Fake running with both feet on ground
- Static pose with hair artificially blown`,
    intensity: 'high',
    cameraAwareness: 'action_focused'
  },
  
  vulnerable: {
    id: 'vulnerable',
    label: 'Открытый / Уязвимый',
    description: 'Искренность, без защит, intimate moment',
    prompt: `MODEL BEHAVIOR: Vulnerable and intimate.

THE MODEL IS UNGUARDED — this is about authenticity:
- No performance, no posing
- Genuine emotion visible in face and body
- Like a private moment accidentally witnessed
- Stillness and quiet energy
- Eyes that reveal inner state

BODY LANGUAGE:
- Shoulders may be rounded (not "proper posture")
- Arms close to body, self-comforting gestures
- Head tilted down or to side
- Curled or tucked positions if sitting/lying
- Hands doing something unconscious (fiddling, touching)

FACIAL EXPRESSION:
- Eyes unfocused or looking down
- No smile unless genuine/sad
- Imperfect asymmetry in expression
- The face between expressions

ATMOSPHERE:
- Quiet, contemplative mood
- Intimate framing
- Feels like a stolen moment

AVOID:
- Performative sadness
- Hands covering face cliché
- Theatrical vulnerability
- "Artsy" poses that feel contrived`,
    intensity: 'medium',
    cameraAwareness: 'internal'
  },
  
  powerful: {
    id: 'powerful',
    label: 'Мощный / Уверенный',
    description: 'Сила, уверенность, доминирование пространства',
    prompt: `MODEL BEHAVIOR: Powerful and commanding presence.

THE MODEL OWNS THE SPACE:
- Confident, grounded stance
- Takes up space deliberately
- Energy projects outward
- Unshakeable composure
- Like they belong exactly where they are

BODY LANGUAGE:
- Wide stance, feet firmly planted
- Shoulders back, chest open
- Chin level or slightly elevated
- Direct eye contact with camera (if looking at it)
- Hands relaxed but visible, not hidden

ENERGY:
- Quiet strength, not aggressive
- No need to prove anything
- Secure in themselves
- Magnetic presence that draws attention

POSING VARIATIONS:
- Standing: legs apart, weight centered
- Sitting: taking up space, one arm extended
- Leaning: against something, owning it
- Walking: purposeful stride, destination in mind

FACE:
- Neutral or slight smile
- Eyes steady and direct
- No tension in jaw or forehead
- Expression says "I know my worth"

AVOID:
- Aggressive or angry expression
- Arms crossed defensively
- Trying too hard to look tough
- Performative "power pose" clichés`,
    intensity: 'medium',
    cameraAwareness: 'confident_presence'
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
 * @returns {Object} { conflicts: boolean, reasons: string[], blockedBy: string[], warnings: string[], autoCorrections: Object }
 */
export function checkConflicts(currentSelections, paramToCheck, valueToCheck) {
  const conflicts = [];
  const warnings = [];
  const blockedBy = [];
  const autoCorrections = {};
  
  const TIME_LABELS = {
    night: 'Ночь', sunrise: 'Рассвет', midday: 'Полдень', sunset: 'Закат',
    golden_hour: 'Золотой час', blue_hour: 'Синий час', afternoon: 'День', any: 'Любое'
  };
  
  const WEATHER_LABELS = {
    clear: 'Ясно', overcast: 'Пасмурно', foggy: 'Туман', cloudy: 'Облачно',
    rainy: 'Дождь', any: 'Любая'
  };
  
  const SPACE_LABELS = {
    exterior: 'Улица', rooftop: 'Крыша', interior: 'Интерьер',
    interior_studio: 'Студия', interior_with_windows: 'Интерьер с окнами', mixed: 'Смешанное'
  };
  
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
      autoCorrections.lightingQuality = source.implies.lightingQuality;
    }
  }
  
  // 3. Check Lighting Source conflicts with Lighting Quality
  if (paramToCheck === 'lightingSource' && currentSelections.lightingQuality) {
    const quality = LIGHTING_QUALITY_PRESETS[currentSelections.lightingQuality];
    if (quality?.conflicts?.lightingSource?.includes(valueToCheck)) {
      conflicts.push(`"${quality.label}" не совместим с "${LIGHTING_SOURCE_PRESETS[valueToCheck]?.label}"`);
      blockedBy.push('lightingQuality');
    }
  }
  
  // 4. Check Lighting Quality conflicts with Lighting Source
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
      conflicts.push(`"${source?.label}" невозможен в "${TIME_LABELS[currentSelections.timeOfDay]}"`);
      blockedBy.push('timeOfDay');
    }
  }
  
  // 6. Check Time of Day conflicts with Lighting Quality
  if (paramToCheck === 'lightingQuality' && currentSelections.timeOfDay) {
    const quality = LIGHTING_QUALITY_PRESETS[valueToCheck];
    if (quality?.conflicts?.timeOfDay?.includes(currentSelections.timeOfDay)) {
      conflicts.push(`"${quality?.label}" невозможен в "${TIME_LABELS[currentSelections.timeOfDay]}"`);
      blockedBy.push('timeOfDay');
    }
  }
  
  // 7. Check Weather conflicts with Lighting Quality
  if (paramToCheck === 'lightingQuality' && currentSelections.weather) {
    const quality = LIGHTING_QUALITY_PRESETS[valueToCheck];
    if (quality?.conflicts?.weather?.includes(currentSelections.weather)) {
      conflicts.push(`"${quality?.label}" невозможен при погоде "${WEATHER_LABELS[currentSelections.weather]}"`);
      blockedBy.push('weather');
      // Auto-correction: switch to fallback
      if (quality?.autoBlockedWhen?.weather?.includes(currentSelections.weather)) {
        autoCorrections.lightingQuality = quality.autoBlockedWhen.fallback || 'soft_diffused';
      }
    }
  }
  
  // 8. Check Space Type conflicts with Lighting Source
  if (paramToCheck === 'lightingSource' && currentSelections.spaceType) {
    const source = LIGHTING_SOURCE_PRESETS[valueToCheck];
    if (source?.conflicts?.spaceType?.includes(currentSelections.spaceType)) {
      conflicts.push(`"${source?.label}" невозможен в локации "${SPACE_LABELS[currentSelections.spaceType]}"`);
      blockedBy.push('spaceType');
    }
  }
  
  // 9. Check Camera Aesthetic conflicts with Focus Mode
  if (paramToCheck === 'focusMode' && currentSelections.cameraAesthetic) {
    const camera = CAMERA_AESTHETIC_PRESETS[currentSelections.cameraAesthetic];
    if (camera?.focusConflicts?.includes(valueToCheck)) {
      conflicts.push(`Камера "${camera.label}" не поддерживает этот режим фокуса`);
      blockedBy.push('cameraAesthetic');
    }
    // Warnings (not blocking, just informational)
    if (camera?.warns?.focusMode === valueToCheck) {
      warnings.push(camera.warns.message);
    }
  }
  
  // 10. Check Camera Aesthetic implies (e.g., disposable implies deep_focus)
  if (paramToCheck === 'focusMode' && currentSelections.cameraAesthetic) {
    const camera = CAMERA_AESTHETIC_PRESETS[currentSelections.cameraAesthetic];
    if (camera?.implies?.focusMode && camera.implies.focusMode !== valueToCheck) {
      conflicts.push(`Камера "${camera.label}" требует режим "${camera.implies.focusMode}"`);
      blockedBy.push('cameraAesthetic');
      autoCorrections.focusMode = camera.implies.focusMode;
    }
  }
  
  // 11. Check Shot Size recommendations for Focus
  if (paramToCheck === 'focusMode' && currentSelections.shotSize) {
    const shotSizeFocusRecommendations = {
      'extreme_closeup': ['shallow_dof', 'very_shallow_dof'],
      'closeup': ['shallow_dof', 'moderate_dof'],
      'medium_closeup': ['shallow_dof', 'moderate_dof'],
      'medium': ['moderate_dof', 'shallow_dof'],
      'medium_wide': ['moderate_dof', 'deep_focus'],
      'wide': ['deep_focus', 'moderate_dof'],
      'extreme_wide': ['deep_focus']
    };
    
    const recommended = shotSizeFocusRecommendations[currentSelections.shotSize];
    if (recommended && !recommended.includes(valueToCheck)) {
      // Use human-readable labels
      const shotLabel = LABELS.shotSize[currentSelections.shotSize] || currentSelections.shotSize;
      const focusLabels = recommended.map(id => LABELS.focusMode[id] || id).join(' или ');
      warnings.push(`Для плана «${shotLabel}» лучше подходит: ${focusLabels}`);
    }
  }
  
  // 12. Check Capture Style conflicts with Shoot Type
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
    warnings,
    blockedBy,
    autoCorrections
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

/**
 * Validate all parameters and return conflicts, warnings, and auto-corrections
 * This is the main function to call before generating a prompt
 * @param {Object} params - All generation parameters
 * @returns {Object} { valid: boolean, conflicts: [], warnings: [], autoCorrections: {}, correctedParams: {} }
 */
export function validateAndCorrectParams(params) {
  const {
    shootType,
    cameraAesthetic,
    lightingSource,
    lightingQuality,
    focusMode,
    shotSize,
    timeOfDay,
    weather,
    spaceType,
    captureStyle
  } = params;
  
  const allConflicts = [];
  const allWarnings = [];
  const autoCorrections = {};
  
  // Create selection context
  const selections = { shootType, cameraAesthetic, lightingSource, lightingQuality, focusMode, shotSize, timeOfDay, weather, spaceType, captureStyle };
  
  // Check each current value against all rules
  const checks = [
    { param: 'lightingQuality', value: lightingQuality },
    { param: 'lightingSource', value: lightingSource },
    { param: 'focusMode', value: focusMode },
    { param: 'captureStyle', value: captureStyle }
  ];
  
  for (const { param, value } of checks) {
    if (value) {
      const result = checkConflicts(selections, param, value);
      if (result.conflicts) {
        allConflicts.push(...result.reasons);
      }
      if (result.warnings?.length > 0) {
        allWarnings.push(...result.warnings);
      }
      if (result.autoCorrections && Object.keys(result.autoCorrections).length > 0) {
        Object.assign(autoCorrections, result.autoCorrections);
      }
    }
  }
  
  // Apply auto-corrections to create corrected params
  const correctedParams = { ...params, ...autoCorrections };
  
  return {
    valid: allConflicts.length === 0,
    conflicts: allConflicts,
    warnings: allWarnings,
    autoCorrections,
    correctedParams
  };
}

// ═══════════════════════════════════════════════════════════════
// HUMAN-READABLE LABELS FOR ALL PARAMETERS
// ═══════════════════════════════════════════════════════════════

const LABELS = {
  // Focus Mode
  focusMode: {
    'very_shallow_dof': 'Сильное размытие фона',
    'shallow_dof': 'Размытый фон',
    'shallow': 'Размытый фон',
    'moderate_dof': 'Умеренная глубина',
    'deep_focus': 'Всё в резкости',
    'deep': 'Всё в резкости',
    'focus_face': 'Фокус на лице',
    'soft_focus': 'Мягкий фокус',
    'default': 'По умолчанию'
  },
  
  // Shot Size
  shotSize: {
    'extreme_closeup': 'Макро',
    'closeup': 'Крупный план',
    'medium_closeup': 'Портретный план',
    'medium_shot': 'Средний план',
    'medium': 'Средний план',
    'cowboy_shot': 'Американский план',
    'full_shot': 'Ростовой план',
    'wide_shot': 'Общий план',
    'wide': 'Общий план',
    'extreme_wide': 'Панорама'
  },
  
  // Lighting Quality
  lightingQuality: {
    'harsh_direct': 'Жёсткий свет',
    'soft_diffused': 'Мягкий свет',
    'contrasty': 'Контрастный',
    'flat': 'Плоский',
    'backlit': 'Контровой свет',
    'moody_lowkey': 'Атмосферный тёмный'
  },
  
  // Lighting Source
  lightingSource: {
    'natural_daylight': 'Дневной свет',
    'window_light': 'Свет из окна',
    'on_camera_flash': 'Вспышка',
    'studio_strobe': 'Студийный свет',
    'ring_flash': 'Кольцевой свет',
    'mixed_ambient': 'Смешанный свет',
    'practicals': 'Практические источники',
    'continuous_led': 'LED свет'
  },
  
  // Camera Aesthetic
  cameraAesthetic: {
    'none': 'Без стилизации',
    'contax_t2': 'Contax T2 (плёнка)',
    'hasselblad_mf': 'Hasselblad (средний формат)',
    'leica_m': 'Leica M (street)',
    'mamiya_rz67': 'Mamiya RZ67 (портрет)',
    'polaroid': 'Polaroid',
    'disposable': 'Одноразовая камера',
    'holga': 'Holga (toy camera)',
    'iphone': 'iPhone',
    'ricoh_gr': 'Ricoh GR (28mm)'
  },
  
  // Shoot Type
  shootType: {
    'catalog': 'Каталог',
    'editorial': 'Editorial',
    'street': 'Street / Documentary',
    'lookbook': 'Lookbook',
    'campaign': 'Рекламная кампания',
    'portrait': 'Портрет',
    'beauty': 'Beauty',
    'sport': 'Спорт'
  },
  
  // Model Behavior
  modelBehavior: {
    'natural': 'Естественное',
    'aware_relaxed': 'Расслабленный контакт',
    'engaged': 'Взаимодействие',
    'flirty': 'Игривый / Заигрывание',
    'editorial_dramatic': 'Editorial драматичный',
    'dynamic': 'Динамичный',
    'vulnerable': 'Открытый / Уязвимый',
    'powerful': 'Мощный / Уверенный'
  },
  
  // Lens Focal Length
  lensFocalLength: {
    'auto': 'Авто',
    'fisheye': 'Фишай (8-16mm)',
    'ultra_wide': 'Сверхширокий (16-24mm)',
    'wide': 'Широкий (24-35mm)',
    'standard': 'Стандартный (35-50mm)',
    'portrait': 'Портретный (85-105mm)',
    'telephoto': 'Телефото (135-200mm)',
    'super_telephoto': 'Супер-телефото (300mm+)'
  }
};

/**
 * Get human-readable label for a parameter value
 */
function getLabel(param, value) {
  return LABELS[param]?.[value] || value;
}

/**
 * Get recommendations for a specific parameter based on current context
 * @param {Object} context - Current parameter context
 * @param {string} param - Parameter to get recommendations for
 * @returns {Object} { recommended: [], avoid: [], info: string }
 */
export function getParameterRecommendations(context, param) {
  const recommendations = { recommended: [], avoid: [], info: '' };
  
  // Shot Size → Focus Mode recommendations
  if (param === 'focusMode' && context.shotSize) {
    const shotFocusMap = {
      'extreme_closeup': { recommended: ['very_shallow_dof', 'shallow_dof'], info: 'Крупный план красиво смотрится с размытием фона' },
      'closeup': { recommended: ['shallow_dof'], info: 'Портретный план лучше с размытым фоном' },
      'medium_closeup': { recommended: ['shallow_dof', 'moderate_dof'], info: 'Классический портрет' },
      'medium': { recommended: ['moderate_dof'], info: 'Средний план — умеренная глубина резкости' },
      'medium_wide': { recommended: ['moderate_dof', 'deep_focus'], info: 'Показываем окружение' },
      'wide': { recommended: ['deep_focus'], avoid: ['shallow_dof'], info: 'Общий план — всё должно быть в фокусе' },
      'extreme_wide': { recommended: ['deep_focus'], avoid: ['shallow_dof', 'very_shallow_dof'], info: 'Панорамный кадр' }
    };
    
    const rec = shotFocusMap[context.shotSize];
    if (rec) {
      // Convert IDs to labels
      recommendations.recommended = rec.recommended?.map(id => getLabel('focusMode', id)) || [];
      recommendations.avoid = rec.avoid?.map(id => getLabel('focusMode', id)) || [];
      recommendations.info = rec.info || '';
    }
  }
  
  // Time of Day → Lighting Quality recommendations
  if (param === 'lightingQuality' && context.timeOfDay) {
    const timeQualityMap = {
      'golden_hour': { recommended: ['backlit', 'soft_diffused', 'contrasty'], info: 'Золотой час — мягкий тёплый свет' },
      'midday': { recommended: ['harsh_direct', 'contrasty'], avoid: ['moody_lowkey'], info: 'Полдень — жёсткий свет сверху' },
      'blue_hour': { recommended: ['moody_lowkey', 'soft_diffused'], avoid: ['harsh_direct'], info: 'Синий час — мягкое свечение' },
      'night': { recommended: ['moody_lowkey', 'contrasty'], avoid: ['soft_diffused'], info: 'Ночь — контрастный свет от источников' },
      'overcast': { recommended: ['soft_diffused', 'flat'], avoid: ['harsh_direct'], info: 'Пасмурно — естественный рассеянный свет' }
    };
    
    const rec = timeQualityMap[context.timeOfDay];
    if (rec) {
      recommendations.recommended = rec.recommended?.map(id => getLabel('lightingQuality', id)) || [];
      recommendations.avoid = rec.avoid?.map(id => getLabel('lightingQuality', id)) || [];
      recommendations.info = rec.info || '';
    }
  }
  
  // Space Type → Lighting Source recommendations
  if (param === 'lightingSource' && context.spaceType) {
    const spaceSourceMap = {
      'exterior': { recommended: ['natural_daylight', 'on_camera_flash'], avoid: ['studio_strobe', 'ring_flash', 'continuous_led'], info: 'На улице — естественный свет или вспышка' },
      'rooftop': { recommended: ['natural_daylight'], avoid: ['studio_strobe', 'ring_flash'], info: 'Крыша — открытое небо' },
      'interior_studio': { recommended: ['studio_strobe', 'ring_flash', 'continuous_led'], avoid: ['natural_daylight'], info: 'Студия — контролируемое освещение' },
      'interior_with_windows': { recommended: ['window_light', 'natural_daylight', 'practicals'], info: 'Интерьер с окнами — смешанный свет' },
      'interior': { recommended: ['practicals', 'continuous_led', 'mixed_ambient'], info: 'Интерьер — ambient освещение' }
    };
    
    const rec = spaceSourceMap[context.spaceType];
    if (rec) {
      recommendations.recommended = rec.recommended?.map(id => getLabel('lightingSource', id)) || [];
      recommendations.avoid = rec.avoid?.map(id => getLabel('lightingSource', id)) || [];
      recommendations.info = rec.info || '';
    }
  }
  
  // Shoot Type → Camera Aesthetic recommendations
  if (param === 'cameraAesthetic' && context.shootType) {
    const shootCameraMap = {
      'editorial': { recommended: ['hasselblad_mf', 'mamiya_rz67', 'leica_m', 'contax_t2'], info: 'Editorial — высокое качество изображения' },
      'street': { recommended: ['leica_m', 'ricoh_gr', 'contax_t2', 'disposable'], info: 'Street — компактные камеры с характером' },
      'catalog': { recommended: ['hasselblad_mf', 'none'], avoid: ['holga', 'disposable'], info: 'Каталог — чистое качество без стилизации' },
      'beauty': { recommended: ['hasselblad_mf', 'mamiya_rz67'], avoid: ['iphone', 'disposable'], info: 'Beauty — максимальная детализация' },
      'sport': { recommended: ['none', 'ricoh_gr'], info: 'Спорт — нейтральный look' }
    };
    
    const rec = shootCameraMap[context.shootType];
    if (rec) {
      recommendations.recommended = rec.recommended?.map(id => getLabel('cameraAesthetic', id)) || [];
      recommendations.avoid = rec.avoid?.map(id => getLabel('cameraAesthetic', id)) || [];
      recommendations.info = rec.info || '';
    }
  }
  
  return recommendations;
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
    era: ERA_PRESETS,
    modelBehavior: MODEL_BEHAVIOR_PRESETS,
    lensFocalLength: LENS_FOCAL_LENGTH_PRESETS
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
    era: ERA_PRESETS,
    modelBehavior: MODEL_BEHAVIOR_PRESETS,
    lensFocalLength: LENS_FOCAL_LENGTH_PRESETS
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
    era: ERA_PRESETS,
    modelBehavior: MODEL_BEHAVIOR_PRESETS,
    lensFocalLength: LENS_FOCAL_LENGTH_PRESETS
  };
}

