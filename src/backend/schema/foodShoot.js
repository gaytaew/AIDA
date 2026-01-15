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

// ═══════════════════════════════════════════════════════════════
// SECTION 2: LIGHTING
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
        }
    ]
};

// ═══════════════════════════════════════════════════════════════
// SECTION 3: STYLING & PLATING
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
            value: 'steaming',
            label: 'Hot / Steaming',
            spec: 'STATE: Hot and fresh. Visible steam rising, glistening surfaces, melting elements.',
            constraints: { fx: 'steam' }
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
