'use client';

import { Modal } from './Modal';
import { Button } from './Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'; // Requires heroicons, assumed available

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    isLoading = false,
}: ConfirmationModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="flex flex-col gap-4">
                {variant === 'danger' && (
                    <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-md">
                        <ExclamationTriangleIcon className="h-6 w-6 shrink-0" />
                        <span className="text-sm font-medium">Warning: This action cannot be undone.</span>
                    </div>
                )}

                <p className="text-gray-600">{message}</p>

                <div className="flex justify-end gap-3 mt-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'primary' : 'primary'}
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white border-transparent' : ''}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
