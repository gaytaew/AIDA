/**
 * Emotion Schema v3 — Simplified & Distinct
 * 
 * Принципы:
 * - Меньше эмоций, но более разных
 * - Простые, понятные названия
 * - Атмосферные описания (ситуация, не мимика)
 * - Упор на естественность
 */

// ═══════════════════════════════════════════════════════════════
// EMOTION CATEGORIES (simplified)
// ═══════════════════════════════════════════════════════════════

export const EMOTION_CATEGORIES = [
  'neutral',    // Нейтральные/спокойные
  'positive',   // Позитивные  
  'intense',    // Интенсивные/сильные
  'subtle'      // Тонкие/сложные
];

// ═══════════════════════════════════════════════════════════════
// GLOBAL ANTI-PERFORMATIVE RULES
// ═══════════════════════════════════════════════════════════════

export const GLOBAL_EMOTION_RULES = [
  'Expression should look CAUGHT, not POSED',
  'Reduce intensity by 30% from what description suggests',
  'Allow natural asymmetry in face',
  'Eyes can be slightly unfocused or looking away',
  'No "actor face" or theatrical expressions',
  'Micro-movements and imperfection are good'
];

// ═══════════════════════════════════════════════════════════════
// EMOTION PRESETS — 12 distinct, clearly different emotions
// ═══════════════════════════════════════════════════════════════

export const EMOTION_PRESETS = {
  
  // ─────────────────────────────────────────────────────────────
  // NEUTRAL — Базовые спокойные состояния
  // ─────────────────────────────────────────────────────────────
  
  'resting': {
    id: 'resting',
    category: 'neutral',
    label: 'В покое',
    shortDescription: 'Расслабленное лицо, ни о чём не думает',
    
    atmosphere: `Face at complete rest. Not thinking about anything in particular, 
not aware of being observed. The natural face between expressions — 
how someone looks when they're just... existing. No performance, no intention.`,
    
    avoid: ['Blank stare', 'Dead eyes', 'Forced neutrality', 'Model pose'],
    defaultIntensity: 2,
    physicalHints: 'Jaw relaxed. Eyes soft. Breathing slow.',
    authenticityKey: 'The face you make when alone and comfortable'
  },
  
  'observing': {
    id: 'observing',
    category: 'neutral',
    label: 'Наблюдает',
    shortDescription: 'Смотрит на что-то с лёгким интересом',
    
    atmosphere: `Watching something mildly interesting — a passing scene, 
movement in the distance, something that caught attention but doesn't 
demand reaction. Alert but relaxed. Present but not engaged.`,
    
    avoid: ['Intense staring', 'Wide eyes', 'Obvious curiosity', 'Pointing gaze'],
    defaultIntensity: 2,
    physicalHints: 'Eyes focused but soft. Head slightly turned.',
    authenticityKey: 'Passive watching, not active looking'
  },
  
  'thinking': {
    id: 'thinking',
    category: 'neutral',
    label: 'В мыслях',
    shortDescription: 'Погружён в размышления',
    
    atmosphere: `Mind elsewhere, processing something internal. Could be 
remembering, planning, wondering. Eyes see but don't register. 
The person is HERE physically but SOMEWHERE ELSE mentally.`,
    
    avoid: ['Furrowed brow', 'Hand on chin', 'Exaggerated "thinking" pose', 'Looking up'],
    defaultIntensity: 2,
    physicalHints: 'Gaze unfocused. Slight stillness.',
    authenticityKey: 'Genuine mental absence, not performed thoughtfulness'
  },

  // ─────────────────────────────────────────────────────────────
  // POSITIVE — Позитивные эмоции
  // ─────────────────────────────────────────────────────────────
  
  'hint_of_smile': {
    id: 'hint_of_smile',
    category: 'positive',
    label: 'Намёк на улыбку',
    shortDescription: 'Едва заметная улыбка в уголках губ',
    
    atmosphere: `Something pleasant just crossed their mind. Not a full smile — 
just the very beginning of one. The warmth is in the eyes more than the mouth. 
A private moment of contentment that barely shows.`,
    
    avoid: ['Full smile', 'Showing teeth', 'Squinting eyes', 'Obvious happiness'],
    defaultIntensity: 1,
    physicalHints: 'Slight lift at mouth corners. Soft eyes.',
    authenticityKey: 'The smile that happens before you realize you\'re smiling'
  },
  
  'warm': {
    id: 'warm',
    category: 'positive',
    label: 'Тепло',
    shortDescription: 'Мягкое, приятное состояние',
    
    atmosphere: `Feeling good without needing to show it. Like basking in 
pleasant warmth — sun on face, comfortable surroundings, no worries. 
Contentment that comes from inside, not performed for anyone.`,
    
    avoid: ['Beaming smile', 'Closed eyes bliss', 'Spa ad expression', 'Forced relaxation'],
    defaultIntensity: 2,
    physicalHints: 'Face soft. Breathing easy. Shoulders down.',
    authenticityKey: 'Internal warmth, not displayed happiness'
  },
  
  'amused': {
    id: 'amused',
    category: 'positive',
    label: 'Забавляется',
    shortDescription: 'Что-то показалось смешным',
    
    atmosphere: `Just noticed or remembered something funny. Not laughing out loud — 
holding it in, or it's not THAT funny. The amusement is visible in the eyes, 
maybe a slight twitch at the mouth. Private entertainment.`,
    
    avoid: ['Open laugh', 'Teeth showing', 'Head thrown back', 'Exaggerated grin'],
    defaultIntensity: 2,
    physicalHints: 'Eyes brightening. Fighting a smile.',
    authenticityKey: 'Trying not to laugh, not performing amusement'
  },

  // ─────────────────────────────────────────────────────────────
  // INTENSE — Сильные эмоции
  // ─────────────────────────────────────────────────────────────
  
  'confident': {
    id: 'confident',
    category: 'intense',
    label: 'Уверенный',
    shortDescription: 'Спокойная сила, ничего не нужно доказывать',
    
    atmosphere: `Complete security in themselves. Not aggressive, not showing off — 
just grounded. The kind of person who doesn't need to prove anything because 
they already know their worth. Quiet power.`,
    
    avoid: ['Power pose', 'Jaw clenched', 'Intense stare', 'Chin up dramatically'],
    defaultIntensity: 2,
    physicalHints: 'Steady gaze. Relaxed shoulders. Still.',
    authenticityKey: 'Confidence from within, not displayed for others'
  },
  
  'focused': {
    id: 'focused',
    category: 'intense',
    label: 'Сосредоточен',
    shortDescription: 'Полная концентрация на чём-то',
    
    atmosphere: `Completely absorbed in something. The world has narrowed to 
a single point of attention. Not performative concentration — genuine 
absorption where everything else has faded away.`,
    
    avoid: ['Furrowed brow', 'Squinting hard', 'Jaw tension', 'Looking at camera'],
    defaultIntensity: 3,
    physicalHints: 'Eyes sharp. Body still. Breathing slow.',
    authenticityKey: 'Actually focused, not showing focus'
  },
  
  'serious': {
    id: 'serious',
    category: 'intense',
    label: 'Серьёзный',
    shortDescription: 'Важный момент, без шуток',
    
    atmosphere: `Something matters right now. Not angry, not sad — just serious. 
The weight of a moment when things are real. Could be before an important 
decision, during a difficult conversation, or just being present with gravity.`,
    
    avoid: ['Angry scowl', 'Frowning', 'Stern teacher face', 'Disappointed look'],
    defaultIntensity: 2,
    physicalHints: 'Face still. Eyes direct. No smile.',
    authenticityKey: 'Gravity without drama'
  },

  // ─────────────────────────────────────────────────────────────
  // SUBTLE — Тонкие, сложные эмоции
  // ─────────────────────────────────────────────────────────────
  
  'distant': {
    id: 'distant',
    category: 'subtle',
    label: 'Отстранённый',
    shortDescription: 'Где-то далеко в мыслях',
    
    atmosphere: `Present physically but gone mentally. Looking at something 
but seeing something else — a memory, a daydream, another place entirely. 
There's a glass wall between them and the world right now.`,
    
    avoid: ['Sad face', 'Dreamy pose', 'Eyes rolled up', 'Obvious daydreaming'],
    defaultIntensity: 2,
    physicalHints: 'Gaze through things. Slight disconnect.',
    authenticityKey: 'Genuine absence, not performed mystery'
  },
  
  'vulnerable': {
    id: 'vulnerable',
    category: 'subtle',
    label: 'Открытый',
    shortDescription: 'Без защит, настоящий',
    
    atmosphere: `Guards down. Not performing strength or happiness or anything — 
just being real. Could be tired, could be between emotions, could be 
trusting enough to not pretend. Honest rawness without drama.`,
    
    avoid: ['Crying', 'Pouting', 'Sad puppy eyes', 'Victimhood'],
    defaultIntensity: 2,
    physicalHints: 'Face soft. No tension. Open.',
    authenticityKey: 'Honest presence, not performed vulnerability'
  },
  
  'knowing': {
    id: 'knowing',
    category: 'subtle',
    label: 'Понимающий',
    shortDescription: 'Знает что-то, но не говорит',
    
    atmosphere: `There's something behind the eyes — knowledge, understanding, 
a secret. Not smug, not mysterious on purpose. Just the natural look of 
someone who knows more than they're showing. Quiet wisdom.`,
    
    avoid: ['Smirk', 'Raised eyebrow', 'Mona Lisa imitation', 'Obvious secret-keeping'],
    defaultIntensity: 2,
    physicalHints: 'Eyes alive. Slight asymmetry. Calm.',
    authenticityKey: 'Internal knowledge, not performed mystery'
  },
  
  'tired': {
    id: 'tired',
    category: 'subtle',
    label: 'Уставший',
    shortDescription: 'Естественная усталость',
    
    atmosphere: `End of a long day, or just low energy. Not dramatically exhausted — 
just... tired. The kind where you're still functioning but everything takes 
a little more effort. Human, relatable, real.`,
    
    avoid: ['Yawning', 'Eyes closed', 'Collapsing pose', 'Exaggerated exhaustion'],
    defaultIntensity: 2,
    physicalHints: 'Heavy eyelids. Slower movement. Weight settling.',
    authenticityKey: 'Natural tiredness, not performed exhaustion'
  }
};

// ═══════════════════════════════════════════════════════════════
// INTENSITY LEVELS
// ═══════════════════════════════════════════════════════════════

export const INTENSITY_LEVELS = {
  1: { label: 'Едва заметно', description: 'Микро-выражение, видно только при внимательном взгляде' },
  2: { label: 'Естественно', description: 'Читается, но не преувеличено (рекомендуется)' },
  3: { label: 'Явно', description: 'Чёткое выражение, для драматичных кадров' }
};

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

export function buildEmotionPrompt(emotionId, intensityOverride = null) {
  const emotion = EMOTION_PRESETS[emotionId];
  if (!emotion) return '';
  
  const intensity = intensityOverride || emotion.defaultIntensity;
  const intensityInfo = INTENSITY_LEVELS[intensity] || INTENSITY_LEVELS[2];
  
  const avoidBlock = emotion.avoid && emotion.avoid.length > 0
    ? `\nAVOID: ${emotion.avoid.join('; ')}.`
    : '';
  
  return `
EMOTION: ${emotion.label}
INTENSITY: ${intensity}/3 (${intensityInfo.label})

${emotion.atmosphere.trim()}

KEY: ${emotion.authenticityKey}
${avoidBlock}

RULES: ${GLOBAL_EMOTION_RULES.join('. ')}.
`.trim();
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function getEmotionsByCategory(category) {
  return Object.values(EMOTION_PRESETS).filter(e => e.category === category);
}

export function getEmotionById(id) {
  return EMOTION_PRESETS[id] || null;
}

export function getAllEmotions() {
  return Object.values(EMOTION_PRESETS);
}

export function getEmotionOptions() {
  const grouped = {};
  
  for (const category of EMOTION_CATEGORIES) {
    grouped[category] = getEmotionsByCategory(category).map(e => ({
      id: e.id,
      label: e.label,
      shortDescription: e.shortDescription,
      defaultIntensity: e.defaultIntensity
    }));
  }
  
  return grouped;
}

export default EMOTION_PRESETS;
