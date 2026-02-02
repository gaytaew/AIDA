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
import { setGeminiLimiterStatus } from '../routes/healthRoutes.js';
import { retry, isRetryableNetworkError } from '../utils/retry.js';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

// Register limiter status for health endpoint
setGeminiLimiterStatus(() => limitGemini.getStatus());

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
        'x-goog-api-key': apiKey,
        'Connection': 'close' // Force fresh connection each time (Stateless/Siege mode)
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
      // Детальное логирование для диагностики
      console.error(`[Gemini v${GEMINI_CLIENT_VERSION}] Full promptFeedback:`, JSON.stringify(pf, null, 2));
      if (pf.safetyRatings) {
        pf.safetyRatings.forEach(sr => {
          if (sr.probability !== 'NEGLIGIBLE' && sr.probability !== 'LOW') {
            console.error(`[Gemini] ⚠️ ${sr.category}: ${sr.probability}`);
          }
        });
      }
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
// RETRY LOGIC: Robust handling for Overload/503
// ═══════════════════════════════════════════════════════════════

async function callGeminiWithRetrySingle(body) {
  return await retry(
    async () => {
      const result = await callGeminiOnce(body);

      if (result.ok) {
        return result;
      }

      // Don't retry API errors (except 503 which is handled by outer loop, or managed here if desired)
      // retry.js excludes 'quota_exceeded', 'api_overloaded', 'internal_error' by default.
      if (!result.ok && result.errorCode &&
        ['quota_exceeded', 'api_overloaded', 'internal_error', 'api_error'].includes(result.errorCode)) {
        return result;
      }

      // Retry HTTP errors < 500 (transient?) - actually usually client error, but maybe network flake
      if (!result.ok && result.httpStatus && result.httpStatus < 500) {
        return result; // Client error, do not retry
      }

      if (!result.ok && result.httpStatus === 500) {
        return result; // Internal error, handled by outer loop
      }

      throw new Error(result.error || 'Network error');
    },
    {
      maxRetries: 1, // UPDATED: Fast fail, fallback handled by resilientImageGenerator
      initialDelay: 2000,
      maxDelay: 10000,
      multiplier: 2,
      shouldRetry: (error) => isRetryableNetworkError(error),
      onRetry: (attempt, error, delay) => {
        const errorMsg = error.message || String(error);
        console.warn(`[Gemini] Retry ${attempt}/1 in ${delay}ms. Error: ${errorMsg.slice(0, 100)}`);
      }
    }
  );
}

async function callGeminiWithRetry(body) {
  // UPDATED: Включаем "Осаду" (Soft Siege Mode)
  // Пытаемся пробиться через Gemini 5 раз перед тем, как сдаться или уйти на Vertex.
  const rounds = 5;
  const baseDelayMs = 1500; // Начинаем с 1.5 сек
  const maxDelayMs = 15000; // Не ждем больше 15 сек за раз

  let attempt = 0;
  let lastResult = null;

  for (let round = 0; round < rounds; round++) {
    lastResult = await callGeminiWithRetrySingle(body);
    if (lastResult.ok) return lastResult;

    const code = lastResult && lastResult.errorCode ? String(lastResult.errorCode) : '';
    const httpStatus = lastResult && lastResult.httpStatus ? Number(lastResult.httpStatus) : null;

    // Retry Overloaded (503), Internal (500), AND Quota (429)
    const isOverloaded = code === 'api_overloaded' || httpStatus === 503;
    const isInternal = code === 'internal_error' || httpStatus === 500;
    const isQuota = code === 'quota_exceeded' || httpStatus === 429;

    if (isOverloaded || isInternal || isQuota) {
      attempt++;
      // Экспоненциальный отступ + Jitter
      // 1.5s -> 3s -> 6s -> 12s...
      const jitter = Math.floor(Math.random() * 500);
      const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1)) + jitter;

      console.warn(
        `[Gemini] ⚠️ ${isOverloaded ? 'OVERLOADED' : isQuota ? 'QUOTA' : 'INTERNAL'} (attempt ${attempt}/${rounds}). Waiting ${delay}ms...`
      );

      await sleep(delay);
      continue;
    }

    // Если ошибка не 503/500/429 (например, 400 Bad Request), выходим сразу
    return lastResult;
  }

  return (
    lastResult || {
      ok: false,
      error: 'Gemini did not respond after all retries.',
      errorCode: 'internal_error' // Для триггера fallback
    }
  );
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
    },
    // ВАЖНО: Максимально отключаем фильтры безопасности для портретов
    // Используем OFF вместо BLOCK_NONE (более новый API)
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'OFF' }
    ]
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
  const requestStartTime = Date.now();

  const body = createGeminiBody(prompt, referenceImages, imageConfig);

  // Используем лимитер ТОЛЬКО для concurrency
  // Таймаут контролируется внутри callGeminiOnce
  const result = await limitGemini(() => callGeminiWithRetry(body));

  const duration = Date.now() - requestStartTime;
  console.log(`[Gemini] Request completed in ${(duration / 1000).toFixed(1)} sec`);

  if (!result.ok && result.errorCode === 'quota_exceeded') {
    console.warn('[Gemini] Quota exceeded.');
    return result;
  }

  if (!result.ok && result.errorCode === 'internal_error') {
    // Even after retries, internal error persisted
    console.error('[Gemini] Internal error:', result.error);
    return result;
  }

  if (!result.ok && result.errorCode === 'api_overloaded') {
    console.error(`[Gemini] API Overloaded after retries (${(duration / 1000).toFixed(1)}s):`, result.error);
    return result;
  }

  return result;
}
