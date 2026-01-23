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
  googleId?: string;
  facebookId?: string;
  googleData?: {
    email: string;
    name: string;
    picture: string;
    gender?: string;
    birthday?: any;
    phone?: string;
  };
  facebookData?: {
    email: string;
    name: string;
    picture: string;
    gender?: string;
    birthday?: string;
  };
  googleSigninEnabled?: boolean;
  facebookSigninEnabled?: boolean;
  appleId?: string;
  appleData?: {
    email: string;
    name: string;
  };
  appleSigninEnabled?: boolean;
  linkedEntities?: {
    brands: Array<{ id: string; name: string; slug?: string; logo?: string }>;
    stores: Array<{ id: string; name: string; slug?: string; logo?: string }>;
    suppliers: Array<{ id: string; name: string; slug?: string }>;
    pages: Array<{ id: string; name: string; slug?: string; logo?: string }>;
    hasPost: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
  signUpWithGoogle: () => void;
  loginWithFacebook: () => void;
  signUpWithFacebook: () => void;
  loginWithApple: () => void;
  signUpWithApple: () => void;
  disconnectOAuth: (provider: 'google' | 'facebook' | 'apple') => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  refreshAuth: () => Promise<void>;
  activeRole: string | null;
  setActiveRole: (role: string) => void;
  activeAccount: ActiveAccount | null;
  setActiveAccount: (account: ActiveAccount | null) => void;
  isSwitchAccountModalOpen: boolean;
  setIsSwitchAccountModalOpen: (isOpen: boolean) => void;
}

export interface ActiveAccount {
  type: 'user' | 'brand' | 'store' | 'supplier' | 'non_profit' | 'page';
  id: string;
  name: string;
  username?: string;
  slug?: string;
  avatar?: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  cpf: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  genderOther?: string;
  bodyType?: 'male' | 'female';
  username?: string;
  telephone: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState<string | null>(null);
  const [activeAccount, setActiveAccountState] = useState<ActiveAccount | null>(null);
  const [isSwitchAccountModalOpen, setIsSwitchAccountModalOpen] = useState(false);
  const router = useRouter();

  const setActiveRole = (role: string) => {
    setActiveRoleState(role);
    localStorage.setItem('activeRole', role);
  };

  const setActiveAccount = (account: ActiveAccount | null) => {
    setActiveAccountState(account);
    if (account) {
      localStorage.setItem('activeAccount', JSON.stringify(account));
    } else {
      localStorage.removeItem('activeAccount');
    }
  };

  useEffect(() => {
    const storedRole = localStorage.getItem('activeRole');
    if (storedRole) {
      setActiveRoleState(storedRole);
    }
    // Restore active account from localStorage
    const storedAccount = localStorage.getItem('activeAccount');
    if (storedAccount) {
      try {
        setActiveAccountState(JSON.parse(storedAccount));
      } catch {
        localStorage.removeItem('activeAccount');
      }
    }
  }, []);

  const isAuthenticated = !!user;

  // Initialize auth state
  const initAuth = useCallback(async () => {
    try {
      // Check for token in URL (from OAuth redirect)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        if (tokenFromUrl) {
          apiClient.saveToken(tokenFromUrl);
          // Remove token from URL to keep it clean
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      }

      if (apiClient.isAuthenticated) {
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
        setToken(apiClient.getToken());
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Don't show error toast on init, just clear auth state
      if (isAuthError(error)) {
        setUser(null);
        setToken(null);
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
      setToken(null);
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

      const { user: userData, token: userToken } = await apiClient.login(email, password);

      setUser(userData);
      setToken(userToken);
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

      if (newUser.emailVerified === false) {
        toast.success('Cadastro realizado! Verifique seu email para ativar a conta.');
        return;
      }

      setUser(newUser);
      setToken(apiClient.getToken());
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
      setToken(null);
      toast.success('Logout realizado com sucesso!');
      router.push('/');
    } catch (error) {
      // Always clear user state even if logout request fails
      setUser(null);
      setToken(null);
      console.error('Logout error:', error);
      router.push('/');
    }
  };

  const loginWithGoogle = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    window.location.href = `${apiUrl}/oauth/google/login`;
  };

  const signUpWithGoogle = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    window.location.href = `${apiUrl}/oauth/google/signup`;
  };

  const loginWithFacebook = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    window.location.href = `${apiUrl}/oauth/facebook/login`;
  };

  const signUpWithFacebook = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    window.location.href = `${apiUrl}/oauth/facebook/signup`;
  };

  const loginWithApple = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    window.location.href = `${apiUrl}/oauth/apple/login`;
  };

  const signUpWithApple = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    window.location.href = `${apiUrl}/oauth/apple/signup`;
  };

  const disconnectOAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      setIsLoading(true);
      await apiClient.disconnectOAuth(provider);
      await refreshAuth();
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account disconnected.`);
    } catch (error) {
      const message = handleApiError(error);
      toast.error(message);
    } finally {
      setIsLoading(false);
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
    token,
    login,
    register,
    logout,
    loginWithGoogle,
    signUpWithGoogle,
    loginWithFacebook,
    signUpWithFacebook,
    loginWithApple,
    signUpWithApple,
    disconnectOAuth,
    updateProfile,
    refreshAuth,
    activeRole,
    setActiveRole,
    activeAccount,
    setActiveAccount,
    isSwitchAccountModalOpen,
    setIsSwitchAccountModalOpen,
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