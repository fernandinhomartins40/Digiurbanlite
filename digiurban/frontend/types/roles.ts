/**
 * ============================================================================
 * SISTEMA DE ROLES - FRONTEND
 * ============================================================================
 *
 * Este arquivo centraliza todas as definições de roles para o frontend.
 * Mantém compatibilidade com o enum UserRole do Prisma.
 */

/**
 * Enum de roles (sincronizado com backend)
 */
export const UserRole = {
  GUEST: 'GUEST',
  USER: 'USER',
  COORDINATOR: 'COORDINATOR',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
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
  USER: 'Servidor(a) - Atende protocolos e executa tarefas operacionais',
  COORDINATOR: 'Diretor(a) - Coordena equipe e supervisiona departamento',
  MANAGER: 'Secretário(a) - Gerencia toda a secretaria e define estratégias',
  ADMIN: 'Prefeito(a) - Acesso total ao sistema municipal',
  SUPER_ADMIN: 'Suporte Técnico DigiUrban - Não atribuir'
} as const;

/**
 * Hierarquia numérica de roles
 */
export const ROLE_HIERARCHY = {
  GUEST: 0,
  USER: 1,
  COORDINATOR: 2,
  MANAGER: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5
} as const;

/**
 * Roles válidos para gerenciamento de equipe (exclui GUEST e SUPER_ADMIN)
 */
export const TEAM_ROLES = ['USER', 'COORDINATOR', 'MANAGER', 'ADMIN'] as const;
export type TeamRoleType = typeof TEAM_ROLES[number];

/**
 * Configuração de cores por role (para badges e UI)
 */
export const ROLE_COLORS = {
  GUEST: 'gray',
  USER: 'blue',
  COORDINATOR: 'purple',
  MANAGER: 'orange',
  ADMIN: 'red',
  SUPER_ADMIN: 'green'
} as const;

/**
 * Ícones sugeridos por role (lucide-react)
 */
export const ROLE_ICONS = {
  GUEST: 'Eye',
  USER: 'User',
  COORDINATOR: 'Users',
  MANAGER: 'Briefcase',
  ADMIN: 'Crown',
  SUPER_ADMIN: 'Shield'
} as const;

/**
 * Helper: Obter nível hierárquico de um role
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 0;
}

/**
 * Helper: Verificar se um usuário pode gerenciar outro role
 */
export function canManageRole(managerRole: string, targetRole: string): boolean {
  const managerLevel = getRoleLevel(managerRole);
  const targetLevel = getRoleLevel(targetRole);
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
 * Helper: Obter lista de roles que um usuário pode criar
 */
export function getCreatableRoles(currentRole: string): TeamRoleType[] {
  const currentLevel = getRoleLevel(currentRole);

  return TEAM_ROLES.filter(role => {
    const roleLevel = getRoleLevel(role);
    return roleLevel < currentLevel;
  });
}

/**
 * Helper: Obter cor de um role
 */
export function getRoleColor(role: string): string {
  return ROLE_COLORS[role as keyof typeof ROLE_COLORS] || 'gray';
}

/**
 * Helper: Formatar role para exibição com badge
 */
export interface RoleBadgeData {
  label: string;
  description: string;
  color: string;
  icon: string;
}

export function getRoleBadgeData(role: string): RoleBadgeData {
  return {
    label: getRoleDisplayName(role),
    description: getRoleDescription(role),
    color: getRoleColor(role),
    icon: ROLE_ICONS[role as keyof typeof ROLE_ICONS] || 'User'
  };
}
