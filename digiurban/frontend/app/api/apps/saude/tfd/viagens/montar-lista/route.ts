import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * MONTADOR AUTOMÁTICO DE LISTA DE PASSAGEIROS TFD
 *
 * Algoritmo inteligente que:
 * 1. Agrupa solicitações por data/destino
 * 2. Calcula total de passageiros (paciente + acompanhante)
 * 3. Verifica necessidades especiais
 * 4. Seleciona veículo adequado
 * 5. Aloca motorista disponível
 * 6. Cria viagem automaticamente
 */

interface MontarListaInput {
  dataViagem: string; // ISO date
  cidadeDestino: string;
  estadoDestino: string;
}

interface PassageiroAgrupado {
  solicitacaoId: string;
  citizenId: string;
  nomeCidadao: string;
  isAcompanhante: boolean;
  necessidadeEspecial: boolean;
  descricaoNecessidade?: string;
}

export async function POST(request: Request) {
  try {
    const body: MontarListaInput = await request.json();

    const { dataViagem, cidadeDestino, estadoDestino } = body;

    if (!dataViagem || !cidadeDestino || !estadoDestino) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    // 1. Buscar solicitações APROVADAS para mesma data/destino
    const solicitacoes = await prisma.solicitacaoTFD.findMany({
      where: {
        status: "APROVADO_PARA_AGENDAMENTO",
        dataConsulta: new Date(dataViagem),
        cidadeDestino,
        estadoDestino,
      },
      include: {
        // Incluir dados do cidadão (via relation se existir)
      },
    });

    if (solicitacoes.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma solicitação encontrada para esta data/destino" },
        { status: 404 }
      );
    }

    // 2. Agrupar passageiros (paciente + acompanhante)
    const passageiros: PassageiroAgrupado[] = [];

    for (const sol of solicitacoes) {
      // Adicionar paciente
      passageiros.push({
        solicitacaoId: sol.id,
        citizenId: sol.citizenId,
        nomeCidadao: "Cidadão", // Buscar nome real do Citizen
        isAcompanhante: false,
        necessidadeEspecial: sol.necessidadeEspecial,
        descricaoNecessidade: sol.descricaoNecessidade || undefined,
      });

      // Adicionar acompanhante se houver
      if (sol.acompanhanteNome && sol.acompanhanteCPF) {
        passageiros.push({
          solicitacaoId: sol.id,
          citizenId: sol.acompanhanteCPF, // Usar CPF como ID temporário
          nomeCidadao: sol.acompanhanteNome,
          isAcompanhante: true,
          necessidadeEspecial: false,
        });
      }
    }

    const totalPassageiros = passageiros.length;

    // 3. Verificar necessidade de acessibilidade
    const precisaAcessibilidade = passageiros.some(
      (p) => p.necessidadeEspecial
    );

    console.log(`[MONTADOR] Total de passageiros: ${totalPassageiros}`);
    console.log(`[MONTADOR] Precisa acessibilidade: ${precisaAcessibilidade}`);

    // 4. Selecionar veículo adequado
    const veiculo = await selecionarVeiculo({
      totalPassageiros,
      precisaAcessibilidade,
      dataViagem: new Date(dataViagem),
    });

    if (!veiculo) {
      return NextResponse.json(
        {
          error: `Nenhum veículo disponível para ${totalPassageiros} passageiros${
            precisaAcessibilidade ? " com acessibilidade" : ""
          }`,
        },
        { status: 404 }
      );
    }

    // 5. Selecionar motorista disponível
    const motorista = await selecionarMotorista({
      dataViagem: new Date(dataViagem),
    });

    if (!motorista) {
      return NextResponse.json(
        { error: "Nenhum motorista disponível para esta data" },
        { status: 404 }
      );
    }

    // 6. Criar viagem com lista de passageiros
    const viagem = await prisma.viagemTFD.create({
      data: {
        dataViagem: new Date(dataViagem),
        horarioSaida: "06:00", // Horário padrão, pode ser customizado
        cidadeDestino,
        estadoDestino,
        veiculoId: veiculo.id,
        motoristaId: motorista.id,
        totalPassageiros,
        passageiros: passageiros, // JSON com lista
        tipo: "IDA_E_VOLTA",
        status: "PLANEJADA",
      },
    });

    // 7. Atualizar status das solicitações
    await prisma.solicitacaoTFD.updateMany({
      where: {
        id: { in: solicitacoes.map((s) => s.id) },
      },
      data: {
        status: "AGUARDANDO_VIAGEM",
      },
    });

    return NextResponse.json({
      success: true,
      viagem: {
        id: viagem.id,
        dataViagem: viagem.dataViagem,
        veiculo: {
          id: veiculo.id,
          modelo: veiculo.modelo,
          placa: veiculo.placa,
          capacidade: veiculo.capacidade,
        },
        motorista: {
          id: motorista.id,
          nome: motorista.nome,
        },
        totalPassageiros,
        passageiros: passageiros.length,
        solicitacoes: solicitacoes.length,
      },
    });
  } catch (error) {
    console.error("[MONTADOR] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao montar lista de passageiros" },
      { status: 500 }
    );
  }
}

/**
 * Seleciona o veículo adequado baseado no número de passageiros e acessibilidade
 */
async function selecionarVeiculo(params: {
  totalPassageiros: number;
  precisaAcessibilidade: boolean;
  dataViagem: Date;
}) {
  const { totalPassageiros, precisaAcessibilidade, dataViagem } = params;

  // Determinar tipo de veículo necessário
  let tipoVeiculo: "CARRO" | "VAN" | "MICRO_ONIBUS" | "ONIBUS";

  if (totalPassageiros <= 4) {
    tipoVeiculo = "CARRO";
  } else if (totalPassageiros <= 8) {
    tipoVeiculo = "VAN";
  } else if (totalPassageiros <= 15) {
    tipoVeiculo = "MICRO_ONIBUS";
  } else {
    tipoVeiculo = "ONIBUS";
  }

  console.log(`[SELETOR] Tipo de veículo necessário: ${tipoVeiculo}`);

  // Buscar veículo disponível
  // Nota: A relação com viagens precisa ser ajustada conforme model real
  const veiculo = await prisma.veiculoTFD.findFirst({
    where: {
      status: "DISPONIVEL",
      acessibilidade: precisaAcessibilidade ? true : undefined,
      capacidade: { gte: totalPassageiros },
      isActive: true,
    },
    orderBy: {
      capacidade: "asc", // Pegar o menor veículo que atenda
    },
  });

  return veiculo;
}

/**
 * Seleciona motorista disponível para a data
 */
async function selecionarMotorista(params: { dataViagem: Date }) {
  const { dataViagem } = params;

  const motorista = await prisma.motoristaTFD.findFirst({
    where: {
      status: "DISPONIVEL",
      validadeCNH: { gte: dataViagem },
      isActive: true,
    },
  });

  return motorista;
}
