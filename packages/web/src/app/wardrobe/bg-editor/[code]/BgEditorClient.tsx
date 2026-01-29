'use client';

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getImageUrl } from '@/utils/imageUrl';
import { apiClient } from '@/lib/api';
import BackgroundMaskEditor from '@/components/wardrobe/BackgroundMaskEditor';
import toast from 'react-hot-toast';

export default function BgEditorClient() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentEditorImages, setCurrentEditorImages] = useState<{ original: string, processed: string } | null>(null);

    useEffect(() => {
        if (code) {
            loadItem();
        }
    }, [code]);

    const loadItem = async () => {
        setLoading(true);
        try {
            const response = await apiClient.getWardrobeItem(code);
            const fetchedItem = response.item || response;
            setItem(fetchedItem);

            // Find an image pair to edit
            if (fetchedItem.images && fetchedItem.images.length > 0) {
                let original = null;
                let processed = null;

                const isProcessed = (img: any) => img.type === 'background_removed' || img.imageType === 'background_removed';

                // Try to find a pair
                for (const img of fetchedItem.images) {
                    if (isProcessed(img)) {
                        processed = img;
                        original = fetchedItem.images.find((i: any) => i.id === img.aiAnalysis?.originalImageId);
                        if (original) break;
                    } else {
                        original = img;
                        processed = fetchedItem.images.find((i: any) => isProcessed(i) && i.aiAnalysis?.originalImageId === img.id);
                        if (processed) break;
                    }
                }

                if (original && processed) {
                    setCurrentEditorImages({
                        original: getImageUrl(original.url),
                        processed: getImageUrl(processed.url)
                    });
                } else {
                    toast.error('No background-removed version found for this item.');
                    router.back();
                }
            } else {
                toast.error('No images found for this item.');
                router.back();
            }
        } catch (err: any) {
            console.error('Error loading item for editor:', err);
            toast.error('Failed to load item for background editing.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMask = async (blob: Blob) => {
        if (!item || !currentEditorImages) return;

        // Find processed image ID - compare using getImageUrl for consistency
        const processedImgObj = item.images?.find((img: any) => getImageUrl(img.url) === currentEditorImages.processed);
        const originalId = processedImgObj?.aiAnalysis?.originalImageId;

        if (!originalId) {
            toast.error('Could not find original image relation.');
            return;
        }

        try {
            await apiClient.saveProcessedImage(item.id, originalId, blob);
            toast.success('Mask updated successfully!');
            router.push(`/wardrobe/${item.vufsCode}`);
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to save mask');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Loading editor...</div>
            </div>
        );
    }

    if (!currentEditorImages) return null;

    return (
        <div className="min-h-screen bg-black overflow-hidden">
            <BackgroundMaskEditor
                originalImageUrl={currentEditorImages.original}
                processedImageUrl={currentEditorImages.processed}
                onSave={handleSaveMask}
                onCancel={() => router.back()}
                isOpen={true}
            />
        </div>
    );
}
