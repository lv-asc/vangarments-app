'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback, useState } from 'react';
import * as fabric from 'fabric';

// Types
export interface CanvasObject {
    id: string;
    type: string;
    name: string;
    locked: boolean;
    visible: boolean;
    color?: string;
}

export interface ConnectionData {
    id: string;
    fromId: string;
    toId: string;
    color: string;
}

export type CanvasTool = 'select' | 'pan' | 'text' | 'brush' | 'eraser' | 'sticky' | 'connect' | 'image' | 'shape' | 'comment' | 'highlighter';

export interface InfiniteCanvasRef {
    canvas: fabric.Canvas | null;
    addText: (text?: string, color?: string, fontFamily?: string) => void;
    addStickyNote: (color?: string) => void;
    addShape: (shapeType: 'rect' | 'circle' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'line', color?: string) => void;
    addImage: (url: string, isFileCard?: boolean, fileData?: { name: string; type: string; id: string }) => void;
    addConnection: (fromId: string, toId: string, color?: string) => void;
    deleteSelected: () => void;
    deleteObjectById: (id: string) => void;
    toggleVisibility: (id: string) => void;
    toggleLock: (id: string) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    setZoom: (zoom: number) => void;
    getZoom: () => number;
    resetView: () => void;
    exportToPNG: () => string | null;
    exportToJSON: () => object;
    loadFromJSON: (json: object) => void;
    clear: () => void;
    undo: () => void;
    redo: () => void;
    setActiveTool: (tool: CanvasTool) => void;
    setBrushColor: (color: string) => void;
    setBrushWidth: (width: number) => void;
    setTextColor: (color: string) => void;
    setShapeColor: (color: string) => void;
    panBy: (dx: number, dy: number) => void;
    getConnections: () => ConnectionData[];
    getObjectById: (id: string) => any;
}

interface InfiniteCanvasProps {
    backgroundColor?: string;
    gridEnabled?: boolean;
    onSelectionChange?: (objects: CanvasObject[]) => void;
    onObjectsChange?: (objects: CanvasObject[]) => void;
    onModified?: () => void;
    onZoomChange?: (zoom: number) => void;
    onToolChange?: (tool: CanvasTool) => void;
    onFileDoubleClick?: (fileId: string) => void;
    onObjectSelected?: (obj: any, position: { x: number; y: number } | null) => void;
}

// Theme colors
const navyPrimary = '#0D1B2A';
const creamPrimary = '#F5F1E8';

// Sticky note colors with darker shades for folded corner
const STICKY_COLORS: Record<string, { main: string; fold: string }> = {
    yellow: { main: '#FEF3C7', fold: '#FDE68A' },
    pink: { main: '#FCE7F3', fold: '#FBCFE8' },
    orange: { main: '#FFEDD5', fold: '#FED7AA' },
    green: { main: '#D1FAE5', fold: '#A7F3D0' },
    blue: { main: '#DBEAFE', fold: '#BFDBFE' },
    purple: { main: '#E9D8FD', fold: '#DDD6FE' }
};

const InfiniteCanvas = forwardRef<InfiniteCanvasRef, InfiniteCanvasProps>(({
    backgroundColor = '#1a1a2e',
    gridEnabled = true,
    onSelectionChange,
    onObjectsChange,
    onModified,
    onZoomChange,
    onToolChange,
    onFileDoubleClick,
    onObjectSelected
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef<number>(-1);
    const isLoadingRef = useRef<boolean>(false);
    const connectionsRef = useRef<ConnectionData[]>([]);
    const brushColorRef = useRef('#DC2626');
    const brushWidthRef = useRef(3);
    const textColorRef = useRef(creamPrimary);
    const shapeColorRef = useRef('#3B82F6');
    const activeToolRef = useRef<CanvasTool>('select');
    const connectingFromRef = useRef<string | null>(null);
    const isPanningRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const callbacksRef = useRef({ onSelectionChange, onObjectsChange, onModified, onZoomChange, onToolChange, onFileDoubleClick, onObjectSelected });

    const [currentZoom, setCurrentZoom] = useState(1);
    const [activeTool, setActiveToolState] = useState<CanvasTool>('select');
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        callbacksRef.current = { onSelectionChange, onObjectsChange, onModified, onZoomChange, onToolChange, onFileDoubleClick, onObjectSelected };
    }, [onSelectionChange, onObjectsChange, onModified, onZoomChange, onToolChange, onFileDoubleClick, onObjectSelected]);

    const generateId = useCallback(() => `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, []);

    const getCanvasObjects = useCallback((): CanvasObject[] => {
        if (!fabricRef.current) return [];
        return fabricRef.current.getObjects()
            .filter((obj: any) => !obj.isGrid && !obj.isConnection && !obj.isPin)
            .map((obj: any, index: number) => ({
                id: obj.id || `object_${index}`,
                type: obj.type || 'object',
                name: obj.name || `${obj.type || 'Object'} ${index + 1}`,
                locked: obj.lockMovementX && obj.lockMovementY,
                visible: obj.visible !== false,
                color: obj.stickyColor
            })).reverse();
    }, []);

    const saveState = useCallback(() => {
        if (!fabricRef.current || isLoadingRef.current) return;
        try {
            const objectsToSave = fabricRef.current.getObjects().filter((obj: any) => !obj.isGrid && !obj.isConnection && !obj.isPin);
            const jsonData = {
                objects: objectsToSave.map((obj: any) => obj.toObject(['id', 'name', 'isSticky', 'stickyColor', 'isFileCard', 'fileData', 'isStickyBg', 'isStickyFold'])),
                connections: connectionsRef.current,
                background: fabricRef.current.backgroundColor
            };
            const json = JSON.stringify(jsonData);
            if (historyIndexRef.current < historyRef.current.length - 1) {
                historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
            }
            historyRef.current.push(json);
            historyIndexRef.current = historyRef.current.length - 1;
            if (historyRef.current.length > 50) { historyRef.current.shift(); historyIndexRef.current--; }
        } catch (e) { console.error('Error saving state:', e); }
    }, []);

    const drawConnectionWithPins = useCallback((conn: ConnectionData) => {
        if (!fabricRef.current) return;
        const fromObj = fabricRef.current.getObjects().find((o: any) => o.id === conn.fromId);
        const toObj = fabricRef.current.getObjects().find((o: any) => o.id === conn.toId);
        if (!fromObj || !toObj) return;

        const fromCenter = fromObj.getCenterPoint();
        const toCenter = toObj.getCenterPoint();

        const line = new fabric.Line([fromCenter.x, fromCenter.y, toCenter.x, toCenter.y], {
            stroke: conn.color, strokeWidth: 2, selectable: false, evented: false
        });
        (line as any).isConnection = true;
        (line as any).connectionId = conn.id;

        const pinRadius = 8;
        [fromCenter, toCenter].forEach(center => {
            const pin = new fabric.Circle({
                left: center.x - pinRadius, top: center.y - pinRadius,
                radius: pinRadius, fill: conn.color, stroke: '#FFFFFF', strokeWidth: 2,
                selectable: false, evented: false,
                shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 4, offsetX: 1, offsetY: 1 })
            });
            (pin as any).isPin = true;
            (pin as any).connectionId = conn.id;
            fabricRef.current?.add(pin);
            fabricRef.current?.bringObjectToFront(pin);
        });

        fabricRef.current.add(line);
        fabricRef.current.sendObjectToBack(line);
    }, []);

    const updateConnectionLines = useCallback(() => {
        if (!fabricRef.current) return;
        const toRemove = fabricRef.current.getObjects().filter((obj: any) => obj.isConnection || obj.isPin);
        toRemove.forEach(obj => fabricRef.current?.remove(obj));
        connectionsRef.current.forEach(conn => drawConnectionWithPins(conn));
        fabricRef.current.renderAll();
    }, [drawConnectionWithPins]);

    const updateMinimap = useCallback(() => {
        if (!fabricRef.current || !minimapCanvasRef.current || !containerRef.current) return;
        const ctx = minimapCanvasRef.current.getContext('2d');
        if (!ctx) return;
        const mw = 150, mh = 100;
        const cw = containerRef.current.offsetWidth;
        const ch = containerRef.current.offsetHeight;
        const objects = fabricRef.current.getObjects().filter((o: any) => !o.isGrid && !o.isConnection && !o.isPin);
        let minX = 0, minY = 0, maxX = cw, maxY = ch;
        objects.forEach(obj => {
            const b = obj.getBoundingRect();
            minX = Math.min(minX, b.left); minY = Math.min(minY, b.top);
            maxX = Math.max(maxX, b.left + b.width); maxY = Math.max(maxY, b.top + b.height);
        });
        const ww = Math.max(maxX - minX, cw) + 200;
        const wh = Math.max(maxY - minY, ch) + 200;
        const scale = Math.min(mw / ww, mh / wh);
        ctx.fillStyle = navyPrimary; ctx.fillRect(0, 0, mw, mh);
        ctx.fillStyle = creamPrimary;
        objects.forEach(obj => {
            const b = obj.getBoundingRect();
            ctx.fillRect((b.left - minX + 100) * scale, (b.top - minY + 100) * scale, Math.max(b.width * scale, 2), Math.max(b.height * scale, 2));
        });
        const vpt = fabricRef.current.viewportTransform || [1, 0, 0, 1, 0, 0];
        const zoom = fabricRef.current.getZoom();
        ctx.strokeStyle = '#22C55E'; ctx.lineWidth = 2;
        ctx.strokeRect((-vpt[4] / zoom - minX + 100) * scale, (-vpt[5] / zoom - minY + 100) * scale, (cw / zoom) * scale, (ch / zoom) * scale);
    }, []);

    const drawGrid = useCallback(() => {
        if (!fabricRef.current || !containerRef.current) return;
        const gridObjects = fabricRef.current.getObjects().filter((obj: any) => obj.isGrid);
        gridObjects.forEach(obj => fabricRef.current?.remove(obj));
        if (!gridEnabled) { fabricRef.current.renderAll(); return; }
        const zoom = fabricRef.current.getZoom();
        const vpt = fabricRef.current.viewportTransform || [1, 0, 0, 1, 0, 0];
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        let gridSize = 50;
        if (zoom < 0.5) gridSize = 100; if (zoom < 0.25) gridSize = 200; if (zoom > 1.5) gridSize = 25;
        const offsetX = vpt[4] % (gridSize * zoom);
        const offsetY = vpt[5] % (gridSize * zoom);
        for (let x = offsetX - gridSize * zoom; x < width + gridSize * zoom; x += gridSize * zoom) {
            const line = new fabric.Line([x, 0, x, height], { stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true });
            (line as any).isGrid = true; fabricRef.current.add(line); fabricRef.current.sendObjectToBack(line);
        }
        for (let y = offsetY - gridSize * zoom; y < height + gridSize * zoom; y += gridSize * zoom) {
            const line = new fabric.Line([0, y, width, y], { stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true });
            (line as any).isGrid = true; fabricRef.current.add(line); fabricRef.current.sendObjectToBack(line);
        }
        fabricRef.current.renderAll();
        updateMinimap();
    }, [gridEnabled, updateMinimap]);

    const deleteSelectedObjects = useCallback(() => {
        if (!fabricRef.current) return;
        const activeObjects = fabricRef.current.getActiveObjects();
        if (activeObjects.length === 0) return;
        activeObjects.forEach(obj => {
            if (!(obj as any).isGrid && !(obj as any).isConnection && !(obj as any).isPin) {
                const objId = (obj as any).id;
                connectionsRef.current = connectionsRef.current.filter(c => c.fromId !== objId && c.toId !== objId);
                fabricRef.current?.remove(obj);
            }
        });
        fabricRef.current.discardActiveObject();
        updateConnectionLines();
        fabricRef.current.renderAll();
        saveState();
        callbacksRef.current.onModified?.();
        callbacksRef.current.onObjectsChange?.(getCanvasObjects());
        callbacksRef.current.onObjectSelected?.(null, null);
    }, [updateConnectionLines, saveState, getCanvasObjects]);

    const deleteObjectById = useCallback((id: string) => {
        if (!fabricRef.current) return;
        const obj = fabricRef.current.getObjects().find((o: any) => o.id === id);
        if (obj) {
            connectionsRef.current = connectionsRef.current.filter(c => c.fromId !== id && c.toId !== id);
            fabricRef.current.remove(obj);
            fabricRef.current.discardActiveObject();
            updateConnectionLines();
            fabricRef.current.renderAll();
            saveState();
            callbacksRef.current.onModified?.();
            callbacksRef.current.onObjectsChange?.(getCanvasObjects());
        }
    }, [updateConnectionLines, saveState, getCanvasObjects]);

    const toggleVisibility = useCallback((id: string) => {
        if (!fabricRef.current) return;
        const obj = fabricRef.current.getObjects().find((o: any) => o.id === id);
        if (obj) {
            obj.visible = !obj.visible;
            fabricRef.current.renderAll();
            callbacksRef.current.onObjectsChange?.(getCanvasObjects());
        }
    }, [getCanvasObjects]);

    const toggleLock = useCallback((id: string) => {
        if (!fabricRef.current) return;
        const obj = fabricRef.current.getObjects().find((o: any) => o.id === id);
        if (obj) {
            const isLocked = obj.lockMovementX && obj.lockMovementY;
            obj.lockMovementX = !isLocked;
            obj.lockMovementY = !isLocked;
            obj.lockRotation = !isLocked;
            obj.lockScalingX = !isLocked;
            obj.lockScalingY = !isLocked;
            obj.selectable = isLocked;
            fabricRef.current.renderAll();
            callbacksRef.current.onObjectsChange?.(getCanvasObjects());
        }
    }, [getCanvasObjects]);

    // Initialize canvas
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current || isInitialized) return;
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width, height, backgroundColor, selection: true, preserveObjectStacking: true,
            renderOnAddRemove: true, stopContextMenu: true, fireRightClick: true
        });
        fabricRef.current = canvas;
        setIsInitialized(true);

        canvas.on('mouse:down', (opt) => {
            const evt = opt.e as MouseEvent;
            if (evt.button === 2 || activeToolRef.current === 'pan') {
                isPanningRef.current = true; lastPointRef.current = { x: evt.clientX, y: evt.clientY };
                canvas.selection = false; canvas.setCursor('grabbing'); evt.preventDefault(); return;
            }

            // Eraser mode - click to remove path objects
            if (activeToolRef.current === 'eraser' && opt.target) {
                const target = opt.target as any;
                if (target.type === 'path' && !target.isGrid && !target.isConnection && !target.isPin) {
                    canvas.remove(opt.target);
                    canvas.renderAll();
                    saveState();
                    callbacksRef.current.onModified?.();
                    callbacksRef.current.onObjectsChange?.(getCanvasObjects());
                    return;
                }
            }

            if (activeToolRef.current === 'connect' && opt.target) {
                const targetId = (opt.target as any).id;
                if (targetId && !(opt.target as any).isGrid && !(opt.target as any).isConnection && !(opt.target as any).isPin) {
                    if (!connectingFromRef.current) {
                        connectingFromRef.current = targetId; setConnectingFrom(targetId);
                    } else if (connectingFromRef.current !== targetId) {
                        connectionsRef.current.push({ id: generateId(), fromId: connectingFromRef.current, toId: targetId, color: brushColorRef.current });
                        updateConnectionLines();
                        connectingFromRef.current = null; setConnectingFrom(null);
                        saveState(); callbacksRef.current.onModified?.();
                    }
                }
            }
        });

        canvas.on('mouse:move', (opt) => {
            if (isPanningRef.current && lastPointRef.current) {
                const evt = opt.e as MouseEvent;
                const vpt = canvas.viewportTransform;
                if (vpt) {
                    vpt[4] += evt.clientX - lastPointRef.current.x;
                    vpt[5] += evt.clientY - lastPointRef.current.y;
                    lastPointRef.current = { x: evt.clientX, y: evt.clientY };
                    canvas.requestRenderAll(); drawGrid();
                }
            }
        });

        canvas.on('mouse:up', () => {
            isPanningRef.current = false; lastPointRef.current = null;
            if (activeToolRef.current !== 'pan') canvas.selection = true;
            canvas.setCursor('default'); updateMinimap();
        });

        canvas.on('mouse:down:before', (opt) => { if ((opt.e as MouseEvent).button === 2) opt.e.preventDefault(); });

        canvas.on('mouse:dblclick', (opt) => {
            if (opt.target && (opt.target as any).isFileCard) {
                const fileId = (opt.target as any).fileData?.id;
                if (fileId) callbacksRef.current.onFileDoubleClick?.(fileId);
            }
        });

        canvas.on('selection:created', (e) => {
            const selected = canvas.getActiveObject();
            if (selected && e.e) {
                const evt = e.e as MouseEvent;
                callbacksRef.current.onObjectSelected?.(selected, { x: evt.clientX, y: evt.clientY });
            }
            callbacksRef.current.onSelectionChange?.(getCanvasObjects());
        });

        canvas.on('selection:updated', (e) => {
            const selected = canvas.getActiveObject();
            if (selected && e.e) {
                const evt = e.e as MouseEvent;
                callbacksRef.current.onObjectSelected?.(selected, { x: evt.clientX, y: evt.clientY });
            }
            callbacksRef.current.onSelectionChange?.(getCanvasObjects());
        });

        canvas.on('selection:cleared', () => {
            callbacksRef.current.onSelectionChange?.([]);
            callbacksRef.current.onObjectSelected?.(null, null);
        });

        canvas.on('object:added', (e) => {
            if ((e.target as any)?.isGrid || (e.target as any)?.isConnection || (e.target as any)?.isPin) return;
            if (!isLoadingRef.current) saveState();
            callbacksRef.current.onObjectsChange?.(getCanvasObjects()); updateMinimap();
        });
        canvas.on('object:removed', (e) => {
            if ((e.target as any)?.isGrid || (e.target as any)?.isConnection || (e.target as any)?.isPin) return;
            if (!isLoadingRef.current) saveState();
            callbacksRef.current.onObjectsChange?.(getCanvasObjects()); updateMinimap();
        });
        canvas.on('object:modified', () => {
            saveState(); callbacksRef.current.onModified?.(); callbacksRef.current.onObjectsChange?.(getCanvasObjects());
            updateConnectionLines(); updateMinimap();
        });
        canvas.on('object:moving', () => updateConnectionLines());
        canvas.on('object:scaling', () => updateConnectionLines());

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

            // Ctrl+Z / Cmd+Z for undo
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
                e.preventDefault();
                if (historyIndexRef.current > 0) {
                    historyIndexRef.current--;
                    isLoadingRef.current = true;
                    try {
                        const state = JSON.parse(historyRef.current[historyIndexRef.current]);
                        if (state.connections) connectionsRef.current = state.connections;
                        const objectsToClear = fabricRef.current?.getObjects().filter((obj: any) => !obj.isGrid) || [];
                        objectsToClear.forEach(obj => fabricRef.current?.remove(obj));
                        if (state.objects) {
                            fabric.util.enlivenObjects(state.objects).then((objects: any[]) => {
                                objects.forEach(obj => fabricRef.current?.add(obj));
                                fabricRef.current?.renderAll();
                                isLoadingRef.current = false;
                                updateConnectionLines();
                                updateMinimap();
                                callbacksRef.current.onObjectsChange?.(getCanvasObjects());
                            });
                        } else { isLoadingRef.current = false; }
                    } catch (err) { console.error('Undo error:', err); isLoadingRef.current = false; }
                }
                return;
            }

            // Ctrl+Shift+Z / Cmd+Shift+Z for redo
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && e.shiftKey) {
                e.preventDefault();
                if (historyIndexRef.current < historyRef.current.length - 1) {
                    historyIndexRef.current++;
                    isLoadingRef.current = true;
                    try {
                        const state = JSON.parse(historyRef.current[historyIndexRef.current]);
                        if (state.connections) connectionsRef.current = state.connections;
                        const objectsToClear = fabricRef.current?.getObjects().filter((obj: any) => !obj.isGrid) || [];
                        objectsToClear.forEach(obj => fabricRef.current?.remove(obj));
                        if (state.objects) {
                            fabric.util.enlivenObjects(state.objects).then((objects: any[]) => {
                                objects.forEach(obj => fabricRef.current?.add(obj));
                                fabricRef.current?.renderAll();
                                isLoadingRef.current = false;
                                updateConnectionLines();
                                updateMinimap();
                                callbacksRef.current.onObjectsChange?.(getCanvasObjects());
                            });
                        } else { isLoadingRef.current = false; }
                    } catch (err) { console.error('Redo error:', err); isLoadingRef.current = false; }
                }
                return;
            }

            if (e.code === 'Space' && !isPanningRef.current) {
                e.preventDefault(); activeToolRef.current = 'pan'; setActiveToolState('pan');
                canvas.selection = false; canvas.setCursor('grab');
            }
            if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); deleteSelectedObjects(); }
            if (e.code === 'Escape') { connectingFromRef.current = null; setConnectingFrom(null); }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') { activeToolRef.current = 'select'; setActiveToolState('select'); canvas.selection = true; canvas.setCursor('default'); }
        };
        const handleResize = () => {
            if (!containerRef.current) return;
            canvas.setDimensions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight }); drawGrid();
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(containerRef.current);
        saveState(); drawGrid();
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            resizeObserver.disconnect(); canvas.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle tool changes
    useEffect(() => {
        if (!fabricRef.current || !isInitialized) return;
        activeToolRef.current = activeTool;

        if (activeTool === 'brush') {
            fabricRef.current.isDrawingMode = true;
            const brush = new fabric.PencilBrush(fabricRef.current);
            brush.color = brushColorRef.current; brush.width = brushWidthRef.current;
            fabricRef.current.freeDrawingBrush = brush;
        } else if (activeTool === 'highlighter') {
            fabricRef.current.isDrawingMode = true;
            const hlBrush = new fabric.PencilBrush(fabricRef.current);
            hlBrush.color = `${brushColorRef.current}60`; hlBrush.width = 20;
            fabricRef.current.freeDrawingBrush = hlBrush;
        } else {
            fabricRef.current.isDrawingMode = false;
        }
        if (activeTool === 'pan') { fabricRef.current.selection = false; fabricRef.current.setCursor('grab'); }
        else if (activeTool === 'eraser') { fabricRef.current.selection = false; }
        else { fabricRef.current.selection = true; }
        callbacksRef.current.onToolChange?.(activeTool);
    }, [activeTool, isInitialized]);

    useEffect(() => { if (isInitialized) drawGrid(); }, [gridEnabled, isInitialized, drawGrid]);

    // Expose methods
    useImperativeHandle(ref, () => ({
        canvas: fabricRef.current,

        addText: (text = 'Double-click to edit', color?: string, fontFamily?: string) => {
            if (!fabricRef.current) return;
            const vpt = fabricRef.current.viewportTransform || [1, 0, 0, 1, 0, 0];
            const zoom = fabricRef.current.getZoom();
            const centerX = (fabricRef.current.getWidth() / 2 - vpt[4]) / zoom;
            const centerY = (fabricRef.current.getHeight() / 2 - vpt[5]) / zoom;
            const textObj = new fabric.IText(text, {
                left: centerX, top: centerY, fontFamily: fontFamily || 'Inter',
                fontSize: 24, fill: color || textColorRef.current, originX: 'center', originY: 'center'
            });
            (textObj as any).id = generateId(); (textObj as any).name = 'Text';
            fabricRef.current.add(textObj); fabricRef.current.setActiveObject(textObj);
            textObj.enterEditing(); textObj.selectAll(); fabricRef.current.renderAll();
        },

        addStickyNote: (color = 'yellow') => {
            if (!fabricRef.current) return;
            const vpt = fabricRef.current.viewportTransform || [1, 0, 0, 1, 0, 0];
            const zoom = fabricRef.current.getZoom();
            const centerX = (fabricRef.current.getWidth() / 2 - vpt[4]) / zoom;
            const centerY = (fabricRef.current.getHeight() / 2 - vpt[5]) / zoom;
            const colors = STICKY_COLORS[color] || STICKY_COLORS.yellow;
            const size = 150;

            // Create an IText with background styling (not a Group - Groups can't be edited inline)
            const sticky = new fabric.IText('Type here...', {
                left: centerX - size / 2,
                top: centerY - size / 2,
                width: size,
                fontSize: 16,
                fontFamily: 'Inter, Arial, sans-serif',
                fill: navyPrimary,
                textAlign: 'center',
                backgroundColor: colors.main,
                padding: 20,
                shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.15)', blur: 8, offsetX: 3, offsetY: 3 })
            });

            (sticky as any).id = generateId();
            (sticky as any).name = `Sticky (${color})`;
            (sticky as any).isSticky = true;
            (sticky as any).stickyColor = color;

            // Custom rendering for folded corner
            const originalRender = sticky.render.bind(sticky);
            sticky.render = function (ctx: CanvasRenderingContext2D) {
                const w = this.width || size;
                const h = this.height || size;
                const foldSize = 20;

                // Draw folded corner effect
                ctx.save();
                ctx.translate(this.left || 0, this.top || 0);

                // Draw fold triangle
                ctx.fillStyle = colors.fold;
                ctx.beginPath();
                ctx.moveTo(w - foldSize, 0);
                ctx.lineTo(w, foldSize);
                ctx.lineTo(w, 0);
                ctx.closePath();
                ctx.fill();

                ctx.restore();

                originalRender(ctx);
            };

            fabricRef.current.add(sticky);
            fabricRef.current.setActiveObject(sticky);
            sticky.enterEditing();
            sticky.selectAll();
            fabricRef.current.renderAll();
        },

        addShape: (shapeType: 'rect' | 'circle' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'line', color?: string) => {
            if (!fabricRef.current) return;
            const vpt = fabricRef.current.viewportTransform || [1, 0, 0, 1, 0, 0];
            const zoom = fabricRef.current.getZoom();
            const centerX = (fabricRef.current.getWidth() / 2 - vpt[4]) / zoom;
            const centerY = (fabricRef.current.getHeight() / 2 - vpt[5]) / zoom;
            const fillColor = color || shapeColorRef.current;
            let shape: fabric.Object;

            switch (shapeType) {
                case 'rect':
                    shape = new fabric.Rect({ left: centerX - 50, top: centerY - 40, width: 100, height: 80, fill: fillColor, stroke: '#000', strokeWidth: 1, rx: 4, ry: 4 });
                    break;
                case 'circle':
                    shape = new fabric.Circle({ left: centerX - 40, top: centerY - 40, radius: 40, fill: fillColor, stroke: '#000', strokeWidth: 1 });
                    break;
                case 'triangle':
                    shape = new fabric.Triangle({ left: centerX - 50, top: centerY - 45, width: 100, height: 90, fill: fillColor, stroke: '#000', strokeWidth: 1 });
                    break;
                case 'diamond':
                    shape = new fabric.Polygon([{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }], { left: centerX - 50, top: centerY - 50, fill: fillColor, stroke: '#000', strokeWidth: 1 });
                    break;
                case 'star': {
                    const starPoints = [];
                    for (let i = 0; i < 10; i++) {
                        const r = i % 2 === 0 ? 40 : 20;
                        const angle = (Math.PI / 5) * i - Math.PI / 2;
                        starPoints.push({ x: 40 + r * Math.cos(angle), y: 40 + r * Math.sin(angle) });
                    }
                    shape = new fabric.Polygon(starPoints, { left: centerX - 40, top: centerY - 40, fill: fillColor, stroke: '#000', strokeWidth: 1 });
                    break;
                }
                case 'arrow':
                    shape = new fabric.Polygon([{ x: 0, y: 30 }, { x: 60, y: 30 }, { x: 60, y: 15 }, { x: 100, y: 45 }, { x: 60, y: 75 }, { x: 60, y: 60 }, { x: 0, y: 60 }], { left: centerX - 50, top: centerY - 45, fill: fillColor, stroke: '#000', strokeWidth: 1 });
                    break;
                case 'line':
                    shape = new fabric.Line([centerX - 50, centerY, centerX + 50, centerY], { stroke: fillColor, strokeWidth: 3 });
                    break;
                default:
                    shape = new fabric.Rect({ left: centerX - 50, top: centerY - 40, width: 100, height: 80, fill: fillColor });
            }
            (shape as any).id = generateId();
            (shape as any).name = shapeType.charAt(0).toUpperCase() + shapeType.slice(1);
            fabricRef.current.add(shape);
            fabricRef.current.setActiveObject(shape);
            fabricRef.current.renderAll();
        },

        addImage: (url: string, isFileCard = false, fileData?: { name: string; type: string; id: string }) => {
            if (!fabricRef.current) return;
            const vpt = fabricRef.current.viewportTransform || [1, 0, 0, 1, 0, 0];
            const zoom = fabricRef.current.getZoom();
            const centerX = (fabricRef.current.getWidth() / 2 - vpt[4]) / zoom;
            const centerY = (fabricRef.current.getHeight() / 2 - vpt[5]) / zoom;

            fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
                if (!fabricRef.current) return;
                const maxSize = isFileCard ? 200 : 400;
                if (img.width && img.height) {
                    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                    img.scale(scale);
                }
                img.set({
                    left: centerX, top: centerY, originX: 'center', originY: 'center',
                    shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.2)', blur: 10, offsetX: 0, offsetY: 4 })
                });
                (img as any).id = generateId();
                (img as any).name = fileData?.name || 'Image';
                (img as any).isFileCard = isFileCard;
                (img as any).fileData = fileData;
                fabricRef.current.add(img);
                fabricRef.current.setActiveObject(img);
                fabricRef.current.renderAll();
                saveState();
            }).catch(err => console.error('Failed to load image:', err));
        },

        addConnection: (fromId: string, toId: string, color = '#DC2626') => {
            connectionsRef.current.push({ id: generateId(), fromId, toId, color });
            updateConnectionLines(); saveState();
        },

        deleteSelected: deleteSelectedObjects,
        deleteObjectById,
        toggleVisibility,
        toggleLock,

        bringForward: () => { const a = fabricRef.current?.getActiveObject(); if (a) { fabricRef.current?.bringObjectForward(a); fabricRef.current?.renderAll(); } },
        sendBackward: () => { const a = fabricRef.current?.getActiveObject(); if (a) { fabricRef.current?.sendObjectBackwards(a); fabricRef.current?.renderAll(); } },
        bringToFront: () => { const a = fabricRef.current?.getActiveObject(); if (a) { fabricRef.current?.bringObjectToFront(a); fabricRef.current?.renderAll(); } },
        sendToBack: () => { const a = fabricRef.current?.getActiveObject(); if (a) { fabricRef.current?.sendObjectToBack(a); fabricRef.current?.renderAll(); } },

        setZoom: (zoom: number) => {
            if (!fabricRef.current) return;
            const clampedZoom = Math.max(0.1, Math.min(4, zoom));
            const center = new fabric.Point(fabricRef.current.getWidth() / 2, fabricRef.current.getHeight() / 2);
            fabricRef.current.zoomToPoint(center, clampedZoom);
            setCurrentZoom(clampedZoom); drawGrid(); callbacksRef.current.onZoomChange?.(clampedZoom);
        },
        getZoom: () => fabricRef.current?.getZoom() || 1,
        resetView: () => { if (!fabricRef.current) return; fabricRef.current.setViewportTransform([1, 0, 0, 1, 0, 0]); setCurrentZoom(1); drawGrid(); callbacksRef.current.onZoomChange?.(1); },

        exportToPNG: () => { if (!fabricRef.current) return null; fabricRef.current.getObjects().forEach((obj: any) => { if (obj.isGrid || obj.isConnection || obj.isPin) obj.visible = false; }); fabricRef.current.renderAll(); const dataUrl = fabricRef.current.toDataURL({ format: 'png', quality: 1, multiplier: 2 }); fabricRef.current.getObjects().forEach((obj: any) => { if (obj.isGrid || obj.isConnection || obj.isPin) obj.visible = true; }); fabricRef.current.renderAll(); return dataUrl; },

        exportToJSON: () => {
            if (!fabricRef.current) return {};
            const objectsToExport = fabricRef.current.getObjects().filter((obj: any) => !obj.isGrid && !obj.isConnection && !obj.isPin);
            return { objects: objectsToExport.map((obj: any) => obj.toObject(['id', 'name', 'isSticky', 'stickyColor', 'isFileCard', 'fileData'])), connections: connectionsRef.current, viewportTransform: fabricRef.current.viewportTransform, background: fabricRef.current.backgroundColor };
        },

        loadFromJSON: (json: any) => {
            if (!fabricRef.current) return; isLoadingRef.current = true;
            const objectsToClear = fabricRef.current.getObjects().filter((obj: any) => !obj.isGrid);
            objectsToClear.forEach(obj => fabricRef.current?.remove(obj));
            if (json.connections) connectionsRef.current = json.connections;
            if (json.objects && Array.isArray(json.objects)) {
                fabric.util.enlivenObjects(json.objects).then((objects: any[]) => {
                    objects.forEach(obj => fabricRef.current?.add(obj));
                    if (json.viewportTransform) { fabricRef.current?.setViewportTransform(json.viewportTransform); setCurrentZoom(json.viewportTransform[0]); }
                    fabricRef.current?.renderAll(); isLoadingRef.current = false; drawGrid(); updateConnectionLines(); updateMinimap(); callbacksRef.current.onObjectsChange?.(getCanvasObjects());
                });
            } else { isLoadingRef.current = false; }
        },

        clear: () => { if (!fabricRef.current) return; const objects = fabricRef.current.getObjects().filter((obj: any) => !obj.isGrid); objects.forEach(obj => fabricRef.current?.remove(obj)); connectionsRef.current = []; fabricRef.current.renderAll(); },

        undo: () => {
            if (!fabricRef.current || historyIndexRef.current <= 0) return;
            historyIndexRef.current--;
            isLoadingRef.current = true;
            try {
                const state = JSON.parse(historyRef.current[historyIndexRef.current]);
                if (state.connections) connectionsRef.current = state.connections;
                const objectsToClear = fabricRef.current.getObjects().filter((obj: any) => !obj.isGrid);
                objectsToClear.forEach(obj => fabricRef.current?.remove(obj));
                if (state.objects && state.objects.length > 0) {
                    fabric.util.enlivenObjects(state.objects).then((objects: any[]) => {
                        objects.forEach(obj => fabricRef.current?.add(obj));
                        fabricRef.current?.renderAll();
                        isLoadingRef.current = false;
                        updateConnectionLines();
                        updateMinimap();
                        callbacksRef.current.onObjectsChange?.(getCanvasObjects());
                    });
                } else {
                    isLoadingRef.current = false;
                    fabricRef.current.renderAll();
                    callbacksRef.current.onObjectsChange?.(getCanvasObjects());
                }
            } catch (e) { console.error('Undo error:', e); isLoadingRef.current = false; }
        },

        redo: () => {
            if (!fabricRef.current || historyIndexRef.current >= historyRef.current.length - 1) return;
            historyIndexRef.current++;
            isLoadingRef.current = true;
            try {
                const state = JSON.parse(historyRef.current[historyIndexRef.current]);
                if (state.connections) connectionsRef.current = state.connections;
                const objectsToClear = fabricRef.current.getObjects().filter((obj: any) => !obj.isGrid);
                objectsToClear.forEach(obj => fabricRef.current?.remove(obj));
                if (state.objects && state.objects.length > 0) {
                    fabric.util.enlivenObjects(state.objects).then((objects: any[]) => {
                        objects.forEach(obj => fabricRef.current?.add(obj));
                        fabricRef.current?.renderAll();
                        isLoadingRef.current = false;
                        updateConnectionLines();
                        updateMinimap();
                        callbacksRef.current.onObjectsChange?.(getCanvasObjects());
                    });
                } else {
                    isLoadingRef.current = false;
                    fabricRef.current.renderAll();
                    callbacksRef.current.onObjectsChange?.(getCanvasObjects());
                }
            } catch (e) { console.error('Redo error:', e); isLoadingRef.current = false; }
        },

        setActiveTool: (tool: CanvasTool) => { activeToolRef.current = tool; setActiveToolState(tool); if (tool !== 'connect') { connectingFromRef.current = null; setConnectingFrom(null); } },
        setBrushColor: (color: string) => { brushColorRef.current = color; if (fabricRef.current?.freeDrawingBrush) { fabricRef.current.freeDrawingBrush.color = color; } },
        setBrushWidth: (width: number) => { brushWidthRef.current = width; if (fabricRef.current?.freeDrawingBrush) { fabricRef.current.freeDrawingBrush.width = width; } },
        setTextColor: (color: string) => { textColorRef.current = color; const active = fabricRef.current?.getActiveObject(); if (active && (active.type === 'i-text' || active.type === 'text')) { (active as fabric.IText).set('fill', color); fabricRef.current?.renderAll(); } },
        setShapeColor: (color: string) => { shapeColorRef.current = color; },
        panBy: (dx: number, dy: number) => { if (!fabricRef.current) return; const vpt = fabricRef.current.viewportTransform; if (vpt) { vpt[4] += dx; vpt[5] += dy; fabricRef.current.setViewportTransform(vpt); drawGrid(); } },
        getConnections: () => [...connectionsRef.current],
        getObjectById: (id: string) => fabricRef.current?.getObjects().find((o: any) => o.id === id) || null
    }), [generateId, getCanvasObjects, saveState, updateConnectionLines, updateMinimap, drawGrid, deleteSelectedObjects, deleteObjectById, toggleVisibility, toggleLock]);

    return (
        <div
            ref={containerRef}
            className="infinite-canvas-container w-full h-full relative overflow-hidden"
            style={{ backgroundColor, cursor: activeTool === 'pan' ? 'grab' : activeTool === 'brush' || activeTool === 'highlighter' ? 'crosshair' : activeTool === 'eraser' ? 'not-allowed' : activeTool === 'connect' ? (connectingFrom ? 'cell' : 'crosshair') : 'default' }}
        >
            <canvas ref={canvasRef} />

            {/* Minimap */}
            <div className="absolute bottom-4 right-4 border rounded-lg overflow-hidden shadow-lg" style={{ backgroundColor: '#1B263B', borderColor: '#3D4A5D' }}>
                <canvas ref={minimapCanvasRef} width={150} height={100} className="block" />
                <div className="text-center py-1 text-xs border-t" style={{ color: creamPrimary, borderColor: '#3D4A5D' }}>{Math.round(currentZoom * 100)}%</div>
            </div>

            {/* Connecting indicator */}
            {connectingFrom && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg" style={{ backgroundColor: '#DC2626', color: 'white' }}>
                    Click another element • ESC to cancel
                </div>
            )}

            {/* Eraser hint */}
            {activeTool === 'eraser' && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg" style={{ backgroundColor: '#6B7280', color: 'white' }}>
                    Click on brush/pencil strokes to erase
                </div>
            )}
        </div>
    );
});

InfiniteCanvas.displayName = 'InfiniteCanvas';
export default InfiniteCanvas;
