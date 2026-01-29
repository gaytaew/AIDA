/**
 * AIDA Configuration
 * Reads environment variables and exports configuration object.
 */

import dotenv from 'dotenv';

// Load .env file if present
dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '3003', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // API Keys
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  VERTEX_PROJECT_ID: process.env.VERTEX_PROJECT_ID || '',
  VERTEX_LOCATION: process.env.VERTEX_LOCATION || 'us-central1',
  // Модель должна поддерживать генерацию изображений (responseModalities: IMAGE)
  // gemini-2.0-flash-exp поддерживает это в Vertex AI
  VERTEX_MODEL: process.env.VERTEX_MODEL || 'gemini-3-pro-image-preview',

  // AI Models
  // GPT-5.2 is available via API in this environment
  OPENAI_TEXT_MODEL: process.env.OPENAI_TEXT_MODEL || 'gpt-5.2',

  // V3 Generation Settings
  V3_GEMINI_MODEL: process.env.V3_GEMINI_MODEL || 'gemini-2.0-flash',

  // Vision API Settings (for V3 analyzers)
  VISION_CACHE_PATH: process.env.VISION_CACHE_PATH || 'src/backend/store/vision-cache',
  VISION_RETRY_ATTEMPTS: parseInt(process.env.VISION_RETRY_ATTEMPTS || '3', 10),
  VISION_TIMEOUT_MS: parseInt(process.env.VISION_TIMEOUT_MS || '60000', 10),

  // Feature flags
  DEBUG: process.env.DEBUG === 'true',
};

export default config;
