'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import { readPrefillParams, hasPrefillData } from '@/utils/service-prefill'
import { ServiceFormWizard, WizardStep } from '@/components/admin/services/ServiceFormWizard'
import { BasicInfoStep } from '@/components/admin/services/steps/BasicInfoStep'
import { ServiceTypeStep } from '@/components/admin/services/steps/ServiceTypeStep'
import { DataCaptureStep } from '@/components/admin/services/steps/DataCaptureStep'
import { DocumentsStep } from '@/components/admin/services/steps/DocumentsStep'
import {
  FileText,
  Database,
  Layers,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Department {
  id: string
  name: string
  code?: string
}

interface ServiceFormData {
  // Básico
  name: string
  description: string
  category: string
  departmentId: string
  estimatedDays: string
  priority: number
  icon: string
  color: string

  // NOVO: Tipo simplificado (alinhado com backend)
  serviceType: 'SEM_DADOS' | 'COM_DADOS'

  // Documentos
  requiresDocuments: boolean
  requiredDocuments: string[]

  // NOVO: Campos para serviços COM_DADOS (gerado automaticamente)
  moduleType: string // Gerado automaticamente baseado no nome
  formSchema: any // JSON Schema do formulário customizado
}

export default function NewServicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState(0)
  const [departments, setDepartments] = useState<Department[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    serviceType: 'SEM_DADOS', // Padrão: serviço sem dados
    requiresDocuments: false,
    requiredDocuments: [],
    moduleType: '', // Gerado automaticamente
    formSchema: null, // Vazio por padrão
  })

  const validateBasicStep = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Departamento é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const steps: WizardStep[] = [
    {
      id: 'basic',
      title: 'Informações Básicas',
      description: 'Nome, categoria e departamento',
      icon: <FileText className="h-5 w-5" />,
      isValid: () => {
        return formData.name.trim() !== '' && formData.departmentId !== ''
      },
    },
    {
      id: 'serviceType',
      title: 'Tipo de Serviço',
      description: 'Informativo ou com dados',
      icon: <Layers className="h-5 w-5" />,
      isValid: () => {
        return formData.serviceType === 'SEM_DADOS' || formData.serviceType === 'COM_DADOS'
      },
    },
    {
      id: 'dataCapture',
      title: 'Captura de Dados',
      description: 'Configure o formulário',
      icon: <Database className="h-5 w-5" />,
      isOptional: formData.serviceType === 'SEM_DADOS',
      isValid: () => {
        if (formData.serviceType === 'SEM_DADOS') return true
        return formData.formSchema !== null && formData.formSchema.fields?.length > 0
      },
    },
    {
      id: 'documents',
      title: 'Documentos',
      description: 'Documentação necessária',
      icon: <FileText className="h-5 w-5" />,
      isOptional: true,
    },
    {
      id: 'review',
      title: 'Revisão',
      description: 'Revisar e finalizar',
      icon: <CheckCircle className="h-5 w-5" />,
    },
  ]

  // Carregar departamentos
  const loadDepartments = async () => {
    try {
      const response = await apiRequest('/api/admin/departments')
      setDepartments(response.departments || response.data?.departments || [])
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error)
      toast({
        title: 'Erro ao carregar departamentos',
        description: 'Não foi possível carregar a lista de departamentos.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadDepartments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ✅ NOVO: Ler parâmetros de pré-preenchimento da URL
  useEffect(() => {
    if (!searchParams || !hasPrefillData(searchParams)) {
      return
    }

    const prefillData = readPrefillParams(searchParams)

    // Aplicar dados de pré-preenchimento ao formData
    setFormData((prev) => {
      const updated: any = { ...prev }

      if (prefillData.name) updated.name = prefillData.name
      if (prefillData.description) updated.description = prefillData.description
      if (prefillData.category) updated.category = prefillData.category
      if (prefillData.estimatedDays) updated.estimatedDays = prefillData.estimatedDays.toString()
      if (prefillData.requiresDocuments !== undefined) updated.requiresDocuments = prefillData.requiresDocuments
      if (prefillData.formSchema) updated.formSchema = prefillData.formSchema

      return updated
    })

    // Mostrar notificação de pré-preenchimento
    toast({
      title: 'Formulário pré-preenchido',
      description: 'Os campos foram preenchidos automaticamente com base na sugestão selecionada.',
    })
  }, [searchParams, toast])

  // ✅ NOVO: Aplicar departmentCode da URL ao departmentId quando os departamentos carregarem
  useEffect(() => {
    if (departments.length === 0 || !searchParams) return

    const departmentCode = searchParams.get('departmentCode')
    const serviceType = searchParams.get('serviceType')

    if (departmentCode) {
      const department = departments.find((d) => d.code === departmentCode)
      if (department) {
        setFormData((prev) => ({ ...prev, departmentId: department.id }))
      }
    }

    if (serviceType === 'COM_DADOS') {
      setFormData((prev) => ({ ...prev, serviceType: 'COM_DADOS' }))
    }
  }, [departments, searchParams])

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Limpar erro do campo se existir
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleStepChange = (step: number) => {
    // Validar step atual antes de avançar
    if (step > currentStep) {
      // Validar step básico
      if (currentStep === 0 && !validateBasicStep()) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha todos os campos obrigatórios antes de continuar.',
          variant: 'destructive',
        })
        return
      }
    }

    setCurrentStep(step)
  }

  const handleSubmit = async () => {
    // Validação final
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
      const payload: any = {
        // Básico
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        departmentId: formData.departmentId,
        serviceType: formData.serviceType,
        requiresDocuments: formData.requiresDocuments,
        requiredDocuments: formData.requiredDocuments.length > 0 ? formData.requiredDocuments : null,
        estimatedDays: formData.estimatedDays ? parseInt(formData.estimatedDays) : null,
        priority: formData.priority,
        icon: formData.icon || null,
        color: formData.color || null,
      }

      // Adicionar campos de captura de dados se COM_DADOS
      if (formData.serviceType === 'COM_DADOS') {
        // Gerar moduleType automaticamente baseado no nome do serviço
        const moduleType = formData.name
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^A-Z0-9]/g, '_') // Substitui não alfanuméricos por underscore
          .replace(/_+/g, '_') // Remove underscores duplicados
          .replace(/^_|_$/g, '') // Remove underscores no início/fim

        payload.moduleType = moduleType
        payload.formSchema = formData.formSchema
      }

      const response = await apiRequest('/api/services', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      toast({
        title: 'Serviço criado com sucesso!',
        description: `O serviço "${formData.name}" foi criado e está ativo.`,
      })

      router.push('/admin/servicos')
    } catch (error: any) {
      console.error('Erro ao criar serviço:', error)
      toast({
        title: 'Erro ao criar serviço',
        description: error?.message || 'Ocorreu um erro ao criar o serviço.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canGoNext = () => {
    const currentStepData = steps[currentStep]
    if (currentStepData.isValid) {
      return currentStepData.isValid()
    }
    return true
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
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
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Criar Novo Serviço</h1>
          <p className="text-gray-600 mt-1">
            Configure todas as informações e recursos do serviço em um único lugar
          </p>
        </div>
      </div>

      {/* Wizard */}
      <ServiceFormWizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/servicos')}
        isSubmitting={isSubmitting}
        canGoNext={canGoNext()}
      >
        {/* Step 1: Informações Básicas */}
        <BasicInfoStep
          formData={formData}
          departments={departments}
          onChange={handleFieldChange}
          errors={errors}
        />

        {/* Step 2: Tipo de Serviço */}
        <ServiceTypeStep
          formData={formData}
          onChange={handleFieldChange}
        />

        {/* Step 3: Captura de Dados (só se COM_DADOS) */}
        <DataCaptureStep
          formData={formData}
          onChange={handleFieldChange}
        />

        {/* Step 4: Documentos */}
        <DocumentsStep
          formData={formData}
          onChange={handleFieldChange}
        />

        {/* Step 5: Revisão */}
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Pronto para criar!</h2>
            <p className="text-gray-600 mt-2">
              Revise as informações abaixo antes de finalizar
            </p>
          </div>

          <div className="grid gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Informações Básicas</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Nome:</dt>
                  <dd className="font-medium">{formData.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Tipo:</dt>
                  <dd className="font-medium">
                    {formData.serviceType === 'SEM_DADOS' ? 'Sem Captura de Dados' : 'Com Captura de Dados'}
                  </dd>
                </div>
                {formData.serviceType === 'COM_DADOS' && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Módulo:</dt>
                    <dd className="font-medium text-xs bg-gray-100 px-2 py-1 rounded">
                      {formData.name
                        .toUpperCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^A-Z0-9]/g, '_')
                        .replace(/_+/g, '_')
                        .replace(/^_|_$/g, '') || 'GERADO_AUTOMATICAMENTE'}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {formData.serviceType === 'COM_DADOS' && formData.formSchema?.fields && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Campos do Formulário</h3>
                <ul className="space-y-1 text-sm">
                  {formData.formSchema.fields.map((field: any) => (
                    <li key={field.id} className="flex items-center gap-2">
                      <span className="text-gray-600">•</span>
                      <span>{field.label}</span>
                      {field.required && <span className="text-red-500">*</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </ServiceFormWizard>
    </div>
  )
}
