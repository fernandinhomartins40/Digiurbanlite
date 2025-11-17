'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pill, Search, AlertTriangle, CheckCircle, Package, User, FileText, Calendar, Clock } from 'lucide-react'

interface Medication {
  id: string
  name: string
  activeIngredient: string
  dosage: string
  form: string // comprimido, xarope, injeção, etc.
  currentStock: number
  minimumStock: number
  unitCost: number
  expirationDate: string
  batch: string
  category: string
}

interface Dispensation {
  id: string
  medicationId: string
  medicationName: string
  patientName: string
  patientCpf: string
  quantity: number
  dispensedAt: string
  dispensedBy: string
  prescriptionId?: string
  observations?: string
  status: 'dispensed' | 'returned' | 'expired'
}

interface DispensacaoMedicamentosProps {
  onDispenseComplete?: (dispensation: Partial<Dispensation>) => void
  onStockAlert?: (medication: Medication) => void
}

export default function DispensacaoMedicamentos({
  onDispenseComplete,
  onStockAlert
}: DispensacaoMedicamentosProps) {
  const [medications, setMedications] = useState<Medication[]>([])
  const [dispensations, setDispensations] = useState<Dispensation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'dispense' | 'stock' | 'history'>('dispense')
  const [showDispenseForm, setShowDispenseForm] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)

  // Estados do formulário de dispensação
  const [formData, setFormData] = useState({
    patientName: '',
    patientCpf: '',
    quantity: 1,
    prescriptionId: '',
    observations: ''
  })

  // Mock data
  useEffect(() => {
    const mockMedications: Medication[] = [
      {
        id: '1',
        name: 'Paracetamol 500mg',
        activeIngredient: 'Paracetamol',
        dosage: '500mg',
        form: 'Comprimido',
        currentStock: 450,
        minimumStock: 100,
        unitCost: 0.15,
        expirationDate: '2025-12-31',
        batch: 'PAR2024001',
        category: 'Analgésico'
      },
      {
        id: '2',
        name: 'Dipirona 500mg',
        activeIngredient: 'Dipirona Sódica',
        dosage: '500mg',
        form: 'Comprimido',
        currentStock: 25,
        minimumStock: 50,
        unitCost: 0.12,
        expirationDate: '2025-06-30',
        batch: 'DIP2024002',
        category: 'Analgésico'
      },
      {
        id: '3',
        name: 'Amoxicilina 500mg',
        activeIngredient: 'Amoxicilina',
        dosage: '500mg',
        form: 'Cápsula',
        currentStock: 180,
        minimumStock: 75,
        unitCost: 0.45,
        expirationDate: '2025-08-15',
        batch: 'AMO2024003',
        category: 'Antibiótico'
      },
      {
        id: '4',
        name: 'Insulina NPH',
        activeIngredient: 'Insulina Humana NPH',
        dosage: '100UI/mL',
        form: 'Frasco',
        currentStock: 5,
        minimumStock: 10,
        unitCost: 12.50,
        expirationDate: '2024-12-31',
        batch: 'INS2024004',
        category: 'Hormônio'
      }
    ]

    const mockDispensations: Dispensation[] = [
      {
        id: '1',
        medicationId: '1',
        medicationName: 'Paracetamol 500mg',
        patientName: 'Maria Silva',
        patientCpf: '123.456.789-01',
        quantity: 20,
        dispensedAt: '2024-01-15T10:30:00',
        dispensedBy: 'João Farmacêutico',
        prescriptionId: 'REC001',
        observations: 'Uso por 10 dias',
        status: 'dispensed'
      },
      {
        id: '2',
        medicationId: '3',
        medicationName: 'Amoxicilina 500mg',
        patientName: 'Pedro Oliveira',
        patientCpf: '987.654.321-01',
        quantity: 21,
        dispensedAt: '2024-01-15T14:15:00',
        dispensedBy: 'João Farmacêutico',
        prescriptionId: 'REC002',
        observations: 'Tratamento de 7 dias, 3x ao dia',
        status: 'dispensed'
      }
    ]

    setMedications(mockMedications)
    setDispensations(mockDispensations)

    // Verificar medicamentos com estoque baixo
    mockMedications.forEach(med => {
      if (med.currentStock <= med.minimumStock) {
        onStockAlert?.(med)
      }
    })
  }, [onStockAlert])

  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockMedications = medications.filter(med => med.currentStock <= med.minimumStock)

  const handleDispense = () => {
    if (!selectedMedication || !formData.patientName || !formData.patientCpf) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    if (formData.quantity > selectedMedication.currentStock) {
      alert('Quantidade solicitada maior que o estoque disponível')
      return
    }

    const newDispensation: Dispensation = {
      id: Date.now().toString(),
      medicationId: selectedMedication.id,
      medicationName: selectedMedication.name,
      patientName: formData.patientName,
      patientCpf: formData.patientCpf,
      quantity: formData.quantity,
      dispensedAt: new Date().toISOString(),
      dispensedBy: 'Usuário Atual', // Seria obtido do contexto de autenticação
      prescriptionId: formData.prescriptionId || undefined,
      observations: formData.observations || undefined,
      status: 'dispensed'
    }

    // Atualizar estoque
    setMedications(prev => prev.map(med =>
      med.id === selectedMedication.id
        ? { ...med, currentStock: med.currentStock - formData.quantity }
        : med
    ))

    // Adicionar dispensação
    setDispensations(prev => [newDispensation, ...prev])

    // Callback
    onDispenseComplete?.(newDispensation)

    // Reset form
    setFormData({
      patientName: '',
      patientCpf: '',
      quantity: 1,
      prescriptionId: '',
      observations: ''
    })
    setSelectedMedication(null)
    setShowDispenseForm(false)
    setActiveTab('history')
  }

  const getStockStatus = (medication: Medication) => {
    if (medication.currentStock === 0) {
      return { status: 'out', color: 'bg-red-100 text-red-800', label: 'Sem Estoque' }
    } else if (medication.currentStock <= medication.minimumStock) {
      return { status: 'low', color: 'bg-yellow-100 text-yellow-800', label: 'Estoque Baixo' }
    } else {
      return { status: 'good', color: 'bg-green-100 text-green-800', label: 'Em Estoque' }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Pill className="w-6 h-6 mr-2 text-blue-600" />
          Dispensação de Medicamentos
        </h2>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar medicamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={() => setShowDispenseForm(true)}>
            <Pill className="w-4 h-4 mr-2" />
            Nova Dispensação
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {lowStockMedications.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">
                {lowStockMedications.length} medicamento(s) com estoque baixo
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'dispense' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('dispense')}
          className="flex-1"
        >
          <Pill className="w-4 h-4 mr-2" />
          Dispensar
        </Button>
        <Button
          variant={activeTab === 'stock' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('stock')}
          className="flex-1"
        >
          <Package className="w-4 h-4 mr-2" />
          Estoque
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('history')}
          className="flex-1"
        >
          <Clock className="w-4 h-4 mr-2" />
          Histórico
        </Button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'dispense' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedications.map((medication) => {
            const stockStatus = getStockStatus(medication)

            return (
              <Card key={medication.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{medication.name}</h3>
                      <p className="text-sm text-gray-500">{medication.activeIngredient}</p>
                      <p className="text-xs text-gray-400">{medication.form} - {medication.dosage}</p>
                    </div>
                    <Badge className={stockStatus.color}>
                      {stockStatus.label}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Estoque:</span>
                      <span className="font-medium">{medication.currentStock} unidades</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Lote:</span>
                      <span>{medication.batch}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Validade:</span>
                      <span>{new Date(medication.expirationDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={medication.currentStock === 0}
                    onClick={() => {
                      setSelectedMedication(medication)
                      setShowDispenseForm(true)
                    }}
                  >
                    {medication.currentStock === 0 ? 'Sem Estoque' : 'Dispensar'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {activeTab === 'stock' && (
        <Card>
          <CardHeader>
            <CardTitle>Controle de Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Medicamento</th>
                    <th className="text-left p-2">Categoria</th>
                    <th className="text-left p-2">Estoque</th>
                    <th className="text-left p-2">Mín.</th>
                    <th className="text-left p-2">Lote</th>
                    <th className="text-left p-2">Validade</th>
                    <th className="text-left p-2">Valor Unit.</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((medication) => {
                    const stockStatus = getStockStatus(medication)

                    return (
                      <tr key={medication.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{medication.name}</div>
                            <div className="text-sm text-gray-500">{medication.activeIngredient}</div>
                          </div>
                        </td>
                        <td className="p-2">{medication.category}</td>
                        <td className="p-2 font-medium">{medication.currentStock}</td>
                        <td className="p-2 text-gray-600">{medication.minimumStock}</td>
                        <td className="p-2">{medication.batch}</td>
                        <td className="p-2">
                          {new Date(medication.expirationDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-2">{formatCurrency(medication.unitCost)}</td>
                        <td className="p-2">
                          <Badge className={stockStatus.color}>
                            {stockStatus.label}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Dispensações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dispensations.map((dispensation) => (
                <Card key={dispensation.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Pill className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{dispensation.medicationName}</span>
                        <Badge variant="outline">{dispensation.quantity} unidades</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Paciente:</span>
                          <div className="font-medium">{dispensation.patientName}</div>
                          <div className="text-gray-500">{dispensation.patientCpf}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Dispensado por:</span>
                          <div>{dispensation.dispensedBy}</div>
                          <div className="text-gray-500">
                            {new Date(dispensation.dispensedAt).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      {dispensation.prescriptionId && (
                        <div className="mt-2">
                          <span className="text-gray-600 text-sm">Receita: </span>
                          <span className="text-sm font-medium">{dispensation.prescriptionId}</span>
                        </div>
                      )}

                      {dispensation.observations && (
                        <div className="mt-2">
                          <span className="text-gray-600 text-sm">Observações: </span>
                          <span className="text-sm">{dispensation.observations}</span>
                        </div>
                      )}
                    </div>

                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Dispensado
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Dispensação */}
      {showDispenseForm && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-md my-8">
            <Card className="w-full max-h-[calc(100vh-4rem)] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Dispensar Medicamento</CardTitle>
                <div className="text-sm text-gray-600">
                  {selectedMedication.name} - Estoque: {selectedMedication.currentStock} unidades
                </div>
              </CardHeader>
              <CardContent className="space-y-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <Label htmlFor="patientName">Nome do Paciente *</Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                  placeholder="Nome completo do paciente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientCpf">CPF do Paciente *</Label>
                <Input
                  id="patientCpf"
                  value={formData.patientCpf}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientCpf: e.target.value }))}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedMedication.currentStock}
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prescriptionId">ID da Receita</Label>
                <Input
                  id="prescriptionId"
                  value={formData.prescriptionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, prescriptionId: e.target.value }))}
                  placeholder="Número da receita médica"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Instruções de uso, dosagem, etc."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2 pt-4 flex-shrink-0 sticky bottom-0 bg-white border-t -mx-6 px-6 py-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDispenseForm(false)
                    setSelectedMedication(null)
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={handleDispense} className="flex-1">
                  <Pill className="w-4 h-4 mr-2" />
                  Dispensar
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