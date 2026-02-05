'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useCitizenAuth } from '@/contexts/CitizenAuthContext'
import {
  Mail,
  User,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight
} from 'lucide-react'
import { getRelationshipLabel, getRelationshipEmoji } from '@/shared/constants/family.constants'

interface InviteData {
  id: string
  email: string
  name?: string
  relationship: string
  message?: string
  head: {
    id: string
    name: string
    cpf: string
  }
  expiresAt: string
  status: string
}

export default function AcceptInvitePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { citizen, apiRequest } = useCitizenAuth()
  const isAuthenticated = !!citizen

  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInvite()
  }, [token])

  const loadInvite = async () => {
    try {
      setLoading(true)
      setError(null)

      // Endpoint público para visualizar convite
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/citizen/family/invites/${token}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao carregar convite')
      }

      if (data.success) {
        setInviteData(data.data.invite)
      } else {
        setError(data.message || 'Convite não encontrado')
      }
    } catch (error: any) {
      console.error('Erro ao carregar convite:', error)
      setError(error.message || 'Não foi possível carregar o convite')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login necessário',
        description: 'Você precisa estar logado para aceitar o convite'
      })
      router.push(`/cidadao/login?redirect=/convites/familia/${token}`)
      return
    }

    try {
      setProcessing(true)
      const response = await apiRequest('/citizen/family/invites/respond', {
        method: 'POST',
        body: JSON.stringify({
          token,
          accept: true
        })
      })

      if (response.success) {
        toast({
          title: 'Convite aceito!',
          description: 'Você foi adicionado à família com sucesso'
        })
        router.push('/cidadao/familia')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível aceitar o convite'
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    try {
      setProcessing(true)
      const response = await apiRequest('/citizen/family/invites/respond', {
        method: 'POST',
        body: JSON.stringify({
          token,
          accept: false,
          reason: rejectReason || 'Não especificado'
        })
      })

      if (response.success) {
        toast({
          title: 'Convite rejeitado',
          description: 'O convite foi rejeitado'
        })
        router.push('/cidadao')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível rejeitar o convite'
      })
    } finally {
      setProcessing(false)
    }
  }

  const isExpired = () => {
    if (!inviteData) return false
    return new Date(inviteData.expiresAt) < new Date()
  }

  const getDaysRemaining = () => {
    if (!inviteData) return 0
    const now = new Date()
    const expiry = new Date(inviteData.expiresAt)
    const diff = expiry.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Carregando convite...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error
  if (error || !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Convite não encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Este convite não existe, expirou ou já foi utilizado.'}
            </p>
            <Button onClick={() => router.push('/')}>
              Voltar para o Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Convite expirado
  if (isExpired() || inviteData.status !== 'PENDING') {
    const statusMessages: Record<string, string> = {
      ACCEPTED: 'Este convite já foi aceito',
      REJECTED: 'Este convite foi rejeitado',
      EXPIRED: 'Este convite expirou',
      CANCELLED: 'Este convite foi cancelado'
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-12 text-center">
            <Clock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Convite Indisponível
            </h2>
            <p className="text-gray-600 mb-6">
              {statusMessages[inviteData.status] || 'Este convite não está mais disponível'}
            </p>
            <Button onClick={() => router.push('/')}>
              Voltar para o Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-2xl">Convite para Composição Familiar</CardTitle>
              <p className="text-blue-100 text-sm mt-1">
                Você foi convidado para fazer parte de uma família
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Informações do Convite */}
          <div className="space-y-4">
            {/* Quem convidou */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <User className="h-6 w-6 text-blue-600 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-blue-600 font-medium">Convidado por:</p>
                  <p className="text-lg font-bold text-blue-900">{inviteData.head.name}</p>
                  <p className="text-sm text-blue-700">CPF: {inviteData.head.cpf}</p>
                </div>
              </div>
            </div>

            {/* Relacionamento */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{getRelationshipEmoji(inviteData.relationship)}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 font-medium">Você será cadastrado(a) como:</p>
                  <p className="text-xl font-bold text-gray-900">
                    {getRelationshipLabel(inviteData.relationship)}
                  </p>
                </div>
              </div>
            </div>

            {/* Email convidado */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="h-6 w-6 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 font-medium">Email do convite:</p>
                  <p className="text-lg text-gray-900">{inviteData.email}</p>
                  {inviteData.name && (
                    <p className="text-sm text-gray-600 mt-1">Nome: {inviteData.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Mensagem personalizada */}
            {inviteData.message && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700 font-medium mb-2">
                  Mensagem do remetente:
                </p>
                <p className="text-gray-700 italic">"{inviteData.message}"</p>
              </div>
            )}

            {/* Expiração */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className={`font-medium ${daysRemaining <= 3 ? 'text-orange-600' : 'text-gray-600'}`}>
                Este convite expira em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
              </span>
            </div>
          </div>

          {/* Ações */}
          {!showRejectForm ? (
            <div className="space-y-3">
              {!isAuthenticated && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    <strong>Atenção:</strong> Você precisa estar logado para aceitar este convite.
                    Se ainda não tem uma conta, será necessário criar uma.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAccept}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      {isAuthenticated ? 'Aceitar Convite' : 'Fazer Login e Aceitar'}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setShowRejectForm(true)}
                  disabled={processing}
                  variant="outline"
                  size="lg"
                  className="sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium mb-3">
                  Você está prestes a rejeitar este convite
                </p>

                <div>
                  <Label htmlFor="rejectReason" className="text-red-900">
                    Motivo da Rejeição (Opcional)
                  </Label>
                  <Textarea
                    id="rejectReason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explique o motivo da rejeição..."
                    className="mt-2 min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {rejectReason.length}/500 caracteres
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowRejectForm(false)
                    setRejectReason('')
                  }}
                  disabled={processing}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Rejeitando...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 mr-2" />
                      Confirmar Rejeição
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Ao aceitar este convite, você será adicionado à composição familiar de {inviteData.head.name}.
              Esta ação pode ser desfeita posteriormente se necessário.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
