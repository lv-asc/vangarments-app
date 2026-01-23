import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthWrapper';

interface AppleButtonProps {
    onClick?: () => void;
    text?: string;
    className?: string;
    disabled?: boolean;
    action?: 'login' | 'signup';
}

export const AppleButton: React.FC<AppleButtonProps> = ({
    onClick,
    text = 'Sign in with Apple',
    className = '',
    disabled = false,
    action = 'login'
}) => {
    const { loginWithApple, signUpWithApple } = useAuth();

    const handleAppleLogin = () => {
        if (onClick) {
            onClick();
        } else {
            if (action === 'signup') {
                signUpWithApple();
            } else {
                loginWithApple();
            }
        }
    };

    return (
        <motion.button
            type="button"
            whileHover={{ scale: disabled ? 1 : 1.01 }}
            whileTap={{ scale: disabled ? 1 : 0.99 }}
            onClick={handleAppleLogin}
            disabled={disabled}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-black text-white font-medium hover:bg-gray-900 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.062 14.125a3.172 3.172 0 0 1 1.5-2.625 3.328 3.328 0 0 0-2.625-1.437c-1.125-.125-2.187.687-2.75.687-.563 0-1.438-.687-2.375-.687-1.25 0-2.375.687-3 1.813-1.313 2.25-.313 5.5.938 7.375.625.875 1.375 1.875 2.312 1.813.875-.063 1.25-.625 2.313-.625 1.062 0 1.375.625 2.312.563 1 .063 1.625-.875 2.25-1.813.75-1.063 1.062-2.063 1.062-2.125a.068.068 0 0 0-.062-.063h-.063c-.062 0-1.5-.563-1.5-2.875zM14.625 8.125a3.344 3.344 0 0 0 .75-2.3.1.1 0 0 0-.125-.125 3.25 3.25 0 0 0-2.375 1.188 3.12 3.12 0 0 0-.813 2.25.1.1 0 0 0 .125.125 3.12 3.12 0 0 0 2.438-1.138z" />
            </svg>
            {text}
        </motion.button>
    );
};
