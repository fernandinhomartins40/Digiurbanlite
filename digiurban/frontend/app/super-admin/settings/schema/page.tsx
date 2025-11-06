'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  Table,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  Lock,
  Shield
} from 'lucide-react';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';

interface DatabaseInfo {
  type: string;
  version: string;
  totalTables: number;
  totalRecords: number;
  databaseSize: string;
  lastBackup: string;
}

interface TableInfo {
  name: string;
  recordCount: number;
  size: string;
  lastModified: string;
  indexes: number;
  relations: string[];
}

interface Migration {
  id: string;
  name: string;
  timestamp: string;
  status: 'applied' | 'pending' | 'failed';
  executionTime: number;
  changes: string[];
}

export default function SchemaManagementPage() {
  const router = useRouter();
  const { apiRequest } = useSuperAdminAuth();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tables' | 'migrations'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [requireAuth, setRequireAuth] = useState(false);
  const [authPassword, setAuthPassword] = useState('');

  // Mock data - TODO: integrar com backend /api/super-admin/schema/*
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo>({
    type: 'PostgreSQL',
    version: '15.3',
    totalTables: 42,
    totalRecords: 1283456,
    databaseSize: '2.4 GB',
    lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  });

  const [tables, setTables] = useState<TableInfo[]>([
    {
      name: 'tenants',
      recordCount: 156,
      size: '12.3 MB',
      lastModified: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      indexes: 4,
      relations: ['users', 'departments', 'protocols']
    },
    {
      name: 'users',
      recordCount: 3421,
      size: '45.2 MB',
      lastModified: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      indexes: 6,
      relations: ['tenants', 'protocols', 'notifications']
    },
    {
      name: 'protocols',
      recordCount: 28934,
      size: '156.7 MB',
      lastModified: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      indexes: 8,
      relations: ['tenants', 'users', 'departments', 'services']
    },
    {
      name: 'citizens',
      recordCount: 45678,
      size: '234.5 MB',
      lastModified: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      indexes: 7,
      relations: ['protocols', 'notifications', 'documents']
    },
    {
      name: 'departments',
      recordCount: 523,
      size: '8.9 MB',
      lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      indexes: 3,
      relations: ['tenants', 'users', 'protocols']
    },
    {
      name: 'services',
      recordCount: 892,
      size: '15.4 MB',
      lastModified: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      indexes: 5,
      relations: ['departments', 'protocols']
    },
    {
      name: 'notifications',
      recordCount: 156234,
      size: '89.3 MB',
      lastModified: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      indexes: 4,
      relations: ['users', 'citizens', 'protocols']
    },
    {
      name: 'documents',
      recordCount: 12453,
      size: '567.8 MB',
      lastModified: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      indexes: 5,
      relations: ['citizens', 'protocols']
    }
  ]);

  const [migrations, setMigrations] = useState<Migration[]>([
    {
      id: '20250103_001',
      name: 'add_citizen_family_relations',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'applied',
      executionTime: 234,
      changes: ['CREATE TABLE citizen_family_members', 'ADD INDEX idx_family_citizen_id', 'ADD FOREIGN KEY fk_family_citizen']
    },
    {
      id: '20241228_003',
      name: 'add_document_verification',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'applied',
      executionTime: 156,
      changes: ['ADD COLUMN verified_at TO documents', 'ADD COLUMN verification_status', 'CREATE INDEX idx_verification_status']
    },
    {
      id: '20241220_002',
      name: 'optimize_protocol_queries',
      timestamp: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'applied',
      executionTime: 4567,
      changes: ['CREATE INDEX idx_protocol_status_created', 'CREATE INDEX idx_protocol_tenant_department', 'ANALYZE TABLE protocols']
    },
    {
      id: '20241215_001',
      name: 'add_tenant_settings',
      timestamp: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'applied',
      executionTime: 89,
      changes: ['ADD COLUMN settings JSONB TO tenants', 'ADD COLUMN features_enabled', 'UPDATE tenants SET settings = \'{}\'']
    },
    {
      id: '20241210_004',
      name: 'add_notification_preferences',
      timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'applied',
      executionTime: 123,
      changes: ['CREATE TABLE notification_preferences', 'ADD INDEX idx_notif_user_id', 'INSERT DEFAULT preferences']
    }
  ]);

  useEffect(() => {
    loadSchemaData();
  }, [router]);

  const loadSchemaData = async () => {
    setLoading(true);
    try {
      // TODO: Substituir por chamada real à API
      // const response = await fetch('http://localhost:3001/api/super-admin/schema', {
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('digiurban_super_admin_token')}`
      //   }
      // });
      // const data = await response.json();
      // setDatabaseInfo(data.info);
      // setTables(data.tables);
      // setMigrations(data.migrations);

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Erro ao carregar dados do schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadSchemaData();
  };

  const handleViewTable = (tableName: string) => {
    if (expandedTable === tableName) {
      setExpandedTable(null);
    } else {
      setExpandedTable(tableName);
    }
  };

  const handleViewMigration = (migrationId: string) => {
    console.log('Visualizar detalhes da migration:', migrationId);
    // TODO: Abrir modal com detalhes completos da migration
  };

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando schema do banco de dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Database className="w-8 h-8 text-indigo-600" />
                Schema Management
              </h1>
              <p className="text-gray-600 mt-2">
                Explore e monitore a estrutura do banco de dados
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Security Warning */}
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Modo Somente Leitura</h3>
            <p className="text-red-700 text-sm mt-1">
              Esta interface permite apenas visualização do schema. Operações de DELETE, DROP ou ALTER não são permitidas por segurança.
              Use as migrations do Prisma para alterações no banco de dados.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setSelectedTab('tables')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedTab === 'tables'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4" />
                Tabelas ({tables.length})
              </div>
            </button>
            <button
              onClick={() => setSelectedTab('migrations')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedTab === 'migrations'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Migrations ({migrations.length})
              </div>
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Database Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações do Banco de Dados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tipo</p>
                  <p className="text-2xl font-bold text-gray-900">{databaseInfo.type}</p>
                  <p className="text-sm text-gray-500 mt-1">Versão {databaseInfo.version}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Tabelas</p>
                  <p className="text-2xl font-bold text-gray-900">{databaseInfo.totalTables}</p>
                  <p className="text-sm text-gray-500 mt-1">com {formatNumber(databaseInfo.totalRecords)} registros</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tamanho do Banco</p>
                  <p className="text-2xl font-bold text-gray-900">{databaseInfo.databaseSize}</p>
                  <p className="text-sm text-gray-500 mt-1">Último backup: {formatDate(databaseInfo.lastBackup)}</p>
                </div>
              </div>
            </div>

            {/* Top Tables by Size */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Maiores Tabelas</h2>
              <div className="space-y-3">
                {[...tables]
                  .sort((a, b) => parseFloat(b.size) - parseFloat(a.size))
                  .slice(0, 5)
                  .map((table) => (
                    <div key={table.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Table className="w-5 h-5 text-indigo-600" />
                        <div>
                          <p className="font-medium text-gray-900">{table.name}</p>
                          <p className="text-sm text-gray-600">{formatNumber(table.recordCount)} registros</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{table.size}</p>
                        <p className="text-xs text-gray-500">{table.indexes} índices</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Atividade Recente</h2>
              <div className="space-y-3">
                {[...tables]
                  .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
                  .slice(0, 5)
                  .map((table) => (
                    <div key={table.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">{table.name}</p>
                          <p className="text-sm text-gray-600">Modificado {formatDate(table.lastModified)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatNumber(table.recordCount)} registros</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Tables Tab */}
        {selectedTab === 'tables' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tabelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Tables List */}
            <div className="space-y-3">
              {filteredTables.map((table) => (
                <div key={table.name} className="bg-white rounded-lg border border-gray-200">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleViewTable(table.name)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {expandedTable === table.name ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <Table className="w-6 h-6 text-indigo-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{table.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatNumber(table.recordCount)} registros · {table.size} · {table.indexes} índices
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Modificado {formatDate(table.lastModified)}</p>
                    </div>
                  </div>

                  {expandedTable === table.name && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Estatísticas</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Registros:</span>
                              <span className="font-medium text-gray-900">{formatNumber(table.recordCount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tamanho:</span>
                              <span className="font-medium text-gray-900">{table.size}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Índices:</span>
                              <span className="font-medium text-gray-900">{table.indexes}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Última modificação:</span>
                              <span className="font-medium text-gray-900">{formatDate(table.lastModified)}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Relações</h3>
                          <div className="space-y-1">
                            {table.relations.length > 0 ? (
                              table.relations.map((relation) => (
                                <div key={relation} className="text-sm text-gray-600 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                  {relation}
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 italic">Nenhuma relação</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-blue-800">
                            Para visualizar o schema completo da tabela, use: <code className="bg-blue-100 px-2 py-0.5 rounded">npx prisma studio</code>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Migrations Tab */}
        {selectedTab === 'migrations' && (
          <div className="space-y-4">
            {migrations.map((migration) => (
              <div key={migration.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {migration.status === 'applied' && (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    {migration.status === 'pending' && (
                      <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    {migration.status === 'failed' && (
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{migration.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        ID: {migration.id} · {formatDate(migration.timestamp)} · {migration.executionTime}ms
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      migration.status === 'applied'
                        ? 'bg-green-100 text-green-800'
                        : migration.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {migration.status === 'applied' ? 'Aplicada' : migration.status === 'pending' ? 'Pendente' : 'Falhou'}
                  </span>
                </div>
                <div className="pl-8">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Alterações:</h4>
                  <div className="space-y-1">
                    {migration.changes.map((change, index) => (
                      <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{change}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
