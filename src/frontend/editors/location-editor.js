/**
 * Location Editor
 * 
 * Handles location creation, editing, and gallery management.
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let locationOptions = null;
let savedLocations = [];
let currentLocation = null;
let sketchImage = null; // { file, dataUrl, mimeType, base64 }
let currentProps = []; // Array of prop strings

// ═══════════════════════════════════════════════════════════════
// ELEMENTS
// ═══════════════════════════════════════════════════════════════

function getElements() {
  return {
    // Form
    locationForm: document.getElementById('location-form'),
    labelInput: document.getElementById('location-label'),
    categorySelect: document.getElementById('location-category'),
    environmentSelect: document.getElementById('location-environment'),
    lightingTypeSelect: document.getElementById('location-lighting-type'),
    timeOfDaySelect: document.getElementById('location-time-of-day'),
    surfaceInput: document.getElementById('location-surface'),
    lightingDescInput: document.getElementById('location-lighting-desc'),
    descriptionTextarea: document.getElementById('location-description'),
    promptPreview: document.getElementById('prompt-preview'),
    promptText: document.getElementById('prompt-text'),
    btnClearForm: document.getElementById('btn-clear-form'),
    btnDelete: document.getElementById('btn-delete'),
    
    // Props
    propsContainer: document.getElementById('props-container'),
    propInput: document.getElementById('prop-input'),
    btnAddProp: document.getElementById('btn-add-prop'),
    
    // Sketch upload
    sketchUploadZone: document.getElementById('sketch-upload-zone'),
    sketchFileInput: document.getElementById('sketch-file-input'),
    sketchPreview: document.getElementById('sketch-preview'),
    sketchPreviewImg: document.getElementById('sketch-preview-img'),
    sketchRemove: document.getElementById('sketch-remove'),
    
    // Gallery
    filterCategory: document.getElementById('filter-category'),
    filterSearch: document.getElementById('filter-search'),
    locationsGallery: document.getElementById('locations-gallery'),
    
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
    const res = await fetch('/api/locations/options');
    const data = await res.json();
    if (data.ok) {
      locationOptions = data.data;
      populateSelects();
    }
  } catch (e) {
    console.error('Failed to load options:', e);
  }
}

function populateSelects() {
  const els = getElements();
  
  // Category
  populateSelect(els.categorySelect, locationOptions.categories);
  populateSelect(els.filterCategory, locationOptions.categories, true);
  
  // Environment type
  populateSelect(els.environmentSelect, locationOptions.environmentType);
  
  // Lighting type
  populateSelect(els.lightingTypeSelect, locationOptions.lightingType);
  
  // Time of day
  populateSelect(els.timeOfDaySelect, locationOptions.timeOfDay);
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
// FORM
// ═══════════════════════════════════════════════════════════════

function initForm() {
  const els = getElements();
  
  // Form submit
  els.locationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveLocation();
  });
  
  // Clear form
  els.btnClearForm.addEventListener('click', () => {
    clearForm();
  });
  
  // Delete button
  els.btnDelete.addEventListener('click', async () => {
    if (currentLocation && confirm('Удалить эту локацию?')) {
      await deleteLocation(currentLocation.id);
    }
  });
  
  // Update prompt preview on change
  const formInputs = [
    els.environmentSelect, els.lightingTypeSelect, els.timeOfDaySelect,
    els.surfaceInput, els.lightingDescInput, els.descriptionTextarea
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
  
  // Environment type
  const envType = els.environmentSelect.value;
  if (envType) {
    const envMap = {
      studio: 'studio setting',
      indoor: 'indoor environment',
      outdoor: 'outdoor location',
      urban: 'urban environment',
      nature: 'natural setting',
      abstract: 'abstract background'
    };
    parts.push(envMap[envType] || formatOptionLabel(envType));
  }
  
  // Surface
  const surface = els.surfaceInput.value.trim();
  if (surface) {
    parts.push(surface);
  }
  
  // Lighting
  const lightingType = els.lightingTypeSelect.value;
  if (lightingType && lightingType !== 'natural') {
    const lightMap = {
      artificial: 'artificial lighting',
      mixed: 'mixed lighting',
      studio_flash: 'studio flash',
      on_camera_flash: 'on-camera flash',
      ambient: 'ambient light',
      dramatic: 'dramatic lighting'
    };
    parts.push(lightMap[lightingType] || lightingType);
  }
  
  // Time of day
  const timeOfDay = els.timeOfDaySelect.value;
  if (timeOfDay && timeOfDay !== 'any') {
    const timeMap = {
      golden_hour: 'golden hour light',
      blue_hour: 'blue hour light',
      midday: 'midday sun',
      sunset: 'sunset light',
      sunrise: 'sunrise light',
      night: 'night time',
      overcast: 'overcast/diffused light'
    };
    parts.push(timeMap[timeOfDay] || timeOfDay);
  }
  
  // Lighting description
  const lightingDesc = els.lightingDescInput.value.trim();
  if (lightingDesc) {
    parts.push(lightingDesc);
  }
  
  // Props
  if (currentProps.length > 0) {
    parts.push(`props: ${currentProps.join(', ')}`);
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
  els.categorySelect.selectedIndex = 0;
  els.environmentSelect.selectedIndex = 0;
  els.lightingTypeSelect.selectedIndex = 0;
  els.timeOfDaySelect.selectedIndex = 0;
  els.surfaceInput.value = '';
  els.lightingDescInput.value = '';
  els.descriptionTextarea.value = '';
  
  currentLocation = null;
  currentProps = [];
  sketchImage = null;
  
  els.sketchPreview.style.display = 'none';
  els.sketchUploadZone.style.display = 'block';
  els.promptPreview.style.display = 'none';
  els.btnDelete.style.display = 'none';
  
  renderProps();
  hideStatus();
}

async function saveLocation() {
  const els = getElements();
  
  const label = els.labelInput.value.trim();
  if (!label) {
    showStatus('Введите название локации', 'error');
    return;
  }
  
  const locationData = {
    label,
    category: els.categorySelect.value,
    description: els.descriptionTextarea.value.trim(),
    environmentType: els.environmentSelect.value,
    surface: els.surfaceInput.value.trim(),
    lighting: {
      type: els.lightingTypeSelect.value,
      timeOfDay: els.timeOfDaySelect.value,
      description: els.lightingDescInput.value.trim()
    },
    props: currentProps
  };
  
  // Add sketch if available
  if (sketchImage) {
    locationData.sketchAsset = {
      assetId: `sketch_${Date.now()}`,
      url: sketchImage.dataUrl
    };
  }
  
  showStatus('💾 Сохраняю локацию...', 'loading');
  
  try {
    const method = currentLocation ? 'PUT' : 'POST';
    const url = currentLocation ? `/api/locations/${currentLocation.id}` : '/api/locations';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationData)
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.ok) {
      throw new Error(data.errors?.join(', ') || data.error || 'Failed to save');
    }
    
    showStatus('✅ Локация сохранена!', 'success');
    setTimeout(hideStatus, 2000);
    
    await loadLocations();
    clearForm();
    
  } catch (e) {
    console.error('Save error:', e);
    showStatus(`❌ Ошибка: ${e.message}`, 'error');
  }
}

async function deleteLocation(id) {
  showStatus('🗑️ Удаляю локацию...', 'loading');
  
  try {
    const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
    const data = await res.json();
    
    if (!res.ok || !data.ok) {
      throw new Error(data.errors?.join(', ') || data.error || 'Failed to delete');
    }
    
    showStatus('✅ Локация удалена!', 'success');
    setTimeout(hideStatus, 2000);
    
    await loadLocations();
    clearForm();
    
  } catch (e) {
    console.error('Delete error:', e);
    showStatus(`❌ Ошибка: ${e.message}`, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════

function initProps() {
  const els = getElements();
  
  els.btnAddProp.addEventListener('click', () => {
    const value = els.propInput.value.trim();
    if (value && !currentProps.includes(value)) {
      currentProps.push(value);
      els.propInput.value = '';
      renderProps();
      updatePromptPreview();
    }
  });
  
  els.propInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      els.btnAddProp.click();
    }
  });
}

function renderProps() {
  const els = getElements();
  
  if (currentProps.length === 0) {
    els.propsContainer.innerHTML = '<span style="color: var(--color-text-muted); font-size: 12px;">Нет объектов</span>';
    return;
  }
  
  els.propsContainer.innerHTML = currentProps.map((prop, idx) => `
    <span class="prop-tag">
      ${escapeHtml(prop)}
      <button type="button" class="prop-tag-remove" data-idx="${idx}">×</button>
    </span>
  `).join('');
  
  // Add remove handlers
  els.propsContainer.querySelectorAll('.prop-tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      currentProps.splice(idx, 1);
      renderProps();
      updatePromptPreview();
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// SKETCH UPLOAD
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
  });
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
  } catch (e) {
    console.error('Failed to load sketch:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// GALLERY
// ═══════════════════════════════════════════════════════════════

async function loadLocations() {
  try {
    const res = await fetch('/api/locations');
    const data = await res.json();
    
    if (data.ok && Array.isArray(data.data)) {
      savedLocations = data.data;
      renderGallery();
    }
  } catch (e) {
    console.error('Failed to load locations:', e);
  }
}

function renderGallery() {
  const els = getElements();
  const category = els.filterCategory.value;
  const search = els.filterSearch.value.toLowerCase().trim();
  
  let filtered = savedLocations;
  
  if (category) {
    filtered = filtered.filter(l => l.category === category);
  }
  
  if (search) {
    filtered = filtered.filter(l => {
      return (l.label || '').toLowerCase().includes(search) ||
             (l.description || '').toLowerCase().includes(search);
    });
  }
  
  if (filtered.length === 0) {
    els.locationsGallery.innerHTML = `
      <div class="empty-gallery">
        <div class="empty-gallery-icon">📍</div>
        <div>${savedLocations.length === 0 ? 'Пока нет сохранённых локаций' : 'Ничего не найдено'}</div>
      </div>
    `;
    return;
  }
  
  els.locationsGallery.innerHTML = filtered.map(location => {
    const hasSketch = location.sketchAsset?.url;
    const envType = location.environmentType || 'studio';
    
    return `
      <div class="location-card" data-id="${location.id}">
        <div class="location-card-image">
          ${hasSketch 
            ? `<img src="${location.sketchAsset.url}" alt="${location.label}">`
            : '📍'
          }
        </div>
        <div class="location-card-info">
          <div class="location-card-title">${escapeHtml(location.label)}</div>
          <div class="location-card-meta">
            <span class="location-card-tag">${formatOptionLabel(envType)}</span>
            <span class="location-card-tag">${location.category}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  els.locationsGallery.querySelectorAll('.location-card').forEach(card => {
    card.addEventListener('click', () => {
      const locationId = card.dataset.id;
      loadLocationForEdit(locationId);
    });
  });
}

async function loadLocationForEdit(id) {
  try {
    const res = await fetch(`/api/locations/${id}`);
    const data = await res.json();
    
    if (data.ok && data.data) {
      currentLocation = data.data;
      fillForm(data.data);
      
      showStatus('📂 Локация загружена для редактирования', 'success');
      setTimeout(hideStatus, 2000);
    }
  } catch (e) {
    console.error('Load location error:', e);
  }
}

function fillForm(location) {
  const els = getElements();
  
  els.labelInput.value = location.label || '';
  els.categorySelect.value = location.category || 'studio';
  els.environmentSelect.value = location.environmentType || 'studio';
  els.surfaceInput.value = location.surface || '';
  els.descriptionTextarea.value = location.description || '';
  
  if (location.lighting) {
    els.lightingTypeSelect.value = location.lighting.type || 'natural';
    els.timeOfDaySelect.value = location.lighting.timeOfDay || 'any';
    els.lightingDescInput.value = location.lighting.description || '';
  }
  
  currentProps = Array.isArray(location.props) ? [...location.props] : [];
  renderProps();
  
  if (location.sketchAsset?.url) {
    sketchImage = { dataUrl: location.sketchAsset.url };
    els.sketchPreviewImg.src = location.sketchAsset.url;
    els.sketchPreview.style.display = 'block';
    els.sketchUploadZone.style.display = 'none';
  } else {
    sketchImage = null;
    els.sketchPreview.style.display = 'none';
    els.sketchUploadZone.style.display = 'block';
  }
  
  els.btnDelete.style.display = 'block';
  updatePromptPreview();
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
  initForm();
  initProps();
  initSketchUpload();
  initFilters();
  renderProps();
  await loadLocations();
}

document.addEventListener('DOMContentLoaded', init);

