
import presetGenerator from './services/presetGenerator.js';
import { PRESET_CAMERA_TYPES } from './schema/shootPreset.js';

console.log("🧪 STARTING PRESET LOGIC VERIFICATION...\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        failed++;
    }
}

// 1. VERIFY PHYSICS LOGIC (Disposable Camera)
const brokenPreset1 = {
    name: "Broken Disposable",
    camera: {
        type: "disposable",
        aperture: "f1.4", // CONFLICT: Disposable is fixed aperture
        focalLength: "85mm" // CONFLICT: Disposable is fixed lens
    },
    lighting: { source: "natural_window" }
};

const fixed1 = presetGenerator.validatePhysicalConsistency(brokenPreset1).preset;

assert(fixed1.camera.type === "disposable", "Camera type preserved");
assert(fixed1.camera.aperture === null, "Fixed Aperture enforced (set to null)");
assert(fixed1.camera.focalLength === null, "Fixed Lens enforced (set to null)");

// 2. VERIFY PHYSICS LOGIC (On-Camera Flash)
const brokenPreset2 = {
    name: "Soft Flash",
    lighting: {
        source: "on_camera_flash",
        quality: "soft" // CONFLICT: Flash is hard
    }
};

const fixed2 = presetGenerator.validatePhysicalConsistency(brokenPreset2).preset;

assert(fixed2.lighting.source === "on_camera_flash", "Light source preserved");
assert(fixed2.lighting.quality === "hard", "Flash quality forced to 'hard'");

// 3. VERIFY SYSTEM PROMPT (Logic of Silence)
const prompt = presetGenerator.buildPresetSystemPrompt();

assert(prompt.includes("LOGIC OF SILENCE"), "System prompt contains 'LOGIC OF SILENCE' instruction");
assert(prompt.includes("set it to NULL"), "System prompt instructs to set irrelevant params to NULL");
assert(prompt.includes("OUTPUT FORMAT"), "System prompt defines Output Format");

// 4. VERIFY SCHEMA CONSTANTS
assert(PRESET_CAMERA_TYPES['disposable'].physics.fixedLens === true, "Disposable Schema has fixedLens=true");

console.log(`\n🎉 DONE. Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) process.exit(1);
