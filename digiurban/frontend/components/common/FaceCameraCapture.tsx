'use client';

/**
 * Captura facial ao vivo com DESAFIO sorteado pelo servidor:
 *   1. de frente  ->  2. virando o rosto para o lado pedido  ->  3. de frente de novo
 * As 3 fotos vão para o servidor, que reconhece o rosto e confere a prova de vida
 * (motor UniFace). O navegador só guia o enquadramento — antes ele calculava a
 * assinatura do rosto e uma "nota de presença" em que o servidor acreditava.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Check, ChevronsLeft, ChevronsRight, Loader2, RefreshCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { analyzeFaceApiFrame, getFaceApiEngine } from '@/components/common/face-api-engine';

const ANALYSIS_THROTTLE_MS = 180;

const ALIGN_DURATION_MS = 300;
const HOLD_DURATION_MS = 650;
const TARGET_CENTER_X = 0.5;
const TARGET_CENTER_Y = 0.47;
const FACE_SIZE_MIN_RATIO = 0.16;
const FACE_SIZE_TARGET_RATIO = 0.38;
const FACE_SIZE_MAX_RATIO = 0.54;

type SessionStep = 'align' | 'hold_still' | 'turn' | 'return' | 'completed';
export type FaceChallengeDirection = 'left' | 'right';

/** Giro mínimo (nariz em relação aos olhos, proporção do rosto) para aceitar o desafio */
const TURN_MIN_YAW = 0.11;
const FRONTAL_MAX_YAW = 0.07;
const RETURN_HOLD_MS = 350;
const FRAME_MAX_WIDTH = 720;
type FeedbackTone = 'neutral' | 'warning' | 'success';

/**
 * Moldura oval na tela. Ela é calculada a partir do VÍDEO (não da tela), para
 * mostrar exatamente a região que a conferência usa: rosto no centro, ocupando
 * cerca de metade do lado menor da imagem.
 */
const OVAL_WIDTH_OF_SHORT_SIDE = 0.5;
const OVAL_ASPECT = 1.35;
/** o centro medido é o dos pontos do rosto (sem a testa): a moldura sobe um pouco */
const OVAL_LIFT = 0.06;

interface StageLayout {
  width: number;
  height: number;
  videoWidth: number;
  videoHeight: number;
  videoLeft: number;
  videoTop: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

function computeStageLayout(stageWidth: number, stageHeight: number, sourceWidth: number, sourceHeight: number): StageLayout {
  const ovalWidthSource = OVAL_WIDTH_OF_SHORT_SIDE * Math.min(sourceWidth, sourceHeight);
  const ovalHeightSource = ovalWidthSource * OVAL_ASPECT;
  // preenche a tela; só encolhe se a moldura não couber (ex.: vídeo deitado em tela em pé)
  const cover = Math.max(stageWidth / sourceWidth, stageHeight / sourceHeight);
  const scale = Math.min(cover, (0.84 * stageWidth) / ovalWidthSource, (0.62 * stageHeight) / ovalHeightSource);
  const videoWidth = sourceWidth * scale;
  const videoHeight = sourceHeight * scale;
  const videoLeft = (stageWidth - videoWidth) / 2;
  const videoTop = (stageHeight - videoHeight) / 2;
  return {
    width: stageWidth,
    height: stageHeight,
    videoWidth,
    videoHeight,
    videoLeft,
    videoTop,
    cx: stageWidth / 2,
    cy: videoTop + (TARGET_CENTER_Y * sourceHeight - OVAL_LIFT * ovalHeightSource) * scale,
    rx: (ovalWidthSource * scale) / 2,
    ry: (ovalHeightSource * scale) / 2,
  };
}

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

function averagePoint(points: FacePoint[]) {
  if (!points.length) {
    return null;
  }

  const total = points.reduce<{ x: number; y: number; z: number }>(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
      z: accumulator.z + (point.z ?? 0),
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
    z: total.z / points.length,
  };
}

interface ChallengeState {
  completedSteps: SessionStep[];
  stableMs: number;
  faceDetections: number;
  maxFacesDetected: number;
}

export interface FaceCaptureSessionMetadata {
  captureMode: 'LIVE_CHALLENGE';
  sessionId: string;
  completedAt: string;
  challengeId: string;
  direction: FaceChallengeDirection;
  /** 3 fotos JPEG (de frente, virando, de frente) — analisadas no servidor */
  frames: string[];
  detectedFacesCount: number;
}

interface FaceCameraCaptureProps {
  value: string;
  onChange: (value: string) => void;
  onMetadataChange?: (metadata: FaceCaptureSessionMetadata | null) => void;
  disabled?: boolean;
  className?: string;
  purposeLabel?: string;
  startLabel?: string;
  retryLabel?: string;
  cancelLabel?: string;
  showDetailedStatus?: boolean;
  requireFaceApi?: boolean;
  /** Pede ao servidor o desafio (lado sorteado) antes de abrir a câmera */
  getChallenge: () => Promise<{ challengeId: string; direction: FaceChallengeDirection }>;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `face-session-${Date.now()}`;
}

function getFaceMetrics(landmarks: FacePoint[]): FaceMetrics | null {
  if (!landmarks.length) {
    return null;
  }

  const leftEyeOuter = averagePoint(landmarks.slice(36, 42));
  const rightEyeOuter = averagePoint(landmarks.slice(42, 48));
  const noseTip = landmarks[30] || averagePoint(landmarks.slice(27, 36));

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

function directionLabel(direction: FaceChallengeDirection) {
  return direction === 'left' ? 'esquerda' : 'direita';
}

/** Para a pessoa são 3 passos: de frente, virar, de frente */
const USER_STEPS = ['Olhe de frente', 'Vire o rosto', 'Volte de frente'];

function userStepIndex(step: SessionStep) {
  if (step === 'align' || step === 'hold_still') return 0;
  if (step === 'turn') return 1;
  if (step === 'return') return 2;
  return 3;
}

export function FaceCameraCapture({
  value,
  onChange,
  onMetadataChange,
  disabled = false,
  className = '',
  purposeLabel = 'Biometria facial',
  startLabel = 'Abrir câmera',
  retryLabel = 'Refazer',
  cancelLabel = 'Fechar câmera',
  getChallenge,
}: FaceCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastAnalysisAtRef = useRef(0);
  const holdSinceRef = useRef<number | null>(null);
  const previousMetricsRef = useRef<FaceMetrics | null>(null);
  const sessionIdRef = useRef(createSessionId());
  const captureDoneRef = useRef(false);
  const feedbackRef = useRef('');
  const feedbackToneRef = useRef<FeedbackTone>('neutral');
  const sessionStepRef = useRef<SessionStep>('align');
  const challengeRef = useRef<{ challengeId: string; direction: FaceChallengeDirection } | null>(null);
  const framesRef = useRef<string[]>([]);
  const challengeStateRef = useRef<ChallengeState>({
    completedSteps: [],
    stableMs: 0,
    faceDetections: 0,
    maxFacesDetected: 0,
  });

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [faceEngineLoading, setFaceEngineLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sessionStep, setSessionStep] = useState<SessionStep>('align');
  const [liveFeedback, setLiveFeedback] = useState('Abra a câmera e mantenha apenas uma pessoa no enquadramento.');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('neutral');
  const [captureSummary, setCaptureSummary] = useState<FaceCaptureSessionMetadata | null>(null);
  const [layout, setLayout] = useState<StageLayout | null>(null);
  const [progress, setProgress] = useState(0);
  const [faceInFrame, setFaceInFrame] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [mounted, setMounted] = useState(false);
  const contextualLabel = purposeLabel.trim() || 'Biometria facial';

  /** Quanto do passo a passo já foi feito (0 a 1) — enche o anel da moldura */
  const syncProgress = (value: number) => {
    const next = Math.round(clamp(value, 0, 1) * 100) / 100;
    if (progressRef.current !== next) {
      progressRef.current = next;
      setProgress(next);
    }
  };

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
    lastAnalysisAtRef.current = 0;
    sessionIdRef.current = createSessionId();
    challengeStateRef.current = {
      completedSteps: [],
      stableMs: 0,
      faceDetections: 0,
      maxFacesDetected: 0,
    };
    framesRef.current = [];
    sessionStepRef.current = 'align';
    setSessionStep('align');
    setCaptureSummary(null);
    setFaceInFrame(false);
    setSuccessFlash(false);
    syncProgress(0);
    syncFeedback('Abra a câmera e mantenha apenas uma pessoa no enquadramento.', 'neutral');
  };

  const stopAnalysisLoop = () => {
    if (analysisFrameRef.current !== null) {
      cancelAnimationFrame(analysisFrameRef.current);
      analysisFrameRef.current = null;
    }
  };

  const stopCamera = () => {
    stopAnalysisLoop();
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setSuccessFlash(false);

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
    setMounted(true);
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

  /** Foto do quadro atual (sem espelhar), reduzida para no máximo 720 px */
  const captureFrame = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!video || !canvas || !context) return null;
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 1280;
    const scale = Math.min(1, FRAME_MAX_WIDTH / width);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const finalizeCapture = (detectedFacesCount: number) => {
    if (captureDoneRef.current || !challengeRef.current || framesRef.current.length !== 3) {
      return;
    }

    const metadata: FaceCaptureSessionMetadata = {
      captureMode: 'LIVE_CHALLENGE',
      sessionId: sessionIdRef.current,
      completedAt: new Date().toISOString(),
      challengeId: challengeRef.current.challengeId,
      direction: challengeRef.current.direction,
      frames: [...framesRef.current],
      detectedFacesCount,
    };

    captureDoneRef.current = true;
    onChange(framesRef.current[0]);
    onMetadataChange?.(metadata);
    setCaptureSummary(metadata);
    markStepCompleted('return');
    updateSessionStep('completed');
    syncFeedback('Pronto!', 'success');
    syncProgress(1);
    stopAnalysisLoop();
    setSuccessFlash(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      stopCamera();
    }, 900);
  };

  const evaluateFaceSession = (
    input: {
      metrics: FaceMetrics;
      detectedFacesCount: number;
    },
    timestamp: number
  ) => {
    const challengeState = challengeStateRef.current;
    const metrics = input.metrics;
    const step = sessionStepRef.current;
    const direction = challengeRef.current?.direction || 'left';
    const centered = isCentered(metrics);
    const stable = isStable(metrics, previousMetricsRef.current);

    challengeState.faceDetections += 1;
    challengeState.maxFacesDetected = Math.max(challengeState.maxFacesDetected, input.detectedFacesCount);
    setFaceInFrame(true);
    previousMetricsRef.current = metrics;

    if (input.detectedFacesCount > 1) {
      holdSinceRef.current = null;
      challengeState.stableMs = 0;
      syncFeedback('Há mais de um rosto no quadro. Deixe apenas uma pessoa na câmera.', 'warning');
      return;
    }

    const faceTooFar = metrics.sizeRatio < FACE_SIZE_MIN_RATIO;
    const faceTooClose = metrics.sizeRatio > FACE_SIZE_MAX_RATIO;
    if (faceTooFar || faceTooClose) {
      holdSinceRef.current = null;
      challengeState.stableMs = 0;
      syncFeedback(
        faceTooFar ? 'Aproxime um pouco mais o rosto da câmera.' : 'Afaste só um pouco o rosto para caber melhor na moldura.',
        'warning'
      );
      return;
    }

    // ---- 2. virar o rosto para o lado sorteado ----
    if (step === 'turn') {
      // nariz à direita dos olhos na imagem = pessoa virada para a PRÓPRIA esquerda
      const turned = direction === 'left' ? metrics.yawScore >= TURN_MIN_YAW : metrics.yawScore <= -TURN_MIN_YAW;
      const wrongSide = direction === 'left' ? metrics.yawScore <= -TURN_MIN_YAW : metrics.yawScore >= TURN_MIN_YAW;
      if (turned) {
        const frame = captureFrame();
        if (frame) framesRef.current[1] = frame;
        markStepCompleted('turn');
        updateSessionStep('return');
        syncProgress(0.66);
        syncFeedback('Isso! Agora volte a olhar de frente para a câmera.', 'neutral');
        return;
      }
      syncFeedback(
        wrongSide
          ? `Para o outro lado: vire devagar para a sua ${directionLabel(direction)}.`
          : `Vire o rosto devagar para a sua ${directionLabel(direction)}.`,
        wrongSide ? 'warning' : 'neutral'
      );
      return;
    }

    if (!centered) {
      holdSinceRef.current = null;
      challengeState.stableMs = 0;
      syncFeedback('Centralize o rosto na moldura.', 'warning');
      return;
    }

    const lookingAway = Math.abs(metrics.yawScore) > (step === 'return' ? FRONTAL_MAX_YAW : 0.18);
    if (lookingAway) {
      holdSinceRef.current = null;
      challengeState.stableMs = 0;
      syncFeedback('Olhe de frente para a câmera.', step === 'return' ? 'neutral' : 'warning');
      return;
    }

    // ---- 3. de frente de novo ----
    if (step === 'return') {
      if (holdSinceRef.current === null) holdSinceRef.current = timestamp;
      syncFeedback('Isso! Fique de frente só mais um instante.', 'success');
      syncProgress(0.66 + 0.3 * Math.min((timestamp - holdSinceRef.current) / RETURN_HOLD_MS, 1));
      if (timestamp - holdSinceRef.current >= RETURN_HOLD_MS) {
        const frame = captureFrame();
        if (frame) framesRef.current[2] = frame;
        finalizeCapture(input.detectedFacesCount);
      }
      return;
    }

    if (step === 'align') {
      if (holdSinceRef.current === null) {
        holdSinceRef.current = timestamp;
      }

      const elapsed = timestamp - holdSinceRef.current;
      syncFeedback(
        elapsed >= ALIGN_DURATION_MS ? 'Enquadramento confirmado. Fique paradinho(a)...' : 'Mantenha o rosto estável por um instante.',
        'neutral'
      );

      if (elapsed >= ALIGN_DURATION_MS) {
        markStepCompleted('align');
        updateSessionStep('hold_still');
      }
      return;
    }

    // ---- 1. foto de frente ----
    if (!stable) {
      holdSinceRef.current = null;
      challengeState.stableMs = 0;
      syncFeedback('Mantenha o rosto estável por um instante.', 'warning');
      return;
    }

    if (holdSinceRef.current === null) {
      holdSinceRef.current = timestamp;
    }

    challengeState.stableMs = timestamp - holdSinceRef.current;
    syncFeedback('Fique paradinho(a)...', 'success');
    syncProgress(0.33 * Math.min(challengeState.stableMs / HOLD_DURATION_MS, 1));

    if (challengeState.stableMs >= HOLD_DURATION_MS) {
      const frame = captureFrame();
      if (frame) framesRef.current[0] = frame;
      markStepCompleted('hold_still');
      updateSessionStep('turn');
      syncProgress(0.33);
      syncFeedback(`Agora vire o rosto devagar para a sua ${directionLabel(direction)}.`, 'neutral');
    }
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

      // o servidor sorteia o lado do desafio (vale 2 minutos, uma vez só)
      try {
        challengeRef.current = await getChallenge();
      } catch (challengeError: any) {
        setCameraError(
          challengeError?.response?.data?.error ||
            challengeError?.message ||
            'Não foi possível iniciar a validação agora. Tente novamente em instantes.'
        );
        return;
      }

      const [faceApiEngine, stream] = await Promise.all([
        getFaceApiEngine(),
        navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'user' },
            // celular em pé pede imagem em pé; computador pede imagem deitada
            ...(window.innerHeight > window.innerWidth
              ? { width: { ideal: 720 }, height: { ideal: 1280 } }
              : { width: { ideal: 1280 }, height: { ideal: 720 } }),
          },
          audio: false,
        }),
      ]);

      streamRef.current = stream;
      lastAnalysisAtRef.current = 0;
      lastVideoTimeRef.current = -1;

      if (!faceApiEngine) {
        setCameraError('Não foi possível preparar a câmera neste aparelho. Atualize a página e tente de novo.');
        stopCamera();
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }

      setCameraActive(true);
      syncFeedback('Coloque o rosto dentro da moldura.', 'neutral');
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

    const analyze = async () => {
      if (!cameraActive || captureDoneRef.current) {
        return;
      }

      const video = videoRef.current;
      const now = performance.now();

      if (now - lastAnalysisAtRef.current < ANALYSIS_THROTTLE_MS) {
        analysisFrameRef.current = requestAnimationFrame(() => {
          void analyze();
        });
        return;
      }

      lastAnalysisAtRef.current = now;

      if (video && video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        try {
          const analysis = await analyzeFaceApiFrame(video);

          if (!analysis?.selectedFace) {
            holdSinceRef.current = null;
            previousMetricsRef.current = null;
            challengeStateRef.current.stableMs = 0;
            challengeStateRef.current.maxFacesDetected = Math.max(
              challengeStateRef.current.maxFacesDetected,
              analysis?.detectedFacesCount || 0
            );
            setFaceInFrame(false);
            syncFeedback('Coloque o rosto dentro da moldura.', 'warning');
          } else {
            const metrics = getFaceMetrics(analysis.selectedFace.landmarks);
            if (metrics) {
              evaluateFaceSession(
                {
                  metrics,
                  detectedFacesCount: analysis.detectedFacesCount,
                },
                performance.now()
              );
            }
          }
        } catch (error) {
          console.error('Falha durante a análise facial ao vivo.', error);
          setCameraError('Falha ao acompanhar o rosto pela câmera. Tente de novo.');
          stopCamera();
          return;
        }
      }

      analysisFrameRef.current = requestAnimationFrame(() => {
        void analyze();
      });
    };

    analysisFrameRef.current = requestAnimationFrame(() => {
      void analyze();
    });

    return () => {
      stopAnalysisLoop();
    };
  }, [cameraActive]);

  const overlayOpen = cameraActive || cameraLoading || faceEngineLoading;

  // posição do vídeo e da moldura: refaz quando a tela ou o vídeo mudam de tamanho
  const refreshLayout = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const video = videoRef.current;
    const portrait = stage.clientHeight > stage.clientWidth;
    const sourceWidth = video?.videoWidth || (portrait ? 720 : 1280);
    const sourceHeight = video?.videoHeight || (portrait ? 1280 : 720);
    setLayout(computeStageLayout(stage.clientWidth, stage.clientHeight, sourceWidth, sourceHeight));
  }, []);

  useEffect(() => {
    if (!overlayOpen) return;
    refreshLayout();
    const video = videoRef.current;
    const stage = stageRef.current;
    const observer = typeof ResizeObserver !== 'undefined' && stage ? new ResizeObserver(refreshLayout) : null;
    if (stage) observer?.observe(stage);
    window.addEventListener('resize', refreshLayout);
    window.addEventListener('orientationchange', refreshLayout);
    video?.addEventListener('loadedmetadata', refreshLayout);
    video?.addEventListener('resize', refreshLayout);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', refreshLayout);
      window.removeEventListener('orientationchange', refreshLayout);
      video?.removeEventListener('loadedmetadata', refreshLayout);
      video?.removeEventListener('resize', refreshLayout);
    };
  }, [overlayOpen, cameraActive, refreshLayout]);

  // tela cheia: trava a rolagem da página e fecha com Esc
  useEffect(() => {
    if (!overlayOpen || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') stopCamera();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayOpen]);

  const direction = challengeRef.current?.direction || 'left';
  const stepIndex = userStepIndex(sessionStep);
  const ringColor = successFlash || feedbackTone === 'success' ? '#34d399' : feedbackTone === 'warning' ? '#fbbf24' : '#22d3ee';
  const showTurnArrows = cameraActive && sessionStep === 'turn' && !successFlash;
  // o vídeo aparece espelhado (como espelho): a esquerda da pessoa fica à esquerda da tela
  const ArrowIcon = direction === 'left' ? ChevronsLeft : ChevronsRight;

  const overlay = overlayOpen ? (
    <div
      ref={stageRef}
      role="dialog"
      aria-modal="true"
      aria-label={contextualLabel}
      className="fixed inset-0 z-[1000] overflow-hidden bg-slate-950 text-white"
      style={{ height: '100dvh', pointerEvents: 'auto' }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className={cn('absolute max-w-none transition-opacity duration-300', cameraActive ? 'opacity-100' : 'opacity-0')}
        style={
          layout
            ? { left: layout.videoLeft, top: layout.videoTop, width: layout.videoWidth, height: layout.videoHeight, transform: 'scaleX(-1)' }
            : { inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }
        }
      />

      {/* escurece tudo fora da moldura e desenha o anel de progresso */}
      {cameraActive && layout && (
        <svg className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height} aria-hidden>
          <defs>
            <mask id="face-oval-mask">
              <rect width={layout.width} height={layout.height} fill="white" />
              <ellipse cx={layout.cx} cy={layout.cy} rx={layout.rx} ry={layout.ry} fill="black" />
            </mask>
          </defs>
          <rect width={layout.width} height={layout.height} fill="rgba(2,6,23,0.78)" mask="url(#face-oval-mask)" />
          <ellipse
            cx={layout.cx}
            cy={layout.cy}
            rx={layout.rx}
            ry={layout.ry}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={3}
            strokeDasharray={faceInFrame ? undefined : '10 12'}
          />
          {/* anel que enche conforme os passos; começa no alto da moldura */}
          <ellipse
            cx={layout.cx}
            cy={layout.cy}
            rx={layout.ry}
            ry={layout.rx}
            fill="none"
            stroke={ringColor}
            strokeWidth={6}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${Math.max(progress * 100, 0.001)} 100`}
            transform={`rotate(-90 ${layout.cx} ${layout.cy})`}
            style={{ transition: 'stroke-dasharray 250ms linear, stroke 200ms' }}
          />
        </svg>
      )}

      {/* setas do lado para onde virar */}
      {showTurnArrows && layout && (
        <div
          className="pointer-events-none absolute flex -translate-y-1/2 animate-pulse items-center justify-center rounded-full bg-cyan-400/20 text-cyan-200"
          style={{
            top: layout.cy,
            left: direction === 'left' ? Math.max(layout.cx - layout.rx - 76, 8) : undefined,
            right: direction === 'right' ? Math.max(layout.width - (layout.cx + layout.rx) - 76, 8) : undefined,
            width: 64,
            height: 64,
          }}
        >
          <ArrowIcon className="h-10 w-10" strokeWidth={2.5} />
        </div>
      )}

      {/* confirmação de captura */}
      {successFlash && layout && (
        <div
          className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl"
          style={{ left: layout.cx, top: layout.cy, width: 96, height: 96 }}
        >
          <Check className="h-14 w-14" strokeWidth={3} />
        </div>
      )}

      {/* topo: passos e fechar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-1.5" aria-label={`Passo ${Math.min(stepIndex + 1, 3)} de 3`}>
          {USER_STEPS.map((label, index) => (
            <span
              key={label}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index < stepIndex ? 'w-6 bg-emerald-400' : index === stepIndex ? 'w-10 bg-white' : 'w-6 bg-white/30'
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={stopCamera}
          aria-label={cancelLabel}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* base: uma instrução por vez, bem grande */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
        {cameraActive ? (
          <div className="mx-auto max-w-md space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
              {successFlash ? 'Concluído' : `Passo ${Math.min(stepIndex + 1, 3)} de 3 · ${USER_STEPS[Math.min(stepIndex, 2)]}`}
            </p>
            <p
              aria-live="polite"
              className={cn(
                'text-xl font-semibold leading-snug sm:text-2xl',
                successFlash || feedbackTone === 'success' ? 'text-emerald-300' : feedbackTone === 'warning' ? 'text-amber-300' : 'text-white'
              )}
            >
              {liveFeedback}
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 pb-[30dvh]">
            <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            <p className="text-lg font-semibold">Abrindo a câmera...</p>
            <p className="text-sm text-white/70">Se o navegador perguntar, permita o uso da câmera.</p>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className={cn('space-y-3', className)}>
      {value && !overlayOpen ? (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
          <img
            src={value}
            alt="Foto capturada"
            className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow"
            style={{ transform: 'scaleX(-1)' }}
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
              <Check className="h-4 w-4" />
              Captura concluída
            </p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <button type="button" onClick={startCamera} disabled={disabled || cameraLoading} className="inline-flex items-center gap-1 font-medium text-emerald-800 underline-offset-2 hover:underline disabled:opacity-50">
                <RefreshCcw className="h-3.5 w-3.5" />
                {retryLabel}
              </button>
              <button type="button" onClick={clearCapture} disabled={disabled} className="text-slate-600 underline-offset-2 hover:underline disabled:opacity-50">
                Descartar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <Button type="button" size="lg" onClick={startCamera} disabled={disabled || overlayOpen} className="h-12 w-full text-base">
          {overlayOpen ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Camera className="mr-2 h-5 w-5" />}
          {startLabel}
        </Button>
      )}

      {cameraError && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {cameraError}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      {mounted && overlay ? createPortal(overlay, document.body) : null}
    </div>
  );
}

export default FaceCameraCapture;
