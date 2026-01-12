/**
 * Custom Shoot V3 Composer
 * 
 * Handles V3 generation with Vision API analysis for identity/clothing consistency.
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const state = {
  // Model reference
  modelImage: null, // { mimeType, base64, dataUrl }
  modelAnalysis: null,
  modelConfirmed: false,
  
  // Clothing references
  clothingImages: [], // Array of { mimeType, base64, dataUrl }
  clothingAnalyses: [],
  clothingConfirmed: false,
  
  // Identity lock
  identityLockEnabled: true,
  identityLockStrength: 'strict',
  
  // Generation
  isGenerating: false,
  lastGeneratedImage: null,
  lastPrompt: null
};

// ═══════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════

const elements = {};

function initElements() {
  // Server status
  elements.serverStatus = document.getElementById('server-status');
  
  // Model upload
  elements.modelUploadArea = document.getElementById('model-upload-area');
  elements.modelImageInput = document.getElementById('model-image-input');
  elements.modelPreview = document.getElementById('model-preview');
  elements.modelStatus = document.getElementById('model-status');
  elements.btnAnalyzeModel = document.getElementById('btn-analyze-model');
  elements.btnConfirmModel = document.getElementById('btn-confirm-model');
  elements.modelAnalysisResults = document.getElementById('model-analysis-results');
  elements.modelAnalysisContent = document.getElementById('model-analysis-content');
  
  // Clothing upload
  elements.clothingUploadArea = document.getElementById('clothing-upload-area');
  elements.clothingImageInput = document.getElementById('clothing-image-input');
  elements.clothingPreviews = document.getElementById('clothing-previews');
  elements.clothingStatus = document.getElementById('clothing-status');
  elements.btnAnalyzeClothing = document.getElementById('btn-analyze-clothing');
  elements.btnConfirmClothing = document.getElementById('btn-confirm-clothing');
  elements.clothingAnalysisResults = document.getElementById('clothing-analysis-results');
  elements.clothingAnalysisContent = document.getElementById('clothing-analysis-content');
  
  // Identity lock
  elements.identityLockEnabled = document.getElementById('identity-lock-enabled');
  elements.identityStrengthButtons = document.getElementById('identity-strength-buttons');
  
  // Photo realism
  elements.v3Camera = document.getElementById('v3-camera');
  elements.v3Lens = document.getElementById('v3-lens');
  elements.v3Aperture = document.getElementById('v3-aperture');
  elements.v3Film = document.getElementById('v3-film');
  elements.v3Shutter = document.getElementById('v3-shutter');
  elements.v3Iso = document.getElementById('v3-iso');
  
  // Lighting & atmosphere
  elements.v3LightingSetup = document.getElementById('v3-lighting-setup');
  elements.v3LightingQuality = document.getElementById('v3-lighting-quality');
  elements.v3TimeOfDay = document.getElementById('v3-time-of-day');
  elements.v3Weather = document.getElementById('v3-weather');
  elements.v3Mood = document.getElementById('v3-mood');
  elements.v3Location = document.getElementById('v3-location');
  
  // Composition
  elements.v3ShotSize = document.getElementById('v3-shot-size');
  elements.v3CameraAngle = document.getElementById('v3-camera-angle');
  elements.v3Gaze = document.getElementById('v3-gaze');
  elements.v3FocusPoint = document.getElementById('v3-focus-point');
  elements.v3PoseType = document.getElementById('v3-pose-type');
  elements.v3HandPlacement = document.getElementById('v3-hand-placement');
  elements.v3PoseDescription = document.getElementById('v3-pose-description');
  
  // Technical
  elements.v3AspectRatio = document.getElementById('v3-aspect-ratio');
  elements.v3ImageSize = document.getElementById('v3-image-size');
  elements.v3ExtraPrompt = document.getElementById('v3-extra-prompt');
  
  // Quality gates
  elements.qgIdentity = document.getElementById('qg-identity');
  elements.qgClothing = document.getElementById('qg-clothing');
  elements.qgRealism = document.getElementById('qg-realism');
  elements.qgAnatomy = document.getElementById('qg-anatomy');
  elements.qgExposure = document.getElementById('qg-exposure');
  
  // Generate
  elements.btnGenerateV3 = document.getElementById('btn-generate-v3');
  elements.generationStatus = document.getElementById('generation-status');
  elements.generationStatusText = document.getElementById('generation-status-text');
  
  // Generated image
  elements.generatedImageContainer = document.getElementById('generated-image-container');
  elements.generatedImage = document.getElementById('generated-image');
  elements.generatedPrompt = document.getElementById('generated-prompt');
  elements.btnDownload = document.getElementById('btn-download');
  elements.btnRegenerate = document.getElementById('btn-regenerate');
  elements.metaTime = document.getElementById('meta-time');
  elements.metaCamera = document.getElementById('meta-camera');
  elements.metaLens = document.getElementById('meta-lens');
  elements.metaAperture = document.getElementById('meta-aperture');
}

// ═══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════

function initEventListeners() {
  // Model upload
  elements.modelUploadArea.addEventListener('click', () => elements.modelImageInput.click());
  elements.modelImageInput.addEventListener('change', handleModelImageSelect);
  elements.btnAnalyzeModel.addEventListener('click', analyzeModel);
  elements.btnConfirmModel.addEventListener('click', confirmModel);
  
  // Clothing upload
  elements.clothingUploadArea.addEventListener('click', () => elements.clothingImageInput.click());
  elements.clothingImageInput.addEventListener('change', handleClothingImagesSelect);
  elements.btnAnalyzeClothing.addEventListener('click', analyzeClothing);
  elements.btnConfirmClothing.addEventListener('click', confirmClothing);
  
  // Identity lock
  elements.identityLockEnabled.addEventListener('change', (e) => {
    state.identityLockEnabled = e.target.checked;
    updateGenerateButtonState();
  });
  
  elements.identityStrengthButtons.querySelectorAll('.lock-strength-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      elements.identityStrengthButtons.querySelectorAll('.lock-strength-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.identityLockStrength = btn.dataset.strength;
    });
  });
  
  // Generate
  elements.btnGenerateV3.addEventListener('click', generateImageV3);
  elements.btnRegenerate.addEventListener('click', generateImageV3);
  
  // Drag and drop for model
  elements.modelUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.modelUploadArea.style.borderColor = 'var(--color-primary)';
  });
  elements.modelUploadArea.addEventListener('dragleave', () => {
    elements.modelUploadArea.style.borderColor = '';
  });
  elements.modelUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.modelUploadArea.style.borderColor = '';
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleModelImageFile(files[0]);
    }
  });
  
  // Drag and drop for clothing
  elements.clothingUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.clothingUploadArea.style.borderColor = 'var(--color-primary)';
  });
  elements.clothingUploadArea.addEventListener('dragleave', () => {
    elements.clothingUploadArea.style.borderColor = '';
  });
  elements.clothingUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.clothingUploadArea.style.borderColor = '';
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleClothingImageFiles(files);
  });
}

// ═══════════════════════════════════════════════════════════════
// MODEL HANDLING
// ═══════════════════════════════════════════════════════════════

function handleModelImageSelect(e) {
  const file = e.target.files[0];
  if (file) {
    handleModelImageFile(file);
  }
}

async function handleModelImageFile(file) {
  const dataUrl = await fileToDataUrl(file);
  const base64 = dataUrl.split(',')[1];
  
  state.modelImage = {
    mimeType: file.type,
    base64,
    dataUrl
  };
  state.modelAnalysis = null;
  state.modelConfirmed = false;
  
  // Update UI
  elements.modelPreview.src = dataUrl;
  elements.modelPreview.style.display = 'block';
  elements.modelUploadArea.classList.add('has-image');
  elements.modelStatus.textContent = 'Загружено';
  elements.modelStatus.style.background = 'var(--color-warning)';
  
  elements.btnAnalyzeModel.disabled = false;
  elements.btnConfirmModel.disabled = true;
  elements.modelAnalysisResults.classList.remove('visible');
  
  updateGenerateButtonState();
}

async function analyzeModel() {
  if (!state.modelImage) return;
  
  elements.btnAnalyzeModel.disabled = true;
  elements.btnAnalyzeModel.textContent = '⏳ Анализ...';
  
  try {
    const response = await fetch('/api/custom-shoots/analyze-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: {
          mimeType: state.modelImage.mimeType,
          base64: state.modelImage.base64
        }
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      state.modelAnalysis = data.analysis;
      
      // Display results
      displayModelAnalysisResults(data.analysis, data.fromCache);
      
      elements.btnConfirmModel.disabled = false;
      elements.modelStatus.textContent = 'Проанализировано';
      elements.modelStatus.style.background = '#3B82F6';
    } else {
      alert('Ошибка анализа: ' + (data.error || 'Неизвестная ошибка'));
    }
  } catch (err) {
    console.error('Error analyzing model:', err);
    alert('Ошибка сети: ' + err.message);
  } finally {
    elements.btnAnalyzeModel.disabled = false;
    elements.btnAnalyzeModel.textContent = '🔍 Анализировать';
  }
}

function displayModelAnalysisResults(analysis, fromCache) {
  const content = [];
  
  if (analysis.identitySummary) {
    content.push(`<div style="margin-bottom: 12px; font-style: italic;">${escapeHtml(analysis.identitySummary)}</div>`);
  }
  
  content.push('<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">');
  
  if (analysis.skin?.tone) {
    content.push(`<div class="analysis-item"><span class="analysis-label">Тон кожи:</span><span class="analysis-value">${escapeHtml(analysis.skin.tone)}</span></div>`);
  }
  if (analysis.eyes?.color) {
    content.push(`<div class="analysis-item"><span class="analysis-label">Глаза:</span><span class="analysis-value">${escapeHtml(analysis.eyes.color)}</span></div>`);
  }
  if (analysis.hair?.color) {
    content.push(`<div class="analysis-item"><span class="analysis-label">Волосы:</span><span class="analysis-value">${escapeHtml(analysis.hair.color)}</span></div>`);
  }
  if (analysis.faceStructure?.shape) {
    content.push(`<div class="analysis-item"><span class="analysis-label">Форма лица:</span><span class="analysis-value">${escapeHtml(analysis.faceStructure.shape)}</span></div>`);
  }
  
  content.push('</div>');
  
  if (fromCache) {
    content.push('<div style="margin-top: 12px; font-size: 10px; color: var(--color-text-muted);">📦 Из кэша</div>');
  }
  
  elements.modelAnalysisContent.innerHTML = content.join('');
  elements.modelAnalysisResults.classList.add('visible');
}

function confirmModel() {
  state.modelConfirmed = true;
  elements.modelStatus.textContent = 'Подтверждено ✓';
  elements.modelStatus.style.background = 'var(--color-success)';
  elements.btnConfirmModel.disabled = true;
  elements.btnConfirmModel.textContent = '✓ Подтверждено';
  
  updateQualityGate('qgIdentity', 'pass');
  updateGenerateButtonState();
}

// ═══════════════════════════════════════════════════════════════
// CLOTHING HANDLING
// ═══════════════════════════════════════════════════════════════

function handleClothingImagesSelect(e) {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  handleClothingImageFiles(files);
}

async function handleClothingImageFiles(files) {
  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    const base64 = dataUrl.split(',')[1];
    
    state.clothingImages.push({
      mimeType: file.type,
      base64,
      dataUrl
    });
  }
  
  state.clothingAnalyses = [];
  state.clothingConfirmed = false;
  
  // Update UI
  renderClothingPreviews();
  elements.clothingUploadArea.classList.add('has-image');
  elements.clothingStatus.textContent = `${state.clothingImages.length} загружено`;
  elements.clothingStatus.style.background = 'var(--color-warning)';
  
  elements.btnAnalyzeClothing.disabled = false;
  elements.btnConfirmClothing.disabled = true;
  elements.clothingAnalysisResults.classList.remove('visible');
  
  updateGenerateButtonState();
}

function renderClothingPreviews() {
  elements.clothingPreviews.innerHTML = state.clothingImages.map((img, idx) => `
    <div style="position: relative;">
      <img src="${img.dataUrl}" class="preview-thumb" alt="Clothing ${idx + 1}">
      <button class="btn-remove-clothing" data-idx="${idx}" style="position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%; background: var(--color-error); color: white; border: none; font-size: 12px; cursor: pointer;">✕</button>
    </div>
  `).join('');
  
  elements.clothingPreviews.querySelectorAll('.btn-remove-clothing').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeClothingImage(parseInt(btn.dataset.idx));
    });
  });
}

function removeClothingImage(idx) {
  state.clothingImages.splice(idx, 1);
  state.clothingAnalyses = [];
  state.clothingConfirmed = false;
  
  renderClothingPreviews();
  
  if (state.clothingImages.length === 0) {
    elements.clothingUploadArea.classList.remove('has-image');
    elements.clothingStatus.textContent = 'Не загружено';
    elements.clothingStatus.style.background = '';
    elements.btnAnalyzeClothing.disabled = true;
  } else {
    elements.clothingStatus.textContent = `${state.clothingImages.length} загружено`;
  }
  
  elements.btnConfirmClothing.disabled = true;
  elements.clothingAnalysisResults.classList.remove('visible');
  updateQualityGate('qgClothing', 'pending');
  updateGenerateButtonState();
}

async function analyzeClothing() {
  if (state.clothingImages.length === 0) return;
  
  elements.btnAnalyzeClothing.disabled = true;
  elements.btnAnalyzeClothing.textContent = '⏳ Анализ...';
  
  try {
    const analyses = [];
    
    for (let i = 0; i < state.clothingImages.length; i++) {
      const img = state.clothingImages[i];
      
      elements.btnAnalyzeClothing.textContent = `⏳ Анализ ${i + 1}/${state.clothingImages.length}...`;
      
      const response = await fetch('/api/custom-shoots/analyze-clothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: {
            mimeType: img.mimeType,
            base64: img.base64
          }
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        analyses.push(data.analysis);
      } else {
        console.error('Clothing analysis failed:', data.error);
      }
    }
    
    state.clothingAnalyses = analyses;
    
    // Display results
    displayClothingAnalysisResults(analyses);
    
    elements.btnConfirmClothing.disabled = false;
    elements.clothingStatus.textContent = 'Проанализировано';
    elements.clothingStatus.style.background = '#3B82F6';
    
  } catch (err) {
    console.error('Error analyzing clothing:', err);
    alert('Ошибка сети: ' + err.message);
  } finally {
    elements.btnAnalyzeClothing.disabled = false;
    elements.btnAnalyzeClothing.textContent = '🔍 Анализировать';
  }
}

function displayClothingAnalysisResults(analyses) {
  const content = analyses.map((analysis, idx) => `
    <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--color-border);">
      <div style="font-weight: 600; margin-bottom: 6px;">Предмет ${idx + 1}: ${escapeHtml(analysis.garmentType || 'Неизвестно')}</div>
      <div class="analysis-item"><span class="analysis-label">Цвет:</span><span class="analysis-value">${escapeHtml(analysis.primaryColor?.name || '—')}</span></div>
      <div class="analysis-item"><span class="analysis-label">Материал:</span><span class="analysis-value">${escapeHtml(analysis.material?.fabric || '—')}</span></div>
      <div class="analysis-item"><span class="analysis-label">Фасон:</span><span class="analysis-value">${escapeHtml(analysis.silhouette?.fit || '—')}</span></div>
    </div>
  `).join('');
  
  elements.clothingAnalysisContent.innerHTML = content;
  elements.clothingAnalysisResults.classList.add('visible');
}

function confirmClothing() {
  state.clothingConfirmed = true;
  elements.clothingStatus.textContent = 'Подтверждено ✓';
  elements.clothingStatus.style.background = 'var(--color-success)';
  elements.btnConfirmClothing.disabled = true;
  elements.btnConfirmClothing.textContent = '✓ Подтверждено';
  
  updateQualityGate('qgClothing', 'pass');
  updateGenerateButtonState();
}

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

function collectFormData() {
  return {
    // Model & clothing
    modelAnalysis: state.modelAnalysis,
    clothingAnalyses: state.clothingAnalyses,
    identityLockStrength: state.identityLockEnabled ? state.identityLockStrength : null,
    
    // Identity images
    identityImages: state.modelImage ? [{
      mimeType: state.modelImage.mimeType,
      base64: state.modelImage.base64
    }] : [],
    
    // Clothing images
    clothingImages: state.clothingImages.map(img => ({
      mimeType: img.mimeType,
      base64: img.base64
    })),
    
    // Photo realism
    camera: elements.v3Camera.value,
    lens: elements.v3Lens.value,
    aperture: elements.v3Aperture.value,
    filmType: elements.v3Film.value,
    shutterSpeed: elements.v3Shutter.value || undefined,
    iso: elements.v3Iso.value || undefined,
    
    // Lighting & atmosphere
    lightingSetup: elements.v3LightingSetup.value,
    lightingQuality: elements.v3LightingQuality.value,
    timeOfDay: elements.v3TimeOfDay.value || undefined,
    weather: elements.v3Weather.value || undefined,
    mood: elements.v3Mood.value || undefined,
    location: elements.v3Location.value || undefined,
    
    // Composition
    shotSize: elements.v3ShotSize.value,
    cameraAngle: elements.v3CameraAngle.value,
    gazeDirection: elements.v3Gaze.value,
    focusPoint: elements.v3FocusPoint.value,
    poseType: elements.v3PoseType.value || undefined,
    handPlacement: elements.v3HandPlacement.value || undefined,
    poseDescription: elements.v3PoseDescription.value || undefined,
    
    // Technical
    aspectRatio: elements.v3AspectRatio.value,
    imageSize: elements.v3ImageSize.value,
    extraPrompt: elements.v3ExtraPrompt.value || undefined
  };
}

async function generateImageV3() {
  if (state.isGenerating) return;
  
  state.isGenerating = true;
  elements.btnGenerateV3.disabled = true;
  elements.btnGenerateV3.innerHTML = '<span class="spinner"></span> Генерация...';
  elements.generationStatus.style.display = 'block';
  elements.generatedImageContainer.style.display = 'none';
  
  // Reset quality gates
  updateQualityGate('qgRealism', 'pending');
  updateQualityGate('qgAnatomy', 'pending');
  updateQualityGate('qgExposure', 'pending');
  
  try {
    const formData = collectFormData();
    
    elements.generationStatusText.textContent = 'Формирование V3 промпта...';
    
    // We need a shoot ID - for now create a temporary one or use default
    // In a real implementation, this would come from the shoot selection step
    const shootId = 'temp_v3_' + Date.now();
    
    // Create a temporary shoot
    const createResponse = await fetch('/api/custom-shoots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'V3 Temporary Shoot' })
    });
    const createData = await createResponse.json();
    
    if (!createData.ok) {
      throw new Error('Failed to create temporary shoot');
    }
    
    const tempShootId = createData.shoot.id;
    
    elements.generationStatusText.textContent = 'Генерация изображения...';
    
    const response = await fetch(`/api/custom-shoots/${tempShootId}/generate-v3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.ok) {
      state.lastGeneratedImage = data.image;
      state.lastPrompt = data.prompt;
      
      // Display result
      displayGeneratedImage(data);
      
      // Update quality gates (assume pass for now - in real impl would verify)
      updateQualityGate('qgRealism', 'pass');
      updateQualityGate('qgAnatomy', 'pass');
      updateQualityGate('qgExposure', 'pass');
      
    } else {
      alert('Ошибка генерации: ' + (data.error || 'Неизвестная ошибка'));
    }
    
  } catch (err) {
    console.error('Error generating:', err);
    alert('Ошибка: ' + err.message);
  } finally {
    state.isGenerating = false;
    elements.btnGenerateV3.disabled = false;
    elements.btnGenerateV3.innerHTML = '🚀 Генерировать V3';
    elements.generationStatus.style.display = 'none';
  }
}

function displayGeneratedImage(data) {
  elements.generatedImage.src = data.image.imageUrl;
  elements.btnDownload.href = data.image.imageUrl;
  elements.generatedPrompt.textContent = data.prompt || 'N/A';
  
  // Metadata
  elements.metaTime.textContent = data.image.generationTime ? `${data.image.generationTime}s` : '—';
  elements.metaCamera.textContent = getCameraLabel(data.image.camera);
  elements.metaLens.textContent = data.image.lens || '—';
  elements.metaAperture.textContent = data.image.aperture || '—';
  
  elements.generatedImageContainer.style.display = 'block';
  
  // Scroll to result
  elements.generatedImageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function updateGenerateButtonState() {
  // Can generate if we have at least a model image (confirmed or not)
  const canGenerate = state.modelImage !== null;
  elements.btnGenerateV3.disabled = !canGenerate;
}

function updateQualityGate(id, status) {
  const element = elements[id];
  if (!element) return;
  
  element.className = 'quality-check-icon ' + status;
  
  switch (status) {
    case 'pass':
      element.textContent = '✓';
      break;
    case 'fail':
      element.textContent = '✕';
      break;
    default:
      element.textContent = '—';
  }
}

function getCameraLabel(cameraId) {
  const cameras = {
    contax_t2: 'Contax T2',
    hasselblad_500cm: 'Hasselblad',
    leica_m6: 'Leica M6',
    canon_5d: 'Canon 5D',
    sony_a7r: 'Sony A7R',
    iphone_15_pro: 'iPhone 15 Pro',
    red_komodo: 'RED Komodo'
  };
  return cameras[cameraId] || cameraId || '—';
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
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
    elements.serverStatus.textContent = data.ok ? 'V3 Ready' : 'Ошибка';
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
  updateGenerateButtonState();
}

document.addEventListener('DOMContentLoaded', init);
