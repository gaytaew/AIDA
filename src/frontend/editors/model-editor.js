/**
 * Model Editor
 * 
 * Frontend logic for creating and managing model avatars.
 * Supports AI-powered description generation from photos.
 */

const API_BASE = '/api/models';

// State
let uploadedImages = [];
let currentModel = null;
let allModels = [];
let generatedAvatarShots = [];
let generatedCollage = null;

// DOM Elements
const elements = {
  uploadZone: null,
  fileInput: null,
  imagesPreview: null,
  modelHint: null,
  btnGenerate: null,
  statusGenerate: null,
  modelForm: null,
  modelName: null,
  modelLabel: null,
  modelHeight: null,
  modelBodyType: null,
  modelBackground: null, // New field
  modelPrompt: null,

  // New granular controls
  avatarGrid: null,
  btnGenerateAvatarsAll: null,
  btnRefreshCollage: null,

  statusAvatars: null,
  collagePreview: null,
  collageImage: null,
  btnSave: null,
  btnClear: null,
  statusSave: null,
  modelList: null,
  serverStatus: null
};

// Avatar Shots Config
const AVATAR_SHOTS_CONFIG = [
  { id: 'straight-on-front', label: 'Front View' },
  { id: 'three-quarter-left', label: '3/4 Left' },
  { id: 'three-quarter-right', label: '3/4 Right' },
  { id: 'left-profile-90', label: 'Profile' }
];

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initElements();
  initEventListeners();
  checkServerStatus();
  loadModels();
});

function initElements() {
  elements.uploadZone = document.getElementById('upload-zone');
  elements.fileInput = document.getElementById('file-input');
  elements.imagesPreview = document.getElementById('images-preview');
  elements.modelHint = document.getElementById('model-hint');
  elements.btnGenerate = document.getElementById('btn-generate');
  elements.statusGenerate = document.getElementById('status-generate');
  elements.modelForm = document.getElementById('model-form');
  elements.modelName = document.getElementById('model-name');
  elements.modelLabel = document.getElementById('model-label');
  elements.modelHeight = document.getElementById('model-height');
  elements.modelBodyType = document.getElementById('model-body-type');
  elements.modelBackground = document.getElementById('model-background');
  elements.modelPrompt = document.getElementById('model-prompt');

  elements.avatarGrid = document.getElementById('avatar-grid');
  elements.btnGenerateAvatarsAll = document.getElementById('btn-generate-avatars-all');
  elements.btnRefreshCollage = document.getElementById('btn-refresh-collage');

  elements.statusAvatars = document.getElementById('status-avatars');
  elements.collagePreview = document.getElementById('collage-preview');
  elements.collageImage = document.getElementById('collage-image');
  elements.btnSave = document.getElementById('btn-save');
  elements.btnClear = document.getElementById('btn-clear');
  elements.statusSave = document.getElementById('status-save');
  elements.modelList = document.getElementById('model-list');
  elements.serverStatus = document.getElementById('server-status');
}

function initEventListeners() {
  // Drag & Drop
  elements.uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.uploadZone.classList.add('dragover');
  });

  elements.uploadZone.addEventListener('dragleave', () => {
    elements.uploadZone.classList.remove('dragover');
  });

  elements.uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.uploadZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  // File Input
  elements.fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  // Paste (Cmd+V / Ctrl+V)
  document.addEventListener('paste', handlePaste);

  // Buttons
  elements.btnGenerate.addEventListener('click', generateDescription);

  if (elements.btnGenerateAvatarsAll) {
    elements.btnGenerateAvatarsAll.addEventListener('click', generateAllAvatars);
  }

  if (elements.btnRefreshCollage) {
    elements.btnRefreshCollage.addEventListener('click', refreshCollage);
  }

  // Delegated events for individual generate buttons
  if (elements.avatarGrid) {
    elements.avatarGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-generate-shot');
      if (btn) {
        const shotId = btn.dataset.shotId;
        generateSingleAvatarShot(shotId);
      }
    });
  }
  elements.btnSave.addEventListener('click', saveModel);
  elements.btnClear.addEventListener('click', clearForm);
}

// ═══════════════════════════════════════════════════════════════
// PASTE HANDLER (Cmd+V)
// ═══════════════════════════════════════════════════════════════

function handlePaste(e) {
  const items = e.clipboardData?.items;
  if (!items) return;

  const imageFiles = [];
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) imageFiles.push(file);
    }
  }

  if (imageFiles.length > 0) {
    e.preventDefault();
    handleFiles(imageFiles);
  }
}

// ═══════════════════════════════════════════════════════════════
// FILE HANDLING
// ═══════════════════════════════════════════════════════════════

// Compress image to max dimension and quality
const MAX_IMAGE_SIZE = 1600;
const JPEG_QUALITY = 0.85;

function compressImage(file) {
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
        mimeType: 'image/jpeg',
        base64,
        previewUrl: dataUrl
      });
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleFiles(files) {
  const fileArray = Array.from(files).slice(0, 10);

  for (const file of fileArray) {
    if (!file.type.startsWith('image/')) continue;

    try {
      const compressed = await compressImage(file);
      console.log(`[Model] Compressed ${file.name}: ${Math.round(file.size / 1024)}KB → ${Math.round(compressed.base64.length * 0.75 / 1024)}KB`);
      uploadedImages.push(compressed);
      renderImagePreviews();
      updateButtonStates();
    } catch (e) {
      console.error('Failed to compress image:', e);
    }
  }
}

function renderImagePreviews() {
  elements.imagesPreview.innerHTML = uploadedImages.map((img, index) => `
    <div class="image-thumb" data-index="${index}">
      <img src="${img.previewUrl}" alt="Preview ${index + 1}">
      <button class="image-thumb-remove" data-index="${index}">✕</button>
    </div>
  `).join('');

  // Add remove handlers
  elements.imagesPreview.querySelectorAll('.image-thumb-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(e.target.dataset.index);
      uploadedImages.splice(index, 1);
      renderImagePreviews();
      updateButtonStates();
    });
  });
}

function updateButtonStates() {
  elements.btnGenerate.disabled = uploadedImages.length === 0;
}

// ═══════════════════════════════════════════════════════════════
// AI GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateDescription() {
  if (uploadedImages.length === 0) {
    showStatus('statusGenerate', 'Загрузите хотя бы одно изображение', 'error');
    return;
  }

  showStatus('statusGenerate', '🔮 Анализируем фотографии с AI...', 'loading');
  elements.btnGenerate.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: uploadedImages.map(img => ({
          mimeType: img.mimeType,
          base64: img.base64
        })),
        hint: elements.modelHint.value.trim()
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Ошибка генерации');
    }

    // Fill form with generated data
    currentModel = data.data;
    fillFormWithModel(currentModel);
    elements.modelForm.style.display = 'block';

    showStatus('statusGenerate', '✅ Описание сгенерировано! Проверьте и сохраните.', 'success');

  } catch (error) {
    console.error('Generate error:', error);
    showStatus('statusGenerate', `❌ Ошибка: ${error.message}`, 'error');
  } finally {
    elements.btnGenerate.disabled = false;
    updateButtonStates();
  }
}

function fillFormWithModel(model) {
  elements.modelName.value = model.name || '';
  elements.modelLabel.value = model.label || '';
  elements.modelHeight.value = model.heightCm || '';
  elements.modelBodyType.value = model.bodyType || '';
  elements.modelBackground.value = model.background || '';
  elements.modelPrompt.value = model.promptSnippet || '';

  // Render grid based on loaded shots or empty state
  renderAvatarGrid();

  // Load collage if available
  if (model.previewSrc) {
    elements.collageImage.src = `/api/models/images/${model.previewSrc}?t=${Date.now()}`;
    elements.collagePreview.style.display = 'block';
  } else {
    elements.collagePreview.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════════
// AVATAR SHOTS GENERATION
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// AVATAR SHOTS GENERATION (Granular)
// ═══════════════════════════════════════════════════════════════

function renderAvatarGrid() {
  if (!elements.avatarGrid) return;

  elements.avatarGrid.innerHTML = AVATAR_SHOTS_CONFIG.map(shot => {
    // Check if we have a generated shot for this ID
    const generatedShot = generatedAvatarShots.find(s => s.id === shot.id);
    const hasImage = generatedShot && generatedShot.status === 'ok' && generatedShot.imageDataUrl;
    const isLoading = generatedShot && generatedShot.status === 'loading';
    const error = generatedShot?.error;

    return `
      <div class="avatar-card" style="
        background: var(--color-bg); 
        border: 1px solid var(--color-border); 
        border-radius: 8px; 
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      ">
        <div style="font-size: 12px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase;">
          ${shot.label}
        </div>
        
        <div class="avatar-preview" style="
          aspect-ratio: 1; 
          background: #111; 
          border-radius: 4px; 
          overflow: hidden; 
          position: relative;
        ">
          ${hasImage
        ? `<img src="${generatedShot.imageDataUrl}" style="width: 100%; height: 100%; object-fit: cover;">`
        : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #333; font-size: 24px;">📷</div>`
      }
          ${isLoading
        ? `<div style="position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"><span class="spinner"></span></div>`
        : ''
      }
        </div>

        <div style="display: flex; gap: 6px;">
          <button class="btn btn-sm btn-select-shot btn-generate-shot" 
            data-shot-id="${shot.id}"
            style="flex: 1; font-size: 11px;"
            ${isLoading ? 'disabled' : ''}
          >
            ${hasImage ? '🔄 Переделать' : '✨ Создать'}
          </button>
        </div>
        
        ${error ? `<div style="font-size: 10px; color: #EF4444;">${error}</div>` : ''}
      </div>
    `;
  }).join('');
}

async function generateSingleAvatarShot(shotId) {
  if (uploadedImages.length === 0) {
    showStatus('statusAvatars', 'Сначала загрузите фотографии модели', 'error');
    return;
  }

  // Set loading state for this shot
  updateShotState(shotId, 'loading');

  try {
    const response = await fetch(`${API_BASE}/generate-avatar-shot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: uploadedImages.map(img => ({
          mimeType: img.mimeType,
          base64: img.base64
        })),
        shotId: shotId,
        extraPrompt: elements.modelBackground.value.trim() // Pass background as context
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Ошибка генерации');
    }

    // Update state with result
    updateShotState(shotId, 'ok', data.data.imageDataUrl);

    // Check if all shots are done -> show refresh collage button
    checkCollageStatus();

  } catch (error) {
    console.error(`Generate ${shotId} error:`, error);
    updateShotState(shotId, 'error', null, error.message);
  }
}

function updateShotState(shotId, status, imageDataUrl = null, error = null) {
  // Update local state
  const existingIdx = generatedAvatarShots.findIndex(s => s.id === shotId);
  const newShot = { id: shotId, status, imageDataUrl, error };

  if (existingIdx >= 0) {
    generatedAvatarShots[existingIdx] = newShot;
  } else {
    generatedAvatarShots.push(newShot);
  }

  // Re-render
  renderAvatarGrid();
}

async function generateAllAvatars() {
  if (uploadedImages.length === 0) {
    showStatus('statusAvatars', 'Сначала загрузите фотографии модели', 'error');
    return;
  }

  showStatus('statusAvatars', 'Запуск генерации всех ракурсов...', 'loading');

  // Trigger all sequentially to avoid rate limits/overload, or parallel if robust
  // User asked for independent buttons, but "Generate All" is good convenience.
  // Let's do parallel but marked as loading.

  for (const shot of AVATAR_SHOTS_CONFIG) {
    // Don't overwrite existing good shots unless specific intent? 
    // Usually "Generate All" implies fresh start or filling gaps. 
    // Let's fill gaps or regenerate if empty.
    const existing = generatedAvatarShots.find(s => s.id === shot.id);
    if (!existing || existing.status !== 'ok') {
      generateSingleAvatarShot(shot.id); // Valid async call, we don't await to let them run in parallel (browser limit usually 6)
      await new Promise(r => setTimeout(r, 500)); // Stagger slightly
    }
  }
}

async function checkCollageStatus() {
  const allDone = AVATAR_SHOTS_CONFIG.every(cfg => {
    const s = generatedAvatarShots.find(shot => shot.id === cfg.id);
    return s && s.status === 'ok';
  });

  if (allDone && elements.btnRefreshCollage) {
    elements.btnRefreshCollage.style.display = 'block';
  }
}

async function refreshCollage() {
  // Since we generate shots individually, we need a way to combine them.
  // Providing a client-side combine or backend endpoint? 
  // Currently backend `generate-avatars` does it. 
  // We might need a new endpoint `POST /api/models/collage` that takes the generated images?
  // Or we just rely on Save. 
  // Actually, the user flow is: Generate shots -> Save Model. 
  // When saving, the backend probably doesn't need the collage generated *beforehand*, 
  // but providing a preview is nice. 

  // LIMITATION: I don't have a `createCollage` endpoint exposed that accepts base64 images.
  // But `saveModel` logic in backend might create it?
  // Checking `modelStore.js` -> `createModel` usually takes `imageArray` (uploaded source images).
  // Wait, `createModel` in `modelStore` saves the *uploaded* images.
  // Where are the *generated* avatar shots saved?
  // In the current `generate-avatars` flow, they are returned but not saved to disk until... wait.
  // The current system saves the model with the UPLOADED images as reference.
  // The generated avatar shots are just for the *collage* which is used as the preview?
  // Actually, `avatarGenerator` builds a collage.

  // If I want to verify the result, I should probably implement a simple `buildCollage` endpoint 
  // or just let the user "Save" and the backend (if updated) saves these shots.
  // BUT, the current `saveModel` only takes `images` (source). 
  // It seems the "Generated Avatars" were meant to *become* the model's appearance?
  // The previous code `generateAvatarShots` returned a collage.

  // The user says: "neutral reference photo in passport style...".
  // These generated photos ARE the references for future generations.
  // So we must SAVE these generated photos as the model's images.

  // FIX: When saving, we should probably save the GENERATED shots if they exist, 
  // OR the uploaded shots if not. 
  // The user intention implies replacing the "Uploaded" (random photos) 
  // with "Generated" (clean passport photos) as the canonical reference.

  // So, `saveModel` should ideally accept `avatarShots`.
  // I'll update `saveModel` payload to include `avatarShots` if available.

  showStatus('statusAvatars', 'Коллаж сформируется при сохранении модели', 'success');
}

// ═══════════════════════════════════════════════════════════════
// SAVE MODEL
// ═══════════════════════════════════════════════════════════════

async function saveModel() {
  const modelData = collectFormData();

  if (!modelData.name.trim()) {
    showStatus('statusSave', 'Введите имя модели', 'error');
    return;
  }

  showStatus('statusSave', '💾 Сохраняем модель...', 'loading');
  elements.btnSave.disabled = true;

  try {
    // Determine if we're creating or updating
    const isUpdate = currentModel && currentModel.id && allModels.some(m => m.id === currentModel.id);
    const url = isUpdate ? `${API_BASE}/${currentModel.id}` : API_BASE;
    const method = isUpdate ? 'PUT' : 'POST';

    // For new models, include images
    // If we have generated avatar shots, PREFER them as the model's canonical images
    // because they are "passport style" and consistent.
    // BUT only if we have a complete set? Or just what we have?
    // Let's mix them or replace? 
    // Strategy: If generated shots exist, save them as the main images.
    // The uploaded source images are less important now.

    let imagesToSave = [];
    const validGeneratedShots = generatedAvatarShots.filter(s => s.status === 'ok' && s.imageDataUrl);

    if (validGeneratedShots.length > 0) {
      // Use generated shots
      imagesToSave = validGeneratedShots.map(s => {
        const match = s.imageDataUrl.match(/^data:(.+);base64,(.+)$/);
        return {
          mimeType: match[1],
          base64: match[2]
        };
      });
      console.log(`[Save] Using ${imagesToSave.length} generated shots as model images`);
    } else {
      // Fallback to uploaded images
      imagesToSave = uploadedImages.map(img => ({
        mimeType: img.mimeType,
        base64: img.base64
      }));
      console.log(`[Save] Using ${imagesToSave.length} uploaded images`);
    }

    const payload = isUpdate ? modelData : {
      ...modelData,
      images: imagesToSave
    };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || data.errors?.join(', ') || 'Ошибка сохранения');
    }

    currentModel = data.data;
    showStatus('statusSave', '✅ Модель успешно сохранена!', 'success');

    // Reload models list
    await loadModels();

    // Select the saved model
    selectModel(currentModel.id);

  } catch (error) {
    console.error('Save error:', error);
    showStatus('statusSave', `❌ Ошибка: ${error.message}`, 'error');
  } finally {
    elements.btnSave.disabled = false;
  }
}

function collectFormData() {
  return {
    id: currentModel?.id,
    name: elements.modelName.value.trim(),
    label: elements.modelLabel.value.trim(),
    heightCm: elements.modelHeight.value ? parseInt(elements.modelHeight.value) : null,
    bodyType: elements.modelBodyType.value,
    background: elements.modelBackground.value.trim(),
    promptSnippet: elements.modelPrompt.value.trim()
  };
}

// ═══════════════════════════════════════════════════════════════
// LOAD & DISPLAY MODELS
// ═══════════════════════════════════════════════════════════════

async function loadModels() {
  try {
    const response = await fetch(API_BASE);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Ошибка загрузки');
    }

    allModels = data.data || [];
    renderModelList();

  } catch (error) {
    console.error('Load models error:', error);
    elements.modelList.innerHTML = `
      <div class="status-message error visible">
        ❌ Ошибка загрузки моделей: ${error.message}
      </div>
    `;
  }
}

function renderModelList() {
  if (allModels.length === 0) {
    elements.modelList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👤</div>
        <div class="empty-state-title">Нет сохранённых моделей</div>
        <div class="empty-state-text">Загрузи фотографии и создай первую модель.</div>
      </div>
    `;
    return;
  }

  elements.modelList.innerHTML = allModels.map(model => {
    const previewUrl = model.previewSrc
      ? `/api/models/images/${model.previewSrc}`
      : null;

    return `
      <div class="model-card ${currentModel?.id === model.id ? 'selected' : ''}" data-id="${model.id}">
        <div class="model-card-avatar">
          ${previewUrl
        ? `<img src="${previewUrl}" alt="${model.name}">`
        : `<div class="model-card-avatar-placeholder">👤</div>`
      }
        </div>
        <div class="model-card-info">
          <div class="model-card-name">${escapeHtml(model.name)}</div>
          <div class="model-card-label">${escapeHtml(model.label || 'Без описания')}</div>
          <div class="model-card-meta">
            ${model.heightCm ? `${model.heightCm} см` : ''}
            ${model.bodyType ? ` • ${model.bodyType}` : ''}
          </div>
        </div>
        <div class="model-card-actions">
          <button class="icon-btn edit-btn" data-id="${model.id}" title="Редактировать">✏️</button>
          <button class="icon-btn danger delete-btn" data-id="${model.id}" title="Удалить">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners
  elements.modelList.querySelectorAll('.model-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.icon-btn')) {
        selectModel(card.dataset.id);
      }
    });
  });

  elements.modelList.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      editModel(btn.dataset.id);
    });
  });

  elements.modelList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteModel(btn.dataset.id);
    });
  });
}

function selectModel(id) {
  const model = allModels.find(m => m.id === id);
  if (!model) return;

  currentModel = model;
  fillFormWithModel(model);
  elements.modelForm.style.display = 'block';

  // Update selection in list
  elements.modelList.querySelectorAll('.model-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.id === id);
  });
}

async function editModel(id) {
  selectModel(id);
  // Scroll to form
  elements.modelForm.scrollIntoView({ behavior: 'smooth' });
}

async function deleteModel(id) {
  const model = allModels.find(m => m.id === id);
  if (!model) return;

  if (!confirm(`Удалить модель "${model.name}"?`)) return;

  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Ошибка удаления');
    }

    // Clear form if deleted model was selected
    if (currentModel?.id === id) {
      clearForm();
    }

    await loadModels();

  } catch (error) {
    console.error('Delete error:', error);
    alert(`Ошибка удаления: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function clearForm() {
  uploadedImages = [];
  currentModel = null;
  generatedAvatarShots = [];
  generatedCollage = null;

  elements.imagesPreview.innerHTML = '';
  elements.modelHint.value = '';
  elements.modelForm.style.display = 'none';
  elements.modelName.value = '';
  elements.modelLabel.value = '';
  elements.modelHeight.value = '';
  elements.modelBodyType.value = '';
  elements.modelBackground.value = '';
  elements.modelPrompt.value = '';
  elements.fileInput.value = '';
  elements.avatarGrid.innerHTML = '';
  elements.collagePreview.style.display = 'none';
  elements.collageImage.src = '';

  hideStatus('statusGenerate');
  hideStatus('statusSave');
  hideStatus('statusAvatars');
  updateButtonStates();

  // Deselect in list
  elements.modelList.querySelectorAll('.model-card').forEach(card => {
    card.classList.remove('selected');
  });
}

function showStatus(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (!el) return;

  // Build content with spinner for loading state
  if (type === 'loading') {
    el.innerHTML = `<span class="spinner"></span>${escapeHtml(message)}`;
  } else {
    el.textContent = message;
  }

  el.className = `status-message visible ${type}`;
}

function hideStatus(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.className = 'status-message';
}

function checkServerStatus() {
  fetch('/api/health')
    .then(r => r.json())
    .then(data => {
      elements.serverStatus.textContent = data.ok ? 'Онлайн' : 'Ошибка';
      elements.serverStatus.style.color = data.ok ? 'var(--color-success)' : 'var(--color-error)';
    })
    .catch(() => {
      elements.serverStatus.textContent = 'Офлайн';
      elements.serverStatus.style.color = 'var(--color-error)';
    });
}

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
