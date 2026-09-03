self.addEventListener("push", (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || "/logo.png",
            badge: data.badge || "/logo.png",
            data: data.data,
        };

        event.waitUntil(self.registration.showNotification(data.title || "Synk ISP", options));
    }
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
            for (const client of clientsArr) {
                if (client.url.includes(self.location.origin)) {
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});
