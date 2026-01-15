/**
 * Look Schema
 * 
 * Defines the structure of a "Look" (Outfit/Style).
 */

export const LOOK_CATEGORIES = [
    { value: 'casual', label: 'Casual' },
    { value: 'editorial', label: 'Editorial' },
    { value: 'street', label: 'Streetwear' },
    { value: 'formal', label: 'Formal' },
    { value: 'avant_garde', label: 'Avant-Garde' },
    { value: 'vintage', label: 'Vintage' }
];

export const EMPTY_LOOK = {
    id: '',
    label: 'New Look',
    category: 'casual',
    description: '',
    items: [], // Array of { id, image, description, type }
    prompt: { // Optional prompt overrides
        tech: {},
        art: {}
    },
    coverImage: null, // Optional representative image
    tags: [],
    createdAt: null,
    updatedAt: null
};

export function createEmptyLook(label = 'New Look', category = 'casual') {
    return {
        ...EMPTY_LOOK,
        id: `look_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label,
        category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

export function validateLook(look) {
    const errors = [];

    if (!look.id) errors.push('ID is required');
    if (!look.label) errors.push('Label is required');
    if (!look.category) errors.push('Category is required');

    // Basic structural check
    if (!Array.isArray(look.items)) errors.push('Items must be an array');

    return {
        valid: errors.length === 0,
        errors
    };
}
