'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, GraduationCap, HandHeart, ArrowLeft, RefreshCw, Link2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface DomainStats {
  total: number
  mapped: number
  unmapped: number
}

interface TabState {
  stats: DomainStats | null
  loading: boolean
  error: string | null
  autoMapping: boolean
}

const initialTabState: TabState = {
  stats: null,
  loading: false,
  error: null,
  autoMapping: false,
}

const MOCK_UNITS = [
  { id: 1, name: 'Unidade Central', type: 'Principal', mapped: true, orgUnit: 'Secretaria Central' },
  { id: 2, name: 'Unidade Norte', type: 'Regional', mapped: false, orgUnit: null },
  { id: 3, name: 'Unidade Sul', type: 'Regional', mapped: true, orgUnit: 'Divisão Sul' },
  { id: 4, name: 'Unidade Leste', type: 'Regional', mapped: false, orgUnit: null },
  { id: 5, name: 'Unidade Oeste', type: 'Regional', mapped: true, orgUnit: 'Divisão Oeste' },
]

export default function MapeamentoPage() {
  const { apiRequest } = useAdminAuth()

  const [saudeState, setSaudeState] = useState<TabState>({ ...initialTabState })
  const [educacaoState, setEducacaoState] = useState<TabState>({ ...initialTabState })
  const [assistenciaState, setAssistenciaState] = useState<TabState>({ ...initialTabState })
  const [activeTab, setActiveTab] = useState('saude')

  const fetchSaudeStats = useCallback(async () => {
    setSaudeState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await apiRequest('/api/secretarias/saude/health-units/stats')
      setSaudeState(prev => ({
        ...prev,
        loading: false,
        stats: {
          total: data?.ativas ?? data?.total ?? 0,
          mapped: data?.mapeadas ?? 0,
          unmapped: data?.naoMapeadas ?? 0,
        },
      }))
    } catch {
      setSaudeState(prev => ({
        ...prev,
        loading: false,
        error: 'Não foi possível carregar as estatísticas de Saúde.',
      }))
    }
  }, [apiRequest])

  const fetchEducacaoStats = useCallback(async () => {
    setEducacaoState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await apiRequest('/api/secretarias/educacao/education-units/stats')
      setEducacaoState(prev => ({
        ...prev,
        loading: false,
        stats: {
          total: data?.ativas ?? data?.total ?? 0,
          mapped: data?.mapeadas ?? 0,
          unmapped: data?.naoMapeadas ?? 0,
        },
      }))
    } catch {
      setEducacaoState(prev => ({
        ...prev,
        loading: false,
        error: 'Não foi possível carregar as estatísticas de Educação.',
      }))
    }
  }, [apiRequest])

  const fetchAssistenciaStats = useCallback(async () => {
    setAssistenciaState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await apiRequest('/api/secretarias/assistencia-social/social-units/stats')
      setAssistenciaState(prev => ({
        ...prev,
        loading: false,
        stats: {
          total: data?.ativas ?? data?.total ?? 0,
          mapped: data?.mapeadas ?? 0,
          unmapped: data?.naoMapeadas ?? 0,
        },
      }))
    } catch {
      setAssistenciaState(prev => ({
        ...prev,
        loading: false,
        error: 'Não foi possível carregar as estatísticas de Assistência Social.',
      }))
    }
  }, [apiRequest])

  useEffect(() => {
    fetchSaudeStats()
  }, [fetchSaudeStats])

  useEffect(() => {
    if (activeTab === 'educacao') {
      fetchEducacaoStats()
    }
  }, [activeTab, fetchEducacaoStats])

  useEffect(() => {
    if (activeTab === 'assistencia') {
      fetchAssistenciaStats()
    }
  }, [activeTab, fetchAssistenciaStats])

  const handleAutoMap = async (domain: 'saude' | 'educacao' | 'assistencia') => {
    const endpoints: Record<string, string> = {
      saude: '/api/secretarias/saude/health-units/auto-map',
      educacao: '/api/secretarias/educacao/education-units/auto-map',
      assistencia: '/api/secretarias/assistencia-social/social-units/auto-map',
    }
    const setters: Record<string, React.Dispatch<React.SetStateAction<TabState>>> = {
      saude: setSaudeState,
      educacao: setEducacaoState,
      assistencia: setAssistenciaState,
    }
    const setter = setters[domain]
    setter(prev => ({ ...prev, autoMapping: true }))
    try {
      await apiRequest(endpoints[domain], { method: 'POST' })
      if (domain === 'saude') fetchSaudeStats()
      if (domain === 'educacao') fetchEducacaoStats()
      if (domain === 'assistencia') fetchAssistenciaStats()
    } catch {
      // silently fail, stats will remain unchanged
    } finally {
      setter(prev => ({ ...prev, autoMapping: false }))
    }
  }

  function StatsBar({ state }: { state: TabState }) {
    if (state.loading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando estatísticas...
        </div>
      )
    }
    if (state.error) {
      return (
        <div className="flex items-center gap-2 text-sm text-destructive py-2">
          <AlertCircle className="h-4 w-4" />
          {state.error}
        </div>
      )
    }
    if (!state.stats) return null
    return (
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Total:</span>
          <Badge variant="outline" className="text-sm font-semibold">
            {state.stats.total}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Mapeadas:</span>
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-sm font-semibold">
            <CheckCircle className="h-3 w-3 mr-1" />
            {state.stats.mapped}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Pendentes:</span>
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 text-sm font-semibold">
            <AlertCircle className="h-3 w-3 mr-1" />
            {state.stats.unmapped}
          </Badge>
        </div>
      </div>
    )
  }

  function UnitsTable({ domain }: { domain: 'saude' | 'educacao' | 'assistencia' }) {
    return (
      <div className="mt-4">
        <div className="rounded-md border bg-muted/30 p-4 mb-4 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Configure os endpoints de listagem para ver os detalhes completos das unidades.
            Os dados abaixo são ilustrativos. Integre com{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
              /api/secretarias/{domain === 'saude' ? 'saude/health-units' : domain === 'educacao' ? 'educacao/education-units' : 'assistencia-social/social-units'}
            </code>{' '}
            para exibir dados reais.
          </p>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Unidade Org.</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_UNITS.map((unit, index) => (
                  <tr
                    key={unit.id}
                    className={`border-b last:border-0 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-muted/40 transition-colors`}
                  >
                    <td className="px-4 py-3 font-medium">{unit.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{unit.type}</td>
                    <td className="px-4 py-3">
                      {unit.mapped ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mapeada
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {unit.orgUnit ?? <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {unit.mapped ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-50">
                          <Link2 className="h-3 w-3 mr-1" />
                          Mapear
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  function TabBody({
    domain,
    state,
    onRefresh,
  }: {
    domain: 'saude' | 'educacao' | 'assistencia'
    state: TabState
    onRefresh: () => void
  }) {
    return (
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <StatsBar state={state} />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={state.loading}
              className="h-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${state.loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              size="sm"
              onClick={() => handleAutoMap(domain)}
              disabled={state.autoMapping || state.loading}
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {state.autoMapping ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Mapear Todas Automaticamente
            </Button>
          </div>
        </div>

        <UnitsTable domain={domain} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin/organograma">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="h-6 w-6 text-blue-600" />
            Mapeamento de Unidades → Organograma
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Visualize quais unidades dos domínios setoriais (Saúde, Educação, Assistência Social) estão
            vinculadas ao organograma unificado e gerencie os mapeamentos pendentes.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-400">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Saúde</p>
                <p className="text-sm font-semibold">
                  {saudeState.stats
                    ? `${saudeState.stats.mapped}/${saudeState.stats.total} mapeadas`
                    : saudeState.loading
                    ? 'Carregando...'
                    : 'Sem dados'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <GraduationCap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Educação</p>
                <p className="text-sm font-semibold">
                  {educacaoState.stats
                    ? `${educacaoState.stats.mapped}/${educacaoState.stats.total} mapeadas`
                    : educacaoState.loading
                    ? 'Carregando...'
                    : 'Sem dados'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-400">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <HandHeart className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Assistência Social</p>
                <p className="text-sm font-semibold">
                  {assistenciaState.stats
                    ? `${assistenciaState.stats.mapped}/${assistenciaState.stats.total} mapeadas`
                    : assistenciaState.loading
                    ? 'Carregando...'
                    : 'Sem dados'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Unidades por Domínio</CardTitle>
          <CardDescription>
            Selecione um domínio para ver e gerenciar os mapeamentos das suas unidades.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="saude" className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                Saúde
              </TabsTrigger>
              <TabsTrigger value="educacao" className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                Educação
              </TabsTrigger>
              <TabsTrigger value="assistencia" className="flex items-center gap-1.5">
                <HandHeart className="h-3.5 w-3.5" />
                Assistência Social
              </TabsTrigger>
            </TabsList>

            <TabsContent value="saude">
              <TabBody
                domain="saude"
                state={saudeState}
                onRefresh={fetchSaudeStats}
              />
            </TabsContent>

            <TabsContent value="educacao">
              <TabBody
                domain="educacao"
                state={educacaoState}
                onRefresh={fetchEducacaoStats}
              />
            </TabsContent>

            <TabsContent value="assistencia">
              <TabBody
                domain="assistencia"
                state={assistenciaState}
                onRefresh={fetchAssistenciaStats}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
