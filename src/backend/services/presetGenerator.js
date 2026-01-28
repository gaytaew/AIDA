/**
 * Shoot Preset Generator Service
 * 
 * Handles AI generation of presets (Text-to-Preset and Vision-to-Preset).
 * Implements "Logic of Silence" and "Physical Consistency" checks.
 */

import {
    PRESET_CAMERA_TYPES,
    PRESET_LENSES,
    PRESET_APERTURES,
    PRESET_SHUTTERS,
    PRESET_LIGHT_SOURCES,
    PRESET_LIGHT_DIRECTIONS,
    PRESET_LIGHT_QUALITY,
    PRESET_LIGHT_TEMP,
    PRESET_MOODS,
    PRESET_ERAS,
    PRESET_PROCESSING,
    PRESET_SPACE_TYPES
} from '../schema/shootPreset.js';

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

function buildPresetSystemPrompt() {
    return `
    You are a Minimalist AI Art Director and Photography Expert.
    Your goal is to configure a 'Shoot Preset' based on a user's request or image analysis.
    
    CRITICAL PHILOSOPHY: "LOGIC OF SILENCE"
    - DO NOT define every parameter.
    - ONLY define parameters that are CRITICAL to the described style.
    - If a parameter is standard, neutral, or irrelevant, set it to NULL.
    - Null parameters will be excluded from the prompt to avoid noise.
    
    ═══════════════════════════════════════════════════════════════
    PHYSICAL CONSTRAINTS (MUST OBEY)
    ═══════════════════════════════════════════════════════════════
    
    [FLASH SYNC RULES]
    Film cameras (film_35mm, film_medium) have flash sync speed ~1/250s max.
    - If using on_camera_flash with film camera → shutter MUST be null or motion_blur
    - NEVER combine on_camera_flash + film camera + freeze shutter (causes black banding)
    - Polaroid and Disposable have fixed shutter → always set shutter to null
    
    [CAMERA CONSTRAINTS]
    - polaroid, disposable → fixed aperture, fixed lens (set to null)
    - on_camera_flash → quality is ALWAYS "hard" (physics of point source)
    
    [LIGHTING PHYSICS]
    - on_camera_flash → direction is typically "front"
    - natural_sun in "studio" is unusual (studios use artificial light)
    
    ═══════════════════════════════════════════════════════════════
    FORBIDDEN AESTHETIC COMBINATIONS
    ═══════════════════════════════════════════════════════════════
    
    These mood + era combinations create contradictory aesthetics. AVOID THEM:
    
    - luxurious + 90s → CONFLICT (90s = raw grunge heroin chic, luxurious = polished expensive)
    - gritty + modern → CONFLICT (modern = clean sharp, gritty = dirty raw)
    - ethereal + 90s → CONFLICT (90s = gritty grunge, ethereal = dreamy soft)
    - minimal + 80s → CONFLICT (80s = maximalist saturated, minimal = reduced clean)
    
    If the image suggests BOTH conflicting elements, PREFER the more visually dominant one.
    
    ═══════════════════════════════════════════════════════════════
    AVAILABLE ENUMS (Use these keys exactly)
    ═══════════════════════════════════════════════════════════════
    
    [CAMERA]
    Types: ${Object.keys(PRESET_CAMERA_TYPES).join(', ')}
    Lenses: ${Object.keys(PRESET_LENSES).join(', ')}
    Apertures: ${Object.keys(PRESET_APERTURES).join(', ')}
    Shutters: ${Object.keys(PRESET_SHUTTERS).join(', ')}
    
    [LIGHTING]
    Sources: ${Object.keys(PRESET_LIGHT_SOURCES).join(', ')}
    Directions: ${Object.keys(PRESET_LIGHT_DIRECTIONS).join(', ')}
    Quality: ${Object.keys(PRESET_LIGHT_QUALITY).join(', ')}
    Temps: ${Object.keys(PRESET_LIGHT_TEMP).join(', ')}
    
    [ATMOSPHERE]
    Moods: ${Object.keys(PRESET_MOODS).join(', ')}
    Eras: ${Object.keys(PRESET_ERAS).join(', ')}
    Processing: ${Object.keys(PRESET_PROCESSING).join(', ')}
    
    [LOCATION]
    Space Types: ${Object.keys(PRESET_SPACE_TYPES).join(', ')}
    
    ═══════════════════════════════════════════════════════════════
    OUTPUT FORMAT
    ═══════════════════════════════════════════════════════════════
    
    Return a strictly valid JSON object:
    {
      "name": "Short Creative Name (3-5 words)",
      "description": "Brief description of the visual style",
      "camera": { "type": "id_or_null", "focalLength": "id_or_null", "aperture": "id_or_null", "shutter": "id_or_null" },
      "lighting": { "source": "id_or_null", "direction": "id_or_null", "quality": "id_or_null", "temp": "id_or_null" },
      "atmosphere": { "mood": "id_or_null", "era": "id_or_null", "processing": "id_or_null" },
      "location": { "spaceType": "id_or_null", "description": "Specific setting description (or null)" }
    }
  `;
}

// ═══════════════════════════════════════════════════════════════
// CONFLICT MATRICES
// ═══════════════════════════════════════════════════════════════

// MOOD ↔ ERA Compatibility Matrix
// Some moods are incompatible with certain eras
const MOOD_ERA_CONFLICTS = {
    // Luxurious (polished, expensive) conflicts with raw/grunge eras
    luxurious: ['90s'], // 90s = heroin chic, grunge, raw

    // Gritty/raw conflicts with polished eras
    gritty: ['modern'], // modern = clean, sharp, polished

    // Ethereal (dreamy) conflicts with gritty eras
    ethereal: ['90s'], // 90s grunge is opposite of dreamy

    // Minimal (clean) conflicts with chaotic eras
    minimal: ['80s'], // 80s = high saturation, maximalist
};

// Flash Sync Speed Constraints
// Film cameras have physical flash sync limitations
const FLASH_SYNC_RULES = {
    // Cameras with flash sync limitations
    film_35mm: { maxShutterWithFlash: 'motion_blur' }, // 1/60-1/250s max
    film_medium: { maxShutterWithFlash: 'motion_blur' },
    polaroid: { maxShutterWithFlash: null }, // No shutter control
    disposable: { maxShutterWithFlash: null }, // No shutter control

    // Digital cameras can do HSS
    high_end_digital: { maxShutterWithFlash: 'freeze' }, // HSS allows fast shutter
    vintage_digital: { maxShutterWithFlash: 'motion_blur' }
};

// ═══════════════════════════════════════════════════════════════
// PHYSICS ENGINE (Enhanced Validation)
// ═══════════════════════════════════════════════════════════════

function validatePhysicalConsistency(preset) {
    const p = JSON.parse(JSON.stringify(preset)); // Deep copy
    const logs = [];      // Auto-fixes applied
    const warnings = [];  // Conflicts detected but NOT auto-fixed (for UI)

    // ─────────────────────────────────────────────────────────────
    // 1. CAMERA PHYSICS
    // ─────────────────────────────────────────────────────────────
    if (p.camera?.type && PRESET_CAMERA_TYPES[p.camera.type]) {
        const camPhysics = PRESET_CAMERA_TYPES[p.camera.type].physics || {};

        // Fixed Aperture Cameras (Disposable, Polaroid)
        if (camPhysics.fixedAperture && p.camera.aperture) {
            logs.push(`🔧 Removed Aperture (${p.camera.aperture}) — ${p.camera.type} has fixed aperture`);
            p.camera.aperture = null;
        }

        // Fixed Lens Cameras
        if (camPhysics.fixedLens && p.camera.focalLength) {
            logs.push(`🔧 Removed Lens (${p.camera.focalLength}) — ${p.camera.type} has fixed lens`);
            p.camera.focalLength = null;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. FLASH SYNC SPEED VALIDATION
    // ─────────────────────────────────────────────────────────────
    const usesFlash = p.lighting?.source === 'on_camera_flash';
    const hasCamera = p.camera?.type;
    const hasShutter = p.camera?.shutter;

    if (usesFlash && hasCamera && hasShutter) {
        const flashRules = FLASH_SYNC_RULES[p.camera.type];

        if (flashRules) {
            // Check if shutter is faster than flash sync allows
            if (hasShutter === 'freeze' && flashRules.maxShutterWithFlash !== 'freeze') {
                warnings.push({
                    type: 'flash_sync',
                    severity: 'high',
                    message: `⚠️ Flash Sync Conflict: ${p.camera.type} with flash cannot use 1/1000s shutter. Physical limit is ~1/250s. This would cause black banding.`,
                    suggestion: 'Remove shutter speed or use digital camera for HSS'
                });
                // Auto-fix: remove shutter or set to motion_blur
                logs.push(`🔧 Removed fast Shutter — ${p.camera.type} flash sync limit exceeded`);
                p.camera.shutter = null;
            }

            // Fixed shutter cameras (polaroid, disposable)
            if (flashRules.maxShutterWithFlash === null && hasShutter) {
                logs.push(`🔧 Removed Shutter — ${p.camera.type} has fixed shutter`);
                p.camera.shutter = null;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. LIGHTING PHYSICS
    // ─────────────────────────────────────────────────────────────
    if (p.lighting?.source === 'on_camera_flash') {
        // Flash is physically hard light
        if (p.lighting.quality && p.lighting.quality !== 'hard') {
            logs.push(`🔧 Forced Light Quality to Hard — on-camera flash produces hard light`);
            p.lighting.quality = 'hard';
        }

        // Flash is frontal by default
        if (!p.lighting.direction) {
            p.lighting.direction = 'front';
        }
    }

    // Natural sun in studio is suspicious
    if (p.location?.spaceType === 'studio' && p.lighting?.source === 'natural_sun') {
        warnings.push({
            type: 'location_light',
            severity: 'medium',
            message: `⚠️ Natural Sun in Studio: Studios typically use artificial light. "natural_sun" may produce unexpected results.`,
            suggestion: 'Use "studio_strobe" or change location'
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. MOOD ↔ ERA COMPATIBILITY
    // ─────────────────────────────────────────────────────────────
    const mood = p.atmosphere?.mood;
    const era = p.atmosphere?.era;

    if (mood && era && MOOD_ERA_CONFLICTS[mood]) {
        const conflictingEras = MOOD_ERA_CONFLICTS[mood];
        if (conflictingEras.includes(era)) {
            warnings.push({
                type: 'mood_era',
                severity: 'high',
                message: `⚠️ Aesthetic Conflict: "${mood}" mood conflicts with "${era}" era. These are opposing aesthetics.`,
                suggestion: getMoodEraFix(mood, era)
            });
            // DO NOT auto-fix — this is a creative choice
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. ATMOSPHERE COHERENCE
    // ─────────────────────────────────────────────────────────────
    if (p.atmosphere?.mood === 'gritty') {
        // Gritty implies high contrast
        if (p.atmosphere.processing === 'bw_soft') {
            logs.push(`🔧 Forced Processing to High Contrast — gritty mood requires contrast`);
            p.atmosphere.processing = 'bw_high_contrast';
        }
    }

    if (p.atmosphere?.mood === 'ethereal') {
        // Ethereal implies soft processing
        if (p.atmosphere.processing === 'bw_high_contrast') {
            logs.push(`🔧 Forced Processing to Soft B&W — ethereal mood requires softness`);
            p.atmosphere.processing = 'bw_soft';
        }
    }

    return { preset: p, logs, warnings };
}

// Helper: Suggest fix for mood/era conflict
function getMoodEraFix(mood, era) {
    const fixes = {
        'luxurious+90s': 'For 90s vibe: try "gritty" or "melancholic" mood. For luxury: try "modern" or "y2k" era.',
        'gritty+modern': 'For modern vibe: try "minimal" or "luxurious" mood. For gritty: try "90s" era.',
        'ethereal+90s': 'For 90s vibe: try "melancholic" mood. For ethereal: try "modern" or "70s" era.',
        'minimal+80s': 'For 80s vibe: try "euphoric" mood. For minimal: try "modern" era.'
    };
    return fixes[`${mood}+${era}`] || 'Consider adjusting mood or era for aesthetic coherence.';
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
    buildPresetSystemPrompt,
    validatePhysicalConsistency
};
