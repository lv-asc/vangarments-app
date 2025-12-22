'use client';

import { Modal } from './Modal';
import { Button } from './Button';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    buttonText?: string;
    variant?: 'info' | 'danger';
}

export function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    buttonText = 'OK',
    variant = 'info',
}: AlertModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="flex flex-col gap-4">
                <div className={`flex items-start gap-3 p-3 rounded-md ${variant === 'danger' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'
                    }`}>
                    <InformationCircleIcon className="h-6 w-6 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{message}</p>
                </div>

                <div className="flex justify-end mt-2">
                    <Button
                        variant="primary"
                        onClick={onClose}
                        className={variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white border-transparent' : ''}
                    >
                        {buttonText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
