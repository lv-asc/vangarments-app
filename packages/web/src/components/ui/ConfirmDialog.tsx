'use client';

import { Modal } from './Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'default';
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    loading = false,
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        if (!loading) {
            onConfirm();
        }
    };

    const getConfirmButtonStyles = () => {
        switch (variant) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white';
            case 'warning':
                return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white';
            default:
                return 'bg-[#00132d] hover:bg-[#00132d]/90 focus:ring-[#00132d] text-[#fff7d7]';
        }
    };

    const getIconStyles = () => {
        switch (variant) {
            case 'danger':
                return 'text-red-600 bg-red-100';
            case 'warning':
                return 'text-yellow-600 bg-yellow-100';
            default:
                return 'text-blue-600 bg-blue-100';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            showCloseButton={false}
            closeOnOverlayClick={!loading}
        >
            <div className="text-center">
                {/* Icon */}
                <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${getIconStyles()} mb-4`}>
                    <ExclamationTriangleIcon className="h-6 w-6" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {title}
                </h3>

                {/* Message */}
                <p className="text-sm text-gray-600 mb-6">
                    {message}
                </p>

                {/* Buttons */}
                <div className="flex space-x-3 justify-center">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getConfirmButtonStyles()}`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// Hook for easy state management of confirmation dialogs
import { useState, useCallback } from 'react';

interface UseConfirmDialogOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'default';
}

interface UseConfirmDialogReturn {
    isOpen: boolean;
    open: (onConfirmCallback?: () => void | Promise<void>) => void;
    close: () => void;
    confirm: () => void;
    dialogProps: Omit<ConfirmDialogProps, 'onConfirm'> & { onConfirm: () => void };
}

export function useConfirmDialog(options: UseConfirmDialogOptions): UseConfirmDialogReturn {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void | Promise<void>) | null>(null);

    const open = useCallback((callback?: () => void | Promise<void>) => {
        setOnConfirmCallback(() => callback || null);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        if (!loading) {
            setIsOpen(false);
            setOnConfirmCallback(null);
        }
    }, [loading]);

    const confirm = useCallback(async () => {
        if (onConfirmCallback) {
            setLoading(true);
            try {
                await onConfirmCallback();
            } finally {
                setLoading(false);
                setIsOpen(false);
                setOnConfirmCallback(null);
            }
        } else {
            setIsOpen(false);
        }
    }, [onConfirmCallback]);

    return {
        isOpen,
        open,
        close,
        confirm,
        dialogProps: {
            isOpen,
            onClose: close,
            onConfirm: confirm,
            loading,
            ...options,
        },
    };
}
