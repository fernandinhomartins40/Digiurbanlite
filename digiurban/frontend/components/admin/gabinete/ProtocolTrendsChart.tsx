'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import useSWR from 'swr'

interface TrendData {
  date: string
  novos: number
  concluidos: number
  pendentes: number
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) throw new Error('Erro ao buscar dados')
  return response.json()
}

export function ProtocolTrendsChart() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: { daily: TrendData[] } }>(
    '/api/admin/gabinete/painel-prefeito/trends',
    fetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      revalidateIfStale: false
    }
  )

  // ⚡ Mostrar loading apenas na primeira carga (sem dados)
  if (isLoading && !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">❌ Erro ao carregar tendências</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!data?.data?.daily) {
    return null
  }

  const chartData = data.data.daily.map(item => ({
    ...item,
    data: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Evolução de Protocolos - Últimos 30 Dias
        </CardTitle>
        <CardDescription>
          Acompanhe a evolução diária de protocolos novos, concluídos e pendentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="data"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px'
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '20px'
              }}
            />
            <Line
              type="monotone"
              dataKey="novos"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Novos"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="concluidos"
              stroke="#22c55e"
              strokeWidth={2}
              name="Concluídos"
              dot={{ fill: '#22c55e', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="pendentes"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Pendentes"
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
