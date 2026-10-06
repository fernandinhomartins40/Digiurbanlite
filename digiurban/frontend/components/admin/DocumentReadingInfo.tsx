'use client';

/**
 * Resultado da leitura automática de um documento (motor de leitura no servidor):
 * que documento parece ser e se nome, CPF e nascimento conferem com o cadastro.
 * É só um aviso — quem aprova ou recusa é o servidor.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleHelp, ExternalLink, Loader2, ScanText } from 'lucide-react';
import { getFullApiUrl } from '@/lib/api-config';
import { cn } from '@/lib/utils';

type Source = 'CITIZEN_DOCUMENT' | 'PROTOCOL_DOCUMENT';
type Match = 'MATCH' | 'PARTIAL' | 'NO_MATCH' | 'NOT_FOUND' | null;

interface Reading {
  status: 'DONE' | 'SKIPPED' | 'FAILED';
  note: string | null;
  detectedKind: string | null;
  expectedKind: string | null;
  kindMatches: boolean | null;
  nameMatch: Match;
  cpfMatch: Match;
  birthDateMatch: Match;
  mrzValid: boolean | null;
  qrFound: boolean;
  qrGovUrl: string | null;
}

const KIND_LABEL: Record<string, string> = {
  CIN: 'Carteira de Identidade Nacional',
  RG: 'RG (identidade)',
  CNH: 'CNH',
  CPF: 'CPF',
  CERTIDAO: 'Certidão',
  COMPROVANTE_RESIDENCIA: 'Comprovante de residência',
  TITULO_ELEITOR: 'Título de eleitor',
  CTPS: 'Carteira de trabalho',
  SUS: 'Cartão do SUS',
  DESCONHECIDO: 'não deu para identificar',
};

type Tone = 'ok' | 'warn' | 'neutral';

function matchLine(label: string, match: Match): { text: string; tone: Tone } | null {
  if (!match) return null;
  if (match === 'MATCH') return { text: `${label} confere com o cadastro`, tone: 'ok' };
  if (match === 'PARTIAL') return { text: `${label} confere em parte`, tone: 'warn' };
  if (match === 'NO_MATCH') return { text: `${label} diferente do cadastro`, tone: 'warn' };
  return { text: `${label} não encontrado na foto`, tone: 'neutral' };
}

function Line({ text, tone }: { text: string; tone: Tone }) {
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'warn' ? AlertTriangle : CircleHelp;
  return (
    <li className="flex items-start gap-2">
      <Icon
        className={cn('mt-0.5 h-4 w-4 shrink-0', tone === 'ok' ? 'text-emerald-600' : tone === 'warn' ? 'text-amber-600' : 'text-gray-400')}
      />
      <span className={cn(tone === 'warn' ? 'text-amber-900' : 'text-gray-700')}>{text}</span>
    </li>
  );
}

export function DocumentReadingInfo({ source, documentId, className }: { source: Source; documentId: string; className?: string }) {
  const [reading, setReading] = useState<Reading | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let tries = 0;
    const load = async () => {
      try {
        const response = await fetch(getFullApiUrl(`/admin/document-readings?source=${source}&ids=${encodeURIComponent(documentId)}`), {
          credentials: 'include',
        });
        const body = await response.json().catch(() => ({}));
        if (cancelled) return;
        const found = (body?.readings || [])[0] || null;
        setReading(found);
        setLoaded(true);
        // ainda lendo: confere de novo em alguns segundos (no máximo 4 vezes)
        if (!found && response.ok && tries < 4) {
          tries += 1;
          timer = setTimeout(load, 15000);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    };
    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [source, documentId]);

  if (!loaded) return null;

  const lines: Array<{ text: string; tone: Tone }> = [];
  if (reading?.status === 'DONE') {
    if (reading.detectedKind) {
      const label = KIND_LABEL[reading.detectedKind] || reading.detectedKind;
      if (reading.kindMatches === false) {
        lines.push({
          text: `Parece ser ${label}${reading.expectedKind ? `, mas o pedido é ${KIND_LABEL[reading.expectedKind] || reading.expectedKind}` : ''}`,
          tone: 'warn',
        });
      } else {
        lines.push({ text: `Parece ser: ${label}`, tone: reading.detectedKind === 'DESCONHECIDO' ? 'neutral' : 'ok' });
      }
    }
    for (const line of [
      matchLine('Nome', reading.nameMatch),
      matchLine('CPF', reading.cpfMatch),
      reading.birthDateMatch === 'MATCH' ? matchLine('Data de nascimento', 'MATCH') : null,
    ]) {
      if (line) lines.push(line);
    }
    if (reading.mrzValid !== null) {
      lines.push(
        reading.mrzValid
          ? { text: 'Faixa de leitura da identidade (MRZ) válida', tone: 'ok' }
          : { text: 'Faixa de leitura da identidade (MRZ) com erro — confira o documento', tone: 'warn' }
      );
    }
  }

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm', className)}>
      <p className="mb-2 flex items-center gap-1.5 font-medium text-slate-800">
        <ScanText className="h-4 w-4 text-slate-500" />
        Leitura automática
      </p>
      {!reading ? (
        <p className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Lendo o documento...
        </p>
      ) : reading.status !== 'DONE' ? (
        <p className="text-gray-500">{reading.note || 'Não foi possível ler este arquivo.'}</p>
      ) : (
        <ul className="space-y-1.5">
          {lines.map((line) => (
            <Line key={line.text} {...line} />
          ))}
          {reading.note && <li className="text-gray-500">{reading.note}</li>}
        </ul>
      )}
      {reading?.qrGovUrl && (
        <a
          href={reading.qrGovUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
        >
          Abrir o QR code do documento no gov.br
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      <p className="mt-2 text-xs text-gray-500">Aviso automático: confira sempre o documento antes de aprovar.</p>
    </div>
  );
}

export default DocumentReadingInfo;
