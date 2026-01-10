'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FormInput,
  Save,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'

interface ProtocolDataTabProps {
  protocolId: string
  formData?: Record<string, any>
  metadata?: any
  onRefresh?: () => void
}

export function ProtocolDataTab({
  protocolId,
  formData = {},
  metadata = {},
  onRefresh
}: ProtocolDataTabProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [editedData, setEditedData] = useState<Record<string, any>>(formData)
  const [isSaving, setIsSaving] = useState(false)

  // Combinar formData e metadata para obter todos os campos
  const allFields = { ...formData, ...metadata }
  const fieldKeys = Object.keys(allFields).filter(key =>
    !['id', 'createdAt', 'updatedAt', 'protocolId'].includes(key)
  )

  const handleFieldChange = (key: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const response = await apiRequest(`/protocols/${protocolId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          metadata: editedData
        })
      })

      if (response.success) {
        toast({
          title: 'Dados atualizados',
          description: 'Os dados do protocolo foram salvos com sucesso.'
        })
        if (onRefresh) onRefresh()
      }
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderField = (key: string, value: any) => {
    const stringValue = value !== null && value !== undefined ? String(value) : ''

    // Se for um campo longo (mais de 100 caracteres), usar textarea
    if (stringValue.length > 100) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">
            {formatFieldName(key)}
          </Label>
          <Textarea
            id={key}
            value={editedData[key] || ''}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            rows={4}
            className="text-sm"
          />
        </div>
      )
    }

    // Campo normal (input)
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {formatFieldName(key)}
        </Label>
        <Input
          id={key}
          value={editedData[key] || ''}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          className="text-sm"
        />
      </div>
    )
  }

  const formatFieldName = (key: string): string => {
    // Converter camelCase e snake_case para texto legível
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(editedData)

  if (fieldKeys.length === 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Este protocolo não possui campos de dados adicionais registrados.
            Os dados básicos do cidadão e serviço estão disponíveis na aba "Resumo".
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FormInput className="h-4 w-4" />
              Dados do Formulário ({fieldKeys.length} campos)
            </div>
            {hasChanges && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Não salvo
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Grid de campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldKeys.map(key => renderField(key, allFields[key]))}
            </div>

            {/* Botão de Salvar */}
            <div className="flex items-center justify-between pt-4 border-t">
              {hasChanges ? (
                <p className="text-sm text-amber-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Você tem alterações não salvas
                </p>
              ) : (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Todos os dados estão salvos
                </p>
              )}

              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campos Obrigatórios vs Opcionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informações sobre os Campos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Total de campos:</strong> {fieldKeys.length}
            </p>
            <p className="text-xs text-gray-500">
              Os dados são salvos no metadata do protocolo e podem ser utilizados
              durante o processamento do workflow.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
