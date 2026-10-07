'use client'

/**
 * Etiquetas no formulário do serviço:
 *  - "Ao concluir, o cidadão ganha": quais etiquetas o pedido concluído dá;
 *  - "Só para quem tem": o serviço só pode ser pedido por quem tem a etiqueta.
 * Dá para criar uma etiqueta nova aqui mesmo.
 */

import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { tagColorClass } from '@/lib/citizen-tags'

interface TagOption {
  id: string
  name: string
  color: string | null
  active: boolean
}

interface ServiceTagsFieldProps {
  tagIds: string[]
  requiredTagId: string | null
  onChange: (field: 'tagIds' | 'requiredTagId', value: any) => void
}

export function ServiceTagsField({ tagIds, requiredTagId, onChange }: ServiceTagsFieldProps) {
  const { apiRequest } = useAdminAuth()
  const [tags, setTags] = useState<TagOption[]>([])
  const [newTag, setNewTag] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const response = await apiRequest('/admin/citizen-tags')
      setTags(response?.data?.tags || [])
    } catch {
      setTags([])
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createTag = async () => {
    setError(null)
    const name = newTag.trim()
    if (name.length < 2) return
    try {
      setCreating(true)
      const response = await apiRequest('/admin/citizen-tags', { method: 'POST', body: JSON.stringify({ name }) })
      const id = response?.data?.tag?.id
      await load()
      if (id) onChange('tagIds', [...tagIds, id])
      setNewTag('')
    } catch (createError: any) {
      setError(createError?.message || 'Não foi possível criar a etiqueta')
    } finally {
      setCreating(false)
    }
  }

  const active = tags.filter((tag) => tag.active || tagIds.includes(tag.id) || tag.id === requiredTagId)
  const chosen = active.filter((tag) => tagIds.includes(tag.id))
  const available = active.filter((tag) => !tagIds.includes(tag.id))

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label>Ao concluir o pedido, o cidadão ganha a etiqueta</Label>
        <p className="text-xs text-gray-500">Ex.: quem conclui o cadastro de produtor vira "Produtor Rural". Aparece na ficha do cidadão.</p>
        <div className="flex flex-wrap gap-2">
          {chosen.length === 0 && <span className="text-sm text-gray-400">Nenhuma</span>}
          {chosen.map((tag) => (
            <span key={tag.id} className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium', tagColorClass(tag.color))}>
              {tag.name}
              <button type="button" aria-label={`Tirar ${tag.name}`} onClick={() => onChange('tagIds', tagIds.filter((id) => id !== tag.id))}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {available.length > 0 && (
            <select
              aria-label="Escolher etiqueta"
              value=""
              onChange={(e) => e.target.value && onChange('tagIds', [...tagIds, e.target.value])}
              className="h-10 rounded-md border border-input bg-background px-2 text-sm sm:w-64"
            >
              <option value="">Escolher etiqueta...</option>
              {available.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          )}
          <div className="flex flex-1 gap-2">
            <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Ou crie uma nova etiqueta" maxLength={60} />
            <Button type="button" variant="outline" onClick={createTag} disabled={creating || newTag.trim().length < 2}>
              <Plus className="mr-1 h-4 w-4" />
              Criar
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="requiredTag">Só pode pedir quem tem a etiqueta</Label>
        <p className="text-xs text-gray-500">Ex.: renovação de cadastro só para quem já é Produtor Rural. Vale no portal e no assistente.</p>
        <select
          id="requiredTag"
          value={requiredTagId || ''}
          onChange={(e) => onChange('requiredTagId', e.target.value || null)}
          className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm sm:w-64"
        >
          <option value="">Qualquer cidadão</option>
          {active.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
