/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import LogoUploader from './LogoUploader';

interface CollectionManagementProps {
    brandId: string;
}

interface Collection {
    id: string;
    brandId: string;
    name: string;
    description?: string;
    coverImageUrl?: string;
    collectionType?: string;
    season?: string;
    year?: number;
    isPublished?: boolean;
}

const COLLECTION_TYPES = ['Seasonal', 'Capsule', 'Collaboration', 'Limited', 'Core', 'Other'];

export default function CollectionManagement({ brandId }: CollectionManagementProps) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        coverImageUrl: '',
        collectionType: 'Seasonal',
        season: '',
        year: new Date().getFullYear(),
        isPublished: true
    });

    useEffect(() => {
        fetchCollections();
    }, [brandId]);

    const fetchCollections = async () => {
        try {
            setLoading(true);
            const res = await apiClient.getBrandCollections(brandId);
            setCollections(res.collections || []);
        } catch (error) {
            console.error('Failed to fetch collections:', error);
            toast.error('Failed to load collections');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                coverImageUrl: formData.coverImageUrl,
                collectionType: formData.collectionType,
                season: formData.season,
                year: Number(formData.year),
                isPublished: formData.isPublished
            };

            if (editingCollection) {
                await apiClient.updateBrandCollection(brandId, editingCollection.id, payload);
                toast.success('Collection updated successfully');
            } else {
                await apiClient.createBrandCollection(brandId, payload);
                toast.success('Collection created successfully');
            }
            fetchCollections();
            resetForm();
        } catch (error) {
            console.error('Save collection error:', error);
            toast.error('Failed to save collection');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this collection? items associated with it might lose their grouping.')) return;
        try {
            await apiClient.deleteBrandCollection(brandId, id);
            toast.success('Collection deleted');
            fetchCollections();
        } catch (error) {
            console.error('Delete collection error:', error);
            toast.error('Failed to delete collection');
        }
    };

    const startEdit = (collection: Collection) => {
        setEditingCollection(collection);
        setFormData({
            name: collection.name,
            description: collection.description || '',
            coverImageUrl: collection.coverImageUrl || '',
            collectionType: collection.collectionType || 'Seasonal',
            season: collection.season || '',
            year: collection.year || new Date().getFullYear(),
            isPublished: collection.isPublished !== undefined ? collection.isPublished : true
        });
        setShowAddForm(true);
    };

    const resetForm = () => {
        setEditingCollection(null);
        setFormData({
            name: '',
            description: '',
            coverImageUrl: '',
            collectionType: 'Seasonal',
            season: '',
            year: new Date().getFullYear(),
            isPublished: true
        });
        setShowAddForm(false);
    };

    // Helper to extract logo string array for LogoUploader (reusing for cover image)
    const getImagesArray = () => formData.coverImageUrl ? [formData.coverImageUrl] : [];

    // Helper to update logo from LogoUploader
    const handleImageChange = (newImages: string[]) => {
        setFormData(prev => ({ ...prev, coverImageUrl: newImages[0] || '' }));
    };

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        if (url.startsWith('/api')) return url;

        // Normalize path: strip leading slash
        let path = url.startsWith('/') ? url.substring(1) : url;

        // Handle /storage prefix from backend
        if (path.startsWith('storage/')) {
            path = path.substring('storage/'.length);
        }

        return `/api/storage/${path}`;
    };

    if (loading) return <div>Loading collections...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Collections</h3>
                {!showAddForm && (
                    <Button onClick={() => setShowAddForm(true)}>
                        Add New Collection
                    </Button>
                )}
            </div>

            {showAddForm && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-900">
                            {editingCollection ? 'Edit Collection' : 'New Collection'}
                        </h4>
                        <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Cover Image Uploader */}
                        <div>
                            <LogoUploader
                                logos={getImagesArray()}
                                onChange={handleImageChange}
                                label="Cover Image"
                                buttonLabel="Upload Cover Image"
                                emptyStateMessage="No cover image uploaded yet"
                                helperText="Upload a cover image for this collection."
                            />
                        </div>

                        {/* Collection Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Collection Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    value={formData.collectionType}
                                    onChange={e => setFormData({ ...formData, collectionType: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                >
                                    {COLLECTION_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Season */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Season</label>
                                <input
                                    type="text"
                                    value={formData.season}
                                    onChange={e => setFormData({ ...formData, season: e.target.value })}
                                    placeholder="e.g. SS24, FW24"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                />
                            </div>

                            {/* Year */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Year</label>
                                <input
                                    type="number"
                                    value={formData.year}
                                    onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                />
                            </div>

                            {/* Published Checkbox */}
                            <div className="flex items-center mt-6">
                                <input
                                    id="isPublished"
                                    type="checkbox"
                                    checked={formData.isPublished}
                                    onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                                    Published
                                </label>
                            </div>
                        </div>


                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                            <Button type="submit">{editingCollection ? 'Save Changes' : 'Create Collection'}</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                <ul className="divide-y divide-gray-200">
                    {collections.length === 0 ? (
                        <li className="px-6 py-4 text-center text-gray-500 text-sm">No collections registered yet.</li>
                    ) : (
                        collections.map(collection => (
                            <li key={collection.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    {collection.coverImageUrl ? (
                                        <img src={getImageUrl(collection.coverImageUrl)} alt={collection.name} className="h-16 w-16 object-cover rounded-md bg-gray-100 border border-gray-200" />
                                    ) : (
                                        <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold border border-gray-300">
                                            NO IMG
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{collection.name}</p>
                                        <p className="text-xs text-gray-500 mb-1">{collection.description ? collection.description.substring(0, 50) + (collection.description.length > 50 ? '...' : '') : 'No description'}</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {collection.collectionType && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    {collection.collectionType}
                                                </span>
                                            )}
                                            {collection.season && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                    {collection.season}
                                                </span>
                                            )}
                                            {collection.year && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                    {collection.year}
                                                </span>
                                            )}
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${collection.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {collection.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button onClick={() => startEdit(collection)} className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50">
                                        <PencilSquareIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleDelete(collection.id)} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
