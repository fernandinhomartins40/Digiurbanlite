/**
 * Resumo da semana para o Gabinete do Prefeito: um aviso no app (sem e-mail —
 * o VeloMail grátis é 100/dia) para quem tem `gabineteAccess`, com os números
 * do Painel do Prefeito. No máximo um por pessoa por semana (Brasília), mesmo
 * que a rotina rode de novo após reiniciar o servidor.
 */

import { prisma } from '../../lib/prisma';
import notificationService from '../notification.service';
import { mayorTvSnapshot } from '../gabinete/mayor-panel.service';
import { brasiliaDayBounds } from '../agenda-medica/brasilia-time';
import { brasiliaWeekStartKey } from './city-numbers.service';

export const WEEKLY_SUMMARY_TYPE = 'WEEKLY_SUMMARY';
export const WEEKLY_SUMMARY_URL = '/admin/gabinete/painel-prefeito?aba=hoje';

type Snapshot = Awaited<ReturnType<typeof mayorTvSnapshot>>;

/** Texto do aviso a partir do retrato do Painel do Prefeito. */
export function weeklySummaryText(snapshot: Pick<Snapshot, 'kpis' | 'graficos'>): { title: string; message: string } {
  const chegaram = snapshot.graficos.semana.reduce((sum, day) => sum + day.chegaram, 0);
  const concluidos = snapshot.graficos.semana.reduce((sum, day) => sum + day.concluidos, 0);
  const { abertos, atrasados, satisfacao } = snapshot.kpis;
  const parts = [
    `Nos últimos 7 dias chegaram ${chegaram} pedido(s) e ${concluidos} foram concluídos.`,
    `Em aberto agora: ${abertos}, sendo ${atrasados} atrasado(s).`,
  ];
  if (satisfacao !== null) parts.push(`Nota média dos cidadãos: ${String(satisfacao).replace('.', ',')} de 5.`);
  return { title: 'Resumo da semana da prefeitura', message: parts.join(' ') };
}

/** Envia o resumo no município do contexto atual. Devolve quantos avisos saíram. */
export async function sendWeeklySummary(now = new Date()): Promise<number> {
  const team = await prisma.user.findMany({ where: { gabineteAccess: true, isActive: true } as any, select: { id: true } });
  if (!team.length) return 0;

  const weekStart = brasiliaDayBounds(brasiliaWeekStartKey(now)).start;
  const already = await prisma.notification.findMany({
    where: { type: WEEKLY_SUMMARY_TYPE, userId: { in: team.map((item) => item.id) }, createdAt: { gte: weekStart } },
    select: { userId: true },
  });
  const done = new Set(already.map((item) => item.userId));
  const pending = team.filter((item) => !done.has(item.id));
  if (!pending.length) return 0;

  const { title, message } = weeklySummaryText(await mayorTvSnapshot());
  let sent = 0;
  for (const user of pending) {
    await notificationService
      .notify({
        recipientType: 'user',
        recipientId: user.id,
        type: WEEKLY_SUMMARY_TYPE,
        title,
        message,
        channels: ['web', 'push'],
        data: { actionUrl: WEEKLY_SUMMARY_URL },
      })
      .then(() => sent++)
      .catch(() => undefined);
  }
  return sent;
}
