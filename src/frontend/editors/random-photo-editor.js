/**
 * Random Photo Editor — Frontend Logic
 * 
 * Manages UI state, parameter collection, reference uploads,
 * generation calls, gallery rendering, and session management.
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const state = {
    options: null,
    history: [],
    currentShoot: null,
    references: [null, null, null, null],
    isGenerating: false
};

// ═══════════════════════════════════════════════════════════════
// DOM REFERENCES
// ═══════════════════════════════════════════════════════════════

const els = {
    // Params
    theme: document.getElementById('param-theme'),
    style: document.getElementById('param-style'),
    imageSize: document.getElementById('param-imageSize'),
    aspectRatio: document.getElementById('param-aspectRatio'),
    customPrompt: document.getElementById('custom-prompt'),

    // References
    refGrid: document.getElementById('ref-grid'),
    refFileInput: document.getElementById('ref-file-input'),

    // Controls
    controlsPanel: document.getElementById('controls-panel'),
    controlsToggle: document.getElementById('controls-toggle'),
    toggleIcon: document.getElementById('toggle-icon'),

    // Action bar
    sessionLabel: document.getElementById('session-label'),
    btnNewSession: document.getElementById('btn-new-session'),
    btnOpenSession: document.getElementById('btn-open-session'),
    btnGenerate: document.getElementById('btn-generate'),

    // Gallery
    gallery: document.getElementById('gallery'),
    galleryEmpty: document.getElementById('gallery-empty'),

    // Lightbox
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightbox-img'),
    lightboxClose: document.getElementById('lightbox-close'),

    // Loading
    loading: document.getElementById('loading'),

    // Modal
    modalOverlay: document.getElementById('modal-overlay'),
    modalClose: document.getElementById('modal-close'),
    modalBody: document.getElementById('modal-body')
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

async function init() {
    try {
        // Load options
        const res = await fetch('/api/random-photos/options');
        const data = await res.json();
        if (!data.ok) throw new Error('Failed to load options');
        state.options = data.data;

        populateSelects();
        bindEvents();
        updateGalleryView();

        console.log('[RandomPhotoEditor] Initialized');
    } catch (err) {
        console.error('[RandomPhotoEditor] Init error:', err);
    }
}

function populateSelects() {
    const { themes, style, imageSize, aspectRatio } = state.options;

    fillSelect(els.theme, themes.options, 'nature');
    fillSelect(els.style, style.options, 'photorealistic');
    fillSelect(els.imageSize, imageSize.options, '2k');
    fillSelect(els.aspectRatio, aspectRatio.options, '1:1');
}

function fillSelect(el, options, defaultValue) {
    el.innerHTML = '';
    for (const opt of options) {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        if (opt.value === defaultValue) o.selected = true;
        el.appendChild(o);
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENT BINDING
// ═══════════════════════════════════════════════════════════════

let activeRefSlot = null;

function bindEvents() {
    // Toggle controls
    els.controlsToggle.addEventListener('click', () => {
        els.controlsPanel.classList.toggle('collapsed');
        els.toggleIcon.classList.toggle('collapsed');
    });

    // Generate
    els.btnGenerate.addEventListener('click', generate);

    // Session buttons
    els.btnNewSession.addEventListener('click', createNewSession);
    els.btnOpenSession.addEventListener('click', openSessionModal);

    // Lightbox
    els.lightboxClose.addEventListener('click', closeLightbox);
    els.lightbox.addEventListener('click', (e) => {
        if (e.target === els.lightbox) closeLightbox();
    });

    // Modal
    els.modalClose.addEventListener('click', closeModal);
    els.modalOverlay.addEventListener('click', (e) => {
        if (e.target === els.modalOverlay) closeModal();
    });

    // Reference slots
    const slots = els.refGrid.querySelectorAll('.rp-ref-slot');
    slots.forEach(slot => {
        slot.addEventListener('click', () => {
            const idx = parseInt(slot.dataset.index);
            if (state.references[idx]) return; // already filled, use remove btn
            activeRefSlot = idx;
            els.refFileInput.click();
        });
    });

    // File input
    els.refFileInput.addEventListener('change', handleRefUpload);

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            closeModal();
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// REFERENCE IMAGE HANDLING
// ═══════════════════════════════════════════════════════════════

function handleRefUpload(e) {
    const file = e.target.files?.[0];
    if (!file || activeRefSlot === null) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        const base64Full = ev.target.result;
        const base64Data = base64Full.split(',')[1];
        const mimeType = file.type || 'image/jpeg';

        state.references[activeRefSlot] = { base64: base64Data, mimeType };
        renderRefSlot(activeRefSlot);
        activeRefSlot = null;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

function renderRefSlot(idx) {
    const slot = els.refGrid.querySelector(`[data-index="${idx}"]`);
    const ref = state.references[idx];

    if (ref) {
        slot.classList.add('filled');
        slot.innerHTML = `
            <img src="data:${ref.mimeType};base64,${ref.base64}" alt="Ref ${idx + 1}">
            <button class="rp-ref-remove" onclick="event.stopPropagation(); removeRef(${idx})">✕</button>
        `;
    } else {
        slot.classList.remove('filled');
        slot.innerHTML = '<span class="plus-icon">+</span>';
    }
}

function removeRef(idx) {
    state.references[idx] = null;
    renderRefSlot(idx);
}
// Make globally accessible for onclick
window.removeRef = removeRef;

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

async function generate() {
    if (state.isGenerating) return;
    state.isGenerating = true;
    showLoading(true);
    els.btnGenerate.disabled = true;

    // Auto-create session if none
    if (!state.currentShoot) {
        await createNewSession();
    }

    try {
        const params = collectParams();
        const referenceImages = state.references
            .filter(r => r !== null)
            .map(r => ({ base64: r.base64, mimeType: r.mimeType }));

        const res = await fetch('/api/random-photos/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                params,
                referenceImages,
                shootId: state.currentShoot?.id
            })
        });

        const data = await res.json();

        if (!data.ok) {
            throw new Error(data.error || 'Generation failed');
        }

        // Add to local history
        const item = {
            id: data.data.id,
            base64: data.data.base64,
            imageUrl: data.data.savedSnapshot?.imageUrl || null,
            basePrompt: data.data.basePrompt,
            theme: data.data.theme,
            style: data.data.style,
            snapshotId: data.data.savedSnapshot?.id || null,
            createdAt: data.data.createdAt
        };

        state.history.unshift(item);
        updateGalleryView();

        // Collapse controls after first gen
        if (!els.controlsPanel.classList.contains('collapsed')) {
            els.controlsPanel.classList.add('collapsed');
            els.toggleIcon.classList.add('collapsed');
        }

    } catch (err) {
        console.error('[RandomPhotoEditor] Generation error:', err);
        alert('Ошибка генерации: ' + err.message);
    } finally {
        state.isGenerating = false;
        showLoading(false);
        els.btnGenerate.disabled = false;
    }
}

function collectParams() {
    return {
        theme: els.theme.value,
        style: els.style.value,
        imageSize: els.imageSize.value,
        aspectRatio: els.aspectRatio.value,
        customPrompt: els.customPrompt.value.trim() || ''
    };
}

// ═══════════════════════════════════════════════════════════════
// GALLERY RENDERING
// ═══════════════════════════════════════════════════════════════

function updateGalleryView() {
    if (state.history.length === 0) {
        els.gallery.innerHTML = '';
        els.galleryEmpty.style.display = 'flex';
        return;
    }

    els.galleryEmpty.style.display = 'none';

    els.gallery.innerHTML = state.history.map(item => {
        const imgSrc = item.imageUrl || `data:image/png;base64,${item.base64}`;
        const themeName = getThemeLabel(item.theme);
        const styleName = getStyleLabel(item.style);

        return `
            <div class="rp-card" data-id="${item.id}">
                <img class="rp-card-img" src="${imgSrc}" alt="Generated" onclick="openLightbox('${imgSrc.replace(/'/g, "\\'")}')">
                <div class="rp-card-info">
                    <div class="rp-card-prompt" title="${escapeHtml(item.basePrompt || '')}">${escapeHtml(item.basePrompt || 'Custom prompt')}</div>
                    <div class="rp-card-meta">
                        <div class="rp-card-tags">
                            <span class="rp-card-tag">${themeName}</span>
                            <span class="rp-card-tag">${styleName}</span>
                        </div>
                        <div class="rp-card-actions">
                            <button class="rp-card-btn" title="Скачать" onclick="downloadImage('${imgSrc.replace(/'/g, "\\'")}', '${item.id}')">💾</button>
                            <button class="rp-card-btn" title="Удалить" onclick="deleteSnapshot('${item.snapshotId}', '${item.id}')">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getThemeLabel(value) {
    if (!state.options) return value || '?';
    const t = state.options.themes.options.find(o => o.value === value);
    return t?.label || value || '?';
}

function getStyleLabel(value) {
    if (!state.options) return value || '?';
    const s = state.options.style.options.find(o => o.value === value);
    return s?.label || value || '?';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════════
// LIGHTBOX
// ═══════════════════════════════════════════════════════════════

function openLightbox(src) {
    els.lightboxImg.src = src;
    els.lightbox.classList.add('active');
}
window.openLightbox = openLightbox;

function closeLightbox() {
    els.lightbox.classList.remove('active');
    els.lightboxImg.src = '';
}

// ═══════════════════════════════════════════════════════════════
// DOWNLOAD
// ═══════════════════════════════════════════════════════════════

function downloadImage(src, id) {
    const a = document.createElement('a');
    a.href = src;
    a.download = `random-photo-${id.substring(0, 8)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
window.downloadImage = downloadImage;

// ═══════════════════════════════════════════════════════════════
// SNAPSHOT DELETION
// ═══════════════════════════════════════════════════════════════

async function deleteSnapshot(snapshotId, itemId) {
    if (!state.currentShoot || !snapshotId) return;
    if (!confirm('Удалить этот снимок?')) return;

    try {
        await fetch(`/api/random-photos/shoots/${state.currentShoot.id}/snapshots/${snapshotId}`, {
            method: 'DELETE'
        });

        state.history = state.history.filter(h => h.id !== itemId);
        updateGalleryView();
    } catch (err) {
        console.error('[RandomPhotoEditor] Delete error:', err);
    }
}
window.deleteSnapshot = deleteSnapshot;

// ═══════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════

async function createNewSession() {
    try {
        const res = await fetch('/api/random-photos/shoots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: `Сессия ${new Date().toLocaleString('ru-RU')}` })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        state.currentShoot = { id: data.data.id, label: data.data.label };
        state.history = [];
        els.sessionLabel.textContent = state.currentShoot.label;
        updateGalleryView();
    } catch (err) {
        console.error('[RandomPhotoEditor] Create session error:', err);
    }
}

async function openSessionModal() {
    try {
        const res = await fetch('/api/random-photos/shoots');
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        const shoots = data.data;

        if (shoots.length === 0) {
            els.modalBody.innerHTML = '<p style="color: var(--text-muted)">Нет сохранённых сессий</p>';
        } else {
            els.modalBody.innerHTML = shoots.map(s => `
                <div class="rp-shoot-item" onclick="loadSession('${s.id}')">
                    <div class="rp-shoot-preview">
                        ${s.previewUrl ? `<img src="${s.previewUrl}" alt="">` : '🎲'}
                    </div>
                    <div class="rp-shoot-info">
                        <div class="rp-shoot-name">${escapeHtml(s.label)}</div>
                        <div class="rp-shoot-stats">${s.snapshotCount || 0} фото · ${formatDate(s.createdAt)}</div>
                    </div>
                    <button class="rp-shoot-delete" onclick="event.stopPropagation(); deleteSession('${s.id}')" title="Удалить">🗑️</button>
                </div>
            `).join('');
        }

        els.modalOverlay.classList.add('active');
    } catch (err) {
        console.error('[RandomPhotoEditor] Open modal error:', err);
    }
}

async function loadSession(shootId) {
    try {
        const res = await fetch(`/api/random-photos/shoots/${shootId}`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        const shoot = data.data;
        state.currentShoot = { id: shoot.id, label: shoot.label };
        els.sessionLabel.textContent = shoot.label;

        // Load snapshots into history
        state.history = (shoot.snapshots || []).reverse().map(snap => ({
            id: snap.id,
            base64: null,
            imageUrl: snap.imageUrl,
            basePrompt: snap.prompt || snap.params?.customPrompt || '',
            theme: snap.theme || snap.params?.theme || '',
            style: snap.style || snap.params?.style || '',
            snapshotId: snap.id,
            createdAt: snap.createdAt
        }));

        updateGalleryView();
        closeModal();
    } catch (err) {
        console.error('[RandomPhotoEditor] Load session error:', err);
    }
}
window.loadSession = loadSession;

async function deleteSession(shootId) {
    if (!confirm('Удалить эту сессию и все фото?')) return;

    try {
        await fetch(`/api/random-photos/shoots/${shootId}`, { method: 'DELETE' });

        // If this was the current session, reset
        if (state.currentShoot?.id === shootId) {
            state.currentShoot = null;
            state.history = [];
            els.sessionLabel.textContent = 'Без сессии';
            updateGalleryView();
        }

        // Refresh modal
        await openSessionModal();
    } catch (err) {
        console.error('[RandomPhotoEditor] Delete session error:', err);
    }
}
window.deleteSession = deleteSession;

function closeModal() {
    els.modalOverlay.classList.remove('active');
}

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════

function showLoading(show) {
    if (show) {
        els.loading.classList.add('active');
    } else {
        els.loading.classList.remove('active');
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
}

// ═══════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', init);
