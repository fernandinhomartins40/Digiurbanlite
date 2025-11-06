'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  User,
  FileText,
  Search,
  Filter,
  Eye,
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';

interface TransferRequest {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  citizen: {
    id: string;
    name: string;
    cpf: string;
    email: string;
    phone?: string;
  };
  fromTenant: {
    id: string;
    name: string;
    nomeMunicipio?: string;
    ufMunicipio?: string;
  };
  toTenant: {
    id: string;
    name: string;
    nomeMunicipio?: string;
    ufMunicipio?: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
  };
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function TransferenciasPage() {
  const { apiRequest } = useAdminAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'APPROVED' | 'REJECTED' | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const data = await apiRequest(`/admin/transfer-requests${params}`);
      setRequests(data.requests || []);
      setStats(data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar solicitações',
        description: error.message || 'Ocorreu um erro ao buscar as solicitações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await apiRequest(`/admin/transfer-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          reviewNotes: reviewNotes || undefined,
        }),
      });

      toast({
        title: status === 'APPROVED' ? 'Transferência aprovada' : 'Transferência rejeitada',
        description: `A transferência de ${selectedRequest.citizen.name} foi ${status === 'APPROVED' ? 'aprovada' : 'rejeitada'} com sucesso.`,
        variant: 'default',
      });

      // Atualizar lista
      await fetchRequests();
      setSelectedRequest(null);
      setReviewNotes('');
      setShowConfirmModal(false);
      setConfirmAction(null);
    } catch (error: any) {
      toast({
        title: 'Erro ao processar solicitação',
        description: error.message || 'Ocorreu um erro ao processar a solicitação',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const openConfirmModal = (action: 'APPROVED' | 'REJECTED') => {
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const confirmReview = () => {
    if (confirmAction) {
      handleReview(confirmAction);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovada</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />Rejeitada</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter((req) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      req.citizen.name.toLowerCase().includes(searchLower) ||
      req.citizen.cpf.includes(searchLower) ||
      req.fromTenant.nomeMunicipio?.toLowerCase().includes(searchLower) ||
      req.fromTenant.name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <RefreshCw className="h-6 w-6" />
              Solicitações de Transferência
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie as solicitações de transferência de cidadãos para este município
            </p>
          </div>
          <Button onClick={fetchRequests} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aprovadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejeitadas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-gray-600 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou município de origem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtro de Status */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os status</option>
                <option value="PENDING">Pendentes</option>
                <option value="APPROVED">Aprovadas</option>
                <option value="REJECTED">Rejeitadas</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Solicitações */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitações ({filteredRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <RefreshCw className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhuma solicitação encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Informações principais */}
                      <div className="flex-1 space-y-2">
                        {/* Cidadão */}
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{request.citizen.name}</span>
                          <span className="text-sm text-gray-500">
                            CPF: {request.citizen.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                          </span>
                        </div>

                        {/* Municípios */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>
                            De: <strong>{request.fromTenant.nomeMunicipio || request.fromTenant.name}</strong> - {request.fromTenant.ufMunicipio}
                          </span>
                          <span className="mx-2">→</span>
                          <span>
                            Para: <strong>{request.toTenant.nomeMunicipio || request.toTenant.name}</strong> - {request.toTenant.ufMunicipio}
                          </span>
                        </div>

                        {/* Justificativa */}
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <p className="line-clamp-2">{request.reason}</p>
                        </div>

                        {/* Data */}
                        <div className="text-xs text-gray-500">
                          Solicitado em: {new Date(request.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(request.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Status e Ações */}
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(request.status)}

                        {request.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Analisar
                            </Button>
                          </div>
                        )}

                        {request.reviewedBy && (
                          <div className="text-xs text-gray-500">
                            Por: {request.reviewedBy.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Modal de Análise */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedRequest(null)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-xl font-semibold text-gray-900">Analisar Transferência</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              {/* Dados do Cidadão */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Dados do Cidadão</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><strong>Nome:</strong> {selectedRequest.citizen.name}</p>
                  <p><strong>CPF:</strong> {selectedRequest.citizen.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                  <p><strong>Email:</strong> {selectedRequest.citizen.email}</p>
                  {selectedRequest.citizen.phone && (
                    <p><strong>Telefone:</strong> {selectedRequest.citizen.phone}</p>
                  )}
                </div>
              </div>

              {/* Justificativa */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Justificativa</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedRequest.reason}</p>
                </div>
              </div>

              {/* Notas da Revisão */}
              <div className="space-y-3">
                <label className="block font-medium text-gray-900">
                  Observações (opcional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Adicione observações sobre esta transferência..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => openConfirmModal('APPROVED')}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  onClick={() => openConfirmModal('REJECTED')}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {showConfirmModal && selectedRequest && confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar {confirmAction === 'APPROVED' ? 'Aprovação' : 'Rejeição'}
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja {confirmAction === 'APPROVED' ? 'aprovar' : 'rejeitar'} a transferência de{' '}
              <strong>{selectedRequest.citizen.name}</strong>?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmModal(false)}
                variant="outline"
                className="flex-1"
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmReview}
                disabled={processing}
                className={`flex-1 ${confirmAction === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                variant={confirmAction === 'REJECTED' ? 'destructive' : 'default'}
              >
                {processing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  confirmAction === 'APPROVED' ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )
                )}
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
