/**
 * Service Worker — Web Push Notifications (Bimbel Belajarku).
 *
 * Menangani event `push` (menampilkan notifikasi) dan `notificationclick`
 * (fokus ke tab aplikasi yang relevan atau membuka tab baru).
 * Diletakkan di root `/sw.js` agar cakupan (scope) mencakup seluruh aplikasi.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Bimbel Belajarku", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Bimbel Belajarku";
  const options = {
    body: data.body || "",
    icon: data.icon || "/logo.jpg",
    badge: "/logo.jpg",
    tag: data.tag,
    data: { url: data.url || "/tutor/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) ||
    "/tutor/dashboard";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })()
  );
});
