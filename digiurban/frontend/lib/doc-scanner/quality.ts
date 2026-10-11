/**
 * Conferências rápidas da foto já recortada, feitas no próprio celular, para avisar
 * a pessoa ANTES de enviar: ficou tremida, escura, com reflexo, ou é o mesmo lado
 * do documento duas vezes (esqueceu de virar). Só avisam — quem decide é a pessoa.
 */

const SAMPLE = 480;

function grayscale(canvas: HTMLCanvasElement, maxSide: number) {
  const ratio = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
  const width = Math.max(8, Math.round(canvas.width * ratio));
  const height = Math.max(8, Math.round(canvas.height * ratio));
  const small = document.createElement('canvas');
  small.width = width;
  small.height = height;
  const ctx = small.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(canvas, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) gray[p] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) / 256;
  return { gray, width, height };
}

export interface PhotoCheck {
  /** frase curta para mostrar, ou null se está tudo bem */
  warning: string | null;
  sharpness: number;
  brightness: number;
  glare: number;
}

/** Medir ANTES de clarear (o clareamento esconde foto escura e estoura reflexo) */
export function checkPhoto(canvas: HTMLCanvasElement, kind: { shape: string }): PhotoCheck {
  const g = grayscale(canvas, SAMPLE);
  if (!g) return { warning: null, sharpness: 0, brightness: 0, glare: 0 };
  const { gray, width, height } = g;
  // miolo da imagem: a borda do recorte pode pegar um pouco da mesa
  const x0 = Math.floor(width * 0.08);
  const x1 = Math.ceil(width * 0.92);
  const y0 = Math.floor(height * 0.08);
  const y1 = Math.ceil(height * 0.92);
  let sum = 0;
  let sumSq = 0;
  let light = 0;
  let bright = 0;
  let n = 0;
  for (let y = Math.max(1, y0); y < Math.min(height - 1, y1); y += 1) {
    for (let x = Math.max(1, x0); x < Math.min(width - 1, x1); x += 1) {
      const i = y * width + x;
      const lap = gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width] - 4 * gray[i];
      sum += lap;
      sumSq += lap * lap;
      light += gray[i];
      if (gray[i] > 250) bright += 1;
      n += 1;
    }
  }
  if (!n) return { warning: null, sharpness: 0, brightness: 0, glare: 0 };
  const mean = sum / n;
  const sharpness = sumSq / n - mean * mean;
  const brightness = light / n;
  const glare = bright / n;

  let warning: string | null = null;
  // foto de lugar não tem texto: só confere se está escura
  if (brightness < 55) warning = 'A foto ficou escura. Procure um lugar mais claro ou ligue a lanterna.';
  else if (kind.shape !== 'scene' && kind.shape !== 'photo' && sharpness < 14) warning = 'A foto pode ter ficado tremida. Confira se dá para ler.';
  else if (kind.shape !== 'scene' && glare > 0.06) warning = 'Tem reflexo de luz em cima do documento. Confira se dá para ler.';
  return { warning, sharpness, brightness, glare };
}

const GRID = 16;
/** diferença de brilho (0–255) entre vizinhos que conta como "tem desenho aqui" */
const EDGE = 8;

/**
 * "Impressão digital" do MIOLO do documento: em 16x16 pontos, se cada ponto é
 * mais claro (+1), mais escuro (-1) ou igual (0) ao vizinho da direita. A borda
 * fica de fora — frente e verso do mesmo cartão têm o mesmo contorno e fundo.
 */
export function imageFingerprint(canvas: HTMLCanvasElement): Int8Array | null {
  const small = document.createElement('canvas');
  small.width = GRID + 1;
  small.height = GRID;
  const ctx = small.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const mx = canvas.width * 0.12;
  const my = canvas.height * 0.12;
  ctx.drawImage(canvas, mx, my, canvas.width - mx * 2, canvas.height - my * 2, 0, 0, GRID + 1, GRID);
  const data = ctx.getImageData(0, 0, GRID + 1, GRID).data;
  const marks = new Int8Array(GRID * GRID);
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      const a = (y * (GRID + 1) + x) * 4;
      const b = a + 4;
      const la = (data[a] * 77 + data[a + 1] * 150 + data[a + 2] * 29) >> 8;
      const lb = (data[b] * 77 + data[b + 1] * 150 + data[b + 2] * 29) >> 8;
      marks[y * GRID + x] = la - lb > EDGE ? 1 : lb - la > EDGE ? -1 : 0;
    }
  }
  return marks;
}

/** Fração dos pontos com desenho que não batem (0 = iguais) */
function mismatch(a: Int8Array, b: Int8Array, flipped: boolean): number | null {
  const n = a.length;
  let compared = 0;
  let different = 0;
  for (let i = 0; i < n; i += 1) {
    // girada 180°: a ordem inverte e "mais claro que o vizinho" vira "mais escuro"
    const other = flipped ? -b[n - 1 - i] : b[i];
    if (!a[i] && !other) continue;
    compared += 1;
    if (a[i] !== other) different += 1;
  }
  // quase nada desenhado (folha em branco): não dá para dizer
  return compared < 12 ? null : different / compared;
}

/** Mesma foto (ou o mesmo lado de novo)? Compara também de ponta-cabeça. */
export function looksLikeSameSide(a: HTMLCanvasElement, b: HTMLCanvasElement): boolean {
  const fa = imageFingerprint(a);
  const fb = imageFingerprint(b);
  if (!fa || !fb) return false;
  const scores = [mismatch(fa, fb, false), mismatch(fa, fb, true)].filter((s): s is number => s !== null);
  return scores.length > 0 && Math.min(...scores) <= 0.3;
}
