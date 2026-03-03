'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface OrganizationalUnitOption {
  id: string
  nome: string
  sigla?: string
  tipo?: string
  department?: {
    id: string
    name: string
    code: string
  }
}

interface OrganizationalUnitAutocompleteProps {
  value: string
  onValueChange: (value: string) => void
  onSelect: (unit: OrganizationalUnitOption) => void
  label?: string
  placeholder?: string
  required?: boolean
  helperText?: string
  disabled?: boolean
  departmentId?: string
}

export function OrganizationalUnitAutocomplete({
  value,
  onValueChange,
  onSelect,
  label = 'Setor',
  placeholder = 'Digite o nome do setor...',
  required = false,
  helperText,
  disabled = false,
  departmentId,
}: OrganizationalUnitAutocompleteProps) {
  const { apiRequest } = useAdminAuth()
  const [units, setUnits] = useState<OrganizationalUnitOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const fetchUnits = useCallback(async (searchValue: string) => {
    const search = searchValue.trim()

    if (disabled) {
      setUnits([])
      setIsOpen(false)
      return
    }

    if (search.length > 0 && search.length < 2) {
      setUnits([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        isActive: 'true',
      })

      if (search) {
        params.set('search', search)
      }

      if (departmentId) {
        params.set('departmentId', departmentId)
      }

      const response = await apiRequest(`/organizational-units?${params.toString()}`)
      const data = Array.isArray(response) ? response : (response?.data ?? [])
      setUnits(data.slice(0, 10))
      setIsOpen(true)
      setHighlightedIndex(0)
    } catch (error) {
      console.error('Erro ao buscar unidades organizacionais:', error)
      setUnits([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, departmentId, disabled])

  useEffect(() => {
    const search = value.trim()

    if (!search || search.length < 2) {
      return
    }

    const timer = setTimeout(() => {
      fetchUnits(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [fetchUnits, value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (unit: OrganizationalUnitOption) => {
    onValueChange(unit.nome)
    onSelect(unit)
    setUnits([])
    setIsOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || units.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setHighlightedIndex(prev => (prev < units.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        event.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
        event.preventDefault()
        if (units[highlightedIndex]) {
          handleSelect(units[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div className="space-y-2" ref={wrapperRef}>
      {label && (
        <Label>
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input
          value={value}
          onChange={event => {
            onValueChange(event.target.value)
            if (!event.target.value.trim()) {
              setUnits([])
              setIsOpen(false)
            }
          }}
          onFocus={() => {
            const search = value.trim()
            if (!search) {
              void fetchUnits('')
              return
            }

            if (search.length >= 2) {
              if (units.length > 0) {
                setIsOpen(true)
                return
              }

              void fetchUnits(search)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
          disabled={disabled}
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600" />
          </div>
        )}
        {isOpen && units.length > 0 && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
            {units.map((unit, index) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => handleSelect(unit)}
                className={cn(
                  'w-full border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50',
                  highlightedIndex === index && 'bg-blue-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Building2 size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-gray-900">{unit.nome}</div>
                    <div className="truncate text-sm text-gray-500">
                      {[unit.tipo, unit.sigla, unit.department?.name].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {isOpen && value.trim().length >= 2 && units.length === 0 && !isLoading && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-300 bg-white p-4 text-center text-gray-500 shadow-lg">
            Nenhuma unidade encontrada
          </div>
        )}
      </div>

      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  )
}
