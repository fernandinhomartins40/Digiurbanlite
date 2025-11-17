# 📊 FLUXOGRAMAS - Motor de Protocolos

## Índice
1. [Fluxo de Criação de Protocolo](#fluxo-de-criação-de-protocolo)
2. [Fluxo de Tramitação](#fluxo-de-tramitação)
3. [Fluxo de Aprovação/Rejeição](#fluxo-de-aprovaçãorejeição)
4. [Diagrama de Estados](#diagrama-de-estados)
5. [Arquitetura de Componentes](#arquitetura-de-componentes)

---

## 📝 Fluxo de Criação de Protocolo

```mermaid
sequenceDiagram
    participant C as Cidadão
    participant P as Portal
    participant API as API
    participant PS as ProtocolService
    participant PMS as ProtocolModuleService
    participant EH as EntityHandler
    participant WF as WorkflowService
    participant DB as Banco de Dados

    C->>P: Acessa serviço
    P->>C: Exibe formulário
    C->>P: Preenche dados
    P->>API: POST /api/protocols-simplified

    API->>API: Valida token
    API->>PMS: createProtocolWithModule()

    PMS->>DB: findOrCreateCitizen()
    DB-->>PMS: Citizen

    PMS->>DB: findService()
    DB-->>PMS: Service

    PMS->>PS: generateProtocolNumberSafe()

    Note over PS: 🔒 LOCK PESSIMISTA
    PS->>DB: SELECT ... FOR UPDATE
    DB-->>PS: lastProtocol
    PS->>PS: sequence = last + 1
    PS-->>PMS: "PROT-20251107-00001"

    PMS->>DB: BEGIN TRANSACTION
    PMS->>DB: CREATE ProtocolSimplified
    DB-->>PMS: protocol

    alt Serviço COM_DADOS
        PMS->>EH: entityHandlers[moduleType]()
        EH->>DB: CREATE HealthAttendance
        DB-->>EH: entity
        EH-->>PMS: entity
    end

    PMS->>DB: CREATE ProtocolHistory
    PMS->>DB: COMMIT TRANSACTION

    PMS->>WF: applyWorkflowToProtocol()
    WF->>DB: getWorkflowByModuleType()
    DB-->>WF: workflow

    loop Para cada stage do workflow
        WF->>DB: CREATE ProtocolStage
    end

    WF->>DB: CREATE ProtocolSLA
    WF-->>PMS: stages created

    PMS-->>API: {protocol, entity, hasModule}
    API-->>P: 201 Created
    P->>C: Exibe número do protocolo
```

---

## 🔄 Fluxo de Tramitação

```mermaid
graph TD
    A[Protocolo Criado] -->|Status: VINCULADO| B[Fila de Pendentes]
    B --> C[Servidor visualiza]
    C --> D{Atribui para si?}

    D -->|Sim| E[assignProtocol]
    D -->|Não| B

    E --> F[Status: EM_ANDAMENTO]
    F --> G[Etapa 1: Análise Documental]

    G --> H{Documentos OK?}
    H -->|Não| I[Solicita Documentos]
    I --> J[Cria ProtocolPending]
    J --> K[Cria ProtocolInteraction]
    K --> L[Aguarda Cidadão]
    L --> M{Cidadão respondeu?}
    M -->|Sim| H
    M -->|Não| N{Prazo expirou?}
    N -->|Sim| O[Marca como expirado]
    N -->|Não| L

    H -->|Sim| P[Completa Etapa 1]
    P --> Q[Etapa 2: Vistoria]

    Q --> R{Necessita Vistoria?}
    R -->|Sim| S[Agenda Vistoria]
    S --> T[Realiza Vistoria]
    T --> U[Upload Relatório]
    U --> V[Completa Etapa 2]

    R -->|Não| W[Skip Etapa 2]
    W --> V

    V --> X[Etapa 3: Análise Técnica]
    X --> Y[Gerente Analisa]
    Y --> Z{Decisão}

    Z -->|Aprovar| AA[Approve Protocol]
    Z -->|Rejeitar| AB[Reject Protocol]
```

---

## ✅ Fluxo de Aprovação/Rejeição

```mermaid
flowchart TD
    Start[Gerente acessa protocolo] --> Check{Verificar Etapas}

    Check -->|Todas completas| Review[Revisar Dados]
    Check -->|Pendente| Wait[Aguardar Conclusão]

    Review --> Decision{Decisão}

    Decision -->|Aprovar| Approve[PUT /protocols/:id/approve]
    Decision -->|Rejeitar| Reject[PUT /protocols/:id/reject]

    Approve --> A1[Status = CONCLUIDO]
    A1 --> A2[concludedAt = now]
    A2 --> A3{Tem módulo?}

    A3 -->|Sim| A4[activateModuleEntity]
    A4 --> A5[Entidade.status = ACTIVE]
    A5 --> A6[Entidade.isActive = true]

    A3 -->|Não| A7[completeSLA]
    A6 --> A7

    A7 --> A8[Registra Histórico]
    A8 --> A9[Notifica Cidadão]
    A9 --> A10[Solicita Avaliação]
    A10 --> End1[FIM - Aprovado]

    Reject --> R1[Status = CANCELADO]
    R1 --> R2[Registra Motivo]
    R2 --> R3[completeSLA]
    R3 --> R4[Registra Histórico]
    R4 --> R5[Notifica Cidadão]
    R5 --> End2[FIM - Rejeitado]

    Wait --> Wait1[Servidor continua tramitação]
    Wait1 --> Check
```

---

## 🔄 Diagrama de Estados

```mermaid
stateDiagram-v2
    [*] --> VINCULADO: Protocolo Criado

    VINCULADO --> EM_ANDAMENTO: Servidor Atribui
    VINCULADO --> CANCELADO: Cidadão Cancela

    EM_ANDAMENTO --> EM_ANDAMENTO: Tramitação em Curso
    EM_ANDAMENTO --> CONCLUIDO: Gerente Aprova
    EM_ANDAMENTO --> CANCELADO: Gerente Rejeita

    CONCLUIDO --> [*]: Processo Finalizado
    CANCELADO --> [*]: Processo Encerrado

    note right of VINCULADO
        - Aguardando atribuição
        - Visível na fila de pendentes
        - SLA iniciado
    end note

    note right of EM_ANDAMENTO
        - Servidor atribuído
        - Etapas sendo executadas
        - Documentos sendo coletados
        - SLA monitorado
    end note

    note right of CONCLUIDO
        - Todas etapas completas
        - Entidade do módulo ativada
        - SLA finalizado
        - Avaliação solicitada
    end note

    note right of CANCELADO
        - Processo interrompido
        - Motivo registrado
        - SLA finalizado
        - Cidadão notificado
    end note
```

---

## 🏗️ Arquitetura de Componentes

```mermaid
graph TB
    subgraph "CAMADA DE APRESENTAÇÃO"
        Portal[Portal do Cidadão]
        Admin[Portal Admin]
    end

    subgraph "CAMADA DE API"
        Routes[Protocol Routes]
        Auth[Auth Middleware]
        Routes --> Auth
    end

    subgraph "CAMADA DE NEGÓCIO"
        PMS[ProtocolModuleService]
        PS[ProtocolSimplifiedService]
        WS[WorkflowService]
        SLAS[SLAService]

        subgraph "Sistemas Auxiliares"
            IS[InteractionService]
            DS[DocumentService]
            PeS[PendingService]
            StS[StageService]
        end
    end

    subgraph "CAMADA DE DADOS"
        EH[Entity Handlers]
        MM[Module Mapping]

        subgraph "Banco de Dados"
            Proto[ProtocolSimplified]
            Modules[Módulos Específicos]
            History[History & Tracking]
        end
    end

    Portal --> Routes
    Admin --> Routes

    Routes --> PMS
    Routes --> PS

    PMS --> PS
    PMS --> WS
    PMS --> EH

    PS --> IS
    PS --> DS
    PS --> PeS
    PS --> StS
    PS --> SLAS

    WS --> StS
    WS --> SLAS

    EH --> MM
    EH --> Modules

    PMS --> Proto
    PS --> Proto
    IS --> History
    DS --> History
    PeS --> History
    StS --> History
    SLAS --> History
```

---

## 📊 Fluxo de Geração de Número (Com Proteção)

```mermaid
sequenceDiagram
    participant R1 as Request 1
    participant R2 as Request 2
    participant R3 as Request 3
    participant Lock as Transaction Lock
    participant DB as Database

    par Requisições Simultâneas
        R1->>Lock: BEGIN TRANSACTION
        R2->>Lock: BEGIN TRANSACTION
        R3->>Lock: BEGIN TRANSACTION
    end

    Lock->>R1: ✅ Obtém lock
    Lock--xR2: ⏳ Aguarda...
    Lock--xR3: ⏳ Aguarda...

    R1->>DB: SELECT ... FOR UPDATE
    DB-->>R1: lastNumber = 00001
    R1->>R1: nextNumber = 00002
    R1->>DB: (prepara retorno)
    R1->>Lock: COMMIT

    Lock->>R2: ✅ Obtém lock
    Lock--xR3: ⏳ Aguarda...

    R2->>DB: SELECT ... FOR UPDATE
    DB-->>R2: lastNumber = 00002
    R2->>R2: nextNumber = 00003
    R2->>DB: (prepara retorno)
    R2->>Lock: COMMIT

    Lock->>R3: ✅ Obtém lock

    R3->>DB: SELECT ... FOR UPDATE
    DB-->>R3: lastNumber = 00003
    R3->>R3: nextNumber = 00004
    R3->>DB: (prepara retorno)
    R3->>Lock: COMMIT

    Note over R1,DB: ✅ Todos números únicos!
    Note over R1: PROT-20251107-00002
    Note over R2: PROT-20251107-00003
    Note over R3: PROT-20251107-00004
```

---

## 🔍 Fluxo de Consulta de Protocolos

```mermaid
graph LR
    A[Cliente] --> B{Role?}

    B -->|USER| C[Protocolos Atribuídos]
    B -->|MANAGER| D[Protocolos do Departamento]
    B -->|ADMIN| E[Todos Protocolos]

    C --> F[Aplicar Filtros]
    D --> F
    E --> F

    F --> G{Filtros}

    G -->|Status| H[WHERE status = ?]
    G -->|Prioridade| I[WHERE priority = ?]
    G -->|Busca| J[WHERE number LIKE ? OR title LIKE ?]
    G -->|Data| K[WHERE createdAt BETWEEN ? AND ?]

    H --> L[Combinar WHERE]
    I --> L
    J --> L
    K --> L

    L --> M[Aplicar Paginação]
    M --> N[OFFSET skip LIMIT take]
    N --> O[Incluir Relacionamentos]

    O --> P[JOIN citizen]
    O --> Q[JOIN service]
    O --> R[JOIN department]
    O --> S[JOIN assignedUser]

    P --> T[Retornar Resultado]
    Q --> T
    R --> T
    S --> T

    T --> U[protocols + pagination]
    U --> A
```

---

## 📈 Monitoramento de SLA

```mermaid
flowchart TD
    Start[Job Agendado: A cada hora] --> GetActive[Buscar Protocolos Ativos]

    GetActive --> Loop{Para cada protocolo}

    Loop --> GetSLA[Buscar SLA do protocolo]
    GetSLA --> Check{SLA exists?}

    Check -->|Não| Skip[Pular]
    Check -->|Sim| IsPaused{SLA pausado?}

    IsPaused -->|Sim| Skip
    IsPaused -->|Não| IsCompleted{Protocolo concluído?}

    IsCompleted -->|Sim| CompleteSLA[completeSLA]
    IsCompleted -->|Não| CheckDate{now > expectedEndDate?}

    CheckDate -->|Sim| MarkOverdue[Marcar como atrasado]
    CheckDate -->|Não| CheckNear{Próximo do vencimento?}

    MarkOverdue --> CalcDays[Calcular dias de atraso]
    CalcDays --> UpdateDB[Atualizar DB]
    UpdateDB --> SendAlert[Enviar alerta]

    CheckNear -->|Sim| SendWarning[Enviar aviso]
    CheckNear -->|Não| OK[OK]

    SendAlert --> Next[Próximo protocolo]
    SendWarning --> Next
    CompleteSLA --> Next
    OK --> Next
    Skip --> Next

    Next --> Loop

    Loop -->|Fim| Stats[Gerar Estatísticas]
    Stats --> Report[Relatório de SLA]
    Report --> End[FIM]
```

---

## 🎯 Decisões de Roteamento

```mermaid
graph TD
    Start[Protocolo Criado] --> CheckType{serviceType?}

    CheckType -->|INFORMATIVO| Info[Sem Roteamento]
    CheckType -->|COM_DADOS| HasModule{tem moduleType?}

    Info --> CreateHistory[Registrar Histórico]

    HasModule -->|Não| Warn[⚠️ Warning: Serviço COM_DADOS sem moduleType]
    HasModule -->|Sim| CheckMapping{moduleType em MODULE_MAPPING?}

    CheckMapping -->|Não| Warn
    CheckMapping -->|Sim| IsInformative{isInformativeModule?}

    IsInformative -->|Sim| Info
    IsInformative -->|Não| GetEntity[getModuleEntity]

    GetEntity --> HasHandler{entityHandler existe?}

    HasHandler -->|Não| Error[❌ Erro: Handler não implementado]
    HasHandler -->|Sim| CreateEntity[Executar Entity Handler]

    CreateEntity --> EntityDB[CREATE no módulo]
    EntityDB --> LinkProtocol[Vincular protocolId]
    LinkProtocol --> UpdateMetadata[Atualizar customData]
    UpdateMetadata --> CreateHistory

    CreateHistory --> ApplyWorkflow{Tem workflow?}

    ApplyWorkflow -->|Sim| CreateStages[Criar Etapas]
    ApplyWorkflow -->|Não| GenericWorkflow{Tem workflow genérico?}

    GenericWorkflow -->|Sim| CreateStages
    GenericWorkflow -->|Não| NoWorkflow[Sem Workflow]

    CreateStages --> CreateSLA[Criar SLA]
    NoWorkflow --> End1[FIM]
    CreateSLA --> End2[FIM]

    Warn --> CreateHistory
    Error --> End3[FIM com Erro]
```

---

**Última atualização**: 07/11/2025
**Versão**: 2.0.0
