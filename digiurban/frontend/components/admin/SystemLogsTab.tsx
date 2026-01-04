'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Search,
  Filter,
  RefreshCw,
  Terminal,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Globe,
  Calendar,
  Database,
  Activity,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';

interface LogFile {
  fileName: string;
  type: string;
  date: string | null;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  modifiedAt: string;
  path: string;
}

interface LogLine {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
  stack?: string;
  _lineNumber?: number;
}

interface LogStats {
  errors: number;
  warnings: number;
  info: number;
  debug: number;
  httpRequests: number;
  totalLogs: number;
  avgResponseTime: number;
  timeRange: {
    start: string;
    end: string;
  };
}

export default function SystemLogsTab() {
  const [loading, setLoading] = useState(true);
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<LogFile | null>(null);
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    loadLogFiles();
    loadStats();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      loadLogContent();
    }
  }, [selectedFile, searchTerm, filterLevel, offset]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadLogFiles();
      loadStats();
      if (selectedFile) {
        loadLogContent();
      }
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [autoRefresh, selectedFile]);

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadLogFiles = async () => {
    try {
      const response = await fetch('/api/super-admin/system-logs');
      if (response.ok) {
        const data = await response.json();
        setLogFiles(data.data?.logs || []);

        // Selecionar arquivo combined mais recente por padrão
        if (!selectedFile && data.data?.logs?.length > 0) {
          const combinedFile = data.data.logs.find((f: LogFile) => f.type === 'combined');
          if (combinedFile) {
            setSelectedFile(combinedFile);
          } else {
            setSelectedFile(data.data.logs[0]);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos de log:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogContent = async () => {
    if (!selectedFile) return;

    try {
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: '100',
        reverse: 'true'
      });

      if (filterLevel !== 'all') {
        params.append('level', filterLevel);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/super-admin/system-logs/${selectedFile.fileName}?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();

        if (offset === 0) {
          setLogLines(data.data?.lines || []);
        } else {
          setLogLines(prev => [...prev, ...(data.data?.lines || [])]);
        }

        setHasMore(data.data?.hasMore || false);
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdo do log:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/super-admin/system-logs/stats?dateRange=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleDownload = async () => {
    if (!selectedFile) return;

    try {
      const response = await fetch(`/api/super-admin/system-logs/${selectedFile.fileName}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedFile.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao fazer download:', error);
    }
  };

  const toggleStreaming = () => {
    if (!selectedFile) return;

    if (streaming) {
      // Parar streaming
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setStreaming(false);
    } else {
      // Iniciar streaming
      const eventSource = new EventSource(`/api/super-admin/system-logs/${selectedFile.fileName}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const newLog = JSON.parse(event.data);

          if (newLog.type === 'connected') {
            console.log('Streaming conectado:', newLog.fileName);
          } else {
            setLogLines(prev => [newLog, ...prev]);
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        } catch (error) {
          console.error('Erro ao processar log do stream:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Erro no streaming:', error);
        eventSource.close();
        setStreaming(false);
      };

      eventSourceRef.current = eventSource;
      setStreaming(true);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-gray-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warn':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'debug':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'combined':
        return <Database className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'http':
        return <Globe className="w-4 h-4" />;
      case 'exceptions':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const loadMore = () => {
    setOffset(prev => prev + 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="ml-3 text-gray-600">Carregando logs do sistema...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-gray-600">Erros</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-gray-600">Avisos</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.warnings}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-gray-600">Info</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="w-4 h-4 text-gray-600" />
              <p className="text-sm text-gray-600">Debug</p>
            </div>
            <p className="text-2xl font-bold text-gray-600">{stats.debug}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <p className="text-sm text-gray-600">HTTP Requests</p>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{stats.httpRequests}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-green-600" />
              <p className="text-sm text-gray-600">Avg Response</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.avgResponseTime}ms</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <p className="text-sm text-gray-600">Total Logs</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.totalLogs}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* File Selector */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arquivo de Log
            </label>
            <select
              value={selectedFile?.fileName || ''}
              onChange={(e) => {
                const file = logFiles.find(f => f.fileName === e.target.value);
                setSelectedFile(file || null);
                setOffset(0);
                setLogLines([]);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {logFiles.map(file => (
                <option key={file.fileName} value={file.fileName}>
                  {getTypeIcon(file.type)} {file.type} - {file.date} ({file.sizeFormatted})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range for Stats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período (Stats)
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="1h">Última 1 hora</option>
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 dias</option>
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nível
            </label>
            <select
              value={filterLevel}
              onChange={(e) => {
                setFilterLevel(e.target.value);
                setOffset(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="error">Error</option>
              <option value="warn">Warn</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setOffset(0);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => {
              setOffset(0);
              loadLogContent();
              loadStats();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>

          <button
            onClick={handleDownload}
            disabled={!selectedFile}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          <button
            onClick={toggleStreaming}
            disabled={!selectedFile}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              streaming
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50`}
          >
            <Activity className={`w-4 h-4 ${streaming ? 'animate-pulse' : ''}`} />
            {streaming ? 'Parar Stream' : 'Iniciar Stream'}
          </button>

          <label className="flex items-center gap-2 text-sm text-gray-600 ml-auto">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto-refresh (10s)
          </label>
        </div>
      </div>

      {/* Log Viewer */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">
                {selectedFile?.fileName || 'Nenhum arquivo selecionado'}
              </h3>
            </div>
            <span className="text-sm text-gray-600">
              {logLines.length} logs exibidos
            </span>
          </div>
        </div>

        <div className="p-4 max-h-[600px] overflow-y-auto font-mono text-sm">
          {logLines.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logLines.map((line, index) => (
                <div
                  key={`${line._lineNumber}-${index}`}
                  className={`p-3 rounded-lg border ${getLevelColor(line.level)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getLevelIcon(line.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(line.timestamp)}
                        </span>
                        <span className={`text-xs font-semibold uppercase ${
                          line.level === 'error' ? 'text-red-700' :
                          line.level === 'warn' ? 'text-yellow-700' :
                          line.level === 'info' ? 'text-blue-700' :
                          'text-gray-700'
                        }`}>
                          {line.level}
                        </span>
                      </div>
                      <p className="text-gray-900 break-words">{line.message}</p>

                      {line.stack && (
                        <pre className="mt-2 p-2 bg-red-50 rounded text-xs text-red-900 overflow-x-auto">
                          {line.stack}
                        </pre>
                      )}

                      {line.meta && Object.keys(line.meta).length > 2 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                            Ver metadata
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(line.meta, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={loadMore}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Carregar mais logs
                  </button>
                </div>
              )}

              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Sobre os System Logs</h3>
            <p className="text-blue-700 text-sm mt-1">
              Os logs do sistema são gerados automaticamente pelo Winston e incluem erros, avisos,
              requisições HTTP e eventos da aplicação. Logs são mantidos por 3-7 dias dependendo do tipo.
              Use o streaming em tempo real para monitorar eventos conforme acontecem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
