'use client';

/**
 * O que cada servidor vê no menu do painel: as mesmas regras que a antiga
 * barra lateral aplicava (permissão, papel, plano do município, secretarias do
 * servidor e identidade de plataforma), agora usadas pela barra inferior de
 * vidro e pelo menu "Mais" (DigiUrban Glass).
 */

import { useMemo } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext';
import { usePlatformIdentity } from '@/hooks/usePlatformIdentity';
import {
  canSeeSecretaria,
  getAdminMainNavigation,
  mayorPortalNavigation,
  secretariaNavigation,
  shouldShowNavItem,
  superAdminNavigation,
} from './admin-nav-config';

export function useAdminNavigation() {
  const { stats, user } = useAdminAuth();
  // perfil Gabinete do Prefeito (o Super-admin sempre pode)
  const hasGabinete = user?.role === 'SUPER_ADMIN' || (user as any)?.gabineteAccess === true;
  // Identidade de plataforma (cookie digiurban_platform_token), não o role do User
  const { isPlatformOperator } = usePlatformIdentity();
  const { hasPermission, hasMinRole } = useAdminPermissions();
  const { isFeatureEnabled } = useTenant();

  const mainNavigation = useMemo(
    () =>
      getAdminMainNavigation({
        pendingProtocols: stats?.pendingProtocols,
        pendingCitizens: stats?.pendingCitizens,
        unreadMessages: stats?.unreadMessages,
        internalProcessInbox: stats?.internalProcessInbox,
      }),
    [stats?.pendingCitizens, stats?.pendingProtocols, stats?.unreadMessages, stats?.internalProcessInbox]
  );

  const allSections = useMemo(() => {
    const sections = [...mainNavigation, secretariaNavigation];
    if (isPlatformOperator) sections.push(superAdminNavigation);
    return sections;
  }, [mainNavigation, isPlatformOperator]);

  // Secretarias do servidor: principal + vínculos ativos
  const userDepartmentCodes = useMemo(() => {
    const codes = new Set<string>();
    const add = (code?: string | null) => code && codes.add(code.toUpperCase());
    add(user?.department?.code);
    add(user?.primaryDepartment?.code);
    user?.departments?.forEach((d) => add(d.code));
    user?.userDepartments?.filter((ud) => ud.isActive).forEach((ud) => add(ud.department?.code));
    return [...codes];
  }, [user]);

  const visibleSections = useMemo(
    () =>
      allSections
        .map((section) => ({
          ...section,
          items: section.items
            .filter((item) => shouldShowNavItem(item, hasPermission, hasMinRole, hasGabinete))
            // Secretarias fora do plano do município somem (o backend também nega)
            .filter((item) => {
              const m = item.href.match(/^\/admin\/secretarias\/([a-z0-9-]+)/);
              return m ? isFeatureEnabled(m[1]) : true;
            })
            // Equipe vê só a(s) própria(s) secretaria(s)
            .filter((item) => canSeeSecretaria(item.href, user?.role, userDepartmentCodes)),
        }))
        .filter((section) => section.items.length > 0),
    [allSections, hasMinRole, hasPermission, hasGabinete, isFeatureEnabled, user?.role, userDepartmentCodes]
  );

  const visibleMayorPortalItems = useMemo(
    () => mayorPortalNavigation.items.filter((item) => shouldShowNavItem(item, hasPermission, hasMinRole, hasGabinete)),
    [hasMinRole, hasPermission, hasGabinete]
  );

  return { visibleSections, visibleMayorPortalItems, stats, user, hasPermission, hasMinRole };
}
