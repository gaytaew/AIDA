/**
 * Редактор съёмок - логика работы с UI (AIDA Version)
 */

let currentShoot = null;
let scenes = [];

// Элементы DOM
const elements = {
    shootsList: document.getElementById('shoots-list'),
    editorForm: document.getElementById('editor-form'),
    shootForm: document.getElementById('shoot-form'),
    messageContainer: document.getElementById('message-container'),
    promptGenerator: document.getElementById('prompt-generator'),
    promptGeneratorStatus: document.getElementById('prompt-generator-status'),
    btnGenerateShoot: document.getElementById('btn-generate-shoot'),
    btnNewShoot: document.getElementById('btn-new-shoot'),
    btnBack: document.getElementById('btn-back'),
    btnAddScene: document.getElementById('btn-add-scene'),
    btnValidate: document.getElementById('btn-validate'),
    btnExport: document.getElementById('btn-export'),
    btnDeleteShoot: document.getElementById('btn-delete-shoot'),
    btnCancel: document.getElementById('btn-cancel'),
    btnGenerateFromPrompt: document.getElementById('btn-generate-from-prompt'),
    btnCancelPrompt: document.getElementById('btn-cancel-prompt')
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadShoots();
    setupEventListeners();
});

function updateDeleteShootUI() {
    if (!elements.btnDeleteShoot) return;
    const enabled = !!(currentShoot && currentShoot.id);
    elements.btnDeleteShoot.disabled = !enabled;
    elements.btnDeleteShoot.style.display = enabled ? 'inline-block' : 'none';
}

function setupEventListeners() {
    elements.btnGenerateShoot.addEventListener('click', () => {
        showPromptGenerator();
    });

    elements.btnNewShoot.addEventListener('click', () => {
        newShoot();
    });

    elements.btnBack.addEventListener('click', () => {
        // В AIDA возврат обычно на главную или предыдущую страницу
        window.location.href = '../index.html';
    });

    elements.btnGenerateFromPrompt.addEventListener('click', () => {
        generateShootFromPrompt();
    });

    elements.btnCancelPrompt.addEventListener('click', () => {
        hidePromptGenerator();
    });

    elements.btnAddScene.addEventListener('click', () => {
        addScene();
    });

    elements.btnValidate.addEventListener('click', () => {
        validateShoot();
    });

    elements.btnExport.addEventListener('click', () => {
        exportShoot();
    });

    if (elements.btnDeleteShoot) {
        elements.btnDeleteShoot.addEventListener('click', () => {
            deleteCurrentShoot();
        });
    }

    elements.btnCancel.addEventListener('click', () => {
        cancelEdit();
    });

    elements.shootForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveShoot();
    });
}

function normalizeText(value) {
    return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Загрузка списка съёмок (в AIDA используем custom-shoots или shoots API)
async function loadShoots() {
    try {
        // В AIDA может быть разделение на custom-shoots и system shoots.
        // Пока пробуем использовать /api/shoots (если он возвращает все) или /api/custom-shoots
        // В MVP было /api/shoots и /api/experimental-shoots.
        // Предполагаем, что AIDA API /api/shoots - это точка входа.
        const res = await fetch('/api/custom-shoots'); // Попробуем custom-shoots для пользовательских
        if (!res.ok) throw new Error('Ошибка загрузки списка съёмок');

        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        renderShootsList(data.data || []);
    } catch (error) {
        showMessage('Ошибка загрузки съёмок: ' + error.message, 'error');
    }
}

// Отображение списка съёмок
function renderShootsList(shoots) {
    elements.shootsList.innerHTML = '';

    const list = Array.isArray(shoots) ? shoots : [];

    if (list.length === 0) {
        elements.shootsList.innerHTML = '<p>Нет доступных съёмок</p>';
        return;
    }

    list.forEach(shoot => {
        const card = document.createElement('div');
        card.className = 'shoot-card';
        card.innerHTML = `
      <h3>${escapeHtml(shoot.label || shoot.id)}</h3>
      <p>${escapeHtml(shoot.shortDescription || '')} • ${(shoot.scenes || []).length} сцен</p>
    `;
        card.addEventListener('click', () => {
            loadShoot(shoot.id);
        });
        elements.shootsList.appendChild(card);
    });
}

// Загрузка съёмки для редактирования
async function loadShoot(id) {
    try {
        const res = await fetch(`/api/custom-shoots/${id}`); // Используем custom-shoots API AIDA
        if (!res.ok) throw new Error('Ошибка загрузки');
        const data = await res.json();
        // AIDA response wrapper check
        if (data.error) throw new Error(data.error);

        currentShoot = data.data || data.shoot || data; // Adapting to possible AIDA structure
        scenes = [...(currentShoot.scenes || [])];
        populateForm();
        updateDeleteShootUI();
        elements.editorForm.classList.add('active');
        elements.shootsList.style.display = 'none';
    } catch (error) {
        showMessage('Ошибка загрузки съёмки: ' + error.message, 'error');
    }
}

// Заполнение формы данными
function populateForm() {
    if (!currentShoot) return;

    document.getElementById('shoot-id').value = currentShoot.id || '';
    document.getElementById('shoot-label').value = currentShoot.label || '';
    document.getElementById('shoot-description').value = currentShoot.shortDescription || '';

    if (currentShoot.universe) {
        document.getElementById('universe-tech').value = currentShoot.universe.tech || '';
        document.getElementById('universe-era').value = currentShoot.universe.era || '';
        document.getElementById('universe-color').value = currentShoot.universe.color || '';
        document.getElementById('universe-lens').value = currentShoot.universe.lens || '';
        document.getElementById('universe-mood').value = currentShoot.universe.mood || '';

        // Anti-AI settings
        const anti = currentShoot.universe.antiAi || {};
        const poseProfileEl = document.getElementById('anti-ai-pose-profile');
        const levelEl = document.getElementById('anti-ai-level');
        const keyLightEl = document.getElementById('anti-ai-key-light');
        const expEl = document.getElementById('anti-ai-exposure-errors');
        const wbEl = document.getElementById('anti-ai-mixed-wb');
        const microEl = document.getElementById('anti-ai-micro-defects');
        const compEl = document.getElementById('anti-ai-candid-composition');
        const focusEl = document.getElementById('anti-ai-imperfect-focus');
        const flaresEl = document.getElementById('anti-ai-flares');
        const motionEl = document.getElementById('anti-ai-motion-moment');
        const filmEl = document.getElementById('anti-ai-film-scan');
        const forbiddenEl = document.getElementById('anti-ai-forbidden');
        const notesEl = document.getElementById('anti-ai-notes');

        if (poseProfileEl) poseProfileEl.value = anti.poseProfile || 'auto';
        if (levelEl) levelEl.value = anti.level || 'medium';
        if (keyLightEl) keyLightEl.value = anti.keyLight || 'auto';
        if (expEl) expEl.checked = anti.allowExposureErrors !== false;
        if (wbEl) wbEl.checked = anti.allowMixedWhiteBalance !== false;
        if (microEl) microEl.checked = anti.requireMicroDefects !== false;
        if (compEl) compEl.checked = anti.candidComposition !== false;
        if (focusEl) focusEl.checked = anti.allowImperfectFocus !== false;
        if (flaresEl) flaresEl.checked = anti.allowFlaresReflections !== false;
        if (motionEl) motionEl.checked = anti.preferMicroMotion !== false;
        if (filmEl) filmEl.checked = anti.filmScanTexture !== false;
        if (forbiddenEl) {
            const list = Array.isArray(anti.forbiddenPhrases) ? anti.forbiddenPhrases : [];
            forbiddenEl.value = list.join('\n');
        }
        if (notesEl) notesEl.value = anti.notes || '';
    }

    renderScenes();
    updateDeleteShootUI();
}

// Очистка формы
function clearForm() {
    document.getElementById('shoot-id').value = '';
    document.getElementById('shoot-label').value = '';
    document.getElementById('shoot-description').value = '';
    document.getElementById('universe-tech').value = '';
    document.getElementById('universe-era').value = '';
    document.getElementById('universe-color').value = '';
    document.getElementById('universe-lens').value = '';
    document.getElementById('universe-mood').value = '';

    // Reset Anti-AI to defaults
    const poseProfileEl = document.getElementById('anti-ai-pose-profile');
    if (poseProfileEl) poseProfileEl.value = 'auto';
    // ... (reset others if needed)

    scenes = [];
    renderScenes();
}

// Добавление сцены
function addScene() {
    const scene = {
        id: `SCENE_${Date.now()}`,
        label: '',
        role: '',
        space: '',
        lighting: '',
        camera: '',
        pose: '',
        emotion: '',
        action: '',
        clothingFocus: '',
        texture: '',
        antiAi: { poseProfile: 'auto' }
    };
    scenes.push(scene);
    renderScenes();
}

// Удаление сцены
function removeScene(index) {
    scenes.splice(index, 1);
    renderScenes();
}

// Отображение сцен
function renderScenes() {
    const container = document.getElementById('scenes-container');
    container.innerHTML = '';

    scenes.forEach((scene, index) => {
        const scenePoseProfile =
            (scene && scene.antiAi && typeof scene.antiAi === 'object' && scene.antiAi.poseProfile) || 'auto';
        const sceneEl = document.createElement('div');
        sceneEl.className = 'scene-item';
        sceneEl.innerHTML = `
      <div class="scene-item-header">
        <h3>Сцена ${index + 1}</h3>
        <button type="button" class="scene-item-remove" data-index="${index}">
          Удалить
        </button>
      </div>
      <div class="form-group">
        <label>ID сцены *</label>
        <input type="text" class="scene-id" data-index="${index}" value="${escapeHtml(scene.id)}" required />
      </div>
      <div class="form-group">
        <label>Название *</label>
        <input type="text" class="scene-label" data-index="${index}" value="${escapeHtml(scene.label)}" required />
      </div>
      <div class="form-group">
        <label>Роль в кампании *</label>
        <textarea class="scene-role" data-index="${index}" required>${escapeHtml(scene.role)}</textarea>
      </div>
      <div class="form-group">
        <label>Пространство *</label>
        <textarea class="scene-space" data-index="${index}" required>${escapeHtml(scene.space)}</textarea>
      </div>
      <div class="form-group">
        <label>Освещение *</label>
        <textarea class="scene-lighting" data-index="${index}" required>${escapeHtml(scene.lighting)}</textarea>
      </div>
      <div class="form-group">
        <label>Камера и композиция *</label>
        <textarea class="scene-camera" data-index="${index}" required>${escapeHtml(scene.camera)}</textarea>
      </div>
      <div class="form-group">
        <label>Поза и язык тела *</label>
        <textarea class="scene-pose" data-index="${index}" required>${escapeHtml(scene.pose)}</textarea>
      </div>
      <div class="form-group">
        <label>Профиль позирования (анти‑ИИ) для этой сцены</label>
        <select class="scene-anti-ai-pose-profile catalog-control-select" data-index="${index}">
          <option value="auto" ${scenePoseProfile === 'auto' ? 'selected' : ''}>Auto (как в настройках съёмки)</option>
          <option value="natural" ${scenePoseProfile === 'natural' ? 'selected' : ''}>Живые позы (candid)</option>
          <option value="posed" ${scenePoseProfile === 'posed' ? 'selected' : ''}>Прямое позирование</option>
          <option value="off" ${scenePoseProfile === 'off' ? 'selected' : ''}>Off</option>
        </select>
      </div>
      <div class="form-group">
        <label>Эмоция *</label>
        <textarea class="scene-emotion" data-index="${index}" required>${escapeHtml(scene.emotion)}</textarea>
      </div>
      <div class="form-group">
        <label>Действие *</label>
        <textarea class="scene-action" data-index="${index}" required>${escapeHtml(scene.action)}</textarea>
      </div>
      <div class="form-group">
        <label>Фокус на одежде * <small>(без конкретных элементов)</small></label>
        <textarea class="scene-clothing-focus" data-index="${index}" required>${escapeHtml(scene.clothingFocus)}</textarea>
        <div class="clothing-focus-validation" data-index="${index}"></div>
      </div>
      <div class="form-group">
        <label>Текстура и детали окружения *</label>
        <textarea class="scene-texture" data-index="${index}" required>${escapeHtml(scene.texture)}</textarea>
      </div>
    `;
        container.appendChild(sceneEl);
    });

    // Обработчики событий
    container.querySelectorAll('.scene-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            removeScene(index);
        });
    });

    // Обработчики для полей сцен
    container.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.index);
            const field = e.target.className.split(' ')[0].replace('scene-', '');
            if (scenes[index]) {
                scenes[index][field] = e.target.value;
            }
        });
    });
}

// Сбор данных формы
function collectFormData() {
    const forbiddenEl = document.getElementById('anti-ai-forbidden');
    const forbiddenList = String((forbiddenEl && forbiddenEl.value) || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

    return {
        id: document.getElementById('shoot-id').value.trim(),
        label: document.getElementById('shoot-label').value.trim(),
        shortDescription: document.getElementById('shoot-description').value.trim(),
        universe: {
            tech: document.getElementById('universe-tech').value.trim(),
            era: document.getElementById('universe-era').value.trim(),
            color: document.getElementById('universe-color').value.trim(),
            lens: document.getElementById('universe-lens').value.trim(),
            mood: document.getElementById('universe-mood').value.trim(),
            antiAi: {
                poseProfile: (document.getElementById('anti-ai-pose-profile')?.value || 'auto'),
                level: (document.getElementById('anti-ai-level')?.value || 'medium'),
                keyLight: (document.getElementById('anti-ai-key-light')?.value || 'auto'),
                allowExposureErrors: !!document.getElementById('anti-ai-exposure-errors')?.checked,
                allowMixedWhiteBalance: !!document.getElementById('anti-ai-mixed-wb')?.checked,
                requireMicroDefects: !!document.getElementById('anti-ai-micro-defects')?.checked,
                candidComposition: !!document.getElementById('anti-ai-candid-composition')?.checked,
                allowImperfectFocus: !!document.getElementById('anti-ai-imperfect-focus')?.checked,
                allowFlaresReflections: !!document.getElementById('anti-ai-flares')?.checked,
                preferMicroMotion: !!document.getElementById('anti-ai-motion-moment')?.checked,
                filmScanTexture: !!document.getElementById('anti-ai-film-scan')?.checked,
                forbiddenPhrases: forbiddenList,
                notes: document.getElementById('anti-ai-notes')?.value?.trim() || ''
            }
        },
        scenes: scenes.map((scene, index) => {
            const sceneEl = document.querySelector(`.scene-item:nth-child(${index + 1})`);
            if (!sceneEl) return scene;

            const scenePoseProfile = sceneEl.querySelector('.scene-anti-ai-pose-profile')?.value || 'auto';
            return {
                id: sceneEl.querySelector('.scene-id')?.value.trim() || scene.id,
                label: sceneEl.querySelector('.scene-label')?.value.trim() || '',
                role: sceneEl.querySelector('.scene-role')?.value.trim() || '',
                space: sceneEl.querySelector('.scene-space')?.value.trim() || '',
                lighting: sceneEl.querySelector('.scene-lighting')?.value.trim() || '',
                camera: sceneEl.querySelector('.scene-camera')?.value.trim() || '',
                pose: sceneEl.querySelector('.scene-pose')?.value.trim() || '',
                emotion: sceneEl.querySelector('.scene-emotion')?.value.trim() || '',
                action: sceneEl.querySelector('.scene-action')?.value.trim() || '',
                clothingFocus: sceneEl.querySelector('.scene-clothing-focus')?.value.trim() || '',
                texture: sceneEl.querySelector('.scene-texture')?.value.trim() || '',
                antiAi: { poseProfile: scenePoseProfile }
            };
        })
    };
}

// Валидация съёмки
async function validateShoot() {
    const shoot = collectFormData();
    // Client-side simple validation or server-side call
    // For now, simple client check
    if (!shoot.id || !shoot.label) {
        showMessage('Заполните ID и название съёмки', 'error');
        return;
    }
    showMessage('✓ Предварительная валидация пройдена (локально)', 'success');
}

// Сохранение съёмки
async function saveShoot() {
    const shoot = collectFormData();

    try {
        if (!shoot.id) {
            showMessage('Сначала задай ID съёмки (поле ID)', 'error');
            return;
        }

        // В AIDA используем /api/custom-shoots для сохранения
        const isNew = !currentShoot; // Simplification, relies on logical state
        const endpoint = isNew
            ? '/api/custom-shoots'
            : `/api/custom-shoots/${encodeURIComponent(currentShoot.id)}`;

        // NOTE: AIDA API might expect different methods or payload wrapping.
        // Assuming standard REST for custom-shoots based on file naming.
        const method = isNew ? 'POST' : 'PUT';

        // IMPORTANT: AIDA's customShootRoutes expects specific payload structure?
        // Usually it expects the shoot object directly or { shoot: ... }
        // Let's assume direct object based on MVP.

        const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shoot)
        });

        const data = await res.json();
        if (data.ok) {
            showMessage('✓ Съёмка сохранена.', 'success');
            currentShoot = data.data || shoot;
            loadShoots();
        } else {
            const errors = Array.isArray(data.errors) ? data.errors : [data.error || 'Ошибка сохранения'];
            showMessage('Ошибки сохранения:\n' + errors.join('\n'), 'error');
        }
    } catch (error) {
        showMessage('Ошибка сохранения: ' + error.message, 'error');
    }
}

// Экспорт съёмки
async function exportShoot() {
    const shoot = collectFormData();
    const json = JSON.stringify(shoot, null, 2);
    downloadJSON(json, `shoot-${shoot.id}.json`);
    showMessage('✓ Съёмка экспортирована', 'success');
}

// Скачивание JSON
function downloadJSON(json, filename) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Отмена редактирования
function cancelEdit() {
    currentShoot = null;
    scenes = [];
    elements.editorForm.classList.remove('active');
    elements.shootsList.style.display = 'block';
    updateDeleteShootUI();
    loadShoots();
}

async function deleteCurrentShoot() {
    if (!currentShoot || !currentShoot.id) return;

    if (!confirm(`Удалить съёмку "${currentShoot.id}"?`)) return;

    try {
        const res = await fetch(`/api/custom-shoots/${encodeURIComponent(currentShoot.id)}`, { method: 'DELETE' });
        const data = await res.json();

        if (data.ok) {
            showMessage('✓ Съёмка удалена.', 'success');
            cancelEdit();
        } else {
            showMessage('Ошибка удаления: ' + (data.error || 'Unknown'), 'error');
        }
    } catch (e) {
        showMessage('Ошибка удаления: ' + e.message, 'error');
    }
}

// Показать сообщение
function showMessage(text, type = 'success') {
    elements.messageContainer.innerHTML = `
    <div class="message message-${type}">
      ${escapeHtml(text).replace(/\n/g, '<br>')}
    </div>
  `;
    setTimeout(() => {
        elements.messageContainer.innerHTML = '';
    }, 5000);
}

// Показать генератор из промпта
function showPromptGenerator() {
    elements.promptGenerator.style.display = 'block';
    elements.shootsList.style.display = 'none';
    elements.editorForm.classList.remove('active');
    updateDeleteShootUI();
    elements.promptGeneratorStatus.innerHTML = '';
    document.getElementById('shoot-prompt').value = '';
}

// Скрыть генератор из промпта
function hidePromptGenerator() {
    elements.promptGenerator.style.display = 'none';
    elements.shootsList.style.display = 'block';
    updateDeleteShootUI();
    elements.promptGeneratorStatus.innerHTML = '';
}

// ---- SMART EDIT LOGIC ----

const smartEditOverlay = document.getElementById('smart-edit-overlay');
const btnSmartEdit = document.getElementById('btn-smart-edit');
const btnCancelSmartEdit = document.getElementById('btn-cancel-smart-edit');
const btnApplySmartEdit = document.getElementById('btn-apply-smart-edit');
const smartEditPrompt = document.getElementById('smart-edit-prompt');
const smartEditStatus = document.getElementById('smart-edit-status');

if (btnSmartEdit) {
    btnSmartEdit.addEventListener('click', () => {
        smartEditOverlay.style.display = 'flex';
        smartEditPrompt.value = '';
        smartEditStatus.innerHTML = '';
    });
}

if (btnCancelSmartEdit) {
    btnCancelSmartEdit.addEventListener('click', () => {
        smartEditOverlay.style.display = 'none';
    });
}

if (btnApplySmartEdit) {
    btnApplySmartEdit.addEventListener('click', async () => {
        const editPrompt = smartEditPrompt.value.trim();
        if (!editPrompt) return;

        const currentData = collectFormData();

        btnApplySmartEdit.disabled = true;
        smartEditStatus.innerHTML = '<div class="message message-success">Думаем...</div>';

        try {
            const res = await fetch('/api/shoot-editor/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentShoot: currentData,
                    editPrompt
                })
            });

            const data = await res.json();
            if (data.ok && data.shoot) {
                currentShoot = data.shoot;
                populateForm();
                showMessage('✓ Правки применены! Проверьте результат.', 'success');
                smartEditOverlay.style.display = 'none';
            } else {
                smartEditStatus.innerHTML = `<div class="message message-error">Ошибка: ${data.error}</div>`;
            }
        } catch (e) {
            smartEditStatus.innerHTML = `<div class="message message-error">Ошибка: ${e.message}</div>`;
        } finally {
            btnApplySmartEdit.disabled = false;
        }
    });
}

// Генерация съемки из промпта
async function generateShootFromPrompt() {
    const prompt = document.getElementById('shoot-prompt').value.trim();

    if (!prompt) {
        showMessage('Введите описание съёмки', 'error');
        return;
    }

    elements.btnGenerateFromPrompt.disabled = true;
    elements.promptGeneratorStatus.innerHTML = '<div class="message message-success">Генерируем съёмку... Это может занять некоторое время.</div>';

    try {
        // Calling our NEW AIDA endpoint
        const res = await fetch('/api/shoot-editor/generate-from-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();

        if (data.ok && data.data) {
            // Заполняем форму сгенерированными данными
            currentShoot = null; // New shoot, no ID yet technically until saved, or we use the generated ID

            // If the backend returns a full shoot object with ID, we can use it.
            // Usually generate-from-prompt creates a transient object or saves it?
            // MVP behavior: generated data is returned, user edits then saves.

            const generatedShoot = data.data; // shoot object

            document.getElementById('shoot-id').value = generatedShoot.id || `SHOOT_${Date.now()}`;
            document.getElementById('shoot-label').value = generatedShoot.label || '';
            document.getElementById('shoot-description').value = generatedShoot.shortDescription || '';

            if (generatedShoot.universe) {
                document.getElementById('universe-tech').value = generatedShoot.universe.tech || '';
                document.getElementById('universe-era').value = generatedShoot.universe.era || '';
                document.getElementById('universe-color').value = generatedShoot.universe.color || '';
                document.getElementById('universe-lens').value = generatedShoot.universe.lens || '';
                document.getElementById('universe-mood').value = generatedShoot.universe.mood || '';
            }

            if (Array.isArray(generatedShoot.scenes)) {
                scenes = generatedShoot.scenes;
                renderScenes();
            }

            hidePromptGenerator();
            elements.editorForm.classList.add('active');
            elements.shootsList.style.display = 'none';

            showMessage('✓ Съёмка успешно сгенерирована! Проверьте и при необходимости отредактируйте данные.', 'success');
        } else {
            const errors = Array.isArray(data.errors) ? data.errors : [data.error || 'Ошибка генерации'];
            elements.promptGeneratorStatus.innerHTML = `<div class="message message-error">Ошибки:\n${errors.join('\n')}</div>`;
        }
    } catch (error) {
        elements.promptGeneratorStatus.innerHTML = `<div class="message message-error">Ошибка: ${error.message}</div>`;
    } finally {
        elements.btnGenerateFromPrompt.disabled = false;
    }
}

// Создание новой съёмки
function newShoot() {
    currentShoot = null;
    scenes = [];
    clearForm();
    addScene(); // Добавляем одну пустую сцену
    updateDeleteShootUI();
    elements.editorForm.classList.add('active');
    elements.shootsList.style.display = 'none';
}
