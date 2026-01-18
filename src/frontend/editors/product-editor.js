/**
 * Product Shoot Editor Logic
 */

// State
const state = {
    options: null,
    optionsV2: null,  // NEW: V2 параметры
    history: [],
    currentShoot: null,
    // V2 Mode
    v2Mode: 'flatlay',  // catalog | flatlay | lifestyle | custom
    v2Params: {
        background: 'white',      // для catalog
        surface: 'wood_light',    // для flatlay
        surfaceCustom: '',
        arrangement: 'natural',
        atmosphere: 'warm',       // для lifestyle
        customPrompt: '',         // для custom
        // NEW V2.1
        sceneContext: '',         // "Wooden sled", "Marble table", etc.
        lighting: 'window',       // освещение
        shadow: 'soft',           // тень
        aspectRatio: '1:1'
    },
    images: {
        subject: null,
        style: null,
        base: null,
        location: null  // Референс локации/поверхности
    },
    products: []  // Multi-product: [{id, name, photos: [{base64, mimeType, dataUrl}]}]
};

// Elements
const els = {
    subjectDesc: document.getElementById('subject-desc'),
    selects: {
        preset: document.getElementById('param-preset'),
        category: document.getElementById('param-category'),
        presentation: document.getElementById('param-presentation'),
        angle: document.getElementById('param-angle'),
        framing: document.getElementById('param-framing'),
        background: document.getElementById('param-background'),
        surface: document.getElementById('param-surface'),
        shadow: document.getElementById('param-shadow'),
        lighting: document.getElementById('param-lighting'),
        lightDirection: document.getElementById('param-lightDirection'),
        mood: document.getElementById('param-mood'),
        colorGrade: document.getElementById('param-colorGrade'),
        detailLevel: document.getElementById('param-detailLevel'),
        aspectRatio: document.getElementById('param-aspectRatio'),
        imageSize: document.getElementById('param-imageSize')
    },
    subContainers: {
        presentation: document.getElementById('sub-presentation'),
        lighting: document.getElementById('sub-lighting')
    },
    refs: {
        subject: document.getElementById('ref-subject'),
        style: document.getElementById('ref-style'),
        location: document.getElementById('ref-location')  // NEW
    },
    showDetailsGroup: document.getElementById('show-details-group'),
    shoot: {
        label: document.getElementById('current-shoot-label'),
        btnNew: document.getElementById('btn-new-shoot'),
        btnLoad: document.getElementById('btn-load-shoot'),
        modal: document.getElementById('shoot-modal'),
        modalList: document.getElementById('shoot-list'),
        modalClose: document.getElementById('close-shoot-modal')
    },
    changesDesc: document.getElementById('changes-desc'),
    btnGenerate: document.getElementById('btn-generate'),
    genStatus: document.getElementById('gen-status'),
    historyContainer: document.getElementById('history-container'),
    emptyState: document.getElementById('empty-state')
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

async function init() {
    await loadOptions();
    setupUploads();
    setupShootsUI();
    setupSubParams();
    setupCollapsible();
    setupProductsUI();

    if (els.btnGenerate) {
        els.btnGenerate.addEventListener('click', generate);
    }

    if (els.selects.preset) {
        els.selects.preset.addEventListener('change', (e) => {
            applyPreset(e.target.value);
        });
    }

    // Auto-load last shoot
    const lastShootId = localStorage.getItem('product_currentShootId');
    if (lastShootId) {
        try {
            await loadShoot(lastShootId);
        } catch (e) {
            localStorage.removeItem('product_currentShootId');
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// OPTIONS LOADING
// ═══════════════════════════════════════════════════════════════

async function loadOptions() {
    try {
        // Load legacy V1 options
        const res = await fetch('/api/product/options');
        const json = await res.json();
        if (json.ok) {
            state.options = json.data;
            renderOptions();
        }

        // Load V2 options
        const resV2 = await fetch('/api/product/options-v2');
        const jsonV2 = await resV2.json();
        if (jsonV2.ok) {
            state.optionsV2 = jsonV2.data;
            setupV2UI();
        }
    } catch (e) {
        console.error('Failed to load options', e);
    }
}

function renderOptions() {
    if (!state.options) return;

    const populate = (select, data) => {
        if (!select) return;
        if (Array.isArray(data)) {
            select.innerHTML += data.map(o =>
                `<option value="${o.id}">${o.label}</option>`
            ).join('');
            return;
        }
        if (data && data.options) {
            select.innerHTML = data.options.map(o =>
                `<option value="${o.value}">${o.label}</option>`
            ).join('');
        }
    };

    populate(els.selects.preset, state.options.presets);
    populate(els.selects.category, state.options.category);
    populate(els.selects.presentation, state.options.presentation);
    populate(els.selects.angle, state.options.angle);
    populate(els.selects.framing, state.options.framing);
    populate(els.selects.background, state.options.background);
    populate(els.selects.surface, state.options.surface);
    populate(els.selects.shadow, state.options.shadow);
    populate(els.selects.lighting, state.options.lighting);
    populate(els.selects.lightDirection, state.options.lightDirection);
    populate(els.selects.mood, state.options.mood);
    populate(els.selects.colorGrade, state.options.colorGrade);
    populate(els.selects.detailLevel, state.options.detailLevel);
    populate(els.selects.aspectRatio, state.options.aspectRatio);
    populate(els.selects.imageSize, state.options.imageSize);

    // Render showDetails checkboxes
    if (els.showDetailsGroup && state.options.showDetails?.options) {
        els.showDetailsGroup.innerHTML = state.options.showDetails.options.map(o =>
            `<label><input type="checkbox" name="showDetails" value="${o.value}"> ${o.label}</label>`
        ).join('');
    }
}

// ═══════════════════════════════════════════════════════════════
// V2 UI SETUP
// ═══════════════════════════════════════════════════════════════

function setupV2UI() {
    const v2Container = document.getElementById('v2-mode-container');
    if (!v2Container || !state.optionsV2) return;

    const { modes, catalog, flatlay, lifestyle, global, presets, defaults } = state.optionsV2;

    // Render mode tabs
    const modesHtml = Object.values(modes).map(m => `
        <button class="v2-mode-btn ${m.id === state.v2Mode ? 'active' : ''}" 
                data-mode="${m.id}" 
                onclick="window.setV2Mode('${m.id}')">
            <span class="v2-mode-icon">${m.icon}</span>
            <span class="v2-mode-label">${m.label}</span>
        </button>
    `).join('');

    // Render presets
    const presetsHtml = presets.map(p => `
        <button class="v2-preset-btn" data-preset="${p.id}" onclick="window.applyV2Preset('${p.id}')">
            ${p.icon} ${p.label}
        </button>
    `).join('');

    v2Container.innerHTML = `
        <div class="v2-section">
            <div class="v2-label">Режим съёмки</div>
            <div class="v2-modes">${modesHtml}</div>
        </div>
        <div class="v2-section">
            <div class="v2-label">Пресеты</div>
            <div class="v2-presets">${presetsHtml}</div>
        </div>
        <div class="v2-section" id="v2-mode-params">
            <!-- Conditional params render here -->
        </div>
        <div class="v2-section">
            <div class="v2-label">Сцена / Контекст (опционально)</div>
            <input type="text" id="v2-sceneContext" 
                placeholder="Например: Wooden sled, Marble table, Beach towel..."
                value="${state.v2Params.sceneContext || ''}"
                onchange="state.v2Params.sceneContext = this.value"
                style="width: 100%; max-width: 400px;">
            <div style="font-size: 10px; color: var(--color-text-muted); margin-top: 4px;">
                💡 Если загружен референс локации — укажи тут что на нём (санки, стол и т.д.)
            </div>
        </div>
        <div class="v2-section" style="display: flex; gap: 24px; flex-wrap: wrap;">
            <div>
                <div class="v2-label">Освещение</div>
                <select id="v2-lighting" onchange="state.v2Params.lighting = this.value">
                    ${global.lighting.map(o => `<option value="${o.id}" ${o.id === state.v2Params.lighting ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
            </div>
            <div>
                <div class="v2-label">Тень</div>
                <select id="v2-shadow" onchange="state.v2Params.shadow = this.value">
                    ${global.shadow.map(o => `<option value="${o.id}" ${o.id === state.v2Params.shadow ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
            </div>
            <div>
                <div class="v2-label">Формат</div>
                <select id="v2-aspectRatio" onchange="state.v2Params.aspectRatio = this.value">
                    ${global.aspectRatio.map(o => `<option value="${o.id}" ${o.id === state.v2Params.aspectRatio ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
            </div>
        </div>
    `;

    renderV2ModeParams();
}

function renderV2ModeParams() {
    const container = document.getElementById('v2-mode-params');
    if (!container || !state.optionsV2) return;

    const { catalog, flatlay, lifestyle } = state.optionsV2;
    let html = '';

    switch (state.v2Mode) {
        case 'catalog':
            html = `
                <div class="v2-label">Фон</div>
                <select id="v2-background" onchange="state.v2Params.background = this.value">
                    ${catalog.background.map(o => `<option value="${o.id}" ${o.id === state.v2Params.background ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
            `;
            break;

        case 'flatlay':
            html = `
                <div class="v2-label">Поверхность</div>
                <select id="v2-surface" onchange="state.v2Params.surface = this.value; document.getElementById('v2-surface-custom').style.display = this.value === 'custom' ? 'block' : 'none'">
                    ${flatlay.surface.map(o => `<option value="${o.id}" ${o.id === state.v2Params.surface ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
                <input type="text" id="v2-surface-custom" placeholder="Опиши поверхность..." 
                    style="display: ${state.v2Params.surface === 'custom' ? 'block' : 'none'}; margin-top: 8px;"
                    value="${state.v2Params.surfaceCustom || ''}"
                    onchange="state.v2Params.surfaceCustom = this.value">
                <div class="v2-label" style="margin-top: 12px;">Укладка</div>
                <select id="v2-arrangement" onchange="state.v2Params.arrangement = this.value">
                    ${flatlay.arrangement.map(o => `<option value="${o.id}" ${o.id === state.v2Params.arrangement ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
            `;
            break;

        case 'lifestyle':
            html = `
                <div class="v2-label">Атмосфера</div>
                <select id="v2-atmosphere" onchange="state.v2Params.atmosphere = this.value">
                    ${lifestyle.atmosphere.map(o => `<option value="${o.id}" ${o.id === state.v2Params.atmosphere ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
                <div class="v2-note" style="margin-top: 8px; font-size: 11px; color: var(--color-text-muted);">
                    ⚠️ Загрузите референс локации для лучшего результата
                </div>
            `;
            break;

        case 'custom':
            html = `
                <div class="v2-label">Свой промпт</div>
                <textarea id="v2-custom-prompt" rows="5" 
                    placeholder="Опиши желаемый кадр подробно..."
                    onchange="state.v2Params.customPrompt = this.value">${state.v2Params.customPrompt || ''}</textarea>
            `;
            break;
    }

    container.innerHTML = html;
}

window.setV2Mode = function (mode) {
    state.v2Mode = mode;
    // Update active button
    document.querySelectorAll('.v2-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    renderV2ModeParams();
};

window.applyV2Preset = function (presetId) {
    const preset = state.optionsV2?.presets.find(p => p.id === presetId);
    if (!preset) return;

    state.v2Mode = preset.mode;
    Object.assign(state.v2Params, preset.values);

    // Re-render UI
    document.querySelectorAll('.v2-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === state.v2Mode);
    });
    renderV2ModeParams();

    // Update aspect ratio select if exists
    const arSelect = document.getElementById('v2-aspectRatio');
    if (arSelect && preset.values.aspectRatio) {
        arSelect.value = preset.values.aspectRatio;
    }
};

// ═══════════════════════════════════════════════════════════════
// SUB-PARAMETERS
// ═══════════════════════════════════════════════════════════════

function setupSubParams() {
    const paramConfigs = {
        presentation: 'presentation',
        lighting: 'lighting'
    };

    Object.entries(paramConfigs).forEach(([paramKey, schemaKey]) => {
        const select = els.selects[paramKey];
        const container = els.subContainers[paramKey];
        if (!select || !container) return;

        select.addEventListener('change', () => {
            updateSubParam(paramKey, schemaKey);
        });
        updateSubParam(paramKey, schemaKey);
    });
}

function updateSubParam(paramKey, schemaKey) {
    const select = els.selects[paramKey];
    const container = els.subContainers[paramKey];
    if (!select || !container || !state.options) return;

    const selectedValue = select.value;
    const schemaOptions = state.options[schemaKey]?.options || [];
    const selectedOption = schemaOptions.find(o => o.value === selectedValue);

    if (!selectedOption?.subParams?.length) {
        container.classList.remove('visible');
        container.innerHTML = '';
        return;
    }

    let html = '';
    selectedOption.subParams.forEach(subParam => {
        html += `
            <div class="sub-param-label">${subParam.label}</div>
            <select id="sub-${paramKey}-${subParam.id}" class="form-select" style="font-size: 10px; width: 100%;">
                ${subParam.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
            </select>
        `;
    });

    container.innerHTML = html;
    container.classList.add('visible');
}

function collectSubParams() {
    const result = {};
    Object.entries(els.subContainers).forEach(([key, container]) => {
        if (!container || !container.classList.contains('visible')) return;
        const selects = container.querySelectorAll('select');
        selects.forEach(sel => {
            const idParts = sel.id.split('-');
            if (idParts.length >= 3) {
                const subParamId = idParts.slice(2).join('-');
                result[subParamId] = sel.value;
            }
        });
    });
    return result;
}

// ═══════════════════════════════════════════════════════════════
// FILE UPLOADS
// ═══════════════════════════════════════════════════════════════

function setupUploads() {
    ['subject', 'style', 'location'].forEach(type => {
        const card = els.refs[type];
        if (!card) return;

        const input = card.querySelector('input');
        const removeBtn = card.querySelector('.ref-card-remove');

        card.addEventListener('click', (e) => {
            if (e.target !== removeBtn) input.click();
        });

        input.addEventListener('change', async (e) => {
            if (e.target.files?.[0]) {
                const file = e.target.files[0];
                const compressed = await compressImage(file);

                state.images[type] = compressed;

                card.classList.add('has-image');
                card.style.backgroundImage = `url(${compressed.dataUrl})`;
                card.style.backgroundSize = 'cover';
                card.style.backgroundPosition = 'center';
                card.querySelector('.ref-card-icon').style.display = 'none';
                card.querySelector('.ref-card-label').style.display = 'none';
            }
            input.value = '';
        });

        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.images[type] = null;
            card.classList.remove('has-image');
            card.style.backgroundImage = '';
            card.querySelector('.ref-card-icon').style.display = 'block';
            card.querySelector('.ref-card-label').style.display = 'block';
        });
    });
}

async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 1024;
                let w = img.width;
                let h = img.height;

                if (w > h) {
                    if (w > MAX) { h *= MAX / w; w = MAX; }
                } else {
                    if (h > MAX) { w *= MAX / h; h = MAX; }
                }

                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                const base64 = dataUrl.split(',')[1];
                resolve({ base64, mimeType: 'image/jpeg', dataUrl });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

async function generate() {
    const subjectDescription = els.subjectDesc?.value?.trim() || '';

    els.btnGenerate.disabled = true;
    els.genStatus.style.display = 'block';
    els.genStatus.innerHTML = '<span class="spinner"></span> Генерирую... (может занять до 2 минут)';

    // Collect showDetails checkboxes
    const showDetails = [];
    document.querySelectorAll('input[name="showDetails"]:checked').forEach(cb => {
        showDetails.push(cb.value);
    });

    // AbortController для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 минуты

    try {
        // Подготавливаем products для отправки (макс 6 фото на предмет)
        const MAX_PHOTOS_PER_PRODUCT = 6;
        const productsPayload = state.products.filter(p => p.photos.length > 0).map(p => ({
            name: p.name,
            photos: p.photos.slice(0, MAX_PHOTOS_PER_PRODUCT).map(photo => ({ base64: photo.base64, mimeType: photo.mimeType })),
            params: p.params || {}
        }));

        // Определяем используем ли V2 режим
        const useV2 = state.optionsV2 && state.v2Mode;

        const payload = {
            params: useV2 ? {
                // V2 параметры
                mode: state.v2Mode,
                ...state.v2Params,
                subjectDescription,
                // Названия продуктов для промпта
                products: productsPayload.map(p => ({ name: p.name }))
            } : {
                // Legacy V1 параметры
                subjectDescription,
                category: els.selects.category?.value || '',
                presentation: els.selects.presentation?.value || '',
                angle: els.selects.angle?.value || '',
                framing: els.selects.framing?.value || '',
                background: els.selects.background?.value || '',
                surface: els.selects.surface?.value || '',
                shadow: els.selects.shadow?.value || '',
                lighting: els.selects.lighting?.value || '',
                lightDirection: els.selects.lightDirection?.value || '',
                mood: els.selects.mood?.value || '',
                colorGrade: els.selects.colorGrade?.value || '',
                detailLevel: els.selects.detailLevel?.value || '',
                aspectRatio: els.selects.aspectRatio?.value || '1:1',
                imageSize: els.selects.imageSize?.value || '2k',
                showDetails,
                changesDescription: els.changesDesc?.value?.trim() || '',
                subParams: collectSubParams()
            },
            subjectImage: state.images.subject,
            styleImage: state.images.style,
            baseImage: state.images.base,
            locationImage: state.images.location,
            products: productsPayload,
            shootId: state.currentShoot?.id,
            frameId: state.refiningFrameId || null
        };

        const res = await fetch('/api/product/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const json = await res.json();

        if (json.ok) {
            if (state.currentShoot?.id) {
                await reloadCurrentShoot();
            } else {
                const newItem = {
                    ...json.data,
                    params: json.data.params,
                    createdAt: new Date().toISOString()
                };
                addToHistory(newItem, null);
            }

            // Reset refine mode
            state.refiningFrameId = null;
            state.images.base = null;
            if (els.btnGenerate) {
                els.btnGenerate.innerHTML = '<span>📸 Сгенерировать</span>';
                els.btnGenerate.style.background = '';
            }
        } else {
            alert('Ошибка: ' + json.error);
        }

    } catch (e) {
        clearTimeout(timeoutId);
        console.error(e);
        if (e.name === 'AbortError') {
            alert('Таймаут запроса (3 минуты). Попробуй с меньшим количеством фото.');
        } else {
            alert('Ошибка соединения');
        }
    } finally {
        els.btnGenerate.disabled = false;
        els.genStatus.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════════
// HISTORY RENDERING
// ═══════════════════════════════════════════════════════════════

function addToHistory(data, parentId = null) {
    if (parentId) {
        const parent = state.history.find(item => item.id === parentId);
        if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push(data);
        }
    } else {
        state.history.unshift(data);
    }
    renderHistory();
}

function renderHistory() {
    if (!els.historyContainer) return;

    if (state.history.length === 0) {
        if (els.emptyState) els.emptyState.style.display = 'flex';
        els.historyContainer.innerHTML = '';
        els.historyContainer.appendChild(els.emptyState);
        return;
    }
    if (els.emptyState) els.emptyState.style.display = 'none';

    const html = state.history.map((item, idx) => {
        const variations = item.children || [];
        return `
        <div class="product-frame-group" data-id="${item.id}">
            ${renderFrameCard(item, idx, true)}
            ${variations.length > 0 ? `
            <div class="product-variations-row">
                ${variations.map((v, vIdx) => renderFrameCard(v, `${idx}_${vIdx}`, false)).join('')}
            </div>
            ` : ''}
        </div>
        `;
    }).join('');

    els.historyContainer.innerHTML = html;
}

function renderFrameCard(item, idx, isMain) {
    const p = item.params || {};
    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    let imageUrl = item.imageUrl;
    if (item.base64) {
        imageUrl = `data:${item.mimeType || 'image/jpeg'};base64,${item.base64}`;
    }

    const cardClass = isMain ? 'product-frame-main' : 'product-frame-variation';
    const hasPrompt = !!item.prompt;

    return `
    <div class="${cardClass}">
        <div style="cursor: pointer; margin-bottom: 8px;" onclick="window.openLightbox('${imageUrl}')">
            <img src="${imageUrl}" loading="lazy" alt="Продукт" style="width: 100%; border-radius: 8px; display: block;">
        </div>
        <div style="font-size: ${isMain ? '13px' : '11px'}; font-weight: 600; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(p.subjectDescription || 'Продукт')}</div>
        <div style="font-size: 10px; color: var(--color-text-muted); margin-bottom: 8px;">${dateStr}</div>
        
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            <button class="btn-mini" onclick="window.refineHistoryItem('${item.id}')" title="Улучшить" style="flex: 1;">✨</button>
            <button class="btn-mini" onclick="window.setReferenceFromHistory('${item.id}', 'subject')" title="Как референс" style="flex: 1;">📌</button>
            ${hasPrompt ? `<button class="btn-mini" onclick="window.viewPrompt('${item.id}')" title="Посмотреть промпт" style="flex: 1;">📝</button>` : ''}
            <a href="${imageUrl}" download="product_${idx}.jpg" class="btn-mini" title="Скачать" style="flex: 1; text-align: center; text-decoration: none;">💾</a>
        </div>
    </div>
    `;
}

// Просмотр промпта
window.viewPrompt = function (itemId) {
    const item = findHistoryItem(itemId);
    if (!item || !item.prompt) {
        alert('Промпт недоступен');
        return;
    }

    // Создаём модальное окно
    const modal = document.createElement('div');
    modal.className = 'lightbox-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div style="background: var(--color-surface); padding: 24px; border-radius: 12px; max-width: 800px; max-height: 80vh; overflow: auto; position: relative;">
            <button onclick="this.closest('.lightbox-overlay').remove()" 
                style="position: absolute; top: 12px; right: 12px; background: none; border: none; color: white; font-size: 24px; cursor: pointer;">×</button>
            <h3 style="margin: 0 0 16px 0;">📝 Финальный промпт</h3>
            <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 12px; line-height: 1.5; background: var(--color-bg); padding: 16px; border-radius: 8px; max-height: 60vh; overflow: auto;">${escapeHtml(item.prompt)}</pre>
            <div style="margin-top: 16px; display: flex; gap: 8px;">
                <button class="btn btn-primary" onclick="navigator.clipboard.writeText(document.querySelector('.lightbox-overlay pre').textContent); this.textContent = '✓ Скопировано';">📋 Скопировать</button>
            </div>
        </div>
    `;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
};

// Поиск элемента в истории
function findHistoryItem(itemId) {
    for (const item of state.history) {
        if (item.id === itemId) return item;
        if (item.children) {
            const child = item.children.find(c => c.id === itemId);
            if (child) return child;
        }
    }
    return null;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════
// SHOOTS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function setupShootsUI() {
    if (els.shoot.btnNew) {
        els.shoot.btnNew.addEventListener('click', async () => {
            const label = prompt('Название съёмки:', 'Новая съёмка');
            if (!label) return;

            try {
                const res = await fetch('/api/product-shoots', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ label })
                });
                const json = await res.json();
                if (json.ok) {
                    state.currentShoot = { id: json.data.id, label: json.data.label };
                    state.history = [];
                    localStorage.setItem('product_currentShootId', json.data.id);
                    if (els.shoot.label) els.shoot.label.textContent = json.data.label;
                    renderHistory();
                }
            } catch (e) {
                console.error(e);
            }
        });
    }

    if (els.shoot.btnLoad) {
        els.shoot.btnLoad.addEventListener('click', openShootModal);
    }

    if (els.shoot.modalClose) {
        els.shoot.modalClose.addEventListener('click', closeShootModal);
    }
}

async function openShootModal() {
    els.shoot.modal.classList.add('active');
    els.shoot.modalList.innerHTML = '<div style="padding: 20px; text-align: center;">Загрузка...</div>';

    try {
        const res = await fetch('/api/product-shoots');
        const json = await res.json();

        if (json.ok && json.data.length > 0) {
            els.shoot.modalList.innerHTML = json.data.map(s => `
                <div onclick="window.selectShoot('${s.id}')" style="padding: 12px; background: var(--color-bg-secondary); border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600;">${escapeHtml(s.label)}</div>
                        <div style="font-size: 11px; color: var(--color-text-muted);">${s.frameCount || 0} кадров</div>
                    </div>
                    <div style="font-size: 11px; color: var(--color-text-muted);">${new Date(s.updatedAt).toLocaleDateString()}</div>
                </div>
            `).join('');
        } else {
            els.shoot.modalList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-text-muted);">Нет сохранённых съёмок</div>';
        }
    } catch (e) {
        els.shoot.modalList.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Ошибка загрузки</div>';
    }
}

function closeShootModal() {
    els.shoot.modal.classList.remove('active');
}

window.selectShoot = async (id) => {
    closeShootModal();
    await loadShoot(id);
};

async function loadShoot(id) {
    try {
        const res = await fetch(`/api/product-shoots/${id}`);
        const json = await res.json();

        if (json.ok) {
            const shoot = json.data;
            state.currentShoot = { id: shoot.id, label: shoot.label };
            localStorage.setItem('product_currentShootId', shoot.id);
            if (els.shoot.label) els.shoot.label.textContent = shoot.label;

            // Load history from frames
            state.history = (shoot.frames || []).map(frame => {
                const firstSnapshot = frame.snapshots?.[0] || {};
                return {
                    id: frame.id,
                    params: frame.params,
                    prompt: frame.prompt || firstSnapshot.prompt,  // NEW: сохраняем prompt
                    imageUrl: firstSnapshot.imageUrl,
                    createdAt: frame.createdAt,
                    children: (frame.snapshots || []).slice(1).map(s => ({
                        id: s.id,
                        imageUrl: s.imageUrl,
                        createdAt: s.createdAt,
                        params: frame.params,
                        prompt: s.prompt  // NEW
                    }))
                };
            });

            // NEW: Восстанавливаем последние параметры в UI
            const lastFrame = shoot.frames?.[0];
            if (lastFrame?.params) {
                const p = lastFrame.params;
                const s = els.selects;
                const safeSet = (el, val) => { if (el && val) el.value = val; };

                if (els.subjectDesc && p.subjectDescription) els.subjectDesc.value = p.subjectDescription;
                safeSet(s.category, p.category);
                safeSet(s.presentation, p.presentation);
                safeSet(s.angle, p.angle);
                safeSet(s.framing, p.framing);
                safeSet(s.background, p.background);
                safeSet(s.surface, p.surface);
                safeSet(s.shadow, p.shadow);
                safeSet(s.lighting, p.lighting);
                safeSet(s.lightDirection, p.lightDirection);
                safeSet(s.mood, p.mood);
                safeSet(s.colorGrade, p.colorGrade);
                safeSet(s.detailLevel, p.detailLevel);
            }

            renderHistory();
        }
    } catch (e) {
        console.error('Failed to load shoot', e);
    }
}

async function reloadCurrentShoot() {
    if (state.currentShoot?.id) {
        await loadShoot(state.currentShoot.id);
    }
}

// ═══════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════

function applyPreset(presetId) {
    if (!presetId || !state.options) return;
    const preset = state.options.presets.find(p => p.id === presetId);
    if (!preset || !preset.values) return;

    const v = preset.values;
    const s = els.selects;
    const safeSet = (el, val) => { if (el && val) el.value = val; };

    safeSet(s.presentation, v.presentation);
    safeSet(s.angle, v.angle);
    safeSet(s.framing, v.framing);
    safeSet(s.background, v.background);
    safeSet(s.surface, v.surface);
    safeSet(s.shadow, v.shadow);
    safeSet(s.lighting, v.lighting);
    safeSet(s.lightDirection, v.lightDirection);
    safeSet(s.mood, v.mood);
    safeSet(s.colorGrade, v.colorGrade);
    safeSet(s.detailLevel, v.detailLevel);

    // Trigger sub-params update
    if (s.presentation) s.presentation.dispatchEvent(new Event('change'));
    if (s.lighting) s.lighting.dispatchEvent(new Event('change'));
}

// ═══════════════════════════════════════════════════════════════
// COLLAPSIBLE HEADER
// ═══════════════════════════════════════════════════════════════

function setupCollapsible() {
    const header = document.getElementById('controls-header');
    const toggle = document.getElementById('toggle-controls');
    const arrow = document.getElementById('toggle-arrow');

    if (toggle && header) {
        toggle.addEventListener('click', (e) => {
            // Don't collapse when clicking buttons
            if (e.target.tagName === 'BUTTON') return;

            header.classList.toggle('collapsed');
            arrow.textContent = header.classList.contains('collapsed') ? '▶' : '▼';
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL HANDLERS
// ═══════════════════════════════════════════════════════════════

window.openLightbox = (url) => {
    window.open(url, '_blank');
};

window.refineHistoryItem = async (itemId) => {
    const item = findHistoryItemById(itemId);
    if (!item) return;

    // Load params
    if (item.params) {
        els.subjectDesc.value = item.params.subjectDescription || '';
        if (els.changesDesc) els.changesDesc.value = '';
    }

    // Set base image
    let base64;
    if (item.base64) {
        base64 = item.base64;
    } else if (item.imageUrl) {
        try {
            const blob = await fetch(item.imageUrl).then(r => r.blob());
            const reader = new FileReader();
            base64 = await new Promise(resolve => {
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            alert('Не удалось загрузить изображение');
            return;
        }
    }

    if (base64) {
        state.images.base = { base64, mimeType: 'image/jpeg' };
        state.refiningFrameId = itemId;
        alert('✨ Режим улучшения! Внеси правки и нажми Сгенерировать.');

        if (els.btnGenerate) {
            els.btnGenerate.innerHTML = '<span>✨ Вариация</span>';
            els.btnGenerate.style.background = 'var(--color-accent)';
        }
    }
};

window.setReferenceFromHistory = async (itemId, type) => {
    const item = findHistoryItemById(itemId);
    if (!item) return;

    let dataUrl;
    if (item.base64) {
        dataUrl = `data:${item.mimeType || 'image/jpeg'};base64,${item.base64}`;
    } else if (item.imageUrl) {
        dataUrl = item.imageUrl;
    } else {
        return;
    }

    try {
        const blob = await fetch(dataUrl).then(res => res.blob());
        const file = new File([blob], `ref.jpg`, { type: blob.type });
        const compressed = await compressImage(file);

        state.images[type] = compressed;
        const card = els.refs[type];
        if (card) {
            card.classList.add('has-image');
            card.style.backgroundImage = `url(${compressed.dataUrl})`;
            card.style.backgroundSize = 'cover';
            card.style.backgroundPosition = 'center';
            card.querySelector('.ref-card-icon').style.display = 'none';
            card.querySelector('.ref-card-label').style.display = 'none';
        }
        alert(`Референс [${type}] обновлён!`);
    } catch (e) {
        console.error('Failed to set reference', e);
    }
};

function findHistoryItemById(id) {
    for (const frame of state.history) {
        if (frame.id === id) return frame;
        if (frame.children) {
            for (const child of frame.children) {
                if (child.id === id) return child;
            }
        }
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════
// MULTI-PRODUCT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function setupProductsUI() {
    const addBtn = document.getElementById('btn-add-product');
    if (addBtn) {
        addBtn.addEventListener('click', () => addNewProduct());
    }
}

window.addNewProduct = function () {
    const id = `prod_${Date.now()}`;
    const product = {
        id,
        name: `Предмет ${state.products.length + 1}`,
        photos: [],
        params: {
            position: 'auto',
            scale: 'medium',
            orientation: 'auto',
            role: 'hero'
        }
    };
    state.products.push(product);
    renderProductsList();
};

window.removeProduct = function (productId) {
    state.products = state.products.filter(p => p.id !== productId);
    renderProductsList();
};

window.updateProductName = function (productId, name) {
    const product = state.products.find(p => p.id === productId);
    if (product) {
        product.name = name;
    }
};

window.updateProductParam = function (productId, paramName, value) {
    const product = state.products.find(p => p.id === productId);
    if (product && product.params) {
        product.params[paramName] = value;
    }
};

window.removeProductPhoto = function (productId, photoIndex) {
    const product = state.products.find(p => p.id === productId);
    if (product) {
        product.photos.splice(photoIndex, 1);
        renderProductsList();
    }
};

function renderProductsList() {
    const container = document.getElementById('products-list');
    const countEl = document.getElementById('products-count');
    if (!container) return;

    if (countEl) {
        countEl.textContent = `(${state.products.length})`;
    }

    let html = state.products.map(product => {
        const p = product.params || {};
        return `
        <div class="product-item" data-id="${product.id}">
            <div class="product-item-header">
                <input type="text" class="product-item-name" value="${escapeHtml(product.name)}" 
                    onchange="window.updateProductName('${product.id}', this.value)">
                <button class="product-item-remove" onclick="window.removeProduct('${product.id}')">×</button>
            </div>
            <div class="product-photos-grid">
                ${product.photos.map((photo, idx) => `
                    <div class="product-photo">
                        <img src="${photo.dataUrl}" alt="Фото ${idx + 1}">
                        <button class="product-photo-remove" onclick="window.removeProductPhoto('${product.id}', ${idx})">×</button>
                    </div>
                `).join('')}
            </div>
            <div class="product-upload-zone" 
                onclick="window.triggerProductUpload('${product.id}')"
                ondragover="event.preventDefault(); this.classList.add('dragover');"
                ondragleave="this.classList.remove('dragover');"
                ondrop="window.handleProductDrop(event, '${product.id}'); this.classList.remove('dragover');">
                <input type="file" id="upload-${product.id}" multiple accept="image/*" hidden
                    onchange="window.handleProductFiles(event, '${product.id}')">
                <div class="product-upload-zone-text">📷 Загрузить фото</div>
            </div>
            <div class="product-params">
                <div class="product-param-row">
                    <label>Позиция:</label>
                    <select onchange="window.updateProductParam('${product.id}', 'position', this.value)">
                        <option value="auto" ${p.position === 'auto' ? 'selected' : ''}>Авто</option>
                        <option value="left" ${p.position === 'left' ? 'selected' : ''}>Слева</option>
                        <option value="center" ${p.position === 'center' ? 'selected' : ''}>Центр</option>
                        <option value="right" ${p.position === 'right' ? 'selected' : ''}>Справа</option>
                    </select>
                    <label>Размер:</label>
                    <select onchange="window.updateProductParam('${product.id}', 'scale', this.value)">
                        <option value="small" ${p.scale === 'small' ? 'selected' : ''}>Маленький</option>
                        <option value="medium" ${p.scale === 'medium' ? 'selected' : ''}>Средний</option>
                        <option value="large" ${p.scale === 'large' ? 'selected' : ''}>Крупный</option>
                    </select>
                </div>
                <div class="product-param-row">
                    <label>Ориентация:</label>
                    <select onchange="window.updateProductParam('${product.id}', 'orientation', this.value)">
                        <option value="auto" ${p.orientation === 'auto' ? 'selected' : ''}>Авто</option>
                        <option value="folded" ${p.orientation === 'folded' ? 'selected' : ''}>Сложен</option>
                        <option value="flat" ${p.orientation === 'flat' ? 'selected' : ''}>Разложен</option>
                        <option value="standing" ${p.orientation === 'standing' ? 'selected' : ''}>Стоит</option>
                        <option value="tilted" ${p.orientation === 'tilted' ? 'selected' : ''}>Наклонён</option>
                    </select>
                    <label>Роль:</label>
                    <select onchange="window.updateProductParam('${product.id}', 'role', this.value)">
                        <option value="hero" ${p.role === 'hero' ? 'selected' : ''}>Главный</option>
                        <option value="supporting" ${p.role === 'supporting' ? 'selected' : ''}>Второстепенный</option>
                    </select>
                </div>
            </div>
        </div>
    `}).join('');

    // Add placeholder button
    html += `
        <div class="product-add-btn" onclick="window.addNewProduct()">
            <span style="font-size: 32px;">+</span>
            <span style="font-size: 11px; margin-top: 8px;">Добавить предмет</span>
        </div>
    `;

    container.innerHTML = html;
}

window.triggerProductUpload = function (productId) {
    const input = document.getElementById(`upload-${productId}`);
    if (input) input.click();
};

window.handleProductFiles = async function (event, productId) {
    const files = Array.from(event.target.files);
    await processProductFiles(productId, files);
    event.target.value = '';
};

window.handleProductDrop = async function (event, productId) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    await processProductFiles(productId, files);
};

async function processProductFiles(productId, files) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    for (const file of files) {
        try {
            const compressed = await compressImage(file);
            product.photos.push(compressed);
        } catch (e) {
            console.error('Failed to process file:', e);
        }
    }
    renderProductsList();
}

// ═══════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════

init();
