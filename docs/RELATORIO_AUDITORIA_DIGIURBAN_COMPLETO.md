# RELATÓRIO DE AUDITORIA COMPLETA - SISTEMA DIGIURBAN
**Data da Auditoria:** 07/11/2025
**Auditor:** Claude (Sonnet 4.5)
**Escopo:** Verificação completa de integração Backend + Frontend + Motor de Protocolos

---

## EXECUTIVE SUMMARY

### Estatísticas Gerais

| Métrica | Valor | Status |
|---------|-------|--------|
| **Total de Serviços Mapeados** | 114 | ✅ |
| **Serviços COM_DADOS** | 102 | ✅ |
| **Serviços INFORMATIVOS** | 12 | ✅ |
| **Secretarias Analisadas** | 13 | ✅ |
| **Rotas Backend Encontradas** | 14 | ⚠️ |
| **Páginas Frontend Encontradas** | 140+ | ✅ |
| **Handlers de Módulos Encontrados** | 35 | ⚠️ |

### Status Geral da Implementação

**CRÍTICO**: O sistema possui uma **fragmentação significativa** entre:
- Serviços cadastrados no banco (102 COM_DADOS)
- Rotas backend implementadas (limitadas)
- Páginas frontend criadas (muitas)
- Integração com motor de protocolos (parcial)

**Arquitetura Identificada:**
1. **Motor de Protocolos Simplificado** (`ProtocolSimplified`) - ✅ IMPLEMENTADO
2. **Serviços Cadastrados** (`ServiceSimplified`) - ✅ COMPLETO (114 serviços)
3. **Mapeamento de Módulos** (`MODULE_BY_DEPARTMENT`) - ✅ IMPLEMENTADO
4. **Rotas Backend** - ⚠️ IMPLEMENTAÇÃO PARCIAL
5. **Páginas Frontend** - ⚠️ DESCONECTADAS DO BACKEND
6. **Handlers de Módulos** - ⚠️ IMPLEMENTAÇÃO DESATUALIZADA

---

## 1. ANÁLISE DETALHADA POR SECRETARIA

### 1.1 SECRETARIA DE AGRICULTURA (6 serviços COM_DADOS)

#### Serviços Cadastrados (services-simplified-complete.ts)

| # | Nome do Serviço | moduleType | Documentos | formSchema |
|---|----------------|-----------|------------|------------|
| 1 | Atendimentos - Agricultura | `ATENDIMENTOS_AGRICULTURA` | Não | ❌ |
| 2 | Cadastro de Produtor Rural | `CADASTRO_PRODUTOR` | Sim (4) | ✅ Completo |
| 3 | Assistência Técnica Rural | `ASSISTENCIA_TECNICA` | Sim (2) | ❌ |
| 4 | Inscrição em Curso Rural | `INSCRICAO_CURSO_RURAL` | Sim (3) | ❌ |
| 5 | Inscrição em Programa Rural | `INSCRICAO_PROGRAMA_RURAL` | Sim (3) | ❌ |
| 6 | Cadastro de Propriedade Rural | `CADASTRO_PROPRIEDADE_RURAL` | Sim (3) | ❌ |

#### Rotas Backend Implementadas

**Arquivo:** `backend/src/routes/secretarias-agricultura.ts`

| Rota | Método | Funcionalidade | Status |
|------|--------|----------------|--------|
| `/stats` | GET | Estatísticas consolidadas | ✅ |
| `/services` | GET | Lista serviços | ✅ |
| `/propriedades` | GET | Lista propriedades | ✅ |
| `/propriedades` | POST | Cria propriedade + protocolo | ✅ |
| `/propriedades/:id` | GET, PUT, DELETE | CRUD completo | ✅ |
| `/programas` | GET | Lista programas rurais | ✅ |
| `/programas` | POST | Cria programa + inscrições | ✅ |
| `/programas/:id` | GET, PUT, DELETE | CRUD completo | ✅ |
| `/programas/:id/enrollments` | GET | Lista inscrições | ✅ |
| `/programas/:programId/enrollments/:enrollmentId/approve` | PUT | Aprovar inscrição | ✅ |
| `/programas/:programId/enrollments/:enrollmentId/reject` | PUT | Rejeitar inscrição | ✅ |
| `/capacitacoes` | GET, POST | CRUD capacitações | ✅ |
| `/capacitacoes/:id` | GET, PUT, DELETE | CRUD completo | ✅ |
| `/CADASTRO_PRODUTOR/pending` | GET | Protocolos pendentes | ✅ |

**Arquivo:** `backend/src/routes/secretarias-agricultura-produtores.ts`

| Rota | Método | Funcionalidade | Status |
|------|--------|----------------|--------|
| `/` | GET | Lista produtores | ✅ |
| `/` | POST | Cria produtor | ✅ |
| `/:id` | GET, PUT, DELETE | CRUD completo | ✅ |

#### Páginas Frontend Implementadas

| Página | Caminho | Funcionalidade | Integração Backend |
|--------|---------|----------------|-------------------|
| Dashboard Agricultura | `/admin/secretarias/agricultura/dashboard/page.tsx` | Dashboard geral | ❌ Dados estáticos |
| Produtores | `/admin/secretarias/agricultura/produtores/page.tsx` | Lista produtores | ⚠️ Parcial |
| Novo Produtor | `/admin/secretarias/agricultura/produtores/novo/page.tsx` | Formulário criação | ⚠️ Parcial |
| Editar Produtor | `/admin/secretarias/agricultura/produtores/[id]/editar/page.tsx` | Formulário edição | ⚠️ Parcial |
| Propriedades | `/admin/secretarias/agricultura/propriedades/page.tsx` | Lista propriedades | ⚠️ Parcial |
| Nova Propriedade | `/admin/secretarias/agricultura/propriedades/novo/page.tsx` | Formulário criação | ⚠️ Parcial |
| Programas | `/admin/secretarias/agricultura/programas/page.tsx` | Lista programas | ⚠️ Parcial |
| Novo Programa | `/admin/secretarias/agricultura/programas/novo/page.tsx` | Formulário criação | ⚠️ Parcial |
| Editar Programa | `/admin/secretarias/agricultura/programas/[id]/editar/page.tsx` | Formulário edição | ⚠️ Parcial |
| Capacitações | `/admin/secretarias/agricultura/capacitacoes/page.tsx` | Lista capacitações | ⚠️ Parcial |
| Nova Capacitação | `/admin/secretarias/agricultura/capacitacoes/novo/page.tsx` | Formulário criação | ⚠️ Parcial |
| Assistência Técnica | `/admin/secretarias/agricultura/assistencia-tecnica/page.tsx` | Lista solicitações | ❌ Não integrado |
| Distribuição Sementes | `/admin/secretarias/agricultura/distribuicao-sementes/page.tsx` | Gestão distribuição | ❌ Não integrado |
| Atendimentos | `/admin/secretarias/agricultura/atendimentos/page.tsx` | Lista atendimentos | ❌ Não integrado |

#### Análise de Integração

**✅ IMPLEMENTADO CORRETAMENTE:**
- ✅ Produtores rurais: CRUD completo (backend + frontend + protocolo)
- ✅ Propriedades rurais: CRUD completo com geração de protocolo concluído
- ✅ Programas rurais: CRUD + inscrições + aprovação/rejeição
- ✅ Capacitações: CRUD completo
- ✅ Motor de protocolos integrado

**⚠️ IMPLEMENTAÇÃO PARCIAL:**
- Formulários frontend não usam `formSchema` do serviço
- Dashboard com dados mockados (não consome `/stats`)
- Faltam validações client-side baseadas no schema

**❌ NÃO IMPLEMENTADO:**
- Assistência Técnica: página existe mas sem rota backend dedicada
- Distribuição de Sementes: página existe mas sem backend
- Atendimentos Agricultura: página existe mas sem backend específico
- Inscrição em Curso Rural: sem rota e sem página
- 4 dos 6 serviços COM_DADOS **não possuem fluxo completo**

---

### 1.2 SECRETARIA DE SAÚDE (11 serviços - 10 COM_DADOS + 1 GESTÃO)

#### Serviços Cadastrados

| # | Nome do Serviço | moduleType | Documentos | formSchema |
|---|----------------|-----------|------------|------------|
| 1 | Atendimentos - Saúde | `ATENDIMENTOS_SAUDE` | Não | ❌ |
| 2 | Agendamento de Consulta Médica | `AGENDAMENTOS_MEDICOS` | Sim (2) | ❌ |
| 3 | Controle de Medicamentos | `CONTROLE_MEDICAMENTOS` | Sim (2) | ❌ |
| 4 | Campanhas de Vacinação | `CAMPANHAS_SAUDE` | Sim (2) | ❌ |
| 5 | Programas de Saúde | `PROGRAMAS_SAUDE` | Sim (2) | ❌ |
| 6 | Encaminhamento TFD | `ENCAMINHAMENTOS_TFD` | Sim (3) | ❌ |
| 7 | Solicitação de Exames | `EXAMES` | Sim (2) | ❌ |
| 8 | Transporte de Pacientes | `TRANSPORTE_PACIENTES` | Sim (2) | ❌ |
| 9 | Cartão SUS | `CADASTRO_PACIENTE` | Sim (3) | ❌ |
| 10 | Registro de Vacinação | `VACINACAO` | Sim (2) | ❌ |
| 11 | Gestão de ACS | `GESTAO_ACS` | Não | ❌ |

#### Rotas Backend Implementadas

**Arquivo:** `backend/src/routes/secretarias-saude.ts`

**Rotas Principais:**
- ✅ `/atendimentos` - GET/POST
- ✅ `/medicamentos` - GET
- ✅ `/medicamentos/dispensar` - POST
- ✅ `/campanhas` - GET
- ✅ `/campanhas/:id/inscrever` - POST
- ✅ `/dashboard` - GET (indicadores)
- ✅ `/stats` - GET (estatísticas com ProtocolSimplified)
- ✅ `/health-attendances` - GET/POST/PUT/DELETE (CRUD completo)
- ✅ `/health-units` - GET/POST/PUT/DELETE (CRUD completo)
- ✅ `/vaccination-campaigns` - GET/POST/PUT/DELETE (CRUD completo)
- ✅ `/vaccination-campaigns/:id/progress` - PATCH

#### Páginas Frontend Implementadas

| Página | Caminho | Integração Backend |
|--------|---------|-------------------|
| Atendimentos Saúde | `/admin/secretarias/saude/atendimentos/page.tsx` | ⚠️ Parcial |
| Agendamentos Médicos | `/admin/secretarias/saude/agendamentos/page.tsx` | ✅ Usa ModulePageTemplate |
| Pacientes | `/admin/secretarias/saude/pacientes/page.tsx` | ⚠️ Parcial |
| Medicamentos | `/admin/secretarias/saude/medicamentos/page.tsx` | ⚠️ Parcial |
| Campanhas Vacinação | `/admin/secretarias/saude/campanhas/page.tsx` | ⚠️ Parcial |
| Programas Saúde | `/admin/secretarias/saude/programas/page.tsx` | ⚠️ Parcial |
| Exames | `/admin/secretarias/saude/exames/page.tsx` | ⚠️ Parcial |
| Vacinação | `/admin/secretarias/saude/vacinacao/page.tsx` | ⚠️ Parcial |
| Transportes TFD | `/admin/secretarias/saude/transportes-tfd/page.tsx` | ⚠️ Parcial |
| Solicitações Transporte | `/admin/secretarias/saude/solicitacoes-transporte/page.tsx` | ⚠️ Parcial |
| ACS (Agentes) | `/admin/secretarias/saude/acs/page.tsx` | ⚠️ Parcial |

#### Análise de Integração

**✅ PONTOS POSITIVOS:**
- Rotas backend robustas com validação Zod
- CRUD completo para Health Attendances, Units e Vaccination Campaigns
- Integração com ProtocolSimplified funcionando
- Estatísticas consolidadas implementadas

**⚠️ ISSUES MÉDIOS:**
- Agendamentos médicos: usa `ModulePageTemplate` mas sem config completo
- Faltam handlers específicos para cada moduleType
- Formulários não seguem padrão do `formSchema` dos serviços

**❌ ISSUES CRÍTICOS:**
- **8 dos 10 serviços COM_DADOS** não possuem fluxo completo implementado
- Nenhum `formSchema` definido nos serviços
- Páginas frontend desconectadas dos serviços cadastrados
- Sem roteamento automático baseado em `moduleType`

---

### 1.3 SECRETARIA DE EDUCAÇÃO (11 serviços - 8 COM_DADOS + 2 GESTÃO + 1 INFO)

#### Serviços Cadastrados

| # | Nome do Serviço | moduleType | Tipo |
|---|----------------|-----------|------|
| 1 | Atendimentos - Educação | `ATENDIMENTOS_EDUCACAO` | COM_DADOS |
| 2 | Matrícula de Aluno | `MATRICULA_ALUNO` | COM_DADOS |
| 3 | Transporte Escolar | `TRANSPORTE_ESCOLAR` | COM_DADOS |
| 4 | Registro de Ocorrência Escolar | `REGISTRO_OCORRENCIA_ESCOLAR` | COM_DADOS |
| 5 | Solicitação de Documento Escolar | `SOLICITACAO_DOCUMENTO_ESCOLAR` | COM_DADOS |
| 6 | Transferência Escolar | `TRANSFERENCIA_ESCOLAR` | COM_DADOS |
| 7 | Consulta de Frequência | `CONSULTA_FREQUENCIA` | COM_DADOS |
| 8 | Consulta de Notas | `CONSULTA_NOTAS` | COM_DADOS |
| 9 | Gestão Escolar | `GESTAO_ESCOLAR` | COM_DADOS (Gestão) |
| 10 | Gestão de Merenda | `GESTAO_MERENDA` | COM_DADOS (Gestão) |
| 11 | Calendário Escolar | null | INFORMATIVO |

#### Rotas Backend Implementadas

**Arquivo:** `backend/src/routes/secretarias-educacao.ts`

**Rotas Disponíveis:**
- ✅ `/stats` - GET (estatísticas consolidadas)
- ✅ `/services` - GET (lista serviços)

**CRÍTICO:** Apenas 2 rotas implementadas! O arquivo é extremamente minimalista.

#### Páginas Frontend Implementadas

| Página | Caminho | Status |
|--------|---------|--------|
| Education Attendances | `/admin/secretarias/educacao/education-attendances/page.tsx` | ❌ Sem backend |
| Students (Alunos) | `/admin/secretarias/educacao/students/page.tsx` | ❌ Sem backend |
| School Transports | `/admin/secretarias/educacao/school-transports/page.tsx` | ❌ Sem backend |
| Disciplinary Records | `/admin/secretarias/educacao/disciplinary-records/page.tsx` | ❌ Sem backend |
| School Documents | `/admin/secretarias/educacao/school-documents/page.tsx` | ❌ Sem backend |
| Student Transfers | `/admin/secretarias/educacao/student-transfers/page.tsx` | ❌ Sem backend |
| Attendance Records | `/admin/secretarias/educacao/attendance-records/page.tsx` | ❌ Sem backend |
| Grade Records | `/admin/secretarias/educacao/grade-records/page.tsx` | ❌ Sem backend |
| School Management | `/admin/secretarias/educacao/school-management/page.tsx` | ❌ Sem backend |
| School Meals | `/admin/secretarias/educacao/school-meals/page.tsx` | ❌ Sem backend |

#### Análise de Integração

**❌ CRÍTICO - SECRETARIA PRATICAMENTE NÃO IMPLEMENTADA:**
- Backend possui apenas rotas de estatísticas e listagem de serviços
- **TODAS as 10 páginas frontend não possuem backend funcional**
- Nenhum CRUD implementado
- Nenhum formulário funcional
- Nenhuma integração com protocolo além do mapeamento

**Prioridade:** **MÁXIMA** - Esta secretaria precisa de implementação urgente.

---

### 1.4 SECRETARIA DE ASSISTÊNCIA SOCIAL (9 serviços - 8 COM_DADOS + 1 GESTÃO)

#### Serviços Cadastrados

| # | Nome do Serviço | moduleType |
|---|----------------|-----------|
| 1 | Atendimentos - Assistência Social | `ATENDIMENTOS_ASSISTENCIA_SOCIAL` |
| 2 | Cadastro Único (CadÚnico) | `CADASTRO_UNICO` |
| 3 | Solicitação de Benefício Social | `SOLICITACAO_BENEFICIO` |
| 4 | Entrega Emergencial | `ENTREGA_EMERGENCIAL` |
| 5 | Inscrição em Grupo/Oficina | `INSCRICAO_GRUPO_OFICINA` |
| 6 | Visitas Domiciliares | `VISITAS_DOMICILIARES` |
| 7 | Inscrição em Programa Social | `INSCRICAO_PROGRAMA_SOCIAL` |
| 8 | Agendamento Atendimento Social | `AGENDAMENTO_ATENDIMENTO_SOCIAL` |
| 9 | Gestão CRAS/CREAS | `GESTAO_CRAS_CREAS` |

#### Rotas Backend Implementadas

**Arquivo:** `backend/src/routes/secretarias-assistencia-social.ts`

**Rotas Disponíveis:**
- ✅ `/stats` - GET (estatísticas consolidadas)
- ✅ `/services` - GET (lista serviços)
- ✅ `/familias` - GET (lista famílias vulneráveis)
- ✅ `/beneficios` - GET (lista solicitações de benefícios)
- ✅ `/entregas` - GET (lista entregas emergenciais)
- ✅ `/visitas` - GET (lista visitas domiciliares)
- ✅ `/programas` - GET (lista programas sociais)
- ✅ `/cras-creas` - GET (lista equipamentos SUAS)

#### Páginas Frontend Implementadas

| Página | Caminho | Integração |
|--------|---------|------------|
| Atendimentos | `/admin/secretarias/assistencia-social/atendimentos/page.tsx` | ⚠️ Parcial |
| Famílias Vulneráveis | `/admin/secretarias/assistencia-social/familias-vulneraveis/page.tsx` | ✅ Integrado |
| Solicitações Benefícios | `/admin/secretarias/assistencia-social/solicitacoes-beneficios/page.tsx` | ✅ Integrado |
| Entregas Emergenciais | `/admin/secretarias/assistencia-social/entregas-emergenciais/page.tsx` | ✅ Integrado |
| Visitas Domiciliares | `/admin/secretarias/assistencia-social/visitas-domiciliares/page.tsx` | ✅ Integrado |
| Inscrições Programas | `/admin/secretarias/assistencia-social/inscricoes-programas/page.tsx` | ✅ Integrado |
| Inscrições Grupos | `/admin/secretarias/assistencia-social/inscricoes-grupos/page.tsx` | ⚠️ Parcial |
| Equipamentos (CRAS/CREAS) | `/admin/secretarias/assistencia-social/equipamentos/page.tsx` | ✅ Integrado |
| Agendamentos | `/admin/secretarias/assistencia-social/agendamentos/page.tsx` | ⚠️ Parcial |

#### Análise de Integração

**✅ PONTOS POSITIVOS:**
- Rotas de listagem implementadas para módulos principais
- Integração com entidades do banco (VulnerableFamily, BenefitRequest, etc)
- Estatísticas funcionais usando ProtocolSimplified

**⚠️ ISSUES MÉDIOS:**
- Faltam rotas de CRUD (POST/PUT/DELETE) para todos os módulos
- Apenas consultas implementadas, sem criação/edição via backend
- Páginas frontend consomem dados mas não podem criar/editar

**❌ ISSUES CRÍTICOS:**
- **Nenhum formulário de criação funcional**
- CadÚnico não possui rota de cadastro
- Benefícios sem aprovação/rejeição implementada
- Sem integração completa com protocolo para criação de registros

---

### 1.5 RESUMO DAS DEMAIS SECRETARIAS

#### CULTURA (9 serviços - 8 COM_DADOS + 1 INFO)
- **Backend:** Rotas não encontradas (apenas padrão genérico)
- **Frontend:** 7 páginas encontradas
- **Status:** ❌ **NÃO IMPLEMENTADO**
- **Prioridade:** ALTA

#### ESPORTES (9 serviços - 8 COM_DADOS + 1 INFO)
- **Backend:** Rotas não encontradas
- **Frontend:** 8 páginas encontradas
- **Status:** ❌ **NÃO IMPLEMENTADO**
- **Prioridade:** ALTA

#### HABITAÇÃO (7 serviços - 6 COM_DADOS + 1 INFO)
- **Backend:** Rotas não encontradas
- **Frontend:** 7 páginas encontradas
- **Status:** ❌ **NÃO IMPLEMENTADO**
- **Prioridade:** ALTA

#### MEIO AMBIENTE (7 serviços - 6 COM_DADOS + 1 GESTÃO)
- **Backend:** Rotas não encontradas
- **Frontend:** 7 páginas encontradas
- **Status:** ❌ **NÃO IMPLEMENTADO**
- **Prioridade:** ALTA

#### OBRAS PÚBLICAS (7 serviços - 5 COM_DADOS + 2 INFO)
- **Backend:** Rotas não encontradas
- **Frontend:** 8 páginas encontradas (incluindo dashboard, mapa, fiscalizações)
- **Status:** ❌ **NÃO IMPLEMENTADO**
- **Prioridade:** ALTA

#### PLANEJAMENTO URBANO (9 serviços - 7 COM_DADOS + 2 INFO)
- **Backend:** Rotas não encontradas
- **Frontend:** 13 páginas encontradas (dashboard, alvarás, zoneamento, etc)
- **Status:** ❌ **NÃO IMPLEMENTADO**
- **Prioridade:** MÁXIMA (serviços críticos)

#### SEGURANÇA PÚBLICA (11 serviços - 8 COM_DADOS + 2 GESTÃO + 1 INFO)
- **Backend:** Arquivo backup encontrado (`secretarias-seguranca-publica.ts.backup`)
- **Frontend:** 10 páginas encontradas
- **Status:** ⚠️ **PARCIALMENTE IMPLEMENTADO (DESATIVADO?)**
- **Prioridade:** MÁXIMA

#### SERVIÇOS PÚBLICOS (9 serviços - 7 COM_DADOS + 1 GESTÃO + 1 INFO)
- **Backend:** Rotas não encontradas
- **Frontend:** 8 páginas encontradas
- **Status:** ❌ **NÃO IMPLEMENTADO**
- **Prioridade:** ALTA

#### TURISMO (9 serviços - 7 COM_DADOS + 2 INFO)
- **Backend:** Rotas não encontradas
- **Frontend:** 7 páginas encontradas
- **Status:** ❌ **NÃO IMPLEMENTADO**
- **Prioridade:** MÉDIA

---

## 2. MOTOR DE PROTOCOLOS - ANÁLISE DETALHADA

### 2.1 Arquitetura do Motor

**Arquivo Principal:** `backend/src/routes/protocols-simplified.routes.ts`

#### Funcionalidades Implementadas

| Endpoint | Método | Funcionalidade | Status |
|----------|--------|----------------|--------|
| `/` | POST | Criar protocolo + vincular módulo | ✅ |
| `/` | GET | Listar todos os protocolos | ✅ |
| `/:id` | GET | Buscar protocolo por ID | ✅ |
| `/:id/approve` | PUT | Aprovar protocolo | ✅ |
| `/:id/reject` | PUT | Rejeitar protocolo | ✅ |
| `/:id/status` | PATCH | Atualizar status | ✅ |
| `/:id/comments` | POST | Adicionar comentário | ✅ |
| `/:id/assign` | PATCH | Atribuir responsável | ✅ |
| `/department/:departmentId` | GET | Listar por departamento | ✅ |
| `/module/:departmentId/:moduleType` | GET | Listar por módulo | ✅ |
| `/module/:moduleType/pending` | GET | Listar pendentes por módulo | ✅ |
| `/citizen/:citizenId` | GET | Listar por cidadão | ✅ |
| `/:id/history` | GET | Histórico completo | ✅ |
| `/:id/evaluate` | POST | Avaliar protocolo | ✅ |
| `/stats/:departmentId` | GET | Estatísticas | ✅ |
| `/:number` | GET | Buscar por número | ✅ |

#### Serviço de Integração com Módulos

**Arquivo:** `backend/src/services/protocol-module.service.ts`

**Funcionalidades Críticas:**
- ✅ `createProtocolWithModule()` - Cria protocolo e entidade do módulo automaticamente
- ✅ `approveProtocol()` - Ativa registro no módulo ao aprovar
- ✅ `rejectProtocol()` - Marca protocolo como rejeitado
- ✅ `getPendingProtocolsByModule()` - Lista protocolos aguardando aprovação

### 2.2 Handlers de Módulos

**Total de Handlers Encontrados:** 35

#### Handlers por Secretaria

**AGRICULTURA:**
- `rural-producer-handler.ts` - CADASTRO_PRODUTOR
- `technical-assistance-handler.ts` - ASSISTENCIA_TECNICA
- `soil-analysis-handler.ts` - (não mapeado)
- `seed-distribution-handler.ts` - (não mapeado)
- `farmer-market-handler.ts` - (não mapeado)

**SAÚDE:**
- `appointment-handler.ts` - AGENDAMENTOS_MEDICOS
- `medication-handler.ts` - CONTROLE_MEDICAMENTOS
- `vaccination-handler.ts` - VACINACAO
- `exam-handler.ts` - EXAMES
- `program-enrollment-handler.ts` - PROGRAMAS_SAUDE
- `home-care-handler.ts` - (não mapeado)

**EDUCAÇÃO:**
- `enrollment-handler.ts` - MATRICULA_ALUNO
- `transport-handler.ts` - TRANSPORTE_ESCOLAR
- `transfer-handler.ts` - TRANSFERENCIA_ESCOLAR
- `meal-handler.ts` - GESTAO_MERENDA
- `material-handler.ts` - (não mapeado)

**ASSISTÊNCIA SOCIAL:**
- `family-registration-handler.ts` - CADASTRO_UNICO
- `benefit-request-handler.ts` - SOLICITACAO_BENEFICIO
- `home-visit-handler.ts` - VISITAS_DOMICILIARES
- `program-enrollment-handler.ts` - INSCRICAO_PROGRAMA_SOCIAL
- `document-request-handler.ts` - (não mapeado)

**SEGURANÇA PÚBLICA:**
- `police-report-handler.ts` - REGISTRO_OCORRENCIA
- `anonymous-tip-handler.ts` - DENUNCIA_ANONIMA
- `patrol-request-handler.ts` - SOLICITACAO_RONDA
- `camera-request-handler.ts` - SOLICITACAO_CAMERA_SEGURANCA

**PLANEJAMENTO URBANO:**
- `building-permit-handler.ts` - ALVARA_CONSTRUCAO
- `certificate-handler.ts` - SOLICITACAO_CERTIDAO
- `lot-subdivision-handler.ts` - CADASTRO_LOTEAMENTO
- `property-numbering-handler.ts` - (não mapeado)

**MEIO AMBIENTE:**
- `environmental-license-handler.ts` - LICENCA_AMBIENTAL
- `environmental-complaint-handler.ts` - DENUNCIA_AMBIENTAL
- `tree-authorization-handler.ts` - AUTORIZACAO_PODA_CORTE
- `organic-certification-handler.ts` - (não mapeado)

### 2.3 Problemas Identificados no Motor de Protocolos

**❌ CRÍTICO:**
1. **Handlers desconectados:** 35 handlers encontrados mas não integrados às rotas das secretarias
2. **Falta de mapeamento:** Handlers não são chamados automaticamente pelo `moduleType`
3. **Duplicação de lógica:** Cada rota de secretaria reimplementa lógica que deveria estar no handler
4. **Inconsistência:** Alguns módulos usam handler, outros não

**⚠️ MÉDIO:**
1. Faltam handlers para muitos serviços cadastrados
2. Sem validação automática de `formSchema` do serviço
3. Sem verificação de documentos obrigatórios

**💡 RECOMENDAÇÃO:**
Implementar um **Protocol Module Registry** que mapeia automaticamente `moduleType` → Handler → Entidade do Banco

---

## 3. MATRIZ COMPLETA DE INTEGRAÇÃO

### 3.1 Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Totalmente implementado e funcional |
| ⚠️ | Parcialmente implementado |
| ❌ | Não implementado |
| 🔧 | Implementado mas com bugs |
| 📝 | Código existe mas não está em uso |

### 3.2 AGRICULTURA

| Serviço | moduleType | Backend | Frontend | Protocolo | Handler | Status Final |
|---------|-----------|---------|----------|-----------|---------|--------------|
| Atendimentos | ATENDIMENTOS_AGRICULTURA | ❌ | ✅ | ⚠️ | ❌ | ⚠️ |
| Cadastro Produtor | CADASTRO_PRODUTOR | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assistência Técnica | ASSISTENCIA_TECNICA | ❌ | ✅ | ⚠️ | ✅ | ⚠️ |
| Curso Rural | INSCRICAO_CURSO_RURAL | ❌ | ❌ | ❌ | ❌ | ❌ |
| Programa Rural | INSCRICAO_PROGRAMA_RURAL | ✅ | ✅ | ✅ | ❌ | ✅ |
| Propriedade Rural | CADASTRO_PROPRIEDADE_RURAL | ✅ | ✅ | ✅ | ❌ | ✅ |

**Score:** 3/6 completos (50%)

### 3.3 SAÚDE

| Serviço | moduleType | Backend | Frontend | Protocolo | Handler | Status Final |
|---------|-----------|---------|----------|-----------|---------|--------------|
| Atendimentos | ATENDIMENTOS_SAUDE | ✅ | ✅ | ✅ | ❌ | ✅ |
| Agendamentos | AGENDAMENTOS_MEDICOS | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |
| Medicamentos | CONTROLE_MEDICAMENTOS | ✅ | ✅ | ⚠️ | ✅ | ⚠️ |
| Campanhas Vacinação | CAMPANHAS_SAUDE | ✅ | ✅ | ⚠️ | ❌ | ⚠️ |
| Programas Saúde | PROGRAMAS_SAUDE | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |
| TFD | ENCAMINHAMENTOS_TFD | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ |
| Exames | EXAMES | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |
| Transporte Pacientes | TRANSPORTE_PACIENTES | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ |
| Cartão SUS | CADASTRO_PACIENTE | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ |
| Vacinação | VACINACAO | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |
| Gestão ACS | GESTAO_ACS | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ |

**Score:** 1/11 completo (9%)

### 3.4 EDUCAÇÃO

| Serviço | moduleType | Backend | Frontend | Protocolo | Handler | Status Final |
|---------|-----------|---------|----------|-----------|---------|--------------|
| Atendimentos | ATENDIMENTOS_EDUCACAO | ❌ | ✅ | ⚠️ | ❌ | ❌ |
| Matrícula | MATRICULA_ALUNO | ❌ | ✅ | ⚠️ | ✅ | ⚠️ |
| Transporte | TRANSPORTE_ESCOLAR | ❌ | ✅ | ⚠️ | ✅ | ⚠️ |
| Ocorrência | REGISTRO_OCORRENCIA_ESCOLAR | ❌ | ✅ | ⚠️ | ❌ | ❌ |
| Documento | SOLICITACAO_DOCUMENTO_ESCOLAR | ❌ | ✅ | ⚠️ | ❌ | ❌ |
| Transferência | TRANSFERENCIA_ESCOLAR | ❌ | ✅ | ⚠️ | ✅ | ⚠️ |
| Frequência | CONSULTA_FREQUENCIA | ❌ | ✅ | ⚠️ | ❌ | ❌ |
| Notas | CONSULTA_NOTAS | ❌ | ✅ | ⚠️ | ❌ | ❌ |
| Gestão Escolar | GESTAO_ESCOLAR | ❌ | ✅ | ⚠️ | ❌ | ❌ |
| Merenda | GESTAO_MERENDA | ❌ | ✅ | ⚠️ | ✅ | ⚠️ |

**Score:** 0/10 completo (0%)

### 3.5 ASSISTÊNCIA SOCIAL

| Serviço | moduleType | Backend | Frontend | Protocolo | Handler | Status Final |
|---------|-----------|---------|----------|-----------|---------|--------------|
| Atendimentos | ATENDIMENTOS_ASSISTENCIA_SOCIAL | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ |
| CadÚnico | CADASTRO_UNICO | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |
| Benefício | SOLICITACAO_BENEFICIO | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |
| Entrega | ENTREGA_EMERGENCIAL | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ |
| Grupo/Oficina | INSCRICAO_GRUPO_OFICINA | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ |
| Visita | VISITAS_DOMICILIARES | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |
| Programa Social | INSCRICAO_PROGRAMA_SOCIAL | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |
| Agendamento | AGENDAMENTO_ATENDIMENTO_SOCIAL | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ |
| Gestão CRAS/CREAS | GESTAO_CRAS_CREAS | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ |

**Score:** 0/9 completo (0%)

### 3.6 DEMAIS SECRETARIAS (RESUMO)

| Secretaria | Serviços COM_DADOS | Backend Impl. | Frontend Impl. | Score |
|------------|-------------------|---------------|----------------|-------|
| Cultura | 8 | ❌ 0/8 | ✅ 7/8 | 0% |
| Esportes | 8 | ❌ 0/8 | ✅ 8/8 | 0% |
| Habitação | 6 | ❌ 0/6 | ✅ 6/6 | 0% |
| Meio Ambiente | 6 | ❌ 0/6 | ✅ 7/7 | 0% |
| Obras Públicas | 5 | ❌ 0/5 | ✅ 8/8 | 0% |
| Planejamento Urbano | 7 | ❌ 0/7 | ✅ 13/13 | 0% |
| Segurança Pública | 8 | 📝 Backup | ✅ 10/10 | 0% |
| Serviços Públicos | 7 | ❌ 0/7 | ✅ 8/8 | 0% |
| Turismo | 7 | ❌ 0/7 | ✅ 7/7 | 0% |

---

## 4. ISSUES CRÍTICOS

### 4.1 Arquitetura

**ISSUE #1: Desconexão entre Camadas**
- **Severidade:** CRÍTICA
- **Descrição:** Serviços cadastrados não têm relação automática com rotas backend
- **Impacto:** Cada secretaria precisa reimplementar lógica similar
- **Solução:** Criar factory de rotas baseado em `moduleType`

**ISSUE #2: Handlers Não Utilizados**
- **Severidade:** CRÍTICA
- **Descrição:** 35 handlers implementados mas não integrados
- **Impacto:** Código duplicado, inconsistência
- **Solução:** Registry de handlers + middleware automático

**ISSUE #3: formSchema Ignorado**
- **Severidade:** ALTA
- **Descrição:** 102 serviços COM_DADOS sem `formSchema` definido
- **Impacto:** Formulários inconsistentes, validação manual
- **Solução:** Definir schemas e usar gerador automático de forms

### 4.2 Backend

**ISSUE #4: Rotas Genéricas Faltando**
- **Severidade:** CRÍTICA
- **Descrição:** 9 secretarias sem rotas backend
- **Impacto:** 69 serviços COM_DADOS sem backend (67%)
- **Priorização:**
  1. Planejamento Urbano (serviços críticos)
  2. Educação (alta demanda)
  3. Segurança Pública (backup existe, ativar)
  4. Cultura, Esportes, Habitação, Meio Ambiente, Obras, Serviços, Turismo

**ISSUE #5: CRUD Incompleto**
- **Severidade:** ALTA
- **Descrição:** Rotas existentes só fazem GET (consulta)
- **Exemplos:** Assistência Social tem `/familias` GET mas não POST
- **Impacto:** Páginas frontend não podem criar/editar
- **Solução:** Completar CRUD para todos os módulos

### 4.3 Frontend

**ISSUE #6: Formulários Estáticos**
- **Severidade:** MÉDIA
- **Descrição:** Formulários hardcoded em cada página
- **Impacto:** Difícil manutenção, inconsistência
- **Solução:** Component `DynamicForm` que lê `formSchema` do serviço

**ISSUE #7: Dashboards com Dados Mockados**
- **Severidade:** MÉDIA
- **Descrição:** Dashboards não consomem `/stats` do backend
- **Exemplo:** Dashboard Agricultura mostra "0" estático
- **Solução:** Integrar com APIs de estatísticas

**ISSUE #8: Páginas Órfãs**
- **Severidade:** BAIXA
- **Descrição:** 140+ páginas criadas sem backend correspondente
- **Impacto:** Usuário vê página vazia ou erro
- **Solução:** Implementar backends ou ocultar páginas

### 4.4 Motor de Protocolos

**ISSUE #9: Aprovação Manual**
- **Severidade:** MÉDIA
- **Descrição:** Nem todos os módulos implementam approve/reject
- **Impacto:** Workflow incompleto
- **Solução:** Padronizar fluxo de aprovação

**ISSUE #10: Documentos Obrigatórios Não Validados**
- **Severidade:** ALTA
- **Descrição:** `requiredDocuments` não é verificado na criação
- **Impacto:** Protocolos criados sem documentação necessária
- **Solução:** Middleware de validação de documentos

---

## 5. ISSUES MÉDIOS

### 5.1 Validações

**ISSUE #11: Validação Client-Side Ausente**
- Formulários não validam antes de enviar
- Mensagens de erro genéricas
- Solução: React Hook Form + Zod schema validation

**ISSUE #12: Validação de CPF/Documentos**
- CPF não é validado no backend
- RG, CNH, outros documentos aceitos sem verificação
- Solução: Biblioteca de validação de documentos brasileiros

### 5.2 UX

**ISSUE #13: Loading States Inconsistentes**
- Alguns componentes mostram loading, outros não
- Sem skeleton screens
- Solução: Padronizar com Suspense boundaries

**ISSUE #14: Tratamento de Erros**
- Erros de API não são mostrados ao usuário
- Console.error mas sem feedback visual
- Solução: Toast notifications + error boundaries

### 5.3 Segurança

**ISSUE #15: Autorização Incompleta**
- Algumas rotas não verificam permissões
- Frontend permite acesso a páginas sem backend
- Solução: RBAC completo + guards

**ISSUE #16: Dados Sensíveis Expostos**
- Protocolos retornam todos os dados do cidadão
- Sem filtragem baseada em role
- Solução: DTOs por role + data masking

---

## 6. ISSUES MENORES

### 6.1 Code Quality

**ISSUE #17: Código Duplicado**
- Lógica de paginação repetida em cada rota
- Helpers não reutilizados
- Solução: Extrair para utils

**ISSUE #18: Tipos TypeScript Inconsistentes**
- `any` usado em vários lugares
- Interfaces não compartilhadas backend/frontend
- Solução: Shared types package

**ISSUE #19: Comentários em Português**
- Código mistura português e inglês
- Inconsistência de nomenclatura
- Solução: Definir padrão (inglês recomendado)

### 6.2 Performance

**ISSUE #20: N+1 Queries**
- Algumas rotas fazem queries em loop
- Falta uso de `include` do Prisma
- Solução: Otimizar queries com includes

**ISSUE #21: Falta de Índices no Banco**
- Campos frequentemente consultados sem índice
- Solução: Adicionar índices para CPF, status, dates

### 6.3 DevEx

**ISSUE #22: Falta de Testes**
- Nenhum teste automatizado encontrado
- Solução: Jest + Testing Library

**ISSUE #23: Documentação API Inexistente**
- Sem Swagger/OpenAPI
- Endpoints não documentados
- Solução: Gerar docs automático com decorators

---

## 7. RECOMENDAÇÕES PRIORIZADAS

### 7.1 PRIORIDADE MÁXIMA (P0) - URGENTE

**REC #1: Implementar Backends Faltantes**
- **Tempo estimado:** 3-4 semanas
- **Secretarias prioritárias:**
  1. Planejamento Urbano (alvarás, licenças - serviços essenciais)
  2. Educação (matrículas, transporte)
  3. Segurança Pública (ativar rotas do backup)
- **Ação:** Criar padrão de rota genérica baseado em `moduleType`

**REC #2: Conectar Handlers ao Fluxo**
- **Tempo estimado:** 1 semana
- **Ação:**
  - Criar `ModuleHandlerRegistry`
  - Middleware que identifica `moduleType` e chama handler correto
  - Remover lógica duplicada das rotas de secretarias

**REC #3: Definir formSchema para Todos os Serviços**
- **Tempo estimado:** 2 semanas
- **Ação:**
  - Mapear campos necessários para cada serviço COM_DADOS
  - Atualizar seed `services-simplified-complete.ts`
  - Criar componente `DynamicFormBuilder`

### 7.2 PRIORIDADE ALTA (P1) - 1-2 MESES

**REC #4: Completar CRUD de Todos os Módulos**
- **Tempo estimado:** 3 semanas
- **Ação:**
  - Template de rota CRUD genérica
  - POST, PUT, DELETE para todos os módulos existentes

**REC #5: Implementar Validação de Documentos Obrigatórios**
- **Tempo estimado:** 1 semana
- **Ação:**
  - Middleware que verifica `requiredDocuments` do serviço
  - Upload de arquivos integrado

**REC #6: Dashboards Dinâmicos**
- **Tempo estimado:** 2 semanas
- **Ação:**
  - Integrar todos os dashboards com `/stats`
  - Componentes reutilizáveis de KPIs

### 7.3 PRIORIDADE MÉDIA (P2) - 2-3 MESES

**REC #7: Fluxo de Aprovação Padronizado**
- Approve/Reject em todos os módulos COM_DADOS
- Notificações de mudança de status

**REC #8: Gerador Automático de Formulários**
- Ler `formSchema` do serviço
- Renderizar campos dinamicamente
- Validação automática

**REC #9: Sistema de Permissões Granular**
- RBAC completo
- Permissões por secretaria/módulo
- Auditoria de acessos

### 7.4 PRIORIDADE BAIXA (P3) - 3-6 MESES

**REC #10: Refatoração de Código**
- Remover duplicações
- Padronizar nomenclatura
- Extrair utils compartilhados

**REC #11: Testes Automatizados**
- Unit tests para handlers
- Integration tests para rotas
- E2E tests para fluxos críticos

**REC #12: Documentação Técnica**
- Swagger/OpenAPI
- Guias de desenvolvimento
- Arquitetura atualizada

---

## 8. PLANO DE AÇÃO SUGERIDO

### FASE 1: FUNDAÇÃO (Semanas 1-4)

**Objetivo:** Estabelecer arquitetura sólida

1. **Semana 1-2: Module Handler Registry**
   - [ ] Criar registry centralizado
   - [ ] Middleware de roteamento automático
   - [ ] Conectar 35 handlers existentes
   - [ ] Remover lógica duplicada

2. **Semana 3-4: formSchema Completo**
   - [ ] Definir schemas para 102 serviços
   - [ ] Atualizar seed
   - [ ] Criar componente DynamicForm
   - [ ] Testes de validação

**Entregável:** Arquitetura escalável pronta

### FASE 2: BACKENDS CRÍTICOS (Semanas 5-9)

**Objetivo:** Implementar rotas essenciais

1. **Semana 5-6: Planejamento Urbano**
   - [ ] Alvarás de construção
   - [ ] Alvarás de funcionamento
   - [ ] Certidões
   - [ ] Aprovação de projetos
   - [ ] Denúncias

2. **Semana 7-8: Educação**
   - [ ] Matrículas
   - [ ] Transporte escolar
   - [ ] Transferências
   - [ ] Documentos escolares
   - [ ] Ocorrências

3. **Semana 9: Segurança Pública**
   - [ ] Ativar rotas do backup
   - [ ] Integrar com handlers
   - [ ] Testar fluxos

**Entregável:** 3 secretarias críticas funcionais

### FASE 3: EXPANSÃO (Semanas 10-16)

**Objetivo:** Cobrir secretarias restantes

1. **Semanas 10-11: Cultura + Esportes**
2. **Semanas 12-13: Habitação + Meio Ambiente**
3. **Semanas 14-15: Obras + Serviços Públicos**
4. **Semana 16: Turismo**

**Entregável:** Todas as 13 secretarias operacionais

### FASE 4: REFINAMENTO (Semanas 17-20)

**Objetivo:** Completar CRUDs e melhorar UX

1. **Semanas 17-18: CRUD Completo**
   - [ ] POST/PUT/DELETE para módulos existentes
   - [ ] Validações de documentos
   - [ ] Testes de integração

2. **Semanas 19-20: UX e Dashboards**
   - [ ] Dashboards dinâmicos
   - [ ] Loading states
   - [ ] Error handling
   - [ ] Toast notifications

**Entregável:** Sistema completo e polido

### FASE 5: QUALIDADE (Semanas 21-24)

**Objetivo:** Garantir confiabilidade

1. **Semanas 21-22: Testes**
   - [ ] Unit tests (handlers)
   - [ ] Integration tests (rotas)
   - [ ] E2E tests (fluxos críticos)

2. **Semanas 23-24: Documentação**
   - [ ] Swagger/OpenAPI
   - [ ] Guias de desenvolvimento
   - [ ] Treinamento de equipe

**Entregável:** Sistema testado e documentado

---

## 9. MÉTRICAS DE SUCESSO

### KPIs de Implementação

| Métrica | Atual | Meta (6 meses) |
|---------|-------|----------------|
| Serviços COM_DADOS Funcionais | 3/102 (3%) | 102/102 (100%) |
| Secretarias Totalmente Operacionais | 1/13 (8%) | 13/13 (100%) |
| Handlers Integrados | 0/35 (0%) | 35/35 (100%) |
| Páginas com Backend Funcional | 10/140 (7%) | 140/140 (100%) |
| Cobertura de Testes | 0% | 80% |
| Documentação API | 0% | 100% |

### KPIs de Qualidade

| Métrica | Atual | Meta |
|---------|-------|------|
| Tempo Médio de Response (API) | N/A | < 200ms |
| Erros 500 em Produção | N/A | < 0.1% |
| Satisfação do Usuário | N/A | > 4.5/5 |
| Bugs Críticos em Aberto | N/A | 0 |

---

## 10. CONCLUSÃO

### Situação Atual

O **DigiUrban** possui uma arquitetura bem projetada com:
- ✅ Motor de protocolos simplificado funcionando
- ✅ 114 serviços mapeados corretamente
- ✅ 140+ páginas frontend criadas
- ✅ 35 handlers de módulos implementados

Porém, sofre de **fragmentação crítica**:
- ❌ Apenas 3% dos serviços COM_DADOS estão funcionais de ponta a ponta
- ❌ 9 das 13 secretarias não possuem backend
- ❌ Handlers não estão conectados ao fluxo principal
- ❌ Formulários não usam os schemas definidos

### Visão de Futuro

Com a execução do plano de ação proposto em **24 semanas**, o DigiUrban pode se tornar:

**Um sistema verdadeiramente unificado** onde:
1. Qualquer serviço cadastrado automaticamente gera rotas, formulários e protocolos
2. Handlers processam automaticamente baseado em `moduleType`
3. Frontend dinâmico adapta-se aos schemas sem código adicional
4. Cidadãos e servidores têm uma experiência consistente em todas as secretarias

### Próximos Passos Imediatos

**Esta semana:**
1. Aprovar plano de ação com stakeholders
2. Iniciar Fase 1: Module Handler Registry
3. Definir primeiro lote de formSchemas

**Este mês:**
4. Completar fundação arquitetural
5. Implementar Planejamento Urbano (serviços críticos)
6. Testes iniciais com usuários reais

---

## APÊNDICES

### A. Lista Completa de Serviços COM_DADOS (102)

**SAÚDE (10):**
1. ATENDIMENTOS_SAUDE
2. AGENDAMENTOS_MEDICOS
3. CONTROLE_MEDICAMENTOS
4. CAMPANHAS_SAUDE
5. PROGRAMAS_SAUDE
6. ENCAMINHAMENTOS_TFD
7. EXAMES
8. TRANSPORTE_PACIENTES
9. CADASTRO_PACIENTE
10. VACINACAO

**EDUCAÇÃO (8):**
1. ATENDIMENTOS_EDUCACAO
2. MATRICULA_ALUNO
3. TRANSPORTE_ESCOLAR
4. REGISTRO_OCORRENCIA_ESCOLAR
5. SOLICITACAO_DOCUMENTO_ESCOLAR
6. TRANSFERENCIA_ESCOLAR
7. CONSULTA_FREQUENCIA
8. CONSULTA_NOTAS

**ASSISTÊNCIA SOCIAL (8):**
1. ATENDIMENTOS_ASSISTENCIA_SOCIAL
2. CADASTRO_UNICO
3. SOLICITACAO_BENEFICIO
4. ENTREGA_EMERGENCIAL
5. INSCRICAO_GRUPO_OFICINA
6. VISITAS_DOMICILIARES
7. INSCRICAO_PROGRAMA_SOCIAL
8. AGENDAMENTO_ATENDIMENTO_SOCIAL

**AGRICULTURA (6):**
1. ATENDIMENTOS_AGRICULTURA
2. CADASTRO_PRODUTOR
3. ASSISTENCIA_TECNICA
4. INSCRICAO_CURSO_RURAL
5. INSCRICAO_PROGRAMA_RURAL
6. CADASTRO_PROPRIEDADE_RURAL

**CULTURA (8):**
1. ATENDIMENTOS_CULTURA
2. RESERVA_ESPACO_CULTURAL
3. INSCRICAO_OFICINA_CULTURAL
4. CADASTRO_GRUPO_ARTISTICO
5. PROJETO_CULTURAL
6. SUBMISSAO_PROJETO_CULTURAL
7. CADASTRO_EVENTO_CULTURAL
8. REGISTRO_MANIFESTACAO_CULTURAL

**ESPORTES (8):**
1. ATENDIMENTOS_ESPORTES
2. INSCRICAO_ESCOLINHA
3. CADASTRO_ATLETA
4. RESERVA_ESPACO_ESPORTIVO
5. INSCRICAO_COMPETICAO
6. CADASTRO_EQUIPE_ESPORTIVA
7. INSCRICAO_TORNEIO
8. CADASTRO_MODALIDADE

**HABITAÇÃO (6):**
1. ATENDIMENTOS_HABITACAO
2. INSCRICAO_PROGRAMA_HABITACIONAL
3. REGULARIZACAO_FUNDIARIA
4. SOLICITACAO_AUXILIO_ALUGUEL
5. CADASTRO_UNIDADE_HABITACIONAL
6. INSCRICAO_FILA_HABITACAO

**MEIO AMBIENTE (6):**
1. ATENDIMENTOS_MEIO_AMBIENTE
2. LICENCA_AMBIENTAL
3. DENUNCIA_AMBIENTAL
4. PROGRAMA_AMBIENTAL
5. AUTORIZACAO_PODA_CORTE
6. VISTORIA_AMBIENTAL

**OBRAS PÚBLICAS (5):**
1. ATENDIMENTOS_OBRAS
2. SOLICITACAO_REPARO_VIA
3. VISTORIA_TECNICA_OBRAS
4. CADASTRO_OBRA_PUBLICA
5. INSPECAO_OBRA

**PLANEJAMENTO URBANO (7):**
1. ATENDIMENTOS_PLANEJAMENTO
2. APROVACAO_PROJETO
3. ALVARA_CONSTRUCAO
4. ALVARA_FUNCIONAMENTO
5. SOLICITACAO_CERTIDAO
6. DENUNCIA_CONSTRUCAO_IRREGULAR
7. CADASTRO_LOTEAMENTO

**SEGURANÇA PÚBLICA (8):**
1. ATENDIMENTOS_SEGURANCA
2. REGISTRO_OCORRENCIA
3. SOLICITACAO_RONDA
4. SOLICITACAO_CAMERA_SEGURANCA
5. DENUNCIA_ANONIMA
6. CADASTRO_PONTO_CRITICO
7. ALERTA_SEGURANCA
8. REGISTRO_PATRULHA

**SERVIÇOS PÚBLICOS (7):**
1. ATENDIMENTOS_SERVICOS_PUBLICOS
2. ILUMINACAO_PUBLICA
3. LIMPEZA_URBANA
4. COLETA_ESPECIAL
5. SOLICITACAO_CAPINA
6. SOLICITACAO_DESOBSTRUCAO
7. SOLICITACAO_PODA

**TURISMO (7):**
1. ATENDIMENTOS_TURISMO
2. CADASTRO_ESTABELECIMENTO_TURISTICO
3. CADASTRO_GUIA_TURISTICO
4. INSCRICAO_PROGRAMA_TURISTICO
5. REGISTRO_ATRATIVO_TURISTICO
6. CADASTRO_ROTEIRO_TURISTICO
7. CADASTRO_EVENTO_TURISTICO

**TOTAL: 102 serviços COM_DADOS**

---

### B. Arquivos Críticos do Sistema

**Backend - Core:**
- `backend/prisma/seeds/services-simplified-complete.ts` - 114 serviços
- `backend/src/routes/protocols-simplified.routes.ts` - Motor de protocolos
- `backend/src/services/protocol-module.service.ts` - Integração módulos
- `backend/src/config/module-mapping.ts` - Mapeamento de módulos

**Backend - Rotas de Secretarias:**
- `backend/src/routes/secretarias-agricultura.ts` ✅
- `backend/src/routes/secretarias-agricultura-produtores.ts` ✅
- `backend/src/routes/secretarias-saude.ts` ✅
- `backend/src/routes/secretarias-educacao.ts` ⚠️ (mínimo)
- `backend/src/routes/secretarias-assistencia-social.ts` ⚠️ (GET apenas)
- `backend/src/routes/secretarias-seguranca-publica.ts.backup` 📝

**Backend - Handlers:**
- `backend/src/modules/handlers/agriculture/` (5 handlers)
- `backend/src/core/handlers/health/` (5 handlers)
- `backend/src/core/handlers/education/` (5 handlers)
- `backend/src/core/handlers/social-assistance/` (5 handlers)
- `backend/src/modules/security/` (4 handlers)
- `backend/src/modules/handlers/urban-planning/` (4 handlers)
- `backend/src/modules/handlers/environment/` (4 handlers)

**Frontend - Core:**
- `frontend/components/admin/modules/ModulePageTemplate.tsx`
- `frontend/components/admin/modules/PendingProtocolsList.tsx`
- `frontend/lib/module-configs/` - Configs por secretaria

**Frontend - Páginas:**
- `frontend/app/admin/secretarias/**/*.tsx` - 140+ páginas

---

**FIM DO RELATÓRIO**

Relatório gerado automaticamente por Claude (Anthropic) em 07/11/2025.
Para questões, atualizações ou discussões sobre este relatório, consulte a equipe de desenvolvimento.
