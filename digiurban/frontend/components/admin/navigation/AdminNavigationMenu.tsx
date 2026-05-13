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
        .map((item) => ({ sectionTitle: section.title, item }))
    );
  }, [isSearching, normalizedQuery, visibleSections]);

  const quickItems = useMemo(() => {
    const preferred = [
      '/admin/protocolos',
      '/admin/cidadaos',
      '/admin/servicos',
      '/admin/mensagens',
    ];

    const items = visibleSections.flatMap((section) => section.items);
    return preferred
      .map((href) => items.find((item) => item.href === href))
      .filter(Boolean) as AdminNavItem[];
  }, [visibleSections]);

  const toggle = (title: string) =>
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));

  const renderSection = (section: AdminNavSection) => {
    const isCollapsed = section.collapsible ? collapsed[section.title] ?? false : false;
    const hasActiveItem = section.items.some((item) => isNavItemActive(pathname, item.href));

    if (!section.title) {
      return (
        <div key="__top__" className="space-y-1">
          {section.items.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
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
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <span className="truncate">{section.title}</span>
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
              <NavItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
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
              <QuickItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-2 py-3">
        {isSearching ? (
          <div className="space-y-1">
            {searchResults.length > 0 ? (
              searchResults.map(({ sectionTitle, item }) => (
                <NavItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                  eyebrow={sectionTitle}
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
              {index > 0 && <div className="mx-2 border-t border-border/60" />}
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
}: {
  item: AdminNavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = isNavItemActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex min-h-10 items-center gap-2 rounded-md border px-2.5 py-2 text-xs font-semibold transition-colors',
        isActive
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/70 bg-card text-foreground/80 hover:border-primary/40 hover:bg-accent'
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

function NavItem({
  item,
  pathname,
  onNavigate,
  eyebrow,
}: {
  item: AdminNavItem;
  pathname: string;
  onNavigate?: () => void;
  eyebrow?: string;
}) {
  const isActive = isNavItemActive(pathname, item.href);
  const isNumericBadge = item.badge && item.badge !== 'NOVO';

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group flex min-h-10 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-foreground/75 hover:bg-accent hover:text-foreground'
      )}
    >
      <item.icon
        className={cn(
          'h-4 w-4 shrink-0',
          isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
        )}
      />
      <span className="min-w-0 flex-1">
        {eyebrow && (
          <span
            className={cn(
              'block truncate text-[10px] font-semibold uppercase tracking-wide',
              isActive ? 'text-primary-foreground/75' : 'text-muted-foreground'
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
                  isActive ? 'bg-white/20 text-white' : 'bg-primary/15 text-primary'
                )
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}
