'use client'

/**
 * Editor de fluxo (administrador), sem nada técnico: etapas em cartões —
 * nome, quem faz (papel ou unidade/servidor fixo), prazo, o que fazer e os
 * documentos (obrigatório / precisa assinar).
 *  - /fluxos/<id do tipo>: edita um fluxo próprio OU um fluxo pronto da lei
 *    (a edição vale só para o município; dá para voltar ao padrão da lei)
 *  - /fluxos/novo?base=LICITACAO ou ?copia=<id>: nova cópia; /fluxos/novo: do zero
 * Processos já abertos continuam com o fluxo de quando foram abertos.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowDown, ArrowLeft, ArrowUp, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { UnitPersonSelect } from '@/components/admin/internal-process/UnitPersonSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface StageDoc {
  key: string
  required: boolean
  sign: boolean
}

interface StageForm {
  key?: string
  name: string
  role: string
  days: number
  legal: string
  description: string
  checklist: string
  docs: StageDoc[]
  unitId: string
  userId: string
  userName: string | null
}

interface FlowStageDef {
  key: string
  name: string
  role: string
  days: number
  legal?: string
  description?: string
  checklist?: string[]
  requiredDocs?: string[]
  signedDocs?: string[]
  optionalDocs?: string[]
  unitId?: string | null
  userId?: string | null
  userName?: string | null
}

const toForm = (stage: FlowStageDef): StageForm => ({
  key: stage.key,
  name: stage.name,
  role: stage.role,
  days: stage.days,
  legal: stage.legal || '',
  description: stage.description || '',
  checklist: (stage.checklist || []).join('\n'),
  docs: [
    ...(stage.requiredDocs || []).map((key) => ({ key, required: true, sign: (stage.signedDocs || []).includes(key) })),
    ...(stage.optionalDocs || []).map((key) => ({ key, required: false, sign: false })),
  ],
  unitId: stage.unitId || '',
  userId: stage.userId || '',
  userName: stage.userName || null,
})

const emptyStage = (): StageForm => ({ name: '', role: 'DEMANDANTE', days: 5, legal: '', description: '', checklist: '', docs: [], unitId: '', userId: '', userName: null })

export default function FluxoEditorPage() {
  const { id } = useParams() as { id: string }
  const isNew = id === 'novo'
  const router = useRouter()
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const [roles, setRoles] = useState<Array<{ key: string; name: string; hint: string }>>([])
  const [templates, setTemplates] = useState<Array<{ key: string; title: string }>>([])
  const [readyFlows, setReadyFlows] = useState<Array<{ key: string; name: string; fieldsKind: string | null }>>([])
  const [name, setName] = useState('')
  const [prefix, setPrefix] = useState('')
  const [description, setDescription] = useState('')
  const [baseKey, setBaseKey] = useState('')
  const [stages, setStages] = useState<StageForm[]>([emptyStage()])
  const [units, setUnits] = useState<Array<{ id: string; nome: string; department?: string | null }>>([])
  // fluxo pronto da lei sendo editado (a sigla e os dados da contratação não mudam)
  const [standardKey, setStandardKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [flowsResponse, unitsResponse]: any[] = await Promise.all([
          apiRequest('/internal-processes/flows'),
          apiRequest('/internal-processes/units').catch(() => null),
        ])
        setUnits(unitsResponse?.data?.units || [])
        const info = flowsResponse?.data || {}
        setRoles(info.roles || [])
        setTemplates(info.templates || [])
        setReadyFlows(info.flows || [])
        const params = new URLSearchParams(window.location.search)
        const base = params.get('base')
        const copy = params.get('copia')
        if (!isNew || copy) {
          const typeResponse: any = await apiRequest(`/internal-processes/flow-types/${isNew ? copy : id}`)
          const type = typeResponse?.data?.type
          const definition = type?.flowDefinition
          if (!isNew) setStandardKey(typeResponse?.data?.standardKey || null)
          if (definition?.stages?.length) {
            setName(isNew ? `${type.name} (cópia)` : type.name)
            if (!isNew) setPrefix(type.prefix)
            setDescription(type.description || '')
            setBaseKey(definition.baseKey || '')
            setStages(definition.stages.map(toForm))
          }
        } else if (base) {
          const flow = (info.flows || []).find((item: any) => item.key === base)
          if (flow) {
            setName(`${flow.name} (do município)`)
            setDescription(flow.description || '')
            setBaseKey(flow.fieldsKind ? flow.key : '')
            setStages(flow.stages.map(toForm))
          }
        }
      } catch (loadError: any) {
        setError(loadError?.message || 'Não foi possível carregar.')
      } finally {
        setLoading(false)
      }
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const update = (index: number, patch: Partial<StageForm>) => setStages((list) => list.map((stage, i) => (i === index ? { ...stage, ...patch } : stage)))
  const move = (index: number, delta: number) =>
    setStages((list) => {
      const next = [...list]
      const target = index + delta
      if (target < 0 || target >= next.length) return list
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  const updateDoc = (index: number, docIndex: number, patch: Partial<StageDoc>) =>
    update(index, { docs: stages[index].docs.map((doc, i) => (i === docIndex ? { ...doc, ...patch } : doc)) })

  const save = async () => {
    setError(null)
    if (name.trim().length < 3) return setError('Dê um nome ao fluxo.')
    if (isNew && prefix.trim().length < 2) return setError('Informe a sigla (2 a 4 letras), usada no número: SIGLA-2026-00001.')
    const payload = {
      name,
      prefix,
      description,
      baseKey: baseKey || null,
      stages: stages.map((stage) => ({
        key: stage.key,
        name: stage.name,
        role: stage.role,
        unitId: stage.unitId || null,
        userId: stage.unitId ? stage.userId || null : null,
        days: stage.days,
        legal: stage.legal,
        description: stage.description,
        checklist: stage.checklist.split('\n'),
        requiredDocs: stage.docs.filter((doc) => doc.required).map((doc) => doc.key),
        signedDocs: stage.docs.filter((doc) => doc.required && doc.sign).map((doc) => doc.key),
        optionalDocs: stage.docs.filter((doc) => !doc.required).map((doc) => doc.key),
      })),
    }
    try {
      setSaving(true)
      await apiRequest(isNew ? '/internal-processes/flow-types' : `/internal-processes/flow-types/${id}`, { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(payload) })
      toast({ title: 'Fluxo salvo', description: 'Já aparece em Novo processo.' })
      router.push('/admin/processos-internos/configurar')
    } catch (saveError: any) {
      setError(saveError?.message || 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  const titleOf = (key: string) => templates.find((template) => template.key === key)?.title || key

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/admin/processos-internos/configurar" className="mt-1 rounded-lg p-2 hover:bg-gray-100" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'Novo fluxo' : 'Editar fluxo'}</h1>
          <p className="text-sm text-gray-600">Processos já abertos continuam com o fluxo de quando foram abertos.</p>
          {standardKey && (
            <p className="mt-2 rounded-md bg-amber-50 p-2 text-sm text-amber-900">
              Este é um fluxo pronto da Lei 14.133. As mudanças valem só para o seu município e dá para voltar ao padrão da lei a qualquer momento. Cuidado ao tirar etapas ou documentos que a lei exige.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <div className="space-y-1">
            <Label htmlFor="flow-name">Nome</Label>
            <Input id="flow-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Compra de medicamentos" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="flow-prefix">Sigla</Label>
            <Input id="flow-prefix" maxLength={4} value={prefix} disabled={!isNew} onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} placeholder="CMD" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="flow-description">Para que serve (opcional)</Label>
          <Input id="flow-description" maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="flow-base">Pede os dados da contratação?</Label>
          <select id="flow-base" value={baseKey} disabled={!!standardKey} onChange={(e) => setBaseKey(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm">
            <option value="">Não (processo comum com etapas)</option>
            {readyFlows.filter((flow) => flow.fieldsKind).map((flow) => (
              <option key={flow.key} value={flow.key}>Sim, como em: {flow.name}</option>
            ))}
          </select>
        </div>
      </div>

      <ol className="space-y-3">
        {stages.map((stage, index) => (
          <li key={index} className="space-y-3 rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-gray-900">Etapa {index + 1}</p>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Subir"><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => move(index, 1)} disabled={index === stages.length - 1} aria-label="Descer"><ArrowDown className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setStages((list) => list.filter((_, i) => i !== index))} disabled={stages.length === 1} aria-label="Apagar etapa">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_220px_110px]">
              <div className="space-y-1">
                <Label>Nome da etapa</Label>
                <Input maxLength={80} value={stage.name} onChange={(e) => update(index, { name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Quem faz</Label>
                <select value={stage.role} onChange={(e) => update(index, { role: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm">
                  {roles.map((role) => (
                    <option key={role.key} value={role.key}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Prazo (dias úteis)</Label>
                <Input type="number" min={1} max={90} value={stage.days} onChange={(e) => update(index, { days: Number(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Mandar sempre para (opcional)</Label>
              <UnitPersonSelect
                units={units}
                value={{ unitId: stage.unitId, userId: stage.userId }}
                userName={stage.userName}
                emptyLabel="— quem estiver em “Quem faz cada etapa” —"
                onChange={(next) => update(index, { unitId: next.unitId, userId: next.userId, userName: null })}
              />
              <p className="text-xs text-gray-500">
                {stage.unitId ? 'Esta etapa vai sempre para esta unidade, mesmo que o papel aponte para outra.' : 'Vazio: segue o papel escolhido acima.'}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
              <div className="space-y-1">
                <Label>O que acontece nesta etapa (opcional)</Label>
                <Textarea rows={2} maxLength={500} value={stage.description} onChange={(e) => update(index, { description: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Fundamento legal (opcional)</Label>
                <Input maxLength={120} value={stage.legal} onChange={(e) => update(index, { legal: e.target.value })} placeholder="Ex.: Art. 53" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>O que conferir — um item por linha (opcional)</Label>
              <Textarea rows={3} value={stage.checklist} onChange={(e) => update(index, { checklist: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Documentos da etapa</Label>
              {stage.docs.length === 0 && <p className="text-xs text-gray-500">Nenhum. A etapa pode ser concluída sem documento.</p>}
              {stage.docs.map((doc, docIndex) => (
                <div key={`${doc.key}-${docIndex}`} className="flex flex-col gap-2 rounded-md border p-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-gray-900">{titleOf(doc.key)}</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={doc.required} onChange={(e) => updateDoc(index, docIndex, { required: e.target.checked, sign: e.target.checked ? doc.sign : false })} />
                      Obrigatório
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={doc.sign} disabled={!doc.required} onChange={(e) => updateDoc(index, docIndex, { sign: e.target.checked })} />
                      Precisa assinar
                    </label>
                    <button type="button" className="text-xs text-red-700 hover:underline" onClick={() => update(index, { docs: stage.docs.filter((_, i) => i !== docIndex) })}>
                      tirar
                    </button>
                  </div>
                </div>
              ))}
              <select
                value=""
                onChange={(e) => e.target.value && update(index, { docs: [...stage.docs, { key: e.target.value, required: true, sign: true }] })}
                className="h-9 w-full rounded-md border border-dashed border-input bg-background px-2 text-sm text-gray-600"
              >
                <option value="">+ Adicionar documento (modelo)</option>
                {templates.filter((template) => !stage.docs.some((doc) => doc.key === template.key)).map((template) => (
                  <option key={template.key} value={template.key}>{template.title}</option>
                ))}
              </select>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setStages((list) => [...list.slice(0, index + 1), emptyStage(), ...list.slice(index + 1)])}>
              <Plus className="mr-1 h-4 w-4" />Etapa depois desta
            </Button>
          </li>
        ))}
      </ol>

      {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild><Link href="/admin/processos-internos/configurar">Cancelar</Link></Button>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar fluxo
        </Button>
      </div>
    </div>
  )
}
