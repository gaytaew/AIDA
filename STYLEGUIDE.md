# AIDA Style Guide

## Общие принципы

1. **Модульность** — каждая функция в отдельном модуле
2. **Простота** — не усложняй без необходимости
3. **Читаемость** — код должен быть понятен без комментариев
4. **Консистентность** — один стиль во всём проекте

## JavaScript / Node.js

### ES Modules

Используем ES Modules (`import`/`export`), не CommonJS:

```javascript
// ✅ Правильно
import express from 'express';
export function myFunction() {}
export default router;

// ❌ Неправильно
const express = require('express');
module.exports = myFunction;
```

### Именование

```javascript
// Файлы: kebab-case
// shootConfig.js, universeRoutes.js

// Функции: camelCase
function validateShootConfig() {}
function generateFrameId() {}

// Константы: UPPER_SNAKE_CASE
const DEFAULT_ANTI_AI = {};
const MAX_MODELS = 3;

// Классы: PascalCase (если используются)
class ShootValidator {}
```

### Структура файла

```javascript
/**
 * Описание модуля
 */

// 1. Импорты
import express from 'express';
import { validateFrame } from '../schema/frame.js';

// 2. Константы
const DEFAULT_VALUE = 'default';

// 3. Вспомогательные функции
function helperFunction() {}

// 4. Основные функции / экспорты
export function mainFunction() {}

// 5. Дефолтный экспорт (если нужен)
export default router;
```

### Async/Await

```javascript
// ✅ Правильно
async function loadData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Failed to load:', err);
    throw err;
  }
}

// ❌ Избегай callback hell
fetch('/api/data')
  .then(res => res.json())
  .then(data => {
    // ...
  })
  .catch(err => {
    // ...
  });
```

### Объекты и деструктуризация

```javascript
// ✅ Правильно
const { id, label, universe } = shootConfig;
const models = shootConfig.models || [];

// Spread для копирования
const updated = { ...original, label: 'New Label' };

// ❌ Избегай мутаций
original.label = 'New Label'; // Мутация!
```

## API Responses

Все API возвращают консистентный формат:

```javascript
// Успех
res.json({
  ok: true,
  data: { /* ... */ }
});

// Успех со списком
res.json({
  ok: true,
  data: [ /* ... */ ],
  total: 42
});

// Ошибка
res.status(400).json({
  ok: false,
  error: 'Описание ошибки'
});
```

## CSS / Frontend

### CSS Variables

Используем CSS переменные для консистентности:

```css
:root {
  --color-bg: #0A0A0A;
  --color-accent: #E94560;
  --radius-md: 12px;
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.button {
  background: var(--color-accent);
  border-radius: var(--radius-md);
}
```

### BEM-подобное именование

```css
/* Блок */
.dashboard-card { }

/* Элемент */
.dashboard-card-title { }
.dashboard-card-icon { }

/* Модификатор */
.dashboard-card-icon.purple { }
.nav-item.active { }
```

### HTML

```html
<!-- Семантичные теги -->
<header class="page-header">
<nav class="sidebar-nav">
<main class="main">
<section class="section">

<!-- Атрибуты в порядке -->
<button 
  type="button" 
  class="btn btn-primary" 
  id="submit-btn"
  disabled
>
  Submit
</button>
```

## Валидация

Каждая схема имеет функцию валидации:

```javascript
export function validateFrame(frame) {
  const errors = [];

  if (!frame || typeof frame !== 'object') {
    errors.push('Frame must be an object');
    return { valid: false, errors };
  }

  if (!frame.id || typeof frame.id !== 'string') {
    errors.push('Frame must have a string id');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Комментарии

```javascript
// Однострочные — для коротких пояснений
const maxModels = 3; // Hard limit from API

/**
 * Многострочные — для описания функций
 * @param {Object} config - Shoot configuration
 * @returns {boolean} - Whether outfit avatar is required
 */
function shouldRequireOutfitAvatar(config) {}

// TODO: для будущих задач
// TODO: Implement universe store

// FIXME: для известных проблем
// FIXME: Handle edge case when models array is empty
```

## Git Commits

Формат: `type: description`

Типы:
- `feat:` — новая функциональность
- `fix:` — исправление бага
- `chore:` — рутинные изменения
- `refactor:` — рефакторинг без изменения поведения
- `docs:` — документация
- `style:` — форматирование, без изменения логики

```
feat: add universe editor page
fix: correct validation for empty frames array
chore: update dependencies
docs: add API endpoints to ARCHITECTURE.md
```

## Не делай

1. ❌ Не хардкодь URL и ключи — используй `config.js`
2. ❌ Не мутируй объекты — используй spread
3. ❌ Не игнорируй ошибки — всегда обрабатывай catch
4. ❌ Не создавай гигантские файлы — разбивай на модули
5. ❌ Не коммить секреты — используй `.env`

