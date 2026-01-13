'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
    TrashIcon, PencilSquareIcon, PlusIcon, ArrowPathIcon,
    ArchiveBoxXMarkIcon, ChevronDownIcon, ChevronRightIcon,
    SparklesIcon, XMarkIcon, DocumentTextIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Default care instructions by material name (lowercase matching)
const DEFAULT_CARE_INSTRUCTIONS: Record<string, string> = {
    // Natural Plant-Based
    'cotton': 'Machine wash cold or warm. Tumble dry low or medium. Iron on medium-high heat if needed. Can be bleached if white.',
    'linen': 'Machine wash cold or warm. Tumble dry low or hang to dry. Iron while slightly damp on high heat. Wrinkles are natural.',
    'hemp': 'Machine wash cold. Tumble dry low or line dry. Iron on medium heat. Softens with each wash.',
    'bamboo': 'Machine wash cold on gentle cycle. Tumble dry low or hang to dry. Iron on low heat if needed.',
    'ramie': 'Hand wash or machine wash cold on delicate. Hang to dry. Iron on high heat while damp.',
    'jute': 'Spot clean only. Avoid water immersion. Keep dry and away from moisture.',

    // Natural Animal-Based
    'wool': 'Hand wash cold or dry clean. Lay flat to dry on a towel. Do not wring or twist. Store with cedar to prevent moths.',
    'cashmere': 'Hand wash in cold water with mild detergent. Gently squeeze, never wring. Lay flat to dry. Fold, do not hang.',
    'silk': 'Hand wash cold or dry clean. Do not wring. Air dry away from sunlight. Iron on low with a pressing cloth.',
    'leather': 'Wipe with damp cloth. Condition regularly with leather conditioner. Store away from heat and sunlight.',
    'suede': 'Brush with suede brush to remove dirt. Use suede protector spray. Avoid water. Professional clean for stains.',
    'mohair': 'Hand wash cold or dry clean. Lay flat to dry. Gently brush when dry to restore fluffiness.',
    'angora': 'Hand wash cold very gently. Lay flat to dry. Store folded with lavender to deter moths.',
    'alpaca': 'Hand wash cold or dry clean. Lay flat to dry. Does not pill like wool. Store folded.',

    // Synthetic
    'polyester': 'Machine wash warm or cold. Tumble dry low. Remove promptly to avoid wrinkles. Low iron if needed.',
    'nylon': 'Machine wash cold or warm. Tumble dry low or hang to dry. Iron on low heat if necessary.',
    'acrylic': 'Machine wash warm on gentle cycle. Tumble dry low. Do not iron or use low heat only.',
    'spandex': 'Hand wash or machine wash cold. Do not use fabric softener. Hang to dry. Do not iron.',
    'elastane': 'Hand wash or machine wash cold. Avoid chlorine bleach. Hang to dry. Do not iron.',
    'lycra': 'Hand wash cold or machine wash on delicate. Hang to dry. Do not iron. Avoid fabric softener.',
    'rayon': 'Hand wash cold or dry clean. Hang to dry or lay flat. Iron on low while slightly damp.',
    'viscose': 'Hand wash cold or dry clean. Do not wring. Hang to dry. Iron on low heat inside out.',
    'modal': 'Machine wash cold or warm. Tumble dry low. Iron on medium heat if needed. Resistant to shrinking.',
    'acetate': 'Dry clean recommended. If washing, hand wash cold. Do not wring. Iron on low with pressing cloth.',

    // Blends & Specialty
    'denim': 'Machine wash cold inside out. Tumble dry low or hang to dry to preserve color. Iron if needed.',
    'fleece': 'Machine wash cold. Tumble dry low or no heat. Do not use fabric softener. Do not iron.',
    'velvet': 'Dry clean recommended. Steam to remove wrinkles. Store hanging on padded hangers.',
    'corduroy': 'Machine wash cold inside out. Tumble dry low. Turn right side out while slightly damp.',
    'tweed': 'Dry clean only. Brush to remove dust. Steam to refresh between cleanings.',
    'flannel': 'Machine wash cold or warm. Tumble dry low. Remove promptly. Iron on medium if needed.',
    'satin': 'Hand wash cold or dry clean. Do not wring. Hang to dry. Iron on low inside out.',
    'chiffon': 'Hand wash cold or dry clean. Hang to dry. Iron on low with pressing cloth.',
    'organza': 'Hand wash cold or dry clean. Hang to dry immediately. Iron on low if needed.',
    'tulle': 'Hand wash cold gently. Hang to dry. Steam to remove wrinkles. Store flat.',
    'lace': 'Hand wash cold in a mesh bag. Lay flat to dry. Do not iron directly; use pressing cloth.',
    'canvas': 'Machine wash cold. Air dry or tumble dry low. Iron on medium-high heat.',
    'muslin': 'Machine wash warm. Tumble dry low. Iron on high heat. Fabric softens with washing.',
    'chambray': 'Machine wash cold. Tumble dry low or hang to dry. Iron on medium heat.',
    'jacquard': 'Check care label. Usually dry clean or hand wash cold. Iron on low inside out.',
    'brocade': 'Dry clean only. Store flat or rolled. Avoid folding to prevent creasing.',
    'taffeta': 'Dry clean recommended. Store on padded hangers. Steam to remove wrinkles.',
    'crepe': 'Hand wash cold or dry clean. Hang to dry. Iron on low with steam.',
    'jersey': 'Machine wash cold. Tumble dry low or lay flat. Usually does not need ironing.',
    'knit': 'Machine wash cold on gentle. Lay flat to dry to maintain shape. Fold to store.',
    'sequin': 'Turn inside out, hand wash cold or use mesh bag on delicate. Air dry. Do not iron.',
    'fur': 'Professional cleaning only. Shake out dust. Store in cool, ventilated area.',
    'faux fur': 'Check label. Usually spot clean or hand wash cold. Air dry. Brush to restore.',
    'down': 'Machine wash cold on gentle with mild detergent. Tumble dry low with tennis balls. Store uncompressed.',

    // Cordura and technical
    'cordura': 'Machine wash cold or warm. Hang to dry. Do not use fabric softener. Iron on low if needed.',
    'gore-tex': 'Machine wash warm. Tumble dry low for 20 min to reactivate DWR. Do not dry clean.',
    'ripstop': 'Machine wash cold. Tumble dry low or hang to dry. Iron on low if needed.',
    'microfiber': 'Machine wash warm with no fabric softener. Tumble dry low. Do not use dryer sheets.',

    // Metals & Hardware
    'gold': 'Polish with soft cloth. Store separately to avoid scratches. Clean with mild soap and water.',
    'silver': 'Polish regularly to prevent tarnish. Store in anti-tarnish cloth. Clean with silver polish.',
};

interface MaterialComposition {
    compositionId: string;
    compositionName?: string;
    percentage: number;
}

interface Material {
    id: string;
    name: string;
    category?: string;
    skuRef?: string;
    compositions?: MaterialComposition[];
    careInstructions?: string;
    isActive: boolean;
    isDeleted?: boolean;
    deletedAt?: string;
}

interface CompositionOption {
    id: string;
    name: string;
    categoryName?: string;
}

interface CategoryOption {
    id: string;
    name: string;
}

// Get default care instructions based on material name
function getDefaultCareInstructions(materialName: string): string {
    const lowerName = materialName.toLowerCase().trim();

    // Exact match first
    if (DEFAULT_CARE_INSTRUCTIONS[lowerName]) {
        return DEFAULT_CARE_INSTRUCTIONS[lowerName];
    }

    // Partial match (e.g., "Organic Cotton" should match "cotton")
    for (const [key, value] of Object.entries(DEFAULT_CARE_INSTRUCTIONS)) {
        if (lowerName.includes(key) || key.includes(lowerName)) {
            return value;
        }
    }

    // Generic fallback
    return 'Check garment care label for specific instructions. When in doubt, hand wash cold and air dry.';
}

export default function AdminMaterialsPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [showTrash, setShowTrash] = useState(false);

    // Expanded categories for accordion view
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['natural', 'synthetic', 'blend']));

    // Form State
    const [name, setName] = useState('');
    const [skuRef, setSkuRef] = useState('');
    const [category, setCategory] = useState('natural');
    const [careInstructions, setCareInstructions] = useState('');
    const [selectedCompositions, setSelectedCompositions] = useState<MaterialComposition[]>([]);

    // Reference Data
    const [availableCompositions, setAvailableCompositions] = useState<CompositionOption[]>([]);
    const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([]);

    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id: string | null; permanent?: boolean }>({
        isOpen: false,
        id: null,
        permanent: false
    });

    // Expanded rows for viewing care instructions
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = showTrash
                ? await apiClient.getDeletedVUFSMaterials()
                : await apiClient.getVUFSMaterials();
            setMaterials(Array.isArray(data) ? data : (data?.materials || []));
        } catch (error) {
            console.error('Failed to fetch materials', error);
            toast.error('Failed to load materials');
        } finally {
            setLoading(false);
        }
    }, [showTrash]);

    const fetchReferences = async () => {
        try {
            const comps = await apiClient.getVUFSCompositions();
            setAvailableCompositions(comps || []);
            const cats = await apiClient.getVUFSCompositionCategories();
            setAvailableCategories(cats || []);
        } catch (error) {
            console.error('Failed to load references', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchReferences();
    }, [fetchData]);

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(cat)) {
                newSet.delete(cat);
            } else {
                newSet.add(cat);
            }
            return newSet;
        });
    };

    const toggleRowExpand = (id: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Group materials by category
    const groupedMaterials = React.useMemo(() => {
        const groups: Record<string, Material[]> = {
            natural: [],
            synthetic: [],
            blend: [],
            other: []
        };

        materials.forEach(m => {
            const cat = m.category?.toLowerCase() || 'other';
            if (groups[cat]) {
                groups[cat].push(m);
            } else {
                groups.other.push(m);
            }
        });

        return groups;
    }, [materials]);

    const categoryLabels: Record<string, { label: string; emoji: string; color: string }> = {
        natural: { label: 'Natural Fibers', emoji: '🌿', color: 'green' },
        synthetic: { label: 'Synthetic Fibers', emoji: '🧪', color: 'purple' },
        blend: { label: 'Blended Fibers', emoji: '🔀', color: 'blue' },
        other: { label: 'Other Materials', emoji: '📦', color: 'gray' }
    };

    const handleOpenModal = (material?: Material) => {
        if (material) {
            setEditingMaterial(material);
            setName(material.name);
            setSkuRef(material.skuRef || '');
            setCategory(material.category || 'natural');
            setCareInstructions(material.careInstructions || getDefaultCareInstructions(material.name));
            setSelectedCompositions(material.compositions || []);
        } else {
            setEditingMaterial(null);
            setName('');
            setSkuRef('');
            setCategory('natural');
            setCareInstructions('');
            setSelectedCompositions([{ compositionId: '', percentage: 100 }]);
        }
        setIsModalOpen(true);
    };

    // Auto-populate care instructions when name changes
    const handleNameChange = (newName: string) => {
        setName(newName);
        if (!editingMaterial && newName.length > 2) {
            const defaultInstructions = getDefaultCareInstructions(newName);
            if (defaultInstructions && !careInstructions) {
                setCareInstructions(defaultInstructions);
            }
        }
    };

    // Composition Row Handlers
    const updateCompositionRow = (index: number, field: 'compositionId' | 'percentage', value: any) => {
        const updated = [...selectedCompositions];
        if (field === 'percentage') {
            updated[index].percentage = Number(value);
        } else {
            updated[index].compositionId = value;
            updated[index].compositionName = availableCompositions.find(c => c.id === value)?.name;
        }
        setSelectedCompositions(updated);
    };

    const addCompositionRow = () => {
        setSelectedCompositions([...selectedCompositions, { compositionId: '', percentage: 0 }]);
    };

    const removeCompositionRow = (index: number) => {
        const updated = selectedCompositions.filter((_, i) => i !== index);
        setSelectedCompositions(updated);
    };

    const totalPercentage = selectedCompositions.reduce((sum, c) => sum + (c.percentage || 0), 0);

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Name is required'); return; }

        const validCompositions = selectedCompositions.filter(c => c.compositionId);
        if (validCompositions.length > 0 && Math.abs(totalPercentage - 100) > 0.1) {
            toast.error(`Total percentage must be 100% (Current: ${totalPercentage}%)`);
            return;
        }

        try {
            const payloadCompositions = validCompositions.map(c => ({ compositionId: c.compositionId, percentage: c.percentage }));
            const finalCareInstructions = careInstructions || getDefaultCareInstructions(name);

            if (editingMaterial) {
                await apiClient.updateVUFSMaterial(editingMaterial.id, name, skuRef, payloadCompositions, finalCareInstructions);
                toast.success('Material updated');
            } else {
                await apiClient.addVUFSMaterial(name, category, skuRef, payloadCompositions, finalCareInstructions);
                toast.success('Material added');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save material', error);
            toast.error('Failed to save material');
        }
    };

    const handleDeleteClick = (id: string, permanent = false) => {
        setDeleteModalState({ isOpen: true, id, permanent });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalState.id) return;
        try {
            if (deleteModalState.permanent) {
                await apiClient.permanentlyDeleteVUFSMaterial(deleteModalState.id);
                toast.success('Material permanently deleted');
            } else {
                await apiClient.deleteVUFSMaterial(deleteModalState.id);
                toast.success('Material moved to trash');
            }
            setDeleteModalState({ ...deleteModalState, isOpen: false });
            fetchData();
        } catch (error) {
            toast.error('Failed to delete material');
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await apiClient.restoreVUFSMaterial(id);
            toast.success('Material restored');
            fetchData();
        } catch (error) {
            toast.error('Failed to restore material');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Materials Library</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Manage fabric materials with care instructions for garment tags.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowTrash(!showTrash)}
                        className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors ${showTrash
                            ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            }`}
                    >
                        <ArchiveBoxXMarkIcon className="-ml-1 mr-2 h-5 w-5" />
                        {showTrash ? 'View Active' : 'View Trash'}
                    </button>
                    {!showTrash && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                            Add Material
                        </button>
                    )}
                </div>
            </div>

            {showTrash ? (
                /* Trash View */
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md mx-4 mt-4">
                        <p className="text-sm text-amber-800">
                            <strong>Trash:</strong> Items here can be restored or permanently deleted.
                        </p>
                    </div>
                    <ul role="list" className="divide-y divide-gray-200">
                        {materials.map((material) => (
                            <li key={material.id} className="px-4 py-4 flex items-center justify-between sm:px-6 hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-600">{material.name}</p>
                                    {material.skuRef && (
                                        <p className="text-xs text-gray-500">SKU: {material.skuRef}</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRestore(material.id)}
                                        className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-full"
                                        title="Restore"
                                    >
                                        <ArrowPathIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(material.id, true)}
                                        className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full"
                                        title="Delete Permanently"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                        {materials.length === 0 && (
                            <li className="px-4 py-8 text-center text-gray-500">Trash is empty</li>
                        )}
                    </ul>
                </div>
            ) : (
                /* Category-Grouped View */
                <div className="space-y-4">
                    {Object.entries(groupedMaterials).map(([cat, catMaterials]) => {
                        if (catMaterials.length === 0) return null;
                        const { label, emoji, color } = categoryLabels[cat] || categoryLabels.other;
                        const isExpanded = expandedCategories.has(cat);

                        return (
                            <div key={cat} className="bg-white shadow rounded-lg overflow-hidden">
                                {/* Category Header */}
                                <div
                                    className={`px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 border-b border-gray-100`}
                                    onClick={() => toggleCategory(cat)}
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? (
                                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                        )}
                                        <span className="text-2xl">{emoji}</span>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
                                            <p className="text-sm text-gray-500">{catMaterials.length} materials</p>
                                        </div>
                                    </div>
                                    <span className={`text-sm text-${color}-600 bg-${color}-50 px-3 py-1 rounded-full`}>
                                        {cat}
                                    </span>
                                </div>

                                {/* Materials List */}
                                {isExpanded && (
                                    <div className="divide-y divide-gray-100">
                                        {catMaterials.map((material) => (
                                            <div key={material.id}>
                                                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-gray-900">{material.name}</span>
                                                                {material.skuRef && (
                                                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                                                        {material.skuRef}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {material.compositions && material.compositions.length > 0 && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {material.compositions.map(c => `${c.percentage}% ${c.compositionName}`).join(', ')}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Care instructions indicator */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleRowExpand(material.id); }}
                                                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${expandedRows.has(material.id)
                                                                    ? 'bg-indigo-100 text-indigo-700'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'
                                                                }`}
                                                            title="View care instructions"
                                                        >
                                                            <DocumentTextIcon className="h-4 w-4" />
                                                            Care
                                                        </button>
                                                    </div>

                                                    <div className="flex gap-2 ml-4">
                                                        <button
                                                            onClick={() => handleOpenModal(material)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50"
                                                            title="Edit"
                                                        >
                                                            <PencilSquareIcon className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(material.id)}
                                                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expanded care instructions */}
                                                {expandedRows.has(material.id) && (
                                                    <div className="px-6 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-indigo-100">
                                                        <div className="flex items-start gap-2">
                                                            <SparklesIcon className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-xs font-medium text-indigo-700 mb-1">Care Instructions</p>
                                                                <p className="text-sm text-gray-700">
                                                                    {material.careInstructions || getDefaultCareInstructions(material.name)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {materials.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No materials found. Add your first material to get started.
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingMaterial ? 'Edit Material' : 'Add Material'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="e.g. Organic Cotton Denim"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="natural">🌿 Natural</option>
                                    <option value="synthetic">🧪 Synthetic</option>
                                    <option value="blend">🔀 Blend</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SKU Reference</label>
                                <input
                                    type="text"
                                    value={skuRef}
                                    onChange={(e) => setSkuRef(e.target.value.toUpperCase())}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                                    placeholder="e.g. CT"
                                    maxLength={4}
                                />
                            </div>
                        </div>

                        {/* Care Instructions */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">Care Instructions</label>
                                <button
                                    type="button"
                                    onClick={() => setCareInstructions(getDefaultCareInstructions(name))}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                >
                                    <SparklesIcon className="h-3 w-3" />
                                    Auto-fill
                                </button>
                            </div>
                            <textarea
                                value={careInstructions}
                                onChange={(e) => setCareInstructions(e.target.value)}
                                rows={3}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="e.g. Machine wash cold. Tumble dry low. Iron on medium heat."
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Care instructions will be auto-populated based on material type if left empty.
                            </p>
                        </div>

                        {/* Compositions Section */}
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Fiber Composition</label>
                                <button
                                    type="button"
                                    onClick={addCompositionRow}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                >
                                    <PlusIcon className="w-4 h-4" /> Add Fiber
                                </button>
                            </div>

                            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                                {selectedCompositions.map((row, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            <select
                                                value={row.compositionId}
                                                onChange={(e) => updateCompositionRow(index, 'compositionId', e.target.value)}
                                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                            >
                                                <option value="">Select Fiber...</option>
                                                {availableCompositions.map(comp => (
                                                    <option key={comp.id} value={comp.id}>{comp.name} ({comp.categoryName})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24 relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={row.percentage}
                                                onChange={(e) => updateCompositionRow(index, 'percentage', e.target.value)}
                                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none pr-6"
                                            />
                                            <span className="absolute right-2 top-2 text-gray-400 text-xs">%</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeCompositionRow(index)}
                                            className="text-gray-400 hover:text-red-500 p-1"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {selectedCompositions.length === 0 && (
                                    <div className="text-sm text-gray-500 text-center py-2">No composition defined. Add a fiber.</div>
                                )}
                                {selectedCompositions.some(c => c.compositionId) && (
                                    <div className={`text-right text-sm font-medium ${Math.abs(totalPercentage - 100) < 0.1 ? 'text-green-600' : 'text-orange-600'}`}>
                                        Total: {totalPercentage}%
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                            >
                                {editingMaterial ? 'Save Changes' : 'Add Material'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title={deleteModalState.permanent ? "Delete Permanently?" : "Move to Trash?"}
                message={deleteModalState.permanent
                    ? "This action cannot be undone. The material will be permanently removed."
                    : "The material will be moved to trash and can be restored later."}
            />
        </div>
    );
}
