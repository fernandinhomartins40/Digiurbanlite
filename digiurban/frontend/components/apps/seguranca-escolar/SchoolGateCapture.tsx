'use client';

/**
 * Portaria da escola: a câmera manda UMA foto por vez (no clique ou no modo
 * automático) e o servidor reconhece cada rosto e registra a passagem.
 * Nada de reconhecimento no navegador: antes esta tela baixava as assinaturas
 * faciais de todos os cidadãos e comparava aqui.
 */

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Loader2, ScanFace } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import facePlatformService from '@/lib/services/face-platform.service';

interface SchoolGateCaptureProps {
  deviceId: string;
  zoneId?: string;
  eventType: 'ENTRY' | 'EXIT' | 'DETECTION';
  disabled?: boolean;
  onRegistered?: () => void;
}

const AUTO_INTERVAL_MS = 4000;
const FRAME_MAX_WIDTH = 960;

function statusLabel(status: string) {
  if (status === 'MATCHED') return 'Reconhecido';
  if (status === 'REVIEW_REQUIRED') return 'Conferir';
  return 'Não reconhecido';
}

function statusClass(status: string) {
  if (status === 'MATCHED') return 'border-emerald-200 bg-emerald-100 text-emerald-800';
  if (status === 'REVIEW_REQUIRED') return 'border-amber-200 bg-amber-100 text-amber-800';
  return 'border-slate-200 bg-slate-100 text-slate-700';
}

export function SchoolGateCapture({ deviceId, zoneId, eventType, disabled = false, onRegistered }: SchoolGateCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ at: Date; facesDetected: number; events: Array<{ duplicate: boolean; event: any }> } | null>(null);

  const stopCamera = () => {
    setAuto(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraOn(true);
    } catch {
      setError('Não foi possível abrir a câmera. Verifique a permissão do navegador.');
    }
  };

  const captureAndSend = async () => {
    if (busyRef.current || !videoRef.current || !canvasRef.current || !deviceId) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context || !video.videoWidth) return;

    busyRef.current = true;
    setBusy(true);
    try {
      const scale = Math.min(1, FRAME_MAX_WIDTH / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = canvas.toDataURL('image/jpeg', 0.88);

      const result = await facePlatformService.ingestFrame({ deviceId, zoneId: zoneId || undefined, eventType, frame });
      setLastResult({ at: new Date(), ...result });
      setError(null);
      if (result.events.some((item) => !item.duplicate)) onRegistered?.();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível registrar agora.');
      setAuto(false);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!auto || !cameraOn) return;
    const timer = setInterval(() => void captureAndSend(), AUTO_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, cameraOn, deviceId, zoneId, eventType]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
        <video ref={videoRef} muted playsInline className={`aspect-video w-full object-cover ${cameraOn ? '' : 'hidden'}`} />
        {!cameraOn && (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 text-center text-sm text-slate-200">
            <ScanFace className="h-8 w-8" />
            Abra a câmera da portaria. Cada foto é conferida no servidor.
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!cameraOn ? (
          <Button type="button" onClick={startCamera} disabled={disabled || !deviceId}>
            <Camera className="mr-2 h-4 w-4" />
            Abrir câmera
          </Button>
        ) : (
          <>
            <Button type="button" onClick={() => void captureAndSend()} disabled={disabled || busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanFace className="mr-2 h-4 w-4" />}
              Registrar passagem agora
            </Button>
            <Button type="button" variant={auto ? 'default' : 'outline'} onClick={() => setAuto((value) => !value)} disabled={disabled}>
              {auto ? 'Parar modo automático' : 'Modo automático (a cada 4 s)'}
            </Button>
            <Button type="button" variant="ghost" onClick={stopCamera}>
              <CameraOff className="mr-2 h-4 w-4" />
              Fechar câmera
            </Button>
          </>
        )}
      </div>

      {!deviceId && <p className="text-sm text-amber-700">Escolha a câmera (dispositivo) da portaria antes de abrir.</p>}

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      {lastResult && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
          <p className="font-medium text-slate-900">
            Última leitura às {lastResult.at.toLocaleTimeString('pt-BR')} — {lastResult.facesDetected} rosto(s)
          </p>
          {lastResult.events.length === 0 ? (
            <p className="mt-1">Nenhum rosto encontrado na foto.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {lastResult.events.map(({ duplicate, event }) => (
                <li key={event.id} className="flex flex-wrap items-center gap-2">
                  <Badge className={statusClass(event.matchStatus)}>{statusLabel(event.matchStatus)}</Badge>
                  <span>{event.citizen?.name || 'Pessoa não identificada'}</span>
                  {duplicate && <span className="text-xs text-slate-500">(já registrado há pouco)</span>}
                  {event.spoofSuspect && <span className="text-xs text-amber-700">(possível foto ou tela)</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default SchoolGateCapture;
