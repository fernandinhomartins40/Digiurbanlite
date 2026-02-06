'use client';

/**
 * ============================================================================
 * NOTIFICATION PREFERENCES - Configurações de Notificações
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, MessageCircle, Globe, Moon, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getFullApiUrl } from '@/lib/api-config';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationPreferences {
  webEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  dailyDigest: boolean;
  dailyDigestTime?: string;
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    webEnabled: true,
    pushEnabled: false,
    emailEnabled: true,
    smsEnabled: false,
    dailyDigest: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { isSupported, isSubscribed, permission, requestPermission, subscribe, unsubscribe } =
    usePushNotifications();

  // Buscar preferências
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch(getFullApiUrl('/notifications/preferences'), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
    } finally {
      setLoading(false);
    }
  };

  // Salvar preferências
  const savePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    try {
      setSaving(true);
      const response = await fetch(getFullApiUrl('/notifications/preferences'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newPrefs),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences((prev) => ({ ...prev, ...newPrefs }));
          toast.success('Preferências salvas');
        }
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };

  // Alternar canal
  const toggleChannel = async (channel: keyof NotificationPreferences, value: boolean) => {
    // Se ativar push, solicitar permissão
    if (channel === 'pushEnabled' && value && !isSubscribed) {
      if (permission === 'default') {
        await requestPermission();
      } else if (permission === 'granted') {
        await subscribe();
      } else {
        toast.error('Permissão de notificações foi negada pelo navegador');
        return;
      }
    }

    // Se desativar push, cancelar subscription
    if (channel === 'pushEnabled' && !value && isSubscribed) {
      await unsubscribe();
    }

    await savePreferences({ [channel]: value });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando preferências...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Canais de Notificação</CardTitle>
          <CardDescription>
            Escolha como deseja receber notificações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Web */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Label htmlFor="web">Notificações Web</Label>
                <p className="text-sm text-muted-foreground">Dentro da aplicação</p>
              </div>
            </div>
            <Switch
              id="web"
              checked={preferences.webEnabled}
              onCheckedChange={(checked) => toggleChannel('webEnabled', checked)}
              disabled={saving}
            />
          </div>

          <Separator />

          {/* Push */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Smartphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <Label htmlFor="push">Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  {isSupported
                    ? 'Push do navegador'
                    : 'Não suportado neste navegador'}
                </p>
                {isSubscribed && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ Ativas
                  </p>
                )}
              </div>
            </div>
            <Switch
              id="push"
              checked={preferences.pushEnabled && isSubscribed}
              onCheckedChange={(checked) => toggleChannel('pushEnabled', checked)}
              disabled={!isSupported || saving}
            />
          </div>

          <Separator />

          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <Label htmlFor="email">Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">Para eventos importantes</p>
              </div>
            </div>
            <Switch
              id="email"
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => toggleChannel('emailEnabled', checked)}
              disabled={saving}
            />
          </div>

          <Separator />

          {/* SMS */}
          <div className="flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <MessageCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <Label htmlFor="sms">Notificações por SMS</Label>
                <p className="text-sm text-muted-foreground">Em breve</p>
              </div>
            </div>
            <Switch id="sms" checked={false} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horário de Silêncio</CardTitle>
          <CardDescription>
            Não receber notificações durante este período
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              <Moon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="flex-1">
              <Label>Ativar horário de silêncio</Label>
              <p className="text-sm text-muted-foreground">
                Notificações serão silenciadas durante este período
              </p>
            </div>
            <Switch disabled />
          </div>

          <div className="grid grid-cols-2 gap-4 opacity-50">
            <div>
              <Label>Início</Label>
              <div className="mt-2 p-2 border rounded-md text-sm text-muted-foreground">
                22:00
              </div>
            </div>
            <div>
              <Label>Fim</Label>
              <div className="mt-2 p-2 border rounded-md text-sm text-muted-foreground">
                08:00
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Diário</CardTitle>
          <CardDescription>
            Receber resumo das notificações por email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900">
              <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <Label>Ativar resumo diário</Label>
              <p className="text-sm text-muted-foreground">
                Email com resumo das notificações
              </p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => {
          const notificationService = require('@/services/notification.service').default;
          toast.info('Função de teste ainda não implementada');
        }}
        variant="outline"
        className="w-full"
      >
        <Bell className="h-4 w-4 mr-2" />
        Enviar Notificação de Teste
      </Button>
    </div>
  );
}
