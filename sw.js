self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      body: event.data ? event.data.text() : ""
    };
  }

  const title = data.title || "🔔 Kapitalcoins";
  const options = {
    body: data.body || "Las tasas de cambio han sido actualizadas.",
    icon: "/icon.PNG",
    badge: "/icon.PNG",
    data: {
      url: data.url || "/"
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if ("navigate" in client) {
          client.navigate(url);
        }

        if ("focus" in client) {
          return client.focus();
        }
      }

      return clients.openWindow(url);
    })
  );
});
