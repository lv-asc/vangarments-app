import React, { useEffect, useRef, useState } from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'shop-color-picker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { value?: string; };
        }
    }
}

interface ShopColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    className?: string; // Allow passing existing classes
}

export default function ShopColorPicker({ color, onChange, className }: ShopColorPickerProps) {
    const pickerRef = useRef<HTMLElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Dynamically import the custom element to ensure it runs only on client
        // @ts-ignore
        import('shop-color-picker')
            .then(() => setIsLoaded(true))
            .catch(err => console.error('Failed to load shop-color-picker', err));
    }, []);

    useEffect(() => {
        const picker = pickerRef.current;
        if (!picker || !isLoaded) return;

        const handleChange = (e: Event) => {
            // The event detail or target value should contain the color
            // Verifying the exact event structure is tricky without docs, 
            // but usually it's e.target.value for these types of inputs
            const target = e.target as any;
            if (target && target.value) {
                onChange(target.value);
            }
        };

        // Listen for both input (dragging) and change (final)
        picker.addEventListener('change', handleChange);
        picker.addEventListener('input', handleChange);

        return () => {
            picker.removeEventListener('change', handleChange);
            picker.removeEventListener('input', handleChange);
        };
    }, [isLoaded, onChange]);

    if (!isLoaded) return <div className="h-64 w-64 bg-gray-100 animate-pulse rounded"></div>;

    return (
        <div className={className}>
            <shop-color-picker ref={pickerRef} value={color} />
        </div>
    );
}
