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
    FOOD_CROCKERY
} from '../schema/foodShoot.js';

// ═══════════════════════════════════════════════════════════════
// PROMPT CONSTRUCTION
// ═══════════════════════════════════════════════════════════════

export function buildFoodShootPrompt({
    dishDescription = '',
    camera = 'standard_50mm',
    angle = '45_degree',
    lighting = 'natural_window',
    plating = 'rustic_messy',
    state = 'perfect',
    hasSubjectRef = false,  // [$1] - Specific Dish Look
    hasCrockeryRef = false, // [$2] - Plate/Bowl/Tableware
    hasStyleRef = false     // [$3] - Visual Mood
}) {

    const sections = [];

    // 1. ROLE
    sections.push(`ROLE: World-class Food Photographer & Food Stylist.
You are an expert in appetizing textures, lighting that enhances flavor cues, and professional plating.
Generate a photorealistic food photograph.`);

    // 2. TECH SPECS (From Schema)
    const cameraSpec = FOOD_CAMERA.options.find(o => o.value === camera)?.spec || FOOD_CAMERA.options[1].spec;
    const angleSpec = FOOD_ANGLE.options.find(o => o.value === angle)?.spec || FOOD_ANGLE.options[1].spec;
    const lightingSpec = FOOD_LIGHTING.options.find(o => o.value === lighting)?.spec || FOOD_LIGHTING.options[0].spec;
    const platingSpec = FOOD_PLATING.options.find(o => o.value === plating)?.spec || FOOD_PLATING.options[1].spec;
    const stateSpec = FOOD_STATE.options.find(o => o.value === state)?.spec || FOOD_STATE.options[0].spec;

    sections.push(`
TECHNIQUE:
- ${cameraSpec}
- ${angleSpec}
- ${lightingSpec}`);

    // 3. MAIN SUBJECT & STATE
    sections.push(`
SUBJECT:
${dishDescription}

STYLING:
- ${platingSpec}
- ${stateSpec}`);

    // 4. REFERENCES & RULES
    const referenceRules = [];

    if (hasSubjectRef) {
        referenceRules.push(`REFERENCE [$1]: MAIN DISH VISUALS.
    - Copy the appearance of the food from [$1].
    - Maintain ingredients and approximate arrangement.`);
    }

    if (hasCrockeryRef) {
        referenceRules.push(`REFERENCE [$2]: CROCKERY / VESSEL (CRITICAL).
    - You MUST use the EXACT plate/bowl/cup pattern and shape from [$2].
    - Place the food ON/IN this specific vessel.
    - This is the anchor of the composition.`);
    } else {
        referenceRules.push(`NO CROCKERY REFERENCE: Use tableware appropriate for the "${plating}" style.`);
    }

    if (hasStyleRef) {
        referenceRules.push(`REFERENCE [$3]: VISUAL STYLE / MOOD.
    - Copy lighting vibe, color grading, and background texture from [$3].
    - DO NOT copy the subject content, only the aesthetic.`);
    }

    if (referenceRules.length > 0) {
        sections.push(`
REFERENCES:
${referenceRules.join('\n')}`);
    }

    // 5. HARD RULES (Standard AIDA quality)
    sections.push(`
HARD RULES:
1. Photorealistic only. No CGI, no Illustration.
2. Food must look appetizing (edible textures, moisture, freshness).
3. If "steaming" is selected, steam must be subtle and backlit.
4. No text, logos, or watermarks.
5. High resolution textures.`);

    return sections.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// GENERATION LOGIC
// ═══════════════════════════════════════════════════════════════

export async function generateFoodShootFrame({
    params,
    subjectImage = null,   // Slot 1
    crockeryImage = null,  // Slot 2
    styleImage = null,     // Slot 3
}) {
    const genId = `food_${Date.now() % 100000}`;
    console.log(`[FoodGenerator] ${genId} Start`, params);

    try {
        // 1. Pack references
        // Max 3 images: Subject, Crockery, Style
        const imagesToUpload = [];
        const hasSubjectRef = !!subjectImage;
        const hasCrockeryRef = !!crockeryImage;
        const hasStyleRef = !!styleImage;

        // Slot 1: Subject
        if (hasSubjectRef) {
            imagesToUpload.push({
                base64: subjectImage.base64,
                mimeType: subjectImage.mimeType
            });
        } else {
            // Placeholder if we need to skip slots? 
            // Actually standard AIDA logic usually just pushes them in order.
            // But we referenced [$1], [$2], [$3] in prompt.
            // We must ensure the Prompt indexes match the uploaded array order.
            // For simplicity in this v1, let's just push what we have and dynamically adjust prompt text
            // OR (better) strict slot mapping if the provider supports it? 
            // Gemini just takes a list. So [$1] is the first image.

            // Let's re-map the prompt logic in buildFoodShootPrompt to use dynamic indexes?
            // No, simpler: WE MUST push placeholders or re-write the prompt.
            // Re-writing prompt is better.
            // Let's actually pass values to buildFoodShootPrompt to tell it which INDEX is which.
        }

        // Let's refine the list construction to be robust:
        const validImages = [];
        const indexMap = {}; // type -> index (1-based)

        if (hasSubjectRef) {
            validImages.push(subjectImage);
            indexMap['subject'] = validImages.length;
        }
        if (hasCrockeryRef) {
            validImages.push(crockeryImage);
            indexMap['crockery'] = validImages.length;
        }
        if (hasStyleRef) {
            validImages.push(styleImage);
            indexMap['style'] = validImages.length;
        }

        // 2. Build Prompt
        // We need to pass the mapped indexes so the prompt says "Ref [$1]" or "Ref [$2]" correctly
        const promptText = buildFoodShootPromptDynamic(params, indexMap);

        console.log(`[FoodGenerator] ${genId} Prompt Preview:\n${promptText.substring(0, 300)}...`);

        // 3. Call AI
        const result = await requestGeminiImage({
            prompt: promptText,
            referenceImages: validImages, // FIXED: was 'images'
            imageConfig: {
                aspectRatio: params.aspectRatio || '3:4',
                imageSize: params.imageSize || '2k' // Passed to provider
            },
            // safetySettings: 'relaxed' // Not used in refined client
        });

        if (!result || !result.base64) {
            throw new Error('No image returned from AI');
        }

        // 4. Return
        return {
            id: generateImageId(),
            base64: result.base64,
            mimeType: result.mimeType || 'image/jpeg',
            prompt: promptText,
            params: params,
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
        surface, crockery, // NEW Phase 4
        imageSize = '2k' // NEW Phase 5
    } = params;

    const sections = [];

    // 1. HYPER-REALISM ROLE
    sections.push(`ROLE: World-class Food Photographer & Food Stylist.
SPECIALTY: Hyper-realistic macro food photography.
GOAL: Create an image indistinguishable from a real photo shot on a Phase One camera.`);

    // Lookup Specs (Fallback to sensible defaults if missing)
    const cameraSpec = FOOD_CAMERA.options.find(o => o.value === camera)?.spec || 'Standard Lens';
    const angleSpec = FOOD_ANGLE.options.find(o => o.value === angle)?.spec || '45 Degree Angle';
    const lightingSpec = FOOD_LIGHTING.options.find(o => o.value === lighting)?.spec || 'Natural Light';
    const platingSpec = FOOD_PLATING.options.find(o => o.value === plating)?.spec || 'Standard Plating';
    const stateSpec = FOOD_STATE.options.find(o => o.value === state)?.spec || 'Perfect Condition';

    // New Specs
    const compSpec = FOOD_COMPOSITION.options.find(o => o.value === composition)?.spec || '';
    const depthSpec = FOOD_DEPTH.options.find(o => o.value === depth)?.spec || '';
    const colorSpec = FOOD_COLOR.options.find(o => o.value === color)?.spec || '';
    const textureSpec = FOOD_TEXTURE.options.find(o => o.value === texture)?.spec || '';
    const dynamicsSpec = FOOD_DYNAMICS.options.find(o => o.value === dynamics)?.spec || '';
    const surfaceSpec = FOOD_SURFACE.options.find(o => o.value === surface)?.spec || '';
    const crockerySpec = FOOD_CROCKERY.options.find(o => o.value === crockery)?.spec || '';

    // 2. MANDATORY ENVIRONMENT (IMMUTABLE)
    // These settings MUST override any reference image content (e.g. background/plate)
    sections.push(`
MANDATORY SCENE CONFIG:
The following environmental settings are HARD REQUIREMENTS.
If a Reference Image shows a different background or plate, YOU MUST REPLACE IT with the settings below.

SURFACE / BACKGROUND: ${surfaceSpec || 'Neutral'}
CROCKERY / VESSEL: ${crockerySpec || 'Appropriate for dish'}
LIGHTING: ${lightingSpec}
CAMERA: ${cameraSpec}
ANGLE: ${angleSpec}
`);

    // 3. SUBJECT LOGIC (Reference vs Description)
    // The user wants the STRUCTURE from the reference, but the CONTENT from the text description?
    // Or strictly the reference content?
    // Based on "Ignore Prompt" report: The user typed a prompt but it was ignored because "if (indexMap.subject)" block didn't include ${dishDescription}.

    if (indexMap.subject) {
        // STRICT REFERENCE MODE
        sections.push(`
SUBJECT (HYBRID REFERENCE MATCH):
The image must follow the GEOMETRY and ARRANGEMENT of Reference [$${indexMap.subject}], but match the DESCRIPTION below.

DESCRIPTION (CONTENT):
"${dishDescription}"

REFERENCE GUIDANCE (STRUCTURE & FORM):
1. MATCH: Geometric Shape & Form Factor from [$${indexMap.subject}] (CRITICAL).
   - If Ref is RECTANGULAR, output RECTANGULAR.
   - If Ref is SQUARE, output SQUARE.
${changesDescription ?
                `2. ADAPT: Ingredients & Arrangement MUST follow the "IMPORTANT EDITS" and "DESCRIPTION" below.
   - You MUST REPLACE ingredients from the reference if the text description asks for something different.
   - Example: If Ref shows "Sausage" but Description says "Pepperoni" -> MAKE PEPPERONI.
   - Priority: EDIT > DESCRIPTION > REFERENCE VISUALS (for ingredients only).` :
                `2. MATCH: Ingredient Arrangement, TEXTURE, and SPECIFIC INGREDIENTS from [$${indexMap.subject}].
   - Do NOT replace unique ingredients with generic ones.
   - Example: If Ref has "Rustic Chorizo" (irregular, chunky), DO NOT make "Perfect Round Pepperoni". Copy the REFERENCE visual exactly.`}
3. BALANCE: The Description below sets the "Concept".
   - IF EDITS ARE PRESENT: The Description dictates the CONTENT (what food is there). The Reference dictates the FORM (lighting, angle, shape).
   - IF NO EDITS: Follow the Reference visuals strictly for both content and form.

IMPORTANT OVERRIDES (ENVIRONMENT):
- **BACKGROUND**: DO NOT COPY the background from Reference [$${indexMap.subject}]. Use the "SURFACE" specified above.
- **PLATE/DISH**: DO NOT COPY the plate/dish from Reference [$${indexMap.subject}]. Use the "CROCKERY" specified above (or the Surface if appropriate).`);

    } else {
        // TEXT DESCRIPTION MODE
        sections.push(`
SUBJECT (TEXT BASED):
"${dishDescription}"`);
    }

    sections.push(`
STYLING DETAILS:
- ${platingSpec}
- ${stateSpec}
- ${textureSpec}
- ${dynamicsSpec}
- ${compSpec}
- ${depthSpec}
- ${colorSpec}`);

    // 3. OTHER REFERENCES
    const refLines = [];

    if (indexMap.crockery) {
        refLines.push(`REFERENCE [$${indexMap.crockery}]: CROCKERY / VESSEL (MANDATORY).
        - Use the EXACT plate/bowl/cup from [$${indexMap.crockery}].
        - Ignore any food inside the crockery reference; replace it with the SUBJECT.`);
    } else {
        // Fallback to Crockery Param if no Ref
        if (crockerySpec) {
            refLines.push(`CROCKERY (NO REFERENCE):
        - ${crockerySpec}`);
        }
    }

    if (indexMap.style) {
        refLines.push(`REFERENCE [$${indexMap.style}]: VISUAL STYLE / MOOD.
        - Copy lighting, color grading, and background texture from [$${indexMap.style}].`);
    }

    if (refLines.length > 0) {
        sections.push(`
REFERENCES:
${refLines.join('\n')}`);
    }

    // 4. CRITICAL EDITS (High Priority)
    if (changesDescription) {
        sections.push(`
!!! IMPORTANT EDITS & MODIFICATIONS !!!
The user has requested specific changes to the result. These must take precedence over references and standard descriptions:
> "${changesDescription}"
- IMPLEMENT THESE EDITS VISIBLY.
- If they conflict with a reference, the EDIT WINS.`);
    }

    // 5. HARD RULES (Updated for Hyper-realism)
    sections.push(`
HARD RULES:
1. PHOTOREALISM IS PARAMOUNT. No plastic texture, no CGI look.
2. EDIBLE TEXTURES: Moisture, steam (if hot), crumbs, imperfections must look real.
3. No text, logos, or watermarks.`);

    // Note: Quality logic removed, handled by imageSize resolution in requestGeminiImage

    // Backup: Explicitly state format in text
    if (params.aspectRatio) {
        sections.push(`FORMAT: The output image must be in ${params.aspectRatio} aspect ratio.`);
    }

    return sections.join('\n');
}
