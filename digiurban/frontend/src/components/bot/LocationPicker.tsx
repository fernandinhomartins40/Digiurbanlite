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
      <div className="w-full min-w-0 max-w-full bg-white rounded-lg border border-blue-100 shadow-sm p-5 overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-teal-600" />
          <p className="text-gray-600">Obtendo sua localização...</p>
        </div>
      </div>
    );
  }

  if (mode === 'manual') {
    return (
      <div className="w-full min-w-0 max-w-full bg-white rounded-lg border border-blue-100 shadow-sm p-4 overflow-hidden">
        <div className="flex min-w-0 items-center gap-2 mb-4">
          <Edit3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Digite o endereço</h3>
        </div>

        <div className="space-y-3">
          <div className="grid min-w-0 grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Rua"
              value={formData.street}
              onChange={e => setFormData({ ...formData, street: e.target.value })}
              className="min-w-0 col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Nº"
              value={formData.number}
              onChange={e => setFormData({ ...formData, number: e.target.value })}
              className="min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <div className="grid min-w-0 grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Cidade"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="UF"
              maxLength={2}
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
              className="min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => setMode('select')}
            className="min-w-0 px-4 py-2 border border-blue-200 text-blue-800 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleManualSubmit}
            disabled={!formData.street || !formData.number || !formData.city}
            className="min-w-0 px-4 py-2 bg-gradient-to-r from-blue-700 to-teal-700 text-white rounded-lg hover:from-blue-800 hover:to-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full bg-white rounded-lg border border-blue-100 shadow-sm p-4 overflow-hidden">
      <div className="flex min-w-0 items-center gap-2 mb-4">
        <MapPin className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Selecione a localização</h3>
      </div>

      <div className="space-y-3">
        {allowCurrentLocation && (
          <button
            onClick={handleCurrentLocation}
            className="w-full min-w-0 flex items-center justify-center gap-3 px-3 py-4 border border-blue-600 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors overflow-hidden"
          >
            <Navigation className="w-5 h-5" />
            <span className="font-medium">Usar minha localização atual</span>
          </button>
        )}

        {allowManualAddress && (
          <button
            onClick={() => setMode('manual')}
            className="w-full min-w-0 flex items-center justify-center gap-3 px-3 py-4 border border-blue-200 text-blue-800 rounded-lg hover:bg-blue-50 transition-colors overflow-hidden"
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
