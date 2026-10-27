// Le service worker de Diapason Labo : il ne fait qu'une chose, recevoir la relance douce et ouvrir la bonne page
// quand on la touche. Il ne garde rien en cache : l'app reste toujours fraîche.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { texte: e.data?.text() }; }
  e.waitUntil(self.registration.showNotification(d.titre || 'Diapason Labo', { body: d.texte || '', icon: 'img/icone-192.png', badge: 'img/icone-192.png', tag: 'relance', data: { url: d.url || './' } }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((l) => {
    const c = l.find((x) => x.url.startsWith(self.registration.scope));
    if (c) { c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
