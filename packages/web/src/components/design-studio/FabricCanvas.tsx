'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as fabric from 'fabric';

// Types
export interface CanvasObject {
    id: string;
    type: string;
    name: string;
    locked: boolean;
    visible: boolean;
}

export interface FabricCanvasRef {
    canvas: fabric.Canvas | null;
    addText: (text?: string) => void;
    addRect: () => void;
    addCircle: () => void;
    addImage: (url: string) => void;
    addColor: (color: string) => void;
    deleteSelected: () => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    setZoom: (zoom: number) => void;
    exportToPNG: () => string | null;
    exportToJSON: () => object;
    loadFromJSON: (json: object) => void;
    clear: () => void;
    undo: () => void;
    redo: () => void;
}

interface FabricCanvasProps {
    width: number;
    height: number;
    backgroundColor?: string;
    gridEnabled?: boolean;
    onSelectionChange?: (objects: CanvasObject[]) => void;
    onObjectsChange?: (objects: CanvasObject[]) => void;
    onModified?: () => void;
}

// Theme colors
const navyPrimary = '#0D1B2A';
const navySecondary = '#1B263B';
const creamPrimary = '#F5F1E8';

const FabricCanvas = forwardRef<FabricCanvasRef, FabricCanvasProps>(({
    width,
    height,
    backgroundColor = '#FFFFFF',
    gridEnabled = false,
    onSelectionChange,
    onObjectsChange,
    onModified
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef<number>(-1);
    const isLoadingRef = useRef<boolean>(false);
    const gridGroupRef = useRef<fabric.Group | null>(null);

    // Generate unique ID for objects
    const generateId = () => `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get canvas objects for layer panel (excluding grid)
    const getCanvasObjects = useCallback((): CanvasObject[] => {
        if (!fabricRef.current) return [];

        return fabricRef.current.getObjects()
            .filter((obj: any) => !obj.isGrid && obj !== gridGroupRef.current)
            .map((obj: any, index: number) => ({
                id: obj.id || `object_${index}`,
                type: obj.type || 'object',
                name: obj.name || `${obj.type || 'Object'} ${index + 1}`,
                locked: obj.lockMovementX && obj.lockMovementY,
                visible: obj.visible !== false
            })).reverse(); // Reverse so top layer is first
    }, []);

    // Save state for undo/redo (excluding grid lines)
    const saveState = useCallback(() => {
        if (!fabricRef.current || isLoadingRef.current) return;

        // Create a copy without grid objects
        const objectsToSave = fabricRef.current.getObjects().filter((obj: any) => !obj.isGrid);
        const jsonData = {
            ...fabricRef.current.toJSON(['id', 'name', 'selectable', 'lockMovementX', 'lockMovementY']),
            objects: objectsToSave.map((obj: any) => obj.toObject(['id', 'name', 'selectable', 'lockMovementX', 'lockMovementY']))
        };

        const json = JSON.stringify(jsonData);

        // Remove future states if we're not at the end
        if (historyIndexRef.current < historyRef.current.length - 1) {
            historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        }

        historyRef.current.push(json);
        historyIndexRef.current = historyRef.current.length - 1;

        // Limit history size
        if (historyRef.current.length > 50) {
            historyRef.current.shift();
            historyIndexRef.current--;
        }
    }, []);

    // Draw grid overlay (not saved to canvas)
    const drawGrid = useCallback(() => {
        if (!fabricRef.current) return;

        // Remove existing grid
        if (gridGroupRef.current) {
            fabricRef.current.remove(gridGroupRef.current);
            gridGroupRef.current = null;
        }

        if (!gridEnabled) {
            fabricRef.current.renderAll();
            return;
        }

        const gridSize = 20;
        const gridColor = '#E0E0E0';
        const lines: fabric.Line[] = [];

        // Vertical lines
        for (let i = 0; i <= width / gridSize; i++) {
            const line = new fabric.Line([i * gridSize, 0, i * gridSize, height], {
                stroke: gridColor,
                strokeWidth: 0.5,
                selectable: false,
                evented: false,
                excludeFromExport: true
            });
            (line as any).isGrid = true;
            lines.push(line);
        }

        // Horizontal lines
        for (let i = 0; i <= height / gridSize; i++) {
            const line = new fabric.Line([0, i * gridSize, width, i * gridSize], {
                stroke: gridColor,
                strokeWidth: 0.5,
                selectable: false,
                evented: false,
                excludeFromExport: true
            });
            (line as any).isGrid = true;
            lines.push(line);
        }

        // Create group and add to canvas
        const gridGroup = new fabric.Group(lines, {
            selectable: false,
            evented: false,
            excludeFromExport: true
        });
        (gridGroup as any).isGrid = true;
        gridGroupRef.current = gridGroup;

        fabricRef.current.add(gridGroup);
        fabricRef.current.sendObjectToBack(gridGroup);
        fabricRef.current.renderAll();
    }, [gridEnabled, width, height]);

    // Initialize canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width,
            height,
            backgroundColor,
            selection: true,
            preserveObjectStacking: true
        });

        fabricRef.current = canvas;

        // Event handlers
        canvas.on('selection:created', () => {
            onSelectionChange?.(getCanvasObjects());
        });

        canvas.on('selection:updated', () => {
            onSelectionChange?.(getCanvasObjects());
        });

        canvas.on('selection:cleared', () => {
            onSelectionChange?.([]);
        });

        canvas.on('object:added', (e) => {
            // Ignore grid objects
            if ((e.target as any)?.isGrid) return;

            if (!isLoadingRef.current) {
                saveState();
            }
            onObjectsChange?.(getCanvasObjects());
        });

        canvas.on('object:removed', (e) => {
            // Ignore grid objects
            if ((e.target as any)?.isGrid) return;

            if (!isLoadingRef.current) {
                saveState();
            }
            onObjectsChange?.(getCanvasObjects());
        });

        canvas.on('object:modified', () => {
            saveState();
            onModified?.();
            onObjectsChange?.(getCanvasObjects());
        });

        // Initial state
        saveState();

        return () => {
            canvas.dispose();
        };
    }, [width, height, backgroundColor, getCanvasObjects, onModified, onObjectsChange, onSelectionChange, saveState]);

    // Handle grid when gridEnabled changes
    useEffect(() => {
        drawGrid();
    }, [drawGrid]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        canvas: fabricRef.current,

        addText: (text = 'Double-click to edit') => {
            if (!fabricRef.current) return;

            const textObj = new fabric.IText(text, {
                left: 100 + Math.random() * 100,
                top: 100 + Math.random() * 100,
                fontFamily: 'Inter, Arial, sans-serif',
                fontSize: 24,
                fill: navyPrimary
            });
            (textObj as any).id = generateId();
            (textObj as any).name = 'Text';

            fabricRef.current.add(textObj);
            fabricRef.current.setActiveObject(textObj);
            fabricRef.current.renderAll();
        },

        addRect: () => {
            if (!fabricRef.current) return;

            const rect = new fabric.Rect({
                left: 100 + Math.random() * 100,
                top: 100 + Math.random() * 100,
                width: 150,
                height: 100,
                fill: creamPrimary,
                stroke: navySecondary,
                strokeWidth: 2,
                rx: 8,
                ry: 8
            });
            (rect as any).id = generateId();
            (rect as any).name = 'Rectangle';

            fabricRef.current.add(rect);
            fabricRef.current.setActiveObject(rect);
            fabricRef.current.renderAll();
        },

        addCircle: () => {
            if (!fabricRef.current) return;

            const circle = new fabric.Circle({
                left: 100 + Math.random() * 100,
                top: 100 + Math.random() * 100,
                radius: 60,
                fill: creamPrimary,
                stroke: navySecondary,
                strokeWidth: 2
            });
            (circle as any).id = generateId();
            (circle as any).name = 'Circle';

            fabricRef.current.add(circle);
            fabricRef.current.setActiveObject(circle);
            fabricRef.current.renderAll();
        },

        addImage: (url: string) => {
            if (!fabricRef.current) return;

            fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
                if (!fabricRef.current) return;

                // Scale down if too large
                const maxSize = 300;
                if (img.width && img.height) {
                    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                    img.scale(scale);
                }

                img.set({
                    left: 100 + Math.random() * 100,
                    top: 100 + Math.random() * 100
                });
                (img as any).id = generateId();
                (img as any).name = 'Image';

                fabricRef.current.add(img);
                fabricRef.current.setActiveObject(img);
                fabricRef.current.renderAll();
            }).catch(err => {
                console.error('Failed to load image:', err);
            });
        },

        addColor: (color: string) => {
            if (!fabricRef.current) return;

            const colorRect = new fabric.Rect({
                left: 100 + Math.random() * 100,
                top: 100 + Math.random() * 100,
                width: 80,
                height: 80,
                fill: color,
                stroke: '#333',
                strokeWidth: 1,
                rx: 4,
                ry: 4
            });
            (colorRect as any).id = generateId();
            (colorRect as any).name = `Color ${color}`;

            fabricRef.current.add(colorRect);
            fabricRef.current.setActiveObject(colorRect);
            fabricRef.current.renderAll();
        },

        deleteSelected: () => {
            if (!fabricRef.current) return;

            const activeObjects = fabricRef.current.getActiveObjects();
            activeObjects.forEach(obj => {
                if (!(obj as any).isGrid) {
                    fabricRef.current?.remove(obj);
                }
            });
            fabricRef.current.discardActiveObject();
            fabricRef.current.renderAll();
        },

        bringForward: () => {
            if (!fabricRef.current) return;
            const active = fabricRef.current.getActiveObject();
            if (active && !(active as any).isGrid) {
                fabricRef.current.bringObjectForward(active);
                fabricRef.current.renderAll();
                onObjectsChange?.(getCanvasObjects());
            }
        },

        sendBackward: () => {
            if (!fabricRef.current) return;
            const active = fabricRef.current.getActiveObject();
            if (active && !(active as any).isGrid) {
                fabricRef.current.sendObjectBackwards(active);
                fabricRef.current.renderAll();
                onObjectsChange?.(getCanvasObjects());
            }
        },

        bringToFront: () => {
            if (!fabricRef.current) return;
            const active = fabricRef.current.getActiveObject();
            if (active && !(active as any).isGrid) {
                fabricRef.current.bringObjectToFront(active);
                fabricRef.current.renderAll();
                onObjectsChange?.(getCanvasObjects());
            }
        },

        sendToBack: () => {
            if (!fabricRef.current) return;
            const active = fabricRef.current.getActiveObject();
            if (active && !(active as any).isGrid) {
                fabricRef.current.sendObjectToBack(active);
                // Move grid back to bottom
                if (gridGroupRef.current) {
                    fabricRef.current.sendObjectToBack(gridGroupRef.current);
                }
                fabricRef.current.renderAll();
                onObjectsChange?.(getCanvasObjects());
            }
        },

        setZoom: (zoom: number) => {
            if (!fabricRef.current) return;
            fabricRef.current.setZoom(zoom);
            fabricRef.current.renderAll();
        },

        exportToPNG: () => {
            if (!fabricRef.current) return null;

            // Temporarily hide grid for export
            const gridWasVisible = gridGroupRef.current?.visible;
            if (gridGroupRef.current) {
                gridGroupRef.current.visible = false;
                fabricRef.current.renderAll();
            }

            const dataUrl = fabricRef.current.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 2
            });

            // Restore grid visibility
            if (gridGroupRef.current && gridWasVisible) {
                gridGroupRef.current.visible = true;
                fabricRef.current.renderAll();
            }

            return dataUrl;
        },

        exportToJSON: () => {
            if (!fabricRef.current) return {};

            // Filter out grid objects from export
            const objectsToExport = fabricRef.current.getObjects().filter((obj: any) => !obj.isGrid);
            return {
                ...fabricRef.current.toJSON(['id', 'name', 'selectable', 'lockMovementX', 'lockMovementY']),
                objects: objectsToExport.map((obj: any) => obj.toObject(['id', 'name', 'selectable', 'lockMovementX', 'lockMovementY']))
            };
        },

        loadFromJSON: (json: object) => {
            if (!fabricRef.current) return;
            isLoadingRef.current = true;

            fabricRef.current.loadFromJSON(json).then(() => {
                fabricRef.current?.renderAll();
                isLoadingRef.current = false;
                // Redraw grid after loading
                drawGrid();
                onObjectsChange?.(getCanvasObjects());
            });
        },

        clear: () => {
            if (!fabricRef.current) return;

            // Remove all non-grid objects
            const objects = fabricRef.current.getObjects().filter((obj: any) => !obj.isGrid);
            objects.forEach(obj => fabricRef.current?.remove(obj));

            fabricRef.current.backgroundColor = backgroundColor;
            fabricRef.current.renderAll();
        },

        undo: () => {
            if (!fabricRef.current || historyIndexRef.current <= 0) return;

            historyIndexRef.current--;
            isLoadingRef.current = true;

            fabricRef.current.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current])).then(() => {
                fabricRef.current?.renderAll();
                isLoadingRef.current = false;
                drawGrid();
                onObjectsChange?.(getCanvasObjects());
            });
        },

        redo: () => {
            if (!fabricRef.current || historyIndexRef.current >= historyRef.current.length - 1) return;

            historyIndexRef.current++;
            isLoadingRef.current = true;

            fabricRef.current.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current])).then(() => {
                fabricRef.current?.renderAll();
                isLoadingRef.current = false;
                drawGrid();
                onObjectsChange?.(getCanvasObjects());
            });
        }
    }), [backgroundColor, getCanvasObjects, onObjectsChange, drawGrid]);

    return (
        <div
            className="fabric-canvas-container rounded-lg overflow-hidden shadow-lg"
            style={{
                width: width,
                height: height,
                border: `2px solid ${navySecondary}`
            }}
        >
            <canvas ref={canvasRef} />
        </div>
    );
});

FabricCanvas.displayName = 'FabricCanvas';

export default FabricCanvas;
