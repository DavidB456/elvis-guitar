// Offline support: app files are cached so practice works without a connection.
const VERSION = "elvis-guitar-v1";
const APP = [
  "./", "index.html", "css/app.css", "js/chords.js", "js/songs.js", "js/audio.js", "js/app.js",
  "manifest.webmanifest", "fonts/ultra-latin-400-normal.woff2",
  "fonts/libre-franklin-latin-400-normal.woff2", "fonts/libre-franklin-latin-500-normal.woff2", "fonts/libre-franklin-latin-600-normal.woff2",
  "fonts/libre-franklin-latin-700-normal.woff2", "fonts/libre-franklin-latin-800-normal.woff2", "icons/icon.svg", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // App files: network first so updates show up, cache as fallback.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match("index.html")))
    );
    return;
  }
});
