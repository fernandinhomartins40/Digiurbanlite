'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  MessageSquare,
  Bot,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { MessagesInterface } from '@/src/components/Messages/MessagesInterface';

interface Stats {
  totalConversations: number;
  activeConversations: number;
  botConversations: number;
  humanConversations: number;
  averageResponseTime: string;
  satisfactionRate: number;
}

export default function AdminMessagesPage() {
  const { user } = useAdminAuth();

  const [stats, setStats] = useState<Stats>({
    totalConversations: 0,
    activeConversations: 0,
    botConversations: 0,
    humanConversations: 0,
    averageResponseTime: '0s',
    satisfactionRate: 0,
  });

  const MESSAGES_API_URL = process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:9001/api';

  // Carregar estatísticas
  const loadStats = async () => {
    try {
      const response = await fetch(`${MESSAGES_API_URL}/admin/stats`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  useEffect(() => {
    loadStats();
    // Recarregar a cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return null;
  }

  const botPercentage =
    stats.totalConversations > 0
      ? ((stats.botConversations / stats.totalConversations) * 100).toFixed(0)
      : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mensagens</h1>
        <p className="text-muted-foreground">
          Gerencie conversas e atendimentos
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Conversas
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeConversations} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Atendimento IA
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.botConversations}</div>
            <p className="text-xs text-muted-foreground">
              {botPercentage}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Atendimento Humano
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.humanConversations}</div>
            <p className="text-xs text-muted-foreground">
              {100 - parseInt(botPercentage)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.satisfactionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo médio: {stats.averageResponseTime}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interface de mensagens */}
      <Card>
        <MessagesInterface
          userId={user.id}
          userType="SERVER"
          mode="admin"
          showStats={true}
          showManagement={true}
        />
      </Card>
    </div>
  );
}
