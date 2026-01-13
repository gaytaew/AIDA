/**
 * Emotion Schema v4 — Expanded with Energy-based Categories
 * 
 * Принципы:
 * - ~25 эмоций с группировкой по ЭНЕРГИИ
 * - Атмосферные описания (ситуация, не мимика)
 * - Эмоция модели ОТДЕЛЕНА от визуальной атмосферы (visualMood)
 * - Упор на естественность и anti-performative подход
 * 
 * Структура категорий по энергии:
 * - energy_low: Тихие, интровертные состояния
 * - energy_medium: Активные, но сдержанные
 * - energy_high: Яркие, экспрессивные
 * - camera_aware: Взаимодействие с камерой
 * - transitional: Переходные моменты
 */

// ═══════════════════════════════════════════════════════════════
// EMOTION CATEGORIES (energy-based)
// ═══════════════════════════════════════════════════════════════

export const EMOTION_CATEGORIES = [
  { id: 'energy_low', label: '🌙 Тихие', description: 'Низкая энергия, интровертные' },
  { id: 'energy_medium', label: '⚡ Активные', description: 'Средняя энергия, сдержанные' },
  { id: 'energy_high', label: '🔥 Яркие', description: 'Высокая энергия, экспрессивные' },
  { id: 'camera_aware', label: '📷 С камерой', description: 'Взаимодействие с камерой' },
  { id: 'transitional', label: '✨ Переходные', description: 'Моменты между состояниями' }
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
// EMOTION PRESETS — ~25 distinct emotions grouped by energy
// ═══════════════════════════════════════════════════════════════

export const EMOTION_PRESETS = {
  
  // ─────────────────────────────────────────────────────────────
  // 🌙 ENERGY LOW — Тихие, интровертные состояния
  // ─────────────────────────────────────────────────────────────
  
  'resting': {
    id: 'resting',
    category: 'energy_low',
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
  
  'thinking': {
    id: 'thinking',
    category: 'energy_low',
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
  
  'distant': {
    id: 'distant',
    category: 'energy_low',
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
  
  'tired': {
    id: 'tired',
    category: 'energy_low',
    label: 'Уставший',
    shortDescription: 'Естественная усталость',
    
    atmosphere: `End of a long day, or just low energy. Not dramatically exhausted — 
just... tired. The kind where you're still functioning but everything takes 
a little more effort. Human, relatable, real.`,
    
    avoid: ['Yawning', 'Eyes closed', 'Collapsing pose', 'Exaggerated exhaustion'],
    defaultIntensity: 2,
    physicalHints: 'Heavy eyelids. Slower movement. Weight settling.',
    authenticityKey: 'Natural tiredness, not performed exhaustion'
  },
  
  'melancholic': {
    id: 'melancholic',
    category: 'energy_low',
    label: 'Меланхоличный',
    shortDescription: 'Тихая грусть, но не депрессия',
    
    atmosphere: `A quiet sadness that's almost comfortable. Not crying, not distressed — 
just present with a mild heaviness. The beauty in melancholy, the poetry of 
minor keys. Thoughtful sadness without drama.`,
    
    avoid: ['Tears', 'Pouting', 'Dramatic grief', 'Depression face'],
    defaultIntensity: 2,
    physicalHints: 'Softened eyes. Slight downward gaze. Shoulders slightly dropped.',
    authenticityKey: 'Comfortable sadness, not performed grief'
  },
  
  'vulnerable': {
    id: 'vulnerable',
    category: 'energy_low',
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
  
  // ─────────────────────────────────────────────────────────────
  // ⚡ ENERGY MEDIUM — Активные, но сдержанные
  // ─────────────────────────────────────────────────────────────
  
  'observing': {
    id: 'observing',
    category: 'energy_medium',
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
  
  'hint_of_smile': {
    id: 'hint_of_smile',
    category: 'energy_medium',
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
    category: 'energy_medium',
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
  
  'confident': {
    id: 'confident',
    category: 'energy_medium',
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
    category: 'energy_medium',
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
    category: 'energy_medium',
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
  
  'knowing': {
    id: 'knowing',
    category: 'energy_medium',
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
  
  'curious': {
    id: 'curious',
    category: 'energy_medium',
    label: 'Любопытный',
    shortDescription: 'Что-то заинтересовало',
    
    atmosphere: `Something caught their attention and they want to know more. 
Not wide-eyed wonder — just genuine interest. The slight lean forward, 
the eyes that are really looking, not just seeing.`,
    
    avoid: ['Wide eyes', 'Open mouth', 'Childlike wonder', 'Exaggerated surprise'],
    defaultIntensity: 2,
    physicalHints: 'Eyes engaged. Slight forward tilt. Alert.',
    authenticityKey: 'Real interest, not performed curiosity'
  },
  
  // ─────────────────────────────────────────────────────────────
  // 🔥 ENERGY HIGH — Яркие, экспрессивные
  // ─────────────────────────────────────────────────────────────
  
  'amused': {
    id: 'amused',
    category: 'energy_high',
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
  
  'laughing': {
    id: 'laughing',
    category: 'energy_high',
    label: 'Смеётся',
    shortDescription: 'Настоящий, непостановочный смех',
    
    atmosphere: `Genuine laughter caught mid-moment. Not a posed "cheese" smile — 
real mirth that crinkles the eyes and moves the whole face. Could be 
mid-laugh, could be that moment right after when the face is still catching up.`,
    
    avoid: ['Fake smile', 'Posed laugh', 'Perfect teeth display', 'Frozen mid-laugh'],
    defaultIntensity: 3,
    physicalHints: 'Crinkled eyes. Mouth naturally open. Face in motion.',
    authenticityKey: 'Caught laughing, not performing laughter'
  },
  
  'joyful': {
    id: 'joyful',
    category: 'energy_high',
    label: 'Радостный',
    shortDescription: 'Чистая радость, лёгкость',
    
    atmosphere: `Pure happiness without reservation. Not manic, not forced — 
just genuinely feeling good and it shows. The kind of joy that's infectious, 
that makes you want to know what's making them so happy.`,
    
    avoid: ['Maniacal grin', 'Forced cheerfulness', 'Advertising smile', 'Too perfect'],
    defaultIntensity: 2,
    physicalHints: 'Open face. Bright eyes. Light body.',
    authenticityKey: 'Real joy, not performed happiness'
  },
  
  'excited': {
    id: 'excited',
    category: 'energy_high',
    label: 'Взволнован',
    shortDescription: 'Предвкушение, азарт',
    
    atmosphere: `Something good is about to happen, or just happened. That fizzy 
feeling of anticipation or fresh excitement. Energy that's hard to contain 
but not over the top — just genuinely amped.`,
    
    avoid: ['Jumping up and down', 'Screaming face', 'Cartoon excitement', 'Too much'],
    defaultIntensity: 3,
    physicalHints: 'Alert eyes. Slight tension. Ready to move.',
    authenticityKey: 'Genuine excitement, not performed enthusiasm'
  },
  
  'playful': {
    id: 'playful',
    category: 'energy_high',
    label: 'Игривый',
    shortDescription: 'Озорство, лёгкость, веселье',
    
    atmosphere: `In a playful mood — maybe teasing, maybe joking around, maybe 
just feeling light and fun. There's mischief in the eyes but it's friendly. 
Not taking anything too seriously right now.`,
    
    avoid: ['Winking', 'Tongue out', 'Silly faces', 'Over-the-top goofiness'],
    defaultIntensity: 2,
    physicalHints: 'Bright eyes. Slight smile or smirk. Light energy.',
    authenticityKey: 'Natural playfulness, not performed silliness'
  },
  
  'triumphant': {
    id: 'triumphant',
    category: 'energy_high',
    label: 'Триумф',
    shortDescription: 'Только что победил, достиг чего-то',
    
    atmosphere: `The moment right after success. Not arrogant celebration — 
just that private surge of "I did it." Could be a big win or a small victory, 
but it's real and it feels good.`,
    
    avoid: ['Fist pump', 'Victory scream', 'Arrogant smirk', 'Looking at audience'],
    defaultIntensity: 2,
    physicalHints: 'Lifted chin (slightly). Bright eyes. Relaxed shoulders.',
    authenticityKey: 'Private victory feeling, not public celebration'
  },
  
  // ─────────────────────────────────────────────────────────────
  // 📷 CAMERA AWARE — Взаимодействие с камерой
  // ─────────────────────────────────────────────────────────────
  
  'caught': {
    id: 'caught',
    category: 'camera_aware',
    label: 'Заметил камеру',
    shortDescription: 'Только что увидел фотографа',
    
    atmosphere: `The split second when someone realizes they're being photographed. 
Not fully in "photo mode" yet — that transitional moment between being 
natural and being aware. Could go either way: smile or "stop that."`,
    
    avoid: ['Posed reaction', 'Frozen deer', 'Fake surprise', 'Already posing'],
    defaultIntensity: 2,
    physicalHints: 'Eyes just found camera. Face in transition.',
    authenticityKey: 'The moment of recognition, not the pose that follows'
  },
  
  'flirting': {
    id: 'flirting',
    category: 'camera_aware',
    label: 'Флирт',
    shortDescription: 'Лёгкая игра с камерой',
    
    atmosphere: `A subtle connection with the camera — aware of being watched 
and playing with it. Not over-the-top seduction — just that slight spark, 
the hint of "I see you seeing me." Playful but not silly.`,
    
    avoid: ['Duck face', 'Bedroom eyes', 'Obvious seduction', 'Try-hard sexy'],
    defaultIntensity: 2,
    physicalHints: 'Eye contact with slight mischief. Relaxed face.',
    authenticityKey: 'Subtle play, not performed seduction'
  },
  
  'provocative': {
    id: 'provocative',
    category: 'camera_aware',
    label: 'Провокация',
    shortDescription: 'Вызов, "а ты справишься?"',
    
    atmosphere: `A challenge in the eyes. Not aggressive, but definitely 
assertive — "what are you going to do about it?" The confidence of someone 
who knows they're being watched and is totally okay with it.`,
    
    avoid: ['Angry face', 'Sneering', 'Mean look', 'Aggressive posture'],
    defaultIntensity: 2,
    physicalHints: 'Direct gaze. Slight tension. Chin slightly up.',
    authenticityKey: 'Confident challenge, not aggressive confrontation'
  },
  
  'performing': {
    id: 'performing',
    category: 'camera_aware',
    label: 'Играет',
    shortDescription: 'Знает что снимают, использует это',
    
    atmosphere: `Fully aware of the camera and using it. Not fake — just 
consciously playing for the lens. There's a meta quality, like an inside 
joke between subject and photographer. Knowing participation.`,
    
    avoid: ['Obvious posing', 'Frozen model face', 'Trying too hard', 'Fake'],
    defaultIntensity: 2,
    physicalHints: 'Eyes engaged with camera. Slight performance energy.',
    authenticityKey: 'Playful awareness, not stiff posing'
  },
  
  // ─────────────────────────────────────────────────────────────
  // ✨ TRANSITIONAL — Переходные моменты
  // ─────────────────────────────────────────────────────────────
  
  'about_to_laugh': {
    id: 'about_to_laugh',
    category: 'transitional',
    label: 'Сейчас засмеётся',
    shortDescription: 'За секунду до смеха',
    
    atmosphere: `That delicious moment right before laughter breaks. Something 
funny was just said or happened. The smile is building, the eyes are already 
laughing, but the actual laugh hasn't escaped yet. Anticipation of joy.`,
    
    avoid: ['Already laughing', 'Fake buildup', 'Frozen anticipation'],
    defaultIntensity: 2,
    physicalHints: 'Eyes brightening. Corners of mouth lifting. Holding breath.',
    authenticityKey: 'The buildup, not the laugh itself'
  },
  
  'just_laughed': {
    id: 'just_laughed',
    category: 'transitional',
    label: 'Только что смеялся',
    shortDescription: 'Смех затихает',
    
    atmosphere: `The comedown from laughter. Still feeling it, face still relaxed 
from the laugh, maybe catching breath. That pleasant exhaustion after really 
good laughing. The smile that lingers.`,
    
    avoid: ['Still laughing', 'Posed aftermath', 'Fake recovery'],
    defaultIntensity: 2,
    physicalHints: 'Residual smile. Relaxed face. Catching breath.',
    authenticityKey: 'The echo of laughter, not laughter itself'
  },
  
  'before_speaking': {
    id: 'before_speaking',
    category: 'transitional',
    label: 'Перед словом',
    shortDescription: 'Набирает воздух, чтобы сказать',
    
    atmosphere: `About to say something. The tiny pause where thoughts become 
words. Maybe a slight inhale, the lips about to part. That pregnant moment 
where you can almost hear what they're about to say.`,
    
    avoid: ['Mid-word', 'Obvious inhale', 'Frozen pause', 'Dramatic preparation'],
    defaultIntensity: 1,
    physicalHints: 'Slight breath. Lips parted slightly. Eyes with intention.',
    authenticityKey: 'The moment before words, not performed pause'
  },
  
  'moment_of_recognition': {
    id: 'moment_of_recognition',
    category: 'transitional',
    label: 'Узнавание',
    shortDescription: 'Только что понял/узнал/осознал',
    
    atmosphere: `The click of understanding. Something just made sense, or 
someone familiar was just spotted. That flash of recognition before the 
full reaction. Brief, subtle, but visible.`,
    
    avoid: ['Lightbulb moment', 'Cartoon realization', 'Exaggerated "oh!"'],
    defaultIntensity: 2,
    physicalHints: 'Eyes focusing. Slight shift in attention. Brief.',
    authenticityKey: 'The spark of recognition, not the response to it'
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

export function getEmotionsByCategory(categoryId) {
  return Object.values(EMOTION_PRESETS).filter(e => e.category === categoryId);
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
    grouped[category.id] = {
      label: category.label,
      description: category.description,
      emotions: getEmotionsByCategory(category.id).map(e => ({
        id: e.id,
        label: e.label,
        shortDescription: e.shortDescription,
        defaultIntensity: e.defaultIntensity
      }))
    };
  }
  
  return grouped;
}

// ═══════════════════════════════════════════════════════════════
// COMPATIBILITY WITH VISUAL MOOD
// Suggests which emotions work well with which visual moods
// ═══════════════════════════════════════════════════════════════

export const MOOD_EMOTION_COMPATIBILITY = {
  // Visual Mood → Recommended emotions
  playful_summer: {
    recommended: ['laughing', 'joyful', 'playful', 'amused', 'excited', 'warm', 'flirting'],
    avoid: ['melancholic', 'tired', 'serious', 'vulnerable'],
    note: 'Летняя атмосфера лучше сочетается с позитивными, высокоэнергетичными эмоциями'
  },
  confident_bold: {
    recommended: ['confident', 'serious', 'provocative', 'knowing', 'focused'],
    avoid: ['vulnerable', 'tired', 'melancholic', 'playful'],
    note: 'Уверенная атмосфера требует сильных, сдержанных эмоций'
  },
  melancholic_romantic: {
    recommended: ['melancholic', 'distant', 'thinking', 'vulnerable', 'resting'],
    avoid: ['laughing', 'excited', 'joyful', 'playful'],
    note: 'Меланхоличная атмосфера требует тихих, интровертных эмоций'
  },
  edgy_raw: {
    recommended: ['serious', 'focused', 'provocative', 'vulnerable', 'caught'],
    avoid: ['joyful', 'playful', 'warm', 'flirting'],
    note: 'Raw атмосфера требует честных, несглаженных эмоций'
  },
  serene_calm: {
    recommended: ['resting', 'thinking', 'warm', 'observing', 'distant'],
    avoid: ['excited', 'laughing', 'provocative', 'triumphant'],
    note: 'Спокойная атмосфера требует низкоэнергетичных эмоций'
  },
  energetic_dynamic: {
    recommended: ['excited', 'playful', 'laughing', 'joyful', 'triumphant'],
    avoid: ['tired', 'melancholic', 'resting', 'distant'],
    note: 'Энергичная атмосфера требует высокоэнергетичных эмоций'
  },
  sensual: {
    recommended: ['warm', 'flirting', 'knowing', 'vulnerable', 'hint_of_smile'],
    avoid: ['laughing', 'excited', 'serious', 'focused'],
    note: 'Чувственная атмосфера требует мягких, интимных эмоций'
  },
  mysterious: {
    recommended: ['knowing', 'distant', 'thinking', 'observing', 'provocative'],
    avoid: ['laughing', 'joyful', 'playful', 'excited'],
    note: 'Загадочная атмосфера требует сдержанных, глубоких эмоций'
  },
  fresh_clean: {
    recommended: ['warm', 'hint_of_smile', 'observing', 'confident', 'joyful'],
    avoid: ['melancholic', 'tired', 'provocative', 'vulnerable'],
    note: 'Свежая атмосфера требует лёгких, позитивных эмоций'
  },
  gritty_urban: {
    recommended: ['serious', 'confident', 'provocative', 'focused', 'caught'],
    avoid: ['playful', 'joyful', 'warm', 'hint_of_smile'],
    note: 'Урбан атмосфера требует серьёзных, "уличных" эмоций'
  }
};

/**
 * Check compatibility between visual mood and emotion
 * @returns {{ compatible: boolean, note: string }}
 */
export function checkMoodEmotionCompatibility(visualMood, emotionId) {
  const moodConfig = MOOD_EMOTION_COMPATIBILITY[visualMood];
  if (!moodConfig) {
    return { compatible: true, note: '' };
  }
  
  if (moodConfig.recommended.includes(emotionId)) {
    return { compatible: true, note: `✓ ${moodConfig.note}` };
  }
  
  if (moodConfig.avoid.includes(emotionId)) {
    return { 
      compatible: false, 
      note: `⚠️ Эмоция "${getEmotionById(emotionId)?.label}" может не сочетаться с выбранной атмосферой. ${moodConfig.note}` 
    };
  }
  
  return { compatible: true, note: '' };
}

export default EMOTION_PRESETS;
