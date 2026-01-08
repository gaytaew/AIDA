/**
 * Emotion Schema v2 — Atmospheric Approach
 * 
 * Эмоции описаны через атмосферу и внутреннее состояние,
 * а не через физические инструкции.
 * 
 * Ключевые принципы:
 * - Описываем ситуацию/момент, а не физику лица
 * - Добавляем avoid для предотвращения наигранности
 * - Интенсивность по умолчанию снижена (2-3 из 5)
 * - authenticityKey — ключ к естественности
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
// INTENSITY LEVELS
// ═══════════════════════════════════════════════════════════════

export const INTENSITY_LEVELS = {
  1: { label: 'Микро', description: 'Едва заметный намёк на эмоцию. Считывается только при внимательном взгляде.' },
  2: { label: 'Лёгкий', description: 'Лёгкое проявление эмоции. Естественно и ненавязчиво.' },
  3: { label: 'Читаемый', description: 'Эмоция читается, но не преувеличена. Баланс между выразительностью и естественностью.' },
  4: { label: 'Явный', description: 'Явная, выраженная эмоция. Подходит для драматичных кадров.' },
  5: { label: 'Максимальный', description: 'Полная интенсивность. Только для специальных творческих задач.' }
};

// ═══════════════════════════════════════════════════════════════
// GLOBAL ANTI-PERFORMATIVE RULES
// ═══════════════════════════════════════════════════════════════

export const GLOBAL_EMOTION_RULES = [
  'This is NOT a posed expression for camera',
  'Capture as if the model does NOT know they are being photographed',
  'Reduce apparent intensity — aim for subtle, not theatrical',
  'Embrace asymmetry and natural micro-imperfections',
  'No "actor face", no exaggerated theatrical expressions',
  'Expression should feel like a caught moment, not a held pose',
  'Allow eyes to look slightly away or unfocused — not always camera-locked'
];

// ═══════════════════════════════════════════════════════════════
// EMOTION PRESETS — Атмосферный подход
// ═══════════════════════════════════════════════════════════════

export const EMOTION_PRESETS = {
  
  // ─────────────────────────────────────────────────────────────
  // JOY — Радость
  // ─────────────────────────────────────────────────────────────
  
  'joy_private_amusement': {
    id: 'joy_private_amusement',
    category: 'joy',
    label: 'Тихое веселье',
    shortDescription: 'Приватная улыбка, как от внутренней шутки',
    
    // Атмосферное описание (главное!)
    atmosphere: `A private joke just crossed their mind. Not performing for anyone — simply amused 
by their own thoughts. The kind of expression you'd catch if you glanced at them unexpectedly 
while they're remembering something funny. Warm, contained, genuine.`,
    
    // Что строго запрещено
    avoid: [
      'Wide open-mouth laugh',
      'Teeth-showing grin',
      'Exaggerated squinting',
      'Head thrown back',
      'Performative joy for camera'
    ],
    
    // Уровень интенсивности по умолчанию
    defaultIntensity: 2,
    
    // Минимальные физические подсказки
    physicalHints: 'Slight upturn at one corner of mouth. Soft eyes. Relaxed jaw.',
    
    // Ключ к естественности
    authenticityKey: 'Caught between expressions — the moment before a smile fully forms',
    
    energy: 'low-medium'
  },
  
  'joy_warmth': {
    id: 'joy_warmth',
    category: 'joy',
    label: 'Тепло',
    shortDescription: 'Мягкое тепло, как в приятном воспоминании',
    
    atmosphere: `The feeling of stepping into warm sunlight after being in shade. Eyes soft, 
relaxed, maybe slightly narrowed from comfort rather than from smiling. The contentment of 
someone simply enjoying the present moment without needing to express it outwardly.`,
    
    avoid: [
      'Forced smile',
      'Squinting eyes hard',
      'Looking directly at camera with intention',
      'Over-relaxed "spa ad" expression'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Face relaxed. Breathing slow. Shoulders dropped.',
    authenticityKey: 'Not performing warmth — simply feeling it',
    energy: 'low'
  },
  
  'joy_surprised_delight': {
    id: 'joy_surprised_delight',
    category: 'joy',
    label: 'Приятное удивление',
    shortDescription: 'Момент неожиданной радости',
    
    atmosphere: `Just noticed something unexpectedly wonderful — a friend appearing, a beautiful 
sight, a pleasant surprise. The expression of the split-second before reaction fully forms. 
Genuine, unguarded, caught off guard in the best way.`,
    
    avoid: [
      'Theatrical open mouth',
      'Exaggerated wide eyes',
      'Hands on cheeks gesture',
      'Frozen "surprise" pose'
    ],
    
    defaultIntensity: 3,
    physicalHints: 'Eyes brightening. Beginning of a smile. Slight lean forward.',
    authenticityKey: 'The instant of recognition before social response kicks in',
    energy: 'medium'
  },

  // ─────────────────────────────────────────────────────────────
  // CALM — Спокойствие
  // ─────────────────────────────────────────────────────────────
  
  'calm_present': {
    id: 'calm_present',
    category: 'calm',
    label: 'Присутствие',
    shortDescription: 'Просто здесь и сейчас',
    
    atmosphere: `Simply existing in the moment. Not thinking about past or future, not 
performing for anyone. The quiet between thoughts. How someone looks when they've forgotten 
they're being observed — resting, but aware. Neither happy nor sad, just... being.`,
    
    avoid: [
      'Forced neutrality',
      'Blank stare',
      'Over-relaxed "meditation" look',
      'Dead eyes'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Natural resting face. Eyes alive but unfocused. Breathing visible.',
    authenticityKey: 'The face between expressions, not the absence of expression',
    energy: 'low'
  },
  
  'calm_daydream': {
    id: 'calm_daydream',
    category: 'calm',
    label: 'Грёзы',
    shortDescription: 'Лёгкая задумчивость, мысли где-то далеко',
    
    atmosphere: `Mind wandering somewhere pleasant. Looking at something but seeing something 
else entirely. The comfortable drift of unstructured thought. How someone looks when they're 
on autopilot — body here, mind elsewhere, and that's perfectly fine.`,
    
    avoid: [
      'Exaggerated "dreamy" expression',
      'Eyes rolled up dramatically',
      'Sleepy/drowsy look',
      'Forced unfocused gaze'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Gaze slightly off. Lips relaxed. Slight head tilt possible.',
    authenticityKey: 'Genuine mental absence, not performed dreaminess',
    energy: 'low'
  },
  
  'calm_listening': {
    id: 'calm_listening',
    category: 'calm',
    label: 'Внимание',
    shortDescription: 'Внимательно слушает кого-то',
    
    atmosphere: `Genuinely listening to someone speak. Focused but not intense. Present and 
engaged without needing to perform engagement. The face of someone who cares about what 
they're hearing. Receptive, open, attentive without strain.`,
    
    avoid: [
      'Over-exaggerated "active listening" face',
      'Nodding',
      'Fake interest expression',
      'Eyebrows raised in forced attention'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Eyes focused on speaker (off-camera). Face relaxed but attentive.',
    authenticityKey: 'Actually processing information, not showing that you are',
    energy: 'low-medium'
  },

  // ─────────────────────────────────────────────────────────────
  // POWER — Сила/Уверенность
  // ─────────────────────────────────────────────────────────────
  
  'power_quiet_confidence': {
    id: 'power_quiet_confidence',
    category: 'power',
    label: 'Тихая уверенность',
    shortDescription: 'Ничего не нужно доказывать',
    
    atmosphere: `Complete security in themselves without needing to display it. The calm of 
someone who has nothing to prove. Not aggressive, not demanding attention — simply grounded. 
The kind of person who makes others feel calm just by being present.`,
    
    avoid: [
      'Power pose',
      'Jaw clenched',
      'Intense stare-down',
      'Chin dramatically raised',
      'Model "fierce" face'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Shoulders relaxed but back. Steady gaze. Slight knowing in eyes.',
    authenticityKey: 'Confidence that comes from inside, not displayed for others',
    energy: 'medium'
  },
  
  'power_unbothered': {
    id: 'power_unbothered',
    category: 'power',
    label: 'Невозмутимость',
    shortDescription: 'Ничего не может вывести из равновесия',
    
    atmosphere: `Absolutely unbothered by anything. Not performing coolness — genuinely 
undisturbed. The expression of someone who's seen it all and is no longer impressed or 
threatened by anything. Calm that comes from genuine detachment, not suppression.`,
    
    avoid: [
      'Bored look',
      'Eye roll',
      'Smirk',
      'Exaggerated nonchalance',
      'Dead inside expression'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Even breathing. Relaxed face. Eyes calm but present.',
    authenticityKey: 'Not trying to look unbothered — actually being unbothered',
    energy: 'low'
  },
  
  'power_aware': {
    id: 'power_aware',
    category: 'power',
    label: 'Осознанность',
    shortDescription: 'Знает о присутствии камеры, но не играет',
    
    atmosphere: `Aware of being observed but not performing for it. Acknowledging the camera's 
existence without changing behavior for it. The quiet power of someone who doesn't adjust 
themselves for others' benefit. Present, aware, unhurried.`,
    
    avoid: [
      'Direct confrontational stare',
      'Seductive camera look',
      'Ignoring camera artificially',
      'Model "on" face'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Comfortable stillness. Natural eye contact or near it.',
    authenticityKey: 'Acknowledging observation without being changed by it',
    energy: 'medium'
  },

  // ─────────────────────────────────────────────────────────────
  // MYSTERY — Загадочность
  // ─────────────────────────────────────────────────────────────
  
  'mystery_private_thought': {
    id: 'mystery_private_thought',
    category: 'mystery',
    label: 'Своя мысль',
    shortDescription: 'Думает о чём-то, что никогда не расскажет',
    
    atmosphere: `Thinking about something they'll never share. Not performing mystery — 
simply having private thoughts that show faintly on their face. The expression of someone 
with a rich inner world that's visible but inaccessible.`,
    
    avoid: [
      'Mona Lisa imitation',
      'Mysterious smirk',
      'Dramatically distant gaze',
      'Femme fatale expression'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Slight asymmetry in expression. Eyes alive but guarded.',
    authenticityKey: 'Privacy, not performance of secrecy',
    energy: 'low-medium'
  },
  
  'mystery_elsewhere': {
    id: 'mystery_elsewhere',
    category: 'mystery',
    label: 'Где-то ещё',
    shortDescription: 'Мысленно в другом месте',
    
    atmosphere: `Physically here but mentally somewhere else entirely. Not pretending to be 
distant — genuinely absorbed in something internal. Could be a memory, a problem, a fantasy. 
The viewer can see the absence but can't access what's filling that space.`,
    
    avoid: [
      'Theatrical far-away look',
      'Unfocused "artsy" gaze',
      'Sleepy expression',
      'Performative melancholy'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Gaze through or past things. Slight disconnect from surroundings.',
    authenticityKey: 'Genuine absorption, not performed distance',
    energy: 'low'
  },

  // ─────────────────────────────────────────────────────────────
  // PLAYFUL — Игривость
  // ─────────────────────────────────────────────────────────────
  
  'playful_about_to': {
    id: 'playful_about_to',
    category: 'playful',
    label: 'Вот-вот',
    shortDescription: 'За секунду до смеха или шалости',
    
    atmosphere: `The moment right before laughter escapes or a joke lands. Something amusing 
is building but hasn't broken through yet. The tension of contained playfulness — knowing 
something's funny, trying not to show it, not quite succeeding.`,
    
    avoid: [
      'Full laugh',
      'Mischievous grin',
      'Winking',
      'Tongue out',
      'Over-performed playfulness'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Slight tension at mouth corners. Eyes brightening. Fighting a smile.',
    authenticityKey: 'The struggle to contain amusement, not the display of it',
    energy: 'medium'
  },
  
  'playful_complicit': {
    id: 'playful_complicit',
    category: 'playful',
    label: 'Сообщник',
    shortDescription: 'Как будто делит шутку с кем-то',
    
    atmosphere: `Sharing a private joke with someone — maybe the viewer, maybe someone 
off-camera. The connection of shared humor. Not performing for an audience, but having a 
genuine moment of connection through shared amusement.`,
    
    avoid: [
      'Exaggerated wink',
      'Obvious "I know something" face',
      'Breaking the fourth wall theatrically',
      'Performative conspiracy'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Subtle eye contact. Hint of shared understanding in expression.',
    authenticityKey: 'Real connection, not performed intimacy',
    energy: 'medium'
  },

  // ─────────────────────────────────────────────────────────────
  // SENSUAL — Чувственность
  // ─────────────────────────────────────────────────────────────
  
  'sensual_comfort': {
    id: 'sensual_comfort',
    category: 'sensual',
    label: 'Комфорт',
    shortDescription: 'Физическое удовольствие от момента',
    
    atmosphere: `Simply comfortable in their body. The pleasure of warmth, softness, 
rest. Not performing sensuality — experiencing genuine physical comfort. How someone 
looks when they're enjoying being in their skin without thinking about how it looks.`,
    
    avoid: [
      'Lip biting',
      'Heavy-lidded "seductive" eyes',
      'Parted lips pose',
      'Bedroom eyes',
      'Over-relaxed "pleasure" face'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Relaxed muscles. Easy breathing. Weight settled.',
    authenticityKey: 'Actual physical comfort, not its performance',
    energy: 'low'
  },
  
  'sensual_awareness': {
    id: 'sensual_awareness',
    category: 'sensual',
    label: 'Осознание тела',
    shortDescription: 'Присутствие в своём теле',
    
    atmosphere: `Conscious of their own body in a positive way. Not thinking about how 
they look, but how they feel. The quiet pleasure of embodiment. Present in physical 
sensation without need to display it.`,
    
    avoid: [
      'Touching self performatively',
      'Arched back pose',
      'Lip licking',
      'Sultry expression',
      'Fashion "sexy" face'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Grounded in body. Breathing natural. Face relaxed.',
    authenticityKey: 'Inner experience of body, not outer display',
    energy: 'low-medium'
  },

  // ─────────────────────────────────────────────────────────────
  // MELANCHOLY — Меланхолия
  // ─────────────────────────────────────────────────────────────
  
  'melancholy_quiet': {
    id: 'melancholy_quiet',
    category: 'melancholy',
    label: 'Тихая грусть',
    shortDescription: 'Лёгкая печаль без драмы',
    
    atmosphere: `A gentle sadness without drama or performance. The natural quiet that 
comes after loss, disappointment, or just a grey day. Not wallowing, not suppressing — 
simply allowing a difficult feeling to exist. Honest, human, unperformed.`,
    
    avoid: [
      'Tears',
      'Pouting',
      'Looking dramatically sad',
      'Tragedy mask expression',
      'Puppy dog eyes'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Subtle weight in expression. Slower energy. Inward focus.',
    authenticityKey: 'Real sadness passing through, not performed melancholy',
    energy: 'low'
  },
  
  'melancholy_memory': {
    id: 'melancholy_memory',
    category: 'melancholy',
    label: 'Воспоминание',
    shortDescription: 'Думает о чём-то или ком-то ушедшем',
    
    atmosphere: `Remembering something or someone no longer present. Not actively grieving — 
just holding a memory. The bittersweet feeling of time passing. Looking at nothing 
external, but seeing something internal very clearly.`,
    
    avoid: [
      'Crying',
      'Looking at photo (of absent person)',
      'Clutching heart',
      'Theatrical longing',
      'Forced nostalgia face'
    ],
    
    defaultIntensity: 2,
    physicalHints: 'Eyes focused internally. Slight softness in face.',
    authenticityKey: 'Holding memory gently, not performing loss',
    energy: 'low'
  },

  // ─────────────────────────────────────────────────────────────
  // INTENSE — Интенсивность
  // ─────────────────────────────────────────────────────────────
  
  'intense_focus': {
    id: 'intense_focus',
    category: 'intense',
    label: 'Фокус',
    shortDescription: 'Полная концентрация на чём-то',
    
    atmosphere: `Completely absorbed in something requiring attention. Not showing 
concentration — experiencing it. The face of someone who has forgotten everything 
except the task at hand. World narrowed to a single point.`,
    
    avoid: [
      'Furrowed brow overacting',
      'Squinting hard',
      'Jaw clenched dramatically',
      'Intense stare at camera',
      'Trying to look focused'
    ],
    
    defaultIntensity: 3,
    physicalHints: 'Eyes alert. Face still. Unnecessary movement stopped.',
    authenticityKey: 'Actually focused, not performing concentration',
    energy: 'medium-high'
  },
  
  'intense_edge': {
    id: 'intense_edge',
    category: 'intense',
    label: 'На грани',
    shortDescription: 'Сильное чувство под контролем',
    
    atmosphere: `Strong feeling present but contained. Not suppressing — holding. 
The moment before something might break through but hasn't yet. Tension that comes 
from real internal pressure, not its performance.`,
    
    avoid: [
      'About to cry acting',
      'Screaming face',
      'Shaking with emotion',
      'Theatrical intensity',
      'Over-dramatic holding back'
    ],
    
    defaultIntensity: 3,
    physicalHints: 'Slight tension visible. Stillness with energy beneath.',
    authenticityKey: 'Real internal pressure, shown through stillness not explosion',
    energy: 'high'
  }
};

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build emotion prompt block from preset
 * @param {string} emotionId 
 * @param {number} intensityOverride - 1-5, optional
 * @returns {string} - prompt block for AI
 */
export function buildEmotionPrompt(emotionId, intensityOverride = null) {
  const emotion = EMOTION_PRESETS[emotionId];
  if (!emotion) return '';
  
  const intensity = intensityOverride || emotion.defaultIntensity;
  const intensityInfo = INTENSITY_LEVELS[intensity] || INTENSITY_LEVELS[2];
  
  // Build avoid block
  const avoidBlock = emotion.avoid && emotion.avoid.length > 0
    ? `AVOID (these make expression look fake): ${emotion.avoid.join('; ')}.`
    : '';
  
  return `
EMOTION: ${emotion.label}
INTENSITY: ${intensity}/5 (${intensityInfo.label} — ${intensityInfo.description})

ATMOSPHERE (this is what matters):
${emotion.atmosphere.trim()}

KEY TO AUTHENTICITY: ${emotion.authenticityKey}

${avoidBlock}

PHYSICAL HINTS (minimal, for reference only): ${emotion.physicalHints}

GLOBAL RULES FOR NATURAL EXPRESSION:
${GLOBAL_EMOTION_RULES.map(r => '- ' + r).join('\n')}
`.trim();
}

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
      shortDescription: e.shortDescription,
      defaultIntensity: e.defaultIntensity
    }));
  }
  
  return grouped;
}

export default EMOTION_PRESETS;
