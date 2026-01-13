'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, CloudIcon, ServerIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface DbStatus {
    currentMode: 'local' | 'cloud';
    localConnected: boolean;
    cloudConnected: boolean;
    cloudHost: string;
}

interface SyncProgress {
    step: number;
    totalSteps: number;
    percent: number;
    description: string;
    details?: string;
}

export default function DatabaseAdminPage() {
    const [status, setStatus] = useState<DbStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');
    const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState<SyncProgress | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    // Modal states
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'primary' | 'danger';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        variant: 'primary'
    });

    useEffect(() => {
        fetchStatus();
        return () => {
            // Cleanup EventSource on unmount
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/admin/db/status');
            setStatus(response as DbStatus);
        } catch (error) {
            console.error('Failed to fetch DB status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSwitch = async (mode: 'local' | 'cloud') => {
        setModalConfig({
            isOpen: true,
            title: 'Switch Database',
            message: `Are you sure you want to switch to the ${mode} database? The server will need to be restarted manually afterward.`,
            variant: 'primary',
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                try {
                    setSyncing(true);
                    setSyncMessage(`Switching to ${mode}...`);
                    await apiClient.post('/admin/db/switch', { mode });
                    setSyncMessage(`Switched to ${mode}. Please restart the server (npm run dev).`);
                    setSyncStatus('success');
                    await fetchStatus();
                } catch (error: any) {
                    setSyncMessage(`Failed to switch: ${error.message}`);
                    setSyncStatus('error');
                } finally {
                    setSyncing(false);
                }
            }
        });
    };

    const startSyncWithSSE = (endpoint: string, actionName: string) => {
        setSyncing(true);
        setSyncStatus('running');
        setSyncMessage(`${actionName}...`);
        setProgress({ step: 0, totalSteps: 4, percent: 0, description: 'Initializing...', details: 'Connecting to server' });

        // Close any existing EventSource
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        // Get auth token for SSE
        const token = typeof window !== 'undefined'
            ? (document.cookie.match(/auth_token=([^;]+)/)?.[1] || localStorage.getItem('auth_token'))
            : null;

        // Create EventSource with auth (using fetch for initial auth, then SSE)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const sseUrl = `${apiUrl}/admin/db/sync/${endpoint}`;

        // Unfortunately EventSource doesn't support headers, so we'll use fetch with streaming
        fetch(sseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }).then(async response => {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response body');
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.status === 'complete') {
                                setProgress({ step: 4, totalSteps: 4, percent: 100, description: 'Complete!', details: data.message });
                                setSyncMessage(data.message || `${actionName} completed successfully!`);
                                setSyncStatus('success');
                                setSyncing(false);
                            } else if (data.status === 'error') {
                                setSyncMessage(data.message || `${actionName} failed`);
                                setSyncStatus('error');
                                setSyncing(false);
                                setProgress(null);
                            } else if (data.step !== undefined) {
                                setProgress({
                                    step: data.step,
                                    totalSteps: data.totalSteps,
                                    percent: data.percent,
                                    description: data.description,
                                    details: data.details
                                });
                                setSyncMessage(data.description);
                            }
                        } catch (e) {
                            console.error('Failed to parse SSE data:', e);
                        }
                    }
                }
            }
        }).catch(error => {
            console.error('SSE fetch error:', error);
            setSyncMessage(`${actionName} failed: ${error.message}`);
            setSyncStatus('error');
            setSyncing(false);
            setProgress(null);
        });
    };

    const handlePush = async () => {
        setModalConfig({
            isOpen: true,
            title: 'Push to Cloud',
            message: 'Are you sure you want to push the local database to the cloud? This will OVERWRITE all existing data on the cloud instance. This action cannot be undone.',
            variant: 'danger',
            onConfirm: () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                startSyncWithSSE('push', 'Pushing to cloud');
            }
        });
    };

    const handlePull = async () => {
        setModalConfig({
            isOpen: true,
            title: 'Pull from Cloud',
            message: 'Are you sure you want to pull the cloud database to local? This will OVERWRITE all your local data. This action cannot be undone.',
            variant: 'danger',
            onConfirm: () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                startSyncWithSSE('pull', 'Pulling from cloud');
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/admin" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                        Back to Admin
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Database Management</h1>
                    <p className="text-gray-600 mt-1">Switch between local and cloud databases, sync data</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Current Status */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Local Status */}
                                <div className={`p-4 rounded-lg border-2 ${status?.currentMode === 'local' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <ServerIcon className="h-8 w-8 text-gray-700" />
                                        <div>
                                            <p className="font-semibold text-gray-900">Local Database</p>
                                            <p className="text-sm text-gray-500">localhost:5432</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        {status?.localConnected ? (
                                            <>
                                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                <span className="text-sm text-green-600">Connected</span>
                                            </>
                                        ) : (
                                            <>
                                                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                                                <span className="text-sm text-red-600">Disconnected</span>
                                            </>
                                        )}
                                    </div>
                                    {status?.currentMode === 'local' && (
                                        <span className="inline-block mt-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">Active</span>
                                    )}
                                </div>

                                {/* Cloud Status */}
                                <div className={`p-4 rounded-lg border-2 ${status?.currentMode === 'cloud' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <CloudIcon className="h-8 w-8 text-gray-700" />
                                        <div>
                                            <p className="font-semibold text-gray-900">Cloud Database</p>
                                            <p className="text-sm text-gray-500">{status?.cloudHost || 'Not configured'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        {status?.cloudConnected ? (
                                            <>
                                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                <span className="text-sm text-green-600">Connected</span>
                                            </>
                                        ) : (
                                            <>
                                                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                                                <span className="text-sm text-red-600">Disconnected</span>
                                            </>
                                        )}
                                    </div>
                                    {status?.currentMode === 'cloud' && (
                                        <span className="inline-block mt-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">Active</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Switch Database */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Switch Database</h2>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleSwitch('local')}
                                    disabled={syncing || status?.currentMode === 'local'}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ServerIcon className="h-5 w-5" />
                                    Switch to Local
                                </button>
                                <button
                                    onClick={() => handleSwitch('cloud')}
                                    disabled={syncing || status?.currentMode === 'cloud' || !status?.cloudConnected}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <CloudIcon className="h-5 w-5" />
                                    Switch to Cloud
                                </button>
                            </div>
                        </div>

                        {/* Sync Actions */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Data</h2>
                            <div className="flex gap-4">
                                <button
                                    onClick={handlePush}
                                    disabled={syncing || !status?.cloudConnected}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ArrowUpTrayIcon className="h-5 w-5" />
                                    Push to Cloud
                                </button>
                                <button
                                    onClick={handlePull}
                                    disabled={syncing || !status?.cloudConnected}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ArrowDownTrayIcon className="h-5 w-5" />
                                    Pull from Cloud
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                ⚠️ Sync operations will overwrite the target database completely.
                            </p>
                        </div>

                        {/* Progress Bar with Steps */}
                        {progress && syncing && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="space-y-4">
                                    {/* Progress header */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">
                                            Step {progress.step} of {progress.totalSteps}
                                        </span>
                                        <span className="text-sm font-semibold text-blue-600">
                                            {progress.percent}%
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${progress.percent}%` }}
                                        />
                                    </div>

                                    {/* Step description */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-600 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium text-gray-900">{progress.description}</p>
                                                {progress.details && (
                                                    <p className="text-sm text-gray-500 mt-0.5">{progress.details}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step indicators */}
                                    <div className="flex justify-between mt-2">
                                        {[1, 2, 3, 4].map((step) => (
                                            <div key={step} className="flex flex-col items-center">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step < progress.step
                                                        ? 'bg-green-500 text-white'
                                                        : step === progress.step
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-200 text-gray-500'
                                                        }`}
                                                >
                                                    {step < progress.step ? (
                                                        <CheckCircleIcon className="h-5 w-5" />
                                                    ) : (
                                                        step
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500 mt-1">
                                                    {step === 1 ? 'Dump' : step === 2 ? 'Process' : step === 3 ? 'Upload' : 'Cleanup'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sync Status Message (shown when not showing progress) */}
                        {syncMessage && !progress && (
                            <div className={`rounded-lg p-4 ${syncStatus === 'success' ? 'bg-green-50 border border-green-200' :
                                syncStatus === 'error' ? 'bg-red-50 border border-red-200' :
                                    'bg-blue-50 border border-blue-200'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {syncStatus === 'running' && <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-600" />}
                                    {syncStatus === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                                    {syncStatus === 'error' && <ExclamationCircleIcon className="h-5 w-5 text-red-600" />}
                                    <p className={`text-sm font-medium ${syncStatus === 'success' ? 'text-green-800' :
                                        syncStatus === 'error' ? 'text-red-800' :
                                            'text-blue-800'
                                        }`}>{syncMessage}</p>
                                </div>
                            </div>
                        )}

                        {/* Success/Error message after completion */}
                        {syncMessage && progress && !syncing && (
                            <div className={`rounded-lg p-4 ${syncStatus === 'success' ? 'bg-green-50 border border-green-200' :
                                'bg-red-50 border border-red-200'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {syncStatus === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                                    {syncStatus === 'error' && <ExclamationCircleIcon className="h-5 w-5 text-red-600" />}
                                    <p className={`text-sm font-medium ${syncStatus === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                        {syncMessage}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Refresh Button */}
                        <button
                            onClick={fetchStatus}
                            disabled={loading || syncing}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh Status
                        </button>
                    </div>
                )}
            </div>

            {/* In-app Modals */}
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                variant={modalConfig.variant}
                confirmText={modalConfig.variant === 'danger' ? 'Confirm Action' : 'Agree and Proceed'}
                isLoading={syncing}
            />
        </div>
    );
}
