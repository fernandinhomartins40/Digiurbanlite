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
import { getFaceApiEngine, type FaceApiModule } from '@/components/common/face-api-engine';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import facePlatformService from '@/lib/services/face-platform.service';
import { cn } from '@/lib/utils';

interface RecognizedFaceSnapshot {
  faceIndex: number;
  label: string;
  identityName: string | null;
  identityKey: string | null;
  confidence: number;
  matchStatus: 'MATCHED' | 'REVIEW_REQUIRED' | 'UNMATCHED';
  reviewReason?: string | null;
  distance?: number | null;
}

interface FaceMultiFaceTestPanelProps {
  schoolName?: string;
  className?: string;
}

interface FaceEmbeddingReference {
  vector?: number[] | null;
  isActive?: boolean | null;
}

interface FaceIdentityReference {
  id: string;
  label?: string | null;
  citizen?: { name?: string | null } | null;
  person?: { name?: string | null } | null;
  embeddings?: FaceEmbeddingReference[];
}

interface LoadedRecognitionReference {
  identityId: string;
  displayName: string;
  descriptors: Float32Array[];
}

const DETECTION_INTERVAL_MS = 180;
const MAX_FACES = 8;
const MATCH_DISTANCE_THRESHOLD = 0.4;
const REVIEW_DISTANCE_THRESHOLD = 0.6;
const MIN_DISTANCE_GAP = 0.05;
const FACE_API_ANALYSIS_OPTIONS = {
  inputSize: 512 as const,
  scoreThreshold: 0.3,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeDescriptor(vector: ArrayLike<number> | null | undefined) {
  if (!vector || typeof vector.length !== 'number' || vector.length === 0) {
    return new Float32Array();
  }

  const values = Array.from(vector, (value) => Number(value) || 0);
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));

  if (!Number.isFinite(magnitude) || magnitude <= 0) {
    return new Float32Array(values);
  }

  return new Float32Array(values.map((value) => value / magnitude));
}

function euclideanDistance(left: ArrayLike<number>, right: ArrayLike<number>) {
  const size = Math.min(left.length || 0, right.length || 0);
  if (!size) {
    return Number.POSITIVE_INFINITY;
  }

  let sum = 0;
  for (let index = 0; index < size; index += 1) {
    const delta = (Number(left[index]) || 0) - (Number(right[index]) || 0);
    sum += delta * delta;
  }

  return Math.sqrt(sum);
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

export function FaceMultiFaceTestPanel({ schoolName, className = '' }: FaceMultiFaceTestPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const lastAnalysisAtRef = useRef(0);
  const cameraActiveRef = useRef(false);
  const faceApiRef = useRef<FaceApiModule | null>(null);
  const faceMatcherRef = useRef<any | null>(null);
  const recognitionReferencesRef = useRef<LoadedRecognitionReference[]>([]);
  const recognitionLoadPromiseRef = useRef<Promise<FaceApiModule | null> | null>(null);

  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Abra a câmera para testar múltiplos rostos em tempo real.');
  const [error, setError] = useState<string | null>(null);
  const [faces, setFaces] = useState<RecognizedFaceSnapshot[]>([]);
  const [lastModelName, setLastModelName] = useState<string>('face-api.js');
  const [lastDetectedCount, setLastDetectedCount] = useState(0);
  const [referenceMessage, setReferenceMessage] = useState('Carregando biometrias cadastradas...');
  const [referenceCount, setReferenceCount] = useState(0);

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

  const drawNativeOverlay = (
    faceapi: FaceApiModule,
    detections: Array<any>,
    snapshots: RecognizedFaceSnapshot[]
  ) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context || !video || !video.videoWidth || !video.videoHeight) {
      return;
    }

    const width = canvas.clientWidth || video.videoWidth;
    const height = canvas.clientHeight || video.videoHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.max(Math.round(width * dpr), 1);
    canvas.height = Math.max(Math.round(height * dpr), 1);

    context.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min(width / video.videoWidth, height / video.videoHeight);
    const renderWidth = video.videoWidth * scale;
    const renderHeight = video.videoHeight * scale;
    const offsetX = (width - renderWidth) / 2;
    const offsetY = (height - renderHeight) / 2;

    context.save();
    context.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);

    detections.forEach((detection, index) => {
      const snapshot = snapshots[index];
      const tone = getStatusTone(snapshot?.matchStatus || 'UNMATCHED');
      const label =
        snapshot?.identityName?.trim() ||
        (snapshot?.matchStatus === 'MATCHED' ? snapshot?.label : `Desconhecido ${index + 1}`);
      const boxColor =
        snapshot?.matchStatus === 'MATCHED'
          ? '#10b981'
          : snapshot?.matchStatus === 'REVIEW_REQUIRED'
            ? '#f59e0b'
            : '#f43f5e';

      new faceapi.draw.DrawBox(detection.detection.box, {
        label,
        boxColor,
        lineWidth: 3,
        drawLabelOptions: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          fontColor: '#ffffff',
          padding: 6,
        },
      }).draw(context);

      new faceapi.draw.DrawFaceLandmarks(detection.landmarks).draw(context);

      if (snapshot?.reviewReason) {
        const reason = snapshot.reviewReason;
        const box = detection.detection.box;
        const y = box.y + box.height + 10;

        context.font = '600 11px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        context.fillStyle = tone.fill;
        const textWidth = Math.min(context.measureText(reason).width + 20, width - box.x);
        context.fillRect(box.x, y, Math.max(textWidth, 96), 22);
        context.fillStyle = '#fff';
        context.fillText(reason, box.x + 10, y + 14);
      }
    });

    context.restore();
  };

  const loadRecognitionReferences = async () => {
    if (recognitionLoadPromiseRef.current) {
      return recognitionLoadPromiseRef.current;
    }

    recognitionLoadPromiseRef.current = (async () => {
      try {
        setReferenceMessage('Carregando biometrias cadastradas...');

        const engine = await getFaceApiEngine();
        if (!engine) {
          faceApiRef.current = null;
          faceMatcherRef.current = null;
          recognitionReferencesRef.current = [];
          setReferenceCount(0);
          setReferenceMessage('Motor face-api.js indisponível.');
          return null;
        }

        faceApiRef.current = engine.faceapi;

        try {
          const identities = (await facePlatformService.listIdentities()) as FaceIdentityReference[];
          const labeledDescriptors: Array<any> = [];
          const loadedReferences: LoadedRecognitionReference[] = [];
          let totalTemplates = 0;

          for (const identity of identities || []) {
            const embeddings = Array.isArray(identity.embeddings) ? identity.embeddings : [];
            const vectors = embeddings
              .filter(
                (embedding) =>
                  embedding?.isActive !== false &&
                  Array.isArray(embedding.vector) &&
                  embedding.vector.length === 128
              )
              .map((embedding) => normalizeDescriptor(embedding.vector as number[]))
              .filter((vector) => vector.length === 128);

            if (!vectors.length) {
              continue;
            }

            const displayName =
              identity.citizen?.name?.trim() ||
              identity.person?.name?.trim() ||
              identity.label?.trim() ||
              identity.id;

            labeledDescriptors.push(new engine.faceapi.LabeledFaceDescriptors(displayName, vectors));
            loadedReferences.push({
              identityId: identity.id,
              displayName,
              descriptors: vectors,
            });
            totalTemplates += vectors.length;
          }

          recognitionReferencesRef.current = loadedReferences;
          faceMatcherRef.current = labeledDescriptors.length
            ? new engine.faceapi.FaceMatcher(labeledDescriptors, MATCH_DISTANCE_THRESHOLD)
            : null;

          setReferenceCount(labeledDescriptors.length);

          if (labeledDescriptors.length) {
            setReferenceMessage(
              `${labeledDescriptors.length} identidade(s) pronta(s) para reconhecimento nativo (${totalTemplates} template(s)).`
            );
          } else {
            setReferenceMessage('Nenhuma biometria cadastrada. As faces sem cadastro aparecerão como "Desconhecido".');
          }
        } catch (identityError: any) {
          console.error('Erro ao carregar referências faciais:', identityError);
          faceMatcherRef.current = null;
          recognitionReferencesRef.current = [];
          setReferenceCount(0);
          setReferenceMessage(
            identityError?.response?.data?.message ||
              identityError?.response?.data?.error ||
              identityError?.message ||
              'Não foi possível carregar as biometrias cadastradas. O teste seguirá apenas com detecção.'
          );
        }

        return engine.faceapi;
      } finally {
        recognitionLoadPromiseRef.current = null;
      }
    })();

    return recognitionLoadPromiseRef.current;
  };

  const scoreDescriptorAgainstReferences = (descriptor: Float32Array) => {
    const references = recognitionReferencesRef.current;

    if (!references.length || !descriptor.length) {
      return {
        identityKey: null,
        identityName: null,
        distance: Number.POSITIVE_INFINITY,
        secondBestDistance: Number.POSITIVE_INFINITY,
        confidence: 0,
        matchStatus: 'UNMATCHED' as const,
        reviewReason: null as string | null,
      };
    }

    const rankedCandidates = references
      .map((reference) => {
        const distance = reference.descriptors.reduce((bestDistance, template) => {
          const currentDistance = euclideanDistance(descriptor, template);
          return currentDistance < bestDistance ? currentDistance : bestDistance;
        }, Number.POSITIVE_INFINITY);

        return {
          identityKey: reference.identityId,
          identityName: reference.displayName,
          distance,
        };
      })
      .filter((candidate) => Number.isFinite(candidate.distance))
      .sort((left, right) => left.distance - right.distance);

    const bestCandidate = rankedCandidates[0];
    const secondCandidate = rankedCandidates[1];

    if (!bestCandidate) {
      return {
        identityKey: null,
        identityName: null,
        distance: Number.POSITIVE_INFINITY,
        secondBestDistance: Number.POSITIVE_INFINITY,
        confidence: 0,
        matchStatus: 'UNMATCHED' as const,
        reviewReason: null as string | null,
      };
    }

    const secondBestDistance = secondCandidate?.distance ?? Number.POSITIVE_INFINITY;
    const distanceGap = secondBestDistance - bestCandidate.distance;
    const confidence = clamp(1 - bestCandidate.distance, 0, 1);

    if (bestCandidate.distance <= MATCH_DISTANCE_THRESHOLD && distanceGap >= MIN_DISTANCE_GAP) {
      return {
        identityKey: bestCandidate.identityKey,
        identityName: bestCandidate.identityName,
        distance: bestCandidate.distance,
        secondBestDistance,
        confidence,
        matchStatus: 'MATCHED' as const,
        reviewReason: null as string | null,
      };
    }

    if (bestCandidate.distance <= REVIEW_DISTANCE_THRESHOLD) {
      return {
        identityKey: bestCandidate.identityKey,
        identityName: bestCandidate.identityName,
        distance: bestCandidate.distance,
        secondBestDistance,
        confidence,
        matchStatus: 'REVIEW_REQUIRED' as const,
        reviewReason:
          distanceGap < MIN_DISTANCE_GAP
            ? 'Correspondência ambígua entre biometrias próximas.'
            : `Distância de comparação ${bestCandidate.distance.toFixed(2)}.`,
      };
    }

    return {
      identityKey: null,
      identityName: null,
      distance: bestCandidate.distance,
      secondBestDistance,
      confidence,
      matchStatus: 'UNMATCHED' as const,
      reviewReason: null as string | null,
    };
  };

  const dedupeFrameMatches = (snapshots: RecognizedFaceSnapshot[]) => {
    const strongestMatchByIdentity = new Map<string, { index: number; distance: number }>();

    snapshots.forEach((snapshot, index) => {
      if (snapshot.matchStatus !== 'MATCHED' || !snapshot.identityKey) {
        return;
      }

      const distance = snapshot.distance ?? Number.POSITIVE_INFINITY;
      const currentStrongest = strongestMatchByIdentity.get(snapshot.identityKey);

      if (!currentStrongest || distance < currentStrongest.distance) {
        strongestMatchByIdentity.set(snapshot.identityKey, { index, distance });
      }
    });

    return snapshots.map((snapshot, index) => {
      if (snapshot.matchStatus !== 'MATCHED' || !snapshot.identityKey) {
        return snapshot;
      }

      const strongest = strongestMatchByIdentity.get(snapshot.identityKey);
      if (!strongest || strongest.index === index) {
        return snapshot;
      }

      return {
        ...snapshot,
        label: `Desconhecido ${snapshot.faceIndex}`,
        identityName: null,
        identityKey: null,
        matchStatus: 'UNMATCHED' as const,
        reviewReason: 'Outra face no quadro teve correspondência melhor para esta identidade.',
      };
    });
  };

  const stopAnimationLoop = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const stopCamera = () => {
    stopAnimationLoop();
    inFlightRef.current = false;
    lastAnalysisAtRef.current = 0;
    cameraActiveRef.current = false;

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
    if (inFlightRef.current) {
      return;
    }

    const video = videoRef.current;
    const faceapi = faceApiRef.current;

    if (!video || !faceapi || video.readyState < 2) {
      return;
    }

    inFlightRef.current = true;
    setAnalyzing(true);

    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions(FACE_API_ANALYSIS_OPTIONS))
        .withFaceLandmarks()
        .withFaceDescriptors();

      const orderedDetections = [...detections]
        .sort((left, right) => left.detection.box.x - right.detection.box.x)
        .slice(0, MAX_FACES);

      if (!orderedDetections.length) {
        setFaces([]);
        setLastDetectedCount(0);
        setLastModelName('face-api.js');
        setStatusMessage('Nenhum rosto detectado. Posicione pessoas no enquadramento para iniciar a leitura.');
        clearOverlay();
        return;
      }

      const hasLoadedReferences = recognitionReferencesRef.current.length > 0;
      const matcher = faceMatcherRef.current;

      const snapshots = dedupeFrameMatches(await Promise.all(
        orderedDetections.map(async (detection, index) => {
          const normalizedDescriptor = normalizeDescriptor(detection.descriptor);
          const bestMatch = matcher ? matcher.findBestMatch(normalizedDescriptor) : null;
          const distance = bestMatch?.distance ?? 1;
          const confidence = clamp(1 - distance, 0, 1);
          const hasKnownIdentity = Boolean(bestMatch && bestMatch.label !== 'unknown');
          const localMatchStatus: RecognizedFaceSnapshot['matchStatus'] = hasKnownIdentity
            ? 'MATCHED'
            : distance <= REVIEW_DISTANCE_THRESHOLD
              ? 'REVIEW_REQUIRED'
              : 'UNMATCHED';

          if (hasKnownIdentity && bestMatch) {
            return {
              faceIndex: index + 1,
              label: bestMatch.toString(),
              identityName: bestMatch.label,
              identityKey: bestMatch.label,
              confidence,
              matchStatus: localMatchStatus,
              distance,
              reviewReason: localMatchStatus === 'REVIEW_REQUIRED' ? `Distância de comparação ${distance.toFixed(2)}.` : null,
            } satisfies RecognizedFaceSnapshot;
          }

          return {
            faceIndex: index + 1,
            label: `Desconhecido ${index + 1}`,
            identityName: null,
            identityKey: null,
            confidence,
            matchStatus: localMatchStatus,
            distance,
            reviewReason:
              localMatchStatus === 'REVIEW_REQUIRED'
                ? `Distância de comparação ${distance.toFixed(2)}.`
                : null,
          } satisfies RecognizedFaceSnapshot;
        })
      ));

      setFaces(snapshots);
      setLastDetectedCount(orderedDetections.length);
      setLastModelName('face-api.js');
      setStatusMessage(
        hasLoadedReferences
          ? `${orderedDetections.length} rosto(s) detectados com identificação nativa do face-api.js. Rostos sem cadastro aparecem como "Desconhecido".`
          : `${orderedDetections.length} rosto(s) detectados. Carregue biometrias para habilitar a identificação automática; os demais aparecerão como "Desconhecido".`
      );
      drawNativeOverlay(faceapi, orderedDetections, snapshots);
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

  const startAnimationLoop = () => {
    const tick = (timestamp: number) => {
      if (!cameraActiveRef.current) {
        return;
      }

      if (timestamp - lastAnalysisAtRef.current >= DETECTION_INTERVAL_MS) {
        lastAnalysisAtRef.current = timestamp;
        void analyzeFrame();
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    stopAnimationLoop();
    animationFrameRef.current = window.requestAnimationFrame(tick);
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

      const engine = await loadRecognitionReferences();
      if (!engine) {
        setError('Não foi possível carregar o motor face-api.js.');
        stopCamera();
        return;
      }

      cameraActiveRef.current = true;
      setCameraActive(true);
      setStatusMessage('Câmera iniciada. O overlay nativo mostrará caixas, landmarks e nomes reconhecidos.');
      startAnimationLoop();
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
    void loadRecognitionReferences();

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
              O vídeo ao vivo usa `face-api.js` para detectar vários rostos, desenhar landmarks e identificar cada
              pessoa com rótulos nativos no próprio quadro.
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
            <p className="mt-1">Cada rosto recebe um identificador visual diretamente sobre a imagem ao vivo.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          Rostos sem cadastro continuam com caixa e landmark nativos do `face-api.js` e são marcados como
          "Desconhecido".
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
                    O overlay nativo mostra caixas, landmarks e nomes reconhecidos no próprio vídeo.
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
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Motor</p>
            <p className="mt-1 font-medium text-slate-900">{lastModelName}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Referências</p>
            <p className="mt-1 font-medium text-slate-900">{referenceCount} identidade(s)</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Em revisão</p>
            <p className="mt-1 font-medium text-slate-900">
              {faces.filter((face) => face.matchStatus === 'REVIEW_REQUIRED').length} rosto(s)
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {referenceMessage}
        </div>

        <div className="space-y-3">
          {faces.length > 0 ? (
            faces.map((face) => {
              const tone = getStatusTone(face.matchStatus);

              return (
                <div key={face.faceIndex} className="rounded-2xl border border-slate-200 bg-white p-4">
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

                    <Badge className={tone.chip}>Confiança {Math.round(face.confidence * 100)}%</Badge>
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
