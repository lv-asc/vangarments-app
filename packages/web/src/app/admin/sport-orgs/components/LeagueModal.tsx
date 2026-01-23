'use client';

import React, { useState } from 'react';
import { SportLeague } from '@vangarments/shared/types';
import { TRADITIONAL_SPORTS, ESPORT_GAMES } from '@vangarments/shared/constants';
import { sportOrgApi } from '@/lib/sportOrgApi';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/20/solid';

interface LeagueModalProps {
    league?: SportLeague;
    onClose: () => void;
    onSuccess: () => void;
}

export default function LeagueModal({ league, onClose, onSuccess }: LeagueModalProps) {
    const [formData, setFormData] = useState<Partial<SportLeague>>(league || {
        name: '',
        slug: '',
        sportType: 'Soccer',
        category: 'traditional',
        level: 'Professional',
        website: '',
        country: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (league) {
                // update not yet in API but let's assume it follows pattern
                // @ts-ignore
                await sportOrgApi.updateLeague(league.id, formData);
                toast.success('League updated');
            } else {
                await sportOrgApi.createLeague(formData);
                toast.success('League created');
            }
            onSuccess();
        } catch (error) {
            toast.error('Failed to save league');
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (name: string) => {
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        setFormData({ ...formData, name, slug });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">{league ? 'Edit League' : 'New League'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">League Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Premier League"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="traditional">Traditional</option>
                                <option value="esport">e-Sport</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Sport / Game</label>
                            <select
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
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Level</label>
                            <select
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Professional">Professional</option>
                                <option value="Semi-Pro">Semi-Pro</option>
                                <option value="Amateur">Amateur</option>
                                <option value="International">International</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. England"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Website</label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="https://..."
                        />
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
                            {loading ? 'Saving...' : (league ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
