import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const utf8Decoder = new TextDecoder('utf-8');

const WINDOWS_1252_EXTRA_BYTES = new Map<number, number>([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const MOJIBAKE_PATTERN = /(Ã.|Â.|�)/g;
const BATCH_SIZE = 500;
const dryRun = process.argv.includes('--dry-run');

interface RepairSummary {
  scanned: number;
  updated: number;
}

function getMojibakeScore(value: string): number {
  const matches = value.match(MOJIBAKE_PATTERN);
  return matches ? matches.reduce((score, match) => score + match.length, 0) : 0;
}

function encodeWindows1252(value: string): Uint8Array | null {
  const bytes: number[] = [];

  for (const char of value) {
    const codePoint = char.codePointAt(0);

    if (codePoint === undefined) {
      continue;
    }

    const mappedByte = WINDOWS_1252_EXTRA_BYTES.get(codePoint);

    if (mappedByte !== undefined) {
      bytes.push(mappedByte);
      continue;
    }

    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }

    return null;
  }

  return Uint8Array.from(bytes);
}

export function normalizeMojibakeText(value: string): string {
  let current = value;
  let currentScore = getMojibakeScore(current);

  if (currentScore === 0) {
    return value;
  }

  for (let pass = 0; pass < 2; pass++) {
    const encoded = encodeWindows1252(current);

    if (!encoded) {
      break;
    }

    const candidate = utf8Decoder.decode(encoded);
    const candidateScore = getMojibakeScore(candidate);

    if (candidate.includes('\uFFFD')) {
      break;
    }

    if (candidateScore > currentScore) {
      break;
    }

    if (candidate === current) {
      break;
    }

    current = candidate;
    currentScore = candidateScore;

    if (currentScore === 0) {
      break;
    }
  }

  return current;
}

function normalizeOptionalText(value: string | null): string | null {
  return typeof value === 'string' ? normalizeMojibakeText(value) : value;
}

function normalizeJsonValue(value: Prisma.JsonValue | null): Prisma.InputJsonValue | null {
  if (typeof value === 'string') {
    return normalizeMojibakeText(value);
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeJsonValue(item as Prisma.JsonValue)) as Prisma.InputJsonValue;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, normalizeJsonValue(nestedValue as Prisma.JsonValue)])
    ) as Prisma.InputJsonValue;
  }

  return value as Prisma.InputJsonValue | null;
}

function normalizeRequiredJsonValue(value: Prisma.JsonValue): Prisma.InputJsonValue {
  return normalizeJsonValue(value) as Prisma.InputJsonValue;
}

function hasJsonChanged(before: Prisma.JsonValue | null, after: Prisma.InputJsonValue | null): boolean {
  return JSON.stringify(before) !== JSON.stringify(after);
}

async function repairServiceWorkflows(): Promise<RepairSummary> {
  const workflows = await prisma.serviceWorkflow.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      stages: true,
    },
  });

  const summary: RepairSummary = {
    scanned: workflows.length,
    updated: 0,
  };

  for (const workflow of workflows) {
    const nextName = normalizeMojibakeText(workflow.name);
    const nextDescription = normalizeOptionalText(workflow.description);
    const nextStages = normalizeRequiredJsonValue(workflow.stages as Prisma.JsonValue);

    const hasChanges =
      nextName !== workflow.name ||
      nextDescription !== workflow.description ||
      hasJsonChanged(workflow.stages as Prisma.JsonValue, nextStages);

    if (!hasChanges) {
      continue;
    }

    summary.updated += 1;

    if (dryRun) {
      continue;
    }

    await prisma.serviceWorkflow.update({
      where: { id: workflow.id },
      data: {
        name: nextName,
        description: nextDescription,
        stages: nextStages,
      },
    });
  }

  return summary;
}

async function repairModuleWorkflows(): Promise<RepairSummary> {
  const workflows = await prisma.moduleWorkflow.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      stages: true,
    },
  });

  const summary: RepairSummary = {
    scanned: workflows.length,
    updated: 0,
  };

  for (const workflow of workflows) {
    const nextName = normalizeMojibakeText(workflow.name);
    const nextDescription = normalizeOptionalText(workflow.description);
    const nextStages = normalizeRequiredJsonValue(workflow.stages as Prisma.JsonValue);

    const hasChanges =
      nextName !== workflow.name ||
      nextDescription !== workflow.description ||
      hasJsonChanged(workflow.stages as Prisma.JsonValue, nextStages);

    if (!hasChanges) {
      continue;
    }

    summary.updated += 1;

    if (dryRun) {
      continue;
    }

    await prisma.moduleWorkflow.update({
      where: { id: workflow.id },
      data: {
        name: nextName,
        description: nextDescription,
        stages: nextStages,
      },
    });
  }

  return summary;
}

async function repairProtocolStages(): Promise<RepairSummary> {
  const summary: RepairSummary = {
    scanned: 0,
    updated: 0,
  };

  let cursor: string | undefined;

  while (true) {
    const stages = await prisma.protocolStage.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
      select: {
        id: true,
        stageName: true,
        notes: true,
        metadata: true,
      },
    });

    if (stages.length === 0) {
      break;
    }

    summary.scanned += stages.length;

    for (const stage of stages) {
      const nextStageName = normalizeMojibakeText(stage.stageName);
      const nextNotes = normalizeOptionalText(stage.notes);
      const nextMetadata = normalizeJsonValue(stage.metadata as Prisma.JsonValue | null);
      const metadataChanged = hasJsonChanged(stage.metadata as Prisma.JsonValue | null, nextMetadata);

      const hasChanges =
        nextStageName !== stage.stageName ||
        nextNotes !== stage.notes ||
        metadataChanged;

      if (!hasChanges) {
        continue;
      }

      summary.updated += 1;

      if (dryRun) {
        continue;
      }

      const data: Prisma.ProtocolStageUpdateInput = {};

      if (nextStageName !== stage.stageName) {
        data.stageName = nextStageName;
      }

      if (nextNotes !== stage.notes) {
        data.notes = nextNotes;
      }

      if (metadataChanged) {
        data.metadata = nextMetadata === null ? Prisma.DbNull : nextMetadata;
      }

      await prisma.protocolStage.update({
        where: { id: stage.id },
        data,
      });
    }

    cursor = stages[stages.length - 1]?.id;
  }

  return summary;
}

async function main() {
  console.log('');
  console.log(
    dryRun
      ? 'Executando verificação de codificação de workflows em modo dry-run...'
      : 'Executando reparo de codificação UTF-8 de workflows e etapas...'
  );
  console.log('');

  const serviceWorkflows = await repairServiceWorkflows();
  const moduleWorkflows = await repairModuleWorkflows();
  const protocolStages = await repairProtocolStages();

  console.log(`ServiceWorkflow: ${serviceWorkflows.updated}/${serviceWorkflows.scanned} registro(s) ${dryRun ? 'seriam atualizados' : 'atualizados'}.`);
  console.log(`ModuleWorkflow: ${moduleWorkflows.updated}/${moduleWorkflows.scanned} registro(s) ${dryRun ? 'seriam atualizados' : 'atualizados'}.`);
  console.log(`ProtocolStage: ${protocolStages.updated}/${protocolStages.scanned} registro(s) ${dryRun ? 'seriam atualizados' : 'atualizados'}.`);
  console.log('');
}

main()
  .catch(error => {
    console.error('Erro ao reparar codificação UTF-8 dos workflows:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
