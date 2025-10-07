// Service Worker for PWA functionality
const CACHE_NAME = 'visitor-system-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/script.js',
  '/admin.js',
  '/config.js',
  '/supabase-client.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // CORS 문제가 있는 CDN 리소스는 캐시하지 않음
  if (event.request.url.includes('cdn.tailwindcss.com')) {
    return; // Service Worker가 처리하지 않음
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // 네트워크에서 가져오기 (CORS 오류 방지)
        return fetch(event.request).catch(() => {
          // 네트워크 오류 시 기본 응답 반환
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
