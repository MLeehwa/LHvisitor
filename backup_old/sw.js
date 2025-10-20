// Service Worker for PWA functionality
const CACHE_NAME = 'visitor-system-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/main.js',
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
  console.log('Service Worker 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('새 캐시 열기:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('모든 파일이 캐시되었습니다');
        // 즉시 활성화
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker 활성화 중...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker 활성화 완료');
      // 모든 클라이언트에 즉시 제어권 획득
      return self.clients.claim();
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // CORS 문제가 있는 CDN 리소스는 Service Worker가 처리하지 않음
  if (event.request.url.includes('cdn.tailwindcss.com') || 
      event.request.url.includes('cdn.jsdelivr.net') ||
      event.request.url.includes('cdnjs.cloudflare.com')) {
    return; // Service Worker가 처리하지 않음
  }
  
  // GET 요청만 처리
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시된 버전이 있으면 반환
        if (response) {
          return response;
        }
        
        // 네트워크에서 가져오기
        return fetch(event.request)
          .then((networkResponse) => {
            // 유효한 응답인지 확인
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // 응답을 캐시에 저장 (chrome-extension URL 제외)
            if (!event.request.url.startsWith('chrome-extension://')) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return networkResponse;
          })
          .catch(() => {
            // 네트워크 오류 시 기본 페이지 반환
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            // 다른 리소스의 경우 빈 응답 반환
            return new Response('', {
              status: 404,
              statusText: 'Not Found'
            });
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
