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

// ==========================================
// Web Push Notifications Handler
// ==========================================
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'OmniWatch', body: event.data.text() };
    }
  }

  const title = data.title || 'OmniWatch';
  const origin = self.location.origin;

  // Resolve URLs absolutas para ícone e badge para o Android carregar sempre sem falhas
  let iconUrl = origin + '/icon-192x192.png';
  if (data.icon) {
    iconUrl = data.icon.startsWith('http')
      ? data.icon
      : origin + (data.icon.startsWith('/') ? '' : '/') + data.icon;
  }

  const badgeUrl = origin + '/icon-192x192.png';

  const options = {
    body: data.body || 'Você tem uma nova notificação no OmniWatch.',
    icon: iconUrl,
    badge: badgeUrl,
    vibrate: [120, 60, 120],
    data: data.data || { url: '/' },
    tag: data.tag || 'omniwatch-notification',
    renotify: true,
  };

  if (data.image) {
    options.image = data.image.startsWith('http')
      ? data.image
      : origin + (data.image.startsWith('/') ? '' : '/') + data.image;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
