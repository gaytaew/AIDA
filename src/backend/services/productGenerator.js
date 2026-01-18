/**
 * Product Shoot Generator Service
 * 
 * Генератор для предметной съёмки.
 * Формирует промпты и вызывает AI API.
 */

import { requestGeminiImage } from '../providers/geminiClient.js';
import { generateImageId } from '../schema/customShoot.js';

// Импорт схемы
import {
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
    validateProductParams
} from '../schema/productShoot.js';

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

function getSpecFromSchema(schema, value) {
    const option = schema.options?.find(o => o.value === value);
    return option?.spec || '';
}

function buildProductPrompt(params, indexMap = {}) {
    const {
        subjectDescription,
        category,
        presentation,
        angle,
        framing,
        background,
        surface,
        shadow,
        lighting,
        lightDirection,
        mood,
        colorGrade,
        detailLevel,
        showDetails = [],
        changesDescription,
        subParams = {}
    } = params;

    const sections = [];

    // 1. ROLE
    sections.push(`ROLE: Professional Product Photographer
Create a high-end e-commerce / catalog product photograph.
Focus on accurate representation, texture visibility, and commercial appeal.`);

    // 2. REFINEMENT MODE (если есть base image)
    if (indexMap.base) {
        sections.push(`
[TASK: IMAGE REFINEMENT]
You have a BASE IMAGE (Reference [$${indexMap.base}]).
MODIFY this image according to the instructions below.
KEEP the core product identity and composition unless told otherwise.`);
    }

    // 3. CRITICAL CHANGES
    if (changesDescription) {
        sections.push(`
[!!! ВАЖНЫЕ ИЗМЕНЕНИЯ !!!]
Пользователь запросил конкретные изменения. Эти указания ПРИОРИТЕТНЫ:
> "${changesDescription}"`);
    }

    // 4. SUBJECT
    const categoryLabel = PRODUCT_CATEGORY.options.find(o => o.value === category)?.label || category;
    sections.push(`
[SUBJECT]
Product: "${subjectDescription}"
Category: ${categoryLabel}`);

    // 5. COMPOSITION
    const presentationSpec = getSpecFromSchema(PRODUCT_PRESENTATION, presentation);
    const angleSpec = getSpecFromSchema(PRODUCT_ANGLE, angle);
    const framingSpec = getSpecFromSchema(PRODUCT_FRAMING, framing);

    // Под-параметры презентации
    let subParamSpec = '';
    if (presentation === 'flat_lay' && subParams.arrangement) {
        const opt = PRODUCT_PRESENTATION.options.find(o => o.value === 'flat_lay')
            ?.subParams?.[0]?.options?.find(o => o.value === subParams.arrangement);
        subParamSpec = opt?.spec || '';
    } else if (presentation === 'stack' && subParams.stackStyle) {
        const opt = PRODUCT_PRESENTATION.options.find(o => o.value === 'stack')
            ?.subParams?.[0]?.options?.find(o => o.value === subParams.stackStyle);
        subParamSpec = opt?.spec || '';
    } else if (presentation === 'floating' && subParams.floatHeight) {
        const opt = PRODUCT_PRESENTATION.options.find(o => o.value === 'floating')
            ?.subParams?.[0]?.options?.find(o => o.value === subParams.floatHeight);
        subParamSpec = opt?.spec || '';
    } else if (presentation === 'mannequin' && subParams.mannequinStyle) {
        const opt = PRODUCT_PRESENTATION.options.find(o => o.value === 'mannequin')
            ?.subParams?.[0]?.options?.find(o => o.value === subParams.mannequinStyle);
        subParamSpec = opt?.spec || '';
    } else if (presentation === 'hanging' && subParams.hangerType) {
        const opt = PRODUCT_PRESENTATION.options.find(o => o.value === 'hanging')
            ?.subParams?.[0]?.options?.find(o => o.value === subParams.hangerType);
        subParamSpec = opt?.spec || '';
    }

    sections.push(`
[COMPOSITION]
${presentationSpec}
${subParamSpec}
${angleSpec}
${framingSpec}`);

    // 6. BACKGROUND & SURFACE
    const backgroundSpec = getSpecFromSchema(PRODUCT_BACKGROUND, background);
    const surfaceSpec = getSpecFromSchema(PRODUCT_SURFACE, surface);
    const shadowSpec = getSpecFromSchema(PRODUCT_SHADOW, shadow);

    sections.push(`
[BACKGROUND & SURFACE]
${backgroundSpec}
${surfaceSpec}
${shadowSpec}`);

    // 7. LIGHTING
    const lightingSpec = getSpecFromSchema(PRODUCT_LIGHTING, lighting);
    const lightDirSpec = getSpecFromSchema(PRODUCT_LIGHT_DIRECTION, lightDirection);
    const moodSpec = getSpecFromSchema(PRODUCT_MOOD, mood);
    const colorSpec = getSpecFromSchema(PRODUCT_COLOR_GRADE, colorGrade);

    // Neon sub-param
    let neonSpec = '';
    if (lighting === 'neon_accent' && subParams.neonColor) {
        const opt = PRODUCT_LIGHTING.options.find(o => o.value === 'neon_accent')
            ?.subParams?.[0]?.options?.find(o => o.value === subParams.neonColor);
        neonSpec = opt?.spec || '';
    }

    sections.push(`
[LIGHTING & STYLE]
${lightingSpec}
${neonSpec}
${lightDirSpec}
${moodSpec}
${colorSpec}`);

    // 8. DETAILS
    const detailSpec = getSpecFromSchema(PRODUCT_DETAIL_LEVEL, detailLevel);
    const showDetailsSpecs = (showDetails || [])
        .map(d => PRODUCT_SHOW_DETAILS.options.find(o => o.value === d)?.spec)
        .filter(Boolean)
        .join('\n');

    sections.push(`
[QUALITY & DETAILS]
${detailSpec}
${showDetailsSpecs}
IMAGE FORMAT: ${params.aspectRatio || '1:1'} aspect ratio, ${params.imageSize || '2k'} resolution.`);

    // 9. REFERENCES
    const refLines = [];
    if (indexMap.subject) {
        refLines.push(`REFERENCE [$${indexMap.subject}]: PRODUCT REFERENCE (MANDATORY).
- Match the EXACT product from [$${indexMap.subject}].
- Preserve shape, color, texture, and proportions.`);
    }
    if (indexMap.style) {
        refLines.push(`REFERENCE [$${indexMap.style}]: STYLE REFERENCE.
- Copy lighting setup, color grading, and mood from [$${indexMap.style}].
- Do NOT copy the product itself, only the aesthetic.`);
    }

    if (refLines.length > 0) {
        sections.push(`
[REFERENCES]
${refLines.join('\n')}`);
    }

    // 10. HARD RULES
    sections.push(`
[HARD RULES]
1. PHOTOREALISM is paramount. No illustrations, no 3D renders.
2. Preserve fabric texture and weave — no plastic/glossy artificial look.
3. Sharp focus on main subject, natural depth of field.
4. No distorted proportions, no unnatural symmetry.
5. No text, logos, or watermarks unless specified.
6. No humans, faces, or hands unless explicitly requested.`);

    return sections.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// GENERATION LOGIC
// ═══════════════════════════════════════════════════════════════

export async function generateProductShootFrame({
    params,
    subjectImage = null,
    styleImage = null,
    baseImage = null
}) {
    const genId = `product_${Date.now() % 100000}`;
    console.log(`[ProductGenerator] ${genId} Start`, params);

    try {
        // 1. VALIDATE & SANITIZE
        const { params: sanitizedParams, corrections } = validateProductParams(params);

        if (corrections.length > 0) {
            console.log(`[ProductGenerator] ${genId} Auto-Corrections:`, corrections);
        }

        // 2. Pack references
        const validImages = [];
        const indexMap = {};

        if (baseImage) {
            validImages.push(baseImage);
            indexMap['base'] = validImages.length;
        }

        if (subjectImage) {
            validImages.push(subjectImage);
            indexMap['subject'] = validImages.length;
        }

        if (styleImage) {
            validImages.push(styleImage);
            indexMap['style'] = validImages.length;
        }

        // 3. Build Prompt
        const promptText = buildProductPrompt(sanitizedParams, indexMap);

        console.log(`[ProductGenerator] ${genId} Prompt Preview:\n${promptText.substring(0, 400)}...`);

        // 4. Call AI
        const result = await requestGeminiImage({
            prompt: promptText,
            referenceImages: validImages,
            imageConfig: {
                aspectRatio: sanitizedParams.aspectRatio || '1:1',
                imageSize: sanitizedParams.imageSize || '2k'
            }
        });

        if (!result || !result.base64) {
            throw new Error('No image returned from AI');
        }

        return {
            id: generateImageId(),
            base64: result.base64,
            mimeType: result.mimeType || 'image/jpeg',
            prompt: promptText,
            params: sanitizedParams,
            createdAt: new Date().toISOString()
        };

    } catch (error) {
        console.error(`[ProductGenerator] Error:`, error);
        throw error;
    }
}

export default {
    generateProductShootFrame,
    buildProductPrompt
};
