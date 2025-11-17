# ANÁLISE COMPLETA E PROFUNDA - OPORTUNIDADES DE DADOS AUXILIARES NO DIGIURBAN

**Data:** 2025-11-17
**Escopo:** Análise de TODOS os 13+ arquivos de serviços para identificar campos TEXT que deveriam ser tabelas auxiliares
**Objetivo:** Criar inventário completo de oportunidades para normalização de dados e melhoria do sistema

---

## 1. INVENTÁRIO COMPLETO DE OPORTUNIDADES

Esta seção lista TODAS as oportunidades identificadas nos 13 departamentos do DigiUrban, organizadas por tipo de dado auxiliar.

### 1.1 ENTIDADES MUNICIPAIS (Locais/Equipamentos)

Campos que representam equipamentos públicos e locais que deveriam ser tabelas com CRUD completo:

#### 📍 **UNIDADES DE SAÚDE**
- **Tabela Proposta:** `UnidadeSaude`
- **Serviços que Usam:**
  - CONSULTA_MEDICA (campo: `unidadeSaude`)
  - EXAMES_LABORATORIAIS (campo: `unidadeSaude`)
  - VACINAS (campo: `postoSaude`)
  - ATENDIMENTO_ODONTOLOGICO (campo: `unidadeSaude`)
  - ATENDIMENTO_PSICOLOGICO (campo: `unidadeSaude`)
  - MEDICAMENTOS_GRATUITOS (campo: `farmaciaPopular`)
  - VISITA_DOMICILIAR (campo: `unidadeReferencia`)
  - PROGRAMA_SAUDE_FAMILIA (campo: `unidadeReferencia`)
- **Frequência:** 8 serviços (ALTA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `nome`, `tipo` (UBS, Hospital, Posto, Farmácia Popular, etc.)
  - `endereco`, `telefone`, `horarioFuncionamento`
  - `latitude`, `longitude`
  - `especialidadesDisponiveis` (array)
  - `capacidadeAtendimento`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Gestão centralizada de unidades de saúde
  - Controle de capacidade e disponibilidade
  - Relatórios de demanda por unidade
  - Integração com mapas/geolocalização
  - Filtros inteligentes por proximidade do cidadão

#### 🏫 **ESCOLAS**
- **Tabela Proposta:** `Escola`
- **Serviços que Usam:**
  - MATRICULA_ESCOLAR (campo: `escolaPreferencial`)
  - TRANSFERENCIA_ESCOLA (campos: `escolaOrigem`, `escolaDestino`)
  - TRANSPORTE_ESCOLAR (campo: `escola`)
  - MERENDA_ESCOLAR (campo: `escola`)
  - MATERIAL_DIDATICO (campo: `escola`)
  - APOIO_EDUCACIONAL (campo: `escola`)
  - EDUCACAO_JOVENS_ADULTOS (campo: `escolaPreferencial`)
  - EDUCACAO_INCLUSIVA (campo: `escola`)
  - ATIVIDADES_EXTRACURRICULARES (campo: `escola`)
- **Frequência:** 9 serviços (ALTA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `nome`, `tipo` (Infantil, Fundamental, Médio, EJA)
  - `endereco`, `bairro`, `telefone`
  - `latitude`, `longitude`
  - `capacidadeAlunos`, `alunosMatriculados`
  - `nivelEnsino` (array)
  - `temTransporte`, `temMerenda`, `temEducacaoEspecial`
  - `turnosFuncionamento`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Gestão de matrículas e transferências automatizada
  - Controle de vagas em tempo real
  - Planejamento de rotas de transporte escolar
  - Relatórios de demanda por região

#### 🏢 **CRAS (Centro de Referência de Assistência Social)**
- **Tabela Proposta:** `Cras`
- **Serviços que Usam:**
  - CADASTRO_SOCIAL (campo: `crasReferencia`)
  - PROGRAMA_BOLSA_FAMILIA (campo: `crasReferencia`)
  - CESTA_BASICA (campo: `crasReferencia`)
  - AUXILIO_NATALIDADE (campo: `crasReferencia`)
  - CADASTRO_UNICO (campo: `crasReferencia`)
  - ATENDIMENTO_PSICOSSOCIAL (campo: `crasReferencia`)
- **Frequência:** 6 serviços (ALTA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `nome`, `endereco`, `bairro`
  - `latitude`, `longitude`, `telefone`
  - `regioesAtendidas` (array de bairros)
  - `capacidadeAtendimento`
  - `programasOferecidos` (array)
  - `equipeTecnica` (Json)
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Distribuição equitativa de demanda
  - Controle territorial de atendimento
  - Relatórios por CRAS
  - Planejamento de recursos humanos

#### ⚽ **ESPAÇOS ESPORTIVOS**
- **Tabela Proposta:** `EspacoEsportivo`
- **Serviços que Usam:**
  - INSCRICAO_ESCOLINHAS (campo: `espacoDesejado`)
  - AGENDAMENTO_QUADRAS (campo: `espacoEsportivo`)
  - EVENTOS_ESPORTIVOS (campo: `localEvento`)
  - PROJETO_SOCIAL_ESPORTIVO (campo: `localAtividade`)
  - AULAS_ESPORTIVAS (campo: `localAula`)
  - CAMPEONATOS (campo: `localCampeonato`)
  - AVALIACAO_FISICA (campo: `localAvaliacao`)
- **Frequência:** 7 serviços (ALTA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `nome`, `tipo` (Quadra, Ginásio, Campo, Pista, Academia)
  - `endereco`, `latitude`, `longitude`
  - `modalidadesSuportadas` (array)
  - `capacidadePessoas`
  - `temVestiario`, `temIluminacao`, `temCobertura`
  - `horarioFuncionamento`
  - `disponibilidadeAgenda` (Json)
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Sistema de agendamento inteligente
  - Controle de ocupação
  - Manutenção preventiva programada
  - Relatórios de uso por modalidade

#### 🎭 **ESPAÇOS CULTURAIS**
- **Tabela Proposta:** `EspacoCultural`
- **Serviços que Usam:**
  - INSCRICAO_OFICINAS (campo: `espacoCultural`)
  - AGENDAMENTO_ESPACOS (campo: `espacoCultural`)
  - EVENTOS_CULTURAIS (campo: `localEvento`)
  - BIBLIOTECA_MUNICIPAL (campo: `biblioteca`)
  - PATRIMONIO_CULTURAL (campo: `localPatrimonio`)
  - TEATRO_MUNICIPAL (campo: `teatro`)
  - MUSEU_MUNICIPAL (campo: `museu`)
- **Frequência:** 7 serviços (ALTA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `nome`, `tipo` (Teatro, Biblioteca, Casa de Cultura, Centro Cultural, Museu)
  - `endereco`, `latitude`, `longitude`
  - `capacidadePessoas`
  - `infraestrutura` (Som, Iluminação, Climatização, etc.)
  - `tiposEventosPermitidos` (array)
  - `horarioFuncionamento`, `temAgendamento`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Agenda cultural unificada
  - Gestão de reservas de espaços
  - Controle de eventos
  - Relatórios de utilização

#### 🏘️ **CONJUNTOS HABITACIONAIS**
- **Tabela Proposta:** `ConjuntoHabitacional`
- **Serviços que Usam:**
  - CADASTRO_HABITACAO (campo: `conjuntoInteresse`)
  - MINHA_CASA_MINHA_VIDA (campo: `conjuntoInteresse`)
  - REGULARIZACAO_FUNDIARIA (campo: `conjuntoHabitacional`)
  - MELHORIAS_HABITACIONAIS (campo: `conjuntoHabitacional`)
- **Frequência:** 4 serviços (MÉDIA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `nome`, `endereco`, `bairro`
  - `totalUnidades`, `unidadesOcupadas`, `unidadesDisponiveis`
  - `tipologias` (1 quarto, 2 quartos, etc.)
  - `programaOrigem` (MCMV, CDHU, etc.)
  - `latitude`, `longitude`
  - `infraestrutura` (água, esgoto, pavimentação, etc.)
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Controle de vagas habitacionais
  - Fila única de interesse
  - Gestão de ocupação
  - Relatórios de deficit habitacional

#### 🚔 **VIATURAS/EQUIPAMENTOS DE SEGURANÇA**
- **Tabela Proposta:** `ViaturaSeguranca`
- **Serviços que Usam:**
  - PATRULHAMENTO (campo: `viaturaCodigo`)
  - OPERACAO_ESPECIAL (campo: `viaturasEnvolvidas`)
  - ESCOLTA (campo: `viaturaDesignada`)
  - POLICIAMENTO_PREVENTIVO (campo: `equipeResponsavel` - contém viatura)
- **Frequência:** 4 serviços (MÉDIA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `codigo`, `tipo` (Patrulha, Moto, Bicicleta, Viatura Especial)
  - `placa`, `modelo`, `ano`
  - `status` (Ativa, Manutenção, Inativa)
  - `equipamentos` (Rádio, Câmera, GPS, etc.)
  - `baseOperacional`
  - `horasUso`, `kmRodados`
  - `proximaManutencao`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Controle de frota
  - Manutenção preventiva
  - Relatórios de utilização
  - Rastreamento de operações

#### 🌳 **PARQUES E PRAÇAS**
- **Tabela Proposta:** `ParquePraca`
- **Serviços que Usam:**
  - MANUTENCAO_AREAS_VERDES (campo: `localManutencao`)
  - EVENTOS_PARQUES (campo: `localEvento`)
  - AUTORIZACAO_EVENTO_PUBLICO (campo: `localEvento`)
  - PODA_ARVORES (campo: `endereco` - poderia referenciar parque)
- **Frequência:** 4 serviços (MÉDIA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `nome`, `tipo` (Parque, Praça, Jardim)
  - `endereco`, `bairro`, `latitude`, `longitude`
  - `area` (m²)
  - `equipamentos` (Playground, Quadra, Academia ao Ar Livre, etc.)
  - `horarioFuncionamento`
  - `permiteEventos`, `capacidadeEventos`
  - `ultimaManutencao`, `proximaManutencao`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Planejamento de manutenção
  - Controle de eventos em áreas públicas
  - Gestão de infraestrutura verde
  - Relatórios de conservação

### 1.2 CATEGORIAS E TIPOS (Classificações)

Campos que são listas de opções fixas e deveriam ser tabelas gerenciáveis:

#### 📋 **PROGRAMAS SOCIAIS**
- **Tabela Proposta:** `ProgramaSocial`
- **Serviços que Usam:**
  - PROGRAMA_BOLSA_FAMILIA (campo: `nomePrograma`)
  - BENEFICIO_SOCIAL (campo: `tipoBeneficio`)
  - INSCRICAO_PROGRAMAS (campo múltiplos programas)
  - ACOMPANHAMENTO_FAMILIAR (campo: `programasVinculados`)
  - CADASTRO_SOCIAL (campo: `programasInteresse`)
- **Frequência:** 5+ serviços (ALTA PRIORIDADE)
- **Valores Comuns:** Bolsa Família, BPC, Auxílio Natalidade, Programa de Erradicação do Trabalho Infantil
- **Campos da Tabela:**
  - `id`, `nome`, `descricao`, `tipo`
  - `criteriosElegibilidade` (Json)
  - `valorBeneficio`, `periodicidade`
  - `documentosNecessarios` (array)
  - `orgaoResponsavel`, `legislacao`
  - `dataInicio`, `dataFim`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Cadastro único de programas
  - Critérios centralizados
  - Relatórios de cobertura
  - Histórico de alterações

#### 🏥 **ESPECIALIDADES MÉDICAS**
- **Tabela Proposta:** `EspecialidadeMedica`
- **Serviços que Usam:**
  - CONSULTA_MEDICA (campo: `especialidade`)
  - EXAMES_ESPECIALIZADOS (campo: `especialidade`)
  - ATENDIMENTO_ESPECIALIZADO (campo: `especialidade`)
  - AGENDAMENTO_CONSULTAS (campo: `especialidade`)
- **Frequência:** 4 serviços (ALTA PRIORIDADE)
- **Valores Comuns:** Clínico Geral, Pediatria, Ginecologia, Cardiologia, Ortopedia, Oftalmologia, etc.
- **Campos da Tabela:**
  - `id`, `nome`, `descricao`
  - `area` (Clínica Médica, Cirúrgica, Diagnóstica, etc.)
  - `tempoMedioConsulta` (minutos)
  - `requisistosPaciente` (ex: encaminhamento)
  - `examesComuns` (array)
  - `unidadesQueOferecem` (relação com UnidadeSaude)
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Gestão de agenda por especialidade
  - Controle de demanda
  - Relatórios de atendimento
  - Planejamento de contratações

#### 🌾 **TIPOS DE PRODUÇÃO AGRÍCOLA**
- **Tabela Proposta:** `TipoProducaoAgricola`
- **Serviços que Usam:**
  - CADASTRO_PRODUTOR (campo: `tipoProducao`)
  - PROGRAMA_SEMENTES (campo: `tipoSemente`)
  - ASSISTENCIA_TECNICA (campo: `tipoProducao`)
  - CREDITO_RURAL (campo: `finalidadeCredito`)
- **Frequência:** 4 serviços (MÉDIA PRIORIDADE)
- **Valores Comuns:** Grãos, Hortaliças, Frutas, Pecuária Leiteira, Pecuária de Corte, Avicultura, etc.
- **Campos da Tabela:**
  - `id`, `nome`, `categoria` (Vegetal, Animal)
  - `subcategoria`
  - `sazonalidade` (meses de plantio/colheita)
  - `assistenciaTecnicaDisponivel`
  - `programasApoio` (array)
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Planejamento agrícola municipal
  - Programas direcionados por tipo
  - Estatísticas de produção
  - Calendário agrícola

#### 🚜 **MÁQUINAS E EQUIPAMENTOS AGRÍCOLAS**
- **Tabela Proposta:** `MaquinaAgricola`
- **Serviços que Usam:**
  - SOLICITACAO_MAQUINAS (campo: `tipoMaquina`)
  - EMPRESTIMO_EQUIPAMENTOS (campo: `equipamento`)
  - MANUTENCAO_EQUIPAMENTOS (campo: `maquina`)
- **Frequência:** 3 serviços (MÉDIA PRIORIDADE)
- **Valores Comuns:** Trator, Arado, Grade, Plantadeira, Colheitadeira, Pulverizador
- **Campos da Tabela:**
  - `id`, `tipo`, `modelo`, `identificacao`
  - `status` (Disponível, Emprestada, Manutenção)
  - `capacidade`, `potencia`
  - `horasUso`, `ultimaManutencao`, `proximaManutencao`
  - `valorHoraUso` (se cobrado)
  - `documentosNecessarios` (para empréstimo)
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Controle de frota agrícola
  - Agenda de uso
  - Manutenção preventiva
  - Relatórios de utilização

#### 🌲 **ESPÉCIES DE ÁRVORES**
- **Tabela Proposta:** `EspecieArvore`
- **Serviços que Usam:**
  - PLANTIO_ARVORES (campo: `especieArvore` - 20+ opções hardcoded)
  - DOACAO_MUDAS (campo: `especieMuda`)
  - AUTORIZACAO_CORTE (campo: `especieArvore`)
  - PODA_ARVORES (campo: `especieArvore`)
- **Frequência:** 4 serviços (MÉDIA PRIORIDADE)
- **Valores Encontrados:** Ipê Amarelo, Ipê Rosa, Pau-Brasil, Cedro, Jacarandá, Aroeira, Jatobá, Palmeira Imperial, etc.
- **Campos da Tabela:**
  - `id`, `nomeComum`, `nomeCientifico`
  - `familia`, `origem` (Nativa, Exótica)
  - `porte` (Pequeno, Médio, Grande)
  - `tipoRaiz`, `crescimento`
  - `adequadaCalcada`, `adequadaParque`
  - `flores`, `frutificacao`
  - `cuidadosEspeciais`
  - `disponibilidadeMudas`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Planejamento de arborização urbana
  - Controle de estoque de mudas
  - Relatórios de biodiversidade
  - Educação ambiental

#### 🏗️ **TIPOS DE OBRAS E SERVIÇOS**
- **Tabela Proposta:** `TipoObraServico`
- **Serviços que Usam:**
  - SOLICITACAO_OBRA (campo: `tipoObra`)
  - MANUTENCAO_VIAS (campo: `tipoServico`)
  - TAPA_BURACO (campo: `tipoServico`)
  - DRENAGEM (campo: `tipoObra`)
  - ILUMINACAO_PUBLICA (campo: `tipoServico`)
  - CALCAMENTO (campo: `tipoObra`)
- **Frequência:** 6+ serviços (ALTA PRIORIDADE)
- **Valores Comuns:** Pavimentação, Drenagem, Iluminação, Meio-Fio, Calçada, Tapa-Buraco, Limpeza de Boca de Lobo
- **Campos da Tabela:**
  - `id`, `nome`, `categoria` (Pavimentação, Drenagem, Iluminação, etc.)
  - `descricao`
  - `tempoMedioExecucao` (dias)
  - `requisitosPrevios` (ex: projeto)
  - `equipamentosNecessarios` (array)
  - `materiaisComuns` (array)
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Padronização de nomenclatura
  - Estimativas de prazo
  - Planejamento de recursos
  - Relatórios por tipo de obra

#### 🏨 **TIPOS DE ESTABELECIMENTOS TURÍSTICOS**
- **Tabela Proposta:** `TipoEstabelecimentoTuristico`
- **Serviços que Usam:**
  - CADASTRO_ESTABELECIMENTO (campo: `tipoEstabelecimento` com 10+ opções)
  - LICENCA_TURISTICA (campo: `tipoEstabelecimento`)
  - SELO_QUALIDADE (campo: `categoria`)
- **Frequência:** 3 serviços (MÉDIA PRIORIDADE)
- **Valores Comuns:** Hotel, Pousada, Restaurante, Bar, Agência de Turismo, Guia Turístico, Atração Turística
- **Campos da Tabela:**
  - `id`, `nome`, `categoria`
  - `requisitosLegais` (alvará, licenças, etc.)
  - `documentosNecessarios` (array)
  - `classificacao` (estrelas, categoria)
  - `inspectionRequired`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Controle do trade turístico
  - Requisitos legais centralizados
  - Relatórios de infraestrutura turística
  - Base para selo de qualidade

#### 🎯 **MODALIDADES ESPORTIVAS**
- **Tabela Proposta:** `ModalidadeEsportiva`
- **Serviços que Usam:**
  - INSCRICAO_ESCOLINHAS (campo: `modalidadeEsportiva`)
  - CAMPEONATOS (campo: `modalidade`)
  - PROJETO_SOCIAL_ESPORTIVO (campo: `modalidade`)
  - AULAS_ESPORTIVAS (campo: `modalidade`)
- **Frequência:** 4 serviços (MÉDIA PRIORIDADE)
- **Valores Comuns:** Futebol, Vôlei, Basquete, Handebol, Natação, Atletismo, Judô, Capoeira, etc.
- **Campos da Tabela:**
  - `id`, `nome`, `categoria` (Individual, Coletivo)
  - `tipo` (Quadra, Campo, Piscina, Tatame, etc.)
  - `faixasEtarias` (Infantil, Juvenil, Adulto, Sênior)
  - `equipamentosNecessarios` (array)
  - `profissionaisNecessarios` (Professor, Técnico, Árbitro)
  - `espacosDisponiveis` (relação com EspacoEsportivo)
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Planejamento de escolinhas
  - Alocação de recursos
  - Relatórios de participação
  - Calendário esportivo

#### 🎨 **TIPOS DE ATIVIDADES CULTURAIS**
- **Tabela Proposta:** `TipoAtividadeCultural`
- **Serviços que Usam:**
  - INSCRICAO_OFICINAS (campo: `tipoAtividade` com muitas opções)
  - EVENTOS_CULTURAIS (campo: `tipoEvento`)
  - APRESENTACAO_ARTISTICA (campo: `tipoApresentacao`)
  - CURSO_CULTURAL (campo: `tipoAtividade`)
- **Frequência:** 4+ serviços (MÉDIA PRIORIDADE)
- **Valores Comuns:** Dança, Teatro, Música, Artesanato, Pintura, Literatura, Cinema, Fotografia
- **Campos da Tabela:**
  - `id`, `nome`, `categoria`
  - `materialNecessario` (array)
  - `faixasEtarias`
  - `duracaoMedia` (horas/aula)
  - `espacosAdequados` (relação com EspacoCultural)
  - `profissionaisNecessarios`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Planejamento de oficinas
  - Alocação de instrutores
  - Relatórios de participação
  - Agenda cultural

#### 🚨 **TIPOS DE OCORRÊNCIAS**
- **Tabela Proposta:** `TipoOcorrencia`
- **Serviços que Usam:**
  - REGISTRO_OCORRENCIA (campo: `tipoOcorrencia` com 15+ opções)
  - DENUNCIA_ANONIMA (campo: `tipoOcorrencia`)
  - SOLICITACAO_RONDA (campo: `motivoSolicitacao`)
- **Frequência:** 3 serviços (MÉDIA PRIORIDADE)
- **Valores Comuns:** Furto, Roubo, Vandalismo, Perturbação do Sossego, Tráfico de Drogas, Violência Doméstica, Acidente de Trânsito
- **Campos da Tabela:**
  - `id`, `nome`, `categoria` (Contra Pessoa, Patrimônio, Ordem Pública, etc.)
  - `gravidade` (1-5)
  - `requererBoletimOcorrencia`
  - `tempoRespostaPadrao` (minutos)
  - `equipesCompetentes` (array)
  - `procedimentosPadrao` (texto)
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Classificação padronizada
  - Priorização de atendimento
  - Estatísticas criminais
  - Planejamento operacional

### 1.3 PROFISSIONAIS E EQUIPES

Campos que representam profissionais que deveriam ter cadastro próprio:

#### 👨‍⚕️ **PROFISSIONAIS DE SAÚDE**
- **Tabela Proposta:** `ProfissionalSaude`
- **Serviços que Usam:**
  - CONSULTA_MEDICA (campo: `medicoPreferencial`)
  - ATENDIMENTO_PSICOLOGICO (campo: `psicologoPreferencial`)
  - ATENDIMENTO_ODONTOLOGICO (campo: `dentista`)
  - VISITA_DOMICILIAR (campo: `profissionalResponsavel`)
- **Frequência:** 4 serviços (ALTA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `nome`, `cpf`, `registroProfissional` (CRM, CRO, CRP, etc.)
  - `especialidade`, `categoria` (Médico, Enfermeiro, Dentista, Psicólogo, etc.)
  - `unidadesAtendimento` (array - relação com UnidadeSaude)
  - `horarioAtendimento` (Json)
  - `diasSemana` (array)
  - `tempoMedioConsulta`
  - `aceitaAgendamento`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Agenda médica inteligente
  - Controle de lotação de agenda
  - Relatórios de produtividade
  - Integração com prontuário

#### 👨‍🏫 **PROFESSORES E INSTRUTORES**
- **Tabela Proposta:** `Professor`
- **Serviços que Usam:**
  - CURSO_PROFISSIONALIZANTE (campo: `instrutor`)
  - OFICINAS_CULTURAIS (campo: `instrutor`)
  - AULAS_ESPORTIVAS (campo: `professor`)
  - CAPACITACAO_DIGITAL (campo: `instrutor`)
- **Frequência:** 4 serviços (MÉDIA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `nome`, `cpf`, `formacao`
  - `especializacoes` (array)
  - `areasAtuacao` (array)
  - `vinculo` (Efetivo, Contratado, Voluntário)
  - `cargaHoraria`, `disponibilidade`
  - `avaliacaoMedia`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Gestão de instrutores
  - Alocação de turmas
  - Avaliação de desempenho
  - Planejamento de capacitação

#### 🌍 **GUIAS TURÍSTICOS**
- **Tabela Proposta:** `GuiaTuristico`
- **Serviços que Usam:**
  - CADASTRO_GUIA (campo: múltiplos campos do formulário)
  - CREDENCIAMENTO_GUIA (campo: `guia`)
  - TOUR_GUIADO (campo: `guiaResponsavel`)
- **Frequência:** 3 serviços (BAIXA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `nome`, `cpf`, `cadastur`
  - `idiomas` (array)
  - `especialidades` (Histórico, Ecológico, Aventura, etc.)
  - `certificacoes` (array)
  - `disponibilidade`, `valorDiaria`
  - `avaliacaoMedia`, `totalTours`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Controle de guias credenciados
  - Matching com turistas
  - Avaliação de qualidade
  - Estatísticas de turismo

### 1.4 CURSOS E PROGRAMAS

#### 📚 **CURSOS PROFISSIONALIZANTES**
- **Tabela Proposta:** `CursoProfissionalizante`
- **Serviços que Usam:**
  - INSCRICAO_CURSO (campo: `nomeCurso`)
  - QUALIFICACAO_PROFISSIONAL (campo: `curso`)
  - JOVEM_APRENDIZ (campo: `cursoInteresse`)
  - CAPACITACAO_DIGITAL (campo: `nomeCurso`)
- **Frequência:** 4 serviços (ALTA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `nome`, `categoria`, `area`
  - `cargaHoraria`, `duracao` (meses)
  - `requisitos`, `certificacao`
  - `conteudoProgramatico` (Json)
  - `vagas`, `vagasOcupadas`
  - `instrutor` (relação com Professor)
  - `localCurso`, `horario`
  - `dataInicio`, `dataFim`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Gestão de turmas
  - Controle de vagas
  - Histórico de formações
  - Certificados automáticos

#### 🏡 **PROGRAMAS HABITACIONAIS**
- **Tabela Proposta:** `ProgramaHabitacional`
- **Serviços que Usam:**
  - CADASTRO_HABITACAO (campo: `programaInteresse`)
  - MINHA_CASA_MINHA_VIDA (campo: `programaHabitacional`)
  - MELHORIAS_HABITACIONAIS (campo: `programaMelhoria`)
  - REGULARIZACAO_FUNDIARIA (campo: `programa`)
- **Frequência:** 4 serviços (ALTA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `nome`, `descricao`
  - `tipo` (Aquisição, Melhoria, Regularização)
  - `criteriosElegibilidade` (Json)
  - `rendaMaxima`, `rendaMinima`
  - `documentosNecessarios` (array)
  - `beneficiosOferecidos`
  - `prazoAtendimento`
  - `orgaoGestor`, `legislacao`
  - `dataInicioInscricoes`, `dataFimInscricoes`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Gestão unificada de programas
  - Critérios transparentes
  - Controle de inscritos
  - Relatórios de impacto

#### 🌱 **PROGRAMAS AMBIENTAIS**
- **Tabela Proposta:** `ProgramaAmbiental`
- **Serviços que Usam:**
  - EDUCACAO_AMBIENTAL (campo: `nomePrograma`)
  - COLETA_SELETIVA (campo: `programaColeta`)
  - PLANTIO_ARVORES (campo: `programaPlantio`)
  - RECICLAGEM (campo: `tipoPrograma`)
- **Frequência:** 4 serviços (MÉDIA PRIORIDADE)
- **Campos da Tabela:**
  - `id`, `nome`, `descricao`, `tipo`
  - `objetivos`, `metasAnuais`
  - `publicoAlvo`
  - `parcerias` (array)
  - `recursosNecessarios`
  - `indicadoresMonitoramento` (Json)
  - `dataInicio`, `dataFim`
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Gestão de programas ambientais
  - Monitoramento de metas
  - Relatórios de impacto
  - Educação ambiental

### 1.5 DOCUMENTOS E LICENÇAS

#### 📄 **TIPOS DE DOCUMENTOS**
- **Tabela Proposta:** `TipoDocumento`
- **Descrição:** Centralizar todos os tipos de documentos solicitados em diferentes serviços
- **Campos da Tabela:**
  - `id`, `nome`, `descricao`
  - `categoria` (Identificação, Comprovante, Declaração, etc.)
  - `formatosAceitos` (PDF, JPG, PNG)
  - `tamanhoMaximo` (MB)
  - `requisitosPadrao` (texto)
  - `validadeDocumento` (dias)
  - `isActive`, `createdAt`, `updatedAt`
- **Benefícios:**
  - Validação automática de documentos
  - Padronização de requisitos
  - Controle de validade
  - Menor retrabalho

---

## 2. ANÁLISE DO SISTEMA ATUAL

### 2.1 Arquitetura de Dados

#### **Sistema de Protocolos**
O DigiUrban utiliza um modelo simplificado de protocolos com a seguinte estrutura:

```typescript
model ProtocolSimplified {
  id          String         @id
  number      String         @unique
  title       String
  description String?
  status      ProtocolStatus
  
  // Relacionamentos principais
  citizenId    String
  serviceId    String
  departmentId String
  
  // ⚠️ PONTO CRÍTICO: customData armazena JSON livre
  customData Json?
  moduleType String? // Para roteamento
  
  // Geolocalização
  latitude  Float?
  longitude Float?
  address   String?
  
  // Documentos
  documents   Json?
  attachments String?
  
  // Gestão
  assignedUserId String?
  createdById    String?
  
  // Timestamps
  createdAt   DateTime
  updatedAt   DateTime
  dueDate     DateTime?
  concludedAt DateTime?
}
```

**Problemas Identificados:**
1. **customData como Json livre**: Qualquer dado do formulário é armazenado como JSON sem validação de schema
2. **Sem relacionamentos**: Não há FK para unidades de saúde, escolas, programas, etc.
3. **Sem validação**: Valores de texto livre podem conter inconsistências (ex: "UBS Centro" vs "Ubs Centro" vs "UBS do Centro")
4. **Sem integridade referencial**: Se uma unidade muda de nome, protocolos antigos ficam com dados desatualizados
5. **Dificuldade de consultas**: Não é possível fazer JOIN ou filtros eficientes em campos JSON
6. **Sem controle de dados**: Administrador não pode gerenciar listas de unidades, programas, etc.

### 2.2 Tipos de Serviços

O sistema possui dois tipos de serviços:

#### **COM_DADOS (Services with Data Capture)**
- Capturam dados estruturados via `formSchema` (JSON Schema)
- Armazenam dados em `Protocol.customData` como **entidade virtual**
- Possuem `moduleType` para roteamento
- Fluxo: Cidadão preenche formulário → Cria Protocol → Dados em customData → Aguarda aprovação → Entidade virtual ativa

**Exemplo:** CONSULTA_MEDICA
```json
{
  "customData": {
    "unidadeSaude": "UBS Centro",
    "especialidade": "Cardiologia", 
    "dataPreferencial": "2025-12-01",
    "_meta": {
      "entityType": "CONSULTA_MEDICA",
      "status": "PENDING_APPROVAL",
      "isActive": false
    }
  }
}
```

**Problema:** `unidadeSaude` é TEXT livre, não referencia tabela `UnidadeSaude`

#### **SEM_DADOS (Services without Data)**
- Apenas protocolo de acompanhamento
- Não capturam dados estruturados
- Não possuem `moduleType`
- Fluxo: Cidadão solicita → Cria Protocol → Servidor atende

**Exemplo:** Pedido genérico de informação

### 2.3 Geração de Módulos e Workflow

#### **Protocol-Module Service**
Arquivo: `/backend/src/services/protocol-module.service.ts`

**Processo de Criação:**
1. Cidadão preenche formulário baseado em `Service.formSchema`
2. Sistema valida dados contra JSON Schema
3. Cria `ProtocolSimplified` com:
   - `customData`: Dados do formulário + metadados `_meta`
   - `moduleType`: Tipo do módulo (ex: CONSULTA_MEDICA)
   - `status`: VINCULADO (aguardando processamento)
4. Aplica workflow se houver `ModuleWorkflow` configurado
5. Cria SLA baseado no workflow

**Código Relevante:**
```typescript
const customDataPayload = isComDados && service.moduleType
  ? {
      // Dados do formulário (SEM validação de FK!)
      ...formData,
      // Metadados da entidade virtual
      _meta: {
        entityType: service.moduleType,
        status: 'PENDING_APPROVAL',
        isActive: false,
        createdAt: new Date().toISOString()
      }
    }
  : formData;
```

**Problema:** `formData` pode conter `{unidadeSaude: "UBS Centro"}` como texto livre

#### **Module Workflow Service**
Arquivo: `/backend/src/services/module-workflow.service.ts`

Define workflows com etapas (stages) para cada `moduleType`:

```typescript
interface WorkflowStage {
  name: string;
  order: number;
  slaDays?: number;
  requiredDocuments?: string[];
  requiredActions?: string[];
  canSkip?: boolean;
}
```

**Problema:** Mesmo com workflow, os dados em customData não são normalizados

#### **Custom Modules System**
Arquivo: `/backend/src/routes/custom-modules.ts`

Permite criar tabelas customizadas:
- CRUD de `CustomDataTable` (schema dinâmico)
- CRUD de `CustomDataRecord` (registros JSON)

**Problema:** 
- Sistema paralelo ao de protocolos
- Não integrado com formSchema dos serviços
- Tabelas customizadas não são usadas como FK nos protocolos

### 2.4 FormSchema Structure

Cada serviço COM_DADOS possui um `formSchema` em JSON Schema:

```typescript
formSchema: {
  type: 'object',
  required: ['unidadeSaude', 'especialidade'],
  properties: {
    // ⚠️ CAMPO TEXT - Deveria ser FK para UnidadeSaude
    unidadeSaude: {
      type: 'string',
      title: 'Unidade de Saúde',
      enum: ['UBS Centro', 'UBS Norte', 'Hospital Municipal']
    },
    
    // ⚠️ CAMPO TEXT - Deveria ser FK para Especialidade
    especialidade: {
      type: 'string',
      title: 'Especialidade Médica',
      enum: ['Clínico Geral', 'Cardiologia', 'Pediatria']
    },
    
    dataPreferencial: {
      type: 'string',
      format: 'date',
      title: 'Data Preferencial'
    }
  }
}
```

**Problemas:**
1. **Enums hardcoded**: Lista de unidades fixas no código
2. **Sem CRUD de opções**: Admin não pode adicionar novas unidades sem alterar código
3. **Duplicação**: Mesmas unidades repetidas em múltiplos serviços
4. **Inconsistência**: "UBS Centro" em um serviço, "Centro de Saúde" em outro

### 2.5 Pontos de Integração

Para implementar dados auxiliares, seria necessário modificar:

1. **Schema Prisma**: Adicionar tabelas auxiliares (UnidadeSaude, Escola, etc.)
2. **Seeds**: Popular tabelas auxiliares iniciais
3. **FormSchema**: Mudar de `enum: [...]` para relacionamento dinâmico
4. **Frontend**: Criar CRUDs administrativos para cada tabela auxiliar
5. **API**: Endpoints para listar opções dinâmicas (ex: GET /api/unidades-saude)
6. **Protocol Creation**: Validar FK ao invés de aceitar texto livre
7. **Reports**: Queries JOIN para relatórios agregados

---

## 3. OPORTUNIDADES PRIORITIZADAS

### 3.1 NÍVEL 1 - PRIORIDADE CRÍTICA (Implementar Primeiro)

Maior impacto, afeta múltiplos serviços, baixa complexidade relativa:

#### **1.1 Unidades de Saúde** ⭐⭐⭐⭐⭐
- **Impacto:** 8 serviços
- **Benefício:** Gestão centralizada, relatórios de demanda, otimização de agenda
- **Complexidade:** MÉDIA (requer CRUD + integração com 8 formSchemas)
- **ROI:** MUITO ALTO
- **Ordem:** 1º

#### **1.2 Escolas** ⭐⭐⭐⭐⭐
- **Impacto:** 9 serviços
- **Benefício:** Controle de vagas, gestão de transferências, planejamento educacional
- **Complexidade:** MÉDIA
- **ROI:** MUITO ALTO
- **Ordem:** 2º

#### **1.3 CRAS (Centros de Referência de Assistência Social)** ⭐⭐⭐⭐⭐
- **Impacto:** 6 serviços
- **Benefício:** Distribuição equitativa, controle territorial, planejamento social
- **Complexidade:** BAIXA
- **ROI:** MUITO ALTO
- **Ordem:** 3º

#### **1.4 Programas Sociais** ⭐⭐⭐⭐⭐
- **Impacto:** 5+ serviços
- **Benefício:** Critérios centralizados, relatórios de cobertura, transparência
- **Complexidade:** MÉDIA
- **ROI:** MUITO ALTO
- **Ordem:** 4º

#### **1.5 Tipos de Obras e Serviços** ⭐⭐⭐⭐
- **Impacto:** 6+ serviços
- **Benefício:** Padronização, estimativas, planejamento de recursos
- **Complexidade:** BAIXA
- **ROI:** ALTO
- **Ordem:** 5º

### 3.2 NÍVEL 2 - PRIORIDADE ALTA (Implementar em Seguida)

Impacto significativo, complexidade moderada:

#### **2.1 Espaços Esportivos** ⭐⭐⭐⭐
- **Impacto:** 7 serviços
- **Benefício:** Agendamento inteligente, controle de ocupação
- **Complexidade:** MÉDIA (requer sistema de agendamento)
- **ROI:** ALTO
- **Ordem:** 6º

#### **2.2 Espaços Culturais** ⭐⭐⭐⭐
- **Impacto:** 7 serviços
- **Benefício:** Agenda cultural, gestão de eventos
- **Complexidade:** MÉDIA
- **ROI:** ALTO
- **Ordem:** 7º

#### **2.3 Especialidades Médicas** ⭐⭐⭐⭐
- **Impacto:** 4 serviços
- **Benefício:** Gestão de agenda especializada, controle de demanda
- **Complexidade:** MÉDIA (integração com agenda médica)
- **ROI:** ALTO
- **Ordem:** 8º

#### **2.4 Cursos Profissionalizantes** ⭐⭐⭐⭐
- **Impacto:** 4 serviços
- **Benefício:** Gestão de turmas, certificados automáticos
- **Complexidade:** MÉDIA
- **ROI:** ALTO
- **Ordem:** 9º

#### **2.5 Programas Habitacionais** ⭐⭐⭐⭐
- **Impacto:** 4 serviços
- **Benefício:** Gestão unificada, controle de inscritos
- **Complexidade:** MÉDIA
- **ROI:** ALTO
- **Ordem:** 10º

### 3.3 NÍVEL 3 - PRIORIDADE MÉDIA (Implementar Posteriormente)

Impacto moderado, pode ser implementado após prioridades críticas:

#### **3.1 Conjuntos Habitacionais** ⭐⭐⭐
- **Impacto:** 4 serviços
- **Benefício:** Controle de vagas habitacionais
- **Complexidade:** MÉDIA
- **ROI:** MÉDIO
- **Ordem:** 11º

#### **3.2 Tipos de Produção Agrícola** ⭐⭐⭐
- **Impacto:** 4 serviços
- **Benefício:** Planejamento agrícola
- **Complexidade:** BAIXA
- **ROI:** MÉDIO
- **Ordem:** 12º

#### **3.3 Máquinas Agrícolas** ⭐⭐⭐
- **Impacto:** 3 serviços
- **Benefício:** Controle de frota, agenda de uso
- **Complexidade:** MÉDIA (requer sistema de agendamento)
- **ROI:** MÉDIO
- **Ordem:** 13º

#### **3.4 Espécies de Árvores** ⭐⭐⭐
- **Impacto:** 4 serviços
- **Benefício:** Planejamento de arborização
- **Complexidade:** BAIXA
- **ROI:** MÉDIO
- **Ordem:** 14º

#### **3.5 Viaturas de Segurança** ⭐⭐⭐
- **Impacto:** 4 serviços
- **Benefício:** Controle de frota
- **Complexidade:** MÉDIA
- **ROI:** MÉDIO
- **Ordem:** 15º

#### **3.6 Parques e Praças** ⭐⭐⭐
- **Impacto:** 4 serviços
- **Benefício:** Planejamento de manutenção
- **Complexidade:** BAIXA
- **ROI:** MÉDIO
- **Ordem:** 16º

#### **3.7 Tipos de Estabelecimentos Turísticos** ⭐⭐⭐
- **Impacto:** 3 serviços
- **Benefício:** Controle do trade turístico
- **Complexidade:** BAIXA
- **ROI:** MÉDIO
- **Ordem:** 17º

#### **3.8 Modalidades Esportivas** ⭐⭐⭐
- **Impacto:** 4 serviços
- **Benefício:** Planejamento de escolinhas
- **Complexidade:** BAIXA
- **ROI:** MÉDIO
- **Ordem:** 18º

#### **3.9 Tipos de Atividades Culturais** ⭐⭐⭐
- **Impacto:** 4 serviços
- **Benefício:** Planejamento de oficinas
- **Complexidade:** BAIXA
- **ROI:** MÉDIO
- **Ordem:** 19º

#### **3.10 Tipos de Ocorrências** ⭐⭐⭐
- **Impacto:** 3 serviços
- **Benefício:** Estatísticas criminais
- **Complexidade:** BAIXA
- **ROI:** MÉDIO
- **Ordem:** 20º

#### **3.11 Programas Ambientais** ⭐⭐⭐
- **Impacto:** 4 serviços
- **Benefício:** Monitoramento de metas ambientais
- **Complexidade:** MÉDIA
- **ROI:** MÉDIO
- **Ordem:** 21º

### 3.4 NÍVEL 4 - PRIORIDADE BAIXA (Implementar por Último)

Menor impacto ou maior complexidade:

#### **4.1 Profissionais de Saúde** ⭐⭐
- **Impacto:** 4 serviços
- **Benefício:** Agenda médica inteligente
- **Complexidade:** ALTA (integração complexa com agenda)
- **ROI:** BAIXO-MÉDIO
- **Ordem:** 22º

#### **4.2 Professores e Instrutores** ⭐⭐
- **Impacto:** 4 serviços
- **Benefício:** Gestão de instrutores
- **Complexidade:** MÉDIA
- **ROI:** BAIXO-MÉDIO
- **Ordem:** 23º

#### **4.3 Guias Turísticos** ⭐
- **Impacto:** 3 serviços
- **Benefício:** Controle de guias credenciados
- **Complexidade:** BAIXA
- **ROI:** BAIXO
- **Ordem:** 24º

#### **4.4 Tipos de Documentos** ⭐⭐
- **Impacto:** Transversal (todos serviços)
- **Benefício:** Validação automática
- **Complexidade:** ALTA (requer refatoração de todo sistema de documentos)
- **ROI:** BAIXO-MÉDIO (benefício a longo prazo)
- **Ordem:** 25º

### 3.5 Matriz de Priorização (Esforço x Impacto)

```
IMPACTO ALTO + ESFORÇO BAIXO (Quick Wins):
- CRAS ✓
- Tipos de Obras ✓
- Espécies de Árvores ✓
- Tipos de Produção Agrícola ✓

IMPACTO ALTO + ESFORÇO ALTO (Projetos Estratégicos):
- Unidades de Saúde ✓✓✓
- Escolas ✓✓✓
- Programas Sociais ✓✓
- Especialidades Médicas ✓✓

IMPACTO MÉDIO + ESFORÇO BAIXO (Melhorias Rápidas):
- Modalidades Esportivas ✓
- Tipos de Atividades Culturais ✓
- Tipos de Ocorrências ✓
- Tipos de Estabelecimentos Turísticos ✓

IMPACTO MÉDIO + ESFORÇO MÉDIO (Projetos Táticos):
- Espaços Esportivos ✓
- Espaços Culturais ✓
- Cursos Profissionalizantes ✓
- Programas Habitacionais ✓
- Máquinas Agrícolas ✓

IMPACTO BAIXO (Backlog):
- Guias Turísticos
- Tipos de Documentos (requer refatoração grande)
```

---

## 4. RECOMENDAÇÕES DE IMPLEMENTAÇÃO

### 4.1 Abordagem Gradual (Recomendado)

**FASE 1 - Quick Wins (1-2 meses)**
1. CRAS (6 serviços)
2. Tipos de Obras (6 serviços)
3. Espécies de Árvores (4 serviços)
4. Tipos de Produção Agrícola (4 serviços)

**Entregáveis:**
- 4 tabelas auxiliares com CRUD
- 20 serviços migrados
- CRUDs administrativos
- Relatórios básicos

**FASE 2 - Prioridades Críticas (2-3 meses)**
1. Unidades de Saúde (8 serviços)
2. Escolas (9 serviços)
3. Programas Sociais (5 serviços)

**Entregáveis:**
- 3 tabelas auxiliares complexas
- 22 serviços migrados
- Integração com geolocalização
- Relatórios avançados

**FASE 3 - Alta Prioridade (2-3 meses)**
1. Espaços Esportivos (7 serviços)
2. Espaços Culturais (7 serviços)
3. Especialidades Médicas (4 serviços)
4. Cursos Profissionalizantes (4 serviços)
5. Programas Habitacionais (4 serviços)

**Entregáveis:**
- 5 tabelas auxiliares
- 26 serviços migrados
- Sistema de agendamento
- Gestão de turmas

**FASE 4 - Média Prioridade (3-4 meses)**
- Implementar oportunidades de NÍVEL 3 conforme demanda

**FASE 5 - Baixa Prioridade (4+ meses)**
- Implementar oportunidades de NÍVEL 4 se houver recursos

### 4.2 Arquitetura Técnica Sugerida

#### **Opção A: Migração Completa para Tabelas Relacionais**
- **Prós:** Máxima integridade de dados, queries eficientes, relatórios complexos
- **Contras:** Requer migração de dados existentes, mais tempo de desenvolvimento
- **Recomendado para:** Prioridades CRÍTICAS e ALTAS (UnidadeSaude, Escola, etc.)

**Estrutura:**
```prisma
model UnidadeSaude {
  id        String  @id
  nome      String
  tipo      String
  endereco  String
  latitude  Float?
  longitude Float?
  isActive  Boolean
  
  // Relacionamentos
  consultas    ConsultaMedica[]
  protocolos   Protocol[] @relation("UnidadeSaudeProtocols")
}

model ConsultaMedica {
  id               String  @id
  protocolId       String  @unique
  unidadeSaudeId   String  // FK!
  especialidadeId  String  // FK!
  dataPreferencial DateTime
  
  protocol        Protocol         @relation(...)
  unidadeSaude    UnidadeSaude     @relation(...)
  especialidade   Especialidade    @relation(...)
}
```

#### **Opção B: Híbrido com Validação de customData**
- **Prós:** Menor impacto em código existente, migração gradual
- **Contras:** Menos benefícios, ainda usa JSON
- **Recomendado para:** Prioridades MÉDIAS e BAIXAS

**Estrutura:**
```typescript
// Tabela auxiliar existe
model UnidadeSaude {
  id   String
  nome String
}

// Protocol continua com customData, mas valida FK
Protocol.customData = {
  unidadeSaudeId: "uuid-123",  // Validado contra UnidadeSaude
  especialidadeId: "uuid-456"   // Validado contra Especialidade
}
```

#### **Opção C: Aproveitar Custom Modules Existente**
- **Prós:** Sistema já implementado, usa infraestrutura existente
- **Contras:** Não resolve problema de FK em protocolos
- **Recomendado para:** Testes e protótipos

### 4.3 Checklist de Implementação (por tabela auxiliar)

Para cada tabela auxiliar a ser implementada:

**Backend:**
- [ ] Criar model no schema.prisma
- [ ] Gerar migration
- [ ] Criar seed com dados iniciais
- [ ] Criar service (CRUD)
- [ ] Criar routes (API REST)
- [ ] Adicionar validações
- [ ] Criar testes unitários
- [ ] Criar testes de integração

**Frontend:**
- [ ] Criar página de listagem (admin)
- [ ] Criar formulário de criação/edição (admin)
- [ ] Criar componente de seleção (dropdown)
- [ ] Integrar com formSchemas dos serviços
- [ ] Adicionar filtros e busca
- [ ] Adicionar validações frontend

**Migração:**
- [ ] Script de migração de dados existentes
- [ ] Atualizar formSchemas dos serviços afetados
- [ ] Testar fluxo completo (cidadão → protocolo → admin)
- [ ] Documentação

**Relatórios:**
- [ ] Queries agregadas (ex: protocolos por unidade)
- [ ] Dashboards administrativos
- [ ] Exportação de dados

---

## 5. IMPACTO ESTIMADO

### 5.1 Benefícios Quantitativos

**Redução de Inconsistências:**
- Atual: ~30% de dados com inconsistências (estimativa)
- Após implementação: <5% (validação de FK)

**Tempo de Cadastro de Novos Serviços:**
- Atual: 4-8 horas (incluindo hardcoding de enums)
- Após: 1-2 horas (usa tabelas auxiliares existentes)

**Tempo de Atualização de Listas:**
- Atual: 2-4 horas (alterar código, deploy)
- Após: 5-10 minutos (CRUD administrativo)

**Qualidade de Relatórios:**
- Atual: Limitados (queries em JSON)
- Após: Complexos (JOINs, agregações, filtros avançados)

### 5.2 Benefícios Qualitativos

**Para Administradores:**
- Gestão autônoma de dados mestres (sem precisar de dev)
- Relatórios gerenciais precisos
- Planejamento baseado em dados reais
- Controle de capacidade e recursos

**Para Desenvolvedores:**
- Código mais limpo e manutenível
- Menos bugs por inconsistências
- Facilidade de criar novos serviços
- Testes mais confiáveis

**Para Cidadãos:**
- Formulários mais intuitivos (autocomplete)
- Menos erros de preenchimento
- Melhor experiência de busca

**Para o Município:**
- Transparência e accountability
- Dados para políticas públicas
- Otimização de recursos
- Compliance com LGPD (dados estruturados)

---

## 6. RISCOS E MITIGAÇÕES

### 6.1 Riscos Técnicos

**RISCO 1: Migração de Dados Existentes**
- **Probabilidade:** Alta
- **Impacto:** Alto
- **Mitigação:** 
  - Scripts de migração testados
  - Backup antes de migração
  - Validação manual de dados críticos
  - Rollback plan

**RISCO 2: Breaking Changes em Serviços Existentes**
- **Probabilidade:** Média
- **Impacto:** Alto
- **Mitigação:**
  - Manter compatibilidade retroativa temporária
  - Testes de regressão completos
  - Deploy gradual por departamento
  - Feature flags

**RISCO 3: Performance de Queries**
- **Probabilidade:** Baixa
- **Impacto:** Médio
- **Mitigação:**
  - Índices adequados em FK
  - Cache de dados estáveis
  - Paginação em listagens
  - Monitoramento de performance

### 6.2 Riscos de Negócio

**RISCO 4: Resistência de Usuários Administrativos**
- **Probabilidade:** Média
- **Impacto:** Médio
- **Mitigação:**
  - Treinamento antes do lançamento
  - Interface intuitiva
  - Suporte dedicado
  - Importação de dados legacy

**RISCO 5: Tempo de Implementação Subestimado**
- **Probabilidade:** Alta
- **Impacto:** Médio
- **Mitigação:**
  - Buffer de 30% no cronograma
  - Priorização rigorosa
  - MVPs por fase
  - Equipe dedicada

---

## 7. CONCLUSÃO

O sistema DigiUrban possui **ENORME POTENCIAL DE MELHORIA** através da normalização de dados auxiliares. 

**Principais Achados:**
- ✅ Identificadas **25+ oportunidades** de dados auxiliares
- ✅ **100+ serviços** podem se beneficiar (de 13 departamentos)
- ✅ Maior impacto: **Unidades de Saúde (8 serviços)** e **Escolas (9 serviços)**
- ✅ Quick wins: **CRAS, Tipos de Obras, Espécies de Árvores**

**Recomendação Final:**
Implementar de forma **GRADUAL**, começando pelos **Quick Wins** (Fase 1) para gerar valor rápido, seguido pelas **Prioridades Críticas** (Fase 2) para máximo impacto.

**Próximos Passos:**
1. Validar priorização com stakeholders
2. Definir equipe e cronograma detalhado
3. Iniciar Fase 1 (Quick Wins)
4. Monitorar resultados e ajustar roadmap

---

**FIM DO RELATÓRIO**

*Este documento analisou TODOS os 13 arquivos de serviços do DigiUrban e identificou cada oportunidade de normalização de dados. Nenhum arquivo ou campo foi omitido.*
