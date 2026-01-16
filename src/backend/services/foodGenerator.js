/**
 * Food Shoot Generator Service
 * 
 * Specialized generator for professional food photography.
 * Handles the "Crockery Reference" logic separately from Style/Subject.
 */

import { requestGeminiImage } from '../providers/geminiClient.js';
import { requestVertexImage } from '../providers/vertexClient.js';
import { buildCollage } from '../utils/imageCollage.js';
import { generateImageId } from '../schema/customShoot.js';

// Schema imports
import {
    FOOD_CAMERA,
    FOOD_ANGLE,
    FOOD_LIGHTING,
    FOOD_PLATING,
    FOOD_STATE,
    FOOD_COMPOSITION,
    FOOD_DEPTH,
    FOOD_COLOR,
    FOOD_TEXTURE,
    FOOD_DYNAMICS,
    FOOD_SURFACE,
    FOOD_CROCKERY,
    FOOD_MOOD,
    validateFoodParams // NEW
} from '../schema/foodShoot.js';

// ... (imports remain same)

// ═══════════════════════════════════════════════════════════════
// GENERATION LOGIC
// ═══════════════════════════════════════════════════════════════

// ... (imports remain same)
export async function generateFoodShootFrame({
    params,
    subjectImage = null,
    crockeryImage = null,
    styleImage = null,
    sketchImage = null, // Phase 8
    baseImage = null    // NEW: For Image-to-Image refinement
}) {
    const genId = `food_${Date.now() % 100000}`;
    console.log(`[FoodGenerator] ${genId} Start`, params);

    try {
        // 1. SANITIZE & VALIDATE PARAMS
        const { params: sanitizedParams, corrections } = validateFoodParams(params);

        if (corrections.length > 0) {
            console.log(`[FoodGenerator] ${genId} Auto-Corrections:`, corrections);
        }

        // 2. Pack references
        const validImages = [];
        const indexMap = {};

        // REFINEMENT LOGIC: If baseImage is present, it becomes the primary reference [$1]
        if (baseImage) {
            validImages.push(baseImage);
            indexMap['base'] = validImages.length;
        }

        if (subjectImage) {
            validImages.push(subjectImage);
            indexMap['subject'] = validImages.length;
        }
        if (crockeryImage) {
            validImages.push(crockeryImage);
            indexMap['crockery'] = validImages.length;
        }
        if (styleImage) {
            validImages.push(styleImage);
            indexMap['style'] = validImages.length;
        }
        if (sketchImage) {
            validImages.push(sketchImage);
            indexMap['sketch'] = validImages.length;
        }

        // 3. Build Prompt with Sanitized Params
        const promptText = buildFoodShootPromptDynamic(sanitizedParams, indexMap);

        console.log(`[FoodGenerator] ${genId} Prompt Preview:\n${promptText.substring(0, 300)}...`);

        // 4. Call AI
        const result = await requestGeminiImage({
            prompt: promptText,
            referenceImages: validImages,
            imageConfig: {
                aspectRatio: sanitizedParams.aspectRatio || '3:4',
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
            params: sanitizedParams, // Return corrected params
            createdAt: new Date().toISOString()
        };

    } catch (error) {
        console.error(`[FoodGenerator] Error:`, error);
        throw error;
    }
}

// Helper to rebuild prompt with flexible indexes
function buildFoodShootPromptDynamic(params, indexMap) {
    const {
        dishDescription,
        changesDescription,
        camera, angle, lighting, plating, state,
        composition, depth, color, texture, dynamics,
        surface, crockery, mood,
        imageSize = '2k'
    } = params;

    const sections = [];

    // 1. COLLABORATIVE ROLE
    sections.push(`ROLE: Collaborative Team of Two Experts.
1. THE PHOTOGRAPHER (Technical): Responsible for Camera, Lighting, Depth, Color, and Image Quality.
2. THE FOOD STYLIST (Artistic): Responsible for Plating, Composition, Props, and Atmosphere.`);

    // 2. PRIMARY DIRECTIVE (REFINEMENT vs GENERATION)
    if (indexMap.base) {
        sections.push(`
[TASK: IMAGE REFINEMENT / MODIFICATION]
You are provided with a BASE IMAGE (Reference [$${indexMap.base}]).
your goal is to MODIFY this image according to the instructions below.
- KEEP the core subject identity and general composition of [$${indexMap.base}] unless told otherwise.
- ADJUST technical or stylistic parameters as requested.
`);
    }

    // 3. CRITICAL EDITS (High Priority - Moved to Top)
    if (changesDescription) {
        sections.push(`
[!!! IMPORTANT MODIFICATIONS !!!]
The user has requested specific changes. These options OVERRIDE all other defaults:
> CHANGE REQUEST: "${changesDescription}"
`);
    }

    // Lookup Specs
    const cameraSpec = FOOD_CAMERA.options.find(o => o.value === camera)?.spec || 'Standard Lens';
    const angleSpec = FOOD_ANGLE.options.find(o => o.value === angle)?.spec || '45 Degree Angle';
    const lightingSpec = FOOD_LIGHTING.options.find(o => o.value === lighting)?.spec || 'Natural Light';
    const depthSpec = FOOD_DEPTH.options.find(o => o.value === depth)?.spec || 'Medium Depth';
    const colorSpec = FOOD_COLOR.options.find(o => o.value === color)?.spec || 'Natural Color';

    // Stylist Specs
    const platingSpec = FOOD_PLATING.options.find(o => o.value === plating)?.spec || 'Standard Plating';
    const stateSpec = FOOD_STATE.options.find(o => o.value === state)?.spec || 'Perfect Condition';
    const compSpec = FOOD_COMPOSITION.options.find(o => o.value === composition)?.spec || 'Center Composition';
    const textureSpec = FOOD_TEXTURE.options.find(o => o.value === texture)?.spec || 'High Texture';
    const dynamicsSpec = FOOD_DYNAMICS.options.find(o => o.value === dynamics)?.spec || 'Still';
    const surfaceSpec = FOOD_SURFACE.options.find(o => o.value === surface)?.spec || '';
    const crockerySpec = FOOD_CROCKERY.options.find(o => o.value === crockery)?.spec || '';

    // NEW: Mood Narrative
    const moodObj = FOOD_MOOD.options.find(o => o.value === mood);
    const moodNarrative = moodObj ? moodObj.narrative : '';

    // 4. TECHNICAL SPECIFICATIONS (THE PHOTOGRAPHER)
    sections.push(`
[TECHNICAL SPECIFICATIONS]:
CAMERA & LENS: ${cameraSpec}
LIGHTING SETUP: ${lightingSpec}
COLOR GRADING: ${colorSpec}
DEPTH OF FIELD: ${depthSpec}
IMAGE FORMAT: ${params.aspectRatio || 'Standard'} aspect ratio, High Resolution.
`);

    // 5. ARTISTIC BRIEF (THE STYLIST)
    sections.push(`
[ARTISTIC BRIEF]:
${moodNarrative ? `MOOD: ${moodNarrative}` : 'ATMOSPHERE: Professional Food Photography.'}

STYLING DIRECTIVES:
COMPOSITION: ${compSpec} | ${angleSpec}
PLATING: ${platingSpec}
FOOD STATE: ${stateSpec}
JUXTAPOSITION: ${dynamicsSpec}
TEXTURE FOCUS: ${textureSpec}

[SCENE ENVIRONMENT]:
SURFACE: ${surfaceSpec || 'Neutral/Appropriate'}
CROCKERY: ${crockerySpec || 'Appropriate for dish'}
`);

    // 6. REFERENCES & REFERENCES LOGIC
    const refLines = [];

    if (indexMap.crockery) {
        refLines.push(`REFERENCE [$${indexMap.crockery}]: CROCKERY / VESSEL (MANDATORY).
        - Use the EXACT plate/bowl/cup from [$${indexMap.crockery}].
        - Ignore any food inside the crockery reference; replace it with the SUBJECT.`);
    }

    if (indexMap.style) {
        refLines.push(`REFERENCE [$${indexMap.style}]: VISUAL STYLE / MOOD.
        - Copy lighting, color grading, and background texture from [$${indexMap.style}].
        - DO NOT copy the subject content, only the aesthetic.`);
    }

    // SUBJECT LOGIC (Hybrid: Strict vs Adaptive)
    if (indexMap.subject) {
        // If we are doing a refinement (base) or have specific changes, we relax strictness
        const isAdaptive = !!(indexMap.base || changesDescription);

        if (isAdaptive) {
            sections.push(`
SUBJECT (ADAPTIVE REFERENCE MATCH):
The image should include the subject from Reference [$${indexMap.subject}], but ADAPT it to the new requirements.
- Identity: KEEP the subject ingredients and look.
- Geometry: ADAPT the shape/angle/composition to match the [Technical Specifications] and [Change Request].
- DO NOT rigidly lock to the reference pixels if they conflict with the requested changes.
`);
        } else {
            sections.push(`
SUBJECT (STRICT GEOMETRY MATCH):
The image must follow the GEOMETRY and ARRANGEMENT of Reference [$${indexMap.subject}].
1. MATCH: Geometric Shape & Form Factor from [$${indexMap.subject}] (CRITICAL).
2. MATCH: Ingredient Arrangement, TEXTURE, and SPECIFIC INGREDIENTS from [$${indexMap.subject}].
`);
        }

        sections.push(`DESCRIPTION (CONTENT): "${dishDescription}"`);

    } else {
        sections.push(`
SUBJECT (TEXT BASED):
"${dishDescription}"`);
    }

    if (refLines.length > 0) {
        sections.push(`
REFERENCES:
${refLines.join('\n')}`);
    }

    // 7. HARD RULES
    sections.push(`
HARD RULES:
1. PHOTOREALISM IS PARAMOUNT.
2. EDIBLE TEXTURES: Moisture, steam, crumbs must look real.
3. No text, logs, or watermarks.`);

    return sections.join('\n');
}
