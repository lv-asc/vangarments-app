'use client';

import React, { useState, useEffect } from 'react';
import {
    XMarkIcon,
    FolderIcon,
    SwatchIcon,
    MagnifyingGlassIcon,
    PhotoIcon,
    DocumentIcon
} from '@heroicons/react/24/outline';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Theme colors
const navyPrimary = '#0D1B2A';
const navySecondary = '#1B263B';
const creamPrimary = '#F5F1E8';
const creamSecondary = '#E8E0D0';

interface DesignFile {
    id: string;
    filename: string;
    originalFilename: string;
    fileType: string;
    mimeType: string;
    fileSizeBytes: number;
    thumbnailPath?: string;
}

interface Mockup {
    id: string;
    filename: string;
    originalFilename: string;
    mimeType: string;
    fileSizeBytes: number;
    metadata?: {
        name?: string;
        description?: string;
    };
}

interface FilePickerPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectFile: (url: string, fileData: { name: string; type: string; id: string }) => void;
}

export default function FilePickerPanel({ isOpen, onClose, onSelectFile }: FilePickerPanelProps) {
    const [activeTab, setActiveTab] = useState<'files' | 'mockups'>('files');
    const [files, setFiles] = useState<DesignFile[]>([]);
    const [mockups, setMockups] = useState<Mockup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const isDev = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');

            if (activeTab === 'files') {
                const endpoint = isDev
                    ? `${API_BASE_URL}/design-files/list-dev`
                    : `${API_BASE_URL}/design-files`;
                const headers: HeadersInit = {};
                if (!isDev && token) {
                    headers.Authorization = `Bearer ${token}`;
                }
                const res = await fetch(endpoint, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setFiles(data.files || []);
                }
            } else {
                const endpoint = isDev
                    ? `${API_BASE_URL}/mockups/list-dev`
                    : `${API_BASE_URL}/mockups`;
                const headers: HeadersInit = {};
                if (!isDev && token) {
                    headers.Authorization = `Bearer ${token}`;
                }
                const res = await fetch(endpoint, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setMockups(data.mockups || []);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    };

    const handleFileClick = (file: DesignFile | Mockup, type: 'file' | 'mockup') => {
        const isDev = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
        let url: string;
        let name: string;
        let fileType: string;

        if (type === 'file') {
            const f = file as DesignFile;
            url = isDev
                ? `${API_BASE_URL}/design-files/${f.id}/preview-dev`
                : `${API_BASE_URL}/design-files/${f.id}/file`;
            name = f.originalFilename;
            fileType = f.fileType;
        } else {
            const m = file as Mockup;
            url = isDev
                ? `${API_BASE_URL}/mockups/${m.id}/preview-dev`
                : `${API_BASE_URL}/mockups/${m.id}/file`;
            name = m.metadata?.name || m.originalFilename;
            fileType = 'mockup';
        }

        onSelectFile(url, { name, type: fileType, id: file.id });
    };

    const handleDragStart = (e: React.DragEvent, file: DesignFile | Mockup, type: 'file' | 'mockup') => {
        setDraggedItem(file.id);

        const isDev = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
        let url: string;
        let name: string;
        let fileType: string;

        if (type === 'file') {
            const f = file as DesignFile;
            url = isDev
                ? `${API_BASE_URL}/design-files/${f.id}/preview-dev`
                : `${API_BASE_URL}/design-files/${f.id}/file`;
            name = f.originalFilename;
            fileType = f.fileType;
        } else {
            const m = file as Mockup;
            url = isDev
                ? `${API_BASE_URL}/mockups/${m.id}/preview-dev`
                : `${API_BASE_URL}/mockups/${m.id}/file`;
            name = m.metadata?.name || m.originalFilename;
            fileType = 'mockup';
        }

        e.dataTransfer.setData('application/json', JSON.stringify({
            url,
            fileData: { name, type: fileType, id: file.id }
        }));
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const filteredFiles = files.filter(f =>
        f.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMockups = mockups.filter(m =>
        (m.metadata?.name || m.originalFilename).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (!isOpen) return null;

    return (
        <div
            className="absolute left-4 top-4 bottom-4 w-72 rounded-xl shadow-2xl overflow-hidden flex flex-col z-30"
            style={{ backgroundColor: navySecondary, border: '1px solid #2D3A4D' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#2D3A4D' }}>
                <h3 className="font-semibold" style={{ color: creamPrimary }}>Files & Mockups</h3>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ color: creamSecondary }}
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 gap-1" style={{ backgroundColor: navyPrimary }}>
                <button
                    onClick={() => setActiveTab('files')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2`}
                    style={{
                        backgroundColor: activeTab === 'files' ? creamPrimary : 'transparent',
                        color: activeTab === 'files' ? navyPrimary : creamSecondary
                    }}
                >
                    <FolderIcon className="w-4 h-4" />
                    Files
                </button>
                <button
                    onClick={() => setActiveTab('mockups')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2`}
                    style={{
                        backgroundColor: activeTab === 'mockups' ? creamPrimary : 'transparent',
                        color: activeTab === 'mockups' ? navyPrimary : creamSecondary
                    }}
                >
                    <SwatchIcon className="w-4 h-4" />
                    Mockups
                </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b" style={{ borderColor: '#2D3A4D' }}>
                <div className="relative">
                    <MagnifyingGlassIcon
                        className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2"
                        style={{ color: '#6B7280' }}
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search files..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                        style={{
                            backgroundColor: navyPrimary,
                            color: creamPrimary,
                            border: '1px solid #3D4A5D'
                        }}
                    />
                </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-3">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: creamPrimary }}></div>
                    </div>
                ) : activeTab === 'files' ? (
                    filteredFiles.length === 0 ? (
                        <div className="text-center py-8">
                            <FolderIcon className="w-12 h-12 mx-auto mb-2" style={{ color: '#4A5568' }} />
                            <p className="text-sm" style={{ color: creamSecondary }}>No files found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, file, 'file')}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => handleFileClick(file, 'file')}
                                    className={`
                                        p-2 rounded-lg cursor-pointer transition-all hover:scale-105
                                        ${draggedItem === file.id ? 'opacity-50' : ''}
                                    `}
                                    style={{ backgroundColor: `${navyPrimary}80`, border: '1px solid #3D4A5D' }}
                                >
                                    <div
                                        className="aspect-square rounded-lg flex items-center justify-center mb-2 overflow-hidden"
                                        style={{ backgroundColor: navyPrimary }}
                                    >
                                        {file.thumbnailPath ? (
                                            <img
                                                src={file.thumbnailPath}
                                                alt={file.originalFilename}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : file.mimeType.startsWith('image/') ? (
                                            <PhotoIcon className="w-8 h-8" style={{ color: '#10B981' }} />
                                        ) : (
                                            <DocumentIcon className="w-8 h-8" style={{ color: '#6366F1' }} />
                                        )}
                                    </div>
                                    <p className="text-xs truncate" style={{ color: creamPrimary }}>
                                        {file.originalFilename}
                                    </p>
                                    <p className="text-xs" style={{ color: '#6B7280' }}>
                                        {formatFileSize(file.fileSizeBytes)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    filteredMockups.length === 0 ? (
                        <div className="text-center py-8">
                            <SwatchIcon className="w-12 h-12 mx-auto mb-2" style={{ color: '#4A5568' }} />
                            <p className="text-sm" style={{ color: creamSecondary }}>No mockups found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {filteredMockups.map((mockup) => (
                                <div
                                    key={mockup.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, mockup, 'mockup')}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => handleFileClick(mockup, 'mockup')}
                                    className={`
                                        p-2 rounded-lg cursor-pointer transition-all hover:scale-105
                                        ${draggedItem === mockup.id ? 'opacity-50' : ''}
                                    `}
                                    style={{ backgroundColor: `${navyPrimary}80`, border: '1px solid #3D4A5D' }}
                                >
                                    <div
                                        className="aspect-square rounded-lg flex items-center justify-center mb-2 overflow-hidden"
                                        style={{ backgroundColor: navyPrimary }}
                                    >
                                        {mockup.mimeType.startsWith('image/') && mockup.mimeType !== 'image/svg+xml' ? (
                                            <img
                                                src={`${API_BASE_URL}/mockups/${mockup.id}/${API_BASE_URL.includes('localhost') ? 'preview-dev' : 'file'}`}
                                                alt={mockup.originalFilename}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <SwatchIcon className="w-8 h-8" style={{ color: '#F59E0B' }} />
                                        )}
                                    </div>
                                    <p className="text-xs truncate" style={{ color: creamPrimary }}>
                                        {mockup.metadata?.name || mockup.originalFilename}
                                    </p>
                                    <p className="text-xs" style={{ color: '#6B7280' }}>
                                        {formatFileSize(mockup.fileSizeBytes)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Help Text */}
            <div className="p-3 border-t text-center" style={{ borderColor: '#2D3A4D' }}>
                <p className="text-xs" style={{ color: '#6B7280' }}>
                    Click or drag files to add to canvas
                </p>
            </div>
        </div>
    );
}
