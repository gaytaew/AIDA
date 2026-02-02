/**
 * Vertex AI Client for AIDA.
 * Fallback provider when Gemini API is overloaded or times out.
 * 
 * NANO BANANA PRO: Uses gemini-3-pro-image-preview for image generation.
 * Same model as geminiClient for consistent quality across primary and fallback.
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
 * Uses Nano Banana Pro (gemini-3-pro-image-preview) for consistent quality.
 */
export async function requestVertexImage({ prompt, referenceImages = [], imageConfig = {} }) {
    const projectId = config.VERTEX_PROJECT_ID;

    // Valid Vertex AI locations for Gemini
    const validLocations = ['us-central1', 'us-east4', 'us-west1', 'europe-west1', 'europe-west4', 'asia-northeast1'];
    let location = config.VERTEX_LOCATION || 'us-central1';

    // Fallback to us-central1 if invalid location
    if (!validLocations.includes(location)) {
        console.warn(`[VertexAI] Invalid location '${location}', using us-central1`);
        location = 'us-central1';
    }

    const modelId = config.VERTEX_MODEL || 'gemini-3-pro-image-preview';
    const isNanoBananaPro = modelId === 'gemini-3-pro-image-preview';

    // ═══════════════════════════════════════════════════════════════
    // SPECIAL CASE: Nano Banana Pro (Gemini 3)
    // This model is currently only available via AI Studio (Google AI), NOT Vertex.
    // To satisfy the requirement of using "Only Nano Banana Pro", we route 
    // "Vertex Fallback" requests for this model back to AI Studio API.
    // This effectively acts as a "Retry with same model" strategy.
    // ═══════════════════════════════════════════════════════════════
    if (isNanoBananaPro) {
        console.log(`[VertexAI] 🍌 Routing Nano Banana Pro (${modelId}) via AI Studio (Proxy Fallback)`);

        const apiKey = config.GEMINI_API_KEY;
        if (!apiKey) {
            return { ok: false, error: 'GEMINI_API_KEY required for Nano Banana Pro fallback' };
        }

        const aiStudioUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

        const body = {
            contents: [{ parts: [] }],
            generationConfig: {
                responseModalities: ['Image'],
                imageConfig: {
                    aspectRatio: typeof imageConfig.aspectRatio === 'string' ? imageConfig.aspectRatio : '1:1',
                    imageSize: typeof imageConfig.imageSize === 'string' ? imageConfig.imageSize : '1K'
                }
            }
        };

        if (prompt) body.contents[0].parts.push({ text: prompt });
        if (Array.isArray(referenceImages)) {
            referenceImages.forEach(img => {
                if (img?.base64) {
                    body.contents[0].parts.push({
                        inlineData: {
                            mimeType: img.mimeType || 'image/jpeg',
                            data: img.base64
                        }
                    });
                }
            });
        }

        // IMPLEMENTING RETRY LOGIC (2 attempts - Fast Fail Mode)
        // Since resilientImageGenerator already tried Gemini, we try Vertex quickly
        // and fail fast if both are down
        const retries = 2;
        const delays = [2000, 5000];

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Delay before retry (not on first attempt)
                if (attempt > 0) {
                    const delay = delays[attempt - 1] || 10000;
                    console.log(`[VertexAI] ⏳ Fallback Retry #${attempt} after ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                // 120s timeout per attempt
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 120000);

                const response = await fetch(`${aiStudioUrl}?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const text = await response.text();

                    // If it's the last attempt, return error
                    if (attempt === retries) {
                        return { ok: false, error: `Nano Banana Pro Fallback failed after ${retries} retries: ${response.status} - ${text.slice(0, 200)}` };
                    }

                    console.warn(`[VertexAI] Attempt #${attempt + 1} failed: ${response.status}. Retrying...`);
                    continue; // Try again
                }

                const data = await response.json();
                const candidate = data.candidates?.[0];

                if (candidate?.finishReason === 'SAFETY') {
                    return { ok: false, error: 'Nano Banana Pro blocked (Safety)', errorCode: 'blocked' };
                }

                const imagePart = candidate?.content?.parts?.find(p => p.inlineData?.data);

                if (!imagePart) {
                    if (attempt === retries) return { ok: false, error: 'No image in Fallback response' };
                    console.warn(`[VertexAI] Attempt #${attempt + 1} no image. Retrying...`);
                    continue;
                }

                console.log('[VertexAI] ✅ Nano Banana Pro fallback success');
                return {
                    ok: true,
                    mimeType: imagePart.inlineData.mimeType,
                    base64: imagePart.inlineData.data
                };
            } catch (error) {
                if (attempt === retries) {
                    return { ok: false, error: `Fallback Exception: ${error.message}` };
                }
                console.warn(`[VertexAI] Attempt #${attempt + 1} exception: ${error.message}`);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // STANDARD VERTEX AI FLOW (for Flash/other models)
    // ═══════════════════════════════════════════════════════════════

    if (!projectId) {
        console.error('[VertexAI] VERTEX_PROJECT_ID is not configured');
        return { ok: false, error: 'VERTEX_PROJECT_ID is not configured' };
    }

    // Vertex AI generateContent endpoint
    const generateContentUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

    console.log(`[VertexAI] Generating with model: ${modelId} in ${location}`);

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
        contents: [{ role: 'user', parts }],
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
