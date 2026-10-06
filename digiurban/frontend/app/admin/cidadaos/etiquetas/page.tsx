'use client'

/**
 * Etiquetas do cidadão ("Produtor Rural", "Beneficiário do Bolsa-Aluguel"...).
 * O servidor cria a etiqueta e escolhe, numa lista, os serviços que dão a
 * etiqueta quando o pedido é concluído. Também dá para colocar à mão na ficha.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Pencil, Plus, Search, Tag, Trash2, Users } from 'lucide-react'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { TAG_COLORS, tagColorClass } from '@/lib/citizen-tags'

interface CitizenTag {
  id: string
  name: string
  description: string | null
  color: string | null
  active: boolean
  citizens: number
  services: Array<{ id: string; name: string }>
}

interface ServiceOption {
  id: string
  name: string
  department?: { name?: string } | null
}

const EMPTY = { id: '', name: '', description: '', color: 'blue', serviceIds: [] as string[] }

export default function EtiquetasPage() {
  const { user, apiRequest } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()
  const { toast } = useToast()
  const canEdit = hasPermission('citizens:update')

  const [tags, setTags] = useState<CitizenTag[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<typeof EMPTY | null>(null)
  const [serviceSearch, setServiceSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/admin/citizen-tags')
      setTags(response?.data?.tags || [])
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as etiquetas' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    void load()
    apiRequest('/api/services')
      .then((response: any) => setServices(response?.data || response?.services || []))
      .catch(() => setServices([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const shownServices = useMemo(() => {
    const term = serviceSearch.trim().toLowerCase()
    const list = term ? services.filter((service) => service.name.toLowerCase().includes(term)) : services
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [services, serviceSearch])

  const openEdit = (tag: CitizenTag) => {
    setServiceSearch('')
    setForm({
      id: tag.id,
      name: tag.name,
      description: tag.description || '',
      color: tag.color || 'blue',
      serviceIds: tag.services.map((service) => service.id),
    })
  }

  const save = async () => {
    if (!form) return
    if (form.name.trim().length < 2) {
      toast({ variant: 'destructive', title: 'Falta o nome', description: 'Dê um nome para a etiqueta.' })
      return
    }
    try {
      setSaving(true)
      const body = JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim(),
        color: form.color,
        serviceIds: form.serviceIds,
      })
      const response = form.id
        ? await apiRequest(`/admin/citizen-tags/${form.id}`, { method: 'PUT', body })
        : await apiRequest('/admin/citizen-tags', { method: 'POST', body })
      if (response?.success === false) throw new Error(response.error)
      toast({ title: form.id ? 'Etiqueta salva' : 'Etiqueta criada' })
      setForm(null)
      await load()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Não foi possível salvar', description: error?.message || 'Tente de novo.' })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (tag: CitizenTag) => {
    try {
      await apiRequest(`/admin/citizen-tags/${tag.id}`, { method: 'PUT', body: JSON.stringify({ active: !tag.active }) })
      await load()
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível alterar a etiqueta' })
    }
  }

  const remove = async (tag: CitizenTag) => {
    if (!window.confirm(`Apagar a etiqueta "${tag.name}"?`)) return
    try {
      const response = await apiRequest(`/admin/citizen-tags/${tag.id}`, { method: 'DELETE' })
      toast({ title: response?.message || 'Etiqueta apagada' })
      await load()
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível apagar a etiqueta' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etiquetas do cidadão</h1>
          <p className="mt-1 text-sm text-gray-600">
            Uma etiqueta marca o cidadão (ex.: Produtor Rural). Ele ganha sozinho quando um pedido dos serviços escolhidos é concluído.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => { setServiceSearch(''); setForm({ ...EMPTY }) }}>
            <Plus className="mr-2 h-4 w-4" />
            Nova etiqueta
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : tags.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-900">Nenhuma etiqueta ainda</p>
            <p className="mt-1 text-sm text-gray-600">Crie a primeira e escolha os serviços que dão a etiqueta.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tags.map((tag) => (
            <Card key={tag.id} className={cn(!tag.active && 'opacity-60')}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className={cn('rounded-full px-3 py-1 text-sm font-medium', tagColorClass(tag.color))}>{tag.name}</span>
                  {canEdit && (
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tag)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => remove(tag)} aria-label="Apagar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {tag.description && <p className="text-sm text-gray-600">{tag.description}</p>}
                <p className="text-xs text-gray-500">
                  {tag.services.length === 0
                    ? 'Nenhum serviço ligado: só é colocada à mão, na ficha do cidadão.'
                    : `Ganha ao concluir: ${tag.services.map((service) => service.name).join(', ')}`}
                </p>
                <div className="flex items-center justify-between border-t pt-3 text-sm">
                  <Link href={`/admin/cidadaos?etiqueta=${tag.id}`} className="inline-flex items-center gap-1.5 text-blue-700 hover:underline">
                    <Users className="h-4 w-4" />
                    {tag.citizens} cidadão{tag.citizens === 1 ? '' : 's'}
                  </Link>
                  {canEdit && (
                    <button type="button" className="text-gray-500 hover:text-gray-900" onClick={() => toggleActive(tag)}>
                      {tag.active ? 'Desligar' : 'Ligar de novo'}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form?.id ? 'Editar etiqueta' : 'Nova etiqueta'}</DialogTitle>
            <DialogDescription>Escolha o nome e os serviços que dão esta etiqueta ao cidadão.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="tag-name">Nome</Label>
                <Input id="tag-name" maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Produtor Rural" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tag-description">Para que serve (opcional)</Label>
                <Textarea id="tag-description" rows={2} maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={color}
                      onClick={() => setForm({ ...form, color })}
                      className={cn('h-7 w-7 rounded-full border-2', tagColorClass(color), form.color === color ? 'border-gray-900' : 'border-transparent')}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Serviços que dão a etiqueta ({form.serviceIds.length})</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input className="pl-8" placeholder="Buscar serviço..." value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} />
                </div>
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                  {shownServices.length === 0 && <p className="p-2 text-sm text-gray-500">Nenhum serviço encontrado.</p>}
                  {shownServices.map((service) => {
                    const checked = form.serviceIds.includes(service.id)
                    return (
                      <label key={service.id} className="flex cursor-pointer items-start gap-2 rounded p-1.5 text-sm hover:bg-gray-50">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() =>
                            setForm({
                              ...form,
                              serviceIds: checked ? form.serviceIds.filter((id) => id !== service.id) : [...form.serviceIds, service.id],
                            })
                          }
                          className="mt-0.5"
                        />
                        <span>
                          {service.name}
                          {service.department?.name && <span className="block text-xs text-gray-500">{service.department.name}</span>}
                        </span>
                      </label>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500">Sem serviço marcado, a etiqueta só é colocada à mão na ficha do cidadão.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)} disabled={saving}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
