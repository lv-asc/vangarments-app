'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TrashIcon, PencilSquareIcon, PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

function ComboboxField({ label, value, onChange, options, placeholder }: { label: string, value: string, onChange: (val: string) => void, options: string[], placeholder?: string }) {
    const [query, setQuery] = useState('');

    const filteredOptions =
        query === ''
            ? options
            : options.filter((opt) =>
                opt.toLowerCase().includes(query.toLowerCase())
            );

    // If we want to allow new values (the user types something not in list), we can treat the input as valid.
    // We already pass `value` to Combobox. 
    // And we update via `onChange`.
    // The trick with Headless UI Combobox for free-text is:
    // If user types, `Combobox.Input` onChange fires. We update query AND parent value if we want live typing.
    // But if we want it to be a specific selection, normally we wait for selection.
    // For free text, we just update the parent value on input change.

    return (
        <Combobox value={value} onChange={onChange} nullable>
            <div className="relative">
                <Combobox.Label className="block text-sm font-medium text-gray-700">{label}</Combobox.Label>
                <div className="relative mt-1 w-full overflow-hidden rounded-md bg-white text-left border border-gray-300 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 sm:text-sm">
                    <Combobox.Input
                        className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                        displayValue={(item: string) => item}
                        onChange={(event) => { setQuery(event.target.value); onChange(event.target.value); }}
                        placeholder={placeholder}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </Combobox.Button>
                </div>
                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    afterLeave={() => setQuery('')}
                >
                    <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                        {filteredOptions.length === 0 && query !== '' ? (
                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                "{query}"
                            </div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <Combobox.Option
                                    key={opt}
                                    className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                        }`
                                    }
                                    value={opt}
                                >
                                    {({ selected, active }) => (
                                        <>
                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                {opt}
                                            </span>
                                            {selected ? (
                                                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'
                                                    }`}>
                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            ) : null}
                                        </>
                                    )}
                                </Combobox.Option>
                            ))
                        )}
                    </Combobox.Options>
                </Transition>
            </div>
        </Combobox>
    );
}


function StandardSelector({ value, onChange, standards }: { value: string, onChange: (val: string) => void, standards: any[] }) {
    const [query, setQuery] = useState('');

    const filteredStandards =
        query === ''
            ? standards
            : standards.filter((std) => {
                const q = query.toLowerCase();
                return std.name.toLowerCase().includes(q) || std.label.toLowerCase().includes(q);
            });

    return (
        <Combobox value={value} onChange={onChange} nullable>
            <div className="relative">
                <Combobox.Input
                    className="w-full border border-gray-300 rounded-md shadow-sm sm:text-sm p-2"
                    displayValue={(code: string) => {
                        const std = standards.find((s) => s.name === code);
                        return std ? `${std.name} (${std.label})` : code;
                    }}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Select Standard"
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </Combobox.Button>
            </div>
            <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setQuery('')}
            >
                <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                    {filteredStandards.length === 0 && query !== '' ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            Nothing found.
                            {/* Create option */}
                            <Combobox.Option
                                value={query}
                                className={({ active }) => `relative cursor-default select-none py-2 px-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`}
                            >
                                Create "{query}"
                            </Combobox.Option>
                        </div>
                    ) : (
                        filteredStandards.map((std) => (
                            <Combobox.Option
                                key={std.id}
                                className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`
                                }
                                value={std.name}
                            >
                                {({ selected, active }) => (
                                    <>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                            {std.name} ({std.label})
                                        </span>
                                        {selected ? (
                                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}>
                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </Combobox.Option>
                        ))
                    )}
                </Combobox.Options>
            </Transition>
        </Combobox>
    );
}


interface SizeConversion {
    standard: string;
    value: string;
}

interface Size {
    id: string;
    name: string;
    sortOrder: number;
    conversions: SizeConversion[];
    validCategoryIds: number[];
    isActive: boolean;
}

interface Category {
    id: string;
    name: string;
    level: string;
}

export default function AdminSizesPage() {
    const [activeTab, setActiveTab] = useState<'sizes' | 'standards'>('sizes');

    const [sizes, setSizes] = useState<Size[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [standards, setStandards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Dynamic Options Logic
    const regionOptions = Array.from(new Set([
        'Brazil', 'United States', 'United Kingdom', 'Europe', 'International', 'China', 'Japan', 'Australia',
        ...standards.map(s => s.region).filter(Boolean)
    ])).sort();

    const categoryOptions = Array.from(new Set([
        'Tops', 'Bottoms', 'Footwear', 'Outerwear', 'Accessories', 'Headwear', 'Underwear', 'Swimwear',
        ...standards.map(s => s.category).filter(Boolean)
    ])).sort();

    const approachOptions = Array.from(new Set([
        'Standard', 'Body Dimensions', 'Product Dimensions', 'Ad hoc',
        ...standards.map(s => s.approach).filter(Boolean)
    ])).sort();

    // Size Modal State
    const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
    const [editingSize, setEditingSize] = useState<Size | null>(null);
    const [sizeForm, setSizeForm] = useState({
        name: '',
        sortOrder: 0,
        conversions: [] as SizeConversion[],
        selectedCategoryIds: [] as number[]
    });

    // Standard Modal State
    const [isStandardModalOpen, setIsStandardModalOpen] = useState(false);
    const [editingStandard, setEditingStandard] = useState<any | null>(null);
    const [standardForm, setStandardForm] = useState({
        name: '', // Code e.g. BR_TOPS
        label: '', // Display e.g. Brazil - Tops
        region: '',
        category: '',
        approach: '',
        description: ''
    });

    // Delete Modal State
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id: string | null; type: 'size' | 'standard' }>({
        isOpen: false,
        id: null,
        type: 'size'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sizesData, categoriesRes, standardsRes] = await Promise.all([
                apiClient.getAllSizes(),
                apiClient.getVUFSCategories(),
                apiClient.getVUFSStandards()
            ]);
            setSizes(sizesData || []);
            const catArr = Array.isArray(categoriesRes) ? categoriesRes : ((categoriesRes as any).categories || []);
            setCategories(catArr);
            setStandards(standardsRes || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    // --- SIZE HANDLERS ---
    const handleOpenSizeModal = (size?: Size) => {
        if (size) {
            setEditingSize(size);
            setSizeForm({
                name: size.name,
                sortOrder: size.sortOrder || 0,
                conversions: size.conversions || [],
                selectedCategoryIds: size.validCategoryIds || []
            });
        } else {
            setEditingSize(null);
            setSizeForm({ name: '', sortOrder: 0, conversions: [], selectedCategoryIds: [] });
        }
        setIsSizeModalOpen(true);
    };

    const handleSaveSize = async () => {
        try {
            const payload = {
                name: sizeForm.name,
                sortOrder: sizeForm.sortOrder,
                conversions: sizeForm.conversions.filter(c => c.standard && c.value),
                validCategoryIds: sizeForm.selectedCategoryIds
            };

            if (editingSize) {
                await apiClient.updateSize(editingSize.id, payload);
            } else {
                await apiClient.createSize(payload);
            }
            setIsSizeModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save size', error);
        }
    };

    const handleDeleteSizeClick = (id: string) => {
        setDeleteModalState({ isOpen: true, id, type: 'size' });
    };

    // --- STANDARD HANDLERS ---
    const handleOpenStandardModal = (std?: any) => {
        if (std) {
            setEditingStandard(std);
            setStandardForm({
                name: std.name,
                label: std.label || '',
                region: std.region || '',
                category: std.category || '',
                approach: std.approach || '',
                description: std.description || ''
            });
        } else {
            setEditingStandard(null);
            setStandardForm({ name: '', label: '', region: '', category: '', approach: '', description: '' });
        }
        setIsStandardModalOpen(true);
    };

    const handleSaveStandard = async () => {
        try {
            const payload = standardForm;
            if (editingStandard) {
                await apiClient.updateVUFSStandard(editingStandard.id, payload);
            } else {
                await apiClient.addVUFSStandard(payload);
            }
            setIsStandardModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save standard', error);
        }
    };

    const handleDeleteStandardClick = (id: string) => {
        setDeleteModalState({ isOpen: true, id, type: 'standard' });
    };

    // --- COMMON ---
    const handleConfirmDelete = async () => {
        const { id, type } = deleteModalState;
        if (!id) return;
        try {
            if (type === 'size') {
                await apiClient.deleteSize(id);
            } else {
                await apiClient.deleteVUFSStandard(id);
            }
            fetchData();
        } catch (error) {
            console.error('Failed to delete item', error);
        } finally {
            setDeleteModalState({ ...deleteModalState, isOpen: false });
        }
    };

    // Size Form Helpers
    const handleAddConversion = () => {
        setSizeForm(prev => ({ ...prev, conversions: [...prev.conversions, { standard: '', value: '' }] }));
    };

    const handleUpdateConversion = (index: number, field: 'standard' | 'value', val: string) => {
        const newConversions = [...sizeForm.conversions];
        newConversions[index][field] = val;
        setSizeForm(prev => ({ ...prev, conversions: newConversions }));
    };

    const handleRemoveConversion = (index: number) => {
        setSizeForm(prev => ({ ...prev, conversions: prev.conversions.filter((_, i) => i !== index) }));
    };

    const toggleCategorySelection = (catIdStr: string) => {
        const catId = parseInt(catIdStr);
        setSizeForm(prev => ({
            ...prev,
            selectedCategoryIds: prev.selectedCategoryIds.includes(catId)
                ? prev.selectedCategoryIds.filter(id => id !== catId)
                : [...prev.selectedCategoryIds, catId]
        }));
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Sizes & Standards</h1>
                    <p className="mt-2 text-sm text-gray-700">Manage global size definitions and measurement standards.</p>
                </div>
                <div>
                    <button
                        onClick={() => activeTab === 'sizes' ? handleOpenSizeModal() : handleOpenStandardModal()}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add {activeTab === 'sizes' ? 'Size' : 'Standard'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('sizes')}
                        className={`${activeTab === 'sizes'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Sizes & Conversions
                    </button>
                    <button
                        onClick={() => setActiveTab('standards')}
                        className={`${activeTab === 'standards'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Size Standards
                    </button>
                </nav>
            </div>

            {/* Content: Sizes */}
            {activeTab === 'sizes' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul role="list" className="divide-y divide-gray-200">
                        {sizes.map((size) => (
                            <li key={size.id} className="block hover:bg-gray-50">
                                <div className="px-4 py-4 flex items-center sm:px-6">
                                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div className="flex flex-col">
                                            <div className="flex items-center text-sm font-medium text-indigo-600 truncate">
                                                <span className="text-lg mr-2 font-bold">{size.name}</span>
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">Order: {size.sortOrder}</span>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-500">
                                                <p className="font-semibold mb-1">Conversions:</p>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {size.conversions && size.conversions.length > 0 ? (
                                                        size.conversions.map((conv, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                {conv.standard}: {conv.value}
                                                            </span>
                                                        ))
                                                    ) : <span className="text-xs text-gray-400">None</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5 flex gap-2">
                                            <button onClick={() => handleOpenSizeModal(size)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full">
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleDeleteSizeClick(size.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Content: Standards */}
            {activeTab === 'standards' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Standard Name (Code)
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Details
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Edit</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {standards.map((std) => (
                                <tr key={std.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{std.label}</div>
                                        <div className="text-sm text-gray-500">{std.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900"><span className="font-semibold">Region:</span> {std.region}</div>
                                        <div className="text-sm text-gray-500"><span className="font-semibold">Category:</span> {std.category}</div>
                                        <div className="text-sm text-gray-500"><span className="font-semibold">Approach:</span> {std.approach}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate">{std.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenStandardModal(std)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDeleteStandardClick(std.id)} className="text-red-600 hover:text-red-900">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Size Modal */}
            {isSizeModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{editingSize ? 'Edit Size' : 'Add Size'}</h3>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={sizeForm.name}
                                        onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                                    <input
                                        type="number"
                                        value={sizeForm.sortOrder}
                                        onChange={(e) => setSizeForm({ ...sizeForm, sortOrder: parseInt(e.target.value) })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                                    />
                                </div>
                            </div>
                            {/* Conversions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Conversions</label>
                                {sizeForm.conversions.map((conv, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <div className="flex-1 relative">
                                            <StandardSelector
                                                value={conv.standard}
                                                onChange={(val) => handleUpdateConversion(idx, 'standard', val)}
                                                standards={standards}
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Value"
                                            value={conv.value}
                                            onChange={(e) => handleUpdateConversion(idx, 'value', e.target.value)}
                                            className="flex-1 border-gray-300 rounded-md shadow-sm text-sm border p-2"
                                        />
                                        <button onClick={() => handleRemoveConversion(idx)} className="text-red-600 p-2"><TrashIcon className="h-5 w-5" /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddConversion} className="text-sm text-indigo-600 font-medium">+ Add Conversion</button>
                            </div>
                            {/* Valid Categories (Omitted for brevity, assuming kept from original logic if critical, or use similar pattern logic) */}
                            {/* Re-adding essential category selection if needed */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Valid Categories</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
                                    {categories.map(cat => (
                                        <label key={cat.id} className="flex items-center space-x-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={sizeForm.selectedCategoryIds.includes(parseInt(cat.id))}
                                                onChange={() => toggleCategorySelection(cat.id)}
                                            />
                                            <span>{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                        </div>
                        <div className="mt-5 sm:mt-6 flex justify-end gap-3">
                            <button onClick={() => setIsSizeModalOpen(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSaveSize} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Standard Modal */}
            {isStandardModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full my-8">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{editingStandard ? 'Edit Standard' : 'Add Standard'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Code Name (Unique)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. BR_TOPS"
                                    value={standardForm.name}
                                    onChange={(e) => setStandardForm({ ...standardForm, name: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Display Label</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Brazil - Tops"
                                    value={standardForm.label}
                                    onChange={(e) => setStandardForm({ ...standardForm, label: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                            <div>
                                <ComboboxField
                                    label="Region"
                                    value={standardForm.region}
                                    onChange={(val) => setStandardForm({ ...standardForm, region: val })}
                                    options={regionOptions}
                                    placeholder="e.g. Brazil"
                                />
                            </div>
                            <div>
                                <ComboboxField
                                    label="Category"
                                    value={standardForm.category}
                                    onChange={(val) => setStandardForm({ ...standardForm, category: val })}
                                    options={categoryOptions}
                                    placeholder="e.g. Tops"
                                />
                            </div>
                            <div>
                                <ComboboxField
                                    label="Approach"
                                    value={standardForm.approach}
                                    onChange={(val) => setStandardForm({ ...standardForm, approach: val })}
                                    options={approachOptions}
                                    placeholder="e.g. Body Dimensions"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="Brief description..."
                                    value={standardForm.description}
                                    onChange={(e) => setStandardForm({ ...standardForm, description: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-6 flex justify-end gap-3">
                            <button onClick={() => setIsStandardModalOpen(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSaveStandard} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deleteModalState.type === 'size' ? 'Size' : 'Standard'}`}
                message="Are you sure? This cannot be undone."
                variant="danger"
                confirmText="Delete"
            />
        </div>
    );
}
