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
  Loader2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface Department {
  id: string;
  name: string;
  code: string | null;
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Carregar departamentos quando abrir modal de criação/edição
  useEffect(() => {
    if (showCreateModal || showEditModal) {
      loadDepartments();
    }
  }, [showCreateModal, showEditModal]);

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

  const loadDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const response = await fetch('/api/super-admin/departments');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.departments) {
          setDepartments(data.data.departments);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Função para calcular força da senha
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '', color: '' };

    let score = 0;

    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;

    if (score <= 2) return { score, label: 'Fraca', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Média', color: 'bg-yellow-500' };
    return { score, label: 'Forte', color: 'bg-green-500' };
  };

  const validateForm = (isEdit: boolean): string | null => {
    if (!formData.name.trim()) return 'Nome é obrigatório';
    if (!formData.email.trim()) return 'Email é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Email inválido';

    if (!isEdit) {
      if (!formData.password) return 'Senha é obrigatória';
      if (formData.password.length < 8) return 'Senha deve ter no mínimo 8 caracteres';
      if (!/[A-Z]/.test(formData.password)) return 'Senha deve conter ao menos uma letra maiúscula';
      if (!/[a-z]/.test(formData.password)) return 'Senha deve conter ao menos uma letra minúscula';
      if (!/\d/.test(formData.password)) return 'Senha deve conter ao menos um número';
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) return 'Senha deve conter ao menos um caractere especial';
      if (formData.password !== confirmPassword) return 'As senhas não coincidem';
    }

    return null;
  };

  const handleCreate = async () => {
    setFormError('');

    const validationError = validateForm(false);
    if (validationError) {
      setFormError(validationError);
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
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        setFormError('');
        fetchAdmins();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      setFormError(error.message || 'Não foi possível criar o super admin');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAdmin) return;

    setFormError('');

    const validationError = validateForm(true);
    if (validationError) {
      setFormError(validationError);
      return;
    }

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
        setFormError('');
        fetchAdmins();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar');
      }
    } catch (error: any) {
      setFormError(error.message || 'Não foi possível atualizar o super admin');
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
    setFormError('');
    setShowEditModal(true);
  };

  const handleOpenCreateModal = () => {
    setFormData({ name: '', email: '', password: '', departmentId: '' });
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormError('');
    setShowCreateModal(true);
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
        <Button onClick={handleOpenCreateModal}>
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
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Criar Novo Super Admin</CardTitle>
              <p className="text-sm text-gray-500">Preencha os dados do novo super administrador</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="create-name">Nome *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="create-password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    disabled={saving}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                    disabled={saving}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Indicador de força da senha */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Força da senha:</span>
                      <span className={`text-xs font-medium ${
                        getPasswordStrength(formData.password).label === 'Forte' ? 'text-green-600' :
                        getPasswordStrength(formData.password).label === 'Média' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {getPasswordStrength(formData.password).label}
                      </span>
                    </div>
                    <div className="flex gap-1 h-1">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full ${
                            i < getPasswordStrength(formData.password).score
                              ? getPasswordStrength(formData.password).color
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Deve conter: maiúscula, minúscula, número e caractere especial
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-confirm-password">Confirmar Senha *</Label>
                <div className="relative">
                  <Input
                    id="create-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    disabled={saving}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                    disabled={saving}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && formData.password !== confirmPassword && (
                  <p className="text-xs text-red-600">As senhas não coincidem</p>
                )}
                {confirmPassword && formData.password === confirmPassword && (
                  <p className="text-xs text-green-600">✓ As senhas coincidem</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-department">Departamento (Opcional)</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                  disabled={saving || loadingDepartments}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum departamento</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingDepartments && (
                  <p className="text-xs text-gray-500">Carregando departamentos...</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', email: '', password: '', departmentId: '' });
                    setConfirmPassword('');
                    setFormError('');
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
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Editar Super Admin</CardTitle>
              <p className="text-sm text-gray-500">Edite as informações do super administrador</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-department">Departamento (Opcional)</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                  disabled={saving || loadingDepartments}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum departamento</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingDepartments && (
                  <p className="text-xs text-gray-500">Carregando departamentos...</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Para alterar a senha, use a função "Redefinir Senha" na lista de usuários.</span>
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAdmin(null);
                    setFormData({ name: '', email: '', password: '', departmentId: '' });
                    setFormError('');
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
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
