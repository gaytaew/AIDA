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
    changesDesc: document.getElementById('changes-desc'),
    btnGenerate: document.getElementById('btn-generate'),
    genStatus: document.getElementById('gen-status'),
    historyContainer: document.getElementById('history-container'),
    emptyState: document.getElementById('empty-state')
};

// ...

function setupUploads() {
    ['subject', 'crockery', 'style', 'sketch'].forEach(type => { // Added 'sketch'
        const card = els.refs[type];
        if (!card) return; // Guard clause just in case

        // ...

        // 4. Generation
        async function generate() {
            // ...
            try {
                const payload = {
                    params: {
                        // ... (params)
                    },
                    subjectImage: state.images.subject,
                    crockeryImage: state.images.crockery,
                    styleImage: state.images.style,
                    sketchImage: state.images.sketch // Phase 8
                };
                // ...

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
                    populate(els.selects.mood, state.options.mood); // Phase 7
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
                    if (v.mood) els.selects.mood.value = v.mood; // Phase 7
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

                /* ═══════════════════════════════════════
                   HISTORY & GALLERY (V5 Standard)
                   ═══════════════════════════════════════ */

                function renderHistory() {
                    // Map to V5 standard 'generatedFrames' format for compatibility if needed, 
                    // but we can just render state.history directly using the V5 template logic.

                    if (state.history.length === 0) {
                        els.historyContainer.innerHTML = `
          <div class="empty-state" id="empty-state" style="grid-column: 1 / -1; padding: 40px;">
            <div class="empty-state-icon">🍔</div>
            <div class="empty-state-title">История пуста</div>
            <div class="empty-state-text">Здесь появятся ваши вкусные кадры</div>
          </div>`;
                        return;
                    }

                    els.historyContainer.innerHTML = state.history.map((item, idx) => {
                        const p = item.params || {};
                        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                        const imageUrl = `data:${item.mimeType};base64,${item.base64}`; // Construct URL for Lightbox/Img

                        // Settings HTML
                        const settingsHtml = buildFoodSettingsHtml(p);

                        return `
      <div class="selection-card generated-frame-card" style="cursor: default; position: relative;">
        <!-- Lock badges -->
        <div class="history-lock-badges">
          ${p.surface ? '<span class="history-lock-badge style" title="Surface Set">🪵</span>' : ''}
          ${p.crockery ? '<span class="history-lock-badge location" title="Crockery Set">🥣</span>' : ''}
        </div>
        
        <div class="selection-card-preview btn-open-lightbox" data-index="${idx}" style="cursor: pointer;" title="Клик для просмотра">
          <img src="${imageUrl}" alt="Food Shot" style="object-fit: contain; background: #000; pointer-events: none;">
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
            <a href="${imageUrl}" download="food_${idx}.jpg" class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px; flex: 1;">💾 Save</a>
            <button class="btn btn-secondary" onclick="window.loadParamsHistory(${idx})" style="padding: 8px 12px; font-size: 12px; flex: 1;" title="Load Params">♻️ Load</button>
            <button class="btn btn-secondary" onclick="window.deleteHistoryItem(${idx})" style="padding: 8px 12px; font-size: 12px; color: var(--color-accent);">✕</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
            <button class="btn-mini" onclick="window.setReferenceFromHistory(${idx}, 'subject')" title="Use as Subject Ref" style="font-size:10px;">🍲 Ref</button>
            <button class="btn-mini" onclick="window.setReferenceFromHistory(${idx}, 'crockery')" title="Use as Crockery Ref" style="font-size:10px;">🥣 Crockery</button>
            <button class="btn-mini" onclick="window.setReferenceFromHistory(${idx}, 'style')" title="Use as Style Ref" style="font-size:10px;">🎨 Style</button>
          </div>
        </div>
        
        <!-- Settings Details -->
        <details style="margin-top: 12px; width: 100%;">
          <summary style="cursor: pointer; font-size: 11px; color: var(--color-text-muted); user-select: none;">
            ⚙️ Детали и Настройки
          </summary>
          <div style="margin-top: 10px; text-align: left; font-size: 11px; background: var(--color-surface); padding: 10px; border-radius: 8px; border: 1px solid var(--color-border);">
            ${settingsHtml}
          </div>
        </details>
        
        <!-- Prompt Debug -->
        <details style="margin-top: 8px; width: 100%;">
          <summary style="cursor: pointer; font-size: 11px; color: var(--color-text-muted); user-select: none;">
            📋 Промпт
          </summary>
          <div style="margin-top: 10px; text-align: left;">
            <pre style="white-space: pre-wrap; word-break: break-word; background: var(--color-surface-elevated); color: var(--color-text); padding: 10px; border-radius: 8px; max-height: 150px; overflow: auto; font-size: 10px; font-family: monospace; border: 1px solid var(--color-border); margin-top: 10px;">${escapeHtml(item.prompt || 'N/A')}</pre>
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

                window.setReferenceFromHistory = async (index, type) => {
                    const item = state.history[index];
                    if (!item) return;

                    // Convert base64 to Blob/DataURL
                    const dataUrl = `data:${item.mimeType};base64,${item.base64}`;

                    // Create a virtual file object
                    const blob = await fetch(dataUrl).then(res => res.blob());
                    const file = new File([blob], `history_${index}.jpg`, { type: item.mimeType });
                    const compressed = await compressImage(file);

                    // Update State
                    state.images[type] = compressed;

                    // Update UI Card
                    const card = els.refs[type];
                    card.classList.add('has-image');
                    card.style.backgroundImage = `url(${compressed.dataUrl})`;
                    card.style.backgroundSize = 'cover';
                    card.style.backgroundPosition = 'center';
                    card.querySelector('.ref-card-icon').style.display = 'none';
                    card.querySelector('.ref-card-label').style.display = 'none';

                    // Flash effect
                    card.style.transition = 'border-color 0.2s';
                    const originalBorder = card.style.borderColor;
                    card.style.borderColor = '#ffffff';
                    setTimeout(() => {
                        card.style.borderColor = '';
                    }, 300);

                    alert(`Reference [${type}] updated from history!`);
                };

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

                    // Group others
                    const extras = [];
                    if (p.texture) extras.push(`Фактура: ${p.texture}`);
                    if (p.steam) extras.push(`Пар: ${p.steam}`);
                    if (p.color) extras.push(`Цвет: ${p.color}`);

                    if (extras.length > 0) {
                        items.push(`<div><strong>✨ Детали:</strong> ${extras.join(', ')}</div>`);
                    }

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

                // ═══════════════════════════════════════════════════════════════
                // LIGHTBOX
                // ═══════════════════════════════════════════════════════════════

                const lightbox = {
                    overlay: null,
                    image: null,
                    currentIndex: 0,
                    images: [] // base64 strings
                };

                function initLightbox() {
                    // Create lightbox DOM if not exists
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

                    lightbox.images = state.history.map(item => `data:${item.mimeType};base64,${item.base64}`);
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

                // Start
                document.addEventListener('DOMContentLoaded', () => {
                    init();
                    initLightbox();
                });
