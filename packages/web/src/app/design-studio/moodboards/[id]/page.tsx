'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeftIcon,
    Cog6ToothIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

// Components
import InfiniteCanvas from '@/components/design-studio/InfiniteCanvas';
import MoodboardToolbar from '@/components/design-studio/MoodboardToolbar';
import FilePickerPanel from '@/components/design-studio/FilePickerPanel';
import { LayerPanel, PropertiesToolbar } from '@/components/design-studio';
import type { InfiniteCanvasRef, CanvasObject, CanvasTool } from '@/components/design-studio/InfiniteCanvas';
import type { Layer } from '@/components/design-studio/Layer';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Theme colors
const navyPrimary = '#0D1B2A';
const navySecondary = '#1B263B';
const creamPrimary = '#F5F1E8';
const creamSecondary = '#E8E0D0';

interface Moodboard {
    id: string;
    title: string;
    description?: string;
    visibility: 'private' | 'team' | 'public';
    canvasWidth: number;
    canvasHeight: number;
    backgroundColor: string;
    gridEnabled: boolean;
    snapToGrid: boolean;
    canvasData?: object;
}

export default function MoodboardEditorPage() {
    const params = useParams();
    const router = useRouter();
    const canvasRef = useRef<InfiniteCanvasRef>(null);

    const [moodboard, setMoodboard] = useState<Moodboard | null>(null);
    const [objects, setObjects] = useState<CanvasObject[]>([]);
    const [selectedId, setSelectedId] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [activeTool, setActiveTool] = useState<CanvasTool>('select');
    const [showSettings, setShowSettings] = useState(false);
    const [showFilePicker, setShowFilePicker] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedObject, setSelectedObject] = useState<any>(null);
    const [propsToolbarPos, setPropsToolbarPos] = useState<{ x: number; y: number } | null>(null);

    // Layer system state
    const [layers, setLayers] = useState<Layer[]>([]);
    const [activeLayerId, setActiveLayerId] = useState<string>('');

    // Handle client-side mounting
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Fetch moodboard data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const isDev = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');

                const moodboardEndpoint = isDev
                    ? `${API_BASE_URL}/moodboards/get-dev/${params.id}`
                    : `${API_BASE_URL}/moodboards/${params.id}`;

                const moodboardHeaders: HeadersInit = {};
                if (!isDev && token) {
                    moodboardHeaders.Authorization = `Bearer ${token}`;
                }

                const moodboardRes = await fetch(moodboardEndpoint, { headers: moodboardHeaders });

                if (moodboardRes.ok) {
                    const data = await moodboardRes.json();
                    setMoodboard(data);
                } else {
                    router.push('/design-studio');
                    return;
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
            setLoading(false);
        };

        if (params.id) {
            fetchData();
        }
    }, [params.id, router]);

    // Load canvas data when moodboard is loaded and canvas is ready
    useEffect(() => {
        if (moodboard?.canvasData && canvasRef.current && isMounted) {
            setTimeout(() => {
                canvasRef.current?.loadFromJSON(moodboard.canvasData!);
                // Sync layer state after loading
                setTimeout(() => {
                    const freshLayers = canvasRef.current?.getLayers() || [];
                    setLayers([...freshLayers]);
                    const activeLayer = canvasRef.current?.getActiveLayer();
                    if (activeLayer) {
                        setActiveLayerId(activeLayer.id);
                    }
                }, 150);
            }, 100);
        }
    }, [moodboard?.canvasData, isMounted]);

    // Save canvas to backend
    const handleSave = async () => {
        if (!moodboard || !canvasRef.current) return;

        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const isDev = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
            const canvasData = canvasRef.current.exportToJSON();

            const endpoint = isDev
                ? `${API_BASE_URL}/moodboards/update-dev/${moodboard.id}`
                : `${API_BASE_URL}/moodboards/${moodboard.id}`;

            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (!isDev && token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const res = await fetch(endpoint, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ canvasData })
            });

            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (error) {
            console.error('Error saving:', error);
        }
        setSaving(false);
    };

    // Handle objects change from canvas
    const handleObjectsChange = useCallback((newObjects: CanvasObject[]) => {
        setObjects(newObjects);
    }, []);

    // Handle selection change
    const handleSelectionChange = useCallback((selectedObjects: CanvasObject[]) => {
        if (selectedObjects.length > 0) {
            setSelectedId(selectedObjects[0].id);
        } else {
            setSelectedId(undefined);
        }
    }, []);

    // Handle file selection from picker
    const handleFileSelect = (url: string, fileData: { name: string; type: string; id: string }) => {
        canvasRef.current?.addImage(url, true, fileData);
        setShowFilePicker(false);
    };

    // Handle double-click on file card to open editor
    const handleFileDoubleClick = (fileId: string) => {
        // TODO: Open image editor modal
        console.log('Open editor for file:', fileId);
    };

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${navyPrimary} 0%, ${navySecondary} 100%)` }}
            >
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: creamPrimary }}></div>
            </div>
        );
    }

    if (!moodboard) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${navyPrimary} 0%, ${navySecondary} 100%)` }}
            >
                <p style={{ color: creamSecondary }}>Moodboard not found</p>
            </div>
        );
    }

    return (
        <div
            className="h-screen flex flex-col overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${navyPrimary} 0%, ${navySecondary} 100%)` }}
        >
            {/* Header */}
            <header
                className="backdrop-blur-sm border-b flex-shrink-0 z-20"
                style={{ backgroundColor: `${navySecondary}EE`, borderColor: '#2D3A4D' }}
            >
                <div className="max-w-full mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/design-studio"
                                className="p-2 rounded-lg transition-colors hover:opacity-80"
                                style={{ color: creamSecondary }}
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-lg font-bold" style={{ color: creamPrimary }}>
                                    {moodboard.title}
                                </h1>
                                <p className="text-xs" style={{ color: creamSecondary }}>
                                    Infinite Canvas • Zoom: {Math.round(zoom * 100)}%
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {saved && (
                                <span className="flex items-center gap-1 text-sm text-green-400">
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Saved
                                </span>
                            )}

                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2 rounded-lg transition-colors hover:opacity-80"
                                style={{ color: creamSecondary }}
                            >
                                <Cog6ToothIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="px-4 py-3 flex-shrink-0 z-10">
                <MoodboardToolbar
                    canvasRef={canvasRef as React.RefObject<InfiniteCanvasRef>}
                    onSave={handleSave}
                    onOpenFilePicker={() => setShowFilePicker(true)}
                    zoom={zoom}
                    onZoomChange={setZoom}
                    activeTool={activeTool}
                    onToolChange={setActiveTool}
                />
            </div>

            {/* Main Content - Full Height Canvas */}
            <div className="flex-1 relative overflow-hidden">
                {/* File Picker Panel */}
                <FilePickerPanel
                    isOpen={showFilePicker}
                    onClose={() => setShowFilePicker(false)}
                    onSelectFile={handleFileSelect}
                />

                {/* Infinite Canvas */}
                {isMounted && (
                    <InfiniteCanvas
                        ref={canvasRef}
                        backgroundColor={moodboard.backgroundColor || '#1a1a2e'}
                        gridEnabled={moodboard.gridEnabled}
                        onObjectsChange={handleObjectsChange}
                        onSelectionChange={handleSelectionChange}
                        onModified={() => setSaved(false)}
                        onZoomChange={setZoom}
                        onToolChange={setActiveTool}
                        onFileDoubleClick={handleFileDoubleClick}
                        onObjectSelected={(obj, pos) => {
                            setSelectedObject(obj);
                            setPropsToolbarPos(pos);
                        }}
                    />
                )}

                {/* Contextual Properties Toolbar */}
                <PropertiesToolbar
                    canvasRef={canvasRef}
                    position={propsToolbarPos}
                    onUpdate={() => {
                        setSaved(false);
                    }}
                />

                {/* Layer Panel - Right Side */}
                <div className="absolute right-4 top-4 z-20">
                    <LayerPanel
                        layers={layers}
                        activeLayerId={activeLayerId}
                        canvasRef={canvasRef as React.RefObject<InfiniteCanvasRef>}
                        onSelectLayer={(id) => {
                            setActiveLayerId(id);
                        }}
                        onLayersChange={() => {
                            // Refresh layers from canvas
                            const freshLayers = canvasRef.current?.getLayers() || [];
                            setLayers([...freshLayers]);
                            setSaved(false);
                        }}
                    />
                </div>

            </div>

            {/* Settings Modal */}
            {showSettings && (
                <SettingsModal
                    moodboard={moodboard}
                    onClose={() => setShowSettings(false)}
                    onUpdate={(updates) => setMoodboard({ ...moodboard, ...updates })}
                />
            )}
        </div>
    );
}

// Settings Modal Component
function SettingsModal({
    moodboard,
    onClose,
    onUpdate
}: {
    moodboard: Moodboard;
    onClose: () => void;
    onUpdate: (updates: Partial<Moodboard>) => void;
}) {
    const [title, setTitle] = useState(moodboard.title);
    const [description, setDescription] = useState(moodboard.description || '');
    const [visibility, setVisibility] = useState(moodboard.visibility);
    const [backgroundColor, setBackgroundColor] = useState(moodboard.backgroundColor);
    const [gridEnabled, setGridEnabled] = useState(moodboard.gridEnabled);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const isDev = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');

            const endpoint = isDev
                ? `${API_BASE_URL}/moodboards/update-dev/${moodboard.id}`
                : `${API_BASE_URL}/moodboards/${moodboard.id}`;

            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (!isDev && token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const res = await fetch(endpoint, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    title,
                    description,
                    visibility,
                    backgroundColor,
                    gridEnabled
                })
            });

            if (res.ok) {
                onUpdate({ title, description, visibility, backgroundColor, gridEnabled });
                onClose();
            }
        } catch (error) {
            console.error('Error updating settings:', error);
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div
                className="rounded-2xl border p-6 w-full max-w-md shadow-2xl"
                style={{ backgroundColor: navySecondary, borderColor: '#2D3A4D' }}
            >
                <h2 className="text-xl font-bold mb-4" style={{ color: creamPrimary }}>
                    Moodboard Settings
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block" style={{ color: creamSecondary }}>
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg"
                            style={{ backgroundColor: navyPrimary, color: creamPrimary, border: `1px solid #3D4A5D` }}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block" style={{ color: creamSecondary }}>
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg resize-none"
                            style={{ backgroundColor: navyPrimary, color: creamPrimary, border: `1px solid #3D4A5D` }}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block" style={{ color: creamSecondary }}>
                            Visibility
                        </label>
                        <select
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value as 'private' | 'team' | 'public')}
                            className="w-full px-3 py-2 rounded-lg"
                            style={{ backgroundColor: navyPrimary, color: creamPrimary, border: `1px solid #3D4A5D` }}
                        >
                            <option value="private">Private</option>
                            <option value="team">Team</option>
                            <option value="public">Public</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block" style={{ color: creamSecondary }}>
                            Background Color
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg"
                                style={{ backgroundColor: navyPrimary, color: creamPrimary, border: `1px solid #3D4A5D` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium" style={{ color: creamSecondary }}>
                            Show Grid
                        </label>
                        <button
                            onClick={() => setGridEnabled(!gridEnabled)}
                            className="w-12 h-6 rounded-full transition-colors relative"
                            style={{ backgroundColor: gridEnabled ? '#22C55E' : '#3D4A5D' }}
                        >
                            <div
                                className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                                style={{ left: gridEnabled ? '24px' : '2px' }}
                            />
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 transition-colors hover:opacity-80"
                        style={{ color: creamSecondary }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 rounded-lg font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: creamPrimary, color: navyPrimary }}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
