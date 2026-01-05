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
  modelPrompt: null,
  modelExpressions: null,
  modelPoses: null,
  btnGenerateAvatars: null,
  statusAvatars: null,
  avatarShotsPreview: null,
  collagePreview: null,
  collageImage: null,
  btnSave: null,
  btnClear: null,
  statusSave: null,
  modelList: null,
  serverStatus: null
};

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
  elements.modelPrompt = document.getElementById('model-prompt');
  elements.modelExpressions = document.getElementById('model-expressions');
  elements.modelPoses = document.getElementById('model-poses');
  elements.btnGenerateAvatars = document.getElementById('btn-generate-avatars');
  elements.statusAvatars = document.getElementById('status-avatars');
  elements.avatarShotsPreview = document.getElementById('avatar-shots-preview');
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
  elements.btnGenerateAvatars.addEventListener('click', generateAvatarShots);
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

function handleFiles(files) {
  const fileArray = Array.from(files).slice(0, 10);
  
  fileArray.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      uploadedImages.push({
        mimeType: file.type,
        base64,
        previewUrl: e.target.result
      });
      renderImagePreviews();
      updateButtonStates();
    };
    reader.readAsDataURL(file);
  });
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
  elements.modelPrompt.value = model.promptSnippet || '';
  elements.modelExpressions.value = model.faceExpressions || '';
  elements.modelPoses.value = model.poses || '';
}

// ═══════════════════════════════════════════════════════════════
// AVATAR SHOTS GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateAvatarShots() {
  if (uploadedImages.length === 0) {
    showStatus('statusAvatars', 'Сначала загрузите фотографии модели', 'error');
    return;
  }

  showStatus('statusAvatars', '🎭 Генерируем ракурсы (это может занять 1-2 минуты)...', 'loading');
  elements.btnGenerateAvatars.disabled = true;
  elements.avatarShotsPreview.innerHTML = '';
  elements.collagePreview.style.display = 'none';

  try {
    const response = await fetch(`${API_BASE}/generate-avatars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: uploadedImages.map(img => ({
          mimeType: img.mimeType,
          base64: img.base64
        })),
        extraPrompt: elements.modelHint.value.trim()
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Ошибка генерации ракурсов');
    }

    generatedAvatarShots = data.data.shots || [];
    generatedCollage = data.data.collage || null;

    // Render avatar shots
    renderAvatarShots();

    // Render collage
    if (generatedCollage && generatedCollage.dataUrl) {
      elements.collageImage.src = generatedCollage.dataUrl;
      elements.collagePreview.style.display = 'block';
    }

    const successCount = generatedAvatarShots.filter(s => s.status === 'ok').length;
    showStatus('statusAvatars', `✅ Сгенерировано ${successCount}/${generatedAvatarShots.length} ракурсов. Коллаж готов!`, 'success');

  } catch (error) {
    console.error('Generate avatars error:', error);
    showStatus('statusAvatars', `❌ Ошибка: ${error.message}`, 'error');
  } finally {
    elements.btnGenerateAvatars.disabled = false;
  }
}

function renderAvatarShots() {
  if (!generatedAvatarShots || generatedAvatarShots.length === 0) {
    elements.avatarShotsPreview.innerHTML = '';
    return;
  }

  elements.avatarShotsPreview.innerHTML = generatedAvatarShots.map((shot, index) => {
    if (shot.status === 'ok' && shot.imageDataUrl) {
      return `
        <div class="image-thumb" title="${shot.label}">
          <img src="${shot.imageDataUrl}" alt="${shot.label}">
        </div>
      `;
    } else {
      return `
        <div class="image-thumb" title="${shot.label}: ${shot.error || 'Ошибка'}" style="display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.15);">
          <span style="font-size: 24px;">❌</span>
        </div>
      `;
    }
  }).join('');
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
    const payload = isUpdate ? modelData : {
      ...modelData,
      images: uploadedImages.map(img => ({
        mimeType: img.mimeType,
        base64: img.base64
      }))
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
    promptSnippet: elements.modelPrompt.value.trim(),
    faceExpressions: elements.modelExpressions.value.trim(),
    poses: elements.modelPoses.value.trim()
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
  elements.modelPrompt.value = '';
  elements.modelExpressions.value = '';
  elements.modelPoses.value = '';
  elements.fileInput.value = '';
  elements.avatarShotsPreview.innerHTML = '';
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
  
  el.textContent = message;
  el.className = `status-message visible ${type}`;
}

function hideStatus(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  el.className = 'status-message';
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function checkServerStatus() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    
    if (data.ok) {
      elements.serverStatus.textContent = 'Сервер работает';
      elements.serverStatus.parentElement.classList.add('online');
    } else {
      throw new Error('Server not healthy');
    }
  } catch (error) {
    elements.serverStatus.textContent = 'Сервер недоступен';
    elements.serverStatus.parentElement.classList.add('offline');
  }
}

