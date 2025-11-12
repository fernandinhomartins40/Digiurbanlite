'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GitBranch, Info } from 'lucide-react'

interface WorkflowConfigProps {
  formData: any
  onChange: (field: string, value: any) => void
}

export function WorkflowConfig({ formData, onChange }: WorkflowConfigProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Workflow Customizado
          </CardTitle>
          <CardDescription>
            Configure fluxo de trabalho personalizado com etapas e aprovações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-12 text-center border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50">
            <GitBranch className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
            <p className="text-sm text-indigo-900 font-medium">Editor Visual de Workflow</p>
            <p className="text-xs text-indigo-700 mt-2 max-w-md mx-auto">
              O editor completo de workflows estará disponível após a criação do serviço,
              onde você poderá criar etapas, transições, aprovações e automações de forma visual.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm text-blue-900 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Funcionalidades do Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-xs text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Criar etapas personalizadas com SLA e responsáveis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Definir transições e condições entre etapas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Configurar aprovações multi-nível por cargo/usuário</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Automações por etapa (notificações, mudanças de status)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Visualização em diagrama de fluxo</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
