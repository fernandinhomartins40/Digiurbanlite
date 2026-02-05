'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, Baby, Users2, DollarSign, Accessibility, TrendingUp } from 'lucide-react'

interface FamilyStatsData {
  totalMembers: number
  activeMembersCount: number
  pendingMembersCount: number
  totalDependents: number
  totalChildren: number
  totalElderly: number
  totalWithDisability: number
  totalIncome: number
  incomePerCapita: number
  relationshipCounts: Record<string, number>
}

interface FamilyStatsProps {
  stats: FamilyStatsData
}

export function FamilyStats({ stats }: FamilyStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const statsCards = [
    {
      title: 'Total de Membros',
      value: stats.totalMembers,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Membros Ativos',
      value: stats.activeMembersCount,
      icon: UserCheck,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Dependentes',
      value: stats.totalDependents,
      icon: Users2,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Crianças',
      value: stats.totalChildren,
      icon: Baby,
      color: 'bg-pink-500',
      textColor: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'Idosos',
      value: stats.totalElderly,
      icon: Users,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'PCD',
      value: stats.totalWithDisability,
      icon: Accessibility,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <Icon className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stat.title}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Cards de Renda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Renda Total da Família
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {formatCurrency(stats.totalIncome)}
            </div>
            <p className="text-sm text-green-600 mt-1">
              Soma das rendas declaradas
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Renda Per Capita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {formatCurrency(stats.incomePerCapita)}
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Renda dividida por {stats.totalMembers} {stats.totalMembers === 1 ? 'membro' : 'membros'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Relacionamento */}
      {Object.keys(stats.relationshipCounts).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Relacionamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(stats.relationshipCounts).map(([relationship, count]) => (
                <div
                  key={relationship}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center"
                >
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-500 mt-1">{relationship}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas e Informações */}
      {stats.pendingMembersCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-200 p-2 rounded-full">
                <Users className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <p className="font-medium text-yellow-900">
                  {stats.pendingMembersCount} {stats.pendingMembersCount === 1 ? 'vínculo pendente' : 'vínculos pendentes'}
                </p>
                <p className="text-sm text-yellow-700">
                  Aguardando confirmação dos membros
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
