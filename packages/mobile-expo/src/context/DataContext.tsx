import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand?: string;
  color: string;
  size: string;
  image: string;
  description?: string;
  price?: number;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  profileImage?: string;
  stats: {
    wardrobeItems: number;
    followers: number;
    following: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface DataContextType {
  userProfile: UserProfile | null;
  wardrobeItems: WardrobeItem[];
  addWardrobeItem: (item: Omit<WardrobeItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Load existing data
      const profileData = await AsyncStorage.getItem('userProfile');
      const wardrobeData = await AsyncStorage.getItem('wardrobeItems');

      if (profileData) {
        setUserProfile(JSON.parse(profileData));
      } else {
        // Initialize with mock profile
        const mockProfile: UserProfile = {
          id: 'user_1',
          name: 'Fashion Enthusiast',
          username: 'fashionista',
          email: 'user@vangarments.com',
          bio: 'Passionate about sustainable fashion and unique styles!',
          profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
          stats: {
            wardrobeItems: 0,
            followers: 127,
            following: 89
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setUserProfile(mockProfile);
        await AsyncStorage.setItem('userProfile', JSON.stringify(mockProfile));
      }

      if (wardrobeData) {
        setWardrobeItems(JSON.parse(wardrobeData));
      } else {
        // Initialize with mock wardrobe items
        const mockItems: WardrobeItem[] = [
          {
            id: 'item_1',
            name: 'Classic White Button-Down Shirt',
            category: 'Tops',
            subcategory: 'Shirts',
            brand: 'Everlane',
            color: 'White',
            size: 'M',
            image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=600&fit=crop',
            description: 'Timeless white button-down shirt perfect for any occasion',
            price: 68,
            condition: 'excellent',
            tags: ['classic', 'versatile', 'work'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'item_2',
            name: 'High-Waisted Black Jeans',
            category: 'Bottoms',
            subcategory: 'Jeans',
            brand: 'Levi\'s',
            color: 'Black',
            size: '28',
            image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=600&fit=crop',
            description: 'Comfortable high-waisted black jeans with a flattering fit',
            price: 89,
            condition: 'good',
            tags: ['casual', 'everyday', 'comfortable'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'item_3',
            name: 'Camel Wool Coat',
            category: 'Outerwear',
            subcategory: 'Coats',
            brand: 'COS',
            color: 'Camel',
            size: 'S',
            image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=600&fit=crop',
            description: 'Elegant camel wool coat for sophisticated looks',
            price: 245,
            condition: 'excellent',
            tags: ['elegant', 'winter', 'investment'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setWardrobeItems(mockItems);
        await AsyncStorage.setItem('wardrobeItems', JSON.stringify(mockItems));
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addWardrobeItem = async (itemData: Omit<WardrobeItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: WardrobeItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedItems = [...wardrobeItems, newItem];
    setWardrobeItems(updatedItems);
    await AsyncStorage.setItem('wardrobeItems', JSON.stringify(updatedItems));

    // Update profile stats
    if (userProfile) {
      const updatedProfile = {
        ...userProfile,
        stats: {
          ...userProfile.stats,
          wardrobeItems: updatedItems.length
        },
        updatedAt: new Date().toISOString()
      };
      setUserProfile(updatedProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;

    const updatedProfile = {
      ...userProfile,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setUserProfile(updatedProfile);
    await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
  };

  const value: DataContextType = {
    userProfile,
    wardrobeItems,
    addWardrobeItem,
    updateUserProfile,
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