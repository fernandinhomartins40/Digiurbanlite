'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CitizenAutocomplete } from '@/components/admin/CitizenAutocomplete';
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
  RefreshCw
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
  const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);

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
  }) => {
    if (!selectedCitizen) {
      toast.error('Selecione um cidadão antes de emitir o certificado');
      return;
    }

    try {
      setIssuing(true);

      const payload = {
        citizenId: selectedCitizen.id,
        commonName: selectedCitizen.name,
        email: selectedCitizen.email || '',
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

  const handleRevokeCertificate = async (serialNumber: string, reason: string) => {
    try {
      const response = await fetch('/api/certificates/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serialNumber,
          reason,
          revokedBy: 'admin', // TODO: pegar do contexto do usuário logado
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Certificado revogado com sucesso!');
        fetchCertificates();
      } else {
        throw new Error(data.message || 'Erro ao revogar certificado');
      }
    } catch (error: any) {
      console.error('Erro ao revogar certificado:', error);
      toast.error(error.message || 'Erro ao revogar certificado');
    }
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
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Emitir Certificado
          </Button>
        </div>

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
                          onClick={() => {
                            toast.info('Funcionalidade de visualização em desenvolvimento');
                          }}
                          title="Visualizar detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast.info('Funcionalidade de download em desenvolvimento');
                          }}
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
                              if (confirm(`Deseja revogar o certificado ${cert.serialNumber}?`)) {
                                handleRevokeCertificate(cert.serialNumber, 'Revogado manualmente pelo administrador');
                              }
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
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-4">
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
      </div>
  );
}
