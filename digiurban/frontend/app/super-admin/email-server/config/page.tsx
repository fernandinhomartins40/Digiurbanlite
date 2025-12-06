'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import {
  Server,
  Settings,
  Shield,
  DollarSign,
  Activity,
  Play,
  Square,
  RotateCw,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmailServerConfig, EmailServerStatus } from '@/types/email-server';

export default function EmailServerConfigPage() {
  const { toast } = useToast();
  const { apiRequest } = useSuperAdminAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverStatus, setServerStatus] = useState<EmailServerStatus | null>(null);
  const [config, setConfig] = useState<EmailServerConfig>({
    hostname: 'mail.digiurban.com',
    mxPort: 25,
    submissionPort: 587,
    maxConnections: 100,
    maxMessageSize: 50 * 1024 * 1024,
    tlsEnabled: true,
    certPath: '',
    keyPath: '',
    authRequired: true,
    isPremiumService: true,
    monthlyPrice: 99.00,
    maxEmailsPerMonth: 10000
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchServerStatus();
    }, 5000); // Atualiza status a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusData, configData] = await Promise.all([
        apiRequest('/super-admin/email-server/status', { method: 'GET' }).catch(() => null),
        apiRequest('/super-admin/email-server/config', { method: 'GET' }).catch(() => ({ config: config }))
      ]);

      if (statusData?.status) {
        setServerStatus(statusData.status);
      }

      if (configData?.config) {
        setConfig(configData.config);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as configurações do servidor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServerStatus = async () => {
    try {
      const response = await apiRequest('/super-admin/email-server/status', { method: 'GET' });
      if (response?.status) {
        setServerStatus(response.status);
      }
    } catch (error) {
      // Silently fail - não queremos mostrar toast a cada 5 segundos
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await apiRequest('/super-admin/email-server/config', {
        method: 'PUT',
        body: JSON.stringify(config)
      });

      toast({
        title: 'Configurações salvas',
        description: 'As configurações do servidor foram salvas com sucesso.',
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleServerAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      await apiRequest(`/super-admin/email-server/${action}`, { method: 'POST' });

      toast({
        title: `Servidor ${action === 'start' ? 'iniciado' : action === 'stop' ? 'parado' : 'reiniciado'}`,
        description: `O servidor foi ${action === 'start' ? 'iniciado' : action === 'stop' ? 'parado' : 'reiniciado'} com sucesso.`,
      });

      // Atualizar status após 2 segundos
      setTimeout(() => fetchServerStatus(), 2000);
    } catch (error) {
      console.error(`Error ${action} server:`, error);
      toast({
        title: 'Erro',
        description: `Não foi possível ${action === 'start' ? 'iniciar' : action === 'stop' ? 'parar' : 'reiniciar'} o servidor.`,
        variant: 'destructive',
      });
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await apiRequest('/super-admin/email-server/logs', { method: 'GET' });
      if (response?.logs) {
        setLogs(response.logs);
        setShowLogs(true);
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar logs',
        description: 'Não foi possível carregar os logs do servidor.',
        variant: 'destructive',
      });
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuração do Servidor SMTP</h1>
        <p className="text-gray-600">Configure e monitore o servidor de email do DigiUrban</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-2xl font-bold mt-1">
                  {serverStatus?.isRunning ? (
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
              </div>
              <Activity className={`w-12 h-12 ${serverStatus?.isRunning ? 'text-green-500' : 'text-gray-300'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {serverStatus?.uptime ? formatUptime(serverStatus.uptime) : '--'}
                </p>
              </div>
              <Clock className="w-12 h-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Emails</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {serverStatus?.stats?.totalEmails?.toLocaleString() || '0'}
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
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {serverStatus?.stats?.deliveryRate || '0%'}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Server Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Controle do Servidor
          </CardTitle>
          <CardDescription>Inicie, pare ou reinicie o servidor SMTP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              onClick={() => handleServerAction('start')}
              disabled={serverStatus?.isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              Iniciar Servidor
            </button>
            <button
              onClick={() => handleServerAction('stop')}
              disabled={!serverStatus?.isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Square className="w-4 h-4" />
              Parar Servidor
            </button>
            <button
              onClick={() => handleServerAction('restart')}
              disabled={!serverStatus?.isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              Reiniciar
            </button>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-auto"
            >
              <FileText className="w-4 h-4" />
              Ver Logs
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hostname
              </label>
              <input
                type="text"
                value={config.hostname}
                onChange={(e) => setConfig({ ...config, hostname: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="mail.digiurban.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porta MX
                </label>
                <input
                  type="number"
                  value={config.mxPort}
                  onChange={(e) => setConfig({ ...config, mxPort: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porta Submission
                </label>
                <input
                  type="number"
                  value={config.submissionPort}
                  onChange={(e) => setConfig({ ...config, submissionPort: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máx. Conexões
                </label>
                <input
                  type="number"
                  value={config.maxConnections}
                  onChange={(e) => setConfig({ ...config, maxConnections: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tamanho Máx. Mensagem
                </label>
                <input
                  type="text"
                  value={formatBytes(config.maxMessageSize)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Configurações de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.tlsEnabled}
                  onChange={(e) => setConfig({ ...config, tlsEnabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">TLS/SSL Habilitado</span>
              </label>
            </div>

            {config.tlsEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caminho do Certificado
                  </label>
                  <input
                    type="text"
                    value={config.certPath || ''}
                    onChange={(e) => setConfig({ ...config, certPath: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="/path/to/cert.pem"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caminho da Chave Privada
                  </label>
                  <input
                    type="text"
                    value={config.keyPath || ''}
                    onChange={(e) => setConfig({ ...config, keyPath: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="/path/to/key.pem"
                  />
                </div>
              </>
            )}

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.authRequired}
                  onChange={(e) => setConfig({ ...config, authRequired: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Autenticação Obrigatória</span>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Configurações Premium
          </CardTitle>
          <CardDescription>Configure o serviço de email premium para os municípios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={config.isPremiumService}
                  onChange={(e) => setConfig({ ...config, isPremiumService: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Serviço Premium Habilitado</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Mensal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={config.monthlyPrice}
                onChange={(e) => setConfig({ ...config, monthlyPrice: parseFloat(e.target.value) })}
                disabled={!config.isPremiumService}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limite de Emails/Mês
              </label>
              <input
                type="number"
                value={config.maxEmailsPerMonth}
                onChange={(e) => setConfig({ ...config, maxEmailsPerMonth: parseInt(e.target.value) })}
                disabled={!config.isPremiumService}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Logs do Servidor
                </CardTitle>
                <button
                  onClick={() => setShowLogs(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              {logs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum log disponível</p>
              ) : (
                <div className="space-y-2 font-mono text-sm">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        log.level === 'ERROR' ? 'bg-red-50 text-red-900' :
                        log.level === 'WARN' ? 'bg-yellow-50 text-yellow-900' :
                        log.level === 'INFO' ? 'bg-blue-50 text-blue-900' :
                        'bg-gray-50 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-bold">[{log.level}]</span>
                        <span className="text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                      {log.data && (
                        <pre className="mt-1 ml-4 text-xs opacity-70">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
