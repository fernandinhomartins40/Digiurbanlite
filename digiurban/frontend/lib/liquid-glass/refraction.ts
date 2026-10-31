/**
 * Refração do Liquid Glass (o "efeito lente" do vidro da Apple).
 *
 * No iOS 26 o vidro (UIGlassEffect — o mesmo que o `expo-glass-effect` usa no
 * app nativo) não é só desfoque: a borda da peça funciona como uma lente
 * convexa e ENTORTA o que está atrás. O `expo-glass-effect` só existe no
 * iPhone (no navegador ele vira uma caixa comum), então na web a lente é
 * reproduzida com um filtro SVG (`feDisplacementMap`) aplicado em
 * `backdrop-filter`.
 *
 * Este arquivo é a parte PURA: dado o tamanho, o arredondamento e a largura
 * da borda, calcula o mapa de deslocamento (R = x, G = y; 128 = parado).
 * O perfil da borda é um "squircle" convexo e o desvio vem da lei de Snell
 * (índice 1,5 do vidro) — a imagem se curva perto da borda e fica reta no meio.
 */

export interface RefractionShape {
  width: number;
  height: number;
  /** Arredondamento dos cantos (px). Maior que metade do lado = pílula/círculo */
  radius: number;
  /** Largura da faixa curva da borda (px) — fora dela o vidro é plano */
  bezel: number;
  /** Aumento no meio (0..1), como a gota de vidro da aba selecionada do iOS 26 */
  magnify?: number;
}

const GLASS_INDEX = 1.5;
const LUT_SIZE = 128;

/** Altura do vidro na borda: 0 na beirada, 1 onde a borda termina (squircle convexo) */
function surfaceHeight(x: number) {
  const t = Math.min(1, Math.max(0, x));
  return Math.pow(1 - Math.pow(1 - t, 4), 0.25);
}

/** Desvio (0..1) ao longo da borda: 1 na beirada, 0 onde o vidro fica plano */
const DISPLACEMENT_LUT: Float32Array = (() => {
  const lut = new Float32Array(LUT_SIZE);
  const step = 1 / LUT_SIZE;
  let max = 0;
  for (let i = 0; i < LUT_SIZE; i++) {
    const x = (i + 0.5) / LUT_SIZE;
    const slope = (surfaceHeight(x + step / 2) - surfaceHeight(x - step / 2)) / step;
    const incident = Math.atan(slope);
    const refracted = Math.asin(Math.sin(incident) / GLASS_INDEX);
    const value = Math.tan(incident - refracted);
    lut[i] = value;
    if (value > max) max = value;
  }
  for (let i = 0; i < LUT_SIZE; i++) lut[i] = max > 0 ? lut[i] / max : 0;
  return lut;
})();

export function displacementAt(depth: number, bezel: number) {
  if (bezel <= 0 || depth >= bezel || depth < 0) return 0;
  const i = Math.min(LUT_SIZE - 1, Math.floor((depth / bezel) * LUT_SIZE));
  return DISPLACEMENT_LUT[i];
}

export function clampRadius(radius: number, width: number, height: number) {
  return Math.max(0, Math.min(radius, width / 2, height / 2));
}

/**
 * Mapa RGBA (largura × altura × 4). Cada pixel diz de onde a imagem de trás é
 * buscada: perto da borda busca mais para dentro (lente), no meio fica parado.
 */
export function buildDisplacementMap(shape: RefractionShape): Uint8ClampedArray {
  const w = Math.max(1, Math.round(shape.width));
  const h = Math.max(1, Math.round(shape.height));
  const r = clampRadius(shape.radius, w, h);
  const bezel = Math.max(1, Math.min(shape.bezel, w / 2, h / 2));
  const data = new Uint8ClampedArray(w * h * 4);
  const hx = w / 2 - r;
  const hy = h / 2 - r;
  const magnify = Math.max(0, Math.min(1, shape.magnify || 0));

  for (let y = 0; y < h; y++) {
    const py = y + 0.5 - h / 2;
    const ay = Math.abs(py);
    const sy = py < 0 ? -1 : 1;
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - w / 2;
      const ax = Math.abs(px);
      const sx = px < 0 ? -1 : 1;
      const qx = ax - hx;
      const qy = ay - hy;

      // distância até a borda (positiva por dentro) e a direção para fora
      let depth: number;
      let nx = 0;
      let ny = 0;
      if (qx > 0 && qy > 0) {
        const len = Math.hypot(qx, qy);
        depth = r - len;
        if (len > 0) {
          nx = (qx / len) * sx;
          ny = (qy / len) * sy;
        }
      } else if (qx > qy) {
        depth = r - qx;
        nx = sx;
      } else {
        depth = r - qy;
        ny = sy;
      }

      const o = (y * w + x) * 4;
      const m = depth < 0 ? 0 : displacementAt(depth, bezel);
      // busca para DENTRO: deslocamento oposto à normal (+ aumento: puxa para o centro)
      let dx = -nx * m - (px / (w / 2)) * magnify;
      let dy = -ny * m - (py / (h / 2)) * magnify;
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      data[o] = Math.round(128 + dx * 127);
      data[o + 1] = Math.round(128 + dy * 127);
      data[o + 2] = 128;
      data[o + 3] = 255;
    }
  }
  return data;
}

/**
 * Onde a lente funciona: só nos navegadores Chromium (Chrome, Edge, Samsung,
 * Android). Safari e Firefox ainda não aceitam filtro SVG em `backdrop-filter`
 * — lá fica o vidro desfocado de sempre. No iPhone todo navegador é Safari por
 * dentro, então também fica o desfoque.
 */
export function supportsBackdropRefraction(nav: { userAgent?: string; userAgentData?: { brands?: { brand: string }[] } } | undefined) {
  if (!nav) return false;
  const ua = nav.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return false;
  if (/Firefox\//.test(ua)) return false;
  const brands = nav.userAgentData?.brands;
  if (brands && brands.some((b) => /Chromium|Google Chrome|Microsoft Edge/i.test(b.brand))) return true;
  return /Chrome\/\d+/.test(ua) && !/Edge\/\d+/.test(ua);
}
