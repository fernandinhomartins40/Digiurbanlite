'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Map, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export default function GabinetePage() {
  const { user } = useAdminAuth()

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Acesso restrito ao Gabinete do Prefeito</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gabinete do Prefeito</h1>
        <p className="text-gray-600 mt-1">
          Ferramentas executivas para gestão estratégica municipal
        </p>
      </div>

      {/* Cards de Navegação */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Painel do Prefeito */}
        <Link href="/admin/gabinete/painel-prefeito">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-blue-300 bg-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl">
                  📊
                </div>
                <ArrowRight className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-xl mt-4 text-blue-900">Painel do Prefeito</CardTitle>
              <CardDescription className="text-blue-700">
                Dashboard executivo com visão 360° do município em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-blue-800 font-medium">
                  • Busca rápida de cidadãos
                </p>
                <p className="text-sm text-blue-800 font-medium">
                  • Métricas em tempo real
                </p>
                <p className="text-sm text-blue-800 font-medium">
                  • Protocolos que requerem atenção
                </p>
                <p className="text-sm text-blue-800 font-medium">
                  • Alertas críticos
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Agenda Centralizada */}
        <Link href="/admin/agenda">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Calendar className="h-12 w-12 text-blue-600" />
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
              <CardTitle className="text-xl mt-4">Agenda Centralizada</CardTitle>
              <CardDescription>
                Gerencie compromissos oficiais, audiências públicas e eventos do gabinete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  • Calendário de compromissos
                </p>
                <p className="text-sm text-gray-600">
                  • Audiências públicas
                </p>
                <p className="text-sm text-gray-600">
                  • Reuniões externas
                </p>
                <p className="text-sm text-gray-600">
                  • Eventos oficiais
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Mapa de Demandas */}
        <Link href="/admin/gabinete/mapa-demandas">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Map className="h-12 w-12 text-green-600" />
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
              <CardTitle className="text-xl mt-4">Mapa de Demandas</CardTitle>
              <CardDescription>
                Visualização geoespacial das solicitações e demandas municipais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  • Mapa de calor de demandas
                </p>
                <p className="text-sm text-gray-600">
                  • Análise por região
                </p>
                <p className="text-sm text-gray-600">
                  • Estatísticas territoriais
                </p>
                <p className="text-sm text-gray-600">
                  • Indicadores por bairro
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre o Gabinete do Prefeito</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            O módulo Gabinete do Prefeito oferece ferramentas especializadas para a gestão executiva municipal,
            permitindo um acompanhamento estratégico das atividades do gabinete e uma visão territorial das
            demandas da população.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
