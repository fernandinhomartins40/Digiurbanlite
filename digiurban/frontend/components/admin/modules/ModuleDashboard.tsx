'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleStatConfig, ModuleStats } from '@/lib/module-configs';
import {
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  MapPin,
  Maximize,
  Sprout,
  BarChart,
  FileBarChart,
  DollarSign,
  FileText,
  Calendar,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  MapPin,
  Maximize,
  Sprout,
  BarChart,
  FileBarChart,
  DollarSign,
  FileText,
  Calendar,
};

const colorMap: Record<string, string> = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  amber: 'text-amber-600',
  emerald: 'text-emerald-600',
  purple: 'text-purple-600',
};

interface ModuleDashboardProps {
  stats: ModuleStats | null;
  config: ModuleStatConfig[];
  loading?: boolean;
}

export function ModuleDashboard({ stats, config, loading }: ModuleDashboardProps) {
  const formatValue = (value: number | string, format?: string): string => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'area':
        return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ha`;
      case 'number':
      default:
        return value.toLocaleString('pt-BR');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {config.map((statConfig) => {
        const Icon = statConfig.icon ? iconMap[statConfig.icon] : null;
        const colorClass = statConfig.color ? colorMap[statConfig.color] : 'text-gray-600';
        const value = stats ? stats[statConfig.key] : 0;

        return (
          <Card key={statConfig.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{statConfig.label}</CardTitle>
              {Icon && <Icon className={`h-4 w-4 ${colorClass}`} />}
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatValue(value || 0, statConfig.format)}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
