'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthWrapper';
import { apiClient } from '@/lib/api';
import {
    PhotoIcon,
    ChevronLeftIcon,
    XMarkIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import SearchableCombobox from '@/components/ui/Combobox';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const AnyDndContext = DndContext as any;
const AnySortableContext = SortableContext as any;

const IMAGE_LABELS = [
    "Front",
    "Back",
    "Close-Up Front",
    "Close-Up Back",
    "Main Tag",
    "Composition Tag",
    "Size Tag",
    "Zipper",
    "Button",
    "Pocket",
    "Damage",
    "Details",
    "Other"
];

interface ImageItem {
    id: string; // url
    file: File;
    label: string;
}

function SortablePhoto({ item, index, onRemove, onLabelChange, disabled = false }: { item: ImageItem; index: number; onRemove: (index: number) => void; onLabelChange: (index: number, label: string) => void, disabled?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`relative aspect-square group ${isDragging ? 'opacity-50' : ''}`}
        >
            <img
                src={item.id}
                alt={`Preview ${index}`}
                className="w-full h-full object-cover rounded-lg border border-gray-200"
            />

            {!disabled && (
                <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(index);
                    }}
                    className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                    <span className="sr-only">Remove</span>
                    <XMarkIcon className="h-4 w-4 text-gray-600" />
                </button>
            )}

            {!disabled && (
                <div
                    className="absolute bottom-2 left-2 right-2"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <SearchableCombobox
                        value={item.label}
                        onChange={(val) => onLabelChange(index, val || '')}
                        disabled={disabled}
                        options={IMAGE_LABELS.map(label => ({ id: label, name: label, value: label }))}
                        placeholder={item.label || "Select Label"}
                        className="w-full min-w-[120px]"
                    />
                </div>
            )}
        </div>
    );
}

export default function AddWardrobeItemPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    // UI State
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // SKU Search State
    const [skuSearchTerm, setSkuSearchTerm] = useState('');
    const [skuSearchResults, setSkuSearchResults] = useState<any[]>([]);

    // Data State
    const [items, setItems] = useState<ImageItem[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        brand: '',
        color: '',
        material: '',
        pattern: '',
        fit: '',
        size: '',
        condition: 'new_with_tags',
        description: '',
        skuItemId: undefined as string | undefined, // Added
        customAttributes: {} as Record<string, string>
    });

    // SKU Search Effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (skuSearchTerm.length > 2 && !formData.skuItemId) {
                try {
                    const res = await apiClient.searchSKUs(skuSearchTerm);
                    setSkuSearchResults(res.skus || []);
                } catch (err) {
                    console.error('SKU search error', err);
                }
            } else {
                setSkuSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [skuSearchTerm, formData.skuItemId]);

    const handleSKUSelect = (sku: any) => {
        setFormData(prev => ({
            ...prev,
            skuItemId: sku.id,
            name: prev.name || sku.name,
            brand: prev.brand || sku.brand?.name || '',
            category: prev.category || sku.category?.page || '', // Using page as primary category for now
            collection: sku.collection || prev.customAttributes['collection'], // If exists
            // Don't override everything, just empties
            description: prev.description ? prev.description : (sku.description || prev.description),
        }));
        setSkuSearchTerm(sku.name); // Set input to name
        setSkuSearchResults([]);
    };

    // VUFS Options State
    const [vufsOptions, setVufsOptions] = useState<{
        categories: any[];
        brands: any[];
        colors: any[];
        materials: any[];
        patterns: any[];
        fits: any[];
        sizes: any[];
        customTypes: any[];
        customValues: Record<string, any[]>;
    }>({
        categories: [],
        brands: [],
        colors: [],
        materials: [],
        patterns: [],
        fits: [],
        sizes: [],
        customTypes: [],
        customValues: {}
    });

    // Fetch VUFS Data
    useEffect(() => {
        const loadOptions = async () => {
            if (!isAuthenticated) return;
            try {
                // Initialize defaults just in case
                const defaults: any = { categories: [], brands: [], colors: [], materials: [], patterns: [], fits: [], sizes: [], customTypes: [], customValues: {} };

                const [
                    categories,
                    brands,
                    colors,
                    materials,
                    patterns,
                    fits,
                    sizes,
                    customTypes
                ] = await Promise.all([
                    apiClient.getVUFSCategories().catch(e => []),
                    apiClient.getVUFSBrands().catch(e => []),
                    apiClient.getVUFSColors().catch(e => []),
                    apiClient.getVUFSMaterials().catch(e => []),
                    apiClient.getVUFSPatterns().catch(e => []),
                    apiClient.getVUFSFits().catch(e => []),
                    apiClient.getVUFSSizes().catch(e => []),
                    apiClient.getVUFSAttributeTypes().catch(e => [])
                ]);

                // Fetch values for custom types
                const customValuesMap: Record<string, any[]> = {};
                if (Array.isArray(customTypes)) {
                    await Promise.all(customTypes.map(async (type: any) => {
                        try {
                            const values = await apiClient.getVUFSAttributeValues(type.slug);
                            customValuesMap[type.slug] = Array.isArray(values) ? values : (values as any)?.values || [];
                        } catch (e) {
                            console.error(`Failed to fetch values for ${type.name}`, e);
                        }
                    }));
                }

                setVufsOptions({
                    categories: Array.isArray(categories) ? categories : defaults.categories,
                    brands: Array.isArray(brands) ? brands : defaults.brands,
                    colors: Array.isArray(colors) ? colors : defaults.colors,
                    materials: Array.isArray(materials) ? materials : defaults.materials,
                    patterns: Array.isArray(patterns) ? patterns : defaults.patterns,
                    fits: Array.isArray(fits) ? fits : defaults.fits,
                    sizes: Array.isArray(sizes) ? sizes : defaults.sizes,
                    customTypes: Array.isArray(customTypes) ? customTypes : defaults.customTypes,
                    customValues: customValuesMap
                });
            } catch (error) {
                console.error('Failed to load VUFS options', error);
            }
        };
        loadOptions();
    }, [isAuthenticated]);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Image Handlers
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addImages(Array.from(e.target.files));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            addImages(files);
        }
    };

    const addImages = (files: File[]) => {
        const newItems: ImageItem[] = files.map((file) => ({
            id: URL.createObjectURL(file),
            file: file,
            label: '' // Don't assign labels until processing
        }));
        setItems(prev => [...prev, ...newItems]);
    };

    // Auto-process images when they are added
    useEffect(() => {
        if (items.length > 0 && !processing && step === 1) {
            // Check if any items have empty labels (unprocessed)
            const hasUnprocessed = items.some(item => item.label === '');
            if (hasUnprocessed) {
                processImagesAuto(items);
            }
        }
    }, [items.length]); // Only trigger when item count changes

    const removeImage = (index: number) => {
        setItems(prev => {
            const newItems = [...prev];
            URL.revokeObjectURL(newItems[index].id);
            newItems.splice(index, 1);
            return newItems;
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // PROCESS IMAGES (Step 1 -> Step 2)
    // Auto-processing version that accepts items as param
    const processImagesAuto = async (imagesToProcess: ImageItem[]) => {
        if (imagesToProcess.length === 0) return;
        setProcessing(true);
        setProgress(0);

        console.log('=== Starting Auto Image Processing ===');
        console.log('Number of images:', imagesToProcess.length);

        try {
            const total = imagesToProcess.length;
            let completedCount = 0;

            const results = await Promise.all(imagesToProcess.map(async (item, index) => {
                try {
                    console.log(`[${index + 1}/${total}] Analyzing image:`, item.file.name);
                    const result = await apiClient.analyzeImage(item.file);
                    console.log(`[${index + 1}/${total}] API Response:`, JSON.stringify(result, null, 2));

                    // Increment progress
                    completedCount++;
                    setProgress((completedCount / total) * 100);

                    return { item, analysis: result?.analysis, index };
                } catch (err) {
                    console.error(`[${index + 1}/${total}] Analysis failed:`, err);
                    completedCount++;
                    setProgress((completedCount / total) * 100);
                    return { item, analysis: null, index };
                }
            }));

            // Finish progress
            setProgress(100);
            console.log('=== All Analysis Complete ===');
            console.log('Results:', results);

            // Consolidate Data
            const newFormData = { ...formData };
            const detectedLabels: Record<number, string> = {};

            results.forEach(({ item, analysis, index }) => {
                console.log(`Processing result for image ${index}:`, analysis);
                if (!analysis) {
                    console.log(`  - No analysis for image ${index}`);
                    return;
                }

                // Detect Label
                if (analysis.detectedViewpoint) {
                    console.log(`  - Detected viewpoint: ${analysis.detectedViewpoint}`);
                    detectedLabels[index] = analysis.detectedViewpoint;
                }

                // Merge Data (Last non-null write wins scheme)
                if (analysis.category?.whiteSubcategory) {
                    console.log(`  - Category: ${analysis.category.whiteSubcategory}`);
                    newFormData.category = analysis.category.whiteSubcategory;
                }
                if (analysis.brand?.brand) {
                    console.log(`  - Brand: ${analysis.brand.brand}`);
                    newFormData.brand = analysis.brand.brand;
                }
                if (analysis.metadata?.colors?.[0]?.primary) {
                    console.log(`  - Color: ${analysis.metadata.colors[0].primary}`);
                    newFormData.color = analysis.metadata.colors[0].primary;
                }
                if (analysis.metadata?.composition?.[0]?.material) {
                    console.log(`  - Material: ${analysis.metadata.composition[0].material}`);
                    newFormData.material = analysis.metadata.composition[0].material;
                }
                if (analysis.condition?.status) {
                    console.log(`  - Condition: ${analysis.condition.status}`);
                    newFormData.condition = analysis.condition.status.toLowerCase().replace(/ /g, '_');
                }

                if (analysis.metadata?.size) {
                    console.log(`  - Size: ${analysis.metadata.size}`);
                    newFormData.size = analysis.metadata.size;
                }
                if (analysis.metadata?.pattern) {
                    console.log(`  - Pattern: ${analysis.metadata.pattern}`);
                    newFormData.pattern = analysis.metadata.pattern;
                }
                if (analysis.metadata?.fit) {
                    console.log(`  - Fit: ${analysis.metadata.fit}`);
                    newFormData.fit = analysis.metadata.fit;
                }
            });

            console.log('Detected labels:', detectedLabels);
            console.log('New form data:', newFormData);

            // Update item labels based on detection
            // If no label was detected, set 'Other' for non-first, 'Front' for first
            setItems(prev => prev.map((item, idx) => ({
                ...item,
                label: detectedLabels[idx] || (idx === 0 ? 'Front' : 'Other')
            })));

            // Set Form Data
            // Auto-generate name if empty
            if (!newFormData.name) {
                newFormData.name = `${newFormData.color || ''} ${newFormData.category || 'Item'} ${newFormData.brand ? `from ${newFormData.brand}` : ''}`.trim();
            }

            console.log('Final form data being set:', newFormData);
            setFormData(newFormData);

            // Artificial delay to show 100%
            setTimeout(() => {
                setProcessing(false);
                setStep(2);
            }, 500);

        } catch (err) {
            console.error('Process images error:', err);
            setProcessing(false);
            alert("Error processing images. Please try again.");
        }
    };

    // Final Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setLoading(true);

        try {
            const submissionData = new FormData();
            items.forEach((item) => submissionData.append('images', item.file));

            const conditionMapping: Record<string, string> = {
                'new_with_tags': 'dswt',
                'new_without_tags': 'never_used',
                'excellent': 'used',
                'good': 'used',
                'fair': 'used',
                'poor': 'used'
            };

            const itemPayload = {
                category: {
                    page: formData.category, // Heuristic mapping might be needed if Page != Subcat
                    // Ideally we map 'category' to core Vangarments structure.
                    // Assuming value equals subcategory for now.
                    blueSubcategory: formData.category,
                    whiteSubcategory: formData.category,
                    graySubcategory: 'Casual'
                },
                brand: {
                    brand: formData.brand || 'Generic'
                },
                metadata: {
                    name: formData.name,
                    colors: [{ primary: formData.color || 'Black', undertones: [] }],
                    composition: formData.material ? [{ material: formData.material, percentage: 100 }] : [],
                    size: formData.size || 'One Size',
                    pattern: formData.pattern,
                    fit: formData.fit,
                    description: formData.description || '',
                    customAttributes: formData.customAttributes,
                    careInstructions: []
                },
                condition: {
                    status: conditionMapping[formData.condition] || 'used',
                    defects: []
                },
                ownership: {
                    status: 'owned',
                    visibility: 'public'
                },
                skuItemId: formData.skuItemId,
                useAI: true
            };

            // Fix for Category Page mapping
            const shoes = vufsOptions.categories.some(c => c.name === formData.category && c.parentId === 'Footwear'); // This check is hard without full tree
            // Simple check
            if (['Shoes', 'Sneakers', 'Boots', 'Sandals'].includes(formData.category)) {
                itemPayload.category.page = 'Footwear';
            } else if (['Bag', 'Jewelry', 'Hat'].includes(formData.category)) {
                itemPayload.category.page = 'Accessories';
            } else {
                itemPayload.category.page = 'Apparel';
            }

            submissionData.append('data', JSON.stringify(itemPayload));
            await apiClient.createWardrobeItemMultipart(submissionData);
            router.push('/wardrobe');

        } catch (error: any) {
            console.error('Failed to create item:', error);
            setSubmitError(error.message || 'Failed to add item.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">


            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => step === 1 ? router.back() : setStep(1)}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeftIcon className="h-5 w-5 mr-1" />
                        {step === 1 ? 'Back to Wardrobe' : 'Back to Upload'}
                    </button>
                    <div className="text-sm font-medium text-gray-500">
                        Step {step} of 2: {step === 1 ? 'Upload & Analyze' : 'Review & Edit'}
                    </div>
                </div>

                {submitError && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                        {submitError}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {step === 1 ? 'Upload Photos' : 'Review Item Details'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {step === 1
                                ? 'Upload photos of your item. We will analyze them to fill in the details.'
                                : 'Check the details below and fill in any missing information.'}
                        </p>
                    </div>

                    <div className="p-6">
                        {/* STEP 1: UPLOAD */}
                        {step === 1 && (
                            <div className="space-y-8">
                                {/* Dropzone */}
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${items.length === 0 ? 'py-16' : 'py-8'
                                        } border-gray-300 hover:border-blue-500 hover:bg-gray-50`}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    {items.length === 0 ? (
                                        <div className="space-y-4">
                                            <div className="mx-auto h-16 w-16 text-gray-400 bg-gray-100 rounded-full p-3">
                                                <PhotoIcon />
                                            </div>
                                            <div>
                                                <label htmlFor="file-upload" className="cursor-pointer text-blue-600 font-medium hover:text-blue-500">
                                                    <span>Upload files</span>
                                                    <input id="file-upload" type="file" className="sr-only" accept="image/*" multiple onChange={handleImageSelect} />
                                                </label>
                                                <p className="inline pl-1 text-gray-500">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                                        </div>
                                    ) : (
                                        // @ts-ignore
                                        <AnyDndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                            {/* @ts-ignore */}
                                            <AnySortableContext items={items} strategy={rectSortingStrategy}>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    {items.map((item, index) => (
                                                        <SortablePhoto
                                                            key={item.id}
                                                            item={item}
                                                            index={index}
                                                            onRemove={removeImage}
                                                            disabled={processing}
                                                            onLabelChange={(idx, l) => {
                                                                setItems(prev => {
                                                                    const n = [...prev];
                                                                    n[idx].label = l;
                                                                    return n;
                                                                });
                                                            }}
                                                        />
                                                    ))}
                                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg aspect-square cursor-pointer hover:border-blue-500 hover:bg-white transition-colors">
                                                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                                                        <span className="text-xs text-gray-500 mt-2">Add more</span>
                                                        <input type="file" className="sr-only" accept="image/*" multiple onChange={handleImageSelect} />
                                                    </label>
                                                </div>
                                            </AnySortableContext>
                                        </AnyDndContext>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                {processing && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Analyzing images...</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Button - Changes based on processing state */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={() => {
                                            if (!processing && items.length > 0) {
                                                setStep(2);
                                            }
                                        }}
                                        disabled={items.length === 0 || processing}
                                        className={`
                                            w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-sm
                                            transition-all duration-300 ease-out
                                            flex items-center justify-center gap-2
                                            ${processing
                                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                                : items.length === 0
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 hover:scale-105 hover:shadow-lg active:scale-95'
                                            }
                                        `}
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : items.length === 0 ? (
                                            'Add Images'
                                        ) : (
                                            <>
                                                Next
                                                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: DETAILS FORM */}
                        {step === 2 && (
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Images Preview (Read Only) */}
                                <div className="lg:col-span-1 space-y-4">
                                    <h3 className="text-sm font-medium text-gray-700">Images</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {items.map((item, index) => (
                                            <div key={item.id} className="relative aspect-square group">
                                                <img src={item.id} className="w-full h-full object-cover rounded-lg" />
                                                <div className="absolute bottom-1 left-1 right-1">
                                                    <SearchableCombobox
                                                        value={item.label}
                                                        onChange={(val) => {
                                                            setItems(prev => {
                                                                const n = [...prev];
                                                                n[index].label = val || '';
                                                                return n;
                                                            });
                                                        }}
                                                        options={IMAGE_LABELS.map(label => ({ id: label, name: label, value: label }))}
                                                        placeholder="^"
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        disabled={loading}
                                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Edit Images
                                    </button>
                                </div>

                                {/* Right Column: Fields */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* SKU Link Section */}
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-medium text-blue-900">
                                                Link to Official Product (SKU)
                                            </label>
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wide">
                                                Optional
                                            </span>
                                        </div>

                                        <div className="relative">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={skuSearchTerm}
                                                    onChange={(e) => setSkuSearchTerm(e.target.value)}
                                                    placeholder="Search by model name, code, etc..."
                                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                {formData.skuItemId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, skuItemId: undefined }));
                                                            setSkuSearchTerm('');
                                                        }}
                                                        className="text-red-500 text-sm hover:text-red-700"
                                                    >
                                                        Unlink
                                                    </button>
                                                )}
                                            </div>

                                            {/* Results Dropdown */}
                                            {skuSearchResults.length > 0 && !formData.skuItemId && (
                                                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                                                    {skuSearchResults.map((sku: any) => (
                                                        <li
                                                            key={sku.id}
                                                            onClick={() => handleSKUSelect(sku)}
                                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {/* Logo Display: Line Logo > Brand Logo > Initials */}
                                                                {sku.lineInfo?.logo ? (
                                                                    <img src={sku.lineInfo.logo} alt={sku.lineInfo.name} className="h-8 w-8 object-contain rounded-full bg-gray-50 border border-gray-100" />
                                                                ) : sku.brand?.logo ? (
                                                                    <img src={sku.brand.logo} alt={sku.brand.name} className="h-8 w-8 object-contain rounded-full bg-gray-50 border border-gray-100" />
                                                                ) : (
                                                                    <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-bold border border-blue-100">
                                                                        {sku.brand?.name ? sku.brand.name.substring(0, 2).toUpperCase() : '??'}
                                                                    </div>
                                                                )}

                                                                <div>
                                                                    <div className="font-medium text-gray-900 flex items-center gap-2">
                                                                        {sku.name}
                                                                        {sku.lineInfo && (
                                                                            <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                                                                                {sku.lineInfo.name}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-gray-500 text-xs">
                                                                        {sku.brand?.name} • {sku.code}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {/* No Results Message */}
                                            {skuSearchTerm.length > 2 && skuSearchResults.length === 0 && !formData.skuItemId && (
                                                <div className="mt-2 text-sm text-gray-500 bg-white p-3 rounded border border-gray-100 italic">
                                                    No official record found. That's okay! You can enter the details manually below.
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-blue-700 mt-2">
                                            Useful for verifying official brand items. For thrifted, vintage, or unique pieces, feel free to skip this and fill in the details directly.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. Leather Jacket"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Category */}
                                        <div>
                                            <SearchableCombobox
                                                label="Category"
                                                value={formData.category}
                                                onChange={(val: string | null) => setFormData({ ...formData, category: val || '' })}
                                                options={vufsOptions.categories
                                                    .filter(c => c.level === 'page' || c.level === 'blue')
                                                    .map(c => ({ id: c.id || c.name, name: c.name }))
                                                }
                                                placeholder="^"
                                            />
                                        </div>

                                        {/* Brand */}
                                        <div>
                                            <SearchableCombobox
                                                label="Brand"
                                                value={formData.brand}
                                                onChange={(val: string | null) => setFormData({ ...formData, brand: val || '' })}
                                                options={[
                                                    { id: 'Generic', name: 'Generic' },
                                                    ...vufsOptions.brands.map(b => ({ id: b.id || b.name, name: b.name }))
                                                ]}
                                                placeholder="^"
                                                freeSolo
                                            />
                                        </div>

                                        {/* Color */}
                                        <div>
                                            <SearchableCombobox
                                                label="Color"
                                                value={formData.color}
                                                onChange={(val: string | null) => setFormData({ ...formData, color: val || '' })}
                                                options={vufsOptions.colors.map(c => ({ id: c.id || c.name, name: c.name }))}
                                                placeholder="^"
                                            />
                                        </div>

                                        {/* Material */}
                                        <div>
                                            <SearchableCombobox
                                                label="Material"
                                                value={formData.material}
                                                onChange={(val: string | null) => setFormData({ ...formData, material: val || '' })}
                                                options={vufsOptions.materials.map(m => ({ id: m.id || m.name, name: m.name }))}
                                                placeholder="^"
                                            />
                                        </div>

                                        {/* Pattern */}
                                        <div>
                                            <SearchableCombobox
                                                label="Pattern"
                                                value={formData.pattern}
                                                onChange={(val: string | null) => setFormData({ ...formData, pattern: val || '' })}
                                                options={vufsOptions.patterns.map(p => ({ id: p.id || p.name, name: p.name }))}
                                                placeholder="^"
                                            />
                                        </div>

                                        {/* Fit */}
                                        <div>
                                            <SearchableCombobox
                                                label="Fit"
                                                value={formData.fit}
                                                onChange={(val: string | null) => setFormData({ ...formData, fit: val || '' })}
                                                options={vufsOptions.fits.map(f => ({ id: f.id || f.name, name: f.name }))}
                                                placeholder="^"
                                            />
                                        </div>

                                        {/* Size */}
                                        <div>
                                            <SearchableCombobox
                                                label="Size"
                                                value={formData.size}
                                                onChange={(val: string | null) => setFormData({ ...formData, size: val || '' })}
                                                options={vufsOptions.sizes.map(s => ({ id: s.id || s.name, name: s.name }))}
                                                placeholder="^"
                                                freeSolo
                                            />
                                        </div>

                                        {/* Condition */}
                                        <div>
                                            <SearchableCombobox
                                                label="Condition"
                                                value={formData.condition}
                                                onChange={(val: string | null) => setFormData({ ...formData, condition: val || '' })}
                                                options={[
                                                    { id: 'new_with_tags', name: 'New with tags' },
                                                    { id: 'new_without_tags', name: 'New without tags' },
                                                    { id: 'excellent', name: 'Excellent used condition' },
                                                    { id: 'good', name: 'Good used condition' },
                                                    { id: 'fair', name: 'Fair aspect' },
                                                    { id: 'poor', name: 'Poor aspect' },
                                                ]}
                                                placeholder="^"
                                            />
                                        </div>
                                    </div>

                                    {/* Custom Attributes */}
                                    {vufsOptions.customTypes.length > 0 && (
                                        <div className="pt-4 border-t border-gray-200">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-4">Additional Details</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {vufsOptions.customTypes.map((type) => (
                                                    <div key={type.slug}>
                                                        <SearchableCombobox
                                                            label={type.name}
                                                            value={formData.customAttributes[type.slug] || ''}
                                                            onChange={(val) => setFormData({
                                                                ...formData,
                                                                customAttributes: {
                                                                    ...formData.customAttributes,
                                                                    [type.slug]: val || ''
                                                                }
                                                            })}
                                                            options={
                                                                vufsOptions.customValues[type.slug]
                                                                    ? vufsOptions.customValues[type.slug].map((v: any) => {
                                                                        const val = typeof v === 'object' && v !== null ? v.name : v;
                                                                        return { id: val, name: val };
                                                                    })
                                                                    : []
                                                            }
                                                            placeholder="^"
                                                            freeSolo
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                            placeholder="Any other details..."
                                        />
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setStep(1)}
                                            disabled={loading}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : 'Save Wardrobe Item'}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
