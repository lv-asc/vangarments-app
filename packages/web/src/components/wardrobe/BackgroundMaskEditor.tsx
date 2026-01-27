import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import {
    ArrowUturnLeftIcon,
    ArrowDownTrayIcon,
    XMarkIcon,
    MagnifyingGlassPlusIcon,
    MagnifyingGlassMinusIcon,
    HandRaisedIcon
} from '@heroicons/react/24/outline';

interface BackgroundMaskEditorProps {
    originalImageUrl: string;
    processedImageUrl: string;
    onSave: (blob: Blob) => Promise<void>;
    onCancel: () => void;
    isOpen: boolean;
}

export default function BackgroundMaskEditor({
    originalImageUrl,
    processedImageUrl,
    onSave,
    onCancel,
    isOpen
}: BackgroundMaskEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(20);
    const [brushMode, setBrushMode] = useState<'restore' | 'erase'>('restore');
    const [activeTool, setActiveTool] = useState<'brush' | 'pan'>('brush');
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [showCursor, setShowCursor] = useState(false);
    const [bgMode, setBgMode] = useState<'light' | 'dark' | 'green'>('light');
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize Canvas and Load Images
    useEffect(() => {
        if (!isOpen) return;

        const imgOriginal = new Image();
        imgOriginal.crossOrigin = "anonymous";
        const imgProcessed = new Image();
        imgProcessed.crossOrigin = "anonymous";

        let loadedCount = 0;
        const checkLoaded = () => {
            loadedCount++;
            if (loadedCount === 2) {
                setOriginalImage(imgOriginal);
                initCanvas(imgProcessed);
                setLoading(false);
            }
        };

        imgOriginal.onload = checkLoaded;
        imgProcessed.onload = checkLoaded;
        imgOriginal.onerror = () => setLoading(false); // Handle error appropriately
        imgProcessed.onerror = () => setLoading(false);

        imgOriginal.src = originalImageUrl;
        imgProcessed.src = processedImageUrl;
    }, [isOpen, originalImageUrl, processedImageUrl]);

    const initCanvas = (img: HTMLImageElement) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas size to match image resolution
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Draw initial processed image
        ctx.drawImage(img, 0, 0);
        setContext(ctx);

        // Center image in view
        centerImage(img.naturalWidth, img.naturalHeight);
    };

    const centerImage = (w: number, h: number) => {
        // Simple centering logic, can be improved
        const containerW = window.innerWidth * 0.8; // Approx modal width
        const containerH = window.innerHeight * 0.6;
        const scaleW = containerW / w;
        const scaleH = containerH / h;
        const newScale = Math.min(scaleW, scaleH, 1); // Fit to screen, max 1
        setScale(newScale);
        // Center offset? simpler to start at 0,0 and let user pan
    };

    // Drawing Logic
    const draw = useCallback((x: number, y: number) => {
        if (!context || !originalImage || !canvasRef.current) return;

        const ctx = context;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.clip();

        if (brushMode === 'restore') {
            // Restore: Draw original image over the cleared area
            // We use destination-over? No, standard source-over painting original pixels
            // But we need to make sure we are painting opaque pixels from original
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(originalImage, 0, 0);
        } else {
            // Erase: Clear pixels
            ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
            // Alternatively use destination-out for smoother circle erase
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fill();
        }

        ctx.restore();
    }, [context, originalImage, brushSize, brushMode]);

    const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        // Convert client/screen coords to transformed canvas coords
        // The canvas visually is transformed by CSS translate/scale
        // But the mouse event is relative to the viewport

        // We need coordinates relative to the actual canvas bitmap
        // visual_x = (clientX - rect.left)
        // This visual_x is scaled. 
        // real_x = visual_x * (canvas.width / rect.width)

        const x = (clientX - rect.left) * (canvasRef.current.width / rect.width);
        const y = (clientY - rect.top) * (canvasRef.current.height / rect.height);

        return { x, y };
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        // Pan mode: Alt key OR pan tool selected OR two-finger touch
        if (activeTool === 'pan' || e.altKey || ('touches' in e && (e as any).touches.length === 2)) {
            setIsDragging(true);
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
            setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
            return;
        }

        setIsDrawing(true);
        const { x, y } = getCanvasCoordinates(e);
        draw(x, y);
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (isDragging) {
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
            setOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
            return;
        }

        if (isDrawing) {
            const { x, y } = getCanvasCoordinates(e);
            draw(x, y);
        }
    };

    const handlePointerUp = () => {
        setIsDrawing(false);
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.1, Math.min(4, scale + delta));

        // Cursor-centered zoom
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - rect.width / 2;
            const mouseY = e.clientY - rect.top - rect.height / 2;

            const scaleRatio = newScale / scale;
            const newOffsetX = offset.x - mouseX * (scaleRatio - 1);
            const newOffsetY = offset.y - mouseY * (scaleRatio - 1);

            setOffset({ x: newOffsetX, y: newOffsetY });
        }

        setScale(newScale);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
        handlePointerMove(e);
    };

    const handleSave = async () => {
        if (!canvasRef.current) return;
        setIsSaving(true);
        try {
            canvasRef.current.toBlob(async (blob) => {
                if (blob) {
                    await onSave(blob);
                }
            }, 'image/png');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl w-[95vw] h-[90vh] flex flex-col">
                {/* Toolbar */}
                <div className="p-4 border-b flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-lg">Refine Background</h3>
                        <div className="h-6 w-px bg-gray-200" />

                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => { setActiveTool('brush'); setBrushMode('restore'); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTool === 'brush' && brushMode === 'restore' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Restore
                            </button>
                            <button
                                onClick={() => { setActiveTool('brush'); setBrushMode('erase'); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTool === 'brush' && brushMode === 'erase' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Erase
                            </button>
                            <button
                                onClick={() => setActiveTool('pan')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${activeTool === 'pan' ? 'bg-white shadow text-amber-600' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                <HandRaisedIcon className="w-4 h-4" />
                                Pan
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Size</span>
                            <input
                                type="range"
                                min="5"
                                max="100"
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="w-32"
                            />
                        </div>

                        <div className="h-6 w-px bg-gray-200" />

                        {/* Background Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setBgMode('light')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${bgMode === 'light' ? 'bg-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
                                title="Light Background"
                            >
                                ☐ Light
                            </button>
                            <button
                                onClick={() => setBgMode('dark')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${bgMode === 'dark' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
                                title="Dark Background"
                            >
                                ☑ Dark
                            </button>
                            <button
                                onClick={() => setBgMode('green')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${bgMode === 'green' ? 'bg-green-500 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
                                title="Green Screen"
                            >
                                ✓ Green
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mr-4">
                            <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-1 hover:bg-white rounded shadow-sm"><MagnifyingGlassMinusIcon className="w-5 h-5" /></button>
                            <span className="text-xs font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
                            <button onClick={() => setScale(s => Math.min(5, s + 0.1))} className="p-1 hover:bg-white rounded shadow-sm"><MagnifyingGlassPlusIcon className="w-5 h-5" /></button>
                        </div>
                        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div
                    ref={containerRef}
                    className={`flex-1 overflow-hidden relative touch-none ${activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-none'
                        } ${bgMode === 'light' ? 'bg-[#e5e5f7]' :
                            bgMode === 'dark' ? 'bg-gray-900' : 'bg-green-500'
                        }`}
                    style={{
                        backgroundImage: bgMode === 'green' ? 'none' :
                            bgMode === 'dark'
                                ? 'radial-gradient(#555 0.5px, transparent 0.5px), radial-gradient(#555 0.5px, #1a1a1a 0.5px)'
                                : 'radial-gradient(#444cf7 0.5px, transparent 0.5px), radial-gradient(#444cf7 0.5px, #e5e5f7 0.5px)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 10px 10px',
                    }}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={() => { handlePointerUp(); setShowCursor(false); }}
                    onMouseEnter={() => setShowCursor(true)}
                    onWheel={handleWheel}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                >
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                        </div>
                    )}

                    <div
                        className="absolute left-1/2 top-1/2 origin-center transition-transform duration-75 ease-out"
                        style={{
                            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
                            width: 'fit-content',
                            height: 'fit-content'
                        }}
                    >
                        <img
                            src={originalImageUrl}
                            alt="Original Ghost"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            style={{ opacity: 0.4 }}
                        />
                        <canvas
                            ref={canvasRef}
                            className="shadow-2xl relative z-10"
                        />
                    </div>

                    {/* Dynamic Brush Cursor */}
                    {showCursor && activeTool === 'brush' && (
                        <div
                            className={`fixed pointer-events-none z-50 rounded-full border-2 ${brushMode === 'restore' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                                }`}
                            style={{
                                width: brushSize * scale,
                                height: brushSize * scale,
                                left: mousePos.x - (brushSize * scale) / 2,
                                top: mousePos.y - (brushSize * scale) / 2,
                                transition: 'width 0.1s, height 0.1s',
                            }}
                        />
                    )}

                    <div className={`absolute bottom-4 left-4 backdrop-blur px-4 py-2 rounded-lg text-xs font-medium shadow-lg pointer-events-none ${bgMode === 'dark' ? 'bg-black/70 text-gray-300' : 'bg-white/90 text-gray-500'}`}>
                        Alt + Drag to Pan • Scroll to Zoom
                    </div>
                </div>
            </div>
        </div>
    );
}
