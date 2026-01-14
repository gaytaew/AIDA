/**
 * Custom Shoot 5 — Smart System
 * 
 * New architecture:
 * - Technical parameters (camera settings) — STRICT specs
 * - Artistic parameters (mood, era) — NARRATIVE descriptions
 * - Dependency Matrix — prevents conflicting combinations
 * 
 * Key features:
 * - Real-time conflict detection and auto-fix
 * - Disabled options based on current selections
 * - Visual feedback for locked/disabled states
 */

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw e;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(message, type = 'info', duration = 3000) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button onclick="this.parentElement.remove()">×</button>
  `;
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
    color: white; padding: 12px 20px; border-radius: 8px; z-index: 9999;
    display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: toast-slide-up 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const state = {
  currentStep: 'shoot',
  currentShoot: null,
  
  // Available entities
  shoots: [],
  models: [],
  frames: [],
  locations: [],
  emotions: [],
  
  // Selected for shoot
  selectedModels: [null, null, null],
  clothingByModel: [[], [], []],
  lookPrompts: ['', '', ''],
  
  // V5 Parameters
  v5Schema: null,        // Full schema from API
  v5Params: {},          // Current parameter values
  v5Disabled: {},        // Disabled options per field
  v5Locked: {},          // Locked values per field
  v5Corrections: [],     // Applied corrections
  
  // Generation
  generatedFrames: [],
  isGenerating: false,
  
  // Style Lock
  styleLock: { enabled: false, mode: null, imageId: null, imageUrl: null }
};

const STEP_ORDER = ['shoot', 'models', 'clothing', 'generate'];

// ═══════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════

const elements = {};

function initElements() {
  elements.serverStatus = document.getElementById('server-status');
  elements.stepItems = document.querySelectorAll('.step-item');
  elements.stepPanels = document.querySelectorAll('.step-panel');
  
  // Step 1
  elements.shootsList = document.getElementById('shoots-list');
  elements.btnNewShoot = document.getElementById('btn-new-shoot');
  elements.btnNextToModels = document.getElementById('btn-next-to-models');
  elements.stepShootStatus = document.getElementById('step-shoot-status');
  
  // Step 2
  elements.modelSlots = document.getElementById('model-slots');
  elements.modelsGrid = document.getElementById('models-grid');
  elements.availableModels = document.getElementById('available-models');
  elements.btnBackToShoot = document.getElementById('btn-back-to-shoot');
  elements.btnNextToClothing = document.getElementById('btn-next-to-clothing');
  elements.stepModelsStatus = document.getElementById('step-models-status');
  
  // Step 3
  elements.clothingSections = document.getElementById('clothing-sections');
  elements.btnBackToModels = document.getElementById('btn-back-to-models');
  elements.btnNextToFrames = document.getElementById('btn-next-to-frames');
  elements.stepClothingStatus = document.getElementById('step-clothing-status');
  
  // Step 4
  elements.universeParamsContainer = document.getElementById('universe-params-container');
  elements.conflictsPanel = document.getElementById('conflicts-panel');
  elements.conflictsList = document.getElementById('conflicts-list');
  elements.conflictsCount = document.getElementById('conflicts-count');
  elements.btnFixAll = document.getElementById('btn-fix-all');
  elements.vibeGrid = document.getElementById('vibe-grid');
  elements.narrativePreviewPanel = document.getElementById('narrative-preview-panel');
  elements.narrativePreviewContent = document.getElementById('narrative-preview-content');
  elements.btnTogglePreview = document.getElementById('btn-toggle-preview');
  elements.framesToGenerate = document.getElementById('frames-to-generate');
  elements.imagesGallery = document.getElementById('images-gallery');
  elements.generationCount = document.getElementById('generation-count');
  elements.btnBackToFrames = document.getElementById('btn-back-to-frames');
  elements.btnClearHistory = document.getElementById('btn-clear-history');
  
  // Generation controls
  elements.genLocation = document.getElementById('gen-location');
  elements.genEmotion = document.getElementById('gen-emotion');
  elements.genAspectRatio = document.getElementById('gen-aspect-ratio');
  elements.genImageSize = document.getElementById('gen-image-size');
  elements.genPoseAdherence = document.getElementById('gen-pose-adherence');
  elements.genShotSize = document.getElementById('gen-shot-size');
  elements.genCameraAngle = document.getElementById('gen-camera-angle');
  elements.genExtraPrompt = document.getElementById('gen-extra-prompt');
  
  // Mode selector
  elements.modeOptions = document.querySelectorAll('.mode-option');
  
  // Lock controls
  elements.styleLockOff = document.getElementById('style-lock-off');
  elements.styleLockStrict = document.getElementById('style-lock-strict');
  elements.styleLockPreview = document.getElementById('style-lock-preview');
  elements.styleLockImg = document.getElementById('style-lock-img');
}

// ═══════════════════════════════════════════════════════════════
// V5 SCHEMA & PARAMETERS API
// ═══════════════════════════════════════════════════════════════

async function loadV5Schema() {
  try {
    const res = await fetchWithTimeout('/api/universes/v5/params', {}, 10000);
    const data = await res.json();
    
    if (data.ok) {
      state.v5Schema = data.data;
      state.v5Params = { ...data.data.defaults };
      console.log('[V5] Schema loaded:', Object.keys(state.v5Schema));
      return true;
    }
  } catch (e) {
    console.error('[V5] Failed to load schema:', e);
  }
  return false;
}

async function applyV5Dependencies() {
  try {
    const res = await fetchWithTimeout('/api/universes/v5/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: state.v5Params })
    }, 5000);
    
    const data = await res.json();
    if (data.ok) {
      state.v5Params = data.data.params;
      state.v5Corrections = data.data.applied;
      
      if (data.data.wasModified) {
        console.log('[V5] Dependencies applied:', data.data.applied.length, 'corrections');
        renderV5Corrections();
      }
      
      return data.data;
    }
  } catch (e) {
    console.error('[V5] Apply dependencies error:', e);
  }
  return null;
}

async function getDisabledOptions(field) {
  try {
    const res = await fetchWithTimeout('/api/universes/v5/disabled', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, params: state.v5Params })
    }, 3000);
    
    const data = await res.json();
    if (data.ok) {
      state.v5Disabled[field] = new Set(data.data.disabled);
      state.v5Locked[field] = data.data.locked;
      return data.data;
    }
  } catch (e) {
    console.error('[V5] Get disabled options error:', e);
  }
  return null;
}

async function previewV5Prompt() {
  try {
    const res = await fetchWithTimeout('/api/universes/v5/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        params: state.v5Params,
        scene: {}
      })
    }, 5000);
    
    const data = await res.json();
    if (data.ok) {
      return data.data;
    }
  } catch (e) {
    console.error('[V5] Preview error:', e);
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// RENDER V5 PARAMETERS UI
// ═══════════════════════════════════════════════════════════════

function renderV5ParametersUI() {
  if (!state.v5Schema) {
    elements.universeParamsContainer.innerHTML = `
      <div class="universe-settings" style="text-align: center; padding: 40px;">
        <div style="font-size: 24px; margin-bottom: 12px;">⚠️</div>
        <div style="color: var(--color-text-muted);">Не удалось загрузить параметры V5</div>
      </div>
    `;
    return;
  }
  
  const { technical, artistic, context } = state.v5Schema;
  
  let html = '';
  
  // TECHNICAL PARAMETERS
  html += `
    <div class="universe-settings" id="tech-params-block">
      <h4 style="display: flex; align-items: center; gap: 8px;">
        📷 Технические параметры
        <span style="font-size: 11px; color: var(--color-text-muted); font-weight: normal;">
          (Строгие настройки камеры)
        </span>
      </h4>
      <div class="universe-grid">
  `;
  
  for (const [paramId, paramDef] of Object.entries(technical)) {
    html += renderV5Select(paramId, paramDef, 'technical');
  }
  
  html += `</div></div>`;
  
  // ARTISTIC PARAMETERS
  html += `
    <div class="universe-settings" id="artistic-params-block">
      <h4 style="display: flex; align-items: center; gap: 8px;">
        🎨 Художественные параметры
        <span style="font-size: 11px; color: var(--color-text-muted); font-weight: normal;">
          (Нарративное описание атмосферы)
        </span>
      </h4>
      <div class="universe-grid">
  `;
  
  for (const [paramId, paramDef] of Object.entries(artistic)) {
    html += renderV5Select(paramId, paramDef, 'artistic');
  }
  
  html += `</div></div>`;
  
  // CONTEXT PARAMETERS
  html += `
    <div class="universe-settings" id="context-params-block">
      <h4 style="display: flex; align-items: center; gap: 8px;">
        🌍 Контекст
        <span style="font-size: 11px; color: var(--color-text-muted); font-weight: normal;">
          (Время, погода, сезон)
        </span>
      </h4>
      <div class="universe-grid">
  `;
  
  for (const [paramId, paramDef] of Object.entries(context)) {
    html += renderV5Select(paramId, paramDef, 'context');
  }
  
  html += `</div></div>`;
  
  elements.universeParamsContainer.innerHTML = html;
  
  // Add event listeners to all selects
  elements.universeParamsContainer.querySelectorAll('select[data-v5-param]').forEach(select => {
    select.addEventListener('change', (e) => onV5ParamChange(e.target.dataset.v5Param, e.target.value));
  });
  
  // Initial update of disabled states
  updateAllV5DisabledStates();
}

function renderV5Select(paramId, paramDef, category) {
  const currentValue = state.v5Params[paramId] || '';
  const disabled = state.v5Disabled[paramId] || new Set();
  const locked = state.v5Locked[paramId];
  
  const isLocked = locked != null;
  
  let optionsHtml = '';
  for (const opt of paramDef.options) {
    const isDisabled = disabled.has(opt.value);
    const isSelected = opt.value === currentValue;
    
    optionsHtml += `
      <option value="${opt.value}" 
              ${isSelected ? 'selected' : ''} 
              ${isDisabled ? 'disabled' : ''}>
        ${opt.label}${isDisabled ? ' ⛔' : ''}
      </option>
    `;
  }
  
  return `
    <div class="form-group" data-param="${paramId}">
      <label for="v5-${paramId}">
        ${paramDef.label}
        ${isLocked ? `<span style="color: var(--color-warning);" title="${locked.reason}">🔒</span>` : ''}
      </label>
      <select id="v5-${paramId}" 
              data-v5-param="${paramId}"
              data-category="${category}"
              ${isLocked ? 'disabled' : ''}>
        ${optionsHtml}
      </select>
      ${isLocked ? `<div style="font-size: 10px; color: var(--color-warning); margin-top: 4px;">${locked.reason}</div>` : ''}
    </div>
  `;
}

async function onV5ParamChange(paramId, value) {
  console.log('[V5] Param changed:', paramId, '=', value);
  
  // Update local state
  state.v5Params[paramId] = value;
  
  // Apply dependencies
  await applyV5Dependencies();
  
  // Update all disabled states
  await updateAllV5DisabledStates();
  
  // Update prompt preview
  updatePromptPreview();
  
  // Save to shoot
  saveV5ParamsToShoot();
}

async function updateAllV5DisabledStates() {
  if (!state.v5Schema) return;
  
  const allParams = [
    ...Object.keys(state.v5Schema.technical),
    ...Object.keys(state.v5Schema.artistic),
    ...Object.keys(state.v5Schema.context)
  ];
  
  // Get disabled/locked for each field
  for (const field of allParams) {
    await getDisabledOptions(field);
  }
  
  // Update UI
  for (const field of allParams) {
    const select = document.querySelector(`select[data-v5-param="${field}"]`);
    if (!select) continue;
    
    const disabled = state.v5Disabled[field] || new Set();
    const locked = state.v5Locked[field];
    
    // Update locked state
    if (locked) {
      select.disabled = true;
      select.value = locked.value;
      state.v5Params[field] = locked.value;
      
      // Add lock indicator
      const formGroup = select.closest('.form-group');
      let lockIndicator = formGroup.querySelector('.lock-indicator');
      if (!lockIndicator) {
        lockIndicator = document.createElement('div');
        lockIndicator.className = 'lock-indicator';
        lockIndicator.style.cssText = 'font-size: 10px; color: var(--color-warning); margin-top: 4px;';
        formGroup.appendChild(lockIndicator);
      }
      lockIndicator.textContent = `🔒 ${locked.reason}`;
    } else {
      select.disabled = false;
      const formGroup = select.closest('.form-group');
      const lockIndicator = formGroup.querySelector('.lock-indicator');
      if (lockIndicator) lockIndicator.remove();
    }
    
    // Update option disabled states
    for (const option of select.options) {
      option.disabled = disabled.has(option.value);
      if (option.disabled && !option.text.includes('⛔')) {
        option.text += ' ⛔';
      } else if (!option.disabled && option.text.includes(' ⛔')) {
        option.text = option.text.replace(' ⛔', '');
      }
    }
    
    // Highlight if current value is now invalid
    if (disabled.has(select.value) && !locked) {
      select.classList.add('conflict');
    } else {
      select.classList.remove('conflict');
    }
  }
}

function renderV5Corrections() {
  if (!state.v5Corrections || state.v5Corrections.length === 0) {
    elements.conflictsPanel.classList.remove('visible');
    return;
  }
  
  elements.conflictsPanel.classList.add('visible', 'has-hints');
  elements.conflictsCount.textContent = state.v5Corrections.length;
  
  elements.conflictsList.innerHTML = state.v5Corrections.map(c => `
    <div class="conflict-item">
      <div class="conflict-item-title">
        ✅ ${c.field}: ${c.from} → ${c.to}
      </div>
      <div class="conflict-item-message">${c.reason}</div>
    </div>
  `).join('');
}

async function updatePromptPreview() {
  const preview = await previewV5Prompt();
  if (!preview) return;
  
  elements.narrativePreviewPanel.style.display = 'block';
  elements.narrativePreviewContent.innerHTML = `
    <pre style="white-space: pre-wrap; font-family: monospace; font-size: 11px; line-height: 1.5;">
${escapeHtml(preview.prompt)}
    </pre>
  `;
}

function saveV5ParamsToShoot() {
  if (!state.currentShoot) return;
  
  // Save to current shoot
  state.currentShoot.v5Params = { ...state.v5Params };
  
  // Debounced save to server
  clearTimeout(state.saveTimeout);
  state.saveTimeout = setTimeout(async () => {
    try {
      await fetchWithTimeout(`/api/custom-shoots/${state.currentShoot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          v5Params: state.v5Params
        })
      }, 5000);
    } catch (e) {
      console.error('[V5] Failed to save params:', e);
    }
  }, 1000);
}

// ═══════════════════════════════════════════════════════════════
// VIBE PRESETS
// ═══════════════════════════════════════════════════════════════

const VIBE_PRESETS = [
  {
    id: 'summer_playful',
    icon: '☀️',
    name: 'Летний кайф',
    desc: 'Яркие цвета, тёплый свет, энергия',
    params: {
      visualMood: 'playful_summer',
      lightSource: 'golden_hour',
      whiteBalance: 'warm',
      exposure: 'over_slight',
      contrastCurve: 's_curve_moderate',
      energyLevel: 'high',
      weather: 'clear',
      season: 'summer'
    }
  },
  {
    id: 'editorial_bold',
    icon: '📸',
    name: 'Editorial Bold',
    desc: 'Контрастный, уверенный, журнальный',
    params: {
      visualMood: 'confident_bold',
      lightSource: 'studio_hard',
      lightQuality: 'hard',
      contrastCurve: 's_curve_high',
      culturalContext: 'editorial',
      processingStyle: 'punchy',
      energyLevel: 'medium',
      weather: 'indoor'
    }
  },
  {
    id: 'moody_noir',
    icon: '🌙',
    name: 'Moody Noir',
    desc: 'Тёмный, загадочный, кинематографичный',
    params: {
      visualMood: 'mysterious',
      lightSource: 'practicals',
      lightDirection: 'side',
      lightQuality: 'hard',
      exposure: 'under_heavy',
      contrastCurve: 'crushed',
      energyLevel: 'low',
      timeOfDay: 'night'
    }
  },
  {
    id: 'soft_romantic',
    icon: '🌸',
    name: 'Soft Romantic',
    desc: 'Мягкий, нежный, романтичный',
    params: {
      visualMood: 'melancholic',
      lightSource: 'window',
      lightQuality: 'soft',
      aperture: 'wide_open',
      exposure: 'over_slight',
      contrastCurve: 'flat_lifted',
      processingStyle: 'matte_editorial',
      energyLevel: 'low'
    }
  },
  {
    id: 'y2k_flash',
    icon: '📱',
    name: 'Y2K Flash',
    desc: 'Ранняя цифра, жёсткая вспышка, глянец',
    params: {
      decade: 'y2k',
      camera: 'smartphone',
      lightSource: 'flash_fill',
      lightQuality: 'hard',
      contrastCurve: 's_curve_high',
      processingStyle: 'punchy',
      spontaneity: 'semi_candid'
    }
  },
  {
    id: 'film_90s',
    icon: '🎞️',
    name: '90s Film',
    desc: 'Гранж, плёнка, candid',
    params: {
      decade: '90s',
      camera: '35mm_film',
      processingStyle: 'film_scan',
      contrastCurve: 'linear',
      spontaneity: 'candid',
      culturalContext: 'street'
    }
  }
];

function renderVibePresets() {
  elements.vibeGrid.innerHTML = VIBE_PRESETS.map(vibe => `
    <div class="vibe-card" data-vibe="${vibe.id}">
      <div class="vibe-card-icon">${vibe.icon}</div>
      <div class="vibe-card-name">${vibe.name}</div>
      <div class="vibe-card-desc">${vibe.desc}</div>
    </div>
  `).join('');
  
  elements.vibeGrid.querySelectorAll('.vibe-card').forEach(card => {
    card.addEventListener('click', () => applyVibePreset(card.dataset.vibe));
  });
}

async function applyVibePreset(vibeId) {
  const vibe = VIBE_PRESETS.find(v => v.id === vibeId);
  if (!vibe) return;
  
  // Update active state
  elements.vibeGrid.querySelectorAll('.vibe-card').forEach(card => {
    card.classList.toggle('active', card.dataset.vibe === vibeId);
  });
  
  // Apply preset params
  state.v5Params = { ...state.v5Schema.defaults, ...vibe.params };
  
  // Apply dependencies
  await applyV5Dependencies();
  
  // Update all selects with new values
  for (const [key, value] of Object.entries(state.v5Params)) {
    const select = document.querySelector(`select[data-v5-param="${key}"]`);
    if (select) {
      select.value = value;
    }
  }
  
  // Update disabled states
  await updateAllV5DisabledStates();
  
  // Update preview
  updatePromptPreview();
  
  showToast(`Применён пресет: ${vibe.name}`, 'success');
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION & STEPS
// ═══════════════════════════════════════════════════════════════

function goToStep(stepId) {
  state.currentStep = stepId;
  
  elements.stepItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.step === stepId) item.classList.add('active');
  });
  
  elements.stepPanels.forEach(panel => {
    panel.classList.remove('active');
    if (panel.dataset.panel === stepId) panel.classList.add('active');
  });
  
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
  
  elements.stepItems.forEach(item => {
    const step = item.dataset.step;
    let locked = false;
    
    switch (step) {
      case 'shoot': locked = false; break;
      case 'models': locked = !hasShoot; break;
      case 'clothing': locked = !hasModels; break;
      case 'generate': locked = !hasModels; break;
    }
    
    item.classList.toggle('locked', locked);
  });
  
  if (hasShoot) {
    elements.stepShootStatus.textContent = state.currentShoot.label;
    elements.stepShootStatus.className = 'step-status ready';
  } else {
    elements.stepShootStatus.textContent = 'Не выбрано';
    elements.stepShootStatus.className = 'step-status pending';
  }
  
  elements.stepModelsStatus.textContent = `${modelCount} / 3`;
  elements.stepModelsStatus.className = modelCount > 0 ? 'step-status ready' : 'step-status pending';
  
  elements.btnNextToModels.disabled = !hasShoot;
  elements.btnNextToClothing.disabled = !hasModels;
  elements.btnNextToFrames.disabled = !hasModels;
}

// ═══════════════════════════════════════════════════════════════
// SHOOTS (Step 1)
// ═══════════════════════════════════════════════════════════════

async function loadShoots() {
  try {
    const res = await fetchWithTimeout('/api/custom-shoots', {}, 15000);
    const data = await res.json();
    if (data.ok) {
      state.shoots = data.shoots || [];
    }
  } catch (e) {
    console.error('[Shoots] Load error:', e);
  }
  renderShootsList();
}

function renderShootsList() {
  if (state.shoots.length === 0) {
    elements.shootsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✨</div>
        <div class="empty-state-title">Нет съёмок</div>
        <div class="empty-state-text">Создайте первый Custom Shoot v5</div>
      </div>
    `;
    return;
  }
  
  elements.shootsList.innerHTML = state.shoots.map(shoot => `
    <div class="shoot-card ${state.currentShoot?.id === shoot.id ? 'selected' : ''}" data-shoot-id="${shoot.id}">
      <div class="shoot-card-icon">🧠</div>
      <div class="shoot-card-info">
        <div class="shoot-card-title">${escapeHtml(shoot.label)}</div>
        <div class="shoot-card-meta">${shoot.imageCount || 0} кадров</div>
      </div>
    </div>
  `).join('');
  
  elements.shootsList.querySelectorAll('.shoot-card').forEach(card => {
    card.addEventListener('click', () => selectShoot(card.dataset.shootId));
  });
}

async function createNewShoot() {
  const label = prompt('Название съёмки:', 'Custom Shoot v5');
  if (!label) return;
  
  try {
    const res = await fetchWithTimeout('/api/custom-shoots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, version: 'v5' })
    }, 5000);
    
    const data = await res.json();
    if (data.ok) {
      state.shoots.unshift({ id: data.shoot.id, label: data.shoot.label, imageCount: 0 });
      state.currentShoot = data.shoot;
      
      // Initialize V5 params with defaults
      state.v5Params = { ...state.v5Schema?.defaults };
      
      renderShootsList();
      updateStepStatuses();
      showToast('Съёмка создана!', 'success');
    }
  } catch (e) {
    console.error('[Shoots] Create error:', e);
    showToast('Ошибка создания съёмки', 'error');
  }
}

async function selectShoot(shootId) {
  try {
    const res = await fetchWithTimeout(`/api/custom-shoots/${shootId}`, {}, 5000);
    const data = await res.json();
    
    if (data.ok) {
      state.currentShoot = data.shoot;
      
      // Load V5 params from shoot
      if (data.shoot.v5Params) {
        state.v5Params = { ...state.v5Schema?.defaults, ...data.shoot.v5Params };
      } else {
        state.v5Params = { ...state.v5Schema?.defaults };
      }
      
      // Load other state
      loadShootState();
      renderShootsList();
      updateStepStatuses();
    }
  } catch (e) {
    console.error('[Shoots] Select error:', e);
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
  state.lookPrompts = ['', '', ''];
  
  if (state.currentShoot.clothing) {
    state.currentShoot.clothing.forEach(c => {
      if (c.forModelIndex >= 0 && c.forModelIndex < 3) {
        state.clothingByModel[c.forModelIndex] = c.items || [];
      }
    });
  }
  
  // Load generated frames
  state.generatedFrames = (state.currentShoot.generatedImages || []).map(img => ({
    ...img,
    status: 'ready'
  }));
  
  // Load locks
  state.styleLock = state.currentShoot.locks?.style || { enabled: false, mode: null };
}

// ═══════════════════════════════════════════════════════════════
// MODELS (Step 2) - Simplified for brevity
// ═══════════════════════════════════════════════════════════════

async function loadModels() {
  try {
    const res = await fetchWithTimeout('/api/models', {}, 10000);
    const data = await res.json();
    if (data.ok) {
      state.models = data.models || [];
    }
  } catch (e) {
    console.error('[Models] Load error:', e);
  }
}

function renderModelSlots() {
  // Simplified render
}

function renderAvailableModels() {
  elements.availableModels.style.display = 'block';
  
  if (state.models.length === 0) {
    elements.modelsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">👤</div>
        <div class="empty-state-title">Нет моделей</div>
        <div class="empty-state-text">Создайте модель в разделе Модели</div>
      </div>
    `;
    return;
  }
  
  elements.modelsGrid.innerHTML = state.models.map(model => {
    const isSelected = state.selectedModels.some(m => m?.id === model.id);
    const thumb = model.identityImages?.[0] || model.avatarUrl || '';
    
    return `
      <div class="model-selection-card ${isSelected ? 'selected' : ''}" data-model-id="${model.id}">
        <div class="model-selection-thumb" style="background-image: url('${thumb}')"></div>
        <div class="model-selection-info">
          <div class="model-selection-name">${escapeHtml(model.label)}</div>
        </div>
      </div>
    `;
  }).join('');
  
  elements.modelsGrid.querySelectorAll('.model-selection-card').forEach(card => {
    card.addEventListener('click', () => toggleModel(card.dataset.modelId));
  });
}

function toggleModel(modelId) {
  const model = state.models.find(m => m.id === modelId);
  if (!model) return;
  
  const existingIndex = state.selectedModels.findIndex(m => m?.id === modelId);
  
  if (existingIndex >= 0) {
    state.selectedModels[existingIndex] = null;
  } else {
    const emptySlot = state.selectedModels.findIndex(m => m === null);
    if (emptySlot >= 0) {
      state.selectedModels[emptySlot] = model;
    }
  }
  
  renderAvailableModels();
  renderModelSlots();
  updateStepStatuses();
}

// ═══════════════════════════════════════════════════════════════
// CLOTHING (Step 3) - Simplified
// ═══════════════════════════════════════════════════════════════

function renderClothingSections() {
  // Simplified for brevity
  elements.clothingSections.innerHTML = '<div style="padding: 20px; color: var(--color-text-muted);">Загрузка одежды...</div>';
}

// ═══════════════════════════════════════════════════════════════
// GENERATE PAGE (Step 4)
// ═══════════════════════════════════════════════════════════════

async function renderGeneratePage() {
  // Render V5 parameters UI
  renderV5ParametersUI();
  
  // Render vibe presets
  renderVibePresets();
  
  // Load locations and emotions
  await loadLocationsAndEmotions();
  
  // Render frames to generate
  renderFramesToGenerate();
  
  // Render gallery
  renderGeneratedImages();
  
  // Show prompt preview
  elements.narrativePreviewPanel.style.display = 'block';
  updatePromptPreview();
}

async function loadLocationsAndEmotions() {
  try {
    const [locRes, emoRes] = await Promise.all([
      fetchWithTimeout('/api/locations', {}, 5000),
      fetchWithTimeout('/api/emotions', {}, 5000)
    ]);
    
    const locData = await locRes.json();
    const emoData = await emoRes.json();
    
    if (locData.ok) {
      state.locations = locData.locations || [];
      populateSelect(elements.genLocation, state.locations, 'label');
    }
    
    if (emoData.ok) {
      state.emotions = emoData.emotions || [];
      populateSelect(elements.genEmotion, state.emotions, 'label');
    }
  } catch (e) {
    console.error('[Generate] Load locations/emotions error:', e);
  }
}

function populateSelect(select, items, labelKey) {
  if (!select) return;
  
  const currentValue = select.value;
  const firstOption = select.options[0];
  
  select.innerHTML = '';
  if (firstOption) select.appendChild(firstOption);
  
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item[labelKey] || item.id;
    if (item.id === currentValue) opt.selected = true;
    select.appendChild(opt);
  });
}

function renderFramesToGenerate() {
  elements.framesToGenerate.innerHTML = `
    <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h4 style="margin: 0; font-size: 14px;">🎬 Генерация кадра</h4>
        <button class="btn btn-primary btn-gen-frame" data-frame-id="">
          ⚡ Генерировать
        </button>
      </div>
      <div style="font-size: 13px; color: var(--color-text-muted);">
        Настройте параметры выше и нажмите "Генерировать" для создания изображения
      </div>
    </div>
  `;
}

function renderGeneratedImages() {
  if (state.generatedFrames.length === 0) {
    elements.imagesGallery.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 40px;">
        <div class="empty-state-icon">🎨</div>
        <div class="empty-state-title">Нет сгенерированных кадров</div>
        <div class="empty-state-text">Нажми "Генерировать" выше</div>
      </div>
    `;
    elements.generationCount.textContent = '0 изображений';
    return;
  }
  
  elements.generationCount.textContent = `${state.generatedFrames.length} изображений`;
  
  elements.imagesGallery.innerHTML = state.generatedFrames.map((frame, index) => `
    <div class="generated-image-card" data-index="${index}">
      <div class="image-thumb" style="position: relative;">
        <img src="${frame.dataUrl || frame.imageUrl}" alt="Generated" style="width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 8px;">
        <div class="image-actions" style="position: absolute; bottom: 8px; right: 8px; display: flex; gap: 4px;">
          <button class="btn btn-small btn-set-style-ref" data-image-id="${frame.id || index}" title="Установить как Style Lock">🎨</button>
          <button class="btn btn-small btn-open-lightbox" data-frame-index="${index}" title="Открыть">🔍</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateFrame() {
  if (state.isGenerating) {
    showToast('Генерация уже идёт...', 'info');
    return;
  }
  
  if (!state.currentShoot) {
    showToast('Сначала выберите съёмку', 'error');
    return;
  }
  
  state.isGenerating = true;
  showToast('Генерация началась...', 'info');
  
  try {
    // Prepare generation request
    const selectedModelIds = state.selectedModels.filter(m => m).map(m => m.id);
    
    const payload = {
      shootId: state.currentShoot.id,
      modelIds: selectedModelIds,
      
      // V5 universe params
      universeParams: {
        version: 'v5',
        ...state.v5Params
      },
      
      // Frame settings
      aspectRatio: elements.genAspectRatio?.value || '3:4',
      imageSize: elements.genImageSize?.value || '2K',
      
      // Location & Emotion
      locationId: elements.genLocation?.value || null,
      emotionId: elements.genEmotion?.value || null,
      
      // Composition
      composition: {
        shotSize: elements.genShotSize?.value || 'default',
        cameraAngle: elements.genCameraAngle?.value || 'eye_level'
      },
      
      // Extra
      extraPrompt: elements.genExtraPrompt?.value || '',
      poseAdherence: parseInt(elements.genPoseAdherence?.value) || 2,
      
      // Locks
      locks: {
        style: state.styleLock
      }
    };
    
    console.log('[Generate] Sending request:', payload);
    
    const res = await fetchWithTimeout('/api/custom-shoots/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 180000); // 3 minute timeout
    
    const data = await res.json();
    
    if (data.ok) {
      // Add to generated frames
      state.generatedFrames.unshift({
        id: data.imageId || `gen_${Date.now()}`,
        dataUrl: data.image?.dataUrl,
        imageUrl: data.image?.url,
        prompt: data.prompt,
        timestamp: new Date().toISOString(),
        status: 'ready'
      });
      
      renderGeneratedImages();
      showToast('Изображение сгенерировано!', 'success');
    } else {
      showToast(`Ошибка: ${data.error || 'Неизвестная ошибка'}`, 'error');
    }
  } catch (e) {
    console.error('[Generate] Error:', e);
    showToast(`Ошибка генерации: ${e.message}`, 'error');
  } finally {
    state.isGenerating = false;
  }
}

// ═══════════════════════════════════════════════════════════════
// STYLE LOCK
// ═══════════════════════════════════════════════════════════════

function setStyleLockMode(mode) {
  if (mode === 'off') {
    state.styleLock = { enabled: false, mode: null, imageId: null, imageUrl: null };
    elements.styleLockOff.classList.add('active');
    elements.styleLockStrict.classList.remove('active');
    elements.styleLockPreview.classList.remove('active');
  } else {
    if (!state.styleLock.imageUrl) {
      showToast('Сначала выберите изображение для Style Lock', 'error');
      return;
    }
    state.styleLock.enabled = true;
    state.styleLock.mode = mode;
    elements.styleLockOff.classList.remove('active');
    elements.styleLockStrict.classList.add('active');
    elements.styleLockPreview.classList.add('active');
  }
}

function setAsStyleRef(imageId) {
  const frame = state.generatedFrames.find((f, i) => f.id === imageId || i === parseInt(imageId));
  if (!frame) return;
  
  state.styleLock = {
    enabled: true,
    mode: 'strict',
    imageId: frame.id,
    imageUrl: frame.dataUrl || frame.imageUrl
  };
  
  elements.styleLockImg.src = state.styleLock.imageUrl;
  elements.styleLockPreview.classList.add('active');
  elements.styleLockOff.classList.remove('active');
  elements.styleLockStrict.classList.add('active');
  
  showToast('Style Lock установлен', 'success');
}

// ═══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════

function initEventListeners() {
  // Step navigation
  elements.stepItems.forEach(item => {
    item.addEventListener('click', () => {
      if (!item.classList.contains('locked')) {
        goToStep(item.dataset.step);
      }
    });
  });
  
  // Step 1
  elements.btnNewShoot.addEventListener('click', createNewShoot);
  elements.btnNextToModels.addEventListener('click', () => goToStep('models'));
  
  // Step 2
  elements.btnBackToShoot.addEventListener('click', () => goToStep('shoot'));
  elements.btnNextToClothing.addEventListener('click', () => goToStep('clothing'));
  
  // Step 3
  elements.btnBackToModels.addEventListener('click', () => goToStep('models'));
  elements.btnNextToFrames.addEventListener('click', () => goToStep('generate'));
  
  // Step 4
  elements.btnBackToFrames.addEventListener('click', () => goToStep('clothing'));
  elements.btnClearHistory.addEventListener('click', () => {
    if (confirm('Очистить историю генераций?')) {
      state.generatedFrames = [];
      renderGeneratedImages();
    }
  });
  
  // Fix all button
  elements.btnFixAll?.addEventListener('click', async () => {
    await applyV5Dependencies();
    await updateAllV5DisabledStates();
    showToast('Конфликты исправлены', 'success');
  });
  
  // Preview toggle
  elements.btnTogglePreview?.addEventListener('click', () => {
    const content = elements.narrativePreviewContent;
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    elements.btnTogglePreview.textContent = isHidden ? 'Свернуть' : 'Развернуть';
  });
  
  // Generation (delegated)
  elements.framesToGenerate.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-gen-frame');
    if (btn) {
      generateFrame();
    }
  });
  
  // Gallery actions (delegated)
  elements.imagesGallery.addEventListener('click', (e) => {
    const styleBtn = e.target.closest('.btn-set-style-ref');
    if (styleBtn) {
      setAsStyleRef(styleBtn.dataset.imageId);
    }
  });
  
  // Lock controls
  elements.styleLockOff?.addEventListener('click', () => setStyleLockMode('off'));
  elements.styleLockStrict?.addEventListener('click', () => setStyleLockMode('strict'));
  
  // Mode selector
  elements.modeOptions?.forEach(opt => {
    opt.addEventListener('click', () => {
      elements.modeOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      // Mode affects prompt style but we keep it simple for now
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

async function checkServerHealth() {
  try {
    const res = await fetchWithTimeout('/api/health', {}, 5000);
    const data = await res.json();
    
    if (data.ok) {
      elements.serverStatus.textContent = 'Сервер ОК';
      elements.serverStatus.closest('.status-badge').querySelector('.status-dot').style.background = '#10b981';
    }
  } catch (e) {
    elements.serverStatus.textContent = 'Сервер недоступен';
    elements.serverStatus.closest('.status-badge').querySelector('.status-dot').style.background = '#ef4444';
  }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

async function init() {
  console.log('[CustomShoot5] Initializing...');
  
  initElements();
  initEventListeners();
  
  // Check server
  await checkServerHealth();
  
  // Load V5 schema first
  await loadV5Schema();
  
  // Load data
  await Promise.all([
    loadShoots(),
    loadModels()
  ]);
  
  updateStepStatuses();
  
  console.log('[CustomShoot5] Ready!');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
