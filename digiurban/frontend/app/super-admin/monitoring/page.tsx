'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  Database,
  Clock,
  HardDrive,
  Cpu,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw
} from 'lucide-react';

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

export default function MonitoringPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => {
      fetchHealth();
    }, 30000); // Atualizar a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/super-admin/system/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Erro ao buscar health:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return <XCircle className="h-6 w-6 text-red-600" />;
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoramento do Sistema</h1>
          <p className="text-gray-600">Status e métricas em tempo real</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </span>
          <button
            onClick={fetchHealth}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Geral */}
      {health && (
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(health.status)}
                <div>
                  <CardTitle>Status Geral do Sistema</CardTitle>
                  <p className="text-sm text-gray-500">
                    {health.status === 'healthy' ? 'Todos os sistemas operando normalmente' : 'Alguns sistemas apresentam problemas'}
                  </p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${health.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {health.status === 'healthy' ? 'Saudável' : 'Degradado'}
              </span>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Métricas */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Banco de Dados</CardTitle>
              <Database className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${health.database.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'}`}>
                {health.database.status === 'healthy' ? 'Saudável' : 'Degradado'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tempo de resposta: {health.database.responseTime}ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Clock className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUptime(health.system.uptime)}</div>
              <p className="text-xs text-gray-500 mt-1">Tempo online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Memória</CardTitle>
              <HardDrive className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${health.system.memory.usagePercent >= 90 ? 'text-red-600' : health.system.memory.usagePercent >= 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                {health.system.memory.usagePercent.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatBytes(health.system.memory.used)} / {formatBytes(health.system.memory.total)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">CPU</CardTitle>
              <Cpu className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.system.cpu.cores} cores</div>
              <p className="text-xs text-gray-500 mt-1 truncate">{health.system.cpu.model}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detalhes do Sistema */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              Detalhes do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Informações de Memória</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="text-sm font-medium">{formatBytes(health.system.memory.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Usada:</span>
                    <span className="text-sm font-medium">{formatBytes(health.system.memory.used)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Livre:</span>
                    <span className="text-sm font-medium">{formatBytes(health.system.memory.free)}</span>
                  </div>
                  <div className="mt-2">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${health.system.memory.usagePercent >= 90 ? 'bg-red-500' : health.system.memory.usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(health.system.memory.usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Informações de CPU</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Núcleos:</span>
                    <span className="text-sm font-medium">{health.system.cpu.cores}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Modelo:</span>
                    <span className="text-sm font-medium truncate max-w-xs">{health.system.cpu.model}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
