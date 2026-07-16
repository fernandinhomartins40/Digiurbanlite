import { prisma } from '../../lib/prisma';


export interface MontarListaDTO {
  dataViagem: Date;
  destino: string;
  horarioSaida: string;
}

interface Passageiro {
  solicitacaoId: string;
  citizenId: string;
  isAcompanhante: boolean;
  necessidadeEspecial: boolean;
  nome?: string;
}

export class TFDMontadorService {
  /**
   * 🔥 ALGORITMO MONTADOR DE LISTAS AUTOMÁTICO
   *
   * Agrupa automaticamente solicitações com mesmo destino e data,
   * seleciona veículo adequado e motorista disponível
   */
  async montarListaAutomatica(data: MontarListaDTO) {
    console.log('🚌 Iniciando montagem automática de lista...');

    // 1. BUSCAR SOLICITAÇÕES COMPATÍVEIS
    const solicitacoes = await prisma.solicitacaoTFD.findMany({
      where: {
        status: 'AGENDADO',
        cidadeDestino: data.destino,
        dataConsulta: {
          gte: new Date(data.dataViagem.setHours(0, 0, 0, 0)),
          lte: new Date(data.dataViagem.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        // TODO: Incluir dados do cidadão e acompanhante quando relations estiverem corretas
      },
    });

    if (solicitacoes.length === 0) {
      throw new Error('Nenhuma solicitação agendada encontrada para esta data e destino');
    }

    console.log(`✅ Encontradas ${solicitacoes.length} solicitações compatíveis`);

    // 2. AGRUPAR PASSAGEIROS (pacientes + acompanhantes)
    const passageiros: Passageiro[] = [];
    let precisaAcessibilidade = false;

    for (const sol of solicitacoes) {
      // Adicionar paciente
      passageiros.push({
        solicitacaoId: sol.id,
        citizenId: sol.citizenId,
        isAcompanhante: false,
        necessidadeEspecial: false, // TODO: Adicionar campo no schema
      });

      // Adicionar acompanhante se houver
      if (sol.acompanhanteId) {
        passageiros.push({
          solicitacaoId: sol.id,
          citizenId: sol.acompanhanteId,
          isAcompanhante: true,
          necessidadeEspecial: false,
        });
      }

      // Verificar necessidades especiais
      if (sol.classificacaoRisco === 'ACESSIBILIDADE') {
        precisaAcessibilidade = true;
      }
    }

    const totalPassageiros = passageiros.length;
    console.log(`👥 Total de passageiros: ${totalPassageiros}`);
    console.log(`♿ Necessita acessibilidade: ${precisaAcessibilidade}`);

    // 3. SELECIONAR VEÍCULO ADEQUADO (ALGORITMO INTELIGENTE)
    let tipoVeiculo: string;
    let capacidadeMinima: number;

    if (totalPassageiros <= 4) {
      tipoVeiculo = 'CARRO';
      capacidadeMinima = 5;
    } else if (totalPassageiros <= 8) {
      tipoVeiculo = 'VAN';
      capacidadeMinima = 9;
    } else if (totalPassageiros <= 15) {
      tipoVeiculo = 'MICROONIBUS';
      capacidadeMinima = 16;
    } else {
      tipoVeiculo = 'ONIBUS';
      capacidadeMinima = 20;
    }

    console.log(`🚗 Tipo de veículo selecionado: ${tipoVeiculo} (capacidade mínima: ${capacidadeMinima})`);

    const veiculo = await prisma.veiculoTFD.findFirst({
      where: {
        status: 'DISPONIVEL',
        capacidade: { gte: capacidadeMinima },
        acessibilidade: precisaAcessibilidade ? true : undefined,
        isActive: true,
      },
      orderBy: [
        { capacidade: 'asc' }, // Menor veículo que caiba todos
        { km: 'asc' }, // Menor km rodado
      ],
    });

    if (!veiculo) {
      throw new Error(
        `Nenhum veículo disponível com capacidade para ${totalPassageiros} passageiros${
          precisaAcessibilidade ? ' e acessibilidade' : ''
        }`
      );
    }

    console.log(`✅ Veículo selecionado: ${veiculo.modelo} (${veiculo.placa}) - Capacidade: ${veiculo.capacidade}`);

    // 4. SELECIONAR MOTORISTA DISPONÍVEL
    const motorista = await prisma.motoristaTFD.findFirst({
      where: {
        status: 'DISPONIVEL',
        validadeCNH: { gte: new Date() },
        isActive: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    if (!motorista) {
      throw new Error('Nenhum motorista disponível com CNH válida');
    }

    console.log(`✅ Motorista selecionado: ${motorista.nome} (CNH: ${motorista.cnh})`);

    // 5. CRIAR VIAGEM AUTOMATICAMENTE
    const viagem = await prisma.viagemTFD.create({
      data: {
        solicitacaoTFDId: solicitacoes[0].id, // Viagem principal vinculada à primeira solicitação
        tipo: 'IDA_E_VOLTA',
        dataViagem: data.dataViagem,
        horarioSaida: data.horarioSaida,
        veiculoId: veiculo.id,
        motoristaId: motorista.id,
        passageiros: passageiros as any, // JSON com lista de passageiros
        status: 'PLANEJADA',
        observacoes: `Viagem criada automaticamente pelo sistema. ${totalPassageiros} passageiros para ${data.destino}.`,
      },
    });

    console.log(`✅ Viagem criada: ${viagem.id}`);

    // 6. ATUALIZAR STATUS DAS SOLICITAÇÕES
    await prisma.solicitacaoTFD.updateMany({
      where: {
        id: { in: solicitacoes.map((s) => s.id) },
      },
      data: {
        status: 'AGUARDANDO_VIAGEM',
      },
    });

    console.log(`✅ ${solicitacoes.length} solicitações atualizadas para AGUARDANDO_VIAGEM`);

    // 7. ATUALIZAR STATUS DO VEÍCULO E MOTORISTA (reservados para a viagem)
    await prisma.veiculoTFD.update({
      where: { id: veiculo.id },
      data: { status: 'EM_VIAGEM' },
    });

    await prisma.motoristaTFD.update({
      where: { id: motorista.id },
      data: { status: 'EM_VIAGEM' },
    });

    console.log('✅ Veículo e motorista reservados para a viagem');

    // 8. RETORNAR RESULTADO COMPLETO
    const resultado = {
      viagem: {
        id: viagem.id,
        dataViagem: viagem.dataViagem,
        horarioSaida: viagem.horarioSaida,
        destino: data.destino,
      },
      passageiros: {
        total: totalPassageiros,
        pacientes: passageiros.filter((p) => !p.isAcompanhante).length,
        acompanhantes: passageiros.filter((p) => p.isAcompanhante).length,
        lista: passageiros,
      },
      veiculo: {
        id: veiculo.id,
        modelo: veiculo.modelo,
        placa: veiculo.placa,
        capacidade: veiculo.capacidade,
        acessibilidade: veiculo.acessibilidade,
      },
      motorista: {
        id: motorista.id,
        nome: motorista.nome,
        cnh: motorista.cnh,
        telefone: motorista.telefone,
      },
      solicitacoes: solicitacoes.map((s) => ({
        id: s.id,
        protocolId: s.protocolId,
        especialidade: s.especialidade,
      })),
    };

    console.log('🎉 Lista montada com sucesso!');
    return resultado;
  }

  /**
   * Obter preview da lista sem criar a viagem
   */
  async previewLista(data: MontarListaDTO) {
    const solicitacoes = await prisma.solicitacaoTFD.findMany({
      where: {
        status: 'AGENDADO',
        cidadeDestino: data.destino,
        dataConsulta: {
          gte: new Date(data.dataViagem.setHours(0, 0, 0, 0)),
          lte: new Date(data.dataViagem.setHours(23, 59, 59, 999)),
        },
      },
    });

    const totalPassageiros = solicitacoes.reduce((total, sol) => {
      return total + 1 + (sol.acompanhanteId ? 1 : 0);
    }, 0);

    let tipoVeiculoRecomendado: string;
    if (totalPassageiros <= 4) tipoVeiculoRecomendado = 'CARRO';
    else if (totalPassageiros <= 8) tipoVeiculoRecomendado = 'VAN';
    else if (totalPassageiros <= 15) tipoVeiculoRecomendado = 'MICROONIBUS';
    else tipoVeiculoRecomendado = 'ONIBUS';

    return {
      totalSolicitacoes: solicitacoes.length,
      totalPassageiros,
      tipoVeiculoRecomendado,
      solicitacoes: solicitacoes.map((s) => ({
        protocolId: s.protocolId,
        especialidade: s.especialidade,
        temAcompanhante: !!s.acompanhanteId,
      })),
    };
  }
}

export default new TFDMontadorService();
