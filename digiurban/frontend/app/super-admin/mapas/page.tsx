'use client';

/**
 * Super-admin › Mapas (Google) — chaves do Google Maps pelo painel (sem .env).
 *  - chave do navegador: mostra o mapa do Google nas telas (Mapa dos pedidos, Painel na TV);
 *  - ID do mapa (opcional): estilo criado no Google Cloud;
 *  - chave do servidor (opcional): procura endereços que o OpenStreetMap não achou.
 * Desligado ou sem chave: as telas usam o OpenStreetMap.
 * Todo endereço procurado fica guardado (arquivo de endereços) e não é consultado de novo.
 */

import { useCallback, useEffect, useState } from 'react';
import { APIProvider, Map as GoogleMap } from '@vis.gl/react-google-maps';
import { CheckCircle2, Database, KeyRound, Loader2, Map as MapIcon, RefreshCw, Save, Search, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';

interface Status {
  enabled: boolean;
  hasBrowserKey: boolean;
  browserKeyPreview: string | null;
  browserKey: string | null;
  hasServerKey: boolean;
  serverKeyPreview: string | null;
  mapId: string | null;
  provider: 'google' | 'osm';
  cache: { total: number; reaproveitadas: number; porFonte: Record<string, number> } | null;
}

const SOURCES: Array<[string, string]> = [
  ['nominatim', 'OpenStreetMap (grátis, fica guardado)'],
  ['geoapify', 'Geoapify (grátis, fica guardado)'],
  ['google', 'Google (guardado por 30 dias)'],
  ['none', 'Não encontrados (tenta de novo em 7 dias)'],
];

async function api(url: string, init?: RequestInit) {
  const res = await fetch(`/api/platform/maps${url}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

export default function MapsSettingsPage() {
  const { user } = useSuperAdminAuth();
  const isAdmin = user?.role === 'PLATFORM_ADMIN';
  const { toast } = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [loadError, setLoadError] = useState('');
  const [browserKey, setBrowserKey] = useState('');
  const [serverKey, setServerKey] = useState('');
  const [mapId, setMapId] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState<'' | 'save' | 'test' | 'remove-browser' | 'remove-server'>('');
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; detail?: string | null } | null>(null);
  const [previewError, setPreviewError] = useState(false);

  const apply = (data: Status) => {
    setStatus(data);
    setEnabled(data.enabled);
    setMapId(data.mapId || '');
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

  // o Google chama esta função quando recusa a chave do navegador
  useEffect(() => {
    (window as any).gm_authFailure = () => setPreviewError(true);
    return () => {
      delete (window as any).gm_authFailure;
    };
  }, []);

  const save = async (extra: Record<string, unknown> = {}) => {
    setBusy(extra.browserKey === '' ? 'remove-browser' : extra.serverKey === '' ? 'remove-server' : 'save');
    try {
      const body: Record<string, unknown> = { enabled, mapId: mapId.trim() };
      if (browserKey.trim()) body.browserKey = browserKey.trim();
      if (serverKey.trim()) body.serverKey = serverKey.trim();
      Object.assign(body, extra);
      if (extra.browserKey === '') body.enabled = false;
      apply(await api('', { method: 'PUT', body: JSON.stringify(body) }));
      setBrowserKey('');
      setServerKey('');
      setPreviewError(false);
      toast({ title: 'Salvo', description: 'Configuração do mapa atualizada.' });
    } catch (error: any) {
      toast({ title: 'Não foi possível salvar', description: error.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const test = async () => {
    setBusy('test');
    setTestResult(null);
    try {
      setTestResult(await api('/test', { method: 'POST' }));
    } catch (error: any) {
      setTestResult({ ok: false, message: error.message });
    } finally {
      setBusy('');
    }
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

  const usingGoogle = status.provider === 'google';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><MapIcon className="h-6 w-6" /> Mapas (Google)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Com a chave do Google, o Mapa dos pedidos e o Painel na TV mostram o mapa do Google. Sem chave, continua o OpenStreetMap (grátis).
        </p>
      </div>

      <Card className={usingGoogle ? 'border-green-300' : 'border-amber-300'}>
        <CardContent className="py-4 flex items-start gap-3">
          {usingGoogle ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" /> : <TriangleAlert className="h-5 w-5 text-amber-600 mt-0.5" />}
          <p className="text-sm">
            {usingGoogle ? (
              <><strong>Google Maps ligado.</strong> As telas com mapa usam o Google.</>
            ) : (
              <><strong>Usando o OpenStreetMap.</strong> {status.hasBrowserKey ? 'Ligue o Google Maps abaixo.' : 'Cole a chave do navegador e ligue o Google Maps.'}</>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5" /> Chaves</CardTitle>
          <CardDescription>As chaves ficam guardadas cifradas. Para trocar, cole a nova; para manter, deixe em branco.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Usar o Google Maps</p>
              <p className="text-xs text-muted-foreground">Desligado: as telas voltam para o OpenStreetMap.</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} disabled={!isAdmin} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="browserKey">Chave do navegador (obrigatória)</Label>
            <Input
              id="browserKey"
              value={browserKey}
              onChange={(e) => setBrowserKey(e.target.value)}
              placeholder={status.browserKeyPreview ? `Salva: ${status.browserKeyPreview}` : 'AIza...'}
              disabled={!isAdmin}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Começa com AIza. No Google Cloud, restrinja por site (*.digiurban.com.br/*) e só para a &quot;Maps JavaScript API&quot;.
            </p>
            {status.hasBrowserKey && isAdmin && (
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => save({ browserKey: '' })} disabled={busy !== ''}>
                {busy === 'remove-browser' && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Remover chave do navegador
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mapId">ID do mapa (opcional)</Label>
            <Input id="mapId" value={mapId} onChange={(e) => setMapId(e.target.value)} placeholder="Ex.: 8e0a97af9386fef" disabled={!isAdmin} autoComplete="off" />
            <p className="text-xs text-muted-foreground">Só se você criou um estilo de mapa no Google Cloud (Gerenciamento de mapas).</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="serverKey">Chave do servidor (opcional)</Label>
            <Input
              id="serverKey"
              value={serverKey}
              onChange={(e) => setServerKey(e.target.value)}
              placeholder={status.serverKeyPreview ? `Salva: ${status.serverKeyPreview}` : 'AIza...'}
              disabled={!isAdmin}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Usada só quando o OpenStreetMap não acha um endereço. Crie outra chave, restrita pelo IP do servidor e só para a &quot;Geocoding API&quot;.
            </p>
            {status.hasServerKey && isAdmin && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={test} disabled={busy !== ''}>
                  {busy === 'test' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />} Testar chave do servidor
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => save({ serverKey: '' })} disabled={busy !== ''}>
                  {busy === 'remove-server' && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Remover chave do servidor
                </Button>
              </div>
            )}
            {testResult && (
              <div className={`rounded-md p-2 text-sm ${testResult.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <p>{testResult.message}</p>
                {testResult.detail && <p className="text-xs mt-1 break-words">{testResult.detail}</p>}
              </div>
            )}
          </div>

          {isAdmin ? (
            <Button onClick={() => save()} disabled={busy !== ''}>
              {busy === 'save' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Salvar
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">Somente o administrador da plataforma altera as chaves.</p>
          )}
        </CardContent>
      </Card>

      {status.browserKey && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prévia do mapa</CardTitle>
            <CardDescription>Se o mapa aparecer abaixo, a chave do navegador está funcionando neste site.</CardDescription>
          </CardHeader>
          <CardContent>
            {previewError ? (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                O Google recusou a chave do navegador. Confira se a &quot;Maps JavaScript API&quot; está ativada, se o faturamento está ligado no projeto e se este site
                está na lista de sites permitidos da chave.
              </div>
            ) : (
              <div className="h-72 overflow-hidden rounded-lg border">
                <APIProvider apiKey={status.browserKey} language="pt-BR" region="BR">
                  <GoogleMap
                    defaultCenter={{ lat: -15.7998, lng: -47.8645 }}
                    defaultZoom={12}
                    mapId={status.mapId || undefined}
                    gestureHandling="cooperative"
                    style={{ width: '100%', height: '100%' }}
                  />
                </APIProvider>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Database className="h-5 w-5" /> Arquivo de endereços</CardTitle>
          <CardDescription>
            Todo endereço procurado fica guardado. Quando alguém procura o mesmo endereço, cidade ou estado de novo, a resposta sai daqui, sem gastar consulta.
            Ordem: arquivo → OpenStreetMap → Geoapify → Google (só com a chave do servidor).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.cache ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-semibold tabular-nums">{status.cache.total.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">Endereços guardados</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-semibold tabular-nums text-green-700">{status.cache.reaproveitadas.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">Consultas economizadas (respondidas pelo arquivo)</p>
                </div>
              </div>
              <ul className="space-y-1 text-sm">
                {SOURCES.map(([key, label]) => (
                  <li key={key} className="flex justify-between border-b py-1 last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <strong className="tabular-nums">{(status.cache?.porFonte[key] || 0).toLocaleString('pt-BR')}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Ainda sem números.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Regra do Google: a imagem do mapa não pode ser guardada (cada abertura de tela conta) e as coordenadas vindas do Google valem no máximo 30 dias. Depois
            disso o endereço é procurado de novo, primeiro nos serviços grátis.
          </p>
          <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1" /> Atualizar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
