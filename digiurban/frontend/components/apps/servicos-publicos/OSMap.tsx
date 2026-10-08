'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GoogleMarkersMap from '@/components/maps/GoogleMarkersMap';
import { useMapsConfig } from '@/hooks/useMapsConfig';

interface OSPoint {
  id: string;
  numero: string;
  tipo: string;
  status: string;
  prioridade: string;
  bairro?: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
}

interface OSMapProps {
  pontos: OSPoint[];
}

const STATUS_COLOR: Record<string, string> = {
  ABERTA: '#ca8a04', // yellow-600
  DESPACHADA: '#2563eb', // blue-600
  EM_EXECUCAO: '#4f46e5', // indigo-600
  CONCLUIDA: '#16a34a', // green-600
  CANCELADA: '#6b7280', // gray-500
};

const PRIORIDADE_RAIO: Record<string, number> = {
  BAIXA: 7,
  NORMAL: 9,
  ALTA: 12,
  URGENTE: 15,
};

function MapBounds({ pontos }: { pontos: OSPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (pontos.length > 0) {
      const bounds = L.latLngBounds(
        pontos.map((p) => [p.latitude, p.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [pontos, map]);

  return null;
}

export function OSMap({ pontos }: OSMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { config } = useMapsConfig();

  // Evitar SSR do Leaflet
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="bg-gray-100 h-[600px] rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Carregando mapa...</p>
      </div>
    );
  }

  if (config.provider === 'google' && config.browserKey) {
    return (
      <div className="h-[600px] overflow-hidden rounded-lg">
        <GoogleMarkersMap
          apiKey={config.browserKey}
          mapId={config.mapId}
          points={pontos.map((p) => ({
            id: p.id,
            lat: p.latitude,
            lng: p.longitude,
            color: STATUS_COLOR[p.status] || '#6b7280',
            size: PRIORIDADE_RAIO[p.prioridade] || 9,
            strokeColor: STATUS_COLOR[p.status] || '#6b7280',
            strokeWeight: 2,
            title: `${p.numero} — ${p.tipo}`,
          }))}
          renderInfo={(id) => {
            const p = pontos.find((item) => item.id === id);
            if (!p) return null;
            return (
              <div className="text-sm text-gray-900">
                <div className="font-semibold">
                  {p.numero} — {p.tipo}
                </div>
                <div>Status: {p.status}</div>
                <div>Prioridade: {p.prioridade}</div>
                {p.bairro && <div>Bairro: {p.bairro}</div>}
                <div className="text-gray-500">Aberta em {new Date(p.createdAt).toLocaleDateString('pt-BR')}</div>
              </div>
            );
          }}
        />
      </div>
    );
  }

  return (
    <MapContainer
      center={[-15.78, -47.93]}
      zoom={12}
      style={{ height: '600px', width: '100%', borderRadius: '0.5rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBounds pontos={pontos} />
      {pontos.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.latitude, p.longitude]}
          radius={PRIORIDADE_RAIO[p.prioridade] || 9}
          pathOptions={{
            color: STATUS_COLOR[p.status] || '#6b7280',
            fillColor: STATUS_COLOR[p.status] || '#6b7280',
            fillOpacity: 0.55,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">
                {p.numero} — {p.tipo}
              </div>
              <div>Status: {p.status}</div>
              <div>Prioridade: {p.prioridade}</div>
              {p.bairro && <div>Bairro: {p.bairro}</div>}
              <div className="text-gray-500">
                Aberta em {new Date(p.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
