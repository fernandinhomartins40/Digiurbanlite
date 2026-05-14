'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ChevronDown, Database, KeyRound, Loader2, PlugZap, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  aiPlatformService,
  AiApiKey,
  AiKnowledgeSource,
  AiPlan,
  AiProviderModel,
  AiProviderSettings,
  AiUsageSummary,
} from '@/lib/services/ai-platform.service';

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

type ProviderFormState = {
  provider: 'LLAMACPP';
  fallbackProvider: 'LLAMACPP' | 'NONE';
  fastModel: string;
  contextualModel: string;
  qualityModel: string;
  fallbackFastModel: string;
  fallbackContextualModel: string;
  fallbackQualityModel: string;
  isEnabled: boolean;
};

function toProviderForm(settings: AiProviderSettings): ProviderFormState {
  return {
    provider: settings.provider,
    fallbackProvider: settings.fallbackProvider || 'NONE',
    fastModel: settings.fastModel || '',
    contextualModel: settings.contextualModel || '',
    qualityModel: settings.qualityModel || '',
    fallbackFastModel: settings.fallbackFastModel || '',
    fallbackContextualModel: settings.fallbackContextualModel || '',
    fallbackQualityModel: settings.fallbackQualityModel || '',
    isEnabled: settings.isEnabled,
  };
}

export default function SuperAdminAiPage() {
  const { toast } = useToast();

  const [knowledge, setKnowledge] = useState<AiKnowledgeSource[]>([]);
  const [plans, setPlans] = useState<AiPlan[]>([]);
  const [apiKeys, setApiKeys] = useState<AiApiKey[]>([]);
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);
  const [providerSettings, setProviderSettings] = useState<AiProviderSettings | null>(null);
  const [providerModels, setProviderModels] = useState<AiProviderModel[]>([]);

  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [ingestingId, setIngestingId] = useState<string | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [testingProvider, setTestingProvider] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanRpm, setNewPlanRpm] = useState('60');
  const [newPlanBudget, setNewPlanBudget] = useState('1000000');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPlanId, setNewKeyPlanId] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState('');
  const [showAdvancedProviderConfig, setShowAdvancedProviderConfig] = useState(false);
  const [providerForm, setProviderForm] = useState<ProviderFormState>({
    provider: 'LLAMACPP',
    fallbackProvider: 'NONE',
    fastModel: '',
    contextualModel: '',
    qualityModel: '',
    fallbackFastModel: '',
    fallbackContextualModel: '',
    fallbackQualityModel: '',
    isEnabled: true,
  });

  const loadKnowledge = async (): Promise<void> => {
    setLoadingKnowledge(true);
    try {
      setKnowledge(await aiPlatformService.listKnowledgeSources());
    } catch (error) {
      toast({ title: 'Erro ao carregar conhecimento', description: error instanceof Error ? error.message : 'Falha ao listar fontes.', variant: 'destructive' });
    } finally {
      setLoadingKnowledge(false);
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
      if (!newKeyPlanId && plansData[0]) setNewKeyPlanId(plansData[0].id);
    } catch (error) {
      toast({ title: 'Erro ao carregar tokens', description: error instanceof Error ? error.message : 'Falha ao carregar planos e chaves.', variant: 'destructive' });
    } finally {
      setLoadingTokens(false);
    }
  };

  const loadProviderSettings = async (): Promise<void> => {
    setLoadingProvider(true);
    try {
      const settings = await aiPlatformService.getProviderSettings();
      setProviderSettings(settings);
      setProviderForm(toProviderForm(settings));
    } catch (error) {
      toast({ title: 'Erro ao carregar provider', description: error instanceof Error ? error.message : 'Falha ao carregar configuracao da IA.', variant: 'destructive' });
    } finally {
      setLoadingProvider(false);
    }
  };

  useEffect(() => {
    void loadKnowledge();
    void loadTokens();
    void loadProviderSettings();
  }, []);

  const bootstrapKnowledge = async (): Promise<void> => {
    setBootstrapping(true);
    try {
      const result = await aiPlatformService.bootstrapSystemKnowledge();
      toast({ title: 'Base atualizada', description: `Criadas ${result.created}, atualizadas ${result.updated}, ingeridas ${result.ingestedSources}.` });
      await loadKnowledge();
    } catch (error) {
      toast({ title: 'Erro no bootstrap', description: error instanceof Error ? error.message : 'Falha ao atualizar a base.', variant: 'destructive' });
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
      toast({ title: 'Erro na ingestao', description: error instanceof Error ? error.message : 'Falha ao ingerir fonte.', variant: 'destructive' });
    } finally {
      setIngestingId(null);
    }
  };

  const createPlan = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!newPlanName.trim()) return;
    try {
      await aiPlatformService.createPlan({ name: newPlanName.trim(), requestLimitPerMinute: Number(newPlanRpm) || 60, monthlyBudgetTokens: Number(newPlanBudget) || 1_000_000 });
      setNewPlanName('');
      await loadTokens();
      toast({ title: 'Plano criado', description: 'Plano de tokens criado com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro ao criar plano', description: error instanceof Error ? error.message : 'Falha ao criar plano.', variant: 'destructive' });
    }
  };

  const createApiKey = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!newKeyName.trim() || !newKeyPlanId) return;
    try {
      const created = await aiPlatformService.createApiKey({ name: newKeyName.trim(), planId: newKeyPlanId });
      setNewKeyName('');
      setRevealedKey(created.rawKey);
      await loadTokens();
      toast({ title: 'Chave criada', description: 'Copie a chave agora, ela nao sera exibida novamente.' });
    } catch (error) {
      toast({ title: 'Erro ao criar chave', description: error instanceof Error ? error.message : 'Falha ao criar chave.', variant: 'destructive' });
    }
  };

  const revokeApiKey = async (keyId: string): Promise<void> => {
    setRevokingId(keyId);
    try {
      await aiPlatformService.revokeApiKey(keyId);
      await loadTokens();
      toast({ title: 'Chave revogada', description: 'A chave foi desativada.' });
    } catch (error) {
      toast({ title: 'Erro ao revogar chave', description: error instanceof Error ? error.message : 'Falha ao revogar chave.', variant: 'destructive' });
    } finally {
      setRevokingId(null);
    }
  };

  const saveProvider = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setSavingProvider(true);
    try {
      const saved = await aiPlatformService.updateProviderSettings({
        provider: providerForm.provider,
        fallbackProvider: providerForm.fallbackProvider === 'NONE' ? null : providerForm.fallbackProvider,
        fastModel: providerForm.fastModel.trim() || null,
        contextualModel: providerForm.contextualModel.trim() || null,
        qualityModel: providerForm.qualityModel.trim() || null,
        fallbackFastModel: providerForm.fallbackFastModel.trim() || null,
        fallbackContextualModel: providerForm.fallbackContextualModel.trim() || null,
        fallbackQualityModel: providerForm.fallbackQualityModel.trim() || null,
        isEnabled: providerForm.isEnabled,
      });
      setProviderSettings(saved);
      setProviderForm(toProviderForm(saved));
      toast({ title: 'Provider salvo', description: 'Configuracao de IA atualizada.' });
    } catch (error) {
      toast({ title: 'Erro ao salvar provider', description: error instanceof Error ? error.message : 'Falha ao salvar configuracao.', variant: 'destructive' });
    } finally {
      setSavingProvider(false);
    }
  };

  const testProvider = async (): Promise<void> => {
    setTestingProvider(true);
    try {
      const result = await aiPlatformService.testProvider({
        provider: providerForm.provider,
      });
      toast({ title: 'Conexao validada', description: result.modelsChecked ? `${result.message}. ${result.modelsChecked} modelos detectados.` : result.message });
    } catch (error) {
      toast({ title: 'Erro ao testar provider', description: error instanceof Error ? error.message : 'Falha ao testar configuracao.', variant: 'destructive' });
    } finally {
      setTestingProvider(false);
    }
  };

  const listModels = async (): Promise<void> => {
    setLoadingModels(true);
    try {
      setProviderModels(await aiPlatformService.listProviderModels({
        provider: providerForm.provider,
      }));
    } catch (error) {
      toast({ title: 'Erro ao listar modelos', description: error instanceof Error ? error.message : 'Falha ao carregar modelos.', variant: 'destructive' });
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    void listModels();
  }, [providerForm.provider]);

  const applyModelToField = (
    field:
      | 'fastModel'
      | 'contextualModel'
      | 'qualityModel'
      | 'fallbackFastModel'
      | 'fallbackContextualModel'
      | 'fallbackQualityModel',
    modelId: string,
  ): void => {
    setProviderForm((current) => ({ ...current, [field]: modelId }));
  };

  const visibleProviderModels = providerModels.filter((model) => {
    if (!modelSearch.trim()) return true;
    const query = modelSearch.trim().toLowerCase();
    return (
      model.name.toLowerCase().includes(query) ||
      model.id.toLowerCase().includes(query) ||
      model.huggingFaceId?.toLowerCase().includes(query)
    );
  });

  const availableModelOptions = providerModels.length > 0
      ? providerModels
      : [
          { id: providerForm.fastModel, name: providerForm.fastModel },
          { id: providerForm.contextualModel, name: providerForm.contextualModel },
          { id: providerForm.qualityModel, name: providerForm.qualityModel },
        ].filter((model): model is AiProviderModel => Boolean(model.id));

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">IA Centralizada</h1>
        <p className="mt-1 text-sm text-slate-600">Governanca de providers, conhecimento e tokens da IA.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base"><PlugZap className="mr-2 inline h-4 w-4" />Provider de inferencia</CardTitle>
          <CardDescription>Configure o runtime local llama.cpp com Qwen3 1.7B Instruct.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProvider ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando configuracao...</div>
          ) : (
            <form className="space-y-4" onSubmit={saveProvider}>
              <div className="flex flex-wrap items-center gap-2">
                {providerSettings ? (
                  <>
                    <Badge variant="outline">Principal: {providerSettings.provider}</Badge>
                    <Badge variant="outline">Fallback: {providerSettings.fallbackProvider || 'Nenhum'}</Badge>
                    <Badge className={providerSettings.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>{providerSettings.isEnabled ? 'ATIVO' : 'DESATIVADO'}</Badge>
                  </>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={providerForm.provider} onChange={(event) => setProviderForm((current) => ({ ...current, provider: event.target.value as ProviderFormState['provider'] }))}>
                  <option value="LLAMACPP">llama.cpp local</option>
                </select>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={providerForm.fallbackProvider} onChange={(event) => setProviderForm((current) => ({ ...current, fallbackProvider: event.target.value as ProviderFormState['fallbackProvider'] }))}>
                  <option value="NONE">Sem fallback</option>
                  <option value="LLAMACPP">llama.cpp local</option>
                </select>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={providerForm.isEnabled ? 'enabled' : 'disabled'} onChange={(event) => setProviderForm((current) => ({ ...current, isEnabled: event.target.value === 'enabled' }))}>
                  <option value="enabled">Ativo</option>
                  <option value="disabled">Desativado</option>
                </select>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex flex-col gap-1">
                  <p className="text-sm font-medium text-slate-900">Modelos em uso</p>
                  <p className="text-xs text-slate-500">
                    Selecione os perfis que o sistema vai usar. O chat administrativo e os modulos da IA consumirao sempre essa configuracao.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Rapido</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={providerForm.fastModel}
                      onChange={(event) => setProviderForm((current) => ({ ...current, fastModel: event.target.value }))}
                    >
                      <option value="">{loadingModels ? 'Carregando modelos...' : 'Selecione um modelo'}</option>
                      {availableModelOptions.map((model) => (
                        <option key={`fast-${model.id}`} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Contextual</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={providerForm.contextualModel}
                      onChange={(event) => setProviderForm((current) => ({ ...current, contextualModel: event.target.value }))}
                    >
                      <option value="">{loadingModels ? 'Carregando modelos...' : 'Selecione um modelo'}</option>
                      {availableModelOptions.map((model) => (
                        <option key={`contextual-${model.id}`} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Qualidade</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={providerForm.qualityModel}
                      onChange={(event) => setProviderForm((current) => ({ ...current, qualityModel: event.target.value }))}
                    >
                      <option value="">{loadingModels ? 'Carregando modelos...' : 'Selecione um modelo'}</option>
                      {availableModelOptions.map((model) => (
                        <option key={`quality-${model.id}`} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={savingProvider}>{savingProvider ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : <><ShieldCheck className="mr-2 h-4 w-4" />Salvar provider</>}</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={testProvider}
                  disabled={testingProvider}
                >
                  {testingProvider ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testando...</> : 'Testar conexao'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={listModels}
                  disabled={loadingModels}
                >
                  {loadingModels ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Carregando...</> : 'Atualizar catalogo'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowAdvancedProviderConfig((current) => !current)}>
                  <ChevronDown className={`mr-2 h-4 w-4 transition-transform ${showAdvancedProviderConfig ? 'rotate-180' : ''}`} />
                  Configuracoes avancadas
                </Button>
              </div>

              {showAdvancedProviderConfig ? (
                <div className="space-y-4 rounded-lg border border-dashed border-slate-300 p-4">
                  {providerForm.fallbackProvider !== 'NONE' ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Modelos de fallback</p>
                        <p className="text-xs text-slate-500">Use somente se quiser uma politica diferente do provider principal.</p>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-3">
                        <Input value={providerForm.fallbackFastModel} onChange={(event) => setProviderForm((current) => ({ ...current, fallbackFastModel: event.target.value }))} placeholder="Modelo rapido fallback" />
                        <Input value={providerForm.fallbackContextualModel} onChange={(event) => setProviderForm((current) => ({ ...current, fallbackContextualModel: event.target.value }))} placeholder="Modelo contextual fallback" />
                        <Input value={providerForm.fallbackQualityModel} onChange={(event) => setProviderForm((current) => ({ ...current, fallbackQualityModel: event.target.value }))} placeholder="Modelo qualidade fallback" />
                      </div>
                    </div>
                  ) : null}

                  {providerModels.length > 0 ? (
                    <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Catalogo llama.cpp local
                      </p>
                      <p className="text-xs text-slate-500">
                        Use esta lista para consultar slugs, contexto e aplicar um modelo rapidamente aos perfis.
                      </p>
                    </div>
                    <Input
                      value={modelSearch}
                      onChange={(event) => setModelSearch(event.target.value)}
                      placeholder="Filtrar por nome, slug ou Hugging Face"
                      className="w-full lg:w-80"
                    />
                  </div>
                  <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                    {visibleProviderModels.map((model) => (
                      <div key={model.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 space-y-1">
                            <p className="font-medium text-slate-900">{model.name}</p>
                            <p className="font-mono text-xs text-slate-500">{model.id}</p>
                            {model.huggingFaceId ? (
                              <p className="text-xs text-slate-500">HF: {model.huggingFaceId}</p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => applyModelToField('fastModel', model.id)}>Rapido</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => applyModelToField('contextualModel', model.id)}>Contextual</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => applyModelToField('qualityModel', model.id)}>Qualidade</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => applyModelToField('fallbackFastModel', model.id)}>Fallback rapido</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => applyModelToField('fallbackContextualModel', model.id)}>Fallback contextual</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => applyModelToField('fallbackQualityModel', model.id)}>Fallback qualidade</Button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {typeof model.contextLength === 'number' ? <Badge variant="outline">{model.contextLength.toLocaleString('pt-BR')} ctx</Badge> : null}
                          {model.promptPrice ? <Badge variant="outline">Prompt: {model.promptPrice}</Badge> : null}
                          {model.completionPrice ? <Badge variant="outline">Completion: {model.completionPrice}</Badge> : null}
                        </div>
                      </div>
                    ))}
                    {visibleProviderModels.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
                        Nenhum modelo encontrado para este filtro.
                      </div>
                    ) : null}
                  </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">Conhecimento</CardTitle>
              <CardDescription>Ingestao de fontes do sistema centralizado</CardDescription>
            </div>
            <Button onClick={bootstrapKnowledge} disabled={bootstrapping}>{bootstrapping ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Atualizando...</> : <><RefreshCw className="mr-2 h-4 w-4" />Reindexar sistema</>}</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingKnowledge ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando fontes...</div>
          ) : knowledge.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma fonte encontrada.</p>
          ) : knowledge.map((source) => (
            <div key={source.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{source.name}</p>
                  <Badge variant="outline">{source.type}</Badge>
                  <Badge className={source.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>{source.isActive ? 'ATIVA' : 'INATIVA'}</Badge>
                </div>
                <p className="text-xs text-slate-500">Ultima ingestao: {formatDate(source.lastIngestedAt)}</p>
              </div>
              <Button variant="outline" onClick={() => ingestSource(source.id)} disabled={ingestingId === source.id}>{ingestingId === source.id ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ingerindo...</> : <><RefreshCw className="mr-2 h-4 w-4" />Ingerir</>}</Button>
            </div>
          ))}
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
          <CardHeader><CardTitle className="text-base"><Database className="mr-2 inline h-4 w-4" />Novo Plano</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-base"><KeyRound className="mr-2 inline h-4 w-4" />Nova Chave</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createApiKey}>
              <Input value={newKeyName} onChange={(event) => setNewKeyName(event.target.value)} placeholder="Nome da chave" />
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newKeyPlanId} onChange={(event) => setNewKeyPlanId(event.target.value)}>
                <option value="">Selecione um plano</option>
                {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select>
              <Button type="submit">Gerar chave</Button>
            </form>
            {revealedKey ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-700">Copie agora</p><p className="mt-1 break-all font-mono text-sm text-amber-900">{revealedKey}</p></div> : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Planos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loadingTokens ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando...</div> : plans.map((plan) => (
              <div key={plan.id} className="rounded-lg border p-3">
                <p className="font-medium">{plan.name}</p>
                <p className="text-xs text-slate-500">{plan.requestLimitPerMinute} req/min • {plan.monthlyBudgetTokens} tokens/mes</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Chaves</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loadingTokens ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando...</div> : apiKeys.map((key) => (
              <div key={key.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-xs text-slate-500">{key.keyPrefix}... • Ultimo uso: {formatDate(key.lastUsedAt)}</p>
                  </div>
                  <Badge className={key.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>{key.status}</Badge>
                </div>
                {key.status === 'ACTIVE' ? <div className="mt-2 flex justify-end"><Button size="sm" variant="destructive" onClick={() => revokeApiKey(key.id)} disabled={revokingId === key.id}>{revokingId === key.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</Button></div> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
