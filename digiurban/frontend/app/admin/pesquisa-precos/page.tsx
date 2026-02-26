'use client';

import { useState } from 'react';
import { Search, Download, FileText, BarChart2, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { pricesClient, PriceSearchResponse, PriceSearchFilters, PriceSearchPeriod } from '@/lib/prices-client';
import { useToast } from '@/hooks/use-toast';

const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

export default function PesquisaPrecos() {
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [result, setResult] = useState<PriceSearchResponse | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [filterUf, setFilterUf] = useState<string>('');
  const [filterUnit, setFilterUnit] = useState<string>('');
  const [filterMinPrice, setFilterMinPrice] = useState<string>('');
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>('');
  const [periodFrom, setPeriodFrom] = useState<string>('');
  const [periodTo, setPeriodTo] = useState<string>('');

  function buildFilters(): PriceSearchFilters {
    const f: PriceSearchFilters = {};
    if (filterUf) f.uf = filterUf;
    if (filterUnit) f.unit = filterUnit;
    if (filterMinPrice) f.minPrice = parseFloat(filterMinPrice);
    if (filterMaxPrice) f.maxPrice = parseFloat(filterMaxPrice);
    return f;
  }

  function buildPeriod(): PriceSearchPeriod | undefined {
    if (!periodFrom && !periodTo) return undefined;
    return {
      from: periodFrom || undefined,
      to: periodTo || undefined,
    };
  }

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await pricesClient.search({
        query: query.trim(),
        filters: buildFilters(),
        period: buildPeriod(),
        page: 1,
        page_size: 20,
      });
      setResult(data);
    } catch (err: unknown) {
      toast({
        title: 'Erro na pesquisa',
        description: 'Não foi possível realizar a pesquisa. Verifique se o módulo está disponível.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadReport(format: 'pdf' | 'html') {
    if (!query.trim()) return;
    setReportLoading(true);

    try {
      await pricesClient.downloadReport({
        query: query.trim(),
        filters: buildFilters(),
        period: buildPeriod(),
        format,
      });
      toast({
        title: 'Relatório gerado!',
        description: `Relatório ${format.toUpperCase()} baixado com sucesso.`,
      });
    } catch {
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Não foi possível gerar o relatório. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setReportLoading(false);
    }
  }

  function formatCurrency(value: number | null | undefined): string {
    if (value == null) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Search className="w-7 h-7 text-blue-600" />
          Pesquisa de Preços Públicos
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Consulte preços praticados em contratos públicos dos últimos 12 meses — base PNCP
        </p>
      </div>

      {/* Formulário de busca */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: computador desktop i5, serviço de limpeza, papel A4..."
                className="flex-1 text-base"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !query.trim()} className="min-w-[120px]">
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2 border-t">
                {/* UF */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Estado (UF)</Label>
                  <Select value={filterUf} onValueChange={setFilterUf}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {UFS.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Unidade */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Unidade</Label>
                  <Input
                    value={filterUnit}
                    onChange={(e) => setFilterUnit(e.target.value)}
                    placeholder="Ex: un, mês, kg..."
                    className="h-8 text-sm"
                  />
                </div>

                {/* Preço mínimo */}
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

                {/* Preço máximo */}
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

                {/* Período de */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Período: de</Label>
                  <Input
                    type="date"
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                {/* Período até */}
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
        <div className="space-y-6">
          {/* Resumo + botões de relatório */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-gray-500">
                {result.total} resultado(s) para <strong>"{result.query}"</strong>
                {result.normalizedQuery !== result.query && (
                  <span className="text-xs ml-2 text-gray-400">
                    (normalizado: {result.normalizedQuery})
                  </span>
                )}
              </p>
              {result.explanation.filters.length > 0 && (
                <div className="flex gap-2 mt-1 flex-wrap">
                  {result.explanation.filters.map((f, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
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
                onClick={() => handleDownloadReport('html')}
                disabled={reportLoading}
              >
                <FileText className="w-4 h-4 mr-1" />
                HTML
              </Button>
            </div>
          </div>

          <Tabs defaultValue="estatisticas">
            <TabsList className="mb-4">
              <TabsTrigger value="estatisticas">
                <BarChart2 className="w-4 h-4 mr-1" />
                Estatísticas
              </TabsTrigger>
              <TabsTrigger value="resultados">
                <Search className="w-4 h-4 mr-1" />
                Contratos ({result.items.length})
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
                  {/* Cards principais */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                      <CardContent className="pt-4 pb-4 text-center">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Preço Médio</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                          {formatCurrency(result.statistics.mean)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4 text-center">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Mediana</p>
                        <p className="text-2xl font-bold mt-1">{formatCurrency(result.statistics.median)}</p>
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

                  {/* Quartis */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Distribuição (Quartis)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
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
                      </div>

                      <Separator className="my-3" />

                      <div className="flex justify-between text-sm text-gray-500">
                        <span>
                          {result.statistics.count} contratos analisados
                        </span>
                        <span>
                          {result.statistics.excludedCount} outliers removidos
                        </span>
                        <span>
                          Desvio padrão: {formatCurrency(result.statistics.stdDev)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Distribuição por UF */}
                  {result.aggregations.byUf.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Por Estado (UF)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
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
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Dados insuficientes</AlertTitle>
                  <AlertDescription>
                    Não há dados suficientes para calcular estatísticas para esta pesquisa.
                    Tente ampliar o período ou usar termos de busca mais gerais.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* ABA: CONTRATOS */}
            <TabsContent value="resultados">
              <div className="overflow-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Descrição</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Unid.</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Valor Unit.</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Qtd.</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Data</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">UF</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Órgão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item, i) => (
                      <tr key={item.id} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="line-clamp-2">{item.description}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{item.unit ?? '-'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {item.quantity ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDate(item.contractDate)}
                        </td>
                        <td className="px-4 py-3">
                          {item.uf ? (
                            <Badge variant="outline" className="text-xs">{item.uf}</Badge>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                          <p className="line-clamp-1">{item.organizationName ?? '-'}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result.total > result.items.length && (
                <p className="text-center text-sm text-gray-400 mt-3">
                  Exibindo {result.items.length} de {result.total} resultados. Use os filtros para refinar.
                </p>
              )}
            </TabsContent>

            {/* ABA: METODOLOGIA */}
            <TabsContent value="metodologia">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Metodologia de Pesquisa</CardTitle>
                  <CardDescription>
                    Informações técnicas sobre como os preços foram calculados — conformidade com Lei 14.133/2021
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Tratamento de Outliers</p>
                    <p>{result.explanation.methodology}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Período analisado</p>
                      <p className="font-medium">
                        {result.explanation.period.from} a {result.explanation.period.to}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Versão do algoritmo</p>
                      <p className="font-medium">v{result.explanation.algorithmVersion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Base de dados</p>
                      <p className="font-medium">PNCP — Portal Nacional de Contratações Públicas</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tempo de resposta</p>
                      <p className="font-medium">{result.durationMs}ms</p>
                    </div>
                  </div>

                  <Separator />

                  <p className="text-xs text-gray-500">
                    <strong>Aviso legal:</strong> Os valores apresentados são referências históricas de contratos públicos e não constituem cotações formais.
                    O gestor público é responsável pela validação técnica e jurídica das estimativas conforme a Lei 14.133/2021.
                    Fonte: PNCP (Portal Nacional de Contratações Públicas).
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
            <p className="text-gray-400 text-sm mt-2">
              Ex: "computador desktop i5", "serviço de limpeza", "papel A4 resma"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
