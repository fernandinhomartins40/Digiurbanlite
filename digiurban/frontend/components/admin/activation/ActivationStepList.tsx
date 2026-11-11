'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import type { ActivationStep } from './useActivation'

export function ActivationStepList({ steps }: { steps: ActivationStep[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {steps.map((step) => {
        const body = (
          <div className="flex items-start gap-3 p-3">
            {step.feito ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-label="Feito" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-label="Falta fazer" />
            )}
            <div className="min-w-0 flex-1">
              <p className={step.feito ? 'font-medium text-muted-foreground line-through' : 'font-medium'}>{step.titulo}</p>
              <p className="text-sm text-muted-foreground">{step.texto}</p>
            </div>
            {step.link && !step.feito && <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}
          </div>
        )
        return (
          <li key={step.key}>
            {step.link && !step.feito ? (
              <Link href={step.link} className="block hover:bg-muted/50">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        )
      })}
    </ul>
  )
}
