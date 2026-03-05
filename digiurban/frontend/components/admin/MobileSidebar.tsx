'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext';
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
  const { user, stats } = useAdminAuth();
  const { hasPermission, hasMinRole } = useAdminPermissions();

  if (!user) {
    return null;
  }

  const mainNavigation = getAdminMainNavigation({
    pendingProtocols: stats?.pendingProtocols,
    pendingCitizens: stats?.pendingCitizens,
    unreadMessages: stats?.unreadMessages,
  });

  const renderNavSection = (section: AdminNavSection) => {
    const visibleItems = section.items.filter((item) =>
      shouldShowNavItem(item, hasPermission, hasMinRole)
    );

    if (visibleItems.length === 0) {
      return null;
    }

    return (
      <div key={section.title} className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
          {section.title}
        </h3>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'ml-2 inline-block py-0.5 px-2 text-xs font-semibold rounded-full',
                      isActive
                        ? 'bg-primary-foreground text-primary'
                        : item.badge === 'NOVO'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white animate-pulse'
                        : 'bg-red-100 text-red-800'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[92vw] max-w-[22rem] p-0 flex flex-col">
        <SheetHeader className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary" />
              <div className="ml-3">
                <SheetTitle className="text-lg font-semibold text-gray-900">DigiUrban</SheetTitle>
                <p className="text-xs text-gray-500">Portal Admin</p>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          {mainNavigation.map(renderNavSection)}
          {renderNavSection(secretariaNavigation)}
          {hasMinRole('SUPER_ADMIN') && renderNavSection(superAdminNavigation)}
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500">
            <div className="font-medium">{user.name || user.email || 'Usuário'}</div>
            {user.departments && user.departments.length > 0 ? (
              <div className="mt-1 space-y-0.5">
                {user.departments.map((dept) => {
                  const isPrimary = user.primaryDepartment?.id === dept.id;
                  return (
                    <div key={dept.id} className={`truncate ${isPrimary ? 'font-semibold' : ''}`}>
                      {isPrimary && '★ '}
                      {dept.name}
                    </div>
                  );
                })}
              </div>
            ) : user.department ? (
              <div className="truncate">{user.department.name}</div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
