'use client';

import React, { useState } from 'react';
import {
    EyeIcon,
    EyeSlashIcon,
    LockClosedIcon,
    LockOpenIcon,
    TrashIcon,
    PhotoIcon,
    PaintBrushIcon,
    PlusIcon,
    PencilSquareIcon,
    CheckIcon,
    XMarkIcon,
    DocumentIcon,
    Square2StackIcon
} from '@heroicons/react/24/outline';
import type { InfiniteCanvasRef } from './InfiniteCanvas';
import type { Layer, LayerType } from './Layer';

// Theme colors
const navyPrimary = '#0D1B2A';
const navySecondary = '#1B263B';
const creamPrimary = '#F5F1E8';
const creamSecondary = '#E8E0D0';

interface LayerPanelProps {
    layers: Layer[];
    activeLayerId?: string;
    canvasRef: React.RefObject<InfiniteCanvasRef>;
    onSelectLayer: (id: string) => void;
    onLayersChange?: () => void;
}

export default function LayerPanel({
    layers,
    activeLayerId,
    canvasRef,
    onSelectLayer,
    onLayersChange
}: LayerPanelProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const getLayerIcon = (type: LayerType) => {
        switch (type) {
            case 'drawing':
                return PaintBrushIcon;
            case 'image':
                return PhotoIcon;
            case 'text':
                return DocumentIcon;
            case 'shape':
                return Square2StackIcon;
            case 'group':
                return Square2StackIcon;
            default:
                return PaintBrushIcon;
        }
    };

    const handleToggleVisibility = (id: string) => {
        canvasRef.current?.toggleLayerVisibility(id);
        onLayersChange?.();
    };

    const handleToggleLock = (id: string) => {
        canvasRef.current?.toggleLayerLock(id);
        onLayersChange?.();
    };

    const handleSelectLayer = (id: string) => {
        canvasRef.current?.setActiveLayer(id);
        onSelectLayer(id);
    };

    const handleDeleteLayer = (id: string) => {
        canvasRef.current?.deleteLayer(id);
        onLayersChange?.();
    };

    const handleAddLayer = () => {
        canvasRef.current?.addLayer();
        onLayersChange?.();
    };

    const startRename = (id: string, currentName: string) => {
        setEditingId(id);
        setEditName(currentName);
    };

    const confirmRename = (id: string) => {
        if (!editName.trim()) {
            setEditingId(null);
            return;
        }
        canvasRef.current?.renameLayer(id, editName.trim());
        onLayersChange?.();
        setEditingId(null);
        setEditName('');
    };

    const cancelRename = () => {
        setEditingId(null);
        setEditName('');
    };

    // Sort layers by order (descending - top layers first in UI)
    const sortedLayers = [...layers].sort((a, b) => b.order - a.order);

    return (
        <div
            className="w-64 rounded-xl shadow-lg overflow-hidden"
            style={{ backgroundColor: navySecondary }}
        >
            {/* Header with Add Button */}
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#3D4A5D' }}>
                <div>
                    <h3 className="font-medium" style={{ color: creamPrimary }}>Layers</h3>
                    <p className="text-xs mt-0.5" style={{ color: creamSecondary }}>
                        {layers.length} layer{layers.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={handleAddLayer}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10"
                    style={{ color: creamPrimary }}
                    title="Add new layer"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Layer List */}
            <div className="max-h-80 overflow-y-auto">
                {sortedLayers.length === 0 ? (
                    <div className="p-4 text-center">
                        <p className="text-sm" style={{ color: creamSecondary }}>
                            No layers yet
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                            Click + to add a layer
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y" style={{ borderColor: '#3D4A5D' }}>
                        {sortedLayers.map((layer) => {
                            const IconComponent = getLayerIcon(layer.type);
                            const isSelected = layer.id === activeLayerId;
                            const isEditing = editingId === layer.id;

                            return (
                                <li
                                    key={layer.id}
                                    className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-opacity-50"
                                    style={{
                                        backgroundColor: isSelected ? `${navyPrimary}` : 'transparent',
                                        opacity: layer.visible ? 1 : 0.5
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (!isEditing && !layer.locked) handleSelectLayer(layer.id);
                                    }}
                                >
                                    {/* Layer Type Icon */}
                                    <IconComponent
                                        className="w-4 h-4 flex-shrink-0"
                                        style={{ color: layer.type === 'image' ? '#60A5FA' : creamSecondary }}
                                    />

                                    {/* Layer Name (editable) */}
                                    {isEditing ? (
                                        <div className="flex-1 flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') confirmRename(layer.id);
                                                    if (e.key === 'Escape') cancelRename();
                                                }}
                                                autoFocus
                                                className="flex-1 px-1 py-0.5 text-sm rounded bg-transparent border outline-none"
                                                style={{ borderColor: creamPrimary, color: creamPrimary }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); confirmRename(layer.id); }}
                                                className="p-0.5 rounded hover:opacity-80"
                                                style={{ color: '#22C55E' }}
                                            >
                                                <CheckIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); cancelRename(); }}
                                                className="p-0.5 rounded hover:opacity-80"
                                                style={{ color: '#EF4444' }}
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1 min-w-0">
                                                <span
                                                    className="text-sm truncate block"
                                                    style={{ color: creamPrimary }}
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        startRename(layer.id, layer.name);
                                                    }}
                                                    title={`${layer.name} (${layer.objectIds.length} objects)`}
                                                >
                                                    {layer.name}
                                                </span>
                                                <span className="text-xs" style={{ color: '#6B7280' }}>
                                                    {layer.objectIds.length} obj
                                                </span>
                                            </div>

                                            {/* Layer Actions */}
                                            <div className="flex items-center gap-0.5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); startRename(layer.id, layer.name); }}
                                                    className="p-1 rounded hover:bg-white hover:bg-opacity-10 transition-all"
                                                    style={{ color: creamSecondary }}
                                                    title="Rename"
                                                >
                                                    <PencilSquareIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleToggleVisibility(layer.id); }}
                                                    className="p-1 rounded hover:bg-white hover:bg-opacity-10 transition-all"
                                                    style={{ color: layer.visible ? creamSecondary : '#6B7280' }}
                                                    title={layer.visible ? 'Hide' : 'Show'}
                                                >
                                                    {layer.visible ? (
                                                        <EyeIcon className="w-4 h-4" />
                                                    ) : (
                                                        <EyeSlashIcon className="w-4 h-4" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleToggleLock(layer.id); }}
                                                    className="p-1 rounded hover:bg-white hover:bg-opacity-10 transition-all"
                                                    style={{ color: layer.locked ? '#EAB308' : creamSecondary }}
                                                    title={layer.locked ? 'Unlock' : 'Lock'}
                                                >
                                                    {layer.locked ? (
                                                        <LockClosedIcon className="w-4 h-4" />
                                                    ) : (
                                                        <LockOpenIcon className="w-4 h-4" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteLayer(layer.id); }}
                                                    className="p-1 rounded hover:bg-red-500 hover:bg-opacity-20 transition-all disabled:opacity-30"
                                                    style={{ color: '#EF4444' }}
                                                    title="Delete"
                                                    disabled={layers.length <= 1}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Layer Actions Footer */}
            {layers.length > 0 && (
                <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: '#3D4A5D' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // Move active layer to front (highest order)
                            const layerToMove = layers.find(l => l.id === activeLayerId) || layers[0];
                            if (layerToMove && canvasRef.current) {
                                const canvas = canvasRef.current.canvas;
                                if (canvas) {
                                    // Move canvas objects to front
                                    layerToMove.objectIds.forEach(objId => {
                                        const obj = canvasRef.current?.getObjectById(objId);
                                        if (obj) {
                                            canvas.bringObjectToFront(obj);
                                        }
                                    });
                                    canvas.renderAll();

                                    // Update layer order - move this layer to highest order
                                    const maxOrder = Math.max(...layers.map(l => l.order));
                                    canvasRef.current.renameLayer(layerToMove.id, layerToMove.name); // Trigger update

                                    // Reorder layers via the canvas API
                                    const newOrder = layers
                                        .filter(l => l.id !== layerToMove.id)
                                        .sort((a, b) => a.order - b.order)
                                        .map(l => l.id);
                                    newOrder.push(layerToMove.id); // Add to end (top)
                                    canvasRef.current.reorderLayers(newOrder);
                                }
                            }
                            onLayersChange?.();
                        }}
                        className="flex-1 py-1.5 text-xs rounded transition-colors hover:opacity-80"
                        style={{ backgroundColor: navyPrimary, color: creamSecondary }}
                    >
                        To Front
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // Move active layer to back (lowest order)
                            const layerToMove = layers.find(l => l.id === activeLayerId) || layers[0];
                            if (layerToMove && canvasRef.current) {
                                const canvas = canvasRef.current.canvas;
                                if (canvas) {
                                    // Move canvas objects to back
                                    [...layerToMove.objectIds].reverse().forEach(objId => {
                                        const obj = canvasRef.current?.getObjectById(objId);
                                        if (obj) {
                                            canvas.sendObjectToBack(obj);
                                        }
                                    });
                                    canvas.renderAll();

                                    // Update layer order - move this layer to lowest order
                                    const newOrder = [layerToMove.id]; // Start with this layer (bottom)
                                    layers
                                        .filter(l => l.id !== layerToMove.id)
                                        .sort((a, b) => a.order - b.order)
                                        .forEach(l => newOrder.push(l.id));
                                    canvasRef.current.reorderLayers(newOrder);
                                }
                            }
                            onLayersChange?.();
                        }}
                        className="flex-1 py-1.5 text-xs rounded transition-colors hover:opacity-80"
                        style={{ backgroundColor: navyPrimary, color: creamSecondary }}
                    >
                        To Back
                    </button>
                </div>
            )}
        </div>
    );
}
