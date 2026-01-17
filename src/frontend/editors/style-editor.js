/**
 * Style Editor (V6 AI-Режиссёр)
 * 
 * Frontend logic for creating and managing style presets.
 * Supports AI-powered analysis and refinement via GPT-5.2.
 */

const API_BASE = '/api/styles';
const MODELS_API = '/api/models';
const LOOKS_API = '/api/looks';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let uploadedImages = [];  // Changed to array for multiple images
let currentAnalysis = null;
let currentPreset = null;
let currentVariations = []; // V6: Style variations
let allPresets = [];
let allModels = [];
let allLooks = [];

// ═══════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════

const elements = {
    // Library
    presetList: null,
    btnNewPreset: null,

    // Workbench
    workbenchTitle: null,
    workbenchBody: null,
    workbenchActions: null,

    // Upload State
    stateUpload: null,
    uploadZone: null,
    fileInput: null,
    btnAnalyze: null,
    statusAnalyze: null,

    // Analysis State
    stateAnalysis: null,
    presetName: null,
    techParamsGrid: null,
    naturalPromptText: null,
    antiAiBadges: null,
    refineInput: null,
    btnRefine: null,
    statusRefine: null,
    btnSavePreset: null,
    statusSave: null,

    // Generation
    generationSection: null,
    selectModel: null,
    selectLook: null,
    btnGenerate: null,
    statusGenerate: null,

    // Header
    serverStatus: null,
    btnClearAnalysis: null,

    // Variations (V6 Sub-presets)
    btnAddVariation: null,
    variationsList: null
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    checkServerStatus();
    loadPresets();
    loadModelsAndLooks();
});

function initElements() {
    elements.presetList = document.getElementById('preset-list');
    elements.btnNewPreset = document.getElementById('btn-new-preset');
    elements.workbenchTitle = document.getElementById('workbench-title');
    elements.workbenchBody = document.getElementById('workbench-body');
    elements.workbenchActions = document.getElementById('workbench-actions');

    elements.stateUpload = document.getElementById('state-upload');
    elements.uploadZone = document.getElementById('upload-zone');
    elements.fileInput = document.getElementById('file-input');
    elements.btnAnalyze = document.getElementById('btn-analyze');
    elements.statusAnalyze = document.getElementById('status-analyze');

    elements.stateAnalysis = document.getElementById('state-analysis');
    elements.presetName = document.getElementById('preset-name');
    elements.techParamsGrid = document.getElementById('tech-params-grid');
    elements.naturalPromptText = document.getElementById('natural-prompt-text');
    elements.antiAiBadges = document.getElementById('anti-ai-badges');
    elements.refineInput = document.getElementById('refine-input');
    elements.btnRefine = document.getElementById('btn-refine');
    elements.statusRefine = document.getElementById('status-refine');
    elements.btnSavePreset = document.getElementById('btn-save-preset');
    elements.statusSave = document.getElementById('status-save');

    elements.generationSection = document.getElementById('generation-section');
    elements.selectModel = document.getElementById('select-model');
    elements.selectLook = document.getElementById('select-look');
    elements.btnGenerate = document.getElementById('btn-generate');
    elements.statusGenerate = document.getElementById('status-generate');

    elements.serverStatus = document.getElementById('server-status');
    elements.btnClearAnalysis = document.getElementById('btn-clear-analysis');

    // Variations
    elements.btnAddVariation = document.getElementById('btn-add-variation');
    elements.variationsList = document.getElementById('variations-list');
}

function initEventListeners() {
    // New Preset
    elements.btnNewPreset.addEventListener('click', resetToUploadState);

    // Upload Zone
    elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
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
        if (e.dataTransfer.files.length > 0) {
            handleFilesUpload(Array.from(e.dataTransfer.files));
        }
    });
    elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFilesUpload(Array.from(e.target.files));
        }
    });

    // Paste (Cmd+V)
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
            handleFilesUpload(imageFiles);
        }
    });

    // Analyze
    elements.btnAnalyze.addEventListener('click', analyzeStyle);

    // Clear Analysis
    elements.btnClearAnalysis.addEventListener('click', resetToUploadState);

    // Refine
    elements.btnRefine.addEventListener('click', refineStyle);

    // Save
    elements.btnSavePreset.addEventListener('click', savePreset);

    // Generate
    elements.btnGenerate.addEventListener('click', generateShoot);

    // Variations
    if (elements.btnAddVariation) {
        elements.btnAddVariation.addEventListener('click', addVariation);
    }
}

// ═══════════════════════════════════════════════════════════════
// FILE HANDLING (Multiple Images)
// ═══════════════════════════════════════════════════════════════

async function handleFilesUpload(files) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    for (const file of imageFiles) {
        try {
            const compressed = await compressImage(file);
            uploadedImages.push(compressed);
            console.log(`[StyleEditor] Added: ${Math.round(compressed.base64.length * 0.75 / 1024)}KB`);
        } catch (e) {
            console.error('Failed to process image:', e);
        }
    }

    renderImagesPreview();
    elements.btnAnalyze.disabled = uploadedImages.length === 0;
}

function renderImagesPreview() {
    if (uploadedImages.length === 0) {
        elements.uploadZone.innerHTML = `
            <div class="upload-zone-icon">📷</div>
            <div class="upload-zone-title">Загрузи референсы</div>
            <div class="upload-zone-hint">Перетащи изображения или кликни для выбора (можно несколько)</div>
        `;
        elements.uploadZone.classList.remove('has-images');
        return;
    }

    elements.uploadZone.classList.add('has-images');
    elements.uploadZone.innerHTML = `
        <div class="images-preview-grid">
            ${uploadedImages.map((img, idx) => `
                <div class="image-thumb" data-index="${idx}">
                    <img src="${img.previewUrl}" alt="Ref ${idx + 1}">
                    <button class="image-thumb-remove" data-index="${idx}">✕</button>
                </div>
            `).join('')}
            <div class="upload-zone-add" title="Добавить ещё">+</div>
        </div>
    `;

    // Remove handlers
    elements.uploadZone.querySelectorAll('.image-thumb-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(e.target.dataset.index);
            uploadedImages.splice(idx, 1);
            renderImagesPreview();
            elements.btnAnalyze.disabled = uploadedImages.length === 0;
        });
    });

    // Add more button
    const addBtn = elements.uploadZone.querySelector('.upload-zone-add');
    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            elements.fileInput.click();
        });
    }
}

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const MAX_SIZE = 1600;
        const QUALITY = 0.85;

        img.onload = () => {
            let { width, height } = img;
            if (width > MAX_SIZE || height > MAX_SIZE) {
                const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
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

// ═══════════════════════════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════════════════════════

async function loadPresets() {
    try {
        const response = await fetch(API_BASE);
        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.error || 'Ошибка загрузки');
        }

        allPresets = data.data || [];
        renderPresetList();
    } catch (error) {
        console.error('Load presets error:', error);
        elements.presetList.innerHTML = `
      <div style="padding: 16px; color: #EF4444; font-size: 12px;">
        ❌ ${error.message}
      </div>
    `;
    }
}

async function loadModelsAndLooks() {
    try {
        const [modelsRes, looksRes] = await Promise.all([
            fetch(MODELS_API),
            fetch(LOOKS_API)
        ]);

        const modelsData = await modelsRes.json();
        const looksData = await looksRes.json();

        allModels = modelsData.data || [];
        allLooks = looksData.data || [];

        populateSelects();
    } catch (error) {
        console.error('Load models/looks error:', error);
    }
}

async function analyzeStyle() {
    if (uploadedImages.length === 0) {
        showStatus('statusAnalyze', 'Загрузите хотя бы одно изображение', 'error');
        return;
    }

    showStatus('statusAnalyze', `🔮 Анализируем ${uploadedImages.length} изображение(й) с GPT-5.2...`, 'loading');
    elements.btnAnalyze.disabled = true;

    try {
        // Send first image for now (backend can be extended to handle multiple)
        const response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: {
                    mimeType: uploadedImages[0].mimeType,
                    base64: uploadedImages[0].base64
                },
                // Send additional images as references
                additionalImages: uploadedImages.slice(1).map(img => ({
                    mimeType: img.mimeType,
                    base64: img.base64
                }))
            })
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.error || 'Ошибка анализа');
        }

        currentAnalysis = data.data;
        showAnalysisResult(currentAnalysis);
        hideStatus('statusAnalyze');

    } catch (error) {
        console.error('Analyze error:', error);
        showStatus('statusAnalyze', `❌ ${error.message}`, 'error');
    } finally {
        elements.btnAnalyze.disabled = false;
    }
}

async function refineStyle() {
    const instruction = elements.refineInput.value.trim();
    if (!instruction) {
        showStatus('statusRefine', 'Введите инструкцию', 'error');
        return;
    }

    if (!currentPreset?.id) {
        showStatus('statusRefine', 'Сначала сохраните пресет', 'error');
        return;
    }

    showStatus('statusRefine', '🔄 Уточняем стиль...', 'loading');
    elements.btnRefine.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/${currentPreset.id}/refine`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instruction })
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.error || 'Ошибка уточнения');
        }

        // Update UI with refined data
        currentPreset = data.data;
        currentAnalysis = {
            technicalParams: currentPreset.technicalParams,
            naturalPrompt: currentPreset.naturalPrompt,
            antiAiDirectives: currentPreset.antiAiDirectives,
            suggestedName: currentPreset.name
        };

        showAnalysisResult(currentAnalysis);
        elements.presetName.value = currentPreset.name;

        showStatus('statusRefine', `✅ Уточнено: ${data.refinementNote || 'готово'}`, 'success');
        elements.refineInput.value = '';

        // Reload presets
        await loadPresets();

    } catch (error) {
        console.error('Refine error:', error);
        showStatus('statusRefine', `❌ ${error.message}`, 'error');
    } finally {
        elements.btnRefine.disabled = false;
    }
}

async function savePreset() {
    const name = elements.presetName.value.trim();
    if (!name) {
        showStatus('statusSave', 'Введите название пресета', 'error');
        return;
    }

    if (!currentAnalysis) {
        showStatus('statusSave', 'Сначала проанализируйте изображение', 'error');
        return;
    }

    showStatus('statusSave', '💾 Сохраняем...', 'loading');
    elements.btnSavePreset.disabled = true;

    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                technicalParams: currentAnalysis.technicalParams,
                naturalPrompt: currentAnalysis.naturalPrompt,
                antiAiDirectives: currentAnalysis.antiAiDirectives,
                variations: currentVariations, // V6: Include variations
                // Save first image as reference
                referenceImage: uploadedImages.length > 0 ? {
                    mimeType: uploadedImages[0].mimeType,
                    base64: uploadedImages[0].base64
                } : null
            })
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.error || data.errors?.join(', ') || 'Ошибка сохранения');
        }

        currentPreset = data.data;
        showStatus('statusSave', '✅ Пресет сохранён!', 'success');

        // Show generation section
        elements.generationSection.classList.add('visible');

        // Reload presets
        await loadPresets();

        // Select the new preset in the list
        selectPreset(currentPreset.id);

    } catch (error) {
        console.error('Save error:', error);
        showStatus('statusSave', `❌ ${error.message}`, 'error');
    } finally {
        elements.btnSavePreset.disabled = false;
    }
}

async function generateShoot() {
    const modelId = elements.selectModel.value;
    const lookId = elements.selectLook.value;

    if (!modelId) {
        showStatus('statusGenerate', 'Выберите модель', 'error');
        return;
    }

    if (!currentPreset?.id) {
        showStatus('statusGenerate', 'Сохраните пресет перед генерацией', 'error');
        return;
    }

    showStatus('statusGenerate', '🎬 Генерируем съёмку... (это может занять минуту)', 'loading');
    elements.btnGenerate.disabled = true;

    try {
        // TODO: Implement V6 generation endpoint
        // For now, show a placeholder message
        await new Promise(r => setTimeout(r, 2000));
        showStatus('statusGenerate', '🚧 Генерация V6 в разработке. Пресет готов к использованию!', 'success');

    } catch (error) {
        console.error('Generate error:', error);
        showStatus('statusGenerate', `❌ ${error.message}`, 'error');
    } finally {
        elements.btnGenerate.disabled = false;
    }
}

// ═══════════════════════════════════════════════════════════════
// UI RENDERING
// ═══════════════════════════════════════════════════════════════

function renderPresetList() {
    if (allPresets.length === 0) {
        elements.presetList.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <div style="font-size: 32px; margin-bottom: 8px; opacity: 0.5;">🎨</div>
        <div style="font-size: 12px; color: var(--color-text-muted);">Пресетов пока нет</div>
      </div>
    `;
        return;
    }

    elements.presetList.innerHTML = allPresets.map(preset => `
    <div class="preset-card ${currentPreset?.id === preset.id ? 'selected' : ''}" 
         data-id="${preset.id}">
      <div class="preset-card-preview">
        ${preset.previewUrl
            ? `<img src="${preset.previewUrl}" alt="${escapeHtml(preset.name)}">`
            : '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 24px; opacity: 0.3;">🎨</div>'
        }
      </div>
      <div class="preset-card-name">${escapeHtml(preset.name)}</div>
      <div class="preset-card-meta">v${preset.version || 1}</div>
    </div>
  `).join('');

    // Add click handlers
    elements.presetList.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => selectPreset(card.dataset.id));
    });
}

function selectPreset(id) {
    const preset = allPresets.find(p => p.id === id);
    if (!preset) return;

    currentPreset = preset;
    currentAnalysis = {
        technicalParams: preset.technicalParams,
        naturalPrompt: preset.naturalPrompt,
        antiAiDirectives: preset.antiAiDirectives,
        suggestedName: preset.name
    };

    // Update UI
    elements.workbenchTitle.textContent = `Пресет: ${preset.name}`;
    elements.stateUpload.style.display = 'none';
    elements.stateAnalysis.classList.add('visible');
    elements.presetName.value = preset.name;

    showAnalysisResult(currentAnalysis);

    // Show generation section for saved presets
    elements.generationSection.classList.add('visible');

    // Update selection in list
    renderPresetList();
}

function showAnalysisResult(analysis) {
    // Switch to analysis state
    elements.stateUpload.style.display = 'none';
    elements.stateAnalysis.classList.add('visible');

    // Preset name
    if (analysis.suggestedName && !elements.presetName.value) {
        elements.presetName.value = analysis.suggestedName;
    }

    // Technical parameters
    const params = analysis.technicalParams || {};
    let paramsHtml = '';

    // Flatten nested objects for display
    const flatParams = flattenObject(params);
    for (const [key, value] of Object.entries(flatParams)) {
        paramsHtml += `
      <div class="tech-param-card">
        <div class="tech-param-label">${escapeHtml(key)}</div>
        <div class="tech-param-value">${escapeHtml(String(value))}</div>
      </div>
    `;
    }
    elements.techParamsGrid.innerHTML = paramsHtml || '<div style="color: var(--color-text-muted);">Нет данных</div>';

    // Natural prompt
    elements.naturalPromptText.textContent = analysis.naturalPrompt || '...';

    // Anti-AI directives
    const directives = analysis.antiAiDirectives || [];
    elements.antiAiBadges.innerHTML = directives.map(d =>
        `<span class="anti-ai-badge">🛡️ ${escapeHtml(d)}</span>`
    ).join('');

    // V6: Auto-generated variations from AI
    if (analysis.variations && Array.isArray(analysis.variations)) {
        currentVariations = analysis.variations.map((v, i) => ({
            id: v.id || `var_${i}_${Date.now().toString(36)}`,
            label: v.label || '',
            promptSuffix: v.promptSuffix || ''
        }));
        renderVariations();
    }
}

function resetToUploadState() {
    uploadedImages = [];
    currentAnalysis = null;
    currentPreset = null;

    elements.workbenchTitle.textContent = 'Создание нового пресета';
    elements.stateUpload.style.display = 'block';
    elements.stateAnalysis.classList.remove('visible');
    elements.generationSection.classList.remove('visible');

    elements.uploadZone.innerHTML = `
    <div class="upload-zone-icon">📷</div>
    <div class="upload-zone-title">Загрузи референсы</div>
    <div class="upload-zone-hint">Перетащи изображения или кликни для выбора (можно несколько)</div>
  `;
    elements.uploadZone.classList.remove('has-images');
    elements.btnAnalyze.disabled = true;
    elements.presetName.value = '';
    elements.refineInput.value = '';

    hideStatus('statusAnalyze');
    hideStatus('statusRefine');
    hideStatus('statusSave');
    hideStatus('statusGenerate');

    // Deselect in list
    renderPresetList();
}

function populateSelects() {
    // Models
    elements.selectModel.innerHTML = '<option value="">Выберите модель...</option>' +
        allModels.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');

    // Looks
    elements.selectLook.innerHTML = '<option value="">Выберите лук...</option>' +
        allLooks.map(l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// VARIATIONS (V6 Sub-presets)
// ═══════════════════════════════════════════════════════════════

function addVariation() {
    const id = 'var_' + Date.now().toString(36);
    currentVariations.push({
        id,
        label: '',
        promptSuffix: ''
    });
    renderVariations();
}

function removeVariation(varId) {
    currentVariations = currentVariations.filter(v => v.id !== varId);
    renderVariations();
}

function updateVariation(varId, field, value) {
    const variation = currentVariations.find(v => v.id === varId);
    if (variation) {
        variation[field] = value;
    }
}

function renderVariations() {
    if (!elements.variationsList) return;

    if (currentVariations.length === 0) {
        elements.variationsList.innerHTML = `
            <div class="empty-variations" style="font-size: 12px; color: var(--color-text-muted); padding: 12px; background: var(--color-bg-secondary); border-radius: 8px; text-align: center;">
                Вариаций пока нет. Добавьте вариации для разных версий стиля (Ч/Б, День, Вечер и т.д.)
            </div>
        `;
        return;
    }

    elements.variationsList.innerHTML = currentVariations.map(v => `
        <div class="variation-item" data-id="${v.id}" style="background: var(--color-bg-secondary); border-radius: 8px; padding: 12px; display: flex; gap: 12px; align-items: flex-start;">
            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                <input type="text" class="variation-label form-input" placeholder="Название (напр. Ч/Б)" value="${escapeHtml(v.label || '')}" style="font-size: 12px; padding: 6px 10px;">
                <input type="text" class="variation-suffix form-input" placeholder="Модификатор промпта (напр. black and white, high contrast)" value="${escapeHtml(v.promptSuffix || '')}" style="font-size: 11px; padding: 6px 10px;">
            </div>
            <button class="btn-remove-variation" style="background: none; border: none; color: var(--color-error); cursor: pointer; font-size: 16px; padding: 4px;">×</button>
        </div>
    `).join('');

    // Attach event listeners
    elements.variationsList.querySelectorAll('.variation-item').forEach(item => {
        const id = item.dataset.id;
        item.querySelector('.variation-label').addEventListener('input', (e) => updateVariation(id, 'label', e.target.value));
        item.querySelector('.variation-suffix').addEventListener('input', (e) => updateVariation(id, 'promptSuffix', e.target.value));
        item.querySelector('.btn-remove-variation').addEventListener('click', () => removeVariation(id));
    });
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function flattenObject(obj, prefix = '') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(result, flattenObject(value, newKey));
        } else {
            result[newKey] = value;
        }
    }
    return result;
}

function showStatus(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;

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
