'use client';

/**
 * Liga a lente (refração) e o toque "interativo" em TODAS as peças `.lg-glass`
 * da tela, sem mexer em cada componente.
 *
 * - Lente: para cada peça mede tamanho e arredondamento, gera o mapa de
 *   deslocamento (`refraction.ts`) e aplica `backdrop-filter: url(#filtro)`.
 *   Peças do mesmo tamanho dividem o mesmo filtro. Só em navegador Chromium;
 *   nos outros fica o vidro desfocado do CSS.
 * - Interativo (como o `isInteractive` do expo-glass-effect): ao tocar, a peça
 *   cresce um pouco com mola e acende um brilho no ponto do dedo/mouse.
 *
 * Respeita "reduzir transparência" e "reduzir movimento" do aparelho.
 * Iniciado por `useLgThemeScope()` (layouts dos painéis) e por `GlassView`.
 */

import { buildDisplacementMap, clampRadius, supportsBackdropRefraction } from './refraction';

const SVG_NS = 'http://www.w3.org/2000/svg';
const GLASS_SELECTOR = '.lg-glass';
const INTERACTIVE_SELECTOR = '.lg-interactive, a.lg-glass, button.lg-glass, .lg-tab';

type Variant = 'clear' | 'regular' | 'thick';

interface FilterEntry {
  id: string;
  node: SVGFilterElement;
  uses: number;
}

interface Tracked {
  key: string | null;
}

let users = 0;
let svgRoot: SVGSVGElement | null = null;
let mutationObserver: MutationObserver | null = null;
let resizeObserver: ResizeObserver | null = null;
let scheduled = 0;
let filterSeq = 0;
let refractionOn = false;
const filters = new Map<string, FilterEntry>();
const tracked = new Map<HTMLElement, Tracked>();
const pending = new Set<HTMLElement>();

function variantOf(el: HTMLElement): Variant {
  const v = el.dataset.lgVariant;
  if (v === 'clear' || v === 'regular' || v === 'thick') return v;
  if (el.classList.contains('lg-thick')) return 'thick';
  if (el.classList.contains('lg-bar')) return 'regular';
  return 'clear';
}

/** Desfoque e saturação de cada variante (o vidro "regular" pede leitura de texto) */
const VARIANT_LOOK: Record<Variant, { blur: number; saturate: number; strength: number }> = {
  clear: { blur: 1.5, saturate: 1.9, strength: 1 },
  regular: { blur: 2.5, saturate: 1.85, strength: 0.9 },
  thick: { blur: 14, saturate: 1.7, strength: 0.6 },
};

function ensureSvgRoot() {
  if (svgRoot && svgRoot.isConnected) return svgRoot;
  svgRoot = document.createElementNS(SVG_NS, 'svg');
  svgRoot.setAttribute('aria-hidden', 'true');
  svgRoot.setAttribute('width', '0');
  svgRoot.setAttribute('height', '0');
  svgRoot.setAttribute('data-lg-filters', '');
  svgRoot.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  svgRoot.appendChild(document.createElementNS(SVG_NS, 'defs'));
  document.body.appendChild(svgRoot);
  return svgRoot;
}

function mapToDataUrl(width: number, height: number, radius: number, bezel: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const pixels = buildDisplacementMap({ width, height, radius, bezel });
  ctx.putImageData(new ImageData(pixels, width, height), 0, 0);
  return canvas.toDataURL('image/png');
}

function createFilter(key: string, width: number, height: number, radius: number, variant: Variant) {
  const look = VARIANT_LOOK[variant];
  const short = Math.min(width, height);
  const bezel = Math.max(8, Math.min(28, short * 0.34));
  const offset = bezel * 0.9 * look.strength;
  const url = mapToDataUrl(width, height, radius, bezel);
  if (!url) return null;

  const id = `lg-refract-${++filterSeq}`;
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', id);
  filter.setAttribute('filterUnits', 'userSpaceOnUse');
  filter.setAttribute('primitiveUnits', 'userSpaceOnUse');
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', String(width));
  filter.setAttribute('height', String(height));
  // sRGB: o mapa precisa chegar "cru" (em linearRGB o 128 deixa de ser o meio)
  filter.setAttribute('color-interpolation-filters', 'sRGB');

  const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
  blur.setAttribute('in', 'SourceGraphic');
  blur.setAttribute('stdDeviation', String(look.blur));
  blur.setAttribute('edgeMode', 'duplicate');
  blur.setAttribute('result', 'blurred');

  const image = document.createElementNS(SVG_NS, 'feImage');
  image.setAttribute('href', url);
  image.setAttribute('x', '0');
  image.setAttribute('y', '0');
  image.setAttribute('width', String(width));
  image.setAttribute('height', String(height));
  image.setAttribute('preserveAspectRatio', 'none');
  image.setAttribute('result', 'map');

  const displace = document.createElementNS(SVG_NS, 'feDisplacementMap');
  displace.setAttribute('in', 'blurred');
  displace.setAttribute('in2', 'map');
  displace.setAttribute('scale', String(Math.round(offset * 2)));
  displace.setAttribute('xChannelSelector', 'R');
  displace.setAttribute('yChannelSelector', 'G');
  displace.setAttribute('result', 'bent');

  const saturate = document.createElementNS(SVG_NS, 'feColorMatrix');
  saturate.setAttribute('in', 'bent');
  saturate.setAttribute('type', 'saturate');
  saturate.setAttribute('values', String(look.saturate));

  filter.append(blur, image, displace, saturate);
  ensureSvgRoot().firstChild!.appendChild(filter);
  const entry: FilterEntry = { id, node: filter, uses: 0 };
  filters.set(key, entry);
  return entry;
}

function release(key: string | null) {
  if (!key) return;
  const entry = filters.get(key);
  if (!entry) return;
  entry.uses -= 1;
  if (entry.uses <= 0) {
    entry.node.remove();
    filters.delete(key);
  }
}

function clearRefraction(el: HTMLElement) {
  el.style.removeProperty('backdrop-filter');
  el.style.removeProperty('-webkit-backdrop-filter');
  delete el.dataset.lgRefract;
}

function applyTo(el: HTMLElement) {
  const state = tracked.get(el);
  if (!state) return;
  const rect = el.getBoundingClientRect();
  // tamanho sem a escala do toque/animação: offsetWidth ignora transform
  const width = Math.round(el.offsetWidth || rect.width);
  const height = Math.round(el.offsetHeight || rect.height);
  if (width < 8 || height < 8 || width * height > 1_200_000) {
    release(state.key);
    state.key = null;
    clearRefraction(el);
    return;
  }
  const radius = clampRadius(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, width, height);
  const variant = variantOf(el);
  const key = `${width}x${height}r${Math.round(radius)}${variant}`;
  if (state.key === key) return;

  let entry = filters.get(key);
  if (!entry) entry = createFilter(key, width, height, radius, variant) ?? undefined;
  release(state.key);
  if (!entry) {
    state.key = null;
    clearRefraction(el);
    return;
  }
  entry.uses += 1;
  state.key = key;
  el.style.setProperty('backdrop-filter', `url(#${entry.id})`);
  el.style.setProperty('-webkit-backdrop-filter', `url(#${entry.id})`);
  el.dataset.lgRefract = 'on';
}

function track(el: HTMLElement) {
  if (tracked.has(el)) return;
  tracked.set(el, { key: null });
  resizeObserver?.observe(el);
  pending.add(el);
}

function untrack(el: HTMLElement) {
  const state = tracked.get(el);
  if (!state) return;
  release(state.key);
  resizeObserver?.unobserve(el);
  tracked.delete(el);
}

function flush() {
  scheduled = 0;
  for (const el of Array.from(tracked.keys())) {
    if (!el.isConnected || !el.matches(GLASS_SELECTOR)) {
      if (el.isConnected) clearRefraction(el);
      untrack(el);
    }
  }
  document.querySelectorAll<HTMLElement>(GLASS_SELECTOR).forEach((el) => {
    if (el.dataset.lgRefract === 'off') return;
    track(el);
  });
  // mudança de classe pode trocar arredondamento/variante sem mudar o tamanho:
  // confere todas (filtro só é refeito quando a chave muda)
  tracked.forEach((_, el) => applyTo(el));
  pending.clear();
}

function schedule() {
  if (!scheduled) scheduled = requestAnimationFrame(flush);
}

/* ------------------------------ Toque interativo ----------------------------- */

let pressed: HTMLElement | null = null;

function setPointer(el: HTMLElement, event: PointerEvent) {
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--lg-px', `${event.clientX - rect.left}px`);
  el.style.setProperty('--lg-py', `${event.clientY - rect.top}px`);
}

function onPointerDown(event: PointerEvent) {
  const target = (event.target as Element | null)?.closest?.(INTERACTIVE_SELECTOR) as HTMLElement | null;
  if (!target || target.closest('[data-lg-static]')) return;
  pressed = target;
  setPointer(target, event);
  target.classList.add('lg-pressed');
}

function onPointerMove(event: PointerEvent) {
  if (pressed) setPointer(pressed, event);
}

function onPointerEnd() {
  pressed?.classList.remove('lg-pressed');
  pressed = null;
}

/* ---------------------------------- Ciclo ---------------------------------- */

function prefersSolid() {
  return window.matchMedia?.('(prefers-reduced-transparency: reduce)').matches;
}

/** true quando o navegador mostra a lente (equivale ao `isLiquidGlassAvailable` do Expo) */
export function isLiquidGlassAvailable() {
  if (typeof window === 'undefined') return false;
  return supportsBackdropRefraction(navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }) && !prefersSolid();
}

function start() {
  refractionOn = isLiquidGlassAvailable();
  if (refractionOn) {
    resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((e) => pending.add(e.target as HTMLElement));
      schedule();
    });
    mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    schedule();
  }
  document.addEventListener('pointerdown', onPointerDown, { passive: true });
  document.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerup', onPointerEnd, { passive: true });
  document.addEventListener('pointercancel', onPointerEnd, { passive: true });
}

function stop() {
  mutationObserver?.disconnect();
  resizeObserver?.disconnect();
  mutationObserver = null;
  resizeObserver = null;
  if (scheduled) cancelAnimationFrame(scheduled);
  scheduled = 0;
  for (const el of Array.from(tracked.keys())) {
    clearRefraction(el);
    untrack(el);
  }
  filters.forEach((f) => f.node.remove());
  filters.clear();
  svgRoot?.remove();
  svgRoot = null;
  document.removeEventListener('pointerdown', onPointerDown);
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerEnd);
  document.removeEventListener('pointercancel', onPointerEnd);
  onPointerEnd();
}

/** Liga o vidro da tela; devolve a função que desliga. Pode ser chamado várias vezes. */
export function startLiquidGlass() {
  if (typeof window === 'undefined') return () => {};
  users += 1;
  if (users === 1) start();
  else if (refractionOn) schedule();
  let done = false;
  return () => {
    if (done) return;
    done = true;
    users -= 1;
    if (users === 0) stop();
  };
}
