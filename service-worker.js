/* =========================================
   BibleSphere PWA Service Worker
   Version: 1.0
========================================= */

const CACHE_NAME = "biblesphere-pwa-v1";

/* =========================================
   CORE FILES TO CACHE
========================================= */

const CORE_ASSETS = [

  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html",

  "./js/liturgical_calendar.js",

  "./sections/bible.html",
  "./sections/stronglexicon.html",
  "./sections/topics.html",
  "./sections/eastondictionary.html",
  "./sections/dailyblessing.html",
  "./sections/donate.html",

  "./icons/icon-72.png",
  "./icons/icon-96.png",
  "./icons/icon-128.png",
  "./icons/icon-144.png",
  "./icons/icon-152.png",
  "./icons/icon-192.png",
  "./icons/icon-384.png",
  "./icons/icon-512.png",
  "./icons/maskable-icon.png"

];

/* =========================================
   INSTALL
========================================= */

self.addEventListener("install", event => {

  console.log("[SW] Installing...");

  event.waitUntil(

    caches.open(CACHE_NAME)
    .then(cache => {

      console.log("[SW] Caching core assets");

      return cache.addAll(CORE_ASSETS);

    })

  );

  self.skipWaiting();

});

/* =========================================
   ACTIVATE
========================================= */

self.addEventListener("activate", event => {

  console.log("[SW] Activating...");

  event.waitUntil(

    caches.keys()
    .then(keys => {

      return Promise.all(

        keys.map(key => {

          if(key !== CACHE_NAME){

            console.log("[SW] Removing old cache:", key);

            return caches.delete(key);

          }

        })

      );

    })

  );

  self.clients.claim();

});

/* =========================================
   FETCH STRATEGY
========================================= */

self.addEventListener("fetch", event => {

  const request = event.request;

  /* ONLY HANDLE GET REQUESTS */

  if(request.method !== "GET"){

    return;

  }

  /* CDN JSON FILES:
     NETWORK FIRST
  */

  if(

    request.url.includes("daily_verses.json")
    ||
    request.url.includes("daily_quizzes.json")

  ){

    event.respondWith(

      fetch(request)

      .then(response => {

        const cloned = response.clone();

        caches.open(CACHE_NAME)
        .then(cache => {

          cache.put(request, cloned);

        });

        return response;

      })

      .catch(() => {

        return caches.match(request);

      })

    );

    return;

  }

  /* HTML PAGES:
     NETWORK FIRST
  */

  if(request.headers.get("accept").includes("text/html")){

    event.respondWith(

      fetch(request)

      .then(response => {

        const cloned = response.clone();

        caches.open(CACHE_NAME)
        .then(cache => {

          cache.put(request, cloned);

        });

        return response;

      })

      .catch(() => {

        return caches.match(request)
        .then(response => {

          return response || caches.match("./offline.html");

        });

      })

    );

    return;

  }

  /* STATIC ASSETS:
     CACHE FIRST
  */

  event.respondWith(

    caches.match(request)

    .then(cachedResponse => {

      if(cachedResponse){

        return cachedResponse;

      }

      return fetch(request)

      .then(networkResponse => {

        const cloned = networkResponse.clone();

        caches.open(CACHE_NAME)
        .then(cache => {

          cache.put(request, cloned);

        });

        return networkResponse;

      });

    })

    .catch(() => {

      if(request.destination === "image"){

        return caches.match("./icons/icon-192.png");

      }

    })

  );

});

/* =========================================
   BACKGROUND CACHE UPDATE
========================================= */

self.addEventListener("message", event => {

  if(event.data === "skipWaiting"){

    self.skipWaiting();

  }

});

/* =========================================
   PWA READY
========================================= */

console.log("[SW] BibleSphere Service Worker Ready");