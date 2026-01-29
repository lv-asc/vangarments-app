import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Undo,
    Redo,
    Download,
    X,
    ZoomIn,
    ZoomOut,
    Hand,
    Eraser,
    Brush,
    Sparkles,
    MousePointer2,
    Sun,
    Moon,
    Wand2,
    LassoSelect
} from 'lucide-react';

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
    const [sampleCanvas, setSampleCanvas] = useState<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(30);
    const [brushMode, setBrushMode] = useState<'restore' | 'erase'>('restore');
    const [activeTool, setActiveTool] = useState<'brush' | 'pan' | 'rect' | 'wand' | 'lasso'>('brush');
    const [magicMode, setMagicMode] = useState(false);
    const [lassoPoints, setLassoPoints] = useState<{ x: number, y: number }[]>([]);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [screenMousePos, setScreenMousePos] = useState({ x: 0, y: 0 }); // For visual cursor
    const [showCursor, setShowCursor] = useState(false);
    const [bgMode, setBgMode] = useState<'light' | 'dark'>('dark');
    const [magicReference, setMagicReference] = useState<{ r: number, g: number, b: number } | null>(null);
    const [magicThreshold, setMagicThreshold] = useState(45);
    const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);

    // History Stack
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const addToHistory = useCallback(() => {
        if (!context || !canvasRef.current) return;
        const ctx = context;
        // Limit history size to 20 states to save memory
        const newState = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);

        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            if (newHistory.length >= 20) newHistory.shift();
            return [...newHistory, newState];
        });
        setHistoryIndex(prev => (prev >= 19 ? 19 : prev + 1));
    }, [context, historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0 && context) {
            const prevState = history[historyIndex - 1];
            context.putImageData(prevState, 0, 0);
            setHistoryIndex(prev => prev - 1);
        }
    }, [history, historyIndex, context]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1 && context) {
            const nextState = history[historyIndex + 1];
            context.putImageData(nextState, 0, 0);
            setHistoryIndex(prev => prev + 1);
        }
    }, [history, historyIndex, context]);

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

                // Create cache for magic brush
                const sc = document.createElement('canvas');
                sc.width = imgOriginal.width;
                sc.height = imgOriginal.height;
                const sctx = sc.getContext('2d', { willReadFrequently: true });
                if (sctx) {
                    sctx.drawImage(imgOriginal, 0, 0);
                    setSampleCanvas(sc);
                }
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

        // Save initial state to history
        const initialState = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
        setHistory([initialState]);
        setHistoryIndex(0);

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

        if (magicMode && sampleCanvas) {
            // MAGIC MODE: Smart Edge aware brush
            // 1. Create a temporary canvas for original image sampling if not exists
            const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
            if (!sCtx) return;

            // 2. Get the color at current pixel as reference
            // FIX: Use the LOCKED reference color (captured on mousedown) instead of current pixel
            let refR, refG, refB;

            if (magicReference) {
                refR = magicReference.r;
                refG = magicReference.g;
                refB = magicReference.b;
            } else {
                // Fallback (shouldn't happen if logic is correct)
                const referenceData = sCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
                refR = referenceData[0];
                refG = referenceData[1];
                refB = referenceData[2];
            }

            // 3. Sample the local area under the brush
            const radius = Math.floor(brushSize / 2);
            const startX = Math.floor(x - radius);
            const startY = Math.floor(y - radius);
            const size = Math.floor(brushSize);

            // Constrain to image bounds
            const finalStartX = Math.max(0, startX);
            const finalStartY = Math.max(0, startY);
            const finalSize = Math.min(size, originalImage.width - finalStartX, originalImage.height - finalStartY);

            if (finalSize <= 0) return;

            const localData = sCtx.getImageData(finalStartX, finalStartY, finalSize, finalSize);
            const pixels = localData.data;

            // 4. Create a mask based on similarity
            const threshold = magicThreshold; // Similarity threshold controlled by user
            for (let i = 0; i < pixels.length; i += 4) {
                const px = finalStartX + ((i / 4) % finalSize);
                const py = finalStartY + Math.floor((i / 4) / finalSize);

                const dx = px - x;
                const dy = py - y;
                const distSq = dx * dx + dy * dy;

                if (distSq <= radius * radius) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];

                    // Color distance
                    const diff = Math.sqrt(
                        Math.pow(r - refR, 2) +
                        Math.pow(g - refG, 2) +
                        Math.pow(b - refB, 2)
                    );

                    // If pixel is similar, keep it. If not, make it transparent in our local mask
                    // We reuse the localData array to be the mask. 
                    // Alpha 255 = paint, Alpha 0 = skip
                    if (diff < threshold) {
                        pixels[i + 3] = 255;
                    } else {
                        pixels[i + 3] = 0;
                    }
                } else {
                    pixels[i + 3] = 0;
                }
            }

            // 5. Apply the smart mask to the main canvas
            // Use a temporary canvas to stamp the mask
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = finalSize;
            maskCanvas.height = finalSize;
            const mCtx = maskCanvas.getContext('2d');
            if (mCtx) {
                mCtx.putImageData(localData, 0, 0);

                ctx.save();
                if (brushMode === 'restore') {
                    // Restore: Paint original image masked by our similarity mask
                    // Switch to source-over to correctly overwrite any ghosting/residue
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.drawImage(maskCanvas, finalStartX, finalStartY);
                } else {
                    // Erase: Use the mask to clear
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.drawImage(maskCanvas, finalStartX, finalStartY);
                }
                ctx.restore();
            }
        } else {
            // Standard Binary Brush
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
            ctx.clip();

            if (brushMode === 'restore') {
                // Use source-over to correctly restore sharp pixels over ghosting
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(originalImage, 0, 0, canvasRef.current.width, canvasRef.current.height);
            } else {
                ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fill();
            }
            ctx.restore();
        }
    }, [context, originalImage, brushSize, brushMode, magicMode, magicReference, sampleCanvas]);

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

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
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

        if (activeTool === 'rect') {
            setSelectionStart({ x, y });
            setSelectionRect({ x, y, w: 0, h: 0 });
            return;
        }

        // Capture Magic Reference Color on MOUSE DOWN (3x3 average)
        if (magicMode && sampleCanvas) {
            const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
            if (sCtx) {
                // Safety bounds for 3x3
                const sx = Math.max(1, Math.min(originalImage?.width || 0, Math.floor(x)) - 1);
                const sy = Math.max(1, Math.min(originalImage?.height || 0, Math.floor(y)) - 1);
                const imgData = sCtx.getImageData(sx, sy, 3, 3).data;
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < imgData.length; i += 4) {
                    r += imgData[i];
                    g += imgData[i + 1];
                    b += imgData[i + 2];
                    count++;
                }
                setMagicReference({ r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) });
            }
        }

        if (activeTool === 'wand') {
            applyFloodFill(x, y);
            return;
        }

        if (activeTool === 'lasso') {
            // Check if clicking near the first point to close
            if (lassoPoints.length > 2) {
                const first = lassoPoints[0];
                const dist = Math.sqrt(Math.pow(x - first.x, 2) + Math.pow(y - first.y, 2));
                if (dist < 10 / scale) {
                    applyLassoAction();
                    return;
                }
            }
            setLassoPoints(prev => [...prev, { x, y }]);
            return;
        }

        draw(x, y);
    };

    const moveDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCanvasCoordinates(e);

        // Always update cursor position for UI, even if panning
        setShowCursor(true);

        if (isDragging) {
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
            setOffset({
                x: clientX - dragStart.x,
                y: clientY - dragStart.y
            });
            return;
        }

        if (isDrawing) {
            if (activeTool === 'rect' && selectionStart) {
                const newRect = {
                    x: Math.min(selectionStart.x, x),
                    y: Math.min(selectionStart.y, y),
                    w: Math.abs(x - selectionStart.x),
                    h: Math.abs(y - selectionStart.y)
                };
                setSelectionRect(newRect);
            } else {
                draw(x, y);
            }
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            if (activeTool === 'rect' && selectionRect && context && originalImage) {
                applyRectAction();
            }
            addToHistory(); // Save state after stroke
        }
        setIsDrawing(false);
        setIsDragging(false);
        setMagicReference(null); // Reset magic reference
        setSelectionRect(null);
        setSelectionStart(null);
    };

    const applyFloodFill = (startX: number, startY: number) => {
        if (!context || !sampleCanvas || !originalImage || !canvasRef.current) return;
        const ctx = context;
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;

        const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
        if (!sCtx) return;

        const imgData = sCtx.getImageData(0, 0, width, height);
        const pixels = imgData.data;

        // Get target color
        const targetIdx = (Math.floor(startY) * width + Math.floor(startX)) * 4;
        const targetR = pixels[targetIdx];
        const targetG = pixels[targetIdx + 1];
        const targetB = pixels[targetIdx + 2];

        const visited = new Uint8Array(width * height);
        const stack: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];

        // Create an offscreen mask buffer
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const mCtx = maskCanvas.getContext('2d');
        if (!mCtx) return;
        const mData = mCtx.createImageData(width, height);

        while (stack.length > 0) {
            const [x, y] = stack.pop()!;
            const idx = (y * width + x);

            if (x < 0 || x >= width || y < 0 || y >= height || visited[idx]) continue;

            const pIdx = idx * 4;
            const dr = pixels[pIdx] - targetR;
            const dg = pixels[pIdx + 1] - targetG;
            const db = pixels[pIdx + 2] - targetB;
            const dist = Math.sqrt(dr * dr + dg * dg + db * db);

            if (dist <= magicThreshold) {
                visited[idx] = 1;
                mData.data[pIdx + 3] = 255; // Solid in mask

                stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
        }

        mCtx.putImageData(mData, 0, 0);

        ctx.save();
        if (brushMode === 'restore') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tCtx = tempCanvas.getContext('2d');
            if (tCtx) {
                tCtx.drawImage(originalImage, 0, 0, width, height);
                tCtx.globalCompositeOperation = 'destination-in';
                tCtx.drawImage(maskCanvas, 0, 0);

                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(tempCanvas, 0, 0);
            }
        } else {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.drawImage(maskCanvas, 0, 0);
        }
        ctx.restore();
        addToHistory();
    };

    const applyLassoAction = () => {
        if (!context || lassoPoints.length < 3 || !originalImage || !canvasRef.current) return;
        const ctx = context;
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
        lassoPoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.clip();

        if (brushMode === 'restore') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(originalImage, 0, 0, width, height);
        } else {
            ctx.clearRect(0, 0, width, height);
        }
        ctx.restore();
        setLassoPoints([]);
        addToHistory();
    };


    const applyRectAction = () => {
        if (!context || !selectionRect || !originalImage) return;
        const ctx = context;
        const { x, y, w, h } = selectionRect;

        ctx.save();
        if (brushMode === 'restore') {
            // Use source-over to correctly restore sharp pixels over ghosting
            ctx.globalCompositeOperation = 'source-over';

            // Handle case where original and processed images might have different resolutions
            const scaleX = originalImage.width / (canvasRef.current?.width || 1);
            const scaleY = originalImage.height / (canvasRef.current?.height || 1);

            ctx.drawImage(
                originalImage,
                x * scaleX, y * scaleY, w * scaleX, h * scaleY,
                x, y, w, h
            );
        } else {
            ctx.clearRect(x, y, w, h);
        }
        ctx.restore();
    };



    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();

        if (e.ctrlKey || e.metaKey) {
            // Zoom with Ctrl/Cmd + Scroll
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            const newScale = Math.max(0.1, Math.min(4, scale + delta));

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
        } else {
            // Pan by default on Scroll
            setOffset(prev => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    };

    // Keyboard Shortcuts & Global Mouse Events
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                e.preventDefault();
            }
        };

        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isDrawing || isDragging) {
                // Since moveDrawing uses getCanvasCoordinates which depends on canvasRef/rect,
                // calling it with e as any (MouseEvent) works because getCanvasCoordinates 
                // extracts clientX/Y which are present in both React.MouseEvent and MouseEvent.
                setScreenMousePos({ x: e.clientX, y: e.clientY });
                moveDrawing(e as any);
            }
        };

        const handleGlobalMouseUp = () => {
            if (isDrawing || isDragging) {
                stopDrawing();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        if (isDrawing || isDragging) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [undo, redo, isDrawing, isDragging, moveDrawing, stopDrawing]);

    const handleMouseMove = (e: React.MouseEvent) => {
        setScreenMousePos({ x: e.clientX, y: e.clientY });
        moveDrawing(e);
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

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8"
                >
                    <div className="relative w-full h-full flex flex-col bg-[#111] rounded-3xl overflow-hidden shadow-2xl border border-white/10">

                        {/* Premium Floating Toolbar */}
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            style={{ left: '50%', x: '-50%' }}
                            className="absolute top-6 z-50 flex items-center gap-2 p-1.5 bg-zinc-900/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                        >
                            {/* Main Mode Toggle */}
                            <div className="flex bg-black/20 p-1 rounded-xl">
                                <ToolButton
                                    active={activeTool === 'brush' && brushMode === 'restore'}
                                    onClick={() => { setActiveTool('brush'); setBrushMode('restore'); }}
                                    icon={<Brush className="w-4 h-4" />}
                                    label="Restore Brush"
                                    description="Paint back missing parts of the garment"
                                    color="indigo"
                                />
                                <ToolButton
                                    active={activeTool === 'brush' && brushMode === 'erase'}
                                    onClick={() => { setActiveTool('brush'); setBrushMode('erase'); }}
                                    icon={<Eraser className="w-4 h-4" />}
                                    label="Erase Brush"
                                    description="Remove background residue or unwanted edges"
                                    color="red"
                                />
                                <ToolButton
                                    active={activeTool === 'wand'}
                                    onClick={() => setActiveTool('wand')}
                                    icon={<Wand2 className="w-4 h-4" />}
                                    label="Magic Wand"
                                    description="Click to auto-restore/erase matching color areas"
                                    color="purple"
                                />
                                <ToolButton
                                    active={activeTool === 'lasso'}
                                    onClick={() => setActiveTool('lasso')}
                                    icon={<LassoSelect className="w-4 h-4" />}
                                    label="Polygonal Lasso"
                                    description="Click points to define area. Close loop to apply."
                                    color="indigo"
                                />
                                <ToolButton
                                    active={activeTool === 'rect'}
                                    onClick={() => setActiveTool('rect')}
                                    icon={<MousePointer2 className="w-4 h-4" />}
                                    label="Area Selection"
                                    description="Click and drag to restore or erase large boxes"
                                    color="purple"
                                />
                                <ToolButton
                                    active={activeTool === 'pan'}
                                    onClick={() => setActiveTool('pan')}
                                    icon={<Hand className="w-4 h-4" />}
                                    label="Pan Tool"
                                    description="Move the image around (Space/Alt + Drag)"
                                    color="amber"
                                />
                            </div>

                            <div className="h-6 w-px bg-white/10 mx-2" />

                            {/* Magic Toggle with Animation */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setMagicMode(!magicMode)}
                                title="Magic Mode: Automatically snaps to edges based on color similarity"
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${magicMode
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <Sparkles className={`w-4 h-4 ${magicMode ? 'animate-pulse' : ''}`} />
                                <span className="hidden sm:inline">Magic</span>
                            </motion.button>

                            {/* Settings Popovers / Quick Controls */}
                            <div className="flex items-center gap-3 px-4 py-2 border-l border-white/10 ml-2">
                                <div className="flex flex-col gap-1 items-center group relative">
                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">Size</span>
                                    <input
                                        type="range"
                                        min="5"
                                        max="100"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        className="w-20 accent-indigo-400 h-1 cursor-pointer"
                                    />
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60]">
                                        Brush thickness
                                    </div>
                                </div>
                                {magicMode && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col gap-1 items-center group relative"
                                    >
                                        <span className="text-[8px] font-black text-purple-400/60 uppercase tracking-widest leading-none">Sensitivity</span>
                                        <input
                                            type="range"
                                            min="5"
                                            max="150"
                                            value={magicThreshold}
                                            onChange={(e) => setMagicThreshold(Number(e.target.value))}
                                            className="w-20 accent-purple-400 h-1 cursor-pointer"
                                        />
                                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60] text-center">
                                            Edge detection range<br />(Higher = more aggressive)
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* History Controls */}
                            <div className="flex gap-1 border-l border-white/10 pl-2">
                                <ToolButton
                                    disabled={historyIndex <= 0}
                                    onClick={undo}
                                    icon={<Undo className="w-4 h-4" />}
                                    label="Undo"
                                    description="Revert last action (Cmd+Z)"
                                />
                                <ToolButton
                                    disabled={historyIndex >= history.length - 1}
                                    onClick={redo}
                                    icon={<Redo className="w-4 h-4" />}
                                    label="Redo"
                                    description="Repeat reverted action (Cmd+Shift+Z)"
                                />
                            </div>

                            <div className="h-6 w-px bg-white/10 mx-2" />

                            {/* Background & View Controls */}
                            <div className="flex bg-white/5 rounded-xl p-0.5">
                                <BgToggleButton active={bgMode === 'light'} onClick={() => setBgMode('light')} icon={<Sun className="w-3.5 h-3.5" />} label="Light Mode" />
                                <BgToggleButton active={bgMode === 'dark'} onClick={() => setBgMode('dark')} icon={<Moon className="w-3.5 h-3.5" />} label="Dark Mode" />
                            </div>

                            {/* Save/Cancel Group */}
                            <div className="flex items-center gap-2 ml-4 border-l border-white/10 pl-4">
                                <button
                                    onClick={onCancel}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                    title="Cancel"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    title="Save Changes: Applies your refinements and saves the item"
                                    className="bg-white text-black px-5 py-2 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-indigo-50 transition-all disabled:opacity-50 shadow-xl"
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    <span className="hidden md:inline">Save</span>
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Floating Zoom Controls (Bottom Right) */}
                        <div className="absolute bottom-10 right-10 z-50 flex items-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-1.5 shadow-2xl">
                            <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-2 text-white/60 hover:text-white transition-colors"><ZoomOut className="w-4 h-4" /></button>
                            <div className="px-3 border-x border-white/10" onClick={() => setScale(1)}>
                                <span className="text-[10px] font-black text-white/80 tabular-nums">{Math.round(scale * 100)}%</span>
                            </div>
                            <button onClick={() => setScale(s => Math.min(5, s + 0.1))} className="p-2 text-white/60 hover:text-white transition-colors"><ZoomIn className="w-4 h-4" /></button>
                        </div>

                        {/* Canvas Area */}
                        <div
                            ref={containerRef}
                            className={`flex-1 overflow-hidden relative touch-none ${activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-none'
                                } ${bgMode === 'light' ? 'bg-[#e5e5f7]' : 'bg-gray-950'
                                }`}
                            style={{
                                backgroundImage:
                                    bgMode === 'dark'
                                        ? 'radial-gradient(#444 0.5px, transparent 0.5px), radial-gradient(#444 0.5px, #050505 0.5px)'
                                        : 'radial-gradient(#444cf7 0.5px, transparent 0.5px), radial-gradient(#444cf7 0.5px, #e5e5f7 0.5px)',
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 10px 10px',
                            }}
                            onMouseDown={startDrawing}
                            onMouseMove={handleMouseMove}
                            onMouseUp={stopDrawing}
                            onMouseLeave={() => { stopDrawing(); setShowCursor(false); }}
                            onMouseEnter={() => setShowCursor(true)}
                            onWheel={handleWheel}
                            onTouchStart={startDrawing}
                            onTouchMove={moveDrawing}
                            onTouchEnd={stopDrawing}
                        >
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                                </div>
                            )}

                            <div
                                className="absolute left-1/2 top-1/2 origin-center"
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
                                {/* Area Selection Preview */}
                                {selectionRect && (
                                    <div
                                        className={`absolute z-20 border-2 pointer-events-none ${brushMode === 'restore' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                                            }`}
                                        style={{
                                            left: selectionRect.x,
                                            top: selectionRect.y,
                                            width: selectionRect.w,
                                            height: selectionRect.h
                                        }}
                                    />
                                )}

                                {/* Lasso Preview */}
                                {lassoPoints.length > 0 && (
                                    <svg className="absolute inset-0 z-20 pointer-events-none w-full h-full overflow-visible">
                                        <polyline
                                            points={lassoPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                            fill="none"
                                            stroke={brushMode === 'restore' ? '#22c55e' : '#ef4444'}
                                            strokeWidth={2 / scale}
                                            strokeDasharray="4"
                                        />
                                        {/* Current vertex to mouse preview */}
                                        <line
                                            x1={lassoPoints[lassoPoints.length - 1].x}
                                            y1={lassoPoints[lassoPoints.length - 1].y}
                                            x2={getCanvasCoordinates({ clientX: screenMousePos.x, clientY: screenMousePos.y } as any).x}
                                            y2={getCanvasCoordinates({ clientX: screenMousePos.x, clientY: screenMousePos.y } as any).y}
                                            stroke={brushMode === 'restore' ? '#22c55e' : '#ef4444'}
                                            strokeWidth={1 / scale}
                                            strokeDasharray="2"
                                            opacity={showCursor ? 0.6 : 0}
                                        />
                                    </svg>
                                )}
                            </div>

                            {/* Dynamic Brush Cursor */}
                            {showCursor && (activeTool === 'brush' || activeTool === 'rect' || activeTool === 'wand' || activeTool === 'lasso') && (
                                <div
                                    className={`fixed pointer-events-none z-50 ${activeTool === 'brush' ? 'rounded-full' : ''
                                        } border-2 ${brushMode === 'restore' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                                        }`}
                                    style={{
                                        width: activeTool === 'brush' ? brushSize * scale : 20,
                                        height: activeTool === 'brush' ? brushSize * scale : 20,
                                        left: screenMousePos.x - (activeTool === 'brush' ? (brushSize * scale) / 2 : 10),
                                        top: screenMousePos.y - (activeTool === 'brush' ? (brushSize * scale) / 2 : 10),
                                        transition: activeTool === 'brush' ? 'width 0.1s, height 0.1s' : 'none',
                                    }}
                                >
                                    {(activeTool === 'rect' || activeTool === 'wand' || activeTool === 'lasso') && (
                                        <>
                                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-purple-500" />
                                            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-purple-500" />
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="absolute bottom-6 left-6 z-50 p-3 bg-black/40 backdrop-blur-md rounded-xl text-[10px] font-bold text-white/50 tracking-widest uppercase pointer-events-none border border-white/5">
                                Scroll to Pan • Cmd/Ctrl + Scroll to Zoom
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Helper Components for the Premium UI
function ToolButton({ active, onClick, icon, label, description, color = 'indigo', disabled = false }: any) {
    const colors: any = {
        indigo: 'text-indigo-400 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]',
        red: 'text-red-400 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
        purple: 'text-purple-400 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
        amber: 'text-amber-400 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
    };

    return (
        <div className="relative group/tool">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClick}
                disabled={disabled}
                className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${active ? colors[color] : 'text-gray-400 hover:text-white hover:bg-white/5'
                    } disabled:opacity-20`}
            >
                {icon}
            </motion.button>
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover/tool:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60] border border-white/10 shadow-xl">
                <span className="font-bold block text-indigo-400 mb-0.5">{label}</span>
                <span className="text-white/60">{description}</span>
            </div>
        </div>
    );
}

function BgToggleButton({ active, onClick, icon, label, color = 'white' }: any) {
    const activeStyles: any = {
        white: 'bg-white text-black shadow-lg',
    };

    return (
        <div className="relative group/bg">
            <button
                onClick={onClick}
                className={`p-2 rounded-lg transition-all ${active ? activeStyles[color] : 'text-gray-400 hover:text-white'}`}
            >
                {icon}
            </button>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bg:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60] border border-white/10 shadow-xl">
                {label}
            </div>
        </div>
    );
}
