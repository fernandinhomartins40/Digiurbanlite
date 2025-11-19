-- CreateEnum
CREATE TYPE "ConsultaStatus" AS ENUM ('AGENDADA', 'CONFIRMADA', 'REALIZADA', 'FALTOU', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoAtendimento" AS ENUM ('URGENCIA', 'ELETIVO', 'RETORNO');

-- CreateEnum
CREATE TYPE "AtendimentoStatus" AS ENUM ('AGUARDANDO_CHECKIN', 'CHECKIN_REALIZADO', 'AGUARDANDO_TRIAGEM', 'EM_TRIAGEM', 'TRIAGEM_CONCLUIDA', 'AGUARDANDO_MEDICO', 'EM_CONSULTA', 'CONSULTA_CONCLUIDA', 'AGUARDANDO_FARMACIA', 'EM_FARMACIA', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "ClassificacaoRisco" AS ENUM ('AZUL', 'VERDE', 'AMARELO', 'LARANJA', 'VERMELHO');

-- CreateEnum
CREATE TYPE "TipoExame" AS ENUM ('LABORATORIAL', 'IMAGEM', 'PROCEDIMENTO');

-- CreateEnum
CREATE TYPE "StatusExame" AS ENUM ('SOLICITADO', 'AGENDADO', 'REALIZADO', 'LAUDADO', 'ENTREGUE');

-- CreateEnum
CREATE TYPE "TipoMedicamento" AS ENUM ('GENERICO', 'REFERENCIA', 'SIMILAR', 'MANIPULADO');

-- CreateEnum
CREATE TYPE "UnidadeMedida" AS ENUM ('COMPRIMIDO', 'CAPSULA', 'ML', 'MG', 'G', 'FRASCO', 'AMPOLA', 'BISNAGA', 'ENVELOPE');

-- CreateEnum
CREATE TYPE "StatusEstoque" AS ENUM ('DISPONIVEL', 'ESTOQUE_BAIXO', 'ESGOTADO', 'VENCIDO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "StatusDispensacao" AS ENUM ('AGUARDANDO', 'EM_SEPARACAO', 'DISPENSADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TFDStatus" AS ENUM ('AGUARDANDO_ANALISE_DOCUMENTAL', 'DOCUMENTACAO_PENDENTE', 'AGUARDANDO_REGULACAO_MEDICA', 'APROVADO_REGULACAO', 'AGUARDANDO_APROVACAO_GESTAO', 'AGENDADO', 'EM_VIAGEM', 'REALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "MeioPagamento" AS ENUM ('DEPOSITO', 'TRANSFERENCIA', 'CARTAO_PREPAGO');

-- CreateEnum
CREATE TYPE "StatusVeiculo" AS ENUM ('DISPONIVEL', 'EM_USO', 'MANUTENCAO', 'INDISPONIVEL');

-- CreateEnum
CREATE TYPE "MatriculaStatus" AS ENUM ('INSCRITO_AGUARDANDO_VALIDACAO', 'DOCUMENTACAO_PENDENTE', 'DOCUMENTOS_VALIDADOS', 'VAGA_ATRIBUIDA', 'LISTA_ESPERA', 'CONFIRMADA', 'MATRICULADO', 'CANCELADA', 'TRANSFERIDO');

-- CreateEnum
CREATE TYPE "TipoTurma" AS ENUM ('REGULAR', 'EJA', 'INTEGRAL');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL');

-- CreateEnum
CREATE TYPE "StatusRota" AS ENUM ('ATIVA', 'INATIVA', 'EM_REVISAO');

-- CreateEnum
CREATE TYPE "TipoParada" AS ENUM ('IDA', 'VOLTA', 'AMBOS');

-- CreateEnum
CREATE TYPE "CadUnicoStatus" AS ENUM ('AGENDADO', 'AGUARDANDO_ENTREVISTA', 'EM_ENTREVISTA', 'DOCUMENTOS_VALIDADOS', 'AGUARDANDO_ANALISE', 'APROVADO', 'CADASTRADO', 'ATIVO', 'INATIVO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "GrauParentesco" AS ENUM ('RESPONSAVEL_FAMILIAR', 'CONJUGE', 'FILHO', 'PAI', 'MAE', 'IRMAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "SituacaoTrabalho" AS ENUM ('EMPREGADO_CARTEIRA', 'EMPREGADO_SEM_CARTEIRA', 'AUTONOMO', 'DESEMPREGADO', 'APOSENTADO', 'PENSIONISTA', 'NAO_TRABALHA');

-- CreateEnum
CREATE TYPE "ProgramaSocialStatus" AS ENUM ('AGUARDANDO_ANALISE', 'DOCUMENTACAO_PENDENTE', 'APROVADO', 'ATIVO', 'SUSPENSO', 'CANCELADO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('AGUARDANDO', 'PROCESSANDO', 'PAGO', 'FALHOU', 'CANCELADO');

-- CreateEnum
CREATE TYPE "MaquinaStatus" AS ENUM ('DISPONIVEL', 'EMPRESTADA', 'MANUTENCAO', 'INATIVA');

-- CreateEnum
CREATE TYPE "EmprestimoMaquinaStatus" AS ENUM ('SOLICITADO', 'CADASTRO_VALIDADO', 'APROVADO_TECNICO', 'APROVADO', 'EMPRESTIMO_ATIVO', 'DEVOLVIDO', 'FINALIZADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "agenda_medica" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "tempoPorConsulta" INTEGER NOT NULL,
    "vagasDisponiveis" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_medica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulta_agendada" (
    "id" TEXT NOT NULL,
    "agendaId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "status" "ConsultaStatus" NOT NULL DEFAULT 'AGENDADA',
    "motivoConsulta" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "canceladoPor" TEXT,
    "motivoCancelamento" TEXT,

    CONSTRAINT "consulta_agendada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimento_medico" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "tipo" "TipoAtendimento" NOT NULL,
    "status" "AtendimentoStatus" NOT NULL DEFAULT 'AGUARDANDO_CHECKIN',
    "prioridade" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalizadoEm" TIMESTAMP(3),

    CONSTRAINT "atendimento_medico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triagem_enfermagem" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "enfermeiroId" TEXT NOT NULL,
    "pressaoArterial" TEXT,
    "frequenciaCardiaca" INTEGER,
    "temperatura" DOUBLE PRECISION,
    "saturacaoOxigenio" DOUBLE PRECISION,
    "peso" DOUBLE PRECISION,
    "altura" DOUBLE PRECISION,
    "classificacaoRisco" "ClassificacaoRisco" NOT NULL,
    "queixaPrincipal" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triagem_enfermagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulta_medica" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "anamnese" TEXT,
    "examesFisicos" TEXT,
    "hipoteseDiagnostica" TEXT,
    "diagnosticos" JSONB,
    "conduta" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulta_medica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescricao" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "medicamentoId" TEXT,
    "medicamentoTexto" TEXT,
    "dosagem" TEXT NOT NULL,
    "frequencia" TEXT NOT NULL,
    "duracao" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exame_solicitado" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "tipo" "TipoExame" NOT NULL,
    "descricao" TEXT NOT NULL,
    "justificativa" TEXT,
    "status" "StatusExame" NOT NULL DEFAULT 'SOLICITADO',
    "dataAgendamento" TIMESTAMP(3),
    "dataRealizacao" TIMESTAMP(3),
    "laudo" TEXT,
    "arquivoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exame_solicitado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atestado" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "cid" TEXT,
    "diasAfastamento" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atestado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "principioAtivo" TEXT NOT NULL,
    "tipo" "TipoMedicamento" NOT NULL,
    "unidadeMedida" "UnidadeMedida" NOT NULL,
    "concentracao" TEXT,
    "fabricante" TEXT,
    "codigoBarras" TEXT,
    "isControlado" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque_medicamento" (
    "id" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "quantidadeAtual" INTEGER NOT NULL,
    "quantidadeMinima" INTEGER NOT NULL,
    "quantidadeMaxima" INTEGER NOT NULL,
    "dataFabricacao" TIMESTAMP(3),
    "dataValidade" TIMESTAMP(3) NOT NULL,
    "status" "StatusEstoque" NOT NULL DEFAULT 'DISPONIVEL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoque_medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispensacao_medicamento" (
    "id" TEXT NOT NULL,
    "prescricaoId" TEXT,
    "atendimentoId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "farmaceuticoId" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "estoqueId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "status" "StatusDispensacao" NOT NULL DEFAULT 'AGUARDANDO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispensadoEm" TIMESTAMP(3),

    CONSTRAINT "dispensacao_medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacao_tfd" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "procedimento" TEXT NOT NULL,
    "justificativaMedica" TEXT NOT NULL,
    "medicoSolicitante" TEXT NOT NULL,
    "status" "TFDStatus" NOT NULL DEFAULT 'AGUARDANDO_ANALISE_DOCUMENTAL',
    "prioridade" INTEGER NOT NULL DEFAULT 0,
    "documentosAnexados" JSONB,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacao_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viagem_tfd" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "unidadeDestino" TEXT NOT NULL,
    "dataAgendamento" TIMESTAMP(3) NOT NULL,
    "dataRetornoPrevisto" TIMESTAMP(3),
    "dataRetornoReal" TIMESTAMP(3),
    "veiculoId" TEXT,
    "motoristaId" TEXT,
    "acompanhante" JSONB,
    "valorDespesas" DOUBLE PRECISION,
    "comprovanteDespesas" JSONB,
    "mecanismoPagamento" "MeioPagamento",
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viagem_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculo_tfd" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "ano" INTEGER,
    "status" "StatusVeiculo" NOT NULL DEFAULT 'DISPONIVEL',
    "kmAtual" INTEGER,
    "ultimaManutencao" TIMESTAMP(3),
    "proximaManutencao" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veiculo_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motorista_tfd" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnh" TEXT NOT NULL,
    "categoriaCnh" TEXT NOT NULL,
    "validadeCnh" TIMESTAMP(3) NOT NULL,
    "telefone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motorista_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricao_matricula" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "escolaPreferencia1" TEXT NOT NULL,
    "escolaPreferencia2" TEXT,
    "escolaPreferencia3" TEXT,
    "serie" TEXT NOT NULL,
    "turno" "Turno",
    "tipoTurma" "TipoTurma",
    "necessidadesEspeciais" TEXT,
    "status" "MatriculaStatus" NOT NULL DEFAULT 'INSCRITO_AGUARDANDO_VALIDACAO',
    "documentosAnexados" JSONB,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscricao_matricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matricula" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "numeroMatricula" TEXT NOT NULL,
    "dataMatricula" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "situacao" TEXT NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "turno" "Turno" NOT NULL,
    "tipo" "TipoTurma" NOT NULL,
    "ano" INTEGER NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "vagasOcupadas" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculo_escolar" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "ano" INTEGER,
    "status" "StatusVeiculo" NOT NULL DEFAULT 'DISPONIVEL',
    "kmAtual" INTEGER,
    "ultimaManutencao" TIMESTAMP(3),
    "proximaManutencao" TIMESTAMP(3),
    "acessibilidade" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veiculo_escolar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rota_escolar" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "turno" "Turno" NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "monitorId" TEXT,
    "status" "StatusRota" NOT NULL DEFAULT 'ATIVA',
    "distanciaTotal" DOUBLE PRECISION,
    "tempoEstimado" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rota_escolar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parada_rota" (
    "id" TEXT NOT NULL,
    "rotaId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "endereco" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "tipo" "TipoParada" NOT NULL,
    "horarioEstimado" TEXT NOT NULL,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parada_rota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aluno_rota" (
    "id" TEXT NOT NULL,
    "rotaId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "paradaId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aluno_rota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadunico_familia" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "responsavelFamiliarId" TEXT NOT NULL,
    "numeroNIS" TEXT,
    "numeroCadUnico" TEXT,
    "endereco" TEXT NOT NULL,
    "rendaFamiliar" DOUBLE PRECISION,
    "status" "CadUnicoStatus" NOT NULL DEFAULT 'AGENDADO',
    "dataEntrevista" TIMESTAMP(3),
    "entrevistadorId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataUltimaAtualizacao" TIMESTAMP(3),

    CONSTRAINT "cadunico_familia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membro_familia" (
    "id" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "grauParentesco" "GrauParentesco" NOT NULL,
    "numeroNIS" TEXT,
    "situacaoTrabalho" "SituacaoTrabalho",
    "rendaIndividual" DOUBLE PRECISION,
    "possuiDeficiencia" BOOLEAN NOT NULL DEFAULT false,
    "tipoDeficiencia" TEXT,
    "frequentaEscola" BOOLEAN,
    "nivelEscolaridade" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membro_familia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricao_programa_social" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "programaId" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "status" "ProgramaSocialStatus" NOT NULL DEFAULT 'AGUARDANDO_ANALISE',
    "documentosAnexados" JSONB,
    "dataAprovacao" TIMESTAMP(3),
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "motivoCancelamento" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscricao_programa_social_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acompanhamento_beneficio" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "assistenteSocialId" TEXT NOT NULL,
    "dataVisita" TIMESTAMP(3) NOT NULL,
    "tipoAcompanhamento" TEXT NOT NULL,
    "condicoesFamiliares" TEXT,
    "necessidadesIdentificadas" TEXT,
    "acoesRealizadas" TEXT,
    "proximaVisita" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acompanhamento_beneficio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento_beneficio" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "mesReferencia" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" "StatusPagamento" NOT NULL DEFAULT 'AGUARDANDO',
    "mecanismoPagamento" "MeioPagamento",
    "comprovante" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamento_beneficio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maquina_agricola_ms" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "fabricante" TEXT,
    "ano" INTEGER,
    "numeroPatrimonio" TEXT,
    "capacidadeOperacional" TEXT,
    "status" "MaquinaStatus" NOT NULL DEFAULT 'DISPONIVEL',
    "horasUso" INTEGER NOT NULL DEFAULT 0,
    "ultimaManutencao" TIMESTAMP(3),
    "proximaManutencao" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maquina_agricola_ms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtor_rural" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "propriedadeNome" TEXT NOT NULL,
    "propriedadeEndereco" TEXT NOT NULL,
    "areaTotalHectares" DOUBLE PRECISION NOT NULL,
    "atividadePrincipal" TEXT NOT NULL,
    "inscricaoEstadual" TEXT,
    "CAR" TEXT,
    "telefoneContato" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtor_rural_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacao_emprestimo_maquina" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "produtorRuralId" TEXT NOT NULL,
    "maquinaId" TEXT NOT NULL,
    "finalidade" TEXT NOT NULL,
    "areaTrabalhada" DOUBLE PRECISION NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "status" "EmprestimoMaquinaStatus" NOT NULL DEFAULT 'SOLICITADO',
    "aprovadoPor" TEXT,
    "dataEmprestimo" TIMESTAMP(3),
    "dataDevolucao" TIMESTAMP(3),
    "condicaoRetirada" TEXT,
    "condicaoDevolucao" TEXT,
    "horasUtilizadas" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacao_emprestimo_maquina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agenda_medica_profissionalId_idx" ON "agenda_medica"("profissionalId");

-- CreateIndex
CREATE INDEX "agenda_medica_unidadeId_idx" ON "agenda_medica"("unidadeId");

-- CreateIndex
CREATE INDEX "consulta_agendada_agendaId_idx" ON "consulta_agendada"("agendaId");

-- CreateIndex
CREATE INDEX "consulta_agendada_citizenId_idx" ON "consulta_agendada"("citizenId");

-- CreateIndex
CREATE INDEX "consulta_agendada_dataHora_idx" ON "consulta_agendada"("dataHora");

-- CreateIndex
CREATE INDEX "consulta_agendada_status_idx" ON "consulta_agendada"("status");

-- CreateIndex
CREATE UNIQUE INDEX "atendimento_medico_workflowId_key" ON "atendimento_medico"("workflowId");

-- CreateIndex
CREATE INDEX "atendimento_medico_citizenId_idx" ON "atendimento_medico"("citizenId");

-- CreateIndex
CREATE INDEX "atendimento_medico_unidadeId_idx" ON "atendimento_medico"("unidadeId");

-- CreateIndex
CREATE INDEX "atendimento_medico_status_idx" ON "atendimento_medico"("status");

-- CreateIndex
CREATE UNIQUE INDEX "triagem_enfermagem_atendimentoId_key" ON "triagem_enfermagem"("atendimentoId");

-- CreateIndex
CREATE INDEX "triagem_enfermagem_enfermeiroId_idx" ON "triagem_enfermagem"("enfermeiroId");

-- CreateIndex
CREATE UNIQUE INDEX "consulta_medica_atendimentoId_key" ON "consulta_medica"("atendimentoId");

-- CreateIndex
CREATE INDEX "consulta_medica_medicoId_idx" ON "consulta_medica"("medicoId");

-- CreateIndex
CREATE INDEX "prescricao_consultaId_idx" ON "prescricao"("consultaId");

-- CreateIndex
CREATE INDEX "prescricao_medicamentoId_idx" ON "prescricao"("medicamentoId");

-- CreateIndex
CREATE INDEX "exame_solicitado_consultaId_idx" ON "exame_solicitado"("consultaId");

-- CreateIndex
CREATE INDEX "exame_solicitado_status_idx" ON "exame_solicitado"("status");

-- CreateIndex
CREATE INDEX "atestado_consultaId_idx" ON "atestado"("consultaId");

-- CreateIndex
CREATE INDEX "medicamento_nome_idx" ON "medicamento"("nome");

-- CreateIndex
CREATE INDEX "estoque_medicamento_medicamentoId_idx" ON "estoque_medicamento"("medicamentoId");

-- CreateIndex
CREATE INDEX "estoque_medicamento_unidadeId_idx" ON "estoque_medicamento"("unidadeId");

-- CreateIndex
CREATE INDEX "estoque_medicamento_status_idx" ON "estoque_medicamento"("status");

-- CreateIndex
CREATE INDEX "dispensacao_medicamento_citizenId_idx" ON "dispensacao_medicamento"("citizenId");

-- CreateIndex
CREATE INDEX "dispensacao_medicamento_status_idx" ON "dispensacao_medicamento"("status");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacao_tfd_workflowId_key" ON "solicitacao_tfd"("workflowId");

-- CreateIndex
CREATE INDEX "solicitacao_tfd_citizenId_idx" ON "solicitacao_tfd"("citizenId");

-- CreateIndex
CREATE INDEX "solicitacao_tfd_status_idx" ON "solicitacao_tfd"("status");

-- CreateIndex
CREATE INDEX "viagem_tfd_solicitacaoId_idx" ON "viagem_tfd"("solicitacaoId");

-- CreateIndex
CREATE INDEX "viagem_tfd_veiculoId_idx" ON "viagem_tfd"("veiculoId");

-- CreateIndex
CREATE INDEX "viagem_tfd_motoristaId_idx" ON "viagem_tfd"("motoristaId");

-- CreateIndex
CREATE UNIQUE INDEX "veiculo_tfd_placa_key" ON "veiculo_tfd"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "motorista_tfd_userId_key" ON "motorista_tfd"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "motorista_tfd_cnh_key" ON "motorista_tfd"("cnh");

-- CreateIndex
CREATE UNIQUE INDEX "inscricao_matricula_workflowId_key" ON "inscricao_matricula"("workflowId");

-- CreateIndex
CREATE INDEX "inscricao_matricula_alunoId_idx" ON "inscricao_matricula"("alunoId");

-- CreateIndex
CREATE INDEX "inscricao_matricula_status_idx" ON "inscricao_matricula"("status");

-- CreateIndex
CREATE UNIQUE INDEX "matricula_inscricaoId_key" ON "matricula"("inscricaoId");

-- CreateIndex
CREATE UNIQUE INDEX "matricula_numeroMatricula_key" ON "matricula"("numeroMatricula");

-- CreateIndex
CREATE INDEX "matricula_turmaId_idx" ON "matricula"("turmaId");

-- CreateIndex
CREATE INDEX "turma_escolaId_idx" ON "turma"("escolaId");

-- CreateIndex
CREATE INDEX "turma_ano_idx" ON "turma"("ano");

-- CreateIndex
CREATE UNIQUE INDEX "veiculo_escolar_placa_key" ON "veiculo_escolar"("placa");

-- CreateIndex
CREATE INDEX "rota_escolar_veiculoId_idx" ON "rota_escolar"("veiculoId");

-- CreateIndex
CREATE INDEX "rota_escolar_motoristaId_idx" ON "rota_escolar"("motoristaId");

-- CreateIndex
CREATE INDEX "parada_rota_rotaId_idx" ON "parada_rota"("rotaId");

-- CreateIndex
CREATE INDEX "aluno_rota_rotaId_idx" ON "aluno_rota"("rotaId");

-- CreateIndex
CREATE INDEX "aluno_rota_alunoId_idx" ON "aluno_rota"("alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "cadunico_familia_workflowId_key" ON "cadunico_familia"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "cadunico_familia_numeroCadUnico_key" ON "cadunico_familia"("numeroCadUnico");

-- CreateIndex
CREATE INDEX "cadunico_familia_responsavelFamiliarId_idx" ON "cadunico_familia"("responsavelFamiliarId");

-- CreateIndex
CREATE INDEX "cadunico_familia_status_idx" ON "cadunico_familia"("status");

-- CreateIndex
CREATE INDEX "membro_familia_familiaId_idx" ON "membro_familia"("familiaId");

-- CreateIndex
CREATE INDEX "membro_familia_citizenId_idx" ON "membro_familia"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "inscricao_programa_social_workflowId_key" ON "inscricao_programa_social"("workflowId");

-- CreateIndex
CREATE INDEX "inscricao_programa_social_programaId_idx" ON "inscricao_programa_social"("programaId");

-- CreateIndex
CREATE INDEX "inscricao_programa_social_familiaId_idx" ON "inscricao_programa_social"("familiaId");

-- CreateIndex
CREATE INDEX "inscricao_programa_social_status_idx" ON "inscricao_programa_social"("status");

-- CreateIndex
CREATE INDEX "acompanhamento_beneficio_inscricaoId_idx" ON "acompanhamento_beneficio"("inscricaoId");

-- CreateIndex
CREATE INDEX "pagamento_beneficio_inscricaoId_idx" ON "pagamento_beneficio"("inscricaoId");

-- CreateIndex
CREATE INDEX "pagamento_beneficio_status_idx" ON "pagamento_beneficio"("status");

-- CreateIndex
CREATE UNIQUE INDEX "maquina_agricola_ms_numeroPatrimonio_key" ON "maquina_agricola_ms"("numeroPatrimonio");

-- CreateIndex
CREATE UNIQUE INDEX "produtor_rural_citizenId_key" ON "produtor_rural"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacao_emprestimo_maquina_workflowId_key" ON "solicitacao_emprestimo_maquina"("workflowId");

-- CreateIndex
CREATE INDEX "solicitacao_emprestimo_maquina_produtorRuralId_idx" ON "solicitacao_emprestimo_maquina"("produtorRuralId");

-- CreateIndex
CREATE INDEX "solicitacao_emprestimo_maquina_maquinaId_idx" ON "solicitacao_emprestimo_maquina"("maquinaId");

-- CreateIndex
CREATE INDEX "solicitacao_emprestimo_maquina_status_idx" ON "solicitacao_emprestimo_maquina"("status");

-- AddForeignKey
ALTER TABLE "consulta_agendada" ADD CONSTRAINT "consulta_agendada_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "agenda_medica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimento_medico" ADD CONSTRAINT "atendimento_medico_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triagem_enfermagem" ADD CONSTRAINT "triagem_enfermagem_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimento_medico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_medica" ADD CONSTRAINT "consulta_medica_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimento_medico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricao" ADD CONSTRAINT "prescricao_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consulta_medica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricao" ADD CONSTRAINT "prescricao_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exame_solicitado" ADD CONSTRAINT "exame_solicitado_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consulta_medica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atestado" ADD CONSTRAINT "atestado_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consulta_medica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_medicamento" ADD CONSTRAINT "estoque_medicamento_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensacao_medicamento" ADD CONSTRAINT "dispensacao_medicamento_prescricaoId_fkey" FOREIGN KEY ("prescricaoId") REFERENCES "prescricao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensacao_medicamento" ADD CONSTRAINT "dispensacao_medicamento_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensacao_medicamento" ADD CONSTRAINT "dispensacao_medicamento_estoqueId_fkey" FOREIGN KEY ("estoqueId") REFERENCES "estoque_medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_tfd" ADD CONSTRAINT "solicitacao_tfd_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viagem_tfd" ADD CONSTRAINT "viagem_tfd_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacao_tfd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viagem_tfd" ADD CONSTRAINT "viagem_tfd_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculo_tfd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viagem_tfd" ADD CONSTRAINT "viagem_tfd_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "motorista_tfd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricao_matricula" ADD CONSTRAINT "inscricao_matricula_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "inscricao_matricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rota_escolar" ADD CONSTRAINT "rota_escolar_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculo_escolar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parada_rota" ADD CONSTRAINT "parada_rota_rotaId_fkey" FOREIGN KEY ("rotaId") REFERENCES "rota_escolar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aluno_rota" ADD CONSTRAINT "aluno_rota_rotaId_fkey" FOREIGN KEY ("rotaId") REFERENCES "rota_escolar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aluno_rota" ADD CONSTRAINT "aluno_rota_paradaId_fkey" FOREIGN KEY ("paradaId") REFERENCES "parada_rota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadunico_familia" ADD CONSTRAINT "cadunico_familia_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membro_familia" ADD CONSTRAINT "membro_familia_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "cadunico_familia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricao_programa_social" ADD CONSTRAINT "inscricao_programa_social_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricao_programa_social" ADD CONSTRAINT "inscricao_programa_social_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "cadunico_familia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamento_beneficio" ADD CONSTRAINT "acompanhamento_beneficio_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "inscricao_programa_social"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_beneficio" ADD CONSTRAINT "pagamento_beneficio_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "inscricao_programa_social"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_emprestimo_maquina" ADD CONSTRAINT "solicitacao_emprestimo_maquina_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_emprestimo_maquina" ADD CONSTRAINT "solicitacao_emprestimo_maquina_produtorRuralId_fkey" FOREIGN KEY ("produtorRuralId") REFERENCES "produtor_rural"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_emprestimo_maquina" ADD CONSTRAINT "solicitacao_emprestimo_maquina_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquina_agricola_ms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;