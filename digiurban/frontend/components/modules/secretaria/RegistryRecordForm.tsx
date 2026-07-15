'use client';

/**
 * ============================================================================
 * RegistryRecordForm — formulário dinâmico gerado por FieldDefinition
 * ============================================================================
 * Cadastro/edição de um EntityRecord (módulo Dados, UI-3). Renderiza um campo
 * por FieldDefinition conforme o dataType. Nenhum código por serviço — os
 * campos vêm dos metadados do Registry.
 * ============================================================================
 */

import { useState } from 'react';
import { createRecord, updateRecord, type EntityType, type FieldDefinition } from '@/services/registry.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface Props {
  schema: EntityType;
  /** Registro existente (edição) ou undefined (cadastro). */
  record?: { id: string; data: Record<string, unknown> };
  onSaved: () => void;
  onCancel: () => void;
}

export function RegistryRecordForm({ schema, record, onSaved, onCancel }: Props) {
  const fields = (schema.fields ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const [values, setValues] = useState<Record<string, unknown>>(() => ({ ...(record?.data ?? {}) }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setValue = (key: string, v: unknown) => setValues((prev) => ({ ...prev, [key]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (record) await updateRecord(record.id, values);
      else await createRecord(schema.code, values);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={f.dataType === 'ARRAY' || f.dataType === 'GEO' ? 'sm:col-span-2' : ''}>
            <label className="mb-1 block text-sm font-medium">
              {f.label}
              {f.required && <span className="text-red-500"> *</span>}
              {f.isPII && <span className="ml-2 text-xs text-amber-600">(dado sensível)</span>}
            </label>
            <FieldInput field={f} value={values[f.key]} onChange={(v) => setValue(f.key, v)} />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {record ? 'Salvar alterações' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldDefinition; value: unknown; onChange: (v: unknown) => void }) {
  const common = 'w-full';
  const opts = (field.validation as { options?: Array<{ value: string; label: string }> } | undefined)?.options;

  switch (field.dataType) {
    case 'NUMBER':
      return <Input type="number" className={common} value={(value as number) ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
    case 'DATE':
      return <Input type="date" className={common} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'BOOL':
      return (
        <div className="flex items-center gap-2 pt-1">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">Sim</span>
        </div>
      );
    case 'ENUM':
      return (
        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Selecione…</option>
          {(opts ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case 'ARRAY':
      return <Input className={common} placeholder="Separe por vírgula" value={Array.isArray(value) ? (value as string[]).join(', ') : (value as string) ?? ''} onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />;
    case 'GEO':
      return <Input className={common} placeholder="lat, long" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'CPF':
      return <Input className={common} placeholder="000.000.000-00" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'CNPJ':
      return <Input className={common} placeholder="00.000.000/0000-00" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <Input className={common} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}
