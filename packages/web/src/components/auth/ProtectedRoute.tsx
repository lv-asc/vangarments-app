'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthWrapper';
import { LoadingPage } from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Check if we're in development mode
  const isDevMode = typeof window !== 'undefined' && localStorage.getItem('devMode') === 'true';

  useEffect(() => {
    // In development mode, bypass authentication checks
    if (isDevMode) {
      return;
    }

    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        // Redirect authenticated users away from auth pages
        router.push('/wardrobe');
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router, isDevMode]);

  // In development mode, always render children
  if (isDevMode) {
    return <>{children}</>;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingPage message="Verificando autenticação..." />;
  }

  // Don't render children if authentication requirements aren't met
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}