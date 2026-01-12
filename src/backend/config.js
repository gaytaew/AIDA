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

  // AI Models
  // GPT-5.2 is available via API in this environment
  OPENAI_TEXT_MODEL: process.env.OPENAI_TEXT_MODEL || 'gpt-5.2',

  // Feature flags
  DEBUG: process.env.DEBUG === 'true',
};

export default config;
