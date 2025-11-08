# 🎯 PLANO DE IMPLEMENTAÇÃO COMPLETA - DIGIURBAN
## Sistema 100% Funcional e Compliant em 5 Fases

**Documento:** Roadmap de Implementação Profissional
**Objetivo:** Tornar todas as 13 secretarias 100% funcionais e 100% compliant
**Abordagem:** Refatoração + Implementação + Limpeza de Código Legado
**Última Atualização:** 2025-11-07

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura e Padrões](#arquitetura-e-padrões)
3. [Fase 1 - Refatoração Agricultura (PILOTO)](#fase-1---refatoração-agricultura-piloto)
4. [Fase 2 - Refatoração Educação, Saúde e Assistência Social](#fase-2---refatoração-educação-saúde-e-assistência-social)
5. [Fase 3 - Refatoração Planejamento, Obras e Serviços](#fase-3---refatoração-planejamento-obras-e-serviços)
6. [Fase 4 - Refatoração Demais Secretarias](#fase-4---refatoração-demais-secretarias)
7. [Fase 5 - Limpeza de Código Legado](#fase-5---limpeza-de-código-legado)
8. [Checklist de Validação](#checklist-de-validação)
9. [Métricas de Sucesso](#métricas-de-sucesso)

---

## 🎯 VISÃO GERAL

### Situação Atual (Atualizada em 2025-11-07)

```
📊 ESTATÍSTICAS DO SISTEMA
├─ Total de Serviços Cadastrados: 103 serviços
│  ├─ Serviços COM_DADOS: 103 (100%)
│  └─ FormSchemas Definidos: ~95 (92%)
├─ Secretarias Mapeadas: 13
├─ Rotas Backend: 14 rotas
├─ Páginas Frontend Criadas: 146
├─ Handlers Implementados: 57
│
├─ 📊 COMPLIANCE COM NOVAS REGRAS:
│  ├─ Models com citizenId: 27/205 (13%) ❌ CRÍTICO
│  ├─ Models sem duplicação: 0/205 (0%) ❌ CRÍTICO
│  ├─ Handlers validam citizenId: 1/57 (2%) ❌ CRÍTICO
│  └─ Handlers usam CitizenLookup: 0/57 (0%) ❌ CRÍTICO
│
└─ Taxa de Compliance Real: ~3% ❌ CRÍTICO
```

### 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS (Análise Completa)

1. **87% dos Models SEM citizenId** (178/205 models)
   - Viola regra fundamental #1 (vinculação obrigatória)
   - 178 models precisam de refatoração urgente
   - Apenas 27 models têm citizenId (13%)

2. **100% dos Models Duplicam Dados do Citizen**
   - TODOS os 205 models duplicam campos (name, cpf, email, phone, address)
   - Dados inconsistentes e impossível manutenção
   - Viola regra fundamental #2 (sem duplicação)

3. **98% dos Handlers Sem Validação de citizenId** (56/57)
   - Apenas 1 handler (RuralProducerHandler) valida citizenId
   - Handlers criam registros sem vínculo obrigatório
   - Sistema permite dados órfãos

4. **0% dos Handlers Usam CitizenLookupService**
   - Nenhum handler implementa pré-preenchimento
   - Viola regra fundamental #3
   - CitizenLookupService existe mas não é usado

5. **Código Legacy Extenso**
   - module-handler.ts com 812 linhas de switch/case
   - Handlers duplicados (core/ vs modules/)
   - System não usa registry de handlers

### Objetivo Final (Revisado)

```
🎯 METAS DE COMPLIANCE E FUNCIONALIDADE

PRIORIDADE CRÍTICA (Regras Fundamentais):
├─ ✅ 100% Models com citizenId obrigatório (205/205)
├─ ✅ 0% Models com duplicação de dados (0/205)
├─ ✅ 100% Handlers validam citizenId (57/57)
├─ ✅ 100% Handlers usam CitizenLookupService (57/57)
└─ ✅ FamilyComposition implementada e funcional

FUNCIONALIDADES:
├─ ✅ 103 Serviços COM_DADOS 100% funcionais
├─ ✅ 13 Secretarias com backend completo
├─ ✅ 103 FormSchemas com citizenId e pré-preenchimento
├─ ✅ 146 Páginas frontend com citizen lookup
├─ ✅ 100% de cobertura de testes
└─ ✅ Documentação técnica completa

CÓDIGO LIMPO:
├─ ✅ 0 Handlers órfãos ou legados
├─ ✅ 0 Duplicação de código
├─ ✅ Registry de handlers 100% funcional
└─ ✅ module-handler.ts refatorado
```

---

## 🏗️ ARQUITETURA E PADRÕES

### ⚠️ REGRAS FUNDAMENTAIS DO SISTEMA (SINGLE TENANT)

#### 1. **VINCULAÇÃO OBRIGATÓRIA A CIDADÃO**

**TODOS OS SERVIÇOS** devem ser vinculados a um cidadão ou membro da composição familiar:

```typescript
// ✅ CORRETO: Todo serviço/protocolo vinculado a cidadão
model RuralProducer {
  id         String   @id @default(cuid())
  citizenId  String   // OBRIGATÓRIO
  citizen    Citizen  @relation(fields: [citizenId], references: [id])
  protocolId String?
  // ... demais campos
}

// ❌ ERRADO: Dados duplicados sem vínculo
model RuralProducer {
  id    String @id @default(cuid())
  nome  String // DUPLICAÇÃO - já existe em Citizen!
  cpf   String // DUPLICAÇÃO - já existe em Citizen!
  // ... campos soltos sem vínculo
}
```

#### 2. **PRÉ-PREENCHIMENTO DE DADOS DO CIDADÃO**

Todos os formulários devem:
- Buscar dados do cidadão pelo CPF/ID
- Pré-preencher campos que já existem (nome, CPF, telefone, email, endereço)
- Permitir atualização apenas de campos específicos do módulo
- Sincronizar atualizações de volta ao cadastro do cidadão (quando aplicável)

```typescript
// Exemplo de handler com pré-preenchimento
async createEntity(protocolId, formData, citizenId, prisma) {
  // 1. Buscar cidadão
  const citizen = await prisma.citizen.findUnique({
    where: { id: citizenId }
  });

  // 2. Usar dados do cidadão (não duplicar)
  const producer = await prisma.ruralProducer.create({
    data: {
      citizenId: citizen.id, // Vínculo obrigatório
      // Campos ESPECÍFICOS do produtor (não duplicar dados do cidadão)
      productionType: formData.productionType,
      mainCrop: formData.mainCrop,
      dap: formData.dap,
      // ...
    }
  });
}
```

#### 3. **COMPOSIÇÃO FAMILIAR**

**CRÍTICO:** Sistema deve suportar serviços para membros da família do cidadão:

```typescript
// Model de Composição Familiar (A CRIAR)
model FamilyMember {
  id              String   @id @default(cuid())
  citizenId       String   // Titular da família
  citizen         Citizen  @relation("FamilyMembers", fields: [citizenId], references: [id])

  name            String
  cpf             String?  // Pode não ter (menor de idade)
  birthDate       DateTime
  relationship    String   // PAI, MAE, FILHO, CONJUGE, etc

  isDependent     Boolean  @default(true)
  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([citizenId, cpf]) // CPF único por família (se existir)
  @@index([citizenId])
}
```

**Uso em Serviços:**
```typescript
// Formulário permite selecionar beneficiário
formSchema: {
  properties: {
    beneficiaryType: {
      type: 'string',
      enum: ['TITULAR', 'FAMILY_MEMBER'],
      enumNames: ['Eu (Titular)', 'Membro da Família']
    },
    familyMemberId: {
      type: 'string',
      title: 'Membro da Família',
      widget: 'select', // Carrega membros do cidadão logado
      // Visível apenas se beneficiaryType === 'FAMILY_MEMBER'
    }
  }
}
```

### Padrão de Implementação Universal

Cada secretaria seguirá este padrão rigoroso:

```
📦 ESTRUTURA POR SECRETARIA
├─ Backend
│  ├─ Rota Principal: secretarias-{nome}.ts
│  │  ├─ GET /stats (estatísticas)
│  │  ├─ GET /services (listar serviços)
│  │  ├─ GET /citizens/:cpf (buscar dados para pré-preenchimento)
│  │  └─ Rotas CRUD por módulo
│  ├─ Handlers: modules/handlers/{nome}/
│  │  ├─ {modulo}-handler.ts (cada módulo COM_DADOS)
│  │  │  └─ DEVE validar citizenId obrigatório
│  │  │  └─ DEVE buscar dados do Citizen
│  │  │  └─ NÃO DEVE duplicar dados do Citizen
│  │  └─ index.ts (exportações)
│  └─ Schemas: prisma/schema.prisma
│     └─ Modelos específicos da secretaria
│        └─ TODOS com citizenId obrigatório
├─ Frontend
│  ├─ Dashboard: app/admin/secretarias/{nome}/dashboard/page.tsx
│  ├─ Módulos: app/admin/secretarias/{nome}/{modulo}/page.tsx
│  │  └─ Campo de busca de cidadão (CPF/Nome)
│  │  └─ Pré-preenchimento automático
│  │  └─ Seletor de beneficiário (titular/família)
│  └─ Componentes: components/admin/modules/{nome}/
└─ Integração
   ├─ Serviços: services-simplified-complete.ts
   ├─ Protocolo: protocol-module.service.ts
   ├─ Mapping: config/module-mapping.ts
   └─ CitizenLookup: citizen-lookup.service.ts (NOVO)
```

### Checklist de Implementação Universal

Para cada módulo COM_DADOS:

#### ✅ Backend (Obrigatório)
- [ ] Model no Prisma Schema
- [ ] **citizenId obrigatório no model** (vínculo com Citizen)
- [ ] **Relation com Citizen configurada**
- [ ] **Sem duplicação de dados do Citizen** (nome, CPF, telefone já estão em Citizen)
- [ ] Migration criada e aplicada
- [ ] Handler com CRUD completo (Create, Read, Update, Delete)
- [ ] **Handler valida citizenId obrigatório**
- [ ] **Handler busca dados do Citizen para pré-preenchimento**
- [ ] Integração com `protocolModuleService`
- [ ] Validações com Zod
- [ ] Testes unitários (>80% coverage)
- [ ] Rota registrada em `secretarias-{nome}.ts`
- [ ] **Rota GET /citizens/:cpf para busca de cidadão**

#### ✅ Serviços (Obrigatório)
- [ ] FormSchema JSON definido em `services-simplified-complete.ts`
- [ ] **FormSchema inclui campo citizenId (hidden, auto-preenchido)**
- [ ] **FormSchema inclui campos de beneficiário (titular/família) quando aplicável**
- [ ] **Campos do Citizen marcados como readonly/disabled (pré-preenchidos)**
- [ ] RequiredDocuments especificados
- [ ] ModuleType único e mapeado
- [ ] EstimatedDays definido
- [ ] Priority configurada
- [ ] Icon e Color definidos

#### ✅ Frontend (Obrigatório)
- [ ] Página do módulo criada
- [ ] **Campo de busca de cidadão (CPF/Nome) no topo do formulário**
- [ ] **Pré-preenchimento automático ao selecionar cidadão**
- [ ] **Campos do cidadão exibidos mas não editáveis no formulário**
- [ ] **Seletor de beneficiário (titular/membro família) quando aplicável**
- [ ] **Carregamento dinâmico de membros da família**
- [ ] Formulário dinâmico baseado no FormSchema
- [ ] Listagem com paginação
- [ ] Filtros e busca
- [ ] Estados de loading/erro
- [ ] Integração com API
- [ ] Validação de formulário
- [ ] UX completa (criar/editar/deletar)

#### ✅ Protocolo (Obrigatório)
- [ ] Criação de protocolo ao submeter
- [ ] Status VINCULADO ao criar entidade
- [ ] Tramitação implementada
- [ ] Histórico registrado
- [ ] Documentos anexáveis
- [ ] Aprovação/Rejeição funcional

---

## 📅 FASE 1 - REFATORAÇÃO AGRICULTURA (PILOTO)

**Objetivo:** CORRIGIR compliance + Implementar Agricultura 100% como PILOTO

**Status:** ⚠️ **REFATORAÇÃO OBRIGATÓRIA** antes de novas implementações

### ⚠️ NOVO ENFOQUE DA FASE 1

A análise crítica revelou que **87% do código viola regras fundamentais**. Portanto, a FASE 1 foi reestruturada:

**ANTES (Plano Original):**
- ❌ Criar novos módulos sem corrigir problemas existentes
- ❌ FamilyMember novo (já existe como FamilyComposition!)
- ❌ Continuar padrão de duplicação de dados

**AGORA (Plano Corrigido):**
- ✅ Refatorar FASE 1 (Agricultura) como PILOTO
- ✅ Usar FamilyComposition existente
- ✅ Eliminar duplicações nos 8 models de Agricultura
- ✅ Validar abordagem antes de escalar para outras fases

---

### ETAPA 1: Refatoração de Models (Agricultura - PILOTO)

**Meta:** Corrigir 8 models de Agricultura para 100% compliance

#### 1.1. **Análise e Backup**

**Tarefa:** Preparar ambiente para refatoração segura

**Entregas:**
- [ ] Backup completo do banco de dados
- [ ] Backup do schema.prisma atual
- [ ] Documentar estado atual dos 8 models
- [ ] Criar branch `refactor/fase1-agricultura`
- [ ] Revisar @ANALISE_CODIGO_VS_PLANO.md

**Comando:**
```bash
# Backup do schema
cp prisma/schema.prisma prisma/schema.prisma.backup_fase1

# Backup do banco
pg_dump digiurban > backup_fase1_$(date +%Y%m%d).sql

# Criar branch
git checkout -b refactor/fase1-agricultura
```

---

#### 1.2. **Refatorar Models - Remover Duplicações**

**Problema Identificado:**
- RuralProducer, RuralProgramEnrollment, RuralTrainingEnrollment TÊM citizenId
- MAS todos duplicam campos do Citizen (name, document, email, phone, address)

**Solução:**

**ANTES (RuralProducer):**
```prisma
model RuralProducer {
  id         String  @id @default(cuid())
  citizenId  String  # ✅ TEM

  name       String  # ❌ DUPLICA Citizen.name
  document   String  # ❌ DUPLICA Citizen.cpf
  email      String? # ❌ DUPLICA Citizen.email
  phone      String? # ❌ DUPLICA Citizen.phone
  address    String? # ❌ DUPLICA Citizen.address

  productionType String?
  mainCrop       String?
  status         String
}
```

**DEPOIS (RuralProducer - CORRETO):**
```prisma
model RuralProducer {
  id             String   @id @default(cuid())
  citizenId      String   # ✅ OBRIGATÓRIO

  # ✅ REMOVIDOS: name, document, email, phone, address
  # ✅ Acessar via: producer.citizen.name

  # ✅ MANTER apenas campos ESPECÍFICOS do produtor
  productionType String
  mainCrop       String
  status         String   @default("PENDING_APPROVAL")
  isActive       Boolean  @default(false)

  protocolId     String?  @unique
  protocol       ProtocolSimplified? @relation(...)

  citizen        Citizen  @relation("RuralProducerCitizen", fields: [citizenId], references: [id])

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([citizenId])
  @@index([status])
  @@map("rural_producers")
}
```

**Entregas:**
- [ ] RuralProducer refatorado (remover name, document, email, phone, address)
- [ ] RuralProgramEnrollment refatorado
- [ ] RuralTrainingEnrollment refatorado
- [ ] **Migration criada (não aplicar ainda)**

---

#### 1.3. **Adicionar citizenId aos Models que Faltam**

**Models SEM citizenId (5):**
1. RuralProperty
2. RuralProgram (não precisa - é tabela de programas)
3. RuralTraining (não precisa - é tabela de cursos)
4. AgricultureAttendance
5. TechnicalAssistance

**Refatoração:**

**ANTES (TechnicalAssistance):**
```prisma
model TechnicalAssistance {
  id          String @id @default(cuid())
  # ❌ SEM citizenId
  producerId  String
  producer    RuralProducer @relation(...)

  # ❌ DUPLICA dados
  farmerName  String
  farmerCpf   String
  farmerPhone String

  assistanceType String
  description    String
}
```

**DEPOIS (TechnicalAssistance - CORRETO):**
```prisma
model TechnicalAssistance {
  id             String   @id @default(cuid())
  citizenId      String   # ✅ OBRIGATÓRIO
  citizen        Citizen  @relation(fields: [citizenId], references: [id])

  producerId     String?  # ✅ Opcional (nem todo cidadão é produtor cadastrado)
  producer       RuralProducer? @relation(...)

  # ✅ REMOVIDOS: farmerName, farmerCpf, farmerPhone

  # ✅ Campos ESPECÍFICOS da assistência
  assistanceType String
  description    String
  propertyId     String?
  scheduledDate  DateTime?
  status         String   @default("PENDING")

  protocolId     String?  @unique
  protocol       ProtocolSimplified? @relation(...)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([citizenId])
  @@index([producerId])
  @@index([status])
}
```

**Entregas:**
- [ ] TechnicalAssistance refatorado (+ citizenId, - duplicações)
- [ ] AgricultureAttendance refatorado
- [ ] RuralProperty refatorado
- [ ] **Migration completa criada**
- [ ] **Testes de migração em banco de dev**

---

#### 1.4. **Aplicar Migrations e Validar** 

**Tarefa:** Aplicar refatoração no banco de dados

**Estratégia:**
1. Testar migration em banco de desenvolvimento
2. Verificar integridade de dados
3. Aplicar em produção (se já houver dados)

**Comandos:**
```bash
# 1. Gerar migration
npx prisma migrate dev --name refactor_agriculture_citizen_compliance

# 2. Validar schema
npx prisma validate

# 3. Gerar Prisma Client
npx prisma generate

# 4. Verificar dados (SQL)
psql digiurban -c "
  SELECT COUNT(*) FROM rural_producers WHERE citizen_id IS NULL;
  -- Deve retornar 0
"
```

**Entregas:**
- [ ] Migration aplicada com sucesso
- [ ] 0 registros órfãos (todos têm citizenId)
- [ ] Prisma Client atualizado
- [ ] **Schema validado 100%**

---

### ETAPA Refatoração de Handlers (Agricultura)

**Meta:** Corrigir 6 handlers para 100% compliance

#### 2.1. **Refatorar Handlers - Adicionar Validação citizenId** 

**Problema Identificado:**
- Apenas RuralProducerHandler valida citizenId
- 5 outros handlers NÃO validam (98% sem validação)
- Nenhum handler usa CitizenLookupService

**Template de Refatoração:**

**ANTES (TechnicalAssistanceHandler):**
```typescript
async execute(action: ModuleAction, tx: PrismaTransaction) {
  const { data } = action;

  // ❌ SEM validação de citizenId
  // ❌ SEM uso de CitizenLookupService
  // ❌ DUPLICA dados do cidadão

  const assistance = await tx.technicalAssistance.create({
    data: {
      producerId: data.producerId,
      farmerName: data.name,      // ❌ Duplica
      farmerCpf: data.cpf,         // ❌ Duplica
      farmerPhone: data.phone,     // ❌ Duplica
      assistanceType: data.assistanceType,
      description: data.description
    }
  });
}
```

**DEPOIS (TechnicalAssistanceHandler - CORRETO):**
```typescript
import { CitizenLookupService } from '../../../services/citizen-lookup.service';

async execute(action: ModuleAction, tx: PrismaTransaction) {
  const { data, protocol } = action;

  // ✅ 1. VALIDAR citizenId OBRIGATÓRIO
  if (!data.citizenId) {
    throw new Error('citizenId é obrigatório para solicitar assistência técnica');
  }

  // ✅ 2. BUSCAR dados do cidadão (CitizenLookupService)
  const citizenService = new CitizenLookupService();
  const citizen = await citizenService.findById(data.citizenId);

  if (!citizen) {
    throw new Error('Cidadão não encontrado. Verifique o CPF informado.');
  }

  // ✅ 3. VERIFICAR se cidadão está ativo
  if (!citizen.isActive) {
    throw new Error('Cidadão inativo. Não é possível solicitar serviços.');
  }

  // ✅ 4. CRIAR sem duplicações (usa citizenId)
  const assistance = await tx.technicalAssistance.create({
    data: {
      citizenId: data.citizenId,         // ✅ Vínculo obrigatório
      producerId: data.producerId,       // ✅ Opcional
      assistanceType: data.assistanceType,
      description: data.description,
      propertyId: data.propertyId,
      scheduledDate: data.scheduledDate,
      status: 'PENDING',
      protocolId: protocol
    },
    include: {
      citizen: true  // ✅ Acessa dados via relação
    }
  });

  return { assistance };
}
```

**Handlers a Refatorar (6):**
1. RuralProducerHandler (já tem validação, adicionar CitizenLookupService)
2. TechnicalAssistanceHandler
3. AgricultureAttendanceHandler
4. RuralProgramEnrollmentHandler
5. RuralPropertyHandler
6. RuralTrainingEnrollmentHandler (remover se não há tabela)

**Entregas:**
- [ ] 6 handlers refatorados com validação citizenId
- [ ] 6 handlers usando CitizenLookupService
- [ ] 0 handlers duplicando dados do Citizen
- [ ] **Testes unitários de cada handler**

---

#### 2.2. **Criar CitizenLookup Frontend Component** 

**Tarefa:** Componente reutilizável para busca de cidadão em formulários

**Problema:** Formulários duplicam campo de CPF, nome, telefone etc.

**Solução:** Componente universal de busca de cidadão

**Arquivo:** `frontend/components/forms/CitizenLookup.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, CheckCircle, XCircle } from 'lucide-react';

interface Citizen {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  address?: any;
}

interface CitizenLookupProps {
  onCitizenSelected: (citizen: Citizen) => void;
  showFamilySelector?: boolean;
}

export function CitizenLookup({ onCitizenSelected, showFamilySelector = false }: CitizenLookupProps) {
  const [cpf, setCpf] = useState('');
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCitizen = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/citizen-lookup/cpf/${cpf}`);
      const data = await response.json();

      if (response.ok && data.data) {
        setCitizen(data.data);
        onCitizenSelected(data.data);
      } else {
        setError('Cidadão não encontrado. Verifique o CPF informado.');
        setCitizen(null);
      }
    } catch (err) {
      setError('Erro ao buscar cidadão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold">Buscar Cidadão</h3>

      <div className="flex gap-2">
        <Input
          placeholder="CPF do cidadão (11 dígitos)"
          value={cpf}
          onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
          maxLength={11}
        />
        <Button onClick={searchCitizen} disabled={loading || cpf.length !== 11}>
          <Search className="mr-2 h-4 w-4" />
          Buscar
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {citizen && (
        <div className="p-4 border rounded bg-green-50">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle className="h-4 w-4" />
            <span className="font-semibold">Cidadão Encontrado</span>
          </div>
          <div className="space-y-1 text-sm">
            <p><strong>Nome:</strong> {citizen.name}</p>
            <p><strong>CPF:</strong> {citizen.cpf}</p>
            {citizen.phone && <p><strong>Telefone:</strong> {citizen.phone}</p>}
            {citizen.email && <p><strong>Email:</strong> {citizen.email}</p>}
          </div>

          {showFamilySelector && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Serviço para:</p>
              <select className="w-full border rounded p-2">
                <option value="titular">Eu (Titular)</option>
                <option value="family">Membro da Família</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Entregas:**
- [ ] Componente CitizenLookup criado
- [ ] Integração com API de citizen-lookup
- [ ] Componente reutilizável em todos os formulários
- [ ] **Testes do componente**

---

#### 2.3. **Atualizar FormSchemas - Remover Duplicações** 

**Problema:** FormSchemas duplicam campos do cidadão

**ANTES (services-simplified-complete.ts):**
```typescript
{
  name: 'Cadastro de Produtor Rural',
  formSchema: {
    properties: {
      nome: { type: 'string', title: 'Nome' },      // ❌ Duplica
      cpf: { type: 'string', title: 'CPF' },        // ❌ Duplica
      telefone: { type: 'string', title: 'Telefone' }, // ❌ Duplica
      tipoProdutor: { type: 'string', title: 'Tipo' },
      // ...
    },
    required: ['nome', 'cpf', 'telefone', 'tipoProdutor']
  }
}
```

**DEPOIS (services-simplified-complete.ts - CORRETO):**
```typescript
{
  name: 'Cadastro de Produtor Rural',
  formSchema: {
    properties: {
      citizenId: {
        type: 'string',
        title: 'ID do Cidadão',
        widget: 'hidden'  // ✅ Hidden (preenchido pelo CitizenLookup)
      },
      // ✅ REMOVIDOS: nome, cpf, telefone, email, endereco

      // ✅ Campos ESPECÍFICOS do produtor
      tipoProdutor: {
        type: 'string',
        title: 'Tipo de Produtor',
        enum: ['Agricultor Familiar', 'Produtor Rural', 'Assentado']
      },
      dap: {
        type: 'string',
        title: 'DAP (Declaração de Aptidão ao PRONAF)'
      },
      areaTotalHectares: {
        type: 'number',
        title: 'Área Total (Hectares)'
      },
      principaisProducoes: {
        type: 'string',
        title: 'Principais Produções'
      }
    },
    required: ['citizenId', 'tipoProdutor']  // ✅ citizenId obrigatório
  }
}
```

**Entregas:**
- [ ] 6 FormSchemas de Agricultura atualizados
- [ ] Campo `citizenId` adicionado (hidden)
- [ ] Campos duplicados removidos (nome, cpf, telefone, etc)
- [ ] **Validação: required inclui citizenId**

---

### ETAPA Frontend e Testes (Agricultura)

#### 3.1. **Atualizar Páginas Frontend** 

**Tarefa:** Integrar CitizenLookup em todos os formulários de Agricultura

**Estrutura:**

**Arquivo:** `frontend/app/admin/secretarias/agricultura/produtores/novo/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { CitizenLookup } from '@/components/forms/CitizenLookup';
import { DynamicForm } from '@/components/forms/DynamicForm';

export default function NovoProdutor() {
  const [citizen, setCitizen] = useState(null);
  const [service, setService] = useState(null);

  const handleCitizenSelected = (selectedCitizen) => {
    setCitizen(selectedCitizen);
  };

  const handleSubmit = async (formData) => {
    // ✅ citizenId já está no formData (hidden field)
    const response = await fetch('/api/protocols-simplified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: service.id,
        citizenData: {
          id: citizen.id,  // ✅ Usa ID do cidadão encontrado
          cpf: citizen.cpf
        },
        formData: {
          ...formData,
          citizenId: citizen.id  // ✅ Garante citizenId
        }
      })
    });

    if (response.ok) {
      router.push('/admin/secretarias/agricultura/produtores');
    }
  };

  return (
    <div className="space-y-6">
      <h1>Cadastro de Produtor Rural</h1>

      {/* ✅ 1. Buscar cidadão PRIMEIRO */}
      <CitizenLookup onCitizenSelected={handleCitizenSelected} />

      {/* ✅ 2. Formulário APENAS se cidadão selecionado */}
      {citizen && service && (
        <DynamicForm
          schema={service.formSchema}
          onSubmit={handleSubmit}
          defaultValues={{ citizenId: citizen.id }}  // ✅ Pre-fill citizenId
        />
      )}
    </div>
  );
}
```

**Páginas a Atualizar (6):**
1. `/agricultura/produtores/novo`
2. `/agricultura/assistencia-tecnica/novo`
3. `/agricultura/atendimentos/novo`
4. `/agricultura/programas/inscricao`
5. `/agricultura/propriedades/novo`
6. `/agricultura/cursos/inscricao`

**Entregas:**
- [ ] 6 páginas atualizadas com CitizenLookup
- [ ] Formulários só aparecem após selecionar cidadão
- [ ] citizenId hidden field preenchido automaticamente
- [ ] **Testes E2E de cada fluxo**

---

#### 3.2. **Testes Completos** 

**Cobertura de Testes:**

1. **Testes Unitários (Handlers)**
```typescript
describe('TechnicalAssistanceHandler', () => {
  it('deve rejeitar se citizenId não for fornecido', async () => {
    await expect(
      handler.execute({ data: {} }, tx)
    ).rejects.toThrow('citizenId é obrigatório');
  });

  it('deve rejeitar se cidadão não existir', async () => {
    await expect(
      handler.execute({ data: { citizenId: 'invalid' } }, tx)
    ).rejects.toThrow('Cidadão não encontrado');
  });

  it('deve criar assistência com citizenId', async () => {
    const result = await handler.execute({
      data: {
        citizenId: 'valid-id',
        assistanceType: 'ORIENTACAO_TECNICA',
        description: 'Test'
      }
    }, tx);

    expect(result.assistance.citizenId).toBe('valid-id');
  });
});
```

2. **Testes de Integração (API)**
3. **Testes E2E (Frontend)**
4. **Testes de Compliance (Schema)**

**Entregas:**
- [ ] Coverage >80% em handlers
- [ ] Todos os testes passando
- [ ] 0 registros órfãos no banco
- [ ] **Validação: FASE 1 100% compliant**

---

#### 3.3. **Validação Final e Documentação** 

**Checklist de Validação FASE 1:**

**Models (8 models):**
- [ ] 8/8 models com citizenId (100%)
- [ ] 0/8 models com duplicação (0%)
- [ ] Todas relações com Citizen configuradas
- [ ] Migrations aplicadas com sucesso

**Handlers (6 handlers):**
- [ ] 6/6 handlers validam citizenId (100%)
- [ ] 6/6 handlers usam CitizenLookupService (100%)
- [ ] 0/6 handlers duplicam dados (0%)
- [ ] Todos handlers testados

**FormSchemas (6 serviços):**
- [ ] 6/6 com campo citizenId
- [ ] 0/6 com campos duplicados
- [ ] Validações atualizadas

**Frontend (6 páginas):**
- [ ] 6/6 páginas com CitizenLookup
- [ ] Pré-preenchimento funcional
- [ ] Fluxo E2E testado

**Entregas:**
- [ ] Relatório de compliance FASE 1: **100%**
- [ ] Documentação técnica completa
- [ ] Template para replicar em outras fases
- [ ] **PR pronto para merge**

---

### ✅ RESULTADO ESPERADO DA FASE 1

**Agricultura como PILOTO:**
- ✅ 100% compliance com regras fundamentais
- ✅ 8 models refatorados
- ✅ 6 handlers compliant
- ✅ 6 formulários com citizen lookup
- ✅ 0 duplicações de dados
- ✅ Template validado para replicar

**Este template será usado nas FASES 2-4 para refatorar as 12 secretarias restantes.**

**Exemplo de FormSchema Completo:**

```typescript
// AGRICULTURA - Cadastro de Produtor Rural
{
  name: 'Cadastro de Produtor Rural',
  moduleType: 'CADASTRO_PRODUTOR',
  formSchema: {
    type: 'object',
    properties: {
      // Dados Pessoais
      nome: {
        type: 'string',
        title: 'Nome Completo',
        minLength: 3,
        maxLength: 200
      },
      cpf: {
        type: 'string',
        title: 'CPF',
        pattern: '^\\d{11}$',
        errorMessage: 'CPF deve conter 11 dígitos'
      },
      rg: {
        type: 'string',
        title: 'RG',
        minLength: 5,
        maxLength: 20
      },
      dataNascimento: {
        type: 'string',
        format: 'date',
        title: 'Data de Nascimento',
        maximum: new Date().toISOString().split('T')[0] // Não pode ser futura
      },

      // Contato
      telefone: {
        type: 'string',
        title: 'Telefone',
        pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$',
        placeholder: '(00) 00000-0000'
      },
      email: {
        type: 'string',
        format: 'email',
        title: 'E-mail'
      },
      endereco: {
        type: 'string',
        title: 'Endereço Completo',
        minLength: 10
      },

      // Dados Rurais
      tipoProdutor: {
        type: 'string',
        title: 'Tipo de Produtor',
        enum: ['Agricultor Familiar', 'Produtor Rural', 'Assentado', 'Quilombola', 'Indígena'],
        enumNames: ['Agricultor Familiar', 'Produtor Rural', 'Assentado', 'Quilombola', 'Indígena']
      },
      dap: {
        type: 'string',
        title: 'DAP (Declaração de Aptidão ao PRONAF)',
        pattern: '^[A-Z0-9]{10,20}$'
      },
      areaTotalHectares: {
        type: 'number',
        title: 'Área Total (Hectares)',
        minimum: 0,
        maximum: 100000
      },
      principaisProducoes: {
        type: 'string',
        title: 'Principais Produções',
        minLength: 5,
        maxLength: 500,
        placeholder: 'Ex: Milho, Feijão, Mandioca...'
      },

      // Documentação
      documentoPropriedade: {
        type: 'string',
        title: 'Tipo de Documento da Propriedade',
        enum: ['Escritura', 'Contrato de Arrendamento', 'Posse', 'Concessão'],
        enumNames: ['Escritura', 'Contrato de Arrendamento', 'Posse', 'Concessão de Uso']
      },
      numeroDocumento: {
        type: 'string',
        title: 'Número do Documento'
      },

      // Observações
      observacoes: {
        type: 'string',
        title: 'Observações',
        maxLength: 1000,
        widget: 'textarea',
        rows: 4
      }
    },
    required: ['nome', 'cpf', 'telefone', 'tipoProdutor', 'endereco'],
    dependencies: {
      // Se é Agricultor Familiar, DAP é obrigatório
      tipoProdutor: {
        oneOf: [
          {
            properties: {
              tipoProdutor: { enum: ['Agricultor Familiar'] }
            },
            required: ['dap']
          }
        ]
      }
    }
  },
  requiredDocuments: [
    'CPF',
    'RG',
    'Comprovante de Endereço',
    'Documento da Propriedade (Escritura, Contrato ou Declaração de Posse)'
  ],
  estimatedDays: 7,
  priority: 4
}
```

**Entregas:**
- [ ] 102 FormSchemas completos com validações
- [ ] RequiredDocuments especificados para todos
- [ ] Validações Zod correspondentes criadas
- [ ] Documentação de schemas (JSON Schema Docs)

#### 1.2. Registry de Handlers 

**Tarefa:** Criar sistema automático de registro de handlers

**Arquivo:** `backend/src/modules/handlers/registry.ts`

```typescript
/**
 * HANDLER REGISTRY - Sistema Automático de Registro
 *
 * Este arquivo centraliza o mapeamento de moduleType -> Handler
 * Elimina a necessidade de imports manuais e garante integração automática
 */

import { PrismaClient } from '@prisma/client';

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

export interface ModuleHandler {
  /**
   * Criar entidade do módulo a partir dos dados do protocolo
   */
  createEntity(
    protocolId: string,
    formData: Record<string, any>,
    citizenId: string,
    prisma: PrismaClient
  ): Promise<{ id: string; [key: string]: any }>;

  /**
   * Ativar entidade (quando protocolo é aprovado)
   */
  activateEntity(
    entityId: string,
    prisma: PrismaClient
  ): Promise<void>;

  /**
   * Buscar entidade por ID do protocolo
   */
  findByProtocolId(
    protocolId: string,
    prisma: PrismaClient
  ): Promise<any | null>;

  /**
   * Atualizar entidade
   */
  updateEntity(
    entityId: string,
    data: Record<string, any>,
    prisma: PrismaClient
  ): Promise<any>;

  /**
   * Deletar entidade (soft delete preferencial)
   */
  deleteEntity(
    entityId: string,
    prisma: PrismaClient
  ): Promise<void>;

  /**
   * Validar dados do formulário
   */
  validateFormData(
    formData: Record<string, any>
  ): { valid: boolean; errors?: string[] };
}

// ============================================================================
// REGISTRY MAP
// ============================================================================

const HANDLER_REGISTRY: Map<string, ModuleHandler> = new Map();

// ============================================================================
// FUNÇÕES DE REGISTRO
// ============================================================================

/**
 * Registrar handler para um moduleType
 */
export function registerHandler(
  moduleType: string,
  handler: ModuleHandler
): void {
  if (HANDLER_REGISTRY.has(moduleType)) {
    console.warn(`⚠️  Handler for ${moduleType} is being overwritten`);
  }
  HANDLER_REGISTRY.set(moduleType, handler);
  console.log(`✅ Registered handler for ${moduleType}`);
}

/**
 * Obter handler por moduleType
 */
export function getHandler(moduleType: string): ModuleHandler | undefined {
  return HANDLER_REGISTRY.get(moduleType);
}

/**
 * Verificar se moduleType tem handler registrado
 */
export function hasHandler(moduleType: string): boolean {
  return HANDLER_REGISTRY.has(moduleType);
}

/**
 * Listar todos os moduleTypes registrados
 */
export function getRegisteredModuleTypes(): string[] {
  return Array.from(HANDLER_REGISTRY.keys());
}

/**
 * Inicializar todos os handlers (chamado ao iniciar servidor)
 */
export function initializeHandlers(): void {
  console.log('\n🔧 Initializing Module Handlers...\n');

  // Auto-import de todos os handlers
  // Agricultura
  import('./agriculture').then(module => module.registerAgricultureHandlers());

  // Saúde
  import('./health').then(module => module.registerHealthHandlers());

  // Educação
  import('./education').then(module => module.registerEducationHandlers());

  // Assistência Social
  import('./social').then(module => module.registerSocialHandlers());

  // Cultura
  import('./culture').then(module => module.registerCultureHandlers());

  // Esportes
  import('./sports').then(module => module.registerSportsHandlers());

  // Habitação
  import('./housing').then(module => module.registerHousingHandlers());

  // Meio Ambiente
  import('./environment').then(module => module.registerEnvironmentHandlers());

  // Obras Públicas
  import('./public-works').then(module => module.registerPublicWorksHandlers());

  // Planejamento Urbano
  import('./urban-planning').then(module => module.registerUrbanPlanningHandlers());

  // Segurança Pública
  import('./security').then(module => module.registerSecurityHandlers());

  // Serviços Públicos
  import('./public-services').then(module => module.registerPublicServicesHandlers());

  // Turismo
  import('./tourism').then(module => module.registerTourismHandlers());

  setTimeout(() => {
    console.log(`\n✅ ${HANDLER_REGISTRY.size} handlers registered successfully\n`);
    console.log('📋 Registered Modules:');
    getRegisteredModuleTypes().forEach(type => {
      console.log(`   - ${type}`);
    });
    console.log();
  }, 1000);
}

// ============================================================================
// HELPER PARA CRIAR HANDLERS
// ============================================================================

/**
 * Factory para criar handlers padrão com menos boilerplate
 */
export function createStandardHandler<T>(config: {
  entityName: string; // Nome da entidade no Prisma (ex: 'ruralProducer')
  mapFormData: (formData: Record<string, any>, citizenId: string) => Partial<T>;
  validateFormData?: (formData: Record<string, any>) => { valid: boolean; errors?: string[] };
}): ModuleHandler {
  return {
    async createEntity(protocolId, formData, citizenId, prisma) {
      const data = {
        ...config.mapFormData(formData, citizenId),
        protocolId,
        status: 'PENDING',
        isActive: false
      };

      const entity = await (prisma as any)[config.entityName].create({
        data
      });

      return entity;
    },

    async activateEntity(entityId, prisma) {
      await (prisma as any)[config.entityName].update({
        where: { id: entityId },
        data: {
          status: 'ACTIVE',
          isActive: true,
          approvedAt: new Date()
        }
      });
    },

    async findByProtocolId(protocolId, prisma) {
      return await (prisma as any)[config.entityName].findFirst({
        where: { protocolId }
      });
    },

    async updateEntity(entityId, data, prisma) {
      return await (prisma as any)[config.entityName].update({
        where: { id: entityId },
        data
      });
    },

    async deleteEntity(entityId, prisma) {
      await (prisma as any)[config.entityName].update({
        where: { id: entityId },
        data: { isActive: false, deletedAt: new Date() }
      });
    },

    validateFormData(formData) {
      if (config.validateFormData) {
        return config.validateFormData(formData);
      }
      return { valid: true };
    }
  };
}
```

**Entregas:**
- [ ] Registry de handlers criado
- [ ] Sistema de auto-registro implementado
- [ ] Factory de handlers padrão
- [ ] Testes do registry

#### 1.3. Componente DynamicForm 

**Tarefa:** Criar componente universal de formulário baseado em JSON Schema

**Arquivo:** `frontend/components/forms/DynamicForm.tsx`

```typescript
/**
 * DYNAMIC FORM COMPONENT
 *
 * Componente universal que renderiza formulários a partir de JSON Schema
 * Utilizado por TODOS os módulos COM_DADOS
 *
 * Features:
 * - Validação automática baseada em schema
 * - Tipos de campo automáticos (text, number, date, select, etc)
 * - Upload de documentos integrado
 * - Estados de loading/erro
 * - Acessibilidade (WCAG 2.1 AA)
 * - Responsivo (mobile-first)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FieldErrors } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { FileUpload } from '@/components/ui/file-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  title: string;
  description?: string;
  format?: 'date' | 'datetime' | 'email' | 'uri' | 'tel';
  enum?: string[];
  enumNames?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  placeholder?: string;
  widget?: 'textarea' | 'select' | 'radio' | 'checkbox' | 'file';
  rows?: number;
  accept?: string; // Para file inputs
  multiple?: boolean;
  errorMessage?: string;
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  dependencies?: Record<string, any>;
}

export interface DynamicFormProps {
  schema: JSONSchema;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  defaultValues?: Record<string, any>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  disabled?: boolean;
  showRequiredIndicator?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Converter JSON Schema para Zod Schema para validação
 */
function jsonSchemaToZod(jsonSchema: JSONSchema): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  Object.entries(jsonSchema.properties).forEach(([key, prop]) => {
    let zodType: z.ZodTypeAny;

    // Tipo base
    switch (prop.type) {
      case 'string':
        zodType = z.string();
        if (prop.minLength) zodType = (zodType as z.ZodString).min(prop.minLength);
        if (prop.maxLength) zodType = (zodType as z.ZodString).max(prop.maxLength);
        if (prop.pattern) zodType = (zodType as z.ZodString).regex(new RegExp(prop.pattern));
        if (prop.format === 'email') zodType = (zodType as z.ZodString).email();
        if (prop.enum) zodType = z.enum(prop.enum as [string, ...string[]]);
        break;

      case 'number':
      case 'integer':
        zodType = z.number();
        if (prop.minimum !== undefined) zodType = (zodType as z.ZodNumber).min(prop.minimum);
        if (prop.maximum !== undefined) zodType = (zodType as z.ZodNumber).max(prop.maximum);
        if (prop.type === 'integer') zodType = (zodType as z.ZodNumber).int();
        break;

      case 'boolean':
        zodType = z.boolean();
        break;

      case 'array':
        zodType = z.array(z.any());
        break;

      default:
        zodType = z.any();
    }

    // Opcional ou obrigatório
    if (!jsonSchema.required?.includes(key)) {
      zodType = zodType.optional();
    }

    shape[key] = zodType;
  });

  return z.object(shape);
}

/**
 * Renderizar campo baseado no tipo
 */
function renderField(
  key: string,
  prop: JSONSchemaProperty,
  register: any,
  errors: FieldErrors,
  isRequired: boolean
): JSX.Element {
  const errorMessage = errors[key]?.message as string | undefined;

  const baseProps = {
    id: key,
    'aria-required': isRequired,
    'aria-invalid': !!errorMessage,
    'aria-describedby': errorMessage ? `${key}-error` : undefined,
  };

  // Select / Dropdown
  if (prop.enum || prop.widget === 'select') {
    return (
      <div key={key} className="form-field">
        <label htmlFor={key} className="form-label">
          {prop.title}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        {prop.description && (
          <p className="text-sm text-gray-500 mb-2">{prop.description}</p>
        )}
        <Select {...register(key)} {...baseProps}>
          <option value="">Selecione...</option>
          {prop.enum?.map((value, index) => (
            <option key={value} value={value}>
              {prop.enumNames?.[index] || value}
            </option>
          ))}
        </Select>
        {errorMessage && (
          <p id={`${key}-error`} className="text-sm text-red-500 mt-1">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  // Textarea
  if (prop.widget === 'textarea') {
    return (
      <div key={key} className="form-field">
        <label htmlFor={key} className="form-label">
          {prop.title}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        {prop.description && (
          <p className="text-sm text-gray-500 mb-2">{prop.description}</p>
        )}
        <Textarea
          {...register(key)}
          {...baseProps}
          rows={prop.rows || 4}
          placeholder={prop.placeholder}
          maxLength={prop.maxLength}
        />
        {errorMessage && (
          <p id={`${key}-error`} className="text-sm text-red-500 mt-1">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  // Date Picker
  if (prop.format === 'date' || prop.format === 'datetime') {
    return (
      <div key={key} className="form-field">
        <label htmlFor={key} className="form-label">
          {prop.title}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        {prop.description && (
          <p className="text-sm text-gray-500 mb-2">{prop.description}</p>
        )}
        <DatePicker
          {...register(key)}
          {...baseProps}
          showTime={prop.format === 'datetime'}
        />
        {errorMessage && (
          <p id={`${key}-error`} className="text-sm text-red-500 mt-1">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  // File Upload
  if (prop.widget === 'file') {
    return (
      <div key={key} className="form-field">
        <label htmlFor={key} className="form-label">
          {prop.title}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        {prop.description && (
          <p className="text-sm text-gray-500 mb-2">{prop.description}</p>
        )}
        <FileUpload
          {...register(key)}
          {...baseProps}
          accept={prop.accept}
          multiple={prop.multiple}
        />
        {errorMessage && (
          <p id={`${key}-error`} className="text-sm text-red-500 mt-1">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  // Input padrão (text, number, email, tel, etc)
  const inputType =
    prop.format === 'email' ? 'email' :
    prop.format === 'tel' ? 'tel' :
    prop.type === 'number' || prop.type === 'integer' ? 'number' :
    'text';

  return (
    <div key={key} className="form-field">
      <label htmlFor={key} className="form-label">
        {prop.title}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      {prop.description && (
        <p className="text-sm text-gray-500 mb-2">{prop.description}</p>
      )}
      <Input
        {...register(key)}
        {...baseProps}
        type={inputType}
        placeholder={prop.placeholder}
        maxLength={prop.maxLength}
        min={prop.minimum}
        max={prop.maximum}
      />
      {errorMessage && (
        <p id={`${key}-error`} className="text-sm text-red-500 mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function DynamicForm({
  schema,
  onSubmit,
  defaultValues,
  submitLabel = 'Enviar',
  cancelLabel = 'Cancelar',
  onCancel,
  disabled = false,
  showRequiredIndicator = true
}: DynamicFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Gerar schema Zod a partir do JSON Schema
  const zodSchema = jsonSchemaToZod(schema);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues
  });

  // Handler de submit
  const onSubmitHandler = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onSubmit(data);
      setSubmitSuccess(true);
      reset();
    } catch (error: any) {
      setSubmitError(error.message || 'Erro ao enviar formulário');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="dynamic-form space-y-6">
      {/* Indicador de campos obrigatórios */}
      {showRequiredIndicator && schema.required && schema.required.length > 0 && (
        <Alert>
          <AlertDescription>
            <span className="text-red-500">*</span> Campos obrigatórios
          </AlertDescription>
        </Alert>
      )}

      {/* Mensagens de erro/sucesso */}
      {submitError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {submitSuccess && (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Formulário enviado com sucesso!</AlertDescription>
        </Alert>
      )}

      {/* Renderizar campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(schema.properties).map(([key, prop]) =>
          renderField(
            key,
            prop,
            register,
            errors,
            schema.required?.includes(key) || false
          )
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={disabled || isSubmitting}
          className="flex-1 md:flex-none"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 md:flex-none"
          >
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default DynamicForm;
```

**Entregas:**
- [ ] Componente DynamicForm completo
- [ ] Suporte a todos os tipos de campo
- [ ] Validação integrada (Zod + JSON Schema)
- [ ] Acessibilidade (ARIA labels, keyboard nav)
- [ ] Responsividade mobile-first
- [ ] Testes de componente (Jest + React Testing Library)

### ETAPA Agricultura 100% Funcional

#### 2.1. Serviços de Agricultura (6 módulos COM_DADOS)

**Implementar completamente:**

1. **CADASTRO_PRODUTOR** ✅ (Já parcialmente implementado)
   - [ ] Completar formSchema
   - [ ] Handler completo
   - [ ] Frontend com DynamicForm
   - [ ] Testes E2E

2. **ASSISTENCIA_TECNICA** (Novo)
   - [ ] Model Prisma: `TechnicalAssistance`
   - [ ] Handler: `technical-assistance-handler.ts`
   - [ ] FormSchema completo
   - [ ] Frontend: `/agricultura/assistencia-tecnica/page.tsx`
   - [ ] Integração com protocolo
   - [ ] Testes

3. **INSCRICAO_CURSO_RURAL** (Novo)
   - [ ] Model Prisma: `RuralCourseEnrollment`
   - [ ] Handler: `rural-course-handler.ts`
   - [ ] FormSchema completo
   - [ ] Frontend: `/agricultura/cursos/page.tsx`
   - [ ] Integração com protocolo
   - [ ] Testes

4. **INSCRICAO_PROGRAMA_RURAL** ✅ (Já implementado)
   - [ ] Validar implementação existente
   - [ ] Adicionar formSchema
   - [ ] Testes completos

5. **CADASTRO_PROPRIEDADE_RURAL** ✅ (Já implementado)
   - [ ] Validar implementação existente
   - [ ] Adicionar formSchema
   - [ ] Testes completos

6. **ATENDIMENTOS_AGRICULTURA** (Novo)
   - [ ] Model Prisma: `AgricultureAttendance`
   - [ ] Handler: `agriculture-attendance-handler.ts`
   - [ ] FormSchema completo
   - [ ] Frontend: `/agricultura/atendimentos/page.tsx`
   - [ ] Integração com protocolo
   - [ ] Testes

**Padrão de Implementação (Exemplo: ASSISTENCIA_TECNICA):**

```typescript
// ============================================================================
// MODEL PRISMA
// ============================================================================

model TechnicalAssistance {
  id                String          @id @default(cuid())
  protocolId        String          @unique
  protocol          ProtocolSimplified @relation(fields: [protocolId], references: [id])

  // Produtor
  producerId        String
  producer          RuralProducer   @relation(fields: [producerId], references: [id])

  // Dados da Solicitação
  assistanceType    String          // ORIENTACAO_TECNICA, ANALISE_SOLO, CONTROLE_PRAGAS, etc
  propertyId        String?
  property          RuralProperty?  @relation(fields: [propertyId], references: [id])

  area              Float?          // Área a ser atendida (hectares)
  crops             String[]        // Culturas/criações
  problem           String          // Descrição do problema
  urgency           String          @default("NORMAL") // NORMAL, HIGH, CRITICAL

  // Agendamento
  preferredDate     DateTime?
  scheduledDate     DateTime?
  visitDate         DateTime?

  // Atendimento
  technicianId      String?
  technicianName    String?
  visitReport       String?
  recommendations   Json?
  followUpNeeded    Boolean         @default(false)
  followUpDate      DateTime?

  // Status e Controle
  status            String          @default("PENDING") // PENDING, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  isActive          Boolean         @default(false)
  approvedAt        DateTime?
  completedAt       DateTime?

  // Metadados
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@index([producerId])
  @@index([status])
  @@index([scheduledDate])
}

// ============================================================================
// HANDLER
// ============================================================================

// backend/src/modules/handlers/agriculture/technical-assistance-handler.ts

import { PrismaClient } from '@prisma/client';
import { ModuleHandler, createStandardHandler } from '../registry';

export const technicalAssistanceHandler: ModuleHandler = createStandardHandler({
  entityName: 'technicalAssistance',

  mapFormData: (formData, citizenId) => {
    // Buscar produtor pelo CPF do cidadão
    // (isso será feito na criação real com query ao banco)
    return {
      producerId: formData.producerId, // Será obtido via CPF
      assistanceType: formData.assistanceType,
      propertyId: formData.propertyId || null,
      area: formData.area ? parseFloat(formData.area) : null,
      crops: formData.crops || [],
      problem: formData.problem,
      urgency: formData.urgency || 'NORMAL',
      preferredDate: formData.preferredDate ? new Date(formData.preferredDate) : null
    };
  },

  validateFormData: (formData) => {
    const errors: string[] = [];

    if (!formData.assistanceType) {
      errors.push('Tipo de assistência é obrigatório');
    }

    if (!formData.problem || formData.problem.length < 10) {
      errors.push('Descrição do problema deve ter pelo menos 10 caracteres');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
});

// ============================================================================
// FORMSCHEMA
// ============================================================================

// Em services-simplified-complete.ts:

{
  name: 'Assistência Técnica Rural',
  moduleType: 'ASSISTENCIA_TECNICA',
  formSchema: {
    type: 'object',
    properties: {
      assistanceType: {
        type: 'string',
        title: 'Tipo de Assistência',
        enum: [
          'ORIENTACAO_TECNICA',
          'ANALISE_SOLO',
          'CONTROLE_PRAGAS',
          'MANEJO_CULTURAS',
          'IRRIGACAO',
          'MECANIZACAO',
          'GESTAO_RURAL',
          'OUTROS'
        ],
        enumNames: [
          'Orientação Técnica',
          'Análise de Solo',
          'Controle de Pragas e Doenças',
          'Manejo de Culturas',
          'Sistemas de Irrigação',
          'Mecanização Agrícola',
          'Gestão e Administração Rural',
          'Outros'
        ]
      },
      propertyId: {
        type: 'string',
        title: 'Propriedade',
        description: 'Selecione a propriedade a ser atendida',
        widget: 'select' // Será populado dinamicamente com propriedades do produtor
      },
      area: {
        type: 'number',
        title: 'Área a ser Atendida (hectares)',
        minimum: 0,
        maximum: 10000
      },
      crops: {
        type: 'array',
        title: 'Culturas/Criações',
        description: 'Selecione as culturas ou criações relacionadas',
        items: { type: 'string' },
        widget: 'multiselect',
        options: [
          'Milho', 'Feijão', 'Arroz', 'Soja', 'Mandioca', 'Café',
          'Hortaliças', 'Frutas', 'Gado de Leite', 'Gado de Corte',
          'Suínos', 'Aves', 'Piscicultura', 'Outros'
        ]
      },
      problem: {
        type: 'string',
        title: 'Descrição do Problema/Necessidade',
        widget: 'textarea',
        rows: 6,
        minLength: 10,
        maxLength: 2000,
        placeholder: 'Descreva detalhadamente o problema ou a necessidade de assistência técnica...'
      },
      urgency: {
        type: 'string',
        title: 'Urgência',
        enum: ['NORMAL', 'HIGH', 'CRITICAL'],
        enumNames: ['Normal', 'Alta', 'Crítica'],
        default: 'NORMAL'
      },
      preferredDate: {
        type: 'string',
        format: 'date',
        title: 'Data Preferencial para Visita',
        description: 'Quando você gostaria de receber a visita técnica?',
        minimum: new Date().toISOString().split('T')[0] // Não pode ser passado
      },
      observations: {
        type: 'string',
        title: 'Observações Adicionais',
        widget: 'textarea',
        rows: 3,
        maxLength: 500
      }
    },
    required: ['assistanceType', 'problem']
  },
  requiredDocuments: [
    'Cadastro de Produtor',
    'Documento da Propriedade (se aplicável)'
  ],
  estimatedDays: 15,
  priority: 4
}

// ============================================================================
// FRONTEND
// ============================================================================

// frontend/app/admin/secretarias/agricultura/assistencia-tecnica/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function AssistenciaTecnicaPage() {
  const [service, setService] = useState<any>(null);
  const [assistances, setAssistances] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Buscar serviço de Assistência Técnica
    fetch('/api/admin/secretarias/agricultura/services')
      .then(res => res.json())
      .then(data => {
        const service = data.data.find(s => s.moduleType === 'ASSISTENCIA_TECNICA');
        setService(service);
      });

    // Buscar assistências técnicas
    loadAssistances();
  }, []);

  const loadAssistances = () => {
    fetch('/api/admin/secretarias/agricultura/assistencias-tecnicas')
      .then(res => res.json())
      .then(data => setAssistances(data.data));
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    // Criar protocolo + assistência técnica
    const response = await fetch('/api/protocols-simplified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: service.id,
        citizenData: {
          cpf: formData.cpf, // CPF do produtor
          name: formData.nome
        },
        formData
      })
    });

    if (response.ok) {
      setShowForm(false);
      loadAssistances();
    }
  };

  if (!service) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assistência Técnica Rural</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Cancelar' : 'Nova Solicitação'}
        </Button>
      </div>

      {showForm && (
        <DynamicForm
          schema={service.formSchema}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          submitLabel="Criar Solicitação"
        />
      )}

      <DataTable
        columns={[
          { header: 'Protocolo', accessorKey: 'protocol.number' },
          { header: 'Produtor', accessorKey: 'producer.name' },
          { header: 'Tipo', accessorKey: 'assistanceType' },
          { header: 'Urgência', accessorKey: 'urgency' },
          { header: 'Status', accessorKey: 'status' },
          { header: 'Data Preferencial', accessorKey: 'preferredDate' }
        ]}
        data={assistances}
      />
    </div>
  );
}
```

**Entregas:**
- [ ] 6 módulos COM_DADOS de Agricultura 100% funcionais
- [ ] CRUD completo para cada módulo
- [ ] Formulários dinâmicos baseados em FormSchema
- [ ] Integração total com motor de protocolos
- [ ] Dashboard de agricultura atualizado
- [ ] Testes E2E completos
- [ ] Documentação de uso

---

## 📅 FASE 2 - SAÚDE, EDUCAÇÃO E ASSISTÊNCIA SOCIAL 

**Objetivo:** Implementar 100% dos módulos das 3 secretarias mais críticas

### ETAPA Saúde (11 serviços COM_DADOS)

**Status Atual:** 1 rota parcial (secretarias-saude.ts) - 9% implementado

**Módulos a Implementar:**

1. **ATENDIMENTOS_SAUDE** ✅ (Parcialmente implementado)
2. **AGENDAMENTOS_MEDICOS** (Novo)
3. **CONTROLE_MEDICAMENTOS** ✅ (Parcial)
4. **CAMPANHAS_SAUDE** ✅ (Parcial)
5. **PROGRAMAS_SAUDE** (Novo)
6. **ENCAMINHAMENTOS_TFD** (Novo)
7. **EXAMES** (Novo)
8. **TRANSPORTE_PACIENTES** (Novo)
9. **CADASTRO_PACIENTE** (Novo)
10. **VACINACAO** (Novo)
11. **GESTAO_ACS** (Novo)

**Padrão de Implementação:**

Seguir mesma estrutura da Agricultura:
- Model Prisma para cada módulo
- Handler específico com validações
- FormSchema completo
- Frontend com DynamicForm
- Integração com protocolo
- Testes E2E

**Exemplo: AGENDAMENTOS_MEDICOS**

```typescript
// MODEL
model MedicalAppointment {
  id                String              @id @default(cuid())
  protocolId        String              @unique
  protocol          ProtocolSimplified  @relation(fields: [protocolId], references: [id])

  // Paciente
  patientId         String?
  patient           Patient?            @relation(fields: [patientId], references: [id])
  patientName       String
  patientCpf        String
  patientPhone      String
  patientBirthDate  DateTime

  // Agendamento
  healthUnitId      String
  healthUnit        HealthUnit          @relation(fields: [healthUnitId], references: [id])
  speciality        String
  doctorId          String?
  appointmentDate   DateTime
  appointmentTime   String

  // Detalhes
  symptoms          String?
  observations      String?
  priority          String              @default("NORMAL") // NORMAL, HIGH, EMERGENCY

  // Status
  status            String              @default("SCHEDULED") // SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
  isActive          Boolean             @default(true)
  confirmedAt       DateTime?
  completedAt       DateTime?

  // Metadados
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([patientCpf])
  @@index([appointmentDate])
  @@index([status])
}

// FORMSCHEMA
{
  name: 'Agendamento de Consulta Médica',
  moduleType: 'AGENDAMENTOS_MEDICOS',
  formSchema: {
    type: 'object',
    properties: {
      // Dados do Paciente
      patientName: {
        type: 'string',
        title: 'Nome Completo do Paciente',
        minLength: 3,
        maxLength: 200
      },
      patientCpf: {
        type: 'string',
        title: 'CPF do Paciente',
        pattern: '^\\d{11}$',
        errorMessage: 'CPF deve conter 11 dígitos'
      },
      patientPhone: {
        type: 'string',
        title: 'Telefone para Contato',
        pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$',
        placeholder: '(00) 00000-0000'
      },
      patientBirthDate: {
        type: 'string',
        format: 'date',
        title: 'Data de Nascimento',
        maximum: new Date().toISOString().split('T')[0]
      },

      // Dados do Agendamento
      healthUnitId: {
        type: 'string',
        title: 'Unidade de Saúde',
        widget: 'select' // Populado dinamicamente
      },
      speciality: {
        type: 'string',
        title: 'Especialidade',
        enum: [
          'CLINICA_GERAL',
          'PEDIATRIA',
          'GINECOLOGIA',
          'CARDIOLOGIA',
          'ORTOPEDIA',
          'OFTALMOLOGIA',
          'ODONTOLOGIA',
          'PSICOLOGIA',
          'OUTROS'
        ],
        enumNames: [
          'Clínica Geral',
          'Pediatria',
          'Ginecologia/Obstetrícia',
          'Cardiologia',
          'Ortopedia',
          'Oftalmologia',
          'Odontologia',
          'Psicologia',
          'Outros'
        ]
      },
      appointmentDate: {
        type: 'string',
        format: 'date',
        title: 'Data Preferencial',
        minimum: new Date().toISOString().split('T')[0]
      },
      appointmentTime: {
        type: 'string',
        title: 'Horário Preferencial',
        enum: [
          '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
          '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
          '15:00', '15:30', '16:00', '16:30'
        ]
      },
      symptoms: {
        type: 'string',
        title: 'Sintomas ou Motivo da Consulta',
        widget: 'textarea',
        rows: 4,
        minLength: 10,
        maxLength: 1000
      },
      priority: {
        type: 'string',
        title: 'Prioridade',
        enum: ['NORMAL', 'HIGH', 'EMERGENCY'],
        enumNames: ['Normal', 'Alta', 'Emergência'],
        default: 'NORMAL',
        description: 'Selecione "Emergência" apenas para casos urgentes'
      },
      observations: {
        type: 'string',
        title: 'Observações',
        widget: 'textarea',
        rows: 2,
        maxLength: 500
      }
    },
    required: ['patientName', 'patientCpf', 'patientPhone', 'patientBirthDate', 'healthUnitId', 'speciality', 'appointmentDate', 'appointmentTime', 'symptoms']
  },
  requiredDocuments: [
    'Cartão SUS',
    'Documento de Identidade (RG ou CNH)'
  ],
  estimatedDays: 7,
  priority: 4
}
```

**Entregas:**
- [ ] 11 módulos de Saúde 100% funcionais
- [ ] Dashboard de saúde completo
- [ ] Relatórios de atendimento
- [ ] Testes E2E

### ETAPA Educação (10 serviços COM_DADOS)

**Status Atual:** 0% implementado - Nenhuma rota backend

**Módulos a Implementar:**

1. **ATENDIMENTOS_EDUCACAO**
2. **MATRICULA_ALUNO**
3. **TRANSPORTE_ESCOLAR**
4. **REGISTRO_OCORRENCIA_ESCOLAR**
5. **SOLICITACAO_DOCUMENTO_ESCOLAR**
6. **TRANSFERENCIA_ESCOLAR**
7. **CONSULTA_FREQUENCIA**
8. **CONSULTA_NOTAS**
9. **GESTAO_ESCOLAR**
10. **GESTAO_MERENDA**

**Prioridade:** MATRICULA_ALUNO e TRANSPORTE_ESCOLAR (alta demanda)

**Entregas:**
- [ ] 10 módulos de Educação 100% funcionais
- [ ] Sistema de matrícula online
- [ ] Gestão de transporte escolar
- [ ] Testes E2E

### ETAPA Assistência Social (9 serviços COM_DADOS)

**Status Atual:** Rota GET parcial - 0% de CRUD

**Módulos a Implementar:**

1. **ATENDIMENTOS_ASSISTENCIA_SOCIAL**
2. **CADASTRO_UNICO** (CadÚnico)
3. **SOLICITACAO_BENEFICIO**
4. **ENTREGA_EMERGENCIAL**
5. **INSCRICAO_GRUPO_OFICINA**
6. **VISITAS_DOMICILIARES**
7. **INSCRICAO_PROGRAMA_SOCIAL**
8. **AGENDAMENTO_ATENDIMENTO_SOCIAL**
9. **GESTAO_CRAS_CREAS**

**Prioridade:** CADASTRO_UNICO e SOLICITACAO_BENEFICIO (impacto social alto)

**Entregas:**
- [ ] 9 módulos de Assistência Social 100% funcionais
- [ ] Integração com CadÚnico federal (se aplicável)
- [ ] Gestão de benefícios
- [ ] Testes E2E

---

## 📅 FASE 3 - PLANEJAMENTO, OBRAS E SERVIÇOS 

**Objetivo:** Implementar secretarias de infraestrutura e serviços urbanos

### ETAPA Planejamento Urbano (7 serviços COM_DADOS)

**Status Atual:** 0% implementado

**Módulos a Implementar:**

1. **ATENDIMENTOS_PLANEJAMENTO**
2. **APROVACAO_PROJETO** (Arquitetônico)
3. **ALVARA_CONSTRUCAO**
4. **ALVARA_FUNCIONAMENTO**
5. **SOLICITACAO_CERTIDAO**
6. **DENUNCIA_CONSTRUCAO_IRREGULAR**
7. **CADASTRO_LOTEAMENTO**

**Prioridade Crítica:** ALVARA_CONSTRUCAO e ALVARA_FUNCIONAMENTO

**Exemplo: ALVARA_CONSTRUCAO**

```typescript
// MODEL
model BuildingPermit {
  id                  String              @id @default(cuid())
  protocolId          String              @unique
  protocol            ProtocolSimplified  @relation(fields: [protocolId], references: [id])

  // Solicitante
  ownerName           String
  ownerCpf            String
  ownerPhone          String
  ownerEmail          String?

  // Propriedade
  propertyAddress     String
  propertyNumber      String?
  neighborhood        String
  lotNumber           String?
  block               String?
  subdivision         String?
  registryNumber      String? // Matrícula do imóvel

  // Projeto
  projectType         String // NEW_CONSTRUCTION, RENOVATION, EXPANSION, DEMOLITION
  constructionArea    Float // m²
  totalArea           Float // m²
  floors              Int
  rooms               Int?
  parking             Int?

  // Profissional Responsável
  engineerName        String
  engineerCrea        String
  engineerPhone       String
  artNumber           String? // ART - Anotação de Responsabilidade Técnica

  // Projeto Aprovado
  projectApprovalId   String?
  projectApproval     ProjectApproval?    @relation(fields: [projectApprovalId], references: [id])

  // Status e Prazos
  status              String              @default("ANALYSIS") // ANALYSIS, APPROVED, REJECTED, ISSUED, EXPIRED
  analysisStartedAt   DateTime?
  approvedAt          DateTime?
  issuedAt            DateTime?
  expiresAt           DateTime?

  // Observações
  observations        String?
  rejectionReason     String?

  // Controle
  isActive            Boolean             @default(true)
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  @@index([ownerCpf])
  @@index([status])
  @@index([expiresAt])
}

// FORMSCHEMA
{
  name: 'Alvará de Construção',
  moduleType: 'ALVARA_CONSTRUCAO',
  formSchema: {
    type: 'object',
    properties: {
      // Dados do Proprietário
      ownerName: {
        type: 'string',
        title: 'Nome do Proprietário',
        minLength: 3,
        maxLength: 200
      },
      ownerCpf: {
        type: 'string',
        title: 'CPF do Proprietário',
        pattern: '^\\d{11}$'
      },
      ownerPhone: {
        type: 'string',
        title: 'Telefone',
        pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$'
      },
      ownerEmail: {
        type: 'string',
        format: 'email',
        title: 'E-mail'
      },

      // Dados da Propriedade
      propertyAddress: {
        type: 'string',
        title: 'Endereço Completo',
        minLength: 10
      },
      propertyNumber: {
        type: 'string',
        title: 'Número'
      },
      neighborhood: {
        type: 'string',
        title: 'Bairro'
      },
      lotNumber: {
        type: 'string',
        title: 'Número do Lote'
      },
      block: {
        type: 'string',
        title: 'Quadra'
      },
      subdivision: {
        type: 'string',
        title: 'Loteamento'
      },
      registryNumber: {
        type: 'string',
        title: 'Matrícula do Imóvel',
        description: 'Número da matrícula no Cartório de Registro de Imóveis'
      },

      // Dados do Projeto
      projectType: {
        type: 'string',
        title: 'Tipo de Obra',
        enum: ['NEW_CONSTRUCTION', 'RENOVATION', 'EXPANSION', 'DEMOLITION'],
        enumNames: ['Construção Nova', 'Reforma', 'Ampliação', 'Demolição']
      },
      constructionArea: {
        type: 'number',
        title: 'Área a Construir/Reformar (m²)',
        minimum: 1,
        maximum: 100000
      },
      totalArea: {
        type: 'number',
        title: 'Área Total do Terreno (m²)',
        minimum: 1,
        maximum: 1000000
      },
      floors: {
        type: 'integer',
        title: 'Número de Pavimentos',
        minimum: 1,
        maximum: 50
      },
      rooms: {
        type: 'integer',
        title: 'Número de Cômodos',
        minimum: 1
      },
      parking: {
        type: 'integer',
        title: 'Vagas de Garagem',
        minimum: 0
      },

      // Responsável Técnico
      engineerName: {
        type: 'string',
        title: 'Nome do Engenheiro/Arquiteto Responsável',
        minLength: 3
      },
      engineerCrea: {
        type: 'string',
        title: 'CREA/CAU',
        description: 'Número do registro profissional'
      },
      engineerPhone: {
        type: 'string',
        title: 'Telefone do Responsável Técnico',
        pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$'
      },
      artNumber: {
        type: 'string',
        title: 'Número da ART/RRT',
        description: 'Anotação de Responsabilidade Técnica'
      },

      // Observações
      observations: {
        type: 'string',
        title: 'Observações',
        widget: 'textarea',
        rows: 3,
        maxLength: 500
      }
    },
    required: [
      'ownerName', 'ownerCpf', 'ownerPhone',
      'propertyAddress', 'neighborhood',
      'projectType', 'constructionArea', 'totalArea', 'floors',
      'engineerName', 'engineerCrea', 'engineerPhone'
    ]
  },
  requiredDocuments: [
    'RG e CPF do Proprietário',
    'Matrícula do Imóvel',
    'Projeto Arquitetônico Aprovado',
    'ART/RRT do Responsável Técnico',
    'Comprovante de Pagamento de Taxas'
  ],
  estimatedDays: 20,
  priority: 5
}
```

**Entregas:**
- [ ] 7 módulos de Planejamento Urbano 100% funcionais
- [ ] Sistema de emissão de alvarás
- [ ] Controle de prazos e vencimentos
- [ ] Testes E2E

### ETAPA Obras Públicas (5 serviços COM_DADOS)

**Status Atual:** 0% implementado

**Módulos a Implementar:**

1. **ATENDIMENTOS_OBRAS**
2. **SOLICITACAO_REPARO_VIA**
3. **VISTORIA_TECNICA_OBRAS**
4. **CADASTRO_OBRA_PUBLICA**
5. **INSPECAO_OBRA**

**Prioridade:** SOLICITACAO_REPARO_VIA (alta demanda popular)

**Entregas:**
- [ ] 5 módulos de Obras Públicas 100% funcionais
- [ ] Mapa de solicitações de reparo
- [ ] Priorização por geolocalização
- [ ] Testes E2E

### ETAPA Serviços Públicos (7 serviços COM_DADOS)

**Status Atual:** 0% implementado

**Módulos a Implementar:**

1. **ATENDIMENTOS_SERVICOS_PUBLICOS**
2. **ILUMINACAO_PUBLICA**
3. **LIMPEZA_URBANA**
4. **COLETA_ESPECIAL**
5. **SOLICITACAO_CAPINA**
6. **SOLICITACAO_DESOBSTRUCAO**
7. **SOLICITACAO_PODA**

**Prioridade:** ILUMINACAO_PUBLICA e LIMPEZA_URBANA

**Entregas:**
- [ ] 7 módulos de Serviços Públicos 100% funcionais
- [ ] App móvel para solicitações (opcional)
- [ ] Mapa de ocorrências
- [ ] Testes E2E

### ETAPA Integração e Refinamento Fase 3

**Entregas:**
- [ ] Integração completa das 3 secretarias da Fase 3
- [ ] Dashboards unificados
- [ ] Relatórios gerenciais
- [ ] Correção de bugs
- [ ] Otimização de performance

---

## 📅 FASE 4 - DEMAIS SECRETARIAS E REFINAMENTO 

**Objetivo:** Completar 100% do sistema + refinamento final

### ETAPA Cultura, Esportes, Habitação (26 serviços)

**Distribuição:**
- **Cultura:** 8 serviços COM_DADOS 
- **Esportes:** 8 serviços COM_DADOS 
- **Habitação:** 6 serviços COM_DADOS 

**Cultura:**
1. ATENDIMENTOS_CULTURA
2. RESERVA_ESPACO_CULTURAL
3. INSCRICAO_OFICINA_CULTURAL
4. CADASTRO_GRUPO_ARTISTICO
5. PROJETO_CULTURAL
6. SUBMISSAO_PROJETO_CULTURAL
7. CADASTRO_EVENTO_CULTURAL
8. REGISTRO_MANIFESTACAO_CULTURAL

**Esportes:**
1. ATENDIMENTOS_ESPORTES
2. INSCRICAO_ESCOLINHA
3. CADASTRO_ATLETA
4. RESERVA_ESPACO_ESPORTIVO
5. INSCRICAO_COMPETICAO
6. CADASTRO_EQUIPE_ESPORTIVA
7. INSCRICAO_TORNEIO
8. CADASTRO_MODALIDADE

**Habitação:**
1. ATENDIMENTOS_HABITACAO
2. INSCRICAO_PROGRAMA_HABITACIONAL
3. REGULARIZACAO_FUNDIARIA
4. SOLICITACAO_AUXILIO_ALUGUEL
5. CADASTRO_UNIDADE_HABITACIONAL
6. INSCRICAO_FILA_HABITACAO

**Entregas:**
- [ ] 26 módulos 100% funcionais
- [ ] 3 dashboards completos
- [ ] Testes E2E

### ETAPA Meio Ambiente, Segurança, Turismo (19 serviços)

**Distribuição:**
- **Meio Ambiente:** 6 serviços COM_DADOS 
- **Segurança Pública:** 8 serviços COM_DADOS 
- **Turismo:** 7 serviços COM_DADOS 

**Meio Ambiente:**
1. ATENDIMENTOS_MEIO_AMBIENTE
2. LICENCA_AMBIENTAL
3. DENUNCIA_AMBIENTAL
4. PROGRAMA_AMBIENTAL
5. AUTORIZACAO_PODA_CORTE
6. VISTORIA_AMBIENTAL

**Segurança Pública:**
1. ATENDIMENTOS_SEGURANCA
2. REGISTRO_OCORRENCIA
3. SOLICITACAO_RONDA
4. SOLICITACAO_CAMERA_SEGURANCA
5. DENUNCIA_ANONIMA
6. CADASTRO_PONTO_CRITICO
7. ALERTA_SEGURANCA
8. REGISTRO_PATRULHA

**Turismo:**
1. ATENDIMENTOS_TURISMO
2. CADASTRO_ESTABELECIMENTO_TURISTICO
3. CADASTRO_GUIA_TURISTICO
4. INSCRICAO_PROGRAMA_TURISTICO
5. REGISTRO_ATRATIVO_TURISTICO
6. CADASTRO_ROTEIRO_TURISTICO
7. CADASTRO_EVENTO_TURISTICO

**Entregas:**
- [ ] 19 módulos 100% funcionais
- [ ] 3 dashboards completos
- [ ] Testes E2E

### ETAPA Refinamento Geral

**Foco:** Qualidade e UX

**Tarefas:**
- [ ] Revisar todos os 102 formulários
- [ ] Padronizar mensagens de erro/sucesso
- [ ] Otimizar queries do banco de dados
- [ ] Implementar cache (Redis)
- [ ] Melhorar loading states
- [ ] Acessibilidade (WCAG 2.1 AA)
- [ ] Responsividade mobile
- [ ] Testes de carga (Apache JMeter)

### ETAPA Documentação e Entrega

**Entregas Finais:**

1. **Documentação Técnica**
   - [ ] API Documentation (Swagger/OpenAPI)
   - [ ] Guias de cada módulo
   - [ ] Diagramas de arquitetura
   - [ ] Scripts de deploy

2. **Documentação de Usuário**
   - [ ] Manual do Administrador
   - [ ] Manual do Cidadão
   - [ ] FAQs
   - [ ] Vídeos tutoriais

3. **Testes Finais**
   - [ ] Smoke tests
   - [ ] Regression tests
   - [ ] UAT (User Acceptance Testing)
   - [ ] Performance tests
   - [ ] Security audit

4. **Deploy em Produção**
   - [ ] Backup completo
   - [ ] Migração de dados
   - [ ] Deploy zero-downtime
   - [ ] Monitoring (Sentry, New Relic)
   - [ ] Logs centralizados (ELK Stack)

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Por Módulo COM_DADOS

Cada um dos 102 módulos deve passar por este checklist:

#### Backend (10 pontos)
- [ ] 1. Model no Prisma Schema com todos os campos
- [ ] 2. Migration criada e aplicada com sucesso
- [ ] 3. Handler registrado no Registry
- [ ] 4. CRUD completo (Create, Read, Update, Delete)
- [ ] 5. Integração com `protocolModuleService`
- [ ] 6. Validações Zod implementadas
- [ ] 7. Tratamento de erros robusto
- [ ] 8. Logs estruturados
- [ ] 9. Testes unitários (>80% coverage)
- [ ] 10. Rota registrada em `secretarias-{nome}.ts`

#### Serviços (8 pontos)
- [ ] 1. ServiceSimplified cadastrado
- [ ] 2. FormSchema JSON completo
- [ ] 3. Todos os campos com validações
- [ ] 4. RequiredDocuments especificados
- [ ] 5. ModuleType único e mapeado
- [ ] 6. EstimatedDays realista
- [ ] 7. Priority configurada
- [ ] 8. Icon e Color definidos

#### Frontend (12 pontos)
- [ ] 1. Página do módulo criada
- [ ] 2. Formulário usando DynamicForm
- [ ] 3. Listagem com DataTable
- [ ] 4. Paginação funcionando
- [ ] 5. Filtros e busca implementados
- [ ] 6. Estados de loading
- [ ] 7. Tratamento de erros
- [ ] 8. Validação de formulário
- [ ] 9. Criar/Editar/Deletar funcionais
- [ ] 10. Responsivo (mobile, tablet, desktop)
- [ ] 11. Acessível (ARIA labels, keyboard nav)
- [ ] 12. Integração com API completa

#### Protocolo (10 pontos)
- [ ] 1. Protocolo criado ao submeter
- [ ] 2. Número de protocolo gerado
- [ ] 3. Status VINCULADO ao criar entidade
- [ ] 4. Tramitação implementada
- [ ] 5. Histórico registrado
- [ ] 6. Documentos anexáveis
- [ ] 7. Aprovação funcional
- [ ] 8. Rejeição funcional
- [ ] 9. Notificações enviadas
- [ ] 10. Integração com dashboard

#### Testes (10 pontos)
- [ ] 1. Testes unitários do handler
- [ ] 2. Testes de integração da API
- [ ] 3. Testes do componente frontend
- [ ] 4. Testes E2E do fluxo completo
- [ ] 5. Coverage >80%
- [ ] 6. Testes de validação de formulário
- [ ] 7. Testes de permissões
- [ ] 8. Testes de edge cases
- [ ] 9. Testes de performance
- [ ] 10. Testes de acessibilidade

**Total: 50 pontos por módulo**
**Meta: 100% (50/50) para cada módulo**

### Por Secretaria

Cada secretaria deve ter:

- [ ] Dashboard funcional com métricas
- [ ] Rota `/stats` retornando dados corretos
- [ ] Rota `/services` listando todos os serviços
- [ ] Todos os módulos COM_DADOS implementados
- [ ] Menu de navegação completo
- [ ] Documentação específica
- [ ] Testes E2E do fluxo principal

---

## 📈 MÉTRICAS DE SUCESSO

### Métricas de Implementação

```
🎯 METAS QUANTITATIVAS

Backend:
├─ 102 Models no Prisma ✓
├─ 102 Handlers registrados ✓
├─ 102 Rotas CRUD completas ✓
├─ 13 Rotas de Secretarias ✓
├─ Coverage de Testes >80% ✓
└─ 0 Erros em Produção ✓

Serviços:
├─ 102 FormSchemas definidos ✓
├─ 102 RequiredDocuments especificados ✓
├─ 102 ModuleTypes mapeados ✓
└─ 100% de serviços integrados ao protocolo ✓

Frontend:
├─ 140+ Páginas funcionais ✓
├─ 102 Formulários dinâmicos ✓
├─ 13 Dashboards ✓
├─ 100% Responsivo ✓
├─ WCAG 2.1 AA ✓
└─ Performance Score >90 (Lighthouse) ✓

Protocolos:
├─ 100% dos serviços COM_DADOS geram protocolo ✓
├─ Tramitação funcional ✓
├─ Histórico completo ✓
├─ Documentos anexáveis ✓
└─ Notificações automáticas ✓
```

### Métricas de Qualidade

```
📊 KPIs DE QUALIDADE

Código:
├─ 0 Handlers órfãos
├─ 0 Serviços sem FormSchema
├─ 0 Páginas sem integração
├─ 0 TODO/FIXME no código de produção
└─ 100% de código revisado (Code Review)

Testes:
├─ Coverage >80% (Backend + Frontend)
├─ 100% de fluxos críticos testados E2E
├─ 0 Testes falhando
├─ Tempo de execução <5 min (suite completa)
└─ 100% de testes documentados

Performance:
├─ Tempo de resposta API <500ms (P95)
├─ Tempo de carregamento de página <2s
├─ Lighthouse Performance >90
├─ Lighthouse Accessibility >90
└─ 0 Memory Leaks

Segurança:
├─ 0 Vulnerabilidades Críticas
├─ 0 Vulnerabilidades Altas
├─ 100% de inputs validados
├─ 100% de autenticação/autorização implementada
└─ Audit Log completo
```

### Métricas de Usabilidade

```
👥 UX METRICS

Formulários:
├─ Média <10 campos por formulário
├─ 100% com validação em tempo real
├─ 100% com mensagens de erro claras
├─ 100% com indicadores de progresso
└─ Taxa de conclusão >85%

Navegação:
├─ Máximo 3 cliques para qualquer funcionalidade
├─ 100% de breadcrumbs implementados
├─ 100% de tooltips em ícones
├─ 100% de atalhos de teclado (power users)
└─ Tempo médio para encontrar função <30s

Mobile:
├─ 100% de telas responsivas
├─ Touch targets >44x44px
├─ 100% de gestos funcionais (swipe, pinch)
├─ Performance mobile >85 (Lighthouse)
└─ Taxa de abandono mobile <15%
```

---

## 🛠️ FERRAMENTAS E RECURSOS

### Desenvolvimento

```bash
# Backend
- Node.js 18+
- TypeScript 5.0+
- Prisma ORM 5.0+
- Express.js
- Zod (validação)
- Jest (testes)

# Frontend
- Next.js 14+
- React 18+
- TypeScript
- Tailwind CSS
- Shadcn/UI
- React Hook Form
- React Testing Library

# Database
- PostgreSQL 15+
- Redis (cache)

# DevOps
- Docker
- GitHub Actions (CI/CD)
- Sentry (monitoring)
- New Relic (APM)
```

### Scripts Úteis

```bash
# Gerar FormSchema para todos os serviços
npm run generate:schemas

# Gerar Handlers automáticos
npm run generate:handlers

# Gerar Páginas Frontend
npm run generate:pages

# Executar todos os testes
npm run test:all

# Coverage completo
npm run test:coverage

# Build de produção
npm run build

# Deploy
npm run deploy:production
```

---

## 📞 SUPORTE E PRÓXIMOS PASSOS

### Após Conclusão do Plano

1. **Treinamento**
   - Equipe técnica
   - Equipe administrativa
   - Usuários finais

2. **Go-Live**
   - Soft launch (1 secretaria piloto)
   - Rollout gradual (progressivo)
   - Go-live completo

3. **Suporte Pós Go-Live**
   - Suporte 24/7 (período inicial)
   - Bug fixes prioritários
   - Ajustes de UX baseados em feedback

4. **Evolução Contínua**
   - Sprints iterativos
   - Roadmap de melhorias
   - Integração com sistemas externos

---

## 📅 FASE 5 - LIMPEZA DE CÓDIGO LEGADO

**Objetivo:** Remover TODO código obsoleto e legado após refatoração completa

**Status:** ⚠️ **EXECUTAR APENAS APÓS FASES 1-4 COMPLETAS**

**Importante:** Esta fase garante que o código fique **100% limpo**, sem duplicações, handlers órfãos ou código morto.

---

### ETAPA 1: Identificação de Código Legado

#### 1.1. **Listar Arquivos Legados Identificados**

Baseado na análise em @ANALISE_CODIGO_VS_PLANO.md, os seguintes arquivos contêm código legado:

**Sistema de Handlers Legacy:**
```
src/modules/module-handler.ts (812 linhas)
├─ Switch/case system (linhas 62-107)
├─ handleEducation() (linhas 124-198)
├─ handleHealth() (linhas 204-272)
├─ handleCulture() (linhas 355-407)
├─ handleSports() (linhas 412-455)
├─ handleEnvironment() (linhas 460-481)
├─ handleSecurity() (linhas 486-562)
├─ handleUrbanPlanning() (linhas 567-588)
├─ handleAgriculture() (linhas 593-614)
├─ handleTourism() (linhas 619-662)
├─ handlePublicWorks() (linhas 667-710)
├─ handlePublicServices() (linhas 715-764)
└─ handleCustomModule() (linhas 769-811)
```

**Handlers Duplicados (Stubs):**
```
src/modules/handlers/education/index.ts (stub)
src/modules/handlers/health/index.ts (stub)
src/modules/handlers/social/index.ts (stub)
```

**Core Module Handler Legacy:**
```
src/core/module-handler.ts (se não usado)
```

**Entregas:**
- [ ] Lista completa de arquivos legados
- [ ] Mapa de dependências (o que depende do quê)
- [ ] Análise de impacto (o que quebra se remover)

---

### ETAPA 2: Remoção de Switch/Case System

#### 2.1. **Deletar module-handler.ts (812 linhas)**

**Condição:** Todas as secretarias devem estar usando o **Registry System**

**Verificar antes de deletar:**
```typescript
// Nenhum código deve chamar:
ModuleHandler.execute()
ModuleHandler.handleEducation()
ModuleHandler.handleHealth()
// etc...

// Todo código deve usar:
const handler = moduleHandlerRegistry.get(moduleKey);
await handler.execute(action, tx);
```

**Comando:**
```bash
# 1. Verificar referências
cd digiurban/backend
grep -r "ModuleHandler" --include="*.ts" | grep -v "module-handler.ts"

# 2. Se resultado vazio, deletar
rm src/modules/module-handler.ts

# 3. Remover imports
grep -r "from.*module-handler" --include="*.ts" -l | xargs sed -i "/from.*module-handler/d"
```

**Entregas:**
- [ ] module-handler.ts deletado
- [ ] Todos imports removidos
- [ ] 0 referências ao arquivo
- [ ] Build bem-sucedido após remoção

---

### ETAPA 3: Remoção de Handlers Duplicados

#### 3.1. **Deletar Stubs de Handlers**

**Problema:** Existem handlers em dois lugares:
- `src/core/handlers/` (handlers reais - MANTER)
- `src/modules/handlers/{education,health,social}/` (stubs - DELETAR)

**Arquivos a Deletar:**

```bash
# Education stubs (se apenas stubs)
rm -rf src/modules/handlers/education/

# Health stubs (se apenas stubs)
rm -rf src/modules/handlers/health/

# Social stubs (se apenas stubs)
rm -rf src/modules/handlers/social/
```

**ATENÇÃO:** Verificar ANTES se são realmente stubs:
```bash
# Ver conteúdo
cat src/modules/handlers/education/index.ts

# Se contém apenas console.log ou comentários = stub
# Se contém lógica real = MANTER e renomear
```

**Entregas:**
- [ ] Stubs identificados e deletados
- [ ] Handlers reais mantidos em `src/core/handlers/`
- [ ] Registry atualizado (sem referências a stubs)
- [ ] Build bem-sucedido

---

### ETAPA 4: Limpeza de Types e Interfaces Obsoletas

#### 4.1. **Remover Types Legacy**

**Arquivos a revisar:**
```
src/types/module-handler.ts
src/types/handlers.ts
src/modules/types.ts
```

**Verificar:**
- [ ] ModuleType enum (pode estar obsoleto)
- [ ] ModuleExecutionContext (se não usado)
- [ ] ModuleExecutionResult (se não usado)
- [ ] Interfaces duplicadas

**Ação:**
```typescript
// Se type não é usado em nenhum lugar:
// 1. Buscar referências
grep -r "ModuleExecutionContext" --include="*.ts"

// 2. Se resultado vazio, deletar
// Editar arquivo e remover type
```

**Entregas:**
- [ ] Types obsoletos identificados
- [ ] Types não utilizados removidos
- [ ] Build sem erros de type

---

### ETAPA 5: Remoção de Campos Duplicados (Pós-Refatoração)

#### 5.1. **Verificar Models Limpos**

**Verificação SQL:**
```sql
-- Ver columns de um model
\d+ rural_producers

-- Verificar se campos duplicados foram removidos:
-- ❌ Não deve ter: name, document, email, phone, address
-- ✅ Deve ter: citizen_id, production_type, main_crop
```

**Se houver campos duplicados ainda:**
```bash
# Criar migration manual para remover
npx prisma migrate dev --name remove_duplicate_fields

# Editar migration:
ALTER TABLE rural_producers DROP COLUMN IF EXISTS name;
ALTER TABLE rural_producers DROP COLUMN IF EXISTS document;
ALTER TABLE rural_producers DROP COLUMN IF EXISTS email;
ALTER TABLE rural_producers DROP COLUMN IF EXISTS phone;
ALTER TABLE rural_producers DROP COLUMN IF EXISTS address;
```

**Entregas:**
- [ ] Todos models verificados
- [ ] 0 campos duplicados restantes
- [ ] Migrations de limpeza aplicadas

---

### ETAPA 6: Limpeza de Código Comentado

#### 6.1. **Remover Comentários de Código Antigo**

**Problema:** Código comentado polui e confunde

**Buscar:**
```bash
# Encontrar blocos grandes de código comentado
grep -r "^[[:space:]]*\/\/" --include="*.ts" -A 5 -B 1 | grep -E "(LEGACY|TODO|FIXME|DEPRECATED|OLD)"
```

**Remover:**
- [ ] Blocos de código comentado >10 linhas
- [ ] Comentários "// OLD:", "// LEGACY:"
- [ ] Comentários "// FIXME:" resolvidos
- [ ] Comentários "// TODO:" concluídos

**MANTER:**
- Documentação (JSDoc)
- Comentários explicativos relevantes
- Comentários de arquitetura

**Entregas:**
- [ ] Código comentado removido
- [ ] Comentários limpos e relevantes
- [ ] Documentação preservada

---

### ETAPA 7: Limpeza de Imports Não Utilizados

#### 7.1. **Remover Imports Mortos**

**Tool:** ESLint ou TypeScript

```bash
# Verificar imports não utilizados
npx tsc --noEmit

# Ou usar ESLint
npx eslint . --ext .ts,.tsx --fix
```

**Entregas:**
- [ ] 0 imports não utilizados
- [ ] 0 variáveis declaradas e não usadas
- [ ] Build limpo sem warnings

---

### ETAPA 8: Reorganização de Arquivos

#### 8.1. **Estrutura Final de Handlers**

**ANTES (Código Legacy):**
```
src/
├─ modules/
│  ├─ module-handler.ts (812 linhas) ❌ DELETAR
│  ├─ handlers/
│  │  ├─ education/ (stubs) ❌ DELETAR
│  │  ├─ health/ (stubs) ❌ DELETAR
│  │  ├─ social/ (stubs) ❌ DELETAR
│  │  ├─ agriculture/ ✅ MANTER
│  │  ├─ culture/ ✅ MANTER
│  │  └─ ...
│  └─ handlers/registry.ts ✅ MANTER
└─ core/
   ├─ module-handler.ts ❌ REVISAR
   └─ handlers/
      ├─ education/ ✅ MANTER
      ├─ health/ ✅ MANTER
      └─ social-assistance/ ✅ MANTER
```

**DEPOIS (Código Limpo):**
```
src/
├─ modules/
│  └─ handlers/
│     ├─ registry.ts ✅
│     ├─ agriculture/ ✅
│     ├─ culture/ ✅
│     ├─ education/ ✅ (movido de core/)
│     ├─ health/ ✅ (movido de core/)
│     ├─ social/ ✅ (movido de core/)
│     ├─ sports/ ✅
│     ├─ environment/ ✅
│     ├─ security/ ✅
│     ├─ urban-planning/ ✅
│     ├─ tourism/ ✅
│     ├─ public-works/ ✅
│     └─ public-services/ ✅
└─ core/
   └─ handlers/
      └─ base-handler.ts ✅ (classe base)
```

**Ações:**
1. Mover handlers reais de `core/handlers/` para `modules/handlers/`
2. Deletar diretório `core/handlers/` (se vazio)
3. Manter apenas `base-handler.ts` em local apropriado
4. Atualizar todos imports

**Entregas:**
- [ ] Estrutura reorganizada
- [ ] Todos imports atualizados
- [ ] Build bem-sucedido
- [ ] Documentação da estrutura atualizada

---

### ETAPA 9: Validação Final de Limpeza

#### 9.1. **Checklist de Código Limpo**

**Arquitetura:**
- [ ] 0 arquivos com >500 linhas (exceto seeds)
- [ ] 0 funções com >100 linhas
- [ ] 0 duplicações de código
- [ ] 0 handlers órfãos (não registrados)

**Código:**
- [ ] 0 imports não utilizados
- [ ] 0 variáveis declaradas e não usadas
- [ ] 0 tipos `any` (exceto casos justificados)
- [ ] 0 `@ts-ignore` ou `@ts-nocheck`

**Models:**
- [ ] 0 models sem citizenId (quando aplicável)
- [ ] 0 campos duplicando dados do Citizen
- [ ] 100% models com relações corretas

**Handlers:**
- [ ] 100% handlers validam citizenId
- [ ] 100% handlers usam CitizenLookupService
- [ ] 100% handlers registrados no registry
- [ ] 0 handlers com lógica em switch/case

**FormSchemas:**
- [ ] 100% schemas com citizenId
- [ ] 0 schemas com campos duplicados
- [ ] 100% validações implementadas

**Frontend:**
- [ ] 100% páginas com CitizenLookup
- [ ] 0 duplicação de componentes
- [ ] 100% componentes reutilizáveis

**Testes:**
- [ ] Coverage >80% em handlers
- [ ] Coverage >70% em routes
- [ ] Todos testes passando
- [ ] 0 testes skippados

**Entregas:**
- [ ] Checklist 100% completo
- [ ] Relatório de limpeza gerado
- [ ] Métricas de código (antes vs depois)
- [ ] **Sistema 100% limpo e pronto para produção**

---

### ETAPA 10: Documentação da Limpeza

#### 10.1. **Gerar Relatório de Limpeza**

**Arquivo:** `RELATORIO_LIMPEZA_CODIGO.md`

**Conteúdo:**
```markdown
# Relatório de Limpeza de Código - DigiUrban

## Arquivos Deletados
- src/modules/module-handler.ts (812 linhas)
- src/modules/handlers/education/index.ts (stub)
- src/modules/handlers/health/index.ts (stub)
- src/modules/handlers/social/index.ts (stub)
- [lista completa]

## Código Removido
- Switch/case system: 750 linhas
- Handlers duplicados: 300 linhas
- Código comentado: 450 linhas
- Imports não utilizados: 120 linhas
- **Total removido: 1620 linhas**

## Código Refatorado
- 205 models: 0 duplicações
- 57 handlers: 100% compliance
- 103 FormSchemas: 100% com citizenId
- **Total refatorado: ~8000 linhas**

## Métricas Antes vs Depois
| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Linhas totais | 45000 | 43380 | -3.6% |
| Duplicação | 15% | 0% | -100% |
| Coverage | 45% | 85% | +89% |
| Handlers órfãos | 12 | 0 | -100% |
| Compliance | 13% | 100% | +670% |

## Arquitetura Final
[Estrutura de diretórios limpa]

## Conclusão
Sistema 100% limpo, sem código legado, pronto para produção.
```

**Entregas:**
- [ ] RELATORIO_LIMPEZA_CODIGO.md gerado
- [ ] Métricas documentadas
- [ ] Estrutura final documentada
- [ ] **FASE 5 concluída**

---

### ✅ RESULTADO ESPERADO DA FASE 5

**Código 100% Limpo:**
```
✅ 0 arquivos legados
✅ 0 handlers duplicados
✅ 0 switch/case systems
✅ 0 código comentado >10 linhas
✅ 0 imports não utilizados
✅ 0 duplicações de código
✅ 100% estrutura organizada
✅ 100% documentação atualizada
```

**Benefícios:**
- Código mais rápido (menos arquivos para processar)
- Manutenção mais fácil (sem confusão de código duplicado)
- Onboarding mais rápido (estrutura clara)
- Deploy mais seguro (sem código morto)

---

## 📝 CONCLUSÃO

Este plano de **5 fases** garante:

✅ **100% de funcionalidade** para todas as 13 secretarias
✅ **100% de compliance** com regras fundamentais (citizenId obrigatório)
✅ **103 módulos COM_DADOS** completamente implementados e refatorados
✅ **0% de código legado** (FASE 5 completa)
✅ **Abordagem específica e robusta** para cada secretaria
✅ **Qualidade profissional** em código, testes e UX
✅ **Documentação completa** técnica e de usuário
✅ **Sistema escalável** e limpo, pronto para produção

**Ordem de Execução:**
1. **FASE 1:** Agricultura (PILOTO) - Validar template de refatoração
2. **FASE 2:** Educação, Saúde, Assistência Social - Aplicar template
3. **FASE 3:** Planejamento, Obras, Serviços - Aplicar template
4. **FASE 4:** Demais 6 secretarias - Aplicar template
5. **FASE 5:** Limpeza de código legado - Remover TUDO obsoleto

**Próximos Passos Imediatos:**
1. Revisar e aprovar este plano atualizado
2. Iniciar FASE 1 (Refatoração Agricultura)
3. Validar template antes de escalar

---

**Versão:** 2.0
**Data:** 2025-11-07
**Responsável:** Equipe DigiUrban
**Status:** Aguardando Início da Execução

---

*Documento gerado por análise completa do sistema DigiUrban*
*Baseado em: @ANALISE_CODIGO_VS_PLANO.md*
