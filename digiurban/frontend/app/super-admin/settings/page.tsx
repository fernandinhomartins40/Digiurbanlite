'use client';

import { useEffect, useState } from 'react';
import { SuperAdminCard } from '@/components/super-admin/SuperAdminCard';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import {
  Settings,
  Flag,
  Gauge,
  Plug,
  Bell,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';

interface GlobalSettings {
  platformName: string;
  logoUrl: string;
  primaryColor: string;
  defaultLanguage: string;
  timezone: string;
}

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetTenants: string[];
  description: string;
}

interface Limit {
  key: string;
  name: string;
  value: number;
  description: string;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  config: Record<string, string>;
}

interface NotificationSettings {
  criticalAlertsEmail: string;
  slackWebhook: string;
  enableSlack: boolean;
  enableEmail: boolean;
  escalationMinutes: number;
}

export default function SettingsManagementPage() {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { apiRequest } = useSuperAdminAuth();
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    platformName: 'DigiUrban',
    logoUrl: '/logo.png',
    primaryColor: '#3B82F6',
    defaultLanguage: 'pt-BR',
    timezone: 'America/Sao_Paulo'
  });
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [limits, setLimits] = useState<Limit[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    criticalAlertsEmail: 'admin@digiurban.com',
    slackWebhook: '',
    enableSlack: false,
    enableEmail: true,
    escalationMinutes: 30
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'global' | 'features' | 'limits' | 'integrations' | 'notifications'>('global');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [globalData, flagsData, limitsData, integrationsData, notificationsData] = await Promise.all([
        apiRequest('/super-admin/settings/global', { method: 'GET' }).catch(() => null),
        apiRequest('/super-admin/settings/feature-flags', { method: 'GET' }).catch(() => null),
        apiRequest('/super-admin/settings/limits', { method: 'GET' }).catch(() => null),
        apiRequest('/super-admin/settings/integrations', { method: 'GET' }).catch(() => null),
        apiRequest('/super-admin/settings/notifications', { method: 'GET' }).catch(() => null)
      ]);

      if (globalData) {
        setGlobalSettings(globalData.settings || globalSettings);
      }
      if (flagsData) {
        setFeatureFlags(flagsData.flags || mockFeatureFlags);
      } else {
        setFeatureFlags(mockFeatureFlags);
      }
      if (limitsData) {
        setLimits(limitsData.limits || mockLimits);
      } else {
        setLimits(mockLimits);
      }
      if (integrationsData) {
        setIntegrations(integrationsData.integrations || mockIntegrations);
      } else {
        setIntegrations(mockIntegrations);
      }
      if (notificationsData) {
        setNotifications(notificationsData.settings || notifications);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setFeatureFlags(mockFeatureFlags);
      setLimits(mockLimits);
      setIntegrations(mockIntegrations);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGlobalSettings = async () => {
    setSaving(true);
    try {
      await apiRequest('/super-admin/settings/global', {
        method: 'PUT',
        body: JSON.stringify(globalSettings)
      });

      toast({
        title: 'Configurações salvas',
        description: 'As configurações globais foram salvas com sucesso.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erro ao salvar configurações',
        description: 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeatureFlag = async (flagId: string) => {
    const flag = featureFlags.find(f => f.id === flagId);
    if (!flag) return;

    try {
      await apiRequest(`/super-admin/settings/feature-flags/${flagId}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: !flag.enabled })
      });

      setFeatureFlags(flags =>
        flags.map(f => f.id === flagId ? { ...f, enabled: !f.enabled } : f)
      );
    } catch (error) {
      console.error('Error toggling feature flag:', error);
    }
  };

  const handleUpdateLimit = async (key: string, value: number) => {
    try {
      await apiRequest(`/super-admin/settings/limits/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value })
      });

      setLimits(lims =>
        lims.map(l => l.key === key ? { ...l, value } : l)
      );
      toast({
        title: 'Limite atualizado',
        description: 'O limite foi atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Error updating limit:', error);
      toast({
        title: 'Erro ao atualizar limite',
        description: 'Ocorreu um erro ao atualizar o limite.',
        variant: 'destructive',
      });
    }
  };

  const handleTestIntegration = async (integrationId: string) => {
    try {
      await apiRequest(`/super-admin/settings/integrations/${integrationId}/test`, {
        method: 'POST'
      });

      toast({
        title: 'Integração testada',
        description: 'A integração foi testada com sucesso!',
      });
    } catch (error) {
      console.error('Error testing integration:', error);
      toast({
        title: 'Erro ao testar integração',
        description: 'Ocorreu um erro ao testar a integração.',
        variant: 'destructive',
      });
    }
  };

  const getIntegrationStatusBadge = (status: string) => {
    const styles = {
      connected: 'bg-green-100 text-green-800',
      disconnected: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800'
    };
    const icons = {
      connected: <CheckCircle className="w-4 h-4" />,
      disconnected: <XCircle className="w-4 h-4" />,
      error: <AlertTriangle className="w-4 h-4" />
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Configurações do Sistema
            </h1>
            <p className="text-muted-foreground">
              Configurações globais, feature flags, limites e integrações
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'global', label: 'Global', icon: <Settings className="w-4 h-4" /> },
              { id: 'features', label: 'Feature Flags', icon: <Flag className="w-4 h-4" /> },
              { id: 'limits', label: 'Limites & Quotas', icon: <Gauge className="w-4 h-4" /> },
              { id: 'integrations', label: 'Integrações', icon: <Plug className="w-4 h-4" /> },
              { id: 'notifications', label: 'Notificações', icon: <Bell className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {selectedTab === 'global' && (
          <SuperAdminCard title="Configurações Globais">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Plataforma
                  </label>
                  <input
                    type="text"
                    value={globalSettings.platformName}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, platformName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL do Logo
                  </label>
                  <input
                    type="text"
                    value={globalSettings.logoUrl}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, logoUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor Primária
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={globalSettings.primaryColor}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, primaryColor: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={globalSettings.primaryColor}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, primaryColor: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idioma Padrão
                  </label>
                  <select
                    value={globalSettings.defaultLanguage}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, defaultLanguage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="pt-BR">Português (BR)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={globalSettings.timezone}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="America/Sao_Paulo">América/São Paulo (GMT-3)</option>
                    <option value="America/New_York">América/Nova York (GMT-5)</option>
                    <option value="Europe/London">Europa/Londres (GMT+0)</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleSaveGlobalSettings}
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="inline w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="inline w-4 h-4 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </button>
              </div>
            </div>
          </SuperAdminCard>
        )}

        {selectedTab === 'features' && (
          <SuperAdminCard title="Feature Flags">
            <div className="space-y-4">
              {featureFlags.map((flag) => (
                <div key={flag.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{flag.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Key: {flag.key}</p>
                    </div>
                    <button
                      onClick={() => handleToggleFeatureFlag(flag.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        flag.enabled ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          flag.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {flag.enabled && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">
                        Rollout: {flag.rolloutPercentage}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${flag.rolloutPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SuperAdminCard>
        )}

        {selectedTab === 'limits' && (
          <SuperAdminCard title="Limites e Quotas">
            <div className="space-y-4">
              {limits.map((limit) => (
                <div key={limit.key} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{limit.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{limit.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={limit.value}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value);
                          setLimits(lims =>
                            lims.map(l => l.key === limit.key ? { ...l, value: newValue } : l)
                          );
                        }}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-right"
                      />
                      <button
                        onClick={() => handleUpdateLimit(limit.key, limit.value)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Atualizar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SuperAdminCard>
        )}

        {selectedTab === 'integrations' && (
          <SuperAdminCard title="Integrações Externas">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                      <p className="text-xs text-gray-500">{integration.type}</p>
                    </div>
                    {getIntegrationStatusBadge(integration.status)}
                  </div>
                  {integration.lastSync && (
                    <p className="text-xs text-gray-500 mb-3">
                      Última sinc: {new Date(integration.lastSync).toLocaleString('pt-BR')}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTestIntegration(integration.id)}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Testar
                    </button>
                    <button
                      onClick={() => toast({
                        title: 'Funcionalidade em desenvolvimento',
                        description: 'A configuração de integrações estará disponível em breve.',
                      })}
                      className="flex-1 px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      Configurar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SuperAdminCard>
        )}

        {selectedTab === 'notifications' && (
          <SuperAdminCard title="Configurações de Notificações">
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  Configure como o sistema enviará alertas críticos para os super admins.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={notifications.enableEmail}
                      onChange={(e) => setNotifications({ ...notifications, enableEmail: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="font-medium text-gray-900">Ativar notificações por Email</span>
                  </label>
                  {notifications.enableEmail && (
                    <input
                      type="email"
                      value={notifications.criticalAlertsEmail}
                      onChange={(e) => setNotifications({ ...notifications, criticalAlertsEmail: e.target.value })}
                      placeholder="admin@digiurban.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={notifications.enableSlack}
                      onChange={(e) => setNotifications({ ...notifications, enableSlack: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="font-medium text-gray-900">Ativar notificações no Slack</span>
                  </label>
                  {notifications.enableSlack && (
                    <input
                      type="text"
                      value={notifications.slackWebhook}
                      onChange={(e) => setNotifications({ ...notifications, slackWebhook: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo de Escalação (minutos)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Tempo para escalar alerta se não for resolvido
                  </p>
                  <input
                    type="number"
                    value={notifications.escalationMinutes}
                    onChange={(e) => setNotifications({ ...notifications, escalationMinutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => toast({
                    title: 'Funcionalidade em desenvolvimento',
                    description: 'O salvamento de notificações estará disponível em breve.',
                  })}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <Save className="inline w-4 h-4 mr-2" />
                  Salvar Notificações
                </button>
              </div>
            </div>
          </SuperAdminCard>
        )}
      </div>
      <ConfirmDialog />
    </main>
  );
}

// Mock Data
const mockFeatureFlags: FeatureFlag[] = [
  {
    id: '1',
    name: 'Portal do Cidadão v2',
    key: 'citizen_portal_v2',
    enabled: true,
    rolloutPercentage: 50,
    targetTenants: ['demo', 'sp'],
    description: 'Nova versão do portal com interface redesenhada'
  },
  {
    id: '2',
    name: 'Notificações Push',
    key: 'push_notifications',
    enabled: true,
    rolloutPercentage: 100,
    targetTenants: [],
    description: 'Notificações push para aplicativo mobile'
  },
  {
    id: '3',
    name: 'Assinatura Digital',
    key: 'digital_signature',
    enabled: false,
    rolloutPercentage: 0,
    targetTenants: [],
    description: 'Assinatura digital de documentos com certificado ICP-Brasil'
  },
  {
    id: '4',
    name: 'Analytics Avançado',
    key: 'advanced_analytics',
    enabled: true,
    rolloutPercentage: 75,
    targetTenants: ['sp', 'rj', 'mg'],
    description: 'Dashboard de analytics com métricas detalhadas'
  }
];

const mockLimits: Limit[] = [
  {
    key: 'max_tenants',
    name: 'Máximo de Tenants',
    value: 100,
    description: 'Número máximo de tenants ativos na plataforma'
  },
  {
    key: 'max_users_per_tenant',
    name: 'Usuários por Tenant',
    value: 1000,
    description: 'Número máximo de usuários por tenant'
  },
  {
    key: 'max_protocols_per_month',
    name: 'Protocolos por Mês',
    value: 10000,
    description: 'Número máximo de protocolos por tenant por mês'
  },
  {
    key: 'storage_quota_gb',
    name: 'Quota de Storage (GB)',
    value: 100,
    description: 'Storage padrão por tenant em GB'
  },
  {
    key: 'api_rate_limit',
    name: 'Rate Limit API',
    value: 1000,
    description: 'Requisições por minuto por tenant'
  }
];

const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'Stripe',
    type: 'Payment Gateway',
    status: 'connected',
    lastSync: new Date(Date.now() - 3600000).toISOString(),
    config: {}
  },
  {
    id: '2',
    name: 'Twilio',
    type: 'SMS Provider',
    status: 'connected',
    lastSync: new Date(Date.now() - 7200000).toISOString(),
    config: {}
  },
  {
    id: '3',
    name: 'SendGrid',
    type: 'Email Service',
    status: 'disconnected',
    config: {}
  },
  {
    id: '4',
    name: 'Google Analytics',
    type: 'Analytics',
    status: 'error',
    lastSync: new Date(Date.now() - 86400000).toISOString(),
    config: {}
  }
];
