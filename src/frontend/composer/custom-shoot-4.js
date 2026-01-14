/**
 * Custom Shoot Composer
 * 
 * Same workflow as Shoot Composer, but without pre-defined universe.
 * Universe settings are configured manually on the generation step.
 * Style Lock ensures consistency (includes location from reference image).
 * Location Lock removed - when Style Lock is enabled, location reference is skipped.
 */

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch with timeout to prevent hanging requests
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw e;
  }
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const state = {
  currentStep: 'shoot',
  currentShoot: null,
  
  // Available entities (loaded from API)
  shoots: [],
  models: [],
  frames: [],
  locations: [],
  emotions: [],
  emotionCategories: [],
  
  // Selected for current shoot
  selectedModels: [null, null, null],
  clothingByModel: [[], [], []], // Array of ClothingItem[] for each model
  lookPrompts: ['', '', ''], // General look prompt for each model
  
  // Generated frames history
  generatedFrames: [],
  
  // Reference Locks state (Location Lock removed - location is implied in Style Lock)
  styleLock: { enabled: false, mode: null, imageId: null, imageUrl: null },
  
  // Generation settings (persisted per shoot)
  generationSettings: {},
  
  // Universe params (Custom Shoot 4 - new architecture)
  universeParams: null,       // Schema from API
  universeBlocks: [],         // Block structure for UI
  universeDefaults: {},       // Default values
  universeValues: {},         // Current selected values
  narrativePreview: null      // Generated narrative preview
};

// Step order for navigation (frames step removed - frames are selected directly in generate step)
const STEP_ORDER = ['shoot', 'models', 'clothing', 'generate'];

// ═══════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════

const elements = {};

function initElements() {
  elements.serverStatus = document.getElementById('server-status');
  
  // Step navigation
  elements.stepItems = document.querySelectorAll('.step-item');
  elements.stepPanels = document.querySelectorAll('.step-panel');
  
  // Step 1: Shoot
  elements.shootsList = document.getElementById('shoots-list');
  elements.btnNewShoot = document.getElementById('btn-new-shoot');
  elements.btnNextToModels = document.getElementById('btn-next-to-models');
  elements.stepShootStatus = document.getElementById('step-shoot-status');
  
  // Step 2: Models
  elements.modelSlots = document.getElementById('model-slots');
  elements.modelsGrid = document.getElementById('models-grid');
  elements.availableModels = document.getElementById('available-models');
  elements.btnBackToShoot = document.getElementById('btn-back-to-shoot');
  elements.btnNextToClothing = document.getElementById('btn-next-to-clothing');
  elements.stepModelsStatus = document.getElementById('step-models-status');
  
  // Step 3: Clothing
  elements.clothingSections = document.getElementById('clothing-sections');
  elements.btnBackToModels = document.getElementById('btn-back-to-models');
  elements.btnNextToFrames = document.getElementById('btn-next-to-frames');
  elements.stepClothingStatus = document.getElementById('step-clothing-status');
  
  // Step 4: Generate (frames are selected directly here)
  elements.btnBackToFrames = document.getElementById('btn-back-to-frames');
  elements.btnClearHistory = document.getElementById('btn-clear-history');
  elements.imagesGallery = document.getElementById('images-gallery');
  elements.generationCount = document.getElementById('generation-count');
  elements.framesToGenerate = document.getElementById('frames-to-generate');
  elements.stepGenerateStatus = document.getElementById('step-generate-status');
  
  // Generation controls (per-frame only)
  elements.genLocation = document.getElementById('gen-location');
  elements.genExtraPrompt = document.getElementById('gen-extra-prompt');
  elements.genAspectRatio = document.getElementById('gen-aspect-ratio');
  elements.genImageSize = document.getElementById('gen-image-size');
  elements.genPoseAdherence = document.getElementById('gen-pose-adherence');
  elements.genEmotion = document.getElementById('gen-emotion');
  
  // Composition controls (per-frame: shot size and camera angle)
  elements.genShotSize = document.getElementById('gen-shot-size');
  elements.genCameraAngle = document.getElementById('gen-camera-angle');
  
  // NOTE: Legacy controls removed - now controlled via Universe params:
  // - genCaptureStyle, genColor, genSkinTexture, genEra
  // - genShootType, genCameraAesthetic, genLightingSource, genLightingQuality
  // - genCameraSignature, genLight
  // - genAntiAiLevel
  // - genFocusMode, genLensFocal
  // - genModelBehavior
  // - genWeather, genTimeOfDay, genSeason, genAtmosphere
  
  // Lock controls (Location Lock removed - location is implied in Style Lock)
  elements.styleLockOff = document.getElementById('style-lock-off');
  elements.styleLockStrict = document.getElementById('style-lock-strict');
  elements.styleLockSoft = document.getElementById('style-lock-soft');
  elements.styleLockPreview = document.getElementById('style-lock-preview');
  elements.styleLockImg = document.getElementById('style-lock-img');
}

// ═══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════

function initEventListeners() {
  // Step navigation clicks
  elements.stepItems.forEach(item => {
    item.addEventListener('click', () => {
      if (!item.classList.contains('locked')) {
        goToStep(item.dataset.step);
      }
    });
  });
  
  // Step 1: Shoot
  elements.btnNewShoot.addEventListener('click', createNewShoot);
  elements.btnNextToModels.addEventListener('click', () => goToStep('models'));
  
  // Step 2: Models
  elements.btnBackToShoot.addEventListener('click', () => goToStep('shoot'));
  elements.btnNextToClothing.addEventListener('click', () => goToStep('clothing'));
  
  // Step 3: Clothing (now goes directly to generate, skipping frames step)
  elements.btnBackToModels.addEventListener('click', () => goToStep('models'));
  elements.btnNextToFrames.addEventListener('click', () => goToStep('generate'));
  
  // Step 4: Frames (kept for backward compatibility but not used in navigation)
  elements.btnBackToClothing?.addEventListener('click', () => goToStep('clothing'));
  elements.btnNextToGenerate?.addEventListener('click', () => goToStep('generate'));
  
  // Step 5: Generate (now step 4)
  elements.btnBackToFrames.addEventListener('click', () => goToStep('clothing'));
  elements.btnClearHistory.addEventListener('click', clearGenerationHistory);
  
  // Lock buttons (Location Lock removed - location is implied in Style Lock)
  elements.styleLockOff.addEventListener('click', () => setStyleLockMode('off'));
  elements.styleLockStrict.addEventListener('click', () => setStyleLockMode('strict'));
  elements.styleLockSoft.addEventListener('click', () => setStyleLockMode('soft'));
  
  // DELEGATED event handler for generate buttons (won't break on DOM re-renders)
  elements.framesToGenerate.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-gen-frame');
    if (btn) {
      console.log('[Event] Generate button clicked via delegation');
      e.stopPropagation();
      generateFrame(btn.dataset.frameId || null);
    }
  });
  
  // DELEGATED event handler for gallery buttons
  elements.imagesGallery.addEventListener('click', (e) => {
    const lightboxBtn = e.target.closest('.btn-open-lightbox');
    if (lightboxBtn) {
      openLightbox(parseInt(lightboxBtn.dataset.frameIndex));
      return;
    }
    
    const styleRefBtn = e.target.closest('.btn-set-style-ref');
    if (styleRefBtn) {
      setAsStyleRef(styleRefBtn.dataset.imageId);
      return;
    }
    
    const deleteBtn = e.target.closest('[data-delete-frame]');
    if (deleteBtn) {
      deleteFrame(parseInt(deleteBtn.dataset.deleteFrame));
      return;
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

function goToStep(stepId) {
  state.currentStep = stepId;
  
  // Update step items
  elements.stepItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.step === stepId) {
      item.classList.add('active');
    }
  });
  
  // Update step panels
  elements.stepPanels.forEach(panel => {
    panel.classList.remove('active');
    if (panel.dataset.panel === stepId) {
      panel.classList.add('active');
    }
  });
  
  // Run step-specific logic
  switch (stepId) {
    case 'models':
      renderModelSlots();
      renderAvailableModels();
      break;
    case 'clothing':
      renderClothingSections();
      break;
    case 'generate':
      renderGeneratePage();
      break;
  }
  
  updateStepStatuses();
}

function updateStepStatuses() {
  const hasShoot = !!state.currentShoot;
  const hasModels = state.selectedModels.filter(m => m !== null).length > 0;
  const modelCount = state.selectedModels.filter(m => m !== null).length;
  
  // Update step lock status
  elements.stepItems.forEach(item => {
    const step = item.dataset.step;
    let locked = false;
    
    switch (step) {
      case 'shoot':
        locked = false;
        break;
      case 'models':
        locked = !hasShoot;
        break;
      case 'clothing':
        locked = !hasModels;
        break;
      case 'generate':
        locked = !hasModels;
        break;
    }
    
    item.classList.toggle('locked', locked);
  });
  
  // Update status badges
  if (hasShoot) {
    elements.stepShootStatus.textContent = state.currentShoot.label;
    elements.stepShootStatus.className = 'step-status ready';
  } else {
    elements.stepShootStatus.textContent = 'Не выбрано';
    elements.stepShootStatus.className = 'step-status pending';
  }
  
  elements.stepModelsStatus.textContent = `${modelCount} / 3`;
  elements.stepModelsStatus.className = modelCount > 0 ? 'step-status ready' : 'step-status pending';
  
  // Check if any model has clothing items (with images OR prompts)
  const hasClothing = state.clothingByModel.some(items => 
    items.length > 0 && items.some(item => 
      (item.images && item.images.length > 0) || 
      (item.prompt && item.prompt.trim())
    )
  );
  elements.stepClothingStatus.textContent = hasClothing ? 'Загружено' : 'Опционально';
  elements.stepClothingStatus.className = hasClothing ? 'step-status ready' : 'step-status pending';
  
  // Generate step status - show frame count from catalog
  const frameCount = state.frames.length;
  elements.stepGenerateStatus.textContent = frameCount > 0 ? `${frameCount} кадров` : '—';
  elements.stepGenerateStatus.className = frameCount > 0 ? 'step-status ready' : 'step-status pending';
  
  // Update navigation buttons
  elements.btnNextToModels.disabled = !hasShoot;
  elements.btnNextToClothing.disabled = !hasModels;
  elements.btnNextToFrames.disabled = !hasModels;
}

// ═══════════════════════════════════════════════════════════════
// STEP 1: CUSTOM SHOOTS
// ═══════════════════════════════════════════════════════════════

async function loadShoots() {
  try {
    const res = await fetchWithTimeout('/api/custom-shoots', {}, 5000);
    const data = await res.json();
    if (data.ok) {
      state.shoots = data.shoots || [];
    }
  } catch (e) {
    console.error('[LoadShoots] Error:', e.message);
  }
  renderShootsList();
}

function renderShootsList() {
  if (state.shoots.length === 0) {
    elements.shootsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✨</div>
        <div class="empty-state-title">Нет съёмок</div>
        <div class="empty-state-text">Создайте первый Custom Shoot</div>
      </div>
    `;
    return;
  }
  
  elements.shootsList.innerHTML = state.shoots.map(shoot => `
    <div class="shoot-card ${state.currentShoot?.id === shoot.id ? 'selected' : ''}" 
         data-shoot-id="${shoot.id}">
      <div class="shoot-card-icon">✨</div>
      <div class="shoot-card-info">
        <div class="shoot-card-title">${escapeHtml(shoot.label)}</div>
        <div class="shoot-card-meta">
          ${shoot.imageCount || 0} кадров
          ${shoot.hasStyleLock ? '• 🎨 Style Lock' : ''}
        </div>
      </div>
      <button class="btn-delete-shoot" data-shoot-id="${shoot.id}" title="Удалить съёмку" 
              style="background: transparent; border: none; color: var(--color-accent); padding: 8px; cursor: pointer; font-size: 16px; opacity: 0.6;"
              onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6">
        🗑️
      </button>
    </div>
  `).join('');
  
  // Add click handlers
  elements.shootsList.querySelectorAll('.shoot-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete-shoot')) return;
      selectShoot(card.dataset.shootId);
    });
  });
  
  // Add delete handlers
  elements.shootsList.querySelectorAll('.btn-delete-shoot').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteShoot(btn.dataset.shootId);
    });
  });
}

async function createNewShoot() {
  const label = prompt('Название съёмки:', 'Custom Shoot');
  if (!label) return;
  
  try {
    const res = await fetchWithTimeout('/api/custom-shoots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label })
    }, 5000);
    const data = await res.json();
    if (data.ok) {
      state.shoots.unshift({
        id: data.shoot.id,
        label: data.shoot.label,
        imageCount: 0
      });
      state.currentShoot = data.shoot;
      loadShootState();
      renderShootsList();
      updateStepStatuses();
    } else {
      alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
    }
  } catch (e) {
    console.error('Error creating shoot:', e);
    alert('Ошибка создания съёмки');
  }
}

async function selectShoot(shootId) {
  try {
    const res = await fetchWithTimeout(`/api/custom-shoots/${shootId}`, {}, 5000);
    const data = await res.json();
    if (data.ok) {
      state.currentShoot = data.shoot;
      loadShootState();
      renderShootsList();
      updateStepStatuses();
    }
  } catch (e) {
    console.error('Error loading shoot:', e);
  }
}

function loadShootState() {
  if (!state.currentShoot) return;
  
  // Load models
  state.selectedModels = [null, null, null];
  if (state.currentShoot.models) {
    state.currentShoot.models.forEach((m, i) => {
      if (i < 3) {
        state.selectedModels[i] = state.models.find(model => model.id === m.modelId) || null;
      }
    });
  }
  
  // Load clothing (new format with grouped items)
  state.clothingByModel = [[], [], []];
  state.lookPrompts = ['', '', ''];
  
  console.log('[LoadClothing] Raw clothing from shoot:', state.currentShoot.clothing);
  console.log('[LoadClothing] Raw lookPrompts from shoot:', state.currentShoot.lookPrompts);
  
  if (state.currentShoot.clothing) {
    state.currentShoot.clothing.forEach(c => {
      if (c.forModelIndex >= 0 && c.forModelIndex < 3) {
        // Check if it's new format (items) or old format (refs)
        if (c.items) {
          // New format
          console.log('[LoadClothing] Loading items for model', c.forModelIndex, ':', 
            c.items.map(item => ({ name: item.name, promptLen: item.prompt?.length, imagesCount: item.images?.length }))
          );
          state.clothingByModel[c.forModelIndex] = c.items;
        } else if (c.refs) {
          // Old format - migrate to new
          console.log('[LoadClothing] Migrating old refs for model', c.forModelIndex);
          state.clothingByModel[c.forModelIndex] = migrateOldClothingRefs(c.refs);
        }
      }
    });
  }
  
  // Load look prompts
  if (state.currentShoot.lookPrompts) {
    state.currentShoot.lookPrompts.forEach(lp => {
      if (lp.forModelIndex >= 0 && lp.forModelIndex < 3) {
        state.lookPrompts[lp.forModelIndex] = lp.prompt || '';
      }
    });
  }
  
  // Load generated images (isLocationReference removed - location implied in style)
  state.generatedFrames = (state.currentShoot.generatedImages || []).map(img => ({
    ...img, // Load ALL saved properties (prompt, refs, composition, settings, etc.)
    status: 'ready',
    timestamp: img.createdAt || img.timestamp,
    // Ensure booleans
    isStyleReference: !!img.isStyleReference
  }));
  
  // Load locks (Location Lock removed - location is implied in Style Lock)
  state.styleLock = state.currentShoot.locks?.style || { enabled: false, mode: null, imageId: null, imageUrl: null };
  
  // Load generation settings
  state.generationSettings = state.currentShoot.generationSettings || {};
}

async function deleteShoot(shootId) {
  if (!confirm('Удалить этот Custom Shoot?')) return;
  
  try {
    const res = await fetchWithTimeout(`/api/custom-shoots/${shootId}`, { method: 'DELETE' }, 5000);
    const data = await res.json();
    
    if (data.ok) {
      state.shoots = state.shoots.filter(s => s.id !== shootId);
      if (state.currentShoot?.id === shootId) {
        state.currentShoot = null;
        state.selectedModels = [null, null, null];
        state.clothingByModel = [[], [], []];
        state.generatedFrames = [];
      }
      renderShootsList();
      updateStepStatuses();
    }
  } catch (e) {
    console.error('Error deleting shoot:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: MODELS (same as shoot-composer)
// ═══════════════════════════════════════════════════════════════

async function loadModels() {
  try {
    const res = await fetchWithTimeout('/api/models', {}, 10000);
    const data = await res.json();
    if (data.ok) {
      state.models = data.data || [];
    }
  } catch (e) {
    console.error('[LoadModels] Error:', e.message);
  }
}

function renderModelSlots() {
  const slots = elements.modelSlots.querySelectorAll('.model-slot');
  
  slots.forEach((slot, index) => {
    const model = state.selectedModels[index];
    
    if (model) {
      slot.classList.add('filled');
      slot.innerHTML = `
        <div class="model-slot-preview">
          ${model.previewSrc ? `<img src="${model.previewSrc}" alt="${escapeHtml(model.name)}">` : ''}
        </div>
        <div class="model-slot-name">${escapeHtml(model.name)}</div>
        <div class="model-slot-remove" data-slot="${index}">✕ Убрать</div>
      `;
    } else {
      slot.classList.remove('filled');
      slot.innerHTML = `
        <div class="model-slot-icon">👤</div>
        <div class="model-slot-label">Модель ${index + 1}${index > 0 ? ' (опц.)' : ''}</div>
      `;
    }
    
    slot.onclick = () => {
      if (!state.selectedModels[index]) {
        showModelPicker(index);
      }
    };
  });
  
  elements.modelSlots.querySelectorAll('.model-slot-remove').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      removeModel(parseInt(btn.dataset.slot));
    };
  });
}

function renderAvailableModels() {
  if (state.models.length === 0) {
    elements.availableModels.style.display = 'block';
    elements.modelsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">👤</div>
        <div class="empty-state-title">Нет моделей</div>
        <div class="empty-state-text">
          <a href="/editors/model-editor.html">Создайте модели</a> в редакторе
        </div>
      </div>
    `;
    return;
  }
  
  elements.availableModels.style.display = 'block';
  
  const selectedIds = state.selectedModels.filter(m => m).map(m => m.id);
  const availableModels = state.models.filter(m => !selectedIds.includes(m.id));
  
  if (availableModels.length === 0) {
    elements.modelsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 30px;">
        <div class="empty-state-text">Все модели добавлены в съёмку</div>
      </div>
    `;
    return;
  }
  
  elements.modelsGrid.innerHTML = availableModels.map(m => `
    <div class="selection-card" data-model-id="${m.id}">
      ${m.previewSrc ? `
        <div class="selection-card-preview">
          <img src="${m.previewSrc}" alt="${escapeHtml(m.name)}">
        </div>
      ` : '<div class="selection-card-icon">👤</div>'}
      <div class="selection-card-title">${escapeHtml(m.name)}</div>
    </div>
  `).join('');
  
  elements.modelsGrid.querySelectorAll('.selection-card').forEach(card => {
    card.addEventListener('click', () => {
      const model = state.models.find(m => m.id === card.dataset.modelId);
      if (model) addModelToFirstEmptySlot(model);
    });
  });
}

function showModelPicker(slotIndex) {
  const selectedIds = state.selectedModels.filter(m => m).map(m => m.id);
  const availableModels = state.models.filter(m => !selectedIds.includes(m.id));
  
  if (availableModels.length === 0) {
    alert('Нет доступных моделей.');
    return;
  }
  
  addModel(slotIndex, availableModels[0]);
}

function addModelToFirstEmptySlot(model) {
  const emptySlotIndex = state.selectedModels.findIndex(m => m === null);
  if (emptySlotIndex >= 0) {
    addModel(emptySlotIndex, model);
  } else {
    alert('Все слоты заняты.');
  }
}

async function addModel(slotIndex, model) {
  if (!state.currentShoot) return;
  
  // Update local state
  state.selectedModels[slotIndex] = model;
  
  // Update on server
  await saveShootModels();
  
  renderModelSlots();
  renderAvailableModels();
  updateStepStatuses();
}

async function removeModel(slotIndex) {
  state.selectedModels[slotIndex] = null;
  state.clothingByModel[slotIndex] = [];
  
  await saveShootModels();
  
  renderModelSlots();
  renderAvailableModels();
  updateStepStatuses();
}

async function saveShootModels() {
  if (!state.currentShoot) return;
  
  const models = state.selectedModels
    .filter(m => m !== null)
    .map(m => ({ modelId: m.id }));
  
  try {
    await fetchWithTimeout(`/api/custom-shoots/${state.currentShoot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ models })
    }, 5000);
  } catch (e) {
    console.error('Error saving models:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 3: CLOTHING (simplified)
// ═══════════════════════════════════════════════════════════════

function renderClothingSections() {
  console.log('[RenderClothing] state.clothingByModel:', state.clothingByModel.map((items, idx) => ({
    modelIdx: idx,
    itemsCount: items.length,
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      prompt: item.prompt?.slice(0, 50),
      imagesCount: item.images?.length
    }))
  })));
  console.log('[RenderClothing] state.lookPrompts:', state.lookPrompts);
  
  const activeModels = state.selectedModels.filter(m => m !== null);
  
  if (activeModels.length === 0) {
    elements.clothingSections.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👤</div>
        <div class="empty-state-title">Сначала добавьте модели</div>
      </div>
    `;
    return;
  }
  
  elements.clothingSections.innerHTML = state.selectedModels.map((model, index) => {
    if (!model) return '';
    
    const items = state.clothingByModel[index] || [];
    const lookPrompt = state.lookPrompts?.[index] || '';
    
    return `
      <div class="clothing-section" data-model-index="${index}">
        <div class="clothing-section-header">
          <div class="clothing-section-avatar">
            ${model.previewSrc ? `<img src="${model.previewSrc}" alt="">` : ''}
          </div>
          <div class="clothing-section-title">${escapeHtml(model.name)}</div>
        </div>
        
        <!-- Общий промпт лука -->
        <div class="look-prompt-section" style="margin-bottom: 16px;">
          <label style="font-size: 11px; color: var(--color-text-muted); display: block; margin-bottom: 4px;">
            ✨ Общий стиль образа (опционально)
        </label>
                <textarea 
            class="look-prompt-input" 
                  data-model="${index}" 
            placeholder="Например: 90s casual street style, relaxed silhouette, layered look..."
                  rows="2"
            style="width: 100%; padding: 8px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 6px; color: var(--color-text); font-size: 12px; resize: vertical;"
          >${escapeHtml(lookPrompt)}</textarea>
          <div style="display: flex; justify-content: flex-end; margin-top: 6px; gap: 8px; align-items: center;">
            <span class="look-prompt-save-status" data-model="${index}" style="font-size: 11px; color: var(--color-text-muted);"></span>
            <button 
              class="btn-save-look-prompt" 
              data-model="${index}"
              style="padding: 4px 12px; font-size: 11px; background: var(--color-primary); border: none; border-radius: 4px; color: white; cursor: pointer; transition: all 0.2s;"
            >📌 Закрепить</button>
              </div>
          </div>
        
        <!-- Список вещей -->
        <div class="clothing-items-list">
          ${items.map((item, itemIdx) => renderClothingItemCard(item, index, itemIdx)).join('')}
        </div>
        
        <!-- Кнопка добавить вещь -->
        <button class="add-clothing-item-btn" data-model="${index}" style="width: 100%; padding: 12px; background: var(--color-surface); border: 2px dashed var(--color-border); border-radius: 8px; color: var(--color-text-muted); font-size: 13px; cursor: pointer; transition: all 0.2s;">
          ➕ Добавить предмет одежды
        </button>
      </div>
    `;
  }).join('');
  
  // Используем делегирование событий — один listener на весь контейнер
  // Это работает надёжно даже после перерисовки HTML
}

// ═══════════════════════════════════════════════════════════════
// CLOTHING EVENT DELEGATION (надёжная обработка событий)
// ═══════════════════════════════════════════════════════════════

let clothingEventsInitialized = false;

function initClothingEventDelegation() {
  if (clothingEventsInitialized) return;
  clothingEventsInitialized = true;
  
  const container = document.getElementById('clothing-sections');
  if (!container) return;
  
  // CLICK events
  container.addEventListener('click', async (e) => {
    const target = e.target;
    
    // Add new clothing item
    if (target.classList.contains('add-clothing-item-btn')) {
      const modelIdx = parseInt(target.dataset.model);
      addNewClothingItem(modelIdx);
      return;
    }
    
    // Remove item image
    if (target.classList.contains('remove-item-image-btn')) {
      e.stopPropagation();
      const modelIdx = parseInt(target.dataset.model);
      const itemIdx = parseInt(target.dataset.item);
      const imgIdx = parseInt(target.dataset.img);
      removeImageFromClothingItem(modelIdx, itemIdx, imgIdx);
      return;
    }
    
    // Remove entire item
    if (target.classList.contains('remove-item-btn')) {
      e.stopPropagation();
      const modelIdx = parseInt(target.dataset.model);
      const itemIdx = parseInt(target.dataset.item);
      removeClothingItem(modelIdx, itemIdx);
      return;
    }
    
    // Save item prompt button
    if (target.classList.contains('btn-save-item-prompt')) {
      const modelIdx = parseInt(target.dataset.model);
      const itemIdx = parseInt(target.dataset.item);
      await saveItemPrompt(modelIdx, itemIdx, target);
      return;
    }
    
    // Save look prompt button
    if (target.classList.contains('btn-save-look-prompt')) {
      const modelIdx = parseInt(target.dataset.model);
      await saveLookPrompt(modelIdx, target);
      return;
    }
  });
  
  // CHANGE events (для file inputs и selects)
  container.addEventListener('change', (e) => {
    const target = e.target;
    
    // Add image to item
    if (target.classList.contains('add-image-to-item-input')) {
      const modelIdx = parseInt(target.dataset.model);
      const itemIdx = parseInt(target.dataset.item);
      handleAddImageToItem(e, modelIdx, itemIdx);
      return;
    }
    
    // Image view selector
    if (target.classList.contains('image-view-select')) {
      const modelIdx = parseInt(target.dataset.model);
      const itemIdx = parseInt(target.dataset.item);
      const imgIdx = parseInt(target.dataset.img);
      if (state.clothingByModel[modelIdx]?.[itemIdx]?.images?.[imgIdx]) {
        state.clothingByModel[modelIdx][itemIdx].images[imgIdx].view = target.value;
        saveShootClothing();
      }
      return;
    }
  });
  
  // BLUR events (сохраняем при потере фокуса — надёжнее чем debounce)
  container.addEventListener('blur', async (e) => {
    const target = e.target;
    
    // Item prompt — save on blur
    if (target.classList.contains('item-prompt-input')) {
      const modelIdx = parseInt(target.dataset.model);
      const itemIdx = parseInt(target.dataset.item);
      if (state.clothingByModel[modelIdx]?.[itemIdx]) {
        state.clothingByModel[modelIdx][itemIdx].prompt = target.value;
        await saveShootClothing();
        showSaveStatus(modelIdx, itemIdx, 'item');
      }
      return;
    }
    
    // Item name — save on blur
    if (target.classList.contains('item-name-input')) {
      const modelIdx = parseInt(target.dataset.model);
      const itemIdx = parseInt(target.dataset.item);
      if (state.clothingByModel[modelIdx]?.[itemIdx]) {
        state.clothingByModel[modelIdx][itemIdx].name = target.value;
        await saveShootClothing();
      }
      return;
    }
    
    // Look prompt — save on blur
    if (target.classList.contains('look-prompt-input')) {
      const modelIdx = parseInt(target.dataset.model);
      if (!state.lookPrompts) state.lookPrompts = ['', '', ''];
      state.lookPrompts[modelIdx] = target.value;
      await saveShootClothing();
      showSaveStatus(modelIdx, null, 'look');
      return;
    }
  }, true); // capture phase для blur
}

async function saveItemPrompt(modelIdx, itemIdx, btn) {
  // Get textarea value
  const textarea = document.querySelector(`.item-prompt-input[data-model="${modelIdx}"][data-item="${itemIdx}"]`);
  if (!textarea) return;
  
  // Update state
  if (state.clothingByModel[modelIdx]?.[itemIdx]) {
    state.clothingByModel[modelIdx][itemIdx].prompt = textarea.value;
  }
  
  // Save to backend
  await saveShootClothing();
  
  // Visual feedback
  showSaveStatus(modelIdx, itemIdx, 'item');
  
  if (btn) {
    const originalText = btn.textContent;
    btn.textContent = '✓ Сохранено';
    btn.style.background = 'var(--color-success, #10b981)';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = 'var(--color-primary)';
    }, 1500);
  }
}

async function saveLookPrompt(modelIdx, btn) {
  // Get textarea value
  const textarea = document.querySelector(`.look-prompt-input[data-model="${modelIdx}"]`);
  if (!textarea) return;
  
  // Update state
  if (!state.lookPrompts) state.lookPrompts = ['', '', ''];
  state.lookPrompts[modelIdx] = textarea.value;
  
  // Save to backend
  await saveShootClothing();
  
  // Visual feedback
  showSaveStatus(modelIdx, null, 'look');
  
  if (btn) {
    const originalText = btn.textContent;
    btn.textContent = '✓ Сохранено';
    btn.style.background = 'var(--color-success, #10b981)';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = 'var(--color-primary)';
    }, 1500);
  }
}

function showSaveStatus(modelIdx, itemIdx, type) {
  let statusEl;
  if (type === 'item') {
    statusEl = document.querySelector(`.prompt-save-status[data-model="${modelIdx}"][data-item="${itemIdx}"]`);
  } else {
    statusEl = document.querySelector(`.look-prompt-save-status[data-model="${modelIdx}"]`);
  }
  
  if (statusEl) {
    statusEl.textContent = '✅ Сохранено!';
    statusEl.style.color = 'var(--color-success, #10b981)';
    setTimeout(() => { statusEl.textContent = ''; }, 2000);
  }
}

/**
 * Render a single clothing item card
 */
function renderClothingItemCard(item, modelIndex, itemIndex) {
  const images = item.images || [];
  const viewOptions = [
    { id: 'front', label: 'Спереди' },
    { id: 'back', label: 'Сзади' },
    { id: 'side', label: 'Сбоку' },
    { id: 'detail', label: 'Деталь' },
    { id: 'flat_lay', label: 'Flat lay' },
    { id: 'other', label: 'Другое' }
  ];
  
  return `
    <div class="clothing-item-card" data-model="${modelIndex}" data-item="${itemIndex}" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
      <!-- Header: Name + Remove button -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <input 
          type="text" 
          class="item-name-input" 
          data-model="${modelIndex}" 
          data-item="${itemIndex}"
          value="${escapeHtml(item.name || '')}"
          placeholder="Название (напр. Denim Jacket)"
          style="flex: 1; padding: 6px 8px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 4px; color: var(--color-text); font-size: 13px; font-weight: 500;"
        >
        <button class="remove-item-btn" data-model="${modelIndex}" data-item="${itemIndex}" style="margin-left: 8px; background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; font-size: 16px;" title="Удалить вещь">🗑️</button>
      </div>
      
      <!-- Prompt -->
      <div style="margin-bottom: 10px;">
        <textarea 
          class="item-prompt-input" 
          data-model="${modelIndex}" 
          data-item="${itemIndex}"
          placeholder="Опишите вещь: материал, цвет, фасон, детали, как сидит на модели..."
          rows="3"
          style="width: 100%; padding: 8px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 6px; color: var(--color-text); font-size: 12px; resize: vertical;"
        >${escapeHtml(item.prompt || '')}</textarea>
        <div style="display: flex; justify-content: flex-end; margin-top: 6px; gap: 8px; align-items: center;">
          <span class="prompt-save-status" data-model="${modelIndex}" data-item="${itemIndex}" style="font-size: 11px; color: var(--color-text-muted);"></span>
          <button 
            class="btn-save-item-prompt" 
            data-model="${modelIndex}" 
            data-item="${itemIndex}"
            style="padding: 4px 12px; font-size: 11px; background: var(--color-primary); border: none; border-radius: 4px; color: white; cursor: pointer; transition: all 0.2s;"
          >📌 Закрепить промпт</button>
        </div>
      </div>
      
      <!-- Images -->
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
        ${images.map((img, imgIdx) => `
          <div class="item-image-thumb" style="position: relative; width: 70px;">
            <img src="${img.url}" alt="" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid var(--color-border);">
            <button class="remove-item-image-btn" data-model="${modelIndex}" data-item="${itemIndex}" data-img="${imgIdx}" style="position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; background: var(--color-error, #e74c3c); border: none; border-radius: 50%; color: white; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
            <select class="image-view-select" data-model="${modelIndex}" data-item="${itemIndex}" data-img="${imgIdx}" style="width: 100%; margin-top: 4px; padding: 2px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 3px; color: var(--color-text); font-size: 10px;">
              ${viewOptions.map(v => `<option value="${v.id}" ${img.view === v.id ? 'selected' : ''}>${v.label}</option>`).join('')}
            </select>
          </div>
        `).join('')}
        
        <!-- Add image button -->
        <label style="width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; border: 2px dashed var(--color-border); border-radius: 4px; cursor: pointer; color: var(--color-text-muted); font-size: 20px; transition: border-color 0.2s;">
          <input type="file" multiple accept="image/*" class="add-image-to-item-input" data-model="${modelIndex}" data-item="${itemIndex}" style="display: none;">
          +
        </label>
      </div>
    </div>
  `;
}

/**
 * Add new clothing item for a model
 */
function addNewClothingItem(modelIndex) {
  const newItem = {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    prompt: '',
    images: [],
    createdAt: new Date().toISOString()
  };
  
  if (!state.clothingByModel[modelIndex]) {
    state.clothingByModel[modelIndex] = [];
  }
  
  state.clothingByModel[modelIndex].push(newItem);
  
  saveShootClothing();
  renderClothingSections();
  updateStepStatuses();
}

/**
 * Add image(s) to an existing clothing item
 */
async function handleAddImageToItem(event, modelIndex, itemIndex) {
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('image/'));
  
  const item = state.clothingByModel[modelIndex]?.[itemIndex];
  if (!item) return;
  
  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    if (!item.images) item.images = [];
    item.images.push({
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: dataUrl,
      view: 'front', // default
      uploadedAt: new Date().toISOString()
    });
  }
  
  await saveShootClothing();
  renderClothingSections();
  updateStepStatuses();
  
  event.target.value = '';
}

/**
 * Remove a single image from a clothing item
 */
function removeImageFromClothingItem(modelIndex, itemIndex, imageIndex) {
  const item = state.clothingByModel[modelIndex]?.[itemIndex];
  if (!item?.images) return;
  
  item.images.splice(imageIndex, 1);
  
  saveShootClothing();
  renderClothingSections();
  updateStepStatuses();
}

/**
 * Remove an entire clothing item
 */
function removeClothingItem(modelIndex, itemIndex) {
  state.clothingByModel[modelIndex].splice(itemIndex, 1);
  saveShootClothing();
  renderClothingSections();
  updateStepStatuses();
}

/**
 * Save clothing data to backend
 */
async function saveShootClothing() {
  if (!state.currentShoot) return;
  
  // Save clothing items (new format with grouped images)
  // Keep items that have at least images OR a prompt (even without images)
  const clothing = state.clothingByModel.map((items, index) => ({
    forModelIndex: index,
    items: items.filter(item => 
      (item.images && item.images.length > 0) || 
      (item.prompt && item.prompt.trim()) ||
      (item.name && item.name.trim())
    )
  })).filter(c => c.items.length > 0);
  
  // Save look prompts
  const lookPrompts = state.lookPrompts.map((prompt, index) => ({
    forModelIndex: index,
    prompt: prompt
  })).filter(p => p.prompt.trim() !== '');
  
  console.log('[SaveClothing] Saving:', {
    clothingCount: clothing.length,
    clothing: clothing.map(c => ({
      forModelIndex: c.forModelIndex,
      itemsCount: c.items.length,
      items: c.items.map(item => ({
        name: item.name,
        promptLen: item.prompt?.length || 0,
        imagesCount: item.images?.length || 0
      }))
    })),
    lookPrompts
  });
  
  try {
    const res = await fetchWithTimeout(`/api/custom-shoots/${state.currentShoot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clothing, lookPrompts })
    }, 5000);
    const data = await res.json();
    console.log('[SaveClothing] Response:', data.ok ? 'OK' : 'Error', data);
  } catch (e) {
    console.error('Error saving clothing:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 4: FRAMES
// ═══════════════════════════════════════════════════════════════

async function loadFrames() {
  try {
    const res = await fetchWithTimeout('/api/frames', {}, 10000);
    const data = await res.json();
    if (data.ok) {
      state.frames = data.data || [];
    }
  } catch (e) {
    console.error('[LoadFrames] Error:', e.message);
  }
}

async function loadLocations() {
  try {
    const res = await fetchWithTimeout('/api/locations', {}, 10000);
    const data = await res.json();
    if (data.ok) {
      state.locations = data.data || [];
    }
  } catch (e) {
    console.error('[LoadLocations] Error:', e.message);
  }
}

async function loadEmotions() {
  try {
    const res = await fetchWithTimeout('/api/emotions/options', {}, 10000);
    const data = await res.json();
    console.log('[LoadEmotions] Response:', data);
    
    if (data.ok && data.data) {
      state.emotionCategories = data.data.categories || [];
      const grouped = data.data.emotions || {};
      state.emotions = [];
      
      // New format: categories are objects { id, label, description }
      // grouped is { categoryId: { label, description, emotions: [...] } }
      for (const category of state.emotionCategories) {
        const categoryId = typeof category === 'string' ? category : category.id;
        const categoryData = grouped[categoryId];
        
        // Handle both old format (array) and new format ({ emotions: [...] })
        const categoryEmotions = Array.isArray(categoryData) 
          ? categoryData 
          : (categoryData?.emotions || []);
        
        categoryEmotions.forEach(e => {
          state.emotions.push({ ...e, category: categoryId });
        });
      }
      
      console.log('[LoadEmotions] Loaded', state.emotions.length, 'emotions');
    }
  } catch (e) {
    console.error('Error loading emotions:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// UNIVERSE PARAMS (Custom Shoot 4 - New Architecture)
// ═══════════════════════════════════════════════════════════════

/**
 * Load universe parameters from API
 */
async function loadUniverseParams() {
  try {
    const res = await fetchWithTimeout('/api/universes/params', {}, 10000);
    const data = await res.json();
    
    if (data.ok && data.data) {
      state.universeParams = data.data.params;
      state.universeBlocks = data.data.blocks;
      state.universeDefaults = data.data.defaults;
      
      // Initialize values with defaults
      state.universeValues = { ...data.data.defaults };
      
      console.log('[CustomShoot4] Loaded universe params:', state.universeBlocks.length, 'blocks');
    }
  } catch (e) {
    console.error('[CustomShoot4] Error loading universe params:', e);
  }
}

/**
 * Render universe parameter blocks in UI
 */
function renderUniverseParamsUI() {
  const container = document.getElementById('universe-params-container');
  if (!container || !state.universeParams || !state.universeBlocks) {
    return;
  }
  
  const blocksHtml = state.universeBlocks.map(block => {
    const blockParams = block.id === 'antiAi' 
      ? [state.universeParams.antiAi.antiAiLevel]
      : Object.values(state.universeParams[block.id] || {});
    
    const paramsHtml = blockParams.map(param => {
      if (!param || !param.options) return '';
      
      const currentValue = state.universeValues[param.id] || param.options[0]?.value;
      
      const optionsHtml = param.options.map(opt => {
        const selected = opt.value === currentValue ? 'selected' : '';
        return `<option value="${opt.value}" ${selected} title="${escapeHtml(opt.desc || '')}">${escapeHtml(opt.label)}</option>`;
      }).join('');
      
      return `
        <div class="form-group" style="margin: 0;">
          <label for="universe-${param.id}" style="font-size: 12px; margin-bottom: 4px; display: block;">
            ${escapeHtml(param.label)}
          </label>
          <select id="universe-${param.id}" 
                  data-param-id="${param.id}" 
                  class="universe-param-select"
                  style="width: 100%; padding: 8px 10px; font-size: 12px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 6px; color: var(--color-text);">
            ${optionsHtml}
          </select>
          ${param.description ? `<div style="font-size: 10px; color: var(--color-text-muted); margin-top: 2px;">${escapeHtml(param.description)}</div>` : ''}
        </div>
      `;
    }).join('');
    
    return `
      <div class="universe-settings universe-block" data-block-id="${block.id}">
        <h4 style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          ${block.label}
          <span style="font-weight: normal; font-size: 10px; color: var(--color-text-muted);">${escapeHtml(block.description)}</span>
        </h4>
        <div class="universe-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          ${paramsHtml}
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = blocksHtml;
  
  // Add change listeners
  container.querySelectorAll('.universe-param-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const paramId = e.target.dataset.paramId;
      const oldValue = state.universeValues[paramId];
      state.universeValues[paramId] = e.target.value;
      console.log(`[UniverseParams] Changed ${paramId}: "${oldValue}" → "${e.target.value}"`);
      console.log('[UniverseParams] Current state:', JSON.stringify(state.universeValues, null, 2));
      updateNarrativePreview();
      saveGenerationSettings();
    });
  });
  
  // Show narrative preview panel
  const previewPanel = document.getElementById('narrative-preview-panel');
  if (previewPanel) {
    previewPanel.style.display = 'block';
  }
  
  // Initial preview
  updateNarrativePreview();
}

/**
 * Update narrative preview from current parameter values
 * Debounced and cancellable to prevent blocking
 */
let narrativePreviewTimeout = null;
let narrativePreviewController = null;

async function updateNarrativePreview() {
  const previewContent = document.getElementById('narrative-preview-content');
  const anchorsContent = document.getElementById('visual-anchors-content');
  const anchorsPanel = document.getElementById('visual-anchors-panel');
  
  if (!previewContent) return;
  
  // Cancel any pending request
  if (narrativePreviewTimeout) {
    clearTimeout(narrativePreviewTimeout);
  }
  if (narrativePreviewController) {
    narrativePreviewController.abort();
    narrativePreviewController = null;
  }
  
  // Debounce: wait 150ms before making request
  narrativePreviewTimeout = setTimeout(async () => {
    narrativePreviewController = new AbortController();
    
    try {
      console.log('[NarrativePreview] Sending params:', JSON.stringify(state.universeValues));
      const res = await fetchWithTimeout('/api/universes/params/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: state.universeValues }),
        signal: narrativePreviewController.signal
      }, 5000);
      
      const data = await res.json();
      console.log('[NarrativePreview] Received anchors:', data.data?.anchorsForUI?.map(a => `${a.label}: ${a.value}`));
    
    if (data.ok && data.data) {
      state.narrativePreview = data.data;
      
      // ═══════════════════════════════════════════════════════════════
      // RENDER VISUAL ANCHORS (NEW)
      // ═══════════════════════════════════════════════════════════════
      
      if (data.data.anchorsForUI && anchorsContent && anchorsPanel) {
        const anchorsForUI = data.data.anchorsForUI;
        console.log('[VisualAnchors] Rendering', anchorsForUI.length, 'anchors');
        
        // Debug: find shadow anchor specifically
        const shadowAnchor = anchorsForUI.find(a => a.label === 'Тени');
        if (shadowAnchor) {
          console.log('[VisualAnchors] SHADOW ANCHOR:', shadowAnchor.value, shadowAnchor.colorPreview);
        }
        
        if (anchorsForUI.length > 0) {
          anchorsPanel.style.display = 'block';
          
          // Group anchors by category
          const byCategory = {
            color: anchorsForUI.filter(a => a.category === 'color'),
            lighting: anchorsForUI.filter(a => a.category === 'lighting'),
            lens: anchorsForUI.filter(a => a.category === 'lens'),
            skin: anchorsForUI.filter(a => a.category === 'skin')
          };
          
          let anchorsHtml = '';
          
          // Render each category
          for (const [catId, catAnchors] of Object.entries(byCategory)) {
            if (catAnchors.length === 0) continue;
            
            const catLabels = {
              color: '🎨 Цвет',
              lighting: '💡 Свет',
              lens: '📷 Оптика',
              skin: '👤 Кожа'
            };
            
            anchorsHtml += `<div style="flex: 1; min-width: 200px; background: var(--color-bg); padding: 10px; border-radius: 8px; margin-bottom: 8px;">`;
            anchorsHtml += `<div style="font-size: 11px; font-weight: 600; margin-bottom: 8px; color: var(--color-primary);">${catLabels[catId] || catId}</div>`;
            
            for (const anchor of catAnchors) {
              const colorPreview = anchor.colorPreview 
                ? `<span style="display: inline-block; width: 14px; height: 14px; background: ${anchor.colorPreview}; border-radius: 3px; border: 1px solid var(--color-border); vertical-align: middle; margin-right: 4px;"></span>` 
                : '';
              
              anchorsHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 11px;">
                  <span style="color: var(--color-text-muted);">${anchor.icon} ${anchor.label}</span>
                  <span style="font-weight: 500;">${colorPreview}${escapeHtml(anchor.value)}${anchor.tolerance ? ` <span style="color: var(--color-text-muted);">${anchor.tolerance}</span>` : ''}</span>
                </div>
              `;
            }
            
            anchorsHtml += `</div>`;
          }
          
          anchorsContent.innerHTML = anchorsHtml;
        } else {
          anchorsPanel.style.display = 'none';
        }
      }
      
      // ═══════════════════════════════════════════════════════════════
      // RENDER NARRATIVE PREVIEW (existing)
      // ═══════════════════════════════════════════════════════════════
      
      // Render preview as formatted blocks
      const narrative = data.data.narrative;
      const sections = [];
      
      if (narrative.tech) {
        sections.push(`<div style="margin-bottom: 8px;"><strong style="color: var(--color-primary);">📷 Техника:</strong> ${escapeHtml(narrative.tech)}</div>`);
      }
      if (narrative.era) {
        sections.push(`<div style="margin-bottom: 8px;"><strong style="color: var(--color-primary);">🎬 Эпоха:</strong> ${escapeHtml(narrative.era)}</div>`);
      }
      if (narrative.color) {
        sections.push(`<div style="margin-bottom: 8px;"><strong style="color: var(--color-primary);">🎨 Цвет:</strong> ${escapeHtml(narrative.color)}</div>`);
      }
      if (narrative.lens) {
        sections.push(`<div style="margin-bottom: 8px;"><strong style="color: var(--color-primary);">🔭 Оптика:</strong> ${escapeHtml(narrative.lens)}</div>`);
      }
      if (narrative.mood) {
        sections.push(`<div style="margin-bottom: 8px;"><strong style="color: var(--color-primary);">💫 Настроение:</strong> ${escapeHtml(narrative.mood)}</div>`);
      }
      if (narrative.antiAi) {
        sections.push(`<div style="margin-bottom: 8px;"><strong style="color: var(--color-primary);">🤖 Реализм:</strong> ${escapeHtml(narrative.antiAi)}</div>`);
      }
      
      previewContent.innerHTML = sections.join('') || '<div style="color: var(--color-text-muted);">Выбери параметры для превью...</div>';
    }
    } catch (e) {
      if (e.name === 'AbortError') {
        // Request was cancelled by newer request, ignore
        return;
      }
      console.error('[CustomShoot4] Error updating narrative preview:', e);
      previewContent.innerHTML = '<div style="color: var(--color-accent);">Ошибка загрузки превью</div>';
    }
  }, 150); // 150ms debounce
}

/**
 * Collect universe params for generation
 */
function collectUniverseParams() {
  return { ...state.universeValues };
}

// ═══════════════════════════════════════════════════════════════
// GENERATION SETTINGS PERSISTENCE
// ═══════════════════════════════════════════════════════════════

/**
 * Collect all current generation settings from UI
 * NOTE: Most settings now come from Universe params, only per-frame settings here
 */
function collectGenerationSettings() {
  return {
    // Per-frame parameters
    locationId: elements.genLocation?.value || '',
    emotionId: elements.genEmotion?.value || '',
    aspectRatio: elements.genAspectRatio?.value || '3:4',
    imageSize: elements.genImageSize?.value || '2K',
    poseAdherence: elements.genPoseAdherence?.value || '2',
    
    // Per-frame composition (shot size and camera angle can vary per frame)
    shotSize: elements.genShotSize?.value || 'default',
    cameraAngle: elements.genCameraAngle?.value || 'eye_level',
    
    // Extra prompt
    extraPrompt: elements.genExtraPrompt?.value || ''
    
    // NOTE: All other settings (camera, lighting, color, anti-ai, mood, etc.)
    // are now controlled via Universe params and not collected here
  };
}

/**
 * Apply loaded generation settings to UI
 * NOTE: Only per-frame settings are applied here
 */
function applyGenerationSettings(settings) {
  if (!settings) return;
  
  // Per-frame parameters
  if (settings.locationId !== undefined && elements.genLocation) {
    elements.genLocation.value = settings.locationId;
  }
  if (settings.emotionId !== undefined && elements.genEmotion) {
    elements.genEmotion.value = settings.emotionId;
  }
  if (settings.aspectRatio && elements.genAspectRatio) {
    elements.genAspectRatio.value = settings.aspectRatio;
  }
  if (settings.imageSize && elements.genImageSize) {
    elements.genImageSize.value = settings.imageSize;
  }
  if (settings.poseAdherence && elements.genPoseAdherence) {
    elements.genPoseAdherence.value = settings.poseAdherence;
  }
  
  // Per-frame composition
  if (settings.shotSize && elements.genShotSize) {
    elements.genShotSize.value = settings.shotSize;
  }
  if (settings.cameraAngle && elements.genCameraAngle) {
    elements.genCameraAngle.value = settings.cameraAngle;
  }
  
  // Extra prompt
  if (settings.extraPrompt !== undefined && elements.genExtraPrompt) {
    elements.genExtraPrompt.value = settings.extraPrompt;
  }
}

/**
 * Save current generation settings to server (debounced)
 */
let saveSettingsTimeout = null;
let saveSettingsController = null; // AbortController for previous save request

async function saveGenerationSettings() {
  if (!state.currentShoot) return;
  
  // Debounce to avoid too many requests
  if (saveSettingsTimeout) {
    clearTimeout(saveSettingsTimeout);
  }
  
  // Abort any previous pending save request
  if (saveSettingsController) {
    saveSettingsController.abort();
    saveSettingsController = null;
  }
  
  saveSettingsTimeout = setTimeout(async () => {
    const settings = collectGenerationSettings();
    state.generationSettings = settings;
    
    // Create new AbortController for this request
    saveSettingsController = new AbortController();
    const signal = saveSettingsController.signal;
    
    try {
      await fetchWithTimeout(`/api/custom-shoots/${state.currentShoot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationSettings: settings }),
        signal
      }, 15000); // 15 second timeout
      
      console.log('[CustomShoot] Settings saved');
    } catch (e) {
      if (e.name === 'AbortError') {
        // Aborted by newer request, ignore
        return;
      }
      console.error('[CustomShoot] Error saving settings:', e.message);
    }
  }, 500); // 500ms debounce
}

/**
 * Initialize event listeners for auto-saving generation settings
 * NOTE: Only per-frame settings are tracked here
 */
function initSettingsAutoSave() {
  const settingsElements = [
    // Per-frame parameters
    elements.genLocation,
    elements.genEmotion,
    elements.genAspectRatio,
    elements.genImageSize,
    elements.genPoseAdherence,
    // Per-frame composition
    elements.genShotSize,
    elements.genCameraAngle
  ];
  
  // Add change listeners to all select elements
  settingsElements.forEach(el => {
    if (el) {
      el.addEventListener('change', saveGenerationSettings);
    }
  });
  
  // Add input listener to extra prompt (with debounce already in saveGenerationSettings)
  if (elements.genExtraPrompt) {
    elements.genExtraPrompt.addEventListener('input', saveGenerationSettings);
  }
}

// NOTE: Legacy conflict checking and shoot type handling removed
// All visual settings are now controlled via Universe params

// ═══════════════════════════════════════════════════════════════
// STEP 4: GENERATE (frames are selected directly here)
// ═══════════════════════════════════════════════════════════════

function renderGeneratePage() {
  // Render universe params blocks (Custom Shoot 4 - new architecture)
  renderUniverseParamsUI();
  
  // Populate location dropdown
  elements.genLocation.innerHTML = '<option value="">Без конкретной</option>';
  state.locations.forEach(loc => {
    elements.genLocation.innerHTML += `<option value="${loc.id}">${escapeHtml(loc.label)}</option>`;
  });
  
  // Populate emotion dropdown (grouped by energy category)
  elements.genEmotion.innerHTML = '<option value="">Нейтральная (без эмоции)</option>';
  
  // Group emotions by category
  const emotionsByCategory = {};
  state.emotions.forEach(e => {
    if (!emotionsByCategory[e.category]) {
      emotionsByCategory[e.category] = [];
    }
    emotionsByCategory[e.category].push(e);
  });
  
  // Category labels
  const categoryLabels = {
    'energy_low': '🌙 Тихие',
    'energy_medium': '⚡ Активные',
    'energy_high': '🔥 Яркие',
    'camera_aware': '📷 С камерой',
    'transitional': '✨ Переходные'
  };
  
  // Render grouped options
  for (const [catId, emotions] of Object.entries(emotionsByCategory)) {
    if (emotions.length > 0) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = categoryLabels[catId] || catId;
      emotions.forEach(e => {
        const option = document.createElement('option');
        option.value = e.id;
        option.textContent = e.label;
        option.title = e.shortDescription || '';
        optgroup.appendChild(option);
      });
      elements.genEmotion.appendChild(optgroup);
    }
  }
  
  // Apply saved generation settings AFTER populating dropdowns
  applyGenerationSettings(state.generationSettings);
  
  // Update lock UI
  updateLockUI();
  
  // Render frames to generate
  renderFramesToGenerate();
  
  // Render history
  renderGeneratedHistory();
}

// NOTE: Ambient section removed - weather/time now in Universe params

function updateLockUI() {
  // Style Lock (Location Lock removed - location is implied in Style Lock)
  elements.styleLockOff.classList.toggle('active', !state.styleLock.enabled);
  elements.styleLockStrict.classList.toggle('active', state.styleLock.enabled && state.styleLock.mode === 'strict');
  elements.styleLockSoft.classList.toggle('active-soft', state.styleLock.enabled && state.styleLock.mode === 'soft');
  
  if (state.styleLock.imageUrl) {
    elements.styleLockImg.src = state.styleLock.imageUrl;
    elements.styleLockPreview.classList.add('active');
  } else {
    elements.styleLockPreview.classList.remove('active');
  }
}

async function setStyleLockMode(mode) {
  if (mode === 'off') {
    // Clear style lock
    try {
      await fetchWithTimeout(`/api/custom-shoots/${state.currentShoot.id}/lock-style`, { method: 'DELETE' }, 5000);
      state.styleLock = { enabled: false, mode: null, imageId: null, imageUrl: null };
      updateLockUI();
      renderGeneratedHistory();
    } catch (e) {
      console.error('Error clearing style lock:', e);
    }
  } else {
    // Need an image to lock
    if (!state.styleLock.imageId && state.generatedFrames.length > 0) {
      // Use the last generated image
      const lastImage = state.generatedFrames[0];
      await setAsStyleRef(lastImage.id);
    }
    
    if (state.styleLock.imageId) {
      // Update mode
      try {
        await fetchWithTimeout(`/api/custom-shoots/${state.currentShoot.id}/lock-style`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId: state.styleLock.imageId, mode })
        }, 5000);
        state.styleLock.mode = mode;
        state.styleLock.enabled = true;
        updateLockUI();
      } catch (e) {
        console.error('Error setting style lock mode:', e);
      }
    } else {
      alert('Сначала сгенерируйте кадр, затем установите его как референс.');
    }
  }
}

// Location Lock removed - location is implied in Style Lock
// If you need a specific location, select it from the Location dropdown
// Style Lock already includes the background/location from the reference image

async function setAsStyleRef(imageId) {
  const image = state.generatedFrames.find(f => f.id === imageId);
  if (!image) return;
  
  const mode = state.styleLock.mode || 'strict';
  
  try {
    const res = await fetchWithTimeout(`/api/custom-shoots/${state.currentShoot.id}/lock-style`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId, mode })
    }, 5000);
    const data = await res.json();
    
    if (data.ok) {
      state.styleLock = {
        enabled: true,
        mode,
        imageId,
        imageUrl: image.imageUrl
      };
      
      // Update isStyleReference flags
      state.generatedFrames.forEach(f => {
        f.isStyleReference = f.id === imageId;
      });
      
      // Apply style settings from reference frame to UI
      applySettingsFromFrame(image, 'style');
      
      updateLockUI();
      renderGeneratedHistory();
    }
  } catch (e) {
    console.error('Error setting style ref:', e);
  }
}

/**
 * Apply settings from a reference frame to UI controls
 * @param {Object} frame - The reference frame
 * @param {string} type - 'style' (location type removed - implied in style)
 */
function applySettingsFromFrame(frame, type) {
  if (!frame) return;
  
  console.log(`[CustomShoot] Applying ${type} settings from frame:`, frame.frameLabel);
  
  if (type === 'style') {
    // Style lock now uses Universe params which are locked for the whole shoot
    // The reference frame's universeParams can be used for the next generations
    // Location is also implied in Style Lock - no need for separate location lock
    if (frame.universeParams) {
      // Apply universe params to state
      state.universeValues = { ...frame.universeParams };
      // Re-render universe params UI to reflect the values
      renderUniverseParamsUI();
      console.log('[CustomShoot] Universe params applied from style reference');
    }
  }
}

// setAsLocationRef removed - Location Lock functionality removed
// Location is now implied in Style Lock

function renderFramesToGenerate() {
  // Show ALL frames from catalog (no pre-selection required)
  if (state.frames.length === 0) {
    elements.framesToGenerate.innerHTML = `
      <div style="padding: 20px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px;">
        <h4 style="margin-bottom: 12px; font-size: 12px; text-transform: uppercase; color: var(--color-text-muted);">Кадры для генерации</h4>
        <div class="frame-gen-card" data-frame-id="" style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-bg); border: 2px solid var(--color-accent); border-radius: 8px;">
          <div style="width: 60px; height: 80px; background: var(--color-surface); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🎯</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">По умолчанию</div>
            <div style="font-size: 12px; color: var(--color-text-muted);">Генерация без конкретного эскиза позы</div>
          </div>
          <button class="btn btn-primary btn-gen-frame" data-frame-id="" style="padding: 10px 20px; font-size: 13px;">🚀 Генерировать</button>
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: var(--color-text-muted);">
          💡 <a href="/editors/frame-editor.html">Создайте кадры</a> в редакторе для более точного контроля поз
        </div>
      </div>
    `;
  } else {
    // Show all frames from catalog
    const frameCards = state.frames.map((frame, idx) => {
      const sketchImg = frame.sketchUrl 
        ? `<img src="${frame.sketchUrl}" alt="sketch" style="width: 100%; height: 100%; object-fit: contain;">`
        : '<span style="font-size: 24px;">🖼️</span>';
      
      return `
        <div class="frame-gen-card" data-frame-id="${frame.id}" style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: 8px;">
          <div style="width: 60px; height: 80px; background: var(--color-surface); border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden;">${sketchImg}</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(frame.label)}</div>
            ${frame.description ? `<div style="font-size: 11px; color: var(--color-text-muted);">${escapeHtml(frame.description)}</div>` : ''}
          </div>
          <button class="btn btn-primary btn-gen-frame" data-frame-id="${frame.id}" style="padding: 10px 20px; font-size: 13px;">🚀 Генерировать</button>
        </div>
      `;
    }).join('');
    
    elements.framesToGenerate.innerHTML = `
      <div style="padding: 20px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px;">
        <h4 style="margin-bottom: 12px; font-size: 12px; text-transform: uppercase; color: var(--color-text-muted);">Кадры для генерации (${state.frames.length})</h4>
        ${frameCards}
        <div class="frame-gen-card" data-frame-id="" style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-bg); border: 1px dashed var(--color-border); border-radius: 8px; opacity: 0.7; margin-top: 8px;">
          <div style="width: 60px; height: 80px; background: var(--color-surface); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 20px;">🎯</div>
          <div style="flex: 1;">
            <div style="font-weight: 500;">По умолчанию (без эскиза)</div>
            <div style="font-size: 11px; color: var(--color-text-muted);">Свободная поза</div>
          </div>
          <button class="btn btn-secondary btn-gen-frame" data-frame-id="" style="padding: 10px 20px; font-size: 13px;">Генерировать</button>
        </div>
      </div>
    `;
  }
  
  // Click handlers are now delegated in initEventListeners()
}

/**
 * Generate a frame with full error handling, timeout, and logging
 */
async function generateFrame(frameId) {
  const genId = `gen_${Date.now() % 100000}`;
  const log = (msg, data) => console.log(`[Generate] [${genId}] ${msg}`, data || '');
  
  log('START', { frameId, shootId: state.currentShoot?.id });
  
  if (!state.currentShoot) {
    log('ERROR: No current shoot');
    return;
  }
  
  const modelCount = state.selectedModels.filter(m => m !== null).length;
  if (modelCount === 0) {
    log('ERROR: No models selected');
    alert('Сначала добавьте модель');
    return;
  }
  
  // Get button and show loading - with null check
  const btn = elements.framesToGenerate.querySelector(`.btn-gen-frame[data-frame-id="${frameId || ''}"]`);
  if (!btn) {
    log('ERROR: Button not found', { selector: `.btn-gen-frame[data-frame-id="${frameId || ''}"]` });
    alert('Ошибка: кнопка генерации не найдена. Обновите страницу.');
    return;
  }
  
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Генерация...';
  
  // Get settings (Custom Shoot 4 - new universe params architecture)
  const universeParams = collectUniverseParams();
  log('Collected universe params', { keys: Object.keys(universeParams) });
  
  const params = {
    frameId,
    locationId: elements.genLocation.value || null,
    emotionId: elements.genEmotion.value || null,
    extraPrompt: elements.genExtraPrompt.value.trim(),
    universeParams: universeParams,
    aspectRatio: elements.genAspectRatio?.value || '3:4',
    imageSize: elements.genImageSize?.value || '2K',
    poseAdherence: elements.genPoseAdherence?.value ? parseInt(elements.genPoseAdherence.value) : 2,
    composition: {
      shotSize: elements.genShotSize?.value || 'default',
      cameraAngle: elements.genCameraAngle?.value || 'eye_level'
    }
  };
  
  // Add placeholder
  const placeholderId = `pending_${Date.now()}`;
  state.generatedFrames.unshift({
    id: placeholderId,
    status: 'generating',
    timestamp: new Date().toISOString()
  });
  renderGeneratedHistory();
  
  // Create AbortController with 3 minute timeout
  const controller = new AbortController();
  const TIMEOUT_MS = 180000; // 3 minutes
  const timeoutId = setTimeout(() => {
    log('TIMEOUT: Aborting after 3 minutes');
    controller.abort();
  }, TIMEOUT_MS);
  
  const startTime = Date.now();
  
  try {
    log('FETCH_START', { url: `/api/custom-shoots/${state.currentShoot.id}/generate` });
    
    const requestBody = {
      frame: frameId ? state.frames.find(f => f.id === frameId) : null,
      emotionId: params.emotionId,
      extraPrompt: params.extraPrompt,
      locationId: params.locationId,
      aspectRatio: params.aspectRatio,
      imageSize: params.imageSize,
      poseAdherence: params.poseAdherence,
      universeParams: params.universeParams,
      composition: params.composition
    };
    
    const bodySize = JSON.stringify(requestBody).length;
    log('REQUEST_BODY_SIZE', { sizeKB: Math.round(bodySize / 1024) });
    
    const res = await fetch(`/api/custom-shoots/${state.currentShoot.id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const fetchDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    log('FETCH_COMPLETE', { status: res.status, duration: fetchDuration + 's' });
    
    if (!res.ok) {
      const errorText = await res.text();
      log('HTTP_ERROR', { status: res.status, body: errorText.slice(0, 200) });
      throw new Error(`HTTP ${res.status}: ${errorText.slice(0, 100)}`);
    }
    
    log('PARSING_RESPONSE');
    const data = await res.json();
    log('RESPONSE_PARSED', { ok: data.ok, hasImage: !!data.image });
    
    // Find and update placeholder
    const placeholderIndex = state.generatedFrames.findIndex(f => f.id === placeholderId);
    
    if (data.ok && data.image) {
      if (placeholderIndex >= 0) {
        state.generatedFrames[placeholderIndex] = {
          id: data.image.id,
          imageUrl: data.image.imageUrl,
          isStyleReference: false,
          status: 'ready',
          timestamp: new Date().toISOString(),
          frameId: data.image.frameId || null,
          frameLabel: data.image.frameLabel || 'По умолчанию',
          locationId: data.image.locationId || null,
          locationLabel: data.image.locationLabel || null,
          emotionId: data.image.emotionId || null,
          aspectRatio: data.image.aspectRatio || '3:4',
          imageSize: data.image.imageSize || '2K',
          poseAdherence: data.image.poseAdherence || 2,
          composition: data.image.composition || null,
          extraPrompt: data.image.extraPrompt || '',
          prompt: data.prompt || null,
          refs: data.refs || [],
          generationTime: data.image.generationTime || null,
          universeParams: data.image.universeParams || null
        };
        
        log('SUCCESS', { imageId: data.image.id, generationTime: data.image.generationTime });
      }
      
      elements.genExtraPrompt.value = '';
      renderGeneratedHistory();
      showToast('✅ Изображение сгенерировано!');
    } else {
      log('API_ERROR', { error: data.error });
      if (placeholderIndex >= 0) {
        state.generatedFrames[placeholderIndex].status = 'error';
        state.generatedFrames[placeholderIndex].error = data.error || 'Неизвестная ошибка';
        renderGeneratedHistory();
      }
      alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
    }
  } catch (e) {
    clearTimeout(timeoutId);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (e.name === 'AbortError') {
      log('ABORTED', { duration: duration + 's', reason: 'timeout or manual abort' });
      const placeholderIndex = state.generatedFrames.findIndex(f => f.id === placeholderId);
      if (placeholderIndex >= 0) {
        state.generatedFrames[placeholderIndex].status = 'error';
        state.generatedFrames[placeholderIndex].error = 'Таймаут: сервер не ответил за 3 минуты';
        renderGeneratedHistory();
      }
      alert('Таймаут: сервер не ответил за 3 минуты. Попробуйте ещё раз или обновите страницу.');
    } else {
      log('EXCEPTION', { name: e.name, message: e.message, duration: duration + 's' });
      console.error('[Generate] Full error:', e);
      
      const placeholderIndex = state.generatedFrames.findIndex(f => f.id === placeholderId);
      if (placeholderIndex >= 0) {
        state.generatedFrames[placeholderIndex].status = 'error';
        state.generatedFrames[placeholderIndex].error = e.message;
        renderGeneratedHistory();
      }
      alert('Ошибка сети: ' + e.message);
    }
  } finally {
    log('CLEANUP');
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function renderGeneratedHistory() {
  const readyCount = state.generatedFrames.filter(f => f.status !== 'generating' && f.status !== 'error').length;
  elements.generationCount.textContent = `${readyCount} изображений`;
  
  if (state.generatedFrames.length === 0) {
    elements.imagesGallery.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 40px;">
        <div class="empty-state-icon">🎨</div>
        <div class="empty-state-title">Нет сгенерированных кадров</div>
        <div class="empty-state-text">Нажми "Генерировать" выше</div>
      </div>
    `;
    return;
  }
  
  elements.imagesGallery.innerHTML = state.generatedFrames.map((frame, idx) => {
    const timestamp = frame.timestamp ? new Date(frame.timestamp).toLocaleTimeString() : '';
    
    // Generating placeholder
    if (frame.status === 'generating') {
      return `
        <div class="selection-card generated-frame-card generating" style="cursor: default;">
          <div class="selection-card-preview" style="aspect-ratio: 3/4; background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-bg) 100%); display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <div style="width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px;"></div>
              <div style="font-size: 13px; color: var(--color-text-muted);">Генерация...</div>
            </div>
          </div>
        </div>
      `;
    }
    
    // Error
    if (frame.status === 'error') {
      return `
        <div class="selection-card generated-frame-card" style="cursor: default; border-color: var(--color-accent);">
          <div class="selection-card-preview" style="aspect-ratio: 3/4; background: rgba(239, 68, 68, 0.1); display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 32px; margin-bottom: 12px;">❌</div>
              <div style="font-size: 13px; color: var(--color-accent);">Ошибка</div>
            </div>
          </div>
          <button class="btn btn-secondary" style="margin-top: 8px; width: 100%; font-size: 12px;" data-delete-frame="${idx}">Удалить</button>
        </div>
      `;
    }
    
    // Ready frame
    const isStyleRef = frame.isStyleReference;
    
    let borderColor = 'var(--color-border)';
    if (isStyleRef) borderColor = '#F59E0B';
    
    // Build refs HTML with images (same as shoot-composer)
    const refs = frame.refs || [];
    const refsHtml = refs.length > 0
      ? `<div style="display:grid; grid-template-columns: repeat(${Math.min(refs.length, 3)}, 1fr); gap:8px; margin-top:8px;">
          ${refs.map(r => {
            const url = r.previewUrl || '';
            const label = r.label || r.kind || 'ref';
            if (!url) return '';
            return `
              <div style="text-align: center;">
                <div style="font-size:10px; color:var(--color-text-muted); margin-bottom:4px;">${escapeHtml(label)}</div>
                <img src="${url}" alt="${escapeHtml(label)}" 
                     style="width:100%; height:60px; object-fit:cover; border-radius:6px; border:1px solid var(--color-border);">
              </div>
            `;
          }).join('')}
        </div>`
      : '<div style="font-size:11px; color:var(--color-text-muted);">Нет референсов</div>';
    
    // Build settings HTML (same as shoot-composer)
    const settingsHtml = buildFrameSettingsHtml(frame);
    
    return `
      <div class="selection-card generated-frame-card" style="cursor: default; position: relative; border-color: ${borderColor};">
        <!-- Lock badges -->
        <div class="history-lock-badges">
          ${isStyleRef ? '<span class="history-lock-badge style">🎨</span>' : ''}
        </div>
        
        <div class="selection-card-preview btn-open-lightbox" data-frame-index="${idx}" style="aspect-ratio: 3/4; cursor: pointer;" title="Клик для просмотра">
          <img src="${frame.imageUrl}" alt="${escapeHtml(frame.frameLabel || 'Кадр')}" style="object-fit: contain; background: #000; pointer-events: none;">
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <div class="selection-card-title" style="margin: 0;">${escapeHtml(frame.frameLabel || 'Кадр')}</div>
          <span style="font-size: 11px; color: var(--color-text-muted);">${timestamp}</span>
        </div>
        ${frame.locationLabel ? `<div style="font-size: 12px; color: var(--color-text-muted);">📍 ${escapeHtml(frame.locationLabel)}</div>` : ''}
        ${frame.generationTime ? `<div style="font-size: 11px; color: var(--color-text-muted);">⏱️ ${frame.generationTime}s</div>` : ''}
        
        <!-- Actions -->
        <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 8px;">
            <a href="${frame.imageUrl}" download="custom-shoot-${idx}.png" class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px; flex: 1;" title="Скачать">💾</a>
            <button class="btn btn-secondary" onclick="window.copyFrameSettings(${idx})" style="padding: 8px 12px; font-size: 12px; flex: 1;" title="Применить настройки этого кадра">📋</button>
            <button class="btn btn-secondary btn-set-style-ref" data-image-id="${frame.id}" style="padding: 8px 12px; font-size: 12px; flex: 1;" title="Style Lock (включает локацию)">🎨</button>
            <button class="btn btn-secondary" data-delete-frame="${idx}" style="padding: 8px 12px; font-size: 12px; color: var(--color-accent);" title="Удалить">✕</button>
          </div>
        </div>
        
        <!-- Settings used for this frame -->
        <details style="margin-top: 12px; width: 100%;">
          <summary style="cursor: pointer; font-size: 11px; color: var(--color-text-muted); user-select: none;">
            ⚙️ Настройки кадра
          </summary>
          <div style="margin-top: 10px; text-align: left; font-size: 11px; background: var(--color-surface); padding: 10px; border-radius: 8px; border: 1px solid var(--color-border);">
            ${settingsHtml}
          </div>
        </details>
        
        <!-- Debug: Prompt + Refs -->
        <details style="margin-top: 8px; width: 100%;">
          <summary style="cursor: pointer; font-size: 11px; color: var(--color-text-muted); user-select: none;">
            📋 Промпт и референсы
          </summary>
          <div style="margin-top: 10px; text-align: left;">
            ${refsHtml}
            <pre style="white-space: pre-wrap; word-break: break-word; background: var(--color-surface-elevated); color: var(--color-text); padding: 10px; border-radius: 8px; max-height: 150px; overflow: auto; font-size: 10px; font-family: monospace; border: 1px solid var(--color-border); margin-top: 10px;">${escapeHtml(frame.prompt || 'N/A')}</pre>
          </div>
        </details>
      </div>
    `;
  }).join('');
  
  // Click handlers are delegated in initEventListeners() - no need to re-attach
}

/**
 * Copy settings from a generated frame to current settings
 * Applies: Universe params, location, emotion, aspect ratio, image size, pose adherence, composition
 * Does NOT apply: Frame/pose sketch (user chooses their own)
 */
function copyFrameSettings(frameIndex) {
  const frame = state.generatedFrames[frameIndex];
  if (!frame) {
    console.warn('[CopySettings] Frame not found at index:', frameIndex);
    showToast('❌ Кадр не найден');
    return;
  }
  
  console.log('[CopySettings] === STARTING COPY ===');
  console.log('[CopySettings] Frame data:', JSON.stringify(frame, null, 2).slice(0, 1000));
  console.log('[CopySettings] universeParams:', frame.universeParams);
  
  const changedElements = []; // Track changed elements for highlighting
  let changeLog = [];
  
  // Helper function to safely set select value
  function setSelectValue(selectEl, value, label) {
    if (!selectEl) {
      console.log(`[CopySettings] ${label}: element not found`);
      return false;
    }
    if (value === undefined || value === null) {
      console.log(`[CopySettings] ${label}: no value to set`);
      return false;
    }
    
    const oldValue = selectEl.value;
    const strValue = String(value);
    
    // Check if option exists
    const optionExists = Array.from(selectEl.options).some(opt => opt.value === strValue);
    if (!optionExists) {
      console.log(`[CopySettings] ${label}: option "${strValue}" not found in select`);
      return false;
    }
    
    selectEl.value = strValue;
    
    if (oldValue !== selectEl.value) {
      changedElements.push(selectEl);
      changeLog.push(`${label}: ${oldValue} → ${selectEl.value}`);
      console.log(`[CopySettings] ${label}: CHANGED from "${oldValue}" to "${selectEl.value}"`);
      return true;
    } else {
      console.log(`[CopySettings] ${label}: already set to "${strValue}"`);
      return false;
    }
  }
  
  // 1. Apply Universe params (all visual settings)
  if (frame.universeParams && typeof frame.universeParams === 'object') {
    console.log('[CopySettings] Applying universe params:', Object.keys(frame.universeParams));
    state.universeValues = { ...frame.universeParams };
    
    // Update all universe select elements
    const universeSelects = document.querySelectorAll('.universe-param-select');
    console.log(`[CopySettings] Found ${universeSelects.length} universe selects`);
    
    universeSelects.forEach(select => {
      const paramId = select.dataset.paramId;
      if (paramId && frame.universeParams[paramId] !== undefined) {
        setSelectValue(select, frame.universeParams[paramId], `Universe.${paramId}`);
      }
    });
    
    // Update narrative preview
    if (typeof updateNarrativePreview === 'function') {
      updateNarrativePreview();
    }
  } else {
    console.log('[CopySettings] No universeParams in frame');
  }
  
  // 2. Apply per-frame settings
  
  // Location
  if (frame.locationId) {
    setSelectValue(elements.genLocation, frame.locationId, 'Location');
  }
  
  // Emotion
  if (frame.emotionId) {
    setSelectValue(elements.genEmotion, frame.emotionId, 'Emotion');
  }
  
  // Aspect ratio
  if (frame.aspectRatio) {
    setSelectValue(elements.genAspectRatio, frame.aspectRatio, 'AspectRatio');
  }
  
  // Image size
  if (frame.imageSize) {
    setSelectValue(elements.genImageSize, frame.imageSize, 'ImageSize');
  }
  
  // Pose adherence
  if (frame.poseAdherence) {
    setSelectValue(elements.genPoseAdherence, frame.poseAdherence, 'PoseAdherence');
  }
  
  // Composition (shot size, camera angle)
  if (frame.composition) {
    if (frame.composition.shotSize) {
      setSelectValue(elements.genShotSize, frame.composition.shotSize, 'ShotSize');
    }
    if (frame.composition.cameraAngle) {
      setSelectValue(elements.genCameraAngle, frame.composition.cameraAngle, 'CameraAngle');
    }
  }
  
  // Extra prompt
  if (frame.extraPrompt && elements.genExtraPrompt) {
    elements.genExtraPrompt.value = frame.extraPrompt;
    changedElements.push(elements.genExtraPrompt);
    changeLog.push(`ExtraPrompt: set`);
  }
  
  // Save updated settings
  saveGenerationSettings();
  
  console.log('[CopySettings] === COPY COMPLETE ===');
  console.log('[CopySettings] Changed elements:', changedElements.length);
  console.log('[CopySettings] Change log:', changeLog);
  
  // Highlight changed elements with animation
  changedElements.forEach(el => {
    if (!el) return;
    el.style.transition = 'box-shadow 0.3s, border-color 0.3s';
    el.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.5)';
    el.style.borderColor = '#22c55e';
    
    setTimeout(() => {
      el.style.boxShadow = '';
      el.style.borderColor = '';
    }, 2000);
  });
  
  // Scroll to Universe params section
  const universeContainer = document.getElementById('universe-params-container');
  if (universeContainer) {
    universeContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  // Show confirmation with count
  showToast(`✅ Применено ${changedElements.length} настроек! Выберите эскиз позы и нажмите «Генерировать»`);
}

async function deleteFrame(index) {
  const frame = state.generatedFrames[index];
  if (!frame) return;
  
  // Delete from server if has ID
  if (frame.id && !frame.id.startsWith('pending_')) {
    try {
      await fetchWithTimeout(`/api/custom-shoots/${state.currentShoot.id}/images/${frame.id}`, { method: 'DELETE' }, 5000);
    } catch (e) {
      console.error('Error deleting from server:', e);
    }
  }
  
  state.generatedFrames.splice(index, 1);
  renderGeneratedHistory();
}

function clearGenerationHistory() {
  if (!confirm('Очистить всю историю?')) return;
  state.generatedFrames = [];
  renderGeneratedHistory();
}

// ═══════════════════════════════════════════════════════════════
// LIGHTBOX
// ═══════════════════════════════════════════════════════════════

const lightbox = {
  overlay: null,
  image: null,
  currentIndex: 0,
  images: []
};

function initLightbox() {
  lightbox.overlay = document.getElementById('lightbox');
  lightbox.image = document.getElementById('lightbox-image');
  
  if (!lightbox.overlay) return;
  
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev').addEventListener('click', () => navigateLightbox(-1));
  document.getElementById('lightbox-next').addEventListener('click', () => navigateLightbox(1));
  
  lightbox.overlay.addEventListener('click', (e) => {
    if (e.target === lightbox.overlay) closeLightbox();
  });
  
  document.addEventListener('keydown', (e) => {
    if (!lightbox.overlay.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });
}

function openLightbox(index) {
  lightbox.images = state.generatedFrames
    .filter(f => f.imageUrl && f.status !== 'generating' && f.status !== 'error')
    .map(f => f.imageUrl);
  
  if (lightbox.images.length === 0) return;
  
  lightbox.currentIndex = index;
  updateLightboxImage();
  lightbox.overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function navigateLightbox(direction) {
  lightbox.currentIndex = Math.max(0, Math.min(lightbox.images.length - 1, lightbox.currentIndex + direction));
  updateLightboxImage();
}

function updateLightboxImage() {
  lightbox.image.src = lightbox.images[lightbox.currentIndex] || '';
  document.getElementById('lightbox-info').textContent = `${lightbox.currentIndex + 1} / ${lightbox.images.length}`;
  document.getElementById('lightbox-prev').disabled = lightbox.currentIndex === 0;
  document.getElementById('lightbox-next').disabled = lightbox.currentIndex === lightbox.images.length - 1;
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Labels for settings display
const ASPECT_RATIO_LABELS = {
  '3:4': '📱 3:4 (Портрет)',
  '4:3': '🖼️ 4:3 (Пейзаж)',
  '1:1': '⬜ 1:1 (Квадрат)',
  '9:16': '📲 9:16 (Сторис)',
  '16:9': '🎬 16:9 (Кино)'
};

const IMAGE_SIZE_LABELS = {
  '1K': '1K (быстро)',
  '2K': '2K (стандарт)',
  '4K': '4K (качество)'
};

const POSE_ADHERENCE_LABELS = {
  1: 'Свободно (только тип позы)',
  2: 'Похоже (поза 30-40%)',
  3: 'Близко (поза 70-80%)',
  4: 'Точно (поза + кадрирование)'
};

function buildFrameSettingsHtml(frame) {
  const items = [];
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 1: Basic frame info
  // ═══════════════════════════════════════════════════════════════
  
  // Image format (aspect ratio + size)
  const aspectLabel = ASPECT_RATIO_LABELS[frame.aspectRatio] || frame.aspectRatio || '3:4';
  const sizeLabel = IMAGE_SIZE_LABELS[frame.imageSize] || frame.imageSize || '2K';
  items.push(`<div><strong>📐 Формат:</strong> ${aspectLabel}, ${sizeLabel}</div>`);
  
  // Generation time
  if (frame.generationTime) {
    items.push(`<div><strong>⏱️ Время:</strong> ${frame.generationTime}s</div>`);
  }
  
  // Pose adherence
  if (frame.poseAdherence) {
    items.push(`<div><strong>🎯 Следование эскизу:</strong> ${POSE_ADHERENCE_LABELS[frame.poseAdherence] || frame.poseAdherence}/4</div>`);
  }
  
  // Emotion
  if (frame.emotionId) {
    const emotion = state.emotions.find(e => e.id === frame.emotionId);
    items.push(`<div><strong>😊 Эмоция:</strong> ${emotion?.label || frame.emotionId}</div>`);
  }
  
  // Location
  if (frame.locationLabel) {
    items.push(`<div><strong>📍 Локация:</strong> ${escapeHtml(frame.locationLabel)}</div>`);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 2: Universe Params (ALL of them)
  // ═══════════════════════════════════════════════════════════════
  
  if (frame.universeParams && typeof frame.universeParams === 'object') {
    const up = frame.universeParams;
    
    items.push(`<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--color-border);"><strong>🧬 Universe настройки:</strong></div>`);
    
    // Human-readable labels for universe params
    const paramLabels = {
      // Approach
      shootingApproach: '📷 Подход',
      productDiscipline: '👗 Приоритет продукта',
      
      // Tech
      cameraClass: '📸 Камера',
      exposureIntent: '💡 Экспозиция',
      shutterIntent: '⏱️ Затвор',
      processingStyle: '🎨 Обработка',
      retouchLevel: '✨ Ретушь',
      
      // Era
      decade: '📅 Эпоха',
      culturalContext: '🎭 Контекст',
      
      // Color
      whiteBalance: '🌡️ Баланс белого',
      wbShift: '↔️ Сдвиг WB',
      saturation: '🎨 Насыщенность',
      contrastCurve: '📈 Контраст',
      shadowTone: '🌑 Тени',
      highlightTone: '☀️ Света',
      
      // Lens
      focalRange: '🔭 Фокусное',
      apertureIntent: '📷 Диафрагма',
      distortionPolicy: '🔍 Дисторсия',
      cameraProximity: '📏 Дистанция',
      
      // Mood
      visualMood: '💫 Атмосфера',
      energyLevel: '⚡ Энергия',
      spontaneity: '🎲 Спонтанность',
      primaryFocus: '🎯 Фокус',
      
      // Lighting
      lightSource: '💡 Источник света',
      lightDirection: '➡️ Направление',
      lightQuality: '✨ Качество света',
      timeOfDay: '🕐 Время суток',
      weatherLighting: '🌤️ Погода',
      season: '🍂 Сезон',
      
      // Anti-AI
      antiAiLevel: '🤖 Anti-AI'
    };
    
    // Group params by category for display
    const categories = {
      'Подход': ['shootingApproach', 'productDiscipline'],
      'Техника': ['cameraClass', 'exposureIntent', 'shutterIntent', 'processingStyle', 'retouchLevel'],
      'Эпоха': ['decade', 'culturalContext'],
      'Цвет': ['whiteBalance', 'wbShift', 'saturation', 'contrastCurve', 'shadowTone', 'highlightTone'],
      'Оптика': ['focalRange', 'apertureIntent', 'distortionPolicy', 'cameraProximity'],
      'Атмосфера': ['visualMood', 'energyLevel', 'spontaneity', 'primaryFocus'],
      'Освещение': ['lightSource', 'lightDirection', 'lightQuality', 'timeOfDay', 'weatherLighting', 'season'],
      'Реализм': ['antiAiLevel']
    };
    
    for (const [catName, paramKeys] of Object.entries(categories)) {
      const catItems = [];
      for (const key of paramKeys) {
        if (up[key] !== undefined && up[key] !== null && up[key] !== '') {
          const label = paramLabels[key] || key;
          const value = formatUniverseValue(key, up[key]);
          catItems.push(`${label}: <span style="color: var(--color-primary);">${value}</span>`);
        }
      }
      if (catItems.length > 0) {
        items.push(`<div style="font-size: 10px; margin-top: 4px;"><strong>${catName}:</strong> ${catItems.join(' · ')}</div>`);
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION 3: Extra prompt
  // ═══════════════════════════════════════════════════════════════
  
  if (frame.extraPrompt) {
    items.push(`<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--color-border);"><strong>💬 Доп. промпт:</strong><br><em style="font-size: 10px;">${escapeHtml(frame.extraPrompt)}</em></div>`);
  }
  
  return items.join('');
}

/**
 * Format universe param value for display
 */
function formatUniverseValue(key, value) {
  if (value === null || value === undefined) return '—';
  
  // Convert snake_case to readable
  const readable = String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  return readable;
}

/**
 * Migrate old clothing refs format to new ClothingItem format
 * Old: [{ url, description }, ...]
 * New: [{ id, name, prompt, images: [{ id, url, view }] }, ...]
 */
function migrateOldClothingRefs(oldRefs) {
  if (!Array.isArray(oldRefs)) return [];
  
  // Check if already new format
  if (oldRefs.length > 0 && oldRefs[0].images) {
    return oldRefs;
  }
  
  // Migrate: each old ref becomes a separate ClothingItem with one image
  return oldRefs.map((ref, index) => ({
    id: `migrated_${Date.now()}_${index}`,
    name: ref.description || `Предмет ${index + 1}`,
    prompt: ref.description || '',
    images: [{
      id: `img_migrated_${index}`,
      url: ref.url,
      view: 'front'
    }],
    createdAt: new Date().toISOString()
  }));
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Show a toast notification
 */
function showToast(message, duration = 3000) {
  // Remove existing toast
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-surface-elevated, #1a1a1a);
    color: var(--color-text, #fff);
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 1px solid var(--color-border, #333);
    z-index: 10000;
    animation: toast-slide-up 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'toast-slide-down 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

async function checkServerStatus() {
  try {
    const res = await fetchWithTimeout('/api/health', {}, 5000);
    const data = await res.json();
    elements.serverStatus.textContent = data.ok ? 'Сервер работает' : 'Ошибка';
  } catch (e) {
    console.warn('[CheckServer] Error:', e.message);
    elements.serverStatus.textContent = 'Нет связи';
  }
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

async function init() {
  console.log('[Init] Starting...');
  
  try {
    initElements();
    console.log('[Init] Elements OK');
    
    initEventListeners();
    console.log('[Init] EventListeners OK');
    
    initLightbox();
    initSettingsAutoSave();
    initClothingEventDelegation();
    console.log('[Init] Components OK');
    
    await checkServerStatus();
    console.log('[Init] Server check OK');
    
    console.log('[Init] Loading data...');
    await Promise.all([
      loadShoots(),
      loadModels(),
      loadFrames(),
      loadLocations(),
      loadEmotions(),
      loadUniverseParams()
    ]);
    console.log('[Init] Data loaded OK');
    
    updateStepStatuses();
    console.log('[Init] Complete!');
  } catch (e) {
    console.error('[Init] CRITICAL ERROR:', e);
    alert('Ошибка загрузки страницы: ' + e.message + '\n\nПопробуйте обновить страницу.');
  }
}

document.addEventListener('DOMContentLoaded', init);

// CSS for spin animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// ═══════════════════════════════════════════════════════════════
// GLOBAL EXPORTS (for inline onclick handlers)
// ═══════════════════════════════════════════════════════════════

window.copyFrameSettings = function(frameIndex) {
  console.log('[CopySettings] Button clicked, frameIndex:', frameIndex);
  
  const frame = state.generatedFrames[frameIndex];
  if (!frame) {
    console.error('[CopySettings] Frame not found at index:', frameIndex);
    alert('Кадр не найден');
    return;
  }
  
  console.log('[CopySettings] Frame found:', frame.id);
  console.log('[CopySettings] Frame universeParams:', frame.universeParams);
  console.log('[CopySettings] Frame keys:', Object.keys(frame));
  
  let changedCount = 0;
  
  // 1. Apply Universe params
  if (frame.universeParams && typeof frame.universeParams === 'object') {
    const keys = Object.keys(frame.universeParams);
    console.log('[CopySettings] Applying', keys.length, 'universe params:', keys);
    
    state.universeValues = { ...frame.universeParams };
    
    document.querySelectorAll('.universe-param-select').forEach(select => {
      const paramId = select.dataset.paramId;
      if (paramId && frame.universeParams[paramId] !== undefined) {
        const newValue = String(frame.universeParams[paramId]);
        if (select.value !== newValue) {
          console.log(`[CopySettings] ${paramId}: "${select.value}" → "${newValue}"`);
          select.value = newValue;
          changedCount++;
          // Highlight
          select.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.5)';
          select.style.borderColor = '#22c55e';
          setTimeout(() => {
            select.style.boxShadow = '';
            select.style.borderColor = '';
          }, 2000);
        }
      }
    });
    
    // Update narrative preview
    if (typeof updateNarrativePreview === 'function') {
      updateNarrativePreview();
    }
  } else {
    console.log('[CopySettings] No universeParams in frame');
  }
  
  // 2. Location
  if (frame.locationId && elements.genLocation) {
    if (elements.genLocation.value !== frame.locationId) {
      elements.genLocation.value = frame.locationId;
      changedCount++;
      console.log('[CopySettings] Location:', frame.locationId);
    }
  }
  
  // 3. Emotion
  if (frame.emotionId && elements.genEmotion) {
    if (elements.genEmotion.value !== frame.emotionId) {
      elements.genEmotion.value = frame.emotionId;
      changedCount++;
      console.log('[CopySettings] Emotion:', frame.emotionId);
    }
  }
  
  // 4. Aspect ratio
  if (frame.aspectRatio && elements.genAspectRatio) {
    if (elements.genAspectRatio.value !== frame.aspectRatio) {
      elements.genAspectRatio.value = frame.aspectRatio;
      changedCount++;
      console.log('[CopySettings] AspectRatio:', frame.aspectRatio);
    }
  }
  
  // 5. Image size
  if (frame.imageSize && elements.genImageSize) {
    if (elements.genImageSize.value !== frame.imageSize) {
      elements.genImageSize.value = frame.imageSize;
      changedCount++;
      console.log('[CopySettings] ImageSize:', frame.imageSize);
    }
  }
  
  // 6. Pose adherence
  if (frame.poseAdherence && elements.genPoseAdherence) {
    const strVal = String(frame.poseAdherence);
    if (elements.genPoseAdherence.value !== strVal) {
      elements.genPoseAdherence.value = strVal;
      changedCount++;
      console.log('[CopySettings] PoseAdherence:', frame.poseAdherence);
    }
  }
  
  // 7. Extra prompt
  if (frame.extraPrompt && elements.genExtraPrompt) {
    elements.genExtraPrompt.value = frame.extraPrompt;
    console.log('[CopySettings] ExtraPrompt: set');
  }
  
  // Save
  saveGenerationSettings();
  
  // Scroll to universe params
  const container = document.getElementById('universe-params-container');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  // Toast
  console.log('[CopySettings] DONE. Changed:', changedCount);
  showToast(`✅ Применено ${changedCount} настроек`);
};
