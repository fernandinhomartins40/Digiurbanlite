'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Construction as ConstructionIcon, ArrowLeft, Construction } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MecanizacaoAgricolaPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/secretarias/agricultura')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <ConstructionIcon className="h-6 w-6 text-white" />
              </div>
              Mecanização Agrícola / Patrulha Mecanizada
            </h1>
            <p className="text-gray-600 mt-1">
              Gestão de máquinas agrícolas e solicitações de serviços
            </p>
          </div>
        </div>
        <Badge className="bg-green-600 text-white">MS-05</Badge>
      </div>

      {/* Em Desenvolvimento */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Construction className="h-8 w-8 text-amber-600" />
            <div>
              <CardTitle className="text-2xl text-amber-900">
                🚧 Sistema em Desenvolvimento
              </CardTitle>
              <CardDescription className="text-amber-700 text-base mt-2">
                Este Micro Sistema está sendo implementado e estará disponível em breve.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">📋 Funcionalidades Planejadas:</h3>
              <ul className="list-disc list-inside space-y-2 text-amber-800">
                <li>Cadastro de máquinas e implementos</li>
                <li>Solicitação de serviços pelos produtores</li>
                <li>Fila de espera organizada</li>
                <li>Agendamento e ordens de serviço</li>
                <li>Controle de horímetro e manutenções</li>
                <li>Gestão de combustível</li>
                <li>Rastreamento GPS (opcional)</li>
                <li>Relatórios de produtividade e custos</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg border border-amber-300">
              <p className="text-sm text-amber-900">
                <strong>Status:</strong> Estrutura criada, aguardando implementação completa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎯 Objetivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gerenciar frota de máquinas agrícolas e atender solicitações
              de serviços mecanizados dos produtores.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🚜 Recursos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gestão de frota, fila de espera, ordens de serviço digitais,
              controle de manutenção e combustível.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Integrações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Integra com Produtores, Propriedades e gera histórico
              de serviços prestados.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Voltar */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/secretarias/agricultura')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Secretaria de Agricultura
        </Button>
      </div>
    </div>
  );
}
