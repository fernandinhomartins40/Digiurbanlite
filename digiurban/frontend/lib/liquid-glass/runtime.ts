'use client';

/**
 * Liga o Liquid Glass em TODAS as peças `.lg-glass` da tela, sem mexer em cada
 * componente:
 *
 * - LENTE: para cada peça mede tamanho e arredondamento, gera o mapa de
 *   deslocamento (`refraction.ts`) e aplica `backdrop-filter: url(#filtro)`,
 *   com uma franja de cor bem leve na borda (as três cores entortam um pouco
 *   diferente, como num vidro de verdade). Peças do mesmo tamanho dividem o
 *   filtro. Só em navegador Chromium; nos outros fica o vidro desfocado do CSS.
 * - CÁPSULA DA ABA (iOS 26): em toda barra de vidro com abas `.lg-tab`, uma
 *   cápsula discreta fica atrás da aba aberta e DESLIZA com mola quando a aba
 *   muda. Ao tocar, a cápsula vira uma gota de vidro transparente que aumenta
 *   o que está embaixo; dá para arrastar o dedo até outra aba e soltar.
 * - TOQUE (o `isInteractive` do expo-glass-effect): botões de vidro crescem
 *   um pouco com mola e acendem um brilho no ponto do toque.
 *
 * Respeita "reduzir transparência" e "reduzir movimento" do aparelho.
 * Iniciado por `useLgThemeScope()` (layouts dos painéis) e por `GlassView`.
 */

import { buildDisplacementMap, clampRadius, supportsBackdropRefraction } from './refraction';

const SVG_NS = 'http://www.w3.org/2000/svg';
const GLASS_SELECTOR = '.lg-glass';
const INTERACTIVE_SELECTOR = '.lg-interactive, a.lg-glass, button.lg-glass, .lg-tab';
const INDICATOR_CLASS = 'lg-tab-indicator';

type Variant = 'clear' | 'regular' | 'thick';

interface FilterEntry {
  id: string;
  node: SVGFilterElement;
  uses: number;
}

interface Tracked {
  key: string | null;
  indicator: HTMLSpanElement | null;
  /** Aba tocada: a cápsula fica nela enquanto a tela nova abre (sem voltar e ir de novo) */
  hold: { tab: HTMLElement; until: number } | null;
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

function variantOf(el: HTMLElement): Variant {
  const v = el.dataset.lgVariant;
  if (v === 'clear' || v === 'regular' || v === 'thick') return v;
  if (el.classList.contains('lg-thick')) return 'thick';
  if (el.classList.contains('lg-bar')) return 'regular';
  return 'clear';
}

/**
 * Cada variante: desfoque, saturação (baixa — o vidro da Apple não "pinta" a
 * cor de trás), força da lente, aumento no meio e franja de cor na borda.
 */
const VARIANT_LOOK: Record<Variant, { blur: number; saturate: number; strength: number; magnify: number; fringe: number }> = {
  // "vidro de verdade" (o do iOS 26): quase sem desfoque, lente forte na borda e
  // um leve aumento no meio — o que está atrás aparece nítido e entortado
  clear: { blur: 0.6, saturate: 1.1, strength: 1.35, magnify: 0.1, fringe: 0.035 },
  regular: { blur: 0.8, saturate: 1.1, strength: 1.3, magnify: 0.1, fringe: 0.035 },
  thick: { blur: 16, saturate: 1.15, strength: 0.7, magnify: 0, fringe: 0 },
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

function mapToDataUrl(width: number, height: number, radius: number, bezel: number, magnify: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const pixels = buildDisplacementMap({ width, height, radius, bezel, magnify });
  ctx.putImageData(new ImageData(pixels, width, height), 0, 0);
  return canvas.toDataURL('image/png');
}

function fe<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
  return node;
}

/** Mantém só um canal de cor (para a franja: cada cor entorta um pouco diferente) */
const CHANNEL_ONLY = {
  R: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
  G: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
  B: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
};

function createFilter(key: string, width: number, height: number, radius: number, variant: Variant) {
  const look = VARIANT_LOOK[variant];
  const short = Math.min(width, height);
  // borda curva larga (metade da altura numa pílula), como o vidro grosso da Apple
  const bezel = variant === 'thick' ? Math.max(8, Math.min(30, short * 0.38)) : Math.max(10, Math.min(40, short * 0.5));
  const scale = Math.round(bezel * 0.95 * look.strength * 2);
  const url = mapToDataUrl(width, height, radius, bezel, look.magnify);
  if (!url) return null;

  const id = `lg-refract-${++filterSeq}`;
  const filter = fe('filter', {
    id,
    filterUnits: 'userSpaceOnUse',
    primitiveUnits: 'userSpaceOnUse',
    x: 0,
    y: 0,
    width,
    height,
    // sRGB: o mapa precisa chegar "cru" (em linearRGB o 128 deixa de ser o meio)
    'color-interpolation-filters': 'sRGB',
  });

  const parts: SVGElement[] = [
    fe('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: look.blur, edgeMode: 'duplicate', result: 'blurred' }),
    fe('feImage', { href: url, x: 0, y: 0, width, height, preserveAspectRatio: 'none', result: 'map' }),
  ];

  const displace = (s: number, result: string) =>
    fe('feDisplacementMap', { in: 'blurred', in2: 'map', scale: s, xChannelSelector: 'R', yChannelSelector: 'G', result });

  if (look.fringe > 0) {
    // vermelho entorta menos, azul mais: franja de cor bem fina só na borda
    const f = look.fringe;
    parts.push(
      displace(Math.round(scale * (1 - f)), 'dR'),
      fe('feColorMatrix', { in: 'dR', type: 'matrix', values: CHANNEL_ONLY.R, result: 'cR' }),
      displace(scale, 'dG'),
      fe('feColorMatrix', { in: 'dG', type: 'matrix', values: CHANNEL_ONLY.G, result: 'cG' }),
      displace(Math.round(scale * (1 + f)), 'dB'),
      fe('feColorMatrix', { in: 'dB', type: 'matrix', values: CHANNEL_ONLY.B, result: 'cB' }),
      fe('feComposite', { in: 'cR', in2: 'cG', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'cRG' }),
      fe('feComposite', { in: 'cRG', in2: 'cB', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'bent' })
    );
  } else {
    parts.push(displace(scale, 'bent'));
  }
  parts.push(fe('feColorMatrix', { in: 'bent', type: 'saturate', values: look.saturate }));

  filter.append(...parts);
  ensureSvgRoot().firstChild!.appendChild(filter);
  const entry: FilterEntry = { id, node: filter, uses: 0 };
  filters.set(key, entry);
  return entry;
}

function acquire(key: string, width: number, height: number, radius: number, variant: Variant) {
  let entry = filters.get(key);
  if (!entry) entry = createFilter(key, width, height, radius, variant) ?? undefined;
  if (entry) entry.uses += 1;
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

function setBackdrop(el: HTMLElement, id: string | null) {
  if (id) {
    el.style.setProperty('backdrop-filter', `url(#${id})`);
    el.style.setProperty('-webkit-backdrop-filter', `url(#${id})`);
  } else {
    el.style.removeProperty('backdrop-filter');
    el.style.removeProperty('-webkit-backdrop-filter');
  }
}

function clearRefraction(el: HTMLElement) {
  setBackdrop(el, null);
  delete el.dataset.lgRefract;
}

function applyRefraction(el: HTMLElement, state: Tracked) {
  // tamanho sem a escala do toque/animação: offsetWidth ignora transform
  const width = Math.round(el.offsetWidth);
  const height = Math.round(el.offsetHeight);
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

  const entry = acquire(key, width, height, radius, variant);
  release(state.key);
  state.key = entry ? key : null;
  if (!entry) {
    clearRefraction(el);
    return;
  }
  setBackdrop(el, entry.id);
  el.dataset.lgRefract = 'on';
}

/* ------------------------------ Cápsula da aba ------------------------------ */

/** Abas que pertencem a esta barra (não a uma peça de vidro de dentro) */
function tabsOf(el: HTMLElement) {
  return Array.from(el.querySelectorAll<HTMLElement>('.lg-tab')).filter(
    (t) => !t.classList.contains('lg-glass') && t.parentElement?.closest(GLASS_SELECTOR) === el
  );
}

/** Posição de um filho dentro da barra, sem contar escalas/animações */
function offsetWithin(child: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = child;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    const parent = node.offsetParent as HTMLElement | null;
    if (!parent || !root.contains(parent) && parent !== root) {
      const a = child.getBoundingClientRect();
      const b = root.getBoundingClientRect();
      return { x: a.left - b.left - root.clientLeft, y: a.top - b.top - root.clientTop };
    }
    node = parent;
  }
  return { x, y };
}

function placeIndicator(indicator: HTMLElement, root: HTMLElement, tab: HTMLElement | null, instant = false) {
  if (!tab || tab.offsetWidth === 0) {
    indicator.style.opacity = '0';
    return;
  }
  const { x, y } = offsetWithin(tab, root);
  if (instant || indicator.style.opacity !== '1') indicator.classList.add('lg-no-anim');
  indicator.style.width = `${tab.offsetWidth}px`;
  indicator.style.height = `${tab.offsetHeight}px`;
  indicator.style.transform = `translate(${x}px, ${y}px)`;
  indicator.style.borderRadius = getComputedStyle(tab).borderTopLeftRadius;
  indicator.style.opacity = '1';
  if (indicator.classList.contains('lg-no-anim')) {
    void indicator.offsetWidth;
    requestAnimationFrame(() => indicator.classList.remove('lg-no-anim'));
  }
}

function syncIndicator(el: HTMLElement, state: Tracked) {
  const tabs = tabsOf(el);
  if (tabs.length < 2) {
    state.indicator?.remove();
    state.indicator = null;
    delete el.dataset.lgIndicator;
    return;
  }
  if (!state.indicator || !state.indicator.isConnected) {
    const span = document.createElement('span');
    span.className = INDICATOR_CLASS;
    span.setAttribute('aria-hidden', 'true');
    span.style.opacity = '0';
    el.appendChild(span);
    state.indicator = span;
  }
  el.dataset.lgIndicator = 'on';
  if (drag && drag.root === el) return; // durante o toque quem manda é o dedo
  const active = tabs.find((t) => t.classList.contains('lg-tab-on') && t.offsetWidth > 0) || null;
  const hold = state.hold;
  if (hold && (hold.tab === active || !hold.tab.isConnected || performance.now() > hold.until)) state.hold = null;
  if (state.hold) {
    placeIndicator(state.indicator, el, state.hold.tab);
    window.setTimeout(schedule, Math.max(0, state.hold.until - performance.now()) + 20);
    return;
  }
  placeIndicator(state.indicator, el, active);
}

/* ---------------------------------- Varredura --------------------------------- */

function track(el: HTMLElement) {
  if (tracked.has(el)) return;
  tracked.set(el, { key: null, indicator: null, hold: null });
  resizeObserver?.observe(el);
}

function untrack(el: HTMLElement) {
  const state = tracked.get(el);
  if (!state) return;
  release(state.key);
  state.indicator?.remove();
  resizeObserver?.unobserve(el);
  tracked.delete(el);
}

function flush() {
  scheduled = 0;
  for (const el of Array.from(tracked.keys())) {
    if (!el.isConnected || !el.matches(GLASS_SELECTOR)) {
      if (el.isConnected) {
        clearRefraction(el);
        delete el.dataset.lgIndicator;
      }
      untrack(el);
    }
  }
  document.querySelectorAll<HTMLElement>(GLASS_SELECTOR).forEach((el) => {
    if (el.dataset.lgRefract !== 'off') track(el);
  });
  // mudança de classe pode trocar arredondamento/variante/aba aberta sem mudar
  // o tamanho: confere todas (filtro só é refeito quando a chave muda)
  tracked.forEach((state, el) => {
    if (refractionOn) applyRefraction(el, state);
    syncIndicator(el, state);
  });
}

function schedule() {
  if (!scheduled) scheduled = requestAnimationFrame(flush);
}

/* ----------------------------------- Toque ----------------------------------- */

let pressed: HTMLElement | null = null;
let drag: { root: HTMLElement; state: Tracked; startX: number; startTab: HTMLElement; moved: boolean } | null = null;

function setPointer(el: HTMLElement, event: PointerEvent) {
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--lg-px', `${event.clientX - rect.left}px`);
  el.style.setProperty('--lg-py', `${event.clientY - rect.top}px`);
}

/**
 * A gota: a cápsula vira vidro transparente maior (borda de luz + sombra) e o
 * ícone embaixo cresce. Sem lente aqui de propósito: dentro de uma barra que
 * já é vidro o navegador só entrega à gota o desenho da própria barra, e a
 * lente sairia cinza.
 */
function lift(state: Tracked) {
  state.indicator?.classList.add('lg-lift');
}

function drop(state: Tracked) {
  state.indicator?.classList.remove('lg-lift');
}

function tabAt(root: HTMLElement, clientX: number) {
  const tabs = tabsOf(root).filter((t) => t.offsetWidth > 0);
  let best: HTMLElement | null = null;
  let bestDist = Infinity;
  tabs.forEach((t) => {
    const r = t.getBoundingClientRect();
    const d = clientX < r.left ? r.left - clientX : clientX > r.right ? clientX - r.right : 0;
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  });
  return best as HTMLElement | null;
}

function onPointerDown(event: PointerEvent) {
  const target = (event.target as Element | null)?.closest?.(INTERACTIVE_SELECTOR) as HTMLElement | null;
  if (!target || target.closest('[data-lg-static]')) return;
  pressed = target;
  setPointer(target, event);
  target.classList.add('lg-pressed');

  // aba dentro de barra com cápsula: a cápsula vem até o dedo e vira gota
  const root = target.classList.contains('lg-tab') ? (target.closest('[data-lg-indicator]') as HTMLElement | null) : null;
  const state = root ? tracked.get(root) : undefined;
  if (root && state?.indicator && !target.classList.contains('lg-glass')) {
    drag = { root, state, startX: event.clientX, startTab: target, moved: false };
    placeIndicator(state.indicator, root, target);
    lift(state);
  }
}

function onPointerMove(event: PointerEvent) {
  if (pressed) setPointer(pressed, event);
  if (!drag || !drag.state.indicator) return;
  if (!drag.moved && Math.abs(event.clientX - drag.startX) < 8) return;
  drag.moved = true;
  // a gota segue o dedo ao longo da barra
  const ind = drag.state.indicator;
  const rootRect = drag.root.getBoundingClientRect();
  const w = ind.offsetWidth;
  const pad = 4;
  const x = Math.max(pad, Math.min(drag.root.clientWidth - w - pad, event.clientX - rootRect.left - drag.root.clientLeft - w / 2));
  const y = offsetWithin(drag.startTab, drag.root).y;
  ind.style.transform = `translate(${x}px, ${y}px)`;
  // o ícone que cresce é o que está embaixo da gota
  const under = tabAt(drag.root, event.clientX);
  if (under && under !== pressed) {
    pressed?.classList.remove('lg-pressed');
    under.classList.add('lg-pressed');
    pressed = under;
  }
}

function onPointerEnd(event: PointerEvent) {
  pressed?.classList.remove('lg-pressed');
  pressed = null;
  if (!drag) return;
  const { root, state, moved, startTab } = drag;
  drag = null;
  drop(state);
  if (event.type === 'pointerup') {
    const tab = moved ? tabAt(root, event.clientX) : startTab;
    if (tab) {
      state.hold = { tab, until: performance.now() + 2500 };
      if (state.indicator) placeIndicator(state.indicator, root, tab);
    }
    // soltou em outra aba: abre ela (como arrastar na barra do iPhone)
    if (moved && tab && tab !== startTab) tab.click();
  }
  schedule();
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
  resizeObserver = new ResizeObserver(schedule);
  mutationObserver = new MutationObserver(schedule);
  mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', schedule);
  schedule();
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
  window.removeEventListener('resize', schedule);
  if (scheduled) cancelAnimationFrame(scheduled);
  scheduled = 0;
  for (const el of Array.from(tracked.keys())) {
    clearRefraction(el);
    delete el.dataset.lgIndicator;
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
  pressed?.classList.remove('lg-pressed');
  pressed = null;
  drag = null;
}

/** Liga o vidro da tela; devolve a função que desliga. Pode ser chamado várias vezes. */
export function startLiquidGlass() {
  if (typeof window === 'undefined') return () => {};
  users += 1;
  if (users === 1) start();
  else schedule();
  let done = false;
  return () => {
    if (done) return;
    done = true;
    users -= 1;
    if (users === 0) stop();
  };
}
