'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TrashIcon, PencilSquareIcon, PlusIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { ApparelIcon } from '@/components/ui/ApparelIcons';

// Icons
const RulerIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
);

const PackageIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const ShirtIcon = ({ className }: { className?: string }) => (
    <ApparelIcon name="shirt" className={className} />
);

type TabType = 'package' | 'pom' | 'user';

interface POMCategory {
    id: string;
    name: string;
    description?: string;
    sort_order: number;
}

interface POMDefinition {
    id: string;
    category_id: string;
    category_name: string;
    code: string;
    name: string;
    description?: string;
    measurement_unit: string;
    is_half_measurement: boolean;
    default_tolerance: number;
    sort_order: number;
}

interface MeasurementType {
    id: string;
    name: string;
    description?: string;
    unit: string;
    sort_order: number;
}

export default function AdminMeasurementsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('pom');
    const [loading, setLoading] = useState(true);

    // POM State
    const [pomCategories, setPomCategories] = useState<POMCategory[]>([]);
    const [pomDefinitions, setPomDefinitions] = useState<POMDefinition[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    // Package State
    const [packageTypes, setPackageTypes] = useState<MeasurementType[]>([]);

    // User State
    const [userTypes, setUserTypes] = useState<MeasurementType[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [modalType, setModalType] = useState<'pom' | 'package' | 'user'>('pom');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        code: '',
        categoryId: '',
        unit: 'cm',
        isHalfMeasurement: false,
        defaultTolerance: 0.5,
        sortOrder: 0
    });
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id: string | null; type: TabType }>({
        isOpen: false,
        id: null,
        type: 'pom'
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [categories, definitions, packageTypesRes, userTypesRes] = await Promise.all([
                apiClient.getPOMCategories().catch(() => []),
                apiClient.getPOMDefinitions().catch(() => []),
                apiClient.getPackageMeasurementTypes().catch(() => []),
                apiClient.getUserMeasurementTypes().catch(() => [])
            ]);
            setPomCategories(Array.isArray(categories) ? categories : []);
            setPomDefinitions(Array.isArray(definitions) ? definitions : []);
            setPackageTypes(Array.isArray(packageTypesRes) ? packageTypesRes : []);
            setUserTypes(Array.isArray(userTypesRes) ? userTypesRes : []);

            // Expand all categories by default
            if (Array.isArray(categories)) {
                setExpandedCategories(new Set(categories.map((c: POMCategory) => c.id)));
            }
        } catch (error) {
            console.error('Failed to fetch measurements data', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const openModal = (type: 'pom' | 'package' | 'user', item?: any) => {
        setModalType(type);
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name || '',
                description: item.description || '',
                code: item.code || '',
                categoryId: item.category_id || '',
                unit: item.unit || item.measurement_unit || 'cm',
                isHalfMeasurement: item.is_half_measurement || false,
                defaultTolerance: item.default_tolerance || 0.5,
                sortOrder: item.sort_order || 0
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                description: '',
                code: '',
                categoryId: pomCategories[0]?.id || '',
                unit: 'cm',
                isHalfMeasurement: false,
                defaultTolerance: 0.5,
                sortOrder: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return;
        }

        try {
            if (modalType === 'pom') {
                if (!formData.code.trim()) {
                    toast.error('Code is required for POMs');
                    return;
                }
                await apiClient.upsertPOMDefinition({
                    id: editingItem?.id,
                    categoryId: formData.categoryId,
                    code: formData.code.toUpperCase(),
                    name: formData.name,
                    description: formData.description,
                    measurementUnit: formData.unit,
                    isHalfMeasurement: formData.isHalfMeasurement,
                    defaultTolerance: formData.defaultTolerance,
                    sortOrder: formData.sortOrder
                });
            } else if (modalType === 'package') {
                await apiClient.upsertPackageMeasurementType({
                    id: editingItem?.id,
                    name: formData.name,
                    description: formData.description,
                    unit: formData.unit,
                    sortOrder: formData.sortOrder
                });
            } else {
                await apiClient.upsertUserMeasurementType({
                    id: editingItem?.id,
                    name: formData.name,
                    description: formData.description,
                    unit: formData.unit,
                    sortOrder: formData.sortOrder
                });
            }
            toast.success(editingItem ? 'Updated successfully' : 'Created successfully');
            setIsModalOpen(false);
            fetchAllData();
        } catch (error) {
            console.error('Save failed', error);
            toast.error('Failed to save');
        }
    };

    const handleDelete = async () => {
        if (!deleteModalState.id) return;
        try {
            if (deleteModalState.type === 'pom') {
                await apiClient.deletePOMDefinition(deleteModalState.id);
            }
            // Add delete for package and user types when needed
            toast.success('Deleted successfully');
            fetchAllData();
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Failed to delete');
        } finally {
            setDeleteModalState({ isOpen: false, id: null, type: 'pom' });
        }
    };

    const getPOMsByCategory = (categoryId: string) => {
        return pomDefinitions.filter(pom => pom.category_id === categoryId);
    };

    if (loading) {
        return <div className="p-10 text-center">Loading...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Measurements Management</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage package dimensions, apparel POMs, and user body measurements.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('package')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'package'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <PackageIcon className="h-5 w-5" />
                        Package Measurements
                    </button>
                    <button
                        onClick={() => setActiveTab('pom')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'pom'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <ShirtIcon className="h-5 w-5" />
                        Apparel POMs
                    </button>
                    <button
                        onClick={() => setActiveTab('user')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'user'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <UserIcon className="h-5 w-5" />
                        User Measurements
                    </button>
                </nav>
            </div>

            {/* Package Measurements Tab */}
            {activeTab === 'package' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Package Measurement Types</h2>
                        <button
                            onClick={() => openModal('package')}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                            Add Type
                        </button>
                    </div>
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {packageTypes.map((type) => (
                                <li key={type.id} className="hover:bg-gray-50">
                                    <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                                        <div className="flex items-center gap-4">
                                            <PackageIcon className="h-8 w-8 text-blue-500" />
                                            <div>
                                                <p className="font-medium text-gray-900">{type.name}</p>
                                                <p className="text-sm text-gray-500">{type.description || `Unit: ${type.unit}`}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal('package', type)}
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-full"
                                            >
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {packageTypes.length === 0 && (
                                <li className="px-4 py-8 text-center text-gray-500">
                                    No package measurement types found.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {/* Apparel POMs Tab */}
            {activeTab === 'pom' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Point of Measurement Definitions</h2>
                        <button
                            onClick={() => openModal('pom')}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                            Add POM
                        </button>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        {pomCategories.map((category) => (
                            <div key={category.id} className="border-b border-gray-200 last:border-b-0">
                                <button
                                    onClick={() => toggleCategory(category.id)}
                                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        {expandedCategories.has(category.id) ? (
                                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                        )}
                                        <ApparelIcon name={category.name} className="h-6 w-6 text-blue-500" />
                                        <span className="font-semibold text-gray-900">{category.name}</span>
                                        <span className="text-sm text-gray-500">
                                            ({getPOMsByCategory(category.id).length} POMs)
                                        </span>
                                    </div>
                                </button>

                                {expandedCategories.has(category.id) && (
                                    <div className="bg-gray-50 border-t border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Half?</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tolerance</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {getPOMsByCategory(category.id).map((pom) => (
                                                    <tr key={pom.id} className="hover:bg-blue-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="font-mono font-bold text-blue-600">{pom.code}</span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{pom.name}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{pom.description}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {pom.is_half_measurement ? (
                                                                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Yes</span>
                                                            ) : (
                                                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">No</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">±{pom.default_tolerance} {pom.measurement_unit}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <button
                                                                onClick={() => openModal('pom', pom)}
                                                                className="text-blue-600 hover:text-blue-900 mr-2"
                                                            >
                                                                <PencilSquareIcon className="h-5 w-5 inline" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteModalState({ isOpen: true, id: pom.id, type: 'pom' })}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                <TrashIcon className="h-5 w-5 inline" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* User Measurements Tab */}
            {activeTab === 'user' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">User Body Measurement Types</h2>
                        <button
                            onClick={() => openModal('user')}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                            Add Type
                        </button>
                    </div>
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {userTypes.map((type) => (
                                <li key={type.id} className="hover:bg-gray-50">
                                    <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                                        <div className="flex items-center gap-4">
                                            <RulerIcon className="h-8 w-8 text-green-500" />
                                            <div>
                                                <p className="font-medium text-gray-900">{type.name}</p>
                                                <p className="text-sm text-gray-500">{type.description || `Unit: ${type.unit}`}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal('user', type)}
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-full"
                                            >
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {userTypes.length === 0 && (
                                <li className="px-4 py-8 text-center text-gray-500">
                                    No user measurement types found.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {editingItem ? 'Edit' : 'Add'} {modalType === 'pom' ? 'POM' : modalType === 'package' ? 'Package Type' : 'User Measurement Type'}
                        </h3>

                        <div className="space-y-4">
                            {modalType === 'pom' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Category</label>
                                        <select
                                            value={formData.categoryId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                        >
                                            {pomCategories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Code (e.g., CH, WB)</label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2 font-mono"
                                            placeholder="e.g., CH"
                                            maxLength={10}
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                    placeholder={modalType === 'pom' ? 'e.g., Across Chest' : 'e.g., Length, Chest'}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                    rows={2}
                                    placeholder="Point of reference or description"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                    >
                                        <option value="cm">cm</option>
                                        <option value="in">in (inches)</option>
                                        <option value="kg">kg</option>
                                        <option value="lb">lb (pounds)</option>
                                    </select>
                                </div>

                                {modalType === 'pom' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tolerance (±)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.defaultTolerance}
                                            onChange={(e) => setFormData(prev => ({ ...prev, defaultTolerance: parseFloat(e.target.value) }))}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                        />
                                    </div>
                                )}
                            </div>

                            {modalType === 'pom' && (
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isHalf"
                                        checked={formData.isHalfMeasurement}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isHalfMeasurement: e.target.checked }))}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isHalf" className="ml-2 text-sm text-gray-700">
                                        Half measurement (flat edge-to-edge, can be doubled for circumference)
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
                onConfirm={handleDelete}
                title="Delete Measurement"
                message="Are you sure you want to delete this measurement? This action cannot be undone."
                variant="danger"
                confirmText="Delete"
            />
        </div>
    );
}
