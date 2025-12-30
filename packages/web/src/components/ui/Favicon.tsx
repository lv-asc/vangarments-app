'use client';

import React, { useState } from 'react';

interface FaviconProps {
    url: string;
    size?: number;
    className?: string;
    fallbackIcon?: React.ReactNode;
}

export function Favicon({
    url,
    size = 32,
    className = '',
    fallbackIcon
}: FaviconProps) {
    const [error, setError] = useState(false);

    const getFaviconUrl = (websiteUrl: string) => {
        try {
            const urlObj = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
            return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=${size}`;
        } catch {
            return null;
        }
    };

    const faviconUrl = getFaviconUrl(url);

    if (error || !faviconUrl) {
        return fallbackIcon ? <>{fallbackIcon}</> : null;
    }

    return (
        <img
            src={faviconUrl}
            alt=""
            className={`rounded-sm ${className}`}
            style={{ width: size / 2, height: size / 2 }}
            onError={() => setError(true)}
        />
    );
}
