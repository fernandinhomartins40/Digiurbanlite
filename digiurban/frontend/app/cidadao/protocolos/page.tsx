'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Calendar,
  Building2,
  Loader2
} from 'lucide-react';
import { useCitizenProtocols } from '@/hooks/useCitizenProtocols';
import { CancelProtocolDialog } from '@/components/citizen/CancelProtocolDialog';

export default function ProtocolosPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<{ id: string; number: string } | null>(null);

  const statusTypes = [
    { id: 'todos', name: 'Todos', color: 'gray', apiValue: undefined },
    { id: 'VINCULADO', name: 'Pendente', color: 'yellow', apiValue: 'VINCULADO' },
    { id: 'EM_ANDAMENTO', name: 'Em Andamento', color: 'blue', apiValue: 'EM_ANDAMENTO' },
    { id: 'CONCLUIDO', name: 'Concluído', color: 'green', apiValue: 'CONCLUIDO' },
    { id: 'CANCELADO', name: 'Cancelado', color: 'red', apiValue: 'CANCELADO' }
  ];

  // Buscar protocolos reais da API
  const { protocols, loading, error, stats, refetch } = useCitizenProtocols({
    status: statusFilter !== 'todos' ? statusFilter : undefined,
    limit: 100,
  });

  const handleCancelClick = (protocolId: string, protocolNumber: string) => {
    setSelectedProtocol({ id: protocolId, number: protocolNumber });
    setCancelDialogOpen(true);
  };

  const handleCancelSuccess = () => {
    refetch();
  };

  const canCancelProtocol = (protocol: any) => {
    // Só pode cancelar se estiver VINCULADO ou EM_ANDAMENTO (sem interações de servidor)
    return protocol.status === 'VINCULADO' || protocol.status === 'EM_ANDAMENTO';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VINCULADO':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'EM_ANDAMENTO':
      case 'AGUARDANDO_DOCUMENTOS':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'CONCLUIDO':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'CANCELADO':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      VINCULADO: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendente' },
      EM_ANDAMENTO: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Em Andamento' },
      AGUARDANDO_DOCUMENTOS: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Aguardando Docs' },
      CONCLUIDO: { bg: 'bg-green-100', text: 'text-green-700', label: 'Concluído' },
      CANCELADO: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado' }
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Filtrar protocolos por busca (status já filtrado pela API)
  const filteredProtocols = useMemo(() => {
    if (!searchTerm) return protocols;

    const searchLower = searchTerm.toLowerCase();
    return protocols.filter(protocol =>
      protocol.number.toLowerCase().includes(searchLower) ||
      protocol.title.toLowerCase().includes(searchLower) ||
      protocol.service.name.toLowerCase().includes(searchLower) ||
      protocol.department.name.toLowerCase().includes(searchLower)
    );
  }, [protocols, searchTerm]);

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meus Protocolos</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Acompanhe o status das suas solicitações</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-gray-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 self-end sm:self-auto" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">Pendente</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pendente}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 self-end sm:self-auto" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">Andamento</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.em_andamento}</p>
                </div>
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 self-end sm:self-auto" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">Concluído</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.concluido}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 self-end sm:self-auto" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <Input
              placeholder="Buscar por número, serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 text-sm sm:text-base h-10 sm:h-11"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {statusTypes.map((status) => (
              <Button
                key={status.id}
                variant={statusFilter === status.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status.id)}
                className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm"
              >
                {status.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de Protocolos */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Carregando protocolos...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-12 text-center">
                <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Erro ao carregar protocolos</p>
                <p className="text-sm text-gray-500">{error}</p>
              </CardContent>
            </Card>
          ) : filteredProtocols.length > 0 ? (
            filteredProtocols.map((protocol) => (
              <Card key={protocol.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full">
                      <div className="bg-gray-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                        {getStatusIcon(protocol.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-all">
                            {protocol.number}
                          </h3>
                          {getStatusBadge(protocol.status)}
                        </div>
                        <p className="text-sm sm:text-base text-gray-900 mb-1">{protocol.title}</p>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">{protocol.service.name}</p>
                        {protocol.description && (
                          <p className="text-xs sm:text-sm text-gray-500 mb-3">{protocol.description}</p>
                        )}

                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{protocol.department.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">Criado em {new Date(protocol.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">Atualizado em {new Date(protocol.updatedAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/cidadao/protocolos/${protocol.id}`)}
                        className="w-full sm:w-auto flex-shrink-0"
                      >
                        <Eye className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Detalhes</span>
                      </Button>
                      {canCancelProtocol(protocol) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelClick(protocol.id, protocol.number);
                          }}
                          className="w-full sm:w-auto flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Cancelar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Nenhum protocolo encontrado</p>
                <p className="text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'todos'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Você ainda não possui protocolos. Solicite um serviço para começar.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Cancelamento */}
      {selectedProtocol && (
        <CancelProtocolDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          protocolId={selectedProtocol.id}
          protocolNumber={selectedProtocol.number}
          onSuccess={handleCancelSuccess}
        />
      )}
    </CitizenLayout>
  );
}
