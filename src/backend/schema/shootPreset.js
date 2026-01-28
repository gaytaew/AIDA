/**
 * Shoot Preset Schema (Custom Shoot V6)
 * 
 * Defines the comprehensive "Visual Recipe" for a shoot.
 * Implements "Smart Exclusion" logic - any parameter can be null.
 */

// ═══════════════════════════════════════════════════════════════
// 1. 📷 CAMERA & OPTICS (Tech Layer)
// ═══════════════════════════════════════════════════════════════

export const PRESET_CAMERA_TYPES = {
    high_end_digital: {
        id: 'high_end_digital',
        label: 'High-End Digital',
        prompt: 'CAMERA: High-End Digital. Clean signal, massive dynamic range, no noise.',
        physics: { minAperture: 1.2, maxAperture: 22, canChangeLens: true }
    },
    film_35mm: {
        id: 'film_35mm',
        label: '35mm Film',
        prompt: 'CAMERA: 35mm Film (Contax T2 / Leica). Visible grain structure, organic tonality, nostalgic rendering.',
        physics: { filmGrain: true, canChangeLens: true }
    },
    film_medium: {
        id: 'film_medium',
        label: 'Medium Format Film',
        prompt: 'CAMERA: Medium Format Film (Hasselblad). Organic fine grain, rich tonal rollover, extreme resolution.',
        physics: { filmGrain: true, canChangeLens: true }
    },
    polaroid: {
        id: 'polaroid',
        label: 'Polaroid / Instant',
        prompt: 'CAMERA: Instant Film. Low contrast, soft focus, chemical color shift, white border frame possibility.',
        physics: { filmGrain: true, fixedAperture: true, fixedLens: true }
    },
    vintage_digital: {
        id: 'vintage_digital',
        label: 'Early 2000s Digital',
        prompt: 'CAMERA: Early 2000s Digital (CCD Sensor). Low dynamic range, slightly harsh highlights, "digicam" look.',
        physics: { digitalNoise: true, canChangeLens: false }
    },
    disposable: {
        id: 'disposable',
        label: 'Disposable Camera',
        prompt: 'CAMERA: Disposable Camera. Plastic lens, fixed focus, built-in flash, slight vignette.',
        physics: { fixedAperture: true, fixedLens: true, fixedFocus: true }
    }
};

export const PRESET_LENSES = {
    fisheye: 'LENS: 8-15mm Fisheye. Extreme barrel distortion, curved horizon.',
    wide: 'LENS: 24-35mm Wide. Contextual view, slight perspective elongation.',
    standard: 'LENS: 50mm Standard. Neutral human-eye perspective, zero distortion.',
    portrait: 'LENS: 85mm Portrait. Flattering compression, subject isolation.',
    telephoto: 'LENS: 135-200mm Telephoto. Strong compression, background appears closer.'
};

export const PRESET_APERTURES = {
    f1_4: 'APERTURE: f/1.4 Wide Open. Razor-thin depth of field, background obliterated.',
    f2_8: 'APERTURE: f/2.8 Fast. Shallow depth of field, distinct subject separation.',
    f5_6: 'APERTURE: f/5.6 Moderate. Balanced depth of field, context visible but soft.',
    f11: 'APERTURE: f/11 Deep. Deep depth of field, everything acceptably sharp.'
};

export const PRESET_SHUTTERS = {
    freeze: 'SHUTTER: 1/1000s Fast. All motion frozen solid, crisp details.',
    motion_blur: 'SHUTTER: 1/30s Slow. Artistic motion blur on moving elements.',
    long_exposure: 'SHUTTER: 1s+ Long Exposure. Light trails, silky movement effects.'
};

// ═══════════════════════════════════════════════════════════════
// 2. 💡 LIGHTING (Volume Layer)
// ═══════════════════════════════════════════════════════════════

export const PRESET_LIGHT_SOURCES = {
    natural_sun: {
        id: 'natural_sun',
        label: 'Natural Sun',
        prompt: 'LIGHT SOURCE: Direct Sunlight. High contrast, defined shadows.',
        physics: { requiresWindowOrExterior: true }
    },
    natural_window: {
        id: 'natural_window',
        label: 'Window Light',
        prompt: 'LIGHT SOURCE: Window Light. Soft directional source, rapid falloff.',
        physics: { requiresWindowOrInterior: true }
    },
    studio_strobe: {
        id: 'studio_strobe',
        label: 'Studio Strobe',
        prompt: 'LIGHT SOURCE: Studio Strobe. Controlled, clean, high-power illumination.',
        physics: { studio: true }
    },
    on_camera_flash: {
        id: 'on_camera_flash',
        label: 'On-Camera Flash',
        prompt: 'LIGHT SOURCE: Direct Flash. Harsh, flat frontal lighting, hard shadows behind subject.',
        physics: { hardShadows: true }
    },
    neon_practical: {
        id: 'neon_practical',
        label: 'Neon / Practicals',
        prompt: 'LIGHT SOURCE: Neon Practicals. Colored light from visible signs or lamps.',
        physics: { mixedTemp: true }
    },
    street_lamps: {
        id: 'street_lamps',
        label: 'Street Lamps',
        prompt: 'LIGHT SOURCE: Street Lamps. Sodium vapor orange/green cast, top-down pools of light.',
        physics: { nightOnly: true }
    }
};

export const PRESET_LIGHT_DIRECTIONS = {
    front: 'LIGHT DIRECTION: Front-lit (0°). Flat lighting, minimal shadows on face.',
    side: 'LIGHT DIRECTION: Side-lit (90°). Split lighting, high drama, heavy shadow side.',
    rembrandt: 'LIGHT DIRECTION: 45° Rembrandt. Classic triangle shadow on cheek, sculpted volume.',
    backlight: 'LIGHT DIRECTION: Backlit (180°). Rim light, halo effect, silhouette logic.',
    top_down: 'LIGHT DIRECTION: Top-Down. Overhead lighting, deep shadows in eye sockets.'
};

export const PRESET_LIGHT_QUALITY = {
    hard: 'LIGHT QUALITY: Hard Light. Sharp shadow edges, high contrast texture.',
    soft: 'LIGHT QUALITY: Soft Light. Diffused shadow edges, wrapping illumination.'
};

export const PRESET_LIGHT_TEMP = {
    warm: 'WHITE BALANCE: Warm (Golden). 3200-4000K, inviting, nostalgic.',
    neutral: 'WHITE BALANCE: Neutral (Daylight). 5500K, accurate colors.',
    cool: 'WHITE BALANCE: Cool (Blue). 7000K+, clinical, night, or winter feel.'
};

// ═══════════════════════════════════════════════════════════════
// 3. 🎨 ATMOSPHERE (Vibe Layer)
// ═══════════════════════════════════════════════════════════════

export const PRESET_MOODS = {
    euphoric: 'MOOD: Euphoric. Bright, high energy, optimistic, saturated colors.',
    melancholic: 'MOOD: Melancholic. Muted tones, soft focus, wistful and quiet.',
    gritty: 'MOOD: Gritty/Raw. High local contrast, dirty textures, unpolished reality.',
    minimal: 'MOOD: Minimalist. Clean lines, negative space, reduced color palette.',
    luxurious: 'MOOD: Luxurious. Rich textures, sheen, expensive feel, polished.',
    ethereal: 'MOOD: Ethereal. Dreamy, bloom highlights, soft colors, otherworldly.'
};

export const PRESET_ERAS = {
    '70s': 'ERA: 1970s. Warm Kodachrome look, vintage fashion feel.',
    '80s': 'ERA: 1980s. High saturation, flash, glossy magazine look.',
    '90s': 'ERA: 1990s. Heroin chic, grunge, desaturated, raw.',
    'y2k': 'ERA: Y2K (2000s). Early digital aesthetics, harsh flash, pop colors.',
    'modern': 'ERA: Contemporary 2020s. High definition, clean grading, sharp.'
};

export const PRESET_PROCESSING = {
    bw_high_contrast: 'PROCESSING: Black & White (High Contrast). Deep blacks, grainy.',
    bw_soft: 'PROCESSING: Black & White (Soft). Silver rich tones, low contrast.',
    cinematic_teal: 'PROCESSING: Cinematic Grading. Teal shadows, orange skin tones.',
    faded_matte: 'PROCESSING: Matte Finish. Lifted blacks, faded colors, indie mag look.',
    cross_process: 'PROCESSING: Cross Processed. Shifted colors (green/yellow cast).'
};

// ═══════════════════════════════════════════════════════════════
// 4. 🌍 LOCATION (Context Layer)
// ═══════════════════════════════════════════════════════════════

export const PRESET_SPACE_TYPES = {
    interior: 'Interior',
    exterior_urban: 'Urban Exterior',
    exterior_nature: 'Nature Exterior',
    studio: 'Studio',
    transport: 'Transport',
    rooftop: 'Rooftop'
};

// ═══════════════════════════════════════════════════════════════
// 5. 🧘 POSE & PHYSICS (Narrative Layer)
// ═══════════════════════════════════════════════════════════════

export const PRESET_POSES = {
    relaxed_standing: 'LABEL: Casual Existence. ATMOSPHERE: Standing without trying. Weight shifted naturally to one hip, shoulders dropped. No "model posture," just the way a human body settles when waiting for a bus or chatting with a friend. Zero tension in the limbs.',
    dynamic_motion: 'LABEL: Kinetic Tension. ATMOSPHERE: Caught in the middle of movement. Muscles engaged, hair slightly airborne, body orientation shifting. The feeling of "going somewhere," not a frozen statue. A snapshot of kinetic energy.',
    slouching_cool: 'LABEL: Anti-Fashion Slouch. ATMOSPHERE: Deliberately bad posture that looks cool. Collapsing into a chair or leaning heavily against a wall. Spine curved, limbs angular and awkward-but-fashion. Rejection of formal elegance.',
    sitting_grounded: 'LABEL: Grounded Weight. ATMOSPHERE: Heavy interaction with gravity. Sitting or crouching, feeling the weight of the body pressing down. Limbs folded, creating geometric shapes naturally. A sense of anchoring and stability.',
    interaction: 'LABEL: Tactile Connection. ATMOSPHERE: Engaging with the environment. Hands touching a surface, leaning on an object, pushing against something. The body is not isolated in space but physically connected to the world around it.'
};

export const PRESET_PHYSICS = {
    gravity_heavy: 'PHYSICS: Emphasis on weight and gravity. Clothes drape heavily, soft tissues compress against surfaces, hair falls straight down. No floating elements.',
    wind_dynamic: 'PHYSICS: Air interaction. Hair blowing across face, fabric billowing in specific wind direction, eyes slightly squinting. Chaotic aerodynamic energy.',
    static_still: 'PHYSICS: Absolute accumulation of stillness. Dust motes floating, air is heavy and unmoving. Clothes hang perfectly still. A vacuum of motion.'
};

// ═══════════════════════════════════════════════════════════════
// 6. 🛠️ HARDCODED REALISM CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const HARDCODED_REALISM = {
    STRICT_ID: "SUBJECT IDENTITY: MATCH REFERENCE [$1] EXACTLY. Preserve exact facial features, ethnicity, bone structure. NO VARIATIONS.",
    STRICT_CLOTH: "OUTFIT: The model must wear EXACTLY the clothing shown in reference [$3]. Fabric texture, folds, and cut must be Identical.",

    HYPER_REAL_SKIN: "SKIN TEXTURE: Enhance all facial imperfections with high micro-detail precision: authentic pores, subtle texture variations, fine wrinkles, micro-cracks, natural asymmetry, barely noticeable scars, freckles, vellus hair, and real skin surface irregularities. Enhance realistic material skin response — separation of matte and oily zones, natural specularity, and micro-shadows — without adding smoothing, softening, or plastic artifacts. Correct only elements that look broken or distorted by AI, while strictly preserving subject identity. STRICTLY PRESERVE original color grading unchanged.",

    HYPER_REAL_EYES: "EYE DETAIL: Enhance eyes with high micro-detail fidelity: sharp iris texture, natural radial patterns, subtle chromatic variations, and correct subsurface light scattering response. Refine eyelids, eyelashes, and tear ducts with anatomical precision — exact lash separation, natural moisture level, micro-shadows, and realistic translucency. Preserve authentic asymmetry and avoid artificial glow, excessive sharpness, and plastic shine. Correct only distorted or broken elements, while strictly preserving subject identity. STRICTLY PRESERVE original color grading exactly as in the input image.",

    GLOBAL_NEG: "NEGATIVE PROMPT: smooth plastic skin, wax doll, 3d render, cartoon, oversmoothed, artificial shine, perfect symmetry, airbrushed, digital art, uncanny valley, cgi, glossy skin, instagram filter, distorted face."
};
