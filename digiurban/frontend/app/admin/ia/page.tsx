'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Bot, Database, KeyRound, Loader2, Plus, RefreshCw, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  aiPlatformService,
  AiApiKey,
  AiConversation,
  AiKnowledgeSource,
  AiMessage,
  AiPlan,
  AiUsageSummary,
} from '@/lib/services/ai-platform.service';

type Tab = 'chat' | 'knowledge' | 'tokens';

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
}

export default function AdminAiPage() {
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>('chat');
  const [model, setModel] = useState('qwen3.5:9b');

  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(true);

  const [knowledge, setKnowledge] = useState<AiKnowledgeSource[]>([]);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [ingestingId, setIngestingId] = useState<string | null>(null);

  const [plans, setPlans] = useState<AiPlan[]>([]);
  const [apiKeys, setApiKeys] = useState<AiApiKey[]>([]);
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanRpm, setNewPlanRpm] = useState('60');
  const [newPlanBudget, setNewPlanBudget] = useState('1000000');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPlanId, setNewKeyPlanId] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const selectedConversation = conversations.find((item) => item.id === conversationId) || null;

  async function loadChat(): Promise<void> {
    setLoadingChat(true);
    try {
      const list = await aiPlatformService.listConversations();
      setConversations(list);
      if (list.length > 0) {
        const selected = conversationId && list.some((item) => item.id === conversationId)
          ? conversationId
          : list[0].id;
        await openConversation(selected);
      } else {
        setConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar chat',
        description: error instanceof Error ? error.message : 'Falha ao carregar conversas.',
        variant: 'destructive',
      });
    } finally {
      setLoadingChat(false);
    }
  }

  async function openConversation(id: string): Promise<void> {
    const data = await aiPlatformService.getConversation(id);
    setConversationId(data.id);
    setMessages(data.messages || []);
  }

  async function createConversation(): Promise<void> {
    try {
      const created = await aiPlatformService.createConversation();
      setConversations((prev) => [created, ...prev]);
      setConversationId(created.id);
      setMessages([]);
    } catch (error) {
      toast({
        title: 'Erro ao criar conversa',
        description: error instanceof Error ? error.message : 'Falha ao criar conversa.',
        variant: 'destructive',
      });
    }
  }

  async function sendMessage(event: FormEvent): Promise<void> {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      let id = conversationId;
      if (!id) {
        const created = await aiPlatformService.createConversation();
        setConversations((prev) => [created, ...prev]);
        id = created.id;
        setConversationId(id);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          role: 'USER',
          content,
          totalTokens: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      setDraft('');

      await aiPlatformService.sendMessage(id, { content, model });
      await loadChat();
      await loadUsage();
    } catch (error) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error instanceof Error ? error.message : 'Falha ao enviar mensagem.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }

  async function loadKnowledge(): Promise<void> {
    setLoadingKnowledge(true);
    try {
      setKnowledge(await aiPlatformService.listKnowledgeSources());
    } catch (error) {
      toast({
        title: 'Erro ao carregar conhecimento',
        description: error instanceof Error ? error.message : 'Falha ao listar fontes.',
        variant: 'destructive',
      });
    } finally {
      setLoadingKnowledge(false);
    }
  }

  async function bootstrapKnowledge(): Promise<void> {
    setBootstrapping(true);
    try {
      const result = await aiPlatformService.bootstrapSystemKnowledge();
      toast({
        title: 'Base atualizada',
        description: `Criadas ${result.created}, atualizadas ${result.updated}, ingeridas ${result.ingestedSources}.`,
      });
      await loadKnowledge();
    } catch (error) {
      toast({
        title: 'Erro no bootstrap',
        description: error instanceof Error ? error.message : 'Falha ao atualizar a base.',
        variant: 'destructive',
      });
    } finally {
      setBootstrapping(false);
    }
  }

  async function ingestSource(sourceId: string): Promise<void> {
    setIngestingId(sourceId);
    try {
      const result = await aiPlatformService.ingestKnowledgeSource(sourceId);
      toast({ title: 'Fonte ingerida', description: `${result.chunks} chunks processados.` });
      await loadKnowledge();
    } catch (error) {
      toast({
        title: 'Erro na ingestão',
        description: error instanceof Error ? error.message : 'Falha ao ingerir fonte.',
        variant: 'destructive',
      });
    } finally {
      setIngestingId(null);
    }
  }

  async function loadUsage(): Promise<void> {
    try {
      setUsage(await aiPlatformService.usageSummary());
    } catch {
      setUsage(null);
    }
  }

  async function loadTokens(): Promise<void> {
    setLoadingTokens(true);
    try {
      const [plansData, keysData, usageData] = await Promise.all([
        aiPlatformService.listPlans(),
        aiPlatformService.listApiKeys(),
        aiPlatformService.usageSummary(),
      ]);
      setPlans(plansData);
      setApiKeys(keysData);
      setUsage(usageData);
      if (!newKeyPlanId && plansData.length > 0) {
        setNewKeyPlanId(plansData[0].id);
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar tokens',
        description: error instanceof Error ? error.message : 'Falha ao carregar planos/chaves.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTokens(false);
    }
  }

  async function createPlan(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!newPlanName.trim()) return;

    try {
      await aiPlatformService.createPlan({
        name: newPlanName.trim(),
        requestLimitPerMinute: Number(newPlanRpm) || 60,
        monthlyBudgetTokens: Number(newPlanBudget) || 1_000_000,
      });
      setNewPlanName('');
      await loadTokens();
      toast({ title: 'Plano criado', description: 'Plano de tokens criado com sucesso.' });
    } catch (error) {
      toast({
        title: 'Erro ao criar plano',
        description: error instanceof Error ? error.message : 'Falha ao criar plano.',
        variant: 'destructive',
      });
    }
  }

  async function createApiKey(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!newKeyName.trim() || !newKeyPlanId) return;

    try {
      const created = await aiPlatformService.createApiKey({
        name: newKeyName.trim(),
        planId: newKeyPlanId,
      });
      setNewKeyName('');
      setRevealedKey(created.rawKey);
      await loadTokens();
      toast({ title: 'Chave criada', description: 'Copie a chave agora, ela não será exibida novamente.' });
    } catch (error) {
      toast({
        title: 'Erro ao criar chave',
        description: error instanceof Error ? error.message : 'Falha ao criar chave.',
        variant: 'destructive',
      });
    }
  }

  async function revokeApiKey(keyId: string): Promise<void> {
    setRevokingId(keyId);
    try {
      await aiPlatformService.revokeApiKey(keyId);
      await loadTokens();
      toast({ title: 'Chave revogada', description: 'A chave foi desativada.' });
    } catch (error) {
      toast({
        title: 'Erro ao revogar chave',
        description: error instanceof Error ? error.message : 'Falha ao revogar chave.',
        variant: 'destructive',
      });
    } finally {
      setRevokingId(null);
    }
  }

  useEffect(() => {
    void loadChat();
    void loadUsage();
  }, []);

  useEffect(() => {
    if (tab === 'knowledge') void loadKnowledge();
    if (tab === 'tokens') void loadTokens();
  }, [tab]);

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-blue-50 px-6 py-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">IA Centralizada Digiurban</h1>
        <p className="mt-1 text-sm text-slate-600">
          Chat operacional com Qwen 3.5 Small 9B, governança de conhecimento e API tokenizada.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={tab === 'chat' ? 'default' : 'outline'} onClick={() => setTab('chat')}>
          <Bot className="mr-2 h-4 w-4" />
          Chat
        </Button>
        <Button variant={tab === 'knowledge' ? 'default' : 'outline'} onClick={() => setTab('knowledge')}>
          <Database className="mr-2 h-4 w-4" />
          Conhecimento
        </Button>
        <Button variant={tab === 'tokens' ? 'default' : 'outline'} onClick={() => setTab('tokens')}>
          <KeyRound className="mr-2 h-4 w-4" />
          Tokens
        </Button>
      </div>

      {tab === 'chat' ? (
        <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Conversas</CardTitle>
                  <CardDescription>Histórico do operador</CardDescription>
                </div>
                <Button size="icon" variant="outline" onClick={createConversation}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="max-h-[640px] space-y-2 overflow-y-auto pr-2">
              {loadingChat ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando...
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma conversa.</p>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left ${
                      conversationId === conversation.id
                        ? 'border-cyan-400 bg-cyan-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-800">{conversation.title || 'Nova conversa'}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDate(conversation.lastMessageAt)}</div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle className="text-base">{selectedConversation?.title || 'Assistente IA'}</CardTitle>
                  <CardDescription>Modelo ativo e contexto de conhecimento centralizado</CardDescription>
                </div>
                <Input
                  className="sm:w-[220px]"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder="qwen3.5:9b"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-slate-500">Sem mensagens ainda.</p>
                ) : (
                  messages.map((message) => {
                    const isUser = message.role === 'USER';
                    return (
                      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                          isUser ? 'bg-cyan-600 text-white' : 'border border-slate-200 bg-white text-slate-800'
                        }`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className={`mt-2 text-[11px] ${isUser ? 'text-cyan-100' : 'text-slate-400'}`}>
                            {formatDate(message.createdAt)}{message.model ? ` • ${message.model}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form className="space-y-2" onSubmit={sendMessage}>
                <Textarea
                  className="min-h-[90px] resize-none"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Digite sua solicitação..."
                />
                <div className="flex justify-end">
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
        </div>
      ) : null}

      {tab === 'knowledge' ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">Governança de Conhecimento</CardTitle>
                <CardDescription>Ingestão de serviços, workflows e organograma</CardDescription>
              </div>
              <Button onClick={bootstrapKnowledge} disabled={bootstrapping}>
                {bootstrapping ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reindexar Sistema
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingKnowledge ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando fontes...
              </div>
            ) : knowledge.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma fonte encontrada.</p>
            ) : (
              knowledge.map((source) => (
                <div key={source.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{source.name}</p>
                      <Badge variant="outline">{source.type}</Badge>
                      <Badge className={source.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                        {source.isActive ? 'ATIVA' : 'INATIVA'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">Última ingestão: {formatDate(source.lastIngestedAt)}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => ingestSource(source.id)}
                    disabled={ingestingId === source.id}
                  >
                    {ingestingId === source.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ingerindo...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Ingerir
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'tokens' ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardDescription>Requests</CardDescription><CardTitle className="text-2xl">{usage?.totalRequests ?? 0}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Tokens</CardDescription><CardTitle className="text-2xl">{usage?.totalTokens ?? 0}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Input</CardDescription><CardTitle className="text-2xl">{usage?.totalInputTokens ?? 0}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Output</CardDescription><CardTitle className="text-2xl">{usage?.totalOutputTokens ?? 0}</CardTitle></CardHeader></Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Novo Plano</CardTitle></CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={createPlan}>
                  <Input value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} placeholder="Nome do plano" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input value={newPlanRpm} onChange={(e) => setNewPlanRpm(e.target.value)} placeholder="Req/min" />
                    <Input value={newPlanBudget} onChange={(e) => setNewPlanBudget(e.target.value)} placeholder="Tokens/mês" />
                  </div>
                  <Button type="submit">Criar Plano</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Nova Chave</CardTitle></CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={createApiKey}>
                  <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Nome da chave" />
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newKeyPlanId}
                    onChange={(e) => setNewKeyPlanId(e.target.value)}
                  >
                    <option value="">Selecione um plano</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                  <Button type="submit">Gerar Chave</Button>
                </form>
                {revealedKey ? (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-700">Copie agora</p>
                    <p className="mt-1 break-all font-mono text-sm text-amber-900">{revealedKey}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Planos</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {loadingTokens ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </div>
                ) : plans.map((plan) => (
                  <div key={plan.id} className="rounded-lg border p-3">
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-xs text-slate-500">{plan.requestLimitPerMinute} req/min • {plan.monthlyBudgetTokens} tokens/mês</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Chaves</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {loadingTokens ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </div>
                ) : apiKeys.map((key) => (
                  <div key={key.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <p className="text-xs text-slate-500">{key.keyPrefix}... • Último uso: {formatDate(key.lastUsedAt)}</p>
                      </div>
                      <Badge className={key.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                        {key.status}
                      </Badge>
                    </div>
                    {key.status === 'ACTIVE' ? (
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => revokeApiKey(key.id)}
                          disabled={revokingId === key.id}
                        >
                          {revokingId === key.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
