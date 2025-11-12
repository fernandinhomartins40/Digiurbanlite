'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus, Target, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: number | string
  unit?: string
  target?: number
  warning?: number
  critical?: number
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number
  trendPeriod?: string
  status?: 'good' | 'warning' | 'critical' | 'normal'
  description?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function KPICard({
  title,
  value,
  unit = '',
  target,
  warning,
  critical,
  trend,
  trendValue,
  trendPeriod = 'vs. período anterior',
  status = 'normal',
  description,
  className,
  size = 'md'
}: KPICardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value as string)

  // Calcular progresso em relação à meta
  const progress = target ? Math.min((numericValue / target) * 100, 100) : undefined

  // Definir cores baseadas no status
  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Target className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const valueSize = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className={cn('pb-3', sizeClasses[size])}>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className={cn(
              'text-sm font-medium leading-none tracking-tight',
              size === 'lg' ? 'text-base' : 'text-sm'
            )}>
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon()}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn('pt-0', sizeClasses[size])}>
        <div className="space-y-3">
          {/* Valor Principal */}
          <div className="flex items-baseline space-x-2">
            <div className={cn(
              'font-bold tracking-tight',
              valueSize[size],
              getStatusColor()
            )}>
              {typeof value === 'number' ?
                value.toLocaleString('pt-BR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                }) : value
              }
            </div>
            {unit && (
              <span className="text-sm text-muted-foreground font-medium">
                {unit}
              </span>
            )}
          </div>

          {/* Progresso em relação à meta */}
          {target && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Meta: {target.toLocaleString('pt-BR')} {unit}
                </span>
                <span className={cn('font-medium', getStatusColor())}>
                  {Math.round((numericValue / target) * 100)}%
                </span>
              </div>
              <Progress
                value={progress}
                className="h-2"
              />
            </div>
          )}

          {/* Tendência */}
          {trend && trendValue !== undefined && (
            <div className="flex items-center space-x-2 text-xs">
              {getTrendIcon()}
              <span className={getTrendColor()}>
                {trendValue > 0 ? '+' : ''}{trendValue.toLocaleString('pt-BR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 1
                })}%
              </span>
              <span className="text-muted-foreground">
                {trendPeriod}
              </span>
            </div>
          )}

          {/* Badges de limites */}
          <div className="flex flex-wrap gap-1">
            {critical && (
              <Badge variant="destructive" className="text-xs h-5">
                Crítico: {critical}{unit}
              </Badge>
            )}
            {warning && (
              <Badge variant="secondary" className="text-xs h-5">
                Atenção: {warning}{unit}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}