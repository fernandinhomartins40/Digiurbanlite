'use client'

/**
 * PÁGINA DE ESTATÍSTICAS E ANÁLISE DE SERVIÇOS
 *
 * Esta página exibe estatísticas e insights sobre os serviços cadastrados no sistema.
 * Para gerenciar serviços (CRUD), use /admin/servicos
 */

import React, { useState, useEffect } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  TrendingUp,
  Package,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Users,
  ArrowRight,
  Settings
} from 'lucide-react'
import Link from 'next/link'

interface ServiceStats {
  total: number
  active: number
  inactive: number
  byDepartment: Record<string, number>
  byCategory: Record<string, number>
  requiresDocuments: number
  averageEstimatedDays: number
}

export default function ServicesAnalyticsPage() {
  const { apiRequest } = useAdminAuth()
  const [stats, setStats] = useState<ServiceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/api/services')
      const services = response.data || []

      // Calcular estatísticas
      const byDepartment: Record<string, number> = {}
      const byCategory: Record<string, number> = {}
      let totalDays = 0
      let countWithDays = 0

      services.forEach((service: any) => {
        // Por departamento
        const deptName = service.department?.name || 'Sem departamento'
        byDepartment[deptName] = (byDepartment[deptName] || 0) + 1

        // Por categoria
        const category = service.category || 'Sem categoria'
        byCategory[category] = (byCategory[category] || 0) + 1

        // Dias estimados
        if (service.estimatedDays) {
          totalDays += service.estimatedDays
          countWithDays++
        }
      })

      setStats({
        total: services.length,
        active: services.filter((s: any) => s.isActive).length,
        inactive: services.filter((s: any) => !s.isActive).length,
        byDepartment,
        byCategory,
        requiresDocuments: services.filter((s: any) => s.requiresDocuments).length,
        averageEstimatedDays: countWithDays > 0 ? Math.round(totalDays / countWithDays) : 0,
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Erro ao carregar estatísticas</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const topDepartments = Object.entries(stats.byDepartment)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const topCategories = Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estatísticas de Serviços</h1>
          <p className="text-gray-600 mt-2">
            Visão geral e análise dos serviços públicos cadastrados
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/admin/servicos">
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Serviços
            </Button>
          </Link>
        </div>
      </div>

      {/* Visão Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Serviços cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.active / stats.total) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requerem Documentos</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.requiresDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.requiresDocuments / stats.total) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prazo Médio</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.averageEstimatedDays}</div>
            <p className="text-xs text-muted-foreground">
              dias para conclusão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Departamento e Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Departamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Top 5 Departamentos
            </CardTitle>
            <CardDescription>
              Departamentos com mais serviços cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDepartments.map(([dept, count], index) => (
                <div key={dept} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium">{dept}</span>
                  </div>
                  <Badge variant="secondary">{count} serviços</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categorias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Top 5 Categorias
            </CardTitle>
            <CardDescription>
              Categorias mais utilizadas nos serviços
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map(([category, count], index) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium">{category}</span>
                  </div>
                  <Badge variant="secondary">{count} serviços</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de Qualidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Indicadores de Qualidade
          </CardTitle>
          <CardDescription>
            Métricas de qualidade e completude dos serviços
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Taxa de Ativação</span>
                <span className="text-sm text-gray-600">
                  {((stats.active / stats.total) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(stats.active / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Serviços com Documentos</span>
                <span className="text-sm text-gray-600">
                  {((stats.requiresDocuments / stats.total) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{ width: `${(stats.requiresDocuments / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cobertura de Departamentos</span>
                <span className="text-sm text-gray-600">
                  {Object.keys(stats.byDepartment).length} departamentos
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gerenciar Catálogo de Serviços
              </h3>
              <p className="text-gray-600">
                Crie, edite e organize os serviços públicos oferecidos pelo município
              </p>
            </div>
            <Link href="/admin/servicos">
              <Button size="lg">
                Ir para Gerenciamento
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            Sobre este Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2 text-gray-600">
            <p>
              • <strong>Fonte de Dados:</strong> Todos os dados vêm diretamente do banco de dados (PostgreSQL)
            </p>
            <p>
              • <strong>Atualização:</strong> As estatísticas são calculadas em tempo real a cada carregamento
            </p>
            <p>
              • <strong>Gerenciamento:</strong> Use a página{' '}
              <Link href="/admin/servicos" className="text-blue-600 hover:underline">
                /admin/servicos
              </Link>
              {' '}para criar e editar serviços
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
