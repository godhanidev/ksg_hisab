// ─── KSG Hisab Ultra-Fast Service Worker ─────────────────────────────────────
const CACHE_NAME = "ksg-hisab-v1";

const STATIC_PRECACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/logo.png"
];

// Install: Precache critical shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn("Precache partial warning:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache versions immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Instant Cache-First for static assets, Network-First with Cache fallback for navigations
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests, Chrome extension calls, and Firestore / Firebase APIs
  if (
    request.method !== "GET" ||
    !url.protocol.startsWith("http") ||
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("identitytoolkit") ||
    url.pathname.startsWith("/@vite") ||
    url.pathname.startsWith("/@react-refresh")
  ) {
    return;
  }

  // Navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const indexCached = await caches.match("/index.html");
          if (indexCached) return indexCached;
          return caches.match("/");
        })
    );
    return;
  }

  // Static Assets (JS, CSS, Images, Fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to revalidate cache for next load
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
