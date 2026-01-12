# AIDA Generation Logic v1.0

> **Полная документация логики генерации изображений**  
> Последнее обновление: 2026-01-12

---

## Содержание

1. [Философия системы](#1-философия-системы)
2. [Архитектура параметров (6 слоёв)](#2-архитектура-параметров-6-слоёв)
3. [Матрица конфликтов](#3-матрица-конфликтов)
4. [Логика естественности (Anti-AI)](#4-логика-естественности-anti-ai)
5. [Логика освещения](#5-логика-освещения)
6. [Логика композиции](#6-логика-композиции)
7. [Логика типов съёмки](#7-логика-типов-съёмки)
8. [Логика эскизов и поз](#8-логика-эскизов-и-поз)
9. [Сборка промпта](#9-сборка-промпта)
10. [Типичные ошибки и как их избежать](#10-типичные-ошибки-и-как-их-избежать)

---

## 1. Философия системы

### 1.1 Главная цель

**Создавать фотографии, неотличимые от работы профессионального фотографа.**

Не "красивые картинки", а именно *фотографии* — с естественными несовершенствами, 
реалистичным светом и физикой оптики.

### 1.2 Ключевые принципы

| Принцип | Описание |
|---------|----------|
| **Физическая достоверность** | Свет ведёт себя как в реальности. Нет "волшебных" источников. |
| **Оптическая честность** | Характеристики камеры/объектива последовательны. Нельзя совместить боке f/1.4 с резкостью всего кадра. |
| **Человеческое несовершенство** | Микро-ошибки композиции, лёгкий расфокус, естественные дефекты кожи. |
| **Нет конфликтующих инструкций** | Система должна блокировать взаимоисключающие параметры ДО генерации. |

### 1.3 Что делает фото "ИИшным" (ИЗБЕГАТЬ)

```
❌ Слишком идеальная кожа без пор
❌ HDR-эффект (нереалистичный динамический диапазон)
❌ Неестественно резкий фокус по всему кадру
❌ "Пластиковый" блеск на коже
❌ Идеально симметричная композиция
❌ Слишком интенсивные/театральные выражения лица
❌ Несовместимые характеристики камеры (iPhone + сильное боке)
❌ Свет "ниоткуда" без физического источника
❌ Микс студийного и естественного света без обоснования
```

---

## 2. Архитектура параметров (6 слоёв)

### 2.1 Иерархия слоёв

```
┌─────────────────────────────────────────────────────────────┐
│ СЛОЙ 1: ТИП СЪЁМКИ (Shoot Type)                             │
│ Определяет контекст и блокирует несовместимые параметры     │
├─────────────────────────────────────────────────────────────┤
│ СЛОЙ 2: ЭСТЕТИКА КАМЕРЫ (Camera Aesthetic)                  │
│ Плёнка/объектив/зерно — БЕЗ информации о свете              │
├─────────────────────────────────────────────────────────────┤
│ СЛОЙ 3: ИСТОЧНИК СВЕТА (Lighting Source)                    │
│ Откуда физически идёт свет                                  │
├─────────────────────────────────────────────────────────────┤
│ СЛОЙ 4: КАЧЕСТВО СВЕТА (Lighting Quality)                   │
│ Жёсткость, контраст, направленность                         │
├─────────────────────────────────────────────────────────────┤
│ СЛОЙ 5: КОМПОЗИЦИЯ (Composition)                            │
│ Крупность плана, ракурс, глубина резкости                   │
├─────────────────────────────────────────────────────────────┤
│ СЛОЙ 6: СИТУАЦИОННЫЕ (Ambient + Emotion)                    │
│ Погода, время суток, сезон, эмоция модели                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Правило приоритетов

**Верхние слои имеют приоритет над нижними.**

Если `shootType = catalog` блокирует `captureStyle = paparazzi`, то paparazzi недоступен, даже если пользователь его выберет.

### 2.3 Детали каждого слоя

#### СЛОЙ 1: Тип съёмки (Shoot Type)

| ID | Label | Описание | Defaults | Блокирует |
|----|-------|----------|----------|-----------|
| `editorial` | Editorial | Художественная съёмка для журналов | captureStyle: editorial_posed | — (всё разрешено) |
| `catalog` | Каталог | Чистые коммерческие снимки | captureStyle: editorial_relaxed, lightingSource: studio_strobe, antiAi: low | captureStyle: [paparazzi, motion_blur, through_window, caught_mid_blink], lightingSource: [mixed_ambient], lightingQuality: [harsh_direct] |
| `lookbook` | Lookbook | Презентация коллекции | captureStyle: editorial_relaxed, lightingSource: natural_soft, antiAi: low | captureStyle: [paparazzi, motion_blur] |
| `campaign` | Campaign | Рекламная кампания | captureStyle: editorial_posed, lightingSource: studio_strobe, antiAi: off | antiAi: [high] |
| `street` | Street | Уличная документальная | captureStyle: candid_unaware, lightingSource: natural_daylight, antiAi: high | captureStyle: [editorial_posed], lightingSource: [studio_strobe, ring_flash] |
| `portrait` | Портрет | Персональная съёмка | captureStyle: candid_aware, lightingSource: window_light | — |
| `beauty` | Beauty | Макияж и уход | captureStyle: editorial_posed, lightingSource: ring_flash, composition.shotSize: closeup | composition.shotSize: [wide_shot, full_shot] |
| `sport` | Спорт | Активная одежда | captureStyle: motion_blur_action, lightingSource: natural_daylight, lightingQuality: harsh_direct | captureStyle: [editorial_posed] |

#### СЛОЙ 2: Эстетика камеры (Camera Aesthetic)

**ВАЖНО**: Этот слой определяет ТОЛЬКО визуальный стиль плёнки/сенсора, НЕ освещение.

| ID | Label | Что определяет | Типичный DOF |
|----|-------|----------------|--------------|
| `contax_t2` | Contax T2 | Portra цвета, резкость Zeiss, органичное зерно | Shallow возможен |
| `hasselblad_mf` | Hasselblad MF | Creamy bokeh, extreme shallow DOF | Очень shallow |
| `leica_m` | Leica M | Documentary резкость, Tri-X зерно | Medium |
| `mamiya_rz67` | Mamiya RZ67 | Studio portrait quality | Shallow |
| `polaroid` | Polaroid | Soft focus, chemical bleeding, vignette | Deep (пластиковый объектив) |
| `disposable` | Одноразовая | Plastic lens softness, oversaturated | Deep |
| `holga` | Holga | Extreme vignetting, light leaks | Deep |
| `iphone` | iPhone | Computational HDR, oversharpened | Deep (маленький сенсор) |
| `ricoh_gr` | Ricoh GR | 28mm wide, high contrast | Deep |

**Implied правила для Camera Aesthetic:**

```
iphone + focus: shallow → КОНФЛИКТ (маленький сенсор не даёт сильного боке)
disposable + focus: shallow → КОНФЛИКТ
holga + любой skinTexture кроме soft → КОНФЛИКТ (пластиковая оптика всё смягчает)
```

#### СЛОЙ 3: Источник света (Lighting Source)

| ID | Label | Физический источник | Implies |
|----|-------|---------------------|---------|
| `natural_daylight` | Естественный дневной | Солнце / небо | — |
| `window_light` | Свет из окна | Окно как рассеиватель | — |
| `on_camera_flash` | Накамерная вспышка | Встроенная/внешняя вспышка | lightingQuality: harsh_direct |
| `studio_strobe` | Студийный импульс | Профессиональные вспышки | — |
| `ring_flash` | Кольцевая вспышка | Ring light / ring flash | lightingQuality: flat |
| `mixed_ambient` | Смешанный ambient | Несколько источников разной температуры | — |
| `practicals` | Практические источники | Лампы, неон в кадре | — |
| `continuous_led` | Постоянный LED | Видеосвет | — |

**Implied правила (автоматическая блокировка):**

```
on_camera_flash → lightingQuality ЗАБЛОКИРОВАН на harsh_direct
ring_flash → lightingQuality ЗАБЛОКИРОВАН на flat
```

#### СЛОЙ 4: Качество света (Lighting Quality)

| ID | Label | Характеристики |
|----|-------|----------------|
| `harsh_direct` | Жёсткий прямой | Hard-edged shadows, high contrast, specular highlights |
| `soft_diffused` | Мягкий рассеянный | Gentle shadow falloff, wrap-around, flattering |
| `contrasty` | Контрастный | High light-to-shadow ratio, deep shadows |
| `flat` | Плоский | Minimal shadows, even illumination |
| `backlit` | Контровой | Light behind subject, rim light, flare potential |
| `moody_lowkey` | Low-key / Moody | Predominantly dark, selective highlights |

**Конфликты Lighting Quality ↔ Lighting Source:**

| Quality | Несовместим с Source |
|---------|---------------------|
| `soft_diffused` | `on_camera_flash` (on-camera всегда жёсткий) |
| `harsh_direct` | `studio_strobe` с модификаторами (но можно с bare bulb) |

#### СЛОЙ 5: Композиция (Composition)

##### Shot Size (Крупность плана)

| ID | Label | Что в кадре |
|----|-------|-------------|
| `extreme_closeup` | Макро | Только часть лица (глаза, губы) |
| `closeup` | Крупный | Лицо и шея |
| `medium_closeup` | Портретный | По грудь |
| `medium_shot` | Средний | По пояс |
| `cowboy_shot` | Американский | По колено |
| `full_shot` | Ростовой | Весь рост |
| `wide_shot` | Общий | Фигура + много окружения |

##### Camera Angle (Ракурс)

| ID | Label | Эффект |
|----|-------|--------|
| `eye_level` | На уровне глаз | Нейтральный, естественный |
| `low_angle` | Нижний | Героический, доминирующий |
| `high_angle` | Верхний | Уязвимый, маленький |
| `overhead` | Сверху вниз | Графический, flatlay |
| `dutch_angle` | Завал | Динамика, напряжение |
| `selfie` | Селфи | Arm's length, слегка сверху |

##### Focus Mode (Глубина резкости)

| ID | Label | f-stop | Эффект |
|----|-------|--------|--------|
| `shallow` | Размытый фон | f/1.4 - f/2.8 | Сильное боке, разделение |
| `deep` | Всё в резкости | f/8 - f/11 | Чёткий фон |
| `focus_face` | Фокус на лице | f/2.0 - f/4 | Уши и фон размыты |
| `soft_focus` | Мягкий фокус | + diffusion filter | Dreamy, glow |

**Конфликты Focus ↔ Camera Aesthetic:**

```
iphone + shallow → ⚠️ ПРЕДУПРЕЖДЕНИЕ: "iPhone не даёт сильного боке"
disposable + shallow → ❌ ЗАБЛОКИРОВАНО
holga + deep → ❌ ЗАБЛОКИРОВАНО (пластик не резкий)
```

#### СЛОЙ 6: Ситуационные параметры

##### Time of Day (Время суток)

| ID | Label | Влияние на свет |
|----|-------|-----------------|
| `any` | Любое | Не указывается |
| `sunrise` | Рассвет | Тёплый розовый, низкий угол |
| `golden_hour` | Золотой час | Оранжево-золотой, длинные тени |
| `midday` | Полдень | Жёсткий верхний свет, короткие тени |
| `afternoon` | День | Нейтральный дневной |
| `sunset` | Закат | Красно-оранжевый, драматичное небо |
| `blue_hour` | Синий час | Холодный синий, городские огни |
| `night` | Ночь | Искусственные источники |

**Конфликты Time of Day ↔ Lighting Source:**

```
night + natural_daylight → ❌ ЗАБЛОКИРОВАНО
midday + window_light → ⚠️ Странное сочетание (окно = интерьер, полдень = экстерьер)
```

##### Weather (Погода)

| ID | Влияние на свет |
|----|-----------------|
| `clear` | Жёсткий свет, чистые тени |
| `overcast` | Мягкий рассеянный свет, нет теней |
| `fog` / `mist` | Атмосферное рассеивание, glow |
| `rain` | Отражения, мокрые поверхности |

**Конфликты Weather ↔ Lighting Quality:**

```
overcast + harsh_direct → ❌ КОНФЛИКТ (облачность = мягкий свет)
clear + soft_diffused → ⚠️ Возможно только с diffuser/shade
```

---

## 3. Матрица конфликтов

### 3.1 Полная таблица конфликтов

#### Shoot Type → блокирует

| Shoot Type | Блокирует Capture Style | Блокирует Lighting | Блокирует другое |
|------------|------------------------|-------------------|------------------|
| `catalog` | paparazzi, motion_blur, through_window, caught_mid_blink | mixed_ambient | lightingQuality: harsh_direct |
| `street` | editorial_posed | studio_strobe, ring_flash | — |
| `campaign` | — | — | antiAi: high |
| `beauty` | — | — | shotSize: wide_shot, full_shot |
| `sport` | editorial_posed | — | — |

#### Lighting Source → implies

| Source | Автоматически устанавливает |
|--------|----------------------------|
| `on_camera_flash` | lightingQuality = `harsh_direct` (ЗАБЛОКИРОВАНО) |
| `ring_flash` | lightingQuality = `flat` (ЗАБЛОКИРОВАНО) |

#### Camera Aesthetic → конфликтует с Focus

| Camera | Запрещённый Focus |
|--------|------------------|
| `iphone` | `shallow` (только предупреждение) |
| `disposable` | `shallow` |
| `holga` | `deep` |
| `polaroid` | `shallow` |

#### Weather → конфликтует с Lighting Quality

| Weather | Запрещённый Quality |
|---------|-------------------|
| `overcast` | `harsh_direct` |
| `fog` | `harsh_direct`, `contrasty` |

#### Time of Day → конфликтует с Lighting Source

| Time | Запрещённый Source |
|------|-------------------|
| `night` | `natural_daylight` |

### 3.2 Implied-связи (автоматические установки)

```javascript
// Псевдокод логики
if (lightingSource === 'on_camera_flash') {
  lightingQuality = 'harsh_direct'; // LOCKED
  lightingQualityLocked = true;
}

if (lightingSource === 'ring_flash') {
  lightingQuality = 'flat'; // LOCKED
  lightingQualityLocked = true;
}

if (shootType === 'beauty') {
  if (!shotSize || shotSize === 'default') {
    shotSize = 'closeup'; // DEFAULT
  }
}

if (weather === 'overcast') {
  if (lightingQuality === 'harsh_direct') {
    showWarning('Облачность не даёт жёстких теней');
    lightingQuality = 'soft_diffused'; // AUTO-CORRECT
  }
}
```

---

## 4. Логика естественности (Anti-AI)

### 4.1 Три уровня Anti-AI

| Уровень | Описание | Когда использовать |
|---------|----------|-------------------|
| `off` | Никаких ограничений | Campaign, реклама, идеальные картинки |
| `low` | Минимальные несовершенства | Catalog, lookbook |
| `medium` | Естественный look | Editorial, portrait |
| `high` | Максимальная аутентичность | Street, documentary |

### 4.2 Что включает каждый уровень

#### Anti-AI: HIGH

```
✓ Микро-motion blur на руках/волосах
✓ Лёгкие ошибки экспозиции (±0.3 EV)
✓ Смешанный баланс белого от разных источников
✓ Поры, мелкие дефекты кожи ОБЯЗАТЕЛЬНЫ
✓ Лёгкий расфокус на краях кадра
✓ Блики и отражения в объективе
✓ Текстура плёночного зерна
✓ Несовершенная композиция (не по центру, лёгкий наклон)
```

#### Anti-AI: MEDIUM

```
✓ Естественная текстура кожи
✓ Некоторые несовершенства допускаются
✓ Лёгкое зерно
```

#### Anti-AI: LOW

```
✓ Чистый коммерческий look
✓ Минимальные дефекты
✓ Всё равно НЕ пластиковая кожа
```

### 4.3 Правила для Skin Texture

| Skin Texture | Совместим с Anti-AI | Несовместим |
|--------------|--------------------|--------------| 
| `hyper_real` | high | off, low (слишком много деталей для commercial) |
| `natural_film` | medium, high | — |
| `flash_specular` | любой | — |
| `matte_editorial` | low, medium | high (слишком "сделанный") |
| `raw_unretouched` | high | off, low |

### 4.4 Что НИКОГДА не должно быть в промпте

```
❌ "perfect skin"
❌ "flawless"
❌ "HDR"
❌ "glossy"
❌ "plastic"
❌ "airbrushed"
❌ "smooth skin"
❌ "4K ultra detailed" (без контекста)
❌ "hyper realistic" (без добавления несовершенств)
```

---

## 5. Логика освещения

### 5.1 Матрица Source × Quality

| Source ↓ / Quality → | harsh_direct | soft_diffused | contrasty | flat | backlit | moody |
|---------------------|--------------|---------------|-----------|------|---------|-------|
| `natural_daylight` | ✓ (солнце) | ✓ (облака/тень) | ✓ | ✗ | ✓ | ✗ |
| `window_light` | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ |
| `on_camera_flash` | ✓ LOCKED | ✗ | ✗ | ✗ | ✗ | ✗ |
| `studio_strobe` | ✓ (bare) | ✓ (softbox) | ✓ | ✓ (beauty dish) | ✓ | ✓ |
| `ring_flash` | ✗ | ✗ | ✗ | ✓ LOCKED | ✗ | ✗ |
| `mixed_ambient` | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| `practicals` | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| `continuous_led` | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ |

### 5.2 Влияние Location на Lighting Source

| Location SpaceType | Рекомендуемый Source | Недопустимый Source |
|-------------------|---------------------|---------------------|
| `studio` | studio_strobe, continuous_led, ring_flash | natural_daylight |
| `interior_*` | window_light, practicals, mixed_ambient | — |
| `exterior_*` | natural_daylight | studio_strobe |
| `rooftop_terrace` | natural_daylight | studio_strobe (если не указано иначе) |

### 5.3 Влияние Time of Day на освещение

| Time of Day | Рекомендуемый Quality | Цветовая температура |
|-------------|----------------------|---------------------|
| `sunrise` | soft_diffused, backlit | Тёплая (3500K) |
| `golden_hour` | soft_diffused, backlit, contrasty | Очень тёплая (3200K) |
| `midday` | harsh_direct | Нейтральная (5500K) |
| `afternoon` | soft_diffused, contrasty | Нейтральная |
| `sunset` | backlit, contrasty | Тёплая-красная |
| `blue_hour` | soft_diffused, moody | Холодная (7000K+) |
| `night` | contrasty, moody | Зависит от источника |

### 5.4 Автоматические корректировки

```javascript
// Если выбран midday + exterior
if (timeOfDay === 'midday' && location.spaceType.startsWith('exterior')) {
  if (lightingQuality !== 'harsh_direct') {
    suggestChange('lightingQuality', 'harsh_direct', 
      'Полуденное солнце = жёсткий свет');
  }
}

// Если overcast погода
if (weather === 'overcast') {
  if (lightingQuality === 'harsh_direct') {
    autoCorrect('lightingQuality', 'soft_diffused',
      'Облачность рассеивает свет');
  }
}
```

---

## 6. Логика композиции

### 6.1 Взаимодействие с Pose Adherence

| Pose Adherence | Что определяет эскиз | Можно менять |
|----------------|---------------------|--------------|
| 1 — Свободно | Только тип позы (стоя/сидя) | Всё: shotSize, angle, focus |
| 2 — Похоже | 30-40% позы | Всё: shotSize, angle, focus |
| 3 — Близко | 70-80% позы | Всё, но с учётом позы |
| 4 — Точно | Поза И кадрирование | ❌ ЗАБЛОКИРОВАНО |

**Правило**: При `poseAdherence = 4` контролы композиции (shotSize, cameraAngle, focusMode) деактивируются. Эскиз полностью определяет кадрирование.

### 6.2 Рекомендации Focus по Shot Size

| Shot Size | Рекомендуемый Focus | Причина |
|-----------|--------------------|---------| 
| `extreme_closeup` | `focus_face`, `shallow` | Разделение с фоном |
| `closeup` | `focus_face`, `shallow` | Фокус на глазах |
| `medium_closeup` | `shallow`, `focus_face` | Портретное разделение |
| `medium_shot` | `shallow`, `deep` | Зависит от контекста |
| `full_shot` | `deep` | Видеть одежду целиком |
| `wide_shot` | `deep` | Показать окружение |

### 6.3 Конфликты Composition

```
extreme_closeup + poseDescription: "full body dynamic lean" → КОНФЛИКТ
wide_shot + focusMode: shallow → ⚠️ ПРЕДУПРЕЖДЕНИЕ (shallow на wide = странно)
overhead + poseType: walking → КОНФЛИКТ (ходьба сверху неестественна)
```

---

## 7. Логика типов съёмки

### 7.1 Рекомендуемые комбинации по Shoot Type

#### Editorial

```yaml
captureStyle: editorial_posed | editorial_relaxed
cameraAesthetic: любой
lightingSource: любой
lightingQuality: любой
skinTexture: любой
antiAi: medium | high
```

#### Catalog

```yaml
captureStyle: editorial_relaxed | candid_aware
cameraAesthetic: contax_t2 | hasselblad_mf | neutral
lightingSource: studio_strobe | natural_soft | window_light
lightingQuality: soft_diffused | flat
skinTexture: natural_film | matte_editorial
antiAi: low | off
shotSize: full_shot | medium_shot (показать одежду)
```

#### Lookbook

```yaml
captureStyle: editorial_relaxed | candid_aware
cameraAesthetic: contax_t2 | mamiya_rz67
lightingSource: natural_daylight | window_light
lightingQuality: soft_diffused | contrasty
skinTexture: natural_film
antiAi: low | medium
```

#### Street

```yaml
captureStyle: candid_unaware | paparazzi_telephoto
cameraAesthetic: leica_m | ricoh_gr | disposable
lightingSource: natural_daylight | mixed_ambient
lightingQuality: harsh_direct | contrasty
skinTexture: raw_unretouched | natural_film
antiAi: high
```

#### Beauty

```yaml
captureStyle: editorial_posed
cameraAesthetic: hasselblad_mf | mamiya_rz67
lightingSource: ring_flash | studio_strobe
lightingQuality: flat | soft_diffused
skinTexture: matte_editorial | natural_film
antiAi: low | medium
shotSize: closeup | extreme_closeup
```

---

## 8. Логика эскизов и поз

### 8.1 Что содержит Frame

```typescript
interface Frame {
  id: string;
  label: string;
  description: string;  // Текстовое описание позы
  
  technical: {
    shotSize: string;        // Рекомендация (может быть переопределена)
    cameraAngle: string;     // Рекомендация (может быть переопределена)
    poseType: string;        // static | dynamic | walking | sitting...
    poseDescription: string; // Детальное описание положения тела
    composition: string;     // centered | rule_of_thirds | asymmetrical
    focusPoint: string;      // face | hands | product
  };
  
  sketchUrl?: string;  // Изображение-эскиз позы
}
```

### 8.2 Как используется Frame в генерации

```
1. Если есть sketchUrl → отправляется как референс позы
2. poseAdherence определяет насколько строго следовать эскизу
3. Если poseAdherence < 4:
   - technical.shotSize и cameraAngle — только рекомендации
   - Пользователь может переопределить в UI
4. Если poseAdherence = 4:
   - Всё из technical копируется в hardRules
   - UI composition controls заблокированы
5. poseDescription и description → ВСЕГДА включаются в промпт
```

### 8.3 Правило для эскизов без изображения

Если `sketchUrl` отсутствует, используется только текстовое описание:

```
- poseType определяет общую категорию (dynamic, static, sitting...)
- poseDescription даёт детали
- Пользователь имеет полный контроль над композицией
```

---

## 9. Сборка промпта

### 9.1 Порядок блоков в JSON

```javascript
const promptJson = {
  // 1. МЕТА
  format: "aida_custom_shoot_v1",
  formatVersion: 1,
  generatedAt: ISO_TIMESTAMP,
  
  // 2. ЖЁСТКИЕ ПРАВИЛА (нарушать нельзя)
  hardRules: [
    "Return photorealistic images...",
    "Natural skin texture...",
    "No watermarks...",
    // + динамически добавляемые правила
  ],
  
  // 3. ВИЗУАЛЬНЫЙ СТИЛЬ (в порядке приоритета)
  visualStyle: "SHOOT TYPE: ...\n\nCAMERA AESTHETIC: ...\n\nLIGHTING SOURCE: ...\n\nLIGHTING QUALITY: ...\n\nCAPTURE STYLE: ...\n\nCOLOR: ...\n\nSKIN & TEXTURE: ...\n\nERA: ...",
  
  // 4. LOCKS (если есть)
  styleLock: { ... } | null,
  locationLock: { ... } | null,
  
  // 5. FRAME / POSE
  frame: { label, description, technical },
  poseReference: { hasSketch, adherenceLevel, rules },
  
  // 6. LOCATION
  location: { label, description, spaceType },
  
  // 7. AMBIENT (если exterior)
  ambient: { timeOfDay, weather, season, atmosphere, prompt },
  
  // 8. EMOTION
  emotion: { label, promptBlock, avoid, globalRules },
  
  // 9. IDENTITY
  identity: { hasRefs, rules, description },
  
  // 10. CLOTHING
  clothing: { hasRefs, rules, notes },
  
  // 11. COMPOSITION
  composition: { shotSize, angle, focus },
  
  // 12. ANTI-AI
  antiAi: "ANTI-AI AESTHETIC (LEVEL): ...",
  
  // 13. ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ
  extraPrompt: "..." | null
};
```

### 9.2 Приоритеты при конфликте

```
1. hardRules — АБСОЛЮТНЫЙ приоритет
2. styleLock / locationLock — если активен
3. Composition (если poseAdherence < 4)
4. Frame.technical (если poseAdherence = 4)
5. visualStyle
6. ambient
7. extraPrompt
```

### 9.3 Что НЕ должно попасть в промпт

```
❌ Конфликтующие инструкции (проверяются до сборки)
❌ Пустые блоки
❌ Дублирующиеся инструкции
❌ "perfect", "flawless", "HDR" (если antiAi > off)
```

---

## 10. Типичные ошибки и как их избежать

### 10.1 Ошибка: "ИИшная" кожа

**Причина**: `skinTexture: hyper_real` + `antiAi: low`

**Решение**: 
- Либо `skinTexture: natural_film`
- Либо `antiAi: high`
- Никогда не использовать `hyper_real` с коммерческим shootType

### 10.2 Ошибка: Нереалистичное боке

**Причина**: `cameraAesthetic: iphone` + `focus: shallow`

**Решение**:
- iPhone = `focus: deep` или `focus_face` (вычислительный портрет)
- Для сильного боке использовать `contax_t2` или `hasselblad_mf`

### 10.3 Ошибка: Конфликт света и погоды

**Причина**: `weather: overcast` + `lightingQuality: harsh_direct`

**Решение**: Система должна автоматически переключать на `soft_diffused`

### 10.4 Ошибка: Слишком "режиссированный" look

**Причина**: `captureStyle: editorial_posed` + слишком интенсивная эмоция

**Решение**:
- Для editorial лучше `editorial_relaxed`
- Или снизить интенсивность эмоции
- Всегда помнить правило: "caught, not posed"

### 10.5 Ошибка: Несовместимый shotSize и поза

**Причина**: `frame.poseDescription: "full body lean"` + `composition.shotSize: closeup`

**Решение**:
- Либо менять shotSize
- Либо менять frame
- Система должна предупреждать о конфликте

---

## Changelog

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0 | 2026-01-12 | Первая версия документа |

---

*Документ поддерживается в актуальном состоянии. При изменении логики генерации — обновлять этот файл.*

