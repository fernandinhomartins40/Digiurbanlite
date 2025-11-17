'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordStrengthIndicatorProps {
  password: string
  confirmPassword?: string
  showConfirmation?: boolean
  className?: string
}

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const requirements: PasswordRequirement[] = [
  {
    label: 'Mínimo 8 caracteres',
    test: (password) => password.length >= 8,
  },
  {
    label: 'Pelo menos uma letra maiúscula (A-Z)',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'Pelo menos uma letra minúscula (a-z)',
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: 'Pelo menos um número (0-9)',
    test: (password) => /\d/.test(password),
  },
  {
    label: 'Pelo menos um caractere especial (!@#$%^&*)',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
]

export function PasswordStrengthIndicator({
  password,
  confirmPassword,
  showConfirmation = false,
  className,
}: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState(0)
  const [passwordsMatch, setPasswordsMatch] = useState(false)

  useEffect(() => {
    const passedRequirements = requirements.filter((req) => req.test(password)).length
    setStrength((passedRequirements / requirements.length) * 100)
  }, [password])

  useEffect(() => {
    if (showConfirmation && confirmPassword) {
      setPasswordsMatch(password === confirmPassword && password.length > 0)
    }
  }, [password, confirmPassword, showConfirmation])

  const getStrengthColor = () => {
    if (strength === 0) return 'bg-gray-200'
    if (strength < 40) return 'bg-red-500'
    if (strength < 60) return 'bg-orange-500'
    if (strength < 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthLabel = () => {
    if (strength === 0) return ''
    if (strength < 40) return 'Senha fraca'
    if (strength < 60) return 'Senha moderada'
    if (strength < 80) return 'Senha boa'
    return 'Senha forte'
  }

  const isPasswordValid = strength === 100

  if (!password) return null

  return (
    <div className={cn('space-y-3', className)}>
      {/* Barra de força da senha */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Força da senha</span>
          <span
            className={cn(
              'font-medium',
              strength < 40 && 'text-red-500',
              strength >= 40 && strength < 60 && 'text-orange-500',
              strength >= 60 && strength < 80 && 'text-yellow-600',
              strength >= 80 && 'text-green-600'
            )}
          >
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', getStrengthColor())}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Requisitos da senha */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Requisitos:</p>
        <ul className="space-y-1.5">
          {requirements.map((requirement, index) => {
            const isPassed = requirement.test(password)
            return (
              <li
                key={index}
                className={cn(
                  'flex items-center gap-2 text-xs transition-colors',
                  isPassed ? 'text-green-600' : 'text-muted-foreground'
                )}
              >
                {isPassed ? (
                  <Check className="h-3.5 w-3.5 flex-shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                )}
                <span>{requirement.label}</span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Verificação de confirmação de senha */}
      {showConfirmation && confirmPassword && (
        <div
          className={cn(
            'flex items-center gap-2 text-xs p-2 rounded-md border',
            passwordsMatch
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          )}
        >
          {passwordsMatch ? (
            <>
              <Check className="h-3.5 w-3.5 flex-shrink-0" />
              <span>As senhas coincidem</span>
            </>
          ) : (
            <>
              <X className="h-3.5 w-3.5 flex-shrink-0" />
              <span>As senhas não coincidem</span>
            </>
          )}
        </div>
      )}

      {/* Indicador final de validação */}
      {isPasswordValid && (!showConfirmation || passwordsMatch) && (
        <div className="flex items-center gap-2 text-xs p-2 rounded-md border bg-green-50 border-green-200 text-green-700">
          <Check className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-medium">Senha válida! ✓</span>
        </div>
      )}
    </div>
  )
}
