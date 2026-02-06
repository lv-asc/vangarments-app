'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as fabric from 'fabric';

export interface OutfitCanvasItem {
    id: string; // The canvas object ID
    itemId: string; // The wardrobe item ID
    imageUrl: string;
    position: { x: number; y: number };
    scale: number;
    rotation: number;
    zIndex: number;
    itemType?: 'vufs' | 'sku';
    // Rich Metadata
    name?: string;
    brand?: string;
    size?: string;
    category?: string;
}

export interface OutfitCanvasRef {
    canvas: fabric.Canvas | null;
    addItem: (item: {
        id: string;
        imageUrl: string;
        itemType?: 'vufs' | 'sku';
        name?: string;
        brand?: string;
        size?: string;
        category?: string;
    }) => void;
    deleteSelected: () => void;
    clear: () => void;
    getItems: () => OutfitCanvasItem[];
    loadItems: (items: OutfitCanvasItem[]) => void;
    exportToPNG: () => string | null;
    bringForward: (id: string) => void;
    sendBackward: (id: string) => void;
    bringToFront: (id: string) => void;
    sendToBack: (id: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

interface OutfitCanvasProps {
    width?: number;
    height?: number;
    backgroundColor?: string;
    onModified?: () => void;
    onSelectionChange?: (selected: boolean) => void;
}

// Custom Delete Control
const deleteIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 100 100' enable-background='new 0 0 100 100' xml:space='preserve'%3E%3Cg%3E%3Cpath fill='%23d93025' d='M20,25h60v5H20V25z M25,35h50v50H25V35z M35,15h30v5H35V15z M45,40h10v35H45V40z'/%3E%3C/g%3E%3C/svg%3E";

const renderDeleteIcon = (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: fabric.Object) => {
    const size = 24;
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle || 0));

    // Draw background circle
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#d93025';
    ctx.stroke();

    // Draw X
    const xSize = 8;
    ctx.beginPath();
    ctx.moveTo(-xSize / 2, -xSize / 2);
    ctx.lineTo(xSize / 2, xSize / 2);
    ctx.moveTo(xSize / 2, -xSize / 2);
    ctx.lineTo(-xSize / 2, xSize / 2);
    ctx.strokeStyle = '#d93025';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
};

const deleteObject = (eventData: MouseEvent | TouchEvent | PointerEvent, transform: fabric.Transform) => {
    const target = transform.target;
    const canvas = target.canvas;
    if (canvas) {
        canvas.remove(target);
        canvas.requestRenderAll();
        // Since we don't have direct access to onModified from here easily without closure, 
        // we rely on the object:removed or other events if needed, but for now this works visually.
        // Ideally pass a callback or dispatch a custom event.
    }
    return true;
};

const OutfitCanvas = forwardRef<OutfitCanvasRef, OutfitCanvasProps>(({
    width = 800,
    height = 600,
    backgroundColor = '#f8fafc', // Slate-50
    onModified,
    onSelectionChange
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const onModifiedRef = useRef(onModified);
    const onSelectionChangeRef = useRef(onSelectionChange);
    const containerRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<any[]>([]);
    const redoStackRef = useRef<any[]>([]);
    const isRestoringRef = useRef(false);

    const saveState = useCallback(() => {
        if (!fabricRef.current || isRestoringRef.current) return;

        const state = fabricRef.current.toObject([
            'id', 'itemId', 'itemType', 'metaName', 'metaBrand', 'metaSize', 'metaCategory'
        ]);

        historyRef.current.push(JSON.stringify(state));
        if (historyRef.current.length > 50) {
            historyRef.current.shift();
        }
        redoStackRef.current = [];
        onModifiedRef.current?.();
    }, []);

    const undo = useCallback(async () => {
        if (!fabricRef.current || historyRef.current.length <= 1) return;

        const currentState = historyRef.current.pop();
        if (currentState) redoStackRef.current.push(currentState);

        const prevState = historyRef.current[historyRef.current.length - 1];
        if (prevState) {
            isRestoringRef.current = true;
            await fabricRef.current.loadFromJSON(JSON.parse(prevState));
            fabricRef.current.renderAll();
            isRestoringRef.current = false;
            onModifiedRef.current?.();
        }
    }, []);

    const redo = useCallback(async () => {
        if (!fabricRef.current || redoStackRef.current.length === 0) return;

        const nextState = redoStackRef.current.pop();
        if (nextState) {
            isRestoringRef.current = true;
            historyRef.current.push(nextState);
            await fabricRef.current.loadFromJSON(JSON.parse(nextState));
            fabricRef.current.renderAll();
            isRestoringRef.current = false;
            onModifiedRef.current?.();
        }
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdKey = isMac ? e.metaKey : e.ctrlKey;

            if (cmdKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    // Update refs when props change
    useEffect(() => {
        onModifiedRef.current = onModified;
    }, [onModified]);

    useEffect(() => {
        onSelectionChangeRef.current = onSelectionChange;
    }, [onSelectionChange]);

    // Initialize canvas
    useEffect(() => {
        if (!canvasRef.current || fabricRef.current) return;

        console.log('Initializing Fabric canvas');
        const canvas = new fabric.Canvas(canvasRef.current, {
            width,
            height,
            backgroundColor,
            selection: true,
            preserveObjectStacking: true
        });

        fabricRef.current = canvas;

        // Initialize history
        const initialState = canvas.toObject([
            'id', 'itemId', 'itemType', 'metaName', 'metaBrand', 'metaSize', 'metaCategory'
        ]);
        historyRef.current = [JSON.stringify(initialState)];

        // Customize controls globally
        const defaultsTarget = fabric.FabricObject ? fabric.FabricObject.prototype : fabric.Object.prototype;
        defaultsTarget.transparentCorners = false;
        defaultsTarget.cornerColor = 'white';
        defaultsTarget.cornerStrokeColor = '#00132d';
        defaultsTarget.borderColor = '#00132d';
        defaultsTarget.cornerSize = 10;

        // Define delete control
        // @ts-ignore - Fabric types might be strictly typed, extending standard controls
        const targetPrototype = fabric.FabricObject ? fabric.FabricObject.prototype : fabric.Object.prototype;

        if (targetPrototype.controls) {
            targetPrototype.controls.deleteControl = new fabric.Control({
                x: 0.5,
                y: -0.5,
                offsetY: -16,
                offsetX: 16,
                cursorStyle: 'pointer',
                mouseUpHandler: deleteObject,
                render: renderDeleteIcon
            });
        } else {
            console.warn('Could not attach delete control: controls object missing on prototype');
        }

        // Event handlers
        canvas.on('object:modified', () => {
            saveState();
        });

        canvas.on('object:added', (e) => {
            // Only save if it's not a restoration
            if (!isRestoringRef.current) {
                saveState();
            }
        });

        canvas.on('object:removed', () => {
            if (!isRestoringRef.current) {
                saveState();
            }
        });


        canvas.on('selection:created', () => onSelectionChangeRef.current?.(true));
        canvas.on('selection:updated', () => onSelectionChangeRef.current?.(true));
        canvas.on('selection:cleared', () => onSelectionChangeRef.current?.(false));

        return () => {
            console.log('Disposing Fabric canvas');
            canvas.dispose();
            fabricRef.current = null;
        };
    }, [width, height, backgroundColor]); // Only re-init if dimensions or bg color change

    useImperativeHandle(ref, () => ({
        canvas: fabricRef.current,

        addItem: async (item: {
            id: string;
            imageUrl: string;
            itemType?: 'vufs' | 'sku';
            name?: string;
            brand?: string;
            size?: string;
            category?: string;
        }) => {
            if (!fabricRef.current) {
                console.error('Canvas not initialized');
                return;
            }

            console.log('Canvas addItem called:', item.name);

            try {
                // Try strictly with crossOrigin first
                const img = await fabric.FabricImage.fromURL(item.imageUrl, { crossOrigin: 'anonymous' }).catch(err => {
                    console.warn('Failed to load image with crossOrigin anonymous, retrying without:', err);
                    return fabric.FabricImage.fromURL(item.imageUrl);
                });

                if (!img) {
                    throw new Error('Image object could not be created');
                }

                // Scale down if too large
                const maxSize = 300;
                if (img.width && img.height) {
                    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                    img.scale(scale);
                }

                img.set({
                    left: width / 2 - (img.getScaledWidth() / 2) + (Math.random() * 20 - 10),
                    top: height / 2 - (img.getScaledHeight() / 2) + (Math.random() * 20 - 10),
                });

                // Attach metadata
                (img as any).itemId = item.id; // Store wardrobe Item ID
                (img as any).itemType = item.itemType || 'vufs';
                (img as any).metaName = item.name;
                (img as any).metaBrand = item.brand;
                (img as any).metaSize = item.size;
                (img as any).metaCategory = item.category;

                (img as any).id = `canvas_${Date.now()}_${Math.random()}`; // Unique canvas ID

                fabricRef.current.add(img);
                fabricRef.current.setActiveObject(img);
                fabricRef.current.renderAll();
                onModified?.();
                console.log('Item added successfully to canvas');

            } catch (err) {
                console.error('Failed to load image:', err);
            }
        },

        deleteSelected: () => {
            if (!fabricRef.current) return;
            const activeObjects = fabricRef.current.getActiveObjects();
            if (activeObjects.length) {
                activeObjects.forEach(obj => fabricRef.current?.remove(obj));
                fabricRef.current.discardActiveObject();
                fabricRef.current.renderAll();
                onModified?.();
            }
        },

        clear: () => {
            if (!fabricRef.current) return;
            fabricRef.current.clear();
            fabricRef.current.backgroundColor = backgroundColor;
            fabricRef.current.renderAll();
            onModified?.();
        },

        getItems: () => {
            if (!fabricRef.current) return [];
            return fabricRef.current.getObjects().map((obj: any, index) => ({
                id: obj.id,
                itemId: obj.itemId, // Retrieve stored wardrobe Item ID
                imageUrl: obj.getSrc(),
                position: { x: obj.left || 0, y: obj.top || 0 },
                scale: obj.scaleX || 1, // Assuming uniform scaling
                rotation: obj.angle || 0,
                zIndex: index, // Fabric objects are in draw order
                itemType: obj.itemType || 'vufs',
                // Retrieve Metadata
                name: obj.metaName,
                brand: obj.metaBrand,
                size: obj.metaSize,
                category: obj.metaCategory
            }));
        },

        loadItems: async (items: OutfitCanvasItem[]) => {
            if (!fabricRef.current) return;
            fabricRef.current.clear();
            fabricRef.current.backgroundColor = backgroundColor;

            // Sort by zIndex
            const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

            for (const item of sortedItems) {
                try {
                    const img = await fabric.FabricImage.fromURL(item.imageUrl, { crossOrigin: 'anonymous' });
                    img.set({
                        left: item.position.x,
                        top: item.position.y,
                        scaleX: item.scale,
                        scaleY: item.scale,
                        angle: item.rotation,
                    });
                    (img as any).itemId = item.itemId;
                    (img as any).itemType = item.itemType || 'vufs';
                    (img as any).id = item.id;

                    // Restore Metadata
                    (img as any).metaName = item.name;
                    (img as any).metaBrand = item.brand;
                    (img as any).metaSize = item.size;
                    (img as any).metaCategory = item.category;

                    fabricRef.current.add(img);
                } catch (e) {
                    console.error('Failed to load item:', item, e);
                }
            }
            fabricRef.current.renderAll();
        },

        exportToPNG: () => {
            if (!fabricRef.current) return null;
            return fabricRef.current.toDataURL({
                format: 'png',
                quality: 0.8,
                multiplier: 2
            });
        },

        bringForward: (id: string) => {
            if (!fabricRef.current) return;
            const obj = fabricRef.current.getObjects().find((o: any) => o.id === id);
            if (obj) {
                fabricRef.current.bringObjectForward(obj);
                fabricRef.current.renderAll();
                onModified?.();
            }
        },

        sendBackward: (id: string) => {
            if (!fabricRef.current) return;
            const obj = fabricRef.current.getObjects().find((o: any) => o.id === id);
            if (obj) {
                fabricRef.current.sendObjectBackwards(obj);
                fabricRef.current.renderAll();
                onModified?.();
            }
        },

        bringToFront: (id: string) => {
            if (!fabricRef.current) return;
            const obj = fabricRef.current.getObjects().find((o: any) => o.id === id);
            if (obj) {
                fabricRef.current.bringObjectToFront(obj);
                fabricRef.current.renderAll();
                onModified?.();
            }
        },

        sendToBack: (id: string) => {
            if (!fabricRef.current) return;
            const obj = fabricRef.current.getObjects().find((o: any) => o.id === id);
            if (obj) {
                fabricRef.current.sendObjectToBack(obj);
                fabricRef.current.renderAll();
                onModified?.();
            }
        },

        undo,
        redo,
        canUndo: historyRef.current.length > 1,
        canRedo: redoStackRef.current.length > 0
    }));

    return (
        <div className="relative border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-slate-50">
            <canvas ref={canvasRef} />
        </div>
    );
});

OutfitCanvas.displayName = 'OutfitCanvas';

export default OutfitCanvas;
