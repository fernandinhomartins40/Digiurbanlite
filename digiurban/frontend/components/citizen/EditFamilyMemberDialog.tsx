'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface FamilyMember {
  id: string
  relationship: string
  isDependent: boolean
  monthlyIncome?: number | null
  occupation?: string | null
  education?: string | null
  hasDisability?: boolean | null
  member: {
    id: string
    name: string
    cpf: string
    birthDate?: string
  }
}

interface EditFamilyMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: FamilyMember | null
  onSuccess: () => void
  apiRequest: (url: string, options?: any) => Promise<any>
}

export function EditFamilyMemberDialog({
  open,
  onOpenChange,
  member,
  onSuccess,
  apiRequest
}: EditFamilyMemberDialogProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    isDependent: false,
    monthlyIncome: '',
    occupation: '',
    education: '',
    hasDisability: false
  })

  // Carregar dados do membro quando o dialog abrir
  useEffect(() => {
    if (open && member) {
      setFormData({
        isDependent: member.isDependent,
        monthlyIncome: member.monthlyIncome?.toString() || '',
        occupation: member.occupation || '',
        education: member.education || '',
        hasDisability: member.hasDisability || false
      })
    }
  }, [open, member])

  // Calcular idade
  const calculateAge = (birthDate?: string): string => {
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

  // Submeter formulário
  const handleSubmit = async () => {
    if (!member) return

    try {
      setSubmitting(true)

      const response = await apiRequest(`/citizen/family/members/${member.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isDependent: formData.isDependent,
          monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : undefined,
          occupation: formData.occupation || undefined,
          education: formData.education || undefined,
          hasDisability: formData.hasDisability
        })
      })

      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Informações do membro atualizadas com sucesso'
        })
        onSuccess()
        onOpenChange(false)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar as informações'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Informações do Membro</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Membro (somente leitura) */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Dados do Membro</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Nome:</span>
                <p className="font-medium text-gray-900">{member.member.name}</p>
              </div>
              <div>
                <span className="text-gray-500">CPF:</span>
                <p className="font-medium text-gray-900">{member.member.cpf}</p>
              </div>
              {member.member.birthDate && (
                <div>
                  <span className="text-gray-500">Idade:</span>
                  <p className="font-medium text-gray-900">
                    {calculateAge(member.member.birthDate)}
                  </p>
                </div>
              )}
            </div>
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

          {/* Informações Adicionais */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="monthlyIncome">Renda Mensal (R$)</Label>
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
                  <SelectItem value="">Não informado</SelectItem>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
