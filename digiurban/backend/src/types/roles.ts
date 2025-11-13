/**
 * ============================================================================
 * SISTEMA DE ROLES - MAPEAMENTO LÓGICO
 * ============================================================================
 *
 * Este arquivo centraliza todas as definições de roles do sistema.
 * Mantém compatibilidade com o enum UserRole do Prisma, mas adiciona
 * semântica clara para o contexto de gestão pública municipal.
 *
 * IMPORTANTE: Não altera o banco de dados - apenas adiciona aliases e labels
 */

/**
 * Enum de roles (mantém compatibilidade com Prisma)
 */
export const UserRole = {
  GUEST: 'GUEST',           // ❌ Não usar para equipe - reservado para visitantes
  USER: 'USER',             // → Servidor(a) - Nível operacional
  COORDINATOR: 'COORDINATOR', // → Diretor(a) - Nível tático
  MANAGER: 'MANAGER',       // → Secretário(a) - Nível estratégico
  ADMIN: 'ADMIN',           // → Prefeito(a) - Gestão total
  SUPER_ADMIN: 'SUPER_ADMIN' // → Suporte Técnico DigiUrban
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

/**
 * Labels de exibição para os roles (contexto municipal brasileiro)
 */
export const ROLE_DISPLAY_NAMES = {
  GUEST: 'Visitante',
  USER: 'Servidor(a)',
  COORDINATOR: 'Diretor(a)',
  MANAGER: 'Secretário(a)',
  ADMIN: 'Prefeito(a)',
  SUPER_ADMIN: 'Suporte Técnico'
} as const;

/**
 * Descrições detalhadas por role
 */
export const ROLE_DESCRIPTIONS = {
  GUEST: 'Acesso de visitante - não usar para equipe administrativa',
  USER: 'Servidor(a) - Atende protocolos e executa tarefas operacionais do dia a dia',
  COORDINATOR: 'Diretor(a) - Coordena equipe, valida procedimentos e supervisiona departamento',
  MANAGER: 'Secretário(a) - Gerencia toda a secretaria, define estratégias e metas',
  ADMIN: 'Prefeito(a) - Acesso total ao sistema, gerencia todas as secretarias',
  SUPER_ADMIN: 'Suporte Técnico DigiUrban - Acesso de desenvolvimento (não atribuir)'
} as const;

/**
 * Hierarquia numérica de roles (usada para validações de permissão)
 *
 * Regra: Um usuário só pode criar/gerenciar usuários com nível INFERIOR ao seu
 */
export const ROLE_HIERARCHY = {
  GUEST: 0,        // Visitante (não usar)
  USER: 1,         // Servidor
  COORDINATOR: 2,  // Diretor
  MANAGER: 3,      // Secretário
  ADMIN: 4,        // Prefeito
  SUPER_ADMIN: 5   // Suporte
} as const;

/**
 * Roles válidos para gerenciamento de equipe
 * (exclui GUEST e SUPER_ADMIN)
 */
export const TEAM_ROLES = ['USER', 'COORDINATOR', 'MANAGER', 'ADMIN'] as const;
export type TeamRoleType = typeof TEAM_ROLES[number];

/**
 * Roles administrativos (podem gerenciar outros usuários)
 */
export const ADMIN_ROLES = ['COORDINATOR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'] as const;

/**
 * Helper: Obter nível hierárquico de um role
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 0;
}

/**
 * Helper: Verificar se um usuário pode gerenciar outro role
 * @param managerRole - Role do usuário que quer gerenciar
 * @param targetRole - Role do usuário alvo
 * @returns true se pode gerenciar (nível superior)
 */
export function canManageRole(managerRole: string, targetRole: string): boolean {
  const managerLevel = getRoleLevel(managerRole);
  const targetLevel = getRoleLevel(targetRole);

  // Usuário só pode gerenciar roles com nível INFERIOR ao seu
  return managerLevel > targetLevel;
}

/**
 * Helper: Obter label de exibição de um role
 */
export function getRoleDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES] || role;
}

/**
 * Helper: Obter descrição de um role
 */
export function getRoleDescription(role: string): string {
  return ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS] || '';
}

/**
 * Helper: Verificar se é um role válido para equipe
 */
export function isTeamRole(role: string): role is TeamRoleType {
  return TEAM_ROLES.includes(role as TeamRoleType);
}

/**
 * Helper: Verificar se é um role administrativo
 */
export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as any);
}

/**
 * Helper: Obter lista de roles que um usuário pode criar
 * @param currentRole - Role do usuário atual
 * @returns Array de roles que podem ser criados
 */
export function getCreatableRoles(currentRole: string): TeamRoleType[] {
  const currentLevel = getRoleLevel(currentRole);

  return TEAM_ROLES.filter(role => {
    const roleLevel = getRoleLevel(role);
    return roleLevel < currentLevel; // Apenas roles inferiores
  });
}

/**
 * Mapa de permissões por role (expandível)
 */
export const ROLE_PERMISSIONS = {
  GUEST: [],
  USER: [
    'protocols:read',
    'protocols:update_own'
  ],
  COORDINATOR: [
    'protocols:read',
    'protocols:update',
    'protocols:assign',
    'team:read',
    'departments:read'
  ],
  MANAGER: [
    'protocols:read',
    'protocols:update',
    'protocols:assign',
    'protocols:delete',
    'team:read',
    'team:manage',
    'services:read',
    'services:create',
    'services:update',
    'departments:read'
  ],
  ADMIN: [
    'protocols:*',
    'team:*',
    'services:*',
    'departments:*',
    'reports:*',
    'analytics:*'
  ],
  SUPER_ADMIN: ['*'] // Acesso total
} as const;

/**
 * Helper: Verificar se um role tem uma permissão específica
 */
export function hasPermission(role: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];

  // SUPER_ADMIN tem todas as permissões
  if (permissions.includes('*')) return true;

  // Verificar permissão exata
  if (permissions.includes(permission as any)) return true;

  // Verificar wildcard (ex: protocols:* permite protocols:read)
  const [resource] = permission.split(':');
  if (permissions.includes(`${resource}:*` as any)) return true;

  return false;
}
