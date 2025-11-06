'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Calendar, FileText } from 'lucide-react';

export default function ConsultasPublicasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Users className="h-8 w-8 text-yellow-600 mr-3" />
          Consultas Públicas
        </h1>
        <p className="text-gray-600 mt-1">
          Audiências públicas e participação popular em decisões urbanísticas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo Informativo - Consultas Públicas</CardTitle>
          <CardDescription>
            Este módulo permite visualizar e gerenciar consultas públicas sobre planejamento urbano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-yellow-500" />
                <h4 className="font-medium">Audiências Públicas</h4>
              </div>
              <p className="text-sm text-gray-600">
                Agende e gerencie audiências públicas sobre projetos urbanísticos
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="h-5 h-5 text-yellow-500" />
                <h4 className="font-medium">Participação Popular</h4>
              </div>
              <p className="text-sm text-gray-600">
                Receba e analise contribuições da comunidade
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-yellow-500" />
                <h4 className="font-medium">Documentos</h4>
              </div>
              <p className="text-sm text-gray-600">
                Disponibilize documentos para consulta pública
              </p>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Módulo Informativo:</strong> Este módulo não cria registros vinculados a protocolos.
              É utilizado para visualização e gerenciamento de consultas públicas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
