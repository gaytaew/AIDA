/**
 * LightingManager Schema
 * 
 * Professional lighting simulation for the Virtual Studio.
 * Manages light sources, modifiers, and handles temperature conflicts.
 * 
 * Key features:
 * 1. Light Sources - Where light comes from (natural, artificial, mixed)
 * 2. Light Modifiers - How light is shaped (softbox, hard, etc.)
 * 3. Temperature Management - Warm/cool with conflict resolution
 * 4. Automatic Key/Rim assignment for conflicting temperatures
 */

// ═══════════════════════════════════════════════════════════════
// LIGHT SOURCES - Where Light Comes From
// ═══════════════════════════════════════════════════════════════

export const LIGHT_SOURCES = {
  // Natural Sources
  GOLDEN_HOUR: {
    id: 'GOLDEN_HOUR',
    label: 'Golden Hour',
    category: 'natural',
    temperature: 'warm',
    kelvin: '3000-4000K',
    description: 'Warm, soft light shortly after sunrise or before sunset',
    keywords: 'golden warm light, long shadows, soft directional, orange-amber tones, magic hour glow',
    prompt: `GOLDEN HOUR NATURAL LIGHT:
- Warm, amber-orange tones (3000-4000K)
- Long, soft shadows cast at low angle
- Magical, romantic quality
- Skin appears warmly lit with golden highlights
- Background bathed in warm atmospheric light`
  },
  
  OVERCAST: {
    id: 'OVERCAST',
    label: 'Overcast / Cloudy',
    category: 'natural',
    temperature: 'neutral',
    kelvin: '6000-7000K',
    description: 'Soft, diffused daylight through cloud cover',
    keywords: 'soft diffused light, no harsh shadows, even illumination, flattering skin, cloud-softened',
    prompt: `OVERCAST NATURAL LIGHT:
- Soft, even illumination (6000-7000K)
- Clouds act as giant softbox
- Minimal shadows, flattering for portraits
- Neutral color temperature
- Even light on all sides of subject`
  },
  
  DIRECT_SUN: {
    id: 'DIRECT_SUN',
    label: 'Direct Sunlight',
    category: 'natural',
    temperature: 'neutral',
    kelvin: '5500-6000K',
    description: 'Hard, bright midday sun',
    keywords: 'harsh shadows, high contrast, bright highlights, defined edges, intense sunlight',
    prompt: `DIRECT SUNLIGHT:
- Hard, crisp shadows (5500-6000K)
- High contrast between lit and shadow areas
- Bright highlights, potentially blown
- Strong directional quality
- Defined texture and edge lighting`
  },
  
  WINDOW_LIGHT: {
    id: 'WINDOW_LIGHT',
    label: 'Window Light',
    category: 'natural',
    temperature: 'cool',
    kelvin: '5500-7000K',
    description: 'Soft directional light from a window',
    keywords: 'soft directional, gradual falloff, portrait quality, Rembrandt lighting, natural indoor',
    prompt: `WINDOW LIGHT:
- Soft, directional quality
- Gradual shadow falloff
- Classic portrait lighting setup
- Natural indoor atmosphere
- Slight cool tint from sky reflection`
  },
  
  // Artificial Sources
  TUNGSTEN: {
    id: 'TUNGSTEN',
    label: 'Tungsten / Incandescent',
    category: 'artificial',
    temperature: 'warm',
    kelvin: '2700-3200K',
    description: 'Classic warm indoor lighting',
    keywords: 'warm orange glow, cozy atmosphere, indoor ambiance, vintage warmth, practical lights',
    prompt: `TUNGSTEN LIGHTING:
- Very warm, orange-amber tones (2700-3200K)
- Cozy, intimate atmosphere
- Classic film look
- Skin appears warm and golden
- Evening/night indoor feel`
  },
  
  FLUORESCENT: {
    id: 'FLUORESCENT',
    label: 'Fluorescent',
    category: 'artificial',
    temperature: 'cool',
    kelvin: '4000-5000K',
    description: 'Cool, slightly green office/commercial lighting',
    keywords: 'cool greenish tint, flat institutional light, office ambiance, commercial space',
    prompt: `FLUORESCENT LIGHTING:
- Cool with slight green cast (4000-5000K)
- Flat, even illumination
- Office/commercial space feel
- May need color correction
- Institutional atmosphere`
  },
  
  NEON: {
    id: 'NEON',
    label: 'Neon / LED Color',
    category: 'artificial',
    temperature: 'cool',
    kelvin: 'varied/colored',
    description: 'Colored LED or neon accent lighting',
    keywords: 'colored gels, neon glow, RGB lighting, cyberpunk aesthetic, color accent',
    prompt: `NEON / COLORED LED LIGHTING:
- Bold, saturated color accents
- Often magenta, cyan, or mixed RGB
- Modern, urban, cyberpunk aesthetic
- Creates colorful rim lights and accents
- Strong visual style statement`
  },
  
  STUDIO_STROBE: {
    id: 'STUDIO_STROBE',
    label: 'Studio Strobe',
    category: 'artificial',
    temperature: 'neutral',
    kelvin: '5500-5600K',
    description: 'Professional studio flash lighting',
    keywords: 'controlled lighting, balanced exposure, professional studio, flash photography',
    prompt: `STUDIO STROBE LIGHTING:
- Daylight balanced (5500-5600K)
- Powerful, controlled illumination
- Can be modified with softboxes, umbrellas
- Professional studio quality
- Consistent, repeatable results`
  },
  
  RING_LIGHT: {
    id: 'RING_LIGHT',
    label: 'Ring Light',
    category: 'artificial',
    temperature: 'neutral',
    kelvin: '5000-5500K',
    description: 'Circular light source around camera lens',
    keywords: 'even facial illumination, ring catchlights, beauty lighting, shadowless face',
    prompt: `RING LIGHT:
- Even, flat illumination on face
- Signature ring-shaped catchlights in eyes
- Minimizes shadows and wrinkles
- Popular for beauty and social media
- Modern, clean aesthetic`
  }
};

// ═══════════════════════════════════════════════════════════════
// LIGHT MODIFIERS - How Light is Shaped
// ═══════════════════════════════════════════════════════════════

export const LIGHT_MODIFIERS = {
  SOFTBOX: {
    id: 'SOFTBOX',
    label: 'Softbox',
    quality: 'soft',
    description: 'Large diffused light source',
    keywords: 'Diffused light, soft shadows, wrap-around illumination, gradual falloff, flattering',
    prompt: `SOFTBOX MODIFIER:
- Large, diffused light source
- Soft, gradual shadow edges
- Wrap-around quality on subject
- Flattering for portraits
- Smooth, even illumination`
  },
  
  HARD_LIGHT: {
    id: 'HARD_LIGHT',
    label: 'Hard / Direct',
    quality: 'hard',
    description: 'Unmodified, direct light source',
    keywords: 'High contrast, dramatic shadows, defined textures, sharp edges, sculptural',
    prompt: `HARD / DIRECT LIGHT:
- Sharp, defined shadow edges
- High contrast between light and shadow
- Reveals texture dramatically
- Sculptural, dramatic quality
- Strong directional character`
  },
  
  BEAUTY_DISH: {
    id: 'BEAUTY_DISH',
    label: 'Beauty Dish',
    quality: 'medium',
    description: 'Semi-hard light with defined center and soft edges',
    keywords: 'Fashion lighting, contrasty soft, defined cheekbones, beauty photography',
    prompt: `BEAUTY DISH MODIFIER:
- Medium-soft light quality
- Crisp but not harsh shadows
- Excellent for fashion and beauty
- Defined facial contours
- Punchy yet flattering`
  },
  
  UMBRELLA: {
    id: 'UMBRELLA',
    label: 'Umbrella',
    quality: 'soft',
    description: 'Broad, soft bounce or shoot-through light',
    keywords: 'Broad illumination, soft shadows, even coverage, portrait friendly',
    prompt: `UMBRELLA MODIFIER:
- Very broad, soft light source
- Wide coverage area
- Gentle, even illumination
- Classic portrait lighting
- Forgiving and flattering`
  },
  
  GRID: {
    id: 'GRID',
    label: 'Grid / Snoot',
    quality: 'directional',
    description: 'Focused, controlled beam of light',
    keywords: 'Spotlight effect, controlled spill, dramatic accent, theatrical',
    prompt: `GRID / SNOOT MODIFIER:
- Tightly controlled beam
- Minimal light spill
- Dramatic spotlight effect
- Perfect for accent lighting
- Theatrical, focused quality`
  }
};

// ═══════════════════════════════════════════════════════════════
// LIGHTING MANAGER CLASS
// ═══════════════════════════════════════════════════════════════

/**
 * LightingConfig object
 * @typedef {Object} LightingConfig
 * @property {string} primarySource - Primary light source ID
 * @property {string} secondarySource - Secondary light source ID (optional)
 * @property {string} modifier - Light modifier ID
 * @property {string} mood - Overall lighting mood
 */

/**
 * Detect temperature conflicts between light sources
 * @param {string} source1 
 * @param {string} source2 
 * @returns {{hasConflict: boolean, source1Temp: string, source2Temp: string}}
 */
export function detectTemperatureConflict(source1, source2) {
  if (!source1 || !source2) {
    return { hasConflict: false, source1Temp: null, source2Temp: null };
  }
  
  const s1 = LIGHT_SOURCES[source1];
  const s2 = LIGHT_SOURCES[source2];
  
  if (!s1 || !s2) {
    return { hasConflict: false, source1Temp: null, source2Temp: null };
  }
  
  const temp1 = s1.temperature;
  const temp2 = s2.temperature;
  
  // Conflict if one is warm and one is cool
  const hasConflict = (temp1 === 'warm' && temp2 === 'cool') || 
                      (temp1 === 'cool' && temp2 === 'warm');
  
  return {
    hasConflict,
    source1Temp: temp1,
    source2Temp: temp2
  };
}

/**
 * Build prompt with automatic Key/Rim assignment for conflicting temperatures
 * @param {LightingConfig} config 
 * @returns {string}
 */
export function buildLightingPrompt(config) {
  const blocks = [];
  
  blocks.push('=== LIGHTING SETUP ===');
  
  const primarySource = LIGHT_SOURCES[config.primarySource];
  const secondarySource = config.secondarySource ? LIGHT_SOURCES[config.secondarySource] : null;
  const modifier = config.modifier ? LIGHT_MODIFIERS[config.modifier] : null;
  
  // Check for temperature conflict
  if (config.primarySource && config.secondarySource) {
    const conflict = detectTemperatureConflict(config.primarySource, config.secondarySource);
    
    if (conflict.hasConflict) {
      // Auto-assign Key (warm) and Rim (cool) roles
      const warmSource = conflict.source1Temp === 'warm' ? primarySource : secondarySource;
      const coolSource = conflict.source1Temp === 'cool' ? primarySource : secondarySource;
      
      blocks.push(`\n⚠️ MIXED COLOR TEMPERATURE DETECTED — AUTOMATIC ROLE ASSIGNMENT:`);
      blocks.push(`KEY LIGHT (Main illumination): ${warmSource.label} — ${warmSource.temperature} tone`);
      blocks.push(warmSource.prompt);
      blocks.push(`\nRIM/ACCENT LIGHT (Edge separation): ${coolSource.label} — ${coolSource.temperature} tone`);
      blocks.push(coolSource.prompt);
      blocks.push(`\nThe warm and cool sources create color contrast and visual depth.`);
    } else {
      // No conflict — standard setup
      blocks.push(`\n[PRIMARY LIGHT: ${primarySource.label}]`);
      blocks.push(primarySource.prompt);
      
      if (secondarySource) {
        blocks.push(`\n[SECONDARY LIGHT: ${secondarySource.label}]`);
        blocks.push(secondarySource.prompt);
      }
    }
  } else if (primarySource) {
    blocks.push(`\n[PRIMARY LIGHT: ${primarySource.label}]`);
    blocks.push(primarySource.prompt);
  }
  
  // Add modifier
  if (modifier) {
    blocks.push(`\n[LIGHT MODIFIER: ${modifier.label}]`);
    blocks.push(modifier.prompt);
  }
  
  return blocks.join('\n');
}

/**
 * Get keywords only (for compact prompts)
 * @param {LightingConfig} config 
 * @returns {string}
 */
export function getLightingKeywords(config) {
  const keywords = [];
  
  if (config.primarySource && LIGHT_SOURCES[config.primarySource]) {
    keywords.push(LIGHT_SOURCES[config.primarySource].keywords);
  }
  
  if (config.secondarySource && LIGHT_SOURCES[config.secondarySource]) {
    keywords.push(LIGHT_SOURCES[config.secondarySource].keywords);
  }
  
  if (config.modifier && LIGHT_MODIFIERS[config.modifier]) {
    keywords.push(LIGHT_MODIFIERS[config.modifier].keywords);
  }
  
  return keywords.join(', ');
}

/**
 * Validate lighting configuration
 * @param {LightingConfig} config 
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
export function validateLighting(config) {
  const errors = [];
  const warnings = [];
  
  if (config.primarySource && !LIGHT_SOURCES[config.primarySource]) {
    errors.push(`Invalid primarySource: ${config.primarySource}`);
  }
  
  if (config.secondarySource && !LIGHT_SOURCES[config.secondarySource]) {
    errors.push(`Invalid secondarySource: ${config.secondarySource}`);
  }
  
  if (config.modifier && !LIGHT_MODIFIERS[config.modifier]) {
    errors.push(`Invalid modifier: ${config.modifier}`);
  }
  
  // Check for temperature conflict (warning, not error)
  if (config.primarySource && config.secondarySource) {
    const conflict = detectTemperatureConflict(config.primarySource, config.secondarySource);
    if (conflict.hasConflict) {
      warnings.push(`Mixed color temperatures detected: ${conflict.source1Temp} + ${conflict.source2Temp}. Warm source will be used as Key Light, cool source as Rim Light.`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get all lighting options for UI
 * @returns {Object}
 */
export function getLightingOptions() {
  return {
    sources: Object.values(LIGHT_SOURCES).map(s => ({
      id: s.id,
      label: s.label,
      category: s.category,
      temperature: s.temperature,
      kelvin: s.kelvin,
      description: s.description
    })),
    modifiers: Object.values(LIGHT_MODIFIERS).map(m => ({
      id: m.id,
      label: m.label,
      quality: m.quality,
      description: m.description
    }))
  };
}

/**
 * Get default lighting configuration
 * @returns {LightingConfig}
 */
export function getDefaultLighting() {
  return {
    primarySource: 'WINDOW_LIGHT',
    secondarySource: null,
    modifier: 'SOFTBOX'
  };
}

/**
 * Get light sources grouped by category
 * @returns {Object}
 */
export function getLightSourcesByCategory() {
  const grouped = {
    natural: [],
    artificial: []
  };
  
  Object.values(LIGHT_SOURCES).forEach(source => {
    grouped[source.category].push({
      id: source.id,
      label: source.label,
      temperature: source.temperature,
      description: source.description
    });
  });
  
  return grouped;
}


