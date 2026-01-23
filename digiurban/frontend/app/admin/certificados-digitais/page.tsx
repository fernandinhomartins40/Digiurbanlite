'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CitizenAutocomplete } from '@/components/admin/CitizenAutocomplete';
import { CertificateRequestsManager } from '@/components/admin/CertificateRequestsManager';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  Shield,
  Plus,
  Search,
  Filter,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  X,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DigitalCertificate {
  id: string;
  userId: string;
  userName?: string;
  type: 'SERVER' | 'CITIZEN' | 'SYSTEM';
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  serialNumber: string;
  commonName: string;
  organization: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  thumbprint: string;
  _count?: {
    signatures: number;
  };
}

interface Citizen {
  id: string;
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
}

export default function CertificadosDigitaisPage() {
  const { user } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('certificates');
  const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<DigitalCertificate | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [issueType, setIssueType] = useState<'citizen' | 'server'>('citizen');
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [privateKey, setPrivateKey] = useState<string>('');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/certificates', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar certificados');
      }

      const data = await response.json();

      if (data.success) {
        setCertificates(data.certificates || []);
      } else {
        throw new Error(data.message || 'Erro ao carregar certificados');
      }
    } catch (error) {
      console.error('Erro ao buscar certificados:', error);
      toast.error('Erro ao carregar certificados');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();

    if (isExpired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Expirado
        </Badge>
      );
    }

    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Ativo
          </Badge>
        );
      case 'REVOKED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Revogado
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Expirado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      SERVER: 'bg-blue-100 text-blue-700',
      CITIZEN: 'bg-purple-100 text-purple-700',
      SYSTEM: 'bg-gray-100 text-gray-700'
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100'}>
        {type}
      </Badge>
    );
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return 'Expirado';
    if (diff === 0) return 'Expira hoje';
    if (diff === 1) return 'Expira amanhã';
    if (diff <= 30) return `${diff} dias restantes`;
    return `${Math.ceil(diff / 30)} meses`;
  };

  const handleIssueCertificate = async (formData: {
    certificateType: 'SERVER' | 'CITIZEN' | 'SYSTEM';
    validityYears: number;
    department?: string;
    userId?: string;
    commonName?: string;
    email?: string;
  }) => {
    // Validar se é emissão para cidadão ou servidor
    if (issueType === 'citizen' && !selectedCitizen) {
      toast.error('Selecione um cidadão antes de emitir o certificado');
      return;
    }

    if (issueType === 'server' && (!formData.userId || !formData.commonName || !formData.email)) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setIssuing(true);

      const payload = issueType === 'citizen'
        ? {
            citizenId: selectedCitizen!.id,
            commonName: selectedCitizen!.name,
            email: selectedCitizen!.email || '',
            department: formData.department,
            certificateType: formData.certificateType,
            validityYears: formData.validityYears,
          }
        : {
            userId: formData.userId,
            commonName: formData.commonName,
            email: formData.email,
            department: formData.department,
            certificateType: formData.certificateType,
            validityYears: formData.validityYears,
          };

      const response = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Certificado emitido com sucesso!');
        if (data.privateKey) {
          setPrivateKey(data.privateKey);
          setShowPrivateKeyModal(true);
        }
        setShowIssueModal(false);
        setSelectedCitizen(null);
        fetchCertificates();
      } else {
        throw new Error(data.message || 'Erro ao emitir certificado');
      }
    } catch (error: any) {
      console.error('Erro ao emitir certificado:', error);
      toast.error(error.message || 'Erro ao emitir certificado');
    } finally {
      setIssuing(false);
    }
  };

  const handleRevokeCertificate = async (reason: string, comments: string) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!selectedCertificate) {
      toast.error('Nenhum certificado selecionado');
      return;
    }

    try {
      setRevoking(true);
      const response = await fetch('/api/certificates/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serialNumber: selectedCertificate.serialNumber,
          reason,
          revokedBy: user.id,
          comments
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Certificado revogado com sucesso!');
        setShowRevokeModal(false);
        setShowDetailsModal(false);
        setSelectedCertificate(null);
        fetchCertificates();
      } else {
        throw new Error(data.message || 'Erro ao revogar certificado');
      }
    } catch (error: any) {
      console.error('Erro ao revogar certificado:', error);
      toast.error(error.message || 'Erro ao revogar certificado');
    } finally {
      setRevoking(false);
    }
  };

  const handleDownloadCertificate = async (cert: DigitalCertificate) => {
    try {
      const response = await fetch(`/api/certificates/${cert.id}/download`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Erro ao baixar certificado');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado_${cert.serialNumber}.pem`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Certificado baixado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao baixar certificado:', error);
      toast.error(error.message || 'Erro ao baixar certificado');
    }
  };

  const handleViewDetails = (cert: DigitalCertificate) => {
    setSelectedCertificate(cert);
    setShowDetailsModal(true);
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch =
      cert.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.userName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;
    const matchesType = filterType === 'all' || cert.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: certificates.length,
    active: certificates.filter(c => c.status === 'ACTIVE' && new Date(c.expiresAt) > new Date()).length,
    expiring: certificates.filter(c => {
      const diff = Math.ceil((new Date(c.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 && diff <= 30;
    }).length,
    revoked: certificates.filter(c => c.status === 'REVOKED').length
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              Certificados Digitais
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie certificados digitais e assinaturas do sistema
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              setShowIssueModal(true);
              setSelectedCitizen(null);
              setIssueType('citizen');
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Emitir Certificado
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="certificates" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Certificados Emitidos
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Solicitações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="certificates" className="space-y-6 mt-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Certificados</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ativos</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expirando (30 dias)</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.expiring}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revogados</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{stats.revoked}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, serial ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os status</option>
                <option value="ACTIVE">Ativos</option>
                <option value="REVOKED">Revogados</option>
                <option value="EXPIRED">Expirados</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os tipos</option>
                <option value="SERVER">Servidor</option>
                <option value="CITIZEN">Cidadão</option>
                <option value="SYSTEM">Sistema</option>
              </select>

              <Button variant="outline" onClick={fetchCertificates}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Certificates List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certificados ({filteredCertificates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Carregando certificados...</p>
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum certificado encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {cert.commonName}
                          </h3>
                          {getStatusBadge(cert.status, cert.expiresAt)}
                          {getTypeBadge(cert.type)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{cert.userName || cert.userId}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Emitido em {format(new Date(cert.issuedAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className={new Date(cert.expiresAt) < new Date() ? 'text-red-600 font-medium' : ''}>
                              {getDaysUntilExpiry(cert.expiresAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span>Serial: <span className="font-mono font-medium">{cert.serialNumber}</span></span>
                          <span>Assinaturas: <span className="font-semibold">{cert._count?.signatures || 0}</span></span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(cert)}
                          title="Visualizar detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadCertificate(cert)}
                          title="Baixar certificado"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {cert.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedCertificate(cert);
                              setShowRevokeModal(true);
                            }}
                            title="Revogar certificado"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <CertificateRequestsManager />
        </TabsContent>
      </Tabs>

        {/* Modal de Detalhes do Certificado */}
        {showDetailsModal && selectedCertificate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Detalhes do Certificado Digital
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedCertificate(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Status e Tipo */}
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedCertificate.status, selectedCertificate.expiresAt)}
                  {getTypeBadge(selectedCertificate.type)}
                </div>

                {/* Informações do Titular */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
                    Informações do Titular
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nome Comum (CN)</label>
                      <p className="text-gray-900 mt-1">{selectedCertificate.commonName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Usuário</label>
                      <p className="text-gray-900 mt-1">{selectedCertificate.userName || selectedCertificate.userId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Organização</label>
                      <p className="text-gray-900 mt-1">{selectedCertificate.organization}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Emissor</label>
                      <p className="text-gray-900 mt-1">{selectedCertificate.issuer}</p>
                    </div>
                  </div>
                </div>

                {/* Informações do Certificado */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
                    Informações do Certificado
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Número de Série</label>
                      <p className="text-gray-900 mt-1 font-mono text-sm break-all">
                        {selectedCertificate.serialNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Impressão Digital (Thumbprint)</label>
                      <p className="text-gray-900 mt-1 font-mono text-xs break-all">
                        {selectedCertificate.thumbprint}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Data de Emissão</label>
                      <p className="text-gray-900 mt-1">
                        {format(new Date(selectedCertificate.issuedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Data de Expiração</label>
                      <p className={`mt-1 font-medium ${new Date(selectedCertificate.expiresAt) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                        {format(new Date(selectedCertificate.expiresAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        <span className="block text-sm font-normal text-gray-600">
                          ({getDaysUntilExpiry(selectedCertificate.expiresAt)})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estatísticas de Uso */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
                    Estatísticas de Uso
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-blue-900">Total de Assinaturas</label>
                      <p className="text-3xl font-bold text-blue-600 mt-2">
                        {selectedCertificate._count?.signatures || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadCertificate(selectedCertificate)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Certificado
                  </Button>
                  {selectedCertificate.status === 'ACTIVE' && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowRevokeModal(true);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Revogar Certificado
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedCertificate(null);
                    }}
                  >
                    Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Emissão de Certificado */}
        {showIssueModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Emitir Novo Certificado Digital
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleIssueCertificate({
                      certificateType: formData.get('certificateType') as 'SERVER' | 'CITIZEN' | 'SYSTEM',
                      validityYears: parseInt(formData.get('validityYears') as string),
                      department: formData.get('department') as string || undefined,
                      userId: formData.get('userId') as string || undefined,
                      commonName: formData.get('commonName') as string || undefined,
                      email: formData.get('email') as string || undefined,
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-4">
                    {/* Seletor de Tipo de Emissão */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emitir certificado para:
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="issueType"
                            value="citizen"
                            checked={issueType === 'citizen'}
                            onChange={() => setIssueType('citizen')}
                            className="w-4 h-4"
                          />
                          <span>Cidadão</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="issueType"
                            value="server"
                            checked={issueType === 'server'}
                            onChange={() => setIssueType('server')}
                            className="w-4 h-4"
                          />
                          <span>Servidor (Funcionário)</span>
                        </label>
                      </div>
                    </div>

                    {issueType === 'citizen' ? (
                      <>
                        {/* Busca de Cidadão */}
                        <div>
                          <CitizenAutocomplete
                            value={selectedCitizen}
                            onChange={setSelectedCitizen}
                            label="Cidadão"
                            placeholder="Digite o nome, CPF ou email do cidadão..."
                            required
                          />
                        </div>

                        {/* Dados do Cidadão Selecionado */}
                        {selectedCitizen && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">Dados do Certificado</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-blue-700 font-medium">Nome (CN):</span>
                                <p className="text-blue-900">{selectedCitizen.name}</p>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Email:</span>
                                <p className="text-blue-900">{selectedCitizen.email || 'Não informado'}</p>
                              </div>
                              {selectedCitizen.cpf && (
                                <div>
                                  <span className="text-blue-700 font-medium">CPF:</span>
                                  <p className="text-blue-900">{selectedCitizen.cpf}</p>
                                </div>
                              )}
                              <div>
                                <span className="text-blue-700 font-medium">ID do Usuário:</span>
                                <p className="text-blue-900 font-mono text-xs">{selectedCitizen.id}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Campos para Servidor */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ID do Usuário *
                            </label>
                            <input
                              type="text"
                              name="userId"
                              required={issueType === 'server'}
                              placeholder="ID do usuário no sistema"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Use o ID do usuário que será o titular do certificado
                            </p>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nome Completo (CN) *
                            </label>
                            <input
                              type="text"
                              name="commonName"
                              required={issueType === 'server'}
                              placeholder="Nome completo do servidor"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email *
                            </label>
                            <input
                              type="email"
                              name="email"
                              required={issueType === 'server'}
                              placeholder="email@prefeitura.gov.br"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Certificado
                        </label>
                        <select
                          name="certificateType"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="CITIZEN">Cidadão</option>
                          <option value="SERVER">Servidor</option>
                          <option value="SYSTEM">Sistema</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Departamento (opcional)
                        </label>
                        <input
                          type="text"
                          name="department"
                          placeholder="Ex: Secretaria de Saúde"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Validade (anos)
                        </label>
                        <select
                          name="validityYears"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="1">1 ano</option>
                          <option value="2">2 anos</option>
                          <option value="3">3 anos</option>
                          <option value="5">5 anos</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowIssueModal(false);
                        setSelectedCitizen(null);
                      }}
                      disabled={issuing}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={issuing}
                    >
                      {issuing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Emitindo...
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4 mr-2" />
                          Emitir Certificado
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Revogação de Certificado */}
        {showRevokeModal && selectedCertificate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader className="border-b bg-red-50">
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <XCircle className="w-5 h-5" />
                  Revogar Certificado Digital
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleRevokeCertificate(
                      formData.get('reason') as string,
                      formData.get('comments') as string
                    );
                  }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                      ⚠️ Atenção: Esta ação não pode ser desfeita!
                    </p>
                    <p className="text-sm text-yellow-700">
                      Você está prestes a revogar o certificado:
                    </p>
                    <p className="text-sm font-mono text-yellow-900 mt-2">
                      {selectedCertificate.serialNumber}
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Titular: <span className="font-medium">{selectedCertificate.commonName}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo da Revogação *
                    </label>
                    <select
                      name="reason"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="UNSPECIFIED">Não especificado</option>
                      <option value="KEY_COMPROMISE">Chave comprometida</option>
                      <option value="CA_COMPROMISE">Autoridade certificadora comprometida</option>
                      <option value="AFFILIATION_CHANGED">Mudança de lotação/desligamento</option>
                      <option value="SUPERSEDED">Substituído por novo certificado</option>
                      <option value="CESSATION">Cessação de operação</option>
                      <option value="CERTIFICATE_HOLD">Suspensão temporária</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comentários (opcional)
                    </label>
                    <textarea
                      name="comments"
                      rows={3}
                      placeholder="Descreva o motivo da revogação..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowRevokeModal(false);
                        setSelectedCertificate(null);
                      }}
                      disabled={revoking}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={revoking}
                    >
                      {revoking ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Revogando...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Revogar Certificado
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Chave Privada */}
        {showPrivateKeyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader className="border-b bg-yellow-50">
                <CardTitle className="flex items-center gap-2 text-yellow-900">
                  <Shield className="w-5 h-5" />
                  Chave Privada do Certificado
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-red-50 border-2 border-red-400 rounded-lg">
                  <p className="text-sm font-bold text-red-900 mb-2">
                    🔐 ATENÇÃO: SALVE ESTA CHAVE EM LOCAL SEGURO!
                  </p>
                  <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                    <li>Esta é a ÚNICA vez que a chave privada será exibida</li>
                    <li>Sem esta chave, você NÃO poderá assinar documentos</li>
                    <li>NUNCA compartilhe esta chave com terceiros</li>
                    <li>Armazene em local seguro e criptografado</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave Privada (formato PEM):
                  </label>
                  <textarea
                    readOnly
                    value={privateKey}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs bg-gray-50"
                    onClick={(e) => e.currentTarget.select()}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(privateKey);
                      toast.success('Chave privada copiada para área de transferência!');
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Copiar Chave
                  </Button>
                  <Button
                    onClick={() => {
                      const blob = new Blob([privateKey], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `private-key-${Date.now()}.pem`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      toast.success('Chave privada baixada com sucesso!');
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Arquivo
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      setShowPrivateKeyModal(false);
                      setPrivateKey('');
                    }}
                  >
                    Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  );
}
