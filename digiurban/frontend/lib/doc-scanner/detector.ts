/**
 * Acha o documento na imagem da câmera — modelo DocAligner (DocsaidLab, código
 * Apache 2.0), versão pequena "lcnet050 point" (4,9 MB), rodando no próprio
 * celular com o onnxruntime-web (MIT). Devolve os 4 cantos e a confiança de que
 * há um documento na imagem.
 *
 * Só é carregado quando a plataforma liga a "câmera inteligente" no painel
 * (Super-admin › Privacidade › Documentos) — os arquivos ficam em /doc-scanner.
 */

import { orderQuad, Quad } from './geometry';

const BASE = '/doc-scanner/';
const ORT_URL = `${BASE}ort.wasm.min.mjs`;
const MODEL_URL = `${BASE}docaligner-lcnet050-point.onnx`;
const INPUT = 256;

export interface Detection {
  /** cantos na imagem de entrada (px) — null quando não há documento */
  quad: Quad | null;
  /** 0 a 1 */
  confidence: number;
  /** nitidez (variação do contorno do texto, 256 px) */
  sharpness: number;
  /** fração de pontos estourados de luz dentro do documento */
  glare: number;
}

export interface DocDetector {
  detect(source: CanvasImageSource, width: number, height: number): Promise<Detection>;
}

let loading: Promise<DocDetector> | null = null;

export function loadDocDetector(): Promise<DocDetector> {
  if (!loading) {
    loading = createDetector().catch((error) => {
      loading = null;
      throw error;
    });
  }
  return loading;
}

async function createDetector(): Promise<DocDetector> {
  const ort: any = await import(/* webpackIgnore: true */ ORT_URL as string);
  ort.env.wasm.wasmPaths = BASE;
  // uma linha de execução: não exige isolamento de origem (SharedArrayBuffer)
  ort.env.wasm.numThreads = 1;
  const session = await ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });

  const canvas = document.createElement('canvas');
  canvas.width = INPUT;
  canvas.height = INPUT;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas indisponível');
  const tensorData = new Float32Array(3 * INPUT * INPUT);
  const gray = new Float32Array(INPUT * INPUT);
  let busy = false;

  return {
    async detect(source, width, height) {
      if (busy) return { quad: null, confidence: 0, sharpness: 0, glare: 0 };
      busy = true;
      try {
        // a imagem inteira esticada para 256x256 (como no treino do modelo)
        ctx.drawImage(source, 0, 0, INPUT, INPUT);
        const { data } = ctx.getImageData(0, 0, INPUT, INPUT);
        const plane = INPUT * INPUT;
        for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
          tensorData[p] = data[i] / 255;
          tensorData[p + plane] = data[i + 1] / 255;
          tensorData[p + plane * 2] = data[i + 2] / 255;
          gray[p] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        }
        const input = new ort.Tensor('float32', tensorData, [1, 3, INPUT, INPUT]);
        const output = await session.run({ img: input });
        const points = output.points.data as Float32Array;
        const confidence = Number((output.has_obj.data as Float32Array)[0]) || 0;
        if (confidence < 0.5) return { quad: null, confidence, sharpness: 0, glare: 0 };

        const quad = orderQuad([0, 1, 2, 3].map((k) => ({ x: points[k * 2] * width, y: points[k * 2 + 1] * height })));
        const small = orderQuad([0, 1, 2, 3].map((k) => ({ x: points[k * 2] * INPUT, y: points[k * 2 + 1] * INPUT })));
        const { sharpness, glare } = measureInside(gray, small);
        return { quad, confidence, sharpness, glare };
      } finally {
        busy = false;
      }
    },
  };
}

/** Nitidez (variância do laplaciano) e reflexo, só na caixa do documento */
function measureInside(gray: Float32Array, quad: Quad) {
  const xs = quad.map((p) => p.x);
  const ys = quad.map((p) => p.y);
  // um pouco para dentro, para não medir a borda da mesa
  const pad = 0.1;
  const x0 = Math.max(1, Math.floor(Math.min(...xs) + (Math.max(...xs) - Math.min(...xs)) * pad));
  const x1 = Math.min(INPUT - 2, Math.ceil(Math.max(...xs) - (Math.max(...xs) - Math.min(...xs)) * pad));
  const y0 = Math.max(1, Math.floor(Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * pad));
  const y1 = Math.min(INPUT - 2, Math.ceil(Math.max(...ys) - (Math.max(...ys) - Math.min(...ys)) * pad));
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  let bright = 0;
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const i = y * INPUT + x;
      const lap = gray[i - 1] + gray[i + 1] + gray[i - INPUT] + gray[i + INPUT] - 4 * gray[i];
      sum += lap;
      sumSq += lap * lap;
      n += 1;
      if (gray[i] > 248) bright += 1;
    }
  }
  if (!n) return { sharpness: 0, glare: 0 };
  const mean = sum / n;
  return { sharpness: sumSq / n - mean * mean, glare: bright / n };
}

/** A plataforma liberou a câmera inteligente? (consulta pública, guardada por 1 min) */
let configCache: { at: number; value: boolean } | null = null;

export async function smartCameraEnabled(): Promise<boolean> {
  if (configCache && Date.now() - configCache.at < 60_000) return configCache.value;
  try {
    const response = await fetch('/api/public/doc-scanner', { credentials: 'same-origin' });
    const body = await response.json();
    configCache = { at: Date.now(), value: Boolean(body?.smartCamera) };
  } catch {
    configCache = { at: Date.now(), value: false };
  }
  return configCache.value;
}
