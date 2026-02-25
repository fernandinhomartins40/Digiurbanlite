import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding prices module database...');

  // Organizações fake
  const org1 = await prisma.organization.upsert({
    where: { pncpCode: 'PREFMOC001' },
    update: {},
    create: {
      cnpj: '00.000.000/0001-00',
      name: 'Prefeitura Municipal de Exemplo',
      shortName: 'PME',
      uf: 'SP',
      city: 'Exemplo',
      sphere: 'municipal',
      pncpCode: 'PREFMOC001',
    },
  });

  const org2 = await prisma.organization.upsert({
    where: { pncpCode: 'PREFMOC002' },
    update: {},
    create: {
      cnpj: '11.111.111/0001-11',
      name: 'Câmara Municipal de Demonstração',
      shortName: 'CMD',
      uf: 'MG',
      city: 'Demonstração',
      sphere: 'municipal',
      pncpCode: 'PREFMOC002',
    },
  });

  const org3 = await prisma.organization.upsert({
    where: { pncpCode: 'ESTSP001' },
    update: {},
    create: {
      cnpj: '22.222.222/0001-22',
      name: 'Governo do Estado de São Paulo',
      shortName: 'GESP',
      uf: 'SP',
      sphere: 'estadual',
      pncpCode: 'ESTSP001',
    },
  });

  // Fornecedores fake
  const sup1 = await prisma.supplier.upsert({
    where: { cnpj: '33.333.333/0001-33' },
    update: {},
    create: {
      cnpj: '33.333.333/0001-33',
      name: 'TechSuprimentos Ltda',
    },
  });

  const sup2 = await prisma.supplier.upsert({
    where: { cnpj: '44.444.444/0001-44' },
    update: {},
    create: {
      cnpj: '44.444.444/0001-44',
      name: 'Distribuidora Sul Equipamentos ME',
    },
  });

  // Contratos fake
  const baseDate = new Date('2025-01-01');
  const now = new Date();

  const contracts = [
    { org: org1, sup: sup1, desc: 'Fornecimento de computadores desktop', value: 75000, days: 30 },
    { org: org2, sup: sup2, desc: 'Serviço de limpeza predial', value: 24000, days: 60 },
    { org: org3, sup: sup1, desc: 'Aquisição de notebooks corporativos', value: 180000, days: 45 },
    { org: org1, sup: sup2, desc: 'Fornecimento de material de escritório', value: 8500, days: 90 },
    { org: org2, sup: sup1, desc: 'Impressoras multifuncionais', value: 32000, days: 20 },
    { org: org3, sup: sup2, desc: 'Serviço de manutenção de veículos', value: 55000, days: 15 },
  ];

  const createdContracts: { id: string }[] = [];
  for (let i = 0; i < contracts.length; i++) {
    const c = contracts[i];
    const date = new Date(baseDate);
    date.setDate(date.getDate() + c.days * i);
    const contract = await prisma.contract.create({
      data: {
        processNumber: `${2025 + i}-${String(i + 1).padStart(4, '0')}`,
        year: 2025,
        modality: i % 2 === 0 ? 'Pregão Eletrônico' : 'Dispensa de Licitação',
        modalityCode: i % 2 === 0 ? 6 : 8,
        description: c.desc,
        totalValue: c.value,
        contractDate: date,
        publicationDate: date,
        uf: c.org.uf ?? 'SP',
        status: 'vigente',
        organizationId: c.org.id,
        supplierId: c.sup.id,
      },
    });
    createdContracts.push(contract);
  }

  // Itens fake para computadores e notebooks
  const lineItemsSeed = [
    // Computadores desktop
    { desc: 'Computador Desktop Intel Core i5 8GB RAM 256GB SSD', norm: 'computador desktop intel core i5 8gb ram 256gb ssd', qty: 10, unit: 'un', unitPrice: 2850.00, uf: 'SP', contractIdx: 0 },
    { desc: 'Microcomputador tipo desktop processador i5 memória 8GB', norm: 'microcomputador desktop processador i5 memoria 8gb', qty: 5, unit: 'un', unitPrice: 2920.00, uf: 'SP', contractIdx: 0 },
    { desc: 'PC Desktop Core i5 10ª geração 8GB 256SSD', norm: 'pc desktop core i5 10 geracao 8gb 256ssd', qty: 8, unit: 'un', unitPrice: 2780.00, uf: 'MG', contractIdx: 1 },
    { desc: 'Computador desktop tipo 1 i5 8GB SSD', norm: 'computador desktop tipo 1 i5 8gb ssd', qty: 15, unit: 'un', unitPrice: 2950.00, uf: 'MG', contractIdx: 1 },
    { desc: 'Desktop corporativo Intel i5 11ª geração 8GB RAM', norm: 'desktop corporativo intel i5 11 geracao 8gb ram', qty: 20, unit: 'un', unitPrice: 3100.00, uf: 'SP', contractIdx: 2 },

    // Notebooks
    { desc: 'Notebook Intel Core i5 16GB RAM 512GB SSD 15.6"', norm: 'notebook intel core i5 16gb ram 512gb ssd 15.6', qty: 5, unit: 'un', unitPrice: 4200.00, uf: 'SP', contractIdx: 2 },
    { desc: 'Laptop corporativo i5 16GB 512SSD', norm: 'laptop corporativo i5 16gb 512ssd', qty: 10, unit: 'un', unitPrice: 4350.00, uf: 'SP', contractIdx: 2 },
    { desc: 'Microcomputador portátil i5 16GB', norm: 'microcomputador portatil i5 16gb', qty: 3, unit: 'un', unitPrice: 4100.00, uf: 'MG', contractIdx: 2 },

    // Serviço de limpeza
    { desc: 'Serviço de limpeza e conservação predial mensal', norm: 'servico limpeza conservacao predial mensal', qty: 12, unit: 'mês', unitPrice: 2000.00, uf: 'MG', contractIdx: 1 },
    { desc: 'Contratação serviço limpeza sede administrativa', norm: 'contratacao servico limpeza sede administrativa', qty: 6, unit: 'mês', unitPrice: 1850.00, uf: 'SP', contractIdx: 1 },
    { desc: 'Limpeza predial - serviços gerais', norm: 'limpeza predial servicos gerais', qty: 12, unit: 'mês', unitPrice: 2200.00, uf: 'MG', contractIdx: 1 },

    // Material de escritório
    { desc: 'Papel A4 resma 500 folhas 75g/m²', norm: 'papel a4 resma 500 folhas 75g m2', qty: 100, unit: 'resma', unitPrice: 28.50, uf: 'SP', contractIdx: 3 },
    { desc: 'Papel sulfite A4 75g branco 500fls', norm: 'papel sulfite a4 75g branco 500fls', qty: 50, unit: 'resma', unitPrice: 27.90, uf: 'SP', contractIdx: 3 },
    { desc: 'Resma de papel A4 80g 500 folhas', norm: 'resma papel a4 80g 500 folhas', qty: 200, unit: 'resma', unitPrice: 30.00, uf: 'MG', contractIdx: 3 },

    // Impressoras
    { desc: 'Impressora multifuncional laser monocromática', norm: 'impressora multifuncional laser monocromatica', qty: 4, unit: 'un', unitPrice: 1890.00, uf: 'MG', contractIdx: 4 },
    { desc: 'Multifuncional laser preto e branco A4', norm: 'multifuncional laser preto branco a4', qty: 6, unit: 'un', unitPrice: 1750.00, uf: 'SP', contractIdx: 4 },
  ];

  for (const item of lineItemsSeed) {
    const contract = createdContracts[item.contractIdx];
    const contractDate = new Date(baseDate);
    contractDate.setDate(contractDate.getDate() + Math.floor(Math.random() * 300));

    await prisma.lineItem.create({
      data: {
        description: item.desc,
        normalizedDescription: item.norm,
        quantity: item.qty,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.qty,
        calculatedUnitPrice: item.unitPrice,
        uf: item.uf,
        contractDate: contractDate,
        isValid: true,
        isOutlier: false,
        organizationId: createdContracts[item.contractIdx] ? (item.uf === 'SP' ? org1.id : org2.id) : org1.id,
        supplierId: item.contractIdx % 2 === 0 ? sup1.id : sup2.id,
        contractId: contract.id,
      },
    });
  }

  console.log('✅ Seed concluído!');
  console.log(`   → ${contracts.length} contratos criados`);
  console.log(`   → ${lineItemsSeed.length} itens criados`);
  console.log(`   → 3 organizações criadas`);
  console.log(`   → 2 fornecedores criados`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
