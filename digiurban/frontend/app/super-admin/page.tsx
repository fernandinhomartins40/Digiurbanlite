'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Users,
  UserCheck,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Database,
  Activity,
  HardDrive,
  Cpu,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface DashboardStats {
  municipio: {
    nome: string;
    nomeMunicipio: string;
    uf: string;
    isActive: boolean;
    isSuspended: boolean;
    subscriptionPlan: string;
    subscriptionEnds: string | null;
  };
  users: {
    total: number;
    active: number;
    limit: number;
    percentage: number;
  };
  citizens: {
    total: number;
    active: number;
    limit: number;
    percentage: number;
  };
  protocols: {
    total: number;
    active: number;
    completed: number;
    inProgress: number;
  };
  departments: {
    total: number;
  };
}

interface SystemHealth {
  status: string;
  timestamp: string;
  database: {
    status: string;
    responseTime: number;
  };
  system: {
    uptime: number;
    memory: {
      total: number;
      free: number;
      used: number;
      usagePercent: number;
    };
    cpu: {
      cores: number;
      model: string;
    };
  };
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Atualizar a cada 1 minuto
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, healthRes] = await Promise.all([
        fetch('/api/super-admin/stats'),
        fetch('/api/super-admin/system/health')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadge = (isActive: boolean, isSuspended: boolean) => {
    if (isSuspended) {
      return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Suspenso</span>;
    }
    if (isActive) {
      return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Ativo</span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Inativo</span>;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Super Admin</h1>
        <p className="text-gray-600">Visão geral do sistema e município</p>
      </div>

      {/* Status do Município */}
      {stats?.municipio && (
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle className="text-2xl">{stats.municipio.nomeMunicipio} - {stats.municipio.uf}</CardTitle>
                  <p className="text-sm text-gray-500">{stats.municipio.nome}</p>
                </div>
              </div>
              {getStatusBadge(stats.municipio.isActive, stats.municipio.isSuspended)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Plano</p>
                <p className="text-lg font-semibold capitalize">{stats.municipio.subscriptionPlan}</p>
              </div>
              {stats.municipio.subscriptionEnds && (
                <div>
                  <p className="text-sm text-gray-500">Renovação</p>
                  <p className="text-lg font-semibold">
                    {new Date(stats.municipio.subscriptionEnds).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Status do Sistema</p>
                <p className={`text-lg font-semibold ${health?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                  {health?.status === 'healthy' ? 'Saudável' : 'Com Problemas'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Usuários */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Usuários</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.users.total || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stats && stats.users.percentage >= 90 ? 'bg-red-500' : stats && stats.users.percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(stats?.users.percentage || 0, 100)}%` }}
                  />
                </div>
              </div>
              <span className={`text-sm font-semibold ${stats ? getStatusColor(stats.users.percentage) : ''}`}>
                {stats?.users.percentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.users.active} ativos / Limite: {stats?.users.limit}
            </p>
          </CardContent>
        </Card>

        {/* Cidadãos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cidadãos</CardTitle>
            <UserCheck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.citizens.total || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stats && stats.citizens.percentage >= 90 ? 'bg-red-500' : stats && stats.citizens.percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(stats?.citizens.percentage || 0, 100)}%` }}
                  />
                </div>
              </div>
              <span className={`text-sm font-semibold ${stats ? getStatusColor(stats.citizens.percentage) : ''}`}>
                {stats?.citizens.percentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.citizens.active} ativos / Limite: {stats?.citizens.limit.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        {/* Protocolos Totais */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Protocolos</CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.protocols.total || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">
                {stats?.protocols.completed || 0} concluídos
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.protocols.active || 0} em andamento
            </p>
          </CardContent>
        </Card>

        {/* Departamentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Departamentos</CardTitle>
            <Building2 className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.departments.total || 0}</div>
            <p className="text-sm text-gray-600 mt-4">Departamentos ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Status dos Protocolos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.protocols.completed || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.protocols.total ? ((stats.protocols.completed / stats.protocols.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.protocols.inProgress || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Protocolos sendo processados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <AlertCircle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.protocols.active || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Aguardando conclusão</p>
          </CardContent>
        </Card>
      </div>

      {/* Status do Sistema */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Banco de Dados</span>
                </div>
                <p className={`text-lg font-semibold ${health.database.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {health.database.status === 'healthy' ? 'Saudável' : 'Degradado'}
                </p>
                <p className="text-xs text-gray-500">{health.database.responseTime}ms</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Uptime</span>
                </div>
                <p className="text-lg font-semibold">{formatUptime(health.system.uptime)}</p>
                <p className="text-xs text-gray-500">Tempo online</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Memória</span>
                </div>
                <p className={`text-lg font-semibold ${getStatusColor(health.system.memory.usagePercent)}`}>
                  {health.system.memory.usagePercent.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  {formatBytes(health.system.memory.used)} / {formatBytes(health.system.memory.total)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium">CPU</span>
                </div>
                <p className="text-lg font-semibold">{health.system.cpu.cores} cores</p>
                <p className="text-xs text-gray-500 truncate">{health.system.cpu.model}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
