'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { MapPin, Camera, Home, Target } from 'lucide-react'

interface LocationConfigProps {
  formData: any
  onChange: (field: string, value: any) => void
}

export function LocationConfig({ formData, onChange }: LocationConfigProps) {
  const config = formData.locationConfig || {
    type: 'optional',
    hasGeofencing: false,
    centerLat: null,
    centerLng: null,
    allowedRadius: 5000,
    allowPhotos: false,
    maxPhotos: 3,
    requireAddress: false,
    description: '',
    helpText: '',
  }

  const updateConfig = (updates: any) => {
    onChange('locationConfig', { ...config, ...updates })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Tipo de Captura de Localização
          </CardTitle>
          <CardDescription>Defina como a localização será capturada</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={config.type} onValueChange={(value) => updateConfig({ type: value })}>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="required" id="loc-required" />
              <Label htmlFor="loc-required" className="cursor-pointer flex-1">
                <div>
                  <p className="font-medium">Obrigatória</p>
                  <p className="text-xs text-gray-500">O usuário deve fornecer a localização</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="optional" id="loc-optional" />
              <Label htmlFor="loc-optional" className="cursor-pointer flex-1">
                <div>
                  <p className="font-medium">Opcional</p>
                  <p className="text-xs text-gray-500">O usuário pode escolher fornecer a localização</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="auto" id="loc-auto" />
              <Label htmlFor="loc-auto" className="cursor-pointer flex-1">
                <div>
                  <p className="font-medium">Automática</p>
                  <p className="text-xs text-gray-500">Captura automaticamente ao abrir</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Geofencing (Validação de Área)
          </CardTitle>
          <CardDescription>Restrinja a localização a uma área específica</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasGeofencing"
              checked={config.hasGeofencing}
              onCheckedChange={(checked) => updateConfig({ hasGeofencing: checked })}
            />
            <Label htmlFor="hasGeofencing" className="cursor-pointer">
              Ativar geofencing
            </Label>
          </div>

          {config.hasGeofencing && (
            <div className="space-y-4 pl-6 border-l-2 border-green-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="centerLat" className="text-xs">Latitude Central</Label>
                  <Input
                    id="centerLat"
                    type="number"
                    step="0.000001"
                    value={config.centerLat || ''}
                    onChange={(e) => updateConfig({ centerLat: parseFloat(e.target.value) || null })}
                    placeholder="-23.550520"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="centerLng" className="text-xs">Longitude Central</Label>
                  <Input
                    id="centerLng"
                    type="number"
                    step="0.000001"
                    value={config.centerLng || ''}
                    onChange={(e) => updateConfig({ centerLng: parseFloat(e.target.value) || null })}
                    placeholder="-46.633308"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Raio Permitido: {config.allowedRadius} metros</Label>
                <Slider
                  value={[config.allowedRadius]}
                  onValueChange={([value]) => updateConfig({ allowedRadius: value })}
                  min={100}
                  max={10000}
                  step={100}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Área permitida: {(config.allowedRadius / 1000).toFixed(1)} km de raio
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Recursos Adicionais
          </CardTitle>
          <CardDescription>Configure captura de fotos e endereço</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="allowPhotos"
                checked={config.allowPhotos}
                onCheckedChange={(checked) => updateConfig({ allowPhotos: checked })}
              />
              <Label htmlFor="allowPhotos" className="cursor-pointer">
                <div>
                  <p className="font-medium text-sm">Permitir fotos do local</p>
                  <p className="text-xs text-gray-500">Usuário pode anexar fotos</p>
                </div>
              </Label>
            </div>
            {config.allowPhotos && (
              <div className="flex items-center gap-2">
                <Label className="text-xs">Máx:</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={config.maxPhotos}
                  onChange={(e) => updateConfig({ maxPhotos: parseInt(e.target.value) || 3 })}
                  className="w-16 h-8 text-xs text-center"
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Checkbox
              id="requireAddress"
              checked={config.requireAddress}
              onCheckedChange={(checked) => updateConfig({ requireAddress: checked })}
            />
            <Label htmlFor="requireAddress" className="cursor-pointer">
              <div>
                <p className="font-medium text-sm flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Exigir endereço completo
                </p>
                <p className="text-xs text-gray-500">Rua, número, bairro, cidade</p>
              </div>
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Textos de Interface</CardTitle>
          <CardDescription>Personalize as mensagens exibidas ao usuário</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="locationDesc" className="text-xs">Descrição</Label>
            <Input
              id="locationDesc"
              value={config.description}
              onChange={(e) => updateConfig({ description: e.target.value })}
              placeholder="Ex: Marque o local do buraco na rua"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationHelp" className="text-xs">Texto de Ajuda</Label>
            <Input
              id="locationHelp"
              value={config.helpText}
              onChange={(e) => updateConfig({ helpText: e.target.value })}
              placeholder="Instruções para o usuário"
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
