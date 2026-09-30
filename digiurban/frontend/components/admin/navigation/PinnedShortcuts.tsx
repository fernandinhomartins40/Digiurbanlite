'use client';

/**
 * Atalhos fixados na barra inferior (estilo Dock do Mac), por servidor.
 *
 * - A lista ordenada de endereços fica no banco (user_preferences.pinnedShortcuts,
 *   GET/PUT /api/admin/preferences/pinned) e acompanha o servidor em qualquer aparelho.
 * - Só entram telas que o servidor pode abrir AGORA: a lista salva é cruzada
 *   com o menu visível (permissão, papel, plano do município, secretarias).
 *   Perdeu o acesso ou a tela saiu do menu → o atalho some sem erro.
 * - Nunca personalizou (null) → conjunto padrão (Protocolos, Balcão, Apps).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import type { AdminNavItem, AdminNavSection } from './admin-nav-config';
import { useAdminNavigation } from './useAdminNavigation';

export const MAX_PINNED = 12;
export const DEFAULT_PINNED = ['/admin/protocolos', '/admin/balcao', '/admin/apps'];

/** Cores dos ícones (as mesmas do menu "Mais") */
export const SECTION_COLORS: Record<string, string> = {
  slate: '#8E8E93',
  blue: '#0A7CFF',
  emerald: '#2FB84F',
  amber: '#FF9F0A',
  violet: '#AF52DE',
  rose: '#FF375F',
  cyan: '#32ADE6',
  indigo: '#5856D6',
  orange: '#FF8A1F',
};

export interface PinnableItem {
  item: AdminNavItem;
  color: string;
  section: string;
}

interface PinnedContextValue {
  /** Atalhos que o servidor pode abrir, na ordem escolhida */
  pinned: PinnableItem[];
  isPinned: (href: string) => boolean;
  canPin: (href: string) => boolean;
  toggle: (href: string) => void;
  pin: (href: string, index?: number) => void;
  unpin: (href: string) => void;
  /** Nova ordem (lista de hrefs) — usada ao arrastar na barra */
  reorder: (hrefs: string[]) => void;
}

const PinnedContext = createContext<PinnedContextValue | null>(null);

export function PinnedShortcutsProvider({ children }: { children: React.ReactNode }) {
  const { visibleSections, visibleMayorPortalItems } = useAdminNavigation();
  // null = ainda não carregou ou nunca personalizou
  const [saved, setSaved] = useState<string[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const lastSaved = useRef<string[] | null>(null);

  useEffect(() => {
    let alive = true;
    apiRequest('/admin/preferences/pinned')
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res?.data) ? (res.data as string[]) : null;
        setSaved(list);
        lastSaved.current = list;
      })
      .catch(() => undefined)
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  // Catálogo: tudo o que o servidor vê no menu, com a cor da seção
  const catalog = useMemo(() => {
    const map = new Map<string, PinnableItem>();
    const add = (item: AdminNavItem, color: AdminNavSection['color'], section: string) => {
      if (item.href === '/admin' || map.has(item.href)) return; // Início é fixo na barra
      map.set(item.href, { item, color: SECTION_COLORS[color || 'blue'] || SECTION_COLORS.blue, section });
    };
    visibleSections.forEach((s) => s.items.forEach((item) => add(item, s.color, s.title || 'Início')));
    visibleMayorPortalItems.forEach((item) => add(item, 'indigo', 'Portal do Prefeito'));
    return map;
  }, [visibleSections, visibleMayorPortalItems]);

  const hrefs = saved ?? DEFAULT_PINNED;
  const pinned = useMemo(
    () => hrefs.map((href) => catalog.get(href)).filter((x): x is PinnableItem => !!x),
    [hrefs, catalog]
  );

  const persist = useCallback((next: string[]) => {
    const previous = lastSaved.current;
    setSaved(next);
    apiRequest('/admin/preferences/pinned', { method: 'PUT', body: JSON.stringify({ items: next }) })
      .then((res) => {
        if (res?.success) {
          lastSaved.current = next;
        } else {
          throw new Error(res?.error || 'erro');
        }
      })
      .catch(() => {
        setSaved(previous);
        toast.error('Não foi possível salvar seus atalhos. Tente de novo.');
      });
  }, []);

  // Base para editar: a lista atual SEM itens que o servidor não pode mais abrir
  const current = useCallback(() => pinned.map((p) => p.item.href), [pinned]);

  const pin = useCallback(
    (href: string, index?: number) => {
      if (!catalog.has(href)) return;
      const list = current().filter((h) => h !== href);
      if (list.length >= MAX_PINNED) {
        toast.message(`Limite de ${MAX_PINNED} atalhos. Remova um para fixar outro.`);
        return;
      }
      const at = index === undefined ? list.length : Math.max(0, Math.min(index, list.length));
      list.splice(at, 0, href);
      persist(list);
    },
    [catalog, current, persist]
  );

  const unpin = useCallback((href: string) => persist(current().filter((h) => h !== href)), [current, persist]);

  const value = useMemo<PinnedContextValue>(
    () => ({
      pinned: loaded ? pinned : [],
      isPinned: (href) => pinned.some((p) => p.item.href === href),
      canPin: (href) => catalog.has(href),
      toggle: (href) => (pinned.some((p) => p.item.href === href) ? unpin(href) : pin(href)),
      pin,
      unpin,
      reorder: (next) => persist(next.filter((h) => catalog.has(h))),
    }),
    [loaded, pinned, catalog, pin, unpin, persist]
  );

  return <PinnedContext.Provider value={value}>{children}</PinnedContext.Provider>;
}

export function usePinnedShortcuts() {
  const ctx = useContext(PinnedContext);
  if (!ctx) throw new Error('usePinnedShortcuts precisa do PinnedShortcutsProvider');
  return ctx;
}

/** Tipo usado no arrastar do menu "Mais" para a barra */
export const PIN_DRAG_TYPE = 'application/x-digiurban-pin';
