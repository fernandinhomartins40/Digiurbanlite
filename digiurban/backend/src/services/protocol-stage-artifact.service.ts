import fs from 'fs/promises';
import path from 'path';
import type { Express } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ensureProtocolDir } from '../config/upload';

type StageArtifactUpdateInput = {
  title?: string;
  description?: string | null;
  parecer?: string | null;
};

type StageArtifactUploadInput = StageArtifactUpdateInput & {
  protocolId: string;
  stageId: string;
  createdBy: string;
  file: Express.Multer.File;
};

type StageArtifactLinkInput = StageArtifactUpdateInput & {
  protocolId: string;
  stageId: string;
  createdBy: string;
  generatedDocumentId: string;
};

async function assertStageBelongsToProtocol(protocolId: string, stageId: string) {
  const stage = await prisma.protocolStage.findFirst({
    where: {
      id: stageId,
      protocolId,
    },
    select: {
      id: true,
      protocolId: true,
      stageName: true,
      stageOrder: true,
      status: true,
      dueDate: true,
      startedAt: true,
      completedAt: true,
      notes: true,
      result: true,
      metadata: true,
    },
  });

  if (!stage) {
    throw new Error('Etapa do protocolo não encontrada');
  }

  return stage;
}

function sanitizeStoredPath(filePath: string) {
  return filePath.replace(/^\/+/, '');
}

function resolveStoredFilePath(filePath: string) {
  return path.join(process.cwd(), sanitizeStoredPath(filePath));
}

function buildStageArtifactUrl(protocolId: string, fileName: string) {
  return `/uploads/protocols/${protocolId}/stage-artifacts/${fileName}`;
}

function buildHistoryComment(
  action: 'created' | 'linked' | 'updated',
  stageName: string,
  title: string
) {
  if (action === 'created') {
    return `Documento anexado na etapa "${stageName}": ${title}`;
  }

  if (action === 'linked') {
    return `Documento gerado vinculado à etapa "${stageName}": ${title}`;
  }

  return `Documento da etapa "${stageName}" atualizado: ${title}`;
}

async function registerHistory(protocolId: string, userId: string, action: string, comment: string, metadata: Record<string, unknown>) {
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId,
      userId,
      action,
      comment,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });
}

async function moveFileToStageArtifacts(protocolId: string, file: Express.Multer.File) {
  const protocolDir = ensureProtocolDir(protocolId);
  const stageArtifactsDir = path.join(protocolDir, 'stage-artifacts');
  await fs.mkdir(stageArtifactsDir, { recursive: true });

  const destinationPath = path.join(stageArtifactsDir, file.filename);

  try {
    await fs.rename(file.path, destinationPath);
  } catch (error) {
    await fs.copyFile(file.path, destinationPath);
    await fs.unlink(file.path).catch(() => undefined);
  }

  return {
    fileName: file.originalname,
    filePath: buildStageArtifactUrl(protocolId, file.filename),
    fileUrl: buildStageArtifactUrl(protocolId, file.filename),
    fileSize: file.size,
    mimeType: file.mimetype,
  };
}

async function serializeArtifact(artifactId: string) {
  return prisma.protocolStageArtifact.findUnique({
    where: { id: artifactId },
    include: {
      stage: {
        select: {
          id: true,
          stageName: true,
          stageOrder: true,
          status: true,
        },
      },
      generatedDocument: {
        include: {
          template: {
            select: {
              id: true,
              name: true,
              code: true,
              documentType: true,
            },
          },
        },
      },
    },
  });
}

export async function listProtocolStageArtifacts(protocolId: string) {
  const artifacts = await prisma.protocolStageArtifact.findMany({
    where: { protocolId },
    include: {
      stage: {
        select: {
          id: true,
          stageName: true,
          stageOrder: true,
          status: true,
        },
      },
      generatedDocument: {
        include: {
          template: {
            select: {
              id: true,
              name: true,
              code: true,
              documentType: true,
            },
          },
        },
      },
    },
    orderBy: [
      {
        stage: {
          stageOrder: 'asc',
        },
      },
      {
        createdAt: 'desc',
      },
    ],
  });

  return artifacts;
}

export async function createUploadedStageArtifact(input: StageArtifactUploadInput) {
  const stage = await assertStageBelongsToProtocol(input.protocolId, input.stageId);
  const storedFile = await moveFileToStageArtifacts(input.protocolId, input.file);

  const artifact = await prisma.protocolStageArtifact.create({
    data: {
      protocolId: input.protocolId,
      stageId: input.stageId,
      sourceType: 'UPLOADED',
      title: input.title?.trim() || input.file.originalname,
      description: input.description?.trim() || null,
      parecer: input.parecer?.trim() || null,
      fileName: storedFile.fileName,
      filePath: storedFile.filePath,
      fileUrl: storedFile.fileUrl,
      fileSize: storedFile.fileSize,
      mimeType: storedFile.mimeType,
      createdBy: input.createdBy,
    },
  });

  await registerHistory(
    input.protocolId,
    input.createdBy,
    'STAGE_ARTIFACT_UPLOADED',
    buildHistoryComment('created', stage.stageName, artifact.title),
    {
      stageId: input.stageId,
      stageName: stage.stageName,
      artifactId: artifact.id,
      sourceType: 'UPLOADED',
    }
  );

  return serializeArtifact(artifact.id);
}

export async function linkGeneratedDocumentToStage(input: StageArtifactLinkInput) {
  const stage = await assertStageBelongsToProtocol(input.protocolId, input.stageId);

  const generatedDocument = await prisma.generatedDocument.findFirst({
    where: {
      id: input.generatedDocumentId,
      protocolId: input.protocolId,
      isActive: true,
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          code: true,
          documentType: true,
        },
      },
    },
  });

  if (!generatedDocument) {
    throw new Error('Documento gerado não encontrado para este protocolo');
  }

  const existingArtifact = await prisma.protocolStageArtifact.findFirst({
    where: {
      protocolId: input.protocolId,
      stageId: input.stageId,
      generatedDocumentId: input.generatedDocumentId,
    },
  });

  const title =
    input.title?.trim() ||
    generatedDocument.template.documentType ||
    generatedDocument.template.name ||
    generatedDocument.fileName;

  if (existingArtifact) {
    const updatedArtifact = await prisma.protocolStageArtifact.update({
      where: { id: existingArtifact.id },
      data: {
        title,
        description: input.description?.trim() || existingArtifact.description,
        parecer: input.parecer?.trim() || existingArtifact.parecer,
        fileName: generatedDocument.fileName,
        filePath: generatedDocument.filePath,
        fileUrl: generatedDocument.fileUrl || existingArtifact.fileUrl,
        fileSize: generatedDocument.fileSize,
        mimeType: generatedDocument.mimeType,
      },
    });

    await registerHistory(
      input.protocolId,
      input.createdBy,
      'STAGE_ARTIFACT_UPDATED',
      buildHistoryComment('updated', stage.stageName, title),
      {
        stageId: input.stageId,
        stageName: stage.stageName,
        artifactId: updatedArtifact.id,
        generatedDocumentId: generatedDocument.id,
        sourceType: 'GENERATED',
      }
    );

    return serializeArtifact(updatedArtifact.id);
  }

  const artifact = await prisma.protocolStageArtifact.create({
    data: {
      protocolId: input.protocolId,
      stageId: input.stageId,
      sourceType: 'GENERATED',
      title,
      description: input.description?.trim() || null,
      parecer: input.parecer?.trim() || null,
      fileName: generatedDocument.fileName,
      filePath: generatedDocument.filePath,
      fileUrl: generatedDocument.fileUrl,
      fileSize: generatedDocument.fileSize,
      mimeType: generatedDocument.mimeType,
      generatedDocumentId: generatedDocument.id,
      createdBy: input.createdBy,
    },
  });

  await registerHistory(
    input.protocolId,
    input.createdBy,
    'STAGE_ARTIFACT_LINKED',
    buildHistoryComment('linked', stage.stageName, artifact.title),
    {
      stageId: input.stageId,
      stageName: stage.stageName,
      artifactId: artifact.id,
      generatedDocumentId: generatedDocument.id,
      sourceType: 'GENERATED',
    }
  );

  return serializeArtifact(artifact.id);
}

export async function updateStageArtifact(
  protocolId: string,
  stageId: string,
  artifactId: string,
  userId: string,
  data: StageArtifactUpdateInput
) {
  const stage = await assertStageBelongsToProtocol(protocolId, stageId);

  const artifact = await prisma.protocolStageArtifact.findFirst({
    where: {
      id: artifactId,
      protocolId,
      stageId,
    },
  });

  if (!artifact) {
    throw new Error('Documento da etapa não encontrado');
  }

  const updatedArtifact = await prisma.protocolStageArtifact.update({
    where: { id: artifactId },
    data: {
      title: data.title?.trim() || artifact.title,
      description: data.description === undefined ? artifact.description : data.description?.trim() || null,
      parecer: data.parecer === undefined ? artifact.parecer : data.parecer?.trim() || null,
    },
  });

  await registerHistory(
    protocolId,
    userId,
    'STAGE_ARTIFACT_UPDATED',
    buildHistoryComment('updated', stage.stageName, updatedArtifact.title),
    {
      stageId,
      stageName: stage.stageName,
      artifactId,
      sourceType: updatedArtifact.sourceType,
    }
  );

  return serializeArtifact(updatedArtifact.id);
}

export async function getStageArtifactById(protocolId: string, stageId: string, artifactId: string) {
  await assertStageBelongsToProtocol(protocolId, stageId);

  const artifact = await prisma.protocolStageArtifact.findFirst({
    where: {
      id: artifactId,
      protocolId,
      stageId,
    },
    include: {
      generatedDocument: {
        include: {
          template: {
            select: {
              id: true,
              name: true,
              code: true,
              documentType: true,
            },
          },
        },
      },
      stage: {
        select: {
          id: true,
          stageName: true,
          stageOrder: true,
          status: true,
        },
      },
    },
  });

  if (!artifact) {
    throw new Error('Documento da etapa não encontrado');
  }

  return artifact;
}

export async function resolveStageArtifactFile(protocolId: string, stageId: string, artifactId: string) {
  const artifact = await getStageArtifactById(protocolId, stageId, artifactId);

  const filePath = artifact.generatedDocument?.filePath || artifact.filePath;

  if (!filePath) {
    throw new Error('Arquivo não encontrado para este documento da etapa');
  }

  return {
    artifact,
    absolutePath: resolveStoredFilePath(filePath),
    fileName: artifact.generatedDocument?.fileName || artifact.fileName || artifact.title,
    mimeType: artifact.generatedDocument?.mimeType || artifact.mimeType || 'application/octet-stream',
  };
}
