'use client';

import React from 'react';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ExpiryIndicatorProps {
    daysRemaining: number;
    expiresAt?: string | Date;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * ExpiryIndicator - Shows time remaining until item expires
 * Similar to photo gallery trash indicator style
 */
export function ExpiryIndicator({
    daysRemaining,
    expiresAt,
    showIcon = true,
    size = 'md',
    className = '',
}: ExpiryIndicatorProps) {
    // Determine urgency level based on days remaining
    const getUrgencyLevel = (): 'safe' | 'warning' | 'danger' | 'critical' => {
        if (daysRemaining <= 0) return 'critical';
        if (daysRemaining <= 2) return 'danger';
        if (daysRemaining <= 5) return 'warning';
        return 'safe';
    };

    const urgency = getUrgencyLevel();

    // Color classes based on urgency
    const colorClasses = {
        safe: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-100 text-amber-700 border-amber-200',
        danger: 'bg-orange-100 text-orange-700 border-orange-200',
        critical: 'bg-red-100 text-red-800 border-red-200',
    };

    const iconColorClasses = {
        safe: 'text-emerald-500',
        warning: 'text-amber-500',
        danger: 'text-orange-500',
        critical: 'text-red-600',
    };

    // Size classes
    const sizeClasses = {
        sm: 'text-xs px-1.5 py-0.5',
        md: 'text-sm px-2 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    const iconSizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    // Format the display text
    const getDisplayText = (): string => {
        if (daysRemaining <= 0) {
            return 'Expires today';
        } else if (daysRemaining === 1) {
            return '1 day left';
        } else if (daysRemaining <= 14) {
            return `${daysRemaining} days left`;
        } else {
            // Calculate from expiresAt if available
            if (expiresAt) {
                const expDate = new Date(expiresAt);
                return `Expires ${expDate.toLocaleDateString()}`;
            }
            return `${daysRemaining} days left`;
        }
    };

    const IconComponent = urgency === 'critical' ? ExclamationTriangleIcon : ClockIcon;

    return (
        <div
            className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${colorClasses[urgency]}
        ${sizeClasses[size]}
        ${className}
      `}
        >
            {showIcon && (
                <IconComponent
                    className={`${iconSizeClasses[size]} ${iconColorClasses[urgency]}`}
                />
            )}
            <span>{getDisplayText()}</span>
        </div>
    );
}

/**
 * Compact version for use in tight spaces like card overlays
 */
export function ExpiryBadge({
    daysRemaining,
    className = '',
}: {
    daysRemaining: number;
    className?: string;
}) {
    const getBgColor = (): string => {
        if (daysRemaining <= 0) return 'bg-red-600';
        if (daysRemaining <= 2) return 'bg-orange-500';
        if (daysRemaining <= 5) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <div
            className={`
        inline-flex items-center justify-center rounded-full
        text-white text-xs font-bold
        min-w-[1.5rem] h-6 px-2
        ${getBgColor()}
        ${className}
      `}
        >
            {daysRemaining <= 0 ? '!' : `${daysRemaining}d`}
        </div>
    );
}

export default ExpiryIndicator;
