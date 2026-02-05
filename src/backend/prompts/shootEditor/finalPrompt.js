function safeText(v, fallback = '') {
    if (v === null || v === undefined) return fallback;
    const s = String(v).trim();
    return s || fallback;
}

function joinLines(lines) {
    return lines.filter(Boolean).join('\n');
}

function formatUserNotes(analysis) {
    const notes = analysis?.user_notes || {};
    const attention = Array.isArray(notes.attention_points) ? notes.attention_points : [];
    const avoid = Array.isArray(notes.replace_or_avoid) ? notes.replace_or_avoid : [];
    const hard = Array.isArray(notes.hard_constraints) ? notes.hard_constraints : [];

    const blocks = [];
    if (hard.length) blocks.push('HARD CONSTRAINTS:\n- ' + hard.join('\n- '));
    if (attention.length) blocks.push('ATTENTION POINTS:\n- ' + attention.join('\n- '));
    if (avoid.length) blocks.push('REPLACE / AVOID:\n- ' + avoid.join('\n- '));
    return blocks.length ? blocks.join('\n\n') : '';
}

function formatAntiAi(analysis) {
    const anti = analysis?.anti_ai || {};
    const forbidden = Array.isArray(anti.hard_forbidden_phrases) ? anti.hard_forbidden_phrases : [];

    return joinLines([
        'ANTI-AI REALISM (CRITICAL):',
        safeText(anti.optics_exposure) ? `- Optics/exposure: ${safeText(anti.optics_exposure)}` : '- Optics/exposure: real camera logic, allow imperfect exposure.',
        safeText(anti.mixed_white_balance) ? `- Mixed WB: ${safeText(anti.mixed_white_balance)}` : '- Mixed WB: allow collisions (flash neutral + tungsten warm + dirty greens).',
        safeText(anti.micro_defects) ? `- Micro defects: ${safeText(anti.micro_defects)}` : '- Micro defects: pores, fabric weave, dust/scratches/fingerprints.',
        safeText(anti.caught_not_built_composition) ? `- “Caught” composition: ${safeText(anti.caught_not_built_composition)}` : '- “Caught” composition: slight tilt, imperfect verticals, natural crops.',
        safeText(anti.real_dof_focus) ? `- DOF/focus: ${safeText(anti.real_dof_focus)}` : '- DOF/focus: real DOF, allow micro misfocus, no perfect creamy blur everywhere.',
        safeText(anti.flares_reflections) ? `- Flares/reflections: ${safeText(anti.flares_reflections)}` : '- Flares/reflections: physically plausible only.',
        safeText(anti.motion_moment) ? `- Moment/motion: ${safeText(anti.motion_moment)}` : '- Moment/motion: micro-motion > pose; dragged shutter allowed with flash.',
        safeText(anti.film_scan_feel) ? `- Film/scan: ${safeText(anti.film_scan_feel)}` : '- Film/scan: grain as texture, rare random dust; not an overlay.',
        forbidden.length ? '' : null,
        forbidden.length ? 'FORBIDDEN PHRASES / VIBES:' : null,
        forbidden.length ? '- ' + forbidden.join('\n- ') : null
    ]);
}

function formatUniverseFromAnalysis(analysis) {
    // Keep in sync with shoot-editor generator fields.
    const tech =
        safeText(analysis?.J_texture_carrier?.summary) ||
        safeText(analysis?.meta?.anti_ai_summary) ||
        'Real camera capture, natural dynamic range, imperfect exposure, film/scan-like texture.';

    const era =
        safeText(analysis?.B_idea?.reference_dna) ||
        safeText(analysis?.C_world_sociology?.era) ||
        safeText(analysis?.A_format_purpose?.editorial_vs_campaign) ||
        'Contemporary fashion editorial language (no direct copying).';

    const color =
        safeText(analysis?.I_color?.palette_summary) ||
        safeText(analysis?.I_color?.dominant) ||
        '2–5 color palette, controlled contrast, intentional WB collisions, believable skin tone policy.';

    const lens =
        safeText(analysis?.G_camera_optics?.lens_summary) ||
        safeText(analysis?.G_camera_optics?.focal_range) ||
        'Wide/normal lens behavior, real DOF (f/2.8–f/4 feel), occasional slight tilt/handheld.';

    const mood =
        safeText(analysis?.B_idea?.thesis) ||
        safeText(analysis?.D_character_behavior?.emotional_range) ||
        safeText(analysis?.A_format_purpose?.purpose) ||
        'Editorial truth: documentary tension with fashion intent.';

    return { tech, era, color, lens, mood };
}

function formatSeriesRules(seriesType) {
    const t = String(seriesType || '').toLowerCase();
    if (t === 'campaign') {
        return joinLines([
            'SERIES STRUCTURE (CAMPAIGN):',
            '- 2–3 hero frames (same emotion, only distance/angle/secondary parameters change)',
            '- 2 hero variations (each must change at least 2: distance, angle, motion, light)',
            '- 2 context/lifestyle frames (space/action)',
            '- 1–2 detail/texture frames',
            '- 1 quiet frame',
            'Rule: no 5 almost identical frames in a row.'
        ]);
    }
    if (t === 'catalog') {
        return joinLines([
            'SERIES STRUCTURE (CATALOG):',
            '- front, 3/4, profile, light motion, seated/support (if suitable)',
            'Rule: keep light/camera/background/color/mood fixed; only micro pose changes.'
        ]);
    }
    return joinLines([
        'SERIES STRUCTURE (EDITORIAL):',
        '- 10 frames:',
        '  - 2 architecture/environment dominant (model secondary)',
        '  - 2 intimate distance',
        '  - 2 motion/transition',
        '  - 2 static pause',
        '  - 1 action peak (single peak)',
        '  - 1 closing silence',
        'Rules:',
        '- no more than 2 frames with same distance',
        '- no more than 2 frames with same camera angle',
        '- no more than 1 symmetrical frame',
        '- at least 3 frames where model does not dominate'
    ]);
}

function formatScenesFromShots(series) {
    const shots = Array.isArray(series?.shots) ? series.shots : [];
    if (!shots.length) return '';

    const lines = ['SCENES (MINIMUM REQUIRED FIELDS FOR YOUR JSON GENERATOR):'];

    shots.forEach((s, i) => {
        const idx = i + 1;
        const role = safeText(s?.role, `scene_${idx}`);
        const space = safeText(s?.world?.location || s?.description, '');
        const lighting = safeText(s?.light?.recipe || (s?.light && typeof s.light === 'string' ? s.light : ''), '');
        const camera = safeText(s?.camera ? JSON.stringify(s.camera) : '');
        const poseBase = safeText(s?.character?.pose_and_gesture || '', '');
        const gaze = safeText(s?.character?.gaze || '', '');
        const cameraContact = safeText(s?.character?.camera_contact || '', '');
        const pose = [poseBase, gaze ? `gaze: ${gaze}` : null, cameraContact ? `camera_contact: ${cameraContact}` : null]
            .filter(Boolean)
            .join('; ');
        const emotion = safeText(s?.character?.emotion || '', 'neutral editorial');
        const action = safeText(s?.functional_difference_from_previous || s?.description || '', '');
        const clothingFocus = safeText(s?.styling?.silhouette_strategy || s?.styling?.material_drama || '', '');
        const texture = safeText(s?.color_and_texture?.grain_and_defects || s?.props_and_micro_realism?.traces_of_use || '', '');

        lines.push(
            joinLines([
                '',
                `Scene ${idx}:`,
                `- role: ${role}`,
                space ? `- space: ${space}` : null,
                lighting ? `- lighting: ${lighting}` : null,
                camera ? `- camera: ${camera}` : null,
                pose ? `- pose: ${pose}` : null,
                `- emotion: ${emotion}`,
                action ? `- action: ${action}` : null,
                clothingFocus
                    ? `- clothingFocus: ${clothingFocus} (no specific garment items, only silhouette/structure/texture focus)`
                    : '- clothingFocus: silhouette/structure/texture focus (no garment item listing)',
                texture ? `- texture: ${texture}` : null
            ])
        );
    });

    return lines.join('\n');
}

export function buildFinalPromptForShootEditor({ analysis, series }) {
    const universe = formatUniverseFromAnalysis(analysis || {});
    const userNotesBlock = formatUserNotes(analysis || {});
    const antiAiBlock = formatAntiAi(analysis || {});
    const seriesType = safeText(series?.series_type || series?.seriesType || 'editorial', 'editorial');
    const seriesRules = formatSeriesRules(seriesType);
    const globalBrief = safeText(series?.global_brief, '');

    return joinLines([
        'Сгенерируй модную съёмку и верни СТРОГО валидный JSON по структуре проекта (как в генераторе из промпта):',
        '- id, label, shortDescription',
        '- universe: tech, era, color, lens, mood (все строки)',
        '- scenes[]: id, label, role, space, lighting, camera, pose, emotion, action, clothingFocus, texture (все строки)',
        '',
        'ВАЖНО:',
        '- Пиши по-русски, но допускай английские термины в фото-лексике (flash, tungsten, WB split).',
        '- НЕ перечисляй конкретные элементы одежды типа “dress/jacket/coat/shirt…”. clothingFocus — только про силуэт/объём/структуру/текстуру и “куда смотреть”.',
        '- Не делай стерильную ИИ‑картинку: допускай реальные несовершенства и физичный свет.',
        '- Поза/лицо/поведение: обязательна живость и искренность. Для каждой сцены задай конкретный микрожест/микродействие (перенос веса, полушаг, поправил рукав/ремешок, взгляд на объект, короткая пауза).',
        '- Запрещено: одинаковый “пустой модельный взгляд” везде, театральные позы, манекенная статика.',
        '',
        antiAiBlock,
        '',
        userNotesBlock ? 'USER NOTES (apply with priority):\n' + userNotesBlock : null,
        '',
        'UNIVERSE (фиксируется для всей серии):',
        `- tech: ${universe.tech}`,
        `- era: ${universe.era}`,
        `- color: ${universe.color}`,
        `- lens: ${universe.lens}`,
        `- mood: ${universe.mood}`,
        '',
        'UNIVERSE OBJECTS:',
        JSON.stringify(universe, null, 2),
        '',
        globalBrief ? `GLOBAL BRIEF (idea):\n${globalBrief}` : null,
        '',
        seriesRules,
        '',
        formatScenesFromShots(series || {})
    ]);
}
