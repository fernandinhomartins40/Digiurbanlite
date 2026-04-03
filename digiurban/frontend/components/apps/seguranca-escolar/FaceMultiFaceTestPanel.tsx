'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  Camera,
  CameraOff,
  Loader2,
  RefreshCcw,
  ScanFace,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { analyzeFaceApiFrame, type FaceApiFaceAnalysis } from '@/components/common/face-api-engine';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import facePlatformService from '@/lib/services/face-platform.service';
import { cn } from '@/lib/utils';

interface RecognizedFaceSnapshot {
  faceIndex: number;
  label: string;
  identityName: string | null;
  confidence: number;
  matchStatus: 'MATCHED' | 'REVIEW_REQUIRED' | 'UNMATCHED';
  reviewReason?: string | null;
  box: FaceApiFaceAnalysis['box'];
}

interface FaceMultiFaceTestPanelProps {
  schoolName?: string;
  className?: string;
}

const ANALYSIS_INTERVAL_MS = 700;
const MAX_FACES = 4;
const FACE_API_ANALYSIS_OPTIONS = {
  inputSize: 416 as const,
  scoreThreshold: 0.42,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getStatusTone(matchStatus: RecognizedFaceSnapshot['matchStatus']) {
  if (matchStatus === 'MATCHED') {
    return {
      border: 'border-emerald-300',
      fill: 'bg-emerald-500/85',
      text: 'text-emerald-50',
      chip: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    };
  }

  if (matchStatus === 'REVIEW_REQUIRED') {
    return {
      border: 'border-amber-300',
      fill: 'bg-amber-500/85',
      text: 'text-amber-50',
      chip: 'border-amber-200 bg-amber-100 text-amber-800',
    };
  }

  return {
    border: 'border-rose-300',
    fill: 'bg-rose-500/85',
    text: 'text-rose-50',
    chip: 'border-rose-200 bg-rose-100 text-rose-800',
  };
}

function cropFaceSnapshot(video: HTMLVideoElement, box: FaceApiFaceAnalysis['box']) {
  const paddingRatio = 0.18;
  const padX = box.width * paddingRatio;
  const padY = box.height * paddingRatio;

  const sourceX = clamp(box.x - padX, 0, Math.max(video.videoWidth - 1, 0));
  const sourceY = clamp(box.y - padY, 0, Math.max(video.videoHeight - 1, 0));
  const sourceWidth = clamp(box.width + padX * 2, 1, Math.max(video.videoWidth - sourceX, 1));
  const sourceHeight = clamp(box.height + padY * 2, 1, Math.max(video.videoHeight - sourceY, 1));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(Math.round(sourceWidth), 1);
  canvas.height = Math.max(Math.round(sourceHeight), 1);

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function FaceMultiFaceTestPanel({ schoolName, className = '' }: FaceMultiFaceTestPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Abra a câmera para testar múltiplos rostos.');
  const [error, setError] = useState<string | null>(null);
  const [faces, setFaces] = useState<RecognizedFaceSnapshot[]>([]);
  const [lastModelName, setLastModelName] = useState<string>('face-api.js');
  const [lastDetectedCount, setLastDetectedCount] = useState(0);

  const clearOverlay = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return;
    }

    const width = canvas.clientWidth || canvas.width || 1;
    const height = canvas.clientHeight || canvas.height || 1;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.max(Math.round(width * dpr), 1);
    canvas.height = Math.max(Math.round(height * dpr), 1);

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
  };

  const drawOverlay = (items: RecognizedFaceSnapshot[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !video || !context || !video.videoWidth || !video.videoHeight) {
      return;
    }

    const width = canvas.clientWidth || video.videoWidth;
    const height = canvas.clientHeight || video.videoHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.max(Math.round(width * dpr), 1);
    canvas.height = Math.max(Math.round(height * dpr), 1);

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const scale = Math.min(width / video.videoWidth, height / video.videoHeight);
    const renderWidth = video.videoWidth * scale;
    const renderHeight = video.videoHeight * scale;
    const offsetX = (width - renderWidth) / 2;
    const offsetY = (height - renderHeight) / 2;

    items.forEach((item) => {
      const tone = getStatusTone(item.matchStatus);
      const x = offsetX + item.box.x * scale;
      const y = offsetY + item.box.y * scale;
      const w = item.box.width * scale;
      const h = item.box.height * scale;
      const label = `${item.label} · ${Math.round(item.confidence * 100)}%`;

      context.strokeStyle = item.matchStatus === 'MATCHED' ? '#34d399' : item.matchStatus === 'REVIEW_REQUIRED' ? '#f59e0b' : '#fb7185';
      context.lineWidth = 3;
      context.strokeRect(x, y, w, h);

      context.font = '600 13px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      context.textBaseline = 'middle';
      const textWidth = Math.min(context.measureText(label).width + 24, width - x - 12);
      const labelHeight = 28;
      const labelX = x;
      const labelY = Math.max(8, y - labelHeight - 6);

      context.fillStyle = 'rgba(15, 23, 42, 0.88)';
      context.fillRect(labelX, labelY, Math.max(textWidth, 96), labelHeight);

      context.fillStyle = '#fff';
      context.fillText(label, labelX + 12, labelY + labelHeight / 2 + 1);

      if (item.reviewReason) {
        context.font = '500 11px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        context.fillStyle = tone.fill;
        context.fillRect(labelX, y + h + 6, Math.max(textWidth, 96), 22);
        context.fillStyle = '#fff';
        context.fillText(item.reviewReason, labelX + 12, y + h + 17);
      }
    });
  };

  const stopCamera = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    inFlightRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setAnalyzing(false);
    setFaces([]);
    setLastDetectedCount(0);
    clearOverlay();
  };

  const analyzeFrame = async () => {
    if (inFlightRef.current || !cameraActive) {
      return;
    }

    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      return;
    }

    inFlightRef.current = true;
    setAnalyzing(true);

    try {
      const analysis = await analyzeFaceApiFrame(video, FACE_API_ANALYSIS_OPTIONS);

      if (!analysis || !analysis.faces.length) {
        setFaces([]);
        setLastDetectedCount(0);
        setLastModelName('face-api.js');
        setStatusMessage('Nenhum rosto detectado. Posicione mais pessoas no enquadramento para testar.');
        clearOverlay();
        return;
      }

      const sortedFaces = [...analysis.faces].sort((left, right) => left.box.x - right.box.x).slice(0, MAX_FACES);

      const settledFaces = await Promise.allSettled(
        sortedFaces.map(async (face, index) => {
          const imageBase64 = cropFaceSnapshot(video, face.box);

          if (!imageBase64) {
            throw new Error('Não foi possível recortar o rosto para reconhecimento.');
          }

          const response = await facePlatformService.readBiometry({
            imageBase64,
            embedding: face.descriptor,
            modelName: analysis.modelName,
            modelVersion: analysis.modelVersion,
            sourceType: 'SCHOOL_SECURITY_MULTI_FACE_TEST',
            sourceLabel: `Teste multi-rosto${schoolName ? ` - ${schoolName}` : ''}`,
            qualityScore: 0.8,
            livenessScore: 0.8,
            metadata: {
              testMode: true,
              faceIndex: index + 1,
              detectedFacesCount: analysis.detectedFacesCount,
              origin: 'seguranca-escolar',
            },
          });

          const identityName =
            response.identity?.citizen?.name || response.identity?.person?.name || null;
          const hasIdentity = Boolean(identityName);

          return {
            faceIndex: index + 1,
            label: hasIdentity
              ? identityName + (response.matchStatus === 'REVIEW_REQUIRED' ? ' (revisão)' : '')
              : `Rosto ${index + 1}`,
            identityName,
            confidence: response.confidence || 0,
            matchStatus: response.matchStatus,
            reviewReason: response.reviewReason || null,
            box: face.box,
          } satisfies RecognizedFaceSnapshot;
        })
      );

      const nextFaces = settledFaces.map((entry, index) => {
        if (entry.status === 'fulfilled') {
          return entry.value;
        }

        return {
          faceIndex: index + 1,
          label: `Rosto ${index + 1}`,
          identityName: null,
          confidence: sortedFaces[index]?.score || 0,
          matchStatus: 'UNMATCHED' as const,
          reviewReason: entry.reason?.message || 'Rosto detectado, mas sem reconhecimento completo.',
          box: sortedFaces[index].box,
        };
      });

      setFaces(nextFaces);
      setLastDetectedCount(analysis.detectedFacesCount);
      setLastModelName(analysis.modelName);
      setStatusMessage(
        nextFaces.length > 0
          ? `${nextFaces.length} rosto(s) avaliados em tempo real com caixas e rótulos visuais.`
          : 'Nenhum rosto reconhecido nesta leitura.'
      );
      drawOverlay(nextFaces);
    } catch (analysisError: any) {
      console.error('Erro ao analisar múltiplos rostos:', analysisError);
      setError(
        analysisError?.response?.data?.message ||
          analysisError?.response?.data?.error ||
          analysisError?.message ||
          'Não foi possível executar o teste de múltiplos rostos.'
      );
      setStatusMessage('Falha ao analisar o vídeo ao vivo.');
      setFaces([]);
      clearOverlay();
    } finally {
      setAnalyzing(false);
      inFlightRef.current = false;
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este dispositivo não oferece suporte à câmera pelo navegador.');
      return;
    }

    try {
      setCameraLoading(true);
      setError(null);
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }

      setCameraActive(true);
      setStatusMessage('Câmera iniciada. O sistema vai desenhar caixas e rótulos sobre cada rosto.');
      intervalRef.current = window.setInterval(() => {
        void analyzeFrame();
      }, ANALYSIS_INTERVAL_MS);
      void analyzeFrame();
    } catch (startError: any) {
      console.error('Erro ao iniciar o teste multi-rosto:', startError);
      setError(
        startError?.response?.data?.message ||
          startError?.response?.data?.error ||
          startError?.message ||
          'Não foi possível iniciar a câmera ao vivo.'
      );
      stopCamera();
    } finally {
      setCameraLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cameraActive) {
      clearOverlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive]);

  return (
    <Card className={cn('border-sky-100', className)}>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
              <Users className="h-5 w-5 text-blue-600" />
              Teste multi-rosto em tempo real
            </CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              O vídeo ao vivo usa `face-api.js` para detectar vários rostos e desenhar rótulos visuais sobre cada
              pessoa em cena.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-sky-200 bg-sky-100 text-sky-700">
              <ScanFace className="mr-1 h-3.5 w-3.5" />
              face-api.js
            </Badge>
            <Badge className="border-slate-200 bg-white text-slate-700">
              {lastDetectedCount} rosto(s)
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          {statusMessage}
          {schoolName ? ` Contexto: ${schoolName}.` : ''}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">1. Abrir câmera</p>
            <p className="mt-1">Ative a webcam do dispositivo para iniciar o teste.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">2. Posicionar pessoas</p>
            <p className="mt-1">Coloque mais de um rosto no quadro para validar o reconhecimento múltiplo.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">3. Ver os rótulos</p>
            <p className="mt-1">Cada rosto recebe um identificador visual e, quando possível, um nome.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
          <div className="relative aspect-video w-full bg-slate-950">
            <video
              ref={videoRef}
              muted
              playsInline
              className={cn(
                'absolute inset-0 h-full w-full object-contain scale-x-[-1]',
                cameraActive ? 'opacity-100' : 'opacity-0'
              )}
            />
            <canvas
              ref={canvasRef}
              className={cn(
                'absolute inset-0 h-full w-full pointer-events-none scale-x-[-1]',
                cameraActive ? 'opacity-100' : 'opacity-0'
              )}
            />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-slate-100">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                  {cameraLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {cameraLoading
                      ? 'Preparando a câmera para o teste multi-rosto...'
                      : 'Abra a câmera para detectar e rotular vários rostos ao mesmo tempo.'}
                  </p>
                  <p className="text-xs text-slate-300">
                    O overlay mostra caixas visuais, nomes reconhecidos e status de correspondência.
                  </p>
                </div>
              </div>
            )}

            {cameraActive && analyzing && (
              <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-slate-950/75 px-3 py-1 text-xs font-medium text-white">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analisando rostos...
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {!cameraActive ? (
            <Button type="button" onClick={startCamera} disabled={cameraLoading}>
              {cameraLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
              Iniciar teste ao vivo
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={stopCamera}>
              <CameraOff className="mr-2 h-4 w-4" />
              Parar câmera
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null);
              setFaces([]);
              setLastDetectedCount(0);
              setStatusMessage('Teste reiniciado. Abra a câmera novamente para continuar.');
              clearOverlay();
            }}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reiniciar teste
          </Button>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Motor</p>
            <p className="mt-1 font-medium text-slate-900">{lastModelName}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Reconhecidos</p>
            <p className="mt-1 font-medium text-slate-900">
              {faces.filter((face) => face.matchStatus === 'MATCHED').length} rosto(s)
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Revisão</p>
            <p className="mt-1 font-medium text-slate-900">
              {faces.filter((face) => face.matchStatus === 'REVIEW_REQUIRED').length} rosto(s)
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {faces.length > 0 ? (
            faces.map((face) => {
              const tone = getStatusTone(face.matchStatus);

              return (
                <div key={`${face.faceIndex}-${face.box.x}-${face.box.y}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn('rounded-2xl border px-3 py-3', tone.border, tone.fill, tone.text)}>
                        <BadgeCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{face.label}</p>
                        <p className="text-sm text-slate-600">
                          {face.matchStatus === 'MATCHED'
                            ? 'Reconhecimento confirmado'
                            : face.matchStatus === 'REVIEW_REQUIRED'
                              ? 'Correspondência em revisão'
                              : 'Sem correspondência'}
                        </p>
                      </div>
                    </div>

                    <Badge className={tone.chip}>
                      Confiança {Math.round(face.confidence * 100)}%
                    </Badge>
                  </div>

                  {face.reviewReason && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {face.reviewReason}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
              <ShieldAlert className="mx-auto mb-2 h-5 w-5 text-slate-400" />
              Nenhum rosto analisado ainda.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FaceMultiFaceTestPanel;
