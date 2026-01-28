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
    
    AVAILABLE ENUMS (Use these keys exactly):
    
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
    
    OUTPUT FORMAT:
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
// PHYSICS ENGINE (CONFLICT DATA)
// ═══════════════════════════════════════════════════════════════

function validatePhysicalConsistency(preset) {
    const p = JSON.parse(JSON.stringify(preset)); // Deep copy
    const logs = [];

    // CAMERA LOGIC
    if (p.camera?.type) {
        const camType = PRESET_CAMERA_TYPES[p.camera.type].physics;

        // Fixed Aperture Cameras (Disposable, Polaroid)
        if (camType.fixedAperture && p.camera.aperture) {
            logs.push(`Removed Aperture ${p.camera.aperture} for camera ${p.camera.type}`);
            p.camera.aperture = null;
        }

        // Fixed Lens Cameras
        if (camType.fixedLens && p.camera.focalLength) {
            logs.push(`Removed Lens ${p.camera.focalLength} for camera ${p.camera.type}`);
            p.camera.focalLength = null;
        }
    }

    // LIGHTING LOGIC
    if (p.location?.spaceType === 'studio') {
        // Studio has no weather or time logic (managed by light source)
        if (p.lighting?.source === 'natural_sun' && !p.lighting?.direction) {
            // Allow natural sun in studio ONLY if it implies windows, but strictly studo usually means artificial
            // For safety, let's just warn or allow user override
        }
    }

    if (p.lighting?.source === 'on_camera_flash') {
        // Flash is usually hard
        if (p.lighting.quality !== 'hard') {
            p.lighting.quality = 'hard';
            logs.push('Forced Light Quality to Hard for On-Camera Flash');
        }
    }

    // ATMOSPHERE LOGIC
    if (p.atmosphere?.mood === 'gritty') {
        // Gritty implies contrast
        if (p.atmosphere.processing === 'bw_soft') {
            p.atmosphere.processing = 'bw_high_contrast';
            logs.push('Forced Processing to High Contrast for Gritty mood');
        }
    }

    return { preset: p, logs };
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
    buildPresetSystemPrompt,
    validatePhysicalConsistency
};
