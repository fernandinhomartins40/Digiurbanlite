'use client';

/**
 * Abas de seção (controle segmentado) que navegam entre páginas irmãs.
 * Sem regra de acesso: quem usa decide a lista (ex.: SectionTabs filtra por
 * permissão; o super-admin passa o grupo inteiro).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface SegmentLink {
  href: string;
  label: string;
}

export function SegmentLinks({ label, items, className }: { label: string; items: SegmentLink[]; className?: string }) {
  const pathname = usePathname() || '';
  if (items.length < 2) return null;
  // A aba ativa é a mais específica que casa com a página atual
  const active = items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav
      role="tablist"
      aria-label={label}
      className={cn('inline-flex h-10 max-w-full items-center overflow-x-auto rounded-full bg-[var(--lg-fill)] p-1 text-[var(--lg-ink2)]', className)}
    >
      {items.map((item) => {
        const on = item.href === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            role="tab"
            aria-selected={on}
            className={cn(
              'inline-flex items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              on ? 'bg-[var(--lg-surface)] text-[var(--lg-ink)] shadow-sm' : 'hover:text-[var(--lg-ink)]'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
