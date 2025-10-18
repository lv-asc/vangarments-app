interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface NavigationTiming {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private readonly MAX_METRICS = 1000;

  private constructor() {
    this.initializeObservers();
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    try {
      // Observe paint metrics
      if ('PerformanceObserver' in window) {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: entry.name,
              value: entry.startTime,
              timestamp: Date.now(),
              metadata: { entryType: entry.entryType },
            });
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);

        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'largest-contentful-paint',
              value: entry.startTime,
              timestamp: Date.now(),
              metadata: { 
                entryType: entry.entryType,
                element: (entry as any).element?.tagName,
                size: (entry as any).size,
              },
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Observe layout shifts
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          if (clsValue > 0) {
            this.recordMetric({
              name: 'cumulative-layout-shift',
              value: clsValue,
              timestamp: Date.now(),
              metadata: { entryType: 'layout-shift' },
            });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

        // Observe first input delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'first-input-delay',
              value: (entry as any).processingStart - entry.startTime,
              timestamp: Date.now(),
              metadata: { 
                entryType: entry.entryType,
                inputType: (entry as any).name,
              },
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      }
    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS / 2);
    }

    // Log critical performance issues
    this.checkPerformanceThresholds(metric);
  }

  /**
   * Measure function execution time
   */
  measureFunction<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();

    this.recordMetric({
      name: `function-${name}`,
      value: endTime - startTime,
      timestamp: Date.now(),
      metadata: { type: 'function-execution' },
    });

    return result;
  }

  /**
   * Measure async function execution time
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();

    this.recordMetric({
      name: `async-function-${name}`,
      value: endTime - startTime,
      timestamp: Date.now(),
      metadata: { type: 'async-function-execution' },
    });

    return result;
  }

  /**
   * Measure API request performance
   */
  measureApiRequest(url: string, method: string, duration: number, status: number): void {
    this.recordMetric({
      name: 'api-request',
      value: duration,
      timestamp: Date.now(),
      metadata: {
        url,
        method,
        status,
        type: 'api-request',
      },
    });
  }

  /**
   * Measure component render time
   */
  measureComponentRender(componentName: string, renderTime: number): void {
    this.recordMetric({
      name: `component-render-${componentName}`,
      value: renderTime,
      timestamp: Date.now(),
      metadata: { type: 'component-render' },
    });
  }

  /**
   * Get navigation timing metrics
   */
  getNavigationTiming(): NavigationTiming | null {
    if (typeof window === 'undefined' || !window.performance?.timing) {
      return null;
    }

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    return {
      navigationStart: timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      firstPaint: this.getMetricValue('first-paint'),
      firstContentfulPaint: this.getMetricValue('first-contentful-paint'),
      largestContentfulPaint: this.getMetricValue('largest-contentful-paint'),
      firstInputDelay: this.getMetricValue('first-input-delay'),
      cumulativeLayoutShift: this.getMetricValue('cumulative-layout-shift'),
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalMetrics: number;
    averageApiResponseTime: number;
    slowApiRequests: PerformanceMetric[];
    renderPerformance: Record<string, number>;
    coreWebVitals: {
      lcp?: number;
      fid?: number;
      cls?: number;
    };
  } {
    const apiMetrics = this.metrics.filter(m => m.name === 'api-request');
    const renderMetrics = this.metrics.filter(m => m.name.startsWith('component-render-'));
    
    const averageApiResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0;

    const slowApiRequests = apiMetrics
      .filter(m => m.value > 1000) // Requests slower than 1 second
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const renderPerformance: Record<string, number> = {};
    renderMetrics.forEach(metric => {
      const componentName = metric.name.replace('component-render-', '');
      if (!renderPerformance[componentName] || renderPerformance[componentName] > metric.value) {
        renderPerformance[componentName] = metric.value;
      }
    });

    return {
      totalMetrics: this.metrics.length,
      averageApiResponseTime,
      slowApiRequests,
      renderPerformance,
      coreWebVitals: {
        lcp: this.getMetricValue('largest-contentful-paint'),
        fid: this.getMetricValue('first-input-delay'),
        cls: this.getMetricValue('cumulative-layout-shift'),
      },
    };
  }

  /**
   * Check performance thresholds and log warnings
   */
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const thresholds = {
      'largest-contentful-paint': 2500, // 2.5 seconds
      'first-input-delay': 100, // 100ms
      'cumulative-layout-shift': 0.1, // 0.1
      'api-request': 2000, // 2 seconds
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      console.warn(`Performance threshold exceeded for ${metric.name}: ${metric.value}ms (threshold: ${threshold}ms)`, metric);
    }
  }

  /**
   * Get the latest value for a specific metric
   */
  private getMetricValue(metricName: string): number | undefined {
    const metric = this.metrics
      .filter(m => m.name === metricName)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    return metric?.value;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const monitor = PerformanceMonitoringService.getInstance();

  const measureRender = (componentName: string, renderFn: () => void) => {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    monitor.measureComponentRender(componentName, endTime - startTime);
  };

  const measureAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return monitor.measureAsyncFunction(name, fn);
  };

  const measure = <T>(name: string, fn: () => T): T => {
    return monitor.measureFunction(name, fn);
  };

  return {
    measureRender,
    measureAsync,
    measure,
    recordMetric: monitor.recordMetric.bind(monitor),
    getPerformanceSummary: monitor.getPerformanceSummary.bind(monitor),
    getNavigationTiming: monitor.getNavigationTiming.bind(monitor),
  };
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitoringService.getInstance();

// API client interceptor for measuring request performance
export function createPerformanceInterceptor() {
  return {
    request: (config: any) => {
      config._startTime = performance.now();
      return config;
    },
    response: (response: any) => {
      const duration = performance.now() - response.config._startTime;
      performanceMonitor.measureApiRequest(
        response.config.url,
        response.config.method?.toUpperCase() || 'GET',
        duration,
        response.status
      );
      return response;
    },
    error: (error: any) => {
      if (error.config?._startTime) {
        const duration = performance.now() - error.config._startTime;
        performanceMonitor.measureApiRequest(
          error.config.url,
          error.config.method?.toUpperCase() || 'GET',
          duration,
          error.response?.status || 0
        );
      }
      throw error;
    },
  };
}