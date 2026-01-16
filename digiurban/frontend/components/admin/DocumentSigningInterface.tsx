'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, FileSignature, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface DocumentSigningInterfaceProps {
  documentId: string
  onSignSuccess?: () => void
}

export function DocumentSigningInterface({ documentId, onSignSuccess }: DocumentSigningInterfaceProps) {
  const [signing, setSigning] = useState(false)
  const [certificate, setCertificate] = useState<any>(null)

  const handleSign = async () => {
    setSigning(true)

    try {
      const pin = prompt('Digite o PIN do certificado:')
      if (!pin) {
        setSigning(false)
        return
      }

      const privateKey = localStorage.getItem(`cert_private_key_${certificate?.id}`)
      if (!privateKey) {
        toast.error('Chave privada não encontrada')
        setSigning(false)
        return
      }

      const response = await fetch('/api/certificates/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          certificateId: certificate.id,
          privateKey,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Documento assinado com sucesso!')
        onSignSuccess?.()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Erro ao assinar documento')
    } finally {
      setSigning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Assinatura Digital
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-900">
                <p className="font-medium mb-1">Assinatura Digital Oficial</p>
                <p>Ao assinar este documento, você declara ciência do conteúdo e assume responsabilidade legal.</p>
              </div>
            </div>
          </div>

          <Button onClick={handleSign} disabled={signing || !certificate} className="w-full" size="lg">
            {signing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Assinando...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Assinar Documento
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
