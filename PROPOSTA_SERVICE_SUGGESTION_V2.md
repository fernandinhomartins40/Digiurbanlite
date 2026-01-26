# Proposta: ServiceSuggestion V2

## Problema Atual

A interface `ServiceSuggestion` está desalinhada com a nova arquitetura de `ServiceDefinition` introduzida nos seeds do backend. Isso dificulta a conversão de sugestões em serviços reais e perde informações críticas de classificação.

---

## Comparação: Situação Atual vs Proposta

### Interface Atual (ServiceSuggestion)

```typescript
// Localização: digiurban/frontend/lib/suggestions/types.ts

export interface FormFieldSuggestion {
  name: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'cpf' | 'cnpj' | 'cep' | 'checkbox';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ServiceSuggestion {
  id: string;
  name: string;
  description: string;
  icon: string;
  suggestedFields: FormFieldSuggestion[];
  category: string;
  estimatedDays: number;
  requiresDocuments: boolean;
  linkedCitizensConfig?: {
    enabled: boolean;
    minLinked?: number;
    maxLinked?: number;
    label?: string;
    description?: string;
    links?: Array<Record<string, any>>;
  };
}
```

**Problemas**:
- ❌ Sem campo `serviceSubtype` (CRÍTICO)
- ❌ Sem campo `serviceType` (COM_DADOS vs SEM_DADOS)
- ❌ Sem campo `departmentCode`
- ❌ Sem campo `moduleType`
- ❌ Sem campo `priority`
- ❌ Sem campo `color`
- ❌ `suggestedFields` não mapeia para `formSchema` do Prisma
- ❌ `linkedCitizensConfig` tem estrutura diferente do backend

---

### Interface Atual (ServiceDefinition - Backend)

```typescript
// Localização: digiurban/backend/prisma/seeds/services/types.ts

import { ServiceType, CitizenLinkType, ServiceRole } from '@prisma/client';

export enum ServiceSubtype {
  CAPTURA_COMPLETA = 'CAPTURA_COMPLETA',      // 🔵 COM_DADOS extenso
  SOLICITACAO_SIMPLES = 'SOLICITACAO_SIMPLES', // 🟢 COM_DADOS simples
  PAGAMENTO = 'PAGAMENTO',                     // 🔴 COM_DADOS com pagamento
  CONSULTIVO = 'CONSULTIVO'                    // 🟡 SEM_DADOS consulta/emissão
}

export interface ServiceDefinition {
  name: string;
  description: string;
  departmentCode: string;                      // ✅ Identifica secretaria
  serviceType: ServiceType;                    // ✅ COM_DADOS | SEM_DADOS
  serviceSubtype?: ServiceSubtype;             // ✅ Classificação detalhada
  moduleType: string | null;                   // ✅ Módulo de destino
  requiresDocuments: boolean;
  requiredDocuments?: string[];
  estimatedDays: number | null;
  priority: number;                            // ✅ Priorização (1-5)
  category?: string;
  icon?: string;
  color?: string;                              // ✅ UI consistente
  formSchema?: any;                            // ✅ Schema JSON completo
  linkedCitizensConfig?: LinkedCitizenConfig;
}
```

---

## Proposta: ServiceSuggestion V2

### Opção 1: Alinhamento Total (Recomendada)

Alinhar completamente com `ServiceDefinition`, tornando a conversão trivial:

```typescript
// Localização: digiurban/frontend/lib/suggestions/types.ts

import { ServiceType } from '@prisma/client'; // Importar do Prisma

export enum ServiceSubtype {
  CAPTURA_COMPLETA = 'CAPTURA_COMPLETA',
  SOLICITACAO_SIMPLES = 'SOLICITACAO_SIMPLES',
  PAGAMENTO = 'PAGAMENTO',
  CONSULTIVO = 'CONSULTIVO'
}

export const SERVICE_SUBTYPE_EMOJI: Record<ServiceSubtype, string> = {
  [ServiceSubtype.CAPTURA_COMPLETA]: '🔵',
  [ServiceSubtype.SOLICITACAO_SIMPLES]: '🟢',
  [ServiceSubtype.PAGAMENTO]: '🔴',
  [ServiceSubtype.CONSULTIVO]: '🟡'
};

export const SERVICE_SUBTYPE_LABEL: Record<ServiceSubtype, string> = {
  [ServiceSubtype.CAPTURA_COMPLETA]: 'Solicitação com Captura de Dados',
  [ServiceSubtype.SOLICITACAO_SIMPLES]: 'Solicitação Simples',
  [ServiceSubtype.PAGAMENTO]: 'Serviço de Pagamento',
  [ServiceSubtype.CONSULTIVO]: 'Serviço Consultivo'
};

// Mantém retrocompatibilidade com FormFieldSuggestion
export interface FormFieldSuggestion {
  name: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'cpf' | 'cnpj' | 'cep' | 'checkbox';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ServiceSuggestion {
  // Campos de identificação
  id: string;
  name: string;
  description: string;

  // 🆕 NOVOS CAMPOS OBRIGATÓRIOS
  departmentCode: string;                      // Código da secretaria (ex: 'SAUDE', 'EDUCACAO')
  serviceType: ServiceType;                    // 'COM_DADOS' | 'SEM_DADOS'
  serviceSubtype: ServiceSubtype;              // Classificação detalhada

  // Campos opcionais de configuração
  moduleType?: string;                         // Módulo que implementará (ex: 'AGENDAMENTO_CONSULTA')
  priority?: number;                           // Priorização 1-5 (default: 3)
  category?: string;                           // Categoria para agrupamento
  icon?: string;                               // Ícone do serviço
  color?: string;                              // Cor para UI

  // Configuração de documentos
  requiresDocuments: boolean;
  requiredDocuments?: string[];                // 🆕 Lista de documentos necessários

  // Configuração de prazo
  estimatedDays: number | null;

  // Configuração de formulário
  // OPÇÃO A: Manter retrocompatibilidade
  suggestedFields?: FormFieldSuggestion[];     // Campos sugeridos (formato antigo)
  formSchema?: any;                            // 🆕 Schema JSON completo (formato novo)

  // OPÇÃO B: Apenas novo formato
  // formSchema: any;                          // Schema JSON completo

  // Configuração de cidadãos vinculados
  linkedCitizensConfig?: {
    enabled: boolean;
    links?: Array<{
      linkType: string;                        // Ex: 'COMPANION', 'STUDENT'
      role: string;                            // Ex: 'BENEFICIARY', 'COMPANION'
      label: string;
      description?: string;
      required?: boolean;
      mapFromLegacyFields?: {
        cpf?: string;
        name?: string;
        birthDate?: string;
        [key: string]: string | undefined;
      };
      contextFields?: Array<{
        id: string;
        sourceField?: string;
        value?: any;
      }>;
      expectedRelationships?: string[];
    }>;
  };

  // Metadados
  createdAt?: Date;                            // 🆕 Data de criação da sugestão
  updatedAt?: Date;                            // 🆕 Data de atualização
  suggestedBy?: string;                        // 🆕 Quem sugeriu (usuário, sistema, etc)
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED'; // 🆕 Status da sugestão
  implementedAsServiceId?: string;             // 🆕 ID do serviço se já foi implementado
}
```

#### Vantagens da Opção 1:
- ✅ Alinhamento total com backend
- ✅ Conversão trivial de sugestão → seed
- ✅ Todos os campos necessários presentes
- ✅ Campos de metadados para governança
- ✅ Retrocompatibilidade mantida (`suggestedFields` opcional)

#### Desvantagens:
- ⚠️ Quebra compatibilidade com sugestões existentes (precisa migração)
- ⚠️ Mais complexo

---

### Opção 2: Alinhamento Mínimo

Adicionar apenas campos críticos, mantendo máxima retrocompatibilidade:

```typescript
export interface ServiceSuggestion {
  // Campos existentes
  id: string;
  name: string;
  description: string;
  icon: string;
  suggestedFields: FormFieldSuggestion[];
  category: string;
  estimatedDays: number;
  requiresDocuments: boolean;
  linkedCitizensConfig?: { ... };

  // 🆕 CAMPOS MÍNIMOS NECESSÁRIOS
  serviceSubtype: ServiceSubtype;              // CRÍTICO: Classificação do serviço
  serviceType?: ServiceType;                   // Opcional: COM_DADOS | SEM_DADOS (pode inferir de serviceSubtype)
  departmentCode?: string;                     // Opcional: Código da secretaria (pode inferir do arquivo)
}
```

#### Vantagens da Opção 2:
- ✅ Mudanças mínimas
- ✅ Fácil migração
- ✅ Retrocompatibilidade total

#### Desvantagens:
- ❌ Ainda faltam campos importantes (`moduleType`, `priority`, `color`)
- ❌ Conversão sugestão → seed ainda requer trabalho manual
- ❌ Sem governança de sugestões

---

## Recomendação: Implementação Gradual

### Fase 1: Adicionar Campos Críticos (Imediato)

```typescript
export interface ServiceSuggestion {
  // ... campos existentes ...

  // 🆕 FASE 1: Campos críticos
  serviceSubtype: ServiceSubtype;              // OBRIGATÓRIO
  serviceType?: ServiceType;                   // Opcional (pode inferir)
  departmentCode?: string;                     // Opcional (pode inferir do arquivo)
}
```

**Tempo estimado**: 2-4 horas
**Impacto**: Baixo

---

### Fase 2: Adicionar Campos de Configuração (Curto Prazo)

```typescript
export interface ServiceSuggestion {
  // ... campos da Fase 1 ...

  // 🆕 FASE 2: Campos de configuração
  moduleType?: string;
  priority?: number;
  color?: string;
  requiredDocuments?: string[];
  formSchema?: any;
}
```

**Tempo estimado**: 4-8 horas
**Impacto**: Médio

---

### Fase 3: Adicionar Governança (Médio Prazo)

```typescript
export interface ServiceSuggestion {
  // ... campos das Fases 1 e 2 ...

  // 🆕 FASE 3: Governança
  createdAt?: Date;
  updatedAt?: Date;
  suggestedBy?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';
  implementedAsServiceId?: string;
}
```

**Tempo estimado**: 8-16 horas
**Impacto**: Alto

---

## Script de Migração

Para facilitar a migração das 3.038 sugestões existentes:

```typescript
// migrate-suggestions.ts

import { ServiceSubtype, ServiceType } from './types';

// Mapeamento automático baseado em heurísticas
function inferServiceSubtype(suggestion: OldServiceSuggestion): ServiceSubtype {
  // Se não requer dados de formulário, é consultivo
  if (!suggestion.suggestedFields || suggestion.suggestedFields.length === 0) {
    return ServiceSubtype.CONSULTIVO;
  }

  // Se tem poucos campos (< 5), é solicitação simples
  if (suggestion.suggestedFields.length < 5) {
    return ServiceSubtype.SOLICITACAO_SIMPLES;
  }

  // Se tem muitos campos ou documentos, é captura completa
  if (suggestion.suggestedFields.length >= 5 || suggestion.requiresDocuments) {
    return ServiceSubtype.CAPTURA_COMPLETA;
  }

  // Default: solicitação simples
  return ServiceSubtype.SOLICITACAO_SIMPLES;
}

function inferServiceType(subtype: ServiceSubtype): ServiceType {
  return subtype === ServiceSubtype.CONSULTIVO ? 'SEM_DADOS' : 'COM_DADOS';
}

function inferDepartmentCode(fileName: string): string {
  const mapping: Record<string, string> = {
    'saude': 'SAUDE',
    'educacao': 'EDUCACAO',
    'assistencia-social': 'ASSISTENCIA_SOCIAL',
    // ... outros mapeamentos
  };
  return mapping[fileName] || 'UNKNOWN';
}

// Migrar sugestões existentes
function migrateSuggestion(
  oldSuggestion: OldServiceSuggestion,
  departmentFile: string
): NewServiceSuggestion {
  const serviceSubtype = inferServiceSubtype(oldSuggestion);
  const serviceType = inferServiceType(serviceSubtype);
  const departmentCode = inferDepartmentCode(departmentFile);

  return {
    ...oldSuggestion,
    serviceSubtype,
    serviceType,
    departmentCode,
    priority: 3, // Default
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    suggestedBy: 'system:migration'
  };
}
```

---

## Exemplo Prático

### Antes (ServiceSuggestion Atual)

```typescript
{
  id: 'agendamento-consulta',
  name: 'Agendamento de Consulta',
  description: 'Agende consultas médicas em unidades básicas de saúde',
  icon: 'Stethoscope',
  category: 'Agendamento',
  estimatedDays: 5,
  requiresDocuments: false,
  suggestedFields: [
    { name: 'especialidade', type: 'select', label: 'Especialidade', required: true },
    { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    // ...
  ]
}
```

### Depois (ServiceSuggestion V2 - Fase 1)

```typescript
{
  id: 'agendamento-consulta',
  name: 'Agendamento de Consulta',
  description: 'Agende consultas médicas em unidades básicas de saúde',
  icon: 'Stethoscope',
  category: 'Agendamento',
  estimatedDays: 5,
  requiresDocuments: false,
  suggestedFields: [ ... ],

  // 🆕 NOVOS CAMPOS
  serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
  serviceType: 'COM_DADOS',
  departmentCode: 'SAUDE'
}
```

### Depois (ServiceSuggestion V2 - Completo)

```typescript
{
  id: 'agendamento-consulta',
  name: 'Agendamento de Consulta',
  description: 'Agende consultas médicas em unidades básicas de saúde',
  icon: 'Stethoscope',
  category: 'Agendamento',
  estimatedDays: 5,
  requiresDocuments: true,
  requiredDocuments: ['Cartão SUS', 'RG ou CPF'],

  // Classificação
  serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
  serviceType: 'COM_DADOS',
  departmentCode: 'SAUDE',
  moduleType: 'AGENDAMENTO_CONSULTA',
  priority: 5,
  color: '#10b981',

  // Formulário (formato novo)
  formSchema: {
    type: 'object',
    citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone'],
    properties: {
      cartaoSUS: { type: 'string', title: 'Número do Cartão SUS', pattern: '^\\d{15}$' },
      especialidade: { type: 'string', title: 'Especialidade', enum: [...] },
      // ...
    },
    required: ['cartaoSUS', 'especialidade']
  },

  // Metadados
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  suggestedBy: 'system:initial-import',
  status: 'PENDING'
}
```

---

## Checklist de Implementação

### Fase 1: Campos Críticos
- [ ] Adicionar enum `ServiceSubtype` em `types.ts`
- [ ] Adicionar campos `serviceSubtype`, `serviceType`, `departmentCode` na interface
- [ ] Criar script de migração automática
- [ ] Executar migração em todas as 3.038 sugestões
- [ ] Validar que todas as sugestões têm os novos campos
- [ ] Atualizar componentes React que usam `ServiceSuggestion`
- [ ] Testar UI de sugestões

### Fase 2: Campos de Configuração
- [ ] Adicionar campos `moduleType`, `priority`, `color`, etc
- [ ] Migrar `suggestedFields` para `formSchema` (opcional)
- [ ] Atualizar lógica de exibição de sugestões
- [ ] Criar filtros por `serviceSubtype`, `priority`, etc

### Fase 3: Governança
- [ ] Adicionar campos de metadados
- [ ] Criar dashboard de governança de sugestões
- [ ] Implementar fluxo de aprovação
- [ ] Criar relatórios de status

---

## Conclusão

**Recomendação Final**: Implementar Fase 1 imediatamente (crítico), Fase 2 no curto prazo (importante), Fase 3 no médio prazo (desejável).

A adição do campo `serviceSubtype` é CRÍTICA e deve ser priorizada. As demais fases podem ser implementadas gradualmente conforme necessidade.
