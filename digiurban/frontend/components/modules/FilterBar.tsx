'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'

interface Filter {
  type: 'search' | 'select' | 'date'
  field: string
  label: string
  placeholder?: string
  options?: { value: string; label: string }[]
}

interface FilterBarProps {
  filters: Filter[]
  onFilter: (filters: Record<string, any>) => void
}

export function FilterBar({ filters, onFilter }: FilterBarProps) {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})

  const handleFilterChange = (field: string, value: any) => {
    const newFilters = { ...filterValues, [field]: value }
    setFilterValues(newFilters)
    onFilter(newFilters)
  }

  const handleClearFilters = () => {
    setFilterValues({})
    onFilter({})
  }

  const hasActiveFilters = Object.values(filterValues).some(
    (value) => value !== '' && value !== undefined
  )

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {filters.map((filter) => {
        switch (filter.type) {
          case 'search':
            return (
              <div key={filter.field} className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={filter.placeholder || `Buscar por ${filter.label.toLowerCase()}...`}
                    value={filterValues[filter.field] || ''}
                    onChange={(e) =>
                      handleFilterChange(filter.field, e.target.value)
                    }
                    className="pl-8"
                  />
                </div>
              </div>
            )

          case 'select':
            return (
              <div key={filter.field} className="min-w-[180px]">
                <Select
                  value={filterValues[filter.field] || ''}
                  onValueChange={(value) =>
                    handleFilterChange(filter.field, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={filter.placeholder || filter.label}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {filter.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )

          case 'date':
            return (
              <div key={filter.field} className="min-w-[180px]">
                <Input
                  type="date"
                  value={filterValues[filter.field] || ''}
                  onChange={(e) =>
                    handleFilterChange(filter.field, e.target.value)
                  }
                  placeholder={filter.placeholder}
                />
              </div>
            )

          default:
            return null
        }
      })}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearFilters}
          title="Limpar filtros"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
