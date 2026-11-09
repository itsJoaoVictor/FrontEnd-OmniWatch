import { api } from '@/lib/axios';

const FALLBACK_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BCu50BtTZ5m557ZRl68C1114ZY7pwkRAzdXFDdEcPFQRI5E2udRK9ko0XkyOdcO4tDnTId3xUqcR9nFjRjqixho';

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

function areUint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
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
      if (Notification.permission !== 'granted') return false;
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return false;
      const sub = await reg.pushManager.getSubscription();
      return Boolean(sub);
    } catch (e) {
      console.error('Erro ao verificar inscrição push:', e);
      return false;
    }
  },

  async syncSubscription(): Promise<boolean> {
    if (!this.isSupported() || Notification.permission !== 'granted') return false;
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }
      await navigator.serviceWorker.ready;

      // 1. Obtém chave pública VAPID ativa do servidor
      let targetVapidKey = FALLBACK_VAPID_PUBLIC_KEY;
      try {
        const res = await api.get<{ public_key: string }>('/api/notifications/push-key');
        if (res.data?.public_key) {
          targetVapidKey = res.data.public_key;
        }
      } catch (err) {
        console.warn('Usando chave VAPID fallback na sincronização:', err);
      }

      const targetKeyArray = urlBase64ToUint8Array(targetVapidKey);
      let sub = await reg.pushManager.getSubscription();

      // 2. Compara se a chave da inscrição local é idêntica à chave atual do servidor
      let needsResubscribe = false;
      if (sub && sub.options?.applicationServerKey) {
        const currentKeyArray = new Uint8Array(sub.options.applicationServerKey);
        if (!areUint8ArraysEqual(currentKeyArray, targetKeyArray)) {
          // A chave do servidor mudou / foi rotacionada: renova a inscrição silenciosamente
          needsResubscribe = true;
        }
      } else if (!sub) {
        // Usuário concedeu permissão, mas o aparelho não tinha inscrição gerada
        needsResubscribe = true;
      }

      if (needsResubscribe) {
        if (sub) {
          await sub.unsubscribe().catch(() => {});
        }
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: targetKeyArray as any,
        });
      }

      if (!sub) return false;

      const subJson = sub.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        return false;
      }

      // 3. Salva ou atualiza a inscrição no banco de dados do servidor
      await api.post('/api/notifications/push-subscription', {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });
      return true;
    } catch (err) {
      console.warn('Falha ao sincronizar inscrição push com o servidor:', err);
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
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }
      await navigator.serviceWorker.ready;

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

      // 4. Cria ou renova a inscrição no PushManager
      let subscription = await reg.pushManager.getSubscription();
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any,
        });
      } catch (subErr) {
        // Se houver conflito de chaves anteriores, desfaz a inscrição antiga e cria uma nova limpa
        if (subscription) {
          await subscription.unsubscribe().catch(() => {});
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as any,
          });
        } else {
          throw subErr;
        }
      }

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
