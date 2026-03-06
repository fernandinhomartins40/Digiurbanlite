'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, MessageSquare, Paperclip, Plus, Send, X } from 'lucide-react';
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
} from '@/lib/services/ai-platform.service';

type PendingAttachment = AiMessageAttachment & { id: string };

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;
const TEXT_PREVIEW_LIMIT = 2500;

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

function getMessageAttachments(message: AiMessage): AiMessageAttachment[] {
  if (!message.metadata || typeof message.metadata !== 'object') return [];
  const attachments = (message.metadata as { attachments?: unknown }).attachments;
  if (!Array.isArray(attachments)) return [];

  return attachments
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Record<string, unknown>;
      if (typeof raw.name !== 'string') return null;

      return {
        name: raw.name,
        mimeType: typeof raw.mimeType === 'string' ? raw.mimeType : undefined,
        size: typeof raw.size === 'number' ? raw.size : undefined,
        contentText: typeof raw.contentText === 'string' ? raw.contentText : undefined,
      } as AiMessageAttachment;
    })
    .filter((item): item is AiMessageAttachment => item !== null);
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

  const messageListRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [activeConversationId, conversations],
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

    const optimisticMessageId = `optimistic-${Date.now()}`;
    const optimisticUserMessage: AiMessage = {
      id: optimisticMessageId,
      role: 'USER',
      content,
      totalTokens: 0,
      createdAt: new Date().toISOString(),
      metadata: attachmentPayload.length > 0 ? { attachments: attachmentPayload } : null,
    };

    setMessages((previous) => [...previous, optimisticUserMessage]);
    setDraft('');
    setAttachments([]);

    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        const created = await aiPlatformService.createConversation();
        setConversations((previous) => [created, ...previous]);
        conversationId = created.id;
        setActiveConversationId(created.id);
      }

      const result = await aiPlatformService.sendMessage(conversationId, {
        content,
        attachments: attachmentPayload,
      });

      setMessages((previous) => [...previous, result.assistantMessage]);
      const list = await aiPlatformService.listConversations();
      setConversations(list);
    } catch (error) {
      setMessages((previous) => previous.filter((message) => message.id !== optimisticMessageId));
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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-4 w-4" />
                Assistente IA
              </CardTitle>
              <CardDescription>Converse com a IA e acompanhe o historico da conversa.</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={() => setConversationsModalOpen(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Conversas
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            ref={messageListRef}
            className="max-h-[56vh] space-y-3 overflow-y-auto rounded-lg border bg-slate-50 p-4"
          >
            {loadingMessages ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando mensagens...
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-slate-500">Inicie uma conversa enviando uma mensagem.</p>
            ) : (
              messages.map((message) => {
                const isUser = message.role === 'USER';
                const messageAttachments = getMessageAttachments(message);

                return (
                  <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        isUser ? 'bg-cyan-600 text-white' : 'border bg-white text-slate-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>

                      {messageAttachments.length > 0 ? (
                        <div className={`mt-2 space-y-1 text-xs ${isUser ? 'text-cyan-100' : 'text-slate-500'}`}>
                          {messageAttachments.map((attachment, index) => (
                            <div key={`${message.id}-att-${index}`} className="rounded-md border border-current/30 px-2 py-1">
                              {attachment.name}
                              {attachment.size ? ` (${formatFileSize(attachment.size)})` : ''}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <p className={`mt-2 text-[11px] ${isUser ? 'text-cyan-100' : 'text-slate-400'}`}>
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form className="space-y-3" onSubmit={sendMessage}>
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-[90px] resize-none"
              placeholder="Digite sua mensagem..."
            />

            {attachments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="inline-flex items-center gap-2 rounded-full border bg-slate-100 px-3 py-1 text-xs"
                  >
                    <span className="truncate max-w-[220px]">
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
                    Enviando...
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
