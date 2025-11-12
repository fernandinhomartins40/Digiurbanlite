// Dashboard Components - Fase 6
import { CitizenDashboard } from './CitizenDashboard'
import { EmployeeDashboard } from './EmployeeDashboard'
import { CoordinatorDashboard } from './CoordinatorDashboard'
import { ManagerDashboard } from './ManagerDashboard'
import { ExecutiveDashboard } from './ExecutiveDashboard'

export { CitizenDashboard, EmployeeDashboard, CoordinatorDashboard, ManagerDashboard, ExecutiveDashboard }

// Dashboard mapping by user level
export const DASHBOARD_COMPONENTS = {
  0: CitizenDashboard,
  1: EmployeeDashboard,
  2: CoordinatorDashboard,
  3: ManagerDashboard,
  4: ExecutiveDashboard
} as const

// Dashboard names by level
export const DASHBOARD_NAMES = {
  0: 'Painel do Cidadão',
  1: 'Painel do Funcionário',
  2: 'Painel de Coordenação',
  3: 'Painel Gerencial',
  4: 'Painel Executivo'
} as const

// Dashboard access levels
export const DASHBOARD_ACCESS = {
  citizen: 0,
  employee: 1,
  coordinator: 2,
  manager: 3,
  executive: 4
} as const

// Helper function to get dashboard component by user level
export const getDashboardComponent = (userLevel: number) => {
  return DASHBOARD_COMPONENTS[userLevel as keyof typeof DASHBOARD_COMPONENTS]
}

// Helper function to get dashboard name by user level
export const getDashboardName = (userLevel: number) => {
  return DASHBOARD_NAMES[userLevel as keyof typeof DASHBOARD_NAMES]
}

// Helper function to check dashboard access
export const hasAccessToDashboard = (userLevel: number, requiredLevel: number) => {
  return userLevel >= requiredLevel
}