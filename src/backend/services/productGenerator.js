/**
 * Product Shoot Generator Service
 * 
 * Генератор для предметной съёмки.
 * Формирует промпты и вызывает AI API.
 */

import { requestGeminiImage } from '../providers/geminiClient.js';
import { generateImageId } from '../schema/customShoot.js';

// Импорт схемы V1 (legacy)
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

// Импорт V2 prompt builder
import { buildProductPromptV2 } from '../params/productPromptV2.js';

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

    // Определяем режим: есть ли location reference?
    const hasLocationRef = !!indexMap.location;

    // 1. ROLE - разный для разных режимов
    if (hasLocationRef) {
        sections.push(`ROLE: High-End Fashion Editorial Photographer

CRITICAL TASK: Create a stunning, magazine-quality lifestyle photograph.

QUALITY STANDARD: This must look like a professional fashion editorial or luxury brand campaign.
Think Loro Piana, Brunello Cucinelli, or high-end catalog photography.

ATMOSPHERE REQUIREMENTS:
- Warm, inviting, COZY lighting (golden hour feel, soft natural light)
- Rich textures that you want to touch
- Lifestyle feeling — as if someone just set these items down
- Editorial quality composition with intentional styling

SCALE & PROPORTIONS - CRITICAL:
- All items MUST be in realistic, accurate proportions to each other
- Adult shoes are typically 25-30cm long
- Adult sweater folded is roughly 40-50cm wide
- Items should look like they could be picked up and worn

STYLING DETAILS:
- Clothing: Neatly but naturally folded, showing beautiful texture
- Visible quality of materials (cashmere softness, leather grain, sherpa texture)
- Clean, minimal styling — NO extra props or decorations
- Everything looks expensive and desirable

STRICT PROHIBITION:
- Do NOT add pine cones, pine needles, branches, leaves, or any decorative props
- Do NOT add candles, cups, books, or lifestyle accessories not specified
- ONLY include the exact products requested, nothing else
- Keep the scene CLEAN and focused on the products

Generate as if shot by a professional photographer for a luxury brand lookbook.`);
    } else {
        sections.push(`ROLE: Professional Product Photographer
Create a high-end e-commerce / catalog product photograph.
Focus on accurate representation, texture visibility, and commercial appeal.`);
    }

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

    // 9. REFERENCES — разные инструкции для lifestyle vs catalog
    const refLines = [];
    if (indexMap.subject) {
        if (hasLocationRef) {
            // Lifestyle mode: продукт как вдохновение
            refLines.push(`REFERENCE [$${indexMap.subject}]: PRODUCT TYPE REFERENCE.
- Generate a product SIMILAR to this (same type, style, color palette).
- Match the general appearance: material, texture, design aesthetic.
- You may adapt proportions and exact details for natural placement.
- Preserve the BRAND IDENTITY if visible (logo position, branding style).
- The product should look like a real item from the same collection.`);
        } else {
            // Catalog mode: точное копирование
            refLines.push(`REFERENCE [$${indexMap.subject}]: PRODUCT REFERENCE (MANDATORY).
- Match the EXACT product from [$${indexMap.subject}].
- Preserve shape, color, texture, and proportions.
- CRITICAL: Preserve ALL logos, prints, labels, and branding marks in their EXACT original positions.
- Logos must remain on the same part of the product (e.g., if logo is on the heel, it stays on the heel).`);
        }
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
5. LOGO PLACEMENT RULES:
   - If the source image has a logo, keep it in the EXACT SAME position
   - Logo on collar = logo on collar. Logo on heel = logo on heel.
   - NEVER duplicate logos (one logo only, same spot as original)
   - NEVER invent new brand names or logos
   - If source has no logo, output should have no logo
6. No humans, faces, or hands unless explicitly requested.
7. No AI-generated watermarks or artificial text.`);

    // 11. ANTI-AI / REALISM REQUIREMENTS
    sections.push(`
[CRITICAL: AVOID AI-LOOK]
This image should look like a REAL PHOTOGRAPH, not AI-generated.

ADD NATURAL IMPERFECTIONS:
- Subtle fabric wrinkles and creases (real clothes are never perfectly flat)
- Slight variations in lighting (not uniformly perfect)
- Minor dust particles or fabric fibers visible on close items
- Natural shadow falloff with soft edges
- Micro-texture variations in materials

AVOID THESE AI TELLS:
❌ Overly smooth, plastic-looking surfaces
❌ Too-perfect symmetry
❌ Unnaturally vibrant or saturated colors
❌ Perfectly even lighting without any variation
❌ Objects looking "floating" or without proper weight
❌ Unrealistic depth of field (too sharp everywhere)

REALISM DETAILS:
- Wood should have grain, scratches, weathering
- Snow should have footprints, uneven texture
- Fabric should show natural drape and fold patterns
- Shadows should have realistic soft edges
- Overall image should have slight warmth, not clinical coolness`);

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
                    name: product.name || `Product ${additionalIndexes.length + 2}`,
                    params: product.params || {}  // NEW: параметры предмета
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

        // 3. Build Prompt — V2 или Legacy
        let promptText;
        const isV2Mode = ['catalog', 'flatlay', 'lifestyle', 'custom'].includes(params.mode);

        if (isV2Mode) {
            // NEW V2 режим — минималистичный prompt builder
            console.log(`[ProductGenerator] ${genId} Using V2 mode: ${params.mode}`);
            promptText = buildProductPromptV2(params, indexMap);
        } else {
            // Legacy режим для обратной совместимости
            promptText = buildProductPrompt(sanitizedParams, indexMap);

            // 4. PERSPECTIVE RESET (только для legacy)
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

            // 5. LOCATION/SURFACE - теперь как ВДОХНОВЕНИЕ, не композитинг
            if (indexMap.location) {
                promptText += `

[SCENE INSPIRATION - REFERENCE [$${indexMap.location}]]
This image shows the TYPE of environment/setting for your photograph.

USE THIS AS INSPIRATION:
- Generate a SIMILAR environment (wooden sled in snow, vintage surface, etc.)
- Match the overall MOOD, lighting quality, and atmosphere
- Create a surface with similar texture and character
- Achieve similar color palette and seasonal feeling

DO NOT literally copy this background. Create a NEW, original scene that captures the same essence.
The final image should look like it was shot in a similar location, not composited onto it.

PRODUCT PLACEMENT:
- Products should look NATURALLY ARRANGED as if by a stylist
- Items should interact with the surface organically (slight wrinkles, natural folds)
- Clothing: Neatly folded or naturally draped, showing texture
- Shoes: Placed casually but artfully, maybe one slightly tilted
- Everything should cast appropriate, soft shadows`;
            }

            // 6. Multi-product instructions with per-item params
            if (additionalIndexes.length > 0) {
                const positionLabels = { auto: 'arrange naturally', left: 'left side of frame', center: 'center of composition', right: 'right side of frame' };
                const scaleLabels = { small: 'small, as accent', medium: 'medium, balanced size', large: 'large, prominent' };
                const orientLabels = { auto: 'natural placement', folded: 'neatly folded', flat: 'spread flat', standing: 'standing upright', tilted: 'casually tilted' };
                const roleLabels = { hero: 'MAIN focus, most prominent', supporting: 'complementary item' };

                const multiProdLines = additionalIndexes.map(p => {
                    const params = p.params || {};
                    const pos = positionLabels[params.position] || 'arrange naturally';
                    const scale = scaleLabels[params.scale] || 'medium, balanced size';
                    const orient = orientLabels[params.orientation] || 'natural placement';
                    const role = roleLabels[params.role] || 'complementary item';

                    return `PRODUCT "${p.name}" [Reference $${p.index}]:
- Position: ${pos}
- Scale: ${scale}
- Orientation: ${orient}
- Role: ${role}`;
                }).join('\n\n');

                promptText += `

[MULTI-PRODUCT SCENE]
${multiProdLines}

LAYOUT RULES:
- Respect the specified positions and roles for each item
- Hero items should be more prominent and visually dominant
- Supporting items complement but don't overshadow hero items
- Maintain realistic proportions between all items`;
            }
        } // END of else (legacy mode)

        console.log(`[ProductGenerator] ${genId} Prompt Preview:\n${promptText.substring(0, 500)}...`);

        // 7. Call AI
        const result = await requestGeminiImage({
            prompt: promptText,
            referenceImages: validImages,
            imageConfig: {
                aspectRatio: params.aspectRatio || sanitizedParams.aspectRatio || '1:1',
                imageSize: params.quality || sanitizedParams.imageSize || '2k'
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
            params: isV2Mode ? params : sanitizedParams,
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
