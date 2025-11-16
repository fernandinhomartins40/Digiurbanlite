/**
 * Sistema de Ajuda Inteligente - Tipos
 * Define a estrutura de conteúdo de ajuda para toda a aplicação
 */

export interface HelpStep {
  id: string
  title: string
  description: string
  icon?: string
  image?: string
  videoUrl?: string
  tips?: string[]
  warnings?: string[]
  relatedLinks?: { label: string; url: string }[]
}

export interface HelpSection {
  id: string
  title: string
  emoji: string
  description: string
  steps: HelpStep[]
  faqs?: HelpFAQ[]
}

export interface HelpFAQ {
  question: string
  answer: string
  relatedSteps?: string[]
}

export interface HelpContent {
  pageTitle: string
  pageDescription: string
  sections: HelpSection[]
  quickTips?: string[]
  troubleshooting?: {
    problem: string
    solution: string
  }[]
}

export interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
  content: HelpContent
}
