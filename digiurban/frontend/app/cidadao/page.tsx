'use client';

import { useState, useEffect } from 'react';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { useCitizenServices } from '@/hooks/useCitizenServices';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Bell,
  ArrowRight,
  Activity,
  Loader2,
  FileCheck
} from 'lucide-react';

export default function CitizenDashboard() {
  const { citizen } = useCitizenAuth();
  const { services, loading: servicesLoading } = useCitizenServices();

  const stats = [
    {
      title: 'Protocolos Ativos',
      value: '0',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Protocolos Concluídos',
      value: '0',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Notificações',
      value: '0',
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Família',
      value: citizen ? '1 pessoa' : '-',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const quickActions = [
    {
      title: 'Nova Solicitação',
      description: 'Solicitar um novo serviço público',
      href: '/cidadao/servicos',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      available: true
    },
    {
      title: 'Acompanhar Protocolos',
      description: 'Ver status das suas solicitações',
      href: '/cidadao/protocolos',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      available: true
    },
    {
      title: 'Meus Documentos',
      description: 'Digitalizar e gerenciar documentos',
      href: '/cidadao/documentos',
      icon: FileCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      available: true
    },
    {
      title: 'Meus Dados',
      description: 'Gerenciar informações pessoais',
      href: '/cidadao/perfil',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      available: true
    }
  ];

  // Serviços populares: pegar os primeiros 8 serviços com maior prioridade
  const popularServices = services
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <CitizenLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header de boas-vindas */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 lg:bg-white lg:from-transparent lg:to-transparent rounded-lg border-0 lg:border lg:border-gray-200 p-4 sm:p-6 shadow-lg lg:shadow-none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white lg:text-gray-900">
                {getGreeting()}, {citizen?.name?.split(' ')[0]}
              </h1>
              <p className="text-sm sm:text-base text-blue-100 lg:text-gray-600 mt-1">
                Bem-vindo ao Portal do Cidadão
              </p>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-right lg:block hidden">
                <p className="text-xs sm:text-sm text-gray-500">CPF</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  {citizen?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                </p>
              </div>
              <div className="h-10 w-10 bg-white lg:bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-md lg:shadow-none">
                <span className="text-blue-600 font-semibold text-lg">
                  {citizen?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className={`border ${stat.borderColor}`}>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`${stat.bgColor} p-2 sm:p-3 rounded-lg self-end sm:self-auto`}>
                      <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Ações Rápidas */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">🎯 Acesso Rápido</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const isServicos = action.href === '/cidadao/servicos';
              return (
                <div
                  key={action.title}
                  className={cn(
                    "rounded-lg p-4 sm:p-6 transition-all active:scale-98",
                    isServicos
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-lg hover:shadow-xl"
                      : "bg-white border border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={cn(
                      "p-2 sm:p-3 rounded-lg",
                      isServicos ? "bg-white/20" : action.bgColor
                    )}>
                      <Icon className={cn(
                        "h-5 w-5 sm:h-6 sm:w-6",
                        isServicos ? "text-white" : action.color
                      )} />
                    </div>
                    {!action.available && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Em breve
                      </span>
                    )}
                  </div>
                  <h3 className={cn(
                    "text-base font-semibold mb-2",
                    isServicos ? "text-white" : "text-gray-900"
                  )}>
                    {action.title}
                  </h3>
                  <p className={cn(
                    "text-sm mb-3 sm:mb-4",
                    isServicos ? "text-blue-100" : "text-gray-600"
                  )}>
                    {action.description}
                  </p>
                  {action.available ? (
                    <Link href={action.href}>
                      <Button
                        variant={isServicos ? "secondary" : "outline"}
                        className={cn(
                          "w-full group",
                          isServicos && "bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                        )}
                      >
                        {isServicos ? "Solicitar Serviço" : "Acessar"}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Em desenvolvimento
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Serviços Populares */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Serviços Disponíveis</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Serviços oferecidos pelo município</p>
            </div>
            <Link href="/cidadao/servicos" className="sm:flex-shrink-0">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {servicesLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-600">Carregando serviços...</span>
            </div>
          )}

          {!servicesLoading && popularServices.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Nenhum serviço disponível</p>
              <p className="text-sm text-gray-500 mt-1">Os serviços municipais ainda não foram configurados</p>
            </div>
          )}

          {!servicesLoading && popularServices.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {popularServices.map((service) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="bg-blue-50 p-2 sm:p-2.5 rounded-lg">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">
                        Disponível
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                      {service.name}
                    </h3>

                    <p className="text-xs text-gray-500 mb-2 sm:mb-3 truncate">
                      {service.department?.name || 'Sem departamento'}
                    </p>

                    <p className="text-xs text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                      {service.description || 'Sem descrição'}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 sm:pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span className="truncate">Prior. {service.priority}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span className="whitespace-nowrap">{service.estimatedDays ? `${service.estimatedDays}d` : 'A definir'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Informações Importantes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">
                Sistema em Desenvolvimento
              </h3>
              <p className="text-xs sm:text-sm text-blue-700">
                Este portal está sendo desenvolvido para melhor atendê-lo.
                Em breve você poderá acessar todos os serviços municipais,
                acompanhar protocolos e muito mais.
              </p>
            </div>
          </div>
        </div>

        {/* Informações do Perfil */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Meus Dados</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Nome Completo</p>
                <p className="text-xs sm:text-sm text-gray-900 mt-1 break-words">{citizen?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">CPF</p>
                <p className="text-xs sm:text-sm text-gray-900 mt-1">
                  {citizen?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">E-mail</p>
                <p className="text-xs sm:text-sm text-gray-900 mt-1 break-all">{citizen?.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Telefone</p>
                <p className="text-xs sm:text-sm text-gray-900 mt-1">{citizen?.phone || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CitizenLayout>
  );
}
