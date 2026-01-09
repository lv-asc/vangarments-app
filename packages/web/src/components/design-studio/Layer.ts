// Layer types for Photoshop-style layer system
export type LayerType = 'drawing' | 'image' | 'text' | 'shape' | 'sticky' | 'group';

export interface Layer {
    id: string;
    name: string;
    type: LayerType;
    visible: boolean;
    locked: boolean;
    objectIds: string[]; // IDs of fabric.js objects in this layer
    order: number; // Rendering order (lower = below)
}

export interface LayerState {
    layers: Layer[];
    activeLayerId: string;
}

// Helper to generate unique layer ID
export const generateLayerId = (): string =>
    `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Create a new layer with defaults
export const createLayer = (
    name: string,
    type: LayerType,
    order: number
): Layer => ({
    id: generateLayerId(),
    name,
    type,
    visible: true,
    locked: false,
    objectIds: [],
    order
});

// Default layers for new canvas
export const createDefaultLayers = (): LayerState => ({
    layers: [
        createLayer('Layer 1', 'drawing', 0)
    ],
    activeLayerId: '' // Will be set to first layer's ID
});
