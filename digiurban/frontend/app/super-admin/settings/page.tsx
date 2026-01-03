'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Layers,
  Gauge,
  Save,
  RefreshCw,
  Building2,
  Users,
  UserCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

// Interfaces
interface MunicipalConfig {
  nome: string;
  cnpj: string;
  codigoIbge: string;
  nomeMunicipio: string;
  ufMunicipio: string;
  brasao: string | null;
  corPrimaria: string;
  subscriptionPlan: string;
  subscriptionEnds: string | null;
  paymentStatus: string;
}

interface UsageStats {
  usuariosAtivos: number;
  usuariosMax: number;
  cidadaosRegistrados: number;
  cidadaosMax: number;
  protocolosEsteMes: number;
  percentualUsuarios: number;
  percentualCidadaos: number;
}

interface Features {
  [key: string]: boolean;
}

interface Limits {
  maxUsers: {
    atual: number;
    limite: number;
    percentual: number;
  };
  maxCitizens: {
    atual: number;
    limite: number;
    percentual: number;
  };
  subscription: {
    plan: string;
    ends: string | null;
    paymentStatus: string;
  };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'municipal' | 'features' | 'limits'>('municipal');

  // Estados
  const [municipalConfig, setMunicipalConfig] = useState<MunicipalConfig | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [features, setFeatures] = useState<Features>({});
  const [limits, setLimits] = useState<Limits | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (selectedTab === 'municipal') {
        const response = await fetch('/api/super-admin/settings/municipal');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setMunicipalConfig(result.data.config);
            setUsageStats(result.data.usageStats);
          }
        }
      } else if (selectedTab === 'features') {
        const response = await fetch('/api/super-admin/settings/features');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setFeatures(result.data.features);
            setSubscriptionPlan(result.data.subscriptionPlan);
          }
        }
      } else if (selectedTab === 'limits') {
        const response = await fetch('/api/super-admin/settings/limits');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setLimits(result.data);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMunicipal = async () => {
    if (!municipalConfig) return;

    setSaving(true);
    try {
      const response = await fetch('/api/super-admin/settings/municipal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(municipalConfig)
      });

      if (response.ok) {
        toast({
          title: 'Configurações salvas',
          description: 'As configurações municipais foram atualizadas com sucesso.'
        });
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeatures = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/super-admin/settings/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      });

      if (response.ok) {
        toast({
          title: 'Módulos atualizados',
          description: 'As funcionalidades foram atualizadas com sucesso.'
        });
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os módulos.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLimits = async () => {
    if (!limits) return;

    setSaving(true);
    try {
      const response = await fetch('/api/super-admin/settings/limits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxUsers: limits.maxUsers.limite,
          maxCitizens: limits.maxCitizens.limite
        })
      });

      if (response.ok) {
        toast({
          title: 'Limites atualizados',
          description: 'Os limites foram atualizados com sucesso.'
        });
        loadData(); // Recarregar para ver percentuais atualizados
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os limites.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getProgressColor = (percentual: number) => {
    if (percentual >= 90) return 'bg-red-600';
    if (percentual >= 70) return 'bg-orange-500';
    return 'bg-green-600';
  };

  const getPlanBadge = (plan: string) => {
    const plans: Record<string, { label: string; color: string }> = {
      basic: { label: 'Básico', color: 'bg-gray-100 text-gray-800' },
      professional: { label: 'Profissional', color: 'bg-blue-100 text-blue-800' },
      enterprise: { label: 'Enterprise', color: 'bg-purple-100 text-purple-800' }
    };
    const p = plans[plan] || plans.basic;
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${p.color}`}>{p.label}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Configurações do Sistema</h1>
          <p className="text-gray-600">Gerencie as configurações do município e funcionalidades</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'municipal', label: 'Configuração Municipal', icon: <Building2 className="w-4 h-4" /> },
              { id: 'features', label: 'Módulos e Funcionalidades', icon: <Layers className="w-4 h-4" /> },
              { id: 'limits', label: 'Limites e Uso', icon: <Gauge className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab: Configuração Municipal */}
        {selectedTab === 'municipal' && municipalConfig && (
          <div className="space-y-6">
            {/* Estatísticas de Uso */}
            {usageStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Usuários Ativos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {usageStats.usuariosAtivos} / {usageStats.usuariosMax}
                        </p>
                        <p className="text-xs text-gray-500">{usageStats.percentualUsuarios}% do limite</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <UserCheck className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Cidadãos Registrados</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {usageStats.cidadaosRegistrados.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500">{usageStats.percentualCidadaos}% do limite</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Protocolos Este Mês</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {usageStats.protocolosEsteMes.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500">Crescimento mensal</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Formulário de Configuração */}
            <Card>
              <CardHeader>
                <CardTitle>Dados do Município</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Instituição
                    </label>
                    <input
                      type="text"
                      value={municipalConfig.nome}
                      onChange={(e) => setMunicipalConfig({ ...municipalConfig, nome: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      value={municipalConfig.cnpj}
                      onChange={(e) => setMunicipalConfig({ ...municipalConfig, cnpj: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Município
                    </label>
                    <input
                      type="text"
                      value={municipalConfig.nomeMunicipio}
                      onChange={(e) => setMunicipalConfig({ ...municipalConfig, nomeMunicipio: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UF
                    </label>
                    <select
                      value={municipalConfig.ufMunicipio}
                      onChange={(e) => setMunicipalConfig({ ...municipalConfig, ufMunicipio: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código IBGE
                    </label>
                    <input
                      type="text"
                      value={municipalConfig.codigoIbge}
                      onChange={(e) => setMunicipalConfig({ ...municipalConfig, codigoIbge: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor Primária
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={municipalConfig.corPrimaria || '#0066CC'}
                        onChange={(e) => setMunicipalConfig({ ...municipalConfig, corPrimaria: e.target.value })}
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={municipalConfig.corPrimaria || '#0066CC'}
                        onChange={(e) => setMunicipalConfig({ ...municipalConfig, corPrimaria: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Plano:</span>
                    {getPlanBadge(municipalConfig.subscriptionPlan)}
                  </div>
                  <Button
                    onClick={handleSaveMunicipal}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab: Módulos e Funcionalidades */}
        {selectedTab === 'features' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Módulos e Funcionalidades</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Ative ou desative os módulos disponíveis para o município
                  </p>
                </div>
                {getPlanBadge(subscriptionPlan)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(features).map(([key, enabled]) => {
                  const labels: Record<string, string> = {
                    moduloEncaminhamentosTFD: 'Módulo de Encaminhamentos TFD',
                    moduloControlePragas: 'Módulo de Controle de Pragas',
                    moduloPodaPreventivaArvores: 'Módulo de Poda Preventiva de Árvores',
                    moduloColeta: 'Módulo de Coleta',
                    moduloAgendamentos: 'Sistema de Agendamentos Online',
                    notificacoesPush: 'Notificações Push',
                    notificacoesEmail: 'Notificações por Email',
                    notificacoesSMS: 'Notificações por SMS',
                    assinaturaDigital: 'Assinatura Digital',
                    relatoriosAvancados: 'Relatórios Avançados',
                    apiExterna: 'API Externa',
                    integracaoMaps: 'Integração Google Maps',
                    integracaoSMTP: 'Integração SMTP (Email)'
                  };

                  return (
                    <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{labels[key] || key}</h3>
                      </div>
                      <button
                        onClick={() => setFeatures({ ...features, [key]: !enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                <Button
                  onClick={handleSaveFeatures}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Módulos
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab: Limites e Uso */}
        {selectedTab === 'limits' && limits && (
          <div className="space-y-6">
            {/* Alerta de Plano */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Plano: {limits.subscription.plan}</h3>
                <p className="text-sm text-blue-800">
                  {limits.subscription.ends
                    ? `Válido até ${new Date(limits.subscription.ends).toLocaleDateString('pt-BR')}`
                    : 'Sem data de expiração'
                  }
                </p>
              </div>
            </div>

            {/* Limite de Usuários */}
            <Card>
              <CardHeader>
                <CardTitle>Limite de Usuários Administradores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">
                        {limits.maxUsers.atual} / {limits.maxUsers.limite}
                      </p>
                      <p className="text-sm text-gray-600">usuários ativos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{limits.maxUsers.percentual}%</p>
                      <p className="text-sm text-gray-600">utilizado</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getProgressColor(limits.maxUsers.percentual)}`}
                      style={{ width: `${Math.min(limits.maxUsers.percentual, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Novo limite:</label>
                    <input
                      type="number"
                      value={limits.maxUsers.limite}
                      onChange={(e) => setLimits({
                        ...limits,
                        maxUsers: { ...limits.maxUsers, limite: parseInt(e.target.value) || 0 }
                      })}
                      min={limits.maxUsers.atual}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Limite de Cidadãos */}
            <Card>
              <CardHeader>
                <CardTitle>Limite de Cidadãos Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">
                        {limits.maxCitizens.atual.toLocaleString('pt-BR')} / {limits.maxCitizens.limite.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-600">cidadãos registrados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{limits.maxCitizens.percentual}%</p>
                      <p className="text-sm text-gray-600">utilizado</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getProgressColor(limits.maxCitizens.percentual)}`}
                      style={{ width: `${Math.min(limits.maxCitizens.percentual, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Novo limite:</label>
                    <input
                      type="number"
                      value={limits.maxCitizens.limite}
                      onChange={(e) => setLimits({
                        ...limits,
                        maxCitizens: { ...limits.maxCitizens, limite: parseInt(e.target.value) || 0 }
                      })}
                      min={limits.maxCitizens.atual}
                      className="w-40 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveLimits}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Limites
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
