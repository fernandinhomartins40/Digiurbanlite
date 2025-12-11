'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Check, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationPickerProps {
  value?: LocationData | null;
  onChange: (location: LocationData | null) => void;
  required?: boolean;
  serviceName?: string;
}

export function LocationPicker({ value, onChange, required, serviceName }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [hasLocation, setHasLocation] = useState(!!value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHasLocation(!!value);
  }, [value]);

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Seu navegador não suporta geolocalização');
      setError('Navegador não suporta geolocalização');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // TODO: Futuramente integrar com API de geocodificação reversa
        // para obter endereço a partir das coordenadas
        onChange(location);
        setHasLocation(true);
        setLoading(false);
        toast.success('Localização capturada com sucesso!');
      },
      (error) => {
        setLoading(false);
        let errorMessage = 'Não foi possível obter sua localização';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão negada. Por favor, habilite a localização no navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível. Tente novamente.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo esgotado ao obter localização. Tente novamente.';
            break;
        }

        console.error('Erro ao obter localização:', error);
        setError(errorMessage);
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleRemoveLocation = () => {
    onChange(null);
    setHasLocation(false);
    setError(null);
    toast.info('Localização removida');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900">
          Localização do Problema {required && <span className="text-red-500">*</span>}
        </label>
      </div>

      {!hasLocation ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleGetLocation}
            disabled={loading}
            className="w-full border-blue-300 hover:bg-blue-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Obtendo sua localização...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Usar Minha Localização Atual
              </>
            )}
          </Button>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          {required && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Este serviço requer localização específica</p>
                <p>
                  Informe onde o problema está ocorrendo para que possamos atendê-lo com precisão.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Localização definida
                </p>
                {value && (
                  <p className="text-xs text-green-700 mt-0.5">
                    Lat: {value.latitude.toFixed(6)}, Long: {value.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveLocation}
              className="text-red-600 hover:text-red-800 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-gray-600">
            💡 Sua localização será usada para identificar o local exato do problema
          </p>
        </div>
      )}

      {!required && !hasLocation && (
        <p className="text-xs text-gray-500">
          Opcional: Se preferir, você pode informar a localização do problema para um atendimento mais preciso
        </p>
      )}
    </div>
  );
}
