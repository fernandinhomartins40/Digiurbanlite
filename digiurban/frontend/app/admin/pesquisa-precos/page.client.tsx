'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Search, Download, FileText, BarChart2, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, Building2, TrendingUp, Database, Clock,
  Shield, Users, MapPin, Layers, FileDown, ScrollText, Play, Settings,
  CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import { IngestStatus } from '@/lib/prices-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  pricesClient,
  PriceSearchResponse,
  PriceSearchFilters,
  PriceSearchPeriod,
  PricesCoverageResponse,
  SupplierMapResponse,
  CatmatSearchResult,
} from '@/lib/prices-client';
import { useToast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

const SOURCES = [
  { value: 'pncp', label: 'PNCP', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'comprasnet', label: 'ComprasNet', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'bps', label: 'BPS Saúde', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'transparencia', label: 'Transparência', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'fnde', label: 'FNDE', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
];

function getSourceBadge(source: string) {
  const s = SOURCES.find((x) => x.value === source);
  return s ? s : { value: source, label: source.toUpperCase(), color: 'bg-gray-100 text-gray-700 border-gray-200' };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatConfidence(score: number): string {
  if (score >= 0.9) return 'Muito Alta';
  if (score >= 0.75) return 'Alta';
  if (score >= 0.5) return 'Média';
  if (score >= 0.3) return 'Baixa';
  return 'Muito Baixa';
}

function confidenceColor(score: number): string {
  if (score >= 0.9) return 'text-green-700';
  if (score >= 0.75) return 'text-blue-700';
  if (score >= 0.5) return 'text-yellow-700';
  return 'text-red-700';
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function PesquisaPrecos() {
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [xlsxLoading, setXlsxLoading] = useState(false);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [result, setResult] = useState<PriceSearchResponse | null>(null);
  const [supplierMap, setSupplierMap] = useState<SupplierMapResponse | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('estatisticas');

  // Autocomplete CATMAT
  const [catmatQuery, setCatmatQuery] = useState('');
  const [catmatResults, setCatmatResults] = useState<CatmatSearchResult[]>([]);
  const [catmatSelected, setCatmatSelected] = useState<CatmatSearchResult | null>(null);
  const [catmatLoading, setCatmatLoading] = useState(false);
  const catmatDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filtros
  const [filterUf, setFilterUf] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterUnit, setFilterUnit] = useState<string>('');
  const [filterMinPrice, setFilterMinPrice] = useState<string>('');
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>('');
  const [periodFrom, setPeriodFrom] = useState<string>('');
  const [periodTo, setPeriodTo] = useState<string>('');

  // Painel de ingestão
  const [showIngestPanel, setShowIngestPanel] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<IngestStatus | null>(null);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestTriggering, setIngestTriggering] = useState<string | null>(null);
  const [ingestSinceDays, setIngestSinceDays] = useState<string>('1825');
  const [coverage, setCoverage] = useState<PricesCoverageResponse | null>(null);

  // Carregar status de ingestão automaticamente ao abrir painel
  useEffect(() => {
    if (!showIngestPanel) return;
    if (!ingestStatus) loadIngestStatus();
    if (!coverage) loadCoverage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIngestPanel]);

  useEffect(() => {
    loadCoverage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadIngestStatus() {
    setIngestLoading(true);
    try {
      const status = await pricesClient.getIngestStatus();
      setIngestStatus(status);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível obter status de ingestão.', variant: 'destructive' });
    } finally {
      setIngestLoading(false);
    }
  }

  async function loadCoverage() {
    try {
      const data = await pricesClient.getCoverage();
      setCoverage(data);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível obter métricas de cobertura da base.', variant: 'destructive' });
    }
  }

  async function handleTriggerIngest(source?: string) {
    const key = source ?? 'all';
    setIngestTriggering(key);
    try {
      const parsedSinceDays = Number.parseInt(ingestSinceDays, 10);
      const sinceDays = Number.isFinite(parsedSinceDays)
        ? Math.min(3650, Math.max(30, parsedSinceDays))
        : 1825;
      const { jobId } = await pricesClient.triggerIngest({ source, since_days: sinceDays });
      toast({
        title: 'Ingestão iniciada!',
        description: `Job ${jobId} iniciado para ${source ? `fonte: ${source.toUpperCase()}` : 'todas as fontes'} (janela: ${sinceDays} dias). Os dados serão disponíveis em alguns minutos.`,
      });
      // Recarregar status após 3s
      setTimeout(() => loadIngestStatus(), 3000);
    } catch {
      toast({ title: 'Erro ao iniciar ingestão', description: 'Verifique se o módulo está disponível.', variant: 'destructive' });
    } finally {
      setIngestTriggering(null);
    }
  }

  function buildFilters(): PriceSearchFilters {
    const f: PriceSearchFilters = {};
    if (filterUf && filterUf !== 'all') f.uf = filterUf;
    if (filterSource && filterSource !== 'all') f.source = filterSource;
    if (filterUnit) f.unit = filterUnit;
    if (filterMinPrice) f.minPrice = parseFloat(filterMinPrice);
    if (filterMaxPrice) f.maxPrice = parseFloat(filterMaxPrice);
    return f;
  }

  function buildPeriod(): PriceSearchPeriod | undefined {
    if (!periodFrom && !periodTo) return undefined;
    return { from: periodFrom || undefined, to: periodTo || undefined };
  }

  // CATMAT autocomplete
  const handleCatmatInput = useCallback((val: string) => {
    setCatmatQuery(val);
    if (catmatDebounce.current) clearTimeout(catmatDebounce.current);
    if (val.length < 2) { setCatmatResults([]); return; }
    catmatDebounce.current = setTimeout(async () => {
      setCatmatLoading(true);
      try {
        const results = await pricesClient.searchCatmat(val, undefined, 8);
        setCatmatResults(results);
      } catch {
        // silencioso
      } finally {
        setCatmatLoading(false);
      }
    }, 300);
  }, []);

  function selectCatmat(item: CatmatSearchResult) {
    setCatmatSelected(item);
    setCatmatResults([]);
    setCatmatQuery(item.description);
    setQuery(item.description);
  }

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    setSupplierMap(null);

    try {
      const data = await pricesClient.search({
        query: query.trim(),
        filters: buildFilters(),
        period: buildPeriod(),
        page: 1,
        page_size: 50,
      });
      setResult(data);
      setActiveTab('estatisticas');
    } catch {
      toast({
        title: 'Erro na pesquisa',
        description: 'Não foi possível realizar a pesquisa. Verifique se o módulo está disponível.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadSuppliers() {
    if (!query.trim()) return;
    setSuppliersLoading(true);
    try {
      const data = await pricesClient.getSupplierMap(query.trim(), {
        uf: filterUf && filterUf !== 'all' ? filterUf : undefined,
        source: filterSource && filterSource !== 'all' ? filterSource : undefined,
        limit: 20,
      });
      setSupplierMap(data);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível carregar mapa de fornecedores.', variant: 'destructive' });
    } finally {
      setSuppliersLoading(false);
    }
  }

  async function handleTabChange(tab: string) {
    setActiveTab(tab);
    if (tab === 'fornecedores' && !supplierMap && result) {
      await handleLoadSuppliers();
    }
  }

  async function handleDownloadReport(format: 'pdf' | 'html', includeTermoReferencia = false) {
    if (!query.trim()) return;
    setReportLoading(true);
    try {
      await pricesClient.downloadReport({
        query: query.trim(),
        filters: buildFilters(),
        period: buildPeriod(),
        format,
        includeTermoReferencia,
        unit: filterUnit || undefined,
      });
      toast({ title: 'Relatório gerado!', description: `Relatório ${format.toUpperCase()} baixado com sucesso.` });
    } catch {
      toast({ title: 'Erro ao gerar relatório', description: 'Não foi possível gerar o relatório.', variant: 'destructive' });
    } finally {
      setReportLoading(false);
    }
  }

  async function handleExportXlsx() {
    if (!result || result.items.length === 0) return;
    setXlsxLoading(true);
    try {
      const { utils, writeFile } = await import('xlsx');
      const rows = result.items.map((item) => ({
        'Descrição': item.description,
        'Unidade': item.unit ?? '',
        'Valor Unitário': item.unitPrice ?? '',
        'Quantidade': item.quantity ?? '',
        'Data': item.contractDate ? new Date(item.contractDate).toLocaleDateString('pt-BR') : '',
        'UF': item.uf ?? '',
        'Cidade': item.city ?? '',
        'Órgão': item.organizationName ?? '',
        'Modalidade': item.modality ?? '',
        'Fonte': item.source.toUpperCase(),
        'Fornecedor': item.supplierName ?? '',
        'CNPJ Fornecedor': item.supplierCnpj ?? '',
        'CATMAT': item.catmatCode ?? '',
        'Confiabilidade': `${Math.round(item.confidenceScore * 100)}%`,
      }));

      const metaRows = [
        ['Pesquisa de Preços Públicos — DigiUrban'],
        ['Termo buscado:', result.query],
        ['Normalizado:', result.normalizedQuery],
        ['Total de registros:', result.total],
        ['Média:', result.statistics ? formatCurrency(result.statistics.mean) : 'N/A'],
        ['Mediana:', result.statistics ? formatCurrency(result.statistics.median) : 'N/A'],
        ['Período:', `${result.explanation.period.from} a ${result.explanation.period.to}`],
        ['Gerado em:', new Date().toLocaleString('pt-BR')],
        [],
      ];

      const wb = utils.book_new();
      const wsMeta = utils.aoa_to_sheet(metaRows);
      const wsData = utils.json_to_sheet(rows);
      utils.book_append_sheet(wb, wsMeta, 'Resumo');
      utils.book_append_sheet(wb, wsData, 'Contratos');
      writeFile(wb, `pesquisa_precos_${query.replace(/\s+/g, '_').substring(0, 25)}.xlsx`);
      toast({ title: 'Excel exportado!', description: 'Arquivo XLSX baixado com sucesso.' });
    } catch {
      toast({ title: 'Erro ao exportar', description: 'Não foi possível gerar o arquivo Excel.', variant: 'destructive' });
    } finally {
      setXlsxLoading(false);
    }
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Search className="w-7 h-7 text-blue-600" />
          Pesquisa de Preços Públicos
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Base multifonte: PNCP, ComprasNet/SIASG, Portal da Transparência, BPS Saúde, FNDE — conformidade com Lei 14.133/2021
        </p>
      </div>

      {/* Cards de cobertura + botão painel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {SOURCES.map((src) => {
          const sourceCoverage = coverage?.bySource.find((item) => item.source === src.value);
          return (
            <div key={src.value} className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-2 ${src.color}`}>
              <span className="inline-flex items-center gap-2">
                <Database className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium truncate">{src.label}</span>
              </span>
              <span className="text-xs font-bold">
                {(sourceCoverage?.count ?? 0).toLocaleString('pt-BR')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Painel de Ingestão de Dados */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowIngestPanel(!showIngestPanel)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Configuração e Ingestão de Dados</span>
          {showIngestPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showIngestPanel && (
          <Card className="mt-3 border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-600" />
                Painel de Ingestão de Dados
              </CardTitle>
              <CardDescription>
                Dispare a coleta de dados das fontes públicas. A ingestão pode levar vários minutos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status da última execução */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status da ingestão</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={loadCoverage} disabled={ingestLoading}>
                    <Database className="w-3 h-3 mr-1" />
                    Cobertura
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadIngestStatus} disabled={ingestLoading}>
                    {ingestLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                    Atualizar
                  </Button>
                </div>
              </div>

              {coverage && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-lg font-bold text-blue-600">{coverage.totals.lineItems.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-gray-500">Itens totais</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-lg font-bold text-green-600">{coverage.totals.withSupplier.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-gray-500">Com fornecedor</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-lg font-bold text-indigo-600">{coverage.totals.withCatmat.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-gray-500">Com CATMAT/CATSER</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-lg font-bold text-purple-600">{coverage.totals.technicalItems.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-gray-500">Itens técnicos</p>
                  </div>
                </div>
              )}

              {coverage && coverage.bySource.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  {SOURCES.map((src) => {
                    const item = coverage.bySource.find((x) => x.source === src.value);
                    return (
                      <div key={`cov-${src.value}`} className="rounded border p-2 text-xs">
                        <p className="font-semibold">{src.label}</p>
                        <p className="text-gray-500">{(item?.count ?? 0).toLocaleString('pt-BR')} itens</p>
                        <p className="text-gray-400">Fornecedores: {(item?.withSupplier ?? 0).toLocaleString('pt-BR')}</p>
                        <p className="text-gray-400">
                          Atualização: {item?.lastContractDate ? formatDate(item.lastContractDate) : '-'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {coverage?.governance && (
                <div className="rounded-lg border bg-gray-50 dark:bg-gray-900 p-3 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm font-medium">Governança e conformidade</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Score: {coverage.governance.complianceScore}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          coverage.governance.status === 'ok'
                            ? 'border-green-300 text-green-700'
                            : coverage.governance.status === 'attention'
                              ? 'border-yellow-300 text-yellow-700'
                              : 'border-red-300 text-red-700'
                        }`}
                      >
                        {coverage.governance.status === 'ok' ? 'OK' : coverage.governance.status === 'attention' ? 'Atenção' : 'Crítico'}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="rounded border bg-white dark:bg-gray-800 p-2">
                      <p className="text-gray-500">Cobertura fornecedor</p>
                      <p className="font-semibold">{coverage.governance.quality.supplierCoveragePct.toFixed(1)}%</p>
                    </div>
                    <div className="rounded border bg-white dark:bg-gray-800 p-2">
                      <p className="text-gray-500">Cobertura CATMAT/CATSER</p>
                      <p className="font-semibold">{coverage.governance.quality.catalogCoveragePct.toFixed(1)}%</p>
                    </div>
                    <div className="rounded border bg-white dark:bg-gray-800 p-2">
                      <p className="text-gray-500">Itens inferidos</p>
                      <p className="font-semibold">{coverage.governance.quality.inferredCoveragePct.toFixed(1)}%</p>
                    </div>
                    <div className="rounded border bg-white dark:bg-gray-800 p-2">
                      <p className="text-gray-500">Itens técnicos</p>
                      <p className="font-semibold">{coverage.governance.quality.technicalCoveragePct.toFixed(1)}%</p>
                    </div>
                  </div>
                  {coverage.governance.riskFlags.length > 0 && (
                    <div className="rounded border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 p-2">
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Riscos detectados</p>
                      <ul className="text-xs text-yellow-800 dark:text-yellow-200 list-disc ml-4 mt-1">
                        {coverage.governance.riskFlags.map((risk) => (
                          <li key={risk}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fila de ingestão</span>
                <Button variant="outline" size="sm" onClick={loadIngestStatus} disabled={ingestLoading}>
                  {ingestLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                  Atualizar
                </Button>
              </div>

              {ingestStatus && (
                <div className="space-y-3">
                  {/* Queue */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Ativas', value: ingestStatus.queue.active, color: 'text-blue-600' },
                      { label: 'Aguardando', value: ingestStatus.queue.waiting, color: 'text-yellow-600' },
                      { label: 'Concluídas', value: ingestStatus.queue.completed, color: 'text-green-600' },
                      { label: 'Com Erro', value: ingestStatus.queue.failed, color: 'text-red-600' },
                    ].map((q) => (
                      <div key={q.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                        <p className={`text-lg font-bold ${q.color}`}>{q.value}</p>
                        <p className="text-xs text-gray-500">{q.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Última execução */}
                  {ingestStatus.lastRun && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        {ingestStatus.lastRun.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {ingestStatus.lastRun.status === 'running' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                        {ingestStatus.lastRun.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                        <span className="font-medium">Última execução: {ingestStatus.lastRun.status === 'completed' ? 'Concluída' : ingestStatus.lastRun.status === 'running' ? 'Em andamento' : 'Com falha'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span>Iniciada: {new Date(ingestStatus.lastRun.startedAt).toLocaleString('pt-BR')}</span>
                        <span>Ingeridos: <strong className="text-green-600">{ingestStatus.lastRun.itemsIngested.toLocaleString()}</strong></span>
                        <span>Erros: <strong className={ingestStatus.lastRun.errors > 0 ? 'text-red-600' : ''}>{ingestStatus.lastRun.errors}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!ingestStatus && !ingestLoading && (
                <p className="text-sm text-gray-400 italic">Clique em "Atualizar" para ver o status atual.</p>
              )}

              {/* Botões de ingestão por fonte */}
              <div>
                <p className="text-sm font-medium mb-2">Disparar ingestão manual</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                  <div className="md:col-span-1">
                    <Label className="text-xs text-gray-500 mb-1 block">Janela histórica (dias)</Label>
                    <Input
                      type="number"
                      min={30}
                      max={3650}
                      step={30}
                      value={ingestSinceDays}
                      onChange={(e) => setIngestSinceDays(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="1825"
                      disabled={ingestTriggering !== null}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <p className="text-xs text-gray-500">
                      Recomendado: 1825 dias (5 anos) para carga ampla.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleTriggerIngest()}
                    disabled={ingestTriggering !== null}
                    className="bg-gray-800 hover:bg-gray-700"
                  >
                    {ingestTriggering === 'all' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                    Todas as fontes
                  </Button>
                  {SOURCES.map((src) => (
                    <Button
                      key={src.value}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTriggerIngest(src.value)}
                      disabled={ingestTriggering !== null}
                      className="text-xs"
                    >
                      {ingestTriggering === src.value ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                      {src.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
                  A ingestão de dados é executada automaticamente todo dia às 02:00. Use o disparo manual apenas para atualização imediata ou quando não houver dados na pesquisa.
                  O processamento inicial pode levar 15–30 minutos dependendo do volume de dados.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Formulário de busca */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Campo principal + CATMAT */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setCatmatSelected(null); }}
                  placeholder="Ex: computador desktop i5, serviço de limpeza, papel A4..."
                  className="text-base pr-10"
                  disabled={loading}
                />
                {/* CATMAT autocomplete input separado */}
              </div>
              <Button type="submit" disabled={loading || !query.trim()} className="min-w-[120px]">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>

            {/* CATMAT autocomplete */}
            <div className="relative">
              <Label className="text-xs text-gray-500 mb-1 block">Busca por código CATMAT/CATSER (opcional)</Label>
              <div className="relative">
                <Input
                  value={catmatQuery}
                  onChange={(e) => handleCatmatInput(e.target.value)}
                  placeholder="Digite para buscar no catálogo CATMAT/CATSER federal..."
                  className="h-8 text-sm pr-8"
                  disabled={loading}
                />
                {catmatLoading && (
                  <RefreshCw className="absolute right-2 top-2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              {catmatResults.length > 0 && (
                <div className="absolute z-20 w-full bg-white dark:bg-gray-900 border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {catmatResults.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-start gap-2 border-b last:border-0"
                      onClick={() => selectCatmat(item)}
                    >
                      <Badge variant="outline" className="text-xs shrink-0 mt-0.5">
                        {item.code}
                      </Badge>
                      <div>
                        <p className="font-medium line-clamp-1">{item.description}</p>
                        {item.groupDescription && (
                          <p className="text-xs text-gray-500">{item.groupDescription}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {catmatSelected && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  CATMAT {catmatSelected.code} selecionado — pesquisa usando descrição padronizada
                </p>
              )}
            </div>

            {/* Toggle filtros */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showFilters ? 'Ocultar filtros' : 'Filtros avançados'}
            </button>

            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-2 border-t">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Fonte</Label>
                  <Select value={filterSource} onValueChange={setFilterSource}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Estado (UF)</Label>
                  <Select value={filterUf} onValueChange={setFilterUf}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Unidade</Label>
                  <Input
                    value={filterUnit}
                    onChange={(e) => setFilterUnit(e.target.value)}
                    placeholder="un, mês, kg..."
                    className="h-8 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Preço mínimo (R$)</Label>
                  <Input
                    type="number"
                    value={filterMinPrice}
                    onChange={(e) => setFilterMinPrice(e.target.value)}
                    placeholder="0,00"
                    className="h-8 text-sm"
                    min="0"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Preço máximo (R$)</Label>
                  <Input
                    type="number"
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                    placeholder="999999,00"
                    className="h-8 text-sm"
                    min="0"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Período: de</Label>
                  <Input
                    type="date"
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Período: até</Label>
                  <Input
                    type="date"
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Resultados */}
      {result && (
        <div className="space-y-4">
          {/* Barra de resumo + ações */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>{result.total.toLocaleString('pt-BR')}</strong> resultado(s) para{' '}
                <strong>"{result.query}"</strong>
                {result.durationMs && (
                  <span className="text-xs ml-2 text-gray-400 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {result.durationMs}ms
                  </span>
                )}
              </p>
              {result.aggregations.avgConfidence != null && (
                <p className={`text-xs mt-0.5 ${confidenceColor(result.aggregations.avgConfidence)}`}>
                  Confiabilidade média: {formatConfidence(result.aggregations.avgConfidence)} ({Math.round(result.aggregations.avgConfidence * 100)}%)
                </p>
              )}
              {result.explanation.filters.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {result.explanation.filters.map((f, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportXlsx}
                disabled={xlsxLoading || result.items.length === 0}
              >
                {xlsxLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <FileDown className="w-4 h-4 mr-1" />}
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadReport('pdf')}
                disabled={reportLoading}
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadReport('pdf', true)}
                disabled={reportLoading}
                title="Gerar PDF com Termo de Referência (IN SEGES/ME 65/2021)"
              >
                <ScrollText className="w-4 h-4 mr-1" />
                PDF + TR
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadReport('html')}
                disabled={reportLoading}
              >
                <FileText className="w-4 h-4 mr-1" />
                HTML
              </Button>
            </div>
          </div>

          {/* Distribuição por fonte */}
          {result.aggregations.bySource.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {result.aggregations.bySource.map((src) => {
                const badge = getSourceBadge(src.key);
                return (
                  <span
                    key={src.key}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${badge.color}`}
                  >
                    <Layers className="w-3 h-3" />
                    {badge.label}: {src.count.toLocaleString('pt-BR')}
                  </span>
                );
              })}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="estatisticas">
                <BarChart2 className="w-4 h-4 mr-1" />
                Estatísticas
              </TabsTrigger>
              <TabsTrigger value="resultados">
                <Search className="w-4 h-4 mr-1" />
                Contratos ({result.items.length})
              </TabsTrigger>
              <TabsTrigger value="evolucao">
                <TrendingUp className="w-4 h-4 mr-1" />
                Evolução
              </TabsTrigger>
              <TabsTrigger value="fornecedores">
                <Users className="w-4 h-4 mr-1" />
                Fornecedores
              </TabsTrigger>
              <TabsTrigger value="metodologia">
                <FileText className="w-4 h-4 mr-1" />
                Metodologia
              </TabsTrigger>
            </TabsList>

            {/* ABA: ESTATÍSTICAS */}
            <TabsContent value="estatisticas">
              {result.statistics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                      <CardContent className="pt-4 pb-4 text-center">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Preço Médio</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                          {formatCurrency(result.statistics.mean)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-800">
                      <CardContent className="pt-4 pb-4 text-center">
                        <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Mediana</p>
                        <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
                          {formatCurrency(result.statistics.median)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4 text-center">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Menor Preço</p>
                        <p className="text-2xl font-bold mt-1 text-green-700">{formatCurrency(result.statistics.min)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4 text-center">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Maior Preço</p>
                        <p className="text-2xl font-bold mt-1 text-red-700">{formatCurrency(result.statistics.max)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quartis e desvio */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Distribuição Estatística</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center text-sm mb-4">
                        <div>
                          <p className="text-gray-500 text-xs">Q1 (25%)</p>
                          <p className="font-semibold">{formatCurrency(result.statistics.q1)}</p>
                        </div>
                        <div className="border-x border-gray-200">
                          <p className="text-gray-500 text-xs">IQR</p>
                          <p className="font-semibold">{formatCurrency(result.statistics.iqr)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Q3 (75%)</p>
                          <p className="font-semibold">{formatCurrency(result.statistics.q3)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Desvio padrão</p>
                          <p className="font-semibold">{formatCurrency(result.statistics.stdDev)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Fence inferior</p>
                          <p className="font-semibold">{formatCurrency(result.statistics.lowerFence)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Fence superior</p>
                          <p className="font-semibold">{formatCurrency(result.statistics.upperFence)}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between text-sm text-gray-500 flex-wrap gap-2">
                        <span>{result.statistics.count} contratos analisados</span>
                        <span>{result.statistics.excludedCount} outliers removidos</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Por UF + Modalidade */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.aggregations.byUf.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> Por Estado (UF)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-2">
                            {result.aggregations.byUf.slice(0, 12).map((item) => (
                              <div key={item.key} className="flex justify-between bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 text-sm">
                                <span className="font-medium text-blue-600">{item.key}</span>
                                <span className="text-gray-500">{item.count}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {result.aggregations.byModality && result.aggregations.byModality.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-1">
                            <Building2 className="w-4 h-4" /> Por Modalidade
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {result.aggregations.byModality.slice(0, 6).map((item) => (
                              <div key={item.key} className="flex items-center gap-2 text-sm">
                                <div className="flex-1 truncate text-gray-600 dark:text-gray-400 text-xs">{item.key || 'Não informado'}</div>
                                <span className="text-gray-500 shrink-0">{item.count}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Dados insuficientes</AlertTitle>
                  <AlertDescription>
                    Não há dados suficientes para calcular estatísticas. Tente ampliar o período ou usar termos mais gerais.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* ABA: CONTRATOS */}
            <TabsContent value="resultados">
              <div className="overflow-auto rounded-lg border">
                <table className="w-full min-w-full table-fixed text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-3 py-3 font-medium text-gray-600 dark:text-gray-400">Fonte</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-600 dark:text-gray-400">Descrição</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-600 dark:text-gray-400">Unid.</th>
                      <th className="text-right px-3 py-3 font-medium text-gray-600 dark:text-gray-400">Valor Unit.</th>
                      <th className="text-right px-3 py-3 font-medium text-gray-600 dark:text-gray-400">Qtd.</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-600 dark:text-gray-400">Data</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-600 dark:text-gray-400">UF</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-600 dark:text-gray-400">Órgão</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-600 dark:text-gray-400">Conf.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item, i) => {
                      const badge = getSourceBadge(item.source);
                      return (
                        <tr key={item.id} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                          <td className="px-3 py-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <p className="max-w-[22rem] whitespace-normal break-words text-xs leading-snug">
                              {item.description}
                            </p>
                          </td>
                          <td className="px-3 py-2 text-gray-500 text-xs">{item.unit ?? '-'}</td>
                          <td className="px-3 py-2 text-right font-semibold text-green-700 text-sm">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-500 text-xs">{item.quantity ?? '-'}</td>
                          <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{formatDate(item.contractDate)}</td>
                          <td className="px-3 py-2">
                            {item.uf ? <Badge variant="outline" className="text-xs">{item.uf}</Badge> : '-'}
                          </td>
                          <td className="px-3 py-2 align-top text-gray-500 text-xs">
                            <p className="max-w-[18rem] whitespace-normal break-words leading-snug">
                              {item.organizationName ?? '-'}
                            </p>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1 min-w-[60px]">
                              <Progress
                                value={Math.round(item.confidenceScore * 100)}
                                className="h-1.5 w-12"
                              />
                              <span className={`text-xs ${confidenceColor(item.confidenceScore)}`}>
                                {Math.round(item.confidenceScore * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {result.total > result.items.length && (
                <p className="text-center text-sm text-gray-400 mt-3">
                  Exibindo {result.items.length} de {result.total.toLocaleString('pt-BR')} resultados.
                </p>
              )}
            </TabsContent>

            {/* ABA: EVOLUÇÃO DE PREÇO */}
            <TabsContent value="evolucao">
              {result.aggregations.overTime.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Evolução de Preço ao Longo do Tempo
                    </CardTitle>
                    <CardDescription>Preço médio mensal — últimos 24 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Tabela de evolução (recharts não é obrigatório — tabela é suficiente e sem dep extra) */}
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">Mês</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600">Preço Médio</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600">Mínimo</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600">Máximo</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600">Contratos</th>
                            <th className="px-3 py-2 font-medium text-gray-600">Variação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.aggregations.overTime.map((entry, i) => {
                            const prev = result.aggregations.overTime[i - 1];
                            const variation = prev?.avgPrice && entry.avgPrice
                              ? ((entry.avgPrice - prev.avgPrice) / prev.avgPrice) * 100
                              : null;
                            return (
                              <tr key={entry.date} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                                <td className="px-3 py-2 font-medium">
                                  {new Date(entry.date + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-blue-700">
                                  {formatCurrency(entry.avgPrice)}
                                </td>
                                <td className="px-3 py-2 text-right text-green-700">
                                  {formatCurrency(entry.minPrice ?? null)}
                                </td>
                                <td className="px-3 py-2 text-right text-red-700">
                                  {formatCurrency(entry.maxPrice ?? null)}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-500">{entry.count}</td>
                                <td className="px-3 py-2">
                                  {variation != null ? (
                                    <span className={`text-xs font-medium ${variation > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
                                    </span>
                                  ) : <span className="text-gray-400 text-xs">—</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Sem dados temporais</AlertTitle>
                  <AlertDescription>Nenhum dado de evolução de preço disponível para este item.</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* ABA: FORNECEDORES */}
            <TabsContent value="fornecedores">
              {suppliersLoading ? (
                <div className="text-center py-12 text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Carregando mapa de fornecedores...
                </div>
              ) : supplierMap && supplierMap.suppliers.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {supplierMap.total} fornecedor(es) encontrado(s)
                    </p>
                    <Button variant="outline" size="sm" onClick={handleLoadSuppliers}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Atualizar
                    </Button>
                  </div>
                  <div className="overflow-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="text-left px-3 py-3 font-medium text-gray-600">Fornecedor</th>
                          <th className="text-left px-3 py-3 font-medium text-gray-600">CNPJ</th>
                          <th className="text-right px-3 py-3 font-medium text-gray-600">Contratos</th>
                          <th className="text-right px-3 py-3 font-medium text-gray-600">Preço Médio</th>
                          <th className="text-right px-3 py-3 font-medium text-gray-600">Mínimo</th>
                          <th className="text-right px-3 py-3 font-medium text-gray-600">Máximo</th>
                          <th className="text-left px-3 py-3 font-medium text-gray-600">Última Venda</th>
                          <th className="text-left px-3 py-3 font-medium text-gray-600">Estados</th>
                          <th className="text-left px-3 py-3 font-medium text-gray-600">Fontes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplierMap.suppliers.map((sup, i) => (
                          <tr key={`${sup.supplierCnpj}-${i}`} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                            <td className="px-3 py-2 align-top font-medium text-xs">
                              <p className="max-w-[20rem] whitespace-normal break-words leading-snug">{sup.supplierName || '—'}</p>
                            </td>
                            <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{sup.supplierCnpj ?? '—'}</td>
                            <td className="px-3 py-2 text-right font-semibold">{sup.contractCount}</td>
                            <td className="px-3 py-2 text-right text-blue-700 font-semibold">{formatCurrency(sup.avgPrice)}</td>
                            <td className="px-3 py-2 text-right text-green-700">{formatCurrency(sup.minPrice)}</td>
                            <td className="px-3 py-2 text-right text-red-700">{formatCurrency(sup.maxPrice)}</td>
                            <td className="px-3 py-2 text-gray-500 text-xs">{formatDate(sup.lastSeen)}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-0.5">
                                {sup.ufs.slice(0, 4).map((uf) => (
                                  <Badge key={uf} variant="outline" className="text-xs px-1 py-0">{uf}</Badge>
                                ))}
                                {sup.ufs.length > 4 && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0">+{sup.ufs.length - 4}</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-0.5">
                                {sup.sources.map((src) => {
                                  const b = getSourceBadge(src);
                                  return (
                                    <span key={src} className={`text-xs px-1 py-0 rounded border ${b.color}`}>
                                      {b.label}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : supplierMap ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Nenhum fornecedor encontrado</AlertTitle>
                  <AlertDescription>Não há dados de fornecedores para este item.</AlertDescription>
                </Alert>
              ) : null}
            </TabsContent>

            {/* ABA: METODOLOGIA */}
            <TabsContent value="metodologia">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Metodologia de Pesquisa</CardTitle>
                  <CardDescription>
                    Conformidade com Lei 14.133/2021 e IN SEGES/ME 65/2021
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Tratamento de Outliers</p>
                    <p>{result.explanation.methodology}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Período analisado</p>
                      <p className="font-medium text-xs">{result.explanation.period.from} a {result.explanation.period.to}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Versão do algoritmo</p>
                      <p className="font-medium">v{result.explanation.algorithmVersion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tempo de resposta</p>
                      <p className="font-medium">{result.durationMs}ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Fontes ativas</p>
                      <p className="font-medium">{result.aggregations.bySource.length} fonte(s)</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="font-medium mb-2 text-sm">Fontes de dados utilizadas</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {SOURCES.map((src) => (
                        <div key={src.value} className={`flex items-start gap-2 p-2 rounded border ${src.color}`}>
                          <Database className="w-3 h-3 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold">{src.label}</p>
                            <p className="opacity-75">
                              {src.value === 'pncp' && 'Portal Nacional de Contratações Públicas (pós-2021)'}
                              {src.value === 'comprasnet' && 'SIASG/ComprasNet histórico (2015–2021)'}
                              {src.value === 'transparencia' && 'Portal da Transparência — contratos federais'}
                              {src.value === 'bps' && 'Banco de Preços em Saúde — insumos hospitalares'}
                              {src.value === 'fnde' && 'FNDE — educação, merenda e transporte escolar'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <p className="text-xs text-gray-500">
                    <strong>Aviso legal:</strong> Os valores apresentados são referências históricas de contratos públicos e não constituem cotações formais.
                    O gestor público é responsável pela validação técnica e jurídica das estimativas conforme a Lei 14.133/2021 e IN SEGES/ME 65/2021.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Estado inicial */}
      {!result && !loading && (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Pesquise por um item ou serviço</p>
            <p className="text-gray-400 text-sm mt-2 mb-6">
              Ex: "computador desktop i5", "serviço de limpeza", "papel A4 resma", "paracetamol"
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              {SOURCES.map((src) => (
                <span key={src.value} className={`text-xs px-2 py-1 rounded-full border font-medium ${src.color} inline-flex items-center gap-1`}>
                  <Database className="w-3 h-3" />
                  {src.label}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">5 fontes públicas integradas</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
