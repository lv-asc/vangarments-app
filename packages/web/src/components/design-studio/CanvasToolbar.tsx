'use client';

import React, { useState, useRef } from 'react';
import {
    CursorArrowRaysIcon,
    DocumentTextIcon,
    Square2StackIcon,
    StopIcon,
    PhotoIcon,
    SwatchIcon,
    ArrowUturnLeftIcon,
    ArrowUturnRightIcon,
    MagnifyingGlassMinusIcon,
    MagnifyingGlassPlusIcon,
    ArrowDownTrayIcon,
    TrashIcon,
    Bars3BottomLeftIcon,
    Bars3BottomRightIcon
} from '@heroicons/react/24/outline';
import { FabricCanvasRef } from './FabricCanvas';

// Theme colors
const navyPrimary = '#0D1B2A';
const navySecondary = '#1B263B';
const creamPrimary = '#F5F1E8';
const creamSecondary = '#E8E0D0';

interface CanvasToolbarProps {
    canvasRef: React.RefObject<FabricCanvasRef>;
    onSave?: () => void;
    onExport?: (format: 'png' | 'pdf') => void;
    mockups?: Array<{ id: string; url: string; name: string }>;
    zoom: number;
    onZoomChange: (zoom: number) => void;
}

type Tool = 'select' | 'text' | 'rect' | 'circle' | 'image' | 'color';

export default function CanvasToolbar({
    canvasRef,
    onSave,
    onExport,
    mockups = [],
    zoom,
    onZoomChange
}: CanvasToolbarProps) {
    const [activeTool, setActiveTool] = useState<Tool>('select');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#3B82F6');
    const [showImagePicker, setShowImagePicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleToolClick = (tool: Tool) => {
        setActiveTool(tool);

        switch (tool) {
            case 'text':
                canvasRef.current?.addText();
                setActiveTool('select');
                break;
            case 'rect':
                canvasRef.current?.addRect();
                setActiveTool('select');
                break;
            case 'circle':
                canvasRef.current?.addCircle();
                setActiveTool('select');
                break;
            case 'color':
                setShowColorPicker(!showColorPicker);
                break;
            case 'image':
                setShowImagePicker(!showImagePicker);
                break;
        }
    };

    const handleColorSelect = (color: string) => {
        setSelectedColor(color);
        canvasRef.current?.addColor(color);
        setShowColorPicker(false);
        setActiveTool('select');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                canvasRef.current?.addImage(dataUrl);
            };
            reader.readAsDataURL(file);
        }
        setShowImagePicker(false);
        setActiveTool('select');
    };

    const handleMockupSelect = (url: string) => {
        canvasRef.current?.addImage(url);
        setShowImagePicker(false);
        setActiveTool('select');
    };

    const handleZoomIn = () => {
        const newZoom = Math.min(zoom + 0.1, 3);
        onZoomChange(newZoom);
        canvasRef.current?.setZoom(newZoom);
    };

    const handleZoomOut = () => {
        const newZoom = Math.max(zoom - 0.1, 0.25);
        onZoomChange(newZoom);
        canvasRef.current?.setZoom(newZoom);
    };

    const handleExportPNG = () => {
        const dataUrl = canvasRef.current?.exportToPNG();
        if (dataUrl) {
            const link = document.createElement('a');
            link.download = `design_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        }
        onExport?.('png');
    };

    const tools = [
        { id: 'select' as Tool, icon: CursorArrowRaysIcon, label: 'Select' },
        { id: 'text' as Tool, icon: DocumentTextIcon, label: 'Text' },
        { id: 'rect' as Tool, icon: StopIcon, label: 'Rectangle' },
        { id: 'circle' as Tool, icon: Square2StackIcon, label: 'Circle' },
        { id: 'image' as Tool, icon: PhotoIcon, label: 'Image' },
        { id: 'color' as Tool, icon: SwatchIcon, label: 'Color' },
    ];

    const presetColors = [
        '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6',
        '#3B82F6', '#8B5CF6', '#EC4899', '#000000', '#FFFFFF',
        '#0D1B2A', '#1B263B', '#F5F1E8', '#E8E0D0'
    ];

    return (
        <div
            className="flex items-center gap-2 p-3 rounded-xl shadow-lg"
            style={{ backgroundColor: navySecondary }}
        >
            {/* Tools */}
            <div className="flex items-center gap-1 border-r pr-3" style={{ borderColor: '#3D4A5D' }}>
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.id)}
                        className="p-2 rounded-lg transition-all relative"
                        style={{
                            backgroundColor: activeTool === tool.id ? creamPrimary : 'transparent',
                            color: activeTool === tool.id ? navyPrimary : creamSecondary
                        }}
                        title={tool.label}
                    >
                        <tool.icon className="w-5 h-5" />
                    </button>
                ))}

                {/* Color Picker Dropdown */}
                {showColorPicker && (
                    <div
                        className="absolute top-14 left-0 p-3 rounded-lg shadow-xl z-50"
                        style={{ backgroundColor: navySecondary, border: `1px solid #3D4A5D` }}
                    >
                        <p className="text-xs mb-2" style={{ color: creamSecondary }}>Add Color Swatch</p>
                        <div className="grid grid-cols-7 gap-1">
                            {presetColors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => handleColorSelect(color)}
                                    className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                                    style={{
                                        backgroundColor: color,
                                        borderColor: color === selectedColor ? creamPrimary : 'transparent'
                                    }}
                                />
                            ))}
                        </div>
                        <input
                            type="color"
                            value={selectedColor}
                            onChange={(e) => handleColorSelect(e.target.value)}
                            className="w-full h-8 mt-2 rounded cursor-pointer"
                        />
                    </div>
                )}

                {/* Image Picker Dropdown */}
                {showImagePicker && (
                    <div
                        className="absolute top-14 left-0 p-3 rounded-lg shadow-xl z-50 w-64"
                        style={{ backgroundColor: navySecondary, border: `1px solid #3D4A5D` }}
                    >
                        <p className="text-xs mb-2" style={{ color: creamSecondary }}>Add Image</p>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2 px-3 rounded-lg mb-2 text-sm transition-colors"
                            style={{ backgroundColor: navyPrimary, color: creamPrimary }}
                        >
                            Upload from Computer
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />

                        {mockups.length > 0 && (
                            <>
                                <p className="text-xs mb-2 mt-3" style={{ color: creamSecondary }}>From Mockups</p>
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                    {mockups.map((mockup) => (
                                        <button
                                            key={mockup.id}
                                            onClick={() => handleMockupSelect(mockup.url)}
                                            className="w-full py-2 px-3 rounded text-left text-sm truncate transition-colors hover:opacity-80"
                                            style={{ backgroundColor: navyPrimary, color: creamSecondary }}
                                        >
                                            {mockup.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Layer Actions */}
            <div className="flex items-center gap-1 border-r pr-3" style={{ borderColor: '#3D4A5D' }}>
                <button
                    onClick={() => canvasRef.current?.bringForward()}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: creamSecondary }}
                    title="Bring Forward"
                >
                    <Bars3BottomRightIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => canvasRef.current?.sendBackward()}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: creamSecondary }}
                    title="Send Backward"
                >
                    <Bars3BottomLeftIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => canvasRef.current?.deleteSelected()}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: '#EF4444' }}
                    title="Delete"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-1 border-r pr-3" style={{ borderColor: '#3D4A5D' }}>
                <button
                    onClick={() => canvasRef.current?.undo()}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: creamSecondary }}
                    title="Undo"
                >
                    <ArrowUturnLeftIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => canvasRef.current?.redo()}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: creamSecondary }}
                    title="Redo"
                >
                    <ArrowUturnRightIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1 border-r pr-3" style={{ borderColor: '#3D4A5D' }}>
                <button
                    onClick={handleZoomOut}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: creamSecondary }}
                    title="Zoom Out"
                >
                    <MagnifyingGlassMinusIcon className="w-5 h-5" />
                </button>
                <span className="text-sm px-2 min-w-[50px] text-center" style={{ color: creamPrimary }}>
                    {Math.round(zoom * 100)}%
                </span>
                <button
                    onClick={handleZoomIn}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: creamSecondary }}
                    title="Zoom In"
                >
                    <MagnifyingGlassPlusIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Export & Save */}
            <div className="flex items-center gap-2 ml-auto">
                <button
                    onClick={handleExportPNG}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:opacity-90"
                    style={{ backgroundColor: navyPrimary, color: creamPrimary }}
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span className="text-sm">Export</span>
                </button>

                {onSave && (
                    <button
                        onClick={onSave}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: creamPrimary, color: navyPrimary }}
                    >
                        Save
                    </button>
                )}
            </div>
        </div>
    );
}
