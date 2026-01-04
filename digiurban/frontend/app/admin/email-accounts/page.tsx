'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Plus,
  UserCircle,
  Settings,
  Trash2,
  Key,
  BarChart3,
  CheckCircle,
  XCircle,
  Shield,
  Send
} from 'lucide-react';
import { CreateAccountModal } from '@/components/admin/email/CreateAccountModal';
import { CredentialsModal } from '@/components/admin/email/CredentialsModal';
import { EditAccountModal } from '@/components/admin/email/EditAccountModal';
import { UsageStatsModal } from '@/components/admin/email/UsageStatsModal';

interface EmailAccount {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  isAdmin: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  sentToday: number;
  sentThisMonth: number;
  lastLoginAt: string | null;
  createdAt: string;
  _count: {
    sentEmails: number;
  };
}

interface Server {
  hostname: string;
  maxAccounts: number;
}

export default function EmailAccountsPage() {
  const { apiRequest } = useAdminAuth();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [usageModalOpen, setUsageModalOpen] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null);
  const [newCredentials, setNewCredentials] = useState<any>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/admin/email-accounts', {
        method: 'GET'
      });

      if (response?.success) {
        setAccounts(response.accounts || []);
        setServer(response.server || null);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as contas de email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (data: any) => {
    try {
      const response = await apiRequest('/admin/email-accounts', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (response?.success) {
        setNewCredentials(response.credentials);
        setCredentialsModalOpen(true);
        setCreateModalOpen(false);
        fetchAccounts();
        toast({
          title: 'Sucesso',
          description: 'Conta de email criada com sucesso!'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar conta de email',
        variant: 'destructive'
      });
    }
  };

  const handleResetPassword = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja redefinir a senha desta conta?')) return;

    try {
      const response = await apiRequest(`/admin/email-accounts/${accountId}/reset-password`, {
        method: 'POST'
      });

      if (response?.success) {
        setNewCredentials(response.credentials);
        setCredentialsModalOpen(true);
        toast({
          title: 'Sucesso',
          description: 'Senha redefinida com sucesso!'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao redefinir senha',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja desativar esta conta? Ela não poderá mais enviar emails.')) return;

    try {
      const response = await apiRequest(`/admin/email-accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (response?.success) {
        fetchAccounts();
        toast({
          title: 'Sucesso',
          description: 'Conta desativada com sucesso'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao desativar conta',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateAccount = async (accountId: string, data: any) => {
    try {
      const response = await apiRequest(`/admin/email-accounts/${accountId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });

      if (response?.success) {
        fetchAccounts();
        setEditModalOpen(false);
        toast({
          title: 'Sucesso',
          description: 'Conta atualizada com sucesso'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar conta',
        variant: 'destructive'
      });
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min(100, (used / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando contas de email...</p>
        </div>
      </div>
    );
  }

  const currentAccountsCount = accounts.length;
  const maxAccounts = server?.maxAccounts || 0;
  const canCreateMore = currentAccountsCount < maxAccounts;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            Contas de Email
          </h1>
          <p className="text-gray-600 mt-2">
            Gerenciar contas de email corporativo do município
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => window.location.href = '/admin/email-accounts/compose'}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Enviar Email
          </Button>
          <Button
            onClick={() => setCreateModalOpen(true)}
            disabled={!canCreateMore}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contas Criadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentAccountsCount} / {maxAccounts}
                </p>
              </div>
              <UserCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contas Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {accounts.filter(a => a.isActive).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contas Inativas</p>
                <p className="text-2xl font-bold text-red-600">
                  {accounts.filter(a => !a.isActive).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Servidor</p>
                <p className="text-sm font-medium text-gray-900">
                  {server?.hostname || 'N/A'}
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning sobre limite */}
      {!canCreateMore && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800">
              ⚠️ Você atingiu o limite de {maxAccounts} contas do seu plano. Faça upgrade para criar mais contas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Contas ({accounts.length})</CardTitle>
          <CardDescription>
            Visualizar e gerenciar contas de email corporativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">Nenhuma conta criada ainda</p>
              <p className="text-gray-400 text-sm mt-2">
                Clique em "Nova Conta" para criar a primeira conta de email
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => {
                const monthlyPercentage = getUsagePercentage(account.sentThisMonth, account.monthlyLimit);
                const dailyPercentage = getUsagePercentage(account.sentToday, account.dailyLimit);

                return (
                  <div
                    key={account.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Mail className={`w-5 h-5 ${account.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-semibold text-gray-900">{account.name}</p>
                            <p className="text-sm text-gray-600">{account.email}</p>
                          </div>
                          {account.isAdmin && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                              ADMIN
                            </span>
                          )}
                          {account.isActive ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                              ATIVA
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                              INATIVA
                            </span>
                          )}
                        </div>

                        {/* Uso Mensal */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Uso Mensal</span>
                            <span className={`font-semibold ${getUsageColor(monthlyPercentage)}`}>
                              {account.sentThisMonth} / {account.monthlyLimit} ({monthlyPercentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                monthlyPercentage >= 90 ? 'bg-red-600' :
                                monthlyPercentage >= 70 ? 'bg-yellow-600' :
                                'bg-green-600'
                              }`}
                              style={{ width: `${monthlyPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Uso Diário */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Uso Diário</span>
                            <span className={`font-semibold ${getUsageColor(dailyPercentage)}`}>
                              {account.sentToday} / {account.dailyLimit} ({dailyPercentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                dailyPercentage >= 90 ? 'bg-red-600' :
                                dailyPercentage >= 70 ? 'bg-yellow-600' :
                                'bg-green-600'
                              }`}
                              style={{ width: `${dailyPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAccount(account);
                            setUsageModalOpen(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Estatísticas
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAccount(account);
                            setEditModalOpen(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Settings className="w-4 h-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResetPassword(account.id)}
                          className="flex items-center gap-1"
                        >
                          <Key className="w-4 h-4" />
                          Resetar Senha
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteAccount(account.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Desativar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateAccountModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateAccount}
        serverHostname={server?.hostname || ''}
      />

      <CredentialsModal
        open={credentialsModalOpen}
        onClose={() => {
          setCredentialsModalOpen(false);
          setNewCredentials(null);
        }}
        credentials={newCredentials}
      />

      {selectedAccount && (
        <>
          <EditAccountModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedAccount(null);
            }}
            account={selectedAccount}
            onSubmit={(data) => handleUpdateAccount(selectedAccount.id, data)}
          />

          <UsageStatsModal
            open={usageModalOpen}
            onClose={() => {
              setUsageModalOpen(false);
              setSelectedAccount(null);
            }}
            accountId={selectedAccount.id}
          />
        </>
      )}
    </div>
  );
}
