/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import { brandApi, BrandLookbook, BrandCollection } from '../../lib/brandApi';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import LogoUploader from './LogoUploader';

interface LookbookManagementProps {
    brandId: string;
}

export default function LookbookManagement({ brandId }: LookbookManagementProps) {
    const [lookbooks, setLookbooks] = useState<BrandLookbook[]>([]);
    const [collections, setCollections] = useState<BrandCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingLookbook, setEditingLookbook] = useState<BrandLookbook | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        collectionId: '',
        name: '',
        description: '',
        images: [] as string[],
        season: '',
        year: new Date().getFullYear(),
        isPublished: true
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [lookbooksRes, collectionsRes] = await Promise.all([
                    brandApi.getLookbooks(brandId, false),
                    brandApi.getCollections(brandId, false)
                ]);
                setLookbooks(lookbooksRes || []);
                setCollections(collectionsRes || []);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                toast.error('Failed to load lookbooks data');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [brandId]);


    const handleCollectionChange = (collectionId: string) => {
        const collection = collections.find(c => c.id === collectionId);
        if (collection) {
            setFormData(prev => ({
                ...prev,
                collectionId: collection.id,
                name: collection.name,
                description: collection.description || '',
                season: collection.season || '',
                year: collection.year || new Date().getFullYear()
            }));
        } else {
            // Reset if no collection selected (option value "")
            setFormData(prev => ({
                ...prev,
                collectionId: '',
                name: '',
                description: '',
                season: '',
                year: new Date().getFullYear()
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.collectionId) {
            toast.error('Please select a collection');
            return;
        }

        try {
            // First image is cover image
            const coverImageUrl = formData.images.length > 0 ? formData.images[0] : '';

            const payload = {
                collectionId: formData.collectionId,
                name: formData.name,
                description: formData.description,
                images: formData.images,
                coverImageUrl: coverImageUrl, // Explicitly set cover image
                season: formData.season,
                year: Number(formData.year),
                isPublished: formData.isPublished
            };

            if (editingLookbook) {
                await brandApi.updateLookbook(brandId, editingLookbook.id, payload);
                toast.success('Lookbook updated successfully');
            } else {
                await brandApi.createLookbook(brandId, payload);
                toast.success('Lookbook created successfully');
            }

            // Refresh list
            const res = await brandApi.getLookbooks(brandId, false);
            setLookbooks(res || []);

            resetForm();
        } catch (error) {
            console.error('Save lookbook error:', error);
            toast.error('Failed to save lookbook');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lookbook? Items associated with it might lose their grouping.')) return;
        try {
            await brandApi.deleteLookbook(brandId, id);
            toast.success('Lookbook deleted');
            // Refresh list
            const res = await brandApi.getLookbooks(brandId, false);
            setLookbooks(res || []);
        } catch (error) {
            console.error('Delete lookbook error:', error);
            toast.error('Failed to delete lookbook');
        }
    };

    const startEdit = (lookbook: BrandLookbook) => {
        setEditingLookbook(lookbook);
        setFormData({
            collectionId: lookbook.collectionId || '',
            name: lookbook.name,
            description: lookbook.description || '',
            images: lookbook.images || (lookbook.coverImageUrl ? [lookbook.coverImageUrl] : []),
            season: lookbook.season || '',
            year: lookbook.year || new Date().getFullYear(),
            isPublished: lookbook.isPublished !== undefined ? lookbook.isPublished : true
        });
        setShowAddForm(true);
    };

    const resetForm = () => {
        setEditingLookbook(null);
        setFormData({
            collectionId: '',
            name: '',
            description: '',
            images: [],
            season: '',
            year: new Date().getFullYear(),
            isPublished: true
        });
        setShowAddForm(false);
    };

    const handleImagesChange = (newImages: string[]) => {
        setFormData(prev => ({ ...prev, images: newImages }));
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

    if (loading) return <div>Loading lookbooks...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Lookbooks</h3>
                {!showAddForm && (
                    <Button onClick={() => setShowAddForm(true)}>
                        Add New Lookbook
                    </Button>
                )}
            </div>

            {showAddForm && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-900">
                            {editingLookbook ? 'Edit Lookbook' : 'New Lookbook'}
                        </h4>
                        <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Collection Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Collection *</label>
                            <select
                                value={formData.collectionId}
                                onChange={(e) => handleCollectionChange(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                required
                            >
                                <option value="">Select a Collection</option>
                                {collections.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.season} {c.year})</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Lookbook details will be inherited from the selected collection.</p>
                        </div>


                        {/* Image Uploader */}
                        <div>
                            <LogoUploader
                                logos={formData.images}
                                onChange={handleImagesChange}
                                label="Lookbook Images"
                                buttonLabel="Upload Images"
                                emptyStateMessage="No images uploaded yet"
                                helperText="Upload images for this lookbook. The first image will be used as the cover."
                            />
                        </div>

                        {/* Lookbook Name (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Lookbook Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                readOnly
                                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border cursor-not-allowed"
                            />
                        </div>

                        {/* Description (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={formData.description}
                                readOnly
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border cursor-not-allowed"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Season (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Season</label>
                                <input
                                    type="text"
                                    value={formData.season}
                                    readOnly
                                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border cursor-not-allowed"
                                />
                            </div>

                            {/* Year (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Year</label>
                                <input
                                    type="number"
                                    value={formData.year}
                                    readOnly
                                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border cursor-not-allowed"
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
                            <Button type="submit">{editingLookbook ? 'Save Changes' : 'Create Lookbook'}</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                <ul className="divide-y divide-gray-200">
                    {lookbooks.length === 0 ? (
                        <li className="px-6 py-4 text-center text-gray-500 text-sm">No lookbooks registered yet.</li>
                    ) : (
                        lookbooks.map(lookbook => (
                            <li key={lookbook.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    {lookbook.coverImageUrl ? (
                                        <img src={getImageUrl(lookbook.coverImageUrl)} alt={lookbook.name} className="h-16 w-16 object-cover rounded-md bg-gray-100 border border-gray-200" />
                                    ) : (
                                        <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold border border-gray-300">
                                            NO IMG
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{lookbook.name}</p>
                                        <p className="text-xs text-gray-500 mb-1">{lookbook.description ? lookbook.description.substring(0, 50) + (lookbook.description.length > 50 ? '...' : '') : 'No description'}</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {lookbook.season && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                    {lookbook.season}
                                                </span>
                                            )}
                                            {lookbook.year && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                    {lookbook.year}
                                                </span>
                                            )}
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${lookbook.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {lookbook.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button onClick={() => startEdit(lookbook)} className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50">
                                        <PencilSquareIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleDelete(lookbook.id)} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50">
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
