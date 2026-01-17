'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Edit3 } from 'lucide-react';

interface LocationData {
  type: 'current' | 'manual';
  latitude?: number;
  longitude?: number;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  formattedAddress?: string;
}

interface LocationPickerProps {
  onSelect: (location: LocationData) => void;
  allowCurrentLocation?: boolean;
  allowManualAddress?: boolean;
}

export function LocationPicker({
  onSelect,
  allowCurrentLocation = true,
  allowManualAddress = true,
}: LocationPickerProps) {
  const [mode, setMode] = useState<'select' | 'manual' | 'loading'>('select');
  const [formData, setFormData] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const handleCurrentLocation = () => {
    setMode('loading');

    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador');
      setMode('select');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const location: LocationData = {
          type: 'current',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          formattedAddress: `Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`,
        };

        onSelect(location);
        setMode('select');
      },
      error => {
        alert('Erro ao obter localização: ' + error.message);
        setMode('select');
      }
    );
  };

  const handleManualSubmit = () => {
    const location: LocationData = {
      type: 'manual',
      address: formData,
      formattedAddress: `${formData.street}, ${formData.number}${formData.complement ? ' - ' + formData.complement : ''}, ${formData.neighborhood}, ${formData.city}/${formData.state}`,
    };

    onSelect(location);
  };

  if (mode === 'loading') {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-600">Obtendo sua localização...</p>
        </div>
      </div>
    );
  }

  if (mode === 'manual') {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Edit3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Digite o endereço</h3>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Rua"
              value={formData.street}
              onChange={e => setFormData({ ...formData, street: e.target.value })}
              className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Nº"
              value={formData.number}
              onChange={e => setFormData({ ...formData, number: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <input
            type="text"
            placeholder="Complemento (opcional)"
            value={formData.complement}
            onChange={e => setFormData({ ...formData, complement: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="text"
            placeholder="Bairro"
            value={formData.neighborhood}
            onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Cidade"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="UF"
              maxLength={2}
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <input
            type="text"
            placeholder="CEP"
            value={formData.zipCode}
            onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setMode('select')}
            className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleManualSubmit}
            disabled={!formData.street || !formData.number || !formData.city}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Selecione a localização</h3>
      </div>

      <div className="space-y-3">
        {allowCurrentLocation && (
          <button
            onClick={handleCurrentLocation}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Navigation className="w-5 h-5" />
            <span className="font-medium">Usar minha localização atual</span>
          </button>
        )}

        {allowManualAddress && (
          <button
            onClick={() => setMode('manual')}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Edit3 className="w-5 h-5" />
            <span className="font-medium">Digitar endereço manualmente</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default LocationPicker;
