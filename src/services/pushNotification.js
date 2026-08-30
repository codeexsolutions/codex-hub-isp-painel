// Mesmo padrão do synk-app (api/services/pushNotification.ts), adaptado pra
// central de notificações do PAINEL — usa o request() autenticado já
// existente em store.js (Notificacoes.obterChavePublica /
// NotificacoesPainel.inscrever) em vez de repetir lógica de fetch aqui.
import { Notificacoes, NotificacoesPainel } from "./store";

export async function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return await navigator.serviceWorker.register("/sw.js");
}

export async function solicitarPermissaoNotificacao() {
  if (!("Notification" in window)) return false;
  const permissao = await Notification.requestPermission();
  return permissao === "granted";
}

function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Chamado depois do login — silencioso (pede permissão e já inscreve; se o
// provedor negar a permissão do navegador, só não ativa, sem travar nada).
export async function registrarPushNotificationPainel() {
  const registration = await registrarServiceWorker();
  if (!registration) return;

  const permitido = await solicitarPermissaoNotificacao();
  if (!permitido) return;

  const chavePublica = await Notificacoes.obterChavePublica();
  if (!chavePublica) return;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(chavePublica),
    });
  }

  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");

  await NotificacoesPainel.inscrever({
    device: "",
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      p256dh: p256dh ? arrayBufferToBase64(p256dh) : "",
      auth: auth ? arrayBufferToBase64(auth) : "",
    },
  });
}
