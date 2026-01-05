'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    CursorArrowRaysIcon,
    HandRaisedIcon,
    PencilIcon,
    PhotoIcon,
    ArrowUturnLeftIcon,
    ArrowUturnRightIcon,
    TrashIcon,
    ArrowDownTrayIcon,
    ArrowsPointingOutIcon,
    FolderIcon,
    LinkIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import type { InfiniteCanvasRef, CanvasTool } from './InfiniteCanvas';

// Theme colors
const navyPrimary = '#0D1B2A';
const navySecondary = '#1B263B';
const creamPrimary = '#F5F1E8';
const creamSecondary = '#E8E0D0';

const STICKY_COLORS = [
    { name: 'yellow', color: '#FEF3C7', label: 'Yellow' },
    { name: 'pink', color: '#FCE7F3', label: 'Pink' },
    { name: 'orange', color: '#FFEDD5', label: 'Orange' },
    { name: 'green', color: '#D1FAE5', label: 'Green' },
    { name: 'blue', color: '#DBEAFE', label: 'Blue' },
    { name: 'purple', color: '#E9D8FD', label: 'Purple' }
];

const GOOGLE_FONTS = [
    { name: 'Inter', family: 'Inter' },
    { name: 'Roboto', family: 'Roboto' },
    { name: 'Open Sans', family: 'Open Sans' },
    { name: 'Lato', family: 'Lato' },
    { name: 'Montserrat', family: 'Montserrat' },
    { name: 'Poppins', family: 'Poppins' },
    { name: 'Playfair Display', family: 'Playfair Display' },
    { name: 'Dancing Script', family: 'Dancing Script' },
    { name: 'Pacifico', family: 'Pacifico' },
    { name: 'Bebas Neue', family: 'Bebas Neue' },
    { name: 'Oswald', family: 'Oswald' },
    { name: 'Raleway', family: 'Raleway' }
];

const PRESET_COLORS = ['#F5F1E8', '#FFFFFF', '#DC2626', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#000000'];

const SHAPES = [
    { type: 'rect', label: 'Rectangle', icon: '▢' },
    { type: 'circle', label: 'Circle', icon: '○' },
    { type: 'triangle', label: 'Triangle', icon: '△' },
    { type: 'diamond', label: 'Diamond', icon: '◇' },
    { type: 'star', label: 'Star', icon: '☆' },
    { type: 'arrow', label: 'Arrow', icon: '➤' },
    { type: 'line', label: 'Line', icon: '―' }
] as const;

interface MoodboardToolbarProps {
    canvasRef: React.RefObject<InfiniteCanvasRef>;
    onSave?: () => void;
    onOpenFilePicker?: () => void;
    zoom: number;
    onZoomChange: (zoom: number) => void;
    activeTool: CanvasTool;
    onToolChange: (tool: CanvasTool) => void;
}

interface ToolButtonProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
    disabled?: boolean;
}

function ToolButton({ icon, label, active, onClick, disabled }: ToolButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={label}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
                backgroundColor: active ? creamPrimary : `${navyPrimary}80`,
                color: active ? navyPrimary : creamSecondary,
                boxShadow: active ? `0 0 0 2px ${creamPrimary}` : 'none'
            }}
        >
            {icon}
        </button>
    );
}

function hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => { const k = (n + h / 30) % 12; const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * color).toString(16).padStart(2, '0'); };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function TextIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
        </svg>
    );
}

function EraserIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 21h10" /><path d="M5.5 16.5l9-9a4.95 4.95 0 017 7l-9 9-7-7z" /><path d="M3 17l4 4" />
        </svg>
    );
}

function HighlighterIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l-6 6v3h9l3-3" /><path d="M22 12l-4.6 4.6a2 2 0 01-2.8 0l-5.2-5.2a2 2 0 010-2.8L14 4" />
        </svg>
    );
}

function ShapesIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="8" height="8" rx="1" /><circle cx="18" cy="6" r="4" /><polygon points="12 14 18 22 6 22" />
        </svg>
    );
}

export default function MoodboardToolbar({
    canvasRef, onSave, onOpenFilePicker, zoom, onZoomChange, activeTool, onToolChange
}: MoodboardToolbarProps) {
    const [showStickyColors, setShowStickyColors] = useState(false);
    const [showBrushSettings, setShowBrushSettings] = useState(false);
    const [showShapes, setShowShapes] = useState(false);
    const [brushHue, setBrushHue] = useState(0);
    const [brushSaturation, setBrushSaturation] = useState(100);
    const [brushLightness, setBrushLightness] = useState(50);
    const [brushWidth, setBrushWidth] = useState(3);
    const [connectionColor, setConnectionColor] = useState('#DC2626');
    const [showConnectionColors, setShowConnectionColors] = useState(false);
    const [textColor, setTextColor] = useState('#F5F1E8');
    const [textFont, setTextFont] = useState('Inter');
    const [showTextSettings, setShowTextSettings] = useState(false);
    const [shapeColor, setShapeColor] = useState('#3B82F6');
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (fontsLoaded) return;
        const fontFamilies = GOOGLE_FONTS.map(f => f.family.replace(/ /g, '+')).join('|');
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies.replace(/\|/g, '&family=')}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        setFontsLoaded(true);
    }, [fontsLoaded]);

    const brushColor = hslToHex(brushHue, brushSaturation, brushLightness);
    useEffect(() => { canvasRef.current?.setBrushColor(brushColor); }, [brushColor, canvasRef]);
    useEffect(() => { canvasRef.current?.setBrushWidth(brushWidth); }, [brushWidth, canvasRef]);

    const closeAllMenus = () => { setShowStickyColors(false); setShowConnectionColors(false); setShowTextSettings(false); setShowBrushSettings(false); setShowShapes(false); };
    const handleToolClick = (tool: CanvasTool) => { onToolChange(tool); canvasRef.current?.setActiveTool(tool); closeAllMenus(); };
    const handleAddStickyNote = (color: string) => { canvasRef.current?.addStickyNote(color); setShowStickyColors(false); };
    const handleAddText = () => { canvasRef.current?.addText('Double-click to edit', textColor, textFont); setShowTextSettings(false); handleToolClick('select'); };
    const handleAddShape = (shapeType: 'rect' | 'circle' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'line') => {
        canvasRef.current?.addShape(shapeType, shapeColor);
        setShowShapes(false);
        handleToolClick('select');
    };
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onload = (event) => { canvasRef.current?.addImage(event.target?.result as string); }; reader.readAsDataURL(file); }
        e.target.value = '';
    };
    const handleZoomChange = (newZoom: number) => { const clampedZoom = Math.max(0.1, Math.min(4, newZoom)); onZoomChange(clampedZoom); canvasRef.current?.setZoom(clampedZoom); };
    const handleResetView = () => { onZoomChange(1); canvasRef.current?.resetView(); };
    const handleExportPNG = () => { const dataUrl = canvasRef.current?.exportToPNG(); if (dataUrl) { const link = document.createElement('a'); link.download = 'moodboard.png'; link.href = dataUrl; link.click(); } };
    const handlePan = (direction: 'up' | 'down' | 'left' | 'right') => { const amount = 100; switch (direction) { case 'up': canvasRef.current?.panBy(0, amount); break; case 'down': canvasRef.current?.panBy(0, -amount); break; case 'left': canvasRef.current?.panBy(amount, 0); break; case 'right': canvasRef.current?.panBy(-amount, 0); break; } };

    return (
        <div className="flex items-center gap-2 p-2 rounded-xl backdrop-blur-sm flex-wrap" style={{ backgroundColor: `${navySecondary}EE`, border: '1px solid #2D3A4D' }}>
            {/* Selection Tools */}
            <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: '#3D4A5D' }}>
                <ToolButton icon={<CursorArrowRaysIcon className="w-5 h-5" />} label="Select" active={activeTool === 'select'} onClick={() => handleToolClick('select')} />
                <ToolButton icon={<HandRaisedIcon className="w-5 h-5" />} label="Pan (Space)" active={activeTool === 'pan'} onClick={() => handleToolClick('pan')} />
            </div>

            {/* Drawing Tools */}
            <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: '#3D4A5D' }}>
                {/* Text Tool */}
                <div className="relative">
                    <ToolButton icon={<TextIcon className="w-5 h-5" />} label="Text" active={showTextSettings} onClick={() => { closeAllMenus(); setShowTextSettings(!showTextSettings); }} />
                    {showTextSettings && (
                        <div className="absolute top-12 left-0 p-4 rounded-lg shadow-xl z-50" style={{ backgroundColor: navySecondary, border: '1px solid #3D4A5D', width: 240 }}>
                            <div className="mb-3">
                                <label className="text-xs font-medium mb-1 block" style={{ color: creamSecondary }}>Font</label>
                                <select value={textFont} onChange={(e) => setTextFont(e.target.value)} className="w-full p-2 rounded text-sm" style={{ backgroundColor: navyPrimary, color: creamPrimary, border: '1px solid #3D4A5D', fontFamily: textFont }}>
                                    {GOOGLE_FONTS.map(font => (<option key={font.family} value={font.family} style={{ fontFamily: font.family }}>{font.name}</option>))}
                                </select>
                            </div>
                            <div className="mb-3 p-3 rounded text-center" style={{ backgroundColor: navyPrimary }}><span style={{ fontFamily: textFont, color: textColor, fontSize: 18 }}>Preview Abc</span></div>
                            <div className="mb-3">
                                <label className="text-xs font-medium mb-1 block" style={{ color: creamSecondary }}>Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_COLORS.map(color => (<button key={color} onClick={() => { setTextColor(color); canvasRef.current?.setTextColor(color); }} className={`w-6 h-6 rounded-full border-2 transition-transform ${textColor === color ? 'scale-125' : ''}`} style={{ backgroundColor: color, borderColor: textColor === color ? creamPrimary : '#3D4A5D' }} />))}
                                </div>
                            </div>
                            <button onClick={handleAddText} className="w-full py-2 rounded text-sm font-medium" style={{ backgroundColor: creamPrimary, color: navyPrimary }}>Add Text</button>
                        </div>
                    )}
                </div>

                {/* Brush Tool */}
                <div className="relative">
                    <ToolButton icon={<PencilIcon className="w-5 h-5" />} label="Brush" active={activeTool === 'brush'} onClick={() => { handleToolClick('brush'); setShowBrushSettings(true); }} />
                    {showBrushSettings && (
                        <div className="absolute top-12 left-0 p-4 rounded-lg shadow-xl z-50" style={{ backgroundColor: navySecondary, border: '1px solid #3D4A5D', width: 220 }}>
                            <div className="mb-3"><label className="text-xs font-medium mb-1 block" style={{ color: creamSecondary }}>Preview</label><div className="w-full h-8 rounded border" style={{ backgroundColor: brushColor, borderColor: '#3D4A5D' }} /></div>
                            <div className="mb-3"><label className="text-xs font-medium mb-1 block" style={{ color: creamSecondary }}>Hue</label><input type="range" min="0" max="360" value={brushHue} onChange={(e) => setBrushHue(Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }} /></div>
                            <div className="mb-3"><label className="text-xs font-medium mb-1 block" style={{ color: creamSecondary }}>Saturation</label><input type="range" min="0" max="100" value={brushSaturation} onChange={(e) => setBrushSaturation(Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, ${hslToHex(brushHue, 0, brushLightness)}, ${hslToHex(brushHue, 100, brushLightness)})` }} /></div>
                            <div className="mb-3"><label className="text-xs font-medium mb-1 block" style={{ color: creamSecondary }}>Brightness</label><input type="range" min="0" max="100" value={brushLightness} onChange={(e) => setBrushLightness(Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #000000, ${hslToHex(brushHue, brushSaturation, 50)}, #ffffff)` }} /></div>
                            <div className="mb-3"><label className="text-xs font-medium mb-1 block" style={{ color: creamSecondary }}>Size: {brushWidth}px</label><input type="range" min="1" max="50" value={brushWidth} onChange={(e) => setBrushWidth(Number(e.target.value))} className="w-full" /></div>
                            <button onClick={() => setShowBrushSettings(false)} className="w-full py-1 rounded text-sm font-medium" style={{ backgroundColor: creamPrimary, color: navyPrimary }}>Close</button>
                        </div>
                    )}
                </div>

                {/* Eraser */}
                <ToolButton icon={<EraserIcon className="w-5 h-5" />} label="Eraser" active={activeTool === 'eraser'} onClick={() => handleToolClick('eraser')} />

                {/* Highlighter */}
                <ToolButton icon={<HighlighterIcon className="w-5 h-5" />} label="Highlighter" active={activeTool === 'highlighter'} onClick={() => handleToolClick('highlighter')} />
            </div>

            {/* Shape Tools */}
            <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: '#3D4A5D' }}>
                {/* Shapes */}
                <div className="relative">
                    <ToolButton icon={<ShapesIcon className="w-5 h-5" />} label="Shapes" active={showShapes} onClick={() => { closeAllMenus(); setShowShapes(!showShapes); }} />
                    {showShapes && (
                        <div className="absolute top-12 left-0 p-4 rounded-lg shadow-xl z-50" style={{ backgroundColor: navySecondary, border: '1px solid #3D4A5D', width: 200 }}>
                            <div className="mb-3">
                                <label className="text-xs font-medium mb-1 block" style={{ color: creamSecondary }}>Shape Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_COLORS.map(color => (<button key={color} onClick={() => { setShapeColor(color); canvasRef.current?.setShapeColor(color); }} className={`w-6 h-6 rounded-full border-2 transition-transform ${shapeColor === color ? 'scale-125' : ''}`} style={{ backgroundColor: color, borderColor: shapeColor === color ? creamPrimary : '#3D4A5D' }} />))}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {SHAPES.map(shape => (
                                    <button key={shape.type} onClick={() => handleAddShape(shape.type)} className="w-10 h-10 rounded flex items-center justify-center text-lg hover:opacity-80 transition-opacity" style={{ backgroundColor: navyPrimary, color: creamPrimary }} title={shape.label}>
                                        {shape.icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Note */}
                <div className="relative">
                    <ToolButton icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8l6-6V5c0-1.1-.9-2-2-2zm-7 15v-5h5l-5 5z" /></svg>} label="Sticky Note" active={showStickyColors} onClick={() => { closeAllMenus(); setShowStickyColors(!showStickyColors); }} />
                    {showStickyColors && (
                        <div className="absolute top-12 left-0 p-3 rounded-lg shadow-xl z-50" style={{ backgroundColor: navySecondary, border: '1px solid #3D4A5D' }}>
                            <label className="text-xs font-medium mb-2 block" style={{ color: creamSecondary }}>Pick a color</label>
                            <div className="grid grid-cols-3 gap-2">
                                {STICKY_COLORS.map(({ name, color, label }) => (<button key={name} onClick={() => handleAddStickyNote(name)} title={label} className="w-10 h-10 rounded-lg shadow-md hover:scale-110 transition-transform" style={{ backgroundColor: color }} />))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Connection Tool */}
                <div className="relative">
                    <ToolButton icon={<LinkIcon className="w-5 h-5" />} label="Connect" active={activeTool === 'connect'} onClick={() => { handleToolClick('connect'); setShowConnectionColors(true); }} />
                    {showConnectionColors && activeTool === 'connect' && (
                        <div className="absolute top-12 left-0 p-3 rounded-lg shadow-xl z-50" style={{ backgroundColor: navySecondary, border: '1px solid #3D4A5D', minWidth: 140 }}>
                            <label className="text-xs font-medium mb-2 block" style={{ color: creamSecondary }}>Pin Color</label>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map(color => (<button key={color} onClick={() => { setConnectionColor(color); canvasRef.current?.setBrushColor(color); }} className={`w-7 h-7 rounded-full border-2 transition-transform ${connectionColor === color ? 'scale-125' : ''}`} style={{ backgroundColor: color, borderColor: connectionColor === color ? creamPrimary : '#3D4A5D' }} />))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Comment Tool */}
                <ToolButton icon={<ChatBubbleLeftEllipsisIcon className="w-5 h-5" />} label="Comment" active={activeTool === 'comment'} onClick={() => handleToolClick('comment')} />
            </div>

            {/* Insert Tools */}
            <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: '#3D4A5D' }}>
                <ToolButton icon={<PhotoIcon className="w-5 h-5" />} label="Insert Image" onClick={() => imageInputRef.current?.click()} />
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <ToolButton icon={<FolderIcon className="w-5 h-5" />} label="Files & Mockups" onClick={() => onOpenFilePicker?.()} />
            </div>

            {/* History & Delete */}
            <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: '#3D4A5D' }}>
                <ToolButton icon={<ArrowUturnLeftIcon className="w-5 h-5" />} label="Undo" onClick={() => canvasRef.current?.undo()} />
                <ToolButton icon={<ArrowUturnRightIcon className="w-5 h-5" />} label="Redo" onClick={() => canvasRef.current?.redo()} />
                <ToolButton icon={<TrashIcon className="w-5 h-5" />} label="Delete (Del)" onClick={() => canvasRef.current?.deleteSelected()} />
            </div>

            {/* Pan Controls */}
            <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: '#3D4A5D' }}>
                <button onClick={() => handlePan('up')} title="Pan Up" className="w-8 h-8 rounded flex items-center justify-center hover:opacity-80" style={{ backgroundColor: `${navyPrimary}80`, color: creamSecondary }}><ChevronUpIcon className="w-4 h-4" /></button>
                <button onClick={() => handlePan('down')} title="Pan Down" className="w-8 h-8 rounded flex items-center justify-center hover:opacity-80" style={{ backgroundColor: `${navyPrimary}80`, color: creamSecondary }}><ChevronDownIcon className="w-4 h-4" /></button>
                <button onClick={() => handlePan('left')} title="Pan Left" className="w-8 h-8 rounded flex items-center justify-center hover:opacity-80 rotate-[-90deg]" style={{ backgroundColor: `${navyPrimary}80`, color: creamSecondary }}><ChevronUpIcon className="w-4 h-4" /></button>
                <button onClick={() => handlePan('right')} title="Pan Right" className="w-8 h-8 rounded flex items-center justify-center hover:opacity-80 rotate-90" style={{ backgroundColor: `${navyPrimary}80`, color: creamSecondary }}><ChevronUpIcon className="w-4 h-4" /></button>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-2 pr-2 border-r" style={{ borderColor: '#3D4A5D' }}>
                <span className="text-xs" style={{ color: creamSecondary }}>10%</span>
                <input type="range" min="10" max="400" value={Math.round(zoom * 100)} onChange={(e) => handleZoomChange(Number(e.target.value) / 100)} className="w-24 h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, ${creamPrimary} 0%, ${creamPrimary} ${((zoom * 100 - 10) / 390) * 100}%, ${navyPrimary} ${((zoom * 100 - 10) / 390) * 100}%, ${navyPrimary} 100%)` }} title={`Zoom: ${Math.round(zoom * 100)}%`} />
                <span className="text-xs min-w-[40px]" style={{ color: creamSecondary }}>{Math.round(zoom * 100)}%</span>
                <ToolButton icon={<ArrowsPointingOutIcon className="w-5 h-5" />} label="Reset (100%)" onClick={handleResetView} />
            </div>

            {/* Export & Save */}
            <div className="flex items-center gap-1">
                <ToolButton icon={<ArrowDownTrayIcon className="w-5 h-5" />} label="Export PNG" onClick={handleExportPNG} />
                {onSave && (<button onClick={onSave} className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-90" style={{ backgroundColor: creamPrimary, color: navyPrimary }}>Save</button>)}
            </div>
        </div>
    );
}
