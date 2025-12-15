import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { IJournalismData, journalismApi, MediaItem, Attachment } from '@/lib/journalismApi';
import { pageApi, IPage } from '@/lib/pageApi';
import { api } from '@/lib/api';
import MediaUploader from './MediaUploader';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface JournalismFormProps {
    initialData?: IJournalismData | null;
    onSuccess: () => void;
    onCancel: () => void;
}

interface User {
    id: string;
    personalInfo: {
        name: string;
        avatarUrl?: string; // Optional
    };
    email: string; // Add email to interface
}

export default function JournalismForm({ initialData, onSuccess, onCancel }: JournalismFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<IJournalismData>({
        defaultValues: initialData || {
            title: '',
            content: '',
            type: 'News',
            published: false,
            images: [],
            videos: [],
            attachments: [],
            authorIds: [],
            pageIds: []
        }
    });

    const [loading, setLoading] = useState(false);

    // Custom state for complex fields
    const [images, setImages] = useState<MediaItem[]>(initialData?.images || []);
    const [videos, setVideos] = useState<MediaItem[]>(initialData?.videos || []);
    const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);

    // Selectors Data
    const [availableAuthors, setAvailableAuthors] = useState<User[]>([]);
    const [availablePages, setAvailablePages] = useState<IPage[]>([]);

    // Selections
    const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>(initialData?.authorIds || []);
    const [selectedPageIds, setSelectedPageIds] = useState<string[]>(initialData?.pageIds || []);

    const [uploadingAttachment, setUploadingAttachment] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch authors (Journalist or Writer)
                const usersResponse = await api.get<{ users: User[] }>('/users?roles=Journalist,Writer'); // Assuming UserResponse structure
                if (usersResponse && usersResponse.users) {
                    setAvailableAuthors(usersResponse.users);
                }

                // Fetch pages
                const pages = await pageApi.getAll();
                setAvailablePages(pages);
            } catch (error) {
                console.error('Failed to load form data dependencies', error);
                toast.error('Failed to load authors or pages');
            }
        };
        fetchData();
    }, []);

    const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        try {
            setUploadingAttachment(true);
            const { url } = await api.uploadFile(file);

            const newAttachment: Attachment = {
                name: file.name,
                size: file.size,
                type: file.type,
                url
            };

            setAttachments([...attachments, newAttachment]);
            toast.success('File attached');
        } catch (error) {
            toast.error('Failed to upload attachment');
        } finally {
            setUploadingAttachment(false);
            e.target.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const onSubmit = async (data: IJournalismData) => {
        try {
            setLoading(true);

            const payload = {
                ...data,
                images,
                videos,
                attachments,
                authorIds: selectedAuthorIds,
                pageIds: selectedPageIds
            };

            if (initialData?.id) {
                await journalismApi.update(initialData.id, payload);
                toast.success('Updated successfully');
            } else {
                await journalismApi.create(payload);
                toast.success('Created successfully');
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                    type="text"
                    {...register('title', { required: 'Title is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            {/* Type */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                    {...register('type')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                    <option value="News">News</option>
                    <option value="Column">Column</option>
                    <option value="Article">Article</option>
                </select>
            </div>

            {/* Pages Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Page(s)</label>
                <select
                    multiple
                    value={selectedPageIds}
                    onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedPageIds(options);
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-32"
                >
                    {availablePages.map(page => (
                        <option key={page.id} value={page.id}>{page.name}</option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
            </div>

            {/* Authors Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Author(s)</label>
                <select
                    multiple
                    value={selectedAuthorIds}
                    onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedAuthorIds(options);
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-32"
                >
                    {availableAuthors.length > 0 ? availableAuthors.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.personalInfo.name} ({user.email})
                        </option>
                    )) : <option disabled>No users with Journalist/Writer role found</option>}
                </select>
                <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple. Only users with Journalist/Writer roles are shown.</p>
            </div>

            {/* Media Uploaders */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <MediaUploader
                    type="image"
                    media={images}
                    onChange={setImages}
                    label="Images"
                    helperText="Upload related images"
                />
                <MediaUploader
                    type="video"
                    media={videos}
                    onChange={setVideos}
                    label="Videos"
                    helperText="Upload related videos"
                />
            </div>

            {/* Content */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                    rows={10}
                    {...register('content', { required: 'Content is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                    placeholder="Write content here..."
                />
                {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
            </div>

            {/* Attachments */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attachments (PDFs, Docs)</label>
                <div className="space-y-3">
                    {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                            <div className="flex items-center overflow-hidden">
                                <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                <div className="truncate">
                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="ml-2 text-gray-400 hover:text-red-500"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ))}

                    <div className="flex items-center">
                        <label className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${uploadingAttachment ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <PaperClipIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                            {uploadingAttachment ? 'Uploading...' : 'Add Attachment'}
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleAttachmentUpload}
                                disabled={uploadingAttachment}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Published Checkbox */}
            <div className="flex items-center">
                <input
                    type="checkbox"
                    {...register('published')}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="ml-2 block text-sm text-gray-900">Published</label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Content'}
                </button>
            </div>
        </form>
    );
}
