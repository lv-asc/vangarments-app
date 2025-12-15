import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { COUNTRIES, BRAND_TAGS } from '@/lib/constants';

interface BulkActionsBarProps {
    selectedCount: number;
    selectedIds: string[];
    onClearSelection: () => void;
    onSuccess: () => void;
}

export default function BulkActionsBar({ selectedCount, selectedIds, onClearSelection, onSuccess }: BulkActionsBarProps) {
    const [action, setAction] = useState<'tags' | 'country' | 'delete' | null>(null);
    const [selectedTag, setSelectedTag] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const updates: any = {};

            if (action === 'delete') {
                if (!window.confirm(`Are you sure you want to delete ${selectedCount} brands? This action cannot be undone.`)) {
                    setLoading(false);
                    return;
                }
                await api.bulkDeleteBrands(selectedIds);
                toast.success(`Successfully deleted ${selectedCount} brands`);
                setAction(null);
                onSuccess();
                onClearSelection();
                return;
            }

            if (action === 'tags') {
                if (!selectedTag) {
                    toast.error('Please select a tag');
                    setLoading(false);
                    return;
                }
                updates.tagsToAdd = [selectedTag];
            } else if (action === 'country') {
                if (!selectedCountry) {
                    toast.error('Please select a country');
                    setLoading(false);
                    return;
                }
                updates.country = selectedCountry;
            }

            await api.bulkUpdateBrands(selectedIds, updates);
            toast.success(`Successfully updated ${selectedCount} brands`);
            setAction(null);
            setSelectedTag('');
            setSelectedCountry('');
            onSuccess();
            onClearSelection();
        } catch (error: any) {
            console.error('Bulk action failed', error);
            toast.error(error.message || 'Failed to update brands');
        } finally {
            setLoading(false);
        }
    };

    if (selectedCount === 0) return null;

    return (
        <>
            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <span className="font-medium text-gray-900">{selectedCount} brands selected</span>
                        <button
                            onClick={onClearSelection}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Unselect All
                        </button>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => { setAction('tags'); setSelectedTag(''); }}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
                        >
                            Add Tags
                        </button>
                        <button
                            onClick={() => { setAction('country'); setSelectedCountry(''); }}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
                        >
                            Set Country
                        </button>
                        <button
                            onClick={() => setAction('delete')}
                            className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md hover:bg-red-100 text-sm font-medium"
                        >
                            Delete Selected
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Dialog */}
            <Dialog open={!!action} onClose={() => setAction(null)} className="relative z-[60]">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl">
                        <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                            {action === 'tags' ? 'Add Tag to Selected' :
                                action === 'country' ? 'Set Country for Selected' :
                                    'Delete Selected Brands'}
                        </Dialog.Title>

                        <div className="mb-6">
                            {action === 'tags' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Tag</label>
                                    <div className="flex flex-wrap gap-2">
                                        {BRAND_TAGS.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => setSelectedTag(tag)}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedTag === tag
                                                        ? 'bg-blue-100 text-blue-800 border-blue-200 ring-2 ring-blue-500 ring-offset-1'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : action === 'country' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <select
                                        value={selectedCountry}
                                        onChange={e => setSelectedCountry(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                    >
                                        <option value="">Select Country...</option>
                                        {COUNTRIES.map(c => (
                                            <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600">
                                    Are you sure you want to delete the {selectedCount} selected brands? This action will move them to the trash.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setAction(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${action === 'delete'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {loading ? 'Processing...' : action === 'delete' ? 'Confirm Delete' : 'Apply Details'}
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </>
    );
}
