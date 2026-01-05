/**
 * Universe Editor
 * 
 * Handles reference upload, AI generation, and universe management.
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let referenceImages = []; // Array of { file, dataUrl, mimeType, base64 }
let currentUniverse = null;
let universeOptions = null;
let savedUniverses = [];

// ═══════════════════════════════════════════════════════════════
// ELEMENTS
// ═══════════════════════════════════════════════════════════════

function getElements() {
  return {
    uploadZone: document.getElementById('upload-zone'),
    fileInput: document.getElementById('file-input'),
    refsPreview: document.getElementById('refs-preview'),
    userNotes: document.getElementById('user-notes'),
    btnGenerate: document.getElementById('btn-generate'),
    btnClear: document.getElementById('btn-clear'),
    btnSave: document.getElementById('btn-save'),
    btnCopyPrompt: document.getElementById('btn-copy-prompt'),
    status: document.getElementById('status'),
    resultPanel: document.getElementById('result-panel'),
    resultTitle: document.getElementById('result-title'),
    resultDesc: document.getElementById('result-desc'),
    promptPreview: document.getElementById('prompt-preview'),
    paramsContainer: document.getElementById('params-container'),
    universeListContainer: document.getElementById('universe-list-container'),
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
  status.textContent = message;
  status.className = `status-message ${type}`;
  status.style.display = 'block';
}

function hideStatus() {
  const { status } = getElements();
  status.style.display = 'none';
}

function formatParamName(name) {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^./, s => s.toUpperCase());
}

function formatParamValue(value) {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'string') {
    return value.replace(/_/g, ' ');
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return String(value);
}

// ═══════════════════════════════════════════════════════════════
// FILE HANDLING
// ═══════════════════════════════════════════════════════════════

async function addFiles(files) {
  const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  
  for (const file of validFiles) {
    if (referenceImages.length >= 10) break;
    
    try {
      const dataUrl = await readFileAsDataURL(file);
      referenceImages.push({
        file,
        dataUrl,
        mimeType: getMimeType(dataUrl),
        base64: dataUrlToBase64(dataUrl)
      });
    } catch (e) {
      console.error('Failed to read file:', e);
    }
  }
  
  renderRefsPreview();
  updateGenerateButton();
}

function removeRef(index) {
  referenceImages.splice(index, 1);
  renderRefsPreview();
  updateGenerateButton();
}

function clearRefs() {
  referenceImages = [];
  renderRefsPreview();
  updateGenerateButton();
  hideStatus();
  
  const { resultPanel, userNotes } = getElements();
  resultPanel.style.display = 'none';
  userNotes.value = '';
  currentUniverse = null;
}

function renderRefsPreview() {
  const { refsPreview } = getElements();
  
  if (referenceImages.length === 0) {
    refsPreview.innerHTML = '';
    return;
  }
  
  refsPreview.innerHTML = referenceImages.map((img, idx) => `
    <div class="ref-thumb">
      <img src="${img.dataUrl}" alt="Reference ${idx + 1}">
      <button type="button" class="ref-thumb-remove" data-index="${idx}">×</button>
    </div>
  `).join('');
  
  // Add remove handlers
  refsPreview.querySelectorAll('.ref-thumb-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index, 10);
      removeRef(index);
    });
  });
}

function updateGenerateButton() {
  const { btnGenerate } = getElements();
  btnGenerate.disabled = referenceImages.length === 0;
}

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateUniverse() {
  const { userNotes, btnGenerate } = getElements();
  
  if (referenceImages.length === 0) {
    showStatus('Загрузи хотя бы один референс', 'error');
    return;
  }
  
  btnGenerate.disabled = true;
  showStatus('🔮 Анализирую референсы с помощью AI...', 'loading');
  
  try {
    const images = referenceImages.map(img => ({
      mimeType: img.mimeType,
      base64: img.base64
    }));
    
    const response = await fetch('/api/universes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images,
        notes: userNotes.value || '',
        save: false
      })
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Failed to generate universe');
    }
    
    currentUniverse = data.data;
    showStatus('✅ Вселенная сгенерирована! Проверь параметры и сохрани.', 'success');
    renderResult();
    
  } catch (e) {
    console.error('Generate error:', e);
    showStatus(`❌ Ошибка: ${e.message}`, 'error');
  } finally {
    btnGenerate.disabled = referenceImages.length === 0;
  }
}

// ═══════════════════════════════════════════════════════════════
// RESULT RENDERING
// ═══════════════════════════════════════════════════════════════

async function renderResult() {
  if (!currentUniverse) return;
  
  const { 
    resultPanel, resultTitle, resultDesc, 
    promptPreview, paramsContainer 
  } = getElements();
  
  resultPanel.style.display = 'block';
  resultTitle.textContent = currentUniverse.label || 'Новая вселенная';
  resultDesc.textContent = currentUniverse.shortDescription || '';
  
  // Get prompt block
  try {
    // Generate prompt locally from the universe object
    const promptBlock = generatePromptBlock(currentUniverse);
    promptPreview.textContent = promptBlock;
  } catch (e) {
    promptPreview.textContent = 'Промпт будет доступен после сохранения';
  }
  
  // Render parameter sections
  const sections = [
    { key: 'capture', title: '1. Capture / Medium' },
    { key: 'light', title: '2. Light Physics' },
    { key: 'color', title: '3. Color Science' },
    { key: 'texture', title: '4. Texture & Materiality' },
    { key: 'optical', title: '5. Optical Imperfections' },
    { key: 'composition', title: '6. Compositional Feel' },
    { key: 'postProcess', title: '7. Post-Process Philosophy' },
    { key: 'era', title: '8. Era & Visual Context' },
    { key: 'defaultFrameParams', title: '9. Default Frame Params' }
  ];
  
  let html = sections.map(section => {
    const data = currentUniverse[section.key] || {};
    const params = Object.entries(data).filter(([k, v]) => v !== undefined && v !== null);
    
    if (params.length === 0) return '';
    
    return `
      <div class="param-section">
        <div class="param-section-title">${section.title}</div>
        <div class="param-grid">
          ${params.map(([key, value]) => {
            if (Array.isArray(value)) {
              return `
                <div class="param-field">
                  <label>${formatParamName(key)}</label>
                  <div class="param-value array">
                    ${value.map(v => `<span class="param-tag">${formatParamValue(v)}</span>`).join('')}
                  </div>
                </div>
              `;
            }
            return `
              <div class="param-field">
                <label>${formatParamName(key)}</label>
                <div class="param-value">${formatParamValue(value)}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
  
  // Render locations
  if (currentUniverse.locations && currentUniverse.locations.length > 0) {
    html += `
      <div class="param-section">
        <div class="param-section-title">10. Locations (${currentUniverse.locations.length})</div>
        <div class="locations-grid">
          ${currentUniverse.locations.map(loc => `
            <div class="location-card">
              <div class="location-card-header">
                <span class="location-category">${loc.category || 'urban'}</span>
                <strong>${loc.label}</strong>
              </div>
              <div class="location-card-desc">${loc.description || ''}</div>
              ${loc.promptSnippet ? `<div class="location-card-prompt">${loc.promptSnippet}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  paramsContainer.innerHTML = html;
}

function generatePromptBlock(universe) {
  if (!universe) return '';
  
  const lines = [];
  
  // CAPTURE
  if (universe.capture) {
    const c = universe.capture;
    const parts = [];
    if (c.mediumType) parts.push(`${c.mediumType} photography`);
    if (c.cameraSystem) parts.push(`shot on ${c.cameraSystem}`);
    if (c.grainStructure && c.grainStructure !== 'none') parts.push(`${c.grainStructure} grain`);
    if (c.scanArtifacts?.length && !c.scanArtifacts.includes('none')) {
      parts.push(`scan artifacts: ${c.scanArtifacts.join(', ')}`);
    }
    if (parts.length) lines.push(`CAPTURE: ${parts.join('; ')}.`);
  }
  
  // LIGHT
  if (universe.light) {
    const l = universe.light;
    const parts = [];
    if (l.primaryLightType) parts.push(l.primaryLightType.replace(/_/g, ' '));
    if (l.flashCharacter) parts.push(`${l.flashCharacter} flash`);
    if (l.shadowBehavior) parts.push(`${l.shadowBehavior.replace(/_/g, ' ')} shadows`);
    if (l.lightImperfections?.length && !l.lightImperfections.includes('none')) {
      parts.push(`imperfections: ${l.lightImperfections.join(', ').replace(/_/g, ' ')}`);
    }
    if (parts.length) lines.push(`LIGHT: ${parts.join('; ')}.`);
  }
  
  // COLOR
  if (universe.color) {
    const cl = universe.color;
    const parts = [];
    if (cl.baseColorCast) parts.push(`${cl.baseColorCast.replace(/_/g, ' ')} cast`);
    if (cl.dominantPalette) parts.push(`${cl.dominantPalette.replace(/_/g, ' ')} palette`);
    if (cl.accentColors?.length) parts.push(`accents: ${cl.accentColors.join(', ')}`);
    if (cl.skinToneRendering) parts.push(`skin: ${cl.skinToneRendering.replace(/_/g, ' ')}`);
    if (parts.length) lines.push(`COLOR: ${parts.join('; ')}.`);
  }
  
  // TEXTURE
  if (universe.texture) {
    const t = universe.texture;
    const parts = [];
    if (t.surfaceResponse) parts.push(`${t.surfaceResponse} surfaces`);
    if (t.materialTruthVisible) parts.push('real fabric texture visible');
    if (t.skinTextureVisible) parts.push('skin pores and texture visible');
    if (parts.length) lines.push(`TEXTURE: ${parts.join('; ')}.`);
  }
  
  // OPTICAL
  if (universe.optical) {
    const o = universe.optical;
    const parts = [];
    if (o.focusAccuracy && o.focusAccuracy !== 'perfect') parts.push(`${o.focusAccuracy.replace(/_/g, ' ')} focus`);
    if (o.vignetting && o.vignetting !== 'none') parts.push(`${o.vignetting} vignette`);
    if (o.halation && o.halation !== 'none') parts.push(`${o.halation} halation`);
    if (o.chromaticAberration && o.chromaticAberration !== 'none') parts.push(`${o.chromaticAberration} chromatic aberration`);
    if (parts.length) lines.push(`OPTICAL: ${parts.join('; ')}.`);
  }
  
  // COMPOSITION
  if (universe.composition) {
    const comp = universe.composition;
    const parts = [];
    if (comp.editorialBias) parts.push(`${comp.editorialBias.replace(/_/g, ' ')} feel`);
    if (comp.horizonBehavior && comp.horizonBehavior !== 'level') parts.push(`horizon ${comp.horizonBehavior.replace(/_/g, ' ')}`);
    if (parts.length) lines.push(`COMPOSITION: ${parts.join('; ')}.`);
  }
  
  // POST-PROCESS
  if (universe.postProcess) {
    const pp = universe.postProcess;
    const parts = [];
    if (pp.retouchingLevel) parts.push(`${pp.retouchingLevel.replace(/_/g, ' ')} retouching`);
    if (pp.skinSmoothing === false) parts.push('NO skin smoothing');
    if (pp.hdrForbidden) parts.push('NO HDR');
    if (pp.aiArtifactsPrevention) parts.push('NO plastic skin, NO CGI clarity');
    if (parts.length) lines.push(`POST-PROCESS: ${parts.join('; ')}.`);
  }
  
  // ERA
  if (universe.era) {
    const e = universe.era;
    const parts = [];
    if (e.eraReference) parts.push(e.eraReference.replace(/_/g, ' '));
    if (e.editorialReference) parts.push(`${e.editorialReference.replace(/_/g, ' ')} editorial`);
    if (e.printBehavior) parts.push(e.printBehavior.replace(/_/g, ' '));
    if (parts.length) lines.push(`ERA: ${parts.join('; ')}.`);
  }
  
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// SAVE & ACTIONS
// ═══════════════════════════════════════════════════════════════

async function saveUniverse() {
  if (!currentUniverse) return;
  
  showStatus('💾 Сохраняю вселенную...', 'loading');
  
  try {
    const response = await fetch('/api/universes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentUniverse)
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      throw new Error(data.errors?.join(', ') || data.error || 'Failed to save');
    }
    
    currentUniverse = data.data;
    showStatus('✅ Вселенная сохранена!', 'success');
    await loadUniverseList();
    
  } catch (e) {
    console.error('Save error:', e);
    showStatus(`❌ Ошибка сохранения: ${e.message}`, 'error');
  }
}

async function copyPrompt() {
  if (!currentUniverse) return;
  
  const promptBlock = generatePromptBlock(currentUniverse);
  
  try {
    await navigator.clipboard.writeText(promptBlock);
    showStatus('📋 Промпт скопирован!', 'success');
    setTimeout(hideStatus, 2000);
  } catch (e) {
    console.error('Copy failed:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// UNIVERSE LIST
// ═══════════════════════════════════════════════════════════════

async function loadUniverseList() {
  try {
    const response = await fetch('/api/universes');
    const data = await response.json();
    
    if (data.ok && Array.isArray(data.data)) {
      savedUniverses = data.data;
      renderUniverseList();
    }
  } catch (e) {
    console.error('Failed to load universes:', e);
  }
}

function renderUniverseList() {
  const { universeListContainer } = getElements();
  
  if (savedUniverses.length === 0) {
    universeListContainer.innerHTML = `
      <div class="empty-list">
        <div class="empty-list-icon">🌌</div>
        <div>Пока нет сохранённых вселенных</div>
      </div>
    `;
    return;
  }
  
  universeListContainer.innerHTML = savedUniverses.map(u => `
    <div class="universe-card" data-id="${u.id}">
      <div class="universe-card-info">
        <div class="universe-card-title">${u.label || u.id}</div>
        <div class="universe-card-desc">${u.shortDescription || 'Нет описания'}</div>
      </div>
      <div class="universe-card-actions">
        <button type="button" class="icon-btn" data-action="load" data-id="${u.id}" title="Загрузить">
          📂
        </button>
        <button type="button" class="icon-btn danger" data-action="delete" data-id="${u.id}" title="Удалить">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
  
  // Add event handlers
  universeListContainer.querySelectorAll('[data-action="load"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await loadUniverse(btn.dataset.id);
    });
  });
  
  universeListContainer.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Удалить эту вселенную?')) {
        await deleteUniverse(btn.dataset.id);
      }
    });
  });
}

async function loadUniverse(id) {
  try {
    const response = await fetch(`/api/universes/${encodeURIComponent(id)}`);
    const data = await response.json();
    
    if (data.ok && data.data) {
      currentUniverse = data.data;
      renderResult();
      showStatus('📂 Вселенная загружена', 'success');
      setTimeout(hideStatus, 2000);
    }
  } catch (e) {
    console.error('Load error:', e);
    showStatus(`❌ Ошибка загрузки: ${e.message}`, 'error');
  }
}

async function deleteUniverse(id) {
  try {
    const response = await fetch(`/api/universes/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.ok) {
      showStatus('🗑️ Вселенная удалена', 'success');
      await loadUniverseList();
      
      // Clear result if deleted current
      if (currentUniverse && currentUniverse.id === id) {
        currentUniverse = null;
        const { resultPanel } = getElements();
        resultPanel.style.display = 'none';
      }
      
      setTimeout(hideStatus, 2000);
    }
  } catch (e) {
    console.error('Delete error:', e);
    showStatus(`❌ Ошибка удаления: ${e.message}`, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
// INIT
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

function initDragDrop() {
  const { uploadZone, fileInput } = getElements();
  
  // Click to upload
  fileInput.addEventListener('change', (e) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  });
  
  // Drag & drop
  ['dragenter', 'dragover'].forEach(evt => {
    uploadZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.add('dragover');
    });
  });
  
  ['dragleave', 'dragend'].forEach(evt => {
    uploadZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove('dragover');
    });
  });
  
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.remove('dragover');
    
    if (e.dataTransfer?.files) {
      addFiles(e.dataTransfer.files);
    }
  });
  
  // Paste (Cmd+V / Ctrl+V)
  document.addEventListener('paste', (e) => {
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
      addFiles(imageFiles);
    }
  });
}

function initButtons() {
  const { btnGenerate, btnClear, btnSave, btnCopyPrompt } = getElements();
  
  btnGenerate.addEventListener('click', generateUniverse);
  btnClear.addEventListener('click', clearRefs);
  btnSave.addEventListener('click', saveUniverse);
  btnCopyPrompt.addEventListener('click', copyPrompt);
}

async function init() {
  checkHealth();
  initDragDrop();
  initButtons();
  await loadUniverseList();
}

document.addEventListener('DOMContentLoaded', init);

