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

export async function generateFoodShootFrame({
    params,
    subjectImage = null,
    crockeryImage = null,
    styleImage = null,
    sketchImage = null, // Phase 8
}) {
    const genId = `food_${Date.now() % 100000}`;
    console.log(`[FoodGenerator] ${genId} Start`, params);

    try {
        // 1. SANITIZE & VALIDATE PARAMS (V5 Logic)
        // Fix contradictions like "Hard Sun" + "Soft Mood"
        const { params: sanitizedParams, corrections } = validateFoodParams(params);

        if (corrections.length > 0) {
            console.log(`[FoodGenerator] ${genId} Auto-Corrections:`, corrections);
        }

        // 2. Pack references
        const validImages = [];
        const indexMap = {};

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
        if (sketchImage) { // Phase 8
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
        surface, crockery, mood, // Mood is key now
        imageSize = '2k'
    } = params;

    const sections = [];

    // 1. COLLABORATIVE ROLE
    sections.push(`ROLE: Collaborative Team of Two Experts.
1. THE PHOTOGRAPHER (Technical): Responsible for Camera, Lighting, Depth, Color, and Image Quality.
2. THE FOOD STYLIST (Artistic): Responsible for Plating, Composition, Props, and Atmosphere.`);

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

    // 2. TECHNICAL SPECIFICATIONS (THE PHOTOGRAPHER)
    // STRICT PHYSICS - "How it is captured"
    sections.push(`
[TECHNICAL SPECIFICATIONS - THE PHOTOGRAPHER]:
The following settings define the optical and technical properties.
CAMERA & LENS: ${cameraSpec}
LIGHTING SETUP: ${lightingSpec}
COLOR GRADING: ${colorSpec}
DEPTH OF FIELD: ${depthSpec}
IMAGE FORMAT: ${params.aspectRatio || 'Standard'} aspect ratio, High Resolution.
`);

    // 2.1 SKETCH REFERENCE (GEOMETRY OVERRIDE) - Phase 8
    if (indexMap.sketch) {
        sections.push(`
[SKETCH REFERENCE - HARD GEOMETRY] [$${indexMap.sketch}]:
The user has provided a SKETCH or LAYOUT [$${indexMap.sketch}].
You MUST follow the EXACT geometry and composition of this sketch.
- IGNORE the "Composition" parameter below.
- MATCH the position of every item from the sketch [$${indexMap.sketch}].
- REPLACE the sketch's crude shapes with photorealistic food and props defined in Subject/Style.
`);
    }

    // 3. ARTISTIC BRIEF (THE STYLIST)
    // NARRATIVE - "What is felt"
    sections.push(`
[ARTISTIC BRIEF - THE STYLIST]:
Use this narrative to guide the visual atmosphere and styling.
${moodNarrative ? `MOOD & ATMOSPHERE: ${moodNarrative}` : 'ATMOSPHERE: Professional Food Photography.'}

STYLING DIRECTIVES:
COMPOSITION: ${compSpec} | ${angleSpec}
PLATING: ${platingSpec}
FOOD STATE: ${stateSpec}
JUXTAPOSITION: ${dynamicsSpec}
TEXTURE FOCUS: ${textureSpec}

[SCENE ENVIRONMENT - HARD REQUIREMENTS]:
SURFACE: ${surfaceSpec || 'Neutral/Appropriate'}
CROCKERY: ${crockerySpec || 'Appropriate for dish'}
`);

    // 4. REFERENCES
    const refLines = [];

    if (indexMap.crockery) {
        refLines.push(`REFERENCE [$${indexMap.crockery}]: CROCKERY / VESSEL (MANDATORY).
        - Use the EXACT plate/bowl/cup from [$${indexMap.crockery}].
        - Ignore any food inside the crockery reference; replace it with the SUBJECT.`);
    } else {
        if (crockerySpec) {
            refLines.push(`CROCKERY (NO REFERENCE):
        - ${crockerySpec}`);
        }
    }

    if (indexMap.style) {
        refLines.push(`REFERENCE [$${indexMap.style}]: VISUAL STYLE / MOOD.
        - Copy lighting, color grading, and background texture from [$${indexMap.style}].
        - DO NOT copy the subject content, only the aesthetic.`);
    }

    // SUBJECT LOGIC (Hybrid)
    if (indexMap.subject) {
        sections.push(`
SUBJECT (HYBRID REFERENCE MATCH):
The image must follow the GEOMETRY and ARRANGEMENT of Reference [$${indexMap.subject}], but match the DESCRIPTION below.

DESCRIPTION (CONTENT):
"${dishDescription}"

REFERENCE GUIDANCE (STRUCTURE & FORM):
1. MATCH: Geometric Shape & Form Factor from [$${indexMap.subject}] (CRITICAL).
${changesDescription ?
                `2. ADAPT: Ingredients & Arrangement MUST follow the "IMPORTANT EDITS".
   - Priority: EDIT > DESCRIPTION > REFERENCE VISUALS.` :
                `2. MATCH: Ingredient Arrangement, TEXTURE, and SPECIFIC INGREDIENTS from [$${indexMap.subject}].`}
`);
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

    // 5. CRITICAL EDITS
    if (changesDescription) {
        sections.push(`
!!! IMPORTANT EDITS & MODIFICATIONS !!!
The user has requested specific changes to the result. These must take precedence over references:
> "${changesDescription}"`);
    }

    // 6. HARD RULES
    sections.push(`
HARD RULES:
1. PHOTOREALISM IS PARAMOUNT. No plastic texture, no CGI look.
2. EDIBLE TEXTURES: Moisture, steam (if hot), crumbs, imperfections must look real.
3. No text, logos, or watermarks.`);

    return sections.join('\n');
}
