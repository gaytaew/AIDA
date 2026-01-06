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
  
  // Generated frames (for iterative editing)
  generatedFrames: []
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
  elements.btnGenerateShoot = document.getElementById('btn-generate-shoot');
  elements.generatedImages = document.getElementById('generated-images');
  elements.imagesGallery = document.getElementById('images-gallery');
  elements.stepSummaryStatus = document.getElementById('step-summary-status');
  
  // Summary values
  elements.summaryUniverse = document.getElementById('summary-universe');
  elements.summaryModels = document.getElementById('summary-models');
  elements.summaryFrames = document.getElementById('summary-frames');
  elements.summaryClothing = document.getElementById('summary-clothing');
  elements.summaryStatus = document.getElementById('summary-status');
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
  elements.btnGenerateShoot.addEventListener('click', generateShoot);
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
    const base64 = await readFileAsBase64(file);
    images.push({
      mimeType: file.type,
      base64: base64
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
  elements.summaryFrames.textContent = frameCount > 0 ? `${frameCount} кадров` : 'Не добавлены';
  elements.summaryClothing.textContent = hasClothing ? 'Загружена' : 'Без одежды';
  
  // Check readiness
  const warnings = [];
  
  if (!state.currentShoot.universe) {
    warnings.push('⚠️ Вселенная не выбрана');
  }
  
  if (modelCount === 0) {
    warnings.push('⚠️ Модели не добавлены');
  }
  
  if (frameCount === 0) {
    warnings.push('⚠️ Кадры не добавлены (будут использованы параметры по умолчанию)');
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
      <div style="padding: 12px 16px; background: rgba(233, 69, 96, 0.1); border-radius: 8px; margin-bottom: 8px; color: var(--color-accent);">
        ${w}
      </div>
    `).join('');
    elements.summaryStatus.textContent = 'Есть предупреждения';
    elements.summaryStatus.style.color = 'var(--color-accent)';
  } else {
    elements.summaryWarnings.innerHTML = '';
    elements.summaryStatus.textContent = '✓ Готово к генерации';
    elements.summaryStatus.style.color = '#22C55E';
  }
}

function exportShootJson() {
  if (!state.currentShoot) return;
  
  const json = JSON.stringify(state.currentShoot, null, 2);
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

async function generateShoot() {
  if (!state.currentShoot) return;
  
  const btn = elements.btnGenerateShoot;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Генерация...';
  
  // Show gallery area
  elements.generatedImages.style.display = 'block';
  elements.imagesGallery.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1; padding: 60px;">
      <div class="empty-state-icon" style="font-size: 48px; animation: pulse 1s infinite;">🎨</div>
      <div class="empty-state-title">Генерация изображения...</div>
      <div class="empty-state-text">Это может занять 30-60 секунд</div>
    </div>
  `;
  
  try {
    const res = await fetch(`/api/shoots/${state.currentShoot.id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await res.json();
    
    if (data.ok && data.data) {
      // Display generated images from frames array
      const frames = data.data.frames || [];
      const successFrames = frames.filter(f => f.status === 'ok' && f.imageUrl);
      const errorFrames = frames.filter(f => f.status !== 'ok');
      
      if (successFrames.length === 0) {
        elements.imagesGallery.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1; padding: 40px;">
            <div class="empty-state-icon">❌</div>
            <div class="empty-state-title">Не удалось сгенерировать изображения</div>
            <div class="empty-state-text">${errorFrames.length > 0 ? escapeHtml(errorFrames[0].error || 'Неизвестная ошибка') : 'Попробуйте еще раз'}</div>
          </div>
        `;
      } else {
        // Store generated frames for later actions
        state.generatedFrames = successFrames;
        
        elements.imagesGallery.innerHTML = successFrames.map((frame, i) => {
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
                           style="width:100%; height:80px; object-fit:cover; border-radius:6px; border:1px solid var(--color-border);">
                    </div>
                  `;
                }).join('')}
              </div>`
            : '<div style="font-size:12px; color:var(--color-text-muted); margin-top:8px;">Нет сохранённых референсов</div>';
          
          return `
            <div class="selection-card generated-frame-card" data-frame-index="${i}" style="cursor: default;">
              <div class="selection-card-preview" style="aspect-ratio: 3/4;">
                <img src="${frame.imageUrl}" alt="${escapeHtml(frame.frameLabel || 'Кадр')}" style="object-fit: contain; background: #000;">
              </div>
              <div class="selection-card-title">${escapeHtml(frame.frameLabel || `Кадр ${i + 1}`)}</div>
              
              <!-- Action buttons -->
              <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; gap: 8px;">
                  <a href="${frame.imageUrl}" download="shoot-${state.currentShoot.id}-${frame.frameId}.png" 
                     class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px; flex: 1;">
                    💾 Скачать
                  </a>
                  <button class="btn btn-secondary btn-regenerate" data-frame-index="${i}" style="padding: 8px 12px; font-size: 12px; flex: 1;">
                    🔄 Перегенерировать
                  </button>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-edit-prompt" data-frame-index="${i}" style="padding: 8px 12px; font-size: 12px; flex: 1;">
                    ✏️ Изменить
                  </button>
                  <button class="btn btn-secondary btn-upscale" data-frame-index="${i}" style="padding: 8px 12px; font-size: 12px; flex: 1;">
                    ⬆️ Апскейл
                  </button>
                </div>
              </div>
              
              <!-- Edit prompt form (hidden by default) -->
              <div class="edit-prompt-form" data-frame-index="${i}" style="display: none; margin-top: 12px;">
                <textarea class="edit-prompt-textarea" placeholder="Введите дополнительный промпт для изменения..." style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface); color: var(--color-text); font-family: inherit; resize: vertical;"></textarea>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                  <button class="btn btn-primary btn-apply-edit" data-frame-index="${i}" style="padding: 8px 16px; font-size: 12px;">
                    ✓ Применить
                  </button>
                  <button class="btn btn-secondary btn-cancel-edit" data-frame-index="${i}" style="padding: 8px 16px; font-size: 12px;">
                    ✕ Отмена
                  </button>
                </div>
              </div>
              
              <!-- Debug: Prompt + Refs -->
              <details style="margin-top: 12px; width: 100%;">
                <summary style="cursor: pointer; font-size: 12px; color: var(--color-text-muted); user-select: none;">
                  📋 Промпт и референсы
                </summary>
                <div style="margin-top: 10px; text-align: left;">
                  <!-- JSON Prompt -->
                  ${frame.promptJson ? `
                    <div style="font-weight: 600; font-size: 11px; color: var(--color-text-muted); margin-bottom: 6px; text-transform: uppercase;">JSON Промпт (структура)</div>
                    <pre style="white-space: pre-wrap; word-break: break-word; background: #0d1117; color: #c9d1d9; padding: 10px; border-radius: 8px; max-height: 200px; overflow: auto; font-size: 10px; font-family: 'SF Mono', Monaco, monospace; border: 1px solid var(--color-border);">${escapeHtml(JSON.stringify(frame.promptJson, null, 2))}</pre>
                  ` : ''}
                  
                  <div style="font-weight: 600; font-size: 11px; color: var(--color-text-muted); margin-top: 12px; margin-bottom: 6px; text-transform: uppercase;">Текстовый промпт (отправлен в Gemini)</div>
                  <pre style="white-space: pre-wrap; word-break: break-word; background: var(--color-surface-elevated); color: var(--color-text); padding: 10px; border-radius: 8px; max-height: 200px; overflow: auto; font-size: 11px; font-family: monospace; border: 1px solid var(--color-border);">${escapeHtml(frame.prompt || 'Промпт не сохранён')}</pre>
                  
                  <div style="font-weight: 600; font-size: 11px; color: var(--color-text-muted); margin-top: 12px; margin-bottom: 6px; text-transform: uppercase;">Референсы</div>
                  ${refsHtml}
                </div>
              </details>
            </div>
          `;
        }).join('');
        
        // Add event handlers for action buttons
        attachFrameActionHandlers();
        
        if (errorFrames.length > 0) {
          elements.imagesGallery.innerHTML += `
            <div class="selection-card" style="cursor: default; border-color: var(--color-accent);">
              <div class="empty-state" style="padding: 20px;">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-title">${errorFrames.length} кадр(ов) с ошибками</div>
              </div>
            </div>
          `;
        }
      }
      
      elements.summaryStatus.textContent = `✓ Сгенерировано ${successFrames.length} из ${frames.length}`;
      elements.summaryStatus.style.color = '#22C55E';
    } else {
      elements.imagesGallery.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 40px;">
          <div class="empty-state-icon">❌</div>
          <div class="empty-state-title">Ошибка генерации</div>
          <div class="empty-state-text">${escapeHtml(data.error || 'Неизвестная ошибка')}</div>
        </div>
      `;
    }
  } catch (e) {
    console.error('Error generating shoot:', e);
    elements.imagesGallery.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 40px;">
        <div class="empty-state-icon">❌</div>
        <div class="empty-state-title">Ошибка сети</div>
        <div class="empty-state-text">${escapeHtml(e.message)}</div>
      </div>
    `;
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

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
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
  
  await checkServerStatus();
  
  // Load all data in parallel
  await Promise.all([
    loadShoots(),
    loadUniverses(),
    loadModels(),
    loadFrames()
  ]);
  
  updateStepStatuses();
}

document.addEventListener('DOMContentLoaded', init);

