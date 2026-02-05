function slugifyId(text) {
    const s = String(text || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    if (!s) return null;
    return s.slice(0, 60);
}

function safeText(v, fallback = '') {
    if (v === null || v === undefined) return fallback;
    const s = String(v).trim();
    return s || fallback;
}

function pickUniverseFromAnalysis(analysis) {
    const tech = safeText(analysis?.J_texture_carrier?.summary || analysis?.meta?.anti_ai_summary || 'real camera, imperfect exposure, natural DR');
    const era = safeText(analysis?.B_idea?.reference_dna || analysis?.C_world_sociology?.era || 'contemporary editorial');
    const color = safeText(analysis?.I_color?.palette_summary || analysis?.I_color?.dominant || analysis?.meta?.uniqueness_notes || 'controlled palette with intentional WB collisions');
    const lens = safeText(analysis?.G_camera_optics?.lens_summary || analysis?.G_camera_optics?.focal_range || 'wide/normal mix, real DOF');
    const mood = safeText(analysis?.B_idea?.thesis || analysis?.D_character_behavior?.emotional_range || analysis?.meta?.anti_ai_summary || 'documentary truth with editorial intent');
    return { tech, era, color, lens, mood };
}

function shotToScenePreset(shot, idx) {
    const role = safeText(shot?.role || `scene_${idx + 1}`);
    const space = safeText(shot?.world?.location || shot?.description || 'space');
    const lighting = safeText(shot?.light?.recipe || shot?.light?.sources || shot?.light || 'light recipe');
    const camera = safeText(
        shot?.camera
            ? JSON.stringify(shot.camera)
            : shot?.composition
                ? JSON.stringify(shot.composition)
                : 'camera + composition'
    );
    const poseBase = safeText(shot?.character?.pose_and_gesture || shot?.description || 'pose');
    const gaze = safeText(shot?.character?.gaze || '', '');
    const cameraContact = safeText(shot?.character?.camera_contact || '', '');
    const pose = [poseBase, gaze ? `gaze: ${gaze}` : null, cameraContact ? `camera_contact: ${cameraContact}` : null]
        .filter(Boolean)
        .join('; ');
    const emotion = safeText(shot?.character?.emotion || 'neutral editorial');
    const action = safeText(shot?.functional_difference_from_previous || shot?.description || 'moment');
    const clothingFocus = safeText(shot?.styling?.silhouette_strategy || shot?.styling?.material_drama || 'silhouette + texture readability');
    const texture = safeText(shot?.color_and_texture?.grain_and_defects || shot?.props_and_micro_realism?.traces_of_use || shot?.props_and_micro_realism || 'micro realism');

    return {
        id: `SCENE_${idx + 1}`,
        label: `Сцена ${idx + 1}`,
        role,
        space,
        lighting,
        camera,
        pose,
        emotion,
        action,
        clothingFocus,
        texture
    };
}

export function toCanonicalShoot({ analysis, series }) {
    const labelBase =
        safeText(series?.series_type, 'shoot').toLowerCase() === 'editorial'
            ? 'New Editorial'
            : safeText(series?.series_type, 'shoot').toLowerCase() === 'campaign'
                ? 'New Campaign'
                : 'New Catalog';

    const id =
        slugifyId(series?.series_title) ||
        slugifyId(series?.global_brief?.slice(0, 40)) ||
        `GEN_SHOOT_${Date.now()}`;

    const universe = pickUniverseFromAnalysis(analysis || {});

    const shots = Array.isArray(series?.shots) ? series.shots : [];
    const scenes = shots.map((shot, idx) => shotToScenePreset(shot, idx));

    return {
        id,
        label: safeText(series?.label || series?.title || labelBase),
        shortDescription: safeText(series?.global_brief || 'Съёмка, сгенерированная по референсам.', '').slice(0, 240),
        universe,
        scenes
    };
}
