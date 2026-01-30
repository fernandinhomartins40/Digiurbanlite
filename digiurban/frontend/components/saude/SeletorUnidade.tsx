'use client';

import { useUnidade } from '@/contexts/UnidadeContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function SeletorUnidade() {
  const { unidadeSelecionada, unidades, loading, selecionarUnidade } = useUnidade();

  if (loading) {
    return (
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-blue-600" />
          <div className="text-sm text-blue-900">Carregando unidades...</div>
        </div>
      </Card>
    );
  }

  if (unidades.length === 0) {
    return (
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-amber-600" />
          <div className="text-sm text-amber-900">
            Nenhuma unidade de saúde cadastrada
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex items-center gap-3">
        <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-blue-700 font-medium mb-1">
            Unidade de Atendimento
          </div>
          <Select
            value={unidadeSelecionada?.id || ''}
            onValueChange={(value) => {
              const unidade = unidades.find((u) => u.id === value);
              if (unidade) {
                selecionarUnidade(unidade);
              }
            }}
          >
            <SelectTrigger className="h-9 bg-white border-blue-200 focus:ring-blue-500">
              <SelectValue>
                {unidadeSelecionada ? (
                  <span className="font-medium">
                    {unidadeSelecionada.nome}{' '}
                    <span className="text-gray-500 font-normal">
                      ({unidadeSelecionada.tipo})
                    </span>
                  </span>
                ) : (
                  'Selecione uma unidade'
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {unidades.map((unidade) => (
                <SelectItem key={unidade.id} value={unidade.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{unidade.nome}</span>
                    <span className="text-xs text-gray-500">
                      {unidade.tipo}
                      {unidade.cnes && ` • CNES: ${unidade.cnes}`}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {unidades.length > 1 && (
        <div className="mt-2 text-xs text-blue-700">
          ⚠️ Cada unidade tem sua própria fila isolada
        </div>
      )}
    </Card>
  );
}
