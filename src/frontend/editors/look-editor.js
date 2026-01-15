/**
 * Look Editor Logic
 */

let currentItems = [];
let currentLookId = null;
let currentCoverBase64 = null; // Staged new cover image

// Initial Load
document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadGallery();
    setupEventListeners();
});

async function loadCategories() {
    try {
        const res = await fetch('/api/looks/options');
        const json = await res.json();
        if (json.ok) {
            const select = document.getElementById('look-category');
            select.innerHTML = json.data.categories.map(c =>
                `<option value="${c.value}">${c.label}</option>`
            ).join('');
        }
    } catch (e) {
        console.error('Failed to load categories', e);
    }
}

// Helper to get image URL
function getLookImageUrl(look) {
    if (!look || !look.coverImage) return null;
    if (look.coverImage.startsWith('data:')) return look.coverImage;
    if (look.coverImage.startsWith('/')) return look.coverImage;

    // Construct path: /api/looks/images/{safeId}/{filename}
    // We need safeId helper or rely on look.id if it's safe-ish.
    // Backend uses safeId.
    const safeId = look.id.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
    return `/api/looks/images/${safeId}/${look.coverImage}`;
}

async function loadGallery() {
    const gallery = document.getElementById('looks-gallery');
    gallery.innerHTML = '<div style="padding: 20px; color: var(--color-text-muted);">Загрузка...</div>';

    try {
        const res = await fetch('/api/looks');
        const json = await res.json();

        if (!json.ok || !json.data.length) {
            gallery.innerHTML = '<div style="padding: 20px; color: var(--color-text-muted);">Нет сохранённых образов</div>';
            return;
        }

        gallery.innerHTML = json.data.map(look => {
            const imgUrl = getLookImageUrl(look);
            const bg = imgUrl ? `url('${imgUrl}?t=${Date.now()}')` : getColorHash(look.id);
            const style = imgUrl
                ? `background-image: ${bg}; background-size: cover; background-position: center;`
                : `background: ${bg};`;

            return `
            <div class="look-card ${currentLookId === look.id ? 'selected' : ''}" onclick="selectLook('${look.id}')">
                <div class="look-card-preview" style="${style}">
                    ${!imgUrl ? '<div style="position: absolute; bottom: 8px; left: 8px; font-size: 24px;">👔</div>' : ''}
                </div>
                <div class="look-card-info">
                    <div class="look-card-title">${look.label}</div>
                    <div class="look-card-meta">${look.items.length} items • ${look.category}</div>
                </div>
            </div>
        `}).join('');
    } catch (e) {
        console.error('Gallery error', e);
        gallery.innerHTML = 'Error loading gallery';
    }
}

// Generate a consistent pastel color from ID
function getColorHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c + '20'; // 20 for low opacity
}

window.selectLook = async (id) => {
    currentLookId = id;
    const res = await fetch(`/api/looks/${id}`);
    const json = await res.json();

    if (json.ok) {
        fillForm(json.data);
        loadGallery(); // Refresh to update selection state
    }
};

function fillForm(look) {
    document.getElementById('look-label').value = look.label;
    document.getElementById('look-category').value = look.category;
    document.getElementById('look-prompt-tech').value = look.prompt?.tech?.description || '';

    currentItems = look.items || [];
    renderItems();

    // Images
    currentCoverBase64 = null; // Clear staged
    if (look.coverImage) {
        const url = getLookImageUrl(look);
        setCoverPreview(url);
    } else {
        clearCoverPreview();
    }

    document.getElementById('btn-delete').style.display = 'block';
}

function renderItems() {
    const container = document.getElementById('items-list');
    container.innerHTML = currentItems.map((item, idx) => `
        <div class="look-item">
            <div class="look-item-image" style="background: #333; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px;">👕</span>
            </div>
            <div class="look-item-content">
                <div class="look-item-header">
                    <span class="look-item-type">${item.type}</span>
                    <span class="btn-remove-item" onclick="removeItem(${idx})">×</span>
                </div>
                <div class="look-item-desc">${item.description}</div>
            </div>
        </div>
    `).join('');
}

window.removeItem = (idx) => {
    currentItems.splice(idx, 1);
    renderItems();
};

function setupEventListeners() {
    // Cover Upload
    const zone = document.getElementById('cover-upload-zone');
    const input = document.getElementById('cover-input');
    const btnRemove = document.getElementById('btn-remove-cover');

    zone.onclick = (e) => {
        if (e.target !== btnRemove) input.click();
    };

    input.onchange = async (e) => {
        if (e.target.files.length) {
            await handleCoverFile(e.target.files[0]);
        }
    };

    btnRemove.onclick = (e) => {
        e.stopPropagation();
        clearCoverPreview();
        currentCoverBase64 = null;
        input.value = '';
    };

    // Drag & Drop
    zone.ondragover = (e) => {
        e.preventDefault();
        zone.style.borderColor = 'var(--color-accent)';
    };
    zone.ondragleave = () => {
        zone.style.borderColor = 'var(--color-border)';
    };
    zone.ondrop = async (e) => {
        e.preventDefault();
        zone.style.borderColor = 'var(--color-border)';
        if (e.dataTransfer.files.length) {
            await handleCoverFile(e.dataTransfer.files[0]);
        }
    };

    // Paste
    document.addEventListener('paste', async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                await handleCoverFile(item.getAsFile());
                break; // One image at a time
            }
        }
    });

    // Add Item Modal
    const modal = document.getElementById('item-modal');
    const btnAdd = document.getElementById('btn-add-item');
    const btnCancel = document.getElementById('btn-cancel-item');
    const btnConfirm = document.getElementById('btn-confirm-item');

    btnAdd.onclick = () => {
        document.getElementById('item-desc-input').value = '';
        modal.style.display = 'flex';
        document.getElementById('item-desc-input').focus();
    };

    btnCancel.onclick = () => {
        modal.style.display = 'none';
    };

    btnConfirm.onclick = () => {
        const type = document.getElementById('item-type-select').value;
        const desc = document.getElementById('item-desc-input').value;

        if (desc) {
            currentItems.push({
                id: Date.now().toString(),
                type,
                description: desc
            });
            renderItems();
            modal.style.display = 'none';
        }
    };

    // Form Submit
    document.getElementById('look-form').onsubmit = async (e) => {
        e.preventDefault();

        const data = {
            label: document.getElementById('look-label').value,
            category: document.getElementById('look-category').value,
            items: currentItems,
            prompt: {
                tech: { description: document.getElementById('look-prompt-tech').value }
            },
            coverImageBase64: currentCoverBase64 // Only sent if changed/new
        };

        let url = '/api/looks';
        let method = 'POST';

        if (currentLookId) {
            url += `/${currentLookId}`;
            method = 'PUT';
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const json = await res.json();
            if (json.ok) {
                if (method === 'POST') {
                    clearForm();
                } else {
                    currentLookId = json.data.id;
                    fillForm(json.data); // Reload to get processed URLs
                }
                loadGallery();
            } else {
                alert('Error: ' + JSON.stringify(json.errors));
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save');
        }
    };

    document.getElementById('btn-clear').onclick = clearForm;

    document.getElementById('btn-delete').onclick = async () => {
        if (!currentLookId || !confirm('Are you sure?')) return;

        await fetch(`/api/looks/${currentLookId}`, { method: 'DELETE' });
        clearForm();
        loadGallery();
    };
}

function clearForm() {
    currentLookId = null;
    currentCoverBase64 = null;
    document.getElementById('look-label').value = '';
    document.getElementById('look-prompt-tech').value = '';
    currentItems = [];
    renderItems();
    clearCoverPreview();
    document.getElementById('btn-delete').style.display = 'none';
    loadGallery();
}

function setCoverPreview(src) {
    const img = document.getElementById('cover-preview');
    const ph = document.getElementById('cover-placeholder');
    const btn = document.getElementById('btn-remove-cover');

    img.src = src;
    img.style.display = 'block';
    ph.style.display = 'none';
    btn.style.display = 'block';
}

function clearCoverPreview() {
    const img = document.getElementById('cover-preview');
    const ph = document.getElementById('cover-placeholder');
    const btn = document.getElementById('btn-remove-cover');

    img.src = '';
    img.style.display = 'none';
    ph.style.display = 'flex';
    btn.style.display = 'none';
}

// Image Utils
async function handleCoverFile(file) {
    if (!file) return;
    try {
        const compressed = await compressImage(file);
        currentCoverBase64 = compressed; // raw base64 string
        setCoverPreview(`data:image/jpeg;base64,${compressed}`);
    } catch (e) {
        console.error(e);
        alert('Failed to process image');
    }
}

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = () => { img.src = reader.result; };
        reader.onerror = reject;

        img.onload = () => {
            const maxSize = 1200;
            let { width, height } = img;

            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Return base64 WITHOUT prefix, backend expects just data
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl.split(',')[1]);
        };
        img.onerror = () => reject(new Error('Image load failed'));

        reader.readAsDataURL(file);
    });
}
