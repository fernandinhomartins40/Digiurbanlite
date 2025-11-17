'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext';
import {
  FileText,
  User,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter
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
  citizen: {
    id: string;
    name: string;
    cpf: string;
    email?: string;
    verificationStatus: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function DocumentosPendentesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { apiRequest } = useAdminAuth();
  const { hasPermission } = useAdminPermissions();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    citizenName: '',
    documentType: ''
  });

  useEffect(() => {
    loadDocuments();
  }, [pagination.page, filters]);

  const loadDocuments = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.citizenName && { citizenName: filters.citizenName }),
        ...(filters.documentType && { documentType: filters.documentType })
      });

      const response = await apiRequest(`/admin/citizen-documents/pending?${params}`);

      if (response.success) {
        setDocuments(response.data.documents);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os documentos'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      PENDING: { label: 'Pendente', variant: 'secondary', icon: Clock },
      UNDER_REVIEW: { label: 'Em Análise', variant: 'default', icon: Eye },
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

  const getVerificationBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      PENDING: { label: 'Bronze', variant: 'secondary' },
      VERIFIED: { label: 'Prata', variant: 'default' },
      GOLD: { label: 'Ouro', variant: 'default' },
      REJECTED: { label: 'Rejeitado', variant: 'destructive' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;

    return (
      <Badge variant={config.variant}>
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

  const handleViewDocument = (documentId: string) => {
    router.push(`/admin/documentos-cidadaos/${documentId}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (!hasPermission('citizens:read')) {
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos Pendentes</h1>
          <p className="text-gray-600 mt-1">
            Revise e aprove documentos pessoais enviados pelos cidadãos
          </p>
        </div>

        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Clock className="h-4 w-4 mr-2" />
          {pagination.total} Pendentes
        </Badge>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do Cidadão</label>
              <Input
                placeholder="Buscar por nome..."
                value={filters.citizenName}
                onChange={(e) => handleFilterChange('citizenName', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Documento</label>
              <select
                value={filters.documentType}
                onChange={(e) => handleFilterChange('documentType', e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Todos</option>
                <option value="rg_frente">RG (Frente)</option>
                <option value="rg_verso">RG (Verso)</option>
                <option value="cpf">CPF</option>
                <option value="comprovante_residencia">Comprovante de Residência</option>
                <option value="certidao_nascimento">Certidão de Nascimento</option>
                <option value="titulo_eleitor">Título de Eleitor</option>
                <option value="comprovante_renda">Comprovante de Renda</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos para Análise</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Carregando documentos...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum documento pendente encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Documento Info */}
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold text-lg">{doc.documentLabel}</h3>
                        {getStatusBadge(doc.status)}
                      </div>

                      {/* Cidadão Info */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{doc.citizen.name}</span>
                        <span className="text-gray-400">|</span>
                        <span>{doc.citizen.cpf}</span>
                        <span className="text-gray-400">|</span>
                        {getVerificationBadge(doc.citizen.verificationStatus)}
                      </div>

                      {/* Detalhes */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(doc.uploadedAt)}
                        </span>
                        <span>{doc.fileName}</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                      </div>

                      {doc.notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                          <strong>Observações:</strong> {doc.notes}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(doc.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Analisar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} documentos
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Anterior
                </Button>

                <span className="px-4 py-2 text-sm">
                  Página {pagination.page} de {pagination.pages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
