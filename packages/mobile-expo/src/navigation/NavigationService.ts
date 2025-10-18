import { NavigationContainerRef, CommonActions, StackActions } from '@react-navigation/native';
import { createRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NavigationRoute {
  name: string;
  displayName: string;
  icon: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
  params?: any;
}

export const APP_ROUTES: NavigationRoute[] = [
  {
    name: 'Wardrobe',
    displayName: 'Guarda-roupa',
    icon: 'shirt',
    requiresAuth: true
  },
  {
    name: 'Discover',
    displayName: 'Descobrir',
    icon: 'sparkles',
    requiresAuth: true
  },
  {
    name: 'Camera',
    displayName: 'Adicionar',
    icon: 'camera',
    requiresAuth: true
  },
  {
    name: 'Marketplace',
    displayName: 'Marketplace',
    icon: 'storefront',
    requiresAuth: true
  },
  {
    name: 'Profile',
    displayName: 'Perfil',
    icon: 'person-circle',
    requiresAuth: true
  },
  {
    name: 'Auth',
    displayName: 'Autenticação',
    icon: 'log-in',
    requiresAuth: false
  }
];

export interface NavigationState {
  currentRoute: string | null;
  previousRoute: string | null;
  navigationHistory: string[];
  isNavigating: boolean;
}

class NavigationService {
  private static instance: NavigationService;
  public navigationRef = createRef<NavigationContainerRef<any>>();
  
  private state: NavigationState = {
    currentRoute: null,
    previousRoute: null,
    navigationHistory: [],
    isNavigating: false
  };

  private listeners: ((state: NavigationState) => void)[] = [];

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  // Subscribe to navigation state changes
  subscribe(listener: (state: NavigationState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Update current route
  updateCurrentRoute(routeName: string) {
    const previousRoute = this.state.currentRoute;
    this.state = {
      ...this.state,
      previousRoute,
      currentRoute: routeName,
      navigationHistory: [...this.state.navigationHistory, routeName].slice(-10)
    };
    this.notifyListeners();
    console.log('🔧 Mobile Navigation: Route updated', { from: previousRoute, to: routeName });
  }

  // Navigate to a route
  async navigate(routeName: string, params?: any): Promise<boolean> {
    try {
      if (!this.navigationRef.current) {
        console.error('❌ Mobile Navigation: Navigation ref not available');
        return false;
      }

      this.state.isNavigating = true;
      this.notifyListeners();

      console.log('🔧 Mobile Navigation: Navigating', { routeName, params });

      // Check if route exists
      const route = this.getRouteByName(routeName);
      if (!route) {
        console.warn('🔧 Mobile Navigation: Route not found', { routeName });
      }

      this.navigationRef.current.navigate(routeName as never, params as never);
      
      // Save navigation state
      await this.saveNavigationState();
      
      console.log('✅ Mobile Navigation: Navigation successful', { routeName });
      return true;

    } catch (error) {
      console.error('❌ Mobile Navigation: Navigation failed', { routeName, error });
      return false;
    } finally {
      this.state.isNavigating = false;
      this.notifyListeners();
    }
  }

  // Reset navigation stack
  async reset(routeName: string, params?: any): Promise<boolean> {
    try {
      if (!this.navigationRef.current) {
        console.error('❌ Mobile Navigation: Navigation ref not available');
        return false;
      }

      console.log('🔧 Mobile Navigation: Resetting to', { routeName, params });

      this.navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: routeName, params }],
        })
      );

      this.updateCurrentRoute(routeName);
      await this.saveNavigationState();

      console.log('✅ Mobile Navigation: Reset successful', { routeName });
      return true;

    } catch (error) {
      console.error('❌ Mobile Navigation: Reset failed', { routeName, error });
      return false;
    }
  }

  // Go back
  goBack(): boolean {
    try {
      if (!this.navigationRef.current) {
        console.error('❌ Mobile Navigation: Navigation ref not available');
        return false;
      }

      if (this.navigationRef.current.canGoBack()) {
        this.navigationRef.current.goBack();
        console.log('✅ Mobile Navigation: Go back successful');
        return true;
      } else {
        console.log('🔧 Mobile Navigation: Cannot go back, navigating to main');
        return this.navigate('MainTabs');
      }

    } catch (error) {
      console.error('❌ Mobile Navigation: Go back failed', { error });
      return false;
    }
  }

  // Push to stack
  async push(routeName: string, params?: any): Promise<boolean> {
    try {
      if (!this.navigationRef.current) {
        console.error('❌ Mobile Navigation: Navigation ref not available');
        return false;
      }

      console.log('🔧 Mobile Navigation: Pushing', { routeName, params });

      this.navigationRef.current.dispatch(
        StackActions.push(routeName, params)
      );

      await this.saveNavigationState();
      console.log('✅ Mobile Navigation: Push successful', { routeName });
      return true;

    } catch (error) {
      console.error('❌ Mobile Navigation: Push failed', { routeName, error });
      return false;
    }
  }

  // Pop from stack
  pop(count: number = 1): boolean {
    try {
      if (!this.navigationRef.current) {
        console.error('❌ Mobile Navigation: Navigation ref not available');
        return false;
      }

      this.navigationRef.current.dispatch(StackActions.pop(count));
      console.log('✅ Mobile Navigation: Pop successful', { count });
      return true;

    } catch (error) {
      console.error('❌ Mobile Navigation: Pop failed', { count, error });
      return false;
    }
  }

  // Get route by name
  getRouteByName(name: string): NavigationRoute | undefined {
    return APP_ROUTES.find(route => route.name === name);
  }

  // Get all routes
  getAllRoutes(): NavigationRoute[] {
    return APP_ROUTES;
  }

  // Get authenticated routes
  getAuthenticatedRoutes(): NavigationRoute[] {
    return APP_ROUTES.filter(route => route.requiresAuth);
  }

  // Get public routes
  getPublicRoutes(): NavigationRoute[] {
    return APP_ROUTES.filter(route => !route.requiresAuth);
  }

  // Check if user can navigate to route
  canNavigateToRoute(routeName: string, isAuthenticated: boolean, isAdmin: boolean = false): boolean {
    const route = this.getRouteByName(routeName);
    if (!route) return true; // Allow unknown routes

    if (route.adminOnly && !isAdmin) return false;
    if (route.requiresAuth && !isAuthenticated) return false;

    return true;
  }

  // Get current state
  getCurrentState(): NavigationState {
    return { ...this.state };
  }

  // Save navigation state to storage
  private async saveNavigationState(): Promise<void> {
    try {
      await AsyncStorage.setItem('navigationState', JSON.stringify(this.state));
    } catch (error) {
      console.error('❌ Mobile Navigation: Failed to save state', { error });
    }
  }

  // Load navigation state from storage
  async loadNavigationState(): Promise<void> {
    try {
      const savedState = await AsyncStorage.getItem('navigationState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        this.state = { ...this.state, ...parsedState };
        this.notifyListeners();
        console.log('✅ Mobile Navigation: State loaded', this.state);
      }
    } catch (error) {
      console.error('❌ Mobile Navigation: Failed to load state', { error });
    }
  }

  // Handle deep links
  handleDeepLink(url: string): boolean {
    try {
      console.log('🔧 Mobile Navigation: Handling deep link', { url });
      
      // Parse the URL and extract route information
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      
      if (pathSegments.length > 0) {
        const routeName = pathSegments[0];
        const params = Object.fromEntries(urlObj.searchParams);
        
        return this.navigate(routeName, params);
      }
      
      return false;
    } catch (error) {
      console.error('❌ Mobile Navigation: Deep link handling failed', { url, error });
      return false;
    }
  }

  // Debug navigation
  debugNavigation(): void {
    console.log('🔧 Mobile Navigation Debug Info:', {
      state: this.state,
      navigationRef: !!this.navigationRef.current,
      listeners: this.listeners.length,
      routes: APP_ROUTES.length,
      canGoBack: this.navigationRef.current?.canGoBack()
    });
  }

  // Setup navigation state listener
  setupNavigationStateListener(): void {
    if (!this.navigationRef.current) return;

    const unsubscribe = this.navigationRef.current.addListener('state', (e) => {
      const state = e.data.state;
      if (state) {
        const currentRoute = this.getCurrentRouteName(state);
        if (currentRoute && currentRoute !== this.state.currentRoute) {
          this.updateCurrentRoute(currentRoute);
        }
      }
    });

    return unsubscribe;
  }

  // Get current route name from navigation state
  private getCurrentRouteName(state: any): string | null {
    if (!state) return null;

    const route = state.routes[state.index];
    if (route.state) {
      return this.getCurrentRouteName(route.state);
    }

    return route.name;
  }
}

// Export singleton instance
export const navigationService = NavigationService.getInstance();

// Export navigation ref for use in NavigationContainer
export const navigationRef = navigationService.navigationRef;