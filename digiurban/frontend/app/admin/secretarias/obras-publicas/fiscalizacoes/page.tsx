'use client'

import { useState } from 'react'
import { ModuleLayout } from '@/components/modules/ModuleLayout'
import { DataTable } from '@/components/modules/DataTable'
import { FormModal } from '@/components/modules/FormModal'
import { FilterBar } from '@/components/modules/FilterBar'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { publicWorksService } from '@/lib/services/public-works.service'
import { Badge } from '@/components/ui/badge'

export default function FiscalizacoesObrasPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<any>(null)
  const [filters, setFilters] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)

  const columns = [
    { key: 'protocol', label: 'Protocolo' },
    { key: 'work.name', label: 'Obra', render: (_: any, row: any) => row.work?.name || '-' },
    {
      key: 'inspectionDate',
      label: 'Data',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR'),
    },
    { key: 'inspector', label: 'Fiscal' },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => {
        const variants: Record<string, any> = {
          APROVADA: 'default',
          PENDENTE_CORRECAO: 'secondary',
          REPROVADA: 'destructive',
        }
        return <Badge variant={variants[value] || 'secondary'}>{value}</Badge>
      },
    },
  ]

  const formFields = [
    {
      name: 'workId',
      label: 'Obra',
      type: 'text' as const,
      required: true,
      placeholder: 'ID da obra',
    },
    {
      name: 'inspectionDate',
      label: 'Data da Fiscalização',
      type: 'date' as const,
      required: true,
    },
    {
      name: 'inspectionTime',
      label: 'Horário',
      type: 'text' as const,
      placeholder: 'HH:MM',
    },
    {
      name: 'inspector',
      label: 'Fiscal Responsável',
      type: 'text' as const,
      required: true,
      placeholder: 'Nome do fiscal',
    },
    {
      name: 'inspectionType',
      label: 'Tipo de Fiscalização',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'INICIO_OBRA', label: 'Início de Obra' },
        { value: 'ROTINA', label: 'Rotina' },
        { value: 'DENUNCIA', label: 'Por Denúncia' },
        { value: 'CONCLUSAO', label: 'Conclusão' },
        { value: 'ESPECIAL', label: 'Especial' },
      ],
    },
    {
      name: 'progressPercentage',
      label: 'Progresso Verificado (%)',
      type: 'number' as const,
      placeholder: '0-100',
    },
    {
      name: 'findings',
      label: 'Constatações',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Descreva as constatações da fiscalização',
    },
    {
      name: 'irregularities',
      label: 'Irregularidades Encontradas',
      type: 'textarea' as const,
      placeholder: 'Liste irregularidades (se houver)',
    },
    {
      name: 'recommendations',
      label: 'Recomendações',
      type: 'textarea' as const,
      placeholder: 'Recomendações e observações',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'APROVADA', label: 'Aprovada' },
        { value: 'PENDENTE_CORRECAO', label: 'Pendente Correção' },
        { value: 'REPROVADA', label: 'Reprovada' },
      ],
    },
    {
      name: 'deadline',
      label: 'Prazo para Correções',
      type: 'date' as const,
    },
  ]

  const filterConfig = [
    {
      type: 'search' as const,
      field: 'search',
      label: 'Buscar',
      placeholder: 'Buscar por protocolo',
    },
    {
      type: 'select' as const,
      field: 'status',
      label: 'Status',
      options: [
        { value: 'APROVADA', label: 'Aprovada' },
        { value: 'PENDENTE_CORRECAO', label: 'Pendente Correção' },
        { value: 'REPROVADA', label: 'Reprovada' },
      ],
    },
    {
      type: 'date' as const,
      field: 'inspectionDate',
      label: 'Data',
    },
  ]

  const handleSubmit = async (data: any) => {
    if (selectedInspection?.id) {
      await publicWorksService.inspections.update(selectedInspection.id, data)
    } else {
      await publicWorksService.inspections.create(data)
    }
    setRefreshKey((k) => k + 1)
    setSelectedInspection(null)
  }

  const handleEdit = (inspection: any) => {
    setSelectedInspection(inspection)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    await publicWorksService.inspections.delete(id)
    setRefreshKey((k) => k + 1)
  }

  return (
    <ModuleLayout
      title="Fiscalizações de Obras"
      breadcrumb={[
        { label: 'Secretarias', href: '/admin/secretarias' },
        { label: 'Obras Públicas', href: '/admin/secretarias/obras-publicas' },
        { label: 'Fiscalizações' },
      ]}
      actions={
        <Button onClick={() => {
          setSelectedInspection(null)
          setModalOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Fiscalização
        </Button>
      }
    >
      <FilterBar filters={filterConfig} onFilter={setFilters} />

      <DataTable
        key={refreshKey}
        endpoint="/api/secretarias/public-works/inspections"
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        filters={filters}
      />

      <FormModal
        title={selectedInspection ? 'Editar Fiscalização' : 'Nova Fiscalização'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        fields={formFields}
        initialData={selectedInspection || {}}
        onSubmit={handleSubmit}
      />
    </ModuleLayout>
  )
}
