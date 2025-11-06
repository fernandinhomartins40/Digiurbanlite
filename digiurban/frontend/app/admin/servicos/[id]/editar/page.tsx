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
import { FeaturesStep } from '@/components/admin/services/steps/FeaturesStep'
import {
  ArrowLeft,
  Save,
  FileText,
  Sparkles,
  Settings,
  Loader2,
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
  requiredDocuments: string[] | null
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
  requiredDocuments: string[]
  hasCustomForm: boolean
  hasLocation: boolean
  hasScheduling: boolean
  hasSurvey: boolean
  hasCustomWorkflow: boolean
  hasCustomFields: boolean
  hasAdvancedDocs: boolean
  hasNotifications: boolean
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Informações Básicas
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Recursos Avançados
          </TabsTrigger>
        </TabsList>

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
            <Card className="mt-4 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações Detalhadas dos Recursos
                </CardTitle>
                <CardDescription className="text-blue-700">
                  As configurações específicas de cada recurso (formulários, workflows, etc.) serão
                  implementadas em versões futuras desta interface. Por enquanto, os recursos ficam
                  ativados e podem ser configurados via API.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
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
