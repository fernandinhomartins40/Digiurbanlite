'use client';

/**
 * Casca do portal do cidadão — DigiUrban Glass (Liquid Glass).
 *
 * Sem barra lateral: a navegação é a barra inferior flutuante (Início ·
 * Serviços · Pedidos · Mais + Assistente). No topo, só o essencial em vidro:
 * município (ou Voltar nas telas internas), tema e a conta.
 * O tema claro/escuro é ligado uma vez para todo o portal em
 * app/cidadao/layout-content.tsx (useLgThemeScope).
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, LogOut, MapPin, User } from 'lucide-react';
import { useCitizenAuth, useCitizenProtectedRoute } from '@/contexts/CitizenAuthContext';
import { RegistrationLevelBadge } from './RegistrationLevelBadge';
import { LevelUpgradeModal } from './LevelUpgradeModal';
import { mapVerificationStatusToLevel } from '@/lib/citizen-utils';
import { BottomNavigation } from './mobile/BottomNavigation';
import { LgAmbient } from '@/components/liquid-glass/LgAmbient';
import { ThemeToggleButton } from '@/components/liquid-glass/ThemeToggleButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CitizenLayoutProps {
  children: React.ReactNode;
  /** Mantido por compatibilidade; o título fica no conteúdo de cada tela */
  title?: string;
}

// Telas de primeiro nível: mostram o município; as demais mostram "Voltar"
const TOP_LEVEL = [
  '/cidadao',
  '/cidadao/servicos',
  '/cidadao/protocolos',
  '/cidadao/mais',
  '/cidadao/documentos',
  '/cidadao/perfil',
  '/cidadao/familia',
  '/cidadao/biometria-facial',
];

const initials = (name?: string) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'EU';

export function CitizenLayout({ children }: CitizenLayoutProps) {
  const [showLevelUpgradeModal, setShowLevelUpgradeModal] = useState(false);
  const pathname = usePathname() || '';
  const router = useRouter();
  const { citizen, isLoading } = useCitizenProtectedRoute();
  const { logout } = useCitizenAuth();
  const tenant = (citizen as any)?.tenant;

  if (isLoading || !citizen) {
    return (
      <div className="lg-root min-h-screen flex items-center justify-center">
        <LgAmbient />
        <div className="relative flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--lg-blue)]" />
          <p className="text-sm text-[var(--lg-ink2)]">Carregando...</p>
        </div>
      </div>
    );
  }

  const isTopLevel = TOP_LEVEL.includes(pathname);

  return (
    <div className="lg-root min-h-screen relative overflow-x-hidden">
      <LgAmbient />

      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pointer-events-none">
        <div className="pointer-events-auto min-w-0">
          {isTopLevel ? (
            tenant && (
              <Link href="/cidadao" className="lg-glass lg-bar rounded-full h-10 px-4 inline-flex items-center gap-1.5 text-sm font-semibold min-w-0">
                <MapPin className="h-4 w-4 shrink-0 text-[var(--lg-blue)]" />
                <span className="truncate max-w-[46vw] sm:max-w-xs">
                  {tenant.nomeMunicipio || tenant.name}
                  {tenant.ufMunicipio ? ` - ${tenant.ufMunicipio}` : ''}
                </span>
              </Link>
            )
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Voltar"
              className="lg-glass lg-bar lg-tab rounded-full h-10 w-10 flex items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="pointer-events-auto lg-glass lg-bar rounded-full p-1 flex items-center gap-0.5">
          <ThemeToggleButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Minha conta"
                className="h-10 w-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white bg-gradient-to-br from-[#5AA9FF] to-[#6A5CFF]"
              >
                {initials(citizen.name)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-semibold truncate">{citizen.name}</p>
                <p className="text-xs text-muted-foreground">
                  CPF {citizen.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.$2.$3-**')}
                </p>
                <div className="mt-2">
                  <RegistrationLevelBadge
                    level={mapVerificationStatusToLevel(citizen.verificationStatus)}
                    onUpgradeClick={() => setShowLevelUpgradeModal(true)}
                  />
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/cidadao/perfil')} className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Meu perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-[var(--lg-red)] focus:text-[var(--lg-red)]">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-36">{children}</main>

      <BottomNavigation />

      <LevelUpgradeModal isOpen={showLevelUpgradeModal} onClose={() => setShowLevelUpgradeModal(false)} />
    </div>
  );
}
