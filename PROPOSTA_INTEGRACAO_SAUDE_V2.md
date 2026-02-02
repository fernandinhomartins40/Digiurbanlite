# 🏥 PROPOSTA DE INTEGRAÇÃO: Apps de Saúde × Sistema Unificado V2.0

## 📋 Resumo Executivo

Esta proposta detalha como integrar corretamente os aplicativos de saúde do Digiurban com o **Sistema Unificado de Vinculação de Servidores V2.0**, eliminando duplicações, padronizando fluxos e garantindo consistência de dados em toda a aplicação.

---

## 🔍 ANÁLISE DA SITUAÇÃO ATUAL

### ❌ Problemas Identificados

#### 1. **TRIPLICAÇÃO DE MODELOS DE DADOS** (Severidade: CRÍTICA)

Existem **3 modelos paralelos** armazenando informações profissionais de saúde:

| Modelo | Localização | Relacionamento | Uso Atual |
|--------|-------------|----------------|-----------|
| **DadosSaude** | schema.prisma:166 | 1:1 com User | ✅ Sistema NOVO (correto) |
| **ProfissionalSaude** | schema.prisma:2907 | Standalone | ❌ Sistema LEGADO (duplicado) |
| **HealthProfessionalData** | schema.prisma:7758 | 1:1 com User | ❌ Sistema V2.0 (não usado) |

**Campos duplicados entre os 3 modelos:**
```typescript
// Todos os 3 modelos contêm:
- categoria (String)
- registroProfissional (String, unique)
- tipoRegistro (String)
- ufRegistro (String)
- cns (String, unique)
- cbo (String)
- especialidades (Json array)
- aceitaAgendamento (Boolean)
- tempoMedioConsulta (Int)
- ativo/isActive (Boolean)
- motivoInativacao (String)
- dataInativacao (DateTime)
- observacoes (String)
```

**Consequências:**
- ❌ Dados inconsistentes entre modelos
- ❌ Duplicação de código nas rotas
- ❌ Confusão sobre qual modelo usar
- ❌ Dificuldade de manutenção

---

#### 2. **VÍNCULOS PROFISSIONAIS NÃO INTEGRADOS COM V2.0** (Severidade: ALTA)

**ProfissionalUnidade** (schema.prisma:2959) existe de forma isolada:

```prisma
model ProfissionalUnidade {
  profissionalId String  // ← vincula User
  unidadeId      String  // ← vincula UnidadeSaude
  dataInicio     DateTime
  dataFim        DateTime?
  cargaHoraria   Int?
  percentualDedicacao Int?
  ativo          Boolean
}
```

**Não se integra com:**
- ❌ `EmployeeAssignment` (Sistema Unificado V2.0)
- ❌ `OrganizationalUnit` (estrutura organizacional)
- ❌ `Position` (cargo formal do servidor)
- ❌ `Team` (equipes multiprofissionais)

**Consequências:**
- ❌ Organograma da Secretaria de Saúde não reflete vínculos reais
- ❌ Relatórios gerenciais incompletos
- ❌ Impossível rastrear carreira completa do servidor
- ❌ Auditoria fragmentada

---

#### 3. **ESPECIALIDADES EM JSON** (Severidade: MÉDIA)

```prisma
especialidades Json? // Array de IDs de EspecialidadeMedica
```

**Problemas:**
- ❌ Não há constraint de integridade referencial
- ❌ Impossível fazer queries eficientes (JOIN)
- ❌ IDs podem referenciar especialidades inexistentes
- ❌ Dificulta contagem de profissionais por especialidade

**Deveria ser:**
```prisma
model ProfissionalEspecialidade {
  profissionalId    String
  especialidadeId   String
  dataObtencao      DateTime?

  profissional      User @relation(...)
  especialidade     EspecialidadeMedica @relation(...)

  @@unique([profissionalId, especialidadeId])
}
```

---

#### 4. **FALTA DE AUDITORIA COMPLETA** (Severidade: ALTA)

**Situação atual:**
- ✅ `ProfissionalUnidade` → tem `AuditoriaVinculo`
- ❌ `ProfissionalEquipe` → SEM auditoria
- ❌ `DadosSaude` → SEM auditoria de mudanças

**Sistema Unificado V2.0 oferece:**
- ✅ `AssignmentAudit` → auditoria completa de todos os vínculos
- ✅ Rastreamento de criação, atualização, transferência, encerramento
- ✅ Armazena: executor, aprovador, motivo, documento legal, campo modificado, valor anterior, valor novo

---

#### 5. **ENUMS E STATUS INCONSISTENTES** (Severidade: MÉDIA)

```prisma
// DadosSaude usa Boolean
ativo Boolean @default(true)

// ProfissionalSaude usa Enum
status StatusProfissional @default(ATIVO)

enum StatusProfissional {
  ATIVO, INATIVO, FERIAS, AFASTADO, LICENCA
}
```

**Problema:** Informações importantes (férias, afastamento, licença) são perdidas no modelo `DadosSaude`.

---

#### 6. **ROTAS USANDO APENAS MODELOS LEGADOS** (Severidade: ALTA)

Arquivo: `digiurban/backend/src/routes/saude-cadastros.routes.ts`

**Rotas de Profissionais (legado):**
```typescript
// Linha 1519-1676: CRUD de ProfissionalSaude
router.get('/profissionais', ...)    // ← usa ProfissionalSaude
router.post('/profissionais', ...)   // ← cria ProfissionalSaude
router.put('/profissionais/:id', ...) // ← atualiza ProfissionalSaude
```

**Rotas de Dados de Saúde (novo):**
```typescript
// Linha 2794-3043: CRUD de DadosSaude
router.get('/dados-saude', ...)      // ← usa DadosSaude + User
router.post('/dados-saude', ...)     // ← cria DadosSaude
router.put('/dados-saude/:id', ...)  // ← atualiza DadosSaude
```

**Problema:** Dois sistemas paralelos fazendo a mesma coisa!

---

## ✅ PROPOSTA DE INTEGRAÇÃO COMPLETA

### 🎯 Objetivos

1. **Eliminar duplicações** entre DadosSaude, ProfissionalSaude e HealthProfessionalData
2. **Integrar vínculos** de saúde com Sistema Unificado V2.0
3. **Padronizar auditoria** usando AssignmentAudit
4. **Consolidar rotas** eliminando endpoints redundantes
5. **Manter compatibilidade** com dados existentes durante transição

---

### 📐 Arquitetura Proposta

#### **MODELO CONSOLIDADO**

```
┌─────────────────────────────────────────────────────────────┐
│                     SERVIDOR MUNICIPAL                      │
│                          (User)                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ id, name, cpf, email, role, departmentId             │  │
│  └───────────────────────────────────────────────────────┘  │
└────────┬──────────────────────────────────────────┬─────────┘
         │                                          │
         │ 1:1                                      │ 1:N
         ▼                                          ▼
┌──────────────────────┐              ┌──────────────────────────┐
│   DADOS DE SAÚDE     │              │  VÍNCULOS FUNCIONAIS     │
│   (DadosSaude)       │              │  (EmployeeAssignment)    │
├──────────────────────┤              ├──────────────────────────┤
│ userId (FK)          │              │ userId (FK)              │
│ categoria            │              │ departmentId (FK)        │
│ registroProfissional │              │ organizationalUnitId (FK)│
│ tipoRegistro         │              │ positionId (FK)          │
│ ufRegistro           │              │ tipo (enum)              │
│ cns                  │              │ situacao (enum)          │
│ cbo                  │              │ isPrimary (boolean)      │
│ aceitaAgendamento    │              │ dataInicio               │
│ tempoMedioConsulta   │              │ dataFim                  │
│ ativo                │              │ cargaHoraria             │
│ motivoInativacao     │              │ percentualDedicacao      │
└──────────┬───────────┘              └────────┬─────────────────┘
           │ 1:N                               │ 1:N
           ▼                                   ▼
┌──────────────────────┐              ┌──────────────────────────┐
│  ESPECIALIDADES      │              │   AUDITORIA COMPLETA     │
│  (N:N)               │              │   (AssignmentAudit)      │
├──────────────────────┤              ├──────────────────────────┤
│ profissionalId (FK)  │              │ assignmentId (FK)        │
│ especialidadeId (FK) │              │ tipo (CRIACAO/UPDATE/    │
│ dataObtencao         │              │       TRANSFERENCIA/     │
└──────────────────────┘              │       ENCERRAMENTO)      │
                                      │ userId (executor)        │
           ┌──────────────────────────┤ userName                 │
           │                          │ aprovadorId              │
           │ N:N                      │ aprovadorNome            │
           ▼                          │ motivo                   │
┌──────────────────────┐              │ documentoLegal           │
│ VÍNCULOS COM UNIDADE │              │ campoModificado          │
│ (ProfissionalUnidade)│              │ valorAnterior            │
├──────────────────────┤              │ valorNovo                │
│ profissionalId       │              └──────────────────────────┘
│ unidadeId            │
│ assignmentId (FK)    │ ← NOVO! Link com EmployeeAssignment
│ dataInicio           │
│ dataFim              │
│ cargaHoraria         │
│ percentualDedicacao  │
└──────────────────────┘
           │ N:N
           ▼
┌──────────────────────┐
│ VÍNCULOS COM EQUIPE  │
│ (ProfissionalEquipe) │
├──────────────────────┤
│ profissionalId       │
│ equipeId             │
│ assignmentId (FK)    │ ← NOVO! Link com EmployeeAssignment
│ cbo                  │
│ funcao               │
│ dataInicio           │
│ dataFim              │
└──────────────────────┘
```

---

### 🔧 MUDANÇAS NECESSÁRIAS NO SCHEMA

#### 1. **CONSOLIDAR HealthProfessionalData → DadosSaude**

**Ação:** Depreciar `HealthProfessionalData` e usar apenas `DadosSaude`

```prisma
// ❌ REMOVER (não usado):
model HealthProfessionalData {
  // ... (será eliminado)
}

// ✅ MANTER E MELHORAR:
model DadosSaude {
  id String @id @default(cuid())

  userId String @unique
  user   User   @relation("UserDadosSaude", fields: [userId], references: [id], onDelete: Cascade)

  categoria String // MEDICO, ENFERMEIRO, ACS, DENTISTA, etc.

  registroProfissional String? @unique
  tipoRegistro         String? // CRM, COREN, CRO, CRP
  ufRegistro           String?

  cns String? @unique
  cbo String?

  // ✅ NOVO: Status detalhado como ProfissionalSaude
  status StatusProfissional @default(ATIVO)
  motivoInativacao String?
  dataInativacao   DateTime?

  aceitaAgendamento  Boolean @default(true)
  tempoMedioConsulta Int?    @default(30)

  observacoes String?

  // ✅ NOVO: Relacionamento com especialidades (N:N)
  especialidades ProfissionalEspecialidade[]

  // Auditoria
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?

  @@index([userId])
  @@index([categoria, status])
  @@index([status])
  @@map("dados_saude")
}
```

---

#### 2. **CRIAR TABELA N:N PARA ESPECIALIDADES**

```prisma
// ✅ NOVO: Relacionamento adequado profissional-especialidade
model ProfissionalEspecialidade {
  id String @id @default(cuid())

  profissionalId  String
  especialidadeId String

  // Data de obtenção da especialidade (residência, título, etc)
  dataObtencao DateTime?
  instituicao  String?

  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  profissional  User                @relation("UserEspecialidades", fields: [profissionalId], references: [id], onDelete: Cascade)
  especialidade EspecialidadeMedica @relation(fields: [especialidadeId], references: [id], onDelete: Cascade)

  @@unique([profissionalId, especialidadeId])
  @@index([profissionalId, ativo])
  @@index([especialidadeId, ativo])
  @@map("profissional_especialidade")
}
```

---

#### 3. **VINCULAR ProfissionalUnidade COM EmployeeAssignment**

```prisma
model ProfissionalUnidade {
  id String @id @default(cuid())

  profissionalId String
  unidadeId      String

  // ✅ NOVO: Vínculo com Sistema Unificado V2.0
  assignmentId String?
  assignment   EmployeeAssignment? @relation("HealthUnitAssignments", fields: [assignmentId], references: [id], onDelete: SetNull)

  dataInicio          DateTime  @default(now())
  dataFim             DateTime?
  ativo               Boolean   @default(true)
  cargaHoraria        Int?
  percentualDedicacao Int?
  observacoes         String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  profissional User         @relation("UserProfissionalUnidades", fields: [profissionalId], references: [id], onDelete: Cascade)
  unidade      UnidadeSaude @relation(fields: [unidadeId], references: [id], onDelete: Cascade)

  // ✅ MANTER: Auditoria legada (será migrada para AssignmentAudit)
  auditorias AuditoriaVinculo[]

  @@unique([profissionalId, unidadeId, dataInicio])
  @@index([profissionalId, ativo])
  @@index([unidadeId, ativo])
  @@index([assignmentId]) // ✅ NOVO
  @@map("profissional_unidade")
}
```

---

#### 4. **VINCULAR ProfissionalEquipe COM EmployeeAssignment**

```prisma
model ProfissionalEquipe {
  id String @id @default(cuid())

  profissionalId String
  equipeId       String

  // ✅ NOVO: Vínculo com Sistema Unificado V2.0
  assignmentId String?
  assignment   EmployeeAssignment? @relation("HealthTeamAssignments", fields: [assignmentId], references: [id], onDelete: SetNull)

  cbo        String? // Código CBO específico para esta equipe
  funcao     String? // Função na equipe (ex: coordenador, membro)
  dataInicio DateTime @default(now())
  dataFim    DateTime?
  ativo      Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  profissional User        @relation("UserEquipesSaude", fields: [profissionalId], references: [id], onDelete: Cascade)
  equipe       EquipeSaude @relation(fields: [equipeId], references: [id], onDelete: Cascade)

  @@unique([profissionalId, equipeId, dataInicio])
  @@index([profissionalId, ativo])
  @@index([equipeId, ativo])
  @@index([assignmentId]) // ✅ NOVO
  @@map("profissional_equipe")
}
```

---

#### 5. **ADICIONAR RELACIONAMENTOS EM EmployeeAssignment**

```prisma
model EmployeeAssignment {
  // ... campos existentes ...

  // ✅ NOVO: Relacionamentos com vínculos de saúde
  healthUnitAssignments ProfissionalUnidade[] @relation("HealthUnitAssignments")
  healthTeamAssignments ProfissionalEquipe[]  @relation("HealthTeamAssignments")
}
```

---

#### 6. **ADICIONAR StatusProfissional EM User (opcional)**

```prisma
model User {
  // ... campos existentes ...

  // Dados de Saúde
  dadosSaude DadosSaude? @relation("UserDadosSaude")

  // ✅ NOVO: Especialidades (N:N)
  especialidades ProfissionalEspecialidade[] @relation("UserEspecialidades")

  // Vínculos de saúde
  vinculosUnidades  ProfissionalUnidade[] @relation("UserProfissionalUnidades")
  equipesVinculadas ProfissionalEquipe[]  @relation("UserEquipesSaude")
}
```

---

### 🔄 PLANO DE MIGRAÇÃO DE DADOS

#### **Fase 1: Adicionar campos novos (não destrutivo)**

```sql
-- Adicionar assignmentId em ProfissionalUnidade
ALTER TABLE profissional_unidade ADD COLUMN assignment_id TEXT;
ALTER TABLE profissional_unidade ADD CONSTRAINT fk_assignment
  FOREIGN KEY (assignment_id) REFERENCES employee_assignments(id) ON DELETE SET NULL;
CREATE INDEX idx_profissional_unidade_assignment ON profissional_unidade(assignment_id);

-- Adicionar assignmentId em ProfissionalEquipe
ALTER TABLE profissional_equipe ADD COLUMN assignment_id TEXT;
ALTER TABLE profissional_equipe ADD CONSTRAINT fk_assignment
  FOREIGN KEY (assignment_id) REFERENCES employee_assignments(id) ON DELETE SET NULL;
CREATE INDEX idx_profissional_equipe_assignment ON profissional_equipe(assignment_id);

-- Adicionar status em DadosSaude
ALTER TABLE dados_saude ADD COLUMN status TEXT DEFAULT 'ATIVO';
```

#### **Fase 2: Criar EmployeeAssignment para cada ProfissionalUnidade**

```typescript
// Script de migração: migrate-health-assignments.ts
async function migrateHealthAssignments() {
  const vinculosUnidade = await prisma.profissionalUnidade.findMany({
    where: { assignmentId: null },
    include: {
      profissional: { include: { department: true } },
      unidade: true,
    },
  });

  for (const vinculo of vinculosUnidade) {
    // 1. Criar EmployeeAssignment no Sistema Unificado
    const assignment = await prisma.employeeAssignment.create({
      data: {
        userId: vinculo.profissionalId,
        departmentId: vinculo.profissional.departmentId, // Secretaria de Saúde
        organizationalUnitId: null, // Será mapeado depois
        tipo: 'FUNCIONAL',
        situacao: vinculo.ativo ? 'ATIVO' : 'ENCERRADO',
        isPrimary: false,
        dataInicio: vinculo.dataInicio,
        dataFim: vinculo.dataFim,
        cargaHoraria: vinculo.cargaHoraria,
        percentualDedicacao: vinculo.percentualDedicacao,
        observacoes: `Migrado de ProfissionalUnidade - Unidade: ${vinculo.unidade.nome}`,
      },
    });

    // 2. Vincular ProfissionalUnidade com EmployeeAssignment
    await prisma.profissionalUnidade.update({
      where: { id: vinculo.id },
      data: { assignmentId: assignment.id },
    });

    // 3. Criar auditoria no novo sistema
    await prisma.assignmentAudit.create({
      data: {
        assignmentId: assignment.id,
        tipo: 'CRIACAO',
        userId: vinculo.profissionalId,
        userName: vinculo.profissional.name,
        dataAcao: vinculo.createdAt,
        motivo: 'Migração de dados legados - ProfissionalUnidade',
      },
    });

    console.log(`✅ Migrado vínculo: ${vinculo.profissional.name} → ${vinculo.unidade.nome}`);
  }
}
```

#### **Fase 3: Criar tabela ProfissionalEspecialidade a partir de JSON**

```typescript
// Script de migração: migrate-health-specialties.ts
async function migrateSpecialties() {
  const servidoresSaude = await prisma.dadosSaude.findMany({
    where: {
      especialidades: { not: Prisma.AnyNull },
    },
    include: { user: true },
  });

  for (const dados of servidoresSaude) {
    const especialidadesIds = dados.especialidades as string[];

    if (!Array.isArray(especialidadesIds)) continue;

    for (const especialidadeId of especialidadesIds) {
      // Verificar se especialidade existe
      const especialidade = await prisma.especialidadeMedica.findUnique({
        where: { id: especialidadeId },
      });

      if (!especialidade) {
        console.warn(`⚠️ Especialidade ${especialidadeId} não encontrada`);
        continue;
      }

      // Criar relacionamento N:N
      await prisma.profissionalEspecialidade.upsert({
        where: {
          profissionalId_especialidadeId: {
            profissionalId: dados.userId,
            especialidadeId: especialidadeId,
          },
        },
        create: {
          profissionalId: dados.userId,
          especialidadeId: especialidadeId,
          ativo: true,
        },
        update: {},
      });

      console.log(`✅ Especialidade vinculada: ${dados.user.name} → ${especialidade.nome}`);
    }
  }
}
```

#### **Fase 4: Depreciar ProfissionalSaude (gradual)**

```typescript
// Marcar todos os registros de ProfissionalSaude como legados
await prisma.profissionalSaude.updateMany({
  data: {
    isActive: false,
    // Adicionar campo deprecation_note se necessário
  },
});
```

---

### 🛣️ REFATORAÇÃO DE ROTAS

#### **Eliminar rotas duplicadas**

```typescript
// ❌ DEPRECIAR (saude-cadastros.routes.ts):
router.get('/profissionais', ...)     // Linha 1519
router.post('/profissionais', ...)    // Linha 1571
router.put('/profissionais/:id', ...) // Linha 1619
router.delete('/profissionais/:id', ...) // Linha 1649

// ✅ MANTER E MELHORAR (saude-cadastros.routes.ts):
router.get('/dados-saude', ...)       // Linha 2794
router.post('/dados-saude', ...)      // Linha 2900
router.put('/dados-saude/:id', ...)   // Linha 2967
router.delete('/dados-saude/:id', ...) // Linha 3028
```

#### **Integrar vínculos com Sistema Unificado V2.0**

```typescript
// ✅ NOVO: Criar vínculo de saúde integrado
router.post('/vinculos', async (req: Request, res: Response) => {
  const {
    profissionalId,
    unidadeId,
    dataInicio,
    dataFim,
    cargaHoraria,
    percentualDedicacao,
    observacoes,
  } = req.body;

  // 1. Buscar profissional com departamento
  const profissional = await prisma.user.findUnique({
    where: { id: profissionalId },
    include: {
      dadosSaude: true,
      department: true,
    },
  });

  if (!profissional?.dadosSaude) {
    return res.status(400).json({
      error: 'Servidor não possui dados de saúde vinculados'
    });
  }

  // 2. Buscar unidade de saúde
  const unidade = await prisma.unidadeSaude.findUnique({
    where: { id: unidadeId },
  });

  // 3. Criar EmployeeAssignment (Sistema Unificado V2.0)
  const assignment = await prisma.employeeAssignment.create({
    data: {
      userId: profissionalId,
      departmentId: profissional.departmentId,
      organizationalUnitId: null, // TODO: mapear unidade → OrganizationalUnit
      tipo: 'FUNCIONAL',
      situacao: 'ATIVO',
      isPrimary: false,
      dataInicio,
      dataFim,
      cargaHoraria,
      percentualDedicacao,
      observacoes: `Vínculo com unidade de saúde: ${unidade.nome}`,
    },
  });

  // 4. Criar ProfissionalUnidade vinculado ao EmployeeAssignment
  const vinculo = await prisma.profissionalUnidade.create({
    data: {
      profissionalId,
      unidadeId,
      assignmentId: assignment.id, // ← INTEGRAÇÃO!
      dataInicio,
      dataFim,
      cargaHoraria,
      percentualDedicacao,
      observacoes,
      ativo: true,
    },
  });

  // 5. Criar auditoria no Sistema Unificado
  await prisma.assignmentAudit.create({
    data: {
      assignmentId: assignment.id,
      tipo: 'CRIACAO',
      userId: profissionalId,
      userName: profissional.name,
      motivo: 'Criação de vínculo com unidade de saúde',
      observacoes: `Unidade: ${unidade.nome}`,
    },
  });

  res.json({
    success: true,
    vinculo,
    assignment,
  });
});
```

---

### 📊 NOVA ESTRUTURA ORGANIZACIONAL DA SAÚDE

#### **Mapear UnidadeSaude → OrganizationalUnit**

```typescript
// Script: create-health-org-structure.ts
async function createHealthOrgStructure() {
  const departamentoSaude = await prisma.department.findFirst({
    where: { code: 'SMS' }, // Secretaria Municipal de Saúde
  });

  // 1. Criar Secretaria (nível 1)
  const secretaria = await prisma.organizationalUnit.create({
    data: {
      nome: 'Secretaria Municipal de Saúde',
      sigla: 'SMS',
      tipo: 'SECRETARIA',
      nivel: 1,
      departmentId: departamentoSaude.id,
      competencias: [
        'Gestão da Política Municipal de Saúde',
        'Administração do SUS municipal',
        'Coordenação da Atenção Básica',
      ],
    },
  });

  // 2. Criar Diretorias (nível 2)
  const diretoriaAtencaoBasica = await prisma.organizationalUnit.create({
    data: {
      nome: 'Diretoria de Atenção Básica',
      sigla: 'DAB',
      tipo: 'DIRETORIA',
      nivel: 2,
      departmentId: departamentoSaude.id,
      parentId: secretaria.id,
    },
  });

  // 3. Mapear cada UnidadeSaude como OrganizationalUnit (nível 3+)
  const unidades = await prisma.unidadeSaude.findMany({
    where: { isActive: true },
  });

  for (const unidade of unidades) {
    const orgUnit = await prisma.organizationalUnit.create({
      data: {
        nome: unidade.nome,
        sigla: unidade.cnes, // CNES como sigla
        tipo: unidade.tipo === 'UBS' ? 'UNIDADE' : 'SETOR',
        nivel: 3,
        departmentId: departamentoSaude.id,
        parentId: diretoriaAtencaoBasica.id,
        endereco: unidade.endereco,
        telefone: unidade.telefone,
        email: unidade.email,
      },
    });

    // Vincular UnidadeSaude com OrganizationalUnit
    await prisma.unidadeSaude.update({
      where: { id: unidade.id },
      data: {
        // Adicionar campo organizationalUnitId se não existir
        // organizationalUnitId: orgUnit.id,
      },
    });

    console.log(`✅ Unidade mapeada: ${unidade.nome} → ${orgUnit.id}`);
  }
}
```

---

### 🎨 REFATORAÇÃO DO FRONTEND

#### **Página unificada: /admin/apps/saude/servidores**

```typescript
// Substituir:
// - /admin/apps/saude/cadastros/profissionais (legado)
// - /admin/apps/saude/cadastros/servidores-saude (novo)
//
// Por uma única página integrada:
// /admin/apps/saude/servidores

export default function ServidoresSaudePage() {
  const [servidores, setServidores] = useState([]);
  const [filters, setFilters] = useState({
    categoria: '',
    status: 'ATIVO',
    search: '',
  });

  // Buscar servidores com DadosSaude + EmployeeAssignment
  const fetchServidores = async () => {
    const params = new URLSearchParams();
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(
      `/api/apps/saude/cadastros/dados-saude?${params}`,
      { credentials: 'include' }
    );
    const data = await response.json();

    // Buscar assignments de cada servidor
    for (const servidor of data) {
      const assignmentsResponse = await fetch(
        `/api/employee-assignments/user/${servidor.id}`,
        { credentials: 'include' }
      );
      servidor.assignments = await assignmentsResponse.json();
    }

    setServidores(data);
  };

  return (
    <div>
      <h1>Servidores da Saúde</h1>

      {/* Filtros */}
      <Filters filters={filters} onChange={setFilters} />

      {/* Tabela com vínculos integrados */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vínculos Ativos</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servidores.map((servidor) => (
            <TableRow key={servidor.id}>
              <TableCell>
                <Link href={`/admin/servidores/${servidor.id}`}>
                  {servidor.name}
                </Link>
              </TableCell>
              <TableCell>{servidor.dadosSaude?.categoria}</TableCell>
              <TableCell>
                {servidor.dadosSaude?.tipoRegistro}{' '}
                {servidor.dadosSaude?.registroProfissional}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(servidor.dadosSaude?.status)}>
                  {servidor.dadosSaude?.status}
                </Badge>
              </TableCell>
              <TableCell>
                {servidor.assignments?.filter((a) => a.situacao === 'ATIVO').length || 0}
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => router.push(`/admin/servidores/${servidor.id}`)}
                >
                  Ver Perfil
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

#### **Página de perfil integrada: /admin/servidores/[id]**

Reaproveitar a página já criada pelo Sistema Unificado V2.0:
- `digiurban/frontend/app/admin/servidores/[id]/page.tsx`

**Adicionar aba específica de saúde:**

```typescript
<Tabs defaultValue="geral">
  <TabsList>
    <TabsTrigger value="geral">Geral</TabsTrigger>
    <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
    <TabsTrigger value="hierarquia">Hierarquia</TabsTrigger>

    {/* ✅ NOVA ABA */}
    {user.dadosSaude && (
      <TabsTrigger value="saude">Saúde</TabsTrigger>
    )}
  </TabsList>

  {/* ... abas existentes ... */}

  {/* ✅ NOVA ABA DE SAÚDE */}
  <TabsContent value="saude">
    <Card>
      <CardHeader>
        <CardTitle>Dados Profissionais de Saúde</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Categoria</Label>
            <p>{user.dadosSaude.categoria}</p>
          </div>
          <div>
            <Label>Registro Profissional</Label>
            <p>
              {user.dadosSaude.tipoRegistro} {user.dadosSaude.registroProfissional}
            </p>
          </div>
          <div>
            <Label>CNS</Label>
            <p>{user.dadosSaude.cns}</p>
          </div>
          <div>
            <Label>CBO</Label>
            <p>{user.dadosSaude.cbo}</p>
          </div>
        </div>

        <Separator className="my-4" />

        <h3 className="font-semibold mb-2">Especialidades</h3>
        <div className="flex flex-wrap gap-2">
          {user.especialidades?.map((esp) => (
            <Badge key={esp.id}>{esp.especialidade.nome}</Badge>
          ))}
        </div>

        <Separator className="my-4" />

        <h3 className="font-semibold mb-2">Vínculos com Unidades de Saúde</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Carga Horária</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.vinculosUnidades?.map((vinculo) => (
              <TableRow key={vinculo.id}>
                <TableCell>{vinculo.unidade.nome}</TableCell>
                <TableCell>
                  {format(new Date(vinculo.dataInicio), 'dd/MM/yyyy')} -{' '}
                  {vinculo.dataFim ? format(new Date(vinculo.dataFim), 'dd/MM/yyyy') : 'Atual'}
                </TableCell>
                <TableCell>{vinculo.cargaHoraria}h/semana</TableCell>
                <TableCell>
                  <Badge variant={vinculo.ativo ? 'default' : 'secondary'}>
                    {vinculo.ativo ? 'Ativo' : 'Encerrado'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Separator className="my-4" />

        <h3 className="font-semibold mb-2">Vínculos com Equipes ESF</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipe</TableHead>
              <TableHead>INE</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.equipesVinculadas?.map((vinculo) => (
              <TableRow key={vinculo.id}>
                <TableCell>{vinculo.equipe.nome}</TableCell>
                <TableCell>{vinculo.equipe.ine}</TableCell>
                <TableCell>{vinculo.funcao}</TableCell>
                <TableCell>
                  {format(new Date(vinculo.dataInicio), 'dd/MM/yyyy')} -{' '}
                  {vinculo.dataFim ? format(new Date(vinculo.dataFim), 'dd/MM/yyyy') : 'Atual'}
                </TableCell>
                <TableCell>
                  <Badge variant={vinculo.ativo ? 'default' : 'secondary'}>
                    {vinculo.ativo ? 'Ativo' : 'Encerrado'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Schema e Migrações (1-2 dias)
- [ ] Adicionar campo `status` em `DadosSaude`
- [ ] Criar modelo `ProfissionalEspecialidade` (N:N)
- [ ] Adicionar campo `assignmentId` em `ProfissionalUnidade`
- [ ] Adicionar campo `assignmentId` em `ProfissionalEquipe`
- [ ] Adicionar relacionamentos em `EmployeeAssignment`
- [ ] Adicionar relacionamento `especialidades` em `User`
- [ ] Executar `prisma migrate dev`
- [ ] Executar `prisma generate`

### Fase 2: Scripts de Migração de Dados (1 dia)
- [ ] Criar script `migrate-health-assignments.ts`
- [ ] Criar script `migrate-health-specialties.ts`
- [ ] Criar script `create-health-org-structure.ts`
- [ ] Executar migrações em ambiente de desenvolvimento
- [ ] Validar integridade dos dados migrados

### Fase 3: Backend - Refatoração de Rotas (2-3 dias)
- [ ] Refatorar `POST /api/apps/saude/cadastros/vinculos` (integração com V2.0)
- [ ] Refatorar `PUT /api/apps/saude/cadastros/vinculos/:id` (atualizar assignment)
- [ ] Refatorar `DELETE /api/apps/saude/cadastros/vinculos/:id` (encerrar assignment)
- [ ] Criar endpoint `GET /api/apps/saude/servidores/:id/full` (dados completos)
- [ ] Adicionar filtro por `status` em `/api/apps/saude/cadastros/dados-saude`
- [ ] Depreciar rotas de `/profissionais` (legado ProfissionalSaude)
- [ ] Criar rotas CRUD para `ProfissionalEspecialidade`

### Fase 4: Frontend - Refatoração de Páginas (2-3 dias)
- [ ] Consolidar páginas `profissionais` e `servidores-saude` em uma única
- [ ] Adicionar aba "Saúde" na página `/admin/servidores/[id]`
- [ ] Criar formulário de vinculação integrado com Sistema Unificado V2.0
- [ ] Adicionar filtro por `StatusProfissional` na listagem
- [ ] Exibir vínculos do Sistema Unificado nas páginas de saúde
- [ ] Criar visualização de organograma da Secretaria de Saúde

### Fase 5: Testes e Validação (1-2 dias)
- [ ] Testar criação de vínculo integrado
- [ ] Testar atualização de vínculo com auditoria
- [ ] Testar encerramento de vínculo
- [ ] Validar que organograma exibe corretamente vínculos de saúde
- [ ] Testar busca e filtros em todas as páginas
- [ ] Validar integridade referencial entre modelos

### Fase 6: Documentação e Deploy (1 dia)
- [ ] Atualizar documentação do Sistema Unificado V2.0
- [ ] Criar guia de migração para usuários
- [ ] Executar migrações em produção
- [ ] Realizar testes em produção
- [ ] Monitorar logs e performance

---

## 🎯 RESULTADO ESPERADO

### ✅ Benefícios da Integração

1. **Eliminação de Duplicações**
   - ❌ 3 modelos paralelos → ✅ 1 modelo consolidado (`DadosSaude`)
   - ❌ 2 sistemas de rotas → ✅ 1 sistema integrado
   - ❌ Especialidades em JSON → ✅ Relacionamento N:N adequado

2. **Auditoria Completa**
   - ✅ Todo vínculo rastreado via `AssignmentAudit`
   - ✅ Histórico completo de carreira do servidor
   - ✅ Conformidade com LGPD e normas de auditoria

3. **Organograma Unificado**
   - ✅ Secretaria de Saúde integrada ao organograma municipal
   - ✅ Unidades de saúde como `OrganizationalUnit`
   - ✅ Hierarquia clara: Secretaria → Diretoria → Unidade → Equipe

4. **Relatórios Consolidados**
   - ✅ Relatórios gerenciais integrados (RH + Saúde)
   - ✅ Indicadores de lotação e distribuição de profissionais
   - ✅ Rastreamento de carreira completo

5. **Experiência de Usuário**
   - ✅ Interface única e consistente
   - ✅ Perfil completo do servidor em uma única página
   - ✅ Navegação intuitiva entre vínculos e hierarquias

---

## 🚨 RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Perda de dados durante migração | Baixa | Alto | Backup completo antes de migrar + testes extensivos |
| Incompatibilidade com dados legados | Média | Médio | Scripts de validação + rollback plan |
| Resistência à mudança de interface | Alta | Baixo | Treinamento + documentação + período de transição |
| Performance de queries complexas | Média | Médio | Índices adequados + otimização de queries |

---

## 📞 PRÓXIMOS PASSOS

Aguardo sua aprovação para iniciar a implementação desta proposta.

**Perguntas para decisão:**

1. ✅ Aprovação geral da proposta?
2. ✅ Prioridade: migração imediata ou período de transição?
3. ✅ Ambiente de teste disponível para validação antes de produção?
4. ✅ Necessidade de treinamento para usuários?

---

**Documento criado em:** 02/02/2026
**Versão:** 1.0
**Status:** Aguardando aprovação
