'use client';

import { QueryClient, QueryClientProvider } from 'react-query';
import { useState } from 'react';
import { AuthWrapper } from '@/contexts/AuthWrapper';
import { DataProvider } from '@/contexts/DataContext';
import { ToastProvider } from './ToastProvider';
import { NavigationProvider } from './NavigationProvider';
// Development components removed


export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error: any) => {
          // Don't retry on auth errors
          if (error?.status === 401 || error?.code === 'UNAUTHORIZED') {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationProvider>
        <AuthWrapper>
          <DataProvider>
            {children}
            <ToastProvider />
          </DataProvider>
        </AuthWrapper>
      </NavigationProvider>
    </QueryClientProvider>
  );
}