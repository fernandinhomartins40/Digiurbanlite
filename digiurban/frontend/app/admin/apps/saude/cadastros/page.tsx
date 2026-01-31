'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  UserCog,
  Stethoscope,
  DoorOpen,
  Clock,
  Calendar,
  Settings,
  ArrowLeft,
  Plus,
  Activity,
  Link2,
} from 'lucide-react';

interface Stats {
  unidades: { total: number; ativas: number; porTipo: any[] };
  profissionais: { total: number; ativos: number; porCategoria: any[] };
  especialidades: { total: number; ativas: number };
  salas: { total: number; ativas: number; porTipo: any[] };
  turnos: { total: number; ativos: number };
  agendas: { total: number; ativas: number };
}

export default function CadastrosDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [unidades, profissionais, especialidades, salas, turnos, agendas] = await Promise.all([
        fetch('/api/apps/saude/cadastros/unidades/stats', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/apps/saude/cadastros/profissionais/stats', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/apps/saude/cadastros/especialidades/stats', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/apps/saude/cadastros/salas/stats', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/apps/saude/cadastros/turnos/stats', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/apps/saude/cadastros/agendas/stats', { credentials: 'include' }).then((r) => r.json()),
      ]);

      setStats({ unidades, profissionais, especialidades, salas, turnos, agendas });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cadastros = [
    {
      title: 'Unidades de Saúde',
      description: 'UBS, UPA, Hospitais e Clínicas',
      icon: Building2,
      color: 'bg-blue-500',
      href: '/admin/apps/saude/cadastros/unidades',
      stats: stats?.unidades,
      badge: `${stats?.unidades?.ativas || 0} ativas`,
    },
    {
      title: 'Profissionais de Saúde',
      description: 'Médicos, Enfermeiros e demais profissionais',
      icon: UserCog,
      color: 'bg-green-500',
      href: '/admin/apps/saude/cadastros/profissionais',
      stats: stats?.profissionais,
      badge: `${stats?.profissionais?.ativos || 0} ativos`,
    },
    {
      title: 'Especialidades Médicas',
      description: 'Cardiologia, Pediatria, etc.',
      icon: Stethoscope,
      color: 'bg-purple-500',
      href: '/admin/apps/saude/cadastros/especialidades',
      stats: stats?.especialidades,
      badge: `${stats?.especialidades?.ativas || 0} ativas`,
    },
    {
      title: 'Salas e Consultórios',
      description: 'Salas de atendimento e consultórios',
      icon: DoorOpen,
      color: 'bg-orange-500',
      href: '/admin/apps/saude/cadastros/salas',
      stats: stats?.salas,
      badge: `${stats?.salas?.ativas || 0} ativas`,
    },
    {
      title: 'Turnos de Trabalho',
      description: 'Manhã, Tarde, Noite',
      icon: Clock,
      color: 'bg-yellow-500',
      href: '/admin/apps/saude/cadastros/turnos',
      stats: stats?.turnos,
      badge: `${stats?.turnos?.ativos || 0} ativos`,
    },
    {
      title: 'Agendas Médicas',
      description: 'Configuração de agendas e horários',
      icon: Calendar,
      color: 'bg-pink-500',
      href: '/admin/apps/saude/cadastros/agendas',
      stats: stats?.agendas,
      badge: `${stats?.agendas?.ativas || 0} ativas`,
    },
    {
      title: 'Vínculos Profissional-Unidade',
      description: 'Gerenciar vínculos entre profissionais e unidades',
      icon: Link2,
      color: 'bg-cyan-500',
      href: '/admin/apps/saude/cadastros/vinculos',
      stats: null,
      badge: 'Novo',
    },
    {
      title: 'Configurações',
      description: 'Configurações de atendimento por unidade',
      icon: Settings,
      color: 'bg-gray-500',
      href: '/admin/apps/saude/cadastros/configuracoes',
      stats: null,
      badge: 'Por unidade',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cadastros e Configurações</h1>
              <p className="text-gray-600">Sistema de Atendimento de Saúde</p>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Sistema Ativo
          </Badge>
        </div>

        {/* Stats Overview */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando estatísticas...</p>
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cadastros.map((cadastro) => (
                <Card
                  key={cadastro.title}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(cadastro.href)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${cadastro.color} bg-opacity-10`}>
                        <cadastro.icon className={`h-6 w-6 ${cadastro.color.replace('bg-', 'text-')}`} />
                      </div>
                      <Badge variant="secondary">{cadastro.badge}</Badge>
                    </div>
                    <CardTitle className="mt-4">{cadastro.title}</CardTitle>
                    <p className="text-sm text-gray-600">{cadastro.description}</p>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => router.push(cadastro.href)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Gerenciar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push('/admin/apps/saude/cadastros/unidades/nova')}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Nova Unidade de Saúde
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push('/admin/apps/saude/cadastros/profissionais/novo')}
                  >
                    <UserCog className="h-4 w-4 mr-2" />
                    Novo Profissional
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push('/admin/apps/saude/cadastros/agendas/nova')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Nova Agenda Médica
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
