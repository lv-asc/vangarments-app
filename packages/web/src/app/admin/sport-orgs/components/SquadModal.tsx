'use client';

import React, { useState } from 'react';
import { SportSquad, AgeGroup, SquadGender } from '@vangarments/shared/types';
import { AGE_GROUPS, SQUAD_GENDERS } from '@vangarments/shared/constants';
import { sportOrgApi } from '@/lib/sportOrgApi';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/20/solid';

interface SquadModalProps {
    orgId: string;
    deptId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function SquadModal({ orgId, deptId, onClose, onSuccess }: SquadModalProps) {
    const [formData, setFormData] = useState<Partial<SportSquad>>({
        name: '',
        slug: '',
        ageGroup: 'Open',
        gender: 'Mens',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await sportOrgApi.createSquad(orgId, deptId, formData);
            toast.success('Squad created');
            onSuccess();
        } catch (error) {
            toast.error('Failed to create squad');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">New Squad</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Squad Name</label>
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
                            placeholder="e.g. Under-20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Age Group</label>
                            <select
                                value={formData.ageGroup}
                                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value as AgeGroup })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Gender</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value as SquadGender })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {SQUAD_GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
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
                            {loading ? 'Creating...' : 'Create Squad'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
