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
    FOOD_STATE
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
            images: validImages,
            aspectRatio: '3:4', // Standard vertical food shot
            safetySettings: 'relaxed' // Food sometimes triggers biology filters?
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
        dishDescription, camera, angle, lighting, plating, state
    } = params;

    let prompt = buildFoodShootPrompt({
        dishDescription, camera, angle, lighting, plating, state,
        hasSubjectRef: false, hasCrockeryRef: false, hasStyleRef: false // Disable default static logic
    });

    // Inject dynamic references
    // We strip the "REFERENCES" section from the base function or just append customized one.
    // Actually, let's just re-implement the Ref section here to be safe and clean.

    // Re-generating base prompt without refs:
    const sections = [];
    sections.push(`ROLE: World-class Food Photographer & Food Stylist.
You are an expert in appetizing textures, lighting that enhances flavor cues, and professional plating.
Generate a photorealistic food photograph.`);

    const cameraSpec = FOOD_CAMERA.options.find(o => o.value === camera)?.spec || 'Standard Lens';
    const angleSpec = FOOD_ANGLE.options.find(o => o.value === angle)?.spec || '45 Degree Angle';
    const lightingSpec = FOOD_LIGHTING.options.find(o => o.value === lighting)?.spec || 'Natural Light';
    const platingSpec = FOOD_PLATING.options.find(o => o.value === plating)?.spec || 'Standard Plating';
    const stateSpec = FOOD_STATE.options.find(o => o.value === state)?.spec || 'Perfect Condition';

    sections.push(`
TECHNIQUE:
- ${cameraSpec}
- ${angleSpec}
- ${lightingSpec}`);

    sections.push(`
SUBJECT:
${dishDescription}

STYLING:
- ${platingSpec}
- ${stateSpec}`);

    // DYNAMIC REFERENCES
    const refLines = [];

    if (indexMap.subject) {
        refLines.push(`REFERENCE [$${indexMap.subject}]: MAIN DISH VISUALS.
    - Copy the appearance of the food from [$${indexMap.subject}].
    - Maintain ingredients and approximate arrangement.`);
    }

    if (indexMap.crockery) {
        refLines.push(`REFERENCE [$${indexMap.crockery}]: CROCKERY / VESSEL (CRITICAL).
    - You MUST use the EXACT plate/bowl/cup pattern and shape from [$${indexMap.crockery}].
    - Place the food ON/IN this specific vessel.
    - This is the anchor of the composition.`);
    }

    if (indexMap.style) {
        refLines.push(`REFERENCE [$${indexMap.style}]: VISUAL STYLE / MOOD.
    - Copy lighting vibe, color grading, and background texture from [$${indexMap.style}].
    - DO NOT copy the subject content, only the aesthetic.`);
    }

    if (refLines.length > 0) {
        sections.push(`
REFERENCES:
${refLines.join('\n')}`);
    } else {
        sections.push(`
NO IMAGE REFERENCES PROVIDED.
Rely strictly on the text description.`);
    }

    sections.push(`
HARD RULES:
1. Photorealistic only. No CGI, no Illustration.
2. Food must look appetizing (edible textures, moisture, freshness).
3. If "steaming" is selected, steam must be subtle and backlit.
4. No text, logos, or watermarks.`);

    return sections.join('\n');
}
