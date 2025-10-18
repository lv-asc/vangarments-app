'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface MockUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  cpf: string;
  personalInfo?: {
    birthDate: Date;
    location?: any;
    gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
    phone?: string;
  };
  measurements?: any;
  preferences?: any;
  badges?: Array<{
    name: string;
    type: string;
    description: string;
    imageUrl?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  // Developer-specific properties
  isDeveloper?: boolean;
  hasFullAccess?: boolean;
  canAccessDevTools?: boolean;
}

interface MockAuthContextType {
  user: MockUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<MockUser>) => Promise<void>;
  refreshAuth: () => Promise<void>;
  setMockUser: (user: MockUser | null) => void;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

// Master Developer Account - Exclusive Access
const mockUsers: Record<string, MockUser> = {
  'lvicentini10@gmail.com': {
    id: 'dev-master-lve',
    name: 'Leandro Martins Vicentini',
    email: 'lvicentini10@gmail.com',
    username: 'lv',
    cpf: '512.441.188-00',
    personalInfo: {
      birthDate: new Date('1990-01-01'), // Placeholder - update as needed
      location: { 
        street: 'Rua João Previtalle, 2780',
        complement: 'Alameda Dominíca, Casa 318',
        city: 'Valinhos', 
        state: 'SP', 
        zipCode: '13272-400',
        country: 'Brazil' 
      },
      gender: 'male',
      phone: '+55 (11) 94441-0566',
    },
    measurements: {
      height: 175, // Placeholder
      weight: 75,  // Placeholder
      sizes: {
        BR: { top: 'M', bottom: '40', shoes: '41' },
        US: { top: 'M', bottom: '32', shoes: '9' },
      },
    },
    preferences: {
      favoriteColors: ['black', 'white', 'navy', 'gray'],
      preferredBrands: ['Nike', 'Adidas', 'Zara', 'H&M'],
      styleProfile: ['minimalist', 'casual', 'tech'],
      priceRange: { min: 100, max: 1000 },
    },
    badges: [
      { name: 'Master Developer', type: 'dev_master', description: 'Full development access and control' },
      { name: 'App Creator', type: 'creator', description: 'Vangarments platform creator' },
      { name: 'Beta Pioneer', type: 'beta_pioneer', description: 'Early beta program participant' },
      { name: 'Admin Access', type: 'admin', description: 'Administrative privileges' },
    ],
    avatar: '/api/placeholder/120/120',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
    // Special developer properties
    isDeveloper: true,
    hasFullAccess: true,
    canAccessDevTools: true,
  },
};

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!user;

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser = mockUsers[email];
    
    // Validate credentials for master developer account
    if (email === 'lvicentini10@gmail.com') {
      if (password !== 'V-App_M4sterAccess.23') {
        setIsLoading(false);
        throw new Error('Invalid password for developer account');
      }
    }
    
    if (mockUser) {
      setUser(mockUser);
      // Store in localStorage for persistence
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      localStorage.setItem('token', 'mock-jwt-token-' + mockUser.id);
      
      // Enable dev mode automatically for developer account
      if (mockUser.isDeveloper) {
        localStorage.setItem('devMode', 'true');
        window.dispatchEvent(new CustomEvent('devModeChange', { 
          detail: { enabled: true } 
        }));
      }
    } else {
      throw new Error('Invalid credentials');
    }
    
    setIsLoading(false);
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newUser: MockUser = {
      id: 'user-new-' + Date.now(),
      name: userData.name,
      email: userData.email,
      cpf: userData.cpf,
      personalInfo: {
        birthDate: userData.birthDate ? new Date(userData.birthDate) : new Date(),
        gender: userData.gender || 'prefer-not-to-say',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setUser(newUser);
    localStorage.setItem('mockUser', JSON.stringify(newUser));
    localStorage.setItem('token', 'mock-jwt-token-' + newUser.id);
    
    setIsLoading(false);
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('mockUser');
    localStorage.removeItem('token');
  };

  const updateProfile = async (profileData: Partial<MockUser>) => {
    if (!user) return;
    
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const updatedUser = { ...user, ...profileData, updatedAt: new Date() };
    setUser(updatedUser);
    localStorage.setItem('mockUser', JSON.stringify(updatedUser));
    
    setIsLoading(false);
  };

  const refreshAuth = useCallback(async () => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Convert date strings back to Date objects
        if (parsedUser.personalInfo?.birthDate) {
          parsedUser.personalInfo.birthDate = new Date(parsedUser.personalInfo.birthDate);
        }
        if (parsedUser.createdAt) {
          parsedUser.createdAt = new Date(parsedUser.createdAt);
        }
        if (parsedUser.updatedAt) {
          parsedUser.updatedAt = new Date(parsedUser.updatedAt);
        }
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('mockUser');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const setMockUser = (mockUser: MockUser | null) => {
    setUser(mockUser);
    if (mockUser) {
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      localStorage.setItem('token', 'mock-jwt-token-' + mockUser.id);
    } else {
      localStorage.removeItem('mockUser');
      localStorage.removeItem('token');
    }
  };

  // Initialize auth state from localStorage
  React.useEffect(() => {
    refreshAuth();
    
    // Auto-login in development mode if no user is logged in
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        if (!user) {
          console.log('🔧 DEV: Auto-logging in master developer');
          setUser(mockUsers['lvicentini10@gmail.com']);
          localStorage.setItem('mockUser', JSON.stringify(mockUsers['lvicentini10@gmail.com']));
          localStorage.setItem('token', 'mock-jwt-token-dev-master-lve');
        }
      }, 1000);
    }
  }, [refreshAuth, user]);

  const value: MockAuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshAuth,
    setMockUser,
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
}

// Export mock users for easy access
export { mockUsers };