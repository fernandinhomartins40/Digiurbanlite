'use client'

/**
 * Balcão — atendimento presencial em 3 passos (ARQUITETURA-DE-PRODUTO.md 5.4).
 *
 * 1. Quem está sendo atendido? (busca por nome/CPF, cadastro rápido, biometria)
 * 2. Qual serviço? (catálogo, mostrando para onde cada pedido vai)
 * 3. Preencher e concluir (formulário do serviço, com o cidadão já escolhido)
 *
 * Decisão do produto: todo atendimento gera protocolo (canal BALCAO), inclusive
 * quando o destino é um app. Antes estas peças estavam espalhadas em quatro
 * lugares (cadastro de cidadão, biometria, "Novo Protocolo", solicitar serviço).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Check, Loader2, ScanFace, Search, UserPlus, X } from 'lucide-react'

interface CitizenOption {
  id: string
  name: string
  cpf?: string
  email?: string
  phone?: string
}

interface ServiceOption {
  id: string
  name: string
  description?: string | null
  department?: { id: string; name: string; code?: string }
  destination?: 'FILA' | 'APP'
  appAction?: string | null
}

const maskCpf = (cpf?: string) => {
  const d = (cpf || '').replace(/\D/g, '')
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : cpf || ''
}

const normalize = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function StepHeader({ n, title, done, active }: { n: number; title: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          done ? 'bg-green-600 text-white' : active ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {done ? <Check className="h-4 w-4" /> : n}
      </span>
      <span className={`font-semibold ${active || done ? 'text-gray-900' : 'text-gray-500'}`}>{title}</span>
    </div>
  )
}

export default function BalcaoPage() {
  const router = useRouter()
  const { user, apiRequest } = useAdminAuth()

  const [citizen, setCitizen] = useState<CitizenOption | null>(null)
  const [citizenQuery, setCitizenQuery] = useState('')
  const [citizenResults, setCitizenResults] = useState<CitizenOption[]>([])
  const [searchingCitizen, setSearchingCitizen] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [services, setServices] = useState<ServiceOption[]>([])
  const [appNameByAction, setAppNameByAction] = useState<Record<string, string>>({})
  const [serviceQuery, setServiceQuery] = useState('')

  // Cidadão vindo da URL (ex.: "Outro serviço para esta pessoa" após concluir)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('cidadao')
    if (!id) return
    apiRequest(`/api/admin/citizens/${id}`)
      .then((res: any) => {
        const c = res?.data?.citizen
        if (c) setCitizen({ id: c.id, name: c.name, cpf: c.cpf, email: c.email, phone: c.phone })
      })
      .catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Catálogo de serviços + nomes dos apps (para mostrar o destino de cada pedido)
  useEffect(() => {
    apiRequest('/api/services')
      .then((res: any) => setServices(res?.data || []))
      .catch(() => setServices([]))
    apiRequest('/api/app-catalog?withActions=true')
      .then((res: any) => {
        const map: Record<string, string> = {}
        for (const app of res?.data?.apps || []) for (const a of app.actions || []) map[a.code] = app.name
        setAppNameByAction(map)
      })
      .catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const searchCitizens = useCallback(
    (term: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
      if (term.trim().length < 2) {
        setCitizenResults([])
        setSearchingCitizen(false)
        return
      }
      setSearchingCitizen(true)
      searchTimer.current = setTimeout(async () => {
        try {
          const res = await apiRequest(`/api/admin/citizens/search?q=${encodeURIComponent(term.trim())}`)
          const list = Array.isArray(res?.data) ? res.data : res?.data?.citizens || []
          setCitizenResults(list)
        } catch {
          setCitizenResults([])
        } finally {
          setSearchingCitizen(false)
        }
      }, 350)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Servidor vê os serviços das suas secretarias; ADMIN vê todos
  const userDeptCodes = useMemo(() => {
    const codes = new Set<string>()
    const add = (c?: string | null) => c && codes.add(c.toUpperCase())
    add(user?.department?.code)
    user?.departments?.forEach((d) => add(d.code))
    user?.userDepartments?.filter((ud) => ud.isActive).forEach((ud) => add(ud.department?.code))
    return codes
  }, [user])
  const fullAccess = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  const visibleServices = useMemo(() => {
    const q = normalize(serviceQuery.trim())
    return services
      .filter((s) => fullAccess || userDeptCodes.size === 0 || userDeptCodes.has((s.department?.code || '').toUpperCase()))
      .filter((s) => !q || normalize(`${s.name} ${s.description || ''} ${s.department?.name || ''}`).includes(q))
      .slice(0, 60)
  }, [services, serviceQuery, fullAccess, userDeptCodes])

  const chooseService = (service: ServiceOption) => {
    if (!citizen) return
    router.push(`/admin/servicos/${service.id}/solicitar?cidadao=${citizen.id}&origem=balcao`)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Balcão de atendimento</h1>
        <p className="text-gray-600 mt-1">
          Atenda presencialmente em 3 passos. O cidadão sai com o número do pedido para acompanhar em &quot;Meus pedidos&quot;.
        </p>
      </div>

      {/* Passo 1 — cidadão */}
      <Card>
        <CardHeader>
          <StepHeader n={1} title="Quem está sendo atendido?" done={!!citizen} active={!citizen} />
        </CardHeader>
        <CardContent className="space-y-4">
          {citizen ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <div>
                <p className="font-semibold text-green-900">{citizen.name}</p>
                <p className="text-sm text-green-800">CPF {maskCpf(citizen.cpf)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setCitizen(null); setCitizenQuery(''); setCitizenResults([]) }}>
                <X className="h-4 w-4 mr-1" />
                Trocar pessoa
              </Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  value={citizenQuery}
                  onChange={(e) => { setCitizenQuery(e.target.value); searchCitizens(e.target.value) }}
                  placeholder="Nome ou CPF da pessoa"
                  className="pl-10"
                  aria-label="Buscar cidadão por nome ou CPF"
                />
              </div>
              {searchingCitizen && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
                </p>
              )}
              {citizenResults.length > 0 && (
                <div className="divide-y rounded-lg border">
                  {citizenResults.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setCitizen(c); setCitizenResults([]) }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50"
                    >
                      <span>
                        <span className="font-medium">{c.name}</span>
                        <span className="block text-xs text-muted-foreground">CPF {maskCpf(c.cpf)}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
              {!searchingCitizen && citizenQuery.trim().length >= 2 && citizenResults.length === 0 && (
                <p className="text-sm text-muted-foreground">Ninguém encontrado com esse nome ou CPF.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/cidadaos/novo">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Cadastrar pessoa
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/cidadaos/biometria-facial">
                    <ScanFace className="h-4 w-4 mr-1" />
                    Identificar por biometria
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Passo 2 — serviço */}
      <Card className={citizen ? '' : 'opacity-60'}>
        <CardHeader>
          <StepHeader n={2} title="Qual serviço?" done={false} active={!!citizen} />
          {citizen && (
            <CardDescription>Escolha o serviço. No próximo passo você preenche o pedido junto com a pessoa.</CardDescription>
          )}
        </CardHeader>
        {citizen && (
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={serviceQuery}
                onChange={(e) => setServiceQuery(e.target.value)}
                placeholder="Buscar serviço (ex.: TFD, alvará, matrícula)"
                className="pl-10"
                aria-label="Buscar serviço"
              />
            </div>
            <div className="grid gap-2">
              {visibleServices.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => chooseService(s)}
                  className="flex w-full flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left hover:border-primary hover:bg-primary/5"
                >
                  <span className="min-w-0">
                    <span className="font-medium">{s.name}</span>
                    <span className="block text-xs text-muted-foreground">{s.department?.name}</span>
                  </span>
                  {s.destination === 'APP' ? (
                    <Badge className="shrink-0 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                      Vai para: {appNameByAction[s.appAction || ''] || 'app da secretaria'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0">Analisado no protocolo</Badge>
                  )}
                </button>
              ))}
              {visibleServices.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum serviço encontrado.</p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Passo 3 — indicação */}
      <Card className="opacity-60">
        <CardHeader>
          <StepHeader n={3} title="Preencher e concluir" done={false} active={false} />
          <CardDescription>Formulário do serviço, anexos e geração do número do pedido.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
