'use client';

/**
 * ============================================================================
 * RecordsMap — plota registros do módulo Dados que têm coordenadas (campo GEO)
 * ============================================================================
 * Reusa react-leaflet (já no projeto). Só renderiza no cliente (Leaflet não
 * roda no SSR) — importar com dynamic({ ssr: false }). Ver PLANO UI-3.
 * ============================================================================
 */

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { queryRecords, type EntityType } from '@/services/registry.service';
import { Card, CardContent } from '@/components/ui/card';

// Ícone padrão do Leaflet (fix Next.js)
const icon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

interface Pin { id: string; lat: number; lng: number; label: string }

function parseGeo(raw: unknown): { lat: number; lng: number } | null {
  if (raw == null) return null;
  // Aceita "lat, long" | [lat, long] | { lat, lng }
  if (typeof raw === 'string') {
    const [a, b] = raw.split(',').map((s) => Number(s.trim()));
    return Number.isFinite(a) && Number.isFinite(b) ? { lat: a, lng: b } : null;
  }
  if (Array.isArray(raw) && raw.length >= 2) {
    const [a, b] = raw.map(Number);
    return Number.isFinite(a) && Number.isFinite(b) ? { lat: a, lng: b } : null;
  }
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const lat = Number(o.lat ?? o.latitude);
    const lng = Number(o.lng ?? o.long ?? o.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  return null;
}

export default function RecordsMap({ code, schema }: { code: string; schema: EntityType }) {
  const geoField = useMemo(() => (schema.fields ?? []).find((f) => f.dataType === 'GEO'), [schema]);
  const labelField = useMemo(() => (schema.fields ?? []).find((f) => f.displayInTable)?.key || (schema.fields ?? [])[0]?.key, [schema]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!geoField) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const res = await queryRecords({ entityType: code, pageSize: 200 });
        const list: Pin[] = [];
        for (const r of res.records as Array<{ id: string; data: Record<string, unknown> }>) {
          const geo = parseGeo(r.data[geoField.key]);
          if (geo) list.push({ id: r.id, lat: geo.lat, lng: geo.lng, label: labelField ? String(r.data[labelField] ?? '') : r.id });
        }
        setPins(list);
      } catch { setPins([]); } finally { setLoading(false); }
    })();
  }, [code, geoField, labelField]);

  if (!geoField) {
    return <Card><CardContent className="p-8 text-center text-muted-foreground">Este tipo de dado não tem campo de localização.</CardContent></Card>;
  }
  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando mapa…</div>;
  if (pins.length === 0) {
    return <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum registro com localização informada.</CardContent></Card>;
  }

  const center: [number, number] = [pins[0].lat, pins[0].lng];

  return (
    <Card>
      <CardContent className="p-0">
        <MapContainer center={center} zoom={12} style={{ height: 460, width: '100%', borderRadius: 8 }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pins.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
              <Popup>{p.label || 'Registro'}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
