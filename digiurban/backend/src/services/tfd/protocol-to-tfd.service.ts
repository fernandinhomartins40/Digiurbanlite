import { PrismaClient } from '@prisma/client';
import tfdService from './tfd.service';

const prisma = new PrismaClient();

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
    const protocol = await prisma.protocol.findUnique({
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
      protocol.service.moduleType?.includes('TFD') ||
      protocol.service.category === 'TFD' ||
      protocol.service.name.toLowerCase().includes('tfd') ||
      protocol.service.name.toLowerCase().includes('fora do domicílio');

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

    // 4. Extrair dados do formData do protocolo
    const formData = protocol.formData as any;

    // 5. Criar solicitação TFD
    const solicitacaoData = {
      citizenId: protocol.citizenId,
      especialidade: formData.especialidade || 'Não informado',
      procedimento: formData.procedimento || 'Não informado',
      justificativaMedica: formData.justificativa || formData.justificativaMedica || 'Não informado',
      cid10: formData.cid10,
      cidadeDestino: formData.cidadeDestino || 'Não informado',
      estadoDestino: formData.estadoDestino || 'SP',
      hospitalDestino: formData.hospitalDestino,
      prioridade: this.mapPrioridade(formData.prioridade),
      acompanhanteId: formData.acompanhanteId,
      observacoes: formData.observacoes,
      // URLs de documentos
      encaminhamentoMedicoUrl: this.extractDocumentUrl(protocol, 'encaminhamento'),
      examesUrls: this.extractExamesUrls(protocol),
    };

    const solicitacao = await tfdService.createSolicitacao(solicitacaoData);

    console.log(`✅ Solicitação TFD criada: ${solicitacao.id}`);

    // 6. Atualizar protocolo com link para solicitação TFD
    await prisma.protocol.update({
      where: { id: protocolId },
      data: {
        metadata: {
          ...(protocol.metadata as any),
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

    // Mapear status TFD para status de protocolo
    let protocolStatus = 'under_review';

    switch (solicitacao.status) {
      case 'AGUARDANDO_ANALISE_DOCUMENTAL':
      case 'AGUARDANDO_REGULACAO_MEDICA':
      case 'AGUARDANDO_APROVACAO_GESTAO':
        protocolStatus = 'under_review';
        break;
      case 'DOCUMENTACAO_PENDENTE':
        protocolStatus = 'pending';
        break;
      case 'AGENDADO':
      case 'AGUARDANDO_VIAGEM':
      case 'EM_VIAGEM':
        protocolStatus = 'in_progress';
        break;
      case 'REALIZADO':
        protocolStatus = 'completed';
        break;
      case 'CANCELADO':
        protocolStatus = 'cancelled';
        break;
    }

    await prisma.protocol.update({
      where: { id: solicitacao.protocolId },
      data: {
        status: protocolStatus,
        metadata: {
          tfdStatus: solicitacao.status,
          lastSyncAt: new Date().toISOString(),
        },
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
