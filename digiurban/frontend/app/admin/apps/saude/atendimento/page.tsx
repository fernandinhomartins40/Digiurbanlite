'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUnidade } from '@/contexts/UnidadeContext';
import { SeletorUnidade } from '@/components/saude/SeletorUnidade';
import {
  UserPlus,
  Users,
  Clock,
  AlertCircle,
  Stethoscope,
  RefreshCw,
  Search,
  Eye,
  Activity,
  CheckCircle,
} from 'lucide-react';

interface AtendimentoNaLista {
  id: string;
  status: string;
  prioridade: string;
  ordem: number;
  cidadao: {
    id: string;
    name: string;
    cpf?: string;
    cns?: string;
  };
  tipoAtendimento: string;
  motivoChegada?: string;
  profissional?: {
    id: string;
    nome: string;
  };
  criadoEm: string;
  iniciadoEm?: string;
}

export default function ListaAtendimentosPage() {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidade();
  const [atendimentos, setAtendimentos] = useState<AtendimentoNaLista[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroBusca, setFiltroBusca] = useState('');

  // Recarregar lista quando unidade mudar
  useEffect(() => {
    if (unidadeSelecionada?.id) {
      loadAtendimentos(unidadeSelecionada.id);

      // Atualizar a cada 30 segundos
      const interval = setInterval(() => {
        loadAtendimentos(unidadeSelecionada.id, true);
      }, 30000);

      const handleUnidadeChanged = () => {
        if (unidadeSelecionada?.id) {
          loadAtendimentos(unidadeSelecionada.id);
        }
      };

      window.addEventListener('unidade-changed', handleUnidadeChanged);

      return () => {
        clearInterval(interval);
        window.removeEventListener('unidade-changed', handleUnidadeChanged);
      };
    }
  }, [unidadeSelecionada]);

  const loadAtendimentos = async (unidadeId: string, silencioso = false) => {
    try {
      if (!silencioso) {
        setLoading(true);
      } else {
        setAtualizando(true);
      }

      const response = await fetch(
        `/api/saude/fila-atendimento?unidadeId=${unidadeId}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        console.error('Erro ao carregar lista de atendimentos');
        setAtendimentos([]);
        return;
      }

      const data = await response.json();

      // Mapear dados da API (FilaAtendimento) para formato da lista
      const atendimentosFormatados = data.map((item: any, index: number) => ({
        id: item.id,
        status: item.status,
        prioridade: item.prioridade,
        ordem: index + 1,
        cidadao: {
          id: item.citizen?.id || '',
          name: item.citizen?.name || 'Paciente',
          cpf: item.citizen?.cpf,
          cns: item.citizen?.cns,
        },
        tipoAtendimento: item.tipoAtendimento || 'CONSULTA',
        motivoChegada: item.motivoBusca,
        profissional: item.profissional,
        criadoEm: item.dataHoraChegada,
        iniciadoEm: item.dataHoraInicio,
      }));

      setAtendimentos(atendimentosFormatados);
    } catch (error) {
      console.error('Erro ao carregar atendimentos:', error);
      setAtendimentos([]);
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  };

  const getStatusConfig = (status: string, prioridade: string) => {
    // Cores baseadas no PEC e-SUS com novos status SUS
    const configs: Record<string, { cor: string; label: string; icon: any }> = {
      // Status iniciais
      AGUARDANDO: { cor: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Aguardando', icon: Clock },

      // UPA - Classificação de Risco
      EM_CLASSIFICACAO_RISCO: { cor: 'bg-red-50 text-red-800 border-red-300', label: 'Em Classificação Risco', icon: AlertCircle },
      AGUARDANDO_ATENDIMENTO: { cor: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Aguardando Atendimento', icon: Clock },

      // UBS - Acolhimento
      EM_ACOLHIMENTO: { cor: 'bg-green-50 text-green-800 border-green-300', label: 'Em Acolhimento', icon: Activity },
      RESOLVIDO_ACOLHIMENTO: { cor: 'bg-teal-100 text-teal-800 border-teal-300', label: 'Resolvido no Acolhimento', icon: CheckCircle },

      // Fluxo comum (depreciados mas mantidos para compatibilidade)
      EM_ESCUTA_INICIAL: { cor: 'bg-green-100 text-green-800 border-green-300', label: 'Em Escuta Inicial', icon: Activity },
      EM_TRIAGEM: { cor: 'bg-green-100 text-green-800 border-green-300', label: 'Em Triagem', icon: Stethoscope },
      AGUARDANDO_MEDICO: { cor: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Aguardando Médico', icon: Clock },

      // Atendimento
      EM_CONSULTA: { cor: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Em Consulta', icon: Stethoscope },
      EM_PROCEDIMENTO: { cor: 'bg-indigo-100 text-indigo-800 border-indigo-300', label: 'Em Procedimento', icon: Activity },
      EM_VACINACAO: { cor: 'bg-pink-100 text-pink-800 border-pink-300', label: 'Em Vacinação', icon: Activity },

      // Finalizações
      FINALIZADO: { cor: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Finalizado', icon: CheckCircle },
      ENCAMINHADO_EXTERNO: { cor: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Encaminhado Externo', icon: AlertCircle },
      INTERNADO: { cor: 'bg-red-100 text-red-800 border-red-300', label: 'Internado', icon: AlertCircle },
      NAO_AGUARDOU: { cor: 'bg-gray-200 text-gray-700 border-gray-400', label: 'Não Aguardou', icon: Clock },
      RETORNOU: { cor: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Retornou', icon: RefreshCw },
      TRANSFERIDO: { cor: 'bg-cyan-100 text-cyan-800 border-cyan-300', label: 'Transferido', icon: Activity },

      // Outros
      CHAMADO: { cor: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Chamado', icon: Activity },
      CONSULTA_CONCLUIDA: { cor: 'bg-indigo-100 text-indigo-800 border-indigo-300', label: 'Consulta Concluída', icon: CheckCircle },
    };

    // Sobrescrever cor se for urgência/emergência (Protocolo de Manchester)
    if (['EMERGENCIA', 'MUITO_URGENTE'].includes(prioridade)) {
      return { cor: 'bg-red-100 text-red-800 border-red-300', label: configs[status]?.label || status, icon: AlertCircle };
    }
    if (prioridade === 'URGENTE') {
      return { cor: 'bg-orange-100 text-orange-800 border-orange-300', label: configs[status]?.label || status, icon: AlertCircle };
    }

    return configs[status] || { cor: 'bg-gray-100 text-gray-800 border-gray-300', label: status, icon: Users };
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const cores: Record<string, string> = {
      EMERGENCIA: 'bg-red-600 text-white',
      MUITO_URGENTE: 'bg-red-500 text-white',
      URGENTE: 'bg-orange-500 text-white',
      POUCO_URGENTE: 'bg-blue-500 text-white',
      NAO_URGENTE: 'bg-gray-500 text-white',
      NORMAL: 'bg-gray-400 text-white',
    };

    const labels: Record<string, string> = {
      EMERGENCIA: '🔴 Emergência',
      MUITO_URGENTE: '🔴 Muito Urgente',
      URGENTE: '🟠 Urgente',
      POUCO_URGENTE: '🟢 Pouco Urgente',
      NAO_URGENTE: '⚪ Não Urgente',
      NORMAL: 'Normal',
    };

    return (
      <Badge className={cores[prioridade] || cores.NORMAL}>
        {labels[prioridade] || prioridade}
      </Badge>
    );
  };

  const handleAcao = (atendimento: AtendimentoNaLista, acao: string) => {
    switch (acao) {
      case 'classificacao-risco':
        router.push(`/admin/apps/saude/atendimento/enfermagem?filaId=${atendimento.id}`);
        break;
      case 'acolhimento':
        router.push(`/admin/apps/saude/atendimento/enfermagem?filaId=${atendimento.id}`);
        break;
      case 'escuta-inicial':
        router.push(`/admin/apps/saude/atendimento/escuta-inicial/${atendimento.id}`);
        break;
      case 'triagem':
        router.push(`/admin/apps/saude/atendimento/enfermagem?filaId=${atendimento.id}`);
        break;
      case 'consulta':
        router.push(`/admin/apps/saude/atendimento/consulta?filaId=${atendimento.id}`);
        break;
      case 'prontuario':
        router.push(`/admin/apps/saude/atendimento/prontuario/${atendimento.cidadao.id}`);
        break;
    }
  };

  const getAcoesDisponiveis = (status: string) => {
    const acoes: Record<string, { label: string; acao: string; variante: any }[]> = {
      // UPA - Iniciar Classificação de Risco
      AGUARDANDO: [
        { label: 'Classificação Risco (UPA)', acao: 'classificacao-risco', variante: 'default' },
        { label: 'Acolhimento (UBS)', acao: 'acolhimento', variante: 'default' },
        { label: 'Ver Prontuário', acao: 'prontuario', variante: 'outline' },
      ],

      // Em classificação ou acolhimento
      EM_CLASSIFICACAO_RISCO: [
        { label: 'Continuar Classificação', acao: 'classificacao-risco', variante: 'default' },
        { label: 'Ver Prontuário', acao: 'prontuario', variante: 'outline' },
      ],
      EM_ACOLHIMENTO: [
        { label: 'Continuar Acolhimento', acao: 'acolhimento', variante: 'default' },
        { label: 'Ver Prontuário', acao: 'prontuario', variante: 'outline' },
      ],

      // Aguardando atendimento (após triagem/acolhimento)
      AGUARDANDO_ATENDIMENTO: [
        { label: 'Iniciar Consulta', acao: 'consulta', variante: 'default' },
        { label: 'Ver Prontuário', acao: 'prontuario', variante: 'outline' },
      ],

      // Depreciados mas mantidos
      EM_ESCUTA_INICIAL: [
        { label: 'Continuar Escuta', acao: 'escuta-inicial', variante: 'default' },
        { label: 'Ver Prontuário', acao: 'prontuario', variante: 'outline' },
      ],
      EM_TRIAGEM: [
        { label: 'Continuar Triagem', acao: 'triagem', variante: 'default' },
        { label: 'Ver Prontuário', acao: 'prontuario', variante: 'outline' },
      ],
      AGUARDANDO_MEDICO: [
        { label: 'Iniciar Consulta', acao: 'consulta', variante: 'default' },
        { label: 'Ver Prontuário', acao: 'prontuario', variante: 'outline' },
      ],
      EM_CONSULTA: [
        { label: 'Continuar Consulta', acao: 'consulta', variante: 'default' },
        { label: 'Ver Prontuário', acao: 'prontuario', variante: 'outline' },
      ],
    };

    return acoes[status] || [{ label: 'Ver Prontuário', acao: 'prontuario', variante: 'outline' }];
  };

  // Filtros
  const atendimentosFiltrados = atendimentos.filter((atendimento) => {
    // Filtro por status
    if (filtroStatus !== 'TODOS' && atendimento.status !== filtroStatus) {
      return false;
    }

    // Filtro por busca (nome, CPF, CNS)
    if (filtroBusca) {
      const busca = filtroBusca.toLowerCase();
      const nome = atendimento.cidadao.name.toLowerCase();
      const cpf = atendimento.cidadao.cpf?.replace(/\D/g, '') || '';
      const cns = atendimento.cidadao.cns || '';

      if (!nome.includes(busca) && !cpf.includes(busca) && !cns.includes(busca)) {
        return false;
      }
    }

    return true;
  });

  // Estatísticas
  const stats = {
    total: atendimentos.length,
    aguardando: atendimentos.filter((a) => a.status === 'AGUARDANDO').length,
    emAtendimento: atendimentos.filter((a) =>
      ['EM_ESCUTA_INICIAL', 'EM_TRIAGEM', 'EM_CONSULTA'].includes(a.status)
    ).length,
    urgencias: atendimentos.filter((a) =>
      ['EMERGENCIA', 'MUITO_URGENTE', 'URGENTE'].includes(a.prioridade)
    ).length,
  };

  if (!unidadeSelecionada) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lista de Atendimentos</h1>
          <p className="text-gray-500 mt-1">
            Selecione uma unidade para visualizar a lista de atendimentos
          </p>
        </div>
        <SeletorUnidade />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando lista de atendimentos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Seletor de Unidade */}
      <SeletorUnidade />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Lista de Atendimentos
          </h1>
          <p className="text-gray-500 mt-1">
            Pacientes em atendimento em{' '}
            <span className="font-semibold">{unidadeSelecionada.nome}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => loadAtendimentos(unidadeSelecionada.id)}
            variant="outline"
            disabled={atualizando}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${atualizando ? 'animate-spin' : ''}`} />
            {atualizando ? 'Atualizando...' : 'Atualizar'}
          </Button>
          <Button
            onClick={() => router.push('/admin/apps/saude/atendimento/adicionar')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar à Lista
          </Button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">pacientes na lista</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.aguardando}</div>
            <p className="text-xs text-muted-foreground mt-1">aguardando atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.emAtendimento}</div>
            <p className="text-xs text-muted-foreground mt-1">em atendimento agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgências</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgencias}</div>
            <p className="text-xs text-muted-foreground mt-1">casos urgentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, CPF ou CNS..."
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os status</SelectItem>
                  <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                  <SelectItem value="EM_ESCUTA_INICIAL">Em Escuta Inicial</SelectItem>
                  <SelectItem value="EM_TRIAGEM">Em Triagem</SelectItem>
                  <SelectItem value="AGUARDANDO_MEDICO">Aguardando Médico</SelectItem>
                  <SelectItem value="EM_CONSULTA">Em Consulta</SelectItem>
                  <SelectItem value="CONSULTA_CONCLUIDA">Consulta Concluída</SelectItem>
                  <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Atendimentos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Pacientes ({atendimentosFiltrados.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {atendimentosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <div className="text-gray-500 font-medium">Nenhum paciente na lista</div>
              <div className="text-sm text-gray-400 mt-1">
                {filtroBusca || filtroStatus !== 'TODOS'
                  ? 'Tente ajustar os filtros'
                  : 'Adicione pacientes à lista para começar'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {atendimentosFiltrados.map((atendimento) => {
                const statusConfig = getStatusConfig(atendimento.status, atendimento.prioridade);
                const Icon = statusConfig.icon;
                const acoes = getAcoesDisponiveis(atendimento.status);

                return (
                  <div
                    key={atendimento.id}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg hover:shadow-md transition-all ${statusConfig.cor}`}
                  >
                    <div className="flex-1 flex items-center gap-4">
                      {/* Número da Ordem */}
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-gray-700">
                          #{atendimento.ordem}
                        </div>
                        <div className="text-xs text-gray-500">Ordem</div>
                      </div>

                      {/* Dados do Paciente */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-lg">{atendimento.cidadao.name}</div>
                          {getPrioridadeBadge(atendimento.prioridade)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {atendimento.cidadao.cpf && (
                            <div>CPF: {atendimento.cidadao.cpf}</div>
                          )}
                          {atendimento.motivoChegada && (
                            <div className="italic">Motivo: {atendimento.motivoChegada}</div>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-col items-center gap-2">
                        <Badge className={`${statusConfig.cor} border-2`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {atendimento.criadoEm && (
                          <div className="text-xs text-gray-500">
                            {new Date(atendimento.criadoEm).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 ml-4">
                      {acoes.map((acao) => (
                        <Button
                          key={acao.acao}
                          onClick={() => handleAcao(atendimento, acao.acao)}
                          variant={acao.variante as any}
                          size="sm"
                        >
                          {acao.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rodapé */}
      <div className="text-center text-sm text-gray-500 pt-6 border-t">
        <p>
          Atualização automática a cada 30 segundos • Sistema compatível com PEC e-SUS APS
        </p>
      </div>
    </div>
  );
}
