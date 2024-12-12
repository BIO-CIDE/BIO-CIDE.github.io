// sw.js

const CACHE_NAME = 'mosi-controller-v2';
const ASSETS = [
    '/',
    '/mosi-controller/index.html',
    '/mosi-controller/app.js',
    '/mosi-controller/manifest.json',
    '/mosi-controller/icon-192.svg',
    '/mosi-controller/icon-512.svg',
    '/mosi-controller/share.svg',
    '/mosi-controller/splash-640x1136.png',
    '/mosi-controller/splash-750x1334.png',
    '/mosi-controller/splash-1242x2208.png',
    '/mosi-controller/splash-1125x2436.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('.local')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request).then((fetchResponse) => {
                    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse;
                    }

                    const responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return fetchResponse;
                });
            })
            .catch(() => caches.match('/'))
    );
});
