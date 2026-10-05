'use client';

/**
 * Super-admin › Privacidade › Biometria facial: modelo do motor, limites de
 * decisão e prazos de guarda das fotos. Tudo pelo painel (nada de .env).
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Play, Save, ScanFace, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface FaceModel {
  id: string;
  label: string;
  description: string;
  license: string;
}

interface FaceSettings {
  recognitionModel: string;
  matchThreshold: number;
  reviewThreshold: number;
  minQuality: number;
  minLiveness: number;
  challengeYawDegrees: number;
}

interface RetentionFace {
  faceUnmatchedImageDays: number;
  faceEventImageDays: number;
  faceEventDays: number;
  faceLastRunAt: string | null;
  faceLastRunSummary: Record<string, number | string> | null;
}

async function api(url: string, init?: RequestInit) {
  const res = await fetch(`/api/platform/privacy${url}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

export function FaceBiometrySettings({ isAdmin, retention, onSaved }: { isAdmin: boolean; retention: RetentionFace; onSaved: () => void }) {
  const { toast } = useToast();
  const [models, setModels] = useState<FaceModel[]>([]);
  const [engine, setEngine] = useState<Record<keyof FaceSettings, string>>({
    recognitionModel: 'arcface_mnet',
    matchThreshold: '0.5',
    reviewThreshold: '0.4',
    minQuality: '0.55',
    minLiveness: '0.6',
    challengeYawDegrees: '12',
  });
  const [days, setDays] = useState({
    faceUnmatchedImageDays: String(retention.faceUnmatchedImageDays ?? 7),
    faceEventImageDays: String(retention.faceEventImageDays ?? 90),
    faceEventDays: String(retention.faceEventDays ?? 365),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api('/face-settings');
      setModels(data.models || []);
      const s: FaceSettings = data.settings;
      setEngine({
        recognitionModel: s.recognitionModel,
        matchThreshold: String(s.matchThreshold),
        reviewThreshold: String(s.reviewThreshold),
        minQuality: String(s.minQuality),
        minLiveness: String(s.minLiveness),
        challengeYawDegrees: String(s.challengeYawDegrees),
      });
    } catch (loadError: any) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedModel = models.find((model) => model.id === engine.recognitionModel);

  const save = async () => {
    setSaving(true);
    try {
      const engineData = await api('/face-settings', {
        method: 'PUT',
        body: JSON.stringify({
          recognitionModel: engine.recognitionModel,
          matchThreshold: Number(engine.matchThreshold),
          reviewThreshold: Number(engine.reviewThreshold),
          minQuality: Number(engine.minQuality),
          minLiveness: Number(engine.minLiveness),
          challengeYawDegrees: Number(engine.challengeYawDegrees),
        }),
      });
      await api('/retention', {
        method: 'PUT',
        body: JSON.stringify({
          faceUnmatchedImageDays: Number(days.faceUnmatchedImageDays),
          faceEventImageDays: Number(days.faceEventImageDays),
          faceEventDays: Number(days.faceEventDays),
        }),
      });
      toast({ title: 'Biometria salva', description: engineData.notice || 'Vale em até 1 minuto.' });
      onSaved();
    } catch (saveError: any) {
      toast({ title: 'Não foi possível salvar', description: saveError.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const runNow = async () => {
    if (!window.confirm('Apagar agora as fotos e registros da biometria que já passaram do prazo?')) return;
    setRunning(true);
    try {
      const data = await api('/retention/face/run', { method: 'POST' });
      const summary = data.summary || {};
      toast({
        title: 'Prazo da biometria aplicado',
        description: `${summary.eventImagesDeleted ?? 0} fotos de passagem e ${summary.eventsDeleted ?? 0} registros apagados.`,
      });
      onSaved();
    } catch (runError: any) {
      toast({ title: 'Não foi possível aplicar', description: runError.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  const numberField = (
    key: keyof typeof engine,
    label: string,
    hint: string,
    props: { min: number; max: number; step: number }
  ) => (
    <div className="space-y-1">
      <Label htmlFor={`face-${key}`}>{label}</Label>
      <Input
        id={`face-${key}`}
        type="number"
        className="w-32"
        {...props}
        value={engine[key]}
        disabled={!isAdmin}
        onChange={(event) => setEngine((current) => ({ ...current, [key]: event.target.value }))}
      />
      <p className="text-xs text-gray-500">{hint}</p>
    </div>
  );

  const dayField = (key: keyof typeof days, label: string, hint: string, min: number, max: number) => (
    <div className="space-y-1">
      <Label htmlFor={`face-${key}`}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={`face-${key}`}
          type="number"
          min={min}
          max={max}
          className="w-32"
          value={days[key]}
          disabled={!isAdmin}
          onChange={(event) => setDays((current) => ({ ...current, [key]: event.target.value }))}
        />
        <span className="text-sm text-gray-500">dias</span>
      </div>
      <p className="text-xs text-gray-500">{hint}</p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanFace className="h-5 w-5 text-blue-600" />
          Biometria facial
        </CardTitle>
        <CardDescription>
          Reconhecimento feito no servidor (UniFace). As fotos ficam cifradas, separadas por município, e as de passagem são
          apagadas sozinhas nos prazos abaixo — esta rotina está sempre ligada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-sm text-rose-600">Não foi possível carregar: {error}</p>}

        <div className="space-y-2">
          <Label htmlFor="face-model">Modelo de reconhecimento</Label>
          <select
            id="face-model"
            className="h-10 w-full max-w-md rounded-md border border-gray-200 bg-white px-3 text-sm"
            value={engine.recognitionModel}
            disabled={!isAdmin}
            onChange={(event) => setEngine((current) => ({ ...current, recognitionModel: event.target.value }))}
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
          {selectedModel && (
            <div className="max-w-2xl space-y-1 text-sm">
              <p className="text-gray-600">{selectedModel.description}</p>
              <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong>Licença:</strong> {selectedModel.license}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Ao trocar o modelo, as biometrias já cadastradas são recalculadas sozinhas a partir das fotos de cadastro.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {numberField('matchThreshold', 'Reconhecer automaticamente a partir de', 'Semelhança (0 a 1). Padrão 0,50.', { min: 0.3, max: 0.9, step: 0.01 })}
          {numberField('reviewThreshold', 'Mandar para revisão a partir de', 'Abaixo disso: não reconhecido. Padrão 0,40.', { min: 0.2, max: 0.85, step: 0.01 })}
          {numberField('minQuality', 'Qualidade mínima da foto de cadastro', 'Padrão 0,55.', { min: 0.3, max: 0.95, step: 0.01 })}
          {numberField('minLiveness', 'Anti-fraude: fração de fotos "reais"', 'Das 3 fotos do desafio. Padrão 0,60 (2 de 3).', { min: 0.34, max: 1, step: 0.01 })}
          {numberField('challengeYawDegrees', 'Giro mínimo do rosto no desafio', 'Em graus. Padrão 12.', { min: 8, max: 35, step: 1 })}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {dayField('faceUnmatchedImageDays', 'Foto de quem não foi reconhecido', 'Pessoas de fora que passaram pela câmera. Máx. 30.', 1, 30)}
          {dayField('faceEventImageDays', 'Foto das passagens reconhecidas', 'Depois disso o registro fica sem a foto.', 1, 365)}
          {dayField('faceEventDays', 'Registro de entrada/saída', 'O histórico de passagem em si.', 30, 1825)}
        </div>

        {retention.faceLastRunAt && (
          <p className="text-sm text-gray-500">
            Última aplicação: {new Date(retention.faceLastRunAt).toLocaleString('pt-BR')}
            {retention.faceLastRunSummary
              ? ` — ${retention.faceLastRunSummary.eventImagesDeleted ?? 0} fotos e ${retention.faceLastRunSummary.eventsDeleted ?? 0} registros apagados`
              : ''}
          </p>
        )}

        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar biometria
            </Button>
            <Button variant="outline" onClick={runNow} disabled={running}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Aplicar prazo agora
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FaceBiometrySettings;
