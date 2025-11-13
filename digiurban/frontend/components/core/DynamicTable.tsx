// ============================================================
// DYNAMIC TABLE - Tabela Adaptativa baseada em Schema
// ============================================================

'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';

// Helper to format dates
function formatDate(date: string | Date): string {
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return String(date);
  }
}

interface DynamicTableProps {
  data: any[];
  schema: any;
  onRowClick?: (row: any) => void;
}

export function DynamicTable({ data, schema, onRowClick }: DynamicTableProps) {
  // Generate columns from schema
  const columns = useMemo(() => {
    if (!schema?.properties) return [];

    const cols: any[] = [];

    // Always include protocol number column
    cols.push({
      key: 'protocolNumber',
      header: 'Protocolo',
      width: 'w-32'
    });

    // Generate columns from schema properties
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      // Skip fields that shouldn't appear in list
      if (prop.showInList === false) return;

      cols.push({
        key,
        header: prop.title || key,
        type: prop.type,
        format: prop.format,
        schema: prop,
        width: 'w-auto'
      });
    });

    // Always include date and status columns
    cols.push({
      key: 'createdAt',
      header: 'Data',
      width: 'w-32'
    });

    cols.push({
      key: 'status',
      header: 'Status',
      width: 'w-32'
    });

    return cols;
  }, [schema]);

  // Status configuration
  const statusConfig: Record<string, { label: string; variant: string }> = {
    pending: { label: 'Pendente', variant: 'warning' },
    approved: { label: 'Aprovado', variant: 'success' },
    rejected: { label: 'Rejeitado', variant: 'destructive' },
    inProgress: { label: 'Em Andamento', variant: 'info' },
    completed: { label: 'Concluído', variant: 'success' },
    cancelled: { label: 'Cancelado', variant: 'secondary' }
  };

  if (data.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">Nenhum protocolo encontrado</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-sm font-medium ${col.width}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-muted/50 transition' : ''}
              >
                {columns.map((col) => {
                  const value = col.key.includes('.')
                    ? col.key.split('.').reduce((obj: any, key: string) => obj?.[key], row)
                    : row.customData?.[col.key] ?? row[col.key];

                  return (
                    <td key={col.key} className="px-4 py-3 text-sm">
                      {col.key === 'protocolNumber' ? (
                        <span className="font-mono font-medium">{value}</span>
                      ) : col.key === 'createdAt' ? (
                        <span>{formatDate(value)}</span>
                      ) : col.key === 'status' ? (
                        <Badge variant={statusConfig[value]?.variant as any}>
                          {statusConfig[value]?.label || value}
                        </Badge>
                      ) : col.type ? (
                        <DynamicFieldRenderer
                          type={col.type}
                          format={col.format}
                          value={value}
                          schema={col.schema}
                        />
                      ) : (
                        <span>{String(value || '—')}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
