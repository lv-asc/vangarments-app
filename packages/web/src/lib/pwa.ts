'use client';

// Service Worker registration and PWA utilities
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // Only register service worker in production
    if (process.env.NODE_ENV === 'production') {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          console.log('SW registered: ', registration);

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, show update notification
                  showUpdateNotification();
                }
              });
            }
          });

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('Message from SW:', event.data);
          });

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

        } catch (error) {
          console.log('SW registration failed: ', error);
        }
      });
    } else {
      // In development, unregister any existing service workers to avoid caching issues
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          console.log('Unregistering SW in dev mode:', registration);
          registration.unregister();
        }
      });
    }
  }
}

function showUpdateNotification() {
  // Show a notification that new content is available
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Vangarments Atualizado', {
      body: 'Nova versão disponível! Recarregue a página para atualizar.',
      icon: '/assets/images/logo.svg',
      tag: 'app-update',
    });
  }

  // Also show in-app notification
  const event = new CustomEvent('sw-update-available');
  window.dispatchEvent(event);
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push messaging is not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });

    console.log('Push subscription:', subscription);

    // Send subscription to server
    await fetch('/api/v1/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

// Check if app is running in standalone mode (installed as PWA)
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

// Get app installation status
export function getInstallationStatus() {
  return {
    isStandalone: isStandalone(),
    canInstall: 'beforeinstallprompt' in window,
    supportsServiceWorker: 'serviceWorker' in navigator,
    supportsPushNotifications: 'PushManager' in window,
    supportsNotifications: 'Notification' in window,
  };
}

// Background sync for offline actions
export function registerBackgroundSync(tag: string, data?: any) {
  if ('serviceWorker' in navigator && 'sync' in (window.ServiceWorkerRegistration.prototype as any)) {
    navigator.serviceWorker.ready.then((registration) => {
      return (registration as any).sync.register(tag);
    }).catch((error) => {
      console.error('Background sync registration failed:', error);

      // Fallback: store data locally and try to sync later
      if (data) {
        const offlineActions = JSON.parse(localStorage.getItem('offline-actions') || '[]');
        offlineActions.push({ tag, data, timestamp: Date.now() });
        localStorage.setItem('offline-actions', JSON.stringify(offlineActions));
      }
    });
  }
}

// Retry offline actions when back online
export function retryOfflineActions() {
  const offlineActions = JSON.parse(localStorage.getItem('offline-actions') || '[]');

  if (offlineActions.length > 0) {
    offlineActions.forEach((action: any) => {
      registerBackgroundSync(action.tag, action.data);
    });

    // Clear offline actions after attempting to sync
    localStorage.removeItem('offline-actions');
  }
}

// Network status monitoring
export function monitorNetworkStatus() {
  if (typeof window === 'undefined') return;

  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;

    // Dispatch custom event
    const event = new CustomEvent('network-status-change', {
      detail: { isOnline }
    });
    window.dispatchEvent(event);

    // If back online, retry offline actions
    if (isOnline) {
      retryOfflineActions();
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Initial status
  updateOnlineStatus();
}

// Cache management utilities
export async function clearAppCache() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('App cache cleared');
  }
}

export async function getCacheSize(): Promise<number> {
  if (!('caches' in window) || !('estimate' in navigator.storage)) {
    return 0;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  } catch (error) {
    console.error('Failed to get cache size:', error);
    return 0;
  }
}

// App update utilities
export function checkForAppUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.update();
      }
    });
  }
}

export function reloadApp() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      } else {
        window.location.reload();
      }
    });
  } else {
    window.location.reload();
  }
}