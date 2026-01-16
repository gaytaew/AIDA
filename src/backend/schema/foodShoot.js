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
            constraints: { shotSize: 'macro', dof: 'shallow' },
            subParams: [{
                id: 'macroDistance',
                label: 'Дистанция',
                options: [
                    { value: '10cm', label: '10 см (Extreme)', spec: 'MACRO DISTANCE: 10cm. Extreme detail, single ingredient in frame.' },
                    { value: '20cm', label: '20 см (Detail)', spec: 'MACRO DISTANCE: 20cm. Detailed view of main portion.' },
                    { value: '30cm', label: '30 см (Soft Macro)', spec: 'MACRO DISTANCE: 30cm. Soft macro, entire dish visible with detail.' }
                ]
            }]
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
            constraints: { perspective: 'flat' },
            subParams: [{
                id: 'flatRotation',
                label: 'Ориентация',
                options: [
                    { value: '0', label: '0°', spec: 'FLAT ROTATION: 0 degrees. Standard orientation.' },
                    { value: '45', label: '45°', spec: 'FLAT ROTATION: 45 degrees. Diamond/diagonal composition.' },
                    { value: '90', label: '90°', spec: 'FLAT ROTATION: 90 degrees. Rotated orientation.' }
                ]
            }]
        },
        {
            value: '45_degree',
            label: '45° (Diner\'s Eye)',
            spec: 'ANGLE: 45° Angle (Diner\'s View). The most appetizing angle, showing volume and depth of the dish.',
            constraints: { perspective: 'natural' },
            subParams: [{
                id: 'horizontalOffset',
                label: 'Смещение',
                options: [
                    { value: 'left', label: 'Левее', spec: 'CAMERA OFFSET: Slight offset to the left, asymmetric composition.' },
                    { value: 'center', label: 'Центр', spec: 'CAMERA OFFSET: Centered shot, symmetric.' },
                    { value: 'right', label: 'Правее', spec: 'CAMERA OFFSET: Slight offset to the right, asymmetric composition.' }
                ]
            }]
        },
        {
            value: 'eye_level',
            label: 'Eye Level (0° Side View)',
            spec: 'ANGLE: 0° Eye Level (Side View). Highlights height, layers, and vertical details (burgers, drinks, stacks).',
            constraints: { perspective: 'side' },
            subParams: [{
                id: 'horizontalOffset',
                label: 'Смещение',
                options: [
                    { value: 'left', label: 'Левее', spec: 'CAMERA OFFSET: Slight offset to the left, asymmetric composition.' },
                    { value: 'center', label: 'Центр', spec: 'CAMERA OFFSET: Centered shot, symmetric.' },
                    { value: 'right', label: 'Правее', spec: 'CAMERA OFFSET: Slight offset to the right, asymmetric composition.' }
                ]
            }]
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
    label: '💧 Диафрагма (Размытие)',
    description: 'Глубина резкости',
    options: [
        {
            value: 'f2_8',
            label: 'f/2.8 (Soft Bokeh)',
            spec: 'APERTURE: f/2.8 Shallow depth. Creamy bokeh, background melts away. Focus is razor sharp on the front of the food.'
        },
        {
            value: 'f5_6',
            label: 'f/5.6 (Balanced)',
            spec: 'APERTURE: f/5.6 Balanced. Main subject fully sharp, background softly out of focus but recognizable.'
        },
        {
            value: 'f11',
            label: 'f/11 (Deep Focus)',
            spec: 'APERTURE: f/11 Deep Focus. Everything from front to back is sharp. Commercial catalog look.'
        }
    ]
};

// NEW: Focus Point
export const FOOD_FOCUS_POINT = {
    id: 'focusPoint',
    label: '🎯 Точка фокуса',
    description: 'Куда смотрит камера',
    options: [
        {
            value: 'front',
            label: 'Передний план',
            spec: 'FOCUS POINT: Front Focus. Sharpest focus on the nearest edge of the food, blurring into the background.'
        },
        {
            value: 'center',
            label: 'Центр блюда',
            spec: 'FOCUS POINT: Center Focus. Main subject in the center is sharpest, edges fall off slightly.'
        },
        {
            value: 'top_flat',
            label: 'Flat Focus (Флэтлей)',
            spec: 'FOCUS POINT: Top-Down Flat. Everything in the same focal plane (for flat lay shots). Evenly sharp.'
        }
    ]
};

// ═══════════════════════════════════════════════════════════════
// SECTION 2: LIGHTING & COLOR
// ═══════════════════════════════════════════════════════════════

export const FOOD_LIGHTING = {
    id: 'lighting',
    label: '💡 Источник света',
    description: 'Тип и качество света',
    options: [
        {
            value: 'natural_window',
            label: 'Окно (Soft)',
            spec: 'LIGHT SOURCE: Soft directional window light. Gentle gradients, appetizing highlights.',
            constraints: { source: 'window', quality: 'soft' }
        },
        {
            value: 'hard_sun',
            label: 'Прямое солнце (Hard)',
            spec: 'LIGHT SOURCE: Direct hard sunlight. High contrast, vibrant colors. Pop aesthetic.',
            constraints: { source: 'sun', quality: 'hard' }
        },
        {
            value: 'dark_moody',
            label: 'Chiaroscuro (Moody)',
            spec: 'LIGHT SOURCE: Low key, dramatic. Subject highlighted, background in deep shadow.',
            constraints: { source: 'controlled', quality: 'chiaroscuro' }
        },
        {
            value: 'studio_clean',
            label: 'Студийный (Commercial)',
            spec: 'LIGHT SOURCE: Even, bright studio lighting. Minimal shadows, clean background.',
            constraints: { source: 'studio_box', quality: 'even' }
        },
        {
            value: 'candlelight',
            label: 'Свечи (Warm Evening)',
            spec: 'LIGHT SOURCE: Candlelight or firelight. Warm orange glow, deep shadows, intimate.',
            constraints: { source: 'candle', quality: 'warm' }
        }
    ]
};

// NEW: Light Direction (Critical for food texture!)
export const FOOD_LIGHT_DIRECTION = {
    id: 'lightDirection',
    label: '☀️ Направление света',
    description: 'Откуда падает свет',
    options: [
        {
            value: 'backlit',
            label: 'Контровой (Backlit)',
            spec: 'LIGHT DIRECTION: Strong Backlight. Rim light catches steam and texture edges. Glowing silhouette effect.',
            subParams: [{
                id: 'fillLight',
                label: 'Заполнение',
                options: [
                    { value: 'none', label: 'Нет', spec: 'FILL LIGHT: None. Pure silhouette, dramatic.' },
                    { value: 'minimal', label: 'Минимальное', spec: 'FILL LIGHT: Minimal. Subtle front texture visible.' },
                    { value: 'strong', label: 'Сильное', spec: 'FILL LIGHT: Strong reflector fill. Backlit but front fully visible.' }
                ]
            }]
        },
        {
            value: 'side',
            label: 'Боковой (Side)',
            spec: 'LIGHT DIRECTION: Side Light (45°). Creates volume and dimension. Classic food photography direction.'
        },
        {
            value: 'front',
            label: 'Фронтальный (Front)',
            spec: 'LIGHT DIRECTION: Front Light. Flat, even illumination. Minimal shadows. Clean commercial look.'
        },
        {
            value: 'top_down',
            label: 'Сверху (Top Down)',
            spec: 'LIGHT DIRECTION: Top Down Light. For flat lay shots. Even lighting, minimal harsh shadows.'
        }
    ]
};

// NEW: Shadow Character
export const FOOD_SHADOWS = {
    id: 'shadows',
    label: '🌑 Характер теней',
    description: 'Мягкость и глубина теней',
    options: [
        {
            value: 'soft_diffused',
            label: 'Мягкие (Diffused)',
            spec: 'SHADOWS: Soft, diffused shadows. Gentle gradients, no harsh edges. Feminine, delicate feel.'
        },
        {
            value: 'hard_crisp',
            label: 'Жёсткие (Crisp)',
            spec: 'SHADOWS: Hard, crisp shadows. Sharp edges, graphic quality. Bold, pop aesthetic.'
        },
        {
            value: 'deep_moody',
            label: 'Глубокие (Deep Black)',
            spec: 'SHADOWS: Deep, rich black shadows. High contrast. Dramatic, moody, editorial feel.'
        },
        {
            value: 'minimal',
            label: 'Минимальные (Clean)',
            spec: 'SHADOWS: Minimal to no shadows. Bright, even lighting. Commercial catalog look.'
        }
    ]
};

// NEW: Haptics / Physical Effects
export const FOOD_HAPTICS = {
    id: 'haptics',
    label: '♨️ Физика (Эффекты)',
    description: 'Пар, капли, текстура',
    options: [
        {
            value: 'clean',
            label: 'Clean (Без эффектов)',
            spec: 'PHYSICAL EFFECTS: Clean, pristine. No steam, no drips. Perfect styling.'
        },
        {
            value: 'steam_hot',
            label: 'Горячий пар (Steam)',
            spec: 'PHYSICAL EFFECTS: Visible steam rising from hot food. Backlit to enhance visibility. Appetizing warmth.',
            subParams: [{
                id: 'steamIntensity',
                label: 'Количество',
                options: [
                    { value: 'light', label: 'Легкий', spec: 'STEAM: Light wisps of steam, subtle.' },
                    { value: 'medium', label: 'Средний', spec: 'STEAM: Medium visible steam cloud.' },
                    { value: 'heavy', label: 'Сильный', spec: 'STEAM: Heavy, dramatic steam billowing.' }
                ]
            }]
        },
        {
            value: 'condensation_cold',
            label: 'Капли/Конденсат (Cold)',
            spec: 'PHYSICAL EFFECTS: Condensation droplets on cold surface. Dewy, refreshing. Good for drinks and cold dishes.',
            subParams: [{
                id: 'condensationType',
                label: 'Тип',
                options: [
                    { value: 'droplets', label: 'Только капли', spec: 'CONDENSATION: Individual water droplets on surface.' },
                    { value: 'frosted', label: 'Запотевание', spec: 'CONDENSATION: Frosted, fogged surface with ice crystals.' }
                ]
            }]
        },
        {
            value: 'glistening_oily',
            label: 'Блеск/Глянец (Oily)',
            spec: 'PHYSICAL EFFECTS: Glistening, glossy surface. Oil sheen, sauce highlights. Juicy and appetizing.'
        },
        {
            value: 'crumbs_messy',
            label: 'Крошки/Разлито (Messy)',
            spec: 'PHYSICAL EFFECTS: Crumbs, spills, scattered elements. Lived-in, authentic, \"in progress\" eating feel.'
        }
    ]
};


// NEW: Film Stock / Color Grading
export const FOOD_FILM_STOCK = {
    id: 'filmStock',
    label: '🎞️ Пленка (Look)',
    description: 'Цветовая обработка',
    options: [
        {
            value: 'digital_clean',
            label: 'Digital Clean (Neutral)',
            spec: 'FILM LOOK: Clean digital. True-to-life colors, no grain, high sharpness. Modern commercial.'
        },
        {
            value: 'kodak_portra',
            label: 'Kodak Portra (Warm Skin)',
            spec: 'FILM LOOK: Kodak Portra 400 emulation. Warm skin tones, soft highlights, subtle grain. Advertising classic.'
        },
        {
            value: 'fuji_velvia',
            label: 'Fuji Velvia (Saturated)',
            spec: 'FILM LOOK: Fuji Velvia emulation. High saturation, punchy colors, deep blacks. Dramatic landscape style.'
        },
        {
            value: 'cinematic_teal',
            label: 'Cinematic (Teal & Orange)',
            spec: 'FILM LOOK: Cinematic Teal & Orange. Hollywood color grading. Warm highlights, cool shadows.'
        },
        {
            value: 'vintage_faded',
            label: 'Vintage Faded (70s)',
            spec: 'FILM LOOK: Vintage faded. Lifted blacks, muted colors, slight color shift. Nostalgic, retro feel.'
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
