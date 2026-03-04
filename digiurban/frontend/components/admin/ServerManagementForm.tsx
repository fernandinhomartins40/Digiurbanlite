'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Eye, EyeOff, ArrowRightLeft, Building2, Briefcase } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getFullApiUrl } from '@/lib/api-config'
import { ROLE_DISPLAY_NAMES, ROLE_HIERARCHY, TEAM_ROLES } from '@/types/roles'

interface Department { id: string; name: string; code: string | null }
interface OrgUnit { id: string; nome: string; sigla?: string }
interface Position { id: string; nome: string; organizationalUnitId?: string | null }
interface OrgFunction { id: string; nome: string; positionId?: string | null }
interface AssignmentSummary {
  id: string
  isPrimary: boolean
  situacao: string
  organizationalUnit?: { id: string; nome: string; sigla?: string } | null
  position?: { id: string; nome: string } | null
  function?: { id: string; nome: string } | null
}
export interface ServerFormData {
  id?: string
  name: string
  email: string
  role: string
  departmentId?: string
  departmentIds?: string[]
  primaryDepartmentId?: string
  isActive?: boolean
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
  assignments?: AssignmentSummary[]
}
interface ServerManagementFormProps {
  mode: 'create' | 'edit'
  cancelHref: string
  successHref?: string
  initialUser?: ServerFormData | null
  currentUserRole: string
  currentUserDepartmentId?: string
}
interface InitialAssignment {
  organizationalUnitId: string
  positionId: string
  functionId: string
  dataInicio: string
  cargaHoraria: string
  percentualDedicacao: string
  observacoes: string
}

const today = () => new Date().toISOString().slice(0, 10)
const EMPTY_ASSIGNMENT: InitialAssignment = {
  organizationalUnitId: '',
  positionId: '',
  functionId: '',
  dataInicio: today(),
  cargaHoraria: '',
  percentualDedicacao: '',
  observacoes: '',
}

export function ServerManagementForm({
  mode,
  cancelHref,
  successHref,
  initialUser,
  currentUserRole,
  currentUserDepartmentId,
}: ServerManagementFormProps) {
  const router = useRouter()
  const isEditMode = mode === 'edit'
  const currentUserLevel = ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY] || 0
  const [formData, setFormData] = useState<ServerFormData>({
    name: '', email: '', role: 'USER',
    departmentId: currentUserDepartmentId,
    departmentIds: currentUserDepartmentId ? [currentUserDepartmentId] : [],
    primaryDepartmentId: currentUserDepartmentId,
    isActive: true, cpf: '', matricula: '', rg: '', dataNascimento: '', telefone: '',
    telefoneSecundario: '', cargoEfetivo: '', situacaoFuncional: 'ATIVO', dataAdmissao: '', observacoes: '',
  })
  const [initialAssignment, setInitialAssignment] = useState<InitialAssignment>(EMPTY_ASSIGNMENT)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [organizationalUnits, setOrganizationalUnits] = useState<OrgUnit[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [functions, setFunctions] = useState<OrgFunction[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [loadingOrganogram, setLoadingOrganogram] = useState(false)
  const [error, setError] = useState('')

  const availableRoles = useMemo(
    () =>
      TEAM_ROLES.filter((role) => (ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 0) < currentUserLevel)
        .map((role) => ({ value: role, label: ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES] })),
    [currentUserLevel]
  )

  const primaryDepartmentId = formData.primaryDepartmentId || formData.departmentIds?.[0] || ''
  const primaryDepartment = departments.find((department) => department.id === primaryDepartmentId)
  const primaryAssignment =
    initialUser?.assignments?.find((assignment) => assignment.isPrimary) || initialUser?.assignments?.[0]

  const filteredPositions = useMemo(
    () =>
      positions.filter((position) => {
        if (
          initialAssignment.organizationalUnitId &&
          position.organizationalUnitId &&
          position.organizationalUnitId !== initialAssignment.organizationalUnitId
        ) {
          return false
        }
        return true
      }),
    [initialAssignment.organizationalUnitId, positions]
  )

  const filteredFunctions = useMemo(
    () =>
      functions.filter((func) => {
        if (!initialAssignment.positionId && func.positionId) return false
        if (initialAssignment.positionId && func.positionId && func.positionId !== initialAssignment.positionId) {
          return false
        }
        return true
      }),
    [functions, initialAssignment.positionId]
  )

  useEffect(() => {
    if (initialUser) {
      const departmentIds =
        initialUser.departmentIds || (initialUser.departmentId ? [initialUser.departmentId] : [])
      setFormData({
        ...initialUser,
        departmentIds,
        primaryDepartmentId: initialUser.primaryDepartmentId || initialUser.departmentId,
        cpf: initialUser.cpf || '',
        matricula: initialUser.matricula || '',
        rg: initialUser.rg || '',
        dataNascimento: initialUser.dataNascimento || '',
        telefone: initialUser.telefone || '',
        telefoneSecundario: initialUser.telefoneSecundario || '',
        cargoEfetivo: initialUser.cargoEfetivo || '',
        situacaoFuncional: initialUser.situacaoFuncional || 'ATIVO',
        dataAdmissao: initialUser.dataAdmissao || '',
        observacoes: initialUser.observacoes || '',
      })
    } else {
      setFormData({
        name: '', email: '', role: 'USER',
        departmentId: currentUserDepartmentId,
        departmentIds: currentUserDepartmentId ? [currentUserDepartmentId] : [],
        primaryDepartmentId: currentUserDepartmentId,
        isActive: true, cpf: '', matricula: '', rg: '', dataNascimento: '', telefone: '',
        telefoneSecundario: '', cargoEfetivo: '', situacaoFuncional: 'ATIVO', dataAdmissao: '', observacoes: '',
      })
      setInitialAssignment(EMPTY_ASSIGNMENT)
      setPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
    setError('')
  }, [initialUser, currentUserDepartmentId])

  useEffect(() => {
    void loadDepartments()
  }, [currentUserRole])

  useEffect(() => {
    if (!primaryDepartmentId) {
      setOrganizationalUnits([])
      setPositions([])
      setFunctions([])
      return
    }
    void loadOrganogramOptions(primaryDepartmentId)
  }, [primaryDepartmentId])

  const loadDepartments = async () => {
    setLoadingDepartments(true)
    try {
      const endpoint = currentUserRole === 'SUPER_ADMIN' ? '/super-admin/departments' : '/admin/departments'
      const response = await fetch(getFullApiUrl(endpoint), { credentials: 'include', cache: 'no-store' })
      const data = await response.json()
      if (response.ok) setDepartments(data?.data?.departments || data?.departments || [])
    } finally {
      setLoadingDepartments(false)
    }
  }

  const loadOrganogramOptions = async (departmentId: string) => {
    setLoadingOrganogram(true)
    try {
      const [orgUnitsRes, positionsRes, functionsRes] = await Promise.all([
        fetch(getFullApiUrl(`/organizational-units?departmentId=${departmentId}`), { credentials: 'include', cache: 'no-store' }),
        fetch(getFullApiUrl(`/positions?departmentId=${departmentId}&isActive=true`), { credentials: 'include', cache: 'no-store' }),
        fetch(getFullApiUrl(`/functions?departmentId=${departmentId}&isActive=true`), { credentials: 'include', cache: 'no-store' }),
      ])
      const [orgUnitsData, positionsData, functionsData] = await Promise.all([
        orgUnitsRes.json().catch(() => []),
        positionsRes.json().catch(() => []),
        functionsRes.json().catch(() => []),
      ])
      setOrganizationalUnits(Array.isArray(orgUnitsData) ? orgUnitsData : orgUnitsData?.data || [])
      setPositions(Array.isArray(positionsData) ? positionsData : positionsData?.data || [])
      setFunctions(Array.isArray(functionsData) ? functionsData : functionsData?.data || [])
    } finally {
      setLoadingOrganogram(false)
    }
  }

  const formatCPF = (value: string) =>
    value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1')

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
    if (score <= 2) return { score, label: 'Fraca', color: 'bg-red-500' }
    if (score <= 4) return { score, label: 'Media', color: 'bg-yellow-500' }
    return { score, label: 'Forte', color: 'bg-green-500' }
  }, [password])

  const validateForm = () => {
    if (!formData.name?.trim()) return 'Nome e obrigatorio'
    if (!formData.email?.trim()) return 'Email e obrigatorio'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Email invalido'
    if (!formData.departmentIds?.length) return 'Selecione ao menos um departamento'
    if (!primaryDepartmentId) return 'Defina um departamento principal'
    if (formData.cpf && formData.cpf.replace(/\D/g, '').length !== 11) return 'CPF deve ter 11 digitos'
    if ((ROLE_HIERARCHY[formData.role as keyof typeof ROLE_HIERARCHY] || 0) >= currentUserLevel) return 'Voce nao pode criar usuarios com role igual ou superior ao seu'
    if (!isEditMode) {
      if (!password) return 'Senha e obrigatoria'
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return 'Senha nao atende aos requisitos minimos'
      }
      if (password !== confirmPassword) return 'As senhas nao coincidem'
      if (!initialAssignment.organizationalUnitId) return 'A lotacao inicial no organograma e obrigatoria'
      if (initialAssignment.percentualDedicacao && (Number(initialAssignment.percentualDedicacao) <= 0 || Number(initialAssignment.percentualDedicacao) > 100)) {
        return 'Percentual de dedicacao deve estar entre 1 e 100'
      }
    }
    return null
  }

  const handleDepartmentToggle = (departmentId: string, checked: boolean) => {
    const nextDepartmentIds = checked ? [...(formData.departmentIds || []), departmentId] : (formData.departmentIds || []).filter((id) => id !== departmentId)
    const nextPrimaryDepartmentId = checked && nextDepartmentIds.length === 1 ? departmentId : formData.primaryDepartmentId === departmentId && !checked ? nextDepartmentIds[0] : formData.primaryDepartmentId
    setFormData((current) => ({ ...current, departmentIds: nextDepartmentIds, primaryDepartmentId: nextPrimaryDepartmentId, departmentId: nextPrimaryDepartmentId }))
    if (nextPrimaryDepartmentId !== primaryDepartmentId) setInitialAssignment((current) => ({ ...current, organizationalUnitId: '', positionId: '', functionId: '' }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError('')
    try {
      const endpoint = isEditMode ? `/admin/team/${formData.id}` : '/admin/team'
      const method = isEditMode ? 'PUT' : 'POST'
      const body = isEditMode ? {
        name: formData.name, email: formData.email, role: formData.role,
        departmentIds: formData.departmentIds, primaryDepartmentId, isActive: formData.isActive,
        cpf: formData.cpf || null, matricula: formData.matricula || null, rg: formData.rg || null,
        dataNascimento: formData.dataNascimento || null, telefone: formData.telefone || null,
        telefoneSecundario: formData.telefoneSecundario || null, cargoEfetivo: formData.cargoEfetivo || null,
        situacaoFuncional: formData.situacaoFuncional || null, dataAdmissao: formData.dataAdmissao || null,
        observacoes: formData.observacoes || null,
      } : {
        name: formData.name, email: formData.email, password, role: formData.role,
        departmentIds: formData.departmentIds, primaryDepartmentId,
        cpf: formData.cpf || null, matricula: formData.matricula || null, rg: formData.rg || null,
        dataNascimento: formData.dataNascimento || null, telefone: formData.telefone || null,
        telefoneSecundario: formData.telefoneSecundario || null, cargoEfetivo: formData.cargoEfetivo || null,
        situacaoFuncional: formData.situacaoFuncional || 'ATIVO', dataAdmissao: formData.dataAdmissao || null,
        observacoes: formData.observacoes || null,
        initialAssignment: {
          departmentId: primaryDepartmentId,
          organizationalUnitId: initialAssignment.organizationalUnitId,
          positionId: initialAssignment.positionId || undefined,
          functionId: initialAssignment.functionId || undefined,
          dataInicio: initialAssignment.dataInicio || today(),
          cargaHoraria: initialAssignment.cargaHoraria ? Number(initialAssignment.cargaHoraria) : null,
          percentualDedicacao: initialAssignment.percentualDedicacao ? Number(initialAssignment.percentualDedicacao) : null,
          observacoes: initialAssignment.observacoes || undefined,
        },
      }
      const response = await fetch(getFullApiUrl(endpoint), {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || data.error || 'Erro ao salvar servidor')
      const targetId = data?.data?.id || data?.id || formData.id
      router.push(successHref || (targetId ? `/admin/servidores/${targetId}` : '/admin/servidores'))
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro ao salvar servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Editar servidor' : 'Novo servidor'}</CardTitle>
        <CardDescription>
          {isEditMode
            ? 'Atualize o cadastro administrativo. A lotacao operacional e gerenciada no organograma.'
            : 'Cadastre o servidor e defina a lotacao inicial no organograma.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico">Basico</TabsTrigger>
              <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
              <TabsTrigger value="organograma">Organograma</TabsTrigger>
              <TabsTrigger value="funcional">Funcional</TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="space-y-3">
              <div className="space-y-2"><Label htmlFor="name">Nome completo *</Label><Input id="name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} disabled={loading} /></div>
              <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} disabled={loading} /></div>

              {!isEditMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} className="pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" tabIndex={-1}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                    {password && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Forca:</span><span className={`text-xs font-medium ${passwordStrength.label === 'Forte' ? 'text-green-600' : passwordStrength.label === 'Media' ? 'text-yellow-600' : 'text-red-600'}`}>{passwordStrength.label}</span></div>
                        <div className="flex gap-1 h-1">{[...Array(6)].map((_, index) => <div key={index} className={`flex-1 rounded-full ${index < passwordStrength.score ? passwordStrength.color : 'bg-gray-200'}`} />)}</div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar senha *</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={loading} className="pr-10" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" tabIndex={-1}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">Perfil de acesso *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} disabled={loading}>
                  <SelectTrigger id="role"><SelectValue placeholder="Selecione um perfil" /></SelectTrigger>
                  <SelectContent>{availableRoles.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Escopo administrativo (departamentos)</Label>
                <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                  {loadingDepartments ? <p className="text-sm text-muted-foreground">Carregando...</p> : departments.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum departamento disponivel</p> : departments.map((department) => {
                    const isSelected = formData.departmentIds?.includes(department.id) || false
                    const isPrimary = primaryDepartmentId === department.id
                    return (
                      <div key={department.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id={`dept-${department.id}`} checked={isSelected} onChange={(event) => handleDepartmentToggle(department.id, event.target.checked)} disabled={loading} className="h-4 w-4" />
                          <Label htmlFor={`dept-${department.id}`} className={`cursor-pointer text-sm ${isPrimary ? 'font-semibold' : ''}`}>{department.name}{isPrimary && <span className="ml-2 text-xs text-primary">Principal</span>}</Label>
                        </div>
                        {isSelected && !isPrimary && <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, primaryDepartmentId: department.id, departmentId: department.id })} disabled={loading} className="h-7 text-xs">Tornar principal</Button>}
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">O departamento controla o escopo administrativo do usuario. O setor, cargo e funcao operacionais ficam no organograma.</p>
              </div>

              {isEditMode && <div className="flex items-center space-x-2"><input type="checkbox" id="isActive" checked={formData.isActive} onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })} disabled={loading} className="h-4 w-4" /><Label htmlFor="isActive" className="cursor-pointer">Servidor ativo</Label></div>}
            </TabsContent>

            <TabsContent value="pessoal" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label htmlFor="cpf">CPF</Label><Input id="cpf" value={formData.cpf} onChange={(event) => setFormData({ ...formData, cpf: formatCPF(event.target.value) })} maxLength={14} disabled={loading} /></div>
                <div className="space-y-2"><Label htmlFor="matricula">Matricula</Label><Input id="matricula" value={formData.matricula} onChange={(event) => setFormData({ ...formData, matricula: event.target.value })} disabled={loading} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label htmlFor="rg">RG</Label><Input id="rg" value={formData.rg} onChange={(event) => setFormData({ ...formData, rg: event.target.value })} disabled={loading} /></div>
                <div className="space-y-2"><Label htmlFor="dataNascimento">Data de nascimento</Label><Input id="dataNascimento" type="date" value={formData.dataNascimento} onChange={(event) => setFormData({ ...formData, dataNascimento: event.target.value })} disabled={loading} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label htmlFor="telefone">Telefone</Label><Input id="telefone" value={formData.telefone} onChange={(event) => setFormData({ ...formData, telefone: event.target.value })} disabled={loading} /></div>
                <div className="space-y-2"><Label htmlFor="telefoneSecundario">Telefone secundario</Label><Input id="telefoneSecundario" value={formData.telefoneSecundario} onChange={(event) => setFormData({ ...formData, telefoneSecundario: event.target.value })} disabled={loading} /></div>
              </div>
            </TabsContent>

            <TabsContent value="organograma" className="space-y-4">
              {isEditMode ? (
                <>
                  <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">Lotacao operacional atual</h3>
                    {primaryAssignment ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-slate-700"><Building2 className="h-4 w-4" />{primaryAssignment.organizationalUnit?.nome || 'Sem unidade organizacional definida'}</div>
                        <div className="flex items-center gap-2 text-sm text-slate-700"><Briefcase className="h-4 w-4" />{primaryAssignment.position?.nome || 'Sem cargo operacional definido'}</div>
                        {primaryAssignment.function?.nome && <p className="text-sm text-slate-600">Funcao: {primaryAssignment.function.nome}</p>}
                        <p className="text-sm text-slate-600">Situacao: {primaryAssignment.situacao}</p>
                      </>
                    ) : (
                        <p className="text-sm text-amber-700">Este servidor ainda nao possui lotacao operacional registrada no organograma.</p>
                      )}
                  </div>
                  {initialUser?.id && <Button type="button" variant="outline" onClick={() => router.push(`/admin/organograma/lotacoes?userId=${initialUser.id}`)}><ArrowRightLeft className="mr-2 h-4 w-4" />Gerenciar lotacoes</Button>}
                </>
              ) : (
                <>
                  <div className="rounded-lg border bg-blue-50 p-4"><h3 className="text-sm font-semibold text-blue-900">Lotacao inicial obrigatoria</h3><p className="mt-1 text-sm text-blue-800">O servidor sera criado ja alinhado ao organograma usando o departamento principal selecionado.</p></div>
                  <div className="space-y-2"><Label>Departamento principal da lotacao</Label><div className="rounded-md border px-3 py-2 text-sm">{primaryDepartment ? primaryDepartment.name : 'Selecione um departamento principal na aba Basico'}</div></div>
                  <div className="space-y-2">
                    <Label htmlFor="organizationalUnitId">Setor / unidade organizacional *</Label>
                    <Select value={initialAssignment.organizationalUnitId} onValueChange={(value) => setInitialAssignment({ ...initialAssignment, organizationalUnitId: value, positionId: '', functionId: '' })} disabled={loading || !primaryDepartmentId || loadingOrganogram}>
                      <SelectTrigger id="organizationalUnitId"><SelectValue placeholder={loadingOrganogram ? 'Carregando...' : 'Selecione o setor'} /></SelectTrigger>
                      <SelectContent>{organizationalUnits.map((unit) => <SelectItem key={unit.id} value={unit.id}>{unit.sigla ? `${unit.sigla} - ${unit.nome}` : unit.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="positionId">Cargo operacional</Label>
                      <Select value={initialAssignment.positionId} onValueChange={(value) => setInitialAssignment({ ...initialAssignment, positionId: value, functionId: '' })} disabled={loading || !primaryDepartmentId || loadingOrganogram}>
                        <SelectTrigger id="positionId"><SelectValue placeholder="Selecione um cargo" /></SelectTrigger>
                        <SelectContent>{filteredPositions.map((position) => <SelectItem key={position.id} value={position.id}>{position.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="functionId">Funcao</Label>
                      <Select value={initialAssignment.functionId} onValueChange={(value) => setInitialAssignment({ ...initialAssignment, functionId: value })} disabled={loading || !primaryDepartmentId || loadingOrganogram || !initialAssignment.positionId}>
                        <SelectTrigger id="functionId"><SelectValue placeholder="Selecione uma funcao" /></SelectTrigger>
                        <SelectContent>{filteredFunctions.map((func) => <SelectItem key={func.id} value={func.id}>{func.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2"><Label htmlFor="assignmentStart">Inicio da lotacao</Label><Input id="assignmentStart" type="date" value={initialAssignment.dataInicio} onChange={(event) => setInitialAssignment({ ...initialAssignment, dataInicio: event.target.value })} disabled={loading} /></div>
                    <div className="space-y-2"><Label htmlFor="assignmentHours">Carga horaria</Label><Input id="assignmentHours" type="number" min="1" value={initialAssignment.cargaHoraria} onChange={(event) => setInitialAssignment({ ...initialAssignment, cargaHoraria: event.target.value })} disabled={loading} /></div>
                    <div className="space-y-2"><Label htmlFor="assignmentDedication">% dedicacao</Label><Input id="assignmentDedication" type="number" min="1" max="100" value={initialAssignment.percentualDedicacao} onChange={(event) => setInitialAssignment({ ...initialAssignment, percentualDedicacao: event.target.value })} disabled={loading} /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="assignmentNotes">Observacoes da lotacao inicial</Label><Textarea id="assignmentNotes" value={initialAssignment.observacoes} onChange={(event) => setInitialAssignment({ ...initialAssignment, observacoes: event.target.value })} rows={3} disabled={loading} /></div>
                </>
              )}
            </TabsContent>

            <TabsContent value="funcional" className="space-y-3">
              <div className="space-y-2"><Label htmlFor="cargoEfetivo">Cargo efetivo (informativo)</Label><Input id="cargoEfetivo" value={formData.cargoEfetivo} onChange={(event) => setFormData({ ...formData, cargoEfetivo: event.target.value })} disabled={loading} /><p className="text-xs text-muted-foreground">Campo legado apenas para referencia. O cargo operacional atual vem do vinculo funcional centralizado.</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="situacaoFuncional">Situacao funcional</Label>
                  <Select value={formData.situacaoFuncional} onValueChange={(value) => setFormData({ ...formData, situacaoFuncional: value })} disabled={loading}>
                    <SelectTrigger id="situacaoFuncional"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="ATIVO">Ativo</SelectItem><SelectItem value="APOSENTADO">Aposentado</SelectItem><SelectItem value="EXONERADO">Exonerado</SelectItem><SelectItem value="LICENCA">Em licenca</SelectItem><SelectItem value="AFASTADO">Afastado</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label htmlFor="dataAdmissao">Data de admissao</Label><Input id="dataAdmissao" type="date" value={formData.dataAdmissao} onChange={(event) => setFormData({ ...formData, dataAdmissao: event.target.value })} disabled={loading} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="observacoes">Observacoes administrativas</Label><Textarea id="observacoes" value={formData.observacoes} onChange={(event) => setFormData({ ...formData, observacoes: event.target.value })} rows={4} disabled={loading} /></div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => router.push(cancelHref)} disabled={loading} className="w-full sm:w-auto">Cancelar</Button>
            <Button type="submit" disabled={loading || availableRoles.length === 0} className="w-full sm:w-auto">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isEditMode ? 'Salvar alteracoes' : 'Criar servidor'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
