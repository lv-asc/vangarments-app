'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthWrapper';
import { apiClient } from '@/lib/api';
import {
    PhotoIcon,
    TagIcon,
    SparklesIcon,
    ArchiveBoxIcon,
    ChevronLeftIcon
} from '@heroicons/react/24/outline';
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

function SortablePhoto({ item, index, onRemove, onLabelChange }: { item: ImageItem; index: number; onRemove: (index: number) => void; onLabelChange: (index: number, label: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

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
            {/* Remove button - stop propagation to prevent drag start */}
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
                <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Label Selector - Stop propagation to allow interaction */}
            <div
                className="absolute bottom-2 left-2 right-2"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <select
                    value={item.label}
                    onChange={(e) => onLabelChange(index, e.target.value)}
                    className="w-full bg-black/70 text-white text-xs px-2 py-1 rounded border-none focus:ring-1 focus:ring-pink-500 cursor-pointer appearance-none"
                    style={{ textAlignLast: 'center' }}
                >
                    {IMAGE_LABELS.map(label => (
                        <option key={label} value={label} className="bg-white text-black text-left">{label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default function AddWardrobeItemPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    // Unified state for items (handling file, preview, and label together)
    const [items, setItems] = useState<ImageItem[]>([]);

    const [formData, setFormData] = useState({
        category: '',
        brand: '',
        color: '',
        material: '',
        size: '',
        condition: 'new_with_tags',
        description: ''
    });

    const [vufsOptions, setVufsOptions] = useState<{
        categories: any[];
        brands: any[];
        colors: any[];
        materials: any[];
    }>({
        categories: [],
        brands: [],
        colors: [],
        materials: []
    });

    useEffect(() => {
        const loadOptions = async () => {
            try {
                // There isn't a direct "getOptions" helper exposed in ApiClient as one method yet,
                // but the Controller has getVUFSOptions.
                // Let's assume we can hit the endpoint or use defaults.
                // Wait, I didn't see getVUFSOptions in api.ts?
                // Step 48 showed api.ts. It has getVUFSCategories, getVUFSBrands etc.
                // It does NOT have getVUFSOptions exposed as a single call.
                // BUT `wardrobeController.getVUFSOptions` exists on backend at some route?
                // Let's check `routes/wardrobe.ts`. If not exposed, I should use individual calls.

                const [categories, brands, colors, materials] = await Promise.all([
                    apiClient.getVUFSCategories(),
                    apiClient.getVUFSBrands(),
                    apiClient.getVUFSColors(),
                    apiClient.getVUFSMaterials()
                ]);

                setVufsOptions({
                    categories: categories as any[],
                    brands: brands as any[],
                    colors: colors as any[],
                    materials: materials as any[]
                });
            } catch (error) {
                console.error('Failed to load VUFS options', error);
            }
        };
        if (isAuthenticated) {
            loadOptions();
        }
    }, [isAuthenticated]);

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

    const handleLabelChange = (index: number, newLabel: string) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], label: newLabel };
            return newItems;
        });
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);

            // Create initial items with pending labels
            const newItems: ImageItem[] = newFiles.map((file, i) => ({
                id: URL.createObjectURL(file), // use as unique ID
                file: file,
                // Default first new item to Front if list was empty, else Pending/Analyzing
                label: (items.length === 0 && i === 0) ? 'Front' : 'Analyzing...'
            }));

            setItems(prev => [...prev, ...newItems]);

            // Trigger parallel analysis
            setAnalyzing(true);
            try {
                // If it's the very first image overall, we also want to populate the form
                const isFirstUpload = items.length === 0;

                await Promise.all(newItems.map(async (item, index) => {
                    try {
                        const result = await apiClient.analyzeImage(item.file);

                        // Update this item's label based on AI result
                        setItems(currentItems => {
                            return currentItems.map(i => {
                                if (i.id === item.id) {
                                    // Use AI detected label, fallback to 'Other' or keep 'Front' if it was first
                                    let detectedLabel = result?.analysis?.detectedViewpoint || 'Other';

                                    // Heuristic: If it was the FIRST image and AI thinks it is Front or just generic, keep it Front.
                                    // If AI strongly thinks it is a Tag, overwrite it.
                                    if (isFirstUpload && index === 0 && detectedLabel === 'Front') {
                                        detectedLabel = 'Front';
                                    }

                                    return { ...i, label: detectedLabel };
                                }
                                return i;
                            });
                        });

                        // If this is the primary image (first of the batch when list was empty), fill form
                        if (isFirstUpload && index === 0 && result && result.analysis) {
                            const { category, brand, metadata, condition } = result.analysis;
                            setFormData(prev => ({
                                ...prev,
                                category: category?.whiteSubcategory || category?.blueSubcategory || prev.category,
                                brand: brand?.brand || prev.brand,
                                color: metadata?.colors?.[0]?.primary || prev.color,
                                material: metadata?.composition?.[0]?.material || prev.material,
                                condition: condition?.status?.toLowerCase().replace(/ /g, '_') || prev.condition,
                                description: prev.description || `Generated from ${category?.whiteSubcategory || 'item'}`,
                            }));
                        }
                    } catch (err) {
                        console.error('Analysis failed for image', item.id, err);
                        // Update label to default on failure
                        setItems(currentItems => currentItems.map(i =>
                            i.id === item.id ? { ...i, label: 'Front' } : i
                        ));
                    }
                }));
            } finally {
                setAnalyzing(false);
            }
        }
    };

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

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (newFiles.length === 0) return;

            const newItems: ImageItem[] = newFiles.map((file, i) => ({
                id: URL.createObjectURL(file),
                file: file,
                label: (items.length === 0 && i === 0) ? 'Front' : 'Analyzing...'
            }));

            setItems(prev => [...prev, ...newItems]);

            setAnalyzing(true);
            try {
                const isFirstUpload = items.length === 0;
                await Promise.all(newItems.map(async (item, index) => {
                    try {
                        const result = await apiClient.analyzeImage(item.file);
                        setItems(currentItems => {
                            return currentItems.map(i => {
                                if (i.id === item.id) {
                                    let detectedLabel = result?.analysis?.detectedViewpoint || 'Other';
                                    if (isFirstUpload && index === 0 && detectedLabel === 'Front') detectedLabel = 'Front';
                                    return { ...i, label: detectedLabel };
                                }
                                return i;
                            });
                        });

                        if (isFirstUpload && index === 0 && result && result.analysis) {
                            const { category, brand, metadata, condition } = result.analysis;
                            setFormData(prev => ({
                                ...prev,
                                category: category?.whiteSubcategory || category?.blueSubcategory || prev.category,
                                brand: brand?.brand || prev.brand,
                                color: metadata?.colors?.[0]?.primary || prev.color,
                                material: metadata?.composition?.[0]?.material || prev.material,
                                condition: condition?.status?.toLowerCase().replace(/ /g, '_') || prev.condition,
                                description: prev.description || `Generated from ${category?.whiteSubcategory || 'item'}`,
                            }));
                        }
                    } catch (err) {
                        console.error(err);
                        setItems(currentItems => currentItems.map(i => i.id === item.id ? { ...i, label: 'Front' } : i));
                    }
                }));
            } finally {
                setAnalyzing(false);
            }
        }
    };

    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        if (items.length === 0) return;

        setLoading(true);
        try {
            const submissionData = new FormData();

            items.forEach((item) => {
                submissionData.append('images', item.file);
            });

            // Map condition to valid backend values: 'new', 'dswt', 'never_used', 'used'
            const conditionMapping: Record<string, string> = {
                'new_with_tags': 'dswt',
                'new_without_tags': 'never_used',
                'excellent': 'used',
                'good': 'used',
                'fair': 'used',
                'poor': 'used'
            };

            const mappedCondition = conditionMapping[formData.condition] || 'used';

            const itemPayload = {
                category: {
                    page: formData.category,
                    blueSubcategory: formData.category,
                    whiteSubcategory: formData.category,
                    graySubcategory: 'Casual'
                },
                brand: {
                    brand: formData.brand || 'Generic',
                    line: null,
                    collaboration: null
                },
                metadata: {
                    colors: [{ primary: formData.color || 'Black', undertones: [] }],
                    composition: formData.material ? [{ material: formData.material, percentage: 100 }] : [],
                    size: formData.size || 'One Size',
                    description: formData.description || '',
                    careInstructions: []
                },
                condition: {
                    status: mappedCondition,
                    defects: []
                },
                ownership: {
                    status: 'owned',
                    visibility: 'public'
                },
                useAI: true
            };

            if (['Shoes', 'Accessories'].includes(formData.category)) {
                itemPayload.category.page = formData.category === 'Shoes' ? 'Footwear' : 'Accessories';
            }

            submissionData.append('data', JSON.stringify(itemPayload));

            await apiClient.createWardrobeItemMultipart(submissionData);
            router.push('/wardrobe');
        } catch (error: any) {
            console.error('Failed to create item:', error);
            setSubmitError(`Failed to add item: ${error.message || 'Please check your inputs and try again.'}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeftIcon className="h-5 w-5 mr-1" />
                        Back to Wardrobe
                    </button>
                </div>

                {submitError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="font-medium">Error: </span>
                                <span className="ml-1">{submitError}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Add New Item</h1>
                            <p className="text-gray-500 mt-1">Upload photos and details about your item</p>
                        </div>
                        {analyzing && (
                            <div className="flex items-center text-pink-600 bg-pink-50 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                                <SparklesIcon className="h-4 w-4 mr-1.5" />
                                AI Analyzing...
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Image Upload Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Item Photos {items.length > 0 && `(${items.length})`}
                            </label>

                            {/* Main Drop Zone */}
                            {(items.length === 0) ? (
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors border-gray-300 hover:border-pink-500`}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    <div className="space-y-4">
                                        <div className="mx-auto h-12 w-12 text-gray-400">
                                            <PhotoIcon />
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-pink-500">
                                                <span>Upload files</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" multiple onChange={handleImageSelect} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* @ts-ignore - dnd-kit React 18 type mismatch compatibility */}
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={items.map(i => i.id)}
                                            strategy={rectSortingStrategy}
                                        >
                                            <div className="grid grid-cols-2 gap-4">
                                                {items.map((item, index) => (
                                                    <SortablePhoto
                                                        key={item.id}
                                                        item={item}
                                                        index={index}
                                                        onRemove={removeImage}
                                                        onLabelChange={handleLabelChange}
                                                    />
                                                ))}

                                                {/* Mini add button if less than max images */}
                                                {items.length < 10 && (
                                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg aspect-square cursor-pointer hover:border-pink-500 transition-colors">
                                                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                                                        <span className="text-xs text-gray-500 mt-2">Add more</span>
                                                        <input type="file" className="sr-only" accept="image/*" multiple onChange={handleImageSelect} />
                                                    </label>
                                                )}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        list="categories"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                        placeholder="e.g. Tops, Dresses (Auto-detected)"
                                    />
                                    {analyzing && <span className="absolute right-3 top-2.5 h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                    </span>}
                                </div>
                                <datalist id="categories">
                                    {vufsOptions.categories
                                        .filter(c => c.level === 'blue')
                                        .map(c => (
                                            <option key={c.id} value={c.name} />
                                        ))
                                    }
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Brand
                                </label>
                                <input
                                    type="text"
                                    list="brands"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    placeholder="e.g. Zara, Nike"
                                />
                                <datalist id="brands">
                                    {vufsOptions.brands.map(b => (
                                        <option key={b.id} value={b.name} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Size
                                    </label>
                                    <input
                                        type="text"
                                        list="sizes"
                                        value={formData.size}
                                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                        placeholder="e.g. M, 38"
                                    />
                                    <datalist id="sizes">
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Color
                                    </label>
                                    <input
                                        type="text"
                                        list="colors"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                        placeholder="e.g. Black"
                                    />
                                    <datalist id="colors">
                                        {vufsOptions.colors.map(c => (
                                            <option key={c.id} value={c.name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Material
                                </label>
                                <input
                                    type="text"
                                    list="materials"
                                    value={formData.material}
                                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    placeholder="e.g. Cotton"
                                />
                                <datalist id="materials">
                                    {vufsOptions.materials.map(m => (
                                        <option key={m.id} value={m.name} />
                                    ))}
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Condition
                                </label>
                                <select
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                >
                                    <option value="new_with_tags">New with tags</option>
                                    <option value="new_without_tags">New without tags</option>
                                    <option value="excellent">Excellent used condition</option>
                                    <option value="good">Good used condition</option>
                                    <option value="fair">Fair aspect</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Add any extra details..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end space-x-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || items.length === 0}
                                >
                                    {loading ? 'Adding...' : 'Add to Wardrobe'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
