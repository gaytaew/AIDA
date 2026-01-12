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
let currentSpaceType = 'studio'; // Current selected space type

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
    
    // Space type selector
    spaceTypeSelector: document.getElementById('space-type-selector'),
    
    // Context sections
    sectionInterior: document.getElementById('section-interior'),
    sectionUrban: document.getElementById('section-urban'),
    sectionNature: document.getElementById('section-nature'),
    sectionRooftop: document.getElementById('section-rooftop'),
    sectionTransport: document.getElementById('section-transport'),
    sectionStudio: document.getElementById('section-studio'),
    // NOTE: sectionAmbient removed - weather/season set in generator, not location editor
    
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
    
    // NOTE: Ambient fields removed - weather/season are situational, set in generator
    
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
  
  // Environment type (legacy, hidden)
  populateSelect(els.environmentSelect, locationOptions.environmentType);
  
  // Lighting type
  populateSelect(els.lightingTypeSelect, locationOptions.lightingType);
  
  // Time of day
  populateSelect(els.timeOfDaySelect, locationOptions.timeOfDay);
  
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
  
  // Ambient options
  // NOTE: Ambient selects removed - weather/season are situational, set in generator
  
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
  // NOTE: sectionAmbient removed - weather/season set in generator, not location editor
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
  
  // Update legacy environment type for backwards compatibility
  const envMap = {
    interior: 'indoor',
    exterior_urban: 'urban',
    exterior_nature: 'nature',
    rooftop_terrace: 'outdoor',
    transport: 'outdoor',
    studio: 'studio'
  };
  if (els.environmentSelect) {
    els.environmentSelect.value = envMap[spaceType] || 'studio';
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
  
  // Update prompt preview on change - all form inputs
  const formInputs = [
    els.environmentSelect, els.lightingTypeSelect, els.timeOfDaySelect,
    els.surfaceInput, els.lightingDescInput, els.descriptionTextarea,
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
    // NOTE: Ambient fields removed - weather/season set in generator
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
      parts.push(...buildAmbientPreview(els));
      break;
    case 'exterior_nature':
      parts.push(...buildNaturePreview(els));
      parts.push(...buildAmbientPreview(els));
      break;
    case 'rooftop_terrace':
      parts.push(...buildRooftopPreview(els));
      parts.push(...buildAmbientPreview(els));
      break;
    case 'transport':
      parts.push(...buildTransportPreview(els));
      break;
    case 'studio':
      parts.push(...buildStudioPreview(els));
      break;
  }
  
  // Surface
  const surface = els.surfaceInput.value.trim();
  if (surface) {
    parts.push(surface);
  }
  
  // Lighting type
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

function buildInteriorPreview(els) {
  const parts = [];
  
  // Get selected labels from options
  const typeOption = els.interiorType?.selectedOptions[0];
  const subtypeOption = els.interiorSubtype?.selectedOptions[0];
  const styleOption = els.interiorStyle?.selectedOptions[0];
  const windowOption = els.interiorWindow?.selectedOptions[0];
  
  if (subtypeOption?.text) {
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
    parts.push(`${lightingOption.text.toLowerCase()} lighting`);
  }
  
  return parts;
}

// NOTE: buildAmbientPreview removed - weather/season are situational parameters
// set in the generator, not stored in location

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
  
  // NOTE: Ambient fields removed - weather/season set in generator
  
  currentLocation = null;
  currentProps = [];
  sketchImage = null;
  
  // Reset space type to studio
  setSpaceType('studio');
  
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
    props: currentProps,
    
    // NEW: Hierarchical context-aware parameters
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
    
    // NOTE: No ambient here - weather/season are situational, set in generator
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
  
  // NOTE: ambient not loaded here - weather/season are situational, set in generator
  
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
  initProps();
  initSketchUpload();
  initFilters();
  renderProps();
  await loadLocations();
}

document.addEventListener('DOMContentLoaded', init);

