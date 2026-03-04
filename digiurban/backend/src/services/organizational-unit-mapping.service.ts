import { prisma } from '../lib/prisma';

function normalizeLabel(value: string | null | undefined): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type DomainModelName = 'unidadeSaude' | 'unidadeEducacao' | 'unidadeCRAS';

export async function listDomainUnits(params: { model: DomainModelName }) {
  const model = (prisma as any)[params.model];
  const units = await model.findMany({
    orderBy: { nome: 'asc' },
    select: {
      id: true,
      nome: true,
      tipo: true,
      bairro: true,
      isActive: true,
      organizationalUnitId: true,
      organizationalUnit: {
        select: {
          id: true,
          nome: true,
          sigla: true,
          tipo: true,
        },
      },
    },
  });

  return units.map((unit: any) => ({
    id: unit.id,
    nome: unit.nome,
    tipo: unit.tipo,
    bairro: unit.bairro || null,
    isActive: unit.isActive !== false,
    organizationalUnitId: unit.organizationalUnitId || null,
    organizationalUnit: unit.organizationalUnit || null,
    mapped: Boolean(unit.organizationalUnitId),
  }));
}

export async function autoMapDomainUnits(params: {
  model: DomainModelName;
  departmentName: string;
}) {
  const department = await prisma.department.findFirst({
    where: {
      name: params.departmentName,
      isActive: true,
    },
    select: { id: true },
  });

  if (!department) {
    return { scanned: 0, mapped: 0, skipped: 0 };
  }

  const [units, organizationalUnits] = await Promise.all([
    listDomainUnits({ model: params.model }),
    prisma.organizationalUnit.findMany({
      where: {
        departmentId: department.id,
        isActive: true,
      },
      select: {
        id: true,
        nome: true,
        sigla: true,
      },
      orderBy: { nome: 'asc' },
    }),
  ]);

  let mapped = 0;
  let skipped = 0;

  for (const unit of units) {
    if (unit.organizationalUnitId) {
      skipped += 1;
      continue;
    }

    const normalizedUnitName = normalizeLabel(unit.nome);
    const match = organizationalUnits.find((organizationalUnit) => {
      const normalizedOrgName = normalizeLabel(organizationalUnit.nome);
      const normalizedSigla = normalizeLabel(organizationalUnit.sigla);

      return (
        normalizedUnitName === normalizedOrgName ||
        normalizedUnitName.includes(normalizedOrgName) ||
        normalizedOrgName.includes(normalizedUnitName) ||
        (normalizedSigla && normalizedUnitName.includes(normalizedSigla))
      );
    });

    if (!match) {
      skipped += 1;
      continue;
    }

    await (prisma as any)[params.model].update({
      where: { id: unit.id },
      data: { organizationalUnitId: match.id },
    });
    mapped += 1;
  }

  return {
    scanned: units.length,
    mapped,
    skipped,
  };
}
