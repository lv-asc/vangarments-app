'use client';

import React, { useState, useEffect } from 'react';
import { FabricCanvasRef } from './FabricCanvas';

// Theme colors
const navyPrimary = '#0D1B2A';
const navySecondary = '#1B263B';
const creamPrimary = '#F5F1E8';
const creamSecondary = '#E8E0D0';

interface ObjectProperties {
    left: number;
    top: number;
    width: number;
    height: number;
    angle: number;
    opacity: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    fontSize?: number;
    fontFamily?: string;
    text?: string;
}

interface PropertiesPanelProps {
    canvasRef: React.RefObject<FabricCanvasRef>;
    hasSelection: boolean;
}

export default function PropertiesPanel({
    canvasRef,
    hasSelection
}: PropertiesPanelProps) {
    const [properties, setProperties] = useState<ObjectProperties | null>(null);

    // Update properties when selection changes
    useEffect(() => {
        const updateProperties = () => {
            const canvas = canvasRef.current?.canvas;
            if (!canvas) return;

            const active = canvas.getActiveObject();
            if (!active) {
                setProperties(null);
                return;
            }

            const bounds = active.getBoundingRect();
            setProperties({
                left: Math.round(active.left || 0),
                top: Math.round(active.top || 0),
                width: Math.round(bounds.width),
                height: Math.round(bounds.height),
                angle: Math.round(active.angle || 0),
                opacity: Math.round((active.opacity || 1) * 100),
                fill: (active.fill as string) || '#000000',
                stroke: (active.stroke as string) || '',
                strokeWidth: active.strokeWidth || 0,
                fontSize: (active as any).fontSize,
                fontFamily: (active as any).fontFamily,
                text: (active as any).text
            });
        };

        const canvas = canvasRef.current?.canvas;
        if (canvas) {
            canvas.on('selection:created', updateProperties);
            canvas.on('selection:updated', updateProperties);
            canvas.on('selection:cleared', () => setProperties(null));
            canvas.on('object:modified', updateProperties);
            canvas.on('object:scaling', updateProperties);
            canvas.on('object:moving', updateProperties);
            canvas.on('object:rotating', updateProperties);
        }

        return () => {
            if (canvas) {
                canvas.off('selection:created', updateProperties);
                canvas.off('selection:updated', updateProperties);
                canvas.off('selection:cleared');
                canvas.off('object:modified', updateProperties);
                canvas.off('object:scaling', updateProperties);
                canvas.off('object:moving', updateProperties);
                canvas.off('object:rotating', updateProperties);
            }
        };
    }, [canvasRef]);

    const updateProperty = (key: keyof ObjectProperties, value: number | string) => {
        const canvas = canvasRef.current?.canvas;
        if (!canvas) return;

        const active = canvas.getActiveObject();
        if (!active) return;

        switch (key) {
            case 'left':
                active.set('left', value as number);
                break;
            case 'top':
                active.set('top', value as number);
                break;
            case 'angle':
                active.set('angle', value as number);
                break;
            case 'opacity':
                active.set('opacity', (value as number) / 100);
                break;
            case 'fill':
                active.set('fill', value as string);
                break;
            case 'stroke':
                active.set('stroke', value as string);
                break;
            case 'strokeWidth':
                active.set('strokeWidth', value as number);
                break;
            case 'fontSize':
                (active as any).set('fontSize', value as number);
                break;
            case 'text':
                (active as any).set('text', value as string);
                break;
        }

        canvas.renderAll();
        setProperties(prev => prev ? { ...prev, [key]: value } : null);
    };

    if (!hasSelection || !properties) {
        return (
            <div
                className="w-64 rounded-xl shadow-lg p-4"
                style={{ backgroundColor: navySecondary }}
            >
                <h3 className="font-medium mb-2" style={{ color: creamPrimary }}>Properties</h3>
                <p className="text-sm" style={{ color: creamSecondary }}>
                    Select an object to edit its properties
                </p>
            </div>
        );
    }

    const isText = properties.text !== undefined;

    return (
        <div
            className="w-64 rounded-xl shadow-lg overflow-hidden"
            style={{ backgroundColor: navySecondary }}
        >
            <div className="px-4 py-3 border-b" style={{ borderColor: '#3D4A5D' }}>
                <h3 className="font-medium" style={{ color: creamPrimary }}>Properties</h3>
            </div>

            <div className="p-4 space-y-4">
                {/* Position */}
                <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: creamSecondary }}>
                        Position
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-xs" style={{ color: '#6B7280' }}>X</span>
                            <input
                                type="number"
                                value={properties.left}
                                onChange={(e) => updateProperty('left', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 rounded text-sm"
                                style={{ backgroundColor: navyPrimary, color: creamPrimary, border: `1px solid #3D4A5D` }}
                            />
                        </div>
                        <div>
                            <span className="text-xs" style={{ color: '#6B7280' }}>Y</span>
                            <input
                                type="number"
                                value={properties.top}
                                onChange={(e) => updateProperty('top', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 rounded text-sm"
                                style={{ backgroundColor: navyPrimary, color: creamPrimary, border: `1px solid #3D4A5D` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Size */}
                <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: creamSecondary }}>
                        Size (display)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-xs" style={{ color: '#6B7280' }}>W</span>
                            <input
                                type="number"
                                value={properties.width}
                                disabled
                                className="w-full px-2 py-1 rounded text-sm opacity-60"
                                style={{ backgroundColor: navyPrimary, color: creamPrimary, border: `1px solid #3D4A5D` }}
                            />
                        </div>
                        <div>
                            <span className="text-xs" style={{ color: '#6B7280' }}>H</span>
                            <input
                                type="number"
                                value={properties.height}
                                disabled
                                className="w-full px-2 py-1 rounded text-sm opacity-60"
                                style={{ backgroundColor: navyPrimary, color: creamPrimary, border: `1px solid #3D4A5D` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Rotation */}
                <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: creamSecondary }}>
                        Rotation
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={properties.angle}
                            onChange={(e) => updateProperty('angle', parseInt(e.target.value))}
                            className="flex-1"
                        />
                        <span className="text-sm w-12 text-right" style={{ color: creamPrimary }}>
                            {properties.angle}°
                        </span>
                    </div>
                </div>

                {/* Opacity */}
                <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: creamSecondary }}>
                        Opacity
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={properties.opacity}
                            onChange={(e) => updateProperty('opacity', parseInt(e.target.value))}
                            className="flex-1"
                        />
                        <span className="text-sm w-12 text-right" style={{ color: creamPrimary }}>
                            {properties.opacity}%
                        </span>
                    </div>
                </div>

                {/* Colors */}
                <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: creamSecondary }}>
                        Colors
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-xs" style={{ color: '#6B7280' }}>Fill</span>
                            <div className="flex items-center gap-1">
                                <input
                                    type="color"
                                    value={properties.fill || '#000000'}
                                    onChange={(e) => updateProperty('fill', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={properties.fill || ''}
                                    onChange={(e) => updateProperty('fill', e.target.value)}
                                    className="flex-1 px-2 py-1 rounded text-xs"
                                    style={{ backgroundColor: navyPrimary, color: creamPrimary, border: `1px solid #3D4A5D` }}
                                />
                            </div>
                        </div>
                        <div>
                            <span className="text-xs" style={{ color: '#6B7280' }}>Stroke</span>
                            <div className="flex items-center gap-1">
                                <input
                                    type="color"
                                    value={properties.stroke || '#000000'}
                                    onChange={(e) => updateProperty('stroke', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer"
                                />
                                <input
                                    type="number"
                                    value={properties.strokeWidth}
                                    onChange={(e) => updateProperty('strokeWidth', parseInt(e.target.value) || 0)}
                                    className="w-12 px-2 py-1 rounded text-xs"
                                    style={{ backgroundColor: navyPrimary, color: creamPrimary, border: `1px solid #3D4A5D` }}
                                    title="Stroke Width"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Text Properties */}
                {isText && (
                    <div>
                        <label className="text-xs font-medium mb-2 block" style={{ color: creamSecondary }}>
                            Text
                        </label>
                        <div className="space-y-2">
                            <input
                                type="number"
                                value={properties.fontSize || 16}
                                onChange={(e) => updateProperty('fontSize', parseInt(e.target.value) || 16)}
                                className="w-full px-2 py-1 rounded text-sm"
                                style={{ backgroundColor: navyPrimary, color: creamPrimary, border: `1px solid #3D4A5D` }}
                                placeholder="Font Size"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
