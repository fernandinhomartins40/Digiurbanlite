'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
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
  serviceType: 'INFORMATIVO' | 'COM_DADOS'

  // Documentos
  requiresDocuments: boolean
  requiredDocuments: string[]

  // NOVO: Campos para serviços COM_DADOS
  moduleType: string // Ex: "MATRICULA_ALUNO", "ATENDIMENTOS_SAUDE"
  formSchema: any // JSON Schema do formulário customizado
}

export default function NewServicePage() {
  const router = useRouter()
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
    serviceType: 'INFORMATIVO', // Padrão: serviço informativo
    requiresDocuments: false,
    requiredDocuments: [],
    moduleType: '', // Vazio por padrão
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
        return formData.serviceType === 'INFORMATIVO' || formData.serviceType === 'COM_DADOS'
      },
    },
    {
      id: 'dataCapture',
      title: 'Captura de Dados',
      description: 'Configure o formulário',
      icon: <Database className="h-5 w-5" />,
      isOptional: formData.serviceType === 'INFORMATIVO',
      isValid: () => {
        if (formData.serviceType === 'INFORMATIVO') return true
        return formData.moduleType !== '' && formData.formSchema !== null
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
      const response = await apiRequest('/api/admin/management/departments')
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
        payload.moduleType = formData.moduleType
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
                    {formData.serviceType === 'INFORMATIVO' ? 'Informativo' : 'Com Captura de Dados'}
                  </dd>
                </div>
                {formData.serviceType === 'COM_DADOS' && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Módulo:</dt>
                    <dd className="font-medium">{formData.moduleType}</dd>
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
