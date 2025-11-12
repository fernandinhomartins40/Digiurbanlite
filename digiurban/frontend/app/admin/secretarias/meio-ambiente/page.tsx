'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useSecretariaServices } from '@/hooks/useSecretariaServices';
import { useMeioAmbienteStats } from '@/hooks/useMeioAmbienteStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Leaf,
  TreePine,
  AlertTriangle,
  FileText,
  TrendingUp,
  Plus,
  FileBarChart,
  AlertCircle,
  Droplet,
  Recycle,
} from 'lucide-react';
import { NewProtocolModal } from '@/components/admin/NewProtocolModal';
import { useRouter } from 'next/navigation';

export default function SecretariaMeioAmbientePage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [showNewProtocolModal, setShowNewProtocolModal] = useState(false);

  // Buscar estatísticas e serviços
  const { stats, loading: statsLoading, error: statsError } = useMeioAmbienteStats();
  const { services, loading: servicesLoading, error: servicesError } = useSecretariaServices('meio-ambiente');

  // Separar serviços COM_DADOS
  const servicesComDados = services.filter((s: any) => s.serviceType === 'COM_DADOS');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Leaf className="h-8 w-8 text-green-600 mr-3" />
            Secretaria Municipal de Meio Ambiente
          </h1>
          <p className="text-gray-600 mt-1">
            Gestão ambiental, licenciamento e preservação
          </p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-200">
          Meio Ambiente
        </Badge>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licenças Ambientais</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.licencasAmbientais.ativas || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.licencasAmbientais.total || 0} total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fiscalizações</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.fiscalizacoes.mesAtual || 0}</div>
                <p className="text-xs text-muted-foreground">
                  este mês
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Áreas Protegidas</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.areasProtegidas.hectares || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  hectares protegidos
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolos Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.protocolosPendentes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  aguardando atendimento
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso direto às funcionalidades mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              className="h-20 flex flex-col"
              variant="outline"
              onClick={() => setShowNewProtocolModal(true)}
            >
              <Plus className="h-6 w-6 mb-2" />
              <span>Novo Protocolo</span>
            </Button>

            <Button
              className="h-20 flex flex-col"
              variant="outline"
              onClick={() => router.push('/admin/protocolos?departamento=meio-ambiente&status=pending')}
            >
              <FileText className="h-6 w-6 mb-2" />
              <span>Protocolos Pendentes</span>
              {stats && stats.protocolosPendentes > 0 && (
                <Badge className="mt-1" variant="destructive">
                  {stats.protocolosPendentes}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Módulos Padrões - Base de dados do sistema */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Módulos Padrões</h2>
          <p className="text-sm text-muted-foreground">
            Gestão de cadastros e dados estruturados de meio ambiente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Atendimentos */}
          <Card className="border-indigo-200 bg-indigo-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/meio-ambiente/atendimentos')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Atendimentos
              </CardTitle>
              <CardDescription>
                Registro de atendimentos ambientais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Em desenvolvimento
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Licenças Ambientais */}
          <Card className="border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/meio-ambiente/licencas')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                Licenças Ambientais
              </CardTitle>
              <CardDescription>
                Licenciamento e autorizações ambientais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ativas:</span>
                    <span className="font-medium">{stats?.licencasAmbientais.ativas || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.licencasAmbientais.total || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Denúncias Ambientais */}
          <Card className="border-orange-200 bg-orange-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/meio-ambiente/denuncias')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Denúncias Ambientais
              </CardTitle>
              <CardDescription>
                Registro e acompanhamento de denúncias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Este mês:</span>
                    <span className="font-medium">{stats?.fiscalizacoes.mesAtual || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats?.fiscalizacoes.total || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Programas Ambientais */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/meio-ambiente/programas')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-blue-600" />
                Programas Ambientais
              </CardTitle>
              <CardDescription>
                Educação ambiental e programas de conservação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ativos:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Em desenvolvimento
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Poda e Corte de Árvores */}
          <Card className="border-emerald-200 bg-emerald-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/meio-ambiente/poda-corte')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TreePine className="h-5 w-5 text-emerald-600" />
                Poda e Corte
              </CardTitle>
              <CardDescription>
                Autorizações de poda e corte de árvores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pendentes:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Em desenvolvimento
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vistorias Ambientais */}
          <Card className="border-purple-200 bg-purple-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/meio-ambiente/vistorias')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Vistorias Ambientais
              </CardTitle>
              <CardDescription>
                Agendamento e registro de vistorias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agendadas:</span>
                  <span className="font-medium">{stats?.inspections.scheduled || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {stats?.inspections.completed || 0} concluídas
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Áreas Protegidas */}
          <Card className="border-teal-200 bg-teal-50/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin/secretarias/meio-ambiente/areas-protegidas')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplet className="h-5 w-5 text-teal-600" />
                Áreas Protegidas
              </CardTitle>
              <CardDescription>
                Cadastro e monitoramento de áreas de preservação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cadastradas:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Em desenvolvimento
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Certidões, Declarações e Documentos (SEM_DADOS) */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Certidões, Declarações e Documentos</h2>
          <p className="text-sm text-muted-foreground">
            Serviços que geram protocolos para emissão de documentos oficiais
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesLoading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              {/* Filtrar apenas serviços SEM_DADOS */}
              {services
                .filter((s: any) => s.serviceType === 'SEM_DADOS')
                .map((service: any) => (
                  <Card
                    key={service.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer border-green-200 bg-green-50/50"
                    onClick={() => setShowNewProtocolModal(true)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        {service.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          ⏱️ Prazo: {service.estimatedDays} dias
                        </div>
                        <div className="text-sm">
                          <Badge variant="outline" className="bg-green-100">
                            {service.category}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowNewProtocolModal(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Solicitar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </>
          )}
        </div>
        {!servicesLoading && services.filter((s: any) => s.serviceType === 'SEM_DADOS').length === 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-16 w-16 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço de documentos cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Execute o seed do banco de dados para carregar os serviços SEM_DADOS
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Módulos Customizados */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Módulos Customizados</h2>
            <p className="text-sm text-muted-foreground">
              Crie tabelas personalizadas para dados específicos de meio ambiente
            </p>
          </div>
          <Button
            onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=environment')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo Customizado
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card exemplo: Monitoramento de Qualidade da Água */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplet className="h-5 w-5 text-blue-600" />
                Qualidade da Água
              </CardTitle>
              <CardDescription>
                Exemplo: monitorar parâmetros de qualidade de rios e córregos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Local, pH, Oxigênio dissolvido, Temperatura, Data da coleta
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=environment&template=agua')}
                >
                  Criar este Módulo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card exemplo: Controle de Resíduos */}
          <Card className="border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Recycle className="h-5 w-5 text-green-600" />
                Controle de Resíduos
              </CardTitle>
              <CardDescription>
                Exemplo: gestão de coleta e destinação de resíduos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Campos possíveis:</strong> Tipo de resíduo, Volume, Origem, Destinação, Data
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/modulos-customizados/novo?moduleType=environment&template=residuos')}
                >
                  Criar este Módulo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card: Ver todos os módulos */}
          <Card className="border-dashed border-2 border-gray-300 hover:border-blue-500 transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileBarChart className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="font-semibold mb-2">Gerenciar Módulos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ver todos os módulos customizados criados para meio ambiente
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/modulos-customizados?moduleType=environment')}
              >
                Ver Todos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info sobre módulos customizados */}
        <Card className="mt-6 border-gray-200 bg-gray-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              O que são Módulos Customizados?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Funcionalidades:</h4>
                <ul className="space-y-1">
                  <li>✅ Defina campos personalizados (texto, número, data, etc)</li>
                  <li>✅ Vincule automaticamente a protocolos</li>
                  <li>✅ Exporte dados para Excel/CSV</li>
                  <li>✅ Crie relatórios personalizados</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Exemplos de uso:</h4>
                <ul className="space-y-1">
                  <li>• Monitoramento de qualidade da água</li>
                  <li>• Controle de resíduos e reciclagem</li>
                  <li>• Registro de plantio de mudas</li>
                  <li>• Cadastro de nascentes e mananciais</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Novo Protocolo */}
      <NewProtocolModal
        open={showNewProtocolModal}
        onOpenChange={setShowNewProtocolModal}
        services={services}
        onSuccess={() => {
          // Recarregar estatísticas após criar protocolo
          window.location.reload();
        }}
      />
    </div>
  );
}
