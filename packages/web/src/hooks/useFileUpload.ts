import { useState } from 'react';
import Cookies from 'js-cookie';

export function useFileUpload() {
    const [isUploading, setIsUploading] = useState(false);

    const uploadFile = async (file: File, folder: string = 'uploads') => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folder);

            const token = Cookies.get('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

            const response = await fetch(`${apiUrl}/storage/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            return data.url || data.path; // Adjust based on actual backend response
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    return { uploadFile, isUploading };
}
