import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

/**
 * Conversores protocolo→app (Fase 1 do plano de apps).
 * Todos NÃO-FATAIS: falha aqui nunca derruba a criação/aprovação do protocolo
 * (padrão materializeOnApproval / hook TFD). O vínculo é sempre via
 * protocolId @unique na tabela raiz do app — reprocessar é idempotente.
 */

/** moduleType → tipo de processo de licenciamento (convertidos na CRIAÇÃO). */
const LICENCIAMENTO_MODULE_TYPES: Record<string, string> = {
  APROVACAO_PROJETO: 'APROVACAO_PROJETO',
  ALVARA_CONSTRUCAO: 'ALVARA_CONSTRUCAO',
  ALVARA_FUNCIONAMENTO: 'ALVARA_FUNCIONAMENTO',
};

/** moduleType → tipo de processo ambiental (convertidos na CRIAÇÃO). */
const AMBIENTAL_MODULE_TYPES: Record<string, string> = {
  LICENCA_AMBIENTAL: 'LICENCA_AMBIENTAL',
  AUTORIZACAO_PODA_CORTE: 'AUTORIZACAO_PODA_CORTE',
  DENUNCIA_AMBIENTAL: 'DENUNCIA',
  VISTORIA_AMBIENTAL: 'VISTORIA',
};

/** moduleTypes de Habitação que viram inscrição habitacional na CRIAÇÃO. */
const HABITACAO_MODULE_TYPES = new Set([
  'INSCRICAO_PROGRAMA_HABITACIONAL',
  'INSCRICAO_FILA_HABITACAO',
  'SOLICITACAO_AUXILIO_ALUGUEL',
]);

/** moduleType → tipo de ocorrência da Defesa Civil (convertidos na CRIAÇÃO). */
const DEFESA_CIVIL_MODULE_TYPES: Record<string, string> = {
  VISTORIA_AREA_RISCO: 'VISTORIA',
  DENUNCIA_AREA_RISCO: 'AREA_RISCO',
  DENUNCIA_CONSTRUCAO: 'AREA_RISCO',
  REMOCAO_PREVENTIVA: 'REMOCAO_PREVENTIVA',
  SOLICITACAO_ABRIGO: 'SOLICITACAO_ABRIGO',
  ALERTA_EMERGENCIA: 'OUTRO',
};

/** moduleType → {tipo, risco} de caso da Rede da Mulher (convertidos na CRIAÇÃO). */
const CASO_MULHER_MODULE_TYPES: Record<string, { tipo: string; risco: string }> = {
  DENUNCIA_VIOLENCIA: { tipo: 'VIOLENCIA_DOMESTICA', risco: 'ALTO' },
  DENUNCIA_ASSEDIO: { tipo: 'ASSEDIO', risco: 'MEDIO' },
  ACOLHIMENTO_CASA_ABRIGO: { tipo: 'ACOLHIMENTO', risco: 'ALTO' },
  MEDIDA_PROTETIVA: { tipo: 'MEDIDA_PROTETIVA', risco: 'ALTO' },
  ACOMPANHAMENTO_SOCIAL: { tipo: 'ACOMPANHAMENTO', risco: 'MEDIO' },
};

/** moduleType de escolinha → modalidade pretendida (Esportes, na CRIAÇÃO). */
const ESCOLINHA_MODULE_TYPES: Record<string, string> = {
  INSCRICAO_ESCOLINHA_FUTEBOL: 'FUTEBOL',
  INSCRICAO_ESCOLINHA_BASQUETE: 'BASQUETE',
  INSCRICAO_ESCOLINHA_VOLEI: 'VOLEI',
  INSCRICAO_ESCOLINHA_NATACAO: 'NATACAO',
  INSCRICAO_ESCOLINHA_JUDO: 'JUDO',
  INSCRICAO_ESCOLINHA_CAPOEIRA: 'CAPOEIRA',
  INSCRICAO_ESCOLINHA_GINASTICA: 'GINASTICA',
};

/** moduleTypes de Esportes → reserva / inscrição em competição / empréstimo. */
const RESERVA_ESPACO_MODULE_TYPES = new Set(['RESERVA_ESPACO_ESPORTIVO', 'USO_GINASIO']);
const COMPETICAO_MODULE_TYPES = new Set(['INSCRICAO_COMPETICAO', 'INSCRICAO_CORRIDA_RUA']);

/** moduleType → tipo de OS (Serviços Públicos, convertidos na CRIAÇÃO). */
const OS_MODULE_TYPES: Record<string, string> = {
  ILUMINACAO_PUBLICA: 'Iluminação Pública',
  LIMPEZA_URBANA: 'Limpeza urbana',
  COLETA_ESPECIAL: 'Coleta de entulho',
  SOLICITACAO_CAPINA: 'Capina',
  SOLICITACAO_DESOBSTRUCAO: 'Drenagem/Boca de lobo',
  SOLICITACAO_PODA: 'Poda de árvore',
  ATENDIMENTOS_SERVICOS_PUBLICOS: 'Outros',
};

type ProtocolLike = {
  id: string;
  number?: string | null;
  moduleType?: string | null;
  citizenId?: string | null;
  customData?: any;
};

/** Extrai o primeiro valor string de customData cujas chaves casem com o padrão. */
function pickField(customData: any, pattern: RegExp): string | undefined {
  if (!customData || typeof customData !== 'object') return undefined;
  for (const [key, value] of Object.entries(customData)) {
    if (key === '_meta') continue;
    if (pattern.test(key) && typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

async function findProdutorDoCidadao(citizenId?: string | null, cpfForm?: string) {
  const cpfLimpo = cpfForm ? cpfForm.replace(/\D/g, '') : undefined;
  if (citizenId) {
    const porCitizen = await prisma.produtorRural.findFirst({ where: { citizenId } });
    if (porCitizen) return porCitizen;
    const citizen = await prisma.citizen.findFirst({ where: { id: citizenId }, select: { cpf: true } });
    if (citizen?.cpf) {
      const porCpf = await prisma.produtorRural.findFirst({
        where: { cpf: citizen.cpf.replace(/\D/g, '') },
      });
      if (porCpf) return porCpf;
    }
  }
  if (cpfLimpo) {
    return prisma.produtorRural.findFirst({ where: { cpf: cpfLimpo } });
  }
  return null;
}

/**
 * Hook de CRIAÇÃO do protocolo: demandas operacionais viram registro na fila
 * do app imediatamente (OS de Serviços Públicos, assistência técnica rural).
 */
export async function convertProtocolToAppOnCreate(protocol: ProtocolLike): Promise<void> {
  const moduleType = protocol.moduleType || '';
  const customData = protocol.customData || {};

  // ---- Serviços Públicos → OrdemServico ----
  if (OS_MODULE_TYPES[moduleType]) {
    const existente = await prisma.ordemServico.findFirst({ where: { protocolId: protocol.id } });
    if (existente) return;
    const ordemServicoService = (await import('../servicos-publicos/ordem-servico.service')).default;
    const os = await ordemServicoService.createOrdem({
      protocolId: protocol.id,
      tipo: OS_MODULE_TYPES[moduleType],
      descricao:
        pickField(customData, /descri|observa|relato|problema|detalhe/i) ||
        `Aberta a partir do protocolo ${protocol.number || protocol.id}`,
      endereco: pickField(customData, /endere|rua|logradouro|local/i),
      bairro: pickField(customData, /bairro|comunidade/i),
    });
    logger.info(`[protocol-to-app] Protocolo ${protocol.number || protocol.id} → OS ${os.numero}`);
    return;
  }

  // ---- Licenciamento Urbano → ProcessoLicenciamento ----
  if (LICENCIAMENTO_MODULE_TYPES[moduleType]) {
    const existente = await prisma.processoLicenciamento.findFirst({
      where: { protocolId: protocol.id },
    });
    if (existente) return;
    const licenciamentoService = (await import('../licenciamento/licenciamento.service')).default;
    let requerenteNome = pickField(customData, /^nome|requerente/i);
    if (!requerenteNome && protocol.citizenId) {
      const citizen = await prisma.citizen.findFirst({
        where: { id: protocol.citizenId },
        select: { name: true },
      });
      requerenteNome = citizen?.name || undefined;
    }
    const processo = await licenciamentoService.createProcesso({
      protocolId: protocol.id,
      tipo: LICENCIAMENTO_MODULE_TYPES[moduleType],
      citizenId: protocol.citizenId,
      requerenteNome,
      endereco: pickField(customData, /endere|logradouro|local da obra/i),
      bairro: pickField(customData, /bairro/i),
      descricao: pickField(customData, /descri|observa|finalidade|atividade/i),
      dados: customData && typeof customData === 'object' ? { formulario: customData } : undefined,
    });
    logger.info(
      `[protocol-to-app] Protocolo ${protocol.number || protocol.id} → processo de licenciamento ${processo.numero}`
    );
    return;
  }

  // ---- Meio Ambiente → ProcessoAmbiental (licenciamento e fiscalização) ----
  if (AMBIENTAL_MODULE_TYPES[moduleType]) {
    const existente = await prisma.processoAmbiental.findFirst({
      where: { protocolId: protocol.id },
    });
    if (existente) return;
    const meioAmbienteService = (await import('../meio-ambiente/meio-ambiente.service')).default;
    let requerenteNome = pickField(customData, /^nome|requerente|denunciante/i);
    if (!requerenteNome && protocol.citizenId) {
      const citizen = await prisma.citizen.findFirst({
        where: { id: protocol.citizenId },
        select: { name: true },
      });
      requerenteNome = citizen?.name || undefined;
    }
    const processo = await meioAmbienteService.createProcesso({
      protocolId: protocol.id,
      tipo: AMBIENTAL_MODULE_TYPES[moduleType],
      citizenId: protocol.citizenId,
      requerenteNome,
      atividade: pickField(customData, /atividade|empreendimento|especie|árvore|arvore/i),
      endereco: pickField(customData, /endere|logradouro|local/i),
      bairro: pickField(customData, /bairro|comunidade/i),
      descricao: pickField(customData, /descri|observa|relato|denuncia|motivo|justificativa/i),
      dados: customData && typeof customData === 'object' ? { formulario: customData } : undefined,
    });
    logger.info(
      `[protocol-to-app] Protocolo ${protocol.number || protocol.id} → processo ambiental ${processo.numero}`
    );
    return;
  }

  // ---- Esportes → matrícula de escolinha / reserva / competição / empréstimo ----
  if (
    ESCOLINHA_MODULE_TYPES[moduleType] ||
    RESERVA_ESPACO_MODULE_TYPES.has(moduleType) ||
    COMPETICAO_MODULE_TYPES.has(moduleType) ||
    moduleType === 'EMPRESTIMO_MATERIAL_ESPORTIVO'
  ) {
    const esportesService = (await import('../esportes/esportes.service')).default;
    let nomeSolicitante = pickField(customData, /^nome/i);
    if (!nomeSolicitante && protocol.citizenId) {
      const citizen = await prisma.citizen.findFirst({
        where: { id: protocol.citizenId },
        select: { name: true },
      });
      nomeSolicitante = citizen?.name || undefined;
    }
    const telefone = pickField(customData, /telefone|celular|contato/i);
    const dados = customData && typeof customData === 'object' ? { formulario: customData } : undefined;

    if (ESCOLINHA_MODULE_TYPES[moduleType]) {
      const existente = await prisma.matriculaEscolinha.findFirst({ where: { protocolId: protocol.id } });
      if (existente) return;
      await esportesService.createMatricula({
        protocolId: protocol.id,
        citizenId: protocol.citizenId,
        modalidadePretendida: ESCOLINHA_MODULE_TYPES[moduleType],
        nomeAluno: pickField(customData, /aluno|crianca|atleta/i) || nomeSolicitante,
        responsavelNome: pickField(customData, /responsavel/i) || nomeSolicitante,
        telefone,
        dados,
      });
      logger.info(`[protocol-to-app] Protocolo ${protocol.number || protocol.id} → inscrição de escolinha`);
      return;
    }

    if (RESERVA_ESPACO_MODULE_TYPES.has(moduleType)) {
      const existente = await prisma.reservaEspaco.findFirst({ where: { protocolId: protocol.id } });
      if (existente) return;
      await esportesService.createReserva({
        protocolId: protocol.id,
        citizenId: protocol.citizenId,
        solicitanteNome: nomeSolicitante,
        data: pickField(customData, /^data|dia/i),
        horaInicio: pickField(customData, /inicio|hora/i),
        horaFim: pickField(customData, /fim|termino|término/i),
        finalidade: pickField(customData, /finalidade|evento|atividade|descri/i),
        dados,
      });
      logger.info(`[protocol-to-app] Protocolo ${protocol.number || protocol.id} → reserva de espaço esportivo`);
      return;
    }

    if (COMPETICAO_MODULE_TYPES.has(moduleType)) {
      const existente = await prisma.inscricaoCompeticao.findFirst({ where: { protocolId: protocol.id } });
      if (existente) return;
      await esportesService.createInscricaoCompeticao({
        protocolId: protocol.id,
        citizenId: protocol.citizenId,
        participante: pickField(customData, /equipe|atleta|participante/i) || nomeSolicitante,
        categoria: pickField(customData, /categoria|modalidade/i),
        telefone,
        dados,
      });
      logger.info(`[protocol-to-app] Protocolo ${protocol.number || protocol.id} → inscrição em competição`);
      return;
    }

    // EMPRESTIMO_MATERIAL_ESPORTIVO
    const existente = await prisma.emprestimoMaterial.findFirst({ where: { protocolId: protocol.id } });
    if (existente) return;
    const quantidade = Object.entries(customData).find(
      ([k, v]) =>
        /quantidade|qtd/i.test(k) &&
        (typeof v === 'number' || (typeof v === 'string' && v.trim() && !isNaN(Number(v))))
    )?.[1];
    await esportesService.createEmprestimo({
      protocolId: protocol.id,
      citizenId: protocol.citizenId,
      solicitanteNome: nomeSolicitante,
      item: pickField(customData, /material|item|equipamento/i),
      quantidade: quantidade != null ? Number(quantidade) : 1,
      telefone,
      dados,
    });
    logger.info(`[protocol-to-app] Protocolo ${protocol.number || protocol.id} → empréstimo de material esportivo`);
    return;
  }

  // ---- Rede da Mulher → CasoMulher (B7 sigiloso; sem equipe até a triagem) ----
  if (CASO_MULHER_MODULE_TYPES[moduleType]) {
    const existente = await prisma.casoMulher.findFirst({ where: { protocolId: protocol.id } });
    if (existente) return;
    const casoMulherService = (await import('../politicas-mulheres/caso-mulher.service')).default;
    const cfg = CASO_MULHER_MODULE_TYPES[moduleType];
    let nomeAtendida = pickField(customData, /^nome/i);
    if (!nomeAtendida && protocol.citizenId) {
      const citizen = await prisma.citizen.findFirst({
        where: { id: protocol.citizenId },
        select: { name: true },
      });
      nomeAtendida = citizen?.name || undefined;
    }
    const caso = await casoMulherService.createCaso(
      {
        protocolId: protocol.id,
        tipo: cfg.tipo,
        risco: cfg.risco,
        citizenId: protocol.citizenId,
        nomeAtendida,
        telefoneSeguro: pickField(customData, /telefone|celular|contato/i),
        dados: customData && typeof customData === 'object' ? { formulario: customData } : undefined,
      },
      {} // sem usuário: caso nasce restrito à gestão até a equipe ser montada
    );
    logger.info(`[protocol-to-app] Protocolo ${protocol.number || protocol.id} → caso sigiloso ${caso.numero}`);
    return;
  }

  // ---- Defesa Civil → OcorrenciaDefesaCivil (fila de campo) ----
  if (DEFESA_CIVIL_MODULE_TYPES[moduleType]) {
    const existente = await prisma.ocorrenciaDefesaCivil.findFirst({
      where: { protocolId: protocol.id },
    });
    if (existente) return;
    const defesaCivilService = (await import('../defesa-civil/defesa-civil.service')).default;
    let solicitanteNome = pickField(customData, /^nome|solicitante|denunciante/i);
    if (!solicitanteNome && protocol.citizenId) {
      const citizen = await prisma.citizen.findFirst({
        where: { id: protocol.citizenId },
        select: { name: true },
      });
      solicitanteNome = citizen?.name || undefined;
    }
    const ocorrencia = await defesaCivilService.createOcorrencia({
      protocolId: protocol.id,
      tipo: DEFESA_CIVIL_MODULE_TYPES[moduleType],
      gravidade: moduleType === 'ALERTA_EMERGENCIA' || moduleType === 'SOLICITACAO_ABRIGO' ? 'ALTA' : 'MEDIA',
      citizenId: protocol.citizenId,
      solicitanteNome,
      endereco: pickField(customData, /endere|logradouro|local/i),
      bairro: pickField(customData, /bairro|comunidade/i),
      descricao: pickField(customData, /descri|observa|relato|situacao|risco|motivo/i),
      dados: customData && typeof customData === 'object' ? { formulario: customData } : undefined,
    });
    logger.info(
      `[protocol-to-app] Protocolo ${protocol.number || protocol.id} → ocorrência Defesa Civil ${ocorrencia.numero}`
    );
    return;
  }

  // ---- Habitação → InscricaoHabitacional (fila do app) ----
  if (HABITACAO_MODULE_TYPES.has(moduleType)) {
    const existente = await prisma.inscricaoHabitacional.findFirst({
      where: { protocolId: protocol.id },
    });
    if (existente) return;
    const habitacaoService = (await import('../habitacao/habitacao.service')).default;
    let nome = pickField(customData, /^nome/i);
    let cpf = pickField(customData, /^cpf$/i);
    if ((!nome || !cpf) && protocol.citizenId) {
      const citizen = await prisma.citizen.findFirst({
        where: { id: protocol.citizenId },
        select: { name: true, cpf: true },
      });
      nome = nome || citizen?.name || undefined;
      cpf = cpf || citizen?.cpf || undefined;
    }
    const renda = Object.entries(customData).find(
      ([k, v]) =>
        /renda/i.test(k) &&
        (typeof v === 'number' || (typeof v === 'string' && v.trim() && !isNaN(Number(v))))
    )?.[1];
    const membros = Object.entries(customData).find(
      ([k, v]) =>
        /membros|pessoas|dependentes|familia/i.test(k) &&
        (typeof v === 'number' || (typeof v === 'string' && v.trim() && !isNaN(Number(v))))
    )?.[1];
    await habitacaoService.createInscricao({
      protocolId: protocol.id,
      citizenId: protocol.citizenId,
      nome,
      cpf,
      rendaFamiliar: renda != null ? Number(renda) : undefined,
      membrosFamilia: membros != null ? Number(membros) : undefined,
      observacoes:
        moduleType === 'SOLICITACAO_AUXILIO_ALUGUEL' ? 'Origem: solicitação de auxílio aluguel' : undefined,
      dados: customData && typeof customData === 'object' ? { formulario: customData } : undefined,
    });
    logger.info(
      `[protocol-to-app] Protocolo ${protocol.number || protocol.id} → inscrição habitacional (${nome || 'sem nome'})`
    );
    return;
  }

  // ---- Agricultura: Assistência Técnica → SolicitacaoAssistenciaTecnica ----
  if (moduleType === 'ASSISTENCIA_TECNICA') {
    const existente = await prisma.solicitacaoAssistenciaTecnica.findFirst({
      where: { protocolId: protocol.id },
    });
    if (existente) return;
    const produtor = await findProdutorDoCidadao(protocol.citizenId, pickField(customData, /^cpf$/i));
    if (!produtor) {
      logger.info(
        `[protocol-to-app] Protocolo ${protocol.number || protocol.id} (ASSISTENCIA_TECNICA): cidadão sem cadastro de produtor — conversão adiada`
      );
      return;
    }
    await prisma.solicitacaoAssistenciaTecnica.create({
      data: {
        protocolId: protocol.id,
        produtorId: produtor.id,
        tipoAssistencia:
          pickField(customData, /tipo|assist|cultura|atividade/i) || 'Assistência técnica rural',
        descricao: pickField(customData, /descri|observa|relato|necessidade|detalhe/i),
      },
    });
    logger.info(
      `[protocol-to-app] Protocolo ${protocol.number || protocol.id} → solicitação de assistência técnica (produtor ${produtor.nome})`
    );
  }
}

/**
 * Hook de APROVAÇÃO do protocolo: cadastros aprovados viram entidade do app
 * (produtor rural, propriedade rural).
 */
export async function convertProtocolToAppOnApproval(protocolId: string): Promise<void> {
  const protocol = await prisma.protocolSimplified.findFirst({
    where: { id: protocolId },
    select: { id: true, number: true, moduleType: true, citizenId: true, customData: true },
  });
  if (!protocol) return;
  const moduleType = protocol.moduleType || '';
  const customData: any = protocol.customData || {};

  // ---- Agricultura: Cadastro de Produtor → ProdutorRural ----
  if (moduleType === 'CADASTRO_PRODUTOR') {
    const existente = await prisma.produtorRural.findFirst({ where: { protocolId: protocol.id } });
    if (existente) return;

    let cpf = pickField(customData, /^cpf$/i);
    let nome = pickField(customData, /^nome/i);
    if ((!cpf || !nome) && protocol.citizenId) {
      const citizen = await prisma.citizen.findFirst({
        where: { id: protocol.citizenId },
        select: { name: true, cpf: true, phone: true, email: true },
      });
      cpf = cpf || citizen?.cpf || undefined;
      nome = nome || citizen?.name || undefined;
    }
    if (!cpf || !nome) {
      logger.warn(
        `[protocol-to-app] Protocolo ${protocol.number} (CADASTRO_PRODUTOR): sem CPF/nome — conversão pulada`
      );
      return;
    }
    const cpfLimpo = cpf.replace(/\D/g, '');
    const jaExiste = await prisma.produtorRural.findFirst({ where: { cpf: cpfLimpo } });
    if (jaExiste) {
      // Dedup por CPF: só vincula o protocolo e o cidadão ao produtor existente
      await prisma.produtorRural.update({
        where: { id: jaExiste.id },
        data: {
          protocolId: jaExiste.protocolId || protocol.id,
          citizenId: jaExiste.citizenId || protocol.citizenId,
        },
      });
      return;
    }
    const produtor = await prisma.produtorRural.create({
      data: {
        protocolId: protocol.id,
        citizenId: protocol.citizenId,
        cpf: cpfLimpo,
        nome,
        celular: pickField(customData, /telefone|celular|fone/i),
        email: pickField(customData, /email|e-mail/i),
        atividadePrincipal:
          pickField(customData, /producoes|producao|atividade/i) ||
          pickField(customData, /tipoProdutor/i),
        dap: pickField(customData, /^dap$/i),
        car: pickField(customData, /^car$/i),
      },
    });
    logger.info(`[protocol-to-app] Protocolo ${protocol.number} → produtor rural ${produtor.nome}`);
    return;
  }

  // ---- Agricultura: Cadastro de Propriedade → PropriedadeRural ----
  if (moduleType === 'CADASTRO_PROPRIEDADE_RURAL') {
    const jaExiste = await prisma.propriedadeRural.findFirst({
      where: { atividades: { path: ['protocolId'], equals: protocol.id } as any },
    }).catch(() => null);
    if (jaExiste) return;
    const produtor = await findProdutorDoCidadao(protocol.citizenId, pickField(customData, /^cpf$/i));
    if (!produtor) {
      logger.info(
        `[protocol-to-app] Protocolo ${protocol.number} (CADASTRO_PROPRIEDADE_RURAL): cidadão sem cadastro de produtor — conversão adiada`
      );
      return;
    }
    const area = Object.entries(customData).find(
      ([k, v]) => /area|hectare/i.test(k) && (typeof v === 'number' || (typeof v === 'string' && v.trim() && !isNaN(Number(v))))
    )?.[1];
    await prisma.propriedadeRural.create({
      data: {
        produtorId: produtor.id,
        nome:
          pickField(customData, /nomePropriedade|propriedade|sitio|fazenda/i) ||
          pickField(customData, /^nome/i) ||
          `Propriedade de ${produtor.nome}`,
        endereco: pickField(customData, /endere|localiza|acesso/i),
        bairro: pickField(customData, /bairro|comunidade|localidade|distrito/i),
        areaHectares: area != null ? Number(area) : null,
        car: pickField(customData, /^car$/i),
        atividades: { protocolId: protocol.id, origem: 'protocolo' },
      },
    });
    logger.info(`[protocol-to-app] Protocolo ${protocol.number} → propriedade rural (produtor ${produtor.nome})`);
  }
}
