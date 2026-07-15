'use client';

/**
 * ============================================================================
 * MÓDULO DADOS (geral, por secretaria) — workspace de widgets
 * ============================================================================
 * Reforma de módulos por secretaria + Gestão de Dados com widgets
 * (PLANO-MODULO-GESTAO-DADOS-WIDGETS.md). UM ÚNICO módulo que concentra e trata
 * TODOS os dados coletados da secretaria (customData dos serviços COM_DADOS).
 *
 * Seletor por TIPO de dado (EntityType) + DataWorkspace (grade de widgets
 * sugeridos por metadados e customizáveis pelo servidor). Não toca apps.
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { listEntityTypes, type EntityType } from '@/services/registry.service';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Loader2, Inbox } from 'lucide-react';
import { DataWorkspace } from './DataWorkspace';

interface Props {
  /** Código do departamento (Department.code usado no EntityType.department). */
  departmentCode?: string;
  departmentName?: string;
}

type EntityTypeWithCount = EntityType & { _count?: { records: number; fields: number } };

export function SecretariaDadosModule({ departmentCode, departmentName }: Props) {
  const [types, setTypes] = useState<EntityTypeWithCount[]>([]);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { entityTypes } = await listEntityTypes();
        const filtered = departmentCode
          ? entityTypes.filter((t) => !t.department || t.department === departmentCode)
          : entityTypes;
        setTypes(filtered);
        setActiveCode(filtered[0]?.code ?? null);
      } catch {
        setTypes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [departmentCode]);

  if (loading) {
    return <div className="flex items-center gap-2 p-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando tipos de dados…</div>;
  }

  if (types.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
          <Inbox className="h-8 w-8" />
          <p className="font-medium text-foreground">Nenhum dado coletado ainda</p>
          <p className="text-sm">Quando serviços com dados forem criados{departmentName ? ` na ${departmentName}` : ''}, os registros aparecem aqui automaticamente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-teal-600" />
        <h2 className="text-lg font-semibold">Dados coletados</h2>
      </div>

      {/* Seletor por tipo de dado */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {types.map((t) => (
          <button
            key={t.code}
            onClick={() => setActiveCode(t.code)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              activeCode === t.code ? 'bg-teal-600 text-white' : 'bg-muted/50 text-foreground hover:bg-muted'
            }`}
          >
            {t.name}
            {t._count?.records != null && (
              <span className={`ml-2 rounded-full px-1.5 text-xs ${activeCode === t.code ? 'bg-teal-500' : 'bg-background'}`}>
                {t._count.records}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeCode && <DataWorkspace key={activeCode} code={activeCode} />}
    </div>
  );
}
