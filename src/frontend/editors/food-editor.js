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
        camera: document.getElementById('param-camera'),
        angle: document.getElementById('param-angle'),
        lighting: document.getElementById('param-lighting'),
        plating: document.getElementById('param-plating'),
        state: document.getElementById('param-state'),
        aspectRatio: document.getElementById('param-aspectRatio'),
        quality: document.getElementById('param-quality'),
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

    const populate = (select, opts) => {
        select.innerHTML = opts.options.map(o =>
            `<option value="${o.value}">${o.label}</option>`
        ).join('');
    };

    populate(els.selects.camera, state.options.camera);
    populate(els.selects.angle, state.options.angle);
    populate(els.selects.lighting, state.options.lighting);
    populate(els.selects.plating, state.options.plating);
    populate(els.selects.state, state.options.state);
    populate(els.selects.aspectRatio, state.options.aspectRatio);
    populate(els.selects.quality, state.options.quality);
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
                lighting: els.selects.lighting.value,
                plating: els.selects.plating.value,
                state: els.selects.state.value,
                aspectRatio: els.selects.aspectRatio.value,
                quality: els.selects.quality.value,
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
    // Text inputs
    if (params.dishDescription) els.dishDesc.value = params.dishDescription;
    if (params.changesDescription) els.changesDesc.value = params.changesDescription;

    // Selects
    if (params.camera) els.selects.camera.value = params.camera;
    if (params.angle) els.selects.angle.value = params.angle;
    if (params.lighting) els.selects.lighting.value = params.lighting;
    if (params.plating) els.selects.plating.value = params.plating;
    if (params.state) els.selects.state.value = params.state;
    if (params.aspectRatio) els.selects.aspectRatio.value = params.aspectRatio;
    if (params.quality) els.selects.quality.value = params.quality;

    alert('Параметры загружены!');
}

function renderHistory() {
    if (state.history.length === 0) {
        els.emptyState.style.display = 'block';
        els.historyContainer.innerHTML = '';
        els.historyContainer.appendChild(els.emptyState);
        return;
    }

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
