'use client';

import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number; // 0 means no auto-dismiss
    onDismiss?: () => void;
    isVisible: boolean;
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
    success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: <CheckCircleIcon className="h-5 w-5 text-green-600" />,
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <ExclamationCircleIcon className="h-5 w-5 text-red-600" />,
    },
    warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: <ExclamationCircleIcon className="h-5 w-5 text-yellow-600" />,
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: <InformationCircleIcon className="h-5 w-5 text-blue-600" />,
    },
};

export function Toast({ message, type = 'info', duration = 5000, onDismiss, isVisible }: ToastProps) {
    useEffect(() => {
        if (duration > 0 && isVisible) {
            const timer = setTimeout(() => {
                onDismiss?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, isVisible, onDismiss]);

    if (!isVisible) return null;

    const styles = toastStyles[type];

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 max-w-md transform transition-all duration-300 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}
        >
            <div className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 flex items-start space-x-3`}>
                <div className="flex-shrink-0">
                    {styles.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{message}</p>
                </div>
                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

// Hook for easy toast management
export function useToast() {
    const [toast, setToast] = useState<{
        message: string;
        type: ToastType;
        isVisible: boolean;
    }>({
        message: '',
        type: 'info',
        isVisible: false,
    });

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        setToast({ message, type, isVisible: true });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
    }, []);

    const ToastComponent = useCallback(() => (
        <Toast
            message={toast.message}
            type={toast.type}
            isVisible={toast.isVisible}
            onDismiss={hideToast}
            duration={5000}
        />
    ), [toast, hideToast]);

    return {
        showToast,
        hideToast,
        ToastComponent,
        success: (message: string) => showToast(message, 'success'),
        error: (message: string) => showToast(message, 'error'),
        warning: (message: string) => showToast(message, 'warning'),
        info: (message: string) => showToast(message, 'info'),
    };
}
