import { PrismaClient, TipoInsumoAgricola } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAgriculturaMS() {
  console.log('🌾 Iniciando seed dos Micro Sistemas de Agricultura...');

  try {
    // ========== MS-01: PRODUTORES RURAIS ==========
    console.log('  📋 Criando produtores rurais de exemplo...');

    const produtores = await Promise.all([
      prisma.produtorRural.upsert({
        where: { cpf: '111.111.111-11' },
        update: {},
        create: {
          citizenId: 'citizen-agri-001',
          cpf: '111.111.111-11',
          nome: 'João Silva dos Santos',
          rg: '12345678',
          rgOrgaoEmissor: 'SSP/SP',
          dataNascimento: new Date('1975-03-15'),
          estadoCivil: 'Casado',
          telefone: '(11) 3456-7890',
          celular: '(11) 98765-4321',
          email: 'joao.silva@email.com',
          enderecoResidencial: {
            logradouro: 'Rua das Flores',
            numero: '123',
            bairro: 'Centro',
            cidade: 'São Paulo',
            uf: 'SP',
            cep: '01234-567',
          },
          dap: 'DAP-2024-001',
          dataValidadeDap: new Date('2025-12-31'),
          car: 'CAR-SP-123456',
          inscricaoEstadual: 'IE-123456789',
          atividadePrincipal: 'Agricultura Familiar',
          tempoAtuacao: 25,
          associacao: 'Associação dos Produtores Rurais de SP',
          numeroCarteirinha: '2024000001',
          dataEmissaoCarteirinha: new Date(),
        },
      }),

      prisma.produtorRural.upsert({
        where: { cpf: '222.222.222-22' },
        update: {},
        create: {
          citizenId: 'citizen-agri-002',
          cpf: '222.222.222-22',
          nome: 'Maria Oliveira Costa',
          celular: '(11) 99876-5432',
          email: 'maria.oliveira@email.com',
          dap: 'DAP-2024-002',
          dataValidadeDap: new Date('2025-12-31'),
          atividadePrincipal: 'Hortaliças Orgânicas',
          tempoAtuacao: 15,
          numeroCarteirinha: '2024000002',
          dataEmissaoCarteirinha: new Date(),
        },
      }),

      prisma.produtorRural.upsert({
        where: { cpf: '333.333.333-33' },
        update: {},
        create: {
          citizenId: 'citizen-agri-003',
          cpf: '333.333.333-33',
          nome: 'Pedro Henrique Alves',
          celular: '(11) 99111-2233',
          email: 'pedro.alves@email.com',
          dap: 'DAP-2024-003',
          dataValidadeDap: new Date('2025-12-31'),
          car: 'CAR-SP-789012',
          atividadePrincipal: 'Pecuária Leiteira',
          tempoAtuacao: 30,
          numeroCarteirinha: '2024000003',
          dataEmissaoCarteirinha: new Date(),
        },
      }),
    ]);

    console.log(`  ✅ ${produtores.length} produtores rurais criados`);

    // ========== MS-02: PROPRIEDADES RURAIS ==========
    console.log('  🏞️  Criando propriedades rurais de exemplo...');

    const propriedades = await Promise.all([
      prisma.propriedadeRural.create({
        data: {
          produtorId: produtores[0].id,
          nome: 'Sítio Boa Esperança',
          endereco: {
            logradouro: 'Estrada Municipal 345',
            zona: 'Rural',
            distrito: 'Jardim',
            cidade: 'São Paulo',
            uf: 'SP',
          },
          latitude: -23.5505,
          longitude: -46.6333,
          areaTotalHectares: 25.5,
          areaAgricolaHectares: 15.0,
          areaPastoHectares: 8.0,
          areaReservaHectares: 2.5,
          car: 'CAR-SP-123456',
          temEnergia: true,
          temAgua: true,
          fontesAgua: ['Poço artesiano', 'Nascente'],
          temIrrigacao: true,
          tipoIrrigacao: 'Gotejamento',
          acessoEstrada: 'Terra',
          distanciaSede: 15.5,
          atividadesPrincipais: ['Hortaliças', 'Frutas'],
          culturas: ['Alface', 'Tomate', 'Morango'],
        },
      }),

      prisma.propriedadeRural.create({
        data: {
          produtorId: produtores[1].id,
          nome: 'Chácara Verde Vida',
          endereco: {
            logradouro: 'Rodovia SP-100, Km 45',
            zona: 'Rural',
            cidade: 'São Paulo',
            uf: 'SP',
          },
          latitude: -23.4505,
          longitude: -46.5333,
          areaTotalHectares: 10.0,
          areaAgricolaHectares: 8.0,
          areaReservaHectares: 2.0,
          temEnergia: true,
          temAgua: true,
          fontesAgua: ['Poço'],
          temIrrigacao: true,
          tipoIrrigacao: 'Aspersão',
          acessoEstrada: 'Pavimentada',
          distanciaSede: 10.0,
          atividadesPrincipais: ['Hortaliças Orgânicas'],
          culturas: ['Alface', 'Rúcula', 'Espinafre'],
        },
      }),

      prisma.propriedadeRural.create({
        data: {
          produtorId: produtores[2].id,
          nome: 'Fazenda Bela Vista',
          endereco: {
            logradouro: 'Estrada Velha, s/n',
            zona: 'Rural',
            distrito: 'Barra Funda',
            cidade: 'São Paulo',
            uf: 'SP',
          },
          latitude: -23.6505,
          longitude: -46.7333,
          areaTotalHectares: 50.0,
          areaAgricolaHectares: 10.0,
          areaPastoHectares: 35.0,
          areaReservaHectares: 5.0,
          car: 'CAR-SP-789012',
          temEnergia: true,
          temAgua: true,
          fontesAgua: ['Represa', 'Córrego'],
          temIrrigacao: false,
          acessoEstrada: 'Terra',
          distanciaSede: 25.0,
          atividadesPrincipais: ['Pecuária Leiteira'],
          criacoes: ['Gado Leiteiro (50 cabeças)'],
        },
      }),
    ]);

    console.log(`  ✅ ${propriedades.length} propriedades rurais criadas`);

    // ========== MS-03: ESTOQUE DE SEMENTES E MUDAS ==========
    console.log('  🌱 Criando estoque de sementes e mudas...');

    const estoqueSementes = await Promise.all([
      prisma.estoqueSemente.upsert({
        where: { numeroLote: 'LOTE-2024-001' },
        update: {},
        create: {
          tipo: TipoInsumoAgricola.SEMENTE,
          nome: 'Milho Híbrido',
          especie: 'Zea mays',
          variedade: 'AG 7098',
          quantidadeAtual: 500,
          unidadeMedida: 'kg',
          estoqueMinimo: 100,
          estoqueMaximo: 1000,
          numeroLote: 'LOTE-2024-001',
          dataEntrada: new Date('2024-01-15'),
          fornecedor: 'Sementes Brasil Ltda',
          notaFiscal: 'NF-123456',
          valorUnitario: 85.50,
          dataValidade: new Date('2025-12-31'),
          taxaGerminacao: 95,
          tratamento: 'Fungicida + Inseticida',
          localArmazenamento: 'Galpão A - Prateleira 1',
          condicaoArmazenamento: 'Ambiente controlado, 20°C',
        },
      }),

      prisma.estoqueSemente.upsert({
        where: { numeroLote: 'LOTE-2024-002' },
        update: {},
        create: {
          tipo: TipoInsumoAgricola.SEMENTE,
          nome: 'Feijão Carioca',
          especie: 'Phaseolus vulgaris',
          variedade: 'IPR Tangará',
          quantidadeAtual: 300,
          unidadeMedida: 'kg',
          estoqueMinimo: 50,
          estoqueMaximo: 500,
          numeroLote: 'LOTE-2024-002',
          dataEntrada: new Date('2024-02-01'),
          fornecedor: 'Sementes Brasil Ltda',
          valorUnitario: 12.90,
          dataValidade: new Date('2025-06-30'),
          taxaGerminacao: 90,
          localArmazenamento: 'Galpão A - Prateleira 2',
        },
      }),

      prisma.estoqueSemente.upsert({
        where: { numeroLote: 'LOTE-2024-003' },
        update: {},
        create: {
          tipo: TipoInsumoAgricola.MUDA,
          nome: 'Mudas de Alface',
          especie: 'Lactuca sativa',
          variedade: 'Crespa',
          quantidadeAtual: 2000,
          unidadeMedida: 'unidade',
          estoqueMinimo: 500,
          estoqueMaximo: 5000,
          numeroLote: 'LOTE-2024-003',
          dataEntrada: new Date('2024-11-01'),
          fornecedor: 'Viveiro Municipal',
          dataValidade: new Date('2024-12-15'),
          certificacao: 'Orgânico',
          localArmazenamento: 'Estufa 1',
          condicaoArmazenamento: 'Irrigação automática',
        },
      }),

      prisma.estoqueSemente.upsert({
        where: { numeroLote: 'LOTE-2024-004' },
        update: {},
        create: {
          tipo: TipoInsumoAgricola.MUDA,
          nome: 'Mudas de Tomate',
          especie: 'Solanum lycopersicum',
          variedade: 'Débora',
          quantidadeAtual: 1500,
          unidadeMedida: 'unidade',
          estoqueMinimo: 300,
          estoqueMaximo: 3000,
          numeroLote: 'LOTE-2024-004',
          dataEntrada: new Date('2024-11-05'),
          fornecedor: 'Viveiro Municipal',
          dataValidade: new Date('2024-12-20'),
          localArmazenamento: 'Estufa 2',
        },
      }),
    ]);

    console.log(`  ✅ ${estoqueSementes.length} itens de estoque criados`);

    // ========== MS-04: TÉCNICOS AGRÍCOLAS ==========
    console.log('  👨‍🌾 Criando técnicos agrícolas...');

    const tecnicos = await Promise.all([
      prisma.tecnicoAgricola.upsert({
        where: { cpf: '444.444.444-44' },
        update: {},
        create: {
          nome: 'Dr. Carlos Eduardo Santos',
          cpf: '444.444.444-44',
          crea: 'CREA-SP 123456',
          especialidade: 'Engenheiro Agrônomo',
          especialidades: ['Solos', 'Irrigação', 'Hortaliças'],
          celular: '(11) 99222-3344',
          email: 'carlos.santos@prefeitura.sp.gov.br',
          vinculo: 'Efetivo',
          matricula: 'MAT-001',
        },
      }),

      prisma.tecnicoAgricola.upsert({
        where: { cpf: '555.555.555-55' },
        update: {},
        create: {
          nome: 'Dra. Ana Paula Lima',
          cpf: '555.555.555-55',
          crea: 'CREA-SP 654321',
          especialidade: 'Médica Veterinária',
          especialidades: ['Sanidade Animal', 'Reprodução', 'Nutrição'],
          celular: '(11) 99333-4455',
          email: 'ana.lima@prefeitura.sp.gov.br',
          vinculo: 'Efetivo',
          matricula: 'MAT-002',
        },
      }),
    ]);

    console.log(`  ✅ ${tecnicos.length} técnicos agrícolas criados`);

    console.log('🌾 Seed dos Micro Sistemas de Agricultura concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar seed de Agricultura:', error);
    throw error;
  }
}
