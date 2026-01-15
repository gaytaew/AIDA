/**
 * Food Shoot Editor Logic
 */

// State
const state = {
    options: null,
    history: [], // Array of generated results
    images: {
        subject: null,
        crockery: null,
        style: null
    }
};

// Elements
const els = {
    dishDesc: document.getElementById('dish-desc'),
    changesDesc: document.getElementById('changes-desc'),
    btnGenerate: document.getElementById('btn-generate'),
    genStatus: document.getElementById('gen-status'),
    historyContainer: document.getElementById('history-container'),
    emptyState: document.getElementById('empty-state'),
    selects: {
        preset: document.getElementById('param-preset'), // New
        camera: document.getElementById('param-camera'),
        angle: document.getElementById('param-angle'),
        composition: document.getElementById('param-composition'), // New
        depth: document.getElementById('param-depth'), // New
        lighting: document.getElementById('param-lighting'),
        color: document.getElementById('param-color'), // New
        plating: document.getElementById('param-plating'),
        texture: document.getElementById('param-texture'), // New
        surface: document.getElementById('param-surface'), // Phase 4 (Was missing)
        crockery: document.getElementById('param-crockery'), // Phase 4 (Was missing)
        dynamics: document.getElementById('param-dynamics'), // New
        state: document.getElementById('param-state'),
        aspectRatio: document.getElementById('param-aspectRatio'),
        imageSize: document.getElementById('param-imageSize'),
    },
    refs: {
        subject: document.getElementById('ref-subject'),
        crockery: document.getElementById('ref-crockery'),
        style: document.getElementById('ref-style')
    }
};

// 1. Init
async function init() {
    await loadOptions();
    setupUploads();

    els.btnGenerate.addEventListener('click', generate);

    // Preset Listener
    els.selects.preset.addEventListener('change', (e) => {
        applyPreset(e.target.value);
    });
}

// 2. Load Options from Backend
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
        // Handle Presets array
        if (Array.isArray(data)) {
            select.innerHTML += data.map(o =>
                `<option value="${o.id}">${o.label}</option>`
            ).join('');
            return;
        }

        // Handle Parameter objects
        if (data && data.options) {
            select.innerHTML = data.options.map(o =>
                `<option value="${o.value}">${o.label}</option>`
            ).join('');
        }
    };

    // Populate Presets
    populate(els.selects.preset, state.options.presets);

    // Populate Params
    populate(els.selects.camera, state.options.camera);
    populate(els.selects.angle, state.options.angle);
    populate(els.selects.composition, state.options.composition);
    populate(els.selects.depth, state.options.depth);
    populate(els.selects.lighting, state.options.lighting);
    populate(els.selects.color, state.options.color);
    populate(els.selects.plating, state.options.plating);
    populate(els.selects.texture, state.options.texture);
    populate(els.selects.surface, state.options.surface); // Phase 4
    populate(els.selects.crockery, state.options.crockery); // Phase 4
    populate(els.selects.dynamics, state.options.dynamics);
    populate(els.selects.state, state.options.state);
    populate(els.selects.aspectRatio, state.options.aspectRatio);
    populate(els.selects.imageSize, state.options.imageSize);
}

function applyPreset(presetId) {
    if (!presetId) return;
    const preset = state.options.presets.find(p => p.id === presetId);
    if (!preset || !preset.values) return;

    // Apply values
    const v = preset.values;
    if (v.camera) els.selects.camera.value = v.camera;
    if (v.angle) els.selects.angle.value = v.angle;
    if (v.composition) els.selects.composition.value = v.composition;
    if (v.depth) els.selects.depth.value = v.depth;
    if (v.lighting) els.selects.lighting.value = v.lighting;
    if (v.color) els.selects.color.value = v.color;
    if (v.plating) els.selects.plating.value = v.plating;
    if (v.texture) els.selects.texture.value = v.texture;
    if (v.surface) els.selects.surface.value = v.surface; // Phase 4
    if (v.crockery) els.selects.crockery.value = v.crockery; // Phase 4
    if (v.dynamics) els.selects.dynamics.value = v.dynamics;
    if (v.state) els.selects.state.value = v.state;
}

// 3. File Upload Logic
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

function setupUploads() {
    ['subject', 'crockery', 'style'].forEach(type => {
        const card = els.refs[type];
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

// 4. Generation
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
                surface: els.selects.surface.value, // Phase 4
                crockery: els.selects.crockery.value, // Phase 4
                dynamics: els.selects.dynamics.value,
                state: els.selects.state.value,
                aspectRatio: els.selects.aspectRatio.value,
                imageSize: els.selects.imageSize.value,
                changesDescription: els.changesDesc.value.trim()
            },
            subjectImage: state.images.subject,
            crockeryImage: state.images.crockery,
            styleImage: state.images.style
        };

        const res = await fetch('/api/food/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        if (json.ok) {
            addToHistory(json.data);
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

function addToHistory(data) {
    state.history.unshift(data);
    renderHistory();
}

function loadParams(params) {
    if (!params) return;

    // Text inputs
    els.dishDesc.value = params.dishDescription || '';
    els.changesDesc.value = params.changesDescription || '';

    // Helper to safety set value
    const safeSet = (el, v) => { if (el && v) el.value = v; };

    safeSet(els.selects.camera, params.camera);
    safeSet(els.selects.angle, params.angle);
    safeSet(els.selects.composition, params.composition);
    safeSet(els.selects.depth, params.depth);
    safeSet(els.selects.lighting, params.lighting);
    safeSet(els.selects.color, params.color);
    safeSet(els.selects.plating, params.plating);
    safeSet(els.selects.texture, params.texture);
    safeSet(els.selects.surface, params.surface);
    safeSet(els.selects.crockery, params.crockery);
    safeSet(els.selects.dynamics, params.dynamics);
    safeSet(els.selects.state, params.state);
    safeSet(els.selects.aspectRatio, params.aspectRatio);
    safeSet(els.selects.imageSize, params.imageSize);

    alert('✅ Загружено из истории!');
}

function renderHistory() {
    if (state.history.length === 0) {
        els.historyContainer.innerHTML = '';
        els.emptyState.style.display = 'block';
        return;
    }

    els.emptyState.style.display = 'none';
    els.historyContainer.innerHTML = state.history.map((item, index) => {
        const p = item.params || {};
        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const v = (val) => val ? val : '-';

        return `
        <div class="history-card">
            <div style="position:relative;">
                <img src="data:${item.mimeType};base64,${item.base64}" loading="lazy" style="display:block;">
                <div style="position: absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); color:white; padding:2px 6px; border-radius:4px; font-size:10px;">${dateStr}</div>
            </div>
            
            <div class="history-info">
                <div style="font-weight:600; font-size:12px; margin-bottom:6px; color:#fff;">${p.dishDescription || 'No description'}</div>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px; font-size:10px; color:#999;">
                    <div>📸 ${v(p.camera)}</div>
                    <div>💡 ${v(p.lighting)}</div>
                    <div>🥣 ${v(p.crockery)}</div>
                    <div>🪵 ${v(p.surface)}</div>
                </div>

                ${p.changesDescription ? `<div style="margin-top:6px; color:#fbbf24; font-size:10px;">✏️ ${p.changesDescription}</div>` : ''}

                <div style="margin-top:8px; border-top:1px solid #333; padding-top:4px; font-size:9px; opacity:0.5;">
                     ${String(p.imageSize || '2k').toUpperCase()} • ${v(p.aspectRatio)}
                </div>
            </div>

            <div class="history-actions">
                 <button class="btn-mini" onclick="window.loadParamsHistory(${index})">♻️ Load</button>
                 <a href="data:${item.mimeType};base64,${item.base64}" download="food_${index}.jpg" class="btn-mini" style="text-align:center; text-decoration:none; color:white;">💾 Save</a>
            </div>
        </div>`;
    }).join('');
}

window.loadParamsHistory = (index) => {
    if (state.history[index]) loadParams(state.history[index].params);
};

els.emptyState.style.display = 'none';

// Clear keeping empty state ref? No need, just redraw.
els.historyContainer.innerHTML = '';

state.history.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'history-card';

    card.innerHTML = `
            <img src="data:${item.mimeType};base64,${item.base64}">
            <div class="history-actions">
                <button class="btn-mini btn-load" data-index="${index}">📥 Load Params</button>
                <a href="data:${item.mimeType};base64,${item.base64}" download="food-shoot-${index}.jpg" class="btn-mini" style="text-align:center; text-decoration:none;">💾 Save</a>
            </div>
            <div class="history-info">
                <strong>${item.params.dishDescription.slice(0, 30)}...</strong><br>
                Format: ${item.params.aspectRatio} • Quality: ${item.params.quality}
            </div>
        `;

    // Bind Load Param
    card.querySelector('.btn-load').addEventListener('click', () => {
        loadParams(item.params);
    });

    els.historyContainer.appendChild(card);
});
}

// Start
document.addEventListener('DOMContentLoaded', init);
