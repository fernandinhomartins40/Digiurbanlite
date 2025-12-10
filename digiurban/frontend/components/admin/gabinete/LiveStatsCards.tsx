'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, CheckCircle, Clock, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface StatsData {
  totalActive: number
  totalProtocols: number
  totalCompleted: number
  completionRate: number
  avgResponseTime: number
  citizenSatisfaction: number
}

interface LiveStatsCardsProps {
  stats: StatsData | null
  isLoading: boolean
}

export function LiveStatsCards({ stats, isLoading }: LiveStatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Protocolos Ativos',
      value: stats.totalActive,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Em andamento',
      trend: null
    },
    {
      title: 'Taxa de Conclusão',
      value: `${stats.completionRate}%`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: `${stats.totalCompleted} concluídos`,
      trend: stats.completionRate >= 70 ? 'up' : 'down'
    },
    {
      title: 'Tempo Médio Resposta',
      value: `${stats.avgResponseTime}h`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Média geral',
      trend: stats.avgResponseTime <= 48 ? 'up' : 'down'
    },
    {
      title: 'Satisfação Cidadão',
      value: `${stats.citizenSatisfaction.toFixed(1)}/5`,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Avaliações',
      trend: stats.citizenSatisfaction >= 4 ? 'up' : 'down'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        const TrendIcon = card.trend === 'up' ? TrendingUp : card.trend === 'down' ? TrendingDown : null

        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`h-10 w-10 rounded-full ${card.bgColor} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {card.value}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500">
                  {card.description}
                </p>
                {TrendIcon && (
                  <TrendIcon
                    className={`h-3 w-3 ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
