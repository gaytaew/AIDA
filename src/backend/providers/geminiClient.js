/**
 * Gemini (Nano Banana Pro) client for AIDA.
 * Adapted from fashion-shoot-mvp geminiClient.js
 */

import { fetch } from 'undici';
import config from '../config.js';
import { retry, isRetryableNetworkError } from '../utils/retry.js';
import { createLimiter } from '../utils/limiter.js';

// Nano Banana Pro - модель для генерации изображений
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

// Таймаут для запросов к Gemini API (в миллисекундах)
const REQUEST_TIMEOUT_MS = 120000; // 120 секунд

// Global limiter for Gemini to reduce burst/parallel overload (503).
const GEMINI_CONCURRENCY = 1;
const GEMINI_MIN_TIME_MS = 800;
const limitGemini = createLimiter({ concurrency: GEMINI_CONCURRENCY, minTimeMs: GEMINI_MIN_TIME_MS });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getGeminiKeyDebugInfo() {
  const key = config.GEMINI_API_KEY;
  if (!key) {
    return '[Gemini key] no key configured';
  }
  const len = key.length;
  const last4 = key.slice(-4);
  return `[Gemini key] length=${len}, masked=***${last4}`;
}

async function callGeminiOnce(body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const apiKey = config.GEMINI_API_KEY || '';
  
  const bodyStr = JSON.stringify(body);
  const bodySizeMB = (bodyStr.length / 1024 / 1024).toFixed(2);
  const imageCount = body?.contents?.[0]?.parts?.filter(p => p.inlineData)?.length || 0;
  console.log(`[Gemini] Sending request: ${bodySizeMB} MB, ${imageCount} images`);

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: bodyStr,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      const code = parsed?.error?.code;
      const status = parsed?.error?.status;
      const message = parsed?.error?.message || text;

      const quotaExceeded =
        code === 429 ||
        status === 'RESOURCE_EXHAUSTED' ||
        /quota exceeded/i.test(String(message || '')) ||
        /rate limit/i.test(String(message || ''));
      
      const apiOverloaded =
        /overloaded/i.test(String(message || '')) ||
        /model is overloaded/i.test(String(message || '')) ||
        /service unavailable/i.test(String(message || '')) ||
        response.status === 503;
      
      const internalError =
        /internal error/i.test(String(message || '')) ||
        status === 'INTERNAL' ||
        code === 500 ||
        response.status === 500;

      console.error('[Gemini] API error:', {
        message,
        code,
        status,
        httpStatus: response.status,
        errorType: quotaExceeded ? 'quota_exceeded' : (apiOverloaded ? 'api_overloaded' : (internalError ? 'internal_error' : 'http_error'))
      });
      console.error(getGeminiKeyDebugInfo());
      
      return {
        ok: false,
        error: `Gemini API error: ${message}`,
        errorCode: quotaExceeded ? 'quota_exceeded' : (apiOverloaded ? 'api_overloaded' : (internalError ? 'internal_error' : 'http_error')),
        httpStatus: response.status
      };
    }

    const data = await response.json();
    
    // Check for content block
    if (data.promptFeedback?.blockReason) {
      const pf = data.promptFeedback;
      console.error('[Gemini] Request blocked:', {
        blockReason: pf.blockReason,
        blockReasonMessage: pf.blockReasonMessage || null
      });
      return { 
        ok: false, 
        error: `Gemini blocked request: ${pf.blockReason}${pf.blockReasonMessage ? ` (${String(pf.blockReasonMessage).slice(0, 160)})` : ''}`,
        errorCode: 'blocked',
        httpStatus: 400
      };
    }
    
    if (data.error) {
      const errorMessage = data.error.message || JSON.stringify(data.error);
      console.error('[Gemini] Error in response:', errorMessage);
      return { 
        ok: false, 
        error: `Gemini error: ${errorMessage}`,
        errorCode: 'api_error'
      };
    }
    
    const candidate = data.candidates && data.candidates[0];
    
    // Check finish reason
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
      console.warn('[Gemini] Finished with reason:', candidate.finishReason);
      if (candidate.finishReason === 'SAFETY') {
        return { 
          ok: false, 
          error: 'Gemini rejected request due to safety concerns.',
          errorCode: 'blocked',
          httpStatus: 400
        };
      }
    }
    
    const imagePart =
      candidate && candidate.content && Array.isArray(candidate.content.parts)
        ? candidate.content.parts.find(p => p.inlineData && p.inlineData.data)
        : null;

    if (!imagePart) {
      const textPart = candidate?.content?.parts?.find(p => p.text);
      if (textPart) {
        console.log('[Gemini] Returned text instead of image:', textPart.text.slice(0, 500));
        return { 
          ok: false, 
          error: `Gemini did not generate image. Response: ${textPart.text.slice(0, 200)}` 
        };
      }
      
      return { ok: false, error: 'No image in Gemini response. Try again.' };
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    const base64 = imagePart.inlineData.data;

    return {
      ok: true,
      mimeType,
      base64
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError' || controller.signal.aborted) {
      console.error('[Gemini] Request timeout');
      return { 
        ok: false, 
        error: 'Gemini request timeout. Try again later.' 
      };
    }
    
    throw error;
  }
}

async function callGeminiWithRetrySingle(body) {
  return await retry(
    async () => {
      const result = await callGeminiOnce(body);
      
      if (result.ok) {
        return result;
      }
      
      // Don't retry API errors
      if (!result.ok && result.errorCode && 
          ['quota_exceeded', 'api_overloaded', 'internal_error', 'api_error'].includes(result.errorCode)) {
        return result;
      }
      
      if (!result.ok && result.httpStatus && result.httpStatus < 500) {
        return result;
      }
      
      if (!result.ok && result.httpStatus === 500) {
        return result;
      }
      
      throw new Error(result.error || 'Network error');
    },
    {
      maxRetries: 3,
      initialDelay: 2000,
      maxDelay: 10000,
      multiplier: 2,
      shouldRetry: (error) => isRetryableNetworkError(error),
      onRetry: (attempt, error, delay) => {
        const errorMsg = error.message || String(error);
        console.warn(`[Gemini] Retry ${attempt}/3 in ${delay}ms. Error: ${errorMsg.slice(0, 100)}`);
      }
    }
  );
}

async function callGeminiWithRetry(body) {
  const rounds = 6;
  const baseDelayMs = 2000;
  const maxDelayMs = 30000;

  let attempt = 0;
  let lastResult = null;

  for (let round = 0; round < rounds; round++) {
    lastResult = await callGeminiWithRetrySingle(body);
    if (lastResult.ok) return lastResult;

    const code = lastResult && lastResult.errorCode ? String(lastResult.errorCode) : '';
    const httpStatus = lastResult && lastResult.httpStatus ? Number(lastResult.httpStatus) : null;
    const isOverloaded = code === 'api_overloaded' || httpStatus === 503;
    const isInternal = code === 'internal_error' || httpStatus === 500;

    if (isOverloaded || isInternal) {
      attempt++;
      const jitter = Math.floor(Math.random() * 250);
      const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, Math.min(4, attempt - 1))) + jitter;
      console.warn(
        `[Gemini] TRANSIENT (${isOverloaded ? 'api_overloaded/503' : 'internal_error/500'}) (attempt ${attempt}/${rounds}). Waiting ${delay}ms.`
      );
      await sleep(delay);
      continue;
    }

    return lastResult;
  }

  return (
    lastResult || {
      ok: false,
      error: 'Gemini did not respond after all retries.',
      errorCode: 'internal_error'
    }
  );
}

function createGeminiBody(prompt, processedImages, imageConfig) {
  const parts = [];

  if (prompt) {
    parts.push({ text: prompt });
  }

  if (Array.isArray(processedImages) && processedImages.length > 0) {
    processedImages.forEach(img => {
      if (!img || !img.base64) return;
      parts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/jpeg',
          data: img.base64
        }
      });
    });
  }

  const cfg = imageConfig && typeof imageConfig === 'object' ? imageConfig : {};
  const aspectRatio = typeof cfg.aspectRatio === 'string' && cfg.aspectRatio ? cfg.aspectRatio : '1:1';
  const imageSize = typeof cfg.imageSize === 'string' && cfg.imageSize ? cfg.imageSize : '1K';

  return {
    contents: [
      {
        parts
      }
    ],
    generationConfig: {
      responseModalities: ['Image'],
      imageConfig: {
        aspectRatio,
        imageSize
      }
    }
  };
}

/**
 * Request text completion via Gemini API.
 * @param {string} prompt - Text prompt
 * @param {Array<{mimeType: string, base64: string}>} images - Reference images (optional)
 * @returns {Promise<{ok: boolean, text?: string, error?: string}>}
 */
export async function requestGeminiText({ prompt, images = [] }) {
  const apiKey = config.GEMINI_API_KEY;
  
  if (!apiKey) {
    return { ok: false, error: 'GEMINI_API_KEY is not configured' };
  }

  const parts = [];
  
  if (prompt) {
    parts.push({ text: prompt });
  }

  if (Array.isArray(images) && images.length > 0) {
    images.forEach(img => {
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
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['TEXT']
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      console.error('[Gemini] Text API error:', text.slice(0, 500));
      return { ok: false, error: `Gemini API error: ${response.status}` };
    }

    const data = await response.json();
    
    if (data.promptFeedback?.blockReason) {
      return { ok: false, error: `Blocked: ${data.promptFeedback.blockReason}` };
    }

    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.find(p => p.text);
    
    if (!textPart) {
      return { ok: false, error: 'No text in Gemini response' };
    }

    return { ok: true, text: textPart.text };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[Gemini] Text request error:', error.message);
    return { ok: false, error: error.message };
  }
}

/**
 * Request image generation via Gemini API.
 * @param {string} prompt - Text prompt
 * @param {Array<{mimeType: string, base64: string}>} referenceImages - Reference images
 * @param {Object} imageConfig - Image configuration (aspectRatio, imageSize)
 * @returns {Promise<{ok: boolean, mimeType?: string, base64?: string, error?: string}>}
 */
export async function requestGeminiImage({ prompt, referenceImages = [], imageConfig = {} }) {
  const apiKey = config.GEMINI_API_KEY;
  
  if (!apiKey) {
    return { ok: false, error: 'GEMINI_API_KEY is not configured' };
  }

  const requestStartTime = Date.now();
  
  const body = createGeminiBody(prompt, referenceImages, imageConfig);

  try {
    const result = await limitGemini(() => callGeminiWithRetry(body));
    const duration = Date.now() - requestStartTime;
    console.log(`[Gemini] Request completed in ${(duration / 1000).toFixed(1)} sec`);
    
    if (!result.ok && result.errorCode === 'quota_exceeded') {
      console.warn('[Gemini] Quota exceeded.');
      return result;
    }
    
    if (!result.ok && result.errorCode === 'internal_error') {
      console.error('[Gemini] Internal error:', result.error);
      return result;
    }
    
    return result;
  } catch (error) {
    console.error('[Gemini] Network error after all retries:', error);
    console.error(getGeminiKeyDebugInfo());
    
    const errorMsg = error.message || String(error);
    return {
      ok: false,
      error: `Gemini network error: ${errorMsg}`
    };
  }
}

