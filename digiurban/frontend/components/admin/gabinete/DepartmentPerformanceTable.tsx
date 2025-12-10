'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, TrendingUp, TrendingDown } from 'lucide-react'
import useSWR from 'swr'
import { getFullApiUrl } from '@/lib/api-config'

interface DepartmentStat {
  id: string
  name: string
  total: number
  completed: number
  pending: number
  efficiency: number
  avgResponseTime: number
}

const fetcher = async (url: string) => {
  const fullUrl = getFullApiUrl(url)
  const response = await fetch(fullUrl, { credentials: 'include' })
  if (!response.ok) throw new Error('Erro ao buscar dados')
  return response.json()
}

export function DepartmentPerformanceTable() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: { departments: DepartmentStat[] } }>(
    '/api/admin/gabinete/painel-prefeito/departments-performance',
    fetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      revalidateIfStale: false
    }
  )

  // ⚡ Mostrar loading apenas na primeira carga
  if (isLoading && !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">❌ Erro ao carregar performance</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!data?.data?.departments) {
    return null
  }

  const departments = data.data.departments

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏢 Performance por Secretaria
        </CardTitle>
        <CardDescription>
          Acompanhe a eficiência e produtividade de cada departamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Secretaria</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Concluídos</TableHead>
                <TableHead className="text-center">Pendentes</TableHead>
                <TableHead className="w-[200px]">Eficiência</TableHead>
                <TableHead className="text-center">Tempo Médio</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    Nenhum dado disponível
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((dept) => (
                  <TableRow key={dept.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-blue-600">{dept.total}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 font-medium">{dept.completed}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-orange-600 font-medium">{dept.pending}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={dept.efficiency} className="flex-1" />
                        <span className="text-sm font-semibold w-12 text-right">
                          {dept.efficiency}%
                        </span>
                        {dept.efficiency >= 80 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : dept.efficiency >= 60 ? (
                          <TrendingUp className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm">{dept.avgResponseTime}h</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.location.href = `/admin/protocolos?department=${dept.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Resumo */}
        {departments.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 font-medium mb-1">Melhor Performance</p>
              <p className="text-2xl font-bold text-green-900">
                {departments[0]?.name}
              </p>
              <p className="text-sm text-green-600">{departments[0]?.efficiency}% de eficiência</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 font-medium mb-1">Média Geral</p>
              <p className="text-2xl font-bold text-blue-900">
                {Math.round(departments.reduce((sum, d) => sum + d.efficiency, 0) / departments.length)}%
              </p>
              <p className="text-sm text-blue-600">de eficiência</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-700 font-medium mb-1">Total Pendentes</p>
              <p className="text-2xl font-bold text-orange-900">
                {departments.reduce((sum, d) => sum + d.pending, 0)}
              </p>
              <p className="text-sm text-orange-600">protocolos</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
