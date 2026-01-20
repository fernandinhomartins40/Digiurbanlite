'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import {
  Upload,
  FileText,
  Copy,
  Send,
  CreditCard,
  CheckCircle,
  AlertCircle,
  QrCode,
  Info
} from 'lucide-react'

interface ProtocolPaymentTabProps {
  protocolId: string
  protocolNumber: string
  citizenEmail?: string
  citizenName?: string
  onRefresh?: () => void
}

export function ProtocolPaymentTab({
  protocolId,
  protocolNumber,
  citizenEmail,
  citizenName,
  onRefresh
}: ProtocolPaymentTabProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  // Estados
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [pixKey, setPixKey] = useState('')
  const [pixQRCode, setPixQRCode] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)

  // Handler de seleção de arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Tipo de arquivo inválido',
          description: 'Por favor, selecione um arquivo PDF',
          variant: 'destructive'
        })
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 10MB',
          variant: 'destructive'
        })
        return
      }
      setPaymentFile(file)
    }
  }

  // Upload da guia de pagamento
  const handleUploadPaymentSlip = async () => {
    if (!paymentFile) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione uma guia de pagamento em PDF',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsUploading(true)

      const formData = new FormData()
      formData.append('file', paymentFile)
      formData.append('documentType', 'Guia de Pagamento')
      formData.append('category', 'PAYMENT_SLIP')

      const response = await apiRequest(`/protocols/${protocolId}/generated-documents`, {
        method: 'POST',
        body: formData,
        headers: {} // Remove Content-Type para FormData
      })

      if (response.success) {
        setUploadedFileUrl(response.data.fileUrl)
        toast({
          title: 'Guia enviada com sucesso',
          description: 'A guia de pagamento foi anexada ao protocolo'
        })
        onRefresh?.()
      }
    } catch (error) {
      toast({
        title: 'Erro ao enviar guia',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Copiar chave PIX
  const handleCopyPixKey = () => {
    if (!pixKey) return
    navigator.clipboard.writeText(pixKey)
    toast({
      title: 'Chave PIX copiada',
      description: 'A chave PIX foi copiada para a área de transferência'
    })
  }

  // Enviar informações de pagamento ao cidadão
  const handleSendPaymentInfo = async () => {
    if (!uploadedFileUrl && !pixKey && !pixQRCode) {
      toast({
        title: 'Nenhuma informação de pagamento',
        description: 'Por favor, faça upload da guia ou forneça chave PIX',
        variant: 'destructive'
      })
      return
    }

    if (!citizenEmail) {
      toast({
        title: 'Email não disponível',
        description: 'O cidadão não possui email cadastrado',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSending(true)

      const payload = {
        recipientEmail: citizenEmail,
        recipientName: citizenName,
        subject: `Informações de Pagamento - Protocolo ${protocolNumber}`,
        message: paymentNotes || `Prezado(a) ${citizenName},\n\nSeguem as informações para pagamento do protocolo ${protocolNumber}.`,
        paymentFileUrl: uploadedFileUrl,
        pixKey: pixKey || undefined,
        pixQRCode: pixQRCode || undefined
      }

      const response = await apiRequest(`/protocols/${protocolId}/send-payment-info`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      if (response.success) {
        toast({
          title: 'Informações enviadas',
          description: `Email enviado para ${citizenEmail}`
        })

        // Limpar formulário
        setPaymentFile(null)
        setPixKey('')
        setPixQRCode('')
        setPaymentNotes('')
        setUploadedFileUrl(null)

        onRefresh?.()
      }
    } catch (error) {
      toast({
        title: 'Erro ao enviar informações',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com informações */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Faça upload da guia de pagamento em PDF ou forneça a chave PIX para que o cidadão possa realizar o pagamento.
          {!citizenEmail && (
            <span className="text-yellow-600 font-medium ml-2">
              ⚠️ Cidadão sem email cadastrado - não será possível enviar automaticamente.
            </span>
          )}
        </AlertDescription>
      </Alert>

      {/* Card de Upload de Guia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Guia de Pagamento (PDF)
          </CardTitle>
          <CardDescription>
            Faça upload da guia de pagamento gerada pelo sistema da prefeitura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-file">Arquivo PDF da Guia</Label>
            <div className="flex gap-2">
              <Input
                id="payment-file"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button
                onClick={handleUploadPaymentSlip}
                disabled={!paymentFile || isUploading}
                className="whitespace-nowrap"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Anexar Guia
                  </>
                )}
              </Button>
            </div>
            {paymentFile && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {paymentFile.name} ({(paymentFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
            {uploadedFileUrl && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Guia anexada com sucesso! Você pode enviá-la ao cidadão abaixo.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card de Chave PIX */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Chave PIX (Opcional)
          </CardTitle>
          <CardDescription>
            Forneça uma chave PIX aleatória se disponível para pagamento via PIX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pix-key">Chave PIX Aleatória</Label>
            <div className="flex gap-2">
              <Input
                id="pix-key"
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Ex: 123e4567-e89b-12d3-a456-426614174000"
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={handleCopyPixKey}
                disabled={!pixKey}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Forneça uma chave PIX aleatória gerada pelo sistema de pagamentos da prefeitura
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix-qrcode">QR Code PIX (Opcional)</Label>
            <div className="flex gap-2">
              <Textarea
                id="pix-qrcode"
                value={pixQRCode}
                onChange={(e) => setPixQRCode(e.target.value)}
                placeholder="Cole aqui o código do QR Code PIX (Pix Copia e Cola)"
                className="flex-1 font-mono text-xs"
                rows={3}
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (pixQRCode) {
                    navigator.clipboard.writeText(pixQRCode)
                    toast({ title: 'QR Code copiado' })
                  }
                }}
                disabled={!pixQRCode}
                className="self-start"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cole o código "Pix Copia e Cola" que o cidadão poderá usar em qualquer app bancário
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card de Envio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar ao Cidadão
          </CardTitle>
          <CardDescription>
            Envie as informações de pagamento para o email do cidadão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-notes">Mensagem Adicional (Opcional)</Label>
            <Textarea
              id="payment-notes"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder={`Prezado(a) ${citizenName || 'cidadão(ã)'},\n\nSeguem as informações para pagamento do protocolo ${protocolNumber}.\n\nVocê pode pagar através da guia em anexo ou via PIX usando a chave fornecida.`}
              rows={5}
            />
          </div>

          {citizenEmail && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Email de destino:</strong> {citizenEmail}
              </p>
            </div>
          )}

          <Button
            onClick={handleSendPaymentInfo}
            disabled={(!uploadedFileUrl && !pixKey && !pixQRCode) || !citizenEmail || isSending}
            className="w-full"
            size="lg"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Informações de Pagamento
              </>
            )}
          </Button>

          {!citizenEmail && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Não é possível enviar automaticamente pois o cidadão não possui email cadastrado.
                Você pode salvar as informações aqui para referência futura.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
