'use client';

/**
 * Detalhe do pedido (cidadão) — uma coluna, de cima para baixo:
 *   1. Voltar + nome do serviço + número e situação
 *   2. "Agora": o que está acontecendo e a ÚNICA ação esperada (se houver)
 *   3. Abas: Pendências (só quando há) · Documentos · Mensagens · Detalhes · Histórico
 *   4. Cancelar o pedido, discreto no fim
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Hourglass,
  Loader2,
  XCircle,
} from 'lucide-react';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { cn } from '@/lib/utils';
import { getCitizenProtocolViewMode, CitizenProtocolViewMode } from '@/lib/citizen-protocol-view-mode';
import { CitizenProtocolSummaryTab } from '@/components/citizen/CitizenProtocolSummaryTab';
import { CitizenDocumentsTab } from '@/components/citizen/CitizenDocumentsTab';
import { CitizenGeneratedDocumentsTab } from '@/components/citizen/CitizenGeneratedDocumentsTab';
import { CitizenPendingsTab } from '@/components/citizen/CitizenPendingsTab';
import { CitizenProtocolInteractionsTab } from '@/components/citizen/CitizenProtocolInteractionsTab';
import { CitizenDocumentUploadModal } from '@/components/citizen/CitizenDocumentUploadModal';
import { CitizenDocumentViewer } from '@/components/citizen/CitizenDocumentViewer';
import { CancelProtocolDialog } from '@/components/citizen/CancelProtocolDialog';
import { citizenStatusInfo } from '@/lib/citizen-protocol-status';
import {
  CitizenProtocol,
  CitizenWorkflowStage,
  CitizenPending,
  CitizenDocument,
  CitizenGeneratedDocument,
} from '@/types/citizen-protocol';

type TabId = 'pendings' | 'documents' | 'messages' | 'details' | 'timeline';

const isOpenCitizenPending = (pending: CitizenPending) =>
  ['OPEN', 'IN_PROGRESS'].includes(pending.status) && pending.requiresCitizenAction === true;

export default function ProtocolDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { apiRequest } = useCitizenAuth();

  const [protocol, setProtocol] = useState<CitizenProtocol | null>(null);
  const [stages, setStages] = useState<CitizenWorkflowStage[]>([]);
  const [pendings, setPendings] = useState<CitizenPending[]>([]);
  const [documents, setDocuments] = useState<CitizenDocument[]>([]);
  const [generatedDocuments, setGeneratedDocuments] = useState<CitizenGeneratedDocument[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadDocumentType, setUploadDocumentType] = useState('');
  const [viewingDocument, setViewingDocument] = useState<CitizenDocument | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const fetchProtocolDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest(`/citizen/protocols/${params.id}`);
      if (!data.protocol) throw new Error('Pedido não encontrado');

      setProtocol({
        ...data.protocol,
        history: data.history || [],
        _count: { history: data.history?.length || 0, evaluations: 0 },
      });

      // o resto é complementar: se algo falhar, a tela abre mesmo assim
      const [stagesData, pendingsData, docsData, generatedData, unreadData] = await Promise.all([
        apiRequest(`/citizen/protocols/${params.id}/stages`).catch(() => null),
        apiRequest(`/citizen/protocols/${params.id}/pendings`).catch(() => null),
        apiRequest(`/citizen/protocols/${params.id}/documents`).catch(() => null),
        apiRequest(`/citizen/protocols/${params.id}/generated-documents`).catch(() => null),
        apiRequest(`/citizen/protocols/${params.id}/interactions/unread-count`).catch(() => null),
      ]);
      setStages(stagesData?.stages || stagesData?.data || []);
      setPendings(pendingsData?.pendings || pendingsData?.data || []);
      setDocuments(docsData?.documents || []);
      setGeneratedDocuments(generatedData?.documents || []);
      setUnreadMessagesCount(unreadData?.unreadCount || 0);
    } catch (err: any) {
      const message = err?.message || 'Não foi possível abrir o pedido';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProtocolDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const view = useMemo(
    () => (protocol ? getCitizenProtocolViewMode(protocol.status, stages, pendings) : null),
    [protocol, stages, pendings]
  );

  const openPendings = pendings.filter(isOpenCitizenPending);
  const underReview = pendings.filter((p) => p.status === 'UNDER_REVIEW' && p.requiresCitizenAction === true);
  const hasPendingsTab = pendings.some((p) => p.requiresCitizenAction === true);

  const tabs: Array<{ id: TabId; label: string; count?: number; alert?: boolean }> = [
    ...(hasPendingsTab ? [{ id: 'pendings' as TabId, label: 'Pendências', count: openPendings.length, alert: true }] : []),
    { id: 'documents', label: 'Documentos', count: generatedDocuments.length || undefined },
    { id: 'messages', label: 'Mensagens', count: unreadMessagesCount || undefined },
    { id: 'details', label: 'Detalhes' },
    { id: 'timeline', label: 'Histórico' },
  ];
  const currentTab: TabId = activeTab || (openPendings.length > 0 || underReview.length > 0 ? 'pendings' : 'details');

  const goToTab = (tab: TabId) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => document.getElementById('pedido-abas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const downloadUrl = (doc: CitizenGeneratedDocument, inline = false) =>
    `/api/citizen/protocols/${protocol?.id}/generated-documents/${doc.id}/download${inline ? '?inline=true' : ''}`;

  const triggerDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !protocol) {
    return (
      <CitizenLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </CitizenLayout>
    );
  }

  if (error || !protocol || !view) {
    return (
      <CitizenLayout>
        <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-3 text-center">
          <XCircle className="h-10 w-10 text-red-400" />
          <p className="font-medium text-gray-900">Não foi possível abrir este pedido</p>
          <p className="text-sm text-gray-600">{error || 'Pedido não encontrado'}</p>
          <Button variant="outline" onClick={() => router.push('/cidadao/protocolos')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Meus pedidos
          </Button>
        </div>
      </CitizenLayout>
    );
  }

  const status = citizenStatusInfo(protocol.status, openPendings.length);
  const canCancel = protocol.status === 'VINCULADO' || protocol.status === 'PROGRESSO';
  const orderedStages = [...stages].sort((a, b) => a.stageOrder - b.stageOrder);
  const currentStageIndex = view.currentStage ? orderedStages.findIndex((s) => s.id === view.currentStage?.id) : -1;
  const doneStages = orderedStages.filter((s) => s.status === 'COMPLETED').length;

  /* ---------------- bloco "Agora" ---------------- */
  let now: { tone: 'orange' | 'blue' | 'green' | 'gray'; icon: typeof Clock; title: string; text: string; action?: { label: string; onClick: () => void; icon?: typeof Download } };
  if (protocol.status === 'CANCELADO') {
    now = { tone: 'gray', icon: XCircle, title: 'Pedido cancelado', text: 'Este pedido foi encerrado sem conclusão.' };
  } else if (protocol.status === 'CONCLUIDO') {
    const firstDoc = generatedDocuments[0];
    now = {
      tone: 'green',
      icon: CheckCircle2,
      title: 'Pedido concluído',
      text: firstDoc
        ? 'O documento do seu pedido está pronto.'
        : 'A prefeitura finalizou o atendimento deste pedido.',
      action: firstDoc
        ? { label: generatedDocuments.length > 1 ? 'Ver documentos' : 'Baixar documento', icon: Download, onClick: () => (generatedDocuments.length > 1 ? goToTab('documents') : triggerDownload(downloadUrl(firstDoc), firstDoc.name || 'documento')) }
        : undefined,
    };
  } else if (openPendings.length > 0) {
    const onlyDocs = openPendings.every((p) => (p.type || p.pendingType) === 'DOCUMENT');
    now = {
      tone: 'orange',
      icon: AlertCircle,
      title: 'A prefeitura precisa de algo seu',
      text:
        openPendings.length === 1
          ? openPendings[0].title || openPendings[0].description
          : `${openPendings.length} ${onlyDocs ? 'documentos para enviar' : 'itens para responder'}. Sem isso o pedido não avança.`,
      action: { label: onlyDocs ? 'Enviar agora' : 'Responder agora', onClick: () => goToTab('pendings') },
    };
  } else if (underReview.length > 0) {
    now = { tone: 'blue', icon: Hourglass, title: 'Recebemos sua resposta', text: 'A equipe está conferindo o que você enviou. Avisamos quando houver novidade.' };
  } else {
    now = {
      tone: 'blue',
      icon: Clock,
      title: view.mode === CitizenProtocolViewMode.COMPLETING ? 'Quase pronto' : 'Em análise pela prefeitura',
      text: protocol.service.estimatedDays
        ? `Prazo estimado: ${protocol.service.estimatedDays} dia(s). Você não precisa fazer nada agora.`
        : 'Você não precisa fazer nada agora. Avisamos quando houver novidade.',
    };
  }
  const toneClass = {
    orange: 'border-orange-200 bg-orange-50 text-orange-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    gray: 'border-gray-200 bg-gray-50 text-gray-800',
  }[now.tone];
  const NowIcon = now.icon;
  const ActionIcon = now.action?.icon;

  return (
    <CitizenLayout>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        {/* 1. cabeçalho */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 break-words">{protocol.service.name}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
            <span>Pedido nº {protocol.number}</span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', status.className)}>{status.label}</span>
          </div>
        </div>

        {/* 2. agora */}
        <div className={cn('rounded-2xl border p-4 sm:p-5', toneClass)}>
          <div className="flex items-start gap-3">
            <NowIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-semibold">{now.title}</p>
              <p className="text-sm opacity-90 break-words">{now.text}</p>
              {orderedStages.length > 1 && protocol.status !== 'CANCELADO' && (
                <div className="pt-2">
                  <div className="flex gap-1" aria-hidden>
                    {orderedStages.map((stage, index) => (
                      <span
                        key={stage.id}
                        className={cn(
                          'h-1.5 flex-1 rounded-full',
                          stage.status === 'COMPLETED' || protocol.status === 'CONCLUIDO'
                            ? 'bg-current opacity-70'
                            : index === currentStageIndex
                              ? 'bg-current opacity-40'
                              : 'bg-current opacity-15'
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs opacity-80">
                    {protocol.status === 'CONCLUIDO'
                      ? `Todas as ${orderedStages.length} etapas concluídas`
                      : view.currentStage
                        ? `Etapa ${currentStageIndex + 1} de ${orderedStages.length}: ${view.currentStage.stageName}`
                        : `${doneStages} de ${orderedStages.length} etapas concluídas`}
                  </p>
                </div>
              )}
            </div>
          </div>
          {now.action && (
            <Button onClick={now.action.onClick} className="mt-4 h-11 w-full sm:w-auto">
              {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
              {now.action.label}
            </Button>
          )}
        </div>

        {/* 3. abas */}
        <div id="pedido-abas" className="scroll-mt-20 space-y-4">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Partes do pedido">
            <div className="flex w-max gap-1 rounded-xl bg-gray-100 p-1 sm:w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={currentTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors sm:flex-1',
                    currentTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {tab.label}
                  {!!tab.count && (
                    <span
                      className={cn(
                        'min-w-[1.25rem] rounded-full px-1.5 text-xs font-semibold',
                        tab.alert ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {currentTab === 'pendings' && <CitizenPendingsTab protocolId={protocol.id} apiRequest={apiRequest} />}

          {currentTab === 'documents' && (
            <div className="space-y-4">
              {generatedDocuments.length > 0 && (
                <CitizenGeneratedDocumentsTab
                  generatedDocuments={generatedDocuments}
                  onView={(doc) => window.open(downloadUrl(doc, true), '_blank')}
                  onDownload={(doc) => triggerDownload(downloadUrl(doc), doc.name || 'documento')}
                  onPrint={(doc) => {
                    const printWindow = window.open(downloadUrl(doc, true), '_blank');
                    if (printWindow) printWindow.onload = () => printWindow.print();
                    else toast.error('Não foi possível abrir a impressão');
                  }}
                />
              )}
              <CitizenDocumentsTab
                protocolId={protocol.id}
                documents={documents}
                onViewDocument={(doc) => setViewingDocument(doc)}
                onDownloadDocument={(doc) =>
                  triggerDownload(`/api/citizen/protocols/${protocol.id}/documents/${doc.id}/download`, doc.fileName || 'documento')
                }
                onUploadDocument={(type) => {
                  setUploadDocumentType(type);
                  setUploadModalOpen(true);
                }}
              />
            </div>
          )}

          {currentTab === 'messages' && <CitizenProtocolInteractionsTab protocolId={protocol.id} />}

          {currentTab === 'details' && <CitizenProtocolSummaryTab protocol={protocol} />}

          {currentTab === 'timeline' && (
            <Card>
              <CardContent className="p-4 sm:p-6">
                {protocol.history && protocol.history.length > 0 ? (
                  <ol className="space-y-4">
                    {protocol.history.map((item) => (
                      <li key={item.id} className="relative border-l-2 border-gray-200 pb-1 pl-5 last:border-transparent">
                        <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
                        <p className="font-medium text-gray-900">{item.action}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(item.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {item.comment && <p className="mt-1 text-sm text-gray-600">{item.comment}</p>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="py-6 text-center text-sm text-gray-500">Ainda não há movimentações.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 4. cancelar */}
        {canCancel && (
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="text-sm text-red-600 hover:text-red-700 hover:underline"
            >
              Cancelar este pedido
            </button>
          </div>
        )}
      </div>

      <CancelProtocolDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        protocolId={protocol.id}
        protocolNumber={protocol.number}
        onSuccess={() => {
          setCancelOpen(false);
          void fetchProtocolDetails();
        }}
      />

      <CitizenDocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        protocolId={protocol.id}
        documentType={uploadDocumentType}
        onUploadSuccess={() => {
          void fetchProtocolDetails();
          toast.success('Documento enviado!');
        }}
        apiRequest={apiRequest}
      />

      {viewingDocument && (
        <CitizenDocumentViewer
          isOpen
          onClose={() => setViewingDocument(null)}
          documentUrl={viewingDocument.fileUrl || ''}
          documentName={viewingDocument.fileName}
          mimeType={viewingDocument.mimeType || undefined}
          protocolId={protocol.id}
          documentId={viewingDocument.id}
        />
      )}
    </CitizenLayout>
  );
}
