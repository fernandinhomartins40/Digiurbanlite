'use client';

/**
 * MODO: CADASTRO
 * Visualização em cards pesquisáveis para cadastros aprovados
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Download, FileSpreadsheet, User, CheckCircle, XCircle } from 'lucide-react';
import type { ConsolidatedModeConfig, ConsolidatedRecord } from '@/lib/consolidated-data-intelligence';

interface CadastrosViewProps {
  config: ConsolidatedModeConfig;
  data: any;
}

export function CadastrosView({ config, data }: CadastrosViewProps) {
  const { records, stats, searchTerm, setSearchTerm, statusFilter, setStatusFilter, actions } = data;

  return (
    <div className="space-y-6">
      {/* Header com Título e Descrição */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h2 className="text-2xl font-bold">{config.title}</h2>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Registros aprovados</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.ativos}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Em atividade</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-500">{stats.inativos}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <XCircle className="h-4 w-4" />
              <span>Desativados</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={actions.handleExportAll}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Todos
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Buscar por nome, CPF, ${config.keyField}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro de Status */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ALL')}
              >
                Todos ({stats.total})
              </Button>
              <Button
                variant={statusFilter === 'ATIVO' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ATIVO')}
              >
                Ativos ({stats.ativos})
              </Button>
              <Button
                variant={statusFilter === 'INATIVO' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('INATIVO')}
              >
                Inativos ({stats.inativos})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cadastros em Cards */}
      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum cadastro encontrado</p>
            <p className="text-sm">Ajuste os filtros ou aguarde novos cadastros aprovados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record: ConsolidatedRecord) => (
            <Card key={record.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {record.metadata?.hasPhoto && (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="truncate">{record.data[config.keyField] || record.citizenName}</span>
                    </CardTitle>
                  </div>
                  <Badge variant={record.status === 'ATIVO' ? 'default' : 'secondary'}>
                    {record.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Informações principais */}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cidadão: </span>
                    <span className="font-medium">{record.citizenName}</span>
                  </div>
                  {record.citizenCpf && (
                    <div>
                      <span className="text-muted-foreground">CPF: </span>
                      <span className="font-medium">{record.citizenCpf}</span>
                    </div>
                  )}
                  {config.secondaryFields.slice(0, 3).map(field => {
                    const value = record.data[field];
                    if (!value) return null;
                    return (
                      <div key={field}>
                        <span className="text-muted-foreground capitalize">{field.replace(/_/g, ' ')}: </span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Protocolo */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Protocolo: {record.protocolNumber}</span>
                    <span>{new Date(record.approvedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => actions.handleViewProtocol(record)}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Ver Protocolo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => actions.handleExportCard(record)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer com contagem */}
      {records.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Exibindo {records.length} de {stats.total} cadastros
        </div>
      )}
    </div>
  );
}
