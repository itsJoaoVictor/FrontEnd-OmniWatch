self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    })
  );
});

