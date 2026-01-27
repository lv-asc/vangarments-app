import { Switch as HeadlessSwitch } from '@headlessui/react';
import React from 'react';

interface SwitchProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    className?: string;
    disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, className = '', disabled = false }) => {
    return (
        <HeadlessSwitch
            checked={checked}
            onChange={onCheckedChange}
            disabled={disabled}
            className={`${checked ? 'bg-[#00132d]' : 'bg-gray-200'
                } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00132d] ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${className}`}
        >
            <span className="sr-only">Toggle background</span>
            <span
                className={`${checked ? 'translate-x-5' : 'translate-x-1'
                    } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
            />
        </HeadlessSwitch>
    );
};
