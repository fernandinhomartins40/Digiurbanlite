'use client';

/**
 * Painel "Mais" do painel do servidor (DigiUrban Glass).
 * Abre a partir da barra inferior com tudo o que não cabe nas abas: Portal do
 * Prefeito, seções do menu (com as mesmas regras de permissão da antiga barra
 * lateral) e uma busca "Ir para…" (também aberta pelo círculo de busca).
 * Apple HIG: menus em vidro mais opaco (legibilidade), no máximo dois níveis.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNavItemActive, type AdminNavItem, type AdminNavSection } from './admin-nav-config';
import { useAdminNavigation } from './useAdminNavigation';

const SECTION_COLORS: Record<string, string> = {
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

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function MenuLink({
  item,
  color,
  eyebrow,
  onNavigate,
}: {
  item: AdminNavItem;
  color?: string;
  eyebrow?: string;
  onNavigate: () => void;
}) {
  const pathname = usePathname() || '';
  const active = isNavItemActive(pathname, item.href);
  const Icon = item.icon;
  const isNumber = item.badge && item.badge !== 'NOVO';
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors',
        active ? 'bg-[var(--lg-fill2)] font-semibold' : 'hover:bg-[var(--lg-fill)]'
      )}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ background: SECTION_COLORS[color || 'blue'] || SECTION_COLORS.blue }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        {eyebrow && <span className="block text-[11px] text-[var(--lg-ink3)]">{eyebrow}</span>}
        <span className="block truncate">{item.title}</span>
      </span>
      {item.badge &&
        (isNumber ? (
          <span className="min-w-[20px] rounded-full bg-[var(--lg-red)] px-1.5 text-center text-[11px] font-bold leading-5 text-white">
            {item.badge}
          </span>
        ) : (
          <span className="rounded-full bg-[var(--lg-fill)] px-2 text-[10px] font-semibold leading-5 text-[var(--lg-ink2)]">
            {item.badge}
          </span>
        ))}
    </Link>
  );
}

export function AdminMoreSheet({
  open,
  focusSearch,
  onClose,
}: {
  open: boolean;
  focusSearch: boolean;
  onClose: () => void;
}) {
  const { visibleSections, visibleMayorPortalItems } = useAdminNavigation();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    if (focusSearch) setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, focusSearch, onClose]);

  const sections = useMemo(() => visibleSections.filter((s) => s.title), [visibleSections]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    const all: { item: AdminNavItem; color?: AdminNavSection['color']; section: string }[] = [
      ...visibleMayorPortalItems.map((item) => ({ item, color: 'indigo' as const, section: 'Portal do Prefeito' })),
      ...visibleSections.flatMap((s) => s.items.map((item) => ({ item, color: s.color, section: s.title || 'Início' }))),
    ];
    const seen = new Set<string>();
    return all.filter(({ item, section }) => {
      if (seen.has(item.href)) return false;
      const hit = normalize(`${section} ${item.title}`).includes(q);
      if (hit) seen.add(item.href);
      return hit;
    });
  }, [query, visibleMayorPortalItems, visibleSections]);

  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="Fechar menu" className="fixed inset-0 z-40 cursor-default" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Todas as seções"
        className={cn(
          'lg-glass lg-thick fixed z-50 rounded-[32px] p-4 sm:p-5 flex flex-col gap-4',
          'left-3 right-3 bottom-[92px] max-h-[72vh]',
          'md:left-1/2 md:right-auto md:w-[min(900px,calc(100vw-48px))] md:-translate-x-1/2'
        )}
      >
        <div className="flex items-center gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-full bg-[var(--lg-fill)] px-4 py-2.5">
            <Search className="h-4 w-4 text-[var(--lg-ink3)]" />
            <span className="sr-only">Ir para</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ir para… (ex.: cidadãos, relatórios, saúde)"
              className="w-full bg-transparent text-[15px] text-[var(--lg-ink)] placeholder:text-[var(--lg-ink3)] outline-none"
            />
          </label>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="lg-tab flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--lg-fill)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto -mx-1 px-1">
          {query.trim() ? (
            results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {results.map(({ item, color, section }) => (
                  <MenuLink key={item.href} item={item} color={color} eyebrow={section} onNavigate={onClose} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-[var(--lg-ink2)]">Nada encontrado com esse nome.</p>
            )
          ) : (
            <div className="flex flex-col gap-5">
              {visibleMayorPortalItems.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--lg-ink3)]">
                    Portal do Prefeito
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
                    {visibleMayorPortalItems.map((item) => (
                      <MenuLink key={item.href} item={item} color="indigo" onNavigate={onClose} />
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-5">
                {sections.map((section) => (
                  <div key={section.title} className="flex flex-col gap-0.5">
                    <span className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--lg-ink3)]">
                      {section.title}
                    </span>
                    {section.items.map((item) => (
                      <MenuLink key={item.href} item={item} color={section.color} onNavigate={onClose} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
