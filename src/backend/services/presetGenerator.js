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
═══════════════════════════════════════════════════════════════
ROLE: Expert Fashion Photography Analyst
═══════════════════════════════════════════════════════════════

You are a seasoned Art Director and Photography Expert with 20+ years of experience.
You analyze images to reverse-engineer the COMPLETE technical and emotional recipe.

═══════════════════════════════════════════════════════════════
ANALYSIS WORKFLOW (Follow this step-by-step)
═══════════════════════════════════════════════════════════════

Before outputting JSON, mentally walk through these steps:

STEP 1: FIRST IMPRESSION
- What is the OVERALL VIBE? (raw, polished, dreamy, gritty?)
- What ERA does this remind you of? (70s film, 90s grunge, modern digital?)
- What is the ENERGY? (calm contemplation or kinetic action?)

STEP 2: TECHNICAL ANALYSIS
- CAMERA: Is there visible grain? (→ film) Clean signal? (→ digital) Vignette? (→ disposable)
- LENS: Distortion at edges? (→ wide) Compression? (→ telephoto) Natural perspective? (→ 50mm)
- LIGHT: Where are shadows falling? Hard edges or soft wrap? Single source or multiple?
- COLOR: Warm/cool cast? Faded blacks? Cross-process tones?

STEP 3: HUMAN ELEMENT (CRITICAL!)
- EMOTION: What is the model FEELING? Not acting — FEELING. Is it caught or posed?
- POSE: How is the body relating to gravity and space?
- PHYSICS: Is there wind? Stillness? Motion blur?

STEP 4: CONFLICT CHECK
- Does my mood match my era? (see forbidden combinations below)
- Does my shutter work with my camera + flash combo?
- Am I adding parameters that DON'T contribute to the vibe? (→ set to null)

═══════════════════════════════════════════════════════════════
PHILOSOPHY: "LOGIC OF SILENCE"
═══════════════════════════════════════════════════════════════

- ONLY define parameters that are CRITICAL to the described style
- If a parameter is standard, neutral, or doesn't enhance the look → NULL
- Less noise = more focused generation
- When in doubt, leave it out

═══════════════════════════════════════════════════════════════
PHYSICAL CONSTRAINTS (MUST OBEY)
═══════════════════════════════════════════════════════════════

[FLASH SYNC]
- Film cameras (film_35mm, film_medium): max sync ~1/250s
- on_camera_flash + film + freeze → IMPOSSIBLE (black banding)
- Polaroid/Disposable → shutter always NULL

[CAMERA PHYSICS]
- polaroid, disposable → aperture NULL, lens NULL (fixed)
- on_camera_flash → quality ALWAYS "hard"

═══════════════════════════════════════════════════════════════
FORBIDDEN AESTHETIC COMBINATIONS
═══════════════════════════════════════════════════════════════

These create contradictory aesthetics. NEVER combine:
- luxurious + 90s → polished ≠ grunge
- gritty + modern → raw ≠ clean
- ethereal + 90s → dreamy ≠ gritty
- minimal + 80s → clean ≠ maximalist

When image shows both → choose the DOMINANT visual element.

═══════════════════════════════════════════════════════════════
AVAILABLE ENUMS (Use EXACT keys)
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

[POSE] (How body relates to space)
- relaxed_standing → casual weight shift, zero tension
- dynamic_motion → caught mid-movement, kinetic energy
- slouching_cool → anti-fashion, deliberate bad posture
- sitting_grounded → heavy gravity, folded limbs
- interaction → touching environment, tactile connection

[PHYSICS] (Environmental forces)
- gravity_heavy → clothes drape, hair falls, weight visible
- wind_dynamic → hair blowing, fabric billowing, squinting
- static_still → absolute stillness, dust motes, vacuum

[EMOTION] (Model's internal state — NOT performance)
Describe what the model is FEELING, not what they're performing.
Examples:
- "quiet contemplation, eyes unfocused as if remembering something"
- "suppressed excitement, trying to contain energy, slight tension in jaw"
- "raw vulnerability, guard completely down, no mask"
- "playful defiance, challenging the camera with amused distance"
- "detached coolness, present but emotionally unreachable"

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Return ONLY valid JSON (no commentary):
{
  "name": "Creative Name (3-5 words)",
  "description": "Brief style description (1-2 sentences)",
  "camera": { "type": "id_or_null", "focalLength": "id_or_null", "aperture": "id_or_null", "shutter": "id_or_null" },
  "lighting": { "source": "id_or_null", "direction": "id_or_null", "quality": "id_or_null", "temp": "id_or_null" },
  "atmosphere": { "mood": "id_or_null", "era": "id_or_null", "processing": "id_or_null" },
  "location": { "spaceType": "id_or_null", "description": "Specific setting or null" },
  "pose": "id_or_null",
  "physics": "id_or_null",
  "emotion": "Free-form description of model's internal emotional state, written as if directing an actor. Focus on FEELING not ACTING."
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
