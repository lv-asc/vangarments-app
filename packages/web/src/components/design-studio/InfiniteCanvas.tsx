'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback, useState } from 'react';
import * as fabric from 'fabric';
import { Layer, LayerType, createLayer, generateLayerId } from './Layer';

// Types
export interface CanvasObject {
    id: string;
    type: string;
    name: string;
    locked: boolean;
    visible: boolean;
    color?: string;
    comments?: CanvasComment[];
}

export interface CanvasComment {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    createdAt: string;
    replies?: CanvasComment[];
}

export interface ConnectionData {
    id: string;
    fromId: string;
    toId: string;
    color: string;
}

export type CanvasTool = 'select' | 'pan' | 'text' | 'brush' | 'eraser' | 'sticky' | 'connect' | 'image' | 'shape' | 'comment' | 'highlighter' | 'link_tool';



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

export interface InfiniteCanvasRef {
    canvas: fabric.Canvas | null;
    addText: (text: string, color?: string, font?: string) => void;
    addImage: (url: string, isFileCard?: boolean, fileData?: { name: string; type: string; id: string }) => void;
    addStickyNote: (color: string) => void;
    addCommentMarker: (x: number, y: number, initialComment?: CanvasComment, parentId?: string | null) => void;
    addShape: (type: 'rect' | 'circle' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'line', fillColor?: string | null, strokeColor?: string, strokeWidth?: number) => void;
    setBrushColor: (color: string) => void;
    setBrushWidth: (width: number) => void;
    setTextColor: (color: string) => void;
    addLinkCard: (url: string, x: number, y: number) => void;
    addLinkPlaceholder: (x: number, y: number) => void;
    setShapeColor: (color: string) => void;
    setShapeStrokeColor: (color: string) => void;
    setShapeStrokeWidth: (width: number) => void;
    setEraserSize: (size: number) => void;
    getEraserSize: () => number;
    setActiveTool: (tool: CanvasTool) => void;
    deleteSelected: () => void;
    deleteObjectById: (id: string) => void;
    undo: () => void;
    redo: () => void;
    resetView: () => void;
    setZoom: (zoom: number) => void;
    getZoom: () => number;
    exportToPNG: () => string | null;
    exportToJSON: () => any;
    loadFromJSON: (json: any) => void;
    clear: () => void;
    panBy: (dx: number, dy: number) => void;
    getConnections: () => ConnectionData[];
    addConnection: (fromId: string, toId: string, color?: string) => void;
    getObjectById: (id: string) => any;
    toggleVisibility: (id: string) => void;
    toggleLock: (id: string) => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;

    // Layer management methods
    getLayers: () => Layer[];
    getActiveLayer: () => Layer | null;
    setActiveLayer: (id: string) => void;
    addLayer: (name?: string, type?: LayerType) => Layer;
    deleteLayer: (id: string) => void;
    toggleLayerVisibility: (id: string) => void;
    toggleLayerLock: (id: string) => void;
    renameLayer: (id: string, name: string) => void;
    reorderLayers: (layerIds: string[]) => void;

    // File Card
    toggleFileCardFrame: () => void;
}

// Theme colors
const navyPrimary = '#0D1B2A';
const creamPrimary = '#F5F1E8';

// Sticky note colors with darker shades for folded corner
const STICKY_COLORS: Record<string, { main: string; fold: string }> = {
    yellow_light: { main: '#FEF9C3', fold: '#FEF08A' },
    yellow_dark: { main: '#FDE047', fold: '#EAB308' },
    orange: { main: '#FED7AA', fold: '#FB923C' },
    salmon: { main: '#FCA5A5', fold: '#F87171' },
    pink_light: { main: '#FCE7F3', fold: '#FBCFE8' },
    pink_dark: { main: '#F472B6', fold: '#DB2777' },
    blue_light: { main: '#BFDBFE', fold: '#93C5FD' },
    purple: { main: '#C084FC', fold: '#A855F7' },
    cyan: { main: '#67E8F9', fold: '#22D3EE' },
    blue_dark: { main: '#60A5FA', fold: '#3B82F6' },
    teal: { main: '#5EEAD4', fold: '#2DD4BF' },
    green: { main: '#4ADE80', fold: '#22C55E' },
    lime_light: { main: '#D9F99D', fold: '#BEF264' },
    lime_dark: { main: '#A3E635', fold: '#84CC16' },
    white: { main: '#FFFFFF', fold: '#E5E7EB' },
    black: { main: '#000000', fold: '#1F2937' }
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
    const shapeColorRef = useRef<string | null>('#3B82F6');
    const shapeStrokeColorRef = useRef('#000000'); // Added ref for shape stroke color
    const shapeStrokeWidthRef = useRef(2); // Added ref for shape stroke width
    const stickyColorRef = useRef('yellow_light');
    const activeToolRef = useRef<CanvasTool>('select');
    const connectingFromRef = useRef<string | null>(null);
    const isPanningRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    // Shape creation state
    const isCreatingShapeRef = useRef(false);
    const shapeTypeRef = useRef<'rect' | 'circle' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'line' | null>(null);
    const shapeStartPointRef = useRef<{ x: number; y: number } | null>(null);
    const tempShapeRef = useRef<fabric.Object | null>(null);
    const callbacksRef = useRef({ onSelectionChange, onObjectsChange, onModified, onZoomChange, onToolChange, onFileDoubleClick, onObjectSelected });

    const [currentZoom, setCurrentZoom] = useState(1);
    const [activeTool, setActiveToolState] = useState<CanvasTool>('select');
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const cursorPosRef = useRef<{ x: number; y: number } | null>(null);
    const eraserCursorRef = useRef<HTMLDivElement>(null);
    const [eraserSize, setEraserSize] = useState(30);
    const isErasingRef = useRef(false);
    const lastEraserPointRef = useRef<{ x: number; y: number } | null>(null);
    // Drawing layer for brush strokes - enables true pixel erasing
    const drawingLayerRef = useRef<HTMLCanvasElement | null>(null);
    const drawingLayerImageRef = useRef<fabric.FabricImage | null>(null);
    // Input invisível para capturar paste
    const pasteInputRef = useRef<HTMLTextAreaElement>(null);

    // Helper to update selected object position in screen coordinates
    const updateSelectionPosition = useCallback(() => {
        if (!fabricRef.current) return;
        const activeObject = fabricRef.current.getActiveObject();
        if (activeObject && !(activeObject as any).isCommentMarker) {
            // Get absolute coordinates on canvas
            const center = activeObject.getCenterPoint();
            const boundingRect = activeObject.getBoundingRect();

            // Convert to screen coordinates
            // We need to account for canvas viewport transform (zoom/pan)
            const vpt = fabricRef.current.viewportTransform || [1, 0, 0, 1, 0, 0];
            const zoom = fabricRef.current.getZoom();

            // Calculate screen coordinates of the object's top-center
            // (vpt[4], vpt[5]) is the pan offset
            // vpt[0] and vpt[3] are scale factors (zoom)

            // The object's top-center in canvas/scene coordinates (unzoomed/unpanned)
            // Note: getBoundingRect() returns values in scene coordinates if not transformed,
            // but fabric's behaviour depends on version.
            // Let's use getCoords() for precision if needed, but getBoundingRect is usually fine for axis-aligned.
            // Actually, let's use the canvas viewport transform to project the scene point to screen point.

            // Scene Point (center top of object)
            const sceneX = center.x;
            const sceneY = boundingRect.top;

            // Convert to Screen Point (relative to canvas element)
            const screenX = sceneX * vpt[0] + vpt[4];
            const screenY = sceneY * vpt[3] + vpt[5];

            // Add canvas element's offset on the page
            const canvasRect = fabricRef.current.getElement().getBoundingClientRect();

            const finalX = canvasRect.left + screenX;
            const finalY = canvasRect.top + screenY;

            callbacksRef.current.onObjectSelected?.(activeObject, { x: finalX, y: finalY });
        }
    }, []);

    // Photoshop-style layer system
    const layersRef = useRef<Layer[]>([]);
    const activeLayerIdRef = useRef<string>('');
    const [layers, setLayers] = useState<Layer[]>([]);
    const [activeLayerId, setActiveLayerId] = useState<string>('');

    useEffect(() => {
        callbacksRef.current = { onSelectionChange, onObjectsChange, onModified, onZoomChange, onToolChange, onFileDoubleClick, onObjectSelected };
    }, [onSelectionChange, onObjectsChange, onModified, onZoomChange, onToolChange, onFileDoubleClick, onObjectSelected]);

    const generateId = useCallback(() => `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, []);

    const getCanvasObjects = useCallback((): CanvasObject[] => {
        if (!fabricRef.current) return [];
        return fabricRef.current.getObjects()
            .filter((obj: any) => !obj.isGrid && !obj.isConnection && !obj.isPin && !obj.isCommentMarker && obj.name !== 'Eraser Stroke' && !obj.isDrawingLayer)
            .map((obj: any, index: number) => ({
                id: obj.id || `object_${index}`,
                type: obj.type || 'object',
                name: obj.name || `${obj.type || 'Object'} ${index + 1}`,
                locked: !!(obj.lockMovementX && obj.lockMovementY),
                visible: obj.visible !== false,
                color: obj.stickyColor,
                comments: obj.comments
            })).reverse();
    }, []);

    const saveState = useCallback(() => {
        if (!fabricRef.current || isLoadingRef.current) return;
        try {
            const objectsToSave = fabricRef.current.getObjects().filter((obj: any) => !obj.isGrid && !obj.isConnection && !obj.isPin);
            const jsonData = {
                objects: objectsToSave.map((obj: any) => obj.toObject(['id', 'name', 'isSticky', 'stickyColor', 'isFileCard', 'fileData', 'isStickyBg', 'isStickyFold', 'isCommentMarker', 'comments'])),
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

    // --- Link Tool Helpers ---

    // YouTube ID extraction helper
    const getYoutubeId = (url: string): string | null => {
        // Handle various YouTube URL formats:
        // - https://www.youtube.com/watch?v=VIDEO_ID
        // - https://youtu.be/VIDEO_ID
        // - https://www.youtube.com/embed/VIDEO_ID
        // - https://m.youtube.com/watch?v=VIDEO_ID
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    };

    // YouTube Card Creator - Elegant Design
    const createVideoEmbed = useCallback((videoId: string, x: number, y: number) => {
        if (!fabricRef.current) return;

        const cardWidth = 400;
        const padding = 16;
        const headerHeight = 48;
        const thumbnailHeight = 225; // 16:9 ratio for 400px width
        const cardHeight = headerHeight + thumbnailHeight;

        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        const proxiedThumbnailUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(thumbnailUrl)}`;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const youtubeLogoUrl = 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg';
        const proxiedLogoUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(youtubeLogoUrl)}`;

        // For Group with originX/Y: 'center', elements are positioned relative to center
        // Offset from center (group will be centered, so offset by -half dimensions)
        const offsetX = -cardWidth / 2;
        const offsetY = -cardHeight / 2;

        // Container Base - White card with rounded corners
        const container = new fabric.Rect({
            width: cardWidth,
            height: cardHeight,
            fill: '#ffffff',
            rx: 12,
            ry: 12,
            left: offsetX,
            top: offsetY,
            originX: 'left',
            originY: 'top'
        });

        // Header background (subtle gray)
        const headerBg = new fabric.Rect({
            width: cardWidth,
            height: headerHeight,
            fill: '#f9fafb',
            left: offsetX,
            top: offsetY,
            originX: 'left',
            originY: 'top',
            rx: 12,
            ry: 0 // Only round top corners
        });

        // YouTube domain text
        const domainText = new fabric.IText('youtube.com', {
            fontSize: 14,
            fill: '#4b5563',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '500',
            left: offsetX + padding + 28, // Space for logo
            top: offsetY + (headerHeight / 2),
            originX: 'left',
            originY: 'center',
            selectable: false
        });

        // Load YouTube logo
        const loadYoutubeLogo = () => {
            return fabric.FabricImage.fromURL(proxiedLogoUrl, { crossOrigin: 'anonymous' })
                .then((logoImg: any) => {
                    const logoSize = 20;
                    const scale = logoSize / Math.max(logoImg.width, logoImg.height);
                    const offsetX = -cardWidth / 2;
                    const offsetY = -cardHeight / 2;
                    logoImg.set({
                        scaleX: scale,
                        scaleY: scale,
                        left: offsetX + padding,
                        top: offsetY + (headerHeight / 2),
                        originX: 'left',
                        originY: 'center',
                        selectable: false
                    });
                    return logoImg;
                })
                .catch(() => {
                    // Fallback: Red circle with play icon
                    const offsetX = -cardWidth / 2;
                    const offsetY = -cardHeight / 2;
                    const fallbackLogo = new fabric.Circle({
                        radius: 10,
                        fill: '#ff0000',
                        left: offsetX + padding,
                        top: offsetY + (headerHeight / 2),
                        originX: 'left',
                        originY: 'center',
                        selectable: false
                    });
                    return fallbackLogo;
                });
        };

        // Load thumbnail
        const loadThumbnail = () => {
            return fabric.FabricImage.fromURL(proxiedThumbnailUrl, { crossOrigin: 'anonymous' })
                .then((thumbImg: any) => {
                    const scale = cardWidth / (thumbImg.width || cardWidth);
                    const offsetX = -cardWidth / 2;
                    const offsetY = -cardHeight / 2;
                    thumbImg.set({
                        scaleX: scale,
                        scaleY: scale,
                        left: offsetX,
                        top: offsetY + headerHeight,
                        originX: 'left',
                        originY: 'top',
                        selectable: false
                    });
                    return thumbImg;
                })
                .catch(() => {
                    // Fallback: Gray placeholder
                    const offsetX = -cardWidth / 2;
                    const offsetY = -cardHeight / 2;
                    const fallbackThumb = new fabric.Rect({
                        width: cardWidth,
                        height: thumbnailHeight,
                        fill: '#e5e7eb',
                        left: offsetX,
                        top: offsetY + headerHeight,
                        originX: 'left',
                        originY: 'top'
                    });
                    return fallbackThumb;
                });
        };

        // Create play button overlay
        const createPlayButton = () => {
            const offsetX = -cardWidth / 2;
            const offsetY = -cardHeight / 2;

            const playCircle = new fabric.Circle({
                radius: 30,
                fill: '#ffffff',
                opacity: 0.9,
                left: 0, // Center of group
                top: offsetY + headerHeight + (thumbnailHeight / 2),
                originX: 'center',
                originY: 'center',
                selectable: false,
                shadow: new fabric.Shadow({
                    color: 'rgba(0,0,0,0.3)',
                    blur: 15,
                    offsetX: 0,
                    offsetY: 3
                })
            });

            const playTriangle = new fabric.Path('M 0 -10 L 0 10 L 15 0 Z', {
                fill: '#ff0000',
                left: 3, // Slight offset from center for visual centering
                top: offsetY + headerHeight + (thumbnailHeight / 2),
                originX: 'center',
                originY: 'center',
                selectable: false
            });

            return [playCircle, playTriangle];
        };

        // Assemble the card
        Promise.all([loadYoutubeLogo(), loadThumbnail()]).then(([logo, thumbnail]) => {
            if (!fabricRef.current) return;

            const [playCircle, playTriangle] = createPlayButton();

            // Create the complete card group
            const youtubeCard = new fabric.Group(
                [container, headerBg, logo, domainText, thumbnail, playCircle, playTriangle],
                {
                    left: x,
                    top: y,
                    originX: 'center',
                    originY: 'center',
                    shadow: new fabric.Shadow({
                        color: 'rgba(0,0,0,0.12)',
                        blur: 24,
                        offsetX: 0,
                        offsetY: 4
                    })
                }
            );

            // Add metadata
            const embedId = generateId();
            (youtubeCard as any).id = embedId;
            (youtubeCard as any).name = 'video_embed';
            (youtubeCard as any).videoId = videoId;
            (youtubeCard as any).videoUrl = videoUrl;
            (youtubeCard as any).layerId = activeLayerIdRef.current;

            // Add to active layer
            const currentLayer = layersRef.current.find(l => l.id === activeLayerIdRef.current);
            if (currentLayer) {
                currentLayer.objectIds.push(embedId);
            }

            // Add to canvas
            fabricRef.current.add(youtubeCard);
            fabricRef.current.setActiveObject(youtubeCard);
            fabricRef.current.requestRenderAll();

            saveState();
        }).catch((err: any) => {
            console.error('Failed to create YouTube card:', err);

            // Ultra-simple fallback
            const fallbackCard = new fabric.Rect({
                width: cardWidth,
                height: 200,
                fill: '#fee2e2',
                stroke: '#ef4444',
                strokeWidth: 2,
                rx: 12,
                ry: 12,
                left: x,
                top: y,
                originX: 'center',
                originY: 'center'
            });

            const fallbackText = new fabric.IText('YouTube Video\n(Failed to load)', {
                fontSize: 16,
                fill: '#dc2626',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                left: x,
                top: y,
                originX: 'center',
                originY: 'center'
            });

            const fallbackGroup = new fabric.Group([fallbackCard, fallbackText], {
                left: x,
                top: y,
                originX: 'center',
                originY: 'center'
            });

            const embedId = generateId();
            (fallbackGroup as any).id = embedId;
            (fallbackGroup as any).name = 'video_embed';
            (fallbackGroup as any).videoId = videoId;
            (fallbackGroup as any).videoUrl = videoUrl;
            (fallbackGroup as any).layerId = activeLayerIdRef.current;

            const currentLayer = layersRef.current.find(l => l.id === activeLayerIdRef.current);
            if (currentLayer) {
                currentLayer.objectIds.push(embedId);
            }

            if (fabricRef.current) {
                fabricRef.current.add(fallbackGroup);
                fabricRef.current.setActiveObject(fallbackGroup);
                fabricRef.current.requestRenderAll();
            }

            saveState();
        });
    }, [generateId, saveState]);
    const createLinkCard = useCallback((inputUrl: string, x: number, y: number) => {
        if (!fabricRef.current) return;

        // Helper to safely extract hostname from various URL formats
        const getSafeHostname = (inputUrl: string): string => {
            try {
                // Try parsing as-is first
                return new URL(inputUrl).hostname;
            } catch (e) {
                // If failed, try adding https://
                try {
                    return new URL('https://' + inputUrl).hostname;
                } catch (e2) {
                    // Final fallback - try to extract domain manually
                    const match = inputUrl.match(/(?:https?:\/\/)?(?:www\.)?([^\/\?#]+)/i);
                    return match ? match[1] : 'google.com';
                }
            }
        };

        try {
            // Ensure protocol exists for URL parsing
            let url = inputUrl.trim();
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }

            // Extract clean hostname with fallback protection
            const domain = getSafeHostname(url);

            // Google blocks direct canvas access - use allorigins proxy
            const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(googleUrl)}`;

            console.log('🔗 Creating Link Card (Optimistic UI):', {
                inputUrl,
                url,
                domain,
                proxyUrl
            });

            const height = 48;
            const iconSize = 24;
            const padding = 12;

            // ============================================
            // PASO 1: Crear card INMEDIATO con placeholder
            // ============================================

            // Placeholder icon - círculo gris claro
            const placeholderIcon = new fabric.Circle({
                radius: iconSize / 2,
                fill: '#E5E7EB', // Gray-200
                originX: 'center',
                originY: 'center',
                left: padding + iconSize / 2,
                top: 0
            });
            (placeholderIcon as any).isPlaceholder = true;

            const textObj = new fabric.Text(domain, {
                fontFamily: 'Inter, sans-serif',
                fontSize: 16,
                fill: '#2563EB',
                underline: true,
                originX: 'left',
                originY: 'center',
                left: padding + iconSize + 8,
                top: 0
            });

            const totalWidth = padding + iconSize + 8 + (textObj.width || 100) + padding * 2;

            const background = new fabric.Rect({
                width: totalWidth,
                height: height,
                rx: height / 2,
                ry: height / 2,
                fill: '#FFFFFF',
                stroke: '#E5E7EB',
                strokeWidth: 1,
                originX: 'center',
                originY: 'center',
                shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.05)', blur: 10, offsetX: 0, offsetY: 4 })
            });

            const halfWidth = totalWidth / 2;
            placeholderIcon.set({ left: -halfWidth + padding + iconSize / 2, top: 0 });
            textObj.set({ left: -halfWidth + padding + iconSize + 8, top: 0 });

            const linkCard = new fabric.Group([background, placeholderIcon, textObj], {
                left: x,
                top: y,
                originX: 'center',
                originY: 'center',
                subTargetCheck: false,
                hoverCursor: 'pointer'
            });

            const id = generateId();
            (linkCard as any).id = id;
            (linkCard as any).name = 'Link Card';
            (linkCard as any).isLinkCard = true;
            (linkCard as any).url = url;
            (linkCard as any).domain = domain;

            // Añadir al canvas INMEDIATAMENTE
            fabricRef.current.add(linkCard);
            fabricRef.current.setActiveObject(linkCard);
            fabricRef.current.requestRenderAll();
            saveState();

            callbacksRef.current.onObjectsChange?.(getCanvasObjects());
            callbacksRef.current.onObjectSelected?.(linkCard, { x, y });

            console.log('✅ Card created immediately with placeholder');

            // ============================================
            // PASO 2: Cargar favicon en background
            // ============================================

            console.log('Hostname:', domain);

            // Fallback generic icon (simple chain link icon in gray)
            const genericLinkIconComp = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAABxklEQVR4nO2ZwU4CMRCG/w1e9CDGxJM38eTR9GD06MmbF08enz141EQTjTEaE40mQOhtt1uszbSlBdrup/wTTOhM+5tpO0MppZRSSimllNJCjGkC8AG8A1gDeAfwBmA9xrilE4BvA/AA4LEd3wM40gq9BfAB4KkdPwB40wm9BfABoO7G3+qE3gL4AnDtxt/phN4C+AZw48bf6oTeAvgB0HTj73RCbwF8A2i58Xc6obcAPgE03fgbndBbAN8Amm78rU7oLYADgIsbf6cTegvga8D/L7/SCb0F8A2g5sbf6oTeAvgGcCv8/9d36ITeAvgE4P8X/+uE3gL4BnAr/f/XN+mE3gL4AmD9F//rnN4C+AbwIPz/1zfqhN4C+AIw9v9/oRN6C+AbwK3w/1/foBN6C+ALwNj/n+uE3gL4BnAr/P/X1+mE3gL4AjD2/+c6obcAvgHcCv//9XU6obcAvgCM/f+5TugtgG8At8L/f32dTugtgC8AY/+f64TeAvgGcCv8/9fX6YS+tEC3O38G8AzgAcAzgG8A6xjjliYAnwDeAKwBvAF4AzCMMU5ppZRSSimllNLfkx+s056hW+h83AAAAABJRU5ErkJggg==';

            // Provider URLs
            const ddgUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
            const proxyDdgUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(ddgUrl)}`;

            // Helper to get Global Position for reliable .add()
            const getIconGlobalPosition = () => {
                const halfWidth = (linkCard.width || 200) / 2;
                const localX = -halfWidth + 12;
                const localY = 0;
                const matrix = (linkCard as any).calcTransformMatrix();
                return (fabric as any).util.transformPoint(new fabric.Point(localX, localY), matrix);
            };

            const setupIcon = (img: any) => {
                const p = getIconGlobalPosition();

                // Calculate proportional scale to fit in 24x24 box
                const maxDim = Math.max(img.width, img.height);
                const scaleFactor = 24 / maxDim;

                img.set({
                    left: p.x,
                    top: p.y,
                    originX: 'left',
                    originY: 'center',
                    scaleX: scaleFactor,
                    scaleY: scaleFactor
                    // No width/height set here, letting Fabric use natural scale
                });
                linkCard.add(img);
                linkCard.set('dirty', true);
                fabricRef.current?.requestRenderAll();
            };

            const loadFallbackPath = () => {
                if (!fabricRef.current || !linkCard) return;
                console.warn('Fallback Image failed, using Vector Path.');
                linkCard.remove(placeholderIcon); // Ensure removed

                const p = getIconGlobalPosition();
                const linkIcon = new fabric.Path('M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14', {
                    fill: '',
                    stroke: '#2563EB',
                    strokeWidth: 2,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    scaleX: 1.2,
                    scaleY: 1.2,
                    originX: 'left',
                    originY: 'center',
                    left: p.x,
                    top: p.y
                });
                linkCard.add(linkIcon);
                linkCard.set('dirty', true);
                fabricRef.current?.requestRenderAll();
            };

            const loadFallbackImage = () => {
                console.log('Attempting Fallback Image...');
                fabric.Image.fromURL(genericLinkIconComp, { crossOrigin: 'anonymous' }).then((img: any) => {
                    if (!fabricRef.current || !linkCard || !img) {
                        loadFallbackPath();
                        return;
                    }
                    linkCard.remove(placeholderIcon);
                    setupIcon(img);
                }).catch(() => {
                    loadFallbackPath();
                });
            };

            // 2. Google Provider (Backup)
            const loadGoogleFavicon = () => {
                fabric.Image.fromURL(proxyUrl, { crossOrigin: 'anonymous' }).then((img: any) => {
                    if (!fabricRef.current || !linkCard || !img || img.width === 0) {
                        loadFallbackImage();
                        return;
                    }
                    linkCard.remove(placeholderIcon);
                    setupIcon(img);
                }).catch((err: any) => {
                    console.warn('Google Favicon failed:', err);
                    loadFallbackImage();
                });
            };

            // 1. DuckDuckGo Provider (Primary)
            console.log(`Attempting DDG Favicon: ${proxyDdgUrl}`);
            fabric.Image.fromURL(proxyDdgUrl, { crossOrigin: 'anonymous' }).then((img: any) => {
                if (!fabricRef.current || !linkCard || !img || img.width === 0) {
                    loadGoogleFavicon();
                    return;
                }
                linkCard.remove(placeholderIcon);
                setupIcon(img);
            }).catch((err: any) => {
                console.warn('DDG Favicon network error:', err);
                loadGoogleFavicon();
            });
        } catch (e) {
            console.error('❌ Invalid URL:', e);
        }
    }, [generateId, saveState, getCanvasObjects]);

    const createLinkPlaceholder = useCallback((x: number, y: number) => {
        if (!fabricRef.current) return;
        const width = 240; const height = 48;
        const bg = new fabric.Rect({
            width: width, height: height, rx: 24, ry: 24,
            fill: '#F3F4F6', stroke: '#9CA3AF', strokeWidth: 2, strokeDashArray: [6, 6],
            originX: 'center', originY: 'center'
        });
        const text = new fabric.Text('Cole seu link aqui (Ctrl+V)', {
            fontFamily: 'Inter, sans-serif', fontSize: 14, fill: '#6B7280', originX: 'center', originY: 'center'
        });
        const placeholder = new fabric.Group([bg, text], {
            left: x, top: y, originX: 'center', originY: 'center',
            subTargetCheck: false, hoverCursor: 'pointer'
        });
        const id = generateId();
        (placeholder as any).id = id; (placeholder as any).name = 'Link Placeholder'; (placeholder as any).isLinkPlaceholder = true;
        fabricRef.current.add(placeholder); fabricRef.current.setActiveObject(placeholder); fabricRef.current.requestRenderAll();
        saveState();
        callbacksRef.current.onObjectsChange?.(getCanvasObjects());
        callbacksRef.current.onObjectSelected?.(placeholder, { x, y });
    }, [generateId, saveState, getCanvasObjects]);

    const createStickyNote = useCallback((centerX: number, centerY: number, color: string) => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        const colors = STICKY_COLORS[color] || STICKY_COLORS.yellow_light;

        const SIZE = 200;
        const PADDING = 16;
        const FOLD_SIZE = 28;
        const MAX_FONT_SIZE = 32;
        const MIN_FONT_SIZE = 10;
        const textColor = color === 'black' ? '#FFFFFF' : '#1F2937';

        const objId = generateId();

        // Background
        const bgPoints = [
            { x: 0, y: 0 },
            { x: SIZE - FOLD_SIZE, y: 0 },
            { x: SIZE, y: FOLD_SIZE },
            { x: SIZE, y: SIZE },
            { x: 0, y: SIZE }
        ];

        const background = new fabric.Polygon(bgPoints, {
            fill: colors.main,
            stroke: 'transparent',
            strokeWidth: 0,
            originX: 'left',
            originY: 'top',
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.2)',
                blur: 12,
                offsetX: 2,
                offsetY: 4
            })
        });

        // Fold
        const foldTriangle = new fabric.Polygon([
            { x: SIZE - FOLD_SIZE, y: 0 },
            { x: SIZE, y: FOLD_SIZE },
            { x: SIZE - FOLD_SIZE, y: FOLD_SIZE }
        ], {
            fill: colors.fold,
            stroke: 'transparent',
            strokeWidth: 0,
            originX: 'left',
            originY: 'top',
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.15)',
                blur: 4,
                offsetX: -1,
                offsetY: 1
            })
        });

        // Internal Text (Non-editable directly)
        const textObj = new fabric.Textbox('', {
            left: SIZE / 2,
            top: SIZE / 2,
            fontSize: MAX_FONT_SIZE,
            fontFamily: 'Shadows Into Light, Inter, Arial, sans-serif',
            fill: textColor,
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            width: SIZE - PADDING * 2,
            splitByGrapheme: true,
            editable: false,
            selectable: false,
            evented: false,
            lockScalingX: true,
            lockScalingY: true
        } as any);

        // Sticky State
        const stickyState = {
            size: SIZE,
            padding: PADDING,
            maxFontSize: MAX_FONT_SIZE,
            minFontSize: MIN_FONT_SIZE,
            objId: objId
        };

        // --- AutoFit Logic (Shared) ---
        // Adapts to scale if passed via manual sizing or implicit object scaling
        const autoFitText = (targetText: fabric.Textbox, manualCenterPoint?: { x: number, y: number }) => {
            const scaleX = targetText.scaleX || 1;
            const availableWidth = (stickyState.size - stickyState.padding * 2) * scaleX;
            // Logical width for textbox (it handles scale internally for visual) - wait, if we set width, it changes wrap.
            // If scale is applied, width should be logical width.
            const logicalWidth = stickyState.size - stickyState.padding * 2;

            targetText.set('width', logicalWidth);

            if (!targetText.text || targetText.text.length === 0) {
                targetText.set('fontSize', stickyState.maxFontSize);
                if (manualCenterPoint) {
                    const scaleY = targetText.scaleY || 1;
                    // Visual height might be line height if empty? Or 0.
                    // Use approx height of one line at max font
                    const approxHeight = (targetText.calcTextHeight?.() || stickyState.maxFontSize) * scaleY;
                    targetText.set('top', manualCenterPoint.y - (approxHeight / 2));
                }
                return;
            }

            const availableHeight = stickyState.size - stickyState.padding * 2; // Logical available height
            let low = stickyState.minFontSize;
            let high = stickyState.maxFontSize;
            let optimalSize = low;

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                targetText.set('fontSize', mid);
                // targetText.initDimensions(); // Recalc dimensions 
                // Fabric v6/v7 auto updates on set, but initDimensions safe.

                const logicalTextHeight = targetText.height || 0;

                // We compare logical heights because scaleY applies to both content and box similarly
                // (Assuming targetText has same scale as parent container)
                if (logicalTextHeight <= availableHeight) {
                    optimalSize = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }

            targetText.set('fontSize', optimalSize);

            // Character Limit Check
            if (activeToolRef.current === 'sticky' || targetText.isEditing) {
                const logicalTextHeight = targetText.height || 0;
                if (logicalTextHeight > availableHeight) {
                    const txt = targetText.text || '';
                    if (txt.length > 0) {
                        targetText.set('text', txt.substring(0, txt.length - 1));
                        // Optional: Alert user (but avoid constant alerts)
                    }
                }
            }

            // Manual Vertical Centering for Overlay (Visual Coords)
            if (manualCenterPoint) {
                const finalScaleY = targetText.scaleY || 1;
                const finalHeight = (targetText.height || 0) * finalScaleY;
                targetText.set('top', manualCenterPoint.y - (finalHeight / 2));
                targetText.setCoords();
            }
        };

        // Create Group
        const stickyGroup = new fabric.Group([background, foldTriangle, textObj], {
            left: centerX,
            top: centerY,
            originX: 'center',
            originY: 'center',
            subTargetCheck: false, // Treat as single object
            interactive: true,
            transparentCorners: false,
            borderColor: '#3B82F6',
            cornerColor: '#3B82F6',
            cornerSize: 10,
            hasControls: true
        });

        (stickyGroup as any).lockUniScaling = true;
        (stickyGroup as any).id = objId;
        (stickyGroup as any).name = 'Sticky Note';
        (stickyGroup as any).isSticky = true;
        (stickyGroup as any).stickyColor = color;
        (stickyGroup as any).layerId = activeLayerIdRef.current;
        (stickyGroup as any)._stickyState = stickyState;

        // Scaling Handler
        stickyGroup.on('scaling', () => {
            const scaleX = stickyGroup.scaleX || 1;
            stickyGroup.set('scaleY', scaleX);
        });

        // --- Enter Edit Mode (Overlay) ---
        const enterEditMode = () => {
            console.log('Entering Edit Mode (Unified)');
            // 1. Get Group Center in World Coords
            const matrix = stickyGroup.calcTransformMatrix();
            const centerLocal = new fabric.Point(0, 0);
            const centerWorld = fabric.util.transformPoint(centerLocal, matrix);

            // 2. Hide Internal Text
            textObj.set('opacity', 0);
            canvas.requestRenderAll();

            // 3. Create Overlay Textbox
            // We match the scale of the group
            const groupScaleX = stickyGroup.scaleX || 1;
            const groupScaleY = stickyGroup.scaleY || 1;

            const overlayText = new fabric.Textbox(textObj.text || '', {
                left: centerWorld.x,
                top: centerWorld.y,
                width: (stickyState.size - stickyState.padding * 2), // Width logic handled by scale? 
                // If we set scaleX, width should be logical.
                scaleX: groupScaleX,
                scaleY: groupScaleY,
                fontSize: textObj.fontSize || MAX_FONT_SIZE,
                fontFamily: textObj.fontFamily,
                fontWeight: textObj.fontWeight,
                fontStyle: textObj.fontStyle,
                underline: textObj.underline,
                linethrough: textObj.linethrough,
                fill: textColor,
                textAlign: 'center',
                originX: 'center',
                originY: 'top', // Important for stability
                splitByGrapheme: true,
                hasControls: false,
                lockMovementX: true,
                lockMovementY: true,
                selectable: false, // Overlay itself isn't draggable
                styles: JSON.parse(JSON.stringify(textObj.styles || {})) // Clone existing styles
            } as any);

            // Initial Fit & Center
            const updateOverlay = () => {
                autoFitText(overlayText, { x: centerWorld.x, y: centerWorld.y });
            };

            updateOverlay();

            // Events
            overlayText.on('changed', updateOverlay);

            // Sync Styles to Overlay if toolbar changes them externally (optional but good)
            // ...

            overlayText.on('editing:exited', () => {
                // Sync Back Text AND Styles
                textObj.set({
                    text: overlayText.text,
                    fontWeight: overlayText.fontWeight,
                    fontStyle: overlayText.fontStyle,
                    underline: overlayText.underline,
                    linethrough: overlayText.linethrough,
                    styles: JSON.parse(JSON.stringify(overlayText.styles || {})), // Important: Deep clone styles
                    opacity: 1
                });

                // Re-fit internal text (no visual center needed as group handles it)
                autoFitText(textObj);

                canvas.remove(overlayText);
                canvas.setActiveObject(stickyGroup);
                canvas.requestRenderAll();
                saveState();
            });

            canvas.add(overlayText);
            canvas.setActiveObject(overlayText);
            overlayText.enterEditing();
            overlayText.selectAll();
            canvas.requestRenderAll();
        };

        stickyGroup.on('mousedblclick', enterEditMode);

        canvas.add(stickyGroup);
        canvas.setActiveObject(stickyGroup);

        // Add to layer
        const currentLayer = layersRef.current.find(l => l.id === activeLayerIdRef.current);
        if (currentLayer) {
            currentLayer.objectIds.push(objId);
        }

        // Auto-enter edit mode on creation
        enterEditMode();

        saveState();
    }, [saveState, updateSelectionPosition]);

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
        const canvas = fabricRef.current;
        const cw = containerRef.current.offsetWidth;
        const ch = containerRef.current.offsetHeight;

        // Clear minimap
        ctx.fillStyle = navyPrimary;
        ctx.fillRect(0, 0, mw, mh);

        // Create a temporary canvas to render all objects
        try {
            // Save current viewport state
            const currentVpt = canvas.viewportTransform ? [...canvas.viewportTransform] : [1, 0, 0, 1, 0, 0];
            const currentZoom = canvas.getZoom();

            // Filter out grid, connections, pins for export
            const objectsToHide: any[] = [];
            canvas.getObjects().forEach((obj: any) => {
                if (obj.isGrid || obj.isConnection || obj.isPin || obj.name === 'Eraser Stroke') {
                    if (obj.visible !== false) {
                        objectsToHide.push(obj);
                        obj.visible = false;
                    }
                }
            });

            // Reset viewport for export
            canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
            canvas.setZoom(0.15); // Tiny zoom for thumbnail

            // Generate data URL
            const dataUrl = canvas.toDataURL({
                format: 'png',
                quality: 0.5,
                multiplier: 0.15
            });

            // Restore hidden objects
            objectsToHide.forEach(obj => { obj.visible = true; });

            // Restore viewport
            canvas.setViewportTransform(currentVpt as any);
            canvas.setZoom(currentZoom);

            // Draw data URL to minimap
            const img = new Image();
            img.onload = () => {
                ctx.fillStyle = navyPrimary;
                ctx.fillRect(0, 0, mw, mh);

                // Calculate scaling to fit in minimap
                const imgAspect = img.width / img.height;
                const mapAspect = mw / mh;
                let drawW, drawH, drawX, drawY;

                if (imgAspect > mapAspect) {
                    drawW = mw;
                    drawH = mw / imgAspect;
                    drawX = 0;
                    drawY = (mh - drawH) / 2;
                } else {
                    drawH = mh;
                    drawW = mh * imgAspect;
                    drawX = (mw - drawW) / 2;
                    drawY = 0;
                }

                ctx.drawImage(img, drawX, drawY, drawW, drawH);

                // Draw viewport rectangle
                const vpt = currentVpt;
                const viewLeft = -vpt[4] / currentZoom;
                const viewTop = -vpt[5] / currentZoom;
                const viewWidth = cw / currentZoom;
                const viewHeight = ch / currentZoom;

                // Scale viewport rectangle to minimap coords
                const scaleX = drawW / (img.width / 0.15);
                const scaleY = drawH / (img.height / 0.15);

                ctx.strokeStyle = '#22C55E';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    drawX + viewLeft * scaleX,
                    drawY + viewTop * scaleY,
                    viewWidth * scaleX,
                    viewHeight * scaleY
                );
            };
            img.src = dataUrl;
        } catch (e) {
            // Fallback to simple rectangles
            const objects = canvas.getObjects().filter((o: any) =>
                !o.isGrid && !o.isConnection && !o.isPin && o.name !== 'Eraser Stroke' && o.visible !== false
            );
            ctx.fillStyle = creamPrimary;
            objects.forEach(obj => {
                const b = obj.getBoundingRect();
                ctx.fillRect(b.left * 0.1, b.top * 0.1, Math.max(b.width * 0.1, 2), Math.max(b.height * 0.1, 2));
            });
        }
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

    // Map to store rasterized offscreen canvases for each brush stroke
    const strokeCanvasMapRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

    // Rasterize a single brush stroke to its own offscreen canvas
    const rasterizeBrushStroke = useCallback((brushObj: any) => {
        if (!fabricRef.current) return null;
        const canvas = fabricRef.current;

        // Get bounding rect of the brush stroke
        const bounds = brushObj.getBoundingRect();
        const padding = 10; // Extra padding for stroke width
        const width = Math.ceil(bounds.width + padding * 2);
        const height = Math.ceil(bounds.height + padding * 2);

        // Create offscreen canvas for this stroke
        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return null;

        // Clear and render the stroke
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        // Translate to account for the stroke position
        ctx.translate(-bounds.left + padding, -bounds.top + padding);
        brushObj.render(ctx);
        ctx.restore();

        // Store the canvas and position info
        const strokeId = brushObj.id;
        strokeCanvasMapRef.current.set(strokeId, offscreen);
        (brushObj as any)._rasterBounds = { left: bounds.left - padding, top: bounds.top - padding, width, height };

        return { canvas: offscreen, bounds: { left: bounds.left - padding, top: bounds.top - padding, width, height } };
    }, []);

    // Apply eraser to brush strokes that the cursor touches
    const applyEraserAtPoint = useCallback((clientX: number, clientY: number) => {
        if (!fabricRef.current || !containerRef.current) return;
        const canvas = fabricRef.current;

        // Get canvas element position
        const canvasEl = (canvas as any).lowerCanvasEl as HTMLCanvasElement;
        const rect = canvasEl.getBoundingClientRect();

        // Convert client coords to canvas coords (accounting for viewport transform)
        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;
        // Convert screen coords to canvas coords
        const canvasX = (screenX - vpt[4]) / vpt[0];
        const canvasY = (screenY - vpt[5]) / vpt[3];
        const radius = eraserSize / 2;

        // Get the active layer and its objects
        const activeLayer = layersRef.current.find(l => l.id === activeLayerIdRef.current);
        if (!activeLayer) return; // No active layer, don't erase anything

        // Find brush strokes that belong to the active layer only
        const brushObjects = canvas.getObjects().filter((obj: any) =>
            obj.name === 'Brush' && activeLayer.objectIds.includes(obj.id)
        );

        brushObjects.forEach((brushObj: any) => {
            try {
                const bounds = brushObj.getBoundingRect(true, true); // absolute coords

                // Check if eraser circle overlaps with stroke bounding box
                const closestX = Math.max(bounds.left, Math.min(canvasX, bounds.left + bounds.width));
                const closestY = Math.max(bounds.top, Math.min(canvasY, bounds.top + bounds.height));
                const distX = canvasX - closestX;
                const distY = canvasY - closestY;
                const distance = Math.sqrt(distX * distX + distY * distY);

                if (distance <= radius) {
                    // This stroke is being touched by the eraser
                    const strokeId = brushObj.id;

                    // Rasterize if not already done
                    if (!strokeCanvasMapRef.current.has(strokeId)) {
                        rasterizeBrushStroke(brushObj);
                    }

                    const offscreen = strokeCanvasMapRef.current.get(strokeId);
                    const rasterBounds = (brushObj as any)._rasterBounds;
                    if (!offscreen || !rasterBounds) return;

                    const ctx = offscreen.getContext('2d');
                    if (!ctx) return;

                    // Convert eraser position to offscreen canvas coords
                    const localX = canvasX - rasterBounds.left;
                    const localY = canvasY - rasterBounds.top;

                    // Apply destination-out to erase
                    ctx.save();
                    ctx.globalCompositeOperation = 'destination-out';

                    // Interpolate for smooth erasing
                    const lastPoint = (brushObj as any)._lastEraserPoint;
                    if (lastPoint) {
                        const dist = Math.sqrt((localX - lastPoint.x) ** 2 + (localY - lastPoint.y) ** 2);
                        const steps = Math.max(1, Math.ceil(dist / (radius / 3)));
                        for (let i = 0; i <= steps; i++) {
                            const t = i / steps;
                            const interpX = lastPoint.x + (localX - lastPoint.x) * t;
                            const interpY = lastPoint.y + (localY - lastPoint.y) * t;
                            ctx.beginPath();
                            ctx.arc(interpX, interpY, radius, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    } else {
                        ctx.beginPath();
                        ctx.arc(localX, localY, radius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                    (brushObj as any)._lastEraserPoint = { x: localX, y: localY };

                    // Update the brush object's render method to use the rasterized canvas
                    if (!(brushObj as any)._originalRender) {
                        (brushObj as any)._originalRender = brushObj.render.bind(brushObj);
                        brushObj.render = function (renderCtx: CanvasRenderingContext2D) {
                            const rb = this._rasterBounds;
                            const oc = strokeCanvasMapRef.current.get(this.id);
                            if (rb && oc) {
                                renderCtx.drawImage(oc, rb.left, rb.top);
                            } else {
                                this._originalRender(renderCtx);
                            }
                        };
                    }

                    // Force re-render
                    canvas.renderAll();
                }
            } catch (e) {
                // Skip objects that fail
            }
        });

        lastEraserPointRef.current = { x: screenX, y: screenY };
    }, [eraserSize, rasterizeBrushStroke]);

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

        // Initialize default layer if none exist
        if (layersRef.current.length === 0) {
            const defaultLayer = createLayer('Layer 1', 'drawing', 0);
            layersRef.current = [defaultLayer];
            activeLayerIdRef.current = defaultLayer.id;
            setLayers([defaultLayer]);
            setActiveLayerId(defaultLayer.id);
        }

        canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 20) zoom = 20;
            if (zoom < 0.01) zoom = 0.01;

            // Zoom at mouse position
            canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), zoom);

            opt.e.preventDefault();
            opt.e.stopPropagation();

            setCurrentZoom(zoom);
            drawGrid();
            updateMinimap();
            setCurrentZoom(zoom);
            drawGrid();
            updateMinimap();
            callbacksRef.current.onZoomChange?.(zoom);
            updateSelectionPosition();
        });

        canvas.on('mouse:down', (opt) => {
            const evt = opt.e as MouseEvent;
            if (evt.button === 2 || activeToolRef.current === 'pan') {
                isPanningRef.current = true;
                lastPointRef.current = { x: evt.clientX, y: evt.clientY };
                canvas.selection = false;
                canvas.setCursor('grabbing');
                evt.preventDefault();
                return;
            }

            // Eraser mode - just start erasing, rasterization happens per-stroke on demand
            if (activeToolRef.current === 'eraser') {
                isErasingRef.current = true;
                lastEraserPointRef.current = null;
                // Clear per-stroke last eraser points for clean start
                canvas.getObjects().forEach((o: any) => {
                    if (o.name === 'Brush') {
                        (o as any)._lastEraserPoint = null;
                    }
                });
                return;
            }

            if (activeToolRef.current === 'comment') {
                const pointer = (canvas as any).getScenePoint(opt.e);
                // Check if clicking on an object to attach comment to it
                const targetObject = opt.target;
                const parentId = targetObject && !(targetObject as any).isGrid && !(targetObject as any).isCommentMarker
                    ? (targetObject as any).id
                    : null;

                (ref as any).current?.addCommentMarker(pointer.x, pointer.y, undefined, parentId);
                setActiveToolState('select');
                activeToolRef.current = 'select';
                return;
            }

            if (activeToolRef.current === 'sticky') {
                const pointer = (opt as any).scenePoint || (canvas as any).getScenePoint(opt.e);
                createStickyNote(pointer.x, pointer.y, stickyColorRef.current);
                setActiveToolState('select');
                activeToolRef.current = 'select';
                canvas.setCursor('default');
                return;
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

            // Shape creation mode - start drag-to-create
            if (shapeTypeRef.current && !opt.target) {
                const pointer = (canvas as any).getScenePoint(opt.e);
                isCreatingShapeRef.current = true;
                shapeStartPointRef.current = { x: pointer.x, y: pointer.y };
                canvas.selection = false;
                return;
            }

            // Link Tool - Click to create placeholder
            if (activeToolRef.current === 'link_tool' && !opt.target) {
                const pointer = (canvas as any).getScenePoint(opt.e);
                createLinkPlaceholder(pointer.x, pointer.y);

                // Optional: Force focus to pasteInputRef to ensure paste works immediately
                pasteInputRef.current?.focus();

                // Should we switch back to select? 
                // Maybe keep it in link_tool until user selects something else?
                // For now, let's keep it in link_tool to allow creating multiple placeholders if needed
                // But typically user creates one and pastes.
                // Let's switch to select to allow user to immediately interact with the placeholder (which is selected)
                setActiveToolState('select');
                activeToolRef.current = 'select';
                canvas.defaultCursor = 'default';
                canvas.hoverCursor = 'move';
                canvas.selection = true;
                // Re-enable evented
                canvas.getObjects().forEach((obj: any) => { if (!obj.isGrid && !obj.isConnection && !obj.isPin) obj.evented = true; });
                return;
            }
        });

        canvas.on('mouse:move', (opt) => {
            const evt = opt.e as MouseEvent;

            // Handle cursor position for the eraser indicator (using ref + direct DOM)
            if (activeToolRef.current === 'eraser') {
                cursorPosRef.current = { x: evt.clientX, y: evt.clientY };
                if (eraserCursorRef.current) {
                    eraserCursorRef.current.style.left = `${evt.clientX}px`;
                    eraserCursorRef.current.style.top = `${evt.clientY}px`;
                    eraserCursorRef.current.style.display = 'block';
                }
                // Apply eraser while dragging
                if (isErasingRef.current) {
                    applyEraserAtPoint(evt.clientX, evt.clientY);
                }
            } else if (cursorPosRef.current !== null) {
                cursorPosRef.current = null;
                if (eraserCursorRef.current) {
                    eraserCursorRef.current.style.display = 'none';
                }
            }

            if (isPanningRef.current && lastPointRef.current) {
                const vpt = canvas.viewportTransform;
                if (vpt) {
                    vpt[4] += evt.clientX - lastPointRef.current.x;
                    vpt[5] += evt.clientY - lastPointRef.current.y;
                    lastPointRef.current = { x: evt.clientX, y: evt.clientY };
                    canvas.requestRenderAll();
                    canvas.requestRenderAll();
                    drawGrid();
                    updateMinimap();
                    updateSelectionPosition();
                }
            }

            // Shape creation - update dimensions while dragging
            if (isCreatingShapeRef.current && shapeStartPointRef.current && shapeTypeRef.current) {
                const pointer = (canvas as any).getScenePoint(opt.e);
                const startX = shapeStartPointRef.current.x;
                const startY = shapeStartPointRef.current.y;
                const currentX = pointer.x;
                const currentY = pointer.y;

                // Calculate dimensions and handle negative coordinates
                // The start point is ALWAYS one of the corners (anchor point)
                const width = Math.abs(currentX - startX);
                const height = Math.abs(currentY - startY);
                const left = Math.min(startX, currentX);
                const top = Math.min(startY, currentY);

                // Remove previous temporary shape if exists
                if (tempShapeRef.current) {
                    canvas.remove(tempShapeRef.current);
                    tempShapeRef.current = null;
                }

                // Only create shape if dragged at least 5 pixels
                if (width < 5 && height < 5) return;

                // Get styling from refs
                const fillColor = shapeColorRef.current === null ? 'transparent' : shapeColorRef.current;
                const strokeColor = shapeStrokeColorRef.current;
                const strokeWidth = shapeStrokeWidthRef.current;
                let shape: fabric.Object;

                switch (shapeTypeRef.current) {
                    case 'rect':
                        shape = new fabric.Rect({
                            left, top, width, height,
                            fill: fillColor,
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            rx: 4, ry: 4,
                            originX: 'left', originY: 'top',
                            selectable: false, evented: false,
                            erasable: false
                        } as any);
                        break;
                    case 'circle': {
                        const radius = Math.min(width, height) / 2;
                        // Circle should be positioned at top-left corner, not center
                        shape = new fabric.Circle({
                            left, top,
                            radius,
                            fill: fillColor,
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            originX: 'left', originY: 'top',
                            selectable: false, evented: false,
                            erasable: false
                        } as any);
                        break;
                    }
                    case 'triangle':
                        shape = new fabric.Triangle({
                            left, top, width, height,
                            fill: fillColor,
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            originX: 'left', originY: 'top',
                            selectable: false, evented: false,
                            erasable: false
                        } as any);
                        break;
                    case 'diamond': {
                        const points = [
                            { x: width / 2, y: 0 },
                            { x: width, y: height / 2 },
                            { x: width / 2, y: height },
                            { x: 0, y: height / 2 }
                        ];
                        shape = new fabric.Polygon(points, {
                            left, top,
                            fill: fillColor,
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            originX: 'left', originY: 'top',
                            selectable: false, evented: false,
                            erasable: false
                        } as any);
                        break;
                    }
                    case 'star': {
                        const centerX = width / 2;
                        const centerY = height / 2;
                        const outerRadius = Math.min(width, height) / 2;
                        const innerRadius = outerRadius / 2;
                        const starPoints = [];
                        for (let i = 0; i < 10; i++) {
                            const r = i % 2 === 0 ? outerRadius : innerRadius;
                            const angle = (Math.PI / 5) * i - Math.PI / 2;
                            starPoints.push({
                                x: centerX + r * Math.cos(angle),
                                y: centerY + r * Math.sin(angle)
                            });
                        }
                        shape = new fabric.Polygon(starPoints, {
                            left, top,
                            fill: fillColor,
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            originX: 'left', originY: 'top',
                            selectable: false, evented: false,
                            erasable: false
                        } as any);
                        break;
                    }
                    case 'arrow': {
                        const arrowWidth = width;
                        const arrowHeight = height;
                        const shaftHeight = arrowHeight * 0.4;
                        const headHeight = arrowHeight * 0.6;
                        const points = [
                            { x: 0, y: arrowHeight / 2 - shaftHeight / 2 },
                            { x: arrowWidth * 0.6, y: arrowHeight / 2 - shaftHeight / 2 },
                            { x: arrowWidth * 0.6, y: 0 },
                            { x: arrowWidth, y: arrowHeight / 2 },
                            { x: arrowWidth * 0.6, y: arrowHeight },
                            { x: arrowWidth * 0.6, y: arrowHeight / 2 + shaftHeight / 2 },
                            { x: 0, y: arrowHeight / 2 + shaftHeight / 2 }
                        ];
                        shape = new fabric.Polygon(points, {
                            left, top,
                            fill: fillColor,
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            originX: 'left', originY: 'top',
                            selectable: false, evented: false,
                            erasable: false
                        } as any);
                        break;
                    }
                    case 'line':
                        // Line uses absolute coordinates, not left/top
                        // For lines, use strokeColor as the line color
                        shape = new fabric.Line([startX, startY, currentX, currentY], {
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            selectable: false, evented: false,
                            erasable: false
                        } as any);
                        break;
                    default:
                        shape = new fabric.Rect({
                            left, top, width, height,
                            fill: fillColor,
                            stroke: strokeColor,
                            strokeWidth: strokeWidth,
                            originX: 'left', originY: 'top',
                            selectable: false, evented: false,
                            erasable: false
                        } as any);
                }

                (shape as any).isTemporaryShape = true;
                tempShapeRef.current = shape;
                canvas.add(shape);
                canvas.renderAll();
            }
        });

        canvas.on('mouse:up', () => {
            isPanningRef.current = false; lastPointRef.current = null;

            // Clear guides
            const guides = canvas.getObjects().filter((o: any) => o.isGuide);
            guides.forEach(g => canvas.remove(g));

            // Save state if we were erasing
            if (isErasingRef.current && activeToolRef.current === 'eraser') {
                saveState();
                callbacksRef.current.onModified?.();
            }
            isErasingRef.current = false;
            lastEraserPointRef.current = null; // Reset eraser stroke

            // Finalize shape creation
            if (isCreatingShapeRef.current && tempShapeRef.current) {
                const tempShape = tempShapeRef.current;

                // Remove temporary flag and make it selectable
                delete (tempShape as any).isTemporaryShape;
                tempShape.set({
                    selectable: true,
                    evented: true
                });

                // Add metadata
                (tempShape as any).id = generateId();
                (tempShape as any).name = shapeTypeRef.current!.charAt(0).toUpperCase() + shapeTypeRef.current!.slice(1);
                (tempShape as any).layerId = activeLayerIdRef.current;

                // Select the new shape
                canvas.setActiveObject(tempShape);
                canvas.renderAll();

                // Save state
                saveState();
                callbacksRef.current.onModified?.();

                // Reset shape creation state
                isCreatingShapeRef.current = false;
                shapeStartPointRef.current = null;
                tempShapeRef.current = null;
                shapeTypeRef.current = null;
                canvas.selection = true;
            } else if (isCreatingShapeRef.current) {
                // Shape was too small, just reset
                isCreatingShapeRef.current = false;
                shapeStartPointRef.current = null;
                shapeTypeRef.current = null;
                canvas.selection = true;
            }

            if (activeToolRef.current !== 'pan' && activeToolRef.current !== 'eraser') canvas.selection = true;
            canvas.setCursor('default'); updateMinimap();
        });

        canvas.on('mouse:down:before', (opt) => { if ((opt.e as MouseEvent).button === 2) opt.e.preventDefault(); });

        canvas.on('mouse:dblclick', (opt) => {
            if (opt.target) {
                if ((opt.target as any).isFileCard) {
                    const fileId = (opt.target as any).fileData?.id;
                    if (fileId) callbacksRef.current.onFileDoubleClick?.(fileId);
                } else if ((opt.target as any).isLinkCard) {
                    // Open link on double-click
                    const url = (opt.target as any).url;
                    if (url) {
                        window.open(url, '_blank');
                    }
                } else if ((opt.target as any).name === 'video_embed') {
                    // Open YouTube video on double-click
                    const videoUrl = (opt.target as any).videoUrl;
                    if (videoUrl) {
                        window.open(videoUrl, '_blank');
                    }
                } else if ((opt.target as any).isLinkPlaceholder) {
                    // Inline editing instead of prompt
                    const { left, top } = opt.target;

                    // Remove placeholder
                    canvas.remove(opt.target);

                    // Create temporary IText
                    const linkInput = new fabric.IText('https://', {
                        left: left,
                        top: top,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 16,
                        fill: '#1F2937',
                        originX: 'center',
                        originY: 'center',
                        width: 240,
                        backgroundColor: '#FFFFFF',
                        padding: 8
                    });

                    (linkInput as any).isLinkInput = true;
                    (linkInput as any).isTemporary = true;

                    // Override Enter key to exit editing instead of new line
                    linkInput.keysMap = {
                        ...linkInput.keysMap,
                        13: 'exitEditing'
                    };

                    canvas.add(linkInput);
                    canvas.setActiveObject(linkInput);
                    linkInput.enterEditing();
                    linkInput.selectAll();
                    canvas.renderAll();
                }
            }
        });

        // Handle link input completion
        canvas.on('text:editing:exited', (e) => {
            if ((e.target as any).isLinkInput) {
                const textObj = e.target as fabric.IText;
                // Use requestAnimationFrame to avoid "cannot read property fire of undefined"
                // which happens if we remove object synchronously during event handling
                requestAnimationFrame(() => {
                    const url = textObj.text || '';

                    // Remove the input object
                    if (fabricRef.current) {
                        fabricRef.current.remove(textObj);
                        fabricRef.current.requestRenderAll();
                    }

                    if (url && url.length > 0) {
                        createLinkCard(url, textObj.left!, textObj.top!);
                    }
                });
            }
        });

        canvas.on('selection:created', (e) => {
            const activeObjects = canvas.getActiveObjects();
            const selected = activeObjects.map((obj: any, index: number) => ({
                id: obj.id || `object_${index}`,
                type: obj.type || 'object',
                name: obj.name || `${obj.type || 'Object'} ${index + 1}`,
                locked: !!(obj.lockMovementX && obj.lockMovementY),
                visible: obj.visible !== false,
                color: obj.stickyColor
            }));

            if (activeObjects.length > 0) {
                if ((activeObjects[0] as any).isCommentMarker && e.e) {
                    const evt = e.e as MouseEvent;
                    callbacksRef.current.onObjectSelected?.(activeObjects[0], { x: evt.clientX, y: evt.clientY });
                } else if ((activeObjects[0] as any).isLinkPlaceholder) {
                    // Focus paste input for link placeholders
                    setTimeout(() => {
                        pasteInputRef.current?.focus();
                    }, 50);
                    updateSelectionPosition();
                } else {
                    updateSelectionPosition();
                }
            }
            callbacksRef.current.onSelectionChange?.(selected);
        });

        canvas.on('selection:updated', (e) => {
            const activeObjects = canvas.getActiveObjects();
            const selected = activeObjects.map((obj: any, index: number) => ({
                id: obj.id || `object_${index}`,
                type: obj.type || 'object',
                name: obj.name || `${obj.type || 'Object'} ${index + 1}`,
                locked: !!(obj.lockMovementX && obj.lockMovementY),
                visible: obj.visible !== false,
                color: obj.stickyColor
            }));

            if (activeObjects.length > 0) {
                if ((activeObjects[0] as any).isCommentMarker && e.e) {
                    const evt = e.e as MouseEvent;
                    callbacksRef.current.onObjectSelected?.(activeObjects[0], { x: evt.clientX, y: evt.clientY });
                } else {
                    updateSelectionPosition();
                }
            }
            callbacksRef.current.onSelectionChange?.(selected);
        });

        canvas.on('selection:cleared', () => {
            callbacksRef.current.onSelectionChange?.([]);
            callbacksRef.current.onObjectSelected?.(null, null);
        });

        canvas.on('object:added', (e) => {
            const target = e.target as any;
            // Skip grid, connections, pins, and eraser strokes
            if (target?.isGrid || target?.isConnection || target?.isPin || target?.name === 'Eraser Stroke') return;
            // Also skip if eraser tool is active (shouldn't happen but double guard)
            if (activeToolRef.current === 'eraser') return;

            // Set default erasable property if not set
            if (target && target.erasable === undefined) {
                target.erasable = false;
            }

            // Track this object in the active layer (for non-image objects)
            // Images are handled separately with their own layer
            if (target?.id && !target?.isImageLayer && !isLoadingRef.current) {
                const activeLayer = layersRef.current.find(l => l.id === activeLayerIdRef.current);
                if (activeLayer && !activeLayer.objectIds.includes(target.id)) {
                    activeLayer.objectIds.push(target.id);
                    layersRef.current = [...layersRef.current];
                    setLayers([...layersRef.current]);
                }
            }

            if (!isLoadingRef.current) saveState();
            callbacksRef.current.onObjectsChange?.(getCanvasObjects()); updateMinimap();
        });

        canvas.on('path:created', (e: any) => {
            const path = e.path;
            // If eraser is active, immediately remove this path - it should not be created
            if (activeToolRef.current === 'eraser') {
                canvas.remove(path);
                return;
            }

            path.id = generateId();
            if (activeToolRef.current === 'highlighter') {
                path.name = 'Highlighter';
                path.erasable = false;
                path.selectable = true;
            } else if (activeToolRef.current === 'brush') {
                path.name = 'Brush';
                path.erasable = true;
                path.selectable = true;
            }

            // Track this brush/highlighter stroke in the active layer
            const activeLayer = layersRef.current.find(l => l.id === activeLayerIdRef.current);
            if (activeLayer && path.id && !activeLayer.objectIds.includes(path.id)) {
                activeLayer.objectIds.push(path.id);
                layersRef.current = [...layersRef.current];
                setLayers([...layersRef.current]);
            }
        });
        canvas.on('object:removed', (e) => {
            const target = e.target as any;
            if (target?.isGrid || target?.isConnection || target?.isPin) return;

            // Remove object from its layer
            if (target?.id) {
                const layer = layersRef.current.find(l => l.objectIds.includes(target.id));
                if (layer) {
                    layer.objectIds = layer.objectIds.filter(id => id !== target.id);
                    layersRef.current = [...layersRef.current];
                    setLayers([...layersRef.current]);
                }
            }

            if (!isLoadingRef.current) saveState();
            callbacksRef.current.onObjectsChange?.(getCanvasObjects()); updateMinimap();
        });
        canvas.on('object:modified', () => {
            saveState(); callbacksRef.current.onModified?.(); callbacksRef.current.onObjectsChange?.(getCanvasObjects());
            updateConnectionLines(); updateMinimap();
        });
        canvas.on('object:moving', (e) => {
            updateConnectionLines();

            // Update Properties Toolbar position during drag
            const obj = e.target;
            if (!obj || (obj as any).isCommentMarker) return;

            const bounds = obj.getBoundingRect();
            if (bounds) {
                updateSelectionPosition();
            }

            // Move attached comment markers with parent object
            const objId = (obj as any).id;
            if (objId) {
                const attachedComments = canvas.getObjects().filter((o: any) =>
                    o.isCommentMarker && o.parentObjectId === objId
                );
                attachedComments.forEach((comment: any) => {
                    const parentBounds = obj.getBoundingRect();
                    if (parentBounds && comment.parentOffsetX !== undefined && comment.parentOffsetY !== undefined) {
                        comment.set({
                            left: parentBounds.left + parentBounds.width + comment.parentOffsetX,
                            top: parentBounds.top + comment.parentOffsetY
                        });
                        comment.setCoords();
                    }
                });
                canvas.requestRenderAll();
            }

            // Smart Snapping
            const evt = e.e as MouseEvent;
            const isSnappingEnabled = evt.metaKey || evt.ctrlKey;

            // Remove old guides
            const oldGuides = canvas.getObjects().filter((o: any) => o.isGuide);
            oldGuides.forEach(g => canvas.remove(g));

            if (isSnappingEnabled) {
                const snapThreshold = 10;
                const canvasObjects = canvas.getObjects().filter((o: any) => o !== obj && !o.isGrid && !o.isConnection && !o.isPin && o.visible);

                const objCenter = obj.getCenterPoint();
                const objBounds = obj.getBoundingRect();

                let snapX = null;
                let snapY = null;

                for (const target of canvasObjects) {
                    const targetCenter = target.getCenterPoint();
                    const targetBounds = target.getBoundingRect();

                    // Horizontal Snapping (X)
                    // Center to Center
                    if (Math.abs(objCenter.x - targetCenter.x) < snapThreshold) {
                        snapX = targetCenter.x;
                        const line = new fabric.Line([targetCenter.x, 0, targetCenter.x, canvas.getHeight() || 1000], {
                            stroke: '#FF00FF', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true
                        });
                        (line as any).isGuide = true;
                        canvas.add(line);
                        obj.set({ left: targetCenter.x - (obj.width! * obj.scaleX! / 2) });
                    }
                    // Edges
                    else if (Math.abs(objBounds.left - targetBounds.left) < snapThreshold) {
                        snapX = targetBounds.left;
                        const line = new fabric.Line([targetBounds.left, 0, targetBounds.left, canvas.getHeight() || 1000], {
                            stroke: '#00BFFF', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true
                        });
                        (line as any).isGuide = true;
                        canvas.add(line);
                        obj.set({ left: targetBounds.left });
                    }
                    else if (Math.abs(objBounds.left + objBounds.width - (targetBounds.left + targetBounds.width)) < snapThreshold) {
                        snapX = targetBounds.left + targetBounds.width;
                        const line = new fabric.Line([snapX, 0, snapX, canvas.getHeight() || 1000], {
                            stroke: '#00BFFF', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true
                        });
                        (line as any).isGuide = true;
                        canvas.add(line);
                        obj.set({ left: snapX - objBounds.width });
                    }

                    // Vertical Snapping (Y)
                    // Center to Center
                    if (Math.abs(objCenter.y - targetCenter.y) < snapThreshold) {
                        snapY = targetCenter.y;
                        const line = new fabric.Line([0, targetCenter.y, canvas.getWidth() || 1000, targetCenter.y], {
                            stroke: '#FF00FF', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true
                        });
                        (line as any).isGuide = true;
                        canvas.add(line);
                        obj.set({ top: targetCenter.y - (obj.height! * obj.scaleY! / 2) });
                    }
                    // Edges
                    else if (Math.abs(objBounds.top - targetBounds.top) < snapThreshold) {
                        snapY = targetBounds.top;
                        const line = new fabric.Line([0, targetBounds.top, canvas.getWidth() || 1000, targetBounds.top], {
                            stroke: '#00BFFF', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true
                        });
                        (line as any).isGuide = true;
                        canvas.add(line);
                        obj.set({ top: targetBounds.top });
                    }
                    else if (Math.abs(objBounds.top + objBounds.height - (targetBounds.top + targetBounds.height)) < snapThreshold) {
                        snapY = targetBounds.top + targetBounds.height;
                        const line = new fabric.Line([0, snapY, canvas.getWidth() || 1000, snapY], {
                            stroke: '#00BFFF', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true
                        });
                        (line as any).isGuide = true;
                        canvas.add(line);
                        obj.set({ top: snapY - objBounds.height });
                    }
                }

                obj.setCoords();
            }

            // Always ensure coords are updated
            if (!isSnappingEnabled) {
                obj.setCoords();
            }
        });
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

            // Global Hotkeys
            if (e.code === 'KeyV') { e.preventDefault(); setActiveToolState('select'); }
            if (e.code === 'KeyH') { e.preventDefault(); setActiveToolState('pan'); }
            if (e.code === 'KeyS') { e.preventDefault(); setActiveToolState('sticky'); }
            if (e.code === 'KeyT') { e.preventDefault(); setActiveToolState('text'); }

            // Cmd+G for Group
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyG') {
                e.preventDefault();
                const activeObjects = canvas.getActiveObjects();
                if (activeObjects.length > 1) {
                    const group = new fabric.Group(activeObjects);
                    (group as any).id = generateId();
                    (group as any).name = 'Group';
                    activeObjects.forEach(obj => canvas.remove(obj));
                    canvas.add(group);
                    canvas.setActiveObject(group);
                    canvas.requestRenderAll();
                    saveState();
                }
            }

            // Cmd+D for Duplicate
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD') {
                e.preventDefault();
                const activeObject = canvas.getActiveObject();
                if (activeObject) {
                    activeObject.clone().then((cloned: any) => {
                        canvas.discardActiveObject();
                        cloned.set({
                            left: cloned.left + 20,
                            top: cloned.top + 20,
                            evented: true,
                        });
                        if (cloned.type === 'activeSelection') {
                            cloned.canvas = canvas;
                            cloned.forEachObject((obj: any) => {
                                obj.id = generateId();
                                canvas.add(obj);
                            });
                            cloned.setCoords();
                        } else {
                            cloned.id = generateId();
                            canvas.add(cloned);
                        }
                        canvas.setActiveObject(cloned);
                        canvas.requestRenderAll();
                        saveState();
                        callbacksRef.current.onObjectsChange?.(getCanvasObjects());
                    });
                }
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

        // AUTO-FOCUS: Forçar foco no container para capturar eventos de teclado
        containerRef.current?.focus();
        console.log('Container focado automaticamente');

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            resizeObserver.disconnect(); canvas.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle paste events for images - PRODUCTION VERSION
    useEffect(() => {
        console.log('===== PASTE HANDLER SETUP =====');

        const handlePaste = (e: ClipboardEvent) => {
            console.log('PASTE DETECTADO');

            // 1. If files, ALWAYS ALLOW (Image Paste Fix)
            if (e.clipboardData && e.clipboardData.files.length > 0) {
                console.log('Files detected, allowing paste');
                // Proceed to file handling logic below...
            } else {
                // 2. If text/url, check focus protection
                const target = e.target as HTMLElement;
                const isPasteInput = pasteInputRef.current && (target === pasteInputRef.current);

                if (!isPasteInput && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                    console.log('Ignorando paste - usuário digitando');
                    return;
                }
            }

            // Verificar canvas
            const canvas = fabricRef.current;
            if (!canvas) {
                console.log('Canvas não existe');
                return;
            }

            // Verificar clipboard data
            if (!e.clipboardData) {
                console.log('Sem clipboardData');
                return;
            }

            // LINK PLACEHOLDER LOGIC
            // Check if we have a selected placeholder and we are pasting text
            const activeObject = canvas.getActiveObject();
            if (activeObject && (activeObject as any).isLinkPlaceholder) {
                const pastedText = e.clipboardData.getData('text');
                if (pastedText) {
                    try {
                        // Validate URL
                        new URL(pastedText.startsWith('http') ? pastedText : 'https://' + pastedText);
                        console.log('Valid URL pasted on placeholder:', pastedText);

                        e.preventDefault();

                        const { left, top } = activeObject;

                        // Remove placeholder
                        canvas.remove(activeObject);

                        // BIFURCATION: Check if it's a YouTube video
                        const videoId = getYoutubeId(pastedText);

                        if (videoId) {
                            // SCENARIO A: Create Video Embed
                            console.log('YouTube video detected:', videoId);
                            createVideoEmbed(videoId, left, top);
                        } else {
                            // SCENARIO B: Create Link Card
                            console.log('Regular link detected');
                            createLinkCard(pastedText, left, top);
                        }

                        return;
                    } catch (err) {
                        console.log('Pasted text is not a valid URL:', pastedText);
                        // If not a URL, let it fall through or maybe show error? 
                        // For now let's just let it fall through logic (although it likely won't do anything else useful with text on a group)
                    }
                }
            }

            console.log('Itens no clipboard:', e.clipboardData.items.length);

            // Iterar sobre os itens do clipboard
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                console.log('Item', i, '- kind:', item.kind, 'type:', item.type);

                // Verificar se é imagem (kind === 'file' e type começa com 'image/')
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    console.log('IMAGEM ENCONTRADA!');
                    e.preventDefault();

                    // Obter o arquivo/blob
                    const blob = item.getAsFile();
                    if (!blob) {
                        console.log('Falha ao obter blob');
                        continue;
                    }
                    console.log('Blob obtido:', blob.type, blob.size, 'bytes');

                    // Criar URL do objeto
                    const imageUrl = URL.createObjectURL(blob);
                    console.log('URL criada:', imageUrl);

                    // Calcular posição - usar posição do mouse se disponível, senão centro do canvas
                    let posX: number;
                    let posY: number;

                    if (cursorPosRef.current) {
                        // Converter posição do mouse para coordenadas do canvas
                        const canvasElement = canvas.getElement();
                        const rect = canvasElement.getBoundingClientRect();
                        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
                        const zoom = canvas.getZoom();

                        posX = (cursorPosRef.current.x - rect.left - vpt[4]) / zoom;
                        posY = (cursorPosRef.current.y - rect.top - vpt[5]) / zoom;
                        console.log('Usando posição do mouse:', posX, posY);
                    } else {
                        // Fallback: centro do canvas
                        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
                        const zoom = canvas.getZoom();
                        posX = (canvas.getWidth() / 2 - vpt[4]) / zoom;
                        posY = (canvas.getHeight() / 2 - vpt[5]) / zoom;
                        console.log('Usando centro do canvas:', posX, posY);
                    }

                    // Criar imagem Fabric
                    fabric.FabricImage.fromURL(imageUrl).then((img) => {
                        console.log('Imagem Fabric criada');

                        const canvas = fabricRef.current;
                        if (!canvas) {
                            console.log('Canvas perdido');
                            URL.revokeObjectURL(imageUrl);
                            return;
                        }

                        // Escalar para tamanho máximo de 400px
                        const maxSize = 400;
                        const imgWidth = img.width || 300;
                        const imgHeight = img.height || 300;
                        const scale = Math.min(maxSize / imgWidth, maxSize / imgHeight, 1);

                        console.log('Dimensões:', imgWidth, 'x', imgHeight, 'Escala:', scale);

                        // Configurar propriedades da imagem
                        img.set({
                            left: posX,
                            top: posY,
                            scaleX: scale,
                            scaleY: scale,
                            originX: 'center',
                            originY: 'center',
                            shadow: new fabric.Shadow({
                                color: 'rgba(0,0,0,0.2)',
                                blur: 10,
                                offsetX: 0,
                                offsetY: 4
                            })
                        });

                        // Adicionar ID e nome
                        const imgId = `pasted_${Date.now()}`;
                        (img as any).id = imgId;
                        (img as any).name = 'Pasted Image';
                        (img as any).layerId = activeLayerIdRef.current;

                        console.log('Imagem configurada com ID:', imgId);

                        // Adicionar à layer ativa
                        const currentLayer = layersRef.current.find(l => l.id === activeLayerIdRef.current);
                        if (currentLayer) {
                            currentLayer.objectIds.push(imgId);
                            console.log('Adicionada à layer:', currentLayer.name);
                        }

                        // Adicionar ao canvas
                        canvas.add(img);
                        canvas.bringObjectToFront(img);
                        canvas.setActiveObject(img);
                        canvas.requestRenderAll();
                        console.log('Imagem adicionada e renderizada');

                        // Salvar estado e disparar callbacks
                        saveState();
                        callbacksRef.current.onModified?.();
                        callbacksRef.current.onObjectsChange?.(getCanvasObjects());
                        updateMinimap();

                        // Limpar URL após delay
                        setTimeout(() => {
                            URL.revokeObjectURL(imageUrl);
                            console.log('URL revogada');
                        }, 10000);

                        console.log('===== PASTE COMPLETO COM SUCESSO =====');

                    }).catch((err) => {
                        console.error('ERRO ao criar imagem:', err);
                        URL.revokeObjectURL(imageUrl);
                    });

                    // Processar apenas a primeira imagem
                    break;
                }
            }
        };

        // Anexar listener ao CONTAINER e WINDOW
        const container = containerRef.current;
        if (container) {
            container.addEventListener('paste', handlePaste as EventListener);
            console.log('Event listener anexado ao CONTAINER');
        }
        window.addEventListener('paste', handlePaste);
        console.log('Event listener anexado ao WINDOW');
        console.log('===== PASTE HANDLER SETUP COMPLETE =====');

        // Cleanup
        return () => {
            if (container) {
                container.removeEventListener('paste', handlePaste as EventListener);
            }
            window.removeEventListener('paste', handlePaste);
            console.log('Event listeners removidos');
        };
    }, [isInitialized]); // Depende de isInitialized

    // Handle tool changes
    useEffect(() => {
        if (!fabricRef.current || !isInitialized) return;
        activeToolRef.current = activeTool;

        if (activeTool === 'brush') {
            fabricRef.current.isDrawingMode = true;
            const brush = new fabric.PencilBrush(fabricRef.current);
            brush.color = brushColorRef.current; brush.width = brushWidthRef.current;
            fabricRef.current.freeDrawingBrush = brush;
            // Re-enable evented for all objects
            fabricRef.current.getObjects().forEach((obj: any) => { if (!obj.isGrid && !obj.isConnection && !obj.isPin) obj.evented = true; });
        } else if (activeTool === 'highlighter') {
            fabricRef.current.isDrawingMode = true;
            const hlBrush = new fabric.PencilBrush(fabricRef.current);
            hlBrush.color = `${brushColorRef.current}60`; hlBrush.width = 20;
            fabricRef.current.freeDrawingBrush = hlBrush;
            // Re-enable evented for all objects
            fabricRef.current.getObjects().forEach((obj: any) => { if (!obj.isGrid && !obj.isConnection && !obj.isPin) obj.evented = true; });
        } else if (activeTool === 'eraser') {
            // Eraser uses manual drawing on a rasterized layer - NOT Fabric's drawing mode
            fabricRef.current.isDrawingMode = false;
            fabricRef.current.selection = false;
            // Disable evented for all objects to prevent selecting/dragging while erasing
            fabricRef.current.getObjects().forEach((obj: any) => { obj.evented = false; });
            fabricRef.current.discardActiveObject();
        } else if (activeTool === 'link_tool') {
            fabricRef.current.isDrawingMode = false;
            fabricRef.current.defaultCursor = 'alias';
            fabricRef.current.hoverCursor = 'alias';
            fabricRef.current.selection = false;
            // Force cursor on upper canvas element
            if (fabricRef.current.upperCanvasEl) {
                fabricRef.current.upperCanvasEl.style.cursor = 'alias';
            }
            // Disable evented for all objects to ensure clicks go to the canvas for link creation
            fabricRef.current.getObjects().forEach((obj: any) => { if (!obj.isGrid && !obj.isConnection && !obj.isPin) obj.evented = false; });
            fabricRef.current.requestRenderAll();
        } else {
            fabricRef.current.isDrawingMode = false;
            fabricRef.current.defaultCursor = 'default';
            fabricRef.current.hoverCursor = 'move';
            // Re-enable evented for all objects
            fabricRef.current.getObjects().forEach((obj: any) => { if (!obj.isGrid && !obj.isConnection && !obj.isPin) obj.evented = true; });
        }
        if (activeTool === 'pan') { fabricRef.current.selection = false; fabricRef.current.setCursor('grab'); }
        else if (activeTool === 'sticky') { fabricRef.current.selection = false; fabricRef.current.setCursor('crosshair'); fabricRef.current.defaultCursor = 'crosshair'; }
        else if (activeTool !== 'eraser') { fabricRef.current.selection = true; fabricRef.current.defaultCursor = 'default'; }
        callbacksRef.current.onToolChange?.(activeTool);
    }, [activeTool, isInitialized, eraserSize]);

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
                fontSize: 24, fill: color || textColorRef.current, originX: 'center', originY: 'center',
                erasable: false
            } as any);
            (textObj as any).id = generateId(); (textObj as any).name = 'Text';
            fabricRef.current.add(textObj); fabricRef.current.setActiveObject(textObj);
            textObj.enterEditing(); textObj.selectAll(); fabricRef.current.renderAll();
        },

        addStickyNote: (color = 'yellow_light') => {
            if (!fabricRef.current) return;
            stickyColorRef.current = color;
            setActiveToolState('sticky');
            activeToolRef.current = 'sticky';
            fabricRef.current.defaultCursor = 'crosshair';
            fabricRef.current.setCursor('crosshair');
            fabricRef.current.selection = false;
        },


        addCommentMarker: (x: number, y: number, initialComment?: CanvasComment, parentId?: string | null) => {
            if (!fabricRef.current) return;

            // Pin Style: Red Circle with minimalist chat bubble outline
            const pinColor = '#EF4444'; // Red-500
            const pinRadius = 16;

            const pinHead = new fabric.Circle({
                radius: pinRadius,
                fill: pinColor,
                originX: 'center', originY: 'center',
                top: 0, left: 0,
                stroke: '#FFFFFF',
                strokeWidth: 2
            });

            // Minimalist chat bubble icon (outline only)
            const bubblePath = 'M -6 -4 L 6 -4 Q 8 -4 8 -2 L 8 2 Q 8 4 6 4 L 0 4 L -3 7 L -3 4 L -6 4 Q -8 4 -8 2 L -8 -2 Q -8 -4 -6 -4 Z';
            const icon = new fabric.Path(bubblePath, {
                fill: 'transparent',
                stroke: '#FFFFFF',
                strokeWidth: 1.5,
                originX: 'center', originY: 'center',
                top: 0, left: 0,
                scaleX: 1.2,
                scaleY: 1.2
            });

            const commentMarker = new fabric.Group([pinHead, icon], {
                left: x, top: y,
                originX: 'center', originY: 'center',
                hasControls: false,
                hasBorders: false,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true,
                subTargetCheck: false,
                hoverCursor: 'pointer'
            });

            const markerId = generateId();
            (commentMarker as any).id = markerId;
            (commentMarker as any).name = 'Comment Marker';
            (commentMarker as any).isCommentMarker = true;
            (commentMarker as any).comments = initialComment ? [initialComment] : [];
            (commentMarker as any).erasable = false;
            (commentMarker as any).parentObjectId = parentId || null;

            // If there's a parent object, calculate relative position
            if (parentId) {
                const parentObj = fabricRef.current.getObjects().find((o: any) => o.id === parentId);
                if (parentObj) {
                    const parentBounds = parentObj.getBoundingRect();
                    // Store offset from parent's top-right corner
                    (commentMarker as any).parentOffsetX = x - (parentBounds.left + parentBounds.width);
                    (commentMarker as any).parentOffsetY = y - parentBounds.top;
                }
            }

            fabricRef.current.add(commentMarker);
            fabricRef.current.setActiveObject(commentMarker);

            saveState();

            // Trigger selection callback immediately so UI opens
            callbacksRef.current.onObjectSelected?.(commentMarker, { x: 0, y: 0 });
        },

        addShape: (shapeType: 'rect' | 'circle' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'line', fillColor?: string | null, strokeColor?: string, strokeWidth?: number) => {
            if (!fabricRef.current) return;

            // Set shape creation mode
            shapeTypeRef.current = shapeType;

            // Update fill color (null means no fill)
            if (fillColor !== undefined) {
                shapeColorRef.current = fillColor;
            }

            // Update stroke color
            if (strokeColor !== undefined) {
                shapeStrokeColorRef.current = strokeColor;
            }

            // Update stroke width
            if (strokeWidth !== undefined) {
                shapeStrokeWidthRef.current = strokeWidth;
            }

            // Deselect any active objects
            fabricRef.current.discardActiveObject();
            fabricRef.current.renderAll();
        },



        addLinkCard: (url: string, x: number, y: number) => {
            createLinkCard(url, x, y);
        },

        addLinkPlaceholder: (x: number, y: number) => {
            createLinkPlaceholder(x, y);
        },
        addImage: (url: string, isFileCard = false, fileData?: { name: string; type: string; id: string }) => {
            if (!fabricRef.current) return;
            const vpt = fabricRef.current.viewportTransform || [1, 0, 0, 1, 0, 0];
            const zoom = fabricRef.current.getZoom();
            const centerX = (fabricRef.current.getWidth() / 2 - vpt[4]) / zoom;
            const centerY = (fabricRef.current.getHeight() / 2 - vpt[5]) / zoom;

            fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
                if (!fabricRef.current) return;

                if (isFileCard && fileData) {
                    // === GOOGLE DRIVE STYLE FILE CARD ===
                    const cardPadding = 12;
                    const headerHeight = 48; // Space for icon and name
                    const bottomPadding = 12;
                    const cardRounding = 12;

                    // Thumbnail dimensions
                    const thumbMaxW = 260;
                    const thumbMaxH = 200;

                    // 1. Calculate Image Scale & Dimensions
                    let scale = 1;
                    if (img.width && img.height) {
                        scale = Math.min(thumbMaxW / img.width, thumbMaxH / img.height, 1);
                    }
                    const imgW = (img.width || 200) * scale;
                    const imgH = (img.height || 200) * scale;

                    // 2. Calculate Final Card Dimensions based on content
                    const cardW = Math.max(imgW + cardPadding * 2, 240); // Min width 240
                    const cardH = headerHeight + imgH + bottomPadding;

                    // 3. Create Elements (All positioned relative to 0,0 top-left)

                    // Background
                    const background = new fabric.Rect({
                        left: 0,
                        top: 0,
                        width: cardW,
                        height: cardH,
                        fill: '#1F1F1F', // Dark grey like Google Drive dark mode reference
                        rx: cardRounding,
                        ry: cardRounding,
                        originX: 'left',
                        originY: 'top',
                        stroke: '#333333',
                        strokeWidth: 1
                    });

                    // Icon (Folder/File style)
                    // Visual simplified folder icon
                    const iconSize = 24;
                    const iconX = cardPadding;
                    const iconY = (headerHeight - iconSize) / 2;

                    const iconBase = new fabric.Rect({
                        left: iconX,
                        top: iconY + 2,
                        width: iconSize,
                        height: iconSize - 2,
                        fill: '#E07777', // The reddish color user liked
                        rx: 3,
                        ry: 3,
                        originX: 'left',
                        originY: 'top'
                    });
                    const iconTab = new fabric.Rect({
                        left: iconX,
                        top: iconY - 2,
                        width: iconSize * 0.4,
                        height: 6,
                        fill: '#E07777',
                        rx: 2,
                        ry: 2,
                        originX: 'left',
                        originY: 'top'
                    });

                    // Filename
                    let displayName = fileData.name;
                    if (displayName.length > 25) displayName = displayName.substring(0, 22) + '...';

                    const nameText = new fabric.Text(displayName, {
                        left: iconX + iconSize + 10,
                        top: headerHeight / 2, // Centered vertically in header
                        fontSize: 14,
                        fontFamily: 'Inter, Arial, sans-serif',
                        fill: '#E3E3E3',
                        originY: 'center',
                        originX: 'left'
                    });

                    // Menu Dots (Three vertical dots)
                    const menuText = new fabric.Text('⋮', {
                        left: cardW - cardPadding,
                        top: headerHeight / 2,
                        fontSize: 20,
                        fontFamily: 'Arial',
                        fill: '#9CA3AF',
                        originX: 'right', // Align to right
                        originY: 'center'
                    });

                    // Thumbnail Logic - Position image correctly relative to 0,0
                    img.set({
                        scaleX: scale,
                        scaleY: scale,
                        left: cardW / 2, // Center horizontally in card
                        top: headerHeight + (imgH / 2), // Position below header
                        originX: 'center',
                        originY: 'center',
                        strokeWidth: 0
                    });

                    // 4. Create Group
                    const group = new fabric.Group([background, iconBase, iconTab, nameText, menuText, img], {
                        left: centerX,
                        top: centerY,
                        originX: 'center',
                        originY: 'center',
                        subTargetCheck: false, // Ensure it acts as a single entity
                        interactive: true,
                        shadow: new fabric.Shadow({
                            color: 'rgba(0,0,0,0.3)',
                            blur: 15,
                            offsetX: 0,
                            offsetY: 5
                        })
                    });

                    // Metadata
                    const groupId = generateId();
                    (group as any).id = groupId;
                    (group as any).name = fileData.name;
                    (group as any).isFileCard = true;
                    (group as any).fileData = fileData;
                    (group as any).isImageLayer = true;
                    (group as any).erasable = false;

                    // Layer Logic
                    const newOrder = layersRef.current.length;
                    const imageLayer = createLayer(fileData.name, 'image', newOrder);
                    imageLayer.objectIds = [groupId];
                    layersRef.current = [...layersRef.current, imageLayer];
                    setLayers([...layersRef.current]);

                    fabricRef.current.add(group);
                    fabricRef.current.setActiveObject(group);
                    fabricRef.current.renderAll();
                    saveState();
                } else {
                    // Imagem simples
                    const maxSize = 400;
                    if (img.width && img.height) {
                        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                        img.scale(scale);
                    }
                    img.set({
                        left: centerX, top: centerY, originX: 'center', originY: 'center',
                        shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.2)', blur: 10, offsetX: 0, offsetY: 4 }),
                        erasable: false
                    } as any);

                    const imgId = generateId();
                    (img as any).id = imgId;
                    (img as any).name = fileData?.name || 'Image';
                    (img as any).isFileCard = isFileCard;
                    (img as any).fileData = fileData;
                    (img as any).isImageLayer = true;

                    const layerName = fileData?.name || 'Image';
                    const newOrder = layersRef.current.length;
                    const imageLayer = createLayer(layerName, 'image', newOrder);
                    imageLayer.objectIds = [imgId];
                    layersRef.current = [...layersRef.current, imageLayer];
                    setLayers([...layersRef.current]);

                    fabricRef.current.add(img);
                    fabricRef.current.setActiveObject(img);
                    fabricRef.current.renderAll();
                    saveState();
                }
            }).catch(err => {
                console.error('Failed to load image:', err);
                // Fallback: Create a file card without image preview for non-image files
                if (isFileCard && fileData && fabricRef.current) {
                    const cardPadding = 12;
                    const headerHeight = 48;
                    const cardRounding = 12;
                    const cardW = 240;
                    const cardH = headerHeight + 80;

                    const background = new fabric.Rect({
                        left: 0, top: 0, width: cardW, height: cardH,
                        fill: '#1F1F1F', rx: cardRounding, ry: cardRounding,
                        originX: 'left', originY: 'top', stroke: '#333333', strokeWidth: 1
                    });

                    const iconSize = 24;
                    const iconX = cardPadding;
                    const iconY = (headerHeight - iconSize) / 2;

                    const iconBase = new fabric.Rect({
                        left: iconX, top: iconY + 2, width: iconSize, height: iconSize - 2,
                        fill: '#6366F1', rx: 3, ry: 3, originX: 'left', originY: 'top'
                    });
                    const iconTab = new fabric.Rect({
                        left: iconX, top: iconY - 2, width: iconSize * 0.4, height: 6,
                        fill: '#6366F1', rx: 2, ry: 2, originX: 'left', originY: 'top'
                    });

                    let displayName = fileData.name;
                    if (displayName.length > 25) displayName = displayName.substring(0, 22) + '...';

                    const nameText = new fabric.Text(displayName, {
                        left: iconX + iconSize + 10, top: headerHeight / 2,
                        fontSize: 14, fontFamily: 'Inter, Arial, sans-serif',
                        fill: '#E3E3E3', originY: 'center', originX: 'left'
                    });

                    const menuText = new fabric.Text('⋮', {
                        left: cardW - cardPadding, top: headerHeight / 2,
                        fontSize: 20, fontFamily: 'Arial', fill: '#9CA3AF',
                        originX: 'right', originY: 'center'
                    });

                    // File type placeholder
                    const ext = fileData.name.split('.').pop()?.toUpperCase() || 'FILE';
                    const placeholder = new fabric.Text(ext, {
                        left: cardW / 2, top: headerHeight + 30,
                        fontSize: 18, fontFamily: 'Inter, Arial, sans-serif',
                        fill: '#6B7280', originX: 'center', originY: 'center'
                    });

                    const group = new fabric.Group([background, iconBase, iconTab, nameText, menuText, placeholder], {
                        left: centerX, top: centerY, originX: 'center', originY: 'center',
                        subTargetCheck: false, interactive: true,
                        shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 15, offsetX: 0, offsetY: 5 })
                    });

                    const groupId = generateId();
                    (group as any).id = groupId;
                    (group as any).name = fileData.name;
                    (group as any).isFileCard = true;
                    (group as any).fileData = fileData;
                    (group as any).isImageLayer = true;
                    (group as any).erasable = false;

                    const newOrder = layersRef.current.length;
                    const imageLayer = createLayer(fileData.name, 'image', newOrder);
                    imageLayer.objectIds = [groupId];
                    layersRef.current = [...layersRef.current, imageLayer];
                    setLayers([...layersRef.current]);

                    fabricRef.current.add(group);
                    fabricRef.current.setActiveObject(group);
                    fabricRef.current.renderAll();
                    saveState();
                }
            });
        },

        addConnection: (fromId: string, toId: string, color = '#DC2626') => {
            connectionsRef.current.push({ id: generateId(), fromId, toId, color });
            updateConnectionLines(); saveState();
        },

        deleteSelected: deleteSelectedObjects,
        deleteObjectById,
        toggleVisibility,
        toggleLock,

        toggleFileCardFrame: () => {
            const activeObj = fabricRef.current?.getActiveObject();
            if (activeObj && activeObj.type === 'group' && (activeObj as any).isFileCard) {
                const group = activeObj as fabric.Group;
                const objects = group.getObjects();
                // Assumindo a ordem: background(0), iconBase(1), iconTab(2), nameText(3), menuDots(4), img(5)
                // Queremos esconder/mostrar tudo MENOS a imagem
                // O estado atual pode ser inferido pelo background

                // Melhor: usar a propriedade 'opacity' para toggle. 
                // Se o background está visível, setar opacity 0 para o frame.

                const frameElements = objects.slice(0, 5);
                const isFrameVisible = frameElements[0].opacity !== 0;
                const newOpacity = isFrameVisible ? 0 : 1;

                frameElements.forEach(obj => {
                    obj.set('opacity', newOpacity);
                });

                // Se esconder o frame, remover sombra
                group.set('shadow', newOpacity === 0 ? null : new fabric.Shadow({
                    color: 'rgba(0,0,0,0.3)',
                    blur: 15,
                    offsetX: 0,
                    offsetY: 5
                }));

                fabricRef.current?.renderAll();
                saveState();
            }
        },

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
            return {
                objects: objectsToExport.map((obj: any) => obj.toObject(['id', 'name', 'isSticky', 'stickyColor', 'isFileCard', 'fileData', 'isImageLayer', 'isCommentMarker', 'comments'])),
                connections: connectionsRef.current,
                viewportTransform: fabricRef.current.viewportTransform,
                background: fabricRef.current.backgroundColor,
                layers: layersRef.current,
                activeLayerId: activeLayerIdRef.current
            };
        },

        loadFromJSON: (json: any) => {
            if (!fabricRef.current) return; isLoadingRef.current = true;
            const objectsToClear = fabricRef.current.getObjects().filter((obj: any) => !obj.isGrid);
            objectsToClear.forEach(obj => fabricRef.current?.remove(obj));
            if (json.connections) connectionsRef.current = json.connections;

            // Load layers from JSON or migrate from old format
            if (json.layers && Array.isArray(json.layers)) {
                layersRef.current = json.layers;
                setLayers([...layersRef.current]);
                if (json.activeLayerId) {
                    activeLayerIdRef.current = json.activeLayerId;
                    setActiveLayerId(json.activeLayerId);
                } else if (layersRef.current.length > 0) {
                    activeLayerIdRef.current = layersRef.current[0].id;
                    setActiveLayerId(layersRef.current[0].id);
                }
            } else {
                // Migration: create a default layer with all existing objects
                const defaultLayer = createLayer('Layer 1', 'drawing', 0);
                if (json.objects && Array.isArray(json.objects)) {
                    defaultLayer.objectIds = json.objects.map((obj: any) => obj.id).filter(Boolean);
                }
                layersRef.current = [defaultLayer];
                activeLayerIdRef.current = defaultLayer.id;
                setLayers([defaultLayer]);
                setActiveLayerId(defaultLayer.id);
            }

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
        setShapeStrokeColor: (color: string) => { shapeStrokeColorRef.current = color; },
        setShapeStrokeWidth: (width: number) => { shapeStrokeWidthRef.current = width; },
        panBy: (dx: number, dy: number) => { if (!fabricRef.current) return; const vpt = fabricRef.current.viewportTransform; if (vpt) { vpt[4] += dx; vpt[5] += dy; fabricRef.current.setViewportTransform(vpt); drawGrid(); } },
        getConnections: () => [...connectionsRef.current],
        getObjectById: (id: string) => fabricRef.current?.getObjects().find((o: any) => o.id === id) || null,
        setEraserSize: (size: number) => { setEraserSize(Math.max(10, Math.min(100, size))); },
        getEraserSize: () => eraserSize,

        // Layer management methods
        getLayers: () => [...layersRef.current],

        getActiveLayer: () => {
            return layersRef.current.find(l => l.id === activeLayerIdRef.current) || null;
        },

        setActiveLayer: (id: string) => {
            const layer = layersRef.current.find(l => l.id === id);
            if (layer && !layer.locked) {
                activeLayerIdRef.current = id;
                setActiveLayerId(id);
            }
        },

        addLayer: (name?: string, type: LayerType = 'drawing') => {
            const newOrder = layersRef.current.length;
            const layerName = name || `Layer ${newOrder + 1}`;
            const newLayer = createLayer(layerName, type, newOrder);
            layersRef.current = [...layersRef.current, newLayer];
            setLayers([...layersRef.current]);
            // Auto-activate new layer
            activeLayerIdRef.current = newLayer.id;
            setActiveLayerId(newLayer.id);
            callbacksRef.current.onModified?.();
            return newLayer;
        },

        deleteLayer: (id: string) => {
            const layer = layersRef.current.find(l => l.id === id);
            if (!layer || layersRef.current.length <= 1) return; // Can't delete the last layer

            // Remove all objects in this layer
            if (fabricRef.current) {
                layer.objectIds.forEach(objId => {
                    const obj = fabricRef.current?.getObjects().find((o: any) => o.id === objId);
                    if (obj) fabricRef.current?.remove(obj);
                });
                fabricRef.current.renderAll();
            }

            layersRef.current = layersRef.current.filter(l => l.id !== id);
            setLayers([...layersRef.current]);

            // If active layer was deleted, switch to first available
            if (activeLayerIdRef.current === id) {
                const unlocked = layersRef.current.find(l => !l.locked);
                if (unlocked) {
                    activeLayerIdRef.current = unlocked.id;
                    setActiveLayerId(unlocked.id);
                }
            }

            saveState();
            callbacksRef.current.onModified?.();
            callbacksRef.current.onObjectsChange?.(getCanvasObjects());
        },

        toggleLayerVisibility: (id: string) => {
            const layerIndex = layersRef.current.findIndex(l => l.id === id);
            if (layerIndex === -1) return;

            // Create a new layer object with toggled visibility
            const oldLayer = layersRef.current[layerIndex];
            const newLayer = { ...oldLayer, visible: !oldLayer.visible };

            // Toggle visibility for all objects in this layer
            if (fabricRef.current) {
                newLayer.objectIds.forEach(objId => {
                    const obj = fabricRef.current?.getObjects().find((o: any) => o.id === objId);
                    if (obj) {
                        obj.visible = newLayer.visible;
                    }
                });
                fabricRef.current.renderAll();
            }

            // Create new array with the updated layer
            const newLayers = [...layersRef.current];
            newLayers[layerIndex] = newLayer;
            layersRef.current = newLayers;
            setLayers(newLayers);
            callbacksRef.current.onObjectsChange?.(getCanvasObjects());
        },

        toggleLayerLock: (id: string) => {
            const layerIndex = layersRef.current.findIndex(l => l.id === id);
            if (layerIndex === -1) return;

            // Create a new layer object with toggled lock
            const oldLayer = layersRef.current[layerIndex];
            const newLayer = { ...oldLayer, locked: !oldLayer.locked };

            // Toggle lock for all objects in this layer
            if (fabricRef.current) {
                newLayer.objectIds.forEach(objId => {
                    const obj = fabricRef.current?.getObjects().find((o: any) => o.id === objId);
                    if (obj) {
                        obj.lockMovementX = newLayer.locked;
                        obj.lockMovementY = newLayer.locked;
                        obj.lockRotation = newLayer.locked;
                        obj.lockScalingX = newLayer.locked;
                        obj.lockScalingY = newLayer.locked;
                        obj.selectable = !newLayer.locked;
                    }
                });
                fabricRef.current.renderAll();
            }

            // If active layer is now locked, switch to another
            if (newLayer.locked && activeLayerIdRef.current === id) {
                const unlocked = layersRef.current.find(l => !l.locked && l.id !== id);
                if (unlocked) {
                    activeLayerIdRef.current = unlocked.id;
                    setActiveLayerId(unlocked.id);
                }
            }

            // Create new array with the updated layer
            const newLayers = [...layersRef.current];
            newLayers[layerIndex] = newLayer;
            layersRef.current = newLayers;
            setLayers(newLayers);
            callbacksRef.current.onObjectsChange?.(getCanvasObjects());
        },

        renameLayer: (id: string, name: string) => {
            const layerIndex = layersRef.current.findIndex(l => l.id === id);
            if (layerIndex === -1 || !name.trim()) return;

            layersRef.current[layerIndex].name = name.trim();
            layersRef.current = [...layersRef.current];
            setLayers([...layersRef.current]);
        },

        reorderLayers: (layerIds: string[]) => {
            const newLayers = layerIds.map((id, index) => {
                const layer = layersRef.current.find(l => l.id === id);
                if (layer) return { ...layer, order: index };
                return null;
            }).filter(Boolean) as Layer[];

            if (newLayers.length === layersRef.current.length) {
                layersRef.current = newLayers;
                setLayers([...layersRef.current]);
                // TODO: Reorder fabric objects based on layer order
            }
        }
    }), [generateId, getCanvasObjects, saveState, updateConnectionLines, updateMinimap, drawGrid, deleteSelectedObjects, deleteObjectById, toggleVisibility, toggleLock, eraserSize, layers]);

    return (
        <div
            ref={containerRef}
            tabIndex={-1}
            className="infinite-canvas-container w-full h-full relative overflow-hidden"
            style={{
                backgroundColor,
                cursor: activeTool === 'pan' ? 'grab' : activeTool === 'brush' || activeTool === 'highlighter' ? 'crosshair' : activeTool === 'eraser' ? 'none' : activeTool === 'connect' ? (connectingFrom ? 'cell' : 'crosshair') : activeTool === 'link_tool' ? 'alias' : 'default',
                outline: 'none'
            }}
            onClick={() => {
                // Focar no textarea invisível para capturar paste
                pasteInputRef.current?.focus();
                console.log('Paste input focado via click');
            }}
            onMouseDown={() => {
                // Também focar no mousedown
                pasteInputRef.current?.focus();
            }}
        >
            {/* Textarea invisível para capturar paste */}
            <textarea
                ref={pasteInputRef}
                style={{
                    position: 'absolute',
                    left: -9999,
                    top: 0,
                    width: 1,
                    height: 1,
                    opacity: 0,
                    pointerEvents: 'none'
                }}
                onPaste={(e) => {
                    console.log('PASTE DETECTADO NO TEXTAREA!');
                    const clipboardData = e.clipboardData;
                    if (!clipboardData) {
                        console.log('Sem clipboardData');
                        return;
                    }

                    console.log('Itens:', clipboardData.items.length);
                    const items = clipboardData.items;

                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        console.log('Item', i, '- kind:', item.kind, 'type:', item.type);

                        if (item.kind === 'file' && item.type.startsWith('image/')) {
                            console.log('IMAGEM ENCONTRADA!');
                            e.preventDefault();

                            const blob = item.getAsFile();
                            if (!blob) {
                                console.log('Falha ao obter blob');
                                continue;
                            }
                            console.log('Blob obtido:', blob.size, 'bytes');

                            const imageUrl = URL.createObjectURL(blob);
                            console.log('URL criada:', imageUrl);

                            const canvas = fabricRef.current;
                            if (!canvas) {
                                console.log('Canvas não existe');
                                URL.revokeObjectURL(imageUrl);
                                return;
                            }

                            // Posição: centro do canvas
                            const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
                            const zoom = canvas.getZoom();
                            const posX = (canvas.getWidth() / 2 - vpt[4]) / zoom;
                            const posY = (canvas.getHeight() / 2 - vpt[5]) / zoom;

                            console.log('Posição:', posX, posY);

                            fabric.FabricImage.fromURL(imageUrl).then((img) => {
                                console.log('Imagem Fabric criada');

                                const canvas = fabricRef.current;
                                if (!canvas) {
                                    URL.revokeObjectURL(imageUrl);
                                    return;
                                }

                                const maxSize = 400;
                                const imgWidth = img.width || 300;
                                const imgHeight = img.height || 300;
                                const scale = Math.min(maxSize / imgWidth, maxSize / imgHeight, 1);

                                img.set({
                                    left: posX,
                                    top: posY,
                                    scaleX: scale,
                                    scaleY: scale,
                                    originX: 'center',
                                    originY: 'center',
                                    shadow: new fabric.Shadow({
                                        color: 'rgba(0,0,0,0.2)',
                                        blur: 10,
                                        offsetX: 0,
                                        offsetY: 4
                                    })
                                });

                                const imgId = `pasted_${Date.now()}`;
                                (img as any).id = imgId;
                                (img as any).name = 'Pasted Image';
                                (img as any).layerId = activeLayerIdRef.current;

                                const currentLayer = layersRef.current.find(l => l.id === activeLayerIdRef.current);
                                if (currentLayer) {
                                    currentLayer.objectIds.push(imgId);
                                }

                                canvas.add(img);
                                canvas.bringObjectToFront(img);
                                canvas.setActiveObject(img);
                                canvas.requestRenderAll();

                                saveState();
                                callbacksRef.current.onModified?.();
                                callbacksRef.current.onObjectsChange?.(getCanvasObjects());
                                updateMinimap();

                                setTimeout(() => URL.revokeObjectURL(imageUrl), 10000);

                                console.log('===== IMAGEM COLADA COM SUCESSO! =====');
                            }).catch((err) => {
                                console.error('Erro:', err);
                                URL.revokeObjectURL(imageUrl);
                            });

                            break;
                        }
                    }
                }}
            />
            <canvas ref={canvasRef} />

            {/* Minimap - pointer-events-none to prevent click interference */}
            <div className="absolute bottom-4 right-4 border rounded-lg overflow-hidden shadow-lg pointer-events-none" style={{ backgroundColor: '#1B263B', borderColor: '#3D4A5D' }}>
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
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg" style={{ backgroundColor: '#6B7280', color: 'white', zIndex: 100 }}>
                    Brushing to erase selectively
                </div>
            )}

            {/* Eraser Cursor Indicator - ref-based for performance */}
            {activeTool === 'eraser' && (
                <div
                    ref={eraserCursorRef}
                    className="fixed pointer-events-none rounded-full border-2 border-white mix-blend-difference z-[9999]"
                    style={{
                        display: 'none',
                        width: eraserSize,
                        height: eraserSize,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.5)'
                    }}
                />
            )}
        </div>
    );
});

InfiniteCanvas.displayName = 'InfiniteCanvas';
export default InfiniteCanvas;
