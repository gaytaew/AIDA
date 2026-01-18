/**
 * Product Shoot Parameters V2
 * Минималистичная система: 4 режима + условные параметры
 */

export const SHOT_MODES = {
    catalog: {
        id: 'catalog',
        label: 'Каталог',
        icon: '📦',
        description: 'Чистый фон, студийный свет'
    },
    flatlay: {
        id: 'flatlay',
        label: 'Flat Lay',
        icon: '⬇️',
        description: 'Вид сверху на поверхности'
    },
    lifestyle: {
        id: 'lifestyle',
        label: 'Lifestyle',
        icon: '🏔️',
        description: 'В контексте, атмосфера'
    },
    custom: {
        id: 'custom',
        label: 'Кастом',
        icon: '✏️',
        description: 'Свой промпт'
    }
};

// Параметры для режима Каталог
export const CATALOG_OPTIONS = {
    background: [
        { id: 'white', label: 'Белый', prompt: 'pure white background' },
        { id: 'light_gray', label: 'Светло-серый', prompt: 'light gray seamless background' },
        { id: 'cream', label: 'Кремовый', prompt: 'warm cream/beige background' }
    ]
};

// Параметры для режима Flat Lay
export const FLATLAY_OPTIONS = {
    surface: [
        { id: 'wood_light', label: 'Дерево светлое', prompt: 'light natural wood surface with visible grain' },
        { id: 'wood_dark', label: 'Дерево тёмное', prompt: 'dark walnut wood surface' },
        { id: 'wood_rustic', label: 'Дерево винтажное', prompt: 'weathered rustic wooden surface with character' },
        { id: 'marble', label: 'Мрамор', prompt: 'white marble surface with subtle veining' },
        { id: 'concrete', label: 'Бетон', prompt: 'smooth concrete surface' },
        { id: 'linen', label: 'Лён', prompt: 'natural linen fabric surface' },
        { id: 'snow', label: 'Снег', prompt: 'fresh white snow surface' },
        { id: 'custom', label: 'Кастом...', prompt: '' }
    ],
    arrangement: [
        { id: 'neat', label: 'Аккуратная', prompt: 'neatly arranged, clean symmetrical layout' },
        { id: 'natural', label: 'Естественная', prompt: 'casually placed, as if just set down' },
        { id: 'artistic', label: 'Художественная', prompt: 'artistically arranged, intentional asymmetry' }
    ]
};

// Параметры для режима Lifestyle
export const LIFESTYLE_OPTIONS = {
    atmosphere: [
        { id: 'warm', label: 'Тёплая', prompt: 'warm golden hour lighting, cozy atmosphere' },
        { id: 'neutral', label: 'Нейтральная', prompt: 'natural daylight, balanced colors' },
        { id: 'cool', label: 'Холодная', prompt: 'cool overcast lighting, muted tones' }
    ]
};

// Глобальные параметры
export const GLOBAL_OPTIONS = {
    aspectRatio: [
        { id: '1:1', label: '1:1 Квадрат' },
        { id: '4:5', label: '4:5 Instagram' },
        { id: '16:9', label: '16:9 Баннер' },
        { id: '9:16', label: '9:16 Stories' }
    ],
    quality: [
        { id: '2k', label: '2K' },
        { id: '4k', label: '4K' }
    ]
};

// Пресеты
export const PRESETS = [
    {
        id: 'winter_lookbook',
        label: 'Зимний lookbook',
        icon: '❄️',
        mode: 'flatlay',
        values: {
            surface: 'wood_rustic',
            arrangement: 'natural',
            aspectRatio: '1:1'
        }
    },
    {
        id: 'minimalism',
        label: 'Минимализм',
        icon: '⬜',
        mode: 'catalog',
        values: {
            background: 'white',
            aspectRatio: '1:1'
        }
    },
    {
        id: 'editorial',
        label: 'Editorial',
        icon: '📰',
        mode: 'lifestyle',
        values: {
            atmosphere: 'warm',
            aspectRatio: '4:5'
        }
    },
    {
        id: 'instagram',
        label: 'Instagram',
        icon: '📸',
        mode: 'flatlay',
        values: {
            surface: 'marble',
            arrangement: 'artistic',
            aspectRatio: '4:5'
        }
    }
];

// Дефолтные значения
export const DEFAULTS = {
    mode: 'flatlay',
    catalog: { background: 'white' },
    flatlay: { surface: 'wood_light', arrangement: 'natural' },
    lifestyle: { atmosphere: 'warm' },
    aspectRatio: '1:1',
    quality: '2k'
};
