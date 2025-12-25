import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import LogoUploader from './LogoUploader';
import { BRAND_TAGS } from '@/lib/constants';
import { CheckIcon } from '@heroicons/react/20/solid';
import { api } from '@/lib/api'; // For accessing search methods directly if needed or via apiClient wrapper

interface LineManagementProps {
    brandId: string;
}

interface BrandLine {
    id: string;
    brandId: string;
    name: string;
    logo?: string;
    description?: string;
    collabBrandId?: string;
    designerId?: string;
    tags?: string[];
}

export default function LineManagement({ brandId }: LineManagementProps) {
    const [lines, setLines] = useState<BrandLine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingLine, setEditingLine] = useState<BrandLine | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        logo: '',
        description: '',
        collabBrandId: '',
        designerId: '',
        tags: [] as string[]
    });

    // Options for dropdowns
    const [vufsBrands, setVufsBrands] = useState<any[]>([]);
    const [designers, setDesigners] = useState<any[]>([]);

    useEffect(() => {
        fetchLines();
        loadOptions();
    }, [brandId]);

    const fetchLines = async () => {
        try {
            setLoading(true);
            const res = await apiClient.getBrandLines(brandId);
            setLines(res.lines || []);
        } catch (error) {
            console.error('Failed to fetch lines:', error);
            toast.error('Failed to load brand lines');
        } finally {
            setLoading(false);
        }
    };

    const loadOptions = async () => {
        try {
            const [brandsRes, usersRes] = await Promise.all([
                apiClient.getVUFSBrands(),
                apiClient.getUsers()
            ]);
            setVufsBrands(brandsRes || []);
            // Filter users for "Designer" role - case insensitive check
            const designersList = (usersRes || []).filter((u: any) =>
                u.roles?.some((r: string) => r.toLowerCase() === 'designer')
            );
            setDesigners(designersList);
        } catch (error) {
            console.error('Failed to load form options:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                collabBrandId: formData.collabBrandId || null,
                designerId: formData.designerId || null,
                tags: formData.tags,
                ...(formData.logo ? { logo: formData.logo } : {})
            };

            if (editingLine) {
                await apiClient.updateBrandLine(editingLine.id, payload);
                toast.success('Line updated successfully');
            } else {
                await apiClient.createBrandLine(brandId, payload);
                toast.success('Line created successfully');
            }
            fetchLines();
            resetForm();
        } catch (error) {
            console.error('Save line error:', error);
            toast.error('Failed to save line');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this line? SKUs associated with it might lose their grouping.')) return;
        try {
            await apiClient.deleteBrandLine(id);
            toast.success('Line deleted');
            fetchLines();
        } catch (error) {
            console.error('Delete line error:', error);
            toast.error('Failed to delete line');
        }
    };

    const startEdit = (line: BrandLine) => {
        setEditingLine(line);
        setFormData({
            name: line.name,
            logo: line.logo || '',
            description: line.description || '',
            collabBrandId: line.collabBrandId || '',
            designerId: line.designerId || '',
            tags: line.tags || []
        });
        setShowAddForm(true);
    };

    const resetForm = () => {
        setEditingLine(null);
        setFormData({
            name: '',
            logo: '',
            description: '',
            collabBrandId: '',
            designerId: '',
            tags: []
        });
        setShowAddForm(false);
    };

    const handleTagChange = (tag: string) => {
        setFormData(prev => {
            const currentTags = prev.tags || [];
            if (currentTags.includes(tag)) {
                return { ...prev, tags: currentTags.filter(t => t !== tag) };
            } else {
                return { ...prev, tags: [...currentTags, tag] };
            }
        });
    };

    // Helper to extract logo string array for LogoUploader
    const getLogosArray = () => formData.logo ? [formData.logo] : [];

    // Helper to update logo from LogoUploader
    const handleLogoChange = (newLogos: string[]) => {
        setFormData(prev => ({ ...prev, logo: newLogos[0] || '' }));
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

    if (loading) return <div>Loading lines...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Brand Lines</h3>
                {!showAddForm && (
                    <Button onClick={() => setShowAddForm(true)}>
                        Add New Line
                    </Button>
                )}
            </div>

            {showAddForm && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-900">
                            {editingLine ? 'Edit Line' : 'New Line'}
                        </h4>
                        <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Logo Uploader */}
                        <div>
                            <LogoUploader logos={getLogosArray()} onChange={handleLogoChange} showNameInput={false} />
                            <p className="text-xs text-gray-500 mt-1">Upload a logo for this line. Only one logo is allowed.</p>
                        </div>

                        {/* Line Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Line Name *</label>
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

                        {/* Collab Brand Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Collaboration (Optional)</label>
                            <select
                                value={formData.collabBrandId}
                                onChange={e => setFormData({ ...formData, collabBrandId: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            >
                                <option value="">None (Select registered VUFS Brand)</option>
                                {vufsBrands.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Designer Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Designer (Optional)</label>
                            <select
                                value={formData.designerId}
                                onChange={e => setFormData({ ...formData, designerId: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            >
                                <option value="">None (Select Designer User)</option>
                                {designers.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
                                ))}
                            </select>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {BRAND_TAGS.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleTagChange(tag)}
                                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${formData.tags?.includes(tag)
                                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {tag} {formData.tags?.includes(tag) && <CheckIcon className="ml-1.5 h-3 w-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                            <Button type="submit">{editingLine ? 'Save Changes' : 'Create Line'}</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                <ul className="divide-y divide-gray-200">
                    {lines.length === 0 ? (
                        <li className="px-6 py-4 text-center text-gray-500 text-sm">No lines registered yet.</li>
                    ) : (
                        lines.map(line => (
                            <li key={line.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    {line.logo ? (
                                        <img src={getImageUrl(line.logo)} alt={line.name} className="h-12 w-12 object-contain rounded-full bg-gray-100 border border-gray-200" />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold border border-gray-300">
                                            {line.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{line.name}</p>
                                        <p className="text-xs text-gray-500">{line.description ? line.description.substring(0, 50) + (line.description.length > 50 ? '...' : '') : 'No description'}</p>
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {line.tags && line.tags.map(t => (
                                                <span key={t} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button onClick={() => startEdit(line)} className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50">
                                        <PencilSquareIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleDelete(line.id)} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50">
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
