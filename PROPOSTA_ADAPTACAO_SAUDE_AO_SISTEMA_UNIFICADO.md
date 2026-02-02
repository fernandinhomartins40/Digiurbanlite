# 🏥 PROPOSTA: Adaptação dos Apps de Saúde ao Sistema Unificado V2.0

## 📋 Visão Correta

O **Sistema Unificado de Vinculação de Servidores V2.0** é o **padrão corporativo** que todos os departamentos devem seguir. Os apps de saúde precisam se **adaptar** a este sistema, **eliminando seus sistemas paralelos e legados**.

---

## ❌ SITUAÇÃO ATUAL (INCORRETA)

Os apps de saúde mantêm seus próprios sistemas de vinculação **paralelos e desalinhados**:

### 1. Modelos Legados que DEVEM SER ELIMINADOS

| Modelo Legado | Problema | Ação Necessária |
|---------------|----------|-----------------|
| **ProfissionalSaude** | Modelo standalone duplicado | ❌ ELIMINAR completamente |
| **ProfissionalUnidade** | Sistema de vínculo paralelo ao V2.0 | ⚠️ ADAPTAR para usar EmployeeAssignment |
| **ProfissionalEquipe** | Sistema de vínculo paralelo ao V2.0 | ⚠️ ADAPTAR para usar Team + TeamMember |
| **AuditoriaVinculo** | Sistema de auditoria paralelo | ❌ ELIMINAR, usar AssignmentAudit |

### 2. Dados Profissionais que DEVEM SER CONSOLIDADOS

**Estado atual (ERRADO):**
- ❌ `DadosSaude` (linha 166) - dados profissionais específicos de saúde
- ❌ `HealthProfessionalData` (linha 7758) - dados profissionais do Sistema V2.0
- **São redundantes e duplicados!**

**Estado desejado (CORRETO):**
- ✅ `HealthProfessionalData` - ÚNICO modelo para dados profissionais de saúde
- ✅ Migrar todos os dados de `DadosSaude` → `HealthProfessionalData`
- ✅ Eliminar `DadosSaude` após migração

---

## ✅ ARQUITETURA CORRETA

### Sistema Unificado V2.0 (PADRÃO)

```
┌─────────────────────────────────────────────────────────────┐
│                   SISTEMA UNIFICADO V2.0                    │
│                    (PADRÃO CORPORATIVO)                     │
└─────────────────────────────────────────────────────────────┘

User (Servidor Municipal)
  │
  ├─→ HealthProfessionalData (1:1) - Dados específicos de saúde
  │     ├─ categoria (MEDICO, ENFERMEIRO, etc)
  │     ├─ registroProfissional (CRM, COREN, etc)
  │     ├─ cns, cbo
  │     └─ especialidades (JSON temporário → migrar para N:N)
  │
  ├─→ EmployeeAssignment (1:N) - Vínculos funcionais ÚNICOS
  │     ├─ departmentId (Secretaria de Saúde)
  │     ├─ organizationalUnitId (Unidade de Saúde)
  │     ├─ positionId (Cargo: Médico, Enfermeiro, etc)
  │     ├─ tipo (EFETIVO, COMISSIONADO, TEMPORARIO)
  │     ├─ situacao (ATIVO, ENCERRADO, etc)
  │     ├─ dataInicio, dataFim
  │     ├─ cargaHoraria
  │     └─ percentualDedicacao
  │
  ├─→ EmployeeHierarchy (N:N) - Hierarquia supervisor-subordinado
  │     ├─ supervisorId
  │     ├─ subordinadoId
  │     └─ tipo (DIRETO, FUNCIONAL, MATRICIAL)
  │
  └─→ TeamMember (N:N) - Participação em equipes
        ├─ teamId (Equipe ESF, NASF, etc)
        ├─ funcao (COORDENADOR, MEMBRO)
        ├─ dataInicio, dataFim
        └─ ativo

┌─────────────────────────────────────────────────────────────┐
│ AUDITORIA UNIFICADA (AssignmentAudit)                       │
├─────────────────────────────────────────────────────────────┤
│ - Rastreia TODAS as mudanças de vínculos                    │
│ - CRIACAO, ATUALIZACAO, TRANSFERENCIA, ENCERRAMENTO         │
│ - executor, aprovador, motivo, documentoLegal               │
│ - campoModificado, valorAnterior, valorNovo                 │
└─────────────────────────────────────────────────────────────┘
```

### Apps de Saúde (ADAPTADOS)

```
┌─────────────────────────────────────────────────────────────┐
│            APPS DE SAÚDE (CAMADA ESPECÍFICA)                │
│              Usam o Sistema Unificado V2.0                  │
└─────────────────────────────────────────────────────────────┘

EquipeSaude (Específico da Saúde)
  ├─ id, nome, ine, tipo (eSF, NASF, etc)
  ├─ unidadeId → UnidadeSaude
  └─ Relacionamento com Team (Sistema Unificado)
      └─ Cada EquipeSaude cria um Team no Sistema Unificado

UnidadeSaude (Específico da Saúde)
  ├─ id, nome, cnes, tipo (UBS, UPA, etc)
  └─ organizationalUnitId → OrganizationalUnit
      └─ Cada UnidadeSaude é mapeada como OrganizationalUnit

Microarea (Específico da Saúde)
  ├─ id, numero, equipeId
  └─ Mantém lógica específica de territorialização
```

---

## 🔧 MUDANÇAS NECESSÁRIAS NO SCHEMA

### 1. CONSOLIDAR DadosSaude → HealthProfessionalData

```prisma
// ❌ DEPRECIAR E ELIMINAR:
model DadosSaude {
  // Este modelo será ELIMINADO após migração
}

// ✅ USAR EXCLUSIVAMENTE:
model HealthProfessionalData {
  id String @id @default(cuid())

  userId String @unique
  user   User   @relation("UserHealthData", fields: [userId], references: [id], onDelete: Cascade)

  categoria String // MEDICO, ENFERMEIRO, ACS, DENTISTA, etc

  registroProfissional String? @unique
  tipoRegistro         String? // CRM, COREN, CRO, CRP
  ufRegistro           String?

  cns String? @unique
  cbo String?

  // ✅ MELHORAR: Adicionar enum de status
  status StatusProfissionalSaude @default(ATIVO)
  motivoInativacao String?
  dataInativacao   DateTime?

  // Configurações de atendimento
  aceitaAgendamento  Boolean @default(true)
  tempoMedioConsulta Int?    @default(30)

  // ✅ TEMPORÁRIO: Especialidades em JSON
  // TODO: Migrar para ProfissionalEspecialidade (N:N)
  especialidades Json?

  observacoes String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?

  @@index([userId])
  @@index([categoria, status])
  @@index([status])
  @@map("health_professional_data")
}

// ✅ NOVO: Enum de status profissional
enum StatusProfissionalSaude {
  ATIVO
  INATIVO
  FERIAS
  AFASTADO
  LICENCA
  APOSENTADO
}
```

### 2. ELIMINAR ProfissionalUnidade - Usar EmployeeAssignment

```prisma
// ❌ ELIMINAR COMPLETAMENTE:
model ProfissionalUnidade {
  // Este modelo será ELIMINADO
  // Funcionalidade substituída por EmployeeAssignment
}

// ❌ ELIMINAR COMPLETAMENTE:
model AuditoriaVinculo {
  // Este modelo será ELIMINADO
  // Funcionalidade substituída por AssignmentAudit
}
```

### 3. ELIMINAR ProfissionalEquipe - Usar TeamMember

```prisma
// ❌ ELIMINAR COMPLETAMENTE:
model ProfissionalEquipe {
  // Este modelo será ELIMINADO
  // Funcionalidade substituída por TeamMember
}
```

### 4. ADAPTAR EquipeSaude para usar Team do Sistema Unificado

```prisma
model EquipeSaude {
  id   String       @id @default(cuid())
  ine  String       @unique // Identificação Nacional de Equipes
  nome String
  tipo TipoEquipe // eSF, NASF, etc

  unidadeId String
  unidade   UnidadeSaude @relation(fields: [unidadeId], references: [id])

  // ✅ NOVO: Vínculo com Sistema Unificado V2.0
  teamId String? @unique
  team   Team?   @relation("EquipeSaudeTeam", fields: [teamId], references: [id])

  // Relacionamentos específicos de saúde
  microareas Microarea[]

  // ❌ REMOVER: profissionais ProfissionalEquipe[]
  // Agora usar: team.members (TeamMember)

  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([unidadeId, isActive])
  @@index([tipo, isActive])
  @@index([teamId])
  @@map("equipes_saude")
}
```

### 5. ADICIONAR organizationalUnitId em UnidadeSaude

```prisma
model UnidadeSaude {
  id    String @id @default(cuid())
  nome  String
  cnes  String @unique
  tipo  String // UBS, UPA, Hospital, etc

  // ✅ NOVO: Vínculo com Sistema Unificado V2.0
  organizationalUnitId String? @unique
  organizationalUnit   OrganizationalUnit? @relation("UnidadeSaudeOrgUnit", fields: [organizationalUnitId], references: [id])

  // Dados específicos
  endereco String?
  telefone String?
  email    String?

  // Relacionamentos
  equipes  EquipeSaude[]
  agendas  AgendaConsulta[]
  salas    SalaConsultorio[]

  // ❌ REMOVER: profissionais ProfissionalUnidade[]
  // Agora usar: organizationalUnit.assignments (EmployeeAssignment)

  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationalUnitId])
  @@map("unidades_saude")
}
```

### 6. ADICIONAR relacionamentos em OrganizationalUnit e Team

```prisma
model OrganizationalUnit {
  // ... campos existentes ...

  // ✅ NOVO: Relacionamento com UnidadeSaude
  unidadeSaude UnidadeSaude? @relation("UnidadeSaudeOrgUnit")
}

model Team {
  // ... campos existentes ...

  // ✅ NOVO: Relacionamento com EquipeSaude
  equipeSaude EquipeSaude? @relation("EquipeSaudeTeam")
}
```

---

## 🔄 PLANO DE MIGRAÇÃO

### FASE 1: Migrar Dados Profissionais (DadosSaude → HealthProfessionalData)

```typescript
// Script: migrate-health-professional-data.ts
async function migrateDadosSaudeToHealthData() {
  console.log('🔄 Migrando DadosSaude → HealthProfessionalData...');

  const dadosSaude = await prisma.dadosSaude.findMany({
    include: { user: true },
  });

  for (const dados of dadosSaude) {
    // Verificar se já existe HealthProfessionalData
    const existing = await prisma.healthProfessionalData.findUnique({
      where: { userId: dados.userId },
    });

    if (existing) {
      console.log(`⚠️ Já existe HealthProfessionalData para ${dados.user.name}`);
      continue;
    }

    // Criar HealthProfessionalData
    await prisma.healthProfessionalData.create({
      data: {
        userId: dados.userId,
        categoria: dados.categoria,
        registroProfissional: dados.registroProfissional,
        tipoRegistro: dados.tipoRegistro,
        ufRegistro: dados.ufRegistro,
        cns: dados.cns,
        cbo: dados.cbo,
        status: dados.ativo ? 'ATIVO' : 'INATIVO',
        motivoInativacao: dados.motivoInativacao,
        dataInativacao: dados.dataInativacao,
        aceitaAgendamento: dados.aceitaAgendamento,
        tempoMedioConsulta: dados.tempoMedioConsulta,
        especialidades: dados.especialidades,
        observacoes: dados.observacoes,
        createdAt: dados.createdAt,
        updatedAt: dados.updatedAt,
        createdBy: dados.createdBy,
      },
    });

    console.log(`✅ Migrado: ${dados.user.name} (${dados.categoria})`);
  }

  console.log('✅ Migração concluída!');
}
```

### FASE 2: Migrar Vínculos (ProfissionalUnidade → EmployeeAssignment)

```typescript
// Script: migrate-health-assignments.ts
async function migrateProfissionalUnidadeToAssignments() {
  console.log('🔄 Migrando ProfissionalUnidade → EmployeeAssignment...');

  const vinculos = await prisma.profissionalUnidade.findMany({
    include: {
      profissional: {
        include: {
          department: true,
          healthData: true, // HealthProfessionalData
        },
      },
      unidade: {
        include: { organizationalUnit: true },
      },
    },
  });

  for (const vinculo of vinculos) {
    // Verificar se profissional tem dados de saúde
    if (!vinculo.profissional.healthData) {
      console.warn(`⚠️ ${vinculo.profissional.name} não tem HealthProfessionalData`);
      continue;
    }

    // Verificar se unidade foi mapeada para OrganizationalUnit
    if (!vinculo.unidade.organizationalUnit) {
      console.warn(`⚠️ Unidade ${vinculo.unidade.nome} não tem OrganizationalUnit`);
      continue;
    }

    // Buscar Position baseada na categoria profissional
    const position = await prisma.position.findFirst({
      where: {
        departmentId: vinculo.profissional.departmentId,
        nome: vinculo.profissional.healthData.categoria, // "Médico", "Enfermeiro", etc
      },
    });

    // Criar EmployeeAssignment
    const assignment = await prisma.employeeAssignment.create({
      data: {
        userId: vinculo.profissionalId,
        departmentId: vinculo.profissional.departmentId,
        organizationalUnitId: vinculo.unidade.organizationalUnitId!,
        positionId: position?.id,
        tipo: 'FUNCIONAL',
        situacao: vinculo.ativo ? 'ATIVO' : 'ENCERRADO',
        isPrimary: false,
        dataInicio: vinculo.dataInicio,
        dataFim: vinculo.dataFim,
        cargaHoraria: vinculo.cargaHoraria,
        percentualDedicacao: vinculo.percentualDedicacao,
        observacoes: `Migrado de ProfissionalUnidade - ${vinculo.unidade.nome}`,
      },
    });

    // Criar auditoria
    await prisma.assignmentAudit.create({
      data: {
        assignmentId: assignment.id,
        tipo: 'CRIACAO',
        userId: vinculo.profissionalId,
        userName: vinculo.profissional.name,
        dataAcao: vinculo.createdAt,
        motivo: 'Migração de dados legados',
        observacoes: `ProfissionalUnidade → EmployeeAssignment`,
      },
    });

    console.log(`✅ Vínculo migrado: ${vinculo.profissional.name} → ${vinculo.unidade.nome}`);
  }

  console.log('✅ Migração de vínculos concluída!');
}
```

### FASE 3: Migrar Equipes (ProfissionalEquipe → TeamMember)

```typescript
// Script: migrate-health-teams.ts
async function migrateProfissionalEquipeToTeamMembers() {
  console.log('🔄 Migrando ProfissionalEquipe → TeamMember...');

  // Primeiro, criar Teams para cada EquipeSaude
  const equipeSaude = await prisma.equipeSaude.findMany({
    where: { teamId: null },
    include: { unidade: true },
  });

  for (const equipe of equipeSaude) {
    const team = await prisma.team.create({
      data: {
        nome: equipe.nome,
        tipo: 'EQUIPE_TRABALHO',
        departmentId: equipe.unidade.departmentId || 'ID_SECRETARIA_SAUDE',
        organizationalUnitId: equipe.unidade.organizationalUnitId,
        descricao: `Equipe ${equipe.tipo} - INE: ${equipe.ine}`,
        ativo: equipe.isActive,
        dataInicio: equipe.createdAt,
      },
    });

    // Vincular EquipeSaude com Team
    await prisma.equipeSaude.update({
      where: { id: equipe.id },
      data: { teamId: team.id },
    });

    console.log(`✅ Team criado: ${equipe.nome} (${equipe.ine})`);
  }

  // Agora migrar os membros
  const vinculosEquipe = await prisma.profissionalEquipe.findMany({
    include: {
      profissional: true,
      equipe: { include: { team: true } },
    },
  });

  for (const vinculo of vinculosEquipe) {
    if (!vinculo.equipe.team) {
      console.warn(`⚠️ Equipe ${vinculo.equipe.nome} não tem Team vinculado`);
      continue;
    }

    // Criar TeamMember
    await prisma.teamMember.create({
      data: {
        teamId: vinculo.equipe.teamId!,
        userId: vinculo.profissionalId,
        funcao: vinculo.funcao || 'MEMBRO',
        dataInicio: vinculo.dataInicio,
        dataFim: vinculo.dataFim,
        ativo: vinculo.ativo,
        observacoes: `Migrado de ProfissionalEquipe - CBO: ${vinculo.cbo}`,
      },
    });

    console.log(`✅ Membro migrado: ${vinculo.profissional.name} → ${vinculo.equipe.nome}`);
  }

  console.log('✅ Migração de equipes concluída!');
}
```

### FASE 4: Mapear UnidadeSaude → OrganizationalUnit

```typescript
// Script: map-health-units-to-org-structure.ts
async function mapUnidadeSaudeToOrgUnits() {
  console.log('🔄 Mapeando UnidadeSaude → OrganizationalUnit...');

  const secretariaSaude = await prisma.department.findFirst({
    where: { code: 'SMS' },
  });

  if (!secretariaSaude) {
    throw new Error('Secretaria de Saúde não encontrada');
  }

  // Criar estrutura organizacional da saúde
  const secretariaOrgUnit = await prisma.organizationalUnit.findFirst({
    where: {
      departmentId: secretariaSaude.id,
      tipo: 'SECRETARIA',
    },
  });

  if (!secretariaOrgUnit) {
    throw new Error('OrganizationalUnit da Secretaria não encontrada');
  }

  // Criar Diretoria de Atenção Básica
  const diretoriaAB = await prisma.organizationalUnit.upsert({
    where: {
      departmentId_sigla: {
        departmentId: secretariaSaude.id,
        sigla: 'DAB',
      },
    },
    create: {
      nome: 'Diretoria de Atenção Básica',
      sigla: 'DAB',
      tipo: 'DIRETORIA',
      nivel: 2,
      departmentId: secretariaSaude.id,
      parentId: secretariaOrgUnit.id,
    },
    update: {},
  });

  // Mapear cada UnidadeSaude
  const unidades = await prisma.unidadeSaude.findMany({
    where: {
      organizationalUnitId: null,
      isActive: true,
    },
  });

  for (const unidade of unidades) {
    const orgUnit = await prisma.organizationalUnit.create({
      data: {
        nome: unidade.nome,
        sigla: unidade.cnes,
        tipo: unidade.tipo === 'UBS' ? 'UNIDADE' : 'SETOR',
        nivel: 3,
        departmentId: secretariaSaude.id,
        parentId: diretoriaAB.id,
        endereco: unidade.endereco,
        telefone: unidade.telefone,
        email: unidade.email,
      },
    });

    // Vincular
    await prisma.unidadeSaude.update({
      where: { id: unidade.id },
      data: { organizationalUnitId: orgUnit.id },
    });

    console.log(`✅ Unidade mapeada: ${unidade.nome} → OrganizationalUnit`);
  }

  console.log('✅ Mapeamento concluído!');
}
```

### FASE 5: Eliminar Modelos Legados

```prisma
// Após validação completa, remover do schema.prisma:

// ❌ REMOVER:
// model DadosSaude { ... }
// model ProfissionalSaude { ... }
// model ProfissionalUnidade { ... }
// model ProfissionalEquipe { ... }
// model AuditoriaVinculo { ... }
```

---

## 🛣️ REFATORAÇÃO DE ROTAS

### ELIMINAR Rotas Legadas

```typescript
// ❌ REMOVER COMPLETAMENTE (saude-cadastros.routes.ts):

// Rotas de ProfissionalSaude (linha 1519-1676)
router.get('/profissionais', ...)
router.post('/profissionais', ...)
router.put('/profissionais/:id', ...)
router.delete('/profissionais/:id', ...)

// Rotas de DadosSaude (linha 2794-3043)
router.get('/dados-saude', ...)
router.post('/dados-saude', ...)
router.put('/dados-saude/:id', ...)
router.delete('/dados-saude/:id', ...)

// Rotas de ProfissionalUnidade (linha 2330-2600)
router.get('/vinculos', ...)
router.post('/vinculos', ...)
router.put('/vinculos/:id', ...)
router.delete('/vinculos/:id', ...)
```

### USAR Rotas do Sistema Unificado V2.0

```typescript
// ✅ USAR (já implementadas):

// Dados profissionais de saúde
GET    /api/professional-data/health
GET    /api/professional-data/health/:userId
POST   /api/professional-data/health
PUT    /api/professional-data/health/:userId
DELETE /api/professional-data/health/:userId

// Vínculos funcionais
GET    /api/employee-assignments
GET    /api/employee-assignments/user/:userId
POST   /api/employee-assignments
PUT    /api/employee-assignments/:id
DELETE /api/employee-assignments/:id

// Equipes
GET    /api/teams
GET    /api/teams/:id/members
POST   /api/teams
POST   /api/teams/:id/members
PUT    /api/teams/:id
DELETE /api/teams/:id/members/:memberId
```

### CRIAR Rotas Adaptadoras (Bridge) - Temporário

```typescript
// saude-cadastros.routes.ts - Rotas adaptadoras (temporário para compatibilidade)

/**
 * ✅ ADAPTADOR: Criar vínculo de saúde usando Sistema Unificado V2.0
 * Substitui: POST /vinculos (legado)
 */
router.post('/servidores/:userId/vincular-unidade', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { unidadeId, dataInicio, dataFim, cargaHoraria, percentualDedicacao } = req.body;

    // 1. Verificar se servidor tem dados de saúde
    const healthData = await prisma.healthProfessionalData.findUnique({
      where: { userId },
      include: { user: { include: { department: true } } },
    });

    if (!healthData) {
      return res.status(400).json({
        error: 'Servidor não possui dados profissionais de saúde',
      });
    }

    // 2. Buscar unidade e seu OrganizationalUnit
    const unidade = await prisma.unidadeSaude.findUnique({
      where: { id: unidadeId },
      include: { organizationalUnit: true },
    });

    if (!unidade) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    if (!unidade.organizationalUnit) {
      return res.status(400).json({
        error: 'Unidade não está mapeada no Sistema Unificado',
      });
    }

    // 3. Buscar cargo (Position) baseado na categoria
    const position = await prisma.position.findFirst({
      where: {
        departmentId: healthData.user.departmentId,
        nome: healthData.categoria,
      },
    });

    // 4. Criar EmployeeAssignment (Sistema Unificado V2.0)
    const assignment = await prisma.employeeAssignment.create({
      data: {
        userId,
        departmentId: healthData.user.departmentId!,
        organizationalUnitId: unidade.organizationalUnitId!,
        positionId: position?.id,
        tipo: 'FUNCIONAL',
        situacao: 'ATIVO',
        isPrimary: false,
        dataInicio,
        dataFim,
        cargaHoraria,
        percentualDedicacao,
        observacoes: `Vínculo com ${unidade.nome}`,
      },
    });

    // 5. Criar auditoria
    await prisma.assignmentAudit.create({
      data: {
        assignmentId: assignment.id,
        tipo: 'CRIACAO',
        userId,
        userName: healthData.user.name,
        motivo: 'Vinculação com unidade de saúde',
        observacoes: `Unidade: ${unidade.nome} (${unidade.cnes})`,
      },
    });

    res.json({
      success: true,
      assignment,
      unidade: {
        id: unidade.id,
        nome: unidade.nome,
        cnes: unidade.cnes,
      },
    });
  } catch (error: any) {
    console.error('Erro ao vincular servidor à unidade:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ ADAPTADOR: Vincular servidor a equipe ESF usando Sistema Unificado V2.0
 */
router.post('/servidores/:userId/vincular-equipe', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { equipeId, funcao, cbo, dataInicio, dataFim } = req.body;

    // Verificar dados de saúde
    const healthData = await prisma.healthProfessionalData.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!healthData) {
      return res.status(400).json({
        error: 'Servidor não possui dados profissionais de saúde',
      });
    }

    // Buscar equipe
    const equipe = await prisma.equipeSaude.findUnique({
      where: { id: equipeId },
      include: { team: true },
    });

    if (!equipe) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    if (!equipe.team) {
      return res.status(400).json({
        error: 'Equipe não está mapeada no Sistema Unificado',
      });
    }

    // Criar TeamMember (Sistema Unificado V2.0)
    const member = await prisma.teamMember.create({
      data: {
        teamId: equipe.teamId!,
        userId,
        funcao: funcao || 'MEMBRO',
        dataInicio,
        dataFim,
        ativo: true,
        observacoes: `CBO: ${cbo}`,
      },
    });

    res.json({
      success: true,
      member,
      equipe: {
        id: equipe.id,
        nome: equipe.nome,
        ine: equipe.ine,
      },
    });
  } catch (error: any) {
    console.error('Erro ao vincular servidor à equipe:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🎨 REFATORAÇÃO DO FRONTEND

### ELIMINAR Páginas Legadas

```
❌ REMOVER:
/admin/apps/saude/cadastros/profissionais/
/admin/apps/saude/cadastros/servidores-saude/
/admin/apps/saude/cadastros/vinculos/
```

### USAR Páginas do Sistema Unificado V2.0

```
✅ USAR:
/admin/servidores/[id]        - Perfil completo do servidor
/admin/vinculos               - Gestão de vínculos
/admin/organograma            - Organograma municipal
```

### CRIAR Páginas Específicas de Saúde (Adaptadas)

```typescript
// /admin/apps/saude/servidores/page.tsx
// Lista servidores com HealthProfessionalData

export default function ServidoresSaudePage() {
  const fetchServidores = async () => {
    // ✅ USAR API do Sistema Unificado V2.0
    const response = await fetch('/api/professional-data/health', {
      credentials: 'include',
    });
    const data = await response.json();

    // Buscar vínculos de cada servidor
    for (const servidor of data) {
      const assignmentsResponse = await fetch(
        `/api/employee-assignments/user/${servidor.userId}`,
        { credentials: 'include' }
      );
      servidor.vinculos = await assignmentsResponse.json();
    }

    setServidores(data);
  };

  return (
    <div>
      <h1>Servidores da Saúde</h1>

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
            <TableRow key={servidor.userId}>
              <TableCell>
                {/* ✅ Link para perfil do Sistema Unificado */}
                <Link href={`/admin/servidores/${servidor.userId}`}>
                  {servidor.user.name}
                </Link>
              </TableCell>
              <TableCell>{servidor.categoria}</TableCell>
              <TableCell>
                {servidor.tipoRegistro} {servidor.registroProfissional}
              </TableCell>
              <TableCell>
                <Badge>{servidor.status}</Badge>
              </TableCell>
              <TableCell>
                {servidor.vinculos?.filter((v) => v.situacao === 'ATIVO').length || 0}
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => router.push(`/admin/servidores/${servidor.userId}`)}
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

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1: Preparação (1 dia)
- [ ] Backup completo do banco de dados
- [ ] Criar branch `feat/adapt-health-to-unified-system`
- [ ] Adicionar enum `StatusProfissionalSaude` no schema
- [ ] Adicionar campos `organizationalUnitId` em `UnidadeSaude`
- [ ] Adicionar campos `teamId` em `EquipeSaude`
- [ ] Executar `prisma migrate dev`

### FASE 2: Scripts de Migração (2 dias)
- [ ] Criar script `migrate-health-professional-data.ts`
- [ ] Criar script `map-health-units-to-org-structure.ts`
- [ ] Criar script `migrate-health-assignments.ts`
- [ ] Criar script `migrate-health-teams.ts`
- [ ] Executar todos os scripts em ambiente de teste
- [ ] Validar integridade dos dados migrados

### FASE 3: Refatoração Backend (2 dias)
- [ ] Eliminar rotas de `ProfissionalSaude` (legado)
- [ ] Eliminar rotas de `DadosSaude` (legado)
- [ ] Eliminar rotas de `ProfissionalUnidade` (legado)
- [ ] Criar rotas adaptadoras `/servidores/:id/vincular-unidade`
- [ ] Criar rotas adaptadoras `/servidores/:id/vincular-equipe`
- [ ] Atualizar stats para usar `HealthProfessionalData`

### FASE 4: Refatoração Frontend (2 dias)
- [ ] Eliminar páginas `/profissionais` (legado)
- [ ] Eliminar páginas `/servidores-saude` (legado)
- [ ] Criar página `/admin/apps/saude/servidores` (adaptada ao V2.0)
- [ ] Adicionar aba "Saúde" em `/admin/servidores/[id]`
- [ ] Atualizar formulários para usar APIs do Sistema Unificado

### FASE 5: Limpeza e Documentação (1 dia)
- [ ] Remover modelos legados do schema.prisma:
  - [ ] `DadosSaude`
  - [ ] `ProfissionalSaude`
  - [ ] `ProfissionalUnidade`
  - [ ] `ProfissionalEquipe`
  - [ ] `AuditoriaVinculo`
- [ ] Executar `prisma migrate dev` (criar migration de limpeza)
- [ ] Atualizar documentação
- [ ] Criar PR para revisão

### FASE 6: Testes e Deploy (1 dia)
- [ ] Testes de integração
- [ ] Validação com usuários
- [ ] Deploy em produção
- [ ] Monitoramento

---

## ✅ RESULTADO FINAL

### Apps de Saúde 100% Alinhados com Sistema Unificado V2.0

```
┌─────────────────────────────────────────────────────────────┐
│          SISTEMA UNIFICADO V2.0 (PADRÃO ÚNICO)              │
├─────────────────────────────────────────────────────────────┤
│ ✅ User                                                      │
│ ✅ HealthProfessionalData (dados específicos de saúde)      │
│ ✅ EmployeeAssignment (vínculos funcionais ÚNICOS)          │
│ ✅ OrganizationalUnit (estrutura organizacional)            │
│ ✅ Position (cargos)                                         │
│ ✅ Team + TeamMember (equipes)                              │
│ ✅ AssignmentAudit (auditoria ÚNICA)                        │
└─────────────────────────────────────────────────────────────┘
                             ▲
                             │ ADAPTADOS
                             │
┌─────────────────────────────────────────────────────────────┐
│              APPS DE SAÚDE (CAMADA ESPECÍFICA)              │
├─────────────────────────────────────────────────────────────┤
│ ✅ UnidadeSaude → organizationalUnitId (OrganizationalUnit) │
│ ✅ EquipeSaude → teamId (Team)                              │
│ ✅ Microarea (específico, mantido)                          │
│ ❌ ProfissionalSaude (ELIMINADO)                            │
│ ❌ ProfissionalUnidade (ELIMINADO)                          │
│ ❌ ProfissionalEquipe (ELIMINADO)                           │
│ ❌ DadosSaude (ELIMINADO)                                   │
│ ❌ AuditoriaVinculo (ELIMINADO)                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Agora a proposta está correta**: Os apps de saúde se **adaptam** ao Sistema Unificado V2.0, eliminando seus sistemas paralelos e legados! 🎯
