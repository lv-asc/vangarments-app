import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthWrapper';

interface FacebookButtonProps {
    onClick?: () => void;
    text?: string;
    className?: string;
    disabled?: boolean;
    action?: 'login' | 'signup';
}

export const FacebookButton: React.FC<FacebookButtonProps> = ({
    onClick,
    text = 'Log in with Facebook',
    className = '',
    disabled = false,
    action = 'login'
}) => {
    const { loginWithFacebook, signUpWithFacebook } = useAuth();

    const handleFacebookLogin = () => {
        if (onClick) {
            onClick();
        } else {
            if (action === 'signup') {
                signUpWithFacebook();
            } else {
                loginWithFacebook();
            }
        }
    };

    return (
        <motion.button
            type="button"
            whileHover={{ scale: disabled ? 1 : 1.01 }}
            whileTap={{ scale: disabled ? 1 : 0.99 }}
            onClick={handleFacebookLogin}
            disabled={disabled}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-[#1877F2] text-white font-medium hover:bg-[#166fe5] transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {text}
        </motion.button>
    );
};
