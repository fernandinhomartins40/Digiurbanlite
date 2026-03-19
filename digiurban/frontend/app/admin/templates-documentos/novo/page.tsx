'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Loader2, Save } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WysiwygTemplateEditor } from '@/src/components/admin/templates/WysiwygTemplateEditor'
import { ServiceMultiSelect } from '@/src/components/admin/templates/ServiceMultiSelect'

const DOCUMENT_TYPES = [
  'PROTOCOL_CERTIFICATE',
  'COMPLETION_REPORT',
  'RECEIPT',
  'AUTHORIZATION',
  'NOTIFICATION',
  'CUSTOM',
]

const STAGE_TYPES = ['RECEPTION', 'CONCLUSION', 'DOCUMENT_GENERATION']

export default function NewTemplatePage() {
  const router = useRouter()
  const { apiRequest, user } = useAdminAuth()
  const { toast } = useToast()

  const [services, setServices] = useState<Array<{ id: string; name: string }>>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    documentType: 'CUSTOM',
    outputFormat: 'PDF',
    isGlobal: true,
    serviceIds: [] as string[],
    allowedStageTypes: [] as string[],
    requiresSignature: true,
    inputSchemaText: '',
    signatureFieldsText: '[]',
    fullTemplate: '<p>Escreva o conteúdo do documento aqui...</p>',
  })

  const canCreate = user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (!canCreate) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas SUPER_ADMIN pode criar novos templates',
        variant: 'destructive',
      })
      router.push('/admin/templates-documentos')
      return
    }

    const loadServices = async () => {
      try {
        setLoadingServices(true)
        const result = await apiRequest('/services')
        if (result.success) {
          setServices(result.data || [])
        }
      } catch (error: any) {
        toast({
          title: 'Erro ao carregar serviços',
          description: error.message || 'Não foi possível carregar os serviços',
          variant: 'destructive',
        })
      } finally {
        setLoadingServices(false)
      }
    }

    loadServices()
  }, [apiRequest, canCreate, router, toast])

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim() || !formData.fullTemplate.trim()) {
      toast({
        title: 'Dados obrigatórios ausentes',
        description: 'Informe nome, código e conteúdo do template',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)

      const inputSchema = formData.inputSchemaText.trim()
        ? JSON.parse(formData.inputSchemaText)
        : null
      const signatureFields = formData.signatureFieldsText.trim()
        ? JSON.parse(formData.signatureFieldsText)
        : []

      const result = await apiRequest('/document-templates', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          documentType: formData.documentType,
          outputFormat: formData.outputFormat,
          isGlobal: formData.isGlobal,
          serviceIds: formData.isGlobal ? [] : formData.serviceIds,
          allowedStageTypes: formData.allowedStageTypes,
          requiresSignature: formData.requiresSignature,
          inputSchema,
          signatureFields,
          htmlTemplate: formData.fullTemplate,
          headerHtml: '',
          footerHtml: '',
          cssStyles: '',
          pageSize: 'A4',
          orientation: 'portrait',
          availableVariables: [],
          isActive: true,
        }),
      })

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar template')
      }

      toast({
        title: 'Template criado',
        description: 'O template foi cadastrado com sucesso',
      })
      router.push('/admin/templates-documentos')
    } catch (error: any) {
      toast({
        title: 'Erro ao criar template',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!canCreate) {
    return null
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/templates-documentos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Novo Template
            </h1>
            <p className="text-muted-foreground mt-1">
              Cadastre um template com schema, assinatura e vínculo por etapa
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Salvando...' : 'Criar Template'}
        </Button>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-900">
          O documento gerado só ficará disponível para o cidadão após assinatura digital e publicação pelo servidor.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                placeholder="LAUDO_TECNICO_PADRAO"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Tipo de documento</Label>
              <select
                id="documentType"
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputFormat">Formato de saída</Label>
              <select
                id="outputFormat"
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                value={formData.outputFormat}
                onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
              >
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
                <option value="HTML">HTML</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Escopo por serviço</Label>
              <div className="flex items-center gap-2 h-10">
                <input
                  id="isGlobal"
                  type="checkbox"
                  checked={formData.isGlobal}
                  onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="isGlobal" className="text-sm cursor-pointer">
                  Template global
                </label>
              </div>
              {!formData.isGlobal ? (
                loadingServices ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando serviços...
                  </div>
                ) : (
                  <ServiceMultiSelect
                    services={services}
                    selectedServiceIds={formData.serviceIds}
                    onChange={(serviceIds) => setFormData({ ...formData, serviceIds })}
                  />
                )
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Etapas permitidas</Label>
              <div className="grid gap-2 md:grid-cols-3">
                {STAGE_TYPES.map((stageType) => (
                  <label key={stageType} className="flex items-center gap-2 rounded border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.allowedStageTypes.includes(stageType)}
                      onChange={(event) => {
                        setFormData((current) => ({
                          ...current,
                          allowedStageTypes: event.target.checked
                            ? [...current.allowedStageTypes, stageType]
                            : current.allowedStageTypes.filter((value) => value !== stageType)
                        }))
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>{stageType}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="requiresSignature">Assinatura</Label>
              <div className="flex items-center gap-2 h-10">
                <input
                  id="requiresSignature"
                  type="checkbox"
                  checked={formData.requiresSignature}
                  onChange={(e) => setFormData({ ...formData, requiresSignature: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="requiresSignature" className="text-sm cursor-pointer">
                  Exigir assinatura digital antes da publicação
                </label>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="inputSchemaText">Schema de dados do template</Label>
              <Textarea
                id="inputSchemaText"
                value={formData.inputSchemaText}
                onChange={(e) => setFormData({ ...formData, inputSchemaText: e.target.value })}
                rows={10}
                className="font-mono text-xs"
                placeholder={`{\n  "type": "object",\n  "properties": {\n    "conteudoTecnico": {\n      "type": "string",\n      "title": "Conteúdo técnico",\n      "widget": "textarea"\n    }\n  }\n}`}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="signatureFieldsText">Configuração de assinatura</Label>
              <Textarea
                id="signatureFieldsText"
                value={formData.signatureFieldsText}
                onChange={(e) => setFormData({ ...formData, signatureFieldsText: e.target.value })}
                rows={6}
                className="font-mono text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Edite o conteúdo do template como se fosse um documento de texto. Variáveis como <code>{'{{protocolNumber}}'}</code> serão resolvidas na geração.
            </p>
            <WysiwygTemplateEditor
              content={formData.fullTemplate}
              onChange={(html) => setFormData({ ...formData, fullTemplate: html })}
              placeholder="Digite o conteúdo do documento..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
