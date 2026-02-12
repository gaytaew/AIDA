/**
 * Random Photo Generator Service
 * 
 * Generates photos from random prompts picked from theme pools.
 * Supports reference images, quality/format selection.
 */

import { requestGeminiImage } from '../providers/geminiClient.js';
import { RANDOM_THEMES, RANDOM_STYLE } from '../schema/randomPhotoShoot.js';
import { randomUUID } from 'crypto';

// ═══════════════════════════════════════════════════════════════
// RANDOM PROMPT SELECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Pick a random prompt from the given theme.
 * @param {string} themeValue - Theme ID (e.g. 'nature', 'urban')
 * @returns {string} Random prompt text
 */
function pickRandomPrompt(themeValue) {
    const theme = RANDOM_THEMES.options.find(t => t.value === themeValue);
    if (!theme || !theme.prompts || theme.prompts.length === 0) {
        // Fallback: pick from a random theme
        const allThemes = RANDOM_THEMES.options.filter(t => t.prompts?.length > 0);
        const randomTheme = allThemes[Math.floor(Math.random() * allThemes.length)];
        const prompts = randomTheme.prompts;
        return prompts[Math.floor(Math.random() * prompts.length)];
    }

    const prompts = theme.prompts;
    return prompts[Math.floor(Math.random() * prompts.length)];
}

/**
 * Get the style spec string for a given style value.
 */
function getStyleSpec(styleValue) {
    const style = RANDOM_STYLE.options.find(s => s.value === styleValue);
    return style?.spec || '';
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDING
// ═══════════════════════════════════════════════════════════════

/**
 * Build the full generation prompt.
 * @param {object} params - Generation parameters
 * @param {number} refCount - Number of reference images attached
 * @returns {string} Complete prompt
 */
function buildPrompt(params, refCount = 0) {
    const { theme, style, customPrompt } = params;

    // Select base prompt
    let basePrompt;
    if (customPrompt && customPrompt.trim().length > 0) {
        basePrompt = customPrompt.trim();
    } else {
        basePrompt = pickRandomPrompt(theme);
    }

    // Style spec
    const styleSpec = getStyleSpec(style || 'photorealistic');

    // Reference handling
    let refBlock = '';
    if (refCount > 0) {
        const refIndexes = [];
        for (let i = 1; i <= refCount; i++) {
            refIndexes.push(`[$${i}]`);
        }
        refBlock = `\n\nREFERENCE IMAGES: ${refIndexes.join(', ')} — Use these as visual references for composition, mood, color palette and style. Interpret their aesthetic and apply it to the generated image.`;
    }

    const prompt = `Generate a single stunning, high-quality image.

SUBJECT: ${basePrompt}

${styleSpec}

TECHNICAL REQUIREMENTS:
- Professional quality, suitable for print and digital media
- No text, watermarks, or UI elements
- No borders, frames, or vignettes unless explicitly part of the scene
- Physically accurate lighting and shadows
- Rich detail and texture appropriate to the subject${refBlock}`;

    return { prompt, basePrompt };
}

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a random photo.
 * 
 * @param {object} options
 * @param {object} options.params - { theme, style, imageSize, aspectRatio, customPrompt? }
 * @param {Array<{mimeType, base64}>} options.referenceImages - Reference images
 * @returns {object} Generated image result
 */
export async function generateRandomPhoto({ params, referenceImages = [] }) {
    const genId = `rnd_${Date.now() % 100000}`;
    console.log(`[RandomPhotoGen] ${genId} Start`, {
        theme: params.theme,
        style: params.style,
        refs: referenceImages.length
    });

    try {
        // 1. Build prompt
        const { prompt, basePrompt } = buildPrompt(params, referenceImages.length);

        console.log(`[RandomPhotoGen] ${genId} Prompt:\n${prompt.substring(0, 300)}...`);

        // 2. Call AI
        const result = await requestGeminiImage({
            prompt,
            referenceImages,
            imageConfig: {
                aspectRatio: params.aspectRatio || '1:1',
                imageSize: params.imageSize || '2k'
            },
            generatorName: 'RandomPhotoGenerator'
        });

        if (!result || !result.base64) {
            throw new Error(result?.error || 'No image returned from AI');
        }

        return {
            id: randomUUID(),
            base64: result.base64,
            mimeType: result.mimeType || 'image/png',
            prompt,
            basePrompt,
            theme: params.theme,
            style: params.style,
            params,
            createdAt: new Date().toISOString()
        };

    } catch (error) {
        console.error(`[RandomPhotoGen] ${genId} Error:`, error);
        throw error;
    }
}

export default { generateRandomPhoto };
