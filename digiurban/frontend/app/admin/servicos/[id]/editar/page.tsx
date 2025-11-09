'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BasicInfoStep } from '@/components/admin/services/steps/BasicInfoStep'
import { DocumentsStep } from '@/components/admin/services/steps/DocumentsStep'
import { FormFieldsStep } from '@/components/admin/services/steps/FormFieldsStep'
import { FeaturesStep } from '@/components/admin/services/steps/FeaturesStep'
import { DataCaptureStep } from '@/components/admin/services/steps/DataCaptureStep'
import {
  ArrowLeft,
  Save,
  FileText,
  Sparkles,
  Settings,
  Loader2,
  FormInput,
  MapPin,
  Calendar,
  BarChart,
  GitBranch,
  FileSearch,
  Bell,
} from 'lucide-react'
import Link from 'next/link'

interface Department {
  id: string
  name: string
  code?: string
}

interface Service {
  id: string
  name: string
  description: string | null
  category: string | null
  departmentId: string
  requiresDocuments: boolean
  requiredDocuments: any[] | null
  estimatedDays: number | null
  priority: number
  icon: string | null
  color: string | null
  isActive: boolean
  hasCustomForm: boolean
  hasLocation: boolean
  hasScheduling: boolean
  hasSurvey: boolean
  hasCustomWorkflow: boolean
  hasCustomFields: boolean
  hasAdvancedDocs: boolean
  hasNotifications: boolean
  formSchema?: any
  moduleType?: string
}

interface ServiceFormData {
  name: string
  description: string
  category: string
  departmentId: string
  estimatedDays: string
  priority: number
  icon: string
  color: string
  requiresDocuments: boolean
  requiredDocuments: any[]
  hasCustomForm: boolean
  hasLocation: boolean
  hasScheduling: boolean
  hasSurvey: boolean
  hasCustomWorkflow: boolean
  hasCustomFields: boolean
  hasAdvancedDocs: boolean
  hasNotifications: boolean
  formSchema?: any
  moduleType?: string
  enabledFields?: string[]
  formFieldsConfig?: any
}

export default function EditServicePage() {
  const router = useRouter()
  const params = useParams()
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const serviceId = params.id as string

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [service, setService] = useState<Service | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [activeTab, setActiveTab] = useState('basic')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category: '',
    departmentId: '',
    estimatedDays: '',
    priority: 3,
    icon: '',
    color: '#3b82f6',
    requiresDocuments: false,
    requiredDocuments: [],
    hasCustomForm: false,
    hasLocation: false,
    hasScheduling: false,
    hasSurvey: false,
    hasCustomWorkflow: false,
    hasCustomFields: false,
    hasAdvancedDocs: false,
    hasNotifications: false,
    formSchema: null,
    moduleType: '',
    enabledFields: [],
    formFieldsConfig: null,
  })

  useEffect(() => {
    loadService()
    loadDepartments()
  }, [serviceId])

  const loadService = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`/api/services/${serviceId}`)
      const serviceData = response.service || response.data

      if (!serviceData) {
        throw new Error('Serviço não encontrado')
      }

      setService(serviceData)

      // Preencher formulário
      setFormData({
        name: serviceData.name,
        description: serviceData.description || '',
        category: serviceData.category || '',
        departmentId: serviceData.departmentId,
        estimatedDays: serviceData.estimatedDays?.toString() || '',
        priority: serviceData.priority,
        icon: serviceData.icon || '',
        color: serviceData.color || '#3b82f6',
        requiresDocuments: serviceData.requiresDocuments,
        requiredDocuments: serviceData.requiredDocuments || [],
        hasCustomForm: serviceData.hasCustomForm || false,
        hasLocation: serviceData.hasLocation || false,
        hasScheduling: serviceData.hasScheduling || false,
        hasSurvey: serviceData.hasSurvey || false,
        hasCustomWorkflow: serviceData.hasCustomWorkflow || false,
        hasCustomFields: serviceData.hasCustomFields || false,
        hasAdvancedDocs: serviceData.hasAdvancedDocs || false,
        hasNotifications: serviceData.hasNotifications || false,
        formSchema: serviceData.formSchema || null,
        moduleType: serviceData.moduleType || '',
        enabledFields: serviceData.enabledFields || [],
        formFieldsConfig: serviceData.formFieldsConfig || null,
      })
    } catch (error: any) {
      console.error('Erro ao carregar serviço:', error)
      toast({
        title: 'Erro ao carregar serviço',
        description: error?.message || 'Não foi possível carregar o serviço.',
        variant: 'destructive',
      })
      router.push('/admin/servicos')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await apiRequest('/api/admin/management/departments')
      setDepartments(response.departments || response.data?.departments || [])
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async () => {
    // Validação
    if (!formData.name || !formData.departmentId) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e departamento são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await apiRequest(`/api/services/${serviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          category: formData.category || null,
          requiresDocuments: formData.requiresDocuments,
          requiredDocuments: formData.requiredDocuments.length > 0 ? formData.requiredDocuments : null,
          estimatedDays: formData.estimatedDays ? parseInt(formData.estimatedDays) : null,
          priority: formData.priority,
          icon: formData.icon || null,
          color: formData.color || null,
          // Feature Flags
          hasCustomForm: formData.hasCustomForm,
          hasLocation: formData.hasLocation,
          hasScheduling: formData.hasScheduling,
          hasSurvey: formData.hasSurvey,
          hasCustomWorkflow: formData.hasCustomWorkflow,
          hasCustomFields: formData.hasCustomFields,
          hasAdvancedDocs: formData.hasAdvancedDocs,
          hasNotifications: formData.hasNotifications,
          // Configurações avançadas
          formSchema: formData.formSchema || null,
          moduleType: formData.moduleType || null,
          // Configuração de campos do formulário
          enabledFields: formData.enabledFields || null,
          formFieldsConfig: formData.formFieldsConfig || null,
        }),
      })

      toast({
        title: 'Serviço atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      })

      router.push('/admin/servicos')
    } catch (error: any) {
      console.error('Erro ao atualizar serviço:', error)
      toast({
        title: 'Erro ao atualizar serviço',
        description: error?.message || 'Ocorreu um erro ao atualizar o serviço.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Carregando serviço...</p>
        </div>
      </div>
    )
  }

  if (!service) {
    return null
  }

  const activeFeatures = Object.entries(formData)
    .filter(([key]) => key.startsWith('has'))
    .filter(([, value]) => value === true)

  // Definir abas dinâmicas baseadas nos recursos ativos
  const baseTabs = [
    { value: 'basic', label: 'Informações Básicas', icon: FileText },
    { value: 'documents', label: 'Documentos', icon: FileText },
    { value: 'form-config', label: 'Formulário', icon: FormInput },
    { value: 'features', label: 'Recursos', icon: Sparkles },
  ]

  const featureTabs = []
  if (formData.hasCustomForm || formData.hasCustomFields) {
    featureTabs.push({ value: 'form-fields', label: 'Campos do Formulário', icon: FormInput })
  }
  if (formData.hasLocation) {
    featureTabs.push({ value: 'location', label: 'Localização', icon: MapPin })
  }
  if (formData.hasScheduling) {
    featureTabs.push({ value: 'scheduling', label: 'Agendamento', icon: Calendar })
  }
  if (formData.hasSurvey) {
    featureTabs.push({ value: 'survey', label: 'Pesquisa', icon: BarChart })
  }
  if (formData.hasCustomWorkflow) {
    featureTabs.push({ value: 'workflow', label: 'Workflow', icon: GitBranch })
  }
  if (formData.hasAdvancedDocs) {
    featureTabs.push({ value: 'advanced-docs', label: 'Docs Inteligentes', icon: FileSearch })
  }
  if (formData.hasNotifications) {
    featureTabs.push({ value: 'notifications', label: 'Notificações', icon: Bell })
  }

  const allTabs = [...baseTabs, ...featureTabs]

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/servicos">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Editar Serviço</h1>
          <p className="text-gray-600 mt-1">
            Configure todas as informações e recursos do serviço
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={service.isActive ? 'default' : 'secondary'}>
            {service.isActive ? 'Ativo' : 'Inativo'}
          </Badge>
          {activeFeatures.length > 0 && (
            <Badge className="bg-purple-600 text-white">
              {activeFeatures.length} recurso{activeFeatures.length > 1 ? 's' : ''} ativo{activeFeatures.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-gray-200 mb-6">
          <div className="flex overflow-x-auto gap-2 pb-2">
            {allTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-transparent hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Aba: Informações Básicas */}
        <TabsContent value="basic" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <BasicInfoStep
                formData={formData}
                departments={departments}
                onChange={handleFieldChange}
                errors={errors}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Documentos */}
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <DocumentsStep
                formData={formData}
                onChange={handleFieldChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Formulário */}
        <TabsContent value="form-config" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Campos do Formulário</CardTitle>
              <CardDescription>
                Configure quais campos do cidadão serão pré-preenchidos e quais campos adicionais do serviço estarão disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormFieldsStep
                formData={formData}
                onChange={handleFieldChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Recursos Avançados */}
        <TabsContent value="features" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <FeaturesStep
                formData={formData}
                onChange={handleFieldChange}
              />
            </CardContent>
          </Card>

          {activeFeatures.length > 0 && (
            <Card className="mt-4 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-base text-green-900 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Recursos Configuráveis
                </CardTitle>
                <CardDescription className="text-green-700">
                  Use as abas acima para configurar cada recurso ativado:
                  {featureTabs.map((tab, idx) => (
                    <span key={tab.value}>
                      {idx > 0 && ', '}
                      <strong>{tab.label}</strong>
                    </span>
                  ))}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        {/* Aba: Campos do Formulário */}
        {(formData.hasCustomForm || formData.hasCustomFields) && (
          <TabsContent value="form-fields" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Campos do Formulário</CardTitle>
                <CardDescription>
                  Configure os campos que serão exibidos no formulário de solicitação do serviço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataCaptureStep
                  formData={formData}
                  onChange={handleFieldChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Aba: Localização */}
        {formData.hasLocation && (
          <TabsContent value="location" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Configuração de Localização
                </CardTitle>
                <CardDescription>
                  Configure como o serviço captura e utiliza informações de localização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 font-medium">
                    Configuração de Localização
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Em breve: Configurar captura de GPS, endereço, raio de atuação, validação por geofencing
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Aba: Agendamento */}
        {formData.hasScheduling && (
          <TabsContent value="scheduling" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Sistema de Agendamento
                </CardTitle>
                <CardDescription>
                  Configure horários disponíveis, duração das sessões e regras de agendamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 font-medium">
                    Sistema de Agendamento
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Em breve: Horários, slots, duração, limites, lembretes automáticos
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Aba: Pesquisa de Satisfação */}
        {formData.hasSurvey && (
          <TabsContent value="survey" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Pesquisa de Satisfação
                </CardTitle>
                <CardDescription>
                  Configure perguntas, escalas de avaliação e quando a pesquisa será enviada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 font-medium">
                    Pesquisa de Satisfação
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Em breve: NPS, CSAT, perguntas customizadas, trigger automático
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Aba: Workflow Customizado */}
        {formData.hasCustomWorkflow && (
          <TabsContent value="workflow" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Workflow Customizado
                </CardTitle>
                <CardDescription>
                  Defina etapas, aprovações, responsáveis e automações do fluxo de trabalho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 font-medium">
                    Workflow Customizado
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Em breve: Editor visual de workflow, etapas, aprovadores, SLAs
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Aba: Documentos Inteligentes */}
        {formData.hasAdvancedDocs && (
          <TabsContent value="advanced-docs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5" />
                  Documentos Inteligentes
                </CardTitle>
                <CardDescription>
                  Configure OCR, validação com IA e extração automática de dados dos documentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <FileSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 font-medium">
                    Documentos Inteligentes (IA)
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Em breve: OCR automático, validação por IA, extração de dados estruturados
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Aba: Notificações */}
        {formData.hasNotifications && (
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Sistema de Notificações
                </CardTitle>
                <CardDescription>
                  Configure templates, canais (Email, SMS, WhatsApp) e triggers automáticos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 font-medium">
                    Sistema de Notificações
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Em breve: Templates personalizados, multi-canal, triggers por evento
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Link href="/admin/servicos">
          <Button variant="outline">
            Cancelar
          </Button>
        </Link>

        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
