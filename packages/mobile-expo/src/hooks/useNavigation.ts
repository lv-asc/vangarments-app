import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { navigationService, NavigationState, NavigationRoute } from '../navigation/NavigationService';

export interface UseNavigationReturn {
  // Navigation state
  currentRoute: string | null;
  previousRoute: string | null;
  isNavigating: boolean;
  navigationHistory: string[];
  
  // Navigation methods
  navigate: (routeName: string, params?: any) => Promise<boolean>;
  reset: (routeName: string, params?: any) => Promise<boolean>;
  goBack: () => boolean;
  push: (routeName: string, params?: any) => Promise<boolean>;
  pop: (count?: number) => boolean;
  
  // Route information
  currentRouteInfo: NavigationRoute | undefined;
  canNavigateTo: (routeName: string) => boolean;
  
  // Route collections
  allRoutes: NavigationRoute[];
  authenticatedRoutes: NavigationRoute[];
  publicRoutes: NavigationRoute[];
  
  // Utilities
  isCurrentRoute: (routeName: string) => boolean;
  debugNavigation: () => void;
}

export function useNavigation(isAuthenticated: boolean = false, isAdmin: boolean = false): UseNavigationReturn {
  const [navigationState, setNavigationState] = useState<NavigationState>(
    navigationService.getCurrentState()
  );

  // Subscribe to navigation state changes
  useEffect(() => {
    const unsubscribe = navigationService.subscribe(setNavigationState);
    return unsubscribe;
  }, []);

  // Load navigation state on mount
  useEffect(() => {
    navigationService.loadNavigationState();
  }, []);

  // Navigation methods
  const navigate = useCallback(async (routeName: string, params?: any) => {
    console.log('🔧 useNavigation: Navigate called', { routeName, params });
    return await navigationService.navigate(routeName, params);
  }, []);

  const reset = useCallback(async (routeName: string, params?: any) => {
    console.log('🔧 useNavigation: Reset called', { routeName, params });
    return await navigationService.reset(routeName, params);
  }, []);

  const goBack = useCallback(() => {
    console.log('🔧 useNavigation: Go back called');
    return navigationService.goBack();
  }, []);

  const push = useCallback(async (routeName: string, params?: any) => {
    console.log('🔧 useNavigation: Push called', { routeName, params });
    return await navigationService.push(routeName, params);
  }, []);

  const pop = useCallback((count?: number) => {
    console.log('🔧 useNavigation: Pop called', { count });
    return navigationService.pop(count);
  }, []);

  // Route information
  const currentRouteInfo = navigationState.currentRoute 
    ? navigationService.getRouteByName(navigationState.currentRoute)
    : undefined;
  
  const canNavigateTo = useCallback((routeName: string) => {
    return navigationService.canNavigateToRoute(routeName, isAuthenticated, isAdmin);
  }, [isAuthenticated, isAdmin]);

  // Route collections
  const allRoutes = navigationService.getAllRoutes();
  const authenticatedRoutes = navigationService.getAuthenticatedRoutes();
  const publicRoutes = navigationService.getPublicRoutes();

  // Utilities
  const isCurrentRoute = useCallback((routeName: string) => {
    return navigationState.currentRoute === routeName;
  }, [navigationState.currentRoute]);

  const debugNavigation = useCallback(() => {
    navigationService.debugNavigation();
  }, []);

  return {
    // Navigation state
    currentRoute: navigationState.currentRoute,
    previousRoute: navigationState.previousRoute,
    isNavigating: navigationState.isNavigating,
    navigationHistory: navigationState.navigationHistory,
    
    // Navigation methods
    navigate,
    reset,
    goBack,
    push,
    pop,
    
    // Route information
    currentRouteInfo,
    canNavigateTo,
    
    // Route collections
    allRoutes,
    authenticatedRoutes,
    publicRoutes,
    
    // Utilities
    isCurrentRoute,
    debugNavigation
  };
}

// Hook for navigation guards
export function useNavigationGuard(isAuthenticated: boolean = false, isAdmin: boolean = false) {
  const navigation = useNavigation(isAuthenticated, isAdmin);

  const checkRouteAccess = useCallback((routeName: string): { canAccess: boolean; redirectTo?: string; reason?: string } => {
    const route = navigationService.getRouteByName(routeName);
    
    if (!route) {
      return { canAccess: true }; // Allow unknown routes
    }

    // Check admin access
    if (route.adminOnly && !isAdmin) {
      return {
        canAccess: false,
        redirectTo: 'Auth',
        reason: 'Admin access required'
      };
    }

    // Check authentication
    if (route.requiresAuth && !isAuthenticated) {
      return {
        canAccess: false,
        redirectTo: 'Auth',
        reason: 'Authentication required'
      };
    }

    return { canAccess: true };
  }, [isAuthenticated, isAdmin]);

  const guardedNavigate = useCallback(async (routeName: string, params?: any) => {
    const accessCheck = checkRouteAccess(routeName);
    
    if (!accessCheck.canAccess) {
      console.warn('🔧 Mobile Navigation Guard: Access denied', { routeName, reason: accessCheck.reason });
      if (accessCheck.redirectTo) {
        return await navigation.navigate(accessCheck.redirectTo, params);
      }
      return false;
    }

    return await navigation.navigate(routeName, params);
  }, [navigation, checkRouteAccess]);

  return {
    checkRouteAccess,
    guardedNavigate,
    ...navigation
  };
}

// Hook for screen focus tracking
export function useScreenFocus(screenName: string) {
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      navigationService.updateCurrentRoute(screenName);
      
      console.log('🔧 Screen Focus: Screen focused', { screenName });

      return () => {
        setIsFocused(false);
        console.log('🔧 Screen Focus: Screen unfocused', { screenName });
      };
    }, [screenName])
  );

  return isFocused;
}