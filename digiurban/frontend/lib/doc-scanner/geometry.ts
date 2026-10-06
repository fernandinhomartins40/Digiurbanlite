/**
 * Contas do scanner de documentos: ordenar os 4 cantos, medir, endireitar a foto
 * (transformação de perspectiva) e clarear o papel. Tudo em canvas puro — antes
 * isso exigia o OpenCV.js (9 MB).
 */

export interface Pt {
  x: number;
  y: number;
}

/** Cantos na ordem: cima-esquerda, cima-direita, baixo-direita, baixo-esquerda */
export type Quad = [Pt, Pt, Pt, Pt];

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Põe 4 pontos quaisquer na ordem TL, TR, BR, BL */
export function orderQuad(points: Pt[]): Quad {
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const sorted = [...points].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  // sorted vai no sentido horário a partir do ângulo mais negativo; acha o TL (menor x+y)
  let start = 0;
  sorted.forEach((p, i) => {
    if (p.x + p.y < sorted[start].x + sorted[start].y) start = i;
  });
  const ordered = [0, 1, 2, 3].map((k) => sorted[(start + k) % 4]);
  return ordered as Quad;
}

export function quadArea(q: Quad): number {
  let sum = 0;
  for (let i = 0; i < 4; i += 1) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

export function isConvex(q: Quad): boolean {
  let sign = 0;
  for (let i = 0; i < 4; i += 1) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const c = q[(i + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 1e-6) return false;
    const s = Math.sign(cross);
    if (sign && s !== sign) return false;
    sign = s;
  }
  return true;
}

/** Quanto os cantos andaram entre dois quadros (fração da diagonal da imagem) */
export function quadShift(a: Quad, b: Quad, diagonal: number): number {
  return a.reduce((sum, p, i) => sum + dist(p, b[i]), 0) / 4 / Math.max(diagonal, 1);
}

export function scaleQuad(q: Quad, sx: number, sy: number, dx = 0, dy = 0): Quad {
  return q.map((p) => ({ x: p.x * sx + dx, y: p.y * sy + dy })) as Quad;
}

/** Formatos comuns (largura/altura): cartão (RG/CIN/CPF/CNH), A4 em pé e deitado */
const KNOWN_RATIOS = [1.586, 1.5, 1 / 1.414, 1.414];

/** Tamanho da foto endireitada: mede os lados e encaixa num formato conhecido se estiver perto */
export function outputSize(q: Quad, maxLongSide = 1800): { width: number; height: number } {
  const width = (dist(q[0], q[1]) + dist(q[3], q[2])) / 2;
  const height = (dist(q[0], q[3]) + dist(q[1], q[2])) / 2;
  let ratio = width / Math.max(height, 1);
  const near = KNOWN_RATIOS.find((known) => Math.abs(ratio - known) / known < 0.1);
  if (near) ratio = near;
  const long = Math.min(maxLongSide, Math.max(width, height) * 1.15);
  return ratio >= 1
    ? { width: Math.round(long), height: Math.round(long / ratio) }
    : { width: Math.round(long * ratio), height: Math.round(long) };
}

/** Matriz 3x3 que leva os 4 pontos `from` para os 4 pontos `to` */
export function homography(from: Quad, to: Quad): number[] {
  const a: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const { x, y } = from[i];
    const { x: u, y: v } = to[i];
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  // eliminação de Gauss com pivô
  for (let col = 0; col < 8; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < 8; row += 1) if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    [b[col], b[pivot]] = [b[pivot], b[col]];
    const div = a[col][col] || 1e-12;
    for (let row = 0; row < 8; row += 1) {
      if (row === col) continue;
      const factor = a[row][col] / div;
      if (!factor) continue;
      for (let k = col; k < 8; k += 1) a[row][k] -= factor * a[col][k];
      b[row] -= factor * b[col];
    }
  }
  const h = b.map((value, i) => value / (a[i][i] || 1e-12));
  return [...h, 1];
}

/** Recorta e endireita o documento (amostragem bilinear) */
export function warpQuad(source: HTMLCanvasElement, quad: Quad, width: number, height: number): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const sctx = source.getContext('2d', { willReadFrequently: true });
  const octx = out.getContext('2d');
  if (!sctx || !octx) return source;
  const src = sctx.getImageData(0, 0, source.width, source.height);
  const dst = octx.createImageData(width, height);
  const sw = source.width;
  const sh = source.height;
  const sdata = src.data;
  const ddata = dst.data;
  // de cada ponto da saída para o ponto da foto original
  const h = homography(
    [
      { x: 0, y: 0 },
      { x: width - 1, y: 0 },
      { x: width - 1, y: height - 1 },
      { x: 0, y: height - 1 },
    ],
    quad
  );
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const w = h[6] * x + h[7] * y + 1;
      const sx = (h[0] * x + h[1] * y + h[2]) / w;
      const sy = (h[3] * x + h[4] * y + h[5]) / w;
      const o = (y * width + x) * 4;
      if (sx < 0 || sy < 0 || sx > sw - 1 || sy > sh - 1) {
        ddata[o] = ddata[o + 1] = ddata[o + 2] = 255;
        ddata[o + 3] = 255;
        continue;
      }
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = Math.min(x0 + 1, sw - 1);
      const y1 = Math.min(y0 + 1, sh - 1);
      const fx = sx - x0;
      const fy = sy - y0;
      const i00 = (y0 * sw + x0) * 4;
      const i10 = (y0 * sw + x1) * 4;
      const i01 = (y1 * sw + x0) * 4;
      const i11 = (y1 * sw + x1) * 4;
      for (let c = 0; c < 3; c += 1) {
        const top = sdata[i00 + c] + (sdata[i10 + c] - sdata[i00 + c]) * fx;
        const bottom = sdata[i01 + c] + (sdata[i11 + c] - sdata[i01 + c]) * fx;
        ddata[o + c] = top + (bottom - top) * fy;
      }
      ddata[o + 3] = 255;
    }
  }
  octx.putImageData(dst, 0, 0);
  return out;
}

/** Recorte reto (sem perspectiva), usado quando a câmera não acha o documento sozinha */
export function cropRect(source: HTMLCanvasElement, x: number, y: number, width: number, height: number): HTMLCanvasElement {
  const out = document.createElement('canvas');
  const sx = Math.max(0, Math.round(x));
  const sy = Math.max(0, Math.round(y));
  out.width = Math.max(1, Math.min(Math.round(width), source.width - sx));
  out.height = Math.max(1, Math.min(Math.round(height), source.height - sy));
  out.getContext('2d')?.drawImage(source, sx, sy, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

/** Clareia o papel e dá contraste ao texto (nível automático, sem mudar as cores) */
export function enhanceDocument(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 16) {
    histogram[(data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8] += 1;
  }
  const total = histogram.reduce((sum, n) => sum + n, 0);
  let acc = 0;
  let low = 0;
  let high = 255;
  for (let v = 0; v < 256; v += 1) {
    acc += histogram[v];
    if (acc <= total * 0.01) low = v;
    if (acc <= total * 0.97) high = v;
  }
  if (high - low < 40) return canvas; // foto já sem contraste útil: não força
  const scale = 255 / (high - low);
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v += 1) lut[v] = (v - low) * scale;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Junta frente e verso numa imagem só (um arquivo por envio, como antes) */
export function stackVertically(parts: HTMLCanvasElement[], gap = 32): HTMLCanvasElement {
  if (parts.length === 1) return parts[0];
  const width = Math.max(...parts.map((part) => part.width));
  const height = parts.reduce((sum, part) => sum + part.height, 0) + gap * (parts.length - 1);
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) return parts[0];
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  let y = 0;
  for (const part of parts) {
    ctx.drawImage(part, Math.round((width - part.width) / 2), y);
    y += part.height + gap;
  }
  return out;
}
