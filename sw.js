/* ============================================
   Global Days Tracker — Service Worker v2
   Cache-first strategy, versioned cache
============================================ */
var CACHE_NAME = "gdt-v2";
var ASSETS = [
  "./",
  "./index.html"
];

/* Install: cache assets */
self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* Activate: delete old caches */
self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k) { return k !== CACHE_NAME; })
          .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* Fetch: cache-first, fallback to network */
self.addEventListener("fetch", function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        /* Cache successful GET requests */
        if (e.request.method === "GET" && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        /* Offline fallback */
        return caches.match("./index.html");
      });
    })
  );
});
