'use client';

/** Respostas do assistente que os cidadãos denunciaram (errada, ofensiva, sem sentido). */

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { digibotApi } from './api';

interface Report {
  id: string;
  answer: string;
  reason: string | null;
  status: string;
  createdAt: string;
}

/** Resposta do bot pode vir em JSON (cartões): mostra só o texto */
function answerText(answer: string): string {
  try {
    const parsed = JSON.parse(answer);
    return String(parsed?.text || parsed?.message || parsed?.content || answer);
  } catch {
    return answer;
  }
}

export function ReportsTab() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const load = useCallback(() => {
    digibotApi<{ reports: Report[] }>('/reports').then((data) => setReports(data.reports)).catch(() => setReports([]));
  }, []);
  useEffect(load, [load]);

  const reviewed = async (id: string) => {
    await digibotApi(`/reports/${id}/reviewed`, { method: 'POST' }).catch(() => undefined);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Respostas denunciadas</CardTitle>
        <CardDescription>
          Respostas do assistente que algum cidadão marcou como erradas ou ofensivas. Corrija em Perguntas frequentes ou Ensinar o bot e marque como revisada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports === null && (
          <p className="flex items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando…</p>
        )}
        {reports?.length === 0 && <p className="text-sm text-gray-500">Nenhuma denúncia para revisar.</p>}
        {reports?.map((report) => (
          <div key={report.id} className="space-y-2 rounded-xl border p-3 text-sm">
            <p className="whitespace-pre-wrap text-gray-900">{answerText(report.answer)}</p>
            {report.reason && <p className="text-gray-600">Motivo: {report.reason}</p>}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleString('pt-BR')}</span>
              <Button size="sm" variant="outline" onClick={() => void reviewed(report.id)}>Marcar como revisada</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
