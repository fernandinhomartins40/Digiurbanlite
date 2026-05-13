'use client';

import { Building2, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { ROLE_DISPLAY_NAMES } from '@/types/roles';
import { AdminNavigationMenu } from './navigation/AdminNavigationMenu';

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const { user, logout } = useAdminAuth();

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-[92vw] max-w-[22rem] flex-col p-0">
        <SheetHeader className="shrink-0 border-b border-border/60 px-4 py-3.5">
          <div className="flex items-center gap-2.5 text-left">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary shadow-sm">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate text-sm font-bold leading-tight text-foreground">
                DigiUrban
              </SheetTitle>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                Portal Administrativo
              </p>
            </div>
          </div>
        </SheetHeader>

        <AdminNavigationMenu onNavigate={() => onOpenChange(false)} />

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
              onClick={() => {
                logout();
                onOpenChange(false);
              }}
              title="Sair"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
