'use client'

/**
 * ASSISTÊNCIA REMOTA — página do operador de plataforma
 *
 * Redesenhada em 2026-09-15: a primeira versão listava os municípios como
 * botões lado a lado e os servidores numa lista simples. Com dezenas de
 * municípios e centenas de servidores por município, isso vira uma parede
 * ilegível. Agora:
 *   - município num <Select> com busca, que não cresce na tela;
 *   - servidores em lista paginada, com busca por nome/email e filtro por
 *     papel, mostrando o total e quantos estão sendo exibidos.
 *
 * O fluxo não mudou: escolher município -> escolher servidor -> pedir
 * assistência -> o assistido autoriza -> transmissão somente-visualização.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext'
import { RemoteAssistViewer } from '@/components/super-admin/RemoteAssistViewer'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Building2,
  Monitor,
  Search,
  Users,
  X,
} from 'lucide-react'

interface Tenant {
  id: string
  nome: string
  slug: string
  status?: string
}

interface TenantUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  lastLogin?: string | null
  department?: { name: string } | null
}

/** Quantos servidores mostrar por vez — evita renderizar centenas de linhas. */
const POR_PAGINA = 20

const CORES_PAPEL: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
  ADMIN: 'bg-blue-50 text-blue-700 border-blue-200',
  MANAGER: 'bg-amber-50 text-amber-700 border-amber-200',
  COORDINATOR: 'bg-teal-50 text-teal-700 border-teal-200',
  USER: 'bg-gray-50 text-gray-600 border-gray-200',
}

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export default function AssistenciaRemotaPage() {
  const { apiRequest } = useSuperAdminAuth()

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantId, setTenantId] = useState<string>('')
  const [users, setUsers] = useState<TenantUser[]>([])
  const [selecionado, setSelecionado] = useState<TenantUser | null>(null)

  const [carregandoTenants, setCarregandoTenants] = useState(true)
  const [carregandoUsers, setCarregandoUsers] = useState(false)
  const [busca, setBusca] = useState('')
  const [papel, setPapel] = useState<string>('TODOS')
  const [limite, setLimite] = useState(POR_PAGINA)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await apiRequest('/platform/tenants')
        const lista: Tenant[] = data.tenants ?? []
        setTenants(lista)
        // Um município só: já seleciona, poupando um clique inútil.
        if (lista.length === 1) setTenantId(lista[0].id)
      } catch {
        setErro('Não foi possível carregar os municípios.')
      } finally {
        setCarregandoTenants(false)
      }
    }
    carregar()
  }, [apiRequest])

  const carregarUsuarios = useCallback(
    async (id: string) => {
      setCarregandoUsers(true)
      setErro(null)
      try {
        const data = await apiRequest(`/platform/tenants/${id}/users`)
        setUsers(data.users ?? [])
      } catch {
        setErro('Não foi possível carregar os servidores deste município.')
        setUsers([])
      } finally {
        setCarregandoUsers(false)
      }
    },
    [apiRequest]
  )

  useEffect(() => {
    if (!tenantId) return
    setSelecionado(null)
    setBusca('')
    setPapel('TODOS')
    setLimite(POR_PAGINA)
    carregarUsuarios(tenantId)
  }, [tenantId, carregarUsuarios])

  const papeisDisponiveis = useMemo(
    () => Array.from(new Set(users.map((u) => u.role))).sort(),
    [users]
  )

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return users.filter((u) => {
      if (papel !== 'TODOS' && u.role !== papel) return false
      if (!q) return true
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    })
  }, [users, busca, papel])

  const visiveis = filtrados.slice(0, limite)
  const tenantAtual = tenants.find((t) => t.id === tenantId)

  // Sessão em andamento: o visualizador ocupa a área toda.
  if (selecionado) {
    return (
      <div className="flex h-[calc(100vh-7rem)] flex-col gap-3 p-6">
        <button
          onClick={() => setSelecionado(null)}
          className="flex w-fit items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-gray-900"
        >
          <ArrowLeft size={15} />
          Voltar para a lista
        </button>
        <div className="min-h-0 flex-1">
          <RemoteAssistViewer
            assistedUserId={selecionado.id}
            assistedUserName={selecionado.name}
            onClose={() => setSelecionado(null)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Monitor className="text-indigo-600" size={24} />
          Assistência Remota
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Acompanhe ao vivo a tela de um servidor para dar suporte. A pessoa precisa{' '}
          <strong>autorizar</strong> antes de qualquer transmissão, e você pode ver e apontar —
          mas não clicar nem digitar.
        </p>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* Município: Select em vez de botões — não cresce com o nº de municípios */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-gray-700">
            <Building2 size={16} className="text-gray-400" />
            Município
          </label>
          {carregandoTenants ? (
            <Skeleton className="h-10 w-full sm:max-w-sm" />
          ) : (
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger className="w-full sm:max-w-sm">
                <SelectValue placeholder="Selecione um município" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                    <span className="ml-2 text-xs text-gray-400">{t.slug}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {tenantAtual && !carregandoUsers && (
            <span className="text-sm text-gray-500">
              {users.length} {users.length === 1 ? 'servidor' : 'servidores'}
            </span>
          )}
        </CardContent>
      </Card>

      {!tenantId && !carregandoTenants && (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <Building2 className="mb-2 text-gray-300" size={30} />
          <p className="text-sm text-gray-500">
            Selecione um município para ver os servidores disponíveis.
          </p>
        </div>
      )}

      {tenantId && (
        <Card>
          <CardContent className="space-y-4 py-4">
            {/* Busca + filtro por papel: é aqui que o volume cresce de verdade */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={15}
                />
                <Input
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value)
                    setLimite(POR_PAGINA)
                  }}
                  placeholder="Buscar por nome ou email"
                  className="pl-8 pr-8"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {papeisDisponiveis.length > 1 && (
                <Select
                  value={papel}
                  onValueChange={(v) => {
                    setPapel(v)
                    setLimite(POR_PAGINA)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os papéis</SelectItem>
                    {papeisDisponiveis.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {carregandoUsers ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : filtrados.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-sm text-gray-500">
                <Users className="mb-2 text-gray-300" size={28} />
                {users.length === 0
                  ? 'Nenhum servidor neste município.'
                  : 'Nenhum servidor corresponde aos filtros.'}
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {visiveis.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-4 py-2.5 transition-colors hover:bg-gray-50/70"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            u.isActive
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {iniciais(u.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-gray-900">{u.name}</p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${CORES_PAPEL[u.role] ?? ''}`}
                            >
                              {u.role}
                            </Badge>
                            {!u.isActive && (
                              <Badge variant="secondary" className="text-[10px]">
                                inativo
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-sm text-gray-500">
                            {u.email}
                            {u.department?.name ? ` · ${u.department.name}` : ''}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={u.isActive ? 'default' : 'outline'}
                        disabled={!u.isActive}
                        onClick={() => setSelecionado(u)}
                        title={
                          u.isActive
                            ? 'Solicitar assistência remota'
                            : 'Usuário inativo não pode ser assistido'
                        }
                      >
                        <Monitor size={15} className="mr-1.5" />
                        Assistir
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Paginação incremental — não renderiza centenas de linhas de uma vez */}
                <div className="flex items-center justify-between pt-1 text-sm text-gray-500">
                  <span>
                    Mostrando {visiveis.length} de {filtrados.length}
                    {filtrados.length !== users.length && ` (${users.length} no total)`}
                  </span>
                  {limite < filtrados.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLimite((l) => l + POR_PAGINA)}
                    >
                      Mostrar mais
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
