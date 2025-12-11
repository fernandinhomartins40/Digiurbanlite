'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, FileText, Users, Award, Calendar, ArrowLeft, Phone, Mail, MapPin, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getFullApiUrl } from '@/lib/api-config'

interface Protocol {
  id: string
  number: string
  title: string
  status: string
  createdAt: string
  concludedAt?: string
  service?: { name: string; category?: string }
  department?: { name: string }
}

interface FamilyMember {
  id: string
  member: {
    id: string
    name: string
    cpf: string
    relationship?: string
  }
  relationship: string
  isDependent: boolean
}

interface TimelineEvent {
  date: string
  event: string
  type: string
  metadata: any
}

interface CitizenData {
  id: string
  name: string
  cpf: string
  email: string
  phone?: string
  birthDate?: string
  address?: any
  verificationStatus: 'PENDING' | 'VERIFIED' | 'GOLD' | 'REJECTED'
  createdAt: string
  verifiedAt?: string
}

export default function CitizenHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const [citizen, setCitizen] = useState<CitizenData | null>(null)
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [family, setFamily] = useState<FamilyMember[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCitizenData()
  }, [params.id])

  const loadCitizenData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        getFullApiUrl(`/api/admin/gabinete/painel-prefeito/citizens/${params.id}/complete-history`),
        { credentials: 'include' }
      )
      const data = await response.json()

      if (data.success) {
        setCitizen(data.data.citizen)
        setProtocols(data.data.protocols || [])
        setFamily(data.data.family || [])
        setTimeline(data.data.timeline || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados do cidadão:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVerificationBadge = (status: CitizenData['verificationStatus']) => {
    switch (status) {
      case 'GOLD':
        return { label: 'Cidadão Ouro', variant: 'default' as const, icon: '⭐', color: 'text-yellow-600' }
      case 'VERIFIED':
        return { label: 'Cidadão Prata', variant: 'secondary' as const, icon: '🥈', color: 'text-gray-600' }
      case 'PENDING':
        return { label: 'Cidadão Bronze', variant: 'outline' as const, icon: '🥉', color: 'text-orange-600' }
      case 'REJECTED':
        return { label: 'Rejeitado', variant: 'destructive' as const, icon: '❌', color: 'text-red-600' }
    }
  }

  const statusColors: Record<string, string> = {
    VINCULADO: 'bg-blue-100 text-blue-800',
    PROGRESSO: 'bg-yellow-100 text-yellow-800',
    ATUALIZACAO: 'bg-orange-100 text-orange-800',
    CONCLUIDO: 'bg-green-100 text-green-800',
    PENDENCIA: 'bg-red-100 text-red-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (!citizen) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cidadão não encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    )
  }

  const badge = getVerificationBadge(citizen.verificationStatus)
  const completedProtocols = protocols.filter(p => p.status === 'CONCLUIDO')
  const activeProtocols = protocols.filter(p => p.status !== 'CONCLUIDO' && p.status !== 'CANCELADO')

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar ao Painel
      </Button>

      {/* Cabeçalho do Cidadão */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-4xl font-bold shadow-lg">
                {citizen.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-3xl mb-2">{citizen.name}</CardTitle>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>CPF: {formatCPF(citizen.cpf)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{citizen.email}</span>
                  </div>
                  {citizen.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{citizen.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={badge.variant} className="text-lg px-4 py-2 mb-2">
                {badge.icon} {badge.label}
              </Badge>
              <p className="text-sm text-gray-500">
                <Clock className="h-4 w-4 inline mr-1" />
                Cadastrado em {formatDate(citizen.createdAt)}
              </p>
              {citizen.verifiedAt && (
                <p className="text-sm text-gray-500">
                  Verificado em {formatDate(citizen.verifiedAt)}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Protocolos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-10 w-10 text-blue-600" />
              <span className="text-4xl font-bold text-blue-600">{protocols.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-10 w-10 text-green-600" />
              <span className="text-4xl font-bold text-green-600">{completedProtocols.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-10 w-10 text-orange-600" />
              <span className="text-4xl font-bold text-orange-600">{activeProtocols.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Membros da Família</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-10 w-10 text-purple-600" />
              <span className="text-4xl font-bold text-purple-600">{family.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Conteúdo */}
      <Tabs defaultValue="protocols" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="protocols">Histórico de Protocolos</TabsTrigger>
          <TabsTrigger value="family">Composição Familiar</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
        </TabsList>

        {/* Aba de Protocolos */}
        <TabsContent value="protocols" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Protocolos ({protocols.length})</CardTitle>
              <CardDescription>
                {completedProtocols.length} concluídos • {activeProtocols.length} em andamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {protocols.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum protocolo encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {protocols.map((protocol) => (
                    <div key={protocol.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <a
                              href={`/admin/protocolos?search=${protocol.number}`}
                              className="font-medium text-lg text-blue-600 hover:underline"
                            >
                              #{protocol.number}
                            </a>
                            <Badge variant="secondary" className={statusColors[protocol.status]}>
                              {protocol.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">{protocol.title}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>
                              <strong>Serviço:</strong> {protocol.service?.name || 'N/A'}
                            </span>
                            <span>
                              <strong>Setor:</strong> {protocol.department?.name || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>Criado: {formatDate(protocol.createdAt)}</p>
                          {protocol.concludedAt && (
                            <p className="text-green-600 font-medium">
                              Concluído: {formatDate(protocol.concludedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Família */}
        <TabsContent value="family">
          <Card>
            <CardHeader>
              <CardTitle>Composição Familiar</CardTitle>
              <CardDescription>
                Membros da família cadastrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {family.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum membro familiar cadastrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {family.map((member) => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.member.name}</p>
                            <p className="text-sm text-gray-500">CPF: {formatCPF(member.member.cpf)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{member.relationship}</Badge>
                          {member.isDependent && (
                            <p className="text-xs text-gray-500 mt-1">Dependente</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Linha do Tempo</CardTitle>
              <CardDescription>
                Histórico cronológico de eventos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum evento registrado</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Linha vertical */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  <div className="space-y-6">
                    {timeline.map((event, index) => (
                      <div key={index} className="relative pl-10">
                        {/* Ponto na timeline */}
                        <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white ${
                          event.type === 'PROTOCOL_COMPLETED' ? 'bg-green-500' :
                          event.type === 'PROTOCOL_CREATED' ? 'bg-blue-500' :
                          event.type === 'VERIFICATION' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}></div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="font-medium text-gray-900">{event.event}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(event.date)}
                          </p>
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              {event.metadata.protocolNumber && (
                                <span className="mr-3">Protocolo: #{event.metadata.protocolNumber}</span>
                              )}
                              {event.metadata.service && (
                                <span>Serviço: {event.metadata.service}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
