/**
 * Food Shoot Schema
 * 
 * Specialized parameters for professional food photography.
 * Focuses on Plating, Texture, Camera Angles, and Lighting.
 */

// ═══════════════════════════════════════════════════════════════
// SECTION 1: CAMERA & COMPOSITION
// ═══════════════════════════════════════════════════════════════

export const FOOD_CAMERA = {
    id: 'camera',
    label: '📷 Камера и Объектив',
    description: 'Выбор оптики и ракурса',
    options: [
        {
            value: 'macro_100mm',
            label: 'Macro 100mm (Ultra Detail)',
            spec: 'LENS: 100mm Macro. Extreme close-up, razor-thin depth of field. Focus on texture, droplets, crumbs. Background completely blurred.',
            constraints: { shotSize: 'macro', dof: 'shallow' }
        },
        {
            value: 'standard_50mm',
            label: 'Standard 50mm (Natural)',
            spec: 'LENS: 50mm Standard. Natural perspective, similar to human eye. Good for plating shots and table scenes.',
            constraints: { shotSize: 'medium', dof: 'medium' }
        },
        {
            value: 'wide_35mm',
            label: 'Wide 35mm (Table Scene)',
            spec: 'LENS: 35mm Wide. Contextual view, captures the whole table spread. Slight perspective elongation at edges.',
            constraints: { shotSize: 'wide', dof: 'deep' }
        }
    ]
};

export const FOOD_ANGLE = {
    id: 'angle',
    label: '📐 Ракурс',
    description: 'Угол съемки',
    options: [
        {
            value: 'flat_lay',
            label: 'Flat Lay (90° Top Down)',
            spec: 'ANGLE: 90° Top Down (Flat Lay). Graphic, geometric composition. Everything in focus plane.',
            constraints: { perspective: 'flat' }
        },
        {
            value: '45_degree',
            label: '45° (Diner\'s Eye)',
            spec: 'ANGLE: 45° Angle (Diner\'s View). The most appetizing angle, showing volume and depth of the dish.',
            constraints: { perspective: 'natural' }
        },
        {
            value: 'eye_level',
            label: 'Eye Level (0° Side View)',
            spec: 'ANGLE: 0° Eye Level (Side View). Highlights height, layers, and vertical details (burgers, drinks, stacks).',
            constraints: { perspective: 'side' }
        }
    ]
};

export const FOOD_COMPOSITION = {
    id: 'composition',
    label: '⚖️ Композиция',
    description: 'Распределение объектов в кадре',
    options: [
        {
            value: 'center',
            label: 'Центральная (Hero)',
            spec: 'COMPOSITION: Centered "Hero" composition. Subject is dead center, commanding attention. Symmetrical balance.'
        },
        {
            value: 'rule_of_thirds',
            label: 'Правило третей',
            spec: 'COMPOSITION: Rule of Thirds. Subject placed off-center at intersection points. Dynamic negative space.'
        },
        {
            value: 'minimal',
            label: 'Минимализм (Negative Space)',
            spec: 'COMPOSITION: Minimalist. Huge negative space, small subject. Clean, airy, elegant.'
        },
        {
            value: 'knolling',
            label: 'Knolling / Grid',
            spec: 'COMPOSITION: Knolling. Ingredients and objects arranged in a clean grid or parallel lines. Organized chaos.'
        }
    ]
};

export const FOOD_DEPTH = {
    id: 'depth',
    label: '💧 Глубина резкости',
    description: 'Размытие фона (Боке)',
    options: [
        {
            value: 'f2_8',
            label: 'f/2.8 (Soft Bokeh)',
            spec: 'DEPTH OF FIELD: f/2.8 Shallow. Creamy bokeh, background melts away. Focus is razor sharp on the front of the food.'
        },
        {
            value: 'f5_6',
            label: 'f/5.6 (Balanced)',
            spec: 'DEPTH OF FIELD: f/5.6 Balanced. Main subject fully sharp, background softly out of focus but recognizable.'
        },
        {
            value: 'f11',
            label: 'f/11 (Deep Focus)',
            spec: 'DEPTH OF FIELD: f/11 Deep Focus. Everything from front to back is sharp. Commercial catalog look.'
        }
    ]
};

// ═══════════════════════════════════════════════════════════════
// SECTION 2: LIGHTING & COLOR
// ═══════════════════════════════════════════════════════════════

export const FOOD_LIGHTING = {
    id: 'lighting',
    label: '💡 Освещение',
    description: 'Световая схема',
    options: [
        {
            value: 'natural_window',
            label: 'Natural Window (Soft Side)',
            spec: 'LIGHT: Soft directional window light from side. Gentle gradients, appetizing highlights, soft shadows.',
            constraints: { source: 'window', quality: 'soft' }
        },
        {
            value: 'hard_sun',
            label: 'Hard Sun (Sharp Shadows)',
            spec: 'LIGHT: Direct hard sunlight. Sharp, long shadows. High contrast, vibrant colors. Pop aesthetic.',
            constraints: { source: 'sun', quality: 'hard' }
        },
        {
            value: 'dark_moody',
            label: 'Dark & Moody (Chiaroscuro)',
            spec: 'LIGHT: Low key, dramatic lighting. Subject highlighted, background falls into deep shadow. Rustic and emotional.',
            constraints: { source: 'controlled', quality: 'chiaroscuro' }
        },
        {
            value: 'studio_clean',
            label: 'Studio Clean (Commercial)',
            spec: 'LIGHT: Even, bright studio lighting. Minimal shadows, clean white/neutral background. Commercial catalog look.',
            constraints: { source: 'studio_box', quality: 'even' }
        },
        {
            value: 'backlight_rim',
            label: 'Backlight (Rim Light)',
            spec: 'LIGHT: Strong Backlight. Rim light catches steam and texture edges. Glowing silhouette effect, high drama.',
            constraints: { source: 'back', quality: 'rim' }
        }
    ]
};

export const FOOD_COLOR = {
    id: 'color',
    label: '🎨 Грейдинг (Цвет)',
    description: 'Цветовая палитра и настроение',
    options: [
        {
            value: 'natural_vibrant',
            label: 'Natural Vibrant',
            spec: 'COLOR: Natural, true-to-life colors but slightly punchy. Fresh vegetables look crisp, meats look juicy.',
        },
        {
            value: 'muted_organic',
            label: 'Muted / Kinfolk',
            spec: 'COLOR: Muted, organic, desaturated earth tones. Matte finish, low contrast, "Kinfolk" magazine aesthetic.',
        },
        {
            value: 'warm_golden',
            label: 'Warm Golden (Bakery)',
            spec: 'COLOR: Warm, golden, honey tones. Nostalgic and comforting. Verified bakery vibe.',
        },
        {
            value: 'cool_clean',
            label: 'Cool & Clean',
            spec: 'COLOR: Cool, blue-tinted whites, crisp and sterile. Modern, scientific, fresh (good for seafood/drinks).',
        },
        {
            value: 'dark_rich',
            label: 'Dark & Rich',
            spec: 'COLOR: Dark, rich, deep shadows. Jewel tones. Luxurious and expensive feel.',
        }
    ]
};

// ═══════════════════════════════════════════════════════════════
// SECTION 3: STYLING & TEXTURE
// ═══════════════════════════════════════════════════════════════

export const FOOD_PLATING = {
    id: 'plating',
    label: '🍽️ Подача',
    description: 'Стиль сервировки',
    options: [
        {
            value: 'fine_dining',
            label: 'Fine Dining (Michelin)',
            spec: 'PLATING: Fine Dining / Michelin style. Minimalist, precise, negative space, expensive crockery, tweezers arrangement.',
            constraints: { style: 'minimal' }
        },
        {
            value: 'rustic_messy',
            label: 'Rustic & Homey',
            spec: 'PLATING: Rustic, homey, perfectly imperfect. Crumbs on table, casual linen, generous portions, feeling of comfort.',
            constraints: { style: 'messy_controlled' }
        },
        {
            value: 'street_food',
            label: 'Street Food / Fast Food',
            spec: 'PLATING: Street Food style. Paper wrappers, greaseproof paper, vibrant, overflowing, messy, dynamic.',
            constraints: { style: 'casual' }
        },
        {
            value: 'geometric',
            label: 'Geometric / Graphic',
            spec: 'PLATING: Geometric alignment. Organized, patterned, satisfying order. Artificial and stylized.',
            constraints: { style: 'ordered' }
        }
    ]
};

export const FOOD_TEXTURE = {
    id: 'texture',
    label: '🧶 Детализация',
    description: 'Акцент на фактуре',
    options: [
        {
            value: 'sharp_crisp',
            label: 'Sharp & Crisp',
            spec: 'TEXTURE: Ultra-sharp, crisp edges. Every detail defined. High fidelity commercial look.',
        },
        {
            value: 'soft_dreamy',
            label: 'Soft & Dreamy',
            spec: 'TEXTURE: Soft, slight glow/bloom. Hazier atmosphere, less clinical detail. Emotional.',
        },
        {
            value: 'gritty_raw',
            label: 'Gritty & Raw',
            spec: 'TEXTURE: High micro-contrast, gritty detail. Enhances salt crystals, crust cracks, burnt edges.',
        }
    ]
};

export const FOOD_DYNAMICS = {
    id: 'dynamics',
    label: '💥 Динамика',
    description: 'Движение и эффекты',
    options: [
        {
            value: 'still',
            label: 'Still Life (Static)',
            spec: 'DYNAMICS: Perfectly still. No movement. Clean and calm.',
        },
        {
            value: 'steam',
            label: 'Steam (Hot)',
            spec: 'DYNAMICS: Delicate wisps of steam rising from the hot food. Backlit to show visibility.',
        },
        {
            value: 'splashes',
            label: 'Splashes / Drips',
            spec: 'DYNAMICS: Action shot! Splashing sauce, falling crumbs, or flying flour dust. Frozen motion.',
        },
        {
            value: 'human_element',
            label: 'Hand / Human Element',
            spec: 'DYNAMICS: Human element implied. A hand holding a fork, or reaching for a slice. Lifestyle feel.',
        }
    ]
};

export const FOOD_STATE = {
    id: 'state',
    label: '🌡️ Состояние',
    description: 'Физическое состояние еды',
    options: [
        {
            value: 'perfect',
            label: 'Perfect / Untouched',
            spec: 'STATE: Pristine, untouched condition. Perfect styling.',
        },
        {
            value: 'melting',
            label: 'Melting (Ice Cream/Cheese)',
            spec: 'STATE: Melting, dripping. Dynamic drips, soft edges, sense of temperature and time.',
            constraints: { fx: 'drip' }
        },
        {
            value: 'bitten',
            label: 'Eaten / Bitten',
            spec: 'STATE: Partially eaten, bitten, cut open. Shows inner texture/filling. Narrative of consumption.',
            constraints: { fx: 'texture_inside' }
        }
    ]
};

// ═══════════════════════════════════════════════════════════════
// SECTION 5: SCENE & PROPS
// ═══════════════════════════════════════════════════════════════

export const FOOD_SURFACE = {
    id: 'surface',
    label: '🪵 Поверхность',
    description: 'Фон и текстура стола',
    options: [
        {
            value: 'marble_white',
            label: 'White Marble (Classic)',
            spec: 'SURFACE: White Carrera Marble. Cool, elegant, faint grey veins. Clean luxury look.'
        },
        {
            value: 'wood_rustic',
            label: 'Rustic Wood (Dark)',
            spec: 'SURFACE: Dark Rustic Wood. Weathered texture, deep brown tones. Farmhouse/Homey vibe.'
        },
        {
            value: 'concrete',
            label: 'Concrete (Industrial)',
            spec: 'SURFACE: Grey Concrete. Matte, industrial, neutral grey. Modern and minimalist.'
        },
        {
            value: 'linen_white',
            label: 'White Linen (Tablecloth)',
            spec: 'SURFACE: White Linen Tablecloth. Soft texture, fabric folds, classic restaurant feel.'
        },
        {
            value: 'slate_dark',
            label: 'Dark Slate / Stone',
            spec: 'SURFACE: Dark Slate/Stone. Black/Dark Grey, rough texture. High contrast for bright food.'
        },
        {
            value: 'paper_crumpled',
            label: 'Crumpled Paper (Street)',
            spec: 'SURFACE: Crumpled Greaseproof Paper. Casual, messy, street food vibe.'
        }
    ]
};

export const FOOD_CROCKERY = {
    id: 'crockery',
    label: '🥣 Посуда (Если нет Ref)',
    description: 'Стиль тарелок и приборов',
    options: [
        {
            value: 'ceramic_white',
            label: 'White Ceramic (Standard)',
            spec: 'CROCKERY: Simple White Ceramic. Clean round plates. No patterns. Focus on food.'
        },
        {
            value: 'stoneware_dark',
            label: 'Dark Stoneware (Handmade)',
            spec: 'CROCKERY: Dark Stoneware. Matte glaze, organic handmade shapes, rustic feel.'
        },
        {
            value: 'wood_board',
            label: 'Wooden Board (Serving)',
            spec: 'CROCKERY: Wooden Serving Board/Paddle. No plate. Food directly on wood. Rustic/Pizza.'
        },
        {
            value: 'glass_minimal',
            label: 'Glass / Transparent',
            spec: 'CROCKERY: Clear Glass. Modern, light, shows layers.'
        },
        {
            value: 'vintage_floral',
            label: 'Vintage Floral (Grandma)',
            spec: 'CROCKERY: Vintage Porcelain with Floral pattern. Delicate, nostalgic, tea party vibe.'
        }
    ]
};

// ═══════════════════════════════════════════════════════════════
// SECTION 6: FORMAT & QUALITY
// ═══════════════════════════════════════════════════════════════

export const FOOD_ASPECT_RATIO = {
    id: 'aspectRatio',
    label: '📏 Формат',
    description: 'Соотношение сторон',
    options: [
        { value: '3:4', label: 'Vertical (Instagram) 3:4' },
        { value: '1:1', label: 'Square 1:1' },
        { value: '16:9', label: 'Cinematic 16:9' },
        { value: '9:16', label: 'Mobile Full 9:16' }
    ]
};

export const FOOD_IMAGE_SIZE = {
    id: 'imageSize',
    label: '📐 Размер (Quality)',
    description: 'Разрешение изображения',
    options: [
        { value: '2k', label: '2K (Standard) - Fast' },
        { value: '4k', label: '4K (Upscaled) - Slow' }
    ]
};

// ═══════════════════════════════════════════════════════════════
// SECTION 5: PRESETS
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// ARTISTIC PARAMETERS (Narrative Based)
// ═══════════════════════════════════════════════════════════════

export const FOOD_MOOD = {
    id: 'mood', // New parameter replacing generic Style or augmenting it
    label: '✨ Атмосфера',
    description: 'Настроение кадра',
    options: [
        {
            value: 'morning_fresh',
            label: 'Morning Freshness',
            narrative: 'ATMOSPHERE: Morning Light. Fresh, optimistic, airy. The feeling of a new day. Cool shadows, warm highlights. Sensation of breakfast.',
            constraints: { lighting: 'natural_window', color: 'natural_vibrant' }
        },
        {
            value: 'evening_cozy',
            label: 'Evening / Cozy / Hygge',
            narrative: 'ATMOSPHERE: Evening Comfort. Warm, golden, cozy. Candlelight or fireplace vibes. Deep shadows, rich warm tones. Comfort food feeling.',
            constraints: { lighting: 'dark_moody', color: 'warm_golden' }
        },
        {
            value: 'commercial_pop',
            label: 'Commercial Pop',
            narrative: 'ATMOSPHERE: Commercial Pop. Bright, high-energy, saturated. No shadows or hard shadows. Advertising perfection. "Eat me now" appeal.',
            constraints: { lighting: 'hard_sun', color: 'natural_vibrant' }
        },
        {
            value: 'luxury_dark',
            label: 'Dark Luxury',
            narrative: 'ATMOSPHERE: Dark Luxury. Mysterious, expensive, sophisticated. Deep chiaroscuro, jewel tones. Fine dining elegance.',
            constraints: { lighting: 'dark_moody', color: 'dark_rich' }
        }
    ]
};

// ═══════════════════════════════════════════════════════════════
// VALIDATION & SANITIZATION LOGIC
// ═══════════════════════════════════════════════════════════════

/**
 * Validate and Auto-Correct Food Parameters
 * Resolves physical contradictions like "Hard Light" + "Soft Shadows"
 */
export function validateFoodParams(params) {
    const corrections = [];
    const newParams = { ...params };

    // 1. Lighting Coherence (Source vs Quality)
    // Direct Sun cannot be Soft
    if (newParams.lighting === 'hard_sun') {
        // Enforce Hard Specs
        // We don't have a separate 'lightQuality' param yet in Food, 
        // but if we did, we'd fix it here. 
        // For now, let's ensure the MOOD matches the Lighting.

        // If Mood is "Evening Cozy" (Soft) but Lighting is "Hard Sun" -> Conflict
        if (newParams.mood === 'evening_cozy') {
            newParams.lighting = 'dark_moody';
            corrections.push('Lighting changed to Dark/Moody to match Cozy Mood (Sun is too harsh)');
        }
    }

    // 2. Camera vs Shot Size
    // 100mm Macro cannot do "Wide Table" composition
    if (newParams.camera === 'macro_100mm' && newParams.composition === 'minimal') {
        newParams.composition = 'center';
        corrections.push('Composition changed to Center for Macro Lens (Minimal requires wide FOV)');
    }

    // 3. Texture vs Light
    // "Soft Dreamy" texture conflicts with "Hard Sun" lighting
    if (newParams.texture === 'soft_dreamy' && newParams.lighting === 'hard_sun') {
        newParams.lighting = 'natural_window';
        corrections.push('Lighting changed to Window (Soft) to match Dreamy Texture');
    }

    return { params: newParams, corrections };
}

export const FOOD_PRESETS = [
    {
        id: 'commercial_fresh',
        label: 'Commercial Fresh (Catalog)',
        description: 'Bright, clean, punchy colors. Standard for menus.',
        values: {
            camera: 'standard_50mm',
            angle: '45_degree',
            composition: 'center',
            depth: 'f11',
            lighting: 'studio_clean',
            color: 'natural_vibrant',
            plating: 'geometric',
            texture: 'sharp_crisp',
            dynamics: 'still',
            state: 'perfect',
            surface: 'marble_white',
            crockery: 'ceramic_white',
            mood: 'commercial_pop'
        }
    },
    {
        id: 'dark_moody',
        label: 'Dark & Moody (Editorial)',
        description: 'Low key, dramatic shadows, rich textures.',
        values: {
            camera: 'standard_50mm',
            angle: 'eye_level',
            composition: 'rule_of_thirds',
            depth: 'f2_8',
            lighting: 'dark_moody',
            color: 'dark_rich',
            plating: 'rustic_messy',
            texture: 'gritty_raw',
            dynamics: 'still',
            state: 'perfect',
            surface: 'wood_rustic',
            crockery: 'stoneware_dark',
            mood: 'luxury_dark'
        }
    },
    {
        id: 'instagram_trend',
        label: 'Insta Trend (Flat Lay)',
        description: 'Top down, soft light, minimal colorful look.',
        values: {
            camera: 'wide_35mm',
            angle: 'flat_lay',
            composition: 'knolling',
            depth: 'f5_6',
            lighting: 'natural_window',
            color: 'natural_vibrant',
            plating: 'geometric',
            texture: 'soft_dreamy',
            dynamics: 'still',
            state: 'perfect',
            surface: 'concrete',
            crockery: 'ceramic_white',
            mood: 'morning_fresh'
        }
    },
    {
        id: 'macro_porn',
        label: 'Food Porn (Macro)',
        description: 'Extreme close up, dripping, shiny, impossible to resist.',
        values: {
            camera: 'macro_100mm',
            angle: '45_degree',
            composition: 'center',
            depth: 'f2_8',
            lighting: 'backlight_rim',
            color: 'warm_golden',
            plating: 'rustic_messy',
            texture: 'sharp_crisp',
            dynamics: 'human_element',
            state: 'bitten',
            surface: 'slate_dark',
            crockery: 'stoneware_dark',
            mood: 'commercial_pop'
        }
    }
];
