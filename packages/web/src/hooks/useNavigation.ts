'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { navigationService, NavigationState, NavigationRoute } from '@/lib/navigation';
import { useAuth } from '@/contexts/AuthWrapper';

export interface UseNavigationReturn {
  // Navigation state
  currentPath: string;
  previousPath: string | null;
  isNavigating: boolean;
  navigationHistory: string[];
  
  // Navigation methods
  navigate: (path: string, options?: { replace?: boolean; scroll?: boolean }) => Promise<boolean>;
  goBack: () => boolean;
  refresh: () => void;
  
  // Route information
  currentRoute: NavigationRoute | undefined;
  canNavigateTo: (path: string) => boolean;
  
  // Route collections
  allRoutes: NavigationRoute[];
  publicRoutes: NavigationRoute[];
  authenticatedRoutes: NavigationRoute[];
  adminRoutes: NavigationRoute[];
  
  // Utilities
  isCurrentPath: (path: string) => boolean;
  isInPath: (path: string) => boolean;
  debugNavigation: () => void;
}

export function useNavigation(): UseNavigationReturn {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const [navigationState, setNavigationState] = useState<NavigationState>(
    navigationService.getCurrentState()
  );

  // Initialize navigation service with router
  useEffect(() => {
    navigationService.setRouter(router);
    navigationService.setupBrowserNavigation();
  }, [router]);

  // Update navigation state when pathname changes
  useEffect(() => {
    navigationService.updateCurrentPath(pathname);
  }, [pathname]);

  // Subscribe to navigation state changes
  useEffect(() => {
    const unsubscribe = navigationService.subscribe(setNavigationState);
    return unsubscribe;
  }, []);

  // Navigation methods
  const navigate = useCallback(async (path: string, options?: { replace?: boolean; scroll?: boolean }) => {
    console.log('🔧 useNavigation: Navigate called', { path, options });
    return await navigationService.navigate(path, options);
  }, []);

  const goBack = useCallback(() => {
    console.log('🔧 useNavigation: Go back called');
    return navigationService.goBack();
  }, []);

  const refresh = useCallback(() => {
    console.log('🔧 useNavigation: Refresh called');
    navigationService.refresh();
  }, []);

  // Route information
  const currentRoute = navigationService.getRouteByPath(navigationState.currentPath);
  
  const canNavigateTo = useCallback((path: string) => {
    const isAdmin = user?.roles?.some(role => role.role === 'admin') || false;
    return navigationService.canNavigateToRoute(path, isAuthenticated, isAdmin);
  }, [isAuthenticated, user]);

  // Route collections
  const allRoutes = navigationService.getAllRoutes();
  const publicRoutes = navigationService.getPublicRoutes();
  const authenticatedRoutes = navigationService.getAuthenticatedRoutes();
  const adminRoutes = navigationService.getAdminRoutes();

  // Utilities
  const isCurrentPath = useCallback((path: string) => {
    return navigationState.currentPath === path;
  }, [navigationState.currentPath]);

  const isInPath = useCallback((path: string) => {
    return navigationState.currentPath.startsWith(path);
  }, [navigationState.currentPath]);

  const debugNavigation = useCallback(() => {
    navigationService.debugNavigation();
  }, []);

  return {
    // Navigation state
    currentPath: navigationState.currentPath,
    previousPath: navigationState.previousPath,
    isNavigating: navigationState.isNavigating,
    navigationHistory: navigationState.navigationHistory,
    
    // Navigation methods
    navigate,
    goBack,
    refresh,
    
    // Route information
    currentRoute,
    canNavigateTo,
    
    // Route collections
    allRoutes,
    publicRoutes,
    authenticatedRoutes,
    adminRoutes,
    
    // Utilities
    isCurrentPath,
    isInPath,
    debugNavigation
  };
}

// Hook for navigation guards
export function useNavigationGuard() {
  const { isAuthenticated, user } = useAuth();
  const navigation = useNavigation();

  const checkRouteAccess = useCallback((path: string): { canAccess: boolean; redirectTo?: string; reason?: string } => {
    const route = navigationService.getRouteByPath(path);
    
    if (!route) {
      return { canAccess: true }; // Allow unknown routes
    }

    // Check admin access
    const isAdmin = user?.roles?.some(role => role.role === 'admin') || false;
    if (route.adminOnly && !isAdmin) {
      return {
        canAccess: false,
        redirectTo: '/login',
        reason: 'Admin access required'
      };
    }

    // Check authentication
    if (route.requiresAuth && !isAuthenticated) {
      return {
        canAccess: false,
        redirectTo: '/login',
        reason: 'Authentication required'
      };
    }

    return { canAccess: true };
  }, [isAuthenticated, user]);

  const guardedNavigate = useCallback(async (path: string, options?: { replace?: boolean; scroll?: boolean }) => {
    const accessCheck = checkRouteAccess(path);
    
    if (!accessCheck.canAccess) {
      console.warn('🔧 Navigation Guard: Access denied', { path, reason: accessCheck.reason });
      if (accessCheck.redirectTo) {
        return await navigation.navigate(accessCheck.redirectTo, options);
      }
      return false;
    }

    return await navigation.navigate(path, options);
  }, [navigation, checkRouteAccess]);

  return {
    checkRouteAccess,
    guardedNavigate,
    ...navigation
  };
}

// Hook for breadcrumb navigation
export function useBreadcrumbs() {
  const { currentPath, navigationHistory } = useNavigation();

  const getBreadcrumbs = useCallback(() => {
    const pathSegments = currentPath.split('/').filter(Boolean);
    const breadcrumbs: { path: string; name: string; isActive: boolean }[] = [];

    // Add home
    breadcrumbs.push({
      path: '/',
      name: 'Home',
      isActive: currentPath === '/'
    });

    // Add path segments
    let currentSegmentPath = '';
    pathSegments.forEach((segment, index) => {
      currentSegmentPath += `/${segment}`;
      const route = navigationService.getRouteByPath(currentSegmentPath);
      
      breadcrumbs.push({
        path: currentSegmentPath,
        name: route?.name || segment.charAt(0).toUpperCase() + segment.slice(1),
        isActive: index === pathSegments.length - 1
      });
    });

    return breadcrumbs;
  }, [currentPath]);

  return {
    breadcrumbs: getBreadcrumbs(),
    currentPath,
    navigationHistory
  };
}