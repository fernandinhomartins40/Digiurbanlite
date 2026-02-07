/**
 * ============================================================================
 * USE PUSH NOTIFICATIONS - Hook para gerenciar push notifications
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getFullApiUrl } from '@/lib/api-config';

interface UsePushNotificationsResult {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  requestPermission: () => Promise<void>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  loading: boolean;
}

// Converter base64 URL-safe para Uint8Array
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

export function usePushNotifications(): UsePushNotificationsResult {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verificar suporte
  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  // Verificar permissão atual
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, [isSupported]);

  /**
   * Verificar se já está inscrito
   */
  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('[Push] Error checking subscription:', error);
    }
  };

  /**
   * Solicitar permissão
   */
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Navegador não suporta notificações push');
      return;
    }

    try {
      setLoading(true);
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        toast.success('Permissão concedida!');
        await subscribe();
      } else if (perm === 'denied') {
        toast.error('Permissão negada para notificações');
      }
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      toast.error('Erro ao solicitar permissão');
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  /**
   * Inscrever para push notifications
   */
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      return;
    }

    try {
      setLoading(true);

      // Obter chave pública VAPID
      const response = await fetch(getFullApiUrl('/push/vapid-public-key'));
      const data = await response.json();

      if (!data.success || !data.publicKey) {
        throw new Error('VAPID public key não disponível');
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.ready;

      // Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey).buffer as ArrayBuffer,
      });

      // Enviar subscription para backend
      const subscribeResponse = await fetch(getFullApiUrl('/push/subscribe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      const subscribeData = await subscribeResponse.json();

      if (subscribeData.success) {
        setIsSubscribed(true);
        toast.success('Notificações push ativadas!');
      } else {
        throw new Error(subscribeData.message || 'Erro ao registrar subscription');
      }
    } catch (error: any) {
      console.error('[Push] Error subscribing:', error);
      toast.error(error.message || 'Erro ao ativar notificações push');
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  /**
   * Cancelar inscrição
   */
  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      return;
    }

    try {
      setLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        return;
      }

      // Cancelar subscription localmente
      await subscription.unsubscribe();

      // Remover do backend
      await fetch(getFullApiUrl('/push/unsubscribe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      setIsSubscribed(false);
      toast.success('Notificações push desativadas');
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
      toast.error('Erro ao desativar notificações push');
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return {
    permission,
    isSupported,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
    loading,
  };
}
