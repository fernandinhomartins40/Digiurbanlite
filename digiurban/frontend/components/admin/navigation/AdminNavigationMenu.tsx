'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext';
import { cn } from '@/lib/utils';
import {
  getAdminMainNavigation,
  isNavItemActive,
  secretariaNavigation,
  shouldShowNavItem,
  superAdminNavigation,
  type AdminNavItem,
  type AdminNavSection,
} from './admin-nav-config';

interface AdminNavigationMenuProps {
  onNavigate?: () => void;
}

const sectionColorStyles: Record<
  NonNullable<AdminNavSection['color']>,
  {
    rail: string;
    sectionActive: string;
    sectionHover: string;
    itemActive: string;
    itemHover: string;
    icon: string;
    iconBg: string;
    badge: string;
    border: string;
  }
> = {
  slate: {
    rail: 'bg-slate-500',
    sectionActive: 'bg-slate-100 text-slate-900',
    sectionHover: 'hover:bg-slate-50 hover:text-slate-900',
    itemActive: 'bg-slate-700 text-white shadow-sm',
    itemHover: 'hover:bg-slate-50 hover:text-slate-950',
    icon: 'text-slate-600',
    iconBg: 'bg-slate-100',
    badge: 'bg-slate-100 text-slate-700',
    border: 'border-slate-200 hover:border-slate-300',
  },
  blue: {
    rail: 'bg-blue-500',
    sectionActive: 'bg-blue-50 text-blue-800',
    sectionHover: 'hover:bg-blue-50 hover:text-blue-800',
    itemActive: 'bg-blue-600 text-white shadow-sm',
    itemHover: 'hover:bg-blue-50 hover:text-blue-950',
    icon: 'text-blue-600',
    iconBg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200 hover:border-blue-300',
  },
  emerald: {
    rail: 'bg-emerald-500',
    sectionActive: 'bg-emerald-50 text-emerald-800',
    sectionHover: 'hover:bg-emerald-50 hover:text-emerald-800',
    itemActive: 'bg-emerald-600 text-white shadow-sm',
    itemHover: 'hover:bg-emerald-50 hover:text-emerald-950',
    icon: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200 hover:border-emerald-300',
  },
  amber: {
    rail: 'bg-amber-500',
    sectionActive: 'bg-amber-50 text-amber-800',
    sectionHover: 'hover:bg-amber-50 hover:text-amber-800',
    itemActive: 'bg-amber-600 text-white shadow-sm',
    itemHover: 'hover:bg-amber-50 hover:text-amber-950',
    icon: 'text-amber-600',
    iconBg: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-800',
    border: 'border-amber-200 hover:border-amber-300',
  },
  violet: {
    rail: 'bg-violet-500',
    sectionActive: 'bg-violet-50 text-violet-800',
    sectionHover: 'hover:bg-violet-50 hover:text-violet-800',
    itemActive: 'bg-violet-600 text-white shadow-sm',
    itemHover: 'hover:bg-violet-50 hover:text-violet-950',
    icon: 'text-violet-600',
    iconBg: 'bg-violet-50',
    badge: 'bg-violet-100 text-violet-700',
    border: 'border-violet-200 hover:border-violet-300',
  },
  rose: {
    rail: 'bg-rose-500',
    sectionActive: 'bg-rose-50 text-rose-800',
    sectionHover: 'hover:bg-rose-50 hover:text-rose-800',
    itemActive: 'bg-rose-600 text-white shadow-sm',
    itemHover: 'hover:bg-rose-50 hover:text-rose-950',
    icon: 'text-rose-600',
    iconBg: 'bg-rose-50',
    badge: 'bg-rose-100 text-rose-700',
    border: 'border-rose-200 hover:border-rose-300',
  },
  cyan: {
    rail: 'bg-cyan-500',
    sectionActive: 'bg-cyan-50 text-cyan-800',
    sectionHover: 'hover:bg-cyan-50 hover:text-cyan-800',
    itemActive: 'bg-cyan-600 text-white shadow-sm',
    itemHover: 'hover:bg-cyan-50 hover:text-cyan-950',
    icon: 'text-cyan-600',
    iconBg: 'bg-cyan-50',
    badge: 'bg-cyan-100 text-cyan-700',
    border: 'border-cyan-200 hover:border-cyan-300',
  },
  indigo: {
    rail: 'bg-indigo-500',
    sectionActive: 'bg-indigo-50 text-indigo-800',
    sectionHover: 'hover:bg-indigo-50 hover:text-indigo-800',
    itemActive: 'bg-indigo-600 text-white shadow-sm',
    itemHover: 'hover:bg-indigo-50 hover:text-indigo-950',
    icon: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    badge: 'bg-indigo-100 text-indigo-700',
    border: 'border-indigo-200 hover:border-indigo-300',
  },
  orange: {
    rail: 'bg-orange-500',
    sectionActive: 'bg-orange-50 text-orange-800',
    sectionHover: 'hover:bg-orange-50 hover:text-orange-800',
    itemActive: 'bg-orange-600 text-white shadow-sm',
    itemHover: 'hover:bg-orange-50 hover:text-orange-950',
    icon: 'text-orange-600',
    iconBg: 'bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
    border: 'border-orange-200 hover:border-orange-300',
  },
};

function getSectionStyle(color?: AdminNavSection['color']) {
  return sectionColorStyles[color ?? 'slate'];
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function AdminNavigationMenu({ onNavigate }: AdminNavigationMenuProps) {
  const pathname = usePathname();
  const { stats, user } = useAdminAuth();
  const { hasPermission, hasMinRole } = useAdminPermissions();
  const [query, setQuery] = useState('');

  const mainNavigation = useMemo(
    () =>
      getAdminMainNavigation({
        pendingProtocols: stats?.pendingProtocols,
        pendingCitizens: stats?.pendingCitizens,
        unreadMessages: stats?.unreadMessages,
      }),
    [stats?.pendingCitizens, stats?.pendingProtocols, stats?.unreadMessages]
  );

  const allSections = useMemo(() => {
    const sections = [...mainNavigation, secretariaNavigation];
    if (user?.role === 'SUPER_ADMIN') sections.push(superAdminNavigation);
    return sections;
  }, [mainNavigation, user?.role]);

  const buildInitialCollapsed = () => {
    const state: Record<string, boolean> = {};
    allSections.forEach((section) => {
      if (section.collapsible && section.defaultCollapsed) state[section.title] = true;
    });
    return state;
  };

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(buildInitialCollapsed);

  useEffect(() => {
    const toExpand = allSections
      .filter((section) => section.collapsible)
      .filter((section) => section.items.some((item) => isNavItemActive(pathname, item.href)))
      .map((section) => section.title);

    if (toExpand.length === 0) return;

    setCollapsed((prev) => {
      const next = { ...prev };
      toExpand.forEach((title) => {
        next[title] = false;
      });
      return next;
    });
  }, [allSections, pathname]);

  const visibleSections = useMemo(
    () =>
      allSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => shouldShowNavItem(item, hasPermission, hasMinRole)),
        }))
        .filter((section) => section.items.length > 0),
    [allSections, hasMinRole, hasPermission]
  );

  const normalizedQuery = normalizeText(query.trim());
  const isSearching = normalizedQuery.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];

    return visibleSections.flatMap((section) =>
      section.items
        .filter((item) => {
          const haystack = normalizeText(`${section.title} ${item.title}`);
          return haystack.includes(normalizedQuery);
        })
        .map((item) => ({ sectionTitle: section.title, item, color: section.color }))
    );
  }, [isSearching, normalizedQuery, visibleSections]);

  const quickItems = useMemo(() => {
    const preferred = [
      '/admin/protocolos',
      '/admin/cidadaos',
      '/admin/servicos',
      '/admin/mensagens',
    ];

    const items = visibleSections.flatMap((section) =>
      section.items.map((item) => ({ item, color: section.color }))
    );
    return preferred
      .map((href) => items.find(({ item }) => item.href === href))
      .filter(Boolean) as Array<{ item: AdminNavItem; color?: AdminNavSection['color'] }>;
  }, [visibleSections]);

  const toggle = (title: string) =>
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));

  const renderSection = (section: AdminNavSection) => {
    const isCollapsed = section.collapsible ? collapsed[section.title] ?? false : false;
    const hasActiveItem = section.items.some((item) => isNavItemActive(pathname, item.href));
    const sectionStyle = getSectionStyle(section.color);

    if (!section.title) {
      return (
        <div key="__top__" className="space-y-1">
          {section.items.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} color={section.color} />
          ))}
        </div>
      );
    }

    return (
      <section key={section.title} className="space-y-1">
        {section.collapsible ? (
          <button
            type="button"
            onClick={() => toggle(section.title)}
            className={cn(
              'group flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
              hasActiveItem
                ? sectionStyle.sectionActive
                : cn('text-muted-foreground', sectionStyle.sectionHover)
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', sectionStyle.rail)} />
              <span className="truncate">{section.title}</span>
            </span>
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 shrink-0 transition-transform',
                !isCollapsed && 'rotate-90'
              )}
            />
          </button>
        ) : (
          <p className="px-2.5 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            {section.title}
          </p>
        )}

        {!isCollapsed && (
          <div className="space-y-1">
            {section.items.map((item) => (
              <NavItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} color={section.color} />
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3 border-b border-border/60 px-3 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar no menu"
            className="h-9 rounded-md pl-9 pr-8 text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 rounded-md p-1 -translate-y-1/2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {!isSearching && quickItems.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {quickItems.map((item) => (
              <QuickItem key={item.item.href} item={item.item} pathname={pathname} onNavigate={onNavigate} color={item.color} />
            ))}
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-2 py-3">
        {isSearching ? (
          <div className="space-y-1">
            {searchResults.length > 0 ? (
              searchResults.map(({ sectionTitle, item, color }) => (
                <NavItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                  eyebrow={sectionTitle}
                  color={color}
                />
              ))
            ) : (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                Nenhum item encontrado
              </div>
            )}
          </div>
        ) : (
          visibleSections.map((section, index) => (
            <div key={section.title || '__top__'} className="space-y-2">
              {index > 0 && <SectionDivider color={section.color} />}
              {renderSection(section)}
            </div>
          ))
        )}
      </nav>
    </div>
  );
}

function QuickItem({
  item,
  pathname,
  onNavigate,
  color,
}: {
  item: AdminNavItem;
  pathname: string;
  onNavigate?: () => void;
  color?: AdminNavSection['color'];
}) {
  const isActive = isNavItemActive(pathname, item.href);
  const style = getSectionStyle(color);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex min-h-10 items-center gap-2 rounded-md border px-2.5 py-2 text-xs font-semibold transition-colors',
        isActive
          ? style.itemActive
          : cn('bg-card text-foreground/80 hover:bg-white', style.border)
      )}
    >
      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md', isActive ? 'bg-white/20' : style.iconBg)}>
        <item.icon className={cn('h-3.5 w-3.5', isActive ? 'text-white' : style.icon)} />
      </span>
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

function SectionDivider({ color }: { color?: AdminNavSection['color'] }) {
  const style = getSectionStyle(color);

  return (
    <div className="mx-2 flex items-center gap-2">
      <div className={cn('h-0.5 w-5 rounded-full', style.rail)} />
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

function NavItem({
  item,
  pathname,
  onNavigate,
  eyebrow,
  color,
}: {
  item: AdminNavItem;
  pathname: string;
  onNavigate?: () => void;
  eyebrow?: string;
  color?: AdminNavSection['color'];
}) {
  const isActive = isNavItemActive(pathname, item.href);
  const isNumericBadge = item.badge && item.badge !== 'NOVO';
  const style = getSectionStyle(color);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group relative flex min-h-10 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? style.itemActive
          : cn('text-foreground/75', style.itemHover)
      )}
    >
      <span className={cn('absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-opacity', style.rail, isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-70')} />
      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors', isActive ? 'bg-white/20' : style.iconBg)}>
        <item.icon
          className={cn(
            'h-4 w-4',
            isActive ? 'text-primary-foreground' : style.icon
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        {eyebrow && (
          <span
            className={cn(
              'block truncate text-[10px] font-semibold uppercase tracking-wide',
              isActive ? 'text-primary-foreground/75' : style.icon
            )}
          >
            {eyebrow}
          </span>
        )}
        <span className="block truncate leading-5">{item.title}</span>
      </span>
      {item.badge && (
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center font-bold leading-none',
            isNumericBadge
              ? cn(
                  'h-5 min-w-5 rounded-full px-1.5 text-[11px]',
                  isActive ? 'bg-white/20 text-white' : 'bg-destructive text-white'
                )
              : cn(
                  'rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wide',
                  isActive ? 'bg-white/20 text-white' : style.badge
                )
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}
