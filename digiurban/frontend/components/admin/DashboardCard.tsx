'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardCardProps {
  title: string
  description?: string
  href?: string
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  badge?: string | number
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'new'
  onClick?: () => void
  className?: string
  disabled?: boolean
  stats?: {
    value: string | number
    label: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
  }
}

export function DashboardCard({
  title,
  description,
  href,
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
  badge,
  badgeVariant = 'secondary',
  onClick,
  className,
  disabled = false,
  stats
}: DashboardCardProps) {
  const content = (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:scale-[1.02] hover:border-primary/50',
        'active:scale-[0.98]',
        disabled && 'opacity-50 cursor-not-allowed hover:shadow-none hover:scale-100',
        !disabled && (href || onClick) && 'cursor-pointer',
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      {/* Background gradient effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg transition-transform duration-300',
              'group-hover:scale-110',
              iconBgColor
            )}
          >
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>

          {/* Badge */}
          {badge !== undefined && badge !== null && badge !== '' && (
            <Badge
              variant={badgeVariant === 'new' ? 'default' : badgeVariant}
              className={cn(
                'shrink-0',
                badgeVariant === 'new' &&
                  'bg-gradient-to-r from-blue-500 to-purple-600 text-white animate-pulse'
              )}
            >
              {badge}
            </Badge>
          )}
        </div>

        <CardTitle className="mt-3 text-lg font-semibold leading-tight">
          {title}
        </CardTitle>

        {description && (
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      {stats && (
        <CardContent className="relative">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {stats.value}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.label}
              </p>
            </div>
            {stats.trend && stats.trendValue && (
              <div
                className={cn(
                  'text-xs font-medium',
                  stats.trend === 'up' && 'text-green-600',
                  stats.trend === 'down' && 'text-red-600',
                  stats.trend === 'neutral' && 'text-gray-600'
                )}
              >
                {stats.trend === 'up' && '↑'}
                {stats.trend === 'down' && '↓'}
                {stats.trend === 'neutral' && '→'}
                {stats.trendValue}
              </div>
            )}
          </div>
        </CardContent>
      )}

      {/* Arrow indicator on hover */}
      {!disabled && (href || onClick) && (
        <div className="absolute bottom-3 right-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </div>
      )}
    </Card>
  )

  if (href && !disabled) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

// Variant: Stat Card (para métricas rápidas)
interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }
  href?: string
  className?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  href,
  className
}: StatCardProps) {
  const content = (
    <Card
      className={cn(
        'group transition-all duration-300 hover:shadow-md hover:scale-[1.02]',
        href && 'cursor-pointer',
        className
      )}
    >
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold">{value}</h3>
            {trend && (
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.direction === 'up' && 'text-green-600',
                  trend.direction === 'down' && 'text-red-600',
                  trend.direction === 'neutral' && 'text-gray-600'
                )}
              >
                {trend.direction === 'up' && '↑'}
                {trend.direction === 'down' && '↓'}
                {trend.direction === 'neutral' && '→'}
                {trend.value}
              </span>
            )}
          </div>
        </div>
        <div className="ml-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}
