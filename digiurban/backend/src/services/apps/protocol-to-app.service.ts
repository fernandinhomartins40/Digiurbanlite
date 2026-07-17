import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

/**
 * Conversores protocolo→app (Fase 1 do plano de apps).
 * Todos NÃO-FATAIS: falha aqui nunca derruba a criação/aprovação do protocolo
 * (padrão materializeOnApproval / hook TFD). O vínculo é sempre via
 * protocolId @unique na tabela raiz do app — reprocessar é idempotente.
 */

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
