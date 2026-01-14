/**
 * Custom Shoot V5 Schema
 * 
 * NEW ARCHITECTURE:
 * 1. TECHNICAL PARAMETERS — Set by CLEAR, EXPLICIT specs (like a camera setup)
 * 2. ARTISTIC PARAMETERS — Set by DETAILED NARRATIVE description (mood, atmosphere)
 * 3. SMART DEPENDENCY MATRIX — Ensures no contradictions between parameters
 * 
 * The key insight:
 * - Technical params are WHAT the camera does (physics-based, deterministic)
 * - Artistic params are WHAT we want to feel (subjective, narrative-based)
 * - Dependency Matrix prevents physically impossible combinations
 */

// ═══════════════════════════════════════════════════════════════
// SECTION 1: TECHNICAL PARAMETERS (Camera Setup)
// These are STRICT, DETERMINISTIC specs like a photographer would set
// ═══════════════════════════════════════════════════════════════

export const TECH_CAMERA = {
  id: 'camera',
  label: '📷 Camera System',
  description: 'Sensor and body characteristics',
  options: [
    {
      value: 'high_end_digital',
      label: 'High-End Digital (Sony A1 / Canon R5)',
      spec: 'CAMERA: Digital High-Res, 14+ stops DR. Clean signal, massive dynamic range, no noise.',
      constraints: { minISO: 100, maxISO: 51200, fixedAperture: false }
    },
    {
      value: 'prosumer_digital',
      label: 'Prosumer Digital (Sony A7 / Canon R6)',
      spec: 'CAMERA: Digital Full-Frame, 12-14 stops DR. Good balance of detail and noise.',
      constraints: { minISO: 100, maxISO: 25600, fixedAperture: false }
    },
    {
      value: 'apsc_mirrorless',
      label: 'APS-C Mirrorless',
      spec: 'CAMERA: APS-C Sensor, 10-12 stops DR. Slight noise at high ISO, 1.5x crop factor.',
      constraints: { minISO: 100, maxISO: 12800, fixedAperture: false }
    },
    {
      value: 'medium_format_film',
      label: 'Medium Format Film (Hasselblad/Mamiya)',
      spec: 'CAMERA: Medium Format Film, 6x7 negative. Organic fine grain, rich tonal rollover, film response curve.',
      constraints: { minISO: 50, maxISO: 800, fixedAperture: false, filmGrain: true }
    },
    {
      value: '35mm_film',
      label: '35mm Film (Canon AE-1 / Contax)',
      spec: 'CAMERA: 35mm Film. Visible grain structure, organic tonality, nostalgic rendering.',
      constraints: { minISO: 100, maxISO: 3200, fixedAperture: false, filmGrain: true }
    },
    {
      value: 'smartphone',
      label: 'Smartphone (iPhone/Pixel)',
      spec: 'CAMERA: Smartphone Sensor, computational HDR, local contrast enhancement, slight over-sharpening.',
      constraints: { minISO: 32, maxISO: 6400, fixedAperture: true, computationalHDR: true }
    },
    {
      value: 'disposable',
      label: 'Disposable Camera',
      spec: 'CAMERA: Disposable, single-element plastic lens, fixed focus at 4m, fixed f/10, built-in flash.',
      constraints: { fixedAperture: true, fixedFocus: true, apertureValue: 'f/10', builtInFlash: true }
    },
    {
      value: 'instant_polaroid',
      label: 'Instant (Polaroid/Instax)',
      spec: 'CAMERA: Instant Film, low contrast, soft focus, chemical color shift, white border frame.',
      constraints: { fixedAperture: true, instantChemistry: true }
    },
    {
      value: 'toy_lomo',
      label: 'Toy Camera (Holga/Lomo)',
      spec: 'CAMERA: Plastic Lens, heavy vignettes, light leaks, soft edges, unpredictable exposure.',
      constraints: { fixedAperture: true, vignette: true, lightLeaks: true }
    }
  ]
};

export const TECH_FOCAL = {
  id: 'focalLength',
  label: '🔭 Focal Length',
  description: 'Lens focal length and perspective',
  options: [
    {
      value: 'fisheye',
      label: 'Fisheye (8-15mm)',
      spec: 'LENS: 8-15mm Fisheye. MANDATORY: Extreme barrel distortion, curved horizon, "peeping hole" effect. Objects near edges are stretched.',
      constraints: { distortion: 'extreme_barrel', perspective: 'exaggerated', minFocusDistance: 0.15 }
    },
    {
      value: 'ultrawide',
      label: 'Ultra-Wide (14-24mm)',
      spec: 'LENS: 14-24mm Ultra-Wide. Strong perspective distortion, exaggerated foreground-to-background separation, lines converge dramatically.',
      constraints: { distortion: 'moderate_barrel', perspective: 'exaggerated', minFocusDistance: 0.2 }
    },
    {
      value: 'wide',
      label: 'Wide (24-35mm)',
      spec: 'LENS: 24-35mm Wide. Contextual view, slight perspective elongation at edges, good for environmental portraits.',
      constraints: { distortion: 'slight', perspective: 'natural_wide', minFocusDistance: 0.3 }
    },
    {
      value: 'standard',
      label: 'Standard (35-50mm)',
      spec: 'LENS: 35-50mm Standard. Neutral human-eye perspective, zero distortion, most "honest" rendering.',
      constraints: { distortion: 'none', perspective: 'natural', minFocusDistance: 0.4 }
    },
    {
      value: 'portrait',
      label: 'Portrait (85-105mm)',
      spec: 'LENS: 85-105mm Portrait. Flattering compression, subject isolation, beautiful bokeh, no distortion.',
      constraints: { distortion: 'none', perspective: 'compressed', minFocusDistance: 0.8, idealForBokeh: true }
    },
    {
      value: 'telephoto',
      label: 'Telephoto (135-200mm)',
      spec: 'LENS: 135-200mm Telephoto. Strong compression, background appears closer to subject, voyeuristic distance.',
      constraints: { distortion: 'none', perspective: 'highly_compressed', minFocusDistance: 1.2 }
    },
    {
      value: 'super_telephoto',
      label: 'Super Telephoto (300mm+)',
      spec: 'LENS: 300mm+ Super-Tele. Extreme compression, flat stacking of planes, surveillance/paparazzi feel.',
      constraints: { distortion: 'none', perspective: 'extremely_compressed', minFocusDistance: 2.5 }
    }
  ]
};

export const TECH_APERTURE = {
  id: 'aperture',
  label: '⚫ Aperture',
  description: 'F-stop and depth of field',
  options: [
    {
      value: 'wide_open',
      label: 'Wide Open (f/1.4-2.0)',
      spec: 'APERTURE: f/1.4-2.0 wide open. Razor-thin depth of field. Background completely obliterated in creamy bokeh. Only eyes/focal point sharp.',
      constraints: { dof: 'razor_thin', bokeh: 'extreme', lightGathering: 'maximum' }
    },
    {
      value: 'fast',
      label: 'Fast (f/2.8-4)',
      spec: 'APERTURE: f/2.8-4. Shallow depth of field. Subject sharp, background recognizably soft but not obliterated.',
      constraints: { dof: 'shallow', bokeh: 'moderate', lightGathering: 'good' }
    },
    {
      value: 'moderate',
      label: 'Moderate (f/5.6-8)',
      spec: 'APERTURE: f/5.6-8. Medium depth of field. Subject and immediate environment are sharp, distant background soft.',
      constraints: { dof: 'medium', bokeh: 'slight', lightGathering: 'moderate' }
    },
    {
      value: 'stopped_down',
      label: 'Stopped Down (f/11-16)',
      spec: 'APERTURE: f/11-16. Deep depth of field. Everything from 1m to infinity is acceptably sharp.',
      constraints: { dof: 'deep', bokeh: 'none', lightGathering: 'limited' }
    },
    {
      value: 'hyperfocal',
      label: 'Hyperfocal (f/16-22)',
      spec: 'APERTURE: f/16-22. Maximum depth of field. Everything from foreground to infinity is sharp. Possible diffraction softening.',
      constraints: { dof: 'maximum', bokeh: 'none', lightGathering: 'minimal', diffractionRisk: true }
    }
  ]
};

export const TECH_SHUTTER = {
  id: 'shutterSpeed',
  label: '⏱️ Shutter Speed',
  description: 'Motion handling and exposure time',
  options: [
    {
      value: 'freeze_fast',
      label: 'Freeze Action (1/1000+)',
      spec: 'SHUTTER: 1/1000s or faster. All motion frozen solid. Water droplets suspended, hair strands visible mid-air.',
      constraints: { motionBlur: 'none', lightRequired: 'high' }
    },
    {
      value: 'freeze_normal',
      label: 'Freeze Normal (1/250-1/500)',
      spec: 'SHUTTER: 1/250-1/500s. Normal motion frozen. Walking figures sharp, slight micro-blur on fastest movements.',
      constraints: { motionBlur: 'micro', lightRequired: 'moderate' }
    },
    {
      value: 'balanced',
      label: 'Balanced (1/60-1/125)',
      spec: 'SHUTTER: 1/60-1/125s. Stationary subjects sharp. Moving elements show slight motion blur. Natural handheld.',
      constraints: { motionBlur: 'slight', lightRequired: 'normal' }
    },
    {
      value: 'slow',
      label: 'Slow (1/15-1/30)',
      spec: 'SHUTTER: 1/15-1/30s. Stationary subjects sharp if camera is stable. Moving elements show noticeable blur trails.',
      constraints: { motionBlur: 'noticeable', lightRequired: 'low', tripodRecommended: true }
    },
    {
      value: 'motion_blur',
      label: 'Motion Blur (1/4-1/8)',
      spec: 'SHUTTER: 1/4-1/8s. Artistic motion blur. Moving subjects become streaks. Tripod required for sharp static elements.',
      constraints: { motionBlur: 'strong', lightRequired: 'low', tripodRequired: true }
    },
    {
      value: 'long_exposure',
      label: 'Long Exposure (1s+)',
      spec: 'SHUTTER: 1 second or longer. Extreme motion blur. Light trails, silky water, ghost figures. Tripod mandatory.',
      constraints: { motionBlur: 'extreme', lightRequired: 'very_low', tripodRequired: true }
    }
  ]
};

export const TECH_LIGHT_SOURCE = {
  id: 'lightSource',
  label: '💡 Light Source',
  description: 'Primary illumination type',
  options: [
    {
      value: 'direct_sun',
      label: 'Direct Hard Sun',
      spec: 'LIGHT SOURCE: Direct sunlight (point source). Casts sharp, defined, high-contrast shadows with hard edges.',
      constraints: { shadowType: 'hard', colorTemp: 5500, outdoor: true, requiresClearSky: true }
    },
    {
      value: 'golden_hour',
      label: 'Golden Hour Sun',
      spec: 'LIGHT SOURCE: Low-angle sun (1-2hrs before sunset). Long soft shadows, golden/orange flare potential, warm directional light.',
      constraints: { shadowType: 'soft_directional', colorTemp: 3500, outdoor: true, requiresClearSky: true, timeRestricted: true }
    },
    {
      value: 'blue_hour',
      label: 'Blue Hour',
      spec: 'LIGHT SOURCE: Skylight only (after sunset). Soft, cool, diffused light. No direct sun, shadowless or very soft shadows.',
      constraints: { shadowType: 'minimal', colorTemp: 7000, outdoor: true, timeRestricted: true }
    },
    {
      value: 'overcast',
      label: 'Overcast Sky',
      spec: 'LIGHT SOURCE: Overcast sky (giant softbox). Shadowless, even, flat illumination from all directions.',
      constraints: { shadowType: 'none', colorTemp: 6500, outdoor: true, requiresOvercast: true }
    },
    {
      value: 'open_shade',
      label: 'Open Shade',
      spec: 'LIGHT SOURCE: Open shade (indirect skylight). Soft directional light, cool shadows, subject protected from direct sun.',
      constraints: { shadowType: 'soft', colorTemp: 7000, outdoor: true }
    },
    {
      value: 'window',
      label: 'Window Light',
      spec: 'LIGHT SOURCE: Window light. Directional soft source with rapid falloff into shadow. Natural gradient across face.',
      constraints: { shadowType: 'soft_gradient', colorTemp: 5500, indoor: true }
    },
    {
      value: 'studio_softbox',
      label: 'Studio Softbox',
      spec: 'LIGHT SOURCE: Large softbox/octabox (controlled diffused). Smooth gradients, no harsh shadow edges, studio environment.',
      constraints: { shadowType: 'controlled_soft', colorTemp: 5500, indoor: true, studioOnly: true }
    },
    {
      value: 'studio_hard',
      label: 'Studio Hard Light',
      spec: 'LIGHT SOURCE: Fresnel/standard reflector (controlled hard). Theatrical high contrast, sharp shadow edges, dramatic.',
      constraints: { shadowType: 'controlled_hard', colorTemp: 5500, indoor: true, studioOnly: true }
    },
    {
      value: 'flash_fill',
      label: 'Fill Flash',
      spec: 'LIGHT SOURCE: Mixed (sun + on-axis fill flash). Subject bright, shadows lifted, slightly artificial fill-flash look.',
      constraints: { shadowType: 'filled', colorTemp: 'mixed', flashRequired: true }
    },
    {
      value: 'practicals',
      label: 'Practical Lights',
      spec: 'LIGHT SOURCE: Practical sources (neon, lamps, streetlights) visible in scene as primary illumination. Mixed colors.',
      constraints: { shadowType: 'mixed', colorTemp: 'mixed', practicals: true }
    },
    {
      value: 'mixed',
      label: 'Mixed Sources',
      spec: 'LIGHT SOURCE: Mixed color temperatures (e.g., tungsten interior + daylight exterior). Intentional color conflict.',
      constraints: { shadowType: 'complex', colorTemp: 'mixed' }
    }
  ]
};

export const TECH_LIGHT_DIRECTION = {
  id: 'lightDirection',
  label: '🔦 Light Direction',
  description: 'Angle of primary light source relative to subject',
  options: [
    {
      value: 'front',
      label: 'Front (0°)',
      spec: 'LIGHT DIRECTION: Front-lit (from camera). Flat lighting, minimal shadows on face, documentary feel.',
      constraints: { shadowsOnFace: 'minimal', drama: 'low' }
    },
    {
      value: 'front_45',
      label: 'Rembrandt (45°)',
      spec: 'LIGHT DIRECTION: 45° front-side (Rembrandt). Classic portrait lighting, triangle shadow under eye, sculpted.',
      constraints: { shadowsOnFace: 'triangular', drama: 'medium' }
    },
    {
      value: 'side',
      label: 'Side (90°)',
      spec: 'LIGHT DIRECTION: Side-lit (90°). Half face in light, half in shadow. Split lighting, dramatic.',
      constraints: { shadowsOnFace: 'split', drama: 'high' }
    },
    {
      value: 'back_side',
      label: 'Back-Side (135°)',
      spec: 'LIGHT DIRECTION: Back-side (rim light). Edge of face lit, creates glowing outline. Most of face in shadow.',
      constraints: { shadowsOnFace: 'heavy', drama: 'high', rimLight: true }
    },
    {
      value: 'backlight',
      label: 'Backlight (180°)',
      spec: 'LIGHT DIRECTION: Backlit (contre-jour). Light directly behind subject. Silhouette potential, halo effect, lens flare risk.',
      constraints: { shadowsOnFace: 'full', drama: 'very_high', silhouetteRisk: true, flareRisk: true }
    },
    {
      value: 'top',
      label: 'Top (Noon)',
      spec: 'LIGHT DIRECTION: Top-down (noon sun/overhead). Deep shadows under eyes, nose, chin. Harsh, unflattering for faces.',
      constraints: { shadowsOnFace: 'under_features', drama: 'medium', unflattering: true }
    },
    {
      value: 'bottom',
      label: 'Bottom (Underlighting)',
      spec: 'LIGHT DIRECTION: Underlighting (from below). Unnatural, eerie, horror-movie effect. Rarely used except for stylization.',
      constraints: { shadowsOnFace: 'reversed', drama: 'extreme', unnatural: true }
    }
  ]
};

export const TECH_LIGHT_QUALITY = {
  id: 'lightQuality',
  label: '✨ Light Quality',
  description: 'Hardness/softness of light',
  options: [
    {
      value: 'hard',
      label: 'Hard',
      spec: 'LIGHT QUALITY: Hard light. Sharp shadow edges, high contrast, texture emphasized, small apparent source.',
      constraints: { shadowEdge: 'sharp', contrast: 'high', textureEmphasis: true }
    },
    {
      value: 'medium',
      label: 'Medium',
      spec: 'LIGHT QUALITY: Medium light. Gradual shadow transition, moderate contrast, balanced texture.',
      constraints: { shadowEdge: 'gradual', contrast: 'medium', textureEmphasis: 'moderate' }
    },
    {
      value: 'soft',
      label: 'Soft',
      spec: 'LIGHT QUALITY: Soft light. Diffused shadow edges, low contrast, flattering for skin, large apparent source.',
      constraints: { shadowEdge: 'diffused', contrast: 'low', flattering: true }
    },
    {
      value: 'diffused',
      label: 'Diffused/Flat',
      spec: 'LIGHT QUALITY: Fully diffused. Almost shadowless, very low contrast, flat illumination, overcast effect.',
      constraints: { shadowEdge: 'none', contrast: 'very_low', flat: true }
    }
  ]
};

export const TECH_WHITE_BALANCE = {
  id: 'whiteBalance',
  label: '🌡️ White Balance',
  description: 'Color temperature in Kelvin',
  options: [
    {
      value: 'tungsten',
      label: 'Tungsten (3200K)',
      spec: 'WHITE BALANCE: 3200K Tungsten. Strong warm/orange cast. Indoor incandescent look.',
      constraints: { kelvin: 3200, cast: 'warm_orange' }
    },
    {
      value: 'warm',
      label: 'Warm (4000K)',
      spec: 'WHITE BALANCE: 4000K Warm. Golden warmth, pleasing skin tones, sunset-like.',
      constraints: { kelvin: 4000, cast: 'warm_golden' }
    },
    {
      value: 'daylight',
      label: 'Daylight (5500K)',
      spec: 'WHITE BALANCE: 5500K Neutral Daylight. Accurate white point, natural colors.',
      constraints: { kelvin: 5500, cast: 'neutral' }
    },
    {
      value: 'cloudy',
      label: 'Cloudy (6500K)',
      spec: 'WHITE BALANCE: 6500K Cloudy. Slight warm compensation for overcast sky.',
      constraints: { kelvin: 6500, cast: 'slight_warm' }
    },
    {
      value: 'shade',
      label: 'Shade (7500K)',
      spec: 'WHITE BALANCE: 7500K Shade. Strong warm compensation for cool blue shade.',
      constraints: { kelvin: 7500, cast: 'strong_warm' }
    },
    {
      value: 'cool',
      label: 'Cool Blue (9000K+)',
      spec: 'WHITE BALANCE: 9000K+ Cool. Blue/cyan cast. Night, moonlight, or clinical feel.',
      constraints: { kelvin: 9000, cast: 'cool_blue' }
    }
  ]
};

export const TECH_EXPOSURE = {
  id: 'exposure',
  label: '📊 Exposure Compensation',
  description: 'Intentional over/underexposure',
  options: [
    {
      value: 'under_heavy',
      label: 'Heavy Under (-1.0 to -1.5 EV)',
      spec: 'EXPOSURE: -1.0 to -1.5 EV (Low Key). Crushed shadows, protected highlights. Moody, dramatic, noir.',
      constraints: { evComp: -1.3, mood: 'moody', shadowDetail: 'crushed' }
    },
    {
      value: 'under_slight',
      label: 'Slight Under (-0.3 to -0.7 EV)',
      spec: 'EXPOSURE: -0.3 to -0.7 EV. Rich color saturation preserved, deep sky, controlled highlights.',
      constraints: { evComp: -0.5, mood: 'rich', shadowDetail: 'preserved' }
    },
    {
      value: 'neutral',
      label: 'Neutral (0 EV)',
      spec: 'EXPOSURE: 0 EV Balanced. Standard metering, balanced histogram.',
      constraints: { evComp: 0, mood: 'balanced', shadowDetail: 'full' }
    },
    {
      value: 'over_slight',
      label: 'Slight Over (+0.3 to +0.7 EV)',
      spec: 'EXPOSURE: +0.3 to +0.7 EV. Open shadows, airy feel, bright and optimistic.',
      constraints: { evComp: 0.5, mood: 'airy', highlightDetail: 'slight_loss' }
    },
    {
      value: 'over_heavy',
      label: 'Heavy Over (+1.0 to +1.5 EV)',
      spec: 'EXPOSURE: +1.0 to +1.5 EV (High Key). Blown highlights intentional, dreamy/ethereal, bright.',
      constraints: { evComp: 1.3, mood: 'dreamy', highlightDetail: 'blown' }
    }
  ]
};

export const TECH_CONTRAST = {
  id: 'contrastCurve',
  label: '📈 Contrast Curve',
  description: 'Tonal curve applied to image',
  options: [
    {
      value: 's_curve_high',
      label: 'High Contrast S-Curve',
      spec: 'CONTRAST: Strong S-Curve. Deep blacks, bright whites, punchy midtones. High visual impact.',
      constraints: { blackPoint: 'crushed', whitePoint: 'bright', midtones: 'punchy' }
    },
    {
      value: 's_curve_moderate',
      label: 'Moderate S-Curve',
      spec: 'CONTRAST: Standard S-Curve. Classic film-like response, balanced contrast.',
      constraints: { blackPoint: 'deep', whitePoint: 'clean', midtones: 'balanced' }
    },
    {
      value: 'linear',
      label: 'Linear',
      spec: 'CONTRAST: Linear/Neutral. No aggressive curve, natural tonal response.',
      constraints: { blackPoint: 'natural', whitePoint: 'natural', midtones: 'neutral' }
    },
    {
      value: 'flat_lifted',
      label: 'Flat/Lifted Blacks',
      spec: 'CONTRAST: Flat with lifted blacks (matte look). Reduced dynamic range, faded/matte aesthetic.',
      constraints: { blackPoint: 'lifted', whitePoint: 'soft', midtones: 'flat' }
    },
    {
      value: 'crushed',
      label: 'Crushed Blacks',
      spec: 'CONTRAST: Crushed blacks. Black point clipped for graphic effect, high contrast shadows.',
      constraints: { blackPoint: 'clipped', whitePoint: 'normal', midtones: 'contrasty' }
    }
  ]
};

// ═══════════════════════════════════════════════════════════════
// SECTION 2: ARTISTIC PARAMETERS (Narrative Description)
// These are SUBJECTIVE, INTERPRETIVE — described narratively
// ═══════════════════════════════════════════════════════════════

export const ART_MOOD = {
  id: 'visualMood',
  label: '💫 Visual Atmosphere',
  description: 'The overall feeling and energy of the image',
  options: [
    {
      value: 'playful_summer',
      label: 'Playful / Summer',
      narrative: 'ATMOSPHERE: Playful summer energy — bright saturated colors, warm golden light, sense of heat and carefree joy. The image radiates optimism and youth, like a perfect day at the beach or playground.',
      colorPalette: 'vivid, warm, saturated',
      energy: 'high'
    },
    {
      value: 'confident_bold',
      label: 'Confident / Bold',
      narrative: 'ATMOSPHERE: Confident and bold — high contrast, strong graphic composition, dominant shapes and colors. The image feels assertive, powerful, commanding attention without trying too hard.',
      colorPalette: 'high contrast, primary colors',
      energy: 'high'
    },
    {
      value: 'melancholic',
      label: 'Melancholic / Romantic',
      narrative: 'ATMOSPHERE: Melancholic romance — soft diffused light, muted pastels, a gentle haze. The image feels wistful, tender, like a half-remembered dream or a moment just before parting.',
      colorPalette: 'muted, pastels, cool',
      energy: 'low'
    },
    {
      value: 'edgy_raw',
      label: 'Edgy / Raw',
      narrative: 'ATMOSPHERE: Edgy and raw — harsh contrast, gritty textures, visible imperfections. The image feels honest, unpolished, with a punk or documentary edge. Nothing is hidden.',
      colorPalette: 'desaturated, gritty',
      energy: 'medium'
    },
    {
      value: 'serene',
      label: 'Serene / Calm',
      narrative: 'ATMOSPHERE: Serene calm — soft even light, low contrast, minimal color palette. The image feels meditative, peaceful, like a quiet morning or zen garden.',
      colorPalette: 'minimal, monochrome-ish',
      energy: 'very_low'
    },
    {
      value: 'energetic',
      label: 'Energetic / Dynamic',
      narrative: 'ATMOSPHERE: Explosive energy — dynamic angles, motion blur allowed, bright accent colors. The image captures peak action, adrenaline, the split second of movement.',
      colorPalette: 'vivid accents, high saturation',
      energy: 'explosive'
    },
    {
      value: 'sensual',
      label: 'Sensual / Intimate',
      narrative: 'ATMOSPHERE: Sensual intimacy — warm skin tones, soft focus edges, shallow depth of field. The image feels close, private, like a whispered conversation or gentle touch.',
      colorPalette: 'warm, skin-focused',
      energy: 'low'
    },
    {
      value: 'mysterious',
      label: 'Mysterious / Noir',
      narrative: 'ATMOSPHERE: Mysterious noir — deep shadows hiding half the scene, dramatic lighting, a sense of secrets. The image suggests more than it shows, like a still from a thriller.',
      colorPalette: 'dark, shadows dominant',
      energy: 'medium'
    },
    {
      value: 'fresh_clean',
      label: 'Fresh / Clean',
      narrative: 'ATMOSPHERE: Fresh and clean — bright whites, minimal shadows, airy space. The image feels new, pure, like fresh laundry or morning light through curtains.',
      colorPalette: 'white, bright, minimal',
      energy: 'medium'
    },
    {
      value: 'gritty_urban',
      label: 'Gritty / Urban',
      narrative: 'ATMOSPHERE: Gritty urban — concrete textures, neon accents, dusk or night. The image feels streetwise, real, with the pulse of a city after dark.',
      colorPalette: 'neon + concrete gray',
      energy: 'medium'
    }
  ]
};

export const ART_ERA = {
  id: 'decade',
  label: '🎬 Visual Era',
  description: 'The decade/period the image evokes',
  options: [
    {
      value: '70s',
      label: '1970s',
      narrative: 'ERA: 1970s aesthetic — warm golden tones, heavy film grain, soft focus, analog warmth. Think disco, analog synths, Kodachrome slides.',
      references: 'Kodachrome, Stephen Shore, William Eggleston'
    },
    {
      value: '80s',
      label: '1980s',
      narrative: 'ERA: 1980s aesthetic — bright saturated colors, direct flash, glossy surfaces, geometric patterns. Think MTV, neon, Helmut Newton.',
      references: 'Helmut Newton, Patrick Nagel, MTV'
    },
    {
      value: '90s',
      label: '1990s',
      narrative: 'ERA: 1990s aesthetic — grunge, candid moments, desaturated film, natural light, anti-glam. Think Kate Moss, Corinne Day, heroin chic.',
      references: 'Corinne Day, Juergen Teller, The Face'
    },
    {
      value: 'y2k',
      label: 'Y2K (2000-2005)',
      narrative: 'ERA: Y2K aesthetic — early digital, harsh flash, plastic fantastic, acid colors, cyber-pop. Think Paris Hilton, Nokia, Terry Richardson.',
      references: 'Terry Richardson, i-D digital era, early Instagram'
    },
    {
      value: '2010s',
      label: '2010s',
      narrative: 'ERA: 2010s aesthetic — VSCO filters, lifted blacks, desaturated teal-orange, Instagram era. Think iPhone photography, Pinterest.',
      references: 'VSCO, Instagram aesthetic, Petra Collins'
    },
    {
      value: 'contemporary',
      label: 'Contemporary (2020s)',
      narrative: 'ERA: Contemporary 2020s — clean digital, intentional color grading, mix of film and digital, thoughtful compositions. Current editorial standard.',
      references: 'Current Vogue, Dazed, i-D, Studio Olafur Eliasson'
    }
  ]
};

export const ART_CONTEXT = {
  id: 'culturalContext',
  label: '📰 Cultural Context',
  description: 'The type of publication/media this image would appear in',
  options: [
    {
      value: 'editorial',
      label: 'Editorial Magazine',
      narrative: 'CONTEXT: High-fashion editorial magazine (i-D, Dazed, Vogue Italia). Artistic vision prioritized, storytelling through visuals, avant-garde acceptable.',
      standards: 'artistic, conceptual, storytelling'
    },
    {
      value: 'campaign',
      label: 'Ad Campaign',
      narrative: 'CONTEXT: Commercial advertising campaign (Nike, Apple, luxury brands). Product clarity essential, brand message clear, professional polish.',
      standards: 'commercial, polished, product-focused'
    },
    {
      value: 'ugc',
      label: 'UGC / Social Media',
      narrative: 'CONTEXT: User-generated content, TikTok/Instagram native. Authentic, relatable, "shot by a friend" feel. Anti-polished, real.',
      standards: 'authentic, casual, relatable'
    },
    {
      value: 'street',
      label: 'Street / Documentary',
      narrative: 'CONTEXT: Street photography or documentary. Observational, non-posed, capturing real moments. Journalistic integrity.',
      standards: 'observational, honest, unposed'
    },
    {
      value: 'fine_art',
      label: 'Fine Art',
      narrative: 'CONTEXT: Fine art / gallery context. Conceptual, considered, museum-quality. Each element intentional, meant to be studied.',
      standards: 'conceptual, museum-quality, intentional'
    },
    {
      value: 'ecom',
      label: 'E-commerce',
      narrative: 'CONTEXT: E-commerce / catalog. Product is hero, clear visibility, consistent lighting, saleable presentation.',
      standards: 'clear, consistent, product-focused'
    },
    {
      value: 'lookbook',
      label: 'Lookbook',
      narrative: 'CONTEXT: Brand lookbook. Balance of product clarity and lifestyle mood. Shows how to wear it, aspirational but accessible.',
      standards: 'aspirational, wearable, styled'
    }
  ]
};

export const ART_PROCESSING = {
  id: 'processingStyle',
  label: '🎨 Processing Philosophy',
  description: 'The approach to post-processing and color grading',
  options: [
    {
      value: 'punchy',
      label: 'Punchy & Contrasty',
      narrative: 'PROCESSING: Punchy and contrasty — high micro-contrast, visible texture, saturated midtones, sharp. Like a perfectly calibrated magazine print.',
      texture: 'sharp, detailed',
      saturation: 'high'
    },
    {
      value: 'matte_editorial',
      label: 'Matte Editorial',
      narrative: 'PROCESSING: Matte editorial — lifted blacks, soft contrast, modern magazine feel. Shadows never go to pure black, airy.',
      texture: 'soft, lifted',
      saturation: 'moderate'
    },
    {
      value: 'film_scan',
      label: 'Film Scan Vibe',
      narrative: 'PROCESSING: Film scan aesthetic — 35mm grain structure, slight dust/scratches, organic tonal rolloff. Like a high-quality film scan.',
      texture: 'grainy, organic',
      saturation: 'film-like'
    },
    {
      value: 'clean_digital',
      label: 'Clean Digital',
      narrative: 'PROCESSING: Clean digital — minimal stylization, technically perfect, neutral color, sharp details. Studio precision.',
      texture: 'sharp, clean',
      saturation: 'neutral'
    },
    {
      value: 'cross_process',
      label: 'Cross Process',
      narrative: 'PROCESSING: Cross-processed — unexpected color shifts, cyan shadows, yellow highlights, experimental film chemistry look.',
      texture: 'experimental',
      saturation: 'shifted'
    },
    {
      value: 'vintage_fade',
      label: 'Vintage Fade',
      narrative: 'PROCESSING: Vintage fade — muted colors, lifted blacks, faded like an old photograph found in a drawer.',
      texture: 'soft, faded',
      saturation: 'muted'
    }
  ]
};

export const ART_ENERGY = {
  id: 'energyLevel',
  label: '⚡ Energy Level',
  description: 'The dynamic intensity of the scene',
  options: [
    {
      value: 'explosive',
      label: 'Explosive',
      narrative: 'ENERGY: Explosive — peak action, maximum intensity, the decisive moment. Everything is happening NOW.',
      pose: 'dynamic action',
      motion: 'allowed'
    },
    {
      value: 'high',
      label: 'High',
      narrative: 'ENERGY: High — active, dynamic, alive. Movement is happening, laughter is real, genuine spontaneity.',
      pose: 'active',
      motion: 'micro'
    },
    {
      value: 'medium',
      label: 'Medium',
      narrative: 'ENERGY: Medium — calm but not static. A breath between moments, relaxed but aware.',
      pose: 'relaxed',
      motion: 'none'
    },
    {
      value: 'low',
      label: 'Low',
      narrative: 'ENERGY: Low — contemplative, quiet, still. The moment before or after, introspective calm.',
      pose: 'still',
      motion: 'none'
    },
    {
      value: 'zen',
      label: 'Zen / Static',
      narrative: 'ENERGY: Zen — completely still, meditative, time suspended. Like a held breath or a photograph of a statue.',
      pose: 'static',
      motion: 'none'
    }
  ]
};

export const ART_SPONTANEITY = {
  id: 'spontaneity',
  label: '📸 Spontaneity',
  description: 'How posed vs. candid the image feels',
  options: [
    {
      value: 'candid',
      label: 'Fully Candid',
      narrative: 'SPONTANEITY: Fully candid — subject unaware of camera or ignoring it. Caught mid-action, mid-sentence, mid-thought.',
      direction: 'observe, don\'t direct'
    },
    {
      value: 'semi_candid',
      label: 'Semi-Candid',
      narrative: 'SPONTANEITY: Semi-candid — subject knows camera is there but isn\'t "performing." Natural reactions, relaxed moments between poses.',
      direction: 'minimal direction'
    },
    {
      value: 'relaxed_posed',
      label: 'Relaxed Pose',
      narrative: 'SPONTANEITY: Relaxed pose — subject is posing but maintaining natural body language. Guided but not stiff.',
      direction: 'gentle guidance'
    },
    {
      value: 'editorial_posed',
      label: 'Editorial Posed',
      narrative: 'SPONTANEITY: Editorial posed — clear direction, intentional poses, magazine-ready. Subject is modeling, not just being.',
      direction: 'directed poses'
    },
    {
      value: 'conceptual',
      label: 'Fully Conceptual',
      narrative: 'SPONTANEITY: Fully conceptual — every element placed, every gesture designed. More sculpture than snapshot.',
      direction: 'complete control'
    }
  ]
};

// ═══════════════════════════════════════════════════════════════
// SECTION 3: DEPENDENCY MATRIX
// Defines which parameters are incompatible with each other
// ═══════════════════════════════════════════════════════════════

export const DEPENDENCY_RULES = [
  // ═══════════════════════════════════════════════════════════════
  // TIME / WEATHER → LIGHT SOURCE constraints
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'night_no_sun',
    when: { field: 'timeOfDay', value: 'night' },
    disables: {
      field: 'lightSource',
      values: ['direct_sun', 'golden_hour', 'overcast', 'open_shade'],
      reason: 'No sunlight at night'
    },
    autoFix: { field: 'lightSource', value: 'practicals' }
  },
  {
    id: 'overcast_no_direct_sun',
    when: { field: 'weather', value: 'overcast' },
    disables: {
      field: 'lightSource',
      values: ['direct_sun', 'golden_hour'],
      reason: 'Clouds block direct sunlight'
    },
    autoFix: { field: 'lightSource', value: 'overcast' }
  },
  {
    id: 'overcast_no_hard_light',
    when: { field: 'weather', value: 'overcast' },
    disables: {
      field: 'lightQuality',
      values: ['hard'],
      reason: 'Overcast sky creates only soft diffused light'
    },
    autoFix: { field: 'lightQuality', value: 'soft' }
  },
  {
    id: 'rainy_soft_light_only',
    when: { field: 'weather', value: 'rainy' },
    disables: {
      field: 'lightQuality',
      values: ['hard', 'medium'],
      reason: 'Rain clouds diffuse all light'
    },
    autoFix: { field: 'lightQuality', value: 'diffused' }
  },
  {
    id: 'rainy_no_sun',
    when: { field: 'weather', value: 'rainy' },
    disables: {
      field: 'lightSource',
      values: ['direct_sun', 'golden_hour'],
      reason: 'Rain clouds block sun'
    },
    autoFix: { field: 'lightSource', value: 'overcast' }
  },
  {
    id: 'foggy_no_hard_light',
    when: { field: 'weather', value: 'foggy' },
    disables: {
      field: 'lightQuality',
      values: ['hard'],
      reason: 'Fog diffuses all light'
    },
    autoFix: { field: 'lightQuality', value: 'diffused' }
  },

  // ═══════════════════════════════════════════════════════════════
  // LIGHT SOURCE → TIME OF DAY constraints
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'golden_hour_time',
    when: { field: 'lightSource', value: 'golden_hour' },
    disables: {
      field: 'timeOfDay',
      values: ['night', 'midday', 'morning'],
      reason: 'Golden hour only occurs 1-2hrs before sunset'
    },
    autoFix: { field: 'timeOfDay', value: 'golden_hour' }
  },
  {
    id: 'blue_hour_time',
    when: { field: 'lightSource', value: 'blue_hour' },
    disables: {
      field: 'timeOfDay',
      values: ['midday', 'morning', 'afternoon'],
      reason: 'Blue hour only after sunset'
    },
    autoFix: { field: 'timeOfDay', value: 'blue_hour' }
  },
  {
    id: 'golden_hour_weather',
    when: { field: 'lightSource', value: 'golden_hour' },
    disables: {
      field: 'weather',
      values: ['overcast', 'rainy', 'foggy', 'stormy'],
      reason: 'Golden hour requires clear or partly cloudy sky'
    },
    autoFix: { field: 'weather', value: 'clear' }
  },
  {
    id: 'direct_sun_weather',
    when: { field: 'lightSource', value: 'direct_sun' },
    disables: {
      field: 'weather',
      values: ['overcast', 'rainy', 'foggy', 'stormy'],
      reason: 'Direct sun requires clear sky'
    },
    autoFix: { field: 'weather', value: 'clear' }
  },

  // ═══════════════════════════════════════════════════════════════
  // GOLDEN HOUR → WHITE BALANCE constraint
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'golden_hour_warm_wb',
    when: { field: 'lightSource', value: 'golden_hour' },
    disables: {
      field: 'whiteBalance',
      values: ['cool'],
      reason: 'Golden hour light is physically warm (3500-4500K)'
    },
    autoFix: { field: 'whiteBalance', value: 'warm' }
  },

  // ═══════════════════════════════════════════════════════════════
  // STUDIO LIGHT → INDOOR constraint
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'studio_indoor',
    when: { field: 'lightSource', values: ['studio_softbox', 'studio_hard'] },
    requires: {
      field: 'weather',
      value: 'indoor',
      reason: 'Studio lighting is only available indoors'
    },
    autoFix: { field: 'weather', value: 'indoor' }
  },

  // ═══════════════════════════════════════════════════════════════
  // CAMERA → APERTURE constraints
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'disposable_fixed_aperture',
    when: { field: 'camera', value: 'disposable' },
    locks: {
      field: 'aperture',
      value: 'stopped_down',
      reason: 'Disposable cameras have fixed f/10 aperture'
    }
  },
  {
    id: 'smartphone_fixed_aperture',
    when: { field: 'camera', value: 'smartphone' },
    disables: {
      field: 'aperture',
      values: ['hyperfocal'],
      reason: 'Smartphone sensors cannot achieve true hyperfocal'
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // FOCAL LENGTH → DISTORTION constraints
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'fisheye_distortion',
    when: { field: 'focalLength', value: 'fisheye' },
    locks: {
      field: 'distortion',
      value: 'extreme',
      reason: 'Fisheye lenses have mandatory extreme distortion'
    }
  },
  {
    id: 'ultrawide_distortion',
    when: { field: 'focalLength', value: 'ultrawide' },
    disables: {
      field: 'distortion',
      values: ['none'],
      reason: 'Ultra-wide lenses have inherent distortion'
    }
  },
  {
    id: 'telephoto_no_distortion',
    when: { field: 'focalLength', values: ['telephoto', 'super_telephoto'] },
    locks: {
      field: 'distortion',
      value: 'none',
      reason: 'Telephoto lenses have no barrel distortion'
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // SEASON → WEATHER constraints
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'summer_no_snow',
    when: { field: 'season', value: 'summer' },
    disables: {
      field: 'weather',
      values: ['snowy'],
      reason: 'Snow impossible in summer'
    }
  },
  {
    id: 'winter_no_heatwave',
    when: { field: 'season', value: 'winter' },
    suggests: {
      field: 'whiteBalance',
      value: 'daylight',
      reason: 'Winter light is typically cooler/neutral'
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // BACKLIGHT → DIRECTION constraint
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'backlight_direction',
    when: { field: 'lightSource', value: 'backlight' },
    locks: {
      field: 'lightDirection',
      value: 'backlight',
      reason: 'Backlight source = backlight direction by definition'
    }
  }
];

// ═══════════════════════════════════════════════════════════════
// SECTION 4: CONTEXT PARAMETERS (Environmental)
// ═══════════════════════════════════════════════════════════════

export const CONTEXT_TIME = {
  id: 'timeOfDay',
  label: '🕐 Time of Day',
  options: [
    { value: 'dawn', label: 'Dawn', constraints: { lightAvailable: ['blue_hour', 'golden_hour'] } },
    { value: 'morning', label: 'Morning', constraints: { lightAvailable: ['direct_sun', 'overcast', 'open_shade'] } },
    { value: 'midday', label: 'Midday', constraints: { lightAvailable: ['direct_sun', 'overcast', 'open_shade'] } },
    { value: 'afternoon', label: 'Afternoon', constraints: { lightAvailable: ['direct_sun', 'overcast', 'open_shade'] } },
    { value: 'golden_hour', label: 'Golden Hour', constraints: { lightAvailable: ['golden_hour'] } },
    { value: 'blue_hour', label: 'Blue Hour', constraints: { lightAvailable: ['blue_hour'] } },
    { value: 'night', label: 'Night', constraints: { lightAvailable: ['practicals', 'mixed', 'studio_hard', 'studio_softbox'] } }
  ]
};

export const CONTEXT_WEATHER = {
  id: 'weather',
  label: '🌤️ Weather',
  options: [
    { value: 'clear', label: 'Clear Sky', constraints: { lightQuality: ['hard', 'medium', 'soft'] } },
    { value: 'partly_cloudy', label: 'Partly Cloudy', constraints: { lightQuality: ['medium', 'soft'] } },
    { value: 'overcast', label: 'Overcast', constraints: { lightQuality: ['soft', 'diffused'] } },
    { value: 'foggy', label: 'Foggy', constraints: { lightQuality: ['diffused'] } },
    { value: 'rainy', label: 'Rainy', constraints: { lightQuality: ['diffused'] } },
    { value: 'snowy', label: 'Snowy', constraints: { lightQuality: ['soft', 'diffused'] } },
    { value: 'stormy', label: 'Stormy', constraints: { lightQuality: ['diffused'] } },
    { value: 'indoor', label: 'Indoor', constraints: { lightQuality: ['hard', 'medium', 'soft', 'diffused'] } }
  ]
};

export const CONTEXT_SEASON = {
  id: 'season',
  label: '🍂 Season',
  options: [
    { value: 'spring', label: 'Spring', visual: 'Fresh green foliage, flowers blooming' },
    { value: 'summer', label: 'Summer', visual: 'Lush green, bright light, heat haze' },
    { value: 'autumn', label: 'Autumn', visual: 'Golden/red foliage, fallen leaves' },
    { value: 'winter', label: 'Winter', visual: 'Bare trees, possible snow, cold light' },
    { value: 'any', label: 'Any / Indoor', visual: 'Season not visible' }
  ]
};

// ═══════════════════════════════════════════════════════════════
// SECTION 5: HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Apply dependency rules and auto-fix conflicts
 */
export function applyDependencies(params) {
  const result = { ...params };
  const applied = [];
  const warnings = [];

  for (const rule of DEPENDENCY_RULES) {
    // Check if rule condition is met
    let conditionMet = false;

    if (rule.when.value) {
      conditionMet = result[rule.when.field] === rule.when.value;
    } else if (rule.when.values) {
      conditionMet = rule.when.values.includes(result[rule.when.field]);
    }

    if (!conditionMet) continue;

    // Apply the rule
    if (rule.locks) {
      // Hard lock: force value
      if (result[rule.locks.field] !== rule.locks.value) {
        const oldValue = result[rule.locks.field];
        result[rule.locks.field] = rule.locks.value;
        applied.push({
          ruleId: rule.id,
          field: rule.locks.field,
          from: oldValue,
          to: rule.locks.value,
          reason: rule.locks.reason
        });
      }
    }

    if (rule.disables) {
      // Disable certain values
      if (rule.disables.values.includes(result[rule.disables.field])) {
        const oldValue = result[rule.disables.field];
        result[rule.disables.field] = rule.autoFix?.value || null;
        applied.push({
          ruleId: rule.id,
          field: rule.disables.field,
          from: oldValue,
          to: result[rule.disables.field],
          reason: rule.disables.reason
        });
      }
    }

    if (rule.requires) {
      // Require specific value
      if (result[rule.requires.field] !== rule.requires.value) {
        const oldValue = result[rule.requires.field];
        result[rule.requires.field] = rule.requires.value;
        applied.push({
          ruleId: rule.id,
          field: rule.requires.field,
          from: oldValue,
          to: rule.requires.value,
          reason: rule.requires.reason
        });
      }
    }

    if (rule.suggests) {
      // Soft suggestion (warning only)
      if (result[rule.suggests.field] !== rule.suggests.value) {
        warnings.push({
          ruleId: rule.id,
          field: rule.suggests.field,
          current: result[rule.suggests.field],
          suggested: rule.suggests.value,
          reason: rule.suggests.reason
        });
      }
    }
  }

  return { params: result, applied, warnings };
}

/**
 * Get disabled options for a field based on current params
 */
export function getDisabledOptions(field, currentParams) {
  const disabled = new Set();

  for (const rule of DEPENDENCY_RULES) {
    // Check if rule condition is met
    let conditionMet = false;

    if (rule.when.value) {
      conditionMet = currentParams[rule.when.field] === rule.when.value;
    } else if (rule.when.values) {
      conditionMet = rule.when.values.includes(currentParams[rule.when.field]);
    }

    if (!conditionMet) continue;

    // Check if this rule affects the target field
    if (rule.disables?.field === field) {
      rule.disables.values.forEach(v => disabled.add(v));
    }

    if (rule.locks?.field === field) {
      // If locked, ALL other values are disabled
      // We'll handle this in UI by showing only the locked value
    }
  }

  return disabled;
}

/**
 * Get the locked value for a field (if any)
 */
export function getLockedValue(field, currentParams) {
  for (const rule of DEPENDENCY_RULES) {
    // Check if rule condition is met
    let conditionMet = false;

    if (rule.when.value) {
      conditionMet = currentParams[rule.when.field] === rule.when.value;
    } else if (rule.when.values) {
      conditionMet = rule.when.values.includes(currentParams[rule.when.field]);
    }

    if (!conditionMet) continue;

    if (rule.locks?.field === field) {
      return { value: rule.locks.value, reason: rule.locks.reason };
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 6: PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build the V5 prompt with clear Technical/Artistic separation
 */
export function buildV5Prompt(params, scene = {}) {
  console.log('[buildV5Prompt] Input params:', JSON.stringify(params, null, 2));
  console.log('[buildV5Prompt] Input scene:', JSON.stringify(scene, null, 2));

  // First, apply dependency rules to ensure consistency
  const { params: resolvedParams, applied } = applyDependencies(params);

  console.log('[buildV5Prompt] Resolved params:', JSON.stringify(resolvedParams, null, 2));

  // Build Technical Specifications block
  const techSpecs = buildTechnicalSpecs(resolvedParams);

  // Build Artistic Brief block
  const artisticBrief = buildArtisticBrief(resolvedParams);

  // Build Scene Description
  const sceneDesc = buildSceneDescription(scene, resolvedParams);

  // Assemble final prompt
  const prompt = `ROLE: World-class Photographer & Art Director.
TASK: Generate a photorealistic image based on the following Technical Specifications and Artistic Brief.

═══════════════════════════════════════════════════════════════
⚠️ CRITICAL RULES FOR REFERENCE IMAGES
═══════════════════════════════════════════════════════════════

1. LOCATION REFERENCE (if provided): 
   - Use ONLY for spatial context (geometry, architecture, layout, props).
   - IGNORE the visual style, lighting, colors, weather, and atmosphere of the reference image.
   - You MUST re-render this space strictly following the [TECHNICAL SPECIFICATIONS] (lighting, weather, time).
   - The reference is just a "geometry input" or "gray box" guide.

2. STYLE REFERENCE [$2] (if provided): Copy the overall visual style, color grading, and mood.

3. IDENTITY REFERENCE [$1] (if provided): Match the person's face and body accurately.

4. ENVIRONMENTAL VARIATION (CRITICAL): 
   - The scene MUST adapt to the specified Weather, Season, and Time of Day.
   - If "snow" is active: cover the location in snow, even if reference is sunny/green.
   - If "rain" is active: make surfaces wet, add reflections, change light to overcast.
   - If "night" is active: relight the scene with artificial sources/moonlight.
   - NEVER start with the reference's weather/light. Start with the requested parameters.

═══════════════════════════════════════════════════════════════
[TECHNICAL SPECIFICATIONS] — STRICT ADHERENCE REQUIRED
These parameters mimic a real camera setup. Do not deviate.
═══════════════════════════════════════════════════════════════

${techSpecs}

═══════════════════════════════════════════════════════════════
[ARTISTIC BRIEF] — VISUAL LANGUAGE
Interpret these descriptions to set the mood and style.
═══════════════════════════════════════════════════════════════

${artisticBrief}

${applied.length > 0 ? `
═══════════════════════════════════════════════════════════════
[SYSTEM NOTES] — AUTO-CORRECTIONS APPLIED
The following parameter conflicts were automatically resolved:
${applied.map(a => `• ${a.field}: ${a.from} → ${a.to} (${a.reason})`).join('\n')}
═══════════════════════════════════════════════════════════════
` : ''}

═══════════════════════════════════════════════════════════════
[SCENE DESCRIPTION]
═══════════════════════════════════════════════════════════════

${sceneDesc}`;

  return { prompt, resolvedParams, corrections: applied };
}

function buildTechnicalSpecs(params) {
  const lines = [];

  console.log('[buildTechnicalSpecs] Looking for camera:', params.camera);

  // Camera
  const camera = TECH_CAMERA.options.find(o => o.value === params.camera);
  console.log('[buildTechnicalSpecs] Found camera:', camera?.value, camera?.spec?.substring(0, 50));
  if (camera) lines.push(camera.spec);

  // Lens
  const focal = TECH_FOCAL.options.find(o => o.value === params.focalLength);
  if (focal) lines.push(focal.spec);

  // Aperture
  const aperture = TECH_APERTURE.options.find(o => o.value === params.aperture);
  if (aperture) lines.push(aperture.spec);

  // Shutter
  const shutter = TECH_SHUTTER.options.find(o => o.value === params.shutterSpeed);
  if (shutter) lines.push(shutter.spec);

  // Light Source
  const lightSource = TECH_LIGHT_SOURCE.options.find(o => o.value === params.lightSource);
  if (lightSource) lines.push(lightSource.spec);

  // Light Direction
  const lightDir = TECH_LIGHT_DIRECTION.options.find(o => o.value === params.lightDirection);
  if (lightDir) lines.push(lightDir.spec);

  // Light Quality
  const lightQuality = TECH_LIGHT_QUALITY.options.find(o => o.value === params.lightQuality);
  if (lightQuality) lines.push(lightQuality.spec);

  // White Balance
  const wb = TECH_WHITE_BALANCE.options.find(o => o.value === params.whiteBalance);
  if (wb) lines.push(wb.spec);

  // Exposure
  const exposure = TECH_EXPOSURE.options.find(o => o.value === params.exposure);
  if (exposure) lines.push(exposure.spec);

  // Contrast
  const contrast = TECH_CONTRAST.options.find(o => o.value === params.contrastCurve);
  if (contrast) lines.push(contrast.spec);

  console.log('[buildTechnicalSpecs] Generated', lines.length, 'lines');
  return lines.join('\n');
}

function buildArtisticBrief(params) {
  const lines = [];

  // Visual Mood
  const mood = ART_MOOD.options.find(o => o.value === params.visualMood);
  if (mood) lines.push(mood.narrative);

  // Era
  const era = ART_ERA.options.find(o => o.value === params.decade);
  if (era) lines.push(era.narrative);

  // Cultural Context
  const context = ART_CONTEXT.options.find(o => o.value === params.culturalContext);
  if (context) lines.push(context.narrative);

  // Processing
  const processing = ART_PROCESSING.options.find(o => o.value === params.processingStyle);
  if (processing) lines.push(processing.narrative);

  // Energy
  const energy = ART_ENERGY.options.find(o => o.value === params.energyLevel);
  if (energy) lines.push(energy.narrative);

  // Spontaneity
  const spontaneity = ART_SPONTANEITY.options.find(o => o.value === params.spontaneity);
  if (spontaneity) lines.push(spontaneity.narrative);

  console.log('[buildArtisticBrief] Generated', lines.length, 'lines');
  return lines.join('\n\n');
}

function buildSceneDescription(scene, params) {
  const parts = [];

  // ═══════════════════════════════════════════════════════════════
  // LOCATION (CONTEXT ONLY — NOT visual style)
  // ═══════════════════════════════════════════════════════════════
  if (scene.location) {
    const loc = scene.location;
    let locationContext = '';

    if (typeof loc === 'object') {
      // Extract ONLY contextual information, NOT visual style
      const contextParts = [];

      // Type of place
      if (loc.label) contextParts.push(loc.label);
      if (loc.spaceType) contextParts.push(`(${loc.spaceType})`);

      // Physical description without lighting/color
      if (loc.description) {
        // Strip any lighting/color references from description
        const cleanDesc = loc.description
          .replace(/\b(golden|warm|cool|soft|hard|bright|dim|dramatic|moody)\s*(light|lighting|glow|sun|shadow)/gi, '')
          .replace(/\b(bright|dark|vibrant|muted|saturated)\s*colors?\b/gi, '')
          .trim();
        if (cleanDesc) contextParts.push(cleanDesc);
      }

      // Props and objects (architectural elements, furniture, vegetation)
      if (loc.props) contextParts.push(`Props: ${loc.props}`);
      if (loc.materials) contextParts.push(`Materials: ${loc.materials}`);
      if (loc.architecturalStyle) contextParts.push(`Architecture: ${loc.architecturalStyle}`);

      locationContext = contextParts.join('. ');
    } else if (typeof loc === 'string' && loc) {
      locationContext = loc;
    }

    if (locationContext) {
      // Build adaptive location description based on current params
      const adaptations = [];

      // Weather adaptation
      const weather = CONTEXT_WEATHER.options.find(o => o.value === params.weather);
      if (weather && weather.value !== 'clear' && weather.value !== 'indoor') {
        adaptations.push(`adapted for ${weather.label} conditions`);
      }

      // Season adaptation  
      const season = CONTEXT_SEASON.options.find(o => o.value === params.season);
      if (season && season.value !== 'any') {
        adaptations.push(`in ${season.label.toLowerCase()}`);
      }

      // Time adaptation
      const time = CONTEXT_TIME.options.find(o => o.value === params.timeOfDay);
      if (time && time.value !== 'afternoon') {
        adaptations.push(`during ${time.label.toLowerCase()}`);
      }

      const adaptationNote = adaptations.length > 0
        ? ` (${adaptations.join(', ')})`
        : '';

      parts.push(`LOCATION CONTEXT: ${locationContext}${adaptationNote}
⚠️ IMPORTANT: This location description and any reference image defines GEOMETRY ONLY.
- IGNORE the visual style/lighting of the location reference.
- RENDER this space using the weather/lighting defined in Technical Specs.
- Apply the environmental adaptations (snow, rain, night, etc.) vigorously.`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MODEL DESCRIPTION
  // ═══════════════════════════════════════════════════════════════
  if (scene.modelDescription) {
    parts.push(`MODEL: ${scene.modelDescription}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // EMOTION
  // ═══════════════════════════════════════════════════════════════
  if (scene.emotionId && typeof scene.emotionId === 'object') {
    const emo = scene.emotionId;
    if (emo.visualPrompt) {
      parts.push(`EMOTION: ${emo.visualPrompt}`);
    } else if (emo.label) {
      parts.push(`EMOTION: ${emo.label}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // COMPOSITION (Shot Size + Camera Angle)
  // ═══════════════════════════════════════════════════════════════
  if (scene.shotSize && scene.shotSize !== 'default') {
    const shotLabels = {
      'extreme_closeup': 'Extreme Close-up (eyes/lips only)',
      'closeup': 'Close-up (face fills frame)',
      'medium_closeup': 'Medium Close-up (head and shoulders)',
      'medium_shot': 'Medium Shot (waist up)',
      'cowboy_shot': 'Cowboy Shot (mid-thigh up)',
      'full_shot': 'Full Shot (entire body)',
      'wide_shot': 'Wide Shot (body with environment)'
    };
    parts.push(`SHOT SIZE: ${shotLabels[scene.shotSize] || scene.shotSize}`);
  }

  if (scene.cameraAngle && scene.cameraAngle !== 'eye_level') {
    const angleLabels = {
      'low_angle': 'Low Angle (looking up, heroic)',
      'high_angle': 'High Angle (looking down)',
      'overhead': 'Overhead (bird\'s eye view)',
      'dutch_angle': 'Dutch Angle (tilted horizon)',
      'selfie': 'Selfie Angle (arm\'s length, slightly above)'
    };
    parts.push(`CAMERA ANGLE: ${angleLabels[scene.cameraAngle] || scene.cameraAngle}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // ACTION/POSE
  // ═══════════════════════════════════════════════════════════════
  if (scene.action) {
    parts.push(`ACTION: ${scene.action}`);
  }

  if (scene.pose && scene.pose !== scene.action) {
    parts.push(`POSE: ${scene.pose}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // CLOTHING
  // ═══════════════════════════════════════════════════════════════
  if (scene.lookPrompt) {
    parts.push(`OUTFIT STYLE: ${scene.lookPrompt}`);
  }

  if (scene.clothingDescriptions && scene.clothingDescriptions.length > 0) {
    const clothingText = scene.clothingDescriptions
      .filter(c => c && c.trim())
      .join('; ');
    if (clothingText) {
      parts.push(`CLOTHING ITEMS: ${clothingText}`);
    }
  }

  if (scene.clothingItemPrompts && scene.clothingItemPrompts.length > 0) {
    const itemsText = scene.clothingItemPrompts
      .filter(item => item && item.prompt)
      .map(item => `${item.name || 'Item'}: ${item.prompt}`)
      .join('; ');
    if (itemsText) {
      parts.push(`CLOTHING DETAILS: ${itemsText}`);
    }
  }

  if (scene.clothingFocus) {
    const clothingText = typeof scene.clothingFocus === 'string'
      ? scene.clothingFocus
      : (scene.clothingFocus.description || '');
    if (clothingText && clothingText !== '{}' && clothingText !== '[object Object]') {
      parts.push(`CLOTHING FOCUS: ${clothingText}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ENVIRONMENT & TEXTURE
  // ═══════════════════════════════════════════════════════════════
  if (scene.environment) {
    parts.push(`ENVIRONMENT: ${scene.environment}`);
  }

  if (scene.texture) {
    parts.push(`TEXTURE DETAILS: ${scene.texture}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // CONTEXT (Time, Weather, Season from V5 params)
  // ═══════════════════════════════════════════════════════════════
  const time = CONTEXT_TIME.options.find(o => o.value === params.timeOfDay);
  if (time) parts.push(`TIME OF DAY: ${time.label}`);

  const weather = CONTEXT_WEATHER.options.find(o => o.value === params.weather);
  if (weather) parts.push(`WEATHER: ${weather.label}`);

  const season = CONTEXT_SEASON.options.find(o => o.value === params.season);
  if (season && season.value !== 'any') parts.push(`SEASON: ${season.label} — ${season.visual}`);

  // ═══════════════════════════════════════════════════════════════
  // REFERENCE FLAGS
  // ═══════════════════════════════════════════════════════════════
  const refNotes = [];
  if (scene.hasIdentityRefs) refNotes.push('Identity reference images provided [$1]');
  if (scene.hasClothingRefs) refNotes.push('Clothing reference images provided');
  if (scene.hasStyleRef) refNotes.push('Style reference image provided [$2] — match its visual style');
  if (scene.hasPoseSketch) refNotes.push('Pose sketch provided — follow the pose');

  if (refNotes.length > 0) {
    parts.push(`\nREFERENCES:\n${refNotes.map(n => `• ${n}`).join('\n')}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // FORMAT & POSE (Pose Adherence + Image Quality)
  // ═══════════════════════════════════════════════════════════════
  const poseInstructions = {
    1: "Free/Loose pose. Create a natural, candid variation. IGNORE strict sketch alignment.",
    2: "Relaxed pose. Follow the general gesture but prioritize comfort and natural flow.",
    3: "Strict pose. Follow the sketch compositionally. Maintain limb positioning.",
    4: "TECHNICAL MATCH. COPY the sketch pose EXACTLY. Do not deviate."
  };

  const adherence = scene.poseAdherence || 2;
  parts.push(`POSE ADHERENCE (${adherence}/4): ${poseInstructions[adherence] || poseInstructions[2]}`);

  // Format / Quality
  const formatPrompts = [];
  if (scene.imageSize === '4K') formatPrompts.push('8K Ultra-High Resolution, Detailed Texture');
  if (scene.imageSize === '2K') formatPrompts.push('4K Standard Resolution, Clean Digital');

  if (scene.aspectRatio === '16:9') formatPrompts.push('Cinematic Widescreen Composition');
  if (scene.aspectRatio === '9:16') formatPrompts.push('Vertical Story Format');

  if (formatPrompts.length > 0) {
    parts.push(`FORMAT: ${formatPrompts.join(', ')}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // EXTRA PROMPT (user's additional instructions)
  // ═══════════════════════════════════════════════════════════════
  if (scene.extraPrompt && scene.extraPrompt.trim()) {
    parts.push(`\nADDITIONAL INSTRUCTIONS: ${scene.extraPrompt.trim()}`);
  }

  return parts.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// SECTION 7: EXPORTS
// ═══════════════════════════════════════════════════════════════

// All technical parameters
export const TECHNICAL_PARAMS = {
  camera: TECH_CAMERA,
  focalLength: TECH_FOCAL,
  aperture: TECH_APERTURE,
  shutterSpeed: TECH_SHUTTER,
  lightSource: TECH_LIGHT_SOURCE,
  lightDirection: TECH_LIGHT_DIRECTION,
  lightQuality: TECH_LIGHT_QUALITY,
  whiteBalance: TECH_WHITE_BALANCE,
  exposure: TECH_EXPOSURE,
  contrastCurve: TECH_CONTRAST
};

// All artistic parameters
export const ARTISTIC_PARAMS = {
  visualMood: ART_MOOD,
  decade: ART_ERA,
  culturalContext: ART_CONTEXT,
  processingStyle: ART_PROCESSING,
  energyLevel: ART_ENERGY,
  spontaneity: ART_SPONTANEITY
};

// Context parameters
export const CONTEXT_PARAMS = {
  timeOfDay: CONTEXT_TIME,
  weather: CONTEXT_WEATHER,
  season: CONTEXT_SEASON
};

// Default values
export const DEFAULT_PARAMS = {
  // Technical
  camera: 'high_end_digital',
  focalLength: 'portrait',
  aperture: 'fast',
  shutterSpeed: 'freeze_normal',
  lightSource: 'direct_sun',
  lightDirection: 'front_45',
  lightQuality: 'medium',
  whiteBalance: 'daylight',
  exposure: 'neutral',
  contrastCurve: 's_curve_moderate',

  // Artistic
  visualMood: 'confident_bold',
  decade: 'contemporary',
  culturalContext: 'editorial',
  processingStyle: 'punchy',
  energyLevel: 'medium',
  spontaneity: 'relaxed_posed',

  // Context
  timeOfDay: 'afternoon',
  weather: 'clear',
  season: 'any'
};

/**
 * Get all parameters for API/UI
 */
export function getAllV5Params() {
  return {
    technical: TECHNICAL_PARAMS,
    artistic: ARTISTIC_PARAMS,
    context: CONTEXT_PARAMS,
    defaults: DEFAULT_PARAMS,
    dependencies: DEPENDENCY_RULES
  };
}
