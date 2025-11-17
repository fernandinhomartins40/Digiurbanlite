// ============================================================
// DYNAMIC FIELD RENDERER - Renderização Inteligente de Campos
// ============================================================

'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { MapPin, FileText, Calendar } from 'lucide-react';

interface DynamicFieldRendererProps {
  type: string;
  format?: string;
  value: any;
  schema: any;
}

export function DynamicFieldRenderer({
  type,
  format: fieldFormat,
  value,
  schema
}: DynamicFieldRendererProps) {
  // Null/undefined handling
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  // 📅 Date rendering
  if (type === 'string' && fieldFormat === 'date') {
    try {
      const date = new Date(value);
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(date, 'dd/MM/yyyy', { locale: ptBR })}</span>
        </div>
      );
    } catch {
      return <span>{String(value)}</span>;
    }
  }

  // 🕐 DateTime rendering
  if (type === 'string' && fieldFormat === 'date-time') {
    try {
      const date = new Date(value);
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
        </div>
      );
    } catch {
      return <span>{String(value)}</span>;
    }
  }

  // 📍 Location/Coordinates rendering
  if (type === 'object' && schema.properties?.latitude && schema.properties?.longitude) {
    return (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          {value.latitude?.toFixed(6)}, {value.longitude?.toFixed(6)}
        </span>
      </div>
    );
  }

  // 📄 Files/Documents rendering
  if (type === 'array' && schema.items?.format === 'file') {
    const fileCount = Array.isArray(value) ? value.length : 0;
    return (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{fileCount} arquivo(s)</span>
      </div>
    );
  }

  // ✅ Boolean rendering
  if (type === 'boolean') {
    return (
      <Badge variant={value ? 'default' : 'secondary'}>
        {value ? 'Sim' : 'Não'}
      </Badge>
    );
  }

  // 🔢 Number rendering
  if (type === 'number' || type === 'integer') {
    if (fieldFormat === 'currency') {
      return (
        <span>
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value)}
        </span>
      );
    }
    return <span>{value.toLocaleString('pt-BR')}</span>;
  }

  // 📋 Enum (select) rendering
  if (schema.enum && Array.isArray(schema.enum)) {
    const enumIndex = schema.enum.indexOf(value);
    const label = schema.enumNames?.[enumIndex] || value;
    return <Badge variant="outline">{label}</Badge>;
  }

  // 📧 Email rendering
  if (type === 'string' && fieldFormat === 'email') {
    return (
      <a href={`mailto:${value}`} className="text-primary hover:underline">
        {value}
      </a>
    );
  }

  // 📱 Phone rendering
  if (type === 'string' && (fieldFormat === 'phone' || fieldFormat === 'tel')) {
    return (
      <a href={`tel:${value}`} className="text-primary hover:underline">
        {value}
      </a>
    );
  }

  // 🔗 URL rendering
  if (type === 'string' && (fieldFormat === 'url' || fieldFormat === 'uri')) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {value}
      </a>
    );
  }

  // 📝 Default string rendering (truncate long text)
  const stringValue = String(value);
  if (stringValue.length > 100) {
    return (
      <span className="text-sm" title={stringValue}>
        {stringValue.substring(0, 97)}...
      </span>
    );
  }

  return <span>{stringValue}</span>;
}
