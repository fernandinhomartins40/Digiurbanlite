'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Stethoscope,
  DoorOpen,
  Clock,
  Calendar,
  Settings,
  ArrowLeft,
  Activity,
  Link2,
  Users,
  MapPin,
  UserPlus,
  UserCog,
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

  const sections = [
    {
      title: '🏗️ Infraestrutura',
      description: 'Estrutura física e recursos',
      cards: [
        {
          title: 'Unidades de Saúde',
          description: 'UBS, UPA, Hospitais e Clínicas',
          icon: Building2,
          color: 'bg-blue-500',
          href: '/admin/apps/saude/cadastros/unidades',
          badge: `${stats?.unidades?.ativas || 0} ativas`,
        },
        {
          title: 'Salas e Consultórios',
          description: 'Salas de atendimento e consultórios',
          icon: DoorOpen,
          color: 'bg-orange-500',
          href: '/admin/apps/saude/cadastros/salas',
          badge: `${stats?.salas?.ativas || 0} ativas`,
        },
        {
          title: 'Especialidades Médicas',
          description: 'Cardiologia, Pediatria, etc.',
          icon: Stethoscope,
          color: 'bg-purple-500',
          href: '/admin/apps/saude/cadastros/especialidades',
          badge: `${stats?.especialidades?.ativas || 0} ativas`,
        },
      ],
    },
    {
      title: '👥 Estratégia Saúde da Família (ESF)',
      description: 'Equipes, microáreas e territorialização',
      cards: [
        {
          title: 'Equipes ESF',
          description: 'Equipes de Saúde da Família',
          icon: Users,
          color: 'bg-teal-500',
          href: '/admin/apps/saude/cadastros/equipes',
          badge: 'ESF',
        },
        {
          title: 'Microáreas',
          description: 'Territorialização e ACS responsáveis',
          icon: MapPin,
          color: 'bg-purple-500',
          href: '/admin/apps/saude/cadastros/microareas',
          badge: 'Novo',
        },
      ],
    },
    {
      title: '👨‍⚕️ Recursos Humanos',
      description: 'Gestão de profissionais e vínculos',
      cards: [
        {
          title: 'Servidores de Saúde',
          description: 'Vincular servidores aos serviços de saúde',
          icon: UserPlus,
          color: 'bg-green-500',
          href: '/admin/apps/saude/cadastros/servidores-saude',
          badge: 'Novo',
        },
        {
          title: 'Vínculos Profissional-Unidade',
          description: 'Gerenciar vínculos entre profissionais e unidades',
          icon: Link2,
          color: 'bg-cyan-500',
          href: '/admin/apps/saude/cadastros/vinculos',
          badge: 'Vínculos',
        },
        {
          title: 'Profissionais (Legado)',
          description: 'Sistema antigo - em processo de descontinuação',
          icon: UserCog,
          color: 'bg-gray-400',
          href: '/admin/apps/saude/cadastros/profissionais',
          badge: `${stats?.profissionais?.ativos || 0} ativos`,
        },
      ],
    },
    {
      title: '⚙️ Operação e Agendamento',
      description: 'Configurações de atendimento',
      cards: [
        {
          title: 'Turnos de Trabalho',
          description: 'Manhã, Tarde, Noite',
          icon: Clock,
          color: 'bg-yellow-500',
          href: '/admin/apps/saude/cadastros/turnos',
          badge: `${stats?.turnos?.ativos || 0} ativos`,
        },
        {
          title: 'Agendas Médicas',
          description: 'Configuração de agendas e horários',
          icon: Calendar,
          color: 'bg-pink-500',
          href: '/admin/apps/saude/cadastros/agendas',
          badge: `${stats?.agendas?.ativas || 0} ativas`,
        },
        {
          title: 'Configurações',
          description: 'Configurações de atendimento por unidade',
          icon: Settings,
          color: 'bg-gray-500',
          href: '/admin/apps/saude/cadastros/configuracoes',
          badge: 'Por unidade',
        },
      ],
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

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Nova Organização de Cadastros</h3>
                <p className="text-sm text-blue-800">
                  Os cadastros foram reorganizados em 4 seções lógicas: Infraestrutura (locais físicos),
                  ESF (equipes e territorialização), RH (servidores e vínculos) e Operação (agendas e configurações).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando estatísticas...</p>
          </div>
        ) : (
          <>
            {/* Sections */}
            {sections.map((section) => (
              <div key={section.title} className="mb-8">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  <p className="text-gray-600">{section.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.cards.map((card) => (
                    <Card
                      key={card.title}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => router.push(card.href)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className={`p-3 rounded-lg ${card.color} bg-opacity-10`}>
                            <card.icon className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`} />
                          </div>
                          <Badge variant="secondary">{card.badge}</Badge>
                        </div>
                        <CardTitle className="mt-4">{card.title}</CardTitle>
                        <p className="text-sm text-gray-600">{card.description}</p>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" className="w-full">
                          Gerenciar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {/* Quick Actions */}
            <Card className="mt-6 bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle>🚀 Fluxo Recomendado para Novos Cadastros</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="text-sm text-purple-900 space-y-2">
                  <li><strong>1. Infraestrutura:</strong> Cadastre as unidades de saúde, salas e especialidades</li>
                  <li><strong>2. ESF:</strong> Crie as equipes de Saúde da Família e defina as microáreas</li>
                  <li><strong>3. RH:</strong> Vincule os servidores existentes do Digiurban aos serviços de saúde</li>
                  <li><strong>4. Vínculos:</strong> Associe os profissionais às unidades e equipes onde atuam</li>
                  <li><strong>5. Operação:</strong> Configure turnos de trabalho e crie as agendas médicas</li>
                </ol>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
