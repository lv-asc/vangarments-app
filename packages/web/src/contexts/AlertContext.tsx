'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';

interface AlertState {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface AlertContextType {
    showAlert: (title: string, message: string) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AlertState>({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert'
    });

    const showAlert = (title: string, message: string) => {
        setState({
            isOpen: true,
            title,
            message,
            type: 'alert'
        });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
        setState({
            isOpen: true,
            title,
            message,
            type: 'confirm',
            onConfirm: () => {
                onConfirm();
                closeAlert();
            },
            onCancel: () => {
                onCancel?.();
                closeAlert();
            }
        });
    };

    const closeAlert = () => {
        setState(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <Modal
                isOpen={state.isOpen}
                onClose={closeAlert}
                title={state.title}
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">{state.message}</p>
                    <div className="flex justify-end gap-3 pt-2">
                        {state.type === 'confirm' && (
                            <button
                                onClick={state.onCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={state.type === 'confirm' ? state.onConfirm : closeAlert}
                            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
                        >
                            {state.type === 'confirm' ? 'Confirm' : 'OK'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}
