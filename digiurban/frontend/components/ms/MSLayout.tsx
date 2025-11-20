'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface MSTab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  badge?: number;
}

export interface MSLayoutProps {
  title: string;
  description: string;
  icon?: ReactNode;
  departmentSlug?: string;
  tabs: MSTab[];
  defaultTab?: string;
  actions?: ReactNode;
  metrics?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
    color?: 'green' | 'red' | 'blue' | 'yellow';
  }[];
}

export function MSLayout({
  title,
  description,
  icon,
  departmentSlug,
  tabs,
  defaultTab,
  actions,
  metrics,
}: MSLayoutProps) {
  const router = useRouter();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {departmentSlug && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/admin/secretarias/${departmentSlug}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            {icon && <div className="text-2xl">{icon}</div>}
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          </div>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="flex gap-2">
          {actions}
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && metrics.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.label}
                </CardTitle>
                {metric.trend && (
                  <Badge
                    variant={
                      metric.trend === 'up'
                        ? 'default'
                        : metric.trend === 'down'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue={defaultTab || tabs[0]?.id} className="space-y-4">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tab.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
