'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  XCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  Trash2,
  Server
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailLog {
  id: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  timestamp: string;
  data?: Record<string, any>;
}

type LogLevel = 'ALL' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

export default function EmailServerLogsPage() {
  const { toast } = useToast();
  const { apiRequest } = useSuperAdminAuth();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<EmailLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel>('ALL');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10); // segundos
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    errors: 0,
    warnings: 0,
    info: 0,
    debug: 0
  });

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedLevel !== 'ALL') {
        params.set('level', selectedLevel);
      }
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      const response = await apiRequest(`/super-admin/email-server/logs?${params}`, {
        method: 'GET'
      });

      if (response?.logs) {
        setLogs(response.logs);
        setTotalLogs(response.logs.length);

        // Calcular estatísticas
        const allLogs = response.logs;
        setStats({
          total: allLogs.length,
          errors: allLogs.filter((l: EmailLog) => l.level === 'ERROR').length,
          warnings: allLogs.filter((l: EmailLog) => l.level === 'WARN').length,
          info: allLogs.filter((l: EmailLog) => l.level === 'INFO').length,
          debug: allLogs.filter((l: EmailLog) => l.level === 'DEBUG').length
        });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Erro ao carregar logs',
        description: 'Não foi possível carregar os logs do servidor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [apiRequest, selectedLevel, limit, offset, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchLogs]);

  // Filtrar logs por busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLogs(logs);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = logs.filter(log =>
      log.message.toLowerCase().includes(term) ||
      log.level.toLowerCase().includes(term) ||
      (log.data && JSON.stringify(log.data).toLowerCase().includes(term))
    );
    setFilteredLogs(filtered);
  }, [logs, searchTerm]);

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'WARN':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'INFO':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'DEBUG':
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'WARN':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'INFO':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'DEBUG':
        return 'bg-gray-50 border-gray-200 text-gray-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-600';
      case 'WARN':
        return 'bg-yellow-600';
      case 'INFO':
        return 'bg-blue-600';
      case 'DEBUG':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  const exportLogs = (format: 'json' | 'csv') => {
    const logsToExport = filteredLogs.length > 0 ? filteredLogs : logs;

    if (format === 'json') {
      const dataStr = JSON.stringify(logsToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `email-server-logs-${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV
      const headers = ['Timestamp', 'Level', 'Message', 'Data'];
      const csvRows = [
        headers.join(','),
        ...logsToExport.map(log => [
          log.timestamp,
          log.level,
          `"${log.message.replace(/"/g, '""')}"`,
          log.data ? `"${JSON.stringify(log.data).replace(/"/g, '""')}"` : ''
        ].join(','))
      ];
      const csvStr = csvRows.join('\n');
      const dataBlob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `email-server-logs-${new Date().toISOString()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }

    toast({
      title: 'Logs exportados',
      description: `Arquivo ${format.toUpperCase()} baixado com sucesso.`,
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchLogs();
    toast({
      title: 'Logs atualizados',
      description: 'Os logs foram recarregados.',
    });
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando logs...</p>
        </div>
      </div>
    );
  }

  const displayLogs = filteredLogs.length > 0 ? filteredLogs : logs;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalLogs / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-600" />
            Logs do Servidor SMTP
          </h1>
          <p className="text-gray-600">Monitore eventos e erros do servidor de email</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-red-700 mb-1">Erros</p>
              <p className="text-3xl font-bold text-red-900">{stats.errors}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-yellow-700 mb-1">Avisos</p>
              <p className="text-3xl font-bold text-yellow-900">{stats.warnings}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-700 mb-1">Info</p>
              <p className="text-3xl font-bold text-blue-900">{stats.info}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-1">Debug</p>
              <p className="text-3xl font-bold text-gray-900">{stats.debug}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar em mensagens, níveis ou dados..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as LogLevel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Todos</option>
                <option value="ERROR">Erros</option>
                <option value="WARN">Avisos</option>
                <option value="INFO">Informação</option>
                <option value="DEBUG">Debug</option>
              </select>
            </div>

            {/* Export */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exportar
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => exportLogs('json')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </button>
                <button
                  onClick={() => exportLogs('csv')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
            </div>
          </div>

          {/* Auto Refresh Settings */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Auto-atualizar</span>
              </label>
              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value={5}>5s</option>
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                  <option value={60}>60s</option>
                </select>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              Última atualização: {new Date().toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Logs ({displayLogs.length})</span>
            {searchTerm && (
              <span className="text-sm font-normal text-gray-600">
                Mostrando resultados para: "{searchTerm}"
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayLogs.length === 0 ? (
            <div className="text-center py-12">
              <Server className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">Nenhum log encontrado</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Os logs aparecerão aqui quando o servidor gerar eventos'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayLogs.map((log) => {
                const isExpanded = expandedLogs.has(log.id);
                const hasData = log.data && Object.keys(log.data).length > 0;

                return (
                  <div
                    key={log.id}
                    className={`border rounded-lg p-4 transition-all ${getLevelColor(log.level)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getLevelIcon(log.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getLevelBadgeColor(log.level)}`}>
                              {log.level}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleString('pt-BR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                          </div>
                          {hasData && (
                            <button
                              onClick={() => toggleLogExpansion(log.id)}
                              className="flex items-center gap-1 text-xs font-medium hover:underline"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Ocultar dados
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-4 h-4" />
                                  Ver dados
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <p className="font-medium text-sm break-words">{log.message}</p>
                        {isExpanded && hasData && (
                          <div className="mt-3 p-3 bg-black bg-opacity-5 rounded border border-gray-300">
                            <pre className="text-xs overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {displayLogs.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-600">
                Mostrando {offset + 1} a {Math.min(offset + limit, totalLogs)} de {totalLogs} logs
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= totalLogs}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
