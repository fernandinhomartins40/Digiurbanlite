'use client';

/**
 * Casca do painel do super-admin — DigiUrban Glass (Liquid Glass).
 *
 * Sem barra lateral: barra inferior com os 5 grupos (Visão · Municípios ·
 * Suporte · Sistema · E-mail) e a busca no círculo ("Ir para…" com todas as
 * telas). Dentro de cada grupo, as telas irmãs aparecem como abas no topo.
 * No topo: "Plataforma DigiUrban", tema e conta.
 */

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Bot,
  Building2,
  CreditCard,
  Database,
  FileText,
  Globe,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  Monitor,
  Package,
  ScrollText,
  Search,
  Settings,
  SlidersHorizontal,
  UserCog,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SuperAdminAuthProvider, useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import { useLgThemeScope } from '@/lib/lg-theme';
import { GlassTabBar, type GlassTab } from '@/components/liquid-glass/GlassTabBar';
import { GlassNavSheet, type GlassNavGroup } from '@/components/liquid-glass/GlassNavSheet';
import { LgAmbient } from '@/components/liquid-glass/LgAmbient';
import { SegmentLinks } from '@/components/liquid-glass/SegmentLinks';
import { ThemeToggleButton } from '@/components/liquid-glass/ThemeToggleButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Group {
  key: string;
  title: string;
  icon: LucideIcon;
  color: string;
  items: { title: string; href: string; icon: LucideIcon }[];
}

// Menu por tarefa (auditoria de produto do super-admin, 2026-09-29)
const GROUPS: Group[] = [
  {
    key: 'visao',
    title: 'Visão',
    icon: LayoutDashboard,
    color: '#0A7CFF',
    items: [{ title: 'Visão da plataforma', href: '/super-admin', icon: LayoutDashboard }],
  },
  {
    key: 'municipios',
    title: 'Municípios',
    icon: Building2,
    color: '#2FB84F',
    items: [
      { title: 'Municípios', href: '/super-admin/tenants', icon: Building2 },
      { title: 'Planos', href: '/super-admin/plans', icon: Package },
      { title: 'Faturas', href: '/super-admin/billing', icon: CreditCard },
      { title: 'Leads', href: '/super-admin/leads', icon: UserPlus },
      // Cobrança do serviço de e-mail mora junto da cobrança principal
      { title: 'Planos de e-mail', href: '/super-admin/email-plans', icon: Package },
      { title: 'Assinaturas de e-mail', href: '/super-admin/email-subscriptions', icon: Users },
      { title: 'Receita de e-mail', href: '/super-admin/email-billing', icon: CreditCard },
    ],
  },
  {
    key: 'suporte',
    title: 'Suporte',
    icon: LifeBuoy,
    color: '#5856D6',
    items: [
      { title: 'Assistência remota', href: '/super-admin/assistencia-remota', icon: Monitor },
      { title: 'Equipe da plataforma', href: '/super-admin/users', icon: UserCog },
    ],
  },
  {
    key: 'sistema',
    title: 'Sistema',
    icon: SlidersHorizontal,
    color: '#FF8A1F',
    items: [
      { title: 'Monitoramento', href: '/super-admin/monitoring', icon: Activity },
      { title: 'Backups', href: '/super-admin/operations', icon: Wrench },
      { title: 'Banco de dados', href: '/super-admin/settings/schema', icon: Database },
      { title: 'Auditoria', href: '/super-admin/audit', icon: FileText },
      { title: 'IA', href: '/super-admin/ia', icon: Bot },
    ],
  },
  {
    key: 'email',
    title: 'E-mail',
    icon: Mail,
    color: '#12B5CB',
    items: [
      { title: 'Visão geral', href: '/super-admin/email-server', icon: LayoutDashboard },
      { title: 'Domínios', href: '/super-admin/email-server/domains', icon: Globe },
      { title: 'Servidor', href: '/super-admin/email-server/config', icon: Settings },
      { title: 'Envios', href: '/super-admin/email-server/logs', icon: FileText },
      { title: 'Modelos', href: '/super-admin/email-templates', icon: ScrollText },
    ],
  },
];

const ALL_HREFS = GROUPS.flatMap((g) => g.items.map((i) => i.href));

/** Item mais específico para a página atual (ex.: Domínios, não Visão geral do e-mail) */
function bestMatch(pathname: string): string | undefined {
  return ALL_HREFS.filter((h) => (h === '/super-admin' ? pathname === h : pathname === h || pathname.startsWith(`${h}/`)))
    .sort((a, b) => b.length - a.length)[0];
}

const PUBLIC_PATHS = ['/super-admin/login', '/super-admin/forgot-password', '/super-admin/reset-password'];

function SuperAdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { user, loading: authLoading, logout } = useSuperAdminAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  // Tema claro/escuro do DigiUrban Glass para todo o painel (inclusive o login)
  useLgThemeScope();

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  useEffect(() => {
    if (!isPublicPath && !authLoading && !user) router.push('/super-admin/login');
  }, [pathname, router, user, authLoading, isPublicPath]);

  useEffect(() => setSearchOpen(false), [pathname]);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  if (isPublicPath) return <>{children}</>;

  if (authLoading || !user) {
    return (
      <div className="lg-root min-h-screen flex items-center justify-center">
        <LgAmbient colors={['#5856D6', '#1E9BFF', '#3DDC84']} />
        <div className="relative text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--lg-blue)] mx-auto mb-4" />
          <p className="text-[var(--lg-ink2)] font-medium">Carregando o painel da plataforma...</p>
        </div>
      </div>
    );
  }

  const active = bestMatch(pathname);
  const currentGroup = GROUPS.find((g) => g.items.some((i) => i.href === active));
  const tabs: GlassTab[] = GROUPS.map((group) => ({
    key: group.key,
    label: group.title,
    href: group.items[0].href,
    icon: group.icon,
    active: !searchOpen && currentGroup?.key === group.key,
  }));
  const navGroups: GlassNavGroup[] = GROUPS.map((g) => ({ title: g.title, color: g.color, items: g.items }));
  const roleLabel = user.role === 'PLATFORM_SUPPORT' ? 'Suporte da Plataforma' : 'Operador da Plataforma';

  return (
    <div className="lg-root min-h-screen relative overflow-x-hidden">
      <LgAmbient colors={['#5856D6', '#1E9BFF', '#FF8A1F']} />

      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-3 sm:px-5 pt-[max(12px,env(safe-area-inset-top))] pointer-events-none">
        <div className="pointer-events-auto lg-glass lg-bar rounded-full h-10 px-4 inline-flex items-center gap-2 text-sm font-semibold min-w-0">
          <Globe className="h-4 w-4 shrink-0 text-[var(--lg-blue)]" />
          <span className="truncate">Plataforma DigiUrban</span>
        </div>
        <div className="pointer-events-auto lg-glass lg-bar rounded-full p-1 flex items-center gap-0.5">
          <ThemeToggleButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Minha conta"
                className="h-10 w-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white bg-gradient-to-br from-[#6A5CFF] to-[#FF5FA8]"
              >
                {(user.name || '?').charAt(0).toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-2xl">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--lg-fill)] px-2 py-0.5 text-[11px] font-semibold">
                  <Globe className="h-3 w-3" />
                  {roleLabel}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-[var(--lg-red)] focus:text-[var(--lg-red)]">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1440px] px-3 sm:px-5 lg:px-8 pt-20 pb-36">
        {currentGroup && currentGroup.items.length > 1 && (
          <SegmentLinks
            label={currentGroup.title}
            items={currentGroup.items.map((i) => ({ href: i.href, label: i.title }))}
            className="mb-5"
          />
        )}
        {children}
      </main>

      <GlassNavSheet open={searchOpen} onClose={closeSearch} groups={navGroups} placeholder="Ir para… (ex.: faturas, domínios, backups)" />

      <GlassTabBar
        label="Seções da plataforma"
        tabs={tabs}
        trailing={{ label: 'Buscar no painel', icon: Search, onClick: () => setSearchOpen((v) => !v), active: searchOpen }}
      />
    </div>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuperAdminAuthProvider>
      <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>
    </SuperAdminAuthProvider>
  );
}
