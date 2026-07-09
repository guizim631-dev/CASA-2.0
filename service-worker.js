// Service Worker — Finanças da Casa
// Faz cache do "app shell" (HTML/CSS/JS/ícones) para abrir offline.
// Dados do Firestore usam a persistência offline própria do SDK (ver js/firebase-config.js).

const CACHE_NAME = 'financas-casa-v1';
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './manifest.json',
  './js/utils.js',
  './js/firebase-config.js',
  './js/auth.js',
  './js/state.js',
  './js/dashboard.js',
  './js/contribuicoes.js',
  './js/contas.js',
  './js/extras.js',
  './js/historico.js',
  './js/calendario.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca interceptar chamadas ao Firebase/Google (precisam ir direto pra rede)
  if (url.hostname.includes('firebase') || url.hostname.includes('google') || url.hostname.includes('gstatic')) {
    return;
  }

  // Estratégia: cache-first pro app shell, com atualização em segundo plano
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && event.request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
