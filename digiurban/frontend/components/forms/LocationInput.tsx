'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MapPin } from 'lucide-react'

// Importação dinâmica para evitar SSR
const LocationPicker = dynamic(
  () => import('@/components/map/LocationPicker').then((mod) => ({ default: mod.LocationPicker })),
  { ssr: false }
)

interface LocationInputProps {
  label?: string
  placeholder?: string
  value?: string
  coordinates?: { lat: number; lng: number } | null
  onChange?: (data: {
    address: string
    coordinates: { lat: number; lng: number } | null
  }) => void
  required?: boolean
  showMapButton?: boolean
  allowManualCoordinates?: boolean
}

/**
 * Componente de input de localização com suporte a:
 * - Digite de endereço manualmente
 * - Seleção visual no mapa (modal)
 * - Geocodificação automática
 */
export function LocationInput({
  label = 'Localização',
  placeholder = 'Digite o endereço ou clique no mapa',
  value = '',
  coordinates = null,
  onChange,
  required = false,
  showMapButton = true,
  allowManualCoordinates = false
}: LocationInputProps) {
  const [address, setAddress] = useState(value)
  const [coords, setCoords] = useState(coordinates)
  const [isMapOpen, setIsMapOpen] = useState(false)

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress)
    if (onChange) {
      onChange({ address: newAddress, coordinates: coords })
    }
  }

  const handleLocationFromMap = (location: { lat: number; lng: number; address?: string }) => {
    const newCoords = { lat: location.lat, lng: location.lng }
    const newAddress = location.address || address

    setCoords(newCoords)
    setAddress(newAddress)

    if (onChange) {
      onChange({ address: newAddress, coordinates: newCoords })
    }

    setIsMapOpen(false)
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={placeholder}
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            required={required}
          />
        </div>

        {showMapButton && (
          <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" className="shrink-0">
                <MapPin className="w-4 h-4 mr-2" />
                Mapa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Selecionar Localização</DialogTitle>
              </DialogHeader>
              <LocationPicker
                initialLocation={coords || undefined}
                onLocationChange={handleLocationFromMap}
                height="500px"
                placeholder={placeholder}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Mostrar coordenadas se disponíveis */}
      {coords && (
        <div className="text-xs text-gray-500">
          📍 Coordenadas: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
        </div>
      )}

      {/* Input manual de coordenadas (opcional) */}
      {allowManualCoordinates && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Latitude</Label>
            <Input
              type="number"
              step="any"
              placeholder="-15.7942"
              value={coords?.lat || ''}
              onChange={(e) => {
                const lat = parseFloat(e.target.value)
                if (!isNaN(lat)) {
                  const newCoords = { lat, lng: coords?.lng || 0 }
                  setCoords(newCoords)
                  if (onChange) {
                    onChange({ address, coordinates: newCoords })
                  }
                }
              }}
            />
          </div>
          <div>
            <Label className="text-xs">Longitude</Label>
            <Input
              type="number"
              step="any"
              placeholder="-47.8822"
              value={coords?.lng || ''}
              onChange={(e) => {
                const lng = parseFloat(e.target.value)
                if (!isNaN(lng)) {
                  const newCoords = { lat: coords?.lat || 0, lng }
                  setCoords(newCoords)
                  if (onChange) {
                    onChange({ address, coordinates: newCoords })
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
