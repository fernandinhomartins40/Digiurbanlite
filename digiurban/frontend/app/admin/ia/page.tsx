'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Brain,
  Loader2,
  Menu,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  aiPlatformService,
  AiConversation,
  AiMessage,
  AiMessageAttachment,
  AiMessageMetadata,
} from '@/lib/services/ai-platform.service';

type PendingAttachment = AiMessageAttachment & { id: string };
type AdminChatMode = 'free' | 'rag';

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;
const TEXT_PREVIEW_LIMIT = 2500;
const MODEL_OPTIONS = [
  { value: 'qwen3.5:9b', label: 'Qwen 3.5 9B' },
  { value: 'digibot-qwen2.5:latest', label: 'DigiBot Qwen 2.5' },
];
const CHAT_MODE_OPTIONS: Array<{ value: AdminChatMode; label: string; description: string }> = [
  { value: 'free', label: 'Chat livre', description: 'Conversa direta com o modelo, sem RAG.' },
  { value: 'rag', label: 'Chat contextual', description: 'Usa base de conhecimento e contexto web.' },
];
const QUICK_PROMPTS = [
  'Crie um modelo de oficio para solicitar manutencao de equipamento.',
  'Me ajude a revisar este texto para um tom mais formal.',
  'Estruture um comunicado interno claro e objetivo.',
  'Transforme este rascunho em uma resposta institucional.',
];

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(size?: number): string {
  if (!size || size <= 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isTextLikeFile(file: File): boolean {
  if (file.type.startsWith('text/')) return true;
  const extension = file.name.toLowerCase().split('.').pop();
  return ['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm', 'ts', 'tsx', 'js', 'jsx'].includes(extension || '');
}

async function fileToAttachment(file: File): Promise<PendingAttachment> {
  let contentText: string | undefined;
  if (isTextLikeFile(file)) {
    try {
      const text = (await file.text()).trim();
      if (text) contentText = text.slice(0, TEXT_PREVIEW_LIMIT);
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
  if (!message.metadata || typeof message.metadata !== 'object') return {};
  return message.metadata;
}

function getMessageAttachments(message: AiMessage): AiMessageAttachment[] {
  const attachments = getMetadata(message).attachments;
  return Array.isArray(attachments) ? attachments : [];
}

function normalizeAssistantMessage(message: AiMessage, thinkEnabled: boolean, chatMode: AdminChatMode): AiMessage {
  if (message.role !== 'ASSISTANT') return message;
  const metadata = getMetadata(message);
  const hasThinking = typeof metadata.thinking === 'string' && metadata.thinking.trim().length > 0;
  return {
    ...message,
    metadata: {
      ...metadata,
      thinkEnabled: metadata.thinkEnabled ?? thinkEnabled,
      chatMode: metadata.chatMode ?? chatMode,
      thinkingStatus: hasThinking ? 'completed' : metadata.thinkingStatus,
    },
  };
}

function titleForConversation(conversation: AiConversation): string {
  const title = conversation.title?.trim();
  if (!title) return 'Nova conversa';
  return title.length > 54 ? `${title.slice(0, 54)}...` : title;
}

export default function AdminAiPage() {
  const { toast } = useToast();

  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationsModalOpen, setConversationsModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].value);
  const [chatMode, setChatMode] = useState<AdminChatMode>('free');
  const [thinkMode, setThinkMode] = useState(false);
  const [webSearchMode, setWebSearchMode] = useState(false);

  const messageListRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId],
  );

  const scrollMessagesToBottom = (): void => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  };

  const loadConversationById = async (conversationId: string): Promise<void> => {
    setLoadingMessages(true);
    try {
      const data = await aiPlatformService.getConversation(conversationId);
      setActiveConversationId(data.id);
      setMessages((data.messages || []).map((message) => normalizeAssistantMessage(message, thinkMode, chatMode)));
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
      setDraft('');
      setAttachments([]);
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

  const applyPromptSuggestion = (prompt: string): void => {
    if (sending) return;
    setDraft(prompt);
    window.requestAnimationFrame(() => textAreaRef.current?.focus());
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
    setMessages((previous) => [
      ...previous,
      {
        id: optimisticUserMessageId,
        role: 'USER',
        content,
        totalTokens: 0,
        createdAt: new Date().toISOString(),
        metadata: attachmentPayload.length > 0 ? { attachments: attachmentPayload } : null,
      },
      {
        id: optimisticAssistantMessageId,
        role: 'ASSISTANT',
        content: '',
        totalTokens: 0,
        createdAt: new Date().toISOString(),
        metadata: {
          thinkingStatus: 'processing',
          thinkEnabled: thinkMode,
          chatMode,
          thinking: thinkMode ? 'Analisando e preparando resposta...' : undefined,
        },
      },
    ]);

    setDraft('');
    setAttachments([]);

    const updateOptimisticAssistant = (updater: (current: AiMessage) => AiMessage): void => {
      setMessages((previous) =>
        previous.map((message) => (message.id === optimisticAssistantMessageId ? updater(message) : message)),
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
          mode: chatMode,
          think: thinkMode,
          webSearch: webSearchMode,
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
                  chatMode,
                  thinkingStatus: 'processing',
                  thinking: `${metadata.thinking || ''}${delta}`,
                },
              };
            });
          },
          onContentDelta: (delta) => {
            updateOptimisticAssistant((current) => ({ ...current, content: `${current.content || ''}${delta}` }));
          },
        },
      );

      setMessages((previous) => [
        ...previous.filter((message) => message.id !== optimisticAssistantMessageId),
        normalizeAssistantMessage(result.assistantMessage, thinkMode, chatMode),
      ]);

      const list = await aiPlatformService.listConversations();
      setConversations(list);
    } catch (error) {
      setMessages((previous) =>
        previous.filter((message) => message.id !== optimisticUserMessageId && message.id !== optimisticAssistantMessageId),
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
    if (chatMode === 'free' && webSearchMode) setWebSearchMode(false);
  }, [chatMode, webSearchMode]);

  useEffect(() => {
    scrollMessagesToBottom();
  }, [messages, loadingMessages]);

  return (
    <div className="h-[calc(100vh-11rem)] min-h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/70">
      <div className="flex h-full">
        <aside className="hidden w-80 shrink-0 flex-col border-r border-slate-200 bg-white/70 lg:flex">
          <div className="border-b border-slate-200 p-3">
            <Button type="button" className="w-full justify-start gap-2 rounded-xl" onClick={() => void createConversation()}>
              <Plus className="h-4 w-4" />
              Nova conversa
            </Button>
          </div>
          <div className="px-3 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Conversas recentes
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-2">
            {loadingConversations ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : conversations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                Nenhuma conversa ainda.
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => void openConversation(conversation.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    conversation.id === activeConversationId
                      ? 'border-cyan-300 bg-cyan-50'
                      : 'border-transparent bg-white hover:border-slate-200'
                  }`}
                >
                  <p className="truncate text-sm font-medium text-slate-800">{titleForConversation(conversation)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(conversation.lastMessageAt)}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-slate-50 to-slate-100/40">
          <header className="border-b border-slate-200 bg-white/90 px-3 py-2 backdrop-blur sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => setConversationsModalOpen(true)}>
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {activeConversation ? titleForConversation(activeConversation) : 'Assistente IA'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {CHAT_MODE_OPTIONS.find((option) => option.value === chatMode)?.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={chatMode}
                  onChange={(event) => setChatMode(event.target.value as AdminChatMode)}
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {CHAT_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <select
                  value={selectedModel}
                  onChange={(event) => setSelectedModel(event.target.value)}
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </header>

          <div ref={messageListRef} className="flex-1 overflow-y-auto px-1 sm:px-3">
            {loadingMessages ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando mensagens...
              </div>
            ) : messages.length === 0 ? (
              <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center px-5 pb-10 text-center">
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  IA Centralizada
                </span>
                <h2 className="font-serif text-3xl tracking-tight text-slate-900 sm:text-5xl">Por onde comecamos?</h2>
                <p className="mt-4 max-w-xl text-sm text-slate-600">
                  Chat livre para redacao e revisao. Ative o modo contextual quando precisar de RAG.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => applyPromptSuggestion(prompt)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
                {messages.map((message) => {
                  const isUser = message.role === 'USER';
                  const metadata = getMetadata(message);
                  const messageAttachments = getMessageAttachments(message);
                  const webSearch = metadata.webSearch;
                  const webSources = Array.isArray(webSearch?.sources) ? webSearch.sources : [];
                  const thinkingText = typeof metadata.thinking === 'string' ? metadata.thinking.trim() : '';
                  const isThinkingNow = !isUser && metadata.thinkingStatus === 'processing';
                  const showThinkingPanel = !isUser && (isThinkingNow || thinkingText.length > 0);
                  const visibleContent = (message.content || '').trim();

                  return (
                    <div key={message.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser ? (
                        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                          <Bot className="h-4 w-4" />
                        </div>
                      ) : null}

                      <div
                        className={`${
                          isUser ? 'max-w-[86%]' : 'max-w-[92%]'
                        } rounded-2xl px-4 py-3 shadow-sm ${
                          isUser
                            ? 'border border-cyan-200 bg-cyan-50 text-slate-800'
                            : 'border border-slate-200 bg-white/95 text-slate-800'
                        }`}
                      >
                        <div className={`mb-2 flex items-center gap-2 text-[11px] ${isUser ? 'text-cyan-700' : 'text-slate-500'}`}>
                          <span className="font-semibold uppercase tracking-wide">{isUser ? 'Voce' : 'DigiUrban IA'}</span>
                          <span>{formatDate(message.createdAt)}</span>
                        </div>

                        {showThinkingPanel ? (
                          <details className="mb-3 rounded-lg border border-slate-200 bg-slate-50" open={isThinkingNow}>
                            <summary className="cursor-pointer list-none px-3 py-2 text-sm text-slate-700">
                              <span className="flex items-center gap-2">
                                {isThinkingNow ? <Loader2 className="h-4 w-4 animate-spin text-cyan-600" /> : <Brain className="h-4 w-4 text-cyan-600" />}
                                {isThinkingNow ? 'IA pensando...' : 'Raciocinio'}
                              </span>
                            </summary>
                            <div className="whitespace-pre-wrap px-3 pb-3 text-xs text-slate-600">{thinkingText || 'Processando raciocinio...'}</div>
                          </details>
                        ) : null}

                        {visibleContent ? (
                          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">{visibleContent}</p>
                        ) : null}

                        {messageAttachments.length > 0 ? (
                          <div className="mt-3 space-y-1 text-xs">
                            {messageAttachments.map((attachment, index) => (
                              <div
                                key={`${message.id}-att-${index}`}
                                className={`rounded-md border px-2 py-1 ${
                                  isUser ? 'border-cyan-200 bg-cyan-100 text-cyan-800' : 'border-slate-200 bg-slate-50 text-slate-600'
                                }`}
                              >
                                {attachment.name}{attachment.size ? ` (${formatFileSize(attachment.size)})` : ''}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {!isUser && webSources.length > 0 ? (
                          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                            <p className="mb-2 font-semibold text-slate-700">Fontes web ({webSearch?.provider || 'provider'})</p>
                            <ul className="space-y-1">
                              {webSources.slice(0, 5).map((source, index) => (
                                <li key={`${message.id}-web-${index}`}>
                                  <a href={source.url} target="_blank" rel="noreferrer" className="text-cyan-700 underline decoration-cyan-300 underline-offset-2 hover:text-cyan-800">
                                    {source.title || source.url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>

                      {isUser ? (
                        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-white">
                          <User className="h-4 w-4" />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200/80 bg-white/95 p-3 backdrop-blur">
            <div className="mx-auto w-full max-w-4xl">
              <form onSubmit={sendMessage} className="space-y-0">
                <div className="rounded-[28px] border border-slate-200 bg-white/95 px-3 pb-2 pt-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100">
                  <Textarea
                    ref={textAreaRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="min-h-[100px] resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-7 shadow-none focus-visible:ring-0"
                    placeholder={chatMode === 'free' ? 'Escreva livremente... ex: crie um oficio, revise um texto, estruture um comunicado.' : 'Descreva o que precisa considerando o contexto do sistema.'}
                  />

                  {attachments.length > 0 ? (
                    <div className="mb-2 flex flex-wrap gap-2 px-1">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-700">
                          <span className="max-w-[240px] truncate">
                            {attachment.name}{attachment.size ? ` (${formatFileSize(attachment.size)})` : ''}
                          </span>
                          <button type="button" onClick={() => removeAttachment(attachment.id)} className="text-slate-500 hover:text-slate-800" aria-label={`Remover ${attachment.name}`}>
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onFilesSelected} />
                      <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="mr-1 h-4 w-4" />
                        Anexar
                      </Button>
                      <label className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-700">
                        <input type="checkbox" checked={thinkMode} onChange={(event) => setThinkMode(event.target.checked)} className="h-3.5 w-3.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                        Think
                      </label>
                      <label className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${chatMode === 'free' ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 text-slate-700'}`}>
                        <input type="checkbox" checked={webSearchMode} onChange={(event) => setWebSearchMode(event.target.checked)} disabled={chatMode === 'free'} className="h-3.5 w-3.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                        Web
                      </label>
                    </div>

                    <Button type="submit" disabled={sending || !draft.trim()} className="rounded-full px-4">
                      {sending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>

      <Dialog open={conversationsModalOpen} onOpenChange={setConversationsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Conversas</DialogTitle>
            <DialogDescription>Escolha uma conversa ou crie uma nova.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button type="button" className="w-full justify-start gap-2" onClick={() => void createConversation()}>
              <Plus className="h-4 w-4" />
              Nova conversa
            </Button>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
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
                    onClick={() => void openConversation(conversation.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                      conversation.id === activeConversationId ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="truncate font-medium text-slate-800">{titleForConversation(conversation)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(conversation.lastMessageAt)}</p>
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
