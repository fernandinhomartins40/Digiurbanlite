'use client';

/**
 * Partes comuns das telas dos apps gerais (Agenda de Atendimentos, Cursos e
 * Capacitações, Feiras e Mercados, Cemitérios). Estes apps atendem várias
 * secretarias: a pessoa vê só as suas e escolhe de qual é o que cria.
 */

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDepartmentConfig } from '@/lib/department-config';
import { departmentSlugFromCode } from '@/lib/app-catalog-client';

export function nomeSecretaria(code?: string | null) {
  if (!code) return '';
  return getDepartmentConfig(departmentSlugFromCode(code))?.name || code;
}

/** "20/10/2026 14:00" no horário de Brasília */
export function fmtDataHora(value?: string | Date | null) {
  if (!value) return '-';
  const data = new Date(value);
  return `${data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} ${data.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}`;
}

export function fmtDia(value?: string | Date | null) {
  return value ? new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-';
}

/** Hoje (AAAA-MM-DD) em Brasília */
export function hojeBrasilia() {
  return new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
}

/** Valor para <input type="datetime-local"> a partir de uma data (horário de Brasília) */
export function paraCampoDataHora(value?: string | Date | null) {
  if (!value) return '';
  return new Date(new Date(value).getTime() - 3 * 3600_000).toISOString().slice(0, 16);
}

export function paraCampoData(value?: string | Date | null) {
  if (!value) return '';
  return new Date(new Date(value).getTime() - 3 * 3600_000).toISOString().slice(0, 10);
}

export function SecretariaSelect({ secretarias, value, onChange, label = 'Secretaria' }: { secretarias: string[]; value: string; onChange: (v: string) => void; label?: string }) {
  if (secretarias.length <= 1) return null;
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Escolha" />
        </SelectTrigger>
        <SelectContent>
          {secretarias.map((code) => (
            <SelectItem key={code} value={code}>
              {nomeSecretaria(code)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function Numeros({ itens }: { itens: Array<[string, ReactNode]> }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {itens.map(([rotulo, valor]) => (
        <Card key={rotulo}>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{valor ?? '-'}</div>
            <div className="text-sm text-gray-500">{rotulo}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
