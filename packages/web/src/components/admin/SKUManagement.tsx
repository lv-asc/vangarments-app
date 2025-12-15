'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import SearchableCombobox from '@/components/ui/Combobox';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface SKUManagementProps {
    brandId: string;
}

export default function SKUManagement({ brandId }: SKUManagementProps) {
    const [skus, setSkus] = useState<any[]>([]);
    const [lines, setLines] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        collection: '',
        lineId: '',
        description: '',
        material: '',
        category: ''
    });

    const fetchSkus = async () => {
        setLoading(true);
        try {
            const res = await apiClient.getBrandSKUs(brandId);
            setSkus(res.skus);
        } catch (error) {
            console.error('Failed to fetch SKUs', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLines = async () => {
        try {
            const res = await apiClient.getBrandLines(brandId);
            setLines(res.lines || []);
        } catch (error) {
            console.error('Failed to fetch lines', error);
        }
    };

    useEffect(() => {
        if (brandId) {
            fetchSkus();
            fetchLines(); // Fetch lines on mount
        }
    }, [brandId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.createSKU(brandId, {
                ...formData,
                line: lines.find(l => l.id === formData.lineId)?.name || '', // Legacy fallback
                category: { page: formData.category } // Simplified for now
            });
            setShowAddForm(false);
            setFormData({ name: '', code: '', collection: '', lineId: '', description: '', material: '', category: '' });
            fetchSkus();
            toast.success('SKU created');
        } catch (error) {
            console.error('Failed to create SKU', error);
            toast.error('Failed to create SKU');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Official SKUs</h3>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? 'Cancel' : 'Register New SKU'}
                </Button>
            </div>

            {showAddForm && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Model Name</label>
                            <input
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Code / SKU</label>
                            <input
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Collection</label>
                            <input
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.collection}
                                onChange={e => setFormData({ ...formData, collection: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Line</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.lineId}
                                onChange={e => setFormData({ ...formData, lineId: e.target.value })}
                            >
                                <option value="">Select a Line...</option>
                                {lines.map(line => (
                                    <option key={line.id} value={line.id}>{line.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <input
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                placeholder="e.g. Footwear"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Button type="submit">Create SKU</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {skus.map(sku => (
                        <li key={sku.id} className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Line Logo or Placeholder */}
                                    {sku.lineInfo?.logo ? (
                                        <img src={sku.lineInfo.logo} alt={sku.lineInfo.name} className="h-8 w-8 object-contain rounded-full bg-gray-50 border border-gray-100" />
                                    ) : sku.lineInfo?.name ? (
                                        <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-bold border border-blue-100">
                                            {sku.lineInfo.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    ) : null}

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-blue-600 truncate">{sku.name}</p>
                                            {sku.lineInfo && (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                    {sku.lineInfo.name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="flex items-center text-sm text-gray-500">
                                            Code: {sku.code} | Collection: {sku.collection}
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-2 flex-shrink-0 flex">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                    {skus.length === 0 && !loading && (
                        <li className="px-4 py-8 text-center text-gray-500">No SKUs registered yet.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
