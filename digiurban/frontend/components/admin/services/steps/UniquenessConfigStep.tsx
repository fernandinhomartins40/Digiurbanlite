'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Info, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UniquenessConfigStepProps {
  formData: {
    serviceType: string
    moduleType: string
    allowMultipleActiveProtocols: boolean | null
    uniquenessScope: string
    uniquenessRules: any
  }
  onChange: (field: string, value: any) => void
  errors?: Record<string, string>
}

export function UniquenessConfigStep({ formData, onChange, errors }: UniquenessConfigStepProps) {
  const handleAllowMultipleChange = (value: string) => {
    const allowMultiple = value === 'true'
    onChange('allowMultipleActiveProtocols', allowMultiple)

    // Se permite múltiplos, limpar campos relacionados
    if (allowMultiple) {
      onChange('uniquenessScope', '')
      onChange('uniquenessRules', null)
    } else {
      // Se não permite múltiplos, definir escopo padrão baseado no tipo de serviço
      if (formData.serviceType === 'COM_DADOS' && formData.moduleType) {
        onChange('uniquenessScope', 'CUSTOM')
        onChange('uniquenessRules', {
          moduleType: formData.moduleType,
          validationFunction: `validate${formData.moduleType.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join('')}`
        })
      } else {
        onChange('uniquenessScope', 'CITIZEN')
      }
    }
  }

  const handleScopeChange = (value: string) => {
    onChange('uniquenessScope', value)

    // Configurar uniquenessRules baseado no escopo
    if (value === 'CUSTOM' && formData.moduleType) {
      onChange('uniquenessRules', {
        moduleType: formData.moduleType,
        validationFunction: `validate${formData.moduleType.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join('')}`
      })
    } else if (value === 'CITIZEN_PER_FIELD') {
      onChange('uniquenessRules', {
        field: '',
        fieldLabel: '',
        errorMessage: ''
      })
    } else {
      onChange('uniquenessRules', null)
    }
  }

  const handleRulesFieldChange = (field: string, value: any) => {
    onChange('uniquenessRules', {
      ...(formData.uniquenessRules || {}),
      [field]: value
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-purple-900">Configuração de Unicidade de Protocolos</p>
          <p className="text-xs text-purple-700 mt-1">
            Defina se o cidadão pode ter múltiplos protocolos ativos deste serviço simultaneamente.
            Esta configuração é <strong>obrigatória</strong> para todos os serviços.
          </p>
        </div>
      </div>

      {/* Seção 1: Permitir Múltiplos Protocolos */}
      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Este serviço permite múltiplos protocolos ativos? <span className="text-red-500">*</span>
          </Label>

          <RadioGroup
            value={formData.allowMultipleActiveProtocols === null ? '' : String(formData.allowMultipleActiveProtocols)}
            onValueChange={handleAllowMultipleChange}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
              <RadioGroupItem value="true" id="allow-multiple-yes" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="allow-multiple-yes" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Sim, permite múltiplos protocolos</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    O cidadão pode criar vários protocolos ativos deste serviço ao mesmo tempo.
                    <br />
                    <strong>Exemplos:</strong> Solicitações (pedidos de poda, limpeza), Inscrições (cursos, eventos),
                    Cadastros relacionais (múltiplas propriedades, múltiplos eventos).
                  </p>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors">
              <RadioGroupItem value="false" id="allow-multiple-no" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="allow-multiple-no" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Não, apenas 1 protocolo ativo por vez</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    O cidadão só pode ter 1 protocolo ativo deste serviço. Não pode criar outro até concluir o primeiro.
                    <br />
                    <strong>Exemplos:</strong> Cadastros de identidade/status (Produtor Rural, Professor, MEI, CadÚnico).
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>

          {errors?.allowMultipleActiveProtocols && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.allowMultipleActiveProtocols}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Seção 2: Configuração de Unicidade (apenas se não permite múltiplos) */}
      {formData.allowMultipleActiveProtocols === false && (
        <div className="space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-900">Configuração Avançada de Unicidade</p>
              <p className="text-xs text-orange-700 mt-1">
                Como este serviço não permite múltiplos protocolos, configure o escopo de validação.
              </p>
            </div>
          </div>

          {/* Escopo de Validação */}
          <div className="space-y-2">
            <Label htmlFor="uniquenessScope">
              Escopo de Validação <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.uniquenessScope || ''}
              onValueChange={handleScopeChange}
            >
              <SelectTrigger className={errors?.uniquenessScope ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione o escopo de validação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CITIZEN">
                  <div className="flex flex-col items-start py-1">
                    <span className="font-medium">CITIZEN - Por Cidadão</span>
                    <span className="text-xs text-gray-600">1 protocolo ativo por cidadão, validação simples por serviceId</span>
                  </div>
                </SelectItem>
                <SelectItem value="CUSTOM">
                  <div className="flex flex-col items-start py-1">
                    <span className="font-medium">CUSTOM - Por Módulo (Recomendado)</span>
                    <span className="text-xs text-gray-600">1 protocolo ativo por cidadão, validação por moduleType</span>
                  </div>
                </SelectItem>
                <SelectItem value="CITIZEN_PER_FIELD">
                  <div className="flex flex-col items-start py-1">
                    <span className="font-medium">CITIZEN_PER_FIELD - Por Campo Específico</span>
                    <span className="text-xs text-gray-600">Validação por valor de campo (ex: CPF de dependente)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors?.uniquenessScope && (
              <p className="text-xs text-red-500">{errors.uniquenessScope}</p>
            )}

            {/* Explicação do escopo selecionado */}
            {formData.uniquenessScope === 'CITIZEN' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Escopo CITIZEN:</strong> O sistema verificará se o cidadão já possui um protocolo ativo
                  deste serviço específico. Não valida por moduleType.
                </AlertDescription>
              </Alert>
            )}
            {formData.uniquenessScope === 'CUSTOM' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Escopo CUSTOM (Recomendado):</strong> O sistema verificará se o cidadão já possui um protocolo ativo
                  com o mesmo <strong>moduleType</strong> ({formData.moduleType || 'não definido'}).
                  Este é o método mais robusto para cadastros de identidade.
                </AlertDescription>
              </Alert>
            )}
            {formData.uniquenessScope === 'CITIZEN_PER_FIELD' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Escopo CITIZEN_PER_FIELD:</strong> O sistema verificará se o cidadão já possui um protocolo ativo
                  com o mesmo valor em um campo específico do formulário. Configure o campo abaixo.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Configuração de Regras (CUSTOM) */}
          {formData.uniquenessScope === 'CUSTOM' && (
            <div className="space-y-3 p-3 bg-white border border-gray-200 rounded">
              <p className="text-xs font-medium text-gray-700">Regras de Validação Customizada</p>

              <div className="space-y-2">
                <Label htmlFor="rules-moduleType" className="text-xs">Module Type</Label>
                <Input
                  id="rules-moduleType"
                  value={formData.uniquenessRules?.moduleType || formData.moduleType || ''}
                  onChange={(e) => handleRulesFieldChange('moduleType', e.target.value)}
                  placeholder="Ex: CADASTRO_PRODUTOR"
                  className="text-sm"
                  disabled
                />
                <p className="text-xs text-gray-500">Preenchido automaticamente com o moduleType do serviço</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules-validationFunction" className="text-xs">Função de Validação</Label>
                <Input
                  id="rules-validationFunction"
                  value={formData.uniquenessRules?.validationFunction || ''}
                  onChange={(e) => handleRulesFieldChange('validationFunction', e.target.value)}
                  placeholder="Ex: validateCadastroProdutor"
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">Nome da função de validação (opcional, apenas para referência)</p>
              </div>
            </div>
          )}

          {/* Configuração de Regras (CITIZEN_PER_FIELD) */}
          {formData.uniquenessScope === 'CITIZEN_PER_FIELD' && (
            <div className="space-y-3 p-3 bg-white border border-gray-200 rounded">
              <p className="text-xs font-medium text-gray-700">Configuração de Campo de Validação</p>

              <div className="space-y-2">
                <Label htmlFor="rules-field" className="text-xs">
                  Campo do Formulário <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rules-field"
                  value={formData.uniquenessRules?.field || ''}
                  onChange={(e) => handleRulesFieldChange('field', e.target.value)}
                  placeholder="Ex: cpfDependente"
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">ID do campo no customData que será validado</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules-fieldLabel" className="text-xs">Label do Campo</Label>
                <Input
                  id="rules-fieldLabel"
                  value={formData.uniquenessRules?.fieldLabel || ''}
                  onChange={(e) => handleRulesFieldChange('fieldLabel', e.target.value)}
                  placeholder="Ex: CPF do Dependente"
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">Nome amigável do campo para mensagens de erro</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules-errorMessage" className="text-xs">Mensagem de Erro Customizada</Label>
                <Textarea
                  id="rules-errorMessage"
                  value={formData.uniquenessRules?.errorMessage || ''}
                  onChange={(e) => handleRulesFieldChange('errorMessage', e.target.value)}
                  placeholder="Ex: Você já possui uma solicitação ativa para este dependente."
                  className="text-sm resize-none"
                  rows={2}
                />
                <p className="text-xs text-gray-500">Mensagem que será exibida ao cidadão caso já exista protocolo ativo</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resumo da Configuração */}
      {formData.allowMultipleActiveProtocols !== null && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <p className="text-sm font-medium text-blue-900">Resumo da Configuração:</p>
            <ul className="text-xs text-blue-800 mt-2 space-y-1">
              <li>
                • <strong>Permite múltiplos:</strong> {formData.allowMultipleActiveProtocols ? 'Sim' : 'Não'}
              </li>
              {!formData.allowMultipleActiveProtocols && formData.uniquenessScope && (
                <li>
                  • <strong>Escopo de validação:</strong> {formData.uniquenessScope}
                </li>
              )}
              {!formData.allowMultipleActiveProtocols && formData.uniquenessScope === 'CUSTOM' && formData.moduleType && (
                <li>
                  • <strong>Valida por moduleType:</strong> {formData.moduleType}
                </li>
              )}
              {!formData.allowMultipleActiveProtocols && formData.uniquenessScope === 'CITIZEN_PER_FIELD' && formData.uniquenessRules?.field && (
                <li>
                  • <strong>Valida por campo:</strong> {formData.uniquenessRules.field}
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
