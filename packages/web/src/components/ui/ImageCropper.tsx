import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Button } from '@/components/ui/Button'
import getCroppedImg from '@/utils/cropImage'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ImageCropperProps {
    imageSrc: string
    aspectRatio?: number
    cropShape?: 'round' | 'rect'
    onCancel: () => void
    onCropComplete: (croppedBlob: Blob) => void
}

export default function ImageCropper({
    imageSrc,
    aspectRatio = 1,
    cropShape = 'round',
    onCancel,
    onCropComplete
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop)
    }

    const onZoomChange = (zoom: number) => {
        setZoom(zoom)
    }

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = async () => {
        if (!croppedAreaPixels) return
        setIsLoading(true)
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (croppedImage) {
                onCropComplete(croppedImage)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[80vh] max-h-[600px]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Adjust Photo</h3>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative flex-1 bg-gray-900 overflow-hidden">
                    {/* @ts-ignore: react-easy-crop type definition issue */}
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                        showGrid={true}
                        cropShape={cropShape}
                    />
                </div>

                {/* Controls */}
                <div className="p-6 bg-white border-t space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span className="font-medium">Zoom</span>
                            <span>{Math.round(zoom * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="bg-pink-600 hover:bg-pink-700 text-white font-medium px-8 shadow-sm"
                        >
                            {isLoading ? 'Processing...' : 'Save Photo'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
