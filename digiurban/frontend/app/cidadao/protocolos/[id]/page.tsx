'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { TabsContent } from '@/components/ui/tabs';
import { Loader2, XCircle, ArrowLeft, History } from 'lucide-react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Imports dos novos componentes modernos
import { getCitizenProtocolViewMode, CitizenProtocolViewMode } from '@/lib/citizen-protocol-view-mode';
import { CitizenProtocolHeader } from '@/components/citizen/CitizenProtocolHeader';
import { CitizenStageFocusCard } from '@/components/citizen/CitizenStageFocusCard';
import { CitizenProtocolTabs } from '@/components/citizen/CitizenProtocolTabs';
import { CitizenProtocolSummaryTab } from '@/components/citizen/CitizenProtocolSummaryTab';
import { CitizenDocumentsTab } from '@/components/citizen/CitizenDocumentsTab';
import { CitizenGeneratedDocumentsTab } from '@/components/citizen/CitizenGeneratedDocumentsTab';
import { CitizenCompactSidebar } from '@/components/citizen/CitizenCompactSidebar';
import { CitizenWorkflowProgress } from '@/components/citizen/CitizenWorkflowProgress';
import { CitizenPendingsTab } from '@/components/citizen/CitizenPendingsTab';
import { CitizenProtocolInteractionsTab } from '@/components/citizen/CitizenProtocolInteractionsTab';
import { CitizenLinksDisplay } from '@/components/protocol/CitizenLinksDisplay';

// Tipos
import {
  CitizenProtocol,
  CitizenWorkflowStage,
  CitizenPending,
  CitizenDocument,
  CitizenGeneratedDocument
} from '@/types/citizen-protocol';

export default function ProtocolDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { apiRequest } = useCitizenAuth();

  // Estados principais
  const [protocol, setProtocol] = useState<CitizenProtocol | null>(null);
  const [stages, setStages] = useState<CitizenWorkflowStage[]>([]);
  const [pendings, setPendings] = useState<CitizenPending[]>([]);
  const [documents, setDocuments] = useState<CitizenDocument[]>([]);
  const [generatedDocuments, setGeneratedDocuments] = useState<CitizenGeneratedDocument[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('resumo');

  // Carregar dados do protocolo
  useEffect(() => {
    fetchProtocolDetails();
  }, [params.id]);

  const fetchProtocolDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[ProtocolDetails] Buscando protocolo:', params.id);

      // Buscar protocolo básico
      const data = await apiRequest(`/citizen/protocols/${params.id}`);

      console.log('[ProtocolDetails] Resposta da API:', data);

      if (data.protocol) {
        const protocolWithHistory: CitizenProtocol = {
          ...data.protocol,
          history: data.history || [],
          _count: {
            history: data.history?.length || 0,
            evaluations: 0,
          },
        };
        setProtocol(protocolWithHistory);

        // TEMPORÁRIO: Dados mockados até endpoints serem implementados
        // Documentos enviados pelo cidadão
        setDocuments([
          {
            id: '1',
            type: 'COMPROVANTE_RESIDENCIA',
            fileName: 'comprovante_luz.pdf',
            status: 'APPROVED' as const,
            uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias atrás
            reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
            rejectionReason: null,
            fileUrl: '#'
          },
          {
            id: '2',
            type: 'DOCUMENTO_IDENTIDADE',
            fileName: 'rg_cpf.pdf',
            status: 'PENDING' as const,
            uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
            reviewedAt: null,
            rejectionReason: null,
            fileUrl: '#'
          }
        ]);

        // Documentos gerados pelo sistema (se protocolo concluído)
        if (protocolWithHistory.status === 'CONCLUIDO') {
          setGeneratedDocuments([
            {
              id: '1',
              type: 'CERTIDAO',
              name: 'Certidão de Regularidade',
              generatedAt: protocolWithHistory.updatedAt,
              expiresAt: null,
              validationCode: 'VAL-2026-' + protocolWithHistory.number.replace(/[^0-9]/g, ''),
              fileUrl: '#',
              metadata: {
                emitente: protocolWithHistory.department.name,
                validade: 'Indeterminada'
              }
            }
          ]);
        } else {
          setGeneratedDocuments([]);
        }

        // Buscar stages do workflow
        try {
          const stagesData = await apiRequest(`/citizen/protocols/${params.id}/stages`);
          setStages(stagesData.stages || []);
        } catch (err) {
          console.warn('[ProtocolDetails] Erro ao buscar stages:', err);
          setStages([]);
        }

        // Buscar pendências
        try {
          const pendingsData = await apiRequest(`/citizen/protocols/${params.id}/pendings`);
          setPendings(pendingsData.pendings || []);
        } catch (err) {
          console.warn('[ProtocolDetails] Erro ao buscar pendings:', err);
          setPendings([]);
        }

        // TEMPORÁRIO: Endpoints de documentos comentados pois não existem ainda
        // Buscar documentos
        // try {
        //   const docsData = await apiRequest(`/citizen/protocols/${params.id}/documents`);
        //   setDocuments(docsData.documents || []);
        // } catch (err) {
        //   console.warn('[ProtocolDetails] Erro ao buscar documentos:', err);
        //   setDocuments([]);
        // }

        // Buscar documentos gerados
        // try {
        //   const genDocsData = await apiRequest(`/citizen/protocols/${params.id}/generated-documents`);
        //   setGeneratedDocuments(genDocsData.documents || []);
        // } catch (err) {
        //   console.warn('[ProtocolDetails] Erro ao buscar documentos gerados:', err);
        //   setGeneratedDocuments([]);
        // }
      } else {
        throw new Error('Protocolo não encontrado');
      }
    } catch (err: any) {
      console.error('[ProtocolDetails] Erro ao buscar protocolo:', err);
      const errorMessage = err.message || 'Erro ao carregar detalhes do protocolo';
      setError(errorMessage);
      toast.error(errorMessage);

      if (err.message?.includes('401') || err.message?.includes('autenticação')) {
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  // Calcular viewMode usando useMemo
  const viewModeResult = useMemo(() => {
    if (!protocol) {
      return {
        mode: CitizenProtocolViewMode.ACTIVE,
        currentStage: undefined,
        isLastStage: false,
        availableTabs: ['resumo'],
        primaryTab: 'resumo',
        message: 'Carregando...',
        actionRequired: false
      };
    }

    return getCitizenProtocolViewMode(
      protocol.status,
      stages,
      pendings
    );
  }, [protocol, stages, pendings]);

  // Definir tab ativa inicial baseado no primaryTab do viewMode
  useEffect(() => {
    if (viewModeResult.primaryTab && activeTab === 'resumo') {
      setActiveTab(viewModeResult.primaryTab);
    }
  }, [viewModeResult.primaryTab]);

  // Callbacks para ações
  const handleBack = () => {
    router.push('/cidadao/protocolos');
  };

  const handleUploadDocuments = () => {
    setActiveTab('pendings');
  };

  const handleViewMessages = () => {
    setActiveTab('messages');
  };

  const handleDownloadDocument = () => {
    setActiveTab('generated');
  };

  const handleGoToPendings = () => {
    setActiveTab('pendings');
  };

  const canCancelProtocol = () => {
    if (!protocol) return false;
    return protocol.status === 'VINCULADO' || protocol.status === 'EM_ANDAMENTO';
  };

  // Contadores para badges
  const citizenPendingsCount = pendings.filter(
    p => p.status === 'OPEN' && p.requiresCitizenAction === true
  ).length;

  const unreadMessagesCount = 0; // TODO: Implementar contagem de mensagens não lidas
  const messagesCount = interactions.length;

  // Estados de loading e erro
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
            <Button onClick={handleBack}>
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
        {/* Header Sticky Moderno */}
        <CitizenProtocolHeader
          protocolId={protocol.id}
          protocolNumber={protocol.number}
          serviceName={protocol.service.name}
          departmentName={protocol.department.name}
          status={protocol.status}
          mode={viewModeResult.mode}
          currentStage={viewModeResult.currentStage}
          citizenPendingsCount={citizenPendingsCount}
          unreadMessagesCount={unreadMessagesCount}
          hasGeneratedDocuments={generatedDocuments.length > 0}
          canCancel={canCancelProtocol()}
          onBack={handleBack}
          onUploadDocuments={handleUploadDocuments}
          onViewMessages={handleViewMessages}
          onDownloadDocument={handleDownloadDocument}
          onRefresh={fetchProtocolDetails}
        />

        {/* Progresso do Workflow */}
        {stages.length > 0 && (
          <CitizenWorkflowProgress
            protocolId={protocol.id}
            apiRequest={apiRequest}
          />
        )}

        {/* Card de Foco na Etapa Atual */}
        <CitizenStageFocusCard
          mode={viewModeResult.mode}
          currentStage={viewModeResult.currentStage}
          totalStages={stages.length}
          citizenPendings={pendings.filter(
            p => p.status === 'OPEN' && p.requiresCitizenAction === true
          )}
          estimatedDays={protocol.service.estimatedDays || undefined}
          completedAt={protocol.status === 'CONCLUIDO' ? protocol.updatedAt : undefined}
          onGoToPendings={handleGoToPendings}
          onDownloadDocument={handleDownloadDocument}
        />

        {/* Layout Principal: Tabs (70%) + Sidebar (30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Coluna Principal - Tabs (3/4) */}
          <div className="lg:col-span-3">
            <CitizenProtocolTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              availableTabs={viewModeResult.availableTabs}
              primaryTab={viewModeResult.primaryTab}
              badges={{
                pendings: citizenPendingsCount,
                messages: unreadMessagesCount,
                generated: generatedDocuments.length
              }}
            >
              {/* Tab: Resumo */}
              <TabsContent value="resumo">
                <CitizenProtocolSummaryTab protocol={protocol} />
              </TabsContent>

              {/* Tab: Pendências */}
              {viewModeResult.availableTabs.includes('pendings') && (
                <TabsContent value="pendings">
                  <CitizenPendingsTab
                    protocolId={protocol.id}
                    apiRequest={apiRequest}
                  />
                </TabsContent>
              )}

              {/* Tab: Documentos Enviados */}
              {viewModeResult.availableTabs.includes('documents') && (
                <TabsContent value="documents">
                  <CitizenDocumentsTab
                    protocolId={protocol.id}
                    documents={documents}
                  />
                </TabsContent>
              )}

              {/* Tab: Documentos Gerados */}
              {viewModeResult.availableTabs.includes('generated') && (
                <TabsContent value="generated">
                  <CitizenGeneratedDocumentsTab
                    generatedDocuments={generatedDocuments}
                  />
                </TabsContent>
              )}

              {/* Tab: Mensagens */}
              {viewModeResult.availableTabs.includes('messages') && (
                <TabsContent value="messages">
                  <CitizenProtocolInteractionsTab protocolId={protocol.id} />
                </TabsContent>
              )}

              {/* Tab: Histórico / Timeline */}
              {viewModeResult.availableTabs.includes('timeline') && (
                <TabsContent value="timeline">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Histórico de Ações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {protocol.history && protocol.history.length > 0 ? (
                        <div className="space-y-4">
                          {protocol.history.map((item) => (
                            <div
                              key={item.id}
                              className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0"
                            >
                              <div className="absolute left-0 top-0 -translate-x-1/2 bg-white">
                                <div className="h-3 w-3 rounded-full bg-blue-500 border-2 border-white"></div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">{item.action}</p>
                                  <span className="text-xs text-gray-500">
                                    {format(new Date(item.timestamp), "dd/MM/yyyy 'às' HH:mm", {
                                      locale: ptBR
                                    })}
                                  </span>
                                </div>
                                {item.comment && <p className="text-sm text-gray-600">{item.comment}</p>}
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
              )}

              {/* Tab: Cidadãos Vinculados (se disponível) */}
              <TabsContent value="citizens">
                <CitizenLinksDisplay protocolId={protocol.id} editable={false} />
              </TabsContent>
            </CitizenProtocolTabs>
          </div>

          {/* Coluna Lateral - Sidebar Compacta (1/4) */}
          <div className="lg:col-span-1">
            <CitizenCompactSidebar
              estimatedDays={protocol.service.estimatedDays || undefined}
              documentsCount={documents.length}
              pendingsCount={citizenPendingsCount}
              messagesCount={messagesCount}
              unreadMessagesCount={unreadMessagesCount}
              citizenLinksCount={0}
            />
          </div>
        </div>
      </div>
    </CitizenLayout>
  );
}
