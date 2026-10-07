'use client'

/**
 * Novo processo interno. Pode vir de um protocolo do cidadão
 * (?protocolId=...&tipo=PAR) para pedir parecer de outra unidade.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { UnitPicker } from '@/components/admin/internal-process/UnitPicker'
import { useToast } from '@/hooks/use-toast'

interface ProcessType {
  id: string
  name: string
  prefix: string
  description: string | null
  defaultDays: number
  isActive: boolean
}

export default function NovoProcessoInternoPage() {
  const router = useRouter()
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const [types, setTypes] = useState<ProcessType[]>([])
  const [myUnits, setMyUnits] = useState<Array<{ id: string; nome: string }>>([])
  const [typeId, setTypeId] = useState('')
  const [originUnitId, setOriginUnitId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [toUnitId, setToUnitId] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [confidential, setConfidential] = useState(false)
  const [protocolId, setProtocolId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromProtocol = params.get('protocolId')
    const wantedType = params.get('tipo')
    if (fromProtocol) setProtocolId(fromProtocol)
    const protocolNumber = params.get('numero')
    if (protocolNumber) setSubject(`Parecer sobre o protocolo nº ${protocolNumber}`)

    Promise.all([apiRequest('/internal-processes/types'), apiRequest('/internal-processes/me')])
      .then(([typesResponse, meResponse]: any[]) => {
        const list: ProcessType[] = (typesResponse?.data?.types || []).filter((type: ProcessType) => type.isActive)
        setTypes(list)
        const preferred = list.find((type) => type.prefix === (wantedType || 'MEM')) || list[0]
        if (preferred) setTypeId(preferred.id)
        const units = meResponse?.data?.units || []
        setMyUnits(units)
        if (units[0]) setOriginUnitId(units[0].id)
      })
      .catch(() => setError('Não foi possível carregar os tipos de processo.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async () => {
    setError(null)
    if (subject.trim().length < 3) return setError('Escreva o assunto.')
    if (!toUnitId) return setError('Escolha para qual unidade enviar.')
    try {
      setSaving(true)
      const response = await apiRequest('/internal-processes', {
        method: 'POST',
        body: JSON.stringify({ typeId, subject, body, originUnitId, toUnitId, priority: urgent ? 1 : 0, confidential, protocolId }),
      })
      const created = response?.data?.process
      toast({ title: 'Processo enviado', description: created?.number })
      router.push(created?.id ? `/admin/processos-internos/${created.id}` : '/admin/processos-internos')
    } catch (submitError: any) {
      setError(submitError?.message || 'Não foi possível enviar.')
    } finally {
      setSaving(false)
    }
  }

  const selectedType = types.find((type) => type.id === typeId)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/processos-internos" className="rounded-lg p-2 hover:bg-gray-100" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo processo interno</h1>
          {protocolId && <p className="text-sm text-gray-600">Ligado ao protocolo do cidadão: a resposta volta como nota interna no protocolo.</p>}
        </div>
      </div>

      {myUnits.length === 0 && types.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Você não está lotado em nenhuma unidade do organograma. Peça ao seu gestor para ajustar a sua lotação.
        </div>
      )}

      <div className="space-y-5 rounded-xl border bg-white p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="type">Tipo</Label>
            <select id="type" value={typeId} onChange={(e) => setTypeId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm">
              {types.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {selectedType && <p className="text-xs text-gray-500">Prazo padrão: {selectedType.defaultDays} dias úteis</p>}
          </div>
          {myUnits.length > 1 && (
            <div className="space-y-1">
              <Label htmlFor="origin">Enviar em nome de</Label>
              <select id="origin" value={originUnitId} onChange={(e) => setOriginUnitId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm">
                {myUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="subject">Assunto</Label>
          <Input id="subject" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="body">Texto</Label>
          <Textarea id="body" rows={8} maxLength={20000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Descreva o pedido, o contexto e o que precisa." />
        </div>

        <div className="space-y-1">
          <Label>Enviar para</Label>
          <UnitPicker value={toUnitId} onChange={(id) => setToUnitId(id)} hintText={`${subject} ${body}`} excludeIds={originUnitId ? [originUnitId] : []} />
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={urgent} onCheckedChange={(checked) => setUrgent(checked === true)} /> Urgente
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={confidential} onCheckedChange={(checked) => setConfidential(checked === true)} /> Sigiloso (só quem participa vê)
          </label>
        </div>

        {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/processos-internos">Cancelar</Link>
          </Button>
          <Button onClick={submit} disabled={saving || myUnits.length === 0}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar
          </Button>
        </div>
      </div>
    </div>
  )
}
