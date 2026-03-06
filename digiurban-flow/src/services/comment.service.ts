/**
 * Comments service for internal processes.
 */
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { FlowAuthContext } from '../middleware/auth.middleware';
import { assertProcessAccess } from './access-control.service';

export async function listComments(
  processId: string,
  auth: FlowAuthContext,
  includeDeleted = false,
) {
  await assertProcessAccess(prisma, processId, auth);

  return prisma.processComment.findMany({
    where: {
      processId,
      ...(includeDeleted ? {} : { isDeleted: false }),
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createComment(
  data: {
    processId: string;
    userId: string;
    userName: string;
    content: string;
    isInternal?: boolean;
  },
  auth: FlowAuthContext,
) {
  await assertProcessAccess(prisma, data.processId, auth);

  const process = await prisma.internalProcess.findUnique({
    where: { id: data.processId },
    select: { id: true, status: true },
  });

  if (!process) throw new Error('Processo nao encontrado');
  if (process.status === 'ARQUIVADO') {
    throw new Error('Nao e possivel comentar em um processo arquivado');
  }

  const comment = await prisma.processComment.create({
    data: {
      processId: data.processId,
      userId: data.userId,
      userName: data.userName,
      content: data.content,
      isInternal: data.isInternal !== false,
    },
  });

  logger.info(`Comentario criado no processo ${data.processId}`, { commentId: comment.id });
  return comment;
}

export async function editComment(
  commentId: string,
  userId: string,
  content: string,
  auth: FlowAuthContext,
) {
  const comment = await prisma.processComment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true, isDeleted: true, processId: true },
  });

  if (!comment) throw new Error('Comentario nao encontrado');
  await assertProcessAccess(prisma, comment.processId, auth);
  if (comment.userId !== userId) throw new Error('Apenas o autor pode editar o comentario');
  if (comment.isDeleted) throw new Error('Comentario ja foi removido');

  return prisma.processComment.update({
    where: { id: commentId },
    data: { content, editedAt: new Date() },
  });
}

export async function deleteComment(commentId: string, userId: string, auth: FlowAuthContext) {
  const comment = await prisma.processComment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true, processId: true },
  });

  if (!comment) throw new Error('Comentario nao encontrado');
  await assertProcessAccess(prisma, comment.processId, auth);
  if (comment.userId !== userId) throw new Error('Apenas o autor pode remover o comentario');

  return prisma.processComment.update({
    where: { id: commentId },
    data: { isDeleted: true },
  });
}
