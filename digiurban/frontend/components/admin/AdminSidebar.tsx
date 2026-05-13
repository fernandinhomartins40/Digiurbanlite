'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LogOut, X } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useSidebar } from '@/hooks/use-sidebar';
import { ROLE_DISPLAY_NAMES } from '@/types/roles';
import { cn } from '@/lib/utils';
import { AdminNavigationMenu } from './navigation/AdminNavigationMenu';

export function AdminSidebar() {
  const { user, logout } = useAdminAuth();
  const pathname = usePathname();
  const { isOpen, isMobile, close } = useSidebar();

  useEffect(() => {
    if (isMobile && isOpen) close();
  }, [pathname, isMobile, isOpen, close]);

  if (!user) return null;

  const roleLabel =
    ROLE_DISPLAY_NAMES[user.role as keyof typeof ROLE_DISPLAY_NAMES] ?? user.role;

  const initials = (user.name ?? user.email ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-border/60 bg-background shadow-sm transition-transform duration-300 ease-in-out',
          isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3.5">
          <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary shadow-sm">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-foreground">DigiUrban</p>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                Portal Administrativo
              </p>
            </div>
          </Link>

          {isMobile && (
            <button
              type="button"
              onClick={close}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Fechar menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <AdminNavigationMenu />

        <div className="shrink-0 border-t border-border/60 p-3">
          <div className="flex items-center gap-2.5 rounded-md bg-muted/40 p-2">
            <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
                {user.name ?? user.email ?? 'Usuario'}
              </p>
              <span className="mt-1 inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary">
                {roleLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              title="Sair"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
