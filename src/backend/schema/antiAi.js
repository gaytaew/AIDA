/**
 * Anti-AI Markers Schema
 * 
 * Settings to make generated images look more authentic and less "AI-generated".
 * These markers guide the AI to include natural imperfections.
 */

// ═══════════════════════════════════════════════════════════════
// ANTI-AI PRESETS
// ═══════════════════════════════════════════════════════════════

export const ANTI_AI_LEVELS = {
  minimal: {
    id: 'minimal',
    label: 'Минимальный',
    description: 'Чистые, почти идеальные изображения',
    settings: {
      allowExposureErrors: false,
      allowMixedWhiteBalance: false,
      requireMicroDefects: false,
      candidComposition: false,
      allowImperfectFocus: false,
      allowFlaresReflections: false,
      preferMicroMotion: false,
      filmScanTexture: false
    }
  },
  
  low: {
    id: 'low',
    label: 'Низкий',
    description: 'Небольшие естественные несовершенства',
    settings: {
      allowExposureErrors: false,
      allowMixedWhiteBalance: false,
      requireMicroDefects: true,
      candidComposition: false,
      allowImperfectFocus: false,
      allowFlaresReflections: true,
      preferMicroMotion: false,
      filmScanTexture: false
    }
  },
  
  medium: {
    id: 'medium',
    label: 'Средний',
    description: 'Баланс качества и аутентичности',
    settings: {
      allowExposureErrors: true,
      allowMixedWhiteBalance: true,
      requireMicroDefects: true,
      candidComposition: true,
      allowImperfectFocus: false,
      allowFlaresReflections: true,
      preferMicroMotion: true,
      filmScanTexture: true
    }
  },
  
  high: {
    id: 'high',
    label: 'Высокий',
    description: 'Максимальная аутентичность, как настоящее фото',
    settings: {
      allowExposureErrors: true,
      allowMixedWhiteBalance: true,
      requireMicroDefects: true,
      candidComposition: true,
      allowImperfectFocus: true,
      allowFlaresReflections: true,
      preferMicroMotion: true,
      filmScanTexture: true
    }
  }
};

export const DEFAULT_ANTI_AI = {
  level: 'medium',
  settings: { ...ANTI_AI_LEVELS.medium.settings },
  customRules: [],
  forbiddenPhrases: [
    'perfect skin',
    'flawless',
    'HDR',
    'hyper-realistic',
    'ultra-detailed',
    'glossy',
    'plastic'
  ]
};

// ═══════════════════════════════════════════════════════════════
// ANTI-AI PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build anti-AI prompt block from settings
 */
export function buildAntiAiPromptBlock(antiAi = DEFAULT_ANTI_AI) {
  const rules = [];
  const settings = antiAi.settings || ANTI_AI_LEVELS[antiAi.level]?.settings || DEFAULT_ANTI_AI.settings;
  
  // Core rules
  rules.push('Natural skin texture with visible pores, fine lines, and small imperfections.');
  rules.push('Real fabric behavior with natural wrinkles, folds, and drape.');
  rules.push('NOT too perfect, NOT too symmetrical — real people have asymmetry.');
  rules.push('NO plastic/waxy skin texture.');
  rules.push('NO HDR look or over-processed appearance.');
  rules.push('NO watermarks, text overlays, or captions.');
  
  // Conditional rules based on settings
  if (settings.allowExposureErrors) {
    rules.push('Allow subtle exposure variations — slight underexposure in shadows or hot highlights as natural film behavior.');
  }
  
  if (settings.allowMixedWhiteBalance) {
    rules.push('Allow mixed color temperatures in lighting — cool shadows, warm highlights as real environments have.');
  }
  
  if (settings.requireMicroDefects) {
    rules.push('Include micro-imperfections: slight dust on lens, tiny skin blemishes, stray hairs, fabric pills.');
  }
  
  if (settings.candidComposition) {
    rules.push('Composition can be slightly off-center or have minor elements at edges — not perfectly balanced.');
  }
  
  if (settings.allowImperfectFocus) {
    rules.push('Slight focus softness on non-subject areas is natural. Not everything needs to be tack-sharp.');
  }
  
  if (settings.allowFlaresReflections) {
    rules.push('Allow natural lens flares, light leaks, and reflections as proof of real light sources.');
  }
  
  if (settings.preferMicroMotion) {
    rules.push('Slight motion blur on hands, hair, or fabric suggests real movement. Product should remain sharp.');
  }
  
  if (settings.filmScanTexture) {
    rules.push('Add subtle film grain or scan texture — not digital perfection but organic image feel.');
  }
  
  // Forbidden phrases
  if (antiAi.forbiddenPhrases && antiAi.forbiddenPhrases.length > 0) {
    rules.push(`AVOID these aesthetic qualities: ${antiAi.forbiddenPhrases.join(', ')}.`);
  }
  
  return {
    preset: antiAi.level || 'medium',
    rules
  };
}

export default ANTI_AI_LEVELS;



