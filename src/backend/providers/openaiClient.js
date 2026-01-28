
import OpenAI from 'openai';
import config from '../config.js';

let openaiInstance = null;

function getOpenAI() {
    if (!openaiInstance) {
        if (!config.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not configured');
        }
        openaiInstance = new OpenAI({
            apiKey: config.OPENAI_API_KEY,
        });
    }
    return openaiInstance;
}

/**
 * Request text completion via OpenAI API (supports multimodal input).
 * @param {string} prompt - Text prompt
 * @param {Array<{mimeType: string, base64: string}>} images - Reference images (optional)
 * @returns {Promise<{ok: boolean, text?: string, error?: string}>}
 */
export async function requestOpenAIText({ prompt, images = [] }) {
    try {
        // Initialize lazily to prevent startup crash if key is missing
        const openai = getOpenAI();

        const messages = [{
            role: 'user',
            content: []
        }];

        // Add text prompt
        if (prompt) {
            messages[0].content.push({ type: 'text', text: prompt });
        }

        // Add images
        if (Array.isArray(images) && images.length > 0) {
            images.forEach(img => {
                if (!img || !img.base64) return;

                let imageUrl = `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}`;

                messages[0].content.push({
                    type: 'image_url',
                    image_url: {
                        url: imageUrl,
                        detail: 'high'
                    }
                });
            });
        }

        const response = await openai.chat.completions.create({
            model: config.OPENAI_TEXT_MODEL || 'gpt-5.2', // Use config or fallback
            messages: messages,
            max_tokens: 1500, // Reasonable limit for JSON output
        });

        const content = response.choices[0].message.content;
        return { ok: true, text: content };

    } catch (error) {
        console.error('[OpenAI] Request error:', error);
        return {
            ok: false,
            error: error.message || 'OpenAI API request failed'
        };
    }
}
