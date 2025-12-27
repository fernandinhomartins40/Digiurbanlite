'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Check, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  isGPS?: boolean; // Indica se foi obtido via GPS (mais preciso)
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

  /**
   * Geocodificação reversa automática usando BigDataCloud (gratuito, sem API key)
   * Fallback para Nominatim se BigDataCloud falhar
   */
  const reverseGeocode = async (lat: number, lng: number): Promise<string | undefined> => {
    try {
      // Opção 1: BigDataCloud - Gratuito, sem API key, ilimitado
      const bdcResponse = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`
      );

      if (bdcResponse.ok) {
        const data = await bdcResponse.json();

        // Usar localityLanguage para obter nome da rua em português
        // BigDataCloud retorna informações hierárquicas em 'localityInfo'
        const streetName = data.localityInfo?.administrative?.find((item: any) =>
          item.adminLevel === 8 || item.description?.includes('road') || item.description?.includes('street')
        )?.name;

        const neighborhood = data.localityInfo?.administrative?.find((item: any) =>
          item.adminLevel === 7 || item.description?.includes('suburb') || item.description?.includes('neighbourhood')
        )?.name;

        // Montar endereço COMPLETO com rua, bairro, cidade e estado
        const parts = [
          streetName,
          neighborhood,
          data.locality || data.city,
          data.principalSubdivision
        ].filter(Boolean);

        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    } catch (error) {
      console.warn('BigDataCloud falhou, tentando Nominatim:', error);
    }

    try {
      // Fallback: Nominatim (OpenStreetMap) - Solicitar addressdetails
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'DigiUrban/1.0'
          }
        }
      );

      if (nominatimResponse.ok) {
        const data = await nominatimResponse.json();

        // Extrair componentes do endereço para montar manualmente
        const address = data.address || {};
        const parts = [
          address.road || address.street,
          address.house_number,
          address.suburb || address.neighbourhood,
          address.city || address.town || address.village,
          address.state
        ].filter(Boolean);

        if (parts.length > 0) {
          return parts.join(', ');
        }

        // Fallback: usar display_name se não conseguir extrair componentes
        return data.display_name;
      }
    } catch (error) {
      console.warn('Nominatim falhou:', error);
    }

    return undefined;
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Seu navegador não suporta geolocalização');
      setError('Navegador não suporta geolocalização');
      return;
    }

    setLoading(true);
    setError(null);

    // Tentar primeiro com alta precisão
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Geocodificação reversa automática
        const address = await reverseGeocode(lat, lng);

        const location: LocationData = {
          latitude: lat,
          longitude: lng,
          address,
          isGPS: true // Marcar como GPS para indicar alta precisão
        };

        onChange(location);
        setHasLocation(true);
        setLoading(false);

        if (address) {
          toast.success(`📍 Localização GPS capturada: ${address}`);
        } else {
          toast.success('📍 Localização GPS capturada com sucesso!');
        }
      },
      (error) => {
        console.warn('Erro com alta precisão, tentando modo rápido:', error);

        // Se falhar com alta precisão, tentar com baixa precisão (mais rápido)
        if (error.code === error.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;

              const address = await reverseGeocode(lat, lng);

              const location: LocationData = {
                latitude: lat,
                longitude: lng,
                address,
                isGPS: true // Marcar como GPS mesmo em modo rápido
              };

              onChange(location);
              setHasLocation(true);
              setLoading(false);

              toast.success(`📍 Localização GPS capturada (modo rápido)${address ? `: ${address}` : '!'}`);
            },
            (error2) => {
              setLoading(false);
              let errorMessage = 'Não foi possível obter sua localização';

              switch (error2.code) {
                case error2.PERMISSION_DENIED:
                  errorMessage = 'Permissão negada. Por favor, habilite a localização no navegador.';
                  break;
                case error2.POSITION_UNAVAILABLE:
                  errorMessage = 'Localização indisponível. Verifique se o GPS está ativado.';
                  break;
                case error2.TIMEOUT:
                  errorMessage = 'Não foi possível obter localização. Tente novamente ou digite o endereço manualmente.';
                  break;
              }

              console.error('Erro ao obter localização (segunda tentativa):', error2);
              setError(errorMessage);
              toast.error(errorMessage);
            },
            {
              enableHighAccuracy: false, // Modo rápido
              timeout: 15000,
              maximumAge: 60000 // Aceitar cache de até 1 minuto
            }
          );
        } else {
          setLoading(false);
          let errorMessage = 'Não foi possível obter sua localização';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permissão negada. Por favor, habilite a localização no navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Localização indisponível. Verifique se o GPS está ativado.';
              break;
            default:
              errorMessage = 'Erro ao obter localização. Tente novamente.';
          }

          console.error('Erro ao obter localização:', error);
          setError(errorMessage);
          toast.error(errorMessage);
        }
      },
      {
        enableHighAccuracy: true, // Tentar primeiro com alta precisão
        timeout: 20000, // Aumentado para 20 segundos
        maximumAge: 0 // Não aceitar cache na primeira tentativa
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
                <p className="font-medium mb-1">Este serviço requer localização GPS específica</p>
                <p>
                  Use o botão acima para capturar sua localização exata via GPS. Isso garante que a equipe chegue no local correto, incluindo o número da casa.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-green-900">
                    Localização definida
                  </p>
                  {value?.isGPS && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      GPS
                    </span>
                  )}
                </div>
                {value?.address && (
                  <p className="text-xs text-green-700 mt-1 line-clamp-2">
                    📍 {value.address}
                  </p>
                )}
                {value && (
                  <p className="text-xs text-green-600 mt-0.5 font-mono">
                    {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveLocation}
              className="text-red-600 hover:text-red-800 hover:bg-red-100 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-gray-600">
            💡 Localização GPS garante precisão exata no endereço e número
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
