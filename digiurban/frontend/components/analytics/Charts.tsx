'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart
} from 'recharts'

// Cores padrão para gráficos
const CHART_COLORS = [
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

interface ChartProps {
  title?: string
  description?: string
  data: any[]
  className?: string
  height?: number
  loading?: boolean
}

interface LineChartProps extends ChartProps {
  xKey: string
  yKey: string | string[]
  colors?: string[]
  showGrid?: boolean
  showLegend?: boolean
}

interface BarChartProps extends ChartProps {
  xKey: string
  yKey: string | string[]
  colors?: string[]
  showGrid?: boolean
  showLegend?: boolean
  orientation?: 'horizontal' | 'vertical'
}

interface PieChartProps extends ChartProps {
  dataKey: string
  nameKey: string
  colors?: string[]
  showLabels?: boolean
  showLegend?: boolean
}

interface AreaChartProps extends ChartProps {
  xKey: string
  yKey: string | string[]
  colors?: string[]
  showGrid?: boolean
  showLegend?: boolean
  stacked?: boolean
}

// Componente base para container de gráficos
function ChartContainer({
  title,
  description,
  children,
  className,
  loading = false
}: {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

// Custom tooltip
function CustomTooltip({ active, payload, label, formatter }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-900">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// Gráfico de Linha
export function AnalyticsLineChart({
  title,
  description,
  data,
  xKey,
  yKey,
  colors = CHART_COLORS,
  showGrid = true,
  showLegend = true,
  height = 300,
  className,
  loading
}: LineChartProps) {
  const yKeys = Array.isArray(yKey) ? yKey : [yKey]

  return (
    <ChartContainer
      title={title}
      description={description}
      className={className}
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          {yKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// Gráfico de Barras
export function AnalyticsBarChart({
  title,
  description,
  data,
  xKey,
  yKey,
  colors = CHART_COLORS,
  showGrid = true,
  showLegend = true,
  orientation = 'vertical',
  height = 300,
  className,
  loading
}: BarChartProps) {
  const yKeys = Array.isArray(yKey) ? yKey : [yKey]

  return (
    <ChartContainer
      title={title}
      description={description}
      className={className}
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          {yKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// Gráfico de Pizza
export function AnalyticsPieChart({
  title,
  description,
  data,
  dataKey,
  nameKey,
  colors = CHART_COLORS,
  showLabels = true,
  showLegend = true,
  height = 300,
  className,
  loading
}: PieChartProps) {
  const renderLabel = ({ name, value, percent }: any) => {
    if (!showLabels) return null
    return `${name}: ${(percent * 100).toFixed(0)}%`
  }

  return (
    <ChartContainer
      title={title}
      description={description}
      className={className}
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showLabels ? renderLabel : false}
            outerRadius={80}
            fill="#8884d8"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// Gráfico de Área
export function AnalyticsAreaChart({
  title,
  description,
  data,
  xKey,
  yKey,
  colors = CHART_COLORS,
  showGrid = true,
  showLegend = true,
  stacked = false,
  height = 300,
  className,
  loading
}: AreaChartProps) {
  const yKeys = Array.isArray(yKey) ? yKey : [yKey]

  return (
    <ChartContainer
      title={title}
      description={description}
      className={className}
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          {yKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId={stacked ? '1' : undefined}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// Gauge Chart (Velocímetro)
export function GaugeChart({
  title,
  description,
  value,
  max = 100,
  unit = '%',
  color = '#3B82F6',
  className,
  size = 200
}: {
  title?: string
  description?: string
  value: number
  max?: number
  unit?: string
  color?: string
  className?: string
  size?: number
}) {
  const percentage = Math.min((value / max) * 100, 100)
  const angle = (percentage / 100) * 180 - 90

  return (
    <ChartContainer title={title} description={description} className={className}>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative" style={{ width: size, height: size / 2 + 40 }}>
          <svg
            width={size}
            height={size / 2 + 40}
            viewBox={`0 0 ${size} ${size / 2 + 40}`}
          >
            {/* Background arc */}
            <path
              d={`M 20 ${size / 2 + 20} A ${size / 2 - 20} ${size / 2 - 20} 0 0 1 ${size - 20} ${size / 2 + 20}`}
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />

            {/* Progress arc */}
            <path
              d={`M 20 ${size / 2 + 20} A ${size / 2 - 20} ${size / 2 - 20} 0 0 1 ${size - 20} ${size / 2 + 20}`}
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 100) * Math.PI * (size / 2 - 20)} ${Math.PI * (size / 2 - 20)}`}
              className="transition-all duration-1000 ease-in-out"
            />

            {/* Center value */}
            <text
              x={size / 2}
              y={size / 2 + 10}
              textAnchor="middle"
              className="text-2xl font-bold fill-current"
            >
              {value.toFixed(1)}{unit}
            </text>
          </svg>
        </div>

        <div className="text-center">
          <div className="text-sm text-muted-foreground">
            Meta: {max}{unit}
          </div>
          <Badge
            variant={percentage >= 80 ? 'default' : percentage >= 60 ? 'secondary' : 'destructive'}
            className="mt-1"
          >
            {percentage.toFixed(1)}% da meta
          </Badge>
        </div>
      </div>
    </ChartContainer>
  )
}

// Heatmap simples
export function HeatMap({
  title,
  description,
  data,
  xKey,
  yKey,
  valueKey,
  colors = ['#FEF3C7', '#F59E0B', '#DC2626'],
  className
}: {
  title?: string
  description?: string
  data: any[]
  xKey: string
  yKey: string
  valueKey: string
  colors?: string[]
  className?: string
}) {
  const maxValue = Math.max(...data.map(d => d[valueKey]))

  const getColor = (value: number) => {
    const intensity = value / maxValue
    if (intensity > 0.7) return colors[2] || '#DC2626'
    if (intensity > 0.4) return colors[1] || '#F59E0B'
    return colors[0] || '#FEF3C7'
  }

  return (
    <ChartContainer title={title} description={description} className={className}>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(30px, 1fr))` }}>
        {data.map((item, index) => (
          <div
            key={index}
            className="aspect-square rounded-sm flex items-center justify-center text-xs font-medium"
            style={{ backgroundColor: getColor(item[valueKey]) }}
            title={`${item[xKey]} - ${item[yKey]}: ${item[valueKey]}`}
          >
            {item[valueKey]}
          </div>
        ))}
      </div>
    </ChartContainer>
  )
}