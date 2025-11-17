'use client'

import { useState } from 'react'
import { X, ChevronRight, AlertCircle, Lightbulb, BookOpen, Video, ExternalLink, Search } from 'lucide-react'
import type { HelpContent, HelpSection, HelpStep } from '@/src/types/help-system'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
  content: HelpContent
}

export function HelpModal({ isOpen, onClose, content }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFAQ, setShowFAQ] = useState(false)

  if (!isOpen) return null

  // Filtrar conteúdo pela busca
  const filteredSections = content.sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.steps.some(step =>
      step.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Renderizar seção ativa
  const renderSectionDetail = (section: HelpSection) => (
    <div className="space-y-6">
      <div className="flex items-start gap-4 pb-4 border-b">
        <div className="text-4xl">{section.emoji}</div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h3>
          <p className="text-gray-600">{section.description}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {section.steps.map((step, index) => (
          <div
            key={step.id}
            className={`border rounded-lg overflow-hidden transition-all ${
              activeStep === step.id ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
            }`}
          >
            <button
              onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
              className="w-full flex items-center gap-4 p-4 text-left bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{step.title}</h4>
              </div>
              <ChevronRight
                className={`text-gray-400 transition-transform ${
                  activeStep === step.id ? 'rotate-90' : ''
                }`}
                size={20}
              />
            </button>

            {activeStep === step.id && (
              <div className="p-6 bg-gray-50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                <p className="text-gray-700 leading-relaxed">{step.description}</p>

                {/* Imagem */}
                {step.image && (
                  <div className="rounded-lg overflow-hidden border">
                    <img src={step.image} alt={step.title} className="w-full" />
                  </div>
                )}

                {/* Vídeo */}
                {step.videoUrl && (
                  <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <Video className="text-purple-600" size={20} />
                    <a
                      href={step.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                      Assistir vídeo tutorial
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {/* Dicas */}
                {step.tips && step.tips.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="text-green-600" size={18} />
                      <h5 className="font-semibold text-green-900">Dicas Importantes</h5>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {step.tips.map((tip, i) => (
                        <li key={i} className="text-green-800 text-sm list-disc">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Avisos */}
                {step.warnings && step.warnings.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="text-amber-600" size={18} />
                      <h5 className="font-semibold text-amber-900">Atenção</h5>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {step.warnings.map((warning, i) => (
                        <li key={i} className="text-amber-800 text-sm list-disc">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Links relacionados */}
                {step.relatedLinks && step.relatedLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {step.relatedLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full"
                      >
                        {link.label}
                        <ExternalLink size={12} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FAQs da seção */}
      {section.faqs && section.faqs.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3">Perguntas Frequentes</h4>
          <div className="space-y-3">
            {section.faqs.map((faq, i) => (
              <details key={i} className="group">
                <summary className="font-medium text-blue-800 cursor-pointer hover:text-blue-900 list-none flex items-center gap-2">
                  <ChevronRight size={16} className="group-open:rotate-90 transition-transform" />
                  {faq.question}
                </summary>
                <p className="mt-2 ml-6 text-sm text-blue-700">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={28} />
                <h2 className="text-3xl font-bold">{content.pageTitle}</h2>
              </div>
              <p className="text-blue-100">{content.pageDescription}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Fechar ajuda"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar ajuda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-100 px-6 py-3 border-b flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveSection(null)
              setShowFAQ(false)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              !activeSection && !showFAQ
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Visão Geral
          </button>
          {content.sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id)
                setShowFAQ(false)
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeSection === section.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{section.emoji}</span>
              {section.title}
            </button>
          ))}
          {content.troubleshooting && content.troubleshooting.length > 0 && (
            <button
              onClick={() => {
                setActiveSection(null)
                setShowFAQ(true)
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                showFAQ
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Solução de Problemas
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!activeSection && !showFAQ && (
            <div className="space-y-6">
              {/* Quick Tips */}
              {content.quickTips && content.quickTips.length > 0 && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="text-yellow-600" size={24} />
                    <h3 className="text-xl font-bold text-yellow-900">Dicas Rápidas</h3>
                  </div>
                  <ul className="space-y-2">
                    {content.quickTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-yellow-800">
                        <span className="text-yellow-600 mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sections Overview */}
              <div className="grid md:grid-cols-2 gap-4">
                {filteredSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="text-left p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl group-hover:scale-110 transition-transform">
                        {section.emoji}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {section.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                        <div className="text-xs text-blue-600 font-medium">
                          {section.steps.length} passo{section.steps.length > 1 ? 's' : ''}
                        </div>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>

              {searchTerm && filteredSections.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">
                    Nenhum resultado encontrado para "{searchTerm}"
                  </p>
                </div>
              )}
            </div>
          )}

          {activeSection && (
            <>
              <button
                onClick={() => setActiveSection(null)}
                className="mb-4 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <ChevronRight className="rotate-180" size={18} />
                Voltar para visão geral
              </button>
              {renderSectionDetail(
                content.sections.find((s) => s.id === activeSection)!
              )}
            </>
          )}

          {showFAQ && content.troubleshooting && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Solução de Problemas Comuns
              </h3>
              {content.troubleshooting.map((item, i) => (
                <div
                  key={i}
                  className="border border-red-200 bg-red-50 rounded-lg p-5"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-2">
                        {item.problem}
                      </h4>
                      <p className="text-red-800 text-sm">{item.solution}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t text-center text-sm text-gray-600">
          Precisa de mais ajuda? Entre em contato com o suporte técnico
        </div>
      </div>
    </div>
  )
}
