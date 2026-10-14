// Service Worker for RaktaReach Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Emergency blood requirement alert.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200, 100, 400],
      data: {
        url: data.url || '/donor'
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title || '🚨 RaktaReach Alert', options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow(event.notification.data.url || '/donor');
    })
  );
});
