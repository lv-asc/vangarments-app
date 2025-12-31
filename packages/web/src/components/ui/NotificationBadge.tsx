interface NotificationBadgeProps {
    count: number;
    show?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function NotificationBadge({ count, show = true, size = 'md', className = '' }: NotificationBadgeProps) {
    // Don't show badge if count is 0 or show is false
    if (!show || count === 0) {
        return null;
    }

    // Limit display to 99+
    const displayCount = count > 99 ? '99+' : count.toString();

    const sizeClasses = {
        sm: 'h-4 w-4 text-[9px] min-w-[16px]',
        md: 'h-5 w-5 text-[10px] min-w-[20px]',
        lg: 'h-6 w-6 text-xs min-w-[24px]'
    };

    return (
        <span
            className={`
                absolute -top-1 -right-1
                flex items-center justify-center
                ${sizeClasses[size]}
                bg-red-500 text-white
                rounded-full font-bold
                ring-2 ring-white
                ${className}
            `}
        >
            {displayCount}
        </span>
    );
}
