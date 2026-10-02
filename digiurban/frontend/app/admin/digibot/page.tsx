'use client';

/**
 * Painel › DigiBot — configuração do assistente do cidadão, SEM código.
 * Substitui o antigo "Fluxos do Bot" (editor de JSON que nem controlava o
 * fluxo principal). Mudanças ficam em rascunho até "Publicar"; cada
 * publicação vira versão e dá para voltar.
 */

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Bot, CheckCircle2, History, Loader2, RotateCcw, Send, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BotConfig, BotOverview, BotSettingsResponse, digibotApi } from '@/components/admin/digibot/api';
import { HumanTab, MenuTab, MessagesTab } from '@/components/admin/digibot/ConfigTabs';
import { FaqTab, ServicesTab, TeachTab } from '@/components/admin/digibot/KnowledgeTabs';
import { PhonePreview } from '@/components/admin/digibot/PhonePreview';

const TABS = [
  { id: 'visao', label: 'Visão geral' },
  { id: 'mensagens', label: 'Mensagens' },
  { id: 'menu', label: 'Menu inicial' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'perguntas', label: 'Perguntas frequentes' },
  { id: 'ensinar', label: 'Ensinar o bot' },
  { id: 'atendimento', label: 'Atendimento humano' },
  { id: 'historico', label: 'Histórico' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function OverviewTab({ overview, goTeach }: { overview: BotOverview | null; goTeach: () => void }) {
  if (!overview) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando…
      </div>
    );
  }
  const { status, week } = overview;
  const ok = (v: boolean) => (v ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />);
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap gap-x-6 gap-y-2 pt-6 text-sm">
          <span className="flex items-center gap-2">{ok(status.botOnline)} {status.botOnline ? 'Bot no ar' : 'Bot sem configuração — ele será recriado na próxima mensagem'}</span>
          <span className="flex items-center gap-2">
            {ok(status.aiAvailable)} {status.aiAvailable ? 'Inteligência artificial ligada' : 'IA desligada — o bot funciona pelos menus, palavras e perguntas'}
          </span>
          {status.aiCredits !== null && (
            <span className="flex items-center gap-2">
              {ok(status.aiCredits > 0)} {Math.floor(status.aiCredits).toLocaleString('pt-BR')} créditos de IA
            </span>
          )}
        </CardContent>
      </Card>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Últimos 7 dias</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Conversas" value={week.conversations} />
          <Stat label="Resolvidas pelo bot" value={week.resolvedByBot} hint={week.conversations ? `${Math.round((week.resolvedByBot / week.conversations) * 100)}%` : undefined} />
          <Stat label="Pedidos abertos" value={week.protocolsOpened} hint="pelo bot" />
          <Stat label="Foram para atendente" value={week.handovers} />
          <Stat label="Não entendidas" value={week.notUnderstood} />
        </div>
      </div>

      {overview.unansweredOpen > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="space-y-3 pt-6 text-sm text-amber-900">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-5 w-5" /> {overview.unansweredOpen} frase(s) que o bot não entendeu
            </p>
            <ul className="list-inside list-disc">
              {overview.topUnanswered.map((u) => (
                <li key={u.id}>
                  "{u.text}" <span className="text-amber-700">({u.count}×)</span>
                </li>
              ))}
            </ul>
            <Button size="sm" onClick={goTeach}>
              Ensinar o bot
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HistoryTab({ settings, onRestore }: { settings: BotSettingsResponse; onRestore: (id: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" /> Histórico de publicações
        </CardTitle>
        <CardDescription>
          No ar: versão {settings.version}, publicada em {new Date(settings.publishedAt).toLocaleString('pt-BR')}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {settings.versions.length === 0 ? (
          <p className="text-sm text-gray-500">Ainda não há versões anteriores.</p>
        ) : (
          settings.versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-2 text-sm">
              <span>
                Versão {v.version} · {new Date(v.createdAt).toLocaleString('pt-BR')}
              </span>
              <Button size="sm" variant="outline" onClick={() => onRestore(v.id)}>
                <RotateCcw className="mr-1 h-4 w-4" /> Voltar para esta
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function DigibotPage() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = (TABS.some((t) => t.id === params.get('aba')) ? params.get('aba') : 'visao') as TabId;
  const setTab = (id: TabId) => router.replace(`${pathname}?aba=${id}`, { scroll: false });

  const [settings, setSettings] = useState<BotSettingsResponse | null>(null);
  const [form, setForm] = useState<BotConfig | null>(null);
  const [overview, setOverview] = useState<BotOverview | null>(null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [publishing, setPublishing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSettings = useCallback(async () => {
    setLoadError('');
    try {
      const s = await digibotApi<BotSettingsResponse>('/settings');
      setSettings(s);
      setForm(s.draft || s.published);
    } catch (e: any) {
      setLoadError(e.message);
    }
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await digibotApi<BotOverview>('/overview'));
    } catch {
      setOverview(null);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
    void loadOverview();
  }, [loadSettings, loadOverview]);

  // salva o rascunho sozinho, 0,8 s depois da última alteração
  const change = (next: BotConfig) => {
    setForm(next);
    setSaving('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      saveTimer.current = null;
      try {
        const s = await digibotApi<BotSettingsResponse>('/settings/draft', { method: 'PUT', body: JSON.stringify(next) });
        setSettings((prev) => (prev ? { ...prev, draft: s.draft } : prev));
        setSaving('saved');
      } catch (e: any) {
        setSaving('idle');
        toast({ title: 'Não foi possível salvar o rascunho', description: e.message, variant: 'destructive' });
      }
    }, 800);
  };

  const publish = async () => {
    if (saveTimer.current) {
      toast({ title: 'Aguarde o rascunho ser salvo' });
      return;
    }
    setPublishing(true);
    try {
      const s = await digibotApi<BotSettingsResponse>('/settings/publish', { method: 'POST' });
      setSettings(s);
      setForm(s.published);
      setSaving('idle');
      toast({ title: 'Publicado!', description: 'O bot passa a usar a nova configuração em até 1 minuto.' });
    } catch (e: any) {
      toast({ title: 'Não foi possível publicar', description: e.message, variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  };

  const discard = async () => {
    if (!window.confirm('Descartar as alterações não publicadas?')) return;
    try {
      const s = await digibotApi<BotSettingsResponse>('/settings/discard', { method: 'POST' });
      setSettings((prev) => (prev ? { ...prev, ...s } : prev));
      setForm(s.published);
      setSaving('idle');
    } catch (e: any) {
      toast({ title: 'Não foi possível descartar', description: e.message, variant: 'destructive' });
    }
  };

  const restore = async (id: string) => {
    if (!window.confirm('Voltar para esta versão? Ela passa a valer para os cidadãos.')) return;
    try {
      const s = await digibotApi<BotSettingsResponse>(`/settings/versions/${id}/restore`, { method: 'POST' });
      setSettings(s);
      setForm(s.published);
      toast({ title: 'Versão restaurada' });
    } catch (e: any) {
      toast({ title: 'Não foi possível voltar', description: e.message, variant: 'destructive' });
    }
  };

  // aviso ao sair com rascunho sendo salvo
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (loadError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-gray-600">
        <p>Não foi possível carregar o DigiBot: {loadError}</p>
        <Button variant="outline" onClick={() => void loadSettings()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!settings || !form) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando…
      </div>
    );
  }

  const hasDraft = Boolean(settings.draft) || saving === 'saving';
  const isConfigTab = tab === 'mensagens' || tab === 'menu' || tab === 'atendimento';

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
            <Bot className="h-7 w-7 text-blue-600" /> DigiBot
          </h1>
          <p className="text-gray-600">O assistente que atende os cidadãos no app. Configure sem precisar de código.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasDraft ? (
            <>
              <Badge variant="outline" className="border-amber-400 text-amber-700">
                {saving === 'saving' ? 'Salvando rascunho…' : 'Rascunho não publicado'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => void discard()} disabled={saving === 'saving'}>
                Descartar
              </Button>
              <Button size="sm" onClick={() => void publish()} disabled={publishing || saving === 'saving'}>
                {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Publicar
              </Button>
            </>
          ) : (
            <Badge variant="outline" className="border-green-400 text-green-700">
              Versão {settings.version} no ar
            </Badge>
          )}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-[var(--lg-fill,#f1f5f9)] p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${tab === t.id ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t.label}
            {t.id === 'ensinar' && overview && overview.unansweredOpen > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">{overview.unansweredOpen}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          {tab === 'visao' && <OverviewTab overview={overview} goTeach={() => setTab('ensinar')} />}
          {tab === 'mensagens' && <MessagesTab config={form} onChange={change} />}
          {tab === 'menu' && <MenuTab config={form} onChange={change} />}
          {tab === 'atendimento' && <HumanTab config={form} onChange={change} />}
          {tab === 'servicos' && <ServicesTab />}
          {tab === 'perguntas' && <FaqTab />}
          {tab === 'ensinar' && <TeachTab onTaught={() => void loadOverview()} />}
          {tab === 'historico' && <HistoryTab settings={settings} onRestore={(id) => void restore(id)} />}
          {isConfigTab && <p className="text-xs text-gray-500">As alterações ficam em rascunho (salvas automaticamente). Clique em Publicar para valer no app.</p>}
        </div>
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <PhonePreview config={form} isDraft={hasDraft} />
        </aside>
      </div>
    </div>
  );
}

export default function DigibotPageWrapper() {
  return (
    <Suspense fallback={null}>
      <DigibotPage />
    </Suspense>
  );
}
