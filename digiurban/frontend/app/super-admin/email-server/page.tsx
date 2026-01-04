'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import Link from 'next/link';
import {
  Mail,
  Server,
  Globe,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  ArrowRight,
  Settings,
  FileText,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmailServerStatus } from '@/types/email-server';

interface DashboardStats {
  server: {
    isRunning: boolean;
    uptime: number;
    hostname: string;
  };
  domains: {
    total: number;
    verified: number;
    pending: number;
  };
  emails: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    queued: number;
    deliveryRate: number;
  };
  recentActivity: {
    timestamp: string;
    type: string;
    message: string;
    status: 'success' | 'error' | 'warning' | 'info';
  }[];
}

export default function EmailServerDashboard() {
  const { toast } = useToast();
  const { apiRequest } = useSuperAdminAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [serverStatus, setServerStatus] = useState<EmailServerStatus | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000); // Atualiza a cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statusResponse, statsResponse] = await Promise.all([
        apiRequest('/super-admin/email-server/status', { method: 'GET' }).catch(() => null),
        apiRequest('/super-admin/email-server/dashboard-stats', { method: 'GET' }).catch(() => null)
      ]);

      if (statusResponse?.status) {
        setServerStatus(statusResponse.status);
      }

      if (statsResponse?.stats) {
        setStats(statsResponse.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const isServerRunning = serverStatus?.isRunning || stats?.server?.isRunning;
  const deliveryRate = stats?.emails?.deliveryRate || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Mail className="w-8 h-8 text-blue-600" />
          Servidor de Email - Dashboard
        </h1>
        <p className="text-gray-600">Visão geral do servidor SMTP DigiUrban</p>
      </div>

      {/* Status Alert */}
      {!isServerRunning && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Servidor Offline</h3>
              <p className="text-sm text-red-700">O servidor SMTP está parado. Acesse as configurações para iniciá-lo.</p>
            </div>
            <Link
              href="/super-admin/email-server/config"
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Gerenciar Servidor
            </Link>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status do Servidor</p>
                <p className="text-2xl font-bold mt-1">
                  {isServerRunning ? (
                    <span className="text-green-600 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6" />
                      Online
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-2">
                      <XCircle className="w-6 h-6" />
                      Offline
                    </span>
                  )}
                </p>
                {isServerRunning && stats?.server?.uptime && (
                  <p className="text-xs text-gray-500 mt-1">
                    Uptime: {formatUptime(stats.server.uptime)}
                  </p>
                )}
              </div>
              <Activity className={`w-12 h-12 ${isServerRunning ? 'text-green-500' : 'text-gray-300'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Domínios</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {stats?.domains?.verified || 0} / {stats?.domains?.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Verificados</p>
              </div>
              <Globe className="w-12 h-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Emails</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {(stats?.emails?.total || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.emails?.queued || 0} na fila
                </p>
              </div>
              <Mail className="w-12 h-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Entrega</p>
                <p className="text-2xl font-bold mt-1 text-gray-900 flex items-center gap-2">
                  {deliveryRate.toFixed(1)}%
                  {deliveryRate >= 95 ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.emails?.delivered || 0} entregues
                </p>
              </div>
              <BarChart3 className="w-12 h-12 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Emails</CardTitle>
            <CardDescription>Visão geral do processamento de emails</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="font-medium text-gray-700">Total Processados</span>
                </div>
                <span className="font-bold text-gray-900">{(stats?.emails?.total || 0).toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="font-medium text-gray-700">Entregues</span>
                </div>
                <span className="font-bold text-gray-900">{(stats?.emails?.delivered || 0).toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                  <span className="font-medium text-gray-700">Na Fila</span>
                </div>
                <span className="font-bold text-gray-900">{(stats?.emails?.queued || 0).toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span className="font-medium text-gray-700">Falhados</span>
                </div>
                <span className="font-bold text-gray-900">{(stats?.emails?.failed || 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimos eventos do servidor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'error' ? 'bg-red-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(activity.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhuma atividade recente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/super-admin/email-server/config">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Configuração do Servidor</h3>
                  <p className="text-sm text-gray-600 mt-1">Configure portas, TLS e limites</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/super-admin/email-server/domains">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Gerenciar Domínios</h3>
                  <p className="text-sm text-gray-600 mt-1">Configure DNS, DKIM e SPF</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/super-admin/email-server/logs">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Logs do Servidor</h3>
                  <p className="text-sm text-gray-600 mt-1">Visualize logs e eventos</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Server Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Informações do Servidor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Hostname</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {stats?.server?.hostname || serverStatus?.hostname || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Portas</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                MX: {serverStatus?.ports?.mx || 25} | Submission: {serverStatus?.ports?.submission || 587}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Conexões Ativas</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {serverStatus?.connections?.active || 0} / {serverStatus?.connections?.total || 100}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
