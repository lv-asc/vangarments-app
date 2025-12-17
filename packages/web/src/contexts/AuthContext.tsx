'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiClient, ApiError, handleApiError, isAuthError } from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  avatar?: string;
  username?: string;
  personalInfo?: {
    birthDate: Date;
    location?: any;
    gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
    avatarUrl?: string;
  };
  measurements?: any;
  preferences?: any;
  badges?: Array<{
    name: string;
    type: string;
    description: string;
    imageUrl?: string;
  }>;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
  privacySettings?: {
    height: boolean;
    weight: boolean;
    birthDate: boolean;
    country?: boolean;
    state?: boolean;
    city?: boolean;
  };
  roles?: string[];
  createdAt: Date;
  updatedAt: Date;
  linkedEntities?: {
    hasBrand: boolean;
    hasStore: boolean;
    hasSupplier: boolean;
    hasPage: boolean;
    hasPost: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  cpf: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  username?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Initialize auth state
  const initAuth = useCallback(async () => {
    try {
      if (apiClient.isAuthenticated) {
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Don't show error toast on init, just clear auth state
      if (isAuthError(error)) {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    // Listen for auth events
    const handleAuthExpired = () => {
      setUser(null);
      toast.error('Sua sessão expirou. Faça login novamente.');
      router.push('/login');
    };

    window.addEventListener('auth:token-expired', handleAuthExpired);

    // Periodic activity update (every 2 minutes)
    const activityInterval = setInterval(() => {
      if (apiClient.isAuthenticated) {
        apiClient.updateActivity().catch(() => {
          // Silent failure for activity updates
        });
      }
    }, 2 * 60 * 1000);

    return () => {
      window.removeEventListener('auth:token-expired', handleAuthExpired);
      clearInterval(activityInterval);
    };
  }, [initAuth, router]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const { user: userData, token } = await apiClient.login(email, password);

      setUser(userData);
      toast.success('Login realizado com sucesso!');
      router.push('/wardrobe');
    } catch (error) {
      const message = handleApiError(error);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);

      // Validate CPF before sending
      if (userData.cpf && !ApiClient.validateCPF(userData.cpf)) {
        throw new Error('CPF inválido');
      }

      const { user: newUser, token } = await apiClient.register(userData);

      setUser(newUser);
      toast.success('Conta criada com sucesso! Bem-vinda ao Vangarments!');
      router.push('/wardrobe');
    } catch (error) {
      const message = handleApiError(error);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
      setUser(null);
      toast.success('Logout realizado com sucesso!');
      router.push('/');
    } catch (error) {
      // Always clear user state even if logout request fails
      setUser(null);
      console.error('Logout error:', error);
      router.push('/');
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      const updatedUser = await apiClient.updateProfile(profileData);
      setUser(updatedUser);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      const message = handleApiError(error);
      toast.error(message);
      throw error;
    }
  };

  const refreshAuth = useCallback(async () => {
    await initAuth();
  }, [initAuth]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}