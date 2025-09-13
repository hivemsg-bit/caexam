const CACHE_NAME = 'caexam-v1';
const urlsToCache = [
    '/',
    '/styles.css',
    '/script.js',
    '/images/logo.png',
    // Add other static files
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) return response;
                return fetch(event.request).catch(() => {
                    // Offline fallback: Show cached home
                    return caches.match('/');
                });
            })
    );
});
