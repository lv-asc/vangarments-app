import React, { useEffect, useRef, useState } from 'react';

interface ShopColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    className?: string;
}

export default function ShopColorPicker({ color, onChange, className }: ShopColorPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Dynamically import the custom element to ensure it runs only on client
        // @ts-ignore
        import('shop-color-picker')
            .then(() => setIsLoaded(true))
            .catch(err => console.error('Failed to load shop-color-picker', err));
    }, []);

    useEffect(() => {
        if (!isLoaded || !containerRef.current) return;

        // Create and append the custom element dynamically
        const picker = document.createElement('shop-color-picker');
        picker.setAttribute('value', color);

        const handleChange = (e: Event) => {
            const target = e.target as any;
            if (target && target.value) {
                onChange(target.value);
            }
        };

        picker.addEventListener('change', handleChange);
        picker.addEventListener('input', handleChange);

        // Clear and append
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(picker);

        return () => {
            picker.removeEventListener('change', handleChange);
            picker.removeEventListener('input', handleChange);
        };
    }, [isLoaded, color, onChange]);

    if (!isLoaded) return <div className="h-64 w-64 bg-gray-100 animate-pulse rounded"></div>;

    return (
        <div ref={containerRef} className={className}></div>
    );
}
