'use client';

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface NavigationRoute {
  path: string;
  name: string;
  icon?: string | React.ComponentType<any>;
  requiresAuth?: boolean;
  adminOnly?: boolean;
  description?: string;
}

export const APP_ROUTES: NavigationRoute[] = [
  {
    path: '/',
    name: 'Home',
    description: 'Landing page and app overview'
  },
  {
    path: '/search',
    name: 'Search',
    icon: MagnifyingGlassIcon,
    requiresAuth: true,
    description: 'Search fashion trends and content'
  },
  {
    path: '/wardrobe',
    name: 'Wardrobe',
    requiresAuth: true,
    description: 'Manage your digital wardrobe'
  },
  {
    path: '/marketplace',
    name: 'Marketplace',
    requiresAuth: true,
    description: 'Buy and sell fashion items'
  },
  {
    path: '/social',
    name: 'Social',
    requiresAuth: true,
    description: 'Connect with the fashion community'
  },
  {
    path: '/profile',
    name: 'Profile',
    requiresAuth: true,
    description: 'Manage your profile and settings'
  },
  {
    path: '/analytics',
    name: 'Analytics',
    requiresAuth: true,
    description: 'View fashion analytics and insights'
  },
  {
    path: '/advertising',
    name: 'Advertising',
    requiresAuth: true,
    description: 'Manage advertising campaigns'
  },

  {
    path: '/admin/configuration',
    name: 'Configuration',
    requiresAuth: true,
    adminOnly: true,
    description: 'Manage system configuration and VUFS standards'
  },
  {
    path: '/admin/sku-codes',
    name: 'SKU Codes',
    requiresAuth: true,
    adminOnly: true,
    description: 'Generate and manage SKU codes'
  },
  {
    path: '/login',
    name: 'Login',
    description: 'Sign in to your account'
  },
  {
    path: '/register',
    name: 'Register',
    description: 'Create a new account'
  }
];

export interface NavigationState {
  currentPath: string;
  previousPath: string | null;
  navigationHistory: string[];
  isNavigating: boolean;
}

export class NavigationService {
  private static instance: NavigationService;
  private state: NavigationState = {
    currentPath: '/',
    previousPath: null,
    navigationHistory: [],
    isNavigating: false
  };
  private listeners: ((state: NavigationState) => void)[] = [];
  private router: AppRouterInstance | null = null;

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  setRouter(router: AppRouterInstance) {
    this.router = router;
    console.log('🔧 Navigation: Router set', { router: !!router });
  }

  subscribe(listener: (state: NavigationState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  updateCurrentPath(path: string) {
    const previousPath = this.state.currentPath;
    this.state = {
      ...this.state,
      previousPath,
      currentPath: path,
      navigationHistory: [...this.state.navigationHistory, path].slice(-10) // Keep last 10 paths
    };
    this.notifyListeners();
    console.log('🔧 Navigation: Path updated', { from: previousPath, to: path });
  }

  async navigate(path: string, options: { replace?: boolean; scroll?: boolean } = {}): Promise<boolean> {
    try {
      this.state.isNavigating = true;
      this.notifyListeners();

      console.log('🔧 Navigation: Attempting to navigate', { path, options, router: !!this.router });

      // Validate route exists
      const route = this.getRouteByPath(path);
      if (!route) {
        console.warn('🔧 Navigation: Route not found', { path });
        // Still attempt navigation for dynamic routes
      }

      // Method 1: Use Next.js router if available
      if (this.router) {
        if (options.replace) {
          this.router.replace(path, { scroll: options.scroll });
        } else {
          this.router.push(path, { scroll: options.scroll });
        }
        console.log('✅ Navigation: Router navigation successful', { path });
        return true;
      }

      // Method 2: Fallback to window.location
      if (typeof window !== 'undefined') {
        if (options.replace) {
          window.location.replace(path);
        } else {
          window.location.href = path;
        }
        console.log('✅ Navigation: Window navigation successful', { path });
        return true;
      }

      console.error('❌ Navigation: No navigation method available');
      return false;

    } catch (error) {
      console.error('❌ Navigation: Navigation failed', { path, error });
      return false;
    } finally {
      this.state.isNavigating = false;
      this.notifyListeners();
    }
  }

  async goBack(): Promise<boolean> {
    try {
      if (this.state.previousPath) {
        return this.navigate(this.state.previousPath);
      }

      // Fallback to browser back
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
        return true;
      }

      // Fallback to home
      return this.navigate('/');
    } catch (error) {
      console.error('❌ Navigation: Go back failed', { error });
      return false;
    }
  }

  refresh(): void {
    try {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Navigation: Refresh failed', { error });
    }
  }

  getRouteByPath(path: string): NavigationRoute | undefined {
    return APP_ROUTES.find(route => route.path === path);
  }

  getAllRoutes(): NavigationRoute[] {
    return APP_ROUTES;
  }

  getPublicRoutes(): NavigationRoute[] {
    return APP_ROUTES.filter(route => !route.requiresAuth);
  }

  getAuthenticatedRoutes(): NavigationRoute[] {
    return APP_ROUTES.filter(route => route.requiresAuth && !route.adminOnly);
  }

  getAdminRoutes(): NavigationRoute[] {
    return APP_ROUTES.filter(route => route.adminOnly);
  }

  getCurrentState(): NavigationState {
    return { ...this.state };
  }

  canNavigateToRoute(path: string, isAuthenticated: boolean, isAdmin: boolean = false): boolean {
    const route = this.getRouteByPath(path);
    if (!route) return true; // Allow navigation to unknown routes (dynamic routes)

    if (route.adminOnly && !isAdmin) return false;
    if (route.requiresAuth && !isAuthenticated) return false;

    return true;
  }

  // Deep linking support
  async handleDeepLink(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search + urlObj.hash;
      return this.navigate(path);
    } catch (error) {
      console.error('❌ Navigation: Deep link handling failed', { url, error });
      return false;
    }
  }

  // Browser navigation event handling
  setupBrowserNavigation(): () => void {
    if (typeof window === 'undefined') return () => { };

    // Handle browser back/forward buttons
    const handlePopState = (event: PopStateEvent) => {
      const path = window.location.pathname;
      this.updateCurrentPath(path);
      console.log('🔧 Navigation: Browser navigation detected', { path, state: event.state });
    };

    window.addEventListener('popstate', handlePopState);

    // Handle initial page load
    this.updateCurrentPath(window.location.pathname);

    // Cleanup function
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }

  // Debug utilities
  debugNavigation(): void {
    console.log('🔧 Navigation Debug Info:', {
      state: this.state,
      router: !!this.router,
      listeners: this.listeners.length,
      routes: APP_ROUTES.length,
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A'
    });
  }
}

// Export singleton instance
export const navigationService = NavigationService.getInstance();

// React hook for using navigation service
export function useNavigationService() {
  return navigationService;
}