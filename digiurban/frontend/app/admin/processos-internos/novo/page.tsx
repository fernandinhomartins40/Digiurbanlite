'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FilePlus2,
  Flag,
  GitBranch,
  Lock,
  Tags,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OrganizationalUnitAutocomplete } from '@/components/admin/OrganizationalUnitAutocomplete'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import { flowClient, ProcessType } from '@/lib/flow-client'

interface CreateProcessFormState {
  typeId: string
  subject: string
  description: string
  sigilo: string
  priority: string
  originSectorId: string
  originSectorName: string
  dueAt: string
  tags: string
}

function createEmptyForm(): CreateProcessFormState {
  return {
    typeId: '',
    subject: '',
    description: '',
    sigilo: 'PUBLICO',
    priority: '0',
    originSectorId: '',
    originSectorName: '',
    dueAt: '',
    tags: '',
  }
}

function toDateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

function formatSla(hours?: number): string {
  if (!hours) return 'Sem SLA padrão'
  if (hours < 24) return `${hours}h`

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24

  if (!remainingHours) {
    return `${days} dia${days > 1 ? 's' : ''}`
  }

  return `${days}d ${remainingHours}h`
}

const SIGILO_LABELS: Record<string, string> = {
  PUBLICO: 'Público',
  RESTRITO: 'Restrito',
  CONFIDENCIAL: 'Confidencial',
}

const PRIORITY_LABELS: Record<string, string> = {
  '0': 'Normal',
  '1': 'Urgente',
  '2': 'Urgentíssimo',
}

export default function NovoProcessoInternoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAdminAuth()
  const { toast } = useToast()

  const [loadingTypes, setLoadingTypes] = useState(true)
  const [saving, setSaving] = useState(false)
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([])
  const [form, setForm] = useState<CreateProcessFormState>(createEmptyForm)

  const selectedType = processTypes.find(type => type.id === form.typeId)
  const activeTypes = processTypes.filter(type => type.isActive)
  const isSubmitDisabled = saving || loadingTypes || !form.typeId || !form.subject.trim() || !form.originSectorName.trim()

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const types = await flowClient.listProcessTypes()
        setProcessTypes(types)
      } catch (error) {
        toast({
          title: 'Erro ao carregar tipos de processo',
          description: error instanceof Error ? error.message : 'Não foi possível preparar o formulário.',
          variant: 'destructive',
        })
      } finally {
        setLoadingTypes(false)
      }
    }

    loadTypes()
  }, [toast])

  useEffect(() => {
    if (form.originSectorName) return

    const defaultSectorName = user?.department?.name || user?.primaryDepartment?.name
    const defaultSectorId = user?.departmentId || user?.primaryDepartment?.id || defaultSectorName

    if (!defaultSectorName || !defaultSectorId) return

    setForm(current => ({
      ...current,
      originSectorId: defaultSectorId,
      originSectorName: defaultSectorName,
    }))
  }, [form.originSectorName, user?.department?.name, user?.departmentId, user?.primaryDepartment?.id, user?.primaryDepartment?.name])

  useEffect(() => {
    const preselectedTypeId = searchParams.get('typeId')
    if (!preselectedTypeId || form.typeId || processTypes.length === 0) return

    const preselectedType = processTypes.find(type => type.id === preselectedTypeId && type.isActive)
    if (!preselectedType) return

    setForm(current => ({
      ...current,
      typeId: preselectedType.id,
      sigilo: preselectedType.sigiloDefault || current.sigilo,
      dueAt: current.dueAt || (preselectedType.defaultSlaHours ? toDateTimeLocal(new Date(Date.now() + preselectedType.defaultSlaHours * 60 * 60 * 1000)) : ''),
    }))
  }, [form.typeId, processTypes, searchParams])

  const handleTypeChange = (typeId: string) => {
    const nextType = processTypes.find(type => type.id === typeId)

    setForm(current => ({
      ...current,
      typeId,
      sigilo: nextType?.sigiloDefault || current.sigilo,
      dueAt: current.dueAt || (nextType?.defaultSlaHours ? toDateTimeLocal(new Date(Date.now() + nextType.defaultSlaHours * 60 * 60 * 1000)) : current.dueAt),
    }))
  }

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
      return
    }

    setSaving(true)

    try {
      const process = await flowClient.createProcess({
        typeId: form.typeId,
        subject: form.subject.trim(),
        description: form.description.trim() || undefined,
        sigilo: form.sigilo,
        priority: parseInt(form.priority, 10),
        originSectorId: form.originSectorId || form.originSectorName,
        originSectorName: form.originSectorName.trim(),
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
        tags: form.tags ? form.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      })

      router.push(`/admin/processos-internos?created=${process.id}`)
    } catch (error) {
      toast({
        title: 'Erro ao criar processo',
        description: error instanceof Error ? error.message : 'Não foi possível abrir o processo.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button variant="ghost" size="sm" asChild className="w-fit px-0 text-gray-600 hover:bg-transparent">
            <Link href="/admin/processos-internos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para processos
            </Link>
          </Button>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
              <ArrowRightLeft className="h-4 w-4" />
              Abertura guiada de processo interno
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Novo Processo</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Abra o processo em uma página dedicada, com contexto do tipo, setor de origem e automações aplicáveis antes de confirmar a criação.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {activeTypes.length} tipo{activeTypes.length !== 1 ? 's' : ''} ativo{activeTypes.length !== 1 ? 's' : ''}
          </Badge>
          {selectedType?.defaultWorkflowTemplate && (
            <Badge className="rounded-full bg-blue-600 px-3 py-1 hover:bg-blue-600">
              <GitBranch className="mr-1 h-3.5 w-3.5" />
              Fluxo automático
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FilePlus2 className="h-5 w-5 text-blue-600" />
              Dados do processo
            </CardTitle>
            <CardDescription>
              Os campos abaixo definem a abertura inicial do processo e a configuração da tramitação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-gray-900">Identificação</h2>
                <p className="text-sm text-gray-500">Escolha o tipo e registre o assunto principal.</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,240px)_1fr]">
                <div className="space-y-2">
                  <Label>Tipo de processo *</Label>
                  <Select value={form.typeId} onValueChange={handleTypeChange} disabled={loadingTypes || activeTypes.length === 0}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingTypes ? 'Carregando tipos...' : 'Selecione o tipo'} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.prefix})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assunto *</Label>
                  <Input
                    value={form.subject}
                    onChange={event => setForm(current => ({ ...current, subject: event.target.value }))}
                    placeholder="Ex: Solicitação de parecer jurídico sobre contrato"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
                  placeholder="Contextualize o processo com as informações que o próximo setor precisa entender."
                  rows={6}
                />
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-gray-900">Origem e prazo</h2>
                <p className="text-sm text-gray-500">Defina de onde o processo nasce e quando ele precisa de atenção.</p>
              </div>

              <OrganizationalUnitAutocomplete
                label="Setor de origem"
                value={form.originSectorName}
                onValueChange={value => setForm(current => ({
                  ...current,
                  originSectorName: value,
                  originSectorId: value,
                }))}
                onSelect={unit => setForm(current => ({
                  ...current,
                  originSectorId: unit.id,
                  originSectorName: unit.nome,
                }))}
                placeholder="Ex: Secretaria de Administração"
                required
                helperText="Selecione uma unidade do organograma ou mantenha um nome livre para processos legados."
              />

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Sigilo</Label>
                  <Select value={form.sigilo} onValueChange={value => setForm(current => ({ ...current, sigilo: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLICO">Público</SelectItem>
                      <SelectItem value="RESTRITO">Restrito</SelectItem>
                      <SelectItem value="CONFIDENCIAL">Confidencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={form.priority} onValueChange={value => setForm(current => ({ ...current, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Normal</SelectItem>
                      <SelectItem value="1">Urgente</SelectItem>
                      <SelectItem value="2">Urgentíssimo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prazo</Label>
                  <Input
                    type="datetime-local"
                    value={form.dueAt}
                    onChange={event => setForm(current => ({ ...current, dueAt: event.target.value }))}
                  />
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-gray-900">Classificação</h2>
                <p className="text-sm text-gray-500">Use tags para facilitar pesquisa, triagem e relatórios futuros.</p>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={form.tags}
                  onChange={event => setForm(current => ({ ...current, tags: event.target.value }))}
                  placeholder="Ex: contrato, jurídico, revisão"
                />
                <p className="text-xs text-gray-500">Separe por vírgula. As tags ajudam na busca e na organização posterior.</p>
              </div>
            </section>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Resumo da abertura</CardTitle>
              <CardDescription>Confirme o que será criado antes de salvar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <FilePlus2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedType ? `${selectedType.name} (${selectedType.prefix})` : 'Selecione um tipo de processo'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedType?.description || 'O tipo define prefixo, SLA padrão e automações iniciais.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">Setor de origem</p>
                    <p className="text-gray-500">{form.originSectorName || 'Não definido'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">Sigilo</p>
                    <p className="text-gray-500">{SIGILO_LABELS[form.sigilo] || form.sigilo}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Flag className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">Prioridade</p>
                    <p className="text-gray-500">{PRIORITY_LABELS[form.priority] || 'Normal'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">Prazo</p>
                    <p className="text-gray-500">{form.dueAt ? new Date(form.dueAt).toLocaleString('pt-BR') : 'Sem prazo definido'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">SLA do tipo</p>
                    <p className="text-gray-500">{formatSla(selectedType?.defaultSlaHours)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tags className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">Tags</p>
                    <p className="text-gray-500">{form.tags || 'Nenhuma tag informada'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Automação aplicada</CardTitle>
              <CardDescription>O sistema já pode iniciar parte do fluxo para você.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="rounded-lg border bg-gray-50 p-3">
                <div className="flex items-center gap-2 font-medium text-gray-800">
                  <GitBranch className="h-4 w-4 text-blue-600" />
                  Fluxo padrão
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedType?.defaultWorkflowTemplate
                    ? `O processo já nasce vinculado ao fluxo ${selectedType.defaultWorkflowTemplate.name}.`
                    : 'Este tipo não possui fluxo padrão configurado.'}
                </p>
              </div>

              <div className="rounded-lg border bg-gray-50 p-3">
                <div className="flex items-center gap-2 font-medium text-gray-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Template documental
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedType?.defaultDocumentTemplate
                    ? `Template sugerido: ${selectedType.defaultDocumentTemplate}.`
                    : 'Nenhum template padrão vinculado a este tipo.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Ações</CardTitle>
              <CardDescription>Conclua a abertura ou volte para a listagem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={handleSubmit} disabled={isSubmitDisabled}>
                {saving ? 'Criando processo...' : 'Criar processo'}
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/processos-internos">Cancelar</Link>
              </Button>
              <p className="text-xs text-gray-500">
                Após salvar, você volta para a listagem com o processo recém-criado pronto para conferência.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
