'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
} from 'lucide-react';

export interface MetricCard {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface MSDashboardProps {
  metrics: MetricCard[];
  charts?: {
    bar?: {
      title: string;
      data: ChartData[];
      dataKeys: string[];
    };
    pie?: {
      title: string;
      data: ChartData[];
    };
    line?: {
      title: string;
      data: ChartData[];
      dataKeys: string[];
    };
  };
  statusDistribution?: {
    label: string;
    value: number;
    color: string;
  }[];
  recentActivity?: {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'success' | 'warning' | 'info' | 'error';
  }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const getIconByColor = (color?: string) => {
  switch (color) {
    case 'green':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'yellow':
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'red':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'purple':
      return <Users className="h-4 w-4 text-purple-600" />;
    default:
      return <FileText className="h-4 w-4 text-blue-600" />;
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-blue-600" />;
  }
};

export function MSDashboard({
  metrics,
  charts,
  statusDistribution,
  recentActivity,
}: MSDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {metric.icon || getIconByColor(metric.color)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.trend && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {metric.trend.isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={metric.trend.isPositive ? 'text-green-600' : 'text-red-600'}>
                    {metric.trend.value}%
                  </span>
                  {metric.description || 'em relação ao mês anterior'}
                </p>
              )}
              {metric.description && !metric.trend && (
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Status Distribution */}
        {statusDistribution && statusDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Visão geral dos estados atuais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusDistribution.map((status, index) => {
                  const total = statusDistribution.reduce((sum, s) => sum + s.value, 0);
                  const percentage = ((status.value / total) * 100).toFixed(1);
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          <span>{status.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{status.value}</span>
                          <span className="text-muted-foreground">({percentage}%)</span>
                        </div>
                      </div>
                      <Progress
                        value={parseFloat(percentage)}
                        className="h-2"
                        style={
                          {
                            '--progress-background': status.color,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {recentActivity && recentActivity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
              <CardDescription>Últimas movimentações no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(activity.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      {charts && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Bar Chart */}
          {charts.bar && (
            <Card>
              <CardHeader>
                <CardTitle>{charts.bar.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={charts.bar.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {charts.bar.dataKeys.map((key, index) => (
                      <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Pie Chart */}
          {charts.pie && (
            <Card>
              <CardHeader>
                <CardTitle>{charts.pie.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={charts.pie.data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {charts.pie.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Line Chart */}
          {charts.line && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{charts.line.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={charts.line.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {charts.line.dataKeys.map((key, index) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={COLORS[index % COLORS.length]}
                        activeDot={{ r: 8 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
