/**
 * Model Identity Analyzer Service (V3)
 * 
 * Analyzes model reference photos using Gemini Vision API.
 * Extracts precise identity markers for consistent face/body reproduction.
 */

import { requestGeminiText } from '../providers/geminiClient.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CACHE_DIR = 'src/backend/store/vision-cache/models';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ═══════════════════════════════════════════════════════════════
// ANALYSIS PROMPT
// ═══════════════════════════════════════════════════════════════

const IDENTITY_ANALYSIS_PROMPT = `You are an expert portrait photographer and facial recognition specialist. Analyze this person's photo and extract precise identity markers that will ensure consistent reproduction across multiple AI-generated images.

## CRITICAL: This is NOT about beauty standards. 
Extract OBJECTIVE physical characteristics for IDENTITY MATCHING.
The goal is that the SAME PERSON appears in all generated images.

## ANALYZE AND EXTRACT:

### 1. FACE STRUCTURE
- Face shape (oval, round, square, heart, oblong, diamond)
- Jawline (sharp, soft, angular, rounded, prominent)
- Cheekbones (high, low, prominent, subtle)
- Forehead (high, low, wide, narrow)
- Chin shape (pointed, rounded, square, cleft)

### 2. EYES
- Eye shape (almond, round, hooded, monolid, downturned, upturned)
- Eye color (be specific: "dark brown", "hazel with green flecks", etc.)
- Eye spacing (close-set, wide-set, average)
- Eyebrow shape (arched, straight, thick, thin, natural)
- Eyebrow color

### 3. NOSE
- Nose shape (straight, aquiline, button, roman, snub, wide, narrow)
- Bridge width (narrow, medium, wide)
- Nostril shape
- Tip shape (rounded, pointed, upturned)

### 4. MOUTH & LIPS
- Lip shape (full, thin, bow-shaped, wide, heart)
- Upper vs lower lip proportion
- Lip color (natural shade)
- Mouth width

### 5. SKIN
- Skin tone (use specific descriptors: "warm medium brown", "fair with pink undertones", etc.)
- Undertone (warm, cool, neutral)
- Visible texture (smooth, some texture, visible pores)
- Any freckles, moles, birthmarks (location and size)

### 6. HAIR
- Hair color (exact shade: "dark auburn", "ash blonde", etc.)
- Hair texture (straight, wavy, curly, coily)
- Hair thickness (fine, medium, thick)
- Hairline shape
- Current style/length

### 7. BODY TYPE (if visible)
- Build (slim, athletic, curvy, average, plus-size)
- Shoulder width
- Height estimate if determinable

### 8. DISTINCTIVE FEATURES
- Any unique identifying marks
- Tattoos (if visible)
- Piercings
- Glasses (if worn)
- Any asymmetries that define identity

## OUTPUT FORMAT (JSON):

{
  "faceStructure": {
    "shape": "face shape",
    "jawline": "jawline description",
    "cheekbones": "cheekbone description",
    "forehead": "forehead description",
    "chin": "chin description"
  },
  "eyes": {
    "shape": "eye shape",
    "color": "specific eye color",
    "spacing": "spacing description",
    "eyebrows": {
      "shape": "brow shape",
      "color": "brow color",
      "thickness": "thin/medium/thick"
    }
  },
  "nose": {
    "shape": "nose shape",
    "bridge": "bridge width",
    "nostrils": "nostril description",
    "tip": "tip description"
  },
  "mouth": {
    "lipShape": "lip description",
    "proportion": "upper/lower ratio",
    "color": "natural lip color",
    "width": "narrow/medium/wide"
  },
  "skin": {
    "tone": "specific skin tone",
    "undertone": "warm/cool/neutral",
    "texture": "texture description",
    "marks": [
      {"type": "freckle/mole/birthmark", "location": "where", "size": "small/medium/large"}
    ]
  },
  "hair": {
    "color": "specific hair color",
    "texture": "straight/wavy/curly/coily",
    "thickness": "fine/medium/thick",
    "hairline": "hairline shape",
    "currentStyle": "current style description"
  },
  "bodyType": {
    "build": "body type",
    "shoulders": "shoulder description",
    "estimatedHeight": "tall/average/petite or cm estimate"
  },
  "distinctiveFeatures": [
    "list of unique identifying features"
  ],
  "identitySummary": "A 2-3 sentence summary capturing the essential identity markers that MUST match in all generated images",
  "keyPhrases": ["list", "of", "key", "identity", "phrases", "for", "prompts"]
}

Be OBJECTIVE and PRECISE. This data ensures the SAME PERSON appears across all generated images.`;

// ═══════════════════════════════════════════════════════════════
// CACHE HELPERS
// ═══════════════════════════════════════════════════════════════

function generateCacheKey(imageBase64) {
  return crypto.createHash('md5').update(imageBase64).digest('hex');
}

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }
}

async function loadFromCache(cacheKey) {
  try {
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
    const data = await fs.readFile(cachePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

async function saveToCache(cacheKey, analysis) {
  try {
    await ensureCacheDir();
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
    await fs.writeFile(cachePath, JSON.stringify(analysis, null, 2));
  } catch (e) {
    console.error('[ModelIdentityAnalyzer] Cache write error:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYSIS FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze a model reference photo for identity markers
 * @param {Object} image - { mimeType: string, base64: string }
 * @param {Object} options - { useCache: boolean }
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzeModelReference(image, options = { useCache: true }) {
  if (!image || !image.base64) {
    return { ok: false, error: 'No image provided' };
  }

  const cacheKey = generateCacheKey(image.base64);

  // Check cache first
  if (options.useCache) {
    const cached = await loadFromCache(cacheKey);
    if (cached) {
      console.log('[ModelIdentityAnalyzer] Using cached analysis:', cacheKey.slice(0, 8));
      return { ok: true, analysis: cached, fromCache: true };
    }
  }

  // Call Gemini Vision API with retry logic
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[ModelIdentityAnalyzer] Analysis attempt ${attempt}/${MAX_RETRIES}`);
    
    try {
      const result = await requestGeminiText({
        prompt: IDENTITY_ANALYSIS_PROMPT,
        images: [image]
      });

      if (!result.ok) {
        lastError = result.error;
        console.warn(`[ModelIdentityAnalyzer] Attempt ${attempt} failed:`, result.error);
        
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
      }

      // Parse JSON response
      let analysis;
      try {
        let jsonText = result.text;
        const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1].trim();
        }
        analysis = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('[ModelIdentityAnalyzer] JSON parse error:', parseError.message);
        console.error('[ModelIdentityAnalyzer] Raw response:', result.text?.slice(0, 500));
        lastError = 'Failed to parse analysis response';
        
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        
        return { ok: false, error: lastError };
      }

      // Save to cache
      await saveToCache(cacheKey, analysis);

      return { ok: true, analysis, fromCache: false };
      
    } catch (e) {
      lastError = e.message;
      console.error(`[ModelIdentityAnalyzer] Attempt ${attempt} error:`, e.message);
      
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  return { ok: false, error: lastError || 'Analysis failed after all retries' };
}

/**
 * Analyze multiple model images and merge results
 * @param {Array<Object>} images - Array of { mimeType, base64 }
 * @returns {Promise<Object>} Merged analysis result
 */
export async function analyzeMultipleReferences(images) {
  if (!images || images.length === 0) {
    return { ok: false, error: 'No images provided' };
  }

  console.log(`[ModelIdentityAnalyzer] Analyzing ${images.length} reference images`);

  // Analyze first image as primary
  const primaryResult = await analyzeModelReference(images[0]);
  
  if (!primaryResult.ok) {
    return primaryResult;
  }

  // If only one image, return it
  if (images.length === 1) {
    return primaryResult;
  }

  // For multiple images, we use the primary and note additional references
  // (In a more advanced version, we could cross-validate)
  return {
    ok: true,
    analysis: primaryResult.analysis,
    referenceCount: images.length,
    fromCache: primaryResult.fromCache
  };
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Build identity lock instructions (hard constraints)
 * @param {Object} analysis - Analysis result
 * @returns {string} Strict identity constraints
 */
export function buildIdentityLockInstructions(analysis) {
  if (!analysis) return '';

  const instructions = [];

  instructions.push('IDENTITY LOCK INSTRUCTIONS (CRITICAL - MUST MATCH EXACTLY):');
  instructions.push('The person in the generated image MUST be the EXACT SAME person as in the reference.');
  instructions.push('This is the #1 priority. All other instructions are secondary.\n');

  // Face structure
  if (analysis.faceStructure) {
    const f = analysis.faceStructure;
    instructions.push('FACE STRUCTURE:');
    if (f.shape) instructions.push(`  Face shape: ${f.shape}`);
    if (f.jawline) instructions.push(`  Jawline: ${f.jawline}`);
    if (f.cheekbones) instructions.push(`  Cheekbones: ${f.cheekbones}`);
    if (f.forehead) instructions.push(`  Forehead: ${f.forehead}`);
    if (f.chin) instructions.push(`  Chin: ${f.chin}`);
  }

  // Eyes
  if (analysis.eyes) {
    const e = analysis.eyes;
    instructions.push('\nEYES (CRITICAL):');
    if (e.shape) instructions.push(`  Shape: ${e.shape}`);
    if (e.color) instructions.push(`  Color: ${e.color} — DO NOT CHANGE`);
    if (e.spacing) instructions.push(`  Spacing: ${e.spacing}`);
    if (e.eyebrows) {
      instructions.push(`  Eyebrows: ${e.eyebrows.shape}, ${e.eyebrows.thickness}, ${e.eyebrows.color}`);
    }
  }

  // Nose
  if (analysis.nose) {
    const n = analysis.nose;
    instructions.push('\nNOSE:');
    if (n.shape) instructions.push(`  Shape: ${n.shape}`);
    if (n.bridge) instructions.push(`  Bridge: ${n.bridge}`);
    if (n.tip) instructions.push(`  Tip: ${n.tip}`);
  }

  // Mouth
  if (analysis.mouth) {
    const m = analysis.mouth;
    instructions.push('\nMOUTH:');
    if (m.lipShape) instructions.push(`  Lips: ${m.lipShape}`);
    if (m.color) instructions.push(`  Natural lip color: ${m.color}`);
  }

  // Skin
  if (analysis.skin) {
    const s = analysis.skin;
    instructions.push('\nSKIN:');
    if (s.tone) instructions.push(`  Tone: ${s.tone} — DO NOT CHANGE`);
    if (s.undertone) instructions.push(`  Undertone: ${s.undertone}`);
    if (s.marks?.length > 0) {
      instructions.push('  Distinctive marks (MUST INCLUDE):');
      s.marks.forEach(mark => {
        instructions.push(`    - ${mark.type} on ${mark.location}`);
      });
    }
  }

  // Hair
  if (analysis.hair) {
    const h = analysis.hair;
    instructions.push('\nHAIR:');
    if (h.color) instructions.push(`  Color: ${h.color}`);
    if (h.texture) instructions.push(`  Texture: ${h.texture}`);
    if (h.hairline) instructions.push(`  Hairline: ${h.hairline}`);
  }

  // Distinctive features
  if (analysis.distinctiveFeatures?.length > 0) {
    instructions.push('\nDISTINCTIVE FEATURES (MUST INCLUDE):');
    analysis.distinctiveFeatures.forEach(f => {
      instructions.push(`  - ${f}`);
    });
  }

  instructions.push('\n⚠️ FORBIDDEN:');
  instructions.push('  - DO NOT beautify or idealize the face');
  instructions.push('  - DO NOT change eye color');
  instructions.push('  - DO NOT change skin tone');
  instructions.push('  - DO NOT make face more symmetrical');
  instructions.push('  - DO NOT smooth away distinctive features');
  instructions.push('  - DO NOT change face proportions');

  return instructions.join('\n');
}

/**
 * Build narrative description for prompts
 * @param {Object} analysis - Analysis result
 * @returns {string} Cohesive description
 */
export function buildNarrativeDescription(analysis) {
  if (!analysis) return '';

  // Use the summary if available
  if (analysis.identitySummary) {
    return analysis.identitySummary;
  }

  // Build from parts
  const parts = [];

  if (analysis.skin?.tone) {
    parts.push(`Person with ${analysis.skin.tone} skin`);
  }

  if (analysis.eyes?.color) {
    parts.push(`${analysis.eyes.color} eyes`);
  }

  if (analysis.hair?.color && analysis.hair?.texture) {
    parts.push(`${analysis.hair.texture} ${analysis.hair.color} hair`);
  }

  if (analysis.faceStructure?.shape) {
    parts.push(`${analysis.faceStructure.shape} face`);
  }

  if (analysis.bodyType?.build) {
    parts.push(`${analysis.bodyType.build} build`);
  }

  return parts.join(', ');
}

/**
 * Generate consistency metadata for verification
 * @param {Object} analysis - Analysis result
 * @returns {Object} Metadata for verification
 */
export function generateConsistencyMetadata(analysis) {
  if (!analysis) return {};

  return {
    eyeColor: analysis.eyes?.color || null,
    skinTone: analysis.skin?.tone || null,
    hairColor: analysis.hair?.color || null,
    faceShape: analysis.faceStructure?.shape || null,
    distinctiveMarks: analysis.skin?.marks?.length || 0,
    keyPhrases: analysis.keyPhrases || [],
    timestamp: new Date().toISOString()
  };
}

/**
 * Extract key phrases for compact prompts
 * @param {Object} analysis - Analysis result
 * @returns {string[]} Array of key phrases
 */
export function extractKeyPhrases(analysis) {
  if (!analysis) return [];

  // Use pre-extracted key phrases if available
  if (analysis.keyPhrases?.length > 0) {
    return analysis.keyPhrases;
  }

  // Build from analysis
  const phrases = [];

  if (analysis.skin?.tone) phrases.push(analysis.skin.tone);
  if (analysis.eyes?.color) phrases.push(`${analysis.eyes.color} eyes`);
  if (analysis.hair?.color) phrases.push(`${analysis.hair.color} hair`);
  if (analysis.faceStructure?.shape) phrases.push(`${analysis.faceStructure.shape} face`);
  if (analysis.faceStructure?.jawline) phrases.push(`${analysis.faceStructure.jawline} jawline`);

  return phrases;
}

/**
 * Compare two identity analyses to determine if same person
 * @param {Object} analysis1 
 * @param {Object} analysis2 
 * @returns {{match: boolean, confidence: number, differences: string[]}}
 */
export function compareAnalyses(analysis1, analysis2) {
  if (!analysis1 || !analysis2) {
    return { match: false, confidence: 0, differences: ['Missing analysis data'] };
  }

  const differences = [];
  let matchingPoints = 0;
  let totalPoints = 0;

  // Critical: Eye color
  totalPoints += 2;
  if (analysis1.eyes?.color === analysis2.eyes?.color) {
    matchingPoints += 2;
  } else {
    differences.push(`Eye color: "${analysis1.eyes?.color}" vs "${analysis2.eyes?.color}"`);
  }

  // Critical: Skin tone
  totalPoints += 2;
  if (analysis1.skin?.tone === analysis2.skin?.tone) {
    matchingPoints += 2;
  } else {
    differences.push(`Skin tone: "${analysis1.skin?.tone}" vs "${analysis2.skin?.tone}"`);
  }

  // Face shape
  totalPoints++;
  if (analysis1.faceStructure?.shape === analysis2.faceStructure?.shape) {
    matchingPoints++;
  } else {
    differences.push(`Face shape: "${analysis1.faceStructure?.shape}" vs "${analysis2.faceStructure?.shape}"`);
  }

  // Hair color
  totalPoints++;
  if (analysis1.hair?.color === analysis2.hair?.color) {
    matchingPoints++;
  } else {
    differences.push(`Hair color: "${analysis1.hair?.color}" vs "${analysis2.hair?.color}"`);
  }

  // Nose shape
  totalPoints++;
  if (analysis1.nose?.shape === analysis2.nose?.shape) {
    matchingPoints++;
  } else {
    differences.push(`Nose: "${analysis1.nose?.shape}" vs "${analysis2.nose?.shape}"`);
  }

  const confidence = totalPoints > 0 ? (matchingPoints / totalPoints) : 0;

  return {
    match: confidence >= 0.7,
    confidence,
    differences
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  analyzeModelReference,
  analyzeMultipleReferences,
  buildIdentityLockInstructions,
  buildNarrativeDescription,
  generateConsistencyMetadata,
  extractKeyPhrases,
  compareAnalyses
};


