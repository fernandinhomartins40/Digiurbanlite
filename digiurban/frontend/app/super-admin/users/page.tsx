'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  UserCog,
  Search,
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  UserPlus,
  Loader2
} from 'lucide-react';

interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
  department: {
    id: string;
    name: string;
  } | null;
}

export default function SuperAdminUsersPage() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<SuperAdmin | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/super-admin/users/admins');
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar super admins:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os super admins',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/super-admin/users/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Super Admin Criado',
          description: 'O super admin foi criado com sucesso'
        });
        setShowCreateModal(false);
        setFormData({ name: '', email: '', password: '', departmentId: '' });
        fetchAdmins();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o super admin',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAdmin) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/super-admin/users/admins/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          departmentId: formData.departmentId || null
        })
      });

      if (response.ok) {
        toast({
          title: 'Super Admin Atualizado',
          description: 'O super admin foi atualizado com sucesso'
        });
        setShowEditModal(false);
        setSelectedAdmin(null);
        setFormData({ name: '', email: '', password: '', departmentId: '' });
        fetchAdmins();
      } else {
        throw new Error('Erro ao atualizar');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o super admin',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/super-admin/users/admins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        toast({
          title: currentStatus ? 'Desativado' : 'Ativado',
          description: `Super admin ${currentStatus ? 'desativado' : 'ativado'} com sucesso`
        });
        fetchAdmins();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja desativar este super admin?')) return;

    try {
      const response = await fetch(`/api/super-admin/users/admins/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Super Admin Removido',
          description: 'O super admin foi desativado com sucesso'
        });
        fetchAdmins();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover o super admin',
        variant: 'destructive'
      });
    }
  };

  const openEditModal = (admin: SuperAdmin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      departmentId: admin.department?.id || ''
    });
    setShowEditModal(true);
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: admins.length,
    active: admins.filter(a => a.isActive).length,
    inactive: admins.filter(a => !a.isActive).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Super Admins</h1>
          <p className="text-gray-600">Gerencie os super administradores do sistema</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Super Admin
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Shield className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">Super administradores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.active}</div>
            <p className="text-xs text-gray-500 mt-1">Podem acessar o sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <XCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-gray-500 mt-1">Bloqueados</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Admins List */}
      <Card>
        <CardHeader>
          <CardTitle>Super Administradores ({filteredAdmins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="text-center py-12">
              <UserCog size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Nenhum super admin encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Departamento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Último Login</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Criado em</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            <Shield size={16} className="text-purple-600" />
                            {admin.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail size={12} />
                            {admin.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {admin.department?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          admin.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {admin.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {admin.lastLogin
                            ? new Date(admin.lastLogin).toLocaleDateString('pt-BR')
                            : 'Nunca'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(admin.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(admin.id, admin.isActive)}
                            className={`p-2 rounded-lg ${
                              admin.isActive
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={admin.isActive ? 'Desativar' : 'Ativar'}
                          >
                            {admin.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                          </button>
                          <button
                            onClick={() => handleDelete(admin.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remover"
                          >
                            <Trash2 size={18} />
                          </button>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Criar Novo Super Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="create-name">Nome *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="create-password">Senha *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Senha segura"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', email: '', password: '', departmentId: '' });
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  className="flex-1"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Editar Super Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAdmin(null);
                    setFormData({ name: '', email: '', password: '', departmentId: '' });
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdate}
                  className="flex-1"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
