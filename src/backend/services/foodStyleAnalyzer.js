/**
 * Food Style Analyzer Service
 * 
 * Analyzes a reference food photography image using OpenAI Vision
 * and extracts parameters matching our schema.
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Our parameter values for the prompt
const PARAM_OPTIONS = {
    camera: ['macro_100mm', 'standard_50mm', 'wide_35mm'],
    angle: ['flat_lay', '45_degree', 'eye_level'],
    composition: ['center', 'rule_of_thirds', 'minimal', 'knolling'],
    lighting: ['natural_window', 'hard_sun', 'dark_moody', 'studio_clean', 'candlelight'],
    lightDirection: ['backlit', 'side', 'front', 'top_down'],
    shadows: ['soft_diffused', 'hard_crisp', 'deep_moody', 'minimal'],
    color: ['warm', 'cool', 'neutral', 'vibrant'],
    depth: ['f2_8', 'f5_6', 'f11'],
    plating: ['chefs_choice', 'rustic', 'deconstructed', 'stacked', 'scattered'],
    surface: ['wood_rustic', 'marble_white', 'slate_dark', 'concrete_grey', 'linen_fabric'],
    haptics: ['clean', 'steam_hot', 'condensation_cold', 'glistening_oily', 'crumbs_messy'],
    mood: ['appetizing', 'cozy', 'elegant', 'rustic', 'modern']
};

const ANALYSIS_PROMPT = `You are an expert food photography analyzer. Analyze this food photograph and identify the exact parameters used.

For each parameter, select ONE value from the given options that BEST matches the image.
Also provide a confidence score (0.0-1.0) for each parameter.

PARAMETERS TO ANALYZE:

1. CAMERA/LENS (options: ${PARAM_OPTIONS.camera.join(', ')})
   - macro_100mm: Extreme close-up, single element fills frame
   - standard_50mm: Natural perspective, full dish visible
   - wide_35mm: Context visible, table spread

2. ANGLE (options: ${PARAM_OPTIONS.angle.join(', ')})
   - flat_lay: Top-down 90°
   - 45_degree: Diner's angle
   - eye_level: Side view 0°

3. COMPOSITION (options: ${PARAM_OPTIONS.composition.join(', ')})
   - center: Subject centered
   - rule_of_thirds: Off-center placement
   - minimal: Lots of negative space
   - knolling: Grid arrangement

4. LIGHTING (options: ${PARAM_OPTIONS.lighting.join(', ')})
   - natural_window: Soft directional
   - hard_sun: Direct sunlight, hard shadows
   - dark_moody: Chiaroscuro, dramatic
   - studio_clean: Even, commercial
   - candlelight: Warm, intimate

5. LIGHT_DIRECTION (options: ${PARAM_OPTIONS.lightDirection.join(', ')})
   - backlit: Light from behind
   - side: Light from 45°
   - front: Light from camera
   - top_down: Light from above

6. SHADOWS (options: ${PARAM_OPTIONS.shadows.join(', ')})

7. COLOR_TONE (options: ${PARAM_OPTIONS.color.join(', ')})

8. DEPTH_OF_FIELD (options: ${PARAM_OPTIONS.depth.join(', ')})

9. PLATING_STYLE (options: ${PARAM_OPTIONS.plating.join(', ')})

10. SURFACE (options: ${PARAM_OPTIONS.surface.join(', ')})

11. HAPTICS/EFFECTS (options: ${PARAM_OPTIONS.haptics.join(', ')})

12. MOOD (options: ${PARAM_OPTIONS.mood.join(', ')})

Return ONLY a valid JSON object with this exact structure:
{
  "summary": "Brief 1-sentence description of the image style",
  "params": {
    "camera": { "value": "...", "confidence": 0.9 },
    "angle": { "value": "...", "confidence": 0.9 },
    "composition": { "value": "...", "confidence": 0.9 },
    "lighting": { "value": "...", "confidence": 0.9 },
    "lightDirection": { "value": "...", "confidence": 0.9 },
    "shadows": { "value": "...", "confidence": 0.9 },
    "color": { "value": "...", "confidence": 0.9 },
    "depth": { "value": "...", "confidence": 0.9 },
    "plating": { "value": "...", "confidence": 0.9 },
    "surface": { "value": "...", "confidence": 0.9 },
    "haptics": { "value": "...", "confidence": 0.9 },
    "mood": { "value": "...", "confidence": 0.9 }
  }
}`;

/**
 * Analyze a food photography reference image
 * @param {{base64: string, mimeType: string}} image - The reference image
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function analyzeStyleReference(image) {
    if (!image?.base64) {
        return { ok: false, error: 'No image provided' };
    }

    if (!process.env.OPENAI_API_KEY) {
        return { ok: false, error: 'OpenAI API key not configured' };
    }

    try {
        console.log('[StyleAnalyzer] Analyzing reference image...');

        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Using GPT-4o with vision
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: ANALYSIS_PROMPT },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${image.mimeType};base64,${image.base64}`,
                                detail: 'high'
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000,
            temperature: 0.3 // Lower for more consistent analysis
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            return { ok: false, error: 'Empty response from OpenAI' };
        }

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[StyleAnalyzer] Failed to parse JSON:', content);
            return { ok: false, error: 'Failed to parse analysis result' };
        }

        const result = JSON.parse(jsonMatch[0]);

        // Flatten params for easier frontend use
        const flatParams = {};
        const confidence = {};

        for (const [key, val] of Object.entries(result.params || {})) {
            flatParams[key] = val.value;
            confidence[key] = val.confidence;
        }

        console.log('[StyleAnalyzer] Analysis complete:', result.summary);

        return {
            ok: true,
            data: {
                summary: result.summary,
                params: flatParams,
                confidence
            }
        };

    } catch (error) {
        console.error('[StyleAnalyzer] Error:', error);
        return { ok: false, error: error.message || 'Analysis failed' };
    }
}

export default { analyzeStyleReference };
