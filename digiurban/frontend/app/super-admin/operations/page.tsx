'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Database,
  Download,
  Calendar,
  HardDrive,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface Backup {
  fileName: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

export default function OperationsPage() {
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/super-admin/system/backups');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/super-admin/system/backup', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Backup Criado',
          description: `Backup criado com sucesso: ${data.data.fileName}`
        });
        fetchBackups();
      } else {
        throw new Error('Erro ao criar backup');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o backup',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return mb.toFixed(2) + ' MB';
    }
    const gb = mb / 1024;
    return gb.toFixed(2) + ' GB';
  };

  const handleDownloadBackup = async (fileName: string) => {
    try {
      const response = await fetch(`/api/super-admin/system/backup/${fileName}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Download Iniciado',
          description: `Fazendo download de ${fileName}`
        });
      } else {
        throw new Error('Erro ao fazer download');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer o download do backup',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteBackup = async (fileName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o backup "${fileName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/super-admin/system/backup/${fileName}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Backup Deletado',
          description: `O backup ${fileName} foi removido com sucesso`
        });
        fetchBackups();
      } else {
        throw new Error('Erro ao deletar backup');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar o backup',
        variant: 'destructive'
      });
    }
  };

  const handleRestoreBackup = async (fileName: string) => {
    if (!confirm(`⚠️ ATENÇÃO: Restaurar o backup "${fileName}" irá SUBSTITUIR TODOS OS DADOS ATUAIS do banco de dados. Esta ação NÃO pode ser desfeita. Deseja continuar?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/super-admin/system/backup/${fileName}/restore`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Backup Restaurado',
          description: data.message || 'Banco de dados restaurado com sucesso'
        });
        // Recarregar a página após restauração
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao restaurar backup');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível restaurar o backup',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Operações do Sistema</h1>
        <p className="text-gray-600">Gerenciamento de backups e manutenção</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              Backup do Banco de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Crie um backup completo do banco de dados PostgreSQL. O arquivo será salvo no diretório de backups do servidor.
            </p>
            <Button
              onClick={handleCreateBackup}
              disabled={creating}
              className="w-full"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando Backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Criar Backup Agora
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              Manutenção do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Coloque o sistema em modo de manutenção para realizar atualizações críticas. Todos os usuários serão desconectados.
            </p>
            <Button variant="outline" className="w-full" disabled>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Modo Manutenção (Em Breve)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Backups Disponíveis</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {backups.length} backup{backups.length !== 1 ? 's' : ''} armazenado{backups.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={fetchBackups} variant="outline" size="sm">
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12">
              <Database size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Nenhum backup encontrado</p>
              <p className="text-sm text-gray-400 mt-1">Crie seu primeiro backup usando o botão acima</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Arquivo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tamanho</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Criado em</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {backups.map((backup, index) => (
                    <tr key={backup.fileName} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Database size={16} className="text-blue-600" />
                          <span className="font-mono text-sm">{backup.fileName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <HardDrive size={14} className="text-gray-400" />
                          <span className="text-sm">{formatBytes(backup.size)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm">
                            {new Date(backup.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                          <CheckCircle size={12} />
                          Disponível
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadBackup(backup.fileName)}
                            title="Baixar backup"
                          >
                            <Download size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreBackup(backup.fileName)}
                            title="Restaurar backup"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <RotateCcw size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteBackup(backup.fileName)}
                            title="Deletar backup"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Armazenamento de Backups</h3>
              <p className="text-sm text-blue-800 mb-2">
                Os backups são armazenados em volume Docker persistente e <strong>são mantidos mesmo após novos deploys</strong>.
                O volume está montado em <code className="px-1.5 py-0.5 bg-blue-100 rounded text-xs">/app/backups</code> no container backend.
              </p>
              <p className="text-sm text-blue-800">
                <strong>Recomendação:</strong> Faça download regular dos backups críticos e armazene-os em local seguro externo
                (cloud storage, servidor de arquivos, etc) para proteção adicional contra falhas de hardware.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
