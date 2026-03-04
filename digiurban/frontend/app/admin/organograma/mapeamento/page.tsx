'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  GraduationCap,
  HandHeart,
  Heart,
  Link2,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

type DomainKey = 'saude' | 'educacao' | 'assistencia'

interface DomainStats {
  total: number
  mapped: number
  unmapped: number
}

interface DomainUnit {
  id: string
  nome: string
  tipo: string
  bairro?: string | null
  mapped: boolean
  organizationalUnit?: {
    id: string
    nome: string
    sigla?: string | null
    tipo?: string | null
  } | null
}

interface TabState {
  stats: DomainStats | null
  units: DomainUnit[]
  loading: boolean
  error: string | null
  autoMapping: boolean
}

const initialTabState: TabState = {
  stats: null,
  units: [],
  loading: false,
  error: null,
  autoMapping: false,
}

const DOMAIN_CONFIG: Record<
  DomainKey,
  {
    label: string
    icon: typeof Heart
    statsEndpoint: string
    unitsEndpoint: string
    autoMapEndpoint: string
    accent: string
    chip: string
  }
> = {
  saude: {
    label: 'Saúde',
    icon: Heart,
    statsEndpoint: '/api/secretarias/saude/health-units/stats',
    unitsEndpoint: '/api/secretarias/saude/health-units',
    autoMapEndpoint: '/api/secretarias/saude/health-units/auto-map',
    accent: 'border-l-red-400',
    chip: 'bg-red-50 text-red-500',
  },
  educacao: {
    label: 'Educação',
    icon: GraduationCap,
    statsEndpoint: '/api/secretarias/educacao/education-units/stats',
    unitsEndpoint: '/api/secretarias/educacao/education-units',
    autoMapEndpoint: '/api/secretarias/educacao/education-units/auto-map',
    accent: 'border-l-blue-400',
    chip: 'bg-blue-50 text-blue-500',
  },
  assistencia: {
    label: 'Assistência Social',
    icon: HandHeart,
    statsEndpoint: '/api/secretarias/assistencia-social/social-units/stats',
    unitsEndpoint: '/api/secretarias/assistencia-social/social-units',
    autoMapEndpoint: '/api/secretarias/assistencia-social/social-units/auto-map',
    accent: 'border-l-emerald-400',
    chip: 'bg-emerald-50 text-emerald-500',
  },
}

function unwrapPayload<T>(payload: any): T {
  if (payload?.success && payload?.data !== undefined) {
    return payload.data as T
  }

  return payload as T
}

function normalizeStats(payload: any): DomainStats {
  const data = unwrapPayload<any>(payload)
  const total = Number(data?.ativas ?? data?.total ?? 0)
  const mapped = Number(data?.mapeadas ?? 0)
  const unmapped = Number(data?.naoMapeadas ?? Math.max(total - mapped, 0))

  return { total, mapped, unmapped }
}

function normalizeUnits(payload: any): DomainUnit[] {
  const data = unwrapPayload<any[]>(payload)

  if (!Array.isArray(data)) {
    return []
  }

  return data.map((unit) => ({
    id: String(unit.id),
    nome: unit.nome || unit.name || 'Sem nome',
    tipo: unit.tipo || unit.type || 'Não informado',
    bairro: unit.bairro || null,
    mapped: Boolean(unit.mapped || unit.organizationalUnitId),
    organizationalUnit: unit.organizationalUnit || null,
  }))
}

export default function MapeamentoPage() {
  const { apiRequest } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<DomainKey>('saude')
  const [states, setStates] = useState<Record<DomainKey, TabState>>({
    saude: { ...initialTabState },
    educacao: { ...initialTabState },
    assistencia: { ...initialTabState },
  })

  const loadDomain = useCallback(
    async (domain: DomainKey) => {
      const config = DOMAIN_CONFIG[domain]

      setStates((prev) => ({
        ...prev,
        [domain]: {
          ...prev[domain],
          loading: true,
          error: null,
        },
      }))

      try {
        const [statsResponse, unitsResponse] = await Promise.all([
          apiRequest(config.statsEndpoint),
          apiRequest(config.unitsEndpoint),
        ])

        setStates((prev) => ({
          ...prev,
          [domain]: {
            ...prev[domain],
            loading: false,
            stats: normalizeStats(statsResponse),
            units: normalizeUnits(unitsResponse),
          },
        }))
      } catch (error) {
        setStates((prev) => ({
          ...prev,
          [domain]: {
            ...prev[domain],
            loading: false,
            error: `Não foi possível carregar ${config.label.toLowerCase()}.`,
          },
        }))
      }
    },
    [apiRequest]
  )

  useEffect(() => {
    void loadDomain('saude')
    void loadDomain('educacao')
    void loadDomain('assistencia')
  }, [loadDomain])

  const handleAutoMap = useCallback(
    async (domain: DomainKey) => {
      const config = DOMAIN_CONFIG[domain]

      setStates((prev) => ({
        ...prev,
        [domain]: {
          ...prev[domain],
          autoMapping: true,
          error: null,
        },
      }))

      try {
        await apiRequest(config.autoMapEndpoint, { method: 'POST' })
        await loadDomain(domain)
      } catch {
        setStates((prev) => ({
          ...prev,
          [domain]: {
            ...prev[domain],
            error: `Não foi possível executar o auto-mapeamento de ${config.label.toLowerCase()}.`,
          },
        }))
      } finally {
        setStates((prev) => ({
          ...prev,
          [domain]: {
            ...prev[domain],
            autoMapping: false,
          },
        }))
      }
    },
    [apiRequest, loadDomain]
  )

  const renderStatsBar = (state: TabState) => {
    if (state.loading && !state.stats) {
      return (
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando estatísticas...
        </div>
      )
    }

    if (state.error) {
      return (
        <div className="flex items-center gap-2 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {state.error}
        </div>
      )
    }

    if (!state.stats) {
      return null
    }

    return (
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Total:</span>
          <Badge variant="outline">{state.stats.total}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Mapeadas:</span>
          <Badge className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            {state.stats.mapped}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Pendentes:</span>
          <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
            <AlertCircle className="mr-1 h-3 w-3" />
            {state.stats.unmapped}
          </Badge>
        </div>
      </div>
    )
  }

  const renderUnitsTable = (domain: DomainKey, state: TabState) => {
    if (state.loading && state.units.length === 0) {
      return null
    }

    const rows = [...state.units].sort((left, right) => {
      if (left.mapped === right.mapped) {
        return left.nome.localeCompare(right.nome)
      }

      return left.mapped ? -1 : 1
    })

    return (
      <div className="mt-4 rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Unidade</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bairro</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Unidade organizacional</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma unidade encontrada para {DOMAIN_CONFIG[domain].label.toLowerCase()}.
                  </td>
                </tr>
              ) : (
                rows.map((unit) => (
                  <tr key={unit.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{unit.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{unit.tipo}</td>
                    <td className="px-4 py-3 text-muted-foreground">{unit.bairro || '—'}</td>
                    <td className="px-4 py-3">
                      {unit.mapped ? (
                        <Badge className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Mapeada
                        </Badge>
                      ) : (
                        <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Pendente
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {unit.organizationalUnit
                        ? `${unit.organizationalUnit.nome}${unit.organizationalUnit.sigla ? ` (${unit.organizationalUnit.sigla})` : ''}`
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderTab = (domain: DomainKey) => {
    const state = states[domain]

    return (
      <div className="space-y-4 pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {renderStatsBar(state)}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadDomain(domain)}
              disabled={state.loading}
              className="h-8"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${state.loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              size="sm"
              onClick={() => void handleAutoMap(domain)}
              disabled={state.autoMapping || state.loading}
              className="h-8 bg-blue-600 text-white hover:bg-blue-700"
            >
              {state.autoMapping ? (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Auto-mapear pendentes
            </Button>
          </div>
        </div>

        {renderUnitsTable(domain, state)}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin/organograma">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Link2 className="h-6 w-6 text-blue-600" />
            Mapeamento de Unidades para o Organograma
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Acompanhe a convergência das unidades setoriais para o organograma centralizado e execute o
            auto-mapeamento dos registros pendentes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(Object.keys(DOMAIN_CONFIG) as DomainKey[]).map((domain) => {
          const config = DOMAIN_CONFIG[domain]
          const Icon = config.icon
          const state = states[domain]

          return (
            <Card key={domain} className={`border-l-4 ${config.accent}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${config.chip}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {config.label}
                    </p>
                    <p className="text-sm font-semibold">
                      {state.stats
                        ? `${state.stats.mapped}/${state.stats.total} mapeadas`
                        : state.loading
                        ? 'Carregando...'
                        : 'Sem dados'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Unidades por domínio</CardTitle>
          <CardDescription>
            Cada domínio lista as unidades reais e o vínculo atual com a estrutura central de setores.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DomainKey)}>
            <TabsList className="grid max-w-md grid-cols-3">
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
                Assistência
              </TabsTrigger>
            </TabsList>

            <TabsContent value="saude">{renderTab('saude')}</TabsContent>
            <TabsContent value="educacao">{renderTab('educacao')}</TabsContent>
            <TabsContent value="assistencia">{renderTab('assistencia')}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
