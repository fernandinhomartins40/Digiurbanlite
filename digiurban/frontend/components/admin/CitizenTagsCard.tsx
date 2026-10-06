'use client'

/** Etiquetas do cidadão na ficha: mostra as que ele tem e deixa colocar/tirar à mão. */

import { useEffect, useState } from 'react'
import { Loader2, Tag, X } from 'lucide-react'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { tagColorClass } from '@/lib/citizen-tags'

interface CitizenTagItem {
  id: string
  name: string
  color: string | null
  since: string
  source: 'AUTO' | 'MANUAL'
  protocol: { id: string; number: string } | null
}

export function CitizenTagsCard({ citizenId }: { citizenId: string }) {
  const { apiRequest } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()
  const { toast } = useToast()
  const canEdit = hasPermission('citizens:update')

  const [tags, setTags] = useState<CitizenTagItem[]>([])
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string; active: boolean }>>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const response = await apiRequest(`/admin/citizen-tags/citizen/${citizenId}`)
      setTags(response?.data?.tags || [])
    } catch {
      setTags([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    apiRequest('/admin/citizen-tags')
      .then((response: any) => setAllTags(response?.data?.tags || []))
      .catch(() => setAllTags([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citizenId])

  const add = async (tagId: string) => {
    try {
      setBusy(true)
      await apiRequest(`/admin/citizen-tags/citizen/${citizenId}`, { method: 'POST', body: JSON.stringify({ tagId }) })
      await load()
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível colocar a etiqueta' })
    } finally {
      setBusy(false)
    }
  }

  const remove = async (tag: CitizenTagItem) => {
    if (!window.confirm(`Tirar a etiqueta "${tag.name}" deste cidadão?`)) return
    try {
      setBusy(true)
      await apiRequest(`/admin/citizen-tags/citizen/${citizenId}/${tag.id}`, { method: 'DELETE' })
      await load()
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível tirar a etiqueta' })
    } finally {
      setBusy(false)
    }
  }

  const available = allTags.filter((tag) => tag.active && !tags.some((mine) => mine.id === tag.id))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Etiquetas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        ) : tags.length === 0 ? (
          <p className="text-sm text-gray-500">Este cidadão ainda não tem etiquetas.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                title={
                  tag.protocol
                    ? `Ganhou pelo pedido nº ${tag.protocol.number}, em ${new Date(tag.since).toLocaleDateString('pt-BR')}`
                    : `Colocada por um servidor em ${new Date(tag.since).toLocaleDateString('pt-BR')}`
                }
                className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium', tagColorClass(tag.color))}
              >
                {tag.name}
                {canEdit && (
                  <button type="button" onClick={() => remove(tag)} disabled={busy} aria-label={`Tirar ${tag.name}`} className="opacity-60 hover:opacity-100">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
        {canEdit && available.length > 0 && (
          <Select value="" onValueChange={add} disabled={busy}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Colocar etiqueta..." />
            </SelectTrigger>
            <SelectContent>
              {available.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  )
}
