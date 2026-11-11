'use client'

import Link from 'next/link'
import { Rocket, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAdminPermissions } from '@/contexts/AdminAuthContext'
import { ActivationStepList } from './ActivationStepList'
import { useActivation, useDismissedCards } from './useActivation'

/**
 * Cartão "Primeiros passos" do Início. Aparece só para administrador, enquanto
 * faltar passo e se não foi dispensado — basta montar `<ActivationCard />`.
 */
export function ActivationCard() {
  const { isAdmin } = useAdminPermissions()
  const admin = isAdmin()
  const { dismissed, dismiss } = useDismissedCards()
  const { data } = useActivation(admin)

  if (!admin || !data || !dismissed || data.completo || dismissed.includes('activation')) return null

  const pending = data.steps.filter((s) => !s.feito).slice(0, 3)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="flex items-start gap-3">
          <Rocket className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <CardTitle className="text-lg">Deixe a prefeitura pronta</CardTitle>
            <CardDescription>
              {data.feitos} de {data.total} passos feitos
            </CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Dispensar" title="Não mostrar mais" onClick={() => dismiss('activation')}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={data.percentual} className="h-2" />
        <ActivationStepList steps={pending} />
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/admin/primeiros-passos">Ver todos os passos</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
