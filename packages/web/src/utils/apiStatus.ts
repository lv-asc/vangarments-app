// API Status Checker for Development and Debugging

export interface ApiStatus {
  isOnline: boolean;
  responseTime?: number;
  error?: string;
  lastChecked: Date;
}

class ApiStatusChecker {
  private status: ApiStatus = {
    isOnline: false,
    lastChecked: new Date(),
  };

  private listeners: ((status: ApiStatus) => void)[] = [];

  async checkStatus(): Promise<ApiStatus> {
    const startTime = Date.now();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    try {
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Don't include credentials for health check
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        this.status = {
          isOnline: true,
          responseTime,
          lastChecked: new Date(),
        };
      } else {
        this.status = {
          isOnline: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          lastChecked: new Date(),
        };
      }
    } catch (error) {
      this.status = {
        isOnline: false,
        error: error instanceof Error ? error.message : 'Network error',
        lastChecked: new Date(),
      };
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(this.status));

    return this.status;
  }

  getStatus(): ApiStatus {
    return this.status;
  }

  subscribe(listener: (status: ApiStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  startPeriodicCheck(intervalMs = 30000): () => void {
    // Initial check
    this.checkStatus();

    // Set up periodic checks
    const interval = setInterval(() => {
      this.checkStatus();
    }, intervalMs);

    // Return stop function
    return () => {
      clearInterval(interval);
    };
  }
}

// Export singleton instance
export const apiStatusChecker = new ApiStatusChecker();

// React hook for using API status
import { useState, useEffect } from 'react';

export function useApiStatus() {
  const [status, setStatus] = useState<ApiStatus>(apiStatusChecker.getStatus());

  useEffect(() => {
    // Subscribe to status updates
    const unsubscribe = apiStatusChecker.subscribe(setStatus);

    // Start periodic checking if not already started
    const stopPeriodicCheck = apiStatusChecker.startPeriodicCheck();

    return () => {
      unsubscribe();
      stopPeriodicCheck();
    };
  }, []);

  const checkNow = () => {
    return apiStatusChecker.checkStatus();
  };

  return {
    ...status,
    checkNow,
  };
}