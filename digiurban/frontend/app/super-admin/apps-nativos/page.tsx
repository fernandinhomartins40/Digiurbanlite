'use client';

/**
 * Super-admin › Apps nativos — credenciais dos avisos push dos apps Android e
 * iOS, pelo painel (sem .env). Ficam cifradas no servidor.
 *  - Android: arquivo .json da conta de serviço do Firebase (Cloud Messaging);
 *  - iPhone: chave .p8 da Apple (APNs) + Key ID + Team ID.
 */

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Save, Send, Smartphone, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';

interface Status {
  android: { configured: boolean; projectId: string | null; clientEmail: string | null; devices: number };
  ios: { configured: boolean; hasKey: boolean; keyId: string | null; teamId: string | null; bundleId: string; production: boolean; devices: number };
}

type TestResult = { ok: boolean; message: string; detail?: string | null };

async function api(url: string, init?: RequestInit) {
  const res = await fetch(`/api/platform/native-apps${url}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

/** Lê o arquivo escolhido como texto (o .json do Firebase ou o .p8 da Apple) */
function readFile(event: React.ChangeEvent<HTMLInputElement>, set: (value: string) => void) {
  const file = event.target.files?.[0];
  if (file) file.text().then(set).catch(() => undefined);
}

function StatusLine({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className="flex items-center gap-2 text-sm">
      {ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <TriangleAlert className="h-4 w-4 text-amber-600" />}
      {text}
    </p>
  );
}

export default function NativeAppsSettingsPage() {
  const { user } = useSuperAdminAuth();
  const isAdmin = user?.role === 'PLATFORM_ADMIN';
  const { toast } = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [loadError, setLoadError] = useState('');
  const [firebaseJson, setFirebaseJson] = useState('');
  const [apnsKey, setApnsKey] = useState('');
  const [keyId, setKeyId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [bundleId, setBundleId] = useState('');
  const [production, setProduction] = useState(true);
  const [busy, setBusy] = useState('');
  const [testToken, setTestToken] = useState({ ANDROID: '', IOS: '' });
  const [testResult, setTestResult] = useState<Record<string, TestResult | null>>({});

  const apply = (data: Status) => {
    setStatus(data);
    setKeyId(data.ios.keyId || '');
    setTeamId(data.ios.teamId || '');
    setBundleId(data.ios.bundleId || '');
    setProduction(data.ios.production);
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

  const save = async (body: Record<string, unknown>, label: string) => {
    setBusy(label);
    try {
      apply(await api('', { method: 'PUT', body: JSON.stringify(body) }));
      setFirebaseJson('');
      setApnsKey('');
      toast({ title: 'Salvo', description: 'Configuração dos apps atualizada.' });
    } catch (error: any) {
      toast({ title: 'Não foi possível salvar', description: error.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const test = async (platform: 'ANDROID' | 'IOS') => {
    setBusy(`test-${platform}`);
    setTestResult((prev) => ({ ...prev, [platform]: null }));
    try {
      const result = await api('/test', { method: 'POST', body: JSON.stringify({ platform, token: testToken[platform].trim() || undefined }) });
      setTestResult((prev) => ({ ...prev, [platform]: result }));
      load();
    } catch (error: any) {
      setTestResult((prev) => ({ ...prev, [platform]: { ok: false, message: error.message } }));
    } finally {
      setBusy('');
    }
  };

  if (loadError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
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

  // função (não componente): assim o campo não perde o foco a cada letra
  const testBox = (platform: "ANDROID" | "IOS", label: string) => (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm font-medium">Enviar aviso de teste</p>
      <p className="text-xs text-muted-foreground">
        Vai para o {label} que entrou por último no app. Para um aparelho específico, cole o código dele (opcional).
      </p>
      <Input
        value={testToken[platform]}
        onChange={(e) => setTestToken((prev) => ({ ...prev, [platform]: e.target.value }))}
        placeholder="Código do aparelho (opcional)"
        disabled={!isAdmin}
        autoComplete="off"
      />
      <Button variant="outline" onClick={() => test(platform)} disabled={!isAdmin || busy !== ''}>
        {busy === `test-${platform}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Enviar aviso de teste
      </Button>
      {testResult[platform] && (
        <div className={`rounded-lg p-3 text-sm ${testResult[platform]!.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p>{testResult[platform]!.message}</p>
          {testResult[platform]!.detail && <p className="mt-1 text-xs opacity-80">{testResult[platform]!.detail}</p>}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><Smartphone className="h-6 w-6" /> Apps nativos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Credenciais para os avisos (notificações) chegarem nos apps Android e iPhone. Ficam guardadas cifradas. Sem credencial, o app funciona,
          mas não recebe avisos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Android (Firebase)</CardTitle>
          <CardDescription>
            No console do Firebase: Configurações do projeto › Contas de serviço › Gerar nova chave privada. Escolha o arquivo .json baixado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusLine
            ok={status.android.configured}
            text={status.android.configured ? `Configurado: projeto ${status.android.projectId} · ${status.android.devices} aparelho(s)` : 'Ainda não configurado'}
          />
          <div className="space-y-1.5">
            <Label htmlFor="firebaseFile">Arquivo da conta de serviço (.json)</Label>
            <Input id="firebaseFile" type="file" accept=".json,application/json" onChange={(e) => readFile(e, setFirebaseJson)} disabled={!isAdmin} />
            <Textarea
              value={firebaseJson}
              onChange={(e) => setFirebaseJson(e.target.value)}
              placeholder={status.android.configured ? 'Salvo. Para trocar, escolha ou cole o novo arquivo.' : 'Ou cole aqui o conteúdo do arquivo .json'}
              rows={4}
              disabled={!isAdmin}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => save({ fcmServiceAccount: firebaseJson }, 'android')} disabled={!isAdmin || !firebaseJson.trim() || busy !== ''}>
              {busy === 'android' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
            {status.android.configured && isAdmin && (
              <Button variant="ghost" className="text-red-600" onClick={() => save({ fcmServiceAccount: '' }, 'android-remove')} disabled={busy !== ''}>
                Remover
              </Button>
            )}
          </div>
          {status.android.configured && testBox("ANDROID", "Android")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">iPhone (Apple)</CardTitle>
          <CardDescription>
            No site Apple Developer: Certificates, Identifiers &amp; Profiles › Keys › criar chave com &quot;Apple Push Notifications service (APNs)&quot;.
            Baixe o arquivo .p8 (só dá para baixar uma vez) e anote o Key ID. O Team ID aparece em Membership.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusLine
            ok={status.ios.configured}
            text={status.ios.configured ? `Configurado · ${status.ios.devices} aparelho(s)` : 'Ainda não configurado'}
          />
          <div className="space-y-1.5">
            <Label htmlFor="apnsFile">Chave da Apple (.p8)</Label>
            <Input id="apnsFile" type="file" accept=".p8" onChange={(e) => readFile(e, setApnsKey)} disabled={!isAdmin} />
            <p className="text-xs text-muted-foreground">
              {status.ios.hasKey ? (apnsKey ? 'Nova chave escolhida — clique em Salvar.' : 'Chave salva. Para trocar, escolha o novo arquivo.') : apnsKey ? 'Chave escolhida — clique em Salvar.' : 'Nenhuma chave salva.'}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="keyId">Key ID</Label>
              <Input id="keyId" value={keyId} onChange={(e) => setKeyId(e.target.value.trim())} placeholder="10 letras/números" disabled={!isAdmin} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teamId">Team ID</Label>
              <Input id="teamId" value={teamId} onChange={(e) => setTeamId(e.target.value.trim())} placeholder="10 letras/números" disabled={!isAdmin} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bundleId">Identificador do app</Label>
              <Input id="bundleId" value={bundleId} onChange={(e) => setBundleId(e.target.value.trim())} placeholder="br.com.digiurban.app" disabled={!isAdmin} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">App da loja (produção)</p>
                <p className="text-xs text-muted-foreground">Desligue só para testar com o app instalado pelo Xcode.</p>
              </div>
              <Switch checked={production} onCheckedChange={setProduction} disabled={!isAdmin} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => save({ ...(apnsKey.trim() ? { apnsKey } : {}), apnsKeyId: keyId, apnsTeamId: teamId, apnsBundleId: bundleId, apnsProduction: production }, 'ios')}
              disabled={!isAdmin || busy !== ''}
            >
              {busy === 'ios' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
            {status.ios.hasKey && isAdmin && (
              <Button variant="ghost" className="text-red-600" onClick={() => save({ apnsKey: '' }, 'ios-remove')} disabled={busy !== ''}>
                Remover chave
              </Button>
            )}
          </div>
          {status.ios.configured && testBox("IOS", "iPhone")}
        </CardContent>
      </Card>
    </div>
  );
}
