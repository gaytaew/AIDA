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
- Preserve shape, color, texture, and proportions.
- CRITICAL: Preserve ALL logos, prints, labels, and branding marks in their EXACT original positions.
- Logos must remain on the same part of the product (e.g., if logo is on the heel, it stays on the heel).`);
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
5. PRESERVE ALL LOGOS, PRINTS, AND BRANDING from source images:
   - Keep logos in their EXACT original position on the product
   - Do NOT move, resize, or distort logos
   - Do NOT add new logos or remove existing ones
6. No humans, faces, or hands unless explicitly requested.
7. No AI-generated watermarks or text overlays.`);

    return sections.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// GENERATION LOGIC
// ═══════════════════════════════════════════════════════════════

export async function generateProductShootFrame({
    params,
    subjectImage = null,
    styleImage = null,
    baseImage = null,
    locationImage = null,      // NEW: референс локации/поверхности
    additionalProducts = []    // дополнительные предметы
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

        // Добавляем дополнительные предметы
        const additionalIndexes = [];
        for (const product of additionalProducts) {
            if (product.base64) {
                validImages.push(product);
                additionalIndexes.push({
                    index: validImages.length,
                    name: product.name || `Product ${additionalIndexes.length + 2}`
                });
            }
        }

        // NEW: Location reference
        if (locationImage) {
            validImages.push(locationImage);
            indexMap['location'] = validImages.length;
        }

        if (styleImage) {
            validImages.push(styleImage);
            indexMap['style'] = validImages.length;
        }

        // 3. Build Prompt
        let promptText = buildProductPrompt(sanitizedParams, indexMap);

        // 4. PERSPECTIVE RESET (для flat_lay, overhead, top_down)
        const needsPerspectiveReset = ['flat_lay', 'overhead', 'top_down'].includes(sanitizedParams.angle);

        if (needsPerspectiveReset) {
            promptText += `

[PERSPECTIVE RESET - CRITICAL]
The input product images are ISOLATED REFERENCES taken from random angles (often eye-level or 3/4 view).

YOU MUST MENTALLY ROTATE each object to match the TARGET PERSPECTIVE: TOP-DOWN / FLAT LAY VIEW.

PHYSICS RULES:
1. Objects MUST appear to REST on the surface due to gravity
2. Shoes: Lying on their side or sole, NOT standing upright
3. Clothing: Spread flat or naturally draped, NOT hanging vertically
4. Accessories: Placed flat, NOT propped up
5. NO "floating" artifacts — every object touches the surface

COMMON MISTAKES TO AVOID:
❌ Copying the standing/upright orientation from source photos
❌ Objects appearing to defy gravity
❌ Shadows going in wrong direction for top-down view
❌ Items looking "pasted on" instead of naturally placed

✅ CORRECT: Imagine you are looking DOWN at objects lying on a table/floor
✅ SHADOWS: Cast directly beneath objects (for overhead lighting)
✅ SCALE: Maintain realistic proportions between objects`;
        }

        // 5. LOCATION/SURFACE INTEGRATION
        if (indexMap.location) {
            promptText += `

[LOCATION/SURFACE REFERENCE - MANDATORY]
REFERENCE [$${indexMap.location}] shows the EXACT surface and environment for this shoot.

INTEGRATION RULES:
1. Place all objects DIRECTLY onto this surface — they must appear to REST on it
2. Match the lighting direction and quality from the location reference
3. Add appropriate shadows that blend with existing shadows in location
4. Maintain the texture and material feel of the surface
5. Objects should look like they BELONG in this environment, not composited
6. DO NOT alter the location background — only add objects to it

LIGHTING COHERENCE:
- Analyze light direction in location reference
- Apply consistent lighting to all objects
- Shadows must fall in the same direction as location shadows`;
        }

        // 6. Multi-product instructions
        if (additionalIndexes.length > 0) {
            const multiProdLines = additionalIndexes.map(p =>
                `REFERENCE [$${p.index}]: ADDITIONAL PRODUCT "${p.name}".\n- Include this product in the scene alongside the main subject.`
            ).join('\n');

            promptText += `

[MULTI-PRODUCT SCENE]
${multiProdLines}

IMPORTANT: Arrange all products harmoniously in one scene.
- Maintain visual balance and proper scaling.
- Each product should be clearly visible and identifiable.`;
        }

        console.log(`[ProductGenerator] ${genId} Prompt Preview:\n${promptText.substring(0, 500)}...`);

        // 7. Call AI
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


