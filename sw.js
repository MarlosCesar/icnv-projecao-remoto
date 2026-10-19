const CACHE_NAME = 'icnv-portal-v3.8.3';
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
    const url = new URL(event.request.url);
    const isHtml = event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');

    if (isHtml) {
        // Network-First para páginas HTML (garante que alterações de UI e versão apareçam imediatamente)
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-First para assets estáticos (imagens, ícones, fontes)
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const copy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                }
                return networkResponse;
            });
        })
    );
});
