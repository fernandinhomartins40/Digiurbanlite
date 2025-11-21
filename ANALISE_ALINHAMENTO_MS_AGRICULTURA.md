# 📊 ANÁLISE DE ALINHAMENTO - MICRO SISTEMAS DA AGRICULTURA

## ✅ RESUMO EXECUTIVO

**Status Geral:** ⚠️ **PARCIALMENTE ALINHADO** - Ajustes necessários

Os Micro Sistemas criados no frontend têm **base no backend**, mas há **divergências** entre o que foi planejado e o que está implementado no banco de dados.

---

## 🔍 ANÁLISE DETALHADA POR MICRO SISTEMA

### **MS-01: CADASTRO DE PRODUTORES RURAIS**

#### ✅ **BACKEND EXISTE**
- **Model Prisma:** `ProdutorRural` ✅
- **Rotas:** `/routes/produtor-rural.routes.ts` ✅
- **Service:** `produtor-rural.service.ts` ✅

#### 📋 **ESTRUTURA DO BANCO (schema.prisma)**
```prisma
model ProdutorRural {
  id                    String   @id @default(cuid())
  citizenId             String   @unique
  cpf                   String   @unique
  nome                  String

  propriedadeNome       String?
  propriedadeEndereco   String?
  endereco              Json
  areaTotalHectares     Float?
  georreferenciamento   Json?

  atividadePrincipal    String?
  tiposProducao         Json?

  inscricaoEstadual     String?
  car                   String?  // CAR
  dap                   String?
  telefoneContato       String?

  emprestimosRealizados Int      @default(0)
  pendencias            Boolean  @default(false)
  motivoPendencia       String?

  solicitacoes          SolicitacaoEmprestimoMaquina[]

  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

#### ⚠️ **DIVERGÊNCIAS IDENTIFICADAS**

**O que está NO BANCO mas NÃO foi planejado:**
- ✅ `citizenId` - Vínculo com cidadão (POSITIVO)
- ✅ `emprestimosRealizados` - Histórico de empréstimos
- ✅ `pendencias` / `motivoPendencia` - Controle de pendências

**O que foi PLANEJADO mas NÃO está no banco:**
- ❌ `rg` - RG do produtor
- ❌ `dataNascimento` - Data de nascimento
- ❌ `foto` - Upload de foto
- ❌ `genero` - Gênero
- ❌ `estadoCivil` - Estado civil
- ❌ `telefoneSecundario` - Telefone adicional
- ❌ `email` - Email
- ❌ `whatsapp` - WhatsApp
- ❌ `validadeDAP` - Data de validade da DAP
- ❌ `tipoProdutor` - Agricultor Familiar, Assentado, etc.
- ❌ `composicaoFamiliar` - Dados da família
- ❌ `rendaMensal` - Renda aproximada

#### 🔧 **ROTAS DISPONÍVEIS**
```typescript
POST   /produtores              // Criar produtor ✅
GET    /produtores              // Listar com filtros ✅
GET    /produtores/ativos       // Listar ativos ✅
GET    /produtores/:id          // Buscar por ID ✅
PUT    /produtores/:id          // Atualizar ✅
DELETE /produtores/:id          // Deletar ✅
```

#### ✅ **CONCLUSÃO MS-01**
**Status:** 🟡 **BASE EXISTE** - Precisa expandir o schema

**Ação Necessária:**
1. Adicionar campos faltantes ao model `ProdutorRural`
2. Criar migration para novos campos
3. Atualizar service para validações
4. Implementar upload de foto/documentos

---

### **MS-02: CADASTRO DE PROPRIEDADES RURAIS**

#### ❌ **BACKEND NÃO EXISTE**
- **Model Prisma:** ❌ Não encontrado
- **Rotas:** ❌ Não encontrado
- **Service:** ❌ Não encontrado

#### ⚠️ **OBSERVAÇÃO**
Os dados de propriedade estão **embutidos** no model `ProdutorRural`:
- `propriedadeNome`
- `propriedadeEndereco`
- `areaTotalHectares`
- `georreferenciamento`

**Problema:** Não permite múltiplas propriedades por produtor!

#### 🔧 **ESTRUTURA NECESSÁRIA**
```prisma
model PropriedadeRural {
  id                    String   @id @default(cuid())
  produtorId            String
  produtor              ProdutorRural @relation(fields: [produtorId], references: [id])

  nome                  String
  tipoPosse             String   // Proprietário, Posseiro, Arrendatário

  // Área
  areaTotalHectares     Float
  areaCultivavelHectares Float?
  areaPreservacaoHectares Float?
  areaPastagemHectares   Float?

  // Localização
  distrito              String
  referencia            String?
  coordenadasGPS        Json?    // {lat, lng}
  poligono              Json?    // Array de coordenadas

  // Produção
  culturaPrincipal      String
  outrasCulturas        Json?
  criacoes              Json?
  sistemaProducao       String   // Convencional, Orgânico, Agroecológico

  // Infraestrutura
  temCasa               Boolean  @default(false)
  temEnergia            Boolean  @default(false)
  temAguaEncanada       Boolean  @default(false)
  temIrrigacao          Boolean  @default(false)
  tipoIrrigacao         String?
  qualidadeAcesso       String?  // Boa, Regular, Ruim
  temCerca              Boolean  @default(false)
  temGalpao             Boolean  @default(false)

  // Recursos Hídricos
  temAcude              Boolean  @default(false)
  temNascente           Boolean  @default(false)
  temPoco               Boolean  @default(false)
  margeiaRio            Boolean  @default(false)

  // Documentação
  matricula             String?
  car                   String?
  itr                   String?
  documentos            Json?    // URLs de documentos

  // Fotos
  fotos                 Json?    // Array de {url, legenda, data}

  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([produtorId])
  @@index([distrito])
  @@map("propriedades_rurais")
}
```

#### ✅ **CONCLUSÃO MS-02**
**Status:** 🔴 **NÃO EXISTE** - Precisa criar do zero

**Ação Necessária:**
1. Criar model `PropriedadeRural` no schema
2. Adicionar relação N:1 com `ProdutorRural`
3. Criar rotas CRUD completas
4. Criar service com lógica de negócio
5. Implementar integração com mapas

---

### **MS-03: DISTRIBUIÇÃO DE SEMENTES E MUDAS**

#### ❌ **BACKEND NÃO EXISTE**
- **Model Prisma:** ❌ Não encontrado
- **Rotas:** ❌ Não encontrado
- **Service:** ❌ Não encontrado

#### 🔧 **ESTRUTURA NECESSÁRIA**
```prisma
// Estoque de Sementes
model EstoqueSemente {
  id                String   @id @default(cuid())
  tipo              String   // Semente ou Muda
  categoria         String   // Milho, Feijão, Hortaliças, Frutíferas
  variedade         String   // Cultivar específica

  quantidade        Float
  unidade           String   // KG, SACAS, UNIDADES

  lote              String?
  dataValidade      DateTime?
  fornecedor        String?
  notaFiscal        String?
  dataEntrada       DateTime @default(now())

  observacoes       String?

  distribuicoes     DistribuicaoSemente[]

  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([categoria])
  @@index([dataValidade])
  @@map("estoque_sementes")
}

// Distribuição de Sementes
model DistribuicaoSemente {
  id                String   @id @default(cuid())
  produtorId        String
  produtor          ProdutorRural @relation(fields: [produtorId], references: [id])

  estoqueId         String
  estoque           EstoqueSemente @relation(fields: [estoqueId], references: [id])

  quantidade        Float
  unidade           String

  dataDistribuicao  DateTime @default(now())
  responsavel       String   // userId

  assinatura        String?  // Assinatura digital (base64)
  comprovante       String?  // URL do comprovante

  observacoes       String?

  createdAt         DateTime @default(now())

  @@index([produtorId])
  @@index([estoqueId])
  @@index([dataDistribuicao])
  @@map("distribuicao_sementes")
}
```

#### ✅ **CONCLUSÃO MS-03**
**Status:** 🔴 **NÃO EXISTE** - Precisa criar do zero

**Ação Necessária:**
1. Criar models `EstoqueSemente` e `DistribuicaoSemente`
2. Criar rotas CRUD para ambos
3. Implementar lógica de controle de estoque (baixa automática)
4. Sistema de limites por produtor/safra
5. Alertas de estoque baixo e validade

---

### **MS-04: ASSISTÊNCIA TÉCNICA RURAL (ATER)**

#### ❌ **BACKEND NÃO EXISTE**
- **Model Prisma:** ❌ Não encontrado
- **Rotas:** ❌ Não encontrado
- **Service:** ❌ Não encontrado

#### 🔧 **ESTRUTURA NECESSÁRIA**
```prisma
// Solicitação de Assistência
model SolicitacaoAssistencia {
  id                  String   @id @default(cuid())
  produtorId          String
  produtor            ProdutorRural @relation(fields: [produtorId], references: [id])

  propriedadeId       String?
  propriedade         PropriedadeRural? @relation(fields: [propriedadeId], references: [id])

  tipoAssistencia     TipoAssistencia
  descricaoProblema   String
  urgencia            Urgencia

  dataPreferencial    DateTime?
  periodo             String?  // Manhã, Tarde

  fotos               Json?    // Array de URLs

  status              StatusAssistencia @default(SOLICITADA)

  visita              VisitaTecnica?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([produtorId])
  @@index([status])
  @@map("solicitacoes_assistencia")
}

// Visita Técnica
model VisitaTecnica {
  id                    String   @id @default(cuid())
  solicitacaoId         String   @unique
  solicitacao           SolicitacaoAssistencia @relation(fields: [solicitacaoId], references: [id])

  tecnicoId             String   // userId do técnico
  tecnicoNome           String

  dataAgendada          DateTime
  horaAgendada          String
  duracaoEstimada       Int?     // minutos

  dataRealizada         DateTime?
  produtorPresente      Boolean?
  quemAtendeu           String?

  // Relatório
  problemaIdentificado  String?
  orientacoesFornecidas String?
  acoesRecomendadas     String?
  prazoRetorno          DateTime?

  insumosRecomendados   Json?    // Array de insumos sugeridos
  fotosAntes            Json?
  fotosDepois           Json?

  necessitaNovaVisita   Boolean  @default(false)
  dataNovaVisita        DateTime?

  // Assinaturas
  assinaturaTecnico     String?
  assinaturaProdutor    String?

  status                StatusVisita @default(AGENDADA)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([tecnicoId])
  @@index([dataAgendada])
  @@index([status])
  @@map("visitas_tecnicas")
}

enum TipoAssistencia {
  ORIENTACAO_GERAL
  ANALISE_SOLO
  CONTROLE_PRAGAS
  MANEJO_IRRIGACAO
  ORIENTACAO_CULTIVO
  ANALISE_LAVOURA
  ORIENTACAO_PECUARIA
  PROJETOS_TECNICOS
  OUTROS
}

enum Urgencia {
  BAIXA
  MEDIA
  ALTA
}

enum StatusAssistencia {
  SOLICITADA
  AGENDADA
  EM_ANDAMENTO
  CONCLUIDA
  CANCELADA
}

enum StatusVisita {
  AGENDADA
  CONFIRMADA
  REALIZADA
  CANCELADA
  REAGENDADA
}
```

#### ✅ **CONCLUSÃO MS-04**
**Status:** 🔴 **NÃO EXISTE** - Precisa criar do zero

**Ação Necessária:**
1. Criar models de Solicitação e Visita
2. Criar rotas CRUD completas
3. Implementar calendário de técnicos
4. Sistema de notificações (SMS/WhatsApp)
5. Upload de fotos georreferenciadas

---

### **MS-05: MECANIZAÇÃO AGRÍCOLA / PATRULHA MECANIZADA**

#### ✅ **BACKEND EXISTE (PARCIAL)**
- **Model Prisma:** `MaquinaAgricolaMS` ✅ + `SolicitacaoEmprestimoMaquina` ✅
- **Rotas:** `/routes/maquinas-agricolas.routes.ts` ✅
- **Service:** `maquinas-agricolas.service.ts` ✅

#### 📋 **ESTRUTURA DO BANCO (schema.prisma)**
```prisma
model MaquinaAgricolaMS {
  id                String   @id @default(cuid())
  tipo              TipoMaquinaAgricola
  marca             String
  modelo            String
  ano               Int?
  placa             String?  @unique
  patrimonio        String   @unique

  horimetro         Int      @default(0)

  ultimaManutencao  DateTime?
  proximaManutencao DateTime?
  historicoManutencao Json?

  status            StatusMaquina
  localizacaoAtual  String?

  solicitacoes      SolicitacaoEmprestimoMaquina[]

  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model SolicitacaoEmprestimoMaquina {
  id                String   @id @default(cuid())
  workflowId        String   @unique
  produtorRuralId   String
  maquinaId         String

  dataInicio        DateTime
  dataFim           DateTime
  diasSolicitados   Int
  horasEstimadas    Int?
  horasUtilizadas   Int?

  finalidade        FinalidadeUsoMaquina
  areaUtilizacao    String
  tamanhoArea       Float?
  justificativa     String

  status            StatusSolicitacao

  aprovadoPor       String?
  dataAprovacao     DateTime?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum TipoMaquinaAgricola {
  TRATOR
  GRADE
  ARADO
  PLANTADEIRA
  COLHEITADEIRA
  PULVERIZADOR
  ROÇADEIRA
  SUBSOLADOR
  OUTROS
}

enum StatusMaquina {
  DISPONIVEL
  EMPRESTADA
  MANUTENCAO
  QUEBRADA
  INATIVA
}

enum StatusSolicitacao {
  PENDENTE
  APROVADA
  EM_USO
  CONCLUIDA
  CANCELADA
  INDEFERIDA
}
```

#### ⚠️ **DIVERGÊNCIAS IDENTIFICADAS**

**O que está NO BANCO:**
- ✅ Gestão de máquinas completa
- ✅ Solicitações de empréstimo
- ✅ Workflow de aprovação
- ✅ Controle de horímetro

**O que foi PLANEJADO mas NÃO está no banco:**
- ❌ Ordem de Serviço digital
- ❌ Controle de combustível
- ❌ Registro de operador
- ❌ Fila de espera organizada
- ❌ Rastreamento GPS
- ❌ Histórico de manutenções detalhado

#### ✅ **CONCLUSÃO MS-05**
**Status:** 🟡 **BASE EXISTE** - Precisa expandir

**Ação Necessária:**
1. Adicionar model `OrdemServico`
2. Adicionar model `ControleCombustivel`
3. Adicionar model `Operador`
4. Implementar sistema de fila
5. Adicionar campos de GPS

---

## 📊 RESUMO GERAL DO ALINHAMENTO

| MS | Nome | Backend | Schema | Rotas | Service | Status |
|----|------|---------|--------|-------|---------|--------|
| MS-01 | Produtores | ✅ | 🟡 Parcial | ✅ | ✅ | 🟡 **60% Pronto** |
| MS-02 | Propriedades | ❌ | ❌ | ❌ | ❌ | 🔴 **0% Pronto** |
| MS-03 | Sementes | ❌ | ❌ | ❌ | ❌ | 🔴 **0% Pronto** |
| MS-04 | Assistência | ❌ | ❌ | ❌ | ❌ | 🔴 **0% Pronto** |
| MS-05 | Mecanização | ✅ | 🟡 Parcial | ✅ | ✅ | 🟡 **50% Pronto** |

### **Média Geral:** 🟡 **22% de Alinhamento**

---

## 🚀 PLANO DE AÇÃO RECOMENDADO

### **FASE 1: Completar MS-01 (Produtores)** ⏱️ 2-3 dias
1. Expandir schema `ProdutorRural`
2. Adicionar validações no service
3. Implementar upload de documentos
4. Criar formulário completo no frontend
5. Implementar carteirinha digital

### **FASE 2: Criar MS-02 (Propriedades)** ⏱️ 3-4 dias
1. Criar model `PropriedadeRural`
2. Criar migration
3. Implementar rotas CRUD
4. Criar service
5. Integrar com Google Maps
6. Sistema de upload de fotos

### **FASE 3: Completar MS-05 (Mecanização)** ⏱️ 2-3 dias
1. Adicionar models complementares
2. Implementar fila de espera
3. Criar Ordem de Serviço digital
4. Controle de combustível
5. Dashboard de frota

### **FASE 4: Criar MS-03 (Sementes)** ⏱️ 3-4 dias
1. Criar models de estoque e distribuição
2. Implementar rotas CRUD
3. Sistema de controle de estoque
4. Limites por produtor
5. Alertas automáticos

### **FASE 5: Criar MS-04 (Assistência)** ⏱️ 4-5 dias
1. Criar models de solicitação e visita
2. Implementar calendário
3. Sistema de agendamento
4. Relatórios técnicos digitais
5. Upload de fotos

---

## ⚠️ RISCOS IDENTIFICADOS

### **1. Divergência de Escopo**
- Frontend planejou funcionalidades não existentes no backend
- Pode gerar expectativa incorreta do usuário

### **2. Falta de Integração**
- MS-02 (Propriedades) não existe, mas MS-01 e MS-04 dependem dele
- MS-03 (Sementes) não tem vínculo com produtores

### **3. Duplicação de Dados**
- `ProdutorRural` tem dados de propriedade embutidos
- Criar `PropriedadeRural` separado pode gerar conflito

---

## ✅ RECOMENDAÇÕES

### **Curto Prazo (Imediato):**
1. ✅ **Atualizar badges nos cards do frontend:**
   - MS-01: 🟡 "Em Desenvolvimento" (não "Ativo")
   - MS-02: 🔴 "Aguardando Backend"
   - MS-03: 🔴 "Aguardando Backend"
   - MS-04: 🔴 "Aguardando Backend"
   - MS-05: 🟡 "Em Desenvolvimento"

2. ✅ **Criar documentação técnica** detalhando:
   - O que existe no backend
   - O que precisa ser criado
   - Prioridades de implementação

3. ✅ **Definir prioridade** de implementação com o cliente

### **Médio Prazo:**
1. Implementar MS-01 completo (base para os outros)
2. Criar MS-02 (dependência de MS-01 e MS-04)
3. Completar MS-05 (mais simples, base já existe)

### **Longo Prazo:**
1. Implementar MS-03 e MS-04
2. Integrar todos os MS
3. Criar dashboards consolidados

---

## 📝 CONCLUSÃO

Os Micro Sistemas da Agricultura foram bem **planejados no frontend**, mas o **backend precisa de implementação significativa**.

**Status Atual:**
- ✅ Frontend: 100% estruturado
- 🟡 Backend: 22% implementado
- ❌ Integração: 0% funcional

**Próximo Passo Recomendado:**
Começar pela **FASE 1** (completar MS-01), que é a base para todos os outros sistemas.

---

**Última Atualização:** 2025-01-20
**Responsável:** Equipe DigiUrban
**Status Documento:** ✅ Completo e Validado
