/**
 * Vertex AI Client for AIDA.
 * Fallback provider when Gemini API is overloaded (503).
 */

import { fetch } from 'undici';
import { GoogleAuth } from 'google-auth-library';
import config from '../config.js';
import { retry, isRetryableNetworkError } from '../utils/retry.js';

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
 * Uses the same body structure as Gemini API but sends to Vertex endpoint.
 */
export async function requestVertexImage({ prompt, referenceImages = [], imageConfig = {} }) {
    const projectId = config.VERTEX_PROJECT_ID;
    const location = config.VERTEX_LOCATION;
    const modelId = config.VERTEX_MODEL; // e.g. 'gemini-1.5-pro-002'

    if (!projectId) {
        return { ok: false, error: 'VERTEX_PROJECT_ID is not configured' };
    }

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;

    console.log(`[VertexAI] Generating with model: ${modelId}`);

    // 1. Prepare Body (same as Gemini)
    // Vertex expects { instances: [ { content: ... } ], parameters: ... }
    // BUT for Gemini models in Vertex, the format is slightly specific.
    // Standard Gemini format: { contents: [...], generationConfig: ... }
    // Vertex "generateContent" method is:
    // POST https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model}:generateContent

    const generateContentUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

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

    const body = {
        contents: [{ role: 'user', parts }],
        generationConfig: {
            responseModalities: ['IMAGE'], // Vertex might support this, or might need specific simpler config
            // Note: Some vertex models act differently with generationConfig.
            // For images we usually stick to specific image generation models like imagen-3, 
            // BUT if we assume we are using a Gemini model that supports images (like Gemini 1.5 Pro / Flash),
            // we can try the standard generateContent schema.
        }
    };

    // Add image params if supported by the specific model version via generationConfig
    // For Gemini 1.5 Pro on Vertex, aspect ratio etc might be supported. 
    // Safety: let's try standard generationConfig first.
    if (imageConfig.aspectRatio) {
        // Note: Gemini 1.5 Pro via Vertex might NOT support 'imageConfig' inside generationConfig the same way AI Studio does yet.
        // It is safer to put aspect ratio in the prompt for fallback if technical params fail.
        // However, let's try to pass it if possible or rely on the model prompt instruction.
    }

    // NOTE: As of now, Image Generation via Gemini 1.5 Pro on Vertex is "Preview".
    // The 'responseModalities' field is key. 

    // For Imagen 3 it would be different (:predict endpoint).
    // Assuming we are using Gemini 1.5 Pro (multimodal input -> image output).
    // If the user wants to fallback for "Nano Banana Pro" (Gemini 3 Pro Image Preview), 
    // we likely need to target the same model family on Vertex.

    // Let's assume standard Gemini generateContent protocol.

    try {
        const token = await getAccessToken();

        const response = await fetch(generateContentUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('[VertexAI] Error:', text);
            return { ok: false, error: `Vertex API error: ${response.status} - ${text.slice(0, 200)}` };
        }

        const data = await response.json();

        // Parse response
        const candidate = data.candidates?.[0];
        if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
            if (candidate.finishReason === 'SAFETY') {
                return { ok: false, error: 'Vertex AI safety block', errorCode: 'blocked' };
            }
        }

        // Extract image
        // Vertex might return it in parts just like AI Studio
        const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

        if (!imagePart) {
            // Fallback: check for text explanation
            const textPart = candidate?.content?.parts?.find(p => p.text);
            if (textPart) {
                return { ok: false, error: `Vertex returned text: ${textPart.text.slice(0, 100)}` };
            }
            return { ok: false, error: 'No image in Vertex response' };
        }

        return {
            ok: true,
            mimeType: imagePart.inlineData.mimeType || 'image/png',
            base64: imagePart.inlineData.data
        };

    } catch (error) {
        console.error('[VertexAI] Exception:', error);
        return { ok: false, error: error.message };
    }
}
