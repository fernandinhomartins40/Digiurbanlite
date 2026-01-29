import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LEDIConverterService } from './ledi-converter.service';
import * as crypto from 'crypto';

/**
 * FASE 3.2: Serviço de Envio via API REST para PEC e-SUS APS
 *
 * Responsável por:
 * - Autenticação no PEC
 * - Envio de fichas LEDI
 * - Gerenciamento de filas e retry
 * - Registro de logs
 */
@Injectable()
export class ESusApiService {
  private readonly logger = new Logger(ESusApiService.name);
  private sessionCache: Map<string, { cookie: string; expiresAt: Date }> = new Map();

  constructor(
    private prisma: PrismaService,
    private lediConverter: LEDIConverterService,
  ) {}

  /**
   * Obter configuração ativa do município
   */
  private async getConfig(municipioId: string = 'singleton') {
    const config = await this.prisma.configuracaoESUS.findUnique({
      where: { municipioId },
    });

    if (!config || !config.integracaoAtiva) {
      throw new Error('Integração e-SUS não está ativa');
    }

    if (config.tipoIntegracao !== 'API_REST') {
      throw new Error('Tipo de integração não é API REST');
    }

    if (!config.urlPEC || !config.usuarioAPI || !config.senhaAPI) {
      throw new Error('Credenciais de API incompletas');
    }

    return config;
  }

  /**
   * Fazer login no PEC e-SUS e obter JSESSIONID
   */
  private async authenticate(config: any): Promise<string> {
    // Verificar cache
    const cached = this.sessionCache.get(config.id);
    if (cached && cached.expiresAt > new Date()) {
      this.logger.debug('Usando sessão em cache');
      return cached.cookie;
    }

    this.logger.log(`Autenticando no PEC: ${config.urlPEC}`);

    try {
      const response = await fetch(`${config.urlPEC}/api/recebimento/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: config.usuarioAPI,
          senha: config.senhaAPI,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Autenticação falhou: ${response.status} - ${errorText}`);
      }

      // Extrair JSESSIONID do cookie
      const setCookie = response.headers.get('set-cookie');
      if (!setCookie) {
        throw new Error('Cookie JSESSIONID não foi retornado');
      }

      const jsessionMatch = setCookie.match(/JSESSIONID=([^;]+)/);
      if (!jsessionMatch) {
        throw new Error('JSESSIONID não encontrado no cookie');
      }

      const jsessionId = jsessionMatch[1];
      const cookie = `JSESSIONID=${jsessionId}`;

      // Cachear por 10 minutos
      this.sessionCache.set(config.id, {
        cookie,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      this.logger.log('Autenticação bem-sucedida');
      return cookie;
    } catch (error) {
      this.logger.error(`Erro na autenticação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enviar ficha LEDI para o PEC via API REST
   */
  private async sendFicha(
    config: any,
    cookie: string,
    fichaData: Buffer,
    uuidFicha: string,
  ): Promise<{ success: boolean; statusCode: number; message?: string; errors?: any }> {
    this.logger.log(`Enviando ficha: ${uuidFicha}`);

    try {
      const response = await fetch(`${config.urlPEC}/api/v1/recebimento/ficha`, {
        method: 'POST',
        headers: {
          'Cookie': cookie,
          'Content-Type': 'application/octet-stream',
          'Content-Length': fichaData.length.toString(),
        },
        body: fichaData,
      });

      const statusCode = response.status;

      if (statusCode === 200) {
        this.logger.log(`Ficha ${uuidFicha} enviada com sucesso`);
        return {
          success: true,
          statusCode: 200,
          message: 'Ficha enviada com sucesso',
        };
      } else if (statusCode === 400) {
        // Erro de validação
        const errorBody = await response.text();
        this.logger.warn(`Erro de validação: ${errorBody}`);

        try {
          const errors = JSON.parse(errorBody);
          return {
            success: false,
            statusCode: 400,
            message: 'Erro de validação',
            errors,
          };
        } catch {
          return {
            success: false,
            statusCode: 400,
            message: errorBody,
          };
        }
      } else if (statusCode === 401) {
        // Sessão expirada, limpar cache
        this.sessionCache.delete(config.id);
        throw new Error('Sessão expirada, reautenticação necessária');
      } else {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${statusCode}: ${errorText}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao enviar ficha: ${error.message}`);
      throw error;
    }
  }

  /**
   * Serializar dados LEDI para formato binário (simplificado)
   * Em produção, usar biblioteca Apache Thrift oficial
   */
  private serializeLEDI(data: any): Buffer {
    // Esta é uma implementação simplificada
    // Em produção, usar: thrift.serialize(data, FichaThriftStruct)
    const jsonString = JSON.stringify(data);
    return Buffer.from(jsonString, 'utf-8');
  }

  // =========================================================================
  // ENVIO DE FICHAS POR TIPO
  // =========================================================================

  /**
   * Enviar cadastro individual
   */
  async enviarCadastroIndividual(
    citizenId: string,
    municipioId: string = 'singleton',
  ): Promise<void> {
    const config = await this.getConfig(municipioId);

    // Converter para LEDI
    const lediData = await this.lediConverter.convertCadastroIndividual(citizenId);
    const uuidFicha = lediData.headerTransport.uuidFicha;

    // Registrar transmissão
    const transmissao = await this.prisma.transmissaoESUS.create({
      data: {
        configuracaoId: config.id,
        tipo: 'CADASTRO_INDIVIDUAL',
        formato: 'THRIFT',
        fichaId: citizenId,
        entidadeOrigem: 'Citizen',
        nomeArquivo: `${uuidFicha}.esus`,
        payloadJSON: lediData,
        status: 'PENDENTE',
        tentativas: 0,
      },
    });

    try {
      // Autenticar
      const cookie = await this.authenticate(config);

      // Serializar
      const fichaBuffer = this.serializeLEDI(lediData);

      // Enviar
      const result = await this.sendFicha(config, cookie, fichaBuffer, uuidFicha);

      // Atualizar status
      await this.prisma.transmissaoESUS.update({
        where: { id: transmissao.id },
        data: {
          status: result.success ? 'SUCESSO' : 'ERRO_VALIDACAO',
          dataConfirmacao: new Date(),
          codigoResposta: result.statusCode,
          mensagemResposta: result.message,
          erros: result.errors,
        },
      });
    } catch (error) {
      // Registrar erro
      await this.prisma.transmissaoESUS.update({
        where: { id: transmissao.id },
        data: {
          status: error.message.includes('autenticação') ? 'ERRO_AUTENTICACAO' : 'ERRO_CONEXAO',
          mensagemResposta: error.message,
          tentativas: transmissao.tentativas + 1,
          ultimaFalha: new Date(),
          proximaTentativa:
            transmissao.tentativas + 1 < config.maxTentativas
              ? new Date(Date.now() + 5 * 60 * 1000) // Retry em 5 minutos
              : null,
        },
      });

      throw error;
    }
  }

  /**
   * Enviar atendimento individual (consulta médica)
   */
  async enviarAtendimentoIndividual(
    consultaId: string,
    municipioId: string = 'singleton',
  ): Promise<void> {
    const config = await this.getConfig(municipioId);

    const lediData = await this.lediConverter.convertAtendimentoIndividual(consultaId);
    const uuidFicha = lediData.headerTransport.uuidFicha;

    const transmissao = await this.prisma.transmissaoESUS.create({
      data: {
        configuracaoId: config.id,
        tipo: 'ATENDIMENTO_INDIVIDUAL',
        formato: 'THRIFT',
        fichaId: consultaId,
        entidadeOrigem: 'ConsultaMedica',
        nomeArquivo: `${uuidFicha}.esus`,
        payloadJSON: lediData,
        status: 'PENDENTE',
        tentativas: 0,
      },
    });

    try {
      const cookie = await this.authenticate(config);
      const fichaBuffer = this.serializeLEDI(lediData);
      const result = await this.sendFicha(config, cookie, fichaBuffer, uuidFicha);

      await this.prisma.transmissaoESUS.update({
        where: { id: transmissao.id },
        data: {
          status: result.success ? 'SUCESSO' : 'ERRO_VALIDACAO',
          dataConfirmacao: new Date(),
          codigoResposta: result.statusCode,
          mensagemResposta: result.message,
          erros: result.errors,
        },
      });
    } catch (error) {
      await this.prisma.transmissaoESUS.update({
        where: { id: transmissao.id },
        data: {
          status: error.message.includes('autenticação') ? 'ERRO_AUTENTICACAO' : 'ERRO_CONEXAO',
          mensagemResposta: error.message,
          tentativas: transmissao.tentativas + 1,
          ultimaFalha: new Date(),
          proximaTentativa:
            transmissao.tentativas + 1 < config.maxTentativas
              ? new Date(Date.now() + 5 * 60 * 1000)
              : null,
        },
      });

      throw error;
    }
  }

  /**
   * Enviar atendimento odontológico
   */
  async enviarAtendimentoOdontologico(
    atendimentoId: string,
    municipioId: string = 'singleton',
  ): Promise<void> {
    const config = await this.getConfig(municipioId);

    const lediData = await this.lediConverter.convertAtendimentoOdontologico(atendimentoId);
    const uuidFicha = lediData.headerTransport.uuidFicha;

    const transmissao = await this.prisma.transmissaoESUS.create({
      data: {
        configuracaoId: config.id,
        tipo: 'ATENDIMENTO_ODONTOLOGICO',
        formato: 'THRIFT',
        fichaId: atendimentoId,
        entidadeOrigem: 'AtendimentoOdontologico',
        nomeArquivo: `${uuidFicha}.esus`,
        payloadJSON: lediData,
        status: 'PENDENTE',
        tentativas: 0,
      },
    });

    try {
      const cookie = await this.authenticate(config);
      const fichaBuffer = this.serializeLEDI(lediData);
      const result = await this.sendFicha(config, cookie, fichaBuffer, uuidFicha);

      await this.prisma.transmissaoESUS.update({
        where: { id: transmissao.id },
        data: {
          status: result.success ? 'SUCESSO' : 'ERRO_VALIDACAO',
          dataConfirmacao: new Date(),
          codigoResposta: result.statusCode,
          mensagemResposta: result.message,
          erros: result.errors,
        },
      });
    } catch (error) {
      await this.prisma.transmissaoESUS.update({
        where: { id: transmissao.id },
        data: {
          status: error.message.includes('autenticação') ? 'ERRO_AUTENTICACAO' : 'ERRO_CONEXAO',
          mensagemResposta: error.message,
          tentativas: transmissao.tentativas + 1,
          ultimaFalha: new Date(),
          proximaTentativa:
            transmissao.tentativas + 1 < config.maxTentativas
              ? new Date(Date.now() + 5 * 60 * 1000)
              : null,
        },
      });

      throw error;
    }
  }

  /**
   * Enviar visita domiciliar
   */
  async enviarVisitaDomiciliar(
    visitaId: string,
    municipioId: string = 'singleton',
  ): Promise<void> {
    const config = await this.getConfig(municipioId);

    const lediData = await this.lediConverter.convertVisitaDomiciliar(visitaId);
    const uuidFicha = lediData.headerTransport.uuidFicha;

    const transmissao = await this.prisma.transmissaoESUS.create({
      data: {
        configuracaoId: config.id,
        tipo: 'VISITA_DOMICILIAR',
        formato: 'THRIFT',
        fichaId: visitaId,
        entidadeOrigem: 'VisitaDomiciliar',
        nomeArquivo: `${uuidFicha}.esus`,
        payloadJSON: lediData,
        status: 'PENDENTE',
        tentativas: 0,
      },
    });

    try {
      const cookie = await this.authenticate(config);
      const fichaBuffer = this.serializeLEDI(lediData);
      const result = await this.sendFicha(config, cookie, fichaBuffer, uuidFicha);

      await this.prisma.transmissaoESUS.update({
        where: { id: transmissao.id },
        data: {
          status: result.success ? 'SUCESSO' : 'ERRO_VALIDACAO',
          dataConfirmacao: new Date(),
          codigoResposta: result.statusCode,
          mensagemResposta: result.message,
          erros: result.errors,
        },
      });
    } catch (error) {
      await this.prisma.transmissaoESUS.update({
        where: { id: transmissao.id },
        data: {
          status: error.message.includes('autenticação') ? 'ERRO_AUTENTICACAO' : 'ERRO_CONEXAO',
          mensagemResposta: error.message,
          tentativas: transmissao.tentativas + 1,
          ultimaFalha: new Date(),
          proximaTentativa:
            transmissao.tentativas + 1 < config.maxTentativas
              ? new Date(Date.now() + 5 * 60 * 1000)
              : null,
        },
      });

      throw error;
    }
  }

  /**
   * Enviar atividade coletiva
   */
  async enviarAtividadeColetiva(
    atividadeId: string,
    municipioId: string = 'singleton',
  ): Promise<void> {
    const config = await this.getConfig(municipioId);

    const lediData = await this.lediConverter.convertAtividadeColetiva(atividadeId);
    const uuidFicha = lediData.headerTransport.uuidFicha;

    const transmissao = await this.prisma.transmissaoESUS.create({
      data: {
        configuracaoId: config.id,
        tipo: 'ATIVIDADE_COLETIVA',
        formato: 'THRIFT',
        fichaId: atividadeId,
        entidadeOrigem: 'AtividadeColetiva',
        nomeArquivo: `${uuidFicha}.esus`,
        payloadJSON: lediData,
        status: 'PENDENTE',
        tentativas: 0,
      },
    });

    try {
      const cookie = await this.authenticate(config);
      const fichaBuffer = this.serializeLEDI(lediData);
      const result = await this.sendFicha(config, cookie, fichaBuffer, uuidFicha);

      await this.prisma.transmissaoESUS.update({
        where: { id: transmissao.id },
        data: {
          status: result.success ? 'SUCESSO' : 'ERRO_VALIDACAO',
          dataConfirmacao: new Date(),
          codigoResposta: result.statusCode,
          mensagemResposta: result.message,
          erros: result.errors,
        },
      });
    } catch (error) {
      await this.prisma.transmissaoESUS.update({
        where: { id: transmissao.id },
        data: {
          status: error.message.includes('autenticação') ? 'ERRO_AUTENTICACAO' : 'ERRO_CONEXAO',
          mensagemResposta: error.message,
          tentativas: transmissao.tentativas + 1,
          ultimaFalha: new Date(),
          proximaTentativa:
            transmissao.tentativas + 1 < config.maxTentativas
              ? new Date(Date.now() + 5 * 60 * 1000)
              : null,
        },
      });

      throw error;
    }
  }

  // =========================================================================
  // PROCESSAMENTO EM LOTE E RETRY
  // =========================================================================

  /**
   * Processar fila de transmissões pendentes
   */
  async processarFilaPendentes(
    municipioId: string = 'singleton',
    limite: number = 50,
  ): Promise<{ processados: number; sucesso: number; erros: number }> {
    const config = await this.getConfig(municipioId);

    // Buscar pendentes e com retry agendado
    const pendentes = await this.prisma.transmissaoESUS.findMany({
      where: {
        configuracaoId: config.id,
        status: {
          in: ['PENDENTE', 'AGUARDANDO_RETRY'],
        },
        OR: [
          { proximaTentativa: null },
          { proximaTentativa: { lte: new Date() } },
        ],
        tentativas: { lt: config.maxTentativas },
      },
      take: limite,
      orderBy: { dataEnvio: 'asc' },
    });

    let processados = 0;
    let sucesso = 0;
    let erros = 0;

    for (const transmissao of pendentes) {
      try {
        this.logger.log(`Processando transmissão ${transmissao.id} (${transmissao.tipo})`);

        // Reenviar baseado no tipo
        switch (transmissao.tipo) {
          case 'CADASTRO_INDIVIDUAL':
            await this.enviarCadastroIndividual(transmissao.fichaId, municipioId);
            break;
          case 'ATENDIMENTO_INDIVIDUAL':
            await this.enviarAtendimentoIndividual(transmissao.fichaId, municipioId);
            break;
          case 'ATENDIMENTO_ODONTOLOGICO':
            await this.enviarAtendimentoOdontologico(transmissao.fichaId, municipioId);
            break;
          case 'VISITA_DOMICILIAR':
            await this.enviarVisitaDomiciliar(transmissao.fichaId, municipioId);
            break;
          case 'ATIVIDADE_COLETIVA':
            await this.enviarAtividadeColetiva(transmissao.fichaId, municipioId);
            break;
          default:
            this.logger.warn(`Tipo de ficha não suportado: ${transmissao.tipo}`);
        }

        sucesso++;
      } catch (error) {
        this.logger.error(`Erro ao processar transmissão ${transmissao.id}: ${error.message}`);
        erros++;
      }

      processados++;
    }

    this.logger.log(
      `Processamento concluído: ${processados} processados, ${sucesso} sucesso, ${erros} erros`,
    );

    return { processados, sucesso, erros };
  }
}
