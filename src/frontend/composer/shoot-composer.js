/**
 * Shoot Composer
 * 
 * Step-by-step wizard for creating complete shoots.
 * 
 * Steps:
 * 1. Select/Create Shoot
 * 2. Select Universe
 * 3. Select Models (1-3)
 * 4. Upload Clothing (optional, generates outfit avatars for 2+ models)
 * 5. Select Frames
 * 6. Summary & Export
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const state = {
  currentStep: 'shoot',
  currentShoot: null,
  
  // Available entities (loaded from API)
  shoots: [],
  universes: [],
  models: [],
  frames: [],
  locations: [],
  
  // Selected for current shoot
  selectedModels: [null, null, null],
  clothingByModel: [[], [], []],
  outfitAvatars: [null, null, null],
  selectedFrames: [],
  
  // Generated frames history (all generated images, not replaced on regenerate)
  generatedFrames: [],
  
  // Current generation settings
  selectedLocationId: null
};

// Step order for navigation
const STEP_ORDER = ['shoot', 'universe', 'models', 'clothing', 'frames', 'summary'];

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
  elements.btnNextToUniverse = document.getElementById('btn-next-to-universe');
  elements.stepShootStatus = document.getElementById('step-shoot-status');
  
  // Step 2: Universe
  elements.universesGrid = document.getElementById('universes-grid');
  elements.btnBackToShoot = document.getElementById('btn-back-to-shoot');
  elements.btnNextToModels = document.getElementById('btn-next-to-models');
  elements.stepUniverseStatus = document.getElementById('step-universe-status');
  
  // Step 3: Models
  elements.modelSlots = document.getElementById('model-slots');
  elements.modelsGrid = document.getElementById('models-grid');
  elements.availableModels = document.getElementById('available-models');
  elements.btnBackToUniverse = document.getElementById('btn-back-to-universe');
  elements.btnNextToClothing = document.getElementById('btn-next-to-clothing');
  elements.stepModelsStatus = document.getElementById('step-models-status');
  
  // Step 4: Clothing
  elements.clothingSections = document.getElementById('clothing-sections');
  elements.btnBackToModels = document.getElementById('btn-back-to-models');
  elements.btnNextToFrames = document.getElementById('btn-next-to-frames');
  elements.stepClothingStatus = document.getElementById('step-clothing-status');
  
  // Step 5: Frames
  elements.selectedFrames = document.getElementById('selected-frames');
  elements.framesGrid = document.getElementById('frames-grid');
  elements.btnBackToClothing = document.getElementById('btn-back-to-clothing');
  elements.btnNextToSummary = document.getElementById('btn-next-to-summary');
  elements.stepFramesStatus = document.getElementById('step-frames-status');
  
  // Step 6: Summary
  elements.shootSummary = document.getElementById('shoot-summary');
  elements.summaryWarnings = document.getElementById('summary-warnings');
  elements.btnBackToFrames = document.getElementById('btn-back-to-frames');
  elements.btnExportJson = document.getElementById('btn-export-json');
  elements.btnGenerateOne = document.getElementById('btn-generate-one');
  elements.btnClearHistory = document.getElementById('btn-clear-history');
  elements.generatedImages = document.getElementById('generated-images');
  elements.imagesGallery = document.getElementById('images-gallery');
  elements.generationCount = document.getElementById('generation-count');
  elements.stepSummaryStatus = document.getElementById('step-summary-status');
  
  // Generation controls
  elements.genLocation = document.getElementById('gen-location');
  elements.genFrame = document.getElementById('gen-frame');
  elements.genExtraPrompt = document.getElementById('gen-extra-prompt');
  elements.genPosingStyle = document.getElementById('gen-posing-style');
  elements.genPoseAdherence = document.getElementById('gen-pose-adherence');
  elements.framesToGenerate = document.getElementById('frames-to-generate');
  
  // Summary values
  elements.summaryUniverse = document.getElementById('summary-universe');
  elements.summaryModels = document.getElementById('summary-models');
  elements.summaryFrames = document.getElementById('summary-frames');
  elements.summaryClothing = document.getElementById('summary-clothing');
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
  elements.btnNextToUniverse.addEventListener('click', () => goToStep('universe'));
  
  // Step 2: Universe
  elements.btnBackToShoot.addEventListener('click', () => goToStep('shoot'));
  elements.btnNextToModels.addEventListener('click', () => goToStep('models'));
  
  // Step 3: Models
  elements.btnBackToUniverse.addEventListener('click', () => goToStep('universe'));
  elements.btnNextToClothing.addEventListener('click', () => goToStep('clothing'));
  
  // Step 4: Clothing
  elements.btnBackToModels.addEventListener('click', () => goToStep('models'));
  elements.btnNextToFrames.addEventListener('click', () => goToStep('frames'));
  
  // Step 5: Frames
  elements.btnBackToClothing.addEventListener('click', () => goToStep('clothing'));
  elements.btnNextToSummary.addEventListener('click', () => goToStep('summary'));
  
  // Step 6: Summary
  elements.btnBackToFrames.addEventListener('click', () => goToStep('frames'));
  elements.btnExportJson.addEventListener('click', exportShootJson);
  elements.btnGenerateOne.addEventListener('click', generateOneFrame);
  elements.btnClearHistory.addEventListener('click', clearGenerationHistory);
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
    case 'universe':
      renderUniverses();
      break;
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
    case 'summary':
      renderSummary();
      break;
  }
  
  updateStepStatuses();
}

function updateStepStatuses() {
  // Unlock steps based on progress
  const hasShoot = !!state.currentShoot;
  const hasUniverse = !!state.currentShoot?.universe;
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
      case 'universe':
        locked = !hasShoot;
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
      case 'summary':
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
  
  if (hasUniverse) {
    elements.stepUniverseStatus.textContent = state.currentShoot.universe.label || 'Выбрана';
    elements.stepUniverseStatus.className = 'step-status ready';
  } else {
    elements.stepUniverseStatus.textContent = 'Не выбрано';
    elements.stepUniverseStatus.className = 'step-status pending';
  }
  
  elements.stepModelsStatus.textContent = `${modelCount} / 3`;
  elements.stepModelsStatus.className = modelCount > 0 ? 'step-status ready' : 'step-status pending';
  
  // Check if outfit avatars are required
  const hasClothing = state.clothingByModel.some(c => c.length > 0);
  if (modelCount >= 2 && hasClothing) {
    elements.stepClothingStatus.textContent = 'Нужны аватары';
    elements.stepClothingStatus.className = 'step-status required';
  } else if (hasClothing) {
    elements.stepClothingStatus.textContent = 'Загружено';
    elements.stepClothingStatus.className = 'step-status ready';
  } else {
    elements.stepClothingStatus.textContent = 'Опционально';
    elements.stepClothingStatus.className = 'step-status pending';
  }
  
  elements.stepFramesStatus.textContent = `${frameCount} кадров`;
  elements.stepFramesStatus.className = frameCount > 0 ? 'step-status ready' : 'step-status pending';
  
  // Update navigation buttons
  elements.btnNextToUniverse.disabled = !hasShoot;
  elements.btnNextToModels.disabled = !hasShoot;
  elements.btnNextToClothing.disabled = !hasModels;
  elements.btnNextToFrames.disabled = !hasModels;
  elements.btnNextToSummary.disabled = !hasModels;
}

// ═══════════════════════════════════════════════════════════════
// STEP 1: SHOOTS
// ═══════════════════════════════════════════════════════════════

async function loadShoots() {
  try {
    const res = await fetch('/api/shoots');
    const data = await res.json();
    if (data.ok) {
      state.shoots = data.data || [];
    }
  } catch (e) {
    console.error('Error loading shoots:', e);
  }
  renderShootsList();
}

function renderShootsList() {
  if (state.shoots.length === 0) {
    elements.shootsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📸</div>
        <div class="empty-state-title">Нет съёмок</div>
        <div class="empty-state-text">Создайте первую съёмку, чтобы начать работу</div>
      </div>
    `;
    return;
  }
  
  elements.shootsList.innerHTML = state.shoots.map(shoot => `
    <div class="shoot-card ${state.currentShoot?.id === shoot.id ? 'selected' : ''}" 
         data-shoot-id="${shoot.id}">
      <div class="shoot-card-icon">📸</div>
      <div class="shoot-card-info">
        <div class="shoot-card-title">${escapeHtml(shoot.label)}</div>
        <div class="shoot-card-meta">
          ${shoot.modelCount || 0} моделей • ${shoot.frameCount || 0} кадров
          ${shoot.hasUniverse ? '• 🌌 Вселенная' : ''}
        </div>
      </div>
    </div>
  `).join('');
  
  // Add click handlers
  elements.shootsList.querySelectorAll('.shoot-card').forEach(card => {
    card.addEventListener('click', () => selectShoot(card.dataset.shootId));
  });
}

async function createNewShoot() {
  const label = prompt('Название съёмки:', 'Новая съёмка');
  if (!label) return;
  
  try {
    const res = await fetch('/api/shoots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label })
    });
    const data = await res.json();
    if (data.ok) {
      state.shoots.unshift(data.data);
      state.currentShoot = data.data;
      renderShootsList();
      updateStepStatuses();
    } else {
      alert('Ошибка: ' + (data.errors?.join(', ') || data.error));
    }
  } catch (e) {
    console.error('Error creating shoot:', e);
    alert('Ошибка создания съёмки');
  }
}

async function selectShoot(shootId) {
  try {
    const res = await fetch(`/api/shoots/${shootId}`);
    const data = await res.json();
    if (data.ok) {
      state.currentShoot = data.data;
      
      // Load shoot data into state
      state.selectedModels = [null, null, null];
      if (state.currentShoot.models) {
        state.currentShoot.models.forEach((m, i) => {
          if (i < 3) {
            state.selectedModels[i] = state.models.find(model => model.id === m.modelId) || null;
          }
        });
      }
      
      state.clothingByModel = [[], [], []];
      if (state.currentShoot.clothing) {
        state.currentShoot.clothing.forEach(c => {
          if (c.forModelIndex >= 0 && c.forModelIndex < 3) {
            state.clothingByModel[c.forModelIndex] = c.refs || [];
          }
        });
      }
      
      state.selectedFrames = state.currentShoot.frames || [];
      
      renderShootsList();
      updateStepStatuses();
    }
  } catch (e) {
    console.error('Error loading shoot:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: UNIVERSES
// ═══════════════════════════════════════════════════════════════

async function loadUniverses() {
  try {
    const res = await fetch('/api/universes');
    const data = await res.json();
    if (data.ok) {
      state.universes = data.data || [];
    }
  } catch (e) {
    console.error('Error loading universes:', e);
  }
}

function renderUniverses() {
  if (state.universes.length === 0) {
    elements.universesGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🌌</div>
        <div class="empty-state-title">Нет вселенных</div>
        <div class="empty-state-text">
          <a href="/editors/universe-editor.html">Создайте вселенную</a> в редакторе
        </div>
      </div>
    `;
    return;
  }
  
  const selectedId = state.currentShoot?.universe?.id;
  
  elements.universesGrid.innerHTML = state.universes.map(u => `
    <div class="selection-card ${u.id === selectedId ? 'selected' : ''}" data-universe-id="${u.id}">
      ${u.previewSrc ? `
        <div class="selection-card-preview">
          <img src="${u.previewSrc}" alt="${escapeHtml(u.label)}">
        </div>
      ` : ''}
      <div class="selection-card-title">${escapeHtml(u.label)}</div>
      <div class="selection-card-desc">${escapeHtml(u.colorScience?.dominantPalette || 'Без описания')}</div>
    </div>
  `).join('');
  
  elements.universesGrid.querySelectorAll('.selection-card').forEach(card => {
    card.addEventListener('click', () => selectUniverse(card.dataset.universeId));
  });
}

async function selectUniverse(universeId) {
  if (!state.currentShoot) return;
  
  try {
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/universe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ universeId })
    });
    const data = await res.json();
    if (data.ok) {
      state.currentShoot = data.data;
      renderUniverses();
      updateStepStatuses();
    }
  } catch (e) {
    console.error('Error selecting universe:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 3: MODELS
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
    
    // Click to add/select model
    slot.onclick = () => {
      if (!state.selectedModels[index]) {
        showModelPicker(index);
      }
    };
  });
  
  // Remove handlers
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
  
  // Show available models section
  elements.availableModels.style.display = 'block';
  
  // Filter out already selected models
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
      <div class="selection-card-desc">${escapeHtml(m.label || '')}</div>
    </div>
  `).join('');
  
  elements.modelsGrid.querySelectorAll('.selection-card').forEach(card => {
    card.addEventListener('click', () => {
      const modelId = card.dataset.modelId;
      const model = state.models.find(m => m.id === modelId);
      if (model) {
        addModelToFirstEmptySlot(model);
      }
    });
  });
}

function showModelPicker(slotIndex) {
  // Show a simple picker using available models
  const selectedIds = state.selectedModels.filter(m => m).map(m => m.id);
  const availableModels = state.models.filter(m => !selectedIds.includes(m.id));
  
  if (availableModels.length === 0) {
    alert('Нет доступных моделей. Создайте модели в редакторе.');
    return;
  }
  
  // For simplicity, just add the first available model
  // In a real UI, you'd show a dropdown or modal
  addModel(slotIndex, availableModels[0]);
}

function addModelToFirstEmptySlot(model) {
  const emptySlotIndex = state.selectedModels.findIndex(m => m === null);
  if (emptySlotIndex >= 0) {
    addModel(emptySlotIndex, model);
  } else {
    alert('Все слоты заняты. Уберите модель, чтобы добавить новую.');
  }
}

async function addModel(slotIndex, model) {
  if (!state.currentShoot) return;
  
  try {
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId: model.id })
    });
    const data = await res.json();
    if (data.ok) {
      state.currentShoot = data.data;
      state.selectedModels[slotIndex] = model;
      renderModelSlots();
      renderAvailableModels();
      updateStepStatuses();
    }
  } catch (e) {
    console.error('Error adding model:', e);
  }
}

async function removeModel(slotIndex) {
  const model = state.selectedModels[slotIndex];
  if (!model || !state.currentShoot) return;
  
  try {
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/models/${model.id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.ok) {
      state.currentShoot = data.data;
      state.selectedModels[slotIndex] = null;
      state.clothingByModel[slotIndex] = [];
      state.outfitAvatars[slotIndex] = null;
      renderModelSlots();
      renderAvailableModels();
      updateStepStatuses();
    }
  } catch (e) {
    console.error('Error removing model:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 4: CLOTHING
// ═══════════════════════════════════════════════════════════════

function renderClothingSections() {
  const activeModels = state.selectedModels.filter(m => m !== null);
  const modelCount = activeModels.length;
  const requiresOutfitAvatar = modelCount >= 2;
  
  if (modelCount === 0) {
    elements.clothingSections.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👤</div>
        <div class="empty-state-title">Сначала добавьте модели</div>
        <div class="empty-state-text">Вернитесь на шаг "Модели"</div>
      </div>
    `;
    return;
  }
  
  elements.clothingSections.innerHTML = state.selectedModels.map((model, index) => {
    if (!model) return '';
    
    const clothing = state.clothingByModel[index] || [];
    const outfitAvatar = state.currentShoot?.outfitAvatars?.find(a => a.forModelIndex === index);
    
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
          <div class="upload-zone-hint">или перетащи файлы сюда</div>
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
        
        ${requiresOutfitAvatar && clothing.length > 0 ? `
          <div class="outfit-avatar-section">
            <h4 style="margin-bottom: 12px;">Outfit Avatar</h4>
            ${outfitAvatar && outfitAvatar.imageUrl ? `
              <div class="outfit-avatar-preview">
                <div class="outfit-avatar-image">
                  <img src="${outfitAvatar.imageUrl}" alt="Outfit Avatar">
                </div>
                <div class="outfit-avatar-actions">
                  <div class="outfit-avatar-status ${outfitAvatar.status}">
                    ${outfitAvatar.status === 'approved' ? '✓ Утверждён' : 
                      outfitAvatar.status === 'ok' ? '⏳ Ожидает утверждения' : 
                      outfitAvatar.status === 'error' ? '✕ Ошибка' : '⏳ Генерация...'}
                  </div>
                  ${outfitAvatar.status === 'ok' ? `
                    <button class="btn btn-primary btn-approve-avatar" data-index="${index}" style="margin-top: 8px;">
                      ✓ Утвердить
                    </button>
                    <button class="btn btn-secondary btn-regenerate-avatar" data-index="${index}" style="margin-top: 8px;">
                      🔄 Перегенерировать
                    </button>
                  ` : ''}
                </div>
              </div>
            ` : `
              <button class="btn btn-primary btn-generate-avatar" data-index="${index}">
                ✨ Сгенерировать аватар лука
              </button>
            `}
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
  
  elements.clothingSections.querySelectorAll('.btn-generate-avatar').forEach(btn => {
    btn.addEventListener('click', () => generateOutfitAvatar(parseInt(btn.dataset.index)));
  });
  
  elements.clothingSections.querySelectorAll('.btn-approve-avatar').forEach(btn => {
    btn.addEventListener('click', () => approveOutfitAvatar(parseInt(btn.dataset.index)));
  });
  
  elements.clothingSections.querySelectorAll('.btn-regenerate-avatar').forEach(btn => {
    btn.addEventListener('click', () => generateOutfitAvatar(parseInt(btn.dataset.index)));
  });
  
  // Drag and drop for upload zones
  elements.clothingSections.querySelectorAll('.upload-zone').forEach(zone => {
    const input = zone.querySelector('.clothing-input');
    const modelIndex = parseInt(input.dataset.index);
    
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });
    
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      handleClothingFiles(files, modelIndex);
    });
  });
}

async function handleClothingUpload(event, modelIndex) {
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('image/'));
  await handleClothingFiles(files, modelIndex);
  event.target.value = '';
}

async function handleClothingFiles(files, modelIndex) {
  const images = [];
  
  for (const file of files) {
    const compressed = await compressImageAndGetBase64(file);
    console.log(`[Composer] Compressed clothing ${file.name}: ${Math.round(file.size / 1024)}KB → ${Math.round(compressed.base64.length * 0.75 / 1024)}KB`);
    images.push({
      mimeType: compressed.mimeType,
      base64: compressed.base64
    });
  }
  
  if (images.length === 0) return;
  
  try {
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/clothing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelIndex, images })
    });
    const data = await res.json();
    if (data.ok) {
      state.currentShoot = data.data;
      // Update local state
      const clothing = data.data.clothing?.find(c => c.forModelIndex === modelIndex);
      state.clothingByModel[modelIndex] = clothing?.refs || [];
      renderClothingSections();
      updateStepStatuses();
    }
  } catch (e) {
    console.error('Error uploading clothing:', e);
  }
}

async function removeClothingItem(modelIndex, clothingIndex) {
  const clothing = [...state.clothingByModel[modelIndex]];
  clothing.splice(clothingIndex, 1);
  
  try {
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/clothing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        modelIndex, 
        images: clothing.map(c => {
          const match = c.url.match(/^data:([^;]+);base64,(.+)$/);
          return match ? { mimeType: match[1], base64: match[2] } : null;
        }).filter(Boolean)
      })
    });
    const data = await res.json();
    if (data.ok) {
      state.currentShoot = data.data;
      const updated = data.data.clothing?.find(c => c.forModelIndex === modelIndex);
      state.clothingByModel[modelIndex] = updated?.refs || [];
      renderClothingSections();
      updateStepStatuses();
    }
  } catch (e) {
    console.error('Error removing clothing item:', e);
  }
}

async function generateOutfitAvatar(modelIndex) {
  const btn = elements.clothingSections.querySelector(`.btn-generate-avatar[data-index="${modelIndex}"], .btn-regenerate-avatar[data-index="${modelIndex}"]`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Генерация...';
  }
  
  try {
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/outfit-avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelIndex })
    });
    const data = await res.json();
    
    if (data.ok) {
      state.currentShoot = data.data.shoot;
    } else {
      alert('Ошибка генерации: ' + data.error);
    }
    
    renderClothingSections();
    updateStepStatuses();
  } catch (e) {
    console.error('Error generating outfit avatar:', e);
    alert('Ошибка генерации аватара');
    renderClothingSections();
  }
}

async function approveOutfitAvatar(modelIndex) {
  try {
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/outfit-avatar/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelIndex })
    });
    const data = await res.json();
    if (data.ok) {
      state.currentShoot = data.data;
      renderClothingSections();
      updateStepStatuses();
    }
  } catch (e) {
    console.error('Error approving outfit avatar:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 5: FRAMES
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
          <div class="frame-item-desc">${escapeHtml(sf.emotionNotes || frame?.poseType || '')}</div>
        </div>
        <div class="frame-item-actions">
          <button class="btn btn-secondary" style="padding: 8px 12px;" data-remove-frame="${index}">
            ✕
          </button>
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
        <div class="empty-state-title">Нет кадров в каталоге</div>
        <div class="empty-state-text">
          <a href="/editors/frame-editor.html">Создайте кадры</a> в редакторе
        </div>
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
      <div class="selection-card-desc">${escapeHtml(f.shotSize || '')} ${escapeHtml(f.cameraAngle || '')}</div>
    </div>
  `).join('');
  
  elements.framesGrid.querySelectorAll('.selection-card').forEach(card => {
    card.addEventListener('click', () => addFrame(card.dataset.frameId));
  });
}

async function addFrame(frameId) {
  if (!state.currentShoot) return;
  
  try {
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/frames`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frameId })
    });
    const data = await res.json();
    if (data.ok) {
      state.currentShoot = data.data;
      state.selectedFrames = data.data.frames || [];
      renderSelectedFrames();
      updateStepStatuses();
    }
  } catch (e) {
    console.error('Error adding frame:', e);
  }
}

async function removeFrame(index) {
  const frame = state.selectedFrames[index];
  if (!frame || !state.currentShoot) return;
  
  try {
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/frames/${frame.frameId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.ok) {
      state.currentShoot = data.data;
      state.selectedFrames = data.data.frames || [];
      renderSelectedFrames();
      updateStepStatuses();
    }
  } catch (e) {
    console.error('Error removing frame:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 6: SUMMARY
// ═══════════════════════════════════════════════════════════════

function renderSummary() {
  if (!state.currentShoot) return;
  
  const modelCount = state.selectedModels.filter(m => m !== null).length;
  const frameCount = state.selectedFrames.length;
  const hasClothing = state.clothingByModel.some(c => c.length > 0);
  
  elements.summaryUniverse.textContent = state.currentShoot.universe?.label || 'Не выбрана';
  elements.summaryModels.textContent = modelCount > 0 ? 
    state.selectedModels.filter(m => m).map(m => m.name).join(', ') : 'Не выбраны';
  elements.summaryFrames.textContent = frameCount > 0 ? `${frameCount} шаблонов` : 'По умолчанию';
  elements.summaryClothing.textContent = hasClothing ? 'Загружена' : 'Без одежды';
  
  // Populate location dropdown
  elements.genLocation.innerHTML = '<option value="">Из вселенной (по умолчанию)</option>';
  state.locations.forEach(loc => {
    elements.genLocation.innerHTML += `<option value="${loc.id}">${escapeHtml(loc.label)}</option>`;
  });
  
  // Populate hidden frame dropdown (for compatibility)
  elements.genFrame.innerHTML = '<option value="">По умолчанию</option>';
  state.frames.forEach(frame => {
    elements.genFrame.innerHTML += `<option value="${frame.id}">${escapeHtml(frame.label)}</option>`;
  });
  
  // Render selected frames as clickable cards for generation
  renderFramesToGenerate();
  
  // Check readiness
  const warnings = [];
  
  if (!state.currentShoot.universe) {
    warnings.push('⚠️ Вселенная не выбрана — будут использованы базовые настройки');
  }
  
  if (modelCount === 0) {
    warnings.push('❌ Модели не добавлены — генерация невозможна');
  }
  
  // Check outfit avatars
  if (modelCount >= 2 && hasClothing) {
    const needsApproval = state.currentShoot.outfitAvatars?.some(a => 
      a.status === 'ok' || a.status === 'pending' || a.status === 'empty'
    );
    if (needsApproval) {
      warnings.push('⚠️ Нужно утвердить аватары луков для всех моделей');
    }
  }
  
  if (warnings.length > 0) {
    elements.summaryWarnings.innerHTML = warnings.map(w => `
      <div style="padding: 12px 16px; background: ${w.startsWith('❌') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; border-radius: 8px; margin-bottom: 8px; color: ${w.startsWith('❌') ? '#EF4444' : '#F59E0B'};">
        ${w}
      </div>
    `).join('');
    elements.btnGenerateOne.disabled = modelCount === 0;
  } else {
    elements.summaryWarnings.innerHTML = '';
    elements.btnGenerateOne.disabled = false;
  }
  
  // Render existing generated frames
  renderGeneratedHistory();
}

/**
 * Render selected frames as clickable cards for generation
 */
function renderFramesToGenerate() {
  if (!elements.framesToGenerate) return;
  
  // If no frames selected — show default option only
  if (state.selectedFrames.length === 0) {
    elements.framesToGenerate.innerHTML = `
      <div style="padding: 20px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px;">
        <h4 style="margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: var(--color-text-muted);">Кадры для генерации</h4>
        <div class="frame-gen-card" data-frame-id="" style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-bg); border: 2px solid var(--color-accent); border-radius: 8px; cursor: pointer; transition: all 0.2s;">
          <div style="width: 60px; height: 80px; background: var(--color-surface); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
            🎯
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">По умолчанию</div>
            <div style="font-size: 12px; color: var(--color-text-muted);">Стандартные параметры кадра</div>
          </div>
          <button class="btn btn-primary btn-sm btn-gen-frame" data-frame-id="" style="padding: 8px 16px; font-size: 12px;">
            🚀 Генерировать
          </button>
        </div>
        <div style="margin-top: 12px; padding: 12px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; font-size: 13px; color: var(--color-text-muted);">
          💡 Добавьте кадры на этапе "Кадры" для генерации с конкретными позами и эскизами
        </div>
      </div>
    `;
  } else {
    // Render selected frames as cards
    const frameCards = state.selectedFrames.map((sf, idx) => {
      const frame = state.frames.find(f => f.id === sf.frameId);
      if (!frame) return '';
      
      const sketchImg = frame.sketchUrl 
        ? `<img src="${frame.sketchUrl}" alt="sketch" style="width: 100%; height: 100%; object-fit: contain;">`
        : '<span style="font-size: 24px;">🖼️</span>';
      
      return `
        <div class="frame-gen-card" data-frame-id="${frame.id}" style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-bottom: 8px;">
          <div style="width: 60px; height: 80px; background: var(--color-surface); border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            ${sketchImg}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">${idx + 1}. ${escapeHtml(frame.label)}</div>
            <div style="font-size: 12px; color: var(--color-text-muted);">${frame.technical?.shotSize || 'medium'} • ${frame.technical?.cameraAngle || 'eye_level'}</div>
          </div>
          <button class="btn btn-primary btn-sm btn-gen-frame" data-frame-id="${frame.id}" style="padding: 8px 16px; font-size: 12px;">
            🚀 Генерировать
          </button>
        </div>
      `;
    }).join('');
    
    elements.framesToGenerate.innerHTML = `
      <div style="padding: 20px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px;">
        <h4 style="margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: var(--color-text-muted);">Кадры для генерации (${state.selectedFrames.length})</h4>
        ${frameCards}
        <div class="frame-gen-card" data-frame-id="" style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-bg); border: 1px dashed var(--color-border); border-radius: 8px; cursor: pointer; transition: all 0.2s; opacity: 0.7; margin-top: 8px;">
          <div style="width: 60px; height: 80px; background: var(--color-surface); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
            🎯
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 500; margin-bottom: 4px;">По умолчанию (без эскиза)</div>
            <div style="font-size: 12px; color: var(--color-text-muted);">Стандартные параметры</div>
          </div>
          <button class="btn btn-secondary btn-sm btn-gen-frame" data-frame-id="" style="padding: 8px 16px; font-size: 12px;">
            Генерировать
          </button>
        </div>
      </div>
    `;
  }
  
  // Add click handlers for generation buttons
  const buttons = elements.framesToGenerate.querySelectorAll('.btn-gen-frame');
  console.log('[Composer] Found', buttons.length, 'generation buttons');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const frameId = btn.dataset.frameId || '';
      console.log('[Composer] Generate button clicked, frameId:', frameId);
      generateFrameById(frameId);
    });
  });
}

/**
 * Generate a frame by its ID
 */
async function generateFrameById(frameId) {
  console.log('[Composer] generateFrameById called with:', frameId);
  
  if (!state.currentShoot) {
    console.error('[Composer] No current shoot!');
    return;
  }
  
  const modelCount = state.selectedModels.filter(m => m !== null).length;
  if (modelCount === 0) {
    alert('Сначала добавьте модель');
    return;
  }
  
  // Set the hidden select value
  elements.genFrame.value = frameId;
  
  // Call the existing generate function
  await generateOneFrame();
}

function exportShootJson() {
  if (!state.currentShoot) return;
  
  const exportData = {
    ...state.currentShoot,
    generatedFrames: state.generatedFrames
  };
  
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `shoot-${state.currentShoot.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearGenerationHistory() {
  if (confirm('Очистить всю историю генераций?')) {
    state.generatedFrames = [];
    renderGeneratedHistory();
  }
}

function renderGeneratedHistory() {
  const count = state.generatedFrames.length;
  elements.generationCount.textContent = `${count} изображений`;
  
  if (count === 0) {
    elements.imagesGallery.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 40px;">
        <div class="empty-state-icon">🎨</div>
        <div class="empty-state-title">Нет сгенерированных кадров</div>
        <div class="empty-state-text">Нажми "Сгенерировать кадр" выше</div>
      </div>
    `;
    return;
  }
  
  // Render in reverse order (newest first)
  elements.imagesGallery.innerHTML = [...state.generatedFrames].reverse().map((frame, reverseIdx) => {
    const idx = state.generatedFrames.length - 1 - reverseIdx;
    const timestamp = frame.timestamp ? new Date(frame.timestamp).toLocaleTimeString() : '';
    
    // Build refs HTML
    const refs = frame.refs || [];
    const refsHtml = refs.length > 0
      ? `<div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; margin-top:8px;">
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
      : '';
    
    return `
      <div class="selection-card generated-frame-card" data-frame-index="${idx}" style="cursor: default;">
        <div class="selection-card-preview" style="aspect-ratio: 3/4;">
          <img src="${frame.imageUrl}" alt="${escapeHtml(frame.frameLabel || 'Кадр')}" style="object-fit: contain; background: #000;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <div class="selection-card-title" style="margin: 0;">${escapeHtml(frame.frameLabel || 'Кадр')}</div>
          <span style="font-size: 11px; color: var(--color-text-muted);">${timestamp}</span>
        </div>
        ${frame.locationLabel ? `<div style="font-size: 12px; color: var(--color-text-muted);">📍 ${escapeHtml(frame.locationLabel)}</div>` : ''}
        
        <!-- Action buttons -->
        <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 8px;">
            <a href="${frame.imageUrl}" download="aida-${state.currentShoot?.id || 'shoot'}-${idx}.png" 
               class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px; flex: 1;">
              💾
            </a>
            <button class="btn btn-secondary btn-regenerate-from-history" data-frame-index="${idx}" style="padding: 8px 12px; font-size: 12px; flex: 1;">
              🔄
            </button>
            <button class="btn btn-secondary btn-upscale-from-history" data-frame-index="${idx}" style="padding: 8px 12px; font-size: 12px; flex: 1;">
              ⬆️
            </button>
            <button class="btn btn-secondary btn-delete-from-history" data-frame-index="${idx}" style="padding: 8px 12px; font-size: 12px; color: var(--color-accent);">
              ✕
            </button>
          </div>
        </div>
        
        <!-- Debug: Prompt + Refs -->
        <details style="margin-top: 12px; width: 100%;">
          <summary style="cursor: pointer; font-size: 11px; color: var(--color-text-muted); user-select: none;">
            📋 Промпт и референсы
          </summary>
          <div style="margin-top: 10px; text-align: left;">
            <pre style="white-space: pre-wrap; word-break: break-word; background: var(--color-surface-elevated); color: var(--color-text); padding: 10px; border-radius: 8px; max-height: 150px; overflow: auto; font-size: 10px; font-family: monospace; border: 1px solid var(--color-border);">${escapeHtml(frame.prompt || 'N/A')}</pre>
            ${refsHtml}
          </div>
        </details>
      </div>
    `;
  }).join('');
  
  // Attach handlers
  attachHistoryActionHandlers();
}

function attachHistoryActionHandlers() {
  // Regenerate buttons
  elements.imagesGallery.querySelectorAll('.btn-regenerate-from-history').forEach(btn => {
    btn.addEventListener('click', () => regenerateFromHistory(parseInt(btn.dataset.frameIndex)));
  });
  
  // Upscale buttons
  elements.imagesGallery.querySelectorAll('.btn-upscale-from-history').forEach(btn => {
    btn.addEventListener('click', () => upscaleFromHistory(parseInt(btn.dataset.frameIndex)));
  });
  
  // Delete buttons
  elements.imagesGallery.querySelectorAll('.btn-delete-from-history').forEach(btn => {
    btn.addEventListener('click', () => deleteFromHistory(parseInt(btn.dataset.frameIndex)));
  });
}

async function regenerateFromHistory(frameIndex) {
  const frame = state.generatedFrames[frameIndex];
  if (!frame) return;
  
  // Use the same settings as the original frame
  elements.genLocation.value = frame.locationId || '';
  elements.genFrame.value = frame.frameId || '';
  elements.genExtraPrompt.value = frame.extraPrompt || '';
  
  // Generate new frame (will be added to history)
  await generateOneFrame();
}

async function upscaleFromHistory(frameIndex) {
  const frame = state.generatedFrames[frameIndex];
  if (!frame || !state.currentShoot) return;
  
  const btn = elements.imagesGallery.querySelector(`.btn-upscale-from-history[data-frame-index="${frameIndex}"]`);
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳';
  
  try {
    const match = frame.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid image format');
    
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/upscale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: match[2], mimeType: match[1], scale: 2 })
    });
    
    const data = await res.json();
    
    if (data.ok && data.data) {
      // Add upscaled as NEW frame in history
      state.generatedFrames.push({
        ...frame,
        imageUrl: data.data.imageUrl,
        frameLabel: (frame.frameLabel || 'Кадр') + ' (2x)',
        timestamp: new Date().toISOString()
      });
      renderGeneratedHistory();
    } else {
      alert('Ошибка: ' + (data.error || 'Не удалось увеличить'));
    }
  } catch (e) {
    console.error('Error upscaling:', e);
    alert('Ошибка апскейла: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function deleteFromHistory(frameIndex) {
  state.generatedFrames.splice(frameIndex, 1);
  renderGeneratedHistory();
}

async function generateOneFrame() {
  if (!state.currentShoot) return;
  
  const btn = elements.btnGenerateOne;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Генерация...';
  
  // Get selected options
  const locationId = elements.genLocation.value || null;
  const frameId = elements.genFrame.value || null;
  const extraPrompt = elements.genExtraPrompt.value.trim();
  const posingStyle = parseInt(elements.genPosingStyle?.value) || 2;
  const poseAdherence = parseInt(elements.genPoseAdherence?.value) || 2;
  
  // Find frame index if a frame from shoot is selected (for backward compat)
  let frameIndex = undefined;
  if (frameId) {
    const idx = state.selectedFrames.findIndex(sf => sf.frameId === frameId);
    if (idx >= 0) {
      frameIndex = idx;
    }
  }
  
  try {
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/generate-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        frameIndex,
        frameId,  // <-- Pass frameId directly!
        locationId,
        extraPrompt,
        posingStyle,
        poseAdherence
      })
    });
    
    const data = await res.json();
    
    if (data.ok && data.data) {
      // Find location and frame labels
      const location = state.locations.find(l => l.id === locationId);
      const frame = state.frames.find(f => f.id === (data.data.frameId || frameId));
      
      // Add to history (don't replace)
      state.generatedFrames.push({
        imageUrl: data.data.imageUrl,
        frameId: data.data.frameId || frameId,
        frameLabel: data.data.frameLabel || frame?.label || 'Кадр',
        locationId: locationId,
        locationLabel: location?.label || null,
        prompt: data.data.prompt,
        promptJson: data.data.promptJson,
        refs: data.data.refs,
        extraPrompt: extraPrompt,
        timestamp: new Date().toISOString()
      });
      
      // Clear extra prompt after successful generation
      elements.genExtraPrompt.value = '';
      
      renderGeneratedHistory();
    } else {
      alert('Ошибка генерации: ' + (data.error || 'Неизвестная ошибка'));
    }
  } catch (e) {
    console.error('Error generating frame:', e);
    alert('Ошибка сети: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ═══════════════════════════════════════════════════════════════
// FRAME ACTION HANDLERS
// ═══════════════════════════════════════════════════════════════

function attachFrameActionHandlers() {
  // Regenerate buttons
  elements.imagesGallery.querySelectorAll('.btn-regenerate').forEach(btn => {
    btn.addEventListener('click', () => regenerateFrame(parseInt(btn.dataset.frameIndex)));
  });
  
  // Edit prompt buttons
  elements.imagesGallery.querySelectorAll('.btn-edit-prompt').forEach(btn => {
    btn.addEventListener('click', () => showEditPromptForm(parseInt(btn.dataset.frameIndex)));
  });
  
  // Cancel edit buttons
  elements.imagesGallery.querySelectorAll('.btn-cancel-edit').forEach(btn => {
    btn.addEventListener('click', () => hideEditPromptForm(parseInt(btn.dataset.frameIndex)));
  });
  
  // Apply edit buttons
  elements.imagesGallery.querySelectorAll('.btn-apply-edit').forEach(btn => {
    btn.addEventListener('click', () => applyEditPrompt(parseInt(btn.dataset.frameIndex)));
  });
  
  // Upscale buttons
  elements.imagesGallery.querySelectorAll('.btn-upscale').forEach(btn => {
    btn.addEventListener('click', () => upscaleFrame(parseInt(btn.dataset.frameIndex)));
  });
}

function showEditPromptForm(frameIndex) {
  const form = elements.imagesGallery.querySelector(`.edit-prompt-form[data-frame-index="${frameIndex}"]`);
  if (form) {
    form.style.display = 'block';
  }
}

function hideEditPromptForm(frameIndex) {
  const form = elements.imagesGallery.querySelector(`.edit-prompt-form[data-frame-index="${frameIndex}"]`);
  if (form) {
    form.style.display = 'none';
  }
}

async function regenerateFrame(frameIndex) {
  if (!state.currentShoot || !state.generatedFrames) return;
  
  const frame = state.generatedFrames[frameIndex];
  if (!frame) return;
  
  const btn = elements.imagesGallery.querySelector(`.btn-regenerate[data-frame-index="${frameIndex}"]`);
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳...';
  
  try {
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/generate-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        frameIndex: state.selectedFrames.findIndex(sf => sf.frameId === frame.frameId)
      })
    });
    
    const data = await res.json();
    
    if (data.ok && data.data) {
      // Update the frame in state
      state.generatedFrames[frameIndex] = {
        ...state.generatedFrames[frameIndex],
        imageUrl: data.data.imageUrl,
        prompt: data.data.prompt,
        promptJson: data.data.promptJson,
        refs: data.data.refs
      };
      
      // Update the image in DOM
      const card = elements.imagesGallery.querySelector(`.generated-frame-card[data-frame-index="${frameIndex}"]`);
      if (card) {
        const img = card.querySelector('.selection-card-preview img');
        if (img) {
          img.src = data.data.imageUrl;
        }
      }
    } else {
      alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
    }
  } catch (e) {
    console.error('Error regenerating frame:', e);
    alert('Ошибка перегенерации');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function applyEditPrompt(frameIndex) {
  if (!state.currentShoot || !state.generatedFrames) return;
  
  const frame = state.generatedFrames[frameIndex];
  if (!frame) return;
  
  const form = elements.imagesGallery.querySelector(`.edit-prompt-form[data-frame-index="${frameIndex}"]`);
  const textarea = form.querySelector('.edit-prompt-textarea');
  const extraPrompt = textarea.value.trim();
  
  if (!extraPrompt) {
    alert('Введите дополнительный промпт');
    return;
  }
  
  const btn = form.querySelector('.btn-apply-edit');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳...';
  
  try {
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/generate-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        frameIndex: state.selectedFrames.findIndex(sf => sf.frameId === frame.frameId),
        extraPrompt
      })
    });
    
    const data = await res.json();
    
    if (data.ok && data.data) {
      // Update the frame in state
      state.generatedFrames[frameIndex] = {
        ...state.generatedFrames[frameIndex],
        imageUrl: data.data.imageUrl,
        prompt: data.data.prompt,
        promptJson: data.data.promptJson,
        refs: data.data.refs
      };
      
      // Update the image in DOM
      const card = elements.imagesGallery.querySelector(`.generated-frame-card[data-frame-index="${frameIndex}"]`);
      if (card) {
        const img = card.querySelector('.selection-card-preview img');
        if (img) {
          img.src = data.data.imageUrl;
        }
      }
      
      // Hide the form
      hideEditPromptForm(frameIndex);
      textarea.value = '';
    } else {
      alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
    }
  } catch (e) {
    console.error('Error applying edit prompt:', e);
    alert('Ошибка применения изменений');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function upscaleFrame(frameIndex) {
  if (!state.currentShoot || !state.generatedFrames) return;
  
  const frame = state.generatedFrames[frameIndex];
  if (!frame) return;
  
  const btn = elements.imagesGallery.querySelector(`.btn-upscale[data-frame-index="${frameIndex}"]`);
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳...';
  
  try {
    // Extract base64 from data URL
    const match = frame.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid image format');
    }
    
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/upscale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageBase64: match[2],
        mimeType: match[1],
        scale: 2
      })
    });
    
    const data = await res.json();
    
    if (data.ok && data.data) {
      // Update with upscaled image
      state.generatedFrames[frameIndex] = {
        ...state.generatedFrames[frameIndex],
        imageUrl: data.data.imageUrl
      };
      
      // Update the image in DOM
      const card = elements.imagesGallery.querySelector(`.generated-frame-card[data-frame-index="${frameIndex}"]`);
      if (card) {
        const img = card.querySelector('.selection-card-preview img');
        if (img) {
          img.src = data.data.imageUrl;
        }
        // Update download link
        const downloadLink = card.querySelector('a[download]');
        if (downloadLink) {
          downloadLink.href = data.data.imageUrl;
        }
      }
      
      btn.textContent = '✓ Апскейл выполнен';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    } else {
      alert('Ошибка: ' + (data.error || 'Апскейл пока не реализован'));
    }
  } catch (e) {
    console.error('Error upscaling frame:', e);
    alert('Ошибка апскейла: ' + e.message);
  } finally {
    btn.disabled = false;
    if (btn.textContent === '⏳...') {
      btn.textContent = originalText;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

// Compress image to max dimension and quality
const MAX_IMAGE_SIZE = 1600;
const JPEG_QUALITY = 0.85;

function compressImageAndGetBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      let { width, height } = img;
      
      if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
        const ratio = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      const base64 = dataUrl.split(',')[1];
      resolve({
        base64,
        mimeType: 'image/jpeg',
        dataUrl
      });
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsBase64(file) {
  // Use compression for all image uploads
  return compressImageAndGetBase64(file).then(result => {
    console.log(`[Composer] Compressed ${file.name}: ${Math.round(file.size / 1024)}KB → ${Math.round(result.base64.length * 0.75 / 1024)}KB`);
    return result.base64;
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
  
  await checkServerStatus();
  
  // Load all data in parallel
  await Promise.all([
    loadShoots(),
    loadUniverses(),
    loadModels(),
    loadFrames(),
    loadLocations()
  ]);
  
  updateStepStatuses();
}

document.addEventListener('DOMContentLoaded', init);

