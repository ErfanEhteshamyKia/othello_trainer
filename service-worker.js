const cacheName = 'othello-puzzle-trainer-v1';
const assetsToCache = [
    './',
    './index.html',
    './manifest.json',
    './icons/game.png',
    './puzzles/endgame/easy_endgame.txt',
    './puzzles/endgame/medium_endgame.txt',
    './puzzles/endgame/hard_endgame.txt',
    './puzzles/endgame/very_hard_endgame.txt',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheName)
            .then((cache) => {
                return cache.addAll(assetsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                return cachedResponse || fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [cacheName];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
