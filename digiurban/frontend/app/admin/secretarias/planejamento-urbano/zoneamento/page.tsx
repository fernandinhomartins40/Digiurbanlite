'use client'

import { useState } from 'react'
import { ModuleLayout } from '@/components/modules/ModuleLayout'
import { DataTable } from '@/components/modules/DataTable'
import { FormModal } from '@/components/modules/FormModal'
import { FilterBar } from '@/components/modules/FilterBar'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { urbanPlanningService } from '@/lib/services/urban-planning.service'
import { Badge } from '@/components/ui/badge'

export default function ZoneamentoPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState<any>(null)
  const [filters, setFilters] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)

  const columns = [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Nome' },
    { key: 'zoneType', label: 'Tipo' },
    { key: 'area', label: 'Área (m²)' },
    {
      key: 'active',
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
  ]

  const formFields = [
    {
      name: 'code',
      label: 'Código da Zona',
      type: 'text' as const,
      required: true,
      placeholder: 'Ex: ZR-1, ZC-2',
    },
    {
      name: 'name',
      label: 'Nome',
      type: 'text' as const,
      required: true,
      placeholder: 'Nome descritivo da zona',
    },
    {
      name: 'zoneType',
      label: 'Tipo de Zona',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'RESIDENCIAL', label: 'Residencial' },
        { value: 'COMERCIAL', label: 'Comercial' },
        { value: 'INDUSTRIAL', label: 'Industrial' },
        { value: 'MISTA', label: 'Mista' },
        { value: 'INSTITUCIONAL', label: 'Institucional' },
        { value: 'RURAL', label: 'Rural' },
        { value: 'PRESERVACAO', label: 'Preservação' },
        { value: 'ESPECIAL', label: 'Especial' },
      ],
    },
    {
      name: 'area',
      label: 'Área Total (m²)',
      type: 'number' as const,
      placeholder: '0',
    },
    {
      name: 'maxHeight',
      label: 'Altura Máxima (m)',
      type: 'number' as const,
      placeholder: 'Ex: 15',
    },
    {
      name: 'maxOccupationRate',
      label: 'Taxa de Ocupação Máxima (%)',
      type: 'number' as const,
      placeholder: '0-100',
    },
    {
      name: 'buildingCoefficient',
      label: 'Coeficiente de Aproveitamento',
      type: 'number' as const,
      placeholder: 'Ex: 2.5',
    },
    {
      name: 'permittedUses',
      label: 'Usos Permitidos',
      type: 'textarea' as const,
      placeholder: 'Liste os usos permitidos',
    },
    {
      name: 'restrictions',
      label: 'Restrições',
      type: 'textarea' as const,
      placeholder: 'Restrições e condições especiais',
    },
    {
      name: 'lawReference',
      label: 'Lei de Referência',
      type: 'text' as const,
      placeholder: 'Ex: Lei Municipal 1234/2020',
    },
    {
      name: 'effectiveDate',
      label: 'Data de Vigência',
      type: 'date' as const,
    },
  ]

  const filterConfig = [
    {
      type: 'search' as const,
      field: 'search',
      label: 'Buscar',
      placeholder: 'Buscar por código ou nome',
    },
    {
      type: 'select' as const,
      field: 'zoneType',
      label: 'Tipo',
      options: [
        { value: 'RESIDENCIAL', label: 'Residencial' },
        { value: 'COMERCIAL', label: 'Comercial' },
        { value: 'INDUSTRIAL', label: 'Industrial' },
        { value: 'MISTA', label: 'Mista' },
      ],
    },
  ]

  const handleSubmit = async (data: any) => {
    if (selectedZone?.id) {
      await urbanPlanningService.zoning.update(selectedZone.id, data)
    } else {
      await urbanPlanningService.zoning.create(data)
    }
    setRefreshKey((k) => k + 1)
    setSelectedZone(null)
  }

  const handleEdit = (zone: any) => {
    setSelectedZone(zone)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    await urbanPlanningService.zoning.delete(id)
    setRefreshKey((k) => k + 1)
  }

  return (
    <ModuleLayout
      title="Zoneamento Urbano"
      breadcrumb={[
        { label: 'Secretarias', href: '/admin/secretarias' },
        { label: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano' },
        { label: 'Zoneamento' },
      ]}
      actions={
        <Button onClick={() => {
          setSelectedZone(null)
          setModalOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Zona
        </Button>
      }
    >
      <FilterBar filters={filterConfig} onFilter={setFilters} />

      <DataTable
        key={refreshKey}
        endpoint="/api/secretarias/urban-planning/zoning"
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        filters={filters}
      />

      <FormModal
        title={selectedZone ? 'Editar Zona' : 'Nova Zona'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        fields={formFields}
        initialData={selectedZone || {}}
        onSubmit={handleSubmit}
      />
    </ModuleLayout>
  )
}
