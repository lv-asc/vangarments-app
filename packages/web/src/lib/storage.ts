// Local storage utilities for persistent data
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
  purchaseDate?: string;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceItem {
  id: string;
  wardrobeItemId: string;
  sellerId: string;
  price: number;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  images: string[];
  size: string;
  brand: string;
  category: string;
  isActive: boolean;
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
  bannerImage?: string;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    height?: number;
    weight?: number;
    shoeSize?: string;
  };
  preferences?: {
    style: string[];
    brands: string[];
    colors: string[];
    priceRange: { min: number; max: number };
  };
  stats: {
    wardrobeItems: number;
    followers: number;
    following: number;
  };
  createdAt: string;
  updatedAt: string;
}

class LocalStorage {
  private getKey(key: string): string {
    return `vangarments_${key}`;
  }

  // Generic storage methods
  set<T>(key: string, data: T): void {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  // User profile methods
  saveUserProfile(profile: UserProfile): void {
    this.set('user_profile', profile);
  }

  getUserProfile(): UserProfile | null {
    return this.get<UserProfile>('user_profile');
  }

  // Wardrobe methods
  saveWardrobeItems(items: WardrobeItem[]): void {
    this.set('wardrobe_items', items);
  }

  getWardrobeItems(): WardrobeItem[] {
    return this.get<WardrobeItem[]>('wardrobe_items') || [];
  }

  addWardrobeItem(item: WardrobeItem): void {
    const items = this.getWardrobeItems();
    items.push(item);
    this.saveWardrobeItems(items);
  }

  updateWardrobeItem(id: string, updates: Partial<WardrobeItem>): void {
    const items = this.getWardrobeItems();
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveWardrobeItems(items);
    }
  }

  deleteWardrobeItem(id: string): void {
    const items = this.getWardrobeItems().filter(item => item.id !== id);
    this.saveWardrobeItems(items);
  }

  // Marketplace methods
  saveMarketplaceItems(items: MarketplaceItem[]): void {
    this.set('marketplace_items', items);
  }

  getMarketplaceItems(): MarketplaceItem[] {
    return this.get<MarketplaceItem[]>('marketplace_items') || [];
  }

  addMarketplaceItem(item: MarketplaceItem): void {
    const items = this.getMarketplaceItems();
    items.push(item);
    this.saveMarketplaceItems(items);
  }

  updateMarketplaceItem(id: string, updates: Partial<MarketplaceItem>): void {
    const items = this.getMarketplaceItems();
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveMarketplaceItems(items);
    }
  }

  deleteMarketplaceItem(id: string): void {
    const items = this.getMarketplaceItems().filter(item => item.id !== id);
    this.saveMarketplaceItems(items);
  }

  // Initialize with mock data if empty
  initializeWithMockData(): void {
    if (!this.getUserProfile()) {
      this.initializeMockProfile();
    }
    if (this.getWardrobeItems().length === 0) {
      this.initializeMockWardrobe();
    }
    if (this.getMarketplaceItems().length === 0) {
      this.initializeMockMarketplace();
    }
  }

  private initializeMockProfile(): void {
    const mockProfile: UserProfile = {
      id: 'user_1',
      name: 'LV',
      username: 'lv_fashion',
      email: 'lv@vangarments.com',
      bio: 'Fashion enthusiast and style creator. Always exploring new trends and combinations. Green cap lover 🧢',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      bannerImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
      measurements: {
        chest: 36,
        waist: 28,
        hips: 38,
        height: 165,
        weight: 60,
        shoeSize: '8'
      },
      preferences: {
        style: ['casual', 'chic', 'minimalist'],
        brands: ['Zara', 'H&M', 'Uniqlo'],
        colors: ['black', 'white', 'navy', 'beige'],
        priceRange: { min: 20, max: 200 }
      },
      stats: {
        wardrobeItems: 0,
        followers: 127,
        following: 89
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.saveUserProfile(mockProfile);
  }

  private initializeMockWardrobe(): void {
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
        purchaseDate: '2024-01-15',
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
        purchaseDate: '2024-02-20',
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
        purchaseDate: '2023-11-10',
        condition: 'excellent',
        tags: ['elegant', 'winter', 'investment'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'item_4',
        name: 'Black Leather Ankle Boots',
        category: 'Shoes',
        subcategory: 'Boots',
        brand: 'Dr. Martens',
        color: 'Black',
        size: '8',
        image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=600&fit=crop',
        description: 'Durable black leather ankle boots with classic styling',
        price: 150,
        purchaseDate: '2024-03-05',
        condition: 'new',
        tags: ['edgy', 'durable', 'versatile'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'item_5',
        name: 'Silk Floral Midi Dress',
        category: 'Dresses',
        subcategory: 'Midi Dresses',
        brand: '& Other Stories',
        color: 'Floral Print',
        size: 'S',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop',
        description: 'Beautiful silk midi dress with delicate floral print',
        price: 120,
        purchaseDate: '2024-04-12',
        condition: 'excellent',
        tags: ['feminine', 'special occasion', 'silk'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    this.saveWardrobeItems(mockItems);
  }

  private initializeMockMarketplace(): void {
    const mockMarketplaceItems: MarketplaceItem[] = [
      {
        id: 'market_1',
        wardrobeItemId: 'external_1',
        sellerId: 'seller_1',
        price: 45,
        condition: 'good',
        description: 'Barely worn vintage denim jacket in excellent condition. Perfect for layering!',
        images: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop'],
        size: 'M',
        brand: 'Vintage',
        category: 'Outerwear',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'market_2',
        wardrobeItemId: 'external_2',
        sellerId: 'seller_2',
        price: 25,
        condition: 'excellent',
        description: 'Cozy knit sweater in beautiful cream color. Super soft and warm.',
        images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=600&fit=crop'],
        size: 'L',
        brand: 'Zara',
        category: 'Tops',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'market_3',
        wardrobeItemId: 'external_3',
        sellerId: 'seller_3',
        price: 80,
        condition: 'new',
        description: 'Brand new designer sneakers, never worn. Still in original box.',
        images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop'],
        size: '8',
        brand: 'Nike',
        category: 'Shoes',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    this.saveMarketplaceItems(mockMarketplaceItems);
  }
}

export const storage = new LocalStorage();