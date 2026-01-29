# 🏥 PROPOSTA DE IMPLEMENTAÇÃO - APPS SECRETARIA DE SAÚDE

**Projeto:** DigiUrban
**Data:** 28/01/2026
**Versão:** 2.0 - REVISADA
**Status:** Proposta para Análise

---

## 📋 ÍNDICE

1. [Contexto Geral](#contexto-geral)
2. [Arquitetura Atual do Sistema](#arquitetura-atual-do-sistema)
3. [Apps Propostos](#apps-propostos)
4. [Estrutura de Implementação](#estrutura-de-implementação)
5. [Modelos de Dados](#modelos-de-dados)
6. [Rotas e APIs](#rotas-e-apis)
7. [Fluxo de Trabalho](#fluxo-de-trabalho)
8. [Cronograma e Etapas](#cronograma-e-etapas)
9. [Considerações Técnicas](#considerações-técnicas)
10. [Próximos Passos](#próximos-passos)

---

## 1. CONTEXTO GERAL

### 1.1 Visão Geral do Projeto

O DigiUrban é uma plataforma municipal integrada que já possui uma arquitetura consolidada com:
- ✅ Sistema de protocolos unificado
- ✅ Workflows configuráveis
- ✅ Módulos de Saúde parcialmente implementados
- ✅ Backend Node.js + Express + Prisma + PostgreSQL
- ✅ Frontend Next.js/React

### 1.2 Objetivo desta Proposta

Implementar **3 apps completos** para a Secretaria de Saúde, com:
- Páginas próprias no frontend
- APIs dedicadas no backend
- Tabelas específicas no banco de dados
- Persistência independente de dados
- Integração com o sistema de protocolos central

### 1.3 Apps a Implementar

| ID | Nome do App | Funcionalidades Principais | Status Atual |
|----|-------------|----------------------------|--------------|
| **APP-SAUDE-01** | Sistema Integrado de Atendimento | Unidades, profissionais, agendamento, fila, prontuário completo, triagem, consultas, prescrições, exames, atestados | 🟡 Parcial |
| **APP-SAUDE-02** | Farmácia Municipal | Medicamentos, estoque, dispensação | 🟡 Parcial |
| **APP-SAUDE-03** | TFD - Tratamento Fora Domicílio | Solicitações, regulação, viagens, prestação de contas | 🟡 Parcial |

**Legenda:**
🟢 Implementado | 🟡 Parcialmente Implementado | 🔴 Não Implementado

**MUDANÇA IMPORTANTE:**
✅ **APP-SAUDE-01** e **APP-SAUDE-02** foram **unificados** em um único **Sistema Integrado de Atendimento**
✅ Mantém **TODAS as funcionalidades** dos dois apps originais
✅ Fluxo natural: Agendamento → Fila → Atendimento → Prontuário → Prescrição

---

## 2. ARQUITETURA ATUAL DO SISTEMA

### 2.1 Stack Tecnológico

```
Backend:
├── Node.js 18+
├── Express 5.1.0
├── Prisma 6.19.0 (ORM)
├── PostgreSQL 14+
├── JWT (autenticação)
├── Winston (logging)
└── Socket.io (WebSocket)

Frontend:
├── Next.js
├── React
├── TypeScript
└── Axios (HTTP)
```

### 2.2 Estrutura de Diretórios

```
digiurban/
├── backend/
│   ├── src/
│   │   ├── routes/          # Endpoints da API (71+ arquivos)
│   │   ├── services/        # Lógica de negócio por módulo
│   │   ├── middleware/      # Autenticação, validação
│   │   ├── utils/           # Funções auxiliares
│   │   └── index.ts         # Ponto de entrada
│   └── prisma/
│       └── schema.prisma    # Modelos de dados (90+ modelos)
│
└── frontend/
    └── src/
        ├── components/      # Componentes React
        ├── services/        # Chamadas API
        └── types/           # Definições TypeScript
```

### 2.3 Modelos de Dados Existentes (Saúde)

#### ✅ Já Implementados

| Modelo | Função | Status |
|--------|--------|--------|
| `UnidadeSaude` | Cadastro de UBS, UPA, Hospitais | ✅ Completo |
| `ProfissionalSaude` | Médicos, Enfermeiros | ✅ Completo |
| `AgendaMedica` | Configuração de agendas | ✅ Completo |
| `ConsultaAgendada` | Consultas marcadas | ✅ Completo |
| `AtendimentoMedico` | Atendimentos | ✅ Completo |
| `TriagemEnfermagem` | Avaliação de enfermagem | ✅ Completo |
| `ConsultaMedica` | Consultas realizadas | ✅ Completo |
| `Prescricao` | Receitas médicas | ✅ Completo |
| `ExameSolicitado` | Solicitações de exames | ✅ Completo |
| `Atestado` | Atestados médicos | ✅ Completo |
| `Encaminhamento` | Encaminhamentos | ✅ Completo |
| `Medicamento` | Catálogo de medicamentos | ✅ Completo |
| `EstoqueMedicamento` | Controle de estoque | ✅ Completo |
| `DispensacaoMedicamento` | Distribuição | ✅ Completo |
| `SolicitacaoTFD` | Solicitações TFD | ✅ Completo |
| `ViagemTFD` | Viagens TFD | ✅ Completo |
| `VeiculoTFD` | Veículos TFD | ✅ Completo |
| `MotoristaTFD` | Motoristas TFD | ✅ Completo |
| `DestinoTFD` | Destinos permitidos TFD | ✅ Completo |

#### ⚠️ Necessitam Expansão ou Criação

Os modelos básicos existem, mas será necessário:
- **Novos campos** para completar as funcionalidades
- **Novos modelos auxiliares** (ex: Fila de Atendimento, Chamadas)
- **Relacionamentos adicionais** entre modelos
- **Modelos de logs e auditoria** específicos

### 2.4 Sistema de Protocolos Unificado

O DigiUrban utiliza o modelo **ProtocolSimplified** como integrador central:

```typescript
ProtocolSimplified {
  id: string
  number: string              // Número sequencial
  title: string
  status: ProtocolStatus
  citizenId: string
  serviceId: string
  departmentId: string
  moduleType: string          // 'SAUDE', 'EDUCACAO', etc
  customData: Json            // Dados específicos do módulo
  currentStageId: string
  // Relacionamentos:
  history[]
  interactions[]
  documentFiles[]
  stages[]
  pendings[]
}
```

**Fluxo de Status:**
```
VINCULADO → AGUARDANDO_DADOS → COM_DADOS → EM_PROCESSAMENTO
  → PRONTO_PARA_RETIRADA → RETIRADO → CONCLUIDO
```

---

## 3. APPS PROPOSTOS

### 3.1 APP-SAUDE-01: Sistema Integrado de Atendimento

#### 3.1.1 Descrição
Sistema completo e integrado que gerencia **todo o fluxo de atendimento na saúde**, desde o agendamento até o prontuário eletrônico, unificando:
- Gestão de unidades e profissionais
- Agendamento online
- Sistema de filas e chamadas
- Prontuário eletrônico completo
- Triagem de enfermagem
- Consultas médicas
- Prescrições
- Solicitação de exames
- Emissão de atestados e encaminhamentos

**JUSTIFICATIVA DA UNIFICAÇÃO:**
✅ Fluxo natural de atendimento (agendamento → fila → triagem → consulta → prontuário)
✅ Elimina duplicação de código e interfaces
✅ Melhor experiência do usuário (tudo em um só lugar)
✅ Facilita integração e manutenção
✅ Reduz tempo de desenvolvimento

#### 3.1.2 Módulos Funcionais

**MÓDULO 1: Gestão de Unidades de Saúde**
- Cadastro de UBS, UPA, Hospital
- Dados de localização (endereço, coordenadas, mapa)
- Horários de funcionamento
- Especialidades oferecidas por unidade
- Capacidade de atendimento
- Status (ativa/inativa/manutenção)
- Histórico de modificações

**MÓDULO 2: Gestão de Profissionais de Saúde**
- Dados pessoais do profissional
- Tipo (Médico, Enfermeiro, Técnico, Dentista, Psicólogo)
- Especialidade(s)
- Registro profissional (CRM/COREN/CRO/CRP)
- Unidades de atuação (vínculo múltiplo)
- Horários disponíveis por unidade
- Foto e assinatura digital

**MÓDULO 3: Configuração de Agendas Médicas**
- Criar agenda por profissional/unidade
- Definir horários de atendimento (dias da semana, horários)
- Configurar intervalo entre consultas (15, 20, 30 min)
- Definir capacidade (vagas por dia/turno)
- Marcar férias/licenças/indisponibilidades
- Bloquear/liberar horários específicos
- Configurar tipos de consulta (primeira vez, retorno, urgência)

**MÓDULO 4: Agendamento Online (Portal do Cidadão)**
- Busca de especialidades disponíveis
- Filtro por unidade, profissional, data
- Visualização de disponibilidades em calendário
- Agendamento de consulta (escolha de horário)
- Confirmação automática (SMS/Email/WhatsApp)
- Reagendamento (respeitando regras)
- Cancelamento (com prazo mínimo)
- Histórico de agendamentos

**MÓDULO 5: Sistema de Filas e Recepção**
- Check-in do paciente na unidade (QR Code ou CPF)
- Fila de espera organizada por especialidade
- Priorização automática (idosos 60+, gestantes, PCD, urgências)
- Status em tempo real (aguardando, chamado, em atendimento)
- Estimativa de tempo de espera
- Notificação ao profissional (nova chegada)
- Painel de controle da recepção

**MÓDULO 6: Painel de Chamadas (Display para TV)**
- Chamada de pacientes com nome e consultório
- Exibição em tela grande (sala de espera)
- Integração com sistema de som (opcional)
- Histórico de chamadas do dia
- Design acessível e legível
- Atualização em tempo real (WebSocket)

**MÓDULO 7: Prontuário Eletrônico Único**
- Prontuário único por cidadão (unificado)
- Visualização completa do histórico de saúde
- Busca por data, profissional, unidade, CID-10
- Anexos de documentos (exames, laudos, imagens)
- Registro de alergias e reações adversas
- Registro de comorbidades (doenças crônicas)
- Histórico de imunizações (cartão de vacina)
- Medicação de uso contínuo
- Timeline visual de eventos

**MÓDULO 8: Triagem de Enfermagem**
- Registro de sinais vitais:
  - Pressão Arterial (PA)
  - Frequência Cardíaca (FC)
  - Frequência Respiratória (FR)
  - Temperatura (T)
  - Saturação de Oxigênio (SpO2)
- Peso e altura (cálculo automático de IMC)
- Queixa principal do paciente
- Histórico de medicação em uso
- Alergias (alertas visuais)
- Observações de enfermagem
- Classificação de risco (protocolo de Manchester)

**MÓDULO 9: Consulta Médica Completa**
- Anamnese estruturada (história clínica)
- Exame físico por sistemas
- Hipótese diagnóstica (CID-10)
- Diagnóstico definitivo
- Plano terapêutico
- Conduta (medicamentosa, cirúrgica, acompanhamento)
- Observações clínicas
- Evolução do quadro (retornos)

**MÓDULO 10: Prescrições Médicas**
- Busca de medicamentos (banco padronizado TISS/ANVISA)
- Seleção de múltiplos medicamentos
- Posologia detalhada (dose, via, frequência, duração)
- Via de administração (oral, EV, IM, tópica)
- Observações de uso (tomar com água, evitar sol)
- Alertas de interação medicamentosa
- Assinatura digital do médico
- Impressão de receita (PDF/física)
- Envio digital para o cidadão
- Controle de receitas especiais (antibióticos, psicotrópicos)

**MÓDULO 11: Solicitação de Exames**
- Catálogo de exames disponíveis (laboratório, imagem)
- Seleção de múltiplos exames
- Justificativa clínica
- Prioridade (rotina, urgente, emergência)
- Upload de resultado (laudo)
- Notificação ao médico solicitante (quando resultado chega)
- Integração com laboratórios (futuro)

**MÓDULO 12: Emissão de Atestados Médicos**
- Template de atestado configurável
- Período de afastamento (dias)
- CID-10 (opcional, conforme necessidade)
- Motivo/Justificativa
- Assinatura digital do médico
- Impressão (PDF/física)
- Envio digital para o cidadão
- Registro no prontuário

**MÓDULO 13: Encaminhamentos para Especialistas**
- Encaminhamento para especialista/serviço
- Motivo do encaminhamento
- Resumo clínico relevante
- Exames anexados
- Prioridade (rotina, prioritário, urgente)
- Integração com sistema de regulação (SISREG)
- Acompanhamento do status

**MÓDULO 14: Portal do Cidadão - Saúde**
- Visualizar meu prontuário (histórico resumido)
- Acessar resultados de exames
- Baixar prescrições/receitas
- Baixar atestados
- Acompanhar encaminhamentos
- Histórico de consultas realizadas
- Próximas consultas agendadas

#### 3.1.3 Estrutura de Páginas Frontend

```
/admin/saude/atendimento/
├── /dashboard                 # Dashboard geral do atendimento
│
├── /unidades/
│   ├── /lista                 # Lista de unidades
│   ├── /nova                  # Cadastrar unidade
│   ├── /[id]                  # Detalhes da unidade
│   └── /[id]/editar           # Editar unidade
│
├── /profissionais/
│   ├── /lista                 # Lista de profissionais
│   ├── /novo                  # Cadastrar profissional
│   ├── /[id]                  # Detalhes do profissional
│   └── /[id]/editar           # Editar profissional
│
├── /agendas/
│   ├── /configurar            # Configuração de agendas
│   ├── /profissional/[id]     # Agenda de um profissional
│   ├── /unidade/[id]          # Agendas de uma unidade
│   ├── /visualizar            # Visualização geral (calendário)
│   └── /indisponibilidades    # Gerenciar férias/licenças
│
├── /agendamentos/
│   ├── /lista                 # Todas consultas agendadas
│   ├── /novo                  # Agendar manualmente
│   ├── /confirmar             # Confirmar consultas
│   └── /relatorios            # Relatórios de agendamento
│
├── /fila/
│   ├── /painel                # Painel de recepção (check-in)
│   ├── /chamadas              # Painel de chamadas (TV)
│   ├── /gerenciar             # Gerenciamento da fila
│   └── /historico             # Histórico de atendimentos do dia
│
├── /prontuario/
│   ├── /buscar                # Buscar paciente
│   ├── /[citizenId]/
│   │   ├── /visualizar        # Visualizar prontuário completo
│   │   ├── /historico         # Histórico de atendimentos
│   │   ├── /alergias          # Gerenciar alergias
│   │   ├── /comorbidades      # Gerenciar comorbidades
│   │   ├── /imunizacoes       # Cartão de vacina
│   │   ├── /documentos        # Anexos (exames, laudos)
│   │   └── /timeline          # Timeline visual
│
├── /atendimento/
│   ├── /iniciar               # Iniciar novo atendimento
│   ├── /em-andamento          # Atendimentos em andamento
│   ├── /[id]/
│   │   ├── /triagem           # Realizar triagem (enfermeiro)
│   │   ├── /consulta          # Consulta médica completa
│   │   ├── /prescricao        # Emitir prescrição
│   │   ├── /exames            # Solicitar exames
│   │   ├── /atestado          # Emitir atestado
│   │   ├── /encaminhar        # Criar encaminhamento
│   │   └── /finalizar         # Finalizar atendimento
│
├── /prescricoes/
│   ├── /lista                 # Lista de prescrições
│   ├── /[id]                  # Detalhes da prescrição
│   └── /[id]/pdf              # Visualizar/Imprimir PDF
│
├── /exames/
│   ├── /solicitados           # Exames solicitados
│   ├── /pendentes             # Aguardando resultado
│   ├── /resultados            # Com resultado
│   └── /[id]                  # Detalhes do exame
│
├── /atestados/
│   ├── /lista                 # Lista de atestados
│   ├── /[id]                  # Detalhes do atestado
│   └── /[id]/pdf              # Visualizar/Imprimir PDF
│
└── /encaminhamentos/
    ├── /lista                 # Lista de encaminhamentos
    ├── /pendentes             # Aguardando agendamento
    ├── /agendados             # Já agendados
    └── /[id]                  # Detalhes do encaminhamento

/cidadao/saude/
├── /agendar                   # Agendar consulta online
├── /consultas                 # Minhas consultas
├── /consultas/[id]/cancelar   # Cancelar consulta
├── /prontuario/
│   ├── /meu-prontuario        # Visualizar meu prontuário
│   ├── /historico             # Histórico de consultas
│   ├── /prescricoes           # Minhas receitas
│   ├── /exames                # Resultados de exames
│   ├── /atestados             # Meus atestados
│   └── /encaminhamentos       # Meus encaminhamentos
```

#### 3.1.4 APIs Principais

```
UNIDADES:
POST   /api/saude/atendimento/unidades                    # Criar unidade
GET    /api/saude/atendimento/unidades                    # Listar unidades
GET    /api/saude/atendimento/unidades/:id                # Detalhes
PUT    /api/saude/atendimento/unidades/:id                # Atualizar
DELETE /api/saude/atendimento/unidades/:id                # Excluir

PROFISSIONAIS:
POST   /api/saude/atendimento/profissionais               # Criar profissional
GET    /api/saude/atendimento/profissionais               # Listar
GET    /api/saude/atendimento/profissionais/:id           # Detalhes
PUT    /api/saude/atendimento/profissionais/:id           # Atualizar
DELETE /api/saude/atendimento/profissionais/:id           # Excluir
GET    /api/saude/atendimento/profissionais/:id/agendas   # Agendas do profissional

AGENDAS:
POST   /api/saude/atendimento/agendas                     # Criar agenda
GET    /api/saude/atendimento/agendas/profissional/:id    # Agenda de profissional
GET    /api/saude/atendimento/agendas/unidade/:id         # Agendas de unidade
PUT    /api/saude/atendimento/agendas/:id                 # Atualizar
DELETE /api/saude/atendimento/agendas/:id                 # Excluir
GET    /api/saude/atendimento/agendas/disponibilidades    # Buscar horários disponíveis
POST   /api/saude/atendimento/agendas/indisponibilidade   # Marcar indisponibilidade

AGENDAMENTOS:
POST   /api/saude/atendimento/agendar                     # Agendar consulta
GET    /api/saude/atendimento/consultas                   # Listar consultas
GET    /api/saude/atendimento/consultas/cidadao/:id       # Consultas do cidadão
GET    /api/saude/atendimento/consultas/:id               # Detalhes da consulta
PUT    /api/saude/atendimento/consultas/:id/reagendar     # Reagendar
PUT    /api/saude/atendimento/consultas/:id/cancelar      # Cancelar
PUT    /api/saude/atendimento/consultas/:id/confirmar     # Confirmar

FILA:
POST   /api/saude/atendimento/fila/checkin                # Check-in do paciente
GET    /api/saude/atendimento/fila/unidade/:id            # Fila de uma unidade
GET    /api/saude/atendimento/fila/:id                    # Status na fila
POST   /api/saude/atendimento/fila/chamar                 # Chamar próximo
PUT    /api/saude/atendimento/fila/:id/status             # Atualizar status
GET    /api/saude/atendimento/fila/chamadas/:unidadeId    # Histórico de chamadas

PRONTUÁRIO:
GET    /api/saude/atendimento/prontuario/:citizenId       # Prontuário completo
GET    /api/saude/atendimento/prontuario/:citizenId/historico  # Histórico
GET    /api/saude/atendimento/prontuario/:citizenId/timeline   # Timeline
PUT    /api/saude/atendimento/prontuario/:citizenId/alergias   # Gerenciar alergias
PUT    /api/saude/atendimento/prontuario/:citizenId/comorbidades # Gerenciar comorbidades
GET    /api/saude/atendimento/prontuario/:citizenId/imunizacoes  # Cartão de vacina
POST   /api/saude/atendimento/prontuario/:citizenId/anexo      # Anexar documento

ATENDIMENTO:
POST   /api/saude/atendimento/iniciar                     # Iniciar atendimento
GET    /api/saude/atendimento/:id                         # Detalhes do atendimento
GET    /api/saude/atendimento/em-andamento                # Em andamento
PUT    /api/saude/atendimento/:id/triagem                 # Registrar triagem
PUT    /api/saude/atendimento/:id/consulta                # Registrar consulta
POST   /api/saude/atendimento/:id/finalizar               # Finalizar

PRESCRIÇÕES:
POST   /api/saude/atendimento/prescricao                  # Criar prescrição
GET    /api/saude/atendimento/prescricao/:id              # Detalhes
GET    /api/saude/atendimento/prescricao/:id/pdf          # Gerar PDF
GET    /api/saude/atendimento/prescricoes/cidadao/:id     # Prescrições do cidadão
GET    /api/saude/atendimento/prescricoes/atendimento/:id # Prescrições do atendimento

EXAMES:
POST   /api/saude/atendimento/exames/solicitar            # Solicitar exame
GET    /api/saude/atendimento/exames/:id                  # Detalhes
PUT    /api/saude/atendimento/exames/:id/resultado        # Upload resultado
GET    /api/saude/atendimento/exames/pendentes            # Exames pendentes
GET    /api/saude/atendimento/exames/cidadao/:id          # Exames do cidadão

ATESTADOS:
POST   /api/saude/atendimento/atestado                    # Emitir atestado
GET    /api/saude/atendimento/atestado/:id                # Detalhes
GET    /api/saude/atendimento/atestado/:id/pdf            # Gerar PDF
GET    /api/saude/atendimento/atestados/cidadao/:id       # Atestados do cidadão

ENCAMINHAMENTOS:
POST   /api/saude/atendimento/encaminhamento              # Criar encaminhamento
GET    /api/saude/atendimento/encaminhamento/:id          # Detalhes
PUT    /api/saude/atendimento/encaminhamento/:id/status   # Atualizar status
GET    /api/saude/atendimento/encaminhamentos/pendentes   # Pendentes
GET    /api/saude/atendimento/encaminhamentos/cidadao/:id # Encaminhamentos do cidadão
```

---

### 3.2 APP-SAUDE-02: Farmácia Municipal

#### 3.2.1 Descrição
Sistema de gestão de farmácias municipais, controle de estoque e dispensação de medicamentos.

#### 3.2.2 Funcionalidades Principais

**Módulo 1: Cadastro de Medicamentos**
- Nome comercial e genérico
- Princípio ativo
- Forma farmacêutica (comprimido, xarope, etc)
- Dosagem
- Laboratório
- Registro ANVISA
- Controle especial (antibiótico, psicotrópico)

**Módulo 2: Controle de Estoque por Unidade**
- Entrada de medicamentos (compra, doação)
- Lote e validade
- Quantidade em estoque
- Estoque mínimo
- Estoque de segurança
- Localização física (prateleira)

**Módulo 3: Dispensação de Receitas**
- Validação de receita (digital ou física)
- Dispensação por item
- Quantidade dispensada
- Atendente responsável
- Cidadão que recebeu
- Data e hora

**Módulo 4: Alertas de Reposição**
- Alerta de estoque baixo
- Medicamentos próximos ao vencimento
- Sugestão de pedido de compra
- Notificação ao gestor

**Módulo 5: Relatórios de Consumo**
- Consumo por medicamento
- Consumo por unidade
- Dispensações por período
- Medicamentos mais dispensados
- Projeção de necessidade

#### 3.2.3 Páginas Frontend

```
/admin/saude/farmacia/
├── /dashboard                 # Visão geral
├── /medicamentos/
│   ├── /lista                 # Lista de medicamentos
│   ├── /novo                  # Cadastrar medicamento
│   └── /[id]                  # Detalhes do medicamento
│
├── /estoque/
│   ├── /geral                 # Visão geral do estoque
│   ├── /unidade/[id]          # Estoque de uma unidade
│   ├── /entrada               # Registrar entrada
│   ├── /transferencia         # Transferir entre unidades
│   └── /inventario            # Realizar inventário
│
├── /dispensacao/
│   ├── /atender               # Atender paciente
│   ├── /historico             # Histórico de dispensações
│   └── /relatorio             # Relatório de dispensação
│
└── /alertas/
    ├── /estoque-baixo         # Medicamentos em falta
    ├── /vencimento            # Próximos ao vencimento
    └── /reposicao             # Sugestões de pedido
```

#### 3.2.4 APIs Principais

```
Medicamentos:
POST   /api/saude/farmacia/medicamentos       # Cadastrar
GET    /api/saude/farmacia/medicamentos       # Listar
GET    /api/saude/farmacia/medicamentos/:id   # Detalhes
PUT    /api/saude/farmacia/medicamentos/:id   # Atualizar
DELETE /api/saude/farmacia/medicamentos/:id   # Excluir

Estoque:
POST   /api/saude/farmacia/estoque/entrada    # Registrar entrada
GET    /api/saude/farmacia/estoque/unidade/:id  # Estoque de unidade
PUT    /api/saude/farmacia/estoque/transferir # Transferir
GET    /api/saude/farmacia/estoque/geral      # Visão geral

Dispensação:
POST   /api/saude/farmacia/dispensar          # Dispensar medicamento
GET    /api/saude/farmacia/dispensacoes       # Histórico
GET    /api/saude/farmacia/dispensacoes/:prescricaoId  # Por receita
GET    /api/saude/farmacia/dispensacoes/cidadao/:id    # Por cidadão

Alertas:
GET    /api/saude/farmacia/alertas/estoque-baixo  # Estoque baixo
GET    /api/saude/farmacia/alertas/vencimento     # Próximos vencimento
GET    /api/saude/farmacia/alertas/reposicao      # Sugestões

Relatórios:
GET    /api/saude/farmacia/relatorios/consumo     # Consumo geral
GET    /api/saude/farmacia/relatorios/top-medicamentos  # Mais dispensados
GET    /api/saude/farmacia/relatorios/projecao    # Projeção de necessidade
```

---

### 3.3 APP-SAUDE-03: TFD - Tratamento Fora do Domicílio

#### 3.3.1 Descrição
Sistema completo para gerenciar tratamentos fora do município, desde a solicitação até a prestação de contas.

#### 3.3.2 Funcionalidades Principais

**Módulo 1: Solicitação e Análise Documental**
- Formulário de solicitação
- Upload de documentos (laudo médico, exames)
- Dados do cidadão
- Destino (cidade, hospital)
- Especialidade
- Justificativa médica
- Acompanhante (se necessário)
- Validação documental

**Módulo 2: Regulação Médica**
- Análise da solicitação
- Validação da necessidade
- Parecer médico
- Aprovação/Reprovação
- Solicitação de documentos adicionais
- Encaminhamento para gestão

**Módulo 3: Aprovação de Gestão**
- Análise financeira
- Disponibilidade de recursos
- Autorização final
- Definição de recurso (transporte, hospedagem)
- Notificação ao cidadão

**Módulo 4: Agendamento de Consultas Externas**
- Contato com unidade de destino
- Data e hora do atendimento
- Confirmação de agendamento
- Notificação ao cidadão

**Módulo 5: Gestão de Veículos e Motoristas**
- Cadastro de veículos TFD
- Tipo de veículo (ambulância, van, ônibus)
- Capacidade (número de passageiros)
- Status (disponível, manutenção)
- Cadastro de motoristas
- CNH e categoria
- Disponibilidade

**Módulo 6: Montagem Automática de Lista de Passageiros**
- Listar viagens aprovadas para mesma data/destino
- Agrupar automaticamente
- Sugerir veículo por capacidade
- Otimizar rotas

**Módulo 7: Seleção de Veículos por Capacidade**
- Verificar número de passageiros
- Sugerir veículo adequado
- Verificar disponibilidade
- Alocar veículo e motorista

**Módulo 8: Execução de Viagens**
- Registro de saída
- Lista de passageiros confirmados
- Checklist de veículo
- Registro de chegada
- Ocorrências durante viagem

**Módulo 9: Prestação de Contas**
- Registro de combustível (litros, valor)
- Pedágios (quantidade, valor)
- Alimentação (refeições)
- Hospedagem (diárias)
- Outros custos
- Anexos de comprovantes
- Aprovação financeira

#### 3.3.3 Páginas Frontend

```
/admin/saude/tfd/
├── /dashboard                 # Visão geral do TFD
│
├── /solicitacoes/
│   ├── /lista                 # Todas solicitações
│   ├── /nova                  # Nova solicitação
│   ├── /[id]                  # Detalhes da solicitação
│   ├── /[id]/documentos       # Documentos anexados
│   └── /[id]/analise          # Análise documental
│
├── /regulacao/
│   ├── /pendentes             # Aguardando regulação
│   ├── /[id]/analisar         # Análise médica
│   └── /historico             # Histórico de pareceres
│
├── /gestao/
│   ├── /pendentes             # Aguardando aprovação
│   ├── /[id]/aprovar          # Aprovar/Reprovar
│   └── /aprovadas             # Aprovadas
│
├── /agendamentos/
│   ├── /lista                 # Agendamentos externos
│   ├── /[id]/agendar          # Agendar consulta
│   └── /confirmados           # Confirmados
│
├── /veiculos/
│   ├── /lista                 # Lista de veículos
│   ├── /novo                  # Cadastrar veículo
│   └── /[id]                  # Detalhes do veículo
│
├── /motoristas/
│   ├── /lista                 # Lista de motoristas
│   ├── /novo                  # Cadastrar motorista
│   └── /[id]                  # Detalhes do motorista
│
├── /viagens/
│   ├── /planejamento          # Planejamento de viagens
│   ├── /agrupar               # Agrupar passageiros
│   ├── /[id]                  # Detalhes da viagem
│   ├── /[id]/executar         # Executar viagem
│   ├── /[id]/passageiros      # Lista de passageiros
│   └── /historico             # Histórico de viagens
│
└── /prestacao-contas/
    ├── /pendentes             # Aguardando prestação
    ├── /[id]/prestar          # Prestar contas
    ├── /[id]/aprovar          # Aprovar contas
    └── /historico             # Histórico de prestações

/cidadao/saude/tfd/
├── /solicitar                 # Solicitar TFD
├── /minhas-solicitacoes       # Minhas solicitações
└── /[id]                      # Detalhes da solicitação
```

#### 3.3.4 APIs Principais

```
Solicitações:
POST   /api/saude/tfd/solicitacoes            # Criar solicitação
GET    /api/saude/tfd/solicitacoes            # Listar
GET    /api/saude/tfd/solicitacoes/:id        # Detalhes
PUT    /api/saude/tfd/solicitacoes/:id        # Atualizar
POST   /api/saude/tfd/solicitacoes/:id/documentos  # Upload documento

Regulação:
GET    /api/saude/tfd/regulacao/pendentes     # Pendentes
POST   /api/saude/tfd/regulacao/:id/analisar  # Analisar
PUT    /api/saude/tfd/regulacao/:id/parecer   # Emitir parecer

Gestão:
GET    /api/saude/tfd/gestao/pendentes        # Pendentes
POST   /api/saude/tfd/gestao/:id/aprovar      # Aprovar
POST   /api/saude/tfd/gestao/:id/reprovar     # Reprovar

Agendamentos:
POST   /api/saude/tfd/agendamentos            # Criar agendamento
GET    /api/saude/tfd/agendamentos/:id        # Detalhes
PUT    /api/saude/tfd/agendamentos/:id        # Atualizar

Veículos:
POST   /api/saude/tfd/veiculos                # Cadastrar
GET    /api/saude/tfd/veiculos                # Listar
GET    /api/saude/tfd/veiculos/:id            # Detalhes
PUT    /api/saude/tfd/veiculos/:id            # Atualizar
GET    /api/saude/tfd/veiculos/disponiveis    # Disponíveis

Motoristas:
POST   /api/saude/tfd/motoristas              # Cadastrar
GET    /api/saude/tfd/motoristas              # Listar
GET    /api/saude/tfd/motoristas/:id          # Detalhes
PUT    /api/saude/tfd/motoristas/:id          # Atualizar
GET    /api/saude/tfd/motoristas/disponiveis  # Disponíveis

Viagens:
POST   /api/saude/tfd/viagens                 # Criar viagem
GET    /api/saude/tfd/viagens                 # Listar
GET    /api/saude/tfd/viagens/:id             # Detalhes
POST   /api/saude/tfd/viagens/agrupar         # Agrupar passageiros
POST   /api/saude/tfd/viagens/:id/executar    # Executar viagem
PUT    /api/saude/tfd/viagens/:id/finalizar   # Finalizar

Prestação de Contas:
POST   /api/saude/tfd/prestacao-contas        # Criar prestação
GET    /api/saude/tfd/prestacao-contas/:id    # Detalhes
PUT    /api/saude/tfd/prestacao-contas/:id    # Atualizar
POST   /api/saude/tfd/prestacao-contas/:id/aprovar  # Aprovar
POST   /api/saude/tfd/prestacao-contas/:id/anexo    # Anexar comprovante
```

---

## 4. ESTRUTURA DE IMPLEMENTAÇÃO

### 4.1 Padrão de Organização

#### Backend

```
backend/src/
├── services/
│   ├── atendimento/                    # APP-SAUDE-01 (UNIFICADO)
│   │   ├── unidades.service.ts
│   │   ├── profissionais.service.ts
│   │   ├── agenda.service.ts
│   │   ├── agendamento.service.ts
│   │   ├── fila.service.ts
│   │   ├── prontuario.service.ts
│   │   ├── atendimento.service.ts
│   │   ├── prescricao.service.ts
│   │   ├── exames.service.ts
│   │   ├── atestado.service.ts
│   │   ├── encaminhamento.service.ts
│   │   └── index.ts
│   │
│   ├── farmacia/
│   │   ├── medicamentos.service.ts
│   │   ├── estoque.service.ts
│   │   ├── dispensacao.service.ts
│   │   └── index.ts
│   │
│   └── tfd/
│       ├── solicitacoes.service.ts
│       ├── regulacao.service.ts
│       ├── viagens.service.ts
│       ├── veiculos.service.ts
│       └── index.ts
│
├── routes/
│   ├── saude-atendimento.routes.ts     # Todas rotas do APP-01
│   ├── saude-farmacia.routes.ts
│   └── saude-tfd.routes.ts
│
└── types/
    ├── saude-atendimento.types.ts
    ├── saude-farmacia.types.ts
    └── saude-tfd.types.ts
```

#### Frontend

```
frontend/src/
├── components/
│   └── saude/
│       ├── atendimento/              # APP-SAUDE-01 (UNIFICADO)
│       │   ├── UnidadeForm.tsx
│       │   ├── UnidadesList.tsx
│       │   ├── ProfissionalForm.tsx
│       │   ├── AgendaConfig.tsx
│       │   ├── PainelFila.tsx
│       │   ├── PainelChamadas.tsx
│       │   ├── ProntuarioView.tsx
│       │   ├── TriagemForm.tsx
│       │   ├── ConsultaForm.tsx
│       │   ├── PrescricaoForm.tsx
│       │   ├── ExameForm.tsx
│       │   ├── AtestadoForm.tsx
│       │   └── EncaminhamentoForm.tsx
│       │
│       ├── farmacia/
│       │   ├── MedicamentoForm.tsx
│       │   ├── EstoqueView.tsx
│       │   └── DispensacaoForm.tsx
│       │
│       └── tfd/
│           ├── SolicitacaoForm.tsx
│           ├── RegulacaoView.tsx
│           ├── ViagemView.tsx
│           └── PrestacaoContasForm.tsx
│
└── pages/
    └── admin/
        └── saude/
            ├── atendimento/       # Todas páginas do APP-01
            ├── farmacia/
            └── tfd/
```

---

## 5. MODELOS DE DADOS

### 5.1 Novos Modelos Necessários

#### APP-SAUDE-01: Sistema Integrado de Atendimento

```prisma
// Já existe: UnidadeSaude, ProfissionalSaude, AgendaMedica, ConsultaAgendada,
//            AtendimentoMedico, TriagemEnfermagem, ConsultaMedica,
//            Prescricao, ExameSolicitado, Atestado, Encaminhamento

// NOVOS MODELOS:

model FilaAtendimento {
  id                String   @id @default(cuid())
  unidadeId         String
  consultaId        String   @unique
  ordem             Int
  prioridade        Int      @default(0)  // 0=Normal, 1=Preferencial, 2=Urgente
  status            FilaStatus @default(AGUARDANDO)
  chamadaEm         DateTime?
  atendidoEm        DateTime?
  consultorio       String?
  observacoes       String?
  createdAt         DateTime @default(now())

  unidade           UnidadeSaude @relation(fields: [unidadeId], references: [id])
  consulta          ConsultaAgendada @relation(fields: [consultaId], references: [id])

  @@map("fila_atendimento")
}

enum FilaStatus {
  AGUARDANDO
  CHAMADO
  EM_ATENDIMENTO
  FINALIZADO
  CANCELADO
}

model ChamadaPainel {
  id                String   @id @default(cuid())
  unidadeId         String
  filaId            String
  consultorio       String
  nomePaciente      String
  mensagem          String?
  exibidoEm         DateTime @default(now())

  unidade           UnidadeSaude @relation(fields: [unidadeId], references: [id])
  fila              FilaAtendimento @relation(fields: [filaId], references: [id])

  @@map("chamada_painel")
}

model IndisponibilidadeAgenda {
  id                String   @id @default(cuid())
  agendaId          String
  profissionalId    String
  dataInicio        DateTime
  dataFim           DateTime
  motivo            String
  tipoIndisponibilidade TipoIndisponibilidade
  createdAt         DateTime @default(now())

  agenda            AgendaMedica @relation(fields: [agendaId], references: [id])
  profissional      ProfissionalSaude @relation(fields: [profissionalId], references: [id])

  @@map("indisponibilidade_agenda")
}

enum TipoIndisponibilidade {
  FERIAS
  LICENCA
  TREINAMENTO
  REUNIAO
  OUTRO
}

model AlergiasCidadao {
  id                String   @id @default(cuid())
  citizenId         String
  alergia           String
  gravidade         GravidadeAlergia
  observacoes       String?
  dataRegistro      DateTime @default(now())
  usuarioRegistro   String

  citizen           Citizen @relation(fields: [citizenId], references: [id])
  usuario           User @relation(fields: [usuarioRegistro], references: [id])

  @@map("alergias_cidadao")
}

enum GravidadeAlergia {
  LEVE
  MODERADA
  GRAVE
}

model ComorbidadesCidadao {
  id                String   @id @default(cuid())
  citizenId         String
  cid10             String
  descricao         String
  dataInicio        DateTime?
  dataFim           DateTime?
  ativo             Boolean  @default(true)
  observacoes       String?
  dataRegistro      DateTime @default(now())
  usuarioRegistro   String

  citizen           Citizen @relation(fields: [citizenId], references: [id])
  usuario           User @relation(fields: [usuarioRegistro], references: [id])

  @@map("comorbidades_cidadao")
}

model AnexoProntuario {
  id                String   @id @default(cuid())
  citizenId         String
  atendimentoId     String?
  tipoDocumento     TipoDocumentoAnexo
  nomeArquivo       String
  caminhoArquivo    String
  tamanho           Int
  mimeType          String
  descricao         String?
  dataUpload        DateTime @default(now())
  usuarioUpload     String

  citizen           Citizen @relation(fields: [citizenId], references: [id])
  atendimento       AtendimentoMedico? @relation(fields: [atendimentoId], references: [id])
  usuario           User @relation(fields: [usuarioUpload], references: [id])

  @@map("anexo_prontuario")
}

enum TipoDocumentoAnexo {
  EXAME
  LAUDO
  RECEITA
  ATESTADO
  ENCAMINHAMENTO
  IMAGEM
  OUTRO
}

model ImunizacaoCidadao {
  id                String   @id @default(cuid())
  citizenId         String
  vacina            String
  dose              String
  lote              String?
  dataAplicacao     DateTime
  unidadeId         String?
  profissionalId    String?
  observacoes       String?

  citizen           Citizen @relation(fields: [citizenId], references: [id])
  unidade           UnidadeSaude? @relation(fields: [unidadeId], references: [id])
  profissional      ProfissionalSaude? @relation(fields: [profissionalId], references: [id])

  @@map("imunizacao_cidadao")
}
```

#### APP-SAUDE-02: Farmácia

```prisma
// Já existe: Medicamento, EstoqueMedicamento, DispensacaoMedicamento

// NOVOS MODELOS:

model LoteMedicamento {
  id                String   @id @default(cuid())
  medicamentoId     String
  lote              String
  dataFabricacao    DateTime
  dataValidade      DateTime
  quantidade        Int
  unidadeId         String
  fornecedor        String?
  notaFiscal        String?
  dataEntrada       DateTime @default(now())
  usuarioRegistro   String

  medicamento       Medicamento @relation(fields: [medicamentoId], references: [id])
  unidade           UnidadeSaude @relation(fields: [unidadeId], references: [id])
  usuario           User @relation(fields: [usuarioRegistro], references: [id])

  @@map("lote_medicamento")
}

model TransferenciaEstoque {
  id                String   @id @default(cuid())
  medicamentoId     String
  unidadeOrigemId   String
  unidadeDestinoId  String
  quantidade        Int
  motivo            String?
  status            StatusTransferencia @default(PENDENTE)
  dataSolicitacao   DateTime @default(now())
  dataConfirmacao   DateTime?
  usuarioSolicitante String
  usuarioConfirmante String?

  medicamento       Medicamento @relation(fields: [medicamentoId], references: [id])
  unidadeOrigem     UnidadeSaude @relation("UnidadeOrigem", fields: [unidadeOrigemId], references: [id])
  unidadeDestino    UnidadeSaude @relation("UnidadeDestino", fields: [unidadeDestinoId], references: [id])
  usuarioSolic      User @relation("UsuarioSolicitante", fields: [usuarioSolicitante], references: [id])
  usuarioConf       User? @relation("UsuarioConfirmante", fields: [usuarioConfirmante], references: [id])

  @@map("transferencia_estoque")
}

enum StatusTransferencia {
  PENDENTE
  APROVADA
  REJEITADA
  FINALIZADA
}

model AlertaEstoque {
  id                String   @id @default(cuid())
  medicamentoId     String
  unidadeId         String
  tipoAlerta        TipoAlertaEstoque
  mensagem          String
  quantidadeAtual   Int
  quantidadeMinima  Int?
  dataVencimento    DateTime?
  visualizado       Boolean  @default(false)
  dataGeracao       DateTime @default(now())

  medicamento       Medicamento @relation(fields: [medicamentoId], references: [id])
  unidade           UnidadeSaude @relation(fields: [unidadeId], references: [id])

  @@map("alerta_estoque")
}

enum TipoAlertaEstoque {
  ESTOQUE_BAIXO
  ESTOQUE_CRITICO
  VENCIMENTO_PROXIMO
  VENCIDO
}
```

#### APP-SAUDE-03: TFD

```prisma
// Já existe: SolicitacaoTFD, ViagemTFD, VeiculoTFD, MotoristaTFD, DestinoTFD

// NOVOS MODELOS:

model DocumentoTFD {
  id                String   @id @default(cuid())
  solicitacaoId     String
  tipoDocumento     TipoDocumentoTFD
  nomeArquivo       String
  caminhoArquivo    String
  tamanho           Int
  mimeType          String
  dataUpload        DateTime @default(now())
  usuarioUpload     String

  solicitacao       SolicitacaoTFD @relation(fields: [solicitacaoId], references: [id])
  usuario           User @relation(fields: [usuarioUpload], references: [id])

  @@map("documento_tfd")
}

enum TipoDocumentoTFD {
  LAUDO_MEDICO
  PEDIDO_MEDICO
  EXAMES
  RG
  CPF
  CARTAO_SUS
  COMPROVANTE_RESIDENCIA
  OUTRO
}

model ParecerRegulacaoTFD {
  id                String   @id @default(cuid())
  solicitacaoId     String
  medicoReguladorId String
  parecer           String
  status            StatusParecer
  observacoes       String?
  dataParecer       DateTime @default(now())

  solicitacao       SolicitacaoTFD @relation(fields: [solicitacaoId], references: [id])
  medicoRegulador   User @relation(fields: [medicoReguladorId], references: [id])

  @@map("parecer_regulacao_tfd")
}

enum StatusParecer {
  APROVADO
  REPROVADO
  PENDENTE_DOCUMENTACAO
}

model AprovacaoGestaoTFD {
  id                String   @id @default(cuid())
  solicitacaoId     String
  gestorId          String
  decisao           DecisaoGestao
  justificativa     String?
  recursosAprovados Json?  // { transporte: true, hospedagem: false, alimentacao: true }
  dataAprovacao     DateTime @default(now())

  solicitacao       SolicitacaoTFD @relation(fields: [solicitacaoId], references: [id])
  gestor            User @relation(fields: [gestorId], references: [id])

  @@map("aprovacao_gestao_tfd")
}

enum DecisaoGestao {
  APROVADO
  REPROVADO
  APROVADO_PARCIAL
}

model AgendamentoExternoTFD {
  id                String   @id @default(cuid())
  solicitacaoId     String
  hospitalDestino   String
  especialidade     String
  dataHoraConsulta  DateTime
  endereco          String?
  telefoneContato   String?
  confirmado        Boolean  @default(false)
  observacoes       String?
  dataAgendamento   DateTime @default(now())
  usuarioAgendamento String

  solicitacao       SolicitacaoTFD @relation(fields: [solicitacaoId], references: [id])
  usuario           User @relation(fields: [usuarioAgendamento], references: [id])

  @@map("agendamento_externo_tfd")
}

model PassageiroViagemTFD {
  id                String   @id @default(cuid())
  viagemId          String
  solicitacaoId     String
  citizenId         String
  acompanhante      Boolean  @default(false)
  nomeAcompanhante  String?
  cpfAcompanhante   String?
  statusEmbarque    StatusEmbarque @default(AGUARDANDO)
  observacoes       String?

  viagem            ViagemTFD @relation(fields: [viagemId], references: [id])
  solicitacao       SolicitacaoTFD @relation(fields: [solicitacaoId], references: [id])
  citizen           Citizen @relation(fields: [citizenId], references: [id])

  @@map("passageiro_viagem_tfd")
}

enum StatusEmbarque {
  AGUARDANDO
  EMBARCADO
  AUSENTE
  CANCELADO
}

model PrestacaoContasTFD {
  id                String   @id @default(cuid())
  viagemId          String   @unique
  combustivelLitros Float
  combustivelValor  Float
  pedagioQuantidade Int
  pedagioValor      Float
  alimentacaoValor  Float?
  hospedagemDiarias Int?
  hospedagemValor   Float?
  outrosCustos      Json?
  valorTotal        Float
  comprovantesAnexados Json?  // Array de caminhos de arquivos
  status            StatusPrestacao @default(PENDENTE)
  observacoes       String?
  dataPrestacao     DateTime @default(now())
  usuarioPrestacao  String
  dataAprovacao     DateTime?
  usuarioAprovacao  String?

  viagem            ViagemTFD @relation(fields: [viagemId], references: [id])
  usuarioPrest      User @relation("UsuarioPrestacao", fields: [usuarioPrestacao], references: [id])
  usuarioAprov      User? @relation("UsuarioAprovacao", fields: [usuarioAprovacao], references: [id])

  @@map("prestacao_contas_tfd")
}

enum StatusPrestacao {
  PENDENTE
  EM_ANALISE
  APROVADA
  REJEITADA
}
```

### 5.2 Relacionamentos com ProtocolSimplified

Todos os apps devem integrar-se com o sistema de protocolos:

```prisma
model SolicitacaoTFD {
  // ... campos existentes ...

  // ADICIONAR:
  protocolId        String?  @unique
  protocol          ProtocolSimplified? @relation(fields: [protocolId], references: [id])
}

model ConsultaAgendada {
  // ... campos existentes ...

  // ADICIONAR:
  protocolId        String?  @unique
  protocol          ProtocolSimplified? @relation(fields: [protocolId], references: [id])
}

model AtendimentoMedico {
  // ... campos existentes ...

  // ADICIONAR:
  protocolId        String?  @unique
  protocol          ProtocolSimplified? @relation(fields: [protocolId], references: [id])
}

model DispensacaoMedicamento {
  // ... campos existentes ...

  // ADICIONAR:
  protocolId        String?  @unique
  protocol          ProtocolSimplified? @relation(fields: [protocolId], references: [id])
}
```

---

## 6. FLUXO DE TRABALHO

### 6.1 Workflow Integrado de Atendimento (APP-SAUDE-01)

```
1. Agendamento Online (Cidadão)
   └─> GET /api/saude/atendimento/agendas/disponibilidades
   └─> POST /api/saude/atendimento/agendar
   └─> Cria ConsultaAgendada
   └─> Cria ProtocolSimplified (moduleType: 'SAUDE_CONSULTA')
   └─> Workflow: AGENDADA
   └─> Notificação: SMS/Email/WhatsApp

2. Check-in na Unidade (Recepção)
   └─> POST /api/saude/atendimento/fila/checkin
   └─> Cria FilaAtendimento
   └─> Calcula prioridade (idade, condição)
   └─> Workflow: CONFIRMADA → EM_ESPERA

3. Chamada para Atendimento (Recepção)
   └─> POST /api/saude/atendimento/fila/chamar
   └─> Cria ChamadaPainel
   └─> Exibição em TV (WebSocket)
   └─> Workflow: EM_ESPERA → CHAMADO

4. Iniciar Atendimento (Profissional)
   └─> POST /api/saude/atendimento/iniciar
   └─> Cria AtendimentoMedico
   └─> Vincula com ConsultaAgendada
   └─> Workflow: CHAMADO → ATENDIMENTO

5. Triagem de Enfermagem
   └─> PUT /api/saude/atendimento/:id/triagem
   └─> Cria TriagemEnfermagem
   └─> Registra sinais vitais
   └─> Classificação de risco
   └─> Workflow: ATENDIMENTO → TRIAGEM

6. Consulta Médica
   └─> PUT /api/saude/atendimento/:id/consulta
   └─> Cria ConsultaMedica
   └─> Anamnese, exame físico, diagnóstico
   └─> Workflow: TRIAGEM → CONSULTA

7. Prescrição (se necessário)
   └─> POST /api/saude/atendimento/prescricao
   └─> Cria Prescricao
   └─> Adiciona medicamentos
   └─> Gera PDF
   └─> Notificação ao cidadão

8. Solicitação de Exames (se necessário)
   └─> POST /api/saude/atendimento/exames/solicitar
   └─> Cria ExameSolicitado
   └─> Notificação ao cidadão

9. Emissão de Atestado (se necessário)
   └─> POST /api/saude/atendimento/atestado
   └─> Cria Atestado
   └─> Gera PDF
   └─> Notificação ao cidadão

10. Encaminhamento (se necessário)
   └─> POST /api/saude/atendimento/encaminhamento
   └─> Cria Encaminhamento
   └─> Integração com regulação

11. Finalizar Atendimento
   └─> POST /api/saude/atendimento/:id/finalizar
   └─> Workflow: CONSULTA → CONCLUIDO
   └─> Atualiza FilaAtendimento (status: FINALIZADO)
   └─> Registra no prontuário

12. Dispensação na Farmácia (se houver prescrição)
   └─> POST /api/saude/farmacia/dispensar
   └─> Valida receita
   └─> Atualiza estoque
   └─> Workflow: CONCLUIDO → MEDICAMENTO_RETIRADO
```

---

## 7. CRONOGRAMA E ETAPAS (REVISADO)

### 7.1 Etapas de Implementação Recomendadas

#### FASE 1: Preparação e Estrutura (1-2 dias)
- [ ] Criar estrutura de diretórios (services, routes, types)
- [ ] Definir todos os modelos Prisma
- [ ] Executar migrations
- [ ] Configurar registro de rotas
- [ ] Criar DTOs e interfaces TypeScript

#### FASE 2: APP-SAUDE-01 - Sistema Integrado de Atendimento (7-10 dias)

**ETAPA 2.1: Gestão de Unidades e Profissionais (2 dias)**
- [ ] Services: UnidadesService, ProfissionaisService
- [ ] Rotas de CRUD para unidades e profissionais
- [ ] Páginas de cadastro no frontend

**ETAPA 2.2: Agendamento e Fila (2 dias)**
- [ ] Services: AgendaService, AgendamentoService, FilaService
- [ ] Endpoint de busca de disponibilidades
- [ ] Endpoint de agendamento
- [ ] Sistema de fila (check-in, chamadas)
- [ ] Painel de chamadas (display TV)

**ETAPA 2.3: Prontuário e Atendimento (3-4 dias)**
- [ ] Services: ProntuarioService, AtendimentoService
- [ ] Rotas de prontuário (visualização, histórico, timeline)
- [ ] Rotas de atendimento (iniciar, triagem, consulta, finalizar)
- [ ] Páginas de prontuário completo
- [ ] Formulário de triagem e consulta

**ETAPA 2.4: Prescrições, Exames, Atestados (2-3 dias)**
- [ ] Services: PrescricaoService, ExamesService, AtestadoService, EncaminhamentoService
- [ ] Rotas de prescrição, exames, atestados, encaminhamentos
- [ ] Geração de PDFs
- [ ] Interfaces de prescrição e solicitação de exames
- [ ] Portal do cidadão (visualizar documentos)

**ETAPA 2.5: Integração e Testes (1 dia)**
- [ ] Integração com ProtocolSimplified
- [ ] Testes de fluxo completo
- [ ] Ajustes de UI/UX

#### FASE 3: APP-SAUDE-02 - Farmácia Municipal (3-5 dias)
**Backend:**
- [ ] Services: MedicamentosService, EstoqueService, DispensacaoService
- [ ] Rotas de medicamentos (CRUD)
- [ ] Rotas de estoque (entrada, transferência, consulta)
- [ ] Rotas de dispensação
- [ ] Sistema de alertas (estoque baixo, vencimento)
- [ ] Relatórios de consumo
- [ ] Integração com Prescricao (APP-01)

**Frontend:**
- [ ] Cadastro de medicamentos
- [ ] Gestão de estoque (entrada, transferência)
- [ ] Interface de dispensação
- [ ] Dashboard de alertas
- [ ] Relatórios de consumo

**Testes:**
- [ ] Testes de controle de estoque
- [ ] Testes de dispensação e atualização de estoque
- [ ] Validação de alertas

#### FASE 4: APP-SAUDE-03 - TFD (5-7 dias)
**Backend:**
- [ ] Services: SolicitacoesService, RegulacaoService, ViagensService, VeiculosService
- [ ] Rotas de solicitação (criar, upload documentos)
- [ ] Rotas de regulação (análise, parecer)
- [ ] Rotas de gestão (aprovação)
- [ ] Rotas de agendamento externo
- [ ] Rotas de veículos e motoristas
- [ ] Sistema de agrupamento de passageiros
- [ ] Rotas de viagens (criar, executar, finalizar)
- [ ] Rotas de prestação de contas
- [ ] Integração com ProtocolSimplified

**Frontend:**
- [ ] Formulário de solicitação TFD
- [ ] Interface de regulação médica
- [ ] Interface de aprovação de gestão
- [ ] Agendamento de consultas externas
- [ ] Cadastro de veículos e motoristas
- [ ] Planejamento de viagens (agrupamento automático)
- [ ] Execução de viagens (check-in passageiros)
- [ ] Prestação de contas
- [ ] Portal do cidadão (acompanhar solicitação)

**Testes:**
- [ ] Testes de fluxo completo de TFD
- [ ] Testes de agrupamento automático
- [ ] Testes de prestação de contas
- [ ] Validação de workflow complexo

#### FASE 5: Integração e Testes Finais (2-3 dias)
- [ ] Integração entre apps (Atendimento → Farmácia)
- [ ] Testes de ponta a ponta
- [ ] Testes de performance
- [ ] Validação de segurança
- [ ] Ajustes de UI/UX
- [ ] Documentação de APIs

#### FASE 6: Deploy e Documentação (1-2 dias)
- [ ] Preparar ambiente de produção
- [ ] Executar migrations em produção
- [ ] Deploy de backend e frontend
- [ ] Documentação de usuário
- [ ] Treinamento de equipe

### 7.2 Estimativa Total (REVISADA)

| Fase | Duração Estimada |
|------|------------------|
| FASE 1 - Preparação | 1-2 dias |
| FASE 2 - APP-SAUDE-01 (UNIFICADO) | 7-10 dias |
| FASE 3 - APP-SAUDE-02 (Farmácia) | 3-5 dias |
| FASE 4 - APP-SAUDE-03 (TFD) | 5-7 dias |
| FASE 5 - Integração | 2-3 dias |
| FASE 6 - Deploy | 1-2 dias |
| **TOTAL** | **19-29 dias** |

**Observações:**
- Estimativas assumem 1 desenvolvedor full-stack trabalhando em tempo integral
- Com equipe de 2-3 desenvolvedores, pode-se executar fases em paralelo (estimativa: 12-18 dias)
- A unificação dos apps 01 e 02 **não aumentou** o prazo (mantém 19-29 dias)
- Ajustes e feedback dos usuários podem adicionar tempo extra

---

## 8. CONSIDERAÇÕES TÉCNICAS

### 8.1 Performance

#### Banco de Dados
- Criar índices para campos frequentemente consultados:
  ```sql
  CREATE INDEX idx_consulta_agendada_data ON consulta_agendada(data_hora);
  CREATE INDEX idx_consulta_agendada_unidade ON consulta_agendada(unidade_id);
  CREATE INDEX idx_fila_atendimento_unidade ON fila_atendimento(unidade_id);
  CREATE INDEX idx_prontuario_citizen ON consulta_medica(citizen_id);
  CREATE INDEX idx_prescricao_atendimento ON prescricao(atendimento_id);
  CREATE INDEX idx_estoque_medicamento_unidade ON estoque_medicamento(unidade_id);
  CREATE INDEX idx_viagem_tfd_data ON viagem_tfd(data_viagem);
  ```

#### Cache
- Implementar cache para dados estáticos (medicamentos, unidades, profissionais):
  ```typescript
  import NodeCache from 'node-cache';
  const cache = new NodeCache({ stdTTL: 3600 }); // 1 hora
  ```

#### Paginação
- Implementar paginação em todas as listagens:
  ```typescript
  async listar(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    return await prisma.model.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }
  ```

#### WebSocket (Painel de Chamadas)
- Usar Socket.io para atualização em tempo real:
  ```typescript
  io.to(`unidade-${unidadeId}`).emit('nova-chamada', chamada);
  ```

### 8.2 Segurança

#### Autenticação
- JWT com expiração curta (1-2 horas)
- Refresh tokens para renovação
- Logout com invalidação de token

#### Autorização
- Role-Based Access Control (RBAC)
- Permissões granulares por módulo:
  - `SAUDE_ADMIN` - Acesso total
  - `SAUDE_MEDICO` - Prontuário, prescrições, atestados
  - `SAUDE_ENFERMEIRO` - Triagem, visualização de prontuário
  - `SAUDE_RECEPCAO` - Agendamento, fila
  - `SAUDE_FARMACEUTICO` - Farmácia
  - `SAUDE_TFD_REGULADOR` - Regulação TFD
  - `SAUDE_TFD_GESTOR` - Aprovação TFD

#### Validação de Entrada
- Validar todos os inputs com Joi/Zod
- Sanitizar dados antes de inserir no banco
- Prevenir SQL Injection (Prisma já protege)
- Prevenir XSS (sanitizar HTML)

#### Upload de Arquivos
- Validar tipo de arquivo (whitelist: PDF, JPG, PNG)
- Limitar tamanho de arquivo (5MB por arquivo)
- Salvar em diretório seguro (fora de public)
- Renomear arquivos com hash único (evitar colisões)

#### LGPD - Dados Sensíveis de Saúde
- Criptografar dados sensíveis em repouso
- Logs de acesso a prontuários (auditoria)
- Consentimento do cidadão para compartilhamento
- Direito ao esquecimento (exclusão de dados)

### 8.3 Auditoria

#### Logs Estruturados
```typescript
import { logger } from '@/config/logger';

logger.info('Consulta realizada', {
  userId: user.id,
  citizenId: citizen.id,
  atendimentoId: atendimento.id,
  timestamp: new Date()
});
```

#### Histórico de Alterações
- Usar ProtocolHistorySimplified para rastrear mudanças
- Registrar quem, quando e o que foi alterado
- Logs de acesso a prontuários (LGPD)

### 8.4 Notificações

#### Integração com Sistema de Mensagens
```typescript
// Notificar cidadão sobre agendamento
await notificationService.send({
  citizenId: citizen.id,
  type: 'SMS',
  message: `Sua consulta foi agendada para ${data} às ${hora} na ${unidade.nome}.`
});

// Notificar sobre resultado de exame
await notificationService.send({
  citizenId: citizen.id,
  type: 'EMAIL',
  subject: 'Resultado de Exame Disponível',
  message: `Seu exame está disponível no portal.`
});

// Notificar sobre alerta de estoque
await notificationService.send({
  userId: gestor.id,
  type: 'EMAIL',
  subject: 'Alerta de Estoque Baixo',
  message: `Medicamento ${medicamento.nome} está com estoque baixo na ${unidade.nome}.`
});
```

### 8.5 Relatórios

#### Geração de PDFs
```typescript
import { PDFDocument } from 'pdf-lib';

async function gerarPrescricaoPDF(prescricao: Prescricao) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  // ... adicionar cabeçalho
  // ... adicionar dados do paciente
  // ... adicionar medicamentos
  // ... adicionar assinatura digital
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
```

#### Exportação de Dados
- Implementar exportação para CSV/Excel
- Relatórios de agendamentos por período
- Relatórios de atendimentos por profissional/unidade
- Relatórios de consumo de medicamentos
- Relatórios financeiros de TFD

### 8.6 Integração com Sistemas Externos

#### Possíveis Integrações Futuras
- **e-SUS APS** - Sistema do Ministério da Saúde
- **SISREG** - Sistema Nacional de Regulação (encaminhamentos)
- **Hórus** - Sistema de Gestão de Assistência Farmacêutica
- **DATASUS** - Envio de dados para o Ministério da Saúde
- **Conecte SUS** - Carteira Digital de Saúde

---

## 9. PRÓXIMOS PASSOS

### 9.1 Decisões Necessárias

Antes de iniciar a implementação, é necessário definir:

1. **Aprovação da Unificação**
   - ✅ Aprovada a unificação dos apps 01 e 02?
   - ✅ 3 apps finais: Atendimento Integrado, Farmácia, TFD

2. **Priorização de Apps**
   - Qual app implementar primeiro?
   - Sugestão: APP-SAUDE-01 (Sistema Integrado de Atendimento)

3. **Recursos Disponíveis**
   - Quantos desenvolvedores?
   - Tempo disponível?
   - Infraestrutura (servidores, banco de dados)?

4. **Requisitos Específicos**
   - Há alguma funcionalidade específica não contemplada?
   - Há integrações obrigatórias com sistemas existentes?

5. **Aprovação de Arquitetura**
   - Esta proposta está alinhada com expectativas?
   - Há alguma mudança necessária na estrutura?

### 9.2 Ações Imediatas

1. **Revisar Proposta**
   - Analisar este documento
   - Identificar ajustes necessários
   - Aprovar estrutura proposta

2. **Preparar Ambiente**
   - Configurar ambiente de desenvolvimento
   - Preparar banco de dados
   - Configurar repositório Git

3. **Iniciar FASE 1**
   - Criar estrutura de diretórios
   - Definir modelos Prisma
   - Executar migrations

### 9.3 Pontos de Atenção

- **Complexidade do APP-01**: Sistema integrado, requer atenção ao fluxo completo
- **Integração Atendimento → Farmácia**: Prescrições devem fluir corretamente
- **Experiência do Usuário**: Priorizar interfaces simples e intuitivas
- **Performance do Painel de Chamadas**: WebSocket deve ser eficiente
- **Treinamento**: Equipes de saúde precisarão de treinamento adequado
- **Conformidade Legal**: Verificar requisitos da LGPD para dados de saúde

---

## 📝 RESUMO EXECUTIVO

### Apps Propostos (REVISADO)
✅ **3 apps completos** para Secretaria de Saúde (redução de 4 para 3)
✅ **APP-SAUDE-01**: Sistema Integrado de Atendimento (UNIFICADO)
✅ **APP-SAUDE-02**: Farmácia Municipal
✅ **APP-SAUDE-03**: TFD - Tratamento Fora do Domicílio

### Tecnologias
✅ **Backend:** Node.js + Express + Prisma + PostgreSQL
✅ **Frontend:** Next.js + React
✅ **Integração:** Sistema de Protocolos Unificado
✅ **Tempo Real:** Socket.io (Painel de Chamadas)

### Estrutura
✅ **Modelos de dados:** 90+ modelos (base) + 20+ novos modelos
✅ **APIs REST:** ~75 endpoints novos (redução por unificação)
✅ **Páginas Frontend:** ~55 páginas novas

### Prazo Estimado (MANTIDO)
✅ **19-29 dias** (1 desenvolvedor full-stack)
✅ **12-18 dias** (2-3 desenvolvedores em paralelo)

### Vantagens da Unificação
✅ Fluxo natural de atendimento (agendamento → fila → consulta → prontuário)
✅ Elimina duplicação de código e interfaces
✅ Melhor experiência do usuário (tudo em um só lugar)
✅ Facilita integração e manutenção
✅ Mantém todas as funcionalidades dos dois apps originais

### Próximo Passo
🎯 **Aguardando aprovação e instruções para iniciar implementação**

---

**Documento gerado em:** 28/01/2026
**Autor:** Claude (Assistente IA)
**Versão:** 2.0 - REVISADA (Unificação APP-01 e APP-02)
