
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import MediaUploader from './MediaUploader';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import SearchableCombobox from '../ui/Combobox';

interface GlobalSKUManagementProps {
}

export default function GlobalSKUManagement({ }: GlobalSKUManagementProps) {
    const [skus, setSkus] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');

    // VUFS Data Options
    const [vufsBrands, setVufsBrands] = useState<any[]>([]);
    const [lines, setLines] = useState<any[]>([]);
    const [collections, setCollections] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]); // All Categories
    const [patterns, setPatterns] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [fits, setFits] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);
    const [genders, setGenders] = useState<any[]>([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingSku, setEditingSku] = useState<any>(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        brandId: '',
        lineId: '',
        collection: '', // Will store Name or ID
        modelName: '',

        // Hierarchy: Apparel -> Style
        // Gender is now separate attribute
        genderId: '',
        apparelId: '', // Root Category
        styleId: '', // Sub Category

        patternId: '',
        materialId: '',
        fitId: '',

        selectedSizes: [] as string[], // Array of Size IDs
        selectedColors: [] as string[], // Array of Color IDs

        description: '',
        images: [] as any[],
        videos: [] as any[],

        // Auto-generated fields for display
        generatedName: '',
        generatedCode: 'SYSTEM_GENERATED'
    });

    useEffect(() => {
        fetchAllVUFSData();
        fetchSkus();
    }, []);

    useEffect(() => {
        fetchSkus();
    }, [page, search, selectedBrand]);

    // Cleanup lines/collections when brand changes
    useEffect(() => {
        if (formData.brandId) {
            fetchLines(formData.brandId);
            fetchCollections(formData.brandId);
        } else {
            setLines([]);
            setCollections([]);
        }
    }, [formData.brandId]);

    // Auto-generate Name logic
    useEffect(() => {
        if (!showModal) return;

        const brandName = vufsBrands.find(b => b.id === formData.brandId)?.name || '';
        const lineName = lines.find(l => l.id === formData.lineId)?.name || '';
        const modelName = formData.modelName;

        const apparelName = categories.find(c => c.id === formData.apparelId)?.name || '';
        const styleName = categories.find(c => c.id === formData.styleId)?.name || '';
        const patternName = patterns.find(p => p.id === formData.patternId)?.name || '';
        const materialName = materials.find(m => m.id === formData.materialId)?.name || '';
        const fitName = fits.find(f => f.id === formData.fitId)?.name || '';
        // Gender usually not in name unless specified, but user didn't explicitly ask for Gender in name parts in Step 677.
        // User said: "Line... Model Name... Style... Pattern... Material... Fit... Apparel (Color) [Size]"
        // Wait, user listed attributes: "Brand; Line; Collection; Model Name; Apparel; Style; Pattern; Material; Fit; Gender; Size(s); Color(s)"
        // And SKU Name: "Line ... Model ... Style ... Pattern ... Material ... Fit ... Apparel (Color) [Size]"
        // Gender is MISSING from auto-generated name format in user request.
        // I will exclude it from name to follow instructions exactly.

        const prefix = lineName || brandName;

        // Construct base name
        const parts = [
            prefix,
            modelName,
            styleName,
            patternName,
            materialName,
            fitName,
            apparelName
        ].filter(Boolean); // Remove empty strings

        setFormData(prev => ({ ...prev, generatedName: parts.join(' ') }));

    }, [
        formData.brandId, formData.lineId, formData.modelName,
        formData.styleId, formData.patternId, formData.materialId,
        formData.fitId, formData.apparelId,
        vufsBrands, lines, categories, patterns, materials, fits
    ]);


    const fetchAllVUFSData = async () => {
        try {
            // Try fetching genders. If fails, we default to static list or empty.
            let gendersData = [];
            try {
                // Assuming 'gender' or 'genders' attribute exists. 
                // If not, we might need to add it or use hardcoded.
                // We'll try fetching attribute values for 'gender'.
                gendersData = await apiClient.getVUFSAttributeValues('gender');
            } catch (e) {
                // If 'gender' attribute type doesn't exist, we provide standard options
                gendersData = [
                    { id: 'Men', name: 'Men' },
                    { id: 'Women', name: 'Women' },
                    { id: 'Unisex', name: 'Unisex' },
                    { id: 'Kids', name: 'Kids' }
                ];
            }

            const [
                brandsRes, catsRes, patternsRes, materialsRes, fitsRes, colorsRes, sizesRes
            ] = await Promise.all([
                apiClient.getVUFSBrands(),
                apiClient.getVUFSCategories(),
                apiClient.getVUFSPatterns(),
                apiClient.getVUFSMaterials(),
                apiClient.getVUFSFits(),
                apiClient.getVUFSColors(),
                apiClient.getVUFSSizes()
            ]);

            setVufsBrands(brandsRes || []);
            setCategories(catsRes || []);
            setPatterns(patternsRes || []);
            setMaterials(materialsRes || []);
            setFits(fitsRes || []);
            setColors(colorsRes || []);
            setSizes(sizesRes || []);
            setGenders(Array.isArray(gendersData) ? gendersData : []);

        } catch (error) {
            console.error('Failed to fetch VUFS data', error);
            toast.error('Failed to load form data');
        }
    };

    const fetchSkus = async () => {
        setLoading(true);
        try {
            const res = await apiClient.getAllSKUs({
                page,
                limit: 20,
                search,
                brandId: selectedBrand
            });
            setSkus(res.skus);
            setTotalPages(res.totalPages);
        } catch (error) {
            console.error('Failed to fetch SKUs', error);
            toast.error('Failed to load SKUs');
        } finally {
            setLoading(false);
        }
    };

    const fetchLines = async (brandId: string) => {
        try {
            const res = await apiClient.getBrandLines(brandId);
            setLines(res.lines || []);
        } catch (error) {
            console.error('Failed to fetch lines');
        }
    };

    const fetchCollections = async (brandId: string) => {
        try {
            if ((apiClient as any).getBrandCollections) {
                const res = await (apiClient as any).getBrandCollections(brandId);
                setCollections(res.collections || []);
            }
        } catch (error) {
            console.error('Failed to fetch collections');
        }
    };

    // Category Hierarchy Logic
    // Apparel -> Style
    // Apparel = Root Categories (e.g. T-Shirt, Belt) if DB is flat/root-based
    const apparelOptions = useMemo(() => categories.filter(c => !c.parentId), [categories]);

    // Style = Children of selected Apparel
    const styleOptions = useMemo(() => {
        if (!formData.apparelId) return [];
        return categories.filter(c => c.parentId === formData.apparelId);
    }, [categories, formData.apparelId]);


    const openModal = (sku?: any) => {
        if (sku) {
            // Edit Mode - Note: Bulk edit might be complex so maybe we only support single edit or recreate
            // For now, mapping existing SKU flat fields back to this complex form might be hard if data strictly follows hierarchy
            // Assuming existing SKUs might not have all these fields.
            // We will do best effort mapping or just basic fields.
            // User requested "Enhance SKU Creation Fields", implying creation flow is key.
            setEditingSku(sku);
            setFormData({
                brandId: sku.brandId,
                lineId: sku.lineId || '',
                collection: sku.collection || '',
                modelName: sku.name, // Mapping Name to ModelName might be lossy if Name was auto-generated.
                // Re-parsing name is hard. Ideally SKU has these fields stored in JSON or columns.
                // Since this is a UI enhancement request, we might assume we are just setting this for NEW SKUs.
                // For Editing, we might need to just show what we can. 
                // Let's reset hierarchy vars for safety or try to find them if stored.
                genderId: '',
                apparelId: '',
                styleId: '',
                patternId: '',
                materialId: '',
                fitId: '',
                selectedSizes: [],
                selectedColors: [],
                description: sku.description || '',
                images: sku.images || [],
                videos: sku.videos || [],
                generatedName: sku.name,
                generatedCode: sku.code
            });
        } else {
            setEditingSku(null);
            setFormData({
                brandId: '',
                lineId: '',
                collection: '',
                modelName: '',
                genderId: '',
                apparelId: '',
                styleId: '',
                patternId: '',
                materialId: '',
                fitId: '',
                selectedSizes: [],
                selectedColors: [],
                description: '',
                images: [],
                videos: [],
                generatedName: '',
                generatedCode: 'To be generated'
            });
            setLines([]);
            setCollections([]);
        }
        setShowModal(true);
    };

    const handleMultiSelect = (type: 'sizes' | 'colors', id: string) => {
        setFormData(prev => {
            const list = type === 'sizes' ? prev.selectedSizes : prev.selectedColors;
            const exists = list.includes(id);
            const newList = exists ? list.filter(item => item !== id) : [...list, id];
            return {
                ...prev,
                [type === 'sizes' ? 'selectedSizes' : 'selectedColors']: newList
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalLoading(true);
        try {
            // Loop through selected Sizes and Colors to create SKUs
            // If no size/color selected, maybe create one generic? Or error?
            // User said: "Each color and size will have their own respective SKU"

            const sizesToCreate = formData.selectedSizes.length > 0 ? formData.selectedSizes : [null];
            const colorsToCreate = formData.selectedColors.length > 0 ? formData.selectedColors : [null];

            let createdCount = 0;

            for (const colorId of colorsToCreate) {
                for (const sizeId of sizesToCreate) {

                    const colorName = colorId ? colors.find(c => c.id === colorId)?.name : '';
                    const sizeName = sizeId ? sizes.find(s => s.id === sizeId)?.name : '';

                    // Generate specific name
                    // "Line/Brand" "Model" "Style" "Pattern" "Material" "Fit" "Apparel" "(Color)" "[Size]"
                    const nameParts = [formData.generatedName];
                    if (colorName) nameParts.push('(' + colorName + ')');
                    if (sizeName) nameParts.push('[' + sizeName + ']');

                    const finalName = nameParts.join(' ');

                    // Construct Payload
                    // Note: We need to store these specific Attribute IDs somewhere in SKU or Item.
                    // Currently `createSKU` takes a payload. 
                    // We might need to store these in `metadata` or specific columns if they exist.
                    // For now I'll put them in `attributes` map or `metadata` if SKU schema supports it.
                    // Checking SKU model... it has `identifiers`, `category`, `materials` (string array).
                    // I will populate `category` with the leaf category (Style or Apparel).
                    // I will populate `materials` with the selected Material name.
                    // I will put others in Metadata for now or implicit fields.

                    const payload = {
                        name: finalName,
                        code: 'TEMP-' + Date.now() + '-' + createdCount, // Temporary code
                        brandId: formData.brandId,
                        lineId: formData.lineId || undefined,
                        collection: formData.collection || undefined,
                        description: formData.description,
                        images: formData.images,
                        videos: formData.videos,
                        materials: [materials.find(m => m.id === formData.materialId)?.name].filter(Boolean),
                        // We map Category to Style or Apparel
                        category: { page: categories.find(c => c.id === formData.styleId)?.name || categories.find(c => c.id === formData.apparelId)?.name || '' },
                        metadata: {
                            modelName: formData.modelName,
                            genderId: formData.genderId, // Store Gender
                            apparelId: formData.apparelId,
                            styleId: formData.styleId,
                            patternId: formData.patternId,
                            materialId: formData.materialId,
                            fitId: formData.fitId,
                            sizeId: sizeId,
                            colorId: colorId,
                            // Store names too for easier display if IDs fail to resolve later
                            genderName: genders.find(g => g.id === formData.genderId)?.name || formData.genderId, // If hardcoded, ID is Name sometimes
                            apparelName: categories.find(c => c.id === formData.apparelId)?.name,
                            styleName: categories.find(c => c.id === formData.styleId)?.name,
                            patternName: patterns.find(p => p.id === formData.patternId)?.name,
                            fitName: fits.find(f => f.id === formData.fitId)?.name
                        }
                    };

                    await apiClient.createSKU(formData.brandId, payload);
                    createdCount++;
                }
            }

            toast.success(`${createdCount} SKUs created`);
            setShowModal(false);
            fetchSkus();
        } catch (error) {
            console.error('Failed to save SKU', error);
            toast.error('Failed to save SKU');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this SKU?')) return;
        try {
            await apiClient.deleteSKU(id);
            toast.success('SKU deleted');
            fetchSkus();
        } catch (error) {
            console.error('Failed to delete SKU', error);
            toast.error('Failed to delete SKU');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search SKUs by name, code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={() => openModal()}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New SKU
                </Button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {skus.map(sku => (
                        <li key={sku.id} className="block hover:bg-gray-50">
                            <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Image Thumbnail */}
                                    <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                                        {sku.images?.[0]?.url ? (
                                            <img src={sku.images[0].url} alt={sku.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                <MagnifyingGlassIcon className="h-6 w-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-blue-600 truncate">{sku.name}</p>
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                {sku.code}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                            {sku.brand?.name && (
                                                <span className="mr-4">
                                                    Brand: <span className="font-medium text-gray-900">{sku.brand.name}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleDelete(sku.id)} className="p-2 text-gray-400 hover:text-red-500">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                    {skus.length === 0 && !loading && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No SKUs found.
                        </li>
                    )}
                </ul>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                                    {editingSku ? 'Edit SKU' : 'Create New SKU(s)'}
                                </h3>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">


                                    {/* 1. Brand / Line / Collection Row */}
                                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {/* Brand */}
                                        <div>
                                            <SearchableCombobox
                                                label="Brand"
                                                value={vufsBrands.find(b => b.id === formData.brandId)?.name || ''}
                                                onChange={(name) => {
                                                    const brand = vufsBrands.find(b => b.name === name);
                                                    setFormData({ ...formData, brandId: brand?.id || '', lineId: '', collection: '' });
                                                }}
                                                options={vufsBrands}
                                                placeholder="Select Brand..."
                                                disabled={!!editingSku}
                                            />
                                        </div>

                                        {/* Line */}
                                        <div>
                                            <SearchableCombobox
                                                label="Line"
                                                value={lines.find(l => l.id === formData.lineId)?.name || ''}
                                                onChange={(name) => {
                                                    const line = lines.find(l => l.name === name);
                                                    setFormData({ ...formData, lineId: line?.id || '' });
                                                }}
                                                options={lines}
                                                placeholder="Select Line (Optional)"
                                                disabled={!formData.brandId}
                                            />
                                        </div>

                                        {/* Collection */}
                                        <div>
                                            <SearchableCombobox
                                                label="Collection"
                                                value={formData.collection}
                                                onChange={(name) => setFormData({ ...formData, collection: name || '' })}
                                                options={collections} // Assumes collections have {name: ...}
                                                placeholder="Select Collection (Optional)"
                                                disabled={!formData.brandId}
                                                freeSolo={true} // Allow new collection names? Maybe not if restricted. But API allows string.
                                            />
                                        </div>
                                    </div>

                                    {/* 2. Model Name */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Model Name</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData.modelName}
                                            onChange={e => setFormData({ ...formData, modelName: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {/* 3. Apparel, Style, Pattern, Material, Fit, Gender */}

                                    <div>
                                        <SearchableCombobox
                                            label="Apparel"
                                            value={categories.find(c => c.id === formData.apparelId)?.name || ''}
                                            onChange={(name) => {
                                                const cat = categories.find(c => c.name === name && !c.parentId); // Ensure it matches root logic if names dupe
                                                setFormData({ ...formData, apparelId: cat?.id || '', styleId: '' });
                                            }}
                                            options={apparelOptions}
                                            placeholder="Select Apparel..."
                                        />
                                    </div>

                                    <div>
                                        <SearchableCombobox
                                            label="Style"
                                            value={categories.find(c => c.id === formData.styleId)?.name || ''}
                                            onChange={(name) => {
                                                const cat = categories.find(c => c.name === name && c.parentId === formData.apparelId);
                                                setFormData({ ...formData, styleId: cat?.id || '' });
                                            }}
                                            options={styleOptions}
                                            placeholder="Select Style..."
                                            disabled={!formData.apparelId}
                                        />
                                    </div>

                                    <div>
                                        <SearchableCombobox
                                            label="Pattern"
                                            value={patterns.find(p => p.id === formData.patternId)?.name || ''}
                                            onChange={(name) => {
                                                const item = patterns.find(p => p.name === name);
                                                setFormData({ ...formData, patternId: item?.id || '' });
                                            }}
                                            options={patterns}
                                            placeholder="Select Pattern..."
                                        />
                                    </div>

                                    <div>
                                        <SearchableCombobox
                                            label="Material"
                                            value={materials.find(m => m.id === formData.materialId)?.name || ''}
                                            onChange={(name) => {
                                                const item = materials.find(m => m.name === name);
                                                setFormData({ ...formData, materialId: item?.id || '' });
                                            }}
                                            options={materials}
                                            placeholder="Select Material..."
                                        />
                                    </div>

                                    <div>
                                        <SearchableCombobox
                                            label="Fit"
                                            value={fits.find(f => f.id === formData.fitId)?.name || ''}
                                            onChange={(name) => {
                                                const item = fits.find(f => f.name === name);
                                                setFormData({ ...formData, fitId: item?.id || '' });
                                            }}
                                            options={fits}
                                            placeholder="Select Fit..."
                                        />
                                    </div>

                                    <div>
                                        <SearchableCombobox
                                            label="Gender"
                                            value={genders.find(g => g.id === formData.genderId)?.name || ''}
                                            onChange={(name) => {
                                                const item = genders.find(g => g.name === name);
                                                // If static gender list, id might be same as name.
                                                // genders structure: {id: 'Men', name: 'Men'}
                                                setFormData({ ...formData, genderId: item?.id || '' });
                                            }}
                                            options={genders}
                                            placeholder="Select Gender..."
                                        />
                                    </div>

                                    {/* Size(s) - Multi-Select */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sizes (Select all that apply)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {sizes.map(size => (
                                                <button
                                                    key={size.id}
                                                    type="button"
                                                    onClick={() => handleMultiSelect('sizes', size.id)}
                                                    className={`px-3 py-1 rounded-full text-sm border ${formData.selectedSizes.includes(size.id)
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                        } `}
                                                >
                                                    {size.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Color(s) - Multi-Select */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Colors (Select all that apply)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {colors.map(color => (
                                                <button
                                                    key={color.id}
                                                    type="button"
                                                    onClick={() => handleMultiSelect('colors', color.id)}
                                                    className={`px-3 py-1 rounded-full text-sm border flex items-center gap-2 ${formData.selectedColors.includes(color.id)
                                                        ? 'bg-gray-100 text-gray-900 border-blue-600 ring-1 ring-blue-600'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                        } `}
                                                >
                                                    <span className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: color.hex }}></span>
                                                    {color.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Auto-Generated Preview */}
                                    <div className="col-span-2 bg-gray-50 p-4 rounded-md">
                                        <h4 className="text-sm font-medium text-gray-900">SKU Output Preview</h4>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <p><span className="font-semibold">Format:</span> {formData.generatedName || '(Start selecting attributes)'} (Color) [Size]</p>
                                            <p className="mt-1"><span className="font-semibold">Code:</span> System Generated</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Based on selection, this will create <strong>{Math.max(1, formData.selectedColors.length) * Math.max(1, formData.selectedSizes.length)}</strong> distinct SKUs.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            rows={3}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    {/* Media Uploaders */}
                                    <div className="col-span-2 space-y-6 border-t pt-6 mt-2">
                                        <MediaUploader
                                            type="image"
                                            media={formData.images}
                                            onChange={(images) => setFormData({ ...formData, images })}
                                            label="Product Images"
                                            helperText="Upload high-quality images of the product."
                                        />

                                        <MediaUploader
                                            type="video"
                                            media={formData.videos}
                                            onChange={(videos) => setFormData({ ...formData, videos })}
                                            label="Product Videos"
                                            helperText="Upload videos showing the product in motion."
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                    <button
                                        type="submit"
                                        disabled={modalLoading}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                                    >
                                        {modalLoading ? 'Creating...' : 'Create SKUs'}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
