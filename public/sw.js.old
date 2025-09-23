const CACHE_NAME = "bjs-racing-v2"; // Versi cache dinaikkan
const urlsToCache = [
  "/",
  // Tambahkan path ke file CSS dan JS utama Anda jika berbeda
];

// Install event: Pre-cache aset-aset inti
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    }),
  );
});

// Activate event: Hapus cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: clearing old cache");
            return caches.delete(cache);
          }
        }),
      );
    }),
  );
});

// Fetch event: Terapkan strategi caching yang cerdas
self.addEventListener("fetch", (event) => {
  // Strategi 1: Stale-While-Revalidate untuk API
  // Cepat (dari cache), Segar (update di latar belakang)
  if (event.request.url.includes("/api/addresses")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponsePromise = fetch(event.request).then(
            (networkResponse) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            },
          );
          // Kembalikan data dari cache jika ada, sambil menunggu data baru dari jaringan
          return cachedResponse || fetchedResponsePromise;
        });
      }),
    );
    return; // Hentikan eksekusi di sini untuk rute API
  }

  // Strategi 2: Cache-First untuk semua request lainnya (CSS, JS, Gambar, dll)
  // Jika sudah ada di cache, gunakan. Jika tidak, ambil dari jaringan dan simpan ke cache.
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // Langsung dari cache
      }

      // Jika tidak ada di cache, fetch dari jaringan
      return fetch(event.request)
        .then((networkResponse) => {
          // Dan simpan ke cache untuk penggunaan selanjutnya
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch((error) => {
          // Tangani error jika offline dan tidak ada di cache
          console.error("Fetch failed; returning offline page instead.", error);
          // Anda bisa mengembalikan halaman offline fallback di sini jika ada
        });
    }),
  );
});
