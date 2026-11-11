'use client'

/**
 * Liga/desliga a página pública "Prefeitura em números" (desligada por padrão).
 * Gerente vê; só o administrador muda.
 */

import { useEffect, useState } from 'react'
import { BarChart3, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'

export function CityNumbersToggle() {
  const { apiRequest } = useAdminAuth()
  const { hasMinRole } = useAdminPermissions()
  const canEdit = hasMinRole('ADMIN')
  const { toast } = useToast()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiRequest('/admin/city-numbers/settings')
      .then((data: any) => setEnabled(!!data.enabled))
      .catch(() => setEnabled(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const change = async (value: boolean) => {
    setSaving(true)
    try {
      const data = await apiRequest('/admin/city-numbers/settings', { method: 'PUT', body: JSON.stringify({ enabled: value }) })
      setEnabled(!!data.enabled)
      toast({ title: value ? 'Página publicada' : 'Página tirada do ar' })
    } catch (error: any) {
      toast({ title: 'Não foi possível salvar', description: error?.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (enabled === null) return null

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5" /> Prefeitura em números
        </CardTitle>
        <CardDescription>
          Página aberta a qualquer pessoa, sem login, com os números da prefeitura: pedidos recebidos e resolvidos no mês, tempo médio de
          resposta, nota dos cidadãos e serviços mais pedidos. Nenhum nome aparece.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Switch id="city-numbers" checked={enabled} onCheckedChange={change} disabled={!canEdit || saving} />
          <Label htmlFor="city-numbers">{enabled ? 'Publicada' : 'Desligada'}</Label>
        </div>
        {enabled && (
          <a href="/prefeitura-em-numeros" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline">
            Ver a página <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </CardContent>
    </Card>
  )
}

export default CityNumbersToggle
