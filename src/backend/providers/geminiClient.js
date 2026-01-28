/**
 * Gemini (Nano Banana Pro) client for AIDA.
 * 
 * VERSION: 2.0.0
 * DATE: 2026-01-28
 * 
 * ARCHITECTURE v2.0:
 * - Простая архитектура: один HTTP запрос → один таймаут → результат или fallback
 * - Убраны множественные уровни retry (были причиной бесконечных зависаний)
 * - Лимитер используется ТОЛЬКО для concurrency (предотвращение 503)
 * - При ошибках (timeout, overloaded) → возвращаем errorCode для fallback в генераторе
 */

import { fetch } from 'undici';
import config from '../config.js';
import { createLimiter } from '../utils/limiter.js';
import { setGeminiLimiterStatus, setGeminiClientVersion } from '../routes/healthRoutes.js';

// ═══════════════════════════════════════════════════════════════
// VERSION (для отслеживания на сервере)
// ═══════════════════════════════════════════════════════════════
export const GEMINI_CLIENT_VERSION = '2.0.4';

// Nano Banana Pro - модель для генерации изображений
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

// Единственный таймаут — 120 секунд
// Достаточно для сложных запросов с 6+ изображениями в 2K
const REQUEST_TIMEOUT_MS = 120000;

// Лимитер ТОЛЬКО для concurrency — предотвращает параллельные запросы (причина 503)
// НЕТ внутреннего таймаута — таймаут только на уровне HTTP
const limitGemini = createLimiter({
  concurrency: 1,
  minTimeMs: 500,
  name: 'Gemini'
});

// Register limiter status and version for health endpoint
setGeminiLimiterStatus(() => limitGemini.getStatus());
setGeminiClientVersion(GEMINI_CLIENT_VERSION);

// ═══════════════════════════════════════════════════════════════
// CORE: Единственный HTTP запрос к Gemini
// ═══════════════════════════════════════════════════════════════

async function callGeminiOnce(body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const apiKey = config.GEMINI_API_KEY || '';

  const bodyStr = JSON.stringify(body);
  const bodySizeMB = (bodyStr.length / 1024 / 1024).toFixed(2);
  const imageCount = body?.contents?.[0]?.parts?.filter(p => p.inlineData)?.length || 0;

  console.log(`[Gemini v${GEMINI_CLIENT_VERSION}] Request: ${bodySizeMB} MB, ${imageCount} images, timeout: ${REQUEST_TIMEOUT_MS / 1000}s`);

  try {
    const startTime = Date.now();

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
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // ═══════════════════════════════════════════════════════════════
    // ERROR HANDLING: Определяем тип ошибки для fallback
    // ═══════════════════════════════════════════════════════════════

    if (!response.ok) {
      const text = await response.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch { parsed = null; }

      const code = parsed?.error?.code;
      const status = parsed?.error?.status;
      const message = parsed?.error?.message || text;

      // Определяем тип ошибки
      const quotaExceeded =
        code === 429 ||
        status === 'RESOURCE_EXHAUSTED' ||
        /quota exceeded/i.test(String(message)) ||
        /rate limit/i.test(String(message));

      const apiOverloaded =
        /overloaded/i.test(String(message)) ||
        /model is overloaded/i.test(String(message)) ||
        /service unavailable/i.test(String(message)) ||
        response.status === 503;

      const internalError =
        /internal error/i.test(String(message)) ||
        status === 'INTERNAL' ||
        code === 500 ||
        response.status === 500;

      const errorCode = quotaExceeded ? 'quota_exceeded'
        : apiOverloaded ? 'api_overloaded'
          : internalError ? 'internal_error'
            : 'http_error';

      console.error(`[Gemini v${GEMINI_CLIENT_VERSION}] API error after ${duration}s:`, {
        errorCode,
        httpStatus: response.status,
        message: String(message).slice(0, 200)
      });

      return {
        ok: false,
        error: `Gemini API error: ${String(message).slice(0, 200)}`,
        errorCode,
        httpStatus: response.status
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // SUCCESS PATH: Парсим ответ
    // ═══════════════════════════════════════════════════════════════

    const data = await response.json();

    // Check for content block
    if (data.promptFeedback?.blockReason) {
      const pf = data.promptFeedback;
      console.error(`[Gemini v${GEMINI_CLIENT_VERSION}] Blocked:`, pf.blockReason);
      return {
        ok: false,
        error: `Gemini blocked: ${pf.blockReason}`,
        errorCode: 'blocked',
        httpStatus: 400
      };
    }

    if (data.error) {
      console.error(`[Gemini v${GEMINI_CLIENT_VERSION}] Error in response:`, data.error.message);
      return {
        ok: false,
        error: `Gemini error: ${data.error.message}`,
        errorCode: 'api_error'
      };
    }

    const candidate = data.candidates?.[0];

    // Check finish reason
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
      console.warn(`[Gemini v${GEMINI_CLIENT_VERSION}] Finish reason:`, candidate.finishReason);
      if (candidate.finishReason === 'SAFETY') {
        return {
          ok: false,
          error: 'Gemini rejected due to safety.',
          errorCode: 'blocked',
          httpStatus: 400
        };
      }
    }

    // Extract image
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData?.data);

    if (!imagePart) {
      const textPart = candidate?.content?.parts?.find(p => p.text);
      if (textPart) {
        console.log(`[Gemini v${GEMINI_CLIENT_VERSION}] Got text instead of image:`, textPart.text.slice(0, 200));
        return {
          ok: false,
          error: `Gemini returned text: ${textPart.text.slice(0, 100)}`
        };
      }
      return { ok: false, error: 'No image in Gemini response' };
    }

    console.log(`[Gemini v${GEMINI_CLIENT_VERSION}] ✅ Success in ${duration}s`);

    return {
      ok: true,
      mimeType: imagePart.inlineData.mimeType || 'image/png',
      base64: imagePart.inlineData.data
    };

  } catch (error) {
    clearTimeout(timeoutId);

    // Timeout
    if (error.name === 'AbortError' || controller.signal.aborted) {
      console.error(`[Gemini v${GEMINI_CLIENT_VERSION}] ⏱️ Timeout after ${REQUEST_TIMEOUT_MS / 1000}s`);
      return {
        ok: false,
        error: `Gemini timeout (${REQUEST_TIMEOUT_MS / 1000}s). Попробуйте уменьшить качество.`,
        errorCode: 'timeout'
      };
    }

    // Network error
    console.error(`[Gemini v${GEMINI_CLIENT_VERSION}] Network error:`, error.message);
    return {
      ok: false,
      error: `Gemini network error: ${error.message}`,
      errorCode: 'network_error'
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Создание тела запроса
// ═══════════════════════════════════════════════════════════════

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
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['Image'],
      imageConfig: {
        aspectRatio,
        imageSize
      }
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// TEXT API (unchanged)
// ═══════════════════════════════════════════════════════════════

/**
 * Request text completion via Gemini API.
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

  const model = config.V3_GEMINI_MODEL || 'gemini-1.5-flash';
  const textUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(textUrl, {
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

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT: requestGeminiImage
// ═══════════════════════════════════════════════════════════════

/**
 * Request image generation via Gemini API.
 * 
 * ARCHITECTURE v2.0:
 * - Лимитер только для concurrency (предотвращение 503)
 * - Один HTTP запрос с таймаутом 120с
 * - При ошибках возвращаем errorCode для fallback в генераторе
 * 
 * @param {string} prompt - Text prompt
 * @param {Array<{mimeType: string, base64: string}>} referenceImages - Reference images
 * @param {Object} imageConfig - Image configuration (aspectRatio, imageSize)
 * @returns {Promise<{ok: boolean, mimeType?: string, base64?: string, error?: string, errorCode?: string}>}
 */
export async function requestGeminiImage({ prompt, referenceImages = [], imageConfig = {} }) {
  const apiKey = config.GEMINI_API_KEY;

  if (!apiKey) {
    return { ok: false, error: 'GEMINI_API_KEY is not configured' };
  }

  console.log(`[Gemini v${GEMINI_CLIENT_VERSION}] requestGeminiImage called`);

  const body = createGeminiBody(prompt, referenceImages, imageConfig);

  // Используем лимитер ТОЛЬКО для concurrency
  // Таймаут контролируется внутри callGeminiOnce
  const result = await limitGemini(() => callGeminiOnce(body));

  return result;
}
