'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, X, BarChart } from 'lucide-react'

interface SurveyConfigProps {
  formData: any
  onChange: (field: string, value: any) => void
}

export function SurveyConfig({ formData, onChange }: SurveyConfigProps) {
  const config = formData.surveyConfig || {
    title: 'Pesquisa de Satisfação',
    description: '',
    type: 'satisfaction',
    timing: 'after',
    showAfterDays: 0,
    isRequired: false,
    allowAnonymous: true,
    allowComments: true,
    questions: [],
  }

  const updateConfig = (updates: any) => {
    onChange('surveyConfig', { ...config, ...updates })
  }

  const addQuestion = () => {
    const newQuestion = {
      id: `q_${Date.now()}`,
      type: 'scale',
      label: 'Nova Pergunta',
      required: false,
      min: 1,
      max: 5,
    }
    updateConfig({ questions: [...config.questions, newQuestion] })
  }

  const removeQuestion = (questionId: string) => {
    updateConfig({ questions: config.questions.filter((q: any) => q.id !== questionId) })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Informações da Pesquisa
          </CardTitle>
          <CardDescription>Configure os dados básicos da pesquisa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="surveyTitle" className="text-xs">Título</Label>
            <Input
              id="surveyTitle"
              value={config.title}
              onChange={(e) => updateConfig({ title: e.target.value })}
              placeholder="Ex: Pesquisa de Satisfação"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surveyDesc" className="text-xs">Descrição</Label>
            <Input
              id="surveyDesc"
              value={config.description}
              onChange={(e) => updateConfig({ description: e.target.value })}
              placeholder="Breve descrição da pesquisa"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surveyType" className="text-xs">Tipo de Pesquisa</Label>
            <Select value={config.type} onValueChange={(value) => updateConfig({ type: value })}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="satisfaction">Satisfação (CSAT)</SelectItem>
                <SelectItem value="nps">Net Promoter Score (NPS)</SelectItem>
                <SelectItem value="feedback">Feedback Geral</SelectItem>
                <SelectItem value="custom">Personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quando Exibir</CardTitle>
          <CardDescription>Defina o momento da pesquisa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={config.timing} onValueChange={(value) => updateConfig({ timing: value })}>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="before" id="timing-before" />
              <Label htmlFor="timing-before" className="cursor-pointer flex-1">
                <div>
                  <p className="font-medium">Antes da Solicitação</p>
                  <p className="text-xs text-gray-500">Ao criar o protocolo</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="after" id="timing-after" />
              <Label htmlFor="timing-after" className="cursor-pointer flex-1">
                <div>
                  <p className="font-medium">Após Conclusão</p>
                  <p className="text-xs text-gray-500">Quando o serviço for concluído</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="both" id="timing-both" />
              <Label htmlFor="timing-both" className="cursor-pointer flex-1">
                <div>
                  <p className="font-medium">Antes e Depois</p>
                  <p className="text-xs text-gray-500">Nos dois momentos</p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {(config.timing === 'after' || config.timing === 'both') && (
            <div className="space-y-2 pl-6 border-l-2 border-orange-200">
              <Label htmlFor="afterDays" className="text-xs">Dias após conclusão</Label>
              <Input
                id="afterDays"
                type="number"
                min="0"
                value={config.showAfterDays}
                onChange={(e) => updateConfig({ showAfterDays: parseInt(e.target.value) || 0 })}
                className="w-32 text-sm"
              />
              <p className="text-xs text-gray-500">
                0 = imediatamente após conclusão
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurações</CardTitle>
          <CardDescription>Opções de preenchimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <Checkbox
              id="surveyRequired"
              checked={config.isRequired}
              onCheckedChange={(checked) => updateConfig({ isRequired: checked })}
            />
            <Label htmlFor="surveyRequired" className="cursor-pointer flex-1">
              <div>
                <p className="font-medium text-sm">Pesquisa obrigatória</p>
                <p className="text-xs text-gray-500">Cidadão deve responder</p>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <Checkbox
              id="allowAnonymous"
              checked={config.allowAnonymous}
              onCheckedChange={(checked) => updateConfig({ allowAnonymous: checked })}
            />
            <Label htmlFor="allowAnonymous" className="cursor-pointer flex-1">
              <div>
                <p className="font-medium text-sm">Permitir respostas anônimas</p>
                <p className="text-xs text-gray-500">Não identificar o respondente</p>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <Checkbox
              id="allowComments"
              checked={config.allowComments}
              onCheckedChange={(checked) => updateConfig({ allowComments: checked })}
            />
            <Label htmlFor="allowComments" className="cursor-pointer flex-1">
              <div>
                <p className="font-medium text-sm">Permitir comentários</p>
                <p className="text-xs text-gray-500">Campo de texto livre</p>
              </div>
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Perguntas</CardTitle>
              <CardDescription>
                {config.questions.length} pergunta{config.questions.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button onClick={addQuestion} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {config.questions.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm text-gray-600">Nenhuma pergunta adicionada</p>
              <p className="text-xs text-gray-500 mt-1">
                Pesquisas padrão já incluem perguntas básicas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {config.questions.map((question: any, index: number) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{index + 1}. {question.label}</span>
                        <Badge variant="outline" className="text-xs">{question.type}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
