'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage, WardrobeItem, MarketplaceItem, UserProfile } from '@/lib/storage';

interface DataContextType {
  // User Profile
  userProfile: UserProfile | null;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  
  // Wardrobe
  wardrobeItems: WardrobeItem[];
  addWardrobeItem: (item: Omit<WardrobeItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWardrobeItem: (id: string, updates: Partial<WardrobeItem>) => void;
  deleteWardrobeItem: (id: string) => void;
  
  // Marketplace
  marketplaceItems: MarketplaceItem[];
  addMarketplaceItem: (item: Omit<MarketplaceItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMarketplaceItem: (id: string, updates: Partial<MarketplaceItem>) => void;
  deleteMarketplaceItem: (id: string) => void;
  
  // Loading state
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = () => {
      try {
        // Initialize mock data if needed
        storage.initializeWithMockData();
        
        // Load data from storage
        const profile = storage.getUserProfile();
        const wardrobe = storage.getWardrobeItems();
        const marketplace = storage.getMarketplaceItems();
        
        setUserProfile(profile);
        setWardrobeItems(wardrobe);
        setMarketplaceItems(marketplace);
        
        // Update profile stats
        if (profile) {
          const updatedProfile = {
            ...profile,
            stats: {
              ...profile.stats,
              wardrobeItems: wardrobe.length
            }
          };
          setUserProfile(updatedProfile);
          storage.saveUserProfile(updatedProfile);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // User Profile methods
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    
    const updatedProfile = {
      ...userProfile,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    setUserProfile(updatedProfile);
    storage.saveUserProfile(updatedProfile);
  };

  // Wardrobe methods
  const addWardrobeItem = (itemData: Omit<WardrobeItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: WardrobeItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedItems = [...wardrobeItems, newItem];
    setWardrobeItems(updatedItems);
    storage.saveWardrobeItems(updatedItems);
    
    // Update profile stats
    if (userProfile) {
      updateUserProfile({
        stats: {
          ...userProfile.stats,
          wardrobeItems: updatedItems.length
        }
      });
    }
  };

  const updateWardrobeItem = (id: string, updates: Partial<WardrobeItem>) => {
    const updatedItems = wardrobeItems.map(item =>
      item.id === id
        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
        : item
    );
    
    setWardrobeItems(updatedItems);
    storage.saveWardrobeItems(updatedItems);
  };

  const deleteWardrobeItem = (id: string) => {
    const updatedItems = wardrobeItems.filter(item => item.id !== id);
    setWardrobeItems(updatedItems);
    storage.saveWardrobeItems(updatedItems);
    
    // Update profile stats
    if (userProfile) {
      updateUserProfile({
        stats: {
          ...userProfile.stats,
          wardrobeItems: updatedItems.length
        }
      });
    }
  };

  // Marketplace methods
  const addMarketplaceItem = (itemData: Omit<MarketplaceItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: MarketplaceItem = {
      ...itemData,
      id: `market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedItems = [...marketplaceItems, newItem];
    setMarketplaceItems(updatedItems);
    storage.saveMarketplaceItems(updatedItems);
  };

  const updateMarketplaceItem = (id: string, updates: Partial<MarketplaceItem>) => {
    const updatedItems = marketplaceItems.map(item =>
      item.id === id
        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
        : item
    );
    
    setMarketplaceItems(updatedItems);
    storage.saveMarketplaceItems(updatedItems);
  };

  const deleteMarketplaceItem = (id: string) => {
    const updatedItems = marketplaceItems.filter(item => item.id !== id);
    setMarketplaceItems(updatedItems);
    storage.saveMarketplaceItems(updatedItems);
  };

  const value: DataContextType = {
    userProfile,
    updateUserProfile,
    wardrobeItems,
    addWardrobeItem,
    updateWardrobeItem,
    deleteWardrobeItem,
    marketplaceItems,
    addMarketplaceItem,
    updateMarketplaceItem,
    deleteMarketplaceItem,
    isLoading
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}