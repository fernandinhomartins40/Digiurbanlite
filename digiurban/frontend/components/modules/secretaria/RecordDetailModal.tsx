'use client';

/**
 * ============================================================================
 * RecordDetailModal — ficha completa + relações de um registro (W6)
 * ============================================================================
 * Ao clicar num registro: mostra TODOS os campos organizados (a ficha), as
 * entidades relacionadas (grafo) e ações (editar). Ver PLANO W6.
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { getRecordRelations, type EntityType, type FieldDefinition } from '@/services/registry.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RegistryRecordForm } from './RegistryRecordForm';
import { Pencil, Link2 } from 'lucide-react';

interface Props {
  schema: EntityType;
  record: { id: string; data: Record<string, unknown> } | null;
  onClose: () => void;
  onChanged: () => void;
}

function fmt(f: FieldDefinition, v: unknown) {
  if (v == null || v === '') return '—';
  if (f.dataType === 'BOOL') return v ? 'Sim' : 'Não';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

export function RecordDetailModal({ schema, record, onClose, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [rels, setRels] = useState<{ outgoing: any[]; incoming: any[] } | null>(null);

  useEffect(() => {
    setEditing(false);
    if (!record) { setRels(null); return; }
    getRecordRelations(record.id)
      .then((r) => setRels({ outgoing: r.outgoing as any[], incoming: r.incoming as any[] }))
      .catch(() => setRels({ outgoing: [], incoming: [] }));
  }, [record]);

  if (!record) return null;

  const fields = (schema.fields ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const primary = fields.find((f) => f.displayInTable)?.key || fields[0]?.key;
  const title = primary ? String(record.data[primary] ?? 'Registro') : 'Registro';
  const hasRels = rels && (rels.outgoing.length > 0 || rels.incoming.length > 0);

  return (
    <Dialog open={!!record} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>

        {editing ? (
          <RegistryRecordForm
            schema={schema}
            record={record}
            onSaved={() => { setEditing(false); onChanged(); onClose(); }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="mr-1 h-4 w-4" /> Editar</Button>
            </div>

            {/* Ficha: todos os campos */}
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className="border-b py-1.5">
                  <dt className="text-xs text-muted-foreground">{f.label}{f.isPII && <span className="ml-1 text-amber-600">(sensível)</span>}</dt>
                  <dd className="text-sm">{fmt(f, record.data[f.key])}</dd>
                </div>
              ))}
            </dl>

            {/* Relações */}
            {hasRels && (
              <div className="border-t pt-3">
                <div className="mb-2 flex items-center gap-1.5 text-sm font-medium"><Link2 className="h-4 w-4" /> Entidades relacionadas</div>
                <ul className="space-y-1.5">
                  {rels!.outgoing.map((r, i) => (
                    <li key={`o-${i}`} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">{r.relType}</Badge>
                      <span className="text-muted-foreground">{r.toRecord?.entityType?.name}</span>
                    </li>
                  ))}
                  {rels!.incoming.map((r, i) => (
                    <li key={`i-${i}`} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">{r.relType}</Badge>
                      <span className="text-muted-foreground">{r.fromRecord?.entityType?.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
