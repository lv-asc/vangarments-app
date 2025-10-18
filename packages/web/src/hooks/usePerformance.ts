'use client';

import { useEffect, useState, useCallback } from 'react';

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
}

interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
  });

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  // Measure Core Web Vitals
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // First Contentful Paint
    const measureFCP = () => {
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
      }
    };

    // Largest Contentful Paint
    const measureLCP = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        return () => observer.disconnect();
      }
    };

    // First Input Delay
    const measureFID = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
          });
        });
        observer.observe({ entryTypes: ['first-input'] });
        
        return () => observer.disconnect();
      }
    };

    // Cumulative Layout Shift
    const measureCLS = () => {
      if ('PerformanceObserver' in window) {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              setMetrics(prev => ({ ...prev, cls: clsValue }));
            }
          });
        });
        observer.observe({ entryTypes: ['layout-shift'] });
        
        return () => observer.disconnect();
      }
    };

    // Time to First Byte
    const measureTTFB = () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        setMetrics(prev => ({ ...prev, ttfb }));
      }
    };

    // Run measurements
    measureFCP();
    measureTTFB();
    
    const lcpCleanup = measureLCP();
    const fidCleanup = measureFID();
    const clsCleanup = measureCLS();

    return () => {
      lcpCleanup?.();
      fidCleanup?.();
      clsCleanup?.();
    };
  }, []);

  // Monitor network information
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (connection) {
        const info: NetworkInfo = {
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false,
        };
        
        setNetworkInfo(info);
        setIsSlowConnection(
          info.effectiveType === 'slow-2g' || 
          info.effectiveType === '2g' || 
          info.saveData
        );
      }
    };

    updateNetworkInfo();

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, []);

  // Send metrics to analytics
  const sendMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Send to your analytics service
    const metricsToSend = {
      ...metrics,
      networkInfo,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      url: window.location.href,
    };

    // Example: send to your analytics endpoint
    fetch('/api/v1/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metricsToSend),
    }).catch(error => {
      console.warn('Failed to send performance metrics:', error);
    });
  }, [metrics, networkInfo]);

  // Performance optimization helpers
  const shouldReduceAnimations = isSlowConnection || (metrics.fid && metrics.fid > 100);
  const shouldOptimizeImages = isSlowConnection || (networkInfo?.effectiveType === '2g');
  const shouldPreloadCriticalResources = !isSlowConnection && (networkInfo?.effectiveType === '4g');

  return {
    metrics,
    networkInfo,
    isSlowConnection,
    shouldReduceAnimations,
    shouldOptimizeImages,
    shouldPreloadCriticalResources,
    sendMetrics,
  };
}

// Hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  const [renderTime, setRenderTime] = useState<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setRenderTime(duration);
      
      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && duration > 16) {
        console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);

  return renderTime;
}

// Hook for measuring API call performance
export function useAPIPerformance() {
  const [apiMetrics, setApiMetrics] = useState<Record<string, number>>({});

  const measureAPICall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setApiMetrics(prev => ({
        ...prev,
        [endpoint]: duration,
      }));
      
      // Log slow API calls
      if (duration > 1000) {
        console.warn(`Slow API call detected for ${endpoint}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setApiMetrics(prev => ({
        ...prev,
        [`${endpoint}_error`]: duration,
      }));
      
      throw error;
    }
  }, []);

  return {
    apiMetrics,
    measureAPICall,
  };
}

// Hook for memory usage monitoring
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateMemoryInfo = () => {
      const memory = (performance as any).memory;
      if (memory) {
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const isMemoryPressure = memoryInfo && 
    (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) > 0.8;

  return {
    memoryInfo,
    isMemoryPressure,
  };
}