/**
 * Food Shoot Editor Logic
 */

// State
const state = {
    options: null,
    history: [], // Array of generated results ({ params, base64/imageUrl, ... })
    currentShoot: null, // { id, label }
    images: {
        subject: null,
        crockery: null,
        style: null,
        sketch: null // Phase 8
    }
};

// Elements
const els = {
    dishDesc: document.getElementById('dish-desc'),
    selects: {
        preset: document.getElementById('param-preset'),
        camera: document.getElementById('param-camera'),
        angle: document.getElementById('param-angle'),
        composition: document.getElementById('param-composition'),
        depth: document.getElementById('param-depth'),
        lighting: document.getElementById('param-lighting'),
        color: document.getElementById('param-color'),
        plating: document.getElementById('param-plating'),
        texture: document.getElementById('param-texture'),
        surface: document.getElementById('param-surface'),
        crockery: document.getElementById('param-crockery'),
        dynamics: document.getElementById('param-dynamics'),
        state: document.getElementById('param-state'),
        mood: document.getElementById('param-mood'),
        aspectRatio: document.getElementById('param-aspectRatio'),
        imageSize: document.getElementById('param-imageSize')
    },
    refs: {
        subject: document.getElementById('ref-subject'),
        crockery: document.getElementById('ref-crockery'),
        style: document.getElementById('ref-style'),
        sketch: document.getElementById('ref-sketch')
    },
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

/* 3. File Upload Logic */
function setupUploads() {
    ['subject', 'crockery', 'style', 'sketch'].forEach(type => {
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

                // Update UI
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

            // Reset UI
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

/* 4. Generation Logic */
async function generate() {
    const dishDescription = els.dishDesc.value.trim();
    if (!dishDescription) {
        alert('Опиши блюдо!');
        return;
    }

    // UI State
    els.btnGenerate.disabled = true;
    els.genStatus.style.display = 'block';

    try {
        const payload = {
            params: {
                dishDescription,
                camera: els.selects.camera.value,
                angle: els.selects.angle.value,
                composition: els.selects.composition.value,
                depth: els.selects.depth.value,
                lighting: els.selects.lighting.value,
                color: els.selects.color.value,
                plating: els.selects.plating.value,
                texture: els.selects.texture.value,
                surface: els.selects.surface.value,
                crockery: els.selects.crockery.value,
                dynamics: els.selects.dynamics.value,
                state: els.selects.state.value,
                aspectRatio: els.selects.aspectRatio.value,
                imageSize: els.selects.imageSize.value,
                changesDescription: els.changesDesc ? els.changesDesc.value.trim() : ''
            },
            subjectImage: state.images.subject,
            crockeryImage: state.images.crockery,
            styleImage: state.images.style,
            sketchImage: state.images.sketch,
            shootId: state.currentShoot?.id
        };

        const res = await fetch('/api/food/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        if (json.ok) {
            // If savedImage is returned, use it. Otherwise construct from valid response.
            let newItem;
            if (json.data.savedImage) {
                // Merge base64 back into savedImage so we can display it immediately
                // even if the file isn't served correctly yet
                newItem = {
                    ...json.data.savedImage,
                    base64: json.data.image ? json.data.image.base64 : null,
                    mimeType: 'image/jpeg'
                };
            } else {
                newItem = {
                    ...json.data.image,
                    params: json.data.params,
                    createdAt: new Date().toISOString()
                };
            }

            addToHistory(newItem);
        } else {
            alert('Ошибка: ' + json.error);
        }

    } catch (e) {
        console.error(e);
        alert('Ошибка соединения');
    } finally {
        els.btnGenerate.disabled = false;
        els.genStatus.style.display = 'none';
    }
}

/* 5. Core Init & API */

async function init() {
    await loadOptions();
    setupUploads();
    setupShootsUI();

    if (els.btnGenerate) {
        els.btnGenerate.addEventListener('click', generate);
    }

    if (els.selects.preset) {
        els.selects.preset.addEventListener('change', (e) => {
            applyPreset(e.target.value);
        });
    }
}

async function loadOptions() {
    try {
        const res = await fetch('/api/food/options');
        const json = await res.json();
        if (json.ok) {
            state.options = json.data;
            renderOptions();
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
    populate(els.selects.camera, state.options.camera);
    populate(els.selects.angle, state.options.angle);
    populate(els.selects.composition, state.options.composition);
    populate(els.selects.depth, state.options.depth);
    populate(els.selects.lighting, state.options.lighting);
    populate(els.selects.color, state.options.color);
    populate(els.selects.plating, state.options.plating);
    populate(els.selects.texture, state.options.texture);
    populate(els.selects.surface, state.options.surface);
    populate(els.selects.crockery, state.options.crockery);
    populate(els.selects.dynamics, state.options.dynamics);
    populate(els.selects.state, state.options.state);
    populate(els.selects.mood, state.options.mood);
    populate(els.selects.aspectRatio, state.options.aspectRatio);
    populate(els.selects.imageSize, state.options.imageSize);
}

function applyPreset(presetId) {
    if (!presetId || !state.options) return;
    const preset = state.options.presets.find(p => p.id === presetId);
    if (!preset || !preset.values) return;

    const v = preset.values;
    const s = els.selects;
    const safeSet = (el, val) => { if (el && val) el.value = val; };

    safeSet(s.camera, v.camera);
    safeSet(s.angle, v.angle);
    safeSet(s.composition, v.composition);
    safeSet(s.depth, v.depth);
    safeSet(s.lighting, v.lighting);
    safeSet(s.color, v.color);
    safeSet(s.plating, v.plating);
    safeSet(s.texture, v.texture);
    safeSet(s.surface, v.surface);
    safeSet(s.crockery, v.crockery);
    safeSet(s.dynamics, v.dynamics);
    safeSet(s.state, v.state);
    safeSet(s.mood, v.mood);
}

function addToHistory(data) {
    state.history.unshift(data);
    renderHistory();
}

function renderHistory() {
    if (!els.historyContainer) return;

    if (!state.currentShoot && state.history.length === 0) {
        if (els.emptyState) els.emptyState.style.display = 'block';
        els.historyContainer.innerHTML = '';
        els.historyContainer.appendChild(els.emptyState);
        return;
    }

    // Re-render
    els.historyContainer.innerHTML = state.history.map((item, idx) => {
        const p = item.params || {};
        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        let imageUrl = item.imageUrl;
        // Prefer base64 for immediate display to avoid broken images if server lag
        if (item.base64) {
            imageUrl = `data:${item.mimeType || 'image/jpeg'};base64,${item.base64}`;
        } else if (imageUrl && !imageUrl.startsWith('data:')) {
            // It's a URL
        } else if (!imageUrl && item.base64) {
            imageUrl = `data:${item.mimeType || 'image/jpeg'};base64,${item.base64}`;
        }

        // For download, if URL is available it is preferred, but make sure it works!
        // But for safety, let's just use imageUrl if it exists, hoping it works. 
        // If not, users can use lightbox?
        const downloadUrl = item.imageUrl || imageUrl;

        return `
    <div class="selection-card generated-frame-card" style="cursor: default; position: relative;">
    <div class="history-lock-badges">
        ${p.surface ? '<span class="history-lock-badge style" title="Surface Set">🪵</span>' : ''}
        ${p.crockery ? '<span class="history-lock-badge location" title="Crockery Set">🥣</span>' : ''}
    </div>
    
    <div class="selection-card-preview btn-open-lightbox" data-index="${idx}" style="cursor: pointer;" title="Клик для просмотра">
        <img src="${imageUrl}" loading="lazy" alt="Food Shot" style="object-fit: contain; background: #000; pointer-events: none; width:100%; height: auto;">
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
        <div class="selection-card-title" style="margin: 0; font-size:14px;">${escapeHtml(p.dishDescription || 'Food Shot')}</div>
        <span style="font-size: 11px; color: var(--color-text-muted);">${dateStr}</span>
    </div>
    
    <div style="font-size: 11px; color: var(--color-text-muted); margin-bottom:8px;">
        ${p.camera ? `📸 ${p.camera}` : ''} • ${p.lighting ? `💡 ${p.lighting}` : ''}
    </div>

    <!-- Actions -->
    <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; gap: 8px;">
        <a href="${downloadUrl}" download="food_${idx}.jpg" class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px; flex: 1;">💾 Save</a>
        <button class="btn btn-secondary" onclick="window.loadParamsHistory(${idx})" style="padding: 8px 12px; font-size: 12px; flex: 1;" title="Load Params">♻️ Load</button>
        ${!state.currentShoot ?
                `<button class="btn btn-secondary" onclick="window.deleteHistoryItem(${idx})" style="padding: 8px 12px; font-size: 12px; color: var(--color-accent);">✕</button>` : ''
            }
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
        <button class="btn-mini" onclick="window.setReferenceFromHistory(${idx}, 'subject')" title="Use as Subject Ref" style="font-size:10px;">🍲 Ref</button>
        <button class="btn-mini" onclick="window.setReferenceFromHistory(${idx}, 'crockery')" title="Use as Crockery Ref" style="font-size:10px;">🥣 Crockery</button>
        <button class="btn-mini" onclick="window.setReferenceFromHistory(${idx}, 'style')" title="Use as Style Ref" style="font-size:10px;">🎨 Style</button>
        </div>
    </div>
    
    <details style="margin-top: 12px; width: 100%;">
        <summary style="cursor: pointer; font-size: 11px; color: var(--color-text-muted); user-select: none;">
        ⚙️ Детали и Настройки
        </summary>
        <div style="margin-top: 10px; text-align: left; font-size: 11px; background: var(--color-surface); padding: 10px; border-radius: 8px; border: 1px solid var(--color-border);">
        ${buildFoodSettingsHtml(p)}
        </div>
    </details>
    </div>
`;
    }).join('');

    // Attach Lightbox Handlers
    document.querySelectorAll('.btn-open-lightbox').forEach(btn => {
        btn.addEventListener('click', () => openLightbox(parseInt(btn.dataset.index)));
    });
}

function buildFoodSettingsHtml(p) {
    const items = [];
    const row = (label, val) => `<div><strong>${label}:</strong> ${escapeHtml(val)}</div>`;
    if (p.aspectRatio) items.push(row('📐 Формат', `${p.aspectRatio}, ${p.imageSize || '2K'}`));
    if (p.dishDescription) items.push(row('🍽️ Блюдо', p.dishDescription));
    if (p.changesDescription) items.push(`<div style="color:var(--color-accent);"><strong>✏️ Правки:</strong> ${escapeHtml(p.changesDescription)}</div>`);
    if (p.camera) items.push(row('📸 Камера', p.camera));
    if (p.angle) items.push(row('📐 Ракурс', p.angle));
    if (p.lighting) items.push(row('💡 Свет', p.lighting));
    if (p.plating) items.push(row('👨‍🍳 Подача', p.plating));
    if (p.surface) items.push(row('🪵 Поверхность', p.surface));
    if (p.crockery) items.push(row('🥣 Посуда', p.crockery));
    return items.join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.loadParamsHistory = (index) => {
    if (state.history[index]) loadParams(state.history[index].params);
};

window.deleteHistoryItem = (index) => {
    if (confirm('Удалить из истории?')) {
        state.history.splice(index, 1);
        renderHistory();
    }
};

function loadParams(params) {
    if (!params) return;
    els.dishDesc.value = params.dishDescription || '';
    if (els.changesDesc) els.changesDesc.value = params.changesDescription || '';
    const safeSet = (el, v) => { if (el && v) el.value = v; };
    const s = els.selects;
    safeSet(s.camera, params.camera);
    safeSet(s.angle, params.angle);
    safeSet(s.composition, params.composition);
    safeSet(s.depth, params.depth);
    safeSet(s.lighting, params.lighting);
    safeSet(s.color, params.color);
    safeSet(s.plating, params.plating);
    safeSet(s.texture, params.texture);
    safeSet(s.surface, params.surface);
    safeSet(s.crockery, params.crockery);
    safeSet(s.dynamics, params.dynamics);
    safeSet(s.state, params.state);
    safeSet(s.aspectRatio, params.aspectRatio);
    safeSet(s.imageSize, params.imageSize);
    alert('✅ Загружено из истории!');
}

window.setReferenceFromHistory = async (index, type) => {
    const item = state.history[index];
    if (!item) return;

    // Support both base64 and URL
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
        const file = new File([blob], `history_${index}.jpg`, { type: blob.type });
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
            card.style.transition = 'border-color 0.2s';
            card.style.borderColor = '#ffffff';
            setTimeout(() => { card.style.borderColor = ''; }, 300);
        }
        alert(`Reference [${type}] updated from history!`);
    } catch (e) {
        console.error('Failed to set reference', e);
        alert('Failed to load image for reference.');
    }
};

/* Shoots UI Logic */
function setupShootsUI() {
    if (els.shoot.btnNew) els.shoot.btnNew.addEventListener('click', handleNewShoot);
    if (els.shoot.btnLoad) els.shoot.btnLoad.addEventListener('click', openShootModal);
    if (els.shoot.modalClose) els.shoot.modalClose.addEventListener('click', closeShootModal);

    // Close modal on outside click
    els.shoot.modal.addEventListener('click', (e) => {
        if (e.target === els.shoot.modal) closeShootModal();
    });
}

async function handleNewShoot() {
    const name = prompt('Введите название съёмки/сессии:', `Session ${new Date().toLocaleDateString()}`);
    if (!name) return;

    try {
        const res = await fetch('/api/food-shoots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: name })
        });
        const json = await res.json();

        if (json.ok) {
            setCurrentShoot(json.data);
            state.history = []; // Clear current history
            renderHistory();
        } else {
            alert('Error: ' + json.error);
        }
    } catch (e) {
        console.error(e);
        alert('Connection error');
    }
}

async function openShootModal() {
    els.shoot.modal.classList.add('active');
    els.shoot.modalList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-text-muted);">Загрузка...</div>';

    try {
        const res = await fetch('/api/food-shoots');
        const json = await res.json();

        if (json.ok) {
            renderShootList(json.data);
        } else {
            els.shoot.modalList.innerHTML = `<div style="color:red; padding:20px;">Error: ${json.error}</div>`;
        }
    } catch (e) {
        els.shoot.modalList.innerHTML = `<div style="color:red; padding:20px;">Connection Error</div>`;
    }
}

function renderShootList(shoots) {
    if (!shoots || shoots.length === 0) {
        els.shoot.modalList.innerHTML = '<div style="padding: 20px; text-align: center;">Нет сохраненных съёмок</div>';
        return;
    }

    els.shoot.modalList.innerHTML = shoots.map(s => `
        <div class="shoot-item" data-id="${s.id}" style="
            padding: 12px; 
            border: 1px solid var(--color-border); 
            border-radius: 8px; 
            cursor: pointer; 
            display: flex; 
            justify-content: space-between; 
            background: rgba(255,255,255,0.05);
            margin-bottom: 8px;
        ">
            <div>
                <div style="font-weight: 600;">${escapeHtml(s.label)}</div>
                <div style="font-size: 11px; color: var(--color-text-muted);">
                    ${s.imageCount} фото • ${new Date(s.updatedAt).toLocaleDateString()}
                </div>
            </div>
            <button style="background:none; border:none; color: var(--color-accent);">Select ➜</button>
        </div>
    `).join('');

    // Attach handlers
    els.shoot.modalList.querySelectorAll('.shoot-item').forEach(item => {
        item.addEventListener('click', () => loadShoot(item.dataset.id));
    });
}

function closeShootModal() {
    els.shoot.modal.classList.remove('active');
}

async function loadShoot(id) {
    try {
        const res = await fetch(`/api/food-shoots/${id}`);
        const json = await res.json();

        if (json.ok) {
            const shoot = json.data;
            setCurrentShoot(shoot);

            // Populate history
            state.history = shoot.images || [];
            renderHistory();

            closeShootModal();
        } else {
            alert('Error loading shoot: ' + json.error);
        }
    } catch (e) {
        console.error(e);
        alert('Connection error loading shoot');
    }
}

function setCurrentShoot(shoot) {
    state.currentShoot = shoot;
    els.shoot.label.textContent = shoot.label;
    els.shoot.label.style.fontWeight = 'bold';
    els.shoot.label.style.opacity = '1';
}

/* Lightbox Logic */
const lightbox = {
    overlay: null,
    image: null,
    currentIndex: 0,
    images: []
};

function initLightbox() {
    if (!document.getElementById('lightbox')) {
        const lb = document.createElement('div');
        lb.id = 'lightbox';
        lb.className = 'lightbox-overlay';
        lb.innerHTML = `
<button class="lightbox-close" id="lightbox-close">×</button>
<div class="lightbox-container">
<img id="lightbox-image" class="lightbox-image" src="" alt="Full view">
</div>
`;
        document.body.appendChild(lb);
    }
    lightbox.overlay = document.getElementById('lightbox');
    lightbox.image = document.getElementById('lightbox-image');
    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    lightbox.overlay.addEventListener('click', (e) => {
        if (e.target === lightbox.overlay) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (!lightbox.overlay.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
    });
}

function openLightbox(index) {
    if (!lightbox.overlay) initLightbox();

    // Map history to URLs
    lightbox.images = state.history.map(item => {
        if (item.imageUrl) return item.imageUrl;
        return `data:${item.mimeType || 'image/jpeg'};base64,${item.base64}`;
    });

    lightbox.currentIndex = index;
    updateLightboxImage();
    lightbox.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function updateLightboxImage() {
    lightbox.image.src = lightbox.images[lightbox.currentIndex] || '';
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    initLightbox();
});
