'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Plus, X, Info, Camera, FileImage } from 'lucide-react'

interface DocumentsStepProps {
  formData: {
    requiresDocuments: boolean
    requiredDocuments: any[]
  }
  onChange: (field: string, value: any) => void
}

export function DocumentsStep({ formData, onChange }: DocumentsStepProps) {
  const [documentInput, setDocumentInput] = useState('')

  // Garantir que requiredDocuments seja sempre um array
  const rawDocuments = Array.isArray(formData.requiredDocuments) ? formData.requiredDocuments : []

  // Normalizar documentos: converter strings para objetos e objetos manter como estão
  const documents = rawDocuments.map(doc => {
    if (typeof doc === 'string') {
      return {
        name: doc,
        description: '',
        required: false,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        allowCameraUpload: true,
        maxSizeMB: 5
      }
    }
    return {
      ...doc,
      acceptedFormats: doc.acceptedFormats || ['pdf', 'jpg', 'jpeg', 'png'],
      allowCameraUpload: doc.allowCameraUpload !== undefined ? doc.allowCameraUpload : true,
      maxSizeMB: doc.maxSizeMB || 5
    }
  })

  // Função auxiliar para obter o nome do documento
  const getDocumentName = (doc: any): string => {
    return typeof doc === 'string' ? doc : doc.name || ''
  }

  const addDocument = () => {
    if (documentInput.trim()) {
      // Adicionar como objeto para manter consistência
      const newDoc = {
        name: documentInput.trim(),
        description: '',
        required: false,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        allowCameraUpload: true,
        maxSizeMB: 5
      }
      onChange('requiredDocuments', [...documents, newDoc])
      setDocumentInput('')
    }
  }

  const removeDocument = (index: number) => {
    onChange(
      'requiredDocuments',
      documents.filter((_, i) => i !== index)
    )
  }

  const toggleRequired = (index: number) => {
    const updatedDocs = [...documents]
    updatedDocs[index] = {
      ...updatedDocs[index],
      required: !updatedDocs[index].required
    }
    onChange('requiredDocuments', updatedDocs)
  }

  const addCommonDocument = (docName: string) => {
    const newDoc = {
      name: docName,
      description: '',
      required: false,
      acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      allowCameraUpload: true,
      maxSizeMB: 5
    }
    onChange('requiredDocuments', [...documents, newDoc])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addDocument()
    }
  }

  const commonDocuments = [
    'RG',
    'CPF',
    'Comprovante de Residência',
    'Certidão de Nascimento',
    'Certidão de Casamento',
    'Título de Eleitor',
    'Carteira de Trabalho',
    'Comprovante de Renda',
    'Foto 3x4',
    'Certidão Negativa de Débitos',
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-900">Documentação Necessária</p>
          <p className="text-xs text-amber-700 mt-1">
            Configure quais documentos os cidadãos precisam apresentar para solicitar este serviço.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="requiresDocuments"
            checked={formData.requiresDocuments}
            onCheckedChange={(checked) => onChange('requiresDocuments', checked)}
          />
          <Label htmlFor="requiresDocuments" className="cursor-pointer font-medium">
            Este serviço requer documentos
          </Label>
        </div>

        {formData.requiresDocuments && (
          <div className="space-y-4 pl-6 border-l-2 border-amber-200">
            <div>
              <Label htmlFor="documentInput" className="text-sm font-medium">
                Adicionar Documento
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="documentInput"
                  value={documentInput}
                  onChange={(e) => setDocumentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ex: RG, CPF, Comprovante de residência"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addDocument}
                  disabled={!documentInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Pressione Enter ou clique no + para adicionar
              </p>
            </div>

            {/* Documentos Comuns */}
            {commonDocuments.filter(commonDoc => !documents.some(doc => getDocumentName(doc) === commonDoc)).length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Documentos Comuns (clique para adicionar)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {commonDocuments
                    .filter(commonDoc => !documents.some(doc => getDocumentName(doc) === commonDoc))
                    .map((doc) => (
                      <Badge
                        key={doc}
                        variant="outline"
                        className="cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition-colors"
                        onClick={() => addCommonDocument(doc)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {doc}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Lista de Documentos Adicionados */}
            {documents.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Documentos Necessários ({documents.length})
                </Label>
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {getDocumentName(doc)}
                            </p>
                            {doc.description && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pl-7">
                        {/* Obrigatório */}
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`required-${index}`}
                            checked={doc.required}
                            onCheckedChange={() => toggleRequired(index)}
                          />
                          <Label
                            htmlFor={`required-${index}`}
                            className="text-xs cursor-pointer"
                          >
                            Obrigatório
                          </Label>
                        </div>

                        {/* Permitir Câmera */}
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`camera-${index}`}
                            checked={doc.allowCameraUpload !== false}
                            onCheckedChange={(checked) => {
                              const updatedDocs = [...documents]
                              updatedDocs[index] = { ...updatedDocs[index], allowCameraUpload: checked as boolean }
                              onChange('requiredDocuments', updatedDocs)
                            }}
                          />
                          <Label
                            htmlFor={`camera-${index}`}
                            className="text-xs cursor-pointer flex items-center gap-1"
                          >
                            <Camera className="h-3 w-3" />
                            Permitir Digitalização
                          </Label>
                        </div>

                        {/* Formatos Aceitos */}
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs text-gray-600">Formatos Aceitos</Label>
                          <Select
                            value={(doc.acceptedFormats || []).join(',')}
                            onValueChange={(value) => {
                              const updatedDocs = [...documents]
                              updatedDocs[index] = { ...updatedDocs[index], acceptedFormats: value.split(',') }
                              onChange('requiredDocuments', updatedDocs)
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Selecione os formatos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf,jpg,jpeg,png">PDF, JPG, PNG</SelectItem>
                              <SelectItem value="pdf">Apenas PDF</SelectItem>
                              <SelectItem value="jpg,jpeg,png">Apenas Imagens</SelectItem>
                              <SelectItem value="pdf,jpg,jpeg,png,doc,docx">Todos os documentos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tamanho Máximo */}
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs text-gray-600">Tamanho Máximo (MB)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="50"
                            value={doc.maxSizeMB || 5}
                            onChange={(e) => {
                              const updatedDocs = [...documents]
                              updatedDocs[index] = { ...updatedDocs[index], maxSizeMB: parseInt(e.target.value) || 5 }
                              onChange('requiredDocuments', updatedDocs)
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Configure cada documento: marque como obrigatório, defina formatos aceitos, tamanho máximo e se permite digitalização por câmera
                </p>
              </div>
            )}

            {documents.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>Dica:</strong> Na seção "Recursos Avançados" você poderá configurar
                  validação automática com IA, OCR e outras funcionalidades para os documentos.
                </p>
              </div>
            )}
          </div>
        )}

        {!formData.requiresDocuments && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Este serviço não requer documentos
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Marque a opção acima se o cidadão precisar enviar documentos
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
