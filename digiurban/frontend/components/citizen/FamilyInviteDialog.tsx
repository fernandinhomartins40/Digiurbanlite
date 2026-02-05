'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, User, Phone } from 'lucide-react'
import { RELATIONSHIP_OPTIONS } from '@/shared/constants/family.constants'

interface FamilyInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  apiRequest: (url: string, options?: any) => Promise<any>
}

export function FamilyInviteDialog({
  open,
  onOpenChange,
  onSuccess,
  apiRequest
}: FamilyInviteDialogProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    cpf: '',
    phone: '',
    name: '',
    relationship: '',
    isDependent: false,
    message: '',
    monthlyIncome: '',
    occupation: '',
    education: '',
    hasDisability: false
  })

  // Resetar form ao abrir/fechar
  useEffect(() => {
    if (!open) {
      setFormData({
        email: '',
        cpf: '',
        phone: '',
        name: '',
        relationship: '',
        isDependent: false,
        message: '',
        monthlyIncome: '',
        occupation: '',
        education: '',
        hasDisability: false
      })
    }
  }, [open])

  // Validar email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Submeter formulário
  const handleSubmit = async () => {
    // Validações
    if (!formData.email || !isValidEmail(formData.email)) {
      toast({
        variant: 'destructive',
        title: 'Email inválido',
        description: 'Por favor, informe um email válido'
      })
      return
    }

    if (!formData.relationship) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'Selecione o relacionamento'
      })
      return
    }

    try {
      setSubmitting(true)

      const response = await apiRequest('/citizen/family/invites', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          cpf: formData.cpf || undefined,
          phone: formData.phone || undefined,
          name: formData.name || undefined,
          relationship: formData.relationship,
          isDependent: formData.isDependent,
          message: formData.message || undefined,
          monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : undefined,
          occupation: formData.occupation || undefined,
          education: formData.education || undefined,
          hasDisability: formData.hasDisability
        })
      })

      if (response.success) {
        toast({
          title: 'Convite enviado',
          description: `Um convite foi enviado para ${formData.email}. O convite expira em 30 dias.`
        })
        onSuccess()
        onOpenChange(false)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível enviar o convite'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convidar por Email</DialogTitle>
          <p className="text-sm text-gray-500">
            Envie um convite para um familiar que ainda não está cadastrado no sistema
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email do Familiar *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={submitting}
              className="mt-1"
            />
          </div>

          {/* Informações Opcionais do Convidado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome (Opcional)
              </Label>
              <Input
                id="name"
                placeholder="Nome do familiar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={submitting}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone (Opcional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={submitting}
                className="mt-1"
              />
            </div>
          </div>

          {/* Relacionamento */}
          <div>
            <Label htmlFor="relationship">Relacionamento *</Label>
            <Select
              value={formData.relationship}
              onValueChange={(value) => setFormData({ ...formData, relationship: value })}
              disabled={submitting}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o relacionamento" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_OPTIONS.map((rel) => (
                  <SelectItem key={rel.value} value={rel.value}>
                    {rel.emoji} {rel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dependente */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDependent"
              checked={formData.isDependent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDependent: checked as boolean })
              }
              disabled={submitting}
            />
            <Label htmlFor="isDependent" className="cursor-pointer">
              É dependente financeiro
            </Label>
          </div>

          {/* Mensagem Personalizada */}
          <div>
            <Label htmlFor="message">Mensagem Personalizada (Opcional)</Label>
            <Textarea
              id="message"
              placeholder="Adicione uma mensagem para acompanhar o convite..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              disabled={submitting}
              className="mt-1 min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.message.length}/500 caracteres
            </p>
          </div>

          {/* Informações Adicionais */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Informações Adicionais (Opcional)
            </h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="monthlyIncome">Renda Mensal Estimada (R$)</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1500.00"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                  disabled={submitting}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="occupation">Ocupação</Label>
                <Input
                  id="occupation"
                  placeholder="Ex: Estudante, Aposentado, etc."
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  disabled={submitting}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="education">Escolaridade</Label>
                <Select
                  value={formData.education}
                  onValueChange={(value) => setFormData({ ...formData, education: value })}
                  disabled={submitting}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione a escolaridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sem escolaridade">Sem escolaridade</SelectItem>
                    <SelectItem value="Ensino Fundamental Incompleto">Ensino Fundamental Incompleto</SelectItem>
                    <SelectItem value="Ensino Fundamental Completo">Ensino Fundamental Completo</SelectItem>
                    <SelectItem value="Ensino Médio Incompleto">Ensino Médio Incompleto</SelectItem>
                    <SelectItem value="Ensino Médio Completo">Ensino Médio Completo</SelectItem>
                    <SelectItem value="Ensino Superior Incompleto">Ensino Superior Incompleto</SelectItem>
                    <SelectItem value="Ensino Superior Completo">Ensino Superior Completo</SelectItem>
                    <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasDisability"
                  checked={formData.hasDisability}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, hasDisability: checked as boolean })
                  }
                  disabled={submitting}
                />
                <Label htmlFor="hasDisability" className="cursor-pointer">
                  Possui deficiência (PCD)
                </Label>
              </div>
            </div>
          </div>

          {/* Info sobre o convite */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Como funciona:</strong> Após enviar, o convidado receberá um email com um link para aceitar ou rejeitar o convite. O convite expira em 30 dias.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !formData.email || !formData.relationship}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Convite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
