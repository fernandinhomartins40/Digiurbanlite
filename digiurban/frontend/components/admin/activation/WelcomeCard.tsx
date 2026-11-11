'use client'

import { Hand, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { useDismissedCards } from './useActivation'

/**
 * Boas-vindas do servidor no Início: 3 frases, até a pessoa dispensar.
 * Não aparece para administrador (ele vê o cartão de primeiros passos).
 */
export function WelcomeCard() {
  const { user } = useAdminAuth()
  const { isAdmin } = useAdminPermissions()
  const { dismissed, dismiss } = useDismissedCards()

  if (!user || isAdmin() || !dismissed || dismissed.includes('welcome')) return null

  const firstName = user.name?.split(' ')[0]

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Hand className="h-5 w-5 shrink-0 text-primary" />
          <CardTitle className="text-lg">Boas-vindas{firstName ? `, ${firstName}` : ''}!</CardTitle>
        </div>
        <Button variant="ghost" size="icon" aria-label="Dispensar" title="Entendi, não mostrar mais" onClick={() => dismiss('welcome')}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm text-muted-foreground">
        <p>Esta é a sua mesa: aqui aparece tudo o que está esperando por você, do mais urgente para o menos urgente.</p>
        <p>
          Para achar qualquer tela, pessoa ou pedido, aperte <kbd className="rounded border px-1 text-xs">Ctrl</kbd>+
          <kbd className="rounded border px-1 text-xs">K</kbd> ou toque na lupa.
        </p>
        <p>Na barra de baixo ficam os seus atalhos: fixe nela as telas que você mais usa.</p>
        <div className="pt-2">
          <Button size="sm" onClick={() => dismiss('welcome')}>
            Entendi
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
