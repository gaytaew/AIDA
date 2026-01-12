/**
 * Prompt Builder V3 Service
 * 
 * Builds structured prompts with 6 blocks for maximum generation quality.
 * Integrates Vision API analyses for identity and clothing consistency.
 * 
 * BLOCKS:
 * 1. Hard Constraints - Identity/clothing locks, technical requirements
 * 2. Photo Realism - Camera, lens, optical physics
 * 3. Visual Identity - Model description, clothing details
 * 4. Atmospheric - Environment, lighting, mood
 * 5. Composition - Shot size, angle, pose, focus
 * 6. Quality Gates - Verification checklist
 */

import { buildIdentityLockInstructions, buildNarrativeDescription } from './modelIdentityAnalyzer.js';
import { buildPreservationInstructions, buildPromptDescription } from './clothingAnalyzer.js';
import {
  FOCAL_LENGTH,
  APERTURE,
  SHUTTER_SPEED,
  buildVirtualCameraPrompt
} from '../schema/virtualCamera.js';

// ═══════════════════════════════════════════════════════════════
// CAMERA PRESETS (for Photo Realism block)
// ═══════════════════════════════════════════════════════════════

const CAMERA_BODIES = {
  contax_t2: {
    id: 'contax_t2',
    label: 'Contax T2',
    prompt: 'Shot on Contax T2 with Carl Zeiss Sonnar 38mm f/2.8 lens. Kodak Portra 400 film aesthetic. Warm tones, slight grain, beautiful bokeh.'
  },
  hasselblad_500cm: {
    id: 'hasselblad_500cm',
    label: 'Hasselblad 500C/M',
    prompt: 'Medium format Hasselblad 500C/M quality. Carl Zeiss Planar 80mm f/2.8. Square format, exceptional sharpness, beautiful tonal range, medium format depth.'
  },
  leica_m6: {
    id: 'leica_m6',
    label: 'Leica M6',
    prompt: 'Leica M6 rangefinder aesthetic. Summicron 50mm f/2 or 35mm f/2. Classic documentary style, precise rendering, timeless quality.'
  },
  canon_5d: {
    id: 'canon_5d',
    label: 'Canon 5D Mark IV',
    prompt: 'Canon 5D Mark IV full-frame digital. Clean high-resolution digital capture, accurate colors, professional grade.'
  },
  sony_a7r: {
    id: 'sony_a7r',
    label: 'Sony A7R IV',
    prompt: 'Sony A7R IV mirrorless. 61MP resolution, exceptional detail, modern digital clarity.'
  },
  iphone_15_pro: {
    id: 'iphone_15_pro',
    label: 'iPhone 15 Pro',
    prompt: 'iPhone 15 Pro camera. Computational photography, sharp details, natural colors, slight HDR look.'
  },
  red_komodo: {
    id: 'red_komodo',
    label: 'RED Komodo 6K',
    prompt: 'RED Komodo 6K cinema camera. Cinematic look, shallow depth of field, rich colors, film-like motion blur potential.'
  }
};

const LENS_TYPES = {
  '35mm': { label: '35mm Wide', fov: 'wide', compression: 'minimal', prompt: '35mm lens — slightly wide field of view, documentary style, environmental context visible' },
  '50mm': { label: '50mm Standard', fov: 'natural', compression: 'natural', prompt: '50mm lens — natural perspective matching human vision, no distortion' },
  '85mm': { label: '85mm Portrait', fov: 'narrow', compression: 'flattering', prompt: '85mm lens — classic portrait focal length, flattering facial compression, beautiful background separation' },
  '135mm': { label: '135mm Telephoto', fov: 'compressed', compression: 'strong', prompt: '135mm lens — compressed perspective, strong subject isolation, creamy bokeh' },
  '200mm': { label: '200mm Long Telephoto', fov: 'very_compressed', compression: 'extreme', prompt: '200mm telephoto — extreme compression, paparazzi style, background becomes abstract blur' }
};

const APERTURE_VALUES = {
  'f1.4': { label: 'f/1.4', dof: 'extremely_shallow', prompt: 'f/1.4 aperture — razor-thin focus plane, dreamy bokeh, only eyes in sharp focus' },
  'f1.8': { label: 'f/1.8', dof: 'very_shallow', prompt: 'f/1.8 aperture — shallow depth of field, face in focus, background blurred' },
  'f2.8': { label: 'f/2.8', dof: 'shallow', prompt: 'f/2.8 aperture — good subject-background separation, professional portrait depth' },
  'f4.0': { label: 'f/4.0', dof: 'moderate', prompt: 'f/4.0 aperture — moderate depth, more context visible, still some background blur' },
  'f5.6': { label: 'f/5.6', dof: 'normal', prompt: 'f/5.6 aperture — balanced depth of field, sharp subject with recognizable background' },
  'f8.0': { label: 'f/8.0', dof: 'deep', prompt: 'f/8.0 aperture — deep focus, environment and subject both sharp, maximum detail' }
};

const FILM_TYPES = {
  portra_400: { label: 'Kodak Portra 400', prompt: 'Kodak Portra 400 film look — warm skin tones, soft contrast, creamy highlights, natural grain' },
  portra_800: { label: 'Kodak Portra 800', prompt: 'Kodak Portra 800 — slightly more grain, warmer tones, good for low light' },
  ektar_100: { label: 'Kodak Ektar 100', prompt: 'Kodak Ektar 100 — vivid saturated colors, fine grain, high contrast, punchy look' },
  tri_x_400: { label: 'Kodak Tri-X 400', prompt: 'Kodak Tri-X 400 black and white — classic grain, rich blacks, timeless documentary feel' },
  cinestill_800t: { label: 'CineStill 800T', prompt: 'CineStill 800T — tungsten balanced, halation around highlights, cinematic teal-orange shift' },
  fuji_pro_400h: { label: 'Fuji Pro 400H', prompt: 'Fuji Pro 400H — cool pastel tones, soft greens, airy feel, wedding photography aesthetic' },
  digital_clean: { label: 'Digital Clean', prompt: 'Clean digital capture — no film grain, accurate colors, sharp details throughout' }
};

// ═══════════════════════════════════════════════════════════════
// LIGHTING PRESETS (for Atmospheric block)
// ═══════════════════════════════════════════════════════════════

const LIGHTING_SETUPS = {
  natural_window: { label: 'Natural Window Light', prompt: 'Soft natural light from large window. Gentle shadows, natural falloff, daylight color temperature.' },
  golden_hour: { label: 'Golden Hour', prompt: 'Golden hour sunlight — warm orange tones, long soft shadows, magical quality, rim lighting.' },
  studio_soft: { label: 'Studio Softbox', prompt: 'Studio lighting with large softbox. Even, flattering light, controlled shadows, professional look.' },
  ring_light: { label: 'Ring Light', prompt: 'Ring light illumination — even frontal light, circular catchlights in eyes, beauty photography style.' },
  overcast: { label: 'Overcast Daylight', prompt: 'Overcast sky acting as giant softbox. Even diffused light, no harsh shadows, neutral color.' },
  harsh_sun: { label: 'Hard Direct Sun', prompt: 'Direct midday sun — hard shadows, high contrast, strong highlights, dramatic look.' },
  backlit: { label: 'Backlit/Rim Light', prompt: 'Backlit subject with rim lighting — glowing edges, silhouette potential, halo effect on hair.' },
  practical: { label: 'Practical Lights', prompt: 'Practical light sources in scene — lamps, neon signs, mixed color temperatures, cinematic feel.' }
};

const LIGHTING_QUALITIES = {
  soft: { label: 'Soft Diffused', prompt: 'Soft, diffused lighting — gentle shadows, flattering to skin, even illumination' },
  hard: { label: 'Hard Direct', prompt: 'Hard, direct lighting — defined shadows, high contrast, dramatic' },
  contrasty: { label: 'High Contrast', prompt: 'High contrast lighting — deep shadows, bright highlights, dramatic mood' },
  flat: { label: 'Flat Even', prompt: 'Flat, even lighting — minimal shadows, commercial look, maximum detail visibility' },
  moody: { label: 'Moody Low-Key', prompt: 'Low-key moody lighting — dark shadows, selective illumination, atmospheric' }
};

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER V3 CLASS
// ═══════════════════════════════════════════════════════════════

/**
 * PromptBuilderV3 - Builds structured prompts with 6 blocks
 */
export class PromptBuilderV3 {
  constructor() {
    // Block contents
    this.hardConstraints = [];
    this.photoRealism = {};
    this.visualIdentity = {};
    this.atmospheric = {};
    this.composition = {};
    this.qualityGates = [];
    
    // Raw analyses
    this.modelAnalysis = null;
    this.clothingAnalyses = [];
    
    // Configuration
    this.config = {
      aspectRatio: '3:4',
      imageSize: '2K'
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 1: HARD CONSTRAINTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Set technical requirements
   */
  setTechnicalRequirements(aspectRatio, imageSize) {
    this.config.aspectRatio = aspectRatio || '3:4';
    this.config.imageSize = imageSize || '2K';
    
    this.hardConstraints.push('TECHNICAL REQUIREMENTS:');
    this.hardConstraints.push(`  Output format: ${aspectRatio} aspect ratio`);
    this.hardConstraints.push(`  Quality: ${imageSize} resolution`);
    
    return this;
  }

  /**
   * Add base photorealism rules
   */
  addPhotorealismRules() {
    this.hardConstraints.push('\nPHOTOREALISM (NON-NEGOTIABLE):');
    this.hardConstraints.push('  - Generate a REAL PHOTOGRAPH, not illustration or CGI');
    this.hardConstraints.push('  - Natural skin texture with visible pores');
    this.hardConstraints.push('  - Believable fabric behavior and physics');
    this.hardConstraints.push('  - Real optical characteristics (DOF, lens artifacts)');
    this.hardConstraints.push('  - No watermarks, text overlays, or logos');
    this.hardConstraints.push('  - No AI artifacts (extra fingers, melted features, etc.)');
    
    return this;
  }

  /**
   * Set identity lock from analysis
   */
  setIdentityLock(modelAnalysis, strength = 'strict') {
    this.modelAnalysis = modelAnalysis;
    
    if (strength === 'strict') {
      const instructions = buildIdentityLockInstructions(modelAnalysis);
      this.hardConstraints.push('\n' + instructions);
    } else if (strength === 'medium') {
      const narrative = buildNarrativeDescription(modelAnalysis);
      this.hardConstraints.push('\nIDENTITY (MEDIUM LOCK):');
      this.hardConstraints.push(`  The person should match: ${narrative}`);
      this.hardConstraints.push('  Preserve key facial features but allow some variation.');
    } else if (strength === 'soft') {
      const narrative = buildNarrativeDescription(modelAnalysis);
      this.hardConstraints.push('\nIDENTITY (SOFT LOCK):');
      this.hardConstraints.push(`  Similar appearance to: ${narrative}`);
    }
    
    return this;
  }

  /**
   * Set clothing lock from analyses
   */
  setClothingLock(clothingAnalyses) {
    this.clothingAnalyses = clothingAnalyses || [];
    
    if (clothingAnalyses.length > 0) {
      this.hardConstraints.push('\nCLOTHING LOCK (MUST MATCH EXACTLY):');
      
      clothingAnalyses.forEach((analysis, idx) => {
        const instructions = buildPreservationInstructions(analysis);
        this.hardConstraints.push(`\n[GARMENT ${idx + 1}]`);
        this.hardConstraints.push(instructions);
      });
    }
    
    return this;
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 2: PHOTO REALISM (Camera & Optical)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Set camera body
   */
  setCamera(cameraId) {
    const camera = CAMERA_BODIES[cameraId];
    if (camera) {
      this.photoRealism.camera = camera;
    }
    return this;
  }

  /**
   * Set lens focal length
   */
  setLens(lensId) {
    const lens = LENS_TYPES[lensId];
    if (lens) {
      this.photoRealism.lens = lens;
    }
    return this;
  }

  /**
   * Set aperture
   */
  setAperture(apertureId) {
    const aperture = APERTURE_VALUES[apertureId];
    if (aperture) {
      this.photoRealism.aperture = aperture;
    }
    return this;
  }

  /**
   * Set film type
   */
  setFilmType(filmId) {
    const film = FILM_TYPES[filmId];
    if (film) {
      this.photoRealism.film = film;
    }
    return this;
  }

  /**
   * Set shutter speed
   */
  setShutterSpeed(speed) {
    this.photoRealism.shutterSpeed = speed;
    return this;
  }

  /**
   * Set ISO
   */
  setISO(iso) {
    this.photoRealism.iso = iso;
    return this;
  }

  /**
   * Use virtual camera settings
   */
  setVirtualCamera(config) {
    this.photoRealism.virtualCamera = config;
    return this;
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 3: VISUAL IDENTITY (Model & Clothing)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Set model description
   */
  setModelDescription(description) {
    this.visualIdentity.modelDescription = description;
    return this;
  }

  /**
   * Set clothing descriptions
   */
  setClothingDescriptions(descriptions) {
    this.visualIdentity.clothingDescriptions = descriptions || [];
    return this;
  }

  /**
   * Set styling notes
   */
  setStyling(styling) {
    this.visualIdentity.styling = styling;
    return this;
  }

  /**
   * Set hair and makeup
   */
  setHairMakeup(hairMakeup) {
    this.visualIdentity.hairMakeup = hairMakeup;
    return this;
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 4: ATMOSPHERIC (Environment & Lighting)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Set location
   */
  setLocation(location) {
    this.atmospheric.location = location;
    return this;
  }

  /**
   * Set lighting setup
   */
  setLightingSetup(setupId) {
    const setup = LIGHTING_SETUPS[setupId];
    if (setup) {
      this.atmospheric.lightingSetup = setup;
    }
    return this;
  }

  /**
   * Set lighting quality
   */
  setLightingQuality(qualityId) {
    const quality = LIGHTING_QUALITIES[qualityId];
    if (quality) {
      this.atmospheric.lightingQuality = quality;
    }
    return this;
  }

  /**
   * Set time of day
   */
  setTimeOfDay(time) {
    this.atmospheric.timeOfDay = time;
    return this;
  }

  /**
   * Set weather
   */
  setWeather(weather) {
    this.atmospheric.weather = weather;
    return this;
  }

  /**
   * Set mood/aesthetic
   */
  setMood(mood) {
    this.atmospheric.mood = mood;
    return this;
  }

  /**
   * Set color temperature
   */
  setColorTemperature(temp) {
    this.atmospheric.colorTemperature = temp;
    return this;
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 5: COMPOSITION (Framing & Pose)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Set shot size
   */
  setShotSize(size) {
    const sizes = {
      extreme_closeup: 'EXTREME CLOSE-UP — Eyes, lips, or specific detail fills frame',
      closeup: 'CLOSE-UP — Face fills frame, shoulders may be cropped',
      medium_closeup: 'MEDIUM CLOSE-UP — Head and shoulders, classic portrait',
      medium: 'MEDIUM SHOT — Waist up, body language visible',
      cowboy: 'AMERICAN SHOT — Knees up, full gesture visible',
      full: 'FULL SHOT — Entire body head to toe',
      wide: 'WIDE SHOT — Subject smaller in frame, environment prominent'
    };
    
    this.composition.shotSize = sizes[size] || size;
    return this;
  }

  /**
   * Set camera angle
   */
  setCameraAngle(angle) {
    const angles = {
      eye_level: 'EYE LEVEL — Camera at subject\'s eye height, neutral perspective',
      slightly_high: 'SLIGHTLY HIGH — Camera slightly above eye level, subtle vulnerable feel',
      high: 'HIGH ANGLE — Looking down on subject, diminishing or vulnerable',
      slightly_low: 'SLIGHTLY LOW — Camera below eye level, subtle empowerment',
      low: 'LOW ANGLE — Looking up at subject, heroic and powerful',
      dutch: 'DUTCH ANGLE — Tilted horizon, dynamic tension, unease'
    };
    
    this.composition.cameraAngle = angles[angle] || angle;
    return this;
  }

  /**
   * Set pose type
   */
  setPoseType(poseType) {
    this.composition.poseType = poseType;
    return this;
  }

  /**
   * Set pose description
   */
  setPoseDescription(description) {
    this.composition.poseDescription = description;
    return this;
  }

  /**
   * Set hand placement
   */
  setHandPlacement(placement) {
    this.composition.handPlacement = placement;
    return this;
  }

  /**
   * Set gaze direction
   */
  setGazeDirection(direction) {
    const gazes = {
      camera: 'Looking directly at camera — engaging and confrontational',
      away: 'Looking away from camera — contemplative, candid feel',
      down: 'Eyes cast downward — introspective, vulnerable',
      up: 'Looking upward — hopeful, dramatic',
      over_shoulder: 'Looking over shoulder at camera — flirtatious, mysterious'
    };
    
    this.composition.gazeDirection = gazes[direction] || direction;
    return this;
  }

  /**
   * Set focus point
   */
  setFocusPoint(point) {
    this.composition.focusPoint = point || 'eyes';
    return this;
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 6: QUALITY GATES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Add quality verification checklist
   */
  addQualityGates() {
    this.qualityGates = [
      'QUALITY VERIFICATION CHECKLIST:',
      '✓ Same person as reference (facial recognition match)',
      '✓ Clothing matches reference exactly (color, structure, details)',
      '✓ Photorealistic quality (no AI artifacts)',
      '✓ Correct exposure and focus',
      '✓ Proper anatomy (correct number of fingers, natural proportions)',
      '✓ Lighting physics are correct (shadows match light direction)',
      '✓ No text, watermarks, or logos',
      '',
      'If ANY check fails, the image is REJECTED.'
    ];
    
    return this;
  }

  /**
   * Set acceptance threshold
   */
  setAcceptanceThreshold(threshold) {
    this.qualityGates.push(`\nAcceptance threshold: ${threshold}`);
    return this;
  }

  // ═══════════════════════════════════════════════════════════════
  // OUTPUT METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Build complete prompt object
   */
  build() {
    return {
      version: 'v3',
      timestamp: new Date().toISOString(),
      config: this.config,
      blocks: {
        hardConstraints: this.hardConstraints,
        photoRealism: this.photoRealism,
        visualIdentity: this.visualIdentity,
        atmospheric: this.atmospheric,
        composition: this.composition,
        qualityGates: this.qualityGates
      },
      analyses: {
        model: this.modelAnalysis,
        clothing: this.clothingAnalyses
      }
    };
  }

  /**
   * Convert to JSON string
   */
  toJSON() {
    return JSON.stringify(this.build(), null, 2);
  }

  /**
   * Convert to readable text format for Gemini
   */
  toText() {
    const sections = [];

    // Block 1: Hard Constraints
    if (this.hardConstraints.length > 0) {
      sections.push('═══════════════════════════════════════════════════════════════');
      sections.push('BLOCK 1: HARD CONSTRAINTS (HIGHEST PRIORITY)');
      sections.push('═══════════════════════════════════════════════════════════════');
      sections.push(this.hardConstraints.join('\n'));
    }

    // Block 2: Photo Realism
    sections.push('\n═══════════════════════════════════════════════════════════════');
    sections.push('BLOCK 2: PHOTO REALISM (Camera & Optical)');
    sections.push('═══════════════════════════════════════════════════════════════');
    
    if (this.photoRealism.camera) {
      sections.push(`\nCAMERA: ${this.photoRealism.camera.label}`);
      sections.push(this.photoRealism.camera.prompt);
    }
    if (this.photoRealism.lens) {
      sections.push(`\nLENS: ${this.photoRealism.lens.label}`);
      sections.push(this.photoRealism.lens.prompt);
    }
    if (this.photoRealism.aperture) {
      sections.push(`\nAPERTURE: ${this.photoRealism.aperture.label}`);
      sections.push(this.photoRealism.aperture.prompt);
    }
    if (this.photoRealism.film) {
      sections.push(`\nFILM/COLOR PROFILE: ${this.photoRealism.film.label}`);
      sections.push(this.photoRealism.film.prompt);
    }
    if (this.photoRealism.shutterSpeed) {
      sections.push(`\nSHUTTER SPEED: ${this.photoRealism.shutterSpeed}`);
    }
    if (this.photoRealism.iso) {
      sections.push(`\nISO: ${this.photoRealism.iso}`);
    }
    if (this.photoRealism.virtualCamera) {
      sections.push('\n' + buildVirtualCameraPrompt(this.photoRealism.virtualCamera));
    }

    // Block 3: Visual Identity
    sections.push('\n═══════════════════════════════════════════════════════════════');
    sections.push('BLOCK 3: VISUAL IDENTITY (Model & Clothing)');
    sections.push('═══════════════════════════════════════════════════════════════');
    
    if (this.visualIdentity.modelDescription) {
      sections.push(`\nMODEL: ${this.visualIdentity.modelDescription}`);
    }
    if (this.visualIdentity.clothingDescriptions?.length > 0) {
      sections.push('\nCLOTHING:');
      this.visualIdentity.clothingDescriptions.forEach((desc, i) => {
        sections.push(`  ${i + 1}. ${desc}`);
      });
    }
    if (this.visualIdentity.styling) {
      sections.push(`\nSTYLING: ${this.visualIdentity.styling}`);
    }
    if (this.visualIdentity.hairMakeup) {
      sections.push(`\nHAIR & MAKEUP: ${this.visualIdentity.hairMakeup}`);
    }

    // Block 4: Atmospheric
    sections.push('\n═══════════════════════════════════════════════════════════════');
    sections.push('BLOCK 4: ATMOSPHERIC (Environment & Lighting)');
    sections.push('═══════════════════════════════════════════════════════════════');
    
    if (this.atmospheric.location) {
      sections.push(`\nLOCATION: ${this.atmospheric.location}`);
    }
    if (this.atmospheric.lightingSetup) {
      sections.push(`\nLIGHTING SETUP: ${this.atmospheric.lightingSetup.label}`);
      sections.push(this.atmospheric.lightingSetup.prompt);
    }
    if (this.atmospheric.lightingQuality) {
      sections.push(`\nLIGHTING QUALITY: ${this.atmospheric.lightingQuality.label}`);
      sections.push(this.atmospheric.lightingQuality.prompt);
    }
    if (this.atmospheric.timeOfDay) {
      sections.push(`\nTIME OF DAY: ${this.atmospheric.timeOfDay}`);
    }
    if (this.atmospheric.weather) {
      sections.push(`\nWEATHER: ${this.atmospheric.weather}`);
    }
    if (this.atmospheric.mood) {
      sections.push(`\nMOOD/AESTHETIC: ${this.atmospheric.mood}`);
    }
    if (this.atmospheric.colorTemperature) {
      sections.push(`\nCOLOR TEMPERATURE: ${this.atmospheric.colorTemperature}`);
    }

    // Block 5: Composition
    sections.push('\n═══════════════════════════════════════════════════════════════');
    sections.push('BLOCK 5: COMPOSITION (Framing & Pose)');
    sections.push('═══════════════════════════════════════════════════════════════');
    
    if (this.composition.shotSize) {
      sections.push(`\nSHOT SIZE: ${this.composition.shotSize}`);
    }
    if (this.composition.cameraAngle) {
      sections.push(`\nCAMERA ANGLE: ${this.composition.cameraAngle}`);
    }
    if (this.composition.poseType) {
      sections.push(`\nPOSE TYPE: ${this.composition.poseType}`);
    }
    if (this.composition.poseDescription) {
      sections.push(`\nPOSE DESCRIPTION: ${this.composition.poseDescription}`);
    }
    if (this.composition.handPlacement) {
      sections.push(`\nHAND PLACEMENT: ${this.composition.handPlacement}`);
    }
    if (this.composition.gazeDirection) {
      sections.push(`\nGAZE: ${this.composition.gazeDirection}`);
    }
    if (this.composition.focusPoint) {
      sections.push(`\nFOCUS POINT: ${this.composition.focusPoint}`);
    }

    // Block 6: Quality Gates
    if (this.qualityGates.length > 0) {
      sections.push('\n═══════════════════════════════════════════════════════════════');
      sections.push('BLOCK 6: QUALITY GATES (Verification)');
      sections.push('═══════════════════════════════════════════════════════════════');
      sections.push(this.qualityGates.join('\n'));
    }

    return sections.join('\n');
  }

  /**
   * Validate for conflicts
   */
  validateConflicts() {
    const conflicts = [];
    const warnings = [];

    // Check identity + no model analysis
    if (this.hardConstraints.some(c => c.includes('IDENTITY')) && !this.modelAnalysis) {
      warnings.push('Identity lock enabled but no model analysis provided');
    }

    // Check clothing lock + no analyses
    if (this.hardConstraints.some(c => c.includes('CLOTHING')) && this.clothingAnalyses.length === 0) {
      warnings.push('Clothing lock enabled but no clothing analyses provided');
    }

    // Check incompatible camera + film combinations
    if (this.photoRealism.camera?.id === 'iphone_15_pro' && this.photoRealism.film?.id !== 'digital_clean') {
      warnings.push('iPhone selected with film emulation — may look inconsistent');
    }

    // Check extreme close-up + full body pose
    if (this.composition.shotSize?.includes('EXTREME CLOSE-UP') && 
        this.composition.poseDescription?.toLowerCase().includes('full body')) {
      conflicts.push('Extreme close-up shot cannot show full body');
    }

    return {
      valid: conflicts.length === 0,
      conflicts,
      warnings
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new PromptBuilderV3 instance
 */
export function createPromptBuilderV3() {
  return new PromptBuilderV3();
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
  CAMERA_BODIES,
  LENS_TYPES,
  APERTURE_VALUES,
  FILM_TYPES,
  LIGHTING_SETUPS,
  LIGHTING_QUALITIES
};

export default PromptBuilderV3;

