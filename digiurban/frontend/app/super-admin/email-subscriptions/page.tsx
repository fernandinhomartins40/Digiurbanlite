'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import { toast } from '@/hooks/use-toast';
import { Ban, CheckCircle2, Clock3, CreditCard, RefreshCw, Server, XCircle } from 'lucide-react';

type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';

interface EmailSubscription {
  id: string;
  plan: string;
  status: SubscriptionStatus;
  monthlyPrice: string | number;
  currentPeriodEnd: string;
  trialEndsAt?: string | null;
  canceledAt?: string | null;
  emailServer?: {
    id: string;
    hostname: string;
    isActive: boolean;
  };
}

const statusLabel: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Liberada',
  TRIAL: 'Em teste',
  SUSPENDED: 'Suspensa',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada'
};

const statusClass: Record<SubscriptionStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  TRIAL: 'bg-blue-100 text-blue-800 border-blue-200',
  SUSPENDED: 'bg-amber-100 text-amber-900 border-amber-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  EXPIRED: 'bg-zinc-100 text-zinc-700 border-zinc-200'
};

export default function SuperAdminEmailSubscriptionsPage() {
  const { apiRequest } = useSuperAdminAuth();
  const [subscriptions, setSubscriptions] = useState<EmailSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    void loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/super-admin/email-subscriptions', { method: 'GET' });
      setSubscriptions(response?.subscriptions || []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar as assinaturas do email.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (subscriptionId: string, status: SubscriptionStatus) => {
    try {
      setUpdatingId(subscriptionId);
      const response = await apiRequest(`/super-admin/email-subscriptions/${subscriptionId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });

      toast({
        title: 'Sucesso',
        description: response?.message || `Status alterado para ${statusLabel[status]}.`
      });

      await loadSubscriptions();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar o status da assinatura.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const activeCount = subscriptions.filter((item) => item.status === 'ACTIVE').length;
  const trialCount = subscriptions.filter((item) => item.status === 'TRIAL').length;
  const blockedCount = subscriptions.filter((item) => ['SUSPENDED', 'CANCELLED', 'EXPIRED'].includes(item.status)).length;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Carregando assinaturas...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Assinaturas</h1>
        <p className="mt-2 text-gray-600">Controle manual das assinaturas do serviço de email por prefeitura.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Ativas</p><p className="text-2xl font-bold text-green-700">{activeCount}</p></div><CheckCircle2 className="h-8 w-8 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Em teste</p><p className="text-2xl font-bold text-blue-700">{trialCount}</p></div><Clock3 className="h-8 w-8 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Bloqueadas</p><p className="text-2xl font-bold text-amber-700">{blockedCount}</p></div><Ban className="h-8 w-8 text-amber-600" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assinaturas</CardTitle>
          <Button variant="outline" onClick={() => void loadSubscriptions()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhuma assinatura encontrada.
            </div>
          ) : (
            subscriptions.map((subscription) => (
              <div key={subscription.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={statusClass[subscription.status]}>
                        {statusLabel[subscription.status]}
                      </Badge>
                      <Badge variant="outline">
                        <CreditCard className="mr-1 h-3 w-3" />
                        {subscription.plan}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        {subscription.emailServer?.hostname || 'Servidor não informado'}
                      </div>
                      <div>Mensalidade: R$ {Number(subscription.monthlyPrice || 0).toFixed(2)}</div>
                      <div>Vigência até: {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:w-[320px]">
                    <Button size="sm" onClick={() => void updateStatus(subscription.id, 'ACTIVE')} disabled={subscription.status === 'ACTIVE' || updatingId === subscription.id}>Liberar</Button>
                    <Button size="sm" variant="outline" onClick={() => void updateStatus(subscription.id, 'TRIAL')} disabled={subscription.status === 'TRIAL' || updatingId === subscription.id}>Teste</Button>
                    <Button size="sm" variant="outline" onClick={() => void updateStatus(subscription.id, 'SUSPENDED')} disabled={subscription.status === 'SUSPENDED' || updatingId === subscription.id}>Suspender</Button>
                    <Button size="sm" variant="outline" className="text-red-700" onClick={() => void updateStatus(subscription.id, 'CANCELLED')} disabled={subscription.status === 'CANCELLED' || updatingId === subscription.id}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
