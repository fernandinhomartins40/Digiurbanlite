'use client';

/**
 * Backups do banco (plataforma).
 * - "Criar backup" gera um backup COMPLETO (pg_dump de todas as tabelas de
 *   todos os municípios), baixável.
 * - Restaurar NÃO é feito pelo painel (o antigo apagava tabelas inteiras):
 *   a tela mostra o passo a passo de servidor.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Calendar, CheckCircle, Database, Download, HardDrive, Loader2, ShieldCheck, Trash2 } from 'lucide-react';

interface Backup {
  fileName: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  complete?: boolean;
}

const DEFAULT_RESTORE_STEPS = [
  'Restauração é feita no servidor, com o sistema em manutenção — nunca pelo painel.',
];

export default function OperationsPage() {
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [restoreSteps, setRestoreSteps] = useState<string[]>(DEFAULT_RESTORE_STEPS);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/platform/system/backups');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.data || []);
        if (Array.isArray(data.restoreInstructions)) setRestoreSteps(data.restoreInstructions);
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
      const response = await fetch('/api/platform/system/backup', { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.details || data.error || 'Erro ao criar backup');
      toast({ title: 'Backup criado', description: data.message || data.data?.fileName });
      fetchBackups();
    } catch (error: any) {
      toast({ title: 'Não foi possível criar o backup', description: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    const mb = bytes / (1024 * 1024);
    return mb < 1024 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(2)} GB`;
  };

  const handleDownloadBackup = async (fileName: string) => {
    try {
      const response = await fetch(`/api/platform/system/backup/${encodeURIComponent(fileName)}`);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível baixar o backup', variant: 'destructive' });
    }
  };

  const handleDeleteBackup = async (fileName: string) => {
    if (!confirm(`Excluir o backup "${fileName}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const response = await fetch(`/api/platform/system/backup/${encodeURIComponent(fileName)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      toast({ title: 'Backup excluído' });
      fetchBackups();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir o backup', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Backups do banco</h1>
        <p className="text-gray-600">Cópia completa de todos os municípios, para guardar fora do servidor</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              Criar backup completo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-600">
              Gera uma cópia de <strong>todas as tabelas de todos os municípios</strong> (formato PostgreSQL). Pode levar alguns
              minutos em bancos grandes. Baixe e guarde em local seguro.
            </p>
            <Button onClick={handleCreateBackup} disabled={creating} className="w-full">
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando backup…
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Criar backup agora
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-orange-600" />
              Como restaurar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-gray-600">
              Restaurar substitui os dados de <strong>todos</strong> os municípios, por isso é feito no servidor, por um técnico:
            </p>
            <ol className="space-y-1 text-xs text-gray-700">
              {restoreSteps.map((step) => (
                <li key={step} className="break-words font-mono">
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Backups guardados</CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                {backups.length} arquivo{backups.length !== 1 ? 's' : ''} no servidor
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
            <div className="py-12 text-center">
              <Database size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">Nenhum backup ainda</p>
              <p className="mt-1 text-sm text-gray-400">Crie o primeiro com o botão acima</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700">Arquivo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700">Tamanho</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700">Criado em</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700">Tipo</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {backups.map((backup) => (
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
                          <span className="text-sm">{new Date(backup.createdAt).toLocaleString('pt-BR')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {backup.complete ? (
                          <span className="flex w-fit items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                            <CheckCircle size={12} />
                            Completo
                          </span>
                        ) : (
                          <span
                            className="flex w-fit items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800"
                            title="Formato antigo: copiava só 12 tabelas. Não serve para restaurar o sistema."
                          >
                            <AlertTriangle size={12} />
                            Antigo (parcial)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleDownloadBackup(backup.fileName)} title="Baixar">
                            <Download size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteBackup(backup.fileName)}
                            title="Excluir"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
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

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <h3 className="mb-1 font-semibold text-blue-900">Onde ficam os backups</h3>
              <p className="text-sm text-blue-800">
                Num volume persistente do servidor (<code className="rounded bg-blue-100 px-1.5 py-0.5 text-xs">/app/backups</code>), mantido
                entre atualizações. Se o disco do servidor falhar, eles se perdem junto — por isso{' '}
                <strong>baixe regularmente e guarde fora do servidor</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
