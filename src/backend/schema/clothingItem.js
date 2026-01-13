/**
 * Clothing Item Schema
 * 
 * Структура для хранения предметов одежды с группировкой изображений
 * и сохранением промптов.
 * 
 * Принципы:
 * - Одна вещь = один промпт (не для каждого изображения)
 * - Несколько изображений одной вещи (front/back/detail)
 * - Опциональный общий промпт на весь лук
 */

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {'front'|'back'|'detail'|'side'|'flat_lay'|'other'} ImageView
 * Ракурс изображения вещи
 */

/**
 * @typedef {Object} ClothingImage
 * @property {string} id - Уникальный ID изображения
 * @property {string} url - URL или data URL изображения
 * @property {ImageView} view - Ракурс (front/back/detail/etc)
 * @property {string} [uploadedAt] - Дата загрузки
 */

/**
 * @typedef {'top'|'bottom'|'outerwear'|'dress'|'footwear'|'accessory'|'bag'|'other'} ClothingCategory
 * Категория одежды
 */

/**
 * @typedef {Object} ClothingItem
 * @property {string} id - Уникальный ID вещи
 * @property {string} [name] - Название вещи (опционально, для UI)
 * @property {ClothingCategory} [category] - Категория (top/bottom/outerwear/etc)
 * @property {string} prompt - Промпт-описание вещи (ГЛАВНОЕ поле!)
 * @property {ClothingImage[]} images - Массив изображений этой вещи
 * @property {string} [createdAt] - Дата создания
 * @property {string} [updatedAt] - Дата обновления
 */

/**
 * @typedef {Object} LookPrompt
 * @property {number} forModelIndex - Индекс модели (0, 1, 2)
 * @property {string} prompt - Общий промпт лука/образа
 */

// ═══════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════

export const CLOTHING_CATEGORIES = [
  { id: 'top', label: '👕 Верх', desc: 'Футболки, рубашки, блузки, свитера' },
  { id: 'bottom', label: '👖 Низ', desc: 'Брюки, джинсы, юбки, шорты' },
  { id: 'outerwear', label: '🧥 Верхняя одежда', desc: 'Куртки, пальто, пиджаки' },
  { id: 'dress', label: '👗 Платья/Комбинезоны', desc: 'Платья, комбинезоны, костюмы' },
  { id: 'footwear', label: '👟 Обувь', desc: 'Кроссовки, туфли, ботинки' },
  { id: 'accessory', label: '💍 Аксессуары', desc: 'Ювелирка, часы, очки, шарфы' },
  { id: 'bag', label: '👜 Сумки', desc: 'Сумки, рюкзаки, клатчи' },
  { id: 'other', label: '📦 Другое', desc: 'Прочие предметы' }
];

export const IMAGE_VIEWS = [
  { id: 'front', label: 'Спереди', emoji: '👁️' },
  { id: 'back', label: 'Сзади', emoji: '🔙' },
  { id: 'side', label: 'Сбоку', emoji: '↔️' },
  { id: 'detail', label: 'Деталь', emoji: '🔍' },
  { id: 'flat_lay', label: 'Flat lay', emoji: '📐' },
  { id: 'other', label: 'Другое', emoji: '📷' }
];

// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Создать новый ClothingItem
 * @param {Object} options
 * @returns {ClothingItem}
 */
export function createClothingItem(options = {}) {
  const now = new Date().toISOString();
  
  return {
    id: options.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: options.name || '',
    category: options.category || 'other',
    prompt: options.prompt || '',
    images: options.images || [],
    createdAt: options.createdAt || now,
    updatedAt: now
  };
}

/**
 * Добавить изображение к вещи
 * @param {ClothingItem} item
 * @param {string} url - URL изображения
 * @param {ImageView} [view='front'] - Ракурс
 * @returns {ClothingItem}
 */
export function addImageToItem(item, url, view = 'front') {
  const image = {
    id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    url,
    view,
    uploadedAt: new Date().toISOString()
  };
  
  return {
    ...item,
    images: [...item.images, image],
    updatedAt: new Date().toISOString()
  };
}

/**
 * Обновить промпт вещи
 * @param {ClothingItem} item
 * @param {string} prompt
 * @returns {ClothingItem}
 */
export function updateItemPrompt(item, prompt) {
  return {
    ...item,
    prompt,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Удалить изображение из вещи
 * @param {ClothingItem} item
 * @param {string} imageId
 * @returns {ClothingItem}
 */
export function removeImageFromItem(item, imageId) {
  return {
    ...item,
    images: item.images.filter(img => img.id !== imageId),
    updatedAt: new Date().toISOString()
  };
}

// ═══════════════════════════════════════════════════════════════
// MIGRATION HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Мигрировать старый формат (плоский список) в новый (группировка по вещам)
 * 
 * Старый формат: [{ url, description }, { url, description }, ...]
 * Новый формат: [ClothingItem, ClothingItem, ...]
 * 
 * @param {Array} oldRefs - Старый формат
 * @returns {ClothingItem[]} - Новый формат
 */
export function migrateOldClothingFormat(oldRefs) {
  if (!Array.isArray(oldRefs)) return [];
  
  // Проверяем, уже ли это новый формат
  if (oldRefs.length > 0 && oldRefs[0].images) {
    // Уже новый формат
    return oldRefs;
  }
  
  // Мигрируем: каждый старый ref становится отдельной вещью с одним изображением
  return oldRefs.map((ref, index) => {
    return createClothingItem({
      id: `migrated_${Date.now()}_${index}`,
      name: ref.description || `Предмет ${index + 1}`,
      prompt: ref.description || '', // Старый description становится prompt
      images: [{
        id: `img_migrated_${index}`,
        url: ref.url,
        view: 'front'
      }]
    });
  });
}

/**
 * Проверить, это новый формат или старый
 * @param {Array} refs
 * @returns {boolean} - true если новый формат
 */
export function isNewClothingFormat(refs) {
  if (!Array.isArray(refs) || refs.length === 0) return true; // Пустой = OK
  return refs[0].images !== undefined;
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Собрать промпт одежды для генерации
 * @param {ClothingItem[]} items - Массив вещей
 * @param {string} [lookPrompt] - Общий промпт лука
 * @returns {string} - Промпт для секции одежды
 */
export function buildClothingPrompt(items, lookPrompt = '') {
  const parts = [];
  
  // Общий промпт лука
  if (lookPrompt && lookPrompt.trim()) {
    parts.push(`OUTFIT STYLE: ${lookPrompt.trim()}`);
  }
  
  // Промпты отдельных вещей
  const itemPrompts = items
    .filter(item => item.prompt && item.prompt.trim())
    .map((item, index) => {
      const category = CLOTHING_CATEGORIES.find(c => c.id === item.category);
      const categoryLabel = category ? category.label.replace(/^[^\s]+\s/, '') : '';
      const prefix = categoryLabel ? `${categoryLabel}: ` : `Item ${index + 1}: `;
      return `${prefix}${item.prompt.trim()}`;
    });
  
  if (itemPrompts.length > 0) {
    parts.push('CLOTHING ITEMS:\n' + itemPrompts.map(p => `• ${p}`).join('\n'));
  }
  
  return parts.join('\n\n');
}

/**
 * Получить все изображения из всех вещей
 * @param {ClothingItem[]} items
 * @returns {Array<{url: string, description: string}>} - Плоский список для генератора
 */
export function getAllImagesFromItems(items) {
  const result = [];
  
  for (const item of items) {
    for (const img of item.images) {
      result.push({
        url: img.url,
        description: item.prompt || item.name || 'Clothing item',
        itemId: item.id,
        view: img.view
      });
    }
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  CLOTHING_CATEGORIES,
  IMAGE_VIEWS,
  createClothingItem,
  addImageToItem,
  updateItemPrompt,
  removeImageFromItem,
  migrateOldClothingFormat,
  isNewClothingFormat,
  buildClothingPrompt,
  getAllImagesFromItems
};

