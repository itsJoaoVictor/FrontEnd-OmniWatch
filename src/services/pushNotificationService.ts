import { api } from '@/lib/axios';

const FALLBACK_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BG-l02lg8CBtYAiPePx30IlSZcQ5RaFVFMoEHCXTyQR_qb6wQzDXiSydzkMcITHvaHNuUYxjOqAWdD3uKRTYoOE';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushNotificationService = {
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      return Boolean(sub);
    } catch (e) {
      console.error('Erro ao verificar inscrição push:', e);
      return false;
    }
  },

  async subscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;

    // 1. Solicita permissão do navegador
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }

    try {
      // 2. Garante registro do Service Worker
      let reg: ServiceWorkerRegistration;
      try {
        reg = await navigator.serviceWorker.ready;
      } catch {
        reg = await navigator.serviceWorker.register('/sw.js');
      }

      // 3. Obtém a chave pública VAPID
      let vapidKey = FALLBACK_VAPID_PUBLIC_KEY;
      try {
        const res = await api.get<{ public_key: string }>('/api/notifications/push-key');
        if (res.data?.public_key) {
          vapidKey = res.data.public_key;
        }
      } catch (err) {
        console.warn('Usando chave VAPID fallback:', err);
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidKey);

      // 4. Cria a inscrição no PushManager
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error('Inscrição push incompleta retornada pelo navegador.');
      }

      // 5. Salva no backend
      await api.post('/api/notifications/push-subscription', {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });

      return true;
    } catch (error) {
      console.error('Falha ao registrar Web Push:', error);
      throw error;
    }
  },

  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await api.delete('/api/notifications/push-subscription', {
          params: { endpoint: sub.endpoint },
        });
      }
      return true;
    } catch (e) {
      console.error('Erro ao cancelar inscrição push:', e);
      return false;
    }
  },

  async sendTestPush(): Promise<{ success: boolean; message: string }> {
    const res = await api.post<{ success: boolean; message: string }>(
      '/api/notifications/push-test'
    );
    return res.data;
  },
};
