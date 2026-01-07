/**
 * Emotion Schema
 * 
 * Detailed emotion presets for shoot generation.
 * Each emotion has a detailed description for AI prompts.
 */

// ═══════════════════════════════════════════════════════════════
// EMOTION CATEGORIES
// ═══════════════════════════════════════════════════════════════

export const EMOTION_CATEGORIES = [
  'joy',        // Радость
  'calm',       // Спокойствие
  'power',      // Сила/уверенность
  'mystery',    // Загадочность
  'playful',    // Игривость
  'sensual',    // Чувственность
  'melancholy', // Меланхолия
  'intense'     // Интенсивность
];

// ═══════════════════════════════════════════════════════════════
// EMOTION PRESETS — Детальные описания
// ═══════════════════════════════════════════════════════════════

export const EMOTION_PRESETS = {
  // ─────────────────────────────────────────────────────────────
  // JOY — Радость
  // ─────────────────────────────────────────────────────────────
  'joy_laugh_exhale': {
    id: 'joy_laugh_exhale',
    category: 'joy',
    label: 'Смех на выдохе',
    shortDescription: 'Искренний смех, пойманный между вдохом и выдохом',
    promptBlock: `Genuine laugh caught between inhale and exhale. Open mouth with visible teeth, 
eyes squinted almost closed, crow's feet at corners. Head slightly tilted back or to the side. 
Shoulders relaxed and slightly raised from the laugh. The moment just before the sound escapes — 
pure joy without performance. Natural, unforced, as if someone just said something hilarious.`,
    bodyLanguage: 'Shoulders up, chest open, possibly leaning back slightly',
    eyeDirection: 'squinted, looking at nothing specific',
    mouthState: 'open, teeth visible, genuine smile lines',
    energy: 'high',
    authenticity: 'candid'
  },
  
  'joy_sun_squint': {
    id: 'joy_sun_squint',
    category: 'joy',
    label: 'Прищур от солнца',
    shortDescription: 'Тёплый прищур с полуулыбкой, как от яркого солнца',
    promptBlock: `Warm squint with half-smile, as if looking into bright sun. Eyes narrowed but 
not closed, fine lines visible at corners. Slight upturn at mouth corners — not a full smile, 
but contentment. Face relaxed, chin slightly lifted. The expression of someone enjoying warmth 
on their face, peaceful and present in the moment.`,
    bodyLanguage: 'Chin slightly up, neck exposed, relaxed shoulders',
    eyeDirection: 'narrowed, looking slightly upward',
    mouthState: 'soft half-smile, lips together or slightly parted',
    energy: 'medium',
    authenticity: 'natural'
  },
  
  'joy_mischief': {
    id: 'joy_mischief',
    category: 'joy',
    label: 'Озорство',
    shortDescription: 'Хитрая улыбка, как будто знает секрет',
    promptBlock: `Mischievous grin — knowing something others don't. One corner of mouth raised 
higher than the other, asymmetrical smile. Eyes bright and alert, slightly narrowed with a 
spark of playfulness. Eyebrows may be slightly raised on one side. The look of someone about 
to pull a prank or share a secret. Confidence mixed with playfulness.`,
    bodyLanguage: 'Slight lean forward, shoulders relaxed but ready',
    eyeDirection: 'direct, slightly narrowed, conspiratorial',
    mouthState: 'asymmetrical smile, one corner higher',
    energy: 'medium-high',
    authenticity: 'performative-playful'
  },

  // ─────────────────────────────────────────────────────────────
  // CALM — Спокойствие
  // ─────────────────────────────────────────────────────────────
  'calm_serene': {
    id: 'calm_serene',
    category: 'calm',
    label: 'Безмятежность',
    shortDescription: 'Полное спокойствие, почти медитативное',
    promptBlock: `Complete serenity, almost meditative state. Face completely relaxed, no tension 
in jaw or forehead. Eyes soft, possibly half-closed or with a distant gaze. Lips naturally 
resting, neither smiling nor frowning. Breathing appears slow and deep. The expression of 
someone at complete peace, present but detached from worldly concerns.`,
    bodyLanguage: 'Completely relaxed, weight settled, no fidgeting',
    eyeDirection: 'soft, unfocused or gently closed',
    mouthState: 'neutral, lips slightly parted, relaxed jaw',
    energy: 'low',
    authenticity: 'natural'
  },
  
  'calm_thoughtful': {
    id: 'calm_thoughtful',
    category: 'calm',
    label: 'Задумчивость',
    shortDescription: 'Глубокая мысль, взгляд в себя',
    promptBlock: `Deep in thought, gaze turned inward. Eyes focused on middle distance or looking 
slightly down. Slight furrow between brows — concentration, not worry. Lips may be slightly 
pursed or touching. The look of someone processing an idea or memory, present physically but 
mentally elsewhere. Intelligent, introspective stillness.`,
    bodyLanguage: 'Still, possibly chin resting on hand, slight lean',
    eyeDirection: 'unfocused, middle distance or downward',
    mouthState: 'neutral to slightly pursed',
    energy: 'low-medium',
    authenticity: 'natural'
  },

  // ─────────────────────────────────────────────────────────────
  // POWER — Сила/Уверенность
  // ─────────────────────────────────────────────────────────────
  'power_commanding': {
    id: 'power_commanding',
    category: 'power',
    label: 'Властность',
    shortDescription: 'Абсолютная уверенность и контроль',
    promptBlock: `Absolute confidence and control. Direct, unwavering gaze — not aggressive but 
unquestionable. Chin level or slightly raised, neck long. Jaw set but not clenched. Eyes 
fully open, alert, commanding attention without demanding it. The expression of someone who 
knows their worth and expects others to recognize it. Natural authority.`,
    bodyLanguage: 'Straight spine, shoulders back, taking up space',
    eyeDirection: 'direct, level, unblinking',
    mouthState: 'closed, lips together, slight tension',
    energy: 'high',
    authenticity: 'performative'
  },
  
  'power_defiant': {
    id: 'power_defiant',
    category: 'power',
    label: 'Вызов',
    shortDescription: 'Дерзкий взгляд, готовность к противостоянию',
    promptBlock: `Defiant, challenging gaze. Chin slightly raised, looking down the nose. Eyes 
intense, slightly narrowed — a dare. One eyebrow may be raised. Lips pressed together or 
curved in a slight smirk. The expression of someone who won't back down, who welcomes 
confrontation. Youthful rebellion mixed with unshakeable self-belief.`,
    bodyLanguage: 'Weight on back foot, chin up, arms may be crossed or on hips',
    eyeDirection: 'challenging, looking down slightly',
    mouthState: 'smirk or pressed lips',
    energy: 'high',
    authenticity: 'performative'
  },
  
  'power_quiet_strength': {
    id: 'power_quiet_strength',
    category: 'power',
    label: 'Тихая сила',
    shortDescription: 'Уверенность без демонстрации',
    promptBlock: `Quiet, grounded strength — nothing to prove. Relaxed face with alert eyes. 
Gaze steady but not aggressive. Mouth relaxed, hint of a knowing smile. The expression of 
someone who could handle anything but doesn't need to show it. Understated power, the kind 
that comes from genuine self-knowledge.`,
    bodyLanguage: 'Grounded stance, relaxed but ready, economical movement',
    eyeDirection: 'steady, calm, observant',
    mouthState: 'relaxed, possible hint of smile',
    energy: 'medium',
    authenticity: 'natural'
  },

  // ─────────────────────────────────────────────────────────────
  // MYSTERY — Загадочность
  // ─────────────────────────────────────────────────────────────
  'mystery_enigmatic': {
    id: 'mystery_enigmatic',
    category: 'mystery',
    label: 'Загадка',
    shortDescription: 'Невозможно прочитать, держит секреты',
    promptBlock: `Impossible to read, keeping secrets. Face deliberately neutral but not blank — 
there's something behind the eyes. Slight asymmetry in expression suggests hidden thoughts. 
Gaze that seems to see through you while revealing nothing. Mona Lisa ambiguity — is it a 
smile or not? The expression of someone with layers of meaning beneath the surface.`,
    bodyLanguage: 'Still, contained, minimal gestures',
    eyeDirection: 'direct but unreadable',
    mouthState: 'ambiguous, slight curve that could be anything',
    energy: 'low-medium',
    authenticity: 'performative'
  },
  
  'mystery_distant': {
    id: 'mystery_distant',
    category: 'mystery',
    label: 'Отстранённость',
    shortDescription: 'Взгляд куда-то далеко, недоступность',
    promptBlock: `Gazing somewhere far away, unreachable. Eyes focused on infinite distance, 
seeing something invisible to others. Face relaxed but disconnected from the present moment. 
Slight melancholy or wonder in the expression. The look of someone in their own world, 
physically present but emotionally elsewhere. Ethereal, untouchable.`,
    bodyLanguage: 'Turned slightly away, dreamy posture',
    eyeDirection: 'far distance, unfocused on anything near',
    mouthState: 'softly parted or neutral',
    energy: 'low',
    authenticity: 'natural'
  },

  // ─────────────────────────────────────────────────────────────
  // PLAYFUL — Игривость
  // ─────────────────────────────────────────────────────────────
  'playful_flirty': {
    id: 'playful_flirty',
    category: 'playful',
    label: 'Флирт',
    shortDescription: 'Игривый взгляд через плечо',
    promptBlock: `Playful, flirtatious glance. Looking over shoulder or from under lashes. 
One corner of mouth lifted in a teasing smile. Eyes bright, inviting, with a spark of 
mischief. Head may be tilted, exposing neck. The look that says "catch me if you can" — 
confident, playful, knowing exactly the effect being created.`,
    bodyLanguage: 'Turned away but looking back, exposed shoulder or neck',
    eyeDirection: 'sideways glance, through lashes',
    mouthState: 'teasing smile, lips may be slightly bitten',
    energy: 'medium-high',
    authenticity: 'performative-playful'
  },
  
  'playful_silly': {
    id: 'playful_silly',
    category: 'playful',
    label: 'Дурашливость',
    shortDescription: 'Не боится выглядеть глупо, чистое веселье',
    promptBlock: `Not afraid to look silly, pure fun. Exaggerated expression — eyes wide, mouth 
in funny shape, maybe tongue out. Completely unselfconscious joy. The face of someone who 
doesn't care about looking cool, just wants to have fun. Childlike freedom, infectious 
energy.`,
    bodyLanguage: 'Loose, animated, possibly mid-gesture',
    eyeDirection: 'exaggerated, could be crossed or wide',
    mouthState: 'exaggerated — tongue out, puffed cheeks, wide grin',
    energy: 'very high',
    authenticity: 'candid'
  },

  // ─────────────────────────────────────────────────────────────
  // SENSUAL — Чувственность
  // ─────────────────────────────────────────────────────────────
  'sensual_languid': {
    id: 'sensual_languid',
    category: 'sensual',
    label: 'Томность',
    shortDescription: 'Медленная, тягучая чувственность',
    promptBlock: `Slow, languid sensuality. Heavy-lidded eyes, almost sleepy but aware. 
Lips slightly parted, relaxed jaw. Head may be tilted back slightly, exposing throat. 
The expression of someone savoring a moment, in no hurry. Physical pleasure evident 
but understated — warmth, comfort, presence in the body.`,
    bodyLanguage: 'Relaxed, draped, slow movements',
    eyeDirection: 'heavy-lidded, half-closed',
    mouthState: 'softly parted, relaxed',
    energy: 'low',
    authenticity: 'natural'
  },
  
  'sensual_intense': {
    id: 'sensual_intense',
    category: 'sensual',
    label: 'Страсть',
    shortDescription: 'Интенсивный, притягивающий взгляд',
    promptBlock: `Intense, magnetic gaze. Eyes locked on target, pupils dilated. Breathing 
slightly heavier. Lips parted, possibly bitten. Nostrils may be slightly flared. The 
expression of strong desire barely contained — heat visible behind the eyes. Powerful 
attraction, unbroken eye contact.`,
    bodyLanguage: 'Leaning in, tension in muscles, focused',
    eyeDirection: 'locked, intense, unbreaking',
    mouthState: 'parted, possibly bitten lip',
    energy: 'high',
    authenticity: 'performative'
  },

  // ─────────────────────────────────────────────────────────────
  // MELANCHOLY — Меланхолия
  // ─────────────────────────────────────────────────────────────
  'melancholy_wistful': {
    id: 'melancholy_wistful',
    category: 'melancholy',
    label: 'Тоска',
    shortDescription: 'Светлая грусть, ностальгия',
    promptBlock: `Light sadness, nostalgia for something past. Eyes soft, looking at nothing 
specific or into distance. Slight downturn at mouth corners but not a frown. The expression 
of someone remembering something beautiful that's gone. Bittersweet, gentle sadness — not 
despair but tender melancholy.`,
    bodyLanguage: 'Slightly closed posture, possibly hugging self',
    eyeDirection: 'distance or downward, unfocused',
    mouthState: 'relaxed with slight downturn',
    energy: 'low',
    authenticity: 'natural'
  },
  
  'melancholy_vulnerable': {
    id: 'melancholy_vulnerable',
    category: 'melancholy',
    label: 'Уязвимость',
    shortDescription: 'Открытая хрупкость, без защит',
    promptBlock: `Open fragility, defenses down. Eyes possibly wet or red-rimmed, looking 
exposed. Face soft, no attempt to hide emotion. Lips may tremble slightly. The raw 
expression of someone allowing themselves to be seen in pain. Beautiful vulnerability, 
courage in openness.`,
    bodyLanguage: 'Protective but open, possibly arms around self',
    eyeDirection: 'direct but soft, possibly wet eyes',
    mouthState: 'soft, possibly trembling',
    energy: 'low',
    authenticity: 'candid'
  },

  // ─────────────────────────────────────────────────────────────
  // INTENSE — Интенсивность
  // ─────────────────────────────────────────────────────────────
  'intense_focused': {
    id: 'intense_focused',
    category: 'intense',
    label: 'Концентрация',
    shortDescription: 'Полная сосредоточенность на задаче',
    promptBlock: `Complete focus on a task. Eyes sharp, possibly slightly narrowed. Brow 
slightly furrowed in concentration. Jaw set. Everything else faded out — total presence 
in the moment. The expression of an athlete before a race or artist in flow state. 
Intensity without aggression.`,
    bodyLanguage: 'Coiled, ready, economical',
    eyeDirection: 'laser-focused on target',
    mouthState: 'closed, lips together, slight jaw tension',
    energy: 'high',
    authenticity: 'natural'
  },
  
  'intense_raw': {
    id: 'intense_raw',
    category: 'intense',
    label: 'На грани',
    shortDescription: 'Сильная эмоция на грани выплеска',
    promptBlock: `Strong emotion on the edge of breaking through. Eyes wide, intense, possibly 
wild. Breathing visible. Face flushed. The moment before the scream or the breakdown or 
the explosion — maximum tension, raw energy barely contained. Primal, unfiltered emotion.`,
    bodyLanguage: 'Tense, possibly shaking, coiled energy',
    eyeDirection: 'wide, intense, possibly wild',
    mouthState: 'open or clenched, tension visible',
    energy: 'very high',
    authenticity: 'candid'
  }
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get all emotions for a category
 */
export function getEmotionsByCategory(category) {
  return Object.values(EMOTION_PRESETS).filter(e => e.category === category);
}

/**
 * Get emotion by ID
 */
export function getEmotionById(id) {
  return EMOTION_PRESETS[id] || null;
}

/**
 * Get all emotions as array
 */
export function getAllEmotions() {
  return Object.values(EMOTION_PRESETS);
}

/**
 * Get emotion options for UI dropdowns
 */
export function getEmotionOptions() {
  const grouped = {};
  
  for (const category of EMOTION_CATEGORIES) {
    grouped[category] = getEmotionsByCategory(category).map(e => ({
      id: e.id,
      label: e.label,
      shortDescription: e.shortDescription
    }));
  }
  
  return grouped;
}

export default EMOTION_PRESETS;
