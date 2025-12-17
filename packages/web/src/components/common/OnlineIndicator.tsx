import React from 'react';

interface OnlineIndicatorProps {
    lastSeen?: string | Date;
    isOnline?: boolean;
    className?: string;
    showStatusText?: boolean;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
    lastSeen,
    isOnline: explicitIsOnline,
    className = '',
    showStatusText = false
}) => {
    // Determine if online based on lastSeen or explicit status
    // Consider online if lastSeen is within 5 minutes
    const isOnline = explicitIsOnline ?? (lastSeen ? (new Date().getTime() - new Date(lastSeen).getTime() < 5 * 60 * 1000) : false);

    if (!isOnline && !showStatusText) return null;

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {isOnline && (
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" title="Online" />
            )}
            {showStatusText && (
                <span className="text-xs text-gray-500">
                    {isOnline ? 'Online' : lastSeen ? `Last seen ${formatLastSeen(new Date(lastSeen))}` : 'Offline'}
                </span>
            )}
        </div>
    );
};

function formatLastSeen(date: Date): string {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
}
