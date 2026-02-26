/**
 * Serviço de comentários e anotações em processos internos
 */
import prisma from '../utils/prisma';
import logger from '../utils/logger';

// ============================================================================
// LISTAR COMENTÁRIOS
// ============================================================================

export async function listComments(processId: string, includeDeleted = false) {
  return prisma.processComment.findMany({
    where: {
      processId,
      ...(includeDeleted ? {} : { isDeleted: false }),
    },
    orderBy: { createdAt: 'asc' },
  });
}

// ============================================================================
// CRIAR COMENTÁRIO
// ============================================================================

export async function createComment(data: {
  processId: string;
  userId: string;
  userName: string;
  content: string;
  isInternal?: boolean;
}) {
  const process = await prisma.internalProcess.findUnique({
    where: { id: data.processId },
    select: { id: true, status: true },
  });

  if (!process) throw new Error('Processo não encontrado');
  if (process.status === 'ARQUIVADO') {
    throw new Error('Não é possível comentar em um processo arquivado');
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

  logger.info(`Comentário criado no processo ${data.processId}`, { commentId: comment.id });
  return comment;
}

// ============================================================================
// EDITAR COMENTÁRIO
// ============================================================================

export async function editComment(commentId: string, userId: string, content: string) {
  const comment = await prisma.processComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error('Comentário não encontrado');
  if (comment.userId !== userId) throw new Error('Apenas o autor pode editar o comentário');
  if (comment.isDeleted) throw new Error('Comentário já foi removido');

  return prisma.processComment.update({
    where: { id: commentId },
    data: { content, editedAt: new Date() },
  });
}

// ============================================================================
// REMOVER COMENTÁRIO (soft delete)
// ============================================================================

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.processComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error('Comentário não encontrado');
  if (comment.userId !== userId) throw new Error('Apenas o autor pode remover o comentário');

  return prisma.processComment.update({
    where: { id: commentId },
    data: { isDeleted: true },
  });
}
