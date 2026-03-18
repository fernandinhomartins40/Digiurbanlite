'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HealthAppHeader } from '@/components/apps/saude/HealthAppHeader';
import {
  Building2,
  Stethoscope,
  DoorOpen,
  Clock,
  Calendar,
  Settings,
  Activity,
  Link2,
  Users,
  MapPin,
  UserCog,
  Workflow,
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
        fetch('/api/professional-data/health/stats', { credentials: 'include' }).then((r) => r.json()),
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
      title: 'Infraestrutura',
      description: 'Estrutura física, ambientes e especialidades de atendimento.',
      sectionIcon: Building2,
      cards: [
        {
          title: 'Unidades de Saúde',
          description: 'UBS, UPA, hospitais e clínicas.',
          icon: Building2,
          color: 'bg-blue-500',
          href: '/admin/apps/saude/cadastros/unidades',
          badge: `${stats?.unidades?.ativas || 0} ativas`,
        },
        {
          title: 'Salas e Consultórios',
          description: 'Salas de atendimento e consultórios.',
          icon: DoorOpen,
          color: 'bg-orange-500',
          href: '/admin/apps/saude/cadastros/salas',
          badge: `${stats?.salas?.ativas || 0} ativas`,
        },
        {
          title: 'Especialidades Médicas',
          description: 'Cardiologia, pediatria e demais especialidades.',
          icon: Stethoscope,
          color: 'bg-purple-500',
          href: '/admin/apps/saude/cadastros/especialidades',
          badge: `${stats?.especialidades?.ativas || 0} ativas`,
        },
      ],
    },
    {
      title: 'Estratégia Saúde da Família (ESF)',
      description: 'Equipes, microáreas e territorialização.',
      sectionIcon: Users,
      cards: [
        {
          title: 'Equipes ESF',
          description: 'Equipes de Saúde da Família e seus vínculos.',
          icon: Users,
          color: 'bg-teal-500',
          href: '/admin/apps/saude/cadastros/equipes',
          badge: 'ESF',
        },
        {
          title: 'Microáreas',
          description: 'Territorialização e ACS responsáveis.',
          icon: MapPin,
          color: 'bg-purple-500',
          href: '/admin/apps/saude/cadastros/microareas',
          badge: 'Gestão territorial',
        },
      ],
    },
    {
      title: 'Recursos Humanos',
      description: 'Profissionais, vínculos e estrutura operacional.',
      sectionIcon: UserCog,
      cards: [
        {
          title: 'Servidores de Saúde',
          description: 'Profissionais vinculados ao atendimento.',
          icon: UserCog,
          color: 'bg-green-500',
          href: '/admin/apps/saude/cadastros/servidores-saude',
          badge: `${stats?.profissionais?.ativos || 0} ativos`,
        },
        {
          title: 'Vínculos Unificados',
          description: 'Gerencie vínculos de forma centralizada.',
          icon: Link2,
          color: 'bg-cyan-500',
          href: '/admin/apps/saude/cadastros/vinculos',
          badge: 'Sistema V2',
        },
      ],
    },
    {
      title: 'Operação e Agendamento',
      description: 'Turnos, agendas e parâmetros operacionais.',
      sectionIcon: Calendar,
      cards: [
        {
          title: 'Turnos de Trabalho',
          description: 'Manhã, tarde e noite.',
          icon: Clock,
          color: 'bg-yellow-500',
          href: '/admin/apps/saude/cadastros/turnos',
          badge: `${stats?.turnos?.ativos || 0} ativos`,
        },
        {
          title: 'Agendas Médicas',
          description: 'Configuração de agendas e horários.',
          icon: Calendar,
          color: 'bg-pink-500',
          href: '/admin/apps/saude/cadastros/agendas',
          badge: `${stats?.agendas?.ativas || 0} ativas`,
        },
        {
          title: 'Configurações',
          description: 'Parâmetros de atendimento por unidade.',
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
      <div className="mx-auto max-w-7xl">
        <HealthAppHeader
          title="Cadastros e Configurações"
          description="Estrutura, equipes, vínculos e agendas do sistema de atendimento de saúde."
          icon={Stethoscope}
          badge={
            <Badge variant="outline" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Sistema ativo
            </Badge>
          }
        />

        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Activity className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <h3 className="mb-1 font-semibold text-blue-900">Sistema unificado de vinculação V2</h3>
                <p className="text-sm text-blue-800">
                  Todas as vinculações de profissionais, unidades e equipes ESF são feitas em um único lugar via
                  wizard sequencial em &quot;Vínculos Unificados&quot;. Não é necessário navegar entre páginas separadas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando estatísticas...</p>
          </div>
        ) : (
          <>
            {sections.map((section) => {
              const SectionIcon = section.sectionIcon;

              return (
                <div key={section.title} className="mb-8">
                  <div className="mb-4">
                    <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                      <SectionIcon className="h-6 w-6 text-red-600" />
                      {section.title}
                    </h2>
                    <p className="text-gray-600">{section.description}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {section.cards.map((card) => (
                      <Card
                        key={card.title}
                        className="cursor-pointer transition-shadow hover:shadow-lg"
                        onClick={() => router.push(card.href)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className={`rounded-lg bg-opacity-10 p-3 ${card.color}`}>
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
              );
            })}

            <Card className="mt-6 border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-purple-700" />
                  Fluxo recomendado para novos cadastros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm text-purple-900">
                  <li><strong>1. Infraestrutura:</strong> cadastre as unidades de saúde, salas e especialidades.</li>
                  <li><strong>2. ESF:</strong> crie as equipes de Saúde da Família e defina as microáreas.</li>
                  <li><strong>3. Vínculos unificados:</strong> use o wizard para vincular servidores, unidades e equipes na mesma etapa.</li>
                  <li><strong>4. Operação:</strong> configure turnos de trabalho e crie as agendas médicas.</li>
                </ol>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
