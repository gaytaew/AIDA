/**
 * Vertex AI Client for AIDA.
 * Fallback provider when Gemini API is overloaded or times out.
 * Uses the same Nano Banana Pro model (gemini-3-pro-image-preview) as geminiClient.
 */

import { fetch } from 'undici';
import { GoogleAuth } from 'google-auth-library';
import config from '../config.js';

let authClient = null;

async function getAccessToken() {
    if (!authClient) {
        authClient = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
    }
    return await authClient.getAccessToken();
}

/**
 * Request image generation via Vertex AI API.
 * Uses Nano Banana Pro (gemini-3-pro-image-preview) - same as Gemini API.
 */
export async function requestVertexImage({ prompt, referenceImages = [], imageConfig = {} }) {
    const projectId = config.VERTEX_PROJECT_ID;
    const location = config.VERTEX_LOCATION || 'us-central1';

    // Nano Banana Pro model - same as geminiClient
    const modelId = 'gemini-3-pro-image-preview';

    if (!projectId) {
        console.error('[VertexAI] VERTEX_PROJECT_ID is not configured');
        return { ok: false, error: 'VERTEX_PROJECT_ID is not configured' };
    }

    // Vertex AI generateContent endpoint
    const generateContentUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

    console.log(`[VertexAI] Generating with model: ${modelId} in ${location}`);
    console.log(`[VertexAI] Endpoint: ${generateContentUrl}`);

    // Build request body - same format as geminiClient
    const parts = [];

    if (prompt) {
        parts.push({ text: prompt });
    }

    if (Array.isArray(referenceImages) && referenceImages.length > 0) {
        referenceImages.forEach(img => {
            if (!img || !img.base64) return;
            parts.push({
                inlineData: {
                    mimeType: img.mimeType || 'image/jpeg',
                    data: img.base64
                }
            });
        });
    }

    // Image config - same as geminiClient
    const cfg = imageConfig && typeof imageConfig === 'object' ? imageConfig : {};
    const aspectRatio = typeof cfg.aspectRatio === 'string' && cfg.aspectRatio ? cfg.aspectRatio : '1:1';
    const imageSize = typeof cfg.imageSize === 'string' && cfg.imageSize ? cfg.imageSize : '1K';

    const body = {
        contents: [{ parts }],
        generationConfig: {
            responseModalities: ['Image'],
            imageConfig: {
                aspectRatio,
                imageSize
            }
        }
    };

    const bodySizeMB = (JSON.stringify(body).length / 1024 / 1024).toFixed(2);
    const imageCount = referenceImages.filter(img => img?.base64).length;
    console.log(`[VertexAI] Sending request: ${bodySizeMB} MB, ${imageCount} images`);

    try {
        const token = await getAccessToken();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 sec timeout

        const response = await fetch(generateContentUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const text = await response.text();
            console.error('[VertexAI] Error:', text.slice(0, 500));
            return { ok: false, error: `Vertex API error: ${response.status} - ${text.slice(0, 200)}` };
        }

        const data = await response.json();

        // Check for content block
        if (data.promptFeedback?.blockReason) {
            const pf = data.promptFeedback;
            console.error('[VertexAI] Request blocked:', pf.blockReason);
            return {
                ok: false,
                error: `Vertex AI blocked: ${pf.blockReason}`,
                errorCode: 'blocked'
            };
        }

        // Parse response - same format as Gemini
        const candidate = data.candidates?.[0];

        if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
            if (candidate.finishReason === 'SAFETY') {
                return { ok: false, error: 'Vertex AI safety block', errorCode: 'blocked' };
            }
            console.warn('[VertexAI] Finished with reason:', candidate.finishReason);
        }

        // Extract image
        const imagePart = candidate?.content?.parts?.find(p => p.inlineData?.data);

        if (!imagePart) {
            // Check for text explanation
            const textPart = candidate?.content?.parts?.find(p => p.text);
            if (textPart) {
                console.log('[VertexAI] Returned text instead of image:', textPart.text.slice(0, 200));
                return { ok: false, error: `Vertex returned text: ${textPart.text.slice(0, 100)}` };
            }
            return { ok: false, error: 'No image in Vertex response' };
        }

        console.log('[VertexAI] ✅ Image generated successfully');

        return {
            ok: true,
            mimeType: imagePart.inlineData.mimeType || 'image/png',
            base64: imagePart.inlineData.data
        };

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('[VertexAI] Request timeout');
            return { ok: false, error: 'Vertex AI request timeout' };
        }
        console.error('[VertexAI] Exception:', error.message);
        return { ok: false, error: error.message };
    }
}
