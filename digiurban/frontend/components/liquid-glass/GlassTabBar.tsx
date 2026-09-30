'use client';

/**
 * Barra de abas flutuante em Liquid Glass — substitui a barra lateral.
 *
 * Regras (Apple HIG › Tab bars): navegação, não ações; no máximo 5 abas com
 * rótulo curto; badge só para o que é importante; um círculo separado no fim
 * para uma função de destaque (busca, assistente). No celular o ícone fica em
 * cima do rótulo; em telas largas, lado a lado.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GlassTab {
  key: string;
  label: string;
  /** Link da aba; sem href, a aba é um botão (ex.: "Mais" abre um painel) */
  href?: string;
  onClick?: () => void;
  /** Força o estado ativo (ex.: "Mais" aberto ou página que mora no "Mais") */
  active?: boolean;
  icon: LucideIcon;
  /** Número em vermelho sobre a aba (só para o que precisa de atenção) */
  badge?: number;
  /** Outros caminhos que também marcam esta aba como ativa */
  alsoActiveOn?: string[];
  /** Ativa só no caminho exato (ex.: Início) */
  exact?: boolean;
}

export interface GlassTrailingAction {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  icon: LucideIcon;
}

export function isGlassTabActive(pathname: string, tab: GlassTab) {
  if (typeof tab.active === 'boolean') return tab.active;
  if (!tab.href) return false;
  const bases = [tab.href, ...(tab.alsoActiveOn || [])];
  if (tab.exact) return bases.includes(pathname);
  return bases.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

function Badge({ value, inline }: { value: number; inline?: boolean }) {
  if (!value) return null;
  return (
    <span
      className={cn(
        'min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--lg-red)] text-white text-[11px] font-bold leading-[18px] text-center',
        inline ? 'hidden md:inline-block' : 'absolute -top-1 -right-2 md:hidden'
      )}
    >
      {value > 99 ? '99+' : value}
    </span>
  );
}

export function GlassTabBar({
  tabs,
  trailing,
  label = 'Seções',
  className,
}: {
  tabs: GlassTab[];
  trailing?: GlassTrailingAction;
  label?: string;
  className?: string;
}) {
  const pathname = usePathname() || '';
  const trailingActive = trailing
    ? typeof trailing.active === 'boolean'
      ? trailing.active
      : !!trailing.href && (pathname === trailing.href || pathname.startsWith(`${trailing.href}/`))
    : false;

  const TrailingTag: any = trailing?.href ? Link : 'button';

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pointer-events-none',
        'pb-[max(16px,env(safe-area-inset-bottom))]',
        className
      )}
    >
      <div className="pointer-events-auto flex items-center gap-2.5 w-full max-w-md md:w-auto md:max-w-none">
        <nav aria-label={label} className="lg-glass lg-bar rounded-full p-1.5 flex flex-1 md:flex-none gap-0.5">
          {tabs.map((tab) => {
            const active = !trailingActive && isGlassTabActive(pathname, tab);
            const Icon = tab.icon;
            const Tag: any = tab.href ? Link : 'button';
            return (
              <Tag
                key={tab.key}
                {...(tab.href ? { href: tab.href } : { type: 'button', onClick: tab.onClick, 'aria-expanded': active })}
                aria-current={tab.href && active ? 'page' : undefined}
                className={cn(
                  'lg-tab rounded-full flex flex-1 md:flex-none flex-col md:flex-row items-center justify-center',
                  'gap-0.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-2.5',
                  'text-[10.5px] md:text-sm font-semibold md:font-medium',
                  active && 'lg-tab-on md:font-semibold'
                )}
              >
                <span className="relative">
                  <Icon className="h-[22px] w-[22px] md:h-5 md:w-5" strokeWidth={active ? 2.3 : 2} />
                  <Badge value={tab.badge || 0} />
                </span>
                <span>{tab.label}</span>
                <Badge value={tab.badge || 0} inline />
              </Tag>
            );
          })}
        </nav>
        {trailing && (
          <TrailingTag
            {...(trailing.href ? { href: trailing.href } : { type: 'button', onClick: trailing.onClick, 'aria-expanded': trailingActive })}
            aria-label={trailing.label}
            title={trailing.label}
            aria-current={trailing.href && trailingActive ? 'page' : undefined}
            className={cn(
              'lg-glass lg-bar lg-tab rounded-full h-14 w-14 shrink-0 flex items-center justify-center text-[var(--lg-blue)]',
              trailingActive && 'lg-tab-on'
            )}
          >
            <trailing.icon className="h-6 w-6" />
          </TrailingTag>
        )}
      </div>
    </div>
  );
}
