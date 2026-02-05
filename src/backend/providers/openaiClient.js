
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
            model: config.OPENAI_TEXT_MODEL || 'gpt-5.2',
            messages: messages,
            max_completion_tokens: 1500, // GPT-5.2 uses max_completion_tokens instead of max_tokens
        });

        const content = response.choices[0].message.content;
        return { ok: true, text: content };

    } catch (error) {
        console.error('[OpenAI] Request error:', error);
        // Write to file for debugging (ConsoleTap may not capture errors)
        const fs = await import('fs/promises');
        await fs.appendFile('/root/AIDA/openai_errors.log',
            `[${new Date().toISOString()}] ${error.message}\n${JSON.stringify(error, null, 2)}\n\n`
        ).catch(() => { });
        return {
            ok: false,
            error: error.message || 'OpenAI API request failed'
        };
    }
}
/**
 * Request JSON object from OpenAI
 */
export async function requestJsonFromOpenAI({
    system,
    user,
    images = [],
    temperature = 0.7,
    maxTokens = 4000
}) {
    try {
        const openai = getOpenAI();
        const messages = [];

        if (system) {
            messages.push({ role: 'system', content: system });
        }

        const userContent = [];
        if (user) userContent.push({ type: 'text', text: user });

        if (Array.isArray(images) && images.length > 0) {
            images.forEach(img => {
                if (!img || !img.base64) return;
                const url = `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}`;
                userContent.push({
                    type: 'image_url',
                    image_url: { url, detail: 'high' }
                });
            });
        }

        messages.push({ role: 'user', content: userContent });

        const response = await openai.chat.completions.create({
            model: config.OPENAI_TEXT_MODEL || 'gpt-4o',
            messages,
            temperature,
            max_tokens: maxTokens,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        let json = null;
        try {
            json = JSON.parse(content);
        } catch (e) {
            return { ok: false, error: 'Failed to parse JSON response' };
        }

        return { ok: true, json };

    } catch (error) {
        console.error('[OpenAI] JSON Request error:', error);
        return { ok: false, error: error.message };
    }
}

/**
 * Request Shoot from Prompt (Quick Mode helper)
 * Uses a default system prompt for creating a shoot structure.
 */
export async function requestShootFromPrompt(prompt) {
    const system = `You are an AI assistant that generates photoshoot plans in JSON format.
Output strictly valid JSON with formatting:
{
  "id": "SHOOT_...",
  "label": "Brief Title",
  "shortDescription": "...",
  "universe": {
    "tech": "...",
    "era": "...",
    "color": "...",
    "lens": "...",
    "mood": "..."
  },
  "scenes": [
    {
      "id": "SCENE_1",
      "label": "...",
      "role": "...",
      "space": "...",
      "lighting": "...",
      "camera": "...",
      "pose": "...",
      "emotion": "...",
      "action": "...",
      "clothingFocus": "...",
      "texture": "...",
      "antiAi": { "poseProfile": "auto" }
    }
  ]
}
No markdown. No commentary.`;

    const result = await requestJsonFromOpenAI({
        system,
        user: prompt,
        temperature: 0.7
    });

    if (!result.ok) return result;
    return { ok: true, shoot: result.json };
}
