'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2, ChevronRight, LogOut, X } from 'lucide-react';
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext';
import { useSidebar } from '@/hooks/use-sidebar';
import { ROLE_DISPLAY_NAMES } from '@/types/roles';
import { cn } from '@/lib/utils';
import {
  getAdminMainNavigation,
  isNavItemActive,
  secretariaNavigation,
  shouldShowNavItem,
  superAdminNavigation,
  type AdminNavSection,
} from './navigation/admin-nav-config';

export function AdminSidebar() {
  const { user, stats, logout } = useAdminAuth();
  const { hasPermission, hasMinRole } = useAdminPermissions();
  const pathname = usePathname();
  const { isOpen, isMobile, close } = useSidebar();

  const buildInitialCollapsed = () => {
    const state: Record<string, boolean> = {};
    getAdminMainNavigation().forEach((s) => {
      if (s.collapsible && s.defaultCollapsed) state[s.title] = true;
    });
    if (secretariaNavigation.defaultCollapsed) state[secretariaNavigation.title] = true;
    return state;
  };

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(buildInitialCollapsed);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile && isOpen) close();
  }, [pathname, isMobile, isOpen, close]);

  // Auto-expand section when its route is active
  useEffect(() => {
    const nav = getAdminMainNavigation();
    const toExpand: string[] = [];

    nav.forEach((section) => {
      if (!section.collapsible) return;
      const active = section.items.some((item) => isNavItemActive(pathname, item.href));
      if (active) toExpand.push(section.title);
    });

    const secretariaActive = secretariaNavigation.items.some((item) =>
      isNavItemActive(pathname, item.href)
    );
    if (secretariaActive) toExpand.push(secretariaNavigation.title);

    if (toExpand.length > 0) {
      setCollapsed((prev) => {
        const next = { ...prev };
        toExpand.forEach((t) => { next[t] = false; });
        return next;
      });
    }
  }, [pathname]);

  if (!user) return null;

  const mainNavigation = getAdminMainNavigation({
    pendingProtocols: stats?.pendingProtocols,
    pendingCitizens: stats?.pendingCitizens,
    unreadMessages: stats?.unreadMessages,
  });

  const toggle = (title: string) =>
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));

  const renderSection = (section: AdminNavSection) => {
    const visibleItems = section.items.filter((item) =>
      shouldShowNavItem(item, hasPermission, hasMinRole)
    );
    if (visibleItems.length === 0) return null;

    const isCollapsed = section.collapsible ? (collapsed[section.title] ?? false) : false;
    const hasActiveItem = visibleItems.some((item) => isNavItemActive(pathname, item.href));

    // Section with no title — render items directly (top-level)
    if (!section.title) {
      return (
        <div key="__top__" className="space-y-0.5 mb-1">
          {visibleItems.map((item) => <NavItem key={item.href} item={item} pathname={pathname} />)}
        </div>
      );
    }

    return (
      <div key={section.title} className="mb-0.5">
        {section.collapsible ? (
          <button
            onClick={() => toggle(section.title)}
            className={cn(
              'group flex w-full items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150',
              hasActiveItem && isCollapsed
                ? 'text-primary bg-primary/8'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            )}
          >
            <span>{section.title}</span>
            <ChevronRight
              className={cn(
                'h-3 w-3 shrink-0 transition-transform duration-200',
                !isCollapsed && 'rotate-90'
              )}
            />
          </button>
        ) : (
          <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 first:pt-1">
            {section.title}
          </p>
        )}

        {!isCollapsed && (
          <div className="space-y-0.5 mt-0.5">
            {visibleItems.map((item) => <NavItem key={item.href} item={item} pathname={pathname} />)}
          </div>
        )}
      </div>
    );
  };

  const roleLabel =
    ROLE_DISPLAY_NAMES[user.role as keyof typeof ROLE_DISPLAY_NAMES] ?? user.role;

  const initials = (user.name ?? user.email ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'flex flex-col w-64 bg-background border-r border-border/60 h-screen fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out',
          isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
        )}
      >
        {/* ── Logo ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60 shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">DigiUrban</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Portal Administrativo</p>
            </div>
          </Link>
          {isMobile && (
            <button
              onClick={close}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              aria-label="Fechar menu"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* ── Navigation ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0">
          {mainNavigation.map(renderSection)}

          {/* Secretarias */}
          <div className="border-t border-border/60 my-2" />
          {renderSection(secretariaNavigation)}

          {/* Super Admin */}
          {hasMinRole('SUPER_ADMIN') && (
            <>
              <div className="border-t border-border/60 my-2" />
              {renderSection(superAdminNavigation)}
            </>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div className="border-t border-border/60 p-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold select-none">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                {user.name ?? user.email ?? 'Usuário'}
              </p>
              <span className="inline-flex items-center px-1.5 py-0.5 mt-0.5 text-[10px] font-semibold rounded-md bg-primary/10 text-primary leading-none">
                {roleLabel}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Sair"
              className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── NavItem ────────────────────────────────────────────────────────────────
function NavItem({
  item,
  pathname,
}: {
  item: { title: string; href: string; icon: React.ElementType; badge?: string };
  pathname: string;
}) {
  const isActive = isNavItemActive(pathname, item.href);
  const isNumericBadge = item.badge && item.badge !== 'NOVO';

  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-foreground/75 hover:bg-accent hover:text-foreground'
      )}
    >
      <item.icon
        className={cn(
          'shrink-0 h-4 w-4',
          isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
        )}
      />
      <span className="flex-1 truncate leading-none">{item.title}</span>
      {item.badge && (
        <span
          className={cn(
            'shrink-0 inline-flex items-center justify-center leading-none font-bold',
            isNumericBadge
              ? cn(
                  'min-w-[20px] h-5 px-1.5 rounded-full text-[11px]',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-destructive text-white'
                )
              : cn(
                  'px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide',
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
