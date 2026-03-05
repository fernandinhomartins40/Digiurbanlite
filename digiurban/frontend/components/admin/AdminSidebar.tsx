'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2, X } from 'lucide-react';
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext';
import { useSidebar } from '@/hooks/use-sidebar';
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
  const { user, stats } = useAdminAuth();
  const { hasPermission, hasMinRole } = useAdminPermissions();
  const pathname = usePathname();
  const { isOpen, isMobile, close } = useSidebar();

  useEffect(() => {
    if (isMobile && isOpen) {
      close();
    }
  }, [pathname, isMobile, isOpen, close]);

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
        <h3 className="px-3 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {section.title}
        </h3>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'flex-shrink-0 mr-3 h-5 w-5',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
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
          'flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out',
          isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0') : 'translate-x-0'
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-primary" />
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">DigiUrban</h1>
              <p className="text-xs text-gray-500">Portal Admin</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={close}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          {mainNavigation.map(renderNavSection)}
          {renderNavSection(secretariaNavigation)}
          {hasMinRole('SUPER_ADMIN') && renderNavSection(superAdminNavigation)}
        </div>

        <div className="border-t border-gray-200 p-4">
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
      </div>
    </>
  );
}
