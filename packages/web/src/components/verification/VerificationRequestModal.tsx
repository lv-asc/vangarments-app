'use client';

import { useState, Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckBadgeIcon, DocumentTextIcon, PaperClipIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface VerificationRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestType: 'user' | 'entity';
    entityId?: string;
    entityName?: string;
}

export default function VerificationRequestModal({
    isOpen,
    onClose,
    requestType,
    entityId,
    entityName
}: VerificationRequestModalProps) {
    const toast = useToast();
    const [reason, setReason] = useState('');
    const [supportingDocuments, setSupportingDocuments] = useState<string[]>([]);
    const [documentInput, setDocumentInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string; size: number }>>([]);
    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploadingFile(true);
        try {
            const newFiles: Array<{ name: string; url: string; size: number }> = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validate file size (10MB limit)
                if (file.size > 10 * 1024 * 1024) {
                    toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
                    continue;
                }

                // Validate file type
                const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic'];
                if (!validTypes.includes(file.type)) {
                    toast.error(`File "${file.name}" has invalid type. Only PDF, JPG, PNG, and HEIC are allowed.`);
                    continue;
                }

                // Upload file
                const result = await apiClient.uploadFile(file);
                newFiles.push({
                    name: file.name,
                    url: result.url,
                    size: file.size
                });
            }

            setUploadedFiles(prev => [...prev, ...newFiles]);
            if (newFiles.length > 0) {
                toast.success(`Uploaded ${newFiles.length} file(s) successfully`);
            }
        } catch (error: any) {
            const errorMessage = String(error?.message || error?.error?.message || 'Failed to upload file');
            toast.error(errorMessage);
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeUploadedFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason.trim()) {
            toast.error('Please provide a reason for verification');
            return;
        }

        setSubmitting(true);
        try {
            // Combine uploaded file URLs with manually entered URLs
            const allDocuments = [
                ...uploadedFiles.map(f => f.url),
                ...supportingDocuments
            ];

            await apiClient.post('/verification/request', {
                requestType,
                entityId: requestType === 'entity' ? entityId : undefined,
                reason: reason.trim(),
                supportingDocuments: allDocuments
            });

            toast.success('Verification request submitted successfully!');
            setReason('');
            setSupportingDocuments([]);
            setUploadedFiles([]);
            setDocumentInput('');
            onClose();
        } catch (error: any) {
            console.error('Failed to submit verification request:', error);
            const errorMessage = String(error?.message || error?.error?.message || 'Failed to submit verification request');
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const addDocument = () => {
        if (documentInput.trim() && !supportingDocuments.includes(documentInput.trim())) {
            setSupportingDocuments([...supportingDocuments, documentInput.trim()]);
            setDocumentInput('');
        }
    };

    const removeDocument = (index: number) => {
        setSupportingDocuments(supportingDocuments.filter((_, i) => i !== index));
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <CheckBadgeIcon className="w-6 h-6 text-blue-500" />
                                        <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                                            Request Verification
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                <p className="text-sm text-gray-600 mb-4">
                                    {requestType === 'user'
                                        ? 'Request verification for your user account. Verified accounts receive a blue checkmark badge.'
                                        : `Request verification for ${entityName || 'this entity'}. Verified entities receive a blue checkmark badge.`
                                    }
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Reason */}
                                    <div>
                                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                                            Reason for Verification *
                                        </label>
                                        <textarea
                                            id="reason"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            placeholder="Explain why you should be verified (e.g., public figure, brand authenticity, etc.)"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Provide details about your identity, influence, or business legitimacy
                                        </p>
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Upload Documents (Optional)
                                        </label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                                        >
                                            <CloudArrowUpIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600 font-medium">
                                                {uploadingFile ? 'Uploading...' : 'Click to upload or drag and drop'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                PDF, JPG, PNG, HEIC (max 10MB per file)
                                            </p>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept=".pdf,.jpg,.jpeg,.png,.heic"
                                            onChange={(e) => handleFileUpload(e.target.files)}
                                            className="hidden"
                                        />

                                        {uploadedFiles.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {uploadedFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                        <PaperClipIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-700 truncate">{file.name}</p>
                                                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUploadedFile(index)}
                                                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                        >
                                                            <XMarkIcon className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Supporting Documents */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Supporting Links (Optional)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={documentInput}
                                                onChange={(e) => setDocumentInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDocument())}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="https://instagram.com/yourprofile"
                                            />
                                            <button
                                                type="button"
                                                onClick={addDocument}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Add links to social media profiles, websites, or other proof
                                        </p>

                                        {supportingDocuments.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {supportingDocuments.map((doc, index) => (
                                                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                        <DocumentTextIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <span className="text-sm text-gray-700 truncate flex-1">{doc}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDocument(index)}
                                                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                        >
                                                            <XMarkIcon className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting || !reason.trim()}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {submitting ? 'Submitting...' : 'Submit Request'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
