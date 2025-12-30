'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import {
  Globe,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  RefreshCw,
  AlertTriangle,
  Shield,
  Key,
  Mail,
  BarChart3,
  Send,
  Search,
  Settings,
  Eye,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import { EmailDomain, DNSRecord, DKIMKeyPair, DomainStats, DNSVerificationResult } from '@/types/email-server';

export default function EmailDomainsPage() {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { apiRequest } = useSuperAdminAuth();

  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<EmailDomain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<EmailDomain | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [domainStats, setDomainStats] = useState<DomainStats | null>(null);
  const [newDomainName, setNewDomainName] = useState('');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'dns' | 'dkim' | 'stats' | 'test'>('dns');
  const [serverHostname, setServerHostname] = useState('');

  useEffect(() => {
    fetchDomains();
    fetchServerStatus();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      generateDNSRecords(selectedDomain, serverHostname);
      fetchDomainStats(selectedDomain.id);
    }
  }, [selectedDomain, serverHostname]);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/super-admin/email-server/domains', { method: 'GET' });
      if (response?.domains) {
        console.log('[DEBUG] Domains fetched from API:', response.domains);
        response.domains.forEach((d: EmailDomain) => {
          console.log('[DEBUG] Domain:', d.id, 'Name:', d.domainName);
        });
        setDomains(response.domains);
        if (response.domains.length > 0 && !selectedDomain) {
          setSelectedDomain(response.domains[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast({
        title: 'Erro ao carregar domínios',
        description: 'Não foi possível carregar a lista de domínios.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDomainStats = async (domainId: string) => {
    try {
      const response = await apiRequest(`/super-admin/email-server/domains/${domainId}/stats`, {
        method: 'GET'
      });
      if (response?.stats) {
        setDomainStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching domain stats:', error);
    }
  };

  const fetchServerStatus = async () => {
    try {
      const response = await apiRequest('/super-admin/email-server/status', { method: 'GET' });
      if (response?.status?.hostname) {
        setServerHostname(response.status.hostname);
      }
    } catch (error) {
      console.error('Error fetching server status:', error);
    }
  };

  const generateDNSRecords = (domain: EmailDomain, hostname: string) => {
    const records: DNSRecord[] = [];
    const mailHost = hostname || `mail.${domain.domainName}`;

    console.log('[DEBUG] generateDNSRecords - domainName:', domain.domainName);
    console.log('[DEBUG] generateDNSRecords - mailHost:', mailHost);

    // MX Record
    records.push({
      type: 'MX',
      name: domain.domainName,
      value: mailHost,
      priority: 10,
      status: domain.isVerified ? 'verified' : 'pending'
    });

    if (hostname && hostname !== `mail.${domain.domainName}`) {
      records.push({
        type: 'CNAME',
        name: `mail.${domain.domainName}`,
        value: hostname,
        status: domain.isVerified ? 'verified' : 'pending'
      });
    }

    // SPF Record
    if (domain.spfEnabled) {
      records.push({
        type: 'TXT',
        name: domain.domainName,
        value: domain.spfRecord || 'v=spf1 mx ~all',
        status: domain.isVerified ? 'verified' : 'pending'
      });
    }

    // DKIM Record
    if (domain.dkimEnabled && domain.dkimPublicKey) {
      const dkimRecordName = `${domain.dkimSelector}._domainkey.${domain.domainName}`;
      console.log('[DEBUG] DKIM record name:', dkimRecordName);
      records.push({
        type: 'TXT',
        name: dkimRecordName,
        value: `v=DKIM1; k=rsa; p=${domain.dkimPublicKey}`,
        status: domain.isVerified ? 'verified' : 'pending'
      });
    }

    // DMARC Record
    if (domain.dmarcEnabled && domain.dmarcPolicy) {
      const dmarcRecordName = `_dmarc.${domain.domainName}`;
      console.log('[DEBUG] DMARC record name:', dmarcRecordName);
      records.push({
        type: 'TXT',
        name: dmarcRecordName,
        value: domain.dmarcPolicy,
        status: 'pending'
      });
    }

    console.log('[DEBUG] All DNS records generated:', records);
    setDnsRecords(records);
  };

  const handleAddDomain = async () => {
    if (!newDomainName.trim()) {
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
        body: JSON.stringify({ domainName: newDomainName.trim().toLowerCase() })
      });

      if (response?.domain) {
        setDomains([...domains, response.domain]);
        setSelectedDomain(response.domain);
        setNewDomainName('');
        setShowAddDomain(false);

        toast({
          title: 'Domínio adicionado',
          description: `O domínio ${newDomainName} foi adicionado com sucesso.`,
        });
      }
    } catch (error) {
      console.error('Error adding domain:', error);
      toast({
        title: 'Erro ao adicionar domínio',
        description: 'Não foi possível adicionar o domínio.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDomain = async (domain: EmailDomain) => {
    const confirmed = await confirm({
      title: 'Confirmar exclusão',
      description: `Tem certeza que deseja excluir o domínio ${domain.domainName}? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      await apiRequest(`/super-admin/email-server/domains/${domain.id}`, {
        method: 'DELETE'
      });

      setDomains(domains.filter(d => d.id !== domain.id));
      if (selectedDomain?.id === domain.id) {
        setSelectedDomain(domains.find(d => d.id !== domain.id) || null);
      }

      toast({
        title: 'Domínio excluído',
        description: `O domínio ${domain.domainName} foi excluído com sucesso.`,
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

  const handleGenerateDKIM = async () => {
    if (!selectedDomain) return;

    try {
      const response = await apiRequest(`/super-admin/email-server/domains/${selectedDomain.id}/dkim/generate`, {
        method: 'POST'
      });

      if (response?.keyPair) {
        // Atualizar domínio com as novas chaves
        const updatedDomain = {
          ...selectedDomain,
          dkimPublicKey: response.keyPair.publicKey,
          dkimPrivateKey: response.keyPair.privateKey
        };
        setSelectedDomain(updatedDomain);
        setDomains(domains.map(d => d.id === selectedDomain.id ? updatedDomain : d));
        generateDNSRecords(updatedDomain, serverHostname);

        toast({
          title: 'Chave DKIM gerada',
          description: 'A chave DKIM foi gerada com sucesso. Adicione o registro DNS.',
        });
      }
    } catch (error) {
      console.error('Error generating DKIM:', error);
      toast({
        title: 'Erro ao gerar DKIM',
        description: 'Não foi possível gerar a chave DKIM.',
        variant: 'destructive',
      });
    }
  };

  const handleVerifyDNS = async (recordType: 'mx' | 'spf' | 'dkim' | 'dmarc' | 'all') => {
    if (!selectedDomain) return;

    setVerifying(true);
    try {
      const endpoint = recordType === 'all'
        ? `/super-admin/email-server/domains/${selectedDomain.id}/verify`
        : `/super-admin/email-server/domains/${selectedDomain.id}/verify-${recordType}`;

      const response = await apiRequest(endpoint, { method: 'POST' });

      if (response?.results) {
        const results = response.results as DNSVerificationResult[];

        // Atualizar status dos registros DNS
        const updatedRecords = dnsRecords.map(record => {
          const result = results.find(r => {
            if (record.type === 'MX') return r.recordType === 'MX';
            if (record.name.includes('_domainkey')) return r.recordType === 'DKIM';
            if (record.name.includes('_dmarc')) return r.recordType === 'DMARC';
            if (record.value.startsWith('v=spf1')) return r.recordType === 'SPF';
            return false;
          });

          if (result) {
            return {
              ...record,
              status: result.verified ? 'verified' : 'error',
              errorMessage: result.errorMessage
            } as DNSRecord;
          }
          return record;
        });

        setDnsRecords(updatedRecords);

        const allVerified = results.every(r => r.verified);
        if (allVerified) {
          toast({
            title: 'DNS verificado',
            description: 'Todos os registros DNS foram verificados com sucesso!',
          });

          // Atualizar status do domínio
          const updatedDomain = { ...selectedDomain, isVerified: true };
          setSelectedDomain(updatedDomain);
          setDomains(domains.map(d => d.id === selectedDomain.id ? updatedDomain : d));
        } else {
          const failedRecords = results.filter(r => !r.verified);
          toast({
            title: 'Verificação incompleta',
            description: `${failedRecords.length} registro(s) ainda não configurado(s) corretamente.`,
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error verifying DNS:', error);
      toast({
        title: 'Erro ao verificar DNS',
        description: 'Não foi possível verificar os registros DNS.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSendTestEmail = async (to: string) => {
    if (!selectedDomain) return;

    try {
      await apiRequest(`/super-admin/email-server/domains/${selectedDomain.id}/send-test-email`, {
        method: 'POST',
        body: JSON.stringify({
          to,
          subject: 'Email de teste - DigiUrban',
          body: 'Este é um email de teste do servidor SMTP DigiUrban.'
        })
      });

      toast({
        title: 'Email enviado',
        description: `Email de teste enviado para ${to}`,
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Erro ao enviar email',
        description: 'Não foi possível enviar o email de teste.',
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

  const filteredDomains = domains.filter(d =>
    d.domainName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando domínios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Domínios</h1>
          <p className="text-gray-600">Configure e monitore os domínios de email</p>
        </div>
        <button
          onClick={() => setShowAddDomain(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adicionar Domínio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Lista de Domínios */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5" />
                Domínios
              </CardTitle>
              <div className="mt-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar domínio..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredDomains.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    {searchQuery ? 'Nenhum domínio encontrado' : 'Nenhum domínio configurado'}
                  </p>
                ) : (
                  filteredDomains.map((domain) => (
                    <div
                      key={domain.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedDomain?.id === domain.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedDomain(domain)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm">{domain.domainName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(domain.isVerified ? 'verified' : 'pending')}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDomain(domain);
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
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedDomain ? (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b">
                <button
                  onClick={() => setActiveTab('dns')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'dns'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Registros DNS
                </button>
                <button
                  onClick={() => setActiveTab('dkim')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'dkim'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Key className="w-4 h-4 inline mr-2" />
                  DKIM & Autenticação
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'stats'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Estatísticas
                </button>
                <button
                  onClick={() => setActiveTab('test')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'test'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Send className="w-4 h-4 inline mr-2" />
                  Testes
                </button>
              </div>

              {/* DNS Records Tab */}
              {activeTab === 'dns' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Registros DNS para {selectedDomain.domainName}
                        </CardTitle>
                        <CardDescription>
                          Configure estes registros no seu provedor de DNS
                        </CardDescription>
                      </div>
                      <button
                        onClick={() => handleVerifyDNS('all')}
                        disabled={verifying}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
                        {verifying ? 'Verificando...' : 'Verificar Todos'}
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dnsRecords.map((record, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded font-mono text-sm font-bold">
                                {record.type}
                              </span>
                              {getStatusBadge(record.status)}
                            </div>
                            <button
                              onClick={() => copyToClipboard(record.value, `Registro ${record.type}`)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600 font-medium">Nome:</span>
                              <code className="ml-2 px-2 py-1 bg-gray-100 rounded font-mono text-xs">
                                {record.name}
                              </code>
                            </div>
                            {record.priority && (
                              <div>
                                <span className="text-gray-600 font-medium">Prioridade:</span>
                                <code className="ml-2 px-2 py-1 bg-gray-100 rounded font-mono text-xs">
                                  {record.priority}
                                </code>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600 font-medium">Valor:</span>
                              <code className="ml-2 px-2 py-1 bg-gray-100 rounded font-mono text-xs break-all block mt-1">
                                {record.value}
                              </code>
                            </div>
                            {record.errorMessage && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-red-800 text-xs">
                                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                                  {record.errorMessage}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* DKIM Tab */}
              {activeTab === 'dkim' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Configuração DKIM
                      </CardTitle>
                      <CardDescription>
                        DKIM adiciona assinatura digital aos emails para melhor entregabilidade
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedDomain.dkimPublicKey ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800 mb-2">
                              <Shield className="w-5 h-5" />
                              <span className="font-semibold">DKIM Configurado</span>
                            </div>
                            <p className="text-sm text-green-700">
                              Chave DKIM ativa com seletor: <code className="font-mono bg-green-100 px-2 py-0.5 rounded">{selectedDomain.dkimSelector}</code>
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Chave Pública (para DNS TXT)
                            </label>
                            <div className="flex gap-2">
                              <code className="flex-1 px-3 py-2 bg-gray-100 rounded border border-gray-300 text-xs font-mono break-all">
                                {selectedDomain.dkimPublicKey}
                              </code>
                              <button
                                onClick={() => copyToClipboard(selectedDomain.dkimPublicKey!, 'Chave pública DKIM')}
                                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={handleGenerateDKIM}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                          >
                            Gerar Nova Chave
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600 mb-4">Nenhuma chave DKIM configurada para este domínio</p>
                          <button
                            onClick={handleGenerateDKIM}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                          >
                            <Key className="w-5 h-5" />
                            Gerar Chave DKIM
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Configuração SPF</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedDomain.spfEnabled}
                              onChange={(e) => {
                                const updatedDomain = { ...selectedDomain, spfEnabled: e.target.checked };
                                setSelectedDomain(updatedDomain);
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm font-medium text-gray-700">SPF Habilitado</span>
                          </label>
                        </div>
                        {selectedDomain.spfEnabled && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Política SPF
                            </label>
                            <input
                              type="text"
                              value={selectedDomain.spfRecord || 'v=spf1 mx ~all'}
                              onChange={(e) => {
                                const updatedDomain = { ...selectedDomain, spfRecord: e.target.value };
                                setSelectedDomain(updatedDomain);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Configuração DMARC</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedDomain.dmarcEnabled}
                              onChange={(e) => {
                                const updatedDomain = { ...selectedDomain, dmarcEnabled: e.target.checked };
                                setSelectedDomain(updatedDomain);
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm font-medium text-gray-700">DMARC Habilitado</span>
                          </label>
                        </div>
                        {selectedDomain.dmarcEnabled && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Política DMARC
                            </label>
                            <input
                              type="text"
                              value={selectedDomain.dmarcPolicy || `v=DMARC1; p=none; rua=mailto:dmarc@${selectedDomain.domainName}`}
                              onChange={(e) => {
                                const updatedDomain = { ...selectedDomain, dmarcPolicy: e.target.value };
                                setSelectedDomain(updatedDomain);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Estatísticas de {selectedDomain.domainName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {domainStats ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium">Total Enviados</p>
                          <p className="text-2xl font-bold text-blue-900 mt-1">{domainStats.totalSent.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-600 font-medium">Entregues</p>
                          <p className="text-2xl font-bold text-green-900 mt-1">{domainStats.totalDelivered.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-600 font-medium">Falhados</p>
                          <p className="text-2xl font-bold text-red-900 mt-1">{domainStats.totalFailed.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-600 font-medium">Taxa de Entrega</p>
                          <p className="text-2xl font-bold text-purple-900 mt-1">{domainStats.deliveryRate.toFixed(1)}%</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-600 font-medium">Aberturas</p>
                          <p className="text-2xl font-bold text-orange-900 mt-1">{domainStats.opensCount.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-cyan-50 rounded-lg">
                          <p className="text-sm text-cyan-600 font-medium">Cliques</p>
                          <p className="text-2xl font-bold text-cyan-900 mt-1">{domainStats.clicksCount.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-indigo-50 rounded-lg">
                          <p className="text-sm text-indigo-600 font-medium">Taxa de Abertura</p>
                          <p className="text-2xl font-bold text-indigo-900 mt-1">{domainStats.openRate.toFixed(1)}%</p>
                        </div>
                        <div className="p-4 bg-pink-50 rounded-lg">
                          <p className="text-sm text-pink-600 font-medium">Taxa de Clique</p>
                          <p className="text-2xl font-bold text-pink-900 mt-1">{domainStats.clickRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">Carregando estatísticas...</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Test Tab */}
              {activeTab === 'test' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Enviar Email de Teste
                    </CardTitle>
                    <CardDescription>
                      Teste a configuração do domínio enviando um email
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email de Destino
                        </label>
                        <input
                          type="email"
                          id="test-email"
                          placeholder="exemplo@gmail.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const input = document.getElementById('test-email') as HTMLInputElement;
                          if (input?.value) {
                            handleSendTestEmail(input.value);
                          }
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Enviar Email de Teste
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-gray-500">
                  <Globe className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Selecione um domínio</p>
                  <p className="text-sm mt-2">
                    Escolha um domínio na lista ao lado para ver os detalhes
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Domain Modal */}
      {showAddDomain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Adicionar Novo Domínio</CardTitle>
              <CardDescription>Digite o nome do domínio que deseja configurar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Domínio
                  </label>
                  <input
                    type="text"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    placeholder="exemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddDomain}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddDomain(false);
                      setNewDomainName('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog />
    </div>
  );
}
