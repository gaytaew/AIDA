/**
 * Director Service (V6 AI-Режиссёр)
 * 
 * AI-powered style analysis and refinement using GPT-5.2.
 * Analyzes reference images to extract professional photography parameters.
 * Supports iterative refinement via natural language instructions.
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPTS (AIDA CORE PRINCIPLES)
// ═══════════════════════════════════════════════════════════════

const ANALYSIS_SYSTEM_PROMPT = `Ты — AI-эксперт по анализу профессиональной фотографии. Твоя задача — извлечь ТЕХНИЧЕСКИЕ ПАРАМЕТРЫ из референсного изображения.

## КЛЮЧЕВЫЕ ПРИНЦИПЫ (AIDA CORE)

### 1. ANTI-AI GUARDRAILS
Твой анализ должен ПРЕДОТВРАЩАТЬ «пластиковый» AI-look:
- Описывай текстуры кожи через РЕАЛЬНЫЕ термины: «видимые поры», «естественные неровности», «отсутствие ретуши».
- Избегай описаний, ведущих к гладкости: НЕ используй слова «безупречный», «идеальный», «гладкий» применительно к коже.
- При описании освещения указывай ФИЗИЧЕСКИЕ источники (окно, стробоскоп, свеча), а не абстрактные («красивый свет»).

### 2. FACIAL EXPRESSION STABILITY
- Описывай выражения лица как «CAUGHT» (схваченные), а не «POSED» (позируемые).
- Указывай ИНТЕНСИВНОСТЬ эмоции (30% от визуального впечатления) — предотвращает театральность.
- Если видна улыбка — опиши как «сдержанная», «асимметричная», «естественная», НЕ как «широкая» или «сияющая».

### 3. SKIN REALISM (Таблица стандартов)
| Тип | Описание для промпта |
|-----|---------------------|
| Natural | Видимые поры, лёгкая неровность, без сглаживания |
| Studio | Чистый тон, но текстура сохранена |
| Raw Analog | Зернистость, высокий микроконтраст |
| Hyper-Realistic | Экстремальная детализация пор, пушковые волосы |

### 4. ПРОФЕССИОНАЛЬНЫЕ СТАНДАРТЫ (из официальных гайдов)
Используй терминологию из:
- **ARRI Lighting Handbook**: схемы света (Rembrandt, Loop, Butterfly)
- **Hasselblad Masters**: описание оптики среднего формата
- **Kodak Film Reference**: эмуляция плёночных стоков (Portra 400, Ektar 100)
- **Phase One IQ Style Guide**: цветокоррекция и тональность

## ФОРМАТ ОТВЕТА (JSON)
{
  "technicalParams": {
    "lens": "85mm f/1.4 (Canon L-series equivalent)",
    "aperture": "f/2.0 — shallow DoF with subject isolation",
    "lighting": {
      "schema": "Rembrandt 3-point",
      "keyLight": "Large softbox at 45° camera-left",
      "fillRatio": "1:3 (dramatic shadows)",
      "backlight": "Rim light for hair separation"
    },
    "colorGrade": {
      "temperature": "5600K (daylight neutral)",
      "tint": "Slight magenta push in shadows",
      "contrast": "Medium-low, lifted blacks",
      "saturation": "Desaturated by 10%"
    },
    "filmEmulation": "Kodak Portra 400 — warm mids, low grain",
    "skinTexture": "Natural — visible pores, no smoothing"
  },
  "naturalPrompt": "[Полное описание для генерации, 2-3 предложения на английском]",
  "antiAiDirectives": ["Avoid plastic skin", "No perfect symmetry", "Maintain micro-texture"],
  "suggestedName": "[Краткое название стиля на русском, 2-4 слова]",
  "variations": [
    { "id": "bw", "label": "Ч/Б", "promptSuffix": "black and white, desaturated, high contrast" },
    { "id": "warm", "label": "Тёплый", "promptSuffix": "warm color temperature, golden hour tones" },
    { "id": "cold", "label": "Холодный", "promptSuffix": "cool blue tones, winter atmosphere" }
  ]
}

## ВАЖНО
- Отвечай ТОЛЬКО в формате JSON.
- naturalPrompt должен быть на АНГЛИЙСКОМ языке (для генерации изображений).
- suggestedName должен быть на РУССКОМ языке (для UI).
- variations — массив из 2-4 вариаций стиля. Каждая вариация: id (латиница), label (русский), promptSuffix (английский модификатор).
- Если какой-то параметр неопределим — укажи "indeterminate" и предположительный диапазон.
- Всегда включай раздел antiAiDirectives.`;

const REFINE_SYSTEM_PROMPT = `Ты — AI-стилист и арт-директор. Твоя задача — модифицировать существующий стиль фотографии на основе инструкции пользователя.

## ПРАВИЛА МОДИФИКАЦИИ

1. **Сохраняй структуру JSON** — не меняй формат, только значения.
2. **Применяй инструкцию консервативно** — меняй только те параметры, которые явно затрагивает инструкция.
3. **Следуй AIDA CORE принципам**:
   - Никогда не добавляй «пластиковые» описания кожи
   - Сохраняй физическую терминологию освещения
   - Избегай театральных выражений лица
4. **Обновляй naturalPrompt** в соответствии с изменениями параметров.
5. **Добавляй в antiAiDirectives** любые новые защиты от AI-артефактов.

## ФОРМАТ ОТВЕТА
Верни обновлённый JSON с той же структурой, что и входной.
Добавь поле "refinementNote": "[краткое описание изменений]" для отладки.`;

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze a reference image to extract style parameters
 * @param {{base64: string, mimeType: string}} image - The reference image
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function analyzeStyle(image) {
    if (!image?.base64) {
        return { ok: false, error: 'Изображение не предоставлено' };
    }

    if (!process.env.OPENAI_API_KEY) {
        return { ok: false, error: 'OpenAI API key не настроен' };
    }

    try {
        console.log('[DirectorService] Analyzing reference image with GPT-5.2...');

        const response = await openai.chat.completions.create({
            model: 'gpt-5.2', // GPT-5.2 as requested
            messages: [
                {
                    role: 'system',
                    content: ANALYSIS_SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Проанализируй это изображение и извлеки технические параметры съёмки.' },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${image.mimeType};base64,${image.base64}`,
                                detail: 'high'
                            }
                        }
                    ]
                }
            ],
            max_completion_tokens: 2000,
            temperature: 0.3 // Lower for consistent technical analysis
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            return { ok: false, error: 'Пустой ответ от OpenAI' };
        }

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[DirectorService] Failed to parse JSON:', content);
            return { ok: false, error: 'Не удалось распарсить результат анализа' };
        }

        const result = JSON.parse(jsonMatch[0]);

        console.log('[DirectorService] Analysis complete:', result.suggestedName);

        return {
            ok: true,
            data: {
                technicalParams: result.technicalParams || {},
                naturalPrompt: result.naturalPrompt || '',
                antiAiDirectives: result.antiAiDirectives || [],
                suggestedName: result.suggestedName || 'Новый стиль',
                variations: result.variations || []  // V6: Auto-generated variations
            }
        };

    } catch (error) {
        console.error('[DirectorService] Analysis error:', error);
        return { ok: false, error: error.message || 'Ошибка анализа' };
    }
}

/**
 * Refine an existing style preset based on user instruction
 * @param {Object} currentPreset - The current preset data
 * @param {string} instruction - User's refinement instruction
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function refineStyle(currentPreset, instruction) {
    if (!currentPreset) {
        return { ok: false, error: 'Пресет не предоставлен' };
    }

    if (!instruction?.trim()) {
        return { ok: false, error: 'Инструкция не предоставлена' };
    }

    if (!process.env.OPENAI_API_KEY) {
        return { ok: false, error: 'OpenAI API key не настроен' };
    }

    try {
        console.log('[DirectorService] Refining style with instruction:', instruction);

        // Build the current state for the model
        const currentState = {
            technicalParams: currentPreset.technicalParams || {},
            naturalPrompt: currentPreset.naturalPrompt || '',
            antiAiDirectives: currentPreset.antiAiDirectives || []
        };

        const response = await openai.chat.completions.create({
            model: 'gpt-5.2',
            messages: [
                {
                    role: 'system',
                    content: REFINE_SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: `Текущий стиль:\n\`\`\`json\n${JSON.stringify(currentState, null, 2)}\n\`\`\`\n\nИнструкция пользователя: "${instruction}"\n\nПримени изменения и верни обновлённый JSON.`
                }
            ],
            max_completion_tokens: 2000,
            temperature: 0.4 // Slightly higher for creative interpretation
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            return { ok: false, error: 'Пустой ответ от OpenAI' };
        }

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[DirectorService] Failed to parse refinement JSON:', content);
            return { ok: false, error: 'Не удалось распарсить результат уточнения' };
        }

        const result = JSON.parse(jsonMatch[0]);

        console.log('[DirectorService] Refinement complete:', result.refinementNote || 'done');

        return {
            ok: true,
            data: {
                technicalParams: result.technicalParams || currentState.technicalParams,
                naturalPrompt: result.naturalPrompt || currentState.naturalPrompt,
                antiAiDirectives: result.antiAiDirectives || currentState.antiAiDirectives,
                refinementNote: result.refinementNote || null
            }
        };

    } catch (error) {
        console.error('[DirectorService] Refinement error:', error);
        return { ok: false, error: error.message || 'Ошибка уточнения' };
    }
}

export default { analyzeStyle, refineStyle };
