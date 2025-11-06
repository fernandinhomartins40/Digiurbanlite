'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Map, Layers, Building } from 'lucide-react';

export default function MapaUrbanoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <MapPin className="h-8 w-8 text-teal-600 mr-3" />
          Mapa Urbano
        </h1>
        <p className="text-gray-600 mt-1">
          Visualização de zoneamento, loteamentos e uso do solo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo Informativo - Mapa Urbano</CardTitle>
          <CardDescription>
            Visualização geográfica do planejamento urbano municipal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Layers className="h-5 w-5 text-teal-500" />
                <h4 className="font-medium">Zoneamento</h4>
              </div>
              <p className="text-sm text-gray-600">
                Visualize as diferentes zonas urbanas e suas características
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Map className="h-5 w-5 text-teal-500" />
                <h4 className="font-medium">Loteamentos</h4>
              </div>
              <p className="text-sm text-gray-600">
                Consulte loteamentos aprovados e suas delimitações
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Building className="h-5 w-5 text-teal-500" />
                <h4 className="font-medium">Uso do Solo</h4>
              </div>
              <p className="text-sm text-gray-600">
                Verifique os tipos de uso permitidos por região
              </p>
            </div>
          </div>

          <div className="mt-6 bg-teal-50 p-4 rounded-lg">
            <p className="text-sm text-teal-800">
              <strong>Módulo Informativo:</strong> Este módulo não cria registros vinculados a protocolos.
              É utilizado para visualização cartográfica e consulta de informações urbanísticas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
