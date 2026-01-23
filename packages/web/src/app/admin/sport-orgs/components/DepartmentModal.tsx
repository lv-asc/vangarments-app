'use client';

import React, { useState } from 'react';
import { SportDepartment } from '@vangarments/shared/types';
import { TRADITIONAL_SPORTS, ESPORT_GAMES } from '@vangarments/shared/constants';
import { sportOrgApi } from '@/lib/sportOrgApi';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/20/solid';

interface DepartmentModalProps {
    orgId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DepartmentModal({ orgId, onClose, onSuccess }: DepartmentModalProps) {
    const [formData, setFormData] = useState<Partial<SportDepartment>>({
        name: '',
        slug: '',
        category: 'traditional',
        sportType: 'Soccer',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await sportOrgApi.createDepartment(orgId, formData);
            toast.success('Department created');
            onSuccess();
        } catch (error) {
            toast.error('Failed to create department');
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (category: 'traditional' | 'esport') => {
        setFormData({
            ...formData,
            category,
            sportType: category === 'traditional' ? 'Soccer' : 'Counter-Strike'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">New Department</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Department Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({
                                ...formData,
                                name: e.target.value,
                                slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
                            })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Professional Soccer"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                        <div className="flex gap-2">
                            {(['traditional', 'esport'] as const).map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-bold transition-all ${formData.category === cat
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {cat === 'traditional' ? 'Traditional Sport' : 'e-Sport'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Sport / Game</label>
                        <select
                            required
                            value={formData.sportType}
                            onChange={(e) => setFormData({ ...formData, sportType: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {formData.category === 'traditional' ? (
                                TRADITIONAL_SPORTS.map(s => <option key={s} value={s}>{s}</option>)
                            ) : (
                                ESPORT_GAMES.map(g => <option key={g} value={g}>{g}</option>)
                            )}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Department'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
