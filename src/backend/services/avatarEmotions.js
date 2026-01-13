// Avatar emotion presets for the avatar generator.
// Goal: subtle, editorial-safe expressions (avoid big grimaces / wide surprise / anger / crying).

export const AVATAR_EMOTIONS = [
  {
    id: 'neutral',
    label: 'Neutral',
    prompt:
      'Neutral resting face. Eyes open and alert. Relaxed jaw. No smile, no frown. Calm, composed editorial baseline.'
  },
  {
    id: 'soft-smile',
    label: 'Soft smile',
    prompt:
      'A very subtle micro-smile (barely raised mouth corners). Natural, unforced. Eyes open. No big grin, no teeth.'
  },
  {
    id: 'knowing-smirk',
    label: 'Knowing smirk',
    prompt:
      'A slight knowing smirk / hint of irony. Minimal asymmetry is OK. Keep it editorial and restrained (no caricature).'
  },
  {
    id: 'cool-confident',
    label: 'Cool confidence',
    prompt:
      'Cool, self-contained confident expression. Direct, steady gaze. Relaxed face muscles. No smile needed.'
  },
  {
    id: 'focused',
    label: 'Focused',
    prompt:
      'Focused concentration as if looking at something intently. Subtle tension around eyes/forehead is OK, but avoid harsh frown.'
  },
  {
    id: 'curious',
    label: 'Curious',
    prompt:
      'Mild curiosity / interest. Slightly raised brows are OK, but keep it realistic and subtle. Not wide-eyed surprise.'
  },
  {
    id: 'thoughtful',
    label: 'Thoughtful',
    prompt:
      'Thoughtful, introspective. Gaze can be slightly off-camera or into the middle distance. Eyes must remain open and present.'
  },
  {
    id: 'calm-warmth',
    label: 'Calm warmth',
    prompt:
      'Calm warmth and softness. Relaxed facial muscles, gentle eyes. Very subtle friendliness; keep it editorial.'
  },
  {
    id: 'quiet-determination',
    label: 'Quiet determination',
    prompt:
      'Quiet determination. Strong presence without anger. Closed lips, steady gaze. No aggression.'
  },
  {
    id: 'subtle-amusement',
    label: 'Subtle amusement',
    prompt:
      'Subtle amusement / light internal laugh (micro-expression). No big laugh, no open mouth, no exaggerated cheeks.'
  }
];

export function normalizeEmotionId(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  const hit = AVATAR_EMOTIONS.find(e => e && e.id === raw);
  return hit ? hit.id : null;
}

export function getEmotionById(emotionId) {
  const id = normalizeEmotionId(emotionId);
  if (!id) return null;
  return AVATAR_EMOTIONS.find(e => e && e.id === id) || null;
}

export function buildAvatarExpressionBlock(emotionId, { hasEmotionRef = false } = {}) {
  const e = getEmotionById(emotionId);
  const prompt = e && e.prompt ? String(e.prompt).trim() : '';
  const fallback =
    'Neutral resting face. Eyes open and alert. Calm, composed, editorial expression. No big smile, no grimace.';
  const label = e && e.label ? e.label : 'Target expression';

  const targetLine = prompt
    ? `Target expression family (${label}): ${prompt}`
    : `Target expression family (${label}): ${fallback}`;

  if (!hasEmotionRef) {
    return [
      'FACIAL EXPRESSION (HARD):',
      targetLine,
      'Change ONLY the facial expression and micro-moment. Keep identity, face geometry, hair, lighting, background and framing unchanged.',
      'Keep it realistic and subtle. Avoid exaggerated acting, grimaces, big laughs, wide surprise, anger, or crying.'
    ].join('\n');
  }

  return [
    'FACIAL EXPRESSION FROM SECOND REFERENCE IMAGE (HARD):',
    '',
    'You are given a SECOND reference image (Image #2) that shows the SAME real person in a specific facial expression.',
    'Treat Image #2 strictly as a PERFORMANCE / EXPRESSION reference, NOT as a new identity.',
    '',
    'From Image #2 you MUST transfer into the generated portrait ONLY:',
    '- the overall emotional state,',
    '- the micro-expression in the eyes, brows and mouth,',
    '- the direction and quality of the gaze.',
    '',
    'You MUST NOT copy from Image #2:',
    '- any change in face geometry, age, weight or bone structure,',
    '- hair length, haircut, hair color that contradicts the IDENTITY reference,',
    '- clothing, background, camera angle, lens behavior or lighting style.',
    '',
    'Expression calibration:',
    targetLine,
    '',
    'Global rule:',
    'Keep the person instantly recognisable as the SAME individual from the IDENTITY reference.',
    'Keep the expression realistic and subtle.'
  ].join('\n');
}



