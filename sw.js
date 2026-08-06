const CACHE_NAME = 'romeo-pt-v78';
const ASSETS = [
  './',
  './index.html',
  './usuarios.html',
  './rutinas.html',
  './entrenamiento.html',
  './progreso.html',
  './recetas.html',
  './macros.html',
  './creditos.html',
  './styles.css',
  './shared.js',
  './persist.js',
  './1.jpeg',
  './2.jpeg',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isCodeOrDoc = event.request.mode === 'navigate' || 
                      ['document', 'script', 'style'].includes(event.request.destination) ||
                      url.pathname.endsWith('.html') ||
                      url.pathname.endsWith('.js') ||
                      url.pathname.endsWith('.css');

  // Estrategia Network-First para HTML, scripts y CSS para garantizar actualización inmediata en la PWA/SPA
  if (isCodeOrDoc) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-First para recursos estáticos (imágenes, fuentes, etc.)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).catch(() => {});
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
