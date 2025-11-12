'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  GraduationCap,
  Users,
  School,
  FileText,
  Search,
  Plus,
  UserPlus,
  Calendar,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
  Clock,
  FileCheck
} from 'lucide-react'

interface Student {
  id: string
  registrationNumber: string
  studentName: string
  studentCpf: string
  studentBirthDate: string
  parentName: string
  parentCpf: string
  parentPhone?: string
  address?: string
  schoolId: string
  schoolName: string
  grade: string
  schoolYear: number
  needsTransport: boolean
  hasSpecialNeeds: boolean
  specialNeedsDescription?: string
  observations?: string
  status: 'pending' | 'active' | 'transferred' | 'concluded' | 'canceled'
  enrolledAt: string
  enrolledBy: string
}

interface School {
  id: string
  name: string
  address: string
  phone?: string
  capacity: number
  currentStudents: number
  grades: string[]
}

interface SistemaMatriculasProps {
  onStudentEnroll?: (student: Partial<Student>) => void
  onTransferRequest?: (studentId: string, newSchoolId: string) => void
}

export default function SistemaMatriculas({
  onStudentEnroll,
  onTransferRequest
}: SistemaMatriculasProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterSchool, setFilterSchool] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [activeTab, setActiveTab] = useState<'list' | 'enroll' | 'reports'>('list')
  const [showEnrollForm, setShowEnrollForm] = useState(false)

  // Estados do formulário de matrícula
  const [enrollForm, setEnrollForm] = useState({
    studentName: '',
    studentCpf: '',
    studentBirthDate: '',
    parentName: '',
    parentCpf: '',
    parentPhone: '',
    address: '',
    schoolId: '',
    grade: '',
    needsTransport: false,
    hasSpecialNeeds: false,
    specialNeedsDescription: '',
    observations: ''
  })

  const grades = [
    'Berçário', 'Maternal I', 'Maternal II', 'Pré I', 'Pré II',
    '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano',
    '6º Ano', '7º Ano', '8º Ano', '9º Ano'
  ]

  // Mock data
  useEffect(() => {
    const mockSchools: School[] = [
      {
        id: '1',
        name: 'EMEI Pequenos Sonhadores',
        address: 'Rua das Flores, 123 - Centro',
        phone: '(11) 3333-1111',
        capacity: 200,
        currentStudents: 185,
        grades: ['Berçário', 'Maternal I', 'Maternal II', 'Pré I', 'Pré II']
      },
      {
        id: '2',
        name: 'EMEF José da Silva',
        address: 'Av. Principal, 456 - Vila Nova',
        phone: '(11) 3333-2222',
        capacity: 500,
        currentStudents: 420,
        grades: ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano']
      },
      {
        id: '3',
        name: 'EMEF Maria Santos',
        address: 'Rua da Escola, 789 - Jardim América',
        phone: '(11) 3333-3333',
        capacity: 600,
        currentStudents: 550,
        grades: ['6º Ano', '7º Ano', '8º Ano', '9º Ano']
      }
    ]

    const mockStudents: Student[] = [
      {
        id: '1',
        registrationNumber: '2024001',
        studentName: 'Ana Clara Silva',
        studentCpf: '123.456.789-01',
        studentBirthDate: '2010-03-15',
        parentName: 'Maria Silva',
        parentCpf: '987.654.321-01',
        parentPhone: '(11) 99999-1111',
        address: 'Rua A, 100 - Centro',
        schoolId: '2',
        schoolName: 'EMEF José da Silva',
        grade: '4º Ano',
        schoolYear: 2024,
        needsTransport: true,
        hasSpecialNeeds: false,
        observations: 'Estudante dedicada',
        status: 'active',
        enrolledAt: '2024-01-15T08:00:00',
        enrolledBy: 'João Secretário'
      },
      {
        id: '2',
        registrationNumber: '2024002',
        studentName: 'Pedro Henrique Costa',
        studentCpf: '111.222.333-44',
        studentBirthDate: '2012-07-22',
        parentName: 'Carlos Costa',
        parentCpf: '444.555.666-77',
        parentPhone: '(11) 88888-2222',
        address: 'Av. B, 200 - Vila Nova',
        schoolId: '2',
        schoolName: 'EMEF José da Silva',
        grade: '2º Ano',
        schoolYear: 2024,
        needsTransport: false,
        hasSpecialNeeds: true,
        specialNeedsDescription: 'Necessita de acompanhamento para TDAH',
        status: 'active',
        enrolledAt: '2024-01-20T10:30:00',
        enrolledBy: 'João Secretário'
      },
      {
        id: '3',
        registrationNumber: '2024003',
        studentName: 'Isabela Oliveira',
        studentCpf: '555.666.777-88',
        studentBirthDate: '2018-11-05',
        parentName: 'Ana Oliveira',
        parentCpf: '999.888.777-66',
        parentPhone: '(11) 77777-3333',
        address: 'Rua C, 300 - Jardim América',
        schoolId: '1',
        schoolName: 'EMEI Pequenos Sonhadores',
        grade: 'Pré II',
        schoolYear: 2024,
        needsTransport: true,
        hasSpecialNeeds: false,
        status: 'pending',
        enrolledAt: '2024-01-25T14:15:00',
        enrolledBy: 'Maria Coordenadora'
      }
    ]

    setSchools(mockSchools)
    setStudents(mockStudents)
  }, [])

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.registrationNumber.includes(searchTerm) ||
                         student.parentName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGrade = !filterGrade || student.grade === filterGrade
    const matchesSchool = !filterSchool || student.schoolId === filterSchool
    const matchesStatus = !filterStatus || student.status === filterStatus

    return matchesSearch && matchesGrade && matchesSchool && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'transferred': return 'bg-blue-100 text-blue-800'
      case 'concluded': return 'bg-purple-100 text-purple-800'
      case 'canceled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'pending': return 'Pendente'
      case 'transferred': return 'Transferido'
      case 'concluded': return 'Concluído'
      case 'canceled': return 'Cancelado'
      default: return 'Desconhecido'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'transferred': return <FileCheck className="w-4 h-4" />
      case 'concluded': return <GraduationCap className="w-4 h-4" />
      case 'canceled': return <AlertCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const handleEnrollSubmit = () => {
    if (!enrollForm.studentName || !enrollForm.studentCpf || !enrollForm.parentName ||
        !enrollForm.parentCpf || !enrollForm.schoolId || !enrollForm.grade) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    // Gerar número de matrícula
    const year = new Date().getFullYear()
    const nextNumber = students.length + 1
    const registrationNumber = `${year}${nextNumber.toString().padStart(3, '0')}`

    const selectedSchool = schools.find(s => s.id === enrollForm.schoolId)

    const newStudent: Student = {
      id: Date.now().toString(),
      registrationNumber,
      studentName: enrollForm.studentName,
      studentCpf: enrollForm.studentCpf,
      studentBirthDate: enrollForm.studentBirthDate,
      parentName: enrollForm.parentName,
      parentCpf: enrollForm.parentCpf,
      parentPhone: enrollForm.parentPhone || undefined,
      address: enrollForm.address || undefined,
      schoolId: enrollForm.schoolId,
      schoolName: selectedSchool?.name || '',
      grade: enrollForm.grade,
      schoolYear: year,
      needsTransport: enrollForm.needsTransport,
      hasSpecialNeeds: enrollForm.hasSpecialNeeds,
      specialNeedsDescription: enrollForm.specialNeedsDescription || undefined,
      observations: enrollForm.observations || undefined,
      status: 'pending',
      enrolledAt: new Date().toISOString(),
      enrolledBy: 'Usuário Atual'
    }

    setStudents(prev => [newStudent, ...prev])
    onStudentEnroll?.(newStudent)

    // Reset form
    setEnrollForm({
      studentName: '',
      studentCpf: '',
      studentBirthDate: '',
      parentName: '',
      parentCpf: '',
      parentPhone: '',
      address: '',
      schoolId: '',
      grade: '',
      needsTransport: false,
      hasSpecialNeeds: false,
      specialNeedsDescription: '',
      observations: ''
    })

    setShowEnrollForm(false)
    setActiveTab('list')
  }

  const getSchoolCapacityStatus = (school: School) => {
    const percentage = (school.currentStudents / school.capacity) * 100

    if (percentage >= 100) {
      return { color: 'text-red-600', label: 'Lotada', canEnroll: false }
    } else if (percentage >= 90) {
      return { color: 'text-yellow-600', label: 'Quase Lotada', canEnroll: true }
    } else {
      return { color: 'text-green-600', label: 'Vagas Disponíveis', canEnroll: true }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <GraduationCap className="w-6 h-6 mr-2 text-blue-600" />
          Sistema de Matrículas
        </h2>

        <Button onClick={() => setShowEnrollForm(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Nova Matrícula
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, matrícula ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Série/Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as séries</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSchool} onValueChange={setFilterSchool}>
              <SelectTrigger>
                <SelectValue placeholder="Escola" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as escolas</SelectItem>
                {schools.map(school => (
                  <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="transferred">Transferido</SelectItem>
                <SelectItem value="concluded">Concluído</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'list' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('list')}
          className="flex-1"
        >
          <Users className="w-4 h-4 mr-2" />
          Lista de Estudantes
        </Button>
        <Button
          variant={activeTab === 'enroll' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('enroll')}
          className="flex-1"
        >
          <School className="w-4 h-4 mr-2" />
          Escolas
        </Button>
        <Button
          variant={activeTab === 'reports' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('reports')}
          className="flex-1"
        >
          <FileText className="w-4 h-4 mr-2" />
          Relatórios
        </Button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Estudantes</p>
                    <p className="text-2xl font-bold">{students.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Matrículas Ativas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {students.filter(s => s.status === 'active').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {students.filter(s => s.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Transporte Escolar</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {students.filter(s => s.needsTransport).length}
                    </p>
                  </div>
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de estudantes */}
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Dados do Estudante */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{student.registrationNumber}</Badge>
                          <Badge className={getStatusColor(student.status)}>
                            {getStatusIcon(student.status)}
                            <span className="ml-1">{getStatusLabel(student.status)}</span>
                          </Badge>
                        </div>
                        <h3 className="font-medium text-lg">{student.studentName}</h3>
                        <p className="text-sm text-gray-600">{student.studentCpf}</p>
                        <p className="text-sm text-gray-500">
                          Nascimento: {new Date(student.studentBirthDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      {/* Dados do Responsável */}
                      <div>
                        <h4 className="font-medium mb-1">Responsável</h4>
                        <p className="text-sm">{student.parentName}</p>
                        <p className="text-sm text-gray-600">{student.parentCpf}</p>
                        {student.parentPhone && (
                          <p className="text-sm text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {student.parentPhone}
                          </p>
                        )}
                      </div>

                      {/* Dados Escolares */}
                      <div>
                        <h4 className="font-medium mb-1">Dados Escolares</h4>
                        <p className="text-sm">{student.schoolName}</p>
                        <p className="text-sm text-gray-600">{student.grade} - {student.schoolYear}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          {student.needsTransport && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              Transporte
                            </Badge>
                          )}
                          {student.hasSpecialNeeds && (
                            <Badge variant="outline" className="text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Necessidades Especiais
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>

                  {student.observations && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm"><strong>Observações:</strong> {student.observations}</p>
                    </div>
                  )}

                  {student.specialNeedsDescription && (
                    <div className="mt-2 p-3 bg-yellow-50 rounded">
                      <p className="text-sm"><strong>Necessidades Especiais:</strong> {student.specialNeedsDescription}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'enroll' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schools.map((school) => {
            const capacityStatus = getSchoolCapacityStatus(school)

            return (
              <Card key={school.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <School className="w-8 h-8 text-blue-600" />
                    <Badge className={`${capacityStatus.color} bg-transparent`}>
                      {capacityStatus.label}
                    </Badge>
                  </div>

                  <h3 className="font-medium text-lg mb-2">{school.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{school.address}</p>

                  {school.phone && (
                    <p className="text-sm text-gray-500 flex items-center mb-3">
                      <Phone className="w-3 h-3 mr-1" />
                      {school.phone}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Capacidade:</span>
                      <span className="font-medium">{school.capacity} alunos</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Estudantes:</span>
                      <span className="font-medium">{school.currentStudents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Vagas disponíveis:</span>
                      <span className={`font-medium ${capacityStatus.color}`}>
                        {school.capacity - school.currentStudents}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Séries oferecidas:</h4>
                    <div className="flex flex-wrap gap-1">
                      {school.grades.map(grade => (
                        <Badge key={grade} variant="outline" className="text-xs">
                          {grade}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={!capacityStatus.canEnroll}
                    onClick={() => {
                      setEnrollForm(prev => ({ ...prev, schoolId: school.id }))
                      setShowEnrollForm(true)
                    }}
                  >
                    {capacityStatus.canEnroll ? 'Matricular Aqui' : 'Sem Vagas'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Matrículas por Série</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {grades.map(grade => {
                  const count = students.filter(s => s.grade === grade && s.status === 'active').length
                  return (
                    <div key={grade} className="flex justify-between items-center">
                      <span className="text-sm">{grade}</span>
                      <Badge variant="outline">{count} alunos</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total de matrículas ativas:</span>
                  <span className="font-bold">{students.filter(s => s.status === 'active').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Necessitam transporte:</span>
                  <span className="font-bold">{students.filter(s => s.needsTransport).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Necessidades especiais:</span>
                  <span className="font-bold">{students.filter(s => s.hasSpecialNeeds).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Matrículas pendentes:</span>
                  <span className="font-bold text-yellow-600">
                    {students.filter(s => s.status === 'pending').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Nova Matrícula */}
      {showEnrollForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8">
            <Card className="w-full max-h-[calc(100vh-4rem)] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Nova Matrícula</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 overflow-y-auto flex-1">
              {/* Dados do Estudante */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados do Estudante</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Nome Completo *</Label>
                    <Input
                      id="studentName"
                      value={enrollForm.studentName}
                      onChange={(e) => setEnrollForm(prev => ({ ...prev, studentName: e.target.value }))}
                      placeholder="Nome completo do estudante"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentCpf">CPF *</Label>
                    <Input
                      id="studentCpf"
                      value={enrollForm.studentCpf}
                      onChange={(e) => setEnrollForm(prev => ({ ...prev, studentCpf: e.target.value }))}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentBirthDate">Data de Nascimento *</Label>
                    <Input
                      id="studentBirthDate"
                      type="date"
                      value={enrollForm.studentBirthDate}
                      onChange={(e) => setEnrollForm(prev => ({ ...prev, studentBirthDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Responsável */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados do Responsável</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentName">Nome Completo *</Label>
                    <Input
                      id="parentName"
                      value={enrollForm.parentName}
                      onChange={(e) => setEnrollForm(prev => ({ ...prev, parentName: e.target.value }))}
                      placeholder="Nome completo do responsável"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentCpf">CPF *</Label>
                    <Input
                      id="parentCpf"
                      value={enrollForm.parentCpf}
                      onChange={(e) => setEnrollForm(prev => ({ ...prev, parentCpf: e.target.value }))}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">Telefone</Label>
                    <Input
                      id="parentPhone"
                      value={enrollForm.parentPhone}
                      onChange={(e) => setEnrollForm(prev => ({ ...prev, parentPhone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Input
                    id="address"
                    value={enrollForm.address}
                    onChange={(e) => setEnrollForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, bairro, CEP"
                  />
                </div>
              </div>

              {/* Dados Escolares */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados Escolares</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolId">Escola *</Label>
                    <Select value={enrollForm.schoolId} onValueChange={(value) =>
                      setEnrollForm(prev => ({ ...prev, schoolId: value, grade: '' }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a escola" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map(school => {
                          const capacityStatus = getSchoolCapacityStatus(school)
                          return (
                            <SelectItem
                              key={school.id}
                              value={school.id}
                              disabled={!capacityStatus.canEnroll}
                            >
                              {school.name} {!capacityStatus.canEnroll && '(Sem vagas)'}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade">Série/Ano *</Label>
                    <Select value={enrollForm.grade} onValueChange={(value) =>
                      setEnrollForm(prev => ({ ...prev, grade: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a série" />
                      </SelectTrigger>
                      <SelectContent>
                        {enrollForm.schoolId &&
                          schools.find(s => s.id === enrollForm.schoolId)?.grades.map(grade => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações Adicionais</h3>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="needsTransport"
                      checked={enrollForm.needsTransport}
                      onCheckedChange={(checked) =>
                        setEnrollForm(prev => ({ ...prev, needsTransport: checked as boolean }))
                      }
                    />
                    <Label htmlFor="needsTransport">Necessita transporte escolar</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasSpecialNeeds"
                      checked={enrollForm.hasSpecialNeeds}
                      onCheckedChange={(checked) =>
                        setEnrollForm(prev => ({ ...prev, hasSpecialNeeds: checked as boolean }))
                      }
                    />
                    <Label htmlFor="hasSpecialNeeds">Possui necessidades especiais</Label>
                  </div>

                  {enrollForm.hasSpecialNeeds && (
                    <div className="space-y-2">
                      <Label htmlFor="specialNeedsDescription">Descrição das necessidades especiais</Label>
                      <Textarea
                        id="specialNeedsDescription"
                        value={enrollForm.specialNeedsDescription}
                        onChange={(e) => setEnrollForm(prev => ({ ...prev, specialNeedsDescription: e.target.value }))}
                        placeholder="Descreva as necessidades especiais do estudante"
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea
                      id="observations"
                      value={enrollForm.observations}
                      onChange={(e) => setEnrollForm(prev => ({ ...prev, observations: e.target.value }))}
                      placeholder="Informações adicionais sobre o estudante"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 flex-shrink-0 sticky bottom-0 bg-white border-t -mx-6 px-6 py-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEnrollForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={handleEnrollSubmit} className="flex-1">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Confirmar Matrícula
                </Button>
              </div>
            </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}