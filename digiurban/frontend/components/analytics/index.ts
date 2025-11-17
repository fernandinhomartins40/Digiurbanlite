// Analytics Components - Fase 6

// Chart Components
export {
  AnalyticsLineChart,
  AnalyticsBarChart,
  AnalyticsPieChart,
  AnalyticsAreaChart,
  GaugeChart,
  HeatMap
} from './Charts'

// KPI & Metric Components
export { KPICard } from './KPICard'
export { MetricCard } from './MetricCard'
export { StatCard } from './StatCard'

// Dashboard Components
export {
  CitizenDashboard,
  EmployeeDashboard,
  CoordinatorDashboard,
  ManagerDashboard,
  ExecutiveDashboard,
  DASHBOARD_COMPONENTS,
  DASHBOARD_NAMES,
  DASHBOARD_ACCESS,
  getDashboardComponent,
  getDashboardName,
  hasAccessToDashboard
} from './dashboards'

// Dashboard component types (interfaces are not exported from components)
export type DashboardLevel = 0 | 1 | 2 | 3 | 4 | 5

export type DashboardType = 'citizen' | 'employee' | 'coordinator' | 'manager' | 'executive' | 'superadmin'

// Chart color constants
export const CHART_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#F97316', // orange-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#EC4899', // pink-500
  '#6B7280'  // gray-500
]

// Common chart props types
export interface BaseChartProps {
  title?: string
  description?: string
  data: any[]
  className?: string
  height?: number
  loading?: boolean
}

export interface LineChartProps extends BaseChartProps {
  xKey: string
  yKey: string | string[]
  colors?: string[]
  showGrid?: boolean
  showLegend?: boolean
}

export interface BarChartProps extends BaseChartProps {
  xKey: string
  yKey: string | string[]
  colors?: string[]
  showGrid?: boolean
  showLegend?: boolean
  orientation?: 'horizontal' | 'vertical'
}

export interface PieChartProps extends BaseChartProps {
  dataKey: string
  nameKey: string
  colors?: string[]
  showLabels?: boolean
  showLegend?: boolean
}

export interface AreaChartProps extends BaseChartProps {
  xKey: string
  yKey: string | string[]
  colors?: string[]
  showGrid?: boolean
  showLegend?: boolean
  stacked?: boolean
}