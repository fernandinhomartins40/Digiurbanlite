'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Send,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BarChart3,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface EmailStats {
  currentMonth: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalBounced: number;
    deliveryRate: string;
    bounceRate: string;
  };
  usage: {
    current: number;
    limit: number;
    percentage: string;
  };
  dailyStats?: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
  }>;
}

interface EmailService {
  hasEmailService: boolean;
  plan?: {
    id: string;
    name: string;
    price: number;
    emailsPerMonth: number;
  };
  server?: {
    hostname: string;
    isActive: boolean;
    subscription: {
      planConfig: {
        maxEmailsPerMonth: number;
      }
    }
  };
  accounts?: any[];
}

export default function EmailDashboardPage() {
  const { apiRequest } = useAdminAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [stats, setStats] = useState<EmailStats | null>(null);
  const [service, setService] = useState<EmailService | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar informações do serviço
      const serviceResponse = await apiRequest('/admin/email-service', {
        method: 'GET'
      });

      if (serviceResponse) {
        setService(serviceResponse);

        // Se tem serviço ativo, buscar estatísticas
        if (serviceResponse.hasEmailService) {
          const statsResponse = await apiRequest('/admin/email-service/stats', {
            method: 'GET'
          });
          if (statsResponse) {
            setStats(statsResponse);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching email data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard de email...</p>
        </div>
      </div>
    );
  }

  // Se não tem serviço de email contratado
  if (!service?.hasEmailService) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Email</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Sistema de email corporativo para o município
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <Mail className="h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">Serviço de Email não ativado</h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 sm:mb-6 max-w-md">
              Contrate um plano de email para começar a enviar emails institucionais
              pelo sistema.
            </p>
            <Button
              onClick={() => router.push('/admin/email-service')}
              className="w-full sm:w-auto"
            >
              Ver Planos Disponíveis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const usagePercentage = parseFloat(stats?.usage.percentage || '0');
  const isNearLimit = usagePercentage > 80;
  const deliveryRate = parseFloat(stats?.currentMonth.deliveryRate || '0');

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Email Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 break-words">
            Plano: {service.plan?.name} - {service.server?.hostname}
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/email/compose')}
          className="w-full sm:w-auto shrink-0"
        >
          <Send className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Escrever Email</span>
          <span className="sm:hidden">Novo Email</span>
        </Button>
      </div>

      {/* Alerta de uso */}
      {isNearLimit && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-orange-900 text-sm sm:text-base">
                Atenção: Você está próximo do limite mensal
              </p>
              <p className="text-xs sm:text-sm text-orange-700 break-words">
                {stats?.usage.current.toLocaleString()} de {stats?.usage.limit.toLocaleString()} emails enviados ({usagePercentage.toFixed(1)}%)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de estatísticas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Emails Enviados</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {stats?.currentMonth.totalSent.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground break-words">
              {stats?.usage.current.toLocaleString()} / {stats?.usage.limit.toLocaleString()} este mês
            </p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${isNearLimit ? 'bg-orange-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Taxa de Entrega</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {stats?.currentMonth.deliveryRate || '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.currentMonth.totalDelivered.toLocaleString() || 0} entregues
            </p>
            <div className="flex items-center gap-1 mt-2">
              {deliveryRate >= 95 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600 shrink-0" />
                  <span className="text-xs text-green-600">Excelente</span>
                </>
              ) : deliveryRate >= 85 ? (
                <>
                  <Activity className="h-3 w-3 text-blue-600 shrink-0" />
                  <span className="text-xs text-blue-600">Boa</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-orange-600 shrink-0" />
                  <span className="text-xs text-orange-600">Atenção</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Falhas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {stats?.currentMonth.totalFailed || 0}
            </div>
            <p className="text-xs text-muted-foreground break-words">
              Bounced: {stats?.currentMonth.totalBounced || 0} ({stats?.currentMonth.bounceRate || '0%'})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Contas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {service.accounts?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Contas de email cadastradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de atividade recente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Atividade Recente</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Últimos 30 dias de envio de emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.dailyStats && stats.dailyStats.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {stats.dailyStats.slice(-7).map((day, idx) => (
                <div key={idx} className="flex items-center gap-2 sm:gap-4">
                  <div className="w-16 sm:w-24 text-xs sm:text-sm text-muted-foreground shrink-0">
                    {new Date(day.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-6 sm:h-8 bg-gray-200 rounded-full overflow-hidden flex items-center">
                      <div
                        className="h-full bg-blue-500 flex items-center justify-end pr-1 sm:pr-2"
                        style={{
                          width: `${Math.max((day.sent / (stats.usage.limit / 30)) * 100, 3)}%`
                        }}
                      >
                        <span className="text-[10px] sm:text-xs text-white font-medium">
                          {day.sent}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 sm:w-20 text-xs sm:text-sm text-right shrink-0">
                    <span className="text-green-600">{day.delivered}</span> /
                    <span className="text-red-600 ml-1">{day.failed}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <BarChart3 className="h-10 sm:h-12 w-10 sm:w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base">Nenhuma atividade registrada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/email/compose')}>
          <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
            <Send className="h-8 sm:h-10 w-8 sm:w-10 text-primary mb-2 sm:mb-3" />
            <h3 className="font-semibold mb-1 text-sm sm:text-base">Enviar Email</h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-center px-2">
              Escrever e enviar um novo email
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/email/sent')}>
          <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
            <Mail className="h-8 sm:h-10 w-8 sm:w-10 text-primary mb-2 sm:mb-3" />
            <h3 className="font-semibold mb-1 text-sm sm:text-base">Emails Enviados</h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-center px-2">
              Ver histórico de emails enviados
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/email-accounts')}>
          <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
            <Users className="h-8 sm:h-10 w-8 sm:w-10 text-primary mb-2 sm:mb-3" />
            <h3 className="font-semibold mb-1 text-sm sm:text-base">Gerenciar Contas</h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-center px-2">
              Criar e gerenciar contas de email
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
