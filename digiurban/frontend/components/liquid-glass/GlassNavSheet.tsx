'use client';

/**
 * Painel em vidro que abre a partir da barra inferior com todas as telas de
 * um painel, agrupadas, e uma busca "Ir para…". Genérico (o painel do servidor
 * tem uma versão própria com as regras de permissão: AdminMoreSheet).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GlassNavGroup {
  title: string;
  color: string;
  items: { title: string; href: string; icon: LucideIcon }[];
}

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function GlassNavSheet({
  open,
  onClose,
  groups,
  placeholder = 'Ir para…',
}: {
  open: boolean;
  onClose: () => void;
  groups: GlassNavGroup[];
  placeholder?: string;
}) {
  const pathname = usePathname() || '';
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const shown = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => normalize(`${g.title} ${i.title}`).includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="Fechar" className="fixed inset-0 z-40 cursor-default" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Todas as telas"
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
              placeholder={placeholder}
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
          {shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--lg-ink2)]">Nada encontrado com esse nome.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-5">
              {shown.map((group) => (
                <div key={group.title} className="flex flex-col gap-0.5">
                  <span className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--lg-ink3)]">{group.title}</span>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors',
                          active ? 'bg-[var(--lg-fill2)] font-semibold' : 'hover:bg-[var(--lg-fill)]'
                        )}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: group.color }}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="truncate">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
