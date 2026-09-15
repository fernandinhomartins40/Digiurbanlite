'use client'

/**
 * ASSISTÊNCIA REMOTA — página do operador de plataforma (2026-09-15)
 *
 * Porta de entrada da funcionalidade: o operador escolhe o município, depois o
 * servidor, e abre a sessão. O componente RemoteAssistViewer cuida do resto
 * (pedido → aceite do assistido → transmissão ao vivo).
 *
 * Somente visualização + ponteiro: o operador NÃO clica nem digita na tela da
 * pessoa. E nada é transmitido antes do aceite explícito dela.
 */

import { useCallback, useEffect, useState } from 'react'
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext'
import { RemoteAssistViewer } from '@/components/super-admin/RemoteAssistViewer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Monitor, Search, ArrowLeft, Users } from 'lucide-react'

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

export default function AssistenciaRemotaPage() {
  const { apiRequest } = useSuperAdminAuth()

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [users, setUsers] = useState<TenantUser[]>([])
  const [selecionado, setSelecionado] = useState<TenantUser | null>(null)

  const [carregandoTenants, setCarregandoTenants] = useState(true)
  const [carregandoUsers, setCarregandoUsers] = useState(false)
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await apiRequest('/platform/tenants')
        setTenants(data.tenants ?? [])
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

  const escolherTenant = (id: string) => {
    setTenantId(id)
    setSelecionado(null)
    carregarUsuarios(id)
  }

  const filtrados = users.filter((u) => {
    const q = busca.trim().toLowerCase()
    if (!q) return true
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  // Sessão em andamento: o visualizador ocupa a tela inteira do conteúdo.
  if (selecionado) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 p-6">
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
    <div className="space-y-6 p-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Escolha o município</CardTitle>
        </CardHeader>
        <CardContent>
          {carregandoTenants ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="animate-spin" size={16} /> Carregando municípios...
            </div>
          ) : tenants.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum município cadastrado.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => escolherTenant(t.id)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    tenantId === t.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t.nome}
                  <span className="ml-1.5 text-xs text-gray-400">{t.slug}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {tenantId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle className="text-base">2. Escolha o servidor</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou email"
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            {carregandoUsers ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="animate-spin" size={16} /> Carregando servidores...
              </div>
            ) : filtrados.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center text-sm text-gray-500">
                <Users className="mb-2 text-gray-300" size={28} />
                {users.length === 0
                  ? 'Nenhum servidor neste município.'
                  : 'Nenhum servidor corresponde à busca.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtrados.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-gray-900">{u.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {u.role}
                        </Badge>
                        {!u.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            inativo
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-gray-500">
                        {u.email}
                        {u.department?.name ? ` · ${u.department.name}` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
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
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
