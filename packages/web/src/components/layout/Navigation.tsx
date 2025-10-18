'use client';

import React from 'react';
import Link from 'next/link';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/contexts/AuthWrapper';
import { 
  HomeIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  UserIcon,
  ChartBarIcon,
  MegaphoneIcon,
  BeakerIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const iconMap: Record<string, React.ComponentType<any>> = {
  home: HomeIcon,
  discover: MagnifyingGlassIcon,
  wardrobe: HomeIcon,
  outfits: EyeIcon,
  marketplace: ShoppingBagIcon,
  social: UserGroupIcon,
  profile: UserIcon,
  analytics: ChartBarIcon,
  advertising: MegaphoneIcon,
  beta: BeakerIcon
};

interface NavigationProps {
  variant?: 'header' | 'sidebar' | 'mobile';
  className?: string;
}

export function Navigation({ variant = 'header', className = '' }: NavigationProps) {
  const { 
    currentPath, 
    navigate, 
    goBack, 
    canNavigateTo, 
    authenticatedRoutes, 
    publicRoutes,
    isCurrentPath,
    isNavigating 
  } = useNavigation();
  const { isAuthenticated, user } = useAuth();

  // Get appropriate routes based on authentication
  const availableRoutes = isAuthenticated ? authenticatedRoutes : publicRoutes;
  
  // Filter routes that user can access
  const accessibleRoutes = availableRoutes.filter(route => canNavigateTo(route.path));

  const handleNavigation = async (path: string, event: React.MouseEvent) => {
    event.preventDefault();
    console.log('🔧 Navigation: Handling click', { path, currentPath });
    
    if (path === currentPath) {
      console.log('🔧 Navigation: Already on current path');
      return;
    }

    const success = await navigate(path);
    if (!success) {
      console.error('❌ Navigation: Failed to navigate', { path });
    }
  };

  const getIconForRoute = (routeName: string) => {
    const iconKey = routeName.toLowerCase().replace(/[^a-z]/g, '');
    const IconComponent = iconMap[iconKey] || HomeIcon;
    return IconComponent;
  };

  if (variant === 'sidebar') {
    return (
      <nav className={`flex flex-col space-y-2 ${className}`}>
        {/* Back button */}
        <button
          onClick={() => goBack()}
          className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back</span>
        </button>

        {/* Navigation links */}
        {accessibleRoutes.map((route) => {
          const IconComponent = getIconForRoute(route.name);
          const isActive = isCurrentPath(route.path);

          return (
            <Link
              key={route.path}
              href={route.path}
              onClick={(e) => handleNavigation(route.path, e)}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-[#00132d] text-[#fff7d7] shadow-md'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              } ${isNavigating ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <IconComponent className="h-5 w-5" />
              <span className="font-medium">{route.name}</span>
              {route.description && (
                <span className="text-xs opacity-75 hidden lg:block">
                  {route.description}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  if (variant === 'mobile') {
    return (
      <nav className={`grid grid-cols-2 gap-2 ${className}`}>
        {accessibleRoutes.slice(0, 8).map((route) => {
          const IconComponent = getIconForRoute(route.name);
          const isActive = isCurrentPath(route.path);

          return (
            <Link
              key={route.path}
              href={route.path}
              onClick={(e) => handleNavigation(route.path, e)}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-[#00132d] text-[#fff7d7]'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${isNavigating ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <IconComponent className="h-6 w-6" />
              <span className="text-xs font-medium">{route.name}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  // Default header variant
  return (
    <nav className={`flex items-center space-x-6 ${className}`}>
      {accessibleRoutes.map((route) => {
        const IconComponent = getIconForRoute(route.name);
        const isActive = isCurrentPath(route.path);

        return (
          <motion.div
            key={route.path}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href={route.path}
              onClick={(e) => handleNavigation(route.path, e)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-[#00132d] bg-[#00132d]/10'
                  : 'text-[#00132d]/70 hover:text-[#00132d] hover:bg-[#00132d]/5'
              } ${isNavigating ? 'opacity-50 pointer-events-none' : ''}`}
              title={route.description}
            >
              <IconComponent className="h-5 w-5" />
              <span className="text-xs font-medium">{route.name}</span>
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}

// Breadcrumb navigation component
export function BreadcrumbNavigation({ className = '' }: { className?: string }) {
  const { currentPath, navigate } = useNavigation();
  
  const getBreadcrumbs = () => {
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
      
      breadcrumbs.push({
        path: currentSegmentPath,
        name: segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' '),
        isActive: index === pathSegments.length - 1
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.path}>
          {index > 0 && (
            <span className="text-gray-400">/</span>
          )}
          {breadcrumb.isActive ? (
            <span className="text-gray-900 font-medium">
              {breadcrumb.name}
            </span>
          ) : (
            <button
              onClick={() => navigate(breadcrumb.path)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {breadcrumb.name}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Navigation debug component for development
export function NavigationDebug() {
  const navigation = useNavigation();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 text-xs max-w-sm">
      <h4 className="font-bold mb-2">Navigation Debug</h4>
      <div className="space-y-1">
        <div><strong>Current:</strong> {navigation.currentPath}</div>
        <div><strong>Previous:</strong> {navigation.previousPath || 'None'}</div>
        <div><strong>Navigating:</strong> {navigation.isNavigating ? 'Yes' : 'No'}</div>
        <div><strong>History:</strong> {navigation.navigationHistory.length} items</div>
      </div>
      <button
        onClick={() => navigation.debugNavigation()}
        className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
      >
        Debug Console
      </button>
    </div>
  );
}