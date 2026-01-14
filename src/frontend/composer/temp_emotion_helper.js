/**
 * Render emotion options into the dropdown
 * Uses state.emotions
 */
function renderEmotionOptions() {
    const select = document.getElementById('gen-emotion');
    if (!select) return;

    // Store current value to restore it
    const currentValue = select.value;

    select.innerHTML = '<option value="">Нейтральная (без эмоции)</option>';

    if (!state.emotions || state.emotions.length === 0) return;

    // Group emotions by category
    const emotionsByCategory = {};
    state.emotions.forEach(e => {
        const cat = e.category || 'other';
        if (!emotionsByCategory[cat]) {
            emotionsByCategory[cat] = [];
        }
        emotionsByCategory[cat].push(e);
    });

    // Render groups
    Object.keys(emotionsByCategory).forEach(catId => {
        // Find category label
        let catLabel = catId;
        if (state.emotionCategories) {
            const catObj = state.emotionCategories.find(c => (typeof c === 'object' ? c.id === catId : c === catId));
            if (catObj) catLabel = typeof catObj === 'object' ? catObj.label : catObj;
        }

        const optgroup = document.createElement('optgroup');
        optgroup.label = catLabel;

        emotionsByCategory[catId].forEach(e => {
            const option = document.createElement('option');
            option.value = e.id;
            option.textContent = e.label;
            option.title = e.shortDescription || '';
            optgroup.appendChild(option);
        });

        select.appendChild(optgroup);
    });

    // Restore value if possible
    if (currentValue) {
        select.value = currentValue;
    }

    // Update global elements ref
    elements.genEmotion = select;

    // Add change listener
    select.addEventListener('change', () => {
        saveGenerationSettings();
    });
}
