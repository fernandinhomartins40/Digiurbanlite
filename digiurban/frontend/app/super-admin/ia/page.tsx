'use client';

/**
 * IA da plataforma (console /super-admin) — gateway multi-provedor.
 *
 * Provedores: chaves DA PLATAFORMA (JEV, DeepSeek, Qwen, MiniMax, Kimi, GLM,
 *   DeepInfra, OpenRouter), cifradas no servidor; só os 4 últimos dígitos voltam.
 * Modelos: preço por milhão de tokens e desempenho real — o roteador sempre
 *   usa o que entrega pelo menor custo.
 * Cobrança: cotação, margem, valor do crédito e pacotes vendidos aos municípios.
 * Municípios: saldo, consumo, custo × receita (lucro) e bônus de créditos.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  ExternalLink,
  FlaskConical,
  KeyRound,
  Loader2,
  PlugZap,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';

type Tab = 'providers' | 'models' | 'billing' | 'tenants' | 'test';

interface Provider {
  provider: string;
  label: string;
  baseUrl: string;
  hasKey: boolean;
  apiKeyLast4: string | null;
  isEnabled: boolean;
  dataRegion: 'CN' | 'GLOBAL' | 'US';
  zeroRetention: boolean;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
  lastTestError: string | null;
  kind: 'openai' | 'jev';
  signupUrl?: string;
  notes?: string;
}

interface ModelRow {
  id: string;
  provider: string;
  modelId: string;
  label: string;
  tier: 'decision' | 'fast' | 'smart';
  inputPricePerMUsd: number;
  outputPricePerMUsd: number;
  cachedInputPricePerMUsd: number | null;
  isEnabled: boolean;
  calls: number;
  failures: number;
  avgLatencyMs: number;
  lastError: string | null;
}

interface Settings {
  usdToBrl: number;
  markup: number;
  creditValueBrl: number;
  minChargeCredits: number;
  allowChinaHosted: boolean;
  redactPii: boolean;
  lowBalanceCredits: number;
}

interface Pkg {
  id?: string;
  code: string;
  name: string;
  description?: string | null;
  credits: number;
  priceBrl: number;
  isActive: boolean;
  sortOrder?: number;
}

interface ReportRow {
  tenantId: string;
  name: string;
  status: string;
  balance: number;
  calls: number;
  creditsUsed: number;
  costBrl: number;
  revenueBrl: number;
  marginBrl: number;
}

const REGION: Record<string, { label: string; className: string; hint: string }> = {
  CN: { label: 'Dados na China', className: 'bg-amber-100 text-amber-800', hint: 'Transferência internacional (LGPD art. 33). Os dados pessoais são mascarados antes do envio.' },
  GLOBAL: { label: 'Endpoint internacional', className: 'bg-blue-100 text-blue-800', hint: 'Servidores fora da China continental (ex.: Singapura).' },
  US: { label: 'Hospedado nos EUA', className: 'bg-green-100 text-green-800', hint: 'Modelos chineses rodando em data centers dos EUA.' },
};

const TIER: Record<ModelRow['tier'], string> = { decision: 'Decisão (JEV)', fast: 'Rápido', smart: 'Inteligente' };

const brl = (v: number, digits = 2) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: digits, maximumFractionDigits: digits });

async function api(url: string, init?: RequestInit) {
  const res = await fetch(`/api/platform/ai${url}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

export default function PlatformAiPage() {
  const { toast } = useToast();
  const { user } = useSuperAdminAuth();
  const isAdmin = user?.role === 'PLATFORM_ADMIN';
  const [tab, setTab] = useState<Tab>('providers');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ModelRow[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [report, setReport] = useState<{ rows: ReportRow[]; totals: { calls: number; costBrl: number; revenueBrl: number; marginBrl: number }; packagesSoldBrl: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const notify = useCallback((title: string, error?: unknown) => {
    toast(error ? { title, description: error instanceof Error ? error.message : String(error), variant: 'destructive' } : { title });
  }, [toast]);

  const loadAll = useCallback(async () => {
    try {
      const [p, m, b, r] = await Promise.all([api('/providers'), api('/models'), api('/billing'), api('/report')]);
      setProviders(p.providers);
      setModels(m.models);
      setSettings(b.settings);
      setPackages(b.packages);
      setReport(r.report);
    } catch (error) {
      notify('Erro ao carregar a IA', error);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const active = providers.filter((p) => p.isEnabled && p.hasKey);
  const hasDecision = active.some((p) => p.kind === 'jev' || p.provider === 'openrouter');

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando a IA da plataforma…
      </div>
    );
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'providers', label: 'Chaves' },
    { id: 'models', label: 'Modelos e preços' },
    { id: 'billing', label: 'Cobrança e pacotes' },
    { id: 'tenants', label: 'Municípios' },
    { id: 'test', label: 'Testar' },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
          <PlugZap className="h-7 w-7 text-blue-600" />
          IA da plataforma
        </h1>
        <p className="text-gray-600">
          Suas chaves de IA, o roteador que escolhe o modelo mais econômico e a revenda de créditos para os municípios.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Provedores ativos</p>
            <p className="text-2xl font-bold">{active.length}</p>
            <p className="text-xs text-gray-500">{hasDecision ? 'JEV pronto para decisões' : 'sem JEV: decisões vão para o LLM'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Chamadas (30 dias)</p>
            <p className="text-2xl font-bold">{report?.totals.calls.toLocaleString('pt-BR') ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Custo × receita (30 dias)</p>
            <p className="text-2xl font-bold">{brl(report?.totals.revenueBrl ?? 0)}</p>
            <p className="text-xs text-gray-500">custo {brl(report?.totals.costBrl ?? 0, 4)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Pacotes vendidos (30 dias)</p>
            <p className="text-2xl font-bold text-green-700">{brl(report?.packagesSoldBrl ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div role="tablist" aria-label="Seções da IA" className="inline-flex max-w-full flex-wrap gap-1 rounded-full bg-[var(--lg-fill)] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.id ? 'bg-[var(--lg-surface)] text-[var(--lg-ink)] shadow-sm' : 'text-[var(--lg-ink2)] hover:text-[var(--lg-ink)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'providers' && <ProvidersShortcut providers={providers} />}
      {tab === 'models' && <ModelsTab models={models} providers={providers} isAdmin={isAdmin} onChange={loadAll} notify={notify} />}
      {tab === 'billing' && settings && <BillingTab settings={settings} packages={packages} isAdmin={isAdmin} onChange={loadAll} notify={notify} />}
      {tab === 'tenants' && report && settings && <TenantsTab report={report} isAdmin={isAdmin} creditValueBrl={settings.creditValueBrl} onChange={loadAll} notify={notify} />}
      {tab === 'test' && <TestTab isAdmin={isAdmin} notify={notify} onChange={loadAll} />}
    </div>
  );
}

type Notify = (title: string, error?: unknown) => void;

// ---------------------------------------------------------------- provedores (atalho)

function ProvidersShortcut({ providers }: { providers: Provider[] }) {
  const active = providers.filter((p) => p.isEnabled && p.hasKey);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Chaves de API
        </CardTitle>
        <CardDescription>As chaves de cada serviço ficam numa página própria, com um formulário por serviço.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {providers.map((p) => (
            <Badge key={p.provider} className={p.isEnabled && p.hasKey ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
              {p.label.split(' (')[0]} {p.isEnabled && p.hasKey ? '· ativo' : p.hasKey ? '· chave salva' : ''}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-gray-600">{active.length} serviço(s) ativo(s).</p>
        <a href="/super-admin/ia/chaves">
          <Button>
            <KeyRound className="mr-2 h-4 w-4" />
            Abrir Chaves de API
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- modelos

function ModelsTab({ models, providers, isAdmin, onChange, notify }: { models: ModelRow[]; providers: Provider[]; isAdmin: boolean; onChange: () => void; notify: Notify }) {
  const activeProviders = new Set(providers.filter((p) => p.isEnabled && p.hasKey).map((p) => p.provider));
  const [draft, setDraft] = useState({ provider: 'deepseek', modelId: '', label: '', tier: 'fast' as ModelRow['tier'], inputPricePerMUsd: 0.1, outputPricePerMUsd: 0.4 });

  const save = async (body: Record<string, unknown>, ok: string) => {
    try {
      await api('/models', { method: 'PUT', body: JSON.stringify(body) });
      notify(ok);
      onChange();
    } catch (error) {
      notify('Não foi possível salvar', error);
    }
  };

  // Custo estimado de um atendimento típico (≈1.200 tokens entrada / 150 saída) para comparar
  const typical = (m: ModelRow) => (1200 * m.inputPricePerMUsd + 150 * m.outputPricePerMUsd) / 1e6;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Modelos e preços</CardTitle>
          <CardDescription>
            Preços em US$ por milhão de tokens (confira no painel de cada provedor). O roteador escolhe, em cada chamada, o modelo ativo de menor custo
            efetivo — penalizando os que falham ou demoram. Os marcados em cinza estão sem provedor ativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2">Modelo</th>
                <th>Tipo</th>
                <th>Entrada</th>
                <th>Saída</th>
                <th>Custo/atend.</th>
                <th>Uso real</th>
                <th className="text-right">Ativo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {models.map((m) => (
                <ModelRowEditor key={m.id} m={m} live={activeProviders.has(m.provider)} isAdmin={isAdmin} typical={typical(m)} onSave={save} />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar modelo
            </CardTitle>
            <CardDescription>Use o nome exato do modelo na API do provedor (o "Testar conexão" lista os disponíveis).</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-2 items-end gap-3 md:grid-cols-7"
              onSubmit={(e) => {
                e.preventDefault();
                save({ ...draft, label: draft.label || draft.modelId }, 'Modelo adicionado');
              }}
            >
              <div>
                <Label>Provedor</Label>
                <select value={draft.provider} onChange={(e) => setDraft({ ...draft, provider: e.target.value })} className="h-10 w-full rounded-md border bg-background px-2 text-sm">
                  {providers.map((p) => (
                    <option key={p.provider} value={p.provider}>
                      {p.provider}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <Label>Modelo (id na API)</Label>
                <Input required value={draft.modelId} onChange={(e) => setDraft({ ...draft, modelId: e.target.value })} />
              </div>
              <div>
                <Label>Tipo</Label>
                <select value={draft.tier} onChange={(e) => setDraft({ ...draft, tier: e.target.value as ModelRow['tier'] })} className="h-10 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="fast">Rápido</option>
                  <option value="smart">Inteligente</option>
                  <option value="decision">Decisão (JEV)</option>
                </select>
              </div>
              <div>
                <Label>Entrada US$/M</Label>
                <Input type="number" step="0.001" min="0" value={draft.inputPricePerMUsd} onChange={(e) => setDraft({ ...draft, inputPricePerMUsd: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Saída US$/M</Label>
                <Input type="number" step="0.001" min="0" value={draft.outputPricePerMUsd} onChange={(e) => setDraft({ ...draft, outputPricePerMUsd: Number(e.target.value) })} />
              </div>
              <Button type="submit">Adicionar</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ModelRowEditor({ m, live, isAdmin, typical, onSave }: { m: ModelRow; live: boolean; isAdmin: boolean; typical: number; onSave: (b: Record<string, unknown>, ok: string) => void }) {
  const [inP, setIn] = useState(m.inputPricePerMUsd);
  const [outP, setOut] = useState(m.outputPricePerMUsd);
  const dirty = inP !== m.inputPricePerMUsd || outP !== m.outputPricePerMUsd;
  const failRate = m.calls ? Math.round((m.failures / m.calls) * 100) : 0;
  const base = { id: m.id, provider: m.provider, modelId: m.modelId, label: m.label, tier: m.tier, cachedInputPricePerMUsd: m.cachedInputPricePerMUsd };
  return (
    <tr className={live ? '' : 'text-gray-400'}>
      <td className="py-2">
        <p className="font-medium">{m.label}</p>
        <p className="text-xs">
          {m.provider} · <code>{m.modelId}</code>
        </p>
      </td>
      <td>
        <Badge variant="outline">{TIER[m.tier]}</Badge>
      </td>
      <td>
        <Input className="h-8 w-24" type="number" step="0.001" min="0" disabled={!isAdmin} value={inP} onChange={(e) => setIn(Number(e.target.value))} />
      </td>
      <td>
        <div className="flex items-center gap-1">
          <Input className="h-8 w-24" type="number" step="0.001" min="0" disabled={!isAdmin} value={outP} onChange={(e) => setOut(Number(e.target.value))} />
          {dirty && (
            <Button size="sm" variant="ghost" onClick={() => onSave({ ...base, inputPricePerMUsd: inP, outputPricePerMUsd: outP, isEnabled: m.isEnabled }, 'Preço atualizado')}>
              <Save className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
      <td className="text-xs">US$ {typical.toFixed(5)}</td>
      <td className="text-xs" title={m.lastError || ''}>
        {m.calls ? `${m.calls} chamadas · ${failRate}% falha · ${m.avgLatencyMs} ms` : '—'}
      </td>
      <td className="text-right">
        <input
          type="checkbox"
          aria-label={`Ativar ${m.label}`}
          disabled={!isAdmin}
          checked={m.isEnabled}
          onChange={(e) => onSave({ ...base, inputPricePerMUsd: m.inputPricePerMUsd, outputPricePerMUsd: m.outputPricePerMUsd, isEnabled: e.target.checked }, e.target.checked ? 'Modelo ativado' : 'Modelo desativado')}
        />
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------- cobrança

function BillingTab({ settings, packages, isAdmin, onChange, notify }: { settings: Settings; packages: Pkg[]; isAdmin: boolean; onChange: () => void; notify: Notify }) {
  const [s, setS] = useState(settings);
  const [newPkg, setNewPkg] = useState<Pkg>({ code: '', name: '', credits: 10000, priceBrl: 100, isActive: true });

  // Simulação: atendimento típico = 2 decisões JEV + 1 resposta curta de LLM rápido
  const sim = useMemo(() => {
    const costUsd = 2 * ((400 * 0.084) / 1e6) + (1200 * 0.1 + 150 * 0.4) / 1e6;
    const credits = (c: number) => Math.max(s.minChargeCredits, (c * s.usdToBrl * s.markup) / s.creditValueBrl);
    const charged = 2 * credits((400 * 0.084) / 1e6) + credits((1200 * 0.1 + 150 * 0.4) / 1e6);
    return { costBrl: costUsd * s.usdToBrl, saleBrl: charged * s.creditValueBrl, credits: charged };
  }, [s]);

  const saveSettings = async () => {
    try {
      await api('/billing', { method: 'PUT', body: JSON.stringify(s) });
      notify('Regras de cobrança salvas');
      onChange();
    } catch (error) {
      notify('Não foi possível salvar', error);
    }
  };

  const savePkg = async (pkg: Pkg, ok: string) => {
    try {
      await api('/packages', { method: 'PUT', body: JSON.stringify(pkg) });
      notify(ok);
      onChange();
    } catch (error) {
      notify('Não foi possível salvar o pacote', error);
    }
  };

  const num = (k: keyof Settings) => ({
    type: 'number',
    step: 'any',
    disabled: !isAdmin,
    value: s[k] as number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: Number(e.target.value) }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5" />
            Regras de cobrança
          </CardTitle>
          <CardDescription>Cada chamada cobra do município: custo em US$ × cotação × margem ÷ valor do crédito (com um mínimo por chamada).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <Label>Cotação do dólar (R$)</Label>
              <Input {...num('usdToBrl')} />
            </div>
            <div>
              <Label>Margem (× o custo)</Label>
              <Input {...num('markup')} />
            </div>
            <div>
              <Label>Valor de 1 crédito (R$)</Label>
              <Input {...num('creditValueBrl')} />
            </div>
            <div>
              <Label>Mínimo por chamada (créditos)</Label>
              <Input {...num('minChargeCredits')} />
            </div>
            <div>
              <Label>Avisar saldo baixo abaixo de (créditos)</Label>
              <Input {...num('lowBalanceCredits')} />
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled={!isAdmin} checked={s.redactPii} onChange={(e) => setS({ ...s, redactPii: e.target.checked })} />
              Mascarar dados pessoais (CPF, CNPJ, e-mail, telefone, CEP, cartão) antes de enviar à IA — <strong>recomendado (LGPD)</strong>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled={!isAdmin} checked={s.allowChinaHosted} onChange={(e) => setS({ ...s, allowChinaHosted: e.target.checked })} />
              Permitir provedores que processam dados na China (com dados pessoais mascarados)
            </label>
          </div>
          <div className="rounded-xl bg-[var(--lg-fill)] p-3 text-sm">
            <p className="font-semibold">Simulação de 1 atendimento típico do DigiBot</p>
            <p>
              Você paga aos provedores ≈ {brl(sim.costBrl, 4)} · cobra do município {sim.credits.toFixed(2)} créditos ≈ {brl(sim.saleBrl, 4)} · margem ≈{' '}
              {brl(sim.saleBrl - sim.costBrl, 4)}. Em 10 mil atendimentos: custo {brl(sim.costBrl * 10000)} × receita {brl(sim.saleBrl * 10000)}.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={saveSettings}>
              <Save className="mr-2 h-4 w-4" />
              Salvar regras
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pacotes à venda</CardTitle>
          <CardDescription>O município compra pelo painel dele; a fatura cai em Faturas e, ao marcar como paga, os créditos entram na hora.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {packages.map((p) => (
            <PackageRow key={p.id} pkg={p} isAdmin={isAdmin} creditValueBrl={s.creditValueBrl} onSave={savePkg} />
          ))}
          {isAdmin && (
            <form
              className="grid grid-cols-2 items-end gap-3 border-t pt-4 md:grid-cols-6"
              onSubmit={(e) => {
                e.preventDefault();
                savePkg(newPkg, 'Pacote criado');
                setNewPkg({ code: '', name: '', credits: 10000, priceBrl: 100, isActive: true });
              }}
            >
              <div>
                <Label>Código</Label>
                <Input required value={newPkg.code} onChange={(e) => setNewPkg({ ...newPkg, code: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input required value={newPkg.name} onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })} />
              </div>
              <div>
                <Label>Créditos</Label>
                <Input type="number" min="1" value={newPkg.credits} onChange={(e) => setNewPkg({ ...newPkg, credits: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Preço (R$)</Label>
                <Input type="number" min="0" step="0.01" value={newPkg.priceBrl} onChange={(e) => setNewPkg({ ...newPkg, priceBrl: Number(e.target.value) })} />
              </div>
              <Button type="submit">
                <Plus className="mr-1 h-4 w-4" />
                Criar pacote
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PackageRow({ pkg, isAdmin, creditValueBrl, onSave }: { pkg: Pkg; isAdmin: boolean; creditValueBrl: number; onSave: (p: Pkg, ok: string) => void }) {
  const [p, setP] = useState(pkg);
  const dirty = JSON.stringify(p) !== JSON.stringify(pkg);
  const face = p.credits * creditValueBrl;
  return (
    <div className={`grid grid-cols-2 items-center gap-2 rounded-xl border p-3 md:grid-cols-[1fr_1.5fr_120px_120px_auto_auto] ${p.isActive ? '' : 'opacity-60'}`}>
      <code className="text-xs">{p.code}</code>
      <Input disabled={!isAdmin} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
      <Input disabled={!isAdmin} type="number" min="1" value={p.credits} onChange={(e) => setP({ ...p, credits: Number(e.target.value) })} title="Créditos" />
      <Input disabled={!isAdmin} type="number" min="0" step="0.01" value={p.priceBrl} onChange={(e) => setP({ ...p, priceBrl: Number(e.target.value) })} title="Preço (R$)" />
      <span className="text-xs text-gray-500">{face > p.priceBrl ? `${Math.round((1 - p.priceBrl / face) * 100)}% de desconto` : 'preço cheio'}</span>
      {isAdmin && (
        <div className="flex gap-1">
          {dirty && (
            <Button size="sm" onClick={() => onSave(p, 'Pacote atualizado')}>
              <Save className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onSave({ ...p, isActive: !p.isActive }, p.isActive ? 'Pacote pausado' : 'Pacote reativado')}>
            {p.isActive ? 'Pausar' : 'Ativar'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- municípios

function TenantsTab({ report, isAdmin, creditValueBrl, onChange, notify }: { report: { rows: ReportRow[]; totals: any }; isAdmin: boolean; creditValueBrl: number; onChange: () => void; notify: Notify }) {
  const grant = async (row: ReportRow) => {
    const raw = prompt(`Quantos créditos dar para ${row.name}? (use número negativo para retirar)`, '1000');
    if (!raw) return;
    const credits = Number(raw.replace(',', '.'));
    if (!Number.isFinite(credits) || credits === 0) return notify('Valor inválido', 'Informe um número diferente de zero');
    const reason = prompt('Motivo (fica no extrato do município):', credits > 0 ? 'Bônus de lançamento' : 'Ajuste') || '';
    if (reason.trim().length < 3) return notify('Informe o motivo', 'Mínimo de 3 caracteres');
    try {
      await api(`/wallets/${row.tenantId}/grant`, { method: 'POST', body: JSON.stringify({ credits, reason }) });
      notify('Créditos lançados');
      onChange();
    } catch (error) {
      notify('Não foi possível lançar', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Municípios — últimos 30 dias
        </CardTitle>
        <CardDescription>Saldo de cada município, consumo e quanto a plataforma ganhou (receita − custo pago aos provedores).</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="py-2">Município</th>
              <th>Saldo</th>
              <th>Chamadas</th>
              <th>Custo</th>
              <th>Receita</th>
              <th>Lucro</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y">
            {report.rows.map((r) => (
              <tr key={r.tenantId}>
                <td className="py-2 font-medium">{r.name}</td>
                <td className={r.balance <= 0 ? 'font-semibold text-red-600' : ''}>
                  {r.balance.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} <span className="text-xs text-gray-500">({brl(r.balance * creditValueBrl)})</span>
                </td>
                <td>{r.calls.toLocaleString('pt-BR')}</td>
                <td>{brl(r.costBrl, 4)}</td>
                <td>{brl(r.revenueBrl, 4)}</td>
                <td className="text-green-700">{brl(r.marginBrl, 4)}</td>
                <td className="text-right">
                  {isAdmin && (
                    <Button size="sm" variant="outline" onClick={() => grant(r)}>
                      Lançar créditos
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- testar

function TestTab({ isAdmin, notify, onChange }: { isAdmin: boolean; notify: Notify; onChange: () => void }) {
  const [text, setText] = useState('Oi, meu CPF é 123.456.789-09 e quero pedir poda de árvore na frente de casa');
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const run = async (mode: 'decide' | 'complete') => {
    setBusy(true);
    setResult(null);
    try {
      const r = await api('/playground', { method: 'POST', body: JSON.stringify({ mode, text }) });
      setResult(r.result);
      onChange();
    } catch (error) {
      notify('Falhou', error);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          Testar o roteador
        </CardTitle>
        <CardDescription>Testes da plataforma não são cobrados de nenhum município. Os dados pessoais do texto são mascarados antes de sair.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full rounded-xl border p-3 text-sm" />
        <div className="flex gap-2">
          <Button disabled={!isAdmin || busy} onClick={() => run('decide')}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Decidir intenção (JEV)
          </Button>
          <Button variant="outline" disabled={!isAdmin || busy} onClick={() => run('complete')}>
            Gerar resposta (LLM)
          </Button>
        </div>
        {result && <pre className="whitespace-pre-wrap rounded-xl bg-gray-900 p-3 text-xs text-green-200">{JSON.stringify(result, null, 2)}</pre>}
      </CardContent>
    </Card>
  );
}
