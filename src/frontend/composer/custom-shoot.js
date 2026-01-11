/**
 * Custom Shoot Composer
 * 
 * Frontend logic for Custom Shoots with Reference Locks.
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let currentShoot = null;
let shootId = null;
let mode = 'quick'; // 'quick' | 'fine'
let isGenerating = false;

// Refs state
let modelImages = [];
let clothingImages = [];

// Anti-AI level names
const ANTI_AI_LEVELS = ['minimal', 'low', 'medium', 'high'];

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  // Get shoot ID from URL
  const params = new URLSearchParams(window.location.search);
  shootId = params.get('id');
  
  if (shootId) {
    await loadShoot(shootId);
  } else {
    await createNewShoot();
  }
  
  // Load frames and emotions for selects
  await loadFrames();
  await loadEmotions();
});

async function loadShoot(id) {
  try {
    const res = await fetch(`/api/custom-shoots/${id}`);
    const data = await res.json();
    
    if (!data.ok) {
      console.error('Failed to load shoot:', data.error);
      await createNewShoot();
      return;
    }
    
    currentShoot = data.shoot;
    updateUIFromShoot();
  } catch (err) {
    console.error('Error loading shoot:', err);
    await createNewShoot();
  }
}

async function createNewShoot() {
  try {
    const res = await fetch('/api/custom-shoots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Custom Shoot' })
    });
    const data = await res.json();
    
    if (!data.ok) {
      console.error('Failed to create shoot:', data.error);
      return;
    }
    
    currentShoot = data.shoot;
    shootId = data.shoot.id;
    
    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('id', shootId);
    window.history.replaceState({}, '', url);
    
    updateUIFromShoot();
  } catch (err) {
    console.error('Error creating shoot:', err);
  }
}

function updateUIFromShoot() {
  if (!currentShoot) return;
  
  // Name
  document.getElementById('shootName').value = currentShoot.label;
  
  // Presets
  const presets = currentShoot.customUniverse?.presets || {};
  document.getElementById('presetCamera').value = presets.camera || 'contax_t2';
  document.getElementById('presetCapture').value = presets.capture || 'candid_aware';
  document.getElementById('presetLight').value = presets.light || 'natural_soft';
  document.getElementById('presetColor').value = presets.color || 'film_warm';
  document.getElementById('presetTexture').value = presets.texture || 'natural_film';
  document.getElementById('presetEra').value = presets.era || 'contemporary';
  
  // Anti-AI
  const antiAiLevel = currentShoot.customUniverse?.antiAi?.level || 'medium';
  const antiAiIndex = ANTI_AI_LEVELS.indexOf(antiAiLevel) + 1;
  document.getElementById('antiAiLevel').value = antiAiIndex;
  document.getElementById('antiAiValue').textContent = antiAiLevel;
  
  // Locks
  updateLockUI('style', currentShoot.locks?.style);
  updateLockUI('location', currentShoot.locks?.location);
  
  // History
  renderHistory();
  
  // Show last generated image in preview
  if (currentShoot.generatedImages?.length > 0) {
    const lastImage = currentShoot.generatedImages[currentShoot.generatedImages.length - 1];
    showPreview(lastImage.imageUrl);
  }
}

function updateLockUI(type, lock) {
  const statusEl = document.getElementById(`${type}LockStatus`);
  const previewEl = document.getElementById(`${type}LockPreview`);
  const imgEl = document.getElementById(`${type}LockImg`);
  
  // Reset buttons
  document.getElementById(`${type}LockOff`).classList.remove('active');
  document.getElementById(`${type}LockStrict`).classList.remove('active');
  document.getElementById(`${type}LockSoft`).classList.remove('active');
  
  if (lock?.enabled && lock.mode) {
    statusEl.textContent = lock.mode.toUpperCase();
    statusEl.className = 'lock-status on';
    
    document.getElementById(`${type}Lock${capitalize(lock.mode)}`).classList.add('active');
    
    if (lock.sourceImageUrl) {
      imgEl.src = lock.sourceImageUrl;
      previewEl.style.display = 'flex';
    } else {
      previewEl.style.display = 'none';
    }
  } else {
    statusEl.textContent = 'OFF';
    statusEl.className = 'lock-status off';
    document.getElementById(`${type}LockOff`).classList.add('active');
    previewEl.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════════
// FRAMES & EMOTIONS
// ═══════════════════════════════════════════════════════════════

async function loadFrames() {
  try {
    const res = await fetch('/api/frames');
    const data = await res.json();
    
    if (!data.ok) return;
    
    const select = document.getElementById('frameSelect');
    data.frames.forEach(frame => {
      const option = document.createElement('option');
      option.value = frame.id;
      option.textContent = frame.label;
      select.appendChild(option);
    });
    
    // Set current frame if exists
    if (currentShoot?.currentFrame?.id) {
      select.value = currentShoot.currentFrame.id;
    }
  } catch (err) {
    console.error('Error loading frames:', err);
  }
}

async function loadEmotions() {
  try {
    const res = await fetch('/api/emotions');
    const data = await res.json();
    
    if (!data.ok) return;
    
    const select = document.getElementById('emotionSelect');
    Object.entries(data.emotions).forEach(([id, emotion]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = emotion.label;
      select.appendChild(option);
    });
    
    // Set current emotion if exists
    if (currentShoot?.currentEmotion) {
      select.value = currentShoot.currentEmotion;
    }
  } catch (err) {
    console.error('Error loading emotions:', err);
  }
}

// ═══════════════════════════════════════════════════════════════
// UI ACTIONS
// ═══════════════════════════════════════════════════════════════

function goBack() {
  window.location.href = '/';
}

function setMode(newMode) {
  mode = newMode;
  
  document.getElementById('modeQuick').classList.toggle('active', mode === 'quick');
  document.getElementById('modeFine').classList.toggle('active', mode === 'fine');
  
  document.getElementById('quickModeSettings').style.display = mode === 'quick' ? 'block' : 'none';
  document.getElementById('fineModeSettings').style.display = mode === 'fine' ? 'block' : 'none';
}

async function updateShootName() {
  const name = document.getElementById('shootName').value;
  await updateShoot({ label: name });
}

async function updatePreset(type) {
  const value = document.getElementById(`preset${capitalize(type)}`).value;
  await updateShoot({
    presets: {
      ...currentShoot?.customUniverse?.presets,
      [type]: value
    }
  });
}

async function updateAntiAi() {
  const level = parseInt(document.getElementById('antiAiLevel').value);
  const levelName = ANTI_AI_LEVELS[level - 1] || 'medium';
  document.getElementById('antiAiValue').textContent = levelName;
  
  await updateShoot({
    antiAi: {
      ...currentShoot?.customUniverse?.antiAi,
      level: levelName
    }
  });
}

async function updateFrame() {
  const frameId = document.getElementById('frameSelect').value;
  if (!frameId) {
    await updateShoot({ currentFrame: null });
    return;
  }
  
  // Get frame data
  try {
    const res = await fetch(`/api/frames/${frameId}`);
    const data = await res.json();
    if (data.ok) {
      await updateShoot({ currentFrame: data.frame });
    }
  } catch (err) {
    console.error('Error loading frame:', err);
  }
}

async function updateEmotion() {
  const emotionId = document.getElementById('emotionSelect').value;
  await updateShoot({ currentEmotion: emotionId || null });
}

async function updateShoot(updates) {
  if (!shootId) return;
  
  document.getElementById('saveStatus').textContent = 'Сохранение...';
  
  try {
    const res = await fetch(`/api/custom-shoots/${shootId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    
    if (data.ok) {
      currentShoot = data.shoot;
      document.getElementById('saveStatus').textContent = 'Сохранено';
    } else {
      document.getElementById('saveStatus').textContent = 'Ошибка';
    }
  } catch (err) {
    console.error('Error updating shoot:', err);
    document.getElementById('saveStatus').textContent = 'Ошибка';
  }
}

// ═══════════════════════════════════════════════════════════════
// REFERENCE UPLOADS
// ═══════════════════════════════════════════════════════════════

function uploadRef(type) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file);
      
      if (type === 'model') {
        modelImages.push({ mimeType: file.type, base64: dataUrl.split(',')[1], url: dataUrl });
        updateRefPreview('modelRef', dataUrl);
      } else if (type === 'clothing') {
        clothingImages.push({ mimeType: file.type, base64: dataUrl.split(',')[1], url: dataUrl });
        updateRefPreview('clothingRef', dataUrl);
      }
    }
  };
  
  input.click();
}

function updateRefPreview(elementId, dataUrl) {
  const el = document.getElementById(elementId);
  el.classList.add('has-image');
  el.innerHTML = `<img src="${dataUrl}" alt="ref">`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function selectLocation() {
  // TODO: Open location picker modal
  alert('Выбор локации — скоро');
}

// ═══════════════════════════════════════════════════════════════
// LOCKS
// ═══════════════════════════════════════════════════════════════

async function setStyleLock(mode) {
  if (mode === 'off') {
    await clearStyleLock();
    return;
  }
  
  // Need to select an image from history
  const images = currentShoot?.generatedImages || [];
  if (images.length === 0) {
    alert('Сначала сгенерируйте хотя бы один кадр');
    return;
  }
  
  // If there's a current style reference, use it with new mode
  if (currentShoot?.locks?.style?.sourceImageId) {
    await applyStyleLock(currentShoot.locks.style.sourceImageId, mode);
  } else {
    // Use last image
    const lastImage = images[images.length - 1];
    await applyStyleLock(lastImage.id, mode);
  }
}

async function applyStyleLock(imageId, mode) {
  try {
    const res = await fetch(`/api/custom-shoots/${shootId}/lock-style`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId, mode })
    });
    const data = await res.json();
    
    if (data.ok) {
      currentShoot = data.shoot;
      updateLockUI('style', currentShoot.locks?.style);
      renderHistory();
    }
  } catch (err) {
    console.error('Error setting style lock:', err);
  }
}

async function clearStyleLock() {
  try {
    const res = await fetch(`/api/custom-shoots/${shootId}/lock-style`, {
      method: 'DELETE'
    });
    const data = await res.json();
    
    if (data.ok) {
      currentShoot = data.shoot;
      updateLockUI('style', currentShoot.locks?.style);
      renderHistory();
    }
  } catch (err) {
    console.error('Error clearing style lock:', err);
  }
}

async function setLocationLock(mode) {
  if (mode === 'off') {
    await clearLocationLock();
    return;
  }
  
  const images = currentShoot?.generatedImages || [];
  if (images.length === 0) {
    alert('Сначала сгенерируйте хотя бы один кадр');
    return;
  }
  
  if (currentShoot?.locks?.location?.sourceImageId) {
    await applyLocationLock(currentShoot.locks.location.sourceImageId, mode);
  } else {
    const lastImage = images[images.length - 1];
    await applyLocationLock(lastImage.id, mode);
  }
}

async function applyLocationLock(imageId, mode) {
  try {
    const res = await fetch(`/api/custom-shoots/${shootId}/lock-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId, mode })
    });
    const data = await res.json();
    
    if (data.ok) {
      currentShoot = data.shoot;
      updateLockUI('location', currentShoot.locks?.location);
      renderHistory();
    }
  } catch (err) {
    console.error('Error setting location lock:', err);
  }
}

async function clearLocationLock() {
  try {
    const res = await fetch(`/api/custom-shoots/${shootId}/lock-location`, {
      method: 'DELETE'
    });
    const data = await res.json();
    
    if (data.ok) {
      currentShoot = data.shoot;
      updateLockUI('location', currentShoot.locks?.location);
      renderHistory();
    }
  } catch (err) {
    console.error('Error clearing location lock:', err);
  }
}

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

async function generate() {
  if (isGenerating) return;
  
  const btn = document.getElementById('generateBtn');
  btn.classList.add('loading');
  btn.disabled = true;
  isGenerating = true;
  
  try {
    // Prepare identity images
    const identityImages = modelImages.map(img => ({
      mimeType: img.mimeType,
      base64: img.base64
    }));
    
    // Prepare clothing images
    const clothingImagesData = clothingImages.map(img => ({
      mimeType: img.mimeType,
      base64: img.base64
    }));
    
    const extraPrompt = document.getElementById('extraPrompt').value;
    
    const res = await fetch(`/api/custom-shoots/${shootId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identityImages,
        clothingImages: clothingImagesData,
        extraPrompt
      })
    });
    
    const data = await res.json();
    
    if (!data.ok) {
      alert('Ошибка генерации: ' + data.error);
      return;
    }
    
    // Update current shoot with new image
    await loadShoot(shootId);
    
    // Show new image in preview
    showPreview(data.image.imageUrl);
    
    // Clear extra prompt
    document.getElementById('extraPrompt').value = '';
    
  } catch (err) {
    console.error('Error generating:', err);
    alert('Ошибка генерации');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
    isGenerating = false;
  }
}

function showPreview(imageUrl) {
  const area = document.getElementById('previewArea');
  area.innerHTML = `<img src="${imageUrl}" alt="Generated image">`;
}

// ═══════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════

function renderHistory() {
  const grid = document.getElementById('historyGrid');
  const count = document.getElementById('historyCount');
  
  const images = currentShoot?.generatedImages || [];
  count.textContent = `(${images.length})`;
  
  if (images.length === 0) {
    grid.innerHTML = '<div class="empty-history">Пока нет сгенерированных кадров</div>';
    return;
  }
  
  // Render in reverse order (newest first)
  grid.innerHTML = images.slice().reverse().map(img => {
    const isStyleRef = img.isStyleReference;
    const isLocationRef = img.isLocationReference;
    
    let itemClass = 'history-item';
    if (isStyleRef && isLocationRef) itemClass += ' both-ref';
    else if (isStyleRef) itemClass += ' style-ref';
    else if (isLocationRef) itemClass += ' location-ref';
    
    return `
      <div class="${itemClass}" onclick="showPreview('${img.imageUrl}')">
        <img src="${img.imageUrl}" alt="Generated">
        <div class="history-item-badges">
          ${isStyleRef ? '<span class="history-badge style">🎨</span>' : ''}
          ${isLocationRef ? '<span class="history-badge location">🏠</span>' : ''}
        </div>
        <div class="history-item-menu">
          <button class="history-menu-btn" onclick="event.stopPropagation(); setAsStyleRef('${img.id}')">🎨 Style Lock</button>
          <button class="history-menu-btn" onclick="event.stopPropagation(); setAsLocationRef('${img.id}')">🏠 Location Lock</button>
          <button class="history-menu-btn" onclick="event.stopPropagation(); deleteImage('${img.id}')">🗑️ Удалить</button>
        </div>
      </div>
    `;
  }).join('');
}

async function setAsStyleRef(imageId) {
  const currentMode = currentShoot?.locks?.style?.mode || 'strict';
  await applyStyleLock(imageId, currentMode);
}

async function setAsLocationRef(imageId) {
  const currentMode = currentShoot?.locks?.location?.mode || 'strict';
  await applyLocationLock(imageId, currentMode);
}

async function deleteImage(imageId) {
  if (!confirm('Удалить это изображение?')) return;
  
  try {
    const res = await fetch(`/api/custom-shoots/${shootId}/images/${imageId}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      await loadShoot(shootId);
    }
  } catch (err) {
    console.error('Error deleting image:', err);
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

