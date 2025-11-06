'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, FileText, Info } from 'lucide-react';

export default function ConsultaProgramasPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <FileText className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consulta de Programas Habitacionais</h1>
          <p className="text-gray-600">Módulo informativo para consulta de programas disponíveis</p>
        </div>
      </div>

      {/* Info sobre módulo informativo */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Módulo Informativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800">
            Este é um módulo informativo que permite aos cidadãos consultarem programas habitacionais disponíveis.
            Diferente dos módulos com dados (COM_DADOS), este módulo não gera registros no banco de dados,
            servindo apenas para fornecer informações sobre os programas existentes.
          </p>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle>Programas Habitacionais Disponíveis</CardTitle>
          <CardDescription>
            Informações sobre programas federais, estaduais e municipais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Home className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-lg">Casa Verde e Amarela</h3>
                  <p className="text-sm text-gray-600">Programa Federal</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Programa do Governo Federal destinado a famílias com renda de até R$ 7.000,00.
                Oferece subsídios que podem chegar a R$ 47.500,00.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Renda:</span> Até R$ 7.000,00
                </div>
                <div>
                  <span className="font-medium">Subsídio:</span> Até R$ 47.500,00
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Home className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-lg">Habitação Social Municipal</h3>
                  <p className="text-sm text-gray-600">Programa Municipal</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Programa da Prefeitura destinado a famílias em situação de vulnerabilidade social.
                Prioriza famílias cadastradas no CadÚnico.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Renda:</span> Até R$ 2.000,00
                </div>
                <div>
                  <span className="font-medium">Subsídio:</span> Até R$ 35.000,00
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Home className="h-6 w-6 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-lg">Auxílio Aluguel</h3>
                  <p className="text-sm text-gray-600">Programa Municipal</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Auxílio temporário para famílias em situação de emergência habitacional.
                Benefício mensal para pagamento de aluguel.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Renda:</span> Até R$ 1.500,00
                </div>
                <div>
                  <span className="font-medium">Benefício:</span> R$ 400,00/mês
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
