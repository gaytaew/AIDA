/**
 * Product Prompt Builder V2
 * Минималистичная структура промпта для максимальной эффективности
 */

import {
    CATALOG_OPTIONS,
    FLATLAY_OPTIONS,
    LIFESTYLE_OPTIONS
} from './productParamsV2.js';

/**
 * Построить промпт для генерации
 * @param {Object} params - параметры из UI
 * @param {Object} indexMap - маппинг референсов ($1, $2, ...)
 */
export function buildProductPromptV2(params, indexMap = {}) {
    const {
        mode = 'flatlay',
        products = [],
        // Mode-specific
        background,
        surface,
        surfaceCustom,
        arrangement,
        atmosphere,
        customPrompt,
        // Global
        aspectRatio = '1:1'
    } = params;

    // Если кастомный режим — просто вернуть промпт пользователя + базовые правила
    if (mode === 'custom' && customPrompt) {
        return buildCustomPrompt(customPrompt, products, indexMap, aspectRatio);
    }

    const sections = [];

    // 1. SHOT TYPE
    sections.push(getShotTypeBlock(mode, params));

    // 2. PRODUCTS
    sections.push(getProductsBlock(products, indexMap));

    // 3. MODE-SPECIFIC SETTINGS
    sections.push(getModeBlock(mode, params));

    // 4. REFERENCE RULES (всегда)
    sections.push(getReferenceRulesBlock(indexMap));

    // 5. REALISM (всегда)
    sections.push(getRealismBlock());

    // 6. FORMAT
    sections.push(`FORMAT: ${aspectRatio} aspect ratio`);

    return sections.filter(Boolean).join('\n\n');
}

function getShotTypeBlock(mode, params) {
    switch (mode) {
        case 'catalog':
            return `SHOT TYPE: Clean catalog product photograph
Studio lighting, professional e-commerce style`;

        case 'flatlay':
            return `SHOT TYPE: Flat lay product photograph
Top-down view, products arranged on surface`;

        case 'lifestyle':
            return `SHOT TYPE: Lifestyle product photograph
Products in natural context, editorial style`;

        default:
            return `SHOT TYPE: Professional product photograph`;
    }
}

function getProductsBlock(products, indexMap) {
    if (!products || products.length === 0) {
        return indexMap.subject
            ? `PRODUCTS:\nMatch product from reference [$${indexMap.subject}] exactly`
            : '';
    }

    const productLines = products.map((p, i) => {
        const name = p.name || `Product ${i + 1}`;
        return `- ${name}`;
    }).join('\n');

    return `PRODUCTS:\n${productLines}`;
}

function getModeBlock(mode, params) {
    switch (mode) {
        case 'catalog': {
            const bg = CATALOG_OPTIONS.background.find(b => b.id === params.background);
            return bg ? `BACKGROUND: ${bg.prompt}` : 'BACKGROUND: pure white background';
        }

        case 'flatlay': {
            const surf = FLATLAY_OPTIONS.surface.find(s => s.id === params.surface);
            const arr = FLATLAY_OPTIONS.arrangement.find(a => a.id === params.arrangement);

            let surfacePrompt = surf?.prompt || 'natural wood surface';
            if (params.surface === 'custom' && params.surfaceCustom) {
                surfacePrompt = params.surfaceCustom;
            }

            return `SURFACE: ${surfacePrompt}
ARRANGEMENT: ${arr?.prompt || 'naturally arranged'}`;
        }

        case 'lifestyle': {
            const atm = LIFESTYLE_OPTIONS.atmosphere.find(a => a.id === params.atmosphere);
            const locationNote = params.locationImage
                ? `Use location reference as inspiration for scene atmosphere`
                : '';

            return `ATMOSPHERE: ${atm?.prompt || 'natural lighting'}
${locationNote}`.trim();
        }

        default:
            return '';
    }
}

function getReferenceRulesBlock(indexMap) {
    const rules = [];

    if (indexMap.subject) {
        rules.push(`PRODUCT REFERENCE [$${indexMap.subject}]:
- Match product EXACTLY — same shape, colors, materials
- Preserve PROPORTIONS (shoes ~25-30cm, folded sweater ~40-50cm)  
- LOGO RULE: If logo exists, keep in EXACT same position. If no logo, add none.
- Copy all details: stitching, buttons, textures`);
    }

    if (indexMap.location) {
        rules.push(`LOCATION REFERENCE [$${indexMap.location}]:
- Use as INSPIRATION for atmosphere and color palette
- Generate SIMILAR scene, not pixel-copy
- Match lighting mood and environmental feel
- Products should look natural in this type of setting`);
    }

    if (indexMap.style) {
        rules.push(`STYLE REFERENCE [$${indexMap.style}]:
- Match lighting and color grading
- Copy overall aesthetic and mood`);
    }

    return rules.length > 0 ? `REFERENCE RULES:\n${rules.join('\n\n')}` : '';
}

function getRealismBlock() {
    return `CRITICAL — PHOTOREALISM:
Generate as a REAL photograph, not AI-looking.

NATURAL IMPERFECTIONS (required):
- Subtle fabric wrinkles and creases
- Soft shadow edges with natural falloff
- Visible material textures (fabric weave, leather grain)
- Slight lighting variations

AVOID AI ARTIFACTS:
- No plastic/smooth surfaces
- No perfect symmetry
- No over-saturated colors
- No floating objects without weight
- No invented logos or text`;
}

function buildCustomPrompt(userPrompt, products, indexMap, aspectRatio) {
    const productList = products.map(p => p.name || 'Product').join(', ');

    return `${userPrompt}

${productList ? `PRODUCTS: ${productList}` : ''}

REFERENCE RULES:
${indexMap.subject ? `- Product reference [$${indexMap.subject}]: Match exactly, preserve logos in same position` : ''}
${indexMap.location ? `- Location reference [$${indexMap.location}]: Use as atmosphere inspiration` : ''}

CRITICAL:
- Photorealistic, natural imperfections
- No invented logos or text
- Realistic proportions

FORMAT: ${aspectRatio}`.trim();
}

export default buildProductPromptV2;
