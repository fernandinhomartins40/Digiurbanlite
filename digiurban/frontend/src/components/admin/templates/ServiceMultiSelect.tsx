'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Service {
  id: string
  name: string
}

interface ServiceMultiSelectProps {
  services: Service[]
  selectedServiceIds: string[]
  onChange: (serviceIds: string[]) => void
  disabled?: boolean
}

export function ServiceMultiSelect({
  services,
  selectedServiceIds,
  onChange,
  disabled
}: ServiceMultiSelectProps) {
  const [open, setOpen] = useState(false)

  const toggleService = (serviceId: string) => {
    const newSelection = selectedServiceIds.includes(serviceId)
      ? selectedServiceIds.filter(id => id !== serviceId)
      : [...selectedServiceIds, serviceId]
    onChange(newSelection)
  }

  const removeService = (serviceId: string) => {
    onChange(selectedServiceIds.filter(id => id !== serviceId))
  }

  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id))

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedServiceIds.length === 0
              ? 'Selecionar serviços...'
              : `${selectedServiceIds.length} serviço(s) selecionado(s)`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar serviço..." />
            <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {services.map((service) => (
                <CommandItem
                  key={service.id}
                  value={service.name}
                  onSelect={() => toggleService(service.id)}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedServiceIds.includes(service.id) ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {service.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Services Badges */}
      {selectedServices.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedServices.map((service) => (
            <Badge key={service.id} variant="secondary" className="gap-1">
              {service.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeService(service.id)}
                  className="ml-1 hover:bg-muted rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
