/**
 * Look Editor Logic
 */

let currentItems = [];
let currentLookId = null;

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

        gallery.innerHTML = json.data.map(look => `
            <div class="look-card ${currentLookId === look.id ? 'selected' : ''}" onclick="selectLook('${look.id}')">
                <div class="look-card-preview" style="background: ${getColorHash(look.id)}">
                    <!-- Placeholder for cover image if we had one -->
                    <div style="position: absolute; bottom: 8px; left: 8px; font-size: 24px;">👔</div>
                </div>
                <div class="look-card-info">
                    <div class="look-card-title">${look.label}</div>
                    <div class="look-card-meta">${look.items.length} items • ${look.category}</div>
                </div>
            </div>
        `).join('');
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
            }
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
                // Determine if we should clear form (on create) or stay (on update)
                if (method === 'POST') {
                    clearForm();
                } else {
                    currentLookId = json.data.id; // ensure ID is set
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
    document.getElementById('look-label').value = '';
    document.getElementById('look-prompt-tech').value = '';
    currentItems = [];
    renderItems();
    document.getElementById('btn-delete').style.display = 'none';
    loadGallery(); // to clear selection
}
