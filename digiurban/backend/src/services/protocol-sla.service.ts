/**
 * Serviço para gerenciamento de SLA de Protocolos
 */

import { prisma } from '../lib/prisma';
import { addDays, differenceInCalendarDays, differenceInBusinessDays, isWeekend } from 'date-fns';

/**
 * Interface para criação de SLA
 */
export interface CreateSLAData {
  protocolId: string;
  startDate?: Date;
  workingDays: number;
}

/**
 * Calcula dias úteis entre duas datas
 */
function calculateWorkingDays(startDate: Date, endDate: Date): number {
  return differenceInBusinessDays(endDate, startDate);
}

/**
 * Adiciona dias úteis a uma data
 */
function addWorkingDays(date: Date, days: number): Date {
  let result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result = addDays(result, 1);
    if (!isWeekend(result)) {
      addedDays++;
    }
  }

  return result;
}

/**
 * Cria um SLA para um protocolo
 */
export async function createSLA(data: CreateSLAData) {
  const startDate = data.startDate || new Date();
  const expectedEndDate = addWorkingDays(startDate, data.workingDays);
  const calendarDays = differenceInCalendarDays(expectedEndDate, startDate);

  return await prisma.protocolSLA.create({
    data: {
      protocolId: data.protocolId,
      startDate,
      expectedEndDate,
      workingDays: data.workingDays,
      calendarDays
        }
        });
}

/**
 * Obtém o SLA de um protocolo
 */
export async function getProtocolSLA(protocolId: string) {
  return await prisma.protocolSLA.findUnique({
    where: { protocolId }
        });
}

/**
 * Pausa o SLA de um protocolo
 */
export async function pauseSLA(protocolId: string, reason: string) {
  const sla = await prisma.protocolSLA.findUnique({
    where: { protocolId }
        });

  if (!sla) {
    throw new Error('SLA não encontrado para este protocolo');
  }

  if (sla.isPaused) {
    throw new Error('SLA já está pausado');
  }

  return await prisma.protocolSLA.update({
    where: { protocolId },
    data: {
      isPaused: true,
      pausedAt: new Date(),
      pausedReason: reason
        }
        });
}

/**
 * Retoma o SLA de um protocolo
 */
export async function resumeSLA(protocolId: string) {
  const sla = await prisma.protocolSLA.findUnique({
    where: { protocolId }
        });

  if (!sla) {
    throw new Error('SLA não encontrado para este protocolo');
  }

  if (!sla.isPaused || !sla.pausedAt) {
    throw new Error('SLA não está pausado');
  }

  // Calcula dias pausados
  const daysPaused = differenceInCalendarDays(new Date(), sla.pausedAt);
  const totalPausedDays = sla.totalPausedDays + daysPaused;

  // Recalcula data de vencimento
  const newExpectedEndDate = addDays(sla.expectedEndDate, daysPaused);

  return await prisma.protocolSLA.update({
    where: { protocolId },
    data: {
      isPaused: false,
      pausedAt: null,
      pausedReason: null,
      totalPausedDays,
      expectedEndDate: newExpectedEndDate,
      calendarDays: differenceInCalendarDays(newExpectedEndDate, sla.startDate)
        }
        });
}

/**
 * Finaliza o SLA de um protocolo
 */
export async function completeSLA(protocolId: string) {
  const sla = await prisma.protocolSLA.findUnique({
    where: { protocolId }
        });

  if (!sla) {
    throw new Error('SLA não encontrado para este protocolo');
  }

  const actualEndDate = new Date();
  const isOverdue = actualEndDate > sla.expectedEndDate;
  const daysOverdue = isOverdue
    ? differenceInCalendarDays(actualEndDate, sla.expectedEndDate)
    : 0;

  return await prisma.protocolSLA.update({
    where: { protocolId },
    data: {
      actualEndDate,
      isOverdue,
      daysOverdue
        }
        });
}

/**
 * Atualiza status de atraso do SLA
 */
export async function updateSLAStatus(protocolId: string) {
  const sla = await prisma.protocolSLA.findUnique({
    where: { protocolId }
        });

  if (!sla || sla.actualEndDate) {
    return sla; // Já finalizado ou não existe
  }

  const now = new Date();
  const isOverdue = !sla.isPaused && now > sla.expectedEndDate;
  const daysOverdue = isOverdue
    ? differenceInCalendarDays(now, sla.expectedEndDate)
    : 0;

  if (isOverdue !== sla.isOverdue || daysOverdue !== sla.daysOverdue) {
    return await prisma.protocolSLA.update({
      where: { protocolId },
      data: {
        isOverdue,
        daysOverdue
        }
        });
  }

  return sla;
}

/**
 * Obtém todos os SLAs em atraso
 */
export async function getOverdueSLAs(tenantId?: string) {
  const where: any = {
    isOverdue: true,
    actualEndDate: null, // Apenas protocolos ainda não finalizados
  };

  if (tenantId) {
    where.protocol = {};
  }

  return await prisma.protocolSLA.findMany({
    where,
    include: {
      protocol: {
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          citizenId: true
        }
      }
        },
    orderBy: {
      daysOverdue: 'desc'
        }
        });
}

/**
 * Obtém SLAs próximos do vencimento (próximos X dias)
 */
export async function getSLAsNearDue(days: number = 3, tenantId?: string) {
  const now = new Date();
  const threshold = addDays(now, days);

  const where: any = {
    expectedEndDate: {
      lte: threshold,
      gte: now
        },
    actualEndDate: null,
    isPaused: false
        };

  if (tenantId) {
    where.protocol = {};
  }

  return await prisma.protocolSLA.findMany({
    where,
    include: {
      protocol: {
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          citizenId: true
        }
      }
        },
    orderBy: {
      expectedEndDate: 'asc'
        }
        });
}

/**
 * Calcula estatísticas de SLA para um tenant
 */
export async function calculateSLAStats(tenantId: string) {
  const slas = await prisma.protocolSLA.findMany({
    where: {
      protocol: {}
        }
        });

  const total = slas.length;
  const completed = slas.filter((s) => s.actualEndDate !== null).length;
  const onTime = slas.filter(
    (s) => s.actualEndDate !== null && !s.isOverdue
  ).length;
  const overdue = slas.filter((s) => s.isOverdue).length;
  const paused = slas.filter((s) => s.isPaused).length;
  const active = slas.filter(
    (s) => s.actualEndDate === null && !s.isPaused
  ).length;

  const complianceRate = completed > 0 ? (onTime / completed) * 100 : 0;

  return {
    total,
    completed,
    onTime,
    overdue,
    paused,
    active,
    complianceRate: Math.round(complianceRate * 100) / 100
        };
}

/**
 * Deleta um SLA
 */
export async function deleteSLA(protocolId: string) {
  return await prisma.protocolSLA.delete({
    where: { protocolId }
        });
}
