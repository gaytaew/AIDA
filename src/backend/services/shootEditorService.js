import { requestJsonFromOpenAI, requestShootFromPrompt } from '../providers/openaiClient.js';
import { buildAnalysisSystemPrompt, buildAnalysisUserPrompt } from '../prompts/shootEditor/analysisPrompt.js';
import { buildSeriesSystemPrompt, buildSeriesUserPrompt } from '../prompts/shootEditor/seriesPrompt.js';
import { buildFinalPromptForShootEditor } from '../prompts/shootEditor/finalPrompt.js';
import { toCanonicalShoot } from '../prompts/shootEditor/toCanonicalShoot.js';
import { buildEditSystemPrompt, buildEditUserPrompt } from '../prompts/shootEditor/editPrompt.js';

// ---- VALIDATION HELPERS (Internal) ----
function validateAnalysisShape(analysis) {
    if (!analysis || typeof analysis !== 'object') return { ok: false, errors: ['Not an object'] };
    // Basic check for MVP structure
    if (!analysis.analysis_text && !analysis.meta) {
        return { ok: false, errors: ['Missing analysis_text or meta'] };
    }
    return { ok: true };
}

function validateSeriesShape(series) {
    if (!series || typeof series !== 'object') return { ok: false, errors: ['Not an object'] };
    if (!Array.isArray(series.shots)) {
        return { ok: false, errors: ['Missing shots array'] };
    }
    return { ok: true };
}

// ---- SERVICE METHODS ----

/**
 * Step 1: Analyze Reference Images
 */
export async function requestShootAnalysisFromRefs({
    format,
    realism,
    experiment,
    userNotes,
    referenceImages
}) {
    const system = buildAnalysisSystemPrompt();
    const user = buildAnalysisUserPrompt({ format, realism, experiment, userNotes });

    // Assuming AIDA's openaiClient supports 'images' array in this format
    const resp = await requestJsonFromOpenAI({
        system,
        user,
        images: referenceImages,
        temperature: 0.35,
        maxTokens: 8192
    });

    if (!resp.ok) return { ok: false, error: resp.error };

    const analysis = resp.json || null;
    const validation = validateAnalysisShape(analysis);
    if (!validation.ok) {
        return { ok: false, error: `Invalid analysis structure: ${validation.errors.join('; ')}` };
    }

    // Stamp meta fields
    if (analysis && analysis.meta) {
        analysis.meta.format = format;
        analysis.meta.realism_level = realism;
        analysis.meta.experiment_level = experiment;
    }
    if (analysis && analysis.user_notes) {
        analysis.user_notes.raw = String(userNotes || '');
    }

    return { ok: true, analysis };
}

/**
 * Step 2: Generate Series from Analysis
 */
export async function requestShootSeriesFromAnalysis({
    format,
    realism,
    experiment,
    userNotes,
    analysis
}) {
    const system = buildSeriesSystemPrompt();
    const user = buildSeriesUserPrompt({ format, realism, experiment, userNotes, analysis });

    const resp = await requestJsonFromOpenAI({
        system,
        user,
        images: [], // No images for this step, just text analysis context
        temperature: 0.55,
        maxTokens: 8192
    });

    if (!resp.ok) return { ok: false, error: resp.error };

    const series = resp.json || null;
    const validation = validateSeriesShape(series);
    if (!validation.ok) {
        return { ok: false, error: `Invalid series structure: ${validation.errors.join('; ')}` };
    }

    // Override final_prompt to ensure it matches strict editor expectations
    series.final_prompt = buildFinalPromptForShootEditor({ analysis, series });

    // Build canonical shoot object
    const shoot = toCanonicalShoot({ analysis, series });

    return { ok: true, series, shoot };
}

/**
 * Generate Shoot from Prompt (Legacy/Quick Mode)
 */
export async function generateShootFromPrompt(userPrompt) {
    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
        return {
            success: false,
            errors: ['Prompt cannot be empty']
        };
    }

    try {
        const result = await requestShootFromPrompt(userPrompt);

        if (!result.ok) {
            return {
                success: false,
                errors: [result.error || 'Shoot generation error']
            };
        }

        return {
            success: true,
            shoot: result.shoot
        };
    } catch (error) {
        console.error('Error generating shoot from prompt:', error);
        return {
            success: false,
            errors: [`Generation error: ${error.message}`]
        };
    }
}

/**
 * Edit existing shoot via Prompt
 */
export async function requestShootEdit({ currentShoot, editPrompt }) {
    if (!currentShoot || typeof currentShoot !== 'object') {
        return { ok: false, error: 'Invalid currentShoot object' };
    }
    if (!editPrompt || typeof editPrompt !== 'string' || !editPrompt.trim()) {
        return { ok: false, error: 'Edit prompt cannot be empty' };
    }

    const system = buildEditSystemPrompt();
    const user = buildEditUserPrompt({ currentShoot, editPrompt });

    try {
        const resp = await requestJsonFromOpenAI({
            system,
            user,
            images: [],
            temperature: 0.45,
            maxTokens: 8192
        });

        if (!resp.ok) return { ok: false, error: resp.error };

        const updatedShoot = resp.json;
        if (!updatedShoot || typeof updatedShoot !== 'object') {
            return { ok: false, error: 'AI returned invalid JSON structure' };
        }

        // Basic sanity check - ensure necessary fields persist if accidentally dropped
        if (!updatedShoot.id) updatedShoot.id = currentShoot.id;

        return { ok: true, shoot: updatedShoot };

    } catch (error) {
        console.error('Error in requestShootEdit:', error);
        return { ok: false, error: error.message };
    }
}
