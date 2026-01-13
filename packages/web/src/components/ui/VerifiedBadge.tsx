'use client';

import React from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface VerifiedBadgeProps {
    size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}

export function VerifiedBadge({ size = 'md', className = '' }: VerifiedBadgeProps) {
    const sizeMap = {
        xxs: 10,
        xs: 12,
        sm: 14,
        md: 16,
        lg: 20,
    };

    const sizePx = sizeMap[size] || 16;

    return (
        <CheckBadgeIcon
            className={`text-[#0095f6] flex-shrink-0 ${className}`}
            style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
            aria-hidden="true"
        />
    );
}
