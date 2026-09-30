'use client';

/**
 * Barra inferior do painel do servidor no estilo Dock do Mac (DigiUrban Glass).
 *
 *  [Início] | [atalhos fixados pelo servidor…] | [Mais]   (Buscar)
 *
 * Computador: atalhos como ícones coloridos, com aumento ao passar o mouse,
 *   nome em cima e um ponto embaixo da tela aberta. Botão direito → menu;
 *   segurar → modo de organizar (ícones tremem, arrastar reordena, "−" remove).
 *   Dá para arrastar uma tela do "Mais" direto para a barra.
 * Celular: Início + 3 primeiros atalhos + Mais (máx. 5 abas, Apple HIG);
 *   segurar um atalho abre o painel "Organizar atalhos" com todos.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, Check, Home, Menu, Minus, PinOff, Search, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNavItemActive } from './admin-nav-config';
import { PIN_DRAG_TYPE, usePinnedShortcuts, type PinnableItem } from './PinnedShortcuts';

const MOBILE_PINNED = 3;
const LONG_PRESS_MS = 480;

/* ------------------------------------------------------------------ util */

function Badge({ value, className }: { value?: number; className?: string }) {
  if (!value) return null;
  return (
    <span
      className={cn(
        'absolute min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--lg-red)] text-white text-[11px] font-bold leading-[18px] text-center',
        className
      )}
    >
      {value > 99 ? '99+' : value}
    </span>
  );
}

/** Segurar para organizar: dispara após LONG_PRESS_MS sem arrastar */
function useLongPress(onLongPress: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  return {
    fired,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        fired.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        clear();
        timer.current = setTimeout(() => {
          fired.current = true;
          onLongPress();
        }, LONG_PRESS_MS);
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (start.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8) clear();
      },
      onPointerUp: clear,
      onPointerCancel: clear,
      onPointerLeave: clear,
      // Depois do "segurar", o clique não navega
      onClickCapture: (e: React.MouseEvent) => {
        if (fired.current) {
          e.preventDefault();
          e.stopPropagation();
          fired.current = false;
        }
      },
    },
  };
}

/**
 * Reordenar arrastando (mouse e toque): enquanto arrasta, o item troca de
 * lugar com o vizinho mais próximo; ao soltar, a nova ordem é salva.
 */
function useDragReorder(hrefs: string[], onCommit: (next: string[]) => void) {
  const [order, setOrder] = useState(hrefs);
  const [dragging, setDragging] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLElement>());

  // Compara pelo conteúdo (a lista é recriada a cada render)
  const key = hrefs.join('|');
  useEffect(() => {
    if (!dragging) setOrder(key ? key.split('|') : []);
  }, [key, dragging]);

  const register = (href: string) => (el: HTMLElement | null) => {
    if (el) refs.current.set(href, el);
    else refs.current.delete(href);
  };

  const onPointerDown = (href: string) => (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(href);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    let best: string | null = null;
    let bestDist = Infinity;
    refs.current.forEach((el, href) => {
      const r = el.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      if (d < bestDist) {
        bestDist = d;
        best = href;
      }
    });
    if (best && best !== dragging) {
      setOrder((prev) => {
        const from = prev.indexOf(dragging);
        const to = prev.indexOf(best as string);
        if (from < 0 || to < 0) return prev;
        const next = [...prev];
        next.splice(from, 1);
        next.splice(to, 0, dragging);
        return next;
      });
    }
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(null);
    if (order.join('|') !== hrefs.join('|')) onCommit(order);
  };

  return { order, dragging, register, onPointerDown, onPointerMove, onPointerUp };
}

/* --------------------------------------------------------------- peças */

function DockTile({
  entry,
  scale,
  badge,
  editing,
  isDragging,
  onRemove,
}: {
  entry: PinnableItem;
  scale: number;
  badge?: number;
  editing: boolean;
  isDragging?: boolean;
  onRemove: () => void;
}) {
  const Icon = entry.item.icon;
  return (
    <span
      className="relative flex h-11 w-11 items-center justify-center rounded-[13px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_14px_-6px_rgba(0,0,0,0.45)] transition-transform duration-150 ease-out will-change-transform"
      style={{
        background: `linear-gradient(180deg, color-mix(in srgb, ${entry.color} 78%, white), ${entry.color})`,
        transform: `translateY(${-(scale - 1) * 22}px) scale(${isDragging ? 1.18 : scale})`,
        transformOrigin: '50% 100%',
      }}
    >
      <Icon className="h-[22px] w-[22px]" strokeWidth={2.1} />
      <Badge value={badge} className="-right-1.5 -top-1.5" />
      {editing && (
        <button
          type="button"
          data-no-drag
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Tirar ${entry.item.title} da barra`}
          className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--lg-ink2)] text-white shadow ring-2 ring-[var(--lg-surface)]"
        >
          <Minus className="h-3 w-3" strokeWidth={3} />
        </button>
      )}
    </span>
  );
}

function TextTab({
  label,
  icon: Icon,
  active,
  href,
  onClick,
  className,
  children,
  ...rest
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
} & Record<string, any>) {
  const cls = cn(
    'lg-tab relative rounded-full flex flex-1 md:flex-none flex-col md:flex-row items-center justify-center',
    'gap-0.5 md:gap-2 px-1.5 md:px-4 py-1.5 md:py-2.5',
    'text-[10.5px] md:text-sm font-semibold md:font-medium',
    active && 'lg-tab-on md:font-semibold',
    className
  );
  const body = (
    <>
      <span className="relative">
        <Icon className="h-[22px] w-[22px] md:h-5 md:w-5" strokeWidth={active ? 2.3 : 2} />
        {children}
      </span>
      <span className="max-w-full truncate whitespace-nowrap">{label}</span>
    </>
  );
  return href ? (
    <Link href={href} aria-current={active ? 'page' : undefined} className={cls} {...rest}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-expanded={active} className={cls} {...rest}>
      {body}
    </button>
  );
}

/* --------------------------------------------------------------- barra */

export function AdminDock({
  badges,
  moreOpen,
  searchOpen,
  onToggleMore,
  onToggleSearch,
  organizeSignal,
}: {
  /** Números em vermelho por endereço (ex.: pendentes em Protocolos) */
  badges: Record<string, number>;
  moreOpen: boolean;
  searchOpen: boolean;
  onToggleMore: () => void;
  onToggleSearch: () => void;
  /** Muda de valor quando o "Mais" pede "Organizar atalhos" */
  organizeSignal: number;
}) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { pinned, unpin, reorder, pin } = usePinnedShortcuts();
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState<{ href: string; x: number } | null>(null);
  const [scales, setScales] = useState<Record<string, number>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const hrefs = pinned.map((p) => p.item.href);
  const byHref = new Map(pinned.map((p) => [p.item.href, p]));
  const drag = useDragReorder(hrefs, reorder); // barra (computador)
  const dragPanel = useDragReorder(hrefs, reorder); // painel (celular)
  const longPress = useLongPress(() => setEditing(true));

  useEffect(() => {
    if (organizeSignal) setEditing(true);
  }, [organizeSignal]);

  // Sai do modo organizar ao trocar de página ou com Esc
  useEffect(() => {
    setEditing(false);
    setMenu(null);
  }, [pathname]);
  useEffect(() => {
    if (!editing && !menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditing(false);
        setMenu(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, menu]);

  // Aumento estilo Dock (só com mouse, fora do modo organizar)
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (editing || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const next: Record<string, number> = {};
      navRef.current?.querySelectorAll<HTMLElement>('[data-dock-href]').forEach((el) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(e.clientX - (r.left + r.width / 2));
        next[el.dataset.dockHref!] = 1 + 0.38 * Math.max(0, 1 - d / 110);
      });
      setScales(next);
    },
    [editing]
  );
  const resetScales = () => {
    setScales({});
    setHovered(null);
  };

  // Arrastar do "Mais" para a barra (computador)
  const dropIndexAt = (clientX: number) => {
    const els = Array.from(navRef.current?.querySelectorAll<HTMLElement>('[data-dock-href]') || []);
    const i = els.findIndex((el) => {
      const r = el.getBoundingClientRect();
      return clientX < r.left + r.width / 2;
    });
    return i < 0 ? els.length : i;
  };
  const onDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(PIN_DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDropIndex(dropIndexAt(e.clientX));
  };
  const onDrop = (e: React.DragEvent) => {
    const href = e.dataTransfer.getData(PIN_DRAG_TYPE);
    const at = dropIndexAt(e.clientX);
    setDropIndex(null);
    if (href) {
      e.preventDefault();
      pin(href, at);
    }
  };

  const homeActive = !moreOpen && !searchOpen && pathname === '/admin';
  const onDesktopPinned = pinned.some((p) => isNavItemActive(pathname, p.item.href));
  const onMobilePinned = pinned.slice(0, MOBILE_PINNED).some((p) => isNavItemActive(pathname, p.item.href));
  // "Mais" acende quando aberto ou quando a página atual não está na barra
  const moreActive = (onPinned: boolean) =>
    (moreOpen && !searchOpen) || (!moreOpen && !searchOpen && pathname !== '/admin' && !onPinned);

  return (
    <>
      {(editing || menu) && (
        <button
          type="button"
          aria-label="Fechar"
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => {
            setEditing(false);
            setMenu(null);
          }}
        />
      )}

      {/* Celular: painel "Organizar atalhos" com todos os fixados */}
      {editing && (
        <div
          role="dialog"
          aria-label="Organizar atalhos"
          className="lg-glass lg-thick fixed inset-x-3 bottom-[92px] z-50 rounded-[28px] p-4 md:hidden"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[15px] font-semibold">Organizar atalhos</p>
              <p className="text-xs text-[var(--lg-ink2)]">
                Arraste para mudar a ordem. Os {MOBILE_PINNED} primeiros aparecem na barra.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full bg-[var(--lg-blue)] px-4 py-1.5 text-sm font-semibold text-white"
            >
              OK
            </button>
          </div>
          {pinned.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--lg-ink2)]">
              Nenhum atalho. Abra “Mais” e toque no alfinete de uma tela.
            </p>
          ) : (
            <div
              className="mt-4 grid touch-none grid-cols-4 gap-x-2 gap-y-4"
              onPointerMove={dragPanel.onPointerMove}
              onPointerUp={dragPanel.onPointerUp}
              onPointerCancel={dragPanel.onPointerUp}
            >
              {dragPanel.order.map((href, i) => {
                const entry = byHref.get(href);
                if (!entry) return null;
                return (
                  <div
                    key={href}
                    ref={dragPanel.register(href)}
                    onPointerDown={dragPanel.onPointerDown(href)}
                    className={cn('flex flex-col items-center gap-1.5', dragPanel.dragging !== href && 'lg-jiggle')}
                    style={{ animationDelay: `${(i % 3) * -0.09}s` }}
                  >
                    <DockTile
                      entry={entry}
                      scale={1}
                      editing
                      isDragging={dragPanel.dragging === href}
                      badge={badges[href]}
                      onRemove={() => unpin(href)}
                    />
                    <span className="w-full truncate text-center text-[11px] leading-tight">{entry.item.title}</span>
                    {i === MOBILE_PINNED - 1 && dragPanel.order.length > MOBILE_PINNED && (
                      <span className="sr-only">Os próximos ficam no Mais</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Computador: botão "Concluir" sobre a barra durante a organização */}
      {editing && (
        <div className="fixed inset-x-0 bottom-[96px] z-50 hidden justify-center md:flex">
          <div className="lg-glass lg-thick flex items-center gap-3 rounded-full py-1.5 pl-4 pr-1.5 text-sm">
            <span className="text-[var(--lg-ink2)]">Arraste para reordenar · “−” tira da barra · arraste telas do “Mais” para cá</span>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lg-blue)] px-4 py-1.5 font-semibold text-white"
            >
              <Check className="h-4 w-4" />
              Concluir
            </button>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pointer-events-none pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex w-full max-w-md items-end gap-2.5 md:w-auto md:max-w-none">
          <nav
            ref={navRef}
            aria-label="Seções do painel"
            className={cn('lg-glass lg-bar flex flex-1 items-center gap-0.5 rounded-full p-1.5 md:flex-none', dropIndex !== null && 'ring-2 ring-[var(--lg-blue)]')}
            onMouseMove={onMouseMove}
            onMouseLeave={resetScales}
            onDragOver={onDragOver}
            onDragLeave={() => setDropIndex(null)}
            onDrop={onDrop}
          >
            <TextTab label="Início" icon={Home} href="/admin" active={homeActive} />

            {/* Celular: 3 primeiros atalhos como abas */}
            {pinned.slice(0, MOBILE_PINNED).map((p) => (
              <TextTab
                key={p.item.href}
                // Aba do celular: rótulo curto (Apple HIG) — "Análises e relatórios" → "Análises"
                label={p.item.title.split(' ')[0]}
                aria-label={p.item.title}
                icon={p.item.icon}
                href={p.item.href}
                active={!moreOpen && !searchOpen && isNavItemActive(pathname, p.item.href)}
                className="md:hidden"
                {...longPress.handlers}
                onContextMenu={(e: React.MouseEvent) => {
                  e.preventDefault();
                  setEditing(true);
                }}
              >
                <Badge value={badges[p.item.href]} className="-top-1 -right-2" />
              </TextTab>
            ))}

            {/* Computador: ícones estilo Dock */}
            {pinned.length > 0 && <span aria-hidden className="mx-1.5 hidden h-8 w-px self-center bg-[var(--lg-sep)] md:block" />}
            <div
              className={cn('hidden items-center gap-1 md:flex', editing && 'touch-none')}
              onPointerMove={editing ? drag.onPointerMove : undefined}
              onPointerUp={editing ? drag.onPointerUp : undefined}
              onPointerCancel={editing ? drag.onPointerUp : undefined}
            >
              {(editing ? drag.order : hrefs).map((href, i) => {
                const entry = byHref.get(href);
                if (!entry) return null;
                const active = isNavItemActive(pathname, href);
                const scale = editing ? 1 : scales[href] || 1;
                return (
                  <div
                    key={href}
                    data-dock-href={href}
                    ref={drag.register(href)}
                    className={cn('relative flex flex-col items-center', editing && drag.dragging !== href && 'lg-jiggle')}
                    style={{ animationDelay: `${(i % 3) * -0.09}s` }}
                    onMouseEnter={() => setHovered(href)}
                    onMouseLeave={() => setHovered((h) => (h === href ? null : h))}
                    onPointerDown={editing ? drag.onPointerDown(href) : undefined}
                  >
                    {dropIndex === i && <span aria-hidden className="absolute -left-1 top-1 h-9 w-0.5 rounded-full bg-[var(--lg-blue)]" />}
                    {/* Nome em cima, como no Dock */}
                    {!editing && hovered === href && (
                      <span
                        role="tooltip"
                        className="lg-glass lg-thick pointer-events-none absolute bottom-[calc(100%+22px)] whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium"
                      >
                        {entry.item.title}
                      </span>
                    )}
                    {editing ? (
                      <span className="cursor-grab px-0.5 py-0.5 active:cursor-grabbing">
                        <DockTile
                          entry={entry}
                          scale={1}
                          editing
                          isDragging={drag.dragging === href}
                          badge={badges[href]}
                          onRemove={() => unpin(href)}
                        />
                      </span>
                    ) : (
                      <Link
                        href={href}
                        aria-label={entry.item.title}
                        aria-current={active ? 'page' : undefined}
                        draggable={false}
                        className="rounded-[14px] px-0.5 py-0.5 outline-offset-2"
                        {...longPress.handlers}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setMenu({ href, x: r.left + r.width / 2 });
                        }}
                      >
                        <DockTile entry={entry} scale={scale} editing={false} badge={badges[href]} onRemove={() => unpin(href)} />
                      </Link>
                    )}
                    {/* Ponto da tela aberta */}
                    <span
                      aria-hidden
                      className={cn('mt-0.5 h-1 w-1 rounded-full', active && !editing ? 'bg-[var(--lg-ink2)]' : 'bg-transparent')}
                    />
                  </div>
                );
              })}
              {dropIndex !== null && dropIndex >= hrefs.length && (
                <span aria-hidden className="h-9 w-0.5 rounded-full bg-[var(--lg-blue)]" />
              )}
            </div>
            {pinned.length > 0 && <span aria-hidden className="mx-1.5 hidden h-8 w-px self-center bg-[var(--lg-sep)] md:block" />}

            <TextTab label="Mais" icon={Menu} active={moreActive(onMobilePinned)} onClick={onToggleMore} className="md:hidden" />
            <TextTab label="Mais" icon={Menu} active={moreActive(onDesktopPinned)} onClick={onToggleMore} className="hidden md:flex" />
          </nav>

          <button
            type="button"
            onClick={onToggleSearch}
            aria-label="Buscar no painel"
            title="Buscar no painel"
            aria-expanded={searchOpen}
            className={cn(
              'lg-glass lg-bar lg-tab flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[var(--lg-blue)]',
              searchOpen && 'lg-tab-on'
            )}
          >
            <Search className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Menu do botão direito (computador) */}
      {menu && (
        <div
          role="menu"
          className="lg-glass lg-thick fixed bottom-[92px] z-50 w-56 -translate-x-1/2 rounded-2xl p-1.5 text-sm"
          style={{ left: menu.x }}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-[var(--lg-fill)]"
            onClick={() => {
              router.push(menu.href);
              setMenu(null);
            }}
          >
            <ArrowUpRight className="h-4 w-4" />
            Abrir
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-[var(--lg-fill)]"
            onClick={() => {
              setMenu(null);
              setEditing(true);
            }}
          >
            <Settings2 className="h-4 w-4" />
            Organizar atalhos
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[var(--lg-red)] hover:bg-[var(--lg-fill)]"
            onClick={() => {
              unpin(menu.href);
              setMenu(null);
            }}
          >
            <PinOff className="h-4 w-4" />
            Tirar da barra
          </button>
        </div>
      )}
    </>
  );
}

