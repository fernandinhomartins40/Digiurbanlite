import { prisma } from '../../lib/prisma';


/**
 * 🔗 INTEGRAÇÃO PROTOCOLO → TFD
 *
 * Este serviço converte automaticamente protocolos de serviços TFD
 * em solicitações TFD completas no sistema.
 *
 * Fluxo:
 * 1. Cidadão cria protocolo no Portal (serviço TFD)
 * 2. Hook detecta protocolo do tipo TFD
 * 3. Converte protocolo em SolicitacaoTFD
 * 4. Inicia workflow TFD automaticamente
 */
export class ProtocolToTFDService {
  /**
   * Converte um protocolo em solicitação TFD
   */
  async convertProtocolToTFD(protocolId: string) {
    console.log(`🔄 Convertendo protocolo ${protocolId} para TFD...`);

    // 1. Buscar protocolo
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      include: {
        service: true,
        citizen: true,
      },
    });

    if (!protocol) {
      throw new Error('Protocolo não encontrado');
    }

    // 2. Verificar se é serviço TFD
    const isTFDService =
      (protocol.service as any)?.appAction === 'ENCAMINHAMENTOS_TFD' ||
      protocol.moduleType?.includes('TFD') ||
      protocol.moduleType?.toLowerCase().includes('tfd');

    if (!isTFDService) {
      throw new Error('Este protocolo não é do tipo TFD');
    }

    // 3. Verificar se já existe solicitação TFD para este protocolo
    const existente = await prisma.solicitacaoTFD.findUnique({
      where: { protocolId: protocol.id },
    });

    if (existente) {
      console.log(`✅ Solicitação TFD já existe: ${existente.id}`);
      return existente;
    }

    // 4. Extrair dados do customData do protocolo
    const customData = protocol.customData as any;

    // 5. Criar solicitação TFD
    const solicitacaoData = {
      citizenId: protocol.citizenId,
      especialidade: customData?.especialidade || 'Não informado',
      procedimento: customData?.procedimento || 'Não informado',
      justificativaMedica: customData?.justificativa || customData?.justificativaMedica || 'Não informado',
      medicoSolicitante: customData?.medicoSolicitante || 'Não informado',
      cid10: customData?.cid10,
      cidadeDestino: customData?.cidadeDestino || 'Não informado',
      estadoDestino: customData?.estadoDestino || 'SP',
      hospitalDestino: customData?.hospitalDestino,
      prioridade: this.mapPrioridade(customData?.prioridade),
      acompanhanteId: customData?.acompanhanteId,
      observacoes: customData?.observacoes,
      // URLs de documentos
      encaminhamentoMedicoUrl: this.extractDocumentUrl(protocol, 'encaminhamento'),
      examesUrls: this.extractExamesUrls(protocol),
    };

    // Cria a solicitação VINCULADA ao protocolo real. Antes usava
    // tfdService.createSolicitacao, que gravava protocolId = id do workflow
    // (FK inválida), omitia campos obrigatórios e usava prioridade 'NORMAL'
    // (fora do enum): a conversão falhava sempre e o erro era engolido —
    // nenhum pedido de TFD feito pelo portal chegava ao app.
    const solicitacao = await prisma.solicitacaoTFD.create({
      data: {
        protocolId: protocol.id,
        workflowId: `WF-${protocol.id}`,
        citizenId: solicitacaoData.citizenId,
        acompanhanteId: solicitacaoData.acompanhanteId || null,
        especialidade: solicitacaoData.especialidade,
        procedimento: solicitacaoData.procedimento,
        cid10: solicitacaoData.cid10 || null,
        justificativa: solicitacaoData.justificativaMedica,
        encaminhamentoMedicoUrl: solicitacaoData.encaminhamentoMedicoUrl || '',
        examesUrls: solicitacaoData.examesUrls?.length ? solicitacaoData.examesUrls : undefined,
        prioridade: solicitacaoData.prioridade,
        cidadeDestino: solicitacaoData.cidadeDestino,
        estadoDestino: solicitacaoData.estadoDestino,
        hospitalDestino: solicitacaoData.hospitalDestino || null,
        observacoes: solicitacaoData.observacoes || null,
        status: 'AGUARDANDO_ANALISE_DOCUMENTAL',
      },
    });

    if (!solicitacao) {
      throw new Error('Erro ao criar solicitação TFD');
    }

    console.log(`✅ Solicitação TFD criada: ${solicitacao.id}`);

    // 6. Atualizar protocolo com link para solicitação TFD
    await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: {
        customData: {
          ...(protocol.customData as any),
          tfdSolicitacaoId: solicitacao.id,
          convertedToTFD: true,
          convertedAt: new Date().toISOString(),
        },
      },
    });

    return solicitacao;
  }

  /**
   * Sincronizar status do TFD de volta para o protocolo
   */
  async syncTFDStatusToProtocol(solicitacaoId: string) {
    const solicitacao = await prisma.solicitacaoTFD.findUnique({
      where: { id: solicitacaoId },
    });

    if (!solicitacao) {
      throw new Error('Solicitação TFD não encontrada');
    }

    // Mapear status TFD → enum ProtocolStatus real. Antes gravava valores
    // inexistentes ('under_review', 'pending'...) — a atualização falhava — e
    // sobrescrevia TODO o customData (apagaria os dados do formulário do cidadão).
    let protocolStatus: 'PROGRESSO' | 'PENDENCIA' | 'CONCLUIDO' | 'CANCELADO' = 'PROGRESSO';

    switch (solicitacao.status) {
      case 'DOCUMENTACAO_PENDENTE':
      case 'AGUARDANDO_COMPLEMENTACAO':
        protocolStatus = 'PENDENCIA';
        break;
      case 'REALIZADO':
        protocolStatus = 'CONCLUIDO';
        break;
      case 'CANCELADO':
      case 'INDEFERIDO':
        protocolStatus = 'CANCELADO';
        break;
    }

    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: solicitacao.protocolId },
      select: { customData: true },
    });
    const customData =
      protocol?.customData && typeof protocol.customData === 'object' && !Array.isArray(protocol.customData)
        ? (protocol.customData as Record<string, unknown>)
        : {};

    await prisma.protocolSimplified.update({
      where: { id: solicitacao.protocolId },
      data: {
        status: protocolStatus,
        customData: {
          ...customData,
          tfdStatus: solicitacao.status,
          lastSyncAt: new Date().toISOString(),
        } as any,
      },
    });

    console.log(`🔄 Status sincronizado: TFD ${solicitacao.status} → Protocolo ${protocolStatus}`);
  }

  /**
   * Buscar solicitação TFD por protocolo
   */
  async findByProtocolId(protocolId: string) {
    return await prisma.solicitacaoTFD.findUnique({
      where: { protocolId },
      include: {
        viagens: true,
      },
    });
  }

  /**
   * Mapear prioridade do formulário para enum TFD
   */
  private mapPrioridade(prioridade: string): any {
    const map: Record<string, string> = {
      'emergencia': 'EMERGENCIA',
      'alta': 'ALTA',
      'media': 'MEDIA',
      'rotina': 'ROTINA',
      'normal': 'MEDIA',
    };

    return map[prioridade?.toLowerCase()] || 'MEDIA';
  }

  /**
   * Extrair URL de documento específico
   */
  private extractDocumentUrl(protocol: any, docType: string): string {
    const documents = protocol.documents || [];
    const doc = documents.find((d: any) =>
      d.type?.toLowerCase().includes(docType) ||
      d.name?.toLowerCase().includes(docType)
    );
    return doc?.url || '';
  }

  /**
   * Extrair URLs de exames
   */
  private extractExamesUrls(protocol: any): any {
    const documents = protocol.documents || [];
    const exames = documents.filter((d: any) =>
      d.type?.toLowerCase().includes('exame') ||
      d.category?.toLowerCase().includes('exame')
    );
    return exames.map((e: any) => ({ url: e.url, name: e.name }));
  }
}

export default new ProtocolToTFDService();
