'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { UserCircle, UserPlus, X, Check, AlertCircle, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export interface LinkedCitizen {
  id: string
  name: string
  cpf: string
  email?: string
  phone?: string
  birthDate?: string
  rg?: string
  relationship?: string
  isDependent?: boolean
}

export interface CitizenLink {
  id?: string
  linkedCitizenId: string
  linkedCitizen?: LinkedCitizen
  linkType: string
  relationship?: string
  role: string
  contextData?: any
  isVerified?: boolean
}

interface CitizenLinkSelectorProps {
  citizenId: string
  linkType: 'STUDENT' | 'GUARDIAN' | 'PATIENT' | 'COMPANION' | 'DEPENDENT' | 'FAMILY_MEMBER' | 'AUTHORIZED_PERSON' | 'BENEFICIARY' | 'WITNESS' | 'OTHER'
  role?: 'BENEFICIARY' | 'RESPONSIBLE' | 'AUTHORIZED' | 'COMPANION' | 'WITNESS' | 'OTHER'
  onLinkSelect: (link: CitizenLink) => void
  onLinkRemove?: (link: CitizenLink) => void
  selectedLinks?: CitizenLink[]
  multiple?: boolean
  allowManualEntry?: boolean
  contextFields?: Array<{
    name: string
    label: string
    type: 'text' | 'number' | 'select'
    options?: string[]
    required?: boolean
  }>
}

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

const ROLE_LABELS: Record<string, string> = {
  BENEFICIARY: 'Beneficiário',
  RESPONSIBLE: 'Responsável',
  AUTHORIZED: 'Autorizado',
  COMPANION: 'Acompanhante',
  WITNESS: 'Testemunha',
  OTHER: 'Outro'
}

export function CitizenLinkSelector({
  citizenId,
  linkType,
  role = 'BENEFICIARY',
  onLinkSelect,
  onLinkRemove,
  selectedLinks = [],
  multiple = false,
  allowManualEntry = true,
  contextFields = []
}: CitizenLinkSelectorProps) {
  const [availableCitizens, setAvailableCitizens] = useState<LinkedCitizen[]>([])
  const [loading, setLoading] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [selectedCitizen, setSelectedCitizen] = useState<string>('')
  const [contextData, setContextData] = useState<any>({})
  const { toast } = useToast()

  useEffect(() => {
    loadAvailableCitizens()
  }, [citizenId, linkType])

  const loadAvailableCitizens = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/citizens/${citizenId}/available-for-link?linkType=${linkType}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      const data = await response.json()

      if (data.success) {
        setAvailableCitizens(data.data.citizens || [])
      }
    } catch (error) {
      console.error('Error loading available citizens:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar cidadãos disponíveis'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCitizen = () => {
    const citizen = availableCitizens.find(c => c.id === selectedCitizen)
    if (!citizen) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione um cidadão'
      })
      return
    }

    // Verificar se já foi selecionado
    if (selectedLinks.some(link => link.linkedCitizenId === citizen.id)) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Este cidadão já foi selecionado'
      })
      return
    }

    const link: CitizenLink = {
      linkedCitizenId: citizen.id,
      linkedCitizen: citizen,
      linkType,
      relationship: citizen.relationship,
      role,
      contextData: contextFields.length > 0 ? contextData : undefined,
      isVerified: !!citizen.relationship // Auto-verified se vem da família
    }

    onLinkSelect(link)
    setSelectedCitizen('')
    setContextData({})
  }

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

  return (
    <div className="space-y-4">
      {/* Lista de links selecionados */}
      {selectedLinks.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {LINK_TYPE_LABELS[linkType]} Selecionado(s)
          </Label>
          {selectedLinks.map((link, index) => (
            <div
              key={link.id || index}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-3 flex-1">
                <UserCircle className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{link.linkedCitizen?.name}</div>
                  <div className="text-xs text-gray-500">
                    {link.linkedCitizen?.cpf}
                    {link.linkedCitizen?.birthDate && (
                      <> · {calculateAge(link.linkedCitizen.birthDate)}</>
                    )}
                  </div>
                  {link.relationship && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {link.relationship}
                    </Badge>
                  )}
                </div>
                {link.isVerified && (
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    Verificado
                  </Badge>
                )}
              </div>
              {onLinkRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLinkRemove(link)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selector (se multiple ou nenhum selecionado) */}
      {(multiple || selectedLinks.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Selecionar {LINK_TYPE_LABELS[linkType]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Carregando...</div>
            ) : (
              <>
                {availableCitizens.length > 0 ? (
                  <>
                    <div>
                      <Label htmlFor="citizen">Selecionar da Composição Familiar</Label>
                      <Select value={selectedCitizen} onValueChange={setSelectedCitizen}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCitizens.map((citizen) => (
                            <SelectItem key={citizen.id} value={citizen.id}>
                              <div className="flex flex-col">
                                <span>{citizen.name}</span>
                                <span className="text-xs text-gray-500">
                                  {citizen.cpf}
                                  {citizen.relationship && ` · ${citizen.relationship}`}
                                  {citizen.birthDate && ` · ${calculateAge(citizen.birthDate)}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Context Fields */}
                    {selectedCitizen && contextFields.length > 0 && (
                      <div className="space-y-3 pt-2 border-t">
                        <Label className="text-sm font-medium">Informações Adicionais</Label>
                        {contextFields.map((field) => (
                          <div key={field.name}>
                            <Label htmlFor={field.name} className="text-sm">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {field.type === 'select' ? (
                              <Select
                                value={contextData[field.name] || ''}
                                onValueChange={(value) =>
                                  setContextData({ ...contextData, [field.name]: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id={field.name}
                                type={field.type}
                                value={contextData[field.name] || ''}
                                onChange={(e) =>
                                  setContextData({
                                    ...contextData,
                                    [field.name]: e.target.value
                                  })
                                }
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={handleSelectCitizen}
                      disabled={!selectedCitizen}
                      className="w-full"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 mb-2">
                      Nenhum cidadão disponível na composição familiar
                    </p>
                    {allowManualEntry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowManualEntry(true)}
                      >
                        Adicionar Novo Cidadão
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
