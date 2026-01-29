'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, UserCog, Stethoscope, DoorOpen, Clock, Calendar, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

interface CadastroStats {
  unidades: number;
  profissionais: number;
  especialidades: number;
  salas: number;
  turnos: number;
  agendas: number;
  configuracoes: number;
}

export default function CadastrosDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<CadastroStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/apps/saude/cadastros/stats', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const cadastros = [
    {
      title: 'Unidades de Saúde',
      icon: Building2,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      count: stats?.unidades || 0,
      path: '/admin/apps/saude/cadastros/unidades',
      description: 'Gerenciar unidades de saúde',
    },
    {
      title: 'Profissionais',
      icon: UserCog,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      count: stats?.profissionais || 0,
      path: '/admin/apps/saude/cadastros/profissionais',
      description: 'Gerenciar profissionais de saúde',
    },
    {
      title: 'Especialidades',
      icon: Stethoscope,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      count: stats?.especialidades || 0,
      path: '/admin/apps/saude/cadastros/especialidades',
      description: 'Gerenciar especialidades médicas',
    },
    {
      title: 'Salas/Consultórios',
      icon: DoorOpen,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      count: stats?.salas || 0,
      path: '/admin/apps/saude/cadastros/salas',
      description: 'Gerenciar salas e consultórios',
    },
    {
      title: 'Turnos de Trabalho',
      icon: Clock,
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      count: stats?.turnos || 0,
      path: '/admin/apps/saude/cadastros/turnos',
      description: 'Gerenciar turnos de trabalho',
    },
    {
      title: 'Agendas Médicas',
      icon: Calendar,
      color: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-600',
      count: stats?.agendas || 0,
      path: '/admin/apps/saude/cadastros/agendas',
      description: 'Gerenciar agendas de atendimento',
    },
    {
      title: 'Configurações',
      icon: Settings,
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600',
      count: stats?.configuracoes || 0,
      path: '/admin/apps/saude/cadastros/configuracoes',
      description: 'Configurações de atendimento',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cadastros de Saúde</h1>
        <p className="text-gray-600 mt-2">
          Gerenciar cadastros básicos do sistema de saúde
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cadastros.map((cadastro) => {
          const Icon = cadastro.icon;
          return (
            <Card
              key={cadastro.path}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${cadastro.hoverColor} group`}
              onClick={() => router.push(cadastro.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-3 rounded-lg ${cadastro.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-white transition-colors">
                          {cadastro.title}
                        </h3>
                        <p className="text-sm text-gray-500 group-hover:text-gray-100 transition-colors">
                          {cadastro.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold group-hover:text-white transition-colors">
                        {cadastro.count}
                      </span>
                      <span className="text-sm text-gray-500 group-hover:text-gray-100 transition-colors">
                        registros
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
