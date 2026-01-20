'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Bot,
  TrendingUp,
  Users,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  Clock,
  Target,
} from 'lucide-react';

export function BotAnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/flows/stats/overview`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Erro ao carregar analytics');

      const data = await response.json();

      // Adapta formato para o novo sistema de fluxos
      const adaptedStats = {
        totalConversations: data.stats?.executions?.total || 0,
        activeConversations: data.stats?.executions?.active || 0,
        avgRating: 4.5, // Placeholder - implementar sistema de rating
        analytics: data.stats?.topFlows?.map((flow: any) => ({
          intent: flow.flowName,
          totalCount: flow.executionCount,
          successCount: flow.executionCount,
          transferCount: 0,
          date: new Date().toISOString()
        })) || []
      };

      setStats(adaptedStats);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <div className="p-8">Carregando...</div>;
  }

  const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

  // Agrupa analytics por intent
  const intentData = stats.analytics.reduce((acc: any, item: any) => {
    const existing = acc.find((a: any) => a.intent === item.intent);
    if (existing) {
      existing.total += item.totalCount;
      existing.success += item.successCount;
      existing.transfer += item.transferCount;
    } else {
      acc.push({
        intent: item.intent,
        total: item.totalCount,
        success: item.successCount,
        transfer: item.transferCount,
      });
    }
    return acc;
  }, []);

  // Calcula taxa de sucesso
  const successRate = stats.analytics.reduce((sum: number, item: any) => sum + item.totalCount, 0) > 0
    ? (stats.analytics.reduce((sum: number, item: any) => sum + item.successCount, 0) /
        stats.analytics.reduce((sum: number, item: any) => sum + item.totalCount, 0)) *
      100
    : 0;

  const transferRate = stats.analytics.reduce((sum: number, item: any) => sum + item.totalCount, 0) > 0
    ? (stats.analytics.reduce((sum: number, item: any) => sum + item.transferCount, 0) /
        stats.analytics.reduce((sum: number, item: any) => sum + item.totalCount, 0)) *
      100
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics do DigiBot</h1>
          <p className="text-gray-600 mt-1">
            Métricas e desempenho do assistente virtual
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>Últimos 7 dias</option>
          <option value={15}>Últimos 15 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversas Totais</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalConversations}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversas Ativas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.activeConversations}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Sucesso</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {successRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avaliação Média</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.avgRating.toFixed(1)} ⭐
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <ThumbsUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intents por Volume */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Intents Mais Usadas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={intentData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="intent" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#3B82F6" name="Total" />
              <Bar dataKey="success" fill="#10B981" name="Sucesso" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribuição de Intents */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição de Intents</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={intentData.slice(0, 5)}
                dataKey="total"
                nameKey="intent"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {intentData.slice(0, 5).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        {/* Timeline */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tendência ao Longo do Tempo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalCount"
                stroke="#3B82F6"
                name="Total"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="successCount"
                stroke="#10B981"
                name="Sucesso"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="transferCount"
                stroke="#EF4444"
                name="Transferências"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Alerts */}
      {transferRate > 20 && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-red-900">
                Alta Taxa de Transferência
              </h4>
              <p className="text-red-700 mt-1">
                {transferRate.toFixed(1)}% das conversas estão sendo transferidas para
                atendentes humanos. Considere revisar os fluxos e melhorar o
                treinamento do bot.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default BotAnalyticsDashboard;
