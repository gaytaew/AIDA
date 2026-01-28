/**
 * Pose Schema — Pose Presets for V8 Frame Settings
 * 
 * Принципы:
 * - ~20 поз с группировкой по типу
 * - Атмосферные описания (как в эмоциях)
 * - Упор на естественность и anti-performative подход
 * 
 * Структура категорий:
 * - standing: Стоящие позы
 * - sitting: Сидящие позы
 * - dynamic: Движение, действие
 * - reclining: Полулежащие и лежащие
 * - leaning: Опирающиеся позы
 */

// ═══════════════════════════════════════════════════════════════
// POSE CATEGORIES
// ═══════════════════════════════════════════════════════════════

export const POSE_CATEGORIES = [
    { id: 'standing', label: '🧍 Стоящие', description: 'Позы стоя' },
    { id: 'sitting', label: '🪑 Сидящие', description: 'Позы сидя' },
    { id: 'dynamic', label: '⚡ Динамичные', description: 'Движение и действие' },
    { id: 'reclining', label: '🛋️ Лежащие', description: 'Полулежащие и лежащие' },
    { id: 'leaning', label: '📐 Опирающиеся', description: 'С опорой на поверхность' }
];

// ═══════════════════════════════════════════════════════════════
// GLOBAL ANTI-PERFORMATIVE RULES
// ═══════════════════════════════════════════════════════════════

export const GLOBAL_POSE_RULES = [
    'Pose should look NATURAL, not STAGED',
    'Allow natural weight distribution and asymmetry',
    'Hands should be doing something natural or relaxed',
    'No "mannequin" or catalog-stiff poses',
    'Micro-movements and imperfection are good'
];

// ═══════════════════════════════════════════════════════════════
// POSE PRESETS
// ═══════════════════════════════════════════════════════════════

export const POSE_PRESETS = {

    // ─────────────────────────────────────────────────────────────
    // 🧍 STANDING — Стоящие позы
    // ─────────────────────────────────────────────────────────────

    'relaxed_standing': {
        id: 'relaxed_standing',
        category: 'standing',
        label: 'Расслабленная стойка',
        shortDescription: 'Непринуждённая поза, вес на одной ноге',

        bodyPrompt: `Standing casually with weight shifted to one leg, hip slightly tilted. 
Arms hang naturally or one hand rests in pocket. 
The natural stance of someone waiting, not performing for camera.`,

        avoid: ['T-pose', 'Stiff symmetrical stance', 'Arms akimbo', 'Attention pose'],
        physicalHints: 'Weight on one leg. Slight hip tilt. Relaxed shoulders.',
        defaultAdherence: 2
    },

    'contrapposto': {
        id: 'contrapposto',
        category: 'standing',
        label: 'Контрапост',
        shortDescription: 'Классическая S-образная поза',

        bodyPrompt: `Classical contrapposto stance — weight on one leg creates 
natural S-curve through the body. Shoulders and hips at opposing angles. 
The elegance of Renaissance sculpture, but natural and unforced.`,

        avoid: ['Exaggerated curves', 'Stiff posture', 'Symmetrical stance'],
        physicalHints: 'Hip pushed out on weight-bearing side. Opposite shoulder slightly higher.',
        defaultAdherence: 3
    },

    'power_stance': {
        id: 'power_stance',
        category: 'standing',
        label: 'Уверенная стойка',
        shortDescription: 'Широкая постановка ног, уверенность',

        bodyPrompt: `Confident stance with feet shoulder-width apart or slightly wider.
Weight evenly distributed, grounded presence. Arms may be crossed or hands on hips.
The posture of someone who owns the space they're in.`,

        avoid: ['Aggressive pose', 'Closed defensive posture', 'Slouching'],
        physicalHints: 'Feet apart. Chest open. Chin level or slightly raised.',
        defaultAdherence: 2
    },

    'casual_hands_pockets': {
        id: 'casual_hands_pockets',
        category: 'standing',
        label: 'Руки в карманах',
        shortDescription: 'Непринуждённость, городской стиль',

        bodyPrompt: `Hands casually tucked into pockets — front, back, or jacket pockets.
Creates relaxed, approachable energy. Shoulders may be slightly forward.
The easy confidence of street style photography.`,

        avoid: ['Tense shoulders', 'Fists clenched in pockets', 'Hunched posture'],
        physicalHints: 'Thumbs may hook on pocket edges. Relaxed arm angle.',
        defaultAdherence: 2
    },

    'model_walk_pause': {
        id: 'model_walk_pause',
        category: 'standing',
        label: 'Остановка на подиуме',
        shortDescription: 'Замершая модель после шага',

        bodyPrompt: `The moment a model pauses mid-stride on a runway.
One foot slightly forward, weight transitioning, body still carrying momentum.
Captured between steps — dynamic but frozen.`,

        avoid: ['Static pose', 'Awkward mid-step', 'Off-balance look'],
        physicalHints: 'One leg forward. Torso angled. Arms in natural walking position.',
        defaultAdherence: 3
    },

    // ─────────────────────────────────────────────────────────────
    // 🪑 SITTING — Сидящие позы
    // ─────────────────────────────────────────────────────────────

    'casual_sit': {
        id: 'casual_sit',
        category: 'sitting',
        label: 'Непринуждённо сидя',
        shortDescription: 'Расслабленная поза на стуле или диване',

        bodyPrompt: `Sitting casually as if at home or in a café. Not perfectly upright — 
some slouch or lean. One leg may be crossed or tucked.
The natural way someone sits when not being observed.`,

        avoid: ['Interview posture', 'Perching on edge', 'Stiff spine'],
        physicalHints: 'Weight sinks into seat. Back may touch backrest at angle.',
        defaultAdherence: 2
    },

    'cross_legged_floor': {
        id: 'cross_legged_floor',
        category: 'sitting',
        label: 'По-турецки',
        shortDescription: 'Скрестив ноги на полу',

        bodyPrompt: `Sitting cross-legged on the floor or low surface.
Hands may rest on knees or be doing something.
Grounded, comfortable, slightly intimate positioning.`,

        avoid: ['Perfect lotus', 'Stiff upright spine', 'Hands on knees like meditation'],
        physicalHints: 'Comfortable slouch allowed. Knees at natural height.',
        defaultAdherence: 2
    },

    'perched_edge': {
        id: 'perched_edge',
        category: 'sitting',
        label: 'На краю',
        shortDescription: 'Присев на край поверхности',

        bodyPrompt: `Perched on the edge of a chair, table, or ledge — not fully settled.
Ready to stand, engaged, forward-leaning energy.
The posture of someone about to leave or just arrived.`,

        avoid: ['Lounging back', 'Fully seated', 'Gripping edge'],
        physicalHints: 'Only part of body weight on surface. Feet may be braced.',
        defaultAdherence: 2
    },

    'elegant_sit': {
        id: 'elegant_sit',
        category: 'sitting',
        label: 'Элегантно сидя',
        shortDescription: 'Изящная поза со скрещенными ногами',

        bodyPrompt: `Elegant seated position with legs crossed at knee or ankle.
Spine naturally elongated, shoulders back but not tense.
The poised grace of old Hollywood or fashion editorial.`,

        avoid: ['Stiff formal posture', 'Legs spread wide', 'Hunching'],
        physicalHints: 'Ankles together or crossed. Hands placed gracefully.',
        defaultAdherence: 3
    },

    // ─────────────────────────────────────────────────────────────
    // ⚡ DYNAMIC — Движение и действие
    // ─────────────────────────────────────────────────────────────

    'walking': {
        id: 'walking',
        category: 'dynamic',
        label: 'В движении',
        shortDescription: 'Идущая модель, естественный шаг',

        bodyPrompt: `Captured mid-walk — one foot forward, arms in natural swing.
Not a frozen pose but actual movement caught by camera.
The fluidity of someone going somewhere with purpose.`,

        avoid: ['Exaggerated runway stomp', 'Stiff marching', 'Static with lifted foot'],
        physicalHints: 'Arms counter-swing to legs. Torso faces direction of movement.',
        defaultAdherence: 3
    },

    'turning': {
        id: 'turning',
        category: 'dynamic',
        label: 'Оборачивается',
        shortDescription: 'Момент поворота, взгляд через плечо',

        bodyPrompt: `Caught in the act of turning — body facing one direction, 
head turned back toward camera. Creates natural tension in spine.
The moment just before or after something catches attention.`,

        avoid: ['Exaggerated twist', 'Owl-like head turn', 'Stiff rotation'],
        physicalHints: 'Shoulders begin to follow head. One foot may pivot.',
        defaultAdherence: 3
    },

    'hair_touch': {
        id: 'hair_touch',
        category: 'dynamic',
        label: 'Касается волос',
        shortDescription: 'Рука у волос, естественный жест',

        bodyPrompt: `Hand naturally touching, adjusting, or running through hair.
Not a posed beauty gesture but a genuine moment of self-touch.
Could be tucking hair behind ear, brushing it back, or gathering it.`,

        avoid: ['Fake hair flip', 'Pulling hair', 'Staged beauty shot hand'],
        physicalHints: 'Elbow at natural angle. Fingers relaxed in hair.',
        defaultAdherence: 2
    },

    'adjusting_clothes': {
        id: 'adjusting_clothes',
        category: 'dynamic',
        label: 'Поправляет одежду',
        shortDescription: 'Застёгивает, расправляет, надевает',

        bodyPrompt: `In the act of adjusting clothing — buttoning, unbuttoning, 
straightening a collar, pulling down a hem. A moment of preparation or 
transition, not a finished pose.`,

        avoid: ['Stripping', 'Staged dressing', 'Awkward hand placement'],
        physicalHints: 'Hands actively engaged with fabric. Eyes may look down.',
        defaultAdherence: 2
    },

    // ─────────────────────────────────────────────────────────────
    // 🛋️ RECLINING — Полулежащие и лежащие
    // ─────────────────────────────────────────────────────────────

    'lounging': {
        id: 'lounging',
        category: 'reclining',
        label: 'Полулёжа',
        shortDescription: 'Расслабленно откинувшись',

        bodyPrompt: `Lounging back on a couch, bed, or surface — half-sitting, half-lying.
Completely at ease, taking up space. One arm may drape over furniture.
The posture of Sunday afternoon relaxation.`,

        avoid: ['Stiff reclining', 'Provocative positioning', 'Falling off surface'],
        physicalHints: 'Weight supported by surface. Legs may extend or bend.',
        defaultAdherence: 2
    },

    'lying_side': {
        id: 'lying_side',
        category: 'reclining',
        label: 'Лёжа на боку',
        shortDescription: 'На боку, голова на руке или подушке',

        bodyPrompt: `Lying on one side, head may rest on arm or pillow.
Body creates natural curved line. Relaxed and comfortable — 
the pose of someone reading in bed or daydreaming.`,

        avoid: ['Pinup pose', 'Stiff side-lying', 'Unnatural head angle'],
        physicalHints: 'Top arm may rest on hip or surface ahead. Legs may be stacked or bent.',
        defaultAdherence: 2
    },

    // ─────────────────────────────────────────────────────────────
    // 📐 LEANING — Опирающиеся позы
    // ─────────────────────────────────────────────────────────────

    'wall_lean': {
        id: 'wall_lean',
        category: 'leaning',
        label: 'У стены',
        shortDescription: 'Опираясь спиной или плечом на стену',

        bodyPrompt: `Leaning against a wall — shoulder, back, or side. 
Weight partly supported by the surface. Creates relaxed, urban energy.
The cool nonchalance of waiting or watching.`,

        avoid: ['Pushed flat against wall', 'Sliding down wall', 'Arms spread on wall'],
        physicalHints: 'One shoulder or back contacts wall. Feet may be away from base.',
        defaultAdherence: 2
    },

    'leaning_forward': {
        id: 'leaning_forward',
        category: 'leaning',
        label: 'Наклон вперёд',
        shortDescription: 'Опираясь руками на поверхность',

        bodyPrompt: `Leaning forward onto a table, railing, or surface.
Hands or elbows support weight, torso tilts down.
Creates intimacy and engagement with something ahead.`,

        avoid: ['Collapsing forward', 'Stiff arms', 'Face too close to surface'],
        physicalHints: 'Spine curves naturally. Head may be up or looking at surface.',
        defaultAdherence: 2
    },

    'elbow_rest': {
        id: 'elbow_rest',
        category: 'leaning',
        label: 'Локоть на поверхности',
        shortDescription: 'Опираясь локтем на стол или колено',

        bodyPrompt: `One elbow rests on a surface — table, armrest, or own knee.
Creates asymmetry and relaxed engagement. Head may rest on hand or just nearby.
The natural pose of conversation or contemplation.`,

        avoid: ['Elbow digging in', 'Head fully on hand', 'Both elbows symmetric'],
        physicalHints: 'One side lower than other. Fingers may be near face.',
        defaultAdherence: 2
    }
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get pose by ID
 */
export function getPoseById(poseId) {
    return POSE_PRESETS[poseId] || null;
}

/**
 * Get all poses as array
 */
export function getAllPoses() {
    return Object.values(POSE_PRESETS);
}

/**
 * Get poses by category
 */
export function getPosesByCategory(categoryId) {
    return Object.values(POSE_PRESETS).filter(p => p.category === categoryId);
}

/**
 * Build pose prompt for generation
 * @param {string} poseId - Pose preset ID
 * @param {number} adherence - 1-4 scale (1=loose inspiration, 4=strict match)
 * @returns {string} Formatted pose prompt
 */
export function buildPosePrompt(poseId, adherence = 2) {
    const pose = getPoseById(poseId);
    if (!pose) return '';

    const adherenceMap = {
        1: 'Use as loose inspiration — allow significant variation.',
        2: 'Follow the general idea — natural adjustments welcome.',
        3: 'Match closely — minor variations only.',
        4: 'Match exactly as described.'
    };

    const avoidStr = pose.avoid?.length > 0
        ? `\nAVOID: ${pose.avoid.join(', ')}`
        : '';

    return `
═══════════════════════════════════════════════════════════════
BODY POSE: ${pose.label.toUpperCase()}
═══════════════════════════════════════════════════════════════

${pose.bodyPrompt}

${pose.physicalHints ? `Physical cues: ${pose.physicalHints}` : ''}
${avoidStr}

ADHERENCE: ${adherence}/4 — ${adherenceMap[adherence] || adherenceMap[2]}
`;
}

/**
 * Get pose options for frontend dropdown (grouped by category)
 */
export function getPoseOptions() {
    const categories = POSE_CATEGORIES.map(cat => ({
        ...cat,
        poses: getPosesByCategory(cat.id).map(p => ({
            id: p.id,
            label: p.label,
            shortDescription: p.shortDescription
        }))
    }));

    return {
        categories,
        poses: getAllPoses().map(p => ({
            id: p.id,
            category: p.category,
            label: p.label,
            shortDescription: p.shortDescription
        })),
        rules: GLOBAL_POSE_RULES
    };
}
