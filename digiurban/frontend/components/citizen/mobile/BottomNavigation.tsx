'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Folder,
  FileText,
  User,
  Menu,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isFAB?: boolean;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Início',
    icon: Home,
    href: '/cidadao',
  },
  {
    id: 'protocols',
    label: 'Protocolos',
    icon: Folder,
    href: '/cidadao/protocolos',
  },
  {
    id: 'services',
    label: 'Serviços',
    icon: FileText,
    href: '/cidadao/servicos',
    isFAB: true,
  },
  {
    id: 'profile',
    label: 'Perfil',
    icon: User,
    href: '/cidadao/perfil',
  },
  {
    id: 'more',
    label: 'Mais',
    icon: Menu,
    href: '/cidadao/mais',
  },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
      <div
        className="flex items-center justify-around h-[72px] px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          // Renderizar FAB Central
          if (item.isFAB) {
            return (
              <div key={item.id} className="relative flex flex-col items-center mx-4">
                {/* Glow effect */}
                <div className={cn(
                  "absolute -top-6 w-[72px] h-[72px] rounded-full transition-opacity duration-300",
                  "bg-gradient-radial from-blue-600/20 via-blue-600/10 to-transparent",
                  isActive ? "opacity-100 animate-pulse" : "opacity-60"
                )} />

                {/* FAB Button */}
                <button
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "relative z-10 w-16 h-16 rounded-full transition-all duration-300",
                    "bg-gradient-to-br from-blue-600 to-blue-700",
                    "border-4 border-white",
                    "shadow-[0_8px_16px_rgba(37,99,235,0.3),0_4px_8px_rgba(0,0,0,0.1)]",
                    "flex items-center justify-center",
                    "-translate-y-6",
                    "active:scale-95 active:-translate-y-5",
                    isActive && "from-blue-700 to-blue-800 -translate-y-7 scale-105 shadow-[0_12px_24px_rgba(37,99,235,0.4),0_6px_12px_rgba(0,0,0,0.15)]"
                  )}
                >
                  <Icon className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
                </button>

                {/* Label */}
                <span className={cn(
                  "absolute -bottom-5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap transition-colors duration-200",
                  isActive ? "text-blue-600" : "text-blue-500"
                )}>
                  {item.label}
                </span>
              </div>
            );
          }

          // Renderizar botões normais
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1",
                "transition-all duration-200",
                "active:scale-95"
              )}
            >
              <Icon className={cn(
                "w-6 h-6 transition-colors duration-200",
                isActive ? "text-blue-600" : "text-gray-500"
              )} />
              <span className={cn(
                "text-[11px] font-medium transition-colors duration-200",
                isActive ? "text-blue-600" : "text-gray-500"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
