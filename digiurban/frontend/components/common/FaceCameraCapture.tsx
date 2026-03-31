'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  Camera,
  CameraOff,
  Loader2,
  RefreshCcw,
  ScanFace,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MEDIAPIPE_VERSION = '0.10.34';
const MEDIAPIPE_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const FACE_MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const ALIGN_DURATION_MS = 900;
const MOVE_DURATION_MS = 650;
const HOLD_DURATION_MS = 1400;
const TARGET_CENTER_X = 0.5;
const TARGET_CENTER_Y = 0.47;

type SessionStep = 'align' | 'move_closer' | 'move_away' | 'hold_still' | 'completed';
type FeedbackTone = 'neutral' | 'warning' | 'success';

interface FacePoint {
  x: number;
  y: number;
  z?: number;
}

interface FaceMetrics {
  centerOffsetX: number;
  centerOffsetY: number;
  sizeRatio: number;
  widthRatio: number;
  heightRatio: number;
  yawScore: number;
}

interface FaceLandmarkerInstance {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number
  ) => {
    faceLandmarks?: FacePoint[][];
  };
}

interface ChallengeState {
  completedSteps: SessionStep[];
  maxSizeRatio: number;
  stableMs: number;
  faceDetections: number;
}

export interface FaceCaptureSessionMetadata {
  captureMode: 'LIVE_GUIDED_VIDEO';
  sessionId: string;
  completedAt: string;
  qualityScore: number;
  livenessScore: number;
  completedSteps: SessionStep[];
  modelProvider: string;
  metrics: {
    centerOffsetX: number;
    centerOffsetY: number;
    sizeRatio: number;
    yawScore: number;
    stabilityScore: number;
  };
  hints: string[];
}

interface FaceCameraCaptureProps {
  value: string;
  onChange: (value: string) => void;
  onMetadataChange?: (metadata: FaceCaptureSessionMetadata | null) => void;
  disabled?: boolean;
  className?: string;
}

let faceLandmarkerPromise: Promise<FaceLandmarkerInstance> | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundScore(value: number) {
  return Math.round(value * 1000) / 1000;
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `face-session-${Date.now()}`;
}

async function createFaceLandmarker(delegate: 'GPU' | 'CPU'): Promise<FaceLandmarkerInstance> {
  const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);

  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: FACE_MODEL_ASSET_URL,
      delegate,
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
  }) as Promise<FaceLandmarkerInstance>;
}

async function getFaceLandmarker() {
  if (!faceLandmarkerPromise) {
    faceLandmarkerPromise = (async () => {
      try {
        return await createFaceLandmarker('GPU');
      } catch (error) {
        console.warn('Falha ao iniciar MediaPipe com GPU; usando CPU.', error);
        return createFaceLandmarker('CPU');
      }
    })();
  }

  return faceLandmarkerPromise;
}

function getFaceMetrics(landmarks: FacePoint[]): FaceMetrics | null {
  if (!landmarks.length) {
    return null;
  }

  const leftEyeOuter = landmarks[33];
  const rightEyeOuter = landmarks[263];
  const noseTip = landmarks[1];

  if (!leftEyeOuter || !rightEyeOuter || !noseTip) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of landmarks) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  const widthRatio = Math.max(maxX - minX, 0);
  const heightRatio = Math.max(maxY - minY, 0);
  const centerX = minX + widthRatio / 2;
  const centerY = minY + heightRatio / 2;
  const sizeRatio = Math.max(widthRatio, heightRatio);
  const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const yawScore = clamp((noseTip.x - eyeMidX) / Math.max(widthRatio, 0.001), -1, 1);

  return {
    centerOffsetX: centerX - TARGET_CENTER_X,
    centerOffsetY: centerY - TARGET_CENTER_Y,
    sizeRatio,
    widthRatio,
    heightRatio,
    yawScore,
  };
}

function isCentered(metrics: FaceMetrics) {
  return Math.abs(metrics.centerOffsetX) <= 0.09 && Math.abs(metrics.centerOffsetY) <= 0.11;
}

function isStable(
  metrics: FaceMetrics,
  previousMetrics: FaceMetrics | null
) {
  if (!previousMetrics) {
    return false;
  }

  const variation =
    Math.abs(metrics.centerOffsetX - previousMetrics.centerOffsetX) +
    Math.abs(metrics.centerOffsetY - previousMetrics.centerOffsetY) +
    Math.abs(metrics.sizeRatio - previousMetrics.sizeRatio);

  return variation <= 0.03;
}

function buildQualityScore(metrics: FaceMetrics, stabilityScore: number) {
  const centerDistance = Math.sqrt(
    metrics.centerOffsetX * metrics.centerOffsetX + metrics.centerOffsetY * metrics.centerOffsetY
  );
  const centeredScore = 1 - clamp(centerDistance / 0.18, 0, 1);
  const sizeScore = 1 - clamp(Math.abs(metrics.sizeRatio - 0.3) / 0.16, 0, 1);

  return roundScore(centeredScore * 0.45 + sizeScore * 0.35 + stabilityScore * 0.2);
}

function buildLivenessScore(challengeState: ChallengeState, stabilityScore: number) {
  const sawCloser = challengeState.completedSteps.includes('move_closer') ? 0.35 : 0;
  const sawAway = challengeState.completedSteps.includes('move_away') ? 0.35 : 0;
  const seenFramesScore = clamp(challengeState.faceDetections / 30, 0, 1) * 0.1;

  return roundScore(sawCloser + sawAway + stabilityScore * 0.2 + seenFramesScore);
}

function getStepLabel(step: SessionStep) {
  if (step === 'align') return 'Alinhar';
  if (step === 'move_closer') return 'Aproximar';
  if (step === 'move_away') return 'Afastar';
  if (step === 'hold_still') return 'Estabilizar';
  return 'Concluído';
}

function isStepCompleted(currentStep: SessionStep, targetStep: SessionStep) {
  const order: SessionStep[] = ['align', 'move_closer', 'move_away', 'hold_still', 'completed'];
  return order.indexOf(currentStep) > order.indexOf(targetStep);
}

export function FaceCameraCapture({
  value,
  onChange,
  onMetadataChange,
  disabled = false,
  className = '',
}: FaceCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const analysisFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const holdSinceRef = useRef<number | null>(null);
  const previousMetricsRef = useRef<FaceMetrics | null>(null);
  const sessionIdRef = useRef(createSessionId());
  const captureDoneRef = useRef(false);
  const feedbackRef = useRef('');
  const feedbackToneRef = useRef<FeedbackTone>('neutral');
  const sessionStepRef = useRef<SessionStep>('align');
  const challengeStateRef = useRef<ChallengeState>({
    completedSteps: [],
    maxSizeRatio: 0,
    stableMs: 0,
    faceDetections: 0,
  });

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [faceEngineLoading, setFaceEngineLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sessionStep, setSessionStep] = useState<SessionStep>('align');
  const [liveFeedback, setLiveFeedback] = useState('Posicione o rosto dentro da área destacada.');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('neutral');
  const [liveMetrics, setLiveMetrics] = useState<FaceMetrics | null>(null);
  const [captureSummary, setCaptureSummary] = useState<FaceCaptureSessionMetadata | null>(null);

  const syncFeedback = (message: string, tone: FeedbackTone) => {
    if (feedbackRef.current !== message) {
      feedbackRef.current = message;
      setLiveFeedback(message);
    }

    if (feedbackToneRef.current !== tone) {
      feedbackToneRef.current = tone;
      setFeedbackTone(tone);
    }
  };

  const resetChallengeState = () => {
    holdSinceRef.current = null;
    previousMetricsRef.current = null;
    captureDoneRef.current = false;
    lastVideoTimeRef.current = -1;
    sessionIdRef.current = createSessionId();
    challengeStateRef.current = {
      completedSteps: [],
      maxSizeRatio: 0,
      stableMs: 0,
      faceDetections: 0,
    };
    sessionStepRef.current = 'align';
    setSessionStep('align');
    setLiveMetrics(null);
    setCaptureSummary(null);
    syncFeedback('Posicione o rosto dentro da área destacada.', 'neutral');
  };

  const stopAnalysisLoop = () => {
    if (analysisFrameRef.current !== null) {
      cancelAnimationFrame(analysisFrameRef.current);
      analysisFrameRef.current = null;
    }
  };

  const stopCamera = () => {
    stopAnalysisLoop();

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

  useEffect(() => {
    sessionStepRef.current = sessionStep;
  }, [sessionStep]);

  useEffect(() => {
    if (!value) {
      setCaptureSummary(null);
    }
  }, [value]);

  const markStepCompleted = (step: SessionStep) => {
    if (!challengeStateRef.current.completedSteps.includes(step)) {
      challengeStateRef.current.completedSteps = [...challengeStateRef.current.completedSteps, step];
    }
  };

  const updateSessionStep = (nextStep: SessionStep) => {
    if (sessionStepRef.current !== nextStep) {
      sessionStepRef.current = nextStep;
      setSessionStep(nextStep);
    }
    holdSinceRef.current = null;
  };

  const clearCapture = () => {
    onChange('');
    onMetadataChange?.(null);
    setCameraError(null);
    resetChallengeState();
  };

  const finalizeCapture = (metrics: FaceMetrics) => {
    if (captureDoneRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('Não foi possível processar a validação facial ao vivo.');
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const stabilityScore = clamp(challengeStateRef.current.stableMs / HOLD_DURATION_MS, 0, 1);
    const qualityScore = buildQualityScore(metrics, stabilityScore);
    const livenessScore = buildLivenessScore(challengeStateRef.current, stabilityScore);

    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    const metadata: FaceCaptureSessionMetadata = {
      captureMode: 'LIVE_GUIDED_VIDEO',
      sessionId: sessionIdRef.current,
      completedAt: new Date().toISOString(),
      qualityScore,
      livenessScore,
      completedSteps: [...challengeStateRef.current.completedSteps, 'hold_still'],
      modelProvider: 'mediapipe-face-landmarker',
      metrics: {
        centerOffsetX: roundScore(metrics.centerOffsetX),
        centerOffsetY: roundScore(metrics.centerOffsetY),
        sizeRatio: roundScore(metrics.sizeRatio),
        yawScore: roundScore(metrics.yawScore),
        stabilityScore: roundScore(stabilityScore),
      },
      hints: ['video-ao-vivo', 'aproximacao-guiada', 'afastamento-guiado', 'captura-automatica'],
    };

    captureDoneRef.current = true;
    onChange(canvas.toDataURL('image/jpeg', 0.94));
    onMetadataChange?.(metadata);
    setCaptureSummary(metadata);
    markStepCompleted('hold_still');
    updateSessionStep('completed');
    syncFeedback('Sessão ao vivo concluída. O melhor quadro facial foi selecionado automaticamente.', 'success');
    stopCamera();
  };

  const evaluateFaceSession = (metrics: FaceMetrics, timestamp: number) => {
    const challengeState = challengeStateRef.current;
    const centered = isCentered(metrics);
    const stable = isStable(metrics, previousMetricsRef.current);

    challengeState.faceDetections += 1;
    challengeState.maxSizeRatio = Math.max(challengeState.maxSizeRatio, metrics.sizeRatio);
    setLiveMetrics(metrics);

    if (!centered) {
      holdSinceRef.current = null;
      previousMetricsRef.current = metrics;
      syncFeedback('Centralize o rosto dentro da moldura animada.', 'warning');
      return;
    }

    if (sessionStepRef.current === 'align') {
      if (metrics.sizeRatio < 0.24) {
        holdSinceRef.current = null;
        syncFeedback('Aproxime o rosto até preencher melhor a área destacada.', 'warning');
      } else if (metrics.sizeRatio > 0.42) {
        holdSinceRef.current = null;
        syncFeedback('Afaste o rosto um pouco para caber melhor na moldura.', 'warning');
      } else {
        if (holdSinceRef.current === null) {
          holdSinceRef.current = timestamp;
        }

        const elapsed = timestamp - holdSinceRef.current;
        syncFeedback(
          elapsed >= ALIGN_DURATION_MS
            ? 'Alinhamento confirmado. Agora aproxime o rosto.'
            : 'Ótimo. Mantenha o rosto centralizado por um instante.',
          'neutral'
        );

        if (elapsed >= ALIGN_DURATION_MS) {
          markStepCompleted('align');
          updateSessionStep('move_closer');
        }
      }

      previousMetricsRef.current = metrics;
      return;
    }

    if (sessionStepRef.current === 'move_closer') {
      if (metrics.sizeRatio < 0.38) {
        holdSinceRef.current = null;
        syncFeedback('Aproxime o rosto até quase tocar a moldura interna.', 'warning');
      } else {
        if (holdSinceRef.current === null) {
          holdSinceRef.current = timestamp;
        }

        syncFeedback('Perfeito. Segure mais um instante e em seguida afaste o rosto.', 'neutral');

        if (timestamp - holdSinceRef.current >= MOVE_DURATION_MS) {
          markStepCompleted('move_closer');
          updateSessionStep('move_away');
          syncFeedback('Agora afaste o rosto até ele voltar a caber confortavelmente na área.', 'warning');
        }
      }

      previousMetricsRef.current = metrics;
      return;
    }

    if (sessionStepRef.current === 'move_away') {
      const movedAwayEnough = challengeState.maxSizeRatio - metrics.sizeRatio >= 0.08;

      if (!movedAwayEnough || metrics.sizeRatio > 0.34) {
        holdSinceRef.current = null;
        syncFeedback('Afaste o rosto um pouco mais para concluir a prova de presença.', 'warning');
      } else if (metrics.sizeRatio < 0.21) {
        holdSinceRef.current = null;
        syncFeedback('Aproxime levemente o rosto para voltar à área ideal.', 'warning');
      } else {
        if (holdSinceRef.current === null) {
          holdSinceRef.current = timestamp;
        }

        syncFeedback('Movimento confirmado. Agora fique estável para concluir.', 'neutral');

        if (timestamp - holdSinceRef.current >= MOVE_DURATION_MS) {
          markStepCompleted('move_away');
          updateSessionStep('hold_still');
        }
      }

      previousMetricsRef.current = metrics;
      return;
    }

    if (sessionStepRef.current === 'hold_still') {
      if (metrics.sizeRatio < 0.22) {
        holdSinceRef.current = null;
        challengeState.stableMs = 0;
        syncFeedback('Aproxime um pouco o rosto para finalizar a validação ao vivo.', 'warning');
      } else if (metrics.sizeRatio > 0.36) {
        holdSinceRef.current = null;
        challengeState.stableMs = 0;
        syncFeedback('Afaste levemente o rosto e mantenha-se imóvel.', 'warning');
      } else if (!stable) {
        holdSinceRef.current = null;
        challengeState.stableMs = 0;
        syncFeedback('Mantenha o rosto parado por um instante para capturarmos o melhor quadro.', 'warning');
      } else {
        if (holdSinceRef.current === null) {
          holdSinceRef.current = timestamp;
        }

        challengeState.stableMs = timestamp - holdSinceRef.current;
        syncFeedback('Excelente. Validando presença e selecionando o melhor quadro facial...', 'success');

        if (challengeState.stableMs >= HOLD_DURATION_MS) {
          finalizeCapture(metrics);
          return;
        }
      }
    }

    previousMetricsRef.current = metrics;
  };

  const startCamera = async () => {
    if (disabled) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Este dispositivo não oferece suporte à câmera pelo navegador.');
      return;
    }

    try {
      setCameraLoading(true);
      setFaceEngineLoading(true);
      setCameraError(null);
      stopCamera();
      resetChallengeState();
      onChange('');
      onMetadataChange?.(null);

      const [landmarker, stream] = await Promise.all([
        getFaceLandmarker(),
        navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        }),
      ]);

      landmarkerRef.current = landmarker;
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }

      setCameraActive(true);
      syncFeedback('Centralize o rosto dentro da área destacada para iniciar.', 'neutral');
    } catch (error) {
      console.error('Erro ao iniciar a validação facial ao vivo:', error);
      setCameraError('Não foi possível iniciar a câmera ao vivo. Verifique a permissão do navegador.');
      stopCamera();
    } finally {
      setCameraLoading(false);
      setFaceEngineLoading(false);
    }
  };

  useEffect(() => {
    if (!cameraActive) {
      stopAnalysisLoop();
      return;
    }

    const analyze = () => {
      if (!cameraActive || captureDoneRef.current) {
        return;
      }

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (video && landmarker && video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        const result = landmarker.detectForVideo(video, performance.now());
        const landmarks = result.faceLandmarks?.[0];

        if (!landmarks?.length) {
          holdSinceRef.current = null;
          previousMetricsRef.current = null;
          challengeStateRef.current.stableMs = 0;
          setLiveMetrics(null);
          syncFeedback('Posicione o rosto dentro da área destacada para continuar.', 'warning');
        } else {
          const metrics = getFaceMetrics(landmarks);
          if (metrics) {
            evaluateFaceSession(metrics, performance.now());
          }
        }
      }

      analysisFrameRef.current = requestAnimationFrame(analyze);
    };

    analysisFrameRef.current = requestAnimationFrame(analyze);

    return () => {
      stopAnalysisLoop();
    };
  }, [cameraActive]);

  const feedbackToneClass =
    feedbackTone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : feedbackTone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-sky-200 bg-sky-50 text-sky-700';

  const guideScaleClass =
    sessionStep === 'move_closer'
      ? 'scale-[0.92]'
      : sessionStep === 'move_away'
        ? 'scale-[1.05]'
        : 'scale-100';

  const completedAlign = isStepCompleted(sessionStep, 'align');
  const completedCloser = isStepCompleted(sessionStep, 'move_closer');
  const completedAway = isStepCompleted(sessionStep, 'move_away');
  const completedHold = sessionStep === 'completed';

  return (
    <div className={cn('space-y-4', className)}>
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950">
        {value && !cameraActive ? (
          <div className="relative">
            <img
              src={value}
              alt="Quadro facial validado"
              className="h-80 w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent p-4 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-emerald-400/40 bg-emerald-500/20 text-emerald-50">
                  <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                  Sessão ao vivo validada
                </Badge>
                {captureSummary && (
                  <>
                    <Badge className="border-white/20 bg-white/10 text-white">
                      Qualidade {Math.round(captureSummary.qualityScore * 100)}%
                    </Badge>
                    <Badge className="border-white/20 bg-white/10 text-white">
                      Presença {Math.round(captureSummary.livenessScore * 100)}%
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-80 w-full">
            <video
              ref={videoRef}
              muted
              playsInline
              className={cn(
                'h-full w-full object-cover transition-opacity duration-300',
                cameraActive ? 'scale-x-[-1] opacity-100' : 'opacity-0'
              )}
            />

            {cameraActive ? (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_27%,rgba(2,6,23,0.72)_28%)]" />
                <div
                  className={cn(
                    'absolute left-1/2 top-1/2 h-[70%] w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-[46%] border-2 border-cyan-300/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.32)] transition-transform duration-300',
                    guideScaleClass,
                    feedbackTone === 'success' ? 'border-emerald-300' : '',
                    feedbackTone === 'warning' ? 'border-amber-300' : ''
                  )}
                >
                  <div className="absolute inset-[12%] rounded-[42%] border border-white/20" />
                  <div className="absolute inset-x-[20%] top-[18%] h-[2px] rounded-full bg-cyan-200/80 blur-sm animate-pulse" />
                  <div className="absolute inset-x-[20%] bottom-[18%] h-[2px] rounded-full bg-cyan-200/45 blur-sm animate-pulse" />
                </div>
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <Badge className="border-white/15 bg-slate-950/75 text-white">
                    <ScanFace className="mr-1 h-3.5 w-3.5" />
                    Vídeo ao vivo
                  </Badge>
                  <Badge className="border-white/15 bg-slate-950/75 text-white">
                    Etapa: {getStepLabel(sessionStep)}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-slate-100">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Validação facial por vídeo ao vivo com orientação de aproximação e afastamento.
                  </p>
                  <p className="text-xs text-slate-300">
                    O quadro é selecionado automaticamente depois que o rosto estiver centralizado,
                    na distância correta e estável.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={cn('rounded-2xl border px-4 py-3 text-sm', feedbackToneClass)}>
        {faceEngineLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando o motor de validação facial ao vivo...
          </span>
        ) : (
          liveFeedback
        )}
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        {(['align', 'move_closer', 'move_away', 'hold_still'] as const).map((stepKey) => {
          const done =
            stepKey === 'align'
              ? completedAlign
              : stepKey === 'move_closer'
                ? completedCloser
                : stepKey === 'move_away'
                  ? completedAway
                  : completedHold;

          const active = sessionStep === stepKey;

          return (
            <div
              key={stepKey}
              className={cn(
                'rounded-2xl border px-3 py-3 text-sm transition-colors',
                done
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : active
                    ? 'border-sky-200 bg-sky-50 text-sky-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
              )}
            >
              <div className="flex items-center gap-2">
                {done ? (
                  <BadgeCheck className="h-4 w-4" />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">
                    {stepKey === 'align' ? '1' : stepKey === 'move_closer' ? '2' : stepKey === 'move_away' ? '3' : '4'}
                  </span>
                )}
                <span className="font-medium">{getStepLabel(stepKey)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {cameraActive && liveMetrics && (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Centralização</p>
            <p className="mt-1 text-sm text-slate-800">
              {Math.round(Math.abs(liveMetrics.centerOffsetX) * 100)}% horizontal e{' '}
              {Math.round(Math.abs(liveMetrics.centerOffsetY) * 100)}% vertical fora do centro.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Distância</p>
            <p className="mt-1 text-sm text-slate-800">
              O rosto ocupa {Math.round(liveMetrics.sizeRatio * 100)}% da área útil analisada.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Sessão</p>
            <p className="mt-1 text-sm text-slate-800">
              {challengeStateRef.current.faceDetections} leituras faciais processadas em vídeo ao vivo.
            </p>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
            Iniciar validação ao vivo
          </Button>
        )}

        {cameraActive && (
          <Button type="button" variant="outline" onClick={stopCamera} disabled={disabled}>
            <CameraOff className="mr-2 h-4 w-4" />
            Interromper sessão
          </Button>
        )}

        {value && !cameraActive && (
          <>
            <Button type="button" variant="outline" onClick={startCamera} disabled={disabled || cameraLoading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refazer validação ao vivo
            </Button>
            <Button type="button" variant="ghost" onClick={clearCapture} disabled={disabled}>
              Limpar biometria
            </Button>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default FaceCameraCapture;
