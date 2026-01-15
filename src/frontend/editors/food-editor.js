/**
 * Food Shoot Editor Logic
 */

// State
const state = {
    options: null,
    images: {
        subject: null,
        crockery: null,
        style: null
    }
};

// Elements
const els = {
    dishDesc: document.getElementById('dish-desc'),
    btnGenerate: document.getElementById('btn-generate'),
    genStatus: document.getElementById('gen-status'),
    resultContainer: document.getElementById('result-container'),
    emptyState: document.getElementById('empty-state'),
    selects: {
        camera: document.getElementById('param-camera'),
        angle: document.getElementById('param-angle'),
        lighting: document.getElementById('param-lighting'),
        plating: document.getElementById('param-plating'),
        state: document.getElementById('param-state'),
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
                state: els.selects.state.value
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
            showResult(json.data);
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

function showResult(data) {
    els.emptyState.style.display = 'none';

    els.resultContainer.innerHTML = `
    <img src="data:${data.mimeType};base64,${data.base64}" class="result-image">
    <div style="margin-top: 16px; text-align: left; background: #111; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #888; overflow-x: auto;">
      <strong>PROMPT:</strong><br>
      ${data.prompt.replace(/\n/g, '<br>')}
    </div>
  `;
}

// Start
document.addEventListener('DOMContentLoaded', init);
