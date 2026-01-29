import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as crypto from 'crypto';

/**
 * FASE 3.1: Serviço de Conversão para Formato LEDI
 *
 * Converte dados do DigiUrban para o formato LEDI (Layout e-SUS APS de Dados e Interface)
 * Suporta geração em XML e preparação para Thrift
 */
@Injectable()
export class LEDIConverterService {
  constructor(private prisma: PrismaService) {}

  /**
   * Gerar UUID único para ficha LEDI
   */
  private generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Formatar CPF para LEDI (apenas números)
   */
  private formatCPF(cpf: string): string {
    return cpf?.replace(/\D/g, '');
  }

  /**
   * Formatar CNS para LEDI (15 dígitos)
   */
  private formatCNS(cns: string): string {
    return cns?.replace(/\D/g, '').padStart(15, '0');
  }

  /**
   * Formatar data para LEDI (dd/MM/yyyy)
   */
  private formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR');
  }

  /**
   * Formatar data/hora para LEDI (dd/MM/yyyy HH:mm:ss)
   */
  private formatDateTime(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR')}`;
  }

  // =========================================================================
  // CADASTRO INDIVIDUAL
  // =========================================================================

  /**
   * Converter cadastro de cidadão para LEDI - Ficha de Cadastro Individual
   */
  async convertCadastroIndividual(citizenId: string): Promise<any> {
    const citizen = await this.prisma.citizen.findUnique({
      where: { id: citizenId },
    });

    if (!citizen) {
      throw new Error('Cidadão não encontrado');
    }

    const address = citizen.address as any || {};

    return {
      headerTransport: {
        versaoSistema: '1.0',
        uuidFicha: this.generateUUID(),
        tipoRegistro: 1, // Cadastro Individual
        cnesProfissional: null, // Cidadão auto-cadastrado
        ine: null,
        microarea: null,
        dataAtendimento: this.formatDate(citizen.createdAt),
      },
      fichaIndividual: {
        cpf: this.formatCPF(citizen.cpf),
        nomeCidadao: citizen.name,
        nomeSocial: null,
        dataNascimento: this.formatDate(citizen.birthDate),
        sexo: null, // Não coletado atualmente
        racaCor: null, // Não coletado atualmente
        nomeMae: citizen.motherName || null,
        telefoneCelular: citizen.phone,
        telefoneResidencial: citizen.phoneSecondary || null,
        email: citizen.email,
        nacionalidade: 'BRASILEIRA',

        // Endereço
        logradouro: address.street || null,
        numero: address.number || null,
        complemento: address.complement || null,
        bairro: address.neighborhood || null,
        cep: address.zipCode?.replace(/\D/g, '') || null,
        municipio: address.city || null,
        uf: address.state || null,

        // Status
        saiuDaArea: false,
        mudouSe: false,

        // Outros campos
        escolaridade: null,
        situacaoConjugal: citizen.maritalStatus || null,
        ocupacao: citizen.occupation || null,

        // Campos de deficiência (não coletados)
        temAlgumaDeficiencia: false,

        // Questões complementares
        ficouGestante: false,
        maternidadeDeReferencia: null,
      },
    };
  }

  // =========================================================================
  // ATENDIMENTO INDIVIDUAL
  // =========================================================================

  /**
   * Converter consulta médica para LEDI - Ficha de Atendimento Individual
   */
  async convertAtendimentoIndividual(consultaId: string): Promise<any> {
    const consulta = await this.prisma.consultaMedica.findUnique({
      where: { id: consultaId },
      include: {
        atendimento: {
          include: {
            triagem: true,
          },
        },
        problemas: true,
      },
    });

    if (!consulta) {
      throw new Error('Consulta não encontrada');
    }

    const citizen = await this.prisma.citizen.findUnique({
      where: { id: consulta.atendimento.citizenId },
    });

    const profissional = await this.prisma.profissionalSaude.findUnique({
      where: { id: consulta.profissionalSaudeId || consulta.medicoId },
    });

    const unidade = await this.prisma.unidadeSaude.findUnique({
      where: { id: consulta.atendimento.unidadeId },
    });

    // Extrair CIAPs e CIDs dos problemas
    const ciaps = consulta.problemas
      .filter((p: any) => p.tipo === 'CIAP2')
      .map((p: any) => p.codigo);

    const cids = consulta.problemas
      .filter((p: any) => p.tipo === 'CID10')
      .map((p: any) => p.codigo);

    return {
      headerTransport: {
        versaoSistema: '1.0',
        uuidFicha: this.generateUUID(),
        tipoRegistro: 3, // Atendimento Individual
        cnesProfissional: unidade?.cnes || null,
        cnes: unidade?.cnes || null,
        ine: null,
        dataAtendimento: this.formatDate(consulta.dataHora),
      },
      fichaAtendimentoIndividual: {
        cpfCidadao: this.formatCPF(citizen.cpf),
        cns: null, // CNS não coletado
        dataNascimento: this.formatDate(citizen.birthDate),
        sexo: null,

        // Atendimento
        turno: this.getTurno(consulta.dataHora),
        tipoAtendimento: this.getTipoAtendimento(consulta.atendimento.tipo),

        // SOAP - Subjetivo
        pesoKg: consulta.antropometria?.peso || null,
        alturaMetros: consulta.antropometria?.altura || null,

        // SOAP - Objetivo
        pressaoArterialSistolica: consulta.sinaisVitais?.pressaoArterialSistolica || null,
        pressaoArterialDiastolica: consulta.sinaisVitais?.pressaoArterialDiastolica || null,
        temperatura: consulta.sinaisVitais?.temperatura || null,

        // SOAP - Avaliação
        ciap2: ciaps,
        cid10: cids,

        // SOAP - Plano
        condutaEncaminhamento: this.getConduta(consulta),

        // Desfecho
        desfecho: 'CONSULTA_ATENDIMENTO',

        // Observações
        observacoes: consulta.observacoes,
      },
    };
  }

  private getTurno(data: Date): string {
    const hora = new Date(data).getHours();
    if (hora >= 6 && hora < 12) return 'MANHA';
    if (hora >= 12 && hora < 18) return 'TARDE';
    return 'NOITE';
  }

  private getTipoAtendimento(tipo: string): number {
    const tipos: Record<string, number> = {
      'AGENDADO': 1,
      'DEMANDA_ESPONTANEA': 2,
      'URGENCIA': 3,
      'RETORNO': 1,
    };
    return tipos[tipo] || 2;
  }

  private getConduta(consulta: any): number[] {
    const condutas = [];

    if (consulta.retornoNecessario) {
      condutas.push(1); // Retorno
    }

    if (consulta.prescricoes?.length > 0) {
      condutas.push(2); // Prescrição de medicamentos
    }

    if (consulta.examesSolicitados?.length > 0) {
      condutas.push(3); // Solicitação de exames
    }

    if (consulta.encaminhamentos?.length > 0) {
      condutas.push(4); // Encaminhamento
    }

    if (consulta.atestados?.length > 0) {
      condutas.push(5); // Atestado
    }

    return condutas.length > 0 ? condutas : [6]; // 6 = Alta
  }

  // =========================================================================
  // ATENDIMENTO ODONTOLÓGICO
  // =========================================================================

  /**
   * Converter atendimento odontológico para LEDI - Ficha de Atendimento Odontológico
   */
  async convertAtendimentoOdontologico(atendimentoId: string): Promise<any> {
    const atendimento = await this.prisma.atendimentoOdontologico.findUnique({
      where: { id: atendimentoId },
      include: {
        atendimento: true,
        procedimentos: true,
      },
    });

    if (!atendimento) {
      throw new Error('Atendimento odontológico não encontrado');
    }

    const citizen = await this.prisma.citizen.findUnique({
      where: { id: atendimento.atendimento.citizenId },
    });

    const dentista = await this.prisma.profissionalSaude.findUnique({
      where: { id: atendimento.dentistaId },
    });

    const unidade = await this.prisma.unidadeSaude.findUnique({
      where: { id: atendimento.atendimento.unidadeId },
    });

    return {
      headerTransport: {
        versaoSistema: '1.0',
        uuidFicha: this.generateUUID(),
        tipoRegistro: 4, // Atendimento Odontológico
        cnesProfissional: unidade?.cnes || null,
        cnes: unidade?.cnes || null,
        cbo: '2232', // CBO Cirurgião-Dentista
        dataAtendimento: this.formatDate(atendimento.dataHora),
      },
      fichaAtendimentoOdonto: {
        cpfCidadao: this.formatCPF(citizen.cpf),
        dataNascimento: this.formatDate(citizen.birthDate),

        // Atendimento
        turno: this.getTurno(atendimento.dataHora),
        tipoAtendimento: 1, // Consulta agendada
        tipoConsulta: 1, // Primeira consulta odontológica programática

        // Procedimentos (códigos SIGTAP)
        procedimentos: atendimento.procedimentos.map((p: any) => ({
          codigoSigtap: p.codigoSIGTAP,
          dente: p.dente,
          face: p.face,
          quantidade: p.quantidade,
        })),

        // Vigilância em saúde bucal
        vigilanciaSaudeBucal: this.extractVigilanciaBucal(atendimento),

        // Fornecimento
        forneceuEscovas: false,
        forneceuCremeDental: false,
        forneceuFioDental: false,

        // Observações
        observacoes: atendimento.observacoes,
      },
    };
  }

  private extractVigilanciaBucal(atendimento: any): any {
    const indicesCPOD = atendimento.indicesCPOD as any || {};

    return {
      cariados: indicesCPOD.cariados || 0,
      perdidos: indicesCPOD.perdidos || 0,
      obturados: indicesCPOD.obturados || 0,
      necessitaTratamento: indicesCPOD.cariados > 0,
      alteracaoTecidosMoles: false,
    };
  }

  // =========================================================================
  // VISITA DOMICILIAR
  // =========================================================================

  /**
   * Converter visita domiciliar para LEDI - Ficha de Visita Domiciliar
   */
  async convertVisitaDomiciliar(visitaId: string): Promise<any> {
    const visita = await this.prisma.visitaDomiciliar.findUnique({
      where: { id: visitaId },
      include: {
        acs: true,
        citizen: true,
      },
    });

    if (!visita) {
      throw new Error('Visita domiciliar não encontrada');
    }

    const acompanhamentos = visita.acompanhamentosRealizados as any || {};

    return {
      headerTransport: {
        versaoSistema: '1.0',
        uuidFicha: this.generateUUID(),
        tipoRegistro: 5, // Visita Domiciliar
        cnesProfissional: null,
        cbo: '5151', // CBO Agente Comunitário de Saúde
        dataAtendimento: this.formatDate(visita.dataVisita),
      },
      fichaVisitaDomiciliar: {
        cpfCidadao: visita.citizen ? this.formatCPF(visita.citizen.cpf) : null,

        // Visita
        turno: visita.turno || this.getTurno(visita.dataVisita),
        tipoImovel: 1, // Domicílio

        // Motivo
        motivoVisita: this.getMotivoVisita(visita.tipoVisita),

        // Acompanhamentos
        acompanhamentoHipertensao: acompanhamentos.hipertensao || false,
        acompanhamentoDiabetes: acompanhamentos.diabetes || false,
        acompanhamentoGestante: acompanhamentos.gestacao || false,
        acompanhamentoPuericultura: acompanhamentos.puericultura || false,
        acompanhamentoSaudeMental: acompanhamentos.saudeMental || false,
        acompanhamentoReabilitacao: acompanhamentos.reabilitacao || false,
        acompanhamentoTabagismo: acompanhamentos.tabagismo || false,
        acompanhamentoDomiciliar: acompanhamentos.atendimentoDomiciliar || false,
        acompanhamentoCondicoesCronicas: acompanhamentos.condicoesCronicas || false,
        acompanhamentoHanseniase: acompanhamentos.hanseniase || false,
        acompanhamentoTuberculose: acompanhamentos.tuberculose || false,

        // Desfecho
        desfecho: visita.encaminhamentoUBS ? 'AGENDAMENTO_UBS' : 'VISITA_REALIZADA',

        // Observações
        observacoes: visita.observacoes,
      },
    };
  }

  private getMotivoVisita(tipoVisita: string): number {
    const motivos: Record<string, number> = {
      'CADASTRAMENTO': 1,
      'ACOMPANHAMENTO': 2,
      'BUSCA_ATIVA': 3,
      'CONTROLE_AMBIENTAL': 4,
      'EDUCACAO_SAUDE': 5,
      'CONVOCACAO': 6,
    };
    return motivos[tipoVisita] || 2;
  }

  // =========================================================================
  // ATIVIDADE COLETIVA
  // =========================================================================

  /**
   * Converter atividade coletiva para LEDI - Ficha de Atividade Coletiva
   */
  async convertAtividadeColetiva(atividadeId: string): Promise<any> {
    const atividade = await this.prisma.atividadeColetiva.findUnique({
      where: { id: atividadeId },
      include: {
        unidade: true,
        profissional: true,
        participantes: {
          include: {
            citizen: true,
          },
        },
      },
    });

    if (!atividade) {
      throw new Error('Atividade coletiva não encontrada');
    }

    return {
      headerTransport: {
        versaoSistema: '1.0',
        uuidFicha: this.generateUUID(),
        tipoRegistro: 6, // Atividade Coletiva
        cnesProfissional: atividade.unidade?.cnes || null,
        dataAtendimento: this.formatDate(atividade.dataRealizacao),
      },
      fichaAtividadeColetiva: {
        turno: this.getTurnoFromHora(atividade.horaInicio),
        numeroParticipantes: atividade.numParticipantes,

        // Tipo de atividade
        tipoAtividade: this.getTipoAtividadeColetiva(atividade.tipo),

        // Públicos
        publicoAlvo: this.getPublicoAlvo(atividade.publicoAlvo),

        // Temas
        temas: this.getTemasAtividade(atividade.temas),

        // Práticas
        praticasSaude: this.getPraticasSaude(atividade.atividadesRealizadas),

        // Participantes com avaliação alterada
        participantesAvaliacaoAlterada: atividade.participantes
          .filter((p: any) => p.avaliacaoAlterada)
          .map((p: any) => ({
            cpf: p.citizen ? this.formatCPF(p.citizen.cpf) : null,
            nome: p.citizen ? p.citizen.name : p.nome,
            peso: p.pesoAferido,
            altura: p.alturaAferida,
            pressaoArterial: p.pressaoArterial,
            glicemia: p.glicemia,
          })),
      },
    };
  }

  private getTurnoFromHora(hora: string): string {
    const h = parseInt(hora.split(':')[0]);
    if (h >= 6 && h < 12) return 'MANHA';
    if (h >= 12 && h < 18) return 'TARDE';
    return 'NOITE';
  }

  private getTipoAtividadeColetiva(tipo: string): number {
    const tipos: Record<string, number> = {
      'GRUPO_EDUCACAO_SAUDE': 1,
      'GRUPO_HIPERTENSOS': 2,
      'GRUPO_DIABETICOS': 3,
      'GRUPO_GESTANTES': 4,
      'GRUPO_SAUDE_MENTAL': 5,
      'GRUPO_IDOSOS': 6,
      'ATIVIDADE_FISICA': 7,
      'PALESTRA': 8,
      'OFICINA': 9,
    };
    return tipos[tipo] || 1;
  }

  private getPublicoAlvo(publicoAlvo: string): number[] {
    // Retornar array de códigos de público-alvo baseado na string
    // 1 = Criança, 2 = Adolescente, 3 = Mulher, 4 = Homem, 5 = Gestante, 6 = Idoso
    const publicos = [];

    if (publicoAlvo?.includes('criança')) publicos.push(1);
    if (publicoAlvo?.includes('adolescent')) publicos.push(2);
    if (publicoAlvo?.includes('mulher')) publicos.push(3);
    if (publicoAlvo?.includes('homem')) publicos.push(4);
    if (publicoAlvo?.includes('gestante')) publicos.push(5);
    if (publicoAlvo?.includes('idoso')) publicos.push(6);

    return publicos.length > 0 ? publicos : [7]; // 7 = Comunidade em geral
  }

  private getTemasAtividade(temas: any): number[] {
    // Mapear temas para códigos LEDI
    // Implementação simplificada
    return [1]; // 1 = Saúde em geral
  }

  private getPraticasSaude(atividades: any): number[] {
    // Mapear práticas para códigos LEDI
    // Implementação simplificada
    return [1]; // 1 = Educação em saúde
  }

  // =========================================================================
  // GERAÇÃO DE XML
  // =========================================================================

  /**
   * Gerar XML LEDI a partir do objeto convertido
   */
  generateXML(data: any, tipoFicha: string): string {
    // Implementação simplificada de geração XML
    // Em produção, usar biblioteca como xml2js ou fast-xml-parser

    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const rootTag = `<${tipoFicha}>`;
    const rootCloseTag = `</${tipoFicha}>`;

    const xmlContent = this.objectToXML(data);

    return `${xmlHeader}\n${rootTag}\n${xmlContent}\n${rootCloseTag}`;
  }

  private objectToXML(obj: any, indent: number = 1): string {
    const spaces = '  '.repeat(indent);
    let xml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (typeof value === 'object' && !Array.isArray(value)) {
        xml += `${spaces}<${key}>\n`;
        xml += this.objectToXML(value, indent + 1);
        xml += `${spaces}</${key}>\n`;
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          xml += `${spaces}<${key}>${item}</${key}>\n`;
        });
      } else {
        xml += `${spaces}<${key}>${value}</${key}>\n`;
      }
    }

    return xml;
  }

  // =========================================================================
  // PREPARAÇÃO PARA THRIFT
  // =========================================================================

  /**
   * Preparar dados para serialização Thrift
   * Retorna objeto com estrutura compatível com arquivos Thrift do repositório oficial
   */
  prepareForThrift(data: any, tipoFicha: string): any {
    // A serialização Thrift real deve usar a biblioteca oficial do Apache Thrift
    // e os arquivos .thrift do repositório: github.com/laboratoriobridge/esusab-integracao

    return {
      tipo: tipoFicha,
      versao: '6.3.8', // Versão LEDI
      dadosSerializados: data,
      // Em produção, usar: thrift.serialize(data)
    };
  }
}
