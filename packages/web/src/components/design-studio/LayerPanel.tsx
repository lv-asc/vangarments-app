'use client';

import React from 'react';
import {
    EyeIcon,
    EyeSlashIcon,
    LockClosedIcon,
    LockOpenIcon,
    TrashIcon,
    PhotoIcon,
    DocumentTextIcon,
    StopIcon,
    SwatchIcon,
    Square2StackIcon
} from '@heroicons/react/24/outline';
import { CanvasObject, FabricCanvasRef } from './FabricCanvas';

// Theme colors
const navyPrimary = '#0D1B2A';
const navySecondary = '#1B263B';
const creamPrimary = '#F5F1E8';
const creamSecondary = '#E8E0D0';

interface LayerPanelProps {
    objects: CanvasObject[];
    selectedId?: string;
    canvasRef: React.RefObject<FabricCanvasRef>;
    onSelectObject: (id: string) => void;
}

export default function LayerPanel({
    objects,
    selectedId,
    canvasRef,
    onSelectObject
}: LayerPanelProps) {
    const getObjectIcon = (type: string) => {
        switch (type) {
            case 'i-text':
            case 'text':
            case 'textbox':
                return DocumentTextIcon;
            case 'rect':
                return StopIcon;
            case 'circle':
                return Square2StackIcon;
            case 'image':
                return PhotoIcon;
            default:
                return SwatchIcon;
        }
    };

    const handleToggleVisibility = (id: string, index: number) => {
        const canvas = canvasRef.current?.canvas;
        if (!canvas) return;

        const obj = canvas.getObjects()[objects.length - 1 - index];
        if (obj) {
            obj.visible = !obj.visible;
            canvas.renderAll();
        }
    };

    const handleToggleLock = (id: string, index: number) => {
        const canvas = canvasRef.current?.canvas;
        if (!canvas) return;

        const obj = canvas.getObjects()[objects.length - 1 - index];
        if (obj) {
            const isLocked = obj.lockMovementX && obj.lockMovementY;
            obj.lockMovementX = !isLocked;
            obj.lockMovementY = !isLocked;
            obj.lockRotation = !isLocked;
            obj.lockScalingX = !isLocked;
            obj.lockScalingY = !isLocked;
            obj.selectable = isLocked;
            canvas.renderAll();
        }
    };

    const handleSelectObject = (id: string, index: number) => {
        const canvas = canvasRef.current?.canvas;
        if (!canvas) return;

        const obj = canvas.getObjects()[objects.length - 1 - index];
        if (obj && obj.selectable !== false) {
            canvas.setActiveObject(obj);
            canvas.renderAll();
        }
        onSelectObject(id);
    };

    const handleDeleteObject = (index: number) => {
        const canvas = canvasRef.current?.canvas;
        if (!canvas) return;

        const obj = canvas.getObjects()[objects.length - 1 - index];
        if (obj) {
            canvas.remove(obj);
            canvas.renderAll();
        }
    };

    return (
        <div
            className="w-64 rounded-xl shadow-lg overflow-hidden"
            style={{ backgroundColor: navySecondary }}
        >
            <div className="px-4 py-3 border-b" style={{ borderColor: '#3D4A5D' }}>
                <h3 className="font-medium" style={{ color: creamPrimary }}>Layers</h3>
                <p className="text-xs mt-1" style={{ color: creamSecondary }}>
                    {objects.length} object{objects.length !== 1 ? 's' : ''}
                </p>
            </div>

            <div className="max-h-80 overflow-y-auto">
                {objects.length === 0 ? (
                    <div className="p-4 text-center">
                        <p className="text-sm" style={{ color: creamSecondary }}>
                            No objects on canvas
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                            Add text, shapes, or images
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y" style={{ borderColor: '#3D4A5D' }}>
                        {objects.map((obj, index) => {
                            const IconComponent = getObjectIcon(obj.type);
                            const isSelected = obj.id === selectedId;

                            return (
                                <li
                                    key={obj.id}
                                    className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
                                    style={{
                                        backgroundColor: isSelected ? `${navyPrimary}` : 'transparent'
                                    }}
                                    onClick={() => handleSelectObject(obj.id, index)}
                                >
                                    <IconComponent
                                        className="w-4 h-4 flex-shrink-0"
                                        style={{ color: creamSecondary }}
                                    />

                                    <span
                                        className="flex-1 text-sm truncate"
                                        style={{
                                            color: creamPrimary,
                                            opacity: obj.visible ? 1 : 0.5
                                        }}
                                    >
                                        {obj.name}
                                    </span>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleVisibility(obj.id, index);
                                            }}
                                            className="p-1 rounded hover:opacity-80 transition-opacity"
                                            style={{ color: creamSecondary }}
                                            title={obj.visible ? 'Hide' : 'Show'}
                                        >
                                            {obj.visible ? (
                                                <EyeIcon className="w-4 h-4" />
                                            ) : (
                                                <EyeSlashIcon className="w-4 h-4" />
                                            )}
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleLock(obj.id, index);
                                            }}
                                            className="p-1 rounded hover:opacity-80 transition-opacity"
                                            style={{ color: obj.locked ? '#EAB308' : creamSecondary }}
                                            title={obj.locked ? 'Unlock' : 'Lock'}
                                        >
                                            {obj.locked ? (
                                                <LockClosedIcon className="w-4 h-4" />
                                            ) : (
                                                <LockOpenIcon className="w-4 h-4" />
                                            )}
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteObject(index);
                                            }}
                                            className="p-1 rounded hover:opacity-80 transition-opacity"
                                            style={{ color: '#EF4444' }}
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Layer Actions */}
            {objects.length > 0 && (
                <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: '#3D4A5D' }}>
                    <button
                        onClick={() => canvasRef.current?.bringToFront()}
                        className="flex-1 py-1.5 text-xs rounded transition-colors hover:opacity-80"
                        style={{ backgroundColor: navyPrimary, color: creamSecondary }}
                    >
                        To Front
                    </button>
                    <button
                        onClick={() => canvasRef.current?.sendToBack()}
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
