'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import {
  Shield,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Activity,
  Database,
  Settings,
  FileText,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Mail,
  Server
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  status: 'success' | 'failed' | 'warning';
  ipAddress: string;
  userAgent: string;
  tenantId?: string;
  tenantName?: string;
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  metadata?: Record<string, any>;
}

interface AuditStats {
  totalActions: number;
  successRate: number;
  failedActions: number;
  criticalActions: number;
  uniqueUsers: number;
  uniqueTenants: number;
}

export default function AuditLogPage() {
  const { apiRequest } = useSuperAdminAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'warning'>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterResource, setFilterResource] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'1h' | '24h' | '7d' | '30d' | 'all'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Dados reais da API

  useEffect(() => {
    loadAuditData();
  }, [router, dateRange, filterStatus, filterAction, filterResource]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAuditData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      // Construir query params
      const params = new URLSearchParams({
        dateRange,
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterAction !== 'all' && { action: filterAction }),
        ...(filterResource !== 'all' && { resource: filterResource })
      });

      // Buscar logs e estatísticas em paralelo
      const [logsResponse, statsResponse] = await Promise.all([
        fetch(`/api/super-admin/audit?${params.toString()}`),
        fetch(`/api/super-admin/audit/stats?dateRange=${dateRange}`)
      ]);

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setLogs(logsData.data?.logs || []);
      } else {
        console.error('Erro ao buscar logs:', await logsResponse.text());
        setLogs([]);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || null);
      } else {
        console.error('Erro ao buscar estatísticas:', await statsResponse.text());
        setStats(null);
      }
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
      setLogs([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv' = 'json') => {
    try {
      const response = await fetch('/api/super-admin/audit/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format,
          dateRange,
          filters: {
            status: filterStatus !== 'all' ? filterStatus : undefined,
            action: filterAction !== 'all' ? filterAction : undefined,
            resource: filterResource !== 'all' ? filterResource : undefined
          }
        })
      });

      if (!response.ok) {
        console.error('Erro ao exportar logs');
        return;
      }

      // Criar blob e fazer download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao exportar logs de auditoria:', error);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return <UserPlus className="w-4 h-4" />;
    if (action.includes('delete')) return <UserMinus className="w-4 h-4" />;
    if (action.includes('update')) return <Edit className="w-4 h-4" />;
    if (action.includes('suspend')) return <Lock className="w-4 h-4" />;
    if (action.includes('restore')) return <Database className="w-4 h-4" />;
    if (action.includes('email')) return <Mail className="w-4 h-4" />;
    if (action.includes('settings')) return <Settings className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Sucesso
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Falhou
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            Aviso
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleString('pt-BR');
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.tenantName && log.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesAction = filterAction === 'all' || log.action.startsWith(filterAction);
    const matchesResource = filterResource === 'all' || log.resource === filterResource;

    return matchesSearch && matchesStatus && matchesAction && matchesResource;
  });

  const uniqueActions = Array.from(new Set(logs.map(log => log.action.split('.')[0])));
  const uniqueResources = Array.from(new Set(logs.map(log => log.resource)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando logs de auditoria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-indigo-600" />
                Audit Log
              </h1>
              <p className="text-gray-600 mt-2">
                Monitoramento completo de ações administrativas e segurança
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Auto-refresh (30s)
              </label>
              <button
                onClick={loadAuditData}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        handleExport('json');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Exportar JSON
                    </button>
                    <button
                      onClick={() => {
                        handleExport('csv');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2 border-t border-gray-100"
                    >
                      <FileText className="w-4 h-4" />
                      Exportar CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Total de Ações</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalActions}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Ações Falhadas</p>
              <p className="text-2xl font-bold text-red-600">{stats.failedActions}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Ações Críticas</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.criticalActions}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Usuários Únicos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueUsers}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Tenants Afetados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueTenants}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por usuário, ação, tenant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="1h">Última 1 hora</option>
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="all">Todos</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todos os status</option>
                <option value="success">Sucesso</option>
                <option value="failed">Falhou</option>
                <option value="warning">Aviso</option>
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todas as ações</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum log encontrado com os filtros aplicados</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-indigo-300 transition-colors cursor-pointer"
                onClick={() => handleViewDetails(log)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${
                      log.status === 'success' ? 'bg-green-100 text-green-600' :
                      log.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{log.action}</h3>
                        {getStatusBadge(log.status)}
                        {log.action.includes('delete') || log.action.includes('suspend') ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Crítico
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{log.userName} ({log.userEmail})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          <span>{log.resource} · {log.resourceId}</span>
                        </div>
                        {log.tenantName && (
                          <div className="flex items-center gap-2">
                            <Server className="w-4 h-4" />
                            <span>Tenant: {log.tenantName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(log.timestamp)} · IP: {log.ipAddress}</span>
                        </div>
                      </div>
                      {log.changes && log.changes.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-700 mb-2">Alterações:</p>
                          <div className="space-y-1">
                            {log.changes.map((change, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                <span className="font-medium">{change.field}:</span>{' '}
                                <span className="text-red-600">{change.oldValue}</span> →{' '}
                                <span className="text-green-600">{change.newValue}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {log.metadata && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs font-medium text-blue-900 mb-1">Metadata:</p>
                          <pre className="text-xs text-blue-800 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(log);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-indigo-900">Conformidade e Segurança</h3>
              <p className="text-indigo-700 text-sm mt-1">
                Todos os logs de auditoria são armazenados de forma imutável e criptografada por no mínimo 7 anos,
                em conformidade com LGPD e requisitos de compliance. Logs críticos (delete, suspend) são mantidos indefinidamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Detalhes do Log</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">ID</label>
                <p className="text-gray-900 font-mono text-sm">{selectedLog.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Timestamp</label>
                <p className="text-gray-900">{new Date(selectedLog.timestamp).toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Usuário</label>
                <p className="text-gray-900">{selectedLog.userName} ({selectedLog.userEmail})</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Ação</label>
                <p className="text-gray-900">{selectedLog.action}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Recurso</label>
                <p className="text-gray-900">{selectedLog.resource} · {selectedLog.resourceId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">IP Address</label>
                <p className="text-gray-900 font-mono text-sm">{selectedLog.ipAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">User Agent</label>
                <p className="text-gray-900 text-sm">{selectedLog.userAgent}</p>
              </div>
              {selectedLog.tenantName && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Tenant</label>
                  <p className="text-gray-900">{selectedLog.tenantName}</p>
                </div>
              )}
              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Alterações</label>
                  <div className="mt-2 space-y-2">
                    {selectedLog.changes.map((change, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">{change.field}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="text-red-600">{change.oldValue}</span> →{' '}
                          <span className="text-green-600">{change.newValue}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedLog.metadata && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Metadata</label>
                  <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
