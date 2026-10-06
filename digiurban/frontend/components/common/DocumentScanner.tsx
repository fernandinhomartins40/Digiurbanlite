'use client';

/**
 * Scanner de documentos pela câmera — tela cheia, no mesmo visual da biometria.
 *
 * Com a "câmera inteligente" ligada no painel da plataforma, o modelo DocAligner
 * acha o documento ao vivo: as pontas aparecem na tela, a pessoa recebe uma dica
 * por vez ("aproxime", "segure firme", "tem reflexo") e a foto sai sozinha quando
 * fica bom. Desligada (ou se o modelo não carregar), aparece uma moldura fixa e a
 * pessoa tira a foto no botão. Nos dois casos a foto é recortada, endireitada e
 * clareada aqui mesmo; RG, CIN e CNH pedem frente e verso, que viram um arquivo só.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Crop, Loader2, RotateCcw, X, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DocDetector, loadDocDetector, smartCameraEnabled } from '@/lib/doc-scanner/detector';
import { docKindFromName } from '@/lib/doc-scanner/document-kinds';
import {
  cropRect,
  enhanceDocument,
  isConvex,
  outputSize,
  Pt,
  Quad,
  quadArea,
  quadShift,
  stackVertically,
  warpQuad,
} from '@/lib/doc-scanner/geometry';

interface DocumentScannerProps {
  documentName: string;
  acceptedFormats: string[];
  maxSizeMB: number;
  onCapture: (file: File) => void;
  onCancel: () => void;
}

type Phase = 'starting' | 'live' | 'processing' | 'review' | 'adjust' | 'error';
type Tone = 'neutral' | 'warning' | 'success';

const ANALYSIS_MS = 120;
const HOLD_MS = 900;
const MAX_LONG_SIDE = 1800;

interface Layout {
  width: number;
  height: number;
  scale: number;
  left: number;
  top: number;
  /** área da tela onde o vídeo aparece */
  visible: { x: number; y: number; width: number; height: number };
}

interface Shot {
  frame: HTMLCanvasElement;
  quad: Quad;
  output: HTMLCanvasElement;
  preview: string;
  /** foto inteira para ajustar as pontas (feita só quando a pessoa pede) */
  frameUrl?: string;
}

function coverLayout(stageWidth: number, stageHeight: number, sourceWidth: number, sourceHeight: number): Layout {
  // preenche a tela; se o vídeo estiver deitado e a tela em pé (ou o contrário),
  // mostra a imagem inteira — senão as pontas do documento ficam fora da tela
  const sameOrientation = stageWidth >= stageHeight === sourceWidth >= sourceHeight;
  const scale = sameOrientation
    ? Math.max(stageWidth / sourceWidth, stageHeight / sourceHeight)
    : Math.min(stageWidth / sourceWidth, stageHeight / sourceHeight);
  const left = (stageWidth - sourceWidth * scale) / 2;
  const top = (stageHeight - sourceHeight * scale) / 2;
  const x = Math.max(0, left);
  const y = Math.max(0, top);
  return {
    width: stageWidth,
    height: stageHeight,
    scale,
    left,
    top,
    visible: { x, y, width: Math.min(stageWidth, sourceWidth * scale + left) - x, height: Math.min(stageHeight, sourceHeight * scale + top) - y },
  };
}

const toScreen = (q: Quad, l: Layout): Quad => q.map((p) => ({ x: p.x * l.scale + l.left, y: p.y * l.scale + l.top })) as Quad;
const polygonPoints = (q: Quad) => q.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

/** Moldura fixa (tela) do modo sem câmera inteligente */
function guideRect(l: Layout, aspect: number) {
  const area = l.visible;
  const maxW = Math.min(l.width * 0.88, area.width * 0.92);
  const maxH = Math.min(l.height * 0.58, area.height * 0.9);
  let width = maxW;
  let height = width / aspect;
  if (height > maxH) {
    height = maxH;
    width = height * aspect;
  }
  // centro da área do vídeo (um pouco acima quando o vídeo ocupa a tela toda)
  const lift = area.height > l.height * 0.9 ? l.height * 0.04 : 0;
  return { x: area.x + (area.width - width) / 2, y: area.y + (area.height - height) / 2 - lift, width, height };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

function slug(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'documento'
  );
}

export function DocumentScanner({ documentName, maxSizeMB, onCapture, onCancel }: DocumentScannerProps) {
  const kind = docKindFromName(documentName);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<DocDetector | null>(null);
  const loopRef = useRef<number | null>(null);
  const lastRunRef = useRef(0);
  const lastQuadRef = useRef<Quad | null>(null);
  const shownQuadRef = useRef<Quad | null>(null);
  const holdSinceRef = useRef<number | null>(null);
  const bestSharpRef = useRef(0);
  const capturingRef = useRef(false);
  const phaseRef = useRef<Phase>('starting');
  const doneSidesRef = useRef<HTMLCanvasElement[]>([]);

  const [mounted, setMounted] = useState(false);
  const [phase, setPhaseState] = useState<Phase>('starting');
  const [smart, setSmart] = useState(false);
  const [layout, setLayoutState] = useState<Layout | null>(null);
  const layoutRef = useRef<Layout | null>(null);
  const setLayout = (next: Layout) => {
    layoutRef.current = next;
    setLayoutState(next);
  };
  const [sideIndex, setSideIndex] = useState(0);
  const [screenQuad, setScreenQuad] = useState<Quad | null>(null);
  const [message, setMessage] = useState('Abrindo a câmera...');
  const [tone, setTone] = useState<Tone>('neutral');
  const [progress, setProgress] = useState(0);
  const [shot, setShot] = useState<Shot | null>(null);
  const [errorText, setErrorText] = useState('');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [adjustQuad, setAdjustQuad] = useState<Quad | null>(null);
  const [adjustBox, setAdjustBox] = useState<{ left: number; top: number; scale: number } | null>(null);
  const dragRef = useRef<number | null>(null);

  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };

  const say = (text: string, nextTone: Tone) => {
    setMessage((current) => (current === text ? current : text));
    setTone((current) => (current === nextTone ? current : nextTone));
  };

  const stopLoop = () => {
    if (loopRef.current !== null) cancelAnimationFrame(loopRef.current);
    loopRef.current = null;
  };

  const stopCamera = useCallback(() => {
    stopLoop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const close = () => {
    stopCamera();
    onCancel();
  };

  // ---------------------------------------------------------------- câmera

  const startCamera = useCallback(async () => {
    setPhase('starting');
    say('Abrindo a câmera...', 'neutral');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const capabilities: any = track?.getCapabilities?.() || {};
      setTorchAvailable(Boolean(capabilities.torch));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      holdSinceRef.current = null;
      lastQuadRef.current = null;
      shownQuadRef.current = null;
      setScreenQuad(null);
      setProgress(0);
      setPhase('live');
    } catch (error) {
      console.error('[DocumentScanner] câmera', error);
      setErrorText('Não foi possível abrir a câmera. Confira se o navegador tem permissão para usar a câmera.');
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    void startCamera();
    // câmera inteligente: só se a plataforma liberou; se falhar, fica a moldura fixa
    smartCameraEnabled()
      .then(async (enabled) => {
        if (!enabled || cancelled) return;
        const detector = await loadDocDetector();
        if (cancelled) return;
        detectorRef.current = detector;
        setSmart(true);
      })
      .catch((error) => console.warn('[DocumentScanner] câmera inteligente indisponível, usando moldura fixa', error));
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // tela cheia: trava a rolagem e fecha com Esc
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshLayout = useCallback(() => {
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!stage) return;
    const portrait = stage.clientHeight > stage.clientWidth;
    setLayout(
      coverLayout(
        stage.clientWidth,
        stage.clientHeight,
        video?.videoWidth || (portrait ? 1080 : 1920),
        video?.videoHeight || (portrait ? 1920 : 1080)
      )
    );
  }, []);

  useEffect(() => {
    if (!mounted) return;
    refreshLayout();
    const stage = stageRef.current;
    const video = videoRef.current;
    const observer = typeof ResizeObserver !== 'undefined' && stage ? new ResizeObserver(refreshLayout) : null;
    if (stage) observer?.observe(stage);
    video?.addEventListener('loadedmetadata', refreshLayout);
    video?.addEventListener('resize', refreshLayout);
    window.addEventListener('orientationchange', refreshLayout);
    return () => {
      observer?.disconnect();
      video?.removeEventListener('loadedmetadata', refreshLayout);
      video?.removeEventListener('resize', refreshLayout);
      window.removeEventListener('orientationchange', refreshLayout);
    };
  }, [mounted, refreshLayout]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch {
      setTorchAvailable(false);
    }
  };

  // ---------------------------------------------------------------- foto

  const grabFrame = (): HTMLCanvasElement | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    return canvas;
  };

  const finishShot = (frame: HTMLCanvasElement, quad: Quad, straighten: boolean) => {
    let output: HTMLCanvasElement;
    if (straighten) {
      const size = outputSize(quad, MAX_LONG_SIDE);
      output = warpQuad(frame, quad, size.width, size.height);
    } else {
      const xs = quad.map((p) => p.x);
      const ys = quad.map((p) => p.y);
      output = cropRect(frame, Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      const long = Math.max(output.width, output.height);
      if (long > MAX_LONG_SIDE) {
        const ratio = MAX_LONG_SIDE / long;
        const scaled = document.createElement('canvas');
        scaled.width = Math.round(output.width * ratio);
        scaled.height = Math.round(output.height * ratio);
        scaled.getContext('2d')?.drawImage(output, 0, 0, scaled.width, scaled.height);
        output = scaled;
      }
    }
    enhanceDocument(output);
    setShot({ frame, quad, output, preview: output.toDataURL('image/jpeg', 0.85) });
    setPhase('review');
  };

  const capture = async () => {
    if (capturingRef.current || phaseRef.current !== 'live') return;
    capturingRef.current = true;
    stopLoop();
    setPhase('processing');
    try {
      const frame = grabFrame();
      if (!frame) throw new Error('Câmera sem imagem');
      if (detectorRef.current) {
        // confere de novo na foto inteira (mais precisa que o quadro ao vivo)
        const detection = await detectorRef.current.detect(frame, frame.width, frame.height);
        const quad = detection.quad && isConvex(detection.quad) ? detection.quad : lastQuadRef.current;
        if (quad) {
          finishShot(frame, quad, true);
          return;
        }
      }
      // moldura fixa: recorta a área da moldura (convertida da tela para a foto)
      const l = layoutRef.current || coverLayout(frame.width, frame.height, frame.width, frame.height);
      const g = guideRect(l, kind.aspect);
      const toFrame = (x: number, y: number): Pt => ({ x: (x - l.left) / l.scale, y: (y - l.top) / l.scale });
      const quad: Quad = [toFrame(g.x, g.y), toFrame(g.x + g.width, g.y), toFrame(g.x + g.width, g.y + g.height), toFrame(g.x, g.y + g.height)];
      finishShot(frame, quad, false);
    } catch (error) {
      console.error('[DocumentScanner] foto', error);
      say('Não deu para tirar a foto. Tente de novo.', 'warning');
      setPhase('live');
    } finally {
      capturingRef.current = false;
    }
  };

  // ---------------------------------------------------------------- análise ao vivo

  useEffect(() => {
    if (phase !== 'live') return;
    if (!smart) {
      say(
        kind.shape === 'card' ? 'Coloque o documento dentro da moldura e toque no botão.' : 'Enquadre a folha inteira na moldura e toque no botão.',
        'neutral'
      );
      return;
    }
    say('Procurando o documento...', 'neutral');
    const tick = async () => {
      if (phaseRef.current !== 'live') return;
      const now = performance.now();
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (video && detector && video.readyState >= 2 && now - lastRunRef.current >= ANALYSIS_MS) {
        lastRunRef.current = now;
        try {
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          const result = await detector.detect(video, vw, vh);
          evaluate(result.quad, result.sharpness, result.glare, vw, vh, performance.now());
        } catch (error) {
          console.warn('[DocumentScanner] análise', error);
        }
      }
      loopRef.current = requestAnimationFrame(() => void tick());
    };
    loopRef.current = requestAnimationFrame(() => void tick());
    return stopLoop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, smart, sideIndex]);

  const evaluate = (quad: Quad | null, sharpness: number, glare: number, vw: number, vh: number, now: number) => {
    const l = layoutRef.current;
    if (!quad || !isConvex(quad)) {
      holdSinceRef.current = null;
      lastQuadRef.current = null;
      shownQuadRef.current = null;
      setScreenQuad(null);
      setProgress(0);
      say('Procurando o documento...', 'neutral');
      return;
    }

    const previous = lastQuadRef.current;
    lastQuadRef.current = quad;
    // suaviza o desenho na tela (o modelo treme um pouco de um quadro para outro)
    const shown = shownQuadRef.current
      ? (shownQuadRef.current.map((p, i) => ({ x: p.x * 0.45 + quad[i].x * 0.55, y: p.y * 0.45 + quad[i].y * 0.55 })) as Quad)
      : quad;
    shownQuadRef.current = shown;
    if (l) setScreenQuad(toScreen(shown, l));

    bestSharpRef.current = Math.max(bestSharpRef.current * 0.995, sharpness);
    const areaRatio = quadArea(quad) / (vw * vh);
    const margin = 0.012;
    const touchesEdge = quad.some((p) => p.x < vw * margin || p.x > vw * (1 - margin) || p.y < vh * margin || p.y > vh * (1 - margin));
    const moving = previous ? quadShift(previous, quad, Math.hypot(vw, vh)) > 0.012 : true;
    const blurry = sharpness < Math.max(25, bestSharpRef.current * 0.45);

    let problem: string | null = null;
    if (touchesEdge) problem = 'Afaste um pouco: mostre as 4 pontas do documento.';
    else if (areaRatio < (kind.shape === 'card' ? 0.16 : 0.22)) problem = 'Aproxime o documento.';
    else if (moving) problem = 'Segure firme...';
    else if (glare > 0.035) problem = 'Tem reflexo: incline um pouco o documento.';
    else if (blurry) problem = 'Segure firme para focar...';

    if (problem) {
      holdSinceRef.current = null;
      setProgress(0);
      say(problem, problem.startsWith('Segure') ? 'neutral' : 'warning');
      return;
    }
    if (holdSinceRef.current === null) holdSinceRef.current = now;
    const value = Math.min((now - holdSinceRef.current) / HOLD_MS, 1);
    setProgress(value);
    say('Ótimo! Não mexa...', 'success');
    if (value >= 1) void capture();
  };

  // ---------------------------------------------------------------- revisão

  const retake = () => {
    setShot(null);
    setAdjustQuad(null);
    holdSinceRef.current = null;
    lastQuadRef.current = null;
    shownQuadRef.current = null;
    bestSharpRef.current = 0;
    setScreenQuad(null);
    setProgress(0);
    setPhase('live');
  };

  const finalize = async (parts: HTMLCanvasElement[]) => {
    setPhase('processing');
    say('Preparando o arquivo...', 'neutral');
    let canvas = stackVertically(parts);
    const limit = Math.max(maxSizeMB, 0.5) * 1024 * 1024;
    let blob: Blob | null = null;
    for (const quality of [0.88, 0.8, 0.7, 0.6]) {
      blob = await canvasToBlob(canvas, quality);
      if (blob && blob.size <= limit) break;
    }
    // ainda grande: diminui a imagem
    while (blob && blob.size > limit && canvas.width > 800) {
      const smaller = document.createElement('canvas');
      smaller.width = Math.round(canvas.width * 0.8);
      smaller.height = Math.round(canvas.height * 0.8);
      smaller.getContext('2d')?.drawImage(canvas, 0, 0, smaller.width, smaller.height);
      canvas = smaller;
      blob = await canvasToBlob(canvas, 0.8);
    }
    if (!blob) {
      setErrorText('Não foi possível preparar a foto. Tente de novo.');
      setPhase('error');
      return;
    }
    stopCamera();
    onCapture(new File([blob], `${slug(documentName)}.jpg`, { type: 'image/jpeg' }));
  };

  const accept = () => {
    if (!shot) return;
    const parts = [...doneSidesRef.current, shot.output];
    if (parts.length < kind.sides.length) {
      doneSidesRef.current = parts;
      setSideIndex(parts.length);
      retake();
      return;
    }
    doneSidesRef.current = [];
    void finalize(parts);
  };

  // ---------------------------------------------------------------- ajustar as pontas

  const startAdjust = () => {
    if (!shot || !stageRef.current) return;
    const stage = stageRef.current;
    const availableH = stage.clientHeight * 0.7;
    const scale = Math.min((stage.clientWidth * 0.92) / shot.frame.width, availableH / shot.frame.height);
    setAdjustBox({
      scale,
      left: (stage.clientWidth - shot.frame.width * scale) / 2,
      top: Math.max(64, (stage.clientHeight * 0.85 - shot.frame.height * scale) / 2),
    });
    setAdjustQuad(shot.quad);
    if (!shot.frameUrl) setShot({ ...shot, frameUrl: shot.frame.toDataURL('image/jpeg', 0.8) });
    setPhase('adjust');
  };

  const onHandleMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current === null || !adjustQuad || !adjustBox || !shot) return;
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left - adjustBox.left) / adjustBox.scale, 0), shot.frame.width);
    const y = Math.min(Math.max((event.clientY - rect.top - adjustBox.top) / adjustBox.scale, 0), shot.frame.height);
    const next = [...adjustQuad] as Quad;
    next[dragRef.current] = { x, y };
    setAdjustQuad(next);
  };

  const applyAdjust = () => {
    if (!shot || !adjustQuad) return;
    if (!isConvex(adjustQuad)) {
      say('As pontas se cruzaram: arrume para formar o contorno do documento.', 'warning');
      return;
    }
    finishShot(shot.frame, adjustQuad, true);
  };

  // ---------------------------------------------------------------- tela

  const sideLabel = kind.sides[sideIndex] || 'Documento';
  const stepText = kind.sides.length > 1 ? `${sideLabel} · passo ${sideIndex + 1} de ${kind.sides.length}` : documentName;
  const color = tone === 'success' ? '#34d399' : tone === 'warning' ? '#fbbf24' : '#22d3ee';
  const guide = layout && !smart ? guideRect(layout, kind.aspect) : null;
  const liveVisible = phase === 'live' || phase === 'processing' || phase === 'starting';

  const overlay = (
    <div
      ref={stageRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Fotografar ${documentName}`}
      className="fixed inset-0 z-[1000] overflow-hidden bg-slate-950 text-white"
      style={{ height: '100dvh' }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className={cn('absolute max-w-none transition-opacity duration-300', liveVisible && phase !== 'starting' ? 'opacity-100' : 'opacity-0')}
        style={
          layout && videoRef.current?.videoWidth
            ? {
                left: layout.left,
                top: layout.top,
                width: videoRef.current.videoWidth * layout.scale,
                height: videoRef.current.videoHeight * layout.scale,
              }
            : { inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
        }
      />

      {/* ao vivo: escurece fora do documento e desenha o contorno que enche */}
      {phase === 'live' && layout && (
        <svg className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height} aria-hidden>
          <defs>
            <mask id="doc-scan-mask">
              <rect width={layout.width} height={layout.height} fill="white" />
              {screenQuad && <polygon points={polygonPoints(screenQuad)} fill="black" />}
              {guide && <rect x={guide.x} y={guide.y} width={guide.width} height={guide.height} rx={kind.shape === 'card' ? 18 : 8} fill="black" />}
            </mask>
          </defs>
          <rect width={layout.width} height={layout.height} fill={smart && !screenQuad ? 'rgba(2,6,23,0.35)' : 'rgba(2,6,23,0.72)'} mask="url(#doc-scan-mask)" />
          {guide && (
            <rect
              x={guide.x}
              y={guide.y}
              width={guide.width}
              height={guide.height}
              rx={kind.shape === 'card' ? 18 : 8}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={4}
              strokeDasharray="14 10"
            />
          )}
          {screenQuad && (
            <>
              <polygon points={polygonPoints(screenQuad)} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={3} strokeLinejoin="round" />
              <polygon
                points={polygonPoints(screenQuad)}
                fill="none"
                stroke={color}
                strokeWidth={6}
                strokeLinejoin="round"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={tone === 'success' ? `${Math.max(progress * 100, 0.001)} 100` : '100 0'}
                style={{ transition: 'stroke 200ms' }}
              />
              {screenQuad.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={9} fill={color} stroke="white" strokeWidth={2} />
              ))}
            </>
          )}
        </svg>
      )}

      {(phase === 'review' || phase === 'adjust') && <div className="absolute inset-0 bg-slate-950" aria-hidden />}

      {/* revisão: a foto já recortada */}
      {phase === 'review' && shot && (
        <div className="absolute inset-x-0 top-16 bottom-56 flex items-center justify-center px-4">
          <img src={shot.preview} alt={`${sideLabel} recortado`} className="max-h-full max-w-full rounded-xl bg-white object-contain shadow-2xl" />
        </div>
      )}

      {/* ajustar as pontas */}
      {phase === 'adjust' && shot && adjustQuad && adjustBox && (
        <svg
          className="absolute inset-0 h-full w-full touch-none"
          onPointerMove={onHandleMove}
          onPointerUp={() => (dragRef.current = null)}
          onPointerLeave={() => (dragRef.current = null)}
        >
          <image
            href={shot.frameUrl}
            x={adjustBox.left}
            y={adjustBox.top}
            width={shot.frame.width * adjustBox.scale}
            height={shot.frame.height * adjustBox.scale}
          />
          <polygon
            points={polygonPoints(adjustQuad.map((p) => ({ x: adjustBox.left + p.x * adjustBox.scale, y: adjustBox.top + p.y * adjustBox.scale })) as Quad)}
            fill="rgba(34,211,238,0.12)"
            stroke="#22d3ee"
            strokeWidth={3}
          />
          {adjustQuad.map((p, i) => (
            <circle
              key={i}
              cx={adjustBox.left + p.x * adjustBox.scale}
              cy={adjustBox.top + p.y * adjustBox.scale}
              r={18}
              fill="rgba(34,211,238,0.35)"
              stroke="white"
              strokeWidth={3}
              className="cursor-grab"
              onPointerDown={(event) => {
                (event.currentTarget.ownerSVGElement as SVGSVGElement | null)?.setPointerCapture?.(event.pointerId);
                dragRef.current = i;
              }}
            />
          ))}
        </svg>
      )}

      {phase === 'processing' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
          <p className="text-lg font-semibold">Preparando a foto...</p>
        </div>
      )}

      {/* topo: passos e fechar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <div className="flex min-w-0 items-center gap-3">
          {kind.sides.length > 1 && (
            <div className="flex items-center gap-1.5" aria-hidden>
              {kind.sides.map((label, index) => (
                <span
                  key={label}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    index < sideIndex ? 'w-6 bg-emerald-400' : index === sideIndex ? 'w-10 bg-white' : 'w-6 bg-white/30'
                  )}
                />
              ))}
            </div>
          )}
          <p className="truncate text-sm font-medium text-white/80">{stepText}</p>
        </div>
        <div className="flex items-center gap-2">
          {torchAvailable && phase === 'live' && (
            <button
              type="button"
              onClick={toggleTorch}
              aria-label={torchOn ? 'Desligar a lanterna' : 'Ligar a lanterna'}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white/25"
            >
              {torchOn ? <ZapOff className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
            </button>
          )}
          <button
            type="button"
            onClick={close}
            aria-label="Fechar a câmera"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* base: uma instrução por vez e os botões */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
        {phase === 'live' && (
          <div className="mx-auto max-w-md space-y-4">
            <p
              aria-live="polite"
              className={cn(
                'text-xl font-semibold leading-snug sm:text-2xl',
                tone === 'success' ? 'text-emerald-300' : tone === 'warning' ? 'text-amber-300' : 'text-white'
              )}
            >
              {kind.sides.length > 1 && sideIndex > 0 && !screenQuad ? `Agora vire o documento e mostre o ${sideLabel.toLowerCase()}.` : message}
            </p>
            <button
              type="button"
              onClick={() => void capture()}
              aria-label="Tirar a foto"
              className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white/80 bg-white/10 transition active:scale-95"
            >
              <span className="h-14 w-14 rounded-full bg-white" />
            </button>
            {smart && <p className="text-xs text-white/60">A foto sai sozinha quando o contorno ficar verde.</p>}
          </div>
        )}

        {phase === 'starting' && (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 pb-[30dvh]">
            <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            <p className="text-lg font-semibold">Abrindo a câmera...</p>
            <p className="text-sm text-white/70">Se o navegador perguntar, permita o uso da câmera.</p>
          </div>
        )}

        {phase === 'review' && (
          <div className="mx-auto max-w-md space-y-3">
            <p className="text-lg font-semibold">Dá para ler tudo?</p>
            <Button type="button" size="lg" onClick={accept} className="h-12 w-full bg-emerald-500 text-base text-white hover:bg-emerald-600">
              <Check className="mr-2 h-5 w-5" />
              {sideIndex + 1 < kind.sides.length ? `Usar e fotografar o ${kind.sides[sideIndex + 1].toLowerCase()}` : 'Usar esta foto'}
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={retake} className="h-12 flex-1 border-white/30 bg-white/10 text-base text-white hover:bg-white/20">
                <RotateCcw className="mr-2 h-4 w-4" />
                Tirar de novo
              </Button>
              <Button type="button" variant="outline" onClick={startAdjust} className="h-12 flex-1 border-white/30 bg-white/10 text-base text-white hover:bg-white/20">
                <Crop className="mr-2 h-4 w-4" />
                Ajustar pontas
              </Button>
            </div>
          </div>
        )}

        {phase === 'adjust' && (
          <div className="mx-auto max-w-md space-y-3">
            <p className={cn('text-base font-medium', tone === 'warning' ? 'text-amber-300' : 'text-white')}>
              {tone === 'warning' ? message : 'Arraste as bolinhas até as pontas do documento.'}
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setPhase('review')} className="h-12 flex-1 border-white/30 bg-white/10 text-base text-white hover:bg-white/20">
                Voltar
              </Button>
              <Button type="button" onClick={applyAdjust} className="h-12 flex-1 bg-emerald-500 text-base text-white hover:bg-emerald-600">
                <Check className="mr-2 h-4 w-4" />
                Pronto
              </Button>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="mx-auto max-w-md space-y-4 pb-[25dvh]">
            <p className="text-lg font-semibold text-amber-300">{errorText}</p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={close} className="h-12 flex-1 border-white/30 bg-white/10 text-base text-white hover:bg-white/20">
                Fechar
              </Button>
              <Button type="button" onClick={() => void startCamera()} className="h-12 flex-1 text-base">
                Tentar de novo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return mounted ? createPortal(overlay, document.body) : null;
}

export default DocumentScanner;
