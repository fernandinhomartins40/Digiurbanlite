'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Brain, Loader2, MessageSquare, Paperclip, Plus, Send, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  aiPlatformService,
  AiConversation,
  AiMessage,
  AiMessageAttachment,
  AiMessageMetadata,
} from '@/lib/services/ai-platform.service';

type PendingAttachment = AiMessageAttachment & { id: string };

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;
const TEXT_PREVIEW_LIMIT = 2500;
const MODEL_OPTIONS = [
  { value: 'qwen3.5:9b', label: 'Qwen 3.5 9B (principal)' },
  { value: 'digibot-qwen2.5:latest', label: 'DigiBot Qwen 2.5 (reserva)' },
];

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
}

function formatFileSize(size?: number): string {
  if (!size || size <= 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMs(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return '-';
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

function formatTps(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return '-';
  return `${value.toFixed(1)} tok/s`;
}

function isTextLikeFile(file: File): boolean {
  if (file.type.startsWith('text/')) return true;

  const extension = file.name.toLowerCase().split('.').pop();
  return ['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm', 'ts', 'tsx', 'js', 'jsx'].includes(
    extension || '',
  );
}

async function fileToAttachment(file: File): Promise<PendingAttachment> {
  let contentText: string | undefined;

  if (isTextLikeFile(file)) {
    try {
      const text = (await file.text()).trim();
      if (text) {
        contentText = text.slice(0, TEXT_PREVIEW_LIMIT);
      }
    } catch {
      contentText = undefined;
    }
  }

  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    mimeType: file.type || undefined,
    size: file.size,
    contentText,
  };
}

function getMetadata(message: AiMessage): AiMessageMetadata {
  if (!message.metadata || typeof message.metadata !== 'object') {
    return {};
  }
  return message.metadata;
}

function getMessageAttachments(message: AiMessage): AiMessageAttachment[] {
  const attachments = getMetadata(message).attachments;
  return Array.isArray(attachments) ? attachments : [];
}

function normalizeAssistantMessage(message: AiMessage, thinkEnabled: boolean): AiMessage {
  if (message.role !== 'ASSISTANT') {
    return message;
  }

  const metadata = getMetadata(message);
  const hasThinking = typeof metadata.thinking === 'string' && metadata.thinking.trim().length > 0;

  return {
    ...message,
    metadata: {
      ...metadata,
      thinkEnabled: metadata.thinkEnabled ?? thinkEnabled,
      thinkingStatus: hasThinking ? 'completed' : metadata.thinkingStatus,
    },
  };
}

export default function AdminAiPage() {
  const { toast } = useToast();

  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [conversationsModalOpen, setConversationsModalOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].value);
  const [thinkMode, setThinkMode] = useState(false);

  const messageListRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const aiPerformanceSummary = useMemo(() => {
    const assistantMetrics = messages
      .filter((message) => message.role === 'ASSISTANT')
      .map((message) => getMetadata(message).performance)
      .filter((metric): metric is NonNullable<AiMessageMetadata['performance']> => !!metric);

    if (!assistantMetrics.length) {
      return null;
    }

    const average = (values: Array<number | undefined>): number | undefined => {
      const filtered = values.filter((value): value is number => typeof value === 'number' && value > 0);
      if (!filtered.length) return undefined;
      return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
    };

    return {
      requests: assistantMetrics.length,
      avgLatencyMs: average(assistantMetrics.map((metric) => metric.latencyMs)),
      avgLoadMs: average(assistantMetrics.map((metric) => metric.loadDurationMs)),
      avgPromptMs: average(assistantMetrics.map((metric) => metric.promptEvalDurationMs)),
      avgEvalMs: average(assistantMetrics.map((metric) => metric.evalDurationMs)),
      avgTps: average(assistantMetrics.map((metric) => metric.tokensPerSecond)),
    };
  }, [messages]);

  const scrollMessagesToBottom = (): void => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  };

  const loadConversationById = async (conversationId: string): Promise<void> => {
    setLoadingMessages(true);
    try {
      const data = await aiPlatformService.getConversation(conversationId);
      setActiveConversationId(data.id);
      setMessages(data.messages || []);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadConversations = async (): Promise<void> => {
    setLoadingConversations(true);
    try {
      const list = await aiPlatformService.listConversations();
      setConversations(list);

      if (!list.length) {
        setActiveConversationId(null);
        setMessages([]);
        setLoadingMessages(false);
        return;
      }

      const selected =
        activeConversationId && list.some((conversation) => conversation.id === activeConversationId)
          ? activeConversationId
          : list[0].id;

      await loadConversationById(selected);
    } catch (error) {
      setLoadingMessages(false);
      toast({
        title: 'Erro ao carregar conversas',
        description: error instanceof Error ? error.message : 'Falha ao carregar o historico.',
        variant: 'destructive',
      });
    } finally {
      setLoadingConversations(false);
    }
  };

  const createConversation = async (): Promise<void> => {
    try {
      const created = await aiPlatformService.createConversation();
      setConversations((previous) => [created, ...previous]);
      setActiveConversationId(created.id);
      setMessages([]);
      setConversationsModalOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao criar conversa',
        description: error instanceof Error ? error.message : 'Nao foi possivel criar uma conversa.',
        variant: 'destructive',
      });
    }
  };

  const openConversation = async (conversationId: string): Promise<void> => {
    try {
      await loadConversationById(conversationId);
      setConversationsModalOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao abrir conversa',
        description: error instanceof Error ? error.message : 'Falha ao abrir a conversa.',
        variant: 'destructive',
      });
    }
  };

  const onFilesSelected = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    if (!selected.length) return;

    if (attachments.length + selected.length > MAX_ATTACHMENTS) {
      toast({
        title: 'Limite de anexos',
        description: `Voce pode anexar no maximo ${MAX_ATTACHMENTS} arquivos por mensagem.`,
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    const invalid = selected.find((file) => file.size > MAX_ATTACHMENT_SIZE);
    if (invalid) {
      toast({
        title: 'Arquivo muito grande',
        description: `${invalid.name} excede o limite de ${formatFileSize(MAX_ATTACHMENT_SIZE)}.`,
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    const nextAttachments = await Promise.all(selected.map(fileToAttachment));
    setAttachments((previous) => [...previous, ...nextAttachments]);
    event.target.value = '';
  };

  const removeAttachment = (attachmentId: string): void => {
    setAttachments((previous) => previous.filter((item) => item.id !== attachmentId));
  };

  const sendMessage = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (sending) return;

    const content = draft.trim();
    if (!content) return;

    setSending(true);
    const attachmentSnapshot = [...attachments];
    const attachmentPayload: AiMessageAttachment[] = attachmentSnapshot.map((item) => ({
      name: item.name,
      mimeType: item.mimeType,
      size: item.size,
      contentText: item.contentText,
    }));

    const optimisticUserMessageId = `optimistic-user-${Date.now()}`;
    const optimisticAssistantMessageId = `optimistic-assistant-${Date.now()}`;

    const optimisticUserMessage: AiMessage = {
      id: optimisticUserMessageId,
      role: 'USER',
      content,
      totalTokens: 0,
      createdAt: new Date().toISOString(),
      metadata: attachmentPayload.length > 0 ? { attachments: attachmentPayload } : null,
    };

    const optimisticAssistantMessage: AiMessage = {
      id: optimisticAssistantMessageId,
      role: 'ASSISTANT',
      content: '',
      totalTokens: 0,
      createdAt: new Date().toISOString(),
      metadata: {
        thinkingStatus: 'processing',
        thinkEnabled: thinkMode,
        thinking: thinkMode ? 'Analisando a solicitacao e preparando o raciocinio...' : undefined,
      },
    };

    setMessages((previous) => [...previous, optimisticUserMessage, optimisticAssistantMessage]);
    setDraft('');
    setAttachments([]);

    const updateOptimisticAssistant = (
      updater: (current: AiMessage) => AiMessage,
    ): void => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === optimisticAssistantMessageId ? updater(message) : message,
        ),
      );
    };

    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        const created = await aiPlatformService.createConversation();
        setConversations((previous) => [created, ...previous]);
        conversationId = created.id;
        setActiveConversationId(created.id);
      }

      const result = await aiPlatformService.streamMessage(
        conversationId,
        {
          content,
          model: selectedModel,
          think: thinkMode,
          attachments: attachmentPayload,
        },
        {
          onThinkingDelta: (delta) => {
            updateOptimisticAssistant((current) => {
              const metadata = getMetadata(current);
              return {
                ...current,
                metadata: {
                  ...metadata,
                  thinkEnabled: thinkMode,
                  thinkingStatus: 'processing',
                  thinking: `${metadata.thinking || ''}${delta}`,
                },
              };
            });
          },
          onContentDelta: (delta) => {
            updateOptimisticAssistant((current) => ({
              ...current,
              content: `${current.content || ''}${delta}`,
            }));
          },
        },
      );

      setMessages((previous) => [
        ...previous.filter((message) => message.id !== optimisticAssistantMessageId),
        normalizeAssistantMessage(result.assistantMessage, thinkMode),
      ]);

      const list = await aiPlatformService.listConversations();
      setConversations(list);
    } catch (error) {
      setMessages((previous) =>
        previous.filter(
          (message) =>
            message.id !== optimisticUserMessageId && message.id !== optimisticAssistantMessageId,
        ),
      );
      setDraft(content);
      setAttachments(attachmentSnapshot);

      toast({
        title: 'Erro ao enviar mensagem',
        description: error instanceof Error ? error.message : 'Falha ao conversar com a IA.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    scrollMessagesToBottom();
  }, [messages, loadingMessages]);

  return (
    <div className="space-y-4 pb-8">
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-4 w-4" />
                Assistente IA
              </CardTitle>
              <CardDescription>Experiencia de chat focada em IA com contexto e raciocinio.</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={() => setConversationsModalOpen(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Conversas
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-slate-50 px-3 py-2">
            <div className="flex min-w-[220px] items-center gap-2">
              <label htmlFor="ai-model-select" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                Modelo
              </label>
              <select
                id="ai-model-select"
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="h-9 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={thinkMode}
                onChange={(event) => setThinkMode(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              Modo think (mostrar raciocinio)
            </label>
          </div>

          <div className="grid gap-2 rounded-xl border bg-slate-50 p-3 text-xs text-slate-700 md:grid-cols-3">
            <div>
              <p className="font-semibold text-slate-800">Observabilidade</p>
              <p className="text-slate-500">
                {aiPerformanceSummary
                  ? `${aiPerformanceSummary.requests} respostas analisadas`
                  : 'Aguardando respostas para metricas'}
              </p>
            </div>
            <div className="space-y-1">
              <p>Latencia media: {formatMs(aiPerformanceSummary?.avgLatencyMs)}</p>
              <p>Load medio: {formatMs(aiPerformanceSummary?.avgLoadMs)}</p>
            </div>
            <div className="space-y-1">
              <p>Prompt medio: {formatMs(aiPerformanceSummary?.avgPromptMs)}</p>
              <p>Eval medio: {formatMs(aiPerformanceSummary?.avgEvalMs)}</p>
              <p>Throughput medio: {formatTps(aiPerformanceSummary?.avgTps)}</p>
            </div>
          </div>

          <div
            ref={messageListRef}
            className="max-h-[62vh] space-y-4 overflow-y-auto rounded-xl border bg-white p-4"
          >
            {loadingMessages ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando mensagens...
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-slate-50 p-6 text-sm text-slate-500">
                Inicie uma conversa enviando uma pergunta ou orientacao.
              </div>
            ) : (
              messages.map((message) => {
                const isUser = message.role === 'USER';
                const metadata = getMetadata(message);
                const messageAttachments = getMessageAttachments(message);
                const performance = metadata.performance;
                const thinkingText = typeof metadata.thinking === 'string' ? metadata.thinking.trim() : '';
                const thinkingStatus = metadata.thinkingStatus;
                const isThinkingNow = !isUser && thinkingStatus === 'processing';
                const showThinkingPanel = !isUser && (isThinkingNow || thinkingText.length > 0);
                const visibleContent = (message.content || '').trim();

                return (
                  <div
                    key={message.id}
                    className={`rounded-2xl border p-4 ${
                      isUser
                        ? 'ml-8 border-cyan-200 bg-cyan-50'
                        : 'mr-8 border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-600">
                      {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                      <span>{isUser ? 'Voce' : 'DigiUrban IA'}</span>
                      <span className="ml-auto text-[11px] normal-case tracking-normal text-slate-500">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>

                    {showThinkingPanel ? (
                      <details
                        className="mb-3 rounded-lg border border-slate-200 bg-white"
                        open={isThinkingNow}
                      >
                        <summary className="cursor-pointer list-none px-3 py-2 text-sm text-slate-700">
                          <span className="flex items-center gap-2">
                            {isThinkingNow ? (
                              <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
                            ) : (
                              <Brain className="h-4 w-4 text-cyan-600" />
                            )}
                            {isThinkingNow ? 'IA pensando...' : 'Raciocinio da IA'}
                          </span>
                        </summary>
                        <div className="whitespace-pre-wrap px-3 pb-3 text-xs text-slate-600">
                          {thinkingText || 'Processando o raciocinio...'}
                        </div>
                      </details>
                    ) : null}

                    {visibleContent ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                        {visibleContent}
                      </p>
                    ) : isThinkingNow ? (
                      <p className="text-sm text-slate-500">Preparando resposta...</p>
                    ) : null}

                    {!isUser && performance ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        <span className="rounded border bg-white px-2 py-1">
                          latencia: {formatMs(performance.latencyMs)}
                        </span>
                        <span className="rounded border bg-white px-2 py-1">
                          load: {formatMs(performance.loadDurationMs)}
                        </span>
                        <span className="rounded border bg-white px-2 py-1">
                          prompt: {formatMs(performance.promptEvalDurationMs)}
                        </span>
                        <span className="rounded border bg-white px-2 py-1">
                          eval: {formatMs(performance.evalDurationMs)}
                        </span>
                        <span className="rounded border bg-white px-2 py-1">
                          {formatTps(performance.tokensPerSecond)}
                        </span>
                      </div>
                    ) : null}

                    {messageAttachments.length > 0 ? (
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        {messageAttachments.map((attachment, index) => (
                          <div
                            key={`${message.id}-att-${index}`}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1"
                          >
                            {attachment.name}
                            {attachment.size ? ` (${formatFileSize(attachment.size)})` : ''}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <form className="space-y-3" onSubmit={sendMessage}>
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-[96px] resize-none"
              placeholder="Digite sua mensagem..."
            />

            {attachments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="inline-flex items-center gap-2 rounded-full border bg-slate-100 px-3 py-1 text-xs"
                  >
                    <span className="max-w-[240px] truncate">
                      {attachment.name}
                      {attachment.size ? ` (${formatFileSize(attachment.size)})` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="text-slate-500 hover:text-slate-800"
                      aria-label={`Remover ${attachment.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={onFilesSelected}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  Anexar arquivos
                </Button>
              </div>

              <Button type="submit" disabled={sending || !draft.trim()}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {thinkMode ? 'Pensando...' : 'Enviando...'}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={conversationsModalOpen} onOpenChange={setConversationsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Conversas</DialogTitle>
            <DialogDescription>
              Selecione uma conversa existente ou crie uma nova.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex justify-end">
              <Button type="button" onClick={createConversation}>
                <Plus className="mr-2 h-4 w-4" />
                Nova conversa
              </Button>
            </div>

            <div className="max-h-[45vh] space-y-2 overflow-y-auto rounded-md border p-2">
              {loadingConversations ? (
                <div className="flex items-center gap-2 p-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando conversas...
                </div>
              ) : conversations.length === 0 ? (
                <p className="p-2 text-sm text-slate-500">Nenhuma conversa encontrada.</p>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                      conversation.id === activeConversationId
                        ? 'border-cyan-400 bg-cyan-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-medium text-slate-800">
                      {conversation.title || 'Nova conversa'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Ultima atualizacao: {formatDate(conversation.lastMessageAt)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
