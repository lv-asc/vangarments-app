'use client';

import React, { useState } from 'react';
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
    Square2StackIcon,
    PencilSquareIcon,
    CheckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import type { InfiniteCanvasRef, CanvasObject } from './InfiniteCanvas';

// Theme colors
const navyPrimary = '#0D1B2A';
const navySecondary = '#1B263B';
const creamPrimary = '#F5F1E8';
const creamSecondary = '#E8E0D0';

interface LayerPanelProps {
    objects: CanvasObject[];
    selectedId?: string;
    canvasRef: React.RefObject<InfiniteCanvasRef>;
    onSelectObject: (id: string) => void;
    onObjectsChange?: () => void;
}

export default function LayerPanel({
    objects,
    selectedId,
    canvasRef,
    onSelectObject,
    onObjectsChange
}: LayerPanelProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const getObjectIcon = (type: string) => {
        switch (type) {
            case 'i-text':
            case 'text':
            case 'textbox':
                return DocumentTextIcon;
            case 'rect':
                return StopIcon;
            case 'circle':
            case 'polygon':
            case 'triangle':
                return Square2StackIcon;
            case 'image':
                return PhotoIcon;
            default:
                return SwatchIcon;
        }
    };

    const handleToggleVisibility = (id: string) => {
        canvasRef.current?.toggleVisibility(id);
        onObjectsChange?.();
    };

    const handleToggleLock = (id: string) => {
        canvasRef.current?.toggleLock(id);
        onObjectsChange?.();
    };

    const handleSelectObject = (id: string) => {
        const canvas = canvasRef.current?.canvas;
        if (!canvas) return;
        const obj = canvasRef.current?.getObjectById(id);
        if (obj && obj.selectable !== false) {
            canvas.setActiveObject(obj);
            canvas.renderAll();
        }
        onSelectObject(id);
    };

    const handleDeleteObject = (id: string) => {
        canvasRef.current?.deleteObjectById(id);
        onObjectsChange?.();
    };

    const startRename = (id: string, currentName: string) => {
        setEditingId(id);
        setEditName(currentName);
    };

    const confirmRename = (id: string) => {
        const canvas = canvasRef.current?.canvas;
        if (!canvas || !editName.trim()) {
            setEditingId(null);
            return;
        }
        const obj = canvasRef.current?.getObjectById(id);
        if (obj) {
            obj.name = editName.trim();
            canvas.renderAll();
            onObjectsChange?.();
        }
        setEditingId(null);
        setEditName('');
    };

    const cancelRename = () => {
        setEditingId(null);
        setEditName('');
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
                        {objects.map((obj) => {
                            const IconComponent = getObjectIcon(obj.type);
                            const isSelected = obj.id === selectedId;
                            const isEditing = editingId === obj.id;

                            return (
                                <li
                                    key={obj.id}
                                    className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-opacity-50"
                                    style={{
                                        backgroundColor: isSelected ? `${navyPrimary}` : 'transparent'
                                    }}
                                    onClick={() => !isEditing && handleSelectObject(obj.id)}
                                >
                                    <IconComponent
                                        className="w-4 h-4 flex-shrink-0"
                                        style={{ color: creamSecondary }}
                                    />

                                    {isEditing ? (
                                        <div className="flex-1 flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') confirmRename(obj.id);
                                                    if (e.key === 'Escape') cancelRename();
                                                }}
                                                autoFocus
                                                className="flex-1 px-1 py-0.5 text-sm rounded bg-transparent border outline-none"
                                                style={{ borderColor: creamPrimary, color: creamPrimary }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); confirmRename(obj.id); }}
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
                                            <span
                                                className="flex-1 text-sm truncate"
                                                style={{
                                                    color: creamPrimary,
                                                    opacity: obj.visible ? 1 : 0.5
                                                }}
                                                onDoubleClick={(e) => {
                                                    e.stopPropagation();
                                                    startRename(obj.id, obj.name);
                                                }}
                                                title="Double-click to rename"
                                            >
                                                {obj.name}
                                            </span>

                                            <div className="flex items-center gap-0.5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); startRename(obj.id, obj.name); }}
                                                    className="p-1 rounded hover:bg-white hover:bg-opacity-10 transition-all"
                                                    style={{ color: creamSecondary }}
                                                    title="Rename"
                                                >
                                                    <PencilSquareIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleToggleVisibility(obj.id); }}
                                                    className="p-1 rounded hover:bg-white hover:bg-opacity-10 transition-all"
                                                    style={{ color: obj.visible ? creamSecondary : '#6B7280' }}
                                                    title={obj.visible ? 'Hide' : 'Show'}
                                                >
                                                    {obj.visible ? (
                                                        <EyeIcon className="w-4 h-4" />
                                                    ) : (
                                                        <EyeSlashIcon className="w-4 h-4" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleToggleLock(obj.id); }}
                                                    className="p-1 rounded hover:bg-white hover:bg-opacity-10 transition-all"
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
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteObject(obj.id); }}
                                                    className="p-1 rounded hover:bg-red-500 hover:bg-opacity-20 transition-all"
                                                    style={{ color: '#EF4444' }}
                                                    title="Delete"
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
