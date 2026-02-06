/**
 * ============================================================================
 * PUSH NOTIFICATION HANDLERS - Service Worker
 * ============================================================================
 * Handlers para push notifications e clicks
 */

// Handler para evento push
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = { title: 'Nova Notificação', body: 'Você tem uma nova notificação' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (error) {
    console.error('[SW] Error parsing push data:', error);
  }

  const options = {
    body: data.body || data.message,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-72x72.png',
    data: data.data || {},
    timestamp: data.timestamp || Date.now(),
    vibrate: [200, 100, 200],
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    actions: [
      { action: 'open', title: 'Abrir', icon: '/icon-72x72.png' },
      { action: 'close', title: 'Fechar', icon: '/icon-72x72.png' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handler para clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Determinar URL para abrir
  let urlToOpen = event.notification.data?.url || '/cidadao';

  // Se for admin, redirecionar para admin
  if (event.notification.data?.recipientType === 'user') {
    urlToOpen = event.notification.data?.url || '/admin';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Verificar se já existe uma janela aberta
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((client) => {
            // Navegar para a URL desejada
            if ('navigate' in client) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }

      // Se não existe, abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handler para fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});

console.log('[SW] Push handlers registered');
