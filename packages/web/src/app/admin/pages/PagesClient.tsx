'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { pageApi, IPage } from '@/lib/pageApi';

export default function AdminPagesPage() {
    const [items, setItems] = useState<IPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<IPage | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        logoUrl: '',
        bannerUrl: '',
        websiteUrl: '',
        instagramUrl: '',
        twitterUrl: '',
        facebookUrl: '',
        isVerified: false,
        isActive: true
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const data = await pageApi.getAll();
            setItems(data);
        } catch (error) {
            toast.error('Failed to fetch pages');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await pageApi.update(editingItem.id, formData);
                toast.success('Page updated');
            } else {
                await pageApi.create(formData);
                toast.success('Page created');
            }
            fetchItems();
            handleCloseModal();
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this page?')) return;
        try {
            await pageApi.delete(id);
            toast.success('Page deleted');
            setItems(items.filter(item => item.id !== id));
        } catch (error) {
            toast.error('Failed to delete page');
        }
    };

    const handleOpenModal = (item?: IPage) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                description: item.description || '',
                logoUrl: item.logoUrl || '',
                bannerUrl: item.bannerUrl || '',
                websiteUrl: item.websiteUrl || '',
                instagramUrl: item.instagramUrl || '',
                twitterUrl: item.twitterUrl || '',
                facebookUrl: item.facebookUrl || '',
                isVerified: item.isVerified,
                isActive: item.isActive
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                description: '',
                logoUrl: '',
                bannerUrl: '',
                websiteUrl: '',
                instagramUrl: '',
                twitterUrl: '',
                facebookUrl: '',
                isVerified: false,
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({
            name: '',
            description: '',
            logoUrl: '',
            bannerUrl: '',
            websiteUrl: '',
            instagramUrl: '',
            twitterUrl: '',
            facebookUrl: '',
            isVerified: false,
            isActive: true
        });
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Pages Management</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage pages (e.g. Vogue, Bazaar, NYT) to associate with Journalism content.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add Page
                    </button>
                </div>
            </div>

            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Logo</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Website</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                {item.logoUrl ? (
                                                    <img src={item.logoUrl} alt={item.name} className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                                                        {item.name.charAt(0)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                                                <div className="flex items-center">
                                                    {item.name}
                                                    {item.isVerified && (
                                                        <span className="ml-1.5 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">
                                                            ✓
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-gray-500 text-xs truncate max-w-xs">{item.description}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {item.isActive ? 'Active' : 'Hidden'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {item.websiteUrl && (
                                                    <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                                                        Website
                                                    </a>
                                                )}
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    <PencilSquareIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-4">{editingItem ? 'Edit Page' : 'New Page'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div className="flex items-end space-x-4 mb-1">
                                        <div className="flex items-center">
                                            <input
                                                id="isVerified"
                                                type="checkbox"
                                                checked={formData.isVerified}
                                                onChange={e => setFormData({ ...formData, isVerified: e.target.checked })}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <label htmlFor="isVerified" className="ml-2 block text-sm text-gray-900">Verified</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="isActive"
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Active</label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        rows={2}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                                        <input
                                            type="url"
                                            value={formData.logoUrl}
                                            onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Banner URL</label>
                                        <input
                                            type="url"
                                            value={formData.bannerUrl}
                                            onChange={e => setFormData({ ...formData, bannerUrl: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Website URL</label>
                                    <input
                                        type="url"
                                        value={formData.websiteUrl}
                                        onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="border-t border-gray-200 pt-4 mt-4">
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">Social Media</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Instagram</label>
                                            <input
                                                type="url"
                                                value={formData.instagramUrl}
                                                onChange={e => setFormData({ ...formData, instagramUrl: e.target.value })}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                                placeholder="https://instagram.com/..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Twitter (X)</label>
                                            <input
                                                type="url"
                                                value={formData.twitterUrl}
                                                onChange={e => setFormData({ ...formData, twitterUrl: e.target.value })}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                                placeholder="https://twitter.com/..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Facebook</label>
                                            <input
                                                type="url"
                                                value={formData.facebookUrl}
                                                onChange={e => setFormData({ ...formData, facebookUrl: e.target.value })}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                                placeholder="https://facebook.com/..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end space-x-3 border-t border-gray-100 pt-5">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                    {editingItem ? 'Update Page' : 'Create Page'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

