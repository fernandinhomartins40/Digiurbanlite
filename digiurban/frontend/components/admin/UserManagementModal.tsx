'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { getFullApiUrl } from '@/lib/api-config'
import { ROLE_HIERARCHY, ROLE_DISPLAY_NAMES, TEAM_ROLES, isTeamRole, type TeamRoleType } from '@/types/roles'

interface Department {
  id: string
  name: string
  code: string | null
}

interface UserData {
  id?: string
  name: string
  email: string
  role: string
  departmentId?: string // ✅ Mantido para compatibilidade
  departmentIds?: string[] // ✅ NOVO: Múltiplos departamentos
  primaryDepartmentId?: string // ✅ NOVO: Departamento principal
  isActive?: boolean
}

interface UserManagementModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user?: UserData | null
  currentUserRole: string
  currentUserDepartmentId?: string
}

// ✅ As constantes de roles agora vêm do arquivo centralizado @/types/roles
// Isso garante consistência em toda a aplicação

export function UserManagementModal({
  open,
  onClose,
  onSuccess,
  user,
  currentUserRole,
  currentUserDepartmentId
}: UserManagementModalProps) {
  const [formData, setFormData] = useState<UserData>({
    name: '',
    email: '',
    role: 'USER',
    departmentId: currentUserDepartmentId,
    departmentIds: currentUserDepartmentId ? [currentUserDepartmentId] : [], // ✅ NOVO
    primaryDepartmentId: currentUserDepartmentId, // ✅ NOVO
    isActive: true
  })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingDepartments, setLoadingDepartments] = useState(false)

  const isEditMode = !!user?.id
  const currentUserLevel = ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY] || 0

  // Calcular força da senha
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '', color: '' }

    let score = 0

    // Critérios de força
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++

    if (score <= 2) return { score, label: 'Fraca', color: 'bg-red-500' }
    if (score <= 4) return { score, label: 'Média', color: 'bg-yellow-500' }
    return { score, label: 'Forte', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(password)

  // Carregar dados do usuário para edição
  useEffect(() => {
    if (user) {
      // ✅ Priorizar departmentIds (novo schema) sobre departmentId (legado)
      const deptIds = user.departmentIds || (user.departmentId ? [user.departmentId] : []);
      const primaryId = user.primaryDepartmentId || user.departmentId;

      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId, // Mantido para compatibilidade
        departmentIds: deptIds,
        primaryDepartmentId: primaryId,
        isActive: user.isActive ?? true
      })
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'USER',
        departmentId: currentUserDepartmentId,
        departmentIds: currentUserDepartmentId ? [currentUserDepartmentId] : [],
        primaryDepartmentId: currentUserDepartmentId,
        isActive: true
      })
      setPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
    setError('')
  }, [user, currentUserDepartmentId])

  // Carregar departamentos
  useEffect(() => {
    if (open) {
      loadDepartments()
    }
  }, [open])

  const loadDepartments = async () => {
    setLoadingDepartments(true)
    try {
      const url = getFullApiUrl('/admin/departments')
      const response = await fetch(url, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Erro ao carregar departamentos')

      const data = await response.json()
      if (data.success && data.data?.departments) {
        setDepartments(data.data.departments)
      }
    } catch (err) {
      console.error('Erro ao carregar departamentos:', err)
    } finally {
      setLoadingDepartments(false)
    }
  }

  // ✅ Roles disponíveis: apenas TEAM_ROLES (exclui GUEST e SUPER_ADMIN) e inferiores ao usuário atual
  const availableRoles = TEAM_ROLES
    .filter((role) => {
      const roleLevel = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY]
      // Usuário pode criar apenas roles inferiores ao dele
      return roleLevel < currentUserLevel
    })
    .map((role) => ({
      value: role,
      label: ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES],
      level: ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY]
    }))
    .sort((a, b) => b.level - a.level)

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Nome é obrigatório'
    if (!formData.email.trim()) return 'Email é obrigatório'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Email inválido'

    if (!isEditMode) {
      if (!password) return 'Senha é obrigatória'
      if (password.length < 8) return 'Senha deve ter no mínimo 8 caracteres'
      if (!/[A-Z]/.test(password)) return 'Senha deve conter ao menos uma letra maiúscula'
      if (!/[a-z]/.test(password)) return 'Senha deve conter ao menos uma letra minúscula'
      if (!/\d/.test(password)) return 'Senha deve conter ao menos um número'
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Senha deve conter ao menos um caractere especial'
      if (password !== confirmPassword) return 'As senhas não coincidem'
    }

    const selectedRoleLevel = ROLE_HIERARCHY[formData.role as keyof typeof ROLE_HIERARCHY]
    if (selectedRoleLevel >= currentUserLevel) {
      return 'Você não pode criar usuários com role igual ou superior ao seu'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const endpoint = isEditMode
        ? `/admin/team/${formData.id}`
        : '/admin/team'

      const url = getFullApiUrl(endpoint)
      const method = isEditMode ? 'PUT' : 'POST'

      const body = isEditMode
        ? {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            // ✅ NOVO: Enviar múltiplos departamentos
            departmentIds: formData.departmentIds,
            primaryDepartmentId: formData.primaryDepartmentId,
            isActive: formData.isActive
          }
        : {
            name: formData.name,
            email: formData.email,
            password: password,
            role: formData.role,
            // ✅ NOVO: Enviar múltiplos departamentos
            departmentIds: formData.departmentIds,
            primaryDepartmentId: formData.primaryDepartmentId
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao salvar usuário')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Edite as informações do usuário abaixo'
              : 'Crie um novo usuário com role inferior ao seu'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              disabled={loading}
            />
          </div>

          {!isEditMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Indicador de força da senha */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Força da senha:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.label === 'Forte' ? 'text-green-600' :
                        passwordStrength.label === 'Média' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="flex gap-1 h-1">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full ${
                            i < passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
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
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600">As senhas não coincidem</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-green-600">✓ As senhas coincidem</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Cargo *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum cargo disponível
                  </SelectItem>
                ) : (
                  availableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Você só pode criar usuários com cargos inferiores ao seu
            </p>
          </div>

          {/* ✅ NOVO: Seleção de múltiplos departamentos com checkboxes */}
          <div className="space-y-2">
            <Label>Departamentos</Label>
            <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
              {loadingDepartments ? (
                <p className="text-sm text-muted-foreground">Carregando departamentos...</p>
              ) : departments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum departamento disponível</p>
              ) : (
                departments.map((dept) => {
                  const isSelected = formData.departmentIds?.includes(dept.id) || false;
                  const isPrimary = formData.primaryDepartmentId === dept.id;
                  const canSelect = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';

                  return (
                    <div key={dept.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`dept-${dept.id}`}
                          checked={isSelected}
                          onChange={(e) => {
                            if (!canSelect) return;

                            const newDeptIds = e.target.checked
                              ? [...(formData.departmentIds || []), dept.id]
                              : (formData.departmentIds || []).filter(id => id !== dept.id);

                            // Se desmarcar o primary, atualizar para o primeiro da lista
                            let newPrimaryId = formData.primaryDepartmentId;
                            if (!e.target.checked && isPrimary) {
                              newPrimaryId = newDeptIds[0] || undefined;
                            }
                            // Se marcar o primeiro, torná-lo primary automaticamente
                            if (e.target.checked && newDeptIds.length === 1) {
                              newPrimaryId = dept.id;
                            }

                            setFormData({
                              ...formData,
                              departmentIds: newDeptIds,
                              primaryDepartmentId: newPrimaryId,
                              departmentId: newPrimaryId // Manter compatibilidade
                            });
                          }}
                          disabled={loading || !canSelect}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label
                          htmlFor={`dept-${dept.id}`}
                          className={`cursor-pointer text-sm ${isPrimary ? 'font-semibold' : ''}`}
                        >
                          {dept.name}
                          {isPrimary && <span className="ml-2 text-xs text-primary">★ Principal</span>}
                        </Label>
                      </div>

                      {isSelected && !isPrimary && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              primaryDepartmentId: dept.id,
                              departmentId: dept.id // Manter compatibilidade
                            });
                          }}
                          disabled={loading || !canSelect}
                          className="h-7 text-xs"
                        >
                          Definir como principal
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {currentUserRole !== 'ADMIN' && currentUserRole !== 'SUPER_ADMIN' && (
              <p className="text-xs text-muted-foreground">
                Apenas administradores podem selecionar departamentos
              </p>
            )}

            {formData.departmentIds && formData.departmentIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {formData.departmentIds.length} departamento(s) selecionado(s)
              </p>
            )}
          </div>

          {isEditMode && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={loading}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Usuário ativo
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || availableRoles.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
