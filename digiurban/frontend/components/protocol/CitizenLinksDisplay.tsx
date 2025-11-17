'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  UserCircle,
  UserPlus,
  Check,
  AlertCircle,
  Edit2,
  Trash2,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useCitizenLinks, CitizenLink } from '@/hooks/useCitizenLinks'
import { useToast } from '@/hooks/use-toast'

interface CitizenLinksDisplayProps {
  protocolId: string
  citizenLinks?: CitizenLink[]
  editable?: boolean
  onUpdate?: () => void
}

// Labels para os tipos de link
const LINK_TYPE_LABELS: Record<string, string> = {
  STUDENT: 'Aluno',
  GUARDIAN: 'Responsável Legal',
  PATIENT: 'Paciente',
  COMPANION: 'Acompanhante',
  DEPENDENT: 'Dependente',
  FAMILY_MEMBER: 'Membro da Família',
  AUTHORIZED_PERSON: 'Pessoa Autorizada',
  BENEFICIARY: 'Beneficiário',
  WITNESS: 'Testemunha',
  OTHER: 'Outro'
}

// Labels para os papéis
const ROLE_LABELS: Record<string, string> = {
  BENEFICIARY: 'Beneficiário',
  RESPONSIBLE: 'Responsável',
  AUTHORIZED: 'Autorizado',
  COMPANION: 'Acompanhante',
  WITNESS: 'Testemunha',
  OTHER: 'Outro'
}

export function CitizenLinksDisplay({
  protocolId,
  citizenLinks: initialLinks,
  editable = false,
  onUpdate
}: CitizenLinksDisplayProps) {
  const { toast } = useToast()
  const {
    links,
    loading,
    error,
    loadLinks,
    updateLink,
    verifyLink,
    removeLink
  } = useCitizenLinks({ protocolId })

  const [displayLinks, setDisplayLinks] = useState<CitizenLink[]>(initialLinks || [])
  const [editingLink, setEditingLink] = useState<CitizenLink | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Carregar links se não foram fornecidos
  useEffect(() => {
    if (!initialLinks && protocolId) {
      loadLinks(protocolId)
    }
  }, [protocolId, initialLinks])

  // Atualizar display quando links mudarem
  useEffect(() => {
    if (!initialLinks) {
      setDisplayLinks(links)
    } else {
      setDisplayLinks(initialLinks)
    }
  }, [links, initialLinks])

  /**
   * Formatar CPF para exibição
   */
  const formatCPF = (cpf: string): string => {
    if (!cpf) return ''
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length !== 11) return cpf
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  /**
   * Calcular idade a partir da data de nascimento
   */
  const calculateAge = (birthDate: string | undefined): string => {
    if (!birthDate) return '-'
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return `${age} anos`
  }

  /**
   * Formatar data para exibição
   */
  const formatDate = (date: string | undefined): string => {
    if (!date) return '-'
    try {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return '-'
    }
  }

  /**
   * Verificar vínculo manualmente
   */
  const handleVerifyLink = async (linkId: string) => {
    if (!linkId) return

    const result = await verifyLink(linkId, protocolId)
    if (result && onUpdate) {
      onUpdate()
    }
  }

  /**
   * Remover vínculo
   */
  const handleRemoveLink = async (linkId: string) => {
    if (!linkId) return

    if (!confirm('Tem certeza que deseja remover este vínculo?')) {
      return
    }

    const success = await removeLink(linkId, protocolId)
    if (success && onUpdate) {
      onUpdate()
    }
  }

  /**
   * Abrir diálogo de edição
   */
  const handleEditLink = (link: CitizenLink) => {
    setEditingLink(link)
    setEditDialogOpen(true)
  }

  /**
   * Salvar edição do vínculo
   */
  const handleSaveEdit = async () => {
    if (!editingLink?.id) return

    const result = await updateLink(editingLink.id, {
      linkType: editingLink.linkType,
      role: editingLink.role,
      contextData: editingLink.contextData
    }, protocolId)

    if (result) {
      setEditDialogOpen(false)
      setEditingLink(null)
      if (onUpdate) onUpdate()
    }
  }

  // Renderizar mensagem de carregamento
  if (loading && displayLinks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            Carregando vínculos de cidadãos...
          </div>
        </CardContent>
      </Card>
    )
  }

  // Renderizar mensagem de erro
  if (error && displayLinks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium mb-1">Erro ao carregar vínculos</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Renderizar mensagem quando não há links
  if (displayLinks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cidadãos Vinculados
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center">
            <UserCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm">
              Nenhum cidadão vinculado a este protocolo
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cidadãos Vinculados
            <Badge variant="secondary" className="ml-auto">
              {displayLinks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayLinks.map((link, index) => (
              <div
                key={link.id || index}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Ícone do cidadão */}
                  <div className="mt-1">
                    <UserCircle className="h-10 w-10 text-muted-foreground" />
                  </div>

                  {/* Informações do cidadão */}
                  <div className="flex-1 min-w-0">
                    {/* Nome e verificação */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-base truncate">
                        {link.linkedCitizen?.name || 'Nome não disponível'}
                      </h4>
                      {link.isVerified ? (
                        <Badge variant="default" className="gap-1 shrink-0 bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-3 w-3" />
                          Verificado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 shrink-0 bg-amber-100 text-amber-800 hover:bg-amber-200">
                          <XCircle className="h-3 w-3" />
                          Não Verificado
                        </Badge>
                      )}
                    </div>

                    {/* CPF e idade */}
                    <div className="text-sm text-muted-foreground mb-2">
                      {link.linkedCitizen?.cpf && (
                        <span>CPF: {formatCPF(link.linkedCitizen.cpf)}</span>
                      )}
                      {link.linkedCitizen?.birthDate && (
                        <span className="ml-3">
                          {calculateAge(link.linkedCitizen.birthDate)}
                        </span>
                      )}
                    </div>

                    {/* Badges de tipo e papel */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline">
                        {LINK_TYPE_LABELS[link.linkType] || link.linkType}
                      </Badge>
                      <Badge variant="outline">
                        {ROLE_LABELS[link.role] || link.role}
                      </Badge>
                      {link.relationship && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {link.relationship}
                        </Badge>
                      )}
                    </div>

                    {/* Context Data (informações adicionais) */}
                    {link.contextData && Object.keys(link.contextData).length > 0 && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
                        <p className="font-medium text-muted-foreground mb-1">
                          Informações Adicionais:
                        </p>
                        {Object.entries(link.contextData).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Informações de verificação */}
                    {link.isVerified && link.verifiedAt && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Verificado em {formatDate(link.verifiedAt)}
                        {link.verifiedBy && ` por ${link.verifiedBy}`}
                      </div>
                    )}

                    {/* Contato */}
                    {(link.linkedCitizen?.email || link.linkedCitizen?.phone) && (
                      <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                        {link.linkedCitizen.email && (
                          <div>Email: {link.linkedCitizen.email}</div>
                        )}
                        {link.linkedCitizen.phone && (
                          <div>Telefone: {link.linkedCitizen.phone}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ações (se editável) */}
                  {editable && link.id && (
                    <div className="flex flex-col gap-1 shrink-0">
                      {!link.isVerified && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerifyLink(link.id!)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Verificar vínculo"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditLink(link)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Editar vínculo"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLink(link.id!)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Remover vínculo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Vínculo de Cidadão</DialogTitle>
          </DialogHeader>
          {editingLink && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Cidadão</Label>
                <Input
                  value={editingLink.linkedCitizen?.name || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="linkType">Tipo de Vínculo</Label>
                <Select
                  value={editingLink.linkType}
                  onValueChange={(value) =>
                    setEditingLink({ ...editingLink, linkType: value })
                  }
                >
                  <SelectTrigger id="linkType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LINK_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role">Papel</Label>
                <Select
                  value={editingLink.role}
                  onValueChange={(value) =>
                    setEditingLink({ ...editingLink, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false)
                    setEditingLink(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
