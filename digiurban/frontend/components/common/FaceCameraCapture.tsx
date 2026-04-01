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

const ALIGN_DURATION_MS = 300;
const HOLD_DURATION_MS = 650;
const TARGET_CENTER_X = 0.5;
const TARGET_CENTER_Y = 0.47;

type SessionStep = 'align' | 'hold_still' | 'completed';
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
  stableMs: number;
  faceDetections: number;
  minYawScore: number;
  maxYawScore: number;
  minSizeRatio: number;
  maxSizeRatio: number;
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
  startLabel?: string;
  retryLabel?: string;
  cancelLabel?: string;
  showDetailedStatus?: boolean;
}

let faceLandmarkerPromise: Promise<FaceLandmarkerInstance> | null = null;
const GUIDE_STEPS: Exclude<SessionStep, 'completed'>[] = ['align', 'hold_still'];

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
  const seenFramesScore = clamp(challengeState.faceDetections / 26, 0, 1) * 0.35;
  const yawVariation = Math.abs(challengeState.maxYawScore - challengeState.minYawScore);
  const sizeVariation = Math.abs(challengeState.maxSizeRatio - challengeState.minSizeRatio);
  const subtleMotionScore = clamp(yawVariation * 2.4 + sizeVariation * 1.8, 0, 1) * 0.25;
  const stabilityContribution = stabilityScore * 0.25;
  const sustainedSessionScore = clamp(challengeState.stableMs / HOLD_DURATION_MS, 0, 1) * 0.15;

  return roundScore(
    clamp(seenFramesScore + subtleMotionScore + stabilityContribution + sustainedSessionScore, 0, 1)
  );
}

function getStepLabel(step: SessionStep) {
  if (step === 'align') return 'Enquadrar';
  if (step === 'hold_still') return 'Confirmar';
  return 'Concluído';
}

function isStepCompleted(currentStep: SessionStep, targetStep: SessionStep) {
  const order: SessionStep[] = ['align', 'hold_still', 'completed'];
  return order.indexOf(currentStep) > order.indexOf(targetStep);
}

export function FaceCameraCapture({
  value,
  onChange,
  onMetadataChange,
  disabled = false,
  className = '',
  startLabel = 'Iniciar validação ao vivo',
  retryLabel = 'Refazer validação ao vivo',
  cancelLabel = 'Interromper sessão',
  showDetailedStatus = true,
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
    stableMs: 0,
    faceDetections: 0,
    minYawScore: 1,
    maxYawScore: -1,
    minSizeRatio: 1,
    maxSizeRatio: 0,
  });

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [faceEngineLoading, setFaceEngineLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sessionStep, setSessionStep] = useState<SessionStep>('align');
  const [liveFeedback, setLiveFeedback] = useState('Centralize o rosto no oval.');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('neutral');
  const [liveMetrics, setLiveMetrics] = useState<FaceMetrics | null>(null);
  const [captureSummary, setCaptureSummary] = useState<FaceCaptureSessionMetadata | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

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
      stableMs: 0,
      faceDetections: 0,
      minYawScore: 1,
      maxYawScore: -1,
      minSizeRatio: 1,
      maxSizeRatio: 0,
    };
    sessionStepRef.current = 'align';
    setSessionStep('align');
    setLiveMetrics(null);
    setCaptureSummary(null);
    syncFeedback('Centralize o rosto no oval.', 'neutral');
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
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const syncViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    syncViewport();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncViewport);

      return () => {
        mediaQuery.removeEventListener('change', syncViewport);
      };
    }

    mediaQuery.addListener(syncViewport);

    return () => {
      mediaQuery.removeListener(syncViewport);
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
      hints: ['video-ao-vivo', 'moldura-oval', 'captura-automatica', 'validacao-estavel'],
    };

    captureDoneRef.current = true;
    onChange(canvas.toDataURL('image/jpeg', 0.94));
    onMetadataChange?.(metadata);
    setCaptureSummary(metadata);
    markStepCompleted('hold_still');
    updateSessionStep('completed');
    syncFeedback('Sessão concluída. O melhor quadro facial foi selecionado automaticamente.', 'success');
    stopCamera();
  };

  const evaluateFaceSession = (metrics: FaceMetrics, timestamp: number) => {
    const challengeState = challengeStateRef.current;
    const centered = isCentered(metrics);
    const stable = isStable(metrics, previousMetricsRef.current);

    challengeState.faceDetections += 1;
    challengeState.minYawScore = Math.min(challengeState.minYawScore, metrics.yawScore);
    challengeState.maxYawScore = Math.max(challengeState.maxYawScore, metrics.yawScore);
    challengeState.minSizeRatio = Math.min(challengeState.minSizeRatio, metrics.sizeRatio);
    challengeState.maxSizeRatio = Math.max(challengeState.maxSizeRatio, metrics.sizeRatio);
    setLiveMetrics(metrics);

    if (!centered) {
      holdSinceRef.current = null;
      challengeState.stableMs = 0;
      previousMetricsRef.current = metrics;
      syncFeedback('Centralize o rosto no oval.', 'warning');
      return;
    }

    const outsideOptimalFrame = metrics.sizeRatio < 0.24 || metrics.sizeRatio > 0.4;
    const lookingAway = Math.abs(metrics.yawScore) > 0.18;

    if (outsideOptimalFrame) {
      holdSinceRef.current = null;
      challengeState.stableMs = 0;
      previousMetricsRef.current = metrics;
      syncFeedback('Ajuste o rosto para ocupar melhor o oval central.', 'warning');
      return;
    }

    if (lookingAway) {
      holdSinceRef.current = null;
      challengeState.stableMs = 0;
      previousMetricsRef.current = metrics;
      syncFeedback('Olhe de frente para a câmera.', 'warning');
      return;
    }

    if (sessionStepRef.current === 'align') {
      if (holdSinceRef.current === null) {
        holdSinceRef.current = timestamp;
      }

      const elapsed = timestamp - holdSinceRef.current;
      syncFeedback(
        elapsed >= ALIGN_DURATION_MS
          ? 'Enquadramento confirmado. Capturando automaticamente...'
          : 'Ótimo. Mantenha o rosto centralizado.',
        'neutral'
      );

      if (elapsed >= ALIGN_DURATION_MS) {
        markStepCompleted('align');
        updateSessionStep('hold_still');
      }

      previousMetricsRef.current = metrics;
      return;
    }

    if (!stable) {
      holdSinceRef.current = null;
      challengeState.stableMs = 0;
      previousMetricsRef.current = metrics;
      syncFeedback('Mantenha o rosto estável por um instante.', 'warning');
      return;
    }

    if (holdSinceRef.current === null) {
      holdSinceRef.current = timestamp;
    }

    challengeState.stableMs = timestamp - holdSinceRef.current;
    syncFeedback('Capturando automaticamente o melhor quadro facial...', 'success');

    if (challengeState.stableMs >= HOLD_DURATION_MS) {
      finalizeCapture(metrics);
      return;
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
      syncFeedback('Centralize o rosto no oval para iniciar.', 'neutral');
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
          syncFeedback('Ajuste o rosto para continuar a captura.', 'warning');
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

  const completedAlign = isStepCompleted(sessionStep, 'align');
  const completedHold = sessionStep === 'completed';
  const isMobileFullScreen = isMobileViewport && (cameraActive || cameraLoading || faceEngineLoading);
  const stepItems = GUIDE_STEPS.map((stepKey) => {
    return {
      stepKey,
      done: stepKey === 'align' ? completedAlign : completedHold,
      active: sessionStep === stepKey,
      label: getStepLabel(stepKey),
    };
  });

  useEffect(() => {
    if (!isMobileFullScreen || typeof document === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileFullScreen]);

  return (
    <div className={cn('space-y-4', className, isMobileFullScreen && 'relative z-[80]')}>
      <div
        className={cn(
          'overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950',
          isMobileFullScreen && 'fixed inset-0 z-[80] rounded-none border-0'
        )}
      >
        {value && !cameraActive && !cameraLoading && !faceEngineLoading ? (
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
          <div
            className={cn(
              'relative w-full overflow-hidden bg-slate-950',
              isMobileFullScreen ? 'h-[100dvh]' : 'h-80'
            )}
          >
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
                <div className="absolute inset-0 bg-slate-950/42" />
                <div
                  className={cn(
                    'pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[999px] border-2 border-cyan-300/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.45)] transition-transform duration-300',
                    isMobileFullScreen
                      ? 'h-[72dvh] w-[86vw] max-w-[34rem]'
                      : 'h-[78%] w-[72%] max-w-[30rem] sm:w-[64%] md:w-[56%] lg:w-[50%]',
                    feedbackTone === 'success' ? 'border-emerald-300' : '',
                    feedbackTone === 'warning' ? 'border-amber-300' : ''
                  )}
                >
                  <div className="absolute inset-[11%] rounded-[999px] border border-white/20" />
                  <div className="absolute inset-x-[20%] top-[18%] h-[2px] rounded-full bg-cyan-200/80 blur-sm animate-pulse" />
                  <div className="absolute inset-x-[20%] bottom-[18%] h-[2px] rounded-full bg-cyan-200/45 blur-sm animate-pulse" />
                </div>
                <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))] text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="border-white/15 bg-slate-950/75 text-white">
                          <ScanFace className="mr-1 h-3.5 w-3.5" />
                          Vídeo ao vivo
                        </Badge>
                        <Badge className="border-white/15 bg-slate-950/75 text-white">
                          Sessão ativa
                        </Badge>
                      </div>
                      {isMobileFullScreen && (
                        <p className="max-w-lg text-sm leading-6 text-slate-100/92">
                          Centralize o rosto no oval e aguarde a captura automática.
                        </p>
                      )}
                    </div>

                    {isMobileFullScreen && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={stopCamera}
                        disabled={disabled}
                        className="border-white/20 bg-slate-950/70 text-white hover:bg-slate-900 hover:text-white"
                      >
                        <CameraOff className="mr-2 h-4 w-4" />
                        {cancelLabel}
                      </Button>
                    )}
                  </div>
                </div>
                {isMobileFullScreen && (
                  <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-24 text-white">
                    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
                      <div
                        className={cn(
                          'rounded-[28px] border px-4 py-4 text-sm shadow-lg backdrop-blur',
                          feedbackTone === 'success'
                            ? 'border-emerald-300/45 bg-emerald-500/15 text-emerald-50'
                            : feedbackTone === 'warning'
                              ? 'border-amber-300/45 bg-amber-500/15 text-amber-50'
                              : 'border-sky-300/45 bg-sky-500/15 text-sky-50'
                        )}
                      >
                        {faceEngineLoading ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando o motor de validação facial ao vivo...
                          </span>
                        ) : (
                          liveFeedback
                        )}
                      </div>

                      {showDetailedStatus && (
                        <div className="grid grid-cols-2 gap-2">
                          {stepItems.map(({ stepKey, done, active, label }, index) => (
                            <div
                              key={stepKey}
                              className={cn(
                                'rounded-2xl border px-3 py-3 text-sm shadow-sm backdrop-blur transition-colors',
                                done
                                  ? 'border-emerald-300/45 bg-emerald-500/12 text-emerald-50'
                                  : active
                                    ? 'border-sky-300/45 bg-sky-500/12 text-sky-50'
                                    : 'border-white/15 bg-white/8 text-slate-200'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {done ? (
                                  <BadgeCheck className="h-4 w-4" />
                                ) : (
                                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">
                                    {index + 1}
                                  </span>
                                )}
                                <span className="font-medium">{label}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-slate-100">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                  {cameraLoading || faceEngineLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-8 w-8" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {cameraLoading || faceEngineLoading
                      ? 'Preparando a câmera ao vivo...'
                      : 'Validação facial por vídeo ao vivo com captura automática.'}
                  </p>
                  <p className="text-xs text-slate-300">
                    {cameraLoading || faceEngineLoading
                      ? 'Quando a câmera abrir em tela cheia, siga os avisos na tela.'
                      : 'O melhor quadro é selecionado automaticamente depois que o rosto estiver centralizado e estável.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!isMobileFullScreen && (showDetailedStatus || cameraActive || cameraLoading || faceEngineLoading || value) && (
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
      )}

      {showDetailedStatus && !isMobileFullScreen && (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
          {stepItems.map(({ stepKey, done, active, label }, index) => (
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
                    {index + 1}
                  </span>
                )}
                <span className="font-medium">{label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetailedStatus && !isMobileFullScreen && cameraActive && liveMetrics && (
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

      <div className={cn('flex flex-wrap gap-3', isMobileFullScreen && 'hidden')}>
        {!cameraActive && (
          <Button type="button" variant="outline" onClick={startCamera} disabled={disabled || cameraLoading}>
            {cameraLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            {startLabel}
          </Button>
        )}

        {cameraActive && (
          <Button type="button" variant="outline" onClick={stopCamera} disabled={disabled}>
            <CameraOff className="mr-2 h-4 w-4" />
            {cancelLabel}
          </Button>
        )}

        {value && !cameraActive && (
          <>
            <Button type="button" variant="outline" onClick={startCamera} disabled={disabled || cameraLoading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {retryLabel}
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
