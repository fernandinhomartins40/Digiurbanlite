'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Database, KeyRound, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  aiPlatformService,
  AiApiKey,
  AiKnowledgeSource,
  AiPlan,
  AiUsageSummary,
} from '@/lib/services/ai-platform.service';

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
}

export default function SuperAdminAiPage() {
  const { toast } = useToast();

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

  const loadKnowledge = async (): Promise<void> => {
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
  };

  const bootstrapKnowledge = async (): Promise<void> => {
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
  };

  const ingestSource = async (sourceId: string): Promise<void> => {
    setIngestingId(sourceId);
    try {
      const result = await aiPlatformService.ingestKnowledgeSource(sourceId);
      toast({ title: 'Fonte ingerida', description: `${result.chunks} chunks processados.` });
      await loadKnowledge();
    } catch (error) {
      toast({
        title: 'Erro na ingestao',
        description: error instanceof Error ? error.message : 'Falha ao ingerir fonte.',
        variant: 'destructive',
      });
    } finally {
      setIngestingId(null);
    }
  };

  const loadTokens = async (): Promise<void> => {
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
        description: error instanceof Error ? error.message : 'Falha ao carregar planos e chaves.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTokens(false);
    }
  };

  const createPlan = async (event: FormEvent): Promise<void> => {
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
  };

  const createApiKey = async (event: FormEvent): Promise<void> => {
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
      toast({ title: 'Chave criada', description: 'Copie a chave agora, ela nao sera exibida novamente.' });
    } catch (error) {
      toast({
        title: 'Erro ao criar chave',
        description: error instanceof Error ? error.message : 'Falha ao criar chave.',
        variant: 'destructive',
      });
    }
  };

  const revokeApiKey = async (keyId: string): Promise<void> => {
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
  };

  useEffect(() => {
    void loadKnowledge();
    void loadTokens();
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">IA Centralizada</h1>
        <p className="mt-1 text-sm text-slate-600">
          Governanca de conhecimento e tokens da IA. Visivel apenas para Super Admin.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">Conhecimento</CardTitle>
              <CardDescription>Ingestao de fontes do sistema centralizado</CardDescription>
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
                  Reindexar sistema
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
              <div
                key={source.id}
                className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{source.name}</p>
                    <Badge variant="outline">{source.type}</Badge>
                    <Badge className={source.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                      {source.isActive ? 'ATIVA' : 'INATIVA'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">Ultima ingestao: {formatDate(source.lastIngestedAt)}</p>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Requests</CardDescription><CardTitle className="text-2xl">{usage?.totalRequests ?? 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Tokens</CardDescription><CardTitle className="text-2xl">{usage?.totalTokens ?? 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Input</CardDescription><CardTitle className="text-2xl">{usage?.totalInputTokens ?? 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Output</CardDescription><CardTitle className="text-2xl">{usage?.totalOutputTokens ?? 0}</CardTitle></CardHeader></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <Database className="mr-2 inline h-4 w-4" />
              Novo Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createPlan}>
              <Input value={newPlanName} onChange={(event) => setNewPlanName(event.target.value)} placeholder="Nome do plano" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={newPlanRpm} onChange={(event) => setNewPlanRpm(event.target.value)} placeholder="Req/min" />
                <Input value={newPlanBudget} onChange={(event) => setNewPlanBudget(event.target.value)} placeholder="Tokens/mes" />
              </div>
              <Button type="submit">Criar plano</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <KeyRound className="mr-2 inline h-4 w-4" />
              Nova Chave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createApiKey}>
              <Input value={newKeyName} onChange={(event) => setNewKeyName(event.target.value)} placeholder="Nome da chave" />
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newKeyPlanId}
                onChange={(event) => setNewKeyPlanId(event.target.value)}
              >
                <option value="">Selecione um plano</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
              <Button type="submit">Gerar chave</Button>
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
                <p className="text-xs text-slate-500">
                  {plan.requestLimitPerMinute} req/min • {plan.monthlyBudgetTokens} tokens/mes
                </p>
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
                    <p className="text-xs text-slate-500">
                      {key.keyPrefix}... • Ultimo uso: {formatDate(key.lastUsedAt)}
                    </p>
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
  );
}
