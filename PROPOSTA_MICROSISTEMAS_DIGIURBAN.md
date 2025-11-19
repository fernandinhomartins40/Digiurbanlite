# PROPOSTA DE MICROSISTEMAS PARA DIGIURBAN
## Análise de Viabilidade e Roadmap de Implementação

---

## SUMÁRIO EXECUTIVO

O DigiUrban possui uma base sólida com **25 tabelas auxiliares**, **13 secretarias** e **150+ serviços**. Esta proposta define **78 microsistemas** (6 por secretaria) que transformarão o sistema em uma plataforma completa de gestão municipal.

### Status Atual
- ✅ **18 tabelas seedadas** e prontas para uso
- ⚠️ **7 tabelas com schema** mas sem dados
- ❌ **Enums não dinâmicos** nos formulários (texto livre/hardcoded)
- ❌ **Sem CRUD admin** para tabelas auxiliares
- ✅ **Sistema de protocolos robusto** com vinculação de cidadãos

### Viabilidade Técnica
**ALTA** - Toda infraestrutura necessária já existe:
- Models Prisma definidos
- Sistema de rotas modular
- Frontend com componentes reutilizáveis
- API REST padronizada
- Autenticação e autorização implementadas

---

## MICROSISTEMA TRANSVERSAL (PRIORIDADE CRÍTICA)

### MS-00: GESTOR DE CADASTROS BASE
**Objetivo:** CRUD unificado para todas as 25 tabelas auxiliares

**Funcionalidades:**
1. Interface genérica de listagem (paginação, busca, filtros)
2. Formulários dinâmicos baseados no schema Prisma
3. Validações automáticas (unique, required, FK)
4. Import/Export CSV
5. Histórico de alterações (audit log)
6. Permissões por tabela (UserRole)

**Impacto:**
- Desbloqueia uso real das tabelas auxiliares
- Permite customização por município
- **Base obrigatória para todos os outros microsistemas**

**Rotas:**
```
GET    /api/admin/cadastros/:tableName
POST   /api/admin/cadastros/:tableName
PUT    /api/admin/cadastros/:tableName/:id
DELETE /api/admin/cadastros/:tableName/:id
```

**Páginas:**
```
/admin/microsistemas/cadastros-base/
├── unidades-saude/
├── especialidades-medicas/
├── programas-sociais/
├── [25 tabelas...]/
```

**Esforço:** 2-3 sprints | **ROI:** Alto - desbloqueia todo ecossistema

---

## SECRETARIA DE SAÚDE (6 Microsistemas)

### MS-01: Gestão de Unidades de Saúde
**Objetivo:** Gerenciamento completo de UBS, UPA, Hospitais, Clínicas

**Funcionalidades:**
1. CRUD de unidades (tipo, endereço, horários)
2. Associação de profissionais por unidade
3. Definição de especialidades oferecidas
4. Gestão de salas/consultórios
5. Configuração de capacidade (atendimentos/dia)
6. Dashboard de ocupação

**Tabelas:**
- `UnidadeSaude` (5+ seedadas)
- `ProfissionalSaude`
- `EspecialidadeMedica` (10+ seedadas)

**Integração com Serviços:**
- Agendamentos: filtrar unidades por especialidade
- Exames: listar unidades com equipamentos
- Medicamentos: controle de estoque por unidade

**Esforço:** 3 sprints

---

### MS-02: Agenda Médica Inteligente
**Objetivo:** Sistema de agendamento integrado com unidades e profissionais

**Funcionalidades:**
1. Calendário de disponibilidade por profissional
2. Agendamento automático (próxima vaga disponível)
3. Lista de espera por especialidade
4. Notificações de confirmação (SMS/email)
5. Check-in digital
6. Dashboard de no-show
7. Relatórios de produtividade médica

**Novas Tabelas:**
```prisma
model AgendaMedica {
  id              String   @id
  profissionalId  String
  unidadeId       String
  diaSemana       Int      // 1-7
  horaInicio      String   // "08:00"
  horaFim         String   // "12:00"
  tempoPorConsulta Int     // minutos
  vagasDisponiveis Int
  isActive        Boolean
}

model ConsultaAgendada {
  id              String   @id
  agendaId        String
  citizenId       String
  dataHora        DateTime
  status          ConsultaStatus // AGENDADA, CONFIRMADA, REALIZADA, FALTOU
  observacoes     String?
}
```

**Esforço:** 4 sprints

---

### MS-03: Prontuário Eletrônico do Paciente (PEP)
**Objetivo:** Registro digital de atendimentos médicos

**Funcionalidades:**
1. Histórico de consultas
2. Registro de diagnósticos (CID-10)
3. Prescrições médicas
4. Solicitação de exames
5. Vacinação (integração com SI-PNI)
6. Alergias e observações críticas
7. Dashboard de saúde do paciente

**Novas Tabelas:**
```prisma
model ProntuarioAtendimento {
  id                String   @id
  citizenId         String
  profissionalId    String
  unidadeId         String
  data              DateTime
  queixaPrincipal   String
  historiaDoenca    String?
  exameFisico       String?
  diagnosticos      Json     // Array de CIDs
  conduta           String?
  prescricoes       Json     // Array de medicamentos
  exameSolicitados  Json     // Array de exames
}
```

**Esforço:** 5 sprints

---

### MS-04: Sistema de Filas de Atendimento
**Objetivo:** Gestão de filas presenciais em tempo real

**Funcionalidades:**
1. Senha digital (por especialidade/profissional)
2. Painel de chamadas (TV)
3. Tempo médio de espera
4. Prioridades (gestantes, idosos, deficientes)
5. Dashboard de desempenho
6. Integração com check-in da agenda

**Novas Tabelas:**
```prisma
model FilaAtendimento {
  id           String   @id
  unidadeId    String
  especialidade String
  senhaAtual   Int
  ultimaChamada DateTime?
  tempoMedio   Int      // minutos
}

model SenhaAtendimento {
  id          String   @id
  filaId      String
  numero      Int
  citizenId   String?
  prioridade  Boolean
  status      FilaStatus // AGUARDANDO, CHAMADO, ATENDENDO, FINALIZADO
  horaEmissao DateTime
  horaChamada DateTime?
}
```

**Esforço:** 3 sprints

---

### MS-05: Gestão de Medicamentos e Farmácia
**Objetivo:** Controle de estoque e dispensação de medicamentos

**Funcionalidades:**
1. Cadastro de medicamentos (Catmat/RENAME)
2. Controle de estoque por unidade
3. Alertas de vencimento
4. Dispensação vinculada a prescrição
5. Relatórios de consumo
6. Solicitação de transferência entre unidades

**Novas Tabelas:**
```prisma
model Medicamento {
  id              String   @id
  nome            String
  principioAtivo  String
  apresentacao    String   // "Comprimido 500mg"
  catmat          String?
  isRename        Boolean
}

model EstoqueMedicamento {
  id              String   @id
  medicamentoId   String
  unidadeId       String
  quantidade      Int
  lote            String
  validade        DateTime
  estoqueMinimo   Int
}

model DispensacaoMedicamento {
  id              String   @id
  prescricaoId    String?
  medicamentoId   String
  citizenId       String
  quantidade      Int
  data            DateTime
  dispensadoPor   String   // userId
}
```

**Esforço:** 4 sprints

---

### MS-06: TFD - Tratamento Fora do Domicílio
**Objetivo:** Gestão completa de encaminhamentos para tratamento em outras cidades

**Funcionalidades:**
1. Recebimento de solicitações (via protocolos)
2. Fila de espera por especialidade/procedimento
3. Liberação de processos (análise de documentos)
4. Agendamento de consultas externas
5. Gestão de transporte (veículos, motoristas)
6. Montagem de listas de passageiros
7. Controle de diárias e hospedagem
8. Dashboard de TFD (gastos, atendimentos)

**Novas Tabelas:**
```prisma
model SolicitacaoTFD {
  id              String   @id
  protocolId      String   @unique
  citizenId       String
  acompanhanteId  String?
  especialidade   String
  procedimento    String
  cidadeDestino   String
  hospitalDestino String
  status          TFDStatus // FILA, APROVADO, AGENDADO, REALIZADO
  posicaoFila     Int?
  prioridade      Int
  observacoes     String?
}

model ViagemTFD {
  id              String   @id
  data            DateTime
  cidadeDestino   String
  veiculoId       String
  motoristaId     String
  passageiros     Json     // Array de {solicitacaoTFDId, citizenId, acompanhante}
  km              Int?
  combustivel     Float?
  pedagio         Float?
}
```

**Esforço:** 5 sprints

---

## SECRETARIA DE EDUCAÇÃO (6 Microsistemas)

### MS-07: Gestão de Unidades Educacionais
**Funcionalidades:**
1. CRUD de escolas (tipo, níveis, turnos)
2. Definição de vagas por série/turno
3. Gestão de infraestrutura (salas, laboratórios)
4. Configuração de calendário escolar
5. Dashboard de capacidade

**Tabelas:** `UnidadeEducacao` (3+ seedadas)

**Esforço:** 2 sprints

---

### MS-08: Sistema de Matrículas
**Funcionalidades:**
1. Inscrição online (pais/responsáveis)
2. Validação de documentos
3. Checagem automática de vagas
4. Distribuição por zoneamento
5. Fila de espera
6. Confirmação de matrícula
7. Renovação automática
8. Transferências entre escolas

**Novas Tabelas:**
```prisma
model Turma {
  id              String   @id
  unidadeId       String
  serie           String
  turno           Turno    // MATUTINO, VESPERTINO, INTEGRAL
  ano             Int
  professorId     String?
  vagas           Int
  matriculados    Int
  sala            String?
}

model Matricula {
  id              String   @id
  alunoId         String   // citizenId do aluno (via ProtocolCitizenLink)
  responsavelId   String   // citizenId do responsável
  turmaId         String
  ano             Int
  status          MatriculaStatus
  dataMatricula   DateTime
}
```

**Esforço:** 4 sprints

---

### MS-09: Gestão de Transporte Escolar
**Funcionalidades:**
1. Cadastro de veículos (capacidade, acessibilidade)
2. Cadastro de motoristas
3. Definição de rotas (pontos, horários)
4. Inscrição de alunos por rota
5. Controle de lotação
6. Manutenção de veículos
7. Dashboard de transporte

**Novas Tabelas:**
```prisma
model VeiculoEscolar {
  id              String   @id
  placa           String   @unique
  modelo          String
  capacidade      Int
  acessibilidade  Boolean
  status          VeiculoStatus
  km              Int
  ultimaRevisao   DateTime?
}

model RotaEscolar {
  id              String   @id
  nome            String
  veiculoId       String
  motoristaId     String
  turno           Turno
  horarioSaida    String
  horarioRetorno  String
  pontos          Json     // Array de {endereco, horario}
}

model AlunoRota {
  id              String   @id
  alunoId         String
  rotaId          String
  pontoEmbarque   String
  ativo           Boolean
}
```

**Esforço:** 4 sprints

---

### MS-10: Gestão de Merenda Escolar
**Funcionalidades:**
1. Cardápio semanal por faixa etária
2. Controle de estoque de alimentos
3. Gestão de fornecedores
4. Distribuição por escola
5. Relatórios nutricionais
6. Dashboard de consumo

**Esforço:** 3 sprints

---

### MS-11: Portal do Professor
**Funcionalidades:**
1. CRUD de professores (formação, horários)
2. Atribuição de turmas
3. Lançamento de notas
4. Registro de frequência
5. Planejamento de aulas
6. Comunicação com pais

**Tabelas:** `Professor`

**Esforço:** 3 sprints

---

### MS-12: Portal do Aluno/Pais
**Funcionalidades:**
1. Consulta de notas
2. Visualização de frequência
3. Calendário de provas
4. Comunicados da escola
5. Solicitação de documentos (declarações, histórico)
6. Acompanhamento de ocorrências

**Esforço:** 3 sprints

---

## SECRETARIA DE ASSISTÊNCIA SOCIAL (6 Microsistemas)

### MS-13: Gestão de CRAS/CREAS
**Funcionalidades:**
1. CRUD de unidades (endereço, programas)
2. Definição de território de abrangência
3. Equipe técnica (assistentes sociais, psicólogos)
4. Dashboard de atendimentos

**Tabelas:** `UnidadeCRAS` (2+ seedadas)

**Esforço:** 2 sprints

---

### MS-14: CadÚnico Municipal
**Funcionalidades:**
1. Cadastro de famílias (composição, renda)
2. Validação de documentos
3. Atualização cadastral
4. Cálculo de renda per capita
5. Cruzamento com programas sociais
6. Dashboard de vulnerabilidade

**Esforço:** 4 sprints

---

### MS-15: Gestão de Programas Sociais
**Funcionalidades:**
1. CRUD de programas (critérios, valores)
2. Inscrição/habilitação de beneficiários
3. Controle de concessão/suspensão
4. Renovação de benefícios
5. Relatórios de execução

**Tabelas:** `ProgramaSocial` (4+ seedados)

**Esforço:** 3 sprints

---

### MS-16: Controle de Benefícios
**Funcionalidades:**
1. Folha de pagamento de benefícios
2. Integração com bancos
3. Comprovantes de recebimento
4. Auditoria de concessões

**Esforço:** 3 sprints

---

### MS-17: Atendimento Psicossocial
**Funcionalidades:**
1. Agenda de atendimentos
2. Prontuário social
3. Plano de acompanhamento familiar
4. Encaminhamentos para rede

**Esforço:** 3 sprints

---

### MS-18: Dashboard de Vulnerabilidade
**Funcionalidades:**
1. Mapa de vulnerabilidade por bairro
2. Indicadores sociais (renda, educação, saúde)
3. Relatórios de impacto de programas
4. Projeções de demanda

**Esforço:** 2 sprints

---

## SECRETARIA DE AGRICULTURA (6 Microsistemas)

### MS-19: Cadastro de Produtores Rurais
**Funcionalidades:**
1. CRUD de produtores (CPF, propriedade)
2. Georreferenciamento de propriedades
3. Tipo de produção (vegetal, animal)
4. Histórico de assistência técnica

**Esforço:** 2 sprints

---

### MS-20: Gestão de Máquinas Agrícolas
**Funcionalidades:**
1. CRUD de máquinas (tipo, identificação)
2. Agenda de empréstimos
3. Controle de horas de uso
4. Manutenções preventivas
5. Dashboard de disponibilidade

**Tabelas:** `MaquinaAgricola`

**Esforço:** 3 sprints

---

### MS-21: Sistema de Empréstimo de Equipamentos
**Funcionalidades:**
1. Solicitação online
2. Validação de documentos
3. Agendamento de retirada/devolução
4. Checklist de vistoria
5. Cobrança por hora (se aplicável)

**Esforço:** 3 sprints

---

### MS-22: Assistência Técnica Rural
**Funcionalidades:**
1. Agenda de visitas técnicas
2. Registro de orientações
3. Plano de manejo
4. Análise de solo

**Esforço:** 3 sprints

---

### MS-23: Controle de Produção
**Funcionalidades:**
1. Registro de safras
2. Estatísticas de produção
3. Preços de mercado
4. Exportação de dados (IBGE, etc)

**Tabelas:** `TipoProducaoAgricola`

**Esforço:** 2 sprints

---

### MS-24: Feiras e Mercados
**Funcionalidades:**
1. Cadastro de feirantes
2. Distribuição de boxes
3. Agenda de feiras
4. Controle de pagamentos

**Esforço:** 2 sprints

---

## SECRETARIA DE CULTURA (6 Microsistemas)

### MS-25: Gestão de Espaços Culturais
**Funcionalidades:**
1. CRUD de espaços (teatro, centro cultural)
2. Configuração de capacidade
3. Infraestrutura disponível
4. Horários de funcionamento

**Tabelas:** `EspacoPublico` (categoria Cultural - 2+ seedados)

**Esforço:** 2 sprints

---

### MS-26: Sistema de Reservas de Espaços
**Funcionalidades:**
1. Calendário de disponibilidade
2. Solicitação de reserva
3. Aprovação/rejeição
4. Validação de conflitos
5. Termos de uso
6. Cobrança (se aplicável)

**Esforço:** 3 sprints

---

### MS-27: Cadastro de Artistas e Grupos
**Funcionalidades:**
1. CRUD de artistas (CPF, categoria)
2. Portfolio (fotos, vídeos, áudios)
3. Agenda de disponibilidade
4. Histórico de apresentações

**Esforço:** 2 sprints

---

### MS-28: Gestão de Eventos Culturais
**Funcionalidades:**
1. Cadastro de eventos (data, local, público)
2. Inscrição de artistas
3. Programação
4. Divulgação automática
5. Controle de público

**Esforço:** 3 sprints

---

### MS-29: Agenda Cultural Pública
**Funcionalidades:**
1. Calendário de eventos
2. Filtros (tipo, local, data)
3. Integração com redes sociais
4. Notificações push

**Esforço:** 2 sprints

---

### MS-30: Edital de Fomento à Cultura
**Funcionalidades:**
1. Cadastro de editais (valor, critérios)
2. Submissão de projetos
3. Avaliação técnica
4. Classificação e aprovação
5. Controle de prestação de contas

**Esforço:** 4 sprints

---

## SECRETARIA DE ESPORTES (6 Microsistemas)

### MS-31: Gestão de Equipamentos Esportivos
**Funcionalidades:**
1. CRUD de espaços (quadra, ginásio, campo)
2. Configuração de modalidades por espaço
3. Horários de funcionamento
4. Manutenções

**Tabelas:** `EspacoPublico` (categoria Esportivo - 2+ seedados)

**Esforço:** 2 sprints

---

### MS-32: Sistema de Reservas Esportivas
**Funcionalidades:**
1. Calendário de disponibilidade
2. Reserva por modalidade
3. Limites por usuário
4. Fila de espera
5. Check-in digital

**Esforço:** 3 sprints

---

### MS-33: Cadastro de Atletas e Times
**Funcionalidades:**
1. CRUD de atletas (categoria, modalidade)
2. Ficha médica (atestado, exames)
3. CRUD de times
4. Histórico de competições

**Esforço:** 2 sprints

---

### MS-34: Gestão de Campeonatos
**Funcionalidades:**
1. Cadastro de campeonatos
2. Inscrição de times
3. Tabela de jogos
4. Resultados e classificação
5. Súmulas digitais

**Esforço:** 4 sprints

---

### MS-35: Escolinha de Esportes
**Funcionalidades:**
1. Cadastro de turmas (modalidade, faixa etária)
2. Inscrição de alunos
3. Controle de frequência
4. Avaliações físicas

**Tabelas:** `ModalidadeEsportiva`

**Esforço:** 3 sprints

---

### MS-36: Dashboard Esportivo
**Funcionalidades:**
1. Uso de equipamentos
2. Atletas federados
3. Campeonatos realizados
4. Projetos sociais

**Esforço:** 2 sprints

---

## SECRETARIA DE HABITAÇÃO (6 Microsistemas)

### MS-37: Gestão de Conjuntos Habitacionais
**Funcionalidades:**
1. CRUD de conjuntos (localização, unidades)
2. Controle de vagas (disponíveis/ocupadas)
3. Tipologias (1, 2, 3 quartos)
4. Infraestrutura (água, luz, esgoto)
5. Mapa de conjuntos

**Tabelas:** `ConjuntoHabitacional` (4 seedados - 450 unidades)

**Esforço:** 2 sprints

---

### MS-38: Inscrição em Programas Habitacionais
**Funcionalidades:**
1. Cadastro de programas (MCMV, CDHU, Municipal)
2. Inscrição online
3. Validação de critérios (renda, composição familiar)
4. Pontuação automática
5. Fila de espera

**Tabelas:** `ProgramaHabitacional`

**Esforço:** 3 sprints

---

### MS-39: Distribuição de Unidades
**Funcionalidades:**
1. Chamamento de inscritos
2. Validação de documentos
3. Seleção de unidade
4. Assinatura de contrato
5. Entrega de chaves

**Esforço:** 3 sprints

---

### MS-40: Gestão de Obras Habitacionais
**Funcionalidades:**
1. Cadastro de obras (empreendimento, construtora)
2. Cronograma físico-financeiro
3. Acompanhamento de etapas
4. Dashboard de obras

**Esforço:** 3 sprints

---

### MS-41: Regularização Fundiária
**Funcionalidades:**
1. Cadastro de áreas irregulares
2. Levantamento topográfico
3. Análise de documentação
4. Processo de regularização
5. Emissão de títulos

**Esforço:** 4 sprints

---

### MS-42: Dashboard Habitacional
**Funcionalidades:**
1. Déficit habitacional
2. Unidades disponíveis por programa
3. Obras em andamento
4. Famílias atendidas

**Esforço:** 2 sprints

---

## SECRETARIA DE MEIO AMBIENTE (6 Microsistemas)

### MS-43: Gestão de Arborização Urbana
**Funcionalidades:**
1. Catálogo de espécies (porte, adequação)
2. Solicitação de plantio
3. Agenda de plantios
4. Mapa de arborização
5. Dashboard de cobertura verde

**Tabelas:** `EspecieArvore`

**Esforço:** 3 sprints

---

### MS-44: Gestão de Parques e Praças
**Funcionalidades:**
1. CRUD de áreas verdes
2. Plano de manutenção
3. Agenda de podas/limpeza
4. Controle de equipamentos
5. Autorização de eventos

**Tabelas:** `ParquePraca` (3+ seedados)

**Esforço:** 2 sprints

---

### MS-45: Coleta Seletiva e Reciclagem
**Funcionalidades:**
1. Cadastro de pontos de coleta
2. Rotas de coleta
3. Controle de volume coletado
4. Dashboard de reciclagem

**Esforço:** 3 sprints

---

### MS-46: Licenciamento Ambiental
**Funcionalidades:**
1. Solicitação de licenças
2. Análise técnica
3. Vistorias
4. Aprovação/rejeição
5. Controle de validade

**Esforço:** 4 sprints

---

### MS-47: Gestão de Programas Ambientais
**Funcionalidades:**
1. CRUD de programas (educação, preservação)
2. Inscrição de participantes
3. Controle de atividades
4. Relatórios de impacto

**Tabelas:** `ProgramaAmbiental`

**Esforço:** 2 sprints

---

### MS-48: Denúncias Ambientais
**Funcionalidades:**
1. Recebimento de denúncias
2. Georreferenciamento
3. Atribuição de fiscais
4. Vistoria e autuação
5. Dashboard de denúncias

**Esforço:** 3 sprints

---

## SECRETARIA DE OBRAS PÚBLICAS (6 Microsistemas)

### MS-49: Gestão de Tipos de Obra
**Funcionalidades:**
1. CRUD de tipos (pavimentação, drenagem)
2. Tempo médio de execução
3. Materiais comuns
4. Equipamentos necessários

**Tabelas:** `TipoObraServico` (6+ seedados)

**Esforço:** 2 sprints

---

### MS-50: Sistema de Solicitações (Tapa-Buraco)
**Funcionalidades:**
1. Recebimento via protocolo
2. Georreferenciamento
3. Priorização automática
4. Atribuição de equipes
5. Ordem de serviço
6. Registro fotográfico (antes/depois)

**Esforço:** 3 sprints

---

### MS-51: Gestão de Obras
**Funcionalidades:**
1. Cadastro de obras (tipo, localização, orçamento)
2. Cronograma físico-financeiro
3. Acompanhamento de etapas
4. Medições
5. Dashboard de obras

**Esforço:** 4 sprints

---

### MS-52: Controle de Equipamentos
**Funcionalidades:**
1. CRUD de máquinas (retroescavadeira, patrol)
2. Agenda de uso
3. Controle de km/horas
4. Manutenções
5. Dashboard de disponibilidade

**Esforço:** 3 sprints

---

### MS-53: Iluminação Pública
**Funcionalidades:**
1. Cadastro de pontos de luz
2. Solicitações de manutenção
3. Troca de lâmpadas (LED, convencional)
4. Expansão de rede
5. Dashboard de iluminação

**Esforço:** 3 sprints

---

### MS-54: Dashboard de Demandas
**Funcionalidades:**
1. Mapa de solicitações por bairro
2. Obras em andamento
3. Tempo médio de atendimento
4. Ranking de demandas

**Esforço:** 2 sprints

---

## SECRETARIA DE SEGURANÇA PÚBLICA (6 Microsistemas)

### MS-55: Gestão de Viaturas
**Funcionalidades:**
1. CRUD de viaturas (tipo, placa, equipamentos)
2. Controle de km
3. Agenda de manutenção
4. Abastecimento
5. Dashboard de disponibilidade

**Tabelas:** `ViaturaSeguranca` (5 seedadas)

**Esforço:** 2 sprints

---

### MS-56: Registro de Ocorrências
**Funcionalidades:**
1. Boletim de ocorrência digital
2. Georreferenciamento
3. Classificação por gravidade
4. Anexos (fotos, vídeos)
5. Encaminhamentos

**Tabelas:** `TipoOcorrencia`

**Esforço:** 3 sprints

---

### MS-57: Gestão de Patrulhamento
**Funcionalidades:**
1. Definição de rondas
2. Checklist de pontos
3. Registro de novas ocorrências
4. Dashboard de cobertura

**Esforço:** 3 sprints

---

### MS-58: Central de Videomonitoramento
**Funcionalidades:**
1. Cadastro de câmeras
2. Integração com DVR
3. Registro de eventos
4. Solicitação de imagens

**Esforço:** 4 sprints

---

### MS-59: Gestão de Guarda Municipal
**Funcionalidades:**
1. Cadastro de guardas
2. Escala de serviço
3. Controle de armamento
4. Treinamentos

**Esforço:** 3 sprints

---

### MS-60: Dashboard de Segurança
**Funcionalidades:**
1. Mapa de calor (ocorrências)
2. Estatísticas de criminalidade
3. Tempo de resposta
4. Efetivo em serviço

**Esforço:** 2 sprints

---

## SECRETARIA DE TURISMO (6 Microsistemas)

### MS-61: Cadastro de Estabelecimentos Turísticos
**Funcionalidades:**
1. CRUD de hotéis, pousadas, restaurantes
2. Classificação (estrelas)
3. Serviços oferecidos
4. Georreferenciamento
5. Fotos e vídeos

**Tabelas:** `EstabelecimentoTuristico`, `TipoEstabelecimentoTuristico`

**Esforço:** 2 sprints

---

### MS-62: Registro de Guias Turísticos
**Funcionalidades:**
1. CRUD de guias (CADASTUR)
2. Idiomas e especialidades
3. Certificações
4. Agenda de disponibilidade
5. Avaliações

**Tabelas:** `GuiaTuristico`

**Esforço:** 2 sprints

---

### MS-63: Gestão de Pontos Turísticos
**Funcionalidades:**
1. Cadastro de atrativos
2. Descrição e histórico
3. Fotos 360º
4. Horários e ingressos
5. Mapa turístico

**Esforço:** 3 sprints

---

### MS-64: Agenda de Eventos Turísticos
**Funcionalidades:**
1. Calendário de eventos
2. Festas tradicionais
3. Divulgação automática
4. Integração com redes sociais

**Esforço:** 2 sprints

---

### MS-65: Portal do Turista
**Funcionalidades:**
1. Roteiros sugeridos
2. Onde ficar
3. Onde comer
4. O que fazer
5. Avaliações

**Esforço:** 3 sprints

---

### MS-66: Dashboard Turístico
**Funcionalidades:**
1. Ocupação hoteleira
2. Fluxo de turistas
3. Eventos realizados
4. Receita estimada

**Esforço:** 2 sprints

---

## SECRETARIA DE PLANEJAMENTO URBANO (6 Microsistemas)

### MS-67: Gestão de Zoneamento
**Funcionalidades:**
1. Mapa de zoneamento
2. Consulta de zoneamento por lote
3. Regras de uso e ocupação do solo
4. Dashboard de ocupação

**Esforço:** 3 sprints

---

### MS-68: Licenciamento de Obras Privadas
**Funcionalidades:**
1. Solicitação de alvarás
2. Análise de projetos
3. Vistorias
4. Aprovação/rejeição
5. Habite-se

**Esforço:** 4 sprints

---

### MS-69: Cadastro Imobiliário
**Funcionalidades:**
1. Cadastro de lotes
2. Proprietários
3. Áreas e confrontações
4. Valor venal
5. IPTU

**Esforço:** 4 sprints

---

### MS-70: Gestão de Loteamentos
**Funcionalidades:**
1. Aprovação de loteamentos
2. Termo de compromisso
3. Execução de obras
4. Aceitação definitiva

**Esforço:** 3 sprints

---

### MS-71: Plano Diretor Digital
**Funcionalidades:**
1. Visualização de diretrizes
2. Consulta pública
3. Acompanhamento de metas
4. Revisões

**Esforço:** 3 sprints

---

### MS-72: Dashboard Urbanístico
**Funcionalidades:**
1. Alvarás emitidos
2. Obras em andamento
3. Expansão urbana
4. Áreas de risco

**Esforço:** 2 sprints

---

## SECRETARIA DE SERVIÇOS PÚBLICOS (6 Microsistemas)

### MS-73: Gestão de Coleta de Lixo
**Funcionalidades:**
1. Rotas de coleta (convencional, seletiva)
2. Veículos e motoristas
3. Controle de volume coletado
4. Dashboard de coleta

**Esforço:** 3 sprints

---

### MS-74: Manutenção de Logradouros
**Funcionalidades:**
1. Solicitações de limpeza
2. Varrição de ruas
3. Capina e roçada
4. Desobstrução de bueiros

**Esforço:** 3 sprints

---

### MS-75: Poda de Árvores
**Funcionalidades:**
1. Solicitações de poda
2. Análise técnica
3. Agenda de podas
4. Equipes e equipamentos

**Esforço:** 2 sprints

---

### MS-76: Cemitérios Municipais
**Funcionalidades:**
1. Cadastro de cemitérios
2. Controle de sepulturas
3. Concessões
4. Manutenções

**Esforço:** 3 sprints

---

### MS-77: Feiras Livres
**Funcionalidades:**
1. Cadastro de feiras
2. Permissionários
3. Distribuição de boxes
4. Arrecadação

**Esforço:** 2 sprints

---

### MS-78: Dashboard de Serviços
**Funcionalidades:**
1. Solicitações por tipo
2. Tempo de atendimento
3. Equipes em campo
4. Custos operacionais

**Esforço:** 2 sprints

---

## ROADMAP DE IMPLEMENTAÇÃO

### FASE 0: Fundação (Sprints 1-3) - PRIORIDADE CRÍTICA
- [ ] **MS-00: Gestor de Cadastros Base**
- [ ] Completar seeds de todas as 25 tabelas
- [ ] Implementar tipo `enum` nos formSchemas
- [ ] Componente `EnumField` no frontend
- [ ] Refatorar serviços existentes para usar enums

**Entrega:** Base para todos os microsistemas

---

### FASE 1: Saúde (Sprints 4-9)
- [ ] MS-01: Gestão de Unidades de Saúde
- [ ] MS-02: Agenda Médica Inteligente
- [ ] MS-03: Prontuário Eletrônico
- [ ] MS-04: Sistema de Filas
- [ ] MS-05: Gestão de Medicamentos
- [ ] MS-06: TFD

**Entrega:** Saúde 100% digitalizada

---

### FASE 2: Educação (Sprints 10-14)
- [ ] MS-07 a MS-12 (6 microsistemas)

**Entrega:** Educação 100% digitalizada

---

### FASE 3: Assistência Social (Sprints 15-18)
- [ ] MS-13 a MS-18 (6 microsistemas)

**Entrega:** CadÚnico e programas sociais automatizados

---

### FASE 4: Agricultura e Cultura (Sprints 19-24)
- [ ] MS-19 a MS-24 (Agricultura)
- [ ] MS-25 a MS-30 (Cultura)

---

### FASE 5: Esportes e Habitação (Sprints 25-30)
- [ ] MS-31 a MS-36 (Esportes)
- [ ] MS-37 a MS-42 (Habitação)

---

### FASE 6: Meio Ambiente e Obras (Sprints 31-36)
- [ ] MS-43 a MS-48 (Meio Ambiente)
- [ ] MS-49 a MS-54 (Obras Públicas)

---

### FASE 7: Segurança e Turismo (Sprints 37-42)
- [ ] MS-55 a MS-60 (Segurança)
- [ ] MS-61 a MS-66 (Turismo)

---

### FASE 8: Planejamento e Serviços (Sprints 43-48)
- [ ] MS-67 a MS-72 (Planejamento Urbano)
- [ ] MS-73 a MS-78 (Serviços Públicos)

---

## ESTIMATIVA TOTAL

- **78 microsistemas**
- **~220 sprints** (2 semanas cada)
- **~440 semanas** (~8,5 anos com 1 time)
- **~110 semanas** (~2 anos com 4 times)
- **~55 semanas** (~1 ano com 8 times)

---

## CONCLUSÃO

A proposta é **100% viável** tecnicamente, pois:

1. ✅ Toda infraestrutura já existe (Prisma, APIs, Frontend)
2. ✅ 72% das tabelas auxiliares já estão seedadas
3. ✅ Sistema de protocolos robusto e testado
4. ✅ Padrões de código bem definidos

**PRIORIDADE IMEDIATA:**
- Implementar MS-00 (Gestor de Cadastros Base)
- Completar seeds faltantes
- Implementar enums dinâmicos nos forms
- Escolher 1-2 microsistemas piloto (Saúde e Educação)

**PRÓXIMOS PASSOS:**
1. Aprovação da proposta
2. Priorização de microsistemas (quais implementar primeiro)
3. Alocação de equipe
4. Início do desenvolvimento

---

**Documento gerado em:** 2025-01-17
**Versão:** 1.0
**Status:** Aguardando aprovação
