'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Building2,
  User,
  Hash,
  MessageSquare,
  FileCheck,
  History,
  Loader2,
  Users,
} from 'lucide-react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { toast } from 'sonner';
import { CitizenProtocolInteractionsTab } from '@/components/citizen/CitizenProtocolInteractionsTab';
import { CancelProtocolDialog } from '@/components/citizen/CancelProtocolDialog';
import { CitizenLinksDisplay } from '@/components/protocol/CitizenLinksDisplay';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Service {
  id: string;
  name: string;
  category: string | null;
  estimatedDays: number | null;
}

interface Department {
  id: string;
  name: string;
}

interface Citizen {
  id: string;
  name: string;
  cpf: string;
}

interface ProtocolHistory {
  id: string;
  action: string;
  comment: string | null;
  timestamp: string;
}

interface Protocol {
  id: string;
  number: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  service: Service;
  department: Department;
  citizen: Citizen;
  history: ProtocolHistory[];
  _count: {
    history: number;
    evaluations: number;
  };
}

export default function ProtocolDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { apiRequest } = useCitizenAuth();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    fetchProtocolDetails();
  }, [params.id]);

  const fetchProtocolDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiRequest(`/citizen/protocols/${params.id}`);

      // A API retorna { protocol, history }
      if (data.protocol) {
        // Combinar protocol e history
        const protocolWithHistory = {
          ...data.protocol,
          history: data.history || [],
          _count: {
            history: data.history?.length || 0,
            evaluations: 0,
          },
        };
        setProtocol(protocolWithHistory);
      } else {
        throw new Error('Protocolo não encontrado');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar detalhes do protocolo';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSuccess = () => {
    // Recarregar os detalhes do protocolo
    fetchProtocolDetails();
  };

  const canCancelProtocol = () => {
    if (!protocol) return false;
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
      CANCELADO: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado' },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <CitizenLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Carregando detalhes do protocolo...</p>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  if (error || !protocol) {
    return (
      <CitizenLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Erro ao carregar protocolo</p>
            <p className="text-sm text-gray-500 mb-4">{error || 'Protocolo não encontrado'}</p>
            <Button onClick={() => router.push('/cidadao/protocolos')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Protocolos
            </Button>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/cidadao/protocolos')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{protocol.number}</h1>
              <p className="text-sm text-gray-600">{protocol.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(protocol.status)}
            {canCancelProtocol() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelDialogOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Protocolo
              </Button>
            )}
          </div>
        </div>

        {/* Informações Principais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações do Protocolo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Hash className="h-4 w-4" />
                  <span className="font-medium">Número do Protocolo</span>
                </div>
                <p className="text-base font-semibold text-gray-900 ml-6">{protocol.number}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileCheck className="h-4 w-4" />
                  <span className="font-medium">Status</span>
                </div>
                <div className="ml-6">{getStatusBadge(protocol.status)}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">Secretaria</span>
                </div>
                <p className="text-base text-gray-900 ml-6">{protocol.department.name}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Serviço</span>
                </div>
                <p className="text-base text-gray-900 ml-6">{protocol.service.name}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Criado em</span>
                </div>
                <p className="text-base text-gray-900 ml-6">
                  {format(new Date(protocol.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Última Atualização</span>
                </div>
                <p className="text-base text-gray-900 ml-6">
                  {format(new Date(protocol.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>

            {protocol.description && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Descrição</p>
                  <p className="text-base text-gray-900">{protocol.description}</p>
                </div>
              </>
            )}

            {protocol.service.estimatedDays && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Prazo Estimado</p>
                  <p className="text-base text-gray-900">{protocol.service.estimatedDays} dias úteis</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tabs de Detalhes */}
        <Tabs defaultValue="interactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="interactions" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Interações
            </TabsTrigger>
            <TabsTrigger value="citizens" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Cidadãos Vinculados
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico ({protocol.history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interactions">
            <CitizenProtocolInteractionsTab protocolId={protocol.id} />
          </TabsContent>

          <TabsContent value="citizens">
            <CitizenLinksDisplay
              protocolId={protocol.id}
              editable={false}
            />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Ações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {protocol.history.length > 0 ? (
                  <div className="space-y-4">
                    {protocol.history.map((item, index) => (
                      <div key={item.id} className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                        <div className="absolute left-0 top-0 -translate-x-1/2 bg-white">
                          <div className="h-3 w-3 rounded-full bg-blue-500 border-2 border-white"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{item.action}</p>
                            <span className="text-xs text-gray-500">
                              {format(new Date(item.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {item.comment && (
                            <p className="text-sm text-gray-600">{item.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum histórico disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Cancelamento */}
      <CancelProtocolDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        protocolId={protocol.id}
        protocolNumber={protocol.number}
        onSuccess={handleCancelSuccess}
      />
    </CitizenLayout>
  );
}
