'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon?: LucideIcon
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
  compact?: boolean
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  badge,
  badgeVariant = 'secondary',
  className,
  compact = false
}: StatCardProps) {

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: 'text-green-600',
      border: 'border-green-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      icon: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: 'text-red-600',
      border: 'border-red-200'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      icon: 'text-purple-600',
      border: 'border-purple-200'
    },
    gray: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      icon: 'text-gray-600',
      border: 'border-gray-200'
    }
  }

  const styles = colorClasses[color]

  return (
    <Card className={cn(
      styles.bg,
      styles.border,
      'transition-all duration-200 hover:shadow-sm',
      className
    )}>
      <CardContent className={cn(
        'flex items-center justify-between',
        compact ? 'p-4' : 'p-6'
      )}>
        <div className="space-y-1">
          <p className={cn(
            'font-medium leading-none',
            compact ? 'text-sm' : 'text-base'
          )}>
            {title}
          </p>
          <p className={cn(
            'font-bold tracking-tight',
            styles.text,
            compact ? 'text-2xl' : 'text-3xl'
          )}>
            {typeof value === 'number' ?
              value.toLocaleString('pt-BR') : value
            }
          </p>
          {subtitle && (
            <p className={cn(
              'text-muted-foreground',
              compact ? 'text-xs' : 'text-sm'
            )}>
              {subtitle}
            </p>
          )}
          {badge && (
            <Badge variant={badgeVariant} className="text-xs">
              {badge}
            </Badge>
          )}
        </div>

        {Icon && (
          <div className={cn(
            'p-3 rounded-full',
            styles.bg === 'bg-gray-50' ? 'bg-white' : styles.bg
          )}>
            <Icon className={cn(
              styles.icon,
              compact ? 'h-6 w-6' : 'h-8 w-8'
            )} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}