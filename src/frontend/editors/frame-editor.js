/**
 * Frame Editor
 * 
 * Handles frame creation, editing, and gallery management.
 * Three modes: Manual, From Sketch (AI), From Text (AI)
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let frameOptions = null;
let savedFrames = [];
let currentFrame = null;
let sketchImage = null; // { file, dataUrl, mimeType, base64 }

// ═══════════════════════════════════════════════════════════════
// ELEMENTS
// ═══════════════════════════════════════════════════════════════

function getElements() {
  return {
    // Tabs
    tabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Manual form
    frameForm: document.getElementById('frame-form'),
    labelInput: document.getElementById('frame-label'),
    shotSizeSelect: document.getElementById('frame-shot-size'),
    cameraAngleSelect: document.getElementById('frame-camera-angle'),
    poseTypeSelect: document.getElementById('frame-pose-type'),
    compositionSelect: document.getElementById('frame-composition'),
    categorySelect: document.getElementById('frame-category'),
    orientationSelect: document.getElementById('frame-orientation'),
    focusInput: document.getElementById('frame-focus'),
    poseDescTextarea: document.getElementById('frame-pose-desc'),
    descriptionTextarea: document.getElementById('frame-description'),
    promptPreview: document.getElementById('prompt-preview'),
    promptText: document.getElementById('prompt-text'),
    btnClearForm: document.getElementById('btn-clear-form'),
    
    // From sketch
    sketchUploadZone: document.getElementById('sketch-upload-zone'),
    sketchFileInput: document.getElementById('sketch-file-input'),
    sketchPreview: document.getElementById('sketch-preview'),
    sketchPreviewImg: document.getElementById('sketch-preview-img'),
    sketchRemove: document.getElementById('sketch-remove'),
    btnAnalyzeSketch: document.getElementById('btn-analyze-sketch'),
    
    // From text
    textDescription: document.getElementById('text-description'),
    textShotSize: document.getElementById('text-shot-size'),
    textPoseType: document.getElementById('text-pose-type'),
    btnGenerateSketch: document.getElementById('btn-generate-sketch'),
    generatedSketch: document.getElementById('generated-sketch'),
    generatedSketchImg: document.getElementById('generated-sketch-img'),
    
    // Gallery
    filterCategory: document.getElementById('filter-category'),
    filterSearch: document.getElementById('filter-search'),
    framesGallery: document.getElementById('frames-gallery'),
    
    // Status
    status: document.getElementById('status'),
    statusText: document.getElementById('status-text')
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToBase64(dataUrl) {
  const parts = dataUrl.split(',');
  return parts.length === 2 ? parts[1] : '';
}

function getMimeType(dataUrl) {
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'image/jpeg';
}

function showStatus(message, type = 'loading') {
  const { status } = getElements();
  
  // Build content with spinner for loading state
  if (type === 'loading') {
    status.innerHTML = `<span class="spinner"></span>${escapeHtml(message)}`;
  } else {
    status.textContent = message;
  }
  
  status.className = `status-message ${type}`;
  status.style.display = 'block';
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hideStatus() {
  const { status } = getElements();
  status.style.display = 'none';
}

function formatOptionLabel(value) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

async function loadOptions() {
  try {
    const res = await fetch('/api/frames/options');
    const data = await res.json();
    if (data.ok) {
      frameOptions = data.data;
      populateSelects();
    }
  } catch (e) {
    console.error('Failed to load options:', e);
  }
}

function populateSelects() {
  const els = getElements();
  
  // Shot size
  populateSelect(els.shotSizeSelect, frameOptions.shotSize);
  populateSelect(els.textShotSize, frameOptions.shotSize);
  
  // Camera angle
  populateSelect(els.cameraAngleSelect, frameOptions.cameraAngle);
  
  // Pose type
  populateSelect(els.poseTypeSelect, frameOptions.poseType);
  populateSelect(els.textPoseType, frameOptions.poseType);
  
  // Composition
  populateSelect(els.compositionSelect, frameOptions.composition);
  
  // Category
  populateSelect(els.categorySelect, frameOptions.categories);
  populateSelect(els.filterCategory, frameOptions.categories, true);
  
  // Orientation
  populateSelect(els.orientationSelect, frameOptions.orientation);
}

function populateSelect(select, options, addAll = false) {
  if (!select || !options) return;
  
  if (addAll) {
    select.innerHTML = '<option value="">Все категории</option>';
  } else {
    select.innerHTML = '';
  }
  
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = formatOptionLabel(opt);
    select.appendChild(option);
  });
}

// ═══════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════

function initTabs() {
  const { tabs, tabContents } = getElements();
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// MANUAL FORM
// ═══════════════════════════════════════════════════════════════

function initManualForm() {
  const els = getElements();
  
  // Form submit
  els.frameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveFrame();
  });
  
  // Clear form
  els.btnClearForm.addEventListener('click', () => {
    clearForm();
  });
  
  // Update prompt preview on change
  const formInputs = [
    els.shotSizeSelect, els.cameraAngleSelect, els.poseTypeSelect,
    els.compositionSelect, els.focusInput, els.poseDescTextarea, els.descriptionTextarea
  ];
  
  formInputs.forEach(input => {
    if (input) {
      input.addEventListener('change', updatePromptPreview);
      input.addEventListener('input', updatePromptPreview);
    }
  });
}

function updatePromptPreview() {
  const els = getElements();
  const parts = [];
  
  // Shot size
  const shotSize = els.shotSizeSelect.value;
  if (shotSize) {
    const sizeMap = {
      extreme_close_up: 'extreme close-up shot',
      close_up: 'close-up shot',
      medium_close: 'medium close-up shot',
      medium: 'medium shot',
      medium_full: 'three-quarter shot',
      full_body: 'full body shot',
      wide: 'wide shot',
      extreme_wide: 'extreme wide shot'
    };
    parts.push(sizeMap[shotSize] || formatOptionLabel(shotSize));
  }
  
  // Camera angle
  const angle = els.cameraAngleSelect.value;
  if (angle && angle !== 'eye_level') {
    parts.push(formatOptionLabel(angle).toLowerCase());
  }
  
  // Pose type
  const poseType = els.poseTypeSelect.value;
  if (poseType && poseType !== 'static') {
    parts.push(formatOptionLabel(poseType).toLowerCase() + ' pose');
  }
  
  // Pose description
  const poseDesc = els.poseDescTextarea.value.trim();
  if (poseDesc) {
    parts.push(poseDesc);
  }
  
  // Focus point
  const focus = els.focusInput.value.trim();
  if (focus) {
    parts.push(`focus on ${focus}`);
  }
  
  // Description
  const desc = els.descriptionTextarea.value.trim();
  if (desc) {
    parts.push(desc);
  }
  
  const prompt = parts.join(', ');
  els.promptText.textContent = prompt || 'Заполни форму для генерации prompt snippet';
  els.promptPreview.style.display = 'block';
}

function clearForm() {
  const els = getElements();
  
  els.labelInput.value = '';
  els.shotSizeSelect.selectedIndex = 0;
  els.cameraAngleSelect.selectedIndex = 0;
  els.poseTypeSelect.selectedIndex = 0;
  els.compositionSelect.selectedIndex = 0;
  els.categorySelect.selectedIndex = 0;
  els.orientationSelect.selectedIndex = 0;
  els.focusInput.value = '';
  els.poseDescTextarea.value = '';
  els.descriptionTextarea.value = '';
  
  currentFrame = null;
  els.promptPreview.style.display = 'none';
  hideStatus();
}

async function saveFrame() {
  const els = getElements();
  
  const label = els.labelInput.value.trim();
  if (!label) {
    showStatus('Введите название кадра', 'error');
    return;
  }
  
  const frameData = {
    label,
    category: els.categorySelect.value,
    description: els.descriptionTextarea.value.trim(),
    technical: {
      shotSize: els.shotSizeSelect.value,
      cameraAngle: els.cameraAngleSelect.value,
      poseType: els.poseTypeSelect.value,
      composition: els.compositionSelect.value,
      orientation: els.orientationSelect.value,
      focusPoint: els.focusInput.value.trim(),
      poseDescription: els.poseDescTextarea.value.trim()
    }
  };
  
  // Add sketch if available
  if (sketchImage) {
    frameData.sketchAsset = {
      assetId: `sketch_${Date.now()}`,
      url: sketchImage.dataUrl
    };
  }
  
  showStatus('💾 Сохраняю кадр...', 'loading');
  
  try {
    const method = currentFrame ? 'PUT' : 'POST';
    const url = currentFrame ? `/api/frames/${currentFrame.id}` : '/api/frames';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(frameData)
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.ok) {
      throw new Error(data.errors?.join(', ') || data.error || 'Failed to save');
    }
    
    showStatus('✅ Кадр сохранён!', 'success');
    setTimeout(hideStatus, 2000);
    
    await loadFrames();
    clearForm();
    
  } catch (e) {
    console.error('Save error:', e);
    showStatus(`❌ Ошибка: ${e.message}`, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
// FROM SKETCH (AI Analysis)
// ═══════════════════════════════════════════════════════════════

function initSketchUpload() {
  const els = getElements();
  
  els.sketchFileInput.addEventListener('change', async (e) => {
    if (e.target.files && e.target.files[0]) {
      await loadSketchFile(e.target.files[0]);
    }
    e.target.value = '';
  });
  
  // Drag & drop
  ['dragenter', 'dragover'].forEach(evt => {
    els.sketchUploadZone.addEventListener(evt, (e) => {
      e.preventDefault();
      els.sketchUploadZone.classList.add('dragover');
    });
  });
  
  ['dragleave', 'dragend'].forEach(evt => {
    els.sketchUploadZone.addEventListener(evt, (e) => {
      e.preventDefault();
      els.sketchUploadZone.classList.remove('dragover');
    });
  });
  
  els.sketchUploadZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    els.sketchUploadZone.classList.remove('dragover');
    if (e.dataTransfer?.files?.[0]) {
      await loadSketchFile(e.dataTransfer.files[0]);
    }
  });
  
  // Remove sketch
  els.sketchRemove.addEventListener('click', () => {
    sketchImage = null;
    els.sketchPreview.style.display = 'none';
    els.sketchUploadZone.style.display = 'block';
    els.btnAnalyzeSketch.disabled = true;
  });
  
  // Paste (Cmd+V / Ctrl+V)
  document.addEventListener('paste', async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await loadSketchFile(file);
          break;
        }
      }
    }
  });
  
  // Analyze button
  els.btnAnalyzeSketch.addEventListener('click', analyzeSketch);
}

async function loadSketchFile(file) {
  const els = getElements();
  
  if (!file.type.startsWith('image/')) return;
  
  try {
    const dataUrl = await readFileAsDataURL(file);
    sketchImage = {
      file,
      dataUrl,
      mimeType: getMimeType(dataUrl),
      base64: dataUrlToBase64(dataUrl)
    };
    
    els.sketchPreviewImg.src = dataUrl;
    els.sketchPreview.style.display = 'block';
    els.sketchUploadZone.style.display = 'none';
    els.btnAnalyzeSketch.disabled = false;
  } catch (e) {
    console.error('Failed to load sketch:', e);
  }
}

async function analyzeSketch() {
  if (!sketchImage) return;
  
  const els = getElements();
  els.btnAnalyzeSketch.disabled = true;
  showStatus('🔍 Анализирую скетч с помощью AI...', 'loading');
  
  try {
    const res = await fetch('/api/frames/analyze-sketch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: {
          mimeType: sketchImage.mimeType,
          base64: sketchImage.base64
        }
      })
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Analysis failed');
    }
    
    // Fill form with analyzed data
    fillFormFromAnalysis(data.data);
    
    // Switch to manual tab
    document.querySelector('[data-tab="manual"]').click();
    
    showStatus('✅ Скетч проанализирован! Проверь параметры и сохрани.', 'success');
    
  } catch (e) {
    console.error('Analyze error:', e);
    showStatus(`❌ Ошибка: ${e.message}`, 'error');
  } finally {
    els.btnAnalyzeSketch.disabled = false;
  }
}

function fillFormFromAnalysis(result) {
  const els = getElements();
  
  if (result.label) els.labelInput.value = result.label;
  if (result.description) els.descriptionTextarea.value = result.description;
  
  if (result.technical) {
    const t = result.technical;
    if (t.shotSize) els.shotSizeSelect.value = t.shotSize;
    if (t.cameraAngle) els.cameraAngleSelect.value = t.cameraAngle;
    if (t.poseType) els.poseTypeSelect.value = t.poseType;
    if (t.composition) els.compositionSelect.value = t.composition;
    if (t.focusPoint) els.focusInput.value = t.focusPoint;
    if (t.poseDescription) els.poseDescTextarea.value = t.poseDescription;
  }
  
  // If we have a generated sketch, store it for saving
  if (result.generatedSketch && result.generatedSketch.base64) {
    const dataUrl = `data:${result.generatedSketch.mimeType || 'image/png'};base64,${result.generatedSketch.base64}`;
    sketchImage = {
      dataUrl,
      mimeType: result.generatedSketch.mimeType || 'image/png',
      base64: result.generatedSketch.base64
    };
    
    // Show the generated sketch in the "From Text" tab preview area
    els.generatedSketchImg.src = dataUrl;
    els.generatedSketch.style.display = 'block';
  }
  
  updatePromptPreview();
}

// ═══════════════════════════════════════════════════════════════
// FROM TEXT (AI Generation)
// ═══════════════════════════════════════════════════════════════

function initTextGeneration() {
  const els = getElements();
  
  els.btnGenerateSketch.addEventListener('click', generateSketch);
}

async function generateSketch() {
  const els = getElements();
  const description = els.textDescription.value.trim();
  
  if (!description) {
    showStatus('Введите описание кадра', 'error');
    return;
  }
  
  els.btnGenerateSketch.disabled = true;
  showStatus('🎨 Генерирую скетч с помощью AI...', 'loading');
  
  try {
    const res = await fetch('/api/frames/generate-sketch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        technical: {
          shotSize: els.textShotSize.value,
          poseType: els.textPoseType.value
        }
      })
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Generation failed');
    }
    
    // Show generated sketch
    const imageDataUrl = `data:${data.data.image.mimeType};base64,${data.data.image.base64}`;
    els.generatedSketchImg.src = imageDataUrl;
    els.generatedSketch.style.display = 'block';
    
    // Store for saving
    sketchImage = {
      dataUrl: imageDataUrl,
      mimeType: data.data.image.mimeType,
      base64: data.data.image.base64
    };
    
    // Fill form and switch
    els.labelInput.value = 'Generated Frame';
    els.descriptionTextarea.value = description;
    
    if (data.data.technical) {
      const t = data.data.technical;
      if (t.shotSize) els.shotSizeSelect.value = t.shotSize;
      if (t.poseType) els.poseTypeSelect.value = t.poseType;
    }
    
    showStatus('✅ Скетч сгенерирован! Перейди во вкладку "Вручную" для сохранения.', 'success');
    
  } catch (e) {
    console.error('Generate error:', e);
    showStatus(`❌ Ошибка: ${e.message}`, 'error');
  } finally {
    els.btnGenerateSketch.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════════
// GALLERY
// ═══════════════════════════════════════════════════════════════

async function loadFrames() {
  try {
    const res = await fetch('/api/frames');
    const data = await res.json();
    
    if (data.ok && Array.isArray(data.data)) {
      savedFrames = data.data;
      renderGallery();
    }
  } catch (e) {
    console.error('Failed to load frames:', e);
  }
}

function renderGallery() {
  const els = getElements();
  const category = els.filterCategory.value;
  const search = els.filterSearch.value.toLowerCase().trim();
  
  let filtered = savedFrames;
  
  if (category) {
    filtered = filtered.filter(f => f.category === category || f.categories?.includes(category));
  }
  
  if (search) {
    filtered = filtered.filter(f => {
      return (f.label || '').toLowerCase().includes(search) ||
             (f.description || '').toLowerCase().includes(search);
    });
  }
  
  if (filtered.length === 0) {
    els.framesGallery.innerHTML = `
      <div class="empty-gallery">
        <div class="empty-gallery-icon">🖼️</div>
        <div>${savedFrames.length === 0 ? 'Пока нет сохранённых кадров' : 'Ничего не найдено'}</div>
      </div>
    `;
    return;
  }
  
  els.framesGallery.innerHTML = filtered.map(frame => {
    const hasSketch = frame.sketchAsset?.url;
    const shotSize = frame.technical?.shotSize || 'medium';
    
    return `
      <div class="frame-card" data-id="${frame.id}">
        <div class="frame-card-image">
          ${hasSketch 
            ? `<img src="${frame.sketchAsset.url}" alt="${frame.label}">`
            : '🖼️'
          }
        </div>
        <div class="frame-card-info">
          <div class="frame-card-title">${frame.label}</div>
          <div class="frame-card-meta">
            <span class="frame-card-tag">${formatOptionLabel(shotSize)}</span>
            <span class="frame-card-tag">${frame.category}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  els.framesGallery.querySelectorAll('.frame-card').forEach(card => {
    card.addEventListener('click', () => {
      const frameId = card.dataset.id;
      loadFrameForEdit(frameId);
    });
  });
}

async function loadFrameForEdit(id) {
  try {
    const res = await fetch(`/api/frames/${id}`);
    const data = await res.json();
    
    if (data.ok && data.data) {
      currentFrame = data.data;
      fillFormFromAnalysis(data.data);
      
      if (data.data.sketchAsset?.url) {
        sketchImage = { dataUrl: data.data.sketchAsset.url };
      }
      
      // Switch to manual tab
      document.querySelector('[data-tab="manual"]').click();
      
      showStatus('📂 Кадр загружен для редактирования', 'success');
      setTimeout(hideStatus, 2000);
    }
  } catch (e) {
    console.error('Load frame error:', e);
  }
}

function initFilters() {
  const els = getElements();
  
  els.filterCategory.addEventListener('change', renderGallery);
  els.filterSearch.addEventListener('input', renderGallery);
}

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

async function checkHealth() {
  const { statusText } = getElements();
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    statusText.textContent = data.ok ? 'Сервер работает' : 'Ошибка сервера';
  } catch (e) {
    statusText.textContent = 'Нет связи';
  }
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

async function init() {
  checkHealth();
  await loadOptions();
  initTabs();
  initManualForm();
  initSketchUpload();
  initTextGeneration();
  initFilters();
  await loadFrames();
}

document.addEventListener('DOMContentLoaded', init);

