'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getFullApiUrl } from '@/lib/api-config'
import { ROLE_HIERARCHY, ROLE_DISPLAY_NAMES, TEAM_ROLES } from '@/types/roles'

interface Department {
  id: string
  name: string
  code: string | null
}

interface ServerData {
  id?: string
  name: string
  email: string
  role: string
  departmentId?: string
  departmentIds?: string[]
  primaryDepartmentId?: string
  isActive?: boolean
  // Dados de servidor público
  cpf?: string
  matricula?: string
  rg?: string
  dataNascimento?: string
  telefone?: string
  telefoneSecundario?: string
  endereco?: any
  cargoEfetivo?: string
  situacaoFuncional?: string
  dataAdmissao?: string
  observacoes?: string
}

interface ServerManagementModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user?: ServerData | null
  currentUserRole: string
  currentUserDepartmentId?: string
}

export function ServerManagementModal({
  open,
  onClose,
  onSuccess,
  user,
  currentUserRole,
  currentUserDepartmentId
}: ServerManagementModalProps) {
  const [formData, setFormData] = useState<ServerData>({
    name: '',
    email: '',
    role: 'USER',
    departmentId: currentUserDepartmentId,
    departmentIds: currentUserDepartmentId ? [currentUserDepartmentId] : [],
    primaryDepartmentId: currentUserDepartmentId,
    isActive: true,
    cpf: '',
    matricula: '',
    rg: '',
    dataNascimento: '',
    telefone: '',
    telefoneSecundario: '',
    cargoEfetivo: '',
    situacaoFuncional: 'ATIVO',
    dataAdmissao: '',
    observacoes: ''
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

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '', color: '' }
    let score = 0
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

  useEffect(() => {
    if (user) {
      const deptIds = user.departmentIds || (user.departmentId ? [user.departmentId] : [])
      const primaryId = user.primaryDepartmentId || user.departmentId

      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        departmentIds: deptIds,
        primaryDepartmentId: primaryId,
        isActive: user.isActive ?? true,
        cpf: user.cpf || '',
        matricula: user.matricula || '',
        rg: user.rg || '',
        dataNascimento: user.dataNascimento || '',
        telefone: user.telefone || '',
        telefoneSecundario: user.telefoneSecundario || '',
        cargoEfetivo: user.cargoEfetivo || '',
        situacaoFuncional: user.situacaoFuncional || 'ATIVO',
        dataAdmissao: user.dataAdmissao || '',
        observacoes: user.observacoes || ''
      })
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'USER',
        departmentId: currentUserDepartmentId,
        departmentIds: currentUserDepartmentId ? [currentUserDepartmentId] : [],
        primaryDepartmentId: currentUserDepartmentId,
        isActive: true,
        cpf: '',
        matricula: '',
        rg: '',
        dataNascimento: '',
        telefone: '',
        telefoneSecundario: '',
        cargoEfetivo: '',
        situacaoFuncional: 'ATIVO',
        dataAdmissao: '',
        observacoes: ''
      })
      setPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
    setError('')
  }, [user, currentUserDepartmentId])

  useEffect(() => {
    if (open) {
      loadDepartments()
    }
  }, [open])

  const loadDepartments = async () => {
    setLoadingDepartments(true)
    try {
      const endpoint = currentUserRole === 'SUPER_ADMIN'
        ? '/super-admin/departments'
        : '/admin/departments'
      const url = getFullApiUrl(endpoint)
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

  const availableRoles = TEAM_ROLES
    .filter((role) => {
      const roleLevel = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY]
      return roleLevel < currentUserLevel
    })
    .map((role) => ({
      value: role,
      label: ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES],
      level: ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY]
    }))
    .sort((a, b) => b.level - a.level)

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

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

    // Validação de CPF (básica)
    if (formData.cpf && formData.cpf.replace(/\D/g, '').length !== 11) {
      return 'CPF deve ter 11 dígitos'
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
            departmentIds: formData.departmentIds,
            primaryDepartmentId: formData.primaryDepartmentId,
            isActive: formData.isActive,
            cpf: formData.cpf || null,
            matricula: formData.matricula || null,
            rg: formData.rg || null,
            dataNascimento: formData.dataNascimento || null,
            telefone: formData.telefone || null,
            telefoneSecundario: formData.telefoneSecundario || null,
            cargoEfetivo: formData.cargoEfetivo || null,
            situacaoFuncional: formData.situacaoFuncional || null,
            dataAdmissao: formData.dataAdmissao || null,
            observacoes: formData.observacoes || null
          }
        : {
            name: formData.name,
            email: formData.email,
            password: password,
            role: formData.role,
            departmentIds: formData.departmentIds,
            primaryDepartmentId: formData.primaryDepartmentId,
            cpf: formData.cpf || null,
            matricula: formData.matricula || null,
            rg: formData.rg || null,
            dataNascimento: formData.dataNascimento || null,
            telefone: formData.telefone || null,
            telefoneSecundario: formData.telefoneSecundario || null,
            cargoEfetivo: formData.cargoEfetivo || null,
            situacaoFuncional: formData.situacaoFuncional || 'ATIVO',
            dataAdmissao: formData.dataAdmissao || null,
            observacoes: formData.observacoes || null
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
        throw new Error(data.message || 'Erro ao salvar servidor')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isEditMode ? 'Editar Servidor' : 'Novo Servidor'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditMode
              ? 'Edite as informações do servidor público'
              : 'Cadastre um novo servidor público municipal'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
              <TabsTrigger value="funcional">Funcional</TabsTrigger>
            </TabsList>

            {/* Tab: Dados Básicos */}
            <TabsContent value="basico" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo do servidor"
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
                  placeholder="email@servidor.gov.br"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {password && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Força:</span>
                          <span className={`text-xs font-medium ${
                            passwordStrength.label === 'Forte' ? 'text-green-600' :
                            passwordStrength.label === 'Média' ? 'text-yellow-600' : 'text-red-600'
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-xs text-green-600">✓ As senhas coincidem</p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">Cargo no Sistema *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Departamentos</Label>
                <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                  {loadingDepartments ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : departments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum departamento disponível</p>
                  ) : (
                    departments.map((dept) => {
                      const isSelected = formData.departmentIds?.includes(dept.id) || false
                      const isPrimary = formData.primaryDepartmentId === dept.id

                      return (
                        <div key={dept.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`dept-${dept.id}`}
                              checked={isSelected}
                              onChange={(e) => {
                                const newDeptIds = e.target.checked
                                  ? [...(formData.departmentIds || []), dept.id]
                                  : (formData.departmentIds || []).filter(id => id !== dept.id)

                                let newPrimaryId = formData.primaryDepartmentId
                                if (!e.target.checked && isPrimary) {
                                  newPrimaryId = newDeptIds[0] || undefined
                                }
                                if (e.target.checked && newDeptIds.length === 1) {
                                  newPrimaryId = dept.id
                                }

                                setFormData({
                                  ...formData,
                                  departmentIds: newDeptIds,
                                  primaryDepartmentId: newPrimaryId,
                                  departmentId: newPrimaryId
                                })
                              }}
                              disabled={loading}
                              className="h-4 w-4"
                            />
                            <Label htmlFor={`dept-${dept.id}`} className={`cursor-pointer text-sm ${isPrimary ? 'font-semibold' : ''}`}>
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
                                  departmentId: dept.id
                                })
                              }}
                              disabled={loading}
                              className="h-7 text-xs"
                            >
                              Tornar principal
                            </Button>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
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
                  <Label htmlFor="isActive" className="cursor-pointer">Servidor ativo</Label>
                </div>
              )}
            </TabsContent>

            {/* Tab: Dados Pessoais */}
            <TabsContent value="pessoal" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    placeholder="Matrícula funcional"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={formData.rg}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    placeholder="Número do RG"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefoneSecundario">Telefone Secundário</Label>
                  <Input
                    id="telefoneSecundario"
                    value={formData.telefoneSecundario}
                    onChange={(e) => setFormData({ ...formData, telefoneSecundario: e.target.value })}
                    placeholder="(00) 00000-0000"
                    disabled={loading}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Dados Funcionais */}
            <TabsContent value="funcional" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cargoEfetivo">Cargo Efetivo</Label>
                <Input
                  id="cargoEfetivo"
                  value={formData.cargoEfetivo}
                  onChange={(e) => setFormData({ ...formData, cargoEfetivo: e.target.value })}
                  placeholder="Ex: Médico, Professor, Engenheiro"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Cargo de concurso ou nomeação</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="situacaoFuncional">Situação Funcional</Label>
                  <Select
                    value={formData.situacaoFuncional}
                    onValueChange={(value) => setFormData({ ...formData, situacaoFuncional: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATIVO">Ativo</SelectItem>
                      <SelectItem value="APOSENTADO">Aposentado</SelectItem>
                      <SelectItem value="EXONERADO">Exonerado</SelectItem>
                      <SelectItem value="LICENCA">Em Licença</SelectItem>
                      <SelectItem value="AFASTADO">Afastado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataAdmissao">Data de Admissão</Label>
                  <Input
                    id="dataAdmissao"
                    type="date"
                    value={formData.dataAdmissao}
                    onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações gerais sobre o servidor"
                  rows={4}
                  disabled={loading}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || availableRoles.length === 0}
              className="w-full sm:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Salvar Alterações' : 'Criar Servidor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
