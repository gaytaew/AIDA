/**
 * Custom Shoot Composer
 * 
 * Same workflow as Shoot Composer, but without pre-defined universe.
 * Universe settings are configured manually on the generation step.
 * Reference Locks (Style Lock, Location Lock) ensure consistency.
 */

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
  clothingByModel: [[], [], []],

  // Generated frames history
  generatedFrames: [],

  // Reference Locks state
  styleLock: { enabled: false, mode: null, imageId: null, imageUrl: null },
  locationLock: { enabled: false, mode: null, imageId: null, imageUrl: null },

  // Generation settings (persisted per shoot)
  generationSettings: {}
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

  // Generation controls
  elements.genLocation = document.getElementById('gen-location');
  elements.genExtraPrompt = document.getElementById('gen-extra-prompt');
  elements.genCaptureStyle = document.getElementById('gen-capture-style');
  elements.genColor = document.getElementById('gen-color');
  elements.genSkinTexture = document.getElementById('gen-skin-texture');
  elements.genEra = document.getElementById('gen-era');
  elements.genAspectRatio = document.getElementById('gen-aspect-ratio');
  elements.genImageSize = document.getElementById('gen-image-size');
  elements.genPoseAdherence = document.getElementById('gen-pose-adherence');
  elements.genEmotion = document.getElementById('gen-emotion');

  // NEW: 6-layer architecture controls
  elements.genShootType = document.getElementById('gen-shoot-type');
  elements.genCameraAesthetic = document.getElementById('gen-camera-aesthetic');
  elements.genLightingSource = document.getElementById('gen-lighting-source');
  elements.genLightingQuality = document.getElementById('gen-lighting-quality');
  elements.shootTypeHint = document.getElementById('shoot-type-hint');
  elements.conflictWarnings = document.getElementById('conflict-warnings');

  // Legacy hidden fields (for compatibility)
  elements.genCameraSignature = document.getElementById('gen-camera-signature');
  elements.genLight = document.getElementById('gen-light');

  // Composition controls
  elements.genShotSize = document.getElementById('gen-shot-size');
  elements.genCameraAngle = document.getElementById('gen-camera-angle');
  elements.genFocusMode = document.getElementById('gen-focus-mode');
  elements.genLensFocal = document.getElementById('gen-lens-focal');

  // Anti-AI
  elements.genAntiAiLevel = document.getElementById('gen-antiai-level');

  // Model Behavior (Layer 7)
  elements.genModelBehavior = document.getElementById('gen-model-behavior');
  elements.modelBehaviorHint = document.getElementById('model-behavior-hint');

  // Ambient controls (situational: weather, season, atmosphere)
  elements.ambientSection = document.getElementById('ambient-section');
  elements.genWeather = document.getElementById('gen-weather');
  elements.genTimeOfDay = document.getElementById('gen-time-of-day');
  elements.genSeason = document.getElementById('gen-season');
  elements.genAtmosphere = document.getElementById('gen-atmosphere');

  // Lock controls
  elements.styleLockOff = document.getElementById('style-lock-off');
  elements.styleLockStrict = document.getElementById('style-lock-strict');
  elements.styleLockSoft = document.getElementById('style-lock-soft');
  elements.styleLockPreview = document.getElementById('style-lock-preview');
  elements.styleLockImg = document.getElementById('style-lock-img');

  elements.locationLockOff = document.getElementById('location-lock-off');
  elements.locationLockStrict = document.getElementById('location-lock-strict');
  elements.locationLockSoft = document.getElementById('location-lock-soft');
  elements.locationLockPreview = document.getElementById('location-lock-preview');
  elements.locationLockImg = document.getElementById('location-lock-img');
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

  // Lock buttons
  elements.styleLockOff.addEventListener('click', () => setStyleLockMode('off'));
  elements.styleLockStrict.addEventListener('click', () => setStyleLockMode('strict'));
  elements.styleLockSoft.addEventListener('click', () => setStyleLockMode('soft'));

  elements.locationLockOff.addEventListener('click', () => setLocationLockMode('off'));
  elements.locationLockStrict.addEventListener('click', () => setLocationLockMode('strict'));
  elements.locationLockSoft.addEventListener('click', () => setLocationLockMode('soft'));
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

  const hasClothing = state.clothingByModel.some(c => c.length > 0);
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
    const res = await fetch('/api/custom-shoots');
    const data = await res.json();
    if (data.ok) {
      state.shoots = data.shoots || [];
    }
  } catch (e) {
    console.error('Error loading custom shoots:', e);
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
          ${shoot.hasStyleLock ? '• 🎨' : ''}
          ${shoot.hasLocationLock ? '• 🏠' : ''}
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
    const res = await fetch('/api/custom-shoots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label })
    });
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
    const res = await fetch(`/api/custom-shoots/${shootId}`);
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

  // Load clothing
  state.clothingByModel = [[], [], []];
  if (state.currentShoot.clothing) {
    state.currentShoot.clothing.forEach(c => {
      if (c.forModelIndex >= 0 && c.forModelIndex < 3) {
        state.clothingByModel[c.forModelIndex] = c.refs || [];
      }
    });
  }

  // Load generated images
  state.generatedFrames = (state.currentShoot.generatedImages || []).map(img => ({
    ...img, // Load ALL saved properties (prompt, refs, composition, settings, etc.)
    status: 'ready',
    timestamp: img.createdAt || img.timestamp,
    // Ensure booleans
    isStyleReference: !!img.isStyleReference,
    isLocationReference: !!img.isLocationReference
  }));

  // Load locks
  state.styleLock = state.currentShoot.locks?.style || { enabled: false, mode: null, imageId: null, imageUrl: null };
  state.locationLock = state.currentShoot.locks?.location || { enabled: false, mode: null, imageId: null, imageUrl: null };

  // Load generation settings
  state.generationSettings = state.currentShoot.generationSettings || {};
}

async function deleteShoot(shootId) {
  if (!confirm('Удалить этот Custom Shoot?')) return;

  try {
    const res = await fetch(`/api/custom-shoots/${shootId}`, { method: 'DELETE' });
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
    const res = await fetch('/api/models');
    const data = await res.json();
    if (data.ok) {
      state.models = data.data || [];
    }
  } catch (e) {
    console.error('Error loading models:', e);
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
    await fetch(`/api/custom-shoots/${state.currentShoot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ models })
    });
  } catch (e) {
    console.error('Error saving models:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 3: CLOTHING (simplified)
// ═══════════════════════════════════════════════════════════════

function renderClothingSections() {
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

    const clothing = state.clothingByModel[index] || [];

    return `
      <div class="clothing-section" data-model-index="${index}">
        <div class="clothing-section-header">
          <div class="clothing-section-avatar">
            ${model.previewSrc ? `<img src="${model.previewSrc}" alt="">` : ''}
          </div>
          <div class="clothing-section-title">${escapeHtml(model.name)}</div>
        </div>
        
        <label class="upload-zone" style="margin-bottom: 0;">
          <input type="file" multiple accept="image/*" class="clothing-input" data-index="${index}" style="display: none;">
          <div class="upload-zone-icon">👗</div>
          <div class="upload-zone-text">Загрузи референсы одежды</div>
        </label>
        
        ${clothing.length > 0 ? `
          <div class="clothing-items" style="margin-top: 16px;">
            ${clothing.map((c, ci) => `
              <div class="clothing-item" data-model="${index}" data-idx="${ci}">
                <div class="clothing-item-preview">
                  <img src="${c.url}" alt="Clothing ${ci + 1}">
                  <button class="image-thumb-remove" data-model="${index}" data-clothing="${ci}">✕</button>
                </div>
                <textarea 
                  class="clothing-description" 
                  data-model="${index}" 
                  data-idx="${ci}"
                  placeholder="Опишите фасон: длина, ширина, посадка, как сидит..."
                  rows="2"
                >${escapeHtml(c.description || '')}</textarea>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // Add event listeners
  elements.clothingSections.querySelectorAll('.clothing-input').forEach(input => {
    input.addEventListener('change', (e) => handleClothingUpload(e, parseInt(input.dataset.index)));
  });

  elements.clothingSections.querySelectorAll('.image-thumb-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeClothingItem(parseInt(btn.dataset.model), parseInt(btn.dataset.clothing));
    });
  });

  // Description input handlers
  elements.clothingSections.querySelectorAll('.clothing-description').forEach(textarea => {
    textarea.addEventListener('input', debounce(() => {
      const modelIdx = parseInt(textarea.dataset.model);
      const clothingIdx = parseInt(textarea.dataset.idx);
      if (state.clothingByModel[modelIdx] && state.clothingByModel[modelIdx][clothingIdx]) {
        state.clothingByModel[modelIdx][clothingIdx].description = textarea.value;
        saveShootClothing();
      }
    }, 500));
  });
}

async function handleClothingUpload(event, modelIndex) {
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('image/'));

  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    state.clothingByModel[modelIndex].push({ url: dataUrl });
  }

  await saveShootClothing();
  renderClothingSections();
  updateStepStatuses();

  event.target.value = '';
}

function removeClothingItem(modelIndex, clothingIndex) {
  state.clothingByModel[modelIndex].splice(clothingIndex, 1);
  saveShootClothing();
  renderClothingSections();
  updateStepStatuses();
}

async function saveShootClothing() {
  if (!state.currentShoot) return;

  const clothing = state.clothingByModel.map((refs, index) => ({
    forModelIndex: index,
    refs: refs
  })).filter(c => c.refs.length > 0);

  try {
    await fetch(`/api/custom-shoots/${state.currentShoot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clothing })
    });
  } catch (e) {
    console.error('Error saving clothing:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 4: FRAMES
// ═══════════════════════════════════════════════════════════════

async function loadFrames() {
  try {
    const res = await fetch('/api/frames');
    const data = await res.json();
    if (data.ok) {
      state.frames = data.data || [];
    }
  } catch (e) {
    console.error('Error loading frames:', e);
  }
}

async function loadLocations() {
  try {
    const res = await fetch('/api/locations');
    const data = await res.json();
    if (data.ok) {
      state.locations = data.data || [];
    }
  } catch (e) {
    console.error('Error loading locations:', e);
  }
}

async function loadEmotions() {
  try {
    const res = await fetch('/api/emotions/options');
    const data = await res.json();
    if (data.ok && data.data) {
      state.emotionCategories = data.data.categories || [];
      const grouped = data.data.emotions || {};
      state.emotions = [];
      for (const category of state.emotionCategories) {
        const categoryEmotions = grouped[category] || [];
        categoryEmotions.forEach(e => {
          state.emotions.push({ ...e, category });
        });
      }
    }
  } catch (e) {
    console.error('Error loading emotions:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// GENERATION SETTINGS PERSISTENCE
// ═══════════════════════════════════════════════════════════════

/**
 * Collect all current generation settings from UI
 */
function collectGenerationSettings() {
  return {
    // NEW: 6-layer architecture
    shootType: elements.genShootType?.value || 'editorial',
    cameraAesthetic: elements.genCameraAesthetic?.value || 'contax_t2',
    lightingSource: elements.genLightingSource?.value || 'natural_daylight',
    lightingQuality: elements.genLightingQuality?.value || 'soft_diffused',

    // Legacy (still collected for compatibility)
    cameraSignature: elements.genCameraSignature?.value || 'contax_t2',
    light: elements.genLight?.value || 'natural_soft',

    // Visual style
    captureStyle: elements.genCaptureStyle?.value || 'candid_aware',
    color: elements.genColor?.value || 'film_warm',
    skinTexture: elements.genSkinTexture?.value || 'natural_film',
    era: elements.genEra?.value || 'contemporary',

    // Frame parameters
    locationId: elements.genLocation?.value || '',
    emotionId: elements.genEmotion?.value || '',
    aspectRatio: elements.genAspectRatio?.value || '3:4',
    imageSize: elements.genImageSize?.value || '2K',
    poseAdherence: elements.genPoseAdherence?.value || '2',

    // Composition
    shotSize: elements.genShotSize?.value || 'default',
    cameraAngle: elements.genCameraAngle?.value || 'eye_level',
    focusMode: elements.genFocusMode?.value || 'shallow',
    lensFocalLength: elements.genLensFocal?.value || 'auto',

    // Anti-AI
    antiAiLevel: elements.genAntiAiLevel?.value || 'medium',

    // Model Behavior (Layer 7)
    modelBehavior: elements.genModelBehavior?.value || 'engaged',

    // Ambient
    weather: elements.genWeather?.value || 'clear',
    timeOfDay: elements.genTimeOfDay?.value || 'any',
    season: elements.genSeason?.value || 'summer',
    atmosphere: elements.genAtmosphere?.value || 'neutral',

    // Extra prompt
    extraPrompt: elements.genExtraPrompt?.value || ''
  };
}

/**
 * Apply loaded generation settings to UI
 */
function applyGenerationSettings(settings) {
  if (!settings) return;

  // NEW: 6-layer architecture settings
  if (settings.shootType && elements.genShootType) {
    elements.genShootType.value = settings.shootType;
  }
  if (settings.cameraAesthetic && elements.genCameraAesthetic) {
    elements.genCameraAesthetic.value = settings.cameraAesthetic;
  }
  if (settings.lightingSource && elements.genLightingSource) {
    elements.genLightingSource.value = settings.lightingSource;
  }
  if (settings.lightingQuality && elements.genLightingQuality) {
    elements.genLightingQuality.value = settings.lightingQuality;
  }

  // Legacy (hidden fields)
  if (settings.cameraSignature && elements.genCameraSignature) {
    elements.genCameraSignature.value = settings.cameraSignature;
  }
  if (settings.light && elements.genLight) {
    elements.genLight.value = settings.light;
  }

  // Visual style
  if (settings.captureStyle && elements.genCaptureStyle) {
    elements.genCaptureStyle.value = settings.captureStyle;
  }
  if (settings.color && elements.genColor) {
    elements.genColor.value = settings.color;
  }
  if (settings.skinTexture && elements.genSkinTexture) {
    elements.genSkinTexture.value = settings.skinTexture;
  }
  if (settings.era && elements.genEra) {
    elements.genEra.value = settings.era;
  }

  // Frame parameters
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

  // Composition
  if (settings.shotSize && elements.genShotSize) {
    elements.genShotSize.value = settings.shotSize;
  }
  if (settings.cameraAngle && elements.genCameraAngle) {
    elements.genCameraAngle.value = settings.cameraAngle;
  }
  if (settings.focusMode && elements.genFocusMode) {
    elements.genFocusMode.value = settings.focusMode;
  }
  if (settings.lensFocalLength && elements.genLensFocal) {
    elements.genLensFocal.value = settings.lensFocalLength;
  }

  // Anti-AI
  if (settings.antiAiLevel && elements.genAntiAiLevel) {
    elements.genAntiAiLevel.value = settings.antiAiLevel;
  }

  // Model Behavior
  if (settings.modelBehavior && elements.genModelBehavior) {
    elements.genModelBehavior.value = settings.modelBehavior;
  }

  // Ambient
  if (settings.weather && elements.genWeather) {
    elements.genWeather.value = settings.weather;
  }
  if (settings.timeOfDay && elements.genTimeOfDay) {
    elements.genTimeOfDay.value = settings.timeOfDay;
  }
  if (settings.season && elements.genSeason) {
    elements.genSeason.value = settings.season;
  }
  if (settings.atmosphere && elements.genAtmosphere) {
    elements.genAtmosphere.value = settings.atmosphere;
  }

  // Extra prompt
  if (settings.extraPrompt !== undefined && elements.genExtraPrompt) {
    elements.genExtraPrompt.value = settings.extraPrompt;
  }

  // Update ambient section visibility
  updateAmbientSectionVisibility();

  // Check and display conflicts
  checkAndDisplayConflicts();
}

/**
 * Save current generation settings to server (debounced)
 */
let saveSettingsTimeout = null;
async function saveGenerationSettings() {
  if (!state.currentShoot) return;

  // Debounce to avoid too many requests
  if (saveSettingsTimeout) {
    clearTimeout(saveSettingsTimeout);
  }

  saveSettingsTimeout = setTimeout(async () => {
    const settings = collectGenerationSettings();
    state.generationSettings = settings;

    try {
      await fetch(`/api/custom-shoots/${state.currentShoot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationSettings: settings })
      });
      console.log('[CustomShoot] Settings saved');
    } catch (e) {
      console.error('Error saving generation settings:', e);
    }
  }, 500); // 500ms debounce
}

/**
 * Initialize event listeners for auto-saving generation settings
 */
function initSettingsAutoSave() {
  const settingsElements = [
    // NEW: 6-layer architecture
    elements.genShootType,
    elements.genCameraAesthetic,
    elements.genLightingSource,
    elements.genLightingQuality,
    // Visual style
    elements.genCaptureStyle,
    elements.genColor,
    elements.genSkinTexture,
    elements.genEra,
    // Frame parameters
    elements.genLocation,
    elements.genEmotion,
    elements.genAspectRatio,
    elements.genImageSize,
    elements.genPoseAdherence,
    // Composition
    elements.genShotSize,
    elements.genCameraAngle,
    elements.genFocusMode,
    elements.genLensFocal,
    // Anti-AI
    elements.genAntiAiLevel,
    // Model Behavior
    elements.genModelBehavior,
    // Ambient
    elements.genWeather,
    elements.genTimeOfDay,
    elements.genSeason,
    elements.genAtmosphere
  ];

  // Add change listeners to all select elements
  settingsElements.forEach(el => {
    if (el) {
      el.addEventListener('change', () => {
        saveGenerationSettings();
        checkAndDisplayConflicts();
      });
    }
  });

  // Add input listener to extra prompt (with debounce already in saveGenerationSettings)
  if (elements.genExtraPrompt) {
    elements.genExtraPrompt.addEventListener('input', saveGenerationSettings);
  }

  // Add special listener for poseAdherence to update composition controls
  if (elements.genPoseAdherence) {
    elements.genPoseAdherence.addEventListener('change', updateCompositionControlsState);
  }

  // Add special listener for shootType to apply defaults
  if (elements.genShootType) {
    elements.genShootType.addEventListener('change', handleShootTypeChange);
  }

  // Add special listener for lightingSource to auto-set lightingQuality
  if (elements.genLightingSource) {
    elements.genLightingSource.addEventListener('change', handleLightingSourceChange);
  }
}

/**
 * Handle Shoot Type change - apply defaults and check conflicts
 */
async function handleShootTypeChange() {
  const shootType = elements.genShootType?.value;
  if (!shootType) return;

  try {
    const res = await fetch(`/api/custom-shoots/shoot-type-defaults/${shootType}`);
    const data = await res.json();

    if (data.ok && data.defaults) {
      const defaults = data.defaults;

      // Apply defaults (but don't override if user already set something different)
      if (defaults.captureStyle && elements.genCaptureStyle) {
        elements.genCaptureStyle.value = defaults.captureStyle;
      }
      if (defaults.lightingSource && elements.genLightingSource) {
        elements.genLightingSource.value = defaults.lightingSource;
      }
      if (defaults.lightingQuality && elements.genLightingQuality) {
        elements.genLightingQuality.value = defaults.lightingQuality;
      }
      if (defaults.antiAi && elements.genAntiAiLevel) {
        elements.genAntiAiLevel.value = defaults.antiAi;
      }

      // Show hint
      if (elements.shootTypeHint) {
        elements.shootTypeHint.innerHTML = `💡 Применены рекомендуемые настройки для типа "${getShootTypeLabel(shootType)}"`;
        elements.shootTypeHint.style.background = 'rgba(16, 185, 129, 0.1)';
        elements.shootTypeHint.style.borderColor = 'rgba(16, 185, 129, 0.3)';

        // Reset after 3 seconds
        setTimeout(() => {
          elements.shootTypeHint.innerHTML = '💡 Тип съёмки определяет допустимые комбинации параметров.';
          elements.shootTypeHint.style.background = '';
          elements.shootTypeHint.style.borderColor = '';
        }, 3000);
      }

      saveGenerationSettings();
      checkAndDisplayConflicts();
    }
  } catch (e) {
    console.error('[CustomShoot] Error loading shoot type defaults:', e);
  }
}

/**
 * Handle Lighting Source change - auto-set Lighting Quality if implied
 */
function handleLightingSourceChange() {
  const source = elements.genLightingSource?.value;

  // On-camera flash implies harsh direct lighting
  if (source === 'on_camera_flash' && elements.genLightingQuality) {
    elements.genLightingQuality.value = 'harsh_direct';
    elements.genLightingQuality.disabled = true;
    elements.genLightingQuality.title = 'Заблокировано: накамерная вспышка = жёсткий свет';
  } else if (elements.genLightingQuality) {
    elements.genLightingQuality.disabled = false;
    elements.genLightingQuality.title = '';
  }

  checkAndDisplayConflicts();
}

/**
 * Check for conflicts and display warnings using new 6-layer validation
 */
async function checkAndDisplayConflicts() {
  if (!elements.conflictWarnings) return;

  // Gather all current parameters for validation
  const params = {
    shootType: elements.genShootType?.value || 'editorial',
    cameraAesthetic: elements.genCameraAesthetic?.value || 'none',
    lightingSource: elements.genLightingSource?.value || 'natural_daylight',
    lightingQuality: elements.genLightingQuality?.value || 'soft_diffused',
    focusMode: elements.genFocusMode?.value || 'default',
    shotSize: elements.genShotSize?.value || 'medium_shot',
    timeOfDay: elements.genTimeOfDay?.value || 'any',
    weather: elements.genWeather?.value || 'clear',
    spaceType: state.currentShoot?.location?.spaceType || 'mixed',
    captureStyle: elements.genCaptureStyle?.value || 'none'
  };

  try {
    const res = await fetch('/api/custom-shoots/validate-params', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params })
    });
    const data = await res.json();

    if (data.ok) {
      const { conflicts, warnings, autoCorrections } = data;

      // Build display content
      const sections = [];

      // Critical conflicts (blocking)
      if (conflicts && conflicts.length > 0) {
        sections.push(`
          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
            <div style="font-weight: 600; color: #EF4444; margin-bottom: 6px;">🚫 Конфликты параметров:</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: var(--color-text-muted);">
              ${conflicts.map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>
        `);
      }

      // Auto-corrections (informational)
      if (autoCorrections && Object.keys(autoCorrections).length > 0) {
        const paramLabels = {
          lightingQuality: 'Качество света',
          focusMode: 'Режим фокуса',
          lightingSource: 'Источник света',
          cameraAesthetic: 'Эстетика камеры',
          shootType: 'Тип съёмки'
        };
        const valueLabels = {
          // Lighting Quality
          'harsh_direct': 'Жёсткий свет',
          'soft_diffused': 'Мягкий свет',
          'contrasty': 'Контрастный',
          'flat': 'Плоский',
          'backlit': 'Контровой',
          'moody_lowkey': 'Атмосферный',
          // Focus Mode
          'shallow_dof': 'Размытый фон',
          'deep_focus': 'Всё в резкости',
          'moderate_dof': 'Умеренная глубина',
          // Lighting Source
          'natural_daylight': 'Дневной свет',
          'window_light': 'Свет из окна',
          'studio_strobe': 'Студийный свет'
        };
        const correctionsList = Object.entries(autoCorrections).map(([param, value]) => {
          const paramName = paramLabels[param] || param;
          const valueName = valueLabels[value] || value;
          return `<li>${paramName} → <strong>${valueName}</strong></li>`;
        }).join('');

        sections.push(`
          <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
            <div style="font-weight: 600; color: #3B82F6; margin-bottom: 6px;">🔄 Авто-коррекции (будут применены):</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: var(--color-text-muted);">
              ${correctionsList}
            </ul>
          </div>
        `);
      }

      // Warnings (non-blocking recommendations)
      if (warnings && warnings.length > 0) {
        sections.push(`
          <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px;">
            <div style="font-weight: 600; color: #F59E0B; margin-bottom: 6px;">💡 Рекомендации:</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: var(--color-text-muted);">
              ${warnings.map(w => `<li>${w}</li>`).join('')}
            </ul>
          </div>
        `);
      }

      if (sections.length > 0) {
        elements.conflictWarnings.style.display = 'block';
        elements.conflictWarnings.innerHTML = sections.join('');
      } else {
        elements.conflictWarnings.style.display = 'none';
      }
    }
  } catch (e) {
    console.error('[CustomShoot] Error checking conflicts:', e);
    elements.conflictWarnings.style.display = 'none';
  }
}

/**
 * Get human-readable label for shoot type
 */
function getShootTypeLabel(shootType) {
  const labels = {
    catalog: 'Каталог',
    editorial: 'Editorial',
    street: 'Street',
    lookbook: 'Lookbook',
    campaign: 'Campaign',
    portrait: 'Портрет',
    beauty: 'Beauty',
    sport: 'Спорт'
  };
  return labels[shootType] || shootType;
}

/**
 * Update composition controls state based on poseAdherence level
 * When poseAdherence = 4 (exact), composition is locked by the sketch
 */
function updateCompositionControlsState() {
  const adherence = parseInt(elements.genPoseAdherence?.value || '2');
  const isExact = adherence === 4;

  // Get composition controls
  const compositionControls = [
    elements.genShotSize,
    elements.genCameraAngle,
    elements.genFocusMode
  ];

  // Find or create the warning message
  let warningEl = document.getElementById('composition-locked-warning');

  if (isExact) {
    // Disable composition controls
    compositionControls.forEach(el => {
      if (el) {
        el.disabled = true;
        el.style.opacity = '0.5';
        el.title = 'Заблокировано: точное следование эскизу (4) определяет кадрирование';
      }
    });

    // Show warning
    if (!warningEl) {
      const compositionSection = elements.genShotSize?.closest('.form-group')?.parentElement;
      if (compositionSection) {
        warningEl = document.createElement('div');
        warningEl.id = 'composition-locked-warning';
        warningEl.style.cssText = 'background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; font-size: 12px; color: #F59E0B; display: flex; align-items: center; gap: 8px;';
        warningEl.innerHTML = '⚠️ <span>Композиция определяется эскизом (Точное следование = 4)</span>';
        compositionSection.insertBefore(warningEl, compositionSection.firstChild);
      }
    }
    if (warningEl) warningEl.style.display = 'flex';

  } else {
    // Enable composition controls
    compositionControls.forEach(el => {
      if (el) {
        el.disabled = false;
        el.style.opacity = '1';
        el.title = '';
      }
    });

    // Hide warning
    if (warningEl) warningEl.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 4: GENERATE (frames are selected directly here)
// ═══════════════════════════════════════════════════════════════

function renderGeneratePage() {
  // Populate location dropdown
  elements.genLocation.innerHTML = '<option value="">Без конкретной</option>';
  state.locations.forEach(loc => {
    // Include spaceType for ambient section visibility
    const spaceType = loc.spaceType || 'studio';
    elements.genLocation.innerHTML += `<option value="${loc.id}" data-space-type="${spaceType}">${escapeHtml(loc.label)}</option>`;
  });

  // Add location change listener for ambient section visibility
  elements.genLocation.removeEventListener('change', handleLocationChange);
  elements.genLocation.addEventListener('change', handleLocationChange);

  // Populate emotion dropdown
  elements.genEmotion.innerHTML = '<option value="">Нейтральная</option>';
  state.emotions.forEach(e => {
    elements.genEmotion.innerHTML += `<option value="${e.id}">${e.label}</option>`;
  });

  // Apply saved generation settings AFTER populating dropdowns
  applyGenerationSettings(state.generationSettings);

  // Update ambient section visibility (after settings applied)
  updateAmbientSectionVisibility();

  // Update composition controls state based on poseAdherence
  updateCompositionControlsState();

  // Check lighting source implications
  handleLightingSourceChange();

  // Check and display conflicts
  checkAndDisplayConflicts();

  // Update lock UI
  updateLockUI();

  // Render frames to generate
  renderFramesToGenerate();

  // Render history
  renderGeneratedHistory();
}

/**
 * Handle location change to show/hide ambient section
 */
function handleLocationChange() {
  updateAmbientSectionVisibility();
}

/**
 * Show/hide ambient section based on selected location's spaceType
 */
function updateAmbientSectionVisibility() {
  if (!elements.ambientSection) return;

  const selectedOption = elements.genLocation?.selectedOptions[0];
  const spaceType = selectedOption?.dataset?.spaceType || '';
  const locationId = elements.genLocation?.value;

  // Find location in state to check spaceType
  const location = state.locations.find(l => l.id === locationId);
  const effectiveSpaceType = location?.spaceType || spaceType || 'studio';

  // Show ambient section for outdoor locations
  const isOutdoor = ['exterior_urban', 'exterior_nature', 'rooftop_terrace'].includes(effectiveSpaceType);

  elements.ambientSection.style.display = isOutdoor ? 'block' : 'none';
}

function updateLockUI() {
  // Style Lock
  elements.styleLockOff.classList.toggle('active', !state.styleLock.enabled);
  elements.styleLockStrict.classList.toggle('active', state.styleLock.enabled && state.styleLock.mode === 'strict');
  elements.styleLockSoft.classList.toggle('active-soft', state.styleLock.enabled && state.styleLock.mode === 'soft');

  if (state.styleLock.imageUrl) {
    elements.styleLockImg.src = state.styleLock.imageUrl;
    elements.styleLockPreview.classList.add('active');
  } else {
    elements.styleLockPreview.classList.remove('active');
  }

  // Location Lock
  elements.locationLockOff.classList.toggle('active', !state.locationLock.enabled);
  elements.locationLockStrict.classList.toggle('active', state.locationLock.enabled && state.locationLock.mode === 'strict');
  elements.locationLockSoft.classList.toggle('active-soft', state.locationLock.enabled && state.locationLock.mode === 'soft');

  if (state.locationLock.imageUrl) {
    elements.locationLockImg.src = state.locationLock.imageUrl;
    elements.locationLockPreview.classList.add('active');
  } else {
    elements.locationLockPreview.classList.remove('active');
  }
}

async function setStyleLockMode(mode) {
  if (mode === 'off') {
    // Clear style lock
    try {
      await fetch(`/api/custom-shoots/${state.currentShoot.id}/lock-style`, { method: 'DELETE' });
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
        await fetch(`/api/custom-shoots/${state.currentShoot.id}/lock-style`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId: state.styleLock.imageId, mode })
        });
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

async function setLocationLockMode(mode) {
  if (mode === 'off') {
    try {
      await fetch(`/api/custom-shoots/${state.currentShoot.id}/lock-location`, { method: 'DELETE' });
      state.locationLock = { enabled: false, mode: null, imageId: null, imageUrl: null };
      updateLockUI();
      renderGeneratedHistory();
    } catch (e) {
      console.error('Error clearing location lock:', e);
    }
  } else {
    if (!state.locationLock.imageId && state.generatedFrames.length > 0) {
      const lastImage = state.generatedFrames[0];
      await setAsLocationRef(lastImage.id);
    }

    if (state.locationLock.imageId) {
      try {
        await fetch(`/api/custom-shoots/${state.currentShoot.id}/lock-location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId: state.locationLock.imageId, mode })
        });
        state.locationLock.mode = mode;
        state.locationLock.enabled = true;
        updateLockUI();
      } catch (e) {
        console.error('Error setting location lock mode:', e);
      }
    } else {
      alert('Сначала сгенерируйте кадр, затем установите его как референс.');
    }
  }
}

async function setAsStyleRef(imageId) {
  const image = state.generatedFrames.find(f => f.id === imageId);
  if (!image) return;

  const mode = state.styleLock.mode || 'strict';

  try {
    const res = await fetch(`/api/custom-shoots/${state.currentShoot.id}/lock-style`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId, mode })
    });
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
 * @param {string} type - 'style' or 'location'
 */
function applySettingsFromFrame(frame, type) {
  if (!frame) return;

  console.log(`[CustomShoot] Applying ${type} settings from frame:`, frame.frameLabel);

  if (type === 'style') {
    // Apply visual style settings (these define the "look")
    if (frame.captureStyle && elements.genCaptureStyle) {
      elements.genCaptureStyle.value = frame.captureStyle;
    }
    if (frame.cameraSignature && elements.genCameraSignature) {
      elements.genCameraSignature.value = frame.cameraSignature;
    }
    if (frame.skinTexture && elements.genSkinTexture) {
      elements.genSkinTexture.value = frame.skinTexture;
    }

    // Apply presets (light, color, era)
    if (frame.presets) {
      if (frame.presets.light && elements.genLight) {
        elements.genLight.value = frame.presets.light;
      }
      if (frame.presets.color && elements.genColor) {
        elements.genColor.value = frame.presets.color;
      }
      if (frame.presets.era && elements.genEra) {
        elements.genEra.value = frame.presets.era;
      }
    }

    // Note: aspectRatio, imageSize, emotion, location are NOT copied
    // They can be different for each frame within the same style

    console.log('[CustomShoot] Style settings applied from reference');
  }

  if (type === 'location') {
    // For location lock, apply location-related settings
    if (frame.locationId && elements.genLocation) {
      elements.genLocation.value = frame.locationId;
    }

    console.log('[CustomShoot] Location settings applied from reference');
  }
}

async function setAsLocationRef(imageId) {
  const image = state.generatedFrames.find(f => f.id === imageId);
  if (!image) return;

  const mode = state.locationLock.mode || 'strict';

  try {
    const res = await fetch(`/api/custom-shoots/${state.currentShoot.id}/lock-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId, mode })
    });
    const data = await res.json();

    if (data.ok) {
      state.locationLock = {
        enabled: true,
        mode,
        imageId,
        imageUrl: image.imageUrl
      };

      state.generatedFrames.forEach(f => {
        f.isLocationReference = f.id === imageId;
      });

      // Apply location settings from reference frame to UI
      applySettingsFromFrame(image, 'location');

      updateLockUI();
      renderGeneratedHistory();
    }
  } catch (e) {
    console.error('Error setting location ref:', e);
  }
}

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

  // Add click handlers
  elements.framesToGenerate.querySelectorAll('.btn-gen-frame').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      generateFrame(btn.dataset.frameId || null);
    });
  });
}

async function generateFrame(frameId) {
  if (!state.currentShoot) return;

  const modelCount = state.selectedModels.filter(m => m !== null).length;
  if (modelCount === 0) {
    alert('Сначала добавьте модель');
    return;
  }

  // Get button and show loading
  const btn = elements.framesToGenerate.querySelector(`.btn-gen-frame[data-frame-id="${frameId || ''}"]`);
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Генерация...';

  // Get settings (NEW 6-layer architecture)
  const params = {
    frameId,
    locationId: elements.genLocation.value || null,
    emotionId: elements.genEmotion.value || null,
    extraPrompt: elements.genExtraPrompt.value.trim(),

    // NEW: 6-layer architecture presets
    presets: {
      // Layer 1: Shoot Type
      shootType: elements.genShootType?.value || 'editorial',
      // Layer 2: Camera Aesthetic
      cameraAesthetic: elements.genCameraAesthetic?.value || 'contax_t2',
      // Layer 3: Lighting Source
      lightingSource: elements.genLightingSource?.value || 'natural_daylight',
      // Layer 4: Lighting Quality  
      lightingQuality: elements.genLightingQuality?.value || 'soft_diffused',
      // Capture Style
      capture: elements.genCaptureStyle?.value || 'candid_aware',
      // Color, Texture, Era
      color: elements.genColor?.value || 'film_warm',
      texture: elements.genSkinTexture?.value || 'natural_film',
      era: elements.genEra?.value || 'contemporary',
      // Legacy (for compatibility)
      camera: elements.genCameraSignature?.value || elements.genCameraAesthetic?.value || 'contax_t2',
      light: elements.genLight?.value || 'natural_soft'
    },

    // Image format
    aspectRatio: elements.genAspectRatio?.value || '3:4',
    imageSize: elements.genImageSize?.value || '2K',

    // Artistic controls
    captureStyle: elements.genCaptureStyle?.value || 'candid_aware',
    cameraSignature: elements.genCameraAesthetic?.value || 'contax_t2',
    skinTexture: elements.genSkinTexture?.value || 'natural_film',
    poseAdherence: elements.genPoseAdherence?.value ? parseInt(elements.genPoseAdherence.value) : 2,

    // Composition
    composition: {
      shotSize: elements.genShotSize?.value || 'default',
      cameraAngle: elements.genCameraAngle?.value || 'eye_level',
      focusMode: elements.genFocusMode?.value || 'shallow'
    },

    // Lens Focal Length
    lensFocalLength: elements.genLensFocal?.value || 'auto',

    // Anti-AI
    antiAi: {
      level: elements.genAntiAiLevel?.value || 'medium'
    },

    // Model Behavior (Layer 7) - how model interacts with camera
    modelBehavior: elements.genModelBehavior?.value || 'engaged',

    // Ambient (situational conditions: weather, season, atmosphere)
    ambient: {
      weather: elements.genWeather?.value || 'clear',
      timeOfDay: elements.genTimeOfDay?.value || 'any',
      season: elements.genSeason?.value || 'summer',
      atmosphere: elements.genAtmosphere?.value || 'neutral'
    }
  };

  // Update shoot with current presets first
  await fetch(`/api/custom-shoots/${state.currentShoot.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ presets: params.presets })
  });

  // Add placeholder
  const placeholderId = `pending_${Date.now()}`;
  state.generatedFrames.unshift({
    id: placeholderId,
    status: 'generating',
    timestamp: new Date().toISOString()
  });
  renderGeneratedHistory();

  try {
    const res = await fetch(`/api/custom-shoots/${state.currentShoot.id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frame: frameId ? state.frames.find(f => f.id === frameId) : null,
        emotionId: params.emotionId,
        extraPrompt: params.extraPrompt,
        locationId: params.locationId,
        aspectRatio: params.aspectRatio,
        imageSize: params.imageSize,
        presets: params.presets,
        // Artistic controls (same as shoot-composer)
        captureStyle: params.captureStyle,
        cameraSignature: params.cameraSignature,
        skinTexture: params.skinTexture,
        poseAdherence: params.poseAdherence,
        // Composition
        composition: params.composition,
        // Anti-AI
        antiAi: params.antiAi,
        // Ambient (situational conditions)
        ambient: params.ambient
      })
    });

    const data = await res.json();

    // Find and update placeholder
    const placeholderIndex = state.generatedFrames.findIndex(f => f.id === placeholderId);

    if (data.ok && data.image) {
      if (placeholderIndex >= 0) {
        state.generatedFrames[placeholderIndex] = {
          id: data.image.id,
          imageUrl: data.image.imageUrl,
          isStyleReference: false,
          isLocationReference: false,
          status: 'ready',
          timestamp: new Date().toISOString(),
          // Full frame data (same as shoot-composer)
          frameLabel: data.image.frameLabel || 'По умолчанию',
          locationLabel: data.image.locationLabel || null,
          emotionId: data.image.emotionId || null,
          aspectRatio: data.image.aspectRatio || '3:4',
          imageSize: data.image.imageSize || '2K',
          // Artistic controls (same as shoot-composer)
          captureStyle: data.image.captureStyle || 'none',
          cameraSignature: data.image.cameraSignature || 'none',
          skinTexture: data.image.skinTexture || 'none',
          poseAdherence: data.image.poseAdherence || 2,
          composition: data.image.composition || null,
          antiAi: data.image.antiAi || null,
          extraPrompt: data.image.extraPrompt || '',
          presets: data.image.presets || null,
          prompt: data.prompt || null,
          refs: data.refs || [],
          generationTime: data.image.generationTime || null
        };
      }

      // Clear extra prompt
      elements.genExtraPrompt.value = '';

      renderGeneratedHistory();
    } else {
      if (placeholderIndex >= 0) {
        state.generatedFrames[placeholderIndex].status = 'error';
        state.generatedFrames[placeholderIndex].error = data.error || 'Неизвестная ошибка';
        renderGeneratedHistory();
      }
      alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
    }
  } catch (e) {
    console.error('Error generating:', e);
    const placeholderIndex = state.generatedFrames.findIndex(f => f.id === placeholderId);
    if (placeholderIndex >= 0) {
      state.generatedFrames[placeholderIndex].status = 'error';
      state.generatedFrames[placeholderIndex].error = e.message;
      renderGeneratedHistory();
    }
    alert('Ошибка сети: ' + e.message);
  } finally {
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
    const isLocationRef = frame.isLocationReference;

    let borderColor = 'var(--color-border)';
    if (isStyleRef && isLocationRef) borderColor = '#8B5CF6';
    else if (isStyleRef) borderColor = '#F59E0B';
    else if (isLocationRef) borderColor = '#10B981';

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
          ${isLocationRef ? '<span class="history-lock-badge location">🏠</span>' : ''}
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
            <a href="${frame.imageUrl}" download="custom-shoot-${idx}.png" class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px; flex: 1;">💾</a>
            <button class="btn btn-secondary" onclick="loadParamsFromHistory(${idx})" style="padding: 8px 12px; font-size: 12px; flex: 1;" title="Copy Parameters">♻️</button>
            <button class="btn btn-secondary btn-set-style-ref" data-image-id="${frame.id}" style="padding: 8px 12px; font-size: 12px; flex: 1;" title="Style Lock">🎨</button>
            <button class="btn btn-secondary btn-set-location-ref" data-image-id="${frame.id}" style="padding: 8px 12px; font-size: 12px; flex: 1;" title="Location Lock">🏠</button>
            <button class="btn btn-secondary" data-delete-frame="${idx}" style="padding: 8px 12px; font-size: 12px; color: var(--color-accent);">✕</button>
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

  // Attach handlers
  elements.imagesGallery.querySelectorAll('.btn-open-lightbox').forEach(btn => {
    btn.addEventListener('click', () => openLightbox(parseInt(btn.dataset.frameIndex)));
  });

  elements.imagesGallery.querySelectorAll('.btn-set-style-ref').forEach(btn => {
    btn.addEventListener('click', () => setAsStyleRef(btn.dataset.imageId));
  });

  elements.imagesGallery.querySelectorAll('.btn-set-location-ref').forEach(btn => {
    btn.addEventListener('click', () => setAsLocationRef(btn.dataset.imageId));
  });

  elements.imagesGallery.querySelectorAll('[data-delete-frame]').forEach(btn => {
    btn.addEventListener('click', () => deleteFrame(parseInt(btn.dataset.deleteFrame)));
  });
}

async function deleteFrame(index) {
  const frame = state.generatedFrames[index];
  if (!frame) return;

  // Delete from server if has ID
  if (frame.id && !frame.id.startsWith('pending_')) {
    try {
      await fetch(`/api/custom-shoots/${state.currentShoot.id}/images/${frame.id}`, { method: 'DELETE' });
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
  document.getElementById('lightbox-next').disabled = lightbox.images.length <= 1 || lightbox.currentIndex === lightbox.images.length - 1;
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

window.loadParamsFromHistory = function (index) {
  const frame = state.generatedFrames[index];
  if (!frame) return;

  if (confirm('Load parameters from this history item? Current settings will be overwritten.')) {
    // 1. Artistic Controls
    if (frame.captureStyle && elements.genCaptureStyle) elements.genCaptureStyle.value = frame.captureStyle;
    if (frame.cameraSignature && elements.genCameraSignature) elements.genCameraSignature.value = frame.cameraSignature;
    if (frame.skinTexture && elements.genSkinTexture) elements.genSkinTexture.value = frame.skinTexture;
    if (frame.poseAdherence && elements.genPoseAdherence) elements.genPoseAdherence.value = frame.poseAdherence;
    if (frame.modelBehavior && elements.genModelBehavior) elements.genModelBehavior.value = frame.modelBehavior;

    // 2. Composition
    if (frame.composition) {
      if (frame.composition.shotSize && elements.genShotSize) elements.genShotSize.value = frame.composition.shotSize;
      if (frame.composition.cameraAngle && elements.genCameraAngle) elements.genCameraAngle.value = frame.composition.cameraAngle;
      if (frame.composition.focusMode && elements.genFocusMode) elements.genFocusMode.value = frame.composition.focusMode;
    }

    // 3. Technical
    if (frame.aspectRatio && elements.genAspectRatio) elements.genAspectRatio.value = frame.aspectRatio;
    if (frame.imageSize && elements.genImageSize) elements.genImageSize.value = frame.imageSize;

    // 4. Presets (6-Layer Architecture)
    if (frame.presets) {
      if (frame.presets.shootType && elements.genShootType) elements.genShootType.value = frame.presets.shootType;
      if (frame.presets.cameraAesthetic && elements.genCameraAesthetic) elements.genCameraAesthetic.value = frame.presets.cameraAesthetic;
      if (frame.presets.lightingSource && elements.genLightingSource) elements.genLightingSource.value = frame.presets.lightingSource;
      if (frame.presets.lightingQuality && elements.genLightingQuality) elements.genLightingQuality.value = frame.presets.lightingQuality;
      if (frame.presets.color && elements.genColor) elements.genColor.value = frame.presets.color;
      if (frame.presets.era && elements.genEra) elements.genEra.value = frame.presets.era;
    }

    // 5. Ambient
    if (frame.ambient) { // Assuming we stored ambient in frame (we should check save logic)
      if (frame.ambient.weather && elements.genWeather) elements.genWeather.value = frame.ambient.weather;
      if (frame.ambient.timeOfDay && elements.genTimeOfDay) elements.genTimeOfDay.value = frame.ambient.timeOfDay;
      if (frame.ambient.season && elements.genSeason) elements.genSeason.value = frame.ambient.season;
      if (frame.ambient.atmosphere && elements.genAtmosphere) elements.genAtmosphere.value = frame.ambient.atmosphere;
    }

    // 6. Extra Prompt
    if (frame.extraPrompt !== undefined && elements.genExtraPrompt) elements.genExtraPrompt.value = frame.extraPrompt;

    alert('Parameters loaded!');
  }
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Labels for settings display (same as shoot-composer)
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

const CAPTURE_STYLE_LABELS = {
  'none': 'Из вселенной',
  'editorial_posed': 'Editorial постановка',
  'editorial_relaxed': 'Editorial расслабленный',
  'candid_aware': 'Естественный, в курсе камеры',
  'candid_unaware': 'Candid — не видит камеру',
  'caught_mid_blink': 'На полузакрытых глазах',
  'paparazzi_telephoto': 'Папарацци / телефото',
  'harsh_flash_snapshot': 'Жёсткая вспышка',
  'motion_blur_action': 'Размытие движения',
  'through_window': 'Через стекло',
  'mirror_reflection': 'Отражение в зеркале',
  'dutch_angle_tension': 'Голландский угол',
  'worms_eye_power': 'Ракурс снизу',
  'overhead_graphic': 'Вид сверху'
};

const CAMERA_SIGNATURE_LABELS = {
  'none': 'Из вселенной',
  'polaroid_sx70': 'Polaroid SX-70',
  'contax_t2': 'Contax T2',
  'hasselblad_500cm': 'Hasselblad 500C/M',
  'canon_ae1': 'Canon AE-1',
  'leica_m6': 'Leica M6',
  'mamiya_rz67': 'Mamiya RZ67',
  'yashica_t4': 'Yashica T4',
  'disposable_flash': 'Одноразовая камера',
  'holga_120': 'Holga 120',
  'iphone_flash': 'iPhone со вспышкой',
  'powershot_vlog': 'Canon PowerShot',
  'ricoh_gr': 'Ricoh GR'
};

const SKIN_TEXTURE_LABELS = {
  'none': 'Из вселенной',
  'hyper_real': 'Гипер-реалистичная',
  'natural_film': 'Естественная плёночная',
  'flash_specular': 'Вспышка (блики)',
  'matte_editorial': 'Матовая editorial',
  'raw_unretouched': 'Сырая, без ретуши',
  'sweaty_athletic': 'Спортивная / с испариной',
  'golden_hour_glow': 'Золотой час',
  'pale_porcelain': 'Фарфоровая бледность'
};

const POSE_ADHERENCE_LABELS = {
  1: 'Свободно (только тип позы)',
  2: 'Похоже (поза 30-40%)',
  3: 'Близко (поза 70-80%)',
  4: 'Точно (поза + кадрирование)'
};

function buildFrameSettingsHtml(frame) {
  const items = [];

  // Image format (aspect ratio + size)
  const aspectLabel = ASPECT_RATIO_LABELS[frame.aspectRatio] || frame.aspectRatio || '3:4';
  const sizeLabel = IMAGE_SIZE_LABELS[frame.imageSize] || frame.imageSize || '2K';
  items.push(`<div><strong>📐 Формат:</strong> ${aspectLabel}, ${sizeLabel}</div>`);

  // Generation time
  if (frame.generationTime) {
    items.push(`<div><strong>⏱️ Время:</strong> ${frame.generationTime}s</div>`);
  }

  // Capture style (same as shoot-composer)
  if (frame.captureStyle && frame.captureStyle !== 'none') {
    items.push(`<div><strong>📷 Захват:</strong> ${CAPTURE_STYLE_LABELS[frame.captureStyle] || frame.captureStyle}</div>`);
  }

  // Camera signature (same as shoot-composer)
  if (frame.cameraSignature && frame.cameraSignature !== 'none') {
    items.push(`<div><strong>📸 Камера:</strong> ${CAMERA_SIGNATURE_LABELS[frame.cameraSignature] || frame.cameraSignature}</div>`);
  }

  // Skin texture (same as shoot-composer)
  if (frame.skinTexture && frame.skinTexture !== 'none') {
    items.push(`<div><strong>✨ Кожа:</strong> ${SKIN_TEXTURE_LABELS[frame.skinTexture] || frame.skinTexture}</div>`);
  }

  // Pose adherence (same as shoot-composer)
  if (frame.poseAdherence) {
    items.push(`<div><strong>🎯 Поза:</strong> ${POSE_ADHERENCE_LABELS[frame.poseAdherence] || frame.poseAdherence}</div>`);
  }

  // Composition
  if (frame.composition) {
    const comp = frame.composition;
    const itemsComp = [];
    if (comp.shotSize && comp.shotSize !== 'default') itemsComp.push(`План: ${comp.shotSize}`);
    if (comp.cameraAngle && comp.cameraAngle !== 'eye_level') itemsComp.push(`Ракурс: ${comp.cameraAngle}`);
    if (comp.focusMode) itemsComp.push(`Фокус: ${comp.focusMode}`);

    if (itemsComp.length > 0) {
      items.push(`<div><strong>🎥 Композиция:</strong> <span style="font-size:10px;">${itemsComp.join(', ')}</span></div>`);
    }
  }

  // Anti-AI
  if (frame.antiAi?.level && frame.antiAi.level !== 'off') {
    const labels = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
    items.push(`<div><strong>🤖 Anti-AI:</strong> ${labels[frame.antiAi.level] || frame.antiAi.level}</div>`);
  }

  // Presets (universe settings - unique to custom shoot)
  if (frame.presets) {
    const presetItems = [];
    if (frame.presets.light) presetItems.push(`Свет: ${frame.presets.light}`);
    if (frame.presets.color) presetItems.push(`Цвет: ${frame.presets.color}`);
    if (frame.presets.era) presetItems.push(`Эра: ${frame.presets.era}`);
    if (presetItems.length > 0) {
      items.push(`<div><strong>🎨 Стиль:</strong> <span style="font-size:10px;">${presetItems.join(', ')}</span></div>`);
    }
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

  // Extra prompt
  if (frame.extraPrompt) {
    items.push(`<div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--color-border);"><strong>💬 Доп. промпт:</strong><br><em>${escapeHtml(frame.extraPrompt)}</em></div>`);
  }

  return items.join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function checkServerStatus() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    elements.serverStatus.textContent = data.ok ? 'Сервер работает' : 'Ошибка';
  } catch (e) {
    elements.serverStatus.textContent = 'Нет связи';
  }
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

async function init() {
  initElements();
  initEventListeners();
  initLightbox();
  initSettingsAutoSave();

  await checkServerStatus();

  await Promise.all([
    loadShoots(),
    loadModels(),
    loadFrames(),
    loadLocations(),
    loadEmotions()
  ]);

  updateStepStatuses();
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
