'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, FileSearch, Sparkles } from 'lucide-react'

interface AdvancedDocsConfigProps {
  formData: any
  onChange: (field: string, value: any) => void
}

interface DocumentConfig {
  id: string
  name: string
  required: boolean
  validateWithAI: boolean
  aiProvider?: string
  maxSize: number
  acceptedTypes: string[]
}

export function AdvancedDocsConfig({ formData, onChange }: AdvancedDocsConfigProps) {
  const config = formData.advancedDocsConfig || {
    documents: [],
  }

  const [editingDoc, setEditingDoc] = useState<string | null>(null)

  const updateConfig = (updates: any) => {
    onChange('advancedDocsConfig', { ...config, ...updates })
  }

  const addDocument = () => {
    const newDoc: DocumentConfig = {
      id: `doc_${Date.now()}`,
      name: 'Novo Documento',
      required: true,
      validateWithAI: false,
      maxSize: 5242880, // 5MB
      acceptedTypes: ['.pdf', '.jpg', '.png'],
    }
    updateConfig({ documents: [...config.documents, newDoc] })
    setEditingDoc(newDoc.id)
  }

  const removeDocument = (docId: string) => {
    updateConfig({ documents: config.documents.filter((d: DocumentConfig) => d.id !== docId) })
    if (editingDoc === docId) setEditingDoc(null)
  }

  const updateDocument = (docId: string, updates: any) => {
    updateConfig({
      documents: config.documents.map((d: DocumentConfig) =>
        d.id === docId ? { ...d, ...updates } : d
      ),
    })
  }

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSearch className="h-4 w-4" />
                Documentos Inteligentes
              </CardTitle>
              <CardDescription>
                {config.documents.length} documento{config.documents.length !== 1 ? 's' : ''} configurado{config.documents.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button onClick={addDocument} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Documento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {config.documents.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <FileSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 font-medium">Nenhum documento configurado</p>
              <p className="text-xs text-gray-500 mt-2">
                Configure validações avançadas para documentos com IA e OCR
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {config.documents.map((doc: DocumentConfig) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{doc.name}</span>
                          {doc.required && (
                            <Badge className="text-xs bg-red-100 text-red-700">
                              Obrigatório
                            </Badge>
                          )}
                          {doc.validateWithAI && (
                            <Badge className="text-xs bg-purple-100 text-purple-700">
                              <Sparkles className="h-3 w-3 mr-1" />
                              IA/OCR
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingDoc(editingDoc === doc.id ? null : doc.id)}
                          >
                            {editingDoc === doc.id ? 'Fechar' : 'Editar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(doc.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-4 text-xs text-gray-600">
                        <span>Tipos: {doc.acceptedTypes.join(', ')}</span>
                        <span>Máx: {formatFileSize(doc.maxSize)}</span>
                      </div>

                      {editingDoc === doc.id && (
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                          <div className="space-y-2 col-span-2">
                            <Label className="text-xs">Nome do Documento</Label>
                            <Input
                              value={doc.name}
                              onChange={(e) => updateDocument(doc.id, { name: e.target.value })}
                              placeholder="Ex: RG, CPF, Comprovante de Residência"
                              className="text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Tamanho Máximo</Label>
                            <Select
                              value={String(doc.maxSize)}
                              onValueChange={(value) => updateDocument(doc.id, { maxSize: parseInt(value) })}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1048576">1 MB</SelectItem>
                                <SelectItem value="2097152">2 MB</SelectItem>
                                <SelectItem value="5242880">5 MB</SelectItem>
                                <SelectItem value="10485760">10 MB</SelectItem>
                                <SelectItem value="20971520">20 MB</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2 col-span-2">
                            <Checkbox
                              id={`required_${doc.id}`}
                              checked={doc.required}
                              onCheckedChange={(checked) => updateDocument(doc.id, { required: checked })}
                            />
                            <Label htmlFor={`required_${doc.id}`} className="text-xs cursor-pointer">
                              Documento obrigatório
                            </Label>
                          </div>

                          <div className="col-span-2 pt-3 border-t">
                            <div className="flex items-center space-x-2 mb-3">
                              <Checkbox
                                id={`ai_${doc.id}`}
                                checked={doc.validateWithAI}
                                onCheckedChange={(checked) => updateDocument(doc.id, { validateWithAI: checked })}
                              />
                              <Label htmlFor={`ai_${doc.id}`} className="cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-purple-600" />
                                  <span className="text-sm font-medium">Validar com IA/OCR</span>
                                </div>
                              </Label>
                            </div>

                            {doc.validateWithAI && (
                              <div className="space-y-3 pl-6 border-l-2 border-purple-200">
                                <div className="space-y-2">
                                  <Label className="text-xs">Provider de IA</Label>
                                  <Select
                                    value={doc.aiProvider || 'google_vision'}
                                    onValueChange={(value) => updateDocument(doc.id, { aiProvider: value })}
                                  >
                                    <SelectTrigger className="text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="google_vision">Google Vision AI</SelectItem>
                                      <SelectItem value="aws_textract">AWS Textract</SelectItem>
                                      <SelectItem value="azure_ocr">Azure OCR</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                  <p className="text-xs text-purple-900">
                                    <strong>Recursos:</strong> Extração automática de dados (CPF, nome, data),
                                    validação de autenticidade, detecção de fraudes
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {config.documents.some((d: DocumentConfig) => d.validateWithAI) && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-900">IA e OCR Ativados</p>
                <p className="text-xs text-purple-700 mt-1">
                  Os documentos marcados serão automaticamente processados com OCR para extração de dados
                  e validação de autenticidade, reduzindo erros e fraudes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
