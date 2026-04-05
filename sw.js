const CACHE_NAME = 'icnv-portal-v3.6.7';
const ASSETS = [
    'index.html',
    'remote_portal.html',
    'remote-portal.html',
    'manifest.json',
    'logo ICNV Projecao.png',
    'icon-192.png',
    'icon-512.png'
];

self.addEventListener('install', (event) => {
    // Força o service worker a pular a fila de espera
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    // Limpa caches antigos ao ativar a nova versão
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    // Reinivindica o controle de todos os clientes abertos
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Estratégia: Cache-first para assets pesados, mas Network-first seria melhor para o HTML
            return response || fetch(event.request);
        })
    );
});
