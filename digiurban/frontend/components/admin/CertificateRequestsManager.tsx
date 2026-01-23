'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  AlertCircle,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CertificateRequest {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: {
      name: string;
    };
  };
  commonName: string;
  email: string;
  certificateType: 'SERVER' | 'CITIZEN' | 'SYSTEM';
  keySize: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requestReason: string;
  requestedAt: string;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  };
  reviewedAt?: string;
  reviewComments?: string;
  certificate?: {
    id: string;
    serialNumber: string;
    status: string;
    expiresAt: string;
  };
}

export function CertificateRequestsManager() {
  const { user } = useAdminAuth();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const queryParams = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await fetch(`/api/certificates/requests${queryParams}`);

      if (!response.ok) {
        throw new Error('Falha ao carregar solicitações');
      }

      const data = await response.json();

      if (data.success) {
        setRequests(data.requests || []);
      } else {
        throw new Error(data.message || 'Erro ao carregar solicitações');
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      toast.error('Erro ao carregar solicitações');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    const comments = prompt('Comentários sobre a aprovação (opcional):');

    try {
      setProcessing(true);
      const response = await fetch(`/api/certificates/requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewerId: user.id,
          comments: comments || 'Aprovado'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Certificado emitido com sucesso!');
        if (data.privateKey) {
          // Exibir chave privada em um alert ou modal
          alert(`IMPORTANTE: Salve esta chave privada em local seguro!\n\nChave Privada:\n${data.privateKey}\n\nEsta é a ÚNICA vez que a chave será exibida!`);
        }
        fetchRequests();
        setShowDetailsModal(false);
      } else {
        throw new Error(data.message || 'Erro ao aprovar solicitação');
      }
    } catch (error: any) {
      console.error('Erro ao aprovar solicitação:', error);
      toast.error(error.message || 'Erro ao aprovar solicitação');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    const comments = prompt('Motivo da rejeição:');
    if (!comments) {
      toast.error('É necessário informar o motivo da rejeição');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/certificates/requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewerId: user.id,
          comments
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Solicitação rejeitada');
        fetchRequests();
        setShowDetailsModal(false);
      } else {
        throw new Error(data.message || 'Erro ao rejeitar solicitação');
      }
    } catch (error: any) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast.error(error.message || 'Erro ao rejeitar solicitação');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Aprovado
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejeitado
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Cancelado
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

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprovados</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejeitados</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PENDING">Pendentes</option>
              <option value="APPROVED">Aprovados</option>
              <option value="REJECTED">Rejeitados</option>
              <option value="all">Todos</option>
            </select>

            <Button variant="outline" size="sm" onClick={fetchRequests}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Solicitações de Certificados ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Carregando solicitações...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.user.name}
                        </h3>
                        {getStatusBadge(request.status)}
                        {getTypeBadge(request.certificateType)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{request.user.email}</span>
                        </div>
                        {request.user.department && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Shield className="w-4 h-4" />
                            <span>{request.user.department.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Solicitado em {format(new Date(request.requestedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Justificativa:</span> {request.requestReason}
                      </div>

                      {request.reviewedBy && (
                        <div className="text-sm text-gray-600 mt-2 pt-2 border-t">
                          <span className="font-medium">Revisado por:</span> {request.reviewedBy.name} em {format(new Date(request.reviewedAt!), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          {request.reviewComments && (
                            <p className="mt-1"><span className="font-medium">Comentários:</span> {request.reviewComments}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {request.status === 'PENDING' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(request.id)}
                            disabled={processing}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleReject(request.id)}
                            disabled={processing}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Detalhes da Solicitação
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRequest(null);
                  }}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedRequest.status)}
                {getTypeBadge(selectedRequest.certificateType)}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Informações do Solicitante</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome</label>
                    <p className="text-gray-900">{selectedRequest.user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedRequest.user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cargo/Perfil</label>
                    <p className="text-gray-900">{selectedRequest.user.role}</p>
                  </div>
                  {selectedRequest.user.department && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Departamento</label>
                      <p className="text-gray-900">{selectedRequest.user.department.name}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Detalhes do Certificado</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo</label>
                    <p className="text-gray-900">{selectedRequest.certificateType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tamanho da Chave</label>
                    <p className="text-gray-900">{selectedRequest.keySize} bits</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Justificativa</label>
                    <p className="text-gray-900">{selectedRequest.requestReason}</p>
                  </div>
                </div>
              </div>

              {selectedRequest.certificate && (
                <div className="space-y-3 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-lg text-green-900">Certificado Emitido</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-green-700">Serial</label>
                      <p className="text-green-900 font-mono text-sm">{selectedRequest.certificate.serialNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-700">Status</label>
                      <p className="text-green-900">{selectedRequest.certificate.status}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t">
                {selectedRequest.status === 'PENDING' && (
                  <>
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={processing}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedRequest.id)}
                      disabled={processing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRequest(null);
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
