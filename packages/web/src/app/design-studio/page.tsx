'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    PlusIcon,
    FolderIcon,
    Squares2X2Icon,
    DocumentIcon,
    PhotoIcon,
    AdjustmentsHorizontalIcon,
    ArrowUpTrayIcon,
    XMarkIcon,
    SwatchIcon
} from '@heroicons/react/24/outline';

// API Base URL - uses backend server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Types
interface DesignFile {
    id: string;
    filename: string;
    originalFilename: string;
    fileType: 'vector' | '3d_model' | 'raster' | 'sketch' | 'mockup';
    mimeType: string;
    fileSizeBytes: number;
    thumbnailPath?: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

interface Moodboard {
    id: string;
    title: string;
    slug?: string;
    description?: string;
    coverImage?: string;
    visibility: 'private' | 'team' | 'public';
    createdAt: string;
    updatedAt: string;
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
    createdAt: string;
    updatedAt: string;
}

// Navy Blue theme colors
const navyPrimary = '#0D1B2A';
const navySecondary = '#1B263B';
const creamPrimary = '#F5F1E8';
const creamSecondary = '#E8E0D0';

export default function DesignStudioPage() {
    const [activeTab, setActiveTab] = useState<'files' | 'moodboards' | 'mockups'>('files');
    const [designFiles, setDesignFiles] = useState<DesignFile[]>([]);
    const [moodboards, setMoodboards] = useState<Moodboard[]>([]);
    const [mockups, setMockups] = useState<Mockup[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewMoodboardModal, setShowNewMoodboardModal] = useState(false);
    const [showUploadMockupModal, setShowUploadMockupModal] = useState(false);
    const [showUploadFileModal, setShowUploadFileModal] = useState(false);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ show: boolean; id: string; name: string }>({ show: false, id: '', name: '' });
    const [deleteFileModal, setDeleteFileModal] = useState<{ show: boolean; id: string; name: string }>({ show: false, id: '', name: '' });

    useEffect(() => {
        document.title = 'Design Studio';
    }, []);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

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
                    setDesignFiles(data.files || []);
                }
            } else if (activeTab === 'moodboards') {
                const endpoint = isDev
                    ? `${API_BASE_URL}/moodboards/list-dev`
                    : `${API_BASE_URL}/moodboards`;
                const headers: HeadersInit = {};
                if (!isDev && token) {
                    headers.Authorization = `Bearer ${token}`;
                }
                const res = await fetch(endpoint, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setMoodboards(data.moodboards || []);
                }
            } else if (activeTab === 'mockups') {
                // Use /list-dev for local development (no auth required)
                const isDev = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
                const listEndpoint = isDev
                    ? `${API_BASE_URL}/mockups/list-dev`
                    : `${API_BASE_URL}/mockups`;

                const headers: HeadersInit = {};
                if (!isDev && token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const res = await fetch(listEndpoint, { headers });
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

    const handleCreateMoodboard = async (title: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const isDev = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
            const endpoint = isDev
                ? `${API_BASE_URL}/moodboards/create-dev`
                : `${API_BASE_URL}/moodboards`;

            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (!isDev && token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({ title })
            });

            if (res.ok) {
                const newMoodboard = await res.json();
                setMoodboards([newMoodboard, ...moodboards]);
                setShowNewMoodboardModal(false);
            }
        } catch (error) {
            console.error('Error creating moodboard:', error);
        }
    };

    const handleUploadMockup = async (file: File, name: string, description: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', name);
            formData.append('description', description);

            // Use /upload-dev for local development (no auth required)
            const isDev = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
            const uploadEndpoint = isDev
                ? `${API_BASE_URL}/mockups/upload-dev`
                : `${API_BASE_URL}/mockups/upload`;

            const headers: HeadersInit = {};
            if (!isDev && token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const res = await fetch(uploadEndpoint, {
                method: 'POST',
                headers,
                body: formData
            });

            if (res.ok) {
                const newMockup = await res.json();
                setMockups([newMockup, ...mockups]);
                setShowUploadMockupModal(false);
            } else {
                const error = await res.json();
                alert(`Upload failed: ${error.error || 'Unknown error'}. Details: ${error.details || ''}`);
            }
        } catch (error) {
            console.error('Error uploading mockup:', error);
            alert('Failed to upload mockup');
        }
    };

    const handleUploadFile = async (file: File, name: string, description: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', name);
            formData.append('description', description);

            const isDev = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
            const uploadEndpoint = isDev
                ? `${API_BASE_URL}/design-files/upload-dev`
                : `${API_BASE_URL}/design-files/upload`;

            const headers: HeadersInit = {};
            if (!isDev && token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const res = await fetch(uploadEndpoint, {
                method: 'POST',
                headers,
                body: formData
            });

            if (res.ok) {
                const newFile = await res.json();
                setDesignFiles([newFile, ...designFiles]);
                setShowUploadFileModal(false);
            } else {
                const error = await res.json();
                alert(`Upload failed: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        }
    };

    const handleDeleteFile = (id: string, name: string) => {
        setDeleteFileModal({ show: true, id, name });
    };

    const confirmDeleteFile = async () => {
        const id = deleteFileModal.id;
        setDeleteFileModal({ show: false, id: '', name: '' });

        try {
            const token = localStorage.getItem('auth_token');
            const isDev = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
            const endpoint = isDev
                ? `${API_BASE_URL}/design-files/delete-dev/${id}`
                : `${API_BASE_URL}/design-files/${id}`;

            const headers: HeadersInit = {};
            if (!isDev && token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const res = await fetch(endpoint, {
                method: 'DELETE',
                headers
            });

            if (res.ok) {
                setDesignFiles(designFiles.filter(f => f.id !== id));
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const handleDeleteMockup = (id: string, name: string) => {
        setDeleteConfirmModal({ show: true, id, name });
    };

    const confirmDeleteMockup = async () => {
        const id = deleteConfirmModal.id;
        setDeleteConfirmModal({ show: false, id: '', name: '' });

        try {
            const token = localStorage.getItem('auth_token');

            // Use /delete-dev for local development (no auth required)
            const isDev = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
            const deleteEndpoint = isDev
                ? `${API_BASE_URL}/mockups/delete-dev/${id}`
                : `${API_BASE_URL}/mockups/${id}`;

            const headers: HeadersInit = {};
            if (!isDev && token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const res = await fetch(deleteEndpoint, {
                method: 'DELETE',
                headers
            });

            if (res.ok) {
                setMockups(mockups.filter(m => m.id !== id));
            }
        } catch (error) {
            console.error('Error deleting mockup:', error);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileTypeIcon = (fileType: string) => {
        switch (fileType) {
            case 'vector':
                return <DocumentIcon className="w-8 h-8 text-purple-500" />;
            case '3d_model':
                return <Squares2X2Icon className="w-8 h-8 text-blue-500" />;
            case 'mockup':
                return <SwatchIcon className="w-8 h-8 text-orange-500" />;
            case 'raster':
            case 'sketch':
            default:
                return <PhotoIcon className="w-8 h-8 text-green-500" />;
        }
    };

    const getMockupTypeIcon = (mimeType: string) => {
        if (mimeType === 'application/pdf') {
            return <DocumentIcon className="w-8 h-8 text-red-500" />;
        } else if (mimeType === 'image/svg+xml') {
            return <DocumentIcon className="w-8 h-8 text-purple-500" />;
        } else {
            return <PhotoIcon className="w-8 h-8 text-orange-500" />;
        }
    };

    return (
        <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${navyPrimary} 0%, ${navySecondary} 100%)` }}>
            {/* Header */}
            <header className="backdrop-blur-sm border-b sticky top-0 z-10" style={{ backgroundColor: `${navySecondary}CC`, borderColor: '#2D3A4D' }}>
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: creamPrimary }}>Design Studio</h1>
                            <p className="text-sm mt-1" style={{ color: creamSecondary }}>
                                Manage your design files, moodboards, and mockups
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Tab Switcher */}
                            <div className="rounded-lg p-1 flex gap-1" style={{ backgroundColor: `${navyPrimary}80` }}>
                                <button
                                    onClick={() => setActiveTab('files')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all`}
                                    style={{
                                        backgroundColor: activeTab === 'files' ? creamPrimary : 'transparent',
                                        color: activeTab === 'files' ? navyPrimary : creamSecondary
                                    }}
                                >
                                    <FolderIcon className="w-4 h-4 inline mr-2" />
                                    Files
                                </button>
                                <button
                                    onClick={() => setActiveTab('mockups')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all`}
                                    style={{
                                        backgroundColor: activeTab === 'mockups' ? creamPrimary : 'transparent',
                                        color: activeTab === 'mockups' ? navyPrimary : creamSecondary
                                    }}
                                >
                                    <SwatchIcon className="w-4 h-4 inline mr-2" />
                                    Mockups
                                </button>
                                <button
                                    onClick={() => setActiveTab('moodboards')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all`}
                                    style={{
                                        backgroundColor: activeTab === 'moodboards' ? creamPrimary : 'transparent',
                                        color: activeTab === 'moodboards' ? navyPrimary : creamSecondary
                                    }}
                                >
                                    <Squares2X2Icon className="w-4 h-4 inline mr-2" />
                                    Moodboards
                                </button>
                            </div>

                            {/* Action Buttons */}
                            {activeTab === 'moodboards' && (
                                <button
                                    onClick={() => setShowNewMoodboardModal(true)}
                                    className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg hover:opacity-90"
                                    style={{ backgroundColor: creamPrimary, color: navyPrimary }}
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    New Moodboard
                                </button>
                            )}
                            {activeTab === 'mockups' && (
                                <button
                                    onClick={() => setShowUploadMockupModal(true)}
                                    className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg hover:opacity-90"
                                    style={{ backgroundColor: creamPrimary, color: navyPrimary }}
                                >
                                    <ArrowUpTrayIcon className="w-5 h-5" />
                                    Upload Mockup
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: creamPrimary }}></div>
                    </div>
                ) : activeTab === 'files' ? (
                    /* Design Files Grid */
                    <div>
                        {designFiles.length === 0 ? (
                            <div className="text-center py-20">
                                <FolderIcon className="w-16 h-16 mx-auto mb-4" style={{ color: '#4A5568' }} />
                                <h3 className="text-xl font-medium mb-2" style={{ color: creamSecondary }}>
                                    No design files yet
                                </h3>
                                <p className="mb-6" style={{ color: '#6B7280' }}>
                                    Upload your first design file to get started
                                </p>
                                <button
                                    onClick={() => setShowUploadFileModal(true)}
                                    className="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90"
                                    style={{ backgroundColor: creamPrimary, color: navyPrimary }}
                                >
                                    Upload File
                                </button>
                            </div>
                        ) : (
                            <div>
                                {/* Upload button when files exist */}
                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={() => setShowUploadFileModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                                        style={{ backgroundColor: creamPrimary, color: navyPrimary }}
                                    >
                                        <ArrowUpTrayIcon className="w-5 h-5" />
                                        Upload File
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {designFiles.map((file) => (
                                        <div
                                            key={file.id}
                                            className="rounded-xl border p-4 transition-all group relative cursor-pointer hover:opacity-90"
                                            style={{ backgroundColor: `${navySecondary}80`, borderColor: '#2D3A4D' }}
                                        >
                                            <div className="aspect-square rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${navyPrimary}80` }}>
                                                {file.thumbnailPath ? (
                                                    <img
                                                        src={file.thumbnailPath}
                                                        alt={file.filename}
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    getFileTypeIcon(file.fileType)
                                                )}
                                            </div>
                                            <h4 className="font-medium text-sm truncate" style={{ color: creamPrimary }}>
                                                {file.originalFilename}
                                            </h4>
                                            <p className="text-xs mt-1" style={{ color: creamSecondary }}>
                                                {formatFileSize(file.fileSizeBytes)}
                                            </p>
                                            {/* Delete button on hover */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id, file.originalFilename); }}
                                                className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ backgroundColor: '#EF4444' }}
                                            >
                                                <XMarkIcon className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'mockups' ? (
                    /* Mockups Grid */
                    <div>
                        {mockups.length === 0 ? (
                            <div className="text-center py-20">
                                <SwatchIcon className="w-16 h-16 mx-auto mb-4" style={{ color: '#4A5568' }} />
                                <h3 className="text-xl font-medium mb-2" style={{ color: creamSecondary }}>
                                    No mockups yet
                                </h3>
                                <p className="mb-6" style={{ color: '#6B7280' }}>
                                    Upload base mockup templates to use as design canvas
                                </p>
                                <button
                                    onClick={() => setShowUploadMockupModal(true)}
                                    className="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90"
                                    style={{ backgroundColor: creamPrimary, color: navyPrimary }}
                                >
                                    Upload Mockup
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {mockups.map((mockup) => (
                                    <div
                                        key={mockup.id}
                                        className="rounded-xl border p-4 transition-all group relative"
                                        style={{ backgroundColor: `${navySecondary}80`, borderColor: '#2D3A4D' }}
                                    >
                                        <div className="aspect-square rounded-lg flex items-center justify-center mb-3 overflow-hidden" style={{ backgroundColor: `${navyPrimary}80` }}>
                                            {mockup.mimeType.startsWith('image/') && mockup.mimeType !== 'image/svg+xml' ? (
                                                <img
                                                    src={`${API_BASE_URL}/mockups/${mockup.id}/${(API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) ? 'preview-dev' : 'file'}`}
                                                    alt={mockup.originalFilename}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                getMockupTypeIcon(mockup.mimeType)
                                            )}
                                        </div>
                                        <h4 className="font-medium text-sm truncate" style={{ color: creamPrimary }}>
                                            {mockup.metadata?.name || mockup.originalFilename}
                                        </h4>
                                        <p className="text-xs mt-1" style={{ color: creamSecondary }}>
                                            {formatFileSize(mockup.fileSizeBytes)}
                                        </p>
                                        <button
                                            onClick={() => handleDeleteMockup(mockup.id, mockup.metadata?.name || mockup.originalFilename)}
                                            className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ backgroundColor: '#EF4444' }}
                                        >
                                            <XMarkIcon className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Moodboards Grid */
                    <div>
                        {moodboards.length === 0 ? (
                            <div className="text-center py-20">
                                <Squares2X2Icon className="w-16 h-16 mx-auto mb-4" style={{ color: '#4A5568' }} />
                                <h3 className="text-xl font-medium mb-2" style={{ color: creamSecondary }}>
                                    No moodboards yet
                                </h3>
                                <p className="mb-6" style={{ color: '#6B7280' }}>
                                    Create your first moodboard to start organizing inspiration
                                </p>
                                <button
                                    onClick={() => setShowNewMoodboardModal(true)}
                                    className="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90"
                                    style={{ backgroundColor: creamPrimary, color: navyPrimary }}
                                >
                                    Create Moodboard
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {moodboards.map((moodboard) => (
                                    <Link
                                        key={moodboard.id}
                                        href={`/design-studio/moodboards/${moodboard.id}`}
                                        className="rounded-xl border overflow-hidden transition-all group hover:opacity-90"
                                        style={{ backgroundColor: `${navySecondary}80`, borderColor: '#2D3A4D' }}
                                    >
                                        <div className="aspect-video flex items-center justify-center" style={{ backgroundColor: `${navyPrimary}80` }}>
                                            {moodboard.coverImage ? (
                                                <img
                                                    src={moodboard.coverImage}
                                                    alt={moodboard.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Squares2X2Icon className="w-12 h-12" style={{ color: '#4A5568' }} />
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-medium transition-colors" style={{ color: creamPrimary }}>
                                                {moodboard.title}
                                            </h4>
                                            {moodboard.description && (
                                                <p className="text-sm mt-1 line-clamp-2" style={{ color: creamSecondary }}>
                                                    {moodboard.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-3">
                                                <span className="text-xs" style={{ color: '#6B7280' }}>
                                                    {new Date(moodboard.updatedAt).toLocaleDateString()}
                                                </span>
                                                <span
                                                    className="text-xs px-2 py-0.5 rounded-full"
                                                    style={{
                                                        backgroundColor: moodboard.visibility === 'private' ? '#374151' : moodboard.visibility === 'team' ? '#1E3A5F' : '#1E4D3D',
                                                        color: moodboard.visibility === 'private' ? '#9CA3AF' : moodboard.visibility === 'team' ? '#60A5FA' : '#34D399'
                                                    }}
                                                >
                                                    {moodboard.visibility}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* New Moodboard Modal */}
            {showNewMoodboardModal && (
                <NewMoodboardModal
                    onClose={() => setShowNewMoodboardModal(false)}
                    onCreate={handleCreateMoodboard}
                />
            )}

            {/* Upload Mockup Modal */}
            {showUploadMockupModal && (
                <UploadMockupModal
                    onClose={() => setShowUploadMockupModal(false)}
                    onUpload={handleUploadMockup}
                />
            )}

            {/* Upload Design File Modal */}
            {showUploadFileModal && (
                <UploadFileModal
                    onClose={() => setShowUploadFileModal(false)}
                    onUpload={handleUploadFile}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmModal.show && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div
                        className="rounded-2xl border p-6 w-full max-w-md shadow-2xl"
                        style={{ backgroundColor: navySecondary, borderColor: '#2D3A4D' }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EF444420' }}>
                                <XMarkIcon className="w-6 h-6" style={{ color: '#EF4444' }} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold" style={{ color: creamPrimary }}>Delete Mockup</h2>
                                <p className="text-sm" style={{ color: creamSecondary }}>This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="mb-6" style={{ color: creamSecondary }}>
                            Are you sure you want to delete <strong style={{ color: creamPrimary }}>{deleteConfirmModal.name}</strong>?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirmModal({ show: false, id: '', name: '' })}
                                className="px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-80"
                                style={{ backgroundColor: '#374151', color: creamSecondary }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteMockup}
                                className="px-6 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
                                style={{ backgroundColor: '#EF4444', color: 'white' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete File Confirmation Modal */}
            {deleteFileModal.show && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div
                        className="rounded-2xl border p-6 w-full max-w-md shadow-2xl"
                        style={{ backgroundColor: navySecondary, borderColor: '#2D3A4D' }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EF444420' }}>
                                <XMarkIcon className="w-6 h-6" style={{ color: '#EF4444' }} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold" style={{ color: creamPrimary }}>Delete File</h2>
                                <p className="text-sm" style={{ color: creamSecondary }}>This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="mb-6" style={{ color: creamSecondary }}>
                            Are you sure you want to delete <strong style={{ color: creamPrimary }}>{deleteFileModal.name}</strong>?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteFileModal({ show: false, id: '', name: '' })}
                                className="px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-80"
                                style={{ backgroundColor: '#374151', color: creamSecondary }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteFile}
                                className="px-6 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
                                style={{ backgroundColor: '#EF4444', color: 'white' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Modal Component for Moodboard
function NewMoodboardModal({
    onClose,
    onCreate
}: {
    onClose: () => void;
    onCreate: (title: string) => void;
}) {
    const [title, setTitle] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onCreate(title.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div
                className="rounded-2xl border p-6 w-full max-w-md shadow-2xl"
                style={{ backgroundColor: navySecondary, borderColor: '#2D3A4D' }}
            >
                <h2 className="text-xl font-bold mb-4" style={{ color: creamPrimary }}>Create Moodboard</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Moodboard title"
                        className="w-full rounded-lg px-4 py-3 transition-colors focus:outline-none"
                        style={{
                            backgroundColor: navyPrimary,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: '#2D3A4D',
                            color: creamPrimary
                        }}
                        autoFocus
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 transition-colors hover:opacity-80"
                            style={{ color: creamSecondary }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim()}
                            className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                            style={{ backgroundColor: creamPrimary, color: navyPrimary }}
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Modal Component for Mockup Upload
function UploadMockupModal({
    onClose,
    onUpload
}: {
    onClose: () => void;
    onUpload: (file: File, name: string, description: string) => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const acceptedTypes = '.png,.jpg,.jpeg,.webp,.svg,.pdf,.psd';
    const acceptedMimes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
        'image/vnd.adobe.photoshop',
        'application/x-photoshop',
        'application/photoshop',
        'application/psd',
        'image/psd'
    ];

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        // Check mime type or extension for PSD files
        const isPSD = droppedFile?.name.toLowerCase().endsWith('.psd');
        if (droppedFile && (acceptedMimes.includes(droppedFile.type) || isPSD)) {
            setFile(droppedFile);
            if (!name) setName(droppedFile.name.replace(/\.[^/.]+$/, ''));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!name) setName(selectedFile.name.replace(/\.[^/.]+$/, ''));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (file) {
            onUpload(file, name || file.name, description);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div
                className="rounded-2xl border p-6 w-full max-w-lg shadow-2xl"
                style={{ backgroundColor: navySecondary, borderColor: '#2D3A4D' }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold" style={{ color: creamPrimary }}>Upload Mockup</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:opacity-80">
                        <XMarkIcon className="w-6 h-6" style={{ color: creamSecondary }} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Drop Zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
                        style={{
                            borderColor: dragOver ? creamPrimary : '#2D3A4D',
                            backgroundColor: dragOver ? `${navyPrimary}80` : 'transparent'
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={acceptedTypes}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {file ? (
                            <div>
                                <DocumentIcon className="w-12 h-12 mx-auto mb-2" style={{ color: creamPrimary }} />
                                <p style={{ color: creamPrimary }}>{file.name}</p>
                                <p className="text-sm mt-1" style={{ color: creamSecondary }}>
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        ) : (
                            <div>
                                <ArrowUpTrayIcon className="w-12 h-12 mx-auto mb-2" style={{ color: '#4A5568' }} />
                                <p style={{ color: creamSecondary }}>
                                    Drag & drop or click to upload
                                </p>
                                <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                                    PNG, JPG, WEBP, SVG, PDF, PSD (max 100MB)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Name Input */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-2" style={{ color: creamSecondary }}>
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Mockup name"
                            className="w-full rounded-lg px-4 py-3 transition-colors focus:outline-none"
                            style={{
                                backgroundColor: navyPrimary,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: '#2D3A4D',
                                color: creamPrimary
                            }}
                        />
                    </div>

                    {/* Description Input */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-2" style={{ color: creamSecondary }}>
                            Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description..."
                            rows={3}
                            className="w-full rounded-lg px-4 py-3 transition-colors focus:outline-none resize-none"
                            style={{
                                backgroundColor: navyPrimary,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: '#2D3A4D',
                                color: creamPrimary
                            }}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 transition-colors hover:opacity-80"
                            style={{ color: creamSecondary }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!file}
                            className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                            style={{ backgroundColor: creamPrimary, color: navyPrimary }}
                        >
                            Upload
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Upload File Modal Component
function UploadFileModal({
    onClose,
    onUpload
}: {
    onClose: () => void;
    onUpload: (file: File, name: string, description: string) => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const acceptedTypes = '.ai,.eps,.svg,.obj,.fbx,.gltf,.glb,.sketch,.png,.jpg,.jpeg,.pdf,.docx,.txt';

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            if (!name) setName(droppedFile.name.replace(/\.[^/.]+$/, ''));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!name) setName(selectedFile.name.replace(/\.[^/.]+$/, ''));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (file) {
            onUpload(file, name || file.name, description);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div
                className="rounded-2xl border p-6 w-full max-w-lg shadow-2xl"
                style={{ backgroundColor: navySecondary, borderColor: '#2D3A4D' }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold" style={{ color: creamPrimary }}>Upload Design File</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:opacity-80">
                        <XMarkIcon className="w-6 h-6" style={{ color: creamSecondary }} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Drop Zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
                        style={{
                            borderColor: dragOver ? creamPrimary : '#3D4A5D',
                            backgroundColor: dragOver ? `${navyPrimary}80` : 'transparent'
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={acceptedTypes}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {file ? (
                            <div>
                                <DocumentIcon className="w-12 h-12 mx-auto mb-2" style={{ color: '#22C55E' }} />
                                <p style={{ color: creamPrimary }}>{file.name}</p>
                                <p className="text-sm mt-1" style={{ color: creamSecondary }}>
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        ) : (
                            <div>
                                <ArrowUpTrayIcon className="w-12 h-12 mx-auto mb-2" style={{ color: '#4A5568' }} />
                                <p style={{ color: creamSecondary }}>Drop file here or click to browse</p>
                                <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                                    AI, EPS, SVG, Sketch, PDF, Images, etc.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Name Input */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-2" style={{ color: creamSecondary }}>
                            File Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter file name"
                            className="w-full rounded-lg px-4 py-3 transition-colors focus:outline-none"
                            style={{
                                backgroundColor: navyPrimary,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: '#2D3A4D',
                                color: creamPrimary
                            }}
                        />
                    </div>

                    {/* Description Input */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-2" style={{ color: creamSecondary }}>
                            Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description..."
                            rows={3}
                            className="w-full rounded-lg px-4 py-3 transition-colors focus:outline-none resize-none"
                            style={{
                                backgroundColor: navyPrimary,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: '#2D3A4D',
                                color: creamPrimary
                            }}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 transition-colors hover:opacity-80"
                            style={{ color: creamSecondary }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!file}
                            className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                            style={{ backgroundColor: creamPrimary, color: navyPrimary }}
                        >
                            Upload
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
