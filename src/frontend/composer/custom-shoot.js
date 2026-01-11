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
  selectedFrames: [],
  
  // Generated frames history
  generatedFrames: [],
  
  // Reference Locks state
  styleLock: { enabled: false, mode: null, imageId: null, imageUrl: null },
  locationLock: { enabled: false, mode: null, imageId: null, imageUrl: null }
};

// Step order for navigation
const STEP_ORDER = ['shoot', 'models', 'clothing', 'frames', 'generate'];

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
  
  // Step 4: Frames
  elements.selectedFrames = document.getElementById('selected-frames');
  elements.framesGrid = document.getElementById('frames-grid');
  elements.btnBackToClothing = document.getElementById('btn-back-to-clothing');
  elements.btnNextToGenerate = document.getElementById('btn-next-to-generate');
  elements.stepFramesStatus = document.getElementById('step-frames-status');
  
  // Step 5: Generate
  elements.btnBackToFrames = document.getElementById('btn-back-to-frames');
  elements.btnClearHistory = document.getElementById('btn-clear-history');
  elements.imagesGallery = document.getElementById('images-gallery');
  elements.generationCount = document.getElementById('generation-count');
  elements.framesToGenerate = document.getElementById('frames-to-generate');
  elements.stepGenerateStatus = document.getElementById('step-generate-status');
  
  // Generation controls
  elements.genLocation = document.getElementById('gen-location');
  elements.genExtraPrompt = document.getElementById('gen-extra-prompt');
  elements.genCameraSignature = document.getElementById('gen-camera-signature');
  elements.genCaptureStyle = document.getElementById('gen-capture-style');
  elements.genLight = document.getElementById('gen-light');
  elements.genColor = document.getElementById('gen-color');
  elements.genSkinTexture = document.getElementById('gen-skin-texture');
  elements.genEra = document.getElementById('gen-era');
  elements.genAspectRatio = document.getElementById('gen-aspect-ratio');
  elements.genImageSize = document.getElementById('gen-image-size');
  elements.genEmotion = document.getElementById('gen-emotion');
  
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
  
  // Step 3: Clothing
  elements.btnBackToModels.addEventListener('click', () => goToStep('models'));
  elements.btnNextToFrames.addEventListener('click', () => goToStep('frames'));
  
  // Step 4: Frames
  elements.btnBackToClothing.addEventListener('click', () => goToStep('clothing'));
  elements.btnNextToGenerate.addEventListener('click', () => goToStep('generate'));
  
  // Step 5: Generate
  elements.btnBackToFrames.addEventListener('click', () => goToStep('frames'));
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
    case 'frames':
      renderSelectedFrames();
      renderFramesCatalog();
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
  const frameCount = state.selectedFrames.length;
  
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
      case 'frames':
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
  
  elements.stepFramesStatus.textContent = `${frameCount} кадров`;
  elements.stepFramesStatus.className = frameCount > 0 ? 'step-status ready' : 'step-status pending';
  
  // Update navigation buttons
  elements.btnNextToModels.disabled = !hasShoot;
  elements.btnNextToClothing.disabled = !hasModels;
  elements.btnNextToFrames.disabled = !hasModels;
  elements.btnNextToGenerate.disabled = !hasModels;
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
  
  // Load frames
  state.selectedFrames = state.currentShoot.frames || [];
  
  // Load generated images
  state.generatedFrames = (state.currentShoot.generatedImages || []).map(img => ({
    id: img.id,
    imageUrl: img.imageUrl,
    isStyleReference: img.isStyleReference,
    isLocationReference: img.isLocationReference,
    timestamp: img.createdAt,
    paramsSnapshot: img.paramsSnapshot
  }));
  
  // Load locks
  state.styleLock = state.currentShoot.locks?.style || { enabled: false, mode: null, imageId: null, imageUrl: null };
  state.locationLock = state.currentShoot.locks?.location || { enabled: false, mode: null, imageId: null, imageUrl: null };
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
        state.selectedFrames = [];
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
          <div class="images-preview" style="margin-top: 16px;">
            ${clothing.map((c, ci) => `
              <div class="image-thumb">
                <img src="${c.url}" alt="Clothing ${ci + 1}">
                <button class="image-thumb-remove" data-model="${index}" data-clothing="${ci}">✕</button>
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

function renderSelectedFrames() {
  if (state.selectedFrames.length === 0) {
    elements.selectedFrames.innerHTML = `
      <div class="empty-state" style="padding: 40px;">
        <div class="empty-state-icon">🖼️</div>
        <div class="empty-state-title">Нет кадров</div>
        <div class="empty-state-text">Добавьте кадры из каталога ниже</div>
      </div>
    `;
    return;
  }
  
  elements.selectedFrames.innerHTML = state.selectedFrames.map((sf, index) => {
    const frame = state.frames.find(f => f.id === sf.frameId);
    return `
      <div class="frame-item">
        <div class="frame-item-order">${index + 1}</div>
        ${frame?.sketchUrl ? `
          <div class="frame-item-preview">
            <img src="${frame.sketchUrl}" alt="">
          </div>
        ` : ''}
        <div class="frame-item-info">
          <div class="frame-item-title">${escapeHtml(frame?.label || sf.frameId)}</div>
        </div>
        <div class="frame-item-actions">
          <button class="btn btn-secondary" style="padding: 8px 12px;" data-remove-frame="${index}">✕</button>
        </div>
      </div>
    `;
  }).join('');
  
  elements.selectedFrames.querySelectorAll('[data-remove-frame]').forEach(btn => {
    btn.addEventListener('click', () => removeFrame(parseInt(btn.dataset.removeFrame)));
  });
}

function renderFramesCatalog() {
  if (state.frames.length === 0) {
    elements.framesGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🖼️</div>
        <div class="empty-state-title">Нет кадров</div>
        <div class="empty-state-text"><a href="/editors/frame-editor.html">Создайте кадры</a></div>
      </div>
    `;
    return;
  }
  
  elements.framesGrid.innerHTML = state.frames.map(f => `
    <div class="selection-card" data-frame-id="${f.id}">
      ${f.sketchUrl ? `
        <div class="selection-card-preview">
          <img src="${f.sketchUrl}" alt="${escapeHtml(f.label)}">
        </div>
      ` : '<div class="selection-card-icon">🖼️</div>'}
      <div class="selection-card-title">${escapeHtml(f.label)}</div>
    </div>
  `).join('');
  
  elements.framesGrid.querySelectorAll('.selection-card').forEach(card => {
    card.addEventListener('click', () => addFrame(card.dataset.frameId));
  });
}

async function addFrame(frameId) {
  state.selectedFrames.push({ frameId });
  await saveShootFrames();
  renderSelectedFrames();
  updateStepStatuses();
}

async function removeFrame(index) {
  state.selectedFrames.splice(index, 1);
  await saveShootFrames();
  renderSelectedFrames();
  updateStepStatuses();
}

async function saveShootFrames() {
  if (!state.currentShoot) return;
  
  try {
    await fetch(`/api/custom-shoots/${state.currentShoot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames: state.selectedFrames })
    });
  } catch (e) {
    console.error('Error saving frames:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 5: GENERATE
// ═══════════════════════════════════════════════════════════════

function renderGeneratePage() {
  // Populate location dropdown
  elements.genLocation.innerHTML = '<option value="">Без конкретной</option>';
  state.locations.forEach(loc => {
    elements.genLocation.innerHTML += `<option value="${loc.id}">${escapeHtml(loc.label)}</option>`;
  });
  
  // Populate emotion dropdown
  elements.genEmotion.innerHTML = '<option value="">Нейтральная</option>';
  state.emotions.forEach(e => {
    elements.genEmotion.innerHTML += `<option value="${e.id}">${e.label}</option>`;
  });
  
  // Update lock UI
  updateLockUI();
  
  // Render frames to generate
  renderFramesToGenerate();
  
  // Render history
  renderGeneratedHistory();
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
      
      updateLockUI();
      renderGeneratedHistory();
    }
  } catch (e) {
    console.error('Error setting style ref:', e);
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
      
      updateLockUI();
      renderGeneratedHistory();
    }
  } catch (e) {
    console.error('Error setting location ref:', e);
  }
}

function renderFramesToGenerate() {
  if (state.selectedFrames.length === 0) {
    elements.framesToGenerate.innerHTML = `
      <div style="padding: 20px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px;">
        <h4 style="margin-bottom: 12px; font-size: 12px; text-transform: uppercase; color: var(--color-text-muted);">Генерация</h4>
        <div class="frame-gen-card" data-frame-id="" style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-bg); border: 2px solid var(--color-accent); border-radius: 8px;">
          <div style="width: 60px; height: 80px; background: var(--color-surface); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🎯</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">По умолчанию</div>
            <div style="font-size: 12px; color: var(--color-text-muted);">Стандартные параметры</div>
          </div>
          <button class="btn btn-primary btn-gen-frame" data-frame-id="" style="padding: 10px 20px; font-size: 13px;">🚀 Генерировать</button>
        </div>
      </div>
    `;
  } else {
    const frameCards = state.selectedFrames.map((sf, idx) => {
      const frame = state.frames.find(f => f.id === sf.frameId);
      if (!frame) return '';
      
      const sketchImg = frame.sketchUrl 
        ? `<img src="${frame.sketchUrl}" alt="sketch" style="width: 100%; height: 100%; object-fit: contain;">`
        : '<span style="font-size: 24px;">🖼️</span>';
      
      return `
        <div class="frame-gen-card" data-frame-id="${frame.id}" style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: 8px;">
          <div style="width: 60px; height: 80px; background: var(--color-surface); border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden;">${sketchImg}</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">${idx + 1}. ${escapeHtml(frame.label)}</div>
          </div>
          <button class="btn btn-primary btn-gen-frame" data-frame-id="${frame.id}" style="padding: 10px 20px; font-size: 13px;">🚀 Генерировать</button>
        </div>
      `;
    }).join('');
    
    elements.framesToGenerate.innerHTML = `
      <div style="padding: 20px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px;">
        <h4 style="margin-bottom: 12px; font-size: 12px; text-transform: uppercase; color: var(--color-text-muted);">Кадры для генерации (${state.selectedFrames.length})</h4>
        ${frameCards}
        <div class="frame-gen-card" data-frame-id="" style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-bg); border: 1px dashed var(--color-border); border-radius: 8px; opacity: 0.7; margin-top: 8px;">
          <div style="width: 60px; height: 80px; background: var(--color-surface); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 20px;">🎯</div>
          <div style="flex: 1;">
            <div style="font-weight: 500;">По умолчанию (без эскиза)</div>
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
  
  // Get settings
  const params = {
    frameId,
    locationId: elements.genLocation.value || null,
    emotionId: elements.genEmotion.value || null,
    extraPrompt: elements.genExtraPrompt.value.trim(),
    // Universe settings
    presets: {
      camera: elements.genCameraSignature.value,
      capture: elements.genCaptureStyle.value,
      light: elements.genLight.value,
      color: elements.genColor.value,
      texture: elements.genSkinTexture.value,
      era: elements.genEra.value
    },
    aspectRatio: elements.genAspectRatio.value,
    imageSize: elements.genImageSize.value
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
        extraPrompt: params.extraPrompt
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
          timestamp: new Date().toISOString()
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
    
    return `
      <div class="selection-card generated-frame-card" style="cursor: default; position: relative; border-color: ${borderColor};">
        <!-- Lock badges -->
        <div class="history-lock-badges">
          ${isStyleRef ? '<span class="history-lock-badge style">🎨</span>' : ''}
          ${isLocationRef ? '<span class="history-lock-badge location">🏠</span>' : ''}
        </div>
        
        <div class="selection-card-preview btn-open-lightbox" data-frame-index="${idx}" style="aspect-ratio: 3/4; cursor: pointer;">
          <img src="${frame.imageUrl}" alt="Generated" style="object-fit: contain; background: #000;">
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <span style="font-size: 11px; color: var(--color-text-muted);">${timestamp}</span>
        </div>
        
        <!-- Actions -->
        <div style="display: flex; gap: 4px; margin-top: 8px;">
          <a href="${frame.imageUrl}" download="custom-shoot-${idx}.png" class="btn btn-secondary" style="padding: 6px 10px; font-size: 11px; flex: 1;">💾</a>
          <button class="btn btn-secondary btn-set-style-ref" data-image-id="${frame.id}" style="padding: 6px 10px; font-size: 11px; flex: 1;" title="Style Lock">🎨</button>
          <button class="btn btn-secondary btn-set-location-ref" data-image-id="${frame.id}" style="padding: 6px 10px; font-size: 11px; flex: 1;" title="Location Lock">🏠</button>
          <button class="btn btn-secondary" data-delete-frame="${idx}" style="padding: 6px 10px; font-size: 11px; color: var(--color-accent);">✕</button>
        </div>
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
