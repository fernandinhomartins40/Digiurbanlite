'use client';

/**
 * ABA 3: Visualização Inteligente - Adapta-se ao tipo de serviço
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LayoutGrid, Calendar, Map, Network, Table } from 'lucide-react';
import { useModuleCapabilities } from '@/hooks/useModuleCapabilities';

interface SmartDataVisualizationProps {
  protocols: any[];
  service: any;
}

export function SmartDataVisualization({ protocols, service }: SmartDataVisualizationProps) {
  const { capabilities } = useModuleCapabilities(service);

  const visualizationMode = capabilities.recommendedVisualization;

  // Renderização baseada no modo
  switch (visualizationMode) {
    case 'CARDS':
      return <CardsView protocols={protocols} service={service} />;
    case 'CALENDAR':
      return <CalendarView protocols={protocols} service={service} capabilities={capabilities} />;
    case 'MAP':
      return <MapView protocols={protocols} service={service} capabilities={capabilities} />;
    case 'TREE':
      return <TreeView protocols={protocols} service={service} />;
    default:
      return <TableView protocols={protocols} service={service} />;
  }
}

// Visualização em Cards (Cadastros)
function CardsView({ protocols, service }: any) {
  const schema = service?.formSchema;
  const keyFields = Object.keys(schema?.properties || {}).slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {protocols.map((protocol: any) => (
        <Card key={protocol.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">#{protocol.number}</CardTitle>
              <Badge>{protocol.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {keyFields.map(fieldKey => {
                const fieldSchema = schema.properties[fieldKey];
                const value = protocol.customData?.[fieldKey];
                return (
                  <div key={fieldKey}>
                    <span className="text-muted-foreground">{fieldSchema.title}: </span>
                    <span className="font-medium">{value || '—'}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Visualização em Calendário (Agendamentos)
function CalendarView({ protocols, capabilities }: any) {
  const dateField = capabilities.dateFields[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <CardTitle>Visualização em Calendário</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center p-12 text-muted-foreground">
          Calendário interativo com {protocols.length} agendamentos
          <p className="text-sm mt-2">Campo de data: {dateField}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Visualização em Mapa (Geo)
function MapView({ protocols, capabilities }: any) {
  const protocolsWithGeo = protocols.filter((p: any) =>
    p.latitude && p.longitude || p.customData?.latitude && p.customData?.longitude
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          <CardTitle>Visualização em Mapa</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center p-12 text-muted-foreground">
          Mapa interativo com {protocolsWithGeo.length} localizações
        </div>
      </CardContent>
    </Card>
  );
}

// Visualização em Árvore (Vínculos)
function TreeView({ protocols, service }: any) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          <CardTitle>Visualização em Árvore</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center p-12 text-muted-foreground">
          Árvore de relacionamentos com {protocols.length} vínculos
        </div>
      </CardContent>
    </Card>
  );
}

// Visualização em Tabela (Padrão)
function TableView({ protocols, service }: any) {
  const schema = service?.formSchema;
  const columns = Object.keys(schema?.properties || {}).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Table className="h-5 w-5" />
          <CardTitle>Visualização em Tabela</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Protocolo</th>
                {columns.map(col => (
                  <th key={col} className="text-left p-2">{schema.properties[col].title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {protocols.map((p: any) => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">#{p.number}</td>
                  {columns.map(col => (
                    <td key={col} className="p-2">{p.customData?.[col] || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
