/**
 * Location Editor
 * 
 * Handles location creation, editing, and gallery management.
 * Focuses on static physical attributes (Space Type, Architecture, Atmosphere).
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let locationOptions = null;
let savedLocations = [];
let currentLocation = null;
let sketchImage = null; // { file, dataUrl, mimeType, base64 }
let currentSpaceType = 'studio'; // Current selected space type

// ═══════════════════════════════════════════════════════════════
// ELEMENTS
// ═══════════════════════════════════════════════════════════════

function getElements() {
  return {
    // AI Generator
    aiPromptInput: document.getElementById('ai-prompt-input'),
    btnAiGenerate: document.getElementById('btn-ai-generate'),

    // Form
    locationForm: document.getElementById('location-form'),
    labelInput: document.getElementById('location-label'),
    categorySelect: document.getElementById('location-category'),
    descriptionTextarea: document.getElementById('location-description'),
    
    promptPreview: document.getElementById('prompt-preview'),
    promptText: document.getElementById('prompt-text'),
    btnClearForm: document.getElementById('btn-clear-form'),
    btnDelete: document.getElementById('btn-delete'),
    
    // Space type selector
    spaceTypeSelector: document.getElementById('space-type-selector'),
    
    // Context sections
    sectionInterior: document.getElementById('section-interior'),
    sectionUrban: document.getElementById('section-urban'),
    sectionNature: document.getElementById('section-nature'),
    sectionRooftop: document.getElementById('section-rooftop'),
    sectionTransport: document.getElementById('section-transport'),
    sectionStudio: document.getElementById('section-studio'),
    
    // Interior fields
    interiorType: document.getElementById('interior-type'),
    interiorSubtype: document.getElementById('interior-subtype'),
    interiorStyle: document.getElementById('interior-style'),
    interiorWindow: document.getElementById('interior-window'),
    
    // Urban fields
    urbanType: document.getElementById('urban-type'),
    urbanArchitecture: document.getElementById('urban-architecture'),
    urbanDensity: document.getElementById('urban-density'),
    
    // Nature fields
    natureType: document.getElementById('nature-type'),
    natureVegetation: document.getElementById('nature-vegetation'),
    natureTerrain: document.getElementById('nature-terrain'),
    
    // Rooftop fields
    rooftopType: document.getElementById('rooftop-type'),
    rooftopView: document.getElementById('rooftop-view'),
    
    // Transport fields
    transportType: document.getElementById('transport-type'),
    transportStyle: document.getElementById('transport-style'),
    transportMotion: document.getElementById('transport-motion'),
    
    // Studio fields
    studioBackdrop: document.getElementById('studio-backdrop'),
    studioLighting: document.getElementById('studio-lighting'),
    
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
      resolve({
        dataUrl,
        mimeType: 'image/jpeg',
        base64: dataUrlToBase64(dataUrl)
      });
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  if (!value) return '';
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
  
  // Space type selector
  renderSpaceTypeSelector();
  
  // Interior options
  populateSelectFromObjects(els.interiorType, locationOptions.interiorType);
  populateSelectFromObjects(els.interiorStyle, locationOptions.interiorStyle);
  populateSelectFromObjects(els.interiorWindow, locationOptions.windowLight);
  
  // Urban options
  populateSelectFromObjects(els.urbanType, locationOptions.urbanType);
  populateSelectFromObjects(els.urbanArchitecture, locationOptions.urbanArchitecture);
  populateSelectFromObjects(els.urbanDensity, locationOptions.urbanDensity);
  
  // Nature options
  populateSelectFromObjects(els.natureType, locationOptions.natureType);
  populateSelectFromObjects(els.natureVegetation, locationOptions.vegetation);
  populateSelectFromObjects(els.natureTerrain, locationOptions.terrain);
  
  // Rooftop options
  populateSelectFromObjects(els.rooftopType, locationOptions.rooftopType);
  populateSelectFromObjects(els.rooftopView, locationOptions.cityView);
  
  // Transport options
  populateSelectFromObjects(els.transportType, locationOptions.transportType);
  populateSelectFromObjects(els.transportStyle, locationOptions.vehicleStyle);
  populateSelectFromObjects(els.transportMotion, locationOptions.motion);
  
  // Studio options
  populateSelectFromObjects(els.studioBackdrop, locationOptions.studioBackdrop);
  populateSelectFromObjects(els.studioLighting, locationOptions.studioLighting);
  
  // Update interior subtypes when type changes
  if (els.interiorType) {
    els.interiorType.addEventListener('change', updateInteriorSubtypes);
    updateInteriorSubtypes();
  }
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

function populateSelectFromObjects(select, options) {
  if (!select || !options) return;
  
  select.innerHTML = '';
  
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.id;
    option.textContent = opt.label || formatOptionLabel(opt.id);
    select.appendChild(option);
  });
}

function updateInteriorSubtypes() {
  const els = getElements();
  const selectedType = els.interiorType?.value;
  const typeOption = locationOptions.interiorType?.find(t => t.id === selectedType);
  
  if (typeOption?.subtypes) {
    populateSelectFromObjects(els.interiorSubtype, typeOption.subtypes);
  } else {
    els.interiorSubtype.innerHTML = '<option value="">—</option>';
  }
}

function renderSpaceTypeSelector() {
  const els = getElements();
  if (!els.spaceTypeSelector || !locationOptions.spaceType) return;
  
  els.spaceTypeSelector.innerHTML = locationOptions.spaceType.map(st => `
    <button type="button" class="space-type-btn ${st.id === currentSpaceType ? 'active' : ''}" data-space-type="${st.id}">
      <span class="space-type-btn-icon">${st.icon}</span>
      <span class="space-type-btn-label">${st.label}</span>
    </button>
  `).join('');
  
  // Add click handlers
  els.spaceTypeSelector.querySelectorAll('.space-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const spaceType = btn.dataset.spaceType;
      setSpaceType(spaceType);
    });
  });
}

function setSpaceType(spaceType) {
  currentSpaceType = spaceType;
  
  const els = getElements();
  
  // Update buttons
  els.spaceTypeSelector.querySelectorAll('.space-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.spaceType === spaceType);
  });
  
  // Hide all context sections
  const sections = [
    els.sectionInterior,
    els.sectionUrban,
    els.sectionNature,
    els.sectionRooftop,
    els.sectionTransport,
    els.sectionStudio,
  ];
  sections.forEach(s => { if (s) s.style.display = 'none'; });
  
  // Show relevant section
  switch (spaceType) {
    case 'interior':
      if (els.sectionInterior) els.sectionInterior.style.display = 'contents';
      break;
    case 'exterior_urban':
      if (els.sectionUrban) els.sectionUrban.style.display = 'contents';
      break;
    case 'exterior_nature':
      if (els.sectionNature) els.sectionNature.style.display = 'contents';
      break;
    case 'rooftop_terrace':
      if (els.sectionRooftop) els.sectionRooftop.style.display = 'contents';
      break;
    case 'transport':
      if (els.sectionTransport) els.sectionTransport.style.display = 'contents';
      break;
    case 'studio':
      if (els.sectionStudio) els.sectionStudio.style.display = 'contents';
      break;
  }
  
  updatePromptPreview();
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
  
  // AI Generate button
  if (els.btnAiGenerate) {
    els.btnAiGenerate.addEventListener('click', generateFromPrompt);
  }
  
  // Update prompt preview on change - all form inputs
  const formInputs = [
    els.descriptionTextarea,
    // Interior
    els.interiorType, els.interiorSubtype, els.interiorStyle, els.interiorWindow,
    // Urban
    els.urbanType, els.urbanArchitecture, els.urbanDensity,
    // Nature
    els.natureType, els.natureVegetation, els.natureTerrain,
    // Rooftop
    els.rooftopType, els.rooftopView,
    // Transport
    els.transportType, els.transportStyle, els.transportMotion,
    // Studio
    els.studioBackdrop, els.studioLighting
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
  
  // Space type specific parts
  switch (currentSpaceType) {
    case 'interior':
      parts.push(...buildInteriorPreview(els));
      break;
    case 'exterior_urban':
      parts.push(...buildUrbanPreview(els));
      break;
    case 'exterior_nature':
      parts.push(...buildNaturePreview(els));
      break;
    case 'rooftop_terrace':
      parts.push(...buildRooftopPreview(els));
      break;
    case 'transport':
      parts.push(...buildTransportPreview(els));
      break;
    case 'studio':
      parts.push(...buildStudioPreview(els));
      break;
  }
  
  // Description (Visual & Atmosphere)
  const desc = els.descriptionTextarea.value.trim();
  if (desc) {
    parts.push(desc);
  }
  
  const prompt = parts.join(', ');
  els.promptText.textContent = prompt || 'Заполни форму для генерации prompt snippet';
  els.promptPreview.style.display = 'block';
}

function buildInteriorPreview(els) {
  const parts = [];
  
  // Get selected labels from options
  const typeOption = els.interiorType?.selectedOptions[0];
  const subtypeOption = els.interiorSubtype?.selectedOptions[0];
  const styleOption = els.interiorStyle?.selectedOptions[0];
  const windowOption = els.interiorWindow?.selectedOptions[0];
  
  if (subtypeOption?.text && subtypeOption.value) {
    parts.push(subtypeOption.text.toLowerCase());
  } else if (typeOption?.text) {
    parts.push(typeOption.text.toLowerCase());
  }
  
  if (styleOption?.text) {
    parts.push(`${styleOption.text.toLowerCase()} style`);
  }
  
  if (windowOption?.value && windowOption.value !== 'none') {
    parts.push(`natural light from ${windowOption.text.toLowerCase()}`);
  }
  
  return parts;
}

function buildUrbanPreview(els) {
  const parts = [];
  
  const typeOption = els.urbanType?.selectedOptions[0];
  const archOption = els.urbanArchitecture?.selectedOptions[0];
  const densityOption = els.urbanDensity?.selectedOptions[0];
  
  if (typeOption?.text) {
    parts.push(typeOption.text.toLowerCase());
  }
  
  if (archOption?.text) {
    parts.push(`${archOption.text.toLowerCase()} architecture`);
  }
  
  if (densityOption?.value && densityOption.value !== 'moderate') {
    parts.push(densityOption.text.toLowerCase());
  }
  
  return parts;
}

function buildNaturePreview(els) {
  const parts = [];
  
  const typeOption = els.natureType?.selectedOptions[0];
  const vegOption = els.natureVegetation?.selectedOptions[0];
  const terrainOption = els.natureTerrain?.selectedOptions[0];
  
  if (typeOption?.text) {
    parts.push(typeOption.text.toLowerCase());
  }
  
  if (vegOption?.value && vegOption.value !== 'lush') {
    parts.push(`${vegOption.text.toLowerCase()} vegetation`);
  }
  
  if (terrainOption?.value && terrainOption.value !== 'flat') {
    parts.push(`${terrainOption.text.toLowerCase()} terrain`);
  }
  
  return parts;
}

function buildRooftopPreview(els) {
  const parts = [];
  
  const typeOption = els.rooftopType?.selectedOptions[0];
  const viewOption = els.rooftopView?.selectedOptions[0];
  
  if (typeOption?.text) {
    parts.push(typeOption.text.toLowerCase());
  }
  
  if (viewOption?.value && viewOption.value !== 'no_view') {
    parts.push(`with ${viewOption.text.toLowerCase()}`);
  }
  
  return parts;
}

function buildTransportPreview(els) {
  const parts = [];
  
  const typeOption = els.transportType?.selectedOptions[0];
  const styleOption = els.transportStyle?.selectedOptions[0];
  const motionOption = els.transportMotion?.selectedOptions[0];
  
  if (typeOption?.text) {
    parts.push(typeOption.text.toLowerCase());
  }
  
  if (styleOption?.value && styleOption.value !== 'everyday') {
    parts.push(`${styleOption.text.toLowerCase()} style`);
  }
  
  if (motionOption?.value && motionOption.value !== 'parked') {
    parts.push(motionOption.text.toLowerCase());
  }
  
  return parts;
}

function buildStudioPreview(els) {
  const parts = ['studio setting'];
  
  const backdropOption = els.studioBackdrop?.selectedOptions[0];
  const lightingOption = els.studioLighting?.selectedOptions[0];
  
  if (backdropOption?.text) {
    parts.push(backdropOption.text.toLowerCase());
  }
  
  if (lightingOption?.text) {
    parts.push(`${lightingOption.text.toLowerCase()} lighting equipment`);
  }
  
  return parts;
}

function clearForm() {
  const els = getElements();
  
  els.labelInput.value = '';
  els.categorySelect.selectedIndex = 0;
  els.descriptionTextarea.value = '';
  els.aiPromptInput.value = '';
  
  // Reset hierarchical fields
  if (els.interiorType) els.interiorType.selectedIndex = 0;
  if (els.interiorSubtype) els.interiorSubtype.selectedIndex = 0;
  if (els.interiorStyle) els.interiorStyle.selectedIndex = 0;
  if (els.interiorWindow) els.interiorWindow.selectedIndex = 0;
  
  if (els.urbanType) els.urbanType.selectedIndex = 0;
  if (els.urbanArchitecture) els.urbanArchitecture.selectedIndex = 0;
  if (els.urbanDensity) els.urbanDensity.selectedIndex = 0;
  
  if (els.natureType) els.natureType.selectedIndex = 0;
  if (els.natureVegetation) els.natureVegetation.selectedIndex = 0;
  if (els.natureTerrain) els.natureTerrain.selectedIndex = 0;
  
  if (els.rooftopType) els.rooftopType.selectedIndex = 0;
  if (els.rooftopView) els.rooftopView.selectedIndex = 0;
  
  if (els.transportType) els.transportType.selectedIndex = 0;
  if (els.transportStyle) els.transportStyle.selectedIndex = 0;
  if (els.transportMotion) els.transportMotion.selectedIndex = 0;
  
  if (els.studioBackdrop) els.studioBackdrop.selectedIndex = 0;
  if (els.studioLighting) els.studioLighting.selectedIndex = 0;
  
  currentLocation = null;
  sketchImage = null;
  
  // Reset space type to studio
  setSpaceType('studio');
  
  els.sketchPreview.style.display = 'none';
  els.sketchUploadZone.style.display = 'block';
  els.promptPreview.style.display = 'none';
  els.btnDelete.style.display = 'none';
  
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
    description: els.descriptionTextarea.value.trim(), // Visual/Atmosphere description
    
    // Hierarchical context-aware parameters
    spaceType: currentSpaceType,
    
    // Interior
    interior: {
      type: els.interiorType?.value || 'residential',
      subtype: els.interiorSubtype?.value || 'apartment',
      style: els.interiorStyle?.value || 'modern_minimal',
      windowLight: els.interiorWindow?.value || 'large'
    },
    
    // Urban
    urban: {
      type: els.urbanType?.value || 'city_street',
      architecture: els.urbanArchitecture?.value || 'modern',
      density: els.urbanDensity?.value || 'sparse'
    },
    
    // Nature
    nature: {
      type: els.natureType?.value || 'forest',
      vegetation: els.natureVegetation?.value || 'lush',
      terrain: els.natureTerrain?.value || 'flat'
    },
    
    // Rooftop
    rooftop: {
      type: els.rooftopType?.value || 'open_rooftop',
      cityView: els.rooftopView?.value || 'skyline'
    },
    
    // Transport
    transport: {
      type: els.transportType?.value || 'car_interior',
      vehicleStyle: els.transportStyle?.value || 'luxury',
      motion: els.transportMotion?.value || 'parked'
    },
    
    // Studio
    studio: {
      backdrop: els.studioBackdrop?.value || 'white_seamless',
      lightingSetup: els.studioLighting?.value || 'three_point'
    }
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

async function generateFromPrompt() {
  const els = getElements();
  const prompt = els.aiPromptInput.value.trim();
  
  // Check if we have an image uploaded in the sketch zone
  const hasImage = !!sketchImage;
  
  if (!prompt && !hasImage) {
    showStatus('⚠️ Введите описание или загрузите фото', 'error');
    return;
  }
  
  showStatus('✨ AI анализирует локацию...', 'loading');
  
  try {
    const payload = {
      prompt: prompt || (hasImage ? "Analyze this image and describe the location structure." : ""),
      image: hasImage ? sketchImage.dataUrl : null
    };
    
    const res = await fetch('/api/locations/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Generation failed');
    }
    
    const generated = data.data;
    
    // Fill the form with generated data
    // We reuse fillForm, but handle potential missing fields gracefully
    // fillForm expects a full location object, so we might need to be careful
    
    // 1. Basic fields
    if (generated.label) els.labelInput.value = generated.label;
    if (generated.category) els.categorySelect.value = generated.category;
    if (generated.description) els.descriptionTextarea.value = generated.description;
    
    // 2. Space Type
    if (generated.spaceType) {
      setSpaceType(generated.spaceType);
    }
    
    // 3. Hierarchical fields
    // We can merge generated data into a temporary object and call fillForm
    // or just set fields directly. Since fillForm handles everything, let's use it partially.
    
    // Construct a partial location object to pass to fillForm
    // We want to preserve the sketch image if it exists
    const tempLocation = {
      ...generated,
      sketchAsset: sketchImage ? { url: sketchImage.dataUrl } : null
    };
    
    fillForm(tempLocation);
    
    showStatus('✨ Локация заполнена!', 'success');
    setTimeout(hideStatus, 2000);
    
  } catch (e) {
    console.error('AI Generation error:', e);
    showStatus(`❌ Ошибка AI: ${e.message}`, 'error');
  }
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
    // Compress image before storing
    const compressed = await compressImage(file);
    console.log(`[Location] Compressed ${file.name}: ${Math.round(file.size / 1024)}KB → ${Math.round(compressed.base64.length * 0.75 / 1024)}KB`);
    
    sketchImage = {
      file,
      dataUrl: compressed.dataUrl,
      mimeType: compressed.mimeType,
      base64: compressed.base64
    };
    
    els.sketchPreviewImg.src = compressed.dataUrl;
    els.sketchPreview.style.display = 'block';
    els.sketchUploadZone.style.display = 'none';
  } catch (e) {
    console.error('Failed to load/compress sketch:', e);
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
    // Map spaceType or fallback to old environmentType for display
    const typeLabel = location.spaceType 
      ? formatOptionLabel(location.spaceType)
      : formatOptionLabel(location.environmentType || 'studio');
    
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
            <span class="location-card-tag">${typeLabel}</span>
            <span class="location-card-tag">${location.category || 'misc'}</span>
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
  els.descriptionTextarea.value = location.description || '';
  
  // Set space type (with fallback for legacy locations)
  const spaceType = location.spaceType || mapLegacyEnvironmentToSpaceType(location.environmentType);
  setSpaceType(spaceType);
  
  // Fill hierarchical fields
  if (location.interior) {
    if (els.interiorType) els.interiorType.value = location.interior.type || 'residential';
    updateInteriorSubtypes(); // Update subtypes based on type
    if (els.interiorSubtype) els.interiorSubtype.value = location.interior.subtype || '';
    if (els.interiorStyle) els.interiorStyle.value = location.interior.style || 'modern_minimal';
    if (els.interiorWindow) els.interiorWindow.value = location.interior.windowLight || 'large';
  }
  
  if (location.urban) {
    if (els.urbanType) els.urbanType.value = location.urban.type || 'city_street';
    if (els.urbanArchitecture) els.urbanArchitecture.value = location.urban.architecture || 'modern';
    if (els.urbanDensity) els.urbanDensity.value = location.urban.density || 'sparse';
  }
  
  if (location.nature) {
    if (els.natureType) els.natureType.value = location.nature.type || 'forest';
    if (els.natureVegetation) els.natureVegetation.value = location.nature.vegetation || 'lush';
    if (els.natureTerrain) els.natureTerrain.value = location.nature.terrain || 'flat';
  }
  
  if (location.rooftop) {
    if (els.rooftopType) els.rooftopType.value = location.rooftop.type || 'open_rooftop';
    if (els.rooftopView) els.rooftopView.value = location.rooftop.cityView || 'skyline';
  }
  
  if (location.transport) {
    if (els.transportType) els.transportType.value = location.transport.type || 'car_interior';
    if (els.transportStyle) els.transportStyle.value = location.transport.vehicleStyle || 'luxury';
    if (els.transportMotion) els.transportMotion.value = location.transport.motion || 'parked';
  }
  
  if (location.studio) {
    if (els.studioBackdrop) els.studioBackdrop.value = location.studio.backdrop || 'white_seamless';
    if (els.studioLighting) els.studioLighting.value = location.studio.lightingSetup || 'three_point';
  }
  
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

// Map legacy environmentType to new spaceType
function mapLegacyEnvironmentToSpaceType(envType) {
  const map = {
    studio: 'studio',
    indoor: 'interior',
    outdoor: 'exterior_nature',
    urban: 'exterior_urban',
    nature: 'exterior_nature',
    abstract: 'studio'
  };
  return map[envType] || 'studio';
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
  initSketchUpload();
  initFilters();
  await loadLocations();
}

document.addEventListener('DOMContentLoaded', init);
