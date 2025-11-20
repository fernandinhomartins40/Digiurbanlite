'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EnumOption {
  id: string;
  nome?: string;
  name?: string;
  codigo?: string;
  descricao?: string;
  [key: string]: any;
}

interface EnumFieldProps {
  label: string;
  enumSource: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  description?: string;
  searchable?: boolean;
  disabled?: boolean;
}

export function EnumField({
  label,
  enumSource,
  value,
  onChange,
  placeholder = 'Selecione uma opção',
  required = false,
  description,
  searchable = true,
  disabled = false,
}: EnumFieldProps) {
  const [options, setOptions] = useState<EnumOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOptions();
  }, [enumSource]);

  useEffect(() => {
    if (searchable && searchTerm) {
      const debounce = setTimeout(() => {
        fetchOptions(searchTerm);
      }, 300);
      return () => clearTimeout(debounce);
    } else if (!searchTerm) {
      fetchOptions();
    }
  }, [searchTerm]);

  async function fetchOptions(search?: string) {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      queryParams.append('limit', '100');

      const response = await fetch(
        `/api/enums/${enumSource}?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar opções');
      }

      const result = await response.json();

      if (result.success) {
        setOptions(result.data || []);
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (err) {
      console.error('[EnumField] Erro ao buscar opções:', err);
      setError('Não foi possível carregar as opções');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }

  function getOptionLabel(option: EnumOption): string {
    // Prioridade: nome > name > codigo > descricao
    if (option.nome) return option.nome;
    if (option.name) return option.name;
    if (option.codigo) return option.codigo;
    if (option.descricao) return option.descricao;
    return option.id;
  }

  function getOptionSubtext(option: EnumOption): string | null {
    // Retorna informações adicionais quando disponíveis
    const parts: string[] = [];

    if (option.codigo && option.nome) parts.push(option.codigo);
    if (option.bairro) parts.push(option.bairro);
    if (option.tipo) parts.push(option.tipo);
    if (option.serie) parts.push(option.serie);
    if (option.turno) parts.push(option.turno);
    if (option.especialidade) parts.push(option.especialidade);
    if (option.categoria) parts.push(option.categoria);

    return parts.length > 0 ? parts.join(' • ') : null;
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {searchable && options.length > 5 && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            disabled={disabled || loading}
          />
        </div>
      )}

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Carregando...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {error ? (
            <div className="p-2 text-sm text-red-500">{error}</div>
          ) : options.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              {loading ? 'Carregando opções...' : 'Nenhuma opção disponível'}
            </div>
          ) : (
            options.map((option) => {
              const label = getOptionLabel(option);
              const subtext = getOptionSubtext(option);

              return (
                <SelectItem key={option.id} value={option.id}>
                  <div className="flex flex-col">
                    <span>{label}</span>
                    {subtext && (
                      <span className="text-xs text-muted-foreground">
                        {subtext}
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>

      {!loading && !error && options.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {options.length} {options.length === 1 ? 'opção' : 'opções'} disponível
          {options.length === 1 ? '' : 'is'}
        </p>
      )}
    </div>
  );
}
