'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign,
  TrendingUp,
  Users,
  Mail,
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface BillingStats {
  totalRevenue: number;
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  subscriptionsByPlan: Record<string, number>;
  pendingInvoices: number;
  paidInvoices: number;
  totalInvoiceAmount: number;
}

export default function EmailBillingDashboard() {
  const { apiRequest } = useSuperAdminAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BillingStats>({
    totalRevenue: 0,
    mrr: 0,
    arr: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    subscriptionsByPlan: {},
    pendingInvoices: 0,
    paidInvoices: 0,
    totalInvoiceAmount: 0
  });

  useEffect(() => {
    fetchBillingStats();
  }, []);

  const fetchBillingStats = async () => {
    try {
      setLoading(true);

      // Buscar todas as subscriptions
      const subscriptionsResponse = await apiRequest('/super-admin/email-subscriptions', {
        method: 'GET'
      });

      if (subscriptionsResponse) {
        calculateStats(subscriptionsResponse.subscriptions || []);
      }
    } catch (error) {
      console.error('Error fetching billing stats:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as estatísticas de billing',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (subscriptions: any[]) => {
    const active = subscriptions.filter(s => s.status === 'ACTIVE');
    const trial = subscriptions.filter(s => s.status === 'TRIAL');

    const mrr = active.reduce((sum, s) => sum + parseFloat(s.monthlyPrice), 0);
    const arr = mrr * 12;

    const byPlan = subscriptions.reduce((acc, s) => {
      acc[s.plan] = (acc[s.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      totalRevenue: mrr,
      mrr,
      arr,
      activeSubscriptions: active.length,
      trialSubscriptions: trial.length,
      subscriptionsByPlan: byPlan,
      pendingInvoices: 0, // TODO: Implementar quando tiver invoices
      paidInvoices: 0,
      totalInvoiceAmount: 0
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-600" />
          Billing - Email Service
        </h1>
        <p className="text-gray-600 mt-2">
          Estatísticas financeiras do serviço de email
        </p>
      </div>

      {/* Receita */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">MRR</p>
                <p className="text-sm text-green-600">Receita Mensal Recorrente</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  {formatCurrency(stats.mrr)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">ARR</p>
                <p className="text-sm text-blue-600">Receita Anual Recorrente</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  {formatCurrency(stats.arr)}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Receita Total</p>
                <p className="text-sm text-purple-600">Faturamento acumulado</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assinaturas Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.activeSubscriptions}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Em Trial</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.trialSubscriptions}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faturas Pagas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.paidInvoices}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faturas Pendentes</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.pendingInvoices}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Plano */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Plano</CardTitle>
          <CardDescription>
            Número de assinaturas em cada plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.subscriptionsByPlan).map(([plan, count]) => (
              <div key={plan} className="border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">{plan}</p>
                <p className="text-3xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {((count / (stats.activeSubscriptions + stats.trialSubscriptions)) * 100).toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projeções */}
      <Card>
        <CardHeader>
          <CardTitle>Projeções de Crescimento</CardTitle>
          <CardDescription>
            Estimativas baseadas nas taxas atuais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="text-sm text-gray-600 mb-1">Projeção 6 meses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.arr / 2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Com {Math.ceil(stats.activeSubscriptions * 1.5)} assinaturas
              </p>
            </div>

            <div className="border-l-4 border-green-600 pl-4">
              <p className="text-sm text-gray-600 mb-1">Projeção 1 ano</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.arr)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Com {Math.ceil(stats.activeSubscriptions * 2)} assinaturas
              </p>
            </div>

            <div className="border-l-4 border-purple-600 pl-4">
              <p className="text-sm text-gray-600 mb-1">Projeção 2 anos</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.arr * 1.8)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Com {Math.ceil(stats.activeSubscriptions * 3)} assinaturas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
