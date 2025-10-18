const CACHE_NAME = 'vangarments-v1.0.0';
const STATIC_CACHE = 'vangarments-static-v1.0.0';
const DYNAMIC_CACHE = 'vangarments-dynamic-v1.0.0';
const IMAGE_CACHE = 'vangarments-images-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/wardrobe',
  '/outfits',
  '/social',
  '/marketplace',
  '/profile',
  '/assets/images/logo.svg',
  '/assets/images/logo-header.svg',
  '/favicon.svg',
  '/favicon.ico',
  '/site.webmanifest',
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/api\.vangarments\.com\/v1\/wardrobe/,
  /^https:\/\/api\.vangarments\.com\/v1\/outfits/,
  /^https:\/\/api\.vangarments\.com\/v1\/social/,
  /^https:\/\/api\.vangarments\.com\/v1\/marketplace/,
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /^https:\/\/.*\.amazonaws\.com\/.*\.(jpg|jpeg|png|webp|avif|svg)$/,
  /^https:\/\/vangarments\.com\/.*\.(jpg|jpeg|png|webp|avif|svg)$/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// Check if request is for an image
function isImageRequest(request) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(request.url)) ||
         request.destination === 'image';
}

// Check if request is for API
function isAPIRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url)) ||
         request.url.includes('/api/');
}

// Check if request is for static asset
function isStaticAsset(request) {
  return STATIC_ASSETS.includes(new URL(request.url).pathname) ||
         request.url.includes('/assets/') ||
         request.url.includes('/_next/static/');
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Handle image requests - Cache First strategy
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Image request failed:', error);
    // Return placeholder image or cached fallback
    return new Response('', { status: 404 });
  }
}

// Handle API requests - Network First with cache fallback
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (networkError) {
      console.log('[SW] Network failed, trying cache for API request');
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      throw networkError;
    }
  } catch (error) {
    console.error('[SW] API request failed:', error);
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'Você está offline. Algumas funcionalidades podem estar limitadas.' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle static assets - Cache First strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset request failed:', error);
    return new Response('', { status: 404 });
  }
}

// Handle navigation requests - Network First with offline fallback
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation request failed, serving offline page');
    
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/');
    
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

// Handle generic requests
async function handleGenericRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('[SW] Generic request failed:', error);
    return new Response('', { status: 404 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'wardrobe-sync') {
    event.waitUntil(syncWardrobeData());
  } else if (event.tag === 'outfit-sync') {
    event.waitUntil(syncOutfitData());
  }
});

// Sync wardrobe data when back online
async function syncWardrobeData() {
  try {
    console.log('[SW] Syncing wardrobe data...');
    
    // Get offline data from IndexedDB
    const offlineData = await getOfflineWardrobeData();
    
    if (offlineData.length > 0) {
      // Send to server
      const response = await fetch('/api/v1/wardrobe/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: offlineData }),
      });
      
      if (response.ok) {
        // Clear offline data
        await clearOfflineWardrobeData();
        console.log('[SW] Wardrobe data synced successfully');
      }
    }
  } catch (error) {
    console.error('[SW] Failed to sync wardrobe data:', error);
  }
}

// Sync outfit data when back online
async function syncOutfitData() {
  try {
    console.log('[SW] Syncing outfit data...');
    
    // Similar implementation for outfits
    const offlineData = await getOfflineOutfitData();
    
    if (offlineData.length > 0) {
      const response = await fetch('/api/v1/outfits/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outfits: offlineData }),
      });
      
      if (response.ok) {
        await clearOfflineOutfitData();
        console.log('[SW] Outfit data synced successfully');
      }
    }
  } catch (error) {
    console.error('[SW] Failed to sync outfit data:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getOfflineWardrobeData() {
  // Implementation would use IndexedDB to get offline data
  return [];
}

async function clearOfflineWardrobeData() {
  // Implementation would clear IndexedDB offline data
}

async function getOfflineOutfitData() {
  // Implementation would use IndexedDB to get offline data
  return [];
}

async function clearOfflineOutfitData() {
  // Implementation would clear IndexedDB offline data
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Vangarments',
    icon: '/assets/images/logo.svg',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver agora',
        icon: '/shortcuts/explore.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/shortcuts/close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Vangarments', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});