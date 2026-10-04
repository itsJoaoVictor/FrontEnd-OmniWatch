self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clients.claim().then(() => {
      if ('caches' in self) {
        return caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Apenas processa requisições para o mesmo origin (ignora backend cross-origin e terceiros)
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Nunca intercepta chamadas de API ou recursos internos do Next.js
  if (event.request.url.includes('/api/') || event.request.url.includes('/_next/')) return;

  // Apenas faz fallback quando o usuário tenta navegar para páginas HTML offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
    );
  }
});

