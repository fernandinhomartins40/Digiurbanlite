'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon?: React.ElementType;
  badge?: number;
}

interface SecretariaLayoutProps {
  secretariaName: string;
  secretariaSlug: string;
  menuItems: MenuItem[];
  children: React.ReactNode;
}

export function SecretariaLayout({
  secretariaName,
  secretariaSlug,
  menuItems,
  children
}: SecretariaLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/10">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" asChild className="w-full justify-start">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div>
              <h2 className="text-lg font-bold">{secretariaName}</h2>
              <p className="text-xs text-muted-foreground">Painel de Gestão</p>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)]">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                        isActive
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground'
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
