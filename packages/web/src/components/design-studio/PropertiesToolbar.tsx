'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { InfiniteCanvasRef } from './InfiniteCanvas';

const GOOGLE_FONTS = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Playfair Display', 'Dancing Script'];

interface PropertiesToolbarProps {
    canvasRef: React.RefObject<InfiniteCanvasRef>;
    position: { x: number; y: number } | null;
    onUpdate: () => void;
}

function hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 100, l: 50 };
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export default function PropertiesToolbar({ canvasRef, position, onUpdate }: PropertiesToolbarProps) {
    const [fillHue, setFillHue] = useState(220);
    const [fillSat, setFillSat] = useState(90);
    const [fillLight, setFillLight] = useState(60);
    const [strokeHue, setStrokeHue] = useState(0);
    const [strokeSat, setStrokeSat] = useState(0);
    const [strokeLight, setStrokeLight] = useState(0);
    const [strokeWidth, setStrokeWidth] = useState(1);
    const [fontSize, setFontSize] = useState(24);
    const [fontFamily, setFontFamily] = useState('Inter');
    const [showFillPicker, setShowFillPicker] = useState(false);
    const [showStrokePicker, setShowStrokePicker] = useState(false);
    const [noFill, setNoFill] = useState(false);
    const [noStroke, setNoStroke] = useState(false);
    const [objType, setObjType] = useState<string | null>(null);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);

    // Get fresh active object from canvas
    const getActiveObject = useCallback(() => {
        return canvasRef.current?.canvas?.getActiveObject() || null;
    }, [canvasRef]);

    // Sync state when position changes (new selection)
    useEffect(() => {
        const obj = getActiveObject();
        if (!obj) {
            setObjType(null);
            return;
        }

        setObjType(obj.type || null);

        const fill = (obj as any).fill;
        if (!fill || fill === '' || fill === 'transparent') {
            setNoFill(true);
        } else if (typeof fill === 'string' && fill.startsWith('#')) {
            setNoFill(false);
            const hsl = hexToHsl(fill);
            setFillHue(hsl.h);
            setFillSat(hsl.s);
            setFillLight(hsl.l);
        }

        const stroke = (obj as any).stroke;
        if (!stroke || stroke === '' || stroke === 'transparent') {
            setNoStroke(true);
        } else if (typeof stroke === 'string' && stroke.startsWith('#')) {
            setNoStroke(false);
            const hsl = hexToHsl(stroke);
            setStrokeHue(hsl.h);
            setStrokeSat(hsl.s);
            setStrokeLight(hsl.l);
        }

        if ((obj as any).strokeWidth !== undefined) setStrokeWidth((obj as any).strokeWidth);
        if ((obj as any).fontSize) setFontSize((obj as any).fontSize);
        if ((obj as any).fontFamily) setFontFamily((obj as any).fontFamily);
        if ((obj as any).fontWeight) setIsBold((obj as any).fontWeight === 'bold');
        if ((obj as any).fontStyle) setIsItalic((obj as any).fontStyle === 'italic');
        if ((obj as any).underline !== undefined) setIsUnderline((obj as any).underline);
    }, [position, getActiveObject]);

    const updateObject = useCallback((props: Record<string, any>) => {
        const obj = getActiveObject();
        const canvas = canvasRef.current?.canvas;
        if (!obj || !canvas) return;

        obj.set(props);
        canvas.requestRenderAll();
        onUpdate();
    }, [getActiveObject, canvasRef, onUpdate]);

    const handleFillChange = useCallback((h: number, s: number, l: number) => {
        setFillHue(h); setFillSat(s); setFillLight(l); setNoFill(false);
        updateObject({ fill: hslToHex(h, s, l) });
    }, [updateObject]);

    const handleStrokeChange = useCallback((h: number, s: number, l: number) => {
        setStrokeHue(h); setStrokeSat(s); setStrokeLight(l); setNoStroke(false);
        updateObject({ stroke: hslToHex(h, s, l) });
    }, [updateObject]);

    const handleNoFill = useCallback(() => { setNoFill(true); updateObject({ fill: '' }); }, [updateObject]);
    const handleNoStroke = useCallback(() => { setNoStroke(true); updateObject({ stroke: '' }); }, [updateObject]);
    const handleStrokeWidthChange = useCallback((w: number) => { setStrokeWidth(w); updateObject({ strokeWidth: w }); }, [updateObject]);
    const handleFontSizeChange = useCallback((s: number) => { setFontSize(s); updateObject({ fontSize: s }); }, [updateObject]);
    const handleFontFamilyChange = useCallback((f: string) => { setFontFamily(f); updateObject({ fontFamily: f }); }, [updateObject]);
    const handleBold = useCallback(() => { const next = !isBold; setIsBold(next); updateObject({ fontWeight: next ? 'bold' : 'normal' }); }, [isBold, updateObject]);
    const handleItalic = useCallback(() => { const next = !isItalic; setIsItalic(next); updateObject({ fontStyle: next ? 'italic' : 'normal' }); }, [isItalic, updateObject]);
    const handleUnderline = useCallback(() => { const next = !isUnderline; setIsUnderline(next); updateObject({ underline: next }); }, [isUnderline, updateObject]);

    const handleDelete = useCallback(() => {
        const obj = getActiveObject();
        const canvas = canvasRef.current?.canvas;
        if (!canvas || !obj) return;
        canvas.remove(obj);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        onUpdate();
    }, [getActiveObject, canvasRef, onUpdate]);

    const handleDuplicate = useCallback(async () => {
        const obj = getActiveObject();
        const canvas = canvasRef.current?.canvas;
        if (!canvas || !obj) return;
        try {
            const cloned = await obj.clone();
            cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
            (cloned as any).id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            (cloned as any).name = `${(obj as any).name || 'Object'} Copy`;
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
            onUpdate();
        } catch (err) {
            console.error('Clone error:', err);
        }
    }, [getActiveObject, canvasRef, onUpdate]);

    if (!position || !objType) return null;

    const isText = objType === 'i-text' || objType === 'text' || objType === 'textbox';
    const isShape = objType === 'rect' || objType === 'circle' || objType === 'triangle' || objType === 'polygon' || objType === 'line';
    const isPath = objType === 'path';

    const fillColor = noFill ? 'transparent' : hslToHex(fillHue, fillSat, fillLight);
    const strokeColor = noStroke ? 'transparent' : hslToHex(strokeHue, strokeSat, strokeLight);

    return (
        <div
            className="fixed z-50 flex items-center gap-1 p-2 rounded-lg shadow-xl"
            style={{
                left: Math.max(10, Math.min(position.x - 200, window.innerWidth - 500)),
                top: Math.max(10, position.y - 70),
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Shape/Path Tools */}
            {(isShape || isPath) && (
                <>
                    {/* Fill Color */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowFillPicker(!showFillPicker); setShowStrokePicker(false); }}
                            className="w-8 h-8 rounded border-2 flex items-center justify-center"
                            style={{ backgroundColor: noFill ? '#FFF' : fillColor, borderColor: '#D1D5DB' }}
                            title="Fill Color"
                        >
                            {noFill && <span className="text-red-500 text-lg font-bold">/</span>}
                        </button>
                        {showFillPicker && (
                            <div className="absolute top-10 left-0 p-3 rounded-lg shadow-xl z-50" style={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', width: 200 }}>
                                <div className="mb-2 flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-700">Fill Color</span>
                                    <button onClick={handleNoFill} className={`text-xs px-2 py-1 rounded ${noFill ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-gray-200'}`}>No Fill</button>
                                </div>
                                <div className="w-full h-6 rounded mb-2" style={{ backgroundColor: noFill ? '#EEE' : fillColor }} />
                                <div className="mb-2">
                                    <label className="text-xs text-gray-500">Hue</label>
                                    <input type="range" min="0" max="360" value={fillHue} onChange={(e) => handleFillChange(Number(e.target.value), fillSat, fillLight)} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }} />
                                </div>
                                <div className="mb-2">
                                    <label className="text-xs text-gray-500">Saturation</label>
                                    <input type="range" min="0" max="100" value={fillSat} onChange={(e) => handleFillChange(fillHue, Number(e.target.value), fillLight)} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, ${hslToHex(fillHue, 0, fillLight)}, ${hslToHex(fillHue, 100, fillLight)})` }} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Brightness</label>
                                    <input type="range" min="0" max="100" value={fillLight} onChange={(e) => handleFillChange(fillHue, fillSat, Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #000000, ${hslToHex(fillHue, fillSat, 50)}, #ffffff)` }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stroke Color */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowStrokePicker(!showStrokePicker); setShowFillPicker(false); }}
                            className="w-8 h-8 rounded flex items-center justify-center"
                            style={{ border: `3px solid ${noStroke ? '#CCC' : strokeColor}` }}
                            title="Stroke Color"
                        >
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: noStroke ? '#CCC' : strokeColor }} />
                        </button>
                        {showStrokePicker && (
                            <div className="absolute top-10 left-0 p-3 rounded-lg shadow-xl z-50" style={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', width: 200 }}>
                                <div className="mb-2 flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-700">Stroke Color</span>
                                    <button onClick={handleNoStroke} className={`text-xs px-2 py-1 rounded ${noStroke ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-gray-200'}`}>No Stroke</button>
                                </div>
                                <div className="w-full h-6 rounded mb-2" style={{ backgroundColor: noStroke ? '#EEE' : strokeColor }} />
                                <div className="mb-2">
                                    <label className="text-xs text-gray-500">Hue</label>
                                    <input type="range" min="0" max="360" value={strokeHue} onChange={(e) => handleStrokeChange(Number(e.target.value), strokeSat, strokeLight)} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }} />
                                </div>
                                <div className="mb-2">
                                    <label className="text-xs text-gray-500">Saturation</label>
                                    <input type="range" min="0" max="100" value={strokeSat} onChange={(e) => handleStrokeChange(strokeHue, Number(e.target.value), strokeLight)} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, ${hslToHex(strokeHue, 0, strokeLight)}, ${hslToHex(strokeHue, 100, strokeLight)})` }} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Brightness</label>
                                    <input type="range" min="0" max="100" value={strokeLight} onChange={(e) => handleStrokeChange(strokeHue, strokeSat, Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #000000, ${hslToHex(strokeHue, strokeSat, 50)}, #ffffff)` }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stroke Width */}
                    <div className="flex items-center gap-1 px-2 border-l border-gray-300">
                        <span className="text-xs text-gray-600">Borda:</span>
                        <select value={strokeWidth} onChange={(e) => handleStrokeWidthChange(Number(e.target.value))} className="text-sm p-1 rounded border border-gray-300">
                            {[0, 1, 2, 3, 4, 5, 8, 10].map(w => (<option key={w} value={w}>{w}px</option>))}
                        </select>
                    </div>
                </>
            )}

            {/* Text Tools */}
            {isText && (
                <>
                    <select value={fontFamily} onChange={(e) => handleFontFamilyChange(e.target.value)} className="text-sm p-1 rounded border border-gray-300" style={{ fontFamily }}>
                        {GOOGLE_FONTS.map(font => (<option key={font} value={font} style={{ fontFamily: font }}>{font}</option>))}
                    </select>
                    <select value={fontSize} onChange={(e) => handleFontSizeChange(Number(e.target.value))} className="text-sm p-1 rounded border border-gray-300 w-16">
                        {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72].map(size => (<option key={size} value={size}>{size}</option>))}
                    </select>
                    <button onClick={handleBold} className={`w-8 h-8 rounded flex items-center justify-center font-bold ${isBold ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`} title="Bold">B</button>
                    <button onClick={handleItalic} className={`w-8 h-8 rounded flex items-center justify-center italic ${isItalic ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`} title="Italic">I</button>
                    <button onClick={handleUnderline} className={`w-8 h-8 rounded flex items-center justify-center underline ${isUnderline ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`} title="Underline">U</button>
                    <div className="relative border-l border-gray-300 pl-2">
                        <button onClick={() => { setShowFillPicker(!showFillPicker); setShowStrokePicker(false); }} className="w-8 h-8 rounded flex items-center justify-center relative" title="Text Color">
                            <span className="text-lg font-bold" style={{ color: fillColor }}>A</span>
                            <div className="absolute bottom-1 left-1 right-1 h-1 rounded" style={{ backgroundColor: fillColor }} />
                        </button>
                        {showFillPicker && (
                            <div className="absolute top-10 right-0 p-3 rounded-lg shadow-xl z-50" style={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', width: 200 }}>
                                <div className="mb-2"><span className="text-xs font-medium text-gray-700">Text Color</span></div>
                                <div className="w-full h-6 rounded mb-2" style={{ backgroundColor: fillColor }} />
                                <div className="mb-2">
                                    <label className="text-xs text-gray-500">Hue</label>
                                    <input type="range" min="0" max="360" value={fillHue} onChange={(e) => handleFillChange(Number(e.target.value), fillSat, fillLight)} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }} />
                                </div>
                                <div className="mb-2">
                                    <label className="text-xs text-gray-500">Saturation</label>
                                    <input type="range" min="0" max="100" value={fillSat} onChange={(e) => handleFillChange(fillHue, Number(e.target.value), fillLight)} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, ${hslToHex(fillHue, 0, fillLight)}, ${hslToHex(fillHue, 100, fillLight)})` }} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Brightness</label>
                                    <input type="range" min="0" max="100" value={fillLight} onChange={(e) => handleFillChange(fillHue, fillSat, Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #000000, ${hslToHex(fillHue, fillSat, 50)}, #ffffff)` }} />
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <button onClick={handleDuplicate} className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-100" title="Duplicate">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" /></svg>
            </button>

            <button onClick={handleDelete} className="w-8 h-8 rounded flex items-center justify-center hover:bg-red-100 text-red-500" title="Delete">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    );
}
