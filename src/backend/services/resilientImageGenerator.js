/**
 * Resilient Image Generator Service
 * 
 * VERSION: 1.0.0
 * DATE: 2026-02-02
 * 
 * Централизованный сервис для генерации изображений с автоматическим fallback.
 * 
 * АРХИТЕКТУРА:
 * 1. Попытка через Gemini API (с встроенными retry в geminiClient.js)
 * 2. При transient error (Overload, Timeout, Network) → автоматический fallback на Vertex AI
 * 3. Единая логика для всех генераторов
 */

import { requestGeminiImage } from '../providers/geminiClient.js';
import { requestVertexImage } from '../providers/vertexClient.js';

// ═══════════════════════════════════════════════════════════════
// OVERLOAD STATISTICS (in-memory, resets on restart)
// ═══════════════════════════════════════════════════════════════

const stats = {
    geminiSuccess: 0,
    geminiOverloads: 0,
    geminiTimeouts: 0,
    geminiNetworkErrors: 0,
    vertexFallbackSuccess: 0,
    vertexFallbackFailed: 0,
    totalRequests: 0
};

/**
 * Get current overload statistics
 */
export function getOverloadStats() {
    return { ...stats };
}

/**
 * Reset statistics (useful for testing)
 */
export function resetOverloadStats() {
    Object.keys(stats).forEach(key => { stats[key] = 0; });
}

// ═══════════════════════════════════════════════════════════════
// ERROR CLASSIFICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Determine if error is transient (warrants fallback)
 * @param {Object} result - Result from geminiClient
 * @returns {{ isTransient: boolean, reason: string | null }}
 */
function classifyError(result) {
    if (result.ok) {
        return { isTransient: false, reason: null };
    }

    const errorCode = result.errorCode || '';
    const httpStatus = result.httpStatus || 0;
    const errorMsg = result.error || '';

    // Overloaded (503)
    const isOverloaded =
        errorCode === 'api_overloaded' ||
        httpStatus === 503 ||
        /overloaded/i.test(errorMsg) ||
        /service unavailable/i.test(errorMsg);

    if (isOverloaded) {
        return { isTransient: true, reason: 'OVERLOADED' };
    }

    // Timeout
    const isTimeout =
        errorCode === 'timeout' ||
        /timed out/i.test(errorMsg) ||
        /timeout/i.test(errorMsg);

    if (isTimeout) {
        return { isTransient: true, reason: 'TIMEOUT' };
    }

    // Network errors
    const isNetworkError =
        errorCode === 'network_error' ||
        errorCode === 'internal_error' ||
        /network error/i.test(errorMsg) ||
        /ECONNRESET/i.test(errorMsg) ||
        /ETIMEDOUT/i.test(errorMsg) ||
        /socket hang up/i.test(errorMsg) ||
        /fetch failed/i.test(errorMsg);

    if (isNetworkError) {
        return { isTransient: true, reason: 'NETWORK_ERROR' };
    }

    // Non-transient errors (quota, blocked, etc.)
    return { isTransient: false, reason: null };
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT: generateImageWithFallback
// ═══════════════════════════════════════════════════════════════

/**
 * Generate image with automatic fallback to Vertex AI on transient errors.
 * 
 * This is the UNIFIED entry point for all image generators.
 * It wraps geminiClient and vertexClient with intelligent error handling.
 * 
 * @param {Object} options
 * @param {string} options.prompt - Text prompt for generation
 * @param {Array<{mimeType: string, base64: string}>} options.referenceImages - Reference images
 * @param {Object} options.imageConfig - Image configuration (aspectRatio, imageSize)
 * @param {string} [options.generatorName] - Name of calling generator (for logging)
 * @returns {Promise<{ok: boolean, mimeType?: string, base64?: string, error?: string, provider?: string}>}
 */
export async function generateImageWithFallback({
    prompt,
    referenceImages = [],
    imageConfig = {},
    generatorName = 'Unknown'
}) {
    const genId = `res_${Date.now() % 100000}`;
    const startTime = Date.now();

    stats.totalRequests++;

    console.log(`[Resilient] [${genId}] [${generatorName}] Starting generation...`);

    // ───────────────────────────────────────────────────────────────
    // STEP 1: Try Gemini (Primary)
    // ───────────────────────────────────────────────────────────────

    const geminiStartTime = Date.now();

    const geminiResult = await requestGeminiImage({
        prompt,
        referenceImages,
        imageConfig
    });

    const geminiDuration = ((Date.now() - geminiStartTime) / 1000).toFixed(1);

    if (geminiResult.ok) {
        stats.geminiSuccess++;
        console.log(`[Resilient] [${genId}] ✅ Gemini success in ${geminiDuration}s`);

        return {
            ...geminiResult,
            provider: 'gemini'
        };
    }

    // ───────────────────────────────────────────────────────────────
    // STEP 2: Classify error and decide on fallback
    // ───────────────────────────────────────────────────────────────

    const { isTransient, reason } = classifyError(geminiResult);

    if (!isTransient) {
        // Non-transient error (quota, blocked, etc.) — no fallback
        console.log(`[Resilient] [${genId}] ❌ Gemini failed (non-transient): ${geminiResult.error?.slice(0, 100)}`);
        return {
            ...geminiResult,
            provider: 'gemini'
        };
    }

    // Update stats based on reason
    if (reason === 'OVERLOADED') stats.geminiOverloads++;
    else if (reason === 'TIMEOUT') stats.geminiTimeouts++;
    else if (reason === 'NETWORK_ERROR') stats.geminiNetworkErrors++;

    console.warn(`[Resilient] [${genId}] ⚠️ Gemini ${reason} after ${geminiDuration}s. Triggering Vertex fallback...`);

    // ───────────────────────────────────────────────────────────────
    // STEP 3: Fallback to Vertex AI
    // ───────────────────────────────────────────────────────────────

    const vertexStartTime = Date.now();

    const vertexResult = await requestVertexImage({
        prompt,
        referenceImages,
        imageConfig
    });

    const vertexDuration = ((Date.now() - vertexStartTime) / 1000).toFixed(1);
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (vertexResult.ok) {
        stats.vertexFallbackSuccess++;
        console.log(`[Resilient] [${genId}] ✅ Vertex fallback success in ${vertexDuration}s (total: ${totalDuration}s)`);

        return {
            ...vertexResult,
            provider: 'vertex_fallback'
        };
    }

    // ───────────────────────────────────────────────────────────────
    // STEP 4: Both failed
    // ───────────────────────────────────────────────────────────────

    stats.vertexFallbackFailed++;
    console.error(`[Resilient] [${genId}] ❌ BOTH PROVIDERS FAILED. Gemini: ${reason}. Vertex: ${vertexResult.error?.slice(0, 100)}`);

    return {
        ok: false,
        error: `Generation failed. Gemini: ${geminiResult.error}. Vertex: ${vertexResult.error}`,
        provider: 'both_failed'
    };
}

// ═══════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY EXPORT
// ═══════════════════════════════════════════════════════════════

// Re-export original functions for cases where direct access is needed
export { requestGeminiImage } from '../providers/geminiClient.js';
export { requestVertexImage } from '../providers/vertexClient.js';
