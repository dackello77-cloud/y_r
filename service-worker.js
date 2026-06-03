self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'DONE', body: 'DONE' };
  }

  const title = data.title || 'DONE';
  const options = {
    body: data.body || 'DONE',
    tag: data.tag || 'yr-done',
    icon: 'yr-icon.svg',
    badge: 'yr-icon.svg',
    data: { url: data.url || 'index%20(15).html' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : 'index%20(15).html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
      return null;
    })
  );
});
