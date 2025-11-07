'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import {
  Mail,
  Server,
  Key,
  Globe,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  RefreshCw,
  AlertTriangle,
  Shield,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';

interface Domain {
  id: string;
  domain_name: string;
  is_verified: boolean;
  verified_at?: string;
  dkim_enabled: boolean;
  spf_enabled: boolean;
  created_at: string;
}

interface DKIMKey {
  id: string;
  domain_id: string;
  selector: string;
  public_key: string;
  is_active: boolean;
}

interface SMTPConfig {
  hostname: string;
  mxPort: number;
  submissionPort: number;
  tlsEnabled: boolean;
  maxConnections: number;
  maxMessageSize: number;
}

interface DNSRecord {
  type: 'MX' | 'A' | 'TXT';
  name: string;
  value: string;
  priority?: number;
  status: 'pending' | 'verified' | 'error';
}

export default function EmailServerPage() {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { apiRequest } = useSuperAdminAuth();

  const [domains, setDomains] = useState<Domain[]>([]);
  const [dkimKeys, setDkimKeys] = useState<DKIMKey[]>([]);
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>({
    hostname: 'mail.digiurban.com',
    mxPort: 25,
    submissionPort: 587,
    tlsEnabled: true,
    maxConnections: 100,
    maxMessageSize: 50 * 1024 * 1024 // 50MB
  });

  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);

  useEffect(() => {
    fetchEmailServerData();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      generateDNSRecords(selectedDomain);
    }
  }, [selectedDomain, dkimKeys]);

  const fetchEmailServerData = async () => {
    setLoading(true);
    try {
      const [domainsData, dkimData, configData] = await Promise.all([
        apiRequest('/super-admin/email-server/domains', { method: 'GET' }).catch(() => ({ domains: [] })),
        apiRequest('/super-admin/email-server/dkim', { method: 'GET' }).catch(() => ({ keys: [] })),
        apiRequest('/super-admin/email-server/config', { method: 'GET' }).catch(() => ({ config: smtpConfig }))
      ]);

      setDomains(domainsData.domains || []);
      setDkimKeys(dkimData.keys || []);
      if (configData.config) {
        setSmtpConfig(configData.config);
      }
    } catch (error) {
      console.error('Error fetching email server data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados do servidor de email.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDNSRecords = (domainName: string) => {
    const domain = domains.find(d => d.domain_name === domainName);
    const dkimKey = dkimKeys.find(k => k.domain_id === domain?.id && k.is_active);

    const records: DNSRecord[] = [
      {
        type: 'MX',
        name: domainName,
        value: smtpConfig.hostname,
        priority: 10,
        status: domain?.is_verified ? 'verified' : 'pending'
      },
      {
        type: 'A',
        name: smtpConfig.hostname,
        value: '192.168.1.100', // TODO: Obter IP real do servidor
        status: 'pending'
      },
      {
        type: 'TXT',
        name: domainName,
        value: 'v=spf1 mx ~all',
        status: domain?.spf_enabled ? 'verified' : 'pending'
      }
    ];

    if (dkimKey) {
      records.push({
        type: 'TXT',
        name: `${dkimKey.selector}._domainkey.${domainName}`,
        value: `v=DKIM1; k=rsa; p=${dkimKey.public_key}`,
        status: domain?.dkim_enabled ? 'verified' : 'pending'
      });
    }

    setDnsRecords(records);
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast({
        title: 'Domínio inválido',
        description: 'Por favor, insira um nome de domínio válido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiRequest('/super-admin/email-server/domains', {
        method: 'POST',
        body: JSON.stringify({ domain_name: newDomain.trim().toLowerCase() })
      });

      setDomains([...domains, response.domain]);
      setNewDomain('');
      setShowAddDomain(false);

      toast({
        title: 'Domínio adicionado',
        description: `O domínio ${newDomain} foi adicionado com sucesso.`,
      });
    } catch (error) {
      console.error('Error adding domain:', error);
      toast({
        title: 'Erro ao adicionar domínio',
        description: 'Não foi possível adicionar o domínio.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    const confirmed = await confirm({
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o domínio ${domainName}? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      await apiRequest(`/super-admin/email-server/domains/${domainId}`, {
        method: 'DELETE'
      });

      setDomains(domains.filter(d => d.id !== domainId));
      if (selectedDomain === domainName) {
        setSelectedDomain(null);
      }

      toast({
        title: 'Domínio excluído',
        description: `O domínio ${domainName} foi excluído com sucesso.`,
      });
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast({
        title: 'Erro ao excluir domínio',
        description: 'Não foi possível excluir o domínio.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateDKIM = async (domainId: string, domainName: string) => {
    try {
      const response = await apiRequest('/super-admin/email-server/dkim/generate', {
        method: 'POST',
        body: JSON.stringify({ domain_id: domainId })
      });

      setDkimKeys([...dkimKeys, response.key]);

      toast({
        title: 'DKIM gerado',
        description: `Chave DKIM gerada para ${domainName}.`,
      });
    } catch (error) {
      console.error('Error generating DKIM:', error);
      toast({
        title: 'Erro ao gerar DKIM',
        description: 'Não foi possível gerar a chave DKIM.',
        variant: 'destructive',
      });
    }
  };

  const handleVerifyDomain = async (domainId: string, domainName: string) => {
    try {
      const response = await apiRequest(`/super-admin/email-server/domains/${domainId}/verify`, {
        method: 'POST'
      });

      if (response.verified) {
        setDomains(domains.map(d =>
          d.id === domainId ? { ...d, is_verified: true, verified_at: new Date().toISOString() } : d
        ));

        toast({
          title: 'Domínio verificado',
          description: `O domínio ${domainName} foi verificado com sucesso!`,
        });
      } else {
        toast({
          title: 'Verificação falhou',
          description: 'Os registros DNS ainda não foram configurados corretamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      toast({
        title: 'Erro ao verificar domínio',
        description: 'Não foi possível verificar o domínio.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveConfig = async () => {
    try {
      await apiRequest('/super-admin/email-server/config', {
        method: 'PUT',
        body: JSON.stringify(smtpConfig)
      });

      toast({
        title: 'Configurações salvas',
        description: 'As configurações do servidor SMTP foram salvas com sucesso.',
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erro ao salvar configurações',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    };
    const icons = {
      verified: <CheckCircle className="w-4 h-4" />,
      pending: <AlertTriangle className="w-4 h-4" />,
      error: <XCircle className="w-4 h-4" />
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status === 'verified' ? 'Verificado' : status === 'pending' ? 'Pendente' : 'Erro'}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2 flex items-center gap-3">
              <Mail className="w-10 h-10" />
              Servidor de Email
            </h1>
            <p className="text-muted-foreground">
              Configuração de DNS, domínios e servidor SMTP
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Domínios */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Domínios
                  </CardTitle>
                  <button
                    onClick={() => setShowAddDomain(true)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <CardDescription>Domínios configurados para envio de email</CardDescription>
              </CardHeader>
              <CardContent>
                {showAddDomain && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <input
                      type="text"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="exemplo.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddDomain}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Adicionar
                      </button>
                      <button
                        onClick={() => {
                          setShowAddDomain(false);
                          setNewDomain('');
                        }}
                        className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {domains.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Nenhum domínio configurado
                    </p>
                  ) : (
                    domains.map((domain) => (
                      <div
                        key={domain.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedDomain === domain.domain_name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedDomain(domain.domain_name)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{domain.domain_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(domain.is_verified ? 'verified' : 'pending')}
                            </div>
                            {domain.verified_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                Verificado em {new Date(domain.verified_at).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDomain(domain.id, domain.domain_name);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configurações SMTP */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuração SMTP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hostname
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.hostname}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, hostname: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Porta MX
                      </label>
                      <input
                        type="number"
                        value={smtpConfig.mxPort}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, mxPort: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Porta Submission
                      </label>
                      <input
                        type="number"
                        value={smtpConfig.submissionPort}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, submissionPort: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={smtpConfig.tlsEnabled}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, tlsEnabled: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">TLS/SSL Habilitado</span>
                    </label>
                  </div>

                  <button
                    onClick={handleSaveConfig}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - DNS Records */}
          <div className="lg:col-span-2">
            {selectedDomain ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Server className="w-5 h-5" />
                          Registros DNS para {selectedDomain}
                        </CardTitle>
                        <CardDescription>
                          Configure estes registros no seu provedor de DNS
                        </CardDescription>
                      </div>
                      <button
                        onClick={() => {
                          const domain = domains.find(d => d.domain_name === selectedDomain);
                          if (domain) handleVerifyDomain(domain.id, domain.domain_name);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Verificar DNS
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dnsRecords.map((record, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded font-mono text-sm font-bold">
                                {record.type}
                              </span>
                              {getStatusBadge(record.status)}
                            </div>
                            <button
                              onClick={() => copyToClipboard(record.value, `Registro ${record.type}`)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">Nome:</span>
                              <code className="ml-2 px-2 py-1 bg-gray-100 rounded font-mono text-xs">
                                {record.name}
                              </code>
                            </div>
                            {record.priority && (
                              <div>
                                <span className="text-gray-600">Prioridade:</span>
                                <code className="ml-2 px-2 py-1 bg-gray-100 rounded font-mono text-xs">
                                  {record.priority}
                                </code>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">Valor:</span>
                              <code className="ml-2 px-2 py-1 bg-gray-100 rounded font-mono text-xs break-all block mt-1">
                                {record.value}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* DKIM Configuration */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Autenticação DKIM
                    </CardTitle>
                    <CardDescription>
                      DKIM adiciona assinatura digital aos emails para melhor entregabilidade
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const domain = domains.find(d => d.domain_name === selectedDomain);
                      const dkimKey = dkimKeys.find(k => k.domain_id === domain?.id && k.is_active);

                      return dkimKey ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800 mb-2">
                              <Shield className="w-5 h-5" />
                              <span className="font-semibold">DKIM Configurado</span>
                            </div>
                            <p className="text-sm text-green-700">
                              Chave DKIM ativa com seletor: <code className="font-mono">{dkimKey.selector}</code>
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Chave Pública (para DNS TXT)
                            </label>
                            <div className="flex gap-2">
                              <code className="flex-1 px-3 py-2 bg-gray-100 rounded border border-gray-300 text-xs font-mono break-all">
                                {dkimKey.public_key}
                              </code>
                              <button
                                onClick={() => copyToClipboard(dkimKey.public_key, 'Chave pública DKIM')}
                                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-600 mb-4">Nenhuma chave DKIM configurada para este domínio</p>
                          <button
                            onClick={() => {
                              if (domain) handleGenerateDKIM(domain.id, domain.domain_name);
                            }}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                          >
                            <Key className="w-5 h-5" />
                            Gerar Chave DKIM
                          </button>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-16">
                  <div className="text-center text-gray-500">
                    <Mail className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">Selecione um domínio</p>
                    <p className="text-sm mt-2">
                      Escolha um domínio na lista ao lado para ver os registros DNS
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog />
    </main>
  );
}
