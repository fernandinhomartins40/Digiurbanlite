'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AppCardProps {
  name: string
  description: string
  href: string
  icon: LucideIcon
  modules?: number
  badge?: string
  color?: string
  bgColor?: string
  features?: string[]
  className?: string
}

export function AppCard({
  name,
  description,
  href,
  icon: Icon,
  modules,
  badge,
  color = 'text-primary',
  bgColor = 'bg-primary/5',
  features,
  className
}: AppCardProps) {
  return (
    <Link href={href} className="block group">
      <Card
        className={cn(
          'h-full overflow-hidden transition-all duration-300',
          'hover:shadow-xl hover:scale-[1.03] hover:border-primary/50',
          'active:scale-[0.98]',
          bgColor,
          className
        )}
      >
        {/* Header gradient */}
        <div className={cn('h-2 w-full bg-gradient-to-r', color.replace('text-', 'from-'), 'to-purple-600')} />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            {/* Icon with animated background */}
            <div
              className={cn(
                'relative flex h-14 w-14 items-center justify-center rounded-xl',
                'bg-white shadow-md group-hover:shadow-lg transition-all duration-300',
                'group-hover:scale-110 group-hover:rotate-6'
              )}
            >
              <Icon className={cn('h-7 w-7', color)} />
            </div>

            {/* Badge */}
            {badge && (
              <Badge
                variant={badge === 'Completo' ? 'default' : 'secondary'}
                className={cn(
                  'shrink-0',
                  badge === 'Completo' && 'bg-green-600 text-white'
                )}
              >
                {badge}
              </Badge>
            )}
          </div>

          <CardTitle className="mt-4 text-xl font-bold leading-tight">
            {name}
          </CardTitle>

          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>

          {modules !== undefined && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className={cn('font-semibold', color)}>{modules}+</span>
              <span className="text-muted-foreground">
                {modules === 1 ? 'módulo' : 'módulos'}
              </span>
            </div>
          )}
        </CardHeader>

        {features && features.length > 0 && (
          <CardContent className="pt-0 pb-4">
            <div className="space-y-1.5">
              {features.slice(0, 3).map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <div className={cn('h-1.5 w-1.5 rounded-full', color.replace('text-', 'bg-'))} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        )}

        <CardContent className="pt-2 pb-4">
          <Button
            variant="outline"
            className={cn(
              'w-full group-hover:bg-primary group-hover:text-primary-foreground',
              'transition-all duration-300'
            )}
          >
            Acessar Aplicativo
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-2 transition-transform group-hover:translate-x-1"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}

// Variant: Compact App Card (para grid com muitos apps)
interface CompactAppCardProps {
  name: string
  href: string
  icon: LucideIcon
  color?: string
  className?: string
}

export function CompactAppCard({
  name,
  href,
  icon: Icon,
  color = 'text-primary',
  className
}: CompactAppCardProps) {
  return (
    <Link href={href} className="block group">
      <Card
        className={cn(
          'p-4 transition-all duration-300 hover:shadow-md hover:scale-105',
          'hover:border-primary/50 active:scale-95',
          className
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg',
              'bg-primary/10 group-hover:bg-primary/20 transition-colors'
            )}
          >
            <Icon className={cn('h-6 w-6', color)} />
          </div>
          <span className="text-sm font-medium leading-tight">{name}</span>
        </div>
      </Card>
    </Link>
  )
}
