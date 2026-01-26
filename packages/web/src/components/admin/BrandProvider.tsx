'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { brandApi } from '@/lib/brandApi';
import toast from 'react-hot-toast';

interface BrandContextType {
    brand: any | null;
    loading: boolean;
    error: string | null;
    refreshBrand: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function useBrand() {
    const context = useContext(BrandContext);
    if (!context) {
        throw new Error('useBrand must be used within a BrandProvider');
    }
    return context;
}

interface BrandProviderProps {
    brandId: string;
    children: ReactNode;
}

export function BrandProvider({ brandId, children }: BrandProviderProps) {
    const [brand, setBrand] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadBrand = async () => {
        try {
            setLoading(true);
            setError(null);
            const loadedBrand = await brandApi.getBrand(brandId);
            if (!loadedBrand) {
                setError('Brand not found');
                return;
            }
            setBrand(loadedBrand);
        } catch (err: any) {
            console.error('Failed to load brand', err);
            setError(err.message || 'Failed to load brand details');
            toast.error('Failed to load brand details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (brandId) {
            loadBrand();
        }
    }, [brandId]);

    const refreshBrand = async () => {
        await loadBrand();
    };

    return (
        <BrandContext.Provider value={{ brand, loading, error, refreshBrand }}>
            {children}
        </BrandContext.Provider>
    );
}
