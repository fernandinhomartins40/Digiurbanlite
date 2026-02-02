# 📋 PROPOSTA: Integração do Sistema de Protocolos com Sistema Unificado V2.0

## 📊 Resumo Executivo

O sistema atual de protocolos do Digiurban possui um mecanismo funcional de atribuição de protocolos a servidores, porém **simples e limitado**. Esta proposta detalha como integrar completamente o sistema de protocolos com o **Sistema Unificado de Vinculação de Servidores V2.0**, adicionando rastreabilidade completa, histórico de encaminhamentos, delegações temporárias e conformidade com a estrutura organizacional.

---

## 🔍 ANÁLISE DA SITUAÇÃO ATUAL

### ✅ O que funciona hoje:

#### 1. Modelo ProtocolSimplified
```prisma
model ProtocolSimplified {
  id              String   @id @default(cuid())
  number          String   @unique
  title           String
  status          ProtocolStatus @default(VINCULADO)

  // ✅ ATRIBUIÇÃO ATUAL (SIMPLES)
  assignedUserId  String?  // ID do servidor atribuído
  assignedUser    User?    @relation("AssignedUserSimplified")

  createdById     String?
  createdBy       User?    @relation("CreatedByUserSimplified")

  departmentId    String
  department      Department @relation(...)

  // Outros campos...
}
```

#### 2. Endpoint de Atribuição
**`PATCH /api/protocols/:id/assign`** (funcional)

**Validações:**
- ✅ assignedUserId obrigatório
- ✅ Servidor do MESMO departamento
- ✅ Servidor com role: USER, COORDINATOR ou MANAGER
- ✅ Servidor ativo (isActive: true)
- ✅ Cria histórico (ATRIBUIDO)
- ✅ Notifica cidadão

**Limitações:**
- ❌ Apenas 1 servidor por protocolo
- ❌ Sem histórico de quem encaminhou para quem
- ❌ Sem suporte a delegação temporária (férias, afastamento)
- ❌ Sem encaminhamento entre departamentos
- ❌ Sem vinculação com estrutura organizacional
- ❌ Sem informação de carga de trabalho do servidor

#### 3. Vínculos de Cidadãos (já bem implementado)
**ProtocolCitizenLink** - Sistema robusto de vínculos:
- ✅ Múltiplos cidadãos por protocolo
- ✅ Tipos de vínculo (STUDENT, GUARDIAN, PATIENT, etc)
- ✅ Papéis (BENEFICIARY, RESPONSIBLE, etc)
- ✅ Auto-verificação contra FamilyComposition
- ✅ Histórico de verificações

---

## ❌ PROBLEMAS IDENTIFICADOS

### 1. Falta de Rastreabilidade Completa
**Problema**: Não há histórico de quem passou o protocolo para quem
```
Atual:
Protocol.assignedUserId = "user123"  // Apenas ID atual

Desejado:
- João recebeu de Maria em 10/01/2025 às 14:30
- Maria recebeu de Pedro em 08/01/2025 às 09:15
- Pedro criou o protocolo em 05/01/2025 às 10:00
```

### 2. Sem Delegação Temporária
**Problema**: Quando servidor sai de férias ou se afasta, não há mecanismo de substituição
```
Cenário:
- João está de férias por 15 dias
- Maria precisa assumir os protocolos de João temporariamente
- Quando João voltar, protocolos retornam automaticamente
```

### 3. Sem Integração com Estrutura Organizacional
**Problema**: Atribuição não considera hierarquia e vínculos do Sistema Unificado V2.0
```
Sistema Unificado V2.0 sabe:
- João trabalha na Unidade X com carga de 40h/semana
- João tem supervisor: Maria
- João faz parte da Equipe Y
- João está ATIVO/FERIAS/AFASTADO

Sistema de Protocolos NÃO usa essas informações!
```

### 4. Sem Encaminhamento entre Departamentos
**Problema**: Protocolo só pode ser atribuído a servidores do mesmo departamento
```
Cenário Real:
- Protocolo de SAÚDE precisa consultar ASSISTÊNCIA SOCIAL
- Protocolo de EDUCAÇÃO precisa consultar SAÚDE (vacinação)
- Protocolo de MOBILIDADE precisa consultar PLANEJAMENTO URBANO
```

### 5. Sem Informação de Carga de Trabalho
**Problema**: Manager não vê quantos protocolos cada servidor já tem
```
Ao atribuir protocolo, não mostra:
- João: 15 protocolos ativos
- Maria: 3 protocolos ativos  ← Melhor escolha!
- Pedro: 8 protocolos ativos
```

---

## ✅ PROPOSTA DE SOLUÇÃO

### 🎯 Objetivos

1. **Rastreabilidade Completa**: Histórico de todos os encaminhamentos
2. **Delegação Temporária**: Substituição automática por férias/afastamentos
3. **Integração com Estrutura Organizacional**: Usar EmployeeAssignment e EmployeeHierarchy
4. **Encaminhamento Interdepartamental**: Protocolos transitam entre departamentos
5. **Visibilidade de Carga**: Mostrar quantos protocolos cada servidor tem
6. **Auditoria Unificada**: Usar AssignmentAudit do Sistema Unificado V2.0

---

## 🏗️ ARQUITETURA PROPOSTA

### Novo Modelo: ProtocolServerAssignment

```prisma
model ProtocolServerAssignment {
  id String @id @default(cuid())

  protocolId String
  protocol   ProtocolSimplified @relation("ProtocolServerAssignments", fields: [protocolId], references: [id], onDelete: Cascade)

  // Servidor atribuído
  userId String
  user   User   @relation("UserProtocolAssignments", fields: [userId], references: [id], onDelete: Cascade)

  // Tipo de atribuição
  tipo TipoAtribuicaoProtocolo // PRINCIPAL, DELEGADO, ENCAMINHADO, CONSULTA

  // Status da atribuição
  situacao SituacaoAtribuicao @default(ATIVA) // ATIVA, CONCLUIDA, CANCELADA, SUBSTITUIDA

  // Quem atribuiu
  assignedById   String?
  assignedByName String? // Denormalizado
  assignedBy     User?   @relation("ProtocolAssignedBy", fields: [assignedById], references: [id], onDelete: SetNull)

  // Contexto
  motivo            String? // Por que foi atribuído
  prioridade        Int?    // Se diferentes servidores têm prioridades diferentes
  percentualCarga   Int?    // % de dedicação esperada
  prazoResposta     DateTime? // Prazo para este servidor responder

  // Delegação temporária
  isDelegacao       Boolean   @default(false)
  delegadoPor       String?   // userId do servidor original
  ativaAte          DateTime? // Data de retorno da delegação
  motivoDelegacao   String?   // FERIAS, AFASTAMENTO, SOBRECARGA

  // Encaminhamento interdepartamental
  departmentOrigemId   String?
  departmentDestinoId  String?
  isInterdepartamental Boolean @default(false)

  // ✅ INTEGRAÇÃO COM SISTEMA UNIFICADO V2.0
  employeeAssignmentId String? // Referência ao vínculo funcional do servidor
  employeeAssignment   EmployeeAssignment? @relation(fields: [employeeAssignmentId], references: [id], onDelete: SetNull)

  organizationalUnitId String? // Unidade organizacional responsável
  organizationalUnit   OrganizationalUnit? @relation(fields: [organizationalUnitId], references: [id], onDelete: SetNull)

  // Comunicação
  comentario     String?
  lido           Boolean   @default(false)
  lidoEm         DateTime?
  respondeEm     DateTime?
  respostaTexto  String?

  // Timestamps
  dataInicio DateTime @default(now())
  dataFim    DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([protocolId, situacao])
  @@index([userId, situacao])
  @@index([tipo, situacao])
  @@index([isDelegacao, ativaAte])
  @@index([employeeAssignmentId])
  @@map("protocol_server_assignments")
}

enum TipoAtribuicaoProtocolo {
  PRINCIPAL       // Servidor principal responsável
  DELEGADO        // Substituto temporário (férias, afastamento)
  ENCAMINHADO     // Encaminhado para outro departamento
  CONSULTA        // Apenas para consulta/parecer
  APOIO           // Servidor de apoio (não principal)
}

enum SituacaoAtribuicao {
  ATIVA        // Atribuição ativa
  CONCLUIDA    // Servidor concluiu sua parte
  CANCELADA    // Atribuição cancelada
  SUBSTITUIDA  // Foi substituído por outro servidor
  PENDENTE     // Aguardando aceite do servidor
}
```

### Modificações em ProtocolSimplified

```prisma
model ProtocolSimplified {
  // ... campos existentes ...

  // ✅ MANTER COMPATIBILIDADE (campo legado)
  assignedUserId String?
  assignedUser   User?   @relation("AssignedUserSimplified")

  // ✅ NOVO: Relacionamento com atribuições
  serverAssignments ProtocolServerAssignment[] @relation("ProtocolServerAssignments")

  // ✅ NOVO: Servidor principal atual (denormalizado para performance)
  currentAssignedUserId String?
  currentAssignedUser   User?   @relation("CurrentProtocolAssignment", fields: [currentAssignedUserId], references: [id])

  // ✅ NOVO: Unidade organizacional responsável
  organizationalUnitId String?
  organizationalUnit   OrganizationalUnit? @relation(fields: [organizationalUnitId], references: [id])

  // ✅ NOVO: Equipe responsável (para protocolos de múltiplos servidores)
  teamId String?
  team   Team?   @relation(fields: [teamId], references: [id])
}
```

### Modificações em User

```prisma
model User {
  // ... campos existentes ...

  // ✅ NOVO: Relacionamentos com protocolos
  protocolAssignments    ProtocolServerAssignment[] @relation("UserProtocolAssignments")
  protocolsAssignedBy    ProtocolServerAssignment[] @relation("ProtocolAssignedBy")
  currentProtocols       ProtocolSimplified[]       @relation("CurrentProtocolAssignment")
}
```

---

## 🛣️ NOVAS ROTAS DE API

### 1. Atribuição Principal (Mantém Compatibilidade)

**`PATCH /api/protocols/:id/assign`**

**Mudanças internas:**
```typescript
// Antes:
protocol.assignedUserId = userId

// Agora:
1. Criar ProtocolServerAssignment (tipo: PRINCIPAL, situacao: ATIVA)
2. Atualizar protocol.currentAssignedUserId = userId (denormalizado)
3. Manter protocol.assignedUserId = userId (compatibilidade)
4. Buscar EmployeeAssignment do servidor (via Sistema Unificado V2.0)
5. Vincular com employeeAssignmentId
6. Verificar status do servidor (ATIVO, FERIAS, AFASTADO)
7. Se FERIAS/AFASTADO, sugerir delegado automaticamente
8. Registrar em AssignmentAudit (Sistema Unificado)
```

### 2. Delegação Temporária (NOVO)

**`POST /api/protocols/:id/delegate`**

**Parâmetros:**
```json
{
  "delegadoParaUserId": "uuid_servidor_substituto",
  "motivoDelegacao": "FERIAS",
  "ativaAte": "2025-02-15T00:00:00Z",
  "comentario": "Maria assume protocolos de João durante férias"
}
```

**Validações:**
- ✅ Servidor delegado deve estar no mesmo departamento OU equipe
- ✅ Servidor delegado deve estar ATIVO
- ✅ Servidor original deve estar FERIAS ou AFASTADO
- ✅ Data ativaAte obrigatória

**Ações:**
1. Criar ProtocolServerAssignment:
   - tipo: DELEGADO
   - isDelegacao: true
   - delegadoPor: servidor_original_id
   - ativaAte: data_retorno
2. Atualizar protocol.currentAssignedUserId = servidor_substituto
3. Manter histórico de quem era o servidor original
4. Notificar servidor substituto
5. Ao atingir ativaAte, reverte automaticamente (via job)

### 3. Encaminhamento Interdepartamental (NOVO)

**`POST /api/protocols/:id/forward`**

**Parâmetros:**
```json
{
  "forwardToUserId": "uuid_servidor_destino",
  "forwardToDepartmentId": "uuid_departamento_destino",
  "tipoEncaminhamento": "ENCAMINHADO", // ou "CONSULTA"
  "motivo": "Necessário parecer da Assistência Social",
  "prazoResposta": "2025-02-10T00:00:00Z",
  "comentario": "Verificar elegibilidade para Bolsa Família"
}
```

**Validações:**
- ✅ Servidor destino deve existir
- ✅ Permissão: MANAGER do departamento origem OU ADMIN
- ✅ Se CONSULTA: mantém servidor principal ativo
- ✅ Se ENCAMINHADO: substitui servidor principal

**Ações:**
1. Criar ProtocolServerAssignment:
   - tipo: ENCAMINHADO ou CONSULTA
   - situacao: ATIVA
   - isInterdepartamental: true
   - departmentOrigemId, departmentDestinoId
2. Se ENCAMINHADO: marcar assignment anterior como SUBSTITUIDA
3. Se CONSULTA: mantém ambos ativos
4. Registrar no histórico interdepartamental
5. Notificar servidor destino e cidadão

### 4. Atribuição para Equipe (NOVO)

**`POST /api/protocols/:id/assign-team`**

**Parâmetros:**
```json
{
  "teamId": "uuid_equipe",
  "comentario": "Protocolo complexo requer equipe multidisciplinar"
}
```

**Validações:**
- ✅ Equipe deve existir no Sistema Unificado V2.0
- ✅ Equipe deve ter membros ativos
- ✅ Permissão: MANAGER ou ADMIN

**Ações:**
1. Atualizar protocol.teamId = teamId
2. Criar ProtocolServerAssignment para cada membro ativo:
   - tipo: APOIO
   - situacao: ATIVA
3. Definir coordenador da equipe como PRINCIPAL
4. Notificar todos os membros
5. Criar entrada no histórico

### 5. Listar Histórico de Atribuições (NOVO)

**`GET /api/protocols/:id/assignments`**

**Resposta:**
```json
{
  "assignments": [
    {
      "id": "assign123",
      "tipo": "PRINCIPAL",
      "situacao": "ATIVA",
      "user": {
        "id": "user123",
        "name": "João Silva",
        "email": "joao@prefeitura.gov.br",
        "department": { "name": "Secretaria de Saúde" }
      },
      "assignedBy": {
        "id": "manager1",
        "name": "Maria Gestora"
      },
      "dataInicio": "2025-02-01T10:00:00Z",
      "motivo": "Atribuição inicial",
      "employeeAssignment": {
        "organizationalUnit": { "nome": "UBS Centro" },
        "position": { "nome": "Enfermeiro" }
      }
    },
    {
      "id": "assign124",
      "tipo": "DELEGADO",
      "situacao": "CONCLUIDA",
      "user": {
        "id": "user456",
        "name": "Pedro Substituto"
      },
      "isDelegacao": true,
      "delegadoPor": "user123",
      "ativaAte": "2025-02-15T00:00:00Z",
      "motivoDelegacao": "FERIAS",
      "dataInicio": "2025-02-01T10:00:00Z",
      "dataFim": "2025-02-15T10:00:00Z"
    }
  ],
  "timeline": [
    {
      "data": "2025-02-01T10:00:00Z",
      "evento": "Atribuído para João Silva",
      "por": "Maria Gestora"
    },
    {
      "data": "2025-02-01T10:00:00Z",
      "evento": "Delegado para Pedro Substituto (férias)",
      "por": "Sistema Automático"
    },
    {
      "data": "2025-02-15T10:00:00Z",
      "evento": "Retornado para João Silva",
      "por": "Sistema Automático"
    }
  ]
}
```

### 6. Métricas de Carga de Trabalho (NOVO)

**`GET /api/protocols/workload-stats?departmentId=dept123`**

**Resposta:**
```json
{
  "servidores": [
    {
      "userId": "user123",
      "name": "João Silva",
      "protocolosAtivos": 15,
      "protocolosPendentes": 3,
      "protocolosPrazoVencido": 1,
      "cargaPercentual": 75, // 0-100%
      "status": "ATIVO",
      "employeeAssignment": {
        "organizationalUnit": "UBS Centro",
        "cargaHoraria": 40
      }
    },
    {
      "userId": "user456",
      "name": "Maria Santos",
      "protocolosAtivos": 3,
      "protocolosPendentes": 0,
      "protocolosPrazoVencido": 0,
      "cargaPercentual": 15,
      "status": "ATIVO",
      "employeeAssignment": {
        "organizationalUnit": "UBS Sul",
        "cargaHoraria": 40
      }
    }
  ],
  "resumo": {
    "totalProtocolos": 18,
    "mediaProtocolosPorServidor": 9,
    "servidorSobrecarregado": "João Silva (75%)",
    "servidorDisponivel": "Maria Santos (15%)"
  }
}
```

### 7. Sugestão Inteligente de Atribuição (NOVO)

**`GET /api/protocols/:id/suggest-assignee?departmentId=dept123`**

**Resposta:**
```json
{
  "sugestoes": [
    {
      "userId": "user456",
      "name": "Maria Santos",
      "score": 95, // 0-100 (quanto maior, melhor)
      "razoes": [
        "Baixa carga de trabalho (15%)",
        "Mesma unidade organizacional (UBS Centro)",
        "Experiência em protocolos similares (8 concluídos)",
        "Status: ATIVO"
      ],
      "protocolosAtivos": 3,
      "taxaConclusao": 0.92, // 92% de protocolos concluídos no prazo
      "employeeAssignment": {
        "organizationalUnit": "UBS Centro",
        "position": "Enfermeiro",
        "cargaHoraria": 40
      }
    },
    {
      "userId": "user789",
      "name": "Carlos Oliveira",
      "score": 80,
      "razoes": [
        "Carga moderada (45%)",
        "Unidade diferente (UBS Sul)",
        "Boa taxa de conclusão (85%)"
      ],
      "protocolosAtivos": 8,
      "taxaConclusao": 0.85
    }
  ]
}
```

**Algoritmo de Score:**
```
Score = (100 - cargaPercentual) * 0.4
      + (taxaConclusao * 100) * 0.3
      + (mesmaUnidade ? 20 : 0)
      + (experienciaSimilar ? 10 : 0)
```

---

## 🔄 INTEGRAÇÃO COM SISTEMA UNIFICADO V2.0

### 1. Verificação de Status do Servidor

Ao atribuir protocolo, verificar `HealthProfessionalData.status`:

```typescript
const healthData = await prisma.healthProfessionalData.findUnique({
  where: { userId: assignedUserId }
});

if (healthData?.status === 'FERIAS') {
  // Sugerir delegação automática
  const substitutos = await getSubstitutosDisponiveis(userId);
  throw {
    code: 'SERVIDOR_FERIAS',
    message: `${user.name} está de férias até ${healthData.dataInativacao}`,
    suggestedDelegates: substitutos
  };
}

if (healthData?.status === 'AFASTADO') {
  // Não permitir atribuição
  throw {
    code: 'SERVIDOR_AFASTADO',
    message: `${user.name} está afastado. Motivo: ${healthData.motivoInativacao}`
  };
}
```

### 2. Buscar Substitutos via Hierarquia

Usar `EmployeeHierarchy` para encontrar substitutos adequados:

```typescript
async function getSubstitutosDisponiveis(userId: string) {
  // 1. Buscar subordinados do supervisor deste servidor
  const hierarchy = await prisma.employeeHierarchy.findFirst({
    where: {
      subordinadoId: userId,
      tipo: 'DIRETO',
      ativo: true
    },
    include: {
      supervisor: {
        include: {
          subordinados: {
            where: {
              ativo: true,
              subordinado: {
                healthData: {
                  status: 'ATIVO' // Apenas servidores ativos
                }
              }
            },
            include: {
              subordinado: {
                include: {
                  assignments: {
                    where: { situacao: 'ATIVO' }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  // 2. Retornar colegas de equipe que estão ativos
  return hierarchy?.supervisor.subordinados
    .filter(s => s.subordinadoId !== userId)
    .map(s => ({
      userId: s.subordinadoId,
      name: s.subordinado.name,
      cargaAtual: s.subordinado.assignments.length
    }))
    .sort((a, b) => a.cargaAtual - b.cargaAtual); // Menos sobrecarregados primeiro
}
```

### 3. Vincular com OrganizationalUnit

Ao atribuir, buscar a unidade organizacional do servidor:

```typescript
const assignment = await prisma.employeeAssignment.findFirst({
  where: {
    userId: assignedUserId,
    situacao: 'ATIVO',
    isPrimary: true
  },
  include: {
    organizationalUnit: true
  }
});

// Vincular protocolo com a unidade organizacional
await prisma.protocolSimplified.update({
  where: { id: protocolId },
  data: {
    organizationalUnitId: assignment.organizationalUnitId
  }
});
```

### 4. Registrar em AssignmentAudit

Toda atribuição de protocolo deve criar entrada no sistema de auditoria:

```typescript
await prisma.assignmentAudit.create({
  data: {
    assignmentId: employeeAssignmentId,
    tipo: 'DESIGNACAO', // Novo tipo para protocolos
    userId: assignedUserId,
    userName: assignedUser.name,
    motivo: 'Atribuição de protocolo',
    detalhes: {
      protocolId,
      protocolNumber: protocol.number,
      protocolTitle: protocol.title,
      assignedBy: assignedByUser.name,
      comment: assignComment
    }
  }
});
```

---

## 🎨 REFATORAÇÃO DO FRONTEND

### Página: `/admin/protocolos/page.tsx`

#### 1. Dialog de Atribuição Melhorado

**ANTES:**
```jsx
<Select onChange={setSelectedAssignee}>
  {teamMembers.map(m =>
    <SelectItem value={m.id}>{m.name}</SelectItem>
  )}
</Select>
```

**DEPOIS:**
```jsx
<Dialog open={showAssignDialog}>
  <DialogHeader>
    <DialogTitle>Atribuir Protocolo</DialogTitle>
    <DialogDescription>
      Selecione o servidor ou equipe responsável
    </DialogDescription>
  </DialogHeader>

  {/* Abas: Servidor Individual | Equipe | Sugestões */}
  <Tabs defaultValue="individual">
    <TabsList>
      <TabsTrigger value="individual">Servidor Individual</TabsTrigger>
      <TabsTrigger value="equipe">Equipe</TabsTrigger>
      <TabsTrigger value="sugestoes">Sugestões IA</TabsTrigger>
    </TabsList>

    <TabsContent value="individual">
      {/* Lista de servidores com carga de trabalho */}
      <div className="space-y-2">
        {servidores.map(servidor => (
          <Card
            key={servidor.id}
            className={`p-3 cursor-pointer hover:bg-gray-50 ${
              selectedAssignee === servidor.id ? 'border-blue-500' : ''
            }`}
            onClick={() => setSelectedAssignee(servidor.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{servidor.name}</p>
                <p className="text-sm text-gray-500">
                  {servidor.employeeAssignment?.organizationalUnit?.nome}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={getCargaVariant(servidor.cargaPercentual)}>
                  {servidor.protocolosAtivos} protocolos
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  Carga: {servidor.cargaPercentual}%
                </p>
                {servidor.status !== 'ATIVO' && (
                  <Badge variant="destructive" className="mt-1">
                    {servidor.status}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </TabsContent>

    <TabsContent value="equipe">
      {/* Seleção de equipe */}
      <Select onValueChange={setSelectedTeam}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione uma equipe" />
        </SelectTrigger>
        <SelectContent>
          {equipes.map(equipe => (
            <SelectItem key={equipe.id} value={equipe.id}>
              {equipe.nome} ({equipe.membros.length} membros)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedTeam && (
        <div className="mt-4">
          <Label>Membros da Equipe</Label>
          {equipe.membros.map(membro => (
            <div key={membro.id} className="flex items-center gap-2 p-2">
              <Avatar>
                <AvatarFallback>{membro.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{membro.name}</p>
                <p className="text-sm text-gray-500">{membro.papel}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </TabsContent>

    <TabsContent value="sugestoes">
      {/* Sugestões de IA baseadas em carga e experiência */}
      <div className="space-y-2">
        {sugestoes.map((sugestao, index) => (
          <Card
            key={sugestao.userId}
            className="p-3 cursor-pointer hover:bg-gray-50"
            onClick={() => setSelectedAssignee(sugestao.userId)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {index === 0 && (
                  <Badge className="bg-green-500">Recomendado</Badge>
                )}
                <div>
                  <p className="font-medium">{sugestao.name}</p>
                  <p className="text-sm text-gray-500">
                    {sugestao.employeeAssignment?.position?.nome}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {sugestao.razoes.map((razao, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" />
                        {razao}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {sugestao.score}
                </div>
                <p className="text-xs text-gray-500">Score</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </TabsContent>
  </Tabs>

  <div className="mt-4">
    <Label>Comentário/Instruções</Label>
    <Textarea
      placeholder="Adicione instruções específicas para o servidor..."
      value={assignComment}
      onChange={(e) => setAssignComment(e.target.value)}
    />
  </div>

  <DialogFooter>
    <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
      Cancelar
    </Button>
    <Button onClick={assignProtocol}>
      Atribuir
    </Button>
  </DialogFooter>
</Dialog>
```

#### 2. Histórico de Atribuições

**NOVO componente:**
```jsx
<Card>
  <CardHeader>
    <CardTitle>Histórico de Atribuições</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="relative">
      {/* Timeline vertical */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300" />

      {assignments.map((assignment, index) => (
        <div key={assignment.id} className="relative pl-16 pb-8">
          <div className={`absolute left-3 top-2 h-6 w-6 rounded-full ${
            assignment.situacao === 'ATIVA' ? 'bg-green-500' : 'bg-gray-400'
          } flex items-center justify-center`}>
            {assignment.tipo === 'PRINCIPAL' && <User className="h-3 w-3 text-white" />}
            {assignment.tipo === 'DELEGADO' && <ArrowRightLeft className="h-3 w-3 text-white" />}
            {assignment.tipo === 'ENCAMINHADO' && <Forward className="h-3 w-3 text-white" />}
          </div>

          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{assignment.user.name}</p>
                  <Badge variant="outline">{assignment.tipo}</Badge>
                  {assignment.situacao === 'ATIVA' && (
                    <Badge className="bg-green-500">Ativo</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {assignment.user.department?.name} - {assignment.employeeAssignment?.organizationalUnit?.nome}
                </p>
                {assignment.motivo && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Motivo:</strong> {assignment.motivo}
                  </p>
                )}
                {assignment.isDelegacao && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">
                      <strong>Delegação Temporária:</strong> {assignment.motivoDelegacao}
                      <br />
                      Ativa até: {format(new Date(assignment.ativaAte), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>{format(new Date(assignment.dataInicio), 'dd/MM/yyyy HH:mm')}</p>
                {assignment.dataFim && (
                  <p className="text-xs">até {format(new Date(assignment.dataFim), 'dd/MM/yyyy HH:mm')}</p>
                )}
              </div>
            </div>

            {assignment.assignedBy && (
              <p className="text-xs text-gray-500 mt-2">
                Atribuído por: {assignment.assignedByName}
              </p>
            )}
          </Card>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Schema e Migrations (1 dia)
- [ ] Criar modelo `ProtocolServerAssignment`
- [ ] Criar enums `TipoAtribuicaoProtocolo` e `SituacaoAtribuicao`
- [ ] Adicionar campos em `ProtocolSimplified`:
  - [ ] `serverAssignments`
  - [ ] `currentAssignedUserId`
  - [ ] `organizationalUnitId`
  - [ ] `teamId`
- [ ] Adicionar relacionamento em `User`
- [ ] Criar migration
- [ ] Executar `prisma generate`

### Fase 2: Backend - Rotas e Lógica (3-4 dias)
- [ ] Refatorar `PATCH /api/protocols/:id/assign`:
  - [ ] Criar ProtocolServerAssignment internamente
  - [ ] Buscar EmployeeAssignment do servidor
  - [ ] Verificar status (ATIVO, FERIAS, AFASTADO)
  - [ ] Vincular com organizationalUnitId
  - [ ] Registrar em AssignmentAudit
- [ ] Criar `POST /api/protocols/:id/delegate`
- [ ] Criar `POST /api/protocols/:id/forward`
- [ ] Criar `POST /api/protocols/:id/assign-team`
- [ ] Criar `GET /api/protocols/:id/assignments`
- [ ] Criar `GET /api/protocols/workload-stats`
- [ ] Criar `GET /api/protocols/:id/suggest-assignee`
- [ ] Criar job para reverter delegações expiradas

### Fase 3: Frontend - Interface (2-3 dias)
- [ ] Refatorar Dialog de Atribuição:
  - [ ] Aba "Servidor Individual" com carga
  - [ ] Aba "Equipe"
  - [ ] Aba "Sugestões IA"
- [ ] Criar componente de Histórico de Atribuições (timeline)
- [ ] Adicionar indicadores de carga na listagem
- [ ] Criar badge de status do servidor (ATIVO, FERIAS, etc)
- [ ] Adicionar botões de Delegar e Encaminhar
- [ ] Modal de delegação temporária
- [ ] Modal de encaminhamento interdepartamental

### Fase 4: Integração e Testes (1-2 dias)
- [ ] Testar atribuição com verificação de status
- [ ] Testar delegação temporária (criar e reverter)
- [ ] Testar encaminhamento interdepartamental
- [ ] Testar atribuição para equipe
- [ ] Validar histórico de atribuições
- [ ] Validar métricas de carga
- [ ] Validar sugestões de atribuição

### Fase 5: Documentação e Deploy (1 dia)
- [ ] Atualizar documentação de API
- [ ] Criar guia de uso para gestores
- [ ] Executar migration em produção
- [ ] Monitorar logs

---

## 🎯 RESULTADO ESPERADO

### Antes (Sistema Atual):
```
Protocol.assignedUserId = "user123"
```

### Depois (Sistema Integrado):
```
Protocol {
  currentAssignedUserId: "user123",
  organizationalUnitId: "unit456",
  teamId: "team789",
  serverAssignments: [
    {
      userId: "user123",
      tipo: "PRINCIPAL",
      situacao: "ATIVA",
      employeeAssignment: {...},
      dataInicio: "2025-02-01"
    },
    {
      userId: "user456",
      tipo: "DELEGADO",
      situacao: "CONCLUIDA",
      isDelegacao: true,
      ativaAte: "2025-02-15",
      dataInicio: "2025-02-01",
      dataFim: "2025-02-15"
    }
  ]
}
```

### Benefícios:
- ✅ Rastreabilidade completa de todos os encaminhamentos
- ✅ Delegação automática por férias/afastamentos
- ✅ Integração com estrutura organizacional
- ✅ Encaminhamento interdepartamental
- ✅ Visibilidade de carga de trabalho
- ✅ Sugestões inteligentes de atribuição
- ✅ Auditoria unificada
- ✅ Histórico visual (timeline)

---

**Implementação alinhada 100% com o Sistema Unificado de Vinculação V2.0! 🎯**
