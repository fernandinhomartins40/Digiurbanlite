'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, MapPin, Navigation } from 'lucide-react'

// Fix para ícones do Leaflet no Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
  })
}

interface LocationPickerProps {
  initialLocation?: { lat: number; lng: number }
  onLocationChange?: (location: { lat: number; lng: number; address?: string }) => void
  height?: string
  label?: string
  placeholder?: string
  allowAddressInput?: boolean
  showCurrentLocation?: boolean
}

// Componente para centralizar mapa
function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, 13)
  }, [center, map])

  return null
}

// Componente para capturar cliques no mapa
function LocationMarker({
  position,
  onPositionChange
}: {
  position: [number, number] | null
  onPositionChange: (pos: [number, number]) => void
}) {
  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng])
    }
  })

  return position ? <Marker position={position} /> : null
}

export function LocationPicker({
  initialLocation,
  onLocationChange,
  height = '400px',
  label = 'Localização',
  placeholder = 'Digite o endereço ou clique no mapa',
  allowAddressInput = true,
  showCurrentLocation = true
}: LocationPickerProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [position, setPosition] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : null
  )
  const [address, setAddress] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [center, setCenter] = useState<[number, number]>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : [-15.7942, -47.8822]
  )

  // Evitar SSR do Leaflet
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Notificar mudanças de localização
  useEffect(() => {
    if (position && onLocationChange) {
      onLocationChange({
        lat: position[0],
        lng: position[1],
        address
      })
    }
  }, [position, address, onLocationChange])

  // Buscar localização atual do usuário com geocodificação reversa
  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsSearching(true)
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          setPosition(newPos)
          setCenter(newPos)

          // Geocodificar automaticamente a localização GPS
          await reverseGeocode(newPos[0], newPos[1])

          setIsSearching(false)
        },
        (error) => {
          console.error('Erro ao obter localização:', error)
          setIsSearching(false)
          alert('Não foi possível obter sua localização. Verifique as permissões do navegador.')
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } else {
      alert('Geolocalização não é suportada pelo seu navegador.')
    }
  }

  // Geocodificar endereço digitado
  const searchAddress = async () => {
    if (!address.trim()) return

    setIsSearching(true)
    try {
      // Usar Nominatim (OpenStreetMap) para geocodificação
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          address
        )}&format=json&limit=1&countrycodes=br`,
        {
          headers: {
            'User-Agent': 'DigiUrban/1.0'
          }
        }
      )

      const data = await response.json()

      if (data && data.length > 0) {
        const result = data[0]
        const newPos: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)]
        setPosition(newPos)
        setCenter(newPos)
        setAddress(result.display_name)
      } else {
        alert('Endereço não encontrado. Tente ser mais específico.')
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error)
      alert('Erro ao buscar endereço. Tente novamente.')
    } finally {
      setIsSearching(false)
    }
  }

  // Geocodificação reversa ao clicar no mapa (BigDataCloud + Nominatim fallback)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Opção 1: BigDataCloud - Gratuito, sem API key, ilimitado
      const bdcResponse = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`
      )

      if (bdcResponse.ok) {
        const data = await bdcResponse.json()

        // Montar endereço formatado
        const parts = [
          data.locality || data.city,
          data.principalSubdivision,
          data.countryName
        ].filter(Boolean)

        if (parts.length > 0) {
          setAddress(parts.join(', '))
          return
        }
      }
    } catch (error) {
      console.warn('BigDataCloud falhou, tentando Nominatim:', error)
    }

    try {
      // Fallback: Nominatim (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            'User-Agent': 'DigiUrban/1.0'
          }
        }
      )

      const data = await response.json()

      if (data && data.display_name) {
        setAddress(data.display_name)
      }
    } catch (error) {
      console.error('Erro ao fazer geocodificação reversa:', error)
    }
  }

  const handlePositionChange = (newPos: [number, number]) => {
    setPosition(newPos)
    reverseGeocode(newPos[0], newPos[1])
  }

  if (!isMounted) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div
          className="bg-gray-100 rounded-lg flex items-center justify-center"
          style={{ height }}
        >
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {/* Campo de busca de endereço */}
      {allowAddressInput && (
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={placeholder}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  searchAddress()
                }
              }}
            />
          </div>
          <Button
            type="button"
            onClick={searchAddress}
            disabled={isSearching}
            variant="secondary"
          >
            <Search className="w-4 h-4" />
          </Button>
          {showCurrentLocation && (
            <Button
              type="button"
              onClick={getCurrentLocation}
              disabled={isSearching}
              variant="secondary"
              title="Usar minha localização atual"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Coordenadas selecionadas */}
      {position && (
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>
            Coordenadas: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </span>
        </div>
      )}

      {/* Mapa */}
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapCenterController center={center} />
          <LocationMarker position={position} onPositionChange={handlePositionChange} />
        </MapContainer>
      </div>

      {/* Instruções */}
      <p className="text-xs text-gray-500">
        💡 Clique no mapa para marcar a localização exata ou busque por um endereço acima
      </p>
    </div>
  )
}
