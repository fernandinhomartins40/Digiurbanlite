'use client';

/**
 * Formulários das chaves de API, um por serviço de IA (Super-admin › Chaves de API).
 * Tudo pelo painel: nada de variável de ambiente. A chave é cifrada no
 * servidor (AES-256-GCM) e nunca volta para a tela — só os 4 últimos dígitos.
 */

import { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, ExternalLink, KeyRound, Loader2, Save, ShieldCheck, Trash2, TriangleAlert, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export interface AiProvider {
  provider: string;
  label: string;
  baseUrl: string;
  hasKey: boolean;
  keyReadable: boolean;
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

const REGION: Record<string, { label: string; className: string; hint: string }> = {
  CN: { label: 'Dados na China', className: 'bg-amber-100 text-amber-800', hint: 'Transferência internacional (LGPD art. 33). Dados pessoais são mascarados antes do envio.' },
  GLOBAL: { label: 'Endpoint internacional', className: 'bg-blue-100 text-blue-800', hint: 'Servidores fora da China continental (ex.: Singapura).' },
  US: { label: 'Hospedado nos EUA', className: 'bg-green-100 text-green-800', hint: 'Modelos rodando em data centers dos EUA.' },
};

const ORDER = ['jev', 'deepinfra', 'qwen', 'deepseek', 'minimax', 'openrouter', 'moonshot', 'zhipu'];

async function api(url: string, init?: RequestInit) {
  const res = await fetch(`/api/platform/ai${url}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

export function AiProviderKeys({ isAdmin }: { isAdmin: boolean }) {
  const { toast } = useToast();
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api('/providers');
      setProviders([...data.providers].sort((a: AiProvider, b: AiProvider) => ORDER.indexOf(a.provider) - ORDER.indexOf(b.provider)));
    } catch (error: any) {
      toast({ title: 'Erro ao carregar as chaves', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando…
      </div>
    );
  }

  const active = providers.filter((p) => p.isEnabled && p.hasKey && p.keyReadable);
  const hasDecision = active.some((p) => p.provider === 'jev' || p.provider === 'openrouter');
  const hasWriter = active.some((p) => p.provider !== 'jev');

  return (
    <div className="space-y-4">
      <Card className={hasDecision && hasWriter ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}>
        <CardContent className="space-y-1 pt-6 text-sm">
          <p className="font-semibold">
            {hasDecision && hasWriter
              ? `IA pronta: ${active.length} serviço(s) ativo(s).`
              : 'Para a IA funcionar, ative pelo menos: o JEV (decisões) e um serviço que escreve (ex.: DeepInfra, Qwen ou DeepSeek).'}
          </p>
          <p className="text-gray-700">
            Cole a chave de cada serviço que você contratou e clique em salvar. Nada precisa ser configurado no servidor: a chave é guardada
            cifrada no banco e só os 4 últimos dígitos aparecem aqui. Os municípios nunca veem estas chaves.
          </p>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {providers.map((p) => (
          <ProviderForm key={p.provider} p={p} isAdmin={isAdmin} onChange={load} />
        ))}
      </div>
    </div>
  );
}

function ProviderForm({ p, isAdmin, onChange }: { p: AiProvider; isAdmin: boolean; onChange: () => void }) {
  const { toast } = useToast();
  const [key, setKey] = useState('');
  const [url, setUrl] = useState(p.baseUrl);
  const [busy, setBusy] = useState<string | null>(null);
  const region = REGION[p.dataRegion];
  const ready = p.isEnabled && p.hasKey && p.keyReadable;

  const save = async (body: Record<string, unknown>, ok: string) => {
    setBusy(ok);
    try {
      await api(`/providers/${p.provider}`, { method: 'PUT', body: JSON.stringify(body) });
      toast({ title: ok });
      setKey('');
      onChange();
    } catch (error: any) {
      toast({ title: 'Não foi possível salvar', description: error.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    try {
      const { result } = await api(`/providers/${p.provider}/test`, { method: 'POST' });
      toast(result.ok ? { title: `Conexão ok — ${result.detail}` } : { title: 'A conexão falhou', description: result.detail, variant: 'destructive' });
      onChange();
    } catch (error: any) {
      toast({ title: 'Falha no teste', description: error.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className={ready ? 'border-green-300' : ''}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{p.label}</CardTitle>
            <CardDescription>{p.notes}</CardDescription>
          </div>
          {ready ? <Badge className="bg-green-100 text-green-800">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge className={region.className} title={region.hint}>
            {region.label}
          </Badge>
          {p.zeroRetention && (
            <Badge className="bg-green-100 text-green-800">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Retenção zero
            </Badge>
          )}
          {p.signupUrl && (
            <a href={p.signupUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
              Onde conseguir a chave <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <KeyRound className="h-4 w-4 text-gray-400" />
          {p.hasKey ? (
            <span>
              Chave salva <code className="rounded bg-gray-100 px-1.5">••••{p.apiKeyLast4}</code>
            </span>
          ) : (
            <span className="text-gray-500">Nenhuma chave salva</span>
          )}
          {p.lastTestAt && (
            <span className={`ml-auto inline-flex items-center gap-1 text-xs ${p.lastTestOk ? 'text-green-700' : 'text-red-600'}`} title={p.lastTestError || ''}>
              {p.lastTestOk ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              último teste {new Date(p.lastTestAt).toLocaleString('pt-BR')}
            </span>
          )}
        </div>
        {p.hasKey && !p.keyReadable && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Esta chave não pode mais ser lida (o segredo do servidor mudou). Cole a chave de novo e salve.
          </p>
        )}
        {p.lastTestOk === false && p.lastTestError && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">Erro no último teste: {p.lastTestError}</p>}

        {isAdmin ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const body: Record<string, unknown> = {};
              if (key.trim()) body.apiKey = key.trim();
              if (url.trim() && url.trim() !== p.baseUrl) body.baseUrl = url.trim();
              if (!Object.keys(body).length) return;
              save(body, key.trim() ? 'Chave salva (cifrada)' : 'Endereço salvo');
            }}
          >
            <div>
              <Label htmlFor={`key-${p.provider}`}>Chave de API</Label>
              <Input
                id={`key-${p.provider}`}
                type="password"
                autoComplete="off"
                placeholder={p.hasKey ? 'Cole uma nova chave para trocar' : 'Cole aqui a chave de API'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`url-${p.provider}`}>Endereço da API</Label>
              <Input id={`url-${p.provider}`} value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={(!key.trim() && url.trim() === p.baseUrl) || !!busy}>
                {busy?.startsWith('Chave') || busy?.startsWith('Endereço') ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                Salvar
              </Button>
              <Button type="button" variant="outline" disabled={!p.hasKey || !p.keyReadable || !!busy} onClick={test}>
                {busy === 'test' ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Activity className="mr-1 h-4 w-4" />}
                Testar
              </Button>
              <Button
                type="button"
                variant={p.isEnabled ? 'outline' : 'default'}
                disabled={!p.hasKey || !p.keyReadable || !!busy}
                onClick={() => save({ isEnabled: !p.isEnabled }, p.isEnabled ? 'Serviço desativado' : 'Serviço ativado')}
              >
                {p.isEnabled ? 'Desativar' : 'Ativar'}
              </Button>
              {p.hasKey && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-600"
                  disabled={!!busy}
                  onClick={() => confirm(`Apagar a chave de ${p.label}?`) && save({ removeKey: true }, 'Chave apagada')}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Apagar chave
                </Button>
              )}
            </div>
          </form>
        ) : (
          <p className="text-xs text-gray-500">Seu acesso (Suporte) permite apenas consultar.</p>
        )}
      </CardContent>
    </Card>
  );
}
