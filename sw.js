/* Jardin — service worker : app installable et fonctionnelle hors-ligne.
   Stratégie pensée pour que les MISES À JOUR se propagent :
   - HTML (navigation) : réseau d'abord → cache en secours (tu vois toujours la dernière version en ligne)
   - assets locaux + police : stale-while-revalidate (affiche le cache, rafraîchit en arrière-plan)
   - météo : réseau d'abord → cache en secours
   Pense à incrémenter CACHE à chaque déploiement pour forcer le renouvellement. */
const CACHE = 'jardin-v28';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './bootstrap-icons.woff2', './icon-192.png', './icon-512.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function swr(req) { // stale-while-revalidate
  return caches.open(CACHE).then(cache =>
    cache.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })
  );
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Météo open-meteo : réseau d'abord (donnée fraîche), cache en secours hors-ligne
  if (url.hostname.endsWith('open-meteo.com')) {
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Pages HTML : réseau d'abord pour toujours charger la dernière version, cache si hors-ligne
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r; })
        .catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // Police Montserrat (Google Fonts) + assets locaux : stale-while-revalidate
  e.respondWith(swr(req));
});
