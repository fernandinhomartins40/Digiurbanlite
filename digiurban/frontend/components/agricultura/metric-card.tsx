'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'green' | 'blue' | 'orange' | 'purple' | 'red';
  loading?: boolean;
}

const colorClasses = {
  green: {
    bg: 'bg-green-500',
    text: 'text-green-600',
    iconBg: 'bg-green-100',
  },
  blue: {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    iconBg: 'bg-blue-100',
  },
  orange: {
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    iconBg: 'bg-orange-100',
  },
  purple: {
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    iconBg: 'bg-purple-100',
  },
  red: {
    bg: 'bg-red-500',
    text: 'text-red-600',
    iconBg: 'bg-red-100',
  },
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'green',
  loading = false,
}: MetricCardProps) {
  const colors = colorClasses[color];

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', colors.iconBg)}>
            <Icon className={cn('h-5 w-5', colors.text)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', colors.iconBg)}>
          <Icon className={cn('h-5 w-5', colors.text)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              <span
                className={cn(
                  trend.value > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.value > 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
