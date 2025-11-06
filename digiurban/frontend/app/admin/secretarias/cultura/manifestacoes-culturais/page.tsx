'use client'

import { useState } from 'react'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  Crown, Calendar, MapPin, Users, FileText, Camera, Music, Utensils,
  Palette, BookOpen, Heart, Shield, AlertTriangle, CheckCircle, Clock,
  Star, Award, Plus, Edit, Eye, Search, Filter, Download, Upload
} from 'lucide-react'

interface ManifestacaoCultural {
  id: string
  codigo: string
  nome: string
  tipo: 'festa_popular' | 'ritual_religioso' | 'artesanato' | 'culinaria' | 'musica_tradicional' | 'danca_folclorica' | 'literatura_oral' | 'conhecimento_tradicional' | 'jogos_tradicionais' | 'medicina_tradicional'
  categoria: 'celebracao' | 'saber_fazer' | 'expressao_oral' | 'pratica_social' | 'conhecimento_natureza'
  origem: string
  regiao_municipal: string
  localidades: string[]
  periodicidade: 'anual' | 'semestral' | 'mensal' | 'semanal' | 'eventual' | 'continua'
  epoca_realizacao: string
  descricao_geral: string
  historia_origem: string
  significado_cultural: string
  caracteristicas_principais: string[]
  elementos_constitutivos: string[]
  materiais_utilizados: string[]
  instrumentos_musicais: string[]
  ingredientes_tipicos: string[]
  tecnicas_artesanais: string[]
  grupos_envolvidos: string[]
  detentores_conhecimento: DetentorSaber[]
  formas_transmissao: string[]
  locais_pratica: string[]
  situacao_atual: 'ativa' | 'em_risco' | 'vulneravel' | 'extinta' | 'revitalizada'
  fatores_risco: string[]
  acoes_salvaguarda: AcaoSalvaguarda[]
  documentacao: DocumentacaoManifestacao[]
  status_registro: 'nao_registrada' | 'em_processo' | 'registrada_municipal' | 'indicada_estadual' | 'registrada_estadual' | 'indicada_nacional' | 'registrada_nacional'
  data_registro?: string
  observacoes: string
}

interface DetentorSaber {
  id: string
  nome: string
  idade: number
  local_residencia: string
  conhecimento_especifico: string
  forma_aprendizagem: string
  tempo_pratica: number
  ensina_outros: boolean
  contato?: string
  status: 'ativo' | 'inativo' | 'falecido'
}

interface AcaoSalvaguarda {
  id: string
  tipo: 'documentacao' | 'transmissao' | 'promocao' | 'pesquisa' | 'protecao_legal' | 'apoio_financeiro'
  descricao: string
  responsavel: string
  data_inicio: string
  data_prevista_fim?: string
  status: 'planejada' | 'em_andamento' | 'concluida' | 'suspensa'
  orcamento?: number
  resultados?: string
}

interface DocumentacaoManifestacao {
  id: string
  tipo: 'video' | 'audio' | 'foto' | 'documento' | 'entrevista' | 'mapeamento'
  titulo: string
  descricao: string
  data_criacao: string
  autor: string
  arquivo: string
  qualidade: 'baixa' | 'media' | 'alta' | 'profissional'
  disponibilidade: 'publica' | 'restrita' | 'arquivo'
}

export default function ManifestacoesCulturaisPage() {
  const { user } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()

  if (!['admin', 'cultura'].some(permission => hasPermission(permission))) {
    return <div className="p-6">Acesso negado. Você não tem permissão para acessar esta página.</div>
  }

  const [manifestacoes, setManifestacoes] = useState<ManifestacaoCultural[]>([
    {
      id: '1',
      codigo: 'MAN-2024-001',
      nome: 'Festa de São João Municipal',
      tipo: 'festa_popular',
      categoria: 'celebracao',
      origem: 'Tradição portuguesa adaptada pelos primeiros colonos em 1952',
      regiao_municipal: 'Todo o município',
      localidades: ['Centro', 'Vila Nova', 'Jardim Esperança'],
      periodicidade: 'anual',
      epoca_realizacao: 'Junho (mês de São João)',
      descricao_geral: 'Festa junina tradicional com quadrilhas, fogueira, comidas típicas e apresentações culturais',
      historia_origem: 'Iniciada pelos primeiros colonos portugueses em 1952, sendo adaptada com elementos da cultura local',
      significado_cultural: 'Representa a união da comunidade e preservação das tradições rurais',
      caracteristicas_principais: ['Quadrilha', 'Fogueira', 'Comidas típicas', 'Música caipira', 'Casamento na roça'],
      elementos_constitutivos: ['Dança de quadrilha', 'Fogueira central', 'Barraquinhas', 'Apresentações musicais'],
      materiais_utilizados: ['Bandeirolas coloridas', 'Chapéus de palha', 'Roupas caipiras', 'Balões'],
      instrumentos_musicais: ['Sanfona', 'Viola caipira', 'Triângulo', 'Zabumba'],
      ingredientes_tipicos: ['Milho', 'Amendoim', 'Batata-doce', 'Quentão', 'Paçoca'],
      tecnicas_artesanais: ['Confecção de bandeirolas', 'Decoração rústica', 'Preparo de quentão'],
      grupos_envolvidos: ['Grupo de Quadrilha Unidos do São João', 'Banda de Forró Tradicional', 'Artesãos locais'],
      detentores_conhecimento: [
        {
          id: '1',
          nome: 'Dona Maria das Quadrilhas',
          idade: 78,
          local_residencia: 'Centro',
          conhecimento_especifico: 'Coreografia de quadrilha tradicional',
          forma_aprendizagem: 'Aprendeu com a mãe desde criança',
          tempo_pratica: 65,
          ensina_outros: true,
          contato: '(11) 98888-0001',
          status: 'ativo'
        }
      ],
      formas_transmissao: ['Ensino familiar', 'Grupos comunitários', 'Oficinas municipais'],
      locais_pratica: ['Praça Central', 'Centros comunitários', 'Escolas municipais'],
      situacao_atual: 'ativa',
      fatores_risco: ['Desinteresse dos jovens', 'Urbanização acelerada'],
      acoes_salvaguarda: [
        {
          id: '1',
          tipo: 'documentacao',
          descricao: 'Gravação de entrevistas com os mestres da quadrilha',
          responsavel: 'Secretaria de Cultura',
          data_inicio: '2024-05-01',
          status: 'em_andamento',
          orcamento: 5000
        }
      ],
      documentacao: [
        {
          id: '1',
          tipo: 'video',
          titulo: 'Festa de São João 2023 - Registro Completo',
          descricao: 'Documentário sobre a festa tradicional',
          data_criacao: '2023-06-24',
          autor: 'Equipe Cultural Municipal',
          arquivo: 'festa_sao_joao_2023.mp4',
          qualidade: 'profissional',
          disponibilidade: 'publica'
        }
      ],
      status_registro: 'registrada_municipal',
      data_registro: '2023-03-15',
      observacoes: 'Manifestação de grande importância para a identidade local'
    },
    {
      id: '2',
      codigo: 'MAN-2024-002',
      nome: 'Artesanato em Cerâmica Local',
      tipo: 'artesanato',
      categoria: 'saber_fazer',
      origem: 'Técnica indígena adaptada pelos ceramistas locais',
      regiao_municipal: 'Vila dos Artesãos',
      localidades: ['Vila dos Artesãos'],
      periodicidade: 'continua',
      epoca_realizacao: 'Durante todo o ano',
      descricao_geral: 'Técnica tradicional de produção de cerâmica utilitária e decorativa',
      historia_origem: 'Herança indígena preservada por famílias de ceramistas há 4 gerações',
      significado_cultural: 'Representa a continuidade dos saberes ancestrais e identidade local',
      caracteristicas_principais: ['Argila local', 'Queima em forno de lenha', 'Decoração tradicional'],
      elementos_constitutivos: ['Coleta da argila', 'Modelagem manual', 'Decoração com engobes', 'Queima controlada'],
      materiais_utilizados: ['Argila local', 'Engobes naturais', 'Lenha específica'],
      instrumentos_musicais: [],
      ingredientes_tipicos: [],
      tecnicas_artesanais: ['Modelagem manual', 'Esmaltação natural', 'Queima em forno tradicional'],
      grupos_envolvidos: ['Associação dos Ceramistas', 'Famílias tradicionais'],
      detentores_conhecimento: [
        {
          id: '1',
          nome: 'Mestre João Ceramista',
          idade: 85,
          local_residencia: 'Vila dos Artesãos',
          conhecimento_especifico: 'Técnicas de queima e esmaltação',
          forma_aprendizagem: 'Tradição familiar - 4ª geração',
          tempo_pratica: 70,
          ensina_outros: true,
          contato: '(11) 98888-0002',
          status: 'ativo'
        }
      ],
      formas_transmissao: ['Tradição familiar', 'Oficinas comunitárias', 'Curso municipal'],
      locais_pratica: ['Ateliês familiares', 'Centro de Artesanato'],
      situacao_atual: 'vulneravel',
      fatores_risco: ['Falta de interesse dos jovens', 'Competição industrial', 'Escassez de argila'],
      acoes_salvaguarda: [
        {
          id: '1',
          tipo: 'transmissao',
          descricao: 'Curso de formação de novos ceramistas',
          responsavel: 'Centro de Artesanato Municipal',
          data_inicio: '2024-07-01',
          status: 'planejada',
          orcamento: 15000
        }
      ],
      documentacao: [
        {
          id: '1',
          tipo: 'foto',
          titulo: 'Processo de produção cerâmica',
          descricao: 'Documentação fotográfica das etapas de produção',
          data_criacao: '2024-03-10',
          autor: 'Fotógrafo Cultural',
          arquivo: 'ceramica_processo.jpg',
          qualidade: 'alta',
          disponibilidade: 'publica'
        }
      ],
      status_registro: 'em_processo',
      observacoes: 'Necessita urgente ação de salvaguarda'
    }
  ])

  const [novaManifestacao, setNovaManifestacao] = useState<Partial<ManifestacaoCultural>>({
    tipo: 'festa_popular',
    categoria: 'celebracao',
    periodicidade: 'anual',
    situacao_atual: 'ativa',
    status_registro: 'nao_registrada',
    localidades: [],
    caracteristicas_principais: [],
    elementos_constitutivos: [],
    materiais_utilizados: [],
    instrumentos_musicais: [],
    ingredientes_tipicos: [],
    tecnicas_artesanais: [],
    grupos_envolvidos: [],
    detentores_conhecimento: [],
    formas_transmissao: [],
    locais_pratica: [],
    fatores_risco: [],
    acoes_salvaguarda: [],
    documentacao: []
  })

  const [filtroSituacao, setFiltroSituacao] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroRegistro, setFiltroRegistro] = useState('')
  const [busca, setBusca] = useState('')
  const [showManifestacaoDialog, setShowManifestacaoDialog] = useState(false)

  const manifestacoesFiltradas = manifestacoes.filter(manifestacao => {
    const matchSituacao = !filtroSituacao || manifestacao.situacao_atual === filtroSituacao
    const matchTipo = !filtroTipo || manifestacao.tipo === filtroTipo
    const matchRegistro = !filtroRegistro || manifestacao.status_registro === filtroRegistro
    const matchBusca = !busca ||
      manifestacao.nome.toLowerCase().includes(busca.toLowerCase()) ||
      manifestacao.origem.toLowerCase().includes(busca.toLowerCase()) ||
      manifestacao.codigo.toLowerCase().includes(busca.toLowerCase())

    return matchSituacao && matchTipo && matchRegistro && matchBusca
  })

  const getSituacaoBadge = (situacao: string) => {
    const variants: Record<string, any> = {
      'ativa': { variant: 'success', label: 'Ativa' },
      'em_risco': { variant: 'destructive', label: 'Em Risco' },
      'vulneravel': { variant: 'secondary', label: 'Vulnerável' },
      'extinta': { variant: 'destructive', label: 'Extinta' },
      'revitalizada': { variant: 'success', label: 'Revitalizada' }
    }
    const config = variants[situacao] || { variant: 'default', label: situacao }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getRegistroBadge = (status: string) => {
    const variants: Record<string, any> = {
      'nao_registrada': { variant: 'secondary', label: 'Não Registrada' },
      'em_processo': { variant: 'default', label: 'Em Processo' },
      'registrada_municipal': { variant: 'success', label: 'Registrada Municipal' },
      'indicada_estadual': { variant: 'default', label: 'Indicada Estadual' },
      'registrada_estadual': { variant: 'success', label: 'Registrada Estadual' },
      'indicada_nacional': { variant: 'default', label: 'Indicada Nacional' },
      'registrada_nacional': { variant: 'success', label: 'Registrada Nacional' }
    }
    const config = variants[status] || { variant: 'default', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'festa_popular': 'Festa Popular',
      'ritual_religioso': 'Ritual Religioso',
      'artesanato': 'Artesanato',
      'culinaria': 'Culinária',
      'musica_tradicional': 'Música Tradicional',
      'danca_folclorica': 'Dança Folclórica',
      'literatura_oral': 'Literatura Oral',
      'conhecimento_tradicional': 'Conhecimento Tradicional',
      'jogos_tradicionais': 'Jogos Tradicionais',
      'medicina_tradicional': 'Medicina Tradicional'
    }
    return labels[tipo] || tipo
  }

  const situacaoData = [
    { name: 'Ativa', value: 8, color: '#10B981' },
    { name: 'Vulnerável', value: 5, color: '#F59E0B' },
    { name: 'Em Risco', value: 3, color: '#EF4444' },
    { name: 'Revitalizada', value: 2, color: '#8B5CF6' },
    { name: 'Extinta', value: 1, color: '#6B7280' }
  ]

  const tipoData = [
    { name: 'Jan', festa: 4, artesanato: 3, musica: 2 },
    { name: 'Fev', festa: 3, artesanato: 4, musica: 3 },
    { name: 'Mar', festa: 5, artesanato: 3, musica: 4 },
    { name: 'Abr', festa: 4, artesanato: 5, musica: 3 },
    { name: 'Mai', festa: 6, artesanato: 4, musica: 5 }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manifestações Culturais</h1>
          <p className="text-muted-foreground">
            Patrimônio cultural imaterial municipal
          </p>
        </div>
        <Dialog open={showManifestacaoDialog} onOpenChange={setShowManifestacaoDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Manifestação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Manifestação Cultural</DialogTitle>
              <DialogDescription>
                Registre uma nova manifestação do patrimônio cultural imaterial
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Manifestação</Label>
                <Input
                  value={novaManifestacao.nome || ''}
                  onChange={(e) => setNovaManifestacao({...novaManifestacao, nome: e.target.value})}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={novaManifestacao.tipo} onValueChange={(value) => setNovaManifestacao({...novaManifestacao, tipo: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="festa_popular">Festa Popular</SelectItem>
                      <SelectItem value="ritual_religioso">Ritual Religioso</SelectItem>
                      <SelectItem value="artesanato">Artesanato</SelectItem>
                      <SelectItem value="culinaria">Culinária</SelectItem>
                      <SelectItem value="musica_tradicional">Música Tradicional</SelectItem>
                      <SelectItem value="danca_folclorica">Dança Folclórica</SelectItem>
                      <SelectItem value="literatura_oral">Literatura Oral</SelectItem>
                      <SelectItem value="conhecimento_tradicional">Conhecimento Tradicional</SelectItem>
                      <SelectItem value="jogos_tradicionais">Jogos Tradicionais</SelectItem>
                      <SelectItem value="medicina_tradicional">Medicina Tradicional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={novaManifestacao.categoria} onValueChange={(value) => setNovaManifestacao({...novaManifestacao, categoria: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="celebracao">Celebração</SelectItem>
                      <SelectItem value="saber_fazer">Saber-fazer</SelectItem>
                      <SelectItem value="expressao_oral">Expressão Oral</SelectItem>
                      <SelectItem value="pratica_social">Prática Social</SelectItem>
                      <SelectItem value="conhecimento_natureza">Conhecimento da Natureza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Periodicidade</Label>
                  <Select value={novaManifestacao.periodicidade} onValueChange={(value) => setNovaManifestacao({...novaManifestacao, periodicidade: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anual">Anual</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="eventual">Eventual</SelectItem>
                      <SelectItem value="continua">Contínua</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Origem</Label>
                <Textarea
                  value={novaManifestacao.origem || ''}
                  onChange={(e) => setNovaManifestacao({...novaManifestacao, origem: e.target.value})}
                  placeholder="Descreva a origem histórica da manifestação"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Região Municipal</Label>
                  <Input
                    value={novaManifestacao.regiao_municipal || ''}
                    onChange={(e) => setNovaManifestacao({...novaManifestacao, regiao_municipal: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Época de Realização</Label>
                  <Input
                    value={novaManifestacao.epoca_realizacao || ''}
                    onChange={(e) => setNovaManifestacao({...novaManifestacao, epoca_realizacao: e.target.value})}
                    placeholder="Ex: Junho, Natal, todo ano"
                  />
                </div>
              </div>

              <div>
                <Label>Descrição Geral</Label>
                <Textarea
                  value={novaManifestacao.descricao_geral || ''}
                  onChange={(e) => setNovaManifestacao({...novaManifestacao, descricao_geral: e.target.value})}
                />
              </div>

              <div>
                <Label>História e Origem</Label>
                <Textarea
                  value={novaManifestacao.historia_origem || ''}
                  onChange={(e) => setNovaManifestacao({...novaManifestacao, historia_origem: e.target.value})}
                />
              </div>

              <div>
                <Label>Significado Cultural</Label>
                <Textarea
                  value={novaManifestacao.significado_cultural || ''}
                  onChange={(e) => setNovaManifestacao({...novaManifestacao, significado_cultural: e.target.value})}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Situação Atual</Label>
                  <Select value={novaManifestacao.situacao_atual} onValueChange={(value) => setNovaManifestacao({...novaManifestacao, situacao_atual: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="em_risco">Em Risco</SelectItem>
                      <SelectItem value="vulneravel">Vulnerável</SelectItem>
                      <SelectItem value="extinta">Extinta</SelectItem>
                      <SelectItem value="revitalizada">Revitalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status de Registro</Label>
                  <Select value={novaManifestacao.status_registro} onValueChange={(value) => setNovaManifestacao({...novaManifestacao, status_registro: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao_registrada">Não Registrada</SelectItem>
                      <SelectItem value="em_processo">Em Processo</SelectItem>
                      <SelectItem value="registrada_municipal">Registrada Municipal</SelectItem>
                      <SelectItem value="indicada_estadual">Indicada Estadual</SelectItem>
                      <SelectItem value="registrada_estadual">Registrada Estadual</SelectItem>
                      <SelectItem value="indicada_nacional">Indicada Nacional</SelectItem>
                      <SelectItem value="registrada_nacional">Registrada Nacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowManifestacaoDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Manifestação</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="manifestacoes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manifestacoes">Manifestações</TabsTrigger>
          <TabsTrigger value="detentores">Detentores de Saber</TabsTrigger>
          <TabsTrigger value="salvaguarda">Ações de Salvaguarda</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="manifestacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros e Busca</CardTitle>
              <CardDescription>Filtre e pesquise manifestações culturais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, código ou origem..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="vulneravel">Vulnerável</SelectItem>
                    <SelectItem value="em_risco">Em Risco</SelectItem>
                    <SelectItem value="revitalizada">Revitalizada</SelectItem>
                    <SelectItem value="extinta">Extinta</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="festa_popular">Festa Popular</SelectItem>
                    <SelectItem value="artesanato">Artesanato</SelectItem>
                    <SelectItem value="culinaria">Culinária</SelectItem>
                    <SelectItem value="musica_tradicional">Música Tradicional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {manifestacoesFiltradas.map((manifestacao) => (
              <Card key={manifestacao.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5" />
                        {manifestacao.codigo} - {manifestacao.nome}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {manifestacao.regiao_municipal}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {manifestacao.periodicidade}
                        </span>
                        <span>{getTipoLabel(manifestacao.tipo)}</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getSituacaoBadge(manifestacao.situacao_atual)}
                      {getRegistroBadge(manifestacao.status_registro)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Descrição</Label>
                    <p className="text-sm">{manifestacao.descricao_geral}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Origem e História</Label>
                    <p className="text-sm">{manifestacao.origem}</p>
                    {manifestacao.historia_origem && (
                      <p className="text-xs text-muted-foreground mt-1">{manifestacao.historia_origem}</p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium">Significado Cultural</Label>
                      <p className="text-sm">{manifestacao.significado_cultural}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Época de Realização</Label>
                      <p className="text-sm">{manifestacao.epoca_realizacao}</p>
                      <p className="text-xs text-muted-foreground">Periodicidade: {manifestacao.periodicidade}</p>
                    </div>
                  </div>

                  {manifestacao.localidades.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Localidades</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {manifestacao.localidades.map((local, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {local}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {manifestacao.caracteristicas_principais.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Características Principais</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {manifestacao.caracteristicas_principais.map((caracteristica, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {caracteristica}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {manifestacao.grupos_envolvidos.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Grupos Envolvidos</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {manifestacao.grupos_envolvidos.map((grupo, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {grupo}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-sm font-medium">Detentores de Saber</Label>
                      <p className="text-sm">{manifestacao.detentores_conhecimento.length} registrados</p>
                      <p className="text-xs text-muted-foreground">
                        {manifestacao.detentores_conhecimento.filter(d => d.status === 'ativo').length} ativos
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Documentação</Label>
                      <p className="text-sm">{manifestacao.documentacao.length} itens</p>
                      <p className="text-xs text-muted-foreground">
                        {manifestacao.documentacao.filter(d => d.disponibilidade === 'publica').length} públicos
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Ações de Salvaguarda</Label>
                      <p className="text-sm">{manifestacao.acoes_salvaguarda.length} ações</p>
                      <p className="text-xs text-muted-foreground">
                        {manifestacao.acoes_salvaguarda.filter(a => a.status === 'em_andamento').length} em andamento
                      </p>
                    </div>
                  </div>

                  {manifestacao.fatores_risco.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Fatores de Risco</Label>
                      <ul className="text-sm list-disc list-inside text-red-600">
                        {manifestacao.fatores_risco.map((fator, index) => (
                          <li key={index}>{fator}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {manifestacao.data_registro && (
                    <div>
                      <Label className="text-sm font-medium">Data de Registro</Label>
                      <p className="text-sm">{new Date(manifestacao.data_registro).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-1" />
                      Detentores
                    </Button>
                    <Button variant="outline" size="sm">
                      <Shield className="h-4 w-4 mr-1" />
                      Salvaguarda
                    </Button>
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-1" />
                      Documentação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detentores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detentores de Saber</CardTitle>
              <CardDescription>Mestres e conhecedores das tradições culturais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {manifestacoes.flatMap(m => m.detentores_conhecimento).map((detentor) => (
                  <Card key={detentor.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{detentor.nome}</CardTitle>
                          <CardDescription>
                            {detentor.idade} anos - {detentor.local_residencia}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={detentor.status === 'ativo' ? 'default' : 'secondary'}>
                            {detentor.status}
                          </Badge>
                          {detentor.ensina_outros && (
                            <Badge variant="default">Transmite conhecimento</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium">Conhecimento Específico</Label>
                          <p className="text-sm">{detentor.conhecimento_especifico}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Forma de Aprendizagem</Label>
                          <p className="text-sm">{detentor.forma_aprendizagem}</p>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 mt-4">
                        <div>
                          <Label className="text-sm font-medium">Tempo de Prática</Label>
                          <p className="text-sm">{detentor.tempo_pratica} anos</p>
                        </div>
                        {detentor.contato && (
                          <div>
                            <Label className="text-sm font-medium">Contato</Label>
                            <p className="text-sm">{detentor.contato}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salvaguarda" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações de Salvaguarda</CardTitle>
              <CardDescription>Iniciativas para preservação e transmissão cultural</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {manifestacoes.flatMap(m => m.acoes_salvaguarda).map((acao, index) => (
                  <Card key={`${acao.id}-${index}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{acao.descricao}</CardTitle>
                          <CardDescription>
                            {acao.responsavel} - {acao.tipo.replace('_', ' ')}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={
                            acao.status === 'concluida' ? 'default' :
                            acao.status === 'em_andamento' ? 'outline' :
                            acao.status === 'suspensa' ? 'destructive' : 'secondary'
                          }>
                            {acao.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <Label className="text-sm font-medium">Data de Início</Label>
                          <p className="text-sm">{new Date(acao.data_inicio).toLocaleDateString('pt-BR')}</p>
                        </div>
                        {acao.data_prevista_fim && (
                          <div>
                            <Label className="text-sm font-medium">Previsão de Término</Label>
                            <p className="text-sm">{new Date(acao.data_prevista_fim).toLocaleDateString('pt-BR')}</p>
                          </div>
                        )}
                        {acao.orcamento && (
                          <div>
                            <Label className="text-sm font-medium">Orçamento</Label>
                            <p className="text-sm font-bold">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                                .format(acao.orcamento)}
                            </p>
                          </div>
                        )}
                      </div>
                      {acao.resultados && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium">Resultados</Label>
                          <p className="text-sm text-muted-foreground">{acao.resultados}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Manifestações</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{manifestacoes.length}</div>
                <p className="text-xs text-muted-foreground">registradas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativas</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {manifestacoes.filter(m => m.situacao_atual === 'ativa').length}
                </div>
                <p className="text-xs text-muted-foreground">em funcionamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Risco</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {manifestacoes.filter(m => ['em_risco', 'vulneravel'].includes(m.situacao_atual)).length}
                </div>
                <p className="text-xs text-muted-foreground">necessitam atenção</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Detentores Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {manifestacoes.reduce((acc, m) =>
                    acc + m.detentores_conhecimento.filter(d => d.status === 'ativo').length, 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">mestres culturais</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Situação das Manifestações</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={situacaoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {situacaoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações de Salvaguarda por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={tipoData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="festa" stroke="#8884d8" name="Festas" />
                    <Line type="monotone" dataKey="artesanato" stroke="#82ca9d" name="Artesanato" />
                    <Line type="monotone" dataKey="musica" stroke="#ffc658" name="Música" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Gerados Automaticamente</CardTitle>
              <CardDescription>
                Serviços disponibilizados no catálogo público a partir do patrimônio cultural imaterial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      Registro de Manifestação Cultural
                    </CardTitle>
                    <CardDescription>
                      Solicitação oficial de registro do patrimônio imaterial
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Formulário de registro</li>
                      <li>• Documentação necessária</li>
                      <li>• Pesquisa cultural</li>
                      <li>• Validação técnica</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Crown className="h-5 w-5 text-purple-500" />
                      Patrimônio Imaterial
                    </CardTitle>
                    <CardDescription>
                      Consulta ao acervo cultural municipal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Catálogo público</li>
                      <li>• Busca por tipo/região</li>
                      <li>• Documentação disponível</li>
                      <li>• Contato com detentores</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      Preservação Cultural
                    </CardTitle>
                    <CardDescription>
                      Ações de salvaguarda do patrimônio cultural
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Solicitação de apoio</li>
                      <li>• Projetos de preservação</li>
                      <li>• Oficinas de transmissão</li>
                      <li>• Documentação cultural</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-yellow-500" />
                      Mestres da Cultura
                    </CardTitle>
                    <CardDescription>
                      Reconhecimento e apoio aos detentores de saber
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Cadastro de mestres</li>
                      <li>• Programa de valorização</li>
                      <li>• Apoio à transmissão</li>
                      <li>• Reconhecimento oficial</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Heart className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">Preservação do Patrimônio Cultural</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      O sistema de manifestações culturais alimenta automaticamente o catálogo público
                      com informações sobre o patrimônio cultural imaterial municipal, facilitando
                      o acesso dos cidadãos às tradições locais e promovendo sua preservação.
                    </p>
                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      <div>
                        <strong>Documentação:</strong> Sistemática
                      </div>
                      <div>
                        <strong>Preservação:</strong> Ativa
                      </div>
                      <div>
                        <strong>Transmissão:</strong> Facilitada
                      </div>
                      <div>
                        <strong>Valorização:</strong> Contínua
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}