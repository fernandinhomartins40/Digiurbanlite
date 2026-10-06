'use client';

/**
 * Super-admin › Privacidade › Documentos: câmera inteligente do scanner e
 * leitura automática dos documentos enviados. Tudo pelo painel (nada de .env).
 */

import { useCallback, useEffect, useState } from 'react';
import { CircleCheck, CircleX, FileScan, Loader2, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface Settings {
  smartCameraEnabled: boolean;
  readingEnabled: boolean;
}

async function api(url: string, init?: RequestInit) {
  const res = await fetch(`/api/platform/privacy${url}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

export function DocScannerSettings({ isAdmin }: { isAdmin: boolean }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [engineOnline, setEngineOnline] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api('/doc-scanner');
      setSettings(data.settings);
      setEngineOnline(Boolean(data.engineOnline));
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (patch: Partial<Settings>) => {
    if (!settings) return;
    setSaving(true);
    setSettings({ ...settings, ...patch });
    try {
      const data = await api('/doc-scanner', { method: 'PUT', body: JSON.stringify(patch) });
      setSettings(data.settings);
      setEngineOnline(Boolean(data.engineOnline));
      toast({ title: 'Salvo' });
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      void load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileScan className="h-5 w-5" />
          Documentos: scanner e leitura automática
        </CardTitle>
        <CardDescription>
          Como o cidadão fotografa os documentos e o que o sistema confere sozinho. A leitura nunca aprova nem recusa: ela
          só avisa o servidor que vai conferir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!settings ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium">Câmera inteligente</p>
                <p className="text-sm text-gray-600">
                  A câmera acha o documento sozinha, mostra as pontas, dá dicas ("aproxime", "tem reflexo") e tira a foto
                  quando fica bom. Desligada, aparece uma moldura fixa e a pessoa toca no botão.
                </p>
                <p className="flex items-start gap-1.5 text-xs text-amber-700">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Usa o modelo DocAligner (código Apache 2.0). Ligue só depois de confirmar com os autores que os pesos do
                  modelo podem ser usados comercialmente.
                </p>
              </div>
              <Switch
                checked={settings.smartCameraEnabled}
                disabled={!isAdmin || saving}
                onCheckedChange={(value) => void save({ smartCameraEnabled: value })}
              />
            </div>

            <div className="flex items-start justify-between gap-4 border-t pt-5">
              <div className="space-y-1">
                <p className="font-medium">Leitura automática dos documentos</p>
                <p className="text-sm text-gray-600">
                  Lê as fotos enviadas (PaddleOCR, Apache 2.0, no próprio servidor) e mostra ao servidor se o documento parece
                  ser o pedido e se nome, CPF e nascimento conferem com o cadastro. Lê QR code e a faixa da nova identidade.
                  Guarda só o resultado, nunca o texto do documento.
                </p>
                <p className="flex items-center gap-1.5 text-xs">
                  {engineOnline ? (
                    <>
                      <CircleCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Motor de leitura no ar</span>
                    </>
                  ) : (
                    <>
                      <CircleX className="h-3.5 w-3.5 text-rose-600" />
                      <span className="text-rose-700">Motor de leitura fora do ar — os documentos são lidos quando ele voltar</span>
                    </>
                  )}
                </p>
              </div>
              <Switch
                checked={settings.readingEnabled}
                disabled={!isAdmin || saving}
                onCheckedChange={(value) => void save({ readingEnabled: value })}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default DocScannerSettings;
