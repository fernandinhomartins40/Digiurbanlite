'use client';

/**
 * Super-admin › Privacidade — prazo de guarda das conversas (LGPD).
 * Tudo pelo painel: liga/desliga, prazos em dias, prévia do que será apagado
 * e botão para aplicar agora. O job diário roda às 03:30 quando ativado.
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Play, Save, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import FaceBiometrySettings from '@/components/super-admin/FaceBiometrySettings';

interface Settings {
  enabled: boolean;
  botChatDays: number;
  humanChatDays: number;
  assistantDays: number;
  lastRunAt: string | null;
  lastRunSummary: Summary | null;
  faceUnmatchedImageDays: number;
  faceEventImageDays: number;
  faceEventDays: number;
  faceLastRunAt: string | null;
  faceLastRunSummary: Record<string, number | string> | null;
}

interface Summary {
  botMessages: number;
  chatMessages: number;
  flowStates: number;
  legacyBotMessages: number;
  assistantConversations: number;
}

const SUMMARY_LABELS: Array<[keyof Summary, string]> = [
  ['botMessages', 'Mensagens com o DigiBot'],
  ['flowStates', 'Dados digitados em atendimentos do bot já encerrados'],
  ['legacyBotMessages', 'Mensagens do bot antigo'],
  ['chatMessages', 'Mensagens do chat cidadão × servidor (sem protocolo)'],
  ['assistantConversations', 'Conversas do Assistente de IA dos servidores'],
];

async function api(url: string, init?: RequestInit) {
  const res = await fetch(`/api/platform/privacy${url}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

export default function PrivacyPage() {
  const { user } = useSuperAdminAuth();
  const isAdmin = user?.role === 'PLATFORM_ADMIN';
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [pending, setPending] = useState<Summary | null>(null);
  const [form, setForm] = useState({ enabled: false, botChatDays: '365', humanChatDays: '730', assistantDays: '180' });
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  const apply = (data: { settings: Settings; pending: Summary }) => {
    setSettings(data.settings);
    setPending(data.pending);
    setForm({
      enabled: data.settings.enabled,
      botChatDays: String(data.settings.botChatDays),
      humanChatDays: String(data.settings.humanChatDays),
      assistantDays: String(data.settings.assistantDays),
    });
  };

  const load = useCallback(async () => {
    setLoadError('');
    try {
      apply(await api('/retention'));
    } catch (error: any) {
      setLoadError(error.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const data = await api('/retention', {
        method: 'PUT',
        body: JSON.stringify({
          enabled: form.enabled,
          botChatDays: Number(form.botChatDays),
          humanChatDays: Number(form.humanChatDays),
          assistantDays: Number(form.assistantDays),
        }),
      });
      apply(data);
      toast({ title: 'Prazo de guarda salvo' });
    } catch (error: any) {
      toast({ title: 'Não foi possível salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const runNow = async () => {
    if (!window.confirm('Apagar agora o conteúdo que já passou do prazo? Isso não pode ser desfeito.')) return;
    setRunning(true);
    try {
      const data = await api('/retention/run', { method: 'POST' });
      const total = Object.values(data.summary as Summary).reduce((a, b) => a + b, 0);
      toast({ title: 'Prazo de guarda aplicado', description: `${total} itens apagados.` });
      await load();
    } catch (error: any) {
      toast({ title: 'Não foi possível aplicar', description: error.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 text-gray-600">
        <p>Não foi possível carregar: {loadError}</p>
        <Button variant="outline" onClick={load}>Tentar de novo</Button>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando…
      </div>
    );
  }

  const pendingTotal = pending ? Object.values(pending).reduce((a, b) => a + b, 0) : 0;
  const days = (key: 'botChatDays' | 'humanChatDays' | 'assistantDays', label: string, hint: string) => (
    <div className="space-y-1">
      <Label htmlFor={key}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={key}
          type="number"
          min={key === 'assistantDays' ? 7 : 30}
          max={3650}
          className="w-32"
          value={form[key]}
          disabled={!isAdmin}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
        <span className="text-sm text-gray-500">dias</span>
      </div>
      <p className="text-xs text-gray-500">{hint}</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
          <ShieldCheck className="h-7 w-7 text-blue-600" />
          Privacidade
        </h1>
        <p className="text-gray-600">Por quanto tempo o sistema guarda conversas e biometria. Depois do prazo, o conteúdo é apagado (LGPD).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prazo de guarda das conversas</CardTitle>
          <CardDescription>
            Conversas ligadas a um protocolo não são apagadas: fazem parte do processo e seguem a guarda do protocolo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="font-medium">Apagar automaticamente o que passou do prazo</p>
              <p className="text-sm text-gray-500">Roda todo dia às 03:30.</p>
            </div>
            <Switch checked={form.enabled} disabled={!isAdmin} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {days('botChatDays', 'Conversas com o DigiBot', 'Inclui o que o cidadão digitou nos atendimentos do bot.')}
            {days('humanChatDays', 'Chat com servidores', 'Conversas cidadão × servidor sem protocolo.')}
            {days('assistantDays', 'Assistente de IA', 'Conversas dos servidores com o Assistente.')}
          </div>

          {isAdmin && (
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>O que já passou do prazo</CardTitle>
          <CardDescription>Prévia com os prazos salvos. Nada é apagado até você ativar ou clicar em aplicar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="divide-y rounded-lg border">
            {SUMMARY_LABELS.map(([key, label]) => (
              <li key={key} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{label}</span>
                <span className="font-semibold tabular-nums">{(pending?.[key] ?? 0).toLocaleString('pt-BR')}</span>
              </li>
            ))}
          </ul>
          {settings.lastRunAt && (
            <p className="text-sm text-gray-500">Última aplicação: {new Date(settings.lastRunAt).toLocaleString('pt-BR')}</p>
          )}
          <p className="flex items-start gap-2 text-xs text-gray-500">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            Arquivos enviados ao bot ficam guardados com acesso restrito e não são apagados por esta rotina.
          </p>
          {isAdmin && (
            <Button variant="outline" onClick={runNow} disabled={running || !settings.enabled || pendingTotal === 0}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Aplicar agora
            </Button>
          )}
          {isAdmin && !settings.enabled && <p className="text-xs text-gray-500">Ative e salve para poder aplicar.</p>}
        </CardContent>
      </Card>

      <FaceBiometrySettings isAdmin={isAdmin} retention={settings} onSaved={load} />
    </div>
  );
}
