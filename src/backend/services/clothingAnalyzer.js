/**
 * Clothing Analyzer Service (V3)
 * 
 * Analyzes clothing reference images using Gemini Vision API.
 * Extracts detailed characteristics for consistent reproduction in generated images.
 */

import { requestGeminiText } from '../providers/geminiClient.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CACHE_DIR = 'src/backend/store/vision-cache/clothing';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ═══════════════════════════════════════════════════════════════
// ANALYSIS PROMPT
// ═══════════════════════════════════════════════════════════════

const CLOTHING_ANALYSIS_PROMPT = `You are an expert fashion analyst. Analyze this clothing item image and extract precise characteristics for consistent reproduction in AI image generation.

## ANALYZE AND EXTRACT:

### 1. PRIMARY COLOR
- Exact color name (e.g., "charcoal gray", "dusty rose", "forest green")
- RGB values if determinable
- Warm/cool undertone

### 2. SECONDARY COLORS & ACCENTS
- Any additional colors visible
- Trim, buttons, stitching colors
- Pattern colors if applicable

### 3. MATERIAL & FABRIC
- Fabric type (cotton, wool, silk, denim, leather, synthetic, etc.)
- Texture (smooth, textured, ribbed, woven, knit)
- Weight (light, medium, heavy)
- Finish (matte, satin, glossy, distressed)

### 4. CONSTRUCTION DETAILS
- Visible seams and stitching style
- Closures (buttons, zippers, snaps, ties)
- Collars, cuffs, hems style
- Pockets (type, placement)
- Linings or layering visible

### 5. FIT & SILHOUETTE
- Overall shape (slim, relaxed, oversized, structured, flowy)
- Length description
- How it falls on the body
- Drape characteristics

### 6. DISTINCTIVE FEATURES
- Graphics, logos, prints (describe without brand names)
- Embellishments (studs, embroidery, patches)
- Unique design elements
- Hardware (zippers, buckles, rings)

### 7. STYLE CATEGORY
- Type of garment (jacket, shirt, pants, dress, etc.)
- Style category (casual, formal, streetwear, athletic, etc.)
- Era/aesthetic influence if apparent

## OUTPUT FORMAT (JSON):

{
  "garmentType": "string - type of clothing item",
  "primaryColor": {
    "name": "descriptive color name",
    "rgb": [R, G, B] or null,
    "undertone": "warm/cool/neutral"
  },
  "secondaryColors": [
    {"name": "color name", "location": "where on garment"}
  ],
  "material": {
    "fabric": "fabric type",
    "texture": "texture description",
    "weight": "light/medium/heavy",
    "finish": "finish type"
  },
  "construction": {
    "seams": "seam description",
    "closures": ["list of closures"],
    "collar": "collar type or null",
    "cuffs": "cuff style or null",
    "hem": "hem style",
    "pockets": ["pocket descriptions"] or null
  },
  "silhouette": {
    "fit": "slim/relaxed/oversized/structured/etc",
    "length": "length description",
    "drape": "how it falls/hangs"
  },
  "distinctiveFeatures": [
    "list of unique features"
  ],
  "styleCategory": "category description",
  "promptDescription": "A complete 2-3 sentence description suitable for image generation prompts"
}

Be precise and specific. This data will be used to ensure the exact same garment appears in generated images.`;

// ═══════════════════════════════════════════════════════════════
// CACHE HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate cache key from image data
 */
function generateCacheKey(imageBase64) {
  return crypto.createHash('md5').update(imageBase64).digest('hex');
}

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }
}

/**
 * Load cached analysis
 */
async function loadFromCache(cacheKey) {
  try {
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
    const data = await fs.readFile(cachePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

/**
 * Save analysis to cache
 */
async function saveToCache(cacheKey, analysis) {
  try {
    await ensureCacheDir();
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
    await fs.writeFile(cachePath, JSON.stringify(analysis, null, 2));
  } catch (e) {
    console.error('[ClothingAnalyzer] Cache write error:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYSIS FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze a clothing reference image
 * @param {Object} image - { mimeType: string, base64: string }
 * @param {Object} options - { useCache: boolean }
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzeClothingReference(image, options = { useCache: true }) {
  if (!image || !image.base64) {
    return { ok: false, error: 'No image provided' };
  }

  const cacheKey = generateCacheKey(image.base64);

  // Check cache first
  if (options.useCache) {
    const cached = await loadFromCache(cacheKey);
    if (cached) {
      console.log('[ClothingAnalyzer] Using cached analysis:', cacheKey.slice(0, 8));
      return { ok: true, analysis: cached, fromCache: true };
    }
  }

  // Call Gemini Vision API with retry logic
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[ClothingAnalyzer] Analysis attempt ${attempt}/${MAX_RETRIES}`);
    
    try {
      const result = await requestGeminiText({
        prompt: CLOTHING_ANALYSIS_PROMPT,
        images: [image]
      });

      if (!result.ok) {
        lastError = result.error;
        console.warn(`[ClothingAnalyzer] Attempt ${attempt} failed:`, result.error);
        
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
      }

      // Parse JSON response
      let analysis;
      try {
        // Extract JSON from response (might have markdown code blocks)
        let jsonText = result.text;
        const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1].trim();
        }
        analysis = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('[ClothingAnalyzer] JSON parse error:', parseError.message);
        console.error('[ClothingAnalyzer] Raw response:', result.text?.slice(0, 500));
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
      console.error(`[ClothingAnalyzer] Attempt ${attempt} error:`, e.message);
      
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  return { ok: false, error: lastError || 'Analysis failed after all retries' };
}

/**
 * Analyze multiple clothing images in parallel
 * @param {Array<Object>} images - Array of { mimeType, base64 }
 * @returns {Promise<Array<Object>>} Array of analysis results
 */
export async function analyzeBatch(images) {
  if (!images || images.length === 0) {
    return [];
  }

  console.log(`[ClothingAnalyzer] Analyzing batch of ${images.length} items`);
  
  const results = await Promise.all(
    images.map(img => analyzeClothingReference(img))
  );

  return results;
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Build natural language description for generation prompt
 * @param {Object} analysis - Analysis result from analyzeClothingReference
 * @returns {string} Natural language description
 */
export function buildPromptDescription(analysis) {
  if (!analysis) return '';

  const parts = [];

  // Garment type and style
  if (analysis.garmentType) {
    parts.push(analysis.garmentType);
  }

  // Primary color
  if (analysis.primaryColor?.name) {
    parts.push(`in ${analysis.primaryColor.name}`);
  }

  // Material
  if (analysis.material?.fabric) {
    parts.push(`made of ${analysis.material.fabric}`);
    if (analysis.material.texture) {
      parts.push(`with ${analysis.material.texture} texture`);
    }
  }

  // Silhouette
  if (analysis.silhouette?.fit) {
    parts.push(`${analysis.silhouette.fit} fit`);
  }

  // Use the pre-built prompt description if available
  if (analysis.promptDescription) {
    return analysis.promptDescription;
  }

  return parts.join(', ');
}

/**
 * Build strict preservation instructions for exact matching
 * @param {Object} analysis - Analysis result
 * @returns {string} Detailed constraints
 */
export function buildPreservationInstructions(analysis) {
  if (!analysis) return '';

  const instructions = [];

  instructions.push('CLOTHING PRESERVATION INSTRUCTIONS (CRITICAL):');
  instructions.push('The following garment must appear EXACTLY as described:\n');

  // Type
  if (analysis.garmentType) {
    instructions.push(`GARMENT TYPE: ${analysis.garmentType}`);
  }

  // Color
  if (analysis.primaryColor) {
    instructions.push(`\nPRIMARY COLOR: ${analysis.primaryColor.name}`);
    if (analysis.primaryColor.rgb) {
      instructions.push(`  RGB: (${analysis.primaryColor.rgb.join(', ')})`);
    }
    if (analysis.primaryColor.undertone) {
      instructions.push(`  Undertone: ${analysis.primaryColor.undertone}`);
    }
  }

  // Secondary colors
  if (analysis.secondaryColors?.length > 0) {
    instructions.push('\nSECONDARY COLORS:');
    analysis.secondaryColors.forEach(c => {
      instructions.push(`  - ${c.name} (${c.location})`);
    });
  }

  // Material
  if (analysis.material) {
    instructions.push('\nMATERIAL:');
    if (analysis.material.fabric) instructions.push(`  Fabric: ${analysis.material.fabric}`);
    if (analysis.material.texture) instructions.push(`  Texture: ${analysis.material.texture}`);
    if (analysis.material.weight) instructions.push(`  Weight: ${analysis.material.weight}`);
    if (analysis.material.finish) instructions.push(`  Finish: ${analysis.material.finish}`);
  }

  // Silhouette
  if (analysis.silhouette) {
    instructions.push('\nSILHOUETTE:');
    if (analysis.silhouette.fit) instructions.push(`  Fit: ${analysis.silhouette.fit}`);
    if (analysis.silhouette.length) instructions.push(`  Length: ${analysis.silhouette.length}`);
    if (analysis.silhouette.drape) instructions.push(`  Drape: ${analysis.silhouette.drape}`);
  }

  // Construction
  if (analysis.construction) {
    const c = analysis.construction;
    const details = [];
    if (c.collar) details.push(`Collar: ${c.collar}`);
    if (c.cuffs) details.push(`Cuffs: ${c.cuffs}`);
    if (c.hem) details.push(`Hem: ${c.hem}`);
    if (c.closures?.length) details.push(`Closures: ${c.closures.join(', ')}`);
    
    if (details.length > 0) {
      instructions.push('\nCONSTRUCTION DETAILS:');
      details.forEach(d => instructions.push(`  ${d}`));
    }
  }

  // Distinctive features
  if (analysis.distinctiveFeatures?.length > 0) {
    instructions.push('\nDISTINCTIVE FEATURES (MUST INCLUDE):');
    analysis.distinctiveFeatures.forEach(f => {
      instructions.push(`  - ${f}`);
    });
  }

  instructions.push('\n⚠️ DO NOT deviate from these specifications.');
  instructions.push('⚠️ DO NOT invent logos, patterns, or text not described.');
  instructions.push('⚠️ PRESERVE exact proportions and fit.');

  return instructions.join('\n');
}

/**
 * Compare two clothing analyses for similarity
 * @param {Object} analysis1 
 * @param {Object} analysis2 
 * @returns {{match: boolean, score: number, differences: string[]}}
 */
export function compareAnalyses(analysis1, analysis2) {
  if (!analysis1 || !analysis2) {
    return { match: false, score: 0, differences: ['Missing analysis data'] };
  }

  const differences = [];
  let matchingPoints = 0;
  let totalPoints = 0;

  // Compare garment type
  totalPoints++;
  if (analysis1.garmentType === analysis2.garmentType) {
    matchingPoints++;
  } else {
    differences.push(`Garment type: "${analysis1.garmentType}" vs "${analysis2.garmentType}"`);
  }

  // Compare primary color
  totalPoints++;
  if (analysis1.primaryColor?.name === analysis2.primaryColor?.name) {
    matchingPoints++;
  } else {
    differences.push(`Color: "${analysis1.primaryColor?.name}" vs "${analysis2.primaryColor?.name}"`);
  }

  // Compare material
  totalPoints++;
  if (analysis1.material?.fabric === analysis2.material?.fabric) {
    matchingPoints++;
  } else {
    differences.push(`Fabric: "${analysis1.material?.fabric}" vs "${analysis2.material?.fabric}"`);
  }

  // Compare fit
  totalPoints++;
  if (analysis1.silhouette?.fit === analysis2.silhouette?.fit) {
    matchingPoints++;
  } else {
    differences.push(`Fit: "${analysis1.silhouette?.fit}" vs "${analysis2.silhouette?.fit}"`);
  }

  const score = totalPoints > 0 ? (matchingPoints / totalPoints) : 0;

  return {
    match: score >= 0.75,
    score,
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
  analyzeClothingReference,
  analyzeBatch,
  buildPromptDescription,
  buildPreservationInstructions,
  compareAnalyses
};

