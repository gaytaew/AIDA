/**
 * Утилита для повторных попыток выполнения операций с экспоненциальной задержкой.
 * Используется для обработки временных сетевых ошибок.
 */

/**
 * Выполняет функцию с повторными попытками при ошибках.
 * 
 * @param {Function} fn - Асинхронная функция для выполнения
 * @param {Object} options - Опции retry
 * @param {number} options.maxRetries - Максимальное количество попыток (по умолчанию 3)
 * @param {number} options.initialDelay - Начальная задержка в мс (по умолчанию 1000)
 * @param {number} options.maxDelay - Максимальная задержка в мс (по умолчанию 10000)
 * @param {number} options.multiplier - Множитель для экспоненциальной задержки (по умолчанию 2)
 * @param {Function} options.shouldRetry - Функция для определения, нужно ли повторять попытку (по умолчанию всегда true)
 * @param {Function} options.onRetry - Callback при каждой попытке (attempt, error, delay)
 * @returns {Promise} - Результат выполнения функции
 */
export async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    multiplier = 2,
    shouldRetry = () => true,
    onRetry = null
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Если это последняя попытка, выбрасываем ошибку
      if (attempt >= maxRetries) {
        throw error;
      }

      // Проверяем, нужно ли повторять попытку
      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      // Вызываем callback перед задержкой
      if (onRetry) {
        onRetry(attempt + 1, error, delay);
      }

      // Ждём перед следующей попыткой
      await new Promise(resolve => setTimeout(resolve, delay));

      // Увеличиваем задержку экспоненциально, но не больше maxDelay
      delay = Math.min(delay * multiplier, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Определяет, является ли ошибка сетевой и стоит ли повторять попытку.
 * 
 * @param {Error} error - Ошибка для проверки
 * @returns {boolean} - true, если стоит повторять попытку
 */
export function isRetryableNetworkError(error) {
  if (!error) return false;

  const errorMsg = String(error.message || '');
  const errorName = String(error.name || '');
  const errorCode = String(error.cause?.code || '');

  // Сетевые ошибки, которые стоит повторять
  const retryablePatterns = [
    'fetch failed',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'other side closed',
    'UND_ERR_SOCKET',
    'socket hang up',
    'timeout',
    'network',
    'connection',
    'aborted'
  ];

  // Проверяем сообщение об ошибке
  const matchesPattern = retryablePatterns.some(pattern =>
    errorMsg.toLowerCase().includes(pattern.toLowerCase()) ||
    errorName.toLowerCase().includes(pattern.toLowerCase()) ||
    errorCode.toLowerCase().includes(pattern.toLowerCase())
  );

  // Не повторяем для ошибок квоты, авторизации, перегрузки API или внутренних ошибок сервера
  const nonRetryablePatterns = [
    'quota',
    'rate limit',
    'unauthorized',
    'forbidden',
    'overloaded',
    'model is overloaded',
    'service unavailable',
    'internal error',
    'internal error encountered',
    '503',
    '401',
    '403',
    '429',
    '500'
  ];

  const isNonRetryable = nonRetryablePatterns.some(pattern =>
    errorMsg.toLowerCase().includes(pattern.toLowerCase())
  );

  return matchesPattern && !isNonRetryable;
}


