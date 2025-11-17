'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    period: string;
    isPositive?: boolean;
  };
  className?: string;
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  loading = false
}: KPICardProps) {
  if (loading) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
          </CardTitle>
          {icon && (
            <div className="h-4 w-4 text-muted-foreground">
              {icon}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2"></div>
          <div className="h-3 bg-muted animate-pulse rounded w-32"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </div>

        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}

        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive !== false
                  ? "text-green-600"
                  : "text-red-600"
              )}
            >
              {trend.isPositive !== false ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              {trend.period}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KPICardGrid({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {children}
    </div>
  );
}