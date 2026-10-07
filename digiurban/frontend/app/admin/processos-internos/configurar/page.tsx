'use client'

/**
 * Fluxos e responsáveis do processo interno (administrador).
 *  1. Quem faz cada etapa: cada papel (Compras, Jurídico, Finanças...) ligado
 *     a uma unidade do organograma UMA vez — todos os fluxos passam a se
 *     encaminhar sozinhos. O sistema sugere pelo nome das unidades.
 *  2. Fluxos: os prontos (Lei 14.133) e os próprios do município, feitos a
 *     partir de uma cópia.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Loader2, Pencil, Plus, Save, Sparkles } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface RoleRow {
  key: string
  name: string
  hint: string
  configurable: boolean
  unitId: string | null
  suggestedUnitId: string | null
  suggestedUnitName: string | null
}

interface UnitOption {
  id: string
  nome: string
  department: string | null
}

interface FlowInfo {
  key: string
  name: string
  description: string
  stages: Array<{ key: string; name: string; role: string }>
}

interface TypeRow {
  id: string
  name: string
  prefix: string
  isActive: boolean
  flowKey: string | null
  flowDefinition?: { stages?: Array<{ name: string; role: string }> } | null
}

export default function ConfigurarProcessosPage() {
  const { apiRequest, user } = useAdminAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState<'roles' | 'flows'>('roles')
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [units, setUnits] = useState<UnitOption[]>([])
  const [chosen, setChosen] = useState<Record<string, string>>({})
  const [flows, setFlows] = useState<FlowInfo[]>([])
  const [roleNames, setRoleNames] = useState<Record<string, string>>({})
  const [types, setTypes] = useState<TypeRow[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(String(user?.role || ''))

  const load = async () => {
    try {
      const [rolesResponse, flowsResponse, typesResponse]: any[] = await Promise.all([
        apiRequest('/internal-processes/settings/roles'),
        apiRequest('/internal-processes/flows'),
        apiRequest('/internal-processes/types'),
      ])
      const rows: RoleRow[] = rolesResponse?.data?.roles || []
      setRoles(rows)
      setUnits(rolesResponse?.data?.units || [])
      setChosen(Object.fromEntries(rows.filter((row) => row.configurable).map((row) => [row.key, row.unitId || ''])))
      setFlows(flowsResponse?.data?.flows || [])
      setRoleNames(Object.fromEntries((flowsResponse?.data?.roles || []).map((role: any) => [role.key, role.name])))
      setTypes(typesResponse?.data?.types || [])
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível carregar', description: error?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveRoles = async () => {
    try {
      setSaving(true)
      await apiRequest('/internal-processes/settings/roles', { method: 'PUT', body: JSON.stringify({ roles: chosen }) })
      toast({ title: 'Salvo', description: 'Os processos passam a ir sozinhos para essas unidades.' })
      await load()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível salvar', description: error?.message })
    } finally {
      setSaving(false)
    }
  }

  const useSuggestions = () => {
    setChosen((current) => {
      const next = { ...current }
      for (const role of roles) if (role.configurable && !next[role.key] && role.suggestedUnitId) next[role.key] = role.suggestedUnitId
      return next
    })
  }

  const toggleType = async (type: TypeRow) => {
    try {
      await apiRequest(`/internal-processes/types/${type.id}`, { method: 'PUT', body: JSON.stringify({ isActive: !type.isActive }) })
      setTypes((list) => list.map((item) => (item.id === type.id ? { ...item, isActive: !item.isActive } : item)))
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível', description: error?.message })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  const configurable = roles.filter((role) => role.configurable)
  const missing = configurable.filter((role) => !chosen[role.key]).length
  const hasSuggestion = configurable.some((role) => !chosen[role.key] && role.suggestedUnitId)
  const customTypes = types.filter((type) => type.flowKey === 'CUSTOM')
  const typeOfFlow = (key: string) => types.find((type) => type.flowKey === key)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/admin/processos-internos" className="mt-1 rounded-lg p-2 hover:bg-gray-100" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fluxos e responsáveis</h1>
          <p className="text-sm text-gray-600">Diga uma vez quem faz cada etapa e todos os processos com etapas andam sozinhos entre os setores.</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {[
          { id: 'roles' as const, label: 'Quem faz cada etapa' },
          { id: 'flows' as const, label: 'Fluxos' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn('flex-1 rounded-lg px-3 py-1.5 text-sm', tab === item.id ? 'bg-white font-medium shadow-sm' : 'text-gray-600')}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'roles' && (
        <div className="space-y-4 rounded-xl border bg-white p-4">
          {units.length === 0 && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              O organograma ainda não tem unidades. Cadastre as unidades (Compras, Jurídico, Finanças...) em Organograma e volte aqui.
            </p>
          )}
          <p className="text-sm text-gray-700">
            A <strong>unidade que pediu</strong> é sempre a que abriu o processo. Para os outros papéis, escolha a unidade do organograma.
            {missing > 0 && <span className="text-amber-700"> Faltam {missing}: etapas desses papéis ficam com a unidade anterior até você escolher.</span>}
          </p>
          {hasSuggestion && isAdmin && (
            <Button size="sm" variant="outline" onClick={useSuggestions}>
              <Sparkles className="mr-2 h-4 w-4 text-amber-500" />Preencher com as sugestões
            </Button>
          )}
          <ul className="divide-y">
            {configurable.map((role) => (
              <li key={role.key} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{role.name}</p>
                  <p className="text-xs text-gray-500">{role.hint}</p>
                  {!chosen[role.key] && role.suggestedUnitName && <p className="text-xs text-amber-700">Sugestão: {role.suggestedUnitName}</p>}
                </div>
                <select
                  value={chosen[role.key] || ''}
                  onChange={(e) => setChosen((current) => ({ ...current, [role.key]: e.target.value }))}
                  disabled={!isAdmin}
                  className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm sm:w-80"
                >
                  <option value="">— ninguém definido —</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.nome}{unit.department ? ` · ${unit.department}` : ''}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          {isAdmin && (
            <div className="flex justify-end">
              <Button onClick={saveRoles} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === 'flows' && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-xl border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-gray-900">Fluxos do município</p>
              {isAdmin && (
                <Button size="sm" asChild>
                  <Link href="/admin/processos-internos/fluxos/novo"><Plus className="mr-1 h-4 w-4" />Criar do zero</Link>
                </Button>
              )}
            </div>
            {customTypes.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum ainda. O jeito mais fácil: faça uma cópia de um fluxo pronto abaixo e ajuste.</p>
            ) : (
              <ul className="divide-y">
                {customTypes.map((type) => (
                  <li key={type.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className={cn('font-medium', type.isActive ? 'text-gray-900' : 'text-gray-400')}>{type.name} <span className="font-mono text-xs text-gray-500">{type.prefix}</span></p>
                      <p className="text-xs text-gray-500">{(type.flowDefinition?.stages || []).map((stage) => stage.name).join(' → ')}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/processos-internos/fluxos/${type.id}`}><Pencil className="mr-1 h-4 w-4" />Editar</Link>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleType(type)}>{type.isActive ? 'Desligar' : 'Ligar'}</Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2 rounded-xl border bg-white p-4">
            <p className="font-medium text-gray-900">Fluxos prontos (Lei 14.133/2021)</p>
            <p className="text-xs text-gray-500">Seguem a lei e são atualizados pela plataforma. Para mudar, faça uma cópia.</p>
            <ul className="divide-y">
              {flows.map((flow) => {
                const type = typeOfFlow(flow.key)
                return (
                  <li key={flow.key} className="space-y-2 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className={cn('font-medium', type && !type.isActive ? 'text-gray-400' : 'text-gray-900')}>{flow.name}</p>
                        <p className="text-xs text-gray-600">{flow.description}</p>
                        <button type="button" className="text-xs text-blue-700 hover:underline" onClick={() => setOpen(open === flow.key ? null : flow.key)}>
                          {open === flow.key ? 'Esconder etapas' : `Ver as ${flow.stages.length} etapas`}
                        </button>
                      </div>
                      {isAdmin && (
                        <div className="flex shrink-0 gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/processos-internos/fluxos/novo?base=${flow.key}`}><Copy className="mr-1 h-4 w-4" />Fazer uma cópia</Link>
                          </Button>
                          {type && <Button size="sm" variant="ghost" onClick={() => toggleType(type)}>{type.isActive ? 'Desligar' : 'Ligar'}</Button>}
                        </div>
                      )}
                    </div>
                    {open === flow.key && (
                      <ol className="list-decimal space-y-0.5 pl-6 text-sm text-gray-700">
                        {flow.stages.map((stage) => (
                          <li key={stage.key}>{stage.name} <span className="text-xs text-gray-500">— {roleNames[stage.role] || stage.role}</span></li>
                        ))}
                      </ol>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
