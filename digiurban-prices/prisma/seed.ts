import { PrismaClient } from '@prisma/client';
import { normalizeText } from '../src/ingest/normalizer';
import { buildProvenanceHash } from '../src/utils/provenance';
import { config } from '../src/config/config';
import { ensureIndexExists, getOpenSearchClient } from '../src/search_index/opensearch.client';

const prisma = new PrismaClient();

const organizations = [
  { code: 'SP001', cnpj: '11111111000101', name: 'Prefeitura Municipal de Sao Paulo', shortName: 'PMSP', uf: 'SP', city: 'Sao Paulo', sphere: 'municipal' },
  { code: 'PR001', cnpj: '11111111000102', name: 'Prefeitura Municipal de Curitiba', shortName: 'PMCWB', uf: 'PR', city: 'Curitiba', sphere: 'municipal' },
  { code: 'SC001', cnpj: '11111111000103', name: 'Prefeitura Municipal de Florianopolis', shortName: 'PMF', uf: 'SC', city: 'Florianopolis', sphere: 'municipal' },
  { code: 'MG001', cnpj: '11111111000104', name: 'Prefeitura Municipal de Belo Horizonte', shortName: 'PBH', uf: 'MG', city: 'Belo Horizonte', sphere: 'municipal' },
  { code: 'BA001', cnpj: '11111111000105', name: 'Prefeitura Municipal de Salvador', shortName: 'PMS', uf: 'BA', city: 'Salvador', sphere: 'municipal' },
  { code: 'GO001', cnpj: '11111111000106', name: 'Prefeitura Municipal de Goiania', shortName: 'PMGYN', uf: 'GO', city: 'Goiania', sphere: 'municipal' },
  { code: 'RS001', cnpj: '11111111000107', name: 'Prefeitura Municipal de Porto Alegre', shortName: 'PMPA', uf: 'RS', city: 'Porto Alegre', sphere: 'municipal' },
  { code: 'RJ001', cnpj: '11111111000108', name: 'Prefeitura Municipal do Rio de Janeiro', shortName: 'PMRJ', uf: 'RJ', city: 'Rio de Janeiro', sphere: 'municipal' },
  { code: 'DF001', cnpj: '11111111000109', name: 'Governo do Distrito Federal', shortName: 'GDF', uf: 'DF', city: 'Brasilia', sphere: 'estadual' },
  { code: 'BR001', cnpj: '11111111000110', name: 'Ministerio da Gestao e da Inovacao', shortName: 'MGI', uf: 'DF', city: 'Brasilia', sphere: 'federal' },
];

const suppliers = [
  { cnpj: '22222222000101', name: 'Alpha Tecnologia Ltda' },
  { cnpj: '22222222000102', name: 'Beta Distribuidora Nacional' },
  { cnpj: '22222222000103', name: 'Gamma Papelaria Corporativa' },
  { cnpj: '22222222000104', name: 'Delta Moveis Institucionais' },
  { cnpj: '22222222000105', name: 'Epsilon Redes e Telecom' },
  { cnpj: '22222222000106', name: 'Zeta Equipamentos Hospitalares' },
  { cnpj: '22222222000107', name: 'Eta Construcoes e Insumos' },
  { cnpj: '22222222000108', name: 'Theta Vigilancia e Servicos' },
  { cnpj: '22222222000109', name: 'Iota Limpeza Profissional' },
  { cnpj: '22222222000110', name: 'Kappa Energia e Combustiveis' },
  { cnpj: '22222222000111', name: 'Lambda Informatica Publica' },
  { cnpj: '22222222000112', name: 'Sigma Solucoes Educacionais' },
];

const sources = ['pncp', 'comprasnet', 'transparencia', 'bps'] as const;

const itemFamilies = [
  {
    code: 'desktop',
    unit: 'un',
    catmatCode: '43211507',
    descriptions: [
      'Computador desktop core i5 16gb 512gb ssd',
      'Microcomputador corporativo i5 16gb ssd 512gb',
      'Desktop administrativo intel i5 16gb',
    ],
    basePrice: 3450,
    baseQuantity: 12,
  },
  {
    code: 'notebook',
    unit: 'un',
    catmatCode: '43211503',
    descriptions: [
      'Notebook corporativo core i5 16gb 512gb ssd',
      'Computador portatil i5 16gb 15 polegadas',
      'Notebook institucional 16gb ssd 512gb',
    ],
    basePrice: 4320,
    baseQuantity: 8,
  },
  {
    code: 'impressora',
    unit: 'un',
    catmatCode: '43212110',
    descriptions: [
      'Impressora multifuncional laser monocromatica',
      'Multifuncional laser a4 para escritorio',
      'Impressora laser corporativa com scanner',
    ],
    basePrice: 2180,
    baseQuantity: 6,
  },
  {
    code: 'papel_a4',
    unit: 'resma',
    catmatCode: '7536452',
    descriptions: [
      'Papel a4 75g resma 500 folhas',
      'Papel sulfite a4 branco 500 folhas',
      'Resma de papel a4 75g para expediente',
    ],
    basePrice: 29.8,
    baseQuantity: 220,
  },
  {
    code: 'cadeira',
    unit: 'un',
    catmatCode: '52141543',
    descriptions: [
      'Cadeira giratoria ergonomica para escritorio',
      'Cadeira operativa com regulagem lombar',
      'Cadeira administrativa com apoio de bracos',
    ],
    basePrice: 980,
    baseQuantity: 18,
  },
  {
    code: 'router',
    unit: 'un',
    catmatCode: '43222609',
    descriptions: [
      'Roteador corporativo gigabit dual band',
      'Equipamento de rede wifi empresarial',
      'Router institucional com gerenciamento central',
    ],
    basePrice: 1490,
    baseQuantity: 10,
  },
  {
    code: 'seringa',
    unit: 'cx',
    catmatCode: '447594',
    descriptions: [
      'Seringa descartavel 10ml caixa com 100 unidades',
      'Seringa hospitalar 10 ml com agulha',
      'Seringa uso clinico 10ml esteril',
    ],
    basePrice: 86.5,
    baseQuantity: 140,
  },
  {
    code: 'luva',
    unit: 'cx',
    catmatCode: '269941',
    descriptions: [
      'Luva descartavel nitrilica caixa com 100 unidades',
      'Luva de procedimento nao esteril',
      'Luva hospitalar nitrilica tamanho medio',
    ],
    basePrice: 48.9,
    baseQuantity: 190,
  },
  {
    code: 'cimento',
    unit: 'saco',
    catmatCode: '31111014',
    descriptions: [
      'Cimento cp ii saco 50kg',
      'Cimento para obras publicas saco 50 quilos',
      'Cimento ensacado estrutural 50kg',
    ],
    basePrice: 39.7,
    baseQuantity: 300,
  },
  {
    code: 'diesel',
    unit: 'l',
    catmatCode: '15101505',
    descriptions: [
      'Oleo diesel s10 para frota municipal',
      'Combustivel diesel s10 abastecimento frota',
      'Diesel s10 uso veicular institucional',
    ],
    basePrice: 6.18,
    baseQuantity: 3200,
  },
];

async function main() {
  console.log('Seeding large DigiUrban prices dataset...');

  let canIndex = true;
  await ensureIndexExists().catch((error: Error) => {
    canIndex = false;
    console.warn('[seed] OpenSearch unavailable, continuing with database only:', error.message);
  });
  const osClient = canIndex ? getOpenSearchClient() : null;

  const organizationMap = new Map<string, { id: string; name: string; uf: string; city: string }>();
  for (const org of organizations) {
    const saved = await prisma.organization.upsert({
      where: { cnpj: org.cnpj },
      update: {
        name: org.name,
        shortName: org.shortName,
        uf: org.uf,
        city: org.city,
        sphere: org.sphere,
        pncpCode: org.code,
      },
      create: {
        cnpj: org.cnpj,
        name: org.name,
        shortName: org.shortName,
        uf: org.uf,
        city: org.city,
        sphere: org.sphere,
        pncpCode: org.code,
      },
    });
    organizationMap.set(org.code, { id: saved.id, name: saved.name, uf: org.uf, city: org.city });
  }

  const supplierMap = new Map<string, { id: string; cnpj: string; name: string }>();
  for (const supplier of suppliers) {
    const saved = await prisma.supplier.upsert({
      where: { cnpj: supplier.cnpj },
      update: { name: supplier.name },
      create: supplier,
    });
    supplierMap.set(supplier.cnpj, { id: saved.id, cnpj: supplier.cnpj, name: saved.name });
  }

  let contractCount = 0;
  let lineItemCount = 0;
  let indexedCount = 0;

  const years = [2022, 2023, 2024, 2025, 2026];

  for (const year of years) {
    for (const [orgIndex, organization] of organizations.entries()) {
      for (const [familyIndex, family] of itemFamilies.entries()) {
        const source = sources[(year + orgIndex + familyIndex) % sources.length];
        const supplier = suppliers[(orgIndex + familyIndex + year) % suppliers.length];
        const supplierRecord = supplierMap.get(supplier.cnpj)!;
        const organizationRecord = organizationMap.get(organization.code)!;
        const contractCode = `seed_${source}_${year}_${organization.code}_${family.code}`;
        const contractDate = new Date(Date.UTC(year, (orgIndex + familyIndex) % 12, ((familyIndex * 2) % 27) + 1));
        const modality = year % 2 === 0 ? 'Pregao Eletronico' : 'Dispensa Eletronica';
        const estimatedTotal = family.basePrice * family.baseQuantity * 2.5;

        const contract = await prisma.contract.upsert({
          where: { pncpId: contractCode },
          update: {
            processNumber: `${year}-${organization.code}-${family.code}`,
            year,
            modality,
            modalityCode: year % 2 === 0 ? 6 : 8,
            description: `Aquisicao de ${family.code} para ${organization.shortName}`,
            totalValue: estimatedTotal,
            contractDate,
            publicationDate: contractDate,
            uf: organization.uf,
            city: organization.city,
            status: 'vigente',
            organizationId: organizationRecord.id,
            supplierId: supplierRecord.id,
          },
          create: {
            pncpId: contractCode,
            processNumber: `${year}-${organization.code}-${family.code}`,
            year,
            modality,
            modalityCode: year % 2 === 0 ? 6 : 8,
            description: `Aquisicao de ${family.code} para ${organization.shortName}`,
            totalValue: estimatedTotal,
            contractDate,
            publicationDate: contractDate,
            uf: organization.uf,
            city: organization.city,
            status: 'vigente',
            organizationId: organizationRecord.id,
            supplierId: supplierRecord.id,
          },
        });
        contractCount += 1;

        for (const [variantIndex, description] of family.descriptions.entries()) {
          const seed = year + orgIndex * 7 + familyIndex * 13 + variantIndex * 17;
          const quantity = Math.max(1, Math.round(family.baseQuantity * (1 + ((seed % 5) - 2) * 0.08)));
          const unitPrice = round2(family.basePrice * (1 + ((seed % 7) - 3) * 0.03));
          const totalPrice = round2(quantity * unitPrice);
          const sourceId = `seed_${source}_${year}_${organization.code}_${family.code}_${variantIndex + 1}`;
          const normalizedDescription = normalizeText(description);
          const confidenceScore = source === 'pncp' ? 0.98 : source === 'comprasnet' ? 0.95 : source === 'bps' ? 0.9 : 0.86;
          const yearMonth = `${year}-${String(contractDate.getUTCMonth() + 1).padStart(2, '0')}`;
          const provenanceHash = buildProvenanceHash({
            source,
            sourceId,
            description,
            unitPrice,
            contractDate,
            supplier: supplierRecord.cnpj,
          });

          const data = {
            description,
            normalizedDescription,
            quantity,
            unit: family.unit,
            unitPrice,
            totalPrice,
            calculatedUnitPrice: unitPrice,
            catmatCode: family.catmatCode,
            catmatDescription: description,
            source,
            sourceId,
            supplierId: supplierRecord.id,
            supplierName: supplierRecord.name,
            supplierCnpj: supplierRecord.cnpj,
            confidenceScore,
            classificationScore: 0.9,
            yearMonth,
            contractDate,
            uf: organization.uf,
            city: organization.city,
            provenanceHash,
            organizationId: organizationRecord.id,
            contractId: contract.id,
            inferredFromObject: false,
            isValid: true,
            isOutlier: false,
          };

          const existing = await prisma.lineItem.findFirst({ where: { sourceId } });
          const lineItem = existing
            ? await prisma.lineItem.update({ where: { id: existing.id }, data })
            : await prisma.lineItem.create({ data });

          lineItemCount += 1;

          if (osClient) {
            try {
              await osClient.index({
                index: config.opensearch.indexLineItems,
                id: lineItem.id,
                body: {
                  id: lineItem.id,
                  description,
                  normalized_description: normalizedDescription,
                  unit: family.unit,
                  unit_price: unitPrice,
                  total_price: totalPrice,
                  quantity,
                  contract_date: contractDate.toISOString(),
                  uf: organization.uf,
                  city: organization.city,
                  organization_name: organization.name,
                  catmat_code: family.catmatCode,
                  catmat_description: description,
                  source,
                  supplier_name: supplierRecord.name,
                  supplier_cnpj: supplierRecord.cnpj,
                  provenance_hash: provenanceHash,
                  confidence_score: confidenceScore,
                  classification_score: 0.9,
                  inferred_from_object: false,
                  year_month: yearMonth,
                  indexed_at: new Date().toISOString(),
                },
              });
              indexedCount += 1;
            } catch (error) {
              console.warn('[seed] Failed to index line item', { sourceId, error: (error as Error).message });
            }
          }
        }
      }
    }
  }

  console.log('Seed completed.');
  console.log({
    organizations: organizations.length,
    suppliers: suppliers.length,
    contracts: contractCount,
    lineItemsProcessed: lineItemCount,
    lineItemsIndexed: indexedCount,
  });
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
