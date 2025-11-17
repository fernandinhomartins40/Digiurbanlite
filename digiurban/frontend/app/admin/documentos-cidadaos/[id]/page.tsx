'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Award,
  AlertCircle
} from 'lucide-react';

interface Document {
  id: string;
  documentType: string;
  documentLabel: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  notes?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
  filePath: string;
  citizen: {
    id: string;
    name: string;
    cpf: string;
    email?: string;
    phone?: string;
    verificationStatus: string;
    createdAt: string;
  };
}

export default function DocumentoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { apiRequest } = useAdminAuth();
  const { hasPermission } = useAdminPermissions();

  const documentId = params.id as string;
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/admin/citizen-documents/${documentId}`);

      if (response.success) {
        setDocument(response.data.document);
        setNotes(response.data.document.notes || '');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar o documento'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Deseja aprovar este documento?')) return;

    try {
      setProcessing(true);

      const response = await apiRequest(`/admin/citizen-documents/${documentId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ notes })
      });

      if (response.success) {
        toast({
          title: 'Documento Aprovado!',
          description: response.data.promotedToGold
            ? '🥇 O cidadão foi promovido para nível OURO!'
            : 'Documento aprovado com sucesso'
        });

        // Voltar para lista
        router.push('/admin/documentos-cidadaos/pendentes');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível aprovar o documento'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Por favor, informe o motivo da rejeição'
      });
      return;
    }

    try {
      setProcessing(true);

      const response = await apiRequest(`/admin/citizen-documents/${documentId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectionReason })
      });

      if (response.success) {
        toast({
          title: 'Documento Rejeitado',
          description: 'O cidadão será notificado sobre a rejeição'
        });

        // Voltar para lista
        router.push('/admin/documentos-cidadaos/pendentes');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível rejeitar o documento'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      window.open(`/api/admin/citizen-documents/${documentId}/download`, '_blank');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível fazer download do documento'
      });
    }
  };

  const getVerificationBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      PENDING: { label: 'Bronze', variant: 'secondary', icon: AlertCircle },
      VERIFIED: { label: 'Prata', variant: 'default', icon: CheckCircle },
      GOLD: { label: 'Ouro', variant: 'default', icon: Award },
      REJECTED: { label: 'Rejeitado', variant: 'destructive', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!hasPermission('citizens:verify')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">
              Você não tem permissão para visualizar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Carregando documento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Documento não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">Análise de Documento</h1>
          <p className="text-gray-600 mt-1">{document.documentLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview do Documento */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Preview do Documento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {document.mimeType?.startsWith('image/') ? (
                <img
                  src={`/api/admin/citizen-documents/${document.id}/download`}
                  alt={document.fileName}
                  className="w-full border rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Preview não disponível para este tipo de arquivo</p>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Fazer Download
                  </Button>
                </div>
              )}

              {/* Informações do Arquivo */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nome do arquivo:</span>
                  <span className="font-medium">{document.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tamanho:</span>
                  <span className="font-medium">{formatFileSize(document.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium">{document.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data de envio:</span>
                  <span className="font-medium">{formatDate(document.uploadedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações e Ações */}
        <div className="space-y-6">
          {/* Informações do Cidadão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cidadão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Nome</label>
                <p className="font-medium">{document.citizen.name}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">CPF</label>
                <p className="font-medium">{document.citizen.cpf}</p>
              </div>

              {document.citizen.email && (
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="font-medium">{document.citizen.email}</p>
                </div>
              )}

              {document.citizen.phone && (
                <div>
                  <label className="text-sm text-gray-600">Telefone</label>
                  <p className="font-medium">{document.citizen.phone}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-600">Nível de Verificação</label>
                <div className="mt-1">
                  {getVerificationBadge(document.citizen.verificationStatus)}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push(`/admin/cidadaos/${document.citizen.id}`)}
              >
                Ver Perfil Completo
              </Button>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Adicione observações sobre este documento..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Ações */}
          {document.status === 'PENDING' || document.status === 'UNDER_REVIEW' ? (
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={processing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {processing ? 'Aprovando...' : 'Aprovar Documento'}
                </Button>

                {!showRejectDialog ? (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={processing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar Documento
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Motivo da rejeição (obrigatório)..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleReject}
                        disabled={processing || !rejectionReason.trim()}
                      >
                        {processing ? 'Rejeitando...' : 'Confirmar Rejeição'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectDialog(false);
                          setRejectionReason('');
                        }}
                        disabled={processing}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Este documento já foi {document.status === 'APPROVED' ? 'aprovado' : 'processado'}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
