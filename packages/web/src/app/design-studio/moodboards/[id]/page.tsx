'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeftIcon,
    Cog6ToothIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

// Direct import instead of dynamic - SSR is handled by 'use client'
import FabricCanvas from '@/components/design-studio/FabricCanvas';
import { CanvasToolbar, LayerPanel, PropertiesPanel } from '@/components/design-studio';
import type { FabricCanvasRef, CanvasObject } from '@/components/design-studio/FabricCanvas';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

interface Mockup {
    id: string;
    filename: string;
    originalFilename: string;
    mimeType: string;
    metadata?: {
        name?: string;
    };
}

export default function MoodboardEditorPage() {
    const params = useParams();
    const router = useRouter();
    const canvasRef = useRef<FabricCanvasRef>(null);

    const [moodboard, setMoodboard] = useState<Moodboard | null>(null);
    const [mockups, setMockups] = useState<Mockup[]>([]);
    const [objects, setObjects] = useState<CanvasObject[]>([]);
    const [selectedId, setSelectedId] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

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

                // Fetch moodboard
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

                // Fetch mockups for image picker
                const mockupsEndpoint = isDev
                    ? `${API_BASE_URL}/mockups/list-dev`
                    : `${API_BASE_URL}/mockups`;

                const mockupsHeaders: HeadersInit = {};
                if (!isDev && token) {
                    mockupsHeaders.Authorization = `Bearer ${token}`;
                }

                const mockupsRes = await fetch(mockupsEndpoint, { headers: mockupsHeaders });

                if (mockupsRes.ok) {
                    const mockupData = await mockupsRes.json();
                    setMockups(mockupData.mockups || []);
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
            // Small delay to ensure canvas is fully initialized
            setTimeout(() => {
                canvasRef.current?.loadFromJSON(moodboard.canvasData!);
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

    // Convert mockups to format for toolbar
    const mockupsForToolbar = mockups.map(m => ({
        id: m.id,
        url: `${API_BASE_URL}/mockups/${m.id}/file`,
        name: m.metadata?.name || m.originalFilename
    }));

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
            className="min-h-screen flex flex-col"
            style={{ background: `linear-gradient(135deg, ${navyPrimary} 0%, ${navySecondary} 100%)` }}
        >
            {/* Header */}
            <header
                className="backdrop-blur-sm border-b sticky top-0 z-20"
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
                                    {moodboard.canvasWidth} × {moodboard.canvasHeight}px
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
            <div className="px-4 py-3">
                <CanvasToolbar
                    canvasRef={canvasRef}
                    onSave={handleSave}
                    mockups={mockupsForToolbar}
                    zoom={zoom}
                    onZoomChange={setZoom}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-4 px-4 pb-4 overflow-hidden">
                {/* Layer Panel - Left */}
                <div className="flex-shrink-0">
                    <LayerPanel
                        objects={objects}
                        selectedId={selectedId}
                        canvasRef={canvasRef}
                        onSelectObject={setSelectedId}
                    />
                </div>

                {/* Canvas - Center */}
                <div className="flex-1 flex items-center justify-center overflow-auto bg-gray-900/50 rounded-xl p-8">
                    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
                        {isMounted && (
                            <FabricCanvas
                                ref={canvasRef}
                                width={moodboard.canvasWidth}
                                height={moodboard.canvasHeight}
                                backgroundColor={moodboard.backgroundColor}
                                gridEnabled={moodboard.gridEnabled}
                                onObjectsChange={handleObjectsChange}
                                onSelectionChange={handleSelectionChange}
                                onModified={() => setSaved(false)}
                            />
                        )}
                    </div>
                </div>

                {/* Properties Panel - Right */}
                <div className="flex-shrink-0">
                    <PropertiesPanel
                        canvasRef={canvasRef}
                        hasSelection={!!selectedId}
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
