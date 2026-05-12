'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2, ChevronDown, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext';
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

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();
  const { user, stats, logout } = useAdminAuth();
  const { hasPermission, hasMinRole } = useAdminPermissions();

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() =>
    secretariaNavigation.defaultCollapsed ? { [secretariaNavigation.title]: true } : {}
  );

  useEffect(() => {
    const secretariaActive = secretariaNavigation.items.some((item) =>
      isNavItemActive(pathname, item.href)
    );
    if (secretariaActive) {
      setCollapsedSections((prev) => ({ ...prev, [secretariaNavigation.title]: false }));
    }
  }, [pathname]);

  if (!user) return null;

  const mainNavigation = getAdminMainNavigation({
    pendingProtocols: stats?.pendingProtocols,
    pendingCitizens: stats?.pendingCitizens,
    unreadMessages: stats?.unreadMessages,
  });

  const toggleSection = (title: string) =>
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));

  const renderNavSection = (section: AdminNavSection) => {
    const visibleItems = section.items.filter((item) =>
      shouldShowNavItem(item, hasPermission, hasMinRole)
    );
    if (visibleItems.length === 0) return null;

    const isCollapsed = section.collapsible && collapsedSections[section.title];
    const hasActiveItem = visibleItems.some((item) => isNavItemActive(pathname, item.href));

    return (
      <div key={section.title} className="mb-1">
        {section.collapsible ? (
          <button
            onClick={() => toggleSection(section.title)}
            className={cn(
              'group flex w-full items-center justify-between px-3 py-2 mb-0.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
              hasActiveItem
                ? 'text-primary bg-primary/8'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            <span>{section.title}</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isCollapsed ? '-rotate-90' : 'rotate-0'
              )}
            />
          </button>
        ) : (
          <h3 className="px-3 mb-1.5 mt-4 first:mt-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </h3>
        )}

        {!isCollapsed && (
          <nav className="space-y-0.5">
            {visibleItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'group flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'shrink-0 h-4 w-4',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'ml-auto inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded-full leading-none',
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : item.badge === 'NOVO'
                          ? 'bg-blue-500 text-white'
                          : 'bg-destructive/15 text-destructive'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    );
  };

  const roleLabel =
    ROLE_DISPLAY_NAMES[user.role as keyof typeof ROLE_DISPLAY_NAMES] ?? user.role;

  const primaryDept =
    user.primaryDepartment?.name ??
    (user.departments && user.departments.length > 0 ? user.departments[0].name : null) ??
    user.department?.name ??
    null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[92vw] max-w-[22rem] p-0 flex flex-col bg-background">
        <SheetHeader className="shrink-0 px-4 py-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <SheetTitle className="text-sm font-bold text-foreground leading-none">DigiUrban</SheetTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">Portal Administrativo</p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-3 px-2">
          {mainNavigation.map(renderNavSection)}
          <div className="border-t border-border my-2" />
          {renderNavSection(secretariaNavigation)}
          {hasMinRole('SUPER_ADMIN') && (
            <>
              <div className="border-t border-border my-2" />
              {renderNavSection(superAdminNavigation)}
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-border p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold uppercase select-none">
              {(user.name ?? user.email ?? '?').slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate leading-none">
                {user.name ?? user.email ?? 'Usuário'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center px-1.5 py-px text-[10px] font-semibold rounded bg-primary/10 text-primary leading-none">
                  {roleLabel}
                </span>
                {primaryDept && (
                  <span className="text-[11px] text-muted-foreground truncate">{primaryDept}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => { logout(); onOpenChange(false); }}
              title="Sair"
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
