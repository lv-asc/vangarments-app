/**
 * Check if a file is a HEIC/HEIF image
 */
export function isHEICFile(file: File): boolean {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();

    return (
        fileName.endsWith('.heic') ||
        fileName.endsWith('.heif') ||
        mimeType === 'image/heic' ||
        mimeType === 'image/heif'
    );
}

/**
 * Convert HEIC file to JPEG
 * @param file - HEIC file to convert
 * @returns Promise resolving to converted JPEG File
 */
export async function convertHEICToJPEG(file: File): Promise<File> {
    // Only run in browser
    if (typeof window === 'undefined') {
        throw new Error('HEIC conversion can only run in the browser');
    }

    try {
        // Dynamic import to avoid SSR issues
        const heic2any = (await import('heic2any')).default;

        // Convert HEIC to JPEG blob
        const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9, // High quality output
        });

        // heic2any can return Blob or Blob[] if multiple images
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

        // Create a new File object from the converted blob
        // Replace .heic/.heif extension with .jpg
        const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');

        const convertedFile = new File([blob], newFileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
        });

        return convertedFile;
    } catch (error) {
        console.error('HEIC conversion failed:', error);
        throw new Error('Failed to convert HEIC image. Please try a different format.');
    }
}

/**
 * Convert HEIC file to JPEG and create an object URL for display
 * @param file - HEIC file to convert
 * @returns Promise resolving to object URL of converted image
 */
export async function convertHEICToObjectURL(file: File): Promise<string> {
    // Only run in browser
    if (typeof window === 'undefined') {
        throw new Error('HEIC conversion can only run in the browser');
    }

    try {
        // Dynamic import to avoid SSR issues
        const heic2any = (await import('heic2any')).default;

        const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
        });

        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('HEIC to Object URL conversion failed:', error);
        throw new Error('Failed to convert HEIC image for preview.');
    }
}

/**
 * Process a file: if HEIC, convert to JPEG; otherwise return as-is
 * @param file - File to process
 * @returns Promise resolving to processed file (converted if HEIC, original otherwise)
 */
export async function processImageFile(file: File): Promise<File> {
    if (isHEICFile(file)) {
        return await convertHEICToJPEG(file);
    }
    return file;
}

/**
 * Process multiple files: convert HEIC files to JPEG, keep others as-is
 * @param files - Array of files to process
 * @returns Promise resolving to array of processed files
 */
export async function processImageFiles(files: File[]): Promise<File[]> {
    return await Promise.all(files.map(file => processImageFile(file)));
}
