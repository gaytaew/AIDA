/**
 * Look Editor Logic
 */

let currentItems = [];
let currentLookId = null;
let currentCollageBase64 = null; // Auto-generated
let tempItemImages = []; // Array of base64 strings

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

// ═══════════════════════════════════════════════════════════════
// GALLERY & DISPLAY
// ═══════════════════════════════════════════════════════════════

function getLookImageUrl(look, filename) {
    if (!filename) return null;
    if (filename.startsWith('data:')) return filename;

    // Check if filename is actually a full URL (legacy or external)
    if (filename.startsWith('/')) return filename;

    // Construct path: /api/looks/images/{safeId}/{filename}
    const safeId = look.id.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
    return `/api/looks/images/${safeId}/${filename}`;
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
            const imgUrl = getLookImageUrl(look, look.coverImage);
            const bg = imgUrl ? `url('${imgUrl}?t=${Date.now()}')` : getColorHash(look.id);
            const style = imgUrl
                ? `background-image: ${bg}; background-size: cover; background-position: top center;`
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

function getColorHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c + '20';
}

// ═══════════════════════════════════════════════════════════════
// SELECTION & EDITOR
// ═══════════════════════════════════════════════════════════════

window.selectLook = async (id) => {
    currentLookId = id;
    const res = await fetch(`/api/looks/${id}`);
    const json = await res.json();

    if (json.ok) {
        fillForm(json.data);
        loadGallery();
    }
};

function fillForm(look) {
    document.getElementById('look-label').value = look.label;
    document.getElementById('look-category').value = look.category;
    document.getElementById('look-prompt-tech').value = look.prompt?.tech?.description || '';

    // clone items
    currentItems = (look.items || []).map(item => ({ ...item }));

    // Render items
    renderItems();

    // Render collage (load cover image)
    if (look.coverImage) {
        const url = getLookImageUrl(look, look.coverImage);
        setCollagePreview(url);
    } else if (currentItems.length > 0) {
        updateCollage(); // Regenerate if missing but items exist? 
        // Or if we load an existing look, we assume coverImage is good. 
        // But if user adds items, we regenerate.
    } else {
        clearCollagePreview();
    }

    document.getElementById('btn-delete').style.display = 'block';
}

function renderItems() {
    const container = document.getElementById('items-list');
    container.innerHTML = currentItems.map((item, idx) => {
        let imgHtml = '';

        // Gather all image sources for this item
        // 1. New images (base64)
        if (item.imagesBase64 && item.imagesBase64.length) {
            imgHtml += item.imagesBase64.map(b64 =>
                `<img src="data:image/jpeg;base64,${b64}" style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #444;">`
            ).join('');
        }

        // 2. Saved images
        if (item.images && item.images.length) {
            imgHtml += item.images.map(filename =>
                `<img src="${getLookImageUrl({ id: currentLookId }, filename)}" style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #444;">`
            ).join('');
        }
        // 3. Legacy single saved image
        else if (item.image) {
            imgHtml = `<img src="${getLookImageUrl({ id: currentLookId }, item.image)}" style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #444;">`;
        }

        // Fallback
        if (!imgHtml) imgHtml = '<span style="font-size: 24px;">👕</span>';

        return `
        <div class="look-item">
            <div class="look-item-image" style="width: auto; height: auto; min-width: 60px; min-height: 60px; background: transparent; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; justify-content: flex-start; overflow: visible;">
                ${imgHtml}
            </div>
            <div class="look-item-content">
                <div class="look-item-header">
                    <span class="look-item-type">${item.type}</span>
                    <span class="btn-remove-item" onclick="removeItem(${idx})">×</span>
                </div>
                <div class="look-item-desc">${item.description}</div>
            </div>
        </div>
    `}).join('');

    // Trigger collage update whenever items change
    // Debounce this? For now direct call.
    updateCollage();
}

window.removeItem = (idx) => {
    currentItems.splice(idx, 1);
    renderItems();
};

function setupEventListeners() {
    // Add Item Modal
    const modal = document.getElementById('item-modal');
    const btnAdd = document.getElementById('btn-add-item');
    const btnCancel = document.getElementById('btn-cancel-item');
    const btnConfirm = document.getElementById('btn-confirm-item');

    // Item Upload Inputs
    const itemImgZone = document.getElementById('item-image-zone');
    const itemImgInput = document.getElementById('item-image-input');

    // Open Modal
    btnAdd.onclick = () => {
        document.getElementById('item-desc-input').value = '';
        document.getElementById('item-type-select').value = 'top';
        resetItemImage(true);
        modal.style.display = 'flex';
        document.getElementById('item-desc-input').focus();
    };

    // Close Modal
    btnConfirm.onclick = () => {
        const type = document.getElementById('item-type-select').value;
        const desc = document.getElementById('item-desc-input').value;

        if (desc) {
            const newItem = {
                id: Date.now().toString(),
                type,
                description: desc,
                imagesBase64: [] // New array structure
            };

            if (tempItemImages && tempItemImages.length > 0) {
                newItem.imagesBase64 = [...tempItemImages]; // Copy array
            }

            currentItems.push(newItem);
            renderItems();
            modal.style.display = 'none';
        } else {
            alert('Введите описание предмета');
        }
    };

    btnCancel.onclick = () => {
        modal.style.display = 'none';
    };

    // Item Image Logic
    itemImgZone.onclick = (e) => {
        itemImgInput.click();
    };

    itemImgInput.onchange = async (e) => {
        if (e.target.files.length) {
            await handleItemFiles(e.target.files);
        }
        itemImgInput.value = ''; // Reset to allow re-selection
    };

    // Paste in Modal
    modal.addEventListener('paste', async (e) => {
        if (modal.style.display === 'none') return;
        const items = e.clipboardData?.items;
        if (!items) return;

        const files = [];
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                files.push(item.getAsFile());
            }
        }
        if (files.length > 0) {
            await handleItemFiles(files);
        }
    });

    // Form Submit
    document.getElementById('look-form').onsubmit = async (e) => {
        e.preventDefault();

        // Ensure we send currentCollageBase64 if updated
        const data = {
            label: document.getElementById('look-label').value,
            category: document.getElementById('look-category').value,
            items: currentItems,
            prompt: {
                tech: { description: document.getElementById('look-prompt-tech').value }
            },
            coverImageBase64: currentCollageBase64 // The generated collage
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
                    fillForm(json.data);
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
    currentCollageBase64 = null;
    document.getElementById('look-label').value = '';
    document.getElementById('look-prompt-tech').value = '';
    currentItems = [];
    renderItems();
    clearCollagePreview();
    document.getElementById('btn-delete').style.display = 'none';
    loadGallery();
}

// ═══════════════════════════════════════════════════════════════
// COLLAGE LOGIC
// ═══════════════════════════════════════════════════════════════

function setCollagePreview(src) {
    const img = document.getElementById('collage-preview-img');
    const ph = document.getElementById('collage-placeholder');

    img.src = src;
    img.style.display = 'block';
    ph.style.display = 'none';
}

function clearCollagePreview() {
    const img = document.getElementById('collage-preview-img');
    const ph = document.getElementById('collage-placeholder');

    img.src = '';
    img.style.display = 'none';
    ph.style.display = 'block';
}

async function updateCollage() {
    const imagesWithBase64 = [];

    // Gather all item images
    // Note: We need to load them to Canvas, so valid src is needed (dataURL or http)
    // If it's a saved item, we need the URL.

    for (const item of currentItems) {
        const sources = [];

        // New base64s
        if (item.imagesBase64) {
            item.imagesBase64.forEach(b64 => sources.push(`data:image/jpeg;base64,${b64}`));
        } else if (item.imageBase64) {
            sources.push(`data:image/jpeg;base64,${item.imageBase64}`);
        }

        // Saved images
        if (item.images && currentLookId) {
            item.images.forEach(f => sources.push(getLookImageUrl({ id: currentLookId }, f)));
        } else if (item.image && currentLookId) {
            sources.push(getLookImageUrl({ id: currentLookId }, item.image));
        }

        // Add all unique sources
        // Using Set to avoid duplication if image and images[0] overlap
        const unique = [...new Set(sources)];
        unique.forEach(src => {
            if (src) imagesWithBase64.push({ src, item });
        });
    }

    if (imagesWithBase64.length === 0) {
        clearCollagePreview();
        currentCollageBase64 = null;
        return;
    }

    try {
        const collageBase64 = await generateCollage(imagesWithBase64);
        currentCollageBase64 = collageBase64;
        setCollagePreview(`data:image/jpeg;base64,${collageBase64}`);
    } catch (e) {
        console.error('Collage generation failed:', e);
    }
}

async function generateCollage(imgObjs) {
    // Determine Grid
    const count = imgObjs.length;
    let cols = 1;
    let rows = 1;

    if (count === 2) { cols = 2; rows = 1; }
    else if (count === 3) { cols = 3; rows = 1; } // Or 2 col, 2 row (one span)
    else if (count === 4) { cols = 2; rows = 2; }
    else if (count > 4) { cols = 3; rows = Math.ceil(count / 3); }

    // Canvas dimensions (HD)
    const cw = 1200;
    const ch = 1600; // 3:4 aspect

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');

    // White bg
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cw, ch);

    // Draw cells
    const cellW = cw / cols;
    const cellH = ch / rows;

    // Load all images first
    const loadedImgs = await Promise.all(imgObjs.map(obj => new Promise((resolve) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => resolve(null);
        i.src = obj.src;
        i.crossOrigin = 'Anonymous';
    })));

    loadedImgs.forEach((img, idx) => {
        if (!img) return;

        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = col * cellW;
        const y = row * cellH;

        // Fit image in cell (contain)
        // Draw image keeping ratio centered in cell
        const ratio = Math.min(cellW / img.width, cellH / img.height);
        const dw = img.width * ratio;
        const dh = img.height * ratio;

        const dx = x + (cellW - dw) / 2;
        const dy = y + (cellH - dh) / 2;

        ctx.drawImage(img, dx, dy, dw, dh);
    });

    return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
}

// ═══════════════════════════════════════════════════════════════
// MODAL IMAGE UTILS
// ═══════════════════════════════════════════════════════════════

function resetItemImage(clearGlobal = false) {
    if (clearGlobal) tempItemImages = [];
    renderThumbnailList();
    document.getElementById('item-image-input').value = '';
}

function renderThumbnailList() {
    const list = document.getElementById('item-images-list');
    list.innerHTML = tempItemImages.map((b64, idx) => `
        <div style="position: relative; width: 60px; height: 80px; border: 1px solid #444; border-radius: 4px; overflow: hidden;">
            <img src="data:image/jpeg;base64,${b64}" style="width: 100%; height: 100%; object-fit: cover;">
            <div onclick="removeTempImage(${idx})" style="position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.6); color: white; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer;">×</div>
        </div>
    `).join('');
}

window.removeTempImage = (idx) => {
    tempItemImages.splice(idx, 1);
    renderThumbnailList();
};

async function handleItemFiles(files) {
    if (!files || !files.length) return;

    // Process all files
    for (let i = 0; i < files.length; i++) {
        try {
            const compressed = await compressImage(files[i]);
            tempItemImages.push(compressed);
        } catch (e) {
            console.error('Failed to process image', files[i].name, e);
        }
    }
    renderThumbnailList();
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

            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl.split(',')[1]);
        };
        img.onerror = () => reject(new Error('Image load failed'));

        reader.readAsDataURL(file);
    });
}
