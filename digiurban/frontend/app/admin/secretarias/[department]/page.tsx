'use client'

/**
 * Espaço da secretaria — página única para as 21 secretarias
 * (antes: 21 arquivos escritos à mão + esta página genérica).
 * O conteúdo vem do modelo SecretariaWorkspace; o que muda por secretaria
 * (nome, ícone, indicadores, apps) é configuração.
 */

import { Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getDepartmentConfig } from '@/lib/department-config'
import { SecretariaWorkspace } from '@/components/admin/secretaria/SecretariaWorkspace'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SecretariaPage() {
  const params = useParams()
  const router = useRouter()
  const config = getDepartmentConfig(params.department as string)

  if (!config) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card>
          <CardHeader>
            <CardTitle>Secretaria não encontrada</CardTitle>
            <CardDescription>O endereço &quot;{String(params.department)}&quot; não corresponde a nenhuma secretaria.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/admin')}>Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Suspense fallback={null}>
      <SecretariaWorkspace config={config} />
    </Suspense>
  )
}
