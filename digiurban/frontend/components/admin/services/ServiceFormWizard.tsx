'use client'

import { useState, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WizardStep {
  id: string
  title: string
  description: string
  icon: ReactNode
  isValid?: () => boolean
  isOptional?: boolean
}

interface ServiceFormWizardProps {
  steps: WizardStep[]
  currentStep: number
  onStepChange: (step: number) => void
  onSubmit: () => void
  onCancel: () => void
  children: ReactNode[]
  isSubmitting?: boolean
  canGoNext?: boolean
}

export function ServiceFormWizard({
  steps,
  currentStep,
  onStepChange,
  onSubmit,
  onCancel,
  children,
  isSubmitting = false,
  canGoNext = true,
}: ServiceFormWizardProps) {
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  const handleNext = () => {
    if (!isLastStep && canGoNext) {
      onStepChange(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    // Permitir navegar para steps anteriores ou para o próximo step se válido
    if (stepIndex < currentStep || (stepIndex === currentStep + 1 && canGoNext)) {
      onStepChange(stepIndex)
    }
  }

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed'
    if (stepIndex === currentStep) return 'current'
    return 'upcoming'
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index)
            const isClickable = index < currentStep || (index === currentStep + 1 && canGoNext)

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                {/* Step Circle */}
                <button
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable && index !== currentStep}
                  className={cn(
                    'relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all',
                    status === 'completed' && 'bg-primary border-primary text-white',
                    status === 'current' && 'bg-white border-primary text-primary ring-4 ring-primary/20',
                    status === 'upcoming' && 'bg-white border-gray-300 text-gray-400',
                    isClickable && 'cursor-pointer hover:scale-105',
                    !isClickable && index !== currentStep && 'cursor-not-allowed'
                  )}
                >
                  {status === 'completed' ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <span className="text-lg font-semibold">{index + 1}</span>
                  )}
                </button>

                {/* Step Label */}
                <div className="mt-2 text-center max-w-[120px]">
                  <p className={cn(
                    'text-sm font-medium',
                    status === 'current' && 'text-primary',
                    status === 'completed' && 'text-gray-700',
                    status === 'upcoming' && 'text-gray-400'
                  )}>
                    {step.title}
                  </p>
                  {status === 'current' && (
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  )}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-6 h-0.5 transition-all',
                      status === 'completed' ? 'bg-primary' : 'bg-gray-300'
                    )}
                    style={{
                      left: `${((index + 1) / steps.length) * 100}%`,
                      right: `${((steps.length - index - 1) / steps.length) * 100}%`,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          <div className="min-h-[400px]">
            {children[currentStep]}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={isFirstStep ? onCancel : handleBack}
          disabled={isSubmitting}
        >
          {isFirstStep ? (
            'Cancelar'
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </>
          )}
        </Button>

        <div className="flex items-center gap-2">
          {!isLastStep && (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext || isSubmitting}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {isLastStep && (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Criando...
                </>
              ) : (
                'Criar Serviço'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
