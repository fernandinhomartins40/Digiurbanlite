'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Shield, CheckCircle2, XCircle, Upload, Loader2, FileCheck, Calendar, Building, User, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'

interface ValidationResult {
  valid: boolean
  message: string
  document?: {
    type: string
    fileName: string
    generatedAt: string
    expiresAt?: string | null
    protocolNumber: string
    serviceName: string
    citizenName: string
    departmentName: string
  }
  validation?: {
    code: string
    validatedAt: string
    validatedCount: number
  }
  integrity?: {
    isIntact: boolean
    uploadedHash: string
    storedHash: string
  }
}

export default function ValidateDocumentPage() {
  const [code, setCode] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'validate' | 'integrity'>('validate')

  const handleValidate = async () => {
    if (!code.trim()) {
      toast.error('Digite o código de validação')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/public/validate/document/${code}`)
      const data = await response.json()
      setResult(data)

      if (data.valid) {
        toast.success('Documento válido!')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Erro ao validar documento')
      setResult({ valid: false, message: 'Erro ao conectar ao servidor' })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyIntegrity = async () => {
    if (!code.trim() || !file) {
      toast.error('Digite o código e selecione o arquivo')
      return
    }

    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('validationCode', code)
    formData.append('file', file)

    try {
      const response = await fetch('/api/public/validate/verify-integrity', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      setResult(data)

      if (data.valid && data.integrity?.isIntact) {
        toast.success('Documento autêntico!')
      } else {
        toast.error('Documento foi modificado!')
      }
    } catch (error) {
      toast.error('Erro ao verificar integridade')
      setResult({ valid: false, message: 'Erro ao conectar ao servidor' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Validação de Documentos Oficiais
          </h1>
          <p className="text-gray-600">
            Verifique a autenticidade de documentos emitidos pela Prefeitura Municipal
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 justify-center">
          <Button
            variant={mode === 'validate' ? 'default' : 'outline'}
            onClick={() => { setMode('validate'); setResult(null); }}
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Validar Código
          </Button>
          <Button
            variant={mode === 'integrity' ? 'default' : 'outline'}
            onClick={() => { setMode('integrity'); setResult(null); }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Verificar Integridade
          </Button>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {mode === 'validate' ? 'Validar Código' : 'Verificar Integridade'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Código */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Código de Validação
              </label>
              <Input
                placeholder="VAL-2026-123456-7890"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono text-lg"
                maxLength={22}
              />
              <p className="text-xs text-gray-500 mt-1">
                O código está impresso no documento oficial
              </p>
            </div>

            {/* Upload (apenas modo integrity) */}
            {mode === 'integrity' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Arquivo PDF
                </label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Selecione o documento PDF para verificar se foi modificado
                </p>
              </div>
            )}

            {/* Button */}
            <Button
              onClick={mode === 'validate' ? handleValidate : handleVerifyIntegrity}
              disabled={loading || !code}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {mode === 'validate' ? 'Validando...' : 'Verificando...'}
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  {mode === 'validate' ? 'Validar Documento' : 'Verificar Integridade'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className={result.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {result.valid ? (
                  <CheckCircle2 className="h-12 w-12 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-12 w-12 text-red-600 shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`font-bold text-xl mb-2 ${result.valid ? 'text-green-900' : 'text-red-900'}`}>
                    {result.valid ? 'Documento Válido ✓' : 'Documento Inválido ✗'}
                  </h3>
                  <p className="text-sm mb-4">{result.message}</p>

                  {/* Informações do documento válido */}
                  {result.valid && result.document && (
                    <div className="space-y-3 bg-white p-4 rounded-lg border border-green-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-start gap-2">
                          <FileCheck className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-gray-600">Tipo de Documento</p>
                            <p className="font-medium">{result.document.type}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-gray-600">Protocolo</p>
                            <p className="font-medium">{result.document.protocolNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-gray-600">Cidadão</p>
                            <p className="font-medium">{result.document.citizenName}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Building className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-gray-600">Departamento</p>
                            <p className="font-medium">{result.document.departmentName}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-gray-600">Emitido em</p>
                            <p className="font-medium">
                              {new Date(result.document.generatedAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        {result.document.expiresAt && (
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-gray-600">Validade</p>
                              <p className="font-medium">
                                {new Date(result.document.expiresAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {result.validation && (
                        <div className="pt-3 border-t text-xs text-gray-600">
                          Este documento foi validado {result.validation.validatedCount}× |
                          Última validação: {new Date(result.validation.validatedAt).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resultado de integridade */}
                  {result.integrity && (
                    <div className={`mt-4 p-4 rounded-lg border ${result.integrity.isIntact ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                      <p className={`font-medium ${result.integrity.isIntact ? 'text-green-900' : 'text-red-900'}`}>
                        {result.integrity.isIntact
                          ? '✓ Documento autêntico - não foi modificado'
                          : '✗ ATENÇÃO: Documento foi alterado'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Sobre a Validação</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Todos os documentos oficiais possuem código de validação único</li>
                  <li>A verificação de integridade garante que o PDF não foi alterado</li>
                  <li>Este sistema é público e pode ser acessado por qualquer pessoa</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
