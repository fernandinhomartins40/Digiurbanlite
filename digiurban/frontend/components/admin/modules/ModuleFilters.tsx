'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ModuleFilter } from '@/lib/module-configs';
import { Search, X } from 'lucide-react';

interface ModuleFiltersProps {
  filters: ModuleFilter[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
}

export function ModuleFilters({ filters, values, onChange, onClear }: ModuleFiltersProps) {
  const hasActiveFilters = Object.values(values).some(
    (value) => value && value !== 'all' && value !== ''
  );

  return (
    <div className="bg-white border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          Filtros
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filters.map((filter) => (
          <div key={filter.key} className="space-y-2">
            <Label htmlFor={filter.key} className="text-xs">
              {filter.label}
            </Label>

            {filter.type === 'text' && (
              <Input
                id={filter.key}
                type="text"
                placeholder={`Buscar por ${filter.label.toLowerCase()}`}
                value={values[filter.key] || ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
              />
            )}

            {filter.type === 'select' && filter.options && (
              <Select
                value={values[filter.key] || filter.defaultValue || ''}
                onValueChange={(value) => onChange(filter.key, value)}
              >
                <SelectTrigger id={filter.key}>
                  <SelectValue placeholder={`Selecione ${filter.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {filter.type === 'date' && (
              <Input
                id={filter.key}
                type="date"
                value={values[filter.key] || ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
              />
            )}

            {filter.type === 'boolean' && (
              <Select
                value={values[filter.key]?.toString() || ''}
                onValueChange={(value) => onChange(filter.key, value === 'true')}
              >
                <SelectTrigger id={filter.key}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
