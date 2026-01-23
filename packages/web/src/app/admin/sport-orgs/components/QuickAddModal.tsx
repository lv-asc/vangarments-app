'use client';

import React, { useState } from 'react';
import { SQUAD_TEMPLATES } from '@vangarments/shared/constants';
import { sportOrgApi } from '@/lib/sportOrgApi';
import toast from 'react-hot-toast';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/20/solid';

interface QuickAddModalProps {
    orgId: string;
    deptId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function QuickAddModal({ orgId, deptId, onClose, onSuccess }: QuickAddModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string>('standard_academy');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await sportOrgApi.quickAddSquads(orgId, deptId, selectedTemplate);
            toast.success('Squads created from template');
            onSuccess();
        } catch (error) {
            toast.error('Failed to create squads');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-green-50">
                    <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-green-600" />
                        Quick Add Squads
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        Choose a template to quickly generate multiple squads for this department.
                    </p>

                    <div className="space-y-3">
                        {Object.keys(SQUAD_TEMPLATES).map(key => (
                            <label
                                key={key}
                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${selectedTemplate === key ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="template"
                                    value={key}
                                    checked={selectedTemplate === key}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="h-4 w-4 text-green-600"
                                />
                                <div className="ml-3">
                                    <span className="block text-sm font-bold text-gray-900 capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <span className="block text-xs text-gray-500">
                                        Generates {SQUAD_TEMPLATES[key as keyof typeof SQUAD_TEMPLATES].length} squads
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Template Squads'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
