'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { ActivationStepList } from '@/components/admin/activation/ActivationStepList'
import { useActivation } from '@/components/admin/activation/useActivation'

export default function PrimeirosPassosPage() {
  const { user } = useAdminAuth()
  const { isAdmin } = useAdminPermissions()
  const admin = isAdmin()
  const { data, isLoading, isError } = useActivation(admin)

  if (user && !admin) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <p className="text-muted-foreground">Esta tela é só para o administrador do sistema.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Primeiros passos</h1>
        <p className="text-muted-foreground">O que falta para a prefeitura começar a atender pelo DigiUrban.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {data ? (data.completo ? 'Tudo pronto!' : `${data.feitos} de ${data.total} passos feitos`) : 'Seu progresso'}
          </CardTitle>
          {data?.completo && <CardDescription>A prefeitura já está pronta para atender. Bom trabalho!</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading || !data ? (
            isError ? (
              <p className="text-sm text-destructive">Não foi possível carregar os passos. Tente de novo em instantes.</p>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-2 w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            )
          ) : (
            <>
              <Progress value={data.percentual} className="h-2" />
              <ActivationStepList steps={data.steps} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
