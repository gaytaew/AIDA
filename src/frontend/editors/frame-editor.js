/**
 * Frame Editor - Simplified
 * 
 * Simple workflow: Upload reference → Generate sketch → Save
 * No descriptions, labels, or pose settings - just visual output.
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let referenceImage = null;  // { dataUrl, mimeType, base64 }
let generatedSketch = null; // { dataUrl, mimeType, base64 }
let savedFrames = [];

// ═══════════════════════════════════════════════════════════════
// ELEMENTS
// ═══════════════════════════════════════════════════════════════

function getElements() {
  return {
    // Upload
    uploadZone: document.getElementById('upload-zone'),
    fileInput: document.getElementById('file-input'),
    referenceImg: document.getElementById('reference-img'),
    btnRemoveReference: document.getElementById('btn-remove-reference'),
    
    // Sketch
    sketchPlaceholder: document.getElementById('sketch-placeholder'),
    sketchImg: document.getElementById('sketch-img'),
    
    // Actions
    btnGenerate: document.getElementById('btn-generate'),
    btnSave: document.getElementById('btn-save'),
    
    // Status
    status: document.getElementById('status'),
    statusText: document.getElementById('status-text'),
    
    // Gallery
    filterSearch: document.getElementById('filter-search'),
    framesGallery: document.getElementById('frames-gallery')
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
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
      resolve({
        dataUrl,
        mimeType: 'image/jpeg',
        base64: dataUrl.split(',')[1]
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

// ═══════════════════════════════════════════════════════════════
// REFERENCE UPLOAD
// ═══════════════════════════════════════════════════════════════

function initUpload() {
  const els = getElements();
  
  // File input change
  els.fileInput.addEventListener('change', async (e) => {
    if (e.target.files?.[0]) {
      await loadReferenceFile(e.target.files[0]);
    }
    e.target.value = '';
  });
  
  // Drag & drop
  ['dragenter', 'dragover'].forEach(evt => {
    els.uploadZone.addEventListener(evt, (e) => {
      e.preventDefault();
      els.uploadZone.classList.add('dragover');
    });
  });
  
  ['dragleave', 'dragend'].forEach(evt => {
    els.uploadZone.addEventListener(evt, (e) => {
      e.preventDefault();
      els.uploadZone.classList.remove('dragover');
    });
  });
  
  els.uploadZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    els.uploadZone.classList.remove('dragover');
    if (e.dataTransfer?.files?.[0]) {
      await loadReferenceFile(e.dataTransfer.files[0]);
    }
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
          await loadReferenceFile(file);
          break;
        }
      }
    }
  });
  
  // Remove reference
  els.btnRemoveReference.addEventListener('click', clearReference);
}

async function loadReferenceFile(file) {
  if (!file.type.startsWith('image/')) return;
  
  const els = getElements();
  
  try {
    const compressed = await compressImage(file);
    console.log(`[Frame] Compressed ${file.name}: ${Math.round(file.size / 1024)}KB → ${Math.round(compressed.base64.length * 0.75 / 1024)}KB`);
    
    referenceImage = compressed;
    
    // Update UI
    els.referenceImg.src = compressed.dataUrl;
    els.referenceImg.style.display = 'block';
    els.uploadZone.style.display = 'none';
    els.btnRemoveReference.style.display = 'flex';
    els.btnGenerate.disabled = false;
    
    // Clear previous sketch
    clearSketch();
    
  } catch (e) {
    console.error('Failed to load reference:', e);
    showStatus('❌ Ошибка загрузки изображения', 'error');
  }
}

function clearReference() {
  const els = getElements();
  
  referenceImage = null;
  
  els.referenceImg.src = '';
  els.referenceImg.style.display = 'none';
  els.uploadZone.style.display = 'flex';
  els.btnRemoveReference.style.display = 'none';
  els.btnGenerate.disabled = true;
  
  clearSketch();
  hideStatus();
}

function clearSketch() {
  const els = getElements();
  
  generatedSketch = null;
  
  els.sketchImg.src = '';
  els.sketchImg.style.display = 'none';
  els.sketchPlaceholder.style.display = 'flex';
  els.btnSave.disabled = true;
}

// ═══════════════════════════════════════════════════════════════
// SKETCH GENERATION
// ═══════════════════════════════════════════════════════════════

function initGeneration() {
  const els = getElements();
  
  els.btnGenerate.addEventListener('click', generateSketch);
  els.btnSave.addEventListener('click', saveSketch);
}

async function generateSketch() {
  if (!referenceImage) return;
  
  const els = getElements();
  els.btnGenerate.disabled = true;
  showStatus('🎨 Генерирую эскиз...', 'loading');
  
  try {
    // Call the API - it will analyze and generate sketch
    const res = await fetch('/api/frames/analyze-sketch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: {
          mimeType: referenceImage.mimeType,
          base64: referenceImage.base64
        },
        generateSketch: true
      })
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Ошибка генерации');
    }
    
    // Check if we got a sketch
    if (!data.data.generatedSketch?.base64) {
      throw new Error('Эскиз не был сгенерирован');
    }
    
    // Store the generated sketch
    const sketchData = data.data.generatedSketch;
    generatedSketch = {
      dataUrl: `data:${sketchData.mimeType || 'image/png'};base64,${sketchData.base64}`,
      mimeType: sketchData.mimeType || 'image/png',
      base64: sketchData.base64
    };
    
    // Show the sketch
    els.sketchImg.src = generatedSketch.dataUrl;
    els.sketchImg.style.display = 'block';
    els.sketchPlaceholder.style.display = 'none';
    els.btnSave.disabled = false;
    
    showStatus('✅ Эскиз готов!', 'success');
    setTimeout(hideStatus, 2000);
    
  } catch (e) {
    console.error('Generate error:', e);
    showStatus(`❌ ${e.message}`, 'error');
  } finally {
    els.btnGenerate.disabled = !referenceImage;
  }
}

async function saveSketch() {
  if (!generatedSketch) return;
  
  showStatus('💾 Сохраняю...', 'loading');
  
  try {
    // Generate a simple label based on timestamp
    const timestamp = new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const frameData = {
      label: `Эскиз ${timestamp}`,
      category: 'fashion',
      description: '',
      technical: {},
      sketchAsset: {
        assetId: `sketch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        url: generatedSketch.dataUrl
      }
    };
    
    // Also save reference
    if (referenceImage) {
      frameData.poseRefAsset = {
        assetId: `poseref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        url: referenceImage.dataUrl
      };
    }
    
    const res = await fetch('/api/frames', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(frameData)
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.ok) {
      throw new Error(data.errors?.join(', ') || data.error || 'Ошибка сохранения');
    }
    
    showStatus('✅ Сохранено!', 'success');
    setTimeout(hideStatus, 2000);
    
    // Reset and reload gallery
    clearReference();
    await loadFrames();
    
  } catch (e) {
    console.error('Save error:', e);
    showStatus(`❌ ${e.message}`, 'error');
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
  const search = els.filterSearch.value.toLowerCase().trim();
  
  let filtered = savedFrames;
  
  if (search) {
    filtered = filtered.filter(f => {
      return (f.label || '').toLowerCase().includes(search);
    });
  }
  
  if (filtered.length === 0) {
    els.framesGallery.innerHTML = `
      <div class="empty-gallery">
        <div class="empty-gallery-icon">🖼️</div>
        <div>${savedFrames.length === 0 ? 'Пока нет сохранённых эскизов' : 'Ничего не найдено'}</div>
      </div>
    `;
    return;
  }
  
  els.framesGallery.innerHTML = filtered.map(frame => {
    const hasSketch = frame.sketchAsset?.url;
    
    return `
      <div class="frame-card" data-id="${frame.id}">
        <div class="frame-card-image">
          ${hasSketch 
            ? `<img src="${frame.sketchAsset.url}" alt="Sketch">`
            : '🖼️'
          }
        </div>
        <button class="frame-card-delete" data-frame-id="${frame.id}" title="Удалить">✕</button>
      </div>
    `;
  }).join('');
  
  // Add delete handlers
  els.framesGallery.querySelectorAll('.frame-card-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteFrame(btn.dataset.frameId);
    });
  });
}

async function deleteFrame(frameId) {
  if (!confirm('Удалить этот эскиз?')) return;
  
  try {
    const res = await fetch(`/api/frames/${frameId}`, { method: 'DELETE' });
    const data = await res.json();
    
    if (data.ok) {
      savedFrames = savedFrames.filter(f => f.id !== frameId);
      renderGallery();
      showStatus('✅ Удалено', 'success');
      setTimeout(hideStatus, 1500);
    } else {
      showStatus('❌ ' + (data.errors?.join(', ') || data.error), 'error');
    }
  } catch (e) {
    console.error('Error deleting frame:', e);
    showStatus('❌ Ошибка: ' + e.message, 'error');
  }
}

function initFilters() {
  const els = getElements();
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
  initUpload();
  initGeneration();
  initFilters();
  await loadFrames();
}

document.addEventListener('DOMContentLoaded', init);
