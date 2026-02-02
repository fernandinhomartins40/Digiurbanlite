'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Building2, Users, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrganizationalUnit {
  id: string;
  nome: string;
  sigla?: string;
  tipo: string;
  nivel: number;
  responsavel?: {
    id: string;
    name: string;
    email: string;
  };
  children?: OrganizationalUnit[];
  _count?: {
    assignments?: number;
    positions?: number;
  };
}

interface OrgChartProps {
  data: OrganizationalUnit;
  onUnitClick?: (unit: OrganizationalUnit) => void;
}

export function OrgChart({ data, onUnitClick }: OrgChartProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({
    [data.id]: true, // Expandir raiz por padrão
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      SECRETARIA: 'bg-blue-100 text-blue-700 border-blue-300',
      DIRETORIA: 'bg-purple-100 text-purple-700 border-purple-300',
      COORDENADORIA: 'bg-green-100 text-green-700 border-green-300',
      DIVISAO: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      SETOR: 'bg-gray-100 text-gray-700 border-gray-300',
      NUCLEO: 'bg-pink-100 text-pink-700 border-pink-300',
      GERENCIA: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const renderUnit = (unit: OrganizationalUnit, level: number = 0) => {
    const hasChildren = unit.children && unit.children.length > 0;
    const isExpanded = expanded[unit.id];
    const colorClass = getTipoColor(unit.tipo);

    return (
      <div key={unit.id} className="mb-4">
        <Card
          className={`p-4 border-2 ${colorClass} hover:shadow-lg transition-shadow cursor-pointer`}
          onClick={() => onUnitClick?.(unit)}
          style={{ marginLeft: `${level * 2}rem` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Cabeçalho */}
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5" />
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{unit.nome}</h3>
                  {unit.sigla && (
                    <span className="text-xs px-2 py-1 bg-white/50 rounded">
                      {unit.sigla}
                    </span>
                  )}
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Tipo:</span>
                  <span>{unit.tipo}</span>
                </div>

                {unit.responsavel && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Responsável:</span>
                    <span>{unit.responsavel.name}</span>
                  </div>
                )}

                {unit._count && (
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t border-current/20">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{unit._count.assignments || 0} servidores</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{unit._count.positions || 0} cargos</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botão de expandir/recolher */}
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(unit.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Renderizar filhos se expandido */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {unit.children!.map((child) => renderUnit(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="org-chart">
      {renderUnit(data)}
    </div>
  );
}
