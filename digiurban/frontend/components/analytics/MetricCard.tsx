'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number | string
  unit?: string
  description?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number
  trendPeriod?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  loading?: boolean
}

export function MetricCard({
  title,
  value,
  unit = '',
  description,
  icon: Icon,
  trend,
  trendValue,
  trendPeriod = 'vs. período anterior',
  variant = 'default',
  size = 'md',
  className,
  loading = false
}: MetricCardProps) {

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="pb-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </CardContent>
      </Card>
    )
  }

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  const valueSize = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          card: 'border-green-200 bg-green-50',
          value: 'text-green-700',
          icon: 'text-green-600'
        }
      case 'warning':
        return {
          card: 'border-yellow-200 bg-yellow-50',
          value: 'text-yellow-700',
          icon: 'text-yellow-600'
        }
      case 'danger':
        return {
          card: 'border-red-200 bg-red-50',
          value: 'text-red-700',
          icon: 'text-red-600'
        }
      case 'info':
        return {
          card: 'border-blue-200 bg-blue-50',
          value: 'text-blue-700',
          icon: 'text-blue-600'
        }
      default:
        return {
          card: '',
          value: 'text-gray-900',
          icon: 'text-gray-600'
        }
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

  const styles = getVariantStyles()

  return (
    <Card className={cn(styles.card, className)}>
      <CardHeader className={cn('pb-2', sizeClasses[size])}>
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className={cn(
              'font-medium leading-none tracking-tight',
              size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs'
            )}>
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            )}
          </div>
          {Icon && (
            <Icon className={cn(iconSize[size], styles.icon)} />
          )}
        </div>
      </CardHeader>

      <CardContent className={cn('pt-0', sizeClasses[size])}>
        <div className="space-y-2">
          {/* Valor Principal */}
          <div className="flex items-baseline space-x-1">
            <div className={cn(
              'font-bold tracking-tight',
              valueSize[size],
              styles.value
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

          {/* Tendência */}
          {trend && trendValue !== undefined && (
            <div className="flex items-center space-x-1 text-xs">
              <span className={getTrendColor()}>
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
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
        </div>
      </CardContent>
    </Card>
  )
}