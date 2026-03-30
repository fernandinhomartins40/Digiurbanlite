'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Loader2, RefreshCcw, ScanFace } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FaceCameraCaptureProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function FaceCameraCapture({
  value,
  onChange,
  disabled = false,
  className = '',
}: FaceCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (disabled) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Este dispositivo não oferece suporte ao acesso da câmera pelo navegador.');
      return;
    }

    try {
      setCameraLoading(true);
      setCameraError(null);
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
    } catch (error) {
      console.error('Erro ao iniciar câmera facial:', error);
      setCameraError('Não foi possível acessar a câmera. Verifique a permissão do navegador.');
      stopCamera();
    } finally {
      setCameraLoading(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const context = canvas.getContext('2d');

    if (!context) {
      setCameraError('Não foi possível processar a captura facial.');
      return;
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);
    onChange(canvas.toDataURL('image/jpeg', 0.92));
    stopCamera();
  };

  const clearCapture = () => {
    onChange('');
    setCameraError(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
        {value ? (
          <img
            src={value}
            alt="Captura facial"
            className="h-72 w-full object-cover"
          />
        ) : (
          <div className="relative h-72 w-full">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`h-full w-full object-cover ${cameraActive ? 'scale-x-[-1]' : 'hidden'}`}
            />
            {!cameraActive && (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-slate-100">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                  <ScanFace className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Centralize o rosto e mantenha boa iluminação.</p>
                  <p className="text-xs text-slate-300">
                    A imagem será usada para o cadastro biométrico facial do cidadão.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {cameraError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {cameraError}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {!cameraActive && (
          <Button type="button" variant="outline" onClick={startCamera} disabled={disabled || cameraLoading}>
            {cameraLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            Ativar câmera
          </Button>
        )}

        {cameraActive && (
          <>
            <Button type="button" onClick={capturePhoto} disabled={disabled}>
              <Camera className="mr-2 h-4 w-4" />
              Capturar rosto
            </Button>
            <Button type="button" variant="outline" onClick={stopCamera} disabled={disabled}>
              <CameraOff className="mr-2 h-4 w-4" />
              Fechar câmera
            </Button>
          </>
        )}

        {value && !cameraActive && (
          <>
            <Button type="button" variant="outline" onClick={startCamera} disabled={disabled || cameraLoading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Capturar novamente
            </Button>
            <Button type="button" variant="ghost" onClick={clearCapture} disabled={disabled}>
              Limpar imagem
            </Button>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default FaceCameraCapture;
