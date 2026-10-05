'use client';

/**
 * Super-admin › E-mail transacional — envio dos e-mails do sistema pelo VeloMail.
 * Tudo pelo painel (sem .env): chave de envio, segredo do webhook, remetente,
 * liga/desliga, teste e situação da fila.
 */

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Copy, KeyRound, Loader2, Mail, RefreshCw, Save, Send, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';

interface Status {
  settings: { enabled: boolean; fromEmail: string; fromName: string; apiBaseUrl: string; teamEmail: string | null; updatedAt: string };
  hasApiKey: boolean;
  apiKeyPreview: string | null;
  hasWebhookSecret: boolean;
  webhookUrl: string;
  last24h: Record<string, number>;
  queue: Record<string, number> | null;
  lastFailures: Array<{ id: string; toEmail: string; subject: string; errorMessage: string | null; createdAt: string }>;
}

const STATUS_LABELS: Array<[string, string]> = [
  ['DELIVERED', 'Entregues'],
  ['SENT', 'Enviados (aguardando confirmação)'],
  ['QUEUED', 'Na fila'],
  ['FAILED', 'Com falha'],
  ['BOUNCED', 'Devolvidos'],
];

async function api(url: string, init?: RequestInit) {
  const res = await fetch(`/api/platform/mail${url}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

export default function TransactionalMailPage() {
  const { user } = useSuperAdminAuth();
  const isAdmin = user?.role === 'PLATFORM_ADMIN';
  const { toast } = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({ enabled: false, fromEmail: '', fromName: '', teamEmail: '' });
  const [apiKey, setApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [testTo, setTestTo] = useState('');
  const [busy, setBusy] = useState<'' | 'save' | 'secret' | 'test'>('');

  const apply = (data: Status) => {
    setStatus(data);
    setForm({ enabled: data.settings.enabled, fromEmail: data.settings.fromEmail, fromName: data.settings.fromName, teamEmail: data.settings.teamEmail || '' });
  };

  const load = useCallback(async () => {
    setLoadError('');
    try {
      apply(await api(''));
    } catch (error: any) {
      setLoadError(error.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy('save');
    try {
      const body: Record<string, unknown> = { ...form };
      if (apiKey.trim()) body.apiKey = apiKey.trim();
      if (webhookSecret.trim()) body.webhookSecret = webhookSecret.trim();
      apply(await api('', { method: 'PUT', body: JSON.stringify(body) }));
      setApiKey('');
      setWebhookSecret('');
      toast({ title: 'Salvo', description: 'Configuração do e-mail atualizada.' });
    } catch (error: any) {
      toast({ title: 'Não foi possível salvar', description: error.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const generateSecret = async () => {
    setBusy('secret');
    try {
      const data = await api('/webhook-secret', { method: 'POST' });
      setNewSecret(data.webhookSecret);
      await load();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const sendTest = async () => {
    setBusy('test');
    try {
      const data = await api('/test', { method: 'POST', body: JSON.stringify({ to: testTo }) });
      toast({
        title: data.queued ? 'Teste na fila' : 'Teste não enviado',
        description: data.queued ? 'Confira a caixa de entrada em alguns instantes.' : data.reason,
        variant: data.queued ? undefined : 'destructive',
      });
      setTimeout(load, 4000);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const copy = (value: string) => {
    navigator.clipboard?.writeText(value).then(() => toast({ title: 'Copiado' }));
  };

  if (loadError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-sm text-red-600">{loadError}</p>
            <Button variant="outline" onClick={load}>Tentar de novo</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ready = status.settings.enabled && status.hasApiKey;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Mail className="h-6 w-6" /> E-mail do sistema</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Avisos de protocolo, troca de senha, boas-vindas e documentos saem pelo VeloMail. O DigiUrban não tem mais caixa de entrada.
        </p>
      </div>

      <Card className={ready ? 'border-green-300' : 'border-amber-300'}>
        <CardContent className="py-4 flex items-start gap-3">
          {ready ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" /> : <TriangleAlert className="h-5 w-5 text-amber-600 mt-0.5" />}
          <div className="text-sm">
            {ready ? (
              <p><strong>Envio ligado.</strong> Os e-mails saem como {status.settings.fromName} &lt;{status.settings.fromEmail}&gt;.</p>
            ) : (
              <p>
                <strong>Envio desligado.</strong> {status.hasApiKey ? 'Ligue a chave abaixo.' : 'Cole a chave de envio do VeloMail (começa com re_) e ligue o envio.'} Enquanto isso os e-mails ficam guardados na fila e saem quando for ligado.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimas 24 horas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {STATUS_LABELS.map(([key, label]) => (
              <div key={key} className="rounded-lg border p-3">
                <p className="text-2xl font-semibold">{status.last24h[key] || 0}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          {status.lastFailures.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Falhas recentes</p>
              {status.lastFailures.map((item) => (
                <div key={item.id} className="text-sm rounded-md bg-red-50 p-2">
                  <p><strong>{item.subject}</strong> — {item.toEmail}</p>
                  <p className="text-xs text-red-700 break-words">{item.errorMessage || 'Sem detalhe'}</p>
                </div>
              ))}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1" /> Atualizar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuração</CardTitle>
          <CardDescription>Só a Administração da plataforma pode alterar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Enviar e-mails</Label>
              <p className="text-xs text-muted-foreground">Desligado, nada sai: os e-mails esperam na fila.</p>
            </div>
            <Switch checked={form.enabled} disabled={!isAdmin} onCheckedChange={(enabled) => setForm((f) => ({ ...f, enabled }))} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome do remetente</Label>
              <Input value={form.fromName} disabled={!isAdmin} onChange={(e) => setForm((f) => ({ ...f, fromName: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Cada prefeitura pode trocar pelo próprio nome.</p>
            </div>
            <div className="space-y-1.5">
              <Label>E-mail do remetente</Label>
              <Input value={form.fromEmail} disabled={!isAdmin} onChange={(e) => setForm((f) => ({ ...f, fromEmail: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Precisa ser do domínio verificado no VeloMail.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>E-mail da equipe DigiUrban</Label>
            <Input
              type="email"
              placeholder="contato@digiurban.com.br"
              value={form.teamEmail}
              disabled={!isAdmin}
              onChange={(e) => setForm((f) => ({ ...f, teamEmail: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Recebe os pedidos de demonstração e as mensagens de contato do site.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><KeyRound className="h-4 w-4" /> Chave de envio do VeloMail</Label>
            <Input
              type="password"
              autoComplete="off"
              placeholder={status.hasApiKey ? `Guardada (${status.apiKeyPreview}) — cole outra para trocar` : 're_...'}
              value={apiKey}
              disabled={!isAdmin}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Guardada cifrada. Use uma chave só de envio, não a chave de agente de IA.</p>
          </div>

          {isAdmin && (
            <Button onClick={save} disabled={busy !== ''}>
              {busy === 'save' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Confirmação de entrega</CardTitle>
          <CardDescription>O VeloMail avisa aqui quando o e-mail foi entregue ou falhou.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <Label>Endereço para cadastrar no VeloMail (Webhooks)</Label>
            <div className="flex gap-2">
              <Input readOnly value={status.webhookUrl} />
              <Button variant="outline" size="icon" onClick={() => copy(status.webhookUrl)}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <p>Segredo: {status.hasWebhookSecret ? <span className="text-green-700">guardado</span> : <span className="text-amber-700">ainda não criado</span>}</p>
          {newSecret && (
            <div className="space-y-1.5 rounded-md border border-amber-300 bg-amber-50 p-3">
              <p className="font-medium">Copie agora e cole no cadastro do webhook no VeloMail — ele não aparece de novo.</p>
              <div className="flex gap-2">
                <Input readOnly value={newSecret} />
                <Button variant="outline" size="icon" onClick={() => copy(newSecret)}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
          {isAdmin && (
            <div className="flex flex-wrap gap-2 items-end">
              <Button variant="outline" onClick={generateSecret} disabled={busy !== ''}>
                {busy === 'secret' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {status.hasWebhookSecret ? 'Gerar novo segredo' : 'Gerar segredo'}
              </Button>
              <div className="flex-1 min-w-[220px] space-y-1.5">
                <Label>Ou cole o segredo que o VeloMail mostrou</Label>
                <Input type="password" autoComplete="off" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} />
              </div>
              <Button variant="outline" onClick={save} disabled={busy !== '' || !webhookSecret.trim()}>Salvar segredo</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enviar um teste</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <Input type="email" placeholder="seu@email.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
            <Button onClick={sendTest} disabled={busy !== '' || !testTo.trim()}>
              {busy === 'test' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar teste
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
