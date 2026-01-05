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

  // API Keys (for future use)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  VERTEX_PROJECT_ID: process.env.VERTEX_PROJECT_ID || '',

  // Feature flags
  DEBUG: process.env.DEBUG === 'true',
};

export default config;

