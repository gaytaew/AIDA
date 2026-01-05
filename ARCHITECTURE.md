# AIDA Architecture

## Обзор

AIDA — модульный конструктор fashion-съёмок. Проект построен по принципу "1 сущность = 1 модуль" для максимальной гибкости и простоты изменений.

## Структура проекта

```
aida/
├── package.json              # Зависимости и скрипты
├── ARCHITECTURE.md           # Это описание
├── STYLEGUIDE.md             # Стиль кода
├── .env.example              # Пример переменных окружения
│
└── src/
    ├── backend/
    │   ├── server.js         # Точка входа Express
    │   ├── config.js         # Переменные окружения
    │   │
    │   ├── schema/           # Схемы данных (валидация, типы)
    │   │   ├── shootConfig.js
    │   │   ├── universe.js
    │   │   ├── frame.js
    │   │   └── model.js
    │   │
    │   ├── routes/           # HTTP маршруты
    │   │   ├── healthRoutes.js
    │   │   ├── universeRoutes.js
    │   │   ├── frameRoutes.js
    │   │   ├── modelRoutes.js
    │   │   └── shootRoutes.js
    │   │
    │   ├── services/         # Бизнес-логика (TODO)
    │   │   ├── promptBuilder.js
    │   │   ├── shootValidator.js
    │   │   └── imageGenerator.js
    │   │
    │   ├── store/            # Файловое хранилище
    │   │   ├── universes/    # JSON-файлы вселенных
    │   │   ├── frames/       # JSON-файлы кадров
    │   │   ├── models/       # JSON-файлы моделей
    │   │   ├── shoots/       # JSON-файлы съёмок
    │   │   └── assets/       # Референсы, эскизы
    │   │
    │   └── providers/        # Внешние API (TODO)
    │       ├── geminiClient.js
    │       └── openaiClient.js
    │
    └── frontend/
        ├── index.html        # Dashboard
        ├── styles.css        # Design system
        │
        ├── composer/         # Главный конструктор
        │   ├── shoot-composer.html
        │   ├── shoot-composer.js
        │   └── modules/      # UI-модули конструктора
        │
        ├── editors/          # Редакторы сущностей
        │   ├── universe-editor.html
        │   ├── frame-editor.html
        │   └── model-editor.html
        │
        └── shared/           # Переиспользуемые модули
            ├── api.js
            ├── components.js
            └── utils.js
```

## Ключевые сущности

### 1. ShootConfig (Конфигурация съёмки)

Главная сущность — собранный JSON со всей информацией о съёмке:

```javascript
{
  id: "SHOOT_20260105_ABC123",
  label: "Название съёмки",
  
  globalSettings: {
    antiAi: { poseProfile, level, exposureErrors, mixedWb },
    identityLock: { enabled: true },
    clothingLock: { enabled: true },
    imageConfig: { aspectRatio, imageSize },
    outfitAvatarMode: { enabled, required }
  },
  
  universe: { /* ... */ },
  models: [{ modelId, refs }],
  clothing: [{ forModelIndex, refs }],
  outfitAvatars: [{ forModelIndex, status, imageUrl }],
  frames: [{ frameId, order, extraPrompt, ... }]
}
```

### 2. Universe (Вселенная)

Визуальный стиль съёмки: tech, era, color, lens, mood.

### 3. Frame (Кадр)

Пресет кадра из каталога: описание, эскиз, теги.

### 4. Model (Модель)

Аватар модели: внешность, identity-референсы, выражения.

## Поток данных

```
┌─────────────────────────────────────────────────────────────────┐
│                         РЕДАКТОРЫ                               │
├─────────────┬─────────────┬─────────────┬─────────────────────────┤
│ Universe    │ Frame       │ Model       │ Global Settings        │
│ Editor      │ Editor      │ Editor      │ (в Composer)           │
└──────┬──────┴──────┬──────┴──────┬──────┴───────────┬─────────────┘
       │             │             │                  │
       ▼             ▼             ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SHOOT COMPOSER                             │
│   Собирает всё в единый ShootConfig JSON                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    📄 shootConfig.json
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
    💾 Сохранение в store              🖼️ Генерация изображений
```

## API Endpoints

### Health
- `GET /api/health` — статус сервера

### Universes
- `GET /api/universes` — список вселенных
- `GET /api/universes/:id` — получить вселенную
- `POST /api/universes` — создать вселенную
- `PUT /api/universes/:id` — обновить вселенную
- `DELETE /api/universes/:id` — удалить вселенную

### Frames
- `GET /api/frames` — список кадров
- `GET /api/frames/:id` — получить кадр
- `POST /api/frames` — создать кадр
- `PUT /api/frames/:id` — обновить кадр
- `DELETE /api/frames/:id` — удалить кадр

### Models
- `GET /api/models` — список моделей
- `GET /api/models/:id` — получить модель
- `POST /api/models` — создать модель
- `PUT /api/models/:id` — обновить модель
- `DELETE /api/models/:id` — удалить модель

### Shoots
- `GET /api/shoots` — список съёмок
- `GET /api/shoots/:id` — получить съёмку
- `POST /api/shoots` — создать съёмку
- `PUT /api/shoots/:id` — обновить съёмку
- `DELETE /api/shoots/:id` — удалить съёмку
- `POST /api/shoots/:id/generate` — генерировать изображения

## Модульность

Каждый модуль независим:
- Редактор вселенных работает только со вселенными
- Редактор кадров работает только с кадрами
- Composer собирает всё вместе

Это позволяет:
- Менять один модуль без влияния на другие
- Тестировать модули изолированно
- Добавлять новые модули без рефакторинга

## Outfit Avatar Module

Специальный модуль для работы с несколькими моделями + одежда:

**Проблема**: При 2-3 моделях + несколько референсов одежды = 10-20 изображений → API не справляется.

**Решение**:
1. Генерируем full-body аватар каждой модели в её одежде
2. Пользователь подтверждает результат
3. При генерации кадров передаём только эти аватары

**Условия активации**:
- 2+ модели И хотя бы у одной есть одежда

## Дальнейшее развитие

1. **Store Layer** — файловое хранилище для каждой сущности
2. **Services** — бизнес-логика (сборка промптов, валидация)
3. **Providers** — интеграция с Gemini, OpenAI, Vertex
4. **Editors** — полноценные UI-редакторы для каждой сущности
5. **Composer** — главный конструктор съёмок

