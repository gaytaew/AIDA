/**
 * Product Shoot Schema
 * 
 * Специализированные параметры для предметной съёмки.
 * Фокус на текстурах, чистых фонах и коммерческом качестве.
 */

// ═══════════════════════════════════════════════════════════════
// БЛОК 1: ОБЪЕКТ (Subject)
// ═══════════════════════════════════════════════════════════════

export const PRODUCT_CATEGORY = {
    id: 'category',
    label: '📦 Категория',
    description: 'Тип объекта',
    options: [
        { value: 'clothing', label: 'Одежда' },
        { value: 'footwear', label: 'Обувь' },
        { value: 'bag', label: 'Сумки' },
        { value: 'jewelry', label: 'Украшения' },
        { value: 'cosmetics', label: 'Косметика' },
        { value: 'tech', label: 'Техника' },
        { value: 'decor', label: 'Декор' },
        { value: 'other', label: 'Другое' }
    ]
};

// ═══════════════════════════════════════════════════════════════
// БЛОК 2: КОМПОЗИЦИЯ (Composition)
// ═══════════════════════════════════════════════════════════════

export const PRODUCT_PRESENTATION = {
    id: 'presentation',
    label: '🎯 Подача',
    description: 'Как представлен объект',
    options: [
        {
            value: 'flat_lay',
            label: 'Flat Lay (Раскладка)',
            spec: 'PRESENTATION: Flat lay arrangement. Top-down view, clean organized layout.',
            subParams: [{
                id: 'arrangement',
                label: 'Расположение',
                options: [
                    { value: 'neat', label: 'Аккуратно', spec: 'ARRANGEMENT: Neatly organized, symmetric, perfect alignment.' },
                    { value: 'casual', label: 'Небрежно', spec: 'ARRANGEMENT: Casual, relaxed, intentionally imperfect.' },
                    { value: 'knolling', label: 'Knolling', spec: 'ARRANGEMENT: Knolling style - items at 90° angles, geometric grid.' }
                ]
            }]
        },
        {
            value: 'hanging',
            label: 'На вешалке (Hanging)',
            spec: 'PRESENTATION: Garment on hanger. Clean silhouette, natural drape.',
            subParams: [{
                id: 'hangerType',
                label: 'Тип вешалки',
                options: [
                    { value: 'wooden', label: 'Деревянная', spec: 'HANGER: Premium wooden hanger, natural finish.' },
                    { value: 'velvet', label: 'Бархатная', spec: 'HANGER: Velvet slim hanger, luxury feel.' },
                    { value: 'invisible', label: 'Невидимая', spec: 'HANGER: Invisible/clear hanger, garment appears floating.' }
                ]
            }]
        },
        {
            value: 'mannequin',
            label: 'Манекен (Ghost)',
            spec: 'PRESENTATION: Ghosted mannequin / invisible form. Garment appears worn but no visible mannequin. 3D shape with void inside.',
            subParams: [{
                id: 'mannequinStyle',
                label: 'Стиль',
                options: [
                    { value: 'full', label: 'Полный', spec: 'MANNEQUIN: Full body ghosted mannequin, complete silhouette.' },
                    { value: 'torso', label: 'Торс', spec: 'MANNEQUIN: Torso only, cropped at waist.' },
                    { value: 'neck_down', label: 'Без головы', spec: 'MANNEQUIN: Neck-down, no head form.' }
                ]
            }]
        },
        {
            value: 'stack',
            label: 'Стопка (Stack)',
            spec: 'PRESENTATION: Stacked/folded items. Layered composition.',
            subParams: [{
                id: 'stackStyle',
                label: 'Стиль стопки',
                options: [
                    { value: 'folded', label: 'Сложенная', spec: 'STACK: Neatly folded items, retail display style.' },
                    { value: 'piled', label: 'Навал', spec: 'STACK: Casually piled, relaxed stack.' },
                    { value: 'cascading', label: 'Каскад', spec: 'STACK: Cascading arrangement, items flowing down.' }
                ]
            }]
        },
        {
            value: 'floating',
            label: 'Левитация (Floating)',
            spec: 'PRESENTATION: Floating in mid-air. Dramatic, dynamic, zero gravity effect.',
            subParams: [{
                id: 'floatHeight',
                label: 'Высота',
                options: [
                    { value: 'low', label: 'Низко', spec: 'FLOAT HEIGHT: Just above surface, subtle levitation.' },
                    { value: 'medium', label: 'Средне', spec: 'FLOAT HEIGHT: Mid-air, clear floating effect.' },
                    { value: 'high', label: 'Высоко', spec: 'FLOAT HEIGHT: High in frame, dramatic floating.' }
                ]
            }]
        },
        {
            value: 'on_surface',
            label: 'На поверхности',
            spec: 'PRESENTATION: Product placed on surface. Natural, grounded, tactile.'
        }
    ]
};

export const PRODUCT_ANGLE = {
    id: 'angle',
    label: '📐 Ракурс',
    description: 'Угол съёмки',
    options: [
        {
            value: 'top_down',
            label: 'Сверху (90°)',
            spec: 'CAMERA ANGLE: 90° top-down. Perfect for flat lay compositions.'
        },
        {
            value: 'three_quarter',
            label: '3/4 (45°)',
            spec: 'CAMERA ANGLE: 45° three-quarter view. Shows depth and dimension.'
        },
        {
            value: 'side',
            label: 'Сбоку (0°)',
            spec: 'CAMERA ANGLE: Side view, eye level. Profile shot, good for shoes and bags.'
        },
        {
            value: 'low_angle',
            label: 'Снизу (Hero)',
            spec: 'CAMERA ANGLE: Low angle, looking up. Heroic, powerful presence.'
        }
    ]
};

export const PRODUCT_FRAMING = {
    id: 'framing',
    label: '🖼️ Кадрирование',
    description: 'Что в кадре',
    options: [
        {
            value: 'full',
            label: 'Полный объект',
            spec: 'FRAMING: Full product visible with margin. Complete item in frame.'
        },
        {
            value: 'detail_crop',
            label: 'Деталь (Макро)',
            spec: 'FRAMING: Tight crop on detail. Macro focus on texture, stitching, hardware.'
        },
        {
            value: 'context',
            label: 'С окружением',
            spec: 'FRAMING: Product in context with props and environment. Lifestyle feel.'
        }
    ]
};

// ═══════════════════════════════════════════════════════════════
// БЛОК 3: ФОН И ПОВЕРХНОСТЬ (Background)
// ═══════════════════════════════════════════════════════════════

export const PRODUCT_BACKGROUND = {
    id: 'background',
    label: '🎨 Фон',
    description: 'Задний план',
    options: [
        {
            value: 'pure_white',
            label: 'Чистый белый',
            spec: 'BACKGROUND: Pure white (#FFFFFF) seamless backdrop. Clean e-commerce standard.'
        },
        {
            value: 'gradient_grey',
            label: 'Градиент серый',
            spec: 'BACKGROUND: Soft grey gradient. Studio look, slight depth.'
        },
        {
            value: 'seamless_beige',
            label: 'Бежевый',
            spec: 'BACKGROUND: Warm beige/cream seamless. Soft, organic, natural feel.'
        },
        {
            value: 'seamless_black',
            label: 'Чёрный',
            spec: 'BACKGROUND: Deep black backdrop. Dramatic, luxury, high contrast.'
        },
        {
            value: 'texture_concrete',
            label: 'Бетон',
            spec: 'BACKGROUND: Grey concrete texture. Industrial, urban, modern.'
        },
        {
            value: 'texture_marble',
            label: 'Мрамор',
            spec: 'BACKGROUND: White marble with grey veins. Luxury, elegant, premium.'
        },
        {
            value: 'texture_wood',
            label: 'Дерево',
            spec: 'BACKGROUND: Natural wood texture. Warm, organic, rustic.'
        },
        {
            value: 'fabric_linen',
            label: 'Лён/Ткань',
            spec: 'BACKGROUND: Linen or fabric texture. Soft, tactile, fashion editorial.'
        },
        {
            value: 'context_interior',
            label: 'Интерьер',
            spec: 'BACKGROUND: Interior context - room, furniture, lifestyle setting.'
        }
    ]
};

export const PRODUCT_SURFACE = {
    id: 'surface',
    label: '🪵 Поверхность',
    description: 'На чём лежит объект',
    options: [
        {
            value: 'none',
            label: 'Бесшовный фон',
            spec: 'SURFACE: None - seamless backdrop continues under product.'
        },
        {
            value: 'table_white',
            label: 'Белый стол',
            spec: 'SURFACE: White table/platform. Clean edge visible.'
        },
        {
            value: 'table_wood',
            label: 'Деревянный стол',
            spec: 'SURFACE: Wooden table surface. Warm, natural texture.'
        },
        {
            value: 'pedestal',
            label: 'Подиум',
            spec: 'SURFACE: Display pedestal/plinth. Elevated, museum-like presentation.'
        },
        {
            value: 'mirror',
            label: 'Зеркальная',
            spec: 'SURFACE: Mirror/reflective surface. Creates reflection below product.'
        }
    ]
};

export const PRODUCT_SHADOW = {
    id: 'shadow',
    label: '🌑 Тень',
    description: 'Тип тени',
    options: [
        {
            value: 'none',
            label: 'Без тени',
            spec: 'SHADOW: No shadow. Pure floating on white. Clean cutout look.'
        },
        {
            value: 'soft_drop',
            label: 'Мягкая',
            spec: 'SHADOW: Soft drop shadow. Gentle gradient, grounds the product.'
        },
        {
            value: 'hard_sharp',
            label: 'Жёсткая',
            spec: 'SHADOW: Hard sharp shadow. Graphic, bold, defined edges.'
        },
        {
            value: 'reflection',
            label: 'Отражение',
            spec: 'SHADOW: Mirror reflection below. Sleek, tech product aesthetic.'
        },
        {
            value: 'contact',
            label: 'Контактная',
            spec: 'SHADOW: Contact shadow only. Minimal, just where product touches surface.'
        }
    ]
};

// ═══════════════════════════════════════════════════════════════
// БЛОК 4: ОСВЕЩЕНИЕ И СТИЛЬ (Lighting & Style)
// ═══════════════════════════════════════════════════════════════

export const PRODUCT_LIGHTING = {
    id: 'lighting',
    label: '💡 Освещение',
    description: 'Тип света',
    options: [
        {
            value: 'softbox_diffused',
            label: 'Софтбокс (Мягкий)',
            spec: 'LIGHTING: Large softbox diffused light. Even, soft, minimal shadows. Commercial standard.'
        },
        {
            value: 'hard_spotlight',
            label: 'Споттлайт (Жёсткий)',
            spec: 'LIGHTING: Hard spotlight. Dramatic shadows, high contrast, theatrical.'
        },
        {
            value: 'natural_window',
            label: 'Окно (Натуральный)',
            spec: 'LIGHTING: Natural window light. Soft directional, lifestyle feel.'
        },
        {
            value: 'neon_accent',
            label: 'Неон (Цветной)',
            spec: 'LIGHTING: Neon/colored accent lights. Vibrant, modern, tech aesthetic.',
            subParams: [{
                id: 'neonColor',
                label: 'Цвет неона',
                options: [
                    { value: 'pink', label: 'Розовый', spec: 'NEON COLOR: Pink/magenta neon accent.' },
                    { value: 'blue', label: 'Синий', spec: 'NEON COLOR: Blue/cyan neon accent.' },
                    { value: 'mixed', label: 'Микс', spec: 'NEON COLOR: Mixed pink and blue neon.' }
                ]
            }]
        },
        {
            value: 'rim_light',
            label: 'Контровой (Rim)',
            spec: 'LIGHTING: Strong rim/back light. Glowing edges, silhouette definition.'
        },
        {
            value: 'studio_multi',
            label: 'Студийный (3-point)',
            spec: 'LIGHTING: Professional 3-point studio setup. Key, fill, and back light.'
        }
    ]
};

export const PRODUCT_LIGHT_DIRECTION = {
    id: 'lightDirection',
    label: '☀️ Направление света',
    description: 'Откуда падает свет',
    options: [
        {
            value: 'front',
            label: 'Фронтальный',
            spec: 'LIGHT DIRECTION: Front light. Even, flat, minimal shadows.'
        },
        {
            value: 'side_45',
            label: 'Боковой 45°',
            spec: 'LIGHT DIRECTION: Side light at 45°. Creates dimension and texture.'
        },
        {
            value: 'side_90',
            label: 'Боковой 90°',
            spec: 'LIGHT DIRECTION: Hard side light at 90°. Dramatic split lighting.'
        },
        {
            value: 'backlit',
            label: 'Контровой',
            spec: 'LIGHT DIRECTION: Backlit. Rim glow, silhouette effect.'
        },
        {
            value: 'top_down',
            label: 'Сверху',
            spec: 'LIGHT DIRECTION: Top-down light. Good for flat lay shots.'
        }
    ]
};

export const PRODUCT_MOOD = {
    id: 'mood',
    label: '✨ Стиль/Настроение',
    description: 'Общее настроение кадра',
    options: [
        {
            value: 'minimalist',
            label: 'Минимализм',
            spec: 'MOOD: Minimalist. Clean, simple, lots of negative space. Pure product focus.'
        },
        {
            value: 'luxury',
            label: 'Люкс',
            spec: 'MOOD: Luxury/Premium. Rich textures, dramatic lighting, expensive feel.'
        },
        {
            value: 'industrial',
            label: 'Индустриальный',
            spec: 'MOOD: Industrial. Raw textures, concrete, metal, urban aesthetic.'
        },
        {
            value: 'vintage',
            label: 'Винтаж',
            spec: 'MOOD: Vintage/Retro. Warm tones, nostalgic, film-like quality.'
        },
        {
            value: 'pop_art',
            label: 'Поп-арт',
            spec: 'MOOD: Pop Art. Bold colors, high saturation, graphic, playful.'
        },
        {
            value: 'natural',
            label: 'Натуральный',
            spec: 'MOOD: Natural/Organic. Soft light, earth tones, sustainable feel.'
        },
        {
            value: 'tech',
            label: 'Технологичный',
            spec: 'MOOD: Tech/Futuristic. Sleek, reflective, blue/silver tones, modern.'
        }
    ]
};

export const PRODUCT_COLOR_GRADE = {
    id: 'colorGrade',
    label: '🎨 Цветокоррекция',
    description: 'Цветовая обработка',
    options: [
        {
            value: 'neutral',
            label: 'Нейтральная',
            spec: 'COLOR GRADE: Neutral, true-to-life colors. Accurate product representation.'
        },
        {
            value: 'warm_golden',
            label: 'Тёплая золотистая',
            spec: 'COLOR GRADE: Warm golden tones. Cozy, inviting, autumn feel.'
        },
        {
            value: 'cool_silver',
            label: 'Холодная серебристая',
            spec: 'COLOR GRADE: Cool silver/blue tones. Modern, tech, winter.'
        },
        {
            value: 'desaturated',
            label: 'Приглушённая',
            spec: 'COLOR GRADE: Desaturated, muted colors. Editorial, artistic.'
        },
        {
            value: 'high_contrast',
            label: 'Высокий контраст',
            spec: 'COLOR GRADE: High contrast, punchy colors. Bold, attention-grabbing.'
        }
    ]
};

// ═══════════════════════════════════════════════════════════════
// БЛОК 5: ДЕТАЛИЗАЦИЯ (Details)
// ═══════════════════════════════════════════════════════════════

export const PRODUCT_DETAIL_LEVEL = {
    id: 'detailLevel',
    label: '🔍 Детализация',
    description: 'Уровень детализации',
    options: [
        {
            value: 'standard',
            label: 'Стандартная',
            spec: 'DETAIL LEVEL: Standard detail. Clean, commercial quality.'
        },
        {
            value: 'macro_texture',
            label: 'Макро (Текстуры)',
            spec: 'DETAIL LEVEL: Macro texture detail. Visible fabric weave, stitching, material grain.'
        },
        {
            value: 'ultra_hd',
            label: 'Ultra HD',
            spec: 'DETAIL LEVEL: Ultra HD, maximum sharpness. Every fiber and thread visible.'
        }
    ]
};

export const PRODUCT_SHOW_DETAILS = {
    id: 'showDetails',
    label: '👁️ Показать',
    description: 'Акцент на деталях',
    options: [
        { value: 'seams', label: 'Швы', spec: 'SHOW DETAIL: Visible seams and construction.' },
        { value: 'stitching', label: 'Строчка', spec: 'SHOW DETAIL: Visible stitching pattern.' },
        { value: 'fabric_weave', label: 'Плетение ткани', spec: 'SHOW DETAIL: Fabric weave texture visible.' },
        { value: 'hardware', label: 'Фурнитура', spec: 'SHOW DETAIL: Hardware details - zippers, buttons, buckles.' },
        { value: 'label', label: 'Этикетка', spec: 'SHOW DETAIL: Brand label or tag visible.' }
    ]
};

export const PRODUCT_ASPECT_RATIO = {
    id: 'aspectRatio',
    label: '📏 Формат',
    description: 'Соотношение сторон',
    options: [
        { value: '1:1', label: 'Квадрат 1:1' },
        { value: '3:4', label: 'Вертикальный 3:4' },
        { value: '4:3', label: 'Горизонтальный 4:3' },
        { value: '4:5', label: 'Instagram 4:5' },
        { value: '16:9', label: 'Широкий 16:9' }
    ]
};

export const PRODUCT_IMAGE_SIZE = {
    id: 'imageSize',
    label: '📐 Качество',
    description: 'Разрешение',
    options: [
        { value: '2k', label: '2K (Быстро)' },
        { value: '4k', label: '4K (Медленно)' }
    ]
};

// ═══════════════════════════════════════════════════════════════
// ПРЕСЕТЫ
// ═══════════════════════════════════════════════════════════════

export const PRODUCT_PRESETS = [
    {
        id: 'ecommerce_white',
        label: 'E-commerce (Белый фон)',
        description: 'Стандартный каталожный снимок',
        values: {
            presentation: 'on_surface',
            angle: 'three_quarter',
            framing: 'full',
            background: 'pure_white',
            surface: 'none',
            shadow: 'soft_drop',
            lighting: 'softbox_diffused',
            lightDirection: 'front',
            mood: 'minimalist',
            colorGrade: 'neutral',
            detailLevel: 'standard'
        }
    },
    {
        id: 'flat_lay_casual',
        label: 'Flat Lay (Небрежный)',
        description: 'Раскладка сверху, расслабленный стиль',
        values: {
            presentation: 'flat_lay',
            angle: 'top_down',
            framing: 'full',
            background: 'fabric_linen',
            surface: 'none',
            shadow: 'soft_drop',
            lighting: 'natural_window',
            lightDirection: 'side_45',
            mood: 'natural',
            colorGrade: 'warm_golden',
            detailLevel: 'standard'
        }
    },
    {
        id: 'luxury_dark',
        label: 'Люкс (Тёмный фон)',
        description: 'Премиальная подача на чёрном',
        values: {
            presentation: 'on_surface',
            angle: 'three_quarter',
            framing: 'full',
            background: 'seamless_black',
            surface: 'mirror',
            shadow: 'reflection',
            lighting: 'rim_light',
            lightDirection: 'backlit',
            mood: 'luxury',
            colorGrade: 'high_contrast',
            detailLevel: 'macro_texture'
        }
    },
    {
        id: 'ghost_mannequin',
        label: 'Манекен (Ghost)',
        description: 'Невидимый манекен для одежды',
        values: {
            presentation: 'mannequin',
            angle: 'three_quarter',
            framing: 'full',
            background: 'pure_white',
            surface: 'none',
            shadow: 'soft_drop',
            lighting: 'studio_multi',
            lightDirection: 'front',
            mood: 'minimalist',
            colorGrade: 'neutral',
            detailLevel: 'standard'
        }
    }
];

// ═══════════════════════════════════════════════════════════════
// ВАЛИДАЦИЯ
// ═══════════════════════════════════════════════════════════════

/**
 * Валидация и авто-коррекция параметров
 */
export function validateProductParams(params) {
    const corrections = [];
    const newParams = { ...params };

    // 1. Flat Lay требует top_down angle
    if (newParams.presentation === 'flat_lay' && newParams.angle !== 'top_down') {
        newParams.angle = 'top_down';
        corrections.push('Ракурс изменён на "Сверху" для Flat Lay');
    }

    // 2. Mannequin несовместим с top_down
    if (newParams.presentation === 'mannequin' && newParams.angle === 'top_down') {
        newParams.angle = 'three_quarter';
        corrections.push('Ракурс изменён на "3/4" для режима Манекен');
    }

    // 3. Floating несовместим с отражением
    if (newParams.presentation === 'floating' && newParams.shadow === 'reflection') {
        newParams.shadow = 'soft_drop';
        corrections.push('Тень изменена на "Мягкую" для левитации');
    }

    return { params: newParams, corrections };
}

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════

export default {
    PRODUCT_CATEGORY,
    PRODUCT_PRESENTATION,
    PRODUCT_ANGLE,
    PRODUCT_FRAMING,
    PRODUCT_BACKGROUND,
    PRODUCT_SURFACE,
    PRODUCT_SHADOW,
    PRODUCT_LIGHTING,
    PRODUCT_LIGHT_DIRECTION,
    PRODUCT_MOOD,
    PRODUCT_COLOR_GRADE,
    PRODUCT_DETAIL_LEVEL,
    PRODUCT_SHOW_DETAILS,
    PRODUCT_ASPECT_RATIO,
    PRODUCT_IMAGE_SIZE,
    PRODUCT_PRESETS,
    validateProductParams
};
